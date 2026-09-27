// The Post Desk client, ported from the claude.ai artifact
// (Social Media Management/review/index.html). The server embeds the desk
// state in #desk-boot; this draws it, refreshes from /state on window focus
// and after each write, and saves with JSON POSTs to /decide and /check.
// Media src values are R2 keys ("<slug>/<item>/<file>"), served by /media.
import { deskMediaUrl } from '../lib/desk-media-url.js';
import { nextWaitingId, nextTargetId, positionOf, revertBody, isNoOp, sameState } from '../lib/desk-nav.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const linkify = (s) => esc(s).replace(/https?:\/\/[^\s<]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
const KIND = { reel: 'Reel', carousel: 'Carousel + FB video', linkedin: 'LinkedIn', post: 'Post', native: 'In Facebook', story: 'Story', ask: 'Question' };
const fmtTime = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const fmtDay = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const fmtAt = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const boot = JSON.parse($('#desk-boot').textContent);
const { slug, canWrite } = boot;
const base = `/sites/${slug}/social`;
const desk = $('#desk');
// Media entries and Stories carry src (the R2 key) and an optional v (version).
const mediaUrl = (m) => deskMediaUrl(slug, m?.src, m?.v);

let data = { posts: [], stories: [], asks: [], storyChecklist: [], storiesPaused: false };
let items = [];            // flat list the rail shows, in order
let current = null;        // selected item id
let decisions = {};        // id -> {decision, note, answers, answer, at}, with optimistic edits
let confirmed = {};        // the same, as last read from the server
const pending = new Set(); // ids with a decision save in flight
let advanceTimer = null;
let checks = {};           // story id -> {posted, at}
let view = 'posts';        // "posts" (approvals) or "stories" (checklist)
const slideIdx = {};
const mediaView = {};
let tab = 'facebook';

// One pane at a time on a phone (the same breakpoint as the CSS): there,
// decisions never move the view on their own.
const phone = window.matchMedia('(max-width: 860px)');

// Toasts sit in a role=status region and never take focus. One with an Undo
// button stays for 6 seconds, and holds while the pointer or focus is on it.
function toast(msg, onUndo) {
  const u = $('#toastUndo');
  $('#toastMsg').textContent = msg;
  u.hidden = !onUndo;
  u.onclick = onUndo ? () => { hideToast(); onUndo(); } : null;
  placeToast();
  $('#toast').classList.add('on');
  toast.ms = onUndo ? 6000 : 2200;
  clearTimeout(toast.cap);
  toast.cap = setTimeout(hideToast, 20000);
  armToast();
}
function armToast() { clearTimeout(toast.h); toast.h = setTimeout(hideToast, toast.ms); }
function hideToast() {
  clearTimeout(toast.h); clearTimeout(toast.cap);
  const t = $('#toast');
  // Focus never goes down with the toast: it returns to the decision buttons.
  const had = t.contains(document.activeElement);
  t.classList.remove('on');
  $('#toastMsg').textContent = '';
  $('#toastUndo').hidden = true;
  if (had) ($('#go') || $('.d-item[aria-current="true"]'))?.focus({ preventScroll: true });
}
// On a phone the toast sits just under the sticky top bar, wherever that is.
function placeToast() {
  const bar = $('.d-phonebar');
  const bottom = bar && bar.offsetParent ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
  desk.style.setProperty('--toast-top', `${Math.round(bottom) + 8}px`);
}
window.addEventListener('scroll', () => { if ($('#toast').classList.contains('on')) placeToast(); }, { passive: true });
// Held open while the pointer or focus is on it, up to the 20 second cap.
$('#toast').addEventListener('mouseenter', () => clearTimeout(toast.h));
$('#toast').addEventListener('mouseleave', armToast);
$('#toast').addEventListener('focusin', () => clearTimeout(toast.h));
$('#toast').addEventListener('focusout', armToast);

