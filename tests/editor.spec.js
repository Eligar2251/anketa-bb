const { test, expect } = require('@playwright/test');
const fs = require('fs');

const TEMP_KEY = 'charSheet_temp_v12';
const photo = {
  name: 'photo.png', mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
};

async function addPhoto(page, caption = 'Лицо') {
  await page.locator('#add-photo-btn').click();
  const row = page.locator('#fields-list .extra-photo-row').last();
  await expect(row).toBeVisible();
  const cap = row.locator('.extra-photo-caption');
  await cap.fill(caption);
  await cap.blur();
}

async function uploadPhoto(page) {
  const row = page.locator('#fields-list .extra-photo-row').last();
  const chooserPromise = page.waitForEvent('filechooser');
  await row.locator('.extra-photo-area').click();
  const chooser = await chooserPromise;
  await chooser.setFiles(photo);
  await expect(row.locator('.extra-photo-wrapper')).toHaveClass(/active/);
  return row;
}

test('old links open the standard anketa, not a separate design', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    sessionStorage.setItem(key, JSON.stringify({
      currentCharacterId: 'legacy-character', fields: { 'header-name-input': 'Старая анкета' },
      motto: 'Сохранённый девиз',
    }));
  }, { key: TEMP_KEY });
  await page.goto('/v2?id=legacy-character&from=bookmark');
  await expect(page).toHaveURL(/\/editor\?id=legacy-character&from=bookmark/);
  await expect(page.locator('#header-name-input')).toHaveValue('Старая анкета');
  await expect(page.locator('.v2-sigil-block')).toHaveCount(0);
  await expect(page.locator('#add-photo-btn')).toBeVisible();
  await expect(page.locator('#dual-mode-btn')).toBeVisible();
  await expect(page.getByText(/герб/i)).toHaveCount(0);
  await expect(page.getByText(/свиток/i)).toHaveCount(0);
  await page.locator('#add-field-btn').click();
  await expect(page.locator('#new-field-icon option[value="scroll"]')).toHaveText('Анкета');
  await page.locator('#modal-cancel').click();
  await addPhoto(page);
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)).motto, TEMP_KEY))
    .toBe('Сохранённый девиз');
});

test('gallery opens only the standard anketa', async ({ page }) => {
  await page.route('https://sheet-test.supabase.co/**', (route) => route.fulfill({ json: [] }));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Анкета' })).toBeVisible();
  await expect(page.getByText(/герб/i)).toHaveCount(0);
  await expect(page.getByText(/свиток/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Анкета' }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.locator('.v2-sigil-block')).toHaveCount(0);
  await expect(page.locator('#add-photo-btn')).toBeVisible();
  await expect(page.locator('#dual-mode-btn')).toBeVisible();
});

test('photo uploads, caption and crop survive reload, and clearing works', async ({ page }) => {
  await page.goto('/editor');
  await addPhoto(page);
  const row = await uploadPhoto(page);
  await row.locator('.extra-photo-caption').fill('Портрет в профиль');
  await row.locator('.extra-photo-caption').blur();
  await row.locator('.extra-photo-area').hover();
  await page.mouse.wheel(0, -100);
  const saved = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), TEMP_KEY);
  expect(saved.customFields[0].photo.src).toMatch(/^data:image\//);
  await page.reload();
  await expect(row.locator('.extra-photo-caption')).toHaveValue('Портрет в профиль');
  await expect(row.locator('.extra-photo-wrapper')).toHaveClass(/active/);
  await expect(row.locator('.extra-photo-img')).toHaveJSProperty('naturalWidth', 1);
  await expect(row.locator('.extra-photo-img')).toHaveCSS('width', '1px');
  const restored = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), TEMP_KEY);
  expect(restored.customFields[0].photo).toEqual(saved.customFields[0].photo);
  page.on('dialog', (dialog) => dialog.accept());
  await row.locator('.extra-photo-clear').click();
  await expect(row.locator('.extra-photo-placeholder')).toBeVisible();
  await page.reload();
  await expect(row.locator('.extra-photo-wrapper')).not.toHaveClass(/active/);
});

