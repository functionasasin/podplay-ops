# Reverse Ralph Loop — Philippine Estate Tax Engine Spec

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: extract and formalize a single legal provision governing Philippine estate tax computation, then exit.

## Your Working Directory

You are running from `loops/estate-tax-reverse/`. All paths below are relative to this directory.

## Your Goal

Extract every computation rule from Philippine estate tax law (NIRC as amended by TRAIN Law / RA 10963, RR 12-2018, BIR Form 1801) and synthesize them into a complete software specification for a **fully deterministic** computation engine. The spec must be concrete enough that a developer who has never read the NIRC can implement the engine.

## Reference Material

### Primary Legal Sources (fetch and cache in Wave 1)
- **NIRC Title III, Chapter I (Sections 84-97)**: `https://taxacctgcenter.ph/nirc-ra-8424-amended-title-iii-chapter-i-estate-tax-philippines/`
- **BIR Form 1801 (Jan 2018)**: Field-by-field output format — the engine must produce these values
- **Legal commentaries**: For sample computations and edge case validation

### Cached Sources (after Wave 1)
- `input/legal-sources/nirc-title-iii.md` — Full text of NIRC Sections 84-97
- `input/legal-sources/form-1801-fields.md` — Complete field mapping of BIR Form 1801
- `input/legal-sources/commentary-samples.md` — Sample computations from legal commentaries

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2 before Wave 3)
   - If Wave 2 aspects depend on Wave 1 data that doesn't exist yet, skip to a Wave 1 aspect
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

## Analysis Methods By Aspect Type

### Wave 1: Legal Source Acquisition

**legal-source-fetch**:
Fetch the primary legal sources from the web and save as markdown in `input/legal-sources/`. Use WebFetch or WebSearch to get:
- NIRC Sections 84-97 (as amended) — save as `nirc-title-iii.md`
- BIR Form 1801 field descriptions and schedules — save as `form-1801-fields.md`
- 3-5 sample estate tax computations from legal commentary sites — save as `commentary-samples.md`

**form-1801-field-mapping**:
Read the cached Form 1801 data. Create a complete mapping of every field, every schedule, every line item. This defines the engine's output contract. Write to `analysis/form-1801-fields.md`.

### Wave 2: Rule Extraction

For each NIRC section/provision:
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

### Wave 3: Synthesis

**computation-pipeline**: Read ALL analysis files. Draw the complete computation graph from raw inputs to final Form 1801 output. Identify the exact order of operations (what must be computed before what).

**data-model**: Define all types (Decedent, Asset, Deduction, PropertyRegime, etc.) with their fields, validations, and relationships.

**test-vectors**: Create 6-8 complete test cases:
1. Simple: single citizen, no spouse, basic assets
2. Standard: married citizen (ACP), family home, standard deductions
3. Complex: married (CPG), vanishing deduction, medical expenses, multiple asset types
4. Non-resident alien
5. Late filing with penalties
6. Edge: net estate ≤ ₱200,000 (zero tax)
7. Edge: deductions exceed gross estate (zero tax)
8. Edge: previously taxed property within 1 year (100% vanishing deduction)

Each test vector must include: all inputs, intermediate computation values, expected output for every Form 1801 field.

**edge-cases**: Catalog all edge cases discovered during analysis, with legal citations and expected engine behavior.

**spec-draft**: Read EVERY file in `analysis/`. Synthesize into a complete software specification at `../../docs/plans/estate-tax-engine-spec.md`. Follow the structure defined in the design doc.

**spec-review**: Read the generated spec and ask: "Could a developer with no tax knowledge build the entire engine from this spec alone?" Check for:
- Missing rules (is every NIRC section represented?)
- Vague logic (does every computation have exact pseudocode?)
- Missing edge cases (are all discovery findings represented?)
- Test completeness (do test vectors cover every code path?)
- Form 1801 coverage (does the output map to every Form 1801 field?)

If the spec passes: write `status/converged.txt` with convergence summary.
If the spec fails: add specific fix-it aspects to the frontier and do NOT write converged.txt.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required legal source files exist before starting a Wave 2 aspect.
- Write findings in markdown. Include exact legal citations, pseudocode, and concrete examples.
- When you discover a new aspect worth analyzing (a rule you didn't expect), add it to the frontier.
- Keep analysis files focused. One provision = one file.
- The final spec must enable a developer with ZERO tax knowledge to build the engine. No assumed context.
- All monetary values in the spec must be in Philippine Pesos (₱).
- All percentages must be expressed as decimals in pseudocode (6% → 0.06).
