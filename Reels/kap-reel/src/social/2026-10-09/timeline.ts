// Beat map for the Fri 2026-10-09 reel, "How we plan a week of posts"
// (behind the scenes). Text led, no narration, 20.0 s at 30 fps.

export const FPS = 30;

export const BEATS = {
  hook: { start: 0, end: 90 },
  plan: { start: 90, end: 162 },
  brief: { start: 162, end: 234 },
  build: { start: 234, end: 306 },
  approve: { start: 306, end: 396 },
  schedule: { start: 396, end: 486 },
  cta: { start: 486, end: 600 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

/** Frames inside a beat, relative to its start. */
export const CUE = {
  hookStamp1: 6,
  hookStamp2: 18,
  hookWeek: 44,
  planStamp: 34,
  buildReveal: [4, 18, 32] as const,
  approveTap: 34,
  approveSwap: 42,
  approveStamp: 48,
  scheduleResults: 34,
  ctaLines: [8, 16, 24] as const,
  ctaOffer: 34,
} as const;

/** Thumbnail: the hook with both stamps down and "Here's the week." in. */
export const THUMB_FRAME = BEATS.hook.start + 70;

export const STEPS = ["Plan", "Brief", "Build", "Approve", "Schedule"] as const;

export const COPY = {
  hook: "Every post we publish gets approved twice.",
  hookA: "1. The plan",
  hookB: "2. Every post",
  hookWeek: "Here's the week.",
  plan: "Plan the week. Alex approves it.",
  brief: "A brief for every post.",
  build: "Build every version.",
  buildSub: "Reel. Carousel. LinkedIn.",
  approve: "Alex approves every post.",
  schedule: "Schedule it. Check what worked.",
  cta: "This is how we run it for pilot businesses.",
  ctaLines: ["You approve the month's plan once", "We check every post before it goes out", "A short monthly results report"],
  offer: "3 free months for 3 Gainesville businesses.",
  call: "Call Alex 904-210-1071",
  message: "or message us",
  url: "ka-performancefl.com",
} as const;

export type CueRow = { text: string; start: number; end: number; source: string };

/** Every on-screen line, as burned in, for the SRT. */
export function cueRows(): CueRow[] {
  const b = BEATS;
  const src = "src/social/2026-10-09/WeekReel.tsx";
  const step = (k: "plan" | "brief" | "build" | "approve" | "schedule", n: number, text: string) => ({
    text: `Step ${n} of 5. ${text}`,
    start: b[k].start,
    end: b[k].end,
    source: src,
  });
  return [
    { text: COPY.hook, start: b.hook.start, end: b.hook.end, source: src },
    { text: `Alex approves ${COPY.hookA}. ${COPY.hookB}.`, start: b.hook.start + CUE.hookStamp2, end: b.hook.end, source: src },
    { text: COPY.hookWeek, start: b.hook.start + CUE.hookWeek, end: b.hook.end, source: src },
    step("plan", 1, COPY.plan),
    { text: "Approval 1", start: b.plan.start + CUE.planStamp, end: b.plan.end, source: src },
    step("brief", 2, COPY.brief),
    step("build", 3, COPY.build),
    { text: COPY.buildSub, start: b.build.start + CUE.buildReveal[0], end: b.build.end, source: src },
    step("approve", 4, COPY.approve),
    { text: "Approval 2", start: b.approve.start + CUE.approveStamp, end: b.approve.end, source: src },
    step("schedule", 5, COPY.schedule),
    { text: COPY.cta, start: b.cta.start, end: b.cta.end, source: src },
    { text: COPY.ctaLines.join(". ") + ".", start: b.cta.start + CUE.ctaLines[0], end: b.cta.end, source: src },
    { text: COPY.offer, start: b.cta.start + CUE.ctaOffer, end: b.cta.end, source: src },
    { text: `${COPY.call} ${COPY.message}`, start: b.cta.start + CUE.ctaOffer, end: b.cta.end, source: src },
    { text: COPY.url, start: b.cta.start + CUE.ctaOffer, end: b.cta.end, source: src },
  ];
}
