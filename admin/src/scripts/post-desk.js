// The Post Desk client, ported from the claude.ai artifact
// (Social Media Management/review/index.html). The server embeds the desk
// state in #desk-boot; this draws it, refreshes from /state on window focus
// (and when an installed app comes back to the front) and after each write,
// and saves with JSON POSTs to /decide and /check.
// Media src values are R2 keys ("<slug>/<item>/<file>"), served by /media.
import { deskMediaUrl } from '../lib/desk-media-url.js';
import { nextWaitingId, nextTargetId, positionOf, revertBody, isNoOp, sameState, toastMs, TOAST_CAP_MS } from '../lib/desk-nav.js';
import { esc, linkify, fmtTime, kindLabel, NET, netsOf } from '../lib/desk-format.js';
import { youtubePanel } from '../lib/desk-youtube.js';
import { deskCopy } from '../lib/desk-copy.js';
import { phoneBarState } from '../lib/desk-pwa.js';
import { storyState as storyStateOf, storyFocusId, STORY_FLAG } from '../lib/desk-stories.js';

const $ = (s, el = document) => el.querySelector(s);
const fmtDay = (d) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const fmtAt = (iso) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const boot = JSON.parse($('#desk-boot').textContent);
const { slug, canWrite, client, me } = boot;
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
const drafts = {};         // id -> unsent change note typed in the phone sheet
let sheetFor = null;       // id the change sheet is open for

// One pane at a time on a phone (the same breakpoint as the CSS): there,
// decisions never move the view on their own.
const phone = window.matchMedia('(max-width: 860px)');

// Toasts sit in a role=status region and never take focus. How long one
// stays is toastMs(): 10 seconds with an Undo button, 2.2 plain, and
// { reload: true } (a Reload button instead: an installed app has no browser
// chrome to reload from) up to the 20 second cap. A finger pressed on it, the
// pointer over it or focus in it holds it; letting go restarts the timeout.
const RELOAD_HINT = 'Your sign-in may have expired, so reload the page.';
const toastHolds = new Set();
function toast(msg, onUndo, { reload = false } = {}) {
  const u = $('#toastUndo');
  $('#toastMsg').textContent = msg;
  u.hidden = !onUndo;
  u.onclick = onUndo ? () => { hideToast(); onUndo(); } : null;
  $('#toastReload').hidden = !reload;
  clearTimeout(toast.clear);
  placeToast();
  $('#toast').classList.add('on');
  toast.ms = toastMs({ undo: !!onUndo, reload });
  clearTimeout(toast.cap);
  toast.cap = setTimeout(hideToast, TOAST_CAP_MS);
  armToast();
}
function armToast() {
  clearTimeout(toast.h);
  if (!toastHolds.size && $('#toast').classList.contains('on')) toast.h = setTimeout(hideToast, toast.ms);
}
function holdToast(why) { toastHolds.add(why); clearTimeout(toast.h); }
function releaseToast(why) { if (toastHolds.delete(why)) armToast(); }
function hideToast() {
  clearTimeout(toast.h); clearTimeout(toast.cap);
  toastHolds.clear();
  const t = $('#toast');
  // Focus never goes down with the toast: it returns to the decision buttons.
  const had = t.contains(document.activeElement);
  t.classList.remove('on');
  // Emptied once it has slid away (on a phone it slides down, ~180ms), unless
  // a new message has come in meanwhile.
  clearTimeout(toast.clear);
  toast.clear = setTimeout(() => {
    if (t.classList.contains('on')) return;
    $('#toastMsg').textContent = '';
    $('#toastUndo').hidden = true;
    $('#toastReload').hidden = true;
  }, 200);
  if (had) ($('#go') || $('#undo') || $('.d-item[aria-current="true"]'))?.focus({ preventScroll: true });
}
$('#toastReload').onclick = () => location.reload();
// Where the toast docks (the CSS does the rest):
// - desktop: the bottom-left of the rail column, inside its width, so it never
//   covers the in-card status or buttons; bottom-center when there is no rail.
// - phone, deciding: flush on top of the decision bar (CSS reads --decide-h).
// - phone, otherwise: the bottom of the screen, lifted (--toast-lift) above the
//   on-screen keyboard and above an ask's Save answer while it is on screen.
function placeToast() {
  const s = desk.style;
  if (!phone.matches) {
    const r = $('#list').getBoundingClientRect();
    const rail = r.width > 0 && r.height > 0;
    desk.classList.toggle('toast-rail', rail);
    desk.classList.remove('toast-lifted');
    if (rail) {
      s.setProperty('--toast-left', `${Math.round(r.left)}px`);
      s.setProperty('--toast-w', `${Math.floor(r.width) - 4}px`);
    }
    return;
  }
  desk.classList.remove('toast-rail');
  let lift = 0;
  if (!desk.classList.contains('deciding')) {
    const vv = window.visualViewport;
    let edge = vv ? Math.min(innerHeight, vv.offsetTop + vv.height) : innerHeight;
    // Lifted over Save answer only where the strip would otherwise cover it.
    const bar = $('#saveAsk')?.closest('.d-bar');
    if (bar) {
      const r = bar.getBoundingClientRect(), h = $('#toast').offsetHeight || 60;
      if (r.top < edge && r.bottom > edge - h && r.top > 0) edge = r.top;
    }
    lift = Math.max(0, Math.round(innerHeight - edge));
  }
  desk.classList.toggle('toast-lifted', lift > 0);
  s.setProperty('--toast-lift', `${lift}px`);
}
const toastOn = () => $('#toast').classList.contains('on');
window.addEventListener('scroll', () => { if (toastOn()) placeToast(); }, { passive: true });
window.addEventListener('resize', () => { if (toastOn()) placeToast(); });
window.visualViewport?.addEventListener('resize', () => { if (toastOn()) placeToast(); });
// The ask's textarea taking or losing focus moves its Save answer (and the keyboard).
document.addEventListener('focusin', (e) => { if (e.target.id === 'ask-answer' && toastOn()) placeToast(); });
document.addEventListener('focusout', (e) => { if (e.target.id === 'ask-answer' && toastOn()) setTimeout(placeToast, 50); });
// Held open while pressed, hovered or focused, up to the 20 second cap. A
// press is let go wherever the finger lifts, so up and cancel are on the window.
$('#toast').addEventListener('pointerdown', () => holdToast('press'));
window.addEventListener('pointerup', () => releaseToast('press'));
window.addEventListener('pointercancel', () => releaseToast('press'));
$('#toast').addEventListener('mouseenter', () => holdToast('hover'));
$('#toast').addEventListener('mouseleave', () => releaseToast('hover'));
$('#toast').addEventListener('focusin', () => holdToast('focus'));
$('#toast').addEventListener('focusout', () => releaseToast('focus'));

