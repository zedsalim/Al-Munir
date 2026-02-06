// ============================================
// Dark Mode Functionality
// ============================================
(function initDarkMode() {
  'use strict';

  const html = document.documentElement;
  const STORAGE_KEY = 'Al-Munir_Theme';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';
  const THEME_AUTO = 'auto';

  function updateToggleButton(isDark) {
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      if (isDark) {
        toggle.textContent = '☀️';
        toggle.setAttribute('aria-label', 'تفعيل الوضع النهاري');
        toggle.setAttribute('title', 'تفعيل الوضع النهاري');
      } else {
        toggle.textContent = '🌙';
        toggle.setAttribute('aria-label', 'تبديل الوضع الليلي');
        toggle.setAttribute('title', 'تبديل الوضع الليلي');
      }
    }
  }

  function applyTheme(theme) {
    let effectiveTheme = theme;

    if (theme === THEME_AUTO || !theme) {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEME_DARK
        : THEME_LIGHT;
    }

    if (effectiveTheme === THEME_DARK) {
      html.setAttribute('data-theme', THEME_DARK);
      updateToggleButton(true);
    } else {
      html.removeAttribute('data-theme');
      updateToggleButton(false);
    }

    localStorage.setItem(STORAGE_KEY, theme || THEME_AUTO);
  }

  function toggleTheme() {
    const currentTheme =
      html.getAttribute('data-theme') === THEME_DARK ? THEME_DARK : THEME_LIGHT;
    const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    applyTheme(newTheme);
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === THEME_DARK || savedTheme === THEME_LIGHT) {
      applyTheme(savedTheme);
    } else {
      applyTheme(THEME_AUTO);
    }
  }

  function watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = function () {
      const currentTheme = localStorage.getItem(STORAGE_KEY);
      if (!currentTheme || currentTheme === THEME_AUTO) {
        applyTheme(THEME_AUTO);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }
  }

  function setupDarkMode() {
    const toggleButton = document.getElementById('themeToggle');
    if (!toggleButton) {
      console.error('Theme toggle button not found');
      return;
    }

    initTheme();
    watchSystemTheme();
    toggleButton.addEventListener('click', toggleTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDarkMode);
  } else {
    setupDarkMode();
  }
})();

// ============================================
// Quran Application Functionality
// ============================================

// API BASE URL
const API_BASE = 'https://api.alquran.cloud/v1';

// Constants and state management
const state = {
  currentSurah: 'selectSurah',
  currentAyah: null,
  currentEdition: 'selectTafsir',
  currentAudioEdition: 'selectAudio',
  autoplayEnabled: false,
  loopEnabled: false,
  surahLoopEnabled: false,
  rangeModeEnabled: false,
  rangeStart: 1,
  rangeEnd: 1,
  totalAyahs: 1,
};

// Cache DOM elements using jQuery
const elements = {
  surahSelect: $('#surahSelect'),
  editionSelect: $('#editionSelect'),
  audioEditionSelect: $('#audioEditionSelect'),
  loading: $('#loading'),
  error: $('#error'),
  arabicText: $('#arabicText'),
  surahInfo: $('#surahInfo'),
  ayahInfo: $('#ayahInfo'),
  quranAudio: $('#quranAudio'),
  prevAyah: $('#prevAyah'),
  nextAyah: $('#nextAyah'),
  toggleAutoplay: $('#toggleAutoplay'),
  toggleLoop: $('#toggleLoop'),
  toggleSurahLoop: $('#toggleSurahLoop'),
  toggleRangeMode: $('#toggleRangeMode'),
  rangeControls: $('#rangeControls'),
  rangeStart: $('#rangeStart'),
  rangeEnd: $('#rangeEnd'),
  setRange: $('#setRange'),
  goToFirstAyah: $('#goToFirstAyah'),
  goToLastAyah: $('#goToLastAyah'),
  quranContent: $('#quranContent'),
  playbackControlsSection: $('#playbackControlsSection'),
  audioControlsSection: $('#audioControlsSection'),
  navigationButtons: $('#navigationButtons'),
  ayahNavigationSection: $('#ayahNavigationSection'),
};

