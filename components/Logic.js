// FILE: components/Logic.js
"use strict";
import Sortable from "sortablejs";
import { FIELD_ICONS } from "./Icons";
import { getSupabase } from "../lib/supabase";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../lib/cloudinary";
import {
  generateThemeFromColor,
  applyThemeToElement,
  clearThemeFromElement,
  themePreviewGradient,
  hexToHsl,
  hslToHex,
  THEME_PRESETS,
} from "../lib/colorUtils";

const getDb = () => getSupabase();

const TEMP_KEY = "charSheet_temp_v12";
const DEFAULT_SW = 2000,
  DEFAULT_SH = 4000,
  DEFAULT_PW = 860,
  DEFAULT_PH = 3000;
const MIN_SW = 1200,
  MIN_SH = 1400,
  MIN_PW = 300,
  MIN_PH = 400;
const MAX_SW = 4000,
  MAX_SW_DUAL = 6000,
  MAX_SH = 12000,
  MAX_PW = 2400,
  MAX_PH = 10000;
const AUTOSAVE_INTERVAL = 30000;
const SAVE_DEBOUNCE = 600;
const DEFAULT_COLOR = "#c49050";
const DUAL_MIN_SW = 2800;

const FIELD_IDS = [
  "header-name-input",
  "field-age",
  "field-birth",
  "field-nation",
  "field-clan",
  "field-nature",
  "field-occupation",
  "field-history",
  "erythrogen-value",
];

const DUAL_FIELD_IDS = [
  "header-name-input-right",
  "field-r-age",
  "field-r-birth",
  "field-r-nation",
  "field-r-clan",
  "field-r-nature",
  "field-r-occupation",
  "field-r-history",
  "erythrogen-value-right",
];
const MIN_SCALE = 0.03;
const MAX_SCALE = 5;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

const RANKS = [
  { letter: "D", name: "Латентный", range: "0 — 499", min: 0, cls: "rc-d" },
  { letter: "C", name: "Средний", range: "500 — 999", min: 500, cls: "rc-c" },
  {
    letter: "B",
    name: "Продвинутый",
    range: "1000 — 1999",
    min: 1000,
    cls: "rc-b",
  },
  { letter: "A", name: "Высший", range: "2000 — 3499", min: 2000, cls: "rc-a" },
  {
    letter: "S",
    name: "Легендарный",
    range: "3500 — 4999",
    min: 3500,
    cls: "rc-s",
  },
  {
    letter: "S+",
    name: "Запредельный",
    range: "5000+",
    min: 5000,
    cls: "rc-ss",
  },
  { letter: "G", name: "Бог", range: "6000+", min: 6000, cls: "rc-g" },
];

const HIDEABLE = {
  age: "Возраст",
  birth: "Дата рождения",
  nation: "Национальность",
  clan: "Род / Клан",
  nature: "Кем является",
  occupation: "Чем занимается",
  erythrogen: "Уровень Эритрогенов",
  "divider-ery": "Разделитель (эритрогены)",
  history: "История",
};

let _initialized = false;
let _fontInitialized = false;
let _zoomInitialized = false;
let _deleteInitialized = false;
let _restoreInitialized = false;
let _rolesInitialized = false;
let _colorPickerInitialized = false;
let _dualInitialized = false;
let _buttonsInitialized = false;
let _addFieldInitialized = false;
let _dividerInitialized = false;
let _themeInitialized = false;
let _shortcutsInitialized = false;
let _resetting = false;

const ROLE_DISPLAY_NAMES = {
  "": "Стандартная",
  "role-hero": "Главный герой",
  "role-antagonist": "Антагонист",
  "role-deuteragonist": "Дейтерагонист",
  "role-tritagonist": "Тритагонист",
  "role-secondary": "Второстепенный",
  "role-mentor": "Наставник",
  "role-sidekick": "Помощник / Сайдкик",
  "role-antihero": "Антигерой",
  "role-catalyst": "Катализатор",
  "role-episodic": "Эпизодический",
  "role-background": "Фоновый",
  "role-neutral": "Нейтральный",
};

function updateRoleBadge() {
  const textEl = $("role-badge-text");
  const badgeEl = $("role-badge-sheet");
  if (!textEl || !badgeEl) return;

  // Если есть кастомный текст — используем его, иначе автоматический
  const label =
    S.roleBadgeCustomText || ROLE_DISPLAY_NAMES[S.role || ""] || "Стандартная";
  if (textEl.textContent !== label) textEl.textContent = label;
  badgeEl.style.display = "flex";

  // Размер бейджика — и текст, и поле редактирования
  const size = (S.roleBadgeFontSize || 24) + "px";
  textEl.style.fontSize = size;
  const editInput = $("role-badge-edit-input");
  if (editInput) editInput.style.fontSize = size;
}

const S = {
  scale: 1,
  tx: 0,
  ty: 0,
  panDrag: false,
  panSX: 0,
  panSY: 0,
  panSTX: 0,
  panSTY: 0,
  sheetW: DEFAULT_SW,
  sheetH: DEFAULT_SH,
  portW: DEFAULT_PW,
  portH: DEFAULT_PH,
  port: {
    src: "",
    x: 0,
    y: 0,
    sc: 1,
    nw: 0,
    nh: 0,
    drag: false,
    sx: 0,
    sy: 0,
    stx: 0,
    sty: 0,
  },
  bg: {
    src: "",
    x: 0,
    y: 0,
    sc: 1,
    nw: 0,
    nh: 0,
    drag: false,
    sx: 0,
    sy: 0,
    stx: 0,
    sty: 0,
  },
  hiddenFields: new Set(),
  customFields: [],
  customCounter: 0,
  dividerCounter: 0,
  customFields2: [],
  hiddenFields2: new Set(),
  fieldOrder2: [],
  role: "",
  fieldOrder: [],
  labelFontSize: 26,
  inputFontSize: 42,
  nameFontSize: 80,
  eryFontSize: 64,
  rankNameFontSize: 32,
  rankRangeFontSize: 26,
  eryHintVisible: true,
  eryHintVisible2: true,
  currentCharacterId: null,
  autoSaveTimer: null,
  _savedFields: {},
  _sortable: null,
  _sortable2: null,
  _fieldsRendered: false,
  customColor: "",
  theme: null,
  dualMode: false,
  port2: {
    src: "",
    x: 0,
    y: 0,
    sc: 1,
    nw: 0,
    nh: 0,
    drag: false,
    sx: 0,
    sy: 0,
    stx: 0,
    sty: 0,
  },
  _savedFields2: {},
  _saveDebounce: null,
  _resizeObserver: null,
  // Бейджик роли
  roleBadgeCustomText: "",
  roleBadgeFontSize: 24,
  // Настройки темы
  themeGradient: true,
  themeOpacity: 0.94,
};

const $ = (id) => document.getElementById(id);

// ============================================================
// РЕЕСТР СЛУШАТЕЛЕЙ
// Раньше initApp() навешивал window-слушатели заново при каждом
// монтировании страницы (StrictMode / повторный вход в редактор),
// они накапливались и mousemove начинал дёргать десятки хендлеров.
// Теперь всё снимается в resetAppInit().
// ============================================================
let _listeners = [];

function on(target, type, handler, opts) {
  if (!target) return;
  target.addEventListener(type, handler, opts);
  _listeners.push([target, type, handler, opts]);
}

function offAll() {
  _listeners.forEach(([t, ty, h, o]) => {
    try {
      t.removeEventListener(ty, h, o);
    } catch {}
  });
  _listeners = [];
}

// ============================================================
// rAF-БАТЧИНГ
// Все визуальные обновления (pan/zoom/drag/resize) сводятся
// к одной записи в стиль за кадр => стабильные 60 FPS.
// ============================================================
const _rafJobs = new Map();
let _rafId = 0;

function scheduleFrame(key, fn) {
  _rafJobs.set(key, fn);
  if (_rafId) return;
  _rafId = requestAnimationFrame(() => {
    _rafId = 0;
    const jobs = Array.from(_rafJobs.values());
    _rafJobs.clear();
    for (let i = 0; i < jobs.length; i++) {
      try {
        jobs[i]();
      } catch (e) {
        console.warn("frame job error:", e);
      }
    }
  });
}

function cancelFrames() {
  if (_rafId) cancelAnimationFrame(_rafId);
  _rafId = 0;
  _rafJobs.clear();
}

// Пометка «идёт взаимодействие» — включает will-change только на время жеста
let _interactCount = 0;
let _interactRelease = null;

function beginInteract(el) {
  _interactCount++;
  el?.classList.add("is-interacting");
  document.body.classList.add("is-dragging");
  if (_interactRelease) {
    clearTimeout(_interactRelease);
    _interactRelease = null;
  }
}

function endInteract(el) {
  _interactCount = Math.max(0, _interactCount - 1);
  if (_interactCount > 0) return;
  if (_interactRelease) clearTimeout(_interactRelease);
  // небольшая задержка: подряд идущие жесты не дёргают слой туда-сюда
  _interactRelease = setTimeout(() => {
    _interactRelease = null;
    document.body.classList.remove("is-dragging");
    document
      .querySelectorAll(".is-interacting")
      .forEach((n) => n.classList.remove("is-interacting"));
  }, 180);
  if (el) {
    /* класс снимет таймер выше */
  }
}

let sheet,
  canvasArea,
  zoomLabel,
  bgLayer,
  portArea,
  portWrapper,
  portImg,
  portPH,
  portHint,
  portColEl,
  resizeHandle,
  roleSelect,
  fieldsList;

// ============================================================
// INIT
// ============================================================

export function initApp() {
  sheet = $("sheet");
  canvasArea = $("canvas-area");
  zoomLabel = $("zoom-label");
  bgLayer = $("sheet-bg-layer");
  portArea = $("portrait-area");
  portWrapper = $("portrait-wrapper");
  portImg = $("portrait-img");
  portPH = $("portrait-placeholder");
  portHint = $("portrait-hint");
  portColEl = $("portrait-column");
  resizeHandle = $("sheet-resize-handle");
  roleSelect = $("role-select");
  fieldsList = $("fields-list");

  const required = [
    sheet,
    canvasArea,
    zoomLabel,
    bgLayer,
    portArea,
    portWrapper,
    portImg,
    portPH,
    portHint,
    portColEl,
    resizeHandle,
    roleSelect,
    fieldsList,
  ];

  if (required.some((x) => !x)) {
    console.warn("initApp: DOM ещё не готов");
    _initialized = false;
    return;
  }

  if (_initialized) return;
  _initialized = true;

  loadState();
  applySheetSize();
  applyPortraitSize();
  applyFontSizes();
  injectFieldIcons();
  applyCustomColor();

  initPointerHandlers();
  initPan();
  initZoom();
  initPortrait();
  initBackground();
  initSheetResize();
  initSheetResizeX();
  initPortraitResizeX();
  initPortraitResizeY();
  initErythrogen();
  initDeleteButtons();
  initAddField();
  initAddDivider();
  initRestoreFields();
  initRoles();
  initColorPicker();
  initThemePanel();
  initFontSizeControls();
  initButtons();
  initDualModeToggle();
  initRoleBadgeEditor();
  initAutoGrowTextareas();
  initKeyboardShortcuts();

  restoreAll();
  // Применяем dual mode после восстановления всех данных
  if (S.dualMode) {
    applyDualMode();
  }
  initDragAndDrop();

  // Вписываем лист ПОСЛЕ того, как размеры/dual-режим окончательно применены
  fitToScreen();

  startAutoSave();
  updateRoleBadge();

  // Сохраняем состояние при уходе со страницы, а не только по таймеру
  on(window, "beforeunload", () => saveTempState());
  on(document, "visibilitychange", () => {
    if (document.visibilityState === "hidden") saveTempState();
  });
  on(window, "resize", () => scheduleFrame("winresize", clampViewToBounds));
}

