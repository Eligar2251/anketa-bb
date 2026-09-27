// FILE: app/page.js
"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { clearTransfer, writeTransfer } from "../lib/transfer";

const ROLE_NAMES = {
  "": "Стандартная",
  "role-hero": "Главный герой",
  "role-antagonist": "Антагонист",
  "role-deuteragonist": "Дейтерагонист",
  "role-tritagonist": "Тритагонист",
  "role-secondary": "Второстепенный",
  "role-mentor": "Наставник",
  "role-sidekick": "Помощник/Сайдкик",
  "role-antihero": "Антигерой",
  "role-catalyst": "Катализатор",
  "role-episodic": "Эпизодический",
  "role-background": "Фоновый",
  "role-neutral": "Нейтральный",
};

const ROLE_STYLES = {
  "": {
    border: "#7a4a1a",
    bg: "rgba(245,228,185,0.97)",
    accent: "#8b6914",
    text: "#2a1206",
    badge: "#c49050",
    badgeText: "#2a1206",
  },
  "role-hero": {
    border: "#b8860b",
    bg: "rgba(255,248,220,0.97)",
    accent: "#b8860b",
    text: "#5a3a00",
    badge: "#daa520",
    badgeText: "#3a2000",
  },
  "role-antagonist": {
    border: "#9a3050",
    bg: "rgba(25,10,18,0.97)",
    accent: "#f08098",
    text: "#ffeef2",
    badge: "#9a3050",
    badgeText: "#ffeef2",
  },
  "role-deuteragonist": {
    border: "#d2691e",
    bg: "rgba(255,238,210,0.97)",
    accent: "#d2691e",
    text: "#5a2a00",
    badge: "#ff8c00",
    badgeText: "#3a1500",
  },
  "role-tritagonist": {
    border: "#8b4789",
    bg: "rgba(235,225,245,0.97)",
    accent: "#8b4789",
    text: "#3a1a3a",
    badge: "#9370db",
    badgeText: "#2a0a2a",
  },
  "role-secondary": {
    border: "#4a7c2a",
    bg: "rgba(225,245,215,0.97)",
    accent: "#4a7c2a",
    text: "#1a3a0a",
    badge: "#5a9a3a",
    badgeText: "#0a2a00",
  },
  "role-mentor": {
    border: "#4169e1",
    bg: "rgba(215,228,250,0.97)",
    accent: "#2a5aaa",
    text: "#0a1a4a",
    badge: "#4169e1",
    badgeText: "#ffffff",
  },
  "role-sidekick": {
    border: "#1e90ff",
    bg: "rgba(215,242,255,0.97)",
    accent: "#1e90ff",
    text: "#0a2a4a",
    badge: "#4fa8ff",
    badgeText: "#002a5a",
  },
  "role-antihero": {
    border: "#8b1a1a",
    bg: "rgba(245,215,220,0.97)",
    accent: "#8b1a1a",
    text: "#3a0a0a",
    badge: "#a52a2a",
    badgeText: "#ffeaea",
  },
  "role-catalyst": {
    border: "#20b2aa",
    bg: "rgba(215,248,245,0.97)",
    accent: "#20b2aa",
    text: "#0a3a38",
    badge: "#40d4cc",
    badgeText: "#002a28",
  },
  "role-episodic": {
    border: "#8a8a7a",
    bg: "rgba(238,238,232,0.97)",
    accent: "#8a8a7a",
    text: "#3a3a2a",
    badge: "#a0a090",
    badgeText: "#2a2a1a",
  },
  "role-background": {
    border: "#9a9480",
    bg: "rgba(235,232,225,0.97)",
    accent: "#9a9480",
    text: "#4a4838",
    badge: "#b0aa90",
    badgeText: "#3a3828",
  },
  "role-neutral": {
    border: "#707060",
    bg: "rgba(225,225,220,0.97)",
    accent: "#707060",
    text: "#2a2a1a",
    badge: "#8a8a70",
    badgeText: "#1a1a0a",
  },
};

// ===== Утилиты для генерации цветов в галерее =====
function hexToHsl(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
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

function hsl(h, s, l, a) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  if (a !== undefined && a < 1) {
    return `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,${a})`;
  }
  return `hsl(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%)`;
}

function adaptS(origS, factor, min = 8, max = 95) {
  return Math.max(min, Math.min(max, origS * factor));
}

