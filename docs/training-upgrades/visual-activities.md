# Visual practice activities

The old multiple-choice sets on screens 8 and 9 are replaced by two visual tasks. The six control scenarios and eight inspection scenarios retain the lesson's reviewed conditions and explanations.

## Control workbench

Learners place practical controls on six illustrated situations, one situation at a time. Previous/Next situation buttons and a named selector make every placement revisitable. The selector marks placed, matched and revisit states without decorative numbering. Selecting a control and selecting a destination works with touch, mouse, Enter and Space. Desktop users can also drag a control from the adjacent toolkit onto the situation. A control can occupy only one situation; moving it onto an occupied card swaps placements or returns the displaced control to the rack.

On phones, Open toolkit replaces the situation with the six controls. Choosing one restores the situation and focuses its placement area. This avoids stacking the toolkit beneath the card. Concise tool names keep the inventory readable; accessible labels and the selected placement retain the full action description.

Review requires six placements. Until a complete plan is submitted, it earns no scored credit. Feedback identifies placements to revisit and explains the hierarchy level for matched controls. Each explanation expands on request instead of making the whole board taller. Editing a submitted plan invalidates the old grade until it is reviewed again. Browsing situations preserves placements and grades. Removing, revisiting and clearing placements are supported.

## Inspect before release

Learners open eight locations to read field notes, then mark the places where work must be held. The board keeps inspected and hold states visible. Notes receive focus when opened, and Return to locations brings focus back to the selected location.

Review requires inspection of all eight locations. The four scenarios requiring holds are the wet walkway, delivery edge, overhead work and emergency exit. Unmarked locations earn credit only when the full inspection is submitted. Feedback covers every location, and changed holds invalidate the prior grade. Opening notes alone does not erase a submitted result.

## Implementation

- `activity-data.js`: trusted local scenarios, actions and feedback.
- `activities.js`: activity state, rendering, interaction, feedback, scoring and reset.
- `app.js`: completion tally adapter and existing course navigation.
- `premium.css`: responsive boards and controls.
- `scripts/create-safety-activity-art.mjs`: generates the 14 editable SVG sketches; some reuse earlier lesson diagrams.
- `index.html`: activity containers and static worked examples for all 14 scenarios when JavaScript is disabled.

The drawings are schematic. Written evidence supplies conditions that an image alone cannot establish, including verification of electrical isolation and cover load capacity. Existing optional introductions still describe choosing controls and deciding whether work can continue; they do not name the old multiple-choice buttons.

The workbench is designed to fit standard desktop and phone viewports in its placement and collapsed-review states. Expanded explanations, the open audio tray and enlarged text may need scrolling. The inspection board still allows internal scrolling to keep its locations and evidence readable.

## Verification

The focused safety regression suite covers incomplete submissions, wrong answers, correction, swaps, removal, drag placement, keyboard and touch alternatives, visible reverse keyboard focus, grade invalidation, full completion scores and restart. It also checks all 14 static fallback scenarios with JavaScript disabled. Browser evidence is saved under `output/playwright/safety-upgrade/`.

Native drag uses a settled destination scroll and fresh pointer coordinates. Actual dragstart and drop events are asserted. The revised regression also checks case navigation, phone toolkit focus, explanation disclosure, saved grades and workbench overflow in empty, placed and reviewed states.

Final built-site run after the single-situation redesign: 2,724 checks passed across all five viewports, including the phone toolkit and short desktop fit checks. Zero failures, axe violations in tested states, runtime errors or failed assets.