export function resetAppInit() {
  _initialized = false;
  _fontInitialized = false;
  _zoomInitialized = false;
  _deleteInitialized = false;
  _restoreInitialized = false;
  _rolesInitialized = false;
  _colorPickerInitialized = false;
  _dualInitialized = false;
  _buttonsInitialized = false;
  _addFieldInitialized = false;
  _dividerInitialized = false;

  _themeInitialized = false;
  _shortcutsInitialized = false;

  if (S.autoSaveTimer) {
    clearInterval(S.autoSaveTimer);
    S.autoSaveTimer = null;
  }
  if (S._saveDebounce) {
    clearTimeout(S._saveDebounce);
    S._saveDebounce = null;
  }

  if (S._sortable) {
    try {
      S._sortable.destroy();
    } catch {}
    S._sortable = null;
  }
  if (S._sortable2) {
    try {
      S._sortable2.destroy();
    } catch {}
    S._sortable2 = null;
  }

  if (S._resizeObserver) {
    try {
      S._resizeObserver.disconnect();
    } catch {}
    S._resizeObserver = null;
  }

  cancelFrames();
  offAll();
}

// ============================================================
// AUTOSAVE / TEMP STATE
// ============================================================

function startAutoSave() {
  if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
  S.autoSaveTimer = setInterval(() => saveTempState(), AUTOSAVE_INTERVAL);
}

function saveTempState() {
  if (_resetting) return;
  if (S._saveDebounce) {
    clearTimeout(S._saveDebounce);
    S._saveDebounce = null;
  }
  try {
    sessionStorage.setItem(TEMP_KEY, JSON.stringify(collectState()));
  } catch (e) {
    // QuotaExceeded — чаще всего из-за data-url портрета/фона.
    // Пробуем сохранить без картинок, чтобы не потерять текст анкеты.
    try {
      const light = collectState();
      if (light.port && isDataUrl(light.port.src)) light.port.src = "";
      if (light.bg && isDataUrl(light.bg.src)) light.bg.src = "";
      sessionStorage.setItem(TEMP_KEY, JSON.stringify(light));
    } catch {
      console.warn("saveTempState: не удалось сохранить черновик", e);
    }
  }
}

/**
 * Отложенное сохранение: во время ввода/перетаскивания не сериализуем
 * всё состояние на каждое событие.
 */
function saveTempStateSoon(delay = SAVE_DEBOUNCE) {
  if (S._saveDebounce) clearTimeout(S._saveDebounce);
  S._saveDebounce = setTimeout(() => {
    S._saveDebounce = null;
    saveTempState();
  }, delay);
}

// ============================================================
// COLLECT STATE
// ============================================================

function collectState() {
  // Синхронизируем значения пользовательских полей из DOM
  const syncCustom = (list, store) => {
    list?.querySelectorAll(".custom-field-row").forEach((row) => {
      const id = row.dataset.fieldId;
      const inp = row.querySelector("input,textarea");
      const cf = store.find((f) => f.id === id);
      if (cf && inp) cf.value = inp.value;
    });
  };
  syncCustom(fieldsList, S.customFields);
  syncCustom($("fields-list-right"), S.customFields2);

  updateFieldOrder();
  updateFieldOrder2();

  return {
    sheetW: S.sheetW,
    sheetH: S.sheetH,
    portW: S.portW,
    portH: S.portH,
    fields: getFieldValues(),
    // Данные второго персонажа сохраняем ВСЕГДА: при выключенной
    // двойной анкете они раньше просто стирались
    fields2: getDualFieldValues(),
    hidden: [...S.hiddenFields],
    hidden2: [...S.hiddenFields2],
    customFields: S.customFields.map((f) => ({ ...f })),
    customFields2: S.customFields2.map((f) => ({ ...f })),
    customCounter: S.customCounter,
    dividerCounter: S.dividerCounter,
    role: S.role,
    customColor: S.customColor,
    fieldOrder: S.fieldOrder,
    fieldOrder2: S.fieldOrder2,
    labelFontSize: S.labelFontSize,
    inputFontSize: S.inputFontSize,
    nameFontSize: S.nameFontSize,
    eryFontSize: S.eryFontSize,
    rankNameFontSize: S.rankNameFontSize,
    rankRangeFontSize: S.rankRangeFontSize,
    eryHintVisible: S.eryHintVisible,
    eryHintVisible2: S.eryHintVisible2,
    themeGradient: S.themeGradient,
    themeOpacity: S.themeOpacity,
    dualMode: S.dualMode,
    currentCharacterId: S.currentCharacterId,
    roleBadgeCustomText: S.roleBadgeCustomText,
    roleBadgeFontSize: S.roleBadgeFontSize,
    port: {
      src: S.port.src === "loading" ? "" : S.port.src,
      x: S.port.x,
      y: S.port.y,
      sc: S.port.sc,
      nw: S.port.nw,
      nh: S.port.nh,
    },
    bg: {
      src: S.bg.src,
      x: S.bg.x,
      y: S.bg.y,
      sc: S.bg.sc,
      nw: S.bg.nw,
      nh: S.bg.nh,
    },
  };
}

// ============================================================
// DRAG & DROP
// ============================================================

function initDragAndDrop() {
  if (!fieldsList) return;

  const baseOpts = {
    animation: 150,
    handle: ".field-icon-wrap",
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    // Порог избавляет от «случайных» перетаскиваний при клике
    fallbackTolerance: 4,
    // Во время сортировки гасим переходы — сортировка не «дрожит»
    onStart() {
      document.body.classList.add("is-dragging");
    },
  };

  // Левая колонка (или единственная в одиночном режиме)
  if (S._sortable) {
    try {
      S._sortable.destroy();
    } catch {}
    S._sortable = null;
  }
  S._sortable = new Sortable(fieldsList, {
    ...baseOpts,
    onEnd() {
      document.body.classList.remove("is-dragging");
      updateFieldOrder();
      saveTempState();
    },
  });

  // Правая колонка (только в dual mode)
  if (S._sortable2) {
    try {
      S._sortable2.destroy();
    } catch {}
    S._sortable2 = null;
  }
  const rightList = $("fields-list-right");
  if (rightList) {
    S._sortable2 = new Sortable(rightList, {
      ...baseOpts,
      onEnd() {
        document.body.classList.remove("is-dragging");
        updateFieldOrder2();
        saveTempState();
      },
    });
  }
}

function updateFieldOrder() {
  if (!fieldsList) return;
  S.fieldOrder = Array.from(fieldsList.children)
    .map((el) => el.dataset.fieldId)
    .filter(Boolean);
}

function updateFieldOrder2() {
  const rightList = $("fields-list-right");
  if (!rightList) return;
  S.fieldOrder2 = Array.from(rightList.children)
    .map((el) => el.dataset.fieldId)
    .filter(Boolean);
}

/** Переупорядочивание одной вставкой в DocumentFragment — без layout-трэшинга. */
function reorderInto(list, order) {
  if (!list || !order?.length) return;
  const frag = document.createDocumentFragment();
  const seen = new Set();
  order.forEach((id) => {
    const el = list.querySelector(`[data-field-id="${cssEscape(id)}"]`);
    if (el && !seen.has(el)) {
      seen.add(el);
      frag.appendChild(el);
    }
  });
  // Элементы, которых нет в сохранённом порядке, остаются в конце
  Array.from(list.children).forEach((el) => {
    if (!seen.has(el)) frag.appendChild(el);
  });
  list.appendChild(frag);
}

function applyFieldOrder() {
  reorderInto(fieldsList, S.fieldOrder);
}

function applyFieldOrder2() {
  reorderInto($("fields-list-right"), S.fieldOrder2);
}

// ============================================================
// FONT SIZE CONTROLS
// ============================================================

function initFontSizeControls() {
  if (_fontInitialized) return;
  _fontInitialized = true;
  const modal = $("font-modal");
  if (!modal) return;

  on($("font-settings-btn"), "click", () => openModal(modal));
  bindModal(modal, $("font-modal-close"));

  setupSlider("name-font-size", "name-font-val", "nameFontSize");
  setupSlider("label-font-size", "label-font-val", "labelFontSize");
  setupSlider("input-font-size", "input-font-val", "inputFontSize");
  setupSlider("ery-font-size", "ery-font-val", "eryFontSize");
  setupSlider("rank-name-font-size", "rank-name-font-val", "rankNameFontSize");
  setupSlider(
    "rank-range-font-size",
    "rank-range-font-val",
    "rankRangeFontSize",
  );
  setupSlider(
    "badge-font-size",
    "badge-font-val",
    "roleBadgeFontSize",
    updateRoleBadge,
  );
}

function setupSlider(sliderId, valId, stateKey, extraCb) {
  const slider = $(sliderId);
  const valEl = $(valId);
  if (!slider) return;

  // Синхронизируем ползунок с состоянием, но в пределах min/max разметки
  const min = parseInt(slider.min, 10) || 0;
  const max = parseInt(slider.max, 10) || 999;
  S[stateKey] = clamp(Number(S[stateKey]) || min, min, max);
  slider.value = S[stateKey];
  if (valEl) valEl.textContent = S[stateKey] + "px";

  on(slider, "input", () => {
    S[stateKey] = clamp(parseInt(slider.value, 10), min, max);
    if (valEl) valEl.textContent = S[stateKey] + "px";
    applyFontSizes();
    extraCb?.();
    saveTempStateSoon();
  });
}

function applyFontSizes() {
  scheduleFrame("fonts", () => {
    const r = document.documentElement;
    r.style.setProperty("--name-font-size", S.nameFontSize + "px");
    r.style.setProperty("--label-font-size", S.labelFontSize + "px");
    r.style.setProperty("--input-font-size", S.inputFontSize + "px");
    r.style.setProperty("--ery-font-size", S.eryFontSize + "px");
    r.style.setProperty("--rank-name-font-size", S.rankNameFontSize + "px");
    r.style.setProperty("--rank-range-font-size", S.rankRangeFontSize + "px");
    r.style.setProperty("--badge-font-size", S.roleBadgeFontSize + "px");
    // Высота textarea зависит от кегля
    sheet?.querySelectorAll("textarea").forEach(autoGrow);
  });
}

// ============================================================
// ROLE BADGE EDITOR
// ============================================================

function initRoleBadgeEditor() {
  const textEl = $("role-badge-text");
  const editInput = $("role-badge-edit-input");
  if (!textEl || !editInput) return;

  function startEdit() {
    editInput.value = S.roleBadgeCustomText || textEl.textContent.trim();
    textEl.style.display = "none";
    editInput.style.display = "inline-block";
    editInput.focus();
    editInput.select();
  }

  // Двойной клик по тексту ИЛИ по самому бейджу — раньше срабатывал
  // только по тексту, и попасть по нему было тяжело
  on(textEl, "dblclick", (e) => {
    e.stopPropagation();
    startEdit();
  });
  on($("role-badge-inner"), "dblclick", (e) => {
    if (e.target === editInput) return;
    e.stopPropagation();
    startEdit();
  });

  let cancelled = false;

  function finishEdit() {
    if (editInput.style.display === "none") return;
    editInput.style.display = "none";
    textEl.style.display = "";
    if (cancelled) {
      cancelled = false;
      return;
    }
    const val = editInput.value.trim();
    const auto = ROLE_DISPLAY_NAMES[S.role || ""] || "Стандартная";
    S.roleBadgeCustomText = val && val !== auto ? val : "";
    updateRoleBadge();
    saveTempStateSoon(0);
  }

  on(editInput, "blur", finishEdit);
  on(editInput, "keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      finishEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelled = true;
      editInput.blur();
    }
  });
}

// ============================================================
// CUSTOM COLOR
// ============================================================

function applyCustomColor() {
  if (!sheet) return;

  if (S.customColor) {
    S.theme = generateThemeFromColor(S.customColor, {
      gradient: S.themeGradient,
      opacity: S.themeOpacity,
    });
    applyThemeToElement(sheet, S.theme);
    // Ролевые классы не должны конкурировать с кастомной темой
    Array.from(sheet.classList)
      .filter((c) => c.startsWith("role-"))
      .forEach((c) => sheet.classList.remove(c));
    sheet.classList.add("custom-theme");
  } else {
    sheet.classList.remove("custom-theme");
    S.theme = null;
    clearThemeFromElement(sheet);
    if (S.role) applyRole(S.role);
  }

  updateRoleBadge();
}

