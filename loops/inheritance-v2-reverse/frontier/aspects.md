# Frontier — Philippine Inheritance Distribution Engine (v2)

## Statistics
- Total aspects discovered: 30
- Analyzed: 21
- Pending: 9
- Convergence: 70%

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
- [x] rust-types — Define all Rust structs and enums with exact field names, types, serde attributes
- [x] pipeline-design — 10-step pipeline with input/output types per step, restart conditions, max-restart guard
- [x] algorithms — Pseudocode for all non-trivial computations (cap rule, Art. 911 reduction, collateral distribution, Hare-Niemeyer rounding)
- [x] test-vectors — 20+ test vectors covering all 30 scenarios with expected peso amounts
- [x] invariants — 10 formal invariants that must hold for any valid input/output pair

### Wave 4: Bridge Contract
Depends on Wave 3 data model.
- [x] wasm-export — Define compute_json signature, parameter types, return type, wasm-bindgen attributes
- [x] serde-wire-format — Exact JSON serialization rules: deny_unknown_fields, rename_all, boolean/number/null/enum/date/fraction conventions
- [x] error-contract — Validation error vs computation error shapes, panic recovery
- [x] wasm-initialization — initSync (Node.js/vitest) vs init (browser), dual-path initialization pattern

### Wave 5: Frontend Data Model + UI Design
Depends on Wave 3 data model and Wave 4 bridge contract.
- [x] typescript-types — Map every Rust struct/enum to TypeScript interface/union (exact field names matching serde)
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
- typescript-types (Wave 5a) — full TypeScript type system: HeirType (9 variants), DisinheritanceGround (22 Art919_1..Art921_6 codes), all 30 ScenarioCode variants (T5 not T5a/T5b), EffectiveGroup (PascalCase full names, not "G1"-"G4"), ExclusionReason (rust-types granular variants), RepresentationTrigger/VacancyCause/ResolutionMethod/ShareSource enums; InputMoney vs OutputMoney types; ComputeResult discriminated union; tagged union types for PreteritionEffect/ValidationWarning/ManualReviewFlag/ComputationError; all input interfaces (ComputationInput, DecedentInput merged from both analysis files, EstateInput with Money wrapper, HeirInput with full field set, DisinheritanceRecord, WillInput, InstitutionInput, DeviseInput, LegacyInput, SubstitutionInput, DonationInput); all output interfaces (ComputationOutput, HeirDistribution, RepresentationChain, LegitimeResult, LegitimeEntry, TestateValidationResult, CollationResult, VacancyResolution, RoundingAdjustment, ComputationLogEntry); type guards and utility functions; 9-item cross-file discrepancy log flagging rust-types vs serde-wire-format conflicts for cross-layer-consistency resolution
- wasm-initialization (Wave 4) — dual-path init: `initSync({ module: wasmBytes })` for Node.js/vitest (fs.readFileSync + fileURLToPath-relative path), `await initAsync()` for browser; environment detection via `typeof process !== "undefined" && process.versions?.node`; promise-based singleton guard (upgrade from boolean guard) prevents race conditions with concurrent callers; vite.config.ts requires `vite-plugin-wasm` + `vite-plugin-top-level-await`; vitest.config.ts intentionally omits wasm plugin (Node.js file path handles WASM loading); dynamic imports for `node:fs`/`node:path`/`node:url` prevent Vite bundling Node built-ins; `.wasm` path resolved relative to `import.meta.url` not `process.cwd()`; `initSync` new-style API `{ module: BufferSource }` not deprecated single-arg form; exported `ensureWasmInitialized` for optional app pre-warming; `useWasmCompute` hook pattern; `fatal_error` state distinct from `engine_error` for init failures
- invariants (Wave 3) — 10 global formal invariants (INV-1 sum conservation, INV-2 E_adj entitlement, INV-3 legitime floor, INV-4 Art.895 per-IC ratio, INV-5 aggregate IC cap, INV-6 per stirpes slot conservation, INV-7 adoption equivalence, INV-8 preterition totality, INV-9 disinheritance exclusion, INV-10 scenario consistency); 5 pipeline invariants (PINV-1 termination, PINV-2 monotonic exclusion, PINV-3 step ordering, PINV-4 idempotent base classification, PINV-5 log append-only); Rust assertion patterns for each invariant; invariant applicability matrix (which apply to intestate/testate/mixed/BUG-001); violation response protocol (panic for INV-1/3/6, MaxRestartsExceeded for PINV-1); 5 edge cases (all-excluded→escheat, zero estate, single heir, collation>estate, restart chain); cross-references to sub-domain invariants in multiple-disinheritance-fix, vacancy-resolution, intestate-distribution analysis files
- test-vectors (Wave 3) — 47 total test vectors (23 existing + 5 BUG-001 + 19 new); 100% scenario coverage of all 30 ScenarioCode variants; exact centavo values with Hare-Niemeyer rounding for irrational shares; 10 formal invariants (INV-1 sum guarantee, INV-2 E_adj total entitlement, INV-3 legitime floor, INV-4 Art.895 ratio, INV-5 cap invariant, INV-6 per stirpes, INV-7 adoption equivalence, INV-8 preterition totality, INV-9 disinheritance exclusion, INV-10 scenario consistency); I8/I9/I10 must use explicit fraction formulas not unit-ratio; Regime B (T8/T9) uses flat ¼ for IC with no cap rule; TV-N05 illustrates rounding bonus can go to half-blood heir when higher fractional remainder; TV-N19 specifies collation debt clamping + CollationDebt warning + MANUAL_REVIEW flag; JSON input/output shape documented
- pipeline-design (Wave 3) — 10-step deterministic restartable pipeline; PipelineState struct with classified_heirs_base (immutable) + classified_heirs (working); StepResult::Continue|Restart|Error; RestartTrigger enum (ValidDisinheritance|PreteritionAnnulment|LegitimeVacancy); MAX_RESTARTS=10; clear_from_step(3) strips representation additions but keeps disinheritance exclusions; clear_from_step(4) keeps full post-rep heir set; step7 restarts to step3 (disinheritance/preterition), step10 restarts to step4 (Art.1021¶2 legitimate vacancy only); step1-2 never re-run on restart; rounding (Hare-Niemeyer) as final sub-step of step10; collation phase1 in step5 (E_adj), phase2 imputation in step9; 10-module src layout; ComputationLogEntry per step for audit trail
- rust-types (Wave 3) — 49 distinct types across 14 modules; ComputationInput/DecedentInput/EstateInput/HeirInput/WillInput/DonationInput full structs with serde attributes; HeirType (9 variants), DisinheritanceGround (22 variants), ScenarioCode (30 variants) enums; Money type with custom centavos deserializer (number-or-string for BigInt); HeirInput.children for cascading representation; ClassifiedHeir intermediate type; LegitimeResult/LegitimeEntry; TestateValidationResult and all sub-types; CollationResult/ImputationResult/DonationReduction/PartitionAllocation; VacantShare/VacancyResolution/VacancyRedistribution; ValidationWarning (10 variants) + ManualReviewFlag (7 variants); ComputationOutput/HeirDistribution/RoundingAdjustment; ComputationError (5 variants); 10-module src layout; 8 key design decisions (BigRational internal, i64 I/O, PascalCase enums, flat ScenarioCode, children-over-representatives, engine-computed is_valid, "numer/denom" fractions, null-not-absent Options)
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
