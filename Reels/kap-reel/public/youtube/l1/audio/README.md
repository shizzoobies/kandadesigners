# L1 audio: narration and music bed

YouTube L1, "Test your website with one key" (folder `2026-10-02-4`, publishes Fri 2026-10-02 at 11:00 AM). Task A3 of `Social Media Management/plans/youtube-2026-09-28/SPEC.md`. Made 2026-09-28.

Generators: `scripts/youtube/l1/voice.ts` and `scripts/youtube/l1/music.ts` (run from `D:\kap-reel` with `node node_modules/tsx/dist/cli.mjs <file>`, never npx).

## What is here

| Path | What |
|---|---|
| `voice/beat-01.mp3` to `voice/beat-13.mp3` | The kept take of each beat. mp3, 44.1 kHz, mono, 192 kbps |
| `voice/takes/` | Every take (`beat-NN-tK.mp3`) with its transcript (`.stt.json`) |
| `voice/tests/` | The pronunciation tests, with transcripts |
| `voice.json` | Manifest: per beat, the exact text sent, duration, take count, kept take and measured credits; every take's checks |
| `music/music-yt-l1.mp3` | **The chosen bed** (a copy of candidate A). The file name is the track id |
| `music/music-yt-l1-a.mp3` | Candidate A, recommended |
| `music/music-yt-l1-b-trimmed.mp3` | Candidate B, its opening trimmed (the alternative) |
| `music/music-yt-l1-b.mp3` | Candidate B as generated, kept for the record |

## Narration

Amy (`OZxMHsGaBmV5pjMIDIn0`), `eleven_multilingual_v2`, stability 0.5, similarity 0.75, style 0, speaker boost on, speed 1, `mp3_44100_192`. The text comes verbatim from `To Be Released/2026-10-02-4/source/script.md`; paragraphs inside a beat are sent joined by a newline, as the script has them. No line was changed.

**Total: 315.93 s (5:15.9)** across the 13 kept files, including about 0.3 s of room tone at the head and tail of each.

| Beat | Title | Duration | Takes | Kept | Credits (all takes) | Integrated | True peak | Gain to -16 LUFS |
|---|---|---|---|---|---|---|---|---|
| 1 | Hook | 10.68 s | 3 | 2 | 528 | -27.6 LUFS | -7.2 dBTP | +11.6 dB |
| 2 | Intro | 13.19 s | 1 | 1 | 211 | -30.9 | -11.5 | +14.9 |
| 3 | What focus is | 50.90 s | 2 | 2 | 1,602 | -33.4 | -13.3 | +17.4 |
| 4 | How to run it | 31.39 s | 1 | 1 | 429 | -33.9 | -12.4 | +17.9 |
| 5 | Check one | 23.92 s | 1 | 1 | 322 | -29.9 | -10.9 | +13.9 |
| 6 | Check two | 22.48 s | 1 | 1 | 331 | -32.1 | -12.7 | +16.1 |
| 7 | Check three | 20.20 s | 1 | 1 | 271 | -29.0 | -8.9 | +13.0 |
| 8 | Check four | 25.31 s | 1 (re-voiced 2026-09-28, new line) | 1 | 362 (+345 superseded) | -29.8 | -9.7 (sample) | +13.8 |
| 9 | Check five | 21.18 s | 1 | 1 | 300 | -30.1 | -11.7 | +14.1 |
| 10 | Check six | 23.41 s | 1 | 1 | 352 | -30.8 | -9.4 | +14.8 |
| 11 | Ask your web person | 45.70 s | 2 | 2 | 1,274 | -31.9 | -10.5 | +15.9 |
| 12 | Recap | 25.26 s | 1 | 1 | 359 | -27.7 | -7.1 | +11.7 |
| 13 | End screen | 3.62 s | 3 | 1 | 192 | -29.3 | -11.3 | +13.3 |

### How takes were judged

By measurement, not by ear. Every take was transcribed (ElevenLabs `scribe_v2`, word timestamps, audio event tags) and compared word for word with the text sent, and measured for leading and trailing silence, pauses inside a phrase, clipping, level steps across the beat (gated loudness in 6 s windows) and pace against the script's median (14.61 characters a second). The lowest check score was kept automatically.

