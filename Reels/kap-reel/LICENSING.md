# Licensing record: K&A Performance showcase reel

Every asset that appears in the reel is logged here. This exists because the
video is a commercial promotion for a business carrying E&O coverage.

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

Unit costs measured on this workspace: gemini-3-pro-image at 2K 9:16 costs
1,218 credits with no reference image and 1,827 with one, so attaching a style
reference adds 609 credits per generation. gemini-3.1-flash-lite-image at
1K 9:16 costs 206. No video generations were made in this phase and none are
planned, per Section 9b.

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

## Music

(none yet)

## Sound effects

(none yet)

## Fonts

| Font | Source | License | Video embedding |
|---|---|---|---|
| Schibsted Grotesk | Google Fonts, self-hosted on ka-performancefl.com | SIL OFL 1.1 | Permitted |
| Atkinson Hyperlegible Next | Braille Institute, self-hosted on ka-performancefl.com | SIL OFL 1.1 | Permitted |
| Fraunces | Google Fonts, self-hosted on ka-performancefl.com | SIL OFL 1.1 | Permitted |
| Lenia Mono | FILL_IN (source not recorded in site docs) | FILL_IN | FILL_IN |

## Envato Elements

| Item | URL | License ID | Date |
|---|---|---|---|

## Client assets

Site captures are recorded from live public sites listed in
config/projects.json with cleared_for_public_showcase true. Permission grantor
and date per project:

| Only Nails Beauty owner dashboard | Screen recording made by Alex Anderson (K&A) 2026-09-03, shared via Jam. K&A built the dashboard. Only the Gallery and Site photos segment is used. All account, staff, and client data covered or excluded. | Alex Anderson, 2026-09-03 |

## Provenance

Generated assets are never stripped of C2PA or IPTC metadata on purpose.
FFmpeg transcodes may drop it as a side effect; noted per asset above.
