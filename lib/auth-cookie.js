// HMAC-SHA256 signed cookie helpers using the Web Crypto API (Cloudflare Workers runtime).
// Cookie format: ds_auth=auth:{expires_ms}.{hex_hmac_signature}

const COOKIE_NAME = 'ds_auth';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function toHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createAuthCookie(secret) {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `auth:${expires}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const value = `${payload}.${toHex(sig)}`;
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE_SECONDS}; Path=/`;
}

export async function verifyAuthCookie(cookieHeader, secret) {
  if (!cookieHeader) return false;

  const cookies = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }

  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const sigHex = token.slice(lastDot + 1);

  const key = await importHmacKey(secret);
  const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  if (sigHex !== toHex(expectedSig)) return false;

  const colonIdx = payload.indexOf(':');
  if (colonIdx === -1) return false;
  const expires = parseInt(payload.slice(colonIdx + 1), 10);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  return true;
}
