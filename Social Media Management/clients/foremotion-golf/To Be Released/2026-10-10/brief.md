# Brief: Walk the space

Slot: Sat 2026-10-10, 12:00 PM Eastern. Facebook and Instagram REEL, 1080x1920, 30 fps, 21.7 seconds. v2 (2026-10-02 night): rebuilt as an intercut of owner Justin Myrick in the real space with the 3D venue concept (Alex's call: all four reels, name him, Concept tab on every 3D shot). Music muxed (`music-fmg-1010-r`).
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sat Oct 10", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick walks the space in the order a visitor would see it: in the door, the room for the four TrackMan bays, the putting area, the bar and lounge. Real footage of the empty former DMV, before the build, cut with two labeled shots of the interactive 3D venue concept: the bays and the putting green, as planned. One ask: join the Founders List.

## Hook
"Walk the space." The first line on screen (with "Owner Justin Myrick walks the space." under it) and caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com, on screen for the last 3.5 seconds. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-10`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
An intercut, hard cuts, 21.7 s, downscaled to 1080x1920 at 30 fps. Real footage from the two walkthroughs and two shots of the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (`D:kap-reeloutmg-3days-push.mp4`, `putting-green.mp4`). On every frame: the stacked Aug 2 logo (`Secondary`) on a deep forest tab at top center, foremotiongolf.com on a deep forest tab at the foot, and a full-width deep forest band carrying our line in Oswald Bold (cream, key word in logo green). On real frames the band sits exactly over the burned-in captions of each shot, so none show. On every 3D frame, and on no real frame, a "Concept" tab sits top left.

| Reel time | Source | What it shows | On screen |
|---|---|---|---|
| 0.0 to 3.5 | W1 0.0 to 3.5 | Real: Justin in the front lobby by the entrance, gesturing | "Walk the space." "Owner Justin Myrick walks the space." |
| 3.5 to 6.5 | W2 32.75 to 35.75 | Real: Justin walks into the long room where the bays go, arm out at the wall | "Four TrackMan bays." |
| 6.5 to 9.5 | 3D concept, bays-push 1.0 to 4.0 s | Concept: a push into a bay, a golfer on the tee mat. "Concept" tab | "The bays, as planned." |
| 9.5 to 12.5 | W1 26.5 to 29.5 | Real: Justin where the putting area goes, gesturing | "A putting area." |
| 12.5 to 15.5 | 3D concept, putting-green 0.5 to 3.5 s | Concept: a track along the central putting green. Logo and line share a full-width top band; "Concept" tab under it, top left | "The putting green." |
| 15.5 to 18.2 | W1 13.25 to 15.95 | Real: Justin along the old counter on the bar side. Logo and line share a full-width top band here, because this shot's captions sit at the top | "A bar and lounge." |
| 18.2 to 21.7 | none | End card | logo, "Join the Founders List.", "Opening early 2027", "1518 Park Ave, Orange Park, FL", foremotiongolf.com |

Thumbnail: `media/reel-cover.jpg`, the frame at 4.8 s (Justin at the bay wall, real footage, not a render).
v1 (real footage only, 20.8 s) is kept as `source/reel-silent-v1.mp4`. "Up to six players each" was dropped for length; the caption keeps it.

What was cut from the walkthroughs, and why:
- Every one of Hannah's concept renders (bar, coolers, putting green, bays, repair bench, pro shop): the bar render's caption says "thirty-foot", the cooler and pro shop renders show other companies' labels and logos (Nike, PING, Titleist and others), the putting green render carries another venue's sign, and the repair bench render shows the old concept logo. The only concept images are the two 3D venue concept shots, labeled.
- The repairs segment and every "equipment repairs" and "watch parties" caption.
- Captions that state numbers not in the facts ("seventeen" and "seventy" feet, "eight players", "thirty-two players"): those shots are either cut or sit under our band. Every real stretch sits inside v1's frame-checked windows.
- Transition blurs between shots.
- Left in: Justin's cap and polo carry small maker marks (a Callaway cap). They are worn clothing, not a placed logo; flagged for Alex.

## Sources and truth
- Facts on screen and in captions: four TrackMan bays, up to six players per bay, a putting area, a bar and lounge, 1518 Park Ave in Orange Park, the former DMV, opening early 2027. All in content-facts and the plan.
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- The 3D shots: the interactive 3D venue concept on foremotiongolf.com, captured 2026-10-02 (foremotiongolf.com/golf-3d/v2/). They are a concept, labeled on screen and in the caption.
- Never said: an opening month or day, any price, a count of Founders, thirty-foot bar, equipment repairs, watch parties, anything about the Founders Cup.

## AI
No AI voice or AI visuals. The 3D shots are captures of the venue concept model, not AI generated. Music: `music-fmg-1010-r`, muxed 2026-10-02 night: video copied from `source/reel-silent.mp4`, track trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.7, AAC 192k 48 kHz (reading -14.4 LUFS integrated, -2.4 dBTP). Mux script: `D:kap-reeloutmg-3d	oolsmux.mjs`.

## Build
`node source/build.mjs` (from `source/`): renders the overlays (HTML to transparent PNG with Playwright, `source/overlays/`, `source/overlays.html`), cuts the four real windows and the two 3D shots with ffmpeg, overlays them, adds the end card, and writes `source/reel-silent.mp4` (H.264, yuv420p, 30 fps, no audio) and `media/reel-cover.jpg`. The 3D clips are captured by `D:kap-reeloutmg-3d	oolscapture.mjs`. `source/contrast.json`: lowest pair 5.45:1; all text sits on solid deep forest or logo green, never on footage.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