// ============================================================
// SIZES & VIEW
// ============================================================

function injectFieldIcons() {
  document.querySelectorAll(".field-icon-wrap[data-icon]").forEach((el) => {
    const k = el.dataset.icon;
    if (FIELD_ICONS[k]) el.innerHTML = FIELD_ICONS[k];
  });
}

function applySheetSize() {
  scheduleFrame("sheetSize", () => {
    sheet.style.width = S.sheetW + "px";
    sheet.style.height = S.sheetH + "px";
  });
}

function applyPortraitSize() {
  scheduleFrame("portSize", () => {
    portColEl.style.width = S.portW + "px";
    portArea.style.height = S.portH + "px";
    const grid = $("main-grid");
    const scrollWrap = $("scroll-wrap");
    if (S.dualMode) {
      // Синхронизируем обе сетки: контент и шапку
      if (grid) grid.style.gridTemplateColumns = `1fr ${S.portW}px 1fr`;
      if (scrollWrap)
        scrollWrap.style.gridTemplateColumns = `1fr ${S.portW}px 1fr`;
    } else {
      // Иначе после выхода из dual-режима остаются инлайновые колонки
      if (grid) grid.style.gridTemplateColumns = "";
      if (scrollWrap) scrollWrap.style.gridTemplateColumns = "";
    }
  });
}

function applyView() {
  scheduleFrame("view", () => {
    sheet.style.transform = `translate3d(${S.tx}px,${S.ty}px,0) scale(${S.scale})`;
    const pct = Math.round(S.scale * 100) + "%";
    if (zoomLabel.textContent !== pct) zoomLabel.textContent = pct;
  });
}

function fitToScreen() {
  const vw = canvasArea.clientWidth || window.innerWidth;
  const vh = canvasArea.clientHeight || window.innerHeight;
  if (!S.sheetW || !S.sheetH) return;
  const sc = clamp(Math.min(vw / S.sheetW, vh / S.sheetH) * 0.88, MIN_SCALE, MAX_SCALE);
  S.scale = sc;
  S.tx = (vw - S.sheetW * sc) / 2;
  S.ty = (vh - S.sheetH * sc) / 2;
  applyView();
}

/**
 * Не даём «улететь» листу полностью за пределы вьюпорта
 * (частый баг: лист теряется и приходится жать «Вписать»).
 */
function clampViewToBounds() {
  const vw = canvasArea.clientWidth;
  const vh = canvasArea.clientHeight;
  if (!vw || !vh) return;
  const w = S.sheetW * S.scale;
  const h = S.sheetH * S.scale;
  const margin = 120;
  S.tx = clamp(S.tx, -w + margin, vw - margin);
  S.ty = clamp(S.ty, -h + margin, vh - margin);
  applyView();
}

// ============================================================
// ЕДИНАЯ СИСТЕМА ЖЕСТОВ (pointer events)
// ------------------------------------------------------------
// Раньше на window висело 6 независимых mousemove-слушателей,
// каждый писал в style напрямую => layout thrashing и просадки
// FPS. Теперь активен ровно один жест, обновление — раз в кадр,
// поддерживаются мышь / стилус / тач.
// ============================================================

let _gesture = null;

function startGesture(e, gesture) {
  if (_gesture) endGesture();
  _gesture = gesture;
  gesture.pointerId = e.pointerId;
  beginInteract(gesture.el);
  if (gesture.cursor) document.body.style.cursor = gesture.cursor;
}

function endGesture() {
  if (!_gesture) return;
  const g = _gesture;
  _gesture = null;
  document.body.style.cursor = "";
  endInteract(g.el);
  try {
    g.onEnd?.();
  } catch (err) {
    console.warn("gesture end error:", err);
  }
}

function initPointerHandlers() {
  on(
    window,
    "pointermove",
    (e) => {
      if (!_gesture) return;
      if (_gesture.pointerId !== undefined && e.pointerId !== _gesture.pointerId)
        return;
      // Кнопку отпустили вне окна — корректно завершаем жест
      if (e.buttons === 0 && e.pointerType === "mouse") {
        endGesture();
        return;
      }
      const g = _gesture;
      scheduleFrame("gesture", () => {
        if (_gesture !== g) return;
        g.onMove(e);
      });
    },
    { passive: true },
  );

  const stop = () => endGesture();
  on(window, "pointerup", stop);
  on(window, "pointercancel", stop);
  on(window, "blur", stop);
}

// ============================================================
// PAN & ZOOM
// ============================================================

function initPan() {
  on(canvasArea, "pointerdown", (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    // Средней кнопкой панорамируем даже поверх листа
    if (e.button === 0 && e.target.closest("#sheet")) return;
    const sx = e.clientX;
    const sy = e.clientY;
    const stx = S.tx;
    const sty = S.ty;
    canvasArea.classList.add("grabbing");
    startGesture(e, {
      el: sheet,
      onMove(ev) {
        S.tx = stx + (ev.clientX - sx);
        S.ty = sty + (ev.clientY - sy);
        applyView();
      },
      onEnd() {
        canvasArea.classList.remove("grabbing");
        clampViewToBounds();
      },
    });
  });

  on(
    canvasArea,
    "wheel",
    (e) => {
      if (e.target.closest(".portrait-area") || e.target.closest("#sheet-bg-layer"))
        return;
      e.preventDefault();
      // Плавный зум, не зависящий от «шага» колеса разных устройств
      const delta = clamp(e.deltaY, -120, 120);
      const f = Math.pow(0.9988, delta * (e.deltaMode === 1 ? 16 : 1));
      const ns = clamp(S.scale * f, MIN_SCALE, MAX_SCALE);
      if (ns === S.scale) return;
      const rect = canvasArea.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const sx = (mx - S.tx) / S.scale;
      const sy = (my - S.ty) / S.scale;
      S.scale = ns;
      S.tx = mx - sx * ns;
      S.ty = my - sy * ns;
      beginInteract(sheet);
      applyView();
      endInteract(sheet);
    },
    { passive: false },
  );
}

function initZoom() {
  if (_zoomInitialized) return;
  _zoomInitialized = true;
  on($("zoom-in-btn"), "click", () => zoomC(1.18));
  on($("zoom-out-btn"), "click", () => zoomC(0.84));
  on($("zoom-fit-btn"), "click", fitToScreen);
}

function zoomC(f) {
  const cx = canvasArea.clientWidth / 2;
  const cy = canvasArea.clientHeight / 2;
  const ns = clamp(S.scale * f, MIN_SCALE, MAX_SCALE);
  if (ns === S.scale) return;
  const sx = (cx - S.tx) / S.scale;
  const sy = (cy - S.ty) / S.scale;
  S.scale = ns;
  S.tx = cx - sx * ns;
  S.ty = cy - sy * ns;
  applyView();
}

// ============================================================
// PORTRAIT
// ============================================================

function initPortrait() {
  const input = $("portrait-input");

  on(portArea, "click", (e) => {
    if (e.target.closest("#portrait-actions")) return;
    if (S.port.src && S.port.src !== "loading") return;
    if (e.target === portImg) return;
    input.click();
  });

  on(input, "change", (e) => {
    const file = e.target.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Файл не является изображением", true);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast("Файл слишком большой (макс. 50 МБ)", true);
      return;
    }
    S.port.src = "loading";
    setPlaceholderText("Загрузка...");
    loadPortraitFile(file);
  });

  on(portImg, "pointerdown", (e) => {
    if (!S.port.src || S.port.src === "loading") return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const stx = S.port.x;
    const sty = S.port.y;
    portImg.classList.add("grabbing");
    startGesture(e, {
      el: portImg,
      onMove(ev) {
        S.port.x = stx + (ev.clientX - sx) / S.scale;
        S.port.y = sty + (ev.clientY - sy) / S.scale;
        applyPortTransform();
      },
      onEnd() {
        portImg.classList.remove("grabbing");
        saveTempStateSoon();
      },
    });
  });

  on(
    portArea,
    "wheel",
    (e) => {
      if (!S.port.src || S.port.src === "loading") return;
      e.preventDefault();
      e.stopPropagation();
      const delta = clamp(e.deltaY, -120, 120);
      const f = Math.pow(0.999, delta * (e.deltaMode === 1 ? 16 : 1));
      const ns = clamp(S.port.sc * f, 0.02, 30);
      if (ns === S.port.sc) return;
      const rect = portArea.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / S.scale;
      const my = (e.clientY - rect.top) / S.scale;
      const px = (mx - S.port.x) / S.port.sc;
      const py = (my - S.port.y) / S.port.sc;
      S.port.sc = ns;
      S.port.x = mx - px * ns;
      S.port.y = my - py * ns;
      beginInteract(portImg);
      applyPortTransform();
      endInteract(portImg);
      saveTempStateSoon();
    },
    { passive: false },
  );

  // Загрузка портрета перетаскиванием файла
  on(portArea, "dragover", (e) => {
    e.preventDefault();
    portArea.classList.add("drop-hover");
  });
  on(portArea, "dragleave", () => portArea.classList.remove("drop-hover"));
  on(portArea, "drop", (e) => {
    e.preventDefault();
    portArea.classList.remove("drop-hover");
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) {
      showToast("Файл слишком большой (макс. 50 МБ)", true);
      return;
    }
    S.port.src = "loading";
    setPlaceholderText("Загрузка...");
    loadPortraitFile(file);
  });

  initPortraitButtons();
}

/** Безопасно меняет текст плейсхолдера портрета (span мог быть удалён). */
function setPlaceholderText(text) {
  if (!portPH) return;
  let span = portPH.querySelector("span");
  if (!span) {
    span = document.createElement("span");
    portPH.appendChild(span);
  }
  span.textContent = text;
}

function initPortraitButtons() {
  const old = $("portrait-actions");
  if (old) old.remove();
  const w = document.createElement("div");
  w.className = "portrait-actions ui-only";
  w.id = "portrait-actions";
  w.innerHTML = `<button type="button" class="portrait-change-btn" id="portrait-change-btn" title="Заменить">🔄</button>
    <button type="button" class="portrait-delete-btn" id="portrait-delete-btn" title="Удалить">🗑</button>`;
  portArea.appendChild(w);

  on($("portrait-change-btn"), "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $("portrait-input")?.click();
  });

  on($("portrait-delete-btn"), "click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!S.port.src || S.port.src === "loading") return;
    if (!confirm("Удалить портрет?")) return;
    // currentTarget, а не target: клик мог прийти по вложенному узлу
    const btn = e.currentTarget;
    const oldSrc = S.port.src;
    btn.disabled = true;
    btn.textContent = "…";
    try {
      if (oldSrc && !isDataUrl(oldSrc)) await deleteImageFromCloudinary(oldSrc);
      resetPortrait();
      saveTempState();
      showToast("Портрет удалён");
    } catch (err) {
      showToast("Ошибка удаления", true);
    } finally {
      btn.disabled = false;
      btn.textContent = "🗑";
    }
  });

  updatePortraitButtonsVisibility();
}

function updatePortraitButtonsVisibility() {
  const a = $("portrait-actions");
  if (!a) return;
  const v = !!(S.port.src && S.port.src !== "loading");
  a.style.display = v ? "flex" : "none";
}

