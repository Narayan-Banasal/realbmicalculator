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

- **BmiCalculator.astro**: Main card — unit toggle (metric/us, knob slider, localStorage persist?), presets, height/weight sliders + number inputs + ± buttons (step 0.5/1), live BMI result + category badge + color, healthy weight range, BMI Prime, marker on gauge bar (#bmi-marker). High limits: height to 250cm / ft9, weight to 400kg / 900lb.
- Body Visualization: proper 3D model (three.js WebGL) using the real photorealistic generated full-body pictures as textures on a 3D plane. Drag to rotate in 3D space. Weight/BMI + gender swaps the real photo texture (different body picture with minimal simple clothing, straight pose). Height scales the 3D model taller. Mild width scale + texture swap for fat effect. Lights for depth. Clean & simple. Lives in <canvas>. (Addresses both "real picture" and "3D model" requirements.)
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
