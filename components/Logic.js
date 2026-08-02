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
  getDefaultTheme,
  applyThemeToElement,
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
const AUTOSAVE_INTERVAL = 30000;

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
  if (S.roleBadgeCustomText) {
    textEl.textContent = S.roleBadgeCustomText;
  } else {
    textEl.textContent = ROLE_DISPLAY_NAMES[S.role || ""] || "Стандартная";
  }
  badgeEl.style.display = "flex";

  // Размер бейджика
  if (S.roleBadgeFontSize) {
    textEl.style.fontSize = S.roleBadgeFontSize + "px";
  }
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
  sheetResizing: false,
  sheetResizeSY: 0,
  sheetResizeSH: 0,
  sheetResizingX: false,
  sheetResizeSX: 0,
  sheetResizeSW: 0,
  portResizingX: false,
  portResizeSX: 0,
  portResizeSW: 0,
  portResizingY: false,
  portResizeSY2: 0,
  portResizeSH: 0,
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
  // Бейджик роли
  roleBadgeCustomText: "",
  roleBadgeFontSize: 24,
};

const $ = (id) => document.getElementById(id);
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
  fitToScreen();

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
  initFontSizeControls();
  initButtons();
  initDualModeToggle();
  initRoleBadgeEditor();

  restoreAll();
  // Применяем dual mode после восстановления всех данных
  if (S.dualMode) {
    applyDualMode();
  }
  initDragAndDrop();

  startAutoSave();
  updateRoleBadge();
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

  if (S.autoSaveTimer) {
    clearInterval(S.autoSaveTimer);
    S.autoSaveTimer = null;
  }

  if (S._sortable) {
    S._sortable.destroy();
    S._sortable = null;
  }
  if (S._sortable2) {
    S._sortable2.destroy();
    S._sortable2 = null;
  }
}

// ============================================================
// AUTOSAVE / TEMP STATE
// ============================================================

function startAutoSave() {
  if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
  S.autoSaveTimer = setInterval(() => saveTempState(), AUTOSAVE_INTERVAL);
}

function saveTempState() {
  try {
    sessionStorage.setItem(TEMP_KEY, JSON.stringify(collectState()));
  } catch {}
}

// ============================================================
// COLLECT STATE
// ============================================================

function collectState() {
  fieldsList?.querySelectorAll(".custom-field-row").forEach((row) => {
    const id = row.dataset.fieldId;
    const inp = row.querySelector("input,textarea");
    const cf = S.customFields.find((f) => f.id === id);
    if (cf && inp) cf.value = inp.value;
  });
  const rightList = $("fields-list-right");
  if (rightList && S.dualMode) {
    rightList.querySelectorAll(".custom-field-row").forEach((row) => {
      const id = row.dataset.fieldId;
      const inp = row.querySelector("input,textarea");
      const cf = S.customFields2.find((f) => f.id === id);
      if (cf && inp) cf.value = inp.value;
    });
  }
  updateFieldOrder();

  return {
    sheetW: S.sheetW,
    sheetH: S.sheetH,
    portW: S.portW,
    portH: S.portH,
    fields: getFieldValues(),
    fields2: S.dualMode ? getDualFieldValues() : {},
    hidden: [...S.hiddenFields],
    hidden2: S.dualMode ? [...S.hiddenFields2] : [],
    customFields: S.customFields.map((f) => ({ ...f })),
    customFields2: S.dualMode ? S.customFields2.map((f) => ({ ...f })) : [],
    customCounter: S.customCounter,
    dividerCounter: S.dividerCounter,
    role: S.role,
    customColor: S.customColor,
    fieldOrder: S.fieldOrder,
    fieldOrder2: S.dualMode ? getFieldOrder2() : [],
    labelFontSize: S.labelFontSize,
    inputFontSize: S.inputFontSize,
    nameFontSize: S.nameFontSize,
    eryFontSize: S.eryFontSize,
    rankNameFontSize: S.rankNameFontSize,
    rankRangeFontSize: S.rankRangeFontSize,
    eryHintVisible: S.eryHintVisible,
    dualMode: S.dualMode,
    currentCharacterId: S.currentCharacterId,
    roleBadgeCustomText: S.roleBadgeCustomText,
    roleBadgeFontSize: S.roleBadgeFontSize,
    port: {
      src: S.port.src,
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

function getFieldOrder2() {
  const rl = $("fields-list-right");
  return rl
    ? Array.from(rl.children)
        .map((el) => el.dataset.fieldId)
        .filter(Boolean)
    : [];
}

// ============================================================
// DRAG & DROP
// ============================================================

function initDragAndDrop() {
  if (!fieldsList) return;

  // Левая колонка (или единственная в одиночном режиме)
  if (S._sortable) {
    S._sortable.destroy();
    S._sortable = null;
  }
  S._sortable = new Sortable(fieldsList, {
    animation: 150,
    handle: ".field-icon-wrap",
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    onEnd() {
      updateFieldOrder();
      saveTempState();
    },
  });

  // Правая колонка (только в dual mode)
  const rightList = $("fields-list-right");
  if (rightList) {
    if (S._sortable2) {
      S._sortable2.destroy();
      S._sortable2 = null;
    }
    S._sortable2 = new Sortable(rightList, {
      animation: 150,
      handle: ".field-icon-wrap",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      onEnd() {
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

function applyFieldOrder() {
  if (!S.fieldOrder?.length || !fieldsList) return;
  S.fieldOrder.forEach((id) => {
    const el = fieldsList.querySelector(`[data-field-id="${id}"]`);
    if (el) fieldsList.appendChild(el);
  });
}

function applyFieldOrder2() {
  const rightList = $("fields-list-right");
  if (!S.fieldOrder2?.length || !rightList) return;
  S.fieldOrder2.forEach((id) => {
    const el = rightList.querySelector(`[data-field-id="${id}"]`);
    if (el) rightList.appendChild(el);
  });
}

// ============================================================
// FONT SIZE CONTROLS
// ============================================================

function initFontSizeControls() {
  if (_fontInitialized) return;
  _fontInitialized = true;
  const modal = $("font-modal");
  $("font-settings-btn")?.addEventListener("click", () => {
    modal.style.display = "flex";
  });
  $("font-modal-close")?.addEventListener("click", () => {
    modal.style.display = "none";
    saveTempState();
  });
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      saveTempState();
    }
  });

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
  slider.value = S[stateKey];
  if (valEl) valEl.textContent = S[stateKey] + "px";
  slider.addEventListener("input", () => {
    S[stateKey] = parseInt(slider.value, 10);
    if (valEl) valEl.textContent = S[stateKey] + "px";
    applyFontSizes();
    if (extraCb) extraCb();
  });
}

function applyFontSizes() {
  const r = document.documentElement;
  r.style.setProperty("--name-font-size", S.nameFontSize + "px");
  r.style.setProperty("--label-font-size", S.labelFontSize + "px");
  r.style.setProperty("--input-font-size", S.inputFontSize + "px");
  r.style.setProperty("--ery-font-size", S.eryFontSize + "px");
  r.style.setProperty("--rank-name-font-size", S.rankNameFontSize + "px");
  r.style.setProperty("--rank-range-font-size", S.rankRangeFontSize + "px");
}

// ============================================================
// ROLE BADGE EDITOR
// ============================================================

function initRoleBadgeEditor() {
  const textEl = $("role-badge-text");
  const editInput = $("role-badge-edit-input");
  if (!textEl || !editInput) return;

  // Клик по бейджику — переключаемся на редактирование
  textEl.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    editInput.value = textEl.textContent;
    textEl.style.display = "none";
    editInput.style.display = "inline-block";
    editInput.focus();
    editInput.select();
  });

  function finishEdit() {
    const val = editInput.value.trim();
    editInput.style.display = "none";
    textEl.style.display = "";

    if (val && val !== (ROLE_DISPLAY_NAMES[S.role || ""] || "Стандартная")) {
      S.roleBadgeCustomText = val;
    } else {
      S.roleBadgeCustomText = "";
    }
    updateRoleBadge();
    saveTempState();
  }

  editInput.addEventListener("blur", finishEdit);
  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finishEdit();
    }
    if (e.key === "Escape") {
      editInput.style.display = "none";
      textEl.style.display = "";
    }
  });
}

