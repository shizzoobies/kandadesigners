# Session handoff: social pipeline, written 2026-09-25 (evening)

Read this first in a new session, then `README.md` (folder contract, commands, rules).
Business context: `SOCIAL_HANDOFF.md`. Everything below is committed on branch
`codex/training-premium-rfi` of the main repo (not pushed; Alex decides that).

**Stories are PAUSED (Alex, 2026-09-26):** `stories/PAUSED.md` exists, so no Story is on the
schedule or the Post Desk. Nothing was in Metricool. To resume, follow `stories/PAUSED.md`.

## Post Desk = approvals + Stories checklist (done 2026-09-25, version 12)

One artifact, same URL: https://claude.ai/artifact/BwgxjJ7mbkuRGvxyHPMRd3 . From a new
conversation, `Artifact action:"read"` it first, then publish with `url` set to that link.
Source `review/index.html`; data `review/data.json` from `node tools/review.mjs`; media via
the `files` map in `review/files.json` plus `"data.json": "review/data.json"`.
Capabilities: `{db: {}, downloads: true}` (downloads = the Save image button).

- Two tabs: **Approvals** (posts, stories and asks waiting on Alex) and **Stories** (the
  checklist). The page opens on Stories when nothing waits for approval or the link ends
  in `#stories`.
- `review.mjs` writes `storyChecklist`: every row of `stories/SCHEDULE.md` dated today or
  later (New York date at build time), approved or not, with time and the "(only if ...)"
  note parsed from the When column. Rebuild and republish when a new week's Stories land.
- Each row: date, 10:35 AM, image (tap to enlarge), sticker text, URL, Copy URL, Save
  image, and a **Posted** checkbox. Today's row is outlined; past unticked rows say "Not
  ticked". Today/past follow the New York clock and refresh every minute.
- Phone copies: all ten Story PNGs (Sep 28 to Oct 9) are in Google Drive, K & A Social > Stories
  (folder id 1Q0Yz8xmjsLz80Mo6W-jjgkt-Zh78LHBH; parent K & A Social 1SpWSxYYm9bu-TlDQMlBRd8100phqY3TD),
  uploaded 2026-09-26 through Alex's Chrome. Add new weeks there too.
- Ticks: page db collection `storyChecks`, doc id `<date>-story`, `{posted: true|false, at}`.
  Read with ArtifactData `list` on `storyChecks` (was empty right after publishing).

## Where things stand (as of 2026-09-25 evening)

Everything from Sept 25 to Oct 9 is built, approved by Alex on the Post Desk, and
**scheduled LIVE in Metricool**, except Friday Oct 2.

| Dates | What | State |
|---|---|---|
| Fri 9/25 | 6 questions before you hire a web designer (IG/FB 6:30 PM, LinkedIn 7 PM) | live |
| Sat 9/26 | Phone test (LI 10 AM, IG/FB 4 PM); **free social pilot announcement** (IG/FB 12 PM) | live |
| Sun 9/27 | Plan your week with AI (LI 5 PM, IG/FB 6 PM) | live |
| Mon 9/28 to Thu 10/1 | Each day: LinkedIn 8 AM, reel 10:30, carousel 4 PM (Thu 6 PM); Mon also the pilot on LinkedIn 12 PM | live |
| **Fri 10/2** | Thrillers Mobile VR launch: reel, carousel, LinkedIn (`2026-10-02`, `-2`, `-3`) | **Metricool DRAFTS**, waiting on thrillersvr.com |
| Sat 10/3 to Fri 10/9 | Week of Oct 5 (plan `plans/2026-10-05.md`): 29 posts | live |

- Native Facebook posts (scheduled by Alex outside Metricool): 9/25 job aids video, 9/26 Bobbie Connor.
- **Friday Oct 2:** scheduled task `thrillers-domain-check` runs Thu Oct 1 at 7 PM. If
  thrillersvr.com is live and it's the K&A-built site, and Alex says go, promote the three
  drafts (`node tools/social.mjs release --promote <folder>` prints updateScheduledPost packets;
  send them; record with `release --promoted`). (Stories are paused, so no Story that day.) If not live,
  the fallback is to build a replacement (the hero tutorial idea is used; plan something new).
- Stories: PAUSED since 2026-09-26 (were hand-posted at 10:35 on weekdays; list in `stories/SCHEDULE.md`).

## Standing rules (Alex's calls; also in memory)

- **Every frame drives traffic:** K&A logo and ka-performancefl.com on every frame and
  slide; hook first; CTA; client footage always inside a K&A frame.
- **No narration.** Content works muted; on-screen text plus a music bed.
- **No music track repeats within 30 days.** Each video gets a new ElevenLabs track
  (`D:\kap-reel\scripts\social\music-week-0928.ts` pattern); `validate` enforces it
  (same-day cross-posts count once). History: `music-history.json`.
- **Plan before produce:** a weekly plan Alex approves (`plans/<week>.md`), then briefs.
- **One reel + one carousel per weekday**, plus a LinkedIn post (company page, Alex reposts
  with the `repost.md` line); Stories are paused. Weekends: carousels. Carousels post as swipe
  slides on Instagram and as a slide video on Facebook (`tools/slideshow.mjs`); on
  LinkedIn as a DOCUMENT.
