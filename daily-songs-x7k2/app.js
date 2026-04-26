import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc,
  query, orderBy, Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Firebase ─────────────────────────────

const firebaseConfig = {
  apiKey: 'AIzaSyB-FDi6pQCanc-LJpWvSA5qxitz62yH7TY',
  authDomain: 'daily-songs-89174.firebaseapp.com',
  projectId: 'daily-songs-89174',
  storageBucket: 'daily-songs-89174.firebasestorage.app',
  messagingSenderId: '351646460734',
  appId: '1:351646460734:web:d6ec9e807dcd6ad0365a6f',
};

const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);

// title -> Firestore doc ID. Loaded on init, kept in sync on toggle.
const bangerMap = new Map();

async function loadBangerMap() {
  try {
    const snap = await getDocs(collection(db, 'bangers'));
    snap.docs.forEach(d => bangerMap.set(d.data().title, d.id));
  } catch (err) {
    console.error('Could not load bangers:', err);
  }
}

async function loadUsedTitles() {
  try {
    const entries = await fetchHistory();
    entries.forEach(e => e.songs?.forEach(s => s.title && usedTitles.add(s.title)));
  } catch {
    // non-blocking, ignore errors
  }
}

async function saveGeneration(lane, songs) {
  const today = new Date().toISOString().slice(0, 10);
  await addDoc(collection(db, 'generations'), {
    date: today, lane, generatedAt: Timestamp.now(), songs,
  });
}

async function fetchHistory() {
  const q    = query(collection(db, 'generations'), orderBy('generatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchBangers() {
  const q    = query(collection(db, 'bangers'), orderBy('markedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Lanes ─────────────────────────────────

const LANES = [
  { id: 'cinematic_tech_underscore', label: 'Cinematic Tech Underscore (proven winner)' },
  { id: 'cinematic_aspirational',    label: 'Cinematic Aspirational / Lifestyle' },
  { id: 'moody_rnb_slowed',          label: 'Moody Slowed-Reverb R&B' },
  { id: 'nostalgic_piano',           label: 'Nostalgic Piano Throwback' },
  { id: 'funky_house',               label: 'Upbeat Funky House' },
  { id: 'neo_city_pop',              label: 'Neo City Pop' },
  { id: 'lofi_focus',                label: 'Lo-Fi Study / Focus' },
  { id: 'ambient_atmospheric',       label: 'Ambient Atmospheric' },
  { id: 'epic_trailer',              label: 'Cinematic Epic Trailer' },
  { id: 'corporate_inspirational',   label: 'Corporate Inspirational' },
];

const DEFAULT_LANE_ID = 'cinematic_tech_underscore';

const DURATIONS = [
  { value: 'varied',     label: 'Varied (30s - 2min)' },
  { value: '15 seconds', label: '15 seconds' },
  { value: '30 seconds', label: '30 seconds' },
  { value: '45 seconds', label: '45 seconds' },
  { value: '60 seconds', label: '60 seconds' },
  { value: '90 seconds', label: '90 seconds' },
  { value: '2 minutes',  label: '2 minutes' },
  { value: '3 minutes',  label: '3 minutes' },
  { value: '4 minutes',  label: '4 minutes' },
  { value: '5 minutes',  label: '5 minutes' },
  { value: '6 minutes',  label: '6 minutes' },
];

// ── State ─────────────────────────────────

let isGenerating = false;
let fromHistory  = false;
const usedTitles = new Set();

// ── Views ─────────────────────────────────

const views = {
  auth:      document.getElementById('view-auth'),
  generator: document.getElementById('view-generator'),
  results:   document.getElementById('view-results'),
  history:   document.getElementById('view-history'),
  bangers:   document.getElementById('view-bangers'),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[name].classList.remove('hidden');
}

// ── Loading state ─────────────────────────

function setGenerating(loading) {
  isGenerating = loading;
  const btn      = document.getElementById('generate-btn');
  const select   = document.getElementById('lane-select');
  const durSel   = document.getElementById('duration-select');
  if (loading) {
    btn.textContent  = 'Generating...';
    btn.classList.add('loading');
    btn.disabled     = true;
    select.disabled  = true;
    durSel.disabled  = true;
  } else {
    btn.textContent  = 'Generate 5 Songs';
    btn.classList.remove('loading');
    btn.disabled     = false;
    select.disabled  = false;
    durSel.disabled  = false;
  }
}

// ── Auth ──────────────────────────────────

document.getElementById('auth-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input   = document.getElementById('passphrase-input');
  const errorEl = document.getElementById('auth-error');
  const btn     = document.getElementById('auth-btn');

  errorEl.classList.add('hidden');
  btn.disabled    = true;
  btn.textContent = 'Checking...';

  try {
    const res  = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: input.value }),
    });
    const data = await res.json();
    if (res.ok) {
      showView('generator');
    } else {
      errorEl.textContent = data.error || 'Wrong passphrase.';
      errorEl.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  } catch {
    errorEl.textContent = 'Connection error. Please try again.';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Enter';
  }
});

// ── Generation ────────────────────────────

async function generate() {
  if (isGenerating) return;

  const lane     = document.getElementById('lane-select').value;
  const duration = document.getElementById('duration-select').value;
  const errorEl  = document.getElementById('generate-error');
  errorEl.classList.add('hidden');

  showView('generator');
  setGenerating(true);

  try {
    const res  = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane, duration, usedTitles: [...usedTitles] }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Generation failed. Please try again.');
    if (!Array.isArray(data.songs) || data.songs.length === 0) {
      throw new Error('Received an empty response. Please try again.');
    }

    data.songs.forEach(s => s.title && usedTitles.add(s.title));

    const today = new Date().toISOString().slice(0, 10);
    showResultsView(data.songs, lane, false, today);

    saveGeneration(lane, data.songs).catch(err => console.error('Save failed:', err));
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setGenerating(false);
  }
}

// ── Results ───────────────────────────────

function showResultsView(songs, lane, isHistory, date, isRemix = false) {
  fromHistory = isHistory;

  document.getElementById('results-lane-name').textContent = lane;

  const dateEl = document.getElementById('results-date');
  if (isRemix && date) {
    dateEl.textContent = `Remixed from ${formatHistoryDate(date)}`;
    dateEl.classList.remove('hidden');
  } else if (isHistory && date) {
    dateEl.textContent = formatHistoryDate(date);
    dateEl.classList.remove('hidden');
  } else {
    dateEl.classList.add('hidden');
  }

  const backToHistory = isHistory || isRemix;
  document.getElementById('change-lane-btn').classList.toggle('hidden', backToHistory);
  document.getElementById('back-to-history-btn').classList.toggle('hidden', !backToHistory);

  const container = document.getElementById('songs-container');
  container.innerHTML = '';
  songs.forEach((song, i) => {
    container.appendChild(buildSongCard(song, i + 1, songs.length, { lane, date }));
  });

  showView('results');
}

// ── History ───────────────────────────────

async function openHistory() {
  showView('history');
  const listEl = document.getElementById('history-list');
  listEl.innerHTML = '<p class="history-empty">Loading...</p>';

  try {
    const entries = await fetchHistory();
    if (entries.length === 0) {
      listEl.innerHTML = '<p class="history-empty">No generations yet. Generate some songs first.</p>';
      return;
    }
    const groups = new Map();
    for (const entry of entries) {
      if (!groups.has(entry.date)) groups.set(entry.date, []);
      groups.get(entry.date).push(entry);
    }
    listEl.innerHTML = '';
    for (const [date, dayEntries] of groups) {
      const group = document.createElement('div');
      group.className = 'history-group';
      const dateHeader = document.createElement('div');
      dateHeader.className = 'history-date';
      dateHeader.textContent = formatHistoryDate(date);
      group.appendChild(dateHeader);
      const list = document.createElement('div');
      list.className = 'history-entries';
      for (const entry of dayEntries) {
        const row = document.createElement('div');
        row.className = 'history-entry';
        row.innerHTML = `
          <div class="history-entry-info">
            <span class="history-entry-lane">${esc(entry.lane)}</span>
            <span class="history-entry-time">${formatTimestamp(entry.generatedAt)}</span>
          </div>
          <div class="history-entry-actions">
            <button class="btn-view-history">View</button>
            <button class="btn-remix-history">Remix</button>
          </div>
        `;
        row.querySelector('.btn-view-history').addEventListener('click', () => {
          showResultsView(entry.songs, entry.lane, true, entry.date);
        });
        row.querySelector('.btn-remix-history').addEventListener('click', (e) => {
          remixEntry(entry, e.currentTarget);
        });
        list.appendChild(row);
      }
      group.appendChild(list);
      listEl.appendChild(group);
    }
  } catch (err) {
    listEl.innerHTML = '<p class="history-error">Could not load history. Try again.</p>';
    console.error(err);
  }
}

