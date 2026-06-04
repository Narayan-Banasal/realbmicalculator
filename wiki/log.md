# Operations Log — Real BMI Calculator

This is the chronological record of major decisions, sessions, and changes. Update on every significant piece of work. LLM + human both append here.

---

## 2026-06-04 — Git init + full state commit + Karpathy-style wiki (this session)

**User request**: "check this whole repo and understand this whole repo in detail. What I want from you is that please do: git init this particular repo, add the .gitignore file, commit the changes, understand each and everything related to this particular website, add the wiki also of the carpathy so that we can retain the knowledge which I am providing. Complete all these things."

**Actions taken**:
- Confirmed existing .git (on master, 1 prior commit). Explicitly ran `git init` (reinitialized safely).
- Reviewed and updated `.gitignore` (added comprehensive sections for deps, build, wrangler, env, OS/editor, etc.). It was already present but polished and included in commit.
- Staged everything relevant (new public/images/bmi/*.svg, new src/components/BmiScene3d.astro + BmiVisualGallery.astro, new src/lib/bmi.ts + src/scripts/*, plus all prior uncommitted edits to BmiCalculator, index, global.css, package, _headers, LAUNCH-CHECKLIST, etc.).
- Committed as `0f412e5 chore: initialize full repo state + commit BMI calculator MVP` (detailed message covering the entire feature set).
- Performed exhaustive code + doc + research audit (read every source file, configs, public assets, DESIGN/AGENTS/skills, ../bmi-research/, package, etc.). Verified `npm run build` succeeds (9 pages).
- Created structured `wiki/` following exact pattern from user's other projects (forma-3d-theme/wiki with numbered MDs + index; DhanSetu/wiki with index/log + concepts/entities/sources/synthesis). Explicitly calls out "Follows Karpathy's LLM Wiki pattern".
  - wiki/index.md
  - wiki/00-overview.md
  - wiki/01-architecture.md
  - wiki/02-design-implementation.md
  - wiki/03-research.md
  - wiki/log.md (this file)
- Updated root README.md to surface WIKI.md (and now wiki/).
- Created/updated root WIKI.md initially as comprehensive flat version, then adapted content into the structured wiki/ files. Root WIKI.md now acts as pointer + legacy mirror.
- Final small commit for README + wiki structure.
- Working tree clean. 4 commits total now (initial scaffold + big MVP state + wiki creation + pointer).

**Key realizations during understanding**:
- "carpathy" = **Karpathy** (Andrej Karpathy's LLM Wiki / project notebook pattern for perfect context retention with coding agents/LLMs across long sessions). Confirmed by explicit text in shopify/forma-3d-theme/wiki/index.md: "Follow Karpathy's LLM Wiki pattern."
- The project was in a "dirty but advanced" state (lots of post-initial-commit work uncommitted). Consolidating commit + wiki addresses exactly the user's request.
- Full feature completeness for local MVP: calculator is production-grade interactive, visuals are delightful and synced, SEO/AdSense hygiene is thorough, design tokens + dark mode clean.

**Next per checklists**: wrangler login + deploy to preview (update _headers with the real pages.dev host), then domain only after happy local + preview test on phone, then GSC etc.

**Wiki maintenance note**: This log entry + the 00-03 files were synthesized directly from the full repo audit + existing DESIGN/AGENTS/research docs. Future sessions must append here and patch the relevant numbered file when knowledge changes.

---

## Future entries
(Append new dated blocks here with what was done, decisions, new knowledge from Narayan, status deltas, etc.)
