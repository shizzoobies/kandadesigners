import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DeviceFrame } from "../../../components/DeviceFrame";
import { BODY_STACK, COLORS } from "../../../lib/brand";
import { getHomeCapture, type CaptureEntry } from "../../../lib/captures";
import { formatMetrics, type FormatKey } from "../../../lib/layout";
import { demoBox, type DemoBox } from "../FlatDemo";
import {
  phoneGeometry,
  SPLIT_GUTTER,
  SPLIT_PHONE_FRACTION,
  VISIBLE_PAGE,
  type PhoneGeometry,
} from "./geometry";
import type { TutorialSceneProps } from "../registry";
import { REAL_HEROES } from "./riverside";

/**
 * Three real client home pages, each held on its hero.
 *
 * The one beat in this tutorial that shows real work, and the rules are
 * different because of it. The screen is the capture's own still, which is the
 * page as it was recorded and confirmed against the live site on 2026-09-04:
 * the headline on screen is the client's headline, never retyped, never
 * paraphrased. It is held rather than scrolled, because the argument is about
 * what is on the first screen. The only text this reel adds to a real client's
 * picture is the business name under it.
 *
 * The two cuts want two different shots from the same material.
 *
 * The 15 second cut has 60 frames and one line, "These three do." Three phones
 * across, arriving a few frames apart, whole pages: a recognition shot. There
 * is no time to read three headlines, and pretending otherwise would only mean
 * nobody read any of them.
 *
 * The 45 second cut has about 450 frames and names all three in the narration.
 * One phone at a time, each held about a third of the beat, cropped to its
 * first screen at the same size the invented bakery was cropped to, so the cut
 * out of "test" lands on the same frame with a real page in it.
 */

/** Gap between the three phones of the row, authored at 1080 canvas width. */
const ROW_GAP = 28;

/** Name type, authored at 1080 canvas width, per shot. */
const ROW_NAME_SIZE = 30;
const SOLO_NAME_SIZE = 44;

/** Name type in the landscape panel, where the name is the whole right half. */
const PANEL_NAME_SIZE = 64;

/** A name wraps to two lines in a third of a column. Reserve both. */
const NAME_ROWS = 2;
const NAME_LINE_HEIGHT = 1.2;
const NAME_GAP = 18;

function nameStyle(size: number): CSSProperties {
  return {
    fontFamily: BODY_STACK,
    fontSize: size,
    fontWeight: 600,
    lineHeight: NAME_LINE_HEIGHT,
    letterSpacing: 0.2,
    color: COLORS.canvas,
    textAlign: "center",
    // "Southern Legacy Contractors" is 27 characters against a third of the
    // copy box. It wraps in every crop; balance keeps it from orphaning a word.
    textWrap: "balance",
  };
}

/** Height the name takes under a phone, including the air above it. */
function nameBlockHeight(size: number, scale: number): number {
  return (
    NAME_ROWS * Math.round(size * NAME_LINE_HEIGHT) + Math.round(NAME_GAP * scale)
  );
}

