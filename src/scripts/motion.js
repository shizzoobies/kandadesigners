import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.__motion = { reduced };

// Nav gains its solid backdrop on scroll regardless of motion preference —
// a transparent nav over content is a readability problem, not an animation.
const nav = document.querySelector('[data-nav]');
const updateNav = () => nav?.classList.toggle('nav-scrolled', window.scrollY > 80);

if (reduced) {
  document.documentElement.classList.add('motion-reduced');
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
} else {
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.12 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const EASE = 'expo.out';

  document.querySelectorAll('[data-animate="type-settle"]').forEach((el) => {
    gsap.from(el, {
      yPercent: 60, opacity: 0, duration: 0.8, ease: EASE,
      delay: parseFloat(el.dataset.animateDelay || 0),
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  document.querySelectorAll('[data-animate="flood-in"]').forEach((el) => {
    gsap.from(el, {
      opacity: 0, scale: 0.96, duration: 1.4, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 80%' },
    });
  });

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
}
