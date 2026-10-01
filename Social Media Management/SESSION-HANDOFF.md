# Session handoff: social pipeline and the work around it, written 2026-10-01 (afternoon)

**Read these first, in order:**
1. This file.
2. `README.md`: the folder contract, commands, rules, the Metricool API section and the YouTube section.
3. For the workstream you are picking up, its own document (section 2 names each one).
4. For client work: `clients/README.md`, then the client's own `README.md` and `NOTES.md`.
5. For business context: `SOCIAL_HANDOFF.md`.

**Branches:** social work is committed on `codex/training-premium-rfi` in the main repo
(`D:\K & A Performance Site`, not pushed; 14 commits on 9/30 and 10/1). Admin work is on
`admin/post-desk` in `D:\ka-site-admin` (matches its remote). Site work goes in
`D:\ka-site-color` on a branch off `origin/main`, never in the main checkout.

## 1. Where things stand

**Everything through Fri Oct 23 is built, approved on the Post Desk and scheduled live in
Metricool.** The Post Desk is empty. `validate` passes on all 71 folders. 283 tool tests pass.

| Dates | Facebook, Instagram, LinkedIn | YouTube |
|---|---|---|
| to Wed 9/30 | Published and reconciled into `Already Released/` (except the 9/30 4 PM carousel, `2026-09-30-2`) | S1 to S3 published |
| Thu 10/1 | Publishing today, including the **"2 of 3 spots left"** pilot post (`2026-10-01-4`) | S4 at noon |
| Fri 10/2 | **Thrillers launch** | **L1 "Test Your Website With One Key"** at 11:00; S5 at noon |
| Oct 3 to 9 | Live (plan `plans/2026-10-05.md`) | S6 to S10; **L2** Wed 10/7 at 11:00 |
| Oct 10 to 16 | Live (plan `plans/2026-10-12.md`) | A Short each weekday; **L3 "8 Google Business Profile checks worth doing today"** Wed 10/14 at 11:00 (Astra built it; Alex approved it on the desk 9/30; scheduled 9/30) |
| Oct 17 to 23 | Live (plan `plans/2026-10-19.md`, brief `plans/2026-10-19-build-brief.md`, 17 folders, 34 posts) | A Short each weekday. **L4 (Wed 10/21) is ON HOLD** by Alex's call; `2026-10-21-4` stays reserved and empty |
| **Sat 10/24 onward** | **Nothing planned** | Nothing planned |

The weekday shape: LinkedIn document 8:00, reel 10:30, YouTube Short 12:00, carousel 16:00
(Thursday 18:00). Weekends: one carousel a day. Long YouTube video Wednesdays at 11:00.

## 2. Open workstreams, and what each needs next

### 2a. Weekly social (the standing job)

1. **Reconcile.** Last run 9/30 morning. Due now for `2026-09-30-2` and everything from Thu 10/1.
   `reconcile --window`, pull `getScheduledPosts` one day at a time through the Metricool
   connector, save the JSON, `reconcile --from <file>`. Only days whose post time has passed
   need pulling. Keep `uuid`, `draft` and `providers` on every item.
