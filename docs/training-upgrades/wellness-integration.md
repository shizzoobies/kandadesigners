# Strength and sauna premium integration

The final two sample upgrades follow the approved safety, RFI, finance and nutrition production direction: original illustrations, an illustrated course guide, recorded narration with matching transcripts, purposeful visual practice, and compact layouts.

## Scope

- `/training-samples/strength/`, embedded by `/training/samples/strong-is-a-skill/`.
- `/training-samples/sauna/`, embedded by `/training/samples/heat-done-well/`.
- Shared catalog descriptions in `src/data/training.js`.

Each course is implemented in an isolated worktree. The integration checkout starts from production commit `9ec120b`. Unrelated pages, deployment configuration and the four completed samples remain outside this change.

## Review requirements

- Actual rendered widths of 360, 768 and 1280 pixels, with phone and tablet checks in addition to desktop.
- Artwork inspected in context, meaningful alternatives to multiple-choice quizzes, visible focus and keyboard operation.
- Playback verified against the real local audio assets, including seeking, pause, navigation and recovery from a failed media request.
- Audio and transcripts reserve space below the lesson instead of covering it.
- Complete readable workbook with JavaScript disabled.
- Editing, correcting, restarting and completion reporting checked against user-visible state.
- Current primary guidance supports the health content; teaching examples do not claim personalized clearance or guaranteed outcomes.
- Integrated Astro build, SEO gate and embedded completion messages verified before delivery.

Production records and source references for each course are maintained in its own upgrade document.

## Integrated verification, September 23, 2026

- Both course commits were integrated into `codex/training-premium-wellness` from production `9ec120b`.
- Combined Astro build passed: 43 pages. SEO gate passed: 29 indexable pages and 14 intentionally noindexed pages, including all title and description checks. No separate lint or test scripts are configured.
- Course-level browser evidence covers 360, 768 and 1280 pixel widths, actual playback of all 18 narration clips, keyboard interactions, retry after simulated media failure, restart and workbook checks. See `strength-premium.md`, `sauna-premium.md` and their QA folders for exact coverage and limits.
- Final integrated sauna notebook check at 1280 x 900 with audio and transcript open: zero lesson or horizontal overflow; actual audio ready state 4, playing at 9.67 seconds. Screenshot inspected: `wellness-qa/sauna-notebook-audio.png`.
- Built-site wrappers served from `dist` on port 62145: traversing each course and selecting Finish revealed the correct parent website completion panel for both `strong-is-a-skill` and `heat-done-well`. This verifies the completion event integration, not mastery of skipped practice activities.
- Final integration measurements and visible completion text are recorded in `wellness-qa/integration.json`.
- `git diff --check` passed. No production deployment or push was performed.

Review previews run from the integrated public assets on port 62143 at `/training-samples/strength/` and `/training-samples/sauna/`.
