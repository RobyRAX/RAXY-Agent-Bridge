# Calculator Web Implementation Plan

> **For agentic workers:** Implement the tasks below in order in this checkout. Do not create a branch or worktree. Do not create or run automated tests.

**Goal:** Create a usable basic calculator web app for testing the RAXY Agent Bridge handoff.

**Architecture:** A static `index.html` owns the accessible controls, `styles.css` owns responsive presentation, and `calculator.js` owns calculation state and event handling. No build step or dependencies.

**Tech Stack:** HTML, CSS, browser JavaScript.

**Spec:** `docs/superpowers/specs/2026-11-10-calculator-design.md`

## Global Constraints

- Work in this `calculator-web` folder and leave the parent bridge files unchanged.
- Do not create or run automated tests or run `dotnet build`.
- Write notes and code comments in English. Do not declare a class `sealed`.

## Review Focus

- Division by zero shows `Error`; a subsequent digit or clear resets the state.
- Repeated decimal input produces only one decimal point per entry.
- A fresh operator after a completed result continues from that result.
- Keyboard shortcuts work without double handling a focused button.
- Narrow screens retain usable buttons and readable display text.

---

### Task 1: Calculator screen and presentation

**Files:** Create `index.html` and `styles.css`.

**Interface:** Provide a display element with `id="display"`, a pending-operation element with `id="expression"`, and buttons with `data-action` values `digit`, `decimal`, `operator`, `equals`, `clear`, `sign`, `percent`, `backspace`. Digit and operator buttons also carry `data-value`.

- [ ] Create semantic HTML with all controls, an accessible display, and a stylesheet link.
- [ ] Add responsive CSS for phone and desktop widths, legible contrast, and visible keyboard focus.
- [ ] Inspect the page structure and confirm every specified control and data attribute exists.

### Task 2: Calculation behavior

**Files:** Create `calculator.js`; modify `index.html` to load it with `defer`.

**Interface:** Handle click and keydown events, update `#display` and `#expression`, and keep calculator state private to the script.

- [ ] Implement digit and decimal entry, clear, backspace, and sign toggle.
- [ ] Implement percent as current entry divided by 100, the four operators, equals, chained operations, and a new calculation after equals.
- [ ] Handle division by zero as `Error`, resetting on the next digit or clear.
- [ ] Format finite results with up to 10 fractional digits and no trailing zeros.
- [ ] Add keyboard mappings from the spec and prevent duplicate action when a focused button receives Enter.
- [ ] Inspect the implementation against the Review Focus cases. If a browser is available, manually try representative calculations and a narrow viewport. Do not run automated tests.

### Task 3: Usage note and handoff review

**Files:** Create `README.md`.

- [ ] Document opening `index.html`, supported controls and keyboard shortcuts, and the no-build setup.
- [ ] Review the workspace diff against the design and plan. Report any unverified behavior or remaining issue in the Antigravity handoff result.
