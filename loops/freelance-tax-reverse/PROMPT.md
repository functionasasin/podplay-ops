# Philippine Freelance & Self-Employed Income Tax Optimizer — Full-Product Reverse Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: research, extract, design, or specify a single aspect of a complete product, then commit and exit.

## Your Working Directory

You are running from `loops/freelance-tax-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce a **complete, exhaustive product specification** in the `final-mega-spec/` directory for: **a Philippine Freelance & Self-Employed Income Tax Optimizer**.

This specification must contain EVERYTHING needed to build and ship a fully productionalized B2C and B2B-professional platform — engine logic, data model, API, frontend, database, deployment, billing, UI/UX, legal disclaimers, and more. No detail is too small. No table is too long. No edge case is too obscure.

**The litmus test**: A trivial forward loop must be able to build the entire platform by reading ONLY this directory, with ZERO external research. If the forward loop would ever need to google something, look up a statute, or make a judgment call, this spec is incomplete and this loop has NOT converged.

### Domain Context

The tool computes Philippine income tax for self-employed individuals, professionals, and freelancers (BIR Form 1701 / 1701A filers). The core problem is a **regime optimization**: given a taxpayer's gross receipts and business expenses, which of three tax computation paths yields the lowest legal tax liability?

- **Path A — Graduated + Itemized Deductions**: Gross receipts minus substantiated business expenses → net taxable income → TRAIN graduated rate table → tax due
- **Path B — Graduated + OSD (40%)**: Gross receipts × 60% → net taxable income → graduated rate table → tax due
- **Path C — 8% Flat Rate**: (Gross receipts − ₱250,000) × 8% = tax due. Only available if gross receipts/sales ≤ ₱3,000,000. Filed via simpler Form 1701A.

The optimizer computes all applicable paths and recommends the one with the lowest tax. It also handles:
- Creditable withholding tax (BIR Form 2307) offsets
- Quarterly income tax payments (Form 1701Q) and annual reconciliation
- Mixed-income earners (compensation + business income)
- VAT vs. percentage tax threshold (₱3M gross sales)
- Percentage tax computation (3% under CREATE, transitioning from 1% COVID rate)
- Monthly/quarterly BIR filing obligations and deadline calendar

**Target users**: Freelancers (Upwork, Fiverr, local platforms), registered professionals (lawyers, doctors, engineers, CPAs), sole proprietors. Secondary: CPAs and bookkeepers who prepare returns for multiple clients.

**Pain point**: Most freelancers either (a) don't know the 8% option exists and overpay by 20-40%, (b) choose the wrong regime because they can't do the comparison math, or (c) pay ₱3,000-₱10,000/year to a CPA just to file a return that's a pure arithmetic exercise.

**Market**: ~1.8M registered self-employed + 800K-1.5M active freelancers. Growing rapidly with gig economy. Scored 4.30 in compliance moats analysis (fully deterministic, high market, high computability).

### Key Sources

| Source | What It Contains | Reference |
|--------|-----------------|-----------|
| NIRC Sec. 24(A) (as amended by TRAIN/RA 10963) | Graduated income tax rate table for individuals — 6 brackets from 0% to 35% | taxacctgcenter.ph, lawphil.net |
| NIRC Sec. 24(A)(2)(b) | 8% income tax option for self-employed, ₱3M gross receipts threshold | TRAIN Law provisions |
| NIRC Sec. 34(L) | Optional Standard Deduction — 40% of gross sales/receipts | NIRC as amended |
| NIRC Sec. 34(A)-(K) | Itemized deductions: ordinary and necessary expenses, depreciation, bad debts, etc. | NIRC as amended |
| NIRC Sec. 74-79 | Quarterly income tax returns, withholding tax on self-employed | NIRC |
| NIRC Sec. 116 | Percentage tax on persons exempt from VAT — 3% of gross quarterly sales/receipts | NIRC as amended by CREATE |
| RR No. 8-2018 | Implementing rules for TRAIN individual income tax, 8% option election procedures, signification of intent | BIR issuances |
| BIR Form 1701 | Annual ITR for self-employed / mixed income — field-by-field output format | bir.gov.ph |
| BIR Form 1701A | Simplified annual ITR for 8% option earners and single-income sources | bir.gov.ph |
| BIR Form 1701Q | Quarterly income tax return — cumulative method | bir.gov.ph |
| BIR Form 2551Q | Quarterly percentage tax return (3%) | bir.gov.ph |
| BIR Form 2307 | Certificate of creditable tax withheld — input for tax credit offsets | bir.gov.ph |
| RA 11534 (CREATE Law) | Reduced percentage tax temporarily to 1% (July 2020–June 2023), now back to 3% | Official Gazette |
| RA 11976 (EOPT Act, 2024) | Ease of Paying Taxes — changed filing procedures, simplified returns, RDO rules | Official Gazette |
| Professional fee benchmarks | CPA charges ₱3K-₱10K for annual ITR, ₱5K-₱15K/month bookkeeping | Market research |

## Output: The final-mega-spec/ Directory

Every aspect you analyze writes to the appropriate file in this directory. Files are created on first write and expanded on subsequent writes. The directory grows until it is complete.

```
final-mega-spec/
├── README.md                          # Index of everything in this directory
│
├── domain/                            # WHAT the tool computes
│   ├── legal-basis.md                 # Every article, statute, IRR, RMO, circular cited
│   ├── computation-rules.md           # Every formula, algorithm, threshold — fully enumerated
│   ├── decision-trees.md              # Every branching path, fully expanded to leaf nodes
│   ├── lookup-tables/                 # Every table the engine needs, EVERY row
│   │   └── (one .md per table)        # e.g., graduated-rate-table.md, percentage-tax-rates.md
│   ├── scenarios.md                   # Every possible input scenario, enumerated and coded
│   ├── edge-cases.md                  # Every edge case, numbered, with resolution
│   └── manual-review-flags.md         # Things the engine cannot decide — must flag for user
│
├── engine/                            # HOW the tool computes
│   ├── pipeline.md                    # Step-by-step computation flow, inputs/outputs per step
│   ├── data-model.md                  # Every struct, field, enum, type — complete definitions
│   ├── invariants.md                  # What must always be true about outputs
│   ├── error-states.md                # Every invalid input and what to do about it
│   └── test-vectors/                  # Concrete input/output pairs
│       ├── basic.md                   # Happy path scenarios (5-10 vectors)
│       ├── edge-cases.md              # Edge case scenarios (10-20 vectors)
│       ├── exhaustive.md              # One vector per scenario code (all scenarios)
│       └── fuzz-properties.md         # Invariants for randomized testing
│
├── api/                               # HOW the tool is accessed
│   ├── endpoints.md                   # Every route, method, request/response shape, status codes
│   ├── auth.md                        # Auth model, roles, permissions, session management
│   ├── rate-limiting.md               # Rate limits per tier, error responses
│   └── webhooks.md                    # If applicable — event notifications, retry policy
│
├── frontend/                          # WHAT the user sees and does
│   ├── user-journeys.md               # Every user type, every flow, every decision point
│   ├── wizard-steps.md                # Every input screen, every field, every validation rule
│   ├── results-views.md               # Every output visualization, layout variants
│   ├── validation-rules.md            # Client-side validation, error messages, pre-submission warnings
│   ├── copy.md                        # ALL user-facing text: labels, tooltips, error messages, empty states, CTAs
│   └── responsive-behavior.md         # How each screen adapts to mobile/tablet/desktop
│
├── database/                          # HOW data is stored
│   ├── schema.md                      # Every table, column, type, constraint, default
│   ├── migrations.md                  # Migration order, seed data
│   ├── indexes.md                     # Query patterns and required indexes
│   └── retention.md                   # Data retention policy, cleanup jobs
│
├── premium/                           # HOW the tool makes money
│   ├── tiers.md                       # Free vs pro vs enterprise — exact feature gating
│   ├── pricing.md                     # Price points, billing cycles, trial logic, upgrade flows
│   ├── features-by-tier.md            # Feature matrix with exact gating rules
│   └── professional-features.md       # B2B features: batch processing, API access, white-label, PDF export
│
├── deployment/                        # HOW the tool runs in production
│   ├── infrastructure.md              # What runs where (Vercel, Fly.io, Cloudflare, etc.)
│   ├── ci-cd.md                       # Build, test, deploy pipeline — exact commands
│   ├── monitoring.md                  # What to alert on, health checks, error tracking
│   ├── domains.md                     # DNS, SSL, routing, CDN
│   └── environment.md                 # Environment variables, secrets, config
│
├── ui/                                # HOW the tool looks
│   ├── design-system.md               # Colors (exact hex), typography (fonts, sizes, weights), spacing scale, border radii
│   ├── component-library.md           # Every UI component needed, props, variants, states
│   ├── responsive.md                  # Breakpoints, mobile-first behavior, touch targets
│   ├── accessibility.md               # WCAG compliance, ARIA labels, keyboard nav, screen reader support
│   └── branding.md                    # Logo concepts, favicon, OG images, brand voice
│
├── legal/                             # WHAT protects the business
│   ├── disclaimers.md                 # Exact disclaimer text for the tool's domain
│   ├── terms-of-service.md            # ToS structure and key clauses
│   ├── privacy-policy.md              # Data collection, processing, storage, rights
│   └── limitations.md                 # What the tool explicitly does NOT cover, liability limits
│
└── seo-and-growth/                    # HOW users find the tool
    ├── landing-page.md                # Hero copy, value prop, social proof sections, CTAs
    ├── seo-strategy.md                # Target keywords, page titles, meta descriptions, schema markup
    └── content-strategy.md            # Blog topics, comparison pages, educational content