- **Beat 11:** take 1 read "every menu, popup **in** chat window". That changes the meaning, so it was retaken; take 2 says "popup **and** chat window".
- **Beat 3:** take 1 dropped 5 LU at its second paragraph ("Who needs that?"), from -30.6 to -35.6 LUFS. Take 2 is level (2.4 LU spread across the beat).
- **Beat 1:** take 1 ran 30% faster than the rest. Takes 2 and 3 both run 17% fast; take 2 is kept. A slightly brisker hook reads as intended energy, but give it a listen.
- **Beat 13:** all three takes ran fast on this short line (3.62 s, 2.93 s, 3.06 s). The slowest, take 1, is kept.
- Beats 2, 4 to 10 and 12: clean on take 1. Beat 12's second paragraph (the call to action) sits 2.5 LU under its first, within normal speech variation.

**For Alex's ear:** beats 1 and 13 (pace), and the two W-C-A-G moments (beat 3 at about 0:47 in its file, beat 11 at about 0:34).

### W-C-A-G

**"W-C-A-G" worked, and it is what the beats use.** It reads as four letters. In the frame "__ two point two", the transcriber's W-C-A-G token ran 0.62 s, against 0.28 s for a forced word read ("wick-ag", `test-08`) and 1.02 s for forced letters ("double-you, see, ay, gee", `test-09`); both W-C-A-G tests came back as WCAG with full confidence. "W, C, A, G" (`test-06`, `test-07`) read slower, but alone it came back as "WC AJ", with the A and G running together. In the kept beats the token runs 0.92 s (beat 3) and 0.96 s (beat 11).

The other test lines: "K and A Performance" was heard as "K&A performance", "the Ninety-Day AI Launch" as "The 90-day AI launch", and "pickup" as "Pick up". All are clean.

### Length against the brief

The outline assumed Amy's audition pace (about 16.9 characters a second, narration about 4:35). On this script she measures 14.6, so the narration is 5:16. Add the pauses between beats, the held checklist in beat 11 and the 20 second end screen (beat 13's line opens it), and the cut lands at about **5:45 to 5:55**. That's over the brief's 5:00 to 5:30, but under the outline's 6:00 trim line (outline sections 2 and 8.10: trim beat 3's "broken arm" and "There's a standard" sentences, and the spoken WCAG list in beat 11). Nothing was trimmed here. That's Alex's call.

## Music: `music-yt-l1`

ElevenLabs `music_v2`, `force_instrumental`, 390 s asked, one call each. The prompt is logged in full in `config/audio.json` under `set: "youtube-l1"`. The endpoint returns mp3 at 48 kHz, 192 kbps stereo when asked for `mp3_48000_320`, the same as every earlier bed. Both candidates carry the house no-vocals instruction and a long-bed instruction: steady from start to finish, space left in the midrange, no build, drop or breakdown, and a clean ending.

| | Candidate A, **recommended** | Candidate B, trimmed |
|---|---|---|
| File | `music/music-yt-l1-a.mp3` (= `music-yt-l1.mp3`) | `music/music-yt-l1-b-trimmed.mp3` |
| Sound | Calm, warm downtempo, about 84 bpm: soft vibraphone chords, warm analog pads, mellow electric bass, brushed shaker and rim click | Calm ambient electronic, about 90 bpm: filtered synth arpeggio, evolving pads, sub bass, soft muted kick and ticking hat |
| Length | 390.02 s (6:30); level to about 6:20, then rings out | 368.68 s (6:09); level to about 5:50, then fades |
| Integrated, true peak, LRA | -17.6 LUFS, -1.0 dBTP, 3.6 LU | -14.7 LUFS, -1.4 dBTP, 2.6 LU |
| Steadiness (10 s blocks) | Within +0.5 / -0.3 dB of the median across the whole track | Within +0.9 / -1.2 dB |
| Checks | Pass: no leading or mid-track silence, first second at full level, no clipping, clean ring-out | Pass after the trim |
| Vocal check (scribe_v2) | 0 words | 0 words |

