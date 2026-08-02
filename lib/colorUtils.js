// FILE: lib/colorUtils.js
"use client";

/**
 * ============================================================
 *  ГЕНЕРАТОР ТЕМ АНКЕТЫ
 * ============================================================
 *  Из одного базового цвета строится ПОЛНАЯ палитра листа.
 *
 *  Ключевое отличие от старой версии:
 *  светлота базового цвета используется НЕПРЕРЫВНО, а не
 *  «тёмная / светлая» через порог 50%. Поэтому доступен весь
 *  спектр оттенков: от почти чёрного до пергаментно-светлого,
 *  включая глубокие «тёмноватые» градиенты.
 * ============================================================
 */

/* ---------- базовые преобразования ---------- */

export function hexToHsl(hex) {
  let v = String(hex || "").replace("#", "").trim();
  if (v.length === 3) v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return { h: 30, s: 45, l: 20 };

  const r = parseInt(v.substring(0, 2), 16) / 255;
  const g = parseInt(v.substring(2, 4), 16) / 255;
  const b = parseInt(v.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToHex(h, s, l) {
  h = norm(h);
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function clamp(v, mn, mx) {
  return Math.min(mx, Math.max(mn, v));
}

function norm(h) {
  return ((h % 360) + 360) % 360;
}

function css(h, s, l, a) {
  h = Math.round(norm(h));
  s = Math.round(clamp(s, 0, 100));
  l = Math.round(clamp(l, 0, 100) * 10) / 10;
  if (a !== undefined && a < 1)
    return `hsla(${h}, ${s}%, ${l}%, ${Math.round(clamp(a, 0, 1) * 1000) / 1000})`;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * S-кривая: слегка «расталкивает» средние значения светлоты
 * к краям, чтобы середина спектра не превращалась в грязь,
 * но остаётся монотонной и непрерывной — значит доступны ВСЕ оттенки.
 */
/**
 * Воспринимаемая светлота (WCAG relative luminance → 0..100).
 * Нужна, чтобы контраст выбирался корректно для любого оттенка.
 */
function perceivedLightness(h, s, l) {
  const hex = hslToHex(h, s, l);
  const v = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(v.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const Y = 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  // L* из CIE
  return Y <= 0.008856 ? Y * 903.3 : 116 * Math.cbrt(Y) - 16;
}

function sCurve(t) {
  t = clamp(t, 0, 1);
  return t < 0.5
    ? 0.5 * Math.pow(2 * t, 1.75)
    : 1 - 0.5 * Math.pow(2 * (1 - t), 1.75);
}

/** Относительная яркость (WCAG) для HSL. */
function relLum(h, s, l) {
  const v = hslToHex(h, s, l).replace("#", "");
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(v.substr(i, 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrastRatio(l1, l2) {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Подбирает светлоту цвета (h, s) так, чтобы контраст с фоном
 * был не ниже `target`. Двигаемся от `startL` в сторону `dir`
 * (+1 светлее, −1 темнее) и при необходимости снижаем насыщенность —
 * у чистых жёлто-зелёных иначе физически не хватает динамики.
 *
 * Именно это чинит главный баг старой палитры: на светло-жёлтых
 * и салатовых темах подписи полей сливались с фоном.
 */
function solveContrast(bgLum, h, s, startL, dir, target) {
  let bestL = startL;
  let bestS = s;
  let best = 0;

  for (let sat = s; sat >= 0; sat -= Math.max(6, s / 6)) {
    for (let step = 0; step <= 100; step += 2) {
      const L = clamp(startL + dir * step, 0, 100);
      const r = contrastRatio(bgLum, relLum(h, sat, L));
      if (r > best) {
        best = r;
        bestL = L;
        bestS = sat;
      }
      if (r >= target) return { l: L, s: sat, ratio: r };
      if ((dir > 0 && L >= 100) || (dir < 0 && L <= 0)) break;
    }
    if (sat <= 0) break;
  }
  return { l: bestL, s: bestS, ratio: best };
}

/* ---------- параметры темы ---------- */

const MIN_TEXT_CONTRAST = 7;

export const DEFAULT_THEME_OPTIONS = {
  gradient: true, // градиентная заливка листа
  opacity: 0.94, // непрозрачность «пергамента» (сквозь него видно картинку фона)
  contrast: 1, // множитель контраста текста
};

/**
 * Полная тема из базового HEX.
 * @param {string} baseHex
 * @param {{gradient?:boolean, opacity?:number, contrast?:number}} options
 */
export function generateThemeFromColor(baseHex, options = {}) {
  const o = { ...DEFAULT_THEME_OPTIONS, ...(options || {}) };
  const { h, s, l } = hexToHsl(baseHex || "#c49050");

  const alpha = clamp(o.opacity ?? 0.94, 0.25, 1);
  const k = clamp(o.contrast ?? 1, 0.7, 1.4);

  // Светлота фона листа — непрерывная функция от светлоты базового цвета
  let bgL = 3 + sCurve(l / 100) * 92; // 3 … 95

  // Направление контраста выбираем по ФАКТИЧЕСКОЙ яркости фона,
  // а не по «l < 50»: жёлтый с l=50 читается светлым, синий — тёмным.
  const isDark = relLum(h, clamp(s * 0.6, 4, 48), bgL) < 0.22;
  const dir = isDark ? 1 : -1;

  // Насыщенности (sBg считаем ДО коррекции — она от него не зависит)
  const sBg = clamp(s * (isDark ? 0.6 : 0.5), 4, isDark ? 48 : 42);
  const sSoft = clamp(s * 0.75, 8, 60);
  const sAcc = clamp(s * 0.95, 16, 88);

  /**
   * Середина шкалы физически не даёт хорошего контраста: даже
   * чистый белый/чёрный текст на ней читается плохо. Поэтому фон
   * мягко «отодвигается» от мёртвой зоны, пока текст не станет
   * читаемым. Все оттенки остаются доступны — меняется только
   * светлота, причём монотонно.
   */
  for (let i = 0; i < 60; i++) {
    const best = contrastRatio(relLum(h, sBg, bgL), isDark ? 1 : 0);
    if (best >= MIN_TEXT_CONTRAST) break;
    const next = clamp(bgL - dir * 1.5, 0, 100);
    if (next === bgL) break;
    bgL = next;
  }

  const bgLum = relLum(h, sBg, bgL);

  // Родственные оттенки — дают «живой» градиент
  const hWarm = norm(h + 16);
  const hCool = norm(h - 18);
  const hComp = norm(h + 172);

  /**
   * Все текстовые цвета подбираются РЕШАТЕЛЕМ контраста, а не
   * фиксированными смещениями светлоты. Так читаемость сохраняется
   * на любом оттенке — включая проблемные жёлтые и салатовые.
   */
  const solve = (hh, ss, target) =>
    solveContrast(bgLum, hh, ss, bgL, dir, target);

  // Основной текст — самый высокий контраст (AAA)
  const txt = solve(hWarm, clamp(sSoft * (isDark ? 0.22 : 0.45), 2, 40), 9 * k > 12 ? 12 : 9 * k);
  const textL = txt.l;
  const textS = txt.s;

  // Приглушённый текст / плейсхолдеры
  const muted = solve(h, clamp(sSoft * 0.5, 4, 42), 4.5);
  const mutedL = muted.l;
  const mutedS = muted.s;

  // Заголовки полей и иконки — читаемые акценты (AA)
  const acc = solve(h, sAcc, 4.6);
  const accL = acc.l;
  const accS = acc.s;

  // Акцент дополнительного тона (эритрогены)
  const accComp = solveContrast(bgLum, hComp, sAcc, bgL, dir, 4.6);

  // Смещение светлоты от фона — для декора, где контраст не критичен
  const away = (gap) => clamp(bgL + dir * gap, 0, 100);

  // Рамки
  const borderL = away(isDark ? 20 : 30);
  const borderSoftL = away(isDark ? 12 : 20);

  // Свиток шапки
  const scr1L = away(isDark ? 9 : 12);
  const scr2L = away(isDark ? 15 : 4);
  const scr3L = away(isDark ? 5 : 18);
  const scr4L = away(isDark ? 19 : 8);

  /* ---------- фон листа ---------- */
  const solidBg = css(h, sBg, bgL);
  const flatBg = css(h, sBg, bgL, alpha);

  const gradBg = o.gradient
    ? [
        `linear-gradient(168deg, ${css(hWarm, clamp(sBg * 1.15, 4, 60), bgL + (isDark ? 6.5 : 4.5), alpha)} 0%, ` +
          `${css(h, sBg, bgL, alpha)} 46%, ` +
          `${css(hCool, clamp(sBg * 1.25, 4, 62), bgL - (isDark ? 4.5 : 6), alpha)} 100%)`,
      ].join(", ")
    : flatBg;

  return {
    /* фон */
    parchmentBg: gradBg,
    parchmentFlat: flatBg,
    sheetBg: solidBg,
    sheetBgSolid: solidBg,

    /* рамки листа */
    borderColor: css(h, sSoft, borderL),
    borderInner: css(h, sSoft, borderSoftL, 0.45),
    rowBorder: css(h, clamp(sSoft * 0.8, 6, 45), borderSoftL, 0.32),

    /* текст */
    nameColor: css(hWarm, textS, textL),
    namePlaceholder: css(hWarm, mutedS, mutedL, 0.62),
    inputColor: css(hWarm, textS, textL),
    inputPlaceholder: css(h, mutedS, mutedL, 0.55),
    inputBorder: css(h, clamp(sSoft * 0.6, 6, 46), borderSoftL, 0.42),
    labelColor: css(h, accS, accL),
    historyColor: css(hWarm, textS, textL),
    historyLine: css(h, clamp(sSoft * 0.6, 6, 45), away(isDark ? 26 : 26), 0.22),
    titleText: css(h, accS, accL),

    /* иконки и акценты */
    iconColor: css(h, clamp(accS * 0.95, 0, 100), accL),
    eryTitleColor: css(hComp, accComp.s, accComp.l),
    eryNumberColor: css(hComp, accComp.s, accComp.l),
    rankNameColor: css(hWarm, textS, textL),
    rankRangeColor: css(h, clamp(accS * 0.8, 0, 100), accL),
    rankBg: css(h, clamp(sBg * 1.1, 4, 50), away(isDark ? 6 : 6), 0.5),

    /* свиток шапки */
    scrollFill1: css(h, clamp(sBg * 1.2, 5, 55), scr1L),
    scrollFill2: css(hWarm, clamp(sBg * 1.05, 4, 50), scr2L),
    scrollFill3: css(hCool, clamp(sBg * 1.35, 6, 58), scr3L),
    scrollFill4: css(hWarm, clamp(sBg * 1.4, 6, 60), scr4L),
    scrollStroke: css(h, clamp(sSoft * 0.9, 8, 55), borderL),
    scrollStroke2: css(h, clamp(sSoft * 0.7, 6, 48), away(isDark ? 28 : 24)),

    /* рамка портрета / разделители */
    frameLine: css(h, clamp(sSoft * 0.9, 8, 58), borderL),
    dividerStroke: css(h, clamp(sSoft * 0.85, 8, 55), borderL),
    dividerFill: css(h, clamp(sAcc * 0.7, 10, 60), away(isDark ? 30 : 34)),
    dividerDot: css(h, clamp(sAcc * 0.8, 12, 65), away(isDark ? 38 : 40)),

    /* портрет */
    portraitBg: css(h, clamp(sBg * 0.9, 3, 40), away(isDark ? 4 : 8), 0.55),
    placeholderFill: css(h, clamp(sSoft * 0.6, 5, 45), away(isDark ? 22 : 24)),

    /* бейдж роли */
    badgeBg: css(h, clamp(sBg * 1.2, 5, 55), away(isDark ? 8 : 10)),
    badgeText: css(h, accS, accL),
    badgeDot: css(h, clamp(sAcc * 0.8, 12, 66), away(isDark ? 32 : 34)),

    /* карточка галереи */
    cardBg: css(h, sBg, bgL, 0.97),
    cardBorder: css(h, sSoft, borderL),
    cardAccent: css(h, accS, accL),
    cardText: css(hWarm, textS, textL),

    /* служебное */
    isDark,
    baseHex: baseHex || "#c49050",
    gradient: !!o.gradient,
    opacity: alpha,
    hsl: { h, s, l },
  };
}

export function getDefaultTheme() {
  return generateThemeFromColor("#c49050");
}

/**
 * Цвета карточки в галерее — та же палитра, что и у листа.
 *
 * ВАЖНО: помимо основных цветов отдаём готовые полупрозрачные
 * варианты. Раньше в галерее к цвету приклеивали hex-альфу
 * (`${accent}55`), что для `hsl(...)`-строк даёт невалидный CSS
 * и молча ломает тени/подложки.
 */
export function generateCardColors(baseHex) {
  const t = generateThemeFromColor(baseHex, { gradient: false, opacity: 1 });
  const { h, s, l } = t.hsl;
  const isDark = t.isDark;

  const accH = h;
  const accS = clamp(s * 0.95, 16, 88);
  const accL = isDark ? clamp(3 + sCurve(l / 100) * 92 + 46, 55, 82) : clamp(3 + sCurve(l / 100) * 92 - 44, 20, 46);
  const brdL = isDark ? clamp(3 + sCurve(l / 100) * 92 + 20, 16, 58) : clamp(3 + sCurve(l / 100) * 92 - 32, 22, 62);

  return {
    border: t.cardBorder,
    bg: t.cardBg,
    accent: t.cardAccent,
    text: t.cardText,
    badge: t.badgeBg,
    badgeText: t.badgeText,
    // полупрозрачные производные
    accentGlow: css(accH, accS, accL, 0.35),
    accentFaint: css(accH, accS, accL, 0.1),
    borderFaint: css(h, clamp(s * 0.75, 8, 60), brdL, 0.14),
    borderSoft: css(h, clamp(s * 0.75, 8, 60), brdL, 0.22),
    borderStrong: css(h, clamp(s * 0.75, 8, 60), brdL, 0.75),
  };
}

/** Дефолтные (ролевые) цвета в тот же формат. */
export function withCardAlphas(style) {
  return {
    accentGlow: "rgba(0,0,0,0.28)",
    accentFaint: "rgba(0,0,0,0.06)",
    borderFaint: "rgba(0,0,0,0.13)",
    borderSoft: "rgba(0,0,0,0.2)",
    borderStrong: "rgba(0,0,0,0.55)",
    ...style,
  };
}

/* ---------- применение к DOM ---------- */

export const THEME_VARS = [
  "--theme-parchment-bg",
  "--theme-parchment-flat",
  "--theme-sheet-bg",
  "--theme-border-color",
  "--theme-border-inner",
  "--theme-row-border",
  "--theme-name-color",
  "--theme-name-placeholder",
  "--theme-label-color",
  "--theme-input-color",
  "--theme-input-placeholder",
  "--theme-input-border",
  "--theme-history-color",
  "--theme-history-line",
  "--theme-title-text",
  "--theme-icon-color",
  "--theme-ery-title",
  "--theme-ery-number",
  "--theme-rank-name",
  "--theme-rank-range",
  "--theme-rank-bg",
  "--theme-scroll-fill1",
  "--theme-scroll-fill2",
  "--theme-scroll-fill3",
  "--theme-scroll-fill4",
  "--theme-scroll-stroke",
  "--theme-scroll-stroke2",
  "--theme-frame-line",
  "--theme-divider-stroke",
  "--theme-divider-fill",
  "--theme-divider-dot",
  "--theme-portrait-bg",
  "--theme-placeholder-fill",
  "--theme-badge-bg",
  "--theme-badge-text",
  "--theme-badge-dot",
];

export function applyThemeToElement(element, theme) {
  if (!element || !theme) return;

  const map = {
    "--theme-parchment-bg": theme.parchmentBg,
    "--theme-parchment-flat": theme.parchmentFlat,
    "--theme-sheet-bg": theme.sheetBg,
    "--theme-border-color": theme.borderColor,
    "--theme-border-inner": theme.borderInner,
    "--theme-row-border": theme.rowBorder,
    "--theme-name-color": theme.nameColor,
    "--theme-name-placeholder": theme.namePlaceholder,
    "--theme-label-color": theme.labelColor,
    "--theme-input-color": theme.inputColor,
    "--theme-input-placeholder": theme.inputPlaceholder,
    "--theme-input-border": theme.inputBorder,
    "--theme-history-color": theme.historyColor,
    "--theme-history-line": theme.historyLine,
    "--theme-title-text": theme.titleText,
    "--theme-icon-color": theme.iconColor,
    "--theme-ery-title": theme.eryTitleColor,
    "--theme-ery-number": theme.eryNumberColor,
    "--theme-rank-name": theme.rankNameColor,
    "--theme-rank-range": theme.rankRangeColor,
    "--theme-rank-bg": theme.rankBg,
    "--theme-scroll-fill1": theme.scrollFill1,
    "--theme-scroll-fill2": theme.scrollFill2,
    "--theme-scroll-fill3": theme.scrollFill3,
    "--theme-scroll-fill4": theme.scrollFill4,
    "--theme-scroll-stroke": theme.scrollStroke,
    "--theme-scroll-stroke2": theme.scrollStroke2,
    "--theme-frame-line": theme.frameLine,
    "--theme-divider-stroke": theme.dividerStroke,
    "--theme-divider-fill": theme.dividerFill,
    "--theme-divider-dot": theme.dividerDot,
    "--theme-portrait-bg": theme.portraitBg,
    "--theme-placeholder-fill": theme.placeholderFill,
    "--theme-badge-bg": theme.badgeBg,
    "--theme-badge-text": theme.badgeText,
    "--theme-badge-dot": theme.badgeDot,
  };

  const style = element.style;
  for (const key in map) {
    const val = map[key];
    if (val) style.setProperty(key, val);
  }
}

export function clearThemeFromElement(element) {
  if (!element) return;
  THEME_VARS.forEach((v) => element.style.removeProperty(v));
}

/**
 * Превью-градиент для кнопок/свотчей палитры.
 */
export function themePreviewGradient(hex, gradient = true) {
  const t = generateThemeFromColor(hex, { gradient, opacity: 1 });
  return t.parchmentBg;
}

/* ---------- готовые пресеты ---------- */

export const THEME_PRESETS = [
  // ——— глубокие тёмные ———
  { name: "Обсидиан", hex: "#1b1b22" },
  { name: "Полночь", hex: "#131b2e" },
  { name: "Индиго", hex: "#1a1636" },
  { name: "Аметист", hex: "#241733" },
  { name: "Вино", hex: "#2b1220" },
  { name: "Кровь", hex: "#2c1114" },
  { name: "Уголь и медь", hex: "#241a12" },
  { name: "Бронза", hex: "#2e2011" },
  { name: "Тёмный лес", hex: "#13251a" },
  { name: "Малахит", hex: "#0f2723" },
  { name: "Морская бездна", hex: "#0f2230" },
  { name: "Сталь", hex: "#1c2429" },

  // ——— тёмные, но насыщеннее ———
  { name: "Пурпур", hex: "#3a1f4d" },
  { name: "Сапфир", hex: "#1d2f5c" },
  { name: "Изумруд", hex: "#17402f" },
  { name: "Тёмный янтарь", hex: "#4a2f10" },
  { name: "Багрянец", hex: "#4a1522" },
  { name: "Хвоя", hex: "#20402a" },
  { name: "Грозовой", hex: "#2c3440" },
  { name: "Кофе", hex: "#3a2a1e" },

  // ——— средние ———
  { name: "Сумеречный синий", hex: "#3f5a86" },
  { name: "Мох", hex: "#4d6b45" },
  { name: "Терракота", hex: "#8a4a32" },
  { name: "Слива", hex: "#6b4478" },
  { name: "Латунь", hex: "#a07a34" },
  { name: "Бирюза", hex: "#2f7f7a" },

  // ——— светлые ———
  { name: "Пергамент", hex: "#c49050" },
  { name: "Слоновая кость", hex: "#ddd0b4" },
  { name: "Лунный камень", hex: "#c3ccdd" },
  { name: "Роза", hex: "#dfc0c4" },
  { name: "Мята", hex: "#bcd8cb" },
  { name: "Лаванда", hex: "#cdc4e2" },
];
