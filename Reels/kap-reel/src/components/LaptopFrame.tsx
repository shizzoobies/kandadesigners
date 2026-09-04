import type { CSSProperties, ReactNode } from "react";

/**
 * Bezel thickness as a fraction of the screen width, and the floor under it.
 * The phone's 20 on a 780 wide screen is 2.6 percent; a laptop lid reads
 * thinner than a phone body, so this is a little under two.
 */
export const LAPTOP_BEZEL_RATIO = 0.018;
export const LAPTOP_BEZEL_MIN = 8;

/** Outer corner radius of the lid, as a fraction of the screen width. */
export const LAPTOP_RADIUS_RATIO = 0.016;
export const LAPTOP_RADIUS_MIN = 10;

/**
 * The base below the lid: the hinge and the keyboard deck seen head on, as a
 * flat slab. Height is a fraction of the screen height, width a fraction over
 * the lid's own width so the deck reads as sitting under the screen rather than
 * being part of it.
 */
export const LAPTOP_BASE_RATIO = 0.045;
export const LAPTOP_BASE_MIN = 10;
export const LAPTOP_BASE_OVERHANG = 1.06;

/** Same body colour and same drop shadow as DeviceFrame's phone. */
const BODY = "#100D0A";
const SHADOW = "0 40px 90px rgba(0, 0, 0, 0.45)";
const TOP_EDGE = "rgba(255, 255, 255, 0.16)";
const CAMERA = "rgba(255, 255, 255, 0.30)";
const DECK_HIGHLIGHT = "rgba(255, 255, 255, 0.12)";

export type LaptopGeometry = {
  bezel: number;
  radius: number;
  lidWidth: number;
  lidHeight: number;
  baseWidth: number;
  baseHeight: number;
  /** Outer size of the whole device, base overhang included. */
  frameWidth: number;
  frameHeight: number;
};

/**
 * The laptop's outer size for a given screen, so a caller can fit the device
 * into a box before rendering it. ProjectShowcase solves its screen width
 * against this rather than restating the ratios, which is the mistake the
 * browser window's geometry made.
 */
export function laptopGeometry(
  screenWidth: number,
  screenHeight: number,
  overrides: { bezel?: number; radius?: number } = {},
): LaptopGeometry {
  const bezel =
    overrides.bezel ??
    Math.max(LAPTOP_BEZEL_MIN, Math.round(screenWidth * LAPTOP_BEZEL_RATIO));
  const radius =
    overrides.radius ??
    Math.max(LAPTOP_RADIUS_MIN, Math.round(screenWidth * LAPTOP_RADIUS_RATIO));
  const lidWidth = screenWidth + bezel * 2;
  const lidHeight = screenHeight + bezel * 2;
  const baseHeight = Math.max(
    LAPTOP_BASE_MIN,
    Math.round(screenHeight * LAPTOP_BASE_RATIO),
  );
  const baseWidth = Math.round(lidWidth * LAPTOP_BASE_OVERHANG);

  return {
    bezel,
    radius,
    lidWidth,
    lidHeight,
    baseWidth,
    baseHeight,
    frameWidth: baseWidth,
    frameHeight: lidHeight + baseHeight,
  };
}

export type LaptopFrameProps = {
  /** Screen size in canvas pixels. Match the shot's aspect to avoid a crop. */
  screenWidth: number;
  screenHeight: number;
  /** Bezel thickness around the screen. */
  bezel?: number;
  /** Outer corner radius of the lid. */
  radius?: number;
  children: ReactNode;
  style?: CSSProperties;
};

/**
 * A laptop, in the same visual family as DeviceFrame's phone: the same dark ink
 * body, the same drop shadow, the capture inside a screen with a small corner
 * radius. A thin lighter line along the top of the lid, a tiny camera dot
 * centred in the top bezel, and a flat rounded slab under the lid for the hinge
 * and the keyboard deck. No branding, no text, no gloss.
 *
 * It replaced BrowserFrame on 2026-09-04. The sketched window was a window and
 * nothing else, so a desktop shot floated in the frame while every other shot in
 * both reels sat in a phone or in a photographed device, and the owner read it
 * as out of place. A laptop is the device a 16:10 module screen actually lives
 * on, and it belongs to the same family as the phone rather than to the lockup.
 */
export const LaptopFrame: React.FC<LaptopFrameProps> = ({
  screenWidth,
  screenHeight,
  bezel,
  radius,
  children,
  style,
}) => {
  const g = laptopGeometry(screenWidth, screenHeight, { bezel, radius });
  const edge = Math.max(1, Math.round(g.lidWidth * 0.0018));
  const camera = Math.max(3, Math.round(g.bezel * 0.24));
  const deckLine = Math.max(1, Math.round(g.baseHeight * 0.09));

  return (
    <div
      style={{
        width: g.frameWidth,
        height: g.frameHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* The lid. */}
      <div
        style={{
          position: "relative",
          width: g.lidWidth,
          height: g.lidHeight,
          padding: g.bezel,
          borderRadius: g.radius,
          backgroundColor: BODY,
          boxShadow: SHADOW,
          boxSizing: "border-box",
        }}
      >
        {/* Thin lighter top edge, stopping short of the corners so it reads as
            a lit edge rather than as a border. */}
        <div
          style={{
            position: "absolute",
            left: g.radius,
            right: g.radius,
            top: 0,
            height: edge,
            backgroundColor: TOP_EDGE,
            borderRadius: edge,
          }}
        />

        {/* Camera, centred in the top bezel. */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: Math.round((g.bezel - camera) / 2),
            width: camera,
            height: camera,
            marginLeft: -camera / 2,
            borderRadius: "50%",
            backgroundColor: CAMERA,
          }}
        />

        <div
          style={{
            width: screenWidth,
            height: screenHeight,
            borderRadius: Math.max(Math.round(g.radius - g.bezel * 0.6), 4),
            overflow: "hidden",
            backgroundColor: "#000000",
          }}
        >
          {children}
        </div>
      </div>

      {/* The base: hinge and keyboard deck as one flat slab, a little wider than
          the lid, with a hairline highlight along the hinge. */}
      <div
        style={{
          position: "relative",
          width: g.baseWidth,
          height: g.baseHeight,
          backgroundColor: BODY,
          borderRadius: `${Math.round(g.baseHeight * 0.16)}px ${Math.round(
            g.baseHeight * 0.16,
          )}px ${Math.round(g.baseHeight * 0.55)}px ${Math.round(
            g.baseHeight * 0.55,
          )}px`,
          boxShadow: SHADOW,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: Math.round(g.baseWidth * 0.02),
            right: Math.round(g.baseWidth * 0.02),
            top: 0,
            height: deckLine,
            backgroundColor: DECK_HIGHLIGHT,
            borderRadius: deckLine,
          }}
        />
      </div>
    </div>
  );
};
