// Constants and state management
const state = {
  currentSurah: "selectSurah",
  currentAyah: null,
  currentEdition: "selectTafsir",
  currentAudioEdition: "selectAudio",
  autoplayEnabled: false,
  loopEnabled: false,
  rangeModeEnabled: false,
  rangeStart: 1,
  rangeEnd: 1,
  totalAyahs: 1,
};

// DOM elements
const elements = {
  surahSelect: document.getElementById("surahSelect"),
  editionSelect: document.getElementById("editionSelect"),
  audioEditionSelect: document.getElementById("audioEditionSelect"),
  loading: document.getElementById("loading"),
  error: document.getElementById("error"),
  arabicText: document.getElementById("arabicText"),
  translationText: document.getElementById("translationText"),
  surahInfo: document.getElementById("surahInfo"),
  ayahInfo: document.getElementById("ayahInfo"),
  quranAudio: document.getElementById("quranAudio"),
  prevAyah: document.getElementById("prevAyah"),
  nextAyah: document.getElementById("nextAyah"),
  toggleAutoplay: document.getElementById("toggleAutoplay"),
  toggleLoop: document.getElementById("toggleLoop"),
  toggleRangeMode: document.getElementById("toggleRangeMode"),
  rangeControls: document.getElementById("rangeControls"),
  rangeStart: document.getElementById("rangeStart"),
  rangeEnd: document.getElementById("rangeEnd"),
  setRange: document.getElementById("setRange"),
  autoPlay: document.getElementById("toggleAutoplay"),
  loop: document.getElementById("toggleLoop"),
  rangeMode: document.getElementById("toggleRangeMode"),
  quranContent: document.getElementById("quranContent"),
};

// Excluded identifiers
const excludedIdentifiers = {
  audio: ["ar.parhizgar"],
  text: [
    "quran-buck",
    "quran-corpus-qd",
    "quran-kids",
    "quran-simple-clean",
    "quran-simple-enhanced",
    "quran-simple-min",
    "quran-simple",
    "quran-tajweed",
    "quran-unicode",
    "quran-uthmani-quran-academy",
    "quran-wordbyword-2",
    "quran-wordbyword",
    "quran-uthmani",
    "quran-uthmani-min",
  ],
};

/**
 * Shows or hides the loading indicator
 * @param {boolean} show - Whether to show the loading indicator
 */
function showLoading(show) {
  elements.loading.style.display = show ? "block" : "none";
  if (show) elements.error.style.display = "none";
}

/**
 * Displays an error message to the user
 * @param {string} message - The error message to display
 */
function showError(message) {
  elements.error.textContent = message;
  elements.error.style.display = "block";
  elements.loading.style.display = "none";
}

/**
 * Updates the state of a toggle button
 * @param {HTMLElement} button - The button element to update
 * @param {string} label - The label text for the button
 * @param {boolean} isActive - The active state of the button
 */
function updateToggleButton(button, label, isActive) {
  button.textContent = `${label}: ${isActive ? "On" : "Off"}`;
  button.classList.toggle("active", isActive);
}

/**
 * Loads a JSON file from the assets directory
 * @param {string} filename - The name of the JSON file to load
 * @returns {Promise<Object>} The parsed JSON data
 * @throws {Error} If the file cannot be loaded
 */
async function loadJSON(filename) {
  try {
    const response = await fetch(`./assets/data/${filename}`);
    if (!response.ok) throw new Error("فشل تحميل ملف JSON");
    return await response.json();
  } catch (error) {
    showError(`فشل تحميل ملف ${filename}: ${error.message}`);
    throw error;
  }
}

/**
 * Loads available Quran editions (text and audio) and populates select elements
 * @returns {Promise<void>}
 */
