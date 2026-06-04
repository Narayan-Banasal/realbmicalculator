---
title: Project Overview
type: synthesis
tags: [overview, goals, status, stack, differentiation, roadmap]
sources: [AGENTS.md, ../bmi-research/BMI-CALCULATOR-RESEARCH.md, SETUP.md, LAUNCH-CHECKLIST.md, DESIGN.md, src/, .agents/skills/real-bmi-micro-tool/SKILL.md, astro.config.mjs]
created: 2026-06-04
updated: 2026-06-04
---

# Project Overview

> Synthesis: Real BMI Calculator (realbmicalculator.com) is a focused, premium, instant-feedback BMI micro-tool built with the Compile Future playbook. Goal: best-in-class UX + SEO/AdSense-ready MPA that compounds knowledge via this wiki.

## Core Identity & Goals (AGENTS + skill)

- **Domain/Brand**: realbmicalculator.com — "Real" signals honest, no-gimmick (vs thin calc sites).
- **UX Mandate**: Instant results (no submit), live gauge + marker, dark mode, mobile-first, sliders+precise+presets, category color + healthy range + BMI Prime + alerts + visuals/3D + educational content. "Most attractive" per research gaps.
- **SEO + Monetization**: MPA (Astro SSG), 600w+ prose + table + FAQ JSON-LD + limitations + disclaimers + visible legals (Privacy/Terms/About/Contact on home), sitemap/robots/404/headers/ads.txt. Target US English for AdSense CPM. Apply AdSense only after ~10 users/day. Cloudflare Pages free hosting.
- **Non-goals (yet)**: No account, no server calc, children separate (link to CDC), no heavy ads day one, no domain buy until local MVP solid.

## Stack (video + skills aligned)

- Astro (static MPA, pages=routes, sitemap, cloudflare adapter).
- Tailwind v4 (@theme semantic tokens, vite plugin).
- Vanilla TS/JS for calc (lib/bmi.ts pure + script).
- Git + wrangler deploy.
- Skills + astro-docs MCP + DESIGN read ritual.
- Wiki/ (this) for persistent LLM-maintained knowledge (index first, then drill; git mds).

## Current Status (SETUP June 2026)

- **MVP local ready**: Full calculator (metric/US instant gauge), dark mode, responsive, legals + FAQ schema, chart + women + men pages, 404, robots, _headers, ads.txt, sitemap, build/deploy scripts pass.
- **Research-backed**: Competitor matrix (beat Omni UX + calc.net content), exact formulas, content checklist done, promotion plan.
- **Design**: Research-tuned tokens (mint accent on slate, Fraunces+DM Sans) + DESIGN reference discipline. Alerts, 3D scene, gallery implemented.
- **Not yet**: Deployed/preview tested with wrangler, domain purchased, GSC, GA, AdSense, traffic.

## Differentiation & Why It Wins

- Clutter-free hero calc (unlike calculator.net ad-heavy).
- Dark + premium clinical aesthetic + motion (few competitors have).
- Honest limitations + rich schema + internal hub pages (trust + SEO).
- Instant + visual (gauge, 3D, gallery) + copy-friendly.
- Micro-tool discipline: small scope, high polish, SEO foundation before scale.

## Roadmap (from research + checklist)

- v1: Local MVP (done) → deploy CF → domain → GSC/Bing → promote (Reddit r/fitness etc) → AdSense threshold.
- v2: Child BMI, more tools (ideal weight, WHR), i18n (ES), deeper content.
- Wiki maintenance: ingest new research/feedback, lint for contradictions/staleness, file queries back as synthesis pages.

## Wiki Role

This wiki/ is the compounding layer: sources (immutable refs), entities (pages/components), concepts (design/ux/seo), synthesis (overview). LLM maintains; updates index + log on changes. Read index.md first for any query.

**Status at bootstrap**: All core knowledge from current files synthesized into 9 wiki pages. Ready for future ingests (e.g. competitor re-audit, post-launch metrics, new features).
