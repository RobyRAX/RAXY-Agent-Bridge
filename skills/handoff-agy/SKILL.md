---
name: handoff-agy
description: Hand an approved Codex implementation plan to Antigravity Desktop through its local RPC service, then review the updated plan and request bounded revisions.
---

# Handoff to Antigravity Desktop

For each handoff, offer Robby `Codex Review` or `No Codex Review`. Default to `Codex Review` if he does not specify. Add `--review codex` or `--review none` to the `start` command below. In no-review mode, poll until `completed_unreviewed`, then report the run ID, plan path, and AGY outcome. Stop without reading the implementation, revising, approving, or claiming verification. Steps 4-6 below apply only to Codex review mode.

Use after the user approves implementation of a written plan. This skill uses the local Desktop RPC adapter at `<repo-root>\desktop_handoff.py`. Do not use computer use. The Desktop RPC is an internal interface observed in Antigravity 44.9.1 and may change after updates.

1. Identify the approved plan file and project checkout. The plan must be inside that checkout. Respect project instructions and Robby's verification preferences. Do not hand off a planning-only request.
2. Use the user's maximum iteration count, or default to 1. Run `python desktop_handoff.py start --plan <absolute-plan-path> --workspace <absolute-checkout-path> --max-iterations <count>` from the bridge directory. Keep the returned run ID and conversation ID. The adapter verifies the project and workspace URI before sending the plan and includes the Desktop default model.
3. Poll `python desktop_handoff.py status --run-id <id>` while status is `running`. Stop polling when it is `awaiting_review`. If the service fails or the conversation remains active unexpectedly, report that state; do not start a duplicate run.
4. Read the plan's updated checklist and `Execution Report` first. If `plan_updated` is false or the report is missing, request a correction. Treat Antigravity's claims as assertions and inspect material workspace changes when needed. Do not run automated tests unless Robby explicitly requests them.
5. For corrections, write focused English feedback to a temporary file and run `python desktop_handoff.py revise --run-id <id> --feedback <absolute-feedback-path>` while iterations remain. It reuses the same Desktop conversation. Poll and review again.
6. Once the work meets the plan, run `python desktop_handoff.py approve --run-id <id>` and report the result. At the iteration limit, report open items.

The plan's checklist and report are the handoff record. The local bridge state is stored under `%LOCALAPPDATA%\RaxyAgentBridge\runs`. Do not use CLI headless sessions for this skill.
