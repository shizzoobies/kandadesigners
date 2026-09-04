# Licensing record: K&A Performance showcase reel

Every asset that appears in the reel is logged here. This exists because the
video is a commercial promotion for a business carrying E&O coverage.

## Summary

Closed at final delivery, 2026-09-03.

**Credits spent: 43,213 total.**

| Bucket | Credits | Source |
|---|---|---|
| Image generation (context plates, Phase 4) | 35,528 | ElevenLabs usage endpoint, 21 generations |
| Music (Phase 5) | 7,660 | ElevenLabs usage endpoint, 8 generations |
| Sound effects (Phase 5) | 25 | ElevenLabs usage endpoint, 4 generations |
| **Total** | **43,213** | |

Two figures worth reconciling. `config/plates.json` logs 20 image generations
totalling 35,322 credits; the usage endpoint reads 35,528 across 21, and the
206 credit difference is the one `gemini-3.1-flash-lite-image` smoke test run
before the real set. The endpoint figure is the one billed and the one used
above. `config/audio.json` logs 7,685 credits of measured audio spend, which is
the 7,660 of music plus the 25 of sound effects.

**Model per plate.** Every plate that ships was produced by
`gemini-3-pro-image` through the ElevenLabs Image & Video API, at 9:16, 2K, base
seed 41127. The per-plate spend below counts every candidate generated for that
plate, accepted and rejected.

| Plate | Model | Credits | Where it appears |
|---|---|---|---|
| `plate-laptop-shoulder` | gemini-3-pro-image | 2,436 | Fore Motion Golf plate, both cuts |
| `plate-phone-hands` | gemini-3-pro-image | 7,308 | Project Makeover plate, both cuts; Synovial tour cut, 45s only |
| `plate-ipad-lap` | gemini-3-pro-image | 3,654 | Southern Legacy Contractors plate, 45s cut only |
| `plate-desktop-wide` | gemini-3-pro-image | 3,654 | MBS Medicine: "Booking" tour cut in the 15s cut, project plate in the 45s |
| `plate-handoff` | gemini-3-pro-image | 5,481 | Only Nails Beauty dashboard, "Yours to edit" tour cut, both cuts |
| `plate-tablet-b` | gemini-3-pro-image | 7,308 | "No page builder" tour cut in the 15s cut, "Booking a call" in the 45s |
| `plate-phone-hands-b` | gemini-3-pro-image | 5,481 | Ellenton Family Practice, "Memberships" tour cut, 45s cut only |

`gemini-3.1-flash-lite-image` produced the smoke test only. Nothing it generated
appears in either cut.

**Music variant chosen: A**, the warm analog synth pulse at about 118 bpm.
`assets/audio/raw/music-a-20s.mp3` is the bed for the 15 second cut and
`music-a-50s.mp3` for the 45 second cut. Variants B and C were generated,
logged, and not used.

**Sound effects: generated, not used in the final mixes, owner decision
2026-09-03.** All three takes are logged below and remain on disk. See the
"Sound effects" section.

## Summary: training content reel

Closed at final delivery, 2026-09-04. The second reel is a second content
configuration of the same scene tree, so it shares this file, the same
ElevenLabs account and the same Pro plan, and every rights statement below
applies to it unchanged. What it does not share is a single generated asset:
the plates were shot fresh and the music was written fresh, on the owner's
2026-09-04 decision to spend new credits rather than reuse reel one's.

**Credits spent on this reel: 38,331 total.**

| Bucket | Credits | Source |
|---|---|---|
| Image generation, training context plates | 35,322 | `config/plates.json`, 20 generations tagged `"set": "training"` |
| Music, three 20 second candidates | 1,641 | `config/audio.json`, 3 generations at 547 each |
| Music, the chosen 50 second bed | 1,368 | `config/audio.json`, `music-t-a-50s` |
| **Total** | **38,331** | |

Both reels together come to 81,544 credits.

**Model per plate.** Every training plate that ships was produced by
`gemini-3-pro-image` through the ElevenLabs Image & Video API, at 9:16, 2K. The
per-plate spend counts every candidate generated for that plate, accepted and
rejected.

| Plate | Model | Credits | Candidates | Where it appears |
|---|---|---|---|---|
| `t-laptop-shoulder` | gemini-3-pro-image | 2,436 | 2 | Safety walk-through plate, both cuts |
| `t-phone-hands` | gemini-3-pro-image | 3,654 | 2 | Hazard recognition plate, both cuts |
| `t-tablet-desk` | gemini-3-pro-image | 3,654 | 2 | "Finance" tour cut in the 15s cut, P&L plate in the 45s |
| `t-desktop-wide` | gemini-3-pro-image | 9,135 | 5 | "Microlearning" tour cut in the 15s cut, RFI plate and "Your LMS, not ours" in the 45s |
| `t-laptop-cafe-free` | gemini-3-pro-image | 3,654 | 2 | "Finance" tour cut, 45s cut only |
| `t-phone-hands-b` | gemini-3-pro-image | 3,654 | 2 | "Microlearning" tour cut, 45s cut only |
| `t-laptop-two` | gemini-3-pro-image | 9,135 | 5 | "SCORM and xAPI" tour cut, both cuts |

`t-desktop-wide` and `t-laptop-two` each needed five candidates rather than two,
which is where the extra spend went. `t-tablet-desk` is the one plate in this
set whose screen quad had to be typed by hand, because it is also the only one
carrying a real window reflection and the detector could not separate the panel
from it; the quad in `config/plates.json` records that.

**Music variant chosen: t-a**, the acoustic-leaning felt keys over a light
electronic pulse at about 108 bpm. `assets/audio/raw/music-t-a-20s.mp3` is the
bed for the 15 second cut and `music-t-a-50s.mp3` for the 45 second cut.
Variants t-b and t-c were generated, logged, and not used.

**Sound effects: none, and none generated for this reel.** The owner's
2026-09-03 decision that both reel one mixes are the music bed alone was carried
into this reel on 2026-09-04, so no new sound effect credits were spent. The
three reel one takes remain on disk and unused.