function loadPortraitFile(file) {
  const prevSrc = S.port.src;
  const url = URL.createObjectURL(file);
  const tmp = new Image();

  tmp.onload = () => {
    const nw = tmp.naturalWidth;
    const nh = tmp.naturalHeight;
    convertToDataUrl(url, nw, nh, async (dataUrl) => {
      URL.revokeObjectURL(url);
      if (!dataUrl) {
        resetPortrait("Ошибка загрузки изображения");
        return;
      }
      try {
        if (prevSrc && !isDataUrl(prevSrc) && prevSrc !== "loading")
          await deleteImageFromCloudinary(prevSrc);
      } catch {}

      S.port.src = dataUrl;
      S.port.nw = nw;
      S.port.nh = nh;
      S.port.sc = nw > 0 ? S.portW / nw : 1;
      S.port.x = 0;
      S.port.y = 0;

      // onload назначаем ДО src, иначе кэшированная картинка не вызовет колбэк
      portImg.onload = () => {
        portWrapper.classList.add("active");
        portPH.style.display = "none";
        portHint.classList.add("visible");
        applyPortTransform();
        updatePortraitButtonsVisibility();
        saveTempState();
      };
      portImg.onerror = () => resetPortrait("Не удалось отобразить изображение");
      portImg.src = dataUrl;
    });
  };

  tmp.onerror = () => {
    URL.revokeObjectURL(url);
    resetPortrait("Ошибка чтения файла");
  };
  tmp.src = url;
}

/**
 * Приводит картинку к разумному размеру.
 * PNG для больших фото раздувает sessionStorage до десятков МБ
 * (и ломает автосохранение), поэтому крупные кадры пережимаем в JPEG.
 */
function convertToDataUrl(src, w, h, cb) {
  const M = 2048;
  if (w > M || h > M) {
    const r = Math.min(M / w, M / h);
    w = Math.max(1, Math.round(w * r));
    h = Math.max(1, Math.round(h * r));
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return fallbackRead(src, cb);
      ctx.drawImage(img, 0, 0, w, h);

      let out = c.toDataURL("image/png");
      if (out && out.length > 2_800_000) {
        // Плоский фон под альфу, чтобы JPEG не почернел
        const c2 = document.createElement("canvas");
        c2.width = w;
        c2.height = h;
        const ctx2 = c2.getContext("2d");
        ctx2.fillStyle = "#ffffff";
        ctx2.fillRect(0, 0, w, h);
        ctx2.drawImage(img, 0, 0, w, h);
        const jpeg = c2.toDataURL("image/jpeg", 0.9);
        if (jpeg && jpeg.length > 100 && jpeg.length < out.length) out = jpeg;
      }
      cb(out && out.length > 100 ? out : null);
    } catch {
      fallbackRead(src, cb);
    }
  };
  img.onerror = () => fallbackRead(src, cb);
  img.src = src;
}

function fallbackRead(src, cb) {
  fetch(src)
    .then((r) => r.blob())
    .then((b) => {
      const fr = new FileReader();
      fr.onload = () => cb(fr.result);
      fr.onerror = () => cb(null);
      fr.readAsDataURL(b);
    })
    .catch(() => cb(null));
}

function resetPortrait(msg) {
  S.port.src = "";
  S.port.nw = 0;
  S.port.nh = 0;
  S.port.x = 0;
  S.port.y = 0;
  S.port.sc = 1;
  portWrapper.classList.remove("active");
  portPH.style.display = "";
  setPlaceholderText("Нажмите для загрузки арта");
  portHint.classList.remove("visible");
  portImg.onload = null;
  portImg.onerror = null;
  portImg.removeAttribute("src");
  updatePortraitButtonsVisibility();
  if (msg) showToast(msg, true);
}

function applyPortTransform() {
  scheduleFrame("port", () => {
    const st = portImg.style;
    st.width = S.port.nw + "px";
    st.height = S.port.nh + "px";
    st.transform = `translate3d(${S.port.x}px,${S.port.y}px,0) scale(${S.port.sc})`;
  });
}

// ============================================================
// BACKGROUND
// ============================================================

function initBackground() {
  on($("bg-btn"), "click", () => $("bg-input")?.click());

  on($("bg-input"), "change", (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      showToast("Файл не является изображением", true);
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      showToast("Файл слишком большой (макс. 50 МБ)", true);
      return;
    }
    // Фон тоже пережимаем: иначе черновик не влезает в sessionStorage
    const url = URL.createObjectURL(f);
    const probe = new Image();
    probe.onload = () => {
      convertToDataUrl(url, probe.naturalWidth, probe.naturalHeight, (data) => {
        URL.revokeObjectURL(url);
        if (!data) {
          showToast("Не удалось прочитать изображение", true);
          return;
        }
        loadBg(data);
      });
    };
    probe.onerror = () => {
      URL.revokeObjectURL(url);
      showToast("Ошибка чтения файла", true);
    };
    probe.src = url;
  });
}

function loadBg(src) {
  const t = new Image();
  t.onload = () => {
    S.bg.src = src;
    S.bg.nw = t.naturalWidth;
    S.bg.nh = t.naturalHeight;
    S.bg.sc = Math.max(S.sheetW / S.bg.nw, S.sheetH / S.bg.nh);
    S.bg.x = (S.sheetW - S.bg.nw * S.bg.sc) / 2;
    S.bg.y = (S.sheetH - S.bg.nh * S.bg.sc) / 2;
    renderBg();
    saveTempState();
  };
  t.onerror = () => showToast("Не удалось загрузить фон", true);
  t.src = src;
}

function renderBg() {
  bgLayer.replaceChildren();
  if (!S.bg.src) {
    bgLayer.classList.remove("active");
    return;
  }
  const img = document.createElement("img");
  img.src = S.bg.src;
  img.style.width = S.bg.nw + "px";
  img.style.height = S.bg.nh + "px";
  img.style.transformOrigin = "0 0";
  img.draggable = false;
  img.alt = "";

  img.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const stx = S.bg.x;
    const sty = S.bg.y;
    img.classList.add("grabbing");
    startGesture(e, {
      el: img,
      onMove(ev) {
        S.bg.x = stx + (ev.clientX - sx) / S.scale;
        S.bg.y = sty + (ev.clientY - sy) / S.scale;
        applyBgTransform();
      },
      onEnd() {
        img.classList.remove("grabbing");
        saveTempStateSoon();
      },
    });
  });

  // Масштабирование фона колесом — раньше его просто не было
  img.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = clamp(e.deltaY, -120, 120);
      const f = Math.pow(0.999, delta * (e.deltaMode === 1 ? 16 : 1));
      const ns = clamp(S.bg.sc * f, 0.02, 30);
      if (ns === S.bg.sc) return;
      const rect = bgLayer.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / S.scale;
      const my = (e.clientY - rect.top) / S.scale;
      const px = (mx - S.bg.x) / S.bg.sc;
      const py = (my - S.bg.y) / S.bg.sc;
      S.bg.sc = ns;
      S.bg.x = mx - px * ns;
      S.bg.y = my - py * ns;
      beginInteract(img);
      applyBgTransform();
      endInteract(img);
      saveTempStateSoon();
    },
    { passive: false },
  );

  bgLayer.appendChild(img);
  bgLayer.classList.add("active");
  applyBgTransform();
}

function applyBgTransform() {
  scheduleFrame("bg", () => {
    const i = bgLayer.querySelector("img");
    if (i)
      i.style.transform = `translate3d(${S.bg.x}px,${S.bg.y}px,0) scale(${S.bg.sc})`;
  });
}

// ============================================================
// RESIZE (лист и портрет) — общий помощник
// ============================================================

/**
 * @param {HTMLElement} handle
 * @param {'x'|'y'} axis
 * @param {() => number} get   текущее значение
 * @param {(v:number)=>void} set применить значение
 * @param {number} min
 * @param {() => number} max
 */
function makeResizer(handle, axis, get, set, min, max) {
  if (!handle) return;
  on(handle, "pointerdown", (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const startPos = axis === "x" ? e.clientX : e.clientY;
    const startVal = get();
    startGesture(e, {
      el: sheet,
      cursor: axis === "x" ? "ew-resize" : "ns-resize",
      onMove(ev) {
        const pos = axis === "x" ? ev.clientX : ev.clientY;
        const d = (pos - startPos) / S.scale;
        const maxV = typeof max === "function" ? max() : max;
        set(clamp(Math.round(startVal + d), min, maxV));
      },
      onEnd() {
        saveTempStateSoon();
      },
    });
  });
  // Двойной клик — сброс к значению по умолчанию не делаем,
  // чтобы не терять ручную настройку пользователя.
}

function initSheetResize() {
  makeResizer(
    resizeHandle,
    "y",
    () => S.sheetH,
    (v) => {
      S.sheetH = v;
      applySheetSize();
    },
    MIN_SH,
    MAX_SH,
  );
}

function initSheetResizeX() {
  makeResizer(
    $("sheet-resize-x"),
    "x",
    () => S.sheetW,
    (v) => {
      S.sheetW = v;
      applySheetSize();
    },
    MIN_SW,
    () => (S.dualMode ? MAX_SW_DUAL : MAX_SW),
  );
}

function initPortraitResizeX() {
  makeResizer(
    $("portrait-resize-x"),
    "x",
    () => S.portW,
    (v) => {
      S.portW = v;
      applyPortraitSize();
    },
    MIN_PW,
    MAX_PW,
  );
}

function initPortraitResizeY() {
  makeResizer(
    $("portrait-resize-y"),
    "y",
    () => S.portH,
    (v) => {
      S.portH = v;
      applyPortraitSize();
    },
    MIN_PH,
    MAX_PH,
  );
}

// ============================================================
// ERYTHROGEN
// ============================================================

/** Ранг по числовому значению (RANKS отсортирован по возрастанию min). */
function rankFor(v) {
  let found = RANKS[0];
  for (let i = 0; i < RANKS.length; i++) {
    if (v >= RANKS[i].min) found = RANKS[i];
    else break;
  }
  return found;
}

/**
 * Единая инициализация блока эритрогенов.
 * Раньше это были две почти идентичные копии, и правый блок
 * не запоминал состояние подсказки.
 */
function setupErythrogen(suffix, hintKey) {
  const sfx = suffix ? "-" + suffix : "";
  const inp = $("erythrogen-value" + sfx);
  if (!inp) return;

  const badge = $("rank-badge" + sfx);
  const ltr = $("rank-letter" + sfx);
  const name = $("rank-name" + sfx);
  const range = $("rank-range" + sfx);
  const info = $("rank-info-inline" + sfx);
  const tog = $("ery-hint-toggle" + sfx);

  function upd() {
    const raw = inp.value.trim();
    const m = raw.match(/-?\d+/);
    const v = m ? parseInt(m[0], 10) : NaN;
    if (!raw || Number.isNaN(v)) {
      if (ltr) ltr.textContent = "—";
      if (name) name.textContent = "";
      if (range) range.textContent = "";
      if (badge) badge.className = "rank-badge";
      return;
    }
    const r = rankFor(v);
    if (ltr) ltr.textContent = r.letter;
    if (name) name.textContent = r.name;
    if (range) range.textContent = r.range + " ед.";
    if (badge) badge.className = `rank-badge ${r.cls}`;
  }

  on(inp, "input", upd);
  on(inp, "change", () => saveTempStateSoon(0));
  upd();

  if (tog && info) {
    info.classList.toggle("hidden", !S[hintKey]);
    on(tog, "click", (e) => {
      e.stopPropagation();
      S[hintKey] = !S[hintKey];
      info.classList.toggle("hidden", !S[hintKey]);
      saveTempStateSoon(0);
    });
  }
}

function initErythrogen() {
  setupErythrogen("", "eryHintVisible");
}

function initErythrogenRight() {
  setupErythrogen("right", "eryHintVisible2");
}

// ============================================================
// DELETE / HIDE / SHOW / RESTORE
// ============================================================

function initDeleteButtons() {
  if (_deleteInitialized) return;
  _deleteInitialized = true;
  on(sheet, "click", (e) => {
    const btn = e.target.closest(".field-delete-btn");
    if (!btn) return;
    e.stopPropagation();
    e.preventDefault();
    const target = btn.dataset.target;
    const isR = btn.dataset.side === "right" || String(target).startsWith("r-");
    if (target) hideField(target, isR);
  });
}

function isCustomId(id) {
  return /^(r-)?(custom_|cdiv_)/.test(String(id));
}

/** Ищем поле в нужной колонке, а не первое совпадение в документе. */
function findFieldEl(id, isR = false) {
  const scope = isR ? $("fields-list-right") : fieldsList;
  return (
    scope?.querySelector(`[data-field-id="${cssEscape(id)}"]`) ||
    document.querySelector(`[data-field-id="${cssEscape(id)}"]`) ||
    null
  );
}

