# Frontier — Philippine Inheritance Distribution Engine (v2)

## Statistics
- Total aspects discovered: 30
- Analyzed: 2
- Pending: 28
- Convergence: 7%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
Consolidate domain knowledge from original analysis files.
- [x] consolidate-legal-sources — Read original analysis files at `loops/inheritance-reverse/analysis/`, consolidate Civil Code, Family Code, RA 8552, RA 11642 rules into `input/sources/`
- [x] consolidate-worked-examples — Extract all 23 test vectors and 8 worked examples from original analysis files into `input/sources/worked-examples.md`

### Wave 2: Domain Rule Extraction
Depends on Wave 1 sources being consolidated.
- [ ] heir-classification — Compulsory heir categories, eligibility gate (Art. 887), filiation proof (FC 172/175), adopted/legitimated equivalence
- [ ] heir-concurrence — Arts. 888-903: who inherits together, who excludes whom, 30 scenario codes (T1-T15, I1-I15)
- [ ] representation — Arts. 970-977: per stirpes, 4 triggers, collateral limit, recursive multi-level, renunciation non-trigger
- [ ] legitime-fractions — Arts. 888-903: complete fraction table for all 30 scenarios, FP_gross vs FP_disposable, Art. 895 cap rule
- [ ] intestate-distribution — Arts. 960-1014: all 15 intestate formulas, Iron Curtain Rule, collateral sub-algorithm
- [ ] testate-validation — Arts. 840-872, 908-923: preterition, disinheritance (22 grounds), inofficiousness, underprovision, condition stripping
- [ ] collation — Arts. 1061-1077: 14-category collatability matrix, imputation, estate base, Art. 1064 representation collation
- [ ] vacancy-resolution — Arts. 1015-1023: substitution → representation → accretion → intestate fallback, Art. 1021 legitime vs FP distinction
- [ ] multiple-disinheritance-fix — BUG-001 from v1: specify correct algorithm for 2+ simultaneous disinheritances (batch process, single scenario recompute)

### Wave 3: Engine Design
Depends on Wave 2 rule extraction.
- [ ] rust-types — Define all Rust structs and enums with exact field names, types, serde attributes
- [ ] pipeline-design — 10-step pipeline with input/output types per step, restart conditions, max-restart guard
- [ ] algorithms — Pseudocode for all non-trivial computations (cap rule, Art. 911 reduction, collateral distribution, Hare-Niemeyer rounding)
- [ ] test-vectors — 20+ test vectors covering all 30 scenarios with expected peso amounts
- [ ] invariants — 10 formal invariants that must hold for any valid input/output pair

### Wave 4: Bridge Contract
Depends on Wave 3 data model.
- [ ] wasm-export — Define compute_json signature, parameter types, return type, wasm-bindgen attributes
- [ ] serde-wire-format — Exact JSON serialization rules: deny_unknown_fields, rename_all, boolean/number/null/enum/date/fraction conventions
- [ ] error-contract — Validation error vs computation error shapes, panic recovery
- [ ] wasm-initialization — initSync (Node.js/vitest) vs init (browser), dual-path initialization pattern

### Wave 5: Frontend Data Model + UI Design
Depends on Wave 3 data model and Wave 4 bridge contract.
- [ ] typescript-types — Map every Rust struct/enum to TypeScript interface/union (exact field names matching serde)
- [ ] zod-schemas — Strict Zod schemas: z.strict(), z.boolean() not coerce, z.nullable() not optional, matching serde wire format
- [ ] wizard-steps — 6-step wizard structure: fields per step, conditional visibility rules, validation per step
- [ ] results-view — Results display architecture: header, distribution table/chart, narrative panel, warnings, computation log, actions
- [ ] shared-components — Reusable form widgets: MoneyInput, DateInput, FractionInput, PersonPicker, EnumSelect
- [ ] design-system — Fresh palette (not Navy+Gold), typography pairing, shadcn/ui component library, spacing, visual direction

### Wave 6: Synthesis
Depends on all previous waves.
- [ ] spec-draft — Assemble all findings into docs/plans/inheritance-v2-spec.md (21 sections + 2 appendices)
- [ ] cross-layer-consistency — Verify field names, types, enums, nullability match across Rust ↔ JSON ↔ TypeScript ↔ Zod
- [ ] spec-review — Self-review: can a developer build the entire product from this spec alone, without any type mismatches at integration time?

## Recently Analyzed
- consolidate-legal-sources (Wave 1) — 4 source docs created in `input/sources/`; 30 scenarios confirmed; BUG-001 fix spec captured
- consolidate-worked-examples (Wave 1) — 23 test vectors (TV-01 through TV-23) extracted into `input/sources/worked-examples.md`; 17 scenarios covered; 10 invariants documented