// ============================================================
// CUSTOM COLOR
// ============================================================

function applyCustomColor() {
  if (S.customColor) {
    S.theme = generateThemeFromColor(S.customColor);
    applyThemeToElement(sheet, S.theme);
    sheet.classList.add("custom-theme");
    sheet.className = sheet.className.replace(/\brole-\S+/g, "").trim();
    sheet.classList.add("custom-theme");
  } else {
    sheet.classList.remove("custom-theme");
    S.theme = null;
    [
      "--theme-parchment-bg",
      "--theme-sheet-bg",
      "--theme-border-color",
      "--theme-border-inner",
      "--theme-name-color",
      "--theme-name-placeholder",
      "--theme-label-color",
      "--theme-input-color",
      "--theme-input-placeholder",
      "--theme-input-border",
      "--theme-history-color",
      "--theme-history-line",
      "--theme-icon-color",
      "--theme-ery-title",
      "--theme-ery-number",
      "--theme-rank-name",
      "--theme-rank-range",
      "--theme-scroll-fill1",
      "--theme-scroll-fill2",
      "--theme-frame-line",
      "--theme-divider-stroke",
      "--theme-row-border",
    ].forEach((v) => sheet.style.removeProperty(v));
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
  sheet.style.width = S.sheetW + "px";
  sheet.style.height = S.sheetH + "px";
}

function applyPortraitSize() {
  portColEl.style.width = S.portW + "px";
  portArea.style.height = S.portH + "px";
  if (S.dualMode) {
    const grid = $("main-grid");
    const scrollWrap = $("scroll-wrap");

    // Синхронизируем обе сетки: контент и шапку
    if (grid) grid.style.gridTemplateColumns = `1fr ${S.portW}px 1fr`;
    if (scrollWrap)
      scrollWrap.style.gridTemplateColumns = `1fr ${S.portW}px 1fr`;
  }
}

function applyView() {
  sheet.style.transform = `translate(${S.tx}px,${S.ty}px) scale(${S.scale})`;
  zoomLabel.textContent = Math.round(S.scale * 100) + "%";
}

function fitToScreen() {
  const vw = canvasArea.clientWidth,
    vh = canvasArea.clientHeight;
  const sc = Math.min(vw / S.sheetW, vh / S.sheetH) * 0.88;
  S.scale = sc;
  S.tx = (vw - S.sheetW * sc) / 2;
  S.ty = (vh - S.sheetH * sc) / 2;
  applyView();
}

// ============================================================
// PAN & ZOOM
// ============================================================

function initPan() {
  canvasArea.addEventListener("mousedown", (e) => {
    if (e.target.closest("#sheet")) return;
    S.panDrag = true;
    S.panSX = e.clientX;
    S.panSY = e.clientY;
    S.panSTX = S.tx;
    S.panSTY = S.ty;
    canvasArea.classList.add("grabbing");
  });
  window.addEventListener("mousemove", (e) => {
    if (!S.panDrag) return;
    S.tx = S.panSTX + (e.clientX - S.panSX);
    S.ty = S.panSTY + (e.clientY - S.panSY);
    applyView();
  });
  window.addEventListener("mouseup", () => {
    S.panDrag = false;
    canvasArea.classList.remove("grabbing");
  });
  canvasArea.addEventListener(
    "wheel",
    (e) => {
      if (
        e.target.closest(".portrait-area") ||
        e.target.closest("#sheet-bg-layer")
      )
        return;
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 0.91;
      const ns = clamp(S.scale * f, 0.03, 5);
      const rect = canvasArea.getBoundingClientRect();
      const mx = e.clientX - rect.left,
        my = e.clientY - rect.top;
      const sx = (mx - S.tx) / S.scale,
        sy = (my - S.ty) / S.scale;
      S.scale = ns;
      S.tx = mx - sx * ns;
      S.ty = my - sy * ns;
      applyView();
    },
    { passive: false },
  );
}

function initZoom() {
  if (_zoomInitialized) return;
  _zoomInitialized = true;
  $("zoom-in-btn").addEventListener("click", () => zoomC(1.18));
  $("zoom-out-btn").addEventListener("click", () => zoomC(0.84));
  $("zoom-fit-btn").addEventListener("click", fitToScreen);
}

function zoomC(f) {
  const cx = canvasArea.clientWidth / 2,
    cy = canvasArea.clientHeight / 2;
  const ns = clamp(S.scale * f, 0.03, 5);
  const sx = (cx - S.tx) / S.scale,
    sy = (cy - S.ty) / S.scale;
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
  portArea.addEventListener("click", (e) => {
    if (e.target.closest("#portrait-actions")) return;
    if (S.port.src && S.port.src !== "loading") return;
    if (e.target === portImg) return;
    input.click();
  });
  input.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Файл не является изображением", true);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast("Файл слишком большой", true);
      return;
    }
    S.port.src = "loading";
    portPH.querySelector("span").textContent = "Загрузка...";
    loadPortraitFile(file);
  });
  portImg.addEventListener("mousedown", (e) => {
    if (!S.port.src || S.port.src === "loading") return;
    e.stopPropagation();
    e.preventDefault();
    S.port.drag = true;
    S.port.sx = e.clientX;
    S.port.sy = e.clientY;
    S.port.stx = S.port.x;
    S.port.sty = S.port.y;
    portImg.classList.add("grabbing");
  });
  window.addEventListener("mousemove", (e) => {
    if (!S.port.drag) return;
    S.port.x = S.port.stx + (e.clientX - S.port.sx) / S.scale;
    S.port.y = S.port.sty + (e.clientY - S.port.sy) / S.scale;
    applyPortTransform();
  });
  window.addEventListener("mouseup", () => {
    if (S.port.drag) {
      S.port.drag = false;
      portImg.classList.remove("grabbing");
      saveTempState();
    }
  });
  portArea.addEventListener(
    "wheel",
    (e) => {
      if (!S.port.src || S.port.src === "loading") return;
      e.preventDefault();
      e.stopPropagation();
      const f = e.deltaY < 0 ? 1.08 : 0.93;
      const ns = clamp(S.port.sc * f, 0.02, 30);
      const rect = portArea.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / S.scale,
        my = (e.clientY - rect.top) / S.scale;
      const px = (mx - S.port.x) / S.port.sc,
        py = (my - S.port.y) / S.port.sc;
      S.port.sc = ns;
      S.port.x = mx - px * ns;
      S.port.y = my - py * ns;
      applyPortTransform();
      saveTempState();
    },
    { passive: false },
  );
  initPortraitButtons();
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
  $("portrait-change-btn").onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    $("portrait-input")?.click();
  };
  $("portrait-delete-btn").onclick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!S.port.src || S.port.src === "loading") return;
    if (!confirm("Удалить портрет?")) return;
    const oldSrc = S.port.src;
    try {
      e.target.disabled = true;
      e.target.textContent = "…";
      if (oldSrc && !isDataUrl(oldSrc)) await deleteImageFromCloudinary(oldSrc);
      resetPortrait();
      saveTempState();
      showToast("Портрет удалён");
    } catch (err) {
      showToast("Ошибка удаления", true);
    } finally {
      e.target.disabled = false;
      e.target.textContent = "🗑";
    }
  };
  updatePortraitButtonsVisibility();
}

