/**
 * Calculator Web Application
 * Handles arithmetic calculation state, UI updates, and accessible keyboard/mouse events.
 */
(function () {
  'use strict';

  // DOM Elements
  const displayElement = document.getElementById('display');
  const expressionElement = document.getElementById('expression');
  const keypad = document.querySelector('.calculator-keypad');

  // Calculator State
  let currentEntry = '0';
  let previousOperand = null;
  let pendingOperator = null;
  let shouldResetEntryOnNextDigit = false;
  let isResultState = false;
  let isError = false;

  const OPERATOR_SYMBOLS = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷'
  };

  /**
   * Formats a finite number to up to 10 fractional digits without trailing zeros.
   * Prevents raw floating-point tails (e.g. 0.1 + 0.2 = 0.3).
   * Returns 'Error' if the value is not finite.
   */
  function formatResult(value) {
    if (!Number.isFinite(value)) {
      return 'Error';
    }
    let str = value.toFixed(10);
    if (str.includes('.')) {
      str = str.replace(/0+$/, '').replace(/\.$/, '');
    }
    if (str === '-0' || str === '') {
      str = '0';
    }
    return str;
  }

  /**
   * Updates the display and expression elements to reflect current state.
   */
  function updateDisplay() {
    if (isError) {
      displayElement.textContent = 'Error';
      expressionElement.textContent = '';
      return;
    }

    displayElement.textContent = currentEntry;

    if (previousOperand !== null && pendingOperator !== null) {
      const formattedPrev = formatResult(previousOperand);
      const symbol = OPERATOR_SYMBOLS[pendingOperator] || pendingOperator;
      expressionElement.textContent = `${formattedPrev} ${symbol}`;
    } else if (!isResultState) {
      expressionElement.textContent = '';
    }
  }

  /**
   * Resets all calculator state to initial values.
   */
  function resetState() {
    currentEntry = '0';
    previousOperand = null;
    pendingOperator = null;
    shouldResetEntryOnNextDigit = false;
    isResultState = false;
    isError = false;
    displayElement.textContent = '0';
    expressionElement.textContent = '';
  }

  /**
   * Handles digit input ('0' through '9').
   */
  function handleDigit(digit) {
    if (isError) {
      // Division by zero resets on subsequent digit
      resetState();
      currentEntry = digit;
      updateDisplay();
      return;
    }

    if (isResultState) {
      // A new calculation starts after equals when a digit is entered
      resetState();
      currentEntry = digit;
      updateDisplay();
      return;
    }

    if (shouldResetEntryOnNextDigit) {
      currentEntry = digit;
      shouldResetEntryOnNextDigit = false;
      updateDisplay();
      return;
    }

    if (currentEntry === '0') {
      currentEntry = digit;
    } else if (currentEntry === '-0') {
      currentEntry = '-' + digit;
    } else {
      currentEntry += digit;
    }

    updateDisplay();
  }

  /**
   * Handles decimal point input.
   * Ensures only one decimal point per entry.
   */
  function handleDecimal() {
    if (isError || isResultState) {
      resetState();
      currentEntry = '0.';
      updateDisplay();
      return;
    }

    if (shouldResetEntryOnNextDigit) {
      currentEntry = '0.';
      shouldResetEntryOnNextDigit = false;
      updateDisplay();
      return;
    }

    if (!currentEntry.includes('.')) {
      currentEntry += '.';
      updateDisplay();
    }
  }

  /**
   * Executes a basic arithmetic operation.
   * Returns null if division by zero occurs.
   */
  function calculate(a, op, b) {
    if (op === '/' && b === 0) {
      return null;
    }
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return b;
    }
  }

  /**
   * Handles operator input ('+', '-', '*', '/').
   * Supports chained operations and continuing from previous result.
   */
  function handleOperator(op) {
    if (isError) {
      return;
    }

    const currentVal = parseFloat(currentEntry);

    if (isResultState) {
      // Continue from previous completed result
      previousOperand = currentVal;
      pendingOperator = op;
      isResultState = false;
      shouldResetEntryOnNextDigit = true;
      updateDisplay();
      return;
    }

    if (pendingOperator !== null && shouldResetEntryOnNextDigit) {
      // Change pending operator before typing next number
      pendingOperator = op;
      updateDisplay();
      return;
    }

    if (previousOperand !== null && pendingOperator !== null) {
      // Chained operation: evaluate pending operation first
      const result = calculate(previousOperand, pendingOperator, currentVal);
      if (result === null || !Number.isFinite(result)) {
        isError = true;
        updateDisplay();
        return;
      }
      previousOperand = result;
      currentEntry = formatResult(result);
      pendingOperator = op;
      shouldResetEntryOnNextDigit = true;
      updateDisplay();
      return;
    }

    previousOperand = currentVal;
    pendingOperator = op;
    shouldResetEntryOnNextDigit = true;
    updateDisplay();
  }

  /**
   * Handles equals ('=').
   * Evaluates pending operation and formats the result.
   */
  function handleEquals() {
    if (isError) {
      return;
    }

    if (previousOperand === null || pendingOperator === null) {
      return;
    }

    const currentVal = parseFloat(currentEntry);
    const result = calculate(previousOperand, pendingOperator, currentVal);

    if (result === null || !Number.isFinite(result)) {
      isError = true;
      updateDisplay();
      return;
    }

    const formattedPrev = formatResult(previousOperand);
    const symbol = OPERATOR_SYMBOLS[pendingOperator] || pendingOperator;
    const formattedCurrent = formatResult(currentVal);

    expressionElement.textContent = `${formattedPrev} ${symbol} ${formattedCurrent} =`;
    currentEntry = formatResult(result);
    displayElement.textContent = currentEntry;

    previousOperand = null;
    pendingOperator = null;
    isResultState = true;
    shouldResetEntryOnNextDigit = false;
  }

  /**
   * Clears the calculator.
   */
  function handleClear() {
    resetState();
  }

  /**
   * Removes the last character of the current entry.
   */
  function handleBackspace() {
    if (isError || isResultState || shouldResetEntryOnNextDigit) {
      return;
    }

    if (currentEntry.length > 1) {
      currentEntry = currentEntry.slice(0, -1);
      if (currentEntry === '-' || currentEntry === '-0' || currentEntry === '') {
        currentEntry = '0';
      }
    } else {
      currentEntry = '0';
    }

    updateDisplay();
  }

  /**
   * Toggles positive / negative sign of current entry.
   */
  function handleSign() {
    if (isError) {
      return;
    }

    if (isResultState) {
      const val = -parseFloat(currentEntry);
      currentEntry = formatResult(val);
      displayElement.textContent = currentEntry;
      return;
    }

    if (currentEntry === '0') {
      currentEntry = '-0';
    } else if (currentEntry === '-0') {
      currentEntry = '0';
    } else if (currentEntry.startsWith('-')) {
      currentEntry = currentEntry.slice(1);
    } else {
      currentEntry = '-' + currentEntry;
    }

    updateDisplay();
  }

  /**
   * Computes percentage (current entry divided by 100).
   */
  function handlePercent() {
    if (isError) {
      return;
    }

    const val = parseFloat(currentEntry);
    if (!Number.isFinite(val)) {
      return;
    }

    const result = val / 100;
    currentEntry = formatResult(result);
    displayElement.textContent = currentEntry;

    if (isResultState) {
      isResultState = false;
    }
  }

  /**
   * Dispatches calculator actions by action name.
   */
  function dispatchAction(action, value) {
    switch (action) {
      case 'digit':
        handleDigit(value);
        break;
      case 'decimal':
        handleDecimal();
        break;
      case 'operator':
        handleOperator(value);
        break;
      case 'equals':
        handleEquals();
        break;
      case 'clear':
        handleClear();
        break;
      case 'sign':
        handleSign();
        break;
      case 'percent':
        handlePercent();
        break;
      case 'backspace':
        handleBackspace();
        break;
    }
  }

  // Handle keypad button clicks
  if (keypad) {
    keypad.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      const action = button.dataset.action;
      const value = button.dataset.value;
      dispatchAction(action, value);

      // Blur mouse clicks so keyboard shortcuts don't leave lingering focus
      if (event.detail > 0) {
        button.blur();
      }
    });
  }

  // Keyboard navigation & shortcuts
  window.addEventListener('keydown', (event) => {
    const key = event.key;

    if (key >= '0' && key <= '9') {
      event.preventDefault();
      handleDigit(key);
    } else if (key === '.' || key === ',') {
      event.preventDefault();
      handleDecimal();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      event.preventDefault();
      handleOperator(key);
    } else if (key === '=') {
      event.preventDefault();
      handleEquals();
    } else if (key === 'Enter') {
      event.preventDefault();
      // If a button is focused by keyboard tab navigation, activate it without double handling
      if (document.activeElement && document.activeElement.matches('.calculator-keypad button')) {
        document.activeElement.click();
      } else {
        handleEquals();
      }
    } else if (key === 'Backspace') {
      event.preventDefault();
      handleBackspace();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      event.preventDefault();
      handleClear();
    } else if (key === '%') {
      event.preventDefault();
      handlePercent();
    }
  });
})();
