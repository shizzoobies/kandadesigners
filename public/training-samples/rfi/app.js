/* The RFI that gets answered.
   Plain DOM, no framework, no network. Three jobs only:
     1. show one screen at a time and move focus to its heading,
     2. answer the choice buttons with visible, announced feedback,
     3. keep a score for the three decisions.

   Deliberately absent: focus looping. The piece runs inside an iframe on the
   site, and trapping Tab at the end of the last screen would turn the
   embed into a keyboard trap. Focus leaves naturally. Nothing here reads or
   writes window.top; the only message sent out is one completion ping. */

(function () {
  'use strict';

  var TOTAL = 8;
  var current = 1;
  var completedSent = false;

  var screens = [];
  for (var i = 1; i <= TOTAL; i += 1) {
    screens.push(document.getElementById('screen-' + i));
  }

  var progressText = document.getElementById('progress-text');
  var barFill = document.getElementById('bar-fill');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var scoreLine = document.getElementById('score-line');
  var finalScore = document.getElementById('final-score');
  var restartBtn = document.getElementById('restart');

  /* ---------- feedback copy ---------- */

  var CHECK = 'm4 10.5 4 4 8-9';
  var CROSS = 'M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5';

  var FEEDBACK = {
    scenario: {
      correct: 'Option B is the one to send. It names the sheet and the detail, names the competing specification section, asks one answerable question, ties a date to a real placement, and proposes an answer the reviewer can simply confirm.',
      wrong: 'Option A is the one that stalls. It names no sheet, no detail, no date, and no proposed answer, so the reviewer has to find the conflict before they can rule on it. The first reply will be a question back to you, and the placement date will already be closer.'
    },
    s1: {
      correct: 'Belongs. A sheet and detail number is the reference, and it is the difference between a reviewer ruling and a reviewer searching.',
      wrong: 'This one belongs in the RFI. It is the exact reference, the second of the four parts.'
    },
    s2: {
      correct: 'Leave it out. It is a grievance, not a question. It gives the reviewer something to answer other than the question, and the RFI log is read later by people looking for exactly this kind of sentence.',
      wrong: 'Leave this one out. Nothing in it can be answered, and it turns a technical question into an argument.'
    },
    s3: {
      correct: 'Belongs. A date tied to a real activity is the impact statement. It is the reason your RFI moves ahead of the one that says nothing about consequence.',
      wrong: 'This one belongs. It is the needed by date, tied to a real activity, which is the third of the four parts.'
    },
    s4: {
      correct: 'Leave it out. Earliest convenience is not a date. It reads as polite and functions as permission to answer whenever.',
      wrong: 'Leave this one out. It looks like an impact statement but it sets no date, so it does nothing at all.'
    },
    s5: {
      correct: 'Belongs. The proposed answer is the fourth part, and the one that most often turns a three week response into a two day one.',
      wrong: 'This one belongs. A proposed answer lets a reviewer who agrees reply in a single line.'
    },
    s6: {
      correct: 'Leave it out. A second unrelated question means the whole RFI waits on whichever answer takes longest. Write a second RFI.',
      wrong: 'Leave this one out. It is a different question for a different reviewer, and bundling it holds the slab question hostage to a paint selection.'
    },
    k1: {
      correct: 'Right call. The note is a symptom. The RFI needs the sheet, the section, and the depth actually available, or the reply comes back asking for all three.',
      wrong: 'Not the strongest move. Sending the note as written, or making a phone call, either starts the clock on an unanswerable question or leaves nothing in the log at all. Do the five minutes of looking first.'
    },
    k2: {
      correct: 'Right call. One question per RFI means one answer per number. Cross referencing keeps the reviewer oriented without bundling four rulings into one reply.',
      wrong: 'Not the strongest move. A single RFI with four questions cannot be partially approved, so one unresolved item holds the other three. Holding all four until you understand the whole assembly just moves the delay onto you.'
    },
    k3: {
      correct: 'Right call. A proposal stated as a proposal, with the reasoning attached, gives the reviewer something to confirm. It is not a claim of authority and it does not bind you.',
      wrong: 'Not the strongest move. Withholding the answer you already believe is correct means the reviewer starts from a blank page, and the crew stands by while they get there.'
    }
  };

  /* ---------- helpers ---------- */

  function glyph(ok) {
    return '<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' +
      (ok ? CHECK : CROSS) + '"/></svg>';
  }

  function renderFeedback(node, ok, text) {
    // Correctness is carried by the word first and the glyph second, never
    // by colour: the verdict word is readable with the stylesheet turned off.
    node.innerHTML = glyph(ok) +
      '<span class="verdict">' + (ok ? 'Correct.' : 'Not quite.') + '</span> ' + text;
  }

  function scoreDecisions() {
    var answered = 0;
    var right = 0;
    ['k1', 'k2', 'k3'].forEach(function (key) {
      var chosen = document.querySelector('[data-q="' + key + '"][aria-pressed="true"]');
      if (chosen) {
        answered += 1;
        if (chosen.getAttribute('data-correct') === 'true') {
          right += 1;
        }
      }
    });
    return { answered: answered, right: right };
  }

  function updateScoreLine() {
    var s = scoreDecisions();
    if (s.answered === 0) {
      scoreLine.textContent = 'Answered 0 of 3.';
    } else if (s.answered < 3) {
      scoreLine.textContent = 'Answered ' + s.answered + ' of 3. Right so far: ' + s.right + '.';
    } else {
      scoreLine.textContent = 'All three answered. You scored ' + s.right + ' of 3.';
    }
  }

  function updateFinalScore() {
    var s = scoreDecisions();
    if (s.answered === 0) {
      finalScore.textContent = 'You finished the piece. The three decisions are still unanswered if you want to go back for them.';
    } else if (s.answered < 3) {
      finalScore.textContent = 'You answered ' + s.answered + ' of the three decisions and got ' + s.right + ' right.';
    } else {
      finalScore.textContent = 'You scored ' + s.right + ' of 3 on the three decisions.';
    }
  }

  function announceCompletion() {
    if (completedSent) {
      return;
    }
    completedSent = true;
    // Best effort only. The host page is not required to listen, and a
    // packaged copy inside an LMS has no parent worth talking to.
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'ka-sample-complete', slug: 'rfi-that-gets-answered' }, '*');
      }
    } catch (err) {
      /* nothing depends on this */
    }
  }

  /* ---------- screen movement ---------- */

  function show(n, moveFocus) {
    current = Math.min(Math.max(n, 1), TOTAL);

    screens.forEach(function (section, index) {
      section.hidden = index + 1 !== current;
    });

    progressText.textContent = 'Screen ' + current + ' of ' + TOTAL;
    barFill.style.width = ((current / TOTAL) * 100) + '%';

    prevBtn.disabled = current === 1;
    nextBtn.disabled = current === TOTAL;
    nextBtn.textContent = current >= TOTAL - 1 ? 'Finish' : 'Next';

    if (current === TOTAL) {
      updateFinalScore();
      announceCompletion();
    }

    if (moveFocus) {
      var heading = screens[current - 1].querySelector('h2');
      if (heading) {
        heading.focus();
      }
    }
  }

  prevBtn.addEventListener('click', function () {
    show(current - 1, true);
  });

  nextBtn.addEventListener('click', function () {
    show(current + 1, true);
  });

  /* ---------- choices ---------- */

  document.addEventListener('click', function (event) {
    var btn = event.target.closest ? event.target.closest('[data-q]') : null;
    if (!btn) {
      return;
    }

    var key = btn.getAttribute('data-q');
    var ok = btn.getAttribute('data-correct') === 'true';

    // Single selection per question, and always re-answerable: nothing is
    // disabled, so nobody gets stuck on a wrong first guess.
    var group = document.querySelectorAll('[data-q="' + key + '"]');
    Array.prototype.forEach.call(group, function (other) {
      other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
    });

    var target = document.getElementById('fb-' + key);
    var copy = FEEDBACK[key];
    if (target && copy) {
      renderFeedback(target, ok, ok ? copy.correct : copy.wrong);
    }

    if (key === 'k1' || key === 'k2' || key === 'k3') {
      updateScoreLine();
    }
  });

  /* ---------- restart ---------- */

  if (restartBtn) {
    restartBtn.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (btn) {
        btn.setAttribute('aria-pressed', 'false');
      });
      Array.prototype.forEach.call(document.querySelectorAll('.feedback'), function (p) {
        p.textContent = '';
      });
      updateScoreLine();
      show(1, true);
    });
  }

  /* ---------- start ---------- */

  // No focus grab on load: the piece is embedded, and stealing focus would
  // yank the host page down to the frame before anyone asked it to.
  show(1, false);
}());
