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

// ── State ────────────────────────────────

let isGenerating = false;
let currentLaneLabel = LANES.find(l => l.id === DEFAULT_LANE_ID).label;

// ── View management ──────────────────────

const views = {
  auth:      document.getElementById('view-auth'),
  generator: document.getElementById('view-generator'),
  results:   document.getElementById('view-results'),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[name].classList.remove('hidden');
}

// ── Loading state ────────────────────────

function setGenerating(loading) {
  isGenerating = loading;
  const btn    = document.getElementById('generate-btn');
  const select = document.getElementById('lane-select');
  if (loading) {
    btn.textContent = 'Generating...';
    btn.classList.add('loading');
    btn.disabled  = true;
    select.disabled = true;
  } else {
    btn.textContent = 'Generate 5 Songs';
    btn.classList.remove('loading');
    btn.disabled  = false;
    select.disabled = false;
  }
}

// ── Auth ─────────────────────────────────

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

// ── Generation ───────────────────────────

async function generate() {
  if (isGenerating) return;

  const lane    = document.getElementById('lane-select').value;
  currentLaneLabel = lane;

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

    if (!res.ok) {
      throw new Error(data.error || 'Generation failed. Please try again.');
    }
    if (!Array.isArray(data.songs) || data.songs.length === 0) {
      throw new Error('Received an empty response. Please try again.');
    }

    renderSongs(data.songs, lane);
    showView('results');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    setGenerating(false);
  }
}

document.getElementById('generate-btn').addEventListener('click', generate);
document.getElementById('regen-btn').addEventListener('click', generate);
document.getElementById('change-lane-btn').addEventListener('click', () => showView('generator'));

// ── Rendering ────────────────────────────

function renderSongs(songs, lane) {
  const container = document.getElementById('songs-container');
  container.innerHTML = '';

  document.getElementById('results-lane-name').textContent = lane;

  songs.forEach((song, i) => {
    container.appendChild(buildSongCard(song, i + 1, songs.length));
  });
}

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

  // Wire up copy buttons
  card.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const textMap = { title: song.title, prompt: song.prompt, description: song.description, tags: song.tags };
      copyText(textMap[field], btn);
    });
  });

  return card;
}

function buildField(label, value, field, mono = false, extraClass = '') {
  const valueClass = ['field-value', mono ? 'mono-block' : '', extraClass].filter(Boolean).join(' ');
  return `
    <div class="song-field">
      <div class="field-header">
        <span class="field-label">${label}</span>
        ${buildCopyBtn(field)}
      </div>
      <div class="${valueClass}">${esc(value)}</div>
    </div>
  `;
}

function buildTagsField(tags) {
  const pills = tags.split(',')
    .map(t => `<span class="tag-pill">${esc(t.trim())}</span>`)
    .join('');
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

// ── Clipboard ────────────────────────────

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for environments without clipboard API
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
  setTimeout(() => {
    label.textContent = 'Copy';
    btn.classList.remove('copied');
  }, 1500);
}

// ── Utilities ────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  if (el) {
    el.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }
}

// ── Init ─────────────────────────────────

async function init() {
  populateLaneSelect();
  setTodayDate();

  // Check auth status via lightweight GET before showing any view
  try {
    const res  = await fetch('/api/generate');
    const data = await res.json();
    showView(data.authenticated ? 'generator' : 'auth');
  } catch {
    showView('auth');
  }

  // Focus the passphrase input if the auth gate is shown
  if (!views.auth.classList.contains('hidden')) {
    document.getElementById('passphrase-input').focus();
  }
}

init();
