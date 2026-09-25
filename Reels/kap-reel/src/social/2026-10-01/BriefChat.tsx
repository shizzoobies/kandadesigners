import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame } from "remotion";
import { BODY_STACK, COLORS, DISPLAY_STACK, LOGO_PNG } from "../../lib/brand";
import { centeredBox, safeArea } from "../../lib/layout";
import {
  BEATS,
  CTA,
  HOOK,
  REPLY_HEADER,
  RULE,
  STRONG,
  URL_HOME,
  URL_CTA,
  INPUT_LABEL,
  WEAK,
  type Exchange,
} from "./content";

// Layout. Everything sits inside safeArea("vertical"): y 288 to 1536, x 0 to
// 972, with the window centered on the canvas (108 to 972, centeredBox).
const SAFE = safeArea("vertical");
const BOX = centeredBox("vertical", 864);
const WIN_TOP = SAFE.top + 6;
const WIN_BOTTOM = SAFE.bottom - 6;
const TITLE_H = 112;
const INPUT_H = 132;
const BODY_PAD = 28;

const TEAL_DEEP = COLORS.dark_canvas; // #0B302D
const TEAL_SURF = COLORS.dark_surface; // #134E4A
const TEAL_ACC = COLORS.dark_accent; // #5EEAD4
const CREAM = COLORS.canvas;
const INK = COLORS.ink;
const RUST = COLORS.accent;
const AMBER = COLORS.amber;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.out(Easing.cubic);

const rise = (frame: number, at: number, dur = 8, dist = 24): CSSProperties => {
  const p = interpolate(frame, [at, at + dur], [0, 1], { ...clamp, easing: ease });
  return { opacity: p, transform: `translateY(${(1 - p) * dist}px)` };
};

// ---------------------------------------------------------------------------
// Chrome: the K&A window around every beat
// ---------------------------------------------------------------------------

const TitleBar: React.FC = () => (
  <div
    style={{
      height: TITLE_H,
      background: CREAM,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      borderBottom: `4px solid ${RUST}`,
    }}
  >
    <Img src={LOGO_PNG} style={{ height: 70, width: "auto" }} />
    <div
      style={{
        fontFamily: BODY_STACK,
        fontWeight: 700,
        fontSize: 38,
        color: INK,
        letterSpacing: 0.2,
      }}
    >
      {URL_HOME}
    </div>
  </div>
);

const InputBar: React.FC<{ typing?: string; caret?: boolean }> = ({ typing, caret }) => (
  <div
    style={{
      height: INPUT_H,
      padding: "18px 24px 22px",
      background: TEAL_DEEP,
      borderTop: `2px solid ${TEAL_SURF}`,
      display: "flex",
      alignItems: "center",
      gap: 18,
    }}
  >
    <div
      style={{
        flex: 1,
        height: "100%",
        border: `3px solid ${TEAL_ACC}`,
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 22px",
        overflow: "hidden",
      }}
    >
      {typing !== undefined ? (
        <div style={{ fontFamily: BODY_STACK, fontSize: 34, color: CREAM, whiteSpace: "nowrap" }}>
          {typing}
          {caret ? <span style={{ color: TEAL_ACC }}>|</span> : null}
        </div>
      ) : (
        <>
          <div style={{ fontFamily: BODY_STACK, fontSize: 26, fontWeight: 600, color: TEAL_ACC, letterSpacing: 1 }}>
            {INPUT_LABEL.toUpperCase()}
          </div>
          <div style={{ fontFamily: BODY_STACK, fontSize: 36, fontWeight: 700, color: CREAM }}>
            {URL_CTA}
          </div>
        </>
      )}
    </div>
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: 14,
        background: TEAL_ACC,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24">
        <path d="M5 12h13M12 5l7 7-7 7" stroke={TEAL_DEEP} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  </div>
);

