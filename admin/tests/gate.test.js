import { describe, it, expect } from 'vitest';
import { matchClientRoute, gateRequest, canWriteDesk, denialLog } from '../src/lib/gate.js';

const GRANTS = [
  { site_id: 5, slug: 'foremotion-golf', name: 'Fore Motion Golf', level: 'approve', logo_key: 'logos/foremotion-golf-ab12cd34.png', favicon_key: 'favicons/foremotion-golf.png' },
  { site_id: 7, slug: 'davids-bbq', name: "David's BBQ", level: 'view', logo_key: null, favicon_key: null },
];
const OWNER = { id: 1, role: 'owner', grants: [] };
const CLIENT = { id: 2, role: 'client', grants: GRANTS };
const NOBODY = { id: 3, role: 'client', grants: [] };
const OTHER_ROLE = { id: 4, role: 'viewer', grants: GRANTS };

describe('matchClientRoute', () => {
  it('matches the home page', () => {
    expect(matchClientRoute('/')).toEqual({ kind: 'home' });
  });

  it('matches a desk and every desk sub-route, with or without a trailing slash', () => {
    for (const p of ['/sites/foremotion-golf/social', '/sites/foremotion-golf/social/', '/sites/foremotion-golf/social/state',
      '/sites/foremotion-golf/social/decide', '/sites/foremotion-golf/social/check',
      '/sites/foremotion-golf/social/media/2026-10-06/reel.mp4']) {
      expect(matchClientRoute(p)).toMatchObject({ kind: 'desk', slug: 'foremotion-golf' });
    }
  });

  it('decodes an encoded slug before comparing it', () => {
    expect(matchClientRoute('/sites/foremotion%2Dgolf/social')).toMatchObject({ kind: 'desk', slug: 'foremotion-golf' });
  });

  it('matches a logo key', () => {
    expect(matchClientRoute('/logos/logos/foremotion-golf-ab12cd34.png')).toEqual({ kind: 'logo', key: 'logos/foremotion-golf-ab12cd34.png' });
  });

  it('refuses dot segments, encoded slashes, empty segments and bad encoding', () => {
    for (const p of ['/sites/foremotion-golf/social/../../davids-bbq/social', '/sites/../sites/foremotion-golf/social',
      '/sites/foremotion-golf/social/%2e%2e/x', '/sites/foremotion-golf%2Fsocial', '/sites/foremotion-golf/social%2F..%2Fedit',
      '/sites//foremotion-golf/social', '/sites/foremotion-golf/social//', '/sites/%E0%A4%A/social', '//', '',
      '/sites/foremotion-golf%5Csocial', 'sites/foremotion-golf/social']) {
      const r = matchClientRoute(p);
      expect(r === null || (r.kind === 'desk' && r.slug === null), p).toBe(true);
    }
  });

  it('does not treat other admin routes as client routes', () => {
    for (const p of ['/sites/foremotion-golf', '/sites/foremotion-golf/', '/sites/foremotion-golf/edit', '/sites/foremotion-golf/status',
      '/sites/new', '/people', '/people/2', '/people/sync', '/sites', '/SITES/foremotion-golf/social', '/sites/foremotion-golf/Social',
      '/logos', '/logos/logos', '/logos/a/b/c', '/index', '/x']) {
      expect(matchClientRoute(p), p).toBeNull();
    }
  });
});

