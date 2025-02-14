const API_BASE = "http://api.alquran.cloud/v1";
let currentSurah = "selectSurah";
let currentAyah = null;
let currentEdition = "selectTafsir";
let currentAudioEdition = "selectAudio";
let autoplayEnabled = false;
let loopEnabled = false;
let rangeModeEnabled = false;
let rangeStart = 1;
let rangeEnd = 1;
let totalAyahs = 1;
let originalArabicText = "";

// Cache DOM elements for reuse
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
  playbackControls: document.querySelector(".playback-controls"),
  quranContent: document.getElementById("quranContent"),
};

/**
 * Utility function to update toggle button text and class.
 * @param {HTMLElement} button - The button element.
 * @param {string} label - The label for the button.
 * @param {boolean} isActive - Whether the toggle is active.
 */
function updateToggleButton(button, label, isActive) {
  button.textContent = `${label}: ${isActive ? "On" : "Off"}`;
  button.classList.toggle("active", isActive);
}

/**
 * Show or hide the loading indicator.
 * @param {boolean} show - Whether to show loading.
 */
function showLoading(show) {
  elements.loading.style.display = show ? "block" : "none";
  if (show) elements.error.style.display = "none";
}

/**
 * Display an error message.
 * @param {string} message - The error message.
 */
function showError(message) {
  elements.error.textContent = message;
  elements.error.style.display = "block";
  elements.loading.style.display = "none";
}

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint.
 */
async function fetchApi(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    showError(error.message);
    throw error;
  }
}

/**
 * Load text and audio editions from the API.
 */
async function loadEditions() {
  showLoading(true);
  try {
    const [textEditions, audioEditions] = await Promise.all([
      fetchApi("/edition?format=text"),
      fetchApi("/edition?format=audio&type=versebyverse"),
    ]);

    textEditions.data.forEach((edition) => {
      const option = new Option(edition.name, edition.identifier);
      elements.editionSelect.add(option);
    });

    audioEditions.data.forEach((edition) => {
      const option = new Option(edition.name, edition.identifier);
      elements.audioEditionSelect.add(option);
    });
  } catch (error) {
    showError("خطأ في تحميل البيانات");
  }
  showLoading(false);
}

/**
 * Load the list of surahs from the API.
 */
async function loadSurahs() {
  showLoading(true);
  try {
    const response = await fetchApi("/surah");
    response.data.forEach((surah) => {
      const option = new Option(
        `${surah.number}. ${surah.englishName} (${surah.name})`,
        surah.number
      );
      elements.surahSelect.add(option);
    });
  } catch (error) {
    showError("خطأ في تحميل السورة");
  }
  showLoading(false);
}

/**
 * Load an ayah along with its translation and audio.
 * @param {number|string} surahNumber
 * @param {number} ayahNumber
 * @param {string} [edition=currentEdition]
 */
async function loadAyah(surahNumber, ayahNumber, edition = currentEdition) {
  showLoading(true);
  try {
    // Fetch original Arabic text.
    const arabicResponse = await fetchApi(
      `/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`
    );
    const arabicAyah = arabicResponse.data;
    originalArabicText = arabicAyah.text;

    // Fetch translation if applicable.
    let translationText = "";
    let translationEdition = "";
    if (edition && edition !== "quran-uthmani" && edition !== "selectTafsir") {
      const translationResponse = await fetchApi(
        `/ayah/${surahNumber}:${ayahNumber}/${edition}`
      );
      translationText = translationResponse.data.text;
      translationEdition = translationResponse.data.edition.name;
    }

    // Update the display.
    elements.arabicText.innerHTML = `
            <div class="verse-container">
              <div class="arabic">${originalArabicText}</div>
              ${
                translationText
                  ? `<div class="edition-label">${translationEdition}</div>
                     <div class="translation">${translationText}</div>`
                  : ""
              }
            </div>
          `;
    elements.surahInfo.textContent = `Surah ${arabicAyah.surah.englishName} (${arabicAyah.surah.name})`;
    elements.ayahInfo.textContent = `Ayah ${arabicAyah.numberInSurah} of ${arabicAyah.surah.numberOfAyahs}`;

    totalAyahs = arabicAyah.surah.numberOfAyahs;
    elements.rangeEnd.max = totalAyahs;

    // Load audio if an audio edition is selected.
    if (currentAudioEdition && currentAudioEdition !== "selectAudio") {
      const audioResponse = await fetchApi(
        `/ayah/${surahNumber}:${ayahNumber}/${currentAudioEdition}`
      );
      elements.quranAudio.src = audioResponse.data.audio;
      if (autoplayEnabled) {
        elements.quranAudio.play();
      }
    }

    updateNavigationButtons(
      arabicAyah.numberInSurah,
      arabicAyah.surah.numberOfAyahs
    );

    // Update state and save.
    currentSurah = surahNumber;
    currentAyah = ayahNumber;
    saveState();
  } catch (error) {
    showError("خطأ في تحميل الأية");
  }
  showLoading(false);
}

