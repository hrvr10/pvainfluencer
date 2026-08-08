import { auth } from './firebase';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export interface PreparedScreenshot {
  base64: string;
  mediaType: 'image/jpeg';
  blob: Blob;
}

// Downscales large phone screenshots before they go to the vision API or
// storage — keeps requests fast and cheap without a visible quality loss.
export async function prepareScreenshot(file: File): Promise<PreparedScreenshot> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = dataUrl.split(',')[1];
  const blob = await (await fetch(dataUrl)).blob();
  return { base64, mediaType: 'image/jpeg', blob };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function authedFetch(url: string, body: unknown) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

// Uploads to our own /api/upload-screenshot route, which proxies to
// Cloudflare R2 — the client never sees R2 credentials.
export async function uploadScreenshot(path: string, screenshot: PreparedScreenshot): Promise<string> {
  const res = await authedFetch('/api/upload-screenshot', { imageBase64: screenshot.base64, path });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}
