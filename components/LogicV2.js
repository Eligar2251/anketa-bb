// FILE: components/LogicV2.js
// Логика нового (второго) дизайна анкеты — Victorian/фэнтези стиль
// Полностью независимый модуль, не трогает Logic.js (старый дизайн)
"use strict";

import Sortable from "sortablejs";
import { getSupabase } from "../lib/supabase";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "../lib/cloudinary";
import {
  generateThemeFromColor,
  applyThemeToElement,
} from "../lib/colorUtils";
import {
  TEMP_KEY,
  TRANSFER_KEY,
  readLocalMirror,
} from "../lib/transfer";
// TEMP_KEY общий со старым дизайном: любая анкета из галереи автоматически
// перестраивается под новый дизайн. TRANSFER_KEY — зеркало для новой вкладки.
const DEFAULT_SW = 1880,
  DEFAULT_SH = 2400,
  DEFAULT_PW = 720,
  DEFAULT_PH = 1100;
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
  motto: "Девиз",
  reputation: "Репутация",
  status: "Статус",
  bonds: "Узы",
  sigil: "Символ рода",
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
let _statusInitialized = false;
let _reputationInitialized = false;

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
  labelFontSize: 22,
  inputFontSize: 30,
  nameFontSize: 70,
  eryFontSize: 64,
  eryTitleFontSize: 22,
  rankNameFontSize: 26,
  rankRangeFontSize: 22,
  eryHintVisible: true,
  currentCharacterId: null,
  autoSaveTimer: null,
  _savedFields: {},
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
  roleBadgeFontSize: 22,
  // ===== Новые фичи для v2 =====
  motto: "",                  // Девиз / цитата персонажа
  status: "alive",            // alive / deceased / missing / unknown
  reputation: "neutral",      // glorious / noble / neutral / shady / notorious
  bonds: "",                  // Узы / связи (textarea)
  sigilColor: "#8b1a1a",      // Цвет печати рода
  sigilText: "",              // Буква/символ на печати рода
  duoName: "",                // Имя второго персонажа (для duo, без UI в v2)
  _sortable: null,
  _bondsInit: false,
  _sigilInit: false,
  _duoToastShown: false,
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

  if (
    !sheet ||
    !canvasArea ||
    !zoomLabel ||
    !bgLayer ||
    !portArea ||
    !portWrapper ||
    !portImg ||
    !portPH ||
    !portHint ||
    !portColEl ||
    !resizeHandle ||
    !roleSelect ||
    !fieldsList
  ) {
    console.warn("initApp v2: DOM ещё не готов");
    _initialized = false;
    return;
  }
  if (_initialized) return;
  _initialized = true;

  const hadLocalData = loadState();
  applySheetSize();
  applyPortraitSize();
  applyFontSizes();
  injectFieldIcons();
  applyCustomColor();
  // Лист должен вмещать контент ДО первого fit — иначе вписывание
  // считается по старой высоте и анкета выглядит обрезанной
  autoFitSheetHeight();
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

  // ===== Новые инициализаторы v2 =====
  initMotto();
  initStatusSelector();
  initReputationSelector();

  restoreAll();
  initDragAndDrop();
  // Применяем значения новых полей после восстановления
  applyStatusToUI();
  applyReputationToUI();

  // Кастомные поля из restoreAll могли сделать контент выше —
  // подгоняем и пересчитываем вписывание
  if (autoFitSheetHeight()) fitToScreen();

  // Веб-шрифты (Cormorant Garamond и т.п.) догружаются асинхронно —
  // их метрики меняют высоту блоков, поэтому меряем ещё раз
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      autoFitSheetHeight();
    });
  }

  startAutoSave();
  updateRoleBadge();

  // Если открыли в новой вкладке по прямой ссылке /v2?id=... и хранилища
  // пустые — подтягиваем анкету из Supabase (авто-перестроение под v2).
  if (!hadLocalData) {
    const urlId = new URLSearchParams(window.location.search).get("id");
    if (urlId) fetchCharacterById(urlId);
  }
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
  _statusInitialized = false;
  _reputationInitialized = false;

  if (S.autoSaveTimer) {
    clearInterval(S.autoSaveTimer);
    S.autoSaveTimer = null;
  }
  if (S._sortable) {
    try {
      S._sortable.destroy();
    } catch {}
    S._sortable = null;
  }
  S._bondsInit = false;
  S._sigilInit = false;
  S._duoToastShown = false;
}

// ============================================================
// AUTOSAVE
// ============================================================
function startAutoSave() {
  if (S.autoSaveTimer) clearInterval(S.autoSaveTimer);
  S.autoSaveTimer = setInterval(() => saveTempState(), AUTOSAVE_INTERVAL);
}
function saveTempState() {
  try {
    const raw = JSON.stringify(collectState());
    sessionStorage.setItem(TEMP_KEY, raw);
    // Зеркало для открытия в новой вкладке
    try {
      localStorage.setItem(
        TRANSFER_KEY,
        JSON.stringify({ ts: Date.now(), payload: raw }),
      );
    } catch {}
  } catch {}
}

