// FILE: lib/cloudinary.js
'use client';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export function isCloudinaryConfigured() {
  return !!(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadImageToCloudinary(source, options = {}) {
  const {
    folder = 'character-sheet',
    tags = [],
  } = options;

  if (!source) return '';

  if (typeof source === 'string' && /^https?:\/\//i.test(source)) {
    return source;
  }

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary не настроен');
  }

  const formData = new FormData();
  formData.append('file', source);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  if (tags.length) {
    formData.append('tags', tags.join(','));
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Ошибка загрузки в Cloudinary');
  }

  return data.secure_url;
}

/**
 * Извлекает public_id из URL Cloudinary
 */
export function getPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  // URL вида: https://res.cloudinary.com/CLOUD/image/upload/v123/folder/filename.ext
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
}

/**
 * Удаление через серверный API-роут (Cloudinary Admin API требует secret)
 */
export async function deleteImageFromCloudinary(url) {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary')) return;

  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;

  try {
    const res = await fetch('/api/cloudinary-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
    if (!res.ok) {
      const data = await res.json();
      console.warn('Cloudinary delete warning:', data);
    }
  } catch (e) {
    console.warn('Cloudinary delete error:', e);
  }
}