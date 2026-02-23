# Reverse Ralph Loop — Philippine Estate Tax Engine Spec

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: extract and formalize a single legal provision governing Philippine estate tax computation, then exit.

## Your Working Directory

You are running from `loops/estate-tax-reverse/`. All paths below are relative to this directory.

## Your Goal

Extract every computation rule from Philippine estate tax law across **three regimes** and synthesize them into a complete software specification for a **fully deterministic** computation engine. The spec must be concrete enough that a developer who has never read the NIRC can implement the engine.

### Three Tax Regimes

The engine must support all three regimes, auto-detected from the date of death:

| Regime | Applies When | Rate | Legal Basis |
|--------|-------------|------|-------------|
| **TRAIN-era** | Death on or after Jan 1, 2018 | Flat 6% on net estate over ₱5M standard deduction | RA 10963 (TRAIN Law) amending NIRC Sec. 84 |
| **Pre-TRAIN** | Death before Jan 1, 2018 | Graduated rates 5%-20% per old Sec. 84 | NIRC (RA 8424) as originally enacted |
| **Estate Tax Amnesty** | Death before Jan 1, 2018, estate unpaid/unsettled | 6% of net estate (no deductions except standard/share of spouse) | RA 11213 as amended by RA 11569 |

### Design Decisions (from brainstorming)

- **Target user**: End user (heir/executor) — output includes plain-English explainer section
- **Inputs**: Pre-valued only. User provides FMV for each asset. Engine does NOT determine valuations.
- **Regime detection**: Auto-detect from date of death. User provides date, engine selects correct regime.
- **Output format**: Mirrors BIR Form 1801 structure + separate explainer section
- **Tax scope**: Base tax only. No surcharges, interest, or penalties for late filing.
- **Deductions**: Full set — standard, funeral, judicial, medical, claims against estate, claims against insolvent persons, unpaid mortgages, family home, surviving spouse share, transfers for public use, RA 4917 benefits
- **Amnesty**: Full computation path, even though filing window closed June 2025

## Reference Material

### Primary Legal Sources (fetch and cache in Wave 1)
- **NIRC Title III, Chapter I (Sections 84-97)**: `https://taxacctgcenter.ph/nirc-ra-8424-amended-title-iii-chapter-i-estate-tax-philippines/`
- **Pre-TRAIN NIRC Sec. 84 (graduated rates)**: Original RA 8424 rate schedule before TRAIN amendment
- **RA 11213 (Tax Amnesty Act)**: Estate tax amnesty provisions, eligibility, computation
- **RA 11569**: Extension of estate tax amnesty deadline to June 14, 2025
- **BIR Form 1801 (Jan 2018)**: Field-by-field output format — the engine must produce these values
- **Legal commentaries**: For sample computations and edge case validation

