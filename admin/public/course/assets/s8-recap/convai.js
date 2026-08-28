/* ============================================================
   Claude Code Course - On-page Assistant  (convai.js)

   A brand-matched help bubble pinned to the bottom-right of every
   lesson. It answers questions about the page the learner is on, by
   voice or text.

   HOW IT IS POWERED
   - VOICE: ElevenLabs Conversational AI. The browser opens a WebSocket
     straight to ElevenLabs using a short-lived SIGNED URL that your
     Cloudflare Worker mints (kind:"convai_url"). The ElevenLabs key
     never reaches the page; it lives as a Worker Secret.
   - TEXT: the same ElevenLabs agent when the socket is up. If the agent
     is not configured yet, or the socket cannot open, typed questions
     are answered by the Anthropic tutor on the same Worker (kind:"chat")
     so the text helper works the moment the Worker is live.

   NO KEYS LIVE HERE. Only the Worker URL, which is safe to expose.

   PER-PAGE CONTEXT
   Each section sets  window.CC_ASSIST_CONTEXT = "Lesson ... what the
   learner is doing"  before this file loads. That string is sent to the
   agent (contextual_update over the socket, and the context field on the
   text endpoint) so answers are about the right screen.

   CONFIG below: flip CONVAI.enabled off to hide the bubble. Set
   voiceFallbackUrl to your agent's public talk page if you want a
   "open voice in a new tab" button when an embed blocks the microphone.
   ============================================================ */
