/* K&A Performance — shared site behavior: mobile menu, nav scroll state, scroll reveal. */
(function () {
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    // Mobile menu toggle
    var btn = document.getElementById('menu-btn');
    var menu = document.getElementById('mobile-menu');
    if (btn && menu) {
      btn.addEventListener('click', function () {
        menu.classList.toggle('hidden');
        menu.classList.toggle('flex');
      });
    }

    // Nav: transparent at top, solid ("scrolled") once you scroll down
    var header = document.getElementById('site-header');
    if (header) {
      var apply = function () {
        if (window.scrollY > 40) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      };
      apply();
      window.addEventListener('scroll', apply, { passive: true });
    }

    // Scroll reveal (content is visible without JS)
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.08 });
      document.querySelectorAll('main section').forEach(function (el) {
        el.classList.add('reveal');
        obs.observe(el);
      });
    }
  });
})();
