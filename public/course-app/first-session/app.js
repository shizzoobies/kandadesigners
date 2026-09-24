(() => {
  'use strict';
  if (window.COURSE_ACCESS === false) return;
  const $ = id => document.getElementById(id);
  const lesson = window.LESSON;
  const media = window.MEDIA || {};
  const storageKey = 'ka-claude-first-session-v1';
  let stored;
  try { stored = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { stored = {}; }
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) stored = {};
  const state = {
    chapter: Number.isInteger(stored.chapter) && stored.chapter >= 0 && stored.chapter < lesson.chapters.length ? stored.chapter : 0,
    completed: Array.isArray(stored.completed) ? stored.completed.filter(id => lesson.chapters.some(c => c.id === id)) : [],
    draft: stored.draft && typeof stored.draft === 'object' ? stored.draft : {},
    generatedBrief: typeof stored.generatedBrief === 'string' ? stored.generatedBrief.slice(0, 2000) : '',
    os: ['windows', 'mac', 'linux'].includes(stored.os) ? stored.os : 'windows'
  };
  const requestedChapter = new URLSearchParams(location.search).get('chapter');
  const requestedIndex = lesson.chapters.findIndex(c => c.id === requestedChapter);
  if (requestedIndex >= 0) state.chapter = requestedIndex;
  function track(event, chapter) {
    fetch('/api/course-event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ c: chapter, e: event }), keepalive: true }).catch(() => {});
  }
  const audio = $('narration');
  let activeStage = 'listen', setupStep = 0;
  const stageLabels = { listen: 'Listen', setup: 'Set up', practice: 'Practice', apply: 'Apply' };
  const setupLabels = ['Install', 'Check', 'Open folder', 'Sign in'];
  const stages = () => current().id === 'setup' ? ['listen', 'setup', 'practice', 'apply'] : ['listen', 'practice', 'apply'];
  function updateStageNavigation() {
    const order = stages(), index = order.indexOf(activeStage);
    $('previous').disabled = state.chapter === 0 && index === 0;
    $('previous').textContent = index === 0 ? 'Previous chapter' : 'Back';
    $('next').textContent = activeStage === 'setup' && setupStep < 3 ? `Continue: ${setupLabels[setupStep + 1]}` : index < order.length - 1 ? `Continue to ${stageLabels[order[index + 1]].toLowerCase()}` : state.chapter === lesson.chapters.length - 1 ? 'Review progress' : 'Next chapter';
    $('stage-position').textContent = `${stageLabels[activeStage]} · ${current().short}`;
  }
  function selectSetup(step) {
    setupStep = step;
    document.querySelectorAll('.setup-steps > li').forEach((panel, index) => { panel.hidden = index !== step; });
    document.querySelectorAll('[data-setup-step]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.setupStep) === step)));
    updateStageNavigation();
  }
  function selectStage(stage, focus = false) {
    activeStage = stages().includes(stage) ? stage : 'listen';
    if (activeStage !== 'listen') audio.pause();
    document.querySelectorAll('[data-stage]').forEach(button => {
      const selected = button.dataset.stage === activeStage;
      button.hidden = !stages().includes(button.dataset.stage);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-stage-panel]').forEach(panel => { panel.hidden = panel.dataset.stagePanel !== activeStage; });
    updateStageNavigation();
    if (focus) {
      $('stage-' + activeStage).focus({ preventScroll: true });
      const workspace = $('chapter-workspace');
      if (workspace.getBoundingClientRect().top < 0) workspace.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }
  let toastTimer, simulation = { saved: [], selected: [], stage: 0 }, renderVersion = 0;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { toast('Progress could not be saved in this browser. You can still complete the lesson.'); } }
  function toast(message) { $('toast').textContent = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').textContent = ''; }, 4500); }
  function formatTime(value) { const n = Math.max(0, Math.floor(Number(value) || 0)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); }
  function current() { return lesson.chapters[state.chapter]; }
  function feedback(message, retry = false) { $('feedback').textContent = message; $('feedback').classList.toggle('retry', retry); }
  function complete() { if (!state.completed.includes(current().id)) { state.completed.push(current().id); track('done', current().id); } save(); updateNavigation(); }
  function updateNavigation() {
    $('chapter-list').innerHTML = lesson.chapters.map((c, i) => `<button class="chapter-link" data-chapter="${i}" ${state.chapter === i ? 'aria-current="step"' : ''}><span class="chapter-label">${escape(c.short)}${state.completed.includes(c.id) ? '<span class="status">Completed</span>' : ''}</span></button>`).join('');
    $('course-progress').textContent = `${state.completed.length} of ${lesson.chapters.length} completed`;
    $('completion').hidden = state.completed.length !== lesson.chapters.length;
  }
  function render(focus = false) {
    renderVersion++;
    audio.pause();
    const c = current();
    track('view', c.id);
    const m = media[c.id];
    $('phase').textContent = c.phase;
    $('chapter-title').textContent = c.title;
    $('chapter-intro').textContent = c.intro;
    $('takeaway').textContent = c.takeaway;
    $('real-action').textContent = c.action;
    $('prompt').textContent = c.exercise.type === 'builder' && state.generatedBrief ? state.generatedBrief : c.prompt;
    $('copy-prompt').textContent = 'Copy prompt';
    $('transcript').textContent = c.narration;
    $('chapter-count').textContent = '';
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    $('duration').textContent = m ? formatTime(m.duration) + ' AUDIO' : 'GUIDED AUDIO';
    $('caption').textContent = 'Press play when you are ready. You can also read the transcript below.';
    $('seek').value = 0;
    $('seek').disabled = true;
    $('elapsed').textContent = '0:00';
    $('total').textContent = m ? formatTime(m.duration) : '0:00';
    audio.src = `/course-app/first-session/assets/audio/${c.id}.mp3?v=20260922`;
    audio.load();
    audio.playbackRate = Number($('speed').value);
    renderExercise(c);
    $('transcript').closest('details').open = false;
    $('prompt').closest('details').open = false;
    selectSetup(0);
    selectStage('listen');
    updateNavigation();
    $('chapter-list').classList.remove('open');
    $('mobile-menu').setAttribute('aria-expanded', 'false');
    save();
    if (focus) { $('lesson').focus({ preventScroll: true }); $('lesson').scrollIntoView({ behavior: 'instant', block: 'start' }); }
  }
  function renderExercise(c) {
    const ex = c.exercise;
    const heading = `<h2>${escape(ex.title)}</h2><p class="question">${escape(ex.question)}</p>`;
    let content = '';
    if (ex.choices) {
      content = `<div class="choices">${ex.choices.map((choice, i) => `<button class="choice" data-choice="${i}"><span>${String.fromCharCode(65 + i)}</span>${escape(choice)}</button>`).join('')}</div>`;
    } else if (ex.type === 'terminal') {
      content = '<form id="terminal-form" class="terminal"><div class="terminal-top">reading-list-starter / practice terminal</div><label for="terminal-input">Enter a command</label><div class="terminal-entry"><span aria-hidden="true">&gt;</span><input id="terminal-input" autocomplete="off" spellcheck="false" placeholder="Type here"></div><button class="small-button" type="submit">Run in practice</button><div id="terminal-output" class="terminal-output" role="status">Ready. No real commands will run.</div></form>';
    } else if (ex.type === 'checklist') {
      simulation = { saved: [], selected: [], stage: 0 };
      content = '<div class="reading-preview"><span class="tiny-label">WEEKEND READING / PRACTICE PREVIEW</span><label class="book"><input type="checkbox" data-book="0">The Creative Act</label><label class="book"><input type="checkbox" data-book="1">A Field Guide to Getting Lost</label><button class="small-button" id="reload-preview">Reload preview</button><p class="step-hint" id="verify-hint">Check either book, then reload the preview.</p></div>';
    } else if (ex.type === 'builder') {
      content = '<form id="brief-form" class="brief-form"><label>What should change?<input name="outcome" required minlength="8" maxlength="250" placeholder="Show how many books remain unread"></label><label>What should stay the same?<input name="boundary" required minlength="5" maxlength="250" placeholder="Keep the layout and existing JavaScript"></label><label>How will you check it?<textarea name="check" required minlength="8" maxlength="400" placeholder="Check and clear books; confirm the count changes"></textarea></label><button class="primary-button" type="submit">Build my prompt</button></form>';
    }
    $('exercise').innerHTML = heading + content;
    if (ex.type === 'builder') {
      for (const name of ['outcome', 'boundary', 'check']) {
        const field = $('brief-form').elements.namedItem(name);
        field.value = typeof state.draft[name] === 'string' ? state.draft[name].slice(0, Number(field.maxLength)) : '';
      }
    }
  }
  $('exercise').addEventListener('click', event => {
    const choice = event.target.closest('[data-choice]');
    if (choice) {
      const ex = current().exercise;
      const correct = Number(choice.dataset.choice) === ex.answer;
      $('exercise').querySelectorAll('.choice').forEach(el => el.classList.remove('correct', 'wrong'));
      choice.classList.add(correct ? 'correct' : 'wrong');
      feedback(correct ? ex.success : ex.retry, !correct);
      if (correct) complete();
    }
    if (event.target.closest('#reload-preview')) {
      simulation.selected = [...simulation.saved];
      $('exercise').querySelectorAll('[data-book]').forEach(el => { el.checked = simulation.selected.includes(Number(el.dataset.book)); });
      if (simulation.stage === 0 && simulation.selected.length > 0) {
        simulation.stage = 1;
        $('verify-hint').textContent = 'Selection survived the reload. Clear every checked book, then reload again.';
        feedback('Selection restored. Now check the clearing behavior.');
      } else if (simulation.stage === 1 && simulation.selected.length === 0) {
        simulation.stage = 2;
        $('verify-hint').textContent = 'Practice verification complete: selecting and clearing both persist.';
        feedback(current().exercise.success); complete();
      } else if (simulation.stage !== 2) feedback(simulation.stage === 0 ? 'Select a book before reloading.' : 'Clear all checked books before the next reload.', true);
    }
  });
  $('exercise').addEventListener('change', event => {
    if (event.target.matches('[data-book]')) {
      simulation.saved = Array.from($('exercise').querySelectorAll('[data-book]:checked'), el => Number(el.dataset.book));
    }
  });
  $('exercise').addEventListener('input', event => {
    if (event.target.closest('#brief-form')) { state.draft[event.target.name] = event.target.value; save(); }
  });
  $('exercise').addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'terminal-form') {
      const command = $('terminal-input').value.trim();
      if (command === current().exercise.expected) {
        $('terminal-output').textContent = '> claude\nPractice session ready. Real sign-in opens in your browser.\nNext: inspect the project before editing.';
        feedback(current().exercise.success); complete();
      } else { $('terminal-output').textContent = 'Command not recognized in this simulation.'; feedback(current().exercise.retry, true); }
    }
    if (event.target.id === 'brief-form') {
      const values = Object.fromEntries(new FormData(event.target));
      if (Object.values(values).some(value => value.trim().length < 5)) { feedback('Add a specific outcome, boundary, and check.', true); return; }
      $('prompt').textContent = `Goal: ${values.outcome.trim()}\nPreserve: ${values.boundary.trim()}\nVerify: ${values.check.trim()}\n\nFirst inspect the relevant files and propose a small plan. Do not edit until I have reviewed it. After implementation, report the changes, checks, and anything you could not verify.`;
      state.generatedBrief = $('prompt').textContent;
      state.draft = values; complete(); feedback(current().exercise.success);
    }
  });
  $('chapter-list').addEventListener('click', event => { const button = event.target.closest('[data-chapter]'); if (button) { state.chapter = Number(button.dataset.chapter); render(true); } });
  $('stage-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-stage]');
    if (button) selectStage(button.dataset.stage);
  });
  $('stage-tabs').addEventListener('keydown', event => {
    const button = event.target.closest('[data-stage]');
    if (!button || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const order = stages(), index = order.indexOf(button.dataset.stage);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? order.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + order.length) % order.length;
    document.querySelectorAll('[data-stage]').forEach(tab => { tab.tabIndex = tab.dataset.stage === order[next] ? 0 : -1; });
    $('tab-' + order[next]).focus();
  });
  $('setup-controls').addEventListener('click', event => { const button = event.target.closest('[data-setup-step]'); if (button) selectSetup(Number(button.dataset.setupStep)); });
  $('previous').addEventListener('click', () => {
    const index = stages().indexOf(activeStage);
    if (activeStage === 'setup' && setupStep > 0) { selectSetup(setupStep - 1); selectStage('setup', true); }
    else if (index > 0) selectStage(stages()[index - 1], true);
    else if (state.chapter > 0) { state.chapter--; render(true); selectStage('apply'); }
  });
  $('next').addEventListener('click', () => {
    const index = stages().indexOf(activeStage);
    if (activeStage === 'setup' && setupStep < 3) { selectSetup(setupStep + 1); selectStage('setup', true); return; }
    if (index < stages().length - 1) { selectStage(stages()[index + 1], true); return; }
    if (state.chapter < lesson.chapters.length - 1) { state.chapter++; render(true); }
    else if (state.completed.length === lesson.chapters.length) { $('completion').scrollIntoView({ behavior: 'instant' }); $('finish-notes').focus(); }
    else { const missing = lesson.chapters.findIndex(c => !state.completed.includes(c.id)); state.chapter = missing; render(true); selectStage('practice', true); toast('Complete this exercise to finish the learning path.'); }
  });
  $('mobile-menu').addEventListener('click', () => { const open = $('chapter-list').classList.toggle('open'); $('mobile-menu').setAttribute('aria-expanded', String(open)); });
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard.'); }
    catch {
      const textarea = document.createElement('textarea'); textarea.value = text; textarea.style.position = 'fixed'; textarea.style.left = '-9999px'; document.body.append(textarea); textarea.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { /* The visible prompt remains selectable. */ }
      textarea.remove(); toast(ok ? 'Copied to clipboard.' : 'Copy is unavailable here. Select and copy the text shown.');
    }
  }
  $('copy-prompt').addEventListener('click', () => copyText($('prompt').textContent));
  function setupOS() {
    $('os').value = state.os;
    $('install-command').textContent = state.os === 'windows' ? 'irm https://claude.ai/install.ps1 | iex' : 'curl -fsSL https://claude.ai/install.sh | bash';
    $('folder-command').textContent = state.os === 'windows' ? 'cd "C:\\path\\to\\reading-list-starter"' : 'cd "/path/to/reading-list-starter"';
  }
  $('os').addEventListener('change', () => { state.os = $('os').value; setupOS(); save(); });
  $('copy-install').addEventListener('click', () => copyText($('install-command').textContent));
  function audioState() {
    const playing = !audio.paused;
    $('play').classList.toggle('is-playing', playing);
    $('play').setAttribute('aria-label', playing ? 'Pause narration' : 'Play narration');
    $('play').innerHTML = playing ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>' : '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
  }
  $('play').addEventListener('click', async () => {
    const version = renderVersion;
    if (!audio.paused) audio.pause();
    else { try { await audio.play(); } catch { if (version === renderVersion) { $('caption').textContent = 'Audio could not start. Try again, or read the full transcript below.'; toast('Audio could not start. The transcript is available below.'); } } }
  });
  for (const name of ['play', 'pause', 'ended']) audio.addEventListener(name, audioState);
  audio.addEventListener('loadedmetadata', () => { $('total').textContent = formatTime(audio.duration); $('seek').max = String(audio.duration); $('seek').disabled = false; });
  audio.addEventListener('timeupdate', () => {
    $('elapsed').textContent = formatTime(audio.currentTime); $('seek').value = audio.currentTime;
    const cues = media[current().id]?.cues || [];
    const cue = cues.find(c => audio.currentTime >= c.start && audio.currentTime < c.end);
    if (cue) $('caption').textContent = cue.text;
    else if (audio.ended) $('caption').textContent = 'Chapter narration complete. Try the exercise, then continue at your pace.';
  });
  audio.addEventListener('error', () => { $('caption').textContent = 'Narration is unavailable. Read the full transcript below and continue the exercises.'; $('seek').disabled = true; });
  $('seek').addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number($('seek').value); });
  $('speed').addEventListener('change', () => { audio.playbackRate = Number($('speed').value); });
  $('watch-video').addEventListener('click', () => { audio.pause(); $('video-dialog').showModal(); });
  $('close-video').addEventListener('click', () => $('video-dialog').close());
  $('video-dialog').addEventListener('close', () => { $('video-dialog').querySelector('video').pause(); $('watch-video').focus(); });
  $('video-dialog').querySelector('video').addEventListener('play', () => audio.pause());
  // Inline caption data keeps captions available when the lesson opens from disk.
  const vttTime = seconds => new Date(Math.round(seconds * 1000)).toISOString().slice(11, 23);
  const videoCues = lesson.chapters.flatMap(c => (media[c.id]?.cues || []).map(cue => `${vttTime(cue.start + media[c.id].offset)} --> ${vttTime(cue.end + media[c.id].offset)}\n${cue.text}`));
  const captionURL = URL.createObjectURL(new Blob(['WEBVTT\n\n' + videoCues.join('\n\n') + '\n'], { type: 'text/vtt' }));
  $('video-dialog').querySelector('track').src = captionURL;
  window.addEventListener('pagehide', () => URL.revokeObjectURL(captionURL), { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) audio.pause(); });
  function download(name, content) { const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function notes() {
    const text = ['K & A Performance | Your first session with Claude Code', '', 'Practice completion: ' + state.completed.length + '/7', ...lesson.chapters.map(c => `${state.completed.includes(c.id) ? '[x]' : '[ ]'} ${c.short}`), '', 'MY NEXT TASK', 'Goal: ' + (state.draft.outcome || ''), 'Preserve: ' + (state.draft.boundary || ''), 'Verify: ' + (state.draft.check || ''), '', 'WORKFLOW', 'Inspect relevant files. Review a small plan. Implement. Check the actual result.', '', 'Practice completion does not verify your real project. Repeat the browser checks there.', '', 'PROMPT LIBRARY', ...lesson.chapters.flatMap(c => ['', c.short, c.prompt]), '', 'OFFICIAL REFERENCES', ...lesson.sources.map(s => s.join(': '))].join('\n');
    download('my-claude-code-session.txt', text);
  }
  $('download-notes').addEventListener('click', notes); $('finish-notes').addEventListener('click', notes); $('apply-notes').addEventListener('click', notes);
  let resetPending = false;
  $('reset').addEventListener('click', () => {
    if (!resetPending) { resetPending = true; $('reset').textContent = 'Confirm reset'; $('reset-status').textContent = 'This clears your saved progress and prompt draft. Click Confirm reset to continue.'; return; }
    state.chapter = 0; state.completed = []; state.draft = {}; state.generatedBrief = ''; resetPending = false; $('reset').textContent = 'Reset saved lesson progress'; $('reset-status').textContent = ''; render(true); toast('Lesson progress reset.');
  });
  $('sources').innerHTML = lesson.sources.map(([label, url]) => `<li><a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)}</a></li>`).join('');
  setupOS(); render();
})();
