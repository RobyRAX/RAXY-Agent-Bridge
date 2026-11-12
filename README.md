# RAXY Agent Bridge

Local handoff from a Codex planning chat to Antigravity CLI. Codex stays the planner and reviewer. The bridge runs one Antigravity turn at a time, stores its conversation ID, and asks Antigravity to update the plan checklist and an `Execution Report` section in that same plan. This CLI path does not guarantee that the conversation appears in Antigravity Desktop.

## Codex Planner skills

The four Codex handoff skills are versioned in [`skills/`](skills/): `handoff-agy`, `handoff-agy-cli`, `handoff-agy-force`, and `handoff-agy-cli-force`. Desktop and CLI are separate handoff routes; each `force` variant requires explicit invocation. [`AGENTS.md`](AGENTS.md) defines the Planner role for this repo. Roles and skills for other agents will be added later.

To use these skills from this checkout, copy or link each skill folder into your Codex skills directory. In each skill, `<repo-root>` means this checkout's absolute path. `calculator-web/` is a sample project, not part of the bridge runtime.

## Requirements

- Python 3.10 or newer
- `agy` on PATH, authenticated for headless use
- A written implementation plan located inside the local workspace. The normal `handoff-agy-cli` skill waits for approval; explicitly invoking `handoff-agy-cli-force` authorizes immediate handoff.

## Commands

Before every normal or force handoff, Codex asks Robby to choose `Codex Review` or `No Codex Review` unless he already chose for that handoff. Both CLI and Desktop `start` require `--review codex` or `--review none`; there is no default. In no-review mode, AGY's first completed turn receives status `completed_unreviewed`. Codex reports the run ID, plan path, and AGY outcome without reviewing or approving the work. `revise` and `approve` reject no-review runs. The choice cannot change during a run; existing runs without a stored choice use Codex review.

```powershell
python bridge.py start --plan C:\path\plan.md --workspace C:\path\project --max-iterations 1 --review codex
python bridge.py revise --run-id RUN_ID --feedback C:\path\feedback.md
python bridge.py approve --run-id RUN_ID
python bridge.py status --run-id RUN_ID
```

The default limit is 1 iteration when `--max-iterations` is omitted. Each `start` or `revise` call consumes one iteration and returns JSON. `plan_updated` indicates whether Antigravity changed the plan during that turn. Codex reads the updated checklist and report, checks any claims that need verification, then approves or creates feedback for another turn. At the iteration limit, further `revise` calls fail. Run records are kept under `%LOCALAPPDATA%\RaxyAgentBridge\runs` on Windows.

Antigravity headless mode may deny actions that require interactive permission while still reporting a successful turn. Review the returned `diagnostics` and workspace changes before approving. Configure scoped Antigravity permissions separately if needed.

## Experimental Desktop RPC

`agy_desktop.py` talks to the local service used by Antigravity Desktop. It can reuse or create a project for a local folder and start a conversation without UI automation:

```powershell
python agy_desktop.py start --workspace C:\path\project --message "Pelajari project ini"
python agy_desktop.py status --conversation-id CONVERSATION_ID
```

The adapter reads the app's default model, sends it with the message, and verifies both project ID and workspace URI before sending. This is an internal Antigravity interface observed in Desktop 44.9.1, so it may change after an app update. On Windows, the bridge discovers the local port from Antigravity's running language server and checks the RPC before using it. Use `--base-url` to override discovery.

## Desktop plan handoff

The `handoff-agy` Codex skill uses `desktop_handoff.py` for a reviewed plan workflow without computer use:

```powershell
python desktop_handoff.py start --plan C:\path\project\plan.md --workspace C:\path\project --max-iterations 1 --review codex
python desktop_handoff.py status --run-id RUN_ID
python desktop_handoff.py revise --run-id RUN_ID --feedback C:\path\feedback.md
python desktop_handoff.py approve --run-id RUN_ID
```

Poll `status` until `awaiting_review`, then read the plan checklist and its `Execution Report`. `revise` uses the same Desktop conversation. The bridge verifies the conversation's project and workspace URI before revisions and enforces the maximum number of turns. The normal `handoff-agy` skill requires plan approval before the initial handoff. Explicitly invoking `handoff-agy-force` authorizes immediate handoff without a separate approval step.