- Truth: real sites, real numbers saved in `source/`; client posts only for a launch, a new
  feature or a real result; no AI vendor/product names; no promised results.
- AI posts link to **https://ka-performancefl.com/ai-launch/** (paid 90-Day AI Launch; never
  "free lessons"). /training/ai is coding-tool lessons, not the business-owner link.
- Facebook captions: tagged link on line 2 (`utm_source=facebook&utm_medium=social&utm_campaign=<folder>`).
  Instagram: "Link in bio" (the bio is the SmartLink below). LinkedIn: link in first comment.
- No em dashes, US English.
- **Nothing goes live without Alex's approval on the Post Desk.** Switching drafts to live
  must be done by Claude in the main session after Alex says so: subagents get blocked by
  the auto-mode classifier ("Real-World Transactions"). Subagents can create posts and
  update drafts.

## Free social media pilot (offer, posted Sat 9/26)

Plan: `plans/2026-09-social-pilot.md`. 3 free months for 3 businesses in Gainesville +
Alachua County; 3 posts/week on FB + IG, a monthly plan (their ONLY approval; K&A checks
every post internally), a monthly report; then $600/month locked for pilot clients, no
contract. They apply by calling Alex (904-210-1071) or messaging K&A. When a spot fills:
a "2 spots left" post. When the first client signs: a Metricool brand per client (Starter
allows 5) and multi-brand support in the tools (today they are single-brand).

## Accounts and services

- Metricool: **Starter** plan (no REST API), brand/blogId `7076479`, timezone America/New_York,
  via the Metricool MCP connector. `getScheduledPosts` fails on wide windows: query one day
  at a time. Ids change on every update (uuid stays); post.json holds the current ones.
  The connector had a ~1 hour outage on 9/25 (every call errored); it came back by itself.
- LinkedIn: K&A company page connected (`urn:li:organization:129934379`).
- Instagram @kaperformancefl; bio link = Metricool SmartLink https://t.mtrbio.com/kaperformancefl
  (buttons: website, 90-Day AI Launch, training samples, Call Alex; all tagged utm_medium=smartlink).
- Facebook page: https://www.facebook.com/profile.php?id=61592711216301
- Media hosting: R2 bucket `ka-social` at https://media.ka-performancefl.com (`tools/social.mjs upload`).
- Cloudflare Web Analytics: turned on by Alex 9/25. Search Console: Alex OK'd reading it in his Chrome (not done yet).
- Claude in Chrome was blocked all day by another extension; the built-in browser pane works for public pages.

## Website changes made today (live on ka-performancefl.com)

Deployed by pushing worktree branches to origin/main (only when Alex says so):
- `site/tap-to-call` (D:\ka-site-tel): 904-210-1071 tap-to-call in header, phone menu,
  footer, contact, Gainesville page, JSON-LD (`src/data/contact.js`).
- `site/proof-and-focus` (D:\ka-site-a11y): homepage proof line "5.0 on Google, 8 reviews"
  above the buttons (`src/data/reviews.js`), keyboard focus fixes (header scroll margin,
  inert closed FAQs on /ai-launch/, phone menu Esc and focus trap), and a missing gsap
  import that had kept /ai-launch/ FAQs from opening.
- The main checkout's local `main` is behind origin/main; always branch site work from
  origin/main in a worktree.

## Tools (from `Social Media Management/`)

```
node tools/social.mjs validate            # all folders + the 30-day music rule
node tools/social.mjs calendar --days 14
node tools/social.mjs upload <folder>     # status must be "approved"
node tools/social.mjs release <folder> [--draft]   # prints createScheduledPost packets
node tools/social.mjs release --record <folder> --network <n> --id <id> --uuid <uuid>
node tools/social.mjs release --promote <folder>   # draft -> live packets
node tools/slideshow.mjs <folder> --music <mp3>    # Facebook slide video for a carousel
node tools/review.mjs                     # Post Desk data (only posts waiting on Alex)
```
Tests: `node node_modules/vitest/vitest.mjs run` in `tools/` (133 pass). Reels are built in
`D:\kap-reel` (a junction), one Remotion entry per day under `src/social/<date>/`; run tools
with `node node_modules/...` directly, never npx (the ampersand path breaks it).
Post Desk decisions: page db `decisions/<folder or story id>` and `answers/<ask id>`.

## Scheduled tasks (run only while the Claude app is open)

- `thrillers-domain-check`: Thu Oct 1, 7 PM, one time.
- `social-weekly-check`: every Monday 8 AM; read-only report into `reports/`.

## Open items

1. Done: Stories checklist is in the Post Desk (see top).
2. Friday Oct 2 Thrillers go/no-go after the Oct 1 check.
3. Alex: set Veterans Day and Thanksgiving to normal hours in the Google Business Profile before Oct 5.
4. Plan the week of Oct 12 (plan first; Alex approves; then build in parallel with the build brief pattern in `plans/2026-10-05-build-brief.md`).
5. Pilot inquiries: onboarding and multi-brand tools when the first business signs.
6. As Instagram posts publish, add SmartLink Media tiles if they don't attach automatically.
7. Stories paused 2026-09-26; the 10:35 reminder is not needed unless they resume.
