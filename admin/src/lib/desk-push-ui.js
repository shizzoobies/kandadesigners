// Browser-only pure helpers for the Post Desk notifications control and the
// service-worker click target. Kept separate from desk-push.js / web-push.js so
// the page bundle never pulls in the Worker crypto or D1 cron code.

// UI state for the Notifications control. Pure so the page and tests share it.
export function pushUiState({ supported, standalone, isIOS, permission, subscribed, hasKey }) {
  if (!hasKey) {
    return { kind: 'nokey', label: "Notifications aren't set up yet", actions: [] };
  }
  if (isIOS && !standalone) {
    return {
      kind: 'ios-install',
      label: 'On iPhone, add Post Desk to your Home Screen first (iOS 16.4 or later).',
      actions: [],
    };
  }
  if (!supported) {
    return { kind: 'unsupported', label: "This browser can't take Post Desk notifications.", actions: [] };
  }
  if (permission === 'denied') {
    return {
      kind: 'denied',
      label: 'Notifications are blocked. Turn them on in your phone or browser settings, then reload.',
      actions: [],
    };
  }
  if (subscribed) {
    return { kind: 'on', label: 'On for this device. On iPhone, the Home Screen badge shows only for the installed app with notifications on.', actions: ['test', 'off'] };
  }
  return { kind: 'off', label: 'Get a ping when something new lands on the desk.', actions: ['on'] };
}

// Deep-link / notificationclick URL: same-origin and inside the desk scope, else desk root.
export function clickTarget(url, { origin, scope }) {
  const root = scope.endsWith('/') ? scope.slice(0, -1) : scope;
  const fallback = `${origin}${root}`;
  if (typeof url !== 'string' || !url) return fallback;
  let u;
  try { u = new URL(url, origin); } catch { return fallback; }
  if (u.origin !== origin) return fallback;
  const path = u.pathname.endsWith('/') && u.pathname.length > 1 ? u.pathname.slice(0, -1) : u.pathname;
  if (path !== root && !path.startsWith(`${root}/`)) return fallback;
  return u.href;
}

// Slice 6: the quiet hours / Stories reminder form. Defaults when off: quiet
// 21:00 to 07:30, Stories at 10:00 (all Eastern). prefs is the server's
// { quiet_start, quiet_end, stories_at } for this device.
export const PREF_DEFAULTS = { quiet_start: '21:00', quiet_end: '07:30', stories_at: '10:00' };

export function prefsForm(prefs, { hasStories = false } = {}) {
  const p = prefs || {};
  const quietOn = !!(p.quiet_start && p.quiet_end);
  const storiesOn = hasStories && !!p.stories_at;
  return {
    quietOn,
    quietStart: quietOn ? p.quiet_start : PREF_DEFAULTS.quiet_start,
    quietEnd: quietOn ? p.quiet_end : PREF_DEFAULTS.quiet_end,
    storiesShown: !!hasStories,
    storiesOn,
    storiesAt: storiesOn ? p.stories_at : PREF_DEFAULTS.stories_at,
  };
}

// Form values back into the POST /push 'prefs' fields. A site without
// Stories never sets a reminder.
export function prefsBody(form, { hasStories = false } = {}) {
  return {
    quiet_start: form.quietOn ? form.quietStart || null : null,
    quiet_end: form.quietOn ? form.quietEnd || null : null,
    stories_at: hasStories && form.storiesOn ? form.storiesAt || null : null,
  };
}

// ?view=stories (the Stories reminder's link) means the same as #stories.
// Returns { stories, url } where url is the address with the param stripped.
export function consumeViewParam(href) {
  const u = new URL(href);
  const stories = u.searchParams.get('view') === 'stories';
  if (u.searchParams.has('view')) u.searchParams.delete('view');
  return { stories, url: u.pathname + u.search + u.hash };
}
