# Shared course previews

## Scope

- Homepage keeps the existing AI orientation video, transcript, playback controls and signup links. Three course cards now make the custom training work visible below that experience.
- Sample introductions use the same course cover and summary as the gallery. The course action appears before optional design and accessibility details.
- Every introduction includes a labeled Close introduction control. View the course, Escape, backdrop dismissal and About this sample remain available.
- Each sample supplies its matching social image to BaseLayout and its LearningResource metadata.
- Course URLs, iframe content, sample navigation, completion hooks and inquiry query parameters are preserved.

## Shared dependency

`src/data/trainingPresentation.js`, `src/components/TrainingCourseCard.astro` and the six cover/social image pairs are owned by the gallery change. Integrate that change before this one.

## Verification

Pending final shared cover assets and browser checks. No production deployment is included.
