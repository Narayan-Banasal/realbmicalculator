// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bmiresult.com',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hi', 'es', 'fr'],
    routing: {
      prefixDefaultLocale: false, // English stays at /, others get /hi/ /es/ /fr/
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    imageService: 'compile',
  }),
  integrations: [sitemap({
    filter: (page) => !page.includes('/embed'),
    i18n: { defaultLocale: 'en', locales: { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR' } }
  })],
});