function stateOf(it) {
  if (it.kind === 'native') return 'info';
  if (it.kind === 'ask') return decisions[it.id]?.decision === 'answered' ? 'approved' : 'waiting';
  return decisions[it.id]?.decision || 'waiting';
}
const stateLabel = { waiting: 'Waiting on you', approved: 'Approved', changes: 'Changes asked', info: 'Already scheduled' };
const askLabel = { waiting: 'Needs an answer', approved: 'Answered' };
const DOT = { waiting: 'amber', approved: 'green', changes: 'red', info: 'gray' };
const status = (st, label) => `<span class="level"><span class="dot ${DOT[st]}"></span>${esc(label)}</span>`;

// The server's rows back into the artifact's data.json shape.
function applyState(s) {
  const of = (list, pred) => s.items.filter((i) => i.list === list && pred(i)).map((i) => i.payload);
  data = {
    posts: of('approve', (i) => i.kind !== 'story' && i.kind !== 'ask'),
    stories: of('approve', (i) => i.kind === 'story'),
    asks: of('approve', (i) => i.kind === 'ask'),
    storyChecklist: of('stories', () => true),
    storiesPaused: !!s.meta?.stories_paused,
  };
  decisions = Object.fromEntries(s.decisions.map((d) => [d.item_id, { decision: d.decision, note: d.note, answers: d.answers || {}, answer: d.answer, at: d.decided_at }]));
  confirmed = structuredClone(decisions);
  checks = Object.fromEntries(s.checks.map((c) => [c.item_id, { posted: c.posted, at: c.checked_at }]));
  buildItems();
  const dates = data.posts.map((p) => p.date).sort();
  if (dates.length) $('#week').textContent = `Queue ${fmtDay(dates[0])} to ${fmtDay(dates[dates.length - 1])}`;
}

function buildItems() {
  items = [];
  const byDate = {};
  for (const p of data.posts) (byDate[p.date] ||= []).push({ ...p, type: 'post' });
  for (const s of data.stories) (byDate[s.date] ||= []).push({ ...s, kind: 'story', type: 'story', time: '', title: 'Story with link sticker' });
  for (const d of Object.keys(byDate).sort()) {
    const g = byDate[d].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
    for (const it of g) items.push({ ...it, group: fmtDay(d) });
  }
  for (const a of data.asks) items.push({ ...a, kind: 'ask', type: 'ask', group: 'Needs from you' });
}

function renderTally() {
  const acts = items.filter((i) => i.kind !== 'native');
  const waiting = acts.filter((i) => stateOf(i) === 'waiting').length;
  $('#nWait').textContent = waiting;
  $('#nOk').textContent = acts.filter((i) => stateOf(i) === 'approved').length;
  $('#nFix').textContent = acts.filter((i) => stateOf(i) === 'changes').length;
  $('#cPosts').textContent = waiting ? waiting : '';
}

function renderList() {
  const nav = $('#list');
  if (!items.length) { nav.innerHTML = `<p class="d-muted">Nothing waiting on you.</p>`; renderTally(); return; }
  let html = '', g = null;
  for (const it of items) {
    if (it.group !== g) { if (g !== null) html += '</div>'; g = it.group; html += `<div class="group"><h2>${esc(g)}</h2>`; }
    const st = stateOf(it);
    const label = it.kind === 'ask' ? askLabel[st] : stateLabel[st];
    html += `<button type="button" class="d-item ${st}" data-id="${esc(it.id)}" aria-current="${it.id === current}">
      <span class="t">${esc(fmtTime(it.time))}</span>
      <span class="n">${esc(it.title)}</span>
      <span class="k">${esc(KIND[it.kind] || it.kind)}: ${status(st, label)}</span></button>`;
  }
  nav.innerHTML = html + '</div>';
  renderTally();
}