function updatePortraitButtonsVisibility() {
  const a = $("portrait-actions");
  if (!a) return;
  const v = !!(S.port.src && S.port.src !== "loading");
  a.style.display = v ? "flex" : "none";
}

async function loadPortraitFile(file) {
  const prevSrc = S.port.src;
  const url = URL.createObjectURL(file);
  const tmp = new Image();
  tmp.onload = async () => {
    convertToDataUrl(
      url,
      tmp.naturalWidth,
      tmp.naturalHeight,
      async (dataUrl) => {
        URL.revokeObjectURL(url);
        if (!dataUrl) {
          resetPortrait("Ошибка загрузки");
          return;
        }
        try {
          if (prevSrc && !isDataUrl(prevSrc) && prevSrc !== "loading")
            await deleteImageFromCloudinary(prevSrc);
        } catch {}
        S.port.src = dataUrl;
        S.port.nw = tmp.naturalWidth;
        S.port.nh = tmp.naturalHeight;
        S.port.sc = S.portW / tmp.naturalWidth;
        S.port.x = 0;
        S.port.y = 0;
        portImg.src = dataUrl;
        portImg.onload = () => {
          portWrapper.classList.add("active");
          portPH.style.display = "none";
          portHint.classList.add("visible");
          applyPortTransform();
          updatePortraitButtonsVisibility();
          saveTempState();
        };
      },
    );
  };
  tmp.onerror = () => {
    URL.revokeObjectURL(url);
    resetPortrait("Ошибка чтения файла");
  };
  tmp.src = url;
}

function convertToDataUrl(src, w, h, cb) {
  const M = 2048;
  if (w > M || h > M) {
    const r = Math.min(M / w, M / h);
    w = Math.round(w * r);
    h = Math.round(h * r);
  }
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      const u = c.toDataURL("image/png");
      cb(u?.length > 100 ? u : null);
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
      fr.onerror = () => cb(src);
      fr.readAsDataURL(b);
    })
    .catch(() => cb(src));
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
  portPH.querySelector("span").textContent = "Нажмите для загрузки арта";
  portHint.classList.remove("visible");
  portImg.src = "";
  updatePortraitButtonsVisibility();
  if (msg) showToast(msg, true);
}

function applyPortTransform() {
  portImg.style.width = S.port.nw + "px";
  portImg.style.height = S.port.nh + "px";
  portImg.style.transform = `translate(${S.port.x}px,${S.port.y}px) scale(${S.port.sc})`;
}

