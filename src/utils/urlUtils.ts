/**
 * Utility to get the public base URL for sharing (Salin Link, WhatsApp, QR Poster).
 * If running on localhost or a local development environment, it automatically
 * resolves to the official production URL (https://cntitapd.netlify.app)
 * so that shared links and printed QR codes can be opened by anyone.
 */
export function getPublicBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://cntitapd.netlify.app';
  const hostname = window.location.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  ) {
    return 'https://cntitapd.netlify.app';
  }
  return window.location.origin;
}