function mediaBlock(it) {
  if (it.type === 'story') return `<div class="stage"><img src="${esc(mediaUrl(it))}" alt="Story image for ${esc(fmtDay(it.date))}"></div>`;
  const media = it.media || [];
  const vids = media.filter((m) => m.role === 'video');
  const imgs = media.filter((m) => m.role === 'image');
  const thumb = media.find((m) => m.role === 'thumbnail');
  // A carousel posts as swipe slides on Instagram and as a video on Facebook.
  const both = vids.length && imgs.length;
  const shown = both ? (mediaView[it.id] || 'instagram') : null;
  const toggle = both ? `<div class="versions" role="tablist" aria-label="Two versions of this post">
      <p>Two versions of this post. Check both.</p>
      <button type="button" role="tab" aria-selected="${shown === 'instagram'}" data-view="instagram"><b>Instagram</b><span>${imgs.length} swipe slides</span></button>
      <button type="button" role="tab" aria-selected="${shown === 'facebook'}" data-view="facebook"><b>Facebook</b><span>Video of the slides</span></button></div>` : '';
  if (both && shown === 'instagram') return toggle + slidesBlock(it, imgs);
  if (vids.length) {
    return toggle + `<div class="stage"><video controls playsinline preload="metadata" ${thumb ? `poster="${esc(mediaUrl(thumb))}"` : ''} src="${esc(mediaUrl(vids[0]))}"></video></div>
      <p class="alt">Tap play for sound.${it.music ? ` Music: ${esc(it.music)}.` : ''}</p>`;
  }
  if (imgs.length) return slidesBlock(it, imgs) + (it.kind === 'linkedin'
    ? `<p class="alt">Posts on LinkedIn as a swipeable document: people page through these slides in the feed. No video, no music.</p>` : '');
  return `<div class="stage"><p class="stage-note">No media in this folder.</p></div>`;
}

function slidesBlock(it, imgs) {
  const i = Math.min(slideIdx[it.id] || 0, imgs.length - 1);
  return `<div class="stage" id="stage">
      <img src="${esc(mediaUrl(imgs[i]))}" alt="${esc(imgs[i].alt)}">
      <div class="pager"><button type="button" id="prevS" ${i === 0 ? 'disabled' : ''} aria-label="Previous slide">Prev</button>
        <span>${i + 1} / ${imgs.length}</span>
        <span class="dots">${imgs.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>
        <button type="button" id="nextS" ${i === imgs.length - 1 ? 'disabled' : ''} aria-label="Next slide">Next</button></div></div>`;
}

function actionBar(it) {
  const st = stateOf(it);
  // aria-disabled, not disabled, so the focused button keeps focus meanwhile.
  const busy = pending.has(it.id) ? ' aria-disabled="true"' : '';
  const d = decisions[it.id] || {};
  const when = st !== 'waiting' && d.at ? `, ${fmtAt(d.at)}` : '';
  if (!canWrite) {
    return `<div class="d-bar"><span class="state">${status(st, stateLabel[st] + when)}</span>
      ${st === 'changes' && d.note ? `<p class="d-readnote"><b>Change note:</b> ${esc(d.note)}</p>` : ''}</div>`;
  }
  return `<div class="d-bar" id="bar">
    <span class="state">${status(st, stateLabel[st] + when)}</span>
    <button type="button" class="btn quiet" id="fix"${busy}>Request changes</button>
    <button type="button" class="btn${st === 'approved' ? ' quiet' : ''}" id="go"${busy}>${st === 'approved' ? 'Approved' : 'Approve'}</button>
    ${st !== 'waiting' ? `<button type="button" class="btn quiet" id="undo"${busy}>Undo</button>` : ''}
    ${st !== 'waiting' && nextTargetId(items, it.id, stateOf) ? `<button type="button" class="btn d-next" id="nextPost">Next post</button>` : ''}
    <label class="sr" for="note">What should change?</label>
    <textarea class="d-note ${st === 'changes' ? 'open' : ''}" id="note" rows="3" maxlength="2000" placeholder="What should change? Be as rough as you like.">${esc(d.note || '')}</textarea>
    <div class="keys">Keys: J and K move between posts, A approves, C opens the change note.</div>
  </div>`;
}

// Redrawing replaces the controls, so focus is put back on the same one (or on
// Approve, when the one that had it is gone, as after Undo or Next post).
function renderDetail() {
  const el = $('#detail');
  const had = el.contains(document.activeElement) ? document.activeElement.id : '';
  drawDetail();
  if (had && !el.contains(document.activeElement)) (document.getElementById(had) || $('#go'))?.focus({ preventScroll: true });
}