**Original samples.** The three training modules shown are K&A originals built
to demonstrate the service line, not client or former employer material, so
there is no third party clearance to hold for any of them. That is recorded in
`config/projects.json` under `_decisions` for 2026-09-04, and the disclosure
that they are samples appears in the post copy at `out/post-copy-training.md`
rather than on screen, which is the owner's decision of the same date.

## ElevenLabs

- Plan tier: Pro (owner-confirmed 2026-09-03).
- API key: restricted key without the user_read scope, so plan and credit
  balance could not be read from the API. Recorded from the owner instead.
  Correction found in Phase 4: GET /v1/usage/character-stats does NOT require
  user_read and works on this key. Actual credit spend is therefore measurable,
  and every figure in the spend table below is measured rather than estimated.
- Commercial rights, Eleven Music: available on all paid plans per ElevenLabs
  published terms checked 2026-09-03. Film, TV, and large studio game rights
  require Enterprise. This reel is a social post for a business page, which
  sits inside the paid-plan grant.
- Commercial rights, Image & Video: API generation requires Pro or above.
  Each underlying image model carries its own terms. Recorded per asset below.
- Model access on this workspace: the ByteDance models
  (bytedance-seedream-5-pro and bytedance-seedream-5-lite) return 403
  model_access_denied, "ByteDance models are disabled by default and require
  explicit approval before use." No credits were charged for those attempts.
  Every plate below therefore comes from Google's Nano Banana Pro (model id
  gemini-3-pro-image), whose commercial terms are Google's, not ElevenLabs'.
  If Seedream is wanted later, ElevenLabs support has to enable it first.
- Cost reporting: no endpoint in the flows image API reports a credit cost.
  Create, poll and list return only id, status and, when complete, content_url
  and content_mime_type; the docs say only that failed generations are not
  charged. Credits below are measured instead:
  GET /v1/usage/character-stats?breakdown_type=product_type buckets spend under
  "Image Generation", and scripts/plates.ts samples that total either side of
  every generation, so each figure is the exact delta for that one image.
- Credit spend log:

