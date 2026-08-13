import { describe, it, expect, beforeEach } from 'vitest';
import { verifyAccessJwt, AccessError, __resetJwksCache } from '../src/lib/access.js';

const TEAM = 'kandaperformance.cloudflareaccess.com';
const AUD = 'aud-tag-for-tests';
const NOW = 1_755_100_000_000; // fixed clock, ms

function b64url(bytes) {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const b64urlJson = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

async function makeKeypair() {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { pair, jwk };
}

async function signToken({ pair, kid, claims, alg = 'RS256' }) {
  const h = b64urlJson({ alg, kid, typ: 'JWT' });
  const p = b64urlJson(claims);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    pair.privateKey,
    new TextEncoder().encode(`${h}.${p}`)
  );
  return `${h}.${p}.${b64url(sig)}`;
}

function jwksFetcher(jwk, kid, { status = 200, keys } = {}) {
  return async () => ({
    ok: status === 200,
    status,
    json: async () => ({ keys: keys ?? [{ ...jwk, kid, alg: 'RS256', use: 'sig' }] }),
  });
}

const goodClaims = {
  aud: [AUD],
  email: 'Alex@KA-PerformanceFL.com',
  iss: `https://${TEAM}`,
  exp: Math.floor(NOW / 1000) + 3600,
};

describe('verifyAccessJwt', () => {
  beforeEach(() => __resetJwksCache());

  it('accepts a valid token and lowercases the email', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({ pair, kid: 'k1', claims: goodClaims });
    const result = await verifyAccessJwt(token, {
      teamDomain: TEAM,
      aud: AUD,
      fetchImpl: jwksFetcher(jwk, 'k1'),
      now: NOW,
    });
    expect(result.email).toBe('alex@ka-performancefl.com');
  });

  it('rejects a missing token', async () => {
    await expect(verifyAccessJwt('', { teamDomain: TEAM, aud: AUD, now: NOW }))
      .rejects.toThrow('missing_token');
  });

  it('rejects a malformed token', async () => {
    await expect(verifyAccessJwt('not.a', { teamDomain: TEAM, aud: AUD, now: NOW }))
      .rejects.toThrow('malformed_token');
  });

  it('rejects an expired token', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({
      pair,
      kid: 'k1',
      claims: { ...goodClaims, exp: Math.floor(NOW / 1000) - 10 },
    });
    await expect(verifyAccessJwt(token, {
      teamDomain: TEAM, aud: AUD, fetchImpl: jwksFetcher(jwk, 'k1'), now: NOW,
    })).rejects.toThrow('expired');
  });

  it('rejects a token for a different application', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({
      pair, kid: 'k1', claims: { ...goodClaims, aud: ['someone-elses-app'] },
    });
    await expect(verifyAccessJwt(token, {
      teamDomain: TEAM, aud: AUD, fetchImpl: jwksFetcher(jwk, 'k1'), now: NOW,
    })).rejects.toThrow('aud_mismatch');
  });

  it('rejects a token whose kid is not in the JWKS', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({ pair, kid: 'unknown', claims: goodClaims });
    await expect(verifyAccessJwt(token, {
      teamDomain: TEAM, aud: AUD, fetchImpl: jwksFetcher(jwk, 'k1'), now: NOW,
    })).rejects.toThrow('unknown_kid');
  });

  it('rejects a tampered payload', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({ pair, kid: 'k1', claims: goodClaims });
    const [h, , s] = token.split('.');
    const forged = `${h}.${b64urlJson({ ...goodClaims, email: 'attacker@example.com' })}.${s}`;
    await expect(verifyAccessJwt(forged, {
      teamDomain: TEAM, aud: AUD, fetchImpl: jwksFetcher(jwk, 'k1'), now: NOW,
    })).rejects.toThrow('bad_signature');
  });

  it('rejects an unexpected algorithm', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({ pair, kid: 'k1', claims: goodClaims, alg: 'HS256' });
    await expect(verifyAccessJwt(token, {
      teamDomain: TEAM, aud: AUD, fetchImpl: jwksFetcher(jwk, 'k1'), now: NOW,
    })).rejects.toThrow('unexpected_alg');
  });

  it('rejects a wrong issuer', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({
      pair, kid: 'k1', claims: { ...goodClaims, iss: 'https://evil.cloudflareaccess.com' },
    });
    await expect(verifyAccessJwt(token, {
      teamDomain: TEAM, aud: AUD, fetchImpl: jwksFetcher(jwk, 'k1'), now: NOW,
    })).rejects.toThrow('iss_mismatch');
  });

  it('surfaces a JWKS fetch failure', async () => {
    const { pair, jwk } = await makeKeypair();
    const token = await signToken({ pair, kid: 'k1', claims: goodClaims });
    await expect(verifyAccessJwt(token, {
      teamDomain: TEAM, aud: AUD, fetchImpl: jwksFetcher(jwk, 'k1', { status: 503 }), now: NOW,
    })).rejects.toThrow('jwks_fetch_failed_503');
  });

  it('throws AccessError, not a bare Error', async () => {
    await expect(verifyAccessJwt('', { teamDomain: TEAM, aud: AUD, now: NOW }))
      .rejects.toBeInstanceOf(AccessError);
  });
});
