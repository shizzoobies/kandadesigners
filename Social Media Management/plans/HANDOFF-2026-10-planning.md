# Handoff: plan and build K&A's content from Oct 3 to Oct 18

Written 2026-09-28, 2 PM, by the pipeline chat for a separate agent (Astra) working with Alex.
It is self-contained: read it top to bottom before touching anything.

## 1. Where things stand (as of Mon 9/28, 2 PM)

| Week | Facebook, Instagram, LinkedIn | YouTube Shorts (noon, weekdays) | YouTube long-form (11 AM) |
|---|---|---|---|
| Sep 28 to Oct 2 | Built and scheduled live. Fri 10/2 Thrillers posts are Metricool **drafts** waiting on Alex's go | S1 to S4 scheduled live. S5 (Thrillers) only on Alex's go | **L1 "Test your website with one key"**, Fri 10/2: being rendered **by the pipeline chat. Not yours** |
| Oct 3 to Oct 9 | **Built and scheduled live** (29 posts, plan `plans/2026-10-05.md`) | **Not built:** S6 to S10 | **L2 "Answer customer emails faster with AI"**, Wed 10/7: outline only, **no brief yet** |
| Oct 10 to Oct 18 | **Nothing planned.** The calendar shows gaps from Mon 10/12, and the weekend of 10/10 and 10/11 is empty | S11 to S15: not planned | **L3 "Fix your Google Business Profile in 15 minutes"**, Wed 10/14: outline only, 6 open questions |

So the social feed is solid through Fri 10/9. YouTube is short on next week (the Shorts and L2), and
nothing exists yet for the week of Oct 12.

## 2. Your job, in order

1. **S6 to S10** (Shorts for Oct 5 to 9). Mechanical; can start now. Section 5.
2. **The L2 brief**, to Alex **as soon as possible**. The approved timeline said Fri 10/2, but the
   build needs a real AI run, captures, voice and a full edit before Wed 10/7 at 11 AM. Aim for
   the brief on Tue 9/29 or Wed 9/30, and the build from the day it's approved. Section 6.
3. **The week plan for Oct 10 to Oct 16** (`plans/2026-10-12.md`): weekend carousels, the weekday
   reels, carousels and LinkedIn posts, a Short in every reel folder, and L3. Plan first; nothing is
   made until Alex marks it approved. Section 7.
4. **L3**: ask the six open questions one at a time, then the brief, then the build (publishes Wed
   10/14). Section 8.
5. **Build the Oct 12 week** after the plan is approved, using the build-brief pattern. Section 7.

## 3. How Alex works (non-negotiable)

- **Plan before you produce.** A weekly plan he approves (`plans/<week>.md`, with a line
  `Approved: yes (...)`), then one brief per post (`brief.md` with `Approved: yes`), then the build.
  Nothing is generated, rendered or scheduled before its approval.
- **One question at a time**, with real options where you can show them.
- **Nothing goes live without his approval on the Post Desk.** Deploys, live-data changes and
  switching Metricool drafts to live need his explicit go-ahead in chat, naming the action.
- **Clean and purposeful design.** No piled-on effects. If a direction isn't landing, rebuild it
  fresh rather than patching it.
- **Be honest about quality**, and check platform facts in current docs before stating them.
- **You can't run `git push`.** Give Alex the exact command for his terminal. His terminal is
  **PowerShell**, so use Windows paths (`D:\...`), not Git Bash paths (`/d/...`).

## 4. The rules every piece follows

Source of truth: `README.md` in `Social Media Management/` (the folder contract), then
`plans/youtube-2026-09-28/SPEC.md` (the approved YouTube spec) and `SESSION-HANDOFF.md`.

**Brand**
- On every frame and slide: the K&A logo lockup
  (`D:\kap-reel\assets\brand\logo\logo-lockup.webp`) and ka-performancefl.com. Never the retired
  gold crest (`approved-logo-transparent.png`). Don't touch `Logo Remake/`.
- **Type:**
  - display: Schibsted Grotesk 700
  - body: Atkinson Hyperlegible Next
  - small caps labels: Lenia Mono
  - fonts: `D:\kap-reel\assets\brand\fonts`
- **Color (Alex, 2026-09-28):** the brand marks stay fixed, but the brand palette does **not** have
  to set every color in a video. Each video may use its own palette through the theme object in
  `D:\kap-reel\src\youtube\theme.ts`. Never purple, never cobalt, and every text pair passes WCAG
  contrast (4.5:1 body, 3:1 large). Social posts may still use rust #9A3412, ink #221C15,
  cream #F8F5F2, teal #0B302D, and amber #D97706 for highlights only.
- **No pill or chip shapes.** Use small-caps interpunct lines ("CHECK 3 · TAB ORDER").
- **No em dashes anywhere.** US English: color, center, gray, neighbor, organization.

