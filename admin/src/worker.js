// Custom Worker entry: Astro's fetch plus a scheduled handler for desk push.
// Wired through the Cloudflare adapter's workerEntryPoint. createExports is
// the Astro 5 / @astrojs/cloudflare v12 contract.
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler';
import { runDeskPush } from './lib/desk-push.js';

export function createExports(manifest) {
  const app = new App(manifest);
  return {
    default: {
      async fetch(request, env, ctx) {
        return handle(manifest, app, request, env, ctx);
      },
      async scheduled(controller, env, ctx) {
        const now = controller?.scheduledTime ?? Date.now();
        const summary = await runDeskPush(env, { now });
        console.log(JSON.stringify({ event: 'desk.push', ...summary, cron: controller?.cron ?? null }));
      },
    },
  };
}