// ============================================================
// COLLECT STATE
// ============================================================
function collectState() {
  // Подхватываем кастомные поля
  fieldsList?.querySelectorAll(".custom-field-row").forEach((row) => {
    const id = row.dataset.fieldId;
    const inp = row.querySelector("input,textarea");
    const cf = S.customFields.find((f) => f.id === id);
    if (cf && inp) cf.value = inp.value;
  });
  // Подхватываем девиз и узы напрямую из textarea (на случай рассинхрона)
  const mottoEl = $("v2-motto-input");
  if (mottoEl) S.motto = mottoEl.value;
  const bondsEl = $("v2-bonds-input");
  if (bondsEl) S.bonds = bondsEl.value;
  updateFieldOrder();

  return {
    // design_version = 2 — маркер: последнее сохранение было из нового дизайна
    design_version: 2,
    sheetW: S.sheetW,
    sheetH: S.sheetH,
    portW: S.portW,
    portH: S.portH,
    fields: getFieldValues(),
    // Duo-данные в v2 не редактируются, но бережно сохраняются как есть,
    // чтобы ничего не потерять при открытии двойной анкеты в новом дизайне.
    fields2: S._savedFields2 || {},
    hidden: [...S.hiddenFields],
    hidden2: [...S.hiddenFields2],
    customFields: S.customFields.map((f) => ({ ...f })),
    customFields2: S.customFields2.map((f) => ({ ...f })),
    customCounter: S.customCounter,
    dividerCounter: S.dividerCounter,
    role: S.role,
    customColor: S.customColor,
    fieldOrder: S.fieldOrder,
    fieldOrder2: S.fieldOrder2 || [],
    labelFontSize: S.labelFontSize,
    inputFontSize: S.inputFontSize,
    nameFontSize: S.nameFontSize,
    eryFontSize: S.eryFontSize,
    eryTitleFontSize: S.eryTitleFontSize,
    rankNameFontSize: S.rankNameFontSize,
    rankRangeFontSize: S.rankRangeFontSize,
    eryHintVisible: S.eryHintVisible,
    dualMode: S.dualMode,
    currentCharacterId: S.currentCharacterId,
    roleBadgeCustomText: S.roleBadgeCustomText,
    roleBadgeFontSize: S.roleBadgeFontSize,
    // Новые поля v2
    motto: S.motto,
    status: S.status,
    reputation: S.reputation,
    bonds: S.bonds,
    sigilColor: S.sigilColor,
    sigilText: S.sigilText,
    duoName: S.duoName,
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

// ============================================================
// INIT: MOTTO
// ============================================================
function initMotto() {
  const inp = $("v2-motto-input");
  if (!inp) return;
  if (S.motto) inp.value = S.motto;
  inp.addEventListener("input", () => {
    S.motto = inp.value;
  });
  inp.addEventListener("change", () => {
    S.motto = inp.value;
    saveTempState();
  });
}

// ============================================================
// INIT: STATUS SELECTOR (Жив / Мёртв / Пропал / Неизвестно)
// ============================================================
function initStatusSelector() {
  if (_statusInitialized) return;
  _statusInitialized = true;
  const wrap = $("v2-status-selector");
  if (!wrap) return;
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-status]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    S.status = btn.dataset.status;
    applyStatusToUI();
    saveTempState();
    showToast(`Статус: ${btn.textContent.trim()}`);
  });
}
const STATUS_MAP = {
  alive: { icon: "✦", label: "Жив", cls: "st-alive" },
  deceased: { icon: "✝", label: "Мёртв", cls: "st-deceased" },
  missing: { icon: "◌", label: "Пропал", cls: "st-missing" },
  unknown: { icon: "?", label: "Неизвестно", cls: "st-unknown" },
};
function applyStatusToUI() {
  document
    .querySelectorAll("#v2-status-selector button")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.status === S.status),
    );
  const m = STATUS_MAP[S.status] || STATUS_MAP.alive;
  // Знак статуса в шапке (виден и в PNG)
  const ic = $("v2-status-icon");
  const lbl = $("v2-status-label");
  if (ic && lbl) {
    ic.textContent = m.icon;
    lbl.textContent = m.label;
    const badge = $("v2-status-badge");
    if (badge) badge.className = "v2-status-badge " + m.cls;
  }
  // Строка статуса в блоке «Состояние» (видна и в PNG)
  const dic = $("v2-status-display-icon");
  const dlbl = $("v2-status-display-label");
  if (dic) dic.textContent = m.icon;
  if (dlbl) dlbl.textContent = m.label;
  const disp = $("v2-status-display");
  if (disp) disp.className = "v2-status-display " + m.cls;
}

// ============================================================
// INIT: REPUTATION SELECTOR (Слава / Честь / Нейтрал / Тень / Позор)
// ============================================================
function initReputationSelector() {
  if (_reputationInitialized) return;
  _reputationInitialized = true;
  const wrap = $("v2-reputation-selector");
  if (!wrap) return;
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-rep]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    S.reputation = btn.dataset.rep;
    applyReputationToUI();
    saveTempState();
    showToast(`Репутация: ${btn.title || btn.dataset.rep}`);
  });
}
function applyReputationToUI() {
  document
    .querySelectorAll("#v2-reputation-selector button")
    .forEach((b) =>
      b.classList.toggle("active", b.dataset.rep === S.reputation),
    );
  const bar = $("v2-reputation-bar");
  if (bar) {
    const map = {
      glorious: { fill: 100, cls: "rep-glorious", label: "Славный" },
      noble: { fill: 75, cls: "rep-noble", label: "Благородный" },
      neutral: { fill: 50, cls: "rep-neutral", label: "Нейтральный" },
      shady: { fill: 30, cls: "rep-shady", label: "Сомнительный" },
      notorious: { fill: 10, cls: "rep-notorious", label: "Позорный" },
    };
    const m = map[S.reputation] || map.neutral;
    bar.className = "v2-reputation-bar " + m.cls;
    const fill = bar.querySelector(".v2-reputation-fill");
    if (fill) fill.style.width = m.fill + "%";
    const lbl = $("v2-reputation-label");
    if (lbl) lbl.textContent = m.label;
  }
}

// ============================================================
// INIT: BONDS (textarea)
// ============================================================
function initBonds() {
  if (S._bondsInit) return;
  S._bondsInit = true;
  const ta = $("v2-bonds-input");
  if (!ta) return;
  // restoreAll уже подставил значение из fields; S.bonds — запасной источник
  if (!ta.value && S.bonds) ta.value = S.bonds;
  S.bonds = ta.value || "";
  ta.addEventListener("input", () => {
    S.bonds = ta.value;
  });
  ta.addEventListener("change", () => {
    S.bonds = ta.value;
    saveTempState();
  });
}

