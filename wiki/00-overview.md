# 00 — Project Overview & Goals

## Vision
Real BMI Calculator (realbmicalculator.com) is a **premium, focused, honest free BMI micro-tool**. Instant results, beautiful live gauge + 3D body-type explorer, dark mode, mobile-first, clear educational content, no sign-up walls, AdSense/SEO-ready from day one. Built to beat legacy calculator pages (cluttered, ugly, no dark, poor mobile) and modern ones on clarity + visuals.

## Core Principles (from research + playbook)
- Best-in-class **UX**: instant (no submit), sliders + precise inputs + nudges, live everything (gauge, category, visuals, alerts).
- **Honest education**: limitations of BMI called out prominently, medical disclaimers, healthy ranges, BMI Prime.
- **Retention of knowledge**: Karpathy-style wiki (this folder) + AGENTS.md + DESIGN.md so agents (Grok here) never lose context.
- **SEO + AdSense first**: MPA (full page loads), visible legal links on home, FAQ JSON-LD, long-form content, proper meta, sitemap, noindex on preview domains until custom domain.
- **Domain rule**: Buy **realbmicalculator.com only after local MVP is solid** (per video/playbook). Never before.

## Stack (video + skill aligned)
- Framework: Astro 6 (SSG, static output, MPA)
- CSS: Tailwind CSS v4 via `@tailwindcss/vite` (design tokens in @theme, semantic CSS vars, dark via custom variant)
- Hosting: Cloudflare Pages (free tier)
- Deploy: `wrangler` via `npm run deploy`
- No heavy client frameworks — vanilla TS in scripts for the calculator interactivity (fast, simple, SEO-friendly)
- Analytics: GA4 hook ready (PUBLIC_GA_MEASUREMENT_ID)
- Monetization prep: AdSense (only after ~10 users/day)

## Commands
```bash
npm install
npm run dev          # http://localhost:4321 — always test on phone + desktop
npm run build
npm run deploy       # after npx wrangler login; uses dist/client
```

## Project Rules (from real-bmi-micro-tool skill + AGENTS)
- Before **every** UI or Astro change: Read DESIGN.md, load the 4 skills, consult astro-docs MCP if needed, use frontend-design for polished UI.
- Commit after features (user can discard via source control).
- 600+ words educational content on home.
- Medical disclaimer + limitations section.
- Legal pages linked visibly on homepage (not footer only).
- Target US English audience first.
- **Never**: Buy domain early, apply AdSense day 1, use thin AI content, ship without tables/disclaimers/FAQ schema.

## Current Status (post 2026-06-04 commits)
Local MVP complete: full calculator, unit switch + convert + persist, live gauge + marker, health alerts (caution/critical with overlay), synced gallery + 3D tilt explorer, custom SVGs, dark mode, all SEO pages (chart, women, men, about, contact, privacy, terms), FAQ schema, build/deploy ready, git + this wiki initialized.

See log.md for the exact git/repo + wiki creation session.
