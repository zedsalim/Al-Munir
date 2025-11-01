/**
 * Dark Mode Toggle Functionality
 * Handles theme switching, system preference detection, and localStorage persistence
 */

(function () {
  "use strict";

  const html = document.documentElement;

  // Theme state keys
  const THEME_STORAGE_KEY = "Al-Munir_Theme";
  const THEME_DARK = "dark";
  const THEME_LIGHT = "light";
  const THEME_AUTO = "auto";

  /**
   * Get the current system preference
   * @returns {string} 'dark' or 'light'
   */
  function getSystemPreference() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? THEME_DARK
      : THEME_LIGHT;
  }

  /**
   * Update the toggle button appearance
   */
  function updateToggleButton(isDark) {
    const themeToggle = document.getElementById("themeToggle");
    if (!themeToggle) return;

    if (isDark) {
      themeToggle.textContent = "☀️";
      themeToggle.setAttribute("aria-label", "تفعيل الوضع النهاري");
      themeToggle.setAttribute("title", "تفعيل الوضع النهاري");
    } else {
      themeToggle.textContent = "🌙";
      themeToggle.setAttribute("aria-label", "تبديل الوضع الليلي");
      themeToggle.setAttribute("title", "تبديل الوضع الليلي");
    }
  }

  /**
   * Update the logo image based on theme
   */
  function updateLogo(isDark) {
    const logo = document.querySelector(".logo");
    if (!logo) return;

    if (isDark) {
      logo.src = "./assets/imgs/Al-Munir-white.png";
    } else {
      logo.src = "./assets/imgs/Al-Munir.png";
    }
  }

  /**
   * Apply theme to the document
   * @param {string} theme - 'dark', 'light', or 'auto'
   */
  function applyTheme(theme) {
    let activeTheme = theme;

    // If auto, use system preference
    if (theme === THEME_AUTO || !theme) {
      activeTheme = getSystemPreference();
    }

    // Apply theme to HTML element
    if (activeTheme === THEME_DARK) {
      html.setAttribute("data-theme", THEME_DARK);
      updateToggleButton(true);
      updateLogo(true);
    } else {
      html.removeAttribute("data-theme");
      updateToggleButton(false);
      updateLogo(false);
    }

    // Save to localStorage
    // If it's auto, save 'auto', otherwise save the explicit choice
    localStorage.setItem(THEME_STORAGE_KEY, theme || THEME_AUTO);
  }

  /**
   * Get current active theme based on what's actually displayed
   * @returns {string} 'dark' or 'light'
   */
  function getCurrentTheme() {
    // Check what's actually applied to the HTML element (source of truth)
    if (html.getAttribute("data-theme") === THEME_DARK) {
      return THEME_DARK;
    }
    return THEME_LIGHT;
  }

  /**
   * Toggle between dark and light theme
   */
  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    
    // Toggle to opposite - always save explicit choice
    if (currentTheme === THEME_DARK) {
      applyTheme(THEME_LIGHT);
    } else {
      applyTheme(THEME_DARK);
    }
  }

  /**
   * Initialize theme on page load
   */
  function initTheme() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === THEME_DARK || savedTheme === THEME_LIGHT) {
      // Use saved preference
      applyTheme(savedTheme);
    } else {
      // No saved preference, use system preference
      applyTheme(THEME_AUTO);
    }
  }

  /**
   * Listen for system preference changes
   */
  function setupSystemPreferenceListener() {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // Listen for changes
    const handleChange = function (e) {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      // Only auto-apply if user hasn't set a manual preference
      if (!savedTheme || savedTheme === THEME_AUTO) {
        applyTheme(THEME_AUTO);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
  }

  /**
   * Initialize everything
   */
  function init() {
    // Get theme toggle button
    const themeToggle = document.getElementById("themeToggle");
    
    if (!themeToggle) {
      console.error("Theme toggle button not found");
      return;
    }

    // Initialize theme
    initTheme();
    
    // Setup system preference listener
    setupSystemPreferenceListener();
    
    // Add click event listener
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM already loaded
    init();
  }
})();

