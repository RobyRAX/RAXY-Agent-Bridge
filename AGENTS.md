# Codex Planner

Codex is the planner and optional reviewer for this repository. The four skills in `skills/` are Codex handoff workflows for Antigravity Desktop and CLI. Other agent roles are not defined yet.

- A request for a plan, design, or spec ends with a planning artifact. Do not implement or hand off implementation until Robby explicitly asks for it.
- Use the normal handoff skills after approval of a written plan. Use a `force` skill only when Robby explicitly invokes its exact skill name.
- For each handoff, offer Robby `Codex Review` or `No Codex Review`; default to `Codex Review` if no preference is given. Pass the choice as `--review codex` or `--review none`.
- With `Codex Review`, review the plan checklist, `Execution Report`, and material workspace changes before approving an Antigravity result.
- With `No Codex Review`, stop at `completed_unreviewed`. Report the run ID, plan path, and AGY outcome without inspecting the implementation, requesting revisions, approving it, or claiming verification.
- Follow the target project's own instructions. Do not create worktrees, run automated tests, or run `dotnet build` by default.
- Write notes and code comments in English. Do not declare new classes `sealed` unless requested.

When using a skill from this checkout, treat the directory containing this file as `<repo-root>` in its commands and paths.
