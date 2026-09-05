/* The RFI that gets answered.
   Plain DOM, no framework, no network. Six jobs only:
     1. show one screen at a time and move focus to its heading,
     2. enhance the marked up sections into WAI-ARIA tab sets,
     3. enhance the marked up sections into in-screen sub-steps,
     4. answer the choice buttons with visible, announced feedback,
     5. keep a score for the three decisions and the six fragments,
     6. end the piece on Finish with a native modal dialog that says so.

   Tab sets and sub-steps are built here rather than written into the HTML
   so that with scripting off every panel and every step renders open, in
   order, inside one ordinary scrolling document. Nothing is removed from
   the DOM; inactive panels carry the hidden attribute and come back.

   Deliberately absent: focus looping. The piece runs inside an iframe on the
   site, and trapping Tab at the end of the last screen would turn the
   embed into a keyboard trap. Focus leaves naturally. Nothing here reads or
   writes window.top; the only message sent out is one completion ping. */

(function () {
  'use strict';

  var TOTAL = 9;
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

  var doneDialog = document.getElementById('done');
  var doneTitle = document.getElementById('done-title');
  var doneCloseBtn = document.getElementById('done-close');
  var doneReviewBtn = document.getElementById('done-review');
  var doneRestartBtn = document.getElementById('done-restart');
  var doneDecisions = document.getElementById('done-decisions');
  var doneSorter = document.getElementById('done-sorter');
  var returnFocusTo = null;

  var resetters = [];

  function list(nodes) {
    return Array.prototype.slice.call(nodes);
  }

  /* ---------- feedback copy ---------- */

  // Drawing symbols, drawn in the reviewer's pen: a check for a correct
  // answer, the revision delta for one that needs another pass.
  var CHECK = 'm4 10.5 4 4 8-9';
  var DELTA = 'M10 3.6 17.2 16.4H2.8Z';

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
      (ok ? CHECK : DELTA) + '"/></svg>';
  }

  function renderFeedback(node, ok, text) {
    // Correctness is carried by the word first and the glyph second, never
    // by colour: the verdict word is readable with the stylesheet turned off.
    // data-mark is the only hook the skin needs: it draws the revision cloud
    // around the note and picks the pen colour. Nothing depends on it here.
    node.setAttribute('data-mark', ok ? 'ok' : 'no');
    node.innerHTML = glyph(ok) +
      '<span class="verdict">' + (ok ? 'Correct.' : 'Not quite.') + '</span> ' + text;
  }

  function tally(keys) {
    var answered = 0;
    var right = 0;
    keys.forEach(function (key) {
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

  function scoreDecisions() {
    return tally(['k1', 'k2', 'k3']);
  }

  function scoreSorter() {
    return tally(['s1', 's2', 's3', 's4', 's5', 's6']);
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

  // Sent on the first press of Finish, never on merely arriving at the last
  // screen: reaching the checklist is not the same as saying you are done.
  function announceCompletion() {
    if (completedSent) {
      return;
    }
    completedSent = true;
    // Best effort only. The host page is not required to listen, and a
    // packaged copy inside an LMS has no parent worth talking to.
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'ka-sample-complete',
          slug: 'rfi-that-gets-answered',
          scores: {
            decisions: scoreDecisions().right + ' of 3',
            sorter: scoreSorter().right + ' of 6'
          }
        }, '*');
      }
    } catch (err) {
      /* nothing depends on this */
    }
  }

  /* ---------- the ending ----------
     A native modal dialog. Esc, the close button and a click on the backdrop
     all close it; whatever closed it decides where focus lands, and the
     default is back on the Finish button that opened it. No focus trap of our
     own: showModal already scopes the tab ring to the dialog. */

  function fillDone() {
    var d = scoreDecisions();
    var s = scoreSorter();
    if (doneDecisions) {
      doneDecisions.textContent = d.right + ' of 3';
    }
    if (doneSorter) {
      doneSorter.textContent = s.right + ' of 6 correct';
    }
  }

  function openDone() {
    if (!doneDialog || typeof doneDialog.showModal !== 'function') {
      // No dialog support: the checklist screen is the ending, so leave the
      // learner on it rather than doing nothing visible at all.
      var heading = screens[TOTAL - 1].querySelector('h2');
      if (heading) {
        heading.focus();
      }
      return;
    }
    fillDone();
    returnFocusTo = nextBtn;
    doneDialog.showModal();
    if (doneTitle) {
      doneTitle.focus();
    }
  }

  if (doneDialog) {
    doneDialog.addEventListener('close', function () {
      var target = returnFocusTo || nextBtn;
      returnFocusTo = null;
      if (target) {
        target.focus();
      }
    });

    // A click that lands on the dialog box itself is a click on the backdrop:
    // the card fills the box, so anything inside it has a different target.
    doneDialog.addEventListener('click', function (event) {
      if (event.target === doneDialog) {
        doneDialog.close();
      }
    });
  }

  if (doneCloseBtn) {
    doneCloseBtn.addEventListener('click', function () {
      doneDialog.close();
    });
  }

  if (doneReviewBtn) {
    doneReviewBtn.addEventListener('click', function () {
      returnFocusTo = screens[TOTAL - 1].querySelector('h2');
      doneDialog.close();
    });
  }

  /* ---------- tab sets ----------
     Automatic activation, roving tabindex, Left, Right, Home and End, per
     the WAI-ARIA authoring practices. Panels are focusable because none of
     them contains a control of its own. */

  function buildTabs() {
    list(document.querySelectorAll('[data-tabs]')).forEach(function (group, gi) {
      var panels = list(group.children).filter(function (el) {
        return el.classList.contains('tabsec');
      });
      if (panels.length < 2) {
        return;
      }

      var tablist = document.createElement('div');
      tablist.className = 'tablist';
      tablist.setAttribute('role', 'tablist');
      tablist.setAttribute('aria-label', group.getAttribute('data-tabs-label') || 'Sections');

      var tabs = [];

      panels.forEach(function (panel, index) {
        var heading = panel.querySelector('h3');
        var label = heading ? heading.textContent : 'Part ' + (index + 1);
        var tabId = 'tg' + gi + '-tab-' + index;
        var panelId = 'tg' + gi + '-panel-' + index;

        if (heading) {
          // The tab button now carries this text as its label.
          heading.hidden = true;
        }

        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'tab';
        tab.id = tabId;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', panelId);
        tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
        tab.tabIndex = index === 0 ? 0 : -1;
        tab.textContent = label;
        tablist.appendChild(tab);
        tabs.push(tab);

        panel.id = panelId;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
        panel.tabIndex = 0;
        panel.hidden = index !== 0;
      });

      group.insertBefore(tablist, group.firstChild);

      function select(index, focus) {
        tabs.forEach(function (tab, i) {
          var on = i === index;
          tab.setAttribute('aria-selected', on ? 'true' : 'false');
          tab.tabIndex = on ? 0 : -1;
          panels[i].hidden = !on;
        });
        if (focus) {
          tabs[index].focus();
        }
      }

      tabs.forEach(function (tab, index) {
        tab.addEventListener('click', function () {
          select(index, true);
        });
      });

      tablist.addEventListener('keydown', function (event) {
        var from = tabs.indexOf(document.activeElement);
        if (from < 0) {
          return;
        }
        var to = -1;
        if (event.key === 'ArrowRight') {
          to = (from + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
          to = (from - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
          to = 0;
        } else if (event.key === 'End') {
          to = tabs.length - 1;
        }
        if (to >= 0) {
          event.preventDefault();
          select(to, true);
        }
      });

      resetters.push(function () {
        select(0, false);
      });
    });
  }

  /* ---------- sub-steps ----------
     A small pager inside the screen, pinned under the screen body, with its
     own polite count. The outer "Sheet N of 9" count is untouched. */

  function buildSteps() {
    list(document.querySelectorAll('[data-substeps]')).forEach(function (group) {
      var steps = list(group.children).filter(function (el) {
        return el.classList.contains('step');
      });
      if (steps.length < 2) {
        return;
      }

      var noun = group.getAttribute('data-step-noun') || 'step';
      var title = noun.charAt(0).toUpperCase() + noun.slice(1);
      var at = 0;

      steps.forEach(function (step, index) {
        var heading = step.querySelector('h3');
        if (heading) {
          heading.tabIndex = -1;
        }
        step.hidden = index !== 0;
      });

      var bar = document.createElement('div');
      bar.className = 'substep-bar';

      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'btn-mini';
      back.textContent = 'Previous ' + noun;

      var count = document.createElement('p');
      count.className = 'substep-count';
      count.setAttribute('role', 'status');
      count.setAttribute('aria-live', 'polite');
      count.textContent = title + ' 1 of ' + steps.length;

      var forward = document.createElement('button');
      forward.type = 'button';
      forward.className = 'btn-mini';
      forward.textContent = 'Next ' + noun;

      bar.appendChild(back);
      bar.appendChild(count);
      bar.appendChild(forward);

      var screen = group.closest('.screen');
      (screen || group.parentNode).appendChild(bar);

      function go(index, moveFocus) {
        at = Math.min(Math.max(index, 0), steps.length - 1);
        steps.forEach(function (step, i) {
          step.hidden = i !== at;
        });
        back.disabled = at === 0;
        forward.disabled = at === steps.length - 1;
        count.textContent = title + ' ' + (at + 1) + ' of ' + steps.length;
        if (moveFocus) {
          var target = steps[at].querySelector('h3') ||
            steps[at].querySelector('button, [href], input, select, textarea');
          if (target) {
            target.focus();
          }
        }
      }

      back.addEventListener('click', function () {
        go(at - 1, true);
      });
      forward.addEventListener('click', function () {
        go(at + 1, true);
      });

      go(0, false);

      resetters.push(function () {
        go(0, false);
      });
    });
  }

  /* ---------- screen movement ---------- */

  function show(n, moveFocus) {
    current = Math.min(Math.max(n, 1), TOTAL);

    screens.forEach(function (section, index) {
      var on = index + 1 === current;
      section.hidden = !on;
      section.classList.toggle('on', on);
    });

    // "Sheet", not "Screen": the counter is a cell in the title block.
    progressText.textContent = 'Sheet ' + current + ' of ' + TOTAL;
    barFill.style.width = ((current / TOTAL) * 100) + '%';

    prevBtn.disabled = current === 1;
    // The last screen is where the piece ends, so the pager ends with a live
    // Finish rather than a greyed out Next. The cover sheet gets Start,
    // because the button on a cover opens the set rather than paging through
    // one already open.
    nextBtn.disabled = false;
    if (current === TOTAL) {
      nextBtn.textContent = 'Finish';
    } else if (current === 1) {
      nextBtn.textContent = 'Start';
    } else {
      nextBtn.textContent = 'Next';
    }

    if (current === TOTAL) {
      updateFinalScore();
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
    if (current === TOTAL) {
      announceCompletion();
      openDone();
      return;
    }
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

  function resetAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.feedback'), function (p) {
      p.textContent = '';
      p.removeAttribute('data-mark');
    });
    resetters.forEach(function (reset) {
      reset();
    });
    updateScoreLine();
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', function () {
      resetAll();
      show(1, true);
    });
  }

  if (doneRestartBtn) {
    doneRestartBtn.addEventListener('click', function () {
      resetAll();
      show(1, false);
      returnFocusTo = screens[0].querySelector('h2');
      doneDialog.close();
    });
  }

  /* ---------- start ---------- */

  buildTabs();
  buildSteps();

  // No focus grab on load: the piece is embedded, and stealing focus would
  // yank the host page down to the frame before anyone asked it to.
  show(1, false);
}());
