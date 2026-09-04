import type { CSSProperties, ReactNode } from "react";
import { COLORS } from "../lib/brand";

export type BrowserFrameProps = {
  /** Screen size in canvas pixels. Match the capture's aspect to avoid a crop. */
  screenWidth: number;
  screenHeight: number;
  /** Height of the title bar. Defaults to a proportion of the screen width. */
  chrome?: number;
  /** Hairline border thickness. */
  border?: number;
  /** Outer corner radius. */
  radius?: number;
  children: ReactNode;
  style?: CSSProperties;
};

/**
 * A thin sketched browser window, in the manner of the K&A lockup: a hairline
 * ink border on canvas, three small dots top left in rust, teal and ink, and
 * nothing else. No gradient title bar, no url field, no tab strip, no shadowed
 * chrome. The lockup on the live site is a drawn window and this is the same
 * drawing at video scale.
 *
 * DeviceFrame is the phone: a dark slab for a 780x1688 mobile capture. This is
 * its desktop twin, for the 2880x1800 16:10 interaction captures, which have
 * nowhere sensible to sit inside a phone body.
 *
 * Every default below is derived from the screen width, so one window looks
 * like the same window at 960 canvas pixels wide in the vertical crop and at
 * 1500 in landscape.
 */
export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  screenWidth,
  screenHeight,
  chrome,
  border,
  radius,
  children,
  style,
}) => {
  const barHeight = chrome ?? Math.max(24, Math.round(screenWidth * 0.05));
  const line = border ?? Math.max(2, Math.round(screenWidth * 0.0026));
  const corner = radius ?? Math.max(10, Math.round(screenWidth * 0.014));
  const dot = Math.max(6, Math.round(barHeight * 0.3));
  const gap = Math.round(dot * 0.9);

  return (
    <div
      style={{
        width: screenWidth + line * 2,
        height: screenHeight + barHeight + line * 2,
        border: `${line}px solid ${COLORS.ink}`,
        borderRadius: corner,
        backgroundColor: COLORS.canvas,
        boxSizing: "border-box",
        overflow: "hidden",
        boxShadow: "0 40px 90px rgba(0, 0, 0, 0.45)",
        ...style,
      }}
    >
      <div
        style={{
          height: barHeight,
          boxSizing: "border-box",
          borderBottom: `${line}px solid ${COLORS.ink}`,
          display: "flex",
          alignItems: "center",
          gap,
          paddingLeft: Math.round(dot * 1.8),
        }}
      >
        {[COLORS.accent, COLORS.dark_accent, COLORS.ink].map((color) => (
          <div
            key={color}
            style={{
              width: dot,
              height: dot,
              borderRadius: "50%",
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      <div
        style={{
          width: screenWidth,
          height: screenHeight,
          overflow: "hidden",
          backgroundColor: COLORS.ink,
        }}
      >
        {children}
      </div>
    </div>
  );
};
