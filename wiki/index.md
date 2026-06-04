---
title: Wiki Index
type: index
updated: 2026-06-04
---

# Real BMI Calculator Wiki — Karpathy LLM Style

**Follows Karpathy's LLM Wiki pattern** (high-signal, synthesized knowledge for LLM/agent sessions, explicit navigation, update-on-change discipline). See also the forma-3d-theme and Dhan* wikis in sibling projects for the exact convention used here.

> Master catalog. **Always read this + relevant pages first** before any code/UI change. This retains "the knowledge which I [Narayan] am providing" across iterations.

**Project:** realbmicalculator.com (free, best-in-class BMI micro-tool)  
**Playbook:** Compile Future micro-tool (Astro MPA + Tailwind v4 + Cloudflare Pages)  
**Agent:** Grok/Cursor (per AGENTS.md — **not** Claude Code)

---

## Quick Navigation

- [00 — Overview & Goals](00-overview.md) — Vision, stack, commands, domain, build order, what NOT to do.
- [01 — Architecture & Code](01-architecture.md) — Full pages list, components, scripts, lib/bmi, data flow, events, layouts.
- [02 — Design, Implementation & SEO](02-design-implementation.md) — Theming (DESIGN.md application), calculator UX details, visuals/3D, alerts, legal/SEO/AdSense prep, configs, public assets.
- [03 — Research & Benchmarks](03-research.md) — Competitor analysis summary from `../bmi-research/`, gaps exploited, keyword strategy.
- [log.md](log.md) — Chronological operations/decisions log (this session + future).

## How to Use This Wiki (LLM Discipline)
- **Start here** on every new session or before changes.
- Read DESIGN.md + the 4 skills under `.agents/skills/` (as required by AGENTS.md) **in addition to** relevant wiki pages.
- Update the wiki (especially log.md + the affected numbered doc) when you make significant decisions, new features, refactors, or receive new knowledge from Narayan.
- Keep entries high-signal, synthesized, actionable for future agents. Use tables, lists, cross-refs.
- The root `WIKI.md` is a legacy flat mirror/pointer — prefer `wiki/` for the structured version.

**Status (as of latest commit):** Local MVP complete and delightful. See log.md for git/repo init details from this session. Build passes, 9 pages, full interactive + visuals + dark + SEO pages.

Last major wiki refresh: 2026-06-04 (git init + .gitignore + full state commit + creation of this Karpathy-style wiki per user request).

---

## Core Links (always load these too)
- `AGENTS.md` (strict process)
- `DESIGN.md` (visual language — read before every UI change)
- `../bmi-research/BMI-CALCULATOR-RESEARCH.md`
- `LAUNCH-CHECKLIST.md` + `SETUP.md`
- `README.md`

See also the project skills for playbook details.

---

**This wiki exists to retain context perfectly.** When Narayan provides new instructions, research, preferences, or "carpathy" style notes, synthesize into the appropriate page + log immediately.
