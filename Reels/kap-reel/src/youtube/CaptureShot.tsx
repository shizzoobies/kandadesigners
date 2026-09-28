// A screen capture on the stage: played, held, zoomed and panned, with the
// pressed key and (optionally) a mark where focus is.
//
// Everything here runs on the beat's clock, in seconds from the start of the
// beat, which is the clock the word timings are on. So a play entry can be
// cued straight to a word: the Enter key lands on "press Enter".
//
// Playback is a list of entries. Each one plays the clip from `from` to `to`
// (ms, clip time) starting at beat time `at`, then holds on `to` until the next
// entry. Before the first entry the shot holds on the first entry's `from`.
// The clip frame is set with <Freeze>, so a hold is a true freeze and nothing
// depends on how a video element behaves past its end.
//
// The camera is a list of keyframes in the clip's own CSS px (the key logs'
// coordinates), so a zoom can aim at a logged focus ring directly. Zoom 1
// fits the whole viewport to the stage. A 1440 wide DSF 2 clip is drawn 1:1 at
// zoom 1.875 and C4 (960 wide) at 1.25, so zooms stay under those: no upscaling.

import { Freeze, Img, OffthreadVideo, useCurrentFrame } from "remotion";
import { FPS, STAGE, easeInOut, type Box } from "./layout";
import { KeyOverlay, type Press } from "./KeyOverlay";
import { focusAt, type KeyLog } from "./keys";
import { StageClip, smallCaps } from "./Frame";
import type { YouTubeTheme } from "./theme";

export type PlayEntry = {
  /** Beat time, s, the entry starts playing. */
  at: number;
  /** Clip time, ms. */
  from: number;
  to: number;
  /** Playback rate; key presses keep their frame, only the time between them shrinks. */
  rate?: number;
};

export type CameraKey = {
  /** Beat time, s, the move starts. */
  at: number;
  zoom: number;
  /** What to center: a box (its center) or a point, CSS px. Default: the viewport center. */
  focus?: Box | [number, number];
  /** Length of the move, s. 0 cuts. */
  dur?: number;
};

/**
 * The beat time at which an entry should start so that clip time `keyMs`
 * lands on beat time `when`. Used to cue a logged key press to a word.
 */
export function syncAt(
  when: number,
  keyMs: number,
  fromMs: number,
  rate = 1,
): number {
  return when - (keyMs - fromMs) / 1000 / rate;
}

/** Clip time (ms) showing at beat time t. */
export function clipTimeAt(play: PlayEntry[], t: number): number {
  let current: PlayEntry | null = null;
  for (const e of play) if (e.at <= t) current = e;
  if (!current) return play[0].from;
  return Math.min(
    current.to,
    current.from + (t - current.at) * 1000 * (current.rate ?? 1),
  );
}

