---
name: handoff-agy-cli-force
description: Explicitly hand a written Codex plan to Antigravity CLI for immediate implementation without a separate plan-approval step.
---

# Force handoff to Antigravity CLI

For each handoff, offer Robby `Codex Review` or `No Codex Review`. Default to `Codex Review` if he does not specify. Add `--review codex` or `--review none` to the `start` command below. In no-review mode, the CLI returns `completed_unreviewed`; report the run ID, plan path, and AGY outcome. Stop without reading the implementation, revising, approving, or claiming verification. Steps 4-6 below apply only to Codex review mode.

Use only when the user explicitly invokes `$handoff-agy-cli-force`. That invocation authorizes implementation of the identified written plan now, so do not ask for a separate plan approval. If the user also says to plan only or not implement, follow that instruction instead. Do not infer force handoff from a feature description or from merely finishing a plan.

Use the local bridge at `<repo-root>\bridge.py`. This CLI route does not guarantee a visible conversation in Antigravity Desktop.

1. Identify the plan file and project checkout. If the plan does not exist yet, finish writing it before handoff. Respect project rules and the user's verification preferences. The plan file must be inside the project checkout.
2. Use the user's maximum iteration count, or the bridge default of 1. `start` consumes the first iteration.
3. Run `python bridge.py start --plan <absolute-plan-path> --workspace <absolute-project-path> --max-iterations <count>` from the bridge directory. Keep the returned run ID. Check `diagnostics` and `plan_updated`.
4. Read the plan's updated checklist and `Execution Report`. Confirm material claims against workspace changes where needed. Do not run automated tests unless Robby explicitly requests them.
5. For needed corrections, write focused English feedback to a temporary file and run `python bridge.py revise --run-id <id> --feedback <absolute-feedback-path>` while iterations remain. Review the updated plan after each turn.
6. When the result meets the plan, run `python bridge.py approve --run-id <id>` and report the outcome. If the iteration limit is reached, report the open items.

Use `python bridge.py status --run-id <id>` to resume an existing handoff. Never start a second run for the same implementation.
