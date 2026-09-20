// FILE: lib/transfer.js
// Общий помощник для переключения между дизайнами v1 (/editor) и v2 (/v2).
// Оба дизайна используют ОДИН И ТОТ ЖЕ формат данных (ключ charSheet_temp_v12),
// поэтому любая анкета из галереи автоматически перестраивается под новый дизайн.
'use client';

export const TEMP_KEY = 'charSheet_temp_v12';
// Зеркало в localStorage — нужно для открытия v2 в НОВОЙ вкладке,
// т.к. sessionStorage при обычном открытии новой вкладки недоступен.
export const TRANSFER_KEY = 'charSheet_transfer_v1';

/** Прочитать сырое состояние из sessionStorage (если есть). */
export function readSessionRaw() {
  try {
    return sessionStorage.getItem(TEMP_KEY);
  } catch {
    return null;
  }
}

/** Скопировать состояние из sessionStorage в localStorage-зеркало. */
export function mirrorSessionToLocal() {
  try {
    const raw = sessionStorage.getItem(TEMP_KEY);
    if (raw) {
      localStorage.setItem(
        TRANSFER_KEY,
        JSON.stringify({ ts: Date.now(), payload: raw }),
      );
    }
    return raw;
  } catch {
    return null;
  }
}

/** Записать payload сразу в оба хранилища (использует галерея). */
export function writeTransfer(payloadObj) {
  try {
    const raw =
      typeof payloadObj === 'string' ? payloadObj : JSON.stringify(payloadObj);
    sessionStorage.setItem(TEMP_KEY, raw);
    localStorage.setItem(
      TRANSFER_KEY,
      JSON.stringify({ ts: Date.now(), payload: raw }),
    );
  } catch (e) {
    console.warn('writeTransfer error:', e);
  }
}

/** Прочитать зеркало из localStorage (если свежее 10 минут). */
export function readLocalMirror(maxAgeMs = 10 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(TRANSFER_KEY);
    if (!raw) return null;
    const { ts, payload } = JSON.parse(raw);
    if (!payload) return null;
    if (ts && Date.now() - ts > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Очистить оба хранилища (для кнопки «Создать»). */
export function clearTransfer() {
  try {
    sessionStorage.removeItem(TEMP_KEY);
  } catch {}
  try {
    localStorage.removeItem(TRANSFER_KEY);
  } catch {}
}

/**
 * Аккуратно уйти на другой дизайн: сначала blur (чтобы сработали
 * change-хендлеры и состояние успело сохраниться), затем зеркало + переход.
 * openInNewTab=true → window.open (для v2), иначе переход в той же вкладке.
 */
export function goToDesign(url, { openInNewTab = false } = {}) {
  try {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  } catch {}
  setTimeout(() => {
    mirrorSessionToLocal();
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener');
    } else {
      window.location.href = url;
    }
  }, 120);
}

/** Достать currentCharacterId из sessionStorage (для ?id= fallback). */
export function getStoredCharacterId() {
  try {
    const raw = sessionStorage.getItem(TEMP_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.currentCharacterId || null;
  } catch {
    return null;
  }
}

export function buildV2Url(charId) {
  return charId ? `/v2?id=${encodeURIComponent(charId)}` : '/v2';
}
