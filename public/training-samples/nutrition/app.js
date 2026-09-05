/* Build the plate, skip the diet.
   Plain DOM, no framework, no network. Eight jobs:
     1. show one card at a time and move focus to its heading,
     2. run the tabbed dividers, and fill the drawn plate wedge by wedge as
        the plate-method dividers are opened,
     3. run the accordion on the protein and fibre card,
     4. run the sub-steps inside the hunger or habit card,
     5. run the plate sorter: eight foods, four places, a live plate, and a
        reason for every placement,
     6. run the label hunt from either the printed panel or the list beside it,
     7. turn the swap cards over and collect the ones the learner keeps,
     8. end the module: the pager's last button opens a completion dialog.

   Every panel, sub-step, accordion section and swap face is open in the
   markup and closed here, so a visitor with scripting off gets the whole
   module in order rather than a stack of empty boxes.

   Deliberately absent: focus looping. The module runs inside an iframe on the
   studio site, and trapping Tab on the last card would turn the embed into a
   keyboard trap, so focus leaves the document naturally. Nothing here reads or
   writes window.top, and nothing depends on a parent being there: the only
   thing sent outward is one completion ping, in a try block, once. */

(function () {
  'use strict';

  var TOTAL = 9;
  var SORT_SCREEN = 4;
  var FOOD_COUNT = 8;
  var SPOT_COUNT = 6;
  var SORT_HELP_AFTER = 4;
  var SPOT_HELP_AFTER = 3;

  var current = 1;
  var completedSent = false;

  var placed = {};
  var placedCount = 0;
  var placedRight = 0;

  var found = {};
  var foundCount = 0;
  var spotTries = 0;

  var screens = [];
  for (var i = 1; i <= TOTAL; i += 1) {
    screens.push(document.getElementById('screen-' + i));
  }

  var progressText = document.getElementById('progress-text');
  var barFill = document.getElementById('bar-fill');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var restartBtn = document.getElementById('restart');

  var sortCounter = document.getElementById('sort-counter');
  var sortVerdict = document.getElementById('sort-verdict');
  var sortReveal = document.getElementById('sort-reveal');
  var plateLive = document.getElementById('plate-b');

  var spotCounter = document.getElementById('spot-counter');
  var spotVerdict = document.getElementById('spot-verdict');
  var spotReveal = document.getElementById('spot-reveal');

  var cueScore = document.getElementById('cue-score');

  var swapWrap = document.getElementById('swaps');
  var swapCount = document.getElementById('swap-count');
  var cardBody = document.getElementById('card-body');
  var resultsList = document.getElementById('results-list');

  var doneDialog = document.getElementById('done');
  var doneTitle = document.getElementById('done-title');
  var donePlate = document.getElementById('done-plate');
  var doneLabel = document.getElementById('done-label');
  var doneCues = document.getElementById('done-cues');
  var doneSwaps = document.getElementById('done-swaps');
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

  // Written as the tail of "X goes ...", so the preposition travels with the
  // zone and the sentence reads properly for the one that is not on the plate.
  var ZONE_NAME = {
    veg: 'in the vegetables and fruit half',
    pro: 'in the protein quarter',
    grain: 'in the grains and starch quarter',
    side: 'beside the plate'
  };

  var FOODS = {
    f1: {
      name: 'Roasted broccoli',
      zone: 'veg',
      right: 'Broccoli goes in the half. Vegetables bring fibre, water and vitamins, and they take up room on a plate for very little effort, which is the entire reason the half exists.',
      wrong: 'Broccoli belongs in the vegetables and fruit half. Roasting changes the flavour and not much else: it is still the part of the plate that costs you the least and does the most.'
    },
    f2: {
      name: 'Grilled chicken thigh',
      zone: 'pro',
      right: 'Chicken takes the protein quarter. Protein leaves the stomach slowly, and that slowness is what carries you comfortably to the next meal.',
      wrong: 'Chicken belongs in the protein quarter. A quarter is roughly the size of your own palm, and it is there because protein is the part of the meal that keeps you from raiding the cupboard at four.'
    },
    f3: {
      name: 'Brown rice',
      zone: 'grain',
      right: 'Brown rice takes the starch quarter. The bran is still on it, and the bran is where most of the fibre lives.',
      wrong: 'Brown rice belongs in the grains and starch quarter. It is a whole grain, which simply means the seed still has its bran and germ, so it brings more fibre than the white bag beside it.'
    },
    f4: {
      name: 'Olive oil dressing',
      zone: 'side',
      right: 'Dressing lives beside the plate. Fat carries flavour and helps you absorb some vitamins, and it is easy to pour without noticing, which is exactly why it gets its own place.',
      wrong: 'Dressing belongs beside the plate rather than in a quarter. It is not a problem to be solved, it is just the one thing on the table that goes from a drizzle to a puddle while you are talking.'
    },
    f5: {
      name: 'Black beans',
      zone: 'pro',
      right: 'Beans take the protein quarter, and they are the useful in-between: protein and a serious amount of fibre in the same spoonful.',
      wrong: 'Put beans in the protein quarter. They are the one food on this list that could argue for two places, because they bring protein and fibre together, but if they go in the vegetable half the protein quarter ends up empty.'
    },
    f6: {
      name: 'Baked sweet potato',
      zone: 'grain',
      right: 'Sweet potato takes the starch quarter. It is a vegetable in the garden and a starch on the plate, because that is how your body treats it.',
      wrong: 'Sweet potato belongs in the grains and starch quarter. It grows like a vegetable, and it behaves like rice or bread once you have eaten it, so the plate counts it with the starch.'
    },
    f7: {
      name: 'Sliced strawberries',
      zone: 'veg',
      right: 'Fruit shares the half with vegetables. The sugar in a strawberry arrives wrapped in fibre and water, which is why it behaves nothing like a sweet.',
      wrong: 'Strawberries belong in the vegetables and fruit half. Fruit is not a treat you have to justify: it comes with fibre, water and vitamins attached to the sweetness.'
    },
    f8: {
      name: 'A glass of water',
      zone: 'side',
      right: 'Water goes beside the plate, and it goes there first. Nothing else on this list does as much for as little.',
      wrong: 'Water belongs beside the plate. It is not part of the meal you are dividing up, and it is the drink to reach for before anything else arrives.'
    }
  };

  var FOOD_ORDER = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];

  var SPOTS = {
    serving: {
      head: 'Serving size: three quarters of a cup, 40 grams',
      why: 'Every number under this line describes that amount and nothing else. It is a standard measure for comparing one box with another, not a recommendation of how much to eat. Weigh your usual bowl once: most people find it holds more than one serving, and every figure moves with it.'
    },
    container: {
      head: 'Eight servings per container',
      why: 'The panel describes one of those eight. This is the line that turns a comfortable looking number into an honest one, and it is the first thing to read on anything you might finish in a single sitting.'
    },
    calories: {
      head: 'Calories 160, for one serving',
      why: 'A calorie is a measure of the energy in food, and this figure is per serving, not per box. It is on the panel so you can compare like with like. What the food is made of tells you far more about how the morning goes than this number does.'
    },
    sugars: {
      head: 'Total sugars 12 grams, of which 9 are added',
      why: 'Total sugars counts everything, including the sugar already in the grain. Added sugars are the ones put in during making, and those are the ones worth watching. Nine of the twelve grams here were added: that is the sentence this panel is quietly telling you.'
    },
    fibre: {
      head: 'Dietary fibre 3 grams',
      why: 'Fibre is the part of a plant you cannot digest, and it slows the whole meal down on the way through. On a cereal it is the fastest quality check you have, because a bowl with fibre in it behaves very differently by mid morning from one without.'
    },
    ingredients: {
      head: 'The ingredients run by weight, most first',
      why: 'That ordering is the rule, and it is the most useful thing printed on any packet. Whole grain oats come first here, which is a good sign. Sugar comes second, which tells you this box holds more sugar than rice flour, honey, oil or salt.'
    }
  };

  var SPOT_ORDER = ['serving', 'container', 'calories', 'sugars', 'fibre', 'ingredients'];

  var FEEDBACK = {
    c1: {
      correct: 'Habit. Nothing in your body asked for this. The cue was the route past the drawer, and your hand arrived before the decision did. Habits are not a failing, they are efficient, and noticing one is usually the whole repair.',
      wrong: 'The strongest signal here is habit. You ate three hours ago and you were not thinking about food. What changed was walking past the drawer, and when the cue is a place or a time rather than your stomach, that is habit talking.'
    },
    c2: {
      correct: 'Thirsty. A dry mouth and a dull headache after a night and a morning without water are thirst signals, and they are easy to read as hunger because both feel like a vague need for something. Drink first, then see what is left.',
      wrong: 'This one is thirst. You have had nothing to drink but coffee since yesterday evening, and the dry mouth and the headache are the giveaway. Thirst and hunger speak in overlapping language, which is why drinking first and waiting ten minutes is such old advice.'
    },
    c3: {
      correct: 'Tired. Wanting sweetness rather than wanting food is the tell, and so is losing the thread of a paragraph. Studies have associated short sleep with exactly this pattern the following day. A walk or twenty minutes of quiet often does more than the biscuit.',
      wrong: 'This one is tiredness. You are not describing an empty stomach, you are describing a flat afternoon that arrived at eleven. Studies have associated poor sleep with wanting quick energy the next day, and wanting sweet rather than wanting food is how that shows up.'
    },
    c4: {
      correct: 'Hungry, plainly. The most reliable check is whether you would eat something dull, and beans and rice is about as dull as it gets. Five and a half hours after breakfast this is a meal, not a snack.',
      wrong: 'This one is straightforward hunger. Five and a half hours since breakfast, a stomach making noise, a shortening temper, and a genuine appetite for plain food. That last one is the most reliable signal on this whole card.'
    },
    c5: {
      correct: 'Habit. The bowl arriving is the cue, the film removes the part of you that would have noticed, and the routine runs itself. Moving the bowl off your lap is a smaller change than any rule about snacking, and it works better.',
      wrong: 'This one is habit. You ate an hour ago, so hunger is not what is happening. The bowl appearing is the cue and the screen is the distraction. Distance from the bowl beats willpower every time, because it does not need you to be paying attention.'
    },
    c6: {
      correct: 'Thirsty, and probably short of some salt with it. An hour walking in heat costs you fluid, and lightheadedness with no appetite for a real meal is what that feels like. Something cold to drink, and food will look reasonable again shortly.',
      wrong: 'This one is thirst. An hour in the heat, lightheaded, wanting something cold, and put off by the idea of a full meal: that combination is fluid, not food. Drink first and eat when your appetite comes back.'
    }
  };

  var CUE_KEYS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];

  /* ---------- tabbed dividers ---------- */

  var tabSets = [];

  function fillWedge(plateId, key) {
    var plate = document.getElementById(plateId);
    if (!plate) {
      return;
    }
    var node = plate.querySelector('[data-wedge="' + key + '"]');
    if (node) {
      node.classList.add('is-on');
    }
  }

  function selectTab(set, index, moveFocus) {
    set.index = index;
    each(set.tabs, function (tab, i) {
      var on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      set.panels[i].hidden = !on;
      if (on && set.plateId && tab.getAttribute('data-wedge')) {
        fillWedge(set.plateId, tab.getAttribute('data-wedge'));
      }
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
        plateId: group.getAttribute('data-plate'),
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
          // One section open at a time: four sets of sources only fit the
          // stage one at a time, and nothing is lost by closing the others.
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

  function renderFeedback(node, ok, text) {
    // Correctness is carried by the word first and the drawn mark second,
    // never by colour: the verdict reads the same with the sheet turned off.
    node.classList.toggle('is-wrong', !ok);
    node.innerHTML = glyph(ok) +
      '<span class="verdict-word">' + (ok ? 'That is it.' : 'Not quite.') + '</span> ' + text;
  }

  function renderVerdict(node, head, why) {
    node.innerHTML = '<p class="verdict-head">' + head + '</p><p class="verdict-why">' + why + '</p>';
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

  function updateCueScore() {
    var s = tally(CUE_KEYS);
    cueScore.textContent = s.answered === 0
      ? 'Answered 0 of 6.'
      : 'Answered ' + s.answered + ' of 6. Matching the cue: ' + s.right + '.';
  }

  /* ---------- the plate sorter ---------- */

  function countsByZone() {
    var counts = { veg: 0, pro: 0, grain: 0, side: 0 };
    FOOD_ORDER.forEach(function (key) {
      if (placed[key]) {
        counts[placed[key]] += 1;
      }
    });
    return counts;
  }

  function paintLivePlate() {
    var counts = countsByZone();
    ['veg', 'pro', 'grain', 'side'].forEach(function (zone) {
      var wedge = plateLive.querySelector('[data-wedge="' + zone + '"]');
      if (wedge) {
        wedge.classList.toggle('is-on', counts[zone] > 0);
      }
      var num = plateLive.querySelector('[data-count="' + zone + '"]');
      if (num) {
        num.textContent = String(counts[zone]);
      }
    });
  }

  function updateSorter() {
    var counts = countsByZone();
    // The plate drawing is decoration; the live region carries the same state
    // in words, so nothing here depends on seeing the wedges fill.
    sortCounter.textContent = placedCount === 0
      ? 'Placed 0 of 8.'
      : 'Placed ' + placedCount + ' of 8. Vegetables and fruit ' + counts.veg +
        ', protein ' + counts.pro + ', grains and starch ' + counts.grain +
        ', beside the plate ' + counts.side + '.';

    paintLivePlate();

    if (placedCount >= SORT_HELP_AFTER && placedCount < FOOD_COUNT) {
      sortReveal.hidden = false;
    }
    if (placedCount >= FOOD_COUNT) {
      sortReveal.hidden = true;
    }

    if (current === SORT_SCREEN) {
      nextBtn.disabled = placedCount < FOOD_COUNT;
    }
  }

  function placeFood(key, zone, quiet) {
    var food = FOODS[key];
    if (!food) {
      return;
    }

    if (!placed[key]) {
      placedCount += 1;
    }
    placed[key] = zone;

    each(document.querySelectorAll('[data-f="' + key + '"]'), function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-zone') === zone ? 'true' : 'false');
    });

    var row = document.querySelector('[data-f="' + key + '"]');
    if (row && row.closest('.food')) {
      row.closest('.food').classList.add('is-placed');
    }

    placedRight = 0;
    FOOD_ORDER.forEach(function (k) {
      if (placed[k] === FOODS[k].zone) {
        placedRight += 1;
      }
    });

    if (!quiet) {
      var ok = zone === food.zone;
      renderVerdict(
        sortVerdict,
        (ok ? 'Yes. ' : 'Not there. ') + food.name + ' goes ' + ZONE_NAME[food.zone] + '.',
        ok ? food.right : food.wrong
      );
    }

    updateSorter();
  }

  function sortRest() {
    FOOD_ORDER.forEach(function (key) {
      if (!placed[key]) {
        placeFood(key, FOODS[key].zone, true);
      }
    });
    renderVerdict(
      sortVerdict,
      'The rest are on the plate for you',
      'Select any food to read why it sits where it does. Nothing is locked, so you can move any of them and the reason will change with it.'
    );
    updateSorter();
  }

  /* ---------- the label hunt ---------- */

  function markSpot(key) {
    each(document.querySelectorAll('[data-spot="' + key + '"]'), function (btn) {
      btn.setAttribute('aria-pressed', 'true');
      var state = btn.querySelector('.spot-state');
      if (state) {
        state.textContent = 'Read';
      }
    });
  }

  function updateSpots() {
    spotCounter.textContent = foundCount >= SPOT_COUNT
      ? 'All six read.'
      : 'Found ' + foundCount + ' of ' + SPOT_COUNT + '.';
    if (foundCount >= SPOT_COUNT) {
      spotReveal.hidden = true;
    }
  }

  function takeSpot(key) {
    spotTries += 1;
    if (spotTries >= SPOT_HELP_AFTER && foundCount < SPOT_COUNT) {
      spotReveal.hidden = false;
    }
    if (!found[key]) {
      found[key] = true;
      foundCount += 1;
      markSpot(key);
    }
    renderVerdict(spotVerdict, SPOTS[key].head, SPOTS[key].why);
    updateSpots();
  }

  function revealSpots() {
    var missed = SPOT_ORDER.filter(function (key) {
      return !found[key];
    });
    if (missed.length) {
      missed.forEach(function (key) {
        found[key] = true;
        foundCount += 1;
        markSpot(key);
      });
      // Marked rather than dumped into one long block: every line is still a
      // button, and selecting one reads out the same explanation in the same
      // place it would have appeared anyway.
      renderVerdict(
        spotVerdict,
        'The rest are marked for you',
        'There were ' + missed.length + ' you had not opened. Select any line, on the panel or in the list, to read what it is telling you.'
      );
    }
    updateSpots();
  }

  /* ---------- the swap cards ---------- */

  var swaps = [];

  function turnSwap(swap, over) {
    swap.over = over;
    swap.front.hidden = over;
    swap.back.hidden = !over;
    swap.btn.setAttribute('aria-expanded', over ? 'true' : 'false');
    swap.btn.textContent = over ? 'Turn back' : 'Turn over';

    var face = over ? swap.back : swap.front;
    face.classList.remove('is-in');
    void face.offsetWidth;
    face.classList.add('is-in');
  }

  function keptSwaps() {
    var out = [];
    each(document.querySelectorAll('[data-keep]'), function (box) {
      if (box.checked) {
        out.push(box.getAttribute('data-keep'));
      }
    });
    return out;
  }

  function buildCard() {
    var kept = keptSwaps();
    swapCount.textContent = kept.length === 1 ? '1 swap kept.' : kept.length + ' swaps kept.';

    if (!kept.length) {
      cardBody.innerHTML = '<p class="quiet">No swaps kept yet. Go back a card, turn a few over, and tick the ones you would actually repeat. They land here.</p>';
      return;
    }

    var html = '<ul class="card-list">';
    kept.forEach(function (item) {
      html += '<li>' + item + '</li>';
    });
    html += '</ul>';
    cardBody.innerHTML = html;
  }

  function initSwaps() {
    each(document.querySelectorAll('.swap'), function (node) {
      var swap = {
        front: node.querySelector('.swap-front'),
        back: node.querySelector('.swap-back'),
        btn: node.querySelector('.swap-btn'),
        over: false
      };
      swap.btn.addEventListener('click', function () {
        turnSwap(swap, !swap.over);
      });
      swaps.push(swap);
      swap.front.hidden = false;
      swap.back.hidden = true;
      swap.btn.setAttribute('aria-expanded', 'false');
      swap.btn.textContent = 'Turn over';
    });
  }

  /* ---------- results ---------- */

  function updateResults() {
    var cues = tally(CUE_KEYS);
    var lines = [];

    lines.push(placedCount === 0
      ? 'Build a plate: not attempted.'
      : 'Build a plate: ' + placedRight + ' of ' + FOOD_COUNT + ' in the place the guide would put them.');

    lines.push('Label lines read: ' + foundCount + ' of ' + SPOT_COUNT + '.');

    lines.push(cues.answered === 0
      ? 'Hunger or habit: not attempted.'
      : cues.answered < cues.total
        ? 'Hunger or habit: ' + cues.right + ' matching, out of the ' + cues.answered + ' you answered, of ' + cues.total + '.'
        : 'Hunger or habit: ' + cues.right + ' of ' + cues.total + '.');

    resultsList.innerHTML = lines.map(function (line) {
      return '<li>' + line + '</li>';
    }).join('');
  }

  /* ---------- the ending ---------- */

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
          slug: 'build-the-plate',
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

    var cues = tally(CUE_KEYS);
    var kept = keptSwaps().length;
    var scores = {
      plate: placedRight + ' of ' + FOOD_COUNT,
      label: foundCount + ' of ' + SPOT_COUNT,
      cues: cues.right + ' of ' + cues.total,
      swaps: kept
    };

    donePlate.textContent = scores.plate;
    doneLabel.textContent = scores.label;
    doneCues.textContent = scores.cues;
    doneSwaps.textContent = String(kept);

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

  /* ---------- card movement ---------- */

  function show(n, moveFocus) {
    current = Math.min(Math.max(n, 1), TOTAL);

    screens.forEach(function (section, index) {
      section.hidden = index + 1 !== current;
    });

    progressText.textContent = 'Card ' + current + ' of ' + TOTAL;
    barFill.style.width = ((current / TOTAL) * 100) + '%';

    prevBtn.disabled = current === 1;
    // The last card keeps a live button: reaching it earns Finish, which is
    // the ending, rather than a greyed out Next with nothing behind it.
    nextBtn.disabled = current === SORT_SCREEN && placedCount < FOOD_COUNT;
    // The cover offers Start rather than Next: it is an invitation to begin,
    // not the second page of something already under way.
    nextBtn.textContent = current === TOTAL ? 'Finish' : current === 1 ? 'Start' : 'Next';

    if (current === TOTAL) {
      updateResults();
      buildCard();
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

  sortReveal.addEventListener('click', sortRest);
  spotReveal.addEventListener('click', revealSpots);

  swapWrap.addEventListener('change', buildCard);

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) {
      return;
    }

    var zoneBtn = target.closest('[data-f]');
    if (zoneBtn) {
      placeFood(zoneBtn.getAttribute('data-f'), zoneBtn.getAttribute('data-zone'), false);
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

    // One selection per moment, and nothing is ever disabled, so a first
    // guess never locks anybody out of changing their mind.
    each(document.querySelectorAll('[data-q="' + key + '"]'), function (other) {
      other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
    });

    var node = document.getElementById('fb-' + key);
    var copy = FEEDBACK[key];
    if (node && copy) {
      renderFeedback(node, ok, ok ? copy.correct : copy.wrong);
    }

    updateCueScore();
  });

  function resetModule() {
    each(document.querySelectorAll('[data-q]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    each(document.querySelectorAll('[data-f]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    each(document.querySelectorAll('.food'), function (node) {
      node.classList.remove('is-placed');
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
      p.classList.remove('is-wrong');
    });
    each(document.querySelectorAll('[data-keep]'), function (box) {
      box.checked = false;
    });
    each(document.querySelectorAll('#plate-a .wedge, #plate-a .side-kit'), function (node) {
      node.classList.remove('is-on');
    });

    placed = {};
    placedCount = 0;
    placedRight = 0;
    found = {};
    foundCount = 0;
    spotTries = 0;
    sortReveal.hidden = true;
    spotReveal.hidden = true;
    sortVerdict.innerHTML = '';
    spotVerdict.innerHTML = '';

    tabSets.forEach(function (set) {
      selectTab(set, 0, false);
    });
    accordions.forEach(function (acc) {
      openSection(acc, 0);
    });
    subRuns.forEach(function (run) {
      showStep(run, 0, false);
    });
    swaps.forEach(function (swap) {
      turnSwap(swap, false);
    });

    updateSorter();
    updateSpots();
    updateCueScore();
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
      var cardTab = document.getElementById('tab-9a');
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
  initSwaps();

  updateSorter();
  updateSpots();
  updateCueScore();
  buildCard();
  updateResults();
  show(1, false);
}());
