---
name: handoff-agy-cli
description: Hand an approved Codex implementation plan to Antigravity CLI, then review its result and request bounded revisions.
---

# Handoff to Antigravity CLI

Use this skill after the user explicitly approves implementation of a written plan. The Codex chat remains the planner and reviewer. This skill uses the local bridge at `<repo-root>\bridge.py`; it does not create a visible Antigravity Desktop conversation.

1. Identify the approved plan file and project checkout. Respect the project's AGENTS.md and the user's verification preferences. Do not hand off planning-only requests.
2. Ask for a maximum iteration count only if the user did not provide one and the default of 3 is unsuitable. `start` consumes the first iteration.
3. Run `python bridge.py start --plan <absolute-plan-path> --workspace <absolute-project-path> --max-iterations <count>` from the bridge directory. Capture the returned run ID. Inspect `diagnostics` for denied permissions and `plan_updated` for whether the plan changed.
4. Read the updated plan checklist and its `Execution Report` section first. Treat checked boxes and report claims as Antigravity assertions, and inspect the relevant workspace changes when needed to confirm them. If `plan_updated` is false or the report is missing, request a correction. Use relevant compile/import feedback when available. Do not run automated tests unless Robby explicitly requests them.
5. If corrections are needed and iterations remain, write focused English feedback to a temporary file and run `python bridge.py revise --run-id <id> --feedback <absolute-feedback-path>`. Repeat review. At the limit, report remaining issues to the user.
6. Once the implementation meets the plan, run `python bridge.py approve --run-id <id>` and report what changed and what was verified.

Use `python bridge.py status --run-id <id>` to inspect an existing handoff. Do not invoke `start` twice for the same implementation; resume with the stored run ID. The bridge records state under the local application data directory.

