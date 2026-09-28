// The 20 second end screen, the same structure in every video: a line of text
// and a subscribe slot on the left, one video slot on the right.
//
// The slots are left empty and framed on purpose. YouTube draws its own end
// screen elements over them in Studio (a subscribe button and a video), so the
// picture only reserves the space and tells the viewer what the space is for.
// SLOTS below are in 1920x1080 frame pixels, for placing the elements.

import { Card, Reveal, headline } from "./ChapterCard";
import { smallCaps } from "./Frame";
import { CARD_PAD_X, STAGE } from "./layout";
import type { YouTubeTheme } from "./theme";

export { END_SCREEN_FRAMES } from "./timeline";

const VIDEO = { w: 768, h: 432 };
const DISC = 240;
const video = {
  x: STAGE.w - CARD_PAD_X - VIDEO.w,
  y: Math.round((STAGE.h - VIDEO.h) / 2),
};
const disc = { x: CARD_PAD_X, y: 520 };
/** The left column: the line and the subscribe slot. */
const COL_W = 470;

/** Where YouTube's elements go, in frame pixels. */
export const END_SCREEN_SLOTS = {
  video: { x: STAGE.x + video.x, y: STAGE.y + video.y, w: VIDEO.w, h: VIDEO.h },
  subscribe: { x: STAGE.x + disc.x, y: STAGE.y + disc.y, w: DISC, h: DISC },
};

export const EndScreen: React.FC<{
  theme: YouTubeTheme;
  label: string;
  title: string;
  videoLabel: string;
  at?: number;
}> = ({ theme, label, title, videoLabel, at = 0 }) => {
  const slot: React.CSSProperties = {
    position: "absolute",
    background: theme.bg,
    border: `2px solid ${theme.line}`,
    boxSizing: "border-box",
  };
  return (
    <Card theme={theme}>
      <div
        style={{
          position: "absolute",
          left: CARD_PAD_X,
          top: video.y - 46,
          width: COL_W,
        }}
      >
        <Reveal at={at}>
          <div style={smallCaps(24, theme.accent)}>{label}</div>
        </Reveal>
        <Reveal at={at + 4} style={{ marginTop: 28 }}>
          <div style={{ ...headline(theme, 68), maxWidth: COL_W }}>{title}</div>
        </Reveal>
      </div>

      <Reveal at={at + 8} style={{ position: "absolute", left: 0, top: 0 }}>
        <div
          style={{
            ...slot,
            left: disc.x,
            top: disc.y,
            width: DISC,
            height: DISC,
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            ...smallCaps(22, theme.muted),
            position: "absolute",
            left: disc.x + DISC + 34,
            top: disc.y + DISC / 2 - 11,
          }}
        >
          Subscribe
        </div>
      </Reveal>

      <Reveal at={at + 8} style={{ position: "absolute", left: 0, top: 0 }}>
        <div
          style={{
            ...smallCaps(22, theme.muted),
            position: "absolute",
            left: video.x,
            top: video.y - 46,
          }}
        >
          {videoLabel}
        </div>
        <div
          style={{
            ...slot,
            left: video.x,
            top: video.y,
            width: VIDEO.w,
            height: VIDEO.h,
            borderRadius: 10,
          }}
        />
      </Reveal>
    </Card>
  );
};