| Date | Product | Model | Prompt summary | Credits | Used where |
|---|---|---|---|---|---|
| 2026-09-03 | Image & Video | gemini-3.1-flash-lite-image | Smoke test. One 1K 9:16 frame, phone face up on a table, to learn the response shape before spending on the set | 206 | Nowhere. assets/plates/smoke/, not in the reel |
| 2026-09-03 | Image & Video | gemini-3-pro-image | plate-laptop-shoulder, 2 candidates at 2K 9:16, no reference image | 2,436 | 1 accepted, project 1 beat |
| 2026-09-03 | Image & Video | gemini-3-pro-image | plate-phone-hands, 4 candidates at 2K 9:16 with style reference. First two rejected for a thumb across the screen face | 7,308 | 1 accepted, project 2 beat |
| 2026-09-03 | Image & Video | gemini-3-pro-image | plate-ipad-lap, 2 candidates at 2K 9:16 with style reference | 3,654 | 1 accepted, project 3 beat |
| 2026-09-03 | Image & Video | gemini-3-pro-image | plate-desktop-wide, 2 candidates at 2K 9:16 with style reference | 3,654 | 1 accepted, tour cut 1 |
| 2026-09-03 | Image & Video | gemini-3-pro-image | plate-handoff, 3 candidates at 2K 9:16 with style reference | 5,481 | 1 accepted, tour cut 2 |
| 2026-09-03 | Image & Video | gemini-3-pro-image | plate-phone-hands-b, 3 candidates at 2K 9:16 with style reference | 5,481 | 1 accepted, tour cut 3 |
| 2026-09-03 | Image & Video | gemini-3-pro-image | plate-tablet-b, 4 candidates at 2K 9:16 with style reference | 7,308 | 1 accepted, tour cut 4 |
| 2026-09-03 | Image & Video | Phase 4 total, 21 generations | | 35,528 | 7 plates accepted, 14 candidates discarded |
| 2026-09-03 | Music | music_v2 | music-a-20s, warm analog synth pulse about 118 bpm, 20s instrumental | 547 | Accepted, bed for preview-a |
| 2026-09-03 | Music | music_v2 | music-b-20s, crisp percussive minimal about 124 bpm, 20s instrumental | 547 | Accepted, bed for preview-b |
| 2026-09-03 | Music | music_v2 | music-c-20s, cinematic pad driven about 110 bpm, 20s instrumental | 547 | Rejected, first second 12.5 dB under the track mean |
| 2026-09-03 | Music | music_v2 | music-c-20s-take2, same prompt, regenerated once | 547 | Accepted, bed for preview-c |
| 2026-09-03 | Sound Effects | eleven_text_to_sound_v2 | whoosh-transition, 0.6s | 6 | Accepted, usable alternate |
| 2026-09-03 | Sound Effects | eleven_text_to_sound_v2 | whoosh-transition take2, 0.6s, generated because a faulty clipping check rejected the first take | 6 | Accepted, in all three mixes |
| 2026-09-03 | Sound Effects | eleven_text_to_sound_v2 | impact-low, 0.8s | 8 | Accepted, in all three mixes |
| 2026-09-03 | Sound Effects | eleven_text_to_sound_v2 | ui-click, 0.5s | 5 | Accepted, in all three mixes |
| 2026-09-03 | Music | music_v2 | music-a-50s, 50s instrumental for the LinkedIn cut | 1,368 | Accepted |
| 2026-09-03 | Music | music_v2 | music-b-50s, 50s instrumental for the LinkedIn cut | 1,368 | Rejected, first second 16 dB under the track mean |
| 2026-09-03 | Music | music_v2 | music-b-50s-take2, same prompt, regenerated once | 1,368 | Accepted |
| 2026-09-03 | Music | music_v2 | music-c-50s, 50s instrumental for the LinkedIn cut | 1,368 | Rejected as generated, two second fade in. Usable if trimmed from 2.0s |
| 2026-09-03 | Music | Phase 5 music total, 8 generations | | 7,660 | 5 accepted, 2 rejected, 1 rejected but salvageable by trimming |
| 2026-09-03 | Sound Effects | Phase 5 SFX total, 4 generations | | 25 | 4 accepted |
| 2026-09-03 | Phase 5 total, 12 generations | | | 7,685 | |
| 2026-09-03 | Running total, phases 4 and 5, 33 generations | | | 43,213 | Cross-checked against the usage endpoint on 2026-09-03: Image Generation 35,528, Music 7,660, Sound Effects 25 |
| 2026-09-04 | Music | music_v2 | music-t-a-20s, second showcase reel (training content), acoustic-leaning felt keys over a light electronic pulse about 108 bpm, 20s instrumental | 547 | Accepted, candidate bed for out/gate-t5/preview-t-a.mp3 |
| 2026-09-04 | Music | music_v2 | music-t-b-20s, second showcase reel (training content), warm analog synth chords with a gentle four-on-the-floor about 116 bpm and a plucked motif, 20s instrumental | 547 | Accepted, candidate bed for out/gate-t5/preview-t-b.mp3 |
| 2026-09-04 | Music | music_v2 | music-t-c-20s, second showcase reel (training content), organic marimba/mallets over a soft bass about 112 bpm, 20s instrumental | 547 | Accepted, candidate bed for out/gate-t5/preview-t-c.mp3. Credit figure corrected from a contaminated live measurement, see the Music section below |
| 2026-09-04 | Music | Second reel, training-set total, 3 generations | | 1,641 | 3 accepted, 0 rejected, all pass the first-second energy test on the first take |
| 2026-09-04 | Running total, phases 4 and 5 plus the second reel's training set, 36 generations | | | 44,854 | Cross-checked against the usage endpoint on 2026-09-04: Image Generation 37,964, Music 9,301, Sound Effects 25. The Image Generation bucket moved from 35,528 to 37,964 since 2026-09-03 from a concurrent agent's plate work on the second reel, which is outside this log's scope and is not this row's total; Music moved by exactly 1,641, matching the three rows above |
| 2026-09-04 | Image & Video | gemini-3-pro-image | t-laptop-shoulder, 2 candidates at 2K 9:16, no reference image. The accepted one is the style reference for the other six training plates | 2,436 | 1 accepted, safety beat 1 |
| 2026-09-04 | Image & Video | gemini-3-pro-image | t-phone-hands, 2 candidates at 2K 9:16 with style reference | 3,654 | 1 accepted, safety beat 2 |
| 2026-09-04 | Image & Video | gemini-3-pro-image | t-tablet-desk, 2 candidates at 2K 9:16 with style reference. The second was generated by an interrupted run, recovered from the API listing and logged after the fact | 3,654 | 1 accepted, tour finance |
| 2026-09-04 | Image & Video | gemini-3-pro-image | t-desktop-wide, 5 candidates at 2K 9:16 with style reference. First two rejected, one for a thumb on the panel face and one for a lit profile in the corner, then the framing was rewritten and three more generated | 9,135 | 1 accepted, tour rfi |
| 2026-09-04 | Image & Video | gemini-3-pro-image | t-laptop-two, 5 candidates at 2K 9:16 with style reference. First two rejected for a raised hand crossing the screen and, on one, a face; framing rewritten and three more generated | 9,135 | 1 accepted, tour safety card |
| 2026-09-04 | Image & Video | gemini-3-pro-image | t-laptop-cafe-free, 2 candidates at 2K 9:16 with style reference | 3,654 | 1 accepted, 45s spare |
| 2026-09-04 | Image & Video | gemini-3-pro-image | t-phone-hands-b, 2 candidates at 2K 9:16 with style reference | 3,654 | 1 accepted, 45s spare |
| 2026-09-04 | Image & Video | Second reel, training plate total, 20 generations | | 35,322 | 7 plates accepted, 13 candidates discarded |
| 2026-09-04 | Running total, all image and audio generation to date, 56 generations | | | 80,176 | Cross-checked against the usage endpoint on 2026-09-04 over a 96 hour window, which buckets by UTC day: Image Generation 35,528 on 09-03 and 35,322 on 09-04 for 70,850, Music 7,660 and 1,641 for 9,301, Sound Effects 25. Every one of those three figures is matched exactly by the per generation rows above, including the 09-04 image bucket. This supersedes the note on the 44,854 row: the plate work it called out of scope is the training set logged here |

Unit costs measured on this workspace: gemini-3-pro-image at 2K 9:16 costs
1,218 credits with no reference image and 1,827 with one, so attaching a style
reference adds 609 credits per generation. gemini-3.1-flash-lite-image at
1K 9:16 costs 206. No video generations were made in this phase and none are
planned, per Section 9b.

Unit costs measured for Phase 5: Eleven Music at music_v2 costs 27.35 credits
per second of generated audio, flat, measured at both lengths (20s costs 547,
50s costs 1,368). Sound effects cost roughly 10 credits per second (0.5s cost
5, 0.6s cost 6, 0.8s cost 8), so the entire sound effect set cost 25 credits
and is not worth optimising. Neither the music endpoint nor the sound effects
endpoint reports a cost anywhere in its response, so every figure above is a
before and after delta on
GET /v1/usage/character-stats?breakdown_type=product_type, which buckets the
spend under "Music" and "Sound Effects". scripts/audio.ts samples that total
either side of every call, so each figure is the exact delta for that one
generation. The per generation deltas sum to the bucket totals exactly.

## Generated visuals (Image & Video)

Every plate below was generated with ElevenLabs Image & Video using model
gemini-3-pro-image (Google Nano Banana Pro), 9:16, 2K resolution, output
1536x2752 PNG, on 2026-09-03. The model exposes no seed through this API, so
seed is null on every record and the set is not bit-reproducible; consistency
across the shoot comes from a style reference image instead. The full prompt
for each plate is stored verbatim in config/plates.json, both on the plate
record and on every generation record including the rejected ones. The complete
accept and reject reasoning for all 20 candidates is in the same file, under
`generations`.