function stateOf(it) {
  if (it.kind === 'native') return 'info';
  if (it.kind === 'ask') return decisions[it.id]?.decision === 'answered' ? 'approved' : 'waiting';
  return decisions[it.id]?.decision || 'waiting';
}
const stateLabel = { waiting: 'Waiting on you', approved: 'Approved', changes: 'Changes asked', info: 'Already scheduled' };
const askLabel = { waiting: 'Needs an answer', approved: 'Answered' };
const DOT = { waiting: 'amber', approved: 'green', changes: 'red', info: 'gray' };
const status = (st, label) => `<span class="level"><span class="dot ${DOT[st]}"></span>${esc(label)}</span>`;

// Stories are K&A's hand-posted routine; a client's desk has none.
const storiesOn = () => data.storyChecklist.length > 0 || data.storiesPaused;
// Alex's desk names Claude, the release folders and Metricool; a client's
// names none of K&A's tools, folders or files (lib/desk-copy.js).
const copy = deskCopy({ client, canWrite });
const connText = () => copy.conn(storiesOn());
// "Approved by Hannah": who made a decision, once there is one to name.
const byWhom = (st, d) => (st !== 'waiting' && d?.by ? ` by ${d.by}` : '');
// "Approved by Alex, Oct 5, 1:52 PM": the in-card bar and the phone bar say the same.
function labelOf(it) {
  const st = stateOf(it);
  const d = decisions[it.id] || {};
  const when = st !== 'waiting' && d.at ? `, ${fmtAt(d.at)}` : '';
  return stateLabel[st] + byWhom(st, d) + when;
}

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
  decisions = Object.fromEntries(s.decisions.map((d) => [d.item_id, { decision: d.decision, note: d.note, answers: d.answers || {}, answer: d.answer, at: d.decided_at, by: d.decided_by_name || '' }]));
  confirmed = structuredClone(decisions);
  checks = Object.fromEntries(s.checks.map((c) => [c.item_id, { posted: c.posted, at: c.checked_at }]));
  buildItems();
  // Mirrors the server render: no Stories tab for a site without Stories, and
  // the empty note in place of an empty rail when nothing is on the desk.
  $('#tabStories').hidden = !storiesOn();
  $('#deskEmpty').hidden = s.items.length > 0;
  $('.d-layout').hidden = s.items.length === 0;
  if (!storiesOn() && view === 'stories') setView('posts');
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
      <span class="k">${esc(kindLabel(it))}: ${status(st, label)}</span></button>`;
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
  return `<div class="stage"><p class="stage-note">${esc(copy.noMedia)}</p></div>`;
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
  const label = labelOf(it);
  // On a phone the sticky bar carries the state and buttons; the card keeps
  // only the change note, so the ids below are never on the page twice.
  if (phoneBar(it).status) {
    return st === 'changes' && d.note ? `<p class="d-readnote d-phone-note"><b>Change note:</b> ${esc(d.note)}</p>` : '';
  }
  if (!canWrite) {
    return `<div class="d-bar"><span class="state">${status(st, label)}</span>
      ${st === 'changes' && d.note ? `<p class="d-readnote"><b>Change note:</b> ${esc(d.note)}</p>` : ''}</div>`;
  }
  return `<div class="d-bar" id="bar">
    <span class="state">${status(st, label)}</span>
    <button type="button" class="btn quiet" id="fix"${busy}>Request changes</button>
    <button type="button" class="btn${st === 'approved' ? ' quiet' : ''}" id="go"${busy}>${st === 'approved' ? 'Approved' : 'Approve'}</button>
    ${st !== 'waiting' ? `<button type="button" class="btn quiet" id="undo"${busy}>Undo</button>` : ''}
    ${st !== 'waiting' && nextTargetId(items, it.id, stateOf) ? `<button type="button" class="btn d-next" id="nextPost">Next post</button>` : ''}
    <label class="sr" for="note">What should change?</label>
    <textarea class="d-note ${st === 'changes' ? 'open' : ''}" id="note" rows="3" maxlength="2000" placeholder="What should change? Be as rough as you like.">${esc(d.note || '')}</textarea>
    <div class="keys">Keys: J and K move between posts, A approves, C opens the change note.</div>
  </div>`;
}

// The phone's sticky decision bar (#phoneDecide, outside #detail so it can
// stay put while the post scrolls). None for asks and native posts, nor off a phone.
const phoneBar = (it) => (phone.matches && it ? phoneBarState(it, stateOf, canWrite, items) : { status: null, buttons: [] });
const PHONE_BTN = {
  changes: '<button type="button" class="btn quiet" id="fix"BUSY>Request changes</button>',
  approve: '<button type="button" class="btn" id="go"BUSY>Approve</button>',
  undo: '<button type="button" class="btn quiet" id="undo"BUSY>Undo</button>',
  next: '<button type="button" class="btn" id="nextPost">Next post</button>',
};

function fillPhoneBar(it) {
  const el = $('#phoneDecide');
  const { status: st, buttons } = phoneBar(it);
  if (!st) { el.innerHTML = ''; fillPhoneBar.key = ''; syncPhoneBar(); return; }
  const busy = pending.has(it.id) ? ' aria-disabled="true"' : '';
  // Waiting needs no status line: the two buttons say it.
  const line = st === 'waiting' && buttons.length ? ''
    : `<p class="state"><span class="dot ${DOT[st]}"></span><span class="lbl">${esc(labelOf(it))}</span></p>`;
  const btns = buttons.length ? `<div class="d-decide-btns">${buttons.map((b) => PHONE_BTN[b].replace('BUSY', busy)).join('')}</div>` : '';
  // Cross-fade only when the bar's state changes, not on every refresh.
  const key = `${it.id}:${st}:${buttons.join()}`;
  el.innerHTML = `<div class="d-decide-in${fillPhoneBar.key && key !== fillPhoneBar.key ? ' d-swap' : ''}">${line}${btns}</div>`;
  fillPhoneBar.key = key;
  syncPhoneBar();
}

// Shown only with a post open on the Approvals tab. The detail gets bottom
// padding the bar's height (--decide-h), so nothing hides under it.
function syncPhoneBar() {
  const el = $('#phoneDecide');
  const on = !!el.innerHTML && phone.matches && view === 'posts' && desk.classList.contains('viewing');
  el.hidden = !on;
  desk.classList.toggle('deciding', on);
  desk.style.setProperty('--decide-h', on ? `${el.getBoundingClientRect().height}px` : '0px');
  if ($('#toast').classList.contains('on')) placeToast();
}

// Redrawing replaces the controls, so focus is put back on the same one (or on
// Approve, when the one that had it is gone, as after Undo or Next post).
function renderDetail() {
  const el = $('#detail'), bar = $('#phoneDecide');
  const inside = () => el.contains(document.activeElement) || bar.contains(document.activeElement);
  const had = inside() ? document.activeElement.id : '';
  drawDetail();
  if (had && !inside()) (document.getElementById(had) || $('#go') || $('#undo'))?.focus({ preventScroll: true });
}

function drawDetail() {
  const it = items.find((i) => i.id === current);
  const el = $('#detail');
  fillPhoneBar(it);
  if (!it && !items.length) {
    el.innerHTML = `<div class="done-note"><p><b>Nothing waiting on you.</b></p>
      <p>${esc(copy.emptyDetail(storyList().length > 0))}</p></div>`;
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
    const askState = status(answered ? 'approved' : 'waiting', answered ? `Answered${byWhom('approved', d)}` : 'Needs an answer');
    el.innerHTML = `${back}<div class="d-card">
      <div class="d-meta"><span class="caps">Needs from you</span></div>
      <h2 class="hook">${esc(it.title)}</h2>
      <p>${linkify(it.detail)}</p>
      ${canWrite ? `<label for="ask-answer" class="alt">Your answer</label>
      <textarea id="ask-answer" rows="4" maxlength="1000" placeholder="${esc(it.placeholder || '')}">${esc(d.answer || '')}</textarea>
      <div class="d-bar"><span class="state">${askState}</span>
        <button type="button" class="btn" id="saveAsk">Save answer</button></div>`
      : `<div class="d-bar"><span class="state">${askState}</span>
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
          <div><h3>Link sticker URL</h3><div class="cap" id="sticker">${esc(it.stickerUrl || copy.stickerFallback)}</div>
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
  const nets = netsOf(it);
  const shownTab = nets.includes(tab) ? tab : nets[0];
  const capText = it[shownTab];
  const comment = shownTab === 'instagram' ? it.firstComment : shownTab === 'linkedin' ? it.linkedinComment : '';
  el.innerHTML = `${back}<div class="d-card">
    <div class="d-meta"><span class="caps">${esc(kindLabel(it))}</span><span>${esc(fmtDay(it.date))}, ${esc(fmtTime(it.time))}</span><span>${esc(it.pillar || '')}</span></div>
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
          ${shownTab === 'youtube' ? youtubePanel(it, mediaUrl) : `<div class="cap">${linkify(capText || 'No caption file.')}</div>`}
          ${comment ? `<p class="comment"><b>First comment:</b> ${linkify(comment)}</p>` : ''}
        </div>
        ${it.repost && copy.showInternalFacts ? `<div><h3>Your repost comment</h3><div class="cap" id="repostText">${esc(it.repost)}</div>
          <p><button type="button" class="copy" id="copyRepost">Copy</button> Paste this when you repost from your personal profile.</p></div>` : ''}
        <dl class="facts">
          ${copy.showInternalFacts ? `<dt>Folder</dt><dd>To Be Released/${esc(it.id)}</dd>` : ''}
          <dt>AI</dt><dd>${it.ai?.voice ? 'AI voice. ' : ''}${it.ai?.visuals ? 'AI visuals. ' : ''}${!it.ai?.voice && !it.ai?.visuals ? 'No AI voice or visuals' : ''}</dd>
          ${scheduled && copy.showInternalFacts ? `<dt>Metricool</dt><dd>${esc(scheduled)}</dd>` : ''}
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
  // Opening a post on a phone pushed a history entry; going back pops it, so
  // the hardware back button and this one end up in the same place.
  b.onclick = () => { if (history.state?.deskPost) history.back(); else showList(); };
  const pos = positionOf(items, current);
  $('#prevPost').onclick = () => pos.prevId && select(pos.prevId, true);
  $('#nextItem').onclick = () => pos.nextId && select(pos.nextId, true);
}

