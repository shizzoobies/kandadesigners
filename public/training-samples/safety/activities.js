(function () {
  'use strict';

  var data;
  var nodes;
  var onChange = function () {};
  var initialized = false;
  var selectedTool = null;
  var placements = Object.create(null);
  var controlSubmitted = false;
  var inspected = Object.create(null);
  var holds = Object.create(null);
  var selectedFinding = null;
  var auditSubmitted = false;
  var tools = Object.create(null);
  var cards = Object.create(null);
  var locations = Object.create(null);
  var dragType = 'application/x-ka-safety-control';
  var activeDragTool = null;
  var activeControl = 0;
  var toolkitOpen = false;

  function toggleToolkit(open) {
    toolkitOpen = open;
    if (open) nodes.controlMessage.classList.remove('is-notice');
    nodes.workbenchStage.classList.toggle('is-picking', open);
    nodes.controlPicker.setAttribute('aria-expanded', open ? 'true' : 'false');
    nodes.controlPicker.textContent = open ? 'Back to situation' : 'Open toolkit';
  }

  function showControl(index, focus) {
    toggleToolkit(false);
    activeControl = Math.max(0, Math.min(data.controls.length - 1, index));
    updateControls();
    if (focus) cards[data.controls[activeControl].id].title.focus();
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function button(className, text) {
    var node = element('button', className, text);
    node.type = 'button';
    return node;
  }

  function control(id) {
    return data.controls.find(function (item) { return item.id === id; });
  }

  function finding(id) {
    return data.findings.find(function (item) { return item.id === id; });
  }

  function toolLocation(id) {
    return data.controls.find(function (item) { return placements[item.id] === id; });
  }

  function controlCount() {
    return data.controls.filter(function (item) { return Boolean(placements[item.id]); }).length;
  }

  function controlRight() {
    return data.controls.filter(function (item) { return placements[item.id] === item.id; }).length;
  }

  function auditRight() {
    return data.findings.filter(function (item) { return Boolean(holds[item.id]) === item.hold; }).length;
  }

  function updateControls() {
    nodes.controlMessage.classList.remove('is-notice');
    data.controls.forEach(function (item) {
      var rack = tools[item.id];
      var location = toolLocation(item.id);
      rack.button.classList.toggle('selected', selectedTool === item.id);
      rack.button.classList.toggle('placed', Boolean(location));
      rack.button.setAttribute('aria-pressed', selectedTool === item.id ? 'true' : 'false');
      rack.button.setAttribute('data-location', location ? location.id : '');
      rack.state.textContent = selectedTool === item.id
        ? 'Selected. Choose a situation.'
        : location ? 'Placed' : 'Ready to place';
      rack.button.setAttribute('aria-label', item.action + (location ? '. Placed at ' + location.title : '. Ready to place'));

      var card = cards[item.id];
      var assigned = control(placements[item.id]);
      var correct = controlSubmitted && assigned && assigned.id === item.id;
      card.node.hidden = item.id !== data.controls[activeControl].id;
      card.option.textContent = item.title + (controlSubmitted ? (correct ? ' · Matched' : ' · Revisit') : assigned ? ' · Placed' : '');
      card.node.classList.toggle('placed', Boolean(assigned));
      card.node.classList.toggle('correct', Boolean(correct));
      card.node.classList.toggle('needs-review', controlSubmitted && !correct);
      card.target.setAttribute('data-assigned', assigned ? assigned.id : '');
      card.target.draggable = Boolean(assigned);
      card.target.classList.toggle('placed', Boolean(assigned));
      card.target.classList.toggle('selected', Boolean(assigned && assigned.id === selectedTool));
      card.label.textContent = selectedTool ? 'Place: ' + control(selectedTool).action : assigned ? assigned.action : 'Place a control here';
      card.remove.hidden = !assigned;
      card.remove.setAttribute('aria-label', 'Remove control from ' + item.title);
      card.explanation.hidden = !controlSubmitted;
      card.summary.textContent = correct ? 'Why this control works' : 'Review this placement';
      card.feedback.textContent = !controlSubmitted ? '' : correct
        ? 'Matched. ' + (item.feedback.toLowerCase().indexOf(item.level.toLowerCase()) === 0 ? '' : item.level + ': ') + item.feedback
        : 'Revisit this placement. Read the situation and try a different control.';
    });
    nodes.hocScore.textContent = controlSubmitted
      ? controlRight() + ' of ' + data.controls.length + ' controls matched.'
      : 'Placed ' + controlCount() + ' of ' + data.controls.length + '.';
    nodes.controlLocation.value = data.controls[activeControl].id;
    nodes.controlPrev.disabled = activeControl === 0;
    nodes.controlNext.disabled = activeControl === data.controls.length - 1;
  }

  function chooseTool(id) {
    if (!control(id)) return;
    toggleToolkit(false);
    selectedTool = selectedTool === id ? null : id;
    updateControls();
    nodes.controlMessage.textContent = selectedTool
      ? control(id).action + ' selected. Choose the situation it belongs to.'
      : 'Selection cleared. Choose a control when you are ready.';
    if (selectedTool) cards[data.controls[activeControl].id].target.focus();
  }

  function placeTool(toolId, destinationId) {
    if (!control(toolId) || !control(destinationId)) return;
    var source = toolLocation(toolId);
    var previous = placements[destinationId];
    if (source && source.id === destinationId) {
      selectedTool = null;
      updateControls();
      nodes.controlMessage.textContent = 'This control is already placed here.';
      return;
    }
    if (source) {
      if (previous) placements[source.id] = previous;
      else delete placements[source.id];
    }
    placements[destinationId] = toolId;
    selectedTool = null;
    controlSubmitted = false;
    updateControls();
    nodes.controlMessage.textContent = control(toolId).action + ' placed at ' + control(destinationId).title + '.'
      + (source && previous ? ' The previous control moved to ' + source.title + '.' : '')
      + (!source && previous ? ' The previous control is available in the control rack.' : '');
    onChange();
  }

  function removeControl(id) {
    if (!placements[id]) return;
    var removed = placements[id];
    delete placements[id];
    if (selectedTool === removed) selectedTool = null;
    controlSubmitted = false;
    updateControls();
    nodes.controlMessage.textContent = 'Control removed from ' + control(id).title + '.';
    cards[id].target.focus();
    onChange();
  }

  function dragStart(event, id) {
    if (!control(id) || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(dragType, id);
    activeDragTool = id;
  }

  function endDrag() {
    activeDragTool = null;
    Object.keys(cards).forEach(function (id) {
      cards[id].node.classList.remove('drag-over');
    });
  }

  function isControlDrag(event) {
    return Boolean(control(activeDragTool) && event.dataTransfer
      && Array.prototype.indexOf.call(event.dataTransfer.types, dragType) !== -1);
  }

  function buildControls() {
    // Offset the rack order so matching requires reading the situations.
    var order = data.controls.length === 6 ? [3, 0, 5, 2, 1, 4] : data.controls.map(function (_, i) { return i; });
    var toolLabels = { h1: 'Reroute overhead', h2: 'Safer cleaner', h3: 'Dust control', h4: 'Physical barrier', h5: 'Sequence crews', h6: 'Task-matched PPE' };
    order.forEach(function (index) {
      var item = data.controls[index];
      var tool = button('work-tool');
      tool.setAttribute('data-tool', item.id);
      tool.setAttribute('aria-pressed', 'false');
      tool.draggable = true;
      tool.appendChild(element('span', 'work-tool-label', toolLabels[item.id] || item.action));
      var state = element('span', 'work-tool-state');
      tool.appendChild(state);
      tool.addEventListener('click', function () { chooseTool(item.id); });
      tool.addEventListener('dragstart', function (event) { dragStart(event, item.id); });
      tool.addEventListener('dragend', endDrag);
      tools[item.id] = { button: tool, state: state };
      nodes.controlTools.appendChild(tool);
    });
    data.controls.forEach(function (item) {
      var card = element('article', 'work-card');
      card.setAttribute('data-control-card', item.id);
      var art = element('img', 'control-art');
      art.src = item.art;
      art.alt = '';
      art.width = 480;
      art.height = 300;
      card.appendChild(art);
      var title = element('h3', 'work-title', item.title);
      title.tabIndex = -1;
      card.appendChild(title);
      var scenario = element('p', 'work-scenario', item.scenario);
      scenario.id = 'control-scenario-' + item.id;
      card.appendChild(scenario);
      var target = button('placement-target');
      target.setAttribute('data-place', item.id);
      target.setAttribute('aria-label', 'Place control at ' + item.title);
      target.setAttribute('aria-describedby', scenario.id + ' control-placement-' + item.id);
      var label = element('span', 'placed-control');
      label.id = 'control-placement-' + item.id;
      target.appendChild(label);
      target.addEventListener('click', function () {
        if (selectedTool) placeTool(selectedTool, item.id);
        else if (placements[item.id]) chooseTool(placements[item.id]);
        else {
          toggleToolkit(true);
          nodes.controlMessage.textContent = 'Choose a control from the rack, then place it at ' + item.title + '.';
          tools[data.controls[order[0]].id].button.focus();
        }
      });
      target.addEventListener('dragstart', function (event) { dragStart(event, placements[item.id]); });
      target.addEventListener('dragend', endDrag);
      card.addEventListener('dragenter', function (event) {
        if (isControlDrag(event)) card.classList.add('drag-over');
      });
      card.addEventListener('dragover', function (event) {
        if (isControlDrag(event)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
          card.classList.add('drag-over');
        }
      });
      card.addEventListener('dragleave', function (event) {
        if (!event.relatedTarget || !card.contains(event.relatedTarget)) card.classList.remove('drag-over');
      });
      card.addEventListener('drop', function (event) {
        if (!isControlDrag(event)) {
          endDrag();
          return;
        }
        var id = event.dataTransfer.getData(dragType);
        var valid = control(id) && id === activeDragTool;
        endDrag();
        if (!valid) return;
        event.preventDefault();
        placeTool(id, item.id);
        target.focus();
      });
      card.appendChild(target);
      var remove = button('placement-remove', 'Remove placement');
      remove.setAttribute('data-remove', item.id);
      remove.addEventListener('click', function () { removeControl(item.id); });
      card.appendChild(remove);
      var explanation = element('details', 'control-explanation');
      var summary = element('summary', '', 'Why this control works');
      explanation.appendChild(summary);
      var feedback = element('p', 'control-feedback');
      explanation.appendChild(feedback);
      card.appendChild(explanation);
      var option = element('option', '', item.title);
      option.value = item.id;
      nodes.controlLocation.appendChild(option);
      cards[item.id] = { node: card, title: title, option: option, target: target, label: label, remove: remove, feedback: feedback, explanation: explanation, summary: summary };
      nodes.controlBoard.appendChild(card);
    });
    nodes.controlLocation.addEventListener('change', function () {
      showControl(data.controls.findIndex(function (item) { return item.id === nodes.controlLocation.value; }), false);
    });
    nodes.controlPicker.addEventListener('click', function () { toggleToolkit(!toolkitOpen); });
    nodes.controlPrev.addEventListener('click', function () { showControl(activeControl - 1, true); });
    nodes.controlNext.addEventListener('click', function () { showControl(activeControl + 1, true); });
    nodes.controlCheck.addEventListener('click', function () {
      var missing = data.controls.length - controlCount();
      if (missing) {
        nodes.controlMessage.classList.add('is-notice');
        nodes.controlMessage.textContent = 'Place a control at every situation before checking. ' + missing + (missing === 1 ? ' situation still needs a control.' : ' situations still need controls.');
        return;
      }
      controlSubmitted = true;
      updateControls();
      nodes.controlMessage.classList.add('is-notice');
      nodes.controlMessage.textContent = controlRight() === data.controls.length
        ? 'All six controls matched. Open an explanation to see why.'
        : 'Revisit the marked placements, then review your plan again.';
      onChange();
    });
    nodes.controlReset.addEventListener('click', function () {
      resetControls();
      onChange();
    });
  }

  function updateAudit() {
    var visited = 0;
    var marked = 0;
    data.findings.forEach(function (item) {
      var location = locations[item.id];
      var seen = Boolean(inspected[item.id]);
      var held = Boolean(holds[item.id]);
      if (seen) visited += 1;
      if (held) marked += 1;
      location.button.setAttribute('data-inspected', seen ? 'true' : 'false');
      location.button.setAttribute('data-hold', held ? 'true' : 'false');
      location.button.setAttribute('aria-expanded', selectedFinding === item.id ? 'true' : 'false');
      location.button.classList.toggle('selected', selectedFinding === item.id);
      location.button.classList.toggle('inspected', seen);
      location.button.classList.toggle('hold', held);
      location.button.classList.toggle('correct', auditSubmitted && held === item.hold);
      location.button.classList.toggle('needs-review', auditSubmitted && held !== item.hold);
      location.state.textContent = (seen ? 'Inspected' : 'Inspect this location') + (held ? ' · Hold marked' : '');
    });
    nodes.sgScore.textContent = auditSubmitted
      ? auditRight() + ' of ' + data.findings.length + ' decisions supported.'
      : 'Inspected ' + visited + ' of ' + data.findings.length + '. ' + marked + ' holds.';
    nodes.auditResults.hidden = !auditSubmitted;
  }

  function renderFinding() {
    nodes.auditDetail.replaceChildren();
    if (!selectedFinding) {
      nodes.auditDetail.appendChild(element('p', 'audit-empty', 'Open a location to inspect the evidence. Place a hold marker wherever work needs to stop.'));
      return;
    }
    var item = finding(selectedFinding);
    var title = element('h3', 'audit-evidence-title', item.title);
    title.tabIndex = -1;
    nodes.auditDetail.appendChild(title);
    var evidence = element('p', 'audit-evidence', item.description);
    evidence.id = 'audit-evidence-copy';
    nodes.auditDetail.appendChild(evidence);
    var flag = button('audit-flag', holds[item.id] ? 'Remove hold marker' : 'Place hold marker');
    flag.id = 'audit-flag';
    flag.setAttribute('aria-pressed', holds[item.id] ? 'true' : 'false');
    flag.setAttribute('aria-describedby', evidence.id);
    flag.addEventListener('click', function () {
      holds[item.id] = !holds[item.id];
      auditSubmitted = false;
      nodes.auditResults.replaceChildren();
      flag.textContent = holds[item.id] ? 'Remove hold marker' : 'Place hold marker';
      flag.setAttribute('aria-pressed', holds[item.id] ? 'true' : 'false');
      updateAudit();
      nodes.auditMessage.textContent = item.title + (holds[item.id] ? ': hold marker placed.' : ': hold marker removed.');
      onChange();
    });
    nodes.auditDetail.appendChild(flag);
    var back = button('btn-ghost audit-back', 'Return to locations');
    back.id = 'audit-back';
    back.addEventListener('click', function () {
      locations[item.id].button.focus();
    });
    nodes.auditDetail.appendChild(back);
  }

  function buildAudit() {
    data.findings.forEach(function (item) {
      var location = button('audit-location');
      location.setAttribute('data-finding', item.id);
      location.setAttribute('aria-controls', 'audit-detail');
      var art = element('img', 'control-art audit-art');
      art.src = item.art;
      art.alt = '';
      art.width = 480;
      art.height = 300;
      location.appendChild(art);
      location.appendChild(element('span', 'audit-location-title', item.title));
      var state = element('span', 'audit-location-state');
      location.appendChild(state);
      location.addEventListener('click', function () {
        var firstInspection = !inspected[item.id];
        inspected[item.id] = true;
        selectedFinding = item.id;
        renderFinding();
        updateAudit();
        nodes.auditMessage.textContent = item.title + ' evidence opened.';
        nodes.auditDetail.querySelector('.audit-evidence-title').focus();
        if (firstInspection) onChange();
      });
      locations[item.id] = { button: location, state: state };
      nodes.auditBoard.appendChild(location);
    });
    nodes.auditCheck.addEventListener('click', function () {
      var remaining = data.findings.filter(function (item) { return !inspected[item.id]; }).length;
      if (remaining) {
        nodes.auditMessage.textContent = 'Inspect every location before checking. ' + remaining + (remaining === 1 ? ' location remains.' : ' locations remain.');
        return;
      }
      auditSubmitted = true;
      nodes.auditResults.replaceChildren();
      data.findings.forEach(function (item) {
        var correct = Boolean(holds[item.id]) === item.hold;
        var result = element('details', 'audit-result ' + (correct ? 'correct' : 'needs-review'));
        result.setAttribute('data-result', item.id);
        result.appendChild(element('summary', '', (correct ? 'Supported: ' : 'Revisit: ') + item.title));
        result.appendChild(element('p', '', item.feedback));
        nodes.auditResults.appendChild(result);
      });
      updateAudit();
      nodes.auditMessage.textContent = auditRight() === data.findings.length
        ? 'All eight decisions supported. Your hold markers identify the locations that need intervention.'
        : 'Review the evidence for the locations marked Revisit, adjust your hold markers, then check again.';
      onChange();
    });
    nodes.auditReset.addEventListener('click', function () {
      resetAudit();
      onChange();
    });
  }

  function resetControls() {
    endDrag();
    toggleToolkit(false);
    activeControl = 0;
    selectedTool = null;
    placements = Object.create(null);
    controlSubmitted = false;
    Object.keys(cards).forEach(function (id) { cards[id].explanation.open = false; });
    updateControls();
    nodes.controlMessage.textContent = '';
  }

  function resetAudit() {
    inspected = Object.create(null);
    holds = Object.create(null);
    selectedFinding = null;
    auditSubmitted = false;
    nodes.auditResults.replaceChildren();
    renderFinding();
    updateAudit();
    nodes.auditMessage.textContent = 'Inspect all eight locations. Mark any location where work must be held.';
  }

  window.safetyActivities = {
    init: function (callback) {
      if (initialized) return;
      data = window.safetyActivityData;
      onChange = typeof callback === 'function' ? callback : function () {};
      nodes = {};
      var ids = {
        controlTools: 'control-tools', controlBoard: 'control-board', controlCheck: 'control-check',
        controlReset: 'control-reset', controlMessage: 'control-message', hocScore: 'hoc-score',
        controlLocation: 'control-location', controlPrev: 'control-prev', controlNext: 'control-next',
        controlPicker: 'control-picker', workbenchStage: 'workbench-stage',
        auditBoard: 'audit-board', auditDetail: 'audit-detail', auditCheck: 'audit-check',
        auditReset: 'audit-reset', auditMessage: 'audit-message', sgScore: 'sg-score', auditResults: 'audit-results'
      };
      Object.keys(ids).forEach(function (key) { nodes[key] = document.getElementById(ids[key]); });
      buildControls();
      buildAudit();
      initialized = true;
      resetControls();
      resetAudit();
    },
    tally: function (keys) {
      var score = { answered: 0, right: 0, total: keys.length };
      if (!initialized) return score;
      keys.forEach(function (key) {
        if (control(key) && controlSubmitted) {
          score.answered += 1;
          if (placements[key] === key) score.right += 1;
        } else if (finding(key) && auditSubmitted) {
          score.answered += 1;
          if (Boolean(holds[key]) === finding(key).hold) score.right += 1;
        }
      });
      return score;
    },
    reset: function () {
      if (!initialized) return;
      resetControls();
      resetAudit();
      onChange();
    }
  };
}());
