// Motion engine lands in Task 3. Reduced-motion class is applied here so the
// static fallback works from the first build.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.__motion = { reduced };
if (reduced) document.documentElement.classList.add('motion-reduced');
