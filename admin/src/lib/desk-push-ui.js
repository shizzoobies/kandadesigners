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
    return { kind: 'on', label: 'On for this device', actions: ['test', 'off'] };
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