test('photo cell is square, zooms and keeps its size after reload', async ({ page }) => {
  await page.goto('/editor');
  await addPhoto(page);
  const row = page.locator('#fields-list .extra-photo-row').last();
  const area = row.locator('.extra-photo-area');
  // Пустая ячейка уже квадратная
  const empty = await area.boundingBox();
  expect(Math.abs(empty.width - empty.height)).toBeLessThan(1);
  // Панель есть всегда, но масштаб доступен только с фото
  await expect(row.locator('.extra-photo-toolbar')).toBeVisible();
  await expect(row.locator('.extra-photo-size')).toBeVisible();
  await expect(row.locator('.ep-zoom-in')).toBeHidden();
  await uploadPhoto(page);
  await expect(row.locator('.ep-zoom-in')).toBeVisible();
  const start = await area.boundingBox();
  expect(Math.abs(start.width - start.height)).toBeLessThan(1);

  const zoom = row.locator('.extra-photo-zoom-value');
  await expect(zoom).toHaveText('100%');
  await row.locator('.ep-zoom-in').click();
  await expect(zoom).toHaveText('112%');
  await row.locator('.ep-zoom-out').click();
  await expect(zoom).toHaveText('100%');
  await row.locator('.ep-zoom-in').click();
  await row.locator('.ep-zoom-fit').click();
  await expect(zoom).toHaveText('100%');

  // Тянем за угол — ячейка растёт, оставаясь квадратом
  const handle = await row.locator('.extra-photo-resize').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handle.x + handle.width / 2 + 60,
    handle.y + handle.height / 2 + 60,
    { steps: 6 },
  );
  await page.mouse.up();
  const grown = await area.boundingBox();
  expect(grown.width).toBeGreaterThan(start.width + 10);
  expect(Math.abs(grown.width - grown.height)).toBeLessThan(1);
  await expect(zoom).toHaveText('100%');
  const saved = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), TEMP_KEY);
  expect(saved.customFields[0].photo.size).toBeGreaterThan(0);

  await page.reload();
  const restored = await row.locator('.extra-photo-area').boundingBox();
  expect(Math.abs(restored.width - restored.height)).toBeLessThan(1);
  expect(Math.abs(restored.width - grown.width)).toBeLessThan(3);
});

test('dual editor restores independent photo fields on both sides', async ({ page }) => {
  await page.goto('/editor');
  await page.locator('#dual-mode-btn').click();
  await addPhoto(page, 'Два портрета');
  await expect(page.locator('#fields-list .extra-photo-row')).toHaveCount(1);
  await expect(page.locator('#fields-list-right .extra-photo-row')).toHaveCount(1);
  await page.locator('#fields-list-right .extra-photo-caption').fill('Второй персонаж');
  await page.locator('#fields-list-right .extra-photo-caption').blur();
  await page.reload();
  await expect(page.locator('#fields-list .extra-photo-caption')).toHaveValue('Два портрета');
  await expect(page.locator('#fields-list-right .extra-photo-caption')).toHaveValue('Второй персонаж');
});

test('old link loads its character by id instead of an unrelated draft', async ({ page }) => {
  await page.addInitScript(({ key }) => sessionStorage.setItem(key, JSON.stringify({
    currentCharacterId: 'other', fields: { 'header-name-input': 'Другой' },
  })), { key: TEMP_KEY });
  await page.route('https://sheet-test.supabase.co/rest/v1/characters*', (route) => {
    expect(new URL(route.request().url()).searchParams.get('id')).toBe('eq.requested');
    return route.fulfill({ json: {
      data: { fields: { 'header-name-input': 'Из облака' } }, is_duo: false,
    } });
  });
  await page.goto('/v2?id=requested');
  await expect(page.locator('#header-name-input')).toHaveValue('Из облака');
});

test('new tab restores the recent transfer mirror', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('charSheet_transfer_v1', JSON.stringify({
    ts: Date.now(), payload: JSON.stringify({ fields: { 'header-name-input': 'Новая вкладка' } }),
  })));
  await page.goto('/v2');
  await expect(page.locator('#header-name-input')).toHaveValue('Новая вкладка');
});

test('cloud photo URL replaces the local data URL, without repeated uploads', async ({ page }) => {
  let uploads = 0;
  let payload;
  await page.route('https://api.cloudinary.com/**', (route) => {
    uploads++;
    return route.fulfill({ json: { secure_url: 'https://images.example/photo.png' } });
  });
  await page.route('https://images.example/photo.png', (route) => route.fulfill({
    contentType: 'image/png', body: photo.buffer,
  }));
  await page.route('https://sheet-test.supabase.co/rest/v1/characters*', (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({ json: { id: 'saved-character' } });
  });
  await page.goto('/editor');
  await addPhoto(page);
  await uploadPhoto(page);
  await page.locator('#cloud-save-btn').click();
  await expect(page.locator('#cloud-save-btn')).toBeEnabled();
  expect((Array.isArray(payload) ? payload[0] : payload).data.customFields[0].photo.src)
    .toBe('https://images.example/photo.png');
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)).customFields[0].photo.src, TEMP_KEY))
    .toBe('https://images.example/photo.png');
  await page.locator('#cloud-save-btn').click();
  await expect(page.locator('#cloud-save-btn')).toBeEnabled();
  expect(uploads).toBe(1);
});

