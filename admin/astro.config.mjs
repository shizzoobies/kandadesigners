import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  // This app has no use for Astro sessions: Cloudflare Access owns identity and
  // every write is a form POST plus redirect. Left alone, the adapter would
  // auto-configure Workers KV and expect a "SESSION" binding that does not
  // exist, which is a latent runtime failure. It only does that when
  // session.driver is unset (see adapter dist/index.js: `if (!session?.driver)`),
  // so naming a driver here keeps KV out of the picture entirely.
  // `session: false` is the documented way to switch this off but Astro 5.18.2
  // rejects it: its schema requires an object.
  session: { driver: 'memory' },
  adapter: cloudflare({
    // Gives `astro dev` the real bindings (local D1, vars) from wrangler.jsonc,
    // so local development matches production without a separate dev server.
    platformProxy: { enabled: true },
  }),
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
});
