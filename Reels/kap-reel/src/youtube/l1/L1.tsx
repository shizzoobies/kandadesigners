// YouTube L1, "Test your website with one key". 1920x1080 at 30 fps.
// Publishes Fri 2026-10-02 11:00 AM (To Be Released/2026-10-02-4).
//
// Beats and on-screen plan: plans/youtube-2026-09-28/video-1-tab-key.md
// sections 2 and 3, and the approved brief. Every picture is cued to the word
// it illustrates, from the kept takes' transcripts (see timeline.ts), and every
// key press is the capture's own logged frame, so the keycap goes down when
// Amy says the key and the page reacts on that same frame.
//
// Good examples are K&A's own site (C1 to C7); bad ones are the plain test
// page (D1 to D4), always labeled as a test page built for this video, and
// where an outline was added for the video (D2, D3) the lower third says so.
// No captions are burned in; the SRT goes up separately.

import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import C1log from "../../../public/youtube/l1/captures/C1.keys.json";
import C2log from "../../../public/youtube/l1/captures/C2.keys.json";
import C3log from "../../../public/youtube/l1/captures/C3.keys.json";
import C4log from "../../../public/youtube/l1/captures/C4.keys.json";
import C5log from "../../../public/youtube/l1/captures/C5.keys.json";
import C6log from "../../../public/youtube/l1/captures/C6.keys.json";
import C7log from "../../../public/youtube/l1/captures/C7.keys.json";
import D1log from "../../../public/youtube/l1/captures/D1.keys.json";
import D2log from "../../../public/youtube/l1/captures/D2.keys.json";
import D3log from "../../../public/youtube/l1/captures/D3.keys.json";
import D4log from "../../../public/youtube/l1/captures/D4.keys.json";
import safariJson from "../../../public/youtube/l1/captures/safari-advanced.json";
import { CaptureShot, syncAt, type CameraKey } from "../CaptureShot";
import { ChapterCard, CheckCard } from "../ChapterCard";
import { ChecklistCard } from "../ChecklistCard";
import { EndScreen } from "../EndScreen";
import { Frame } from "../Frame";
import { focusBox, type KeyLog } from "../keys";
import { FPS } from "../layout";
import { LowerThird } from "../LowerThird";
import { RecapCard } from "../RecapCard";
import type { YouTubeTheme } from "../theme";
import { KeysCard, WhoCard } from "./cards";
import { L1_THEME } from "./themes";
import { CHAPTERS, L1_LAYOUT, cue, slotOf } from "./timeline";

const log = (j: unknown) => j as KeyLog;
const C1 = log(C1log);
const C2 = log(C2log);
const C3 = log(C3log);
const C4 = log(C4log);
const C5 = log(C5log);
const C6 = log(C6log);
const C7 = log(C7log);
const D1 = log(D1log);
const D2 = log(D2log);
const D3 = log(D3log);
const D4 = log(D4log);
const SAFARI = (
  safariJson as unknown as {
    boxes: Record<string, { x: number; y: number; w: number; h: number }>;
  }
).boxes;

const clip = (id: string) => staticFile(`youtube/l1/captures/${id}.mp4`);
const f = (s: number) => Math.round(s * FPS);

/** Draws its children only while the beat clock is in [from, to) seconds. */
const Span: React.FC<{ from: number; to: number; children: ReactNode }> = ({
  from,
  to,
  children,
}) => {
  const t = useCurrentFrame() / FPS;
  return t >= from && t < to ? <>{children}</> : null;
};

/**
 * Every shot of the home page header: logo to Start a project across the top
 * with the headline under it. 1.28 is as far in as the whole nav still fits.
 */
const NAV_VIEW: CameraKey[] = [{ at: 0, zoom: 1.28, focus: [722, 0], dur: 0 }];

/** A short lead so a cut lands just before the word, not on it. */
const LEAD = 0.3;

type BeatProps = { theme: YouTubeTheme; end: number };

