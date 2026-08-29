import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Paths that are live but deliberately kept out of search: legacy apps, demos
// and client-facing one-offs. They are static files in public/ rather than
// routes, so they would not normally reach the sitemap anyway — this is a
// belt-and-braces guard, and it mirrors the X-Robots-Tag rules in
// public/_headers so the two can't drift apart silently.
const NOINDEX = [
  '/chess', '/tdgame', '/sky-raider-blitz', '/mosslight-run',
  '/daily-songs-x7k2', '/voicecheck', '/interactives', '/portfolio',
  '/projects', '/mbsfeedback', '/tools', '/internal',
  // The course is gated and noindexed; /free-course/ is the page that ranks.
  '/course', '/course-app',
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
