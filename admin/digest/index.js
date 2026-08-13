// The daily digest Worker for the K & A admin.
//
// Deliberately a separate Worker from ka-admin: the Astro adapter generates that
// Worker's entry point, so bolting a scheduled handler onto it would mean wrapping
// generated code that changes between adapter versions. Splitting also means a bug
// in the digest cannot take down the admin UI, or the reverse.
//
// It shares the rules by importing lib/dashboard.js directly, so the email and the
// screen are built from the same board. That was the point of making that module
// free of Astro and D1-binding assumptions.

import { getDashboard } from '../src/lib/dashboard.js';
import { todayInEastern } from '../src/lib/format.js';
import { renderDigest, shouldSend } from './render.js';

const DEFAULT_HOUR = 7;

// Cron is "0 11,12 * * *" because 7am Eastern is 11:00 UTC in summer (EDT, UTC-4)
// and 12:00 UTC in winter (EST, UTC-5). Both fire; this guard discards the wrong
// one. A single UTC cron would drift by an hour at each daylight saving change.
function easternHour(nowMs) {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hourCycle: 'h23',
  }).format(new Date(nowMs));
  return Number(formatted);
}

// Compares digests rather than the raw strings, so comparison time does not vary
// with how much of the secret matched.
async function secretMatches(supplied, expected) {
  if (!expected || !supplied) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(supplied)),
    crypto.subtle.digest('SHA-256', enc.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i += 1) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function buildDigest(env) {
  const today = todayInEastern();
  const board = await getDashboard(env.DB, today);
  const adminUrl = env.ADMIN_URL ?? 'https://admin.ka-performancefl.com';
  return { today, board, adminUrl, ...renderDigest(board, adminUrl) };
}

async function sendDigest(env) {
  const { today, board, subject, html, text } = await buildDigest(env);

  if (!shouldSend(board)) {
    console.log(`digest ${today}: nothing has arrived, sending nothing`);
    return { sent: false, reason: 'quiet', today };
  }
  if (!env.EMAIL) {
    console.log(`digest ${today}: EMAIL binding missing, cannot send`);
    return { sent: false, reason: 'no-email-binding', today };
  }

  // Caught rather than thrown, so the expected failure before the sending domain
  // is onboarded reads as a clear message in the logs instead of a stack trace
  // that looks like the Worker is broken. The digest not sending is a nuisance,
  // never an incident.
  try {
    const result = await env.EMAIL.send({
      to: env.DIGEST_TO,
      from: env.DIGEST_FROM,
      subject,
      html,
      text,
    });
    console.log(`digest ${today}: sent to ${env.DIGEST_TO}, ${board.stream.length} items`);
    return { sent: true, today, items: board.stream.length, messageId: result?.messageId ?? null };
  } catch (err) {
    console.log(
      `digest ${today}: send FAILED for ${env.DIGEST_FROM} to ${env.DIGEST_TO}: ${err?.message ?? err}. `
      + 'If the sending domain is not onboarded for Email Sending yet, this is expected.'
    );
    return { sent: false, reason: 'send-failed', error: String(err?.message ?? err), today };
  }
}

export default {
  async scheduled(controller, env) {
    const wanted = Number(env.DIGEST_HOUR ?? DEFAULT_HOUR);
    const hour = easternHour(controller.scheduledTime ?? Date.now());
    if (hour !== wanted) {
      console.log(`digest: ${hour}:00 Eastern is not ${wanted}:00, skipping this firing`);
      return;
    }
    await sendDigest(env);
  },

  // Manual trigger, so the digest can be previewed and tested without waiting for
  // 7am, and so "send it to me now" is possible. Gated on a secret because this
  // both discloses financial data and sends mail. An unauthenticated request gets
  // 404 rather than 401, so the endpoint does not confirm it exists.
  async fetch(request, env) {
    const url = new URL(request.url);
    const supplied = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');

    if (!(await secretMatches(supplied, env.DIGEST_TRIGGER_SECRET))) {
      return new Response('Not found', { status: 404 });
    }

    if (url.searchParams.get('preview') === '1') {
      const { html, subject, board } = await buildDigest(env);
      return new Response(
        `<!-- subject: ${subject} | would send: ${shouldSend(board)} -->\n${html}`,
        { headers: { 'content-type': 'text/html; charset=utf-8' } }
      );
    }

    const outcome = await sendDigest(env);
    return new Response(JSON.stringify(outcome, null, 1), {
      headers: { 'content-type': 'application/json' },
    });
  },
};