// One set of ids (#go #fix #undo #nextPost), in the card or in the phone bar.
function wireBar(it) {
  if (!canWrite) return;
  const note = $('#note');
  const go = $('#go'), fix = $('#fix');
  if (go) go.onclick = () => decide(it.id, 'approved');
  // On a phone, Request changes opens the sheet instead of the in-card note.
  if (fix) fix.onclick = !note ? () => openSheet(it.id) : () => {
    if (pending.has(it.id)) return;
    if (!note.classList.contains('open')) { note.classList.add('open'); note.focus(); return; }
    if (!note.value.trim()) { note.focus(); toast(copy.noteNeeded); return; }
    decide(it.id, 'changes', note.value.trim());
  };
  const u = $('#undo'); if (u) u.onclick = () => decide(it.id, 'waiting');
  const n = $('#nextPost'); if (n) n.onclick = () => { const id = nextTargetId(items, it.id, stateOf); if (id) select(id, true); };
}

// A button's label swapped for a moment ("Copied", "Preparing..."), then put
// back. Its width is held while it says something shorter, so nothing moves.
function swapLabel(btn, text, ms) {
  btn.dataset.label ||= btn.textContent;
  clearTimeout(btn.swapT);
  btn.style.minWidth = `${btn.offsetWidth}px`;
  btn.textContent = text;
  if (ms) btn.swapT = setTimeout(() => restoreLabel(btn), ms);
}
function restoreLabel(btn) {
  clearTimeout(btn.swapT);
  if (btn.dataset.label) btn.textContent = btn.dataset.label;
  btn.style.minWidth = '';
}