/**
 * Update the previous/next buttons based on the current ayah.
 * @param {number} currentNumber - The current ayah number.
 * @param {number} totalNumber - Total number of ayahs in the surah.
 */
function updateNavigationButtons(currentNumber, totalNumber) {
  if (rangeModeEnabled) {
    elements.prevAyah.disabled = currentNumber <= rangeStart;
    elements.nextAyah.disabled = currentNumber >= rangeEnd;
  } else {
    elements.prevAyah.disabled = currentNumber === 1;
    elements.nextAyah.disabled = currentNumber === totalNumber;
  }
}

/**
 * Update the visibility of audio and control elements.
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
  elements.playbackControls.classList.toggle(
    "hidden",
    !(surahSelected && audioEditionSelected)
  );
}

/**
 * Handle the audio element's ended event.
 */
function handleAudioEnd() {
  if (loopEnabled) {
    elements.quranAudio.play();
  } else if (autoplayEnabled) {
    if (rangeModeEnabled) {
      if (currentAyah < rangeEnd) {
        loadAyah(currentSurah, currentAyah + 1);
      } else if (loopEnabled) {
        loadAyah(currentSurah, rangeStart);
      }
    } else if (currentAyah < totalAyahs) {
      loadAyah(currentSurah, currentAyah + 1);
    }
  }
}

/**
 * Save the current state to localStorage.
 */
function saveState() {
  const state = {
    currentSurah,
    currentAyah,
    currentEdition,
    currentAudioEdition,
    autoplayEnabled,
    loopEnabled,
    rangeModeEnabled,
    rangeStart,
    rangeEnd,
    totalAyahs,
  };
  localStorage.setItem("quranAppState", JSON.stringify(state));
}

/**
 * Load the saved state from localStorage.
 */
function loadState() {
  const savedState = localStorage.getItem("quranAppState");
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      currentSurah = state.currentSurah;
      currentAyah = state.currentAyah;
      currentEdition = state.currentEdition;
      currentAudioEdition = state.currentAudioEdition;
      autoplayEnabled = state.autoplayEnabled;
      loopEnabled = state.loopEnabled;
      rangeModeEnabled = state.rangeModeEnabled;
      rangeStart = state.rangeStart;
      rangeEnd = state.rangeEnd;
      totalAyahs = state.totalAyahs;

      // Update DOM elements based on state.
      elements.surahSelect.value = currentSurah;
      elements.editionSelect.value = currentEdition;
      elements.audioEditionSelect.value = currentAudioEdition;
      updateToggleButton(
        elements.toggleAutoplay,
        "التشغيل التلقائي للأيات",
        autoplayEnabled
      );
      updateToggleButton(
        elements.toggleLoop,
        "تكرار الأية الحالية",
        loopEnabled
      );
      updateToggleButton(
        elements.toggleRangeMode,
        "تحديد مجال الأيات",
        rangeModeEnabled
      );
      elements.rangeStart.value = rangeStart;
      elements.rangeEnd.value = rangeEnd;

      if (currentSurah !== "selectSurah") {
        elements.quranAudio.classList.remove("hidden");
        elements.prevAyah.classList.remove("hidden");
        elements.nextAyah.classList.remove("hidden");
        elements.quranContent.classList.remove("hidden");

        if (currentAudioEdition !== "selectAudio") {
          elements.playbackControls.classList.remove("hidden");
        }
      }

      elements.rangeControls.style.display = rangeModeEnabled ? "flex" : "none";

      if (currentSurah && currentAyah) {
        loadAyah(currentSurah, currentAyah, currentEdition);
      }
    } catch (error) {
      //console.error("خطأ في تحميل البيانات المحفوظة:", error);
      showError("خطأ في تحميل البيانات المحفوظة");
    }
  }
  updateControlsVisibility();
}

