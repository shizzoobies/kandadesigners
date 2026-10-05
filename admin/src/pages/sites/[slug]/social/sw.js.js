// Service worker for Post Desk push. Served at /sites/<slug>/social/sw.js.
// Handles only push, notificationclick and pushsubscriptionchange — no fetch
// handler and no caching (slice 1's no-offline decision; nothing between the
// page and Access).
import { getSiteBySlug } from '../../../../lib/db.js';

function swSource(slug) {
  const scope = `/sites/${slug}/social`;
  return `/* Post Desk push SW for ${slug}. No fetch handler. */
const SCOPE = ${JSON.stringify(scope)};
const PUSH_URL = SCOPE + '/push';

function deskRoot() {
  return self.location.origin + SCOPE;
}

function safeUrl(url) {
  try {
    const u = new URL(url, self.location.origin);
    if (u.origin !== self.location.origin) return deskRoot();
    const path = u.pathname.endsWith('/') && u.pathname.length > 1 ? u.pathname.slice(0, -1) : u.pathname;
    if (path !== SCOPE && !path.startsWith(SCOPE + '/')) return deskRoot();
    return u.href;
  } catch (e) {
    return deskRoot();
  }
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let data = null;
    try {
      if (event.data) data = event.data.json();
    } catch (e) {
      data = null;
    }
    const ok = data && typeof data === 'object' && (data.title || data.body);
    const title = ok && data.title ? String(data.title) : 'Post Desk';
    const body = ok
      ? String(data.body || "something's waiting on you")
      : "Post Desk: something's waiting on you";
    const tag = (ok && data.tag) ? String(data.tag) : ('desk-' + ${JSON.stringify(slug)});
    const url = (ok && data.url) ? String(data.url) : SCOPE;
    await self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
      renotify: true,
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification && event.notification.data && event.notification.data.url) || SCOPE;
  const target = safeUrl(raw);
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      try {
        const cUrl = new URL(client.url);
        const path = cUrl.pathname.endsWith('/') && cUrl.pathname.length > 1 ? cUrl.pathname.slice(0, -1) : cUrl.pathname;
        if (cUrl.origin === self.location.origin && (path === SCOPE || path.startsWith(SCOPE + '/'))) {
          await client.focus();
          let item = null;
          try { item = new URL(target).searchParams.get('item'); } catch (e) {}
          client.postMessage({ type: 'desk-open', item, url: target });
          return;
        }
      } catch (e) {}
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const old = event.oldSubscription;
      const key = old && old.options && old.options.applicationServerKey;
      const sub = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      await fetch(PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'subscribe', subscription: sub.toJSON() }),
      });
    } catch (e) {
      // Silent: the next page visit re-syncs.
    }
  })());
});
`;
}

export async function GET({ params, locals }) {
  const env = locals.runtime.env;
  const site = await getSiteBySlug(env.DB, params.slug);
  if (!site) return new Response('Not found', { status: 404 });

  return new Response(swSource(site.slug), {
    status: 200,
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
