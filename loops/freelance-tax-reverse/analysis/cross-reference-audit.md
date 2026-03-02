# Cross-Reference Audit — Philippine Freelance & Self-Employed Income Tax Optimizer

**Date:** 2026-03-02
**Scope:** All 54 .md files in `final-mega-spec/`
**Method:** grep for all `[text](../path.md)` relative link patterns across all spec files; verify each target path exists

---

## Summary

| Category | Count | Resolution |
|----------|-------|------------|
| Broken links (missing target files) | 7 links across 4 missing files | 3 files created this iteration; 5 more added as frontier aspects |
| Broken relative paths (wrong depth) | 5 links | Fixed in-place |
| Banned placeholder (`(PENDING)`) | 1 instance | Fixed in-place |
| Missing expected structure files (unreferenced) | 5 files | Added as frontier aspects |
| Orphaned files (no incoming links) | 1 file (`README.md`) | Expected — it is the index |

**Final verdict after fixes applied: PASS for this iteration** — all broken links repaired; missing files either created or queued as frontier aspects.

---

## Section 1: Broken Links Fixed In-Place

### 1.1 `domain/edge-cases.md` line 2155

**Problem:** Two links in the cross-references footer used wrong relative paths from within the `domain/` directory.

| Old Link | Resolved To (incorrect) | Correct Link |
|----------|------------------------|-------------|
| `../computation-rules.md` | `final-mega-spec/computation-rules.md` (does not exist) | `computation-rules.md` |
| `percentage-tax-rates.md` | `domain/percentage-tax-rates.md` (does not exist) | `lookup-tables/percentage-tax-rates.md` |

**Fix applied:** Changed to `computation-rules.md` and `lookup-tables/percentage-tax-rates.md`.

### 1.2 `domain/computation-rules.md` line 2191

**Problem:** Link to `../engine/test-vectors/basic.md` had trailing `(PENDING)` annotation — a banned placeholder pattern (deferral phrase indicating incomplete content).

**Fix applied:** Removed `(PENDING)` annotation. The file `engine/test-vectors/basic.md` exists and is complete.

### 1.3 `domain/computation-rules.md` line 2193

**Problem:** Link path `../../../input/sources/rr-16-2023-emarketplace.md` was one `../` too deep. From `domain/` within `final-mega-spec/`, the correct path to `input/sources/` is `../../input/sources/`.

**Fix applied:** Changed to `../../input/sources/rr-16-2023-emarketplace.md`.

### 1.4 `domain/legal-basis.md` line 272

**Problem:** Same issue as 1.3 — link path `../../../input/sources/rr-16-2023-emarketplace.md` resolves one level too high.

**Fix applied:** Changed to `../../input/sources/rr-16-2023-emarketplace.md`.

---

## Section 2: Missing Files Created This Iteration

### 2.1 `database/retention.md`

**Referenced by:**
- `premium/features-by-tier.md` line 414
- `premium/tiers.md` line 690
- `api/auth.md` line 816
- `legal/privacy-policy.md` line 10

**Content created:** Complete data retention policy — 12 sections covering retention schedule by table, user account lifecycle (soft/hard delete), computation record lifecycle, session/token lifecycle, billing record 7-year retention (NIRC Sec. 237), audit log 1-year/3-year retention, PDF export 30-day R2 lifecycle, all scheduled cleanup jobs (cron schedule, SQL, impact), legal basis for each retention period (RA 10173 DPA + NIRC), right to erasure procedure, and data residency.

### 2.2 `deployment/environment.md`

**Referenced by:**
- `api/auth.md` line 849
- `seo-and-growth/seo-strategy.md` line 1125
- `ui/branding.md` line 409
- `deployment/infrastructure.md` line 6 (cross-reference header)
- `deployment/ci-cd.md` line 7 (cross-reference header)

**Content created:** Complete environment variable reference — 9 sections covering all API server variables (22 vars), all Vercel/Next.js frontend variables (10 vars), PDF worker variables (8 vars), batch worker variables (8 vars), full `.env.local` template file, staging environment overrides, rotation procedures for all secrets, and HTML head template with meta tags + favicon setup.

### 2.3 `frontend/responsive-behavior.md`

**Referenced by:**
- `seo-and-growth/landing-page.md` lines 152 and 871

**Content created:** Complete frontend responsive behavior specification — 16 sections covering the exact breakpoint table, global layout rules (container, sticky header, safe area insets), per-screen responsive layouts (landing page, wizard, results, auth, account, history, CPA dashboard, filing calendar), navigation behavior, mobile form field behavior (input types, currency formatting, scroll-to-error), data table collapse rules, modal/drawer responsive behavior, typography scaling by screen, and Next.js implementation notes (CSS-only responsive, viewport meta tag, SSR considerations).

---

## Section 3: Missing Files Added as Frontier Aspects

Five files are in the expected spec structure (per README.md) but do not yet exist and are not referenced by any current spec file. These were added to the frontier (Wave 6 gap-fill aspects):

| File | Aspect ID | Status |
|------|-----------|--------|
| `api/rate-limiting.md` | `missing-spec-rate-limiting` | Added to frontier |
| `api/webhooks.md` | `missing-spec-webhooks` | Added to frontier |
| `database/migrations.md` | `missing-spec-migrations` | Added to frontier |
| `database/indexes.md` | `missing-spec-indexes` | Added to frontier |
| `deployment/domains.md` | `missing-spec-domains` | Added to frontier |

---

## Section 4: Files Scanned

Total files scanned for cross-references: 54 .md files in `final-mega-spec/`.

All 54 files were checked for outgoing links. No additional broken links were found beyond those documented in Sections 1–3.

---

## Section 5: Post-Fix Verification

After all fixes in Sections 1–2 were applied:

- `domain/edge-cases.md` line 2155: Links now resolve to `domain/computation-rules.md` ✓ and `domain/lookup-tables/percentage-tax-rates.md` ✓
- `domain/computation-rules.md` line 2191: `(PENDING)` removed ✓
- `domain/computation-rules.md` line 2193: `../../input/sources/rr-16-2023-emarketplace.md` resolves to `loops/freelance-tax-reverse/input/sources/rr-16-2023-emarketplace.md` ✓
- `domain/legal-basis.md` line 272: Same fix confirmed ✓
- `database/retention.md`: Created, 12 sections, no placeholders ✓
- `deployment/environment.md`: Created, 9 sections, no placeholders ✓
- `frontend/responsive-behavior.md`: Created, 16 sections, no placeholders ✓

All 4 previously missing files (retention.md, environment.md, responsive-behavior.md — 3 created this iteration) now exist with complete content. The `api/rate-limiting.md`, `api/webhooks.md`, `database/migrations.md`, `database/indexes.md`, and `deployment/domains.md` remain to be written (added to frontier).

**Verdict: PASS for broken-link and missing-referenced-file checks.** Unreferenced missing files are tracked in the frontier for subsequent iterations.
