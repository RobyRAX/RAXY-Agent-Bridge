"""Local Codex-to-Antigravity handoff runner."""

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path


def state_root():
    base = os.environ.get("LOCALAPPDATA") or str(Path.home() / ".local" / "share")
    return Path(base) / "RaxyAgentBridge" / "runs"


def save(run):
    root = state_root()
    root.mkdir(parents=True, exist_ok=True)
    path = root / (run["id"] + ".json")
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(run, indent=2, ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)


def load(run_id):
    try:
        uuid.UUID(run_id)
    except ValueError as exc:
        raise ValueError("Invalid run ID") from exc
    path = state_root() / (run_id + ".json")
    if not path.is_file():
        raise ValueError("Run not found")
    return json.loads(path.read_text(encoding="utf-8"))


def plan_digest(run):
    return hashlib.sha256(Path(run["plan"]).read_bytes()).hexdigest()


def plan_instructions(run):
    closing = ("Your final response may be brief because Codex will review the plan file."
               if run.get("review", "codex") == "codex" else
               "Your final response should summarize the outcome for Robby because Codex will not review the result.")
    return (f"The authoritative plan file is {run['plan']}. Edit this file as you work. "
            "Mark a checklist item [x] only after its work is complete; leave incomplete items [ ] and explain why. "
            "Keep the existing plan and spec requirements intact. Add or update a '## Execution Report' section "
            "at the end of the plan with concise English notes on changed files, verification actually performed, "
            "remaining issues, and any checklist items left open. Do not claim verification you did not perform. "
            "Save the plan before ending your turn. " + closing + "\n\n")


def invoke_agy(run, prompt):
    executable = shutil.which("agy")
    if not executable:
        raise RuntimeError("Antigravity CLI (agy) was not found on PATH")
    command = [executable, "--print", prompt, "--output-format", "json"]
    if run.get("conversation_id"):
        command += ["--conversation", run["conversation_id"]]
    try:
        result = subprocess.run(command, cwd=run["workspace"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    except OSError as exc:
        raise RuntimeError(f"Could not start Antigravity CLI: {exc}") from exc
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Antigravity returned invalid JSON (exit {result.returncode}): {result.stderr.strip()}") from exc
    if result.returncode or payload.get("status") != "SUCCESS":
        raise RuntimeError(payload.get("error") or result.stderr.strip() or f"Antigravity failed (exit {result.returncode})")
    if not payload.get("conversation_id"):
        raise RuntimeError("Antigravity did not return a conversation ID")
    return payload, result.stderr.strip()


def run_turn(run, prompt):
    if run["status"] not in ("ready", "awaiting_review"):
        raise ValueError(f"Run cannot continue from status {run['status']}")
    if run["iterations"] >= run["max_iterations"]:
        raise ValueError("Maximum iterations reached")
    run["status"] = "running"
    save(run)
    before = plan_digest(run)
    try:
        result, diagnostics = invoke_agy(run, prompt)
    except Exception:
        run["status"] = "ready" if run["iterations"] == 0 else "awaiting_review"
        save(run)
        raise
    run["conversation_id"] = result["conversation_id"]
    run["iterations"] += 1
    run["status"] = "awaiting_review" if run.get("review", "codex") == "codex" else "completed_unreviewed"
    run["updated_at"] = datetime.now(timezone.utc).isoformat()
    run["last_result"] = result.get("response", "")
    run["diagnostics"] = diagnostics
    run["plan_updated"] = plan_digest(run) != before
    save(run)
    return run


def main():
    parser = argparse.ArgumentParser(description="Handoff a Codex plan to Antigravity CLI")
    sub = parser.add_subparsers(dest="command", required=True)
    start = sub.add_parser("start")
    start.add_argument("--plan", required=True)
    start.add_argument("--workspace", required=True)
    start.add_argument("--max-iterations", type=int, default=1)
    start.add_argument("--review", choices=("codex", "none"), default="codex")
    revise = sub.add_parser("revise")
    revise.add_argument("--run-id", required=True)
    revise.add_argument("--feedback", required=True)
    approve = sub.add_parser("approve")
    approve.add_argument("--run-id", required=True)
    status = sub.add_parser("status")
    status.add_argument("--run-id", required=True)
    args = parser.parse_args()

    if args.command == "start":
        plan = Path(args.plan).resolve()
        workspace = Path(args.workspace).resolve()
        if not plan.is_file() or not workspace.is_dir():
            raise ValueError("Plan must be a file and workspace must be a directory")
        if not plan.is_relative_to(workspace):
            raise ValueError("Plan must be inside the Antigravity workspace so it can be updated")
        if args.max_iterations < 1:
            raise ValueError("Maximum iterations must be at least 1")
        run = {"id": str(uuid.uuid4()), "plan": str(plan), "workspace": str(workspace),
               "max_iterations": args.max_iterations, "iterations": 0, "status": "ready", "review": args.review,
               "conversation_id": None, "created_at": datetime.now(timezone.utc).isoformat()}
        save(run)
        prompt = ("Implement the approved plan below in this workspace. Follow its instructions and workspace rules. "
                  + plan_instructions(run)
                  + plan.read_text(encoding="utf-8"))
        run = run_turn(run, prompt)
    else:
        run = load(args.run_id)
        if args.command == "revise":
            if run.get("review", "codex") != "codex":
                raise ValueError("An unreviewed run cannot be revised by Codex")
            feedback = Path(args.feedback).resolve()
            if not feedback.is_file():
                raise ValueError("Feedback must be a file")
            prompt = ("Codex reviewed your implementation and requests these corrections. "
                      "Address them in the same workspace. " + plan_instructions(run)
                      + feedback.read_text(encoding="utf-8"))
            run = run_turn(run, prompt)
        elif args.command == "approve":
            if run.get("review", "codex") != "codex":
                raise ValueError("An unreviewed run cannot be approved by Codex")
            if run["status"] != "awaiting_review":
                raise ValueError("Only a run awaiting review can be approved")
            run["status"] = "approved"
            save(run)
    print(json.dumps(run, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, OSError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
