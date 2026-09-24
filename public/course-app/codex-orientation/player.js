(() => {
  if (window.COURSE_ACCESS === false) return;
  const video = document.getElementById('orientation-video');
  const chapters = window.LESSON.chapters.map(chapter => ({
    title: chapter.short,
    start: window.MEDIA[chapter.id].offset,
    end: window.MEDIA[chapter.id].offset + window.MEDIA[chapter.id].videoDuration
  }));
  const container = document.getElementById('chapters');
  const time = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  chapters.forEach(chapter => {
    const button = document.createElement('button');
    button.type = 'button';
    const stamp = document.createElement('time');
    stamp.textContent = time(chapter.start);
    stamp.dateTime = `PT${chapter.start}S`;
    const title = document.createElement('span');
    title.textContent = chapter.title;
    button.append(stamp, title);
    button.addEventListener('click', () => {
      video.currentTime = chapter.start;
      video.play().catch(() => {});
    });
    container.append(button);
  });
  const buttons = [...container.querySelectorAll('button')];
  const highlight = () => {
    // Media timestamps may round a chapter boundary down by a microsecond.
    const active = chapters.findLastIndex(chapter => chapter.start <= video.currentTime + 0.001);
    buttons.forEach((button, index) => {
      if (index === active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };
  video.addEventListener('timeupdate', highlight);
  video.addEventListener('seeked', highlight);
  video.addEventListener('error', () => { document.getElementById('video-error').hidden = false; });
  video.querySelector('source').addEventListener('error', () => { document.getElementById('video-error').hidden = false; });
  highlight();
  const transcript = document.getElementById('transcript');
  window.LESSON.chapters.forEach(chapter => {
    const section = document.createElement('section');
    const heading = document.createElement('h2');
    heading.textContent = chapter.short;
    const paragraph = document.createElement('p');
    paragraph.textContent = chapter.narration;
    const prompt = document.createElement('blockquote');
    prompt.textContent = chapter.prompt;
    section.append(heading, paragraph, prompt);
    transcript.append(section);
  });
})();
