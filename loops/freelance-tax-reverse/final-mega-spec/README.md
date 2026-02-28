# Final Mega Spec — Philippine Freelance & Self-Employed Income Tax Optimizer

This directory contains the complete product specification. A forward loop can build the entire platform by reading ONLY this directory.

**Last updated:** 2026-02-28
**Convergence status:** IN PROGRESS (8/53 aspects analyzed)

---

## Index

### domain/ — What the tool computes

| File | Status | Description |
|------|--------|-------------|
| [domain/legal-basis.md](domain/legal-basis.md) | UPDATED | All statutes, regulations, circulars, forms cited; effective dates; scope boundaries. Expanded with full EOPT Act (RA 11976) provisions (14 key changes for self-employed, penalty tables, Micro/Small/Medium/Large classification), CREATE Act (RA 11534) Section 116 rate history and retroactivity, and all implementing regulations RR 3-2024 through RR 8-2024, RMC 60-2024, RMC 67-2021. |
| [domain/computation-rules.md](domain/computation-rules.md) | PARTIAL | CR-001 to CR-018: both rate tables (2018-2022 + 2023+), 3 path formulas, OSD base clarification, 8% eligibility, quarterly cumulative method, CWT mechanics, installment rule, breakeven analysis, EOPT taxpayer tier classification (CR-015), surcharge computation (CR-016), interest computation (CR-017), total penalty computation (CR-018) |
| domain/decision-trees.md | PENDING | Every branching path, fully expanded to leaf nodes |
| domain/lookup-tables/graduated-rate-table.md | PARTIAL | Both rate schedules included in computation-rules.md; dedicated file pending |
| domain/lookup-tables/percentage-tax-rates.md | PENDING | Section 116 rates by period |
| domain/lookup-tables/filing-deadlines.md | PENDING | All BIR deadlines by form and period |
| [domain/lookup-tables/taxpayer-classification-tiers.md](domain/lookup-tables/taxpayer-classification-tiers.md) | COMPLETE | 7 tables: tier thresholds, filing obligations by tier, penalty/interest rates by tier, classification rules and procedures, ₱3M triple coincidence boundary rules, EOPT filing simplifications, uniform deadline schedule |
| [domain/scenarios.md](domain/scenarios.md) | PARTIAL | 30+ scenario codes in 7 groups; to be expanded in scenario-enumeration aspect |
| [domain/edge-cases.md](domain/edge-cases.md) | INITIAL | EC-T01 through EC-T09 (taxpayer tier edge cases); additional groups (EC-E, EC-M, EC-Q, EC-C, EC-F) to be added in Wave 2 edge-cases aspect |
| domain/manual-review-flags.md | PENDING | Items the engine cannot decide (flags for user) |

### engine/ — How the tool computes

| File | Status | Description |
|------|--------|-------------|
| engine/pipeline.md | PENDING | Step-by-step computation flow with typed inputs/outputs |
| engine/data-model.md | PENDING | Every struct, enum, type — complete definitions |
| engine/invariants.md | PENDING | What must always be true about outputs |
| engine/error-states.md | PENDING | Every invalid input and engine response |
| engine/test-vectors/basic.md | PENDING | Happy path test vectors |
| engine/test-vectors/edge-cases.md | PENDING | Edge case test vectors |
| engine/test-vectors/exhaustive.md | PENDING | One vector per scenario code |
| engine/test-vectors/fuzz-properties.md | PENDING | Invariants for randomized testing |

### api/ — How the tool is accessed

| File | Status | Description |
|------|--------|-------------|
| api/endpoints.md | PENDING | Every route, method, request/response shape |
| api/auth.md | PENDING | Auth model, roles, permissions, sessions |
| api/rate-limiting.md | PENDING | Rate limits per tier, error responses |
| api/webhooks.md | PENDING | Event notifications (if applicable) |

### frontend/ — What the user sees

| File | Status | Description |
|------|--------|-------------|
| frontend/user-journeys.md | PENDING | Every user type, every flow |
| frontend/wizard-steps.md | PENDING | Every input field, validation, error message |
| frontend/results-views.md | PENDING | Every output visualization, layout |
| frontend/validation-rules.md | PENDING | Client-side validation |
| frontend/copy.md | PENDING | All user-facing text |
| frontend/responsive-behavior.md | PENDING | Mobile/tablet/desktop behavior |

### database/ — How data is stored

| File | Status | Description |
|------|--------|-------------|
| database/schema.md | PENDING | Every table, column, type, constraint |
| database/migrations.md | PENDING | Migration order, seed data |
| database/indexes.md | PENDING | Query patterns and indexes |
| database/retention.md | PENDING | Data retention policy |

### premium/ — How the tool makes money

| File | Status | Description |
|------|--------|-------------|
| premium/tiers.md | PENDING | Free vs pro vs enterprise feature gating |
| premium/pricing.md | PENDING | Price points, billing, trial logic |
| premium/features-by-tier.md | PENDING | Feature matrix with gating rules |
| premium/professional-features.md | PENDING | B2B features: batch, API, PDF, white-label |

### deployment/ — How the tool runs in production

| File | Status | Description |
|------|--------|-------------|
| deployment/infrastructure.md | PENDING | What runs where |
| deployment/ci-cd.md | PENDING | Build/test/deploy pipeline |
| deployment/monitoring.md | PENDING | Alerts, health checks, error tracking |
| deployment/domains.md | PENDING | DNS, SSL, CDN |
| deployment/environment.md | PENDING | Environment variables, secrets |

### ui/ — How the tool looks

| File | Status | Description |
|------|--------|-------------|
| ui/design-system.md | PENDING | Colors (hex), typography, spacing, radii |
| ui/component-library.md | PENDING | Every UI component, props, variants |
| ui/responsive.md | PENDING | Breakpoints, mobile-first behavior |
| ui/accessibility.md | PENDING | WCAG, ARIA, keyboard nav |
| ui/branding.md | PENDING | Logo, favicon, OG images, brand voice |

### legal/ — What protects the business

| File | Status | Description |
|------|--------|-------------|
| legal/disclaimers.md | PENDING | Exact disclaimer text |
| legal/terms-of-service.md | PENDING | ToS key clauses |
| legal/privacy-policy.md | PENDING | Data collection, storage, rights |
| legal/limitations.md | PENDING | Explicit scope limits, liability |

### seo-and-growth/ — How users find the tool

| File | Status | Description |
|------|--------|-------------|
| [seo-and-growth/landing-page.md](seo-and-growth/landing-page.md) | INITIAL DRAFT | Pain points, value prop, CTAs, competitor positioning, social proof stats, market sizing by income tier, demographic profile, urgency drivers, social proof elements — from competitive + market research; to be fully expanded in Wave 5 |
| [seo-and-growth/seo-strategy.md](seo-and-growth/seo-strategy.md) | INITIAL DRAFT | 14 target keywords with current owners, 10 priority blog topics, schema markup, domain strategy, competitive SEO notes — from competitive research; to be expanded in Wave 5 |
| [seo-and-growth/content-strategy.md](seo-and-growth/content-strategy.md) | INITIAL DRAFT | 4 user personas, 20 blog post topics with keywords/word counts, 3 pillar pages, social media strategy (Facebook/TikTok/YouTube), 6-month content calendar, CPA partner program, seasonal campaign calendar, performance KPIs — from market-research aspect |
