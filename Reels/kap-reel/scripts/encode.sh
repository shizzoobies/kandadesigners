#!/usr/bin/env bash
#
# Section 11 encode targets.
#
# Takes one Remotion render plus an optional WAV mix and produces one delivery
# MP4: H.264 High profile, yuv420p, limited range, AAC 48 kHz stereo, 30 fps,
# faststart, at the Section 11 bitrate for that canvas.
#
# Usage:
#   scripts/encode.sh --input out/render-vertical-15s.mp4 \
#                     --output out/kap-reel-vertical-15s.mp4 \
#                     [--audio assets/audio/mix-a-15s.wav] \
#                     [--bitrate 12000k]
#
# Run it from the project root, through Git Bash or `npm run encode -- ...`.
# FFmpeg and FFprobe must be on PATH.
#
# Two notes on why this is more than a one liner:
#
# 1. Range. Remotion writes yuvj420p tagged full range. Section 11 wants
#    limited. Retagging alone would crush the levels, so the range is
#    converted in swscale and the output is tagged tv to match.
#
# 2. Matrix. The render is tagged bt470bg, which is honest: FFmpeg encoded it
#    with that matrix and decoding it back returns the brand canvas colour to
#    within one code value. Platforms assume bt709 for HD and some of them
#    ignore the tag, so the matrix is converted rather than carried through.
#
# Rate control is two pass with a cap, not CRF, because Section 11 states
# target bitrates and a two pass average lands on them.

set -euo pipefail

INPUT=""
OUTPUT=""
AUDIO=""
BITRATE=""

usage() {
  cat >&2 <<'USAGE'
usage: scripts/encode.sh --input <render.mp4> --output <delivery.mp4>
                         [--audio <mix.wav>] [--bitrate <n>k]

  --input    Remotion render, with or without its own audio track.
  --output   Delivery file. Section 11 names all five.
  --audio    WAV mix to mux, trimmed or padded to the video duration.
             Without it the render's own audio is kept, if it has any.
  --bitrate  Override the Section 11 bitrate for this canvas.
USAGE
  exit 2
}

while [ $# -gt 0 ]; do
  case "$1" in
    -i|--input)   INPUT="${2:-}"; shift 2 ;;
    -o|--output)  OUTPUT="${2:-}"; shift 2 ;;
    -a|--audio)   AUDIO="${2:-}"; shift 2 ;;
    -b|--bitrate) BITRATE="${2:-}"; shift 2 ;;
    -h|--help)    usage ;;
    *) echo "encode.sh: unknown argument '$1'" >&2; usage ;;
  esac
done

[ -n "$INPUT" ] && [ -n "$OUTPUT" ] || usage

if [ ! -f "$INPUT" ]; then
  echo "encode.sh: input not found: $INPUT" >&2
  exit 1
fi
if [ -n "$AUDIO" ] && [ ! -f "$AUDIO" ]; then
  echo "encode.sh: audio not found: $AUDIO" >&2
  exit 1
fi

