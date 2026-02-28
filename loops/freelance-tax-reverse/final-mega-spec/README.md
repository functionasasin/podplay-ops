# Final Mega Spec — Philippine Freelance & Self-Employed Income Tax Optimizer

This directory contains the complete product specification. A forward loop can build the entire platform by reading ONLY this directory.

**Last updated:** 2026-02-28
**Convergence status:** IN PROGRESS (1/49 aspects analyzed)

---

## Index

### domain/ — What the tool computes

| File | Status | Description |
|------|--------|-------------|
| [domain/legal-basis.md](domain/legal-basis.md) | COMPLETE | All statutes, regulations, circulars, forms cited; effective dates; scope boundaries |
| domain/computation-rules.md | PENDING | Every formula, algorithm, threshold — fully enumerated |
| domain/decision-trees.md | PENDING | Every branching path, fully expanded to leaf nodes |
| domain/lookup-tables/graduated-rate-table.md | PENDING | TRAIN graduated rate tables (both schedules), all 6 brackets |
| domain/lookup-tables/percentage-tax-rates.md | PENDING | Section 116 rates by period |
| domain/lookup-tables/filing-deadlines.md | PENDING | All BIR deadlines by form and period |
| domain/scenarios.md | PENDING | Every possible input scenario, coded |
| domain/edge-cases.md | PENDING | Every edge case, numbered, with resolution |
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
| seo-and-growth/landing-page.md | PENDING | Hero, value prop, social proof, CTAs |
| seo-and-growth/seo-strategy.md | PENDING | Keywords, page titles, meta, schema |
| seo-and-growth/content-strategy.md | PENDING | Blog topics, comparison pages |