Every plate is a generated room and a generated device with the screen off. No
website, interface, screen content, logo, brand mark or face is generated
anywhere in this reel. The content inside every screen is a real capture of a
real cleared site from assets/captures, warped into the screen quad with full
coverage per Section 4b.

| File | Plate id | Capture composited into the screen | Timeline position |
|---|---|---|---|
| assets/plates/plate-laptop-shoulder-c01.png | plate-laptop-shoulder | fore-motion-golf-home-desktop | Project 1 beat |
| assets/plates/plate-phone-hands-c03.png | plate-phone-hands | project-makeover-home-mobile | Project 2 beat |
| assets/plates/plate-ipad-lap-c01.png | plate-ipad-lap | southern-legacy-contractors-home-desktop | Project 3 beat |
| assets/plates/plate-desktop-wide-c01.png | plate-desktop-wide | mbs-medicine-home-desktop | Tour cut 1 |
| assets/plates/plate-handoff-c03.png | plate-handoff | onlynails-dashboard-sitephotos-clean | Tour cut 2 |
| assets/plates/plate-phone-hands-b-c03.png | plate-phone-hands-b | ellenton-family-practice-home-mobile | Tour cut 3 |
| assets/plates/plate-tablet-b-c03.png | plate-tablet-b | pbj-strategic-accounting-home-desktop | Tour cut 4 |

The 13 rejected candidates stay in assets/plates as studio assets. They are not
in the reel and are marked accepted false in config/plates.json.

### Second reel: training context plates (2026-09-04)

A second set of seven, for the training content reel, generated the same way
with the same model, aspect and resolution, and under the same rules. It is
deliberately a different shoot: flat cool overcast light through a window on
the right instead of warm sun from the left, pale grey and light oak instead of
cream and rust, one green plant for the only colour, and a cast with different
sleeves and different hair. Set beside the first seven it has to read as a
different day, not a different angle on the same afternoon. The style is held
across the set by one reference image, the accepted t-laptop-shoulder, attached
to the other six generations; the model exposes no seed, so the reference is
the only consistency mechanism, exactly as in the first set.

The training prompts carry one extra rule the showcase prompts do not: no hard
hat, no high visibility clothing, no tools, no machinery and no construction or
industrial props. The reel sells course content for construction teams, and a
generated job site would be a generated claim about a real place, which
Section 9b prohibits. The room in every one of these plates is an ordinary
quiet office.

| File | Plate id | Capture composited into the screen | Timeline position |
|---|---|---|---|
| assets/plates/t-laptop-shoulder-c01.png | t-laptop-shoulder | training-safety-hero-to-zones-desktop | Safety beat 1 |
| assets/plates/t-phone-hands-c01.png | t-phone-hands | training-safety-hierarchy-sorter-mobile | Safety beat 2 |
| assets/plates/t-tablet-desk-c01.png | t-tablet-desk | training-finance-pnl-simulator-desktop | Tour, finance |
| assets/plates/t-desktop-wide-c05.png | t-desktop-wide | training-rfi-scenario-branch-desktop | Tour, rfi |
| assets/plates/t-laptop-two-c05.png | t-laptop-two | training-safety-walkthrough-card-desktop | Tour, safety card |
| assets/plates/t-laptop-cafe-free-c01.png | t-laptop-cafe-free | training-finance-waterfall-desktop | 45s spare |
| assets/plates/t-phone-hands-b-c01.png | t-phone-hands-b | training-rfi-hero-mobile | 45s spare |

The 13 rejected candidates stay in assets/plates and are marked accepted false
in config/plates.json with the reason written out. Four things in that log are
worth stating here rather than leaving in the JSON:

- Two plates needed their framing rewritten and regenerating. t-desktop-wide
  and t-laptop-two each produced a candidate with a readable face, and each
  produced a candidate whose hand crossed the front of the screen. Both faults
  trace to the same wording: asking for a person "cropped above the shoulder
  line" reads to the model as permission to include the head, and asking for a
  hand raised "just above the table" puts it in front of the panel from this
  camera position. The rewritten framings describe what is in the frame instead
  of where the cut falls, and put the hand flat on the table. Three fresh
  candidates each cleared it. The rewrites are in scripts/plates.ts with the
  reason in a comment; the original prompts survive verbatim on the generation
  records that used them.
- One generation was recovered rather than repeated. An earlier run was
  interrupted after the API had already produced and charged for a second
  t-tablet-desk candidate but before the record was written, so the image was
  never downloaded and never logged. It was found by listing
  GET /v1/flows/image, matched as the only completed generation newer than
  t-tablet-desk c01, and pulled from its still valid signed URL. It is logged,
  graded and rejected. Its 1,827 credits are what closes the gap between the
  first day's per generation figures and the usage endpoint.
- One quad was typed by hand. scripts/find-quad.ts finds the powered off panel
  by masking a narrow neutral luma band, and t-tablet-desk's panel carries a
  real window reflection that lifts its left third out of that band. The
  detector returned a quad whose left edge was about three times too steep, and
  the first composite left a visible wedge of generated grey screen between the
  tablet edge and the site. The corners in config/plates.json for that plate
  were read off the plate against that failed composite and pushed 4px outward.
  Section 4b anticipates exactly this and the record says so.
- Layer 5 glare is live on one plate. Twelve of the fourteen plates across both
  sets measured a panel luma spread under 3.5 of 255 and carry glareOpacity 0.
  t-tablet-desk measures 56, because that panel genuinely reflects the window,
  so it carries 0.25 and the composite blends that reflection back over the
  site as glass sheen.

Every one of the seven ships with the real capture of the real training sample
page in its screen, at full quad coverage, verified on a 1080x1920 still per
plate in out/gate-t4. No stand-in capture survives in any of them.

### Provenance metadata on the generated plates

Checked 2026-09-03 by reading the PNG chunk table directly. exiftool is not
installed on this machine and ffprobe does not surface these chunks, so the
check was done on the raw bytes.

Every downloaded plate carries all three of:

- **C2PA**: a `caBX` chunk holding a JUMBF box tree with a `c2pa` manifest, a
  `c2ma` claim carrying a `urn:c2pa:` identifier unique per image, and a
  `c2pa.signature` box. Present and intact.
