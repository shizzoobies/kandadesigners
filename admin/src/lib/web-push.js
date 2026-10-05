// Web Push: VAPID (RFC 8292) + aes128gcm payload encryption (RFC 8291), using
// only WebCrypto. No new dependency. When VAPID_PRIVATE_KEY is unset, sends go
// through a mock transport that logs [push:mock] and never leaves the box.

const te = new TextEncoder();

export function b64url(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function unb64url(s) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

function concat(...parts) {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

async function hmacSha256(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
}

async function importP256Public(raw) {
  return crypto.subtle.importKey('raw', raw, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
}


async function importP256PrivateJwk(jwk) {
  return crypto.subtle.importKey('jwk', { ...jwk, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
}

async function importP256SignJwk(jwk) {
  return crypto.subtle.importKey('jwk', { ...jwk, ext: true, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
}

// Build a JWK private key from the 32-byte raw scalar + 65-byte uncompressed public.
function p256Jwk(priv32, pub65) {
  return {
    kty: 'EC',
    crv: 'P-256',
    d: b64url(priv32),
    x: b64url(pub65.slice(1, 33)),
    y: b64url(pub65.slice(33, 65)),
  };
}


export async function generateVapidKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const priv = unb64url(jwk.d);
  return { publicKey: b64url(pub), privateKey: b64url(priv), _jwk: jwk, _pub: pub };
}

function decodeVapidPrivate(privB64, pubB64) {
  const priv = unb64url(privB64);
  const pub = unb64url(pubB64);
  if (priv.length !== 32) throw new Error('VAPID private key must be 32 bytes');
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error('VAPID public key must be uncompressed P-256');
  return p256Jwk(priv, pub);
}

export async function vapidJwt({ audience, subject, publicKey, privateKey, now = Date.now(), expiresInSec = 12 * 3600 }) {
  const header = { typ: 'JWT', alg: 'ES256' };
  const exp = Math.floor(now / 1000) + expiresInSec;
  const claims = { aud: audience, exp, sub: subject };
  const enc = (obj) => b64url(te.encode(JSON.stringify(obj)));
  const signingInput = `${enc(header)}.${enc(claims)}`;
  const jwk = decodeVapidPrivate(privateKey, publicKey);
  const key = await importP256SignJwk(jwk);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(signingInput)));
  return { token: `${signingInput}.${b64url(sig)}`, header, claims, exp };
}

// RFC 8291 aes128gcm. opts may fix salt / as key pair for the Appendix A vector.
export async function encryptAes128gcm(plaintext, { p256dh, auth, salt: fixedSalt, asPublic: fixedAsPub, asPrivate: fixedAsPriv } = {}) {
  const uaPublic = typeof p256dh === 'string' ? unb64url(p256dh) : p256dh;
  const authSecret = typeof auth === 'string' ? unb64url(auth) : auth;
  if (uaPublic.length !== 65 || uaPublic[0] !== 0x04) throw new Error('p256dh must be an uncompressed P-256 key');
  if (authSecret.length !== 16) throw new Error('auth secret must be 16 bytes');

  let asPublic, asPrivJwk;
  if (fixedAsPub && fixedAsPriv) {
    asPublic = typeof fixedAsPub === 'string' ? unb64url(fixedAsPub) : fixedAsPub;
    const asPriv = typeof fixedAsPriv === 'string' ? unb64url(fixedAsPriv) : fixedAsPriv;
    asPrivJwk = p256Jwk(asPriv, asPublic);
  } else {
    const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
    const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    asPrivJwk = jwk;
  }

  const salt = fixedSalt
    ? (typeof fixedSalt === 'string' ? unb64url(fixedSalt) : fixedSalt)
    : crypto.getRandomValues(new Uint8Array(16));

  const asKey = await importP256PrivateJwk(asPrivJwk);
  const uaKey = await importP256Public(uaPublic);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKey, 256));

  // HKDF combine (RFC 8291 §3.3)
  const prkKey = await hmacSha256(authSecret, ecdhSecret);
  const keyInfo = concat(te.encode('WebPush: info'), new Uint8Array([0]), uaPublic, asPublic, new Uint8Array([1]));
  const ikm = await hmacSha256(prkKey, keyInfo);

  // RFC 8188 CEK / nonce
  const prk = await hmacSha256(salt, ikm);
  const cekInfo = concat(te.encode('Content-Encoding: aes128gcm'), new Uint8Array([0, 1]));
  const nonceInfo = concat(te.encode('Content-Encoding: nonce'), new Uint8Array([0, 1]));
  const cek = (await hmacSha256(prk, cekInfo)).slice(0, 16);
  const nonce = (await hmacSha256(prk, nonceInfo)).slice(0, 12);

  const body = typeof plaintext === 'string' ? te.encode(plaintext) : plaintext;
  // Padding delimiter 0x02, no leading padding (RFC 8291 §4).
  const padded = concat(body, new Uint8Array([0x02]));
  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded));

  // Header: salt (16) || rs (4 BE) || idlen (1) || keyid (65)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  const header = concat(salt, rs, new Uint8Array([65]), asPublic);
  return concat(header, encrypted);
}

export function mockTransport() {
  const sent = [];
  const transport = async (endpoint, body, headers) => {
    const payload = typeof body === 'string' ? body : (body instanceof Uint8Array ? new TextDecoder().decode(body) : String(body));
    // Prefer the logical JSON when the caller passed it via headers marker.
    const logical = headers?.['X-Mock-Payload'] ?? payload;
    sent.push({ endpoint, payload: logical, headers });
    console.log(`[push:mock] ${endpoint} ${typeof logical === 'string' ? logical : '[binary]'}`);
    return { status: 201, ok: true };
  };
  transport.sent = sent;
  return transport;
}

// Real HTTPS POST to the push endpoint. Never used when VAPID_PRIVATE_KEY is unset.
async function httpTransport(endpoint, body, headers, fetchImpl) {
  const res = await fetchImpl(endpoint, { method: 'POST', headers, body });
  return { status: res.status, ok: res.ok };
}

/**
 * Send one push. Returns { status, delete: boolean }.
 * delete is true for 404/410 (drop the subscription). 429 stays for next run.
 */
export async function sendPush(sub, payload, { env, fetch: fetchImpl = globalThis.fetch, now = Date.now(), transport } = {}) {
  const endpoint = sub.endpoint;
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const priv = env?.VAPID_PRIVATE_KEY;
  const pub = env?.VAPID_PUBLIC_KEY;
  const subject = env?.VAPID_SUBJECT || 'mailto:alex@ka-performancefl.com';

  if (!priv || !pub) {
    const t = transport || mockTransport();
    const r = await t(endpoint, json, { 'Content-Type': 'application/json', 'X-Mock-Payload': json });
    const status = r.status ?? 201;
    return { status, delete: status === 404 || status === 410, mock: true };
  }

  const aud = new URL(endpoint).origin;
  const { token } = await vapidJwt({ audience: aud, subject, publicKey: pub, privateKey: priv, now });
  const body = await encryptAes128gcm(json, { p256dh: sub.p256dh, auth: sub.auth });
  const headers = {
    Authorization: `vapid t=${token}, k=${pub}`,
    'Content-Encoding': 'aes128gcm',
    'Content-Type': 'application/octet-stream',
    TTL: '86400',
    Urgency: 'normal',
  };
  const t = transport || ((ep, b, h) => httpTransport(ep, b, h, fetchImpl));
  const r = await t(endpoint, body, headers);
  const status = r.status ?? 0;
  return { status, delete: status === 404 || status === 410, mock: false };
}
