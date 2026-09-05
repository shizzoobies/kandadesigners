import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { DeviceFrame } from "../../components/DeviceFrame";
import {
  LaptopFrame,
  LAPTOP_SCREEN_ASPECT,
  laptopGeometry,
} from "../../components/LaptopFrame";
import { COLORS } from "../../lib/brand";
import {
  centeredBox,
  centeredPadding,
  formatMetrics,
  safeArea,
  SAFE_ZONES,
  type FormatKey,
} from "../../lib/layout";

/**
 * Which device the demo sits in.
 *
 * "auto" is what nearly every beat wants: a phone in the three 1080 wide crops
 * and a laptop in landscape, because that is the device the surface being
 * demonstrated actually lives on at that shape. "none" is a bare canvas card,
 * for a beat whose subject is a colour or a rule rather than a screen.
 */
export type DemoDevice = "auto" | "phone" | "laptop" | "none";

/** The box a demo may draw inside, in canvas pixels. */
export type DemoBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Type scale for this crop, so a scene's own sizes stay relative. */
  scale: number;
};

/**
 * Phone screen aspect, matching the mobile captures in assets/captures: 780 by
 * 1688. Used so a demo drawn in a phone and a real capture in a phone are the
 * same shape.
 */
const PHONE_SCREEN_ASPECT = 780 / 1688;

/**
 * Height reserved under the demo for the burned in caption card, authored at
 * 1080 canvas width.
 *
 * A two line card is about 158 pixels tall at 44px with its padding, and 40
 * pixels of air above it keeps the demo from sitting on the card. The demo
 * clears that whether or not the beat has a caption, so a captioned beat and an
 * uncaptioned one put their picture in the same place and a cut between them
 * does not shift the frame.
 */
const CAPTION_RESERVE = 198;

/**
 * The box every tutorial demo is laid out inside: the canvas centred copy box
 * horizontally, and the safe area less the caption reserve vertically.
 *
 * Exported because a Phase B scene that wants to place something against the
 * demo, and the QA harness that measures where it landed, both have to compute
 * the same rectangle. Nothing may centre a demo by hand.
 */
export function demoBox(format: FormatKey): DemoBox {
  const spec = SAFE_ZONES[format];
  const safe = safeArea(format);
  const metrics = formatMetrics(format);
  const scale = metrics.typeScale;
  const box = centeredBox(
    format,
    spec.width - centeredPadding(format, scale) * 2,
  );
  const bottom =
    spec.height - metrics.bandBottom - Math.round(CAPTION_RESERVE * scale);
  return {
    left: box.left,
    width: box.width,
    top: safe.top,
    height: Math.max(0, bottom - safe.top),
    scale,
  };
}

export type FlatDemoProps = {
  format: FormatKey;
  device?: DemoDevice;
  /**
   * The card's own ground. Canvas by default, which is the page colour both
   * tutorials are arguing about; "surface" for a demo that has to sit a card on
   * a card without the two touching.
   */
  ground?: string;
  /**
   * The demo itself. Given the pixel size of the area it may draw in, because a
   * scene laid out in percentages cannot keep a type size honest across six
   * crops and Section 7's minimum is a pixel rule.
   */
  children: ReactNode | ((size: DemoBox) => ReactNode);
};

/** Corner radius of the card, authored at 1080 wide. A card, not a pill. */
const CARD_RADIUS = 8;

/**
 * A canvas coloured card centred in the safe area that a tutorial scene draws
 * inside, phone shaped in the tall crops and laptop shaped in landscape.
 *
 * This is the shared ground the per tutorial scenes are built on, so a beat
 * about a headline and a beat about a colour sit in the same place at the same
 * size and a cut between them does not move the frame. The device is drawn with
 * the same DeviceFrame and LaptopFrame the showcase reels use, so a tutorial
 * mock and a real capture belong to one visual family.
 */
export const FlatDemo: React.FC<FlatDemoProps> = ({
  format,
  device = "auto",
  ground = COLORS.canvas,
  children,
}) => {
  const box = demoBox(format);
  const kind =
    device === "auto"
      ? formatMetrics(format).showcase === "split"
        ? "laptop"
        : "phone"
      : device;

  // The screen the demo is drawn on, solved against the box in both axes so
  // nothing is ever clipped by the safe area or by the reserved right strip.
  let screenWidth: number;
  let screenHeight: number;

  if (kind === "laptop") {
    // Solve by width first, then check the device's own outer height, which is
    // taller than the screen by the bezels and the deck.
    screenWidth = box.width;
    screenHeight = Math.round(screenWidth / LAPTOP_SCREEN_ASPECT);
    let g = laptopGeometry(screenWidth, screenHeight);
    if (g.frameHeight > box.height) {
      screenHeight = Math.round(screenHeight * (box.height / g.frameHeight));
      screenWidth = Math.round(screenHeight * LAPTOP_SCREEN_ASPECT);
      g = laptopGeometry(screenWidth, screenHeight);
    }
    if (g.frameWidth > box.width) {
      screenWidth = Math.round(screenWidth * (box.width / g.frameWidth));
      screenHeight = Math.round(screenWidth / LAPTOP_SCREEN_ASPECT);
    }
  } else if (kind === "phone") {
    // A phone is tall, so height is nearly always the binding constraint.
    const bezel = Math.round(20 * box.scale);
    screenHeight = box.height - bezel * 2;
    screenWidth = Math.round(screenHeight * PHONE_SCREEN_ASPECT);
    if (screenWidth + bezel * 2 > box.width) {
      screenWidth = box.width - bezel * 2;
      screenHeight = Math.round(screenWidth / PHONE_SCREEN_ASPECT);
    }
  } else {
    screenWidth = box.width;
    screenHeight = box.height;
  }

  const inner: DemoBox = {
    left: box.left,
    top: box.top,
    width: screenWidth,
    height: screenHeight,
    scale: box.scale,
  };
  const content = typeof children === "function" ? children(inner) : children;

  const surface = (
    <div
      style={{
        width: screenWidth,
        height: screenHeight,
        backgroundColor: ground,
        overflow: "hidden",
        borderRadius: kind === "none" ? Math.round(CARD_RADIUS * box.scale) : 0,
      }}
    >
      {content}
    </div>
  );

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {kind === "phone" ? (
          <DeviceFrame
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            bezel={Math.round(20 * box.scale)}
            radius={Math.round(64 * box.scale)}
          >
            {surface}
          </DeviceFrame>
        ) : kind === "laptop" ? (
          <LaptopFrame screenWidth={screenWidth} screenHeight={screenHeight}>
            {surface}
          </LaptopFrame>
        ) : (
          surface
        )}
      </div>
    </AbsoluteFill>
  );
};