async function loadEditions() {
  showLoading(true);
  try {
    const [textEditions, audioEditions] = await Promise.all([
      loadJSON("arabic_text_editions.json"),
      loadJSON("arabic_audio_editions.json"),
    ]);

    textEditions.data.forEach((edition) => {
      // Skip excluded identifiers
      if (excludedIdentifiers.text.includes(edition.identifier)) {
        return;
      }

      const option = new Option(edition.name, edition.identifier);
      elements.editionSelect.add(option);
    });

    audioEditions.data.forEach((edition) => {
      // Skip excluded identifiers
      if (excludedIdentifiers.audio.includes(edition.identifier)) {
        return;
      }

      const option = new Option(edition.name, edition.identifier);
      elements.audioEditionSelect.add(option);
    });
  } catch (error) {
    showError("فشل في تحميل ملفات التفسير والقراء");
  }
  showLoading(false);
}

/**
 * Loads the list of Surahs and populates the Surah select element
 * @returns {Promise<void>}
 */
async function loadSurahs() {
  showLoading(true);
  try {
    // Use the first surah from any Quran text file to get the list
    const quranData = await loadJSON("quran_text_quran-uthmani.json");
    quranData.data.surahs.forEach((surah) => {
      const option = new Option(
        `${surah.number}. ${surah.englishName} (${surah.name})`,
        surah.number
      );
      elements.surahSelect.add(option);
    });
  } catch (error) {
    showError("فشل في تحميل ملف السور");
  }
  showLoading(false);
}

/**
 * Loads and displays a specific Ayah
 * @param {number} surahNumber - The number of the Surah
 * @param {number} ayahNumber - The number of the Ayah within the Surah
 * @param {string} [edition] - The edition identifier to use
 * @returns {Promise<void>}
 */
async function loadAyah(
  surahNumber,
  ayahNumber,
  edition = state.currentEdition
) {
  showLoading(true);
  try {
    // Load Arabic text
    const arabicData = await loadJSON("quran_text_quran-uthmani.json");
    const surah = arabicData.data.surahs[surahNumber - 1];
    const ayah = surah.ayahs[ayahNumber - 1];

    // Load translation if selected
    let translationText = "";
    let translationEditionName = "";
    if (edition && edition !== "selectTafsir") {
      const translationData = await loadJSON(`quran_text_${edition}.json`);
      const translationAyah =
        translationData.data.surahs[surahNumber - 1].ayahs[ayahNumber - 1];
      translationText = translationAyah.text;
      translationEditionName = translationData.data.edition.name;
    }

    // Update display
    elements.arabicText.innerHTML = `
      <div class="verse-container">
        <div class="arabic">${ayah.text}</div>
        ${
          translationText
            ? `
          <div class="edition-label">${translationEditionName}</div>
          <div class="translation">${translationText}</div>
        `
            : ""
        }
      </div>
    `;

    elements.surahInfo.textContent = `Surah ${surah.englishName} (${surah.name})`;
    elements.ayahInfo.textContent = `الأية ${ayah.numberInSurah} من ${surah.ayahs.length}`;

    state.totalAyahs = surah.ayahs.length;

    elements.rangeStart.addEventListener("input", validateRangeInput);
    elements.rangeEnd.addEventListener("input", validateRangeInput);

    // Load audio if selected
    if (
      state.currentAudioEdition &&
      state.currentAudioEdition !== "selectAudio"
    ) {
      const audioData = await loadJSON(
        `quran_audio_${state.currentAudioEdition}.json`
      );
      const audioAyah =
        audioData.data.surahs[surahNumber - 1].ayahs[ayahNumber - 1];
      elements.quranAudio.src = audioAyah.audio;
      if (state.autoplayEnabled) {
        elements.quranAudio.play();
      }
    }

    updateNavigationButtons(ayah.numberInSurah, surah.ayahs.length);

    // Update state
    state.currentSurah = surahNumber;
    state.currentAyah = ayahNumber;
    saveState();
  } catch (error) {
    showError("فشل في تحميل الأية");
  }
  showLoading(false);
}