// Define allowed identifiers for both text and audio
const allowedIdentifiers = {
  text: [
    'ar.baghawi',
    'ar.jalalayn',
    'ar.miqbas',
    'ar.muyassar',
    'ar.qurtubi',
    'ar.waseet',
    'quran-uthmani',
  ],
  audio: [
    'ar.abdullahbasfar',
    'ar.abdulsamad',
    'ar.abdurrahmaansudais',
    'ar.ahmedajamy',
    'ar.alafasy',
    'ar.aymanswoaid',
    'ar.hanirifai',
    'ar.hudhaify',
    'ar.husary',
    'ar.husarymujawwad',
    'ar.ibrahimakhbar',
    'ar.mahermuaiqly',
    'ar.muhammadayyoub',
    'ar.muhammadjibreel',
    'ar.saoodshuraym',
    'ar.shaatree',
  ],
};

/**
 * Show or hide the loading indicator.
 * @param {boolean} show - Whether to show loading.
 */
function showLoading(show) {
  if (show) {
    elements.loading.removeClass('d-none');
    elements.error.addClass('d-none');
  } else {
    elements.loading.addClass('d-none');
  }
}

/**
 * Display an error message.
 * @param {string} message - The error message.
 */
function showError(message) {
  elements.error.text(message).removeClass('d-none');
  elements.loading.addClass('d-none');
}

/**
 * Utility function to update toggle button text and class.
 * @param {jQuery} $button - The button jQuery element.
 * @param {string} label - The label for the button.
 * @param {boolean} isActive - Whether the toggle is active.
 */
function updateToggleButton($button, label, isActive) {
  $button.text(`${label}: ${isActive ? 'On' : 'Off'}`);
  if (isActive) {
    $button.addClass('active');
  } else {
    $button.removeClass('active');
  }
}

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint.
 */
async function fetchApi(endpoint) {
  try {
    const response = await $.ajax({
      url: `${API_BASE}${endpoint}`,
      type: 'GET',
      dataType: 'json',
    });
    return response;
  } catch (error) {
    showError(error.message || 'Network error occurred');
    throw error;
  }
}

/**
 * Load the list of surahs from the API.
 */
async function loadSurahs() {
  showLoading(true);
  try {
    const response = await fetchApi('/surah');
    $.each(response.data, function (i, surah) {
      elements.surahSelect.append(
        $('<option>')
          .val(surah.number)
          .text(`${surah.number}. ${surah.englishName} (${surah.name})`),
      );
    });
  } catch (error) {
    showError('فشل في تحميل السورة');
  }
  showLoading(false);
}

/**
 * Load text editions based on the allowed identifiers.
 */
async function loadTextEditions() {
  showLoading(true);
  try {
    const textEditions = await fetchApi('/edition?format=text');

    // Filter and add text editions by allowed identifiers
    $.each(textEditions.data, function (i, edition) {
      if (
        allowedIdentifiers.text.includes(edition.identifier) &&
        edition.identifier !== 'quran-uthmani'
      ) {
        elements.editionSelect.append(
          $('<option>').val(edition.identifier).text(edition.name),
        );
      }
    });
  } catch (error) {
    showError('فشل في تحميل التفاسير');
  }
  showLoading(false);
}

/**
 * Load audio editions based on the allowed identifiers.
 */
async function loadAudioEditions() {
  showLoading(true);
  try {
    const audioEditions = await fetchApi(
      '/edition?format=audio&type=versebyverse',
    );

    // Filter and add audio editions by allowed identifiers
    $.each(audioEditions.data, function (i, edition) {
      if (allowedIdentifiers.audio.includes(edition.identifier)) {
        elements.audioEditionSelect.append(
          $('<option>').val(edition.identifier).text(edition.name),
        );
      }
    });
  } catch (error) {
    showError('فشل في تحميل التلاوات');
  }
  showLoading(false);
}

/**
 * Validate range input values
 */
function validateRangeInput() {
  const startVal = parseInt(elements.rangeStart.val());
  const endVal = parseInt(elements.rangeEnd.val());

  if (startVal < 1) elements.rangeStart.val(1);
  if (endVal < 1) elements.rangeEnd.val(1);
  if (startVal > state.totalAyahs) elements.rangeStart.val(state.totalAyahs);
  if (endVal > state.totalAyahs) elements.rangeEnd.val(state.totalAyahs);
}

/**
 * Load an ayah along with its translation and audio.
 * @param {number|string} surahNumber
 * @param {number} ayahNumber
 * @param {string} [edition=state.currentEdition]
 */