describe('gateRequest', () => {
  it('lets an owner through everywhere, as today', () => {
    for (const p of ['/', '/sites/new', '/sites/davids-bbq', '/people', '/sites/anything/social/decide', '/logos/logos/x.png']) {
      expect(gateRequest(OWNER, p)).toEqual({ allow: true });
    }
  });

  it('lets a client reach home, their own desks and sub-routes', () => {
    for (const p of ['/', '/sites/foremotion-golf/social', '/sites/foremotion-golf/social/', '/sites/foremotion-golf/social/state',
      '/sites/foremotion-golf/social/decide', '/sites/foremotion-golf/social/check', '/sites/foremotion-golf/social/media/a/b.png',
      '/sites/davids-bbq/social', '/sites/foremotion%2Dgolf/social']) {
      expect(gateRequest(CLIENT, p), p).toEqual({ allow: true });
    }
  });

  it('404s another site\'s desk, so slugs do not leak', () => {
    for (const p of ['/sites/ka-performance/social', '/sites/ka-performance/social/state', '/sites/ka-performance/social/decide',
      '/sites/ka-performance/social/media/a/b.png', '/sites/no-such-site/social', '/sites/Foremotion-Golf/social']) {
      expect(gateRequest(CLIENT, p), p).toEqual({ allow: false, status: 404 });
    }
  });

  it('403s everything else for a client, their own site pages included', () => {
    for (const p of ['/sites/new', '/sites/foremotion-golf', '/sites/foremotion-golf/edit', '/sites/foremotion-golf/status',
      '/sites/foremotion-golf/work', '/people', '/people/1', '/people/1/remove', '/people/sync', '/sites/foremotion-golf/social/../edit',
      '/sites/foremotion-golf/social//', '/anything', '/sites/foremotion-golf%2Fsocial%2F..%2F..%2Fka-performance/social']) {
      expect(gateRequest(CLIENT, p), p).toEqual({ allow: false, status: 403 });
    }
  });

  it('serves a client only the logos of their granted sites', () => {
    expect(gateRequest(CLIENT, '/logos/logos/foremotion-golf-ab12cd34.png')).toEqual({ allow: true });
    expect(gateRequest(CLIENT, '/logos/favicons/foremotion-golf.png')).toEqual({ allow: true });
    expect(gateRequest(CLIENT, '/logos/logos/ka-performance-11223344.png')).toEqual({ allow: false, status: 403 });
    expect(gateRequest(CLIENT, '/logos/favicons/davids-bbq.png')).toEqual({ allow: false, status: 403 });
  });

  it('serves the desk manifest only on desks the user may open', () => {
    expect(gateRequest(CLIENT, '/sites/foremotion-golf/social/manifest.webmanifest')).toEqual({ allow: true });
    expect(gateRequest(CLIENT, '/sites/ka-performance/social/manifest.webmanifest')).toEqual({ allow: false, status: 404 });
    expect(gateRequest(OWNER, '/sites/ka-performance/social/manifest.webmanifest')).toEqual({ allow: true });
    expect(gateRequest(NOBODY, '/sites/foremotion-golf/social/manifest.webmanifest')).toEqual({ allow: false, status: 404 });
  });

  it('gives a client with no desks the home page only', () => {
    expect(gateRequest(NOBODY, '/')).toEqual({ allow: true });
    expect(gateRequest(NOBODY, '/sites/foremotion-golf/social')).toEqual({ allow: false, status: 404 });
    expect(gateRequest({ id: 9, role: 'client' }, '/sites/foremotion-golf/social')).toEqual({ allow: false, status: 404 });
  });

  it('denies any role it does not know, and no user at all', () => {
    expect(gateRequest(OTHER_ROLE, '/')).toEqual({ allow: false, status: 403 });
    expect(gateRequest(OTHER_ROLE, '/sites/foremotion-golf/social')).toEqual({ allow: false, status: 403 });
    expect(gateRequest(null, '/')).toEqual({ allow: false, status: 403 });
  });
});

describe('denialLog', () => {
  it('describes a client denial with person id, status and path, and no email', () => {
    const line = denialLog({ ...CLIENT, email: 'h@x.com' }, { allow: false, status: 404 }, '/sites/ka-performance/social');
    expect(JSON.parse(line)).toEqual({ event: 'gate.deny', person: 2, role: 'client', status: 404, path: '/sites/ka-performance/social' });
    expect(line).not.toMatch(/@/);
  });

  it('caps a long path', () => {
    expect(JSON.parse(denialLog(CLIENT, { allow: false, status: 403 }, `/${'a'.repeat(500)}`)).path).toHaveLength(200);
  });
});

describe('canWriteDesk', () => {
  it('lets an owner write on any desk', () => {
    expect(canWriteDesk(OWNER, 5)).toBe(true);
    expect(canWriteDesk(OWNER, 99)).toBe(true);
  });

  it('lets a client write only where their grant is approve', () => {
    expect(canWriteDesk(CLIENT, 5)).toBe(true);
    expect(canWriteDesk(CLIENT, 7)).toBe(false);
    expect(canWriteDesk(CLIENT, 1)).toBe(false);
    expect(canWriteDesk(NOBODY, 5)).toBe(false);
  });

  it('refuses unknown roles and missing users', () => {
    expect(canWriteDesk(OTHER_ROLE, 5)).toBe(false);
    expect(canWriteDesk(null, 5)).toBe(false);
    expect(canWriteDesk(undefined, 5)).toBe(false);
  });
});
