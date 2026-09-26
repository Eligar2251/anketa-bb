const { test, expect } = require('@playwright/test');

const TEMP_KEY = 'charSheet_temp_v12';
const photo = {
  name: 'photo.png', mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
};

async function addPhoto(page, caption = 'Лицо') {
  await page.locator('#add-photo-btn').click();
  await expect(page.locator('#new-field-type')).toHaveValue('photo');
  await page.locator('#new-field-label').fill(caption);
  await page.locator('#modal-confirm').click();
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

test('old /v2 bookmark opens the single editor and preserves its draft', async ({ page }) => {
  await page.addInitScript(({ key }) => {
    sessionStorage.setItem(key, JSON.stringify({
      currentCharacterId: 'legacy-character', fields: { 'header-name-input': 'Старая анкета' },
      motto: 'Сохранённый девиз',
    }));
  }, { key: TEMP_KEY });
  await page.goto('/v2?id=legacy-character&from=bookmark');
  await expect(page).toHaveURL(/\/editor\?id=legacy-character&from=bookmark/);
  await expect(page.locator('#header-name-input')).toHaveValue('Старая анкета');
  await expect(page.locator('#add-photo-btn')).toBeVisible();
  await expect(page.locator('.v2-sigil-block')).toHaveCount(0);
  await addPhoto(page);
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)).motto, TEMP_KEY))
    .toBe('Сохранённый девиз');
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
