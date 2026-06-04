---
title: UI Components and Visuals
type: entity
tags: [components, calculator, visuals, 3d, faq, gauge]
sources: [src/components/*.astro, src/scripts/*.ts, src/data/faq.ts, src/lib/bmi.ts]
created: 2026-06-04
updated: 2026-06-04
---

# UI Components and Visuals

> Core interactive + presentational building blocks. Instant feedback is non-negotiable.

## Key Components

- **BmiCalculator.astro**: Main card — unit toggle (metric/us, knob slider, localStorage persist?), presets, height/weight sliders + number inputs + ± buttons (step 0.5/1), live BMI result + category badge + color, healthy weight range, BMI Prime, marker on gauge bar (#bmi-marker), alert banner/overlay for critical/caution.
- **BmiVisualGallery.astro**: Illustrated body-type guides per category (research req).
- **BmiScene3d.astro + bmi-scene-3d.ts**: 3D-ish tilt/scale cards or WebGL/Three? interactive body scene (research "explore 3D body-type guides").
- **FaqSection.astro + data/faq.ts**: 8 Qs (what is BMI, formula, healthy, accuracy/limitations, children, BMI Prime, frequency, etc.) + JSON-LD schema.
- **Header.astro / Footer.astro**: Nav + legals (visible links), branding.
- **ProsePage.astro / BaseLayout.astro**: Content shell for non-calc pages.

## Supporting Logic (src/lib/bmi.ts)

- Types: UnitSystem, BmiCategoryId, BmiCategory (id/label/min/max/color/desc/healthNote/example/alertLevel).
- Categories: under <18.5 blue, normal 18.5-25 green, over 25-30 amber, obese >=30 red. (Slight 25 vs 24.9 in research — active code uses 25.)
- Pure fns: categorize(), markerPosition(bmi,15-40), healthyWeightRangeKg, calcBmiMetric, calcBmiUs, converters (kg/lb, cm/ftin), shouldTriggerAlert.
- Used by client script bmi-calculator.ts for DOM sync, instant updates, no full submits.

## Interactivity

- `src/scripts/bmi-calculator.ts`: Listens inputs, computes, updates DOM (result, marker left:%, colors, ranges, alerts), unit switch with conversions.
- Alerts: full tint overlay + banner for >=35 or <16 critical; caution inset shadow.
- Reduced motion safe, a11y (roles, aria).

## Notes

- Gauge is CSS % positioned marker on spectrum bar (not SVG in this pass).
- 3D/visuals add differentiation vs flat competitors.
- All client-side; SSG for SEO shell.
