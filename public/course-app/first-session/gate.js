(() => {
  // Preserve the existing email-signup speed bump and member-link behavior.
  // This is not a server authentication boundary.
  const query = new URLSearchParams(location.search);
  const existing = document.cookie.match(/(?:^|;\s*)ka_course=([^;]+)/)?.[1];
  window.COURSE_ACCESS = !!existing || query.has('pass');
  if (!window.COURSE_ACCESS) {
    document.documentElement.style.visibility = 'hidden';
    location.replace('/free-course/');
    return;
  }
  const value = existing || encodeURIComponent(query.get('pass') || '1');
  document.cookie = 'ka_course=' + value + '; Max-Age=31536000; Path=/; SameSite=Lax; Secure';
})();
