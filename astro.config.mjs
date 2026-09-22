import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Paths that are live but deliberately kept out of search: legacy apps, demos
// and client-facing one-offs. They are static files in public/ rather than
// routes, so they would not normally reach the sitemap anyway — this is a
// belt-and-braces guard, and it mirrors the X-Robots-Tag rules in
// public/_headers so the two can't drift apart silently.
//
// scripts/seo-check.mjs parses this array out of this file so the build gate
// skips exactly these paths and nothing else. Keep it a plain array of string
// literals, and keep it in step with public/_headers.
const NOINDEX = [
  '/chess', '/tdgame', '/sky-raider-blitz', '/mosslight-run',
  '/daily-songs-x7k2', '/voicecheck', '/interactives', '/portfolio',
  '/projects', '/mbsfeedback', '/tools', '/internal',
  // The course is gated and noindexed; /free-course/ is the page that ranks.
  '/course', '/course-app',
  // The raw sample builds, iframed by /training/samples/<slug>/, which is the
  // page that should rank. public/_headers already noindexes them; they are
  // listed here so the two lists cannot drift.
  '/training-samples',
  // The print source of the capabilities one-pager. It duplicates /training/,
  // and public/_headers noindexes it, but that rule is /training/capabilities/*
  // which never matched the slashless URL, and the page sat in the sitemap at
  // the same time: a noindexed page asking to be crawled. It now carries a
  // <meta name="robots"> of its own as well.
  '/training/capabilities',
];

export default defineConfig({
  site: 'https://ka-performancefl.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // The previous sitemap was hand-written and rotted: it pointed at
      // /artists/artist-one/ and /artists/artist-two/, which 404, while the
      // three real artist pages were missing entirely. Generating it means
      // adding a page is enough — the sitemap can't fall behind again.
      filter: (page) => {
        const path = new URL(page).pathname;
        if (path.startsWith('/404')) return false;
        return !NOINDEX.some((p) => path === p + '/' || path.startsWith(p + '/'));
      },
    }),
  ],
  vite: { plugins: [tailwindcss()] },
});
