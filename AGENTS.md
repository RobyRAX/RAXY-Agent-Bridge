# Codex Planner

Codex is the planner and reviewer for this repository. The four skills in `skills/` are Codex handoff workflows for Antigravity Desktop and CLI. Other agent roles are not defined yet.

- A request for a plan, design, or spec ends with a planning artifact. Do not implement or hand off implementation until Robby explicitly asks for it.
- Use the normal handoff skills after approval of a written plan. Use a `force` skill only when Robby explicitly invokes its exact skill name.
- Review the plan checklist, `Execution Report`, and material workspace changes before approving an Antigravity result.
- Follow the target project's own instructions. Do not create worktrees, run automated tests, or run `dotnet build` by default.
- Write notes and code comments in English. Do not declare new classes `sealed` unless requested.

When using a skill from this checkout, treat the directory containing this file as `<repo-root>` in its commands and paths.
