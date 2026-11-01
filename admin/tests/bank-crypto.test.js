import { describe, it, expect } from 'vitest';
import { seal, open } from '../src/lib/bank-crypto.js';

const key = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
const TOKEN = 'access-sandbox-12345678-aaaa-bbbb-cccc-1234567890ab';

describe('bank-crypto', () => {
  it('seal then open round-trips, and the sealed form hides the token', async () => {
    const k = key();
    const sealed = await seal(k, TOKEN);
    expect(sealed).not.toContain(TOKEN);
    expect(atob(sealed).length).toBe(12 + TOKEN.length + 16);
    expect(await open(k, sealed)).toBe(TOKEN);
  });

  it('uses a fresh IV each time', async () => {
    const k = key();
    expect(await seal(k, TOKEN)).not.toBe(await seal(k, TOKEN));
  });

  it('fails with a wrong key or a changed byte', async () => {
    const k = key();
    const sealed = await seal(k, TOKEN);
    await expect(open(key(), sealed)).rejects.toThrow('could not be opened');
    const bytes = Uint8Array.from(atob(sealed), (c) => c.charCodeAt(0));
    bytes[bytes.length - 1] ^= 1;
    await expect(open(k, btoa(String.fromCharCode(...bytes)))).rejects.toThrow('could not be opened');
  });

  it('refuses a key that is not 32 bytes', async () => {
    await expect(seal(btoa('short'), TOKEN)).rejects.toThrow('32 bytes');
    await expect(seal(undefined, TOKEN)).rejects.toThrow();
  });
});
