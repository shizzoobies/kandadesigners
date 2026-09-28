# YouTube channel plan: K & A Performance

Drafted 2026-09-28 with Alex. Status: **approved by Alex 2026-09-28** (promise 1, the four topics, Shorts timing).
Approved: yes

Nothing in this plan gets built until it says `Approved: yes`. After approval, each item in
"Build order" gets its own brief first, following the same approval flow as social posts.

## Decided with Alex (2026-09-28)

| Decision | Call |
|---|---|
| Channel | Exists: "K & A Performance", @KAPerformancefl, created 2026-09-22, a Brand Account Alex owns |
| Audience | Business owners in Gainesville and North Florida. Instructional-design content stays on LinkedIn and /training/ |
| Pillars | Shorts from our reels, Quick fixes (long-form), Practical AI for owners |
| Long-form cadence | Weekly, alternating Quick fixes and Practical AI |
| Voice for long-form | ElevenLabs stock voice **Amy** (`OZxMHsGaBmV5pjMIDIn0`, eleven_multilingual_v2), picked from a five-voice audition |
| AI tool names | Plain-text mentions in narration and on-screen text when a tutorial needs them. Never in titles, thumbnails, playlist names or tags. No vendor logos. Nothing suggests K&A provides accounts, seats or licenses |

## The promise (decided: option 1)

1. **Practical fixes for your business website, Google listing and everyday AI. A new walkthrough every week from a Gainesville web studio.**
2. **Small fixes that bring in more customers: your website, your Google listing, and AI that actually saves time.**
3. **Plain-spoken help for small business owners who want a website and tools that work.**

The promise goes at the top of the About text and on the banner.

## Formats

### Shorts (from the weekday reels)
- The weekday reel (9:16, 1080x1920) goes up as a Short on the same day, one to two hours after
  Instagram and Facebook, so the three don't compete.
- It keeps the same video and the same music (a same-day cross-post counts as one use under the
  30-day music rule).
- It gets a YouTube title and a short description with the tagged link on line 1.
- Shorts can run up to 3 minutes. Ours are 15 to 45 seconds, so this changes nothing.
- Only reels that already passed the Post Desk go up, so no extra approval step: the desk shows
  the YouTube title alongside the other captions.

### Long-form (weekly, 16:9, 1920x1080, 5 to 10 minutes)
- Screen-led walkthroughs, recorded at a high resolution with Playwright on real sites, then built in
  Remotion (`D:\kap-reel`, a new `youtube/` composition set).
- Narrated by the chosen ElevenLabs voice. Burned-in captions are off. Instead there's a proper
  uploaded caption file (SRT), which helps both accessibility and search.
- The K&A logo and ka-performancefl.com stay in a corner on every frame (every frame drives
  traffic), plus the YouTube watermark.
- Structure: hook in the first 15 seconds (the problem, shown), the fix step by step, a quick
  recap, then a 20-second end screen (the next video plus subscribe).
- Every video gets a custom thumbnail from the thumbnail system.

### Proposed first four long-form videos (topics only, for your reaction)
1. **Quick fix:** "Test your website with one key" (the Tab-key accessibility check, on our own site).
2. **Practical AI:** "Answer customer emails faster with AI, and still sound like you".
3. **Quick fix:** "Fix your Google Business Profile in 15 minutes" (hours, categories, photos,
   using our own profile).
4. **Practical AI:** "Turn your Google reviews into FAQ answers for your website".

Each one gets a brief (hook, outline, what is captured, source for any number) before it's built.

## Links and disclosure
- Quick fixes link to https://ka-performancefl.com/ (or the page that fits, such as the
  accessibility service page). Practical AI videos link to https://ka-performancefl.com/ai-launch/.
- The link goes on line 1 of the description, tagged
  `utm_source=youtube&utm_medium=social&utm_campaign=<folder>`.
- AI voice: every long-form video sets `isAiGeneratedContent: true` and says "The voice is AI
  narrated." in the description. Shorts get the same flag if their visuals are AI assisted.
- `madeForKids: false` on everything.

## Playlists
- Quick fixes for your website
- Practical AI for small business
- Shorts (YouTube groups these on its own; no playlist needed)

## Channel art (built as options for you to pick, after approval)
The current banner and avatar use the live logo lockup (checked: it isn't the Logo Remake WIP
and it isn't the retired crest). They're on-brand, but thin: the avatar's wordmark is tiny
inside the circle, and the banner has no promise or links. I'll build 2 or 3 options for each:
- **Banner** 2560x1440, everything important inside the 1546x423 center safe area (it's what phones
  show): the lockup, the promise, "New walkthrough every week".
- **Avatar** 800x800, readable as a small circle: a tighter "K&A" mark on canvas or on teal.
- **Watermark** 150x150.
- **Thumbnail system** 1280x720 (under 2 MB): Schibsted Grotesk 700, large and dark, with one
  real screen capture, a rust or teal band, the logo in a corner, and at most 4 or 5 words.
- **End screen** frame (20 s) and a short 3-second intro sting.

Specs come from current third-party guides. I'll re-check them against YouTube Help before building.

## Channel setup checklist (after art is picked)
- [ ] Alex: add Kristina as a manager on the Brand Account.
- [ ] Alex: verify the channel by phone (needed for custom thumbnails and longer uploads).
- [ ] About text (promise, service area, free quotes), links (site, AI Launch, call 904-210-1071),
      business email.
- [ ] Upload defaults: not made for kids, category Howto & Style, a description template with the
      tagged link on line 1, default tags.
- [ ] Playlists above, home page sections (latest, Quick fixes, Practical AI, Shorts).
- [ ] Channel trailer: a 45 to 60 second cut once the first two videos exist.

## Connections (after setup)
- [ ] Alex: connect YouTube to Metricool brand 7076479. Starter plan includes YouTube per
      Metricool's pricing page. I'll confirm it in the Metricool connector afterward.
- [ ] Site: YouTube link in the footer and in JSON-LD `sameAs` (a worktree off origin/main, deployed
      only on Alex's go-ahead).
- [ ] Instagram SmartLink button and Google Business Profile social link.

## Pipeline (written spec for approval, then built with tests)
- A `youtube` network in `post.json`: title, type (video or short), tags, category, playlist,
  thumbnail, plus `youtube.md` for the description.
- `validate`: title of 100 characters or fewer (aiming for 60 or fewer), no em dashes, 16:9 for
  video and 9:16 for a Short, a thumbnail for long-form, the AI flag set when `ai.voice` is true,
  and the music rule.
- `release`: builds the `youtubeData` packet; `--record` unchanged.
- The Post Desk shows the title, thumbnail and description.
- Media: check R2 and Metricool size limits for 5 to 10 minute 1080p files before settling the design.

## Build order (after this plan is approved)
1. Voice audition: the same 20-second script in 3 or 4 stock voices; you pick.
2. Channel art options; you pick.
3. Channel setup and connections.
4. Pipeline spec, then the tool changes with tests.
5. Briefs for the first two long-form videos, then build.

## Open questions for Alex
- Which promise line (or your edit)?
- Do the four first topics feel right, or swap any?
- Are you OK with Shorts going up one to two hours after IG and FB each weekday?
