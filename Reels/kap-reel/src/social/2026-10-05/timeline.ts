// Beat map for the Monday 2026-10-05 reel, "5 Google Business Profile settings
// most businesses forget". Text led, no narration, 17 s at 30 fps. A cut of the
// same five checks as the 2026-10-05-2 carousel, reusing its pieces from
// assets/social/2026-10-05 (built by that folder's source/build.mjs).

export const FPS = 30;

export const HOOK = { start: 0, end: 72 } as const;
export const STOP_FRAMES = 66;
export const STOPS_START = HOOK.end;
export const CTA = { start: STOPS_START + 5 * STOP_FRAMES, end: STOPS_START + 5 * STOP_FRAMES + 108 } as const;
export const TOTAL_FRAMES = CTA.end; // 510 = 17.0 s

export const HOOK_TEXT = "Your Google profile has 5 settings most businesses forget.";

export type Stop = { label: string; headline: string; evidence: string; tag: string };

/** Headlines match the carousel slides 2 to 6; every tip is sourced in 2026-10-05-2/source/sources.md. */
export const STOPS: Stop[] = [
  { label: "Primary category", headline: "Pick the most specific primary category.", evidence: "social/2026-10-05/ev-1.png", tag: "real" },
  { label: "Hours", headline: "Confirm your hours. Add holiday hours now.", evidence: "social/2026-10-05/ev-2.png", tag: "real" },
  { label: "Services", headline: "List the services you actually sell.", evidence: "social/2026-10-05/ev-3.png", tag: "drawn" },
  { label: "Fresh photos", headline: "Add fresh photos of the real thing.", evidence: "social/2026-10-05/ev-4.png", tag: "drawn" },
  { label: "Review replies", headline: "Reply to reviews, the good and the bad.", evidence: "social/2026-10-05/ev-5.png", tag: "drawn" },
];

export const stopStart = (i: number) => STOPS_START + i * STOP_FRAMES;

export const CTA_TEXT = {
  headA: "Local search is part of",
  headB: "every site we build.",
  url: "ka-performancefl.com",
  path: "/services/seo-ai-search",
  call: "Call Alex 904-210-1071",
} as const;

/** CTA lines arrive a beat after the headline. */
export const CTA_URL_IN = 12;
export const CTA_CALL_IN = 20;

/** The thumbnail: the hook with the route map settled. */
export const THUMB_FRAME = 50;

export type CueRow = { text: string; start: number; end: number; source: string };

/** Every on-screen line, as burned in, for the SRT. */
export function cueRows(): CueRow[] {
  const src = "src/social/2026-10-05/Reel.tsx";
  const rows: CueRow[] = [{ text: HOOK_TEXT, start: HOOK.start, end: HOOK.end, source: src }];
  STOPS.forEach((s, i) => {
    rows.push({ text: `${i + 1}. ${s.headline}`, start: stopStart(i), end: stopStart(i) + STOP_FRAMES, source: src });
  });
  rows.push(
    { text: `${CTA_TEXT.headA} ${CTA_TEXT.headB}`, start: CTA.start, end: CTA.end, source: src },
    { text: `${CTA_TEXT.url}${CTA_TEXT.path}`, start: CTA.start + CTA_URL_IN, end: CTA.end, source: src },
    { text: CTA_TEXT.call, start: CTA.start + CTA_CALL_IN, end: CTA.end, source: src },
  );
  return rows;
}
