// Serves the parked Launch Book.
//
// It used to live at public/launch-book.html, which put it in ./dist and made
// it a static asset. Static assets are served by the assets binding before any
// Worker code runs, so the middleware never saw a request for it: on the
// workers.dev hostname, where Cloudflare Access does not apply either, the page
// answered 200 to anyone who guessed the URL, commercial terms and all.
//
// Serving it from src/ through this route puts it behind the same deny-by-
// default middleware as every other page, on every hostname, which is a
// property of the code rather than of one Cloudflare setting. wrangler.jsonc's
// workers_dev is now false too; either alone would have closed this, and both
// together mean a future hostname cannot reopen it.
//
// The document is inlined verbatim at build time with Vite's ?raw so the file
// keeps its own <script> and <style> and is not put through Astro's compiler.
import html from '../launch-book.html?raw';

export async function GET() {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Never let a shared cache hold a page of client commercial terms.
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
