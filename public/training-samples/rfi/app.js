/* Self-contained practice. User-entered notes remain in this tab. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const all = query => Array.from(document.querySelectorAll(query));
  const screens = all('.screen');
  let current = 0, completed = false, selected = null, activeFile = 'drawing', fragmentIndex = 0;
  let evidenceChecked = false, builderChecked = false;
  const reviewed = new Set(), attached = new Set();
  const placements = {question: null, reference: null, impact: null, proposal: null};
  const labels = {question:'Question',reference:'References',impact:'Impact & date',proposal:'Proposal'};
  const fragments = [
    {id:'reference', text:'S-2.1, detail 4: 6-inch slab. Approved dock leveler submittal, section 11 13 19: 8 inches with reinforcing.'},
    {id:'complaint', text:'This is the third time the drawings have contradicted themselves.'},
    {id:'proposal', text:'We propose the 8-inch slab and reinforcing described in the submittal, subject to design review.'},
    {id:'question', text:'Please confirm the required slab thickness and reinforcing beneath the loading dock pit.'},
    {id:'finish', text:'Also, please confirm the paint color in the lobby.'},
    {id:'impact', text:'Placement is planned for the 19th. A response by the 16th is requested to finalize the affected work.'}
  ];
  const parts = {
    question:['Make one decision possible.',fragments[3].text,'Name the location and the decision. “Please advise” leaves the reader to invent the question.'],
    reference:['Show both sides of the conflict.',fragments[0].text,'Exact references let the reviewer find the mismatch. Attach the relevant pages or markups through your project process.'],
    impact:['Tie the date to the work.',fragments[5].text,'Explain the consequence without assigning blame. A requested date does not override the contractual response period.'],
    proposal:['Give them something to evaluate.',fragments[2].text,'Explain your reasoning when you have a suitable proposal. Confirm cost, schedule and approval implications before work proceeds.']
  };
  const gaps = {
    question:['A statement is not the question.','A mismatch describes a symptom. Ask for the specific decision you need.',parts.question[1]],
    reference:['Which plans? Which detail?','The reviewer needs both sources, not a search assignment.',parts.reference[1]],
    impact:['“Soon” is not a work date.','Name the affected activity and the requested reply date. Keep the explanation factual.',parts.impact[1]],
    proposal:['A useful starting point is missing.','When appropriate, offer a reasoned resolution for design review. A proposal is never permission to build.',parts.proposal[1]]
  };
  const documents = {
    drawing:{name:'Structural detail',html:'<span class="source-tag">Structural drawing · S-2.1 / Detail 4</span><h3>Loading dock slab section</h3><svg class="drawing" viewBox="0 0 600 160" role="img" aria-label="Fictional section showing a 6-inch concrete slab over compacted base. Not for construction."><defs><pattern id="aggregate" width="16" height="16" patternUnits="userSpaceOnUse"><path d="m2 3 3 2m7 4 2 3m-10 1 3-2" stroke="#71828b" stroke-width="1"/></pattern></defs><path d="M40 50h440v42H40Z" fill="#d4dedf" stroke="#1b3246" stroke-width="2"/><path d="M40 94h440v35H40Z" fill="url(#aggregate)"/><path d="M500 50h35m-35 42h35m-14-42v42m-5-37 10-10m-10 52 10-10" stroke="#963e2b" stroke-width="2"/><text x="538" y="76">6 in</text><path d="M200 35v15" stroke="#1b3246"/><text x="123" y="26">Slab on grade</text><text x="180" y="150" class="tiny">COMPACTED BASE · SCHEMATIC ONLY</text></svg><p>The structural detail shows a <b>6-inch slab</b> at the loading dock. The equipment pit is in this area.</p>'},
    submittal:{name:'Dock leveler submittal',html:'<span class="source-tag">Approved equipment submittal · Section 11 13 19</span><h3>Foundation requirement at the pit</h3><div class="record-emphasis">8 inches <small>with reinforcing</small></div><p>The fictional dock leveler submittal calls for an 8-inch slab with number 5 bars at 12 inches each way beneath the pit.</p><p class="small">This differs from the structural detail. Refer the conflict to the design team; do not choose which governs yourself.</p>'},
    schedule:{name:'Placement plan',html:'<span class="source-tag">Field coordination · Loading dock</span><h3>The work waiting on an answer</h3><div class="schedule-line"><div><b>16th</b><br><span>Requested response</span></div><svg><use href="#i-arrow"/></svg><div><b>19th</b><br><span>Planned placement</span></div></div><p>The crew needs the reviewed detail to finalize the affected placement. Explain this dependency in the request.</p>'},
    finish:{name:'Lobby finishes',html:'<span class="source-tag">Finish schedule · Lobby</span><h3>A different question on the same project</h3><div class="finish-swatches" aria-hidden="true"><i></i><i></i><i></i></div><p>The lobby paint color needs confirmation. It does not affect the dock slab decision.</p><p class="small">Sharing a project does not make two questions the same issue. Follow the process for a separate clarification.</p>'}
  };
  function feedback(id, ok, text) { $(id).textContent=text; $(id).dataset.correct=String(ok); }
  function summary() {
    const correct = Object.entries(placements).filter(([key,value])=>key===value).length;
    const relevant = ['drawing','submittal','schedule'].filter(key=>attached.has(key)).length;
    return `${relevant} of 3 relevant records attached${attached.has('finish') ? ', plus an unrelated record' : ''}. ${builderChecked ? correct+' of 4 RFI fields correctly assembled at your latest review.' : 'The assembled RFI has not been reviewed yet.'}`;
  }
  function show(index, focus=true) {
    current=Math.max(0,Math.min(screens.length-1,index));
    screens.forEach((screen,i)=>{screen.hidden=i!==current;});
    screens[current].scrollTop=0;
    $('progress-text').textContent=screens[current].dataset.name;
    document.querySelector('.progress').setAttribute('aria-valuenow',current+1);
    $('bar-fill').style.width=((current+1)/screens.length*100)+'%';
    $('prev').disabled=current===0;
    $('next').querySelector('span').textContent=current===0?'Start':current===8?'Finish':'Next';
    $('final-score').textContent=summary();
    audio.pause();
    if (!$('narration-tray').hidden) prepareAudio();
    if (focus) screens[current].querySelector('h2').focus({preventScroll:true});
  }
  $('prev').addEventListener('click',()=>show(current-1));
  $('next').addEventListener('click',()=>{
    if(current<8) return show(current+1);
    audio.pause(); $('done-summary').textContent=summary(); $('done').showModal(); $('done-title').focus();
    if(!completed){completed=true;try{if(window.parent!==window)window.parent.postMessage({type:'ka-sample-complete',slug:'rfi-that-gets-answered',scores:{evidence:['drawing','submittal','schedule'].filter(x=>attached.has(x)).length+' of 3',assembly:Object.entries(placements).filter(([k,v])=>k===v).length+' of 4',reviewed:builderChecked}},'*');}catch{}}
  });
  $('done-close').onclick=()=>{$('done').close();$('next').focus();};
  $('done').addEventListener('cancel',()=>{setTimeout(()=>$('next').focus(),0);});
  $('return-practice').onclick=()=>show(6);
  const tabs=all('[role="tab"]');
  function setTab(tab){tabs.forEach(t=>{const active=t===tab;t.setAttribute('aria-selected',active);t.tabIndex=active?0:-1;$(t.getAttribute('aria-controls')).hidden=!active;});}
  tabs.forEach((tab,i)=>{tab.onclick=()=>setTab(tab);tab.onkeydown=e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();setTab(tabs[n]);tabs[n].focus();};});setTab(tabs[0]);
  all('[data-gap]').forEach(button=>button.onclick=()=>{const key=button.dataset.gap;reviewed.add(key);all('[data-gap]').forEach(b=>b.setAttribute('aria-pressed',b===button));$('gap-title').textContent=gaps[key][0];$('gap-copy').textContent=gaps[key][1];$('gap-example').textContent=gaps[key][2];$('gap-progress').textContent=reviewed.size+' of 4 phrases reviewed.';});
  all('[data-part]').forEach(button=>button.onclick=()=>{const key=button.dataset.part;all('[data-part]').forEach(b=>b.setAttribute('aria-pressed',b===button));$('part-label').textContent=labels[key];$('part-title').textContent=parts[key][0];$('part-example').textContent=parts[key][1];$('part-note').textContent=parts[key][2];});
  function renderDocument(){
    $('document-view').innerHTML=documents[activeFile].html;
    all('[data-file]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.file===activeFile);b.classList.toggle('attached',attached.has(b.dataset.file));});
    $('attach-evidence').querySelector('span').textContent=attached.has(activeFile)?'Remove this record':'Attach this record';
    $('attach-evidence').setAttribute('aria-pressed',attached.has(activeFile));
    $('evidence-status').textContent='Evidence collected: '+(attached.size?Array.from(attached).map(k=>documents[k].name).join(', ')+'.':'none yet.');
  }
  all('[data-file]').forEach(b=>b.onclick=()=>{activeFile=b.dataset.file;renderDocument();});
  $('attach-evidence').onclick=()=>{attached.has(activeFile)?attached.delete(activeFile):attached.add(activeFile);evidenceChecked=false;$('evidence-feedback').textContent='';renderDocument();};
  $('check-evidence').onclick=()=>{evidenceChecked=true;const missing=['drawing','submittal','schedule'].filter(k=>!attached.has(k));const ok=!missing.length&&!attached.has('finish');feedback('evidence-feedback',ok,ok?'The conflict is documented: 6 inches on the structural detail, 8 inches in the equipment submittal. The placement plan explains the requested response date.':(missing.length?'Still needed: '+missing.map(k=>documents[k].name).join(', ')+'. ':'')+(attached.has('finish')?'The lobby finish is unrelated. Remove it so this request stays focused.':''));};
  renderDocument();
  const fragmentNav=document.createElement('div');fragmentNav.className='fragment-nav';fragmentNav.innerHTML='<button type="button" class="button" id="fragment-prev" aria-label="Previous fragment"><svg class="back-arrow"><use href="#i-arrow"/></svg></button><span id="fragment-count"></span><button type="button" class="button" id="fragment-next" aria-label="Next fragment"><svg><use href="#i-arrow"/></svg></button>';$('fragment-bank').after(fragmentNav);
  function stepFragment(direction){for(let step=0;step<fragments.length;step++){fragmentIndex=(fragmentIndex+direction+fragments.length)%fragments.length;if(!Object.values(placements).includes(fragments[fragmentIndex].id))break;}selected=null;refreshBuilder();}
  $('fragment-prev').onclick=()=>stepFragment(-1);$('fragment-next').onclick=()=>stepFragment(1);
  fragments.forEach(fragment=>{const button=document.createElement('button');button.className='fragment';button.type='button';button.dataset.fragment=fragment.id;button.textContent=fragment.text;button.setAttribute('aria-pressed','false');button.onclick=()=>{selected=selected===fragment.id?null:fragment.id;refreshBuilder();};$('fragment-bank').append(button);});
  Object.keys(placements).forEach(key=>{const button=document.createElement('button');button.type='button';button.className='slot';button.dataset.slot=key;button.innerHTML='<b></b><span></span>';button.querySelector('b').textContent=labels[key];button.onclick=()=>{
    if(selected){placements[key]=selected;selected=null;}else if(placements[key]){const returned=placements[key];placements[key]=null;fragmentIndex=fragments.findIndex(f=>f.id===returned);refreshBuilder();document.querySelector('[data-fragment="'+returned+'"]').focus();}else{$('selection-note').textContent='Pick a fragment from the desk first.';return;}
    builderChecked=false;$('builder-feedback').textContent='';refreshBuilder();
  };$('rfi-slots').append(button);});
  function refreshBuilder(){
    if(Object.values(placements).includes(fragments[fragmentIndex].id)){for(let n=0;n<fragments.length;n++){fragmentIndex=(fragmentIndex+1)%fragments.length;if(!Object.values(placements).includes(fragments[fragmentIndex].id))break;}}
    all('[data-fragment]').forEach((b,i)=>{b.disabled=Object.values(placements).includes(b.dataset.fragment);b.hidden=i!==fragmentIndex||b.disabled;b.setAttribute('aria-pressed',selected===b.dataset.fragment);});
    $('fragment-count').textContent=(fragments.length-Object.values(placements).filter(Boolean).length)+' fragments on the desk';
    all('[data-slot]').forEach(b=>{const value=placements[b.dataset.slot];b.classList.toggle('filled',Boolean(value));b.querySelector('span').textContent=value?fragments.find(f=>f.id===value).text:'Place a fragment here';if(!builderChecked)b.removeAttribute('aria-invalid');b.setAttribute('aria-label',labels[b.dataset.slot]+': '+(value?fragments.find(f=>f.id===value).text+' Select to return or replace.':'Empty. Select to place the picked-up fragment.'));});
    $('selection-note').textContent=selected?'Picked up. Choose the field where this fragment belongs.':'Select a fragment to pick it up.';
    const count=Object.values(placements).filter(Boolean).length;$('builder-progress').textContent=count+' of 4 fields filled.';
  }
  $('review-rfi').onclick=()=>{
    builderChecked=true;const missing=Object.keys(placements).filter(k=>placements[k]!==k);
    all('[data-slot]').forEach(b=>b.setAttribute('aria-invalid',placements[b.dataset.slot]!==b.dataset.slot));
    feedback('builder-feedback',!missing.length,missing.length?'Needs another pass: '+missing.map(k=>labels[k]).join(', ')+'. Match each field to its job. Complaints and unrelated questions stay out of this request.':'Ready for practice review. One clear question, both references, a work-linked date and a proposal for design review. This is a complete handoff, not an approval to build.');
  };
  refreshBuilder();
  const handoffs={received:['At the design desk','They can open the right documents.','The structural detail and equipment submittal are identified together. The reviewer can see both requirements without sending you a request for references.','A vague request creates another search. A complete request makes the decision visible.'],reviewed:['During coordination','They know what needs a ruling.','The question asks for the slab thickness and reinforcing. Your proposal gives them an option to evaluate, and the placement plan explains when the answer is needed.','The designer may confirm, revise or request more information. A complete RFI supports review; it does not guarantee a deadline.'],returned:['Back with the field team','Check authority before acting.','Log and distribute the response through the project process. Confirm that it resolves the question. If the response affects scope, cost or time, follow the required change and approval procedure.','A response is not automatically permission for changed work. Confirm the required authorization before the crew proceeds.']};
  all('[data-handoff]').forEach(b=>b.onclick=()=>{all('[data-handoff]').forEach(x=>x.setAttribute('aria-pressed',x===b));const copy=handoffs[b.dataset.handoff];['handoff-label','handoff-title','handoff-copy','handoff-insight'].forEach((id,i)=>$(id).textContent=copy[i]);});
  $('download-card').onclick=()=>{const text='THE RFI THAT GETS ANSWERED\nK & A Performance | Practice checklist\n\nOne clear question: identify the location and decision.\nExact references: attach both sources when they disagree.\nImpact and requested date: tie the request to affected work.\nA reasoned proposal: offer for review when appropriate.\n\nFollow your project RFI and change procedures. A proposal or response does not automatically authorize changed work.\n\n'+summary();const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='KA-RFI-checklist.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const audio=$('narration-audio'),tray=$('narration-tray');
  function time(seconds){const n=Math.max(0,Math.floor(seconds||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
  function updateAudio(){
    const playing=!audio.paused&&!audio.ended;
    const label=playing?'Pause':audio.ended?'Replay':'Play';
    $('audio-toggle').setAttribute('aria-label',label+' audio');$('audio-toggle').querySelector('span').textContent=label;$('audio-toggle').querySelector('use').setAttribute('href',playing?'#i-pause':'#i-play');
    const duration=Number.isFinite(audio.duration)?audio.duration:0;
    $('audio-seek').max=duration;$('audio-seek').value=audio.currentTime||0;$('audio-seek').setAttribute('aria-valuetext',time(audio.currentTime)+' of '+time(duration));$('audio-time').textContent=time(audio.currentTime)+' / '+time(duration);
    $('audio-mute').setAttribute('aria-label',audio.muted?'Unmute audio':'Mute audio');
    const speaking=playing&&audio.readyState>=3;tray.classList.toggle('is-speaking',speaking);
    $('guide-state').textContent=audio.error?'Unavailable':audio.ended?'Complete':speaking?'Speaking':playing?'Loading':audio.currentTime>0?'Paused':'Ready';
  }
  function prepareAudio(){const source='assets/audio/screen-'+(current+1)+'.mp3';$('narration-title').textContent=screens[current].dataset.name;$('narration-copy').textContent=window.rfiNarration[current];$('narration-error').hidden=true;if(audio.getAttribute('src')!==source){audio.src=source;$('narration-copy').parentElement.scrollTop=0;}updateAudio();}
  function playAudio(){const source=audio.getAttribute('src');$('narration-error').hidden=true;if(audio.error)audio.load();audio.play().catch(error=>{if(error.name!=='AbortError'&&!tray.hidden&&audio.getAttribute('src')===source)$('narration-error').hidden=false;});}
  $('open-narration').onclick=()=>{tray.hidden=false;document.querySelector('.stage').classList.add('has-audio');$('open-narration').setAttribute('aria-expanded','true');prepareAudio();$('narration-title').focus({preventScroll:true});playAudio();};
  $('close-narration').onclick=()=>{audio.pause();tray.hidden=true;document.querySelector('.stage').classList.remove('has-audio');$('open-narration').setAttribute('aria-expanded','false');$('open-narration').focus();};
  tray.addEventListener('keydown',e=>{if(e.key==='Escape')$('close-narration').click();});
  $('audio-toggle').onclick=()=>audio.paused?playAudio():audio.pause();
  $('audio-mute').onclick=()=>{audio.muted=!audio.muted;updateAudio();};
  $('audio-seek').oninput=()=>{if(Number.isFinite(audio.duration))audio.currentTime=Number($('audio-seek').value);updateAudio();};
  ['play','playing','pause','ended','timeupdate','loadedmetadata','waiting','volumechange','emptied'].forEach(event=>audio.addEventListener(event,updateAudio));
  audio.addEventListener('error',()=>{$('narration-error').hidden=false;updateAudio();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();});
  function restart(){audio.pause();audio.removeAttribute('src');audio.load();tray.hidden=true;$('open-narration').setAttribute('aria-expanded','false');document.querySelector('.stage').classList.remove('has-audio');if($('done').open)$('done').close();completed=false;selected=null;fragmentIndex=0;attached.clear();reviewed.clear();evidenceChecked=false;builderChecked=false;Object.keys(placements).forEach(k=>placements[k]=null);$('evidence-feedback').textContent='';$('builder-feedback').textContent='';$('own-question').value='';document.querySelector('.transfer-prompt').open=false;activeFile='drawing';renderDocument();refreshBuilder();$('gap-title').textContent='Put yourself in their seat.';$('gap-copy').textContent='What exactly are they being asked to decide? Which documents should they open? What is waiting on the answer?';$('gap-example').textContent='Tap any underlined phrase to begin the review.';$('gap-progress').textContent='No phrases reviewed yet.';all('[data-gap]').forEach(b=>b.setAttribute('aria-pressed','false'));setTab(tabs[0]);all('[data-part]')[0].click();all('[data-handoff]')[0].click();show(0);}
  $('restart').onclick=restart;$('done-restart').onclick=restart;
  show(0,false);
})();
