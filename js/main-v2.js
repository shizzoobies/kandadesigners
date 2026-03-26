/* =============================================
   K & A DESIGNS — MAIN JS
   ============================================= */

// ─── Marquee seamless-loop clone ─────────────────
// Clones the unique cards once so the loop is seamless.
// Runs synchronously here so cloned elements get event listeners below.
(function () {
  const track = document.getElementById('work-marquee-track');
  if (!track) return;
  Array.from(track.children).forEach(card => {
    track.appendChild(card.cloneNode(true));
  });
})();

// ─── Modal scroll lock / restore ─────────────────
// Saves scroll position before locking and restores it after unlocking.
// Used by every modal open/close so the page jumps back to where the user was.
var _savedScrollY = 0;
function lockScroll() {
  _savedScrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + _savedScrollY + 'px';
  document.body.style.width = '100%';
}
function unlockScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo({ top: _savedScrollY, behavior: 'instant' });
}

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
      unlockScroll();
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

let lightboxTrigger = null;

function openLightbox(item) {
  const img  = item.querySelector('img');
  const full = item.dataset.full || img?.src;
  const alt  = img?.alt || '';
  if (lightbox && lightboxImg && full) {
    lightboxImg.src = full;
    lightboxImg.alt = alt;
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    lockScroll();
    lightboxTrigger = item;
    lightboxClose?.focus();
  }
}

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => openLightbox(item));
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item); }
  });
});

function closeLightbox() {
  if (!lightbox) return;
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
  unlockScroll();
  if (lightboxImg) lightboxImg.src = '';
  lightboxTrigger?.focus();
  lightboxTrigger = null;
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
      num: '01', name: 'Project Management',
      desc: 'Nonprofit board leadership, volunteer coordination, and community-driven project execution on the ground.',
      items: ['Board leadership', 'Volunteer coordination', 'Community impact', 'Project Makeover']
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
      num: '04', name: 'Web Games',
      desc: 'Browser-based games built with pure JavaScript — no engines, no frameworks, just fast custom logic.',
      items: ['Scrolling shooter', 'Tower defense', 'Firebase leaderboards', 'Claude Code AI development']
    },
    {
      num: '05', name: 'HTML Interactives',
      desc: 'Custom-built interactive experiences using pure web APIs — no frameworks, no dependencies, just fast and precise.',
      items: ['Custom UI components', 'Canvas & SVG animation', 'Game & simulation logic', 'Embedded eLearning tools'],
      link: 'interactives/'
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
      const viewLink = detailInner.querySelector('a.btn');
      if (viewLink) viewLink.href = s.link || 'services/';
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
    node.addEventListener('click', () => {
      // 0=Project Management→nonprofit, 1=Web&Digital→PBJ, 2=Video&Audio→music,
      // 3=Web Games→shooter, 4=HTML Interactives→elearn
      const actions = ['nonprofit', 'pbj', 'music', 'shooter', 'elearn'];
      const action  = actions[i];
      if (action === 'pbj') {
        sessionStorage.setItem('pbj-return-url', '/');
        sessionStorage.setItem('pbj-return-scroll', window.scrollY);
        window.location.href = '/projects/#pbj-preview';
      } else {
        const sel = {
          nonprofit: '[data-open-nonprofit]',
          music:     '[data-open-music]',
          shooter:   '[data-open-shooter]',
          elearn:    '[data-open-elearn]',
        }[action];
        if (sel) document.querySelector(sel)?.click();
      }
    });
  });

  function openModal()  {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
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

  let contactTrigger = null;

  const focusable = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

  function trapFocus(e) {
    const els = Array.from(modal.querySelectorAll(focusable));
    const first = els[0], last = els[els.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function openContactModal(e) {
    e.preventDefault();
    contactTrigger = e.currentTarget;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    modal.addEventListener('keydown', trapFocus);
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function closeContactModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    modal.removeEventListener('keydown', trapFocus);
    contactTrigger?.focus();
    contactTrigger = null;
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
        const data = {};
        new FormData(modalForm).forEach((v, k) => { data[k] = v; });
        const res  = await fetch('https://formspree.io/f/mbdprgwb', {
          method: 'POST',
          body: JSON.stringify(data),
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        });
        const json = await res.json();
        if (json.ok) {
          modalForm.style.display = 'none';
          if (modalSuccess) modalSuccess.style.display = 'block';
        } else {
          throw new Error();
        }
      } catch {
        btn.textContent = 'Something went wrong — try again';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = orig; }, 4000);
      }
    });
  }
})();

