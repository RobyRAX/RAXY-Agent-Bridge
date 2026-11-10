# Calculator Web

A basic, responsive, and accessible web calculator built with plain HTML, CSS, and JavaScript. Created for testing the RAXY Agent Bridge plan-to-Antigravity handoff and review loop.

## Overview

- **Zero Dependencies / No Build Step**: Open `index.html` directly in any modern browser.
- **Accessible & Responsive**: Supports desktop and mobile viewport widths down to narrow mobile screens (<=360px), keyboard navigation, screen reader live regions, and high-contrast visible focus indicators.
- **Color Themes & Persistence**: Four selectable color themes (Slate, Light, Ocean, Sunset) with automatic `localStorage` persistence and resilient fallback.
- **Currency Converter**: Built-in converter powered by Frankfurter v2 reference rates supporting 9 major currencies with offline same-currency conversion and accessible status announcements.
- **Robust Arithmetic & Formatting**: Handles addition, subtraction, multiplication, division, percentage, sign toggling, chained calculations, and division-by-zero handling (`Error`), formatting results with up to 10 decimal digits without trailing zeros or raw floating-point tails.

## How to Run

Simply open `index.html` in your web browser:
- Double-click `index.html` in Windows Explorer, or
- Drag and drop `index.html` into any browser window, or
- Run via terminal (PowerShell):
  ```powershell
  Start-Process index.html
  ```

No web server, bundler, or build tool is needed.

## Controls & Interfaces

### Color Themes

The calculator includes four color themes:
- **Slate** (default): Dark slate styling with deep navy backgrounds and slate-gray keypad buttons.
- **Light**: High-contrast light palette with crisp neutral borders and vibrant accents.
- **Ocean**: Deep marine blue palette with aquatic cyan accents.
- **Sunset**: Rich dusk plum background with warm coral and sunset orange accents.

#### Changing and Restoring Themes
- **Selecting a theme**: Choose any theme from the dropdown selector located directly above the calculator display. Changes apply immediately to background, card, display, buttons, text, and focus indicators.
- **Restoration**: The selection is saved to browser `localStorage` under `calculator-theme`. On subsequent visits or reloads, the saved theme is restored automatically.
- **Fallback**: If `localStorage` is inaccessible (e.g. storage disabled, private browsing restrictions) or contains an unrecognized value, the theme safely falls back to Slate while allowing in-session theme switching.

### Keypad Buttons
- **Digits (`0` - `9`)**: Enters numeric digits. Invalid leading zeros are avoided.
- **Decimal point (`.`)**: Appends decimal point (at most one decimal point per entry).
- **Operators (`+`, `−`, `×`, `÷`)**: Performs arithmetic operations; chaining operators automatically resolves the pending operation.
- **Equals (`=`)**: Evaluates the pending operation and shows the result in `#display` while displaying the complete expression in `#expression`.
- **Clear (`C`)**: Clears the current calculation, expression, and error state.
- **Backspace (`⌫`)**: Deletes the most recent digit from the current entry.
- **Sign toggle (`±`)**: Inverts the sign of the current entry or result.
- **Percent (`%`)**: Divides the current entry by 100.

### Supported Keyboard Shortcuts

| Key | Calculator Action | Description |
| :--- | :--- | :--- |
| `0` - `9` | Digits | Enters number digits |
| `.` or `,` | Decimal point | Enters single decimal separator |
| `+`, `-`, `*`, `/` | Operators | Sets pending arithmetic operator |
| `Enter` or `=` | Equals | Calculates result (or triggers focused button when navigating via Tab) |
| `Backspace` | Backspace | Deletes last typed digit |
| `Escape`, `c`, `C` | Clear | Resets calculator state |
| `%` | Percent | Computes percentage |
| `Space` | Activate button | Standard button activation when a button is focused |

### Focus & Shortcut Behavior

Keyboard shortcut events call `event.preventDefault()` to prevent default browser interactions (such as unintended page scrolling or duplicate click synthesis when a focused button receives `Enter`). Mouse clicks automatically blur the clicked button to avoid lingering focus interfering with subsequent keyboard shortcuts.

### Currency Converter

A dedicated currency converter is located beneath the calculator keypad:
- **Controls**:
  - **Amount**: Input field accepting finite non-negative numbers (defaults to `1`). Pressing `Enter` while focused inside this field triggers conversion.
  - **From & To Selectors**: Nine supported currencies: `USD`, `IDR`, `EUR`, `GBP`, `JPY`, `SGD`, `AUD`, `CAD`, and `CHF`. Defaults to `USD` &rarr; `IDR`.
  - **Swap (`⇄`)**: Swaps the selected currencies without altering the entered amount.
  - **Convert**: Validates input and calculates the conversion.
- **Reference-Rate Source & Date**:
  - Exchange rates are fetched from the public [Frankfurter v2 API](https://api.frankfurter.dev/v2/rate/{base}/{quote}) (`https://api.frankfurter.dev/v2/rate/{base}/{quote}`), requiring zero API keys or external dependencies.
  - Rates are published reference rates rather than real-time trading quotes. The API rate date is clearly displayed alongside each conversion result.
- **Same-Currency Offline Support**:
  - Converting between identical currencies (e.g. `USD` to `USD`) uses a 1:1 rate and executes immediately offline without network access.
- **Internet Requirement & Retry Handling**:
  - Converting between different currencies requires active internet connectivity.
  - On network disconnection or API failure, a clear error message is announced in the live status region, and all controls remain interactive and enabled for immediate retry.
- **Keyboard Isolation & Race Condition Guarding**:
  - Typing or navigating within converter controls is isolated so it does not trigger global calculator keyboard shortcuts.
  - Rapid sequential conversions are coordinated via `AbortController` and sequential request identifiers; clicking Convert immediately supersedes any pending request without locking the button.
  - Modifying the amount, changing selectors, or clicking Swap invalidates any in-flight fetch and clears stale output so late responses never display values for mismatched controls.

## Files

- `index.html`: Accessible semantic HTML structure with theme controls, screen elements (`#display`, `#expression`), keypad controls, and currency converter interface.
- `styles.css`: CSS custom properties for all themes (`slate`, `light`, `ocean`, `sunset`), responsive layout, focus indicators, and converter component styling.
- `theme.js`: Theme selection management, DOM dataset updates, keyboard containment, and resilient `localStorage` persistence.
- `calculator.js`: Private calculation state engine, event listeners, arithmetic evaluation, and edge-case handling.
- `currency.js`: Currency conversion logic, input validation, Frankfurter v2 API integration, rate date display, same-currency offline calculation, and race condition / shortcut isolation.
- `README.md`: Usage notes, controls documentation, and architecture summary.
