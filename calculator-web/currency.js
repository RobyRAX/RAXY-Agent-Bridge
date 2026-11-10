/**
 * Currency Converter Web Application Module
 * Validates user input, communicates with the Frankfurter v2 API for reference rates,
 * handles same-currency calculations offline, formats output with Intl.NumberFormat,
 * and guards against race conditions and keyboard shortcut conflicts.
 */
(function () {
  'use strict';

  // Supported Currencies
  const SUPPORTED_CURRENCIES = ['USD', 'IDR', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD', 'CAD', 'CHF'];

  // DOM Elements
  let amountInput;
  let fromSelect;
  let toSelect;
  let swapBtn;
  let convertBtn;
  let statusElement;
  let converterSection;

  // Request State Management
  let currentRequestId = 0;
  let currentAbortController = null;

  /**
   * Escapes HTML special characters for safe markup insertion.
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Formats a numeric amount or rate using Intl.NumberFormat.
   * Accommodates small values without raw floating-point tails.
   */
  function formatNumber(value, isRate = false) {
    if (!Number.isFinite(value)) {
      return '';
    }

    const abs = Math.abs(value);
    let maxFraction = 2;

    if (abs > 0 && abs < 0.0001) {
      maxFraction = 8;
    } else if (abs > 0 && abs < 0.01) {
      maxFraction = 6;
    } else if (isRate || (value % 1 !== 0)) {
      maxFraction = 6;
    }

    const minFraction = (abs % 1 === 0 && !isRate) ? 0 : 2;

    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: Math.max(minFraction, maxFraction)
    }).format(value);
  }

  /**
   * Resets the status display to the initial placeholder state.
   */
  function resetStatusPlaceholder() {
    if (!statusElement) return;
    statusElement.removeAttribute('aria-busy');
    statusElement.innerHTML = '<p class="currency-status-placeholder">Click Convert to calculate reference rate.</p>';
  }

  /**
   * Cancels and invalidates any in-flight network request,
   * guaranteeing the Convert button is enabled and usable.
   */
  function abortInFlightRequest() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    currentRequestId++;
    if (convertBtn) {
      convertBtn.disabled = false;
    }
    if (statusElement) {
      statusElement.removeAttribute('aria-busy');
    }
  }

  /**
   * Displays an error message in the status region.
   */
  function showError(message) {
    if (!statusElement) return;
    statusElement.removeAttribute('aria-busy');
    statusElement.innerHTML = `<p class="currency-status-error">${escapeHtml(message)}</p>`;
  }

  /**
   * Displays a loading state in the status region.
   */
  function showLoading() {
    if (!statusElement) return;
    statusElement.setAttribute('aria-busy', 'true');
    statusElement.innerHTML = '<p class="currency-status-loading">Fetching reference exchange rate...</p>';
  }

  /**
   * Displays the successful conversion result and metadata.
   */
  function showSuccess({ amount, from, result, to, rate, date, isSameCurrency }) {
    if (!statusElement) return;
    statusElement.removeAttribute('aria-busy');

    const formattedAmount = formatNumber(amount);
    const formattedResult = formatNumber(result);
    const formattedRate = formatNumber(rate, true);

    let detailText;
    let dateText;
    let noteText;

    if (isSameCurrency) {
      detailText = `Rate: 1 ${from} = 1 ${to}`;
      dateText = 'Identical currency';
      noteText = 'Standard reference rate 1:1';
    } else {
      detailText = `Rate: 1 ${from} = ${formattedRate} ${to}`;
      dateText = `Rate date: ${date}`;
      noteText = 'Frankfurter published reference rate (not for trading)';
    }

    statusElement.innerHTML = `
      <p class="currency-status-result">${formattedAmount} ${from} = ${formattedResult} ${to}</p>
      <p class="currency-status-detail">${escapeHtml(detailText)} &bull; ${escapeHtml(dateText)}</p>
      <p class="currency-status-note">${escapeHtml(noteText)}</p>
    `;
  }

  /**
   * Swaps the 'from' and 'to' currency selections without mutating the amount.
   * Cancels any in-flight request and resets stale status display.
   */
  function handleSwap() {
    if (!fromSelect || !toSelect) return;
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;

    abortInFlightRequest();
    resetStatusPlaceholder();
  }

  /**
   * Validates input and executes currency conversion.
   */
  async function handleConvert() {
    if (!amountInput || !fromSelect || !toSelect || !statusElement || !convertBtn) {
      return;
    }

    // Cancel any previous in-flight request and ensure button is enabled
    abortInFlightRequest();

    const rawInput = amountInput.value.trim();
    if (rawInput === '') {
      showError('Please enter an amount to convert.');
      return;
    }

    const amount = Number(rawInput);
    if (!Number.isFinite(amount) || isNaN(amount)) {
      showError('Please enter a valid numeric amount.');
      return;
    }

    if (amount < 0) {
      showError('Amount cannot be negative. Please enter a non-negative number.');
      return;
    }

    const from = fromSelect.value;
    const to = toSelect.value;

    if (!SUPPORTED_CURRENCIES.includes(from) || !SUPPORTED_CURRENCIES.includes(to)) {
      showError('Selected currency is not supported.');
      return;
    }

    // Same currency: evaluate offline immediately with rate 1, avoiding network call
    if (from === to) {
      showSuccess({
        amount: amount,
        from: from,
        result: amount,
        to: to,
        rate: 1,
        date: new Date().toISOString().slice(0, 10),
        isSameCurrency: true
      });
      return;
    }

    // Initialize new online request; keep Convert clickable so new requests can supersede immediately
    const abortController = new AbortController();
    currentAbortController = abortController;
    const requestId = ++currentRequestId;

    showLoading();

    try {
      const url = `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`;
      const response = await fetch(url, { signal: abortController.signal });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      // Discard response if a newer request was dispatched or controls no longer match requested values
      const currentAmount = Number(amountInput.value.trim());
      if (
        requestId !== currentRequestId ||
        currentAmount !== amount ||
        fromSelect.value !== from ||
        toSelect.value !== to
      ) {
        return;
      }

      // Validate response shape and rate data integrity
      if (
        !data ||
        typeof data !== 'object' ||
        data.base !== from ||
        data.quote !== to ||
        typeof data.rate !== 'number' ||
        !Number.isFinite(data.rate) ||
        data.rate <= 0 ||
        typeof data.date !== 'string' ||
        !data.date.trim()
      ) {
        throw new Error('Received unexpected or invalid rate data from service.');
      }

      const result = amount * data.rate;

      showSuccess({
        amount: amount,
        from: from,
        result: result,
        to: to,
        rate: data.rate,
        date: data.date,
        isSameCurrency: false
      });
    } catch (error) {
      // Ignore cancellations from abort controller or superseded requests
      if (error.name === 'AbortError' || requestId !== currentRequestId) {
        return;
      }

      showError('Unable to fetch exchange rate. Please check your internet connection and try again.');
    } finally {
      if (requestId === currentRequestId) {
        if (statusElement) {
          statusElement.removeAttribute('aria-busy');
        }
        currentAbortController = null;
        if (convertBtn) {
          convertBtn.disabled = false;
        }
      }
    }
  }

  /**
   * Initializes DOM references, binds events, and configures keyboard isolation.
   */
  function initCurrencyConverter() {
    amountInput = document.getElementById('currency-amount');
    fromSelect = document.getElementById('currency-from');
    toSelect = document.getElementById('currency-to');
    swapBtn = document.getElementById('currency-swap');
    convertBtn = document.getElementById('currency-convert');
    statusElement = document.getElementById('currency-status');
    converterSection = document.querySelector('.currency-converter');

    if (swapBtn) {
      swapBtn.addEventListener('click', handleSwap);
    }

    if (convertBtn) {
      convertBtn.addEventListener('click', handleConvert);
    }

    // Invalidate in-flight requests and clear stale status when controls are edited
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        abortInFlightRequest();
        resetStatusPlaceholder();
      });
    }

    if (fromSelect) {
      fromSelect.addEventListener('change', () => {
        abortInFlightRequest();
        resetStatusPlaceholder();
      });
    }

    if (toSelect) {
      toSelect.addEventListener('change', () => {
        abortInFlightRequest();
        resetStatusPlaceholder();
      });
    }

    // Isolate converter keyboard events so they do not trigger global calculator shortcuts
    if (converterSection) {
      converterSection.addEventListener('keydown', (event) => {
        // Allow Tab for accessible keyboard navigation
        if (event.key === 'Tab') {
          return;
        }

        // Allow Enter in the amount field to trigger conversion directly
        if (event.key === 'Enter' && event.target === amountInput) {
          event.preventDefault();
          event.stopPropagation();
          handleConvert();
          return;
        }

        // Prevent typing digits, operators, backspace, clear, etc. from reaching calculator.js
        event.stopPropagation();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrencyConverter);
  } else {
    initCurrencyConverter();
  }
})();
