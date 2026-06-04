---
title: SEO, MPA and AdSense Readiness + Instant UX Patterns
type: concept
tags: [seo, mpa, adsense, ux, instant, gauge, faq-schema, dark-mode]
sources: [../bmi-research/BMI-CALCULATOR-RESEARCH.md, src/pages/index.astro, src/components/FaqSection.astro + data/faq.ts, astro.config.mjs, LAUNCH-CHECKLIST.md, SETUP.md]
created: 2026-06-04
updated: 2026-06-04
---

# SEO, MPA and AdSense Readiness + Instant UX Patterns

> The dual mandate: best-in-class UX (instant, visual, dark, mobile) + SEO/AdSense structure (MPA, schema, content depth, visible legals, no thin pages). Per research + checklist.

## SEO / MPA / AdSense

- **MPA/SSG**: Astro static output; each page full HTML. Benefits: crawlable, fast TTFB, no JS nav for core (per skill: "No SPA-only").
- **On-page**: 600w+ unique intro on / (what is BMI, how to use, limitations, why this tool + internal links to chart/women/men). Cite WHO/CDC. Category table. Medical disclaimer prominent.
- **FAQ + schema**: 8 items in data/faq.ts rendered + <script type=application/ld+json> in FaqSection. Covers accuracy, children, formula, prime, etc.
- **Supporting pages**: /bmi-chart, /bmi-calculator-for-*, legals (visible on home nav + footer). Internal links.
- **Technical**: sitemap.xml (integration), robots.txt, custom 404, public/ads.txt, _headers (noindex on preview until domain), site: https://realbmicalculator.com in config.
- **AdSense prep**: Privacy/Terms/About/Contact linked visibly (AdSense req), light ads planned (below fold), US first, ~10 users/day threshold before apply. Noindex previews.
- **Keywords**: primary `bmi calculator`; support `bmi calculator for women/men`, `bmi chart`, metric etc. From Ahrefs plan in research.
- **Trust**: limitations section, athlete/age/pregnancy notes, "not substitute".

## Instant UX + Gauge Patterns (Differentiation)

- **Hero calc above fold**: No scroll to interact. Sliders + exact inputs + presets sync live (no submit button).
- **Unit switch**: Sticky-ish toggle kg/cm ↔ lb/ft-in; values auto-convert on switch; persist (localStorage implied).
- **Live gauge + result**: BMI number + colored category + interpretation + healthy range calc + BMI Prime. Marker animates position % on bar (15-40 scale via lib markerPosition).
- **Alerts**: Non-modal banner + full overlay tint (critical red pulse) or inset caution; dismissable. Trigger at <16/>=35 or <17/>=30 per lib.
- **Visuals/3D**: Gallery of body guides + interactive 3D scene (research must-have for "most attractive").
- **Dark mode**: System + toggle; full token flip; premium feel vs ad-heavy competitors (most lack dark).
- **Mobile-first**: Responsive (sm:), touch targets per DESIGN, tested per SETUP.
- **Copy/share?**: Future (research gap vs Omni).
- **Performance**: Client JS only for calc (small), SSG shell.

## Gaps Exploited vs Matrix

- Live result (Omni has, calc.net lacks) + gauge (Omni best, we animate further).
- Dark + mobile primary.
- Rich FAQ schema + limitations + visible legals (many weak).
- Focused (no heavy ads/sidebar clutter).

## Lint / Future

- On ingest of new content: ensure 600w, schema, visible links, disclaimers.
- Related tools later (WHR etc per v2 research).
