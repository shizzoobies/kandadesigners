// The pressed key, drawn over a capture.
//
// The captures carry no key overlay of their own (capture README): every press
// is logged with the frame it landed on, and the overlay is drawn here from
// that log, so the keycap goes down on the exact frame the page reacts. One
// keycap per key in the press ("Shift", "Tab"), in the theme's key colors.

import { interpolate } from "remotion";
import { BODY } from "./fonts";
import { BOTTOM_RAIL, FPS, STAGE } from "./layout";
import type { YouTubeTheme } from "./theme";

/** A press on the shot's clock: seconds from the start of the beat. */
export type Press = { t: number; key: string };

const LEGENDS: Record<string, string[]> = {
  Tab: ["Tab"],
  "Shift+Tab": ["Shift", "Tab"],
  Enter: ["Enter"],
  Escape: ["Esc"],
  " ": ["Space"],
  Space: ["Space"],
};

export function legendFor(key: string): string[] {
  const legend = LEGENDS[key];
  if (!legend) throw new Error(`No keycap legend for key "${key}"`);
  return legend;
}

/**
 * One keycap. `pressed` runs 0 (up) to 1 (all the way down): the face drops and
 * its skirt shortens by the same amount, which reads as travel without any
 * other effect.
 */
export const KeyCap: React.FC<{
  label: string;
  theme: YouTubeTheme;
  height?: number;
  pressed?: number;
}> = ({ label, theme, height = 76, pressed = 0 }) => {
  const skirt = Math.round(height * 0.09);
  const travel = skirt * 0.7 * pressed;
  const wide = label === "Space";
  return (
    <div
      style={{
        height: height + skirt,
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          transform: `translateY(${travel}px)`,
          height,
          minWidth: wide ? height * 3.6 : height * 1.25,
          padding: `0 ${Math.round(height * 0.34)}px`,
          borderRadius: Math.round(height * 0.17),
          background: theme.key.face,
          border: `2px solid ${theme.key.edge}`,
          boxShadow: `0 ${skirt - travel}px 0 ${theme.key.edge}, 0 ${skirt + 10}px 28px ${theme.shadow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: Math.round(height * 0.4),
          letterSpacing: "0.01em",
          color: theme.key.legend,
          boxSizing: "border-box",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** How long a keycap stays up after its last press. */
const HOLD_S = 1.1;
/** A press this soon after the last one continues the same burst. */
const BURST_S = HOLD_S;

/** Keycap height in the bottom rail. */
const RAIL_KEY_H = 60;

/**
 * The overlay for a shot, at the right of the bottom rail, in stage coordinates.
 * `t` is the current time in seconds on the same clock as `presses`. Nothing
 * draws between bursts.
 */
export const KeyOverlay: React.FC<{
  presses: Press[];
  t: number;
  theme: YouTubeTheme;
}> = ({ presses, t, theme }) => {
  let idx = -1;
  for (let i = 0; i < presses.length; i += 1) if (presses[i].t <= t) idx = i;
  if (idx === -1) return null;
  const p = presses[idx];
  const since = t - p.t;
  if (since > HOLD_S) return null;

  // Fade in only at the first press of a burst; fade out at the burst's end.
  let burstStart = idx;
  while (
    burstStart > 0 &&
    presses[burstStart].t - presses[burstStart - 1].t <= BURST_S
  )
    burstStart -= 1;
  const fadeIn = interpolate(t - presses[burstStart].t, [0, 3 / FPS], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(since, [HOLD_S - 6 / FPS, HOLD_S], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Down for 3 frames, back up over 5.
  const pressed = interpolate(since, [0, 3 / FPS, 8 / FPS], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const legends = legendFor(p.key);
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: STAGE.h + Math.round((BOTTOM_RAIL.h - RAIL_KEY_H * 1.09) / 2),
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        opacity: Math.min(fadeIn, fadeOut),
      }}
    >
      {legends.map((label, i) => (
        // Shift is held, so only the last key in a chord travels.
        <KeyCap
          key={label}
          label={label}
          theme={theme}
          height={RAIL_KEY_H}
          pressed={i === legends.length - 1 ? pressed : 1}
        />
      ))}
    </div>
  );
};
