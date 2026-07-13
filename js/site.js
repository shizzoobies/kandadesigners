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

/* Scroll-scrubbed "spray paint" canvas reveal for capability heroes.
   A cover is painted over the collage, then eroded with soft dabs as the
   section scrolls through the viewport — fully clearing (everything visible)
   by the end. Inspired by the Project Makeover mural reveal. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function initReveal(section) {
    var canvas = section.querySelector('.reveal-cover');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var cover = section.getAttribute('data-cover') || '#17110a';
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, stamps = [], raf = 0, curP = 0, lastDrawn = -1;

    function build() {
      stamps = [];
      var n = Math.max(140, Math.round((W * H) / 5200));
      for (var i = 0; i < n; i++) stamps.push({ x: Math.random() * W, y: Math.random() * H, r: 55 + Math.random() * 85 });
    }
    function ease(t) { return t * t * (3 - 2 * t); }
    function draw(p) {
      if (Math.abs(p - lastDrawn) < 0.004) return;
      lastDrawn = p;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (p >= 0.985) { ctx.clearRect(0, 0, W, H); return; }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cover;
      ctx.fillRect(0, 0, W, H);
      if (p <= 0.001) return;
      var N = Math.floor(ease(p) * stamps.length);
      ctx.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < N; i++) {
        var s = stamps[i];
        var g = ctx.createRadialGradient(s.x, s.y, s.r * 0.12, s.x, s.y, s.r);
        g.addColorStop(0, 'rgba(0,0,0,0.92)');
        g.addColorStop(0.55, 'rgba(0,0,0,0.42)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      build(); lastDrawn = -1; draw(curP);
    }
    function progress() {
      var r = section.getBoundingClientRect(), vh = window.innerHeight;
      var start = vh * 0.92, end = vh * 0.32;
      return Math.max(0, Math.min(1, (start - r.top) / (start - end)));
    }
    function tick() {
      raf = requestAnimationFrame(tick);
      var t = progress();
      curP += (t - curP) * 0.16;
      if (Math.abs(t - curP) < 0.0015) curP = t;
      draw(curP);
    }
    if (reduce) { resize(); draw(1); return; }
    resize();
    window.addEventListener('resize', resize);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (!raf) tick(); }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      });
    }, { rootMargin: '300px 0px' });
    io.observe(section);
  }
  function boot() { document.querySelectorAll('[data-reveal]').forEach(initReveal); }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