const Window: React.FC<{ children: ReactNode; bodyBg?: string }> = ({ children, bodyBg = TEAL_SURF }) => (
  <div
    style={{
      position: "absolute",
      left: BOX.left,
      width: BOX.width,
      top: WIN_TOP,
      height: WIN_BOTTOM - WIN_TOP,
      borderRadius: 28,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
      border: `2px solid rgba(94,234,212,0.35)`,
    }}
  >
    <TitleBar />
    <div style={{ flex: 1, background: bodyBg, position: "relative", overflow: "hidden" }}>{children}</div>
    <InputBar />
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
      padding: `0 ${BODY_PAD + 20}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 40,
    }}
  >
    <div
      style={{
        fontFamily: BODY_STACK,
        fontSize: 34,
        fontWeight: 700,
        color: TEAL_ACC,
        letterSpacing: 2,
      }}
    >
      AI TIP FOR BUSINESS OWNERS
    </div>
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 96, lineHeight: 1.04, color: CREAM }}>
      {HOOK.first}
    </div>
    <div
      style={{
        fontFamily: DISPLAY_STACK,
        fontWeight: 800,
        fontSize: 96,
        lineHeight: 1.04,
        color: TEAL_ACC,
        ...rise(frame, HOOK.secondIn, 8, 40),
      }}
    >
      {HOOK.second}
    </div>
  </div>
);

/** Words revealed so far out of `text`, by fraction p. */
function streamText(text: string, p: number): string {
  if (p >= 1) return text;
  const words = text.split(/(\s+)/);
  const count = Math.floor(words.length * p);
  return words.slice(0, count).join("");
}

function withHighlights(text: string, phrases: string[], on: number): ReactNode {
  if (phrases.length === 0 || on <= 0) return text;
  const out: ReactNode[] = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    let hit: { i: number; p: string } | null = null;
    for (const p of phrases) {
      const i = rest.indexOf(p);
      if (i >= 0 && (hit === null || i < hit.i)) hit = { i, p };
    }
    if (!hit) {
      out.push(rest);
      break;
    }
    out.push(rest.slice(0, hit.i));
    out.push(
      <span
        key={key++}
        style={{
          backgroundImage: "linear-gradient(rgba(217,119,6,0.32), rgba(217,119,6,0.32))",
          backgroundRepeat: "no-repeat",
          backgroundSize: `${on * 100}% 100%`,
          backgroundPosition: "0 0",
          fontWeight: 700,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {hit.p}
      </span>,
    );
    rest = rest.slice(hit.i + hit.p.length);
  }
  return out;
}

const ChatBeat: React.FC<{ frame: number; ex: Exchange; index: number }> = ({ frame, ex, index }) => {
  const [t0, t1] = ex.typeIn;
  const [s0, s1] = ex.streamIn;
  const typedChars = Math.round(interpolate(frame, [t0, t1], [0, ex.prompt.length], clamp));
  const typing = frame < t1 + 4;
  const promptShown = ex.prompt.slice(0, typedChars);

  // The reply streams as one text: subject first, then the paragraphs.
  const full = [ex.subject, ...ex.paragraphs];
  const totalLen = full.join(" ").length;
  const p = interpolate(frame, [s0, s1], [0, 1], clamp);
  let budget = Math.floor(totalLen * p);
  const shown = full.map((para) => {
    const take = Math.max(0, Math.min(para.length, budget));
    budget -= para.length + 1;
    return take >= para.length ? para : streamText(para, take / para.length);
  });
  const thinking = frame >= t1 + 2 && frame < s0;
  const replyOn = frame >= s0;
  const hl = interpolate(frame, [s1 + 4, s1 + 16], [0, 1], clamp);
  const verdictStyle = rise(frame, ex.verdictIn, 8, 16);
  const strong = index === 2;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: `22px ${BODY_PAD}px`,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Beat label row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <div
            style={{
              fontFamily: DISPLAY_STACK,
              fontWeight: 800,
              fontSize: 44,
              color: strong ? TEAL_ACC : CREAM,
            }}
          >
            {index}. {ex.label}
          </div>
        </div>
        {ex.tag ? (
          <div
            style={{
              position: "absolute",
              right: BODY_PAD,
              top: 30,
              fontFamily: BODY_STACK,
              fontWeight: 700,
              fontSize: 32,
              color: TEAL_DEEP,
              background: COLORS.dark_muted,
              padding: "6px 16px",
              borderRadius: 8,
              opacity: 1 - (verdictStyle.opacity as number),
            }}
          >
            {ex.tag}
          </div>
        ) : null}
        <div
          style={{
            background: strong ? TEAL_ACC : AMBER,
            color: TEAL_DEEP,
            fontFamily: DISPLAY_STACK,
            fontWeight: 800,
            fontSize: 40,
            padding: "6px 20px",
            borderRadius: 8,
            ...verdictStyle,
          }}
        >
          {strong ? "✓ " : "✕ "}
          {ex.verdict}
        </div>
      </div>

      {/* User prompt */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "88%",
            background: RUST,
            color: "#FFFFFF",
            borderRadius: "22px 22px 6px 22px",
            padding: "18px 26px",
            fontFamily: BODY_STACK,
            fontWeight: 600,
            fontSize: 44,
            lineHeight: 1.22,
            minHeight: 54,
          }}
        >
          {promptShown}
          {typing ? <span style={{ opacity: Math.floor(frame / 6) % 2 ? 0.2 : 1 }}>|</span> : null}
        </div>
      </div>

      {/* Thinking dots */}
      {thinking ? (
        <div style={{ display: "flex", gap: 12, padding: "12px 8px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: TEAL_ACC,
                opacity: 0.35 + 0.65 * (Math.floor(frame / 3 + i) % 3 === 0 ? 1 : 0),
              }}
            />
          ))}
        </div>
      ) : null}

      {/* AI reply */}
      {replyOn ? (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div
            style={{
              width: "94%",
              background: "#FFFDF9",
              color: INK,
              borderRadius: "22px 22px 22px 6px",
              padding: "18px 26px 22px",
              fontFamily: BODY_STACK,
              fontSize: 36,
              lineHeight: 1.3,
              border: strong && hl > 0 ? `4px solid ${TEAL_ACC}` : "4px solid transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 26,
                fontWeight: 700,
                color: COLORS.muted,
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: 5, background: TEAL_SURF }} />
              {ex.tag ? `${REPLY_HEADER}. ${ex.tag}` : REPLY_HEADER}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>
              {shown[0] ? `Subject: ${shown[0]}` : ""}
            </div>
            {shown.slice(1).map((para, i) =>
              para ? (
                <div key={i} style={{ marginBottom: 10, whiteSpace: "pre-line" }}>
                  {withHighlights(para, ex.highlights, hl)}
                </div>
              ) : null,
            )}
          </div>
        </div>
      ) : null}

    </div>
  );
};

const Rule: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: `0 ${BODY_PAD + 20}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 34,
    }}
  >
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 100, lineHeight: 1.02, color: CREAM, ...rise(frame, 0, 7, 30) }}>
      Give it the <span style={{ color: TEAL_ACC }}>brief</span>, not the task.
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {RULE.parts.map((part, i) => (
        <div
          key={part}
          style={{
            fontFamily: BODY_STACK,
            fontWeight: 700,
            fontSize: 50,
            color: CREAM,
            display: "flex",
            alignItems: "center",
            gap: 18,
            ...rise(frame, 8 + i * 6, 7, 20),
          }}
        >
          <div style={{ width: 18, height: 18, background: AMBER }} />
          {part}
        </div>
      ))}
    </div>
    <div style={{ fontFamily: BODY_STACK, fontSize: 38, lineHeight: 1.3, color: COLORS.dark_muted, ...rise(frame, 26, 8, 16) }}>
      {RULE.tie}
    </div>
  </div>
);

