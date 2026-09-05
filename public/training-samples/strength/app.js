/* Strong is a skill.
   Plain DOM, no framework, no network. Nine jobs:
     1. show one screen at a time and move focus to its heading,
     2. load a plate onto the masthead bar for every screen reached,
     3. run the tab sets,
     4. run the flip cards on the why it matters screen,
     5. run the sub-steps inside the sorter and the fault quiz,
     6. answer the sorter, fill the bins, and announce the count,
     7. answer the fault quiz with explained feedback and a running score,
     8. run the two effort dials and describe them in words,
     9. build the week card, then end the course with a completion dialog.

   Every tab panel, sub-step and flip panel is open in the markup and closed
   here, so a visitor with scripting off gets the whole course in order rather
   than a stack of empty boxes.

   Deliberately absent: focus looping. The course runs inside an iframe on the
   studio site, and trapping Tab on the last screen would turn the embed into
   a keyboard trap, so focus leaves the document naturally. Nothing here reads
   or writes window.top, and nothing depends on a parent being there: the only
   thing sent outward is one completion ping, in a try block, once. */

(function () {
  'use strict';

  var TOTAL = 8;
  var SORT_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];
  var FAULT_KEYS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'];
  var MOVE_GROUPS = ['m-squat', 'm-hinge', 'm-push', 'm-pull', 'm-carry'];
  var PATTERN_NAMES = ['Squat', 'Hinge', 'Push', 'Pull', 'Carry'];

  var current = 1;
  var completedSent = false;
  var weekPlatesOn = 0;

  var quiet = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  var screens = [];
  for (var i = 1; i <= TOTAL; i += 1) {
    screens.push(byId('screen-' + i));
  }

  var progressText = byId('progress-text');
  var plates = document.querySelectorAll('.plate');
  var prevBtn = byId('prev');
  var nextBtn = byId('next');
  var restartBtn = byId('restart');

  var sortScore = byId('sort-score');
  var faultScore = byId('fault-score');
  var buildCount = byId('build-count');
  var resultsList = byId('results-list');

  var effort = byId('effort');
  var effortOut = byId('out-effort');
  var effortSay = byId('effort-say');
  var addon = byId('addon');
  var addonOut = byId('out-addon');
  var addonSay = byId('addon-say');

  var daypick = byId('daypick');
  var movepick = byId('movepick');
  var daySay = byId('day-say');
  var weekBody = byId('week-body');
  var weekBody2 = byId('week-body-2');
  var weekPlates = document.querySelectorAll('.wplate');

  var doneDialog = byId('done');
  var doneTitle = byId('done-title');
  var doneSort = byId('done-sort');
  var doneFaults = byId('done-faults');
  var doneMoves = byId('done-moves');
  var doneDays = byId('done-days');
  var doneReviewBtn = byId('done-review');
  var doneRestartBtn = byId('done-restart');
  var doneCloseBtn = byId('done-close');
  var focusAfterDone = null;

  /* ---------- copy ---------- */

  var CHECK = 'M4 10.5 8 14.5 16 5.5';
  var CROSS = 'M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5';

  var SHORT = {
    s1: 'Box off the floor',
    s2: 'Low armchair',
    s3: 'Fire door',
    s4: 'Shopping bags',
    s5: 'Goblet squat',
    s6: 'Dumbbell row',
    s7: "Farmer's carry",
    s8: 'Incline push-up',
    s9: 'Romanian deadlift',
    s10: 'Out of a pool'
  };

  var FEEDBACK = {
    s1: {
      correct: 'Hinge. The hips travel back and the back stays long while the hands go to the floor. That is the shape, whether the load is a box or a barbell.',
      wrong: 'This one is a hinge. The knees bend a little, but almost all of the movement is at the hips, and the back has to stay long the whole way down.'
    },
    s2: {
      correct: 'Squat. Hips and knees bend together, the torso stays close to upright, and you push the floor away to stand.',
      wrong: 'This one is a squat. Hips and knees bend together and the torso stays fairly upright. Train it and the low chair stops being a negotiation.'
    },
    s3: {
      correct: 'Push. The load travels away from you, and the work sits in the chest, shoulders and triceps holding a line from hand to shoulder.',
      wrong: 'This one is a push. The load moves away from your body, which is the whole definition, whether it is a door, a bench press or a push-up.'
    },
    s4: {
      correct: 'Carry. Nothing moves except your feet, and the work is everything that keeps you upright while the load tries to fold you over.',
      wrong: 'This one is a carry. The load is not travelling anywhere relative to you: the job is holding your posture while you walk.'
    },
    s5: {
      correct: 'Squat. Holding the weight at your chest is what makes it a goblet squat, but the shape underneath is hips and knees bending together.',
      wrong: 'This one is a squat. The weight at the chest changes how it feels, not what your hips and knees are doing.'
    },
    s6: {
      correct: 'Pull. The load comes toward you, the elbow leads, and the back does more of the work than the arm does.',
      wrong: 'This one is a pull. Anything that brings a load toward your body is a pull, and a row is the plainest version there is.'
    },
    s7: {
      correct: 'Carry. A weight in each hand, walk, stay tall. It looks like nothing and it trains grip, trunk and posture at once.',
      wrong: 'This one is a carry. Nothing is being lifted up or lowered down: you are holding a load and walking, which is its own pattern.'
    },
    s8: {
      correct: 'Push. Hands on a bench instead of the floor lightens the load, and the pattern is still moving a load away from you.',
      wrong: 'This one is a push. Raising your hands onto a bench is how you make a push-up easier without changing the shape of it.'
    },
    s9: {
      correct: 'Hinge. Hips travel back, knees stay soft, and the weight tracks close to your legs while your back stays long.',
      wrong: 'This one is a hinge. The knees barely change angle: nearly all of the movement is the hips going back and then forward again.'
    },
    s10: {
      correct: 'Pull. You are hauling your own body toward your hands, which is why this pattern matters well outside a gym.',
      wrong: 'This one is a pull. Your arms bring your body toward the edge, the same shape as a row with the load and the mover swapped over.'
    },
    f1: {
      correct: 'Right. A rounding back under load puts the work on the wrong structures, and it gets worse as the set goes on. Cue: push the hips back, keep the chest long, and lighten the load until the back holds its shape for every rep.',
      wrong: 'The fault here is a rounding back. Nothing is said about the knees or the speed: what changes is the spine, and it changes more with every rep. Cue: hips back, chest long, and lighten the load until the back can stay flat.'
    },
    f2: {
      correct: 'Right. Knees drifting inward on the way up usually means the hips are not joining in. Cue: screw your feet into the floor as if you were spreading it apart, and slow the rep down.',
      wrong: 'The fault here is the knees caving inward. The breath and the tempo are not mentioned: what changes is the path the knees take while the feet stay planted. Cue: spread the floor with your feet and keep the knees tracking over the toes.'
    },
    f3: {
      correct: 'Right. Holding your breath for a whole set spikes the pressure in your chest and leaves you light headed at the top. Cue: brace your trunk, but breathe out on the effort and in on the way back.',
      wrong: 'The fault here is the breath. Nothing in this description is wrong with the load or the knees: it is three reps without an exhale. Cue: brace, then breathe out on the hard half of every rep.'
    },
    f4: {
      correct: 'Right. Bouncing hands the bottom of the rep to your tendons instead of your muscles, and it hides how heavy the weight really is. Cue: reach the bottom under control, pause for a beat, then stand.',
      wrong: 'The fault here is bouncing out of the bottom. The back and the load are not the problem in this one: it is the fast drop and the rebound. Cue: control the way down, pause, then drive up.'
    },
    f5: {
      correct: 'Right. The lowering half is where a good share of the useful work lives, and dropping the weight throws it away. Cue: take about two to three seconds to lower, every rep.',
      wrong: 'The fault here is the lowering half. The pressing half is described as controlled and nothing is said about the breath or the back: what goes wrong is the return trip. Cue: lower for a slow count of two or three.'
    },
    f6: {
      correct: 'Right. If rep three does not look like rep one, the load is choosing the technique. Cue: drop the weight until every rep in the set looks the same, then add a little next week.',
      wrong: 'The fault here is load. The description is about form falling apart as the set goes on, which is exactly what too much weight looks like from the outside. Cue: pick a weight where the last rep still looks like the first.'
    }
  };

  var EFFORT_SAY = [
    'Nothing is happening here. The set ends long before your muscles have a reason to change.',
    'Almost nothing. This is a warm-up rep, not a working set.',
    'Very light. Good for learning the movement, not much of a stimulus yet.',
    'Light. Still mostly practice, which is fine in week one.',
    'Getting somewhere, but there is a lot left in the tank.',
    'Moderate. Honest work, and you could comfortably have kept going.',
    'The beginner zone starts here. The last rep slows down and you stop with about four left.',
    'The beginner zone. Hard, the last rep is clearly slower, and you still have about three in the tank.',
    'The top of the beginner zone. About two left, form still clean. This is where to live most weeks.',
    'Very close to your limit. Fine now and then once your form is solid, not the everyday setting.',
    'Nothing left at all. Form usually breaks before the muscle does, and the recovery cost is high for what you get. Not a beginner setting.'
  ];

  var ADDON_SAY = [
    'Nothing at all. Repeat the same session. There is a place for that: after an illness, a rough week, or a session that felt ragged.',
    'One more rep on a set or two. Small, boring, and it is the setting that keeps working for months.',
    'One more rep on every set. Still sensible, and about as fast as a beginner needs to move.',
    'A small step up in load, dropping back a rep or two while you get used to it. Good once a movement feels easy at the top of your rep range.',
    'A big jump. This is where form breaks and people get hurt, and it buys nothing a small step would not have bought you next week.'
  ];

  var ADDON_SHORT = [
    'Nothing at all.',
    'One more rep on a set or two.',
    'One more rep on every set.',
    'A small step up in load.',
    'A big jump in load.'
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
      var set = { tabs: group.querySelectorAll('[role="tab"]'), panels: [], index: 0 };

      each(set.tabs, function (tab) {
        set.panels.push(byId(tab.getAttribute('aria-controls')));
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

  /* ---------- flip cards ---------- */

  var flips = [];

  function setFlip(card, open) {
    card.button.setAttribute('aria-expanded', open ? 'true' : 'false');
    card.panel.hidden = !open;
    // The hint is decoration for sighted readers only: aria-expanded is what
    // a screen reader is told, and it says the same thing.
    if (card.hint) {
      card.hint.textContent = open ? 'Close' : 'Open';
    }
    if (open) {
      card.wrap.setAttribute('data-open', '');
    } else {
      card.wrap.removeAttribute('data-open');
    }
  }

  function initFlips() {
    each(document.querySelectorAll('.flip'), function (wrap) {
      var card = {
        wrap: wrap,
        button: wrap.querySelector('.flip-face'),
        panel: wrap.querySelector('.flip-panel'),
        hint: wrap.querySelector('.flip-hint'),
        open: false
      };

      card.button.addEventListener('click', function () {
        card.open = !card.open;
        setFlip(card, card.open);
      });

      flips.push(card);
      setFlip(card, false);
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

  /* ---------- scoring helpers ---------- */

  function glyph(ok) {
    return '<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' +
      (ok ? CHECK : CROSS) + '"/></svg>';
  }

  function renderFeedback(node, ok, text) {
    // Correctness is carried by the word first and the glyph second, never by
    // colour: the verdict reads the same with the stylesheet turned off.
    node.classList.remove('is-in');
    node.innerHTML = glyph(ok) +
      '<span class="verdict-word">' + (ok ? 'Correct.' : 'Not quite.') + '</span> ' + text;
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

  // Counters tick rather than jump, which is the one place a number moving
  // says something the number itself does not.
  function tickTo(node, to, render) {
    var from = typeof node._n === 'number' ? node._n : 0;
    node._n = to;

    if (quiet.matches || from === to) {
      node.textContent = render(to);
      return;
    }

    var start = 0;
    var span = 260;

    function frame(now) {
      if (!start) {
        start = now;
      }
      var t = Math.min((now - start) / span, 1);
      var value = Math.round(from + (to - from) * t);
      node.textContent = render(value);
      if (t < 1) {
        window.requestAnimationFrame(frame);
      }
    }

    window.requestAnimationFrame(frame);
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

  function scorePhrase(keys) {
    var s = tally(keys);
    return s.right + ' of ' + s.total;
  }

  /* ---------- the sorter ---------- */

  function paintBins() {
    var lists = {};
    PATTERN_NAMES.forEach(function (name) {
      var key = name.toLowerCase();
      lists[key] = byId('bin-' + key);
      lists[key].innerHTML = '';
    });

    SORT_KEYS.forEach(function (key) {
      var chosen = document.querySelector('[data-q="' + key + '"][aria-pressed="true"]');
      if (!chosen) {
        return;
      }
      var bin = lists[chosen.getAttribute('data-bin')];
      if (!bin) {
        return;
      }
      var li = document.createElement('li');
      li.textContent = SHORT[key];
      bin.appendChild(li);
    });
  }

  function updateSortScore() {
    var s = tally(SORT_KEYS);
    tickTo(sortScore, s.answered, function (n) {
      return n === 0
        ? 'Sorted 0 of 10.'
        : 'Sorted ' + n + ' of 10. Right so far: ' + s.right + '.';
    });
  }

  function updateFaultScore() {
    var s = tally(FAULT_KEYS);
    tickTo(faultScore, s.answered, function (n) {
      return n === 0
        ? 'Answered 0 of 6.'
        : 'Answered ' + n + ' of 6. Right so far: ' + s.right + '.';
    });
  }

  /* ---------- the effort dials ---------- */

  function paintEffort() {
    var n = Number(effort.value);
    var left = 10 - n;
    var tank = left === 0
      ? 'No reps left in the tank.'
      : (left === 1 ? 'About one rep left in the tank.' : 'About ' + left + ' reps left in the tank.');

    effortOut.textContent = String(n);
    effort.setAttribute('aria-valuetext', 'Effort ' + n + ' out of 10. ' + tank);
    effortSay.textContent = EFFORT_SAY[n];
    if (n >= 6 && n <= 8) {
      effortSay.classList.add('is-target');
    } else {
      effortSay.classList.remove('is-target');
    }
  }

  function paintAddon() {
    var n = Number(addon.value);
    addonOut.textContent = String(n);
    addon.setAttribute('aria-valuetext', 'Step ' + n + ' of 4. ' + ADDON_SHORT[n]);
    addonSay.textContent = ADDON_SAY[n];
    if (n === 1 || n === 2) {
      addonSay.classList.add('is-target');
    } else {
      addonSay.classList.remove('is-target');
    }
  }

  /* ---------- building the week ---------- */

  var DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function chosenDays() {
    var out = [];
    each(daypick.querySelectorAll('input[name="day"]'), function (box) {
      if (box.checked) {
        out.push(box.value);
      }
    });
    return out;
  }

  function chosenMoves() {
    return MOVE_GROUPS.map(function (name) {
      var hit = movepick.querySelector('input[name="' + name + '"]:checked');
      return hit ? hit.value : null;
    });
  }

  function backToBack(days) {
    // Monday and Sunday are neighbours too: a week wraps round.
    var flags = DAY_ORDER.map(function (d) {
      return days.indexOf(d) !== -1;
    });
    for (var i = 0; i < 7; i += 1) {
      if (flags[i] && flags[(i + 1) % 7]) {
        return true;
      }
    }
    return false;
  }

  function dayLine(days) {
    if (!days.length) {
      return 'Nothing picked yet. Choose two or three days with a gap between them.';
    }
    var base;
    if (days.length === 1) {
      base = 'One day a week is better than none, and two is where most beginners start to notice the difference.';
    } else if (days.length === 2) {
      base = 'Two full body days a week. That is a real program, and it is enough to start.';
    } else if (days.length === 3) {
      base = 'Three full body days a week. About as much as a beginner needs.';
    } else {
      base = 'That is more than a beginner needs. Two or three full body days, with rest between them, does the work.';
    }
    if (days.length > 1 && days.length < 4 && backToBack(days)) {
      base += ' Two of those days are back to back: try to leave a day between sessions.';
    }
    return base;
  }

  function renderWeek() {
    var days = chosenDays();
    var moves = chosenMoves();
    var picked = moves.filter(function (m) {
      return m;
    }).length;

    buildCount.textContent = days.length + (days.length === 1 ? ' day, ' : ' days, ') +
      picked + ' of 5 moves.';
    daySay.textContent = dayLine(days);

    var html;
    if (!days.length && !picked) {
      html = '<p class="pc-empty">Nothing picked yet. Choose your days and one move per pattern, and this card fills itself in.</p>';
    } else {
      html = '<p class="pc-days">' + (days.length ? days.join(' &middot; ') : 'No days picked yet') + '</p>';
      html += '<ul class="pc-list">';
      PATTERN_NAMES.forEach(function (name, index) {
        var move = moves[index];
        html += '<li><span class="pc-pattern">' + name + '</span>' +
          '<span' + (move ? '' : ' class="pc-missing"') + '>' +
          (move || 'Not picked yet') + '</span></li>';
      });
      html += '</ul>';
    }

    weekBody.innerHTML = html;
    weekBody2.innerHTML = html;

    // A plate per decision: up to three days and five moves fill the bar.
    var on = Math.min(days.length, 3) + picked;
    each(weekPlates, function (plate, index) {
      var lit = index < on;
      plate.classList.toggle('is-on', lit);
      plate.classList.toggle('is-fresh', lit && index >= weekPlatesOn);
    });
    weekPlatesOn = on;
  }

  function updateResults() {
    var days = chosenDays().length;
    var picked = chosenMoves().filter(function (m) {
      return m;
    }).length;

    resultsList.innerHTML =
      '<li>' + scoreSentence('Pattern match', SORT_KEYS) + '</li>' +
      '<li>' + scoreSentence('Fault spotting', FAULT_KEYS) + '</li>' +
      '<li>Moves picked: ' + picked + ' of 5, across ' + days +
      (days === 1 ? ' day a week.' : ' days a week.') + '</li>';
  }

  /* ---------- the ending ---------- */

  function announceCompletion(scores) {
    if (completedSent) {
      return;
    }
    completedSent = true;
    // Best effort only. The host page is not required to listen, and a copy
    // packaged into a learning system has no parent worth talking to.
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'ka-sample-complete',
          slug: 'strong-is-a-skill',
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

    var days = chosenDays().length;
    var picked = chosenMoves().filter(function (m) {
      return m;
    }).length;

    var scores = {
      patterns: scorePhrase(SORT_KEYS),
      faults: scorePhrase(FAULT_KEYS),
      moves: picked + ' of 5',
      days: days
    };

    doneSort.textContent = scores.patterns;
    doneFaults.textContent = scores.faults;
    doneMoves.textContent = scores.moves;
    doneDays.textContent = String(days);

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

  function loadBar() {
    each(plates, function (plate, index) {
      var n = index + 1;
      plate.classList.toggle('is-done', n < current);
      plate.classList.toggle('is-now', n === current);
    });
  }

  function show(n, moveFocus) {
    current = Math.min(Math.max(n, 1), TOTAL);

    screens.forEach(function (section, index) {
      section.hidden = index + 1 !== current;
    });

    progressText.textContent = 'Screen ' + current + ' of ' + TOTAL;
    loadBar();

    prevBtn.disabled = current === 1;
    nextBtn.textContent = current === TOTAL ? 'Finish' : 'Next';

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
    var ok = btn.getAttribute('data-correct') === 'true';

    // One selection per item, and nothing is ever disabled, so a wrong first
    // guess never locks anybody out of changing their mind.
    each(document.querySelectorAll('[data-q="' + key + '"]'), function (other) {
      other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
    });

    var node = byId('fb-' + key);
    var copy = FEEDBACK[key];
    if (node && copy) {
      renderFeedback(node, ok, ok ? copy.correct : copy.wrong);
    }

    if (key.charAt(0) === 's') {
      paintBins();
      updateSortScore();
    } else if (key.charAt(0) === 'f') {
      updateFaultScore();
    }
  });

  effort.addEventListener('input', paintEffort);
  addon.addEventListener('input', paintAddon);

  daypick.addEventListener('change', renderWeek);
  movepick.addEventListener('change', renderWeek);
  daypick.addEventListener('submit', function (event) {
    event.preventDefault();
  });
  movepick.addEventListener('submit', function (event) {
    event.preventDefault();
  });

  function resetCourse() {
    each(document.querySelectorAll('[data-q]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    each(document.querySelectorAll('.feedback'), function (p) {
      p.textContent = '';
      p.classList.remove('is-in');
    });
    each(daypick.querySelectorAll('input[type="checkbox"]'), function (box) {
      box.checked = false;
    });
    each(movepick.querySelectorAll('input[type="radio"]'), function (radio) {
      radio.checked = false;
    });

    effort.value = 6;
    addon.value = 1;
    weekPlatesOn = 0;
    sortScore._n = 0;
    faultScore._n = 0;

    tabSets.forEach(function (set) {
      selectTab(set, 0, false);
    });
    flips.forEach(function (card) {
      card.open = false;
      setFlip(card, false);
    });
    subRuns.forEach(function (run) {
      showStep(run, 0, false);
    });

    paintBins();
    updateSortScore();
    updateFaultScore();
    paintEffort();
    paintAddon();
    renderWeek();
    updateResults();
    show(1, true);
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', resetCourse);
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
      var cardTab = byId('tab-8a');
      if (cardTab) {
        cardTab.click();
      }
      closeDone(screens[TOTAL - 1].querySelector('h2'));
    });

    doneRestartBtn.addEventListener('click', function () {
      closeDone(null);
      resetCourse();
    });
  }

  /* ---------- start ---------- */

  // No focus grab on load: the course is embedded, and stealing focus would
  // yank the host page down to the frame before anybody asked it to.
  initTabs();
  initFlips();
  initSubsteps();

  paintBins();
  updateSortScore();
  updateFaultScore();
  paintEffort();
  paintAddon();
  renderWeek();
  show(1, false);
}());