function generateCardColors(baseHex) {
  const { h, s, l } = hexToHsl(baseHex);
  const dark = l < 50;
  const hWarm = (((h + 25) % 360) + 360) % 360;

  if (dark) {
    return {
      border: hsl(h, adaptS(s, 0.8, 10, 65), 28),
      bg: hsl(h, adaptS(s, 0.4, 5, 30), 9, 0.97),
      accent: hsl(h, adaptS(s, 0.65, 12, 65), 62),
      text: hsl(hWarm, adaptS(s, 0.15, 3, 18), 94),
      badge: hsl(h, adaptS(s, 0.7, 10, 65), 28),
      badgeText: hsl(hWarm, adaptS(s, 0.15, 3, 18), 94),
    };
  }

  const hText =
    (h >= 0 && h <= 60) || h >= 300 ? (h - 10 + 360) % 360 : (h + 10) % 360;

  return {
    border: hsl(h, adaptS(s, 0.75, 12, 70), 35),
    bg: hsl(h, adaptS(s, 0.5, 8, 48), 92, 0.97),
    accent: hsl(h, adaptS(s, 0.6, 10, 58), 40),
    text: hsl(hText, adaptS(s, 0.35, 5, 38), 12),
    badge: hsl(h, adaptS(s, 0.6, 10, 58), 50),
    badgeText: hsl(hText, adaptS(s, 0.25, 5, 28), 10),
  };
}

function getCardStyle(char) {
  if (char.custom_color) return generateCardColors(char.custom_color);
  const roleClass = char.role_class || "";
  return ROLE_STYLES[roleClass] || ROLE_STYLES[""];
}

function getCardRoleLabel(char) {
  if (char.role_badge_text) return char.role_badge_text;
  if (char.role_text) return char.role_text;
  return ROLE_NAMES[char.role_class || ""] || "Стандартная";
}

/**
 * Cloudinary отдаёт исходный файл, который часто заметно больше карточки.
 * Для галереи достаточно web-версии шириной 640px: это сохраняет качество
 * на Retina-экранах и не заставляет браузер декодировать огромные оригиналы.
 */
function getGalleryImageUrl(url) {
  if (!url || typeof url !== "string") return url;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("cloudinary.com")) return url;

    const uploadMarker = "/image/upload/";
    const markerIndex = parsed.pathname.indexOf(uploadMarker);
    if (markerIndex === -1) return url;

    const pathBeforeUpload = parsed.pathname.slice(0, markerIndex + uploadMarker.length);
    const pathAfterUpload = parsed.pathname.slice(
      markerIndex + uploadMarker.length,
    );
    if (/^(?:f_auto|q_auto|w_\d+)/.test(pathAfterUpload)) return url;

    parsed.pathname = `${pathBeforeUpload}f_auto,q_auto,w_640/${pathAfterUpload}`;
    return parsed.toString();
  } catch {
    return url;
  }
}

function SkeletonCard() {
  return (
    <div className="gallery-skeleton" aria-hidden="true">
      <div className="gallery-skeleton-media" />
      <div className="gallery-skeleton-copy">
        <div className="gallery-skeleton-title" />
        <div className="gallery-skeleton-role" />
      </div>
      <div className="gallery-skeleton-actions" />
    </div>
  );
}

/**
 * Карточка вынесена и мемоизирована: прокрутка больше не вызывает перерисовку
 * всей сетки из-за наведения мыши. Состояние hover теперь полностью обрабатывает
 * CSS, что заметно уменьшает нагрузку на main thread.
 */