// ─── Home Shooter Game Modal ──────────────────────
(function () {
  const modal    = document.getElementById('home-game-modal');
  const backdrop = document.getElementById('home-game-backdrop');
  const closeBtn = document.getElementById('home-game-close');
  const iframe   = document.getElementById('home-game-iframe');
  if (!modal) return;

  const GAME_URL = 'https://game.kandadesigners.com';

  function openGameModal() {
    iframe.src = GAME_URL;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
  }

  function closeGameModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    setTimeout(() => { iframe.src = ''; }, 300);
  }

  document.querySelectorAll('[data-open-shooter]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openGameModal(); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGameModal(); }
    });
  });

  closeBtn?.addEventListener('click', closeGameModal);
  backdrop?.addEventListener('click', closeGameModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeGameModal();
  });
})();

// ─── Book Cover Gallery Modal ─────────────────────
(function () {
  const modal    = document.getElementById('book-modal');
  const backdrop = document.getElementById('book-modal-backdrop');
  const closeBtn = document.getElementById('book-modal-close');
  if (!modal) return;

  let bookTrigger = null;

  function openBookModal(trigger) {
    bookTrigger = trigger || null;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function closeBookModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    bookTrigger?.focus();
    bookTrigger = null;
  }

  document.querySelectorAll('[data-open-bookcovers]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openBookModal(el); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBookModal(el); }
    });
  });

  closeBtn?.addEventListener('click', closeBookModal);
  backdrop?.addEventListener('click', closeBookModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open') && !document.getElementById('lightbox')?.classList.contains('active')) {
      closeBookModal();
    }
  });
})();

// ─── eLearning Preview Modal ──────────────────────
(function () {
  const modal    = document.getElementById('elearn-modal');
  const backdrop = document.getElementById('elearn-modal-backdrop');
  const closeBtn = document.getElementById('elearn-modal-close');
  if (!modal) return;

  let elearnTrigger = null;

  function openElearnModal(trigger) {
    elearnTrigger = trigger || null;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function closeElearnModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    elearnTrigger?.focus();
    elearnTrigger = null;
  }

  document.querySelectorAll('[data-open-elearn]').forEach(el => {
    el.addEventListener('click', (e) => { e.stopPropagation(); openElearnModal(el); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openElearnModal(el); }
    });
  });

  closeBtn?.addEventListener('click', closeElearnModal);
  backdrop?.addEventListener('click', closeElearnModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeElearnModal(); });

  // Preview buttons → launch iframe modal
  const iframeModal    = document.getElementById('elearn-iframe-modal');
  const iframeEl       = document.getElementById('elearn-iframe');
  const iframeTitleEl  = document.getElementById('elearn-iframe-title');
  const iframeCloseBtn = document.getElementById('elearn-iframe-close');
  const iframeBackdrop = document.getElementById('elearn-iframe-backdrop');

  function openIframe(slug, title) {
    if (!iframeModal || !iframeEl) return;
    iframeEl.src = '/interactives/' + slug + '/index.html';
    if (iframeTitleEl) iframeTitleEl.textContent = title;
    iframeModal.classList.add('is-open');
    iframeModal.setAttribute('aria-hidden', 'false');
  }

  function closeIframe() {
    if (!iframeModal) return;
    iframeModal.classList.remove('is-open');
    iframeModal.setAttribute('aria-hidden', 'true');
    if (iframeEl) iframeEl.src = '';
  }

  modal.querySelectorAll('[data-interactive]').forEach(btn => {
    btn.addEventListener('click', () => openIframe(btn.dataset.interactive, btn.dataset.title));
  });

  iframeCloseBtn?.addEventListener('click', closeIframe);
  iframeBackdrop?.addEventListener('click', closeIframe);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && iframeModal?.classList.contains('is-open')) closeIframe(); });
})();