// ============================================================
// INIT: SIGIL (печатка рода: цвет + буква/символ)
// ============================================================
function initSigil() {
  if (S._sigilInit) return;
  S._sigilInit = true;
  const cp = $("v2-sigil-color");
  const tx = $("v2-sigil-text");
  if (!cp || !tx) return;
  if (S.sigilColor) {
    try {
      cp.value = S.sigilColor;
    } catch {}
  }
  if (S.sigilText) tx.value = S.sigilText;
  cp.addEventListener("input", () => {
    S.sigilColor = cp.value;
    applySigilPreview();
    saveTempState();
  });
  tx.addEventListener("input", () => {
    S.sigilText = tx.value.trim();
    applySigilPreview();
  });
  tx.addEventListener("change", () => {
    S.sigilText = tx.value.trim();
    applySigilPreview();
    saveTempState();
  });
  applySigilPreview();
}
function applySigilPreview() {
  const prev = $("v2-sigil-preview");
  const lbl = $("v2-sigil-preview-label");
  if (!prev) return;
  const color =
    S.sigilColor && S.sigilColor.startsWith("#") ? S.sigilColor : "#8b1a1a";
  prev.style.background = `radial-gradient(circle at 30% 30%, ${color} 0%, ${shade(color, -25)} 70%, ${shade(color, -45)} 100%)`;
  prev.style.border = "none";
  if (lbl) lbl.textContent = (S.sigilText || "✦").slice(0, 6);
}
function shade(hex, percent) {
  hex = hex.replace("#", "");
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const f = percent / 100;
  const adjust = (c) =>
    Math.max(0, Math.min(255, Math.round(c + (f < 0 ? c * f : (255 - c) * f))));
  return `rgb(${adjust(r)},${adjust(g)},${adjust(b)})`;
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
  setupSlider("ery-title-font-size", "ery-title-font-val", "eryTitleFontSize");
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
  r.style.setProperty("--ery-title-font-size", S.eryTitleFontSize + "px");
  r.style.setProperty("--rank-name-font-size", S.rankNameFontSize + "px");
  r.style.setProperty("--rank-range-font-size", S.rankRangeFontSize + "px");
  // Крупные шрифты делают блоки выше — лист должен подрасти
  autoFitSheetHeight();
}