/**
 * Validates the range input to ensure it's within valid bounds
 * @param {Event} event - The input event object
 */
function validateRangeInput(event) {
  let value = Number(event.target.value);
  if (value > state.totalAyahs) {
    event.target.value = state.totalAyahs;
  } else if (value < 1) {
    event.target.value = 1;
  }
}

/**
 * Updates the state of navigation buttons based on current position and mode
 * @param {number} currentNumber - Current Ayah number
 * @param {number} totalNumber - Total number of Ayahs in the Surah
 */
function updateNavigationButtons(currentNumber, totalNumber) {
  if (state.rangeModeEnabled) {
    elements.prevAyah.disabled = currentNumber <= state.rangeStart;
    elements.nextAyah.disabled = currentNumber >= state.rangeEnd;
  } else {
    elements.prevAyah.disabled = currentNumber === 1;
    elements.nextAyah.disabled = currentNumber === totalNumber;
  }
}

/**
 * Updates the visibility of control elements based on current selections
 */
function updateControlsVisibility() {
  const surahSelected = elements.surahSelect.value !== "selectSurah";
  const audioEditionSelected =
    elements.audioEditionSelect.value !== "selectAudio";

  elements.quranAudio.classList.toggle(
    "hidden",
    !(surahSelected && audioEditionSelected)
  );
  elements.prevAyah.classList.toggle("hidden", !surahSelected);
  elements.nextAyah.classList.toggle("hidden", !surahSelected);
  elements.quranContent.classList.toggle("hidden", !surahSelected);
  elements.autoPlay.classList.toggle(
    "hidden",
    !(surahSelected && audioEditionSelected)
  );
  elements.loop.classList.toggle(
    "hidden",
    !(surahSelected && audioEditionSelected)
  );
  elements.rangeMode.classList.toggle("hidden", !surahSelected);
}

/**
 * Saves the current state to localStorage
 */
function saveState() {
  localStorage.setItem("Al-Munir_State", JSON.stringify(state));
}

/**
 * Loads the saved state from localStorage and updates the UI
 */
function loadState() {
  const savedState = localStorage.getItem("Al-Munir_State");
  if (savedState) {
    try {
      Object.assign(state, JSON.parse(savedState));

      // Update DOM elements
      elements.surahSelect.value = state.currentSurah;
      elements.editionSelect.value = state.currentEdition;
      elements.audioEditionSelect.value = state.currentAudioEdition;
      updateToggleButton(
        elements.toggleAutoplay,
        "التشغيل التلقائي للأيات",
        state.autoplayEnabled
      );
      updateToggleButton(
        elements.toggleLoop,
        "تكرار الأية الحالية",
        state.loopEnabled
      );
      updateToggleButton(
        elements.toggleRangeMode,
        "تحديد مجال الأيات",
        state.rangeModeEnabled
      );
      elements.rangeStart.value = state.rangeStart;
      elements.rangeEnd.value = state.rangeEnd;

      elements.rangeControls.style.display = state.rangeModeEnabled
        ? "flex"
        : "none";

      if (state.currentSurah && state.currentAyah) {
        loadAyah(state.currentSurah, state.currentAyah, state.currentEdition);
      }
    } catch (error) {
      showError("فشل تحميل الحالة المحفوظة");
    }
  }
  updateControlsVisibility();
}

/**
 * Handles the audio playback end event
 */
