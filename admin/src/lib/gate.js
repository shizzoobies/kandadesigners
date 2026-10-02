// Who may open which route. The middleware asks gateRequest after the Access
// check and the people lookup; desk writes ask canWriteDesk. Owners pass as
// they always have. A client passes only for "/", the desks granted to them
// (every sub-route included) and those sites' logos. Everything else is 403,
// and another site's desk is 404 so a client cannot learn which slugs exist.
// Any role this file does not know is denied outright.

const ALLOW = { allow: true };
const deny = (status) => ({ allow: false, status });
const SLUG = /^[a-z0-9-]+$/;

// Splits and decodes the path one segment at a time. Anything that could be
// read two ways (dot segments, an encoded slash or backslash, an empty
// segment, bad percent-encoding) is not a client route at all. One trailing
// slash is fine: the app ignores it.
export function matchClientRoute(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return null;
  if (pathname === '/') return { kind: 'home' };
  const raw = pathname.slice(1).split('/');
  if (raw[raw.length - 1] === '') raw.pop();
  const parts = [];
  for (const p of raw) {
    let d;
    try {
      d = decodeURIComponent(p);
    } catch {
      return null;
    }
    if (d === '' || d === '.' || d === '..' || /[/\\]/.test(d) || /[\u0000-\u001f]/.test(d)) return null;
    parts.push(d);
  }

  if (parts[0] === 'sites' && parts.length >= 3 && parts[2] === 'social') {
    return { kind: 'desk', slug: SLUG.test(parts[1]) ? parts[1] : null };
  }
  if (parts[0] === 'logos' && parts.length === 3) return { kind: 'logo', key: `${parts[1]}/${parts[2]}` };
  return null;
}

export function gateRequest(user, pathname) {
  if (user?.role === 'owner') return ALLOW;
  if (user?.role !== 'client') return deny(403);
  const route = matchClientRoute(pathname);
  if (!route) return deny(403);
  const grants = user.grants ?? [];
  if (route.kind === 'home') return ALLOW;
  if (route.kind === 'desk') return route.slug && grants.some((g) => g.slug === route.slug) ? ALLOW : deny(404);
  if (route.kind === 'logo') return grants.some((g) => g.logo_key === route.key || g.favicon_key === route.key) ? ALLOW : deny(403);
  return deny(403);
}

// One JSON line for Workers logs when the gate turns someone away: the person
// id, role, status and path (capped). Never an email.
export function denialLog(user, gate, pathname) {
  return JSON.stringify({
    event: 'gate.deny', person: user?.id ?? null, role: user?.role ?? null, status: gate.status, path: String(pathname).slice(0, 200),
  });
}

// Approve, request changes, undo, answer questions and tick Stories: an owner
// anywhere, a client only on a desk granted to them at the approve level.
export function canWriteDesk(user, siteId) {
  if (user?.role === 'owner') return true;
  if (user?.role !== 'client') return false;
  return (user.grants ?? []).some((g) => g.site_id === siteId && g.level === 'approve');
}
