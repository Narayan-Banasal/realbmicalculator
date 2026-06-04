# 02 — Design, Implementation & SEO

## Theming & Design System (DESIGN.md + Tailwind v4)
This project follows the **Vercel-inspired design language** documented in DESIGN.md (stark black-ink on near-white, geometric sans for display, aggressive negative letter-spacing on headlines, 100px pill CTAs, stacked shadows + inset hairline for elevation, mono only for technical, generous section spacing, polarity flip for depth).

**Implementation**:
- Fonts: DM Sans (body) + Fraunces (display) via Google (preconnect in BaseLayout).
- All colors/surfaces via CSS vars in `@theme` block in global.css. Dark variant flips them.
- Components use `text-(--color-ink)`, `bg-(--color-surface)`, `border-(--color-hairline)` etc. (Tailwind v4 var syntax).
- Accent is emerald (#10b981 / --color-accent) chosen for "healthy" positive feel (different from pure Vercel multi-gradient but respects the spirit: clean, one strong accent, no clutter).
- BMI gauge: segmented bar (under/normal/over/obese colors) + moving ink dot marker with transition.
- Alerts: radial gradient overlay + body keyframe flashes for critical; inset ring for caution.
- 3D cards: preserve-3d, dynamic rotateY from scroll offset, stronger shadow + lift when .is-active.

**Visuals**:
- 4 original SVG body silhouettes (public/images/bmi/*.svg) — simple, gradient-filled, no stock. Used in both gallery and 3D cards. Active one promoted to large preview.

## Calculator Implementation Details
- Unit panels toggled with .hidden (metric default).
- Sync between range + number on input; calc() on every change.
- Nudges: parse step/min/max, clamp, update both inputs, recalc.
- Presets: hard-coded average/athlete/high values for both unit systems; also clears alert dismiss.
- Conversion on switch: uses lib helpers so values stay "same person".
- Result only shows when valid finite BMI.
- Share: constructs URL with current units + raw values; on load restores into the correct inputs then setUnits (which triggers calc).
- Copy uses navigator.clipboard.

## Health Alerts
`shouldTriggerAlert(bmi)`:
- critical: >=35 or <16
- caution: >=30 or <17
- none otherwise

Critical: adds body class + shows overlay (pointer-events none) + banner.
Caution: body inset ring + banner.
Banner has title/message tailored (low vs obese ranges) + dismiss button (sets session flag + clears classes).

## SEO, Legal, AdSense Prep (exact checklist items)
- Prominent legal links in home hero area + header/footer.
- Full medical disclaimer on home + footer.
- Educational prose on home (limitations, why this tool, how to use, BMI explanation).
- FAQ with schema.org/FAQPage JSON-LD.
- Dedicated supporting pages for chart + gender KWs.
- Meta: description, canonical, og:title/desc, robots (noindex only on 404 and via _headers for pages.dev).
- robots.txt + sitemap-index.xml (auto).
- public/_headers: X-Robots-Tag: noindex for realbmicalculator.pages.dev/* and version.* (prevents duplicate content penalty until custom domain + 301s).
- ads.txt placeholder for Google pub- line.
- GA script only if env var present (define:vars for inline config).

All pages get proper titles via BaseLayout (appends " | Real BMI Calculator" unless already contains it).

## Config & Deploy
- astro.config.mjs: site url, static, tailwind vite plugin, cloudflare({imageService:'compile'}), sitemap().
- wrangler.jsonc: name, compat date, assets: {directory: "./dist", binding: "ASSETS"}, observability.
- package.json scripts: dev/build/deploy (the deploy one does build + wrangler pages deploy dist/client --project-name=realbmicalculator --commit-dirty=true).
- tsconfig: astro strict + worker-configuration.d.ts include (the generated one is gitignored).
- .env.example: GA id + pages dev host note (for _headers updates post first deploy).

## Public Assets
- favicons (svg + ico)
- The 4 bmi/ svgs
- robots.txt, _headers, ads.txt

## Known Implementation Notes / Future Hooks
- Age & gender are in the UI (good for future advanced formulas or notes, e.g. different ranges for older adults or ethnicity adjustments seen in some competitors).
- No children mode yet (links/disclaimers point to CDC style in content).
- Result link sharing is basic query params (works great for Reddit/Quora promo).
- All interactivity is progressive — core calc works even if JS slow, but visuals/events assume modern browser.

See 01-architecture.md for the pure calc functions and event wiring.