function drawDetail() {
  const it = items.find((i) => i.id === current);
  const el = $('#detail');
  if (!it && !items.length) {
    el.innerHTML = `<div class="done-note"><p><b>Nothing waiting on you.</b></p>
      <p>New posts show up here after Claude builds them.${storyList().length ? ' The Stories you post by hand are under Stories.' : ''}</p></div>`;
    return;
  }
  if (!it) { el.innerHTML = `<p class="d-muted">Pick a post on the left.</p>`; return; }
  // On a phone only one pane shows, so the detail carries its own way around.
  const pos = positionOf(items, it.id);
  const back = `<div class="d-phonebar">
    <button type="button" class="btn quiet" id="back">All posts</button>
    <span class="d-pos"><span class="sr">Post </span>${pos.index} of ${pos.total}</span>
    <button type="button" class="d-step" id="prevPost" aria-label="Previous post in the list"${pos.prevId ? '' : ' disabled'}>Previous</button>
    <button type="button" class="d-step" id="nextItem" aria-label="Next post in the list"${pos.nextId ? '' : ' disabled'}>Next</button>
  </div>`;

  if (it.type === 'ask') {
    const d = decisions[it.id] || {};
    const answered = d.decision === 'answered';
    el.innerHTML = `${back}<div class="d-card">
      <div class="d-meta"><span class="caps">Needs from you</span></div>
      <h2 class="hook">${esc(it.title)}</h2>
      <p>${linkify(it.detail)}</p>
      ${canWrite ? `<label for="ask-answer" class="alt">Your answer</label>
      <textarea id="ask-answer" rows="4" maxlength="1000" placeholder="${esc(it.placeholder || '')}">${esc(d.answer || '')}</textarea>
      <div class="d-bar"><span class="state">${status(answered ? 'approved' : 'waiting', answered ? 'Answered' : 'Needs an answer')}</span>
        <button type="button" class="btn" id="saveAsk">Save answer</button></div>`
      : `<div class="d-bar"><span class="state">${status(answered ? 'approved' : 'waiting', answered ? 'Answered' : 'Needs an answer')}</span>
        ${d.answer ? `<p class="d-readnote">${esc(d.answer)}</p>` : ''}</div>`}</div>`;
    const save = $('#saveAsk');
    if (save) save.onclick = () => saveAsk(it.id, $('#ask-answer').value.trim());
    wireBack();
    return;
  }

  if (it.type === 'story') {
    el.innerHTML = `${back}<div class="d-card">
      <div class="d-meta"><span class="caps">Story</span><span>${esc(fmtDay(it.date))}</span><span>Post by hand in the Instagram app</span></div>
      <h2 class="hook">Story with a link sticker</h2>
      <div class="d-body">${mediaBlock(it)}
        <div class="d-side">
          ${it.stickerText ? `<div><h3>Sticker text</h3><p class="flush">${esc(it.stickerText)}</p></div>` : ''}
          <div><h3>Link sticker URL</h3><div class="cap" id="sticker">${esc(it.stickerUrl || 'See stories/README.md')}</div>
          <p><button type="button" class="copy" id="copySticker">Copy URL</button></p></div>
          <p>Post the image as a Story, add a Link sticker over the dashed box, and paste this URL. The tag at the end tells us the visit came from this Story.</p>
        </div></div>${actionBar(it)}</div>`;
    $('#copySticker').onclick = (e) => copyText(it.stickerUrl, e.target);
    wireBar(it); wireBack();
    return;
  }

  const d = decisions[it.id] || {};
  const scheduled = Object.entries(it.scheduled || {}).map(([n, v]) => `${n[0].toUpperCase() + n.slice(1)} ${v.draft ? 'draft' : 'scheduled'} ${v.id}`).join(', ');
  const qs = (it.questions || []).map((q, k) => `<div class="q"><p>${linkify(q)}</p>
      ${canWrite
        ? `<textarea data-q="${k}" rows="2" maxlength="1000" aria-label="Your answer" placeholder="Your answer (optional)">${esc(d.answers?.[k] || '')}</textarea>`
        : d.answers?.[k] ? `<p class="d-readnote"><b>Answer:</b> ${esc(d.answers[k])}</p>` : ''}</div>`).join('');
  // Caption tabs follow the networks this post goes to (a LinkedIn-only post shows one tab).
  const nets = (it.networks && it.networks.length ? it.networks : ['facebook', 'instagram']);
  const shownTab = nets.includes(tab) ? tab : nets[0];
  const NET = { facebook: 'Facebook caption', instagram: 'Instagram caption', linkedin: 'LinkedIn post' };
  const capText = it[shownTab];
  const comment = shownTab === 'instagram' ? it.firstComment : shownTab === 'linkedin' ? it.linkedinComment : '';
  el.innerHTML = `${back}<div class="d-card">
    <div class="d-meta"><span class="caps">${esc(KIND[it.kind] || it.kind)}</span><span>${esc(fmtDay(it.date))}, ${esc(fmtTime(it.time))}</span><span>${esc(it.pillar || '')}</span></div>
    <h2 class="hook">${esc(it.hook || it.title)}</h2>
    ${it.kind === 'native' ? `<p>Scheduled directly in Facebook. Nothing to approve here.</p>` : `
    <div class="d-body">
      <div>${mediaBlock(it)}</div>
      <div class="d-side">
        ${qs ? `<div><h3>Questions for you</h3>${qs}</div>` : ''}
        <div>
          <div class="d-tabs" role="tablist">
            ${nets.map((n) => `<button type="button" role="tab" aria-selected="${shownTab === n}" data-tab="${esc(n)}">${NET[n] || esc(n)}</button>`).join('')}
          </div>
          <div class="cap">${linkify(capText || 'No caption file.')}</div>
          ${comment ? `<p class="comment"><b>First comment:</b> ${linkify(comment)}</p>` : ''}
        </div>
        ${it.repost ? `<div><h3>Your repost comment</h3><div class="cap" id="repostText">${esc(it.repost)}</div>
          <p><button type="button" class="copy" id="copyRepost">Copy</button> Paste this when you repost from your personal profile.</p></div>` : ''}
        <dl class="facts">
          <dt>Folder</dt><dd>To Be Released/${esc(it.id)}</dd>
          <dt>AI</dt><dd>${it.ai?.voice ? 'AI voice. ' : ''}${it.ai?.visuals ? 'AI visuals. ' : ''}${!it.ai?.voice && !it.ai?.visuals ? 'No AI voice or visuals' : ''}</dd>
          ${scheduled ? `<dt>Metricool</dt><dd>${esc(scheduled)}</dd>` : ''}
        </dl>
      </div>
    </div>${actionBar(it)}`}</div>`;

  el.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => { tab = b.dataset.tab; renderDetail(); }));
  const cr = $('#copyRepost');
  if (cr) cr.onclick = (e) => copyText(it.repost, e.target, '#repostText');
  el.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => { mediaView[it.id] = b.dataset.view; tab = b.dataset.view; renderDetail(); }));
  el.querySelectorAll('textarea[data-q]').forEach((t) => (t.onchange = () => saveAnswer(it.id, +t.dataset.q, t.value.trim())));
  const prev = $('#prevS'), next = $('#nextS');
  if (prev) prev.onclick = () => { slideIdx[it.id] = Math.max(0, (slideIdx[it.id] || 0) - 1); renderDetail(); };
  if (next) next.onclick = () => { slideIdx[it.id] = (slideIdx[it.id] || 0) + 1; renderDetail(); };
  const stage = $('#stage');
  if (stage) {
    let x0 = null;
    stage.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 40) (dx < 0 ? next : prev)?.click(); });
  }
  if (it.kind !== 'native') wireBar(it);
  wireBack();
}

