# Video 1 outline: Test your website with one key
Status: research outline for the build brief, not yet approved

Researched 2026-09-28. Publishes **Fri Oct 2 2026, 11:00 AM** (moved from Oct 7), built in 3 days, so this favors a tight 5 to 6 minute cut and a capture list recorded in one Playwright session. Planned post folder: **2026-10-02-4** (kept; it is the planned folder).

## Notes from the coordinator (2026-09-28)
- Channel art IS picked: thumbnail B, capture-first. Sources are in `Reels/youtube/channel-art/src/` (thumb.html, capture.cjs, render.cjs, captures/).
- The thumbnail background stays the approved one: the K&A site focus ring on Start a project. It is not the demo page.
- The folder name 2026-10-02-4 is the planned folder, so the UTM campaign below is final.

---

## 1. Title and thumbnail
- **Working title:** Test Your Website With One Key: The Tab Key Check (48 chars)
- **Alt A:** Press Tab on your website. Here's what to look for (49)
- **Alt B:** The 1-minute keyboard test every business website should pass (61)
- **Thumbnail headline:** "Press Tab. What happens?" (approved thumbnail B, 4 words). Background: the approved capture of the K&A site focus ring on Start a project, built from `Reels/youtube/channel-art/src/`.

## 2. Beat outline (timings at 150 wpm incl. short visual pauses)
| # | Time | Beat | On screen |
|---|---|---|---|
| 1 | 0:00 to 0:14 | **Hook: problem shown** | Demo page: Tab pressed (key overlay), nothing visible happens. Cut to K&A site where the rust outline moves |
| 2 | 0:14 to 0:31 | Intro + promise | K&A home, hero settled; 3-line agenda card |
| 3 | 0:31 to 1:30 | What focus is; who needs it | Slow Tab through K&A nav; 4 simple icon cards (screen reader, tremor/dexterity, broken arm, keyboard-by-choice); WCAG name card |
| 4 | 1:30 to 2:05 | How to run the test | Key overlay: Tab, Shift+Tab, Enter, Space; Safari setting still (Settings > Advanced) |
| 5 | 2:05 to 2:30 | Check 1: skip link | K&A: first Tab shows "Skip to content" top-left; Enter jumps past menu |
| 6 | 2:30 to 2:55 | Check 2: visible focus | K&A rust outline, then demo page with invisible focus |
| 7 | 2:55 to 3:16 | Check 3: logical order | K&A order logo, nav, phone, Start a project; demo page jumps header, footer, header |
| 8 | 3:16 to 3:42 | Check 4: menus/popups | K&A at 960 wide: menu opens with Enter, Escape closes and focus returns; Kai chat bubble same |
| 9 | 3:42 to 4:05 | Check 5: no traps | Demo page signup box trap |
| 10 | 4:05 to 4:32 | Check 6: labeled forms | K&A /contact/: Name, Email, Message labels; Tab to Send message |
| 11 | 4:32 to 5:22 | What to ask your web person | 5-item checklist card (hold for pause), WCAG references card |
| 12 | 5:22 to 5:49 | Recap + CTA | 6-item checklist ticks; /services/accessibility/ page |
| 13 | 5:49 to 6:09 | End screen (20 s) | Subscribe + video slot; music up, one VO line |

**Length:** about 6:09 at 150 wpm. Amy's measured audition pace was faster (331 characters in 19.6 s, roughly 185 to 190 wpm), so VO runs about 4:35 and the finished cut should land about **5:00 to 5:30**, which fits the tight target. If long, trim beat 3 (the "broken arm" and "There's a standard" sentences, about 30 words) and the spoken WCAG list in beat 11 (the card shows it).

