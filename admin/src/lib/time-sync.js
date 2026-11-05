import { createHash, timingSafeEqual } from 'node:crypto';
import { TimeError } from './time.js';

// Dedicated write-only credential. It cannot approve time or read the admin.
export async function authorizeTimeSync(request, env) {
  if (request.method !== 'POST' || request.headers.has('origin')) return null;
  const expected = env.TIME_SYNC_TOKEN;
  const id = Number(env.TIME_SYNC_USER_ID);
  if (typeof expected !== 'string' || expected.length < 32 || !Number.isSafeInteger(id) || id < 1) return null;
  const provided = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/)?.[1] ?? '';
  const hash = (s) => createHash('sha256').update(s).digest();
  if (!timingSafeEqual(hash(provided),hash(expected))) return null;
  return env.DB.prepare("SELECT id,role FROM people WHERE id=? AND role='owner'").bind(id).first();
}
export async function readLimited(request, limit = 65536) {
  if (!request.body) throw new TimeError('A request body is required.');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new TimeError('Import is too large. Use at most 64 KB.',413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const all = new Uint8Array(size);
  let offset=0;
  for (const c of chunks) {all.set(c,offset);offset+=c.length;}
  return new TextDecoder().decode(all);
}
