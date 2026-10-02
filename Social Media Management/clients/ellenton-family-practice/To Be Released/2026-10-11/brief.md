# Brief: Flu shots, this season

Slot: Sun 2026-10-11, 12:00 PM Eastern. Facebook and Instagram REEL, 1080x1920, 18.5 seconds, 30 fps, H.264, silent (the finisher adds track `music-efp-1011-r`).
Pillar: education (week 2 lead). The plan is `plans/2026-10-03-new-patients.md`, slot "Sun Oct 11. Flu season", reel.
Approved: yes (Alex in chat, 2026-10-02: build the whole plan)

## What the viewer gets
Three general facts about this season's flu vaccine, each sourced to the CDC: who should get one, when, and how long protection takes to build. It ends on "Ask about availability when you call." and the phone. No brand names, no claim that the office has doses.

## Hook
"Flu shots, this season." Caption line 1 and the opening beat.

## Call to action
"Ask about availability when you call." then New patients call 941 417 7386. Facebook line 2 and the closing line carry `https://familypracticedirect.com/?utm_source=facebook&utm_medium=social&utm_campaign=2026-10-11`. Instagram says link in bio; hashtags under `## First comment`. The disclaimer line sits before the close in both captions.

## The cut
Five text beats rendered from the brand templates (Lora and DM Sans, the site palette), each a 1080x1920 PNG with the logo top center and familypracticedirect.com at the foot. Each beat holds 4 seconds (the last 4.5) with a slow 3% zoom; 0.5 second crossfades. Logo, words and URL sit inside the Reels safe area (top 15% and bottom 20% clear).
1. 0.0 to 3.5 s, deep moss: "Flu season" / "Flu shots, this season" / "Three things the CDC says."
2. 3.5 to 7.0 s, shell: "Who" / "Everyone 6 months and older" / "With rare exceptions, a flu vaccine every season." / "Source: CDC"
3. 7.0 to 10.5 s, sand: "When" / "September and October" / "Ideally, by the end of October." / "Source: CDC"
4. 10.5 to 14.0 s, shell: "How long" / "About two weeks" / "The time it takes after a flu shot to build protection." / "Source: CDC"
5. 14.0 to 18.5 s, sand (4 seconds alone at the end): "Ask about availability when you call." and the amber "Call 941 417 7386" button.
Thumbnail `media/reel-cover.jpg` is beat 1.

## Sources and truth
- CDC, "Key Facts About Seasonal Flu Vaccine", https://www.cdc.gov/flu/vaccines/keyfacts.html (last updated September 1, 2026; read 2026-10-02):
  - "Everyone 6 months and older in the United States, with rare exception, should get a flu vaccine every season." (beat 2 and caption)
  - "September and October are generally good times to be vaccinated against influenza. Ideally, everyone should be vaccinated by the end of October." (beat 3 and caption)
  - "It takes about two weeks after vaccination for antibodies to develop in the body and provide protection against influenza virus infection." (beat 4 and caption)
- "Preventive screenings and vaccinations" as a service: `D:\Ellenton Family Practice Rebuild\src\data\services.ts` and the live /family-medicine page.
- Phone, URL, insurance facts: the brief's allowed facts (`src/data/site.ts`).
- Never said: any vaccine brand or product, that the office has doses or a supply, a clinic date, a price, statistics of any kind, who should not get one, personal advice. The plan's question 2 (does the practice offer the flu vaccine this season) is open; built as written per the build brief, to be cut or swapped at release if the answer is no.

## AI
None. No AI visuals, no AI voice, no narration.

## Build
From `source/`: `beat-1.json` to `beat-5.json` rendered with `reel.html` (the card template's type scale, logo and foot on a 1080x1920 frame, safe-area positions) by `build-reel.mjs` (the shared `build.mjs` with the frame height set to 1920; every guard unchanged): `node build-reel.mjs beat-N.json --out png`. PNG masters in `source/png/`, contrast reports beside them (lowest 4.91:1). `sh make-reel.sh` builds `media/reel.mp4` and `media/reel-cover.jpg` with ffmpeg 8.1 (2x lanczos upscale into zoompan, xfade, libx264 CRF 18, no audio stream). Music: finisher applies `music-efp-1011-r`. Contact sheet `source/reel-beats-sheet.png`.

## Questions for Alex
- Does the practice offer the flu vaccine this season? If not, this reel is swapped for a preventive care reel before it goes out.
