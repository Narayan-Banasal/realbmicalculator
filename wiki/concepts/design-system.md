---
title: Design System and Tokens
type: concept
tags: [design, tokens, dark-mode, typography, colors, motion]
sources: [DESIGN.md, src/styles/global.css, ../bmi-research/BMI-CALCULATOR-RESEARCH.md, .agents/skills/tailwind-v4-best-practices/SKILL.md]
created: 2026-06-04
updated: 2026-06-04
---

# Design System and Tokens

> Active semantic token system + dark mode + typography. Blends DESIGN.md reference (Vercel) with research "Clinical clarity" direction and Tailwind v4 @theme best practices (semantic, no direct colors, no @apply).

## Core Tokens (from global.css @theme)

- **Fonts**: --font-sans: "DM Sans", system; --font-display: "Fraunces", Georgia, serif. (Research choice; .font-display class.)
- **Colors (light)**: --color-ink: #0f172a (deep navy), --color-body: #475569, --color-mute: #94a3b8, --color-canvas: #f8fafc (off-white), --color-surface: #ffffff, --color-accent: #10b981 (mint), --color-accent-deep: #059669, --color-link: #0070f3, --color-hairline: #e2e8f0, + category --color-under/normal/over/obese.
- **Dark** (via @custom-variant dark + .dark body): inverts to light ink #f1f5f9 on dark canvas #0b1120 / surface #111827, hairline #1e293b. JS toggles .dark on html/body?
- **Motion**: bmi specific keyframes (pulse-overlay, screen-flash); general smooth scroll; research: 200ms ease, respect reduced-motion.
- **From DESIGN reference** (read before UI): full Vercel scale (gradients mesh cyan-blue-magenta-amber as brand chrome, pill 100px CTAs primary ink, stacked micro-shadows, 6px square for some, Geist as ideal but substituted, spacing ladder 4-128px, component contracts for buttons/cards/inputs/nav).

## Principles (Tailwind v4 skill)

- Semantic tokens over palette (enables dark/theme).
- Complete class names only (no dynamic `bg-${}`).
- Use scale (text-2xl not [20px]).
- @theme in CSS for primitives → semantic.
- OKLCH capable but current uses hex (fine for now).

## Usage in Site

- Components use e.g. text-(--color-ink), bg-(--color-surface), border-(--color-hairline), text-(--color-accent-deep).
- Category results drive color via JS + category colors.
- Elevation: hairline border + subtle shadow-sm on calc card.
- Research visual: centered card max-w ~480- , prose max-w-3xl.

## Cross-refs

- [[Design and Research Sources]] for full DESIGN + research palette suggestions.
- Entities use these; synthesis ties to UX goals.
