'use client';

/**
 * Утилита для корректного экспорта анкеты в PNG
 * Решает проблемы со смещением текста и элементов
 */

export async function exportSheetToPNG(sheetElement, options = {}) {
  const {
    width = 2000,
    height = 4000,
    filename = 'character_sheet.png',
    onProgress = () => {},
    returnDataUrl = false
  } = options;

  // Импортируем html2canvas динамически
  const html2canvas = (await import('html2canvas')).default;

  onProgress('Подготовка...');

  // 1. Создаём клон элемента для экспорта
  const clone = sheetElement.cloneNode(true);
  
  // 2. Удаляем все UI-элементы из клона
  clone.querySelectorAll('.ui-only').forEach(el => el.remove());
  clone.querySelectorAll('.portrait-placeholder span').forEach(el => el.remove());

  // 3. Создаём временный контейнер
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = width + 'px';
  container.style.height = height + 'px';
  container.style.zIndex = '-10000';
  container.style.overflow = 'hidden';
  container.style.pointerEvents = 'none';
  container.style.transform = 'none';
  container.style.margin = '0';
  container.style.padding = '0';

  // 4. Настраиваем клон
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = width + 'px';
  clone.style.height = height + 'px';
  clone.style.transform = 'none';
  clone.style.margin = '0';
  clone.style.padding = '48px 58px 80px';
  clone.style.boxSizing = 'border-box';

  // 5. Фиксируем все input и textarea значения как текстовые ноды
  fixInputValues(clone);

  // 6. Добавляем в DOM
  container.appendChild(clone);
  document.body.appendChild(container);

  // Ждём загрузки изображений
  await waitForImages(clone);

  onProgress('Генерация изображения...');

  try {
    // 7. Рендерим canvas
    const canvas = await html2canvas(clone, {
      width: width,
      height: height,
      scale: 2, // Увеличиваем качество
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#dfc87e',
      logging: false,
      removeContainer: false,
      imageTimeout: 0,
      windowWidth: width,
      windowHeight: height,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0
    });

    // 8. Удаляем временный контейнер
    document.body.removeChild(container);

    onProgress('Сохранение...');

    const dataUrl = canvas.toDataURL('image/png', 1.0);

    if (returnDataUrl) {
      return dataUrl;
    }

    // 9. Скачиваем файл
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    return { success: true, dataUrl };

  } catch (error) {
    // Очистка в случае ошибки
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
    throw error;
  }
}

/**
 * Заменяет input/textarea элементы на статический текст
 */
function fixInputValues(element) {
  // Обрабатываем обычные input
  element.querySelectorAll('input[type="text"], input:not([type])').forEach(input => {
    const value = input.value || input.placeholder || '';
    const span = document.createElement('span');
    span.textContent = value;
    span.className = input.className;
    span.style.cssText = window.getComputedStyle(input).cssText;
    span.style.border = 'none';
    span.style.outline = 'none';
    span.style.display = 'block';
    span.style.whiteSpace = 'nowrap';
    span.style.overflow = 'hidden';
    span.style.textOverflow = 'ellipsis';
    
    if (!value) {
      span.style.opacity = '0.3';
      span.style.fontStyle = 'italic';
    }
    
    input.parentNode.replaceChild(span, input);
  });

  // Обрабатываем number input (эритрогены)
  element.querySelectorAll('input[type="number"]').forEach(input => {
    const value = input.value || input.placeholder || '';
    const span = document.createElement('span');
    span.textContent = value;
    span.className = input.className;
    span.style.cssText = window.getComputedStyle(input).cssText;
    span.style.border = 'none';
    span.style.outline = 'none';
    span.style.display = 'block';
    span.style.textAlign = 'right';
    
    if (!value) {
      span.style.opacity = '0.3';
    }
    
    input.parentNode.replaceChild(span, input);
  });

  // Обрабатываем textarea
  element.querySelectorAll('textarea').forEach(textarea => {
    const value = textarea.value || textarea.placeholder || '';
    const div = document.createElement('div');
    div.textContent = value;
    div.className = textarea.className;
    div.style.cssText = window.getComputedStyle(textarea).cssText;
    div.style.border = 'none';
    div.style.outline = 'none';
    div.style.resize = 'none';
    div.style.overflow = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    
    if (!value) {
      div.style.opacity = '0.25';
      div.style.fontStyle = 'italic';
    }
    
    textarea.parentNode.replaceChild(div, textarea);
  });
}

/**
 * Ожидает загрузки всех изображений
 */
function waitForImages(element) {
  const images = Array.from(element.querySelectorAll('img'));
  
  return Promise.all(
    images.map(img => {
      if (img.complete) return Promise.resolve();
      
      return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = resolve; // Игнорируем ошибки загрузки
        setTimeout(resolve, 3000); // Таймаут 3 секунды
      });
    })
  );
}

/**
 * Создаёт превью для галереи (только портрет + имя)
 */
export async function createGalleryPreview(portraitData, characterName, options = {}) {
  const {
    width = 400,
    height = 500
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Фон
  ctx.fillStyle = '#dfc87e';
  ctx.fillRect(0, 0, width, height);

  // Если есть портрет
  if (portraitData?.src && portraitData.src !== 'loading') {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = portraitData.src;
        setTimeout(reject, 5000); // Таймаут
      });

      // Рисуем портрет
      const scale = Math.max(width / img.naturalWidth, (height - 80) / img.naturalHeight);
      const x = (width - img.naturalWidth * scale) / 2;
      const y = 0;
      
      ctx.drawImage(img, x, y, img.naturalWidth * scale, img.naturalHeight * scale);
      
    } catch (e) {
      // Если не удалось загрузить - рисуем placeholder
      drawPlaceholder(ctx, width, height - 80);
    }
  } else {
    drawPlaceholder(ctx, width, height - 80);
  }

  // Полоса с именем внизу
  ctx.fillStyle = 'rgba(18, 10, 3, 0.85)';
  ctx.fillRect(0, height - 80, width, 80);

  // Имя персонажа
  ctx.fillStyle = '#f5e6c8';
  ctx.font = 'bold 24px "Philosopher", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const name = characterName || 'Безымянный';
  ctx.fillText(name, width / 2, height - 40);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Рисует placeholder для портрета
 */
function drawPlaceholder(ctx, width, height) {
  ctx.fillStyle = 'rgba(122, 74, 26, 0.15)';
  ctx.fillRect(0, 0, width, height);
  
  // Иконка персонажа
  ctx.fillStyle = 'rgba(122, 74, 26, 0.3)';
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Голова
  ctx.beginPath();
  ctx.arc(centerX, centerY - 30, 40, 0, Math.PI * 2);
  ctx.fill();
  
  // Тело
  ctx.beginPath();
  ctx.moveTo(centerX - 60, height);
  ctx.quadraticCurveTo(centerX - 60, centerY + 20, centerX, centerY + 20);
  ctx.quadraticCurveTo(centerX + 60, centerY + 20, centerX + 60, height);
  ctx.lineTo(centerX - 60, height);
  ctx.fill();
}