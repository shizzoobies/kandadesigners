/* =========================================================
   chat.js — Web version for kandadesigners.com
   Calls /api/planner (Cloudflare Pages Function)
   ========================================================= */

const MAX_HISTORY = 20;

let conversationHistory = [];
let pendingEvents = null;
let isSending = false;

/* ---- DOM refs ------------------------------------------ */

const chatMessages  = document.getElementById('chat-messages');
const chatInput     = document.getElementById('chat-input');
const sendBtn       = document.getElementById('send-btn');
const pendingBar    = document.getElementById('pending-bar');
const pendingText   = document.getElementById('pending-text');
const pendingAdd    = document.getElementById('pending-add');
const pendingCancel = document.getElementById('pending-cancel');

/* ---- Chat UI helpers ----------------------------------- */

function addBubble(role, content) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  const inner = document.createElement('div');
  inner.className = 'bubble-content';
  inner.textContent = content;
  bubble.appendChild(inner);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function addLoadingBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble assistant';
  bubble.id = 'loading-bubble';
  bubble.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function removeLoadingBubble() {
  const el = document.getElementById('loading-bubble');
  if (el) el.remove();
}

/* ---- Send message -------------------------------------- */

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isSending) return;

  chatInput.value = '';
  chatInput.style.height = 'auto';
  addBubble('user', text);

  conversationHistory.push({ role: 'user', content: text });

  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory = conversationHistory.slice(-MAX_HISTORY);
  }

  isSending = true;
  sendBtn.disabled = true;
  addLoadingBubble();

  try {
    const weekContext = window.plannerState.getWeekContext();
    const resp = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversationHistory, weekContext }),
    });
    const result = await resp.json();

    removeLoadingBubble();
    isSending = false;
    sendBtn.disabled = false;

    if (!result.success) {
      addBubble('error', 'API error: ' + result.error);
      return;
    }

    const responseText = result.text;
    conversationHistory.push({ role: 'assistant', content: responseText });

    const actions = extractActionsFromResponse(responseText);
    const displayText = extractDisplayText(responseText);

    if (displayText) {
      addBubble('assistant', displayText);
    }

    if (actions) {
      const currentOffset = window.plannerState.weekOffset;

      if (actions.remove.length > 0) {
        const removeSpecs = validateRemoveSpecs(actions.remove, currentOffset);
        const removed = window.plannerState.removeEventsFromAI(removeSpecs);
        if (removed > 0) {
          addBubble('assistant', `Removed ${removed} event${removed !== 1 ? 's' : ''}.`);
        } else if (removeSpecs.length > 0) {
          addBubble('error', 'Could not find matching events to remove. Try being more specific.');
        }
      }

      if (actions.add.length > 0) {
        const { valid, errors } = validateAddEvents(actions.add, currentOffset);

        if (errors.length > 0) {
          addBubble('error', 'Some events had issues: ' + errors.join('; '));
        }

        if (valid.length > 0) {
          pendingEvents = valid;
          const hasNextWeek = valid.some(e => e.weekOffset !== currentOffset);
          let label = `Add ${valid.length} event${valid.length !== 1 ? 's' : ''}`;
          if (hasNextWeek) label += ' (includes next week)';
          label += ' to your calendar?';
          pendingText.textContent = label;
          pendingBar.style.display = '';
        }
      }
    } else if (!displayText) {
      addBubble('assistant', responseText);
    }
  } catch (e) {
    removeLoadingBubble();
    isSending = false;
    sendBtn.disabled = false;
    addBubble('error', 'Network error: ' + e.message);
  }

  chatInput.focus();
}

/* ---- Pending events bar -------------------------------- */

pendingAdd.addEventListener('click', () => {
  if (pendingEvents) {
    window.plannerState.addEventsFromAI(pendingEvents);
    addBubble('assistant', `Added ${pendingEvents.length} event${pendingEvents.length !== 1 ? 's' : ''} to your calendar.`);
    pendingEvents = null;
    pendingBar.style.display = 'none';
  }
});

pendingCancel.addEventListener('click', () => {
  pendingEvents = null;
  pendingBar.style.display = 'none';
  addBubble('assistant', 'Events discarded. Let me know if you\'d like to try again.');
});

/* ---- Input handling ------------------------------------ */

sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
});