// ============================================================
// BACKGROUND
// ============================================================

function initBackground() {
  $("bg-btn").addEventListener("click", () => $("bg-input").click());
  $("bg-input").addEventListener("change", (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      showToast("Не изображение", true);
      return;
    }
    readFile(f, (src) => loadBg(src));
  });
  window.addEventListener("mousemove", (e) => {
    if (!S.bg.drag) return;
    S.bg.x = S.bg.stx + (e.clientX - S.bg.sx) / S.scale;
    S.bg.y = S.bg.sty + (e.clientY - S.bg.sy) / S.scale;
    applyBgTransform();
  });
  window.addEventListener("mouseup", () => {
    if (S.bg.drag) {
      S.bg.drag = false;
      bgLayer.querySelector("img")?.classList.remove("grabbing");
      saveTempState();
    }
  });
}
function loadBg(src) {
  S.bg.src = src;
  const t = new Image();
  t.onload = () => {
    S.bg.nw = t.naturalWidth;
    S.bg.nh = t.naturalHeight;
    S.bg.sc = Math.max(S.sheetW / S.bg.nw, S.sheetH / S.bg.nh);
    S.bg.x = (S.sheetW - S.bg.nw * S.bg.sc) / 2;
    S.bg.y = (S.sheetH - S.bg.nh * S.bg.sc) / 2;
    renderBg();
    saveTempState();
  };
  t.src = src;
}
function renderBg() {
  bgLayer.innerHTML = "";
  if (!S.bg.src) return;
  const img = document.createElement("img");
  img.src = S.bg.src;
  img.style.width = S.bg.nw + "px";
  img.style.height = S.bg.nh + "px";
  img.style.transformOrigin = "0 0";
  img.draggable = false;
  img.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    S.bg.drag = true;
    S.bg.sx = e.clientX;
    S.bg.sy = e.clientY;
    S.bg.stx = S.bg.x;
    S.bg.sty = S.bg.y;
    img.classList.add("grabbing");
  });
  bgLayer.appendChild(img);
  bgLayer.classList.add("active");
  applyBgTransform();
}
function applyBgTransform() {
  const i = bgLayer.querySelector("img");
  if (i)
    i.style.transform = `translate(${S.bg.x}px,${S.bg.y}px) scale(${S.bg.sc})`;
}

// ============================================================
// RESIZE — ВЫСОТА ЛИСТА
// ============================================================

function initSheetResize() {
  resizeHandle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    S.sheetResizing = true;
    S.sheetResizeSY = e.clientY;
    S.sheetResizeSH = S.sheetH;
    document.body.style.cursor = "ns-resize";
  });
  window.addEventListener("mousemove", (e) => {
    if (!S.sheetResizing) return;
    S.sheetH = Math.max(
      MIN_SH,
      Math.round(S.sheetResizeSH + (e.clientY - S.sheetResizeSY) / S.scale),
    );
    applySheetSize();
  });
  window.addEventListener("mouseup", () => {
    if (S.sheetResizing) {
      S.sheetResizing = false;
      document.body.style.cursor = "";
      saveTempState();
    }
  });
}

// ============================================================
// RESIZE — ШИРИНА ЛИСТА
// ============================================================

function initSheetResizeX() {
  const handle = $("sheet-resize-x");
  if (!handle) return;
  handle.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    S.sheetResizingX = true;
    S.sheetResizeSX = e.clientX;
    S.sheetResizeSW = S.sheetW;
    document.body.style.cursor = "ew-resize";
  });
  window.addEventListener("mousemove", (e) => {
    if (!S.sheetResizingX) return;
    e.preventDefault();
    const d = (e.clientX - S.sheetResizeSX) / S.scale;
    const maxW = S.dualMode ? 6000 : 4000;
    S.sheetW = clamp(Math.round(S.sheetResizeSW + d), MIN_SW, maxW);
    applySheetSize();
  });
  window.addEventListener("mouseup", () => {
    if (S.sheetResizingX) {
      S.sheetResizingX = false;
      document.body.style.cursor = "";
      saveTempState();
    }
  });
}

// ============================================================
// RESIZE — ПОРТРЕТ
// ============================================================

function initPortraitResizeX() {
  const h = $("portrait-resize-x");
  if (!h) return;
  h.addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    S.portResizingX = true;
    S.portResizeSX = e.clientX;
    S.portResizeSW = S.portW;
    document.body.style.cursor = "ew-resize";
  });
  window.addEventListener("mousemove", (e) => {
    if (!S.portResizingX) return;
    e.preventDefault();
    S.portW = clamp(
      Math.round(S.portResizeSW + (e.clientX - S.portResizeSX) / S.scale),
      MIN_PW,
      1200,
    );
    applyPortraitSize();
  });
  window.addEventListener("mouseup", () => {
    if (S.portResizingX) {
      S.portResizingX = false;
      document.body.style.cursor = "";
      saveTempState();
    }
  });
}

function initPortraitResizeY() {
  $("portrait-resize-y").addEventListener("mousedown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    S.portResizingY = true;
    S.portResizeSY2 = e.clientY;
    S.portResizeSH = S.portH;
    document.body.style.cursor = "ns-resize";
  });
  window.addEventListener("mousemove", (e) => {
    if (!S.portResizingY) return;
    S.portH = Math.max(
      MIN_PH,
      Math.round(S.portResizeSH + (e.clientY - S.portResizeSY2) / S.scale),
    );
    applyPortraitSize();
  });
  window.addEventListener("mouseup", () => {
    if (S.portResizingY) {
      S.portResizingY = false;
      document.body.style.cursor = "";
      saveTempState();
    }
  });
}

// ============================================================
// ERYTHROGEN
// ============================================================

