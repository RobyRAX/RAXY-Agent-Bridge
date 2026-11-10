# Calculator Color Themes Implementation Plan

> **For agentic workers:** Implement this plan in the current checkout. Update this checklist and append an `Execution Report` with changed files, verification performed, and remaining issues. Do not create a branch or worktree. Do not create, modify, or run automated tests.

**Goal:** Add four selectable, persistent calculator color themes.

**Architecture:** A native `<select>` in `index.html` chooses a theme. `theme.js` validates and applies the selection, and `styles.css` overrides its existing color variables for each theme. The calculator arithmetic script remains unchanged.

**Tech Stack:** HTML, CSS, browser JavaScript, `localStorage`.

**Spec:** `docs/superpowers/specs/2026-11-10-color-themes-design.md`

## Global Constraints

- Work in `calculator-web`; leave parent bridge files unchanged.
- Do not create, modify, or run automated tests or run `dotnet build`.
- Write notes and code comments in English. Do not declare a class `sealed`.

## Review Focus

- Invalid or missing stored theme falls back to Slate.
- Storage access failures do not prevent changing theme for the current page.
- Theme switching preserves the current calculation.
- Label, select, and focus indicator remain usable at narrow widths.

---

### Task 1: Theme control and palettes

**Files:** Modify `index.html` and `styles.css`.

- [x] Add a labeled native select with `id="theme-select"` before the calculator display and options `slate`, `light`, `ocean`, `sunset`; load `theme.js` with `defer`.
- [x] Style the theme control for desktop and narrow screens, using the current color variables.
- [x] Add `[data-theme="light"]`, `[data-theme="ocean"]`, and `[data-theme="sunset"]` variable overrides for all existing color variables, including hover, active, text, and focus colors. Slate retains the current `:root` values.
- [x] Inspect selectors and variable coverage against the design.

### Task 2: Theme selection and persistence

**Files:** Create `theme.js`.

- [x] Read `calculator-theme` from `localStorage` inside `try/catch`; accept only the four option values.
- [x] Set `document.documentElement.dataset.theme` and synchronize the select on initial load and on `change`.
- [x] Persist selection with `localStorage.setItem` inside `try/catch`; keep the current page theme applied if storage fails.
- [x] Inspect the logic for invalid values and storage failures. Do not run automated tests.

### Task 3: Documentation and handoff report

**Files:** Modify `README.md` and this plan.

- [x] Document how to change themes and how the preference is restored.
- [x] Mark completed plan items and append an `Execution Report` describing changed files, verification performed, and any remaining issues.

## Execution Report

### Changed Files
- `index.html`: Added `<script src="theme.js" defer></script>` and the native `<select id="theme-select">` with `<label for="theme-select">` inside a `.theme-control` container immediately preceding the calculator display.
- `styles.css`: Added theme overrides for `[data-theme="light"]`, `[data-theme="ocean"]`, and `[data-theme="sunset"]` (retaining Slate defaults on `:root, [data-theme="slate"]`) covering all 25 custom properties. Added styles for `.theme-control`, `.theme-label`, `.theme-select`, and responsive media query rules down to <=360px viewports.
- `theme.js`: Created standalone theme module with `try/catch` guarded `localStorage` read and write, strict validation against permitted values (`slate`, `light`, `ocean`, `sunset`) falling back to `'slate'`, DOM `data-theme` synchronization, and keydown event containment preventing calculator shortcuts from firing during theme selection.
- `README.md`: Documented the color theme presets, selection procedure, `localStorage` persistence, and fallback behavior, updating the feature overview and files listing.
- `docs/superpowers/plans/2026-11-10-color-themes.md`: Updated all plan checklists to complete and added this execution report.

### Verification Actually Performed
- JavaScript syntax check: Executed `node --check theme.js`, which passed cleanly with code 0.
- CSS variable inspection: Verified all 25 custom properties (backgrounds, borders, text colors, button states, focus ring, and card shadow) are defined across `:root, [data-theme="slate"]`, `[data-theme="light"]`, `[data-theme="ocean"]`, and `[data-theme="sunset"]`.
- Fallback & resilience inspection: Confirmed `getStoredTheme()` returns `'slate'` for missing, invalid, or throwing `localStorage` calls, and `saveTheme()` catches exceptions without blocking page theme application.
- State preservation inspection: Confirmed theme changes modify only CSS custom properties on the root element, preserving arithmetic calculation state and preventing input interference via select keydown propagation containment.
- Constraint adherence: Confirmed no automated tests were created or executed and no `dotnet build` was invoked.

### Remaining Issues
- None.

### Checklist Items Left Open
- None. All items completed.
