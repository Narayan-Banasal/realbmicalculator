---
title: Astro Pages and Routing
type: entity
tags: [pages, routing, mpa, seo, legal]
sources: [src/pages/, src/layouts/BaseLayout.astro, src/components/ProsePage.astro, index.astro, astro.config.mjs]
created: 2026-06-04
updated: 2026-06-04
---

# Astro Pages and Routing

> MPA (multi-page app) structure for SEO — every route a full static page load. Matches research blueprint and Astro SSG best practices.

## Structure

```
src/
├── pages/
│   ├── index.astro                 # Hero calc + intro (600w+) + quick categories + disclaimer + legals nav (visible)
│   ├── bmi-chart.astro
│   ├── bmi-calculator-for-women.astro
│   ├── bmi-calculator-for-men.astro
│   ├── about.astro
│   ├── contact.astro
│   ├── privacy-policy.astro
│   ├── terms.astro
│   └── 404.astro
├── layouts/
│   └── BaseLayout.astro            # <html>, head (title/desc/meta), body, Header, main, Footer
└── components/
    └── ProsePage.astro             # Wrapper for content pages (legal/about)
```

- **Routing**: File-based. / = index, /bmi-chart etc. No client router (Astro MPA rule from skill).
- **Legal visibility**: On homepage (and footers) — Privacy, Terms, About, Contact links. Required for AdSense + trust.
- **Supporting content**: /bmi-chart (static table), gender-specific (tailored copy), formula implied in content.
- **404**: Custom.
- **Integrations**: @astrojs/sitemap auto from config site URL; noindex _headers for *.pages.dev pre-domain.

## Cross-refs

- See [[SEO, MPA and AdSense Readiness]] for why MPA + schema.
- Entities feed into [[Project Overview]].
- Components used across pages (BmiCalculator only on index currently).