command -v ffmpeg  >/dev/null 2>&1 || { echo "encode.sh: ffmpeg not on PATH" >&2; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { echo "encode.sh: ffprobe not on PATH" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Probe the input
# ---------------------------------------------------------------------------

probe_v() {
  ffprobe -v error -select_streams v:0 -show_entries "stream=$1" \
    -of default=nw=1:nk=1 "$INPUT" | head -1 | tr -d '\r'
}

WIDTH="$(probe_v width)"
HEIGHT="$(probe_v height)"
NB_FRAMES="$(probe_v nb_frames)"
RATE="$(probe_v r_frame_rate)"
IN_RANGE_RAW="$(probe_v color_range)"
IN_MATRIX_RAW="$(probe_v color_space)"
IN_PIXFMT="$(probe_v pix_fmt)"

HAS_AUDIO="$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_type \
  -of default=nw=1:nk=1 "$INPUT" | head -1 | tr -d '\r')"

# Frame rate as a decimal, so the video duration can be derived from the frame
# count rather than from the container duration. The container duration follows
# whichever stream is longest, and a render muxed with a slightly long audio
# track reports more than the picture actually runs.
FPS="$(awk -v r="$RATE" 'BEGIN { split(r, p, "/"); printf "%.6f", p[1] / (p[2] == 0 ? 1 : p[2]) }')"
if [ -z "$NB_FRAMES" ] || [ "$NB_FRAMES" = "N/A" ]; then
  NB_FRAMES="$(ffprobe -v error -select_streams v:0 -count_packets \
    -show_entries stream=nb_read_packets -of default=nw=1:nk=1 "$INPUT" | tr -d '\r')"
fi
DURATION="$(awk -v f="$NB_FRAMES" -v r="$FPS" 'BEGIN { printf "%.6f", f / r }')"

# ---------------------------------------------------------------------------
# Section 11 bitrate table, keyed on canvas
# ---------------------------------------------------------------------------

if [ -z "$BITRATE" ]; then
  case "${WIDTH}x${HEIGHT}" in
    1080x1920) BITRATE="12000k" ;;  # vertical, Facebook Reels and LinkedIn vertical
    1920x1080) BITRATE="12000k" ;;  # landscape, LinkedIn desktop
    1080x1350) BITRATE="10000k" ;;  # feed, and the LinkedIn 45s primary
    1080x1080) BITRATE="10000k" ;;  # square
    *)
      echo "encode.sh: ${WIDTH}x${HEIGHT} is not a Section 11 canvas." >&2
      echo "           Pass --bitrate to encode it anyway." >&2
      exit 1
      ;;
  esac
fi

# Cap and buffer around the two pass average. 1.5x cap with a 2x buffer keeps
# the peaks off a scheduler's reject list while letting the average land on
# target across a cut this short.
NUM_BITRATE="${BITRATE%k}"
MAXRATE="$(awk -v b="$NUM_BITRATE" 'BEGIN { printf "%dk", b * 3 / 2 }')"
BUFSIZE="$(awk -v b="$NUM_BITRATE" 'BEGIN { printf "%dk", b * 2 }')"

# ---------------------------------------------------------------------------
# Colour conversion
# ---------------------------------------------------------------------------

case "${IN_RANGE_RAW}${IN_PIXFMT}" in
  pc*|full*|*yuvj*) IN_RANGE="full" ;;
  tv*|limited*)     IN_RANGE="limited" ;;
  *)                IN_RANGE="limited" ;;
esac

case "$IN_MATRIX_RAW" in
  ""|unknown|N/A|reserved) IN_MATRIX="bt709" ;;
  *)                       IN_MATRIX="$IN_MATRIX_RAW" ;;
esac

VF="scale=in_range=${IN_RANGE}:out_range=limited"
VF="${VF}:in_color_matrix=${IN_MATRIX}:out_color_matrix=bt709,format=yuv420p"

# ---------------------------------------------------------------------------
# Audio graph
# ---------------------------------------------------------------------------

AFORMAT="aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo"

# apad then atrim, in that order, so a mix shorter than the picture is padded
# with silence and a longer one is cut. Either way the audio ends exactly with
# the last frame and the delivered duration is the picture's.
AUDIO_CHAIN="${AFORMAT},apad,atrim=0:${DURATION},asetpts=N/SR/TB"

AUDIO_INPUT=()
AUDIO_MAP=()
AUDIO_CODEC=()
AUDIO_SOURCE="none"

if [ -n "$AUDIO" ]; then
  AUDIO_INPUT=(-i "$AUDIO")
  AUDIO_MAP=(-filter_complex "[1:a]${AUDIO_CHAIN}[aout]" -map "[aout]")
  AUDIO_SOURCE="$AUDIO"
elif [ "$HAS_AUDIO" = "audio" ]; then
  AUDIO_MAP=(-filter_complex "[0:a]${AUDIO_CHAIN}[aout]" -map "[aout]")
  AUDIO_SOURCE="the render's own track"
fi

if [ "$AUDIO_SOURCE" != "none" ]; then
  AUDIO_CODEC=(-c:a aac -b:a 256k -ar 48000 -ac 2)
