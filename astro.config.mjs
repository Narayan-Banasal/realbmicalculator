// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://realbmicalculator.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    imageService: 'compile',
  }),
  integrations: [sitemap()],
});