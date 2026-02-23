# Reverse Ralph Loop — Philippine Estate Tax Engine Spec Generator

> A ralph-style analysis loop that reads Philippine estate tax laws (NIRC, Revenue Regulations, BIR Form 1801) and outputs a complete software specification for a deterministic computation engine.

**Status**: Draft
**Created**: 2026-02-23
**Related**: [[estate-tax-calculator]]

---

## Table of Contents

1. [Overview](#overview)
2. [Reference Material (The "Video")](#reference-material-the-video)
3. [Loop Architecture](#loop-architecture)
4. [Frontier Seeding & Analysis Aspects](#frontier-seeding--analysis-aspects)
5. [Spec Output Format](#spec-output-format)
6. [Architecture Decision: Deterministic vs Agentic](#architecture-decision-deterministic-vs-agentic)
7. [Practical Considerations](#practical-considerations)

---

## Overview

### What This Is

A **reverse ralph loop** that analyzes Philippine estate tax legal sources and outputs a **complete software specification** for a deterministic computation engine. The engine takes structured estate data as input and produces the complete BIR Form 1801 computation as output.

### The Ralph Loop Pattern

Each iteration:
1. Reads the frontier of analysis aspects
2. Picks ONE legal provision/rule to analyze
3. Reads the relevant legal text (fetches from web or reads cached local copy)
4. Extracts the computation rule, conditions, thresholds, and edge cases
5. Writes structured findings to `analysis/{aspect-name}.md`
6. Updates the frontier (marks done, adds newly-discovered aspects)
7. Commits and exits

### Why This Works for Tax Law

The anime recap reverse loop extracted a "formula" from artistic content — timing, pacing, style. Estate tax is **easier** because:

- The rules are already explicit and written down (no interpretation of artistic choices)
- The computation is fully deterministic (6% × net estate, period)
- The output format is defined by BIR (Form 1801 fields ARE the output schema)
- Edge cases are enumerated in the law (property regimes, residency types, vanishing deduction tiers)
- Test vectors can be constructed from sample computations in legal commentaries

The reverse loop's job is to **systematically extract** every rule, map it to a computation node, identify all edge cases, and produce a spec so complete that a developer who has never read the NIRC can implement the engine.

### Inputs & Outputs

**Input**: Legal sources (see Reference Material section below)

**Output**: A complete software spec at `docs/plans/estate-tax-engine-spec.md` that describes:
- Complete data model (all entity types, relationships)
- Computation pipeline (input → gross estate → deductions → net estate → tax due)
- Every rule with its NIRC/RR section reference
- Decision trees for all classification logic
- Test vectors from sample computations
- Edge cases with legal citations

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Engine type | Fully deterministic | Tax computation must be auditable and reproducible — no LLM in the loop |
| Output scope | Core logic only | No frontend, no file I/O — pure computation module |
| Legal baseline | TRAIN Law (RA 10963, eff. Jan 2018) | Current law; pre-TRAIN graduated rates are historical only |
| Property regimes | ACP, CPG, Complete Separation | All three must be supported — they affect gross estate composition |
| Residency types | Citizen, Resident Alien, Non-Resident Alien | Each has different inclusion/deduction rules |
| Penalty computation | Include | Late filing surcharge + interest are part of Form 1801 |
| Estate tax amnesty | Exclude | Amnesty period ended June 2025; not part of regular computation |
| Language | Spec is language-agnostic | Spec describes logic, not implementation language |

---

## Reference Material (The "Video")

Unlike the anime loop where the reference is a single video file, here the "reference material" is a corpus of legal texts. The loop fetches and caches these on first access.

### Primary Sources

| Source | What It Contains | URL / Location |
|--------|-----------------|----------------|
| NIRC Sections 84-97 (as amended by RA 10963) | Core estate tax provisions — rate, gross estate, deductions, exemptions, filing, payment | `https://taxacctgcenter.ph/nirc-ra-8424-amended-title-iii-chapter-i-estate-tax-philippines/` |
| Revenue Regulation No. 12-2018 | Consolidated implementing rules for estate tax under TRAIN | `https://www.pwc.com/ph/en/tax-alerts/assets/2018/RR%20No%2012-2018.pdf` |
| BIR Form 1801 (Jan 2018 ENCS) | The actual return form — defines output fields and schedules | `https://bir-cdn.bir.gov.ph/local/pdf/1801_Jan%202018%20ENCS.pdf` |
| BIR Form 1801 Guidelines | Official field-by-field instructions | `https://bir-cdn.bir.gov.ph/local/pdf/1801%20GL%20%20final_rev.pdf` |

### Secondary Sources (for validation & edge cases)

| Source | What It Contains |
|--------|-----------------|
| Family Code of the Philippines | Property regime rules (ACP default post-Aug 3, 1988; CPG for pre-Family-Code marriages) |
| BIR RMC 103-2019 | Historical deduction tables (useful for understanding evolution, not for current computation) |
| Legal commentaries (Respicio, ASG Law, KPMG, PwC, Grant Thornton) | Sample computations, practical interpretations, edge cases |
| CPA board exam materials | Vanishing deduction step-by-step computation examples |

### Pre-Research Summary

From web research already conducted, here is the domain knowledge baseline:

#### Tax Rate
- Flat **6%** on net estate (NIRC Sec. 84, as amended by RA 10963)
- Effective for deaths on or after January 1, 2018
- If net estate ≤ ₱200,000 → no tax

#### Gross Estate (Sec. 85)
- **Citizens/Residents**: All property worldwide (real, personal, tangible, intangible)
- **Non-Resident Aliens**: Only Philippine-situated property (with reciprocity rule for intangibles)
- Includes: transfers in contemplation of death, revocable transfers, general power of appointment, life insurance proceeds (if payable to estate or revocable beneficiary designation)
- Excludes: capital of surviving spouse, irrevocable life insurance to named beneficiary

#### Deductions (Sec. 86)

**Ordinary Deductions (for Citizens/Residents):**
1. Claims against the estate (debts, mortgages) — must be notarized; loans within 3 years of death need disposition proof
2. Claims against insolvent persons — insolvency must be proven
3. Unpaid taxes (income, property accrued before death)
4. Casualty/theft losses during estate settlement (uncompensated by insurance)
5. Vanishing deduction (property previously taxed within 5 years) — 100%/80%/60%/40%/20% scale
6. Transfers for public use (bequests to Philippine government)

**Special Deductions:**
1. Standard deduction: ₱5,000,000 (citizens/residents) or ₱500,000 (non-resident aliens)
2. Family home: up to ₱10,000,000 (with barangay certification, residents only)
3. Medical expenses: up to ₱500,000 (within 1 year before death)
4. RA 4917 benefits (amounts from employer due to death)
5. Net share of surviving spouse in conjugal/community property

**For Non-Resident Aliens:**
- Only ₱500,000 standard deduction
- Proportional deductions (Philippine assets / worldwide assets ratio)

#### Vanishing Deduction Formula
1. Start with value of previously-taxed property
2. Subtract mortgage payments made by present decedent on that property
3. Subtract proportionate share of ordinary deductions (initial basis / gross estate × ELIT deductions)
4. Multiply result by percentage based on elapsed time (100%/80%/60%/40%/20%)

#### Property Regimes
- **ACP (Absolute Community of Property)**: Default for marriages under Family Code (post-Aug 3, 1988). Most property is communal.
- **CPG (Conjugal Partnership of Gains)**: Default for Civil Code marriages (pre-Aug 3, 1988). Pre-marriage property stays exclusive; gains during marriage are conjugal.
- **Complete Separation**: By prenuptial agreement. Each spouse's property is exclusively theirs.

#### BIR Form 1801 Structure
- Page 1: Taxpayer info, decedent details, penalty computation
- Page 2: Tax computation (Exclusive | Conjugal/Communal | Total columns)
- Schedules 1-5: Real property, family home, personal property, taxable transfers, business interests, ordinary deductions

#### Penalties
- 25% surcharge (simple late filing) or 50% (willful neglect/false return)
- Interest: double the legal interest rate (currently 12% p.a.) from original due date
- Compromise penalty (optional)

---

## Loop Architecture

### Directory Structure

```
/monorepo
├── loops/
│   └── estate-tax-reverse/              # The reverse ralph loop
│       ├── PROMPT.md                     # Loop prompt for Claude Code
│       ├── loop.sh                       # Standard loop runner (symlink to _template/loop.sh)
│       ├── input/
│       │   └── legal-sources/            # Cached legal text (fetched on first run)
│       │       ├── nirc-title-iii.md     # NIRC Sections 84-97
│       │       ├── rr-12-2018.md         # Revenue Regulation 12-2018
│       │       ├── bir-form-1801.md      # Form 1801 field descriptions
│       │       └── form-1801-guidelines.md # Official BIR guidelines
│       ├── analysis/                     # One .md per analyzed legal provision
│       │   ├── tax-rate.md
│       │   ├── gross-estate-citizens.md
│       │   ├── gross-estate-nonresident.md
│       │   ├── deduction-standard.md
│       │   ├── deduction-family-home.md
│       │   ├── deduction-vanishing.md
│       │   ├── property-regime-acp.md
│       │   └── ...
│       ├── frontier/
│       │   ├── aspects.md                # Analysis queue
│       │   └── analysis-log.md           # Iteration history
│       └── status/
│           └── (converged.txt when done)
│
├── docs/plans/
│   └── estate-tax-engine-spec.md         # Final output: the software spec
│
├── entities/ideas/
│   └── estate-tax-calculator.md          # Idea entity
```

### One Iteration = One Legal Provision

| Iter | Aspect | Method | Output |
|------|--------|--------|--------|
| 1 | `legal-source-fetch` | WebFetch + cache | `input/legal-sources/*.md` |
| 2 | `form-1801-field-mapping` | Read form + guidelines | `analysis/form-1801-fields.md` |
| 3 | `tax-rate-rule` | Read NIRC Sec. 84 | `analysis/tax-rate.md` |
| 4 | `gross-estate-citizens` | Read NIRC Sec. 85 | `analysis/gross-estate-citizens.md` |
| 5 | `gross-estate-nonresident` | Read NIRC Sec. 85(B) | `analysis/gross-estate-nonresident.md` |
| 6 | `gross-estate-inclusions` | Read Sec. 85 (transfers, life insurance, powers) | `analysis/gross-estate-inclusions.md` |
| 7 | `deduction-elit` | Read Sec. 86(A)(1) | `analysis/deduction-elit.md` |
| 8 | `deduction-vanishing` | Read Sec. 86(A)(2) | `analysis/deduction-vanishing.md` |
| 9 | `deduction-public-transfers` | Read Sec. 86(A)(3) | `analysis/deduction-public-transfers.md` |
| 10 | `deduction-standard` | Read Sec. 86(A)(4) | `analysis/deduction-standard.md` |
| 11 | `deduction-family-home` | Read Sec. 86(A)(5) | `analysis/deduction-family-home.md` |
| 12 | `deduction-medical` | Read Sec. 86(A)(7) | `analysis/deduction-medical.md` |
| 13 | `deduction-ra4917` | Read Sec. 86(A)(8) | `analysis/deduction-ra4917.md` |
| 14 | `surviving-spouse-share` | Read Sec. 86(A)(9) + Family Code | `analysis/surviving-spouse-share.md` |
| 15 | `property-regime-acp` | Read Family Code | `analysis/property-regime-acp.md` |
| 16 | `property-regime-cpg` | Read Family Code | `analysis/property-regime-cpg.md` |
| 17 | `property-regime-separation` | Read Family Code | `analysis/property-regime-separation.md` |
| 18 | `nonresident-deductions` | Read Sec. 86(B)-(D) | `analysis/nonresident-deductions.md` |
| 19 | `exemptions` | Read Sec. 87 | `analysis/exemptions.md` |
| 20 | `filing-rules` | Read Sec. 90 | `analysis/filing-rules.md` |
| 21 | `penalty-computation` | Read Sec. 248-249 | `analysis/penalty-computation.md` |
| 22 | `tax-credits` | Read Sec. 86(D) | `analysis/tax-credits.md` |
| 23 | `valuation-rules` | Read RR 12-2018 | `analysis/valuation-rules.md` |
| 24 | `asset-classification` | Synthesize from Sec. 85 + Form 1801 schedules | `analysis/asset-classification.md` |
| 25 | `computation-pipeline` | Synthesize all analysis → pipeline diagram | `analysis/computation-pipeline.md` |
| 26 | `data-model` | Synthesize all analysis → entity/type definitions | `analysis/data-model.md` |
| 27 | `test-vectors` | Extract sample computations from commentaries | `analysis/test-vectors.md` |
| 28 | `edge-cases` | Synthesize edge cases from all analysis | `analysis/edge-cases.md` |
| ... | (emergent aspects) | varies | ... |
| N-1 | `spec-draft` | Synthesize all analysis → spec | `docs/plans/estate-tax-engine-spec.md` |
| N | `spec-review` | Self-review: can a dev build this? | converged or loops back |

---

## Frontier Seeding & Analysis Aspects

### Seed Frontier

```markdown
# Analysis Frontier

## Statistics
- Total aspects discovered: 28
- Analyzed: 0
- Pending: 28
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
- [ ] legal-source-fetch — Fetch and cache all primary legal sources as markdown
- [ ] form-1801-field-mapping — Map every field/schedule in BIR Form 1801 to its data source

### Wave 2: Rule Extraction (one per NIRC section)
- [ ] tax-rate-rule — Sec. 84: 6% flat rate, ₱200K exemption threshold
- [ ] gross-estate-citizens — Sec. 85(A): property included for citizens/residents
- [ ] gross-estate-nonresident — Sec. 85(B): property included for non-resident aliens
- [ ] gross-estate-inclusions — Sec. 85(C-G): transfers in contemplation of death, revocable transfers, life insurance, powers of appointment
- [ ] deduction-elit — Sec. 86(A)(1): expenses, losses, indebtedness, taxes
- [ ] deduction-vanishing — Sec. 86(A)(2): property previously taxed (full formula + percentage table)
- [ ] deduction-public-transfers — Sec. 86(A)(3): bequests to government for public use
- [ ] deduction-standard — Sec. 86(A)(4): ₱5M standard deduction
- [ ] deduction-family-home — Sec. 86(A)(5): up to ₱10M with conditions
- [ ] deduction-medical — Sec. 86(A)(7): up to ₱500K within 1 year
- [ ] deduction-ra4917 — Sec. 86(A)(8): employer death benefits
- [ ] surviving-spouse-share — Sec. 86(A)(9): net share in conjugal/community property
- [ ] property-regime-acp — Family Code: Absolute Community of Property rules
- [ ] property-regime-cpg — Family Code: Conjugal Partnership of Gains rules
- [ ] property-regime-separation — Complete Separation of Property rules
- [ ] nonresident-deductions — Sec. 86(B)-(D): proportional deductions and foreign tax credits
- [ ] exemptions — Sec. 87: exempt transfers (usufruct, fiduciary, charitable)
- [ ] filing-rules — Sec. 90: deadlines, CPA requirements, extensions
- [ ] penalty-computation — Sec. 248-249: surcharges, interest calculation
- [ ] tax-credits — Foreign estate tax credits, prior payments
- [ ] valuation-rules — RR 12-2018: FMV determination (zonal vs assessed, which is higher)

### Wave 3: Synthesis
- [ ] asset-classification — Decision tree for classifying assets into Form 1801 schedules
- [ ] computation-pipeline — End-to-end computation flow diagram
- [ ] data-model — Complete entity/type definitions for the engine
- [ ] test-vectors — Sample computations with expected results from legal commentaries
- [ ] edge-cases — Catalog of edge cases with legal citations
- [ ] spec-draft — Synthesize all analysis into the complete software spec
- [ ] spec-review — Self-review: can a developer with no context build the engine from this?

## Recently Analyzed
(empty)
```

### Emergent Discovery

| While Analyzing... | Might Discover... |
|---|---|
| `gross-estate-inclusions` | `life-insurance-classification` — when proceeds are taxable vs excluded |
| `deduction-vanishing` | `vanishing-deduction-mortgage-offset` — detailed mortgage payment reduction rules |
| `property-regime-acp` | `acp-exclusions` — property excluded from community under ACP |
| `property-regime-cpg` | `cpg-fruits-of-exclusive` — how income from exclusive property becomes conjugal |
| `surviving-spouse-share` | `renunciation-donor-tax` — donor's tax implication of spousal renunciation |
| `penalty-computation` | `installment-payment-rules` — 2-year installment provisions |
| `filing-rules` | `multiple-decedent-computation` — chained deaths, successive estates |
| `nonresident-deductions` | `tax-treaty-overrides` — bilateral treaty provisions that modify standard rules |
| `asset-classification` | `bank-deposit-6pct-withholding` — special rule for bank deposits already subjected to 6% final withholding |
| `valuation-rules` | `shares-valuation-listed-vs-unlisted` — different valuation methods |

### Convergence Criteria

The loop converges when ALL of:
1. **Frontier exhausted** — all aspects analyzed or judged unnecessary
2. **Discovery rate collapses** — last 3+ iterations discovered 0 new aspects
3. **Spec passes self-review** — "Could a developer with no tax knowledge build the engine from this spec alone?"
4. **Test vectors pass** — sample computations in the spec produce correct results when manually traced

---

## Spec Output Format

The final output at `docs/plans/estate-tax-engine-spec.md`:

```markdown
# Philippine Estate Tax Engine — Software Specification
# Generated by Reverse Ralph Loop
# Legal basis: NIRC as amended by RA 10963 (TRAIN Law), RR 12-2018

## 1. System Overview
- What the engine does (structured estate data → BIR Form 1801 computation)
- Scope: core computation only, no UI, no file I/O
- Legal baseline and effective date

## 2. Data Model
### 2.1 Decedent
- Residency/citizenship classification (enum)
- Date of death
- Marital status, property regime
### 2.2 Estate
- Assets (typed, classified by Form 1801 schedule)
- Deduction claims (typed, with supporting data)
### 2.3 Asset Types
- Real property (exclusive vs conjugal, family home designation)
- Personal property (shares, vehicles, bank deposits, etc.)
- Intangible property
- Business interests
- Life insurance proceeds
- Taxable transfers
### 2.4 Surviving Spouse
- Property regime determination
- Share computation

## 3. Computation Pipeline
For each stage: inputs, outputs, rules with NIRC citations, edge cases

### 3.1 Input Validation
### 3.2 Residency Classification
### 3.3 Property Regime Determination
### 3.4 Gross Estate Computation
### 3.5 Ordinary Deductions
### 3.6 Special Deductions
### 3.7 Surviving Spouse Share
### 3.8 Net Taxable Estate
### 3.9 Tax Due (6% rate)
### 3.10 Penalty Computation (if applicable)
### 3.11 Tax Credits
### 3.12 Total Amount Payable

## 4. Decision Trees
### 4.1 Asset Classification → Form 1801 Schedule
### 4.2 Property Regime → ACP / CPG / Separation
### 4.3 Residency → Citizen / Resident Alien / Non-Resident Alien
### 4.4 Life Insurance → Taxable / Excluded
### 4.5 Vanishing Deduction Eligibility

## 5. Formulas (with NIRC section references)
### 5.1 Gross Estate = Σ(asset values by classification)
### 5.2 Vanishing Deduction = (initial basis - mortgage offset) × (1 - ELIT ratio) × time percentage
### 5.3 Net Estate = Gross Estate - Ordinary Deductions - Special Deductions
### 5.4 Surviving Spouse Share = ½ × (Conjugal Gross - Conjugal Ordinary Deductions)
### 5.5 Net Taxable Estate = Net Estate - Surviving Spouse Share
### 5.6 Tax Due = max(0, Net Taxable Estate) × 0.06 (if > ₱200,000)
### 5.7 Surcharge = Tax Due × 0.25 (or 0.50 for willful neglect)
### 5.8 Interest = Tax Due × 0.12 × (days_late / 365)

## 6. Input Contract (JSON Schema or equivalent)
- Complete schema for all inputs the engine accepts
- Required vs optional fields
- Validation rules

## 7. Output Contract (maps to BIR Form 1801)
- Every Form 1801 field mapped to a computation result
- Breakdown schedules

## 8. Test Vectors
- Simple case: single citizen, no spouse, few assets
- Standard case: married citizen, ACP, family home, standard deductions
- Complex case: married, CPG, vanishing deduction, medical expenses, multiple asset types
- Non-resident alien case
- Late filing case with penalties
- Edge case: net estate ≤ ₱200,000 (no tax)
- Edge case: deductions exceed gross estate (no tax)

## 9. Edge Cases & Special Rules
- Bank deposits already subject to 6% final withholding
- Life insurance to irrevocable beneficiary (excluded)
- Properties in contemplation of death
- Renunciation by surviving spouse (triggers donor's tax)
- Multiple prior decedents (chained vanishing deductions)
- Mixed property regimes (marriage conversion scenarios)

## 10. Legal References
- Complete citation index: every rule → NIRC section + RR provision
```

---

## Architecture Decision: Deterministic vs Agentic

### The Core Question

Should the computation engine use an LLM at any point?

### Analysis

| Criterion | Deterministic | Agentic | Hybrid |
|-----------|--------------|---------|--------|
| **Correctness** | Provably correct if spec is right | Can hallucinate amounts | Core correct, intake may misclassify |
| **Auditability** | Every step traceable to code + law | "The AI said so" is not acceptable | Core auditable, intake logged |
| **Cost per computation** | Zero (pure code) | ~$0.05-0.50 per run | ~$0.02-0.10 per run (intake only) |
| **Speed** | Milliseconds | 5-30 seconds | Milliseconds + optional intake |
| **Testability** | Unit tests per rule, integration tests per scenario | Statistical testing only | Core unit-tested, intake tested separately |
| **Maintenance** | Update code when law changes | Update prompts when law changes | Update code for rules, prompts for intake |
| **Offline capability** | Yes | No | Core yes, intake no |

### Verdict

**The core engine MUST be fully deterministic.** This is non-negotiable for tax computation:
- Tax authorities don't accept "the AI computed it as X"
- Users need to understand exactly why they owe what they owe
- CPAs need to verify the computation step by step
- The law is explicit — there's nothing ambiguous about `6% × net estate`

**An agentic intake layer is a separate, optional concern:**
- "I have a house in Makati worth about 15M" → structured asset input
- "My father died 3 years after inheriting from my grandfather" → vanishing deduction trigger
- "We got married in 1985, no prenup" → CPG classification

The reverse Ralph loop focuses exclusively on the deterministic core spec.

---

## Practical Considerations

### Token Efficiency

Each iteration reads:
1. The frontier file
2. One or two legal source files (from `input/legal-sources/`)
3. Maybe 1-2 prior analysis files for context

Legal text is dense but short — NIRC Sec. 86 is ~2000 words total. This is much lighter than processing video transcripts.

### Quality of Legal Source Extraction

The biggest risk is **misinterpreting legal provisions**. Mitigations:
- Cross-reference primary (NIRC) with secondary (RR, legal commentaries)
- Test vectors from CPA board exam materials serve as ground truth
- The spec-review iteration explicitly checks rule extraction accuracy

### Handling Law Changes

The TRAIN Law has been stable since 2018. But if amendments occur:
- Add a new frontier aspect: `law-amendment-{year}`
- Re-analyze affected provisions
- Update spec and test vectors
- The engine itself should have the legal effective date as a parameter

### Relationship to Forward Ralph Loop

After the reverse loop converges and produces the spec:
- A **forward ralph loop** can implement the engine stage by stage
- Each forward iteration implements one pipeline stage from the spec
- Tests from the spec's test vectors validate each stage
- The forward loop converges when all test vectors pass

### Multi-Jurisdiction Future

The architecture (reverse loop → spec → forward loop → engine) is replicable:
- US federal estate tax: different laws, same pattern
- Japanese inheritance tax: different laws, same pattern
- Each jurisdiction gets its own reverse loop, its own spec, its own engine module
