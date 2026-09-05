import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { DeviceFrame } from "../../../components/DeviceFrame";
import { BODY_STACK, COLORS, DISPLAY_STACK } from "../../../lib/brand";
import { formatMetrics, type FormatKey } from "../../../lib/layout";
import { demoBox } from "../FlatDemo";
import {
  PAGE_HEIGHT,
  PAGE_WIDTH,
  phoneGeometry,
  SPLIT_GUTTER,
  SPLIT_PHONE_FRACTION,
} from "./geometry";
import {
  FOLD_LABEL,
  RIVERSIDE_BELOW_FOLD,
  RIVERSIDE_BUTTON,
  RIVERSIDE_NAME,
  RIVERSIDE_SUBHEAD,
} from "./riverside";

/**
 * The fictional bakery's home page, on a phone.
 *
 * Five of the seven hero beats are this one page with one thing changed: the
 * headline it carries, whether the fold is marked on it, and whether its photo
 * has been covered. Drawing it once is the point. The 15 second cut cuts from
 * "weak" to "promise" on the same phone and the 45 second cut runs "fold",
 * "rewrite" and "test" through it, so if each beat drew its own page the frame
 * would move on every cut and the argument, which is that only the words
 * changed, would be lost.
 *
 * The page is authored at 780 by 1688, the exact size of the mobile captures in
 * assets/captures, and scaled to whatever phone geometry.ts solved for the crop.
 * So the invented bakery and a real client's page are the same shape at the same
 * scale and the comparison the tutorial makes is a fair one.
 */

/** Page gutter. */
const PAD = 44;

const NAV_HEIGHT = 96;
const WORDMARK_SIZE = 28;

/** The photo band: where a stock photo would be, and is not. */
const PHOTO_TOP = NAV_HEIGHT;
const PHOTO_HEIGHT = 700;

const COPY_TOP = 840;

/**
 * Headline size on the page, in page pixels.
 *
 * 72 page pixels is 36 points on the 390 point viewport these captures were
 * recorded at, which is an ordinary size for a mobile hero headline. It is
 * chosen against the real captures rather than against Section 7: the type
 * inside the phone is a picture of a page, not the reel's own copy, and the
 * three real client screens set theirs at whatever their sites set.
 */
const HEADLINE_SIZE = 72;
const HEADLINE_LINE_HEIGHT = 1.08;

/**
 * Lines the headline box holds, whatever the headline currently says.
 *
 * "Welcome to Riverside Bakery" takes two and "Fresh sourdough, baked at five,
 * gone by noon." takes three. Reserving three means the subhead and the button
 * do not walk down the page while the line is rewritten, which is the subject
 * of the beat: the layout was never the problem, the words were.
 */
const HEADLINE_ROWS = 3;
const HEADLINE_BOX =
  HEADLINE_ROWS * Math.round(HEADLINE_SIZE * HEADLINE_LINE_HEIGHT);

const SUBHEAD_TOP = COPY_TOP + HEADLINE_BOX + 18;
const SUBHEAD_SIZE = 26;

const BUTTON_TOP = SUBHEAD_TOP + 68;
const BUTTON_HEIGHT = 78;

/**
 * Where the fold falls, in page pixels.
 *
 * The narration says a phone's first screen is about six hundred pixels. These
 * captures are a 390 point viewport at 2x, so six hundred points is twelve
 * hundred of these, and 1240 is that pushed just clear of the button rather
 * than drawn through it.
 */
const FOLD_Y = 1240;

const BELOW_FOLD_TOP = 1330;

/** A card, not a pill. The same 8 the caption card and FlatDemo take. */
const RADIUS = 8;

/** Small caps line, the only label shape this project allows. */
const SMALL_CAPS_SIZE = 24;

const HAIRLINE = "#E4DDD5";
const BAR = "#E8E2DB";

