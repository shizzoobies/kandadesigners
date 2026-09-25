// Thu 2026-10-01 reel: "Give the AI the brief, not the task", revision 2.
//
// Text led, no narration (voice is on hold, plans/2026-09-28-rework.md). A chat
// window on the dark teal stage, K&A chrome around it: the lockup and
// ka-performancefl.com in the title bar and the 90-Day AI Launch address in the
// input bar, so both are on every frame. (2026-09-25: the call to action moved
// from the free AI lessons page to the paid 90-Day AI Launch, /ai-launch/.)
//
// The prompts and replies are quoted from the day folder's
// source/prompt-run.md, word for word. The only change allowed is a cut, marked
// with an ellipsis. No React in here, so the delivery script can import it.

export const FPS = 30;

/** Beat ranges, absolute frames, end exclusive. */
export const BEATS = {
  hook: { start: 0, end: 84 },
  weak: { start: 84, end: 222 },
  strong: { start: 222, end: 408 },
  rule: { start: 408, end: 468 },
  cta: { start: 468, end: 555 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

export const URL_HOME = "ka-performancefl.com";
export const URL_CTA = "ka-performancefl.com/ai-launch";
/** Small caps label over the address in the input bar. */
export const INPUT_LABEL = "The 90-Day AI Launch";
export const PHONE = "904-210-1071";

export const HOOK = {
  first: "Stop asking AI to write the email.",
  second: "Tell it who the email is for.",
  /** Frame the second line lands on, relative to the hook. */
  secondIn: 20,
};

/** One chat exchange: the prompt typed in, the reply streamed back. */
export type Exchange = {
  label: string;
  tag?: string;
  prompt: string;
  subject: string;
  /** Paragraphs as quoted. A leading or trailing ellipsis marks a cut. */
  paragraphs: string[];
  /** Phrases to highlight once the reply has landed. Must appear verbatim. */
  highlights: string[];
  verdict: string;
  /** Relative frames inside the beat. */
  typeIn: [number, number];
  streamIn: [number, number];
  verdictIn: number;
};

export const WEAK: Exchange = {
  label: "The task",
  prompt: "Write a follow up email",
  subject: "Following Up",
  paragraphs: [
    "Hi [Name],",
    "I wanted to follow up on my previous message. Please let me know if you have any questions or if there is anything else I can help you with.",
    "I look forward to hearing from you.",
    "Best regards,\n[Your Name]",
  ],
  highlights: [],
  verdict: "A form letter.",
  typeIn: [2, 18],
  streamIn: [26, 66],
  verdictIn: 72,
};

export const STRONG: Exchange = {
  label: "The brief",
  tag: "Example, fictional bakery",
  prompt:
    "Write a follow up to a bakery owner who asked about pricing and is nervous about cost",
  subject: "Your website, and what it would actually cost",
  paragraphs: [
    "Hi Maria,",
    "Thanks for asking about pricing. I know a website can feel like a big spend for a bakery, so here is the straight version.",
    "… You do not need everything on day one. We can start with the pages that bring in orders and add the rest when they pay for themselves.",
    "… No pressure either way.",
  ],
  highlights: ["a big spend for a bakery", "start with the pages that bring in orders"],
  verdict: "One you would send.",
  typeIn: [2, 32],
  streamIn: [40, 100],
  verdictIn: 106,
};

/** Small print on every reply bubble. No vendor names. */
export const REPLY_HEADER = "AI reply, unedited";

export const RULE = {
  line: "Give it the brief, not the task.",
  parts: ["Who it is for.", "What they need.", "What worries them."],
  tie: "We build this habit into every AI setup for our clients.",
};

export const CTA = {
  kicker: "Put AI to work in your business",
  title: "The 90-Day AI Launch",
  url: URL_CTA,
  sub: "K&A Performance. Web design and AI integration, Gainesville, FL.",
  phone: `Or call Alex: ${PHONE}`,
};

/** Frame the thumbnail still is taken from: none. It is its own composition. */

/** One SRT row per line of burned in text, absolute frames, end exclusive. */
export type CueRow = { text: string; start: number; end: number; source: string };

export function cueRows(): CueRow[] {
  const src = "src/social/2026-10-01/BriefChat.tsx";
  const b = BEATS;
  return [
    { text: HOOK.first, start: b.hook.start, end: b.hook.end, source: src },
    { text: HOOK.second, start: b.hook.start + HOOK.secondIn, end: b.hook.end, source: src },
    { text: `${WEAK.label}: "${WEAK.prompt}"`, start: b.weak.start, end: b.weak.end, source: src },
    {
      text: `AI reply: ${WEAK.verdict}`,
      start: b.weak.start + WEAK.verdictIn,
      end: b.weak.end,
      source: src,
    },
    {
      text: `${STRONG.label} (example): "${STRONG.prompt}"`,
      start: b.strong.start,
      end: b.strong.end,
      source: src,
    },
    {
      text: `AI reply: ${STRONG.verdict}`,
      start: b.strong.start + STRONG.verdictIn,
      end: b.strong.end,
      source: src,
    },
    { text: RULE.line, start: b.rule.start, end: b.rule.end, source: src },
    { text: `${CTA.title}: ${CTA.url}`, start: b.cta.start, end: b.cta.end, source: src },
  ];
}
