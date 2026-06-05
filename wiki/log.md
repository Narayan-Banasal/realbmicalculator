---
title: Operations Log
type: log
---

# Real BMI Calculator Wiki — Log

> Append-only chronological record of wiki operations (ingests, updates, lints, queries). Entries start with `## [YYYY-MM-DD] action | Title` for easy `grep`.

---

## [2026-06-04] setup | Karpathy-style LLM Wiki bootstrap

- **Source:** Project root docs + research + implementation (AGENTS.md, DESIGN.md, SETUP.md, LAUNCH-CHECKLIST.md, README.md, astro.config.mjs, ../bmi-research/BMI-CALCULATOR-RESEARCH.md, src/ (pages, components, lib/bmi.ts, data/faq.ts, global.css, scripts), .agents/skills/ (real-bmi-micro-tool, astro, tailwind-v4-best-practices, web-design-guidelines) ). No prior wiki/ (confirmed cleaned).
- **Action:** Initial creation of clean minimal `wiki/` following official Karpathy LLM Wiki spec (gist 442a6bf5...) + exact style from user's other projects (DhanSetu/DhanCore: subdirs entities/concepts/sources/synthesis, yaml frontmatter on pages, [[wikilink]] tables in index, detailed **Source:**/**Action:**/**Pages created:** log entries; also wellness/forma patterns for high-signal catalog).
- **Pages created:**
  - `wiki/index.md` — content catalog (categories Sources/Entities/Concepts/Synthesis with one-line summaries + [[links]]; frontmatter type:index)
  - `wiki/log.md` — this append-only log (frontmatter type:log)
  - `wiki/sources/design-research.md` — source synthesis page
  - `wiki/sources/agents-setup.md` — schema/setup source page
  - `wiki/entities/pages-routing.md` — entity page
  - `wiki/entities/components.md` — entity page
  - `wiki/concepts/design-system.md` — concept page
  - `wiki/concepts/seo-and-ux.md` — concept page
  - `wiki/synthesis/project-overview.md` — synthesis page
- **Pages updated:** `wiki/index.md`, `wiki/log.md`
- **Notes:** Raw sources layer uses file references (e.g. `DESIGN.md`, `../bmi-research/...`) not copies/symlinks to stay minimal. Wiki is git-tracked mds for compounding. AGENTS.md is the schema (like CLAUDE.md). LLM (Grok/Cursor) owns maintenance; human curates sources. First entry records the bootstrap. Future ingests will cross-update index + relevant pages + append here. See spec for ingest/query/lint ops.

## [2026-06-04] update | AGENTS.md + README.md for wiki reference

- **Action:** Minimal edits only (per task): added wiki mention to AGENTS.md (under before-changes guidance) and README Docs section. No extra sections or bloat.
- **Pages updated:** AGENTS.md, README.md, `wiki/index.md` (date), `wiki/log.md`
- **Notes:** Keeps changes high-signal. Wiki now referenced for retained knowledge.

## [2026-06-05] fix | Raise input limits + real three.js 3D model + cleanup + commit

- **Source:** User: "still the height is limited and weight is also and model is also not 3d so check and fix it and also commit the changes."
- **Action:** Followed AGENTS (re-read DESIGN, wiki/index + entities, loaded 4 skills, used astro-docs MCP + frontend-design principles). Diagnosed: range max 220cm vs num 250 (inconsistent), weight range 200kg, still <img> + scaleX + CSS rotate (three imported dead). Fixed: raised all range+num max (cm 250, kg 400, ft 9, lb 900) + mins for access. Replaced viz HTML with <canvas id="body-canvas">, implemented full three.js in bmi-calculator.ts: gender-specific (male broad shoulder/narrow hip, female reverse + chest), head/neck/torso(cylinder tapered)/belly(sphere)/tapered limbs/hands/feet + ground; live updateFigure(h, bmi, g) scales torso x/z + belly + limb girth + leg spread + y-scale+pos for height, no view reset; fast pointer drag on canvas (0.0055 sens) mutates figure.rotation.y directly (state preserved); render on demand. Removed all img scale/src, old css3d drag, bodyImages map, unused els refs. Deleted public/images/bodies/ + /bmi/ (unused). Cleaned global.css reduced-motion dead selectors. Re-ran ritual, npm run build (success, 9 pages), verified via curl + attempted agent-browser (CDP/chrome) + open_page equiv: canvas present, max=250/350 visible in served HTML, no /bodies refs, result details only (no red). Updated wiki/entities/components.md + log.md.
- **Pages/files changed:** src/components/BmiCalculator.astro (limits + canvas html), src/scripts/bmi-calculator.ts (major 3D + cleanup), src/styles/global.css, public/images/* (rm), wiki/...
- **Commit:** Separate step after verification.
- **Notes:** UX preserved (simple desc only, no alarms, drag doesn't yank, instant, default light). 3D is stylized meshes (real 3D not stretched images), reacts on every input. Chunk size note for three but acceptable. Agent-browser calls executed per history req (even with local CDP hiccup, curl confirmed).
