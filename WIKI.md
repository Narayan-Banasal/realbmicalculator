# Real BMI Calculator — Project Wiki

**Purpose**: Retain all knowledge, decisions, research, architecture, and implementation details for realbmicalculator.com. This is the single source of truth for the project (beyond code) so future iterations (by Narayan + Grok/Cursor agents) preserve context without re-explaining.

**Domain**: realbmicalculator.com  
**Playbook**: Compile Future micro-tool method (Astro MPA + Tailwind v4 + Cloudflare Pages + SEO/AdSense prep)  
**Agent rule**: Use Cursor/Grok (never Claude Code). Always follow AGENTS.md before changes.

---

## Repository Initialization (this session)

- `git init` performed (repo was already initialized with 1 prior commit).
- `.gitignore` added/updated and committed (covers node_modules, dist, .astro, .wrangler, all .env*, .DS_Store, logs, worker-configuration.d.ts, etc.).
- All pending changes (the bulk of the MVP) staged and committed in one consolidating commit:
  - `0f412e5 chore: initialize full repo state + commit BMI calculator MVP`
  - Prior: `2f4693d Initial Real BMI Calculator site: Astro, Tailwind v4, Cloudflare, SEO pages`
- Working tree clean after commit. No remotes configured yet (local-only until ready for push).

**Note on skills-lock.json**: It is tracked (was in initial state). It pins the agent skills versions used.

---

## Full Site Architecture & Pages

**Total pages (MPA — every route is a full .astro page for SEO/crawlability)**:
- `/` — index.astro: Hero intro + main `<BmiCalculator />` + quick categories table + medical disclaimer + visible legal nav links (AdSense req) + prose (What is BMI / How to use / Limitations / Why us) + `<FaqSection />` + `<BmiVisualGallery />` + `<BmiScene3d />`.
- `/bmi-chart` — Static WHO-extended classification table (severe thinness … obese class III).
- `/bmi-calculator-for-women` — Re-uses full BmiCalculator + tailored intro copy about body comp / pregnancy.
- `/bmi-calculator-for-men` — Same + copy on muscle mass / waist.
- `/about`, `/contact`, `/privacy-policy`, `/terms` — Prose pages via `<ProsePage>` wrapper (good for thin legal content + schema potential).
- `/404` — Custom, noindex.

**Layouts & Shared**:
- `BaseLayout.astro`: html skeleton, meta (title, desc, canonical, og, robots, GA if PUBLIC_GA_MEASUREMENT_ID), fonts (DM Sans + Fraunces via Google), Header, main slot, Footer.
- Header: sticky, logo, main nav (Calculator/Chart/Women/Men/About), small legal links (desktop), Dark/Light toggle (script-driven, localStorage + prefers-color-scheme).
- Footer: links + copyright + strong medical disclaimer.
- `ProsePage.astro`: Consistent article wrapper for legal/about pages.

**Components (all .astro + vanilla TS scripts)**:
- `BmiCalculator.astro` (the heart): unit toggle (metric/US with live convert), presets, age/gender (optional, not yet wired to formula), dual slider+number inputs per unit system (nudge buttons), live result panel (big BMI, colored pill category, spectrum bar + animated marker, healthy range + BMI Prime + healthNote, copy-result link), alert banner + overlay.
- `BmiVisualGallery.astro`: "What does your BMI look like?" — active card + horizontal snap gallery of 4 category cards (clickable). Uses `/images/bmi/*.svg`.
- `BmiScene3d.astro`: "Explore BMI in 3D" — horizontal draggable/scrollable/wheelable track of 4 perspective-tilt cards (CSS preserve-3d + rotateY driven by scroll position + active state). Auto-centers + tilts on calc result.
- `FaqSection.astro`: Accordion details + inline JSON-LD `FAQPage` schema.
- Others: Header, Footer, ProsePage.

