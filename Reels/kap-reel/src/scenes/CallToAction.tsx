import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BODY_STACK, brand, COLORS, LOGO_PNG } from "../lib/brand";
import { formatMetrics, safeArea, type FormatKey } from "../lib/layout";

export type CallToActionProps = {
  format: FormatKey;
  /**
   * One line above the url, LinkedIn cut only. Section 6 asks that cut to close
   * on "Taking new projects." rather than a hard sales line, which is a
   * statement of availability rather than an ask, and reads correctly on a
   * company page where the viewer is a peer rather than a customer.
   */
  closingLine?: string;
};

/** Frames the logo takes to settle. Section 15 bans logo animations over a second. */
const LOGO_SETTLE_FRAMES = 12;
/** The url arrives once the logo has landed, the phone eight frames later. */
const URL_IN = 14;
const PHONE_IN = 22;

// Checked against the re-paced 15 second cut, 2026-09-03. That cut shortened
// the CTA beat from 66 frames to 62, and Section 6 wants the finished card held
// for at least CTA_HOLD_MIN_FRAMES (36) so a screenshot of the end frame reads.
// The last thing to arrive is the phone at PHONE_IN 22 and the settle is done
// at LOGO_SETTLE_FRAMES 12, so the card is finished on frame 22 and holds 40.
// That clears the minimum with room, so none of the three numbers above had to
// move. The 45 second cut's 124 frame beat is unaffected either way.

/**
 * logo-lockup.webp is the live site's lockup (K & A with the rust ampersand,
 * PERFORMANCE beneath, inside the sketched browser window). 800x303, no
 * padding to crop. The gold "K&A Designs" crest in approved-logo-transparent
 * is the retired brand and must not appear.
 */
const LOGO_TARGET_WIDTH = 720;
const LOGO_ASPECT = 303 / 800;

/**
 * Owner decision 2026-09-03: the "K&A Performance" text line comes out. The
 * lockup already reads the business name, so setting it again underneath was
 * saying the same thing twice and pushed the url and the phone off center. The
 * card is now lockup, url, phone, and the block is centered on the safe area.
 */
export const CallToAction: React.FC<CallToActionProps> = ({
  format,
  closingLine,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const safe = safeArea(format);
  const scale = formatMetrics(format).typeScale;

  const settle = spring({
    frame,
    fps,
    durationInFrames: LOGO_SETTLE_FRAMES,
    config: { damping: 200 },
  });
  const logoY = interpolate(settle, [0, 1], [-44 * scale, 0]);
  const logoScale = interpolate(settle, [0, 1], [0.92, 1]);

  // Scaling the lockup by type scale alone overshoots in landscape, where the
  // canvas is only 1080 tall: at 1280 wide it filled the safe area top to
  // bottom and left the url and the phone crushed underneath. Cap it against
  // the safe area in both axes as well.
  //
  // The LinkedIn cut adds a fourth element to the card, which in landscape
  // pushed the whole centred block past the safe area and put the top of the
  // lockup inside the reserved top zone. A four element card gets a smaller
  // share of the safe height than a three element one.
  const logoHeightShare = closingLine ? 0.32 : 0.4;
  const logoWidth = Math.round(
    Math.min(
      LOGO_TARGET_WIDTH * scale,
      safe.width * 0.74,
      (safe.height * logoHeightShare) / LOGO_ASPECT,
    ),
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.canvas }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          // Centered on the safe area, not the canvas, so the reserved right
          // strip does not pull the card off axis.
          width: safe.right,
          top: safe.top,
          height: safe.height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={LOGO_PNG}
          style={{
            width: logoWidth,
            height: Math.round(logoWidth * LOGO_ASPECT),
            transform: `translateY(${logoY}px) scale(${logoScale})`,
          }}
        />

        {/* Arrives with the url rather than before it, so the card still
            resolves in two moves and the hold is not eaten by a third. */}
        {closingLine ? (
          <div
            style={{
              marginTop: Math.round(44 * scale),
              visibility: frame >= URL_IN ? "visible" : "hidden",
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
            visibility: frame >= URL_IN ? "visible" : "hidden",
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

        <div
          style={{
            marginTop: Math.round(26 * scale),
            visibility: frame >= PHONE_IN ? "visible" : "hidden",
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