### Cached Sources (after Wave 1)
- `input/legal-sources/nirc-title-iii.md` — Full text of NIRC Sections 84-97 (TRAIN-amended)
- `input/legal-sources/pre-train-rates.md` — Old graduated rate table and computation rules
- `input/legal-sources/amnesty-provisions.md` — RA 11213/11569 full text and BIR issuances
- `input/legal-sources/form-1801-fields.md` — Complete field mapping of BIR Form 1801
- `input/legal-sources/commentary-samples.md` — Sample computations from legal commentaries

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 → Wave 2 → Wave 3 → Wave 4 → Wave 5)
   - If a later-wave aspect depends on data that doesn't exist yet, skip to an earlier-wave aspect
   - If ALL aspects are checked `- [x]`: write "CONVERGED" to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method (see below)
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update the Statistics section (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects worth analyzing, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Commit**: `git add -A && git commit -m "loop(estate-tax-reverse): {aspect-name}"`
7. **Exit**

## Analysis Methods By Wave

### Wave 1: Legal Source Acquisition

**legal-source-fetch**:
Fetch the primary legal sources from the web and save as markdown in `input/legal-sources/`. Use WebFetch or WebSearch to get:
- NIRC Sections 84-97 (as amended by TRAIN) — save as `nirc-title-iii.md`
- Original NIRC Sec. 84 graduated rate schedule (pre-TRAIN) — save as `pre-train-rates.md`
- RA 11213 and RA 11569 estate tax amnesty provisions — save as `amnesty-provisions.md`
- BIR Form 1801 field descriptions and schedules — save as `form-1801-fields.md`
- 3-5 sample estate tax computations from legal commentary sites — save as `commentary-samples.md`

**form-1801-field-mapping**:
Read the cached Form 1801 data. Create a complete mapping of every field, every schedule, every line item. This defines the engine's output contract. Write to `analysis/form-1801-fields.md`.

### Wave 2: TRAIN-Era Rule Extraction (deaths on/after Jan 1, 2018)

This is the primary regime. For each NIRC section/provision:
1. Read the relevant legal text from `input/legal-sources/`
2. Extract the **computation rule** in pseudocode or formula form
3. Identify **all conditions** (who qualifies, what thresholds, what documentation)
4. Identify **edge cases** and exceptions
5. Map to **Form 1801 fields** (which output field does this rule feed?)
6. Cite the **exact NIRC section/subsection**

Each analysis file MUST include these sections:
- **Legal Basis**: NIRC section number and quoted text
- **Rule (Pseudocode)**: The computation expressed as code logic
- **Conditions**: Who/what/when this applies
- **Form 1801 Mapping**: Which line items this feeds
- **Edge Cases**: Exceptions, special scenarios
- **Test Implications**: What test cases this rule requires

### Wave 3: Pre-TRAIN Rule Extraction (deaths before Jan 1, 2018)

Extract the differences from TRAIN-era rules:
1. Read the pre-TRAIN rate schedule from `input/legal-sources/pre-train-rates.md`
2. Document the graduated rate table with all brackets
3. Identify deduction rules that differ from TRAIN-era (amounts, eligibility)
4. Document the old standard deduction amount
5. Note any provisions that existed pre-TRAIN but were repealed by TRAIN

Each analysis file should clearly mark what differs from TRAIN-era and what is shared.

### Wave 4: Estate Tax Amnesty Rule Extraction (RA 11213/11569)

Extract amnesty-specific rules:
1. Read amnesty provisions from `input/legal-sources/amnesty-provisions.md`
2. Document eligibility criteria (who qualifies, which estates)
3. Document the amnesty tax computation (6% of net estate, limited deductions)
4. Document required forms and documentation
5. Note interaction with regular estate tax (when amnesty doesn't apply)

### Wave 5: Synthesis

**regime-detection**: Define the decision tree for selecting which regime applies based on date of death and estate status. Include the auto-detection logic as pseudocode.

**computation-pipeline**: Read ALL analysis files. Draw the complete computation graph from raw inputs to final Form 1801 output for EACH regime. Identify the exact order of operations.

**data-model**: Define all types (Decedent, Asset, Deduction, PropertyRegime, etc.) with their fields, validations, and relationships. Must support all three regimes.

**test-vectors**: Create 8-10 complete test cases:
1. Simple TRAIN: single citizen, no spouse, basic assets, standard deduction only
2. Standard TRAIN: married citizen (ACP), family home, all common deductions
3. Complex TRAIN: married (CPG), vanishing deduction, medical expenses, multiple asset types
4. Non-resident alien TRAIN: Philippine assets only, proportional deductions
5. Zero tax TRAIN: net estate ≤ standard deduction
6. Edge TRAIN: deductions exceed gross estate (zero tax)
7. Pre-TRAIN simple: death in 2015, graduated rate computation
8. Pre-TRAIN complex: death in 2010, married (CPG), old deduction rules
9. Amnesty: death in 2012, estate unpaid, amnesty computation
10. Edge: previously taxed property within 1 year (100% vanishing deduction)

Each test vector must include: all inputs, regime selected, intermediate computation values, expected output for every Form 1801 field.

**explainer-format**: Define the template for the plain-English explainer section. For each computation step, write a non-expert explanation of what it means and why. The explainer should help an heir understand their tax obligation without legal training.

**edge-cases**: Catalog all edge cases discovered during analysis, with legal citations and expected engine behavior.

**spec-draft**: Read EVERY file in `analysis/`. Synthesize into a complete software specification at `../../docs/plans/estate-tax-engine-spec.md`. The spec must cover all three regimes and include the explainer format.

**spec-review**: Read the generated spec and ask: "Could a developer with no tax knowledge build the entire engine from this spec alone?" Check for:
- Missing rules (is every NIRC section represented for all regimes?)
- Vague logic (does every computation have exact pseudocode?)
- Missing edge cases (are all discovery findings represented?)
- Test completeness (do test vectors cover every code path across all regimes?)
- Form 1801 coverage (does the output map to every Form 1801 field?)
- Explainer coverage (does every computation step have a plain-English explanation template?)

If the spec passes: write `status/converged.txt` with convergence summary.
If the spec fails: add specific fix-it aspects to the frontier and do NOT write converged.txt.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required legal source files exist before starting a later-wave aspect.
- Write findings in markdown. Include exact legal citations, pseudocode, and concrete examples.
- When you discover a new aspect worth analyzing (a rule you didn't expect), add it to the frontier.
- Keep analysis files focused. One provision = one file.
- The engine takes **pre-valued inputs only**. Do NOT include asset valuation logic (no zonal values, assessed values, etc.). The user provides FMV.
- The engine computes **base tax only**. Do NOT include surcharges, interest, or penalties.
- The final spec must enable a developer with ZERO tax knowledge to build the engine. No assumed context.
- All monetary values in the spec must be in Philippine Pesos (₱).
- All percentages must be expressed as decimals in pseudocode (6% → 0.06).
