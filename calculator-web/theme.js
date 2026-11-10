/**
 * Theme Selector and Persistence
 * Manages color theme state, document-level application via data-theme attribute,
 * and localStorage persistence with safe fallback handling.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'calculator-theme';
  const VALID_THEMES = ['slate', 'light', 'ocean', 'sunset'];
  const DEFAULT_THEME = 'slate';

  /**
   * Safely reads the stored theme from localStorage.
   * Returns DEFAULT_THEME if unavailable, inaccessible, or invalid.
   */
  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_THEMES.includes(stored)) {
        return stored;
      }
    } catch {
      // Storage access blocked or restricted (e.g. private mode, cookies disabled)
    }
    return DEFAULT_THEME;
  }

  /**
   * Safely persists the chosen theme to localStorage.
   * Exceptions are caught so failures do not interrupt page functionality.
   */
  function persistTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage quota exceeded, unavailable, or restricted; page theme remains active
    }
  }

  /**
   * Applies the theme to the document root and synchronizes the select element.
   */
  function applyTheme(theme, selectElement) {
    const targetTheme = VALID_THEMES.includes(theme) ? theme : DEFAULT_THEME;
    document.documentElement.dataset.theme = targetTheme;
    if (selectElement && selectElement.value !== targetTheme) {
      selectElement.value = targetTheme;
    }
  }

  /**
   * Initializes theme on page load and sets up change / keyboard event listeners.
   */
  function initTheme() {
    const themeSelect = document.getElementById('theme-select');
    const initialTheme = getStoredTheme();

    applyTheme(initialTheme, themeSelect);

    if (themeSelect) {
      themeSelect.addEventListener('change', (event) => {
        const selectedTheme = event.target.value;
        const validTheme = VALID_THEMES.includes(selectedTheme) ? selectedTheme : DEFAULT_THEME;
        applyTheme(validTheme, themeSelect);
        persistTheme(validTheme);
      });

      // Prevent keydown shortcuts while interacting with the select element
      // from firing global calculator actions (such as Enter, Escape, or digit navigation)
      themeSelect.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') {
          event.stopPropagation();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
