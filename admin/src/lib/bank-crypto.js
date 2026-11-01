// The Plaid access token at rest. AES-256-GCM under BANK_TOKEN_KEY (32 random
// bytes, base64), a secret only ka-bank-sync holds, so the admin Worker and
// anyone reading D1 see ciphertext only. The stored form is
// base64(iv || ciphertext || tag) with a fresh 12-byte IV per seal; WebCrypto
// appends the 16-byte tag to the ciphertext itself. Never log either side.

const IV_BYTES = 12;

const toB64 = (bytes) => {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const fromB64 = (b64) => Uint8Array.from(atob(String(b64)), (c) => c.charCodeAt(0));

async function importKey(keyB64) {
  let raw;
  try {
    raw = fromB64(keyB64);
  } catch {
    throw new Error('BANK_TOKEN_KEY is not valid base64.');
  }
  if (raw.length !== 32) throw new Error('BANK_TOKEN_KEY must be 32 bytes.');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Encrypts text under the base64 key; returns base64(iv || ciphertext || tag). */
export async function seal(keyB64, text) {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(String(text))));
  const out = new Uint8Array(IV_BYTES + sealed.length);
  out.set(iv);
  out.set(sealed, IV_BYTES);
  return toB64(out);
}

/** Decrypts what seal returned. A wrong key or a changed byte throws. */
export async function open(keyB64, b64) {
  const key = await importKey(keyB64);
  const bytes = fromB64(b64);
  if (bytes.length <= IV_BYTES) throw new Error('Sealed token is too short.');
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, IV_BYTES) }, key, bytes.slice(IV_BYTES));
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error('Sealed token could not be opened.');
  }
}
