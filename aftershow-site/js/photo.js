// Client-side photo compression: max 1600px, WebP (JPEG fallback), stepped down to ~300KB.
import { PHOTO_MAX_DIMENSION, PHOTO_TARGET_BYTES, PHOTO_HARD_CAP_BYTES } from './config.js';

const toBlob = (canvas, mime, q) => new Promise((res) => canvas.toBlob(res, mime, q));
function webpSupported() {
  const c = document.createElement('canvas'); c.width = c.height = 1;
  return c.toDataURL('image/webp').startsWith('data:image/webp');
}
async function loadBitmap(file) {
  if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch { /* fall through */ } }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image file.'));
    img.src = URL.createObjectURL(file);
  });
}
export function validatePhoto(file) {
  if (!file.type.startsWith('image/')) return 'That file is not an image.';
  if (file.size > PHOTO_HARD_CAP_BYTES) return 'Photo is over 5MB — please choose a smaller file.';
  return null;
}
export async function compressPhoto(file, onProgress, { maxDim = PHOTO_MAX_DIMENSION, targetBytes = PHOTO_TARGET_BYTES } = {}) {
  const problem = validatePhoto(file);
  if (problem) throw new Error(problem);
  onProgress?.('loading');
  const bmp = await loadBitmap(file);
  const sw = bmp.width || bmp.naturalWidth, sh = bmp.height || bmp.naturalHeight;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const width = Math.round(sw * scale), height = Math.round(sh * scale);
  onProgress?.('resizing');
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  canvas.getContext('2d').drawImage(bmp, 0, 0, width, height);
  onProgress?.('compressing');
  const mime = webpSupported() ? 'image/webp' : 'image/jpeg';
  let q = 0.85, blob = await toBlob(canvas, mime, q), tries = 0;
  while (blob.size > targetBytes && q > 0.35 && tries++ < 6) { q -= 0.12; blob = await toBlob(canvas, mime, q); }
  return { blob, mime, width, height };
}
export const blobToDataUrl = (blob) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
