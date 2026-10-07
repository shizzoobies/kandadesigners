/* Optional collection is off until an affirmative, category-specific choice. */
(() => {
  'use strict';
  if (window.KAPrivacy) return;
  const KEY = 'ka_privacy';
  const PIXEL = '1584105763055085';
  let pixelStarted = false;
  let lastPage = '';
  let returnFocus;
  let bannerObserver;
  let lastChoiceAt = 0;
  let deniedInMemory = false;
  const readCookie = () => {
    const match = /^v1\.a([01])\.m([01])$/.exec(document.cookie.match(/(?:^|;\s*)ka_privacy=([^;]*)/)?.[1] || '');
    return { chosen: !!match, analytics: match?.[1] === '1', marketing: match?.[2] === '1' };
  };
  const fallbackDenial = () => {
    try { return sessionStorage.getItem('ka_privacy_denied') === '1'; } catch { return false; }
  };
  const read = () => deniedInMemory || fallbackDenial()
    ? { chosen: true, analytics: false, marketing: false }
    : readCookie();
  const allows = category => read()[category] === true && ['analytics', 'marketing'].includes(category);
  const cookie = (name, value, age) => {
    document.cookie = `${name}=${value}; Max-Age=${age}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
  };
  function clearMarketingCookies() {
    // Only withdraw optional browser identifiers. Never clear access, progress or database records.
    const names = document.cookie.split(';').map(item => item.trim().split('=')[0]).filter(name => ['ka_src', '_fbp', '_fbc'].includes(name));
    for (const name of names) {
      cookie(name, '', 0);
      const parts = location.hostname.split('.');
      for (let i = 0; i < parts.length - 1; i++) {
        document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${parts.slice(i).join('.')}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
      }
    }
  }
  function source() {
    if (!allows('marketing')) return '';
    try { return decodeURIComponent(document.cookie.match(/(?:^|;\s*)ka_src=([^;]*)/)?.[1] || ''); }
    catch { return ''; }
  }
  function marketing() {
    if (!allows('marketing')) return;
    // Access links and course activity never go to the advertising pixel.
    if (/^\/course(?:\/|-app\/|$)/.test(location.pathname)) return;
    const referral = new URLSearchParams(location.search).get('src');
    if (referral && !source()) cookie('ka_src', encodeURIComponent(referral.slice(0, 60)), 7776000);
    if (!pixelStarted) {
      pixelStarted = true;
      const fbq = window.fbq = function () {
        if (!allows('marketing')) return;
        fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
      };
      window._fbq = fbq;
      fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
      // Only explicit PageView/Lead events. No automatic form-field detection.
      fbq('set', 'autoConfig', false, PIXEL);
      fbq('init', PIXEL);
      const script = document.createElement('script');
      script.id = 'ka-meta-pixel'; script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.append(script);
    }
    const page = location.pathname + location.search;
    if (lastPage !== page) {
      lastPage = page;
      window.fbq('track', 'PageView');
    }
  }
  function stopMarketing(reload = true) {
    if (!pixelStarted) return;
    // Invoke the loaded vendor's consent command even after our local guard is off.
    if (window.fbq?.callMethod) window.fbq.callMethod.call(window.fbq, 'consent', 'revoke');
    if (window.fbq?.queue) window.fbq.queue.length = 0;
    document.getElementById('ka-meta-pixel')?.remove();
    // Every caller, including focus/storage synchronization, must keep a
    // memory-only denial in this document when persistent storage is blocked.
    const denialSurvivesReload = !readCookie().marketing || fallbackDenial();
    if (reload && denialSurvivesReload) location.reload();
  }
  function close() {
    const dialog = document.getElementById('ka-privacy-dialog');
    if (dialog?.open) dialog.close();
  }
  function layout() {
    const banner = document.getElementById('ka-privacy-banner');
    if (!banner?.getBoundingClientRect) return;
    const box = banner.getBoundingClientRect();
    // Keep the chat launcher clear of the banner, including wrapped copy.
    const space = !banner.hidden && box.bottom >= window.innerHeight - 1 ? box.height : 0;
    document.documentElement.style.setProperty('--ka-cookie-banner-height', `${space}px`);
  }
  function refresh() {
    const choices = read();
    const banner = document.getElementById('ka-privacy-banner');
    const dialog = document.getElementById('ka-privacy-dialog');
    if (banner) banner.hidden = choices.chosen || !!dialog?.open;
    for (const category of ['analytics','marketing']) {
      const input = document.getElementById(`ka-choice-${category}`);
      if (input && !dialog?.open) input.checked = choices[category];
    }
    layout();
  }
  function save(analytics, marketingChoice) {
    lastChoiceAt = Date.now();
    const previous = read();
    const value = `v1.a${analytics ? 1 : 0}.m${marketingChoice ? 1 : 0}`;
    try { cookie(KEY, value, 15552000); } catch { /* Fail closed below. */ }
    const accepted = readCookie();
    if (!accepted.chosen || accepted.analytics !== analytics || accepted.marketing !== marketingChoice) {
      // A failed write must never keep an earlier permission active.
      deniedInMemory = true;
      let remembered = false;
      try { sessionStorage.setItem('ka_privacy_denied', '1'); remembered = fallbackDenial(); } catch { /* page-only denial */ }
      try { clearMarketingCookies(); } catch { /* browser may also block deletion */ }
      close(); refresh();
      document.getElementById('ka-privacy-error').textContent = remembered
        ? 'Your cookie choice could not be saved. Optional tracking is off for this tab. Use Cookie settings to retry.'
        : 'Your choice could not be saved. Optional tracking is off on this page. Your browser is blocking storage; repeat your choice on future pages.';
      stopMarketing(remembered);
      return;
    }
    deniedInMemory = false;
    try { sessionStorage.removeItem('ka_privacy_denied'); } catch { /* preferences still checked before events */ }
    document.getElementById('ka-privacy-error').textContent = '';
    close(); refresh();
    if (!marketingChoice) { try { clearMarketingCookies(); } catch { /* denial still takes effect */ } }
    window.dispatchEvent(new CustomEvent('ka:privacy-change', {detail: accepted}));
    // Tell other open tabs to stop a previously loaded vendor too. Failure is non-fatal.
    try { localStorage.setItem('ka_privacy_sync', String(Date.now())); } catch { /* cookies still hold the choice */ }
    if (previous.marketing && !marketingChoice) stopMarketing();
    else marketing();
  }
  function open() {
    mount();
    const dialog = document.getElementById('ka-privacy-dialog');
    if (dialog.open) return;
    refresh();
    returnFocus = document.activeElement;
    dialog.showModal();
    refresh();
  }
  function mount() {
    if (!document.body || document.getElementById('ka-privacy-root')) return;
    const root = document.createElement('div');
    root.id = 'ka-privacy-root';
    root.innerHTML = `
      <section id="ka-privacy-banner" aria-label="Cookie choices" hidden>
        <div class="ka-privacy-copy"><h2>Cookie choices</h2>
        <p>Analytics measures course use. Marketing measures ads and referrals. Both are optional and off until you agree. <a href="/privacy/">Privacy notice</a></p></div>
        <div class="ka-privacy-actions"><button type="button" data-ka-choice="accept">Accept all</button><button type="button" data-ka-choice="reject">Reject optional</button><button type="button" data-privacy-open>Cookie settings</button></div>
      </section>
      <dialog id="ka-privacy-dialog" aria-labelledby="ka-privacy-title" aria-describedby="ka-privacy-help">
        <h2 id="ka-privacy-title">Cookie settings</h2>
        <p id="ka-privacy-help">Necessary storage remembers these choices, course access and your saved learning progress. It stays available.</p>
        <label><input id="ka-choice-analytics" type="checkbox"><span><strong>Analytics</strong><br>Send course chapter views and completions to K&amp;A. These can be linked to your course signup.</span></label>
        <label><input id="ka-choice-marketing" type="checkbox"><span><strong>Marketing</strong><br>Load Meta advertising measurement and remember referral sources for later enquiries.</span></label>
        <p>Turning off Marketing reloads this page to stop a loaded pixel. Save unfinished form text first. Earlier records and course access are kept.</p>
        <div class="ka-privacy-actions"><button type="button" data-ka-choice="reject">Reject optional</button><button type="button" data-ka-choice="save">Save choices</button><button type="button" data-ka-choice="accept">Accept all</button><button type="button" data-ka-choice="close">Close</button></div>
        <a href="/privacy/">Privacy details</a>
      </dialog>
      <p id="ka-privacy-error" role="status"></p>`;
    document.body.append(root);
    if (typeof ResizeObserver === 'function') {
      bannerObserver?.disconnect();
      bannerObserver = new ResizeObserver(layout);
      bannerObserver.observe(document.getElementById('ka-privacy-banner'));
    }
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-ka-choice]')?.dataset.kaChoice;
      if (action === 'accept') save(true, true);
      if (action === 'reject') save(false, false);
      if (action === 'save') save(document.getElementById('ka-choice-analytics').checked, document.getElementById('ka-choice-marketing').checked);
      if (action === 'close') close();
    });
    document.getElementById('ka-privacy-dialog').addEventListener('close', () => {
      refresh();
      if (returnFocus?.isConnected && returnFocus.getClientRects().length) returnFocus.focus();
      else document.querySelector('footer [data-privacy-open]')?.focus({preventScroll: true});
    });
    document.getElementById('ka-privacy-dialog').addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]')].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    refresh();
    if (fallbackDenial()) document.getElementById('ka-privacy-error').textContent = 'Your cookie choice could not be saved. Optional tracking is off for this tab. Use Cookie settings to retry.';
  }
  window.KAPrivacy = Object.freeze({allows, source, open, requestHeaders() {
    const choices = read();
    return {'X-KA-Privacy': `v1.a${choices.analytics ? 1 : 0}.m${choices.marketing ? 1 : 0}`};
  }, trackLead() {
    if (allows('marketing') && pixelStarted) window.fbq?.('track', 'Lead');
  }});
  document.addEventListener('click', event => {
    if (event.target.closest('[data-privacy-open]')) { event.preventDefault(); open(); }
  });
  // A double-click must not activate a page link uncovered by dismissing
  // the banner on the first click.
  document.addEventListener('click', event => {
    if (event.detail > 1 && Date.now() - lastChoiceAt < 500) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  const onPage = () => { mount(); refresh(); marketing(); };
  document.addEventListener('astro:page-load', onPage);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onPage, {once: true});
  else onPage();
  const sync = () => { refresh(); if (pixelStarted && !allows('marketing')) stopMarketing(); };
  window.addEventListener('storage', event => { if (event.key === 'ka_privacy_sync') sync(); });
  window.addEventListener('focus', sync);
  window.addEventListener('resize', layout);
})();
