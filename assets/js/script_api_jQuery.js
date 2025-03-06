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

// Cache DOM elements using jQuery
const elements = {
  surahSelect: $("#surahSelect"),
  editionSelect: $("#editionSelect"),
  audioEditionSelect: $("#audioEditionSelect"),
  loading: $("#loading"),
  error: $("#error"),
  arabicText: $("#arabicText"),
  translationText: $("#translationText"),
  surahInfo: $("#surahInfo"),
  ayahInfo: $("#ayahInfo"),
  quranAudio: $("#quranAudio"),
  prevAyah: $("#prevAyah"),
  nextAyah: $("#nextAyah"),
  toggleAutoplay: $("#toggleAutoplay"),
  toggleLoop: $("#toggleLoop"),
  toggleRangeMode: $("#toggleRangeMode"),
  rangeControls: $("#rangeControls"),
  rangeStart: $("#rangeStart"),
  rangeEnd: $("#rangeEnd"),
  setRange: $("#setRange"),
  goToFirstAyah: $("#goToFirstAyah"),
  goToLastAyah: $("#goToLastAyah"),
  quranContent: $("#quranContent"),
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
  elements.loading.css("display", show ? "block" : "none");
  if (show) elements.error.css("display", "none");
}

/**
 * Display an error message.
 * @param {string} message - The error message.
 */
function showError(message) {
  elements.error.text(message).css("display", "block");
  elements.loading.css("display", "none");
}

/**
 * Utility function to update toggle button text and class.
 * @param {jQuery} $button - The button jQuery element.
 * @param {string} label - The label for the button.
 * @param {boolean} isActive - Whether the toggle is active.
 */
function updateToggleButton($button, label, isActive) {
  $button
    .text(`${label}: ${isActive ? "On" : "Off"}`)
    .toggleClass("active", isActive);
}

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint.
 */
async function fetchApi(endpoint) {
  try {
    const response = await $.ajax({
      url: `${API_BASE}${endpoint}`,
      type: "GET",
      dataType: "json",
    });
    return response;
  } catch (error) {
    showError(error.message || "Network error occurred");
    throw error;
  }
}

/**
 * Load the list of surahs from the API.
 */
async function loadSurahs() {
  showLoading(true);
  try {
    const response = await fetchApi("/surah");
    $.each(response.data, function (i, surah) {
      elements.surahSelect.append(
        $("<option>")
          .val(surah.number)
          .text(`${surah.number}. ${surah.englishName} (${surah.name})`)
      );
    });
  } catch (error) {
    showError("فشل في تحميل السورة");
  }
  showLoading(false);
}

/**
 * Load text editions based on the allowed identifiers.
 */
