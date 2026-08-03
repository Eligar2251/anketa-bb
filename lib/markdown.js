// FILE: lib/markdown.js
"use client";

/**
 * ============================================================
 *  МИНИ-MARKDOWN ДЛЯ МНОГОСТРОЧНЫХ ПОЛЕЙ
 * ============================================================
 *  Намеренно маленький и без зависимостей: результат уходит
 *  и в редактор, и в PNG-экспорт (html2canvas), поэтому
 *  генерируется простой HTML без внешних стилей.
 *
 *  ВАЖНО: текст экранируется ДО разбора разметки, поэтому
 *  вставить свой HTML через поле анкеты нельзя.
 * ============================================================
 */

/** Поддерживаемый синтаксис — для подсказки в интерфейсе. */
export const MD_CHEATSHEET = [
  ["**жирный**", "жирный"],
  ["*курсив*", "курсив"],
  ["~~зачёркнутый~~", "зачёркнутый"],
  ["`моноширинный`", "моноширинный"],
  ["# Заголовок", "крупный заголовок"],
  ["## Подзаголовок", "средний заголовок"],
  ["- пункт", "маркированный список"],
  ["1. пункт", "нумерованный список"],
  ["> цитата", "выделенная цитата"],
  ["---", "горизонтальная линия"],
];

/** Горячие клавиши редактора — для подсказки в интерфейсе. */
export const EDITOR_SHORTCUTS = [
  ["Ctrl+B", "жирный"],
  ["Ctrl+I", "курсив"],
  ["Tab", "отступ (Shift+Tab — убрать)"],
  ["Enter", "продолжить список или цитату"],
  ["Enter ↓ / ↑", "переход между строками анкеты"],
];

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Инлайновая разметка. Сначала вырезаем `код`, затем экранируем
 * HTML и только потом разбираем **жирный** / *курсив* — так
 * пользовательский текст не может стать разметкой страницы.
 */
function inline(text) {
  const codes = [];
  let s = String(text).replace(/`([^`\n]+)`/g, (_, c) => {
    codes.push(escapeHtml(c));
    return `\u0000${codes.length - 1}\u0000`;
  });

  s = escapeHtml(s);

  // жирный + курсив
  s = s.replace(/\*\*\*(\S(?:[\s\S]*?\S)?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(\S(?:[\s\S]*?\S)?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(\S(?:[\s\S]*?\S)?)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*(\S(?:[^*\n]*?\S)?)\*(?![*\w])/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_\w])_(\S(?:[^_\n]*?\S)?)_(?![_\w])/g, "$1<em>$2</em>");
  s = s.replace(/~~(\S(?:[\s\S]*?\S)?)~~/g, "<s>$1</s>");

  // возвращаем код на место
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code class="md-code">${codes[i]}</code>`);
  return s;
}

/**
 * Разбирает markdown в HTML.
 * @param {string} src
 * @returns {string} HTML
 */
export function renderMarkdown(src) {
  const text = String(src ?? "");
  if (!text.trim()) return "";

  // Структуру разбираем по сырым строкам, а экранируем только
  // содержимое — иначе «>» цитаты превратилось бы в «&gt;»
  // и блок цитаты никогда бы не распознался.
  const lines = text.split(/\r?\n/);
  const out = [];

  let listType = null; // 'ul' | 'ol'
  let quoteBuf = [];
  let paraBuf = [];

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p class="md-p">${paraBuf.map(inline).join("<br>")}</p>`);
      paraBuf = [];
    }
  };
  const flushQuote = () => {
    if (quoteBuf.length) {
      out.push(
        `<blockquote class="md-quote">${quoteBuf.map(inline).join("<br>")}</blockquote>`,
      );
      quoteBuf = [];
    }
  };
  const flushAll = () => {
    flushPara();
    flushQuote();
    closeList();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // пустая строка — конец абзаца
    if (!line.trim()) {
      flushAll();
      continue;
    }

    // горизонтальная линия
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushAll();
      out.push('<hr class="md-hr">');
      continue;
    }

    // заголовки
    const h = line.match(/^\s{0,3}(#{1,4})\s+(.*)$/);
    if (h) {
      flushAll();
      const lvl = h[1].length;
      out.push(`<div class="md-h md-h${lvl}">${inline(h[2].trim())}</div>`);
      continue;
    }

    // цитата
    const q = line.match(/^\s{0,3}>\s?(.*)$/);
    if (q) {
      flushPara();
      closeList();
      quoteBuf.push(q[1]);
      continue;
    }
    flushQuote();

    // списки
    const ul = line.match(/^\s{0,3}[-*+]\s+(.*)$/);
    const ol = line.match(/^\s{0,3}\d{1,3}[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const want = ul ? "ul" : "ol";
      if (listType !== want) {
        closeList();
        out.push(`<${want} class="md-list md-${want}">`);
        listType = want;
      }
      out.push(`<li class="md-li">${inline((ul || ol)[1])}</li>`);
      continue;
    }
    closeList();

    paraBuf.push(line);
  }

  flushAll();
  return out.join("");
}

/** Есть ли в тексте хоть какая-то разметка (для подсветки кнопки). */
export function hasMarkdown(src) {
  return /(\*\*|__|~~|`|^\s{0,3}#{1,4}\s|^\s{0,3}[-*+]\s|^\s{0,3}\d{1,3}[.)]\s|^\s{0,3}>\s|^\s*(-{3,}|\*{3,})\s*$)/m.test(
    String(src ?? ""),
  );
}