- **IPTC**: a `zTXt` chunk labelled "Raw profile type iptc".
- **XMP**: an `iTXt` chunk labelled "XML:com.adobe.xmp".

Nothing was stripped, and nothing will be. Two consequences worth recording:

1. The composited MP4s will not carry C2PA. The plate is decoded into a browser
   and re-encoded by Remotion and FFmpeg, which is the incidental loss
   Section 13 anticipates, not a deliberate removal. The source PNGs in
   assets/plates keep their credentials permanently.
2. Meta may still apply an AI info label from its own detection. Per Section 4b
   that is expected and is not a failure.

Rechecked 2026-09-04 the same way across all 20 training plates, the recovered
one included. All 20 carry the `caBX` C2PA chunk, the IPTC `zTXt` and the XMP
`iTXt`, and all 20 `urn:c2pa:` claim identifiers are distinct, so no plate is a
duplicate of another and nothing has been stripped or rewritten in transit.

## Music

Every music bed in this reel was generated with ElevenLabs Eleven Music on
2026-09-03 through POST /v1/music, model `music_v2`, prompt mode,
`force_instrumental: true`. No third party music, no sample libraries, no
Envato track. Section 9 called for an Envato fallback if the rights were
unclear; the rights are clear on the Media Rights question, so no fallback was
needed. The eligibility question raised below was resolved by the owner on
2026-09-04: commercial use on the Pro plan is confirmed for both reels.

### Commercial rights: the exact wording

Source: **Eleven Music Model-Specific Terms**,
https://elevenlabs.io/eleven-music-model-specific-terms, page states
"Last Updated: 26 May 2026", read 2026-09-03. These terms state that they apply
"to the following Music Models and all related Versions: v1, v2", which covers
the `music_v2` model used here.

Section 1(a), verbatim:

> Information about commercial rights and limitations associated with each
> Music plan can be found on the Music Commercial Rights table set out below.
> Certain terms in the Music Commercial Rights table are defined in Section 5.

Section 1(b), verbatim:

> The terms and limitations set forth in the Music Commercial Rights table are
> incorporated into these Model-Specific Terms and form an integral part of
> these Model-Specific Terms. Material failure to adhere to the terms and
> limitations as specified in the Music Commercial Rights table for your
> particular plan will be deemed a breach of your agreement with ElevenLabs.

The Pro row of that table, transcribed cell by cell:

| Category | Value on the Pro plan |
|---|---|
| Plan | Self-Serve, Pro |
| Eligibility Restrictions | For Individual Use Only |
| Monthly Generation Limit | 304 minutes |
| Monthly Download Limit | 500 minutes |
| Streaming Rights | Yes |
| Media Rights | All online and offline commercial use permitted, except film, TV, radio, & Studio Games |
| Reseller Rights | Prohibited |
| Music Libraries & Repositories | Prohibited |
| Attribution | No Attribution Required |
| High Quality Downloads | Yes |
| API Access (Stems, Streaming, Word Timestamps) | Yes |
| Inpainting API Access | Yes |

Definitions that matter here, from Section 5, verbatim:

> (g) Studio Games means video games which are commercialised (either by sale,
> advertising or any other forms of monetisation) and made available for
> download or use through more than one platform.

> (h) Streaming means making Output(s) available on third party music streaming
> platforms.

The general ElevenLabs Terms of Use, https://elevenlabs.io/terms-of-use, add
the paid tier distinction at Section 1(c), verbatim:

> if you access or use our Services through a paid subscription plan (such a
> user, a "Paid User"), you may use the Services for commercial purposes

and confirm output ownership at Section 4(c)(ii), verbatim:

> as between you and ElevenLabs, you retain all rights in and to your Output.

### What that means for this reel

A social post promoting K&A Performance on Facebook, Instagram and LinkedIn is
online commercial use. It is not film, it is not TV, it is not radio, and it is
not a Studio Game, so it falls inside the Media Rights grant on Pro. Attribution
is not required on Pro, so no ElevenLabs credit needs to appear in the video or
the post copy. Nothing here is a music library, a repository, or a resale, and
the audio is not being put on a music streaming platform.

Two limits worth tracking rather than assuming: the Pro plan allows 304 minutes
of generation and 500 minutes of download per month. Phase 5 generated 190
seconds of music in total, so both are comfortably clear.

### Open question the owner must close before publishing

**The Eligibility Restrictions cell on the Pro row reads "For Individual Use
Only".** That phrase is not defined anywhere in the Music terms or in Section 5.
The first row in the table that explicitly names business entities is Scale
("Individuals, or entities or organizations with fewer than 10 employees"), and
Business names "fewer than 50 employees". The reel is a commercial promotion
published under a business name.

The two cells pull in different directions: Media Rights on Pro plainly permits
"All online and offline commercial use" other than the four named carve outs,
which is what this reel is, while Eligibility Restrictions on the same row says
individual use only. Section 3 of the Model-Specific Terms warns that
"Enrollment in a plan for which you are not eligible may result in suspension or
termination of your account and/or loss or forfeiture of Outputs, fees, and/or
credits."

Generation proceeded on the strength of the Media Rights cell, which is the
cell that governs how Output may be used, and because the account is a single
operator.

Resolved 2026-09-04. Alex Anderson confirmed that the account's Pro plan
permits commercial use of the generated music, and that confirmation applies to
every bed in both the web reel and the training reel. No move to the Scale plan
is required. There are no unresolved licensing questions in either build.

### Generations

Full prompts for every generation, accepted and rejected, are stored verbatim
in `config/audio.json` under `generations`. The prompt shared by all three
variants asks for an instrumental that starts at full energy with no intro
build and no fade in, which is Section 9's hard requirement for the 15 second
cut, and forbids vocals, drops, risers and sub bass wobble.

Prompt mode on this endpoint takes no seed. The docs state that `seed` "cannot
be used with `prompt`", so the set is not bit reproducible, the same way the
Phase 4 plates were not. Regenerating from the same prompt gives a different
take.