async function loadTextEditions() {
  showLoading(true);
  try {
    const textEditions = await fetchApi("/edition?format=text");

    // Filter and add text editions by allowed identifiers
    $.each(textEditions.data, function (i, edition) {
      if (
        allowedIdentifiers.text.includes(edition.identifier) &&
        edition.identifier !== "quran-uthmani"
      ) {
        elements.editionSelect.append(
          $("<option>").val(edition.identifier).text(edition.name)
        );
      }
    });
  } catch (error) {
    showError("فشل في تحميل التفاسير");
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
      "/edition?format=audio&type=versebyverse"
    );

    // Filter and add audio editions by allowed identifiers
    $.each(audioEditions.data, function (i, edition) {
      if (allowedIdentifiers.audio.includes(edition.identifier)) {
        elements.audioEditionSelect.append(
          $("<option>").val(edition.identifier).text(edition.name)
        );
      }
    });
  } catch (error) {
    showError("فشل في تحميل التلاوات");
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
  if (state.currentSurah && state.currentSurah !== "selectSurah") {
    showLoading(true);
    try {
      // Fetch original Arabic text.
      const arabicResponse = await fetchApi(
        `/ayah/${surahNumber}:${ayahNumber}/quran-uthmani`
      );
      const arabicAyah = arabicResponse.data;
      const arabicAyahText = arabicAyah.text;

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
      elements.arabicText.html(`
      <div class="verse-container">
        <div class="arabic">${arabicAyahText}</div>
        ${
          translationText
            ? `<div class="edition-label">${translationEdition}</div>
               <div class="translation">${translationText}</div>`
            : ""
        }
      </div>
    `);

      elements.surahInfo.text(
        `Surah ${arabicAyah.surah.englishName} (${arabicAyah.surah.name})`
      );
      elements.ayahInfo.text(
        `الأية ${arabicAyah.numberInSurah} من ${arabicAyah.surah.numberOfAyahs}`
      );

      state.totalAyahs = arabicAyah.surah.numberOfAyahs;

      elements.rangeStart.off("input").on("input", validateRangeInput);
      elements.rangeEnd.off("input").on("input", validateRangeInput);

      // Load audio if an audio edition is selected.
      if (
        state.currentAudioEdition &&
        state.currentAudioEdition !== "selectAudio"
      ) {
        const audioResponse = await fetchApi(
          `/ayah/${surahNumber}:${ayahNumber}/${state.currentAudioEdition}`
        );
        elements.quranAudio.attr("src", audioResponse.data.audio);
        if (state.autoplayEnabled) {
          elements.quranAudio[0].play();
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
}

/**
 * Toggles option selects based on Surah selection
 */
function toggleOptionsBasedOnSurah() {
  const isSelected = state.currentSurah === "selectSurah";

  elements.editionSelect.prop("disabled", isSelected);
  elements.audioEditionSelect.prop("disabled", isSelected);
  elements.rangeControls.toggleClass("hidden", isSelected);

  elements.editionSelect.css("cursor", isSelected ? "not-allowed" : "pointer");
  elements.audioEditionSelect.css(
    "cursor",
    isSelected ? "not-allowed" : "pointer"
  );

  updateControlsVisibility();
}

/**
 * Validates the range input to ensure it's within valid bounds
 * @param {Event} event - The input event object
 */
function validateRangeInput(event) {
  const $input = $(event.target);
  let value = Number($input.val());
  if (value > state.totalAyahs) {
    $input.val(state.totalAyahs);
  } else if (value < 1) {
    $input.val(1);
  }
}

/**
 * Update the previous/next buttons based on the current ayah.
 * @param {number} currentNumber - The current ayah number.
 * @param {number} totalNumber - Total number of ayahs in the surah.
 */
function updateNavigationButtons(currentNumber, totalNumber) {
  if (state.rangeModeEnabled) {
    elements.prevAyah.prop("disabled", currentNumber <= state.rangeStart);
    elements.nextAyah.prop("disabled", currentNumber >= state.rangeEnd);
  } else {
    elements.prevAyah.prop("disabled", currentNumber === 1);
    elements.nextAyah.prop("disabled", currentNumber === totalNumber);
  }
}

/**
 * Update the visibility of audio and control elements.
 */
function updateControlsVisibility() {
  const surahSelected = elements.surahSelect.val() !== "selectSurah";
  const audioEditionSelected =
    elements.audioEditionSelect.val() !== "selectAudio";

  elements.quranAudio.toggleClass(
    "hidden",
    !(surahSelected && audioEditionSelected)
  );
  elements.prevAyah.toggleClass("hidden", !surahSelected);
  elements.nextAyah.toggleClass("hidden", !surahSelected);
  elements.quranContent.toggleClass("hidden", !surahSelected);
  elements.toggleAutoplay.toggleClass(
    "hidden",
    !(surahSelected && audioEditionSelected)
  );
  elements.toggleLoop.toggleClass(
    "hidden",
    !(surahSelected && audioEditionSelected)
  );
  elements.toggleRangeMode.toggleClass("hidden", !surahSelected);
  elements.goToFirstAyah.toggleClass("hidden", !surahSelected);
  elements.goToLastAyah.toggleClass("hidden", !surahSelected);
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
      elements.surahSelect.val(state.currentSurah);
      elements.editionSelect.val(state.currentEdition);
      elements.audioEditionSelect.val(state.currentAudioEdition);

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

      elements.rangeStart.val(state.rangeStart);
      elements.rangeEnd.val(state.rangeEnd);

      elements.rangeControls.css(
        "display",
        state.rangeModeEnabled ? "flex" : "none"
      );

      if (state.currentSurah && state.currentAyah) {
        loadAyah(state.currentSurah, state.currentAyah, state.currentEdition);
      }
    } catch (error) {
      showError("فشل تحميل الحالة المحفوظة");
    }
  }
  toggleOptionsBasedOnSurah();
}

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
  elements.quranAudio.on("ended", handleAudioEnd);

  elements.toggleAutoplay.on("click", function () {
    state.autoplayEnabled = !state.autoplayEnabled;
    updateToggleButton(
      elements.toggleAutoplay,
      "التشغيل التلقائي للأيات",
      state.autoplayEnabled
    );
    saveState();
  });

  elements.toggleLoop.on("click", function () {
    state.loopEnabled = !state.loopEnabled;
    updateToggleButton(
      elements.toggleLoop,
      "تكرار الأية الحالية",
      state.loopEnabled
    );
    saveState();
  });

  elements.toggleRangeMode.on("click", function () {
    state.rangeModeEnabled = !state.rangeModeEnabled;
    updateToggleButton(
      elements.toggleRangeMode,
      "تحديد مجال الأيات",
      state.rangeModeEnabled
    );
    elements.rangeControls.css(
      "display",
      state.rangeModeEnabled ? "flex" : "none"
    );

    if (state.rangeModeEnabled) {
      elements.rangeStart.val(1);
      elements.rangeEnd.val(state.totalAyahs);
      state.rangeStart = 1;
      state.rangeEnd = state.totalAyahs;
    }

    updateNavigationButtons(state.currentAyah || 1, state.totalAyahs);
    saveState();
  });

  elements.setRange.on("click", function () {
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

  elements.goToFirstAyah.on("click", function () {
    if (state.currentSurah) {
      const ayahToLoad = state.rangeModeEnabled ? state.rangeStart : 1;
      loadAyah(state.currentSurah, ayahToLoad);
    }
  });

  elements.goToLastAyah.on("click", function () {
    if (state.currentSurah) {
      const ayahToLoad = state.rangeModeEnabled
        ? state.rangeEnd
        : state.totalAyahs;
      loadAyah(state.currentSurah, ayahToLoad);
    }
  });

  elements.prevAyah.on("click", function () {
    const minAyah = state.rangeModeEnabled ? state.rangeStart : 1;
    if (state.currentAyah > minAyah) {
      loadAyah(state.currentSurah, state.currentAyah - 1);
    }
  });

  elements.nextAyah.on("click", function () {
    const maxAyah = state.rangeModeEnabled ? state.rangeEnd : state.totalAyahs;
    if (state.currentAyah < maxAyah) {
      loadAyah(state.currentSurah, state.currentAyah + 1);
    }
  });

  elements.surahSelect.on("change", function () {
    const selectedValue = $(this).val();
    if (selectedValue && selectedValue !== "selectSurah") {
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
      state.currentSurah = "selectSurah";
      state.currentAyah = null;
      elements.quranAudio[0].pause();
      elements.quranAudio[0].currentTime = 0;
    }
    toggleOptionsBasedOnSurah();
    saveState();
  });

  elements.editionSelect.on("change", function () {
    const selectedValue = $(this).val();
    if (selectedValue) {
      state.currentEdition = selectedValue;
      loadAyah(state.currentSurah, state.currentAyah);
    } else {
      state.currentEdition = "selectTafsir";
    }
    saveState();
  });

  elements.audioEditionSelect.on("change", function () {
    const selectedValue = $(this).val();
    if (selectedValue) {
      state.currentAudioEdition = selectedValue;
      loadAyah(state.currentSurah, state.currentAyah);
    } else {
      state.currentAudioEdition = "selectAudio";
    }
    updateControlsVisibility();
    saveState();
  });
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

// jQuery document ready function
$(document).ready(function () {
  init();
});