function hideField(id, isR = false) {
  if (isCustomId(id)) {
    findFieldEl(id, isR)?.remove();
    if (isR) S.customFields2 = S.customFields2.filter((f) => f.id !== id);
    else S.customFields = S.customFields.filter((f) => f.id !== id);
    updateFieldOrder();
    updateFieldOrder2();
    saveTempState();
    return;
  }

  const el = findFieldEl(id, isR);
  if (el) {
    el.style.display = "none";
    if (isR) S.hiddenFields2.add(id);
    else S.hiddenFields.add(id);
  }

  // Разделитель над блоком эритрогенов прячем вместе с блоком
  const dividerId = isR ? "r-divider-ery" : "divider-ery";
  if (id === (isR ? "r-erythrogen" : "erythrogen")) {
    const d = findFieldEl(dividerId, isR);
    if (d) {
      d.style.display = "none";
      (isR ? S.hiddenFields2 : S.hiddenFields).add(dividerId);
    }
  }

  updateFieldOrder();
  updateFieldOrder2();
  saveTempState();
}

function showField(id, isR = false) {
  const el = findFieldEl(id, isR);
  if (el) {
    el.style.display = "";
    if (isR) S.hiddenFields2.delete(id);
    else S.hiddenFields.delete(id);
  }
  const dividerId = isR ? "r-divider-ery" : "divider-ery";
  if (id === (isR ? "r-erythrogen" : "erythrogen")) {
    const d = findFieldEl(dividerId, isR);
    if (d) {
      d.style.display = "";
      (isR ? S.hiddenFields2 : S.hiddenFields).delete(dividerId);
    }
  }
}

function initRestoreFields() {
  if (_restoreInitialized) return;
  _restoreInitialized = true;
  const modal = $("restore-modal");
  const list = $("restore-list");
  if (!modal || !list) return;

  function render() {
    list.replaceChildren();
    const entries = [];
    S.hiddenFields.forEach((id) => entries.push({ id, right: false }));
    if (S.dualMode)
      S.hiddenFields2.forEach((id) => entries.push({ id, right: true }));

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "restore-empty";
      empty.textContent = "Нет скрытых полей";
      list.appendChild(empty);
      return;
    }

    entries.forEach(({ id, right }) => {
      const baseId = right ? id.replace(/^r-/, "") : id;
      const it = document.createElement("div");
      it.className = "restore-item";
      const label = document.createElement("span");
      label.textContent =
        (HIDEABLE[baseId] || baseId) + (right ? " (второй персонаж)" : "");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Вернуть";
      btn.dataset.id = id;
      if (right) btn.dataset.side = "right";
      it.append(label, btn);
      list.appendChild(it);
    });
  }

  on($("restore-btn"), "click", () => {
    render();
    openModal(modal);
  });

  on(list, "click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    showField(b.dataset.id, b.dataset.side === "right");
    updateFieldOrder();
    updateFieldOrder2();
    saveTempState();
    render();
  });

  bindModal(modal, $("restore-close"));
}

// ============================================================
// ADD FIELD / DIVIDER
// ============================================================

function initAddField() {
  if (_addFieldInitialized) return;
  _addFieldInitialized = true;
  const modal = $("field-modal");
  if (!modal) return;

  const labelInput = $("new-field-label");

  on($("add-field-btn"), "click", () => openModal(modal));
  bindModal(modal, $("modal-cancel"));

  // Enter в поле названия = «Добавить»
  on(labelInput, "keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      $("modal-confirm")?.click();
    }
  });

  on($("modal-confirm"), "click", () => {
    const label = labelInput.value.trim();
    const type = $("new-field-type").value;
    const icon = $("new-field-icon").value;
    if (!label) {
      labelInput.focus();
      showToast("Введите название поля", true);
      return;
    }

    S.customCounter++;
    const fL = { id: `custom_${S.customCounter}`, label, type, icon, value: "" };
    S.customFields.push(fL);
    renderCustomField(fL);

    if (S.dualMode) {
      const fR = {
        id: `r-custom_${S.customCounter}`,
        label,
        type,
        icon,
        value: "",
      };
      S.customFields2.push(fR);
      const rl = $("fields-list-right");
      if (rl) renderCustomField(fR, rl, true);
    }

    labelInput.value = "";
    closeModal(modal, false);
    updateFieldOrder();
    updateFieldOrder2();
    saveTempState();
    showToast(`Поле «${label}» добавлено`);
  });
}

function renderCustomField(f, container = null, isR = false) {
  const c = container || fieldsList;
  if (!c || c.querySelector(`[data-field-id="${cssEscape(f.id)}"]`)) return;

  const w = document.createElement("div");
  w.className = "custom-field-row";
  w.dataset.fieldId = f.id;

  const ic = FIELD_ICONS[f.icon] || FIELD_ICONS.scroll;
  const side = isR || String(f.id).startsWith("r-") ? ' data-side="right"' : "";
  const inp =
    f.type === "textarea"
      ? `<textarea class="custom-field-textarea" placeholder="—" rows="2"></textarea>`
      : `<input type="text" class="field-input" placeholder="—" autocomplete="off"/>`;

  w.innerHTML =
    `<div class="field-delete-btn ui-only" data-target="${esc(f.id)}"${side} title="Удалить">✕</div>` +
    `<div class="field-icon-wrap" title="Перетащить">${ic}</div>` +
    `<div class="field-content"><span class="field-label">${esc(f.label)}</span>${inp}</div>`;

  const el = w.querySelector("input,textarea");
  el.value = f.value || "";
  el.addEventListener("input", () => {
    f.value = el.value;
    saveTempStateSoon();
  });
  el.addEventListener("change", () => {
    f.value = el.value;
    saveTempStateSoon(0);
  });

  c.appendChild(w);
  if (el.tagName === "TEXTAREA") autoGrow(el);
}

function initAddDivider() {
  if (_dividerInitialized) return;
  _dividerInitialized = true;
  const btn = $("add-divider-btn");
  if (!btn) return;

  on(btn, "click", () => {
    S.dividerCounter++;
    const dL = { id: `cdiv_${S.dividerCounter}`, type: "divider" };
    S.customFields.push(dL);
    renderCustomDivider(dL);

    if (S.dualMode) {
      const dR = { id: `r-cdiv_${S.dividerCounter}`, type: "divider" };
      S.customFields2.push(dR);
      const rl = $("fields-list-right");
      if (rl) renderCustomDivider(dR, rl, true);
    }

    updateFieldOrder();
    updateFieldOrder2();
    saveTempState();
  });
}

const DIVIDER_SVG = `<svg class="divider-line-svg" width="100%" height="34" viewBox="0 0 800 34" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="17" x2="355" y2="17" stroke="#7a4a1a" stroke-width="1.2"/><line x1="445" y1="17" x2="800" y2="17" stroke="#7a4a1a" stroke-width="1.2"/><path d="M355,17L372,7L400,17L372,27Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/><path d="M445,17L428,7L400,17L428,27Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/><circle cx="400" cy="17" r="4.5" fill="#7a4a1a"/></svg>`;

function renderCustomDivider(d, container = null, isR = false) {
  const c = container || fieldsList;
  if (!c || c.querySelector(`[data-field-id="${cssEscape(d.id)}"]`)) return;

  const w = document.createElement("div");
  w.className = "section-divider custom-divider";
  w.dataset.fieldId = d.id;
  const side = isR || String(d.id).startsWith("r-") ? ' data-side="right"' : "";

  w.innerHTML =
    `<div class="field-delete-btn ui-only" data-target="${esc(d.id)}"${side} title="Удалить">✕</div>` +
    `<div class="field-icon-wrap divider-drag-handle ui-only" title="Перетащить"><svg class="ficon" viewBox="0 0 36 36"><line x1="8" y1="12" x2="28" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="18" x2="28" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>` +
    DIVIDER_SVG;

  c.appendChild(w);
}

// ============================================================
// ROLES / COLOR PICKER
// ============================================================

function initRoles() {
  if (_rolesInitialized) return;
  _rolesInitialized = true;
  on(roleSelect, "change", () => {
    applyRole(roleSelect.value);
    saveTempState();
  });
}

function applyRole(role) {
  S.role = role;
  // classList вместо className.replace: строковая замена сносила
  // и служебные классы (dual-mode, custom-theme)
  Array.from(sheet.classList)
    .filter((c) => c.startsWith("role-"))
    .forEach((c) => sheet.classList.remove(c));
  if (!S.customColor && role) sheet.classList.add(role);
  updateRoleBadge();
}

// ============================================================
// ЦВЕТ И ТЕМА
// ============================================================

function initColorPicker() {
  if (_colorPickerInitialized) return;
  _colorPickerInitialized = true;
  const inp = $("custom-color-input");
  const rst = $("color-reset-btn");
  if (!inp) return;

  if (S.customColor) inp.value = S.customColor;

  on(inp, "input", () => {
    S.customColor = inp.value;
    applyCustomColor();
    syncThemePanel();
    saveTempStateSoon();
  });

  on(rst, "click", () => {
    S.customColor = "";
    S.themeGradient = true;
    S.themeOpacity = 0.94;
    inp.value = DEFAULT_COLOR;
    applyCustomColor();
    syncThemePanel();
    saveTempState();
    showToast("Цвет сброшен");
  });
}

/**
 * Панель темы: непрерывные HSL-ползунки + плотность + градиент
 * + пресеты. Даёт весь спектр оттенков, а не «тёмный / светлый».
 */
function initThemePanel() {
  if (_themeInitialized) return;
  _themeInitialized = true;

  const modal = $("theme-modal");
  if (!modal) return;

  const hue = $("theme-hue-slider");
  const sat = $("theme-sat-slider");
  const light = $("theme-light-slider");
  const opacity = $("theme-opacity-slider");
  const colorInput = $("theme-color-input");
  const hexInput = $("theme-hex-input");
  const gradToggle = $("theme-gradient-toggle");
  const presetsBox = $("theme-presets");

  // Пресеты
  if (presetsBox && !presetsBox.childElementCount) {
    THEME_PRESETS.forEach((preset) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "theme-swatch";
      b.title = `${preset.name} · ${preset.hex}`;
      b.dataset.hex = preset.hex;
      b.style.background = themePreviewGradient(preset.hex, true);
      presetsBox.appendChild(b);
    });
    on(presetsBox, "click", (e) => {
      const b = e.target.closest(".theme-swatch");
      if (!b) return;
      setThemeColor(b.dataset.hex);
      syncThemePanel();
      saveTempStateSoon(0);
    });
  }

  const fromSliders = () => {
    const hex = hslToHex(
      parseInt(hue.value, 10),
      parseInt(sat.value, 10),
      parseInt(light.value, 10),
    );
    setThemeColor(hex);
    syncThemePanel({ skipSliders: true });
    saveTempStateSoon();
  };

  [hue, sat, light].forEach((sl) => on(sl, "input", fromSliders));

  on(opacity, "input", () => {
    S.themeOpacity = clamp(parseInt(opacity.value, 10) / 100, 0.3, 1);
    if (!S.customColor) S.customColor = DEFAULT_COLOR;
    applyCustomColor();
    syncThemePanel({ skipSliders: true });
    saveTempStateSoon();
  });

  on(gradToggle, "change", () => {
    S.themeGradient = !!gradToggle.checked;
    if (!S.customColor) S.customColor = DEFAULT_COLOR;
    applyCustomColor();
    syncThemePanel({ skipSliders: true });
    saveTempStateSoon();
  });

  on(colorInput, "input", () => {
    setThemeColor(colorInput.value);
    syncThemePanel();
    saveTempStateSoon();
  });

  on(hexInput, "input", () => {
    const v = hexInput.value.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(v)) {
      setThemeColor(v.startsWith("#") ? v : "#" + v);
      syncThemePanel({ skipHex: true });
      saveTempStateSoon();
    }
  });

  on($("theme-panel-btn"), "click", () => {
    syncThemePanel();
    openModal(modal);
  });

  on($("theme-reset"), "click", () => {
    S.customColor = "";
    S.themeGradient = true;
    S.themeOpacity = 0.94;
    const ci = $("custom-color-input");
    if (ci) ci.value = DEFAULT_COLOR;
    applyCustomColor();
    syncThemePanel();
    saveTempState();
    showToast("Тема сброшена");
  });

  bindModal(modal, $("theme-apply"));
}