function initErythrogen() {
  const inp = $("erythrogen-value"),
    badge = $("rank-badge"),
    ltr = $("rank-letter"),
    name = $("rank-name"),
    range = $("rank-range"),
    info = $("rank-info-inline"),
    tog = $("ery-hint-toggle");
  function upd() {
    const m = inp.value.trim().match(/^\d+/);
    const v = m ? parseInt(m[0], 10) : NaN;
    if (isNaN(v) || inp.value.trim() === "") {
      ltr.textContent = "—";
      name.textContent = "";
      range.textContent = "";
      badge.className = "rank-badge";
      return;
    }
    const r =
      RANKS.slice()
        .reverse()
        .find((r) => v >= r.min) || RANKS[0];
    ltr.textContent = r.letter;
    name.textContent = r.name;
    range.textContent = r.range + " ед.";
    badge.className = `rank-badge ${r.cls}`;
  }
  inp.addEventListener("input", upd);
  inp.addEventListener("change", () => saveTempState());
  upd();
  if (tog && info) {
    if (!S.eryHintVisible) info.classList.add("hidden");
    tog.addEventListener("click", (e) => {
      e.stopPropagation();
      S.eryHintVisible = !S.eryHintVisible;
      info.classList.toggle("hidden", !S.eryHintVisible);
      saveTempState();
    });
  }
}

function initErythrogenRight() {
  const inp = $("erythrogen-value-right");
  if (!inp) return;
  const badge = $("rank-badge-right"),
    ltr = $("rank-letter-right"),
    name = $("rank-name-right"),
    range = $("rank-range-right"),
    info = $("rank-info-inline-right"),
    tog = $("ery-hint-toggle-right");
  function upd() {
    const m = inp.value.trim().match(/^\d+/);
    const v = m ? parseInt(m[0], 10) : NaN;
    if (isNaN(v) || inp.value.trim() === "") {
      ltr.textContent = "—";
      name.textContent = "";
      range.textContent = "";
      badge.className = "rank-badge";
      return;
    }
    const r =
      RANKS.slice()
        .reverse()
        .find((r) => v >= r.min) || RANKS[0];
    ltr.textContent = r.letter;
    name.textContent = r.name;
    range.textContent = r.range + " ед.";
    badge.className = `rank-badge ${r.cls}`;
  }
  inp.addEventListener("input", upd);
  inp.addEventListener("change", () => saveTempState());
  upd();
  if (tog && info) {
    tog.addEventListener("click", (e) => {
      e.stopPropagation();
      info.classList.toggle("hidden");
      saveTempState();
    });
  }
}

// ============================================================
// DELETE / HIDE / SHOW / RESTORE
// ============================================================

function initDeleteButtons() {
  if (_deleteInitialized) return;
  _deleteInitialized = true;
  sheet.addEventListener("click", (e) => {
    const btn = e.target.closest(".field-delete-btn");
    if (!btn) return;
    e.stopPropagation();
    e.preventDefault();
    const target = btn.dataset.target;
    const isR = btn.dataset.side === "right";
    if (target) hideField(target, isR);
  });
}
function hideField(id, isR = false) {
  if (
    id.startsWith("custom_") ||
    id.startsWith("cdiv_") ||
    id.startsWith("r-custom_") ||
    id.startsWith("r-cdiv_")
  ) {
    document.querySelector(`[data-field-id="${id}"]`)?.remove();
    if (isR || id.startsWith("r-"))
      S.customFields2 = S.customFields2.filter((f) => f.id !== id);
    else S.customFields = S.customFields.filter((f) => f.id !== id);
    updateFieldOrder();
    saveTempState();
    return;
  }
  const el = document.querySelector(`[data-field-id="${id}"]`);
  if (el) {
    el.style.display = "none";
    if (isR) S.hiddenFields2.add(id);
    else S.hiddenFields.add(id);
  }
  if (id === "erythrogen" && !isR) {
    const d = $("divider-ery");
    if (d) {
      d.style.display = "none";
      S.hiddenFields.add("divider-ery");
    }
  }
  updateFieldOrder();
  saveTempState();
}
function showField(id, isR = false) {
  const el = document.querySelector(`[data-field-id="${id}"]`);
  if (el) {
    el.style.display = "";
    if (isR) S.hiddenFields2.delete(id);
    else S.hiddenFields.delete(id);
  }
  if (id === "erythrogen" && !isR) {
    const d = $("divider-ery");
    if (d) {
      d.style.display = "";
      S.hiddenFields.delete("divider-ery");
    }
  }
}

function initRestoreFields() {
  if (_restoreInitialized) return;
  _restoreInitialized = true;
  const modal = $("restore-modal"),
    list = $("restore-list"),
    close = $("restore-close");
  $("restore-btn").addEventListener("click", () => {
    list.innerHTML = "";
    if (S.hiddenFields.size === 0)
      list.innerHTML = '<div class="restore-empty">Нет скрытых полей</div>';
    else
      S.hiddenFields.forEach((id) => {
        const it = document.createElement("div");
        it.className = "restore-item";
        it.innerHTML = `<span>${HIDEABLE[id] || id}</span><button data-id="${id}">Вернуть</button>`;
        list.appendChild(it);
      });
    modal.style.display = "flex";
  });
  list.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    showField(b.dataset.id);
    b.parentElement.remove();
    updateFieldOrder();
    saveTempState();
    if (S.hiddenFields.size === 0)
      list.innerHTML = '<div class="restore-empty">Нет скрытых полей</div>';
  });
  close.addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// ============================================================
// ADD FIELD / DIVIDER
// ============================================================

function initAddField() {
  if (_addFieldInitialized) return;
  _addFieldInitialized = true;
  const modal = $("field-modal");
  $("add-field-btn").addEventListener("click", () => {
    modal.style.display = "flex";
  });
  $("modal-cancel").addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
  $("modal-confirm").addEventListener("click", () => {
    const label = $("new-field-label").value.trim(),
      type = $("new-field-type").value,
      icon = $("new-field-icon").value;
    if (!label) {
      $("new-field-label").focus();
      return;
    }
    S.customCounter++;
    const id = `custom_${S.customCounter}`;
    const fL = { id, label, type, icon, value: "" };
    S.customFields.push(fL);
    renderCustomField(fL);
    if (S.dualMode) {
      const idR = `r-custom_${S.customCounter}`;
      const fR = { id: idR, label, type, icon, value: "" };
      S.customFields2.push(fR);
      const rl = $("fields-list-right");
      if (rl) renderCustomField(fR, rl, true);
    }
    $("new-field-label").value = "";
    modal.style.display = "none";
    updateFieldOrder();
    saveTempState();
  });
}

