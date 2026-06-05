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

## [2026-06-05] fix | Use real photorealistic pictures (reacts to height + weight)

- **Source:** User: "Hey still this is not done please use the real picture which changes based on the change in height and weight."
- **Action:** Followed full AGENTS ritual (re-read DESIGN.md, wiki/index.md + entities, loaded all 4 project skills under .agents/skills/). Used image_gen to create 8 fresh high-quality photorealistic full-body studio portraits (male/female + 4 body types each) with consistent lighting/pose/clothing to accurately convey shape. Reverted the body visualization completely from three.js 3D back to <img> real pictures.
  - Weight (via BMI category) + gender now selects and cross-fades the actual real photo (different body composition image).
  - Height input dynamically scales the vertical size the real photo occupies inside the fixed 320×400 container (taller values → person appears proportionally taller in frame, using height % on the img — preserves photo integrity, no body distortion).
  - Fully live on input events. Cleaned out all remaining THREE code, canvas, 3D vars and functions. Updated label text and status. Images placed in public/images/bodies/. Updated wiki/entities + log.
- **Files:** src/components/BmiCalculator.astro, src/scripts/bmi-calculator.ts, public/images/bodies/* (new real photos), wiki/entities/components.md, wiki/log.md.
- **Notes:** This directly implements the request for real pictures that change based on height and weight. Category switch gives the "weight" visual change via different real body photos; height gives stature change via sizing. Build verified clean. No 3D blocks.

## [2026-06-05] fix | Raise input limits + real three.js 3D model + cleanup + commit (historical)

(Superseded by later real-picture request above.)