// ── Bangers ───────────────────────────────

async function openBangers() {
  showView('bangers');
  const listEl = document.getElementById('bangers-list');
  listEl.innerHTML = '<p class="history-empty">Loading...</p>';

  try {
    const bangers = await fetchBangers();
    if (bangers.length === 0) {
      listEl.innerHTML = '<p class="history-empty">No bangers yet. Check the star on any song that performs well.</p>';
      return;
    }
    listEl.innerHTML = '';
    bangers.forEach((banger, i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'banger-card-wrapper';

      const laneTag = document.createElement('p');
      laneTag.className = 'banger-lane-tag';
      laneTag.textContent = banger.lane || '';
      wrapper.appendChild(laneTag);

      const card = buildSongCard(
        banger, i + 1, bangers.length,
        { lane: banger.lane, date: banger.date, showRemoveBtn: true, docId: banger.id }
      );
      wrapper.appendChild(card);
      listEl.appendChild(wrapper);
    });
  } catch (err) {
    listEl.innerHTML = '<p class="history-error">Could not load bangers. Try again.</p>';
    console.error(err);
  }
}

async function toggleBanger(song, meta, btn) {
  btn.disabled = true;
  const title = song.title;

  try {
    if (bangerMap.has(title)) {
      await deleteDoc(doc(db, 'bangers', bangerMap.get(title)));
      bangerMap.delete(title);
      btn.classList.remove('starred');
      btn.innerHTML = `${starSVG(false)}<span>Mark as Banger</span>`;
    } else {
      const docRef = await addDoc(collection(db, 'bangers'), {
        title:    song.title,
        prompt:   song.prompt,
        description: song.description,
        tags:     song.tags,
        lane:     meta.lane || '',
        date:     meta.date || new Date().toISOString().slice(0, 10),
        markedAt: Timestamp.now(),
      });
      bangerMap.set(title, docRef.id);
      btn.classList.add('starred');
      btn.innerHTML = `${starSVG(true)}<span>Banger</span>`;
    }
  } catch (err) {
    console.error('Banger toggle failed:', err);
  } finally {
    btn.disabled = false;
  }
}

async function removeBanger(docId, title, card) {
  try {
    await deleteDoc(doc(db, 'bangers', docId));
    bangerMap.delete(title);
    card.closest('.banger-card-wrapper')?.remove() ?? card.remove();
  } catch (err) {
    console.error('Remove banger failed:', err);
  }
}

// ── Remix ─────────────────────────────────

async function remixEntry(entry, btn) {
  const originalText = btn.textContent;
  btn.textContent = 'Remixing...';
  btn.disabled = true;

  try {
    const res  = await fetch('/api/remix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songs: entry.songs, lane: entry.lane }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Remix failed. Please try again.');
    if (!Array.isArray(data.songs) || data.songs.length === 0) {
      throw new Error('Remix returned empty results. Please try again.');
    }

    showResultsView(data.songs, entry.lane, false, entry.date, true);

    // Save remix to history in the background
    saveGeneration(entry.lane, data.songs).catch(err => console.error('Save failed:', err));
  } catch (err) {
    btn.textContent = 'Failed';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  } finally {
    btn.disabled = false;
    if (btn.textContent === originalText || btn.textContent === 'Remixing...') {
      btn.textContent = originalText;
    }
  }
}

// ── Event bindings ────────────────────────

document.getElementById('generate-btn').addEventListener('click', generate);
document.getElementById('regen-btn').addEventListener('click', generate);
document.getElementById('change-lane-btn').addEventListener('click', () => showView('generator'));
document.getElementById('back-to-history-btn').addEventListener('click', openHistory);
document.getElementById('history-btn').addEventListener('click', openHistory);
document.getElementById('history-back-btn').addEventListener('click', () => showView('generator'));
document.getElementById('bangers-btn').addEventListener('click', openBangers);
document.getElementById('bangers-back-btn').addEventListener('click', () => showView('generator'));

