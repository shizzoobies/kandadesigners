// Form parsing. Every write in the app goes through one of these; each returns
// either values ready for db.js or messages keyed by field name, which the page
// shows next to the field. Messages are plain, US English, no em dashes.
import { HOSTING, PROJECT_STATUS } from './enums.js';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const str = (fd, key) => String(fd.get(key) ?? '').trim();
const blankToNull = (v) => (v === '' ? null : v);
const done = (values, errors) => ({ ok: Object.keys(errors).length === 0, values, errors });

function isHttpUrl(v) {
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export function slugify(s) {
  return String(s)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function parseSiteForm(fd) {
  const errors = {};
  const v = {};

  v.name = str(fd, 'name');
  if (!v.name) errors.name = 'Name is required.';
  else if (v.name.length > 80) errors.name = 'Keep the name under 80 characters.';

  v.live_url = str(fd, 'live_url');
  if (!isHttpUrl(v.live_url)) errors.live_url = 'Enter the full address, starting with https://.';

  v.slug = slugify(str(fd, 'slug') || v.name);
  if (!v.slug && !errors.name) errors.name = 'The name needs at least one letter or number.';

  v.repo = blankToNull(str(fd, 'repo'));
  if (v.repo && !/^[\w.-]+\/[\w.-]+$/.test(v.repo)) errors.repo = 'Use owner/name, for example shizzoobies/kandadesigners.';

  v.local_path = blankToNull(str(fd, 'local_path'));

  v.hosting = str(fd, 'hosting') || 'other';
  if (!HOSTING.includes(v.hosting)) errors.hosting = 'Pick a hosting type from the list.';

  v.deploy_command = blankToNull(str(fd, 'deploy_command'));

  const maintainer = str(fd, 'maintainer_id');
  v.maintainer_id = maintainer === '' ? null : Number(maintainer);
  if (v.maintainer_id !== null && !Number.isInteger(v.maintainer_id)) errors.maintainer_id = 'Pick a person from the list.';

  v.domain = blankToNull(str(fd, 'domain').toLowerCase());
  if (v.domain && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v.domain)) errors.domain = 'Enter a bare domain, for example example.com.';

  return done(v, errors);
}

export function parseStatusForm(fd) {
  const errors = {};
  const project_status = str(fd, 'project_status');
  if (!PROJECT_STATUS.includes(project_status)) errors.project_status = 'Pick a status from the list.';
  const status_note = str(fd, 'status_note');
  if (status_note.length > 140) errors.status_note = 'Keep the note under 140 characters.';
  return done({ project_status, status_note }, errors);
}

export function parseA11yForm(fd) {
  const errors = {};
  const a11y_audited_on = blankToNull(str(fd, 'a11y_audited_on'));
  if (a11y_audited_on && !YMD.test(a11y_audited_on)) errors.a11y_audited_on = 'Use a date.';

  const issues = str(fd, 'a11y_open_issues');
  const a11y_open_issues = issues === '' ? null : Number(issues);
  if (a11y_open_issues !== null && !(Number.isInteger(a11y_open_issues) && a11y_open_issues >= 0)) {
    errors.a11y_open_issues = 'Use a whole number, 0 or more.';
  }

  const a11y_statement_url = blankToNull(str(fd, 'a11y_statement_url'));
  if (a11y_statement_url && !isHttpUrl(a11y_statement_url)) {
    errors.a11y_statement_url = 'Enter the full address, starting with https://.';
  }
  return done({ a11y_audited_on, a11y_open_issues, a11y_statement_url }, errors);
}

export function parseText(fd, key, max) {
  const value = str(fd, key);
  if (!value) return { ok: false, error: 'Write something first.' };
  if (value.length > max) return { ok: false, error: `Keep it under ${max} characters.` };
  return { ok: true, value };
}

export const LOGO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' };
export const MAX_LOGO_BYTES = 1024 * 1024;

export function checkLogo(file) {
  if (!file || typeof file === 'string' || file.size === 0) return { ok: true, ext: null };
  const ext = LOGO_TYPES[file.type];
  if (!ext) return { ok: false, error: 'Upload a PNG, JPEG, WebP or SVG.' };
  if (file.size > MAX_LOGO_BYTES) return { ok: false, error: 'Keep the logo under 1 MB.' };
  return { ok: true, ext };
}
