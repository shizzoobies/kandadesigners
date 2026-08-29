// The free course's chapters. Each is a self-contained interactive page
// under /course-app/assets/<dir>/, originally built as Mighty blocks for
// the Rise export and untouched here; the native shell just frames them.
// Order and grouping mirror the original course; "Building in Rise" is
// relabeled for this site's audience, content unchanged.
export const sections = [
  { title: 'Welcome', slugs: ['introduction'] },
  { title: 'Getting started', slugs: ['install', 'sign-in', 'first-request', 'connect'] },
  { title: 'Using Claude Code', slugs: ['build-a-website', 'build-a-lesson', 'build-an-app'] },
  { title: 'Wrap up', slugs: ['recap'] },
];

export const chapters = [
  {
    slug: 'introduction',
    dir: 's0-welcome',
    title: 'Introduction',
    blurb: 'What this course is, and the assistant that rides along.',
  },
  {
    slug: 'install',
    dir: 's1-install',
    title: 'Installing Claude Code',
    blurb: 'Get it onto your machine without a wrong turn.',
  },
  {
    slug: 'sign-in',
    dir: 's2-auth',
    title: 'Starting it for the first time',
    blurb: 'The one-time sign in, on your own account.',
  },
  {
    slug: 'first-request',
    dir: 's3-orientation',
    title: 'Your first request',
    blurb: 'Ask for something real and watch what happens.',
  },
  {
    slug: 'connect',
    dir: 's4-connect',
    title: 'Connecting your tools',
    blurb: 'Point it at the files and services you already use.',
  },
  {
    slug: 'build-a-website',
    dir: 's5-build-website',
    title: 'Building a website',
    blurb: 'A real one-page site from a prompt, generated live.',
  },
  {
    slug: 'build-a-lesson',
    dir: 's6-build-scorm',
    title: 'Building a training interaction',
    blurb: 'An interactive lesson, the kind a course designer ships.',
  },
  {
    slug: 'build-an-app',
    dir: 's7-app',
    title: 'Building an app instead',
    blurb: 'When the answer is not a website at all.',
  },
  {
    slug: 'recap',
    dir: 's8-recap',
    title: 'Recap',
    blurb: 'What you built, and where to take it next.',
  },
];

export const chapterBySlug = (slug) => chapters.find((c) => c.slug === slug);
export const chapterIndex = (slug) => chapters.findIndex((c) => c.slug === slug);