/** Every logged press that falls inside a played range, on the beat clock. */
export function pressesFor(log: KeyLog, play: PlayEntry[]): Press[] {
  const out: Press[] = [];
  for (const e of play) {
    for (const k of log.keys) {
      if (k.tMs >= e.from && k.tMs < e.to) {
        out.push({
          t: e.at + (k.tMs - e.from) / 1000 / (e.rate ?? 1),
          key: k.key,
        });
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

type CamState = { zoom: number; cx: number; cy: number };

function center(
  focus: CameraKey["focus"],
  vw: number,
  vh: number,
): [number, number] {
  if (!focus) return [vw / 2, vh / 2];
  if (Array.isArray(focus)) return focus;
  return [focus.x + focus.w / 2, focus.y + focus.h / 2];
}

function cameraAt(
  camera: CameraKey[],
  t: number,
  vw: number,
  vh: number,
): CamState {
  const settled = (k: CameraKey): CamState => {
    const [cx, cy] = center(k.focus, vw, vh);
    return { zoom: k.zoom, cx, cy };
  };
  let state: CamState = { zoom: 1, cx: vw / 2, cy: vh / 2 };
  for (const k of camera) {
    if (k.at > t) break;
    const target = settled(k);
    const dur = k.dur ?? 0.9;
    const p = dur <= 0 ? 1 : easeInOut(Math.min(1, (t - k.at) / dur));
    state = {
      zoom: state.zoom + (target.zoom - state.zoom) * p,
      cx: state.cx + (target.cx - state.cx) * p,
      cy: state.cy + (target.cy - state.cy) * p,
    };
  }
  return state;
}

export const CaptureShot: React.FC<{
  theme: YouTubeTheme;
  /** staticFile() url of the clip or still. */
  src: string;
  kind?: "video" | "image";
  /** The capture's CSS viewport. Taken from the log when there is one. */
  viewport?: { width: number; height: number };
  log?: KeyLog;
  play?: PlayEntry[];
  camera?: CameraKey[];
  /** Explicit presses for a still, beat seconds. */
  presses?: Press[];
  showKeys?: boolean;
  /** Beat seconds [from, to] to ring the focused element, for pages that hide their own focus. */
  markFocus?: [number, number];
}> = ({
  theme,
  src,
  kind = "video",
  viewport,
  log,
  play = [{ at: 0, from: 0, to: Number.MAX_SAFE_INTEGER }],
  camera = [],
  presses,
  showKeys = true,
  markFocus,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const vw = viewport?.width ?? log?.viewport.width ?? 1440;
  const vh = viewport?.height ?? log?.viewport.height ?? 810;

  // Clamp so the view never runs off the capture.
  const cam = cameraAt(camera, t, vw, vh);
  const zoom = Math.max(1, cam.zoom);
  const halfW = vw / zoom / 2;
  const halfH = vh / zoom / 2;
  const cx = Math.min(vw - halfW, Math.max(halfW, cam.cx));
  const cy = Math.min(vh - halfH, Math.max(halfH, cam.cy));
  const k = (STAGE.w / vw) * zoom; // stage px per CSS px
  const left = STAGE.w / 2 - cx * k;
  const top = STAGE.h / 2 - cy * k;

  const clipMs = kind === "video" ? clipTimeAt(play, t) : 0;
  const lastFrame = log ? log.video.frames - 1 : Number.MAX_SAFE_INTEGER;
  const clipFrame = Math.min(
    lastFrame,
    Math.max(0, Math.floor((clipMs / 1000) * FPS)),
  );

  const media: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width: vw * k,
    height: vh * k,
    maxWidth: "none",
    maxHeight: "none",
  };

  const keyPresses =
    presses ?? (log && kind === "video" ? pressesFor(log, play) : []);

  let mark: React.ReactNode = null;
  if (markFocus && log && t >= markFocus[0] && t < markFocus[1]) {
    const f = focusAt(log, clipMs);
    if (f) {
      const pad = 7;
      const b = f.focus.box;
      const opacity = Math.min(
        1,
        (t - markFocus[0]) * 4,
        (markFocus[1] - t) * 4,
      );
      mark = (
        <div
          style={{
            position: "absolute",
            left: left + (b.x - pad) * k,
            top: top + (b.y - pad) * k,
            width: (b.w + pad * 2) * k,
            height: (b.h + pad * 2) * k,
            border: `3px dashed ${theme.onCapture}`,
            borderRadius: 6,
            opacity,
          }}
        >
          <div
            style={{
              ...smallCaps(15, theme.onCaptureInk),
              position: "absolute",
              left: -3,
              // Above the ring, unless that would cover the top of the page.
              ...(b.y < 90
                ? { top: "calc(100% + 8px)" }
                : { bottom: "calc(100% + 8px)" }),
              background: theme.onCapture,
              padding: "7px 10px 6px",
              borderRadius: 4,
            }}
          >
            Focus is here
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <StageClip>
        {kind === "video" ? (
          <Freeze frame={clipFrame}>
            <OffthreadVideo src={src} muted style={media} />
          </Freeze>
        ) : (
          <Img src={src} style={media} />
        )}
        {mark}
      </StageClip>
      {showKeys && keyPresses.length > 0 ? (
        <KeyOverlay presses={keyPresses} t={t} theme={theme} />
      ) : null}
    </>
  );
};
