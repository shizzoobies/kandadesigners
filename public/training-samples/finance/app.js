/* ============================================================
   The profit and loss statement, read like an owner.

   Plain DOM. No framework, no network, no timers that expire.
   Seven jobs:
     1. show one screen at a time and move focus to its heading,
     2. run the tab sets and the sub-step pagers that keep each screen on
        the stage, moving focus the same way the outer pager does,
     3. put one statement line's explanation in the side panel at a time,
     4. run the four lever simulator and announce it without chattering,
     5. answer the sorter, the decision, and the three reads in text,
     6. draw the entry motion, or skip all of it under reduced motion,
     7. end the module on purpose: Finish opens a completion dialog and
        sends exactly one message to a parent that may not exist.

   Everything this file hides is visible without it. Nothing ships with a
   hidden attribute in the markup: with JS off every tab panel, every
   sub-step, and every explanation prints in order down the page.

   Deliberately absent: focus looping. The module runs in an iframe and
   trapping Tab at the end of the last screen would make the embed a
   keyboard trap. Nothing here reads or writes the top frame either; the one
   message it sends out goes to its immediate parent and nowhere else.
   ============================================================ */

(function () {
  'use strict';

  var TOTAL = 9;
  var current = 1;
  var completedSent = false;

  var reduceQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function reduced() {
    return !!(reduceQuery && reduceQuery.matches);
  }

  var screens = [];
  for (var i = 1; i <= TOTAL; i += 1) {
    screens.push(document.getElementById('screen-' + i));
  }

  var progressText = document.getElementById('progress-text');
  var barFill = document.getElementById('bar-fill');
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');

  /* ---------------------------------------------- formatting */

  // U+2212, the true minus sign, built from its code point so this file
  // stays plain ASCII and renders the same whatever charset an LMS serves
  // it under.
  var MINUS = String.fromCharCode(8722);

  function money(n) {
    var v = Math.round(n);
    var sign = v < 0 ? MINUS : '';
    return sign + '$' + Math.abs(v).toLocaleString('en-US');
  }

  function lessMoney(n) {
    // Costs are already labeled "Less ..." in the row header. The glyph
    // repeats the sign for anyone reading the column on its own.
    return MINUS + '$' + Math.round(Math.abs(n)).toLocaleString('en-US');
  }

  function pct(n) {
    return (Math.round(n * 10) / 10).toFixed(1) + '%';
  }

  function words(n) {
    // Spoken form for the live region: no glyphs, no ambiguity.
    var v = Math.round(n);
    return (v < 0 ? 'negative ' : '') + Math.abs(v).toLocaleString('en-US') + ' dollars';
  }

  /* ---------------------------------------------- glyph and feedback */

  var CHECK = 'm4 10.5 4 4 8-9';
  var CROSS = 'M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5';
  var DOT = 'M10 4v8M10 15.4v.2';

  function glyph(kind) {
    var d = kind === 'right' ? CHECK : (kind === 'wrong' ? CROSS : DOT);
    return '<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="' +
      d + '"/></svg>';
  }

  // Correctness is carried by the verdict word first and the glyph second.
  // Color is the third signal and never the only one.
  function say(node, kind, verdict, text, note) {
    node.classList.remove('is-right', 'is-wrong');
    if (kind === 'right') { node.classList.add('is-right'); }
    if (kind === 'wrong') { node.classList.add('is-wrong'); }
    node.innerHTML = glyph(kind) +
      '<span class="verdict">' + verdict + '</span> ' + text +
      (note ? '<span class="fb-note">' + note + '</span>' : '');
  }

  function clearFeedback() {
    Array.prototype.forEach.call(document.querySelectorAll('.feedback'), function (p) {
      p.textContent = '';
      p.classList.remove('is-right', 'is-wrong');
    });
  }

  /* ---------------------------------------------- counting figures */

  function tween(el, to, format) {
    var from = typeof el._val === 'number' ? el._val : 0;
    el._val = to;

    if (el._raf) {
      window.cancelAnimationFrame(el._raf);
      el._raf = null;
    }

    if (reduced() || from === to) {
      el.innerHTML = format(to);
      return;
    }

    var start = null;
    var span = 400;

    function step(now) {
      if (start === null) { start = now; }
      var t = Math.min(1, (now - start) / span);
      var eased = 1 - Math.pow(1 - t, 3);
      el.innerHTML = format(from + (to - from) * eased);
      if (t < 1) {
        el._raf = window.requestAnimationFrame(step);
      } else {
        el._raf = null;
        el.innerHTML = format(to);
      }
    }

    el._raf = window.requestAnimationFrame(step);
  }

  /* ============================================================
     Tab sets, to the APG pattern: roving tabindex, arrows and
     Home and End, automatic activation.
     ============================================================ */

  var tabSets = [];

  function initTabs(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    if (!tabs.length) { return null; }

    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });

    function select(index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) { panels[i].hidden = !on; }
      });
      if (moveFocus) { tabs[index].focus(); }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (event) {
        var last = tabs.length - 1;
        var target = -1;
        if (event.key === 'ArrowRight' || event.key === 'Right') { target = i === last ? 0 : i + 1; }
        else if (event.key === 'ArrowLeft' || event.key === 'Left') { target = i === 0 ? last : i - 1; }
        else if (event.key === 'Home') { target = 0; }
        else if (event.key === 'End') { target = last; }
        if (target < 0) { return; }
        event.preventDefault();
        select(target, true);
      });
    });

    select(0, false);
    return { root: root, select: select };
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-tabs]'), function (root) {
    var set = initTabs(root);
    if (set) { tabSets.push(set); }
  });

  // The last screen's tab set, found by the tab it contains rather than by
  // its position in the document, so adding a tab set anywhere cannot
  // silently point the ending at the wrong panel.
  var takeawayTab = document.getElementById('tab-w3');
  var takeawaySet = null;
  tabSets.forEach(function (set) {
    if (takeawayTab && set.root.contains(takeawayTab)) { takeawaySet = set; }
  });

  /* ============================================================
     Sub-steps: one item, or one question, at a time, inside a
     screen. The outer screen count does not change; this pager
     has its own count and its own announcement, and focus lands
     on the step heading exactly as it lands on a screen heading.
     ============================================================ */

  var stepSets = [];

  function initSteps(root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-step]'));
    if (!steps.length) { return null; }

    var prev = root.querySelector('[data-step-prev]');
    var next = root.querySelector('[data-step-next]');
    var count = root.querySelector('[data-step-count]');
    var label = root.getAttribute('data-step-label') || 'Step';
    var at = 0;

    function paint(moveFocus) {
      steps.forEach(function (step, i) { step.hidden = i !== at; });
      if (count) {
        count.textContent = label + ' ' + (at + 1) + ' of ' + steps.length;
      }
      if (prev) { prev.disabled = at === 0; }
      if (next) { next.disabled = at === steps.length - 1; }
      if (moveFocus) {
        var focusTarget = steps[at].querySelector('[data-step-focus]');
        if (focusTarget) { focusTarget.focus(); }
      }
    }

    function go(n) {
      at = Math.min(Math.max(n, 0), steps.length - 1);
      paint(true);
    }

    if (prev) { prev.addEventListener('click', function () { go(at - 1); }); }
    if (next) { next.addEventListener('click', function () { go(at + 1); }); }

    paint(false);
    return { reset: function () { at = 0; paint(false); } };
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-steps]'), function (root) {
    var set = initSteps(root);
    if (set) { stepSets.push(set); }
  });

  /* ============================================================
     Screen three: one statement line's explanation at a time, in
     the panel beside the table. The note is a long piece of
     prose, so the panel is a polite live region: pressing the
     button is a request to be told, and being told is the point.
     ============================================================ */

  var whyButtons = Array.prototype.slice.call(document.querySelectorAll('.why'));
  var notesHint = document.getElementById('notes-hint');

  function closeAllNotes() {
    whyButtons.forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) { panel.hidden = true; }
    });
    if (notesHint) { notesHint.hidden = false; }
  }

  whyButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) { return; }
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      closeAllNotes();
      if (!wasOpen) {
        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        if (notesHint) { notesHint.hidden = true; }
      }
    });
  });

  /* ============================================================
     Screen five: the simulator
     ============================================================ */

  var DEFAULTS = { price: 8, units: 10000, cogs: 40, opex: 43000 };

  var sPrice = document.getElementById('s-price');
  var sUnits = document.getElementById('s-units');
  var sCogs = document.getElementById('s-cogs');
  var sOpex = document.getElementById('s-opex');

  var outPrice = document.getElementById('out-price');
  var outUnits = document.getElementById('out-units');
  var outCogs = document.getElementById('out-cogs');
  var outOpex = document.getElementById('out-opex');

  var vRev = document.getElementById('v-rev');
  var vCogs = document.getElementById('v-cogs');
  var vGp = document.getElementById('v-gp');
  var vOpex = document.getElementById('v-opex');
  var vOi = document.getElementById('v-oi');
  var vGm = document.getElementById('v-gm');
  var vGmNote = document.getElementById('v-gm-note');
  var vOiBig = document.getElementById('v-oi-big');
  var vOiNote = document.getElementById('v-oi-note');
  var simLive = document.getElementById('sim-live');
  var simReset = document.getElementById('sim-reset');

  var liveTimer = null;

  function state() {
    var price = parseFloat(sPrice.value);
    var units = parseInt(sUnits.value, 10);
    var cogsPct = parseInt(sCogs.value, 10);
    var opex = parseInt(sOpex.value, 10);
    var rev = price * units;
    var cogs = rev * (cogsPct / 100);
    var gp = rev - cogs;
    return {
      price: price,
      units: units,
      cogsPct: cogsPct,
      opex: opex,
      rev: rev,
      cogs: cogs,
      gp: gp,
      gm: (gp / rev) * 100,
      oi: gp - opex
    };
  }

  function signedFigure(n) {
    var positive = n > 0;
    var flat = Math.round(n) === 0;
    var cls = flat ? '' : (positive ? ' pos' : ' neg');
    var tag = flat ? 'break even' : (positive ? 'profit' : 'loss');
    return '<span class="fig' + cls + '">' + money(n) +
      ' <span class="tag">' + tag + '</span></span>';
  }

  function paintOutputs(s) {
    outPrice.textContent = '$' + s.price.toFixed(2);
    sPrice.setAttribute('aria-valuetext', '$' + s.price.toFixed(2));

    outUnits.textContent = s.units.toLocaleString('en-US');
    sUnits.setAttribute('aria-valuetext', s.units.toLocaleString('en-US') + ' items');

    outCogs.textContent = s.cogsPct + '%';
    sCogs.setAttribute('aria-valuetext', s.cogsPct + ' percent of revenue');

    outOpex.textContent = '$' + s.opex.toLocaleString('en-US');
    sOpex.setAttribute('aria-valuetext', '$' + s.opex.toLocaleString('en-US') + ' per month');
  }

  function announce(s) {
    if (liveTimer) { window.clearTimeout(liveTimer); }
    liveTimer = window.setTimeout(function () {
      simLive.textContent = 'Gross margin ' + pct(s.gm) + '. Operating income ' +
        words(s.oi) + ', ' +
        (Math.round(s.oi) === 0 ? 'break even.' : (s.oi > 0 ? 'a profit.' : 'a loss.'));
    }, 700);
  }

  function paintSim(animate) {
    var s = state();
    paintOutputs(s);

    var fmtMoney = function (v) { return money(v); };
    var fmtLess = function (v) { return lessMoney(v); };
    var fmtPct = function (v) { return pct(v); };

    if (animate) {
      tween(vRev, s.rev, fmtMoney);
      tween(vCogs, s.cogs, fmtLess);
      tween(vGp, s.gp, fmtMoney);
      tween(vOpex, s.opex, fmtLess);
      tween(vOi, s.oi, signedFigure);
      tween(vOiBig, s.oi, fmtMoney);
      tween(vGm, s.gm, fmtPct);
    } else {
      vRev.innerHTML = fmtMoney(s.rev); vRev._val = s.rev;
      vCogs.innerHTML = fmtLess(s.cogs); vCogs._val = s.cogs;
      vGp.innerHTML = fmtMoney(s.gp); vGp._val = s.gp;
      vOpex.innerHTML = fmtLess(s.opex); vOpex._val = s.opex;
      vOi.innerHTML = signedFigure(s.oi); vOi._val = s.oi;
      vOiBig.innerHTML = fmtMoney(s.oi); vOiBig._val = s.oi;
      vGm.innerHTML = fmtPct(s.gm); vGm._val = s.gm;
    }

    vGmNote.textContent = Math.round(s.gm) + ' cents of every dollar of revenue survives the baking.';

    if (Math.round(s.oi) === 0) {
      vOiNote.innerHTML = '<span class="fig">Break even</span> for the month.';
    } else if (s.oi > 0) {
      vOiNote.innerHTML = '<span class="fig pos">Profit</span> for the month, before interest.';
    } else {
      vOiNote.innerHTML = '<span class="fig neg">Loss</span> for the month, before interest.';
    }

    return s;
  }

  function clearPromptFeedback() {
    // A check reads the statement at one moment. Once a lever moves, what it
    // said is a figure for a statement that no longer exists, so it goes.
    ['fb-p1', 'fb-p2'].forEach(function (id) {
      var node = document.getElementById(id);
      node.textContent = '';
      node.classList.remove('is-right', 'is-wrong');
    });
  }

  function onSlide() {
    var s = paintSim(true);
    clearPromptFeedback();
    announce(s);
  }

  [sPrice, sUnits, sCogs, sOpex].forEach(function (input) {
    input.addEventListener('input', onSlide);
    input.addEventListener('change', onSlide);
  });

  simReset.addEventListener('click', function () {
    sPrice.value = DEFAULTS.price;
    sUnits.value = DEFAULTS.units;
    sCogs.value = DEFAULTS.cogs;
    sOpex.value = DEFAULTS.opex;
    var s = paintSim(true);
    clearPromptFeedback();
    announce(s);
  });

  /* ---------------------------------------------- guided prompts */

  document.getElementById('check-1').addEventListener('click', function () {
    var s = state();
    var node = document.getElementById('fb-p1');
    var setup = 'Right now: ' + s.units.toLocaleString('en-US') + ' items at $' +
      s.price.toFixed(2) + ' is ' + money(s.rev) + ' of revenue, ' + pct(s.gm) +
      ' gross margin, and ' + money(s.opex) + ' of operating expenses.';

    if (Math.round(s.oi) > 0) {
      say(node, 'right', 'Found it.',
        'Operating income is ' + money(s.oi) + ', a profit. ' + setup,
        'Now break it on purpose: drag the price down fifty cents and watch how many more items you need just to stand still. That ratio is the whole argument against discounting.');
    } else if (Math.round(s.oi) === 0) {
      say(node, 'right', 'Exactly on the line.',
        'Operating income is zero. ' + setup,
        'One more item sold at this price adds ' + money(s.price * (s.gm / 100)) +
        ' straight to operating income, because the cost of being open is already paid for.');
    } else {
      var needRev = s.opex / (s.gm / 100);
      var needUnits = Math.ceil(needRev / s.price);
      var needPrice = needRev / s.units;
      say(node, 'wrong', 'Not yet.',
        'Operating income is ' + money(s.oi) + ', a loss. ' + setup,
        'To clear zero you need ' + money(needRev) + ' of revenue at this margin. That is about ' +
        needUnits.toLocaleString('en-US') + ' items at the current price, or a price of $' +
        needPrice.toFixed(2) + ' at the current volume. Either lever gets there; they are not equally easy.');
    }
  });

  document.getElementById('check-2').addEventListener('click', function () {
    var s = state();
    var node = document.getElementById('fb-p2');
    var swing = s.rev * 0.05;
    var worseOi = s.oi - swing;
    var betterOi = s.oi + swing;

    say(node, 'note', 'Here is the five points.',
      'Cost of goods is at ' + s.cogsPct + ' percent, so gross margin is ' + pct(s.gm) +
      ' and operating income is ' + money(s.oi) + '. Five points worse, at ' + (s.cogsPct + 5) +
      ' percent, operating income becomes ' + money(worseOi) + '. Five points better, at ' +
      (s.cogsPct - 5) + ' percent, it becomes ' + money(betterOi) + '.',
      'Five points of cost of goods is exactly five percent of revenue: ' + money(swing) +
      ' a month at this volume. It moves operating income dollar for dollar, and nothing else on the statement changes. That is why a small move in a supplier price or a recipe yield matters more than it sounds like it should.');
  });

  /* ============================================================
     Screen six: classify the line
     ============================================================ */

  var LABELS = {
    rev: 'Revenue',
    cogs: 'Cost of goods sold',
    opex: 'Operating expense',
    off: 'Not on the statement'
  };

  var CLASSIFY = {
    c1: { key: 'cogs', why: 'Ingredients and packaging go into the thing you sell, so the cost moves with volume. Bake nothing next month and almost all of this disappears.' },
    c2: { key: 'opex', why: 'It is paid whether the ovens run or not. Costs that do not move with the next loaf sold sit below gross profit.' },
    c3: { key: 'off', why: 'Buying equipment is not a cost, it is a swap: cash becomes an asset. What reaches this statement is depreciation, a slice of the $18,000 charged as an operating expense in each month the oven is expected to last. This is the line managers most often expect to see and cannot find.' },
    c4: { key: 'opex', why: 'Fixed, and payable whether or not one more loaf sells. Worth watching as a percent of revenue rather than as a dollar figure.' },
    c5: { key: 'off', why: 'Repaying what you borrowed reduces cash and reduces the debt at the same time. Neither of those is a cost of earning anything, which is what this statement measures. Only the interest reaches the statement, down in other income and expense. This is a large part of why a business can be profitable and still short of cash.' },
    c6: { key: 'off', why: 'A draw is the owner taking a share of profit already earned, not a cost of earning it. If she paid herself a salary for managing the shop instead, that salary would be an operating expense. Same person, same money, different line, and only one of them changes the profit figure.' },
    c7: { key: 'opex', why: 'Getting the bread to the customer happens after it is made, so most bakeries carry delivery below gross profit. Some businesses do put outbound freight in cost of sales. Either is defensible; the rule is to keep the same treatment every month so the months compare.' },
    c8: { key: 'rev', why: 'The top line. Everything sold, before a single cost comes off, and the number that says the least about whether you kept any of it.' },
    c9: { key: 'opex', why: 'A real cost of taking the money, and an operating expense here. Note that it is not netted off the sales figure: you want to see gross sales and the fee as two separate things you can act on separately.' },
    c10: { key: 'off', why: 'Not yet. Goods you have made and not sold are inventory, an asset. Their cost moves into cost of goods sold in the month somebody buys them. If they go stale and get thrown out, the cost lands that month as waste instead.' }
  };

  var CLASSIFY_KEYS = Object.keys(CLASSIFY);
  var scoreClassify = document.getElementById('score-classify');

  function classifyTally() {
    var answered = 0;
    var right = 0;
    CLASSIFY_KEYS.forEach(function (k) {
      var chosen = document.querySelector('.sort[data-q="' + k + '"][aria-pressed="true"]');
      if (chosen) {
        answered += 1;
        if (chosen.getAttribute('data-a') === CLASSIFY[k].key) { right += 1; }
      }
    });
    return { answered: answered, right: right };
  }

  function paintClassifyScore() {
    var t = classifyTally();
    if (t.answered === 0) {
      scoreClassify.textContent = 'Answered 0 of 10.';
    } else if (t.answered < 10) {
      scoreClassify.textContent = 'Answered ' + t.answered + ' of 10. Right so far: ' + t.right + '.';
    } else {
      scoreClassify.textContent = 'All ten answered. You placed ' + t.right + ' of 10 correctly.';
    }
  }

  /* ============================================================
     Screen eight: the decision
     ============================================================ */

  var DECISION = {
    go: {
      kind: 'wrong',
      verdict: 'Not the call.',
      text: 'The month showed $4,100 of profit and a falling bank balance at the same time, and a build out is paid in cash, not in net income. One month is also an anecdote rather than a trend.',
      note: 'The instinct that the business is earning may well be right. The evidence offered does not support the decision being made with it, and that gap is the whole point of this module.'
    },
    wait: {
      kind: 'right',
      verdict: 'The strongest answer.',
      text: 'It separates the two questions the owner has merged. Whether the bakery earns is a margin question, and one month is not an answer to it. Whether the bakery can open a third shop is a cash question, and $4,100 of profit with $9,000 uncollected, $6,000 of flour in the storeroom, and a year of insurance already paid does not fund a $60,000 build out.',
      note: 'Three months of margin split by location earns its keep twice over: a combined statement hides whether one shop is quietly carrying the other, and that is exactly the thing you want to know before signing a third lease.'
    },
    cut: {
      kind: 'wrong',
      verdict: 'Half right, and the wrong half first.',
      text: 'Cutting $8,000 from a $43,000 operating expense base is nearly a fifth of it. Without knowing which location carries the margin, you are as likely to cut the thing that earns as the thing that leaks.',
      note: 'Costs are worth attacking once you know which line is which. Even then, a leaner month does not answer where $60,000 of cash comes from in the next sixty days.'
    },
    price: {
      kind: 'wrong',
      verdict: 'Half right.',
      text: 'Price is the strongest single lever on margin, and the simulator on screen five shows why: five points of margin is five percent of revenue, straight through to operating income.',
      note: 'But a price move is a test, and you need a month or two to see what it does to volume before building on the result. A better margin next month still does not put $60,000 in the account this quarter.'
    }
  };

  /* ============================================================
     Screen nine: the three reads
     ============================================================ */

  var READS = {
    q1: {
      right: 'Sixty percent. Gross profit of $48,000 divided by revenue of $80,000.',
      wrong: 'Sixty percent. Gross profit of $48,000 divided by revenue of $80,000. Forty percent is the cost of goods ratio, the mirror image of the same figure. Five percent is the operating income margin, further down the page.'
    },
    q2: {
      right: 'Operating expenses, at $43,000, against $32,000 of cost of goods. On this statement the cost of being open beats the cost of the product.',
      wrong: 'Operating expenses take the most: $43,000, against $32,000 for cost of goods and $900 of interest. That is worth sitting with. The biggest single deduction here is not the product, it is the business.'
    },
    q3: {
      right: 'It falls to $1,000. Five points of $80,000 is $4,000. Gross profit drops from $48,000 to $44,000, operating expenses do not move, so $5,000 of operating income becomes $1,000. Four fifths of the profit, from five points.',
      wrong: 'It falls to $1,000. Cost of goods sits above gross profit, which is precisely why it moves everything below it. Five points of $80,000 is $4,000 off gross profit, nothing below changes, and $5,000 of operating income becomes $1,000.'
    }
  };

  var READ_KEYS = ['q1', 'q2', 'q3'];

  function readsTally() {
    var answered = 0;
    var right = 0;
    READ_KEYS.forEach(function (k) {
      var chosen = document.querySelector('[data-q="' + k + '"][aria-pressed="true"]');
      if (chosen) {
        answered += 1;
        if (chosen.getAttribute('data-correct') === 'true') { right += 1; }
      }
    });
    return { answered: answered, right: right };
  }

  /* ============================================================
     One click handler for every single select group
     ============================================================ */

  document.addEventListener('click', function (event) {
    var btn = event.target.closest ? event.target.closest('[data-q]') : null;
    if (!btn) { return; }

    var key = btn.getAttribute('data-q');
    var group = document.querySelectorAll('[data-q="' + key + '"]');

    // Single selection, never disabled: nobody gets stuck on a first guess.
    Array.prototype.forEach.call(group, function (other) {
      other.setAttribute('aria-pressed', other === btn ? 'true' : 'false');
    });

    var node = document.getElementById('fb-' + key);
    if (!node) { return; }

    if (CLASSIFY[key]) {
      var item = CLASSIFY[key];
      var picked = btn.getAttribute('data-a');
      var ok = picked === item.key;
      say(node, ok ? 'right' : 'wrong',
        ok ? 'Correct.' : 'Not quite.',
        ok ? LABELS[item.key] + '. ' + item.why
           : 'It belongs under ' + LABELS[item.key].toLowerCase() + '. ' + item.why);
      paintClassifyScore();
      paintScorecard();
      return;
    }

    if (key === 'dec') {
      var d = DECISION[btn.getAttribute('data-opt')];
      if (d) { say(node, d.kind, d.verdict, d.text, d.note); }
      paintScorecard();
      return;
    }

    if (READS[key]) {
      var isRight = btn.getAttribute('data-correct') === 'true';
      say(node, isRight ? 'right' : 'wrong',
        isRight ? 'Correct.' : 'Not quite.',
        isRight ? READS[key].right : READS[key].wrong);
      // The three reads live on the last screen, so the card behind them has
      // to keep up rather than waiting for the next entry that never comes.
      paintScorecard();
      return;
    }
  });

  /* ============================================================
     Screen nine: the chart table toggle and the scorecard
     ============================================================ */

  var wfToggle = document.getElementById('wf-toggle');
  var wfTable = document.getElementById('wf-table');

  var wfPanel = document.getElementById('panel-w1');

  function setWaterfallTable(open) {
    wfToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    wfTable.classList.toggle('sr-only', !open);
    // Shown, the table takes the right half of the panel and the chart
    // gives up the width. Stacked, the two together are taller than the
    // stage allows.
    if (wfPanel) { wfPanel.classList.toggle('is-split', open); }
    wfToggle.textContent = open ? 'Hide the table' : 'Show the figures as a table';
  }

  wfToggle.addEventListener('click', function () {
    setWaterfallTable(wfToggle.getAttribute('aria-expanded') !== 'true');
  });

  var finalClassify = document.getElementById('final-classify');
  var finalDec = document.getElementById('final-dec');
  var finalReads = document.getElementById('final-reads');

  // One reading of the decision, used by the scorecard, the ending card, and
  // the message that leaves the frame, so the three can never disagree.
  function decisionSummary() {
    var chosen = document.querySelector('[data-q="dec"][aria-pressed="true"]');
    if (!chosen) {
      return { answered: false, label: 'Not answered', tag: '', kind: '', message: 'not answered' };
    }
    var tagEl = chosen.querySelector('.choice-tag');
    var label = tagEl ? tagEl.textContent : 'An option';
    var right = chosen.getAttribute('data-opt') === 'wait';
    return {
      answered: true,
      label: label,
      tag: right ? 'strongest' : 'not the call',
      kind: right ? 'pos' : 'neg',
      message: label + (right ? ', the strongest read' : ', not the strongest read')
    };
  }

  function paintScorecard() {
    var c = classifyTally();
    finalClassify.textContent = c.answered === 0
      ? 'Classify the line: not answered yet. Screen six is still there if you want it.'
      : 'Classify the line: ' + c.right + ' of ' + c.answered + ' placed correctly, out of ten items.';

    var d = decisionSummary();
    if (!d.answered) {
      finalDec.textContent = 'The decision: not answered yet.';
    } else {
      finalDec.textContent = d.kind === 'pos'
        ? 'The decision: you chose ' + d.label + ', the strongest read of the month.'
        : 'The decision: you chose ' + d.label + '. The strongest read was Option B, which separates the margin question from the cash question.';
    }

    var r = readsTally();
    finalReads.textContent = r.answered === 0
      ? 'Three quick reads: not answered yet.'
      : 'Three quick reads: ' + r.right + ' of ' + r.answered + ' right.';
  }

  /* ============================================================
     Entry motion, per screen
     ============================================================ */

  function restart(el) {
    // Force the animation to run again on re-entry.
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  function animateRows() {
    var table = document.getElementById('pnl-static');
    if (!table) { return; }
    var rows = table.querySelectorAll('.row-line');
    table.classList.remove('animate-rows');
    void table.offsetWidth;
    Array.prototype.forEach.call(rows, function (row, index) {
      row.style.animationDelay = reduced() ? '0ms' : (index * 55) + 'ms';
    });
    table.classList.add('animate-rows');
  }

  function animateBars() {
    var bars = document.querySelectorAll('#screen-4 .bar');
    Array.prototype.forEach.call(bars, function (bar) {
      var w = bar.getAttribute('data-w');
      if (reduced()) {
        bar.style.width = w + 'px';
        return;
      }
      bar.style.width = '0px';
      void bar.getBoundingClientRect().width;
      window.requestAnimationFrame(function () {
        bar.style.width = w + 'px';
      });
    });
  }

  function animateWaterfall() {
    var svg = document.querySelector('#screen-9 .waterfall');
    if (!svg) { return; }
    var groups = svg.querySelectorAll('.wf-bar');
    svg.classList.remove('animate-wf');
    void svg.getBoundingClientRect().width;
    Array.prototype.forEach.call(groups, function (g, index) {
      var delay = reduced() ? '0ms' : (index * 110) + 'ms';
      g.style.animationDelay = delay;
      var rect = g.querySelector('rect');
      if (rect) { rect.style.animationDelay = delay; }
    });
    svg.classList.add('animate-wf');
  }

  /* ============================================================
     Screen movement
     ============================================================ */

  // Sent on the first press of Finish and never again, because finishing is
  // an act and not a side effect of arriving on the last screen. Best effort:
  // the host is not required to listen, and a packaged copy inside an LMS has
  // no parent worth talking to.
  function announceCompletion() {
    if (completedSent) { return; }
    completedSent = true;
    try {
      if (window.parent && window.parent !== window) {
        var c = classifyTally();
        var r = readsTally();
        window.parent.postMessage({
          type: 'ka-sample-complete',
          slug: 'reading-the-pnl',
          scores: {
            classify: c.right + ' of 10',
            decision: decisionSummary().message,
            reads: r.right + ' of 3'
          }
        }, '*');
      }
    } catch (err) {
      /* nothing depends on this */
    }
  }

  function show(n, moveFocus) {
    current = Math.min(Math.max(n, 1), TOTAL);

    screens.forEach(function (section, index) {
      var isCurrent = index + 1 === current;
      section.classList.toggle('is-current', isCurrent);
      section.hidden = !isCurrent;
    });

    // The counter is a folio, the way a bound ledger numbers its pages, and
    // it turns like a page corner on every move. The animation lives in CSS
    // and only runs where motion is welcome; restart is what re-triggers it,
    // because setting textContent alone would not.
    progressText.textContent = 'Folio ' + current + ' of ' + TOTAL;
    restart(progressText);
    barFill.style.width = ((current / TOTAL) * 100) + '%';

    prevBtn.disabled = current === 1;
    // The last button is never a dead control. On the last screen it stops
    // being a pager and becomes the thing that ends the module.
    nextBtn.disabled = false;
    // Three words for one button: the cover starts the module, the last
    // folio ends it, and everything between is a page turn.
    nextBtn.textContent = current === TOTAL ? 'Finish' : (current === 1 ? 'Start' : 'Next');

    var heading = screens[current - 1].querySelector('h2');
    if (heading) { restart(heading); }

    if (current === 3) { animateRows(); }
    if (current === 4) { animateBars(); }
    if (current === 5) {
      // Figures count up from zero on entry, then exactly.
      [vRev, vCogs, vGp, vOpex, vOi, vOiBig, vGm].forEach(function (el) { el._val = 0; });
      paintSim(true);
    }
    if (current === 9) {
      animateWaterfall();
      paintScorecard();
    }

    if (moveFocus && heading) { heading.focus(); }
  }

  function resetAll() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (btn) {
      btn.setAttribute('aria-pressed', 'false');
    });
    closeAllNotes();
    tabSets.forEach(function (set) { set.select(0, false); });
    stepSets.forEach(function (set) { set.reset(); });
    setWaterfallTable(false);
    clearFeedback();
    paintClassifyScore();
    sPrice.value = DEFAULTS.price;
    sUnits.value = DEFAULTS.units;
    sCogs.value = DEFAULTS.cogs;
    sOpex.value = DEFAULTS.opex;
    paintSim(false);
    simLive.textContent = '';
    show(1, true);
  }

  /* ============================================================
     The ending: a modal that says the module is over, in the
     same paper and ink as the module itself. Esc, the close
     button, and the backdrop all dismiss it, and focus goes back
     to the button that opened it unless an action asks for it
     somewhere better.
     ============================================================ */

  var doneDialog = document.getElementById('done');
  var doneTitle = document.getElementById('done-title');
  var doneClassify = document.getElementById('done-classify');
  var doneDec = document.getElementById('done-dec');
  var doneReads = document.getElementById('done-reads');
  var focusAfterClose = null;

  function goToTakeaway() {
    if (takeawaySet) { takeawaySet.select(2, true); }
  }

  function paintDone() {
    var c = classifyTally();
    var r = readsTally();
    var d = decisionSummary();

    doneDec.innerHTML = d.answered
      ? '<span class="fig ' + d.kind + '">' + d.label +
        ' <span class="tag">' + d.tag + '</span></span>'
      : d.label;

    // Counted from zero each time the card opens, and only once per opening.
    doneClassify._val = 0;
    doneReads._val = 0;
    tween(doneClassify, c.right, function (v) { return Math.round(v) + ' of 10'; });
    tween(doneReads, r.right, function (v) { return Math.round(v) + ' of 3'; });
  }

  function openDone() {
    paintScorecard();
    announceCompletion();

    // No dialog support means no modal. The takeaway panel is the ending in
    // that case, exactly as it is with JS off.
    if (typeof doneDialog.showModal !== 'function') {
      goToTakeaway();
      return;
    }

    focusAfterClose = null;
    paintDone();
    doneDialog.showModal();
    doneTitle.focus();
  }

  doneDialog.addEventListener('close', function () {
    var next = focusAfterClose;
    focusAfterClose = null;
    if (next) { next(); return; }
    nextBtn.focus();
  });

  // A click that reaches the dialog itself landed on the backdrop: the card
  // inside carries all the padding.
  doneDialog.addEventListener('click', function (event) {
    if (event.target === doneDialog) { doneDialog.close(); }
  });

  document.getElementById('done-close').addEventListener('click', function () {
    doneDialog.close();
  });

  document.getElementById('done-takeaway').addEventListener('click', function () {
    focusAfterClose = goToTakeaway;
    doneDialog.close();
  });

  document.getElementById('done-restart').addEventListener('click', function () {
    focusAfterClose = resetAll;
    doneDialog.close();
  });

  prevBtn.addEventListener('click', function () { show(current - 1, true); });

  nextBtn.addEventListener('click', function () {
    if (current === TOTAL) { openDone(); return; }
    show(current + 1, true);
  });

  document.getElementById('restart').addEventListener('click', resetAll);

  /* ---------------------------------------------- start */

  closeAllNotes();
  paintSim(false);
  paintClassifyScore();
  // No focus grab on load: the module is embedded, and stealing focus would
  // yank the host page down to the frame before anybody asked it to.
  show(1, false);
}());
