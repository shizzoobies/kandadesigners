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
