import type { CSSProperties } from "react";
import { BODY_STACK, COLORS } from "../lib/brand";

export type StandInProps = {
  /** What is missing: "capture", "plate", "plate capture". */
  kind: string;
  /** The id that will fill this shot once the asset lands. */
  id: string;
  /** Type size for the label. Callers inside a small box should shrink it. */
  fontSize?: number;
  style?: CSSProperties;
};

/**
 * A labelled grey rectangle standing in for an asset that does not exist yet,
 * in the manner of the web reel's Phase 2 grey render.
 *
 * The point is that a stand-in must be impossible to mistake for a finished
 * shot in a review, so it is flat grey, hatched, and it says what is missing
 * and what id will fill it. A stand-in that looked plausible would be worse
 * than a blank frame, because it would get signed off.
 *
 * It fills its parent, so it can drop into a device frame, a browser window or
 * a full bleed shot without knowing which it is in.
 */
export const StandIn: React.FC<StandInProps> = ({
  kind,
  id,
  fontSize = 34,
  style,
}) => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: Math.round(fontSize * 0.5),
        padding: Math.round(fontSize * 0.8),
        boxSizing: "border-box",
        textAlign: "center",
        backgroundColor: "#6E6A66",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 14px, rgba(0,0,0,0) 14px, rgba(0,0,0,0) 34px)",
        color: COLORS.canvas,
        fontFamily: BODY_STACK,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: Math.round(fontSize * 0.8),
          fontWeight: 700,
          letterSpacing: Math.round(fontSize * 0.12),
          textTransform: "uppercase",
        }}
      >
        Stand-in
      </div>
      <div style={{ fontSize, fontWeight: 600, lineHeight: 1.2 }}>{id}</div>
      <div
        style={{
          fontSize: Math.round(fontSize * 0.72),
          fontWeight: 400,
          color: "#EDE7E1",
        }}
      >
        no {kind} yet
      </div>
    </div>
  );
};
