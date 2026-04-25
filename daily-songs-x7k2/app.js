import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, Timestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

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

async function saveGeneration(lane, songs) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  await addDoc(collection(db, 'generations'), {
    date: today,
    lane,
    generatedAt: Timestamp.now(),
    songs,
  });
}

async function fetchHistory() {
  const q    = query(collection(db, 'generations'), orderBy('generatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// ── State ─────────────────────────────────

let isGenerating = false;
let fromHistory  = false;

// ── Views ─────────────────────────────────

const views = {
  auth:      document.getElementById('view-auth'),
  generator: document.getElementById('view-generator'),
  results:   document.getElementById('view-results'),
  history:   document.getElementById('view-history'),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[name].classList.remove('hidden');
}

// ── Loading state ─────────────────────────

function setGenerating(loading) {
  isGenerating = loading;
  const btn    = document.getElementById('generate-btn');
  const select = document.getElementById('lane-select');
  if (loading) {
    btn.textContent = 'Generating...';
    btn.classList.add('loading');
    btn.disabled    = true;
    select.disabled = true;
  } else {
    btn.textContent = 'Generate 5 Songs';
    btn.classList.remove('loading');
    btn.disabled    = false;
    select.disabled = false;
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

  const lane    = document.getElementById('lane-select').value;
  const errorEl = document.getElementById('generate-error');
  errorEl.classList.add('hidden');

  showView('generator');
  setGenerating(true);

  try {
    const res  = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lane }),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Generation failed. Please try again.');
    if (!Array.isArray(data.songs) || data.songs.length === 0) {
      throw new Error('Received an empty response. Please try again.');
    }

    showResultsView(data.songs, lane, false);

    // Save to Firestore in the background - don't block the UI on failure
    saveGeneration(lane, data.songs).catch(err => console.error('Firestore save failed:', err));
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setGenerating(false);
  }
}

// ── Results ───────────────────────────────

function showResultsView(songs, lane, isHistory, historyDate = null) {
  fromHistory = isHistory;

  document.getElementById('results-lane-name').textContent = lane;

  const dateEl = document.getElementById('results-date');
  if (isHistory && historyDate) {
    dateEl.textContent = formatHistoryDate(historyDate);
    dateEl.classList.remove('hidden');
  } else {
    dateEl.classList.add('hidden');
  }

  // Toggle action buttons based on context
  document.getElementById('change-lane-btn').classList.toggle('hidden', isHistory);
  document.getElementById('back-to-history-btn').classList.toggle('hidden', !isHistory);

  renderSongs(songs);
  showView('results');
}

function renderSongs(songs) {
  const container = document.getElementById('songs-container');
  container.innerHTML = '';
  songs.forEach((song, i) => container.appendChild(buildSongCard(song, i + 1, songs.length)));
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
    renderHistoryList(entries, listEl);
  } catch (err) {
    listEl.innerHTML = '<p class="history-error">Could not load history. Try again.</p>';
    console.error(err);
  }
}

function renderHistoryList(entries, container) {
  // Group by date (entries are already newest-first from Firestore query)
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.date)) groups.set(entry.date, []);
    groups.get(entry.date).push(entry);
  }

  container.innerHTML = '';
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
        <button class="btn-view-history">View</button>
      `;
      row.querySelector('.btn-view-history').addEventListener('click', () => {
        showResultsView(entry.songs, entry.lane, true, entry.date);
      });
      list.appendChild(row);
    }

    group.appendChild(list);
    container.appendChild(group);
  }
}

// ── Event bindings ────────────────────────

document.getElementById('generate-btn').addEventListener('click', generate);
document.getElementById('regen-btn').addEventListener('click', generate);
document.getElementById('change-lane-btn').addEventListener('click', () => showView('generator'));
document.getElementById('back-to-history-btn').addEventListener('click', openHistory);
document.getElementById('history-btn').addEventListener('click', openHistory);
document.getElementById('history-back-btn').addEventListener('click', () => showView('generator'));

// ── Song cards ────────────────────────────

function buildSongCard(song, num, total) {
  const card = document.createElement('div');
  card.className = 'song-card';
  card.innerHTML = `
    <div class="song-number">${num} of ${total}</div>
    ${buildField('Title', song.title, 'title', false, 'title-value')}
    ${buildField('Generation Prompt', song.prompt, 'prompt', true)}
    ${buildField('Marketplace Description', song.description, 'description')}
    ${buildTagsField(song.tags)}
  `;
  card.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const textMap = { title: song.title, prompt: song.prompt, description: song.description, tags: song.tags };
      copyText(textMap[btn.dataset.field], btn);
    });
  });
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

function setTodayDate() {
  const el = document.getElementById('today-date');
  if (el) el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Init ──────────────────────────────────

async function init() {
  populateLaneSelect();
  setTodayDate();

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
