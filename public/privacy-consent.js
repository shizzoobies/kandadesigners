/* Optional collection is off until an affirmative, category-specific choice. */
(() => {
  'use strict';
  if (window.KAPrivacy) return;
  const KEY = 'ka_privacy';
  const PIXEL = '1584105763055085';
  let pixelStarted = false;
  let lastPage = '';
  let returnFocus;
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
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  function refresh() {
    const choices = read();
    const banner = document.getElementById('ka-privacy-banner');
    if (banner) banner.hidden = choices.chosen;
    for (const category of ['analytics','marketing']) {
      const input = document.getElementById(`ka-choice-${category}`);
      if (input) input.checked = choices[category];
    }
  }
  function save(analytics, marketingChoice) {
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
        ? 'Your cookie choice could not be saved. Optional tracking is off for this tab. Use Privacy choices to retry.'
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
    mount(); refresh();
    returnFocus = document.activeElement;
    document.getElementById('ka-privacy-dialog').showModal();
  }
  function mount() {
    if (!document.body || document.getElementById('ka-privacy-root')) return;
    const root = document.createElement('div');
    root.id = 'ka-privacy-root';
    root.innerHTML = `
      <section id="ka-privacy-banner" aria-label="Privacy choices" hidden>
        <h2>Your privacy choices</h2>
        <p>Optional Analytics measures course use. Marketing measures ads and referrals. Both stay off until you agree. Forms and course access work with either choice.</p>
        <div class="ka-privacy-actions"><button type="button" data-ka-choice="reject">Reject optional</button><button type="button" data-ka-choice="accept">Accept all</button><button type="button" data-privacy-open>Customize</button></div>
        <a href="/privacy/">Privacy details</a>
      </section>
      <button id="ka-privacy-settings" type="button" data-privacy-open>Privacy choices</button>
      <dialog id="ka-privacy-dialog" aria-labelledby="ka-privacy-title" aria-describedby="ka-privacy-help">
        <h2 id="ka-privacy-title">Privacy choices</h2>
        <p id="ka-privacy-help">Necessary storage remembers these choices, course access and your saved learning progress. It stays available.</p>
        <label><input id="ka-choice-analytics" type="checkbox"><span><strong>Analytics</strong><br>Send course chapter views and completions to K&amp;A. These can be linked to your course signup.</span></label>
        <label><input id="ka-choice-marketing" type="checkbox"><span><strong>Marketing</strong><br>Load Meta advertising measurement and remember referral sources for later enquiries.</span></label>
        <p>Turning off Marketing reloads this page to stop a loaded pixel. Save unfinished form text first. Earlier records and course access are kept.</p>
        <div class="ka-privacy-actions"><button type="button" data-ka-choice="reject">Reject optional</button><button type="button" data-ka-choice="save">Save choices</button><button type="button" data-ka-choice="accept">Accept all</button><button type="button" data-ka-choice="close">Close</button></div>
        <a href="/privacy/">Privacy details</a>
      </dialog>
      <p id="ka-privacy-error" role="status"></p>`;
    document.body.append(root);
    root.addEventListener('click', event => {
      const action = event.target.closest('[data-ka-choice]')?.dataset.kaChoice;
      if (action === 'accept') save(true, true);
      if (action === 'reject') save(false, false);
      if (action === 'save') save(document.getElementById('ka-choice-analytics').checked, document.getElementById('ka-choice-marketing').checked);
      if (action === 'close') close();
    });
    document.getElementById('ka-privacy-dialog').addEventListener('close', () => { if (returnFocus?.isConnected) returnFocus.focus(); });
    refresh();
    if (fallbackDenial()) document.getElementById('ka-privacy-error').textContent = 'Your cookie choice could not be saved. Optional tracking is off for this tab. Use Privacy choices to retry.';
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
  const onPage = () => { mount(); refresh(); marketing(); };
  document.addEventListener('astro:page-load', onPage);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onPage, {once: true});
  else onPage();
  const sync = () => { refresh(); if (pixelStarted && !allows('marketing')) stopMarketing(); };
  window.addEventListener('storage', event => { if (event.key === 'ka_privacy_sync') sync(); });
  window.addEventListener('focus', sync);
})();