function renderCustomField(f, container = null, isR = false) {
  const c = container || fieldsList;
  if (!c || c.querySelector(`[data-field-id="${f.id}"]`)) return;
  const w = document.createElement("div");
  w.className = "custom-field-row";
  w.dataset.fieldId = f.id;
  const ic = FIELD_ICONS[f.icon] || FIELD_ICONS.scroll;
  const inp =
    f.type === "textarea"
      ? `<textarea class="custom-field-textarea" placeholder="—" rows="2"></textarea>`
      : `<input type="text" class="field-input" placeholder="—" autocomplete="off"/>`;
  const side = isR || f.id.startsWith("r-") ? ' data-side="right"' : "";
  w.innerHTML = `<div class="field-delete-btn ui-only" data-target="${f.id}"${side} title="Удалить">✕</div><div class="field-icon-wrap">${ic}</div><div class="field-content"><span class="field-label">${esc(f.label)}</span>${inp}</div>`;
  const el = w.querySelector("input,textarea");
  el.value = f.value || "";
  el.addEventListener("input", () => {
    f.value = el.value;
  });
  el.addEventListener("change", () => {
    f.value = el.value;
    saveTempState();
  });
  c.appendChild(w);
}

function initAddDivider() {
  if (_dividerInitialized) return;
  _dividerInitialized = true;
  const btn = $("add-divider-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    S.dividerCounter++;
    const id = `cdiv_${S.dividerCounter}`;
    const dL = { id, type: "divider" };
    S.customFields.push(dL);
    renderCustomDivider(dL);
    if (S.dualMode) {
      const idR = `r-cdiv_${S.dividerCounter}`;
      const dR = { id: idR, type: "divider" };
      S.customFields2.push(dR);
      const rl = $("fields-list-right");
      if (rl) renderCustomDivider(dR, rl, true);
    }
    updateFieldOrder();
    saveTempState();
  });
}

function renderCustomDivider(d, container = null, isR = false) {
  const c = container || fieldsList;
  if (!c || c.querySelector(`[data-field-id="${d.id}"]`)) return;
  const w = document.createElement("div");
  w.className = "section-divider custom-divider";
  w.dataset.fieldId = d.id;
  const side = isR || d.id.startsWith("r-") ? ' data-side="right"' : "";
  w.innerHTML = `<div class="field-delete-btn ui-only" data-target="${d.id}"${side} title="Удалить">✕</div>
    <div class="field-icon-wrap divider-drag-handle ui-only" title="Перетащить"><svg class="ficon" viewBox="0 0 36 36"><line x1="8" y1="12" x2="28" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="18" x2="28" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
    <svg class="divider-line-svg" width="100%" height="34" viewBox="0 0 800 34" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="17" x2="355" y2="17" stroke="#7a4a1a" stroke-width="1.2"/><line x1="445" y1="17" x2="800" y2="17" stroke="#7a4a1a" stroke-width="1.2"/><path d="M355,17L372,7L400,17L372,27Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/><path d="M445,17L428,7L400,17L428,27Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/><circle cx="400" cy="17" r="4.5" fill="#7a4a1a"/></svg>`;
  c.appendChild(w);
}

// ============================================================
// ROLES / COLOR PICKER
// ============================================================

function initRoles() {
  if (_rolesInitialized) return;
  _rolesInitialized = true;
  roleSelect.addEventListener("change", () => {
    applyRole(roleSelect.value);
    saveTempState();
  });
}
function applyRole(role) {
  S.role = role;
  if (!S.customColor) {
    sheet.className = sheet.className.replace(/\brole-\S+/g, "").trim();
    if (role) sheet.classList.add(role);
  }
  // Если нет кастомного текста — обновляем автоматически
  if (!S.roleBadgeCustomText) updateRoleBadge();
  else updateRoleBadge();
}

function initColorPicker() {
  if (_colorPickerInitialized) return;
  _colorPickerInitialized = true;
  const inp = $("custom-color-input"),
    rst = $("color-reset-btn");
  if (!inp) return;
  if (S.customColor) inp.value = S.customColor;
  inp.addEventListener("input", () => {
    S.customColor = inp.value;
    applyCustomColor();
    saveTempState();
  });
  rst?.addEventListener("click", () => {
    S.customColor = "";
    inp.value = "#c49050";
    applyCustomColor();
    saveTempState();
  });
}

// ============================================================
// DUAL MODE
// ============================================================

function initDualModeToggle() {
  if (_dualInitialized) return;
  _dualInitialized = true;
  const btn = $("dual-mode-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    S.dualMode = !S.dualMode;
    applyDualMode();
    saveTempState();
    showToast(S.dualMode ? "Двойная анкета" : "Одиночная анкета");
  });
}