test('new character clears both draft stores and the bookmarked id', async ({ page }) => {
  await page.route('https://sheet-test.supabase.co/rest/v1/characters*', (route) => route.fulfill({
    json: { data: { fields: { 'header-name-input': 'Старая' } }, is_duo: false },
  }));
  await page.goto('/v2?id=old');
  await expect(page.locator('#header-name-input')).toHaveValue('Старая');
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('#new-char-btn').click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.locator('#header-name-input')).toHaveValue('');
  await expect(page.locator('.extra-photo-row')).toHaveCount(0);
});

test('failed bookmarked load shows an error and leaves the old draft intact', async ({ page }) => {
  await page.addInitScript(({ key }) => sessionStorage.setItem(key, JSON.stringify({
    currentCharacterId: 'keep-me', fields: { 'header-name-input': 'Не потерять' },
  })), { key: TEMP_KEY });
  await page.route('https://sheet-test.supabase.co/rest/v1/characters*', (route) => route.fulfill({
    status: 404, json: { message: 'Анкета не найдена' },
  }));
  await page.goto('/v2?id=missing');
  await expect(page.getByRole('alert').filter({ hasText: 'Анкета не найдена' })).toBeVisible();
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)).currentCharacterId, TEMP_KEY))
    .toBe('keep-me');
});

test('erythrogen title and rank scale in both columns', async ({ page }) => {
  await page.goto('/editor');
  await page.locator('#dual-mode-btn').click();
  await page.locator('#font-settings-btn').click();
  await page.locator('#ery-title-font-size').fill('42');
  await page.locator('#ery-font-size').fill('80');
  for (const title of await page.locator('.erythrogen-title').all()) {
    await expect(title).toHaveCSS('font-size', '42px');
  }
  for (const badge of await page.locator('.rank-badge').all()) {
    const size = await badge.evaluate((el) => parseFloat(getComputedStyle(el).width));
    expect(size).toBeCloseTo(80 * 1.22, 1);
  }
});

test('photo cell is centered in the field and lifts up without a caption', async ({ page }) => {
  await page.goto('/editor');
  await addPhoto(page, 'Лицо');
  const row = page.locator('#fields-list .extra-photo-row').last();
  const area = row.locator('.extra-photo-area');
  const rowBox = await row.boundingBox();
  const areaBox = await area.boundingBox();
  const centerX = (b) => b.x + b.width / 2;
  // ячейка стоит по центру поля, а не прижата к левому краю
  expect(Math.abs(centerX(areaBox) - centerX(rowBox))).toBeLessThan(2);
  // подпись над ячейкой отцентрирована вместе с ней
  const capBox = await row.locator('.extra-photo-caption').boundingBox();
  expect(Math.abs(centerX(capBox) - centerX(rowBox))).toBeLessThan(2);

  // с подписью строка заголовка занимает место над ячейкой
  const contentBox = await row.locator('.extra-photo-content').boundingBox();
  expect(areaBox.y).toBeGreaterThan(contentBox.y + 10);

  // без подписи пустой строки нет: ячейка поднимается к верху поля
  await row.locator('.extra-photo-caption').fill('');
  await row.locator('.extra-photo-caption').blur();
  const lifted = await area.boundingBox();
  const liftedContent = await row.locator('.extra-photo-content').boundingBox();
  expect(Math.abs(lifted.y - liftedContent.y)).toBeLessThan(1);
  expect(Math.abs(lifted.y - areaBox.y)).toBeGreaterThan(5);

  // подпись можно вернуть кнопкой на панели под ячейкой
  await row.locator('.ep-caption-btn').click();
  await expect(row.locator('.extra-photo-caption')).toBeVisible();
  await row.locator('.extra-photo-caption').fill('Вернули');
  await row.locator('.extra-photo-caption').blur();
  const back = await area.boundingBox();
  expect(Math.abs(back.y - areaBox.y)).toBeLessThan(2);
});

