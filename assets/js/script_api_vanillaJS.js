// API BASE URL
const API_BASE = "https://api.alquran.cloud/v1";

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
  autoPlay: document.getElementById("toggleAutoplay"),
  loop: document.getElementById("toggleLoop"),
  rangeMode: document.getElementById("toggleRangeMode"),
  quranContent: document.getElementById("quranContent"),
};

// Define allowed identifiers for both text and audio
const allowedIdentifiers = {
  text: [
    "ar.baghawi",
    "ar.jalalayn",
    "ar.miqbas",
    "ar.muyassar",
    "ar.qurtubi",
    "ar.waseet",
    "quran-uthmani",
  ],
  audio: [
    "ar.abdullahbasfar",
    "ar.abdulsamad",
    "ar.abdurrahmaansudais",
    "ar.ahmedajamy",
    "ar.alafasy",
    "ar.aymanswoaid",
    "ar.hanirifai",
    "ar.hudhaify",
    "ar.husary",
    "ar.husarymujawwad",
    "ar.ibrahimakhbar",
    "ar.mahermuaiqly",
    "ar.muhammadayyoub",
    "ar.muhammadjibreel",
    "ar.saoodshuraym",
    "ar.shaatree",
  ],
};

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
 * Load specific text and audio editions based on the allowed identifiers.
 */
async function loadEditions() {
  showLoading(true);
  try {
    const [textEditions, audioEditions] = await Promise.all([
      fetchApi("/edition?format=text"),
      fetchApi("/edition?format=audio&type=versebyverse"),
    ]);

    // Filter and add text editions by allowed identifiers
    textEditions.data
      .filter(
        (edition) =>
          allowedIdentifiers.text.includes(edition.identifier) &&
          edition.identifier !== "quran-uthmani"
      )
      .forEach((edition) => {
        const option = new Option(edition.name, edition.identifier);
        elements.editionSelect.add(option);
      });

    // Filter and add audio editions by allowed identifiers
    audioEditions.data
      .filter((edition) =>
        allowedIdentifiers.audio.includes(edition.identifier)
      )
      .forEach((edition) => {
        const option = new Option(edition.name, edition.identifier);
        elements.audioEditionSelect.add(option);
      });
  } catch (error) {
    showError("فشل في تحميل البيانات");
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
    showError("فشل في تحميل السورة");
  }
  showLoading(false);
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
  edition = state.currentEdition
) {
  showLoading(true);
  try {
    // Fetch original Arabic text.
    const arabicResponse = await fetchApi(
      `/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`
    );
    const arabicAyah = arabicResponse.data;
    let arabicAyahText = "";
    arabicAyahText = arabicAyah.text;

    // Fetch translation if applicable.
    let translationText = "";
    let translationEdition = "";
    if (edition && edition !== "selectTafsir") {
      const translationResponse = await fetchApi(
        `/ayah/${surahNumber}:${ayahNumber}/${edition}`
      );
      translationText = translationResponse.data.text;
      translationEdition = translationResponse.data.edition.name;
    }

    // Update the display.
    elements.arabicText.innerHTML = `
            <div class="verse-container">
              <div class="arabic">${arabicAyahText}</div>
              ${
                translationText
                  ? `<div class="edition-label">${translationEdition}</div>
                     <div class="translation">${translationText}</div>`
                  : ""
              }
            </div>
          `;
    elements.surahInfo.textContent = `Surah ${arabicAyah.surah.englishName} (${arabicAyah.surah.name})`;
    elements.ayahInfo.textContent = `الأية ${arabicAyah.numberInSurah} من ${arabicAyah.surah.numberOfAyahs}`;

    state.totalAyahs = arabicAyah.surah.numberOfAyahs;
    elements.rangeStart.addEventListener("input", validateRangeInput);
    elements.rangeEnd.addEventListener("input", validateRangeInput);

    // Load audio if an audio edition is selected.
    if (
      state.currentAudioEdition &&
      state.currentAudioEdition !== "selectAudio"
    ) {
      const audioResponse = await fetchApi(
        `/ayah/${surahNumber}:${ayahNumber}/${state.currentAudioEdition}`
      );
      elements.quranAudio.src = audioResponse.data.audio;
      if (state.autoplayEnabled) {
        elements.quranAudio.play();
      }
    }

    updateNavigationButtons(
      arabicAyah.numberInSurah,
      arabicAyah.surah.numberOfAyahs
    );

    // Update state and save.
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
 * Update the previous/next buttons based on the current ayah.
 * @param {number} currentNumber - The current ayah number.
 * @param {number} totalNumber - Total number of ayahs in the surah.
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
 * Handle the audio element's ended event.
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
 * Save the current state to localStorage.
 */
function saveState() {
  localStorage.setItem("Al-Munir_State", JSON.stringify(state));
}

/**
 * Load the saved state from localStorage.
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
 * Hide elements that should be initially hidden.
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