const Cta: React.FC<{ frame: number }> = ({ frame }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      padding: `0 ${BODY_PAD + 12}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      gap: 30,
    }}
  >
    <Img src={LOGO_PNG} style={{ width: 560, height: "auto", ...rise(frame, 0, 8, 20) }} />
    <div style={{ fontFamily: BODY_STACK, fontWeight: 700, fontSize: 34, color: RUST, letterSpacing: 2, ...rise(frame, 4, 8, 16) }}>
      {CTA.kicker.toUpperCase()}
    </div>
    <div style={{ fontFamily: DISPLAY_STACK, fontWeight: 800, fontSize: 104, lineHeight: 1, color: INK, ...rise(frame, 6, 8, 20) }}>
      {CTA.title}
    </div>
    <div
      style={{
        fontFamily: BODY_STACK,
        fontWeight: 700,
        fontSize: 46,
        color: "#FFFFFF",
        background: RUST,
        padding: "16px 26px",
        borderRadius: 12,
        ...rise(frame, 10, 8, 16),
      }}
    >
      {CTA.url}
    </div>
    <div style={{ fontFamily: BODY_STACK, fontSize: 36, lineHeight: 1.3, color: INK, maxWidth: 720, ...rise(frame, 14, 8, 12) }}>
      {CTA.sub}
    </div>
    <div style={{ fontFamily: BODY_STACK, fontWeight: 700, fontSize: 40, color: INK, ...rise(frame, 16, 8, 12) }}>
      {CTA.phone}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------

const Stage: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      backgroundColor: TEAL_DEEP,
      backgroundImage:
        `radial-gradient(circle at 50% 42%, rgba(94,234,212,0.16), rgba(11,48,45,0) 60%),` +
        `radial-gradient(rgba(240,247,245,0.07) 2px, transparent 2px)`,
      backgroundSize: "100% 100%, 36px 36px",
    }}
  >
    {children}
  </AbsoluteFill>
);

function within(frame: number, r: { start: number; end: number }) {
  return frame >= r.start && frame < r.end;
}

export const BriefChat: React.FC = () => {
  const frame = useCurrentFrame();
  const b = BEATS;
  let body: ReactNode;
  let bodyBg = TEAL_SURF;
  if (within(frame, b.hook)) body = <Hook frame={frame - b.hook.start} />;
  else if (within(frame, b.weak)) body = <ChatBeat frame={frame - b.weak.start} ex={WEAK} index={1} />;
  else if (within(frame, b.strong)) body = <ChatBeat frame={frame - b.strong.start} ex={STRONG} index={2} />;
  else if (within(frame, b.rule)) body = <Rule frame={frame - b.rule.start} />;
  else {
    bodyBg = CREAM;
    body = <Cta frame={frame - b.cta.start} />;
  }
  return (
    <Stage>
      <Window bodyBg={bodyBg}>{body}</Window>
    </Stage>
  );
};

/** The thumbnail: the hook, fully landed, in the same chrome. */
export const BriefChatThumb: React.FC = () => (
  <Stage>
    <Window>
      <Hook frame={60} />
    </Window>
  </Stage>
);

