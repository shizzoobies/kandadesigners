// Cards: the stage turned into a page of type. Fixed shape and motion across
// videos, colors from the theme.
//
//   Card        the surface, with the card margins
//   Reveal      the one entrance every card element uses (fade and a 16 px rise)
//   ChapterCard label, headline, optional lines and a note
//   CheckCard   ChapterCard for "Check 3 · Tab order", with a six-step progress rule
//
// Labels are small caps interpunct lines, never pills. Times are beat frames.

import type { ReactNode } from "react";
import { useCurrentFrame } from "remotion";
import { BODY, DISPLAY, MONO } from "./fonts";
import { CARD_PAD_X, STAGE, rise } from "./layout";
import { STAGE_RADIUS, smallCaps } from "./Frame";
import type { YouTubeTheme } from "./theme";

export const Card: React.FC<{
  theme: YouTubeTheme;
  children: ReactNode;
  align?: "center" | "top";
}> = ({ theme, children, align = "center" }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: theme.surface,
      borderRadius: STAGE_RADIUS,
      padding: `${align === "top" ? 104 : 0}px ${CARD_PAD_X}px`,
      display: "flex",
      flexDirection: "column",
      justifyContent: align === "top" ? "flex-start" : "center",
    }}
  >
    {children}
  </div>
);

export const Reveal: React.FC<{
  at: number;
  children: ReactNode;
  style?: React.CSSProperties;
}> = ({ at, children, style }) => {
  const frame = useCurrentFrame();
  const p = rise(frame, at, 12);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const headline = (
  theme: YouTubeTheme,
  size = 96,
): React.CSSProperties => ({
  fontFamily: DISPLAY,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1.04,
  letterSpacing: "-0.025em",
  color: theme.ink,
  maxWidth: STAGE.w - CARD_PAD_X * 2,
  textWrap: "balance",
});

export const bodyText = (
  theme: YouTubeTheme,
  size = 40,
): React.CSSProperties => ({
  fontFamily: BODY,
  fontWeight: 500,
  fontSize: size,
  lineHeight: 1.3,
  color: theme.ink,
});

export type CardLine = { text: string; at: number; lead?: string };

export const ChapterCard: React.FC<{
  theme: YouTubeTheme;
  label: string;
  title: string;
  /** Frame the card starts; the label comes in on it and the title 4 frames later. */
  at: number;
  titleAt?: number;
  titleSize?: number;
  lines?: CardLine[];
  note?: { text: string; at: number };
  footer?: ReactNode;
}> = ({
  theme,
  label,
  title,
  at,
  titleAt,
  titleSize = 96,
  lines = [],
  note,
  footer,
}) => (
  <Card theme={theme}>
    <Reveal at={at}>
      <div style={smallCaps(24, theme.accent)}>{label}</div>
    </Reveal>
    <Reveal at={titleAt ?? at + 4} style={{ marginTop: 34 }}>
      <div style={headline(theme, titleSize)}>{title}</div>
    </Reveal>
    {lines.length > 0 ? (
      <div
        style={{
          marginTop: 56,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {lines.map((l) => (
          <Reveal
            key={l.text}
            at={l.at}
            style={{ display: "flex", alignItems: "baseline", gap: 30 }}
          >
            {l.lead ? (
              <div
                style={{
                  fontFamily: MONO,
                  fontWeight: 600,
                  fontSize: 30,
                  color: theme.accent,
                  minWidth: 110,
                }}
              >
                {l.lead}
              </div>
            ) : null}
            <div style={bodyText(theme, 42)}>{l.text}</div>
          </Reveal>
        ))}
      </div>
    ) : null}
    {note ? (
      <Reveal at={note.at} style={{ marginTop: 56 }}>
        <div style={smallCaps(22, theme.muted)}>{note.text}</div>
      </Reveal>
    ) : null}
    {footer}
  </Card>
);

/** Six short rules under a check's headline: done and current filled, the rest hairline. */
const CheckProgress: React.FC<{
  theme: YouTubeTheme;
  n: number;
  of: number;
  at: number;
}> = ({ theme, n, of, at }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ marginTop: 72, display: "flex", gap: 12 }}>
      {Array.from({ length: of }, (_, i) => {
        const filled = i < n;
        const p = filled ? rise(frame, at + i * 2, 10) : 1;
        return (
          <div
            key={i}
            style={{
              width: 88,
              height: 8,
              background: theme.line,
              position: "relative",
            }}
          >
            {filled ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: theme.accent,
                  transformOrigin: "0 50%",
                  transform: `scaleX(${p})`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export const CheckCard: React.FC<{
  theme: YouTubeTheme;
  n: number;
  of?: number;
  /** "Skip link": set after the number as "Check 1 · Skip link". */
  name: string;
  title: string;
  at: number;
}> = ({ theme, n, of = 6, name, title, at }) => (
  <ChapterCard
    theme={theme}
    label={`Check ${n} · ${name}`}
    title={title}
    at={at}
    titleSize={108}
    footer={<CheckProgress theme={theme} n={n} of={of} at={at + 10} />}
  />
);
