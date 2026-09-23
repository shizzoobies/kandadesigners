/* Spot it before it hurts someone.
   Plain DOM, no framework, no network. Main jobs:
     1. show one screen at a time and move focus to its heading,
     2. run the tab sets on the teaching screens,
     3. run the accordion on the walk-through card,
     4. integrate the visual control workbench and inspection board,
     5. run the hazard hunt from either the picture or the list,
     6. report the submitted activity scores and preserve corrections,
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

  var TOTAL = 10;
  var HUNT_SCREEN = 7;
  var SPOT_COUNT = 6;

  var current = 1;
  var completedSent = false;
  var found = {};
  var foundCount = 0;

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
  var guidesBtn = document.getElementById('location-guides');
  var scene = document.getElementById('scene');
  var inspectionDialog = document.getElementById('inspection-dialog');
  var enlargeBtn = document.getElementById('enlarge-scene');
  var narrationTray = document.getElementById('narration-tray');
  var rig = document.querySelector('.rig');
  var narrationAudio = document.getElementById('narration-audio');
  var narrationBtn = document.getElementById('open-narration');
  var audioToggle = document.getElementById('audio-toggle');
  var audioSeek = document.getElementById('audio-seek');
  var audioMute = document.getElementById('audio-mute');


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


  var SPOTS = {
    ladder: {
      head: 'Found: the ladder is not secured, and it stops at the deck',
      why: 'The rails stop at the landing and the top is unsecured. The worker has no safe handhold while stepping off.',
      action: 'Keep this access out of use until the ladder is correctly positioned and secured, with rails at least 3 feet above the landing or a compliant alternative.'
    },
    edge: {
      head: 'Found: the second floor deck runs out of guardrail',
      why: 'The front edge has an unprotected gap. Anyone approaching it could fall to the level below.',
      action: 'Keep people away from the exposed edge until compliant fall protection is in place.'
    },
    cord: {
      head: 'Found: an extension cord crosses the walkway through standing water',
      why: 'The cord creates a trip hazard. Water increases the shock risk if the cord or equipment is damaged.',
      action: 'Keep clear of the cord and water. Have an authorized person make the supply safe before inspection or rerouting.'
    },
    door: {
      head: 'Found: debris is piled in the ground floor doorway',
      why: 'Offcuts obstruct a doorway people use to move through the building.',
      action: 'Clear the access route and provide a nearby place for offcuts as work continues.'
    },
    worker: {
      head: 'Found: a worker with no head protection under overhead work',
      why: 'In this scenario, elevated work is active above this area. The worker has no head protection against falling objects.',
      action: 'Keep people out of the drop zone and control falling objects. Required head protection is an additional layer.'
    },
    exit: {
      head: 'Found: material is stacked in front of the marked exit',
      why: 'Stacked blocks prevent immediate use of the marked emergency exit.',
      action: 'Clear the exit immediately and keep its full access route available.'
    }
  };

  var SPOT_ORDER = ['ladder', 'edge', 'cord', 'door', 'worker', 'exit'];

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

  /* ---------- activity scoring ---------- */

  function tally(keys) {
    return window.safetyActivities.tally(keys);
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
      huntGate.textContent = 'Inspect all six locations to continue. Assistance is always available.';
    }

    if (current === HUNT_SCREEN) {
      nextBtn.disabled = foundCount < SPOT_COUNT;
    }
  }

  function takeSpot(key) {
    if (!found[key]) {
      found[key] = true;
      foundCount += 1;
      markSpot(key);
    }

    huntVerdict.innerHTML =
      '<p class="verdict-head">' + SPOTS[key].head + '</p>' +
      '<p class="verdict-why">' + SPOTS[key].why + '</p>' +
      '<p class="verdict-action"><b>Next move.</b> ' + SPOTS[key].action + '</p>';

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
      '<li>' + scoreSentence('Control workbench', HOC_KEYS) + '</li>' +
      '<li>' + scoreSentence('Inspection decisions', SG_KEYS) + '</li>';
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
    narrationAudio.pause();
    current = Math.min(Math.max(n, 1), TOTAL);
    if (!narrationTray.hidden) prepareNarration();

    screens.forEach(function (section, index) {
      section.hidden = index + 1 !== current;
    });

    progressText.textContent = 'Screen ' + current + ' of ' + TOTAL;
    barFill.style.width = ((current / TOTAL) * 100) + '%';

    prevBtn.disabled = current === 1;
    // The last screen keeps a live button: reaching it earns Finish, which is
    // the ending, rather than a greyed out Next with nothing behind it.
    nextBtn.disabled = current === HUNT_SCREEN && foundCount < SPOT_COUNT;
    // Start on the cover, Finish on the last screen, Next everywhere between.
    nextBtn.textContent = current === TOTAL ? 'Finish' : (current === 1 ? 'Start' : 'Next');

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
      narrationAudio.pause();
      openDone();
      return;
    }
    show(current + 1, true);
  });

  revealBtn.addEventListener('click', revealRest);
  guidesBtn.addEventListener('click', function () {
    var enabled = guidesBtn.getAttribute('aria-pressed') !== 'true';
    guidesBtn.setAttribute('aria-pressed', String(enabled));
    guidesBtn.textContent = enabled ? 'Hide location guides' : 'Show location guides';
    scene.classList.toggle('show-guides', enabled);
  });
  enlargeBtn.addEventListener('click', function () {
    inspectionDialog.showModal();
    document.getElementById('inspection-title').focus();
  });
  document.getElementById('close-inspection').addEventListener('click', function () {
    inspectionDialog.close();
  });
  inspectionDialog.addEventListener('close', function () { enlargeBtn.focus(); });
  function prepareNarration() {
    document.getElementById('narration-title').textContent = 'Screen ' + current + ' introduction';
    document.getElementById('narration-copy').textContent = window.safetyNarration[current - 1];
    document.getElementById('narration-error').hidden = true;
    var source = 'assets/audio/screen-' + current + '.mp3';
    if (narrationAudio.getAttribute('src') !== source) {
      narrationAudio.src = source;
      document.querySelector('.narration-scroll').scrollTop = 0;
    }
  }
  function closeNarration() {
    narrationAudio.pause();
    narrationTray.hidden = true;
    rig.classList.remove('audio-open');
    narrationBtn.setAttribute('aria-expanded', 'false');
    narrationBtn.focus();
  }
  narrationBtn.addEventListener('click', function () {
    prepareNarration();
    narrationTray.hidden = false;
    rig.classList.add('audio-open');
    narrationBtn.setAttribute('aria-expanded', 'true');
    document.getElementById('narration-title').focus();
    playNarration();
  });
  function playNarration() {
    document.getElementById('narration-error').hidden = true;
    var requestedSource = narrationAudio.getAttribute('src');
    narrationAudio.play().catch(function (error) {
      // Closing or changing screens can interrupt a pending play request.
      if (error.name !== 'AbortError' && !narrationTray.hidden && narrationAudio.getAttribute('src') === requestedSource) {
        document.getElementById('narration-error').hidden = false;
      }
    });
  }
  narrationAudio.addEventListener('error', function () {
    document.getElementById('narration-error').hidden = false;
  });
  function updateGuide() {
    var speaking = !narrationAudio.paused && !narrationAudio.ended && narrationAudio.readyState >= 3;
    narrationTray.classList.toggle('is-speaking', speaking);
    document.getElementById('guide-state').textContent = narrationAudio.error ? 'Audio unavailable' : narrationAudio.ended ? 'Complete' : speaking ? 'Speaking' : narrationAudio.currentTime > 0 ? 'Paused' : 'Ready';
    updateAudioControls();
  }
  function audioTime(value) {
    var seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function updateAudioControls() {
    var playing = !narrationAudio.paused && !narrationAudio.ended;
    var label = playing ? 'Pause' : narrationAudio.ended ? 'Replay' : 'Play';
    audioToggle.setAttribute('aria-label', label + ' audio');
    audioToggle.classList.toggle('is-playing', playing);
    document.getElementById('audio-toggle-label').textContent = label;
    var duration = Number.isFinite(narrationAudio.duration) ? narrationAudio.duration : 0;
    audioSeek.disabled = duration === 0;
    audioSeek.max = duration;
    audioSeek.value = narrationAudio.currentTime || 0;
    audioSeek.style.setProperty('--played', (duration ? narrationAudio.currentTime / duration * 100 : 0) + '%');
    audioSeek.setAttribute('aria-valuetext', audioTime(narrationAudio.currentTime) + ' of ' + audioTime(duration));
    document.getElementById('audio-time').textContent = audioTime(narrationAudio.currentTime) + ' / ' + audioTime(duration);
    audioMute.setAttribute('aria-label', narrationAudio.muted ? 'Unmute audio' : 'Mute audio');
    audioMute.classList.toggle('is-muted', narrationAudio.muted);
  }
  audioToggle.addEventListener('click', function () {
    if (narrationAudio.paused || narrationAudio.ended) playNarration();
    else {
      narrationAudio.pause();
      updateGuide();
    }
  });
  audioSeek.addEventListener('input', function () {
    if (Number.isFinite(narrationAudio.duration)) narrationAudio.currentTime = Number(audioSeek.value);
    updateAudioControls();
    updateGuide();
  });
  audioMute.addEventListener('click', function () {
    narrationAudio.muted = !narrationAudio.muted;
  });
  ['loadedmetadata', 'durationchange', 'timeupdate', 'volumechange', 'play'].forEach(function (eventName) {
    narrationAudio.addEventListener(eventName, updateAudioControls);
  });
  ['playing', 'pause', 'ended', 'emptied', 'waiting', 'error'].forEach(function (eventName) {
    narrationAudio.addEventListener(eventName, updateGuide);
  });
  narrationAudio.addEventListener('playing', function () { document.getElementById('narration-error').hidden = true; });
  document.getElementById('close-narration').addEventListener('click', closeNarration);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !narrationTray.hidden && (narrationTray.contains(event.target) || event.target === narrationBtn)) {
      event.preventDefault();
      closeNarration();
    }
  });

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


  });

  function resetModule() {
    window.safetyActivities.reset();
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
    revealBtn.hidden = false;
    guidesBtn.setAttribute('aria-pressed', 'false');
    guidesBtn.textContent = 'Show location guides';
    scene.classList.remove('show-guides');
    huntVerdict.innerHTML = '';

    tabSets.forEach(function (set) {
      selectTab(set, 0, false);
    });
    accordions.forEach(function (acc) {
      openSection(acc, 0);
    });

    updateHunt();
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
      var cardTab = document.getElementById('tab-10b');
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
  window.safetyActivities.init(updateResults);
  initTabs();
  initAccordions();

  // Text-only lesson bodies must also be reachable for keyboard scrolling.
  each(document.querySelectorAll('.screen-body'), function (body) {
    body.setAttribute('tabindex', '0');
  });

  each(document.querySelectorAll('[data-spot]'), function (btn) {
    btn.setAttribute('aria-pressed', 'false');
  });
  updateHunt();
  show(1, false);
}());
