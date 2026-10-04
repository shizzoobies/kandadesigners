// Preferences are a user choice, not authentication. Unknown versions fail closed.
export function hasConsent(request, category) {
  // A current browser denial also overrides a stale cookie when cookie writes fail.
  const current = request.headers.get('X-KA-Privacy');
  const value = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)ka_privacy=([^;]*)/)?.[1];
  const match = /^v1\.a([01])\.m([01])$/.exec(value || '');
  const override = current === null ? match : /^v1\.a([01])\.m([01])$/.exec(current);
  if (!match || !override) return false;
  return category === 'analytics' ? match[1] === '1' && override[1] === '1'
    : category === 'marketing' && match[2] === '1' && override[2] === '1';
}
