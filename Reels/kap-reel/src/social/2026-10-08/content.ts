// Thu 2026-10-08 reel: "AI drafts, you decide."
//
// Text led, no narration. A reply document with tracked changes on a light
// desk: the AI's first draft of a customer reply, then a person's three edits
// (tone made personal, a wrong fact fixed, an over-promise removed) as struck
// AI text and added human text. Visually the opposite of last week's Thursday
// reel (dark teal chat window).
//
// Every AI line is quoted from the day folder's source/ai-run.md word for word.
// The only change allowed to AI text is a cut, marked with an ellipsis. The
// business (a bike repair shop), Dana and Luis are fictional, labeled Example.
// No React in here, so the delivery script can import it.

export const FPS = 30;

/** Beat ranges, absolute frames, end exclusive. */
export const BEATS = {
  hook: { start: 0, end: 72 },
  draft: { start: 72, end: 171 },
  tone: { start: 171, end: 261 },
  fact: { start: 261, end: 363 },
  promise: { start: 363, end: 465 },
  rule: { start: 465, end: 522 },
  cta: { start: 522, end: 594 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

export const URL_HOME = "ka-performancefl.com";
export const URL_CTA = "ka-performancefl.com/ai-launch";
export const CTA_LABEL = "The 90-Day AI Launch";
export const PHONE = "904-210-1071";

export const EXAMPLE_TAG = "Example: a bike repair shop";
export const DOC_TITLE = "Reply to Dana";

export const HOOK = {
  first: "AI drafts.",
  second: "You decide.",
  sub: "One real AI first draft of a customer reply, and the three edits a person made.",
  /** Frame the sub line lands on; both hook lines are on screen from frame 0. */
  secondIn: 6,
};

/** The customer's question, quoted from the prompt. */
export const ASK = "Can you promise it will be ready by Friday?";

// ---------------------------------------------------------------------------
// The AI draft, verbatim from source/ai-run.md
// ---------------------------------------------------------------------------

export const AI = {
  greeting: "Hi Dana,",
  toneOld: "Thanks for bringing your bike in!",
  factOld:
    "Yes, the 20% off tune-up promotion applies to your service this month, so that discount will be reflected on your invoice.",
  promiseOld:
    "Good news on timing too, we'll have it ready for you by Friday, well ahead of your Saturday race.",
  callKeep: "We'll give you a call as soon as it's done so you can swing by and pick it up",
  callCut: " in plenty of time to prep",
  callEnd: ".",
  luck: "Good luck at your race Saturday!",
  thanks: "Thanks,",
  nameOld: "[Your Name]",
};

/** The full draft as the model returned it, for the check in deliver.ts. */
export const AI_FULL = [
  AI.greeting,
  `${AI.toneOld} ${AI.factOld}`,
  `${AI.promiseOld} ${AI.callKeep}${AI.callCut}${AI.callEnd}`,
  AI.luck,
  `${AI.thanks}\n${AI.nameOld}`,
].join("\n\n");

// ---------------------------------------------------------------------------
// The person's edits (written by K&A for the example)
// ---------------------------------------------------------------------------

export const HUMAN = {
  toneNew: "Thanks for trusting us with your race bike.",
  nameNew: "Luis",
  factNew: "Our 20% off deal ran through September, so it won't apply this time. Sorry for the mix-up.",
  promiseNew: "Tune-ups take 3 to 5 business days, so I can't promise Friday, but yours is first in line.",
};

export type EditNote = { n: number; kind: string; line: string };

export const NOTES: Record<"tone" | "fact" | "promise", EditNote> = {
  tone: { n: 1, kind: "Tone", line: "Make it sound like you. A real thanks, a real name." },
  fact: { n: 2, kind: "Fact", line: "The deal ended in September. The AI had no way to know." },
  promise: { n: 3, kind: "Promise", line: "It promised Friday. Only the shop can promise that." },
};

export const RULE = {
  line1: "AI drafts.",
  line2: "You decide.",
  parts: ["Make it sound like you.", "Check every fact.", "Cut promises you can't keep."],
};

export const CTA = {
  kicker: "Put AI to work in your business",
  title: "The 90-Day AI Launch",
  url: URL_CTA,
  sub: "K&A Performance. Web design and AI integration, Gainesville, FL.",
  phone: `Or call Alex: ${PHONE}`,
};

/** One SRT row per group of burned in text, absolute frames, end exclusive. */
export type CueRow = { text: string; start: number; end: number; source: string };

export function cueRows(): CueRow[] {
  const src = "src/social/2026-10-08/TrackedDraft.tsx";
  const b = BEATS;
  return [
    { text: `${HOOK.first} ${HOOK.second}`, start: b.hook.start, end: b.hook.end, source: src },
    { text: HOOK.sub, start: b.hook.start + HOOK.secondIn, end: b.hook.end, source: src },
    { text: `${EXAMPLE_TAG}. The customer asks: "${ASK}"`, start: b.draft.start, end: b.draft.end, source: src },
    { text: "The AI's first draft, word for word. The parts we edit.", start: b.draft.start + 12, end: b.draft.end, source: src },
    { text: `Edit ${NOTES.tone.n}, ${NOTES.tone.kind}: ${NOTES.tone.line}`, start: b.tone.start, end: b.tone.end, source: src },
    { text: `Edit ${NOTES.fact.n}, ${NOTES.fact.kind}: ${NOTES.fact.line}`, start: b.fact.start, end: b.fact.end, source: src },
    {
      text: `Edit ${NOTES.promise.n}, ${NOTES.promise.kind}: ${NOTES.promise.line}`,
      start: b.promise.start,
      end: b.promise.end,
      source: src,
    },
    { text: `${RULE.line1} ${RULE.line2}`, start: b.rule.start, end: b.rule.end, source: src },
    { text: `${CTA.title}: ${CTA.url}`, start: b.cta.start, end: b.cta.end, source: src },
  ];
}
