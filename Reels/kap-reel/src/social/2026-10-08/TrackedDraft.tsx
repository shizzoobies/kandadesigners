import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { centeredBox, safeArea } from "../../lib/layout";
import {
  AI,
  ASK,
  BEATS,
  CTA,
  CTA_LABEL,
  DOC_TITLE,
  EXAMPLE_TAG,
  HOOK,
  HUMAN,
  NOTES,
  RULE,
  URL_CTA,
  URL_HOME,
  type EditNote,
} from "./content";

// Layout. Everything sits inside safeArea("vertical"): y 288 to 1536, and the
// 864 wide box centered on the canvas (108 to 972), clear of the right strip.
const SAFE = safeArea("vertical");
const BOX = centeredBox("vertical", 864);
const BRAND_TOP = SAFE.top + 8;
const BRAND_H = 88;
const STRIP_H = 108;
const STRIP_TOP = SAFE.bottom - 6 - STRIP_H;
const DOC_TOP = BRAND_TOP + BRAND_H + 12;
const DOC_BOTTOM = STRIP_TOP - 14;
const PAD = 44;
const SHEET_LEFT = 64;

const INK = COLORS.ink;
const RUST = COLORS.accent;
const CREAM = COLORS.canvas;
const PAPER = COLORS.surface;
const MUTED = COLORS.muted;
const TEAL = COLORS.dark_canvas;
const TEAL_SURF = COLORS.dark_surface;
const AMBER = COLORS.amber;
const DESK = "#ECE4DA";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);

const rise = (frame: number, at: number, dur = 8, dist = 24): CSSProperties => {
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: ease });
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

// ---------------------------------------------------------------------------
// Tracked change segments
// ---------------------------------------------------------------------------

type Seg =
  | { k: "keep"; t: string }
  | { k: "del"; t: string; at: number }
  | { k: "ins"; t: string; at: number; dur: number }
  | { k: "acc"; t: string };

const keep = (t: string): Seg => ({ k: "keep", t });
const del = (t: string, at: number): Seg => ({ k: "del", t, at });
const ins = (t: string, at: number, dur: number): Seg => ({ k: "ins", t, at, dur });
const acc = (t: string): Seg => ({ k: "acc", t });

const INS_STYLE: CSSProperties = {
  color: TEAL_SURF,
  fontWeight: 700,
  textDecoration: "underline",
  textDecorationThickness: 4,
  textUnderlineOffset: 7,
  textDecorationColor: TEAL_SURF,
  backgroundColor: "rgba(94,234,212,0.24)",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
};

