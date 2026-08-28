/* ============================================================
   Claude Code Course - Terminal Simulator Engine  (v1)
   Vanilla JS, no dependencies, no build step.
   Copied verbatim into every section folder so each Mighty
   embed is fully standalone.

   PUBLIC API
   ----------
   const term = new CCTerminal(mountEl, {
     os: "mac" | "windows",          // controls prompt + path rendering
     onComplete: () => {},           // fires when the script finishes
     onStep:    (i, step) => {},     // fires as each step starts
     workerUrl: null                 // optional: real generation endpoint
   });
   term.run(script);                 // script = ordered array of steps (below)

   STEP TYPES  (each item in the script array)
   -------------------------------------------
   { type:"output", lines:[ ... ], speed?:ms }
       Auto-streamed output. A "line" is a string OR a token object
       (see renderLine). No user action required.

   { type:"prompt",                       // learner must type a command
     accept:["claude","claude code"],     // correct commands (lowercased, trimmed)
     placeholder?:"type the command",
     onWrong?:{                           // optional custom wrong-answer handling
        "npm install": ["already installed ..."], // exact-match wrong cmds -> output
        "_default": ["command not found ..."]      // fallback for anything else
     },
     success:[ ...lines ],                // streamed after a correct command
     hint?:"press Enter to run"
   }

   { type:"claudePrompt",                 // the Claude Code ">" TUI input
     accept:"*",                          // "*" = accept any non-empty text
     parse?: (text) => ({...}),           // pull keywords out of learner text
     success:[ ...lines ],                // can be a function(parsed)=>lines
     toolCalls?:[ ... ]                   // animated ● Tool(args) lines
   }

   { type:"action", name:"oauth"|"preview"|custom, payload?:{} }
       Hands control to a host-registered handler:
       term.on("oauth", (payload, done) => { ...; done(); });

   { type:"pause", ms:600 }               // beat between steps

   LINE TOKENS (for output/success arrays)
   ---------------------------------------
   "plain string"                         -> default terminal text
   {t:"dim",   s:"..."}                   -> muted
   {t:"ok",    s:"..."}                   -> green
   {t:"err",   s:"..."}                   -> red
   {t:"warn",  s:"..."}                   -> yellow
   {t:"path",  s:"..."}                   -> blue
   {t:"tool",  s:"Read", arg:"app.js"}    -> ● Read(app.js)
   {t:"diff",  add:["+ line"], del:["- line"]}  -> colored diff block
   {t:"box",   title:"...", lines:[...]}  -> bordered welcome/info box
   {t:"spinner", s:"Working", ms:1400}    -> transient spinner, then removed
   ============================================================ */