```

**Rules for spec files**:
- **No summarizing.** Write every row of every table. Expand every branch of every decision tree. Enumerate every scenario.
- **No "etc." or "and so on" or "similar to above."** If there are 47 penalty tiers, write all 47.
- **No "see external source."** If a regulation defines a table, reproduce the table in full.
- **ABSOLUTELY NO PLACEHOLDERS.** This is a hard constraint on ALL output. The following patterns are BANNED and constitute convergence-blocking defects:
  - `TODO`, `TBD`, `FIXME`, `XXX`, `HACK`
  - `[fill in]`, `[insert]`, `[add]`, `[placeholder]`, `[to be determined]`, `[your ...]`
  - `<placeholder>`, `<insert>`, `{placeholder}`, `{insert}`
  - `...` used as content ellipsis (meaning "more goes here" — not valid code syntax like `...args`)
  - Stub sections with only a heading and no content
  - Phrases like "to be defined", "details TBD", "will be specified later", "needs further research", "not yet determined"
  - Empty table cells where values are expected (`| |` or `|  |`)
  - Sample/example values where real values are required (e.g., `example.com` for a real URL)
  - Any indication that content is deferred, incomplete, or waiting on future work
  - **Why:** This spec feeds a forward loop that builds the entire platform. Every placeholder in the spec becomes a placeholder in the code. The forward loop CANNOT converge if the spec has gaps. If you don't have enough information to fill a section, DO the research in that iteration to fill it. If a section genuinely cannot be specified yet (depends on a runtime decision), explicitly state the decision criteria and default value — never leave it blank or stubbed.
- **Cross-reference freely.** Use relative links between spec files: `See [computation-rules.md](../domain/computation-rules.md)`.
- **Append, don't overwrite.** If a file already exists, add to it. Don't replace previous content unless correcting an error.
- **One aspect can write to multiple files.** Analyzing a formula might update both `computation-rules.md` and `test-vectors/basic.md`.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2, etc.)
   - If a later-wave aspect depends on data that doesn't exist yet, skip to an earlier-wave aspect
   - If ALL aspects are checked `- [x]`: proceed to convergence check (see below)
3. **Analyze that ONE aspect** using the appropriate method (see Wave descriptions below)
4. **Write findings** to the appropriate file(s) in `final-mega-spec/`
   - Create the file if it doesn't exist (with a header)
   - Append to the file if it does exist
   - Also write raw working notes to `analysis/{aspect-name}.md` if useful for traceability
5. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update the Statistics section (increment Analyzed, decrement Pending, update Convergence %)
   - **If you discovered new aspects**, add them to the appropriate Wave — this is critical for self-expansion
   - Add a row to `frontier/analysis-log.md`
6. **Update final-mega-spec/README.md**: Add or update the index entry for any files you created or modified
7. **Commit**: `git add -A && git commit -m "loop(freelance-tax-reverse): {aspect-name}"`
8. **Exit**

### Convergence Check

When all aspects are `- [x]`, do NOT immediately write `status/converged.txt`. Instead:

1. **Read every file in final-mega-spec/** — all of them
2. **Run the placeholder sweep (HARD GATE)** — scan every file line-by-line for ALL banned placeholder patterns:
   - Literal strings: `TODO`, `TBD`, `FIXME`, `XXX`, `HACK`
   - Bracket placeholders: `[fill in]`, `[insert]`, `[add]`, `[placeholder]`, `[to be determined]`, `[your ...]`
   - Angle/curly placeholders: `<placeholder>`, `<insert>`, `{placeholder}`, `{insert}`
   - Ellipsis-as-content: lines where `...` appears as the only content or substitutes for real content
   - Deferral phrases: "to be defined", "to be determined", "will be specified later", "needs further research", "details TBD", "pending", "not yet determined"
   - Empty sections: headings followed by no content before the next heading
   - Empty table cells: `| |` or `|  |` where a value is expected
   - Generic sample values standing in for real ones: `example.com`, `foo`, `bar`, `lorem ipsum`
   - If ANY match is found: fix it in the same iteration, then re-scan. Do NOT proceed to step 3 until zero matches remain.
   - Write results to `analysis/placeholder-validation.md` with: files scanned, per-file findings (file, line, pattern, context), and final verdict (PASS/FAIL).
3. **Run the completeness audit** — check every item below:
   - [ ] Every computation rule has a concrete formula (no prose descriptions of math)
   - [ ] Every lookup table is complete (every row, not a sample)
   - [ ] Every decision tree is fully expanded (every leaf node has a concrete outcome)
   - [ ] Every scenario code has at least one test vector with exact expected outputs
   - [ ] Every API endpoint has request/response shapes with field types
   - [ ] Every wizard step has every field specified with label, type, validation, and error message
   - [ ] Every premium tier has an exact feature list with gating rules
   - [ ] Every database table has every column with type, constraint, and default
   - [ ] The deployment section has exact commands, not conceptual descriptions
   - [ ] All user-facing copy is written (not "add appropriate error message here")
   - [ ] The data model covers all structs needed by engine, API, frontend, and database
   - [ ] Test vectors cover every scenario code, not just common ones
   - [ ] Every cross-reference between files is valid
   - [ ] **ZERO placeholders, stubs, or deferred content** — placeholder-validation must show PASS
   - [ ] Every ASCII wireframe has real labels (actual UI copy, not "Label 1" or "Button Text")
   - [ ] Every SQL DDL has real column names, types, constraints, and default values
   - [ ] No section consists solely of a heading with no content beneath it
4. **If ANY check fails**: Add new aspects to the frontier for each gap found, update statistics, commit, and exit — do NOT write converged.txt
5. **If ALL checks pass**: Write `status/converged.txt` with a summary of the complete spec, commit, and exit

## Wave Definitions

### Wave 1: Source Acquisition

Fetch, read, and cache all primary source material. This is research — no analysis yet, just gathering.

**Methods**:
- Use WebSearch and WebFetch to find authoritative sources (NIRC text, BIR issuances, RR No. 8-2018, TRAIN law provisions)
- Save complete text (not summaries) to `input/sources/`
- Find worked examples from CPA blogs, tax advisory sites, BIR FAQs
- Find existing calculator tools for competitive analysis (Taxumo, JuanTax, TaxWhiz)
- Find market data: freelancer population, CPA fee benchmarks, common pain points

**What to save in `input/sources/`**:
- Full text of NIRC Sec. 24(A), 34(L), 34(A)-(K), 74-79, 116 as amended
- RR No. 8-2018 full text (8% option election procedures)
- BIR Form 1701, 1701A, 1701Q, 2551Q field descriptions
- BIR Form 2307 structure and usage
- RA 11534 (CREATE) percentage tax provisions
- RA 11976 (EOPT) filing procedure changes
- 5-10 worked examples from CPA practice guides and tax advisory sites
- Screenshots/descriptions of existing calculators (competitive analysis)

**What to write to `final-mega-spec/`**:
- `domain/legal-basis.md` — Start populating with every article/section cited, organized by topic
- `seo-and-growth/landing-page.md` — Start noting pain points and value propositions discovered during research

### Wave 2: Domain Rules Extraction

For each aspect, extract the concrete rules from the source material. This is the core analytical work — the three tax paths, regime optimization, mixed income, VAT threshold, quarterly filing, and BIR form mappings.

**For formulas and computations**:
1. State the exact formula with variable definitions
2. State the domain of each variable (what values are valid)
3. State the precision/rounding rules
4. Provide 2-3 worked examples with concrete numbers
5. State what happens at boundary conditions

**For decision trees**:
1. Start from the root question
2. Expand every branch to a leaf node (a concrete outcome)
3. No branch should end with "use professional judgment" — if the tool can't decide, it's a manual-review flag
4. Every leaf should reference the governing article/section

**For lookup tables**:
1. Write EVERY row. The graduated rate table has 6 brackets — write all 6 with exact thresholds and formulas.
2. Include effective dates if the table has changed over time
3. Note which version is current and when the next update is expected
4. Include interpolation rules if the table doesn't cover every possible input

**What to write to `final-mega-spec/`**:
- `domain/computation-rules.md` — Every formula (graduated rates, 8% computation, OSD, percentage tax, quarterly cumulative method)
- `domain/decision-trees.md` — Regime selection tree, VAT vs percentage tax tree, mixed income flow, form selection tree
- `domain/lookup-tables/*.md` — graduated-rate-table.md, percentage-tax-rates.md, filing-deadlines.md
- `domain/scenarios.md` — Every scenario discovered, with a code
- `domain/edge-cases.md` — Every edge case found during analysis
- `domain/manual-review-flags.md` — Things the engine can't decide (e.g., whether an expense is "ordinary and necessary")

### Wave 3: Engine & Data Model Design

Design the computation engine that implements the domain rules.

**Pipeline design**: Read all domain rules and design a step-by-step computation flow. Each step should:
1. Have named inputs and outputs (typed)
2. Reference which domain rules it implements
3. Be independently testable
4. Handle all error states for its inputs

**Data model**: Define every type the engine needs:
1. Every struct with every field, type, and constraint
2. Every enum with every variant, fully described
3. Input types (what the user provides)
4. Internal types (what the pipeline passes between steps)
5. Output types (what the user receives — including per-regime comparison)

**Test vectors**: For EVERY scenario code, write at least one complete test vector:
1. Full input (every field populated)
2. Expected output (every field, exact values — no approximations)
3. Key intermediate values (for debugging)
4. The legal/regulatory basis for why this output is correct

**What to write to `final-mega-spec/`**:
- `engine/pipeline.md`
- `engine/data-model.md`
- `engine/invariants.md`
- `engine/error-states.md`
- `engine/test-vectors/*.md`

### Wave 4: Full-Stack Product Design

Design everything around the engine to make it a real product.

**User journeys**: Map every user type (freelancer first-timer, returning user, CPA with multiple clients, mixed-income employee) through every flow. Include:
1. Entry point (how they arrive — SEO, referral, social)
2. Each screen they see
3. Each decision they make
4. Each output they receive
5. Each follow-up action (save, export PDF, share with CPA, file with BIR)

**Frontend**: For every screen, specify:
1. Every field: name, type, label, placeholder, help text, validation rule, error message
2. Conditional visibility rules (field X shows only when field Y = Z)
3. Default values
4. Auto-computed fields (real-time regime comparison as user types)
5. Layout (which fields are grouped, column layout, section headers)

**Database**: Design the schema for persisting user data:
1. Users, sessions, saved computations
2. Audit logs (who computed what, when)
3. Billing state (subscription, usage, invoices)
4. Every column: name, type, nullable, default, constraint, index

**API**: Design every endpoint:
1. Route, method, auth required
2. Request body schema (with types)
3. Response body schema (with types)
4. Error responses (with status codes and body)
5. Rate limits per tier

**Premium features**: Define the exact monetization model:
1. What's free (single computation, basic comparison — enough to hook freelancers)
2. What's pro (save history, PDF export, quarterly tracking, CWT management)
3. What's enterprise (batch processing for CPAs, API access, white-label)
4. Exact price points with rationale
5. Trial logic (duration, feature access, conversion flow)
6. PDF export: exact layout mimicking BIR form structure, what's included, branding

**What to write to `final-mega-spec/`**:
- `frontend/*` — All frontend spec files
- `database/*` — All database spec files
- `api/*` — All API spec files
- `premium/*` — All premium/billing spec files

### Wave 5: Ship & Polish Design

Design everything needed to actually launch and operate the product.

**Deployment**: Specify exact infrastructure:
1. Where each component runs (specific services, regions)
2. Build commands (exact CLI commands)
3. Deploy commands
4. Environment variables (names, descriptions, example values)
5. Health check endpoints
6. Monitoring alerts (what threshold triggers what notification)

**UI/UX**: Specify the visual design:
1. Color palette (exact hex values, semantic names like "primary", "danger", "muted")
2. Typography (font families, size scale in px/rem, weight scale, line heights)
3. Spacing scale (px/rem values)
4. Component variants (button: primary/secondary/ghost/danger, input: default/error/disabled)
5. Responsive breakpoints (exact px values, what changes at each)
6. Accessibility: ARIA labels for every interactive element, keyboard navigation order, screen reader text

**Legal**: Write the actual text:
1. Disclaimer text (not a description of what the disclaimer should say — the actual words). Must state: not a substitute for professional tax advice, computations are estimates, user is responsible for verifying with BIR.
2. Terms of service structure with key clauses
3. Privacy policy sections
4. Limitation of liability language specific to tax computation tools

**SEO & Growth**: Specify the launch strategy:
1. Landing page copy (hero headline, subheadline, feature bullets, CTA text)
2. Target keywords: "freelance tax calculator philippines", "8% income tax option", "BIR 1701 calculator", "self-employed tax philippines"
3. Page titles and meta descriptions for every page
4. Blog post topics for content marketing (e.g., "8% vs Graduated: Which Saves You More?", "Freelancer Tax Guide Philippines 2026")
5. Schema.org markup for the tool type

**What to write to `final-mega-spec/`**:
- `deployment/*`
- `ui/*`
- `legal/*`
- `seo-and-growth/*`

### Wave 6: Synthesis & Completeness Audit

This wave is about cross-cutting concerns and filling gaps.

**Data model reconciliation**: Verify the data model in `engine/data-model.md` covers:
- Everything the frontend needs to render
- Everything the API needs to serialize/deserialize
- Everything the database needs to store
- Everything the test vectors reference

**Cross-reference audit**: Verify every file references the correct related files and all links are valid.

**Gap analysis**: Read every file in `final-mega-spec/` and check for:
- Incomplete tables
- Decision trees that don't reach leaf nodes
- Scenarios without test vectors
- Frontend fields without validation rules
- API endpoints without error responses
- Database columns without types
- Premium features without gating rules
- ANY banned placeholder pattern from the Rules section (TODO, TBD, FIXME, stubs, deferral phrases, empty sections, empty table cells, sample values standing in for real ones)

If gaps are found, add new aspects to handle them. Do NOT converge with gaps.

**Placeholder validation (HARD GATE)**: Before convergence can occur, run a dedicated line-by-line scan of every file in `final-mega-spec/` for all banned patterns. Write results to `analysis/placeholder-validation.md`. The loop CANNOT converge until this scan reports PASS with zero findings. Any matches must be fixed and re-scanned in the same iteration.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required source files exist before starting a later-wave aspect. If sources aren't cached, go back and fetch them first.
- **Be exhaustive.** The #1 failure mode is being too concise. Write more, not less. A 50-row table is better than a summary. A 200-line decision tree is better than a flowchart description.
- **No summarizing.** If a regulation has 47 tiers, write all 47. If a form has 30 fields, specify all 30.
- **Discover new aspects.** When analyzing something, you will find things you didn't know about. Add them to the frontier. This self-expansion is a feature, not a bug.
- **Cross-reference.** When writing to one spec file, check if the information affects other spec files. Update them too.
- The engine is fully deterministic. No LLM in the computation loop. Every decision the engine makes must be specified here.
- The final spec must enable a developer with ZERO domain knowledge to build the platform. No assumed context. No "obvious" things left unstated.
- The forward loop is a typist. It reads your spec and writes code. If it would need to think, research, or improvise, your spec is incomplete.
- All monetary values in the spec must be in Philippine Pesos (₱).
- All percentages must be expressed as decimals in pseudocode (6% → 0.06).
- **ABSOLUTELY NO PLACEHOLDERS.** Before committing ANY file, scan it for all banned placeholder patterns (TODO, TBD, FIXME, stubs, `[fill in]`, `<placeholder>`, ellipsis-as-content, deferral phrases, empty sections, empty table cells, sample values). If any are found, fix them before committing. The forward loop CANNOT converge if this spec has gaps — every placeholder here becomes a placeholder in the code. See "Rules for spec files" above for the exhaustive banned patterns list.