function setThemeColor(hex) {
  if (!hex) return;
  S.customColor = hex.toLowerCase();
  const ci = $("custom-color-input");
  if (ci) ci.value = S.customColor;
  applyCustomColor();
}

/** Синхронизирует контролы панели с текущим состоянием темы. */
function syncThemePanel(opts = {}) {
  const modal = $("theme-modal");
  if (!modal) return;

  const hex = S.customColor || DEFAULT_COLOR;
  const { h, s, l } = hexToHsl(hex);

  const hue = $("theme-hue-slider");
  const sat = $("theme-sat-slider");
  const light = $("theme-light-slider");
  const opacity = $("theme-opacity-slider");
  const colorInput = $("theme-color-input");
  const hexInput = $("theme-hex-input");
  const gradToggle = $("theme-gradient-toggle");

  if (!opts.skipSliders) {
    if (hue) hue.value = Math.round(h);
    if (sat) sat.value = Math.round(s);
    if (light) light.value = Math.round(l);
  }
  if (opacity) opacity.value = Math.round(S.themeOpacity * 100);
  if (gradToggle) gradToggle.checked = !!S.themeGradient;
  if (colorInput) colorInput.value = hex;
  if (hexInput && !opts.skipHex) hexInput.value = hex.toUpperCase();

  // Живые градиенты на самих ползунках — видно, что выбираешь
  if (sat)
    sat.style.background = `linear-gradient(to right, ${hslToHex(h, 0, l)}, ${hslToHex(h, 100, l)})`;
  if (light)
    light.style.background = `linear-gradient(to right, #000, ${hslToHex(h, s, 50)}, #fff)`;

  const set = (id, text) => {
    const el = $(id);
    if (el) el.textContent = text;
  };
  set("theme-hue-val", Math.round(h) + "°");
  set("theme-sat-val", Math.round(s) + "%");
  set("theme-light-val", Math.round(l) + "%");
  set("theme-opacity-val", Math.round(S.themeOpacity * 100) + "%");

  const preview = $("theme-preview");
  const label = $("theme-preview-label");
  const theme = generateThemeFromColor(hex, {
    gradient: S.themeGradient,
    opacity: 1,
  });
  if (preview) {
    preview.style.background = theme.parchmentBg;
    preview.style.borderColor = theme.borderColor;
  }
  if (label) label.style.color = theme.labelColor;

  const presetsBox = $("theme-presets");
  if (presetsBox) {
    presetsBox.querySelectorAll(".theme-swatch").forEach((b) => {
      b.classList.toggle(
        "active",
        (b.dataset.hex || "").toLowerCase() === hex.toLowerCase(),
      );
    });
  }
}

// ============================================================
// DUAL MODE
// ============================================================

function initDualModeToggle() {
  if (_dualInitialized) return;
  _dualInitialized = true;
  const btn = $("dual-mode-btn");
  if (!btn) return;
  on(btn, "click", () => {
    S.dualMode = !S.dualMode;
    applyDualMode();
    saveTempState();
    showToast(S.dualMode ? "Двойная анкета" : "Одиночная анкета");
  });
}

function applyDualMode() {
  const btn = $("dual-mode-btn");
  const scrollR = $("scroll-right");
  const scrollC = $("scroll-center-ornament");
  const svgS = $("scroll-svg-single");
  const svgDL = $("scroll-svg-dual-left");
  const grid = $("main-grid");
  const scrollWrap = $("scroll-wrap");
  const infoCol = $("info-column");
  const portCol = $("portrait-column");

  if (S.dualMode) {
    if (S.sheetW < DUAL_MIN_SW) S.sheetW = DUAL_MIN_SW;
    sheet.classList.add("dual-mode");

    if (svgS) svgS.style.display = "none";
    if (svgDL) svgDL.style.display = "block";
    if (scrollR) scrollR.style.display = "flex";
    if (scrollC) scrollC.style.display = "flex";

    // Порядок: инфо-колонка → портрет → вторая инфо-колонка
    if (grid && infoCol && portCol) grid.insertBefore(infoCol, portCol);

    let rc = $("info-column-right");
    if (!rc) {
      rc = document.createElement("div");
      rc.id = "info-column-right";
      rc.className = "info-column";
      const rl = document.createElement("div");
      rl.className = "fields-list";
      rl.id = "fields-list-right";
      rc.appendChild(rl);
      if (portCol?.parentNode)
        portCol.parentNode.insertBefore(rc, portCol.nextSibling);
      else grid?.appendChild(rc);

      createDualFields(rl);

      // Пользовательские поля второго персонажа
      S.customFields2.forEach((f) => {
        if (f.type === "divider") renderCustomDivider(f, rl, true);
        else renderCustomField(f, rl, true);
      });
      applyFieldOrder2();

      restoreDualValues();
      bindDualChangeHandlers();
    } else {
      rc.style.display = "";
    }

    // Скрытые поля второго персонажа
    const rl = $("fields-list-right");
    if (rl)
      S.hiddenFields2.forEach((id) => {
        const el = rl.querySelector(`[data-field-id="${cssEscape(id)}"]`);
        if (el) el.style.display = "none";
      });

    if (S.portW < 400) S.portW = DEFAULT_PW;

    if (btn) btn.textContent = "👤 Одиночная";
  } else {
    // Сохраняем значения второго персонажа перед скрытием колонки,
    // иначе при обратном переключении они терялись
    if ($("fields-list-right")) S._savedFields2 = getDualFieldValues();

    S.sheetW = DEFAULT_SW;
    sheet.classList.remove("dual-mode");

    if (svgS) svgS.style.display = "block";
    if (svgDL) svgDL.style.display = "none";
    if (scrollR) scrollR.style.display = "none";
    if (scrollC) scrollC.style.display = "none";

    const rc = $("info-column-right");
    if (rc) rc.style.display = "none";

    if (grid && portCol && infoCol) grid.insertBefore(portCol, infoCol);

    if (btn) btn.textContent = "👥 Двойная";
  }

  applySheetSize();
  applyPortraitSize();
  if (scrollWrap && !S.dualMode) scrollWrap.style.gridTemplateColumns = "";
  initDragAndDrop();
  fitToScreen();
}

