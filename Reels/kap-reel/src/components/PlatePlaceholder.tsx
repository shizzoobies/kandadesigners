import { AbsoluteFill } from "remotion";
import { BODY_STACK } from "../lib/brand";

export type PlatePlaceholderProps = {
  /**
   * The plate id that will occupy this shot once Phase 4 generates it, for
   * example "plate-laptop-shoulder". Shown on screen so the grey render is
   * self-documenting.
   */
  plateId?: string;
  /** Optional note under the label, usually the capture id going into it. */
  note?: string;
};

const MID_GREY = "#8C8C8C";

/**
 * A flat mid grey rectangle standing in for content that does not exist yet:
 * the AI context plates in each project beat and in the surfaces tour. Nothing
 * here survives into Phase 4.
 */
export const PlatePlaceholder: React.FC<PlatePlaceholderProps> = ({
  plateId,
  note,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: MID_GREY,
        justifyContent: "center",
        alignItems: "center",
        padding: 72,
      }}
    >
      {plateId ? (
        <div
          style={{
            fontFamily: BODY_STACK,
            fontSize: 52,
            fontWeight: 600,
            color: "#1A1A1A",
            letterSpacing: 2,
            textAlign: "center",
            maxWidth: 864,
          }}
        >
          {`PLATE ${plateId}`}
        </div>
      ) : null}
      {note ? (
        <div
          style={{
            marginTop: 18,
            fontFamily: BODY_STACK,
            fontSize: 34,
            fontWeight: 400,
            color: "#333333",
            textAlign: "center",
            maxWidth: 864,
          }}
        >
          {note}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
