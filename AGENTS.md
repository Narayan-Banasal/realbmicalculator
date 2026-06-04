# Real BMI Calculator — Agent instructions

You are building **realbmicalculator.com** (Real BMI Calculator) using the Compile Future micro-tool method. **Claude Code is not used** — you (Cursor/Grok) implement everything.

## Before every UI or Astro change

1. Read `DESIGN.md`
2. Read `wiki/index.md` (Karpathy-style LLM wiki for retained knowledge) + relevant numbered pages in `wiki/`
3. Load project skills under `.agents/skills/`:
   - `astro`
   - `tailwind-v4-best-practices`
   - `web-design-guidelines`
   - `real-bmi-micro-tool`
4. Use MCP server **`astro-docs`** for Astro documentation lookups
5. Use **`frontend-design`** (global) for polished, non-generic UI

## Project goals

- Best-in-class **BMI calculator** UX (instant results, gauge, dark mode, mobile-first)
- **SEO + AdSense-ready** structure (MPA, legal pages, FAQ schema)
- **Cloudflare Pages** deployment when MVP is done

## Research

See `../bmi-research/BMI-CALCULATOR-RESEARCH.md` for competitor analysis.

## User preference

Narayan will iterate with you here instead of Claude Code. Ask before large scope changes.