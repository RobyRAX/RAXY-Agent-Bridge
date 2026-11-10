---
name: handoff-agy-force
description: Explicitly hand a written Codex plan to Antigravity Desktop for immediate implementation without a separate plan-approval step.
---

# Force handoff to Antigravity Desktop

Use only when the user explicitly invokes `$handoff-agy-force`. That invocation authorizes immediate implementation of the identified written plan, so do not ask for separate plan approval. If the same request says to plan only or not implement, follow that instruction instead. Do not infer force handoff from a feature description or from merely finishing a plan.

Use `<repo-root>\desktop_handoff.py`. Do not use computer use or AGY CLI headless sessions. The Desktop RPC is an internal interface observed in Antigravity 44.9.1 and may change after updates.

1. Identify the plan file and project checkout. If no written plan exists yet, finish writing it before handoff. The plan must be inside the checkout. Respect project rules and Robby's verification preferences.
2. Use the user's maximum iteration count, or default to 3. Run `python desktop_handoff.py start --plan <absolute-plan-path> --workspace <absolute-checkout-path> --max-iterations <count>` from the bridge directory. Keep the returned run ID and conversation ID. The adapter verifies the project and workspace URI before sending and includes the Desktop default model.
3. Poll `python desktop_handoff.py status --run-id <id>` while status is `running`. Continue when it is `awaiting_review`. If the service fails or the conversation remains active unexpectedly, report that state; do not start a duplicate run.
4. Read the plan's updated checklist and `Execution Report`. If `plan_updated` is false or the report is missing, request a correction. Confirm material claims against workspace changes when needed. Do not run automated tests unless Robby explicitly requests them.
5. For corrections, write focused English feedback to a temporary file and run `python desktop_handoff.py revise --run-id <id> --feedback <absolute-feedback-path>` while iterations remain. It reuses the same Desktop conversation. Poll and review again.
6. Once the work meets the plan, run `python desktop_handoff.py approve --run-id <id>` and report the result. At the iteration limit, report open items.

Use `status --run-id <id>` to resume an existing handoff. Never start a second run for the same implementation. The plan checklist and report are the handoff record; bridge state is stored under `%LOCALAPPDATA%\RaxyAgentBridge\runs`.
