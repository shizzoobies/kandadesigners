(() => {
  // Reuse the existing signup speed bump, not server authentication.
  const query = new URLSearchParams(location.search);
  const existing = document.cookie.match(/(?:^|;\s*)ka_course=([^;]+)/)?.[1];
  window.COURSE_ACCESS = !!existing || query.has('pass');
  if (!window.COURSE_ACCESS) {
    document.documentElement.style.visibility = 'hidden';
    location.replace('/free-course/?next=codex-video');
    return;
  }
  document.cookie = 'ka_course=' + (existing || encodeURIComponent(query.get('pass') || '1')) + '; Max-Age=31536000; Path=/; SameSite=Lax; Secure';
})();
