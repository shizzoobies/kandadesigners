# Hazard recognition artwork

Created with the built-in image-generation tool on September 22, 2026.

The scene is a fictional construction site for an inspection exercise. It intentionally includes unsafe conditions. It does not document a real site or client.

Web asset: `public/training-samples/safety/assets/img/jobsite-inspection-v2.webp`.

Original generated PNG is retained in the local generation folder. The web version is resized and encoded as WebP with the existing Sharp dependency, with no compositing or visual retouching.

## Generation prompt

Use case: scientific-educational.
Asset type: high-resolution landscape illustration for an interactive construction hazard-recognition course. Create ONE coherent premium editorial architectural cutaway illustration, approximately 3:2 landscape, no panels or collage. The fictional two-story commercial construction site is viewed straight-on from slightly above, close enough that safety details are plainly visible. Warm off-white sky, concrete structure, graphite steel, muted warm gray materials, restrained ochre safety equipment, natural daylight and subtle realistic textures. Crisp architectural visualization with convincing geometry and clean readable silhouettes, not cartoon clip art. No interface, no text except a small accurate green EXIT sign.
Compose exactly these six teaching situations distinctly, with enough space between them:
1. At the FAR RIGHT, a portable straight ladder leans against the second-floor landing, stops flush at the landing without extending above it, and has no tie at the top.
2. UPPER CENTER, the front edge of the second-floor deck has a clear missing guardrail section. Remaining guardrail to the left makes the gap unambiguous.
3. LOWER LEFT foreground, a bright orange extension cord crosses the pedestrian walkway through a visible shallow puddle.
4. LOWER CENTER LEFT, wood offcuts and debris obstruct an open ground-floor doorway.
5. LOWER CENTER, one adult worker in orange high-visibility vest and work boots but no hard hat stands directly below overhead work. A second properly equipped worker above is behind intact guardrails and wears a yellow hard hat.
6. LOWER RIGHT but LEFT OF THE LADDER, stacked concrete blocks obstruct a separate green EXIT-marked ground-floor door.
Keep all six situations fully within the image, none occluded, with a large enough bareheaded worker to recognize. Calm minimal background, no vehicles, cranes or extra people. No injury, no dramatic danger. This is an intentional unsafe-condition inspection exercise. Avoid extra decorative clutter, nonsensical geometry, illegible signs, floating objects and additional unplanned hazards. Render the entire building and foreground with margins for responsive display.

## Implementation

The cover and hazard hunt share this scene. HTML hotspots are positioned against its intrinsic 3:2 ratio, with equivalent labeled buttons, announced feedback, optional location outlines and a larger inspection dialog. Instructional text and all controls remain real HTML.

The scene is synthetic. The original course's safety claims and site-specific-program disclaimer still apply. Technical review of the final lesson and image remains a publication gate.

## Tab illustrations

The nine topics on screens 4 through 6 now have individual vector inspection details, replacing the tall decorative photographs. These are code-authored SVG diagrams with graphite backgrounds, warm gold inspection points and muted blue route arrows. Each has a text alternative and a visible HTML takeaway. They illustrate the existing lesson rather than functioning as installation drawings or equipment specifications.

Source: `scripts/create-safety-topic-art.mjs`. Output: `public/training-samples/safety/assets/img/topic-4a.svg` through `topic-6c.svg`. Run the script to regenerate the editable SVGs. No image-generation service was used for these technical diagrams.
