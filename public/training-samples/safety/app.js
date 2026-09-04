/* Spot it before it hurts someone.
   Plain DOM, no framework, no network. Seven jobs:
     1. show one screen at a time and move focus to its heading,
     2. run the tab sets on the teaching screens,
     3. run the accordion on the walk-through card,
     4. run the sub-steps inside the two question screens,
     5. run the hazard hunt from either the picture or the list,
     6. answer the hierarchy and the stop or go calls, with announced feedback,
     7. assemble the walk-through card and report the two scores,
     8. end the module: the pager's last button opens a completion dialog.

   Every panel, sub-step and accordion section is open in the markup and closed
   here, so a visitor with scripting off gets the whole module in order rather
   than a stack of empty boxes.

   Deliberately absent: focus looping. The module runs inside an iframe on the
   studio site, and trapping Tab on the last screen would turn the embed into a
   keyboard trap, so focus leaves the document naturally. Nothing here reads or
   writes window.top, and nothing depends on a parent being there: the only
   thing sent outward is one completion ping, in a try block, once. */

(function () {
  'use strict';

  var TOTAL = 9;
  var HUNT_SCREEN = 6;
  var SPOT_COUNT = 6;
  var REVEAL_AFTER = 3;

  var current = 1;
  var completedSent = false;
  var found = {};
  var foundCount = 0;
  var attempts = 0;

  var screens = [];
  for (var i = 1; i <= TOTAL; i += 1) {
    screens.push(document.getElementById('screen-' + i));
  }

  var progressText = document.getElementById('progress-text');
  var barFill = document.getElementById('bar-fill');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var restartBtn = document.getElementById('restart');

  var huntCounter = document.getElementById('hunt-counter');
  var huntVerdict = document.getElementById('hunt-verdict');
  var huntGate = document.getElementById('hunt-gate');
  var revealBtn = document.getElementById('reveal');

  var hocScore = document.getElementById('hoc-score');
  var sgScore = document.getElementById('sg-score');

  var picker = document.getElementById('picker');
  var cardBody = document.getElementById('card-body');
  var cardCount = document.getElementById('card-count');
  var resultsList = document.getElementById('results-list');

  var doneDialog = document.getElementById('done');
  var doneTitle = document.getElementById('done-title');
  var doneHunt = document.getElementById('done-hunt');
  var doneControls = document.getElementById('done-controls');
  var doneCalls = document.getElementById('done-calls');
  var doneChecks = document.getElementById('done-checks');
  var doneReviewBtn = document.getElementById('done-review');
  var doneRestartBtn = document.getElementById('done-restart');
  var doneCloseBtn = document.getElementById('done-close');
  var focusAfterDone = null;

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  /* ---------- copy ---------- */

  var CHECK = 'M4 10.5 8 14.5 16 5.5';
  var CROSS = 'M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5';

  var SPOTS = {
    ladder: {
      head: 'Found: the ladder is not secured, and it stops at the deck',
      why: 'Nothing ties the top, and it ends level with the landing, so there is nothing to hold while stepping off and nothing keeping the base from kicking out.'
    },
    edge: {
      head: 'Found: the second floor deck runs out of guardrail',
      why: 'The rail stops partway along the deck and the rest of the edge is open, directly above a walkway people use all day.'
    },
    cord: {
      head: 'Found: an extension cord crosses the walkway through standing water',
      why: 'That is a trip hazard and an electrical hazard in the same three feet of walkway, and the water is what turns a damaged cord into an injury.'
    },
    door: {
      head: 'Found: debris is piled in the ground floor doorway',
      why: 'A doorway full of offcuts is a trip hazard on a route people take at speed, and it is the same route they take when something goes wrong.'
    },
    worker: {
      head: 'Found: a worker with no head protection under overhead work',
      why: 'There is a crew working on the scaffold above, and nothing between that work and this person except luck.'
    },
    exit: {
      head: 'Found: material is stacked in front of the marked exit',
      why: 'An exit that takes two people and a minute to clear is not an exit, and nobody discovers that until the day it matters.'
    }
  };

  var SPOT_ORDER = ['ladder', 'edge', 'cord', 'door', 'worker', 'exit'];

  var FEEDBACK = {
    h1: {
      correct: 'Elimination. The hazard is the cut itself, and rerouting the line means nobody cuts, nobody breathes the dust, and nobody works in the trench. When a hazard can be designed out at no real cost, everything below this line is wasted effort.',
      wrong: 'The strongest realistic control here is elimination. The design team has already confirmed the line can go overhead on the same schedule, so the cut does not have to happen at all. Controlling a hazard is always second best to not creating it.'
    },
    h2: {
      correct: 'Substitution. Same task, same tools, less harmful material. The room does not change and the crew does not change, so the swap holds even when nobody is watching.',
      wrong: 'The strongest realistic control here is substitution. The water based cleaner does the same job, so the vapor hazard goes away rather than being ventilated, scheduled around, or breathed through a respirator.'
    },
    h3: {
      correct: 'Engineering controls. Water on the blade or an on-tool vacuum, with local exhaust, cuts the dust at the point it is made. It protects everyone in the room, including the person who wandered in without a respirator.',
      wrong: 'The strongest realistic control here is engineering. The cuts are field fits, so you cannot eliminate them or order the pieces pre-cut, but you can capture the dust at the blade instead of relying on each person to wear and fit a respirator correctly all day.'
    },
    h4: {
      correct: 'Engineering controls. A guardrail is a physical barrier that works whether or not anybody is thinking about the edge, and it protects the person who is walking backwards carrying a sheet of plywood.',
      wrong: 'The strongest realistic control here is engineering. The edge is part of the building for three months, so it cannot be eliminated, and signs, briefings and harnesses all depend on somebody getting it right in the moment. A rail does not.'
    },
    h5: {
      correct: 'Administrative controls. Neither crew can move and the stairwell cannot be changed, so the control is sequencing: separate the two in time, and make the split a named responsibility rather than a hope.',
      wrong: 'The strongest realistic control here is administrative. There is nothing to eliminate, nothing to substitute, and no barrier that fits a working stairwell, so the answer is to keep the two crews out of it at the same time by scheduling it that way.'
    },
    h6: {
      correct: 'Protective equipment. Everything above it has already been done: the work is screened, exhausted and isolated. Face and hearing protection is the honest last layer here, not a shortcut.',
      wrong: 'The strongest realistic control here is protective equipment, and this is the one situation in the six where that is the right answer. The screens, the exhaust and the empty bay are already the higher controls. What is left protects the welder alone, which is exactly what the bottom of the list is for.'
    },
    g1: {
      correct: 'Go. Tied at the top, extended above the landing, and something to hold while stepping off. This is what a ladder is supposed to look like.',
      wrong: 'This one is a go. It is tied at the top and it extends above the landing, which is the whole point: there is something to hold while stepping on and off.'
    },
    g2: {
      correct: 'Stop. Water and a cord in a walkway is two hazards stacked. Get it out of the path and up out of the wet, and find out where the water is coming from.',
      wrong: 'This one is a stop. A cord in a walkway is a trip hazard on its own, and a cord in standing water is the reason a damaged jacket you cannot see becomes a shock you cannot argue with.'
    },
    g3: {
      correct: 'Go. Secured so it cannot slide, and marked so nobody mistakes it for scrap plywood worth picking up. That is a cover doing its job.',
      wrong: 'This one is a go. Screwed down and marked is exactly what a floor opening cover is meant to be. The failure mode is a loose unmarked sheet, and this is not that.'
    },
    g4: {
      correct: 'Stop. A rail out for a lift is a plan. A rail out over lunch is an open edge with nobody watching it. Close it or barricade it before anyone comes back.',
      wrong: 'This one is a stop. Taking a rail out to land material is normal. Walking away from the open edge is not, and the people who come back from lunch are not the people who took it out.'
    },
    g5: {
      correct: 'Stop. Eye protection covers the grinder, not the person underneath. Either the crossing stops or the overhead work stops, and either way somebody puts a hard hat on.',
      wrong: 'This one is a stop. The grinder is protected and the person walking underneath is not. Head protection is not optional under overhead work, and the person overhead has no idea they are there.'
    },
    g6: {
      correct: 'Go. Bins where the work is and a swept walkway at shift end is housekeeping working as designed, which is the least dramatic and most useful thing on this list.',
      wrong: 'This one is a go. Bins at the work areas and walkways cleared at the end of the shift is the standard being met. There is nothing here to fix.'
    },
    g7: {
      correct: 'Go. Off, locked, tagged, and the lock belongs to the person with their hands in it. That is the arrangement that keeps somebody from energising it while they are still in there.',
      wrong: 'This one is a go. The breaker is off and the person doing the work holds the lock and the tag, which is the point: only they can put it back on.'
    },
    g8: {
      correct: 'Stop. Move it now. Exits get blocked because they are convenient, and they get discovered on the one day nobody has a minute to spare.',
      wrong: 'This one is a stop. Chest high block in front of a marked exit is not a housekeeping note for Friday. It is the exit, and it has to be clear before the next task starts.'
    }
  };

  var HOC_KEYS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  var SG_KEYS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8'];

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

  /* ---------- accordion ---------- */

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
          // One section open at a time: four zones of checks only fit the
          // stage one zone at a time, and the card shows the whole answer.
          openSection(acc, acc.index === i ? -1 : i);
        });
      });

      accordions.push(acc);
      openSection(acc, 0);
    });
  }

  /* ---------- sub-steps ---------- */

  var subRuns = [];

  function showStep(run, index, moveFocus) {
    run.index = Math.min(Math.max(index, 0), run.steps.length - 1);

    each(run.steps, function (step, i) {
      step.hidden = i !== run.index;
    });

    var text = run.label + ' ' + (run.index + 1) + ' of ' + run.steps.length;
    run.head.textContent = text;
    run.prev.disabled = run.index === 0;
    run.next.disabled = run.index === run.steps.length - 1;

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

  /* ---------- helpers ---------- */

  function glyph(ok) {
    return '<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' +
      (ok ? CHECK : CROSS) + '"/></svg>';
  }

  function renderFeedback(node, ok, text, slam) {
    // Correctness is carried by the word first and the glyph second, never by
    // colour: the verdict reads the same with the stylesheet turned off.
    node.classList.remove('is-in');
    node.innerHTML = glyph(ok) +
      '<span class="verdict-word">' + (ok ? 'Correct.' : 'Not quite.') + '</span> ' + text;
    if (slam) {
      void node.offsetWidth;
      node.classList.add('is-in');
    }
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

  function scoreSentence(label, keys) {
    var s = tally(keys);
    if (s.answered === 0) {
      return label + ': not attempted.';
    }
    if (s.answered < s.total) {
      return label + ': ' + s.right + ' right out of the ' + s.answered + ' you answered, of ' + s.total + '.';
    }
    return label + ': ' + s.right + ' out of ' + s.total + '.';
  }

  function updateHocScore() {
    var s = tally(HOC_KEYS);
    hocScore.textContent = s.answered === 0
      ? 'Answered 0 of 6.'
      : 'Answered ' + s.answered + ' of 6. Right so far: ' + s.right + '.';
  }

  function updateSgScore() {
    var s = tally(SG_KEYS);
    sgScore.textContent = s.answered === 0
      ? 'Answered 0 of 8.'
      : 'Answered ' + s.answered + ' of 8. Right so far: ' + s.right + '.';
  }

  /* ---------- hazard hunt ---------- */

  function markSpot(key) {
    each(document.querySelectorAll('[data-spot="' + key + '"]'), function (btn) {
      btn.setAttribute('aria-pressed', 'true');
      var state = btn.querySelector('.spot-state');
      if (state) {
        state.textContent = 'Found';
      }
    });
  }

  function updateHunt() {
    huntCounter.textContent = 'Found ' + foundCount + ' of ' + SPOT_COUNT + '.';

    if (foundCount >= SPOT_COUNT) {
      huntGate.textContent = 'All six found. Next is open.';
      revealBtn.hidden = true;
    } else {
      huntGate.textContent = 'Find all six to move on. ' + (revealBtn.hidden
        ? 'If you get stuck, a button appears here that opens the rest.'
        : 'Use the button beside this if you would rather be shown the rest.');
    }

    if (current === HUNT_SCREEN) {
      nextBtn.disabled = foundCount < SPOT_COUNT;
    }
  }

  function takeSpot(key) {
    attempts += 1;
    if (attempts >= REVEAL_AFTER && foundCount < SPOT_COUNT) {
      revealBtn.hidden = false;
    }

    if (!found[key]) {
      found[key] = true;
      foundCount += 1;
      markSpot(key);
    }

    huntVerdict.innerHTML =
      '<p class="verdict-head">' + SPOTS[key].head + '</p>' +
      '<p class="verdict-why">' + SPOTS[key].why + '</p>';

    updateHunt();
  }

  function revealRest() {
    var missed = SPOT_ORDER.filter(function (key) {
      return !found[key];
    });

    if (missed.length) {
      missed.forEach(function (key) {
        found[key] = true;
        foundCount += 1;
        markSpot(key);
      });

      // The rest are marked rather than dumped into one long block: every
      // spot is still a button, and selecting one reads out what is wrong
      // with it, which is the same explanation in the same place as before.
      huntVerdict.innerHTML =
        '<p class="verdict-head">The rest are marked for you</p>' +
        '<p class="verdict-why">There were ' + missed.length + ' you had not checked. Select any spot, in the picture or in the list, to read what is wrong with it.</p>';
    }

    updateHunt();
  }

  /* ---------- walk-through card ---------- */

  function buildCard() {
    var boxes = picker.querySelectorAll('input[type="checkbox"]');
    var zones = [];
    var byZone = {};
    var n = 0;

    each(boxes, function (box) {
      if (!box.checked) {
        return;
      }
      n += 1;
      var zone = box.getAttribute('data-zone');
      if (!byZone[zone]) {
        byZone[zone] = [];
        zones.push(zone);
      }
      byZone[zone].push(box.getAttribute('data-short') || box.value);
    });

    cardCount.textContent = n === 1 ? '1 item on your card.' : n + ' items on your card.';

    if (!n) {
      cardBody.innerHTML = '<p class="quiet">Nothing ticked yet. Open the first tab, choose the checks you will actually make, then this card fills in.</p>';
      return;
    }

    var html = '';
    zones.forEach(function (zone) {
      html += '<p class="card-zone">' + zone + '</p><ul class="card-list">';
      byZone[zone].forEach(function (item) {
        html += '<li>' + item + '</li>';
      });
      html += '</ul>';
    });
    cardBody.innerHTML = html;
  }

  function updateResults() {
    resultsList.innerHTML =
      '<li>' + scoreSentence('Hierarchy of controls', HOC_KEYS) + '</li>' +
      '<li>' + scoreSentence('Stop or go', SG_KEYS) + '</li>';
  }

  /* ---------- the ending ---------- */

  function scorePhrase(keys) {
    var s = tally(keys);
    return s.right + ' of ' + s.total;
  }

  function checkedCount() {
    var n = 0;
    each(picker.querySelectorAll('input[type="checkbox"]'), function (box) {
      if (box.checked) {
        n += 1;
      }
    });
    return n;
  }

  function announceCompletion(scores) {
    if (completedSent) {
      return;
    }
    completedSent = true;
    // Best effort only. The host page is not required to listen, and a copy
    // packaged into an LMS has no parent worth talking to.
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'ka-sample-complete',
          slug: 'hazard-recognition',
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

    var scores = {
      hunt: foundCount + ' of ' + SPOT_COUNT,
      controls: scorePhrase(HOC_KEYS),
      calls: scorePhrase(SG_KEYS)
    };
    var checks = checkedCount();

    doneHunt.textContent = scores.hunt;
    doneControls.textContent = scores.controls;
    doneCalls.textContent = scores.calls;
    doneChecks.textContent = String(checks);

    // The ping goes out on the first Finish, not on merely landing here.
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

  function replayStripes() {
    each(document.querySelectorAll('.stripe'), function (el) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });
  }

  function show(n, moveFocus) {
    current = Math.min(Math.max(n, 1), TOTAL);

    screens.forEach(function (section, index) {
      section.hidden = index + 1 !== current;
    });

    progressText.textContent = 'Screen ' + current + ' of ' + TOTAL;
    barFill.style.width = ((current / TOTAL) * 100) + '%';

    prevBtn.disabled = current === 1;
    // The last screen keeps a live button: reaching it earns Finish, which is
    // the ending, rather than a greyed out Next with nothing behind it.
    nextBtn.disabled = current === HUNT_SCREEN && foundCount < SPOT_COUNT;
    nextBtn.textContent = current === TOTAL ? 'Finish' : 'Next';

    if (current === TOTAL) {
      updateResults();
    }

    replayStripes();

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

  revealBtn.addEventListener('click', revealRest);

  picker.addEventListener('change', buildCard);

  picker.addEventListener('submit', function (event) {
    event.preventDefault();
  });

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) {
      return;
    }

    var spotBtn = target.closest('[data-spot]');
    if (spotBtn) {
      takeSpot(spotBtn.getAttribute('data-spot'));
      return;
    }

    var btn = target.closest('[data-q]');
    if (!btn) {
      return;
    }

    var key = btn.getAttribute('data-q');
    var ok = btn.getAttribute('data-correct') === 'true';

    // One selection per question, and nothing is ever disabled, so a wrong
    // first guess never locks anybody out of changing their mind.
    each(document.querySelectorAll('[data-q="' + key + '"]'), function (other) {
      other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
    });

    var node = document.getElementById('fb-' + key);
    var copy = FEEDBACK[key];
    if (node && copy) {
      renderFeedback(node, ok, ok ? copy.correct : copy.wrong, key.charAt(0) === 'g');
    }

    if (key.charAt(0) === 'h') {
      updateHocScore();
    } else if (key.charAt(0) === 'g') {
      updateSgScore();
    }
  });

  function resetModule() {
    each(document.querySelectorAll('[data-q]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    each(document.querySelectorAll('[data-spot]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
      var state = btn.querySelector('.spot-state');
      if (state) {
        state.textContent = '';
      }
    });
    each(document.querySelectorAll('.feedback'), function (p) {
      p.textContent = '';
      p.classList.remove('is-in');
    });
    each(picker.querySelectorAll('input[type="checkbox"]'), function (box) {
      box.checked = false;
    });

    found = {};
    foundCount = 0;
    attempts = 0;
    revealBtn.hidden = true;
    huntVerdict.innerHTML = '';

    tabSets.forEach(function (set) {
      selectTab(set, 0, false);
    });
    accordions.forEach(function (acc) {
      openSection(acc, 0);
    });
    subRuns.forEach(function (run) {
      showStep(run, 0, false);
    });

    updateHunt();
    updateHocScore();
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

    // A press on the dialog itself is a press on the backdrop: the padding
    // lives on the inner box, so nothing else can be the target.
    doneDialog.addEventListener('click', function (event) {
      if (event.target === doneDialog) {
        closeDone(nextBtn);
      }
    });

    doneCloseBtn.addEventListener('click', function () {
      closeDone(nextBtn);
    });

    doneReviewBtn.addEventListener('click', function () {
      var cardTab = document.getElementById('tab-9b');
      if (cardTab) {
        cardTab.click();
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

  each(document.querySelectorAll('[data-spot]'), function (btn) {
    btn.setAttribute('aria-pressed', 'false');
  });
  updateHunt();
  show(1, false);
}());