| File | Variant | Length | Model | First second test | In the reel |
|---|---|---|---|---|---|
| assets/audio/raw/music-a-20s.mp3 | A, warm analog synth pulse about 118 bpm | 20s | music_v2 | Pass, first second 0.4 dB above the track mean | Bed for preview-a |
| assets/audio/raw/music-b-20s.mp3 | B, crisp percussive minimal about 124 bpm | 20s | music_v2 | Pass, 1.1 dB above | Bed for preview-b |
| assets/audio/raw/music-c-20s.mp3 | C, cinematic pad driven about 110 bpm | 20s | music_v2 | Reject, 12.5 dB below | Not used |
| assets/audio/raw/music-c-20s-take2.mp3 | C, same prompt | 20s | music_v2 | Pass, 0.5 dB above | Bed for preview-c |
| assets/audio/raw/music-a-50s.mp3 | A | 50s | music_v2 | Pass, 0.2 dB above | LinkedIn cut, variant A |
| assets/audio/raw/music-b-50s.mp3 | B | 50s | music_v2 | Reject, 16 dB below | Not used |
| assets/audio/raw/music-b-50s-take2.mp3 | B, same prompt | 50s | music_v2 | Pass, 2.1 dB above | LinkedIn cut, variant B |
| assets/audio/raw/music-c-50s.mp3 | C | 50s | music_v2 | Reject as generated, 30.1 dB below | Usable from 2.0s, see below |

The first second test is Section 9 in measurable form: mean volume over the
first 1000 ms compared with the mean volume of the whole track, rejecting
anything more than 6 dB down. It is measured with ffmpeg volumedetect and the
numbers are recorded per generation in `config/audio.json`.

`music-c-50s` was rejected as generated and could not be regenerated because the
12 generation cap for this phase had been reached. It is salvageable without
spending anything: measured second by second it fades in over about two seconds
and is at full level by 2.0s. From 2.0s its first second sits 0.6 dB above the
track mean, a pass, and 48.04s remain, which covers the 45 second LinkedIn cut
with room at both ends. If variant C is the owner's pick, trim the head at 2.0s
rather than regenerating.

### Delivered format

`output_format: mp3_48000_320` was requested. The API delivered 48 kHz stereo
MP3 at 192 kbps on every music generation. The sample rate honoured the request
and the bitrate did not, which is recorded here rather than assumed away. This
is well above what survives the final AAC encode and nothing was regenerated
over it.

### Second reel: training content variants (2026-09-04)

A second showcase reel, about instructional design and training content, needs
its own music candidates: the first reel's brief (a product launch feel) does
not fit. Three new 20 second instrumentals were generated the same way as
Phase 5's, through POST /v1/music, model `music_v2`, prompt mode,
`force_instrumental: true`, `output_format: mp3_48000_320` requested. The API
again delivered 48 kHz stereo MP3 at 192 kbps rather than 320, the same gap
Phase 5 recorded above. No third party music was used. The commercial rights
established earlier in this section apply unchanged: same account, same Pro
plan, same `music_v2` model, so the Media Rights grant and the open Eligibility
Restrictions question below it cover these three the same way. Nothing here
resolves that open question; it still needs the owner's answer before either
reel publishes.

The brief for this reel is warm, steady, confident and unhurried but still
moving: a bright morning workshop rather than a product launch. All three
share that character and the same hard requirement Section 9 set for reel one,
that the track start at full energy on the very first beat with no intro
build and no fade in, because the 15 second cut cuts in hard on frame 0. Each
prompt states that explicitly. Full prompts for every generation are stored
verbatim in `config/audio.json` under `generations`, filtered to
`"set": "training"`.

| File | Variant | Character | First second test | Candidate for |
|---|---|---|---|---|
| assets/audio/raw/music-t-a-20s.mp3 | t-a, acoustic-leaning felt keys over a light electronic pulse, about 108 bpm | Warm, steady, unhurried | Pass, first second 2.5 dB above the track mean | out/gate-t5/preview-t-a.mp3 |
| assets/audio/raw/music-t-b-20s.mp3 | t-b, warm analog synth chords, gentle four-on-the-floor, about 116 bpm, plucked motif | Warm, steady, confident | Pass, 1.9 dB below, inside the 6 dB tolerance | out/gate-t5/preview-t-b.mp3 |
| assets/audio/raw/music-t-c-20s.mp3 | t-c, organic marimba/mallets over a soft bass, about 112 bpm | Warm, unhurried, organic | Pass, 0.5 dB below, inside the 6 dB tolerance | out/gate-t5/preview-t-c.mp3 |

All three passed Section 9's first-second energy test on the first take, so no
retake was needed for any of them; the hard cap for this run was 6 generations
(2 attempts per variant) and only 3 were used.

**Credit measurement note on music-t-c-20s.** Two other agents were generating
images against the same ElevenLabs account at the same time (captures and
plates work for this same second reel). The live before/after usage snapshot
this script takes around every call assumes no concurrent spend, which did not
hold for this one call: it read a delta of 1,765 credits attributed to the
Image Generation bucket, not Music, because that concurrent image work moved
more in the polling window than this music call did. `config/audio.json` and
the credit spend table above record the corrected figure instead: reading the
Music bucket total directly before this run (8,754, from Phase 5's 7,660 plus
547 each for music-t-a-20s and music-t-b-20s) against the Music bucket total
after (9,301, GET /v1/usage/character-stats, checked 2026-09-04) gives a clean
delta of exactly 547, matching every other 20 second `music_v2` generation
measured on this project. music-t-a-20s and music-t-b-20s were each measured
cleanly at 547 credits under the Music bucket with no such collision.

### Second reel: the chosen 50 second bed (2026-09-04)

The owner picked variant t-a from the three previews, so the 45 second cut
needed a 50 second take of the same track: the 20 second candidate cannot be
looped to cover 45 seconds without the seam being audible, and Section 9 asks
for trim room at both ends.

