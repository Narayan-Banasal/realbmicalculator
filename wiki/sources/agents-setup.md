---
title: Agents Schema, Setup and Checklists
type: source
tags: [schema, agents, setup, checklist, skills]
sources: [AGENTS.md, SETUP.md, LAUNCH-CHECKLIST.md, README.md, .agents/skills/real-bmi-micro-tool/SKILL.md, .agents/skills/astro/SKILL.md, astro.config.mjs]
created: 2026-06-04
updated: 2026-06-04
---

# Agents Schema, Setup and Checklists

> Core schema (AGENTS.md) + current setup status + launch gates. This is the "schema" layer per Karpathy spec — tells the LLM how to behave on this project (like CLAUDE.md).

## What These Sources Cover

- **AGENTS.md**: "You are building realbmicalculator.com using the Compile Future micro-tool method. **Claude Code is not used** — you (Cursor/Grok) implement everything." Before every UI/Astro change: 1. Read DESIGN.md 2. Load .agents/skills/ (astro, tailwind-v4-best-practices, web-design-guidelines, real-bmi-micro-tool) 3. Use astro-docs MCP 4. Use frontend-design (global). Project goals: best-in-class BMI UX (instant, gauge, dark, mobile-first); SEO + AdSense-ready (MPA, legal, FAQ schema); Cloudflare Pages. Research ref to ../bmi-research/. User pref: Narayan iterates here; ask before large scope.
- **SETUP.md**: Status MVP ready locally (June 2026). Done: skills, DESIGN, Astro MCP, Astro6+Tailwind4+CF+sitemap, full site+calc+dark, legals+FAQ schema, robots/_headers/ads/404, build, git. Next: dev test on phone, wrangler login, deploy, buy domain after, follow LAUNCH.
- **LAUNCH-CHECKLIST.md**: Use before domain/AdSense. Env checks, site features (calc metric+us instant gauge, dark, mobile, privacy/terms/about/contact, FAQ schema, chart/women/men pages, 404, robots, sitemap, _headers noindex, ads.txt, build/deploy scripts). Post-local: wrangler, deploy, domain buy (only after preview), CF connect, GSC/Bing, GA, promote, AdSense after ~10u/d.
- **README.md**: Project blurb, commands (npm install/dev/build/deploy), Docs links (SETUP, LAUNCH, AGENTS, DESIGN, ../bmi-research), domain rule.
- **.agents/skills/**: real-bmi-micro-tool/SKILL.md (detailed playbook: stack Astro SSG MPA, no SPA nav, SEO checklist, git discipline, competitor bar Omni+calc.net, what not to do). astro/SKILL.md (general Astro CLI, pages= routes, components, adapters incl cloudflare, consult docs.astro.build + MCP). Others: tailwind v4 (tokens @theme, no @apply, semantic, OKLCH, v3→v4 renames), web-design-guidelines (Vercel web-interface-guidelines review via fetch).
- **astro.config.mjs**: site: 'https://realbmicalculator.com', output static, vite tailwindcss plugin, adapter cloudflare({imageService:'compile'}), sitemap integration.

## Key Takeaways

- Always follow before-change ritual; no skipping DESIGN or skills load.
- MVP is locally complete per SETUP/LAUNCH (as of bootstrap date); focus now on polish/deploy/domain/SEO.
- Wiki/ is now part of retained knowledge (see updates to AGENTS/README).
- Human curates sources (these mds + research dir); LLM maintains wiki synthesis.
