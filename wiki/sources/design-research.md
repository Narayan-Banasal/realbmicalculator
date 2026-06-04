---
title: Design and Research Sources
type: source
tags: [design, research, competitors, tokens, ux]
sources: [DESIGN.md, ../bmi-research/BMI-CALCULATOR-RESEARCH.md, src/styles/global.css]
created: 2026-06-04
updated: 2026-06-04
---

# Design and Research Sources

> Source synthesis from DESIGN.md (Vercel analysis + full token set), BMI-CALCULATOR-RESEARCH.md (full competitor audit June 4 2026), and active implementation in global.css + research visual direction.

## What These Sources Cover

- **DESIGN.md**: "Vercel-design-analysis" — stark near-white canvas + ink #171717 primary, multi-color mesh gradient (cyan #007cf0 → preview violet → ship red → cyan/magenta/amber) as sole decoration at hero scale. Full token system: colors (primary/ink/body/mute/hairline/success/error/warning + semantic + gradients), typography (Geist family, display 48px -2.4ls down to caption-mono, weights), rounded (0 to pill), spacing (4px–128px + section 192px), components specs (nav, buttons pill/secondary, cards, inputs, badges, pricing, hero, etc.). Do's/Don'ts. Used as reference per AGENTS.md protocol.
- **../bmi-research/BMI-CALCULATOR-RESEARCH.md**: Live agent-browser audit of 9 sites (calculator.net, omni, bmi-calculator.net, CDC/NIH, etc.). Executive: high-volume keyword, win via premium UX + domain + SEO depth + FAQ schema + mobile + US CPM. Feature matrix, UX gaps to exploit (hero above fold instant, animated gauge, dark mode **must**, one-tap units, copy/share, disclaimers, 3D/illustrations). Keyword targets (bmi calculator primary + women/men/chart). Site MPA arch for SEO. Calculator formulas (metric kg/m2, imperial 703). Content checklist (600w intro, JSON-LD FAQ, limitations, children disclaimer, visible legals). Tech: Astro SSG + Tailwind4 + CF Pages. Promotion (Reddit/Quora). MVP scope v1/v2. Screenshots indexed.
- **Implemented design (global.css + code)**: Adapted "clinical clarity" from research (deep navy ink #0f172a, mint accent #10b981, Fraunces display + DM Sans body — not pure Geist). @theme tokens: ink/body/mute/canvas/surface/accent/link/hairline + category (under/normal/over/obese). Dark mode via .dark + html class + body override (inverted slate tones). Special: bmi-alert-overlay/banner + keyframes for critical/caution, 3D scene gradient. DESIGN tokens inform but active system is research-tuned + Vercel spirit (clean, minimal elevation via hairline+soft, pill CTAs).

## Key Takeaways for Wiki / Project

- Read DESIGN.md before any UI/Astro change (per AGENTS + skills).
- Beat Omni (live scale/gauge) + calculator.net (content depth) with instant + dark + focused + honest limitations + rich FAQ.
- Gradient/mesh as signature (even if toned in current css for clinical).
- Persistent tokens in CSS for dark + theme; no direct hex in components.
- Research date 2026-06-04 — re-run audits on major updates.
