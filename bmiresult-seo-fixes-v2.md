# bmiresult.com — SEO Fix Pack (v2)

Hand this entire file to your coding AI (Cursor / Claude Code / Copilot) inside the `realbmicalculator` Astro repo. Updated after a full code read of `main` (commit checked 2026-06-29).

**Stack:** Astro `output: 'static'`, Cloudflare adapter, `@astrojs/sitemap` with i18n (`en` default, `hi`, `es`, `fr`). Live at `https://bmiresult.com`.

**Workflow:** Create a branch `seo-fixes`, apply every change below, open a PR to `main`.

---

## What's already in the repo — DO NOT duplicate

Verified by reading `src/layouts/BaseLayout.astro`, `astro.config.mjs`, `public/robots.txt`, `public/_headers`:

- ✅ `<link rel="canonical">` self-referencing (BaseLayout)
- ✅ `<meta name="description">`, full OG set, Twitter card, `og:image` 1200×630 (`/images/og-default.png`)
- ✅ `hreflang` for `en-US`, `hi-IN`, `es-ES`, `fr-FR` + `x-default` (BaseLayout loop over `locales`)
- ✅ `robots.txt` with `Sitemap: https://bmiresult.com/sitemap-index.xml`
- ✅ `@astrojs/sitemap` integration with i18n config
- ✅ FAQPage JSON-LD (rendered via `FaqSection.astro`)
- ✅ `noindex` `X-Robots-Tag` on `*.pages.dev` staging via `public/_headers`
- ✅ Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
- ✅ Cookie consent banner UI (`#cookie-banner` in BaseLayout)
- ✅ Title auto-suffix: `${title} | BMI Result` unless title already contains "Real BMI"

## Real issues confirmed in code

1. ❌ `https://www.bmiresult.com/` returns **200** instead of 301 → duplicate content.
2. ❌ **Zero JSON-LD** beyond FAQ — no `Organization`, `WebSite`+`SearchAction`, `WebApplication`, or `BreadcrumbList`.
3. ❌ `src/pages/embed.astro` has no `noindex` prop → competes with the homepage.
4. ❌ Sitemap integration does not exclude `/embed`.
5. ❌ **GA4 and AdSense load unconditionally in BaseLayout `<head>` — BEFORE the consent banner is answered.** The banner is cosmetic; tracking already fired. GDPR/UK-GDPR exposure + can hurt EU EEAT signals.
6. ❌ No `disavow.txt` submitted in GSC — Semrush still shows `*.shop` spam dominating the backlink profile.
7. ⚠️ Title length: BaseLayout auto-appends ` | BMI Result` (14 chars). The suggested titles in §4 are already 45–55 chars, so the final rendered title can exceed 60. Either shorten the suggestions, or change the suffix rule (see §4).

---

## 1. Force www → non-www (301) — Cloudflare dashboard

Cloudflare → Rules → **Redirect Rules** → Create rule:

- **Name:** `www to apex`
- **When incoming requests match:** `(http.host eq "www.bmiresult.com")`
- **Then:**
  - Type: **Dynamic**
  - Expression: `concat("https://bmiresult.com", http.request.uri.path)`
  - Status: **301**
  - Preserve query string: ✅

Verify:
```bash
curl -sI https://www.bmiresult.com/ | grep -iE "HTTP|location"
# expect: HTTP/2 301  +  location: https://bmiresult.com/
```

---

## 2. JSON-LD

### 2a. Site-wide (Organization + WebSite + SearchAction) — `src/layouts/BaseLayout.astro`

Add inside `<head>`, anywhere after the OG block:

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://bmiresult.com/#org",
      "name": "BMI Result",
      "url": "https://bmiresult.com/",
      "logo": "https://bmiresult.com/favicon.svg"
    },
    {
      "@type": "WebSite",
      "@id": "https://bmiresult.com/#website",
      "url": "https://bmiresult.com/",
      "name": "BMI Result",
      "publisher": { "@id": "https://bmiresult.com/#org" },
      "inLanguage": ["en-US","hi-IN","es-ES","fr-FR"]
    }
  ]
})} />
```

> Skipping `SearchAction` — the site has no real search endpoint. Adding a fake `?q=` target is a quality signal Google penalises. Add only after a real search page exists.

### 2b. Calculator pages — WebApplication

Add to `src/pages/index.astro`, `bmi-calculator-for-men.astro`, `bmi-calculator-for-women.astro`, `bmi-calculator-for-children.astro`, and their `hi/`, `es/`, `fr/` mirrors. Use the `<slot name="head">` already exposed by BaseLayout:

```astro
<BaseLayout title="..." description="...">
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "BMI Calculator",
      "url": new URL(Astro.url.pathname, Astro.site).href,
      "applicationCategory": "HealthApplication",
      "operatingSystem": "Any",
      "browserRequirements": "Requires JavaScript",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
    })} />
  </Fragment>
  ...
