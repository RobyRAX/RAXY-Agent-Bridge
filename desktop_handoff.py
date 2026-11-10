"""Plan handoff lifecycle for Antigravity Desktop's local RPC service."""

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

from agy_desktop import DesktopClient, ensure_project, folder_uri, same_folder, send_message, start_chat
from bridge import load, plan_digest, plan_instructions, save


def verify_conversation(client, run):
    metadata = client.call("GetConversationMetadata", {"conversationId": run["conversation_id"]}).get("metadata", {})
    if metadata.get("projectId") != run["project_id"]:
        raise RuntimeError("Desktop conversation moved to a different project")
    uri = folder_uri(run["workspace"])
    if not any(same_folder({"folderUri": actual}, uri) for actual in metadata.get("workspaceUris", [])):
        raise RuntimeError("Desktop conversation is not bound to the expected workspace")


def refresh(client, run):
    if run["status"] != "running":
        return run
    verify_conversation(client, run)
    trajectory = client.call("GetCascadeTrajectory", {"cascadeId": run["conversation_id"]})
    run["agent_status"] = trajectory.get("status")
    run["num_steps"] = trajectory.get("numTotalSteps", 0)
    if run["agent_status"] == "CASCADE_RUN_STATUS_IDLE" and run["num_steps"] > 0:
        run["iterations"] += 1
        run["status"] = "awaiting_review"
        run["plan_updated"] = plan_digest(run) != run["plan_before"]
        run["updated_at"] = datetime.now(timezone.utc).isoformat()
        for step in reversed(trajectory.get("trajectory", {}).get("steps", [])):
            response = step.get("plannerResponse", {}).get("response")
            if response:
                run["last_result"] = response
                break
    save(run)
    return run


def main():
    parser = argparse.ArgumentParser(description="Handoff a Codex plan to Antigravity Desktop")
    parser.add_argument("--base-url", help="Override automatic Antigravity Desktop discovery")
    sub = parser.add_subparsers(dest="command", required=True)
    start = sub.add_parser("start")
    start.add_argument("--plan", required=True)
    start.add_argument("--workspace", required=True)
    start.add_argument("--max-iterations", type=int, default=1)
    for name in ("status", "approve"):
        sub.add_parser(name).add_argument("--run-id", required=True)
    revise = sub.add_parser("revise")
    revise.add_argument("--run-id", required=True)
    revise.add_argument("--feedback", required=True)
    args = parser.parse_args()
    client = DesktopClient(args.base_url)

    if args.command == "start":
        plan = Path(args.plan).resolve()
        workspace = Path(args.workspace).resolve()
        if not plan.is_file() or not workspace.is_dir() or not plan.is_relative_to(workspace):
            raise ValueError("Plan must be a file inside the workspace")
        if args.max_iterations < 1:
            raise ValueError("Maximum iterations must be at least 1")
        project, _ = ensure_project(client, workspace)
        run = {"id": str(uuid.uuid4()), "transport": "agy-desktop", "plan": str(plan),
               "workspace": str(workspace), "project_id": project["id"],
               "conversation_id": None, "max_iterations": args.max_iterations,
               "iterations": 0, "status": "starting", "plan_before": None,
               "created_at": datetime.now(timezone.utc).isoformat()}
        run["plan_before"] = plan_digest(run)
        prompt = ("Implement the approved plan only in this workspace: " + str(workspace) + ". "
                  "Follow its workspace rules. " + plan_instructions(run)
                  + plan.read_text(encoding="utf-8"))
        conversation_id, model = start_chat(client, project["id"], workspace, prompt)
        run["conversation_id"] = conversation_id
        run["model"] = model
        run["status"] = "running"
        save(run)
    else:
        run = load(args.run_id)
        if run.get("transport") != "agy-desktop":
            raise ValueError("Run is not an Antigravity Desktop handoff")
        run = refresh(client, run)
        if args.command == "revise":
            if run["status"] != "awaiting_review" or run["iterations"] >= run["max_iterations"]:
                raise ValueError("Run is not ready for revision or maximum iterations reached")
            feedback = Path(args.feedback).resolve()
            if not feedback.is_file():
                raise ValueError("Feedback must be a file")
            verify_conversation(client, run)
            run["plan_before"] = plan_digest(run)
            prompt = ("Codex requests these corrections in the same workspace. "
                      + plan_instructions(run) + feedback.read_text(encoding="utf-8"))
            send_message(client, run["conversation_id"], prompt, run.get("model"))
            run["status"] = "running"
            save(run)
        elif args.command == "approve":
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