| Field | Value |
|---|---|
| File | `assets/audio/raw/music-t-a-50s.mp3` |
| Endpoint | POST /v1/music, prompt mode |
| Model | `music_v2` |
| Length requested | 50,000 ms |
| Measured duration | 50.04 s |
| Output format | `mp3_48000_320` requested, 48 kHz stereo delivered |
| `force_instrumental` | true |
| Credits | 1,368, measured as a usage endpoint delta on the Music bucket |
| First second test | Pass. First second at -13.6 dB against a whole track mean of -14.2 dB, so 0.6 dB above the mean rather than below it |
| Generated | 2026-09-04 |

The prompt is byte for byte the one that produced `music-t-a-20s.mp3`, stored
verbatim in `config/audio.json`: same feel text, same instruction half, same
"starts immediately at full energy" requirement. Only `music_length_ms` differs.
Prompt mode takes no seed, so this is a different performance of the same brief
rather than an extension of the same take, which is why the first second test
was run again on it rather than inherited.

It passed on the first generation, so exactly one billable call was made. Four
of this set's six permitted generations are now used.

### Second reel: 15 second previews (2026-09-04)

Three audio-only preview mixes were built with ffmpeg for the owner to choose
from, no picture involved yet: `out/gate-t5/preview-t-a.mp3`,
`preview-t-b.mp3` and `preview-t-c.mp3`, each the 20 second take trimmed to
15.000s with a 400 ms fade at the tail. The same bare mix is also written to
`assets/audio/mix-t-a-15s.wav`, `mix-t-b-15s.wav` and `mix-t-c-15s.wav`, 48 kHz
stereo PCM, music only (no sound effects, per the same owner decision recorded
for reel one on 2026-09-03), ready to drop into the reel once a variant is
picked. Levels use the same limiter-then-two-pass-loudnorm chain reel one's
mixes use: -14 LUFS integrated target, -1.5 dBTP ceiling (the same -1 dBTP
delivered ceiling minus the 0.5 dB AAC encode headroom Section 11 established),
measured off the delivered file rather than read from loudnorm's own
prediction.

| Variant | Integrated | True peak | LRA |
|---|---|---|---|
| t-a | -13.99 LUFS | -2.13 dBTP | 2.9 |
| t-b | -14.09 LUFS | -2.31 dBTP | 0.8 |
| t-c | -14.00 LUFS | -2.23 dBTP | 0.6 |

All three land within 0.1 LU of the -14 LUFS target and well clear of the
-1.5 dBTP ceiling.

t-a took a third pass to get there, and it is worth recording why. Its two pass
loudnorm predicted -13.98 LUFS and the finished file measured -13.71, a 0.27 dB
prediction error on the one bed of the six with real dynamic range in it, LRA
2.9 against 0.6 to 0.8 for the rest. This project already treats loudnorm's pass
2 output as a prediction and measures the file instead, so the answer is the
obvious one: measure, then shift the whole file by the difference.
`correctLoudness` in `scripts/audio.ts` does that, with a 0.15 dB deadband so a
file already on target is never re-encoded, and it refuses the correction rather
than breach the true peak ceiling. Applied here at -0.29 dB, which moved the
true peak from -1.84 to -2.13 dBTP, further inside the ceiling rather than
nearer it. Reel one's mixes all sit inside the deadband and are untouched.

## Sound effects

Generated with ElevenLabs Text to Sound Effects on 2026-09-03 through
POST /v1/sound-generation, model `eleven_text_to_sound_v2`, output format
`mp3_44100_192`. No Envato SFX were needed. These sit under the same paid plan
commercial grant quoted in the Music section above, under the general Terms of
Use rather than the Music Model-Specific Terms, since sound effects are not
Eleven Music output.

**Status: generated, not used in the final mixes, owner decision 2026-09-03.**
The owner listened to a mix carrying all three and did not want any of them, so
both delivered mixes are the music bed alone. The takes are logged here in full
because the credits were spent, the files are still on disk, and the cue sheets
that would place them are still in the comments in `scripts/audio.ts` and
`scripts/deliver.ts`. Nothing in this section reaches a delivered file.

| File | Prompt | Duration | Status |
|---|---|---|---|
| assets/audio/raw/sfx-impact-low.mp3 | low soft cinematic thump impact, short, muted, no reverb tail | 0.8s | Generated, not used in the final mixes, owner decision 2026-09-03 |
| assets/audio/raw/sfx-whoosh-transition-take2.mp3 | fast clean air whoosh, short, no tail, for a video cut | 0.6s | Generated, not used in the final mixes, owner decision 2026-09-03 |
| assets/audio/raw/sfx-ui-click.mp3 | soft UI tap click, subtle, clean, no tail | 0.5s | Generated, not used in the final mixes, owner decision 2026-09-03 |
| assets/audio/raw/sfx-whoosh-transition.mp3 | fast clean air whoosh, short, no tail, for a video cut | 0.6s | Generated, superseded by take2 before the owner's decision, not used |

Section 9 asks for the music to resolve alone over the CTA. With no effects
anywhere it now resolves alone over the whole cut.

Two notes on what happened during generation, both recorded because the record
is meant to be true rather than tidy:

1. The brief asked for a 0.3s ui-click. The API floor for `duration_seconds` is
   0.5 and a 0.3s request is refused with `invalid_generation_settings` before
   anything is generated, so that call cost 0 credits and is not logged as a
   generation. The click was made at 0.5s instead. Its tail is near silent and
   the cue lands on a single frame, so nothing about the edit changes.
2. The first whoosh take was wrongly rejected by a clipping check that failed
   anything reporting max_volume 0.0 dB, which caused a second whoosh to be
   generated for 6 credits that was not needed. The sound effects endpoint
   delivers every effect peak normalised to exactly 0 dBFS, which is the normal
   shape of a delivered one shot and is not clipping. Re-measured with ffmpeg
   astats, both takes report a flat factor of 0.000000, meaning no run of
   samples is pinned at full scale and neither is distorted. Both are good. The
   second take is the one in the mixes because its mean sits 1.3 dB higher. The
   check now measures flat factor instead of peak.

## Mixes

