import { BODY_STACK, COLORS, DISPLAY_STACK } from "../../../lib/brand";

/**
 * The fictional page the 15 second cut argues about.
 *
 * Fictional, and labeled as such by the caller, because the non-negotiables
 * forbid attributing a weak example to a real client. Willow Creek Landscaping
 * does not exist; the copy is the shortest thing that still reads as a small
 * business home page rather than as a type specimen, which is the point of the
 * beat. The viewer has to accept the page before the number contradicts it.
 *
 * No em dashes, and the call to action is a rounded rectangle rather than a
 * pill, per the non-negotiables.
 */
const BUSINESS = "Willow Creek Landscaping";
const NAV = ["Services", "Contact"];
const HEADLINE = "Yards that stay sharp.";
const BODY = [
  "Design, planting and upkeep.",
  "One crew, one plan, no surprises.",
];
const BUTTON = "Get a quote";

/**
 * The two shapes the page is authored at, in nominal pixels.
 *
 * A page card is fitted into whatever rectangle the crop leaves it, and a single
 * nominal shape cannot survive that: the tall crops leave a roughly square box
 * and landscape leaves a strip about two and a half times as wide as it is tall,
 * because demoBox() reserves the bottom of a 1080 tall canvas for the caption.
 * Fitting one portrait page into the landscape strip would have shrunk it to
 * about half the type size, so there are two, and each is fitted to its own box.
 * The copy is identical; only the measure changes, which is what a real page
 * does between a phone and a desktop.
 */
const NOMINAL = {
  portrait: { width: 520, height: 560, pad: 36 },
  wide: { width: 780, height: 340, pad: 32 },
};

/**
 * Where the two shapes meet, as the box's own aspect.
 *
 * The geometric mean of the two nominal aspects, 0.93 and 2.29, so each shape is
 * used over the half of the range it is closer to. It is the box that decides
 * and not the crop, which is what the first square still argued: square leaves
 * the card 936 by 405, and drawing a portrait page in that fitted it by height
 * to 376 pixels wide with a 27 pixel headline while 500 pixels of the box went
 * unused on either side.
 */
const WIDE_ABOVE = 1.45;

export type SamplePageProps = {
  /** The box the card is fitted into, in canvas pixels. */
  width: number;
  height: number;
  /**
   * Color of the headline and the body copy. The whole tutorial is this one
   * value moving from amber to rust, so it is a prop rather than a constant and
   * the caller interpolates it.
   */
  textColor: string;
};

/**
 * A canvas colored page card: a wordmark, two nav words, a headline, two lines
 * of body copy and one button.
 *
 * The headline and the body take `textColor`. The button keeps its amber ground
 * with espresso ink on top in every state, because that pairing measures 5.3 to
 * 1 and the tutorial's own argument is that amber is a button color and not a
 * text color. If the button changed with the text the beat would be saying
 * "replace amber", which is not the fix.
 */
export const SamplePage: React.FC<SamplePageProps> = ({
  width,
  height,
  textColor,
}) => {
  const nominal =
    width / Math.max(1, height) >= WIDE_ABOVE ? NOMINAL.wide : NOMINAL.portrait;
  const u = Math.min(width / nominal.width, height / nominal.height);
  const px = (n: number) => Math.round(n * u);

  return (
    <div
      style={{
        width: px(nominal.width),
        height: px(nominal.height),
        backgroundColor: COLORS.canvas,
        borderRadius: px(8),
        boxShadow: `0 ${px(30)}px ${px(70)}px rgba(0, 0, 0, 0.42)`,
        padding: px(nominal.pad),
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          fontFamily: BODY_STACK,
          fontSize: px(15),
          lineHeight: 1.2,
        }}
      >
        <div
          style={{ fontWeight: 700, color: COLORS.ink, letterSpacing: px(0.4) }}
        >
          {BUSINESS}
        </div>
        <div style={{ display: "flex", gap: px(16), color: COLORS.muted }}>
          {NAV.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
      </div>

      <div
        style={{
          height: Math.max(1, px(1)),
          marginTop: px(12),
          backgroundColor: "rgba(34, 28, 21, 0.14)",
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: px(14),
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY_STACK,
            fontSize: px(52),
            fontWeight: 800,
            letterSpacing: px(-1.2),
            lineHeight: 1.06,
            color: textColor,
          }}
        >
          {HEADLINE}
        </div>
        <div
          style={{
            fontFamily: BODY_STACK,
            fontSize: px(21),
            fontWeight: 400,
            lineHeight: 1.55,
            color: textColor,
          }}
        >
          {BODY.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>

        <div
          style={{
            alignSelf: "flex-start",
            marginTop: px(10),
            backgroundColor: COLORS.amber,
            color: COLORS.ink,
            borderRadius: px(6),
            padding: `${px(13)}px ${px(26)}px`,
            fontFamily: BODY_STACK,
            fontSize: px(20),
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {BUTTON}
        </div>
      </div>
    </div>
  );
};
