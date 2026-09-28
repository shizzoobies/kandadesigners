# Brief: L1 YouTube video, Test your website with one key

Slot: Fri 2026-10-02, 11:00 AM. YouTube only, VIDEO (16:9, 1920x1080). Playlist "Quick fixes for your website".
Pillar: tip (Quick fix). Audience: business owners.
Approved: no

Full research, the script, the capture list and the sources are in `plans/youtube-2026-09-28/video-1-tab-key.md`. This brief is the part to approve. The voice text is in `source/script.md`.

## What the viewer gets
A one-minute keyboard test they can run on their own site today, with six checks: a skip link, a focus outline they can see, a sensible order, menus and popups that work from the keyboard, no keyboard traps, and labeled forms. They also get a five-line list to hand their web person. We run every good example on our own site, and every bad one on a plain test page we built for the video.

## Title
"Test Your Website With One Key: The Tab Key Check" (48 characters).
Alternates: "Press Tab on your website. Here's what to look for" (49) or "The 1-minute keyboard test every business website should pass" (61).

## Hook (first 14 seconds)
The test page: Tab is pressed and nothing visible happens. Cut to our site, where the rust outline moves. Amy says: "Press the Tab key on your website. Watch where the highlight goes. If you can't see it, or it skips right past your Book Now button, some of your customers can't use your site."

## Shape, about 5:00 to 5:30
| # | Beat | On screen |
|---|---|---|
| 1 | Hook | The test page with no visible focus, then K&A's rust outline |
| 2 | Intro and promise | K&A home page, a three-line agenda card |
| 3 | What focus is and who needs it | A slow Tab through our nav; four simple icon cards; the WCAG name card |
| 4 | How to run the test | Key overlay (Tab, Shift+Tab, Enter, Space); the Safari setting (see question 2) |
| 5 to 10 | Six checks | Good: our site (skip link, outline, order, 960-wide menu, Kai bubble, contact form labels). Bad: the test page (invisible focus, scrambled order, signup trap) |
| 11 | What to ask your web person | A five-item checklist card, held long enough to pause; the WCAG references card |
| 12 | Recap and CTA | The six checks tick off; our /services/accessibility/ page |
| 13 | End screen, 20 seconds | Subscribe plus the latest Short (there's no earlier long video yet) |

## How it's made
- **Captures:** one Playwright session at deviceScaleFactor 2, following the outline's capture list: clips C1 to C7 on ka-performancefl.com, D1 to D4 on the test page. Kai is opened but never sent a message, and the contact form is never submitted.
- **Test page:** plain and unbranded ("Sample Business", gray system font, labeled "Test page built for this video"). No real business, no client site, no third-party site as a bad example.
- **Voice:** Amy (ElevenLabs, the settings in the spec), one file per beat. The script spells "K and A" and reads WCAG as "W-C-A-G".
- **Music:** a new calm ElevenLabs bed with no vocals, mixed well under the voice and lifted for the end screen. Logged in `music-history.json`.
- **Edit:** the new shared Remotion `youtube/` set at 1920x1080, 30 fps.
  - The K&A logo and ka-performancefl.com sit in a corner on every frame.
  - Lower thirds and check cards use small-caps interpunct lines, no pills.
  - A recap card and the 20-second end screen.
  - L2 and L3 reuse all of these.
  - Fallback if Wednesday slips: captures, lower thirds and the end screen, with no animated cards.
- **Thumbnail:** the approved `thumb-b-topic1.jpg` design, "Press Tab. What happens?", over the K&A focus ring on Start a project.
- **Description:** the outline's draft, with the tagged link to /services/accessibility/ on line 2. It has the WCAG 2.2 criterion numbers, chapters re-timed to the final cut, and "The voice is AI narrated. The music is AI generated."
- **Captions:** an SRT from the final script, uploaded in Studio after publish.
- **Truth:** no statistics, and no ADA or legal claims. Every WCAG criterion links to w3.org. The two opinions ("one of the easier fixes", "the worst version of this problem") are phrased as opinions.

## Schedule
| Day | Work |
|---|---|
| Mon 9/28 | This brief |
| Tue 9/29 | Test page, captures, voice, music |
| Wed 9/30 | The shared Remotion set, then the L1 cut |
| Thu 10/1 | Render; Post Desk approval by noon; schedule |

## Questions for Alex
- Title: keep "Test Your Website With One Key: The Tab Key Check", or use one of the two alternates?
- The Safari step (Settings > Advanced > "Press Tab to highlight each item on a webpage"): can you send a real Mac screenshot by Tuesday, or should we redraw it as a clean mock-up?