async function copyText(text, btn, sel = '#sticker') {
  try { await navigator.clipboard.writeText(text); swapLabel(btn, 'Copied', 2000); }
  catch {
    // No clipboard access: select the text so it can be copied by hand.
    const el = $(sel);
    if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    swapLabel(btn, phone.matches ? 'Selected, tap Copy' : 'Selected, press Ctrl+C', 6000);
  }
}

// Save image. On a phone that can share files (iOS Safari, Chrome on
// Android), the image goes to the share sheet, whose "Save Image" puts it in
// Photos, where Instagram can pick it up. Anywhere else the link's own
// download runs. The fetch is same-origin through the desk's media route.
const shareFiles = (files) => { try { return !!navigator.canShare?.({ files }); } catch { return false; } };
const canShareImages = () => phone.matches && typeof navigator.share === 'function'
  && shareFiles([new File([''], 'probe.jpg', { type: 'image/jpeg' })]);
const prepared = new Map(); // story id -> File, kept for a second tap
async function saveImage(s, btn) {
  if (btn.getAttribute('aria-busy') === 'true') return;
  let file = prepared.get(s.id);
  if (!file) {
    btn.setAttribute('aria-busy', 'true');
    btn.setAttribute('aria-disabled', 'true');
    swapLabel(btn, 'Preparing\u2026');
    try {
      const r = await fetch(mediaUrl(s), { credentials: 'same-origin' });
      if (!r.ok) throw new Error(String(r.status));
      const blob = await r.blob();
      const type = blob.type || (/\.png$/i.test(s.src || '') ? 'image/png' : 'image/jpeg');
      file = new File([blob], `${s.id}.${type === 'image/png' ? 'png' : 'jpg'}`, { type });
    } catch {
      toast(`Could not get the image. ${RELOAD_HINT}`, null, { reload: true });
      return;
    } finally {
      btn.removeAttribute('aria-busy');
      btn.removeAttribute('aria-disabled');
      restoreLabel(btn);
    }
  }
  if (!shareFiles([file])) { download(file); return; }
  try {
    await navigator.share({ files: [file] });
    prepared.delete(s.id);
    restoreLabel(btn);
  } catch (e) {
    if (e?.name === 'AbortError') { prepared.delete(s.id); restoreLabel(btn); return; } // closed the share sheet
    // iOS can refuse a share that waited on a download; the next tap is fresh.
    if (e?.name === 'NotAllowedError') { prepared.set(s.id, file); swapLabel(btn, 'Ready, tap to save'); return; }
    download(file);
  }
}
function download(file) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}
// Taps on a Save image link: the share path where it can run, else the
// link's own download. Shared by the rows and the zoom.
function onSaveClick(e, s) {
  if (!s || !canShareImages()) return;
  e.preventDefault();
  saveImage(s, e.currentTarget || e.target.closest('[data-save]'));
}

