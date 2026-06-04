---
name: real-bmi-micro-tool
description: Build and deploy the Real BMI Calculator micro-tool site (realbmicalculator.com) using the Compile Future / micro-SaaS playbook. Use whenever working on this project—Astro, Tailwind v4, Cloudflare Pages, SEO, AdSense prep, or BMI calculator features. Replaces Claude Code; the Cursor/Grok agent is the implementer.
---

# Real BMI Calculator — Micro-tool playbook

**Domain:** `realbmicalculator.com`  
**Brand:** Real BMI Calculator  
**Agent:** Cursor/Grok (not Claude Code)

## Required context before coding UI

1. Read `DESIGN.md` in project root (Vercel design system).
2. Apply skills: `astro`, `tailwind-v4-best-practices`, `web-design-guidelines`.
3. Use **Astro Docs MCP** (`astro-docs`) for current Astro APIs.
4. Prefer **frontend-design** skill for distinctive, non-generic UI.

## Stack (video-aligned)

| Layer | Choice |
|-------|--------|
| Framework | Astro (SSG, MPA — full page loads per route) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` |
| Hosting | Cloudflare Pages (free) |
| Deploy | `wrangler` / `npm run deploy` |
| Analytics | Google Analytics |
| Monetization | Google AdSense (after ~10 users/day) |

## Build order

1. **Local MVP** — calculator + dark mode + mobile + result gauge (no domain purchase yet).
2. **SEO pages** — Privacy, Terms, About, Contact, FAQ + JSON-LD.
3. **Technical** — `sitemap.xml`, `robots.txt`, custom 404, `_headers` noindex for `*.pages.dev`.
4. **Deploy** — Cloudflare Pages → connect domain → Search Console + Bing.
5. **AdSense** — only after traffic threshold.

## Astro rules

- Use `astro add tailwind` for Tailwind v4.
- **No SPA-only** navigation; multi-page app for SEO.
- Use `astro add cloudflare` when deploying.
- Consult Astro MCP before using experimental or deprecated APIs.

## SEO checklist (do not skip)

- [ ] 600+ words on homepage
- [ ] Main keyword: `bmi calculator`
- [ ] FAQ from Ahrefs Questions + People Also Ask
- [ ] Legal links visible on homepage (not footer-only)
- [ ] Medical disclaimer
- [ ] Target US English audience first

## Git discipline

Commit after each feature (`added FAQ`, `seo`, `dark mode`, etc.). User can discard bad AI changes via VS Code Source Control.

## What NOT to do

- Do not buy domain until local site works.
- Do not apply AdSense on day one.
- Do not use `.net` or hyphens for this brand.
- Do not ship thin AI-only content without tables, limitations, and FAQs.

## Competitor bar

Beat Omni Calculator UX (live gauge) + Calculator.net content depth. Research in `../bmi-research/`.