async function loadAyah(
  surahNumber,
  ayahNumber,
  edition = state.currentEdition,
) {
  if (state.currentSurah && state.currentSurah !== 'selectSurah') {
    showLoading(true);
    try {
      // Fetch original Arabic text.
      const arabicResponse = await fetchApi(
        `/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`,
      );
      const arabicAyah = arabicResponse.data;
      const arabicAyahText = arabicAyah.text;

      // Fetch translation if applicable.
      let translationText = '';
      let translationEdition = '';
      if (edition && edition !== 'selectTafsir') {
        const translationResponse = await fetchApi(
          `/ayah/${surahNumber}:${ayahNumber}/${edition}`,
        );
        translationText = translationResponse.data.text;
        translationEdition = translationResponse.data.edition.name;
      }

      // Update the display.
      elements.arabicText.html(`
      <div class="verse-container">
        <div class="arabic">${arabicAyahText}</div>
        ${
          translationText
            ? `<div class="edition-label mt-3">${translationEdition}</div>
               <div class="translation">${translationText}</div>`
            : ''
        }
      </div>
    `);

      elements.surahInfo.text(
        `Surah ${arabicAyah.surah.englishName} (${arabicAyah.surah.name})`,
      );
      elements.ayahInfo.text(
        `الأية ${arabicAyah.numberInSurah} من ${arabicAyah.surah.numberOfAyahs}`,
      );

      state.totalAyahs = arabicAyah.surah.numberOfAyahs;

      elements.rangeStart.off('input').on('input', validateRangeInput);
      elements.rangeEnd.off('input').on('input', validateRangeInput);

      // Load audio if an audio edition is selected.
      if (
        state.currentAudioEdition &&
        state.currentAudioEdition !== 'selectAudio'
      ) {
        const audioResponse = await fetchApi(
          `/ayah/${surahNumber}:${ayahNumber}/${state.currentAudioEdition}`,
        );
        elements.quranAudio.attr('src', audioResponse.data.audio);
        if (state.autoplayEnabled) {
          elements.quranAudio[0].play();
        }
      }

      updateNavigationButtons(
        arabicAyah.numberInSurah,
        arabicAyah.surah.numberOfAyahs,
      );

      // Update state and save.
      state.currentSurah = surahNumber;
      state.currentAyah = ayahNumber;
      saveState();
    } catch (error) {
      showError('فشل في تحميل الأية');
    }
    showLoading(false);
  }
}

/**
 * Toggles option selects based on Surah selection
 */
function toggleOptionsBasedOnSurah() {
  const isSelected = state.currentSurah === 'selectSurah';

  elements.editionSelect.prop('disabled', isSelected);
  elements.audioEditionSelect.prop('disabled', isSelected);

  if (isSelected) {
    elements.rangeControls.addClass('d-none');
    elements.playbackControlsSection.addClass('d-none');
    elements.audioControlsSection.addClass('d-none');
    elements.ayahNavigationSection.addClass('d-none');
  }

  updateControlsVisibility();
}

/**
 * Update navigation buttons state.
 * @param {number} currentNumber - The current ayah number.
 * @param {number} totalNumber - Total number of ayahs in the surah.
 */
function updateNavigationButtons(currentNumber, totalNumber) {
  if (state.rangeModeEnabled) {
    elements.prevAyah.prop('disabled', currentNumber <= state.rangeStart);
    elements.nextAyah.prop('disabled', currentNumber >= state.rangeEnd);
  } else {
    elements.prevAyah.prop('disabled', currentNumber === 1);
    elements.nextAyah.prop('disabled', currentNumber === totalNumber);
  }
}

/**
 * Update the visibility of audio and control elements.
 */
function updateControlsVisibility() {
  const surahSelected = elements.surahSelect.val() !== 'selectSurah';
  const audioEditionSelected =
    elements.audioEditionSelect.val() !== 'selectAudio';

  if (surahSelected) {
    elements.quranContent.removeClass('d-none');
    elements.ayahNavigationSection.removeClass('d-none');

    if (audioEditionSelected) {
      elements.playbackControlsSection.removeClass('d-none');
      elements.audioControlsSection.removeClass('d-none');
    } else {
      elements.playbackControlsSection.addClass('d-none');
      elements.audioControlsSection.addClass('d-none');
    }
  } else {
    elements.quranContent.addClass('d-none');
    elements.playbackControlsSection.addClass('d-none');
    elements.audioControlsSection.addClass('d-none');
    elements.ayahNavigationSection.addClass('d-none');
  }
}

