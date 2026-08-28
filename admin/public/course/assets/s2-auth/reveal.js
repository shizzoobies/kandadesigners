/* ============================================================
   Claude Code Course - Reveal animations + hover lift  (reveal.js)

   Eases content in as it enters the viewport. Top-level blocks reveal
   as units; a top-level CSS grid has its tiles revealed one by one
   (and given a soft hover lift) so card grids pop in individually.

   On an auto-sized embed (everything visible at load) this reads as a
   smooth top-to-bottom staggered load-in; where the embed scrolls,
   blocks reveal as they come into view.

   Safe by design: if reduced motion is on, or IntersectionObserver is
   missing, content is left fully visible. A fallback timer reveals
   everything no matter what.
   ============================================================ */
(function (global) {
  "use strict";
  if (global.__ccReveal) return;
  global.__ccReveal = true;

  function now() {
    return (global.performance && global.performance.now) ? global.performance.now() : Date.now();
  }

  function visibleEl(c) {
    if (!c || c.nodeType !== 1) return false;
    var tag = c.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "LINK" || tag === "NOSCRIPT" || tag === "TEMPLATE") return false;
    if (typeof c.className === "string" && /\b(cc-namebd|cc-assist|modal|backdrop|overlay)\b/i.test(c.className)) return false;
    var cs = global.getComputedStyle(c);
    if (cs.position === "fixed" || cs.position === "absolute") return false;
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    return true;
  }

  function start() {
    var root = document.querySelector(".cc-root") || document.body;
    if (!root) return;

    var reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in global)) return; // leave everything visible

    var targets = [];
    var lift = [];
    Array.prototype.forEach.call(root.children, function (c) {
      if (!visibleEl(c)) return;
      var cs = global.getComputedStyle(c);
      if (cs.display === "grid" || cs.display === "inline-grid") {
        var kids = Array.prototype.filter.call(c.children, visibleEl);
        if (kids.length >= 2) {
          kids.forEach(function (k) { targets.push(k); lift.push(k); });
          return; // reveal the tiles, not the grid container
        }
      }
      targets.push(c);
    });
    if (!targets.length) return;

    targets.forEach(function (t) { t.classList.add("cc-reveal"); });
    lift.forEach(function (t) { t.classList.add("cc-lift"); });

    // safety net: if the observer never reveals anything (broken/unsupported
    // in some odd context), show everything. The top of the page is always in
    // view at load, so a working observer reveals at least one block and this
    // never fires, leaving real scroll-reveal intact for below-the-fold blocks.
    var revealedAny = false;
    var fallback = setTimeout(function () {
      if (revealedAny) return;
      targets.forEach(function (t) { t.classList.add("cc-reveal--in"); t.style.transitionDelay = ""; });
    }, 1600);

    // batch stagger: blocks revealed together cascade; an isolated
    // scroll-in gets no delay so it never feels laggy
    var batchStart = 0, batchCount = 0;
    function reveal(t) {
      revealedAny = true;
      var n = now();
      if (n - batchStart > 220) { batchStart = n; batchCount = 0; }
      var delay = Math.min(batchCount, 7) * 80;
      batchCount++;
      t.style.transitionDelay = (delay / 1000) + "s";
      t.classList.add("cc-reveal--in");
      // once the entrance finishes, drop the reveal classes so hover lift
      // and a clean compositor state take over
      setTimeout(function () {
        t.classList.remove("cc-reveal", "cc-reveal--in");
        t.style.transitionDelay = "";
      }, delay + 720);
    }

    var io = new IntersectionObserver(function (entries) {
      var hits = [];
      entries.forEach(function (e) { if (e.isIntersecting) hits.push(e); });
      hits.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      hits.forEach(function (e) { reveal(e.target); io.unobserve(e.target); });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });

    targets.forEach(function (t) { io.observe(t); });

    void fallback;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(typeof window !== "undefined" ? window : this);
