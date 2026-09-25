import type { CSSProperties } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticText } from "../../components/KineticText";
import { BODY_STACK, COLORS } from "../../lib/brand";
import type { FormatKey } from "../../lib/layout";
import { demoBox } from "../scenes/FlatDemo";
import { MONO_STACK } from "../scenes/contrast/mono";
import {
  GOOD_OUTPUT_SHOWN,
  GOOD_PROMPT,
  OUTPUTS_CREDIT,
  WEAK_OUTPUT,
  WEAK_PROMPT,
  type ModelOutput,
} from "./prompts";
import {
  GOOD_OUTPUT_REVEAL,
  PROMPTS_IN,
  WEAK_OUTPUT_REVEAL,
  goodOutputStart,
  weakOutputStart,
} from "./timing";
import { briefWords } from "./voice-data";

/**
 * The weak prompt and the good prompt side by side, and under each the output
 * it really got.
 *
 * One board in two states, so the cut from the "weak" beat to the "good" beat
 * moves nothing: the two prompt cards slam on the first frame of "weak" and
 * stay, the weak output writes itself in under the left card as the verdict
 * starts, and in "good" the right card takes the accent and the good output
 * streams in under it, finishing as the line that judges it begins.
 *
 * What is typed and what came back look different on purpose. The prompts are
 * set in Lenia Mono on the teal dark surface, the way a line typed into a tool
 * looks; the outputs are set in Atkinson on canvas cards, the way an email
 * reads. Every word of both outputs is the model's, from
 * source/prompt-run.md via prompts.ts, and the line under them says so.
 *
 * Cards, not pills: an 8 pixel radius, the same as the caption card. Labels
 * are small caps lines, the only label shape this project allows.
 */

export type PromptBoardProps = {
  format: FormatKey;
  stage: "weak" | "good";
  /** The small caps line naming the fictional business. "example". */
  label?: string;
};

const RADIUS = 8;
const GAP = 24;
const SMALL_CAPS = 17;
const PROMPT_SIZE = 27;
const OUTPUT_SIZE = 23;

