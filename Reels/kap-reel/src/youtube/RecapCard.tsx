// The recap: the video's checks as a list that ticks off as the narration
// names each one. Two columns of up to four, so six items sit in one glance.
// The tick is the only motion: an empty square fills with the accent and the
// check draws in the onAccent color over 8 frames.

import { interpolate, useCurrentFrame } from "remotion";
import { Card, Reveal, bodyText, headline } from "./ChapterCard";
import { smallCaps } from "./Frame";
import { rise } from "./layout";
import type { YouTubeTheme } from "./theme";

const Tick: React.FC<{ theme: YouTubeTheme; at: number }> = ({ theme, at }) => {
  const frame = useCurrentFrame();
  const fill = rise(frame, at, 6);
  const draw = interpolate(frame, [at + 2, at + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const size = 44;
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 6,
        border: `3px solid ${fill > 0 ? theme.accent : theme.line}`,
        background: fill > 0 ? theme.accent : "transparent",
        opacity: fill > 0 ? 0.35 + 0.65 * fill : 1,
        boxSizing: "border-box",
        display: "grid",
        placeItems: "center",
      }}
    >
      <svg width={26} height={26} viewBox="0 0 26 26">
        <path
          d="M4 13.5 L10.5 20 L22 6.5"
          fill="none"
          stroke={theme.onAccent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      </svg>
    </div>
  );
};

export const RecapCard: React.FC<{
  theme: YouTubeTheme;
  label: string;
  title: string;
  items: { text: string; tickAt: number }[];
  at: number;
  note?: { text: string; at: number };
}> = ({ theme, label, title, items, at, note }) => {
  const rows = Math.ceil(items.length / 2);
  const columns = [items.slice(0, rows), items.slice(rows)];
  return (
    <Card theme={theme}>
      <Reveal at={at}>
        <div style={smallCaps(24, theme.accent)}>{label}</div>
      </Reveal>
      <Reveal at={at + 4} style={{ marginTop: 28 }}>
        <div style={headline(theme, 80)}>{title}</div>
      </Reveal>
      <Reveal at={at + 10} style={{ marginTop: 64, display: "flex", gap: 72 }}>
        {columns.map((col, c) => (
          <div
            key={c}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 34,
            }}
          >
            {col.map((item) => (
              <div
                key={item.text}
                style={{ display: "flex", alignItems: "flex-start", gap: 26 }}
              >
                <Tick theme={theme} at={item.tickAt} />
                <div style={{ ...bodyText(theme, 38), marginTop: -1 }}>
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        ))}
      </Reveal>
      {note ? (
        <Reveal at={note.at} style={{ marginTop: 64 }}>
          <div style={smallCaps(22, theme.muted)}>{note.text}</div>
        </Reveal>
      ) : null}
    </Card>
  );
};
