# Session handoff: social pipeline, written 2026-09-29 (morning)

**Read these first, in order:**
1. This file.
2. `README.md`: the folder contract, commands, rules and the YouTube section.
3. `plans/youtube-2026-09-28/SPEC.md` and `HANDOFF.md`: the approved YouTube spec and channel facts.
4. For client work only: `clients/README.md`.
5. For business context: `SOCIAL_HANDOFF.md`.

**Branches:** social work is committed on branch `codex/training-premium-rfi` of the main repo
(`D:\K & A Performance Site`, not pushed). Admin work is on `admin/post-desk` in `D:\ka-site-admin`.

## 1. Where things stand

**Everything through Fri Oct 16 is built, approved on the Post Desk and scheduled live in
Metricool.** The Post Desk is empty. `validate` passes on all 64 folders, and 274 tool tests pass.

| Dates | Facebook, Instagram, LinkedIn | YouTube |
|---|---|---|
| to Thu 10/1 | Live | Shorts S1 to S4 at noon. S1 (Ellenton) published 9/28 at 6 PM |
| Thu 10/1 | Also **"2 of 3 spots left"** pilot post (LinkedIn 12:00, FB and IG 13:00, `2026-10-01-4`) | |
| Fri 10/2 | **Thrillers launch**, promoted from drafts 9/28 (thrillersvr.com is live) | **L1 "Test Your Website With One Key"** at 11:00; S5 Thrillers Short at 12:00 |
| Oct 3 to 9 | Live (plan `plans/2026-10-05.md`) | S6 to S10 at noon; **L2 "Let AI draft it. Make it sound like you."** Wed 10/7 at 11:00 (built and scheduled by Astra) |
| Oct 10 to 16 | Live (plan `plans/2026-10-12.md`, build brief `plans/2026-10-12-build-brief.md`), 34 posts | A Short in every weekday reel folder at noon. **L3 on Wed 10/14 is NOT done** (see section 2) |
| Oct 17 to 23 | **Live in Metricool** (approved on the desk and scheduled 9/30; plan `plans/2026-10-19.md`, brief `plans/2026-10-19-build-brief.md`, 17 folders, 34 posts) | A Short in every weekday reel folder at noon. **L3 (Wed 10/14) is also live**, scheduled 9/30 after Alex approved Astra's finished video on the desk. **L4 (Wed 10/21) is ON HOLD** by Alex's call 9/30; `2026-10-21-4` stays reserved and empty |
| **Sat 10/24 onward** | **Nothing planned** | Nothing planned |

The weekday shape:
- LinkedIn document at 8:00
- Reel at 10:30
- YouTube Short at 12:00
- Carousel at 16:00 (Thursday at 18:00)
- Weekends: one carousel a day
- Long YouTube video on Wednesdays at 11:00

## 2. What to do next

1. **L3, "8 Google Business Profile checks worth doing today", Wed 10/14 at 11:00.** Astra is on
   it. The draft brief is in `To Be Released/2026-10-14-4/brief.md` (`Approved: no`), with notes
   in `plans/youtube-2026-09-28/l3-planning-notes.md`.
   - Alex's decisions so far:
     - drop the attributes segment and Q&A
     - include the tracking-link demo
     - eight checks
   - Open items:
     - the booking link: verify before showing it as a real example
     - the end screen
     - brief approval
     - recapture the profile around Oct 10 to 12
   - Check with Alex whether Astra is still carrying it before you touch it.