const GalleryCard = memo(function GalleryCard({
  char,
  isLoading,
  hasImageError,
  isDragOver,
  isDragging,
  onLoad,
  onDelete,
  onImageError,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const cardStyle = getCardStyle(char);
  const roleLabel = getCardRoleLabel(char);
  const imageUrl = getGalleryImageUrl(char.image_url);
  const characterName =
    char.is_duo && char.duo_name
      ? `${char.name || "?"} & ${char.duo_name}`
      : char.name || "Безымянный";

  return (
    <article
      className={`gallery-card${isDragOver ? " drag-over-card" : ""}${
        isDragging ? " is-dragging" : ""
      }`}
      style={{
        "--card-bg": cardStyle.bg,
        "--card-border": cardStyle.border,
        "--card-accent": cardStyle.accent,
        "--card-text": cardStyle.text,
        "--card-badge": cardStyle.badge,
        "--card-badge-text": cardStyle.badgeText,
      }}
      draggable
      onDragStart={(event) => onDragStart(event, char.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOver(event, char.id)}
      onDrop={(event) => onDrop(event, char.id)}
    >
      <div className="gallery-card-media">
        {char.image_url && !hasImageError ? (
          <img
            src={imageUrl}
            alt={char.name || "Персонаж"}
            loading="lazy"
            decoding="async"
            onError={() => onImageError(char.id)}
          />
        ) : (
          <div className="gallery-card-no-image">
            <svg width="50" height="70" viewBox="0 0 110 150" aria-hidden="true">
              <circle cx="55" cy="42" r="26" fill="var(--card-accent)" />
              <path
                d="M8 148Q8 88 55 88Q102 88 102 148Z"
                fill="var(--card-accent)"
              />
            </svg>
            <span>Нет фото</span>
          </div>
        )}

        <div className="gallery-card-media-gradient" aria-hidden="true" />

        <div className="gallery-card-role" title={roleLabel}>
          {roleLabel}
        </div>

        {char.is_duo && (
          <div
            className="gallery-card-duo"
            title={`Пара: ${char.name} & ${char.duo_name || "?"}`}
          >
            👥
          </div>
        )}

        {char.custom_color && (
          <div
            className="gallery-card-color-dot"
            style={{ background: char.custom_color }}
            title={`Цвет: ${char.custom_color}`}
            aria-label={`Цвет: ${char.custom_color}`}
          />
        )}

        {isLoading && (
          <div className="gallery-card-loading" role="status" aria-label="Загрузка">
            <span className="gallery-spinner" />
          </div>
        )}
      </div>

      <div className="gallery-card-name" title={characterName}>
        {characterName}
      </div>
      <div className="gallery-card-divider" aria-hidden="true" />

      <div className="gallery-card-actions">
        <button
          className="gallery-btn gallery-btn-load"
          onClick={(event) => {
            event.stopPropagation();
            onLoad(char);
          }}
          disabled={isLoading}
          title="Открыть анкету"
        >
          {isLoading ? "⏳ ..." : "Анкета"}
        </button>
        <button
          className="gallery-btn gallery-btn-delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(char);
          }}
          disabled={isLoading}
          aria-label={`Удалить ${characterName}`}
          title="Удалить"
        >
          ✕
        </button>
      </div>
    </article>
  );
});

