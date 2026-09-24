(() => {
  'use strict';
  if (window.COURSE_ACCESS === false) return;
  const $ = id => document.getElementById(id);
  const chapters = window.LESSON.chapters;
  const key = 'ka-codex-desktop-practice-v1';
  const stages = ['listen', 'practice', 'apply'];
  const flagNames = ['welcome', 'setup', 'workspace', 'request', 'review', 'next', 'folder', 'local', 'pageOpened', 'explained', 'declined', 'resultOpened', 'refreshed', 'reported', 'recovered', 'backup'];
  let stored = {}, storageAvailable = true;
  try { stored = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { storageAvailable = false; }
  const state = { chapter: Number.isInteger(stored.chapter) && stored.chapter >= 0 && stored.chapter < 6 ? stored.chapter : 0,
    stage: stages.includes(stored.stage) ? stored.stage : 'listen',
    requestStep: Number.isInteger(stored.requestStep) && stored.requestStep >= 0 && stored.requestStep <= 3 ? stored.requestStep : 0,
    flags: Object.fromEntries(flagNames.map(name => [name, stored.flags?.[name] === true])),
    parts: ['change', 'keep', 'check'].map((_, i) => ['0','1','2'].includes(stored.parts?.[i]) ? stored.parts[i] : ''),
    checks: Array.isArray(stored.checks) ? stored.checks.filter(i => [0,1,2].includes(i)) : [],
    expected: typeof stored.expected === 'string' ? stored.expected.slice(0,300) : '',
    actual: typeof stored.actual === 'string' ? stored.actual.slice(0,300) : ''
  };
  // Completion is an ordered rehearsal, even if stored progress is malformed.
  let previousComplete = true;
  chapters.forEach(chapter => { state.flags[chapter.id] = previousComplete && state.flags[chapter.id]; previousComplete = state.flags[chapter.id]; });
  let goalPreview = '', workspaceView = 'files', feedbackText = '', retry = false;
  const audio = $('narration');
  const copy = [
    { title:'One change you can check.', intro:'Start with the result you want. Keep it small enough to judge for yourself.', takeaway:'You choose the goal. Codex helps with the files. You check the result.', action:'Open the practice page before you ask for changes. Name the heading you want and what should stay the same.' },
    { title:'Give the work a home.', intro:'Connect your task to the practice folder on your computer.', takeaway:'The project folder tells Codex where this task belongs.', action:'Download and unpack the starter. Keep its files together. Follow the official setup guide, open the extracted folder as a local project, and start a task inside it.' },
    { title:'Three places. Different jobs.', intro:'Find a file, ask for a change, and inspect the page in the right place.', takeaway:'Files help you find it. Codex helps you change it. The browser lets you see it.', action:'Find index.html in your practice folder and open it in your browser. Look for Weekend reading and three books. Return to your Codex conversation.' },
    { title:'Ask for one visible change.', intro:'Understand the project first. Then make the request specific enough to check.', takeaway:'Say what to change, what to preserve, and what to check.', action:'Ask for an explanation without edits first. Then send the heading request below. Read the progress updates and stop the task if it heads away from your goal.' },
    { title:'Check the work yourself.', intro:'A finished reply is a starting point for your review.', takeaway:'Read the proposed action. Then look at the actual result.', action:'Keep the normal workspace protections. Read any approval request. When the task finishes, ask which file changed, open or refresh the page, and compare it with your request.' },
    { title:'Recover without starting over.', intro:'Describe the mismatch, try a small check, and keep your place.', takeaway:'Expected result. Actual result. Smallest useful next step.', action:'If something looks wrong, describe what you expected and what you see. Include the exact error when useful. Keep an untouched starter copy and reopen the same project for the same task.' }
  ];
  const sentences = [
    ['Make the whole page better.', 'Change the heading from Weekend reading to My reading list.', 'Build a different website.'],
    ['Choose better books too.', 'Redesign the page while you work.', 'Keep the three books and the design the same.'],
    ['Explain which file changed and how to check the result.', 'Just tell me when you are done.', 'Publish it to the internet.']
  ];
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const current = () => chapters[state.chapter];
  const done = () => chapters.filter(c => state.flags[c.id]).length;
  function save() {
    try { localStorage.setItem(key, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
    $('save-status').textContent = storageAvailable ? 'Progress stays in this browser.' : 'Practice works, but this browser cannot save progress.';
  }
  function feedback(text, needsRetry = false) {
    feedbackText = text; retry = needsRetry;
    $('feedback').textContent = text; $('feedback').classList.toggle('retry', needsRetry);
  }
  function navigation() {
    $('chapters').innerHTML = chapters.map((c,i) => `<button type="button" data-chapter="${i}"${i === state.chapter ? ' aria-current="step"' : ''}>${esc(c.short)}${state.flags[c.id] ? '<small>Practiced</small>' : ''}</button>`).join('');
    alignChapter();
    $('progress').textContent = `${done()} of 6 practiced`;
    $('completion').hidden = done() !== 6;
    $('chapter-status').textContent = state.flags[current().id] ? 'Practice completed. Revisit whenever you want.' : 'Complete the practice to mark this chapter.';
  }
  function alignChapter() {
    const activeChapter = $('chapters').querySelector('[aria-current=step]');
    if ($('chapters').scrollWidth > $('chapters').clientWidth && activeChapter) {
      const container = $('chapters').getBoundingClientRect();
      const active = activeChapter.getBoundingClientRect();
      $('chapters').scrollLeft += active.left - container.left - (container.width - active.width) / 2;
    }
  }
  window.addEventListener('resize', alignChapter);
  function stage(value, focus = false) {
    state.stage = value;
    if (value !== 'listen') audio.pause();
    for (const id of stages) { $(id).hidden = id !== value; $('tab-'+id).setAttribute('aria-selected', String(id === value)); $('tab-'+id).tabIndex = id === value ? 0 : -1; }
    $('back').disabled = state.chapter === 0 && value === 'listen';
    $('next').textContent = value === 'listen' ? 'Try it' : value === 'practice' ? 'Use it in your project' : state.chapter === 5 ? 'Finish rehearsal' : 'Next chapter';
    save(); if (focus) $(value).focus({preventScroll:true});
  }
  function complete(id) { state.flags[id] = true; save(); navigation(); }
  function books(heading = 'Weekend reading', altered = false, redesigned = false) {
    return `<div class="page-preview${redesigned?' redesigned':''}"><div class="page-bar">BROWSER PREVIEW / index.html</div><div class="page-content"><h3>${esc(heading)}</h3><ul><li>${altered?'A newly chosen book':'The Creative Act'}</li><li>A Field Guide to Getting Lost</li><li>The Art of Noticing</li></ul></div></div>`;
  }
  const actionButton = (action, text, cls = 'primary') => `<button type="button" class="${cls}" data-action="${action}">${text}</button>`;
  const project = () => '<div class="project-header"><strong>reading-list-starter</strong><span>Local project</span><span>My first heading change</span></div>';
  function renderPractice(focus = false) {
    const id = current().id;
    const prerequisite = chapters.slice(0,state.chapter).findIndex(c => !state.flags[c.id]);
    if (prerequisite >= 0) {
      $('exercise').innerHTML = `<h2>Continue your practice project</h2><p>Each exercise uses the result of the previous one. Continue with <strong>${esc(chapters[prerequisite].short)}</strong>, or use the Listen and Use it tabs here.</p><button class="primary" data-chapter="${prerequisite}" type="button">Continue ${esc(chapters[prerequisite].short)}</button>`;
      feedback(''); return;
    }
    let html = '';
    if (id === 'welcome') {
      html = `<h2>Choose the result to aim for</h2><p>Your brief: change the heading to <strong>My reading list</strong>. Keep the three books and the design.</p><div class="exercise-grid"><div class="choice-list">${actionButton('goal-books','My reading list, with better books','choice')}${actionButton('goal-correct','My reading list, same books and design','choice')}${actionButton('goal-design','A completely redesigned reading page','choice')}</div>${books(goalPreview || state.flags.welcome ? 'My reading list' : 'Weekend reading',goalPreview==='books',goalPreview==='design')}</div>`;
      if (state.flags.welcome) html += '<p class="success">Your task brief is set. Carry these three requirements into the next chapter.</p>';
    }
    if (id === 'setup') {
      html = '<h2>Open the right project</h2>';
      if (!state.flags.folder) html += `<p>Which item contains the practice files you want Codex to work with?</p><div class="choice-list">${actionButton('folder-zip','reading-list-starter.zip <small>Downloaded package</small>','file-choice')}${actionButton('folder-client','client-website <small>A different project</small>','file-choice')}${actionButton('folder-correct','reading-list-starter <small>Extracted folder: index.html, styles.css, app.js</small>','file-choice')}</div>`;
      else if (!state.flags.local) html += `<div class="brief"><p class="eyebrow">SELECTED FOLDER</p><strong>reading-list-starter</strong><p>index.html · styles.css · app.js</p></div><p>Where should this practice task work?</p><div class="actions">${actionButton('location-cloud','Cloud environment','secondary')}${actionButton('location-local','Use this folder locally')}${actionButton('location-worktree','Separate worktree','secondary')}</div>`;
      else html += project() + (state.flags.setup ? '<p class="success">Your practice task is open in the right folder.</p>' : `<p>The project is ready. Start a conversation for your heading change.</p>${actionButton('start-task','Start My first heading change')}`);
    }
    if (id === 'workspace') {
      html = '<h2>Look at the starting page</h2>'+project();
      if (state.flags.workspace) html += `<p class="success">You checked the page and returned to the Codex conversation.</p>${books()}`;
      else if (workspaceView === 'browser') html += `<p>You are looking at the page before any edits.</p>${books()}<div class="actions">${actionButton('return-codex','Return to Codex')}</div>`;
      else if (workspaceView === 'index') html += `<p><strong>index.html</strong> is the file containing the page. Open it in the browser to see the heading and books.</p>${actionButton('open-browser','Open in browser')}`;
      else html += `<p>Use the file manager to find the page you can view.</p><div class="choice-list">${actionButton('open-style','styles.css <small>Appearance rules</small>','file-choice')}${actionButton('open-index','index.html <small>The reading-list page</small>','file-choice')}${actionButton('ask-page','Ask Codex to guess what the page looks like','choice')}</div>`;
    }
    if (id === 'request') {
      html = '<h2>Give the work a clear boundary</h2>'+project();
      if (!state.flags.explained) html += `<p>Before editing, find out what is in the folder.</p><div class="conversation">Explain this practice project in everyday language. Do not change any files yet.</div>${actionButton('explain','Send this read-only request')}`;
      else if (state.flags.request) html += '<div class="conversation"><strong>Simulated Codex reply</strong><p>I changed the heading in index.html to My reading list. The books and styles were left alone. Open index.html in your browser and refresh to check.</p></div><p class="success">The simulated file is changed. The result still needs your review.</p>';
      else {
        html += '<details class="explanation"><summary>No files changed. Read the explanation.</summary><p>Simulated Codex reply: index.html contains the reading page. styles.css controls its appearance. I have not changed any files.</p></details>';
        if (state.requestStep < 3) {
          const i = state.requestStep;
          const labels = ['What should change?', 'What should stay the same?', 'What should Codex report?'];
          html += '<p>Build a request that matches your brief, one sentence at a time.</p><div class="request-fields"><label for="part-' + i + '">' + labels[i] + '<select id="part-' + i + '" data-part="' + i + '"><option value="">Choose a sentence</option>' + sentences[i].map((sentence,j) => '<option value="' + j + '"' + (state.parts[i]===String(j)?' selected':'') + '>' + esc(sentence) + '</option>').join('') + '</select></label></div><p id="sentence-detail" class="sentence-detail">' + esc(state.parts[i] !== '' ? sentences[i][Number(state.parts[i])] : '') + '</p><div class="actions">' + (i>0?actionButton('previous-sentence','Previous sentence','secondary'):'') + actionButton('next-sentence',i===2?'Review the whole request':'Keep building') + '</div>';
        } else html += '<p>Read your whole request before sending it.</p><p class="request-preview" id="request-preview">' + esc(requestText()) + '</p><div class="actions">' + actionButton('edit-request','Revise the sentences','secondary') + actionButton('send-request','Send practice request') + '</div>';
      }
    }
    if (id === 'review') {
      html = '<h2>Review what is actually needed</h2>'+project();
      if (!state.flags.declined) html += `<p>This is an illustrative approval request. Allowed local edits may happen without another prompt.</p><div class="conversation"><strong>Proposed extra action</strong><p>Upload the project files to an external website and publish the page.</p></div><div class="actions">${actionButton('approve-publish','Approve publishing','secondary')}${actionButton('decline-publish','Decline and ask why')}</div>`;
      else if (!state.flags.resultOpened) html += `<div class="conversation"><strong>Simulated reply</strong><p>Publishing is not needed for this local heading change. The changed file is index.html.</p></div><p>How will you decide whether the work is ready?</p><div class="actions">${actionButton('trust-summary','Accept the summary alone','secondary')}${actionButton('inspect-result','Open the browser preview')}</div>`;
      else html += `<p>${state.flags.refreshed?'Compare the refreshed page with your brief.':'The browser is still showing the older page. Load the current file before judging it.'}</p>${books(state.flags.refreshed?'My reading list':'Weekend reading')}<div class="actions">${actionButton('refresh-result','Refresh the preview','secondary')}</div>${state.flags.refreshed?`<div class="checks">${['The heading is My reading list.','The same three books remain.','The design stayed the same.'].map((label,i)=>`<label><input type="checkbox" data-check="${i}"${state.checks.includes(i)?' checked':''}>${label}</label>`).join('')}</div>${actionButton('verify-result',state.flags.review?'Result checked':'Confirm the result')}`:''}`;
    }
    if (id === 'next') {
      html = '<h2>Investigate a mismatch</h2>'+project();
      if (state.flags.next) html += `<p class="success">You recovered the preview and know how to resume the task.</p>${books('My reading list')}`;
      else if (!state.flags.reported) html += `<p>A practice twist: the file summary says the heading changed, but this old browser view still shows Weekend reading. Describe both sides before asking for more edits.</p>${books()}<form id="recovery-form" class="request-fields"><label for="expected">What did you expect?<input id="expected" maxlength="300" required placeholder="The heading My reading list" value="${esc(state.expected)}"></label><label for="actual">What do you see?<input id="actual" maxlength="300" required placeholder="The old heading Weekend reading" value="${esc(state.actual)}"></label><button class="primary" type="submit">Ask for the smallest next step</button></form>`;
      else if (!state.flags.recovered) html += `<div class="conversation"><strong>Simulated Codex reply</strong><p>The browser may still be showing the previous file. Refresh the same page before making another edit.</p></div><div class="actions">${actionButton('rebuild','Rebuild the whole page','secondary')}${actionButton('recover-refresh','Refresh the same page')}</div>`;
      else if (!state.flags.backup) html += `<p class="success">The refreshed heading matches. No extra file edit was needed.</p>${books('My reading list')}<p>How will you keep a way to practice again?</p><div class="actions">${actionButton('close-undo','Close the conversation to undo changes','secondary')}${actionButton('keep-copy','Keep an untouched starter copy')}</div>`;
      else html += `<p>You kept the original starter. When you come back to this same task, where will you continue?</p><div class="choice-list">${actionButton('new-project','Start in a different project','choice')}${actionButton('resume-project','Reopen this project and conversation','choice')}</div>`;
    }
    $('exercise').innerHTML = html;
    feedback(feedbackText,retry);
    if (focus) { const heading = $('exercise').querySelector('h2'); if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); } }
  }
  function requestText() { return state.parts.map((part,i) => sentences[i][Number(part)] && part !== '' ? sentences[i][Number(part)] : '').filter(Boolean).join(' ') || 'Your selected sentences will appear here.'; }
  function render(focus = false) {
    audio.pause(); const c = current(), content = copy[state.chapter];
    $('phase').textContent = c.phase; $('title').textContent = content.title; $('intro').textContent = content.intro;
    $('takeaway').textContent = content.takeaway; $('action').textContent = content.action;
    $('transcript').textContent = c.narration; $('real-prompt').value = c.prompt;
    $('copy-status').textContent = ''; $('audio-status').textContent = ''; $('caption').textContent = 'Play the guide, or read the transcript.';
    audio.src = `/course-app/codex-orientation/assets/audio/${c.id}.mp3`; audio.load();
    feedbackText = ''; retry = false; renderPractice(); navigation(); stage(state.stage);
    if (focus) { $('lesson').focus({preventScroll:true}); $('lesson').scrollIntoView({block:'start',behavior:'instant'}); }
  }
  function navigate(index) { state.chapter = index; state.stage = 'listen'; goalPreview = ''; workspaceView = 'files'; render(true); }
  function act(action) {
    feedbackText = ''; retry = false;
    const f = state.flags;
    switch(action) {
      case 'goal-books': goalPreview='books'; feedback('The heading matches, but a book changed too. Compare with the brief and choose again.',true); break;
      case 'goal-design': goalPreview='design'; feedback('This changes the design as well. Our task keeps the design and books unchanged.',true); break;
      case 'goal-correct': goalPreview=''; complete('welcome'); feedback('That gives you three concrete things to check: heading, books, and design.'); break;
      case 'folder-zip': feedback('This is the download package. Extract it first, then choose the reading-list-starter folder shown below.',true); break;
      case 'folder-client': feedback('That is another website. Choose the extracted practice folder so your task stays with the right files.',true); break;
      case 'folder-correct': f.folder=true; feedback('The extracted folder contains the files we need. Choose where this task will run.'); break;
      case 'location-cloud': case 'location-worktree': feedback('Today we are practicing in the folder on this computer. Choose Local. Other work environments can wait.',true); break;
      case 'location-local': f.local=true; feedback('Local means this task works with the selected folder on your computer.'); break;
      case 'start-task': complete('setup'); feedback('Your task now belongs to reading-list-starter.'); break;
      case 'open-style': feedback('styles.css controls how the page looks. To view the page itself, open index.html in your browser.',true); break;
      case 'ask-page': feedback('An explanation can help you find the page, but you still need to inspect it. Start with index.html.',true); break;
      case 'open-index': workspaceView='index'; break;
      case 'open-browser': workspaceView='browser'; f.pageOpened=true; feedback('Weekend reading and three books: this is your starting point.'); break;
      case 'return-codex': if(f.pageOpened){complete('workspace');feedback('You are back in the conversation, ready to explain what should change.');} break;
      case 'explain': f.explained=true; feedback('The project was explained without changing it. Now build your request.'); break;
      case 'next-sentence': if(state.parts[state.requestStep]==='')feedback('Choose a sentence before continuing.',true);else state.requestStep=Math.min(3,state.requestStep+1);break;
      case 'previous-sentence': state.requestStep=Math.max(0,state.requestStep-1);break;
      case 'edit-request': state.requestStep=0;break;
      case 'send-request':
        if(state.parts.some(p=>p===''))feedback('Choose one sentence for each part of your request.',true);
        else if(state.parts[0]!=='1')feedback('The assistant would need a clearer goal. Name the exact heading change so you can check it.',true);
        else if(state.parts[1]!=='2')feedback(state.parts[1]==='0'?'That would invite the assistant to replace books. Your brief keeps all three. Revise the boundary.':'That would invite design changes. Your brief keeps the design. Revise the boundary.',true);
        else if(state.parts[2]!=='0')feedback('Ask which file changed and how to check it. Publishing or a finished message alone does not answer that.',true);
        else {complete('request');feedback('The simulated edit is complete. Next, check the proposed actions and inspect the result.');} break;
      case 'approve-publish': feedback('Publishing was not part of the task. It sends the project elsewhere and is unnecessary for a local heading change. Nothing was uploaded. Try again.',true); break;
      case 'decline-publish': f.declined=true; feedback('You kept the task within the agreed scope.'); break;
      case 'trust-summary': feedback('The summary tells you what the assistant reports. Open the page to check the result yourself.',true); break;
      case 'inspect-result': f.resultOpened=true; break;
      case 'refresh-result': f.refreshed=true; feedback('The preview now shows the current file. Compare all three requirements.'); break;
      case 'verify-result': if(f.refreshed&&state.checks.length===3){complete('review');feedback('Checked: the new heading, all three books, and the same design.');}else feedback('Inspect and confirm all three requirements before accepting the result.',true);break;
      case 'rebuild': feedback('One stale preview is not a reason to rebuild. Try the suggested refresh first.',true);break;
      case 'recover-refresh': f.recovered=true; feedback('The refreshed page shows My reading list. The file did not need another change.');break;
      case 'close-undo': feedback('Closing the conversation does not undo file changes. Keep an untouched starter copy for another practice run.',true);break;
      case 'keep-copy': f.backup=true; feedback('You have a fresh starting point for another rehearsal.');break;
      case 'new-project': feedback('That would disconnect this conversation from the project you were working on. Reopen the same project for this task.',true);break;
      case 'resume-project': complete('next'); feedback('Your rehearsal is complete. The same project and conversation keep this task together.');break;
    }
    save(); renderPractice(true); navigation();
  }
  document.addEventListener('click', event => {
    const chapter = event.target.closest('[data-chapter]');
    if(chapter){navigate(Number(chapter.dataset.chapter));return;}
    const control = event.target.closest('[data-action]'); if(control)act(control.dataset.action);
  });
  $('practice').addEventListener('change', event => {
    if(event.target.matches('[data-part]')){state.parts[Number(event.target.dataset.part)]=event.target.value;if($('request-preview'))$('request-preview').textContent=requestText();if($('sentence-detail'))$('sentence-detail').textContent=event.target.value!==''?sentences[Number(event.target.dataset.part)][Number(event.target.value)]:'';save();}
    if(event.target.matches('[data-check]')){const i=Number(event.target.dataset.check);state.checks=state.checks.filter(n=>n!==i);if(event.target.checked)state.checks.push(i);save();}
  });
  $('practice').addEventListener('input', event => {
    if(['expected','actual'].includes(event.target.id)){state[event.target.id]=event.target.value;save();}
  });
  $('practice').addEventListener('submit', event => {
    if(event.target.id!=='recovery-form')return;event.preventDefault();
    const clean = text => text.toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ');
    if(!clean(state.expected).includes('my reading list')||!clean(state.actual).includes('weekend reading')) {feedback('Name the two visible headings: you expected My reading list, but you see Weekend reading. This exercise checks those details, not your writing style.',true);return;}
    state.flags.reported=true;feedback('You described the gap before asking for more changes.');save();renderPractice(true);
  });
  stages.forEach(id=>$('tab-'+id).addEventListener('click',()=>stage(id)));
  document.querySelector('[role=tablist]').addEventListener('keydown',event=>{
    const index=stages.indexOf(state.stage);let target;
    if(event.key==='ArrowRight')target=(index+1)%3;if(event.key==='ArrowLeft')target=(index+2)%3;if(event.key==='Home')target=0;if(event.key==='End')target=2;
    if(target!==undefined){event.preventDefault();stage(stages[target]);$('tab-'+stages[target]).focus();}
  });
  $('back').addEventListener('click',()=>{const index=stages.indexOf(state.stage);if(index>0)stage(stages[index-1],true);else if(state.chapter>0)navigate(state.chapter-1);});
  $('next').addEventListener('click',()=>{
    const index=stages.indexOf(state.stage);
    if(index<2){stage(stages[index+1],true);return;}
    if(!state.flags[current().id]){stage('practice',true);feedback('Complete this short practice before moving to the next chapter. You can still revisit other chapters from the chapter list.',true);return;}
    if(state.chapter<5)navigate(state.chapter+1);else if(done()===6){$('completion').hidden=false;$('completion').focus();$('completion').scrollIntoView({block:'nearest',behavior:'instant'});}
  });
  $('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('real-prompt').value);$('copy-status').textContent='Message copied.';}catch{$('real-prompt').focus();$('real-prompt').select();$('copy-status').textContent='Select and copy the message above.';}});
  audio.addEventListener('timeupdate',()=>{const cues=window.MEDIA[current().id]?.cues||[];const cue=cues.find(c=>audio.currentTime>=c.start&&audio.currentTime<c.end);if(cue)$('caption').textContent=cue.text.replace(/\n/g,' ');});
  audio.addEventListener('error',()=>{$('audio-status').textContent='Audio could not load. You can read the transcript and keep practicing.';});
  let resetConfirmed = false;
  $('reset').addEventListener('click',()=>{resetConfirmed=false;$('reset-dialog').showModal();$('cancel-reset').focus();});
  $('cancel-reset').addEventListener('click',()=>$('reset-dialog').close());
  $('confirm-reset').addEventListener('click',()=>{resetConfirmed=true;flagNames.forEach(name=>state.flags[name]=false);state.chapter=0;state.stage='listen';state.parts=['','',''];state.requestStep=0;state.checks=[];state.expected='';state.actual='';goalPreview='';workspaceView='files';$('reset-dialog').close();save();render(true);});
  $('reset-dialog').addEventListener('close',()=>$(resetConfirmed?'lesson':'reset').focus({preventScroll:true}));
  render();
})();
