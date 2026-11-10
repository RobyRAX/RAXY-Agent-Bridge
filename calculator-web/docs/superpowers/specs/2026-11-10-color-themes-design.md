# Calculator Color Themes Design

## Intent

Let a person change the calculator's colors to a preferred preset while using the existing web app. This is a focused follow-up for the force-handoff trial.

## Approach

Add a compact theme selector above the display. Offer four named presets: Slate (current default), Light, Ocean, and Sunset. Define each theme by overriding existing CSS custom properties under a `data-theme` attribute on the document root. Store the selected theme in `localStorage`; on reload, restore a valid saved theme or fall back to Slate. If storage is unavailable, the selector must still work for the current page.

## Behavior and scope

- Theme changes apply immediately to the page background, card, display, buttons, text, and focus treatment.
- The selector has a visible label and remains usable with keyboard and on narrow screens.
- Themes retain readable text and visible focus outlines.
- Switching themes does not clear or alter calculation state.
- No custom color editor, account sync, dependencies, or changes to arithmetic behavior.

## Constraints

- Work directly in `calculator-web`, without a branch or worktree. Keep parent bridge files unchanged.
- Do not create, modify, or run automated tests; do not run `dotnet build`.
- Notes and code comments are in English. Do not declare a class `sealed`.