// ── Song cards ────────────────────────────

// options: { lane, date, showRemoveBtn, docId }
// showRemoveBtn=true is used in the Bangers view instead of the star button
function buildSongCard(song, num, total, options = {}) {
  const { lane = '', date = '', showRemoveBtn = false, docId = null } = options;
  const isStarred = bangerMap.has(song.title);

  const card = document.createElement('div');
  card.className = 'song-card';
  card.innerHTML = `
    <div class="song-number">${num} of ${total}</div>
    ${buildField('Title', song.title, 'title', false, 'title-value')}
    ${buildField('Generation Prompt', song.prompt, 'prompt', true)}
    ${buildField('Marketplace Description', song.description, 'description')}
    ${buildTagsField(song.tags)}
    ${showRemoveBtn
      ? `<div class="banger-remove-row"><button class="btn-remove-banger">Remove from Bangers</button></div>`
      : `<div class="banger-row"><button class="banger-btn${isStarred ? ' starred' : ''}">${starSVG(isStarred)}<span>${isStarred ? 'Banger' : 'Mark as Banger'}</span></button></div>`
    }
  `;

  card.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textMap = { title: song.title, prompt: song.prompt, description: song.description, tags: song.tags };
      copyText(textMap[btn.dataset.field], btn);
    });
  });

  if (showRemoveBtn && docId) {
    card.querySelector('.btn-remove-banger').addEventListener('click', () => {
      removeBanger(docId, song.title, card);
    });
  } else {
    card.querySelector('.banger-btn').addEventListener('click', (e) => {
      toggleBanger(song, { lane, date }, e.currentTarget);
    });
  }

  return card;
}

function buildField(label, value, field, mono = false, extraClass = '') {
  const cls = ['field-value', mono ? 'mono-block' : '', extraClass].filter(Boolean).join(' ');
  return `
    <div class="song-field">
      <div class="field-header">
        <span class="field-label">${label}</span>
        ${buildCopyBtn(field)}
      </div>
      <div class="${cls}">${esc(value)}</div>
    </div>
  `;
}

function buildTagsField(tags) {
  const pills = tags.split(',').map(t => `<span class="tag-pill">${esc(t.trim())}</span>`).join('');
  return `
    <div class="song-field">
      <div class="field-header">
        <span class="field-label">Tags</span>
        ${buildCopyBtn('tags')}
      </div>
      <div class="field-value tags-container">${pills}</div>
    </div>
  `;
}

function buildCopyBtn(field) {
  return `
    <button class="copy-btn" data-field="${field}" title="Copy ${field}">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span class="copy-label">Copy</span>
    </button>
  `;
}

function starSVG(filled = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
       fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>`;
}

// ── Clipboard ─────────────────────────────

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), {
      value: text, style: 'position:fixed;opacity:0;',
    });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const label = btn.querySelector('.copy-label');
  label.textContent = 'Copied ✓';
  btn.classList.add('copied');
  setTimeout(() => { label.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
}

// ── Utilities ─────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatHistoryDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTimestamp(ts) {
  return ts.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function populateLaneSelect() {
  const select = document.getElementById('lane-select');
  LANES.forEach(({ id, label }) => {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    if (id === DEFAULT_LANE_ID) opt.selected = true;
    select.appendChild(opt);
  });
}

function populateDurationSelect() {
  const select = document.getElementById('duration-select');
  DURATIONS.forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (value === 'varied') opt.selected = true;
    select.appendChild(opt);
  });
}

function setTodayDate() {
  const el = document.getElementById('today-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Init ──────────────────────────────────

async function init() {
  populateLaneSelect();
  populateDurationSelect();
  setTodayDate();

  // Load banger state before showing any songs so star buttons render correctly
  await loadBangerMap();

  // Non-blocking: populate usedTitles from history so Claude avoids duplicates
  loadUsedTitles();

  try {
    const res  = await fetch('/api/generate');
    const data = await res.json();
    showView(data.authenticated ? 'generator' : 'auth');
  } catch {
    showView('auth');
  }

  if (!views.auth.classList.contains('hidden')) {
    document.getElementById('passphrase-input').focus();
  }
}

init();
