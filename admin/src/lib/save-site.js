// Create or edit a site from the add/edit form, logo included. Validates
// everything before writing anything, so a bad logo never leaves a half-saved site.
import { parseSiteForm, checkLogo } from './validate.js';
import { createSite, updateSite, getSiteBySlug, setSiteLogo } from './db.js';
import { storeLogo } from './logo.js';

export async function saveSite({ db, bucket, form, existing, nowMs = Date.now() }) {
  const parsed = parseSiteForm(form);
  const errors = { ...parsed.errors };
  const file = form.get('logo');
  const logo = checkLogo(file);
  if (!logo.ok) errors.logo = logo.error;

  if (!errors.name) {
    const clash = await getSiteBySlug(db, parsed.values.slug);
    if (clash && clash.id !== existing?.id) errors.name = 'A site with that name already exists.';
  }
  if (Object.keys(errors).length) return { ok: false, values: parsed.values, errors };

  const nowIso = new Date(nowMs).toISOString();
  let id = existing?.id;
  if (existing) await updateSite(db, id, parsed.values, nowIso);
  else id = await createSite(db, parsed.values, nowIso);

  if (logo.ext) {
    const key = await storeLogo(bucket, parsed.values.slug, file, logo.ext);
    await setSiteLogo(db, id, key, nowIso);
  }
  return { ok: true, slug: parsed.values.slug };
}
