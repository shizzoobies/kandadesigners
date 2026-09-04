import { AbsoluteFill, useCurrentFrame } from "remotion";
import { LogoDraw } from "../components/LogoDraw";
import { BODY_STACK, brand, COLORS } from "../lib/brand";
import {
  centeredBox,
  centeredPadding,
  formatMetrics,
  safeArea,
  SAFE_ZONES,
  type FormatKey,
} from "../lib/layout";
import type { ReelCut } from "../reels/types";

export type CallToActionProps = {
  format: FormatKey;
  /** Which cut this card is closing. Sets the draw length and the copy cue. */
  cut: ReelCut;
  /**
   * One line above the url. The LinkedIn cut of both reels closes on "Taking
   * new projects." rather than a hard sales line, which is a statement of
   * availability rather than an ask, and reads correctly on a company page
   * where the viewer is a peer rather than a customer. The training reel's 15
   * second cut closes on "Never the bottleneck.".
   */
  closingLine?: string;
};

/**
 * The end card, per the owner's 2026-09-04 decision: the K&A lockup draws
 * itself rather than fading in as a finished picture.
 *
 * `LogoDraw` is the live site's intro animation ported frame for frame, and it
 * is a choreography rather than a settle: a mouse drags the browser frame into
 * being, the three window dots pop as the pointer passes them, K and A land,
 * the ampersand scales in, and only then does PERFORMANCE type on underneath.
 * The authored piece is seven seconds and compresses uniformly, and the gate at
 * out/gate-logo established where that stops working: at 36 frames it strobes,
 * 72 is the floor at which it still reads as a sweep, and 144 is comfortable.
 *
 * So each cut gets the longest draw its beat can pay for.
 *
 * 15 second cut. CALL_TO_ACTION is 78 frames, up from 62, which cost each
 * project beat eight frames. The draw takes 66 of them, a hair under the 72
 * floor and accepted by the owner because this end card is the one place in the
 * reel where the viewer is not being asked to read anything while it happens.
 * The contact block arrives at frame 50, one frame after the wordmark starts at
 * T 5.2, so the last thing the lockup does and the first thing the copy does
 * are the same gesture. Everything is on screen from 56; the last wordmark
 * glyph finishes its ease at 60 and nothing moves after that, so the card is
 * frozen for the final 18 frames. That is under CTA_HOLD_MIN_FRAMES and the
 * owner took the trade with the number in front of them.
 *
 * 45 second cut. LINKEDIN_CALL_TO_ACTION is 124 frames and did not have to
 * change. The draw takes 84, the copy arrives at 64, and the finished card is
 * frozen from frame 79 to the end, which is 45 frames and clears the minimum.
 */
const CTA_TIMING: Record<ReelCut, { drawFrames: number; copyIn: number }> = {
  short: { drawFrames: 66, copyIn: 50 },
  linkedin: { drawFrames: 84, copyIn: 64 },
};

/**
 * Rendered width of the logo box at 1080 canvas width, and the box's aspect.
 *
 * The width is the one the static lockup used, so the card's proportions are
 * the ones the owner already approved. The aspect is not: LogoDraw's authored
 * stage is 1340x548 (0.409) where logo-lockup.webp was 800x303 (0.379), because
 * the stage carries a little padding the webp was cropped out of. The drawn
 * artwork inside that stage measures 1243 by 467 units, which is 0.376, so the
 * mark itself is the same shape it always was and sits very nearly on the
 * stage's own centre: 44 units of padding on the left against 52 on the right,
 * 42 above against 38 below. That is why the column below needs no manual
 * nudge to stay balanced. It centres the box, and the box centres the mark.
 *
 * The gold "K&A Designs" crest in approved-logo-transparent is the retired
 * brand and must not appear.
 */
const LOGO_TARGET_WIDTH = 720;
const LOGO_ASPECT = 548 / 1340;