// The phone's change sheet. Its draft is kept per post until it is sent, so
// Cancel, Esc or a tap on the scrim lose nothing.
function openSheet(id) {
  if (pending.has(id)) return;
  sheetFor = id;
  const s = $('#changeSheet'), t = $('#sheetNote');
  const d = decisions[id] || {};
  t.value = drafts[id] ?? (d.decision === 'changes' ? d.note || '' : '');
  $('#sheetMsg').textContent = '';
  fitSheet();
  s.hidden = false;
  void s.offsetWidth; // lay it out closed first, so it slides up
  s.classList.add('open');
  t.focus({ preventScroll: true });
}
function closeSheet() {
  if (!sheetFor) return;
  drafts[sheetFor] = $('#sheetNote').value;
  sheetFor = null;
  const s = $('#changeSheet');
  s.classList.remove('open');
  s.hidden = true;
  ($('#fix') || $('#undo') || $('#back'))?.focus({ preventScroll: true });
}
async function sendSheet() {
  const id = sheetFor, note = $('#sheetNote').value.trim();
  if (!id) return;
  if (!note) { $('#sheetMsg').textContent = copy.noteNeeded; $('#sheetNote').focus(); return; }
  closeSheet();
  if (await decide(id, 'changes', note)) delete drafts[id];
}
// Above the on-screen keyboard: visualViewport shrinks when it opens.
function fitSheet() {
  const vv = window.visualViewport;
  const kb = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
  $('#changeSheet').style.setProperty('--kb', `${Math.round(kb)}px`);
}
window.visualViewport?.addEventListener('resize', () => sheetFor && fitSheet());
window.visualViewport?.addEventListener('scroll', () => sheetFor && fitSheet());
$('#sheetCancel').onclick = closeSheet;
$('#sheetScrim').onclick = closeSheet;
$('#sheetSend').onclick = sendSheet;
// Esc closes; Tab stays inside the sheet while it is open.
$('#changeSheet').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeSheet(); return; }
  if (e.key !== 'Tab') return;
  const f = [$('#sheetNote'), $('#sheetCancel'), $('#sheetSend')];
  const i = f.indexOf(document.activeElement);
  if (e.shiftKey ? i <= 0 : i === f.length - 1) { e.preventDefault(); f[e.shiftKey ? f.length - 1 : 0].focus(); }
});

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
    toast(`Not saved. ${RELOAD_HINT}`, null, { reload: true });
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
  decisions[id] = { ...(decisions[id] || {}), decision: body.decision, note: body.note, at: new Date().toISOString(), by: me };
  renderList(); renderDetail();
  let saved;
  try { saved = await write('decide', body); } finally { pending.delete(id); }
  if (current === id) renderDetail();
  return saved;
}

