// A numbered list meant to be paused on and read: "what to ask your web person".
//
// Every item is on screen together from `allAt`, so a viewer who pauses at any
// point gets the whole list; nothing is dimmed, so every line keeps full body
// contrast. As the narration reaches each item a short accent rule moves to it.

import { useCurrentFrame } from "remotion";
import { DISPLAY } from "./fonts";
import { Card, Reveal, bodyText, headline } from "./ChapterCard";
import { smallCaps } from "./Frame";
import { rise } from "./layout";
import type { YouTubeTheme } from "./theme";

export const ChecklistCard: React.FC<{
  theme: YouTubeTheme;
  label: string;
  title: string;
  items: string[];
  /** Frame the card starts. */
  at: number;
  /** Frame the whole list is on screen. */
  allAt: number;
  /** Frame each item is read, for the marker. */
  readAt: number[];
}> = ({ theme, label, title, items, at, allAt, readAt }) => {
  const frame = useCurrentFrame();
  let active = -1;
  readAt.forEach((f, i) => {
    if (frame >= f) active = i;
  });
  return (
    <Card theme={theme}>
      <Reveal at={at}>
        <div style={smallCaps(24, theme.accent)}>{label}</div>
      </Reveal>
      <Reveal at={at + 4} style={{ marginTop: 28 }}>
        <div style={headline(theme, 72)}>{title}</div>
      </Reveal>
      <div
        style={{
          marginTop: 52,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {items.map((text, i) => {
          const on = i === active;
          const markIn = on ? rise(frame, readAt[i], 8) : 0;
          return (
            <Reveal
              key={text}
              at={allAt + i * 3}
              style={{ display: "flex", alignItems: "flex-start", gap: 28 }}
            >
              <div
                style={{
                  width: 6,
                  height: 46,
                  marginTop: 2,
                  background: theme.accent,
                  opacity: markIn,
                }}
              />
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 42,
                  lineHeight: 1.25,
                  color: theme.accent,
                  width: 36,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div style={{ ...bodyText(theme, 40), maxWidth: 1160 }}>
                {text}
              </div>
            </Reveal>
          );
        })}
      </div>
    </Card>
  );
};