</BaseLayout>
```

> Do **NOT** add `aggregateRating` unless you have real, verifiable user ratings on the page. Fake ratings = manual action risk.

### 2c. BreadcrumbList — every non-home page

Same `<Fragment slot="head">` pattern:

```astro
---
const segments = Astro.url.pathname.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
const crumbs = [
  { name: 'Home', url: 'https://bmiresult.com/' },
  ...segments.map((seg, i) => ({
    name: seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    url: `https://bmiresult.com/${segments.slice(0, i + 1).join('/')}/`
  }))
];
---
<Fragment slot="head">
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((c, i) => ({
      "@type": "ListItem", "position": i + 1, "name": c.name, "item": c.url
    }))
  })} />
</Fragment>
```

---

## 3. Noindex `/embed`

`src/pages/embed.astro` — pass the existing `noindex` prop BaseLayout already supports (no new code needed in the layout):

```astro
<BaseLayout
  title="Embed BMI Calculator on Your Website — Free Widget"
  description="..."
  noindex={true}
>
```

---

## 4. Title-length fix (BaseLayout)

Current logic in `BaseLayout.astro`:

```ts
const fullTitle = title.includes('Real BMI') ? title : `${title} | BMI Result`;
```

This silently appends ` | BMI Result` to every page title. With the suggested titles below, several rendered titles exceed 60 chars. Pick one:

**Option A (recommended):** make the suffix opt-out and trust pages to brand themselves.

```ts
// BaseLayout.astro props
interface Props { title: string; description: string; canonical?: string; noindex?: boolean; ogImage?: string; appendBrand?: boolean; }
const { ..., appendBrand = false } = Astro.props;
const fullTitle = appendBrand ? `${title} | BMI Result` : title;
```

**Option B:** keep auto-suffix and shorten page titles to ≤ 46 chars.

Suggested titles (already brand-safe — pair with Option A, do NOT auto-append):

| Page | Title | Description |
|---|---|---|
| `/` | `BMI Calculator — Free Body Mass Index Tool` | `Free BMI calculator. Get your body mass index in kg/cm or lb/ft instantly. See your category, healthy weight range, and BMI chart.` |
| `/bmi-chart` | `BMI Chart by Age & Gender — Healthy Weight Ranges` | `Full BMI chart with healthy weight ranges by height, age, and gender. Printable BMI table for adults, men, women, and children.` |
| `/bmi-calculator-for-women` | `BMI Calculator for Women — Healthy Weight by Age` | `Free BMI calculator for women. See your body mass index, healthy weight range by age, and what your BMI means for women's health.` |
| `/bmi-calculator-for-men` | `BMI Calculator for Men — Healthy Weight & Body Fat` | `Free BMI calculator for men. Calculate body mass index, see healthy weight range by age, and understand BMI limits for muscular men.` |
| `/bmi-calculator-for-children` | `Child BMI Calculator — BMI Percentile for Kids` | `Free child BMI calculator. Enter age, height, and weight to see BMI percentile and category for kids and teens (CDC growth charts).` |
| `/blog` | `BMI & Healthy Weight Blog — BMI Result` | `Articles on BMI, healthy weight, body composition, and weight management — written for everyday readers.` |
| `/about` | `About BMI Result — Free BMI Calculator Tool` | `BMI Result is a free, ad-supported BMI calculator built for fast, accurate body mass index calculation in metric and imperial.` |

Mirror unique titles + descriptions into `/hi`, `/es`, `/fr`.

---

## 5. Gate GA4 + AdSense behind cookie consent (NEW — was missing in v1)

Today, `BaseLayout.astro` loads `gtag/js?id=G-MJ4MPYMNS7` and `adsbygoogle.js` **unconditionally in `<head>`**. The cookie banner runs afterwards, so tracking already fired before the user clicked anything. That breaks the promise of the banner and is a GDPR risk for your EU traffic (the `/es`, `/fr` segments).

Replace the GA + AdSense `<script>` blocks in `BaseLayout.astro` with **Google Consent Mode v2 defaults + deferred load**:

```astro
{/* Consent Mode v2 — defaults BEFORE any Google tag */}
<script is:inline>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
  // Re-apply on next page if user already accepted
  if (localStorage.getItem('rbmi-cookie-consent') === 'accepted') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
  }
</script>

{/* GA4 — loads, respects consent defaults above */}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MJ4MPYMNS7"></script>
<script is:inline>
  gtag('js', new Date());
  gtag('config', 'G-MJ4MPYMNS7');
</script>

{/* AdSense — only injected after Accept */}
{adPubId && (
  <script is:inline define:vars={{ adPubId }}>
    if (localStorage.getItem('rbmi-cookie-consent') === 'accepted') {
      var s = document.createElement('script');
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + adPubId;
      document.head.appendChild(s);
    }
  </script>
)}
```

Then update the consent banner script at the bottom of BaseLayout — inside `dismiss(accepted)`, after writing localStorage:

```js
if (accepted) {
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted'
  });
  // Inject AdSense now
  if (window.__adPubId && !document.querySelector('script[src*="adsbygoogle.js"]')) {
    var s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + window.__adPubId;
    document.head.appendChild(s);
  }
}
```

(Set `window.__adPubId = "{adPubId}"` in an inline script when `adPubId` is present, so the banner handler can read it.)

---

## 6. Exclude `/embed` from sitemap — PRESERVE existing i18n config

The current `astro.config.mjs` already configures sitemap with i18n. **Do not replace it** — only add `filter`:

```js
integrations: [
  sitemap({
    filter: (page) => !page.includes('/embed'),
    i18n: {
      defaultLocale: 'en',
      locales: { en: 'en-US', hi: 'hi-IN', es: 'es-ES', fr: 'fr-FR' }
    }
  })
],
```

---

## 7. Disavow spammy backlinks (GSC)

Create `disavow.txt` locally (do NOT commit to public/):

```
# Disavow file for bmiresult.com
# Submitted: 2026-06-29
# Reason: AI-generated spam backlinks (negative SEO attack)

domain:seopxl-organic-boost-lab.shop
domain:seopxl-rank-velocity-lab.shop
domain:seopxl-link-velocity-hub.shop
domain:seopxl-traffic-engine.shop
domain:seopxl-authority-builder.shop
```

Pull the full `.shop` referring-domain list from Semrush → Backlink Analytics → Referring Domains → filter `TLD = .shop`, `AS ≤ 10`. Add every one with `domain:` prefix.

Upload at https://search.google.com/search-console/disavow-links-tool → property `bmiresult.com` → upload → confirm. Effect: 4–8 weeks.

---

## 8. Post-deploy verification

```bash
# www → 301
curl -sI https://www.bmiresult.com/ | grep -iE "HTTP|location"

# all JSON-LD types on home
curl -s https://bmiresult.com/ | grep -oE '"@type":"[^"]+"' | sort -u
# expect (home): Organization, WebSite, WebApplication, FAQPage, Answer, Question

# inner page adds BreadcrumbList
curl -s https://bmiresult.com/bmi-calculator-for-women | grep -oE '"@type":"[^"]+"' | sort -u

# embed is noindex
curl -s https://bmiresult.com/embed | grep -i 'name="robots"'
# expect: <meta name="robots" content="noindex, nofollow">

# embed absent from sitemap
curl -s https://bmiresult.com/sitemap-0.xml | grep -c '/embed'
# expect: 0

# GA does not fire before consent (in browser devtools, Incognito):
#   Network → filter gtag → should appear, but `_ga` cookie should NOT be set until you click Accept.
#   AdSense script `adsbygoogle.js` should NOT appear at all until Accept.
```

Then in **GSC**:
1. URL Inspection → request indexing for `/`, `/bmi-chart`, and the three calculator pages.
2. Crawl stats — confirm no 404 spike after the www→apex redirect.
3. Enhancements — "FAQ", "Breadcrumbs" reports should start populating in 2–3 weeks.

---

## PR description

> **SEO fix pack**
>
> - Add Organization + WebSite JSON-LD site-wide (BaseLayout)
> - Add WebApplication JSON-LD to all calculator pages (en + hi/es/fr)
> - Add BreadcrumbList JSON-LD to all non-home pages
> - `noindex` the `/embed` page (uses existing BaseLayout prop)
> - Exclude `/embed` from sitemap (preserve i18n config)
> - Gate GA4 + AdSense behind cookie consent via Consent Mode v2
> - Tighten title-suffix logic so rendered titles stay ≤ 60 chars
>
> **Out of repo (do manually):**
> - Cloudflare Redirect Rule: `www.bmiresult.com` → 301 → `bmiresult.com`
> - GSC: upload `disavow.txt` (negative-SEO cleanup)

---

When merged and deployed, ping me with "deployed" and I'll re-run GSC + Semrush + live header checks to confirm everything landed.