// True once the server has the decision.
async function decide(id, decision, note) {
  if (pending.has(id) || isNoOp(decisions[id], decision, note)) return false;
  const before = confirmed[id] ? { ...confirmed[id] } : undefined;
  const body = { item_id: id, decision, note: decision === 'changes' ? note : decision === 'waiting' ? '' : decisions[id]?.note || '' };
  if (!(await saveDecision(id, body))) return false;
  // A short tick under the thumb, where the phone supports it.
  if (phone.matches) try { navigator.vibrate?.(10); } catch {}
  if (decision === 'waiting') { toast('Reset to waiting'); return true; }
  const did = { decision: body.decision, note: body.note };
  toast(decision === 'approved' ? 'Approved' : 'Change request saved', () => revert(id, before, did));
  // With the rail beside it, approving moves on; on a phone the post stays put.
  if (decision === 'approved' && !phone.matches) advanceFrom(id);
  return true;
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
  decisions[id] = { ...(decisions[id] || {}), decision: text ? 'answered' : 'waiting', answer: text, at: new Date().toISOString(), by: me };
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
const storyState = (s, now = nyNow()) => storyStateOf(s, checks, now);
const weekOf = (d) => { const t = new Date(d + 'T12:00:00'); t.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
const storyList = () => data.storyChecklist || [];
let justTicked = null; // the Story whose box was just ticked, for its fill

function storyRow(s, now) {
  const st = storyState(s, now);
  const c = checks[s.id] || {};
  const f = STORY_FLAG[st];
  const flag = f ? status(f.dot, f.label) : '';
  const at = c.posted && c.at ? fmtAt(c.at) : '';
  const src = mediaUrl(s);
  const pop = c.posted && justTicked === s.id ? ' pop' : '';
  const posted = canWrite
    ? `<label class="posted-box ${c.posted ? 'on' : ''}${pop}" for="chk-${esc(s.id)}"><input type="checkbox" id="chk-${esc(s.id)}" data-check="${esc(s.id)}" ${c.posted ? 'checked' : ''}>
      <span>Posted${at ? `<span class="posted-at">${esc(at)}</span>` : ''}</span></label>`
    : `<p class="posted-read">${c.posted ? `Posted${at ? `<span class="posted-at">${esc(at)}</span>` : ''}` : 'Not posted yet'}</p>`;
  // Due now shares Today's look; the row class keeps both.
  return `<article class="srow ${st === 'due' ? 'today due' : st}" id="srow-${esc(s.id)}" aria-label="Story for ${esc(fmtDay(s.date))}">
    <button type="button" class="thumb" data-zoom="${esc(s.id)}" aria-label="Open the Story image for ${esc(fmtDay(s.date))}"><img src="${esc(src)}" alt="" loading="lazy"></button>
    <div class="sinfo">
      <div class="swhen"><strong>${esc(fmtDay(s.date))}</strong><span>${esc(fmtTime(s.time))}, after the reel</span>${flag}</div>
      ${s.condition ? `<p class="cond">${esc(s.condition)}</p>` : ''}
      <p class="stext"><span>Sticker text</span>${esc(s.stickerText)}</p>
      <p class="surl" id="url-${esc(s.id)}" title="${esc(s.stickerUrl)}">${esc(s.stickerUrl)}</p>
    </div>
    <div class="sacts"><button type="button" class="copy" data-copy="${esc(s.id)}">Copy URL</button><a class="copy" href="${esc(src)}" download data-save="${esc(s.id)}">Save image</a></div>
    ${posted}
  </article>`;
}

function renderStories() {
  const list = storyList(), now = nyNow();
  const count = (...k) => list.filter((s) => k.includes(storyState(s, now))).length;
  const today = count('due', 'today'), missed = count('missed');
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
  justTicked = null;
  $('#slist').innerHTML = html || (data.storiesPaused
    ? `<div class="done-note"><p><b>Stories are paused.</b></p><p>${esc(copy.storiesPaused)}</p></div>`
    : `<p class="d-muted">${esc(copy.noStories)}</p>`);
  $('.howto').hidden = !html;
  if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
}

// On a phone, opening the Stories tab lands on the first row needing action
// (due now, then later today, then the next one coming up), just under the
// tabs, which stick to the top there.
function landStories() {
  if (!phone.matches || view !== 'stories') return;
  const id = storyFocusId(storyList(), checks, nyNow());
  const row = id && document.getElementById(`srow-${id}`);
  if (!row) return;
  const tabs = $('.d-views').getBoundingClientRect();
  window.scrollTo({ top: Math.max(0, window.scrollY + row.getBoundingClientRect().top - tabs.height - 12) });
}

// Ticking says so with an Undo (sent as posted: false); a failed save puts
// the box back.
async function setPosted(id, on, { undo = true } = {}) {
  const prev = checks[id];
  checks[id] = { posted: on, at: new Date().toISOString() };
  if (on) justTicked = id;
  renderStories();
  if (await write('check', { item_id: id, posted: on })) {
    if (on && undo) toast('Marked posted', () => undoPosted(id));
    else toast(on ? 'Marked posted' : undo ? 'Unticked' : 'Undone');
  } else { if (prev) checks[id] = prev; else delete checks[id]; renderStories(); }
}
// Only unticks a Story still ticked: if it changed meanwhile, says so instead.
async function undoPosted(id) {
  await refresh();
  if (!checks[id]?.posted) { toast('Changed since, not undone'); return; }
  setPosted(id, false, { undo: false });
}

let zoomFrom = null; // the Story whose thumbnail opened the zoom
function zoom(s) {
  const d = $('#zoom');
  zoomFrom = s.id;
  $('#zoomImg').src = mediaUrl(s);
  $('#zoomImg').alt = `Story image for ${fmtDay(s.date)}. Sticker: ${s.stickerText}`;
  $('#zoomSave').href = mediaUrl(s);
  $('#zoomSave').dataset.save = s.id;
  $('#zoomUrl').textContent = s.stickerUrl || '';
  restoreLabel($('#zoomCopy')); restoreLabel($('#zoomSave'));
  d.showModal();
}
const zoomStory = () => storyList().find((x) => x.id === zoomFrom);
$('#zoomClose').onclick = () => $('#zoom').close();
$('#zoomCopy').onclick = (e) => { const s = zoomStory(); if (s) copyText(s.stickerUrl, e.currentTarget, '#zoomUrl'); };
$('#zoomSave').addEventListener('click', (e) => onSaveClick(e, zoomStory()));
// A tap anywhere but the image and the buttons closes it (the backdrop, or
// the dark stage around the image when it fills a phone screen).
$('#zoom').addEventListener('click', (e) => { if (e.target === e.currentTarget || e.target.id === 'zoomStage') e.currentTarget.close(); });
// Esc, Close or a backdrop tap: focus goes back to the thumbnail that opened
// it, even if the list was redrawn meanwhile.
$('#zoom').addEventListener('close', () => {
  const t = zoomFrom && $(`[data-zoom="${CSS.escape(zoomFrom)}"]`);
  if (t) t.focus({ preventScroll: true });
});

$('#slist').addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy],[data-zoom],[data-save]');
  if (!b) return;
  const s = storyList().find((x) => x.id === (b.dataset.copy || b.dataset.zoom || b.dataset.save));
  if (!s) return;
  if (b.dataset.save) {
    if (canShareImages()) { e.preventDefault(); saveImage(s, b); }
    return;
  }
  if (b.dataset.copy) copyText(s.stickerUrl, b, `#url-${CSS.escape(s.id)}`);
  else zoom(s);
});
$('#slist').addEventListener('change', (e) => { const c = e.target.closest('[data-check]'); if (c) setPosted(c.dataset.check, c.checked); });