2. **Oct 17 to 23: SCHEDULED LIVE 2026-09-30.** Alex approved the plan in chat ("hold on L4 for
   now and let's do everything else"), six Opus builders made 17 posts, every contact sheet was
   reviewed by the main session, Alex approved all 18 desk rows (including Astra's L3), and all
   35 packets went through `createScheduledPost` and were recorded. A one-day
   `getScheduledPosts` check of 10/23 matched (6 posts, draft false, autoPublish true). The Post
   Desk is empty again. Nothing is planned from Sat 10/24 on.
   - **Friday 10/23 is the fallback** (pre-launch checklist on Thrillers). Alex said a client
     launch by then is possible but not sure; if it lands, rebuild `2026-10-23`, `-2`, `-3` in
     the Thrillers launch format and re-approve.
   - **Builder questions still open for Alex** (also in each brief's `## Questions for Alex`):
     - Tue 10/20 carousel says "We're fixing this too" about /contact/ having no map link and
       no hours. Add them to the site before 10/20 (which hours?), or change the wording to
       "Not on our page yet".
     - Mon 10/19: Google's traffic check blocked the search capture; the reel is a labeled
       redraw of our real reviews (5.0, 8 reviews). Ship as is? Also, our newest review has no
       owner reply as of 9/30; the reel says a reply shows someone reads them.
     - Fri 10/23 check 5 says "We send one test send before launch." Did a test go through the
       Thrillers form before its launch?
     - Sat 10/17: the /training/team/ profile portraits use "Portrait of ..." alt text, close
       to the pattern the post warns against. Trim on the site? Not shown in the post.
     - Wed 10/21: in the finance sample's desk check, calculation 1's feedback rendered
       without its division and multiplication signs in the capture browser. Worth a look.
   - **L4** stays on hold. When Alex releases it: brief at
     `plans/youtube-2026-09-28/video-4-reviews-to-faq.md`, then the L1 build pattern.
   - Already pencilled in:
     - **L4, Wed 10/21: "Turn your Google reviews into FAQ answers for your website".**
       It needs a brief and the full long-video build. L1 is the reference.
     - L5 on Wed 10/28: "Make your website load fast on a phone".
     - A holiday-hours reminder around Oct 27.
   - Keep the weekday pillar rhythm: Mon local search, Tue web design, Wed training, Thu AI,
     Fri a launch or behind the scenes.
   - Each weekday reel folder carries its own `youtube` SHORT at 12:00.
3. **After each long video publishes, Alex does the Studio steps** (Metricool can't):
   - add it to the playlist
   - upload `media/video.srt` as English captions
   - add the end screen (subscribe plus the latest video)
   - then run `node tools/social.mjs release --studio-done <folder>`

   **The two playlists did not exist in Studio as of 9/28:** "Quick fixes for your website" and
   "Practical AI for small business". Remind Alex before L1 on Fri 10/2.
4. **Reconcile after posts go out** (not run since 9/28 as of 9/30; window 9/28 to 10/16. The
   Metricool connector is a claude.ai connector Alex toggles per session: check it is attached
   before starting), to move published folders to `Already Released/`:
   `reconcile --window`, fetch `getScheduledPosts` one day at a time, save the JSON, then
   `reconcile --from <file>`. Keep `uuid`, `draft` and `providers` on every item. Metricool keeps
   published posts listed with status PUBLISHED; reconcile handles that (fixed 9/28), and it
   saves each network's live link.
5. **Pilot client onboarding hasn't started.** One of the 3 spots filled on 9/28; the business is
   anonymous in posts. Ask Alex who it is and whether they post themselves. Then set up their own
   Metricool brand (Starter allows 5), their own Post Desk, and `--client <slug>` work, following
   the David's BBQ pattern in `clients/`.
6. **Optional ideas Alex hasn't asked for yet:**
   - Service descriptions for SEO and Instructional Design on the Google profile (he took the
     Social Media Management one on 9/29).
   - A Facebook Page category change so the new services show to logged-out visitors. The
     categories still read Web Designer, E-commerce website, Designer.

## 3. How a week gets made (the flow used 9/28 to 9/29)

1. **Plan** `plans/<week>.md`, a slot per day. Alex marks each run, change or drop, then approves.
2. **Build brief** `plans/<week>-build-brief.md`, then **one builder agent per day in parallel**
   (Opus executors).
   - Builders write the folders and set status `ready`.
   - They make no commits, uploads, Metricool calls or desk push.
   - Review each contact sheet yourself before the desk.
3. **Post Desk:** `node tools/review.mjs`, then `node tools/social.mjs desk push`. Alex approves at
   admin.ka-performancefl.com/sites/ka-performance/social. Then `desk pull`.
4. **Before scheduling, check that no folder already has `metricool` ids.** Another session
   (Astra) may pull the same decisions. Then:
   1. Set each approved folder to `approved`.
   2. Run `validate`, then `upload`, then `release <folder>`.
   3. Send every printed packet with the Metricool connector's `createScheduledPost`.
   4. Run `release --record ...` with the id and uuid; pass the uuid quoted.
5. Commit by name: `post.json`, `brief.md` and the caption files. Never `git add -A`; media and
   `source/` are gitignored.

**Changing a post Alex already approved** (a new slide, a new word): rebuild it, push it back to
the desk (its approval resets to waiting), get a fresh approval, then schedule.

## 4. Standing rules (Alex's calls; also in memory)

**Approvals and authority**
- **Plan before you produce.** Nothing goes live without Alex's approval on the Post Desk.
- **Switching drafts to live, and any live send, is done by the main session** after Alex says
  so. Subagents get blocked.
- **Deploys:** Claude can't push. Give Alex the PowerShell line, with Windows paths such as
  `git -C D:\ka-site-color push origin <branch>:main`, never `/d/...`. After a push, poll the
  live site with a cache-busting query (it takes about a minute) and tell him to hard-refresh
  (Ctrl+Shift+R).

**Brand**
- On every frame and slide: the K&A logo and ka-performancefl.com.
- **Colors can be per video** (9/28): the brand marks and type stay fixed, while working colors
  may suit the topic. Never purple for our own designs, never cobalt, and text must pass
  contrast.
- No pill shapes, no em dashes, US English.

**Sound**
- Social videos use no narration: on-screen text plus a music bed.
- Long YouTube videos are narrated by ElevenLabs **Amy**. Alex confirmed commercial use during L2.
- **No music track repeats within 30 days.** Every video gets a new ElevenLabs track, logged in
  `music-history.json`.

**Truth**
- Real sites and real numbers only, saved in `source/`.
- Drawn or mocked screens are labeled ("Drawn example", "Redrawn for clarity").
- Every AI output shown on screen is a real run, saved verbatim in `source/`.
- Never bypass a CAPTCHA. If Google blocks a capture, redraw it from live data and label it.

**Naming**
- Social posts name no AI vendors.
- YouTube narration may name a tool when needed, but never titles, tags or thumbnails.
- In L2 the chat window is labeled "Assistant". Kai is only the name of K&A's own site assistant.

**Links**
- Facebook: the UTM-tagged link on line 2.
- Instagram: "Link in bio", hashtags in the first comment.
- LinkedIn: the link in the first comment.
- YouTube: line 2 of `youtube.md`, with `utm_source=youtube`.
- **Captions may point to our YouTube** (9/28): "Full walkthrough on our YouTube channel:
  https://www.youtube.com/@KAPerformancefl" (Instagram: "@KAPerformancefl").
- AI posts link /ai-launch/ (the paid 90-Day AI Launch).

**Other**
- Stories are paused (`stories/PAUSED.md`).

## 5. Accounts and services

**Metricool**
- Brand / blogId `7076479`, timezone America/New_York, Starter plan, through the MCP connector.
- Networks: Facebook, Instagram, LinkedIn company page, YouTube channel `UCoZ_dAeTe5YO-JEDBdYSKsQ`.
- Query `getScheduledPosts` one day at a time.

**Social accounts**
- **YouTube:** @KAPerformancefl, a Brand Account, phone-verified. Custom thumbnails work through
  Metricool: L1's was accepted.
- **Facebook Page:** https://www.facebook.com/profile.php?id=61592711216301. Since 9/29 it shows
  "Gainesville, FL, Service area" and (904) 210-1071 to logged-out visitors.
- **Instagram:** @kaperformancefl. The bio link is the SmartLink https://t.mtrbio.com/kaperformancefl.
- **LinkedIn company page:** `urn:li:organization:129934379`.
  - Its public link is https://www.linkedin.com/company/129934379/.
  - This link may send logged-out visitors to a login page. Ask Alex for the named company
    address if he has one.

**Hosting and site**
- Media: R2 bucket `ka-social` at https://media.ka-performancefl.com. The Post Desk has its own
  private bucket, `ka-social-desk`.
- **Website:** a footer icon row links Facebook, Instagram, YouTube and LinkedIn in brand colors
  (live 9/28). One list in `src/data/social.js` also feeds the site's Organization `sameAs`.

## 6. Website changes made 9/28 to 9/29 (all live, pushed by Alex)

- **US spelling** across visible copy (branch `site/us-spelling`).
- **Footer social links**, then **full-color icons** (`site/social-links`, `site/social-colors`).
- **`site/privacy-and-targets`:**
  - Removed `public/images/img_4294.jpeg`, an unused photo that carried **GPS coordinates**.
    It is still in the public GitHub repo's history (`shizzoobies/kandadesigners`); scrubbing
    that is Alex's call.
  - Showcase dots and small links get 24px tap targets.
  - Contact portraits are served at 2x their displayed size (about 90% smaller).
- **Worktree:** `D:\ka-site-color` (`node_modules` is a junction to `D:\ka-site-seo`). For new site
  work, `git fetch` there and branch off `origin/main`.

## 7. Tools and builds

- **Tools:** `node tools/social.mjs ...` from this folder. Never use npx: the ampersand in the path
  breaks it. See `README.md` for the full command list.
- **Social reels and slides:** built in `D:\kap-reel` (a junction), one entry per post under
  `src/social/<folder>/`.
- **Long YouTube videos:** the reference build is L1.
  - Scripts, in run order: `D:\kap-reel\scripts\youtube\l1\`:
    - `voice.ts`: one ElevenLabs file per beat, checked against the script
    - `music.ts`
    - `capture.mjs`: Playwright DSF 2 screenshots piped to H.264
    - `stage.ts`
    - `mix.ts`
    - `deliver.ts`: render, encode to -14 LUFS, QA stills
    - `srt.ts`
  - Components: the shared Remotion set in `src\youtube\` (frame, lower thirds, cards, key
    overlay, end screen), with a per-video theme.
  - L2 lives in `src\youtube\l2\`; its evidence is in `To Be Released/2026-10-07-4/source/README.md`.
  - Stop at style frames (two themes on contact sheets) for Alex before the full render.
- **Scheduled task:** `social-weekly-check`, Mondays at 8 AM, read-only. It writes
  `reports/<date>-weekly.md` and runs only while the Claude app is open. The Thrillers domain
  check is retired, since the domain is live.

## 8. Other people's work (leave alone unless Alex asks)

- **Astra**, a separate agent session: L2 (done) and L3 (in progress). Its status files are
  `plans/youtube-2026-09-28/l2-status.md`, `l3-planning-notes.md`, `shorts-s6-s10-status.md` and
  `build-shorts-s6-s10.mjs`. Its handoff was `plans/HANDOFF-2026-10-planning.md`; this chat took
  back the Oct 12 week plan and build.
- **`HANDOFF-metricool-audio-edits.md`** (untracked, from another chat): trending audio on
  Instagram Reels through Metricool's `audioConfiguration`, plus Instagram Edits support. It says
  to audit the pipeline first and confirm the plan before coding. Status unknown; ask Alex.
- **`clients/davids-bbq/`**: another chat's client work. Its files are uncommitted on purpose.

## 9. Open questions for Alex

- Is Bing Places really live? Mon 10/12's carousel says "We imported ours from our Google profile
  on Sept 22". The site handoff lists Bing Places as done, but Alex wasn't sure. He approved the
  post as is.
- Does he want the GPS photo scrubbed from git history? That's a destructive history rewrite of a
  public repo.
- Should the contact portraits get 3x versions (about 41 and 68 KB) for sharper iPhones?