function smallCaps(color: string, size: number): CSSProperties {
  return {
    fontFamily: BODY_STACK,
    fontSize: size,
    fontWeight: 700,
    letterSpacing: size * 0.14,
    textTransform: "uppercase",
    color,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}

/**
 * Text that writes itself in a character at a time, laid out at its final size
 * from the first frame: hidden characters keep their boxes, so nothing reflows
 * while it streams. `shown` is how many characters are visible.
 */
const Streamed: React.FC<{ text: string; shown: number; style?: CSSProperties }> = ({
  text,
  shown,
  style,
}) => {
  if (shown >= text.length) return <div style={style}>{text}</div>;
  return (
    <div style={style}>
      <span>{text.slice(0, Math.max(0, shown))}</span>
      <span style={{ visibility: "hidden" }}>{text.slice(Math.max(0, shown))}</span>
    </div>
  );
};

/** An output card: the subject line, then the paragraphs, streamed as one text. */
const OutputCard: React.FC<{
  output: ModelOutput;
  heading: string;
  label?: string;
  /** 0 to 1: how much of the text has arrived. Under 0 the card is not drawn. */
  progress: number;
  scale: number;
}> = ({ output, heading, label, progress, scale }) => {
  const parts = [`Subject: ${output.subject}`, ...output.paragraphs];
  const total = parts.reduce((n, p) => n + p.length, 0);
  let budget = progress < 0 ? 0 : Math.floor(total * Math.min(1, progress));
  const fontSize = Math.round(OUTPUT_SIZE * scale);

  return (
    <div
      style={{
        visibility: progress < 0 ? "hidden" : "visible",
        backgroundColor: COLORS.canvas,
        borderRadius: Math.round(RADIUS * scale),
        padding: `${Math.round(18 * scale)}px ${Math.round(22 * scale)}px ${Math.round(22 * scale)}px`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: Math.round(12 * scale),
        }}
      >
        <div style={smallCaps(COLORS.muted, Math.round(SMALL_CAPS * scale))}>{heading}</div>
        {label ? (
          <div style={smallCaps(COLORS.accent, Math.round(SMALL_CAPS * scale))}>{label}</div>
        ) : null}
      </div>
      {parts.map((part, i) => {
        const shown = budget;
        budget -= part.length;
        return (
          <Streamed
            key={`${i}-${part.slice(0, 12)}`}
            text={part}
            shown={shown}
            style={{
              fontFamily: BODY_STACK,
              fontSize,
              fontWeight: i === 0 ? 700 : 400,
              lineHeight: 1.34,
              color: COLORS.ink,
              whiteSpace: "pre-line",
              marginTop: i === 0 ? 0 : Math.round(10 * scale),
            }}
          />
        );
      })}
    </div>
  );
};

const PromptCard: React.FC<{
  text: string;
  heading: string;
  label?: string;
  active: boolean;
  scale: number;
}> = ({ text, heading, label, active, scale }) => (
  <div
    style={{
      flex: 1,
      minWidth: 0,
      backgroundColor: COLORS.dark_surface,
      borderRadius: Math.round(RADIUS * scale),
      padding: `${Math.round(18 * scale)}px ${Math.round(22 * scale)}px ${Math.round(24 * scale)}px`,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: Math.round(14 * scale),
      }}
    >
      <div style={smallCaps(active ? COLORS.amber : COLORS.dark_muted, Math.round(SMALL_CAPS * scale))}>
        {heading}
      </div>
      {label ? (
        <div style={smallCaps(COLORS.dark_accent, Math.round(SMALL_CAPS * scale))}>{label}</div>
      ) : null}
    </div>
    <KineticText
      text={text}
      mode="slam"
      startFrame={PROMPTS_IN}
      style={{
        fontFamily: MONO_STACK,
        fontSize: Math.round(PROMPT_SIZE * scale),
        fontWeight: 600,
        lineHeight: 1.32,
        color: COLORS.dark_ink,
      }}
    />
  </div>
);

export const PromptBoard: React.FC<PromptBoardProps> = ({ format, stage, label }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const box = demoBox(format);
  const scale = box.scale;

  // How far each output has arrived. In "good" the weak output is complete.
  const weakStart = stage === "weak" ? weakOutputStart(briefWords("weak"), durationInFrames) : -1;
  const goodStart = stage === "good" ? goodOutputStart(briefWords("good"), durationInFrames) : -1;
  const weakProgress =
    stage === "good" ? 1 : frame < weakStart ? -1 : (frame - weakStart + 1) / WEAK_OUTPUT_REVEAL;
  const goodProgress =
    stage === "weak" ? -1 : frame < goodStart ? -1 : (frame - goodStart + 1) / GOOD_OUTPUT_REVEAL;

  // In "good" the weak column steps back a little, so the eye goes right.
  const weakOpacity = stage === "good" ? 0.72 : 1;
  const gap = Math.round(GAP * scale);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          display: "flex",
          flexDirection: "column",
          // The whole board is laid out from the first frame (what has not
          // arrived is hidden, not absent), so centering it never moves it.
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", gap, alignItems: "stretch" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", opacity: weakOpacity }}>
            <PromptCard text={WEAK_PROMPT} heading="The task" active={stage === "weak"} scale={scale} />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex" }}>
            <PromptCard
              text={GOOD_PROMPT}
              heading="The brief"
              label={label}
              active={stage === "good"}
              scale={scale}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap, alignItems: "flex-start", marginTop: gap }}>
          <div style={{ flex: 1, minWidth: 0, opacity: weakOpacity }}>
            <OutputCard output={WEAK_OUTPUT} heading="Output, in full" progress={weakProgress} scale={scale} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <OutputCard
              output={GOOD_OUTPUT_SHOWN}
              heading="Output, first two paragraphs"
              label={undefined}
              progress={goodProgress}
              scale={scale}
            />
          </div>
        </div>

        <div
          style={{
            marginTop: Math.round(22 * scale),
            textAlign: "center",
            visibility: weakProgress < 0 ? "hidden" : "visible",
            ...smallCaps(COLORS.dark_muted, Math.round(18 * scale)),
          }}
        >
          {OUTPUTS_CREDIT}
        </div>
      </div>
    </AbsoluteFill>
  );
};