function restoreDualValues() {
  Object.entries(S._savedFields2 || {}).forEach(([id, v]) => {
    const e = $(id);
    if (e) {
      e.value = v;
      e.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

function bindDualChangeHandlers() {
  DUAL_FIELD_IDS.forEach((id) => {
    const el = $(id);
    if (!el || el.dataset.boundSave === "1") return;
    el.dataset.boundSave = "1";
    on(el, "input", () => saveTempStateSoon());
    on(el, "change", () => saveTempStateSoon(0));
  });
}

function createDualFields(c) {
  if (!c || c.children.length > 0) return;
  [
    { id: "r-age", icon: "hourglass", label: "Возраст", iid: "field-r-age" },
    {
      id: "r-birth",
      icon: "moon",
      label: "Дата рождения",
      iid: "field-r-birth",
    },
    {
      id: "r-nation",
      icon: "globe",
      label: "Национальность",
      iid: "field-r-nation",
    },
    { id: "r-clan", icon: "tree", label: "Род / Клан", iid: "field-r-clan" },
    {
      id: "r-nature",
      icon: "mask",
      label: "Кем является",
      iid: "field-r-nature",
    },
    {
      id: "r-occupation",
      icon: "quill",
      label: "Чем занимается",
      iid: "field-r-occupation",
    },
  ].forEach((f) => {
    const r = document.createElement("div");
    r.className = "field-row";
    r.dataset.fieldId = f.id;
    r.innerHTML = `<div class="field-delete-btn ui-only" data-target="${f.id}" data-side="right" title="Удалить">✕</div><div class="field-icon-wrap" data-icon="${f.icon}"></div><div class="field-content"><span class="field-label">${f.label}</span><input type="text" class="field-input" id="${f.iid}" placeholder="—" autocomplete="off"/></div>`;
    c.appendChild(r);
  });
  // Разделитель
  const dv = document.createElement("div");
  dv.className = "section-divider";
  dv.dataset.fieldId = "r-divider-ery";
  dv.innerHTML = `<svg width="100%" height="34" viewBox="0 0 800 34" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="17" x2="355" y2="17" stroke="#7a4a1a" stroke-width="1.2"/><line x1="445" y1="17" x2="800" y2="17" stroke="#7a4a1a" stroke-width="1.2"/><path d="M355,17L372,7L400,17L372,27Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/><path d="M445,17L428,7L400,17L428,27Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/><circle cx="400" cy="17" r="4.5" fill="#7a4a1a"/></svg>`;
  c.appendChild(dv);
  // Эритрогены
  const eb = document.createElement("div");
  eb.className = "erythrogen-block";
  eb.dataset.fieldId = "r-erythrogen";
  eb.innerHTML = `<div class="field-delete-btn ui-only" data-target="r-erythrogen" data-side="right" title="Удалить">✕</div><div class="erythrogen-header"><div class="field-icon-wrap" data-icon="erythrogen"></div><span class="erythrogen-title">Уровень Эритрогенов</span></div><div class="erythrogen-row"><div class="rank-badge" id="rank-badge-right"><span class="rank-letter" id="rank-letter-right">—</span></div><input type="text" id="erythrogen-value-right" class="ery-number-input" placeholder="0" autocomplete="off"/><span class="rank-info-inline" id="rank-info-inline-right"><span class="rank-dot"> · </span><span class="rank-name" id="rank-name-right">Введите значение</span><span class="rank-dot"> · </span><span class="rank-range" id="rank-range-right"></span></span><button class="ery-hint-toggle ui-only" id="ery-hint-toggle-right" title="Скрыть/показать">👁</button></div>`;
  c.appendChild(eb);
  // История
  const hb = document.createElement("div");
  hb.className = "history-block";
  hb.dataset.fieldId = "r-history";
  hb.innerHTML = `<div class="field-delete-btn ui-only" data-target="r-history" data-side="right" title="Удалить">✕</div><div class="history-header"><svg width="100%" height="48" viewBox="0 0 800 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="24" x2="240" y2="24" stroke="#7a4a1a" stroke-width="1.5"/><path d="M240,24L260,11L295,24L260,37Z" fill="#9a6425" stroke="#7a4a1a" stroke-width="1"/><text x="400" y="33" font-family="'Uncial Antiqua',serif" font-size="32" fill="#3b1f0a" text-anchor="middle" letter-spacing="6">История</text><path d="M560,24L540,11L505,24L540,37Z" fill="#9a6425" stroke="#7a4a1a" stroke-width="1"/><line x1="560" y1="24" x2="800" y2="24" stroke="#7a4a1a" stroke-width="1.5"/></svg></div><textarea class="history-textarea" id="field-r-history" placeholder="История второго персонажа..."></textarea>`;
  c.appendChild(hb);
  c.querySelectorAll(".field-icon-wrap[data-icon]").forEach((el) => {
    const k = el.dataset.icon;
    if (FIELD_ICONS[k]) el.innerHTML = FIELD_ICONS[k];
  });
  initErythrogenRight();
}

// ============================================================
// BUTTONS
// ============================================================

function initButtons() {
  if (_buttonsInitialized) return;
  _buttonsInitialized = true;

  on($("cloud-save-btn"), "click", saveToCloud);

  on($("new-char-btn"), "click", () => {
    if (!confirm("Создать нового персонажа? Несохранённые правки будут потеряны."))
      return;
    resetDraft();
  });

  on($("clear-btn"), "click", () => {
    if (!confirm("Сбросить всё? Несохранённые правки будут потеряны.")) return;
    resetDraft();
  });

  on($("export-btn"), "click", handleExport);
}

/**
 * Сброс черновика. Раньше здесь был location.reload(), но
 * beforeunload-автосохранение успевало записать состояние обратно
 * в sessionStorage — и «Новый» ничего не сбрасывал.
 */
function resetDraft() {
  _resetting = true;
  if (S.autoSaveTimer) {
    clearInterval(S.autoSaveTimer);
    S.autoSaveTimer = null;
  }
  if (S._saveDebounce) {
    clearTimeout(S._saveDebounce);
    S._saveDebounce = null;
  }
  S.currentCharacterId = null;
  try {
    sessionStorage.removeItem(TEMP_KEY);
  } catch {}
  location.reload();
}

async function handleExport() {
  const btn = $("export-btn");
  if (!btn || btn.disabled) return;
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Подготовка...";
  try {
    await exportToPNG(false);
    showToast("PNG сохранён ✓");
  } catch (err) {
    console.error("Export error:", err);
    showToast("Ошибка экспорта: " + (err?.message || "неизвестно"), true);
  } finally {
    btn.disabled = false;
    btn.textContent = orig || "⬇ Скачать PNG";
  }
}

function getExportTheme() {
  if (S.theme)
    return {
      nameColor: S.theme.nameColor,
      namePlaceholder: S.theme.namePlaceholder,
      inputColor: S.theme.inputColor,
      inputPlaceholder: S.theme.inputPlaceholder,
      inputBorder: S.theme.inputBorder,
      customColor: S.theme.inputColor,
      customPlaceholder: S.theme.inputPlaceholder,
      customBorder: S.theme.inputBorder,
      historyColor: S.theme.historyColor,
      historyPlaceholder: S.theme.inputPlaceholder,
      historyLine: S.theme.historyLine,
      numberColor: S.theme.eryNumberColor,
      badgeText: S.theme.badgeText,
    };

  const b = {
    nameColor: "#2a1206",
    namePlaceholder: "rgba(42,18,6,0.55)",
    inputColor: "#1e0e04",
    inputPlaceholder: "rgba(122,74,26,0.26)",
    inputBorder: "rgba(122,74,26,0.32)",
    customColor: "#1e0e04",
    customPlaceholder: "rgba(122,74,26,0.25)",
    customBorder: "rgba(122,74,26,0.3)",
    historyColor: "#3b1f0a",
    historyPlaceholder: "rgba(59,31,10,0.25)",
    historyLine: "rgba(100,60,20,0.13)",
    numberColor: "#8b0000",
    badgeText: "#5a3a0a",
  };

  // Тёмные ролевые темы требуют светлого текста при экспорте
  const DARK_ROLES = {
    "role-antagonist": {
      nameColor: "#ffeef2",
      namePlaceholder: "rgba(255,200,220,0.5)",
      inputColor: "#ffeef2",
      inputPlaceholder: "rgba(248,160,188,0.3)",
      inputBorder: "rgba(220,80,120,0.3)",
      customColor: "#ffeef2",
      customPlaceholder: "rgba(248,160,188,0.3)",
      customBorder: "rgba(220,80,120,0.3)",
      historyColor: "#ffeef2",
      historyPlaceholder: "rgba(248,160,188,0.3)",
      historyLine: "rgba(220,80,120,0.12)",
      numberColor: "#ff4080",
      badgeText: "#ffd0dc",
    },
  };

  return DARK_ROLES[S.role] ? { ...b, ...DARK_ROLES[S.role] } : b;
}

async function exportToPNG(ret = false) {
  const { default: html2canvas } = await import("html2canvas");

  // Шрифты должны быть готовы, иначе текст «прыгает» в PNG
  try {
    await document.fonts?.ready;
  } catch {}

  const W = S.sheetW;
  const H = S.sheetH;
  const theme = getExportTheme();

  const prev = {
    transform: sheet.style.transform,
    position: sheet.style.position,
    top: sheet.style.top,
    left: sheet.style.left,
    zIndex: sheet.style.zIndex,
  };
  sheet.style.transform = "none";
  sheet.style.position = "fixed";
  sheet.style.top = "0px";
  sheet.style.left = "0px";
  sheet.style.zIndex = "-1";

  const uiEls = Array.from(sheet.querySelectorAll(".ui-only"));
  const uiPrev = uiEls.map((e) => e.style.display);
  uiEls.forEach((e) => (e.style.display = "none"));

  fixFrameCornersForExport();

  const pI = sheet.querySelector("#portrait-img");
  const pP = pI?.style.cssText || "";
  if (pI && S.port.src && S.port.src !== "loading")
    pI.style.cssText = `transform:none;position:absolute;left:${S.port.x}px;top:${S.port.y}px;width:${S.port.nw * S.port.sc}px;height:${S.port.nh * S.port.sc}px;`;

  const bI = bgLayer.querySelector("img");
  const bP = bI?.style.cssText || "";
  if (bI)
    bI.style.cssText = `transform:none;position:absolute;left:${S.bg.x}px;top:${S.bg.y}px;width:${S.bg.nw * S.bg.sc}px;height:${S.bg.nh * S.bg.sc}px;`;

  const reps = [];

  /** Заменяет поле статическим блоком с теми же метриками. */
  const replace = (el, div) => {
    el.before(div);
    el.style.display = "none";
    reps.push([el, div]);
  };

  // ——— Имена в свитках ———
  ["#header-name-input", "#header-name-input-right"].forEach((sel) => {
    const inp = sheet.querySelector(sel);
    if (!inp) return;
    if (sel.includes("right") && !S.dualMode) return;
    const v = inp.value || "";
    // Берём фактический кегль из CSS, а не «на глаз»: раньше правое
    // имя экспортировалось на 20% мельче, чем видно на экране
    const fs =
      parseFloat(getComputedStyle(inp).fontSize) || S.nameFontSize;
    replace(
      inp,
      makeDiv(
        v || "ДОСЬЕ ПЕРСОНАЖА",
        `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;font-family:'Cormorant Garamond',serif;font-size:${fs}px;font-weight:700;color:${v ? theme.nameColor : theme.namePlaceholder};background:transparent;border:none;text-align:center;letter-spacing:6px;line-height:1;padding:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:${v ? "normal" : "italic"}`,
      ),
    );
  });

  // ——— Обычные текстовые поля ———
  sheet
    .querySelectorAll('input[type="text"], input:not([type])')
    .forEach((inp) => {
      if (
        inp.classList.contains("header-name-input") ||
        inp.classList.contains("ery-number-input") ||
        inp.id === "role-badge-edit-input"
      )
        return;
      const v = inp.value || "";
      replace(
        inp,
        makeDiv(
          v || inp.placeholder || "—",
          `font-family:'Philosopher',serif;font-size:${S.inputFontSize}px;color:${v ? theme.inputColor : theme.inputPlaceholder};background:transparent;display:block;width:100%;border:none;border-bottom:1px dashed ${theme.inputBorder};padding:4px 0 6px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box;font-style:${v ? "normal" : "italic"}`,
        ),
      );
    });

  // ——— Числа эритрогенов ———
  sheet.querySelectorAll(".ery-number-input").forEach((inp) => {
    const v = inp.value || "";
    const cs = getComputedStyle(inp);
    replace(
      inp,
      makeDiv(
        v || "0",
        `font-family:'Cormorant Garamond',serif;font-size:${S.eryFontSize}px;font-weight:700;color:${theme.numberColor};background:transparent;display:inline-block;width:${cs.width};border:none;padding:0;margin-left:${cs.marginLeft};opacity:${v ? "1" : "0.3"};vertical-align:baseline;line-height:1`,
      ),
    );
  });

  // ——— Многострочные поля ———
  sheet.querySelectorAll("textarea").forEach((ta) => {
    const v = ta.value || "";
    const isH = ta.classList.contains("history-textarea");
    const cs = getComputedStyle(ta);
    // Реальная высота, а не жёстко зашитые 580px: длинная история
    // раньше обрезалась при экспорте
    const height = Math.max(ta.scrollHeight, ta.offsetHeight, isH ? 580 : 54);
    const fontSize = isH ? cs.fontSize : S.inputFontSize + "px";
    const lineHeight = isH ? cs.lineHeight || "54px" : "1.5";
    const bg = isH
      ? `background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent 53px,${theme.historyLine} 53px,${theme.historyLine} 54px);`
      : "";
    const color = v
      ? isH
        ? theme.historyColor
        : theme.customColor
      : isH
        ? theme.historyPlaceholder
        : theme.customPlaceholder;
    replace(
      ta,
      makeDiv(
        v || ta.placeholder || "",
        `font-family:'Philosopher',serif;font-size:${fontSize};color:${color};background:transparent;display:block;width:100%;min-height:${height}px;border:none;border-bottom:${isH ? "none" : `1px dashed ${theme.customBorder}`};padding:${isH ? "0 6px" : "4px 0 6px"};line-height:${lineHeight};white-space:pre-wrap;word-break:break-word;overflow:hidden;box-sizing:border-box;font-style:${v ? "normal" : "italic"};${bg}`,
      ),
    );
  });

  let dataUrl = null;
  try {
    const canvas = await html2canvas(sheet, {
      useCORS: true,
      allowTaint: true,
      scale: 1,
      width: W,
      height: H,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      // Подложка под текущую тему, а не всегда песочная
      backgroundColor: S.theme?.sheetBgSolid || "#dfc87e",
      logging: false,
      imageTimeout: 15000,
      foreignObjectRendering: false,
      ignoreElements: (el) =>
        el.style?.display === "none" || el.classList?.contains("modal-overlay"),
    });
    dataUrl = canvas.toDataURL("image/png", 1.0);
  } finally {
    Object.assign(sheet.style, prev);
    uiEls.forEach((e, i) => (e.style.display = uiPrev[i] || ""));
    restoreFrameCorners();
    if (pI) pI.style.cssText = pP;
    if (bI) bI.style.cssText = bP;
    reps.forEach(([o, r]) => {
      o.style.display = "";
      r.remove();
    });
    applyView();
  }

  if (!dataUrl || dataUrl.length < 1000) throw new Error("Пустой холст");
  if (ret) return dataUrl;

  const name = ($("header-name-input")?.value || "character")
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .slice(0, 48) || "character";

  const a = document.createElement("a");
  a.download = `${name}_${Date.now()}.png`;
  a.href = dataUrl;
  // Firefox не кликает по элементу вне DOM
  document.body.appendChild(a);
  a.click();
  a.remove();
  return dataUrl;
}

function makeDiv(t, css) {
  const d = document.createElement("div");
  d.textContent = t;
  d.style.cssText = css.replace(/\s*\n\s*/g, " ").trim();
  return d;
}
let _savedCS = [];
function fixFrameCornersForExport() {
  _savedCS = [];
  sheet
    .querySelector("#portrait-area")
    ?.querySelectorAll(".frame-corner")
    .forEach((c) => {
      _savedCS.push({ el: c, prev: c.style.cssText });
      c.style.cssText = `position:absolute;width:80px;height:80px;display:block;overflow:visible;${c.classList.contains("frame-tl") ? "top:-2px;left:-2px;" : ""}${c.classList.contains("frame-tr") ? "top:-2px;right:-2px;" : ""}${c.classList.contains("frame-bl") ? "bottom:-2px;left:-2px;" : ""}${c.classList.contains("frame-br") ? "bottom:-2px;right:-2px;" : ""}`;
    });
}
function restoreFrameCorners() {
  _savedCS.forEach(({ el, prev }) => (el.style.cssText = prev));
  _savedCS = [];
}

// ============================================================
// CLOUD SAVE
// ============================================================

async function saveToCloud() {
  const db = getDb();
  if (!db) {
    showToast("Supabase не настроен", true);
    return;
  }

  const btn = $("cloud-save-btn");
  if (btn?.disabled) return;
  const orig = btn?.textContent || "💾 Сохранить";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ Сохранение...";
  }

  try {
    const name = $("header-name-input")?.value.trim() || "Безымянный";
    const cd = collectState();
    const eid = S.currentCharacterId || null;

    const roleField = S.customFields.find(
      (f) => f.label?.trim().toLowerCase() === "роль" && f.type !== "divider",
    );
    const roleText = S.roleBadgeCustomText || roleField?.value || "";

    // Портрет
    let pUrl = cd.port?.src || "";
    if (pUrl && isDataUrl(pUrl)) {
      showToast("Загрузка портрета...");
      pUrl = await uploadImageToCloudinary(pUrl, {
        folder: "character-sheet/portraits",
      });
      cd.port.src = pUrl;
      S.port.src = pUrl;
    }

    // Фон
    if (cd.bg?.src && isDataUrl(cd.bg.src)) {
      showToast("Загрузка фона...");
      const bu = await uploadImageToCloudinary(cd.bg.src, {
        folder: "character-sheet/backgrounds",
      });
      cd.bg.src = bu;
      S.bg.src = bu;
    }

    const payload = {
      name,
      image_url: pUrl || null,
      role_class: S.role || "",
      role_text: roleText,
      custom_color: S.customColor || null,
      data: cd,
      is_duo: S.dualMode,
      duo_name: null,
      duo_partner_data: null,
      role_badge_text: S.roleBadgeCustomText || null,
    };

    if (S.dualMode) {
      payload.duo_name =
        $("header-name-input-right")?.value.trim() ||
        cd.fields2?.["header-name-input-right"]?.trim() ||
        "Безымянный";
      payload.duo_partner_data = {
        fields: cd.fields2,
        customFields: cd.customFields2,
        hidden: cd.hidden2,
        fieldOrder: cd.fieldOrder2,
      };
    }

    let sid = eid;
    if (eid) {
      const { data: u, error } = await db
        .from("characters")
        .update(payload)
        .eq("id", eid)
        .select("id")
        .single();
      if (error) {
        // PGRST116 — записи больше нет (удалили из галереи): создаём новую
        if (error.code === "PGRST116") {
          const { data: i, error: e2 } = await db
            .from("characters")
            .insert([payload])
            .select("id")
            .single();
          if (e2) throw e2;
          sid = i.id;
          showToast("✓ Создан новый");
        } else throw error;
      } else {
        sid = u?.id || eid;
        showToast("✓ Обновлён");
      }
    } else {
      const { data: i, error } = await db
        .from("characters")
        .insert([payload])
        .select("id")
        .single();
      if (error) throw error;
      sid = i.id;
      showToast("✓ Сохранено");
    }

    if (sid) {
      S.currentCharacterId = sid;
      saveTempState();
    }
  } catch (err) {
    console.error("Cloud save error:", err);
    showToast("Ошибка сохранения: " + (err?.message || "неизвестно"), true);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }
}

// ============================================================
// FIELD VALUES
// ============================================================

function readValues(ids) {
  const o = {};
  ids.forEach((id) => {
    const e = $(id);
    if (e) o[id] = e.value;
  });
  return o;
}

function getFieldValues() {
  return readValues(FIELD_IDS);
}

function getDualFieldValues() {
  // Если правой колонки нет — отдаём последний сохранённый снимок,
  // чтобы данные второго персонажа не обнулялись.
  if (!$("fields-list-right")) return { ...(S._savedFields2 || {}) };
  return readValues(DUAL_FIELD_IDS);
}

// ============================================================
// LOAD / RESTORE
// ============================================================

function loadState() {
  const raw = sessionStorage.getItem(TEMP_KEY);
  if (!raw) return;
  try {
    applyLoadedData(JSON.parse(raw));
  } catch (e) {
    console.warn("Load error:", e);
  }
}

function applyLoadedData(d) {
  if (!d) return;
  if (typeof d.sheetW === "number" && d.sheetW >= MIN_SW) S.sheetW = d.sheetW;
  if (typeof d.sheetH === "number" && d.sheetH >= MIN_SH) S.sheetH = d.sheetH;
  if (typeof d.portW === "number" && d.portW >= MIN_PW) S.portW = d.portW;
  if (typeof d.portH === "number" && d.portH >= MIN_PH) S.portH = d.portH;
  if (d.port?.src) Object.assign(S.port, d.port);
  if (d.bg?.src) Object.assign(S.bg, d.bg);
  if (Array.isArray(d.hidden)) d.hidden.forEach((id) => S.hiddenFields.add(id));
  if (Array.isArray(d.hidden2))
    d.hidden2.forEach((id) => S.hiddenFields2.add(id));
  if (Array.isArray(d.customFields))
    S.customFields = d.customFields.map((f) => ({ ...f }));
  if (Array.isArray(d.customFields2))
    S.customFields2 = d.customFields2.map((f) => ({ ...f }));
  if (typeof d.customCounter === "number") S.customCounter = d.customCounter;
  if (typeof d.dividerCounter === "number") S.dividerCounter = d.dividerCounter;
  if (d.role !== undefined) S.role = d.role;
  if (d.customColor !== undefined) S.customColor = d.customColor;
  if (Array.isArray(d.fieldOrder) && d.fieldOrder.length)
    S.fieldOrder = d.fieldOrder;
  if (Array.isArray(d.fieldOrder2) && d.fieldOrder2.length)
    S.fieldOrder2 = d.fieldOrder2;
  if (typeof d.labelFontSize === "number") S.labelFontSize = d.labelFontSize;
  if (typeof d.inputFontSize === "number") S.inputFontSize = d.inputFontSize;
  if (typeof d.nameFontSize === "number") S.nameFontSize = d.nameFontSize;
  if (typeof d.eryFontSize === "number") S.eryFontSize = d.eryFontSize;
  if (typeof d.rankNameFontSize === "number")
    S.rankNameFontSize = d.rankNameFontSize;
  if (typeof d.rankRangeFontSize === "number")
    S.rankRangeFontSize = d.rankRangeFontSize;
  if (typeof d.eryHintVisible === "boolean")
    S.eryHintVisible = d.eryHintVisible;
  if (typeof d.eryHintVisible2 === "boolean")
    S.eryHintVisible2 = d.eryHintVisible2;
  if (typeof d.themeGradient === "boolean") S.themeGradient = d.themeGradient;
  if (typeof d.themeOpacity === "number")
    S.themeOpacity = clamp(d.themeOpacity, 0.3, 1);
  if (typeof d.dualMode === "boolean") S.dualMode = d.dualMode;
  if (d.currentCharacterId) S.currentCharacterId = d.currentCharacterId;
  if (typeof d.roleBadgeCustomText === "string")
    S.roleBadgeCustomText = d.roleBadgeCustomText;
  if (typeof d.roleBadgeFontSize === "number")
    S.roleBadgeFontSize = d.roleBadgeFontSize;
  S._savedFields = d.fields || {};
  S._savedFields2 = d.fields2 || {};
  S._fieldsRendered = false;
}

function restoreAll() {
  // Значения основных полей
  Object.entries(S._savedFields || {}).forEach(([id, v]) => {
    const e = $(id);
    if (e) {
      e.value = v;
      e.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  $("rank-info-inline")?.classList.toggle("hidden", !S.eryHintVisible);

  // Пользовательские поля
  if (!S._fieldsRendered) {
    S.customFields.forEach((f) => {
      if (f.type === "divider") renderCustomDivider(f);
      else renderCustomField(f);
    });
    S._fieldsRendered = true;
  }
  applyFieldOrder();

  // Скрытые поля
  S.hiddenFields.forEach((id) => {
    const e = findFieldEl(id, false);
    if (e) e.style.display = "none";
  });

  // Портрет
  if (S.port.src && S.port.src !== "loading") {
    portImg.onload = () => {
      portWrapper.classList.add("active");
      portPH.style.display = "none";
      portHint.classList.add("visible");
      applyPortTransform();
      updatePortraitButtonsVisibility();
    };
    portImg.onerror = () => resetPortrait();
    portImg.src = S.port.src;
    // Картинка могла быть уже в кэше — onload тогда не сработает
    if (portImg.complete && portImg.naturalWidth) portImg.onload();
  }

  if (S.bg.src) renderBg();

  // Роль и цвет
  if (S.role && roleSelect) {
    roleSelect.value = S.role;
    applyRole(S.role);
  }
  updateRoleBadge();

  if (S.customColor) {
    const ci = $("custom-color-input");
    if (ci) ci.value = S.customColor;
    applyCustomColor();
  }
  syncThemePanel();

  // Автосохранение при вводе в стандартные поля
  FIELD_IDS.forEach((id) => {
    const el = $(id);
    if (!el || el.dataset.boundSave === "1") return;
    el.dataset.boundSave = "1";
    on(el, "input", () => saveTempStateSoon());
    on(el, "change", () => saveTempStateSoon(0));
  });
}

// ============================================================
// HELPERS
// ============================================================

function clamp(v, mn, mx) {
  if (Number.isNaN(v)) return mn;
  return Math.min(mx, Math.max(mn, v));
}

/**
 * Экранирование для querySelector.
 * Без него id вида `custom_1` работает, но любой нестандартный
 * символ роняет селектор исключением.
 */
function cssEscape(v) {
  const str = String(v);
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(str);
  return str.replace(/["\\\]]/g, "\\$&");
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isDataUrl(v) {
  return typeof v === "string" && v.startsWith("data:");
}

// ---------- модалки ----------

let _openModals = [];

function openModal(modal) {
  if (!modal) return;
  modal.style.display = "flex";
  if (!_openModals.includes(modal)) _openModals.push(modal);
  // Фокус на первый интерактивный элемент — удобно и доступно
  const first = modal.querySelector(
    "input:not([type=hidden]), select, textarea, button",
  );
  if (first) setTimeout(() => first.focus(), 0);
}

function closeModal(modal, save = true) {
  if (!modal) return;
  modal.style.display = "none";
  _openModals = _openModals.filter((m) => m !== modal);
  if (save) saveTempStateSoon(0);
}

/** Клик по фону и Esc закрывают модалку. */
function bindModal(modal, closeBtn, onClose) {
  if (!modal) return;
  const close = () => {
    closeModal(modal);
    onClose?.();
  };
  if (closeBtn) on(closeBtn, "click", close);
  on(modal, "click", (e) => {
    if (e.target === modal) close();
  });
  modal._close = close;
}

function initKeyboardShortcuts() {
  if (_shortcutsInitialized) return;
  _shortcutsInitialized = true;

  on(document, "keydown", (e) => {
    // Esc закрывает верхнюю открытую модалку
    if (e.key === "Escape" && _openModals.length) {
      const top = _openModals[_openModals.length - 1];
      (top._close || (() => closeModal(top)))();
      return;
    }

    const inField =
      e.target instanceof HTMLElement &&
      (e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable);

    // Ctrl/Cmd+S — сохранить черновик, а не диалог печати браузера
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveTempState();
      showToast("Черновик сохранён");
      return;
    }

    if (inField || e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === "0") {
      e.preventDefault();
      fitToScreen();
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomC(1.18);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomC(0.84);
    }
  });
}

// ---------- тост ----------

function showToast(msg, err = false) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.style.background = err ? "#4a0808" : "#2a1206";
  t.style.borderColor = err ? "#cc2222" : "#8b6914";
  t.style.opacity = "1";
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.style.opacity = "0"), err ? 4200 : 2800);
}

/**
 * Textarea истории/полей растёт под содержимое — иначе текст
 * просто обрезался при экспорте и при просмотре.
 */
function autoGrow(el) {
  if (!el) return;
  const min = el.classList.contains("history-textarea") ? 580 : 54;
  el.style.height = "auto";
  el.style.height = Math.max(min, el.scrollHeight) + "px";
}

function initAutoGrowTextareas() {
  const grow = (e) => {
    const ta = e.target;
    if (ta instanceof HTMLTextAreaElement) scheduleFrame("grow", () => autoGrow(ta));
  };
  on(sheet, "input", grow);
  scheduleFrame("growAll", () =>
    sheet.querySelectorAll("textarea").forEach(autoGrow),
  );
}