function setView(v, { land = false } = {}) {
  view = v;
  desk.classList.toggle('on-stories', v === 'stories');
  $('#postsView').hidden = v !== 'posts';
  $('#storiesView').hidden = v !== 'stories';
  $('#postTally').hidden = v !== 'posts';
  $('#storyTally').hidden = v !== 'stories';
  $('#tabPosts').setAttribute('aria-selected', v === 'posts');
  $('#tabStories').setAttribute('aria-selected', v === 'stories');
  renderStories();
  syncPhoneBar();
  if (land) requestAnimationFrame(landStories);
}
// The remembered tab is per site, and only a tab click changes it: opening a
// client's desk (which has no Stories) never resets the K&A desk's choice.
const viewKey = `desk-view:${slug}`;
$('.d-views').addEventListener('click', (e) => {
  const b = e.target.closest('[data-go]');
  if (!b) return;
  setView(b.dataset.go, { land: true });
  try { localStorage.setItem(viewKey, b.dataset.go); } catch {}
});
setInterval(() => { if (!document.activeElement?.matches('textarea')) renderStories(); }, 60000);

// On a phone, going from the list to a post pushes one history entry (moving
// post to post inside the detail does not), so back returns to the list
// rather than out of the installed app.
function select(id, scroll, { push = true } = {}) {
  if (push && phone.matches && !desk.classList.contains('viewing')) history.pushState({ deskPost: true }, '');
  current = id;
  desk.classList.add('viewing');
  renderList(); renderDetail();
  if (scroll) window.scrollTo({ top: 0 });
}

