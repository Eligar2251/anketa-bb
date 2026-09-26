// FILE: app/editor/page.js
"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { initApp, resetAppInit } from "../../components/Logic";

function EditorLoading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#120a03",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "'Philosopher', serif",
        color: "#f5e6c8",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(245,230,200,0.15)",
          borderTopColor: "#c49050",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          fontFamily: "'Uncial Antiqua', serif",
          fontSize: "16px",
          letterSpacing: "3px",
          color: "#c49050",
          opacity: 0.8,
        }}
      >
        Загрузка...
      </div>
    </div>
  );
}

function EditorPageInner() {
  useEffect(() => {
    resetAppInit();
    const raf = requestAnimationFrame(() => {
      initApp();
    });
    return () => {
      cancelAnimationFrame(raf);
      resetAppInit();
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
          <button className="ctrl-btn" id="zoom-out-btn" title="Уменьшить">
            −
          </button>
          <span id="zoom-label">100%</span>
          <button className="ctrl-btn" id="zoom-in-btn" title="Увеличить">
            +
          </button>
          <button className="ctrl-btn" id="zoom-fit-btn" title="Вписать">
            ⊡
          </button>
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
              <option value="role-sidekick">Помощник/Сайдкик</option>
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
          <button className="ctrl-btn" id="bg-btn">
            🖼 Фон
          </button>
          <button className="ctrl-btn" id="add-field-btn">
            ＋ Поле
          </button>
          <button className="ctrl-btn" id="add-divider-btn">
            — Разделитель
          </button>
          <button
            className="ctrl-btn"
            id="restore-btn"
            title="Вернуть скрытые поля"
          >
            ↺ Поля
          </button>
          <button className="ctrl-btn" id="font-settings-btn">
            Аа Шрифты
          </button>
          <button
            className="ctrl-btn"
            id="dual-mode-btn"
            title="Анкета для двух персонажей"
          >
            👥 Двойная
          </button>
          <div className="sep" />
          <button className="ctrl-btn" id="new-char-btn">
            ✦ Новый
          </button>
          <button className="ctrl-btn" id="cloud-save-btn">
            💾 Сохранить
          </button>
          <button className="ctrl-btn" id="clear-btn">
            ✕
          </button>
        </div>
        <button id="export-btn">⬇ Скачать PNG</button>
      </div>

      {/* ======== СКРЫТЫЕ FILE INPUT'Ы ======== */}
      <input
        type="file"
        id="portrait-input"
        accept="image/*"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          opacity: 0,
          width: "1px",
          height: "1px",
          pointerEvents: "none",
        }}
      />
      <input
        type="file"
        id="bg-input"
        accept="image/*"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          opacity: 0,
          width: "1px",
          height: "1px",
          pointerEvents: "none",
        }}
      />

      {/* ======== МОДАЛКА: ДОБАВИТЬ ПОЛЕ ======== */}
      <div
        id="field-modal"
        className="modal-overlay"
        style={{ display: "none" }}
      >
        <div className="modal-box">
          <div className="modal-title">Добавить поле</div>
          <div className="modal-row">
            <label>Название:</label>
            <input
              type="text"
              id="new-field-label"
              placeholder="Оружие, Способности..."
              maxLength={40}
            />
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
              <option value="status">Состояние</option>
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

      {/* ======== МОДАЛКА: СКРЫТЫЕ ПОЛЯ ======== */}
      <div
        id="restore-modal"
        className="modal-overlay"
        style={{ display: "none" }}
      >
        <div className="modal-box">
          <div className="modal-title">Скрытые поля</div>
          <div id="restore-list" />
          <div className="modal-btns">
            <button id="restore-close">Закрыть</button>
          </div>
        </div>
      </div>

      {/* ======== МОДАЛКА: ШРИФТЫ ======== */}
      <div
        id="font-modal"
        className="modal-overlay"
        style={{ display: "none" }}
      >
        <div className="modal-box font-modal-box">
          <div className="modal-title">Настройки шрифтов</div>
          <div className="font-setting-row">
            <label>Имя персонажа</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="name-font-size"
                min="30"
                max="120"
                defaultValue="80"
              />
              <span id="name-font-val" className="font-val">
                80px
              </span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Заголовки полей</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="label-font-size"
                min="14"
                max="48"
                defaultValue="26"
              />
              <span id="label-font-val" className="font-val">
                26px
              </span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Текст полей</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="input-font-size"
                min="20"
                max="72"
                defaultValue="42"
              />
              <span id="input-font-val" className="font-val">
                42px
              </span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Заголовок эритрогенов</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="ery-title-font-size"
                min="14"
                max="60"
                defaultValue="28"
              />
              <span id="ery-title-font-val" className="font-val">
                28px
              </span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Число эритрогенов</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="ery-font-size"
                min="30"
                max="100"
                defaultValue="64"
              />
              <span id="ery-font-val" className="font-val">
                64px
              </span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Название ранга</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="rank-name-font-size"
                min="18"
                max="60"
                defaultValue="32"
              />
              <span id="rank-name-font-val" className="font-val">
                32px
              </span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Диапазон ранга</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="rank-range-font-size"
                min="14"
                max="48"
                defaultValue="26"
              />
              <span id="rank-range-font-val" className="font-val">
                26px
              </span>
            </div>
          </div>
          <div className="font-setting-row">
            <label>Бейдж роли</label>
            <div className="font-setting-control">
              <input
                type="range"
                id="badge-font-size"
                min="14"
                max="48"
                defaultValue="24"
              />
              <span id="badge-font-val" className="font-val">
                24px
              </span>
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

          {/* ── Шапка со свитками ── */}
          <div className="header-scroll" id="header-scroll">
            <div className="scroll-wrap" id="scroll-wrap">
              {/* Левый / единственный свиток */}
              <div className="scroll-item" id="scroll-left">
                {/* SVG одиночного режима */}
                <svg
                  className="scroll-svg scroll-svg-full"
                  id="scroll-svg-single"
                  width="1880"
                  height="200"
                  viewBox="0 0 1880 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="sc-sh">
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="5"
                        floodColor="#2a1206"
                        floodOpacity=".35"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M100 25Q100 10 122 10L1758 10Q1780 10 1780 25L1780 175Q1780 190 1758 190L122 190Q100 190 100 175Z"
                    fill="#d4a96a"
                    stroke="#7a4a1a"
                    strokeWidth="2"
                    filter="url(#sc-sh)"
                  />
                  <path
                    d="M114 38Q114 22 128 22L1752 22Q1766 22 1766 38L1766 162Q1766 178 1752 178L128 178Q114 178 114 162Z"
                    fill="#e8c98a"
                    stroke="#9a6425"
                    strokeWidth="1"
                  />
                  <path
                    d="M100 25Q52 25 27 100Q52 175 100 175Q70 158 70 100Q70 42 100 25Z"
                    fill="#c49050"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M100 25Q80 42 80 100Q80 158 100 175Q86 162 86 100Q86 38 100 25Z"
                    fill="#d4a050"
                    opacity=".5"
                  />
                  <path
                    d="M1780 25Q1828 25 1853 100Q1828 175 1780 175Q1810 158 1810 100Q1810 42 1780 25Z"
                    fill="#c49050"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M1780 25Q1800 42 1800 100Q1800 158 1780 175Q1794 162 1794 100Q1794 38 1780 25Z"
                    fill="#d4a050"
                    opacity=".5"
                  />
                  <line
                    x1="135"
                    y1="46"
                    x2="1745"
                    y2="46"
                    stroke="#9a6425"
                    strokeWidth=".8"
                    opacity=".5"
                  />
                  <line
                    x1="135"
                    y1="154"
                    x2="1745"
                    y2="154"
                    stroke="#9a6425"
                    strokeWidth=".8"
                    opacity=".5"
                  />
                </svg>

                {/* SVG левого свитка в dual mode */}
                <svg
                  className="scroll-svg scroll-svg-half"
                  id="scroll-svg-dual-left"
                  width="880"
                  height="200"
                  viewBox="0 0 880 200"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ display: "none" }}
                >
                  <defs>
                    <filter id="sc-sh-l">
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="5"
                        floodColor="#2a1206"
                        floodOpacity=".35"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M80 25Q80 10 100 10L800 10Q820 10 820 25L820 175Q820 190 800 190L100 190Q80 190 80 175Z"
                    fill="#d4a96a"
                    stroke="#7a4a1a"
                    strokeWidth="2"
                    filter="url(#sc-sh-l)"
                  />
                  <path
                    d="M92 38Q92 22 106 22L806 22Q820 22 820 38L820 162Q820 178 806 178L106 178Q92 178 92 162Z"
                    fill="#e8c98a"
                    stroke="#9a6425"
                    strokeWidth="1"
                  />
                  <path
                    d="M80 25Q32 25 7 100Q32 175 80 175Q50 158 50 100Q50 42 80 25Z"
                    fill="#c49050"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M80 25Q60 42 60 100Q60 158 80 175Q66 162 66 100Q66 38 80 25Z"
                    fill="#d4a050"
                    opacity=".5"
                  />
                  <path
                    d="M820 25Q860 25 875 100Q860 175 820 175Q845 158 845 100Q845 42 820 25Z"
                    fill="#c49050"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M820 25Q838 42 838 100Q838 158 820 175Q832 162 832 100Q832 38 820 25Z"
                    fill="#d4a050"
                    opacity=".5"
                  />
                  <line
                    x1="108"
                    y1="46"
                    x2="808"
                    y2="46"
                    stroke="#9a6425"
                    strokeWidth=".8"
                    opacity=".5"
                  />
                  <line
                    x1="108"
                    y1="154"
                    x2="808"
                    y2="154"
                    stroke="#9a6425"
                    strokeWidth=".8"
                    opacity=".5"
                  />
                </svg>

                <input
                  type="text"
                  id="header-name-input"
                  className="header-name-input"
                  placeholder="ДОСЬЕ ПЕРСОНАЖА"
                  autoComplete="off"
                />
              </div>

              {/* Центральный орнамент (dual mode) */}
              <div
                id="scroll-center-ornament"
                style={{ display: "none", flexShrink: 0, alignItems: "center" }}
              >
                <svg
                  width="80"
                  height="200"
                  viewBox="0 0 80 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line
                    x1="40"
                    y1="10"
                    x2="40"
                    y2="80"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                    opacity=".4"
                  />
                  <line
                    x1="40"
                    y1="120"
                    x2="40"
                    y2="190"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                    opacity=".4"
                  />
                  <circle
                    cx="40"
                    cy="100"
                    r="22"
                    fill="#d4a96a"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="40"
                    cy="100"
                    r="13"
                    fill="#c49050"
                    stroke="#9a6425"
                    strokeWidth=".8"
                  />
                  <circle cx="40" cy="100" r="5" fill="#7a4a1a" />
                  <path
                    d="M40 62 L46 78 L40 86 L34 78Z"
                    fill="#9a6425"
                    opacity=".7"
                  />
                  <path
                    d="M40 138 L46 122 L40 114 L34 122Z"
                    fill="#9a6425"
                    opacity=".7"
                  />
                </svg>
              </div>

              {/* Правый свиток (dual mode) */}
              <div
                className="scroll-item"
                id="scroll-right"
                style={{ display: "none" }}
              >
                <svg
                  className="scroll-svg scroll-svg-half"
                  width="880"
                  height="200"
                  viewBox="0 0 880 200"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="sc-sh-r">
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="5"
                        floodColor="#2a1206"
                        floodOpacity=".35"
                      />
                    </filter>
                  </defs>
                  <path
                    d="M60 25Q60 10 80 10L780 10Q800 10 800 25L800 175Q800 190 780 190L80 190Q60 190 60 175Z"
                    fill="#d4a96a"
                    stroke="#7a4a1a"
                    strokeWidth="2"
                    filter="url(#sc-sh-r)"
                  />
                  <path
                    d="M72 38Q72 22 86 22L786 22Q800 22 800 38L800 162Q800 178 786 178L86 178Q72 178 72 162Z"
                    fill="#e8c98a"
                    stroke="#9a6425"
                    strokeWidth="1"
                  />
                  <path
                    d="M60 25Q12 25 -3 100Q12 175 60 175Q30 158 30 100Q30 42 60 25Z"
                    fill="#c49050"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M60 25Q40 42 40 100Q40 158 60 175Q46 162 46 100Q46 38 60 25Z"
                    fill="#d4a050"
                    opacity=".5"
                  />
                  <path
                    d="M800 25Q840 25 855 100Q840 175 800 175Q825 158 825 100Q825 42 800 25Z"
                    fill="#c49050"
                    stroke="#7a4a1a"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M800 25Q818 42 818 100Q818 158 800 175Q812 162 812 100Q812 38 800 25Z"
                    fill="#d4a050"
                    opacity=".5"
                  />
                  <line
                    x1="88"
                    y1="46"
                    x2="788"
                    y2="46"
                    stroke="#9a6425"
                    strokeWidth=".8"
                    opacity=".5"
                  />
                  <line
                    x1="88"
                    y1="154"
                    x2="788"
                    y2="154"
                    stroke="#9a6425"
                    strokeWidth=".8"
                    opacity=".5"
                  />
                </svg>

                <input
                  type="text"
                  id="header-name-input-right"
                  className="header-name-input"
                  placeholder="ДОСЬЕ ПЕРСОНАЖА"
                  autoComplete="off"
                />     
              </div>
            </div>
          </div>

          {/* ── Бейджик роли ── */}
          <div className="role-badge-sheet" id="role-badge-sheet">
            <div className="role-badge-inner" id="role-badge-inner">
              <svg
                className="role-badge-icon"
                viewBox="0 0 24 24"
                width="28"
                height="28"
              >
                <path
                  d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18.5L6 21.5L7 14.5L2 9.5L9 8.5Z"
                  fill="currentColor"
                  opacity=".7"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
              </svg>
              <span className="role-badge-text" id="role-badge-text">
                Стандартная
              </span>
              <input
                type="text"
                className="role-badge-edit-input"
                id="role-badge-edit-input"
                maxLength={30}
                autoComplete="off"
                placeholder="Роль персонажа"
              />
            </div>
          </div>

          {/* ── Основная сетка ── */}
          <div className="main-grid" id="main-grid">
            {/* Портрет */}
            <div className="portrait-column" id="portrait-column">
              <div
                className="portrait-resize-x ui-only"
                id="portrait-resize-x"
              />

              <div className="portrait-area" id="portrait-area">
                {/* Плейсхолдер */}
                <div className="portrait-placeholder" id="portrait-placeholder">
                  <svg
                    width="90"
                    height="125"
                    viewBox="0 0 110 150"
                    xmlns="http://www.w3.org/2000/svg"
                    opacity=".28"
                  >
                    <circle cx="55" cy="42" r="26" fill="#7a4a1a" />
                    <path
                      d="M8 148Q8 88 55 88Q102 88 102 148Z"
                      fill="#7a4a1a"
                    />
                  </svg>
                  <span>Нажмите для загрузки арта</span>
                </div>

                {/* Обёртка изображения */}
                <div className="portrait-img-wrapper" id="portrait-wrapper">
                  <img id="portrait-img" src="" alt="" draggable={false} />
                </div>

                {/* Подсказка */}
                <div className="portrait-hint ui-only" id="portrait-hint">
                  🖱 Перетащить · Колесо = масштаб
                </div>

                {/* Угловые элементы рамки */}
                <svg
                  className="frame-corner frame-tl"
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 4L76 4"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d="M4 4L4 76"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path d="M4 4L24 4L24 8L8 8L8 24L4 24Z" fill="#c49050" />
                  <circle
                    cx="14"
                    cy="14"
                    r="5"
                    fill="none"
                    stroke="#9a6425"
                    strokeWidth="1.2"
                  />
                  <circle cx="14" cy="14" r="2" fill="#9a6425" />
                </svg>
                <svg
                  className="frame-corner frame-tr"
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M76 4L4 4"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d="M76 4L76 76"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path d="M76 4L56 4L56 8L72 8L72 24L76 24Z" fill="#c49050" />
                  <circle
                    cx="66"
                    cy="14"
                    r="5"
                    fill="none"
                    stroke="#9a6425"
                    strokeWidth="1.2"
                  />
                  <circle cx="66" cy="14" r="2" fill="#9a6425" />
                </svg>
                <svg
                  className="frame-corner frame-bl"
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 76L76 76"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d="M4 76L4 4"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path d="M4 76L24 76L24 72L8 72L8 56L4 56Z" fill="#c49050" />
                  <circle
                    cx="14"
                    cy="66"
                    r="5"
                    fill="none"
                    stroke="#9a6425"
                    strokeWidth="1.2"
                  />
                  <circle cx="14" cy="66" r="2" fill="#9a6425" />
                </svg>
                <svg
                  className="frame-corner frame-br"
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M76 76L4 76"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d="M76 76L76 4"
                    stroke="#7a4a1a"
                    strokeWidth="3"
                    fill="none"
                  />
                  <path
                    d="M76 76L56 76L56 72L72 72L72 56L76 56Z"
                    fill="#c49050"
                  />
                  <circle
                    cx="66"
                    cy="66"
                    r="5"
                    fill="none"
                    stroke="#9a6425"
                    strokeWidth="1.2"
                  />
                  <circle cx="66" cy="66" r="2" fill="#9a6425" />
                </svg>

                {/* Линии рамки */}
                <div className="frame-line frame-top" />
                <div className="frame-line frame-bottom" />
                <div className="frame-line frame-left" />
                <div className="frame-line frame-right" />
              </div>

              <div
                className="portrait-resize-y ui-only"
                id="portrait-resize-y"
              />
            </div>

            {/* Инфо-колонка */}
            <div className="info-column" id="info-column">
              <div className="fields-list" id="fields-list">
                {/* Возраст */}
                <div className="field-row" data-field-id="age">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="age"
                    title="Удалить поле"
                  >
                    ✕
                  </div>
                  <div className="field-icon-wrap" data-icon="hourglass" />
                  <div className="field-content">
                    <span className="field-label">Возраст</span>
                    <input
                      type="text"
                      className="field-input"
                      id="field-age"
                      placeholder="—"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Дата рождения */}
                <div className="field-row" data-field-id="birth">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="birth"
                    title="Удалить поле"
                  >
                    ✕
                  </div>
                  <div className="field-icon-wrap" data-icon="moon" />
                  <div className="field-content">
                    <span className="field-label">Дата рождения</span>
                    <input
                      type="text"
                      className="field-input"
                      id="field-birth"
                      placeholder="—"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Национальность */}
                <div className="field-row" data-field-id="nation">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="nation"
                    title="Удалить поле"
                  >
                    ✕
                  </div>
                  <div className="field-icon-wrap" data-icon="globe" />
                  <div className="field-content">
                    <span className="field-label">Национальность</span>
                    <input
                      type="text"
                      className="field-input"
                      id="field-nation"
                      placeholder="—"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Род / Клан */}
                <div className="field-row" data-field-id="clan">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="clan"
                    title="Удалить поле"
                  >
                    ✕
                  </div>
                  <div className="field-icon-wrap" data-icon="tree" />
                  <div className="field-content">
                    <span className="field-label">Род / Клан</span>
                    <input
                      type="text"
                      className="field-input"
                      id="field-clan"
                      placeholder="—"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Кем является */}
                <div className="field-row" data-field-id="nature">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="nature"
                    title="Удалить поле"
                  >
                    ✕
                  </div>
                  <div className="field-icon-wrap" data-icon="mask" />
                  <div className="field-content">
                    <span className="field-label">Кем является</span>
                    <input
                      type="text"
                      className="field-input"
                      id="field-nature"
                      placeholder="—"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Чем занимается */}
                <div className="field-row" data-field-id="occupation">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="occupation"
                    title="Удалить поле"
                  >
                    ✕
                  </div>
                  <div className="field-icon-wrap" data-icon="quill" />
                  <div className="field-content">
                    <span className="field-label">Чем занимается</span>
                    <input
                      type="text"
                      className="field-input"
                      id="field-occupation"
                      placeholder="—"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {/* Разделитель перед эритрогенами */}
                <div
                  className="section-divider"
                  id="divider-ery"
                  data-field-id="divider-ery"
                >
                  <svg
                    width="100%"
                    height="34"
                    viewBox="0 0 800 34"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line
                      x1="0"
                      y1="17"
                      x2="355"
                      y2="17"
                      stroke="#7a4a1a"
                      strokeWidth="1.2"
                    />
                    <line
                      x1="445"
                      y1="17"
                      x2="800"
                      y2="17"
                      stroke="#7a4a1a"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M355,17L372,7L400,17L372,27Z"
                      fill="#9a6425"
                      stroke="#7a4a1a"
                      strokeWidth=".8"
                    />
                    <path
                      d="M445,17L428,7L400,17L428,27Z"
                      fill="#9a6425"
                      stroke="#7a4a1a"
                      strokeWidth=".8"
                    />
                    <circle cx="400" cy="17" r="4.5" fill="#7a4a1a" />
                  </svg>
                </div>

                {/* Эритрогены */}
                <div className="erythrogen-block" data-field-id="erythrogen">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="erythrogen"
                    title="Удалить блок"
                  >
                    ✕
                  </div>
                  <div className="erythrogen-header">
                    <div className="field-icon-wrap" data-icon="erythrogen" />
                    <span className="erythrogen-title">
                      Уровень Эритрогенов
                    </span>
                  </div>
                  <div className="erythrogen-row">
                    <div className="rank-badge" id="rank-badge">
                      <span className="rank-letter" id="rank-letter">
                        —
                      </span>
                    </div>
                    <input
                      type="text"
                      id="erythrogen-value"
                      className="ery-number-input"
                      placeholder="0"
                      autoComplete="off"
                    />
                    <span className="rank-info-inline" id="rank-info-inline">
                      <span className="rank-dot"> · </span>
                      <span className="rank-name" id="rank-name">
                        Введите значение
                      </span>
                      <span className="rank-dot"> · </span>
                      <span className="rank-range" id="rank-range" />
                    </span>
                    <button
                      className="ery-hint-toggle ui-only"
                      id="ery-hint-toggle"
                      title="Скрыть/показать пояснение"
                    >
                      👁
                    </button>
                  </div>
                </div>

                {/* История */}
                <div className="history-block" data-field-id="history">
                  <div
                    className="field-delete-btn ui-only"
                    data-target="history"
                    title="Удалить блок"
                  >
                    ✕
                  </div>
                  <div className="history-header">
                    <svg
                      width="100%"
                      height="48"
                      viewBox="0 0 800 48"
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <line
                        x1="0"
                        y1="24"
                        x2="240"
                        y2="24"
                        stroke="#7a4a1a"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M240,24L260,11L295,24L260,37Z"
                        fill="#9a6425"
                        stroke="#7a4a1a"
                        strokeWidth="1"
                      />
                      <text
                        x="400"
                        y="33"
                        fontFamily="'Uncial Antiqua',serif"
                        fontSize="32"
                        fill="#3b1f0a"
                        textAnchor="middle"
                        letterSpacing="6"
                      >
                        История
                      </text>
                      <path
                        d="M560,24L540,11L505,24L540,37Z"
                        fill="#9a6425"
                        stroke="#7a4a1a"
                        strokeWidth="1"
                      />
                      <line
                        x1="560"
                        y1="24"
                        x2="800"
                        y2="24"
                        stroke="#7a4a1a"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                  <textarea
                    className="history-textarea"
                    id="field-history"
                    placeholder="Здесь хранится история этого существа..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Нижний орнамент ── */}
          <div className="bottom-ornament">
            <svg
              width="1880"
              height="100"
              viewBox="0 0 1880 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="0"
                y1="8"
                x2="1880"
                y2="8"
                stroke="#7a4a1a"
                strokeWidth="1.5"
              />
              <g transform="translate(940,55)">
                <circle r="38" fill="none" stroke="#7a4a1a" strokeWidth="1.5" />
                <circle
                  r="30"
                  fill="none"
                  stroke="#9a6425"
                  strokeWidth=".8"
                  opacity=".5"
                />
                <circle
                  r="14"
                  fill="#d4a96a"
                  stroke="#7a4a1a"
                  strokeWidth="1.2"
                />
                <circle
                  r="7"
                  fill="#c49050"
                  stroke="#9a6425"
                  strokeWidth=".8"
                />
                <circle r="3" fill="#7a4a1a" />
              </g>
            </svg>
          </div>

          {/* ── Хэндл высоты листа ── */}
          <div id="sheet-resize-handle" className="ui-only">
            <svg
              width="56"
              height="14"
              viewBox="0 0 56 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="4"
                y1="4"
                x2="52"
                y2="4"
                stroke="#9a6425"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="4"
                y1="10"
                x2="52"
                y2="10"
                stroke="#9a6425"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* ── Хэндл ширины листа ── */}
          <div id="sheet-resize-x" className="ui-only">
            <svg
              width="14"
              height="56"
              viewBox="0 0 14 56"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="4"
                y1="4"
                x2="4"
                y2="52"
                stroke="#9a6425"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="10"
                y1="4"
                x2="10"
                y2="52"
                stroke="#9a6425"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Тост ── */}
      <div id="toast" />
    </>
  );
}

const EditorPage = dynamic(() => Promise.resolve(EditorPageInner), {
  ssr: false,
  loading: () => <EditorLoading />,
});

export default EditorPage;
