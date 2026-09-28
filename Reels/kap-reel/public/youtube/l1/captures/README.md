# L1 captures: Test your website with one key

Screen captures for YouTube L1 (publishes Fri 2026-10-02), task A2. Job spec: `Social Media Management/plans/youtube-2026-09-28/video-1-tab-key.md`, section 4. Captured 2026-09-28 in one Playwright session by `scripts/youtube/l1/capture.mjs`.

Re-run everything (about 10 minutes) from `D:\kap-reel`:

```
node scripts/youtube/l1/capture.mjs
node scripts/youtube/l1/capture.mjs --only C7        one clip (ids below, plus STILLS and S1)
node scripts/youtube/l1/capture.mjs --verify-only    re-check the live site only
```

It checks the live site first (results in `preflight.json`, 19 of 19 passed on 2026-09-28) and records nothing if a check fails.

## Clips

All clips are 30 fps H.264 (CRF 12, yuv420p, BT.709). Every frame is a real deviceScaleFactor 2 screenshot, so the 1440x810 clips are 2880x1620 and C4 (960x540) is 1920x1080. On a 1920x1080 timeline a 2880 clip fills the frame at 67% scale and can zoom to 150% with no upscaling.

| Clip | File | Duration | What it shows | Beats |
|---|---|---|---|---|
| C1 | `C1.mp4` | 5.6 s | K&A home. Tab 1 slides in Skip to content top-left (rust pill and outline), hold, Enter moves focus to main, next Tab lands on the hero Start a project. The first second is the settled hero with no focus. | 5, and 2 (settled hero) |
| C2 | `C2.mp4` | 11.0 s | K&A home. Nine Tabs at 0.8 s: skip link, logo, Home, Services, Mentorship, Training, Artists, phone, Start a project. Then Shift+Tab twice back to Artists. | 1 (rust outline moving), 3, 4 (Shift+Tab), 6, 7 |
| C3 | `C3.mp4` | 7.4 s | K&A home, focus already on the header Start a project. Five Tabs at 1.2 s: hero Start a project, What we do, then the inline links custom websites, useful AI integrations, training people can use. | 6 (close-ups) |
| C4 | `C4.mp4` | 10.4 s | K&A home at 960x540. Tabs to Open menu, Enter opens the overlay (the same button now reads Close menu), Tab through Home, Services, Mentorship, Escape closes and focus is back on the menu button. | 8 |
| C5 | `C5.mp4` | 6.0 s | K&A home. Shift+Tab from a fresh load focuses the Chat with Kai bubble, Enter opens the panel with focus in the input, Escape closes it and focus is back on the bubble. Nothing typed or sent. | 8 |
| C6 | `C6.mp4` | 6.2 s | K&A /contact/, framed on the form: visible labels NAME, EMAIL, MESSAGE. Tab to Name, Email, Message, then Send message. Nothing typed, never submitted. | 10 |
| C7 | `C7.mp4` | 8.5 s | K&A /services/accessibility/. 1 s hold on the hero, a 6 s eased scroll to What the audit covers, 1.5 s hold. | 12 |
| D1 | `D1.mp4` | 6.5 s | Demo page. Six Tabs and nothing visible happens (focus moves to Home, Services, Privacy, Terms, Sample Business, About, all hidden by `*:focus{outline:none}`). | 1 (hook), 6 |
| D2 | `D2.mp4` | 6.5 s | Demo page with `?reveal=1`. Same six Tabs with an outline shown: Home, Services in the header, down to Privacy, Terms in the footer, back up to Sample Business, About. | 7 |
| D3 | `D3.mp4` | 7.5 s | Demo page with `?reveal=1`. Tab into the signup email field, then Tab, Tab, Shift+Tab, Shift+Tab, Escape, Escape: the outline never leaves the field. | 9 |
| D3-plain | `D3-plain.mp4` | 7.5 s | The same trap without the reveal outline. Nothing visible changes, so only use it with a focus box drawn from its keys.json. | 9 (alternate) |
| D4 | `D4.mp4` | 9.0 s | Demo page quote form with placeholder-only fields. Tab in and type "Jordan Lee", "555-555-0142", "Fix a leaky faucet"; every gray hint disappears and nothing says which box is which. | 10 (contrast) |
| S1 | `safari-advanced.png` | still | Redrawn Mac browser settings pane "Advanced" with "Press Tab to highlight each item on a webpage" checked. 2880x1620 on neutral gray. `safari-advanced-window.png` is the window alone on transparency (1976x916). `safari-advanced.json` has the checkbox and row boxes for a zoom. Source: `scripts/youtube/l1/demo/safari-advanced.html`. | 4 |

Beat 11 (the checklist and WCAG cards) uses no captures. Beat 12's recap card is Remotion; C7 is its CTA.

## Key logs: `<clip>.keys.json`

The key overlay is not drawn in the page; add it in Remotion from these logs.