// ============================================================
// ROLE BADGE EDITOR
// ============================================================
function initRoleBadgeEditor() {
  const textEl = $("role-badge-text");
  const editInput = $("role-badge-edit-input");
  if (!textEl || !editInput) return;

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

    if (
      val &&
      val !== (ROLE_DISPLAY_NAMES[S.role || ""] || "Стандартная")
    ) {
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
// FIELD ICONS (статичные поля) + DRAG&DROP порядок полей
// ============================================================
function injectFieldIcons() {
  document.querySelectorAll(".field-icon-wrap[data-icon]").forEach((el) => {
    if (el.innerHTML.trim()) return;
    el.innerHTML = getIconForField(el.dataset.icon);
  });
}

function initDragAndDrop() {
  if (!fieldsList) return;
  if (S._sortable) {
    try {
      S._sortable.destroy();
    } catch {}
    S._sortable = null;
  }
  try {
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
  } catch (e) {
    console.warn("v2 Sortable error:", e);
  }
}

function updateFieldOrder() {
  if (!fieldsList) return;
  S.fieldOrder = Array.from(fieldsList.children)
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

// ============================================================
// SIZES & VIEW
// ============================================================
function applySheetSize() {
  sheet.style.width = S.sheetW + "px";
  sheet.style.height = S.sheetH + "px";
}
// ============================================================
// AUTOFIT: высота листа всегда вмещает контент.
// Блоки v2 (девиз, репутация, статус, символ рода, узы, история)
// заметно выше, чем было в v1 — при фиксированной высоте 2400px
// они вылезали за пергамент и обрезались (overflow: hidden).
// Лист только РАСТЁТ (ручное уменьшение не трогаем).
// Возвращает true, если высота изменилась.
// ============================================================
const AUTOFIT_SKIP = new Set([
  "sheet-bg-layer",
  "sheet-parchment",
  "sheet-resize-handle",
  "sheet-resize-x",
]);
function autoFitSheetHeight() {
  if (!sheet) return false;
  let maxBottom = 0;
  sheet.querySelectorAll(":scope > *").forEach((el) => {
    if (AUTOFIT_SKIP.has(el.id)) return;
    if (el.classList.contains("sheet-border")) return;
    if (el.classList.contains("v2-corner")) return; // позиционируются от низа
    const b = el.offsetTop + el.offsetHeight;
    if (b > maxBottom) maxBottom = b;
  });
  // + запас на нижний отступ (padding 80px) и погрешность шрифтов
  const need = Math.ceil(maxBottom + 56);
  if (need > S.sheetH) {
    S.sheetH = Math.min(need, 12000);
    sheet.style.height = S.sheetH + "px";
    applyView();
    return true;
  }
  return false;
}
function applyPortraitSize() {
  portColEl.style.width = S.portW + "px";
  portArea.style.height = S.portH + "px";
}
function applyView() {
  sheet.style.transform = `translate(${S.tx}px,${S.ty}px) scale(${S.scale})`;
  zoomLabel.textContent = Math.round(S.scale * 100) + "%";
}
function fitToScreen() {
  const vw = canvasArea.clientWidth,
    vh = canvasArea.clientHeight;
  const sc = Math.min(vw / S.sheetW, vh / S.sheetH) * 0.9;
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
        e.target.closest(".portrait-medallion") ||
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
// RESIZE
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
      autoFitSheetHeight();
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
  if (!inp) return;
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
    if (target) hideField(target);
  });
}
function hideField(id) {
  if (id.startsWith("custom_") || id.startsWith("cdiv_")) {
    document.querySelector(`[data-field-id="${id}"]`)?.remove();
    S.customFields = S.customFields.filter((f) => f.id !== id);
    updateFieldOrder();
    saveTempState();
    return;
  }
  const el = document.querySelector(`[data-field-id="${id}"]`);
  if (el) {
    el.style.display = "none";
    S.hiddenFields.add(id);
  }
  if (id === "erythrogen") {
    const d = $("divider-ery");
    if (d) {
      d.style.display = "none";
      S.hiddenFields.add("divider-ery");
    }
  }
  updateFieldOrder();
  saveTempState();
}
function showField(id) {
  const el = document.querySelector(`[data-field-id="${id}"]`);
  if (el) {
    el.style.display = "";
    S.hiddenFields.delete(id);
  }
  if (id === "erythrogen") {
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
    autoFitSheetHeight();
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
    autoFitSheetHeight();
    $("new-field-label").value = "";
    modal.style.display = "none";
    updateFieldOrder();
    saveTempState();
  });
}
function renderCustomField(f, container = null) {
  const c = container || fieldsList;
  if (!c || c.querySelector(`[data-field-id="${f.id}"]`)) return;
  const w = document.createElement("div");
  w.className = "custom-field-row";
  w.dataset.fieldId = f.id;

  // Иконка — простой SVG по имени
  const ic = getIconForField(f.icon);
  const inp =
    f.type === "textarea"
      ? `<textarea class="custom-field-textarea" placeholder="—" rows="2"></textarea>`
      : `<input type="text" class="field-input" placeholder="—" autocomplete="off"/>`;
  w.innerHTML = `<div class="field-delete-btn ui-only" data-target="${f.id}" title="Удалить">✕</div>
    <div class="field-icon-wrap">${ic}</div>
    <div class="field-content"><span class="field-label">${esc(f.label)}</span>${inp}</div>`;
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

function getIconForField(name) {
  // Упрощённые inline-иконки (чтобы не зависеть от Icons.js старого дизайна)
  const wrap = (svg) =>
    `<svg class="ficon" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${svg}</svg>`;
  const map = {
    scroll: wrap(
      `<rect x="8" y="6" width="20" height="24" rx="1.5"/><line x1="12" y1="13" x2="24" y2="13"/><line x1="12" y1="18" x2="24" y2="18"/><line x1="12" y1="23" x2="20" y2="23"/>`,
    ),
    sword: wrap(
      `<line x1="8" y1="28" x2="28" y2="8"/><polyline points="22,8 28,8 28,14"/><line x1="8" y1="28" x2="13" y2="23"/><rect x="6" y="26" width="6" height="3" transform="rotate(-45 9 27.5)"/>`,
    ),
    shield: wrap(
      `<path d="M18 5 L28 9 V20 Q28 26 18 31 Q8 26 8 20 V9 Z"/><path d="M14 18 L17 21 L23 14"/>`,
    ),
    flame: wrap(
      `<path d="M18 30 Q12 24 14 18 Q14 12 18 6 Q22 12 22 18 Q24 24 18 30 Z"/><path d="M18 26 Q16 22 17 19 Q18 16 19 19 Q20 22 18 26"/>`,
    ),
    eye: wrap(
      `<path d="M4 18 Q10 9 18 9 Q26 9 32 18 Q26 27 18 27 Q10 27 4 18 Z"/><circle cx="18" cy="18" r="4"/><circle cx="18" cy="18" r="1.2" fill="currentColor"/>`,
    ),
    heart: wrap(
      `<path d="M18 30 C12 24 6 20 6 14 Q6 9 11 9 Q15 9 18 13 Q21 9 25 9 Q30 9 30 14 C30 20 24 24 18 30 Z"/>`,
    ),
    star: wrap(
      `<polygon points="18,5 21,14 30,14 23,20 26,29 18,23 10,29 13,20 6,14 15,14"/>`,
    ),
    key: wrap(
      `<circle cx="11" cy="18" r="5"/><line x1="15" y1="18" x2="30" y2="18"/><line x1="24" y1="18" x2="24" y2="22"/><line x1="28" y1="18" x2="28" y2="22"/>`,
    ),
    crystal: wrap(
      `<polygon points="18,5 26,12 22,28 14,28 10,12"/><line x1="18" y1="5" x2="18" y2="28"/><line x1="10" y1="12" x2="26" y2="12"/>`,
    ),
    rune: wrap(
      `<circle cx="18" cy="18" r="11"/><line x1="11" y1="18" x2="25" y2="18"/><line x1="18" y1="11" x2="18" y2="25"/><path d="M14 14 L22 22 M22 14 L14 22"/>`,
    ),
    hourglass: wrap(
      `<path d="M9 6 H27 V12 Q27 18 18 18 Q27 18 27 24 V30 H9 V24 Q9 18 18 18 Q9 18 9 12 Z"/>`,
    ),
    moon: wrap(
      `<path d="M24 6 Q14 8 14 18 Q14 28 24 30 Q18 28 18 18 Q18 8 24 6 Z"/>`,
    ),
    globe: wrap(
      `<circle cx="18" cy="18" r="12"/><ellipse cx="18" cy="18" rx="6" ry="12"/><line x1="6" y1="18" x2="30" y2="18"/>`,
    ),
    tree: wrap(
      `<path d="M18 30 V18 M18 18 Q10 16 10 10 Q14 8 18 12 Q22 8 26 10 Q26 16 18 18 M14 30 H22"/>`,
    ),
    mask: wrap(
      `<path d="M6 12 Q18 4 30 12 V22 Q18 30 6 22 Z"/><circle cx="13" cy="16" r="1.6" fill="currentColor"/><circle cx="23" cy="16" r="1.6" fill="currentColor"/><path d="M13 22 Q18 25 23 22"/>`,
    ),
    quill: wrap(
      `<path d="M28 6 Q18 8 12 18 L8 28 L18 24 Q28 18 28 6 Z"/><line x1="12" y1="18" x2="8" y2="28"/>`,
    ),
    height: wrap(
      `<line x1="18" y1="6" x2="18" y2="30"/><path d="M14 10 L18 6 L22 10"/><path d="M14 26 L18 30 L22 26"/>`,
    ),
    origin: wrap(
      `<circle cx="18" cy="18" r="10"/><circle cx="18" cy="18" r="3" fill="currentColor"/>`,
    ),
    age: wrap(
      `<path d="M9 6 H27 V12 Q27 18 18 18 Q27 18 27 24 V30 H9 V24 Q9 18 18 18 Q9 18 9 12 Z"/>`,
    ),
    weight: wrap(
      `<path d="M18 4 L6 12 L6 30 H30 V12 Z"/><line x1="14" y1="20" x2="22" y2="20"/>`,
    ),
    gender: wrap(
      `<circle cx="14" cy="12" r="5"/><line x1="14" y1="17" x2="14" y2="30"/><line x1="9" y1="22" x2="14" y2="17"/><polyline points="22,10 30,10 30,18"/><line x1="26" y1="14" x2="30" y2="18"/>`,
    ),
    skills: wrap(
      `<path d="M6 14 L18 6 L30 14 V28 H6 Z"/><line x1="12" y1="14" x2="12" y2="28"/><line x1="24" y1="14" x2="24" y2="28"/><line x1="6" y1="14" x2="30" y2="14"/>`,
    ),
    inventory: wrap(
      `<rect x="6" y="14" width="24" height="16" rx="2"/><path d="M12 14 V8 Q12 6 14 6 H22 Q24 6 24 8 V14"/><line x1="18" y1="20" x2="18" y2="24"/>`,
    ),
    location: wrap(
      `<path d="M18 30 Q8 22 8 14 Q8 6 18 6 Q28 6 28 14 Q28 22 18 30 Z"/><circle cx="18" cy="14" r="4"/>`,
    ),
    speech: wrap(
      `<path d="M6 8 H30 V22 H22 L18 28 L14 22 H6 Z"/><circle cx="13" cy="15" r="1.2" fill="currentColor"/><circle cx="18" cy="15" r="1.2" fill="currentColor"/><circle cx="23" cy="15" r="1.2" fill="currentColor"/>`,
    ),
    status: wrap(
      `<circle cx="18" cy="18" r="11"/><path d="M14 18 L17 21 L23 14"/>`,
    ),
    race: wrap(
      `<path d="M6 30 Q6 16 18 14 Q30 16 30 30 Z"/><circle cx="14" cy="20" r="1.5" fill="currentColor"/><circle cx="22" cy="20" r="1.5" fill="currentColor"/>`,
    ),
    appearance: wrap(
      `<circle cx="18" cy="12" r="6"/><path d="M6 30 Q6 20 18 20 Q30 20 30 30"/>`,
    ),
    title: wrap(
      `<path d="M8 18 L18 8 L28 18 V30 H8 Z"/><line x1="13" y1="22" x2="23" y2="22"/>`,
    ),
    faction: wrap(
      `<rect x="6" y="14" width="24" height="16"/><path d="M12 14 V8 L18 12 L24 8 V14"/><line x1="12" y1="20" x2="24" y2="20"/><line x1="12" y1="26" x2="24" y2="26"/>`,
    ),
    alignment: wrap(
      `<line x1="18" y1="6" x2="18" y2="30"/><path d="M6 10 L18 14 L30 10"/><path d="M6 26 L18 22 L30 26"/>`,
    ),
    magic: wrap(
      `<polygon points="18,4 21,14 31,14 23,21 26,31 18,25 10,31 13,21 5,14 15,14"/>`,
    ),
    companion: wrap(
      `<circle cx="13" cy="13" r="4"/><circle cx="23" cy="13" r="4"/><path d="M5 28 Q5 19 13 19 Q21 19 21 28"/><path d="M15 28 Q15 19 23 19 Q31 19 31 28"/>`,
    ),
    faith: wrap(
      `<path d="M18 6 L21 14 L29 14 L23 19 L25 27 L18 22 L11 27 L13 19 L7 14 L15 14 Z"/>`,
    ),
    bloodline: wrap(
      `<circle cx="18" cy="10" r="3"/><path d="M12 30 V20 Q12 14 18 14 Q24 14 24 20 V30"/><line x1="14" y1="22" x2="22" y2="22"/>`,
    ),
    profession: wrap(
      `<rect x="8" y="10" width="20" height="20"/><line x1="8" y1="16" x2="28" y2="16"/><line x1="14" y1="6" x2="22" y2="6"/>`,
    ),
    relations: wrap(
      `<circle cx="10" cy="12" r="4"/><circle cx="26" cy="12" r="4"/><circle cx="18" cy="26" r="4"/><line x1="10" y1="16" x2="18" y2="22"/><line x1="26" y1="16" x2="18" y2="22"/><line x1="14" y1="12" x2="22" y2="12"/>`,
    ),
    voice: wrap(
      `<path d="M10 12 Q10 6 18 6 Q26 6 26 12 V20 Q26 26 18 26 Q10 26 10 20 Z"/><line x1="18" y1="26" x2="18" y2="32"/><line x1="14" y1="32" x2="22" y2="32"/>`,
    ),
    death: wrap(
      `<circle cx="18" cy="18" r="12"/><line x1="10" y1="10" x2="26" y2="26"/><line x1="26" y1="10" x2="10" y2="26"/>`,
    ),
    cause_death: wrap(
      `<circle cx="18" cy="18" r="12"/><path d="M14 18 L17 21 L23 14"/>`,
    ),
    birthdate: wrap(
      `<rect x="6" y="8" width="24" height="22" rx="2"/><line x1="6" y1="14" x2="30" y2="14"/><line x1="11" y1="6" x2="11" y2="12"/><line x1="25" y1="6" x2="25" y2="12"/>`,
    ),
    reputation: wrap(
      `<polygon points="18,6 21,16 31,16 23,22 26,31 18,25 10,31 13,22 5,16 15,16"/>`,
    ),
    wounds: wrap(
      `<path d="M6 18 L13 11 L18 16 L23 11 L30 18 L24 24 L30 30 L18 24 L6 30 L12 24 Z"/>`,
    ),
    homeland: wrap(
      `<path d="M3 22 L18 8 L33 22 V30 H3 Z"/><rect x="14" y="22" width="8" height="8"/>`,
    ),
    persona: wrap(
      `<circle cx="18" cy="18" r="12"/><path d="M12 16 Q18 12 24 16"/><circle cx="13" cy="20" r="1.2" fill="currentColor"/><circle cx="23" cy="20" r="1.2" fill="currentColor"/><path d="M14 24 Q18 27 22 24"/>`,
    ),
    enemy: wrap(
      `<line x1="8" y1="8" x2="28" y2="28"/><line x1="28" y1="8" x2="8" y2="28"/><circle cx="18" cy="18" r="6"/>`,
    ),
    goal: wrap(
      `<circle cx="18" cy="18" r="10"/><circle cx="18" cy="18" r="5"/><circle cx="18" cy="18" r="1.5" fill="currentColor"/>`,
    ),
    erythrogen: wrap(
      `<path d="M8 18 Q8 8 18 6 Q28 8 28 18 Q28 28 18 30 Q8 28 8 18 Z"/><circle cx="18" cy="18" r="4" fill="currentColor"/>`,
    ),
  };
  return map[name] || map.scroll;
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
    autoFitSheetHeight();
    updateFieldOrder();
    saveTempState();
  });
}
function renderCustomDivider(d, container = null) {
  const c = container || fieldsList;
  if (!c || c.querySelector(`[data-field-id="${d.id}"]`)) return;
  const w = document.createElement("div");
  w.className = "section-divider custom-divider";
  w.dataset.fieldId = d.id;
  w.innerHTML = `<div class="field-delete-btn ui-only" data-target="${d.id}" title="Удалить">✕</div>
    <div class="field-icon-wrap divider-drag-handle ui-only" title="Перетащить"><svg class="ficon" viewBox="0 0 36 36"><line x1="8" y1="12" x2="28" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="18" x2="28" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="24" x2="28" y2="24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
    <svg class="divider-line-svg" width="100%" height="34" viewBox="0 0 800 34" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="0" y1="17" x2="340" y2="17" stroke="#7a4a1a" stroke-width="1.2"/>
      <line x1="460" y1="17" x2="800" y2="17" stroke="#7a4a1a" stroke-width="1.2"/>
      <path d="M340,17 L360,7 L395,17 L360,27 Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/>
      <path d="M460,17 L440,7 L405,17 L440,27 Z" fill="#9a6425" stroke="#7a4a1a" stroke-width=".8"/>
      <circle cx="400" cy="17" r="5" fill="#7a4a1a"/>
    </svg>`;
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
  updateRoleBadge();
}
function updateRoleBadge() {
  const textEl = $("role-badge-text");
  const badgeEl = $("role-badge-sheet");
  if (!textEl || !badgeEl) return;
  if (S.roleBadgeCustomText) textEl.textContent = S.roleBadgeCustomText;
  else textEl.textContent = ROLE_DISPLAY_NAMES[S.role || ""] || "Стандартная";
  badgeEl.style.display = "flex";
  if (S.roleBadgeFontSize) textEl.style.fontSize = S.roleBadgeFontSize + "px";
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
// DUAL MODE: в v2 двойные анкеты только ПРОСМАТРИВАЮТСЯ/сохраняются,
// а редактирование второго персонажа — в старом дизайне.
// Данные второго персонажа при этом не теряются (см. collectState).
// ============================================================
function initDualModeToggle() {
  if (_dualInitialized) return;
  _dualInitialized = true;
  const btn = $("dual-mode-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (S.dualMode) {
      showToast("Двойная анкета: второй персонаж сохранится как есть");
    } else {
      showToast("Двойные анкеты создаются в старом дизайне (📜 Дизайн v1)");
    }
  });
}

