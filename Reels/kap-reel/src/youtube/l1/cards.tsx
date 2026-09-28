// The two cards only L1 needs, built from the shared card pieces: who uses the
// keyboard (four line icons), and the keys the test uses.

import { useCurrentFrame } from "remotion";
import { Card, Reveal, bodyText, headline } from "../ChapterCard";
import { smallCaps } from "../Frame";
import { KeyCap } from "../KeyOverlay";
import { FPS } from "../layout";
import type { YouTubeTheme } from "../theme";

const Icon: React.FC<{
  kind: "reader" | "tremor" | "arm" | "keyboard";
  color: string;
}> = ({ kind, color }) => {
  const s = {
    fill: "none",
    stroke: color,
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={96} height={96} viewBox="0 0 64 64">
      {kind === "reader" ? (
        <>
          <path d="M10 25 H19 L32 14 V50 L19 39 H10 Z" {...s} />
          <path d="M40 24 Q45 32 40 40" {...s} />
          <path d="M46 18 Q55 32 46 46" {...s} />
        </>
      ) : null}
      {kind === "tremor" ? (
        <>
          <rect x={22} y={12} width={20} height={36} rx={10} {...s} />
          <path d="M32 18 V25" {...s} />
          <path d="M14 20 L9 25 L14 30 L9 35" {...s} />
          <path d="M50 20 L55 25 L50 30 L55 35" {...s} />
        </>
      ) : null}
      {kind === "arm" ? (
        <g transform="rotate(-40 32 32)">
          <rect x={6} y={22} width={52} height={20} rx={10} {...s} />
          <rect x={23} y={22} width={18} height={20} {...s} />
          <path
            d="M28 29 h0 M36 29 h0 M28 35 h0 M36 35 h0"
            {...s}
            strokeWidth={4.5}
          />
        </g>
      ) : null}
      {kind === "keyboard" ? (
        <>
          <rect x={6} y={18} width={52} height={28} rx={4} {...s} />
          <path
            d="M14 26 h0 M22 26 h0 M30 26 h0 M38 26 h0 M46 26 h0 M18 32 h0 M26 32 h0 M34 32 h0 M42 32 h0 M50 32 h0"
            {...s}
            strokeWidth={4.5}
          />
          <path d="M22 39 H42" {...s} />
        </>
      ) : null}
    </svg>
  );
};

export const WhoCard: React.FC<{
  theme: YouTubeTheme;
  at: number;
  items: {
    icon: "reader" | "tremor" | "arm" | "keyboard";
    text: string;
    at: number;
  }[];
}> = ({ theme, at, items }) => (
  <Card theme={theme}>
    <Reveal at={at}>
      <div style={smallCaps(24, theme.accent)}>Who needs it</div>
    </Reveal>
    <Reveal at={at + 4} style={{ marginTop: 28 }}>
      <div style={headline(theme, 80)}>More people than you might think.</div>
    </Reveal>
    <div style={{ marginTop: 80, display: "flex", gap: 48 }}>
      {items.map((it) => (
        <Reveal key={it.text} at={it.at} style={{ flex: 1 }}>
          <div
            style={{ height: 3, background: theme.line, marginBottom: 30 }}
          />
          <Icon kind={it.icon} color={theme.accent} />
          <div style={{ ...bodyText(theme, 34), marginTop: 22 }}>{it.text}</div>
        </Reveal>
      ))}
    </div>
  </Card>
);

/** A keycap that presses once as its row arrives. */
const RowKey: React.FC<{ theme: YouTubeTheme; label: string; at: number }> = ({
  theme,
  label,
  at,
}) => {
  const frame = useCurrentFrame();
  const since = (frame - at - 6) / FPS;
  const pressed =
    since < 0 ? 0 : since < 0.1 ? 1 : Math.max(0, 1 - (since - 0.1) / 0.17);
  return <KeyCap label={label} theme={theme} height={68} pressed={pressed} />;
};

export const KeysCard: React.FC<{
  theme: YouTubeTheme;
  at: number;
  titleAt: number;
  rows: { keys: string[]; joiner?: string; text: string; at: number }[];
}> = ({ theme, at, titleAt, rows }) => (
  <Card theme={theme}>
    <Reveal at={at}>
      <div style={smallCaps(24, theme.accent)}>How to run the test</div>
    </Reveal>
    <Reveal at={titleAt} style={{ marginTop: 28 }}>
      <div style={headline(theme, 72)}>
        Open your home page. Don’t click anything yet.
      </div>
    </Reveal>
    <div
      style={{
        marginTop: 64,
        display: "flex",
        flexDirection: "column",
        gap: 26,
      }}
    >
      {rows.map((r) => (
        <Reveal
          key={r.text}
          at={r.at}
          style={{ display: "flex", alignItems: "center", gap: 40 }}
        >
          <div
            style={{
              width: 430,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            {r.keys.map((k, i) => (
              <div
                key={k + String(i)}
                style={{ display: "flex", alignItems: "center", gap: 14 }}
              >
                {i > 0 && r.joiner ? (
                  <div
                    style={{
                      ...bodyText(theme, 30),
                      color: theme.muted,
                      marginTop: -6,
                    }}
                  >
                    {r.joiner}
                  </div>
                ) : null}
                <RowKey theme={theme} label={k} at={r.at} />
              </div>
            ))}
          </div>
          <div style={{ ...bodyText(theme, 42), marginTop: -6 }}>{r.text}</div>
        </Reveal>
      ))}
    </div>
  </Card>
);