// ---------------------------------------------------------------------------
// 1. Hook: the test page, Tab pressed, nothing to see. Then our rust outline.
// ---------------------------------------------------------------------------
const Beat1: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(1, p, n);
  const cut = c("some of your customers") - LEAD;
  return (
    <>
      <Span from={0} to={cut}>
        <CaptureShot
          theme={theme}
          src={clip("D1")}
          log={D1}
          play={[{ at: syncAt(c("Tab"), 1000, 400), from: 400, to: 6500 }]}
          camera={[
            {
              at: c("skips right past"),
              zoom: 1.5,
              focus: [1180, 180],
              dur: 1.6,
            },
          ]}
        />
        <LowerThird
          theme={theme}
          label="Our test page"
          line="Built for this video. Not a real business."
          from={f(0.8)}
          to={f(cut - 0.2)}
        />
      </Span>
      <Span from={cut} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("C2")}
          log={C2}
          play={[{ at: cut, from: 2300, to: 11000 }]}
          camera={NAV_VIEW}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 2. Intro: our home page settled, then the three-line agenda.
// ---------------------------------------------------------------------------
const Beat2: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(2, p, n);
  const cut = c("In the next") - LEAD;
  return (
    <>
      <Span from={0} to={cut}>
        <CaptureShot
          theme={theme}
          src={clip("C1")}
          log={C1}
          play={[{ at: 0, from: 0, to: 900 }]}
          camera={[]}
          showKeys={false}
        />
        <LowerThird
          theme={theme}
          label="K&A Performance"
          line="A web studio in Gainesville"
          from={f(c("K&A") + 0.2)}
          to={f(cut)}
        />
      </Span>
      <Span from={cut} to={end}>
        <ChapterCard
          theme={theme}
          label="In the next five minutes"
          title="Test your website with one key."
          at={f(cut)}
          lines={[
            { lead: "1", text: "How to run the test", at: f(c("how to run")) },
            {
              lead: "2",
              text: "What to look for",
              at: f(c("what to look for")),
            },
            {
              lead: "3",
              text: "What to ask your web person to fix",
              at: f(c("what to ask")),
            },
          ]}
          note={{
            text: "Nothing to install · Just one key",
            at: f(c("Nothing to install")),
          }}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 3. What focus is, who needs it, and the standard.
// ---------------------------------------------------------------------------
const Beat3: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(3, p, n);
  const who = c("Who needs that") - LEAD;
  const standard = c("There's a standard") - LEAD;
  return (
    <>
      <Span from={0} to={who}>
        <CaptureShot
          theme={theme}
          src={clip("C2")}
          log={C2}
          play={[{ at: syncAt(c("Tab"), 1000, 0), from: 0, to: 8000 }]}
          camera={[{ ...NAV_VIEW[0], at: c("Tab") - 0.6, dur: 1.0 }]}
        />
      </Span>
      <Span from={who} to={standard}>
        <WhoCard
          theme={theme}
          at={f(who)}
          items={[
            {
              icon: "reader",
              text: "People who are blind, using a screen reader",
              at: f(c("People who are blind")),
            },
            {
              icon: "tremor",
              text: "People with tremors, like Parkinson’s",
              at: f(c("People with tremors")),
            },
            {
              icon: "arm",
              text: "Someone with a broken arm this month",
              at: f(c("Someone with a broken")),
            },
            {
              icon: "keyboard",
              text: "People who just like the keyboard",
              at: f(c("plenty of people")),
            },
          ]}
        />
      </Span>
      <Span from={standard} to={end}>
        <ChapterCard
          theme={theme}
          label="There’s a standard"
          title="Web Content Accessibility Guidelines"
          at={f(standard)}
          titleAt={f(c("The Web Content"))}
          lines={[
            {
              lead: "WCAG",
              text: "Everything on your site should work from a keyboard.",
              at: f(c("called WCAG")),
            },
          ]}
          note={{
            text: "WCAG 2.2 · 2.1.1 Keyboard · Level A",
            at: f(c("say everything")),
          }}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 4. How to run it: the keys, the Safari setting, then our site.
// ---------------------------------------------------------------------------
const Beat4: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(4, p, n);
  const safari = c("Using Safari") - LEAD;
  const site = c("That's all the setup") - LEAD;
  return (
    <>
      <Span from={0} to={safari}>
        <KeysCard
          theme={theme}
          at={0}
          titleAt={f(c("Open your"))}
          rows={[
            { keys: ["Tab"], text: "Move forward", at: f(c("Press Tab")) },
            {
              keys: ["Shift", "Tab"],
              text: "Move back",
              at: f(c("Shift and Tab")),
            },
            { keys: ["Enter"], text: "Follow a link", at: f(c("On a link")) },
            {
              keys: ["Enter", "Space"],
              joiner: "or",
              text: "Press a button",
              at: f(c("On a button")),
            },
          ]}
        />
      </Span>
      <Span from={safari} to={site}>
        <CaptureShot
          theme={theme}
          kind="image"
          src={staticFile("youtube/l1/captures/safari-advanced.png")}
          viewport={{ width: 1440, height: 810 }}
          camera={[
            { at: safari, zoom: 1.2, focus: SAFARI.window, dur: 0 },
            {
              at: c("and check"),
              zoom: 1.7,
              focus: SAFARI.targetSetting,
              dur: 1.2,
            },
          ]}
        />
        <LowerThird
          theme={theme}
          label="Safari on a Mac · Yours may look slightly different"
          line="Settings, then Advanced"
          from={f(c("Open Safari"))}
          to={f(c("and check") + 0.2)}
        />
      </Span>
      <Span from={site} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("C1")}
          log={C1}
          play={[{ at: site, from: 0, to: 900 }]}
          camera={[]}
          showKeys={false}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 5. Check 1: the skip link.
// ---------------------------------------------------------------------------
const Beat5: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(5, p, n);
  const shot = c("Press Tab once") - LEAD;
  const without = c("Without it") - LEAD;
  return (
    <>
      <Span from={0} to={shot}>
        <CheckCard
          theme={theme}
          n={1}
          name="Skip link"
          title="A skip link comes first."
          at={0}
        />
      </Span>
      <Span from={shot} to={without}>
        <CaptureShot
          theme={theme}
          src={clip("C1")}
          log={C1}
          play={[
            { at: syncAt(c("Tab"), 1000, 500), from: 500, to: 2300 },
            { at: syncAt(c("Enter"), 2900, 2300), from: 2300, to: 5600 },
          ]}
          camera={[
            {
              at: c("the first thing"),
              zoom: 1.7,
              focus: focusBox(C1, 0),
              dur: 1.2,
            },
            { at: c("Press Enter") - 0.5, zoom: 1.0, dur: 0.8 },
            {
              at: c("straight to the page"),
              zoom: 1.35,
              focus: focusBox(C1, 2),
              dur: 1.0,
            },
          ]}
        />
      </Span>
      <Span from={without} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("C2")}
          log={C2}
          play={[{ at: without, from: 1400, to: 8000 }]}
          camera={NAV_VIEW}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 6. Check 2: visible focus. Our outline, then the test page's invisible one.
// ---------------------------------------------------------------------------
const Beat6: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(6, p, n);
  const ours = c("Keep tabbing") - LEAD;
  const test = c("Now look at this") - LEAD;
  const back = c("That's the problem") - LEAD;
  const firstTab = c("Keep tabbing") + 0.3;
  const tabs = [0, 1, 2, 3].map((i) => firstTab + i * 1.2);
  return (
    <>
      <Span from={0} to={ours}>
        <CheckCard
          theme={theme}
          n={2}
          name="Visible focus"
          title="You can always see where you are."
          at={0}
        />
      </Span>
      <Span from={ours} to={test}>
        <CaptureShot
          theme={theme}
          src={clip("C3")}
          log={C3}
          play={[{ at: syncAt(firstTab, 1000, 600), from: 600, to: 7400 }]}
          camera={[
            { at: ours, zoom: 1.6, focus: focusBox(C3, 0), dur: 0 },
            {
              at: tabs[1] - 0.05,
              zoom: 1.6,
              focus: focusBox(C3, 1),
              dur: 0.45,
            },
            // The inline links sit mid-page after a scroll: pull back so the heading beside them stays in.
            ...[2, 3].map((i) => ({
              at: tabs[i] - 0.05,
              zoom: 1.3,
              focus: [680, focusBox(C3, i).y + 20] as [number, number],
              dur: 0.5,
            })),
          ]}
        />
      </Span>
      <Span from={test} to={back}>
        <CaptureShot
          theme={theme}
          src={clip("D1")}
          log={D1}
          play={[{ at: syncAt(c("Tab"), 1000, 0), from: 0, to: 6500 }]}
          markFocus={[c("The focus is there"), back]}
        />
        <LowerThird
          theme={theme}
          label="Our test page"
          line="Built for this video. Not a real business."
          from={f(test + 0.3)}
          to={f(c("Press Tab") - 0.1)}
        />
      </Span>
      <Span from={back} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("C3")}
          log={C3}
          play={[{ at: back, from: 3800, to: 3800 }]}
          camera={[
            {
              at: back,
              zoom: 1.3,
              focus: [680, focusBox(C3, 2).y + 20],
              dur: 0,
            },
          ]}
          showKeys={false}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 7. Check 3: the order. Ours reads left to right; the test page jumps.
// ---------------------------------------------------------------------------
const Beat7: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(7, p, n);
  const ours = c("Focus should move") - LEAD;
  const test = c("On our test page") - LEAD;
  const menuRunAt = c("the menu") + 0.2;
  return (
    <>
      <Span from={0} to={ours}>
        <CheckCard
          theme={theme}
          n={3}
          name="Tab order"
          title="Focus moves the way you read."
          at={0}
        />
      </Span>
      <Span from={ours} to={test}>
        <CaptureShot
          theme={theme}
          src={clip("C2")}
          log={C2}
          play={[
            { at: syncAt(c("The logo"), 1800, 900), from: 900, to: 2700 },
            // The menu runs at 4x so the ring reaches the phone number as Amy says it.
            { at: menuRunAt, from: 2700, to: 6700, rate: 4 },
            {
              at: syncAt(c("then the button") + 0.25, 7400, 6700),
              from: 6700,
              to: 8000,
            },
          ]}
          camera={[{ ...NAV_VIEW[0], at: c("top to bottom"), dur: 1.2 }]}
        />
      </Span>
      <Span from={test} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("D2")}
          log={D2}
          play={[{ at: syncAt(c("header"), 1800, 300), from: 300, to: 6500 }]}
        />
        <LowerThird
          theme={theme}
          label="Our test page"
          line="Outline added so you can see where focus is."
          from={f(test + 0.2)}
          to={f(end)}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 8. Check 4: menus and popups. Our 960-wide menu, then the chat bubble.
// ---------------------------------------------------------------------------
const Beat8: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(8, p, n);
  const menu = c("On a smaller screen") - LEAD;
  const chat = c("The chat bubble") - LEAD;
  const enterAt = syncAt(c("Enter"), 4600, 3500);
  const insideAt = syncAt(c("tab takes"), 6000, 5200);
  const escAt = syncAt(c("Escape"), 8800, 8400);
  return (
    <>
      <Span from={0} to={menu}>
        <CheckCard
          theme={theme}
          n={4}
          name="Menus and popups"
          title="Menus and popups work from the keyboard."
          at={0}
        />
      </Span>
      <Span from={menu} to={chat}>
        <CaptureShot
          theme={theme}
          src={clip("C4")}
          log={C4}
          play={[
            // Skip link, logo and Call at 3x, so Open menu lands on "Tab to it".
            {
              at: syncAt(c("Tab to it"), 3400, 900, 3),
              from: 900,
              to: 3500,
              rate: 3,
            },
            { at: enterAt, from: 3500, to: 5200 },
            { at: insideAt, from: 5200, to: 8400 },
            { at: escAt, from: 8400, to: 10400 },
          ]}
        />
      </Span>
      <Span from={chat} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("C5")}
          log={C5}
          play={[
            {
              at: syncAt(c("works the same way"), 1000, 100),
              from: 100,
              to: 6000,
            },
          ]}
          camera={[{ at: chat, zoom: 1.45, focus: [1200, 560], dur: 0 }]}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 9. Check 5: no traps. The test page's signup box holds on to focus.
// ---------------------------------------------------------------------------
const Beat9: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(9, p, n);
  const trap = c("Once you're inside") - LEAD;
  return (
    <>
      <Span from={0} to={trap}>
        <CheckCard
          theme={theme}
          n={5}
          name="Keyboard traps"
          title="No keyboard traps."
          at={0}
        />
      </Span>
      <Span from={trap} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("D3")}
          log={D3}
          play={[
            { at: syncAt(c("grabs focus"), 1000, 0), from: 0, to: 1600 },
            { at: syncAt(c("Tab"), 2000, 1600), from: 1600, to: 3100 },
            { at: syncAt(c("Tab", 2), 3600, 3100), from: 3100, to: 4800 },
            { at: syncAt(c("Escape"), 5200, 4800), from: 4800, to: 6800 },
          ]}
          camera={[
            {
              at: c("On our test page"),
              zoom: 1.2,
              focus: [720, 620],
              dur: 1.2,
            },
          ]}
        />
        <LowerThird
          theme={theme}
          label="Our test page"
          line="Outline added so you can see where focus is."
          from={f(c("On our test page"))}
          to={f(c("Tab") - 0.3)}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 10. Check 6: labeled forms. Our contact form, the test page's hints, Send.
// ---------------------------------------------------------------------------
const Beat10: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(10, p, n);
  const ours = c("Tab into") - LEAD;
  const hints = c("A light gray") - LEAD;
  const send = c("Then tab") - LEAD;
  // The whole form, the NAME label down to Send message.
  const form: CameraKey = { at: 0, zoom: 1.55, focus: [1006, 520], dur: 0 };
  return (
    <>
      <Span from={0} to={ours}>
        <CheckCard
          theme={theme}
          n={6}
          name="Form labels"
          title="Every field has a label you can see."
          at={0}
        />
      </Span>
      <Span from={ours} to={hints}>
        <CaptureShot
          theme={theme}
          src={clip("C6")}
          log={C6}
          play={[
            { at: syncAt(c("Tab into"), 1000, 600), from: 600, to: 1600 },
            { at: syncAt(c("email"), 2067, 1600), from: 1600, to: 3500 },
          ]}
          camera={[form]}
        />
      </Span>
      <Span from={hints} to={send}>
        <CaptureShot
          theme={theme}
          src={clip("D4")}
          log={D4}
          play={[
            { at: syncAt(c("disappears"), 1400, 500), from: 500, to: 7000 },
          ]}
          camera={[{ at: hints, zoom: 1.6, focus: [1110, 296], dur: 0 }]}
        />
        <LowerThird
          theme={theme}
          label="Our test page"
          line="A hint inside the box is not a label."
          from={f(hints + 0.3)}
          to={f(send)}
        />
      </Span>
      <Span from={send} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("C6")}
          log={C6}
          play={[{ at: syncAt(c("tab", 2), 4200, 3400), from: 3400, to: 6200 }]}
          camera={[form]}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 11. What to ask your web person: the checklist, then the references.
// ---------------------------------------------------------------------------
const Beat11: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(11, p, n);
  const refs = c("If they want") - LEAD;
  return (
    <>
      <Span from={0} to={refs}>
        <ChecklistCard
          theme={theme}
          label="Ask your web person · Pause to read"
          title="Five fixes to ask for"
          at={0}
          allAt={f(c("You can pause"))}
          readAt={[c("One"), c("Two"), c("Three"), c("Four"), c("Five")].map(f)}
          items={[
            "Add a Skip to content link at the top of every page.",
            "Don’t remove the focus outline. Style it so it’s easy to see.",
            "Make the tab order follow the page.",
            "Make every menu, popup and chat window open with Enter, close with Escape, and put focus back where it was.",
            "Give every form field a visible label.",
          ]}
        />
      </Span>
      <Span from={refs} to={end}>
        <ChapterCard
          theme={theme}
          label="For your web person · WCAG 2.2"
          title="The official references"
          titleSize={72}
          at={f(refs)}
          lines={[
            { lead: "2.1.1", text: "Keyboard", at: f(c("keyboard")) },
            {
              lead: "2.1.2",
              text: "No Keyboard Trap",
              at: f(c("no keyboard trap")),
            },
            { lead: "2.4.1", text: "Bypass Blocks", at: f(c("bypass blocks")) },
            { lead: "2.4.3", text: "Focus Order", at: f(c("focus order")) },
            { lead: "2.4.7", text: "Focus Visible", at: f(c("focus visible")) },
            {
              lead: "3.3.2",
              text: "Labels or Instructions",
              at: f(c("labels or instructions")),
            },
          ]}
          note={{
            text: "Numbers and links in the description",
            at: f(c("The numbers")),
          }}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 12. Recap, then our accessibility audit page.
// ---------------------------------------------------------------------------
const Beat12: React.FC<BeatProps> = ({ theme, end }) => {
  const c = (p: string, n?: number) => cue(12, p, n);
  const cta = c("If you'd like") - LEAD;
  return (
    <>
      <Span from={0} to={cta}>
        <RecapCard
          theme={theme}
          label="Recap · The one-key test"
          title="Load your page. Press Tab."
          at={0}
          items={[
            { text: "A skip link", tickAt: f(c("skip link")) },
            { text: "Focus you can always see", tickAt: f(c("an outline")) },
            { text: "An order that makes sense", tickAt: f(c("an order")) },
            {
              text: "Menus and popups that work from the keyboard",
              tickAt: f(c("menus and")),
            },
            { text: "No keyboard traps", tickAt: f(c("no traps")) },
            {
              text: "Forms with visible labels",
              tickAt: f(c("forms with labels")),
            },
          ]}
          note={{ text: "It takes about a minute", at: f(c("It takes about")) }}
        />
      </Span>
      <Span from={cta} to={end}>
        <CaptureShot
          theme={theme}
          src={clip("C7")}
          log={C7}
          play={[{ at: cta, from: 0, to: 8500 }]}
          showKeys={false}
        />
        <LowerThird
          theme={theme}
          label="ka-performancefl.com/services/accessibility"
          line="Full accessibility audits"
          from={f(c("K&A Performance"))}
          to={f(end)}
        />
      </Span>
    </>
  );
};

// ---------------------------------------------------------------------------
// 13. The end screen.
// ---------------------------------------------------------------------------
const Beat13: React.FC<BeatProps> = ({ theme }) => (
  <EndScreen
    theme={theme}
    label="Quick fixes"
    title="A new walkthrough every week."
    videoLabel="Watch next"
  />
);

const BEATS: Record<number, React.FC<BeatProps>> = {
  1: Beat1,
  2: Beat2,
  3: Beat3,
  4: Beat4,
  5: Beat5,
  6: Beat6,
  7: Beat7,
  8: Beat8,
  9: Beat9,
  10: Beat10,
  11: Beat11,
  12: Beat12,
  13: Beat13,
};

export type L1Props = {
  /** Off for style frames, QA stills and the muted master the encode muxes the mix onto. */
  withAudio: boolean;
};

/** The finished mix, written by scripts/youtube/l1/mix.ts. */
export const L1_MIX = "youtube/l1/mix.wav";

export const L1: React.FC<L1Props> = ({ withAudio }) => {
  const theme = L1_THEME;
  const frame = useCurrentFrame();
  const current =
    [...L1_LAYOUT.slots].reverse().find((s) => frame >= s.from) ??
    L1_LAYOUT.slots[0];
  return (
    <AbsoluteFill>
      <Frame
        theme={theme}
        chapter={CHAPTERS[current.beat]}
        chapterFrom={current.from}
      >
        {L1_LAYOUT.slots.map((s) => {
          const Beat = BEATS[s.beat];
          return (
            <Sequence
              key={s.beat}
              from={s.from}
              durationInFrames={s.frames}
              layout="none"
              name={`${s.beat} ${s.title}`}
            >
              <Beat theme={theme} end={slotOf(s.beat).frames / FPS} />
            </Sequence>
          );
        })}
      </Frame>
      {withAudio ? <Audio src={staticFile(L1_MIX)} /> : null}
    </AbsoluteFill>
  );
};
