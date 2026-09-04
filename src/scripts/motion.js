import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.__motion = { reduced };

// Nav gains its solid backdrop on scroll regardless of motion preference —
// a transparent nav over content is a readability problem, not an animation.
const navEl = () => document.querySelector('[data-nav]');
const updateNav = () => navEl()?.classList.toggle('nav-scrolled', window.scrollY > 80);

if (reduced) {
  document.documentElement.classList.add('motion-reduced');
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
} else {
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.12 });
  window.__motion.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const EASE = 'expo.out';

  // Everything that belongs to one page's DOM lives in initPage(). It runs
  // once on a normal load, and again after every client-side navigation on
  // the pages that use Astro's ClientRouter (the training section): the old
  // triggers are killed, the new DOM is wired, and Lenis is told the page
  // changed height. Lenis and the ticker outlive pages on purpose.
  const initPage = () => {
    document.querySelectorAll('[data-animate="type-settle"]').forEach((el) => {
      gsap.from(el, {
        yPercent: 60, opacity: 0, duration: 0.8, ease: EASE,
        delay: parseFloat(el.dataset.animateDelay || 0),
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    // Artist work tiles tumble in: each one arrives from up and to the left,
    // rotating down onto its base, which suits work that is physically pinned,
    // printed and worn. Batched so a row cascades in sequence.
    //
    // Two things matter here and were learned the hard way. The rotation has to
    // be big enough to read as a deliberate tumble - a couple of degrees just
    // looks like a shudder. And the ease must not overshoot: bouncing y, scale
    // and rotation together produced a compound wobble that read as a glitch.
    // power3.out decelerates smoothly, so it lands rather than bounces.
    // transformOrigin at the bottom edge makes it pivot like it is settling on
    // a surface instead of spinning around its middle.
    //
    // Note this is set-then-tween-to, NOT gsap.from(). With from() inside a
    // batch the tween is only built when the tile enters, so the tile paints
    // once in its resting state before snapping back to the start — a visible
    // blink. Parking the start state up front removes that frame entirely.
    // force3D keeps each tile on its own compositor layer, so rotating a
    // rounded, clipped, shadowed frame doesn't re-rasterise every frame.
    const tumbleTiles = gsap.utils.toArray('[data-animate="tile-settle"]');
    if (tumbleTiles.length) {
      gsap.set(tumbleTiles, {
        x: -16,
        y: -30,
        rotation: -10,
        scale: 0.86,
        opacity: 0,
        transformOrigin: '50% 100%',
        willChange: 'transform, opacity',
        force3D: true,
      });

      ScrollTrigger.batch(tumbleTiles, {
        start: 'top 88%',
        onEnter: (batch) =>
          gsap.to(batch, {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            force3D: true,
            stagger: { each: 0.09 },
            // drop the promotion hint once landed so idle tiles aren't holding
            // compositor layers for the life of the page
            clearProps: 'transform,willChange',
          }),
      });
    }

    document.querySelectorAll('[data-animate="frame-lift"]').forEach((el) => {
      gsap.from(el, {
        y: 40, opacity: 0, duration: 0.8, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });

    document.querySelectorAll('svg[data-animate="line-draw"]').forEach((svg) => {
      const paths = svg.querySelectorAll('path, line, rect, circle');
      paths.forEach((p) => {
        const len = p.getTotalLength ? p.getTotalLength() : 1000;
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
      });
      gsap.to(paths, {
        strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.08,
        scrollTrigger: { trigger: svg, start: 'top 80%' },
      });
    });

    // Pinning is done with CSS position:sticky (see [data-pin-viewport]), not
    // ScrollTrigger's pin — fixed-position swaps register as layout shifts and
    // wreck CLS; sticky movement is exempt. The timeline only scrubs opacity
    // and transforms.
    document.querySelectorAll('[data-pin-sequence]').forEach((seq) => {
      const steps = seq.querySelectorAll('[data-pin-step]');
      seq.style.height = `${(steps.length + 1) * 100}vh`;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: seq, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
      steps.forEach((step, i) => {
        if (i > 0) tl.from(step, { opacity: 0, y: 30, duration: 1 });
        if (i < steps.length - 1) tl.to(step, { opacity: 0, y: -30, duration: 1 }, '+=1');
      });
    });

    ScrollTrigger.create({ start: 'top -80', onUpdate: updateNav, onToggle: updateNav });
    updateNav();
  };

  initPage();

  // ClientRouter pages: astro:page-load also fires for the initial load, after
  // this module has already run, so the first event is skipped.
  let seenInitialPageLoad = false;
  document.addEventListener('astro:page-load', () => {
    if (!seenInitialPageLoad) {
      seenInitialPageLoad = true;
      return;
    }
    ScrollTrigger.getAll().forEach((t) => t.kill());
    lenis.resize();
    initPage();
    ScrollTrigger.refresh();
  });
}