// ─── FixAlways Modal ──────────────────────────────
(function () {
  const modal       = document.getElementById('fixalways-modal');
  const backdrop    = document.getElementById('fixalways-modal-backdrop');
  const closeBtn    = document.getElementById('fixalways-modal-close');
  const previewBtn  = document.getElementById('fixalways-preview-btn');
  const iframeModal = document.getElementById('fixalways-iframe-modal');
  const iframeEl    = document.getElementById('fixalways-iframe');
  const iframeClose = document.getElementById('fixalways-iframe-close');
  const iframeBd    = document.getElementById('fixalways-iframe-backdrop');
  if (!modal) return;

  let trigger = null;

  function openModal(el) {
    trigger = el || null;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    trigger?.focus();
    trigger = null;
  }

  function openIframe() {
    if (!iframeModal || !iframeEl) return;
    iframeEl.src = 'https://fixalways.com';
    iframeModal.classList.add('is-open');
    iframeModal.setAttribute('aria-hidden', 'false');
  }

  function closeIframe() {
    if (!iframeModal) return;
    iframeModal.classList.remove('is-open');
    iframeModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (iframeEl) iframeEl.src = ''; }, 300);
  }

  document.querySelectorAll('[data-open-fixalways]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openModal(el); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(el); }
    });
  });

  previewBtn?.addEventListener('click', openIframe);
  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', closeModal);
  iframeClose?.addEventListener('click', closeIframe);
  iframeBd?.addEventListener('click', closeIframe);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (iframeModal?.classList.contains('is-open')) { closeIframe(); return; }
      if (modal.classList.contains('is-open')) closeModal();
    }
  });
})();

// ─── AI Music Modal ───────────────────────────────
(function () {
  const modal    = document.getElementById('music-modal');
  const backdrop = document.getElementById('music-modal-backdrop');
  const closeBtn = document.getElementById('music-modal-close');
  if (!modal) return;

  let musicTrigger = null;

  function openMusicModal(trigger) {
    musicTrigger = trigger || null;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function closeMusicModal() {
    // Pause all audio when closing
    modal.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    musicTrigger?.focus();
    musicTrigger = null;
  }

  document.querySelectorAll('[data-open-music]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openMusicModal(el); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMusicModal(el); }
    });
  });

  closeBtn?.addEventListener('click', closeMusicModal);
  backdrop?.addEventListener('click', closeMusicModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeMusicModal();
  });
})();

// ─── Image hover preview (floating tooltip) ──────
(function () {
  const preview = document.createElement('div');
  preview.className = 'img-hover-preview';
  const previewImg = document.createElement('img');
  preview.appendChild(previewImg);
  document.body.appendChild(preview);

  function reposition(e) {
    let x = e.clientX + 20;
    let y = e.clientY - 100;
    if (x + 320 > window.innerWidth) x = e.clientX - 320;
    if (y < 10) y = 10;
    if (y + 320 > window.innerHeight) y = window.innerHeight - 330;
    preview.style.left = x + 'px';
    preview.style.top  = y + 'px';
  }

  document.querySelectorAll('[data-hover-preview]').forEach(el => {
    el.addEventListener('mouseenter', e => {
      previewImg.src = el.dataset.hoverPreview;
      preview.classList.add('active');
      reposition(e);
    });
    el.addEventListener('mousemove', reposition);
    el.addEventListener('mouseleave', () => {
      preview.classList.remove('active');
    });
  });
})();

// ─── AI Audio & YouTube Modal ─────────────────────
(function () {
  const modal    = document.getElementById('audio-modal');
  const backdrop = document.getElementById('audio-modal-backdrop');
  const closeBtn = document.getElementById('audio-modal-close');
  if (!modal) return;

  let audioTrigger = null;

  function openAudioModal(trigger) {
    audioTrigger = trigger || null;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function closeAudioModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    audioTrigger?.focus();
    audioTrigger = null;
  }

  document.querySelectorAll('[data-open-audio]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openAudioModal(el); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAudioModal(el); }
    });
  });

  closeBtn?.addEventListener('click', closeAudioModal);
  backdrop?.addEventListener('click', closeAudioModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeAudioModal();
  });
})();