(function (global) {
  "use strict";

  var CONVAI = {
    enabled: true,
    workerUrl: "https://cc-course-proxy.tgqhg6kf4g.workers.dev",
    voice: true,             // allow the microphone / live voice
    textFallback: true,      // answer typed questions via the Anthropic tutor if ElevenLabs is not reachable
    voiceFallbackUrl: "",    // optional: a public ElevenLabs talk page, opened in a new tab if the mic is blocked
    title: "Course assistant"
  };

  if (!CONVAI.enabled) return;

  var WS_BASE_NONE = 0, WS_CONNECTING = 1, WS_OPEN = 2, WS_FAILED = 3, WS_UNCONFIGURED = 4;

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var reduceMotion = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* read optional personalization from the terminal engine if present */
  function learnerName() {
    try { return (global.CCTerminal && CCTerminal.getName && CCTerminal.getName()) || ""; } catch (e) { return ""; }
  }
  function learnerRole() {
    try { return (global.CCTerminal && CCTerminal.getRole && CCTerminal.getRole()) || ""; } catch (e) { return ""; }
  }
  function firstName() {
    var n = (learnerName() || "").trim();
    return n ? n.split(/\s+/)[0] : "";
  }
  function pageContext() {
    var c = global.CC_ASSIST_CONTEXT;
    if (typeof c === "string" && c.trim()) return c.trim();
    return (document.title || "this lesson").replace(/\s*\|\s*.*$/, "").trim();
  }
  function pageLabel() {
    var t = (document.title || "").replace(/^Claude Code Course\s*[-:]\s*/i, "").trim();
    return t || "this lesson";
  }

  /* ---------- small audio helpers (PCM16 mono) ---------- */
  function b64FromBytes(u8) {
    var bin = "", chunk = 0x8000;
    for (var i = 0; i < u8.length; i += chunk) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
    }
    return global.btoa(bin);
  }
  function bytesFromB64(b64) {
    var bin = global.atob(b64), u = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  function downsample(f32, inRate, outRate) {
    if (inRate === outRate) return f32;
    var ratio = inRate / outRate;
    var newLen = Math.round(f32.length / ratio);
    var out = new Float32Array(newLen), pos = 0, idx = 0;
    while (idx < newLen) {
      var next = Math.round((idx + 1) * ratio), sum = 0, count = 0;
      for (var i = pos; i < next && i < f32.length; i++) { sum += f32[i]; count++; }
      out[idx] = count ? sum / count : 0;
      idx++; pos = next;
    }
    return out;
  }
  function pcm16FromF32(f32) {
    var out = new Int16Array(f32.length);
    for (var i = 0; i < f32.length; i++) {
      var s = Math.max(-1, Math.min(1, f32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return out;
  }
  function rateFromFormat(fmt) {
    var m = /pcm_(\d+)/.exec(fmt || "");
    return m ? parseInt(m[1], 10) : 16000;
  }

  function Assistant() {
    this.open = false;
    this.ws = null;
    this.wsState = WS_BASE_NONE;
    this.wsReady = null;        // promise while connecting
    this.initSent = false;
    this.pendingText = [];      // text queued until the socket is ready
    this.history = [];          // for the text fallback endpoint
    this.greeted = false;
    this.awaitingName = false;   // true while the bubble is asking who it is talking to

    // audio
    this.capCtx = null; this.micStream = null; this.capNode = null; this.capSource = null;
    this.capturing = false;
    this.playCtx = null; this.playSources = []; this.nextStart = 0;
    this.outRate = 16000; this.canPlay = true;
    this.audioOn = false;       // play agent audio (on while using voice)

    this._build();
  }

  Assistant.prototype._build = function () {
    var self = this;
    var root = el("div", "cc-assist");
    root.setAttribute("data-cc-assist", "1");

    // launcher
    var fab = el("button", "cc-assist__fab");
    fab.type = "button";
    fab.setAttribute("aria-label", "Open the course assistant");
    fab.innerHTML =
      '<span class="cc-assist__fab-ic" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 20l1.4-4.2A8.5 8.5 0 1 1 21 11.5z"></path>' +
        '</svg></span>' +
      '<span class="cc-assist__fab-label">Ask</span>';
    fab.addEventListener("click", function () { self.toggle(); });

    // panel
    var panel = el("div", "cc-assist__panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Course assistant");

    var head = el("div", "cc-assist__head");
    var title = el("div", "cc-assist__title", CONVAI.title);
    var close = el("button", "cc-assist__close");
    close.type = "button";
    close.setAttribute("aria-label", "Close the assistant");
    close.innerHTML = "&times;";
    close.addEventListener("click", function () { self.hide(); });
    head.appendChild(title);
    head.appendChild(close);

    var log = el("div", "cc-assist__log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");

    var status = el("div", "cc-assist__status");
    status.setAttribute("aria-live", "polite");

    var foot = el("form", "cc-assist__foot");
    foot.setAttribute("autocomplete", "off");
    var input = el("input", "cc-assist__input");
    input.type = "text";
    input.placeholder = "Ask about this page";
    input.setAttribute("aria-label", "Type your question");
    var mic = el("button", "cc-assist__mic");
    mic.type = "button";
    mic.setAttribute("aria-label", "Talk to the assistant");
    mic.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>' +
        '<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><path d="M12 19v4"></path>' +
      '</svg>';
    var send = el("button", "cc-assist__send");
    send.type = "submit";
    send.setAttribute("aria-label", "Send");
    send.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M22 2 11 13"></path><path d="M22 2 15 22l-4-9-9-4 20-7z"></path>' +
      '</svg>';
    if (!CONVAI.voice) mic.style.display = "none";

    foot.appendChild(mic);
    foot.appendChild(input);
    foot.appendChild(send);

    foot.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = "";
      self.sendText(v);
    });
    mic.addEventListener("click", function () { self.toggleVoice(); });

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(status);
    panel.appendChild(foot);

    root.appendChild(panel);
    root.appendChild(fab);
    (document.body || document.documentElement).appendChild(root);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && self.open) self.hide();
    });

    this.root = root; this.fab = fab; this.panel = panel;
    this.log = log; this.input = input; this.mic = mic; this.statusEl = status;
  };

  Assistant.prototype.toggle = function () { this.open ? this.hide() : this.show(); };

  Assistant.prototype.show = function () {
    this.open = true;
    this.root.classList.add("cc-assist--open");
    this.fab.setAttribute("aria-expanded", "true");
    if (!this.greeted) {
      this.greeted = true;
      var fn = firstName();
      if (fn) {
        this._bot("Hi " + fn + ". Ask me anything about this page. You can type, or tap the mic to talk.");
      } else {
        // No name known yet (the learner skipped the welcome). Ask first, so the
        // assistant always knows who it is talking to and the agent is personalized.
        this.awaitingName = true;
        this.input.placeholder = "Type your first name";
        this._bot("Hi. Before we start, what should I call you?");
      }
    }
    var self = this;
    setTimeout(function () { self.input.focus(); }, reduceMotion ? 0 : 120);
  };

  Assistant.prototype.hide = function () {
    this.open = false;
    this.root.classList.remove("cc-assist--open");
    this.fab.setAttribute("aria-expanded", "false");
    this.fab.focus();
    if (this.capturing) this._stopMic();
  };

  /* ---------- transcript ---------- */
  Assistant.prototype._row = function (cls, text) {
    var row = el("div", "cc-assist__msg " + cls);
    row.innerHTML = esc(text).replace(/\n/g, "<br>");
    this.log.appendChild(row);
    this.log.scrollTop = this.log.scrollHeight;
    return row;
  };
  Assistant.prototype._user = function (t) { this.history.push({ role: "user", text: t }); return this._row("cc-assist__msg--user", t); };
  Assistant.prototype._bot = function (t) { this.history.push({ role: "assistant", text: t }); return this._row("cc-assist__msg--bot", t); };
  Assistant.prototype._sys = function (t) { return this._row("cc-assist__msg--sys", t); };
  Assistant.prototype._status = function (t) { this.statusEl.textContent = t || ""; };

  /* a streaming-ish bot row that we append to as agent_response chunks land */
  Assistant.prototype._botLive = function () {
    var row = el("div", "cc-assist__msg cc-assist__msg--bot");
    this.log.appendChild(row);
    this.log.scrollTop = this.log.scrollHeight;
    this._live = { row: row, text: "" };
    return row;
  };
  Assistant.prototype._botLiveSet = function (t) {
    if (!this._live) this._botLive();
    this._live.text = t;
    this._live.row.innerHTML = esc(t).replace(/\n/g, "<br>");
    this.log.scrollTop = this.log.scrollHeight;
  };
  Assistant.prototype._botLiveEnd = function () {
    if (this._live) { this.history.push({ role: "assistant", text: this._live.text }); this._live = null; }
  };

  /* pull a first name out of whatever they typed, save it everywhere, then greet */
  Assistant.prototype._captureName = function (raw) {
    this.awaitingName = false;
    this.input.placeholder = "Ask about this page";
    var t = String(raw || "").trim();
    t = t.replace(/^(hi|hello|hey)[,!.\s]+/i, "");
    t = t.replace(/^(my name is|i am|i'm|im|it is|it's|its|call me|this is|name is|name's)\s+/i, "");
    var nm = t.replace(/[^A-Za-z'\-\s]/g, "").trim().split(/\s+/)[0] || "";
    nm = nm.slice(0, 40);
    if (nm) {
      try { if (global.CCTerminal && CCTerminal.setName) CCTerminal.setName(nm); } catch (e) {}
      this._sendContext();   // refresh the agent's context now that we know the name
      this._bot("Thanks, " + (firstName() || nm) + ". Now, what would you like to know about this page?");
    } else {
      this._bot("No problem. Ask me anything about this page, by voice or text.");
    }
  };

  /* ---------- text ---------- */
  Assistant.prototype.sendText = function (text) {
    // If we are waiting to learn the learner's name, treat this entry as the name
    // (save it for every page and the agent), not as a question to the agent.
    if (this.awaitingName) {
      this._user(text);
      this._captureName(text);
      return;
    }
    this._user(text);
    var self = this;
    // if a live socket is up, treat the typed line as a spoken turn
    if (this.wsState === WS_OPEN && this.ws) {
      try {
        this.ws.send(JSON.stringify({ type: "user_message", text: text }));
        return;
      } catch (e) { /* fall through to connect/fallback */ }
    }
    // try to bring the ElevenLabs socket up (text mode, no mic), else fall back
    this.ensureSocket(false).then(function (ok) {
      if (ok && self.ws && self.wsState === WS_OPEN) {
        try { self.ws.send(JSON.stringify({ type: "user_message", text: text })); return; }
        catch (e) {}
      }
      self._fallbackChat(text);
    });
  };

  Assistant.prototype._fallbackChat = function (text) {
    if (!CONVAI.textFallback || !CONVAI.workerUrl) {
      this._sys("The assistant is not available right now. Please try again in a moment.");
      return;
    }
    var self = this;
    this._status("thinking");
    var body = {
      kind: "chat",
      prompt: text,
      name: learnerName() || undefined,
      role: learnerRole() || undefined,
      context: pageContext(),
      history: this.history.slice(-8)
    };
    fetch(CONVAI.workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (d) {
      self._status("");
      if (d && d.ok && d.text) self._bot(d.text);
      else self._sys("I could not reach the assistant just now. Please try again.");
    }).catch(function () {
      self._status("");
      self._sys("I could not reach the assistant just now. Check your connection and try again.");
    });
  };

  /* ---------- ElevenLabs socket ---------- */
  Assistant.prototype.ensureSocket = function (wantMic) {
    var self = this;
    if (this.wsState === WS_OPEN) return Promise.resolve(true);
    if (this.wsState === WS_UNCONFIGURED) return Promise.resolve(false);
    if (this.wsReady) return this.wsReady;

    this.wsState = WS_CONNECTING;
    this._status("connecting");
    this.wsReady = fetch(CONVAI.workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "convai_url" })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok || !d.signedUrl) {
        self.wsState = (d && d.reason === "not_configured") ? WS_UNCONFIGURED : WS_FAILED;
        self.wsReady = null;
        self._status("");
        return false;
      }
      return self._openSocket(d.signedUrl);
    }).catch(function () {
      self.wsState = WS_FAILED; self.wsReady = null; self._status("");
      return false;
    });
    return this.wsReady;
  };

  Assistant.prototype._openSocket = function (url) {
    var self = this;
    return new Promise(function (resolve) {
      var ws;
      try { ws = new WebSocket(url); } catch (e) { self.wsState = WS_FAILED; self.wsReady = null; resolve(false); return; }
      self.ws = ws;
      var settled = false;
      var guard = setTimeout(function () { if (!settled) { settled = true; self.wsState = WS_FAILED; self.wsReady = null; resolve(false); try { ws.close(); } catch (e) {} } }, 8000);

      ws.onopen = function () {
        self.initSent = false;
        // initiation: pass name + page so the agent can greet in context
        try {
          ws.send(JSON.stringify({
            type: "conversation_initiation_client_data",
            dynamic_variables: { learner_name: firstName() || "there", page: pageLabel() }
          }));
          self.initSent = true;
        } catch (e) {}
      };

      ws.onmessage = function (ev) {
        var msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
        self._onWsMessage(msg, function () {
          if (!settled) { settled = true; clearTimeout(guard); self.wsState = WS_OPEN; self.wsReady = null; self._status(""); resolve(true); }
        });
      };

      ws.onerror = function () { /* close handler resolves state */ };
      ws.onclose = function () {
        if (!settled) { settled = true; clearTimeout(guard); self.wsState = WS_FAILED; self.wsReady = null; resolve(false); }
        else { self.wsState = WS_BASE_NONE; }
        self.ws = null;
        if (self.capturing) self._stopMic();
        self._botLiveEnd();
      };
    });
  };

  Assistant.prototype._onWsMessage = function (msg, markOpen) {
    var t = msg && msg.type;
    if (t === "conversation_initiation_metadata") {
      var m = msg.conversation_initiation_metadata_event || {};
      this.outRate = rateFromFormat(m.agent_output_audio_format);
      this.canPlay = /pcm_/.test(m.agent_output_audio_format || "pcm_16000");
      markOpen();
      // tell the agent which screen the learner is on
      this._sendContext();
      // flush any queued text
      var q = this.pendingText; this.pendingText = [];
      for (var i = 0; i < q.length; i++) { try { this.ws.send(JSON.stringify({ type: "user_message", text: q[i] })); } catch (e) {} }
      return;
    }
    if (t === "ping") {
      var id = msg.ping_event && msg.ping_event.event_id;
      var ms = (msg.ping_event && msg.ping_event.ping_ms) || 0;
      var self = this;
      setTimeout(function () { try { self.ws.send(JSON.stringify({ type: "pong", event_id: id })); } catch (e) {} }, ms);
      return;
    }
    if (t === "user_transcript") {
      var ut = msg.user_transcription_event && msg.user_transcription_event.user_transcript;
      if (ut) this._row("cc-assist__msg--user", ut);
      return;
    }
    if (t === "agent_response") {
      var ar = msg.agent_response_event && msg.agent_response_event.agent_response;
      if (ar) { this._botLiveSet(ar); this._botLiveEnd(); }
      return;
    }
    if (t === "audio") {
      var b64 = msg.audio_event && msg.audio_event.audio_base_64;
      if (b64 && this.audioOn && this.canPlay) this._play(b64);
      return;
    }
    if (t === "interruption") {
      this._stopPlayback();
      return;
    }
  };

  Assistant.prototype._sendContext = function () {
    if (!this.ws || this.wsState === WS_UNCONFIGURED) return;
    var ctx = pageContext();
    var who = firstName() ? (" The learner's name is " + firstName() + ".") : "";
    var role = learnerRole() ? (" Their role is " + learnerRole() + ".") : "";
    try {
      this.ws.send(JSON.stringify({
        type: "contextual_update",
        text: "The learner is on this course page: " + ctx + who + role
      }));
    } catch (e) {}
  };

  /* ---------- voice ---------- */
  Assistant.prototype.toggleVoice = function () {
    if (this.capturing) { this._stopMic(); return; }
    if (this.awaitingName) {
      this._sys("First, type your name above so I know who I am talking to. Then tap the mic.");
      var self = this; setTimeout(function () { self.input.focus(); }, 30);
      return;
    }
    this._startVoice();
  };

  Assistant.prototype._startVoice = function () {
    var self = this;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this._voiceBlocked("This browser does not allow microphone access here.");
      return;
    }
    this._status("starting microphone");
    this.audioOn = true;
    this.ensureSocket(true).then(function (ok) {
      if (!ok) {
        self.audioOn = false;
        if (self.wsState === WS_UNCONFIGURED) {
          self._sys("Voice is being set up. You can type your question for now.");
        } else {
          self._sys("I could not start a voice session. You can type your question instead.");
        }
        self._status("");
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
        .then(function (stream) { self._beginCapture(stream); })
        .catch(function (err) {
          self.audioOn = false;
          self._voiceBlocked(self._micErrorText(err));
        });
    });
  };

  Assistant.prototype._micErrorText = function (err) {
    var n = err && err.name;
    if (n === "NotAllowedError" || n === "SecurityError") return "The microphone is blocked on this page.";
    if (n === "NotFoundError") return "No microphone was found.";
    return "The microphone could not be started here.";
  };

  Assistant.prototype._voiceBlocked = function (why) {
    this._status("");
    if (CONVAI.voiceFallbackUrl) {
      var row = el("div", "cc-assist__msg cc-assist__msg--sys");
      row.innerHTML = esc(why) + ' <a class="cc-assist__link" href="' + esc(CONVAI.voiceFallbackUrl) +
        '" target="_blank" rel="noopener">Open voice chat in a new tab</a>. Text still works here.';
      this.log.appendChild(row);
      this.log.scrollTop = this.log.scrollHeight;
    } else {
      this._sys(why + " You can type your question instead.");
    }
  };

  Assistant.prototype._beginCapture = function (stream) {
    var self = this;
    this.micStream = stream;
    var Ctx = global.AudioContext || global.webkitAudioContext;
    this.capCtx = new Ctx();
    var inRate = this.capCtx.sampleRate;
    this.capSource = this.capCtx.createMediaStreamSource(stream);
    var node = this.capCtx.createScriptProcessor ? this.capCtx.createScriptProcessor(4096, 1, 1) : null;
    if (!node) { this._voiceBlocked("Live audio is not supported in this browser."); this._stopMic(); return; }
    this.capNode = node;
    node.onaudioprocess = function (e) {
      if (!self.capturing || !self.ws || self.wsState !== WS_OPEN) return;
      var f32 = e.inputBuffer.getChannelData(0);
      var ds = downsample(f32, inRate, 16000);
      var pcm = pcm16FromF32(ds);
      var u8 = new Uint8Array(pcm.buffer);
      try { self.ws.send(JSON.stringify({ user_audio_chunk: b64FromBytes(u8) })); } catch (err) {}
    };
    this.capSource.connect(node);
    node.connect(this.capCtx.destination);
    this.capturing = true;
    this.mic.classList.add("is-on");
    this.root.classList.add("cc-assist--listening");
    this._status("listening. tap the mic to stop.");
  };

  Assistant.prototype._stopMic = function () {
    this.capturing = false;
    this.mic.classList.remove("is-on");
    this.root.classList.remove("cc-assist--listening");
    this._status("");
    try { if (this.capNode) { this.capNode.disconnect(); this.capNode.onaudioprocess = null; } } catch (e) {}
    try { if (this.capSource) this.capSource.disconnect(); } catch (e) {}
    try { if (this.micStream) this.micStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { if (this.capCtx) this.capCtx.close(); } catch (e) {}
    this.capNode = null; this.capSource = null; this.micStream = null; this.capCtx = null;
  };

  /* ---------- playback ---------- */
  Assistant.prototype._playContext = function () {
    if (!this.playCtx) {
      var Ctx = global.AudioContext || global.webkitAudioContext;
      this.playCtx = new Ctx();
      this.nextStart = 0;
    }
    return this.playCtx;
  };
  Assistant.prototype._play = function (b64) {
    try {
      var u8 = bytesFromB64(b64);
      var len = Math.floor(u8.byteLength / 2);
      var i16 = new Int16Array(u8.buffer, u8.byteOffset, len);
      var f32 = new Float32Array(len);
      for (var i = 0; i < len; i++) f32[i] = i16[i] / 0x8000;
      var ctx = this._playContext();
      var buf = ctx.createBuffer(1, len, this.outRate);
      buf.copyToChannel(f32, 0);
      var src = ctx.createBufferSource();
      src.buffer = buf; src.connect(ctx.destination);
      var t = Math.max(ctx.currentTime, this.nextStart);
      src.start(t);
      this.nextStart = t + buf.duration;
      this.playSources.push(src);
      var self = this;
      src.onended = function () {
        var k = self.playSources.indexOf(src);
        if (k >= 0) self.playSources.splice(k, 1);
      };
    } catch (e) { /* ignore a bad chunk */ }
  };
  Assistant.prototype._stopPlayback = function () {
    for (var i = 0; i < this.playSources.length; i++) { try { this.playSources[i].stop(); } catch (e) {} }
    this.playSources = [];
    if (this.playCtx) this.nextStart = this.playCtx.currentTime;
  };

  /* a slim one-time notice at the top of the lesson so learners notice the
     bubble. Dismiss is remembered across the course (localStorage). */
  function injectNotice() {
    try { if (global.localStorage && localStorage.getItem("cc_assist_hint") === "off") return; } catch (e) {}
    var host = document.querySelector(".cc-root") || document.body;
    if (!host || host.querySelector(".cc-assist-note")) return;

    var note = el("div", "cc-assist-note");
    var btn = el("button", "cc-assist-note__open");
    btn.type = "button";
    btn.innerHTML =
      '<span class="cc-assist-note__ic" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 20l1.4-4.2A8.5 8.5 0 1 1 21 11.5z"></path>' +
        '</svg></span>' +
      '<span class="cc-assist-note__tx">Questions about this page? <b>Ask the assistant</b>, by voice or text.</span>';
    btn.addEventListener("click", function () {
      if (global.__ccAssist) global.__ccAssist.show();
    });

    var x = el("button", "cc-assist-note__x");
    x.type = "button";
    x.setAttribute("aria-label", "Dismiss this tip");
    x.innerHTML = "&times;";
    x.addEventListener("click", function () {
      note.parentNode && note.parentNode.removeChild(note);
      try { if (global.localStorage) localStorage.setItem("cc_assist_hint", "off"); } catch (e) {}
    });

    note.appendChild(btn);
    note.appendChild(x);
    host.insertBefore(note, host.firstChild);
  }

  function boot() {
    if (global.__ccAssist) return;
    if (!CONVAI.workerUrl) return; // nothing to talk to
    global.__ccAssist = new Assistant();
    injectNotice();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  global.CCAssist = { config: CONVAI };
})(typeof window !== "undefined" ? window : this);