function applyDualMode() {
  const btn = $("dual-mode-btn"),
    scrollR = $("scroll-right"),
    scrollC = $("scroll-center-ornament"),
    svgS = $("scroll-svg-single"),
    svgDL = $("scroll-svg-dual-left"),
    grid = $("main-grid"),
    scrollWrap = $("scroll-wrap");

  if (S.dualMode) {
    // Стартовая ширина не такая огромная
    S.sheetW = Math.max(S.sheetW, 2800);
    applySheetSize();
    sheet.classList.add("dual-mode");

    if (svgS) svgS.style.display = "none";
    if (svgDL) svgDL.style.display = "block";
    if (scrollR) scrollR.style.display = "flex";
    if (scrollC) scrollC.style.display = "flex";

    const infoCol = $("info-column"),
      portCol = $("portrait-column");

    if (grid && infoCol && portCol) {
      grid.insertBefore(infoCol, portCol);
      grid.style.gridTemplateColumns = `1fr ${S.portW}px 1fr`;
    }
    if (scrollWrap) {
      scrollWrap.style.gridTemplateColumns = `1fr ${S.portW}px 1fr`;
    }

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
      Object.entries(S._savedFields2 || {}).forEach(([id, v]) => {
        const e = $(id);
        if (e) {
          e.value = v;
          e.dispatchEvent(new Event("input"));
        }
      });
    } else {
      rc.style.display = "";
    }

    initDragAndDrop();

    if (btn) btn.textContent = "👤 Одиночная";
    if (S.portW < 400) {
      S.portW = 860;
      applyPortraitSize();
    }
    fitToScreen();
  } else {
    S.sheetW = DEFAULT_SW;
    applySheetSize();
    sheet.classList.remove("dual-mode");

    if (svgS) svgS.style.display = "block";
    if (svgDL) svgDL.style.display = "none";
    if (scrollR) scrollR.style.display = "none";
    if (scrollC) scrollC.style.display = "none";

    const rc = $("info-column-right");
    if (rc) rc.style.display = "none";

    if (grid) {
      grid.style.gridTemplateColumns = "";
      const infoCol = $("info-column"),
        portCol = $("portrait-column");
      if (portCol && infoCol) grid.insertBefore(portCol, infoCol);
    }
    if (scrollWrap) {
      scrollWrap.style.gridTemplateColumns = "";
    }

    if (btn) btn.textContent = "👥 Двойная";
    fitToScreen();
  }
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
  $("cloud-save-btn").addEventListener("click", saveToCloud);
  $("new-char-btn").addEventListener("click", () => {
    if (confirm("Создать нового?")) {
      sessionStorage.removeItem(TEMP_KEY);
      S.currentCharacterId = null;
      location.reload();
    }
  });
  $("clear-btn").addEventListener("click", () => {
    if (confirm("Сбросить всё?")) {
      sessionStorage.removeItem(TEMP_KEY);
      S.currentCharacterId = null;
      location.reload();
    }
  });
  $("export-btn").addEventListener("click", handleExport);
}