function wireBack() {
  const b = $('#back');
  if (!b) return;
  b.onclick = () => { desk.classList.remove('viewing'); window.scrollTo(0, 0); };
  const pos = positionOf(items, current);
  $('#prevPost').onclick = () => pos.prevId && select(pos.prevId, true);
  $('#nextItem').onclick = () => pos.nextId && select(pos.nextId, true);
}

function wireBar(it) {
  if (!canWrite) return;
  const note = $('#note');
  $('#go').onclick = () => decide(it.id, 'approved');
  $('#fix').onclick = () => {
    if (pending.has(it.id)) return;
    if (!note.classList.contains('open')) { note.classList.add('open'); note.focus(); return; }
    if (!note.value.trim()) { note.focus(); toast('Add a note so I know what to change'); return; }
    decide(it.id, 'changes', note.value.trim());
  };
  const u = $('#undo'); if (u) u.onclick = () => decide(it.id, 'waiting');
  const n = $('#nextPost'); if (n) n.onclick = () => { const id = nextTargetId(items, it.id, stateOf); if (id) select(id, true); };
}

async function copyText(text, btn, sel = '#sticker') {
  try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents($(sel)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected, press Ctrl+C'; }
}

// Saves, then refreshes from the server either way, so the page always ends
// up showing what was actually stored.
async function write(path, body) {
  if (!canWrite) return null;
  let saved = null;
  try {
    const r = await fetch(`${base}/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin',
    });
    if (r.ok) saved = await r.json();
    else {
      const e = await r.json().catch(() => ({}));
      toast(r.status === 403 ? 'Your access level cannot save here' : e.error || 'Not saved, try again');
    }
  } catch {
    toast('Not saved. Your sign-in may have expired, so reload the page.');
  }
  await refresh();
  return saved;
}

// One decision save at a time per item, and none at all when it would change
// nothing (a double tap, or Approve on an approved post), so an Undo always
// has a real "before": the last state the server confirmed. Answers are left
// out of the body; the server keeps them.
async function saveDecision(id, body) {
  pending.add(id);
  decisions[id] = { ...(decisions[id] || {}), decision: body.decision, note: body.note, at: new Date().toISOString() };
  renderList(); renderDetail();
  let saved;
  try { saved = await write('decide', body); } finally { pending.delete(id); }
  if (current === id) renderDetail();
  return saved;
}

async function decide(id, decision, note) {
  if (pending.has(id) || isNoOp(decisions[id], decision, note)) return;
  const before = confirmed[id] ? { ...confirmed[id] } : undefined;
  const body = { item_id: id, decision, note: decision === 'changes' ? note : decision === 'waiting' ? '' : decisions[id]?.note || '' };
  if (!(await saveDecision(id, body))) return;
  if (decision === 'waiting') { toast('Reset to waiting'); return; }
  const did = { decision: body.decision, note: body.note };
  toast(decision === 'approved' ? 'Approved' : 'Change request saved', () => revert(id, before, did));
  // With the rail beside it, approving moves on; on a phone the post stays put.
  if (decision === 'approved' && !phone.matches) advanceFrom(id);
}

// The toast's Undo: puts that item back as it was, wherever the view is now,
// but only if it still holds what that decision saved. Answers stay as they are.
async function revert(id, before, did) {
  clearTimeout(advanceTimer);
  await refresh();
  if (pending.has(id) || !sameState(decisions[id], did)) { toast('Changed since, not undone'); return; }
  if (await saveDecision(id, revertBody(id, before))) toast('Undone');
}

async function saveAnswer(id, k, text) {
  const prev = decisions[id] || {};
  const answers = { ...(prev.answers || {}), [k]: text };
  decisions[id] = { decision: 'waiting', ...prev, answers };
  if (await write('decide', { item_id: id, decision: prev.decision || 'waiting', note: prev.note || '', answers })) toast('Answer saved');
}

async function saveAsk(id, text) {
  decisions[id] = { ...(decisions[id] || {}), decision: text ? 'answered' : 'waiting', answer: text, at: new Date().toISOString() };
  renderList(); renderDetail();
  if (await write('decide', { item_id: id, decision: text ? 'answered' : 'waiting', answer: text })) toast(text ? 'Answer saved' : 'Answer cleared');
}

// Stories checklist: every upcoming Story, ticked off as Alex posts it by hand.
// "Today" and "missed" follow the clock in Gainesville, wherever the page is opened.
function nyNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
function storyState(s, now = nyNow()) {
  if (checks[s.id]?.posted) return 'posted';
  if (s.date < now.date) return 'missed';
  return s.date === now.date ? 'today' : 'upcoming';
}
const weekOf = (d) => { const t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const storyList = () => data.storyChecklist || [];

function storyRow(s, now) {
  const st = storyState(s, now);
  const c = checks[s.id] || {};
  const flag = st === 'posted' ? status('approved', 'Posted')
    : st === 'missed' ? status('waiting', 'Not ticked')
    : st === 'today' ? status('changes', now.time >= s.time ? 'Due now' : 'Today') : '';
  const at = c.posted && c.at ? fmtAt(c.at) : '';
  const src = mediaUrl(s);
  const posted = canWrite
    ? `<label class="posted-box ${c.posted ? 'on' : ''}" for="chk-${esc(s.id)}"><input type="checkbox" id="chk-${esc(s.id)}" data-check="${esc(s.id)}" ${c.posted ? 'checked' : ''}>
      <span>Posted${at ? `<span class="posted-at">${esc(at)}</span>` : ''}</span></label>`
    : `<p class="posted-read">${c.posted ? `Posted${at ? `<span class="posted-at">${esc(at)}</span>` : ''}` : 'Not posted yet'}</p>`;
  return `<article class="srow ${st}" aria-label="Story for ${esc(fmtDay(s.date))}">
    <button type="button" class="thumb" data-zoom="${esc(s.id)}" aria-label="Open the Story image for ${esc(fmtDay(s.date))}"><img src="${esc(src)}" alt="" loading="lazy"></button>
    <div class="sinfo">
      <div class="swhen"><strong>${esc(fmtDay(s.date))}</strong><span>${esc(fmtTime(s.time))}, after the reel</span>${flag}</div>
      ${s.condition ? `<p class="cond">${esc(s.condition)}</p>` : ''}
      <p class="stext"><span>Sticker text</span>${esc(s.stickerText)}</p>
      <p class="surl" id="url-${esc(s.id)}">${esc(s.stickerUrl)}</p>
      <div class="sacts"><button type="button" class="copy" data-copy="${esc(s.id)}">Copy URL</button><a class="copy" href="${esc(src)}" download>Save image</a></div>
    </div>
    ${posted}
  </article>`;
}

function renderStories() {
  const list = storyList(), now = nyNow();
  const count = (k) => list.filter((s) => storyState(s, now) === k).length;
  const today = count('today'), missed = count('missed');
  $('#sToday').textContent = today;
  $('#sMissed').textContent = missed;
  $('#sDone').textContent = count('posted');
  $('#cStories').textContent = today + missed ? today + missed : '';
  if (view !== 'stories') return;
  const focused = document.activeElement?.id;
  let html = '', wk = null;
  for (const s of list) {
    const w = weekOf(s.date);
    if (w !== wk) { wk = w; html += `<h2 class="shead">Week of ${esc(w)}</h2>`; }
    html += storyRow(s, now);
  }
  $('#slist').innerHTML = html || (data.storiesPaused
    ? `<div class="done-note"><p><b>Stories are paused.</b></p><p>Nothing to post by hand for now. Ask Claude to turn them back on when you have time for them.</p></div>`
    : `<p class="d-muted">No Stories on the schedule. Ask Claude to rebuild the desk after the next week is planned.</p>`);
  $('.howto').hidden = !html;
  if (focused) document.getElementById(focused)?.focus();
}

async function setPosted(id, on) {
  const prev = checks[id];
  checks[id] = { posted: on, at: new Date().toISOString() };
  renderStories();
  if (await write('check', { item_id: id, posted: on })) toast(on ? 'Marked posted' : 'Unticked');
  else { if (prev) checks[id] = prev; else delete checks[id]; renderStories(); }
}

function zoom(s) {
  const d = $('#zoom');
  $('#zoomImg').src = mediaUrl(s);
  $('#zoomImg').alt = `Story image for ${fmtDay(s.date)}. Sticker: ${s.stickerText}`;
  $('#zoomSave').href = mediaUrl(s);
  d.showModal();
}
$('#zoomClose').onclick = () => $('#zoom').close();
$('#zoom').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

$('#slist').addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy],[data-zoom]');
  if (!b) return;
  const s = storyList().find((x) => x.id === (b.dataset.copy || b.dataset.zoom));
  if (!s) return;
  if (b.dataset.copy) copyText(s.stickerUrl, b, `#url-${CSS.escape(s.id)}`);
  else zoom(s);
});
$('#slist').addEventListener('change', (e) => { const c = e.target.closest('[data-check]'); if (c) setPosted(c.dataset.check, c.checked); });

function setView(v) {
  view = v;
  $('#postsView').hidden = v !== 'posts';
  $('#storiesView').hidden = v !== 'stories';
  $('#postTally').hidden = v !== 'posts';
  $('#storyTally').hidden = v !== 'stories';
  $('#tabPosts').setAttribute('aria-selected', v === 'posts');
  $('#tabStories').setAttribute('aria-selected', v === 'stories');
  try { localStorage.setItem('desk-view', v); } catch {}
  renderStories();
}
$('.d-views').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) setView(b.dataset.go); });
setInterval(() => { if (!document.activeElement?.matches('textarea')) renderStories(); }, 60000);

