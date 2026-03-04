# Frontier — Philippine Inheritance Distribution Engine (v2)

## Statistics
- Total aspects discovered: 30
- Analyzed: 11
- Pending: 19
- Convergence: 37%

## Pending Aspects (ordered by dependency)

### Wave 1: Legal Source Acquisition
Consolidate domain knowledge from original analysis files.
- [x] consolidate-legal-sources — Read original analysis files at `loops/inheritance-reverse/analysis/`, consolidate Civil Code, Family Code, RA 8552, RA 11642 rules into `input/sources/`
- [x] consolidate-worked-examples — Extract all 23 test vectors and 8 worked examples from original analysis files into `input/sources/worked-examples.md`

### Wave 2: Domain Rule Extraction
Depends on Wave 1 sources being consolidated.
- [x] heir-classification — Compulsory heir categories, eligibility gate (Art. 887), filiation proof (FC 172/175), adopted/legitimated equivalence
- [x] heir-concurrence — Arts. 888-903: who inherits together, who excludes whom, 30 scenario codes (T1-T15, I1-I15)
- [x] representation — Arts. 970-977: per stirpes, 4 triggers, collateral limit, recursive multi-level, renunciation non-trigger
- [x] legitime-fractions — Arts. 888-903: complete fraction table for all 30 scenarios, FP_gross vs FP_disposable, Art. 895 cap rule
- [x] intestate-distribution — Arts. 960-1014: all 15 intestate formulas, Iron Curtain Rule, collateral sub-algorithm
- [x] testate-validation — Arts. 840-872, 908-923: preterition, disinheritance (22 grounds), inofficiousness, underprovision, condition stripping
- [x] collation — Arts. 1061-1077: 14-category collatability matrix, imputation, estate base, Art. 1064 representation collation
- [x] vacancy-resolution — Arts. 1015-1023: substitution → representation → accretion → intestate fallback, Art. 1021 legitime vs FP distinction
- [x] multiple-disinheritance-fix — BUG-001 from v1: specify correct algorithm for 2+ simultaneous disinheritances (batch process, single scenario recompute)

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
- multiple-disinheritance-fix (Wave 2) — BUG-001 correct algorithm: 4-phase batch processing (validate→batch-exclude→batch-add-reps→single ScenarioCode recompute); Art. 777 simultaneous-at-death principle; cascading disinheritance handled by find_representatives_recursive(); spousal disinheritance has no Art. 923 representation cascade; conservative rule: all-G1-disinherited-with-no-reps does NOT activate G2 (MANUAL_REVIEW flag); mixed valid/invalid partitioned before any mutation; idempotency guard for pipeline restarts; ExclusionReason/DisinheritanceResult/RepresentationChain Rust types; 8 INV-MD invariants; 5 test vectors (TV-MD-01 to TV-MD-05); 4 narrative templates; pipeline integration showing single restart path
- vacancy-resolution (Wave 2) — 4-step priority chain (substitution→representation→accretion→intestate fallback); Art. 1021 ¶2 legitime vacancy triggers scenario recompute (NOT proportional add); Art. 1021 ¶1 FP vacancy = true accretion requires pro indiviso; Art. 1017 "equal shares" does not block accretion; Art. 969 total repudiation → next degree in own right; Art. 977 renunciation blocks representation; Art. 1019 proportionality; Art. 1020 charges transfer; Art. 1023 devisees/legatees/usufructuaries; VacantShare/VacancyCause/ShareSource/ResolutionMethod/VacancyResolution/Redistribution Rust types; convergence guard (initial_heir_count max restarts); 12 test vectors; 10 invariants; 5 narrative templates; 11 edge cases
- collation (Wave 2) — 14-category collatability matrix; Art. 1061 4-condition obligation; Art. 1062 two exemptions (donor-express, repudiation) with inofficiousness override; Art. 1064 representation collation (grandchildren collate parent's donations even if property gone); Art. 1065 ascending line exception; Art. 1066 spouse donations; Art. 1067 exempt categories; Art. 1068 professional expense conditional; Art. 1069 debt/election/fine collatable; Art. 1070 wedding gift 1/10 FP threshold; Art. 1071 donation-time valuation; Art. 1072 joint donation split; E_adj = net_estate + collatable_sum used for ALL legitime computations; two-phase pipeline integration (before legitime computation + after distribution); imputation: charged to legitime then FP; Art. 911(3) reduction in reverse-chrono; Donation + CollationResult + ImputationResult + DonationReduction + PartitionAllocation Rust structs; 17 test vectors; 12 edge cases; 5 narrative templates
- testate-validation (Wave 2) — 5 validation problems; preterition detection (G1/G2 direct-line only; complete omission only); 22 disinheritance grounds as DisinheritanceGround enum (8 Art.919 + 8 Art.920 + 6 Art.921); BUG-001 batch-disinheritance fix in Rust pseudocode; Art. 911 reduction order (devises pro rata → donations reverse-chronological); Art. 872 condition stripping; requires_restart flag; TestateValidationResult struct; 10-warning catalog; 6 edge cases; Will/Institution/Devise/Legacy/DisinheritanceRecord/Substitution input types
- intestate-distribution (Wave 2) — All 15 intestate scenarios (I1–I15) with complete Rust pseudocode; 6-class priority hierarchy; 2:1 ratio (no cap) for IC in intestate; collateral sub-algorithm (Art. 1006 full/half blood; Art. 975 per capita for nephews alone); Iron Curtain Rule (Art. 992) filtering; Art. 1018 proportional accretion; Art. 1001 spouse+siblings exception; IntestateTrigger enum; CollateralHeir/BloodType types identified; 10 invariants
- consolidate-legal-sources (Wave 1) — 4 source docs created in `input/sources/`; 30 scenarios confirmed; BUG-001 fix spec captured
- consolidate-worked-examples (Wave 1) — 23 test vectors (TV-01 through TV-23) extracted into `input/sources/worked-examples.md`; 17 scenarios covered; 10 invariants documented
- heir-classification (Wave 2) — 4 compulsory heir groups; 7 eligibility gates; HeirType enum + EffectiveGroup mapping; HeirInput struct with all fields; ascendant division per Art. 890; Art. 977 renunciation blocks representation; BUG-001 disinheritance gate noted
- heir-concurrence (Wave 2) — 30 ScenarioCode enum variants (T1–T15, I1–I15); full testate + intestate determination algorithms in Rust pseudocode; cap rule formula + 2 examples; sibling full/half-blood (Art. 1006); Art. 903 T14/T15 illegitimate decedent branch; 6 new fields identified for DecedentInput; testate vs intestate comparison table
- representation (Wave 2) — 4 triggers (predecease, disinheritance, incapacity/unworthiness, Art. 902 illegitimate); renunciation NON-trigger; per stirpes + per capita switch (Art. 975); collateral limit (Art. 972, nephews/nieces only); recursive multi-level algorithm; Art. 976/977 asymmetry; 12 test vectors; RepresentationTrigger + InheritanceMode + LineInfo types; pipeline placement before concurrence step
- legitime-fractions (Wave 2) — full fraction tables for all 30 scenarios; 3 regimes (A/B/C + Art. 903 special); FP_gross vs FP_disposable; Art. 895 cap rule with threshold formulas; ascendant distribution (Art. 890); LegitimeResult struct; intestate 2:1 ratio (no cap); 6 edge cases + invariant
