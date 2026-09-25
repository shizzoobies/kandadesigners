// Beat map for the Tuesday 2026-10-06 reel, "Your hero is a promise, not a photo".
// The parked hero tutorial (Reels/instructional reels/hero, src/tutorial/scenes/hero)
// rebuilt text led: no narration, music bed only, 19 s at 30 fps.
//
// Pure data, no Remotion imports, so scripts/social/2026-10-06/deliver.ts reads the
// same frames and strings the picture uses and the SRT cannot drift.
//
// The phone is a drawn example, labeled on screen on every frame it appears:
// no client site and no real business is shown as weak or strong.

export const FPS = 30;

export const BEATS = {
  hook: { start: 0, end: 75 },
  weak: { start: 75, end: 195 },
  rewrite: { start: 195, end: 375 },
  test: { start: 375, end: 450 },
  cta: { start: 450, end: 570 },
} as const;

export const TOTAL_FRAMES = BEATS.cta.end;

/** Absolute frames. */
export const CUE = {
  /** The four crosses stamp in on the weak beat. */
  cross: [87, 97, 107, 117],
  /** The photo shrinks out of the way at the start of the rewrite. */
  shrinkIn: BEATS.rewrite.start + 6,
  shrinkFrames: 18,
  /** Each of the four items lands on the phone and ticks on the list. */
  tick: [BEATS.rewrite.start + 30, BEATS.rewrite.start + 66, BEATS.rewrite.start + 102, BEATS.rewrite.start + 138],
  /** The photo gets covered on the test beat. */
  coverIn: BEATS.test.start + 12,
  ctaUrlIn: BEATS.cta.start + 10,
  ctaCallIn: BEATS.cta.start + 20,
} as const;

export const DRAWN_LABEL = "Drawn example. Not a real business.";

/** What the drawn weak hero says. */
export const WEAK = {
  headline: "Welcome to our website",
  sub: "Quality. Passion. Excellence.",
};

/** The four things, in order, and what the drawn strong hero says for each. */
export const ITEMS = [
  { n: 1, label: "What you do", strong: "Fresh sourdough, baked daily." },
  { n: 2, label: "Where", strong: "Gainesville. Open at 6 a.m." },
  { n: 3, label: "Proof", strong: "5-star Google reviews" },
  { n: 4, label: "The next step", strong: "Order ahead" },
] as const;

export const HEADLINES = {
  hook: ["Your hero is a promise,", "not a photo."],
  weak: ["A photo and a welcome", "tell a stranger nothing."],
  rewrite: ["Say it before", "they scroll."],
  test: ["Cover the photo.", "Still clear? It works."],
  cta: ["Want a first screen", "that makes the promise?"],
} as const;

export const CTA = {
  url: "ka-performancefl.com",
  page: "Web design from Gainesville",
  call: "Call Alex 904-210-1071",
};

/** The frame the thumbnail is pulled from: the strong hero, all four ticked. */
export const THUMB_FRAME = CUE.tick[3] + 24;

export type CueRow = { text: string; start: number; end: number; source: string };

/** Every on-screen line, as burned in, for the SRT. */
export function cueRows(): CueRow[] {
  const b = BEATS;
  const src = "src/social/2026-10-06/HeroPromise.tsx";
  const h = (k: keyof typeof HEADLINES) => HEADLINES[k].join(" ");
  return [
    { text: h("hook"), start: b.hook.start, end: b.hook.end, source: src },
    { text: `${DRAWN_LABEL} "${WEAK.headline}"`, start: b.hook.start, end: b.rewrite.start, source: src },
    { text: h("weak"), start: b.weak.start, end: b.weak.end, source: src },
    { text: "What you do, where, proof, the next step: none of them.", start: CUE.cross[0], end: b.weak.end, source: src },
    { text: h("rewrite"), start: b.rewrite.start, end: b.rewrite.end, source: src },
    ...ITEMS.map((it, i) => ({
      text: `${it.n}. ${it.label}: ${it.strong}`,
      start: CUE.tick[i],
      end: b.rewrite.end,
      source: src,
    })),
    { text: h("test"), start: b.test.start, end: b.test.end, source: src },
    { text: h("cta"), start: b.cta.start, end: b.cta.end, source: src },
    { text: `${CTA.url}. ${CTA.page}.`, start: CUE.ctaUrlIn, end: b.cta.end, source: src },
    { text: CTA.call, start: CUE.ctaCallIn, end: b.cta.end, source: src },
  ];
}