Three preview mixes were built with ffmpeg only, no Remotion, against the
Phase 4 picture at `out/phase4-vertical.mp4`. Each is 15.000s, 1080x1920 at
30 fps, video copied without re-encode, audio AAC 48 kHz stereo. The bare
mixed audio is written alongside as
`assets/audio/mix-{a,b,c}-15s.wav`, 48 kHz stereo PCM, ready to drop into
Remotion.

Sound effects sit 15 dB under the music bed, peak to peak, against Section 9's
floor of 12 dB. Peak to peak rather than mean to mean because the ui-click is
half a second of which most is silence, so its mean is meaningless as a level.

Loudness, measured off the delivered wav rather than read from loudnorm's own
prediction, which was checked and does drift by up to 0.06 dB:

| Variant | Integrated | True peak | LRA | Peak limiting applied before loudnorm |
|---|---|---|---|---|
| A | -14.04 LUFS | -1.06 dBTP | 0.6 | 7.3 dB |
| B | -14.14 LUFS | -0.99 dBTP | 0.7 | 14.0 dB |
| C | -14.06 LUFS | -1.46 dBTP | 0.9 | 5.0 dB |

Target was -14 LUFS integrated with true peak at -1 dBFS. All three land within
0.15 LU of target and none breaches the peak ceiling.

Variant B is flagged: it needs 14 dB of peak limiting to reach -14 LUFS,
against 7.3 for A and 5.0 for C, because the generated bed is sparse and
transient heavy, roughly 19 dB of crest factor. The target is met but B's
transients are noticeably tamed getting there. If the owner picks B, it is worth
regenerating the bed asking for a denser arrangement rather than accepting that
much limiting.

## Fonts

| Font | Source | License | Video embedding |
|---|---|---|---|
| Schibsted Grotesk | Google Fonts, self-hosted on ka-performancefl.com | SIL OFL 1.1 | Permitted |
| Atkinson Hyperlegible Next | Braille Institute, self-hosted on ka-performancefl.com | SIL OFL 1.1 | Permitted |
| Fraunces | Google Fonts, self-hosted on ka-performancefl.com | SIL OFL 1.1 | Permitted |
| Lenia Mono | Not established. Not sourced for this deliverable. | Not established. Not exercised here, no glyph is rendered into any frame. | Not applicable, see below |

Checked at Phase 6 delivery: `src/lib/fonts.ts` registers exactly two families,
Schibsted Grotesk and Atkinson Hyperlegible Next, both OFL and both cleared for
embedding. Nothing in `src/scenes` or `src/components` asks for any other
family, so Fraunces and Lenia Mono sit in `config/brand.json` as a record of
the site's type system and neither one ships inside the video.

That closes the Lenia Mono question for this deliverable: an unknown license
cannot reach the reel, because no glyph of it is rendered into a frame. It is
still an open question for the live site, where the font is used and its source
was never recorded, and the owner still has to answer it there. It is recorded
as "not established" above rather than left as a placeholder, because for this
video the honest answer is that the question does not arise.

## Envato Elements

No Envato Elements assets were used in this deliverable, so there is no item,
URL, license ID or download date to record.

Section 2 lists Envato as the fallback for two things and neither fallback was
needed. Music: the ElevenLabs paid plan commercial grant covers this use, as
established in the ElevenLabs section above, so no Envato track was licensed.
Context plates: the generated set came out clean and seven plates were accepted,
so no Envato device frame or stock plate was licensed either. Fonts came from
Google Fonts and the Braille Institute under OFL, not from Envato.

| Item | URL | License ID | Date |
|---|---|---|---|
| None | | | |

## Client assets

Site captures are recorded from live public sites listed in
`config/projects.json` with `cleared_for_public_showcase: true`. The owner of
K&A Performance is the grantor for every one of them: K&A built each site, and
Alex Anderson confirmed each entry in that file on 2026-09-03. The `_decisions`
block in `config/projects.json` carries the confirmations in his own words.

| Asset | Site | Permission | Grantor and date |
|---|---|---|---|
| Home page capture, mobile and desktop | Fore Motion Golf, foremotiongolf.com | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Home page capture, mobile and desktop | MBS Medicine, mbsdoc.com | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Home page capture, mobile and desktop | PB&J Strategic Accounting, pbjsa.com | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Home page capture, mobile and desktop | Project Makeover, projectmakeover.org | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Home page capture, mobile and desktop | Ellenton Family Practice Direct, familypracticedirect.com | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Home page capture, mobile and desktop | Southern Legacy Contractors, southernlegacycontractors.com | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Home page capture, mobile and desktop | Synovial Marketing, www.synovialmarketing.com | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Home page capture, mobile and desktop | Only Nails Beauty, onlynailsfl.com | cleared_for_public_showcase, credit_allowed | Alex Anderson, 2026-09-03 |
| Owner dashboard screen recording | Only Nails Beauty | Screen recording made by Alex Anderson (K&A) and shared via Jam. K&A built the dashboard. Only the Gallery and Site photos segment is used. All account, staff and client data covered or excluded. | Alex Anderson, 2026-09-03 |
| `logo-lockup.webp` brand mark | K&A Performance | Owner's own mark, used on the CTA card and composited into both thumbnails | Alex Anderson, 2026-09-03 |

## Provenance

Generated assets are never stripped of C2PA or IPTC metadata on purpose.
FFmpeg transcodes may drop it as a side effect; noted per asset above.

Confirmed on a delivered file at Phase 6. `out/kap-reel-vertical-15s.mp4` was
scanned byte for byte for a `c2pa`, `caBX` or `jumb` marker and carries none,
which is the incidental loss the plate section predicted: the plate PNG is
decoded into a browser by Remotion, re-encoded to H.264, then re-encoded again
by `scripts/encode.sh` for delivery, and nothing in that chain carries a JUMBF
box across. The container tags that do survive are the encoder string and
Remotion's own comment. No step in `scripts/encode.sh` removes metadata: there
is no `-map_metadata -1` anywhere in it, and the source PNGs in `assets/plates`
keep their credentials permanently.