function applyDualMode() {
  const btn = $("dual-mode-btn");
  if (btn && S.dualMode) btn.textContent = "👥 Двойная ✓";
  if (S.dualMode && !S._duoToastShown) {
    S._duoToastShown = true;
    setTimeout(
      () => showToast("Двойная анкета: в v2 показан первый персонаж"),
      600,
    );
  }
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
      try {
        sessionStorage.removeItem(TEMP_KEY);
        localStorage.removeItem(TRANSFER_KEY);
      } catch {}
      S.currentCharacterId = null;
      // Убираем ?id= из адреса, чтобы не подтянуть старого персонажа
      window.history.replaceState({}, "", "/v2");
      location.reload();
    }
  });
  $("clear-btn").addEventListener("click", () => {
    if (confirm("Сбросить всё?")) {
      try {
        sessionStorage.removeItem(TEMP_KEY);
        localStorage.removeItem(TRANSFER_KEY);
      } catch {}
      S.currentCharacterId = null;
      window.history.replaceState({}, "", "/v2");
      location.reload();
    }
  });
  $("export-btn").addEventListener("click", handleExport);
  $("print-btn-v2")?.addEventListener("click", handlePrint);
}

async function handlePrint() {
  const btn = $("print-btn-v2");
  const orig = btn ? btn.textContent : "";
  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "⏳ Печать...";
    }
    // WYSIWYG-печать: рендерим точный PNG анкеты и печатаем его
    const dataUrl = await exportToPNG(true);
    const name =
      $("header-name-input")?.value.trim() || "Безымянный";
    const w = window.open("", "_blank", "noopener,width=1200,height=800");
    if (!w) {
      showToast("Разрешите всплывающие окна для печати", true);
      return;
    }
    w.document.write(
      `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Анкета — ${esc(name)}</title>` +
        `<style>@page{size:A4 landscape;margin:8mm}html,body{margin:0;padding:0;background:#fff}` +
        `img{display:block;width:100%;height:auto}` +
        `@media print{img{width:100%}}</style></head>` +
        `<body><img src="${dataUrl}" alt="Анкета персонажа"/></body></html>`,
    );
    w.document.close();
    w.focus();
    const doPrint = () => {
      try {
        w.print();
      } catch {}
    };
    const img = w.document.querySelector("img");
    if (img && !img.complete) img.onload = () => setTimeout(doPrint, 150);
    else setTimeout(doPrint, 400);
    showToast("Открыта вкладка печати ✓");
  } catch (err) {
    showToast("Ошибка печати: " + (err?.message || ""), true);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = orig;
    }
  }
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
    nameColor: "#1e0e04",
    namePlaceholder: "rgba(30,14,4,0.55)",
    inputColor: "#1e0e04",
    inputPlaceholder: "rgba(122,74,26,0.26)",
    inputBorder: "rgba(122,74,26,0.32)",
    customColor: "#1e0e04",
    customPlaceholder: "rgba(122,74,26,0.25)",
    customBorder: "rgba(122,74,26,0.3)",
    historyColor: "#2a1206",
    historyPlaceholder: "rgba(59,31,10,0.25)",
    historyLine: "rgba(100,60,20,0.13)",
    numberColor: "#8b0000",
  };
  // Тёмная роль (антогонист): светлый текст, как в старом дизайне
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

  const pI = sheet.querySelector("#portrait-img");
  const pP = pI?.style.cssText || "";
  if (pI && S.port.src && S.port.src !== "loading")
    pI.style.cssText = `transform:none;position:absolute;left:${S.port.x}px;top:${S.port.y}px;width:${S.port.nw * S.port.sc}px;height:${S.port.nh * S.port.sc}px;`;
  const bI = bgLayer.querySelector("img");
  const bP = bI?.style.cssText || "";
  if (bI)
    bI.style.cssText = `transform:none;position:absolute;left:${S.bg.x}px;top:${S.bg.y}px;width:${S.bg.nw * S.bg.sc}px;height:${S.bg.nh * S.bg.sc}px;`;
  const reps = [];

  // html2canvas не рендерит inline-SVG с width="100%" (разделители,
  // заголовок «Хроника» и т.п.) — задаём им явные пиксельные размеры,
  // а после снятия скриншота возвращаем как было.
  const svgFixes = [];
  sheet.querySelectorAll("svg").forEach((sv) => {
    const r = sv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const pw = sv.getAttribute("width"),
      ph = sv.getAttribute("height");
    sv.setAttribute("width", String(Math.round(r.width)));
    sv.setAttribute("height", String(Math.round(r.height)));
    svgFixes.push([sv, pw, ph]);
  });

  // Имена
  [
    ["#header-name-input", S.nameFontSize],
  ].forEach(([sel, fs]) => {
    const inp = sheet.querySelector(sel);
    if (!inp) return;
    const v = inp.value || "";
    const d = makeDiv(
      v || "ИМЯ ПЕРСОНАЖА",
      `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;font-family:'Cormorant Garamond',serif;font-size:${fs}px;font-weight:700;color:${v ? theme.nameColor : theme.namePlaceholder};background:transparent;border:none;text-align:center;letter-spacing:5px;line-height:1;padding:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:${v ? "normal" : "italic"}`,
    );
    inp.before(d);
    inp.style.display = "none";
    reps.push([inp, d]);
  });

  // Все input/textarea (девиз и узы обрабатываются ниже отдельно)
  sheet
    .querySelectorAll(
      'input[type="text"]:not(.header-name-input):not(.ery-number-input),input:not([type]):not(.header-name-input)',
    )
    .forEach((inp) => {
      if (
        inp.id === "header-name-input" ||
        inp.id === "role-badge-edit-input" ||
        inp.id === "v2-motto-input" ||
        inp.id === "v2-bonds-input" ||
        inp.id === "v2-sigil-text"
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
    if (ta.id === "v2-motto-input" || ta.id === "v2-bonds-input") {
      // Специальная обработка для новых блоков v2
      const v = ta.value || "";
      const isMotto = ta.id === "v2-motto-input";
      if (isMotto) {
        const d = makeDiv(
          v || "Девиз или изречение этого создания…",
          `font-family:'Cormorant Garamond',serif;` +
            `font-style:italic;font-size:38px;` +
            `color:${v ? theme.historyColor : theme.historyPlaceholder};` +
            `background:transparent;display:block;width:100%;` +
            `text-align:center;border:none;` +
            `line-height:1.35;white-space:pre-wrap;word-break:break-word;` +
            `opacity:${v ? "1" : "0.5"};box-sizing:border-box;padding:0 14px;`,
        );
        ta.before(d);
        ta.style.display = "none";
        reps.push([ta, d]);
        return;
      }
      // Узы: текст + линовка отдельными div-ами (html2canvas не рендерит
      // repeating-linear-gradient)
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "position:relative;width:100%;min-height:180px;box-sizing:border-box;";
      const d = makeDiv(
        v || "Узы, клятвы, долг перед близкими…",
        `font-family:'Philosopher',serif;` +
          `font-style:italic;font-size:28px;` +
          `color:${v ? theme.historyColor : theme.historyPlaceholder};` +
          `background:transparent;display:block;width:100%;` +
          `text-align:left;border:none;` +
          `line-height:48px;white-space:pre-wrap;word-break:break-word;` +
          `opacity:${v ? "1" : "0.5"};box-sizing:border-box;padding:0 14px;` +
          `position:relative;z-index:1;`,
      );
      wrap.appendChild(d);
      for (let ly = 47; ly < 180; ly += 48) {
        const ln = document.createElement("div");
        ln.style.cssText = `position:absolute;left:0;right:0;top:${ly}px;height:1px;background:${theme.historyLine};`;
        wrap.appendChild(ln);
      }
      ta.before(wrap);
      ta.style.display = "none";
      reps.push([ta, wrap]);
      return;
    }
    const v = ta.value || "";
    const isH = ta.classList.contains("history-textarea");
    // html2canvas не рендерит repeating-linear-gradient — линовку под текст
    // («тетрадные линии» истории) рисуем настоящими div-ами.
    if (isH) {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "position:relative;width:100%;min-height:380px;box-sizing:border-box;";
      const d = makeDiv(
        v || ta.placeholder || "",
        `font-family:'Philosopher',serif;font-size:32px;color:${v ? theme.historyColor : theme.historyPlaceholder};background:transparent;display:block;width:100%;border:none;padding:0 6px;line-height:54px;white-space:pre-wrap;word-break:break-word;overflow:hidden;box-sizing:border-box;font-style:${v ? "normal" : "italic"};position:relative;z-index:1;`,
      );
      wrap.appendChild(d);
      for (let ly = 53; ly < 380; ly += 54) {
        const ln = document.createElement("div");
        ln.style.cssText = `position:absolute;left:0;right:0;top:${ly}px;height:1px;background:${theme.historyLine};`;
        wrap.appendChild(ln);
      }
      ta.before(wrap);
      ta.style.display = "none";
      reps.push([ta, wrap]);
      return;
    }
    const d = makeDiv(
      v || ta.placeholder || "",
      `font-family:'Philosopher',serif;font-size:${S.inputFontSize + "px"};color:${v ? theme.customColor : theme.customPlaceholder};background:transparent;display:block;width:100%;min-height:54px;border:none;border-bottom:1px dashed ${theme.customBorder};padding:4px 0 6px;line-height:1.5;white-space:pre-wrap;word-break:break-word;overflow:hidden;box-sizing:border-box;font-style:${v ? "normal" : "italic"};`,
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
      backgroundColor: "#f0e4c4",
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
    svgFixes.forEach(([sv, pw, ph]) => {
      if (pw == null) sv.removeAttribute("width");
      else sv.setAttribute("width", pw);
      if (ph == null) sv.removeAttribute("height");
      else sv.setAttribute("height", ph);
    });
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
  a.download = `character_v2_${Date.now()}.png`;
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

// ============================================================
// CLOUD SAVE (тот же формат + design_version: 2)
// ============================================================
async function saveToCloud() {
  const db = getSupabase();
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
    const roleText = S.roleBadgeCustomText || "";
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
      duo_name: S.dualMode ? S.duoName || null : null,
      duo_partner_data: S.dualMode
        ? {
            fields: cd.fields2 || {},
            customFields: cd.customFields2 || [],
            hidden: cd.hidden2 || [],
            fieldOrder: cd.fieldOrder2 || [],
          }
        : null,
      role_badge_text: S.roleBadgeCustomText || null,
    };
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
    "v2-motto-input",
    "v2-bonds-input",
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
  let raw = null;
  try {
    raw = sessionStorage.getItem(TEMP_KEY);
  } catch {}
  // Новая вкладка: sessionStorage пуст — берём зеркало из localStorage
  if (!raw) raw = readLocalMirror();
  if (!raw) return false;
  try {
    applyLoadedData(JSON.parse(raw));
    return true;
  } catch (e) {
    console.warn("v2 Load error:", e);
    return false;
  }
}

// Загрузка анкеты напрямую из Supabase по ?id= (для прямых ссылок /v2?id=...).
// Формат данных тот же, что у старого дизайна → авто-перестроение под v2.
async function fetchCharacterById(charId) {
  const db = getSupabase();
  if (!db) {
    showToast("Supabase не настроен", true);
    return;
  }
  showToast("Загрузка анкеты…");
  try {
    const { data, error } = await db
      .from("characters")
      .select("data, is_duo, duo_partner_data, duo_name")
      .eq("id", charId)
      .single();
    if (error) throw error;
    let payload =
      typeof data.data === "string" ? JSON.parse(data.data) : data.data;
    if (!payload || typeof payload !== "object") payload = {};
    payload.currentCharacterId = charId;
    if (data.is_duo && data.duo_partner_data) {
      const dp =
        typeof data.duo_partner_data === "string"
          ? JSON.parse(data.duo_partner_data)
          : data.duo_partner_data;
      payload.dualMode = true;
      payload.fields2 = dp.fields || {};
      payload.customFields2 = dp.customFields || [];
      payload.hidden2 = dp.hidden || [];
      payload.fieldOrder2 = dp.fieldOrder || [];
      payload.duoName = data.duo_name || "";
    }
    applyLoadedData(payload);
    applySheetSize();
    applyPortraitSize();
    applyFontSizes();
    if (S.role) {
      roleSelect.value = S.role;
      applyRole(S.role);
    }
    if (S.customColor) {
      const ci = $("custom-color-input");
      if (ci) ci.value = S.customColor;
    }
    applyCustomColor();
    restoreAll();
    updateFieldOrder();
    autoFitSheetHeight();
    fitToScreen();
    saveTempState();
    showToast("✓ Анкета загружена");
  } catch (e) {
    console.error("v2 fetch error:", e);
    showToast("Ошибка загрузки: " + (e.message || ""), true);
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
  if (typeof d.duoName === "string") S.duoName = d.duoName;
  if (typeof d.labelFontSize === "number") S.labelFontSize = d.labelFontSize;
  if (typeof d.inputFontSize === "number") S.inputFontSize = d.inputFontSize;
  if (typeof d.nameFontSize === "number") S.nameFontSize = d.nameFontSize;
  if (typeof d.eryFontSize === "number") S.eryFontSize = d.eryFontSize;
  if (typeof d.eryTitleFontSize === "number") S.eryTitleFontSize = d.eryTitleFontSize;
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
  // Новые поля v2
  if (typeof d.motto === "string") S.motto = d.motto;
  if (typeof d.status === "string") S.status = d.status;
  if (typeof d.reputation === "string") S.reputation = d.reputation;
  if (typeof d.bonds === "string") S.bonds = d.bonds;
  if (typeof d.sigilColor === "string" && d.sigilColor) S.sigilColor = d.sigilColor;
  if (typeof d.sigilText === "string") S.sigilText = d.sigilText;
  // Обратная совместимость со старым форматом sigil (одной строкой)
  if (typeof d.sigil === "string" && d.sigil && !d.sigilColor && !d.sigilText) {
    if (d.sigil.startsWith("#")) S.sigilColor = d.sigil;
    else S.sigilText = d.sigil;
  }
  S._savedFields = d.fields || {};
  S._savedFields2 = d.fields2 || {};
  // Девиз/узы могли сохраниться только внутри fields — подхватим
  if (!S.motto && S._savedFields["v2-motto-input"])
    S.motto = S._savedFields["v2-motto-input"];
  if (!S.bonds && S._savedFields["v2-bonds-input"])
    S.bonds = S._savedFields["v2-bonds-input"];
}

function restoreAll() {
  // Базовые поля
  Object.entries(S._savedFields || {}).forEach(([id, v]) => {
    const e = $(id);
    if (e) {
      e.value = v;
      e.dispatchEvent(new Event("input"));
    }
  });
  if (!S.eryHintVisible) $("rank-info-inline")?.classList.add("hidden");
  // Кастомные поля
  S.customFields.forEach((f) => {
    if (f.type === "divider") renderCustomDivider(f);
    else renderCustomField(f);
  });
  applyFieldOrder();
  S.hiddenFields.forEach((id) => {
    const e = document.querySelector(`[data-field-id="${id}"]`);
    if (e) e.style.display = "none";
  });
  // Портрет
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
  // Новые поля v2
  initBonds();
  initSigil();
  applyStatusToUI();
  applyReputationToUI();
  if (S.dualMode) applyDualMode();
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
    const el = $(id);
    if (el && !el._v2change) {
      el._v2change = true;
      el.addEventListener("change", () => saveTempState());
    }
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
  if (!t) return;
  t.textContent = msg;
  t.style.background = err ? "#4a0808" : "#2a1206";
  t.style.borderColor = err ? "#cc2222" : "#8b6914";
  t.style.opacity = "1";
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.style.opacity = "0"), 2800);
}