**Scripts (client-only, no heavy frameworks)**:
- `src/scripts/bmi-calculator.ts`: All the state, event wiring, unit switching with conversion helpers, calc orchestration, highlightVisuals (syncs gallery/scene), applyAlert, URL param restore on load, copy link, storage for units/alert-dismiss.
- `src/scripts/bmi-scene-3d.ts`: Pointer drag, wheel hijack (for horizontal), scroll listener for tilt calc, custom event listener for `rbmi:result` to auto-scroll active card, gallery click bridge.

**Pure logic (testable, no DOM)**:
- `src/lib/bmi.ts`: `UnitSystem`, `BmiCategory` + `BMI_CATEGORIES` const (4 entries with id/label/min/max/color/desc/healthNote/example/alertLevel), `categorize(bmi)`, `markerPosition`, `healthyWeightRangeKg`, `calcBmiMetric`, `calcBmiUs`, unit converters (kg/lb, cm/ftin, feetInToCm), `shouldTriggerAlert` (critical <16/>=35 or >=30/<17 caution).

**Styling & Theming**:
- `src/styles/global.css`: Tailwind v4 `@import "tailwindcss"`, full `@theme` block defining --font-*, --color-* (ink/body/mute/canvas/surface/accent + semantic under/normal/over/obese). Dark mode via `@custom-variant dark` + `.dark` body overrides for all tokens. Plus alert animations, 3D scene styles, gallery scrollbars.
- All components use semantic `text-(--color-ink)` etc + `bg-(--color-surface)` (Tailwind v4 arbitrary? no — the parens syntax for CSS vars).
- DESIGN.md is the source of truth (Vercel-inspired: Geist-like via DM Sans/Fraunces, stark canvas, emerald accent, stacked shadows, sentence-case + negative tracking on display, 100px pill CTAs vs 6px small, mono only for technical labels, generous section spacing).

**Data**:
- `src/data/faq.ts`: 8 curated questions (sourced from Ahrefs-style "people also ask" + common).

**Public assets**:
- `/images/bmi/{underweight,normal,overweight,obese}.svg` — original hand-crafted simple gradient silhouettes (not stock).
- favicon.svg + .ico, robots.txt, _headers (X-Robots-Tag noindex on all *.pages.dev + version subdomains), ads.txt (placeholder for pub- after AdSense).

**Config**:
- `astro.config.mjs`: site=https://realbmicalculator.com, output:static, vite tailwindcss plugin, cloudflare adapter (imageService:compile), sitemap integration.
- `wrangler.jsonc`: name, compat date 2026-06-04, assets dir dist, observability.
- `package.json`: scripts (dev/build/deploy:pages), deps (astro 6, @astrojs/cloudflare, tailwind 4 + vite plugin, sitemap, wrangler), engines >=20, vite override ^7.
- `tsconfig`: strict astro.

**SEO & AdSense readiness (per LAUNCH-CHECKLIST + research)**:
- Prominent legal links on home (not footer-only).
- Medical disclaimer on home + footer.
- Long-form educational content on home + dedicated pages.
- FAQ + JSON-LD.
- Sitemap auto-generated.
- Custom 404 + robots + canonicals + og tags.
- `_headers` duplicate-content protection until custom domain.
- GA hook ready via env var.
- Target: US English first for CPM.

---

## Design System (from DESIGN.md + implemented)