/** The capture's own still: the first frame, held, at its recorded size. */
function stillSrc(capture: CaptureEntry): string {
  return staticFile(capture.stillPath.replace(/^assets\//, ""));
}

type PhoneProps = {
  capture: CaptureEntry;
  phone: PhoneGeometry;
  left: number;
  top: number;
};

/** One phone, cropped by its own frame, with the capture's still inside it. */
const Phone: React.FC<PhoneProps> = ({ capture, phone, left, top }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
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
      <Img
        src={stillSrc(capture)}
        style={{
          width: phone.screenWidth,
          height: phone.screenHeight,
          display: "block",
        }}
      />
    </DeviceFrame>
  </div>
);

/** The 15 second cut: three phones across, arriving fast. */
const Row: React.FC<{ box: DemoBox }> = ({ box }) => {
  const frame = useCurrentFrame();
  const gap = Math.round(ROW_GAP * box.scale);
  const columnWidth = Math.floor((box.width - gap * 2) / 3);
  const nameSize = Math.round(ROW_NAME_SIZE * box.scale);
  const maxHeight = box.height - nameBlockHeight(nameSize, box.scale);

  return (
    <>
      {REAL_HEROES.map((hero, i) => {
        const capture = getHomeCapture(hero.projectId, "mobile");
        const phone = phoneGeometry({
          box,
          columnWidth,
          maxHeight,
          // The whole page, not the first screen: three phones this small are
          // read as three phones, and a cropped one reads as a card.
          visiblePage: capture.height,
          pageWidth: capture.width,
          pageHeight: capture.height,
          bezelAt1080: 12,
        });
        const columnLeft = box.left + i * (columnWidth + gap);
        // The row is width bound in every crop, so it never fills the box's
        // height. Centered rather than hung from the top, or the three phones
        // sit against the reserved top zone with a third of the frame empty
        // between them and their own caption.
        const blockHeight =
          phone.frameHeight +
          Math.round(NAME_GAP * box.scale) +
          NAME_ROWS * Math.round(nameSize * NAME_LINE_HEIGHT);
        const top =
          box.top + Math.max(0, Math.round((box.height - blockHeight) / 2));

        return (
          <div
            key={hero.projectId}
            style={{
              position: "absolute",
              left: columnLeft,
              top,
              width: columnWidth,
              height: blockHeight,
              // Seven frames apart, so all three have landed inside the first
              // quarter of a 60 frame beat and the row reads as one gesture
              // rather than as a queue. Visibility, not opacity: no fades.
              visibility: frame >= i * 7 ? "visible" : "hidden",
            }}
          >
            <Phone
              capture={capture}
              phone={phone}
              left={Math.round((columnWidth - phone.frameWidth) / 2)}
              top={0}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: phone.frameHeight + Math.round(NAME_GAP * box.scale),
                width: columnWidth,
                ...nameStyle(nameSize),
              }}
            >
              {hero.name}
            </div>
          </div>
        );
      })}
    </>
  );
};

/** The 45 second cut: one phone at a time, hard cut between them. */
const Solo: React.FC<{ box: DemoBox; format: FormatKey }> = ({
  box,
  format,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const split = formatMetrics(format).showcase === "split";

  const slot = durationInFrames / REAL_HEROES.length;
  const index = Math.min(
    REAL_HEROES.length - 1,
    Math.max(0, Math.floor(frame / slot)),
  );
  const hero = REAL_HEROES[index];
  const capture = getHomeCapture(hero.projectId, "mobile");

  const nameSize = Math.round(SOLO_NAME_SIZE * box.scale);
  const columnWidth = split
    ? Math.round(box.width * SPLIT_PHONE_FRACTION)
    : box.width;
  const maxHeight = split
    ? box.height
    : box.height - nameBlockHeight(nameSize, box.scale);

  const phone = phoneGeometry({
    box,
    columnWidth,
    maxHeight,
    visiblePage: VISIBLE_PAGE,
    pageWidth: capture.width,
    pageHeight: capture.height,
  });
  const left = split
    ? box.left
    : box.left + Math.round((box.width - phone.frameWidth) / 2);

  // The last phone drifts a few pixels across its hold. Three stills cut
  // together are indistinguishable from a frozen render, and the last one is
  // held against the closing line, which is where a freeze would be believed.
  const drift =
    index === REAL_HEROES.length - 1
      ? Math.round(
          interpolate(frame - index * slot, [0, slot], [0, 8 * box.scale], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        )
      : 0;

  const panelLeft = left + phone.frameWidth + SPLIT_GUTTER;

  return (
    <>
      <Phone
        capture={capture}
        phone={phone}
        left={left}
        top={box.top + drift}
      />

      {split ? (
        <div
          style={{
            position: "absolute",
            left: panelLeft,
            top: box.top,
            width: box.left + box.width - panelLeft,
            height: box.height,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            ...nameStyle(Math.round(PANEL_NAME_SIZE * box.scale)),
            textAlign: "left",
          }}
        >
          {hero.name}
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: box.left,
            top: box.top + phone.frameHeight + Math.round(NAME_GAP * box.scale),
            width: box.width,
            ...nameStyle(nameSize),
          }}
        >
          {hero.name}
        </div>
      )}
    </>
  );
};

export const HeroReal: React.FC<TutorialSceneProps> = ({ format, cut }) => {
  const box = demoBox(format);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.ink }}>
      {cut === "short" ? (
        <Row box={box} />
      ) : (
        <Solo box={box} format={format} />
      )}
    </AbsoluteFill>
  );
};