function handleAudioEnd() {
  if (state.loopEnabled) {
    elements.quranAudio.play();
  } else if (state.autoplayEnabled) {
    if (state.rangeModeEnabled) {
      if (state.currentAyah < state.rangeEnd) {
        loadAyah(state.currentSurah, state.currentAyah + 1);
      } else if (state.loopEnabled) {
        loadAyah(state.currentSurah, state.rangeStart);
      }
    } else if (state.currentAyah < state.totalAyahs) {
      loadAyah(state.currentSurah, state.currentAyah + 1);
    }
  }
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
  elements.quranAudio.addEventListener("ended", handleAudioEnd);

  elements.toggleAutoplay.addEventListener("click", () => {
    state.autoplayEnabled = !state.autoplayEnabled;
    updateToggleButton(
      elements.toggleAutoplay,
      "التشغيل التلقائي للأيات",
      state.autoplayEnabled
    );
    saveState();
  });

  elements.toggleLoop.addEventListener("click", () => {
    state.loopEnabled = !state.loopEnabled;
    updateToggleButton(
      elements.toggleLoop,
      "تكرار الأية الحالية",
      state.loopEnabled
    );
    saveState();
  });

  elements.toggleRangeMode.addEventListener("click", () => {
    state.rangeModeEnabled = !state.rangeModeEnabled;
    updateToggleButton(
      elements.toggleRangeMode,
      "تحديد مجال الأيات",
      state.rangeModeEnabled
    );
    elements.rangeControls.style.display = state.rangeModeEnabled
      ? "flex"
      : "none";

    if (state.rangeModeEnabled) {
      elements.rangeStart.value = state.currentAyah || 1;
      elements.rangeEnd.value = state.totalAyahs;
      state.rangeStart = state.currentAyah || 1;
      state.rangeEnd = state.totalAyahs;
    }

    updateNavigationButtons(state.currentAyah || 1, state.totalAyahs);
    saveState();
  });

  elements.setRange.addEventListener("click", () => {
    state.rangeStart = parseInt(elements.rangeStart.value);
    state.rangeEnd = parseInt(elements.rangeEnd.value);

    if (state.rangeStart > state.rangeEnd) {
      [state.rangeStart, state.rangeEnd] = [state.rangeEnd, state.rangeStart];
      elements.rangeStart.value = state.rangeStart;
      elements.rangeEnd.value = state.rangeEnd;
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

  elements.prevAyah.addEventListener("click", () => {
    const minAyah = state.rangeModeEnabled ? state.rangeStart : 1;
    if (state.currentAyah > minAyah) {
      loadAyah(state.currentSurah, state.currentAyah - 1);
    }
  });

  elements.nextAyah.addEventListener("click", () => {
    const maxAyah = state.rangeModeEnabled ? state.rangeEnd : state.totalAyahs;
    if (state.currentAyah < maxAyah) {
      loadAyah(state.currentSurah, state.currentAyah + 1);
    }
  });

  elements.surahSelect.addEventListener("change", (e) => {
    const selectedValue = e.target.value;
    if (selectedValue && selectedValue !== "selectSurah") {
      state.currentSurah = parseInt(selectedValue);
      state.currentAyah = 1;
      loadAyah(state.currentSurah, state.currentAyah);
      updateControlsVisibility();
    }
  });

  elements.editionSelect.addEventListener("change", (e) => {
    if (e.target.value) {
      state.currentEdition = e.target.value;
      loadAyah(state.currentSurah, state.currentAyah);
    }
  });

  elements.audioEditionSelect.addEventListener("change", (e) => {
    if (e.target.value) {
      state.currentAudioEdition = e.target.value;
      loadAyah(state.currentSurah, state.currentAyah);
      updateControlsVisibility();
    }
  });
}

/**
 * Initializes the hidden state of UI elements
 */
function initializeHiddenElements() {
  elements.quranAudio.classList.add("hidden");
  elements.prevAyah.classList.add("hidden");
  elements.nextAyah.classList.add("hidden");
  elements.quranContent.classList.add("hidden");
  elements.autoPlay.classList.add("hidden");
  elements.loop.classList.add("hidden");
  elements.rangeMode.classList.add("hidden");
}

/**
 * Initializes the application
 * @returns {Promise<void>}
 */
async function init() {
  initializeHiddenElements();
  setupEventListeners();
  await Promise.all([loadSurahs(), loadEditions()]);
  loadState();
}

init();
