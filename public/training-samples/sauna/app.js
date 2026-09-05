/* Heat, done well.
   Plain DOM, no framework, no build step, no network. Eight jobs:
     1. show one screen at a time and move focus to its heading,
     2. run the tab sets on the two kinds of heat and the card,
     3. run the accordion on what the heat does,
     4. run the reveal list on who should check first,
     5. run the sub-steps in the session walk and the eight situations,
     6. run the breathing pacer, which never starts on its own,
     7. assemble the session card from the radio choices,
     8. end the module: the pager's last button opens a completion dialog.

   Every tab panel, accordion section and sub-step is open in the markup
   and closed from here, so a visitor with scripting off reads the whole
   module top to bottom instead of meeting a stack of empty boxes.

   Deliberately absent: focus looping. The module runs inside an iframe on
   the studio site, and trapping Tab on the last screen would turn the
   embed into a keyboard trap, so focus leaves the document naturally.
   Nothing here reads or writes window.top. The only thing sent outward is
   one completion ping, in a try block, once. */

(function () {
  'use strict';

  var TOTAL = 7;
  var SESSION_SCREEN = 4;
  var SESSION_STEPS = 9;

  var current = 1;
  var completedSent = false;
  var sessionSeen = {};
  var sessionCount = 0;

  var screens = [];
  for (var i = 1; i <= TOTAL; i += 1) {
    screens.push(document.getElementById('screen-' + i));
  }

  var progressText = document.getElementById('progress-text');
  var barFill = document.getElementById('bar-fill');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var restartBtn = document.getElementById('restart');

  var sgScore = document.getElementById('sg-score');
  var sessFill = document.getElementById('sess-fill');

  var picker = document.getElementById('picker');
  var cardBody = document.getElementById('card-body');
  var resultsList = document.getElementById('results-list');

  var pacerBox = document.querySelector('.pacer');
  var pacerToggle = document.getElementById('pacer-toggle');
  var pacerCue = document.getElementById('pacer-cue');

  var doneDialog = document.getElementById('done');
  var doneTitle = document.getElementById('done-title');
  var doneSteps = document.getElementById('done-steps');
  var doneCalls = document.getElementById('done-calls');
  var doneReviewBtn = document.getElementById('done-review');
  var doneRestartBtn = document.getElementById('done-restart');
  var doneCloseBtn = document.getElementById('done-close');
  var focusAfterDone = null;

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  /* ---------- copy ---------- */

  var CHECK = 'M4 10.6 8 14.6 16 5.4';
  var CROSS = 'M5.6 5.6 14.4 14.4M14.4 5.6 5.6 14.4';

  var SG_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'];

  /* One explanation per option, not one per verdict: choosing to stay when
     you should cool down is a different mistake from leaving when you were
     fine, and the learner deserves to be told which one they made. */
  var FEEDBACK = {
    s1: {
      stay: 'Light headedness is your circulation telling you it is behind. It usually settles once you are out of the heat, and it usually does not settle if you sit back down and wait for it to pass.',
      cool: 'Get out, sit somewhere cool, and drink water. A moment of the room tilting is the common early warning, and it is far easier to deal with on a bench in the changing room than on the floor of a hot one.',
      help: 'Help is the right instinct if it does not settle, but a single tilt on standing is usually a cool-down and a glass of water. Get out first, then see how you feel.'
    },
    s2: {
      stay: 'Nothing here says stop. Warm, loose, easy breathing and no pain is the session working. Keep noticing, and come out while you still feel this good rather than when you have had enough.',
      cool: 'You can always come out, and there is no penalty for it. But nothing here is a warning sign, so this would be cutting a good round short out of caution rather than out of information.',
      help: 'Nothing here needs help. Feeling warm and loose with easy breathing is what a session in progress feels like.'
    },
    s3: {
      stay: 'A headache that arrived with the heat is usually dehydration, the heat itself, or both. Sitting in it tends to make the rest of your evening worse, not better.',
      cool: 'Out, cool down, water. A new headache in a hot room is the most common reason people say afterwards that a sauna does not agree with them, and most of the time it was fluid.',
      help: 'A new dull headache is not usually an emergency. Cool down and drink first. If it is severe, sudden, or comes with confusion or visual changes, then yes, get help.'
    },
    s4: {
      stay: 'You are already out of the heat and still unwell. Going back in is the one thing that cannot help here.',
      cool: 'You have already cooled down and it has not worked. That is the part that matters. Sickness that persists after cooling, with clammy skin, is the point where this stops being something to wait out.',
      help: 'Yes. Cooling down did not fix it, and clammy skin with persistent nausea is a sign of heat illness rather than a rough round. Tell someone, stay with people, and get medical help.'
    },
    s5: {
      stay: 'Alcohol and heat both lower blood pressure and both dry you out. Together they make fainting more likely, and a faint in a hot room with a hot stove in it is a burn as well as a fall.',
      cool: 'Out now. It does not matter that you feel fine: the combination raises the risk of fainting whether or not you have noticed anything yet. Drink water and leave the second round for another day.',
      help: 'Get out first. Unless you feel unwell, this is a cool-down and some water rather than a call for help. The rule to keep is simple: alcohol and saunas do not share a day.'
    },
    s6: {
      stay: 'Stay, and move down. Heat stacks toward the ceiling, so the lower bench is a genuinely different room. Nothing about you is wrong here: the bench was.',
      cool: 'You can, and it is never a bad answer. But there is a lower bench free and nothing else is wrong, so the cheaper fix is to move down and keep the round you were enjoying.',
      help: 'Nothing here needs help. A bench that is hotter than you like is a seating problem, and the seat below solves it.'
    },
    s7: {
      stay: 'A heart that will not settle when you are sitting still is not something to sit through. Whatever it turns out to be, the hot room is the wrong place to find out.',
      cool: 'Getting out is right, and it is the first thing to do. It is not the last thing: a pounding heart that does not settle with rest and slow breathing needs someone to look at you, not just cooler air.',
      help: 'Yes. Get out, tell someone, and get medical help. A heart rate that will not come down when you rest is one of the few signs on this list that is worth being unhurried and cautious about in exactly that order.'
    },
    s8: {
      stay: 'First visit, fierce air, and no fluid all day is three things at once. Any one of them alone would be a reason to be careful.',
      cool: 'Out, water, and try again another day from the lower bench. There is nothing to prove on a first visit, and going in dehydrated is the single most reliable way to have a bad one.',
      help: 'Not yet. You feel uncomfortable rather than unwell. Get out, drink, and come back to it when you have had a proper day of fluid behind you.'
    }
  };

  var CARD_KEYS = [
    { name: 'kind', label: 'Room' },
    { name: 'round', label: 'Each round' },
    { name: 'rounds', label: 'Rounds' },
    { name: 'cool', label: 'Cool-down' }
  ];

  /* ---------- tab sets ---------- */

  var tabSets = [];

  function selectTab(set, index, moveFocus) {
    set.index = index;
    each(set.tabs, function (tab, i) {
      var on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      set.panels[i].hidden = !on;
    });
    if (moveFocus) {
      set.tabs[index].focus();
    }
  }

  function initTabs() {
    each(document.querySelectorAll('[data-tabs]'), function (group) {
      var set = {
        tabs: group.querySelectorAll('[role="tab"]'),
        panels: [],
        index: 0
      };

      each(set.tabs, function (tab) {
        set.panels.push(document.getElementById(tab.getAttribute('aria-controls')));
      });

      each(set.tabs, function (tab, i) {
        tab.addEventListener('click', function () {
          selectTab(set, i, false);
        });
        tab.addEventListener('keydown', function (event) {
          var last = set.tabs.length - 1;
          var to = -1;
          if (event.key === 'ArrowRight') {
            to = i === last ? 0 : i + 1;
          } else if (event.key === 'ArrowLeft') {
            to = i === 0 ? last : i - 1;
          } else if (event.key === 'Home') {
            to = 0;
          } else if (event.key === 'End') {
            to = last;
          }
          if (to !== -1) {
            event.preventDefault();
            // Automatic activation: the panel follows the focused tab.
            selectTab(set, to, true);
          }
        });
      });

      tabSets.push(set);
      selectTab(set, 0, false);
    });
  }

  /* ---------- accordion and the reveal list ---------- */

  /* Both use the same machinery. One section open at a time: five
     explanations or seven cautions will not all fit a fixed stage, and
     leaving one open keeps the reading column from jumping about. */

  var accordions = [];

  function openSection(acc, index) {
    acc.index = index;
    each(acc.buttons, function (btn, i) {
      var on = i === index;
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      acc.panels[i].hidden = !on;
    });
  }

  function initAccordions() {
    each(document.querySelectorAll('[data-accordion]'), function (group) {
      var acc = {
        buttons: group.querySelectorAll('.acc-btn'),
        panels: [],
        index: 0
      };

      each(acc.buttons, function (btn) {
        acc.panels.push(document.getElementById(btn.getAttribute('aria-controls')));
      });

      each(acc.buttons, function (btn, i) {
        btn.addEventListener('click', function () {
          openSection(acc, acc.index === i ? -1 : i);
        });
      });

      accordions.push(acc);
      openSection(acc, 0);
    });
  }

  /* ---------- sub-steps ---------- */

  var subRuns = [];

  function markSessionStep(index) {
    var key = 'k' + index;
    if (!sessionSeen[key]) {
      sessionSeen[key] = true;
      sessionCount += 1;
    }
  }

  function showStep(run, index, moveFocus) {
    run.index = Math.min(Math.max(index, 0), run.steps.length - 1);

    each(run.steps, function (step, i) {
      step.hidden = i !== run.index;
    });

    var text = run.label + ' ' + (run.index + 1) + ' of ' + run.steps.length;
    run.head.textContent = text;
    run.prev.disabled = run.index === 0;
    run.next.disabled = run.index === run.steps.length - 1;

    if (run.isSession) {
      if (sessFill) {
        sessFill.style.width = (((run.index + 1) / run.steps.length) * 100) + '%';
      }
      if (moveFocus || current === SESSION_SCREEN) {
        markSessionStep(run.index);
      }
    }

    if (moveFocus) {
      run.live.textContent = text + '.';
      run.head.focus();
    }
  }

  function initSubsteps() {
    each(document.querySelectorAll('[data-substeps]'), function (group) {
      var run = {
        steps: group.querySelectorAll('[data-substep]'),
        head: group.querySelector('[data-sub-head]'),
        live: group.querySelector('[data-sub-live]'),
        prev: group.querySelector('[data-sub="prev"]'),
        next: group.querySelector('[data-sub="next"]'),
        label: group.getAttribute('data-sub-label') || 'Step',
        isSession: group.id === 'session',
        index: 0
      };

      run.prev.addEventListener('click', function () {
        showStep(run, run.index - 1, true);
      });
      run.next.addEventListener('click', function () {
        showStep(run, run.index + 1, true);
      });

      subRuns.push(run);
      showStep(run, 0, false);
    });
  }

  function sessionRun() {
    for (var n = 0; n < subRuns.length; n += 1) {
      if (subRuns[n].isSession) {
        return subRuns[n];
      }
    }
    return null;
  }

  /* ---------- the breathing pacer ---------- */

  /* Four counts in, six counts out, on a ten second loop. It is off until
     somebody presses the button, it stops itself when the learner leaves
     the screen, and it does not exist at all for a visitor who has asked
     for reduced motion: the stylesheet hides it and puts a line of text in
     its place that says the same thing in words. */

  var pacerLoop = null;
  var pacerOut = null;
  var pacerOn = false;

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function pacerPhase() {
    pacerCue.textContent = 'Breathe in, slowly.';
    pacerOut = window.setTimeout(function () {
      pacerCue.textContent = 'Breathe out, for longer.';
    }, 4000);
  }

  function stopPacer() {
    if (!pacerBox) {
      return;
    }
    pacerOn = false;
    window.clearInterval(pacerLoop);
    window.clearTimeout(pacerOut);
    pacerLoop = null;
    pacerOut = null;
    pacerBox.classList.remove('is-running');
    pacerToggle.setAttribute('aria-pressed', 'false');
    pacerToggle.textContent = 'Start the pacer';
    pacerCue.textContent = 'Not running.';
  }

  function startPacer() {
    if (!pacerBox || reducedMotion()) {
      return;
    }
    pacerOn = true;
    pacerBox.classList.add('is-running');
    pacerToggle.setAttribute('aria-pressed', 'true');
    pacerToggle.textContent = 'Stop the pacer';
    pacerPhase();
    pacerLoop = window.setInterval(pacerPhase, 10000);
  }

  /* ---------- helpers ---------- */

  function glyph(ok) {
    return '<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' +
      (ok ? CHECK : CROSS) + '"/></svg>';
  }

  function renderFeedback(node, ok, text) {
    // Correctness is carried by the word first and the glyph second, never
    // by colour: the verdict reads the same with the stylesheet turned off.
    node.classList.remove('is-in');
    node.innerHTML = glyph(ok) +
      '<span class="verdict-word">' + (ok ? 'That is the call.' : 'Not the call here.') + '</span> ' + text;
    void node.offsetWidth;
    node.classList.add('is-in');
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
    return { answered: answered, right: right, total: keys.length };
  }

  function updateSgScore() {
    var s = tally(SG_KEYS);
    sgScore.textContent = s.answered === 0
      ? 'Answered 0 of 8.'
      : 'Answered ' + s.answered + ' of 8. Right so far: ' + s.right + '.';
  }

  /* ---------- the card ---------- */

  function buildCard() {
    var html = '';
    CARD_KEYS.forEach(function (item) {
      var chosen = picker.querySelector('input[name="' + item.name + '"]:checked');
      if (!chosen) {
        return;
      }
      html += '<li><span class="card-key">' + item.label + '</span>' + chosen.value + '</li>';
    });
    cardBody.innerHTML = html;
  }

  function updateResults() {
    var s = tally(SG_KEYS);
    var calls;
    if (s.answered === 0) {
      calls = 'Stay, cool down, or stop: not attempted.';
    } else if (s.answered < s.total) {
      calls = 'Stay, cool down, or stop: ' + s.right + ' right out of the ' + s.answered + ' you answered, of ' + s.total + '.';
    } else {
      calls = 'Stay, cool down, or stop: ' + s.right + ' out of ' + s.total + '.';
    }

    resultsList.innerHTML =
      '<li>Session steps walked: ' + (sessionCount === 0 ? 'none yet' : sessionCount + ' of ' + SESSION_STEPS) + '.</li>' +
      '<li>' + calls + '</li>';
  }

  /* ---------- the ending ---------- */

  function announceCompletion(scores) {
    if (completedSent) {
      return;
    }
    completedSent = true;
    // Best effort only. The host page is not required to listen, and a copy
    // packaged into a learning management system has no parent worth
    // talking to.
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'ka-sample-complete',
          slug: 'heat-done-well',
          scores: scores
        }, '*');
      }
    } catch (err) {
      /* nothing depends on this */
    }
  }

  function openDone() {
    if (!doneDialog || typeof doneDialog.showModal !== 'function') {
      return;
    }

    var s = tally(SG_KEYS);
    var scores = {
      steps: sessionCount + ' of ' + SESSION_STEPS,
      calls: s.right + ' of ' + s.total
    };

    doneSteps.textContent = scores.steps;
    doneCalls.textContent = scores.calls;

    // The ping goes out on the first Finish, not on merely arriving here.
    announceCompletion(scores);

    focusAfterDone = nextBtn;
    doneDialog.showModal();
    doneTitle.focus();
  }

  function closeDone(focusTarget) {
    focusAfterDone = focusTarget || null;
    if (doneDialog && doneDialog.open) {
      doneDialog.close();
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
    nextBtn.textContent = current === TOTAL ? 'Finish' : 'Next';

    if (current === SESSION_SCREEN) {
      var run = sessionRun();
      if (run) {
        markSessionStep(run.index);
      }
    } else if (pacerOn) {
      // Nothing should keep breathing at you from a screen you have left.
      stopPacer();
    }

    if (current === TOTAL) {
      updateResults();
    }

    if (moveFocus) {
      var heading = screens[current - 1].querySelector('h2');
      if (heading) {
        heading.focus();
      }
    }
  }

  /* ---------- wiring ---------- */

  prevBtn.addEventListener('click', function () {
    show(current - 1, true);
  });

  nextBtn.addEventListener('click', function () {
    if (current === TOTAL) {
      openDone();
      return;
    }
    show(current + 1, true);
  });

  if (pacerToggle) {
    pacerToggle.addEventListener('click', function () {
      if (pacerOn) {
        stopPacer();
      } else {
        startPacer();
      }
    });
  }

  picker.addEventListener('change', buildCard);

  picker.addEventListener('submit', function (event) {
    event.preventDefault();
  });

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) {
      return;
    }

    var btn = target.closest('[data-q]');
    if (!btn) {
      return;
    }

    var key = btn.getAttribute('data-q');
    var opt = btn.getAttribute('data-opt');
    var ok = btn.getAttribute('data-correct') === 'true';

    // One selection per situation, and nothing is ever disabled, so a first
    // guess never locks anybody out of changing their mind.
    each(document.querySelectorAll('[data-q="' + key + '"]'), function (other) {
      other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
    });

    var node = document.getElementById('fb-' + key);
    var copy = FEEDBACK[key];
    if (node && copy && copy[opt]) {
      renderFeedback(node, ok, copy[opt]);
    }

    updateSgScore();
  });

  function resetModule() {
    each(document.querySelectorAll('[data-q]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    each(document.querySelectorAll('.feedback'), function (p) {
      p.textContent = '';
      p.classList.remove('is-in');
    });
    each(picker.querySelectorAll('input[type="radio"]'), function (box) {
      box.checked = box.defaultChecked;
    });

    sessionSeen = {};
    sessionCount = 0;
    stopPacer();

    tabSets.forEach(function (set) {
      selectTab(set, 0, false);
    });
    accordions.forEach(function (acc) {
      openSection(acc, 0);
    });
    subRuns.forEach(function (run) {
      showStep(run, 0, false);
    });

    updateSgScore();
    buildCard();
    updateResults();
    show(1, true);
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', resetModule);
  }

  if (doneDialog) {
    doneDialog.addEventListener('close', function () {
      var target = focusAfterDone;
      focusAfterDone = null;
      if (target && target.focus) {
        target.focus();
      }
    });

    // A press on the dialog itself is a press on the backdrop: all the
    // padding lives on the inner box, so nothing else can be the target.
    doneDialog.addEventListener('click', function (event) {
      if (event.target === doneDialog) {
        closeDone(nextBtn);
      }
    });

    doneCloseBtn.addEventListener('click', function () {
      closeDone(nextBtn);
    });

    doneReviewBtn.addEventListener('click', function () {
      var planTab = document.getElementById('tab-7a');
      if (planTab) {
        planTab.click();
      }
      closeDone(screens[TOTAL - 1].querySelector('h2'));
    });

    doneRestartBtn.addEventListener('click', function () {
      closeDone(null);
      resetModule();
    });
  }

  /* ---------- start ---------- */

  // No focus grab on load: the module is embedded, and stealing focus would
  // yank the host page down to the frame before anybody asked it to.
  initTabs();
  initAccordions();
  initSubsteps();

  updateSgScore();
  buildCard();
  updateResults();
  show(1, false);
}());