async function handleExport() {
  const btn = $("export-btn");
  btn.disabled = true;
  btn.textContent = "⏳ Подготовка...";
  try {
    await exportToPNG(false);
    showToast("PNG сохранён ✓");
  } catch (err) {
    showToast("Ошибка экспорта: " + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "⬇ Скачать PNG";
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
  };
  if (S.role === "role-antagonist")
    return {
      ...b,
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
    };
  return b;
}

async function exportToPNG(ret = false) {
  const { default: html2canvas } = await import("html2canvas");
  const W = S.sheetW,
    H = S.sheetH,
    theme = getExportTheme();
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
  // Имена
  [
    ["#header-name-input", S.nameFontSize],
    ["#header-name-input-right", S.nameFontSize * 0.8],
  ].forEach(([sel, fs]) => {
    const inp = sheet.querySelector(sel);
    if (!inp || (sel.includes("right") && !S.dualMode)) return;
    const v = inp.value || "";
    const d = makeDiv(
      v || "ДОСЬЕ ПЕРСОНАЖА",
      `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;font-family:'Cormorant Garamond',serif;font-size:${fs}px;font-weight:700;color:${v ? theme.nameColor : theme.namePlaceholder};background:transparent;border:none;text-align:center;letter-spacing:6px;line-height:1;padding:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:${v ? "normal" : "italic"}`,
    );
    inp.before(d);
    inp.style.display = "none";
    reps.push([inp, d]);
  });
  sheet
    .querySelectorAll(
      'input[type="text"]:not(.header-name-input):not(.ery-number-input),input:not([type]):not(.header-name-input)',
    )
    .forEach((inp) => {
      if (
        inp.id === "header-name-input" ||
        inp.id === "header-name-input-right" ||
        inp.id === "role-badge-edit-input"
      )
        return;
      const v = inp.value || "";
      const d = makeDiv(
        v || inp.placeholder || "—",
        `font-family:'Philosopher',serif;font-size:${S.inputFontSize}px;color:${v ? theme.inputColor : theme.inputPlaceholder};background:transparent;display:block;width:100%;border:none;border-bottom:1px dashed ${theme.inputBorder};padding:4px 0 6px;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box;font-style:${v ? "normal" : "italic"}`,
      );
      inp.before(d);
      inp.style.display = "none";
      reps.push([inp, d]);
    });
  sheet.querySelectorAll(".ery-number-input").forEach((inp) => {
    const v = inp.value || "";
    const d = makeDiv(
      v || "0",
      `font-family:'Cormorant Garamond',serif;font-size:${S.eryFontSize}px;font-weight:700;color:${theme.numberColor};background:transparent;display:inline;border:none;padding:0;margin-left:14px;opacity:${v ? "1" : "0.3"};vertical-align:baseline`,
    );
    inp.before(d);
    inp.style.display = "none";
    reps.push([inp, d]);
  });
  sheet.querySelectorAll("textarea").forEach((ta) => {
    const v = ta.value || "";
    const isH = ta.classList.contains("history-textarea");
    const bg = isH
      ? `background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent 53px,${theme.historyLine} 53px,${theme.historyLine} 54px);`
      : "";
    const d = makeDiv(
      v || ta.placeholder || "",
      `font-family:'Philosopher',serif;font-size:${isH ? "36px" : S.inputFontSize + "px"};color:${v ? (isH ? theme.historyColor : theme.customColor) : isH ? theme.historyPlaceholder : theme.customPlaceholder};background:transparent;display:block;width:100%;min-height:${isH ? "580px" : "54px"};border:none;border-bottom:${isH ? "none" : `1px dashed ${theme.customBorder}`};padding:${isH ? "0 6px" : "4px 0 6px"};line-height:${isH ? "54px" : "1.5"};white-space:pre-wrap;word-break:break-word;overflow:hidden;box-sizing:border-box;font-style:${v ? "normal" : "italic"};${bg}`,
    );
    ta.before(d);
    ta.style.display = "none";
    reps.push([ta, d]);
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
      backgroundColor: "#dfc87e",
      logging: false,
      imageTimeout: 5000,
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
  if (!dataUrl) throw new Error("Canvas пустой");
  if (ret) return dataUrl;
  const a = document.createElement("a");
  a.download = `character_${Date.now()}.png`;
  a.href = dataUrl;
  a.click();
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
  const btn = $("cloud-save-btn"),
    orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Сохранение...";
  try {
    const name = $("header-name-input").value.trim() || "Безымянный";
    const cd = collectState();
    const eid = S.currentCharacterId || null;
    const roleClass = S.role || "";
    const roleField = S.customFields.find(
      (f) => f.label?.trim().toLowerCase() === "роль" && f.type !== "divider",
    );
    const roleText = S.roleBadgeCustomText || roleField?.value || "";
    let pUrl = cd.port?.src || "";
    if (pUrl && isDataUrl(pUrl)) {
      showToast("Загрузка портрета...");
      pUrl = await uploadImageToCloudinary(pUrl, {
        folder: "character-sheet/portraits",
      });
      cd.port.src = pUrl;
      S.port.src = pUrl;
    }
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
      role_class: roleClass,
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
        $("header-name-input-right")?.value.trim() || "Безымянный";
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
    showToast("Ошибка: " + (err?.message || ""), true);
  } finally {
    btn.disabled = false;
    btn.textContent = orig;
  }
}

// ============================================================
// FIELD VALUES
// ============================================================

function getFieldValues() {
  const ids = [
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
  const o = {};
  ids.forEach((id) => {
    const e = $(id);
    if (e) o[id] = e.value;
  });
  return o;
}
function getDualFieldValues() {
  const ids = [
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
  const o = {};
  ids.forEach((id) => {
    const e = $(id);
    if (e) o[id] = e.value;
  });
  return o;
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
  Object.entries(S._savedFields || {}).forEach(([id, v]) => {
    const e = $(id);
    if (e) {
      e.value = v;
      e.dispatchEvent(new Event("input"));
    }
  });
  if (!S.eryHintVisible) $("rank-info-inline")?.classList.add("hidden");
  if (!S._fieldsRendered) {
    S.customFields.forEach((f) => {
      if (f.type === "divider") renderCustomDivider(f);
      else renderCustomField(f);
    });
    S._fieldsRendered = true;
  }
  applyFieldOrder();
  S.hiddenFields.forEach((id) => {
    const e = document.querySelector(`[data-field-id="${id}"]`);
    if (e) e.style.display = "none";
  });
  if (S.port.src && S.port.src !== "loading") {
    portImg.src = S.port.src;
    portImg.onload = () => {
      portWrapper.classList.add("active");
      portPH.style.display = "none";
      portHint.classList.add("visible");
      applyPortTransform();
      updatePortraitButtonsVisibility();
    };
  }
  if (S.bg.src) renderBg();
  if (S.role) {
    roleSelect.value = S.role;
    applyRole(S.role);
  }
  updateRoleBadge();
  if (S.customColor) {
    const ci = $("custom-color-input");
    if (ci) ci.value = S.customColor;
    applyCustomColor();
  }

  if (S.dualMode) {
    setTimeout(() => {
      const rl = $("fields-list-right");
      Object.entries(S._savedFields2 || {}).forEach(([id, v]) => {
        const e = $(id);
        if (e) {
          e.value = v;
          e.dispatchEvent(new Event("input"));
        }
      });
      if (rl && S.customFields2)
        S.customFields2.forEach((f) => {
          if (f.type === "divider") renderCustomDivider(f, rl, true);
          else renderCustomField(f, rl, true);
        });
      if (rl)
        S.hiddenFields2.forEach((id) => {
          const e = rl.querySelector(`[data-field-id="${id}"]`);
          if (e) e.style.display = "none";
        });
      if (S.fieldOrder2?.length && rl)
        S.fieldOrder2.forEach((id) => {
          const e = rl.querySelector(`[data-field-id="${id}"]`);
          if (e) rl.appendChild(e);
        });

      // Инициализируем Sortable для правой колонки
      initDragAndDrop();

      [
        "header-name-input-right",
        "field-r-age",
        "field-r-birth",
        "field-r-nation",
        "field-r-clan",
        "field-r-nature",
        "field-r-occupation",
        "field-r-history",
        "erythrogen-value-right",
      ].forEach((id) => {
        $(id)?.addEventListener("change", () => saveTempState());
      });
    }, 100);
  }
  [
    "header-name-input",
    "field-age",
    "field-birth",
    "field-nation",
    "field-clan",
    "field-nature",
    "field-occupation",
    "field-history",
  ].forEach((id) => {
    $(id)?.addEventListener("change", () => saveTempState());
  });
}

// ============================================================
// HELPERS
// ============================================================

function clamp(v, mn, mx) {
  return Math.min(mx, Math.max(mn, v));
}
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}
function readFile(f, cb) {
  const r = new FileReader();
  r.onload = (e) => cb(e.target.result);
  r.readAsDataURL(f);
}
function isDataUrl(v) {
  return typeof v === "string" && v.startsWith("data:");
}
function showToast(msg, err = false) {
  const t = $("toast");
  t.textContent = msg;
  t.style.background = err ? "#4a0808" : "#2a1206";
  t.style.borderColor = err ? "#cc2222" : "#8b6914";
  t.style.opacity = "1";
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.style.opacity = "0"), 2800);
}

export function loadCharacterData(data) {
  if (data.is_duo && data.duo_partner_data) {
    const c = {
      ...data.data,
      dualMode: true,
      fields2: data.duo_partner_data.fields || {},
      customFields2: data.duo_partner_data.customFields || [],
      hidden2: data.duo_partner_data.hidden || [],
      fieldOrder2: data.duo_partner_data.fieldOrder || [],
    };
    sessionStorage.setItem(TEMP_KEY, JSON.stringify(c));
  } else sessionStorage.setItem(TEMP_KEY, JSON.stringify(data.data || data));
}