- `keys[].tMs`: ms from clip start. The key lands on that exact frame (`frame`).
- `keys[].focus`: the focused element once settled (measured just before the next key). Use this for overlays and zooms.
- `keys[].focusAtPress`: the same element measured right after the press, before any transition ran. For the skip link this is still above the viewport (it slides in).
- `box` is the element; `ringBox` adds the outline width and offset, which is the visible ring. `ringBox` is null on the demo page, where there is no outline.
- Coordinates are CSS px relative to the viewport (1440x810, or 960x540 for C4). Multiply by 2 for video pixels.
- D4 also has `typing[]` (text, start and end ms). C7 has `scroll` (from and to scrollY, start and end ms, easeInOutCubic).

## Stills: `stills/`

Frame-exact stills, 2x (2880x1620, C4 1920x1080). Each is the clip's own frame at the `tMs` listed in its keys.json, so a cut from clip to still is seamless:
C1-home-hero-settled, C1-skip-link, C1-hero-start-a-project, C2-logo, C2-nav-services, C2-phone, C2-header-start-a-project, C3-hero-start-a-project, C3-what-we-do, C3-custom-websites, C3-ai-integrations, C3-training-link, C4-menu-button-focus, C4-menu-open, C4-menu-home-focus, C4-menu-closed-focus-returned, C5-kai-bubble-focus, C5-kai-open, C5-kai-closed-focus-returned, C6-contact-labels, C6-name-focus, C6-send-message-focus, C7-audit-hero, C7-what-the-audit-covers, D1-demo-page, D1-invisible-focus, D2-header, D2-footer, D2-back-to-header, D3-trap, D4-placeholder-hints, D4-filled-no-labels.

High-resolution stills at deviceScaleFactor 4 (5760x3240; the menu ones 3840x2160) for tight zooms up to 3x on a 1080 timeline. Same states, replayed in a DSF 4 context:
home-skip-link, home-nav-services, home-header-start-a-project, home-hero-custom-websites, home-kai-open, contact-name-label, contact-send-message, menu-open, menu-home-focus, demo-invisible-focus, demo-order-footer (reveal), demo-trap (reveal), demo-placeholder-filled (all `@4x.png`).

## How it was captured, and why not recordVideo

Playwright's `recordVideo` was tested first. In a deviceScaleFactor 2 context it still records at CSS-pixel size (the CDP screencast it uses delivers 1440x810 frames), then encodes VP8 at a 1 Mbps cap. Asking it for 2880x1620 only pads the 1x picture with gray. That is soft and not usable here.

So every clip is a PNG screenshot sequence at DSF 2, one screenshot per video frame, piped into ffmpeg. A screenshot takes about 130 ms, so the page runs on a virtual clock: before each frame, every CSS animation and transition is paused and stepped forward exactly 33.3 ms. Key presses land on exact frames. The pacing in the clips is exact, and the skip link slide, the Kai panel and the page's ambient drift play at their real speed. The text caret is hidden in every frame, so holds stay still.

## Differences from the outline, and notes for the editor

1. **Nav link focus is rust now, not dark.** The outline said nav links had a dark 2px outline. On 2026-09-28 every stop checked (home and contact) shows the same 2px rust #9A3412 outline with a 3px offset. Only better for the video.
2. **Menu at 960: focus stays on the toggle.** Enter keeps focus on the same button, which now reads Close menu; the next Tab goes into the overlay (Home). The outline describes this correctly. The script line "It opens, and focus moves inside" is close enough, but "the next Tab goes inside" would be exact. The overlay opens instantly, with no animation.
3. **The skip link does not scroll.** Main starts at the top of the page under the header, so Enter moves focus without scrolling. The jump shows as the next Tab landing on the hero Start a project (C1).
4. **Focused pill buttons square off.** Start a project turns into a small-radius rectangle when focused. That is the live site's focus style, and the approved thumbnail capture shows the same shape.
5. **C7 ends on the word "Colour".** The first bullet under What the audit covers reads "Colour contrast measured across...", which is British spelling on the live site (`src/pages/services/accessibility.astro` line 92; also line 142, `src/pages/accessibility/index.astro` line 51 and `src/pages/services/web-design.astro` line 101). If the site gets fixed and deployed before the cut, re-record with `--only C7` (about 40 s). Otherwise end on the H2 or crop above the list.
6. **D2 and D3 show an added outline.** `?reveal=1` draws a plain dark outline and changes the label line to "Test page built for this video. Outline added so you can see where focus is." Keep that line on screen, or caption it, so the reveal is honest.
7. **The demo page fits on one screen.** Nothing scrolls, so the footer jump in D2 is visible in a single frame. The trap swallows Tab, Shift+Tab and Escape inside the signup box; the Sign up button can't be reached from the keyboard.
8. Nothing was typed into Kai and nothing was submitted. The script refuses Enter or Space on submit and chat controls on the live site, and refuses typing anywhere except the local demo page.
9. Only ka-performancefl.com and the local demo page appear. The demo page uses "Sample Business" and a 555 phone number.
