// FILE: app/v2/page.js
// Второй дизайн анкеты — Викторианское фэнтези: геральдические щиты, виньетки,
// круглый портрет в медальоне, орнаменты, восковые печати, девиз
"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { initApp, resetAppInit } from "../../components/LogicV2";
import { goToDesign } from "../../lib/transfer";

function handleOpenV1() {
  goToDesign("/editor", { openInNewTab: false });
}

function EditorLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#1a0e05",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "'Philosopher', serif",
        color: "#d4a96a",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(212,169,106,0.18)",
          borderTopColor: "#d4a96a",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { from{transform:rotate(0deg);} to{transform:rotate(360deg);} }`}</style>
      <div
        style={{
          fontFamily: "'Uncial Antiqua', serif",
          fontSize: "16px",
          letterSpacing: "4px",
          color: "#d4a96a",
          opacity: 0.85,
        }}
      >
        Загрузка анкеты v2...
      </div>
    </div>
  );
}

function EditorPageInner() {
  useEffect(() => {
    document.body.classList.add("v2-app");
    resetAppInit();
    const raf = requestAnimationFrame(() => {
      initApp();
    });
    return () => {
      cancelAnimationFrame(raf);
      resetAppInit();
      document.body.classList.remove("v2-app");
    };
  }, []);

  return (
    <>
      {/* ======== ПАНЕЛЬ УПРАВЛЕНИЯ ======== */}
      <div id="control-panel">
        <div id="controls-left">
          <a
            href="/"
            className="ctrl-btn"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Галерея
          </a>
          <div className="sep" />
          <button className="ctrl-btn" id="zoom-out-btn" title="Уменьшить">−</button>
          <span id="zoom-label">100%</span>
          <button className="ctrl-btn" id="zoom-in-btn" title="Увеличить">+</button>
          <button className="ctrl-btn" id="zoom-fit-btn" title="Вписать">⊡</button>
          <div className="sep" />
          <label className="ctrl-select-wrap">
            <span className="ctrl-select-label">Роль:</span>
            <select id="role-select" className="ctrl-select">
              <option value="">Стандартная</option>
              <option value="role-hero">Главный герой</option>
              <option value="role-antagonist">Антагонист</option>
              <option value="role-deuteragonist">Дейтерагонист</option>
              <option value="role-tritagonist">Тритагонист</option>
              <option value="role-secondary">Второстепенный</option>
              <option value="role-mentor">Наставник</option>
              <option value="role-sidekick">Помощник / Сайдкик</option>
              <option value="role-antihero">Антигерой</option>
              <option value="role-catalyst">Катализатор</option>
              <option value="role-episodic">Эпизодический</option>
              <option value="role-background">Фоновый</option>
              <option value="role-neutral">Нейтральный</option>
            </select>
          </label>
          <div className="sep" />
          <label className="ctrl-select-wrap">
            <span className="ctrl-select-label">Цвет:</span>
            <input
              type="color"
              id="custom-color-input"
              defaultValue="#c49050"
              className="ctrl-color-input"
              title="Кастомный цвет анкеты"
            />
            <button
              className="ctrl-btn"
              id="color-reset-btn"
              title="Сбросить цвет"
              style={{ padding: "0 6px", fontSize: "11px" }}
            >
              ✕
            </button>
          </label>
          <div className="sep" />
          <button className="ctrl-btn" id="bg-btn">🖼 Фон</button>
          <button className="ctrl-btn" id="add-field-btn">＋ Поле</button>
          <button className="ctrl-btn" id="add-divider-btn">— Разделитель</button>
          <button className="ctrl-btn" id="restore-btn" title="Вернуть скрытые поля">↺ Поля</button>
          <button className="ctrl-btn" id="font-settings-btn">Аа Шрифты</button>
          <button className="ctrl-btn" id="dual-mode-btn" title="Двойные анкеты редактируются в старом дизайне">👥 Двойная</button>
          <div className="sep" />
          <button className="ctrl-btn" id="open-v1-btn" onClick={handleOpenV1} title="Открыть эту же анкету в старом дизайне (свиток)">📜 Дизайн v1</button>
          <button className="ctrl-btn" id="print-btn-v2" title="Печать анкеты (через PNG)">🖨 Печать</button>
          <div className="sep" />
          <button className="ctrl-btn" id="new-char-btn">✦ Новый</button>
          <button className="ctrl-btn" id="cloud-save-btn">💾 Сохранить</button>
          <button className="ctrl-btn" id="clear-btn">✕</button>
        </div>
        <button id="export-btn">⬇ Скачать PNG</button>
      </div>

      {/* ======== FILE INPUTS ======== */}
      <input type="file" id="portrait-input" accept="image/*"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", opacity: 0, width: "1px", height: "1px", pointerEvents: "none" }} />
      <input type="file" id="bg-input" accept="image/*"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", opacity: 0, width: "1px", height: "1px", pointerEvents: "none" }} />

      {/* ======== МОДАЛКИ ======== */}
      <div id="field-modal" className="modal-overlay" style={{ display: "none" }}>
        <div className="modal-box">
          <div className="modal-title">Добавить поле</div>
          <div className="modal-row">
            <label>Название:</label>
            <input type="text" id="new-field-label" placeholder="Оружие, Способности..." maxLength={40} />
          </div>
          <div className="modal-row">
            <label>Тип:</label>
            <select id="new-field-type">
              <option value="input">Строка</option>
              <option value="textarea">Многострочный</option>
            </select>
          </div>
          <div className="modal-row">
            <label>Иконка:</label>
            <select id="new-field-icon">
              <option value="scroll">Свиток</option>
              <option value="sword">Меч</option>
              <option value="shield">Щит</option>
              <option value="flame">Пламя</option>
              <option value="eye">Глаз</option>
              <option value="heart">Сердце</option>
              <option value="star">Звезда</option>
              <option value="key">Ключ</option>
              <option value="crystal">Кристалл</option>
              <option value="rune">Руна</option>
              <option value="height">Рост</option>
              <option value="origin">Происхождение</option>
              <option value="age">Возраст</option>
              <option value="weight">Вес</option>
              <option value="gender">Пол</option>
              <option value="skills">Навыки</option>
              <option value="inventory">Предметы</option>
              <option value="location">Родовое имение</option>
              <option value="speech">Язык</option>
              <option value="status">Статус</option>
              <option value="race">Раса / вид</option>
              <option value="appearance">Внешность</option>
              <option value="title">Титул</option>
              <option value="faction">Фракция</option>
              <option value="alignment">Мировоззрение</option>
              <option value="magic">Магия</option>
              <option value="companion">Спутник / питомец</option>
              <option value="faith">Вера / культ</option>
              <option value="bloodline">Родословная</option>
              <option value="profession">Профессия / ремесло</option>
              <option value="relations">Связи</option>
              <option value="voice">Голос</option>
              <option value="death">Смерть</option>
              <option value="cause_death">Причина смерти</option>
              <option value="birthdate">Дата рождения</option>
              <option value="reputation">Репутация</option>
              <option value="wounds">Ранения</option>
              <option value="homeland">Родина</option>
              <option value="persona">Характер</option>
              <option value="enemy">Враги</option>
              <option value="goal">Цель</option>
            </select>
          </div>
          <div className="modal-btns">
            <button id="modal-cancel">Отмена</button>
            <button id="modal-confirm">Добавить</button>
          </div>
        </div>
      </div>

      <div id="restore-modal" className="modal-overlay" style={{ display: "none" }}>
        <div className="modal-box">
          <div className="modal-title">Скрытые поля</div>
          <div id="restore-list" />
          <div className="modal-btns">
            <button id="restore-close">Закрыть</button>
          </div>
        </div>
      </div>

      <div id="font-modal" className="modal-overlay" style={{ display: "none" }}>
        <div className="modal-box font-modal-box">
          <div className="modal-title">Настройки шрифтов</div>
          <div className="font-setting-row">
            <label>Имя персонажа</label>
            <div className="font-setting-control">
              <input type="range" id="name-font-size" min="30" max="120" defaultValue="70" />
              <span id="name-font-val" className="font-val">70px</span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Заголовки полей</label>
            <div className="font-setting-control">
              <input type="range" id="label-font-size" min="14" max="48" defaultValue="22" />
              <span id="label-font-val" className="font-val">22px</span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Текст полей</label>
            <div className="font-setting-control">
              <input type="range" id="input-font-size" min="20" max="72" defaultValue="30" />
              <span id="input-font-val" className="font-val">30px</span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Заголовок эритрогенов</label>
            <div className="font-setting-control">
              <input type="range" id="ery-title-font-size" min="14" max="60" defaultValue="22" />
              <span id="ery-title-font-val" className="font-val">22px</span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Число эритрогенов</label>
            <div className="font-setting-control">
              <input type="range" id="ery-font-size" min="30" max="100" defaultValue="64" />
              <span id="ery-font-val" className="font-val">64px</span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Название ранга</label>
            <div className="font-setting-control">
              <input type="range" id="rank-name-font-size" min="18" max="60" defaultValue="26" />
              <span id="rank-name-font-val" className="font-val">26px</span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Диапазон ранга</label>
            <div className="font-setting-control">
              <input type="range" id="rank-range-font-size" min="14" max="48" defaultValue="22" />
              <span id="rank-range-font-val" className="font-val">22px</span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Бейдж роли</label>
            <div className="font-setting-control">
              <input type="range" id="badge-font-size" min="14" max="48" defaultValue="22" />
              <span id="badge-font-val" className="font-val">22px</span>
            </div>
          </div>
          <div className="modal-btns">
            <button id="font-modal-close">Закрыть</button>
          </div>
        </div>
      </div>

      {/* ======== КАНВАС ======== */}
      <div id="canvas-area">
        <div id="sheet">
          <div id="sheet-bg-layer" />
          <div id="sheet-parchment" />
          <div className="sheet-border" />
          {/* Угловые викторианские орнаменты */}
          <div className="v2-corner v2-corner-tl" aria-hidden="true">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <path d="M0 0 H160 V160" fill="none" stroke="#7a4a1a" strokeWidth="0" />
              <path d="M10 10 L150 10 M10 10 L10 150" stroke="#7a4a1a" strokeWidth="2" fill="none" />
              <path d="M10 30 L30 30 M30 10 L30 30" stroke="#7a4a1a" strokeWidth="1" fill="none" />
              <path d="M30 30 Q42 42 60 30 Q42 18 30 30 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth="1" />
              <circle cx="45" cy="30" r="3" fill="#7a4a1a" />
              <path d="M60 30 Q80 30 80 50 Q80 30 100 30" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M30 60 Q30 80 50 80 Q30 80 30 100" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M70 50 Q90 70 70 90 Q50 70 70 50 Z" fill="none" stroke="#9a6425" strokeWidth="0.8" opacity="0.6" />
              <circle cx="70" cy="70" r="2.5" fill="#7a4a1a" />
              <path d="M85 85 Q105 105 125 85 Q105 65 85 85 Z" fill="none" stroke="#7a4a1a" strokeWidth="1.2" />
              <circle cx="105" cy="85" r="6" fill="#d4a96a" stroke="#7a4a1a" strokeWidth="0.8" />
              <circle cx="105" cy="85" r="3" fill="#7a4a1a" />
            </svg>
          </div>
          <div className="v2-corner v2-corner-tr" aria-hidden="true">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <path d="M150 10 L10 10 M150 10 L150 150" stroke="#7a4a1a" strokeWidth="2" fill="none" />
              <path d="M150 30 L130 30 M130 10 L130 30" stroke="#7a4a1a" strokeWidth="1" fill="none" />
              <path d="M130 30 Q118 42 100 30 Q118 18 130 30 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth="1" />
              <circle cx="115" cy="30" r="3" fill="#7a4a1a" />
              <path d="M100 30 Q80 30 80 50 Q80 30 60 30" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M130 60 Q130 80 110 80 Q130 80 130 100" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M90 50 Q70 70 90 90 Q110 70 90 50 Z" fill="none" stroke="#9a6425" strokeWidth="0.8" opacity="0.6" />
              <circle cx="90" cy="70" r="2.5" fill="#7a4a1a" />
              <path d="M75 85 Q55 105 35 85 Q55 65 75 85 Z" fill="none" stroke="#7a4a1a" strokeWidth="1.2" />
              <circle cx="55" cy="85" r="6" fill="#d4a96a" stroke="#7a4a1a" strokeWidth="0.8" />
              <circle cx="55" cy="85" r="3" fill="#7a4a1a" />
            </svg>
          </div>
          <div className="v2-corner v2-corner-bl" aria-hidden="true">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <path d="M10 150 L150 150 M10 150 L10 10" stroke="#7a4a1a" strokeWidth="2" fill="none" />
              <path d="M10 130 L30 130 M30 150 L30 130" stroke="#7a4a1a" strokeWidth="1" fill="none" />
              <path d="M30 130 Q42 118 60 130 Q42 142 30 130 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth="1" />
              <circle cx="45" cy="130" r="3" fill="#7a4a1a" />
              <path d="M60 130 Q80 130 80 110 Q80 130 100 130" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M30 100 Q30 80 50 80 Q30 80 30 60" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M70 110 Q90 90 70 70 Q50 90 70 110 Z" fill="none" stroke="#9a6425" strokeWidth="0.8" opacity="0.6" />
              <circle cx="70" cy="90" r="2.5" fill="#7a4a1a" />
              <path d="M85 75 Q105 55 125 75 Q105 95 85 75 Z" fill="none" stroke="#7a4a1a" strokeWidth="1.2" />
              <circle cx="105" cy="75" r="6" fill="#d4a96a" stroke="#7a4a1a" strokeWidth="0.8" />
              <circle cx="105" cy="75" r="3" fill="#7a4a1a" />
            </svg>
          </div>
          <div className="v2-corner v2-corner-br" aria-hidden="true">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <path d="M150 150 L10 150 M150 150 L150 10" stroke="#7a4a1a" strokeWidth="2" fill="none" />
              <path d="M150 130 L130 130 M130 150 L130 130" stroke="#7a4a1a" strokeWidth="1" fill="none" />
              <path d="M130 130 Q118 118 100 130 Q118 142 130 130 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth="1" />
              <circle cx="115" cy="130" r="3" fill="#7a4a1a" />
              <path d="M100 130 Q80 130 80 110 Q80 130 60 130" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M130 100 Q130 80 110 80 Q130 80 130 60" fill="none" stroke="#9a6425" strokeWidth="1" />
              <path d="M90 110 Q70 90 90 70 Q110 90 90 110 Z" fill="none" stroke="#9a6425" strokeWidth="0.8" opacity="0.6" />
              <circle cx="90" cy="90" r="2.5" fill="#7a4a1a" />
              <path d="M75 75 Q55 55 35 75 Q55 95 75 75 Z" fill="none" stroke="#7a4a1a" strokeWidth="1.2" />
              <circle cx="55" cy="75" r="6" fill="#d4a96a" stroke="#7a4a1a" strokeWidth="0.8" />
              <circle cx="55" cy="75" r="3" fill="#7a4a1a" />
            </svg>
          </div>

          {/* ── Шапка-щит с гербом ── */}
          <div className="v2-header">
            <div className="v2-shield-wrap">
              <svg viewBox="0 0 280 200" width="100%" xmlns="http://www.w3.org/2000/svg" style={{ height: "auto", display: "block" }}>
                <defs>
                  <linearGradient id="sh-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a96a" />
                    <stop offset="50%" stopColor="#b8860b" />
                    <stop offset="100%" stopColor="#7a4a1a" />
                  </linearGradient>
                  <linearGradient id="sh-grad-inner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e8c98a" />
                    <stop offset="100%" stopColor="#c49050" />
                  </linearGradient>
                </defs>
                {/* Внешний щит */}
                <path
                  d="M20 20 Q20 5 40 5 L240 5 Q260 5 260 20 L260 100 Q260 140 140 195 Q20 140 20 100 Z"
                  fill="url(#sh-grad)"
                  stroke="#3b1f0a"
                  strokeWidth="2.5"
                />
                {/* Внутренний щит */}
                <path
                  d="M34 32 Q34 22 46 22 L234 22 Q246 22 246 32 L246 100 Q246 130 140 175 Q34 130 34 100 Z"
                  fill="url(#sh-grad-inner)"
                  stroke="#7a4a1a"
                  strokeWidth="1.5"
                />
                {/* Орнамент по краю */}
                <path
                  d="M140 14 Q155 26 165 40 M140 14 Q125 26 115 40"
                  fill="none"
                  stroke="#3b1f0a"
                  strokeWidth="1.2"
                  opacity="0.6"
                />
                <circle cx="140" cy="100" r="22" fill="#7a4a1a" stroke="#3b1f0a" strokeWidth="1.5" />
                <circle cx="140" cy="100" r="14" fill="#d4a96a" />
                <path d="M140 88 L148 108 L132 108 Z" fill="#7a4a1a" />
                <circle cx="140" cy="100" r="3" fill="#3b1f0a" />
              </svg>
              <input
                type="text"
                id="header-name-input"
                className="header-name-input"
                placeholder="ИМЯ ПЕРСОНАЖА"
                autoComplete="off"
              />
            </div>

            {/* Восковая печать с ролью (видна и в PNG/печати!) */}
            <div className="v2-seal-wrap" id="v2-seal-wrap" title="Двойной клик по тексту — редактировать роль">
              <svg viewBox="0 0 120 120" width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="wax-grad" cx="40%" cy="40%" r="65%">
                    <stop offset="0%" stopColor="#c8443a" />
                    <stop offset="60%" stopColor="#8b1a1a" />
                    <stop offset="100%" stopColor="#4a0808" />
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="52" fill="url(#wax-grad)" stroke="#3b0808" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="46" fill="none" stroke="#c8443a" strokeWidth="1" opacity="0.5" />
                <circle cx="60" cy="60" r="38" fill="none" stroke="#ffd0a0" strokeWidth="0.8" opacity="0.4" strokeDasharray="2,3" />
                <path d="M40 70 L55 50 L70 70 L65 80 L60 70 L55 80 Z" fill="#ffd0a0" opacity="0.6" />
                <text x="60" y="98" fontFamily="'Uncial Antiqua',serif" fontSize="11" fill="#ffd0a0" textAnchor="middle" opacity="0.7">SIGILLUM</text>
              </svg>
              <div className="v2-seal-label" id="v2-seal-label">РОЛЬ</div>
              <div className="v2-role-badge-sheet" id="role-badge-sheet">
                <span className="role-badge-text" id="role-badge-text">Стандартная</span>
                <input
                  type="text"
                  className="role-badge-edit-input"
                  id="role-badge-edit-input"
                  maxLength={30}
                  autoComplete="off"
                  placeholder="Роль"
                />
              </div>
            </div>

            {/* Знак статуса (жив / мёртв / пропал) — виден и в PNG/печати */}
            <div className="v2-status-badge st-alive" id="v2-status-badge" title="Статус">
              <span className="v2-status-icon" id="v2-status-icon">✦</span>
              <span className="v2-status-label" id="v2-status-label">Жив</span>
            </div>
          </div>

          {/* ── Девиз под шапкой ── */}
          <div className="v2-motto-block" data-field-id="motto">
            <div
              className="field-delete-btn ui-only"
              data-target="motto"
              title="Удалить блок"
            >
              ✕
            </div>
            <div className="v2-motto-wrap">
              <span className="v2-motto-quote v2-motto-quote-left">❝</span>
              <textarea
                id="v2-motto-input"
                className="v2-motto-input"
                placeholder="Девиз или изречение этого создания…"
                rows={2}
                maxLength={400}
                autoComplete="off"
              />
              <span className="v2-motto-quote v2-motto-quote-right">❞</span>
            </div>
          </div>

          {/* ── Основная сетка ── */}
          <div className="main-grid" id="main-grid">
            {/* Портрет-медальон (овальный) */}
            <div className="portrait-column" id="portrait-column">
              <div className="portrait-resize-x ui-only" id="portrait-resize-x" />
              <div className="portrait-medallion portrait-area" id="portrait-area">
                <div className="portrait-placeholder" id="portrait-placeholder">
                  <svg width="80" height="110" viewBox="0 0 110 150" xmlns="http://www.w3.org/2000/svg" opacity=".28">
                    <circle cx="55" cy="42" r="26" fill="#7a4a1a" />
                    <path d="M8 148Q8 88 55 88Q102 88 102 148Z" fill="#7a4a1a" />
                  </svg>
                  <span>Нажмите для загрузки арта</span>
                </div>
                <div className="portrait-img-wrapper" id="portrait-wrapper">
                  <img id="portrait-img" src="" alt="" draggable={false} />
                </div>
                <div className="portrait-hint ui-only" id="portrait-hint">
                  🖱 Перетащить · Колесо = масштаб
                </div>
              </div>
              <div className="portrait-resize-y ui-only" id="portrait-resize-y" />
            </div>

            {/* Инфо-колонка */}
            <div className="info-column" id="info-column">
              <div className="fields-list" id="fields-list">
                {/* Возраст */}
                <div className="field-row" data-field-id="age">
                  <div className="field-delete-btn ui-only" data-target="age" title="Удалить">✕</div>
                  <div className="field-icon-wrap" data-icon="hourglass" />
                  <div className="field-content">
                    <span className="field-label">Возраст</span>
                    <input type="text" className="field-input" id="field-age" placeholder="—" autoComplete="off" />
                  </div>
                </div>
                {/* Дата рождения */}
                <div className="field-row" data-field-id="birth">
                  <div className="field-delete-btn ui-only" data-target="birth" title="Удалить">✕</div>
                  <div className="field-icon-wrap" data-icon="moon" />
                  <div className="field-content">
                    <span className="field-label">Дата рождения</span>
                    <input type="text" className="field-input" id="field-birth" placeholder="—" autoComplete="off" />
                  </div>
                </div>
                {/* Национальность */}
                <div className="field-row" data-field-id="nation">
                  <div className="field-delete-btn ui-only" data-target="nation" title="Удалить">✕</div>
                  <div className="field-icon-wrap" data-icon="globe" />
                  <div className="field-content">
                    <span className="field-label">Национальность</span>
                    <input type="text" className="field-input" id="field-nation" placeholder="—" autoComplete="off" />
                  </div>
                </div>
                {/* Род / Клан */}
                <div className="field-row" data-field-id="clan">
                  <div className="field-delete-btn ui-only" data-target="clan" title="Удалить">✕</div>
                  <div className="field-icon-wrap" data-icon="tree" />
                  <div className="field-content">
                    <span className="field-label">Род / Клан</span>
                    <input type="text" className="field-input" id="field-clan" placeholder="—" autoComplete="off" />
                  </div>
                </div>
                {/* Кем является */}
                <div className="field-row" data-field-id="nature">
                  <div className="field-delete-btn ui-only" data-target="nature" title="Удалить">✕</div>
                  <div className="field-icon-wrap" data-icon="mask" />
                  <div className="field-content">
                    <span className="field-label">Кем является</span>
                    <input type="text" className="field-input" id="field-nature" placeholder="—" autoComplete="off" />
                  </div>
                </div>
                {/* Чем занимается */}
                <div className="field-row" data-field-id="occupation">
                  <div className="field-delete-btn ui-only" data-target="occupation" title="Удалить">✕</div>
                  <div className="field-icon-wrap" data-icon="quill" />
                  <div className="field-content">
                    <span className="field-label">Чем занимается</span>
                    <input type="text" className="field-input" id="field-occupation" placeholder="—" autoComplete="off" />
                  </div>
                </div>

                {/* Разделитель эритрогенов */}
                <div className="section-divider" id="divider-ery" data-field-id="divider-ery">
                  <svg width="100%" height="34" viewBox="0 0 800 34" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="0" y1="17" x2="340" y2="17" stroke="#7a4a1a" strokeWidth="1.2" />
                    <line x1="460" y1="17" x2="800" y2="17" stroke="#7a4a1a" strokeWidth="1.2" />
                    <path d="M340,17 L360,7 L395,17 L360,27 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth=".8" />
                    <path d="M460,17 L440,7 L405,17 L440,27 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth=".8" />
                    <circle cx="400" cy="17" r="5" fill="#7a4a1a" />
                  </svg>
                </div>

                {/* Эритрогены */}
                <div className="erythrogen-block" data-field-id="erythrogen">
                  <div className="field-delete-btn ui-only" data-target="erythrogen" title="Удалить блок">✕</div>
                  <div className="erythrogen-header">
                    <div className="field-icon-wrap" data-icon="erythrogen" />
                    <span className="erythrogen-title">Уровень Эритрогенов</span>
                  </div>
                  <div className="erythrogen-row">
                    <div className="rank-badge" id="rank-badge">
                      <span className="rank-letter" id="rank-letter">—</span>
                    </div>
                    <input type="text" id="erythrogen-value" className="ery-number-input" placeholder="0" autoComplete="off" />
                    <span className="rank-info-inline" id="rank-info-inline">
                      <span className="rank-dot"> · </span>
                      <span className="rank-name" id="rank-name">Введите значение</span>
                      <span className="rank-dot"> · </span>
                      <span className="rank-range" id="rank-range" />
                    </span>
                    <button className="ery-hint-toggle ui-only" id="ery-hint-toggle" title="Скрыть/показать">👁</button>
                  </div>
                </div>

                {/* ── НОВОЕ: Репутация ── */}
                <div className="v2-reputation-block" data-field-id="reputation">
                  <div className="field-delete-btn ui-only" data-target="reputation" title="Удалить">✕</div>
                  <div className="v2-reputation-header">
                    <span className="v2-reputation-title">Репутация</span>
                    <span className="v2-reputation-label" id="v2-reputation-label">Нейтральный</span>
                  </div>
                  <div className="v2-reputation-bar" id="v2-reputation-bar">
                    <div className="v2-reputation-fill" />
                    <div className="v2-reputation-markers">
                      <span>Позор</span>
                      <span>Сомнит.</span>
                      <span>Нейтр.</span>
                      <span>Благород.</span>
                      <span>Славный</span>
                    </div>
                  </div>
                  <div className="v2-reputation-selector ui-only" id="v2-reputation-selector">
                    <button type="button" data-rep="notorious" title="Позорный">⛔</button>
                    <button type="button" data-rep="shady" title="Сомнительный">⚠</button>
                    <button type="button" data-rep="neutral" title="Нейтральный">—</button>
                    <button type="button" data-rep="noble" title="Благородный">✦</button>
                    <button type="button" data-rep="glorious" title="Славный">★</button>
                  </div>
                </div>

                {/* ── НОВОЕ: Статус персонажа ── */}
                <div className="v2-status-block" data-field-id="status">
                  <div className="field-delete-btn ui-only" data-target="status" title="Удалить">✕</div>
                  <div className="v2-status-header">
                    <span className="v2-status-title">Состояние</span>
                  </div>
                  {/* Видимая строка (попадает в PNG и печать) */}
                  <div className="v2-status-display" id="v2-status-display">
                    <span className="v2-status-display-icon" id="v2-status-display-icon">✦</span>
                    <span className="v2-status-display-label" id="v2-status-display-label">Жив</span>
                  </div>
                  <div className="v2-status-selector ui-only" id="v2-status-selector">
                    <button type="button" data-status="alive">✦ Жив</button>
                    <button type="button" data-status="missing">◌ Пропал</button>
                    <button type="button" data-status="deceased">✝ Мёртв</button>
                    <button type="button" data-status="unknown">? Неизв.</button>
                  </div>
                  <div className="v2-status-hint ui-only">Кликните на кнопку для изменения</div>
                </div>

                {/* ── НОВОЕ: Герб / символ рода ── */}
                <div className="v2-sigil-block" data-field-id="sigil">
                  <div className="field-delete-btn ui-only" data-target="sigil" title="Удалить">✕</div>
                  <div className="v2-sigil-header">
                    <span className="v2-sigil-title">Символ рода</span>
                  </div>
                  <div className="v2-sigil-content">
                    <div className="v2-sigil-preview" id="v2-sigil-preview">
                      <span className="v2-sigil-preview-label" id="v2-sigil-preview-label">✦</span>
                    </div>
                    <div className="v2-sigil-controls ui-only">
                      <div className="v2-sigil-row">
                        <label>Цвет:</label>
                        <input type="color" id="v2-sigil-color" defaultValue="#8b1a1a" />
                      </div>
                      <div className="v2-sigil-row">
                        <label>Буквы/символ:</label>
                        <input type="text" id="v2-sigil-text" placeholder="A, Л, ♕…" maxLength={6} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* История */}
                <div className="history-block" data-field-id="history">
                  <div className="field-delete-btn ui-only" data-target="history" title="Удалить">✕</div>
                  <div className="history-header">
                    <svg width="100%" height="48" viewBox="0 0 800 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="0" y1="24" x2="220" y2="24" stroke="#7a4a1a" strokeWidth="1.5" />
                      <path d="M220,24 L240,11 L275,24 L240,37 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth="1" />
                      <text x="400" y="33" fontFamily="'Uncial Antiqua',serif" fontSize="32" fill="#3b1f0a" textAnchor="middle" letterSpacing="6">Хроника</text>
                      <path d="M580,24 L560,11 L525,24 L560,37 Z" fill="#9a6425" stroke="#7a4a1a" strokeWidth="1" />
                      <line x1="580" y1="24" x2="800" y2="24" stroke="#7a4a1a" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <textarea className="history-textarea" id="field-history" placeholder="Здесь хранится история этого существа..." />
                </div>

                {/* ── НОВОЕ: Узы ── */}
                <div className="v2-bonds-block" data-field-id="bonds">
                  <div className="field-delete-btn ui-only" data-target="bonds" title="Удалить">✕</div>
                  <div className="v2-bonds-header">
                    <svg viewBox="0 0 36 36" width="36" height="36" className="ficon" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="12" r="4" />
                      <circle cx="26" cy="12" r="4" />
                      <circle cx="18" cy="26" r="4" />
                      <line x1="10" y1="16" x2="18" y2="22" />
                      <line x1="26" y1="16" x2="18" y2="22" />
                      <line x1="14" y1="12" x2="22" y2="12" />
                    </svg>
                    <span>Узы и клятвы</span>
                  </div>
                  <textarea
                    id="v2-bonds-input"
                    className="v2-bonds-textarea"
                    placeholder="Те, кто дорог этому созданию; данное слово; неоплатный долг…"
                    rows={4}
                    maxLength={1500}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Нижний орнамент ── */}
          <div className="bottom-ornament">
            <svg width="1880" height="100" viewBox="0 0 1880 100" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="8" x2="1880" y2="8" stroke="#7a4a1a" strokeWidth="1.5" />
              <g transform="translate(940,55)">
                <circle r="38" fill="none" stroke="#7a4a1a" strokeWidth="1.5" />
                <circle r="30" fill="none" stroke="#9a6425" strokeWidth=".8" opacity=".5" />
                <circle r="14" fill="#d4a96a" stroke="#7a4a1a" strokeWidth="1.2" />
                <circle r="7" fill="#c49050" stroke="#9a6425" strokeWidth=".8" />
                <circle r="3" fill="#7a4a1a" />
              </g>
              <path d="M0 92 L60 92 M1820 92 L1880 92" stroke="#7a4a1a" strokeWidth="1.2" />
              <path d="M30 92 Q60 86 90 92" fill="none" stroke="#7a4a1a" strokeWidth="0.8" />
              <path d="M1790 92 Q1820 86 1850 92" fill="none" stroke="#7a4a1a" strokeWidth="0.8" />
            </svg>
          </div>

          {/* Хэндлы */}
          <div id="sheet-resize-handle" className="ui-only">
            <svg width="56" height="14" viewBox="0 0 56 14" xmlns="http://www.w3.org/2000/svg">
              <line x1="4" y1="4" x2="52" y2="4" stroke="#9a6425" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="4" y1="10" x2="52" y2="10" stroke="#9a6425" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div id="sheet-resize-x" className="ui-only">
            <svg width="14" height="56" viewBox="0 0 14 56" xmlns="http://www.w3.org/2000/svg">
              <line x1="4" y1="4" x2="4" y2="52" stroke="#9a6425" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="10" y1="4" x2="10" y2="52" stroke="#9a6425" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Тост */}
      <div id="toast" />
    </>
  );
}

const EditorPage = dynamic(() => Promise.resolve(EditorPageInner), {
  ssr: false,
  loading: () => <EditorLoading />,
});

export default EditorPage;