/**
 * Owner decision 2026-09-03: the "K&A Performance" text line comes out. The
 * lockup already reads the business name, so setting it again underneath was
 * saying the same thing twice and pushed the url and the phone off center. The
 * card is now lockup, url, phone.
 *
 * Owner decision 2026-09-04: the card is centered on the CANVAS. It used to be
 * centered on the safe area, which put it 54 pixels left of the canvas centre
 * in the vertical crop, and that is what the owner was seeing. The card box is
 * centeredBox() over the canvas width less symmetric padding, so the lockup,
 * the closing line, the url and the phone all sit on the canvas axis.
 */
export const CallToAction: React.FC<CallToActionProps> = ({
  format,
  cut,
  closingLine,
}) => {
  const frame = useCurrentFrame();
  const safe = safeArea(format);
  const scale = formatMetrics(format).typeScale;
  const timing = CTA_TIMING[cut];

  // Scaling the lockup by type scale alone overshoots in landscape, where the
  // canvas is only 1080 tall: at 1280 wide it filled the safe area top to
  // bottom and left the url and the phone crushed underneath. Cap it against
  // the safe area in both axes as well.
  //
  // The LinkedIn cut adds a fourth element to the card, which in landscape
  // pushed the whole centred block past the safe area and put the top of the
  // lockup inside the reserved top zone. A four element card gets a smaller
  // share of the safe height than a three element one.
  const card = centeredBox(
    format,
    SAFE_ZONES[format].width - centeredPadding(format, scale) * 2,
  );

  const logoHeightShare = closingLine ? 0.32 : 0.4;
  const logoWidth = Math.round(
    Math.min(
      LOGO_TARGET_WIDTH * scale,
      // Five sixths of the card, so the card still reads as a lockup over a
      // block of copy rather than as a logo with captions under it.
      card.width * 0.83,
      // The height cap is the one that bites in landscape, and it binds on the
      // box height, so the drawn box lands at the same height the webp did and
      // takes its extra aspect out of the width instead.
      (safe.height * logoHeightShare) / LOGO_ASPECT,
    ),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <div
        style={{
          position: "absolute",
          left: card.left,
          width: card.width,
          top: safe.top,
          height: safe.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LogoDraw durationFrames={timing.drawFrames} width={logoWidth} />

        {/* Arrives with the url rather than before it, so the card still
            resolves in two moves and the hold is not eaten by a third. */}
        {closingLine ? (
          <div
            style={{
              marginTop: Math.round(44 * scale),
              visibility: frame >= timing.copyIn ? "visible" : "hidden",
              fontFamily: BODY_STACK,
              fontSize: Math.round(52 * scale),
              fontWeight: 500,
              letterSpacing: 0.4 * scale,
              lineHeight: 1.2,
              color: COLORS.ink,
              textAlign: "center",
            }}
          >
            {closingLine}
          </div>
        ) : null}

        <div
          style={{
            marginTop: Math.round((closingLine ? 20 : 44) * scale),
            visibility: frame >= timing.copyIn ? "visible" : "hidden",
            fontFamily: BODY_STACK,
            fontSize: Math.round(60 * scale),
            fontWeight: 600,
            letterSpacing: 0.5 * scale,
            color: COLORS.accent,
            textAlign: "center",
          }}
        >
          {brand.url}
        </div>

        {/* Owner decision 2026-09-04: the phone no longer trails the url by
            eight frames. The draw is the card's stagger now, and a third
            arrival after it would have eaten most of a 22 frame hold. */}
        <div
          style={{
            marginTop: Math.round(26 * scale),
            visibility: frame >= timing.copyIn ? "visible" : "hidden",
            fontFamily: BODY_STACK,
            fontSize: Math.round(52 * scale),
            fontWeight: 500,
            letterSpacing: 1 * scale,
            color: COLORS.muted,
            textAlign: "center",
          }}
        >
          {brand.phone}
        </div>
      </div>
    </AbsoluteFill>
  );
};
