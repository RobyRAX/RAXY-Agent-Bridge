# Calculator Web Design

## Intent

Build a small, usable calculator in a new folder beside the RAXY Agent Bridge to exercise its plan-to-Antigravity handoff and Codex review loop.

## Approach

Use a static web application with plain HTML, CSS, and JavaScript. This keeps the handoff focused on a visible result and avoids installation or build setup. A framework would add dependencies without helping this small trial; a desktop application would add packaging and platform work.

## Behavior

- A single calculator screen shows the current entry and, when applicable, the pending operation.
- Support decimal numbers, addition, subtraction, multiplication, division, equals, clear, sign toggle, percent, and backspace.
- Button clicks and keyboard input work. Keyboard mappings: digits, decimal point, `+`, `-`, `*`, `/`, Enter or `=`, Backspace, and Escape.
- Division by zero displays `Error`; the next digit or clear starts a fresh calculation.
- Avoid duplicate decimal points, invalid leading zeros, and raw floating-point tails in displayed results. Show at most 10 fractional digits, trimming trailing zeros.
- Layout fits phone and desktop widths, with visible focus indication and accessible button labels.

## Constraints

- Target folder: `calculator-web` under the bridge directory. Keep bridge files unchanged.
- No dependencies, automated tests, or `dotnet build`. Verify by inspecting files and using a browser if available.
- Notes and code comments are in English. Do not declare any class `sealed`.

## Scope

This is a basic arithmetic calculator for the handoff trial. It does not include calculation history, scientific functions, persistence, accounts, or deployment.

## Builder decisions

The implementer may choose the visual palette and exact layout, provided the controls remain legible and responsive.
