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
 * The contact block arrives at frame 50, two frames after the wordmark starts
 * at T 5.2, so the last thing the lockup does and the first thing the copy does
 * are the same gesture. Everything is on screen from 56; the last wordmark
 * glyph finishes its ease at 60 and nothing moves after that, so the card is
 * frozen for the final 18 frames. That is under CTA_HOLD_MIN_FRAMES and the
 * owner took the trade with the number in front of them.
 *
 * 45 second cut. LINKEDIN_CALL_TO_ACTION is 124 frames and did not have to
 * change. The draw takes 84, the copy arrives at 64, and the finished card is
 * frozen from frame 77 to the end, which is 47 frames and clears the minimum.
 */
const CTA_TIMING: Record<ReelCut, { drawFrames: number; copyIn: number }> = {
  short: { drawFrames: 66, copyIn: 50 },
  linkedin: { drawFrames: 84, copyIn: 64 },
};

/**
 * Where on LogoDraw's authored seven second clock the card's frame 0 sits.
 *
 * Owner fix 2026-09-04. At T 0 the path has drawn nothing and the mouse is at
 * opacity 0, because the mouse ramps in over T 0 to 0.35. So relative frame 0
 * of the end card was a blank canvas, and the cut from the surfaces tour landed
 * on it. Starting the clock at 0.35 puts the mouse fully in on the first frame,
 * at the head of the path, and compresses the remaining 6.65 seconds into the
 * same draw frame counts above. The whole piece therefore runs about 1.4
 * percent early inside the beat.
 *
 * The copy cue did not move with it. The wordmark's T 5.2, which copyIn is
 * pinned one gesture behind, lands at relative 48.1 rather than 49.0 in the 15
 * second cut and 61.3 rather than 62.4 in the 45 second one. Both are under the
 * two frame threshold at which the SRT tables and the README would have had to
 * be re-cut, so 50 and 64 stand.
 */
const DRAW_START_T = 0.35;

/**
 * Rendered width of the logo box at 1080 canvas width, and the box's aspect.
 *
 * The aspect is LogoDraw's authored stage, 1340x548 (0.409), where
 * logo-lockup.webp was 800x303 (0.379): the stage carries padding the webp was
 * cropped out of. The drawn artwork inside that stage measures 1243 by 467
 * units, which is 0.376, so the mark itself is the same shape it always was and
 * sits very nearly on the stage's own centre: 44 units of padding on the left
 * against 52 on the right, 42 above against 38 below. That is why the column
 * below needs no manual nudge to stay balanced. It centres the box, and the box
 * centres the mark.
 *
 * That padding is also why the width is no longer the 720 the static lockup
 * used. Owner fix 2026-09-04: at 720 the drawn mark read about seven percent
 * smaller than the webp did in the same box, because 1243 of 1340 units is
 * 92.8 percent and the webp filled its box edge to edge. 720 * 1340 / 1243 is
 * 776.2, so 776 puts the ink back at the optical size the owner approved.
 *
 * The two caps below are unchanged and still decide the number in three of the
 * six shapes. Where a cap binds, this constant does nothing: see the note on
 * logoWidth.
 *
 * The gold "K&A Designs" crest in approved-logo-transparent is the retired
 * brand and must not appear.
 */
const LOGO_TARGET_WIDTH = 776;
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

  // Measured 2026-09-04 against LOGO_TARGET_WIDTH 776, one row per rendered
  // composition, so which of the three numbers wins is on the record rather
  // than inferred:
  //
  //   vertical      717  card cap, both reels, unchanged by the 720 to 776 move
  //   feed          776  the target, both reels and both cuts
  //   square (web)  776  the target
  //   square (t)    761  height cap, because the closing line takes the share
  //                      from 0.4 to 0.32
  //   landscape 15s 919 web / 736 training, height cap
  //   landscape 45s 736  height cap, both reels
  //
  // The vertical crop is the one place the widening does nothing: its card is
  // 864 wide, five sixths of that is 717, and 717 is already under 720. Lifting
  // the mark there means moving the 0.83, which is a proportion the owner set
  // and not a consequence of the stage padding, so it is left alone.
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
        <LogoDraw
          durationFrames={timing.drawFrames}
          startT={DRAW_START_T}
          width={logoWidth}
        />

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