/**
 * Инлайновые стили для экспорта в PNG.
 * html2canvas не видит наши CSS-классы у подменных узлов,
 * поэтому теми же правилами красим элементы напрямую.
 */
export function styleMarkdownForExport(root, opts = {}) {
  if (!root) return;
  const {
    color = "#3b1f0a",
    accent = "#7a4a1a",
    line = "rgba(100,60,20,0.13)",
    fontSize = 36,
    lineHeight = 54,
  } = opts;

  const px = (v) => `${v}px`;

  root.querySelectorAll(".md-p").forEach((el) => {
    el.style.cssText = `margin:0 0 ${px(lineHeight * 0.35)};padding:0;line-height:${px(lineHeight)};color:${color}`;
  });

  root.querySelectorAll(".md-h").forEach((el) => {
    const lvl = Number((el.className.match(/md-h(\d)/) || [])[1] || 2);
    const scale = { 1: 1.5, 2: 1.28, 3: 1.12, 4: 1 }[lvl] || 1.1;
    el.style.cssText =
      `margin:${px(lineHeight * 0.5)} 0 ${px(lineHeight * 0.25)};padding:0;` +
      `font-family:'Uncial Antiqua','Cormorant Garamond',serif;` +
      `font-size:${px(Math.round(fontSize * scale))};line-height:1.25;` +
      `letter-spacing:2px;color:${accent}`;
  });

  root.querySelectorAll(".md-list").forEach((el) => {
    el.style.cssText = `margin:0 0 ${px(lineHeight * 0.35)};padding-left:${px(fontSize * 1.2)};line-height:${px(lineHeight)};color:${color}`;
  });
  root.querySelectorAll(".md-li").forEach((el) => {
    el.style.cssText = `margin:0;padding:0;line-height:${px(lineHeight)};color:${color}`;
  });

  root.querySelectorAll(".md-quote").forEach((el) => {
    el.style.cssText =
      `margin:${px(lineHeight * 0.3)} 0;padding:0 0 0 ${px(fontSize * 0.6)};` +
      `border-left:${px(Math.max(3, fontSize * 0.1))} solid ${accent};` +
      `font-style:italic;line-height:${px(lineHeight)};color:${color};opacity:.9`;
  });

  root.querySelectorAll(".md-hr").forEach((el) => {
    el.style.cssText = `border:none;border-top:2px solid ${accent};opacity:.5;margin:${px(lineHeight * 0.5)} 0`;
  });

  root.querySelectorAll(".md-code").forEach((el) => {
    el.style.cssText =
      `font-family:'Courier New',monospace;font-size:${px(Math.round(fontSize * 0.85))};` +
      `background:${line};padding:0 6px;border-radius:3px;color:${color}`;
  });

  root.querySelectorAll("strong").forEach((el) => (el.style.fontWeight = "700"));
  root.querySelectorAll("em").forEach((el) => (el.style.fontStyle = "italic"));
  root.querySelectorAll("s").forEach((el) => (el.style.textDecoration = "line-through"));
}
