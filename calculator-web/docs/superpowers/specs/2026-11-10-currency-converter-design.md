# Currency Converter Design

## Intent

Add a simple currency converter to the existing calculator so a person can enter an amount, pick two currencies, and see a conversion using a published reference rate.

## Approach

Keep the arithmetic calculator and theme selector intact. Add a separate converter panel beneath the keypad, with its own JavaScript module and no build dependencies. Request the latest pair rate from Frankfurter v2 (`https://api.frankfurter.dev/v2/rate/{base}/{quote}`), whose browser API supports CORS and does not need a key. The service publishes reference rates periodically; it is not a transaction quote.

## Behavior

- Provide amount input, From and To selectors, a Swap button, and a Convert button. Default USD to IDR, amount 1.
- Support USD, IDR, EUR, GBP, JPY, SGD, AUD, CAD, and CHF. Currency codes are fixed to avoid malformed requests.
- On Convert, validate a finite nonnegative amount. Empty, negative, or invalid input displays a helpful message and makes no request.
- For identical currencies, show the same amount with rate 1 without a network request.
- For different currencies, fetch the latest rate, check HTTP success and response shape, multiply amount by the rate, and display a human-readable result, pair rate, and the API's rate date.
- Show a loading state while fetching, and a retryable error on network or API failure. Prevent stale responses from overwriting a newer conversion.
- Swap exchanges the selected currencies; it does not silently replace the amount.
- Switching themes or doing arithmetic does not reset converter values. The converter uses the current theme variables and works at phone widths.
- Label all controls and announce result or error updates accessibly.

## Constraints

- Work directly in `calculator-web`, without a branch or worktree. Keep parent bridge files unchanged.
- No API key, new dependencies, automated tests, or `dotnet build`.
- Notes and code comments are in English. Do not declare a class `sealed`.

## Source

Frankfurter official browser documentation: https://frankfurter.dev/javascript/
