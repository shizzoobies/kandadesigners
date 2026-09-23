(() => {
  'use strict';
  if (window.COURSE_ACCESS === false) return;
  const $ = id => document.getElementById(id), lesson = window.LESSON, media = window.MEDIA || {};
  const key = 'ka-beginner-orientation-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { /* Practice remains available without storage. */ }
  const state = {
    chapter: Number.isInteger(saved.chapter) && saved.chapter >= 0 && saved.chapter < lesson.chapters.length ? saved.chapter : 0,
    completed: Array.isArray(saved.completed) ? saved.completed.filter(id => lesson.chapters.some(c => c.id === id)) : [],
    os: saved.os === 'mac' ? 'mac' : 'windows'
  };
  const query = new URLSearchParams(location.search), requested = lesson.chapters.findIndex(c => c.id === query.get('chapter'));
  if (requested >= 0) state.chapter = requested;
  let stage = 'listen', toastTimer, generation = 0, resetPending = false;
  const audio = $('narration'), video = $('video-dialog').querySelector('video');
  const order = ['listen', 'practice', 'apply'], labels = { listen: 'Listen', practice: 'Try it', apply: 'On your computer' };
  const demo = { windows: 0, windowChosen: false, folder: 0, terminal: 0, request: 0, draft: '', ready: [] };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const current = () => lesson.chapters[state.chapter];
  const time = s => `${Math.floor((Number(s) || 0) / 60)}:${String(Math.floor((Number(s) || 0) % 60)).padStart(2, '0')}`;
  const samplePath = () => state.os === 'windows' ? 'C:\\Users\\Learner\\Downloads\\reading-list-starter' : '/Users/learner/Downloads/reading-list-starter';
  function store() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* No data leaves this browser. */ } }
  function toast(text) { $('toast').textContent = text; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').textContent = ''; }, 4000); }
  function feedback(text, retry = false) { $('feedback').textContent = text; $('feedback').classList.toggle('retry', retry); }
  function nav() {
    $('chapter-list').innerHTML = lesson.chapters.map((c, i) => `<button class="chapter-link" data-chapter="${i}"${state.chapter === i ? ' aria-current="step"' : ''}><span class="chapter-label">${esc(c.short)}${state.completed.includes(c.id) ? '<span class="status">Explored</span>' : ''}</span></button>`).join('');
    $('course-progress').textContent = `${state.completed.length} of ${lesson.chapters.length} explored`;
    $('completion').hidden = state.completed.length !== lesson.chapters.length;
  }
  function complete() { if (!state.completed.includes(current().id)) state.completed.push(current().id); store(); nav(); }
  function selectStage(value, focus = false) {
    stage = value;
    if (stage !== 'listen') audio.pause();
    order.forEach(id => { $(`stage-${id}`).hidden = id !== stage; $(`tab-${id}`).setAttribute('aria-selected', String(id === stage)); $(`tab-${id}`).tabIndex = id === stage ? 0 : -1; });
    $('previous').disabled = state.chapter === 0 && stage === 'listen';
    $('previous').textContent = stage === 'listen' ? 'Previous chapter' : 'Back';
    $('next').textContent = stage === 'listen' ? 'Continue to try it' : stage === 'practice' ? 'On your computer' : state.chapter === lesson.chapters.length - 1 ? 'Finish orientation' : 'Next chapter →';
    $('stage-status').textContent = `${labels[stage]}: ${current().short}`;
    if (focus) { $(`stage-${stage}`).focus({ preventScroll: true }); if ($('chapter-workspace').getBoundingClientRect().top < 0) $('chapter-workspace').scrollIntoView({ block: 'start', behavior: 'instant' }); }
  }
  const osSelect = () => `<label class="os-choice">Your computer<select data-os><option value="windows"${state.os === 'windows' ? ' selected' : ''}>Windows</option><option value="mac"${state.os === 'mac' ? ' selected' : ''}>Mac</option></select></label>`;
  function help() {
    let body = '';
    if (current().id === 'terminal') body = osSelect() + (state.os === 'windows' ? '<p><strong>Open the terminal:</strong> Open Start, type PowerShell, and choose Windows PowerShell or PowerShell. Avoid the entry labeled x86.</p><p><strong>Find the folder address:</strong> In File Explorer, open the extracted reading-list-starter folder. Click its address bar, then copy the full location shown there.</p>' : '<p><strong>Open the terminal:</strong> Press Command + Space, type Terminal, then press Enter.</p><p><strong>Find the folder address:</strong> In Finder, right-click the extracted reading-list-starter folder, hold Option, and choose Copy as Pathname. The menu includes the folder name.</p>') + '<p><strong>Go to that folder:</strong> Type <code>cd</code>, a space, and the copied address inside a pair of straight quotes. Keep only one pair of surrounding quotes. Press Enter.</p><p>If the terminal says the location does not exist, compare the address with the folder you extracted. Installation and launching <code>claude</code> come in the next lesson.</p>';
    if (current().id === 'ready') body = '<p><a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Check supported account options</a>. Course signup and Claude Code access are separate.</p><p><a class="primary-button next-course" href="https://ka-performancefl.com/course/">Start Your first session</a></p><p><a href="https://ka-performancefl.com/course/?chapter=setup">Go straight to the installation chapter</a></p>';
    $('computer-help').innerHTML = body;
  }
  const page = heading => `<div class="mini-page"><h3>${esc(heading)}</h3><p class="mini-book">The Creative Act</p><p class="mini-book">A Field Guide to Getting Lost</p><p class="mini-book">The Art of Noticing</p></div>`;
  function renderExercise(focus = false) {
    const id = current().id;
    let html = '';
    if (id === 'welcome') html = '<h2>What would success look like?</h2><p class="exercise-instruction">We want to change a heading. Choose the result you could check by looking at the page.</p><div class="choices"><button class="choice" data-welcome="yes">The page says “My reading list”, and the same books are still there.</button><button class="choice" data-welcome="no">Claude sends a confident message saying it is done.</button></div>';
    if (id === 'windows') {
      const tasks = ['Find the project you just downloaded.', 'Ask Claude to change the page heading.', 'Look at the page to check its new heading.'];
      html = `<h2>Choose the window for this action</h2><p class="exercise-instruction">${tasks[demo.windows]}</p><div class="window-choices"><button class="window-choice" data-window="browser"><strong>Browser</strong><small>See web pages</small></button><button class="window-choice" data-window="files"><strong>File manager</strong><small>Find files and folders</small></button><button class="window-choice" data-window="terminal"><strong>Terminal</strong><small>Type commands and use Claude</small></button></div>`;
      if (demo.windowChosen) html += `<div class="demo-window"><div class="window-title">${['FILE EXPLORER / FINDER', 'CLAUDE IN A TERMINAL / ILLUSTRATION', 'BROWSER / LOCAL PRACTICE PAGE'][demo.windows]}</div><div class="window-body">${demo.windows === 0 ? '<strong>Downloads</strong><p>reading-list-starter.zip</p>' : demo.windows === 1 ? '<p>Change the heading to My reading list.</p>' : page('My reading list')}</div></div>${demo.windows < 2 ? '<button class="small-button" data-window-next>Next window task</button>' : '<p class="evidence-line">You found the right window for each action.</p>'}`;
    }
    if (id === 'folder') {
      const instructions = ['Open the downloaded package in this practice window.', 'This is still a compressed package. Unpack it before working on its contents.', 'Open the normal folder created by extraction.', 'Open the page file to see the reading list.', 'This is the page shown by index.html. It is a local preview, not a published website.'];
      html = `<h2>Unpack, then open</h2><p class="exercise-instruction">${instructions[demo.folder]}</p><div class="demo-window"><div class="window-title">${demo.folder === 1 ? 'Downloads / reading-list-starter.zip / COMPRESSED' : demo.folder >= 3 ? 'Downloads / reading-list-starter' : 'Downloads'}</div><div class="window-body">`;
      if (demo.folder === 0) html += '<button class="file-item" data-folder="package">reading-list-starter.zip<span>Downloaded package</span></button>';
      if (demo.folder === 1) html += '<p>The package contains the practice files.</p><button class="primary-button" data-folder="extract">Extract the package</button><p class="request-meta">Windows: Extract All. Mac: double-click the ZIP.</p>';
      if (demo.folder === 2) html += '<button class="file-item" data-folder="open">reading-list-starter<span>Extracted folder</span></button>';
      if (demo.folder === 3) html += [['index.html','The page'],['styles.css','How the page looks'],['app.js','How the page behaves'],['README.md','Notes about the project']].map(([file,role])=>`<button class="file-item" data-file="${file}">${file}<span>${role}</span></button>`).join('');
      if (demo.folder === 4) html += page('Weekend reading');
      html += '</div></div>';
    }
    if (id === 'terminal') {
      const instructions = [`Type this command, including the quotes, then press Enter. This example address belongs only to the simulation.`, 'The terminal is now in the practice folder. Rehearse launching an already-installed Claude by typing claude and pressing Enter.', 'In this rehearsal, sign-in is already complete. Type the ordinary sentence shown below, then press Enter.', 'You changed folders, launched the simulated assistant, and sent a plain-language request.'];
      const expected = [`cd "${samplePath()}"`, 'claude', 'Explain this project. Do not edit any files.'][demo.terminal];
      html = `<h2>Rehearse the first commands</h2>${osSelect()}<p class="exercise-instruction">${instructions[demo.terminal]}</p>`;
      if (demo.terminal < 3) html += `<p class="request-meta">${demo.terminal < 2 ? 'Practice command' : 'Practice request'}</p><pre class="path-example">${esc(expected)}</pre>`;
      html += `<form id="command-form" class="terminal"><div class="terminal-top">${demo.terminal < 2 ? (state.os === 'windows' ? 'POWERSHELL' : 'TERMINAL') : 'CLAUDE CODE'} / SIMULATION</div><pre>${demo.terminal === 0 ? (state.os === 'windows' ? 'PS C:\\Users\\Learner>' : 'learner ~ %') : demo.terminal === 1 ? esc(samplePath()) + (state.os === 'windows' ? '>' : ' %') : 'Claude is ready for a request.'}</pre>${demo.terminal < 3 ? '<label for="command">Type here, then press Enter</label><input id="command" autocomplete="off" spellcheck="false"><button type="submit" class="small-button">Send in practice</button>' : '<p>Your practice sentence was received. No files were read or changed.</p>'}</form>`;
    }
    if (id === 'request') {
      html = '<h2>Make one visible change</h2>';
      if (demo.request === 0) html += `<p class="exercise-instruction">Read this small request, then send it to the simulated assistant.</p><form id="request-form"><label for="request-text" class="request-meta">Your practice request</label><textarea id="request-text" class="request-box" required>${esc(demo.draft || current().prompt)}</textarea><button class="primary-button" type="submit">Send practice request</button></form>`;
      if (demo.request === 1) html += '<p class="exercise-instruction">Check whether the proposed action matches the request you just sent.</p><div class="permission-box"><strong>Proposed change</strong><p>Edit the heading in index.html from “Weekend reading” to “My reading list”. Leave the book list and design unchanged.</p><p class="request-meta">Illustrative permission prompt. Real controls vary.</p></div><div class="permission-actions"><button class="primary-button" data-permission="allow">Allow this heading edit</button><button class="secondary-button" data-permission="explain">Explain this first</button></div>';
      if (demo.request === 2) html += '<p class="exercise-instruction">The simulated edit is complete. Open the browser preview to check it.</p><button class="primary-button" data-request="preview">Open browser preview</button>';
      if (demo.request >= 3) html += `<p class="exercise-instruction">${demo.request === 3 ? 'The browser still shows the earlier page. Refresh it to load the changed file.' : 'The heading changed, and the same three books are still here. Compare that with the request.'}</p>${page(demo.request === 3 ? 'Weekend reading' : 'My reading list')}<div class="permission-actions">${demo.request === 3 ? '<button class="primary-button" data-request="refresh">Refresh preview</button>' : '<button class="primary-button" data-request="verify">The heading matches and the books stayed the same</button>'}</div>`;
    }
    if (id === 'ready') {
      html = '<h2>Check your bearings</h2><p class="exercise-instruction">These are your own readiness checks, not a test score. Revisit any chapter you want.</p><div class="ready-list">' + ['I can tell the browser, file manager, and terminal apart.','I know to extract the project ZIP before using its files.','I can describe one small change and what success should look like.','I understand the real installation and account sign-in still come next.'].map((text,i)=>`<label><input type="checkbox" data-ready="${i}"${demo.ready.includes(i)?' checked':''}>${text}</label>`).join('') + '</div>';
    }
    $('exercise').innerHTML = html;
    if (focus) { const heading = $('exercise').querySelector('h2'); heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
  }
  function render(focus = false) {
    generation++; audio.pause(); const c = current(), m = media[c.id];
    for (const [id,value] of Object.entries({phase:c.phase,'chapter-title':c.title,'chapter-intro':c.intro,takeaway:c.takeaway,'real-action':c.action,transcript:c.narration,prompt:c.prompt})) $(id).textContent = value;
    $('duration').textContent = m ? `${time(m.duration)} AUDIO` : 'GUIDED AUDIO';
    $('caption').textContent = 'Press play, or read the transcript below.';
    $('feedback').textContent = ''; $('feedback').className = 'feedback';
    $('transcript').closest('details').open = false; $('prompt').closest('details').open = false;
    $('elapsed').textContent = '0:00'; $('total').textContent = m ? time(m.duration) : '0:00'; $('seek').value = 0; $('seek').disabled = true;
    audio.src = `/course-app/orientation/assets/audio/${c.id}.mp3`; audio.load(); audio.playbackRate = Number($('speed').value);
    renderExercise(); help(); nav(); selectStage('listen'); store();
    $('chapter-list').classList.remove('open'); $('mobile-menu').setAttribute('aria-expanded','false');
    if (focus) { $('lesson').focus({preventScroll:true}); $('lesson').scrollIntoView({block:'start',behavior:'instant'}); }
  }
  $('exercise').addEventListener('click', event => {
    const b = event.target.closest('button'); if (!b) return;
    if (b.dataset.welcome) { const ok = b.dataset.welcome === 'yes'; feedback(ok ? 'Exactly. You can look at the heading and compare the books. That is a result you can check.' : 'A confident message is not the same as looking at the page. Choose the visible result.', !ok); if (ok) complete(); }
    if (b.dataset.window) { const expected = ['files','terminal','browser'][demo.windows]; if (b.dataset.window === expected) { demo.windowChosen = true; renderExercise(true); feedback('That is the right window for this action.'); if (demo.windows === 2) complete(); } else feedback('Look at the job written below each window name, then try again.', true); }
    if (b.hasAttribute('data-window-next')) { demo.windows++; demo.windowChosen=false; renderExercise(true); feedback(''); }
    if (b.dataset.folder) { demo.folder++; renderExercise(true); feedback(''); }
    if (b.dataset.file) { if (b.dataset.file === 'index.html') { demo.folder=4; renderExercise(true); feedback('You opened the page from the extracted folder. Nothing has been published.'); complete(); } else feedback('That file supports the page. Choose index.html to view the reading list in a browser.'); }
    if (b.dataset.permission === 'explain') feedback('Only the text inside the page heading would change. The book entries and design files stay the same. If a real request is unclear, ask before approving.');
    if (b.dataset.permission === 'allow') { demo.request=2; renderExercise(true); feedback(''); }
    if (b.dataset.request === 'preview') { demo.request=3; renderExercise(true); }
    if (b.dataset.request === 'refresh') { demo.request=4; renderExercise(true); }
    if (b.dataset.request === 'verify') { feedback('You checked the visible result against the request. Repeat that check after a real edit.'); complete(); }
  });
  $('exercise').addEventListener('input', event => { if (event.target.id === 'request-text') demo.draft = event.target.value; });
  $('exercise').addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'command-form') {
      const entered = $('command').value.trim().replace(/[“”]/g,'"');
      const expected = [`cd "${samplePath()}"`, 'claude', 'Explain this project. Do not edit any files.'][demo.terminal];
      const normalizeRequest = text => text.toLowerCase().replace(/[.!?]/g,'').replace(/\s+/g,' ').trim();
      const matches = demo.terminal === 2 ? normalizeRequest(entered) === normalizeRequest(expected) : entered === expected;
      if (!matches) { feedback(demo.terminal === 2 ? 'For this scripted rehearsal, ask Claude to explain this project without editing files, using the example above. Real requests can use your own words.' : 'Use the example shown above for this rehearsal. Check spaces, spelling, and quotes. Nothing ran on your computer.', true); return; }
      demo.terminal++; renderExercise(true); feedback(demo.terminal===3 ? 'You rehearsed commands and a plain-language request. Installation still happens in the next lesson.' : 'That worked in the simulation. Continue with the instruction above.'); if (demo.terminal===3) complete();
    }
    if (event.target.id === 'request-form') {
      const text = $('request-text').value;
      if (!text.includes('Weekend reading') || !text.includes('My reading list') || !/keep|same|unchanged/i.test(text)) { feedback('This scripted exercise handles the heading change shown here. Include both headings and say what should stay the same.',true); return; }
      demo.draft=text; demo.request=1; renderExercise(true); feedback('');
    }
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-os]')) { state.os=event.target.value; demo.terminal=0; store(); renderExercise(); help(); $(`stage-${stage}`).querySelector('[data-os]')?.focus({preventScroll:true}); feedback('Computer choice updated. The command rehearsal starts again with the matching address.'); }
    if (event.target.matches('[data-ready]')) { demo.ready=Array.from($('exercise').querySelectorAll('[data-ready]:checked'), el=>Number(el.dataset.ready)); if(demo.ready.length===4){complete();feedback('You have reviewed the basics. Continue to the next lesson when you are ready.');} }
  });
  $('stage-tabs').addEventListener('click', event => { const b=event.target.closest('[data-stage]'); if(b)selectStage(b.dataset.stage); });
  $('stage-tabs').addEventListener('keydown', event => { const b=event.target.closest('[data-stage]'); if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const i=order.indexOf(b.dataset.stage),n=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:-1)+3)%3;order.forEach(id=>{$('tab-'+id).tabIndex=id===order[n]?0:-1;});$('tab-'+order[n]).focus(); });
  $('chapter-list').addEventListener('click', event => {const b=event.target.closest('[data-chapter]');if(b){state.chapter=Number(b.dataset.chapter);render(true);}});
  $('mobile-menu').addEventListener('click',()=>{$('mobile-menu').setAttribute('aria-expanded',String($('chapter-list').classList.toggle('open')));});
  $('previous').addEventListener('click',()=>{const i=order.indexOf(stage);if(i>0)selectStage(order[i-1],true);else if(state.chapter>0){state.chapter--;render(true);selectStage('apply');}});
  $('next').addEventListener('click',()=>{const i=order.indexOf(stage);if(i<2){selectStage(order[i+1],true);return;}if(state.chapter<5){state.chapter++;render(true);return;}const missing=lesson.chapters.findIndex(c=>!state.completed.includes(c.id));if(missing>=0){state.chapter=missing;render(true);selectStage('practice',true);toast('Revisit this practice before finishing the orientation.');}else{$('completion').hidden=false;$('completion').scrollIntoView({block:'center',behavior:'instant'});$('completion').querySelector('a').focus({preventScroll:true});}});
  $('copy-prompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(current().prompt);toast('Copied.');}catch{$('prompt').closest('details').open=true;toast('Select and copy the wording shown.');}});
  function audioState(){const playing=!audio.paused;$('play').setAttribute('aria-label',playing?'Pause narration':'Play narration');$('play').classList.toggle('is-playing',playing);$('play').innerHTML=`<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="${playing?'M6 5h4v14H6zm8 0h4v14h-4z':'M8 5v14l11-7z'}"/></svg>`;}
  $('play').addEventListener('click',async()=>{const version=generation;if(!audio.paused){audio.pause();return;}try{await audio.play();}catch{if(version===generation)$('caption').textContent='Audio could not start. Try again, or read this chapter below.';}});
  ['play','pause','ended'].forEach(name=>audio.addEventListener(name,audioState));
  audio.addEventListener('loadedmetadata',()=>{$('seek').max=String(audio.duration);$('seek').disabled=false;$('total').textContent=time(audio.duration);});
  audio.addEventListener('timeupdate',()=>{$('elapsed').textContent=time(audio.currentTime);$('seek').value=audio.currentTime;const cue=(media[current().id]?.cues||[]).find(c=>audio.currentTime>=c.start&&audio.currentTime<c.end);if(cue)$('caption').textContent=cue.text;else if(audio.ended)$('caption').textContent='Ready to try it? Continue when you want.';});
  audio.addEventListener('error',()=>{$('caption').textContent='Narration is unavailable. Read this chapter below and continue the practice.';$('seek').disabled=true;});
  $('seek').addEventListener('input',()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number($('seek').value);});$('speed').addEventListener('change',()=>{audio.playbackRate=Number($('speed').value);});
  $('watch-video').addEventListener('click',()=>{audio.pause();$('video-dialog').showModal();});$('close-video').addEventListener('click',()=>{$('video-dialog').close();});$('video-dialog').addEventListener('close',()=>{video.pause();$('watch-video').focus();});
  const stamp=seconds=>new Date(Math.round(seconds*1000)).toISOString().slice(11,23);
  const cues=lesson.chapters.flatMap(c=>(media[c.id]?.cues||[]).map(cue=>`${stamp(cue.start+media[c.id].offset)} --> ${stamp(cue.end+media[c.id].offset)}\n${cue.text}`));
  const captionURL=URL.createObjectURL(new Blob(['WEBVTT\n\n'+cues.join('\n\n')+'\n'],{type:'text/vtt'}));video.querySelector('track').src=captionURL;
  $('video-chapters').innerHTML=lesson.chapters.map(c=>`<button data-video-time="${media[c.id]?.offset||0}">${esc(c.short)}</button>`).join('');
  $('video-chapters').addEventListener('click',event=>{const b=event.target.closest('[data-video-time]');if(!b)return;const play=()=>{video.currentTime=Number(b.dataset.videoTime);video.play().catch(()=>toast('Press play on the video to continue.'));};if(video.readyState>=1)play();else{video.addEventListener('loadedmetadata',play,{once:true});video.load();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();});window.addEventListener('pagehide',()=>URL.revokeObjectURL(captionURL),{once:true});
  $('sources').innerHTML=lesson.sources.map(([label,url])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('');
  const glossary={Code:'Instructions a computer follows.',Project:'The related files you are working on, usually kept in a folder.',ZIP:'A package of files that you extract into a normal folder.',Path:'The address of a file or folder.',Terminal:'A window where you type commands.',Command:'An instruction for the computer, such as changing folders.',Prompt:'A place waiting for input, or the request you give an AI assistant. The meaning depends on the sentence.',Permission:'Approval for an action, such as editing a file.',Refresh:'Load the page again so you can see its current contents.',Verify:'Check what actually happened against what you wanted.'};
  $('glossary').innerHTML=Object.entries(glossary).map(([term,meaning])=>`<dt>${term}</dt><dd>${meaning}</dd>`).join('');
  $('reset').addEventListener('click',()=>{if(!resetPending){resetPending=true;$('reset').textContent='Confirm reset';$('reset-status').textContent='This clears orientation progress in this browser. The main lesson is unaffected.';return;}state.chapter=0;state.completed=[];Object.assign(demo,{windows:0,windowChosen:false,folder:0,terminal:0,request:0,draft:'',ready:[]});resetPending=false;$('reset').textContent='Reset orientation progress';$('reset-status').textContent='';render(true);});
  render();
  if(query.get('view')==='video')$('video-dialog').showModal();
})();
