import { describe, it, expect } from 'vitest';
import { resolveEmail } from '../src/lib/identity.js';

const PROD_ENV = {
  ACCESS_TEAM_DOMAIN: 'kandaperformance.cloudflareaccess.com',
  ACCESS_AUD: 'aud-tag-for-tests',
};
const DEV_ENV = {
  ...PROD_ENV,
  ENVIRONMENT: 'development',
  DEV_EMAIL: 'alex@ka-performancefl.com',
};

const req = (headers = {}) => new Request('https://admin.ka-performancefl.com/', { headers });
const okVerify = async () => ({ email: 'alex@ka-performancefl.com', payload: {} });
const failVerify = async () => { throw new Error('bad_signature'); };

describe('resolveEmail', () => {
  it('resolves from the Cf-Access-Jwt-Assertion header', async () => {
    const result = await resolveEmail({
      request: req({ 'Cf-Access-Jwt-Assertion': 'a.b.c' }), env: PROD_ENV, verify: okVerify,
    });
    expect(result).toEqual({ email: 'alex@ka-performancefl.com', source: 'access' });
  });

  it('falls back to the CF_Authorization cookie', async () => {
    const result = await resolveEmail({
      request: req({ cookie: 'other=1; CF_Authorization=a.b.c; more=2' }),
      env: PROD_ENV,
      verify: okVerify,
    });
    expect(result).toEqual({ email: 'alex@ka-performancefl.com', source: 'access' });
  });

  it('returns null in production when there is no token', async () => {
    const result = await resolveEmail({ request: req(), env: PROD_ENV, verify: okVerify });
    expect(result).toBeNull();
  });

  it('returns null in production when the token does not verify', async () => {
    const result = await resolveEmail({
      request: req({ 'Cf-Access-Jwt-Assertion': 'a.b.c' }), env: PROD_ENV, verify: failVerify,
    });
    expect(result).toBeNull();
  });

  // The tests that matter. The bypass must be impossible without the dev var.
  it('does NOT fall back to DEV_EMAIL when ENVIRONMENT is absent', async () => {
    const result = await resolveEmail({
      request: req(),
      env: { ...PROD_ENV, DEV_EMAIL: 'alex@ka-performancefl.com' },
      verify: okVerify,
    });
    expect(result).toBeNull();
  });

  it('does NOT fall back when ENVIRONMENT is anything other than development', async () => {
    for (const value of ['production', 'dev', 'Development', 'true', '1', '']) {
      const result = await resolveEmail({
        request: req(),
        env: { ...PROD_ENV, ENVIRONMENT: value, DEV_EMAIL: 'alex@ka-performancefl.com' },
        verify: okVerify,
      });
      expect(result, `ENVIRONMENT=${JSON.stringify(value)} must not bypass`).toBeNull();
    }
  });

  it('does NOT bypass in development when DEV_EMAIL is missing', async () => {
    const result = await resolveEmail({
      request: req(), env: { ...PROD_ENV, ENVIRONMENT: 'development' }, verify: okVerify,
    });
    expect(result).toBeNull();
  });

  // A present but invalid token must never degrade into the dev identity.
  it('does NOT fall back to the dev bypass when a token is present but invalid', async () => {
    const result = await resolveEmail({
      request: req({ 'Cf-Access-Jwt-Assertion': 'a.b.c' }), env: DEV_ENV, verify: failVerify,
    });
    expect(result).toBeNull();
  });

  it('uses DEV_EMAIL only when ENVIRONMENT is exactly development', async () => {
    const result = await resolveEmail({ request: req(), env: DEV_ENV, verify: okVerify });
    expect(result).toEqual({ email: 'alex@ka-performancefl.com', source: 'dev' });
  });

  it('prefers a real Access token over the dev bypass', async () => {
    const result = await resolveEmail({
      request: req({ 'Cf-Access-Jwt-Assertion': 'a.b.c' }), env: DEV_ENV, verify: okVerify,
    });
    expect(result.source).toBe('access');
  });

  it('lowercases the dev email', async () => {
    const result = await resolveEmail({
      request: req(),
      env: { ...DEV_ENV, DEV_EMAIL: 'Alex@KA-PerformanceFL.com' },
      verify: okVerify,
    });
    expect(result.email).toBe('alex@ka-performancefl.com');
  });

  it('ignores a cookie that merely contains CF_Authorization as a substring', async () => {
    const result = await resolveEmail({
      request: req({ cookie: 'NOT_CF_Authorization=a.b.c' }), env: PROD_ENV, verify: okVerify,
    });
    expect(result).toBeNull();
  });
});
