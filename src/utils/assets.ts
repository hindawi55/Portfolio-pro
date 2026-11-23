/**
 * Resolves static asset URLs relative to Vite's configured BASE_URL
 * so images load reliably across localhost, custom domains, and GitHub Pages subpaths.
 */
function encodePathSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

export function resolveAssetUrl(relativePath: string): string {
  if (!relativePath) return '';
  if (/^(https?:)?\/\/|^data:|^blob:/i.test(relativePath)) {
    return relativePath;
  }

  const rawBase = import.meta.env.BASE_URL || './';
  const normalizedBase = rawBase.replace(/\/+$/, '');
  const cleanPath = relativePath.replace(/^\/+/, '');
  const encodedPath = cleanPath
    .split('/')
    .filter(Boolean)
    .map(encodePathSegment)
    .join('/');

  return `${normalizedBase}/${encodedPath}`;
}

export const FALLBACK_IMAGE_URL = resolveAssetUrl('images/1.jpg');