## 3. Narration script (Amy; no em dashes; "K and A" spelled; US English)
**868 words: about 5:47 at 150 wpm (about 4:35 at Amy's measured pace).**

**[1] Hook**
Press the Tab key on your website. Watch where the highlight goes. If you can't see it, or it skips right past your Book Now button, some of your customers can't use your site.

**[2] Intro**
I'm with K and A Performance, a web studio in Gainesville. In the next five minutes, you'll learn how to run this test, what to look for, and what to ask your web person to fix. Nothing to install. Just one key.

**[3] What focus is**
First, what are we looking at? When you press Tab, your browser moves to the next thing you can use. A link, a button, a box you type in. That spot is called focus. A good site draws a clear outline around it, so you always know where you are.
Who needs that? More people than you might think. People who are blind use a screen reader, and they get around a page with the keyboard. People with tremors, like those from Parkinson's, or anyone who finds a mouse hard to control. Someone with a broken arm this month. And plenty of people who just like the keyboard because it's faster.
If your site only works with a mouse, every one of them hits a wall. There's a standard for this, too. The Web Content Accessibility Guidelines, called WCAG, say everything on your site should work from a keyboard.

**[4] How to run it**
Here's how to run the test. Open your home page on a computer. Don't click anything yet. Press Tab to move forward. Shift and Tab moves back. On a link, press Enter to follow it. On a button, Enter or the space bar should both work.
Using Safari on a Mac? Turn one thing on first. Open Safari settings, choose Advanced, and check Press Tab to highlight each item on a webpage.
That's all the setup. Let's try it on a real site. This is our own.

**[5] Check one**
Check one. The skip link. Press Tab once, right after the page loads. On a well-built site, the first thing you see is a link that says Skip to content. Press Enter, and you jump past the menu, straight to the page. Without it, a keyboard user tabs through every menu item, on every page, just to reach what they came for.

**[6] Check two**
Check two. Can you always see where you are? Keep tabbing. Here, every link and button gets a clear outline. Now look at this plain test page we built for this video. Press Tab, and nothing seems to happen. The focus is there, but it's invisible. That's the problem we're looking for. The good news is it's one of the easier fixes.

**[7] Check three**
Check three. The order. Focus should move the way you read. Top to bottom, left to right. The logo, the menu, the phone number, then the button to start a project. On our test page, focus jumps from the header down to the footer, then back up. That's how people get lost.

**[8] Check four**
Check four. Menus and popups. On a smaller screen, our menu hides behind a button. Tab to it and press Enter. It opens, and focus moves inside. Press Escape. It closes, and you're right back on the button. The chat bubble in the corner works the same way. If a menu only opens when you hover with a mouse, keyboard users never see what's inside.

**[9] Check five**
Check five. No traps. Once you're inside a popup, make sure you can get back out. On our test page, this signup box grabs focus and won't let go. Tab, Shift and Tab, Escape. Nothing. That's called a keyboard trap. It's the worst version of this problem, because the only way out is to leave the page.

**[10] Check six**
Check six. Your forms. Tab into your contact form. Every field should have a label you can see, like Name, Email and Message. A light gray hint inside the box that disappears when you type isn't enough on its own. Then Tab to the Send button and press Enter. If you can't send the form from the keyboard, you could be losing leads you never hear about.

**[11] Ask your web person**
Found a problem? Here's what to ask your web person. You can pause and read these right off the screen.
One. Add a Skip to content link at the top of every page.
Two. Don't remove the focus outline. Style it so it's easy to see.
Three. Make the tab order follow the page.
Four. Make every menu, popup and chat window open with Enter, close with Escape, and put focus back where it was.
Five. Give every form field a visible label.
If they want the official references, they're in WCAG 2.2. Keyboard, No Keyboard Trap, Bypass Blocks, Focus Order, Focus Visible, and Labels or Instructions. The numbers are in the description.

**[12] Recap**
So, the recap. Load your page and press Tab. Look for a skip link, an outline you can always see, an order that makes sense, menus and popups that open and close from the keyboard, no traps, and forms with labels. It takes about a minute.
If you'd like a second pair of eyes, K and A Performance does full accessibility audits. The link is in the description.

**[13] End screen**
Subscribe for a new walkthrough every week. Thanks for watching.

## 4. Capture list (one Playwright session, DSF 2)

**Verified on ka-performancefl.com, 2026-09-28 (Playwright, 1440x900, mouse parked at 0,0):**
- **Skip link: present and working.** Tab 1 on load = "Skip to content" (`#main-content`), slides in top-left (0.4 s transform), rust pill with outline. Enter moves focus to `<main id="main-content">`; next Tab = hero "Start a project".
- **Focus styles: visible on every stop** (30 stops on home + contact form, all `:focus-visible`). 2px rust #9A3412 outline, 3px offset on most; nav links a dark 2px outline (rgba(34,28,21,.8)); on the teal band a 3px mint outline (#5EEAD4). None missing.
- **Order logical:** skip link, logo, Home, Services, Mentorship, Training, Artists, phone, Start a project, hero buttons, content top to bottom. (The work tabpanel `<article>` is itself a tab stop; fine for a tabpanel.)
- **Mobile menu (below 1024px; shows at 960):** "Open menu" button with `aria-expanded`; Enter opens, focus moves to "Close menu"; Tab cycles inside header + overlay only (overlay links, then logo, call, close in header); Escape closes, `aria-expanded` back to false, focus returns to the toggle. Good demo. At 1024 and up the full nav shows and the toggle is hidden.
- **Kai chat bubble ("Chat with Kai"):** Enter opens, focus to "Ask about our services…" input; Tab goes to Send, then out of the panel (not a trap, non-modal); Escape closes and returns focus to the bubble. Good demo.
- **Contact form (/contact/):** every visible field has a real `<label>` (NAME, EMAIL, MESSAGE, uppercase via CSS; Kai "Your message"). Honeypot `botcheck` is `display:none`, tabIndex -1 (not in tab order). Tab order name, email, message, "Send message", all rust outline.
- /services/accessibility/ (H1 "Website accessibility audit, measured not guessed") and /accessibility/ both return 200.
- Caution: the home hero illustration is still drawing on load; wait about 3 s before the first Tab or the right side looks half-rendered.

**Session plan** (one `recordVideo` context plus screenshots; viewport 1440x810 at DSF 2, which gives 2880x1620 source for zoom/pan in Remotion; one context switch to 960x540 for the menu; mouse parked off-screen; key overlay added in Remotion, not in the page):

| Clip | Page / viewport | Actions |
|---|---|---|
| C1 | K&A home 1440 | Load, wait 3 s, Tab 1 (skip link) hold 1.5 s, Enter (jump to main), Tab (Start a project) |
| C2 | K&A home 1440 | Reload, wait 3 s, Tab x9 at about 0.8 s (logo through Start a project), Shift+Tab x2 |
| C3 | K&A home 1440 | Tab into hero buttons and "custom websites" inline links (focus ring close-ups for zooms) |
| C4 | K&A home 960x540 | Tab to Open menu, Enter, Tab x3 in overlay, Escape (focus back on toggle) |
| C5 | K&A home 1440 | Focus Chat with Kai, Enter (focus in input), Escape (focus back on bubble). Do not type or send |
| C6 | K&A /contact/ 1440 | Focus Name, Tab, Tab, Tab to "Send message". Do **not** press Enter or submit |
| C7 | K&A /services/accessibility/ 1440 | Slow scroll of hero and "What the audit covers" for the CTA |
| D1 | Demo page (local file) 1440 | Tab x6 with `outline:none`: nothing visible (hook, check 2) |
| D2 | Demo page | Tab order jumps header, footer, header (check 3) |
| D3 | Demo page | Signup box traps focus; Tab, Shift+Tab, Escape all fail (check 5) |
| D4 | Demo page | Optional: placeholder-only field that loses its hint on typing (check 6 contrast) |
| S1 | Static still | Safari Settings > Advanced checkbox: a Mac screenshot or a clean redrawn mock (Playwright can't capture Safari settings UI) |

**Demo page:** one plain local HTML file, deliberately unbranded (gray system font, placeholder name "Sample Business", no K&A styling, no real business), with a small on-screen label "Test page built for this video". It contains `*:focus{outline:none}`, `tabindex` values that scramble order, a JS keydown trap in a signup box, and a placeholder-only input. About 1 to 2 h to build. **No third-party site is shown as a bad example.** No client site is used; K&A's own site covers every positive case and adding one costs capture time.

## 5. Facts check (sources)
| Claim in script | Verified against |
|---|---|
| Keyboard: everything works from a keyboard (2.1.1, Level A) | https://www.w3.org/TR/WCAG22/#keyboard |
| No Keyboard Trap (2.1.2, A): focus can always be moved away using only the keyboard | https://www.w3.org/TR/WCAG22/#no-keyboard-trap |
| Bypass Blocks (2.4.1, A); skip link to main content is a sufficient technique (G1) | https://www.w3.org/TR/WCAG22/#bypass-blocks ; https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html |
| Focus Order (2.4.3, A): order preserves meaning and operability | https://www.w3.org/TR/WCAG22/#focus-order |
| Focus Visible (2.4.7, **AA**) | https://www.w3.org/TR/WCAG22/#focus-visible |
| Labels or Instructions (3.3.2, A) | https://www.w3.org/WAI/WCAG22/quickref/#labels-or-instructions |
| WCAG 2.2 is a W3C Recommendation (12 Dec 2024) | https://www.w3.org/TR/WCAG22/ |
| Placeholder text is not a replacement for labels | https://www.w3.org/WAI/tutorials/forms/instructions/ |
| Who uses the keyboard: blind users, people with tremors such as Parkinson's, limited dexterity | https://www.w3.org/WAI/test-evaluate/easy-checks/keyboard-focus/ |
| Temporary limitations such as a broken arm; people who can't use a mouse | https://www.w3.org/WAI/perspective-videos/keyboard/ |
| Non-disabled users may prefer keyboard for efficiency ("faster") | https://webaim.org/techniques/keyboard/ (WebAIM, not W3C) |
| Tab / Shift+Tab move focus; Enter follows links; Enter or Space activates buttons; Esc closes dialogs | https://webaim.org/techniques/keyboard/ (WebAIM) |
| Safari: "Press Tab to highlight each item on a webpage" (Settings > Advanced) | https://support.apple.com/guide/safari/advanced-ibrw1075/mac |

No statistics are used. "One of the easier fixes" and "the worst version of this problem" are opinion, phrased as such. No ADA or legal claims.

## 6. Chapters, description, tags

**Chapters** (estimated at 150 wpm; re-time from the final VO):
```
0:00 The one-key test
0:14 What you'll learn
0:31 What focus is and who needs it
1:30 How to run the test
2:05 Check 1: Skip link
2:30 Check 2: Visible focus
2:55 Check 3: Tab order
3:16 Check 4: Menus and popups
3:42 Check 5: Keyboard traps
4:05 Check 6: Form labels
4:32 What to ask your web person
5:22 Recap
```
(If Amy's faster pace brings the cut to about 5:10, scale these by about 0.83. YouTube needs the first chapter at 0:00, at least 3 chapters, each at least 10 s.)

**youtube.md draft** (template; link on line 2):
```
Press one key to find out if customers can use your website without a mouse.
https://ka-performancefl.com/services/accessibility/?utm_source=youtube&utm_medium=social&utm_campaign=2026-10-02-4

Load your home page and press Tab. In about a minute you'll see whether your site has a skip link, a focus outline you can actually see, a sensible order, menus and popups that work from the keyboard, no keyboard traps, and labeled forms. We run the test on our own site, then show what to ask your web person to fix.

WCAG 2.2 references: 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.1 Bypass Blocks, 2.4.3 Focus Order, 2.4.7 Focus Visible, 3.3.2 Labels or Instructions. https://www.w3.org/TR/WCAG22/

Chapters
0:00 The one-key test
0:14 What you'll learn
0:31 What focus is and who needs it
1:30 How to run the test
2:05 Check 1: Skip link
2:30 Check 2: Visible focus
2:55 Check 3: Tab order
3:16 Check 4: Menus and popups
3:42 Check 5: Keyboard traps
4:05 Check 6: Form labels
4:32 What to ask your web person
5:22 Recap

The voice is AI narrated.

K&A Performance builds websites for small businesses in Gainesville and North Florida.
Free quotes: 904-210-1071 | ka-performancefl.com
```
The line 2 link returns 200 (checked with curl). Campaign `2026-10-02-4` is the planned folder.

**Tags** (299 chars, no #):
`website accessibility, keyboard accessibility, tab key test, website accessibility test, keyboard navigation, focus visible, skip to content link, WCAG 2.2, accessibility audit, small business website, website tips for small business, Gainesville web design, Gainesville FL web designer, North Florida web design`

Category HOWTO_STYLE; playlist "Quick fixes for your website"; `isAiGeneratedContent: true`; `madeForKids: false`.

## 7. Music
A **new ElevenLabs bed**: calm, unobtrusive, steady, no vocals; mixed low under narration (roughly -24 to -28 LUFS under a -14 LUFS program), lifted for the 20 s end screen; about 6 min or a seamless loop. Log it in `music-history.json` with the publish date. It must not repeat a track used in the last 30 days (music-a, last used 2026-09-05, is outside the window by 2026-10-02, but a new bed is required anyway), and it must not be reused within 30 days, including in a Short. Generation is quick; budget one round of Alex listening.

## 8. Risks and open questions
1. **3-day timeline.** Slowest items: the demo page (1 to 2 h); Alex's approval of the brief before production (plan-before-produce); VO and music generation plus his listen; the Remotion `youtube/` composition set, which doesn't exist yet and is the largest unknown; and the YouTube pipeline code (validate, payload, release) if it isn't built by then, in which case it is a manual Studio upload or a Metricool draft by hand. The thumbnail uses the picked system (thumbnail B, capture-first, `Reels/youtube/channel-art/src/`), so it is not a blocker.
2. **Channel verification:** custom thumbnails need a phone-verified channel (Alex's setup checklist). Without it, the thumbnail can't be set.
3. **End screen has no "next video"** (first long-form). Use subscribe plus the latest Short, or subscribe only. The script's end line avoids naming a next topic.
4. **SRT captions** are uploaded by hand in Studio after publish; generate them from the script text re-timed to the VO.
5. **Site drift:** the site is live; the working branch is `codex/training-premium-rfi` with main deploys pending. If the header, skip link or Kai widget changes before capture, re-run the checks. Record with Kai never sent (no live AI calls on camera) and the contact form not submitted.
6. **Hero animation** needs a 3 s settle before tabbing.
7. **"Book Now" in the hook** is generic (K&A's own button says "Start a project"). OK as the everyday example, or change to "your Contact button"?
8. **Safari still:** a real Mac screenshot or a redrawn mock; no Apple branding beyond the plain setting text.
9. Two claims rest on WebAIM rather than W3C ("faster", and the key actions). Fine as is; say if you want W3C-only sourcing.
10. **Length:** about 6:09 at 150 wpm, about 5:10 at Amy's measured pace. Trim beat 3 if the final runs over 6:00.
