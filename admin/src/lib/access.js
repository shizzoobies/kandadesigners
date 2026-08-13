// Verifies Cloudflare Access JWTs. Pure crypto plus a JWKS fetch; knows nothing
// about D1, Astro, or this app's notion of a user. Policy about where an
// identity may come from lives in identity.js, deliberately not here.
//
// Docs: https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/validating-json/

const JWKS_TTL_MS = 60 * 60 * 1000;

let jwksCache = { at: 0, domain: null, keys: null };

export class AccessError extends Error {}

// Test-only. The cache is module-level so it survives across requests in a warm
// isolate, which also means tests would leak into each other without this.
export function __resetJwksCache() {
  jwksCache = { at: 0, domain: null, keys: null };
}

function b64urlToBytes(input) {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlToJson(input) {
  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(input)));
  } catch {
    throw new AccessError('malformed_token');
  }
}

async function getJwks(teamDomain, fetchImpl, now) {
  const fresh = jwksCache.keys
    && jwksCache.domain === teamDomain
    && now - jwksCache.at < JWKS_TTL_MS;
  if (fresh) return jwksCache.keys;

  const res = await fetchImpl(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new AccessError(`jwks_fetch_failed_${res.status}`);
  const body = await res.json();
  if (!Array.isArray(body?.keys) || body.keys.length === 0) {
    throw new AccessError('jwks_empty');
  }
  jwksCache = { at: now, domain: teamDomain, keys: body.keys };
  return body.keys;
}

export async function verifyAccessJwt(token, opts) {
  const { teamDomain, aud, fetchImpl = fetch, now = Date.now() } = opts;
  if (!token) throw new AccessError('missing_token');

  const parts = token.split('.');
  if (parts.length !== 3) throw new AccessError('malformed_token');
  const [headerPart, payloadPart, signaturePart] = parts;

  const header = b64urlToJson(headerPart);
  // Pinning the algorithm is what stops an attacker swapping in "none" or a
  // symmetric alg and having us verify a token against a public value.
  if (header.alg !== 'RS256') throw new AccessError('unexpected_alg');
  if (!header.kid) throw new AccessError('missing_kid');

  const keys = await getJwks(teamDomain, fetchImpl, now);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new AccessError('unknown_kid');

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(signaturePart),
    new TextEncoder().encode(`${headerPart}.${payloadPart}`)
  );
  if (!valid) throw new AccessError('bad_signature');

  const payload = b64urlToJson(payloadPart);
  const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audList.includes(aud)) throw new AccessError('aud_mismatch');
  if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now) {
    throw new AccessError('expired');
  }
  if (payload.iss !== `https://${teamDomain}`) throw new AccessError('iss_mismatch');
  if (!payload.email) throw new AccessError('missing_email');

  return { email: String(payload.email).toLowerCase(), payload };
}