function select(id, scroll) {
  current = id;
  desk.classList.add('viewing');
  renderList(); renderDetail();
  if (scroll) window.scrollTo({ top: 0 });
}

function advanceFrom(id) {
  const n = nextWaitingId(items, id, stateOf);
  clearTimeout(advanceTimer);
  if (n) advanceTimer = setTimeout(() => { if (current === id) select(n, true); }, 500);
}

$('#list').addEventListener('click', (e) => { const r = e.target.closest('.d-item'); if (r) select(r.dataset.id, phone.matches); });
document.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea,input') || e.target.closest('#toast') || view !== 'posts' || e.ctrlKey || e.metaKey || e.altKey) return;
  const i = items.findIndex((x) => x.id === current);
  if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); if (i < items.length - 1) select(items[i + 1].id); }
  else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); if (i > 0) select(items[i - 1].id); }
  else if (e.key === 'a' && $('#go')) $('#go').click();
  else if (e.key === 'c' && $('#fix')) { e.preventDefault(); $('#fix').click(); }
  else if (e.key === 'ArrowRight' && $('#nextS')) $('#nextS').click();
  else if (e.key === 'ArrowLeft' && $('#prevS')) $('#prevS').click();
});

async function refresh() {
  const conn = $('#conn');
  try {
    const r = await fetch(`${base}/state`, { headers: { Accept: 'application/json' }, cache: 'no-store', credentials: 'same-origin' });
    if (!r.ok) throw new Error(String(r.status));
    applyState(await r.json());
    conn.classList.remove('bad');
    conn.textContent = canWrite
      ? 'Decisions and Story ticks save as you make them. Claude reads them from here.'
      : 'Read only. Only the owner can approve posts or tick Stories.';
  } catch {
    conn.textContent = 'Could not refresh from the server. Your sign-in may have expired, so reload the page.';
    conn.classList.add('bad');
    return;
  }
  if (!items.some((x) => x.id === current)) current = (items.find((x) => stateOf(x) === 'waiting' && x.kind !== 'ask') || items[0])?.id || null;
  renderList();
  if (!document.activeElement?.matches('textarea')) renderDetail();
  renderStories();
}
window.addEventListener('focus', refresh);

applyState(boot.state);
current = (items.find((x) => stateOf(x) === 'waiting' && x.kind !== 'ask') || items[0])?.id || null;
renderList(); renderDetail();
// Open on Stories when the link says #stories or nothing waits for approval; else the last view used.
let saved = null; try { saved = localStorage.getItem('desk-view'); } catch {}
setView(location.hash === '#stories' || (storyList().length > 0 && (!items.length || saved === 'stories')) ? 'stories' : 'posts');
