(() => {
  if(window.COURSE_ACCESS === false)return;
  const audio=document.getElementById('narration');
  const guide=document.querySelector('.audio-guide');
  const status=document.getElementById('guide-state');
  if(!audio||!guide||!status)return;
  function update(){
    const speaking=!audio.paused&&!audio.ended&&audio.readyState>=3&&!audio.error;
    guide.classList.toggle('is-speaking',speaking);
    status.textContent=audio.error?'Read transcript':audio.ended?'Complete':speaking?'Speaking':!audio.paused?'Loading':audio.currentTime>0?'Paused':'Ready';
  }
  for(const event of ['play','playing','pause','ended','emptied','loadstart','loadedmetadata','waiting','error'])audio.addEventListener(event,update);
  update();
})();
