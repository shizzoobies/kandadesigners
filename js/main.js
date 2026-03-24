/* =============================================
   K & A DESIGNS — MAIN JS
   ============================================= */

// ─── Nav scroll ──────────────────────────────────
const nav = document.getElementById('site-nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ─── Hamburger ───────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ─── Scroll-reveal animations ────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));

// ─── Work marquee pause on hover ─────────────────
const workTrack = document.getElementById('work-marquee-track');
if (workTrack) {
  workTrack.addEventListener('mouseenter', () => workTrack.classList.add('paused'));
  workTrack.addEventListener('mouseleave', () => workTrack.classList.remove('paused'));
}

// ─── Lightbox ────────────────────────────────────
const lightbox    = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img  = item.querySelector('img');
    const full = item.dataset.full || img?.src;
    if (lightbox && lightboxImg && full) {
      lightboxImg.src = full;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
});

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  if (lightboxImg) lightboxImg.src = '';
}

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// ─── Services Orbital ────────────────────────────
(function () {
  const stage = document.getElementById('orbit-stage');
  if (!stage) return;

  const nodes      = Array.from(stage.querySelectorAll('.orbit-node'));
  const ringDash   = stage.querySelector('.orbit-ring-dash');
  const detailInner = document.getElementById('orbit-detail-inner');
  const odNum      = document.getElementById('od-num');
  const odName     = document.getElementById('od-name');
  const odDesc     = document.getElementById('od-desc');
  const odList     = document.getElementById('od-list');
  const centerBtn  = document.getElementById('orbit-center');
  const modal      = document.getElementById('svc-modal');
  const modalClose = document.getElementById('svc-modal-close');
  const backdrop   = document.getElementById('svc-modal-backdrop');

  const SERVICES = [
    {
      num: '01', name: 'Instructional Design',
      desc: 'Backed by 15+ years of education experience — from K‑12 classrooms to corporate training programs.',
      items: ['Articulate 360 & Rise', 'SCORM & LMS delivery', 'End-to-end course development', 'SME collaboration']
    },
    {
      num: '02', name: 'Web & Digital Design',
      desc: 'Modern, conversion-focused websites engineered for clarity, accessibility, and measurable performance.',
      items: ['Custom website design', 'SEO strategy & analytics', 'HTML interactives', 'AI-powered systems']
    },
    {
      num: '03', name: 'Video & Audio Production',
      desc: 'Clean sound, sharp visuals — from corporate training content to social-ready short-form video.',
      items: ['Adobe Premiere editing', 'ElevenLabs AI voice', 'Motion graphics', 'Captioning & accessibility']
    },
    {
      num: '04', name: 'Social Media & Branding',
      desc: 'Strategy-first content powered by keywords, AI, and a consistent visual voice across every channel.',
      items: ['Brand voice & consistency', 'Keyword-led content planning', 'AI-assisted creation', 'Content calendars']
    }
  ];

  const RADIUS = 172;
  const TOTAL  = nodes.length;
  let rot      = -Math.PI / 2;
  let paused   = false;
  let activeIdx = -1;
  let raf;

  function cx() { return stage.offsetWidth  / 2; }
  function cy() { return stage.offsetHeight / 2; }

  function positionNodes() {
    nodes.forEach((node, i) => {
      const angle = (i / TOTAL) * Math.PI * 2 + rot;
      node.style.left = (cx() + Math.cos(angle) * RADIUS) + 'px';
      node.style.top  = (cy() + Math.sin(angle) * RADIUS) + 'px';
    });
  }

  function nearestToTop() {
    let best = 0, bestDist = Infinity;
    nodes.forEach((_, i) => {
      const angle = (i / TOTAL) * Math.PI * 2 + rot;
      let diff = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff < bestDist) { bestDist = diff; best = i; }
    });
    return best;
  }

  function setActive(idx) {
    if (idx === activeIdx) return;
    activeIdx = idx;
    nodes.forEach((n, i) => n.classList.toggle('is-active', i === idx));
    detailInner.classList.add('switching');
    setTimeout(() => {
      const s = SERVICES[idx];
      odNum.textContent  = s.num;
      odName.textContent = s.name;
      odDesc.textContent = s.desc;
      odList.innerHTML   = s.items.map(t => `<li>${t}</li>`).join('');
      detailInner.classList.remove('switching');
    }, 180);
  }

  function tick() {
    if (!paused) {
      rot += 0.0008;
      positionNodes();
      setActive(nearestToTop());
    }
    raf = requestAnimationFrame(tick);
  }

  positionNodes();
  setActive(0);
  tick();

  nodes.forEach((node, i) => {
    node.addEventListener('mouseenter', () => {
      paused = true;
      ringDash && ringDash.classList.add('paused');
      setActive(i);
    });
    node.addEventListener('mouseleave', () => {
      paused = false;
      ringDash && ringDash.classList.remove('paused');
    });
    node.addEventListener('click', () => { window.location.href = 'services/'; });
  });

  function openModal()  {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  centerBtn?.addEventListener('click', openModal);
  modalClose?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) paused = true;
})();

// ─── Contact Modal ────────────────────────────────
(function () {
  const modal    = document.getElementById('contact-modal');
  const backdrop = document.getElementById('contact-modal-backdrop');
  const closeBtn = document.getElementById('contact-modal-close');
  if (!modal) return;

  function openContactModal(e) {
    e.preventDefault();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeContactModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-contact]').forEach(el => {
    el.addEventListener('click', openContactModal);
  });

  closeBtn?.addEventListener('click', closeContactModal);
  backdrop?.addEventListener('click', closeContactModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeContactModal(); });

  // Contact modal form submit (Web3Forms)
  const modalForm    = document.getElementById('contact-modal-form');
  const modalSuccess = document.getElementById('contact-modal-success');
  if (modalForm) {
    modalForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn  = modalForm.querySelector('.form-submit');
      const orig = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;
      try {
        const res  = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: new FormData(modalForm)
        });
        const json = await res.json();
        if (json.success) {
          modalForm.style.display = 'none';
          if (modalSuccess) modalSuccess.style.display = 'block';
        } else { throw new Error(); }
      } catch {
        btn.textContent = 'Something went wrong — try again';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = orig; }, 3500);
      }
    });
  }
})();

// ─── Contact form (Web3Forms) ─────────────────────
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    const orig = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res  = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: new FormData(contactForm)
      });
      const json = await res.json();

      if (json.success) {
        contactForm.style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
      } else {
        throw new Error();
      }
    } catch {
      btn.textContent = 'Something went wrong — try again';
      btn.disabled = false;
      setTimeout(() => { btn.textContent = orig; }, 3500);
    }
  });
}