/**
 * Handle the audio element's ended event.
 */
function handleAudioEnd() {
  if (state.loopEnabled) {
    elements.quranAudio[0].play();
  } else if (state.autoplayEnabled) {
    if (state.rangeModeEnabled) {
      if (state.currentAyah < state.rangeEnd) {
        loadAyah(state.currentSurah, state.currentAyah + 1);
      } else if (state.surahLoopEnabled) {
        loadAyah(state.currentSurah, state.rangeStart);
      }
    } else {
      if (state.currentAyah < state.totalAyahs) {
        loadAyah(state.currentSurah, state.currentAyah + 1);
      } else if (state.surahLoopEnabled) {
        loadAyah(state.currentSurah, 1);
      }
    }
  } else if (state.surahLoopEnabled && !state.loopEnabled) {
    if (state.rangeModeEnabled) {
      if (state.currentAyah >= state.rangeEnd) {
        loadAyah(state.currentSurah, state.rangeStart);
      }
    } else {
      if (state.currentAyah >= state.totalAyahs) {
        loadAyah(state.currentSurah, 1);
      }
    }
  }
}

/**
 * Save the current state to localStorage.
 */
function saveState() {
  localStorage.setItem('Al-Munir_State', JSON.stringify(state));
}

/**
 * Load the saved state from localStorage.
 */
