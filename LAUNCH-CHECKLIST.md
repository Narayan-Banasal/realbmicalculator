# Launch checklist (Compile Future video)

Use this before buying the domain or applying for AdSense.

## Environment

- [x] Node.js + npm
- [x] Git
- [x] Astro + Tailwind v4 + Cloudflare adapter
- [x] Skills + Astro MCP + DESIGN.md

## Site (local)

- [x] BMI calculator (metric + US, instant result, gauge)
- [x] Dark mode toggle
- [x] Mobile-responsive layout
- [x] Privacy, Terms, About, Contact (linked on homepage)
- [x] FAQ + JSON-LD schema
- [x] BMI chart + women + men pages
- [x] Custom 404
- [x] robots.txt
- [x] sitemap (auto via @astrojs/sitemap)
- [x] `_headers` noindex for pages.dev
- [x] `ads.txt` placeholder
- [x] `npm run build` passes
- [x] `npm run deploy` script

## After local testing (`npm run dev`)

- [ ] Run `npx wrangler login`
- [ ] `npm run deploy` (or `npm run deploy:pages`)
- [x] Update `public/_headers` with `realbmicalculator.pages.dev` + preview subdomains
- [ ] Buy **realbmicalculator.com** (only after site works on preview URL)
- [ ] Connect domain in Cloudflare + nameservers
- [ ] Google Search Console + sitemap submit
- [ ] Bing Webmaster (import from GSC)
- [ ] Set `PUBLIC_GA_MEASUREMENT_ID` in `.env`
- [ ] Promote (Reddit, Quora, social)
- [ ] AdSense after ~10 users/day (not before)