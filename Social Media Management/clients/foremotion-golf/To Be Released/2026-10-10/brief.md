# Brief: Walk the space

Slot: Sat 2026-10-10, 12:00 PM Eastern. Facebook and Instagram REEL, 1080x1920, 30 fps, 67.5 seconds. Music muxed (`music-fmg-1010-r`).
Version: v4 (2026-10-03): the v3 structure (one continuous take of owner Justin Myrick, one dissolve into one continuous 3D concept move, then the end card; no cutting back) with a smoothed join: the dissolve is 2.0 s and eased (smoothstep), the Concept tab eases in over 0.6 s from the first frame of the dissolve, the lines crossfade between beats over 0.6 s while the band stays constant, the end card eases in over 0.6 s, and the real take is trimmed after decode at 60 fps and decimated by frame index (every second frame), so the take keeps an even cadence into the dissolve. Earlier versions: `source/reel-silent-v1.mp4` (real footage only), `-v2.mp4` (the intercut), `-v3.mp4` (one dissolve, 1.0 s, linear), with `media/reel-v2.mp4` and `media/reel-v3.mp4`.
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sat Oct 10", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Owner Justin Myrick walking the real counter of the empty former DMV, before the build; the shot dissolves into the full visual tour of the interactive 3D venue concept, as the website plays it: down to the front entrance, in through the door to the bar, around the putting green and into a bay, then rising back out. One ask: join the Founders List.

## Hook
"Walk the space." Caption line 1. On screen the reel opens on "Owner Justin Myrick walks the space."