/** The small caps line, at a size the caller sets. */
function smallCaps(color: string, size: number): CSSProperties {
  return {
    fontFamily: BODY_STACK,
    fontSize: size,
    fontWeight: 700,
    letterSpacing: size * 0.14,
    textTransform: "uppercase",
    color,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
  };
}

export type RiversidePhoneProps = {
  format: FormatKey;
  /**
   * The headline. The boxes that hold it carry the type style, so a scene
   * passes a bare <KineticText> and it is set correctly in both of them: the
   * landscape crop draws the same node twice, small on the phone and large in
   * the panel beside it.
   */
  headline: ReactNode;
  /** The small caps label saying this page is invented. Undefined draws none. */
  label?: string;
  /** 0 to 1: how far the fold rule has drawn across. Undefined draws none. */
  fold?: number;
  /** 0 to 1: how far the canvas cover has wiped down the photo band. */
  mask?: number;
};

export const RiversidePhone: React.FC<RiversidePhoneProps> = ({
  format,
  headline,
  label,
  fold,
  mask,
}) => {
  const box = demoBox(format);
  const split = formatMetrics(format).showcase === "split";
  const columnWidth = split
    ? Math.round(box.width * SPLIT_PHONE_FRACTION)
    : box.width;
  const phone = phoneGeometry({ box, columnWidth });

  const left = split
    ? box.left
    : box.left + Math.round((box.width - phone.frameWidth) / 2);

  const clamped = (v: number) => Math.min(1, Math.max(0, v));

  const page = (
    <div
      style={{
        position: "relative",
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        backgroundColor: COLORS.canvas,
        transform: `scale(${phone.pageScale})`,
        transformOrigin: "top left",
      }}
    >
      {/* Nav: a wordmark and a rule. This is a hero, not a whole site. */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: 0,
          height: NAV_HEIGHT,
          display: "flex",
          alignItems: "center",
          fontFamily: DISPLAY_STACK,
          fontSize: WORDMARK_SIZE,
          fontWeight: 700,
          letterSpacing: -0.3,
          color: COLORS.ink,
        }}
      >
        {RIVERSIDE_NAME}
      </div>
      {/*
        This bakery does not exist, and the corner of its own screen says so.
        The nav bar rather than a lower corner because it is the one corner that
        is inside the crop in every format, and rust small caps against an ink
        wordmark in Schibsted cannot be mistaken for a menu item.
      */}
      {label === undefined ? null : (
        <div
          style={{
            position: "absolute",
            right: PAD,
            top: 0,
            height: NAV_HEIGHT,
            display: "flex",
            alignItems: "center",
            ...smallCaps(COLORS.accent, SMALL_CAPS_SIZE),
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: NAV_HEIGHT - 2,
          height: 2,
          backgroundColor: HAIRLINE,
        }}
      />

      {/* Where a stock photo would be. Neutral warm gray into canvas. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: PHOTO_TOP,
          height: PHOTO_HEIGHT,
          backgroundImage: `linear-gradient(158deg, #A79E95 0%, #C6BEB5 46%, ${COLORS.canvas} 100%)`,
        }}
      />

      {/* Cover the photo and see whether the words still do the work. */}
      {mask === undefined ? null : (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: PHOTO_TOP,
            height: Math.round(PHOTO_HEIGHT * clamped(mask)),
            backgroundColor: COLORS.canvas,
            borderBottom: `2px solid ${HAIRLINE}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: Math.round(PHOTO_HEIGHT / 2) - SMALL_CAPS_SIZE,
              textAlign: "center",
              ...smallCaps(COLORS.muted, SMALL_CAPS_SIZE),
            }}
          >
            photo covered
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: PAD,
          top: COPY_TOP,
          width: PAGE_WIDTH - PAD * 2,
          height: HEADLINE_BOX,
          overflow: "hidden",
          fontFamily: DISPLAY_STACK,
          fontSize: HEADLINE_SIZE,
          fontWeight: 800,
          letterSpacing: -1,
          lineHeight: HEADLINE_LINE_HEIGHT,
          color: COLORS.ink,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          position: "absolute",
          left: PAD,
          top: SUBHEAD_TOP,
          width: PAGE_WIDTH - PAD * 2,
          fontFamily: BODY_STACK,
          fontSize: SUBHEAD_SIZE,
          fontWeight: 400,
          lineHeight: 1.3,
          color: COLORS.muted,
        }}
      >
        {RIVERSIDE_SUBHEAD}
      </div>

      {/* Amber with ink on it, which is the one place amber carries text. */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: BUTTON_TOP,
          height: BUTTON_HEIGHT,
          paddingLeft: 34,
          paddingRight: 34,
          borderRadius: RADIUS,
          backgroundColor: COLORS.amber,
          color: COLORS.ink,
          display: "flex",
          alignItems: "center",
          fontFamily: BODY_STACK,
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        {RIVERSIDE_BUTTON}
      </div>

      {/* Enough page under the fold that the fold marks something. */}
      <div
        style={{
          position: "absolute",
          left: PAD,
          top: BELOW_FOLD_TOP,
          ...smallCaps(COLORS.muted, SMALL_CAPS_SIZE),
        }}
      >
        {RIVERSIDE_BELOW_FOLD}
      </div>
      {[1, 0.94, 0.62].map((fraction, i) => (
        <div
          key={fraction}
          style={{
            position: "absolute",
            left: PAD,
            top: BELOW_FOLD_TOP + 62 + i * 44,
            width: Math.round((PAGE_WIDTH - PAD * 2) * fraction),
            height: 18,
            borderRadius: 2,
            backgroundColor: BAR,
          }}
        />
      ))}

      {/* The fold, drawn on. A rule and its name, not a graphic. */}
      {fold === undefined ? null : (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: FOLD_Y,
              width: `${clamped(fold) * 100}%`,
              height: 6,
              backgroundColor: COLORS.accent,
            }}
          />
          <div
            style={{
              position: "absolute",
              right: PAD,
              top: FOLD_Y - 44,
              visibility: fold >= 1 ? "visible" : "hidden",
              ...smallCaps(COLORS.accent, SMALL_CAPS_SIZE),
            }}
          >
            {FOLD_LABEL}
          </div>
        </>
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      <div
        style={{
          position: "absolute",
          left,
          top: box.top,
          width: phone.frameWidth,
          height: phone.frameHeight,
          overflow: "hidden",
        }}
      >
        <DeviceFrame
          screenWidth={phone.screenWidth}
          screenHeight={phone.screenHeight}
          bezel={phone.bezel}
          radius={phone.radius + phone.bezel}
        >
          {page}
        </DeviceFrame>
      </div>

      {/*
        Landscape reads the words in a panel beside the phone rather than on it.
        demoBox is five hundred pixels tall there against sixteen hundred wide,
        so a phone that fits the height sets its headline at about twenty six
        pixels on a 1920 canvas, which is a picture of a headline rather than a
        headline. The panel is the same node at panel size, so it types on in
        step with the phone.
      */}
      {split ? (
        <div
          style={{
            position: "absolute",
            left: left + phone.frameWidth + SPLIT_GUTTER,
            top: box.top,
            width:
              box.left + box.width - (left + phone.frameWidth + SPLIT_GUTTER),
            height: box.height,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {label === undefined ? null : (
            <div
              style={{
                marginBottom: Math.round(20 * box.scale),
                ...smallCaps(COLORS.amber, Math.round(30 * box.scale)),
              }}
            >
              {label}
            </div>
          )}
          <div
            style={{
              fontFamily: DISPLAY_STACK,
              fontSize: Math.round(54 * box.scale),
              fontWeight: 800,
              letterSpacing: -1.5 * box.scale,
              lineHeight: 1.1,
              color: COLORS.canvas,
            }}
          >
            {headline}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
