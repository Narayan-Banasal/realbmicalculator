# 01 — Architecture & Code

## Site Structure (MPA for SEO)
Every route is a full `.astro` page (good for crawlers, no client-side routing).

- `/` (index.astro) — Main: intro prose + `<BmiCalculator />` (primary) + quick categories table + disclaimer + visible legal nav + educational sections (What is BMI, How to use, Limitations, Why Real BMI) + `<FaqSection />` + gallery + 3D scene.
- `/bmi-chart` — Extended WHO classification table.
- `/bmi-calculator-for-women` + `/bmi-calculator-for-men` — Re-uses the full calculator component + gender-specific intro copy (body composition, muscle, pregnancy notes).
- Legal/info (via `<ProsePage>`): `/about`, `/contact`, `/privacy-policy`, `/terms`.
- `404.astro` — Custom, noindex=true.

## Key Components
- `BaseLayout.astro` — Shell: head meta (title/desc/canonical/og/robots/GA), Header, main, Footer. Fonts: DM Sans + Fraunces.
- `Header.astro` — Sticky nav (Calculator/Chart/Women/Men/About), small legal links, theme toggle (script: localStorage + prefers dark).
- `Footer.astro` — Links + copyright + strong disclaimer.
- `BmiCalculator.astro` — The core instrument. Contains all inputs (dual metric/US panels, age/gender optional, presets, nudges), result panel, alert banner/overlay. Includes its own `<style>` + script that calls `initBmiCalculator()`.
- `BmiVisualGallery.astro` — "What does your BMI look like?" active card + horizontal snap-x gallery of 4 category cards (data-gallery-card). Click jumps to 3D.
- `BmiScene3d.astro` — Perspective stage + scrollable track of 4 tilt cards (data-scene-card). CSS 3D + JS for drag/wheel/scroll tilt. Listens to `rbmi:result`.
- `FaqSection.astro` — Accordion + inline application/ld+json FAQPage schema.
- `ProsePage.astro` — Simple article wrapper for legals.

## Scripts & Logic (pure client vanilla)
- `src/scripts/bmi-calculator.ts` — State machine: units (persist), alertDismissed (session), all bindings (bindSlider, nudge, presets, unitToggle, calc orchestration), highlightVisuals (syncs gallery + scene + active img/label), applyAlert, copy link (URLSearchParams), URL restore on load, custom events dispatch.
- `src/scripts/bmi-scene-3d.ts` — Pointer drag, wheel (horizontal hijack), scroll listener for dynamic tilt/scale, `rbmi:result` listener for auto center, gallery click bridge.
- `src/lib/bmi.ts` (pure, no DOM — ideal for future tests):
  - `BMI_CATEGORIES` const (4: underweight/normal/overweight/obese with full metadata: id, label, shortLabel, min/max, color, description, healthNote, exampleBmi, alertLevel).
  - `categorize(bmi)`, `markerPosition`, `healthyWeightRangeKg`, `calcBmiMetric`/`calcBmiUs`, converters (`kgToLb`, `lbToKg`, `cmToFeetIn`, `feetInToCm`), `shouldTriggerAlert`.

## Data Flow & Reactivity (event-driven, no framework)
1. User input (slider/number/nudge/preset/unit switch) → calc()
2. calc() computes via lib → updates DOM (value, category pill color, marker left%, details list) + highlightVisuals(cat) + applyAlert(bmi)
3. highlightVisuals dispatches? No, directly mutates classes + sets active img src/label. Also dispatches `rbmi:result` so scene can react.
4. Scene listens to `rbmi:result` → smooth scrollIntoView center + updateTilt timeout.
5. Unit switch also dispatches `rbmi:units`.
6. Storage: localStorage (theme in header, units in calc), sessionStorage (alert dismissed).

Age/gender are captured in UI but **not used** in current BMI formulas (standard adult WHO is height/weight only). Future extension point.

## Layouts & Styling
- All surfaces use CSS custom properties defined in `@theme` (global.css) + overridden in `.dark`.
- Tokens: --color-ink, --color-body, --color-canvas, --color-surface, --color-accent (emerald for positive health), --color-hairline, category colors (under blue, normal green, over amber, obese red).
- Dark mode inverts the surface/ink set. Alert animations and 3D card styles also here.
- No @apply (v4 best practice). Direct utilities + var() where needed.

See 02-design-implementation.md for full theming and component details.