/**
 * Hide elements that should be initially hidden.
 */
function initializeHiddenElements() {
  elements.quranAudio.classList.add("hidden");
  elements.prevAyah.classList.add("hidden");
  elements.nextAyah.classList.add("hidden");
  elements.quranContent.classList.add("hidden");
  elements.playbackControls.classList.add("hidden");
}

// ----------------------- Event Listeners -----------------------

// Audio end event.
elements.quranAudio.addEventListener("ended", handleAudioEnd);

// Toggle autoplay.
elements.toggleAutoplay.addEventListener("click", () => {
  autoplayEnabled = !autoplayEnabled;
  updateToggleButton(
    elements.toggleAutoplay,
    "التشغيل التلقائي للأيات",
    autoplayEnabled
  );
  saveState();
});

// Toggle loop.
elements.toggleLoop.addEventListener("click", () => {
  loopEnabled = !loopEnabled;
  updateToggleButton(elements.toggleLoop, "تكرار الأية الحالية", loopEnabled);
  saveState();
});

// Toggle range mode.
elements.toggleRangeMode.addEventListener("click", () => {
  rangeModeEnabled = !rangeModeEnabled;
  updateToggleButton(
    elements.toggleRangeMode,
    "تحديد مجال الأيات",
    rangeModeEnabled
  );
  elements.rangeControls.style.display = rangeModeEnabled ? "flex" : "none";

  if (rangeModeEnabled) {
    // If range mode is activated, set defaults.
    elements.rangeStart.value = currentAyah || 1;
    elements.rangeEnd.value = totalAyahs;
    rangeStart = currentAyah || 1;
    rangeEnd = totalAyahs;
  }

  updateNavigationButtons(currentAyah || 1, totalAyahs);
  saveState();
});

// Set range manually.
elements.setRange.addEventListener("click", () => {
  rangeStart = parseInt(elements.rangeStart.value);
  rangeEnd = parseInt(elements.rangeEnd.value);

  if (rangeStart > rangeEnd) {
    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    elements.rangeStart.value = rangeStart;
    elements.rangeEnd.value = rangeEnd;
  }

  if (!currentAyah || currentAyah < rangeStart || currentAyah > rangeEnd) {
    loadAyah(currentSurah, rangeStart);
  } else {
    updateNavigationButtons(currentAyah, totalAyahs);
  }
  saveState();
});

// Navigate to the previous ayah.
elements.prevAyah.addEventListener("click", () => {
  const minAyah = rangeModeEnabled ? rangeStart : 1;
  if (currentAyah > minAyah) {
    loadAyah(currentSurah, currentAyah - 1);
    saveState();
  }
});

// Navigate to the next ayah.
elements.nextAyah.addEventListener("click", () => {
  const maxAyah = rangeModeEnabled ? rangeEnd : totalAyahs;
  if (currentAyah < maxAyah) {
    loadAyah(currentSurah, currentAyah + 1);
    saveState();
  }
});

// When a surah is selected.
elements.surahSelect.addEventListener("change", (e) => {
  const selectedValue = e.target.value;
  if (selectedValue && selectedValue !== "selectSurah") {
    currentSurah = parseInt(selectedValue);
    currentAyah = 1;
    loadAyah(currentSurah, currentAyah);
    saveState();
    updateControlsVisibility();
  }
});

// When a translation edition is selected.
elements.editionSelect.addEventListener("change", (e) => {
  if (e.target.value) {
    currentEdition = e.target.value;
    loadAyah(currentSurah, currentAyah);
    saveState();
  }
});

// When an audio edition is selected.
elements.audioEditionSelect.addEventListener("change", (e) => {
  if (e.target.value) {
    currentAudioEdition = e.target.value;
    loadAyah(currentSurah, currentAyah);
    saveState();
    updateControlsVisibility();
  }
});

// ----------------------- Initialization -----------------------

async function init() {
  initializeHiddenElements();
  await Promise.all([loadSurahs(), loadEditions()]);
  loadState();
}

init();