function showList() {
  closeSheet();
  desk.classList.remove('viewing');
  syncPhoneBar();
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', (e) => {
  if (e.state?.deskPost && phone.matches && current) select(current, true, { push: false });
  else if (desk.classList.contains('viewing')) showList();
});
// A reload mid-post opens on the list; the stale entry would reopen it on back.
if (history.state?.deskPost) history.replaceState(null, '');
// Moving across the breakpoint swaps the in-card bar for the phone bar.
phone.addEventListener('change', () => { closeSheet(); renderDetail(); });

function advanceFrom(id) {
  const n = nextWaitingId(items, id, stateOf);
  clearTimeout(advanceTimer);
  if (n) advanceTimer = setTimeout(() => { if (current === id) select(n, true); }, 500);
}

$('#list').addEventListener('click', (e) => { const r = e.target.closest('.d-item'); if (r) select(r.dataset.id, phone.matches); });
document.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea,input') || e.target.closest('#toast') || sheetFor || view !== 'posts' || e.ctrlKey || e.metaKey || e.altKey) return;
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
    conn.textContent = connText();
  } catch {
    const msg = `Could not refresh from the server. ${RELOAD_HINT}`;
    conn.textContent = `${msg} `;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn quiet d-reload'; b.textContent = 'Reload';
    b.onclick = () => location.reload();
    conn.append(b);
    conn.classList.add('bad');
    // The header is hidden with a post open on a phone, so say it there too.
    if (phone.matches && desk.classList.contains('viewing')) toast(msg, null, { reload: true });
    return;
  }
  if (!items.some((x) => x.id === current)) current = (items.find((x) => stateOf(x) === 'waiting' && x.kind !== 'ask') || items[0])?.id || null;
  renderList();
  if (!document.activeElement?.matches('textarea')) renderDetail();
  renderStories();
}
// iOS does not reliably fire focus when an installed app resumes, so a page
// coming back into view refreshes too. Both often fire together: one fetch.
function resume() {
  if (resume.p) return;
  resume.p = refresh().finally(() => { resume.p = null; });
}
window.addEventListener('focus', resume);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') resume(); });
// iOS only shows :active on a tap when a touch listener exists.
document.addEventListener('touchstart', () => {}, { passive: true });

applyState(boot.state);
current = (items.find((x) => stateOf(x) === 'waiting' && x.kind !== 'ask') || items[0])?.id || null;
renderList(); renderDetail();
// Open on Stories when the link says #stories or nothing waits for approval; else the last view used.
// Never on a site without Stories.
let saved = null; try { saved = localStorage.getItem(viewKey); } catch {}
setView(storiesOn() && (location.hash === '#stories' || (storyList().length > 0 && (!items.length || saved === 'stories'))) ? 'stories' : 'posts', { land: true });
