---
title: Wiki Index
type: index
updated: 2026-06-05
---

# Real BMI Calculator Wiki — Index

> **Master catalog of all wiki pages. LLM (and humans) read this first to navigate the persistent knowledge base.** Follows Karpathy LLM Wiki pattern (raw sources → wiki synthesis layer → AGENTS.md schema).

**Recent:** Initial wiki bootstrap (2026-06-04) from project docs, research, src, skills. Minimal AGENTS.md + README.md updates to reference wiki/. See [[Operations Log]].

---

## Sources

| Page | Summary |
|------|---------|
| [[Design and Research Sources]] | Synthesis of DESIGN.md (Vercel-inspired tokens + overview), ../bmi-research/BMI-CALCULATOR-RESEARCH.md (competitor matrix, UX gaps, keyword strategy, MVP scope, site architecture), implemented tokens in global.css, and visual direction from research. |
| [[Agents Schema, Setup and Checklists]] | Key from AGENTS.md (agent rules, before-change protocol, project goals, user pref), SETUP.md (MVP status), LAUNCH-CHECKLIST.md (pre-AdSense items), README.md (commands, docs), .agents/skills/ (real-bmi-micro-tool, astro, tailwind, web-design), astro.config. |

## Entities

| Page | Summary |
|------|---------|
| [[Astro Pages and Routing]] | MPA structure under src/pages/ (index + supporting: bmi-chart, for-women, for-men, about, contact, privacy-policy, terms, 404), layouts/BaseLayout, legal nav visible on home for AdSense/SEO. |
| [[UI Components and Visuals]] | Components: BmiCalculator.astro (sliders, unit toggle, live results, real photo body viz reactive to height+weight), FaqSection, Header, Footer, ProsePage; data/faq.ts; scripts for interactivity. (Old gallery/scene 3D components removed.) |

## Concepts

| Page | Summary |
|------|---------|
| [[Design System and Tokens]] | Active tokens in @theme (global.css): fonts (DM Sans body, Fraunces display), colors (ink #0f172a, accent mint #10b981, surface, hairline, category colors), dark mode (.dark variant + body class), from research "clinical clarity" + DESIGN.md reference (Vercel mesh gradient, Geist, spacing, components). |
| [[SEO, MPA and AdSense Readiness]] | MPA/SSG for SEO (Astro), sitemap, robots, _headers, ads.txt, FAQ + JSON-LD in FaqSection, 600w+ content + limitations + disclaimers on home, legal pages linked visibly, keyword targets from research, Cloudflare Pages deploy, US English first. |

## Synthesis

| Page | Summary |
|------|---------|
| [[Project Overview]] | End-to-end: best-in-class instant BMI UX (gauge, dark, mobile), SEO+AdSense structure, Compile Future micro-tool (Astro+Tailwind4+CF), current MVP local-ready (June 2026), research-backed differentiation vs Omni/calculator.net. |
