# RFI premium production

The nine-screen course is rebuilt as an illustrated construction review desk. It retains the existing route and completion message while replacing conventional quiz choices with document investigation and request assembly.

## Assets and experience

- Two original optimized WebP illustrations: architectural review desk and construction guide, matching the safety guide character.
- Nine prerecorded Bella introductions generated from `public/training-samples/rfi/narration.js`, with the same text displayed as transcripts.
- A bottom audio tray reserves layout space. Custom playback, replay, seeking, mute and fold controls remain outside the lesson. The guide's status follows real playback events.
- Drawing and submittal comparison, evidence attachment, a fragment carousel with keyboard placement, review feedback and a downloadable checklist.
- Private reflection stays in the page. Restart clears practice, feedback and audio state.
- Static instructional coverage remains available with JavaScript disabled.

The fictional slab details are explicitly not for construction. RFI instruction distinguishes clarification from authorization for changes in scope, cost or time. Source reviewed: https://help.aiacontracts.com/hc/en-us/articles/1500009325281-Instructions-G716-2004-Request-for-Information-RFI

## Verification

- Browser checks covered all nine lessons at 360x800, 768x1024 and 1280x900. No horizontal overflow or broken images. Tablet and desktop lessons fit without internal scrolling when audio is closed.
- A second 1280x720 check found no internal scrolling on any lesson with audio closed.
- Phone lessons use the reserved scrolling lesson pane. Long reading sections still require vertical scrolling on phones.
- All nine local audio clips reached readyState 4 and advanced during actual browser playback. Seeking, mute, pause on navigation, transcript folding and Escape were exercised.
- After compacting the open-audio layout, the assignment and closing lessons were rechecked at 1280x900 with zero lesson overflow. Other lesson/audio combinations had already passed at that size.
- Keyboard tabs, incorrect and corrected evidence/fragment placements, successful assembly, handoff exploration, completion, Escape and full restart were exercised. Browser console inspection returned no errors or warnings.
- Independent review prompted fixes for retrying failed media, static fallback coverage and invalid-field feedback retention.
- Node syntax checks cover the application, narration and audio generator. The integrated Astro build passed using its local CLI with telemetry disabled. No lint or test package scripts exist.

Evidence is stored in `rfi-qa/`. The layout report records measured viewports, not requested sizes alone. The original audio report precedes the two final compact-layout rechecks noted above.

## Integration and release

The existing completion event uses type `ka-sample-complete` and slug `rfi-that-gets-answered`. The built site viewer was checked separately alongside finance and nutrition; see `combined-viewer-checks.json`.

These changes are local and have not been deployed. This development branch predates newer live-site work. For a future release, integrate the scoped course commits onto current production history rather than deploying this entire checkout.

Secrets remain in the ignored local `.dev.vars` file. The generation script reads that file; public assets contain prerecorded audio only.
