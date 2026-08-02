// FILE: lib/colorUtils.js
'use client';

/**
 * Генерирует гармоничную палитру из одного базового HEX-цвета.
 * Расширенный спектр: сохраняет насыщенность и оттенок,
 * использует комплементарные и аналогичные тона.
 */

function hexToHsl(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const r = parseInt(hex.substring(0,2), 16) / 255;
  const g = parseInt(hex.substring(2,4), 16) / 255;
  const b = parseInt(hex.substring(4,6), 16) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hslStr(h, s, l, a) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  if (a !== undefined && a < 1) return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

/**
 * Возвращает оттенок, сдвинутый на delta градусов
 */
function shiftHue(h, delta) {
  return ((h + delta) % 360 + 360) % 360;
}

/**
 * Адаптирует насыщенность: сохраняет характер цвета,
 * но ограничивает экстремальные значения
 */
function adaptS(origS, factor, min = 8, max = 95) {
  return Math.max(min, Math.min(max, origS * factor));
}

/**
 * Генерирует полную тему из базового цвета
 * @param {string} baseHex — основной цвет в HEX
 * @returns {object} — объект со всеми CSS-переменными
 */
export function generateThemeFromColor(baseHex) {
  if (!baseHex || typeof baseHex !== 'string') {
    return getDefaultTheme();
  }

  const { h, s, l } = hexToHsl(baseHex);
  const dark = l < 50;

  // Комплементарный оттенок (для акцентов)
  const hComp = shiftHue(h, 180);
  // Аналогичные оттенки
  const hWarm = shiftHue(h, 25);
  const hCool = shiftHue(h, -25);

  if (dark) {
    // ===== ТЁМНАЯ ТЕМА =====
    return {
      // Фон листа
      parchmentBg:      hslStr(h, adaptS(s, 0.5, 5, 35), 8, 0.95),
      sheetBg:          hslStr(h, adaptS(s, 0.35, 3, 25), 5),
      borderColor:      hslStr(h, adaptS(s, 0.8, 10, 65), 28),
      borderInner:      hslStr(h, adaptS(s, 0.6, 8, 50), 32, 0.35),

      // Текст
      nameColor:        hslStr(hWarm, adaptS(s, 0.25, 5, 25), 92),
      namePlaceholder:  hslStr(hWarm, adaptS(s, 0.2, 5, 20), 78, 0.5),
      labelColor:       hslStr(h, adaptS(s, 0.75, 15, 70), 68),
      inputColor:       hslStr(hWarm, adaptS(s, 0.15, 3, 18), 94),
      inputPlaceholder: hslStr(h, adaptS(s, 0.4, 8, 40), 55, 0.35),
      inputBorder:      hslStr(h, adaptS(s, 0.55, 10, 50), 38, 0.35),
      historyColor:     hslStr(hWarm, adaptS(s, 0.15, 3, 18), 92),
      historyLine:      hslStr(h, adaptS(s, 0.5, 8, 45), 32, 0.15),

      // Иконки и акценты
      iconColor:        hslStr(h, adaptS(s, 0.7, 15, 70), 62),
      eryTitleColor:    hslStr(hWarm, adaptS(s, 0.8, 15, 75), 55),
      eryNumberColor:   hslStr(hComp, adaptS(s, 0.7, 20, 75), 58),
      rankNameColor:    hslStr(hWarm, adaptS(s, 0.2, 5, 20), 92),
      rankRangeColor:   hslStr(h, adaptS(s, 0.5, 10, 50), 62),

      // Свиток
      scrollFill1:      hslStr(h, adaptS(s, 0.4, 5, 35), 12),
      scrollFill2:      hslStr(h, adaptS(s, 0.35, 5, 30), 16),

      // Рамка
      frameLine:        hslStr(h, adaptS(s, 0.7, 10, 60), 30),

      // Разделители
      dividerStroke:    hslStr(h, adaptS(s, 0.65, 10, 55), 28),

      // Границы строк
      rowBorder:        hslStr(h, adaptS(s, 0.5, 8, 45), 28, 0.25),

      // Карточка галереи
      cardBg:           hslStr(h, adaptS(s, 0.4, 5, 30), 9, 0.97),
      cardBorder:       hslStr(h, adaptS(s, 0.7, 10, 60), 28),
      cardAccent:       hslStr(h, adaptS(s, 0.65, 12, 60), 62),
      cardText:         hslStr(hWarm, adaptS(s, 0.15, 3, 18), 94),
      badgeBg:          hslStr(h, adaptS(s, 0.7, 10, 60), 28),
      badgeText:        hslStr(hWarm, adaptS(s, 0.15, 3, 18), 94),

      isDark: true,
      baseHex,
    };
  } else {
    // ===== СВЕТЛАЯ ТЕМА =====
    // Определяем «теплоту» цвета
    const isWarm = (h >= 0 && h <= 60) || h >= 300;
    const isCool = h >= 150 && h <= 270;

    // Контрастный оттенок для текста
    const hText = isWarm ? shiftHue(h, -10) : shiftHue(h, 10);

    return {
      // Фон листа
      parchmentBg:      hslStr(h, adaptS(s, 0.55, 8, 50), 90, 0.88),
      sheetBg:          hslStr(h, adaptS(s, 0.4, 5, 40), 84),
      borderColor:      hslStr(h, adaptS(s, 0.75, 12, 70), 35),
      borderInner:      hslStr(h, adaptS(s, 0.5, 8, 50), 42, 0.35),

      // Текст
      nameColor:        hslStr(hText, adaptS(s, 0.6, 10, 60), 18),
      namePlaceholder:  hslStr(hText, adaptS(s, 0.45, 8, 45), 30, 0.5),
      labelColor:       hslStr(h, adaptS(s, 0.75, 15, 72), 38),
      inputColor:       hslStr(hText, adaptS(s, 0.35, 5, 35), 12),
      inputPlaceholder: hslStr(h, adaptS(s, 0.4, 8, 40), 48, 0.3),
      inputBorder:      hslStr(h, adaptS(s, 0.5, 8, 45), 42, 0.35),
      historyColor:     hslStr(hText, adaptS(s, 0.4, 8, 40), 15),
      historyLine:      hslStr(h, adaptS(s, 0.4, 8, 35), 40, 0.15),

      // Иконки и акценты
      iconColor:        hslStr(h, adaptS(s, 0.65, 12, 65), 40),
      eryTitleColor:    hslStr(hWarm, adaptS(s, 0.7, 15, 70), 35),
      eryNumberColor:   hslStr(hComp, adaptS(s, 0.65, 15, 70), 32),
      rankNameColor:    hslStr(hText, adaptS(s, 0.4, 8, 40), 15),
      rankRangeColor:   hslStr(h, adaptS(s, 0.55, 10, 55), 40),

      // Свиток
      scrollFill1:      hslStr(h, adaptS(s, 0.5, 8, 50), 72),
      scrollFill2:      hslStr(h, adaptS(s, 0.4, 6, 42), 82),

      // Рамка
      frameLine:        hslStr(h, adaptS(s, 0.7, 12, 65), 35),

      // Разделители
      dividerStroke:    hslStr(h, adaptS(s, 0.65, 10, 60), 35),

      // Границы строк
      rowBorder:        hslStr(h, adaptS(s, 0.45, 8, 42), 42, 0.26),

      // Карточка галереи
      cardBg:           hslStr(h, adaptS(s, 0.5, 8, 48), 92, 0.97),
      cardBorder:       hslStr(h, adaptS(s, 0.7, 12, 65), 35),
      cardAccent:       hslStr(h, adaptS(s, 0.6, 10, 58), 40),
      cardText:         hslStr(hText, adaptS(s, 0.35, 5, 38), 12),
      badgeBg:          hslStr(h, adaptS(s, 0.6, 10, 58), 50),
      badgeText:        hslStr(hText, adaptS(s, 0.25, 5, 28), 10),

      isDark: false,
      baseHex,
    };
  }
}

export function getDefaultTheme() {
  return generateThemeFromColor('#c49050');
}

/**
 * Применяет тему как CSS-переменные на элемент
 */
export function applyThemeToElement(element, theme) {
  if (!element || !theme) return;

  const map = {
    '--theme-parchment-bg':       theme.parchmentBg,
    '--theme-sheet-bg':           theme.sheetBg,
    '--theme-border-color':       theme.borderColor,
    '--theme-border-inner':       theme.borderInner,
    '--theme-name-color':         theme.nameColor,
    '--theme-name-placeholder':   theme.namePlaceholder,
    '--theme-label-color':        theme.labelColor,
    '--theme-input-color':        theme.inputColor,
    '--theme-input-placeholder':  theme.inputPlaceholder,
    '--theme-input-border':       theme.inputBorder,
    '--theme-history-color':      theme.historyColor,
    '--theme-history-line':       theme.historyLine,
    '--theme-icon-color':         theme.iconColor,
    '--theme-ery-title':          theme.eryTitleColor,
    '--theme-ery-number':         theme.eryNumberColor,
    '--theme-rank-name':          theme.rankNameColor,
    '--theme-rank-range':         theme.rankRangeColor,
    '--theme-scroll-fill1':       theme.scrollFill1,
    '--theme-scroll-fill2':       theme.scrollFill2,
    '--theme-frame-line':         theme.frameLine,
    '--theme-divider-stroke':     theme.dividerStroke,
    '--theme-row-border':         theme.rowBorder,
  };

  Object.entries(map).forEach(([key, val]) => {
    if (val) element.style.setProperty(key, val);
  });
}