else
  AUDIO_CODEC=(-an)
fi

# ---------------------------------------------------------------------------
# Encode
# ---------------------------------------------------------------------------

OUT_DIR="$(dirname "$OUTPUT")"
mkdir -p "$OUT_DIR"
PASSLOG="${OUT_DIR}/.ffpass-$$"
cleanup() { rm -f "${PASSLOG}"* 2>/dev/null || true; }
trap cleanup EXIT

X264_COMMON=(
  -c:v libx264
  -profile:v high
  -level 4.2
  -preset slow
  -pix_fmt yuv420p
  -b:v "$BITRATE"
  -maxrate "$MAXRATE"
  -bufsize "$BUFSIZE"
  -g 60
  -keyint_min 30
  -sc_threshold 0
  -r 30
  -color_range tv
  -colorspace bt709
  -color_primaries bt709
  -color_trc bt709
)

echo "[encode] $(basename "$OUTPUT")"
echo "  input     $INPUT"
echo "  canvas    ${WIDTH}x${HEIGHT}, ${NB_FRAMES} frames, ${DURATION}s at ${FPS} fps"
echo "  colour    in ${IN_PIXFMT} ${IN_RANGE} ${IN_MATRIX} -> yuv420p limited bt709"
echo "  bitrate   ${BITRATE} target, ${MAXRATE} cap, ${BUFSIZE} buffer, two pass"
echo "  audio     ${AUDIO_SOURCE}"

ffmpeg -hide_banner -nostdin -v error -stats \
  -i "$INPUT" \
  -map 0:v:0 -vf "$VF" \
  "${X264_COMMON[@]}" \
  -pass 1 -passlogfile "$PASSLOG" \
  -an -f null - </dev/null

ffmpeg -hide_banner -nostdin -v error -stats \
  -i "$INPUT" "${AUDIO_INPUT[@]}" \
  -map 0:v:0 -vf "$VF" \
  "${X264_COMMON[@]}" \
  -pass 2 -passlogfile "$PASSLOG" \
  "${AUDIO_MAP[@]}" "${AUDIO_CODEC[@]}" \
  -movflags +faststart \
  -y "$OUTPUT" </dev/null

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

summarise() {
  local file="$1"
  local v a
  v="$(ffprobe -v error -select_streams v:0 -show_entries \
    stream=codec_name,profile,width,height,pix_fmt,color_range,color_space,r_frame_rate,nb_frames,bit_rate \
    -of default=nw=1 "$file" | tr -d '\r')"
  a="$(ffprobe -v error -select_streams a:0 -show_entries \
    stream=codec_name,profile,sample_rate,channels,bit_rate \
    -of default=nw=1 "$file" | tr -d '\r')"
  local dur size overall
  dur="$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$file" | tr -d '\r')"
  overall="$(ffprobe -v error -show_entries format=bit_rate -of default=nw=1:nk=1 "$file" | tr -d '\r')"
  size="$(ffprobe -v error -show_entries format=size -of default=nw=1:nk=1 "$file" | tr -d '\r')"

  get() { echo "$v" | awk -F= -v k="$1" '$1 == k { print $2 }'; }
  geta() { echo "$a" | awk -F= -v k="$1" '$1 == k { print $2 }'; }

  echo "[ffprobe] $file"
  echo "  video    $(get codec_name) $(get profile), $(get pix_fmt), range $(get color_range), matrix $(get color_space)"
  echo "  picture  $(get width)x$(get height), $(get r_frame_rate) fps, $(get nb_frames) frames"
  echo "  rate     video $(get bit_rate) bps, overall ${overall} bps"
  echo "  length   ${dur}s, $(awk -v s="$size" 'BEGIN { printf "%.1f", s / 1048576 }') MB"
  if [ -n "$(geta codec_name)" ]; then
    echo "  audio    $(geta codec_name) $(geta profile), $(geta sample_rate) Hz, $(geta channels) ch, $(geta bit_rate) bps"
  else
    echo "  audio    none"
  fi
}

summarise "$OUTPUT"
