import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ka-performancefl.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
