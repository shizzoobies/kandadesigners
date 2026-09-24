# Social Media Handoff: K & A Performance

You're taking over Facebook and Instagram management for K & A Performance. This file covers the business, the connected tools, what's been done so far, and what comes next.

## Ground rules

- **Get approval before anything goes live.** Draft freely, but confirm with the owner before scheduling or publishing. Posts saved as `draft: true` in Metricool are fine to create without asking.
- **Verify before asserting.** If you're unsure what a tool, API, or platform can do, check the docs first. Don't correct the owner on something you haven't checked.
- **Be honest about quality.** When asked how good something is, give a real assessment, not reassurance.

## The business

K & A Performance is a two-owner web design, AI integration, and instructional design studio in Gainesville, FL.

- **Website:** https://ka-performancefl.com/
- **Owners:** Alex Anderson (design and development; builds every site himself) and Kristina Anderson (strategy and content).
- **Services:** custom websites, AI integration, SEO and AI search, accessibility audits, training and instructional design (short illustrated courses), and a 12-week one-on-one "90-Day AI Launch" mentorship.
- **Service area:** Gainesville, Alachua, Newberry, High Springs, Ocala, Jacksonville, Orange Park, Fleming Island, and St. Augustine.
- **Key selling points:** you work directly with both owners, quotes are always free, and accessibility is built in.
- **Voice:** plain-spoken, practical, and warm. The emphasis is on what's useful rather than hype, and clear next steps. Avoid generic agency buzzwords.

### Portfolio to feature

| Client | Type | Site | Hook |
|---|---|---|---|
| Project Makeover | Nonprofit (school makeovers) | https://projectmakeover.org | Browse makeovers, then a clear path to donate or volunteer |
| Osteen & Sons | Gainesville lawn, brush, and junk crew | https://osteenandsons.com | Address lookup pulls county lot details and leads into booking a walkthrough |
| David's BBQ | Gainesville restaurant | https://davidsbbq.com | Menu, catering, and online ordering easy to reach |
| MBS Medicine | Veteran-owned FL telehealth clinic | none | Bold identity, same-week booking, patient portal |

Other clients are shown on the homepage: PB&J Strategic Accounting, Fore Motion Golf, Ellenton Family Practice Direct, Southern Legacy Contractors, and Synovial Marketing.

Sample training courses, each under 10 minutes, are at https://ka-performancefl.com/training/samples/. They cover jobsite hazard recognition, reading a P&L, and building a balanced plate.

## Connected tools

### Metricool (scheduling and analytics)

- **MCP server:** `https://ai.metricool.com/mcp`
- **Brand:** K & A Performance, `blogId` / `brandId` = `7076479`
- **Facebook Page ID:** `1239857262550754`
- **Instagram:** `@kaperformancefl`
- **Time zone:** `America/New_York` (verified). The `joinDate` fields show Europe/Madrid, but that's only the connection timestamp, not the brand setting.

Notes:
- Instagram posts require an image or video. Reels require video.
- Use `firstCommentText` for Instagram hashtags if you want a cleaner caption.
- Set `instagramData.isAiGenerated: true` on any post whose visuals or voice come from AI generation.
- Use `getBestTimeToPostByNetwork` before picking times once analytics exist.

### ElevenLabs (image, video, and voice generation)

- **Hosted MCP server:** `https://api.elevenlabs.io/v1/mcp` (OAuth sign-in, no API key or local install). The old local MCP server is deprecated.
- **Capabilities:** image generation (Nanobanana, Flux Kontext, GPT Image, Seedream), video generation (Veo, Sora, Kling, Wan, Seedance, and others), text-to-speech, music, and sound effects. It also has asynchronous API endpoints for image, video, and speech generation.
- **Caveats:** some models are restricted in the US, and video requires a paid plan. Confirm which models are available on this account before planning around one.

### Local tooling

These are useful for building content:
- **Playwright or Puppeteer:** automated screen recordings that scroll through client sites and click key features, recorded at a vertical 1080×1920 viewport.
- **ffmpeg:** combine recordings, voiceovers, music, and burned-in captions into finished Reels.

## Current state

### Analytics

The accounts were connected on Sept 24, 2026, and history was still importing at handoff.
- **Facebook:** about 18 posts since early August, around 10 of them Reels. About 40 interactions across recent posts, with the best day Sept 17 (13 interactions). Average reach was only about 4 people per post, which may be incomplete, so re-check once the import finishes.
- **Instagram:** all zeros at handoff. The import was likely still pending. Re-pull before drawing conclusions.

**First task:** re-pull 90-day analytics for both networks, find the top-performing posts and Reels, get the best posting times, and summarize for the owner.

### Draft week

Nothing is in Metricool yet. Five posts were drafted for Mon, Sept 28 through Fri, Oct 2, all going to both FB and IG:

1. **Mon:** Project Makeover client spotlight
2. **Tue:** Accessibility tip ("put down your mouse and press Tab on your own site")
3. **Wed:** Osteen & Sons spotlight (the address lookup feature)
4. **Thu:** Instructional design (the sample courses)
5. **Fri:** Meet the owners (Alex and Kristina)

**Honest assessment of these drafts:** 6/10. They're accurate and on-brand but likely to get likes rather than leads. Rewrite them with these fixes:

- **Use video instead of screenshots.** Full-site screenshots are unreadable at phone size. Replace them with 10–15 second screen-recording Reels of each client site, and use ElevenLabs visuals for the tip and training posts.
- **Sharpen the hooks.** The first lines were generic. Lead with the specific, surprising detail, for example "This lawn crew's website pulls county property records."
- **Show results.** Ask the owner for any client outcomes they're comfortable sharing, like more inquiries or faster booking.
- **Split by platform.** Instagram gets hashtags and "link in bio." Facebook gets the direct link and few or no hashtags.
- **Tag clients** (Instagram collaborators or mentions) if they have accounts, but confirm with the owner first.
- **Drop #CoupleOwnedBusiness** unless the owner confirms it. It was an assumption based on the shared last name.
- **Check image formats.** Site images are .webp, which Instagram may reject. Convert to JPG or PNG if needed.

## Content pillars

Aim for a mix across a typical week:
1. **Client spotlights:** real sites, one specific feature each, with video walkthroughs.
2. **Practical tips:** accessibility, web basics, and useful AI for small businesses.
3. **Training and instructional design:** course samples and the free course.
4. **AI integration and the 90-Day AI Launch:** the service isn't in the current drafts, so add it to the rotation.
5. **Behind the scenes:** the owners, the process, and local Gainesville and Jacksonville ties.

## Open questions for the owner

- Which client results can be shared publicly?
- Can clients be tagged or collaborated with on posts?
- How often should we post, and should it be 5 days a week?
- Should ElevenLabs narration use a stock voice, or clone one of the owners' voices?
- Should posts auto-publish, or send phone reminders (`autoPublish: false`) at first?
