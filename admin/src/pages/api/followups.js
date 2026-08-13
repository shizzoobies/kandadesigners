import {
  createFollowup, setFollowupDone, reopenFollowup, deleteFollowup, getProject,
} from '../../lib/db.js';
import { nowIso, cleanYmd } from '../../lib/format.js';

const seeOther = (location) => new Response(null, { status: 303, headers: { Location: location } });

function safeReturn(raw, fallback) {
  const value = String(raw ?? '');
  return value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}

export async function POST({ request, locals }) {
  const db = locals.runtime.env.DB;
  const form = await request.formData();
  const intent = form.get('intent');
  const back = safeReturn(form.get('returnTo'), '/followups');

  if (intent === 'done' || intent === 'reopen' || intent === 'delete') {
    const id = Number(form.get('id'));
    if (!Number.isInteger(id) || id <= 0) return seeOther(`${back}?error=id`);
    if (intent === 'done') await setFollowupDone(db, id, nowIso());
    if (intent === 'reopen') await reopenFollowup(db, id);
    if (intent === 'delete') await deleteFollowup(db, id);
    return seeOther(back);
  }

  if (intent === 'create') {
    const title = String(form.get('title') ?? '').trim();
    if (!title) return seeOther(`${back}?error=title`);

    const dueOn = cleanYmd(form.get('dueOn'));
    if (dueOn === null) return seeOther(`${back}?error=date`);

    // As with invoices, a project decides the client rather than the form, so a
    // follow-up cannot be filed against mismatched pair.
    const rawProject = Number(form.get('projectId'));
    let projectId = Number.isInteger(rawProject) && rawProject > 0 ? rawProject : null;
    const rawClient = Number(form.get('clientId'));
    let clientId = Number.isInteger(rawClient) && rawClient > 0 ? rawClient : null;

    if (projectId !== null) {
      const project = await getProject(db, projectId);
      if (!project) return seeOther(`${back}?error=project`);
      clientId = project.client_id;
    }

    await createFollowup(db, {
      title,
      detail: String(form.get('detail') ?? '').trim(),
      clientId,
      projectId,
      dueOn,
      createdAt: nowIso(),
    });
    return seeOther(back);
  }

  return seeOther(`${back}?error=intent`);
}