(function (global) {
  "use strict";

  const PROMPTS = {
    mac:     { user: "alex@studio", path: "~/projects/demo", glyph: "%" },
    windows: { user: "alex@STUDIO", path: "C:\\projects\\demo", glyph: ">" }
  };

  const SEARCH_SVG = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="6.8" cy="6.8" r="4.5"/><line x1="10.2" y1="10.2" x2="14" y2="14"/></svg>';

  const reduceMotion =
    global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, txt) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, reduceMotion ? 0 : ms)); }

  class CCTerminal {
    constructor(mount, opts = {}) {
      this.mount = mount;
      this.os = opts.os === "windows" ? "windows" : "mac";
      this.onComplete = opts.onComplete || function () {};
      this.onStep = opts.onStep || function () {};
      this.workerUrl = opts.workerUrl || null;
      this.handlers = {};
      this.script = [];
      this.idx = 0;
      this._build();
    }

    on(name, fn) { this.handlers[name] = fn; return this; }

    _build() {
      const winOs = this.os === "windows";
      this.root = el("div", "cc-term cc-term--" + (winOs ? "win" : "mac"));
      const bar = el("div", "cc-term__bar");
      if (winOs) {
        // Windows PowerShell window: title on the left, window controls on the right
        const ctl = function (cls, inner) {
          return '<span class="cc-winctl__b' + (cls ? " " + cls : "") + '">' +
            '<svg viewBox="0 0 12 12" width="11" height="11" stroke="currentColor" stroke-width="1.2" fill="none">' + inner + '</svg></span>';
        };
        bar.innerHTML =
          '<span class="cc-term__title cc-term__title--win">Windows PowerShell</span>' +
          '<span class="cc-winctl" aria-hidden="true">' +
            ctl("", '<line x1="2" y1="9" x2="10" y2="9"/>') +
            ctl("", '<rect x="2.2" y="2.2" width="7.6" height="7.6" rx="0.5"/>') +
            ctl("cc-winctl__b--x", '<line x1="2.6" y1="2.6" x2="9.4" y2="9.4"/><line x1="9.4" y1="2.6" x2="2.6" y2="9.4"/>') +
          '</span>';
      } else {
        // macOS Terminal window: traffic-light dots on the left
        bar.innerHTML =
          '<span class="cc-term__dot"></span>' +
          '<span class="cc-term__dot"></span>' +
          '<span class="cc-term__dot"></span>' +
          '<span class="cc-term__title">claude-code  &middot;  zsh</span>';
      }
      this.body = el("div", "cc-term__body");
      this.body.setAttribute("role", "log");
      this.body.setAttribute("aria-live", "polite");
      this.body.setAttribute("aria-label", "Terminal output");
      this.root.appendChild(bar);
      this.root.appendChild(this.body);

      // Guidance "coach" callout. Lives ABOVE the terminal, outside the log,
      // so instructions read as a clear part of the course, not buried in grey.
      this.coach = el("div", "cc-coach cc-coach--empty");
      this.coach.setAttribute("role", "note");
      this.coach.setAttribute("aria-live", "polite");
      this.coach.setAttribute("aria-label", "What to do next");
      this.coach.innerHTML =
        '<span class="cc-coach__badge">Your turn</span>' +
        '<span class="cc-coach__text"></span>';

      // OS-specific "how to open your terminal" intro. Sits above the terminal
      // and shows the real way to open Terminal (Mac) or PowerShell (Windows).
      // Revealed by run() only in lessons where the learner types.
      this.openIntro = el("div", "cc-openintro cc-openintro--" + (winOs ? "win" : "mac"));
      this.openIntro.style.display = "none";
      this.openIntro.innerHTML = this._openIntroHtml(winOs);

      // a small "see it again" link, shown once the intro has been collapsed
      this.openIntroLink = el("button", "cc-openintro__reopen");
      this.openIntroLink.type = "button";
      this.openIntroLink.style.display = "none";
      this.openIntroLink.innerHTML =
        '<span class="cc-openintro__q">?</span><span>How do I open ' + (winOs ? "PowerShell" : "Terminal") + "?</span>";

      const showCard = () => { this.openIntro.style.display = ""; this.openIntroLink.style.display = "none"; };
      const showLink = () => { this.openIntro.style.display = "none"; this.openIntroLink.style.display = ""; };
      const gotIt = this.openIntro.querySelector(".cc-openintro__x");
      if (gotIt) gotIt.addEventListener("click", showLink);
      this.openIntroLink.addEventListener("click", showCard);

      this.mount.appendChild(this.openIntro);
      this.mount.appendChild(this.openIntroLink);
      this.mount.appendChild(this.coach);
      this.mount.appendChild(this.root);
    }

    _openIntroHtml(win) {
      const app = win ? "PowerShell" : "Terminal";
      const steps = win
        ? "<li>Press the <b>Windows</b> key, or click <b>Start</b>.</li>" +
          "<li>Type <b>powershell</b>.</li>" +
          "<li>Press <b>Enter</b> to open it.</li>"
        : "<li>Press <b>Command</b> and <b>Space</b> to open Spotlight.</li>" +
          "<li>Type <b>terminal</b>.</li>" +
          "<li>Press <b>Return</b> to open it.</li>";
      const query = win ? "powershell" : "terminal";
      const hitSub = win ? "App" : "Application";
      const demoMod = win ? "cc-openintro__demo--win" : "cc-openintro__demo--mac";
      return '<button class="cc-openintro__x" type="button">Got it</button>' +
        '<div class="cc-openintro__lead"><span class="cc-openintro__badge">In real life</span> Open ' + app + ' on your computer first.</div>' +
        '<div class="cc-openintro__row">' +
          '<ol class="cc-openintro__steps">' + steps + '</ol>' +
          '<div class="cc-openintro__demo ' + demoMod + '">' +
            '<div class="cc-osearch"><span class="cc-osearch__ic">' + SEARCH_SVG + '</span><span class="cc-osearch__q">' + query + '</span></div>' +
            '<div class="cc-osearch__hit"><span class="cc-osearch__hit-ic">&gt;_</span><span>' + app + '</span><span class="cc-osearch__hit-sub">' + hitSub + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="cc-openintro__note">In this sandbox you do not need to open anything. Just type below to practice.</div>';
    }

    /* ---------- guidance coach ---------- */
    _showHint(text) {
      if (!this.coach || text == null || text === "") return;
      const t = this.coach.querySelector(".cc-coach__text");
      if (t) t.textContent = text;
      this.coach.classList.remove("cc-coach--empty");
    }
    _clearHint() {
      if (!this.coach) return;
      this.coach.classList.add("cc-coach--empty");
      const t = this.coach.querySelector(".cc-coach__text");
      if (t) t.textContent = "";
    }

    /* friendly "Start here" pointer at the first typed input of a lesson, so a
       first-timer sees where to type. Removed the moment they click or type. */
    _maybeStartPointer(inputEl) {
      if (this._typedOnce) return;
      if (this._startPtr) { this._startPtr.remove(); this._startPtr = null; }
      const p = el("div", "cc-startptr");
      p.innerHTML = '<span class="cc-startptr__arr" aria-hidden="true">↑</span>' +
                    '<span class="cc-startptr__tx">Start here</span>';
      this.body.appendChild(p);
      this._startPtr = p;
      // shift the pill so its arrow sits under the actual caret (the input box),
      // not under the prompt prefix on the left.
      try {
        const ir = inputEl.getBoundingClientRect();
        const br = this.body.getBoundingClientRect();
        const padL = parseFloat(getComputedStyle(this.body).paddingLeft) || 0;
        let left = ir.left - br.left - padL;
        const cap = this.body.clientWidth - padL - 110;
        if (!(left > 0)) left = 0;
        if (cap > 0 && left > cap) left = cap;
        p.style.marginLeft = left + "px";
      } catch (e) {}
      const dismiss = () => this._dismissStartPointer();
      inputEl.addEventListener("pointerdown", dismiss);
      inputEl.addEventListener("keydown", dismiss);
    }
    _dismissStartPointer() {
      this._typedOnce = true;
      if (this._startPtr) { this._startPtr.remove(); this._startPtr = null; }
    }

    /* ---------- line rendering ---------- */
    _renderLine(line) {
      if (typeof line === "string") {
        const d = el("div", "cc-line", line === "" ? "\u00A0" : line);
        return d;
      }
      const t = line.t;
      if (t === "tool") {
        const d = el("div", "cc-line cc-line--tool");
        d.innerHTML =
          '<span class="cc-tool-dot">\u25CF</span> ' +
          '<span class="cc-tool-name">' + esc(line.s) + "</span>" +
          '<span class="cc-tool-paren">(</span>' +
          '<span class="cc-tool-arg">' + esc(line.arg || "") + "</span>" +
          '<span class="cc-tool-paren">)</span>';
        return d;
      }
      if (t === "diff") {
        const wrap = el("div", "cc-diff");
        (line.del || []).forEach(s => wrap.appendChild(el("div", "cc-diff__del", "- " + s)));
        (line.add || []).forEach(s => wrap.appendChild(el("div", "cc-diff__add", "+ " + s)));
        return wrap;
      }
      if (t === "box") {
        const box = el("div", "cc-box");
        if (line.title) box.appendChild(el("div", "cc-box__title", line.title));
        (line.lines || []).forEach(s => box.appendChild(el("div", "cc-box__line", s)));
        return box;
      }
      const map = { dim: "cc-line--dim", ok: "cc-line--ok", err: "cc-line--err",
                    warn: "cc-line--warn", path: "cc-line--path" };
      return el("div", "cc-line " + (map[t] || ""), line.s);
    }

    async _stream(lines, speed) {
      speed = speed || 18;
      for (const line of lines) {
        if (line && line.t === "spinner") { await this._spinner(line.s, line.ms || 1200); continue; }
        const node = this._renderLine(line);
        this.body.appendChild(node);
        this._scroll();
        await sleep(speed + Math.random() * 22);
      }
    }

    async _spinner(label, ms) {
      const frames = ["\u280B","\u2819","\u2839","\u2838","\u283C","\u2834","\u2826","\u2827","\u2807","\u280F"];
      const d = el("div", "cc-line cc-line--warn");
      this.body.appendChild(d);
      this._scroll();
      let i = 0;
      const start = Date.now();
      return new Promise(res => {
        const iv = setInterval(() => {
          d.textContent = frames[i++ % frames.length] + " " + label + "\u2026";
          if (Date.now() - start >= ms) {
            clearInterval(iv);
            d.remove();
            res();
          }
        }, reduceMotion ? ms : 80);
      });
    }

    _scroll() { this.body.scrollTop = this.body.scrollHeight; }

    /* ---------- input frames ---------- */
    _shellLine() {
      const wrap = el("div", "cc-line cc-line--shell");
      if (this.os === "windows") {
        // PowerShell prompt: PS C:\projects\demo>
        wrap.innerHTML = '<span class="cc-sh-ps">PS ' + esc(PROMPTS.windows.path) + "&gt;</span> ";
      } else {
        // zsh prompt: name@studio ~/projects/demo %
        const p = PROMPTS.mac;
        const h = CCTerminal.handle();
        wrap.innerHTML =
          '<span class="cc-sh-user">' + esc(h + "@studio") + "</span>" +
          '<span class="cc-sh-sep"> ' + esc(p.path) + " " + esc(p.glyph) + "</span> ";
      }
      return wrap;
    }

    _awaitCommand(step) {
      return new Promise(resolve => {
        const lineWrap = this._shellLine();
        const input = el("input", "cc-input");
        input.type = "text";
        input.spellcheck = false;
        input.autocapitalize = "off";
        input.setAttribute("aria-label", step.placeholder || "Type a command and press Enter");
        if (step.placeholder) input.placeholder = step.placeholder;
        lineWrap.appendChild(input);
        this.body.appendChild(lineWrap);

        if (step.hint) this._showHint(step.hint);
        this._maybeStartPointer(input);
        this._scroll();
        setTimeout(() => input.focus(), 30);

        const accept = (step.accept === "*")
          ? null
          : (Array.isArray(step.accept) ? step.accept : [step.accept]).map(s => s.toLowerCase().trim());

        input.addEventListener("keydown", async (e) => {
          if (e.key !== "Enter") return;
          const raw = input.value;
          const val = raw.toLowerCase().trim();
          if (val === "") return;

          // ANY-input mode (Claude Code prompts)
          if (accept === null) {
            this._lockInput(lineWrap, input, raw);
            this._clearHint();
            resolve({ raw });
            return;
          }
          // validated command mode
          if (accept.includes(val) || accept.some(a => val === a)) {
            this._lockInput(lineWrap, input, raw);
            this._clearHint();
            resolve({ raw, correct: true });
          } else {
            await this._wrongCommand(step, val);
            input.value = "";
            input.focus();
          }
        });
      });
    }

    _lockInput(lineWrap, input, raw) {
      const typed = el("span", "cc-typed", raw);
      input.replaceWith(typed);
      lineWrap.classList.add("cc-line--done");
    }

    async _wrongCommand(step, val) {
      let out = null;
      if (step.onWrong) out = step.onWrong[val] || step.onWrong._default;
      if (!out) {
        const cmd = val.split(/\s+/)[0];
        out = [
          { t: "err", s: (this.os === "windows"
              ? "'" + cmd + "' is not recognized as an internal or external command."
              : "command not found: " + cmd) },
          { t: "dim", s: "Not quite. Check the command and try again." }
        ];
      }
      await this._stream(out, 10);
      this._scroll();
    }

    /* ---------- main loop ---------- */
    async run(script) {
      this.script = script || [];
      if (this.openIntro) {
        const types = this.script.some(s => s && (s.type === "prompt" || s.type === "claudePrompt"));
        let seen = false;
        try { seen = localStorage.getItem("cc_term_intro_seen") === "1"; } catch (e) {}
        if (!types) {
          // not a typing lesson: no intro and no reopen link
          this.openIntro.style.display = "none";
          if (this.openIntroLink) this.openIntroLink.style.display = "none";
        } else if (!seen) {
          // first typing lesson: show the full walkthrough once, then remember it
          this.openIntro.style.display = "";
          if (this.openIntroLink) this.openIntroLink.style.display = "none";
          try { localStorage.setItem("cc_term_intro_seen", "1"); } catch (e) {}
        } else {
          // seen before: collapse to a small "how do I open it?" link
          this.openIntro.style.display = "none";
          if (this.openIntroLink) this.openIntroLink.style.display = "";
        }
      }
      for (this.idx = 0; this.idx < this.script.length; this.idx++) {
        const step = this.script[this.idx];
        this.onStep(this.idx, step);
        await this._exec(step);
      }
      this.onComplete();
    }

    async _exec(step) {
      switch (step.type) {
        case "output":
          await this._stream(step.lines, step.speed);
          break;

        case "pause":
          await sleep(step.ms || 500);
          break;

        case "prompt": {
          const res = await this._awaitCommand(step);
          await this._stream(step.success || [], step.speed);
          break;
        }

        case "claudePrompt": {
          this._renderClaudeFrame();
          const res = await this._awaitClaudeInput(step);
          const parsed = step.parse ? step.parse(res.raw) : { raw: res.raw };
          // worker hook: if a workerUrl is set, a host could fetch real output here.
          if (step.toolCalls) {
            await sleep(300);
            for (const tc of step.toolCalls) {
              await this._spinner(tc.working || "Working", tc.ms || 900);
              await this._stream([{ t: "tool", s: tc.name, arg: tc.arg }], 0);
            }
          }
          const success = typeof step.success === "function" ? step.success(parsed) : step.success;
          await this._stream(success || [], step.speed);
          this._lastParsed = parsed;
          break;
        }

        case "action": {
          const fn = this.handlers[step.name];
          if (fn) await new Promise(done => fn(step.payload || {}, done, this._lastParsed));
          break;
        }
        default:
          break;
      }
    }

    /* ---------- Claude Code ">" framed input ---------- */
    _renderClaudeFrame() {
      // visual: bordered input frame like Claude Code's TUI
      this._claudeFrame = el("div", "cc-cc-frame");
    }

    _awaitClaudeInput(step) {
      return new Promise(resolve => {
        const frame = el("div", "cc-cc-frame");
        const glyph = el("span", "cc-cc-glyph", "\u203A"); // ›
        const input = el("input", "cc-cc-input");
        input.type = "text";
        input.spellcheck = false;
        input.placeholder = step.placeholder || "Describe what you want to build\u2026";
        input.setAttribute("aria-label", step.placeholder || "Type your request to Claude Code");
        frame.appendChild(glyph);
        frame.appendChild(input);
        this.body.appendChild(frame);
        if (step.hint) this._showHint(step.hint);
        this._maybeStartPointer(input);
        this._scroll();
        setTimeout(() => input.focus(), 30);

        input.addEventListener("keydown", (e) => {
          if (e.key !== "Enter") return;
          const raw = input.value.trim();
          if (raw === "") return;
          const echo = el("div", "cc-cc-echo");
          echo.innerHTML = '<span class="cc-cc-glyph">\u203A</span> ' + esc(raw);
          frame.replaceWith(echo);
          this._clearHint();
          resolve({ raw });
        });
      });
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  /* ---------- OS persistence helper (cross-embed) ---------- */
  CCTerminal.getOS = function () {
    try { return localStorage.getItem("cc_course_os") || null; } catch (e) { return null; }
  };
  CCTerminal.setOS = function (os) {
    try { localStorage.setItem("cc_course_os", os); } catch (e) {}
  };

  /* ---------- Learner name (cross-embed personalization) ---------- */
  CCTerminal.getName = function () {
    try { return localStorage.getItem("cc_course_name") || null; } catch (e) { return null; }
  };
  CCTerminal.setName = function (n) {
    try { localStorage.setItem("cc_course_name", String(n)); } catch (e) {}
  };
  CCTerminal.firstName = function () {
    var n = CCTerminal.getName();
    return n ? String(n).trim().split(/\s+/)[0] : null;
  };
  CCTerminal.handle = function () {
    var f = CCTerminal.firstName();
    if (!f) return "alex";
    var h = f.toLowerCase().replace(/[^a-z0-9]/g, "");
    return h || "alex";
  };
  CCTerminal.getRole = function () {
    try { return localStorage.getItem("cc_course_role") || null; } catch (e) { return null; }
  };
  CCTerminal.setRole = function (r) {
    try { localStorage.setItem("cc_course_role", String(r)); } catch (e) {}
  };
  CCTerminal.reduceMotion = reduceMotion;

  global.CCTerminal = CCTerminal;
})(window);
