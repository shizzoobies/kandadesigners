import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { BODY_STACK } from "../lib/brand";
import { SAFE_ZONES, safeArea, type FormatKey } from "../lib/layout";

export type SafeZoneOverlayProps = {
  format: FormatKey;
};

/** Not brand colors on purpose. This overlay is a ruler, not a design element. */
const RED = "#FF2D2D";
const RED_FILL = "rgba(255, 45, 45, 0.26)";
const GREEN = "#22FF7A";

function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

const labelBase: CSSProperties = {
  fontFamily: BODY_STACK,
  fontWeight: 700,
  letterSpacing: 1,
  whiteSpace: "nowrap",
};

/**
 * Draws the reserved platform zones from layout.ts as translucent red blocks
 * with a hard red border, plus a green outline around the safe area. Wired to
 * the debugSafeZones prop on Reel and registered only on the four Debug
 * compositions. Nothing here ships in a delivered render.
 */
export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ format }) => {
  const spec = SAFE_ZONES[format];
  const safe = safeArea(format);
  const scale = spec.width / 1080;
  const labelSize = Math.round(28 * scale);
  const border = 2;

  const topHeight = safe.top;
  const bottomHeight = spec.height - safe.bottom;
  const rightWidth = spec.width - safe.right;

  return (
    <AbsoluteFill>
      {/* Top reserved */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: spec.width,
          height: topHeight,
          backgroundColor: RED_FILL,
          border: `${border}px solid ${RED}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ ...labelBase, fontSize: labelSize, color: RED }}>
          {`TOP RESERVED ${pct(spec.topReserved)} / ${topHeight}px`}
        </div>
      </div>

      {/* Bottom reserved */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: safe.bottom,
          width: spec.width,
          height: bottomHeight,
          backgroundColor: RED_FILL,
          border: `${border}px solid ${RED}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ ...labelBase, fontSize: labelSize, color: RED }}>
          {`BOTTOM RESERVED ${pct(spec.bottomReserved)} / ${bottomHeight}px`}
        </div>
      </div>

      {/* Right reserved. Full canvas height: layout.ts derives it from width
          alone, so it overlaps the top and bottom blocks by design. */}
      <div
        style={{
          position: "absolute",
          left: safe.right,
          top: 0,
          width: rightWidth,
          height: spec.height,
          backgroundColor: RED_FILL,
          border: `${border}px solid ${RED}`,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            ...labelBase,
            fontSize: labelSize,
            color: RED,
            writingMode: "vertical-rl",
          }}
        >
          {`RIGHT RESERVED ${pct(spec.rightReserved)} / ${rightWidth}px`}
        </div>
      </div>

      {/* Safe area outline */}
      <div
        style={{
          position: "absolute",
          left: safe.left,
          top: safe.top,
          width: safe.width,
          height: safe.height,
          border: `${border}px solid ${GREEN}`,
          boxSizing: "border-box",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: safe.left + Math.round(14 * scale),
          top: safe.top + Math.round(10 * scale),
          ...labelBase,
          fontSize: labelSize,
          color: GREEN,
        }}
      >
        {`SAFE ${format} ${safe.width} x ${safe.height}`}
      </div>
    </AbsoluteFill>
  );
};
