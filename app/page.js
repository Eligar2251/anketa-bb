// FILE: app/page.js
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase } from "../lib/supabase";

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
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;
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
  if (a !== undefined && a < 1)
    return `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,${a})`;
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

// Получить текст роли для бейджа на карточке
function getCardRoleLabel(char) {
  // 1. Кастомный текст бейджика (из role_badge_text в БД)
  if (char.role_badge_text) return char.role_badge_text;
  // 2. Текст роли из поля role_text
  if (char.role_text) return char.role_text;
  // 3. Автоматическое название по классу роли
  const roleClass = char.role_class || "";
  return ROLE_NAMES[roleClass] || "Стандартная";
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "rgba(245,228,185,0.12)",
        border: "2px solid rgba(122,74,26,0.18)",
        borderRadius: "8px",
        overflow: "hidden",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "3/4",
          background: "rgba(122,74,26,0.08)",
        }}
      />
      <div style={{ padding: "14px" }}>
        <div
          style={{
            height: "20px",
            background: "rgba(122,74,26,0.12)",
            borderRadius: "4px",
            margin: "0 auto",
            width: "65%",
          }}
        />
        <div
          style={{
            height: "10px",
            background: "rgba(122,74,26,0.08)",
            borderRadius: "4px",
            margin: "10px auto 0",
            width: "35%",
          }}
        />
      </div>
      <div style={{ height: "40px", background: "rgba(122,74,26,0.06)" }} />
    </div>
  );
}

// Ключ хранилища — синхронизирован с Logic.js
const TEMP_KEY = "charSheet_temp_v12";

export default function GalleryPage() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [imgErrors, setImgErrors] = useState(new Set());
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
      const { data, error } = await db
        .from("characters")
        .select(
          "id, name, image_url, role_class, role_text, role_badge_text, custom_color, created_at, sort_order, is_duo, duo_name",
        )
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setCharacters(data || []);
    } catch (e) {
      console.error("Gallery fetch error:", e);
      setError(e.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  function handleDragStart(e, charId) {
    setDragId(charId);
    dragRef.current = charId;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.5";
  }
  function handleDragEnd(e) {
    e.currentTarget.style.opacity = "1";
    setDragId(null);
    setDragOverId(null);
  }
  function handleDragOver(e, charId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (charId !== dragOverId) setDragOverId(charId);
  }
  async function handleDrop(e, targetId) {
    e.preventDefault();
    const sourceId = dragRef.current;
    if (!sourceId || sourceId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const newList = [...characters];
    const fromIdx = newList.findIndex((c) => c.id === sourceId);
    const toIdx = newList.findIndex((c) => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    setCharacters(newList);
    setDragId(null);
    setDragOverId(null);
    const db = getSupabase();
    if (db) {
      try {
        const updates = newList.map((c, i) => ({ id: c.id, sort_order: i }));
        for (const u of updates) {
          await db
            .from("characters")
            .update({ sort_order: u.sort_order })
            .eq("id", u.id);
        }
      } catch (err) {
        console.error("Sort save error:", err);
      }
    }
  }

  async function handleLoad(char) {
    const db = getSupabase();
    if (!db) return;
    setLoadingCharId(char.id);
    try {
      const { data, error } = await db
        .from("characters")
        .select("data, is_duo, duo_partner_data")
        .eq("id", char.id)
        .single();
      if (error) throw error;

      let payload =
        typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      payload.currentCharacterId = char.id;

      // Если двойная анкета — объединяем данные второго персонажа
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
      }

      sessionStorage.setItem(TEMP_KEY, JSON.stringify(payload));
      window.location.href = "/editor";
    } catch (e) {
      console.error("Load error:", e);
      alert("Ошибка загрузки: " + e.message);
      setLoadingCharId(null);
    }
  }

  async function handleDelete(char) {
    const db = getSupabase();
    if (!db) return;
    if (!confirm(`Удалить «${char.name}»?`)) return;
    try {
      const { error } = await db.from("characters").delete().eq("id", char.id);
      if (error) throw error;
      setCharacters((prev) => prev.filter((x) => x.id !== char.id));
    } catch (e) {
      alert("Ошибка удаления: " + e.message);
    }
  }

  function handleCreateNew() {
    sessionStorage.removeItem(TEMP_KEY);
    window.location.href = "/editor";
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        @keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }
        ::-webkit-scrollbar{width:8px;}
        ::-webkit-scrollbar-track{background:rgba(0,0,0,0.2);}
        ::-webkit-scrollbar-thumb{background:rgba(122,74,26,0.5);border-radius:4px;}
        ::-webkit-scrollbar-thumb:hover{background:rgba(122,74,26,0.7);}
        .drag-over-card{outline:3px dashed #daa520!important;outline-offset:-3px;}
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Philosopher',serif",
          color: "#f5e6c8",
          overflow: "hidden",
        }}
      >
        {/* Фон */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            background: "#0a0402",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/images/app-bg.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "blur(8px) brightness(0.35) saturate(0.7)",
              transform: "scale(1.1)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center,transparent 0%,rgba(0,0,0,0.6) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,rgba(14,6,1,0.85) 0%,rgba(10,4,2,0.65) 50%,rgba(14,6,1,0.9) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.3,
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(122,74,26,0.02) 2px,rgba(122,74,26,0.02) 4px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(122,74,26,0.02) 2px,rgba(122,74,26,0.02) 4px)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Шапка */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 28px",
              background: "rgba(14,6,1,0.95)",
              borderBottom: "1px solid rgba(139,105,20,0.3)",
              boxShadow: "0 2px 20px rgba(0,0,0,0.6)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  fontFamily: "'Uncial Antiqua','Cormorant Garamond',serif",
                  letterSpacing: "3px",
                  fontSize: "20px",
                  color: "#f5e6c8",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                ✦ Галерея Персонажей
              </div>
              {!loading && characters.length > 0 && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#d4a96a",
                    background: "rgba(139,105,20,0.2)",
                    border: "1px solid rgba(139,105,20,0.4)",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    letterSpacing: "0.5px",
                    fontWeight: "600",
                  }}
                >
                  {characters.length}
                </span>
              )}
            </div>
            <button
              onClick={handleCreateNew}
              style={{
                background: "linear-gradient(135deg,#3b1f0a,#5a2e0e)",
                color: "#f5e6c8",
                border: "2px solid #8b6914",
                padding: "9px 22px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "4px",
                cursor: "pointer",
                letterSpacing: "1px",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg,#5a2e0e,#7a3e1a)";
                e.currentTarget.style.borderColor = "#daa520";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg,#3b1f0a,#5a2e0e)";
                e.currentTarget.style.borderColor = "#8b6914";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              ✦ Создать персонажа
            </button>
          </div>

          {/* Контент */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "24px 28px 40px",
            }}
          >
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              {!!error && (
                <div
                  style={{
                    background: "rgba(139,0,0,0.25)",
                    border: "1px solid rgba(139,0,0,0.5)",
                    color: "#ffaaaa",
                    padding: "14px 18px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                    fontSize: "14px",
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              {loading && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                    gap: "20px",
                  }}
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {!loading && !error && characters.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "100px 20px",
                    opacity: 0.7,
                  }}
                >
                  <div
                    style={{
                      fontSize: "64px",
                      marginBottom: "20px",
                      filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
                    }}
                  >
                    📜
                  </div>
                  <div
                    style={{
                      fontSize: "24px",
                      marginBottom: "10px",
                      fontFamily: "'Cormorant Garamond',serif",
                      fontWeight: 700,
                      color: "#d4a96a",
                      textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    }}
                  >
                    Галерея пуста
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      opacity: 0.7,
                      color: "#c0a060",
                    }}
                  >
                    Создайте первого персонажа!
                  </div>
                </div>
              )}

              {!loading && characters.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                    gap: "20px",
                  }}
                >
                  {characters.map((char) => {
                    const rs = getCardStyle(char);
                    const roleLabel = getCardRoleLabel(char);
                    const isHovered = hoveredId === char.id;
                    const hasImgErr = imgErrors.has(char.id);
                    const isLoading = loadingCharId === char.id;
                    const isDragOver =
                      dragOverId === char.id && dragId !== char.id;

                    return (
                      <div
                        key={char.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, char.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, char.id)}
                        onDrop={(e) => handleDrop(e, char.id)}
                        onMouseEnter={() => !isLoading && setHoveredId(char.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={isDragOver ? "drag-over-card" : ""}
                        style={{
                          background: rs.bg,
                          border: `2px solid ${isHovered ? rs.accent : rs.border}`,
                          borderRadius: "8px",
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                          transform: isHovered
                            ? "translateY(-5px) scale(1.02)"
                            : "none",
                          boxShadow: isHovered
                            ? `0 16px 32px rgba(0,0,0,0.5),0 0 0 1px ${rs.accent}55`
                            : "0 3px 12px rgba(0,0,0,0.4)",
                          transition:
                            "transform 0.25s ease,box-shadow 0.25s ease,border-color 0.2s",
                          opacity: isLoading || dragId === char.id ? 0.5 : 1,
                          cursor: dragId ? "grabbing" : "grab",
                          pointerEvents: isLoading ? "none" : "auto",
                        }}
                      >
                        {/* Изображение */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          {char.image_url && !hasImgErr ? (
                            <img
                              src={char.image_url}
                              alt={char.name}
                              loading="lazy"
                              onError={() =>
                                setImgErrors(
                                  (prev) => new Set([...prev, char.id]),
                                )
                              }
                              style={{
                                width: "100%",
                                aspectRatio: "3/4",
                                objectFit: "cover",
                                objectPosition: "center top",
                                display: "block",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                aspectRatio: "3/4",
                                background: `linear-gradient(160deg,${rs.border}22,${rs.accent}18)`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                              }}
                            >
                              <svg
                                width="50"
                                height="70"
                                viewBox="0 0 110 150"
                                opacity="0.2"
                              >
                                <circle
                                  cx="55"
                                  cy="42"
                                  r="26"
                                  fill={rs.accent}
                                />
                                <path
                                  d="M8 148Q8 88 55 88Q102 88 102 148Z"
                                  fill={rs.accent}
                                />
                              </svg>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: rs.accent,
                                  opacity: 0.5,
                                }}
                              >
                                Нет фото
                              </span>
                            </div>
                          )}

                          {/* Градиент снизу фото */}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              pointerEvents: "none",
                              background: `linear-gradient(to bottom,transparent 50%,${rs.bg} 100%)`,
                            }}
                          />

                          {/* Бейдж роли */}
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              background: rs.badge,
                              color: rs.badgeText,
                              fontSize: "10px",
                              fontWeight: "700",
                              padding: "3px 8px",
                              borderRadius: "3px",
                              letterSpacing: "0.4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                              maxWidth: "130px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {roleLabel}
                          </div>

                          {/* Индикатор двойной анкеты */}
                          {char.is_duo && (
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                left: char.custom_color ? "28px" : "8px",
                                background: "rgba(0,0,0,0.6)",
                                color: "#f5e6c8",
                                fontSize: "10px",
                                fontWeight: "600",
                                padding: "3px 7px",
                                borderRadius: "3px",
                                letterSpacing: "0.3px",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                              }}
                              title={`Пара: ${char.name} & ${char.duo_name || "?"}`}
                            >
                              👥
                            </div>
                          )}

                          {/* Кастомный цвет — индикатор */}
                          {char.custom_color && (
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                background: char.custom_color,
                                border: "2px solid rgba(255,255,255,0.5)",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                              }}
                              title={`Цвет: ${char.custom_color}`}
                            />
                          )}

                          {/* Спиннер загрузки */}
                          {isLoading && (
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.7)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backdropFilter: "blur(4px)",
                              }}
                            >
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  border: "3px solid rgba(245,230,200,0.2)",
                                  borderTopColor: "#f5e6c8",
                                  borderRadius: "50%",
                                  animation: "spin 0.8s linear infinite",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Имя */}
                        <div
                          style={{
                            padding: "12px 12px 2px",
                            fontFamily: "'Cormorant Garamond',serif",
                            fontWeight: 700,
                            fontSize: "20px",
                            color: rs.text,
                            textAlign: "center",
                            lineHeight: 1.3,
                            letterSpacing: "0.3px",
                          }}
                        >
                          {char.is_duo && char.duo_name
                            ? `${char.name || "?"} & ${char.duo_name}`
                            : char.name || "Безымянный"}
                        </div>

                        {/* Разделитель */}
                        <div
                          style={{
                            margin: "6px 16px 10px",
                            height: "1px",
                            background: `linear-gradient(to right,transparent,${rs.accent}55,transparent)`,
                          }}
                        />

                        {/* Кнопки */}
                        <div
                          style={{
                            display: "flex",
                            marginTop: "auto",
                            borderTop: `1px solid ${rs.border}35`,
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoad(char);
                            }}
                            disabled={isLoading}
                            style={{
                              flex: 1,
                              border: "none",
                              background: isHovered
                                ? `linear-gradient(135deg,${rs.border},${rs.accent})`
                                : `${rs.border}bb`,
                              color: "#f5e6c8",
                              padding: "11px",
                              cursor: isLoading ? "wait" : "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              letterSpacing: "0.3px",
                              transition: "background 0.2s",
                              borderRight: `1px solid ${rs.border}35`,
                            }}
                          >
                            {isLoading ? "⏳ Загрузка..." : "✎ Редактировать"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(char);
                            }}
                            disabled={isLoading}
                            style={{
                              width: "42px",
                              border: "none",
                              background: "rgba(139,0,0,0.1)",
                              color: "#cc3333",
                              fontWeight: "bold",
                              cursor: isLoading ? "not-allowed" : "pointer",
                              fontSize: "15px",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (!isLoading) {
                                e.currentTarget.style.background = "#8b0000";
                                e.currentTarget.style.color = "#fff";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(139,0,0,0.1)";
                              e.currentTarget.style.color = "#cc3333";
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
