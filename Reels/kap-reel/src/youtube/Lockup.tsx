// The live K&A lockup, drawn as vector and live type so it stays sharp at the
// small size the rail sets it. A straight port of the channel art's lockup.js
// (Reels/youtube/channel-art/src/lockup.js), which rebuilt it from the site's
// LogoIntroAnimation.astro finished frame; it matches logo-lockup.webp.
//
// Why not the webp: it is drawn for a light page. The set takes a dark or a
// light frame per video, and on a dark one the lockup needs its "mono" drawing
// (canvas letters), which only exists as vector. The colors below are the
// brand mark's own and are the one place in src/youtube/ that names a color.
// Never the retired gold crest (approved-logo-transparent.png).

import { BODY_STACK } from "../lib/brand";

/** The authored stage and the "full" crop the channel art uses. */
const STAGE_W = 1340;
const STAGE_H = 548;
const BOX = { x: 36, y: 36, w: 1262, h: 490 };

const SCHEMES = {
  light: {
    frame: "#8B6F5C",
    dots: ["#8B6F5C", "#A93C1C", "#2E7D74"],
    letters: "#2A2422",
    amp: "#A93C1C",
    word: "#8B6F5C",
  },
  mono: {
    frame: "rgba(248,245,242,0.72)",
    dots: [
      "rgba(248,245,242,0.72)",
      "rgba(248,245,242,0.72)",
      "rgba(248,245,242,0.72)",
    ],
    letters: "#F8F5F2",
    amp: "#F8F5F2",
    word: "rgba(248,245,242,0.85)",
  },
} as const;

const PATH_D =
  "M 195 500 L 63 500 Q 47 500 47 484 L 47 61 Q 47 45 63 45 L 1221 45 Q 1237 45 1237 61 L 1237 336 Q 1237 356 1243.5 366";

export const LOCKUP_ASPECT = BOX.w / BOX.h;

export const Lockup: React.FC<{
  height: number;
  scheme: "light" | "mono";
  /** The color behind the lockup: the mouse body is a hole punched to it. */
  ground: string;
}> = ({ height, scheme, ground }) => {
  const c = SCHEMES[scheme];
  const s = height / BOX.h;
  const serif = "'KA Playfair', Georgia, serif";
  return (
    <div
      style={{
        position: "relative",
        width: BOX.w * s,
        height,
        overflow: "visible",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: STAGE_W,
          height: STAGE_H,
          transformOrigin: "0 0",
          transform: `scale(${s}) translate(${-BOX.x}px, ${-BOX.y}px)`,
        }}
      >
        <svg
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          width={STAGE_W}
          height={STAGE_H}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
        >
          <path
            d={PATH_D}
            fill="none"
            stroke={c.frame}
            strokeWidth={5}
            strokeLinecap="round"
          />
          {[90, 140, 190].map((cx, i) => (
            <circle
              key={cx}
              cx={cx}
              cy={88}
              r={10}
              fill="none"
              stroke={c.dots[i]}
              strokeWidth={5}
            />
          ))}
        </svg>
        <div
          style={{
            position: "absolute",
            left: 230,
            top: 100,
            font: `500 330px/1 ${serif}`,
            color: c.letters,
          }}
        >
          K
        </div>
        <div
          style={{
            position: "absolute",
            left: 515,
            top: 108,
            font: `italic 600 320px/1 ${serif}`,
            color: c.amp,
          }}
        >
          &amp;
        </div>
        <div
          style={{
            position: "absolute",
            left: 830,
            top: 100,
            font: `500 330px/1 ${serif}`,
            color: c.letters,
          }}
        >
          A
        </div>
        <div
          style={{ position: "absolute", left: 236, top: 474, display: "flex" }}
        >
          {"PERFORMANCE".split("").map((ch, i) => (
            <span
              key={i}
              style={{
                width: 77,
                textAlign: "center",
                fontFamily: `'KA Poppins', ${BODY_STACK}`,
                fontWeight: 500,
                fontSize: 46,
                lineHeight: 1,
                color: c.word,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
        <svg
          style={{ position: "absolute", left: 1199.5, top: 362 }}
          width={88}
          height={148}
          viewBox="0 0 88 148"
        >
          <rect
            x={3}
            y={3}
            width={82}
            height={142}
            rx={41}
            fill={ground}
            stroke={c.frame}
            strokeWidth={5}
          />
          <line
            x1={44}
            y1={30}
            x2={44}
            y2={54}
            stroke={c.frame}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};
