#!/usr/bin/env node
// Generate a VAPID key pair for Web Push (RFC 8292). Run on your own PC:
//   node scripts/vapid-keys.mjs
// Then: wrangler secret put VAPID_PRIVATE_KEY  (paste the private key)
// Put the public key and VAPID_SUBJECT in wrangler.jsonc vars (not secrets).
// Uses WebCrypto only — no new dependency.

function b64url(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Buffer.from(u8).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(s) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  return new Uint8Array(Buffer.from((s + pad).replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
}

const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
const priv = unb64url(jwk.d);

console.log('VAPID_PUBLIC_KEY=' + b64url(pub));
console.log('VAPID_PRIVATE_KEY=' + b64url(priv));
console.log('');
console.log('Public key → wrangler.jsonc vars.VAPID_PUBLIC_KEY (safe to commit).');
console.log('Private key → wrangler secret put VAPID_PRIVATE_KEY (never commit).');
console.log('Also set vars.VAPID_SUBJECT, e.g. mailto:alex@ka-performancefl.com');
