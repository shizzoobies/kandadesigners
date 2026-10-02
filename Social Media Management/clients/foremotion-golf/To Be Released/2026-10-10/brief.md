# Brief: Walk the space

Slot: Sat 2026-10-10, 12:00 PM Eastern. Facebook and Instagram REEL, 1080x1920, 30 fps, 20.8 seconds, silent until the finisher adds the track.
Pillar: the experience (phase 3). The plan is `plans/2026-10-02-founders-funnel.md`, slot "Sat Oct 10", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
The longest look at the space so far, in the order a visitor would see it: in the door, the room for the four TrackMan bays, the putting area, the bar and lounge. Real footage of the empty former DMV, before the build. One ask: join the Founders List.

## Hook
"Walk the space." The first line on screen and caption line 1.

## Call to action
Join the Founders List at foremotiongolf.com, on screen for the last 3.5 seconds. Facebook line 2 and the closing line carry `https://foremotiongolf.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-10`. Instagram says link in bio; hashtags under `## First comment`.

## The cut
Real footage only, from the two walkthroughs, downscaled to 1080x1920 at 30 fps. On every footage frame: the stacked Aug 2 logo (`Secondary`) on a deep forest tab at top center, foremotiongolf.com on a deep forest tab at the foot, and a full-width deep forest band carrying our line in Oswald Bold (cream, key word in logo green). The band sits exactly over the burned-in captions of each shot, so none show.
1. 0.0 to 4.9 s. Walkthrough 1, 0.0 to 4.9: the front lobby by the entrance. "Walk the space." with "1518 Park Ave, Orange Park".
2. 4.9 to 7.5 s. Walkthrough 2, 32.75 to 35.37: walking into the long room where the bays go. "Four TrackMan bays."
3. 7.5 to 10.2 s. Walkthrough 2, 35.37 to 38.0: the same shot, the room's full length. "Up to six players each."
4. 10.2 to 14.6 s. Walkthrough 1, 26.5 to 30.9: where the putting area goes. "A putting area."
5. 14.6 to 17.3 s. Walkthrough 1, 13.25 to 15.95: along the old counter on the bar side. Logo and line share a full-width top band here, because this shot's captions sit at the top. "A bar and lounge."
6. 17.3 to 20.8 s. End card: logo, "Join the Founders List.", "Opening early 2027", "1518 Park Ave, Orange Park, FL", foremotiongolf.com.
Thumbnail: `media/reel-cover.jpg`, a frame from beat 2.

What was cut from the walkthroughs, and why:
- Every concept render (bar, coolers, putting green, bays, repair bench, pro shop): the bar render's caption says "thirty-foot", the cooler and pro shop renders show other companies' labels and logos (Nike, PING, Titleist and others), the putting green render carries another venue's sign, and the repair bench render shows the old concept logo. With no renders used, no "Concept" label is needed.
- The repairs segment and every "equipment repairs" and "watch parties" caption.
- Captions that state numbers not in the facts ("seventeen" and "seventy" feet, "eight players", "thirty-two players"): those shots are either cut or sit under our band.
- Transition blurs between shots.
- Left in: the cap and polo of the person on camera carry small maker marks. They are worn clothing, not a placed logo; flagged for Alex in the build report.

## Sources and truth
- Facts on screen and in captions: four TrackMan bays, up to six players per bay, a putting area, a bar and lounge, 1518 Park Ave in Orange Park, the former DMV, opening early 2027. All in content-facts and the plan.
- The person on camera is not named.
- Never said: an opening month or day, any price, a count of Founders, thirty-foot bar, equipment repairs, watch parties, anything about the Founders Cup.

## AI
No AI voice or visuals. Music: finisher (track `music-fmg-1010-r`).

## Build
`node source/build.mjs` (from `source/`): renders the overlays (HTML to transparent PNG with Playwright, `source/overlays/`, `source/overlays.html`), cuts the five windows from the walkthroughs with ffmpeg, overlays them, adds the end card, and writes `media/reel.mp4` (H.264, yuv420p, 30 fps, no audio) and `media/reel-cover.jpg`. `source/contrast.json`: lowest pair 5.45:1; all text sits on solid deep forest or logo green, never on footage.

## Questions for Alex
- Want a specific Instagram sound on this reel? Write "Sound: title by artist" in a note here and we will set it before it posts. Sounds come from the Instagram library this account can use.