const Segs: React.FC<{ frame: number; segs: Seg[] }> = ({ frame, segs }) => (
  <>
    {segs.map((s, i) => {
      if (s.k === "keep") return <span key={i}>{s.t}</span>;
      if (s.k === "acc")
        return (
          <span key={i} style={{ ...INS_STYLE, backgroundColor: "transparent", textDecorationThickness: 2 }}>
            {s.t}
          </span>
        );
      if (s.k === "del") {
        const p = interpolate(frame, [s.at, s.at + 8], [0, 1], { ...clamp, easing: ease });
        return (
          <span
            key={i}
            style={{
              color: p > 0 ? RUST : INK,
              opacity: 1 - 0.28 * p,
              backgroundImage: `linear-gradient(transparent 50%, ${RUST} 50%, ${RUST} 57%, transparent 57%)`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${p * 100}% 100%`,
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {s.t}
          </span>
        );
      }
      // ins: types in
      if (frame < s.at) return null;
      const n = Math.round(interpolate(frame, [s.at, s.at + s.dur], [0, s.t.length], clamp));
      const typing = n < s.t.length;
      return (
        <span key={i} style={INS_STYLE}>
          {s.t.slice(0, n)}
          {typing ? <span style={{ color: TEAL_SURF, textDecoration: "none" }}>|</span> : null}
        </span>
      );
    })}
  </>
);

// ---------------------------------------------------------------------------
// Chrome: brand bar, the document, the CTA strip. On every frame.
// ---------------------------------------------------------------------------

const BrandBar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: BOX.left,
      width: BOX.width,
      top: BRAND_TOP,
      height: BRAND_H,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <Img src={LOGO_PNG} style={{ height: 76, width: "auto" }} />
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 38, color: INK }}>{URL_HOME}</div>
  </div>
);

const CtaStrip: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: BOX.left,
      width: BOX.width,
      top: STRIP_TOP,
      height: STRIP_H,
      background: RUST,
      borderRadius: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 2,
      color: "#FFFFFF",
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ fontFamily: BODY_STACK, fontWeight: 700, fontSize: 25, letterSpacing: 2 }}>
      {CTA_LABEL.toUpperCase()}
    </div>
    <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 42, lineHeight: 1.1 }}>{URL_CTA}</div>
  </div>
);

type HeaderMode = { status: string; legend: boolean };

const DocHeader: React.FC<{ mode: HeaderMode }> = ({ mode }) => (
  <div style={{ borderBottom: `3px solid ${INK}` }}>
    <div
      style={{
        height: 104,
        padding: `0 ${PAD}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 40, color: INK, lineHeight: 1.1 }}>
          {DOC_TITLE}
        </div>
        <div
          style={{
            fontFamily: BODY_STACK,
            fontWeight: 700,
            fontSize: 25,
            color: RUST,
            letterSpacing: 1.4,
            marginTop: 4,
          }}
        >
          {EXAMPLE_TAG.toUpperCase()}
        </div>
      </div>
      <div
        style={{
          fontFamily: BODY_STACK,
          fontWeight: 800,
          fontSize: 30,
          color: CREAM,
          background: TEAL,
          padding: "10px 18px",
          borderRadius: 8,
        }}
      >
        {mode.status}
      </div>
    </div>
    {mode.legend ? (
      <div
        style={{
          height: 56,
          padding: `0 ${PAD}px`,
          display: "flex",
          alignItems: "center",
          gap: 40,
          background: "#F4EEE7",
          borderTop: "2px solid rgba(34,28,21,0.12)",
          fontFamily: BODY_STACK,
          fontSize: 28,
          color: INK,
        }}
      >
        <span>
          <span
            style={{
              color: RUST,
              backgroundImage: `linear-gradient(transparent 50%, ${RUST} 50%, ${RUST} 58%, transparent 58%)`,
              fontWeight: 700,
            }}
          >
            struck
          </span>{" "}
          = the AI's words
        </span>
        <span>
          <span style={{ ...INS_STYLE, textDecorationThickness: 3, textUnderlineOffset: 5 }}>added</span> = a person's
        </span>
      </div>
    ) : null}
  </div>
);

const Doc: React.FC<{ mode: HeaderMode; children: ReactNode; bodyBg?: string; header?: boolean }> = ({
  mode,
  children,
  bodyBg = PAPER,
  header = true,
}) => (
  <div
    style={{
      position: "absolute",
      left: BOX.left,
      width: BOX.width,
      top: DOC_TOP,
      height: DOC_BOTTOM - DOC_TOP,
      background: bodyBg,
      borderTop: `3px solid ${INK}`,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {header ? <DocHeader mode={mode} /> : null}
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Beats
// ---------------------------------------------------------------------------

const Hook: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: `0 ${PAD + 4}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 12,
    }}
  >
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 158, lineHeight: 0.98, color: INK, letterSpacing: -3 }}>
      {HOOK.first}
    </div>
    <div
      style={{
        fontFamily: DISPLAY_STACK,
        fontWeight: 900,
        fontSize: 158,
        lineHeight: 0.98,
        color: RUST,
        letterSpacing: -3,
      }}
    >
      {HOOK.second}
    </div>
    <div
      style={{
        marginTop: 44,
        fontFamily: BODY_STACK,
        fontSize: 46,
        lineHeight: 1.28,
        color: INK,
        borderLeft: `8px solid ${AMBER}`,
        paddingLeft: 28,
        ...rise(frame, HOOK.secondIn, 8, 16),
      }}
    >
      {HOOK.sub}
    </div>
  </div>
);

const TEXT: CSSProperties = { fontFamily: BODY_STACK, color: INK };

const Draft: React.FC<{ frame: number }> = ({ frame }) => {
  // Only the sentences the person edits, quoted exactly, cuts marked with
  // ellipses (Alex, 2026-09-25). The full draft is in source/ai-run.md.
  const paras = [
    `${AI.toneOld} ${AI.factOld}`,
    `${AI.promiseOld} …${AI.callCut}${AI.callEnd}`,
    `… ${AI.nameOld}`,
  ];
  return (
    <div style={{ position: "absolute", inset: 0, padding: `26px ${PAD}px`, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "#F4EEE7",
          borderLeft: `8px solid ${TEAL_SURF}`,
          padding: "16px 24px",
          ...TEXT,
          fontSize: 38,
          lineHeight: 1.28,
        }}
      >
        <span style={{ fontWeight: 800 }}>Dana asks: </span>
        <span style={{ fontStyle: "italic" }}>"{ASK}"</span>
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: BODY_STACK,
          fontWeight: 800,
          fontSize: 27,
          letterSpacing: 1.4,
          color: TEAL_SURF,
          ...rise(frame, 6, 6, 10),
        }}
      >
        THE AI'S FIRST DRAFT, WORD FOR WORD. THE PARTS WE EDIT:
      </div>
      <div style={{ marginTop: 14, ...TEXT, fontSize: 44, lineHeight: 1.32 }}>
        {paras.map((p, i) => (
          <div key={i} style={{ marginBottom: 22, whiteSpace: "pre-line", ...rise(frame, 10 + i * 6, 6, 14) }}>
            {p}
          </div>
        ))}
      </div>
    </div>
  );
};

const Note: React.FC<{ frame: number; note: EditNote }> = ({ frame, note }) => (
  <div
    style={{
      position: "absolute",
      left: PAD - 8,
      right: PAD - 8,
      bottom: 26,
      background: TEAL,
      color: CREAM,
      borderRadius: 8,
      padding: "20px 26px 22px",
      display: "flex",
      gap: 22,
      alignItems: "flex-start",
      ...rise(frame, 2, 8, 20),
    }}
  >
    <div
      style={{
        flex: "none",
        width: 64,
        height: 64,
        background: AMBER,
        color: TEAL,
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: DISPLAY_STACK,
        fontWeight: 900,
        fontSize: 42,
      }}
    >
      {note.n}
    </div>
    <div>
      <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 27, letterSpacing: 1.4, color: COLORS.dark_accent }}>
        EDIT {note.n} OF 3: {note.kind.toUpperCase()}
      </div>
      <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 700, fontSize: 40, lineHeight: 1.18, marginTop: 6 }}>{note.line}</div>
    </div>
  </div>
);

const EDIT_TEXT: CSSProperties = { ...TEXT, fontSize: 46, lineHeight: 1.36 };

const Gap: React.FC = () => <div style={{ ...EDIT_TEXT, color: MUTED, margin: "2px 0 10px" }}>…</div>;

const Tone: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", inset: 0, padding: `30px ${PAD}px` }}>
    <div style={EDIT_TEXT}>
      <div style={{ marginBottom: 16 }}>{AI.greeting}</div>
      <div style={{ marginBottom: 12 }}>
        <Segs frame={frame} segs={[del(AI.toneOld, 12), keep(" "), ins(HUMAN.toneNew, 20, 22), keep(" …")]} />
      </div>
      <div style={{ marginTop: 34 }}>
        {AI.thanks}
        <br />
        <Segs frame={frame} segs={[del(AI.nameOld, 48), keep(" "), ins(HUMAN.nameNew, 54, 6)]} />
      </div>
    </div>
    <Note frame={frame} note={NOTES.tone} />
  </div>
);

const Fact: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", inset: 0, padding: `30px ${PAD}px` }}>
    <div style={EDIT_TEXT}>
      <div style={{ marginBottom: 16 }}>{AI.greeting}</div>
      <div style={{ marginBottom: 12 }}>
        <Segs frame={frame} segs={[acc(HUMAN.toneNew), keep(" "), del(AI.factOld, 12), keep(" "), ins(HUMAN.factNew, 22, 34)]} />
      </div>
      <Gap />
    </div>
    <Note frame={frame} note={NOTES.fact} />
  </div>
);

const PromiseBeat: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", inset: 0, padding: `30px ${PAD}px` }}>
    <div style={EDIT_TEXT}>
      <Gap />
      <div style={{ marginBottom: 16 }}>
        <Segs
          frame={frame}
          segs={[
            del(AI.promiseOld, 10),
            keep(" "),
            ins(HUMAN.promiseNew, 20, 34),
            keep(" "),
            keep(AI.callKeep),
            del(AI.callCut, 62),
            keep(AI.callEnd),
          ]}
        />
      </div>
    </div>
    <Note frame={frame} note={NOTES.promise} />
  </div>
);

const Rule: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: `0 ${PAD + 4}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 10,
    }}
  >
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 136, lineHeight: 1, color: INK, letterSpacing: -2, ...rise(frame, 0, 7, 24) }}>
      {RULE.line1}
    </div>
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 136, lineHeight: 1, color: RUST, letterSpacing: -2, ...rise(frame, 4, 7, 24) }}>
      {RULE.line2}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 44 }}>
      {RULE.parts.map((part, i) => (
        <div
          key={part}
          style={{
            fontFamily: BODY_STACK,
            fontWeight: 700,
            fontSize: 50,
            color: INK,
            display: "flex",
            alignItems: "center",
            gap: 22,
            ...rise(frame, 10 + i * 6, 7, 18),
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              flex: "none",
              background: TEAL,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24">
              <path d="M4 12.5l5 5L20 6" stroke={COLORS.dark_accent} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {part}
        </div>
      ))}
    </div>
  </div>
);

const Cta: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: `0 ${PAD}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      gap: 30,
    }}
  >
    <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 34, color: RUST, letterSpacing: 2, ...rise(frame, 4, 8, 16) }}>
      {CTA.kicker.toUpperCase()}
    </div>
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 900, fontSize: 100, lineHeight: 1, color: INK, ...rise(frame, 6, 8, 20) }}>
      {CTA.title}
    </div>
    <div
      style={{
        fontFamily: BODY_STACK,
        fontWeight: 800,
        fontSize: 46,
        color: "#FFFFFF",
        background: TEAL,
        padding: "16px 26px",
        borderRadius: 10,
        ...rise(frame, 10, 8, 16),
      }}
    >
      {CTA.url}
    </div>
    <div style={{ fontFamily: BODY_STACK, fontSize: 36, lineHeight: 1.3, color: INK, maxWidth: 720, ...rise(frame, 14, 8, 12) }}>
      {CTA.sub}
    </div>
    <div style={{ fontFamily: BODY_STACK, fontWeight: 800, fontSize: 42, color: INK, ...rise(frame, 16, 8, 12) }}>{CTA.phone}</div>
  </div>
);

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

const Stage: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: DESK,
      backgroundImage:
        `radial-gradient(circle at 50% 40%, rgba(255,253,249,0.9), rgba(236,228,218,0) 62%),` +
        `repeating-linear-gradient(0deg, rgba(34,28,21,0.035) 0 2px, transparent 2px 44px)`,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: SHEET_LEFT,
        width: 1080 - 2 * SHEET_LEFT,
        top: -40,
        bottom: -40,
        background: PAPER,
        boxShadow: "0 0 0 2px rgba(34,28,21,0.08), 0 30px 70px rgba(34,28,21,0.18)",
      }}
    />
    {children}
  </AbsoluteFill>
);

function within(frame: number, r: { start: number; end: number }) {
  return frame >= r.start && frame < r.end;
}

export const TrackedDraft: React.FC = () => {
  const frame = useCurrentFrame();
  const b = BEATS;
  let body: ReactNode;
  let mode: HeaderMode = { status: "Draft 1: AI", legend: false };
  let header = true;
  let bodyBg = PAPER;
  if (within(frame, b.hook)) {
    body = <Hook frame={frame - b.hook.start} />;
  } else if (within(frame, b.draft)) {
    body = <Draft frame={frame - b.draft.start} />;
  } else if (within(frame, b.tone)) {
    mode = { status: "Edit 1 of 3", legend: true };
    body = <Tone frame={frame - b.tone.start} />;
  } else if (within(frame, b.fact)) {
    mode = { status: "Edit 2 of 3", legend: true };
    body = <Fact frame={frame - b.fact.start} />;
  } else if (within(frame, b.promise)) {
    mode = { status: "Edit 3 of 3", legend: true };
    body = <PromiseBeat frame={frame - b.promise.start} />;
  } else if (within(frame, b.rule)) {
    mode = { status: "Ready to send", legend: false };
    body = <Rule frame={frame - b.rule.start} />;
  } else {
    header = false;
    body = <Cta frame={frame - b.cta.start} />;
  }
  return (
    <Stage>
      <BrandBar />
      <Doc mode={mode} header={header} bodyBg={bodyBg}>
        {body}
      </Doc>
      <CtaStrip />
    </Stage>
  );
};

/** The thumbnail: the hook, fully landed, in the same chrome. */
export const TrackedDraftThumb: React.FC = () => (
  <Stage>
    <BrandBar />
    <Doc mode={{ status: "Draft 1: AI", legend: false }}>
      <Hook frame={60} />
    </Doc>
    <CtaStrip />
  </Stage>
);