export default function GalleryPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imgErrors, setImgErrors] = useState(() => new Set());
  const [loadingCharId, setLoadingCharId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const dragRef = useRef(null);

  const fetchCharacters = useCallback(async () => {
    const db = getSupabase();
    if (!db) {
      setError("Supabase не настроен");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await db
        .from("characters")
        .select(
          "id, name, image_url, role_class, role_text, role_badge_text, custom_color, created_at, sort_order, is_duo, duo_name",
        )
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (fetchError) throw fetchError;
      setCharacters(data || []);
      setImgErrors(new Set());
    } catch (fetchError) {
      console.error("Gallery fetch error:", fetchError);
      setError(fetchError.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const handleDragStart = useCallback((event, charId) => {
    setDragId(charId);
    dragRef.current = charId;
    event.dataTransfer.effectAllowed = "move";
    event.currentTarget.classList.add("is-dragging");
  }, []);

  const handleDragEnd = useCallback((event) => {
    event.currentTarget.classList.remove("is-dragging");
    dragRef.current = null;
    setDragId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((event, charId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverId((previousId) =>
      previousId === charId ? previousId : charId,
    );
  }, []);

  const handleDrop = useCallback(
    async (event, targetId) => {
      event.preventDefault();
      const sourceId = dragRef.current;
      dragRef.current = null;

      if (!sourceId || sourceId === targetId) {
        setDragId(null);
        setDragOverId(null);
        return;
      }

      const newList = [...characters];
      const fromIndex = newList.findIndex((character) => character.id === sourceId);
      const toIndex = newList.findIndex((character) => character.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return;

      const [movedCharacter] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, movedCharacter);
      setCharacters(newList);
      setDragId(null);
      setDragOverId(null);

      const db = getSupabase();
      if (!db) return;

      try {
        // Запросы остаются UPDATE, чтобы не пытаться создать запись через
        // upsert, но выполняются параллельно и не ждут друг друга.
        const updates = newList.map((character, index) =>
          db
            .from("characters")
            .update({ sort_order: index })
            .eq("id", character.id),
        );
        const results = await Promise.all(updates);
        const updateError = results.find((result) => result.error)?.error;
        if (updateError) throw updateError;
      } catch (sortError) {
        console.error("Sort save error:", sortError);
      }
    },
    [characters],
  );

  const handleLoad = useCallback(async (char) => {
    const db = getSupabase();
    if (!db) return;

    setLoadingCharId(char.id);
    try {
      const { data, error: fetchError } = await db
        .from("characters")
        .select("data, is_duo, duo_partner_data, duo_name")
        .eq("id", char.id)
        .single();
      if (fetchError) throw fetchError;

      let payload =
        typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      if (!payload || typeof payload !== "object") payload = {};
      payload.currentCharacterId = char.id;

      if (data.is_duo && data.duo_partner_data) {
        const partner =
          typeof data.duo_partner_data === "string"
            ? JSON.parse(data.duo_partner_data)
            : data.duo_partner_data;
        payload.dualMode = true;
        payload.fields2 = partner.fields || {};
        payload.customFields2 = partner.customFields || [];
        payload.hidden2 = partner.hidden || [];
        payload.fieldOrder2 = partner.fieldOrder || [];
        payload.duoName = data.duo_name || "";
      }

      writeTransfer(payload);
      window.location.href = "/editor";
    } catch (loadError) {
      console.error("Load error:", loadError);
      alert("Ошибка загрузки: " + loadError.message);
      setLoadingCharId(null);
    }
  }, []);

  const handleDelete = useCallback(async (char) => {
    const db = getSupabase();
    if (!db || !confirm(`Удалить «${char.name}»?`)) return;

    try {
      const { error: deleteError } = await db
        .from("characters")
        .delete()
        .eq("id", char.id);
      if (deleteError) throw deleteError;
      setCharacters((previous) => previous.filter((item) => item.id !== char.id));
    } catch (deleteError) {
      alert("Ошибка удаления: " + deleteError.message);
    }
  }, []);

  const handleImageError = useCallback((charId) => {
    setImgErrors((previous) => {
      if (previous.has(charId)) return previous;
      const next = new Set(previous);
      next.add(charId);
      return next;
    });
  }, []);

  const handleCreateNew = useCallback(() => {
    clearTransfer();
    window.location.href = "/editor";
  }, []);

  return (
    <div className="gallery-page">
      <div className="gallery-backdrop" aria-hidden="true">
        <div className="gallery-backdrop-image" />
        <div className="gallery-backdrop-vignette" />
        <div className="gallery-backdrop-shade" />
        <div className="gallery-backdrop-texture" />
      </div>

      <div className="gallery-layer">
        <header className="gallery-header">
          <div className="gallery-header-title">
            <div className="gallery-brand">✦ Галерея Персонажей</div>
            {!loading && characters.length > 0 && (
              <span className="gallery-count">{characters.length}</span>
            )}
          </div>
          <button
            className="gallery-header-button"
            onClick={handleCreateNew}
            title="Новая анкета"
          >
            Анкета
          </button>
        </header>

        <main className="gallery-scroll">
          <div className="gallery-content">
            {!!error && (
              <div className="gallery-error" role="alert">
                ⚠ {error}
              </div>
            )}

            {loading && (
              <div className="gallery-grid" aria-label="Загрузка галереи">
                {Array.from({ length: 8 }, (_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            )}

            {!loading && !error && characters.length === 0 && (
              <div className="gallery-empty-state">
                <div className="gallery-empty-icon" aria-hidden="true">
                  📜
                </div>
                <div className="gallery-empty-title">Галерея пуста</div>
                <div className="gallery-empty-copy">Создайте первого персонажа!</div>
              </div>
            )}

            {!loading && characters.length > 0 && (
              <div className="gallery-grid">
                {characters.map((char) => (
                  <GalleryCard
                    key={char.id}
                    char={char}
                    isLoading={loadingCharId === char.id}
                    hasImageError={imgErrors.has(char.id)}
                    isDragOver={dragOverId === char.id && dragId !== char.id}
                    isDragging={dragId === char.id}
                    onLoad={handleLoad}
                    onDelete={handleDelete}
                    onImageError={handleImageError}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
