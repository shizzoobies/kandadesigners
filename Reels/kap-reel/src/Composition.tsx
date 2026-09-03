import { AbsoluteFill, Composition } from "remotion";
import { FPS, TOTAL_FRAMES } from "./lib/timing";

export const ReelVerticalComposition = () => {
  return (
    <Composition
      id="ReelVertical"
      component={ReelVerticalPlaceholder}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
    />
  );
};

export const ReelVerticalPlaceholder: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          color: "#ffffff",
          fontFamily: "sans-serif",
          fontSize: 64,
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        kap-reel scaffold
      </div>
    </AbsoluteFill>
  );
};
