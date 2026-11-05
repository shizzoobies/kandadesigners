export const WORKSTREAMS = { 'aec-punch': 'AEC Punch', 'aec-finance': 'AEC Finance' };
export class TimeError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function requireTimeOwner(user) {
  if (user?.role !== 'owner' || !Number.isSafeInteger(user.id)) throw new TimeError('Not authorized.', 403);
}
export function interval(start, end, now = Date.now()) {
  const canonical = (v) => {
    if (typeof v !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)) return false;
    const n = Date.parse(v);
    return Number.isFinite(n) && new Date(n).toISOString() === v;
  };
  if (!canonical(start) || !canonical(end)) throw new TimeError('Use valid UTC start and end times.');
  const seconds = (Date.parse(end) - Date.parse(start)) / 1000;
  if (seconds <= 0 || seconds > 86400) throw new TimeError('End must be after start, within 24 hours.');
  if (Date.parse(end) > now + 60000) throw new TimeError('Time cannot be recorded in the future.');
  return seconds;
}
function stream(value) {
  if (!Object.hasOwn(WORKSTREAMS, value)) throw new TimeError('Choose AEC Punch or AEC Finance.');
  return value;
}
export function validateImport(input, now = Date.now()) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) throw new TimeError('Import 1 to 100 entries at a time.');
  return input.map((r) => {
    if (!r || r.version !== 1 || !/^[a-f0-9]{64}$/.test(r.sourceKey)) throw new TimeError('Invalid Codex activity identifier.');
    const seconds = interval(r.start, r.end, now);
    if (seconds > 14400) throw new TimeError('Codex intervals over four hours need a manual entry.');
    return { sourceKey: r.sourceKey, workstream: stream(r.workstream), start: r.start, end: r.end };
  });
}
export async function importTime(db, user, input, now = new Date().toISOString()) {
  requireTimeOwner(user);
  const rows = validateImport(input, Date.parse(now));
  const results = await db.batch(rows.map((r) => db.prepare(`INSERT INTO time_entries
    (user_id,workstream,source,source_key,observed_start,observed_end,started_at,ended_at,description,created_at,updated_at)
    VALUES (?,?,'codex',?,?,?,?,?,'Codex activity; review your actual working time.',?,?)
    ON CONFLICT(user_id,source,source_key) DO NOTHING`).bind(
    user.id,r.workstream,r.sourceKey,r.start,r.end,r.start,r.end,now,now)));
  return results.reduce((n, r) => n + (r.meta?.changes ?? 0), 0);
}
export function utcInput(value) {
  const s = String(value ?? '');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{3})?)?$/.test(s)) throw new TimeError('Enter a start and end date and time in UTC.');
  return s.length === 16 ? `${s}:00.000Z` : s.length === 19 ? `${s}.000Z` : `${s}Z`;
}
export async function saveTime(db, user, form, now = new Date().toISOString()) {
  requireTimeOwner(user);
  const intent = form.get('intent');
  const id = Number(form.get('id'));
  const revision = Number(form.get('revision'));
  if (intent !== 'create' && (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(revision) || revision < 1)) throw new TimeError('Invalid entry.');
  if (intent === 'exclude') {
    const r = await db.prepare(`UPDATE time_entries SET status='excluded',billable=0,revision=revision+1,updated_at=? WHERE id=? AND user_id=? AND revision=?`).bind(now,id,user.id,revision).run();
    if (!r.meta.changes) throw new TimeError('This entry changed. Reload before editing.',409);
    return;
  }
  if (!['create','save','approve'].includes(intent)) throw new TimeError('Unknown action.');
  const workstream = stream(String(form.get('workstream')));
  const start = utcInput(form.get('start'));
  const end = utcInput(form.get('end'));
  interval(start,end,Date.parse(now));
  const description = String(form.get('description') ?? '').trim();
  if (!description || description.length > 1000) throw new TimeError('Describe the work in 1 to 1,000 characters.');
  const siteId = form.get('siteId') ? Number(form.get('siteId')) : null;
  if (siteId !== null && (!Number.isSafeInteger(siteId) || siteId < 1 || !await db.prepare('SELECT id FROM sites WHERE id=?').bind(siteId).first())) throw new TimeError('Choose an available site.');
  const status = intent === 'approve' ? 'approved' : 'pending';
  const billable = status === 'approved' && form.get('billable') === 'on' ? 1 : 0;
  try {
    if (intent === 'create') {
      await db.prepare(`INSERT INTO time_entries (user_id,workstream,site_id,source,source_key,observed_start,observed_end,started_at,ended_at,description,created_at,updated_at)
        VALUES (?,?,?,'manual',?,?,?,?,?,?,?,?)`).bind(user.id,workstream,siteId,crypto.randomUUID(),start,end,start,end,description,now,now).run();
    } else {
      const r = await db.prepare(`UPDATE time_entries SET workstream=?,site_id=?,started_at=?,ended_at=?,description=?,status=?,billable=?,revision=revision+1,updated_at=?
        WHERE id=? AND user_id=? AND revision=?`).bind(workstream,siteId,start,end,description,status,billable,now,id,user.id,revision).run();
      if (!r.meta.changes) throw new TimeError('This entry changed. Reload before editing.',409);
    }
  } catch (e) {
    if (String(e.message).includes('time_overlap')) throw new TimeError('This overlaps approved time. Adjust the times or exclude the duplicate before approving.',409);
    throw e;
  }
}
export async function listTime(db, user, page = 1) {
  requireTimeOwner(user);
  if (!Number.isSafeInteger(page) || page<1 || page>100000) throw new TimeError('Invalid page.');
  const { results } = await db.prepare(`SELECT t.*,p.name AS site_name,
    EXISTS(SELECT 1 FROM time_entries other WHERE other.user_id=t.user_id AND other.id!=t.id
      AND other.status!='excluded' AND other.started_at<t.ended_at AND other.ended_at>t.started_at) AS has_overlap
    FROM time_entries t LEFT JOIN sites p ON p.id=t.site_id
    WHERE t.user_id=? ORDER BY t.started_at DESC,t.id DESC LIMIT 101 OFFSET ?`).bind(user.id,(page-1)*100).all();
  return results ?? [];
}
export async function timeTotals(db,user) {
  requireTimeOwner(user);
  const {results}=await db.prepare(`SELECT workstream,
    SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN status='approved' THEN (julianday(ended_at)-julianday(started_at))*86400 ELSE 0 END) AS seconds,
    SUM(CASE WHEN status='approved' AND billable=1 THEN (julianday(ended_at)-julianday(started_at))*86400 ELSE 0 END) AS billable
    FROM time_entries WHERE user_id=? GROUP BY workstream`).bind(user.id).all();
  return Object.fromEntries(Object.keys(WORKSTREAMS).map(key=>{
    const r=results.find(r=>r.workstream===key);
    return [key,r?{pending:r.pending,seconds:Math.round(r.seconds*1000)/1000,billable:Math.round(r.billable*1000)/1000}:{pending:0,seconds:0,billable:0}];
  }));
}
export function summary(rows) {
  return Object.fromEntries(Object.keys(WORKSTREAMS).map((key) => [key, rows.filter((r) => r.workstream === key).reduce((a,r) => {
    if (r.status === 'pending') a.pending++;
    if (r.status === 'approved') {
      const seconds = (Date.parse(r.ended_at) - Date.parse(r.started_at))/1000;
      a.seconds += seconds;
      if (r.billable) a.billable += seconds;
    }
    return a;
  }, {seconds:0,billable:0,pending:0})]));
}
export const hours = (seconds) => (seconds/3600).toFixed(2);
export function overlaps(row, rows) {
  return rows.some((r) => r.id !== row.id && r.status !== 'excluded' && r.started_at < row.ended_at && r.ended_at > row.started_at);
}
export function csv(rows) {
  const cell = (value) => `"${String(value ?? '').replace(/^(?:\s*[=+@\-]|[\t\r\n])/, (s) => `'${s}`).replaceAll('"','""')}"`;
  const fields = ['Work','Linked site','Start UTC','End UTC','Seconds','Hours','Billable','Description','Source','Observed start UTC','Observed end UTC'];
  return [fields,...rows.filter((r)=>r.status==='approved').map((r)=>[
    WORKSTREAMS[r.workstream],r.site_name,r.started_at,r.ended_at,(Date.parse(r.ended_at)-Date.parse(r.started_at))/1000,
    hours((Date.parse(r.ended_at)-Date.parse(r.started_at))/1000),r.billable?'Yes':'No',r.description,r.source,r.observed_start,r.observed_end,
  ])].map((r)=>r.map(cell).join(',')).join('\r\n');
}