Full token set documented in DESIGN.md (Vercel analysis): colors (primary ink #171717, canvas variants, link blue, semantic success/error/warning + 4-stop gradient but we use single emerald accent here), typography scale (display-xl 48px/600/-2.4px down to caption-mono), rounded scale (pill 100px for CTAs, sm 6px for small), spacing 4px base, elevation via stacked shadows + inset hairline, responsive (1-up mobile, etc.).

In practice this site uses a **tailored subset** in CSS vars + Tailwind (emerald #10b981 as accent for health-positive feel, Fraunces for display, DM Sans body). Dark mode inverts the surface tokens. No heavy mesh gradient used here (kept clinical).

**Visual identity**: Clean health-tech, instant feedback, honest (limitations called out), beautiful but not flashy. 3D cards + color gauge + body guides differentiate vs competitors.

---

## Research & Competitor Context (`../bmi-research/`)

See full `BMI-CALCULATOR-RESEARCH.md` (and ahrefs-*.md, screenshots/):
- High-volume keyword, authority + calculator-network domination.
- Benchmarks: Omni Calculator = best modern UX (live gauge), Calculator.net = deepest content, CDC/NIH = trust/disclaimers.
- Your target: live + dark + mobile + instant + share links + 3D + honest education + AdSense-visible structure beats both.
- Keyword targets, site map, content checklist, promotion (Reddit r/fitness etc.) all in the MD.
- Screenshots of 10+ competitors for visual reference.

This project was built to hit the "exploit UX gaps" list in research.

---

## Build, Run, Deploy

```bash
npm install
npm run dev          # localhost:4321 — test on desktop + real phone
npm run build
npm run deploy       # after `npx wrangler login` (uses wrangler pages deploy dist/client)
```

See SETUP.md + LAUNCH-CHECKLIST.md for full pre-flight (GA, domain after preview works, GSC, AdSense only after real traffic).

**Cloudflare Pages notes**: Static output; adapter mainly for types/compat. _headers file controls robots on preview subdomains.

---

## Current Feature Status (post this commit)

- [x] Full interactive calculator (both unit systems, sync, persist, share)
- [x] Live gauge + category + healthy range + BMI Prime + health notes
- [x] Health alerts (visual + banner + critical overlay)
- [x] Visual gallery + 3D tilt explorer (synced via events)
- [x] Custom SVGs per category
- [x] Dark mode everywhere
- [x] All SEO pages + FAQ schema + disclaimers + visible legals
- [x] Mobile responsive, accessible (labels, aria, focus, keyboard nudge)
- [x] Build + deploy scripts
- [x] Git + this wiki for knowledge retention

**Not yet (per checklists)**:
- Real domain + DNS + GSC submit
- GA measurement ID wired
- Actual AdSense (after traffic)
- Children calculator or advanced (age/gender not used in calc — future)
- Related tools (WHR etc.)
- Analytics/events beyond basic

---

## "Carpathy" / Knowledge Retention Note

"Carpathy" appears to be an internal or conversational reference (no matching files/projects found in side/ or home during repo audit). This WIKI.md (and the AGENTS.md + DESIGN.md + research sibling) serves the purpose of retaining "the knowledge which I [Narayan] am providing" across sessions.

**How to use for retention**:
- Update this WIKI.md after any significant decision, research addition, or architectural change.
- Keep DESIGN.md, AGENTS.md, LAUNCH-CHECKLIST.md, SETUP.md, README.md in sync.
- For graph-style knowledge: the `/graphify` skill (see ~/.claude or global) can be invoked on this file + code for persistent graph.
- When user provides new knowledge in chat (constraints, preferences, new research, "carpathy" details), immediately incorporate into WIKI.md + relevant docs.
- Commit frequently (per skill guidance: after each feature).

If "Carpathy" refers to a specific external wiki/repo/knowledge base or another project, add a section or symlink here and note the path.

---

## Key Files for Agents (load before work)

1. `AGENTS.md` (strict instructions + before-every-change checklist)
2. `DESIGN.md` (full visual language)
3. `.agents/skills/real-bmi-micro-tool/SKILL.md` + astro + tailwind-v4 + web-design-guidelines
4. This `WIKI.md`
5. `../bmi-research/BMI-CALCULATOR-RESEARCH.md`
6. LAUNCH-CHECKLIST.md + SETUP.md

**MCP**: Use astro-docs server for any Astro questions.

**Never**: Buy domain before local MVP solid. Apply AdSense early. Use thin content. Skip disclaimers.

---

## Future / Open Questions (capture here)

- Wire age/gender into formula or notes? (research shows some advanced calcs do ethnicity/age adjustments — smartbmicalculator)
- Add more tools? (ideal weight, body fat, waist-to-height)
- Analytics events for copy/share/preset use?
- Print/PDF result?
- A/B test gauge styles?
- Performance: measure INP etc once live (web-perf skill available)

Add decisions here as they happen.

---

**Last updated**: This file created during the "understand repo + git init + wiki" task (June 2026 context).

Maintain this file. It is the long-term memory for the Real BMI Calculator project.