**Why A:** it's the steadier of the two from the first second to the last, it's long enough that its ring-out lands after a 5:55 cut, and it passed every check as generated. B came back with a 21 second pad intro despite the instruction. It is trimmed at the downbeat where its groove enters (21.346 s, just before the 21.36 s onset, 5 ms fade in; `music.ts trim b 21.346`), and its level holds only until about 5:50, which is tight against the projected cut. The raw B stays on disk.

**Using the bed:** start it at 0:00 under the hook and let it run. At 6:30, A is longer than the cut, so it needs no loop and no join. Fade it out over the last 2 to 3 seconds of the end screen. If the cut ever runs past 6:15, A is flat enough to extend: crossfade (equal power, 2 s) from a point near 5:50 back to a point near 1:00, with both points on a downbeat.

**If Alex picks B instead:** run `node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/music.ts choose b` after removing the `music-yt-l1` entry from `music-history.json`, or copy `music-yt-l1-b-trimmed.mp3` over `music-yt-l1.mp3` and update that entry's `_note`. The track id stays `music-yt-l1` either way.

Logged in `Social Media Management/music-history.json` as `music-yt-l1`, published 2026-10-02. The `2026-10-02-4/post.json` `music` field is not set yet; set it to `music-yt-l1` when the post is built. The validator counts a same-day use once.

## Loudness targets for the mix

- **Program:** -14 LUFS integrated, true peak -1 dBTP or lower, measured on the delivered file after the AAC encode.
- **Voice:** Amy's source is quiet, -27.6 to -33.9 LUFS, and the beats differ by up to 6 LU. Level every beat to one loudness first (the gain column above takes each to -16 LUFS). Her peaks sit 19 to 21 dB over her loudness, so at program level the voice needs a compressor plus a limiter: about 6 to 8 dB of peak control to hold -1 dBTP with the voice near -14.5 LUFS. The house tools are in `scripts/audio.ts` (`limiter`, `headroomCeilingDb`, `LOUDNORM_TARGET`, `correctLoudness`).
- **Music under the voice:** -24 to -28 LUFS in the finished program, 10 to 14 LU under the voice. A measures -17.6 LUFS as delivered, so start at about **-9 dB** (about -26.6 LUFS) and adjust by ear. B-trimmed measures -14.7, so start at about -12 dB. A steady bed at that level doesn't need a sidechain duck; a light 2 to 3 dB duck under speech is optional.
- **End screen (last 20 s):** after beat 13's line, bring the bed up over about 1 s to around -18 LUFS (A at about -0.5 dB, so close to unity), then fade out at the end.

## Credits

Measured as before and after deltas on `/v1/usage/character-stats`. For text to speech, every delta equals the characters sent (the one exception is beat 4 take 1, billed 429 for 444 characters), so nothing else was spending on the account in those windows. Each music take cost exactly 10,669.

| What | Calls | Credits |
|---|---|---|
| Pronunciation tests: 5 named lines, 2 "W, C, A, G" lines, 2 calibration reads | 9 | 171 |
| Narration, 13 beats: 13 first takes (4,598) plus 6 retakes (1,918) | 19 | 6,516 |
| Transcription checks on every take and test (scribe_v2) | 28 | 196 |
| Music, candidates A and B (390 s each) | 2 | 21,338 |
| Music vocal checks (scribe_v2) | 2 | 362 |
| **Total** | **60** | **28,583** |

## Licensing

Amy is an ElevenLabs Voice Library voice (category `professional`), not a premade one. `LICENSING.md` ("Narration (text to speech), tutorial reels", "To confirm before publishing") notes that the voice-specific commercial position is still to confirm, and that a Voice Library voice adds a second question on top of it. The music is on the same Pro plan as every earlier bed, covered by the Music rights and the 2026-09-04 commercial use confirmation. See the "YouTube L1 narration and music" section of `LICENSING.md`.

## Regenerating

```
node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts report
node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts beat <n> --retake     (three takes a beat at most)
node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts keep <n> <take> --why "..."
node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/voice.ts recheck               (checks only, no API calls)
node node_modules/tsx/dist/cli.mjs scripts/youtube/l1/music.ts check <mp3>
```

If a line in `script.md` changes, move that beat's old takes out of `voice/takes/` and drop its entry from `voice.json`. The script refuses to add takes to a beat whose text no longer matches its record.