test('erythrogen level is a single centered system, no divider', async ({ page }) => {
  await page.goto('/editor');
  await expect(page.locator('#divider-ery')).toHaveCount(0);
  await page.locator('#erythrogen-value').fill('3700 ед.');
  const cy = (b) => b.y + b.height / 2;
  const badge = await page.locator('#rank-badge').boundingBox();
  const num = await page.locator('#erythrogen-value').boundingBox();
  const name = await page.locator('#rank-name').boundingBox();
  // буква, число и пояснение — на одной горизонтальной оси строки
  expect(Math.abs(cy(badge) - cy(num))).toBeLessThan(1);
  expect(Math.abs(cy(badge) - cy(name))).toBeLessThan(1);

  // диапазон не отображается
  await expect(page.locator('#rank-range')).toHaveCount(0);

  // значок уровня выравнивается по левому краю с иконкой заголовка
  const badgeBox = await page.locator('#rank-badge').boundingBox();
  const iconBox = await page.locator('.erythrogen-header .field-icon-wrap').boundingBox();
  expect(Math.abs(badgeBox.x - iconBox.x)).toBeLessThan(1);

  // название ранга масштабируется от размера уровня
  await page.locator('#font-settings-btn').click();
  await page.locator('#ery-font-size').fill('80');
  await expect(page.locator('#rank-name')).toHaveCSS('font-size', '40px');

  // название ранга можно скрыть и вернуть
  await page.locator('#font-modal-close').click();
  await page.locator('#ery-hint-toggle').click();
  await expect(page.locator('#rank-info-inline')).toBeHidden();
  await page.locator('#ery-hint-toggle').click();
  await expect(page.locator('#rank-info-inline')).toBeVisible();
});

test('erythrogen name follows fitted lining numerals in both columns', async ({ page }) => {
  await page.goto('/editor');

  async function checkRow(suffix = '') {
    const input = page.locator('#erythrogen-value' + suffix);
    await input.fill('3700 ед.');
    await expect(input).toHaveCSS('font-family', '"Times New Roman", Times, serif');
    await expect(input).toHaveCSS('font-variant-numeric', 'lining-nums tabular-nums');
    await expect(page.locator('#rank-name' + suffix)).toHaveCSS('font-family', 'Philosopher, serif');
    const row = await input.evaluate((el) => {
      const num = el.getBoundingClientRect();
      const name = el.parentElement.querySelector('.rank-name').getBoundingClientRect();
      const info = el.parentElement.querySelector('.rank-info-inline').getBoundingClientRect();
      const scale = num.height / el.offsetHeight;
      const style = getComputedStyle(el);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return {
        centerDelta: Math.abs(num.y + num.height / 2 - name.y - name.height / 2),
        gap: (info.x - num.right) / scale,
        expectedGap: parseFloat(getComputedStyle(el.parentElement).columnGap),
        excessWidth: num.width / scale - ctx.measureText(el.value).width,
        nameWidth: name.width,
      };
    });
    expect(row.centerDelta).toBeLessThan(1);
    expect(row.nameWidth).toBeGreaterThan(0);
    expect(Math.abs(row.gap - row.expectedGap)).toBeLessThan(1);
    expect(row.excessWidth).toBeGreaterThanOrEqual(0);
    expect(row.excessWidth).toBeLessThan(5);
    await input.fill('9');
    const shortWidth = await input.evaluate(el => el.offsetWidth);
    await input.fill('3700 ед.');
    expect(await input.evaluate(el => el.offsetWidth)).toBeGreaterThan(shortWidth);
    await input.blur();
  }

  await checkRow();
  await page.locator('#dual-mode-btn').click();
  await checkRow();
  await checkRow('-right');
  await page.locator('#font-settings-btn').click();
  await page.locator('#ery-font-size').fill('80');
  await page.locator('#font-modal-close').click();
  await checkRow();
  await checkRow('-right');
  await page.reload();
  await expect(page.locator('#erythrogen-value-right')).toHaveValue('3700 ед.');
  await checkRow();
  await checkRow('-right');
});

test('exported PNG keeps all four corners of the portrait frame', async ({ page }) => {
  await page.goto('/editor');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export-btn').click(),
  ]);
  const file = await download.path();
  const b64 = fs.readFileSync(file).toString('base64');
  const samples = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const at = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
    // портрет по умолчанию: x=58, y≈348, 860×3000; линии рамки в его углах
    return {
      tl: at(100, 351),
      tr: at(880, 351),
      bl: at(100, 3345),
      br: at(880, 3345),
      bg: at(500, 1800),
    };
  }, b64);
  const dark = (px) => px[0] + px[1] + px[2] < 400;
  const light = (px) => px[0] + px[1] + px[2] > 500;
  expect(dark(samples.tl), `tl=${samples.tl}`).toBe(true);
  expect(dark(samples.tr), `tr=${samples.tr}`).toBe(true);
  expect(dark(samples.bl), `bl=${samples.bl}`).toBe(true);
  expect(dark(samples.br), `br=${samples.br}`).toBe(true);
  expect(light(samples.bg), `bg=${samples.bg}`).toBe(true);
});
