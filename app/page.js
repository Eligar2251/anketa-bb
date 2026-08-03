// FILE: app/page.js
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase } from "../lib/supabase";
import { generateCardColors, withCardAlphas } from "../lib/colorUtils";

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

// Палитра карточек берётся из общего генератора темы —
// раньше здесь была вторая, слегка расходящаяся копия формул,
// и карточка в галерее не совпадала по цвету с самой анкетой.
const _cardStyleCache = new Map();

function getCardStyle(char) {
  if (char.custom_color) {
    // Кэш: генератор палитры вызывался на каждый ре-рендер каждой карточки
    let c = _cardStyleCache.get(char.custom_color);
    if (!c) {
      c = generateCardColors(char.custom_color);
      _cardStyleCache.set(char.custom_color, c);
    }
    return c;
  }
  const roleClass = char.role_class || "";
  const base = ROLE_STYLES[roleClass] || ROLE_STYLES[""];
  let c = _cardStyleCache.get("role:" + roleClass);
  if (!c) {
    c = withCardAlphas(base);
    _cardStyleCache.set("role:" + roleClass, c);
  }
  return c;
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
        .limit(200);
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
    dragRef.current = null;
    setDragId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const prevList = characters;
    const newList = [...characters];
    const fromIdx = newList.findIndex((c) => c.id === sourceId);
    const toIdx = newList.findIndex((c) => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    setCharacters(newList);

    const db = getSupabase();
    if (!db) return;
    try {
      // Один upsert вместо N последовательных UPDATE:
      // раньше перетаскивание в списке из 50 карточек делало
      // 50 round-trip'ов и подвешивало страницу.
      const rows = newList.map((c, i) => ({ id: c.id, sort_order: i }));
      const { error } = await db
        .from("characters")
        .upsert(rows, { onConflict: "id" });
      if (error) throw error;
    } catch (err) {
      console.error("Sort save error:", err);
      setCharacters(prevList); // откат, чтобы UI не врал
      setError("Не удалось сохранить порядок: " + (err.message || ""));
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

      const parsed =
        typeof data.data === "string" ? JSON.parse(data.data) : data.data;
      // Защита от битой/пустой записи — иначе редактор падал на null
      const payload = parsed && typeof parsed === "object" ? { ...parsed } : {};
      payload.currentCharacterId = char.id;

      // Если двойная анкета — объединяем данные второго персонажа
      if (data.is_duo && data.duo_partner_data) {
        const dp =
          typeof data.duo_partner_data === "string"
            ? JSON.parse(data.duo_partner_data)
            : data.duo_partner_data;
        payload.dualMode = true;
        payload.fields2 = dp?.fields || {};
        payload.customFields2 = dp?.customFields || [];
        payload.hidden2 = dp?.hidden || [];
        payload.fieldOrder2 = dp?.fieldOrder || [];
      }

      sessionStorage.setItem(TEMP_KEY, JSON.stringify(payload));
      window.location.href = "/editor";
    } catch (e) {
      console.error("Load error:", e);
      setError("Ошибка загрузки: " + (e.message || ""));
      setLoadingCharId(null);
    }
  }

  async function handleDelete(char) {
    const db = getSupabase();
    if (!db) return;
    if (!confirm(`Удалить «${char.name || "Безымянный"}»?`)) return;
    const prevList = characters;
    // Оптимистичное удаление + откат при ошибке
    setCharacters((prev) => prev.filter((x) => x.id !== char.id));
    try {
      const { error } = await db.from("characters").delete().eq("id", char.id);
      if (error) throw error;
    } catch (e) {
      setCharacters(prevList);
      setError("Ошибка удаления: " + (e.message || ""));
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

        /* Карточка: ховер целиком на CSS — только composite-свойства,
           поэтому сетка из сотни карточек держит 60 fps */
        .char-card{
          background: var(--card-bg);
          border: 2px solid var(--card-border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
          transition: transform .22s ease, box-shadow .22s ease, border-color .18s ease;
          contain: layout paint style;
        }
        .char-card:hover{
          transform: translate3d(0,-5px,0) scale(1.02);
          border-color: var(--card-accent);
          box-shadow: 0 16px 32px rgba(0,0,0,0.5), 0 0 0 1px var(--card-glow);
        }
        .char-card .card-load-btn{ transition: filter .18s ease; }
        .char-card:hover .card-load-btn{ filter: brightness(1.25); }
        .char-card img{ content-visibility: auto; }

        @media (prefers-reduced-motion: reduce){
          .char-card{ transition: none; }
          .char-card:hover{ transform: none; }
        }
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
                    const hasImgErr = imgErrors.has(char.id);
                    const isLoading = loadingCharId === char.id;
                    const isDragOver =
                      dragOverId === char.id && dragId !== char.id;

                    return (
                      <div
                        key={char.id}
                        draggable={!isLoading}
                        onDragStart={(e) => handleDragStart(e, char.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, char.id)}
                        onDrop={(e) => handleDrop(e, char.id)}
                        className={
                          "char-card" + (isDragOver ? " drag-over-card" : "")
                        }
                        /* Ховер сделан на CSS: раньше он жил в React-состоянии
                           и каждое движение мыши перерисовывало ВСЮ сетку. */
                        style={{
                          "--card-bg": rs.bg,
                          "--card-border": rs.border,
                          "--card-accent": rs.accent,
                          "--card-glow": rs.accentGlow,
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
                                background: `linear-gradient(160deg,${rs.borderSoft},${rs.accentFaint})`,
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
                              zIndex: 0,
                              background: `linear-gradient(to bottom,transparent 50%,${rs.bg} 100%)`,
                            }}
                          />

                          {/* Бейдж роли */}
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              zIndex: 2,
                              background: rs.badge,
                              color: rs.badgeText,
                              fontSize: "10px",
                              fontWeight: "700",
                              padding: "3px 8px",
                              borderRadius: "3px",
                              letterSpacing: "0.4px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                              maxWidth: "60%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={roleLabel}
                          >
                            {roleLabel}
                          </div>

                          {/* Индикаторы слева — в потоке, без ручных отступов
                              (раньше бейджи налезали друг на друга) */}
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              zIndex: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            {char.custom_color && (
                              <span
                                style={{
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
                            {char.is_duo && (
                              <span
                                style={{
                                  background: "rgba(0,0,0,0.6)",
                                  color: "#f5e6c8",
                                  fontSize: "10px",
                                  fontWeight: "600",
                                  padding: "3px 7px",
                                  borderRadius: "3px",
                                  letterSpacing: "0.3px",
                                  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                                }}
                                title={`Пара: ${char.name || "?"} & ${char.duo_name || "?"}`}
                              >
                                👥
                              </span>
                            )}
                          </div>

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
                            background: `linear-gradient(to right,transparent,${rs.accentGlow},transparent)`,
                          }}
                        />

                        {/* Кнопки */}
                        <div
                          style={{
                            display: "flex",
                            marginTop: "auto",
                            borderTop: `1px solid ${rs.borderFaint}`,
                          }}
                        >
                          <button
                            className="card-load-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoad(char);
                            }}
                            disabled={isLoading}
                            style={{
                              flex: 1,
                              border: "none",
                              background: rs.borderStrong,
                              color: "#f5e6c8",
                              padding: "11px",
                              cursor: isLoading ? "wait" : "pointer",
                              fontSize: "13px",
                              fontWeight: "600",
                              letterSpacing: "0.3px",
                              transition: "background 0.2s",
                              borderRight: `1px solid ${rs.borderFaint}`,
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