2. **Studio steps after each long video publishes** (Alex does these; Metricool can't): add to
   the playlist, upload `media/video.srt` as English captions, add the end screen, then
   `node tools/social.mjs release --studio-done <folder>`. L1 is Fri 10/2. **The two playlists
   did not exist in Studio as of 9/28:** "Quick fixes for your website" and "Practical AI for
   small business". The three published Shorts also show an open Studio checklist; ask Alex
   whether Shorts need anything, then mark them done.
3. **Plan Sat Oct 24 to Fri Oct 30.** Write `plans/2026-10-26.md` in the shape of
   `plans/2026-10-19.md`. Pencilled in: L5 on Wed 10/28, "Make your website load fast on a
   phone"; a holiday-hours reminder around Tue 10/27. It needs Alex's approval, then a build
   brief, then one builder per day.
4. **Fri 10/23 is the fallback** (pre-launch checklist on Thrillers). Alex said a client launch
   by then is possible but not sure. If it lands, rebuild `2026-10-23`, `-2`, `-3` in the
   Thrillers launch format, re-approve, and update the scheduled posts.
5. **L4** stays on hold. When released: brief at
   `plans/youtube-2026-09-28/video-4-reviews-to-faq.md`, then the L1 build pattern.
6. **Builder questions on scheduled posts, still unanswered by Alex.** Any change now means an
   `updateScheduledPost` on the recorded ids after a fresh desk approval.
   - Tue 10/20 carousel says "We're fixing this too" about /contact/ having no map link and no
     hours. Add them to the site first (which hours?), or change the wording.
   - Mon 10/19 reel is a labeled redraw of our real reviews (Google blocked the capture). Our
     newest review had no owner reply as of 9/30, and the reel says a reply shows someone reads
     them.
   - Fri 10/23 check 5 says "We send one test send before launch." Did one go through the
     Thrillers form?
   - Sat 10/17: /training/team/ profile portraits use "Portrait of ..." alt text. Trim on the
     site? Not shown in the post.
   - Wed 10/21: the finance sample's desk check, calculation 1, lost its division and
     multiplication signs in the capture browser.

### 2b. Fore Motion Golf, the second social client (new 10/1)

- **Read:** `clients/foremotion-golf/README.md` and `NOTES.md`, then
  `D:\Foremotion Golf\Social Media Management\README.md` and `Branding\Brand Guide.md`.
- **State:** Metricool brand `7185142` exists with **no networks connected**. Facebook and
  Instagram only. Client folder set up with `publish: "metricool"`, which is an assumption.
  Nothing is planned or built.
- **Alex met Hannah** (she manages their social) on 10/1. **The outcome is not recorded. Ask
  him first:** who posts, who approves and where, cadence, when the game ships, whether social
  shows prices, whether she has editable source files, and whether she connected the accounts.
- **Found in her work** (20 graphics, 2 videos): polished, and blocked on four things. The
  graphics use the old concept logo, not the artist's Aug 2 logo. They point to pages that do
  not exist (the site is a coming-soon page; `/play/` says the game is being rebuilt; no
  membership or Official Rules page). The contest has no dates on any graphic and its rules
  ask for an attorney review. The videos use unlabeled concept images showing Nike and PING.
- **Owner:** Justin Myrick. His Sept 28 brief has the prices (Practice $899, Club $1,499, Tour
  $1,999, Corporate Partner $6,999) and the rule "Tour replaces Elite". One line says 65
  individual memberships; its table adds up to 60. Confirm before quoting a total.
- `D:\Foremotion Golf\Social Media Management` is now the brand library: `Branding\` (logos
  sorted by background), `Client Documents\`, `Content\`, `Photos and Video\`, `Meetings\`.
- With Metricool Advanced, Hannah can connect accounts through a 71-hour connection link
  (brand's Connections panel, Share, Create link).

### 2c. Attribution and pixel tracking (new 9/30, awaiting Alex)

- **Read:** `plans/attribution/2026-09-30-stage0-inspection-and-plan.md` (Astra's guidance is
  beside it).
- **State:** Stage 0 done: inspection, architecture, staged sequence, approval list. `Approved:
  no`. **Nothing is built.** Do not start Stage 1 until Alex answers the ten decisions in
  section 11 of that plan (pilot site, consent bar or not, free course storage, lifecycle
  definitions, revenue source, historical invoices, phone numbers, sensitive sites, Meta
  server sends, the SmartLink re-tag).
- Key facts: six of seven lead forms post browser to Web3Forms with no server record; the site
  reads only `?src=`, never `utm_*`; the Meta pixel fires with no consent gate; no revenue
  source exists; the privacy page disagrees with the code on five points; the Instagram
  SmartLink has a button labeled "Free AI lessons", which breaks the paid-only rule.

### 2d. Metricool: Advanced plan and the API (new 10/1)

- Alex upgraded from Starter to **Advanced on 10/1**. That adds the REST API, client
  connection links, team members with roles, and an approval flow.
- **API token:** stored by Alex as the Windows user variable `METRICOOL_USER_TOKEN`. Never ask
  him to paste it in chat. `tools/lib/metricool.mjs` reads it like the Cloudflare token.
- `tools/config/metricool.json` maps site slugs to brands (`ka-performance` 7076479,
  `foremotion-golf` 7185142). `node tools/social.mjs metricool brands` is the read-only check.
- `release` now names each client's own brand and refuses a client with none.
- **Only the brand list is wired to the API.** Scheduling, promotion and `getScheduledPosts`
  still go through the MCP connector. Next useful step: move the reconcile pull to the API,
  after checking the endpoint against a live response.
- The MCP connector is a claude.ai connector Alex toggles per session. Check
  `session_connectors_status` first. Tools from a connector enabled mid-turn work on the next
  turn.

### 2e. HyperFrames, a second video tool (new 10/1)

- **Read:** `docs/hyperframes-plan.md` at the repo root (plan plus pilot results) and
  `D:\kap-hf\README.md`.
- **State:** installed in `D:\kap-hf` (hyperframes 0.8.105 pinned, five skills in that folder
  only, telemetry off). The pilot rendered: an animated version of the Tue 10/20 carousel at
  `D:\kap-hf\projects\carousel-2026-10-20-2\renders\animated.mp4`, with `side-by-side.mp4`.
  **It is not scheduled.** The Oct 20 post keeps its original slide video.
- **Alex's framing:** Remotion is the hammer and stays the default. HyperFrames is a screwdriver
  for when a job fits: animated carousels, data-filled client templates, captioned cuts of real
  footage. Never migrate existing work to it.
- **Not started, only on Alex's word:** the `hyperframes` media origin in `validate`, the
  shared brand base, the carousel-to-video template. `D:\kap-hf` is not a git repo.
- **Open with Alex:** whether the animated version replaces the slide video on Oct 20 (it would
  go back on the desk first), and whether to put `D:\kap-hf` under version control.

### 2f. Still untouched

- **`HANDOFF-metricool-audio-edits.md`** (untracked): trending audio on Instagram Reels and
  Instagram Edits intake. Nothing built. It asks for an audit and a confirmed plan first.
- **Pilot client onboarding.** One of three spots filled on 9/28, anonymous in posts. Ask Alex
  whether that is Fore Motion Golf or someone else.

## 3. How a week gets made

1. **Plan** `plans/<week>.md`, a slot per day. Alex marks each run, change or drop, then approves.
2. **Build brief** `plans/<week>-build-brief.md`, then **one builder agent per day in parallel**
   (Opus executors). Builders write the folders and set status `ready`. They make no commits,
   uploads, Metricool calls or desk push. Review every contact sheet yourself before the desk.
3. **Post Desk:** `node tools/review.mjs`, then `node tools/social.mjs desk push`. Alex approves at
   admin.ka-performancefl.com/sites/ka-performance/social. Then `desk pull`.
4. **Before scheduling, check that no folder already has `metricool` ids** (Astra may pull the
   same decisions). Then set each approved folder to `approved`, run `validate`, `upload`,
   `release <folder>`, send every printed packet with `createScheduledPost`, and run
   `release --record` with the id and the quoted uuid. Spot-check one day with
   `getScheduledPosts`.
5. Commit by name: `post.json`, `brief.md` and the caption files. Never `git add -A`; media and
   `source/` are gitignored.

**Changing a post Alex already approved:** rebuild it, push it back to the desk (its approval
resets), get a fresh approval, then update the scheduled post.

## 4. Standing rules (Alex's calls; also in memory)

**Approvals and authority**
- **Plan before you produce.** Nothing goes live without Alex's approval on the Post Desk.
- **Any live send is done by the main session** after Alex says so. Subagents get blocked.
- **Deploys:** Claude can't push. Give Alex the PowerShell line with Windows paths. After a push,
  poll the live site with a cache-busting query and tell him to hard-refresh.
- **Never delete permanently.** Send files to the Recycle Bin and say so.
- **Credentials never go in chat.** Alex stores tokens himself as user environment variables.

**Brand**
- On every frame and slide: the K&A logo and ka-performancefl.com (a client's posts carry the
  client's brand instead).
- Colors can be per video; the brand marks and type stay fixed. Never purple, never cobalt.
  Text must pass contrast, computed, not eyeballed.
- No pill shapes, no em dashes, US English.

**Sound**
- Social videos use no narration: on-screen text plus a music bed, at -14 LUFS.
- Long YouTube videos are narrated by ElevenLabs **Amy** (commercial use confirmed).
- **No music track repeats within 30 days,** tracked per brand in `music-history.json`.

**Truth**
- Real sites and real numbers only, saved in `source/`. Drawn or mocked screens are labeled.
- Every AI output shown on screen is a real run, saved verbatim in `source/`.
- Never bypass a CAPTCHA. If Google blocks a capture, redraw it from live data and label it.
- A graphic never says something is live until the page it points to is live.

**Naming**
- Social posts name no AI vendors. YouTube narration may name a tool when needed, never
  titles, tags or thumbnails.
- /ai-launch/ is the paid 90-Day AI Launch, never "free lessons".

**Links**
- Facebook: the UTM-tagged link on line 2. Instagram: "Link in bio", hashtags in the first
  comment. LinkedIn: the link in the first comment. YouTube: line 2 of `youtube.md`.
- Captions may point to our YouTube channel where a post is the short version of a long video.
- No caption mentions L4 or a coming reviews video.

**Other**
- Stories are paused (`stories/PAUSED.md`).

## 5. Accounts and services

**Metricool** (Advanced plan since 10/1)
- K&A brand `7076479`: Facebook, Instagram, LinkedIn company page, YouTube channel
  `UCoZ_dAeTe5YO-JEDBdYSKsQ`. Fore Motion Golf brand `7185142`: nothing connected yet.
- Timezone America/New_York. Query `getScheduledPosts` one day at a time.
- Instagram SmartLink `kaperformancefl`, id `169122`: buttons carry
  `utm_source=instagram&utm_medium=smartlink` only; the YouTube button is a deleted placeholder.

**Social accounts**
- **YouTube:** @KAPerformancefl, phone-verified; custom thumbnails work through Metricool.
- **Facebook Page:** https://www.facebook.com/profile.php?id=61592711216301
- **Instagram:** @kaperformancefl. Bio link: https://t.mtrbio.com/kaperformancefl
- **LinkedIn company page:** `urn:li:organization:129934379`,
  https://www.linkedin.com/company/129934379/ (may bounce logged-out visitors to a login page).

**Hosting and site**
- Media: R2 bucket `ka-social` at https://media.ka-performancefl.com. The Post Desk has its own
  private bucket, `ka-social-desk`.
- Marketing site: Cloudflare Pages project `kandadesigners`, deploys on push to `main`.
- Admin: Worker `ka-admin` at admin.ka-performancefl.com, D1 `ka-sites`. The old `ka-admin` D1
  is a frozen archive that the public site still writes course leads into.

## 6. Website changes made 9/28 to 9/29 (all live, pushed by Alex)

- US spelling across visible copy; footer social links in full color.
- `site/privacy-and-targets`: removed `public/images/img_4294.jpeg` (it carried GPS
  coordinates; still in the public repo's history), 24px tap targets, 2x contact portraits.
- Worktree: `D:\ka-site-color` (`node_modules` is a junction to `D:\ka-site-seo`).

## 7. Tools and builds

- **Tools:** `node tools/social.mjs ...` from this folder. Never use npx here: the ampersand in
  the path breaks it. Tests: from `tools/`, `node node_modules/vitest/vitest.mjs run`.
- **This machine:** Node 24, FFmpeg 8.1, no Python. Shell heredocs with quotes fail often; write
  multi-line files with the Write tool and run them with node.
- **Social reels and slides:** built in `D:\kap-reel` (a junction), one entry per post under
  `src/social/<folder>/`. Carousels are an HTML page per carousel, rendered to JPG.
- **Long YouTube videos:** the reference build is L1, scripts in
  `D:\kap-reel\scripts\youtube\l1\` (voice, music, capture, stage, mix, deliver, srt), shared
  Remotion components in `src\youtube\`. Stop at style frames for Alex before the full render.
- **HyperFrames:** `D:\kap-hf`, see 2e.
- **Scheduled task:** `social-weekly-check`, Mondays at 8 AM, read-only, writes
  `reports/<date>-weekly.md`, runs only while the Claude app is open. Next: Mon 10/5.

## 8. Other people's work (leave alone unless Alex asks)

- **Astra**, a separate agent session: L2 and L3 (both done and scheduled). Status files in
  `plans/youtube-2026-09-28/` (`l2-status.md`, `l3-status.md`, `l3-planning-notes.md`,
  `shorts-s6-s10-status.md`). Astra also wrote the attribution guidance.
- **Hannah:** Fore Motion Golf's social media manager. Her originals are in
  `D:\Foremotion Golf\Social Media Management\Content\From Hannah (old logo, not posted)`.
- **`clients/davids-bbq/`**: another chat's client work. Its files are uncommitted on purpose.
  Open: whether the three reel videos landed in Drive and whether Chas has posted.
- Uncommitted on purpose: `clients/foremotion-golf/NOTES.md` and the meeting brief (client
  material; the repo's remote is public), `reports/`, Astra's status files.

## 9. Open questions for Alex

- The Hannah meeting outcome (2b), the attribution decisions (2c), the two HyperFrames
  choices (2e), and the builder questions (2a item 6).
- Is Bing Places really live? Mon 10/12's carousel says we imported ours on Sept 22.
- Scrub the GPS photo from the public repo's git history? That is a destructive rewrite.
- 3x contact portraits for sharper iPhones?
- A named LinkedIn company URL, if he has one.
- Figma and Stripe connectors need re-authorizing in claude.ai settings if wanted.