**Truth**
- Real sites and real numbers only, each saved in the post's `source/`.
- Client sites only when the plan says so and the client is cleared.
- No promised results, ROI or time savings.
- A drawn or mocked-up screen is labeled as one (for example "Redrawn for clarity").
- An AI draft shown on screen comes from a real run, saved verbatim in `source/`.

**AI naming**
- On Facebook, Instagram and LinkedIn: no AI vendor, product or model names at all.
- On YouTube: tools may be named in narration and on-screen text when a tutorial needs it, but
  never in titles, thumbnails, tags or playlist names. No vendor logos.
- Never suggest K&A provides AI accounts or seats. In L2 the chat window is labeled
  "Assistant", never "Kai" (Kai is only K&A's own site assistant).

**Sound**
- Social videos are muted-first: no narration, on-screen text plus a music bed.
- YouTube long-form is narrated by ElevenLabs **Amy** (`OZxMHsGaBmV5pjMIDIn0`,
  eleven_multilingual_v2):
  - settings: stability 0.5, similarity 0.75, style 0, speaker boost on, speed 1,
    mp3_44100_192
  - one file per beat
  - the script spells "K and A" and "W-C-A-G"; on screen it stays K&A and WCAG
- Every video gets a **new** ElevenLabs music track, and a track never repeats within 30 days.
  `validate` checks this against `music-history.json`; a Short that reuses its own reel's video on
  the same day counts once.
- Alex said to use the best ElevenLabs quality and not economize on credits. Report the spend.
- **Open:** Amy is a Voice Library voice, so her commercial terms need confirming (Alex is
  checking). Don't publish L2 or L3 before that's settled.

**Links**
- Facebook: line 2 is a UTM-tagged link.
- Instagram: "Link in bio", with hashtags under `## First comment`.
- LinkedIn: the link goes in the first comment.
- YouTube: line 2 of `youtube.md` is a ka-performancefl.com link tagged
  `utm_source=youtube&utm_medium=social&utm_campaign=<folder>`.
- Where each topic links:
  - AI: https://ka-performancefl.com/ai-launch/ (the paid 90-Day AI Launch; never "free lessons")
  - Training: /training/
  - Web design or local search: the matching /services/... page
  - Check each link returns 200.

**Stories are paused** (`stories/PAUSED.md`). Don't plan them.

## 5. S6 to S10: the Shorts for Oct 5 to 9

- **Why companion folders.** The Oct 5 to 9 reels are already `scheduled`, and `release` only
  works on `approved` folders. So each Short gets a companion folder `<date>-5` with YouTube as its
  only network. Oct 7 is the exception: L2 takes `2026-10-07-4`, so check the suffix is free first.
- **Copy the working pattern exactly.** S1 to S4 were built from a script: see
  `To Be Released/2026-09-29-5/` (post.json, brief.md, youtube.md).
- **post.json:**
  - `platforms.youtube = {type: "SHORT", caption: "youtube.md", title, tags, category:
    "HOWTO_STYLE", time: "12:00"}`, plus `playlist` when one fits (playlists are in
    `tools/config/youtube.json`)
  - the reel's `music` and `ai`
  - `media/reel-vertical.mp4` and `.srt` copied from the reel
- **Titles:** 70 characters or fewer, the idea rather than a slogan.
- **Per-Short notes** (from `SPEC.md`):
  - S7, the drawn bakery showing "5-star Google reviews", is fictional; that's fine.
  - S10 ends on the pilot offer ("3 free months for 3 Gainesville businesses"). If a spot has
    filled by then, update the description or skip it; ask Alex.
- **Flow:**
  1. `node tools/review.mjs`
  2. `node tools/social.mjs desk push`
  3. Alex approves on the desk (admin.ka-performancefl.com, K&A's Post Desk).
  4. `desk pull`
  5. Set `"status": "approved"` **only for the items Alex approved**.
  6. `validate` and `upload`.
  7. `release <folder>`, which prints the Metricool packet (see section 9).

## 6. L2: "Answer customer emails faster with AI" (Wed 10/7, 11:00 AM)

**Material**
- Outline: `plans/youtube-2026-09-28/video-2-ai-email-replies.md`: titles, the beat outline (about
  7:28), the narration script, the on-screen prompt and voice notes, the capture list, the facts
  check, chapters and description, music and risks.
- Folder: `To Be Released/2026-10-07-4`.
- Link: /ai-launch/. Playlist: "Practical AI for small business". End screen: L1.

**Before the brief, confirm with Alex (one at a time)**
- The folder name (`2026-10-07-4`).
- The title (the working title or an alternate).
- Anything else the outline's section 8 lists as open.

**Hard points**
- The AI draft on screen must come from a real run, saved verbatim in `source/ai-run.md`, with
  no vendor named. Pick narration version A or B of step 3 to match what the run actually says.
- The chat window is labeled "Assistant".
- The bakery owner is "Rosa", not "Dana" (Dana is the Oct 8 reel's customer).

**Build**
- Copy L1's build exactly. It's the reference for every long video:
  - Voice: `D:\kap-reel\scripts\youtube\l1\voice.ts` (per beat, measured, credits logged).
  - Music: `scripts\youtube\l1\music.ts`.
  - Captures: `scripts\youtube\l1\capture.mjs`. Every frame is a DSF 2 screenshot piped to H.264;
    Playwright `recordVideo` was tested and rejected because it records at half resolution.
  - Staging and mix: `scripts\youtube\l1\stage.ts` and `mix.ts`.
  - Composition: the shared set in `D:\kap-reel\src\youtube\` and L1's wiring in
    `src\youtube\l1\`.
- Build L2 as `src/youtube/l2/` on the same shared set, with its own theme passed in.
- **Stop at style frames for Alex**, as L1 did: two theme options on contact sheets, then the full
  render after he picks.
- Encode:
  - 1920x1080 at 30 fps, H.264 CRF 20 capped at 3.5 Mbps, AAC 192 kbps
  - 280 MB or less
  - -14 LUFS integrated, -1 dBTP or lower
- Package:
  - `media/video.mp4` and `media/video.srt`
  - `media/thumbnail.jpg` at 1920x1080, under 2,000,000 bytes: the approved design is
    `thumb-b-topic2.jpg` in `Reels/youtube/channel-art/`
  - the 4K master in `source/`
  - `youtube.md` with chapters re-timed to the final cut
  - `post.json` with `ai.voice: true`
- Then the Post Desk, as in section 5.

## 7. The week of Oct 12 (and the weekend of Oct 10 and 11)

**Plan it first** in `plans/2026-10-12.md`, in the same shape as `plans/2026-10-05.md`: every
slot with a one-line idea, its pillar, what it needs and any question for Alex. Alex marks each slot
run, change or drop, then approves the whole plan.

**The shape of a day** (keep it unless Alex changes it)
- LinkedIn at 8:00 AM, company page. Alex reposts with the line in `repost.md`.
- Reel at 10:30 AM on Facebook and Instagram: text-led, no narration, its own track.
- **New from this week:** the reel folder also carries a `youtube` SHORT at 12:00 PM (a
  per-network `time`). Put the `youtube` block straight into the reel's `post.json`; no companion
  folder (README, "YouTube").
- Carousel in the afternoon (4 PM, or 6 PM when there's a reason): swipe slides on Instagram and
  a slide video on Facebook (`node tools/slideshow.mjs <folder> --music <mp3>`), and a DOCUMENT
  on LinkedIn.
- Weekends: one carousel a day.
- Pillar rhythm: Mon local search, Tue web design, Wed training, Thu AI, Fri a launch or behind
  the scenes. **Wed 10/14 is L3 (local search).** Keep the Wednesday training reel and carousel,
  and make sure Monday's local-search post doesn't repeat L3.

**Inputs for the plan**
- Early numbers (thin; accounts connected 9/24; `reports/2026-09-28-weekly.md`):
  - On LinkedIn, the "10-second phone test" document led on impressions.
  - Documents slightly beat video.
  - Friday evening and Saturday morning did best.
- Unused ideas from the backlog:
  - "Three fonts max"
  - "Site voice in ten minutes"
  - "Turn your Google reviews into FAQ answers" (a proposed 4th long video)
- Look distinct from recent carousels. Already used: index cards, exam paper, swatch cards,
  infographic, device mockups, checklist document, stopwatch, planner page, tickets.
- The pilot offer: post "spots left" only if a spot actually filled (ask Alex). Otherwise show
  the product, not a second ask.
- Launches with a real site to click, and save-worthy tips, have done best.

**Build after approval**
- Write `plans/2026-10-12-build-brief.md` in the shape of `plans/2026-10-05-build-brief.md`, which
  covers patterns to copy, music rules, verification and the report format.
- Build days in parallel. Each builder touches only its own folders and its own entry under
  `D:\kap-reel\src\social\<date>\`.
- Then review, desk push, Alex's approvals, then release.

## 8. L3: "Fix your Google Business Profile in 15 minutes" (Wed 10/14, 11:00 AM)

- Outline: `plans/youtube-2026-09-28/video-3-google-profile.md`.
- Folder: `2026-10-14-4`. Link: /services/seo-ai-search/. Playlist: "Quick fixes for your website".
- The thumbnail needs a new design in the same system: "Fix it in 15 minutes" on the rust Quick fix
  band over a sharp crop of the listing (`Reels/youtube/channel-art/src/thumb.html`,
  `render.cjs`). Show Alex options.
- **Ask these one at a time, before the brief** (from `SPEC.md`):
  1. Does our profile's website button carry UTM tags? It should, before 10/14, so we pass our
     own check.
  2. Add Veterans Day and Thanksgiving special hours to our profile (asked before; still open).
  3. Are our profile's services, description and booking link filled in?
  4. Can the video show our real "LGBTQ+ friendly" attribute, or should it be a mock-up?
  5. Q&A: say nothing, or add one neutral line saying Google is changing it?
  6. Should we teach `utm_source=google&utm_medium=organic&utm_campaign=business-profile` as the
     example?
- Only K&A's own profile is shown as a real profile. The edit panels are unbranded mock-ups,
  labeled as such, unless Alex records his own screen.
- Recapture our profile signed out around Oct 10 to 12 so the figures are current.
- The build is the same as L2's (section 6).

## 9. Scheduling and the tools

Run everything from `D:\K & A Performance Site\Social Media Management` (or the junction
`D:\ka-social`). Run tools with `node` directly and **never npx**: the ampersand in the path breaks
npm shims. Remotion and TypeScript run from `D:\kap-reel` (a junction), with
`node node_modules/@remotion/cli/remotion-cli.js ...` and `node node_modules/tsx/dist/cli.mjs ...`.

```
node tools/social.mjs validate [<folder>]
node tools/social.mjs calendar --days 21
node tools/review.mjs
node tools/social.mjs desk push | desk pull
node tools/social.mjs upload <folder>                  # status must be approved
node tools/social.mjs release <folder> [--draft]       # prints createScheduledPost packets
node tools/social.mjs release --record <folder> --network <n> --id <id> --uuid "<uuid>"
node tools/social.mjs release --promote <folder>       # draft to live packets
node tools/social.mjs release --promoted <folder> --network <n> --id <new id>
node tools/social.mjs release --studio-done <folder>   # after the YouTube Studio checklist
node tools/social.mjs reconcile --window | --from <file> [--dry-run]
```

- **Tests:** `node node_modules/vitest/vitest.mjs run` from `tools/` (274 pass today).
- **Metricool:** brand/blogId `7076479`, timezone America/New_York, through the Metricool MCP
  connector (`createScheduledPost` with `info` as a JSON string).
  - Query `getScheduledPosts` **one day at a time**; wide windows fail.
  - Ids change on every update; uuids don't. Uuids are often negative, so pass them as a separate
    quoted argument.
  - Published posts stay listed with `providers[].status: "PUBLISHED"`, and `reconcile` handles
    that. When you save a window for `reconcile --from`, keep `uuid`, `draft` and `providers`
    on every item.
  - **If you have no Metricool connector, stop at "approved and uploaded"** and hand the printed
    packets back to Alex (or to the pipeline chat) to send.
  - Live packets (not drafts) and draft-to-live switches must be sent from a main session after
    Alex says so. Subagents get blocked.
- **YouTube after publish:** `release` prints the Studio checklist (playlist, upload the SRT for
  long-form, end screen). Alex or you finish it in Studio, then run `--studio-done`. Neither
  playlist has been created in Studio yet, so create both before L1 publishes on Friday. The
  pipeline chat is flagging that to Alex.
- **Post Desk:** `desk push` and `desk pull` need `CLOUDFLARE_API_TOKEN`. On Windows, read it
  from the user-scope environment variable if the shell doesn't have it. Put anything Alex has to
  decide under `## Questions for Alex` in `brief.md`; the desk shows it with the post.

## 10. Git, files and other people's work

- The main checkout `D:\K & A Performance Site` sits on branch `codex/training-premium-rfi`,
  shared with a Codex stream and unpushed. Commit only your own files, **staged by name, never
  `git add -A`**, and end commit messages with the repo's Co-Authored-By line.
- Don't commit renders or media. They're gitignored; check first.
- **Not yours; leave them alone:**
  - `clients/davids-bbq/` (another chat)
  - L1 (`To Be Released/2026-10-02-4`, `src/youtube/l1/`) while the pipeline chat finishes it
  - the Fri 10/2 Thrillers drafts. thrillersvr.com is live, but promoting them is Alex's call,
    made with the pipeline chat.
- Site changes go in a worktree off `origin/main` (for example `git worktree add -b site/<name>
  D:\ka-site-<name> origin/main`). Build with `node node_modules/astro/astro.js build`, reusing
  `D:\ka-site-seo\node_modules` through a junction. Alex deploys by pushing the branch to `main`
  himself.
- The Monday 8 AM weekly check is scheduled (read-only). Its report lands in `reports/`.

## 11. Reporting back to Alex

After each step, a short plain-English update:
- what's ready for him (on the Post Desk, or a question)
- what you decided and why
- ElevenLabs credits spent
- anything you're unsure of

Use tables for schedules. Don't claim something published until Metricool or YouTube shows it.