// ─── Nonprofit Modal ──────────────────────────────
(function () {
  const modal    = document.getElementById('nonprofit-modal');
  const backdrop = document.getElementById('nonprofit-modal-backdrop');
  const closeBtn = document.getElementById('nonprofit-modal-close');
  if (!modal) return;

  let nonprofitTrigger = null;

  function openNonprofitModal(trigger) {
    nonprofitTrigger = trigger || null;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function closeNonprofitModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
    nonprofitTrigger?.focus();
    nonprofitTrigger = null;
  }

  document.querySelectorAll('[data-open-nonprofit]').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openNonprofitModal(el); });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNonprofitModal(el); }
    });
  });

  closeBtn?.addEventListener('click', closeNonprofitModal);
  backdrop?.addEventListener('click', closeNonprofitModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeNonprofitModal();
  });
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
      const data = {};
      new FormData(contactForm).forEach((v, k) => { data[k] = v; });
      const res  = await fetch('https://formspree.io/f/mbdprgwb', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      });
      const json = await res.json();

      if (json.ok) {
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


// ─── AI Chat Widget ────────────────────────────────
(function () {
  // Inject widget HTML into every page
  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<button class="ka-chat-btn" id="ka-chat-btn" aria-label="Chat with K &amp; A Designs AI" aria-expanded="false">' +
      '<span class="ka-chat-online-dot" aria-hidden="true"></span>' +
      'Need Help?' +
    '</button>' +
    '<div class="ka-chat-panel" id="ka-chat-panel" role="dialog" aria-label="K &amp; A Designs AI assistant" aria-hidden="true">' +
      '<div class="ka-chat-head">' +
        '<img class="ka-chat-head-avatar" src="/images/Alex-Image.jpg" alt="Alex" />' +
        '<div class="ka-chat-head-info">' +
          '<div class="ka-chat-head-name">K &amp; A Designs AI</div>' +
          '<div class="ka-chat-head-status">Online</div>' +
        '</div>' +
        '<button class="ka-chat-head-close" id="ka-chat-close" aria-label="Close chat">&#x2715;</button>' +
      '</div>' +
      '<div class="ka-chat-messages" id="ka-chat-messages" aria-live="polite"></div>' +
      '<div class="ka-chat-input-row">' +
        '<textarea class="ka-chat-input" id="ka-chat-input" placeholder="Ask anything about our work..." rows="1" aria-label="Chat message"></textarea>' +
        '<button class="ka-chat-send" id="ka-chat-send" aria-label="Send">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="ka-chat-brand">Powered by Anthropic Claude</div>' +
    '</div>';
  document.body.appendChild(wrap);

  var chatBtn   = document.getElementById('ka-chat-btn');
  var chatPanel = document.getElementById('ka-chat-panel');
  var closeBtn  = document.getElementById('ka-chat-close');
  var msgArea   = document.getElementById('ka-chat-messages');
  var inputEl   = document.getElementById('ka-chat-input');
  var sendBtn   = document.getElementById('ka-chat-send');
  var history   = [];
  var isOpen    = false;
  var busy      = false;

  function openChat() {
    isOpen = true;
    chatPanel.classList.add('open');
    chatPanel.setAttribute('aria-hidden', 'false');
    chatBtn.setAttribute('aria-expanded', 'true');
    if (history.length === 0) {
      addMsg('ai', "Hi! I'm the K & A Designs AI assistant. Ask me anything about our services, portfolio, or how to get started on a project.");
    }
    setTimeout(function () { inputEl.focus(); }, 260);
  }

  function closeChat() {
    isOpen = false;
    chatPanel.classList.remove('open');
    chatPanel.setAttribute('aria-hidden', 'true');
    chatBtn.setAttribute('aria-expanded', 'false');
  }

  function addMsg(role, text) {
    var div = document.createElement('div');
    div.className = 'ka-msg ka-msg--' + role;
    div.textContent = text;
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
    return div;
  }

  function addTyping() {
    var div = document.createElement('div');
    div.className = 'ka-msg--typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
    return div;
  }

  function autoResize() {
    inputEl.style.height = '';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + 'px';
  }

  async function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || busy) return;

    busy = true;
    sendBtn.disabled = true;
    inputEl.value = '';
    inputEl.style.height = '';

    addMsg('user', text);
    history.push({ role: 'user', content: text });

    var typing = addTyping();

    try {
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      var data = await res.json();
      var reply = (data.content && data.content[0] && data.content[0].text)
        || "Sorry, something went wrong. Please try again.";
      typing.remove();
      addMsg('ai', reply);
      history.push({ role: 'assistant', content: reply });
    } catch (e) {
      typing.remove();
      addMsg('ai', "Sorry, I'm having trouble connecting right now. Please try again in a moment.");
    }

    busy = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }

  chatBtn.addEventListener('click', function () { isOpen ? closeChat() : openChat(); });
  closeBtn.addEventListener('click', closeChat);
  sendBtn.addEventListener('click', sendMessage);

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  inputEl.addEventListener('input', autoResize);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeChat();
  });
})();
