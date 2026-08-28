// POST /api/coaching — every write for the coaching module: enrollments,
// state of play, milestones, sessions, resources, week-10 marking, and
// portal access. Same shape as api/projects.js: intent dispatch, whitelist
// enums, readFields returning {fields} or {error}, 303 back with ?error=key
// on any failure, and nothing half-written.

import {
  getClient, getMember, createMember, updateMember, updateStateOfPlay,
  updateMilestones, markWeekTenOffered, createSession, createResource,
  deleteResource, grantPortalAccess,
} from '../../lib/db.js';
import { cleanYmd, nowIso, todayInEastern } from '../../lib/format.js';
import { TIERS } from '../../lib/coaching.js';

const STATUSES = ['active', 'completed', 'paused', 'ended'];
const RESOURCE_KINDS = ['recording', 'resource', 'homework'];

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

const safeReturn = (raw) => {
  const s = String(raw ?? '');
  return s.startsWith('/') && !s.startsWith('//') ? s : '/coaching';
};

// Stored-XSS guard, same as api/invoices.js: http(s) URLs only.
const safeUrl = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
};

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = String(form.get('intent') ?? '');
  const returnTo = safeReturn(form.get('returnTo'));
  const back = (error) => seeOther(error ? `${returnTo}${returnTo.includes('?') ? '&' : '?'}error=${error}` : returnTo);
  const now = nowIso();

  // Every intent except create operates on an existing member; resolve it
  // once and trust the row, not the form, for anything derived from it.
  const memberId = Number(form.get('memberId') ?? form.get('id'));
  const member = intent === 'create' ? null : await getMember(db, memberId);
  if (intent !== 'create' && !member) return back('member');

  if (intent === 'create') {
    const clientId = Number(form.get('clientId'));
    const client = clientId ? await getClient(db, clientId) : null;
    if (!client) return back('client');
    const tier = String(form.get('tier') ?? '');
    if (!TIERS.includes(tier)) return back('tier');
    const startedOn = cleanYmd(form.get('startedOn'));
    if (!startedOn) return back('date');
    const id = await createMember(db, { clientId, tier, startedOn, now });
    return seeOther(`/coaching/${id}`);
  }

  if (intent === 'update') {
    const tier = String(form.get('tier') ?? '');
    if (!TIERS.includes(tier)) return back('tier');
    const status = String(form.get('status') ?? '');
    if (!STATUSES.includes(status)) return back('status');
    const startedOn = cleanYmd(form.get('startedOn'));
    if (!startedOn) return back('date');
    await updateMember(db, member.id, { tier, status, startedOn, now });
    return seeOther(`/coaching/${member.id}?saved=1`);
  }

  if (intent === 'state') {
    const body = String(form.get('body') ?? '').trim();
    await updateStateOfPlay(db, member.id, { body, now });
    return seeOther(`/coaching/${member.id}?saved=1`);
  }

  if (intent === 'milestones') {
    // Dates are optional but must parse when present; cleanYmd returns ''
    // for blank, a string when valid, null when unreadable.
    const dates = {};
    for (const key of ['quickWinOn', 'workflowShippedOn', 'ownBuildOn', 'handoffSentOn']) {
      const v = cleanYmd(form.get(key));
      if (v === null) return back('date');
      dates[key] = v || null;
    }
    await updateMilestones(db, member.id, {
      quickWin: String(form.get('quickWin') ?? '').trim(),
      mainWorkflow: String(form.get('mainWorkflow') ?? '').trim(),
      ownBuild: String(form.get('ownBuild') ?? '').trim(),
      ...dates,
      now,
    });
    return seeOther(`/coaching/${member.id}?saved=1`);
  }

  if (intent === 'week10-offered') {
    await markWeekTenOffered(db, member.id, { today: todayInEastern(), now });
    return back();
  }

  if (intent === 'session-add') {
    const heldOn = cleanYmd(form.get('heldOn'));
    if (!heldOn) return back('date');
    const weekRaw = String(form.get('weekNo') ?? '').trim();
    const weekNo = weekRaw === '' ? null : Number(weekRaw);
    if (weekNo !== null && (!Number.isInteger(weekNo) || weekNo < 1 || weekNo > 12)) return back('week');
    await createSession(db, {
      memberId: member.id,
      heldOn,
      weekNo,
      summary: String(form.get('summary') ?? '').trim(),
      nextPlan: String(form.get('nextPlan') ?? '').trim(),
      now,
    });
    return seeOther(`/coaching/${member.id}?saved=1`);
  }

  if (intent === 'resource-add') {
    const label = String(form.get('label') ?? '').trim();
    if (!label) return back('label');
    const url = safeUrl(form.get('url'));
    if (!url) return back('url');
    const kindRaw = String(form.get('kind') ?? 'resource');
    const kind = RESOURCE_KINDS.includes(kindRaw) ? kindRaw : 'resource';
    await createResource(db, { memberId: member.id, label, url, kind, now });
    return seeOther(`/coaching/${member.id}?saved=1`);
  }

  if (intent === 'resource-delete') {
    const rid = Number(form.get('resourceId'));
    if (rid) await deleteResource(db, rid);
    return back();
  }

  if (intent === 'portal-access') {
    // The email defaults to the client record's, but is editable on the form
    // because the login email must match the one Alex puts in the Access
    // policy, and those are not always the same address the invoice goes to.
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) return back('email');
    await grantPortalAccess(db, {
      email,
      name: member.client_name,
      clientId: member.client_id,
      now,
    });
    return seeOther(`/coaching/${member.id}?saved=1`);
  }

  return back('intent');
}