function loadState() {
  const savedState = localStorage.getItem('Al-Munir_State');
  if (savedState) {
    try {
      Object.assign(state, JSON.parse(savedState));

      // Update DOM elements
      elements.surahSelect.val(state.currentSurah);
      elements.editionSelect.val(state.currentEdition);
      elements.audioEditionSelect.val(state.currentAudioEdition);

      updateToggleButton(
        elements.toggleAutoplay,
        'التشغيل التلقائي للأيات',
        state.autoplayEnabled,
      );
      updateToggleButton(
        elements.toggleLoop,
        'تكرار الأية الحالية',
        state.loopEnabled,
      );
      updateToggleButton(
        elements.toggleSurahLoop,
        'تكرار السورة/المجال',
        state.surahLoopEnabled,
      );
      updateToggleButton(
        elements.toggleRangeMode,
        'تحديد مجال الأيات',
        state.rangeModeEnabled,
      );

      elements.rangeStart.val(state.rangeStart);
      elements.rangeEnd.val(state.rangeEnd);

      if (state.rangeModeEnabled) {
        elements.rangeControls.removeClass('d-none');
      } else {
        elements.rangeControls.addClass('d-none');
      }

      if (state.currentSurah && state.currentAyah) {
        loadAyah(state.currentSurah, state.currentAyah, state.currentEdition);
      }
    } catch (error) {
      showError('فشل تحميل الحالة المحفوظة');
    }
  }
  toggleOptionsBasedOnSurah();
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
  elements.quranAudio.on('ended', handleAudioEnd);

  // Click on Arabic text to toggle play/pause audio
  elements.arabicText.on('click', function () {
    if (state.currentAudioEdition === 'selectAudio') {
      return;
    }

    const audio = elements.quranAudio[0];
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  elements.toggleAutoplay.on('click', function () {
    state.autoplayEnabled = !state.autoplayEnabled;
    updateToggleButton(
      elements.toggleAutoplay,
      'التشغيل التلقائي للأيات',
      state.autoplayEnabled,
    );
    saveState();
  });

  elements.toggleLoop.on('click', function () {
    state.loopEnabled = !state.loopEnabled;
    updateToggleButton(
      elements.toggleLoop,
      'تكرار الأية الحالية',
      state.loopEnabled,
    );
    saveState();
  });

  elements.toggleSurahLoop.on('click', function () {
    state.surahLoopEnabled = !state.surahLoopEnabled;
    updateToggleButton(
      elements.toggleSurahLoop,
      'تكرار السورة/المجال',
      state.surahLoopEnabled,
    );
    saveState();
  });

  elements.toggleRangeMode.on('click', function () {
    state.rangeModeEnabled = !state.rangeModeEnabled;
    updateToggleButton(
      elements.toggleRangeMode,
      'تحديد مجال الأيات',
      state.rangeModeEnabled,
    );

    if (state.rangeModeEnabled) {
      elements.rangeControls.removeClass('d-none');
      elements.rangeStart.val(1);
      elements.rangeEnd.val(state.totalAyahs);
      state.rangeStart = 1;
      state.rangeEnd = state.totalAyahs;
    } else {
      elements.rangeControls.addClass('d-none');
    }

    updateNavigationButtons(state.currentAyah || 1, state.totalAyahs);
    saveState();
  });

  elements.setRange.on('click', function () {
    state.rangeStart = parseInt(elements.rangeStart.val());
    state.rangeEnd = parseInt(elements.rangeEnd.val());

    if (state.rangeStart > state.rangeEnd) {
      [state.rangeStart, state.rangeEnd] = [state.rangeEnd, state.rangeStart];
      elements.rangeStart.val(state.rangeStart);
      elements.rangeEnd.val(state.rangeEnd);
    }

    if (
      !state.currentAyah ||
      state.currentAyah < state.rangeStart ||
      state.currentAyah > state.rangeEnd
    ) {
      loadAyah(state.currentSurah, state.rangeStart);
    } else {
      updateNavigationButtons(state.currentAyah, state.totalAyahs);
    }
    saveState();
  });

  elements.goToFirstAyah.on('click', function () {
    if (state.currentSurah) {
      const ayahToLoad = state.rangeModeEnabled ? state.rangeStart : 1;
      loadAyah(state.currentSurah, ayahToLoad);
    }
  });

  elements.goToLastAyah.on('click', function () {
    if (state.currentSurah) {
      const ayahToLoad = state.rangeModeEnabled
        ? state.rangeEnd
        : state.totalAyahs;
      loadAyah(state.currentSurah, ayahToLoad);
    }
  });

  elements.prevAyah.on('click', function () {
    const minAyah = state.rangeModeEnabled ? state.rangeStart : 1;
    if (state.currentAyah > minAyah) {
      loadAyah(state.currentSurah, state.currentAyah - 1);
    }
  });

  elements.nextAyah.on('click', function () {
    const maxAyah = state.rangeModeEnabled ? state.rangeEnd : state.totalAyahs;
    if (state.currentAyah < maxAyah) {
      loadAyah(state.currentSurah, state.currentAyah + 1);
    }
  });

  elements.surahSelect.on('change', function () {
    const selectedValue = $(this).val();
    if (selectedValue && selectedValue !== 'selectSurah') {
      state.currentSurah = parseInt(selectedValue);
      state.currentAyah = 1;
      loadAyah(state.currentSurah, state.currentAyah).then(() => {
        if (state.rangeModeEnabled) {
          state.rangeStart = 1;
          state.rangeEnd = state.totalAyahs;
          elements.rangeStart.val(1);
          elements.rangeEnd.val(state.totalAyahs);
        }
      });
    } else {
      state.currentSurah = 'selectSurah';
      state.currentAyah = null;
      elements.quranAudio[0].pause();
      elements.quranAudio[0].currentTime = 0;
    }
    toggleOptionsBasedOnSurah();
    saveState();
  });

  elements.editionSelect.on('change', function () {
    const selectedValue = $(this).val();
    if (selectedValue) {
      state.currentEdition = selectedValue;
      loadAyah(state.currentSurah, state.currentAyah);
    } else {
      state.currentEdition = 'selectTafsir';
    }
    saveState();
  });

  elements.audioEditionSelect.on('change', function () {
    const selectedValue = $(this).val();
    if (selectedValue) {
      state.currentAudioEdition = selectedValue;
      loadAyah(state.currentSurah, state.currentAyah);
    } else {
      state.currentAudioEdition = 'selectAudio';
    }
    updateControlsVisibility();
    saveState();
  });

  // Modal video pause on close
  const tutorialModal = document.getElementById('tutorialModal');
  if (tutorialModal) {
    tutorialModal.addEventListener('hidden.bs.modal', function () {
      const video = tutorialModal.querySelector('video');
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }
}

/**
 * Initializes the application
 * @returns {Promise<void>}
 */
async function init() {
  setupEventListeners();
  await Promise.all([loadSurahs(), loadTextEditions(), loadAudioEditions()]);
  loadState();
  toggleOptionsBasedOnSurah();
}

// Hide domain warning on Netlify domain
$(function () {
  const hostname = window.location.hostname;

  if (hostname === 'almunir.netlify.app') {
    $('#domainWarning').hide();
  }
});

// jQuery document ready function
$(document).ready(function () {
  init();
});