## Call to action
Join the Founders List at foremotiongolf.com, on screen for the last 3.5 seconds. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-10`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
On every frame: the stacked Aug 2 logo (`Secondary`) at top center on its deep forest tab (over the top band during Justin's take) and foremotiongolf.com on a deep forest tab at the foot. The "Concept" tab (cream Oswald on deep forest, top left) eases in from the first frame of the dissolve and stays until the end card covers it; it is on no frame of Justin alone.

| Reel time | Source | What it shows | On screen |
|---|---|---|---|
| 0.0 to 6.0 | Walkthrough 1, 0:37.20 to 0:43.20, one continuous take | Real: Justin walking the old counter past the bar area | In a full-width top band under the logo: "Owner Justin Myrick walks the space." |
| 4.0 to 6.0 | dissolve, 2.0 s, eased (smoothstep) | Justin eases into the Tour | the top band holds; the "Concept" tab eases in 4.0 to 4.6 |
| 4.0 to 64.0 | 3D concept, the site's Tour, `v3-tour.mp4` 0.0 to 60.0 s, one continuous move | Concept, the Tour's own stops in order: Approach the entrance (0 to 7.5 s), Through the front door to the bar (7.5 to 19.5), At the bar (19.5 to 22), Around the putting green to a bay (22 to 51), Inside the bay (51 to 54), Rise out of the bay (54 to 57.5), Return to the overview (57.5 to 60 of its 8 s) | 6.0 to 6.6: the top band eases out as the foot band eases in with "The concept, start to finish."; it eases out 11.7 to 12.3; then the logo tab and URL only |
| 63.4 to 67.5 | end card, eased in 63.4 to 64.0 | Deep forest card | logo, "Join the Founders List.", "Opening early 2027", "1518 Park Ave, Orange Park, FL", foremotiongolf.com |

The Tour runs 65.5 s on the site; it is trimmed only at the end, at 60 s, 2.5 s into "Return to the overview". It was captured by stepping the page's own Tour object (`__FORE_MOTION__.walkthrough.sample(t)`, the same camera path, target and field of view the Tour button plays, with the Tour's rule for showing the exterior walls while walking) at 30 fps in a 1080x1920 frame. The site's live playback also eases the camera's turn toward each sample; the capture uses the exact samples.
Thumbnail: `media/reel-cover.jpg`, the frame at 2.5 s (Justin on the counter walk, real footage, not a render).

Justin footage progression across the four reels (no second is used twice; each take checked frame by frame for source hitches at 60 fps):
- 10/4 Walkthrough 2, 0:31.617 to 0:36.617 (the walk in; ends one frame before a hitch in Hannah's master at 0:36.62, a repeated frame then a jump, which read as the jump at 4.9 s in v3)
- 10/6 Walkthrough 2, 0:44.30 to 0:51.30 (further into the bay room)
- 10/8 Walkthrough 1, 0:00.00 to 0:06.30 (at the bar wall)
- 10/10 Walkthrough 1, 0:37.20 to 0:43.20 (walking the counter past the bar area, the latest clean stretch; a whip blur starts at 0:43.7)
3D progression: 10/4 overview pushing toward the bays, 10/6 through the bays, 10/8 the bar and lounge, 10/10 the site's own Tour (this reel).

What was cut from the walkthroughs, and why:
- Hannah's burned-in captions in this take ("As we walk around", "Once we get past the bar", "We're gonna have a") sit in the top quarter of the frame (16 to 24% of the height), checked at 4 and 10 frames a second, among them "Large merchandise area" near the end of the take; the top band (0 to 580 px) covers them on every frame of the take and through the dissolve.
- Every one of Hannah's concept renders (bar, coolers, putting green, bays, repair bench, pro shop): other companies' labels and logos (Nike, PING, Titleist and others), another venue's sign, the old concept logo, a "thirty-foot" caption. The only concept images are the site's 3D Tour, labeled.
- The repairs segment and every "equipment repairs" and "watch parties" caption.
- Left in: Justin's cap carries a small maker mark (Callaway). Worn clothing, not a placed logo; flagged for Alex.

## Sources and truth
- Facts on screen and in captions: four TrackMan bays, up to six players per bay, a putting area, a bar and lounge, 1518 Park Ave in Orange Park, the former DMV, opening early 2027. All in content-facts and the plan.
- Justin Myrick is the owner and the man on camera; Alex asked for him to be named (2026-10-02 night).
- The 3D Tour: the interactive 3D venue concept on foremotiongolf.com (foremotiongolf.com/golf-3d/v2/), captured 2026-10-02. It is a concept, labeled on screen and in the caption.
- Never said: an opening month or day, any price, a count of Founders, thirty-foot bar, equipment repairs, watch parties, anything about the Founders Cup.

## AI
No AI voice or AI visuals. The 3D Tour is a capture of the venue concept model, not AI generated. Music: `music-fmg-1010-r`, muxed 2026-10-02 late night. The track is 50.0 s and the reel 67.5 s, so the track plays twice, its end crossfaded (2 s) into its start, then the usual method: video copied from `source/reel-silent.mp4`, trimmed to length with a 1.5 s fade-out, two-pass loudnorm to -14 LUFS (linear), alimiter 0.7, AAC 192k 48 kHz (reading -14.4 LUFS integrated, -1.9 dBTP). The same track is not used again within 30 days; repeating it inside this one reel is the only repeat. Mux script: `D:/kap-reel/out/fmg-3d/tools/mux.mjs`.

## Build
`node source/build.mjs` (from `source/`): renders the overlays (HTML to transparent PNG with Playwright, `source/overlays/`, `source/overlays.html`), joins the Justin take and the Tour with one eased 2.0 s dissolve, overlays the constant chrome, the beat lines (eased 0.6 s crossfades) and the Concept tab (eased in) as layers with eased alpha, eases into the end card, and writes `source/reel-silent.mp4` (H.264, yuv420p, 30 fps, no audio), `media/reel-cover.jpg` and `source/frames-contact-sheet.jpg`. The Tour is captured by `D:/kap-reel/out/fmg-3d/tools/capture3.mjs`; the compositing is `D:/kap-reel/out/fmg-3d/tools/compose.mjs`, shared by the four reels. `source/contrast.json`: lowest pair 5.45:1; all text sits on solid deep forest or logo green, never on footage.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
