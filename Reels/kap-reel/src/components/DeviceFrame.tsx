import type { CSSProperties, ReactNode } from "react";

export type DeviceFrameProps = {
  /** Screen size in canvas pixels. Match the capture's native size to stay crisp. */
  screenWidth: number;
  screenHeight: number;
  /** Bezel thickness around the screen. */
  bezel?: number;
  /** Outer corner radius of the device body. */
  radius?: number;
  children: ReactNode;
  style?: CSSProperties;
};

/**
 * A dark rounded-rectangle phone body with the capture inside. Deliberately
 * plain for the grey render: no notch, no buttons, no gloss.
 */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  screenWidth,
  screenHeight,
  bezel = 20,
  radius = 64,
  children,
  style,
}) => {
  return (
    <div
      style={{
        width: screenWidth + bezel * 2,
        height: screenHeight + bezel * 2,
        padding: bezel,
        borderRadius: radius,
        backgroundColor: "#100D0A",
        boxShadow: "0 40px 90px rgba(0, 0, 0, 0.45)",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          width: screenWidth,
          height: screenHeight,
          borderRadius: Math.max(radius - bezel, 8),
          overflow: "hidden",
          backgroundColor: "#000000",
        }}
      >
        {children}
      </div>
    </div>
  );
};
