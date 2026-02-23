# Analysis: spec-draft

**Date**: 2026-02-23
**Wave**: 5 (Synthesis)
**Duration**: ~30 min
**Output**: `../../docs/plans/inheritance-engine-spec.md`

## Task

Synthesize all 24 prior analysis files (Waves 1–4) into a single, complete software specification that enables a developer with zero knowledge of Philippine succession law to build a deterministic inheritance distribution engine.

## Source Files Consumed

All 24 analysis files from Waves 1–4:

| Wave | Files |
|------|-------|
| 1 | legal-source-fetch.md, commentary-fetch.md |
| 2 | compulsory-heirs-categories.md, heir-concurrence-rules.md, representation-rights.md, adopted-children-rights.md, illegitimate-children-rights.md |
| 3 | legitime-table.md, legitime-with-illegitimate.md, legitime-surviving-spouse.md, legitime-ascendants.md, free-portion-rules.md |
| 4 | intestate-order.md, testate-institution.md, testate-validation.md, disinheritance-rules.md, preterition.md, accretion-rules.md, collation.md |
| 5 | computation-pipeline.md, data-model.md, test-vectors.md, explainer-format.md, edge-cases.md |

Primary synthesis anchors: `computation-pipeline.md`, `data-model.md`, `test-vectors.md`, `explainer-format.md`.

## Spec Structure Produced

The spec at `../../docs/plans/inheritance-engine-spec.md` contains 14 sections:

1. **Overview and Purpose** — what the engine does, determinism guarantee, technology constraints
2. **Scope and System Context** — governing law (Civil Code Arts. 774-1105, Family Code, RA 8552, RA 11642), system boundaries, input/output contract
3. **Legal Background** — required reading for developers: key concepts (compulsory heirs, legitime, free portion, representation, collation), the testate/intestate distinction, the Art. 895 ¶3 cap rule, preterition, and the Iron Curtain Rule
4. **Complete Data Model** — all structs and enums: EngineInput, Decedent, Person, Heir, Will, InstitutionOfHeir, Legacy, Devise, Disinheritance, Donation, EngineOutput, InheritanceShare, HeirNarrative, Fraction, Money, ManualFlag, and all supporting enums
5. **Computation Pipeline** — 10-step deterministic pipeline with pseudocode for every step; two restart conditions (invalid disinheritance → Step 3, vacant legitime → Step 3); rational arithmetic mandate
6. **Legitime Fraction Table** — all 15 testate scenarios (T1-T15) with exact fractions for each heir group, organized into 3 regimes (Regime A: descendants present, Regime B: ascendants present, Regime C: concurring only)
7. **Intestate Distribution Rules** — all 15 scenarios (I1-I15) with complete distribution formulas; critical note: NO cap rule in intestate
8. **Testate Validation Rules** — 5 ordered checks with full algorithms: preterition (Art. 854), disinheritance validity (Arts. 915-922), underprovision (Art. 855), inofficiousness (Art. 911), condition stripping (Art. 872)
9. **Special Computation Modules** — collation (Arts. 1061-1077), vacancy resolution (4-priority chain), reserva troncal (Art. 891)
10. **Narrative Generation System** — 19 NarrativeSection types, assembly pipeline, formatting rules, 5 header variants, all category templates
11. **Complete Test Vectors** — all 13 test cases (TV-01 through TV-13) with full EngineInput, classification, distribution, verification against 10 invariants, and narrative examples
12. **Manual Review Flags** — 6 flag codes (GRANDPARENT_OF_IC, CROSS_CLASS_ACCRETION, RESERVA_TRONCAL, COLLATION_DISPUTE, RA11642_RETROACTIVE, ARTICULO_MORTIS_CONDITIONS) plus 4 additional from edge-cases (USUFRUCT_ANNUITY_OPTION, DUAL_LINE_ASCENDANT, POSTHUMOUS_DISINHERITANCE, CONTRADICTORY_DISPOSITIONS)
13. **Edge Case Catalog** — representative cases from all 21 categories (82 edge cases total); reference to `analysis/edge-cases.md` for full catalog
14. **Implementation Requirements** — rational arithmetic with BigInt, centavo precision, determinism invariant, validation invariants, pipeline restart guard, testing requirements

## Key Design Decisions Codified in Spec

1. **Rational arithmetic throughout**: All intermediate computations use `Fraction { numerator: BigInt, denominator: BigInt }`. Conversion to `Money` (centavo-precision) occurs ONLY at Step 10 (finalize), using round-half-even. This prevents any rounding error from accumulating through the pipeline.

2. **Two FP values**: `FP_gross` (before spouse/IC deductions — used as Art. 895 ¶3 cap base) and `FP_disposable` (after all compulsory heirs — what testator actually controls). Both tracked through pipeline.

3. **Scenario codes** (`T1`–`T15`, `I1`–`I15`): Every computation path is indexed by scenario code. The scenario code determines which row of the legitime table to use and which intestate formula to apply.

4. **Art. 895 ¶3 cap rule (testate only)**: Spouse satisfied FIRST from `FP_gross`, then IC shares capped at remaining `FP`. No cap in intestate — `I3/I4` use 2:1 unit ratio over entire estate.

5. **Pipeline restarts**: Two conditions trigger restart from Step 3 (scenario re-evaluation): invalid disinheritance (Art. 918 — heir reinstated, scenario may change) and vacant legitime (Art. 1021 — "in own right" means re-evaluate with reduced heir pool). Guard: `max_restarts = heir_count`.

6. **Narrative generation**: Template-based, no LLM. Each heir gets a single paragraph assembled from composable `NarrativeSection` objects in fixed order. Every peso amount and legal conclusion cites a specific article.

7. **Preterition terminates testate pipeline**: If Art. 854 preterition is detected in Step 6, the pipeline does NOT continue through Steps 7-8 in testate mode. Instead, it: (a) evaluates surviving legacies/devises against FP, (b) reduces inofficious ones per Art. 911, then (c) restarts distribution in intestate mode with valid disinheritances carried forward.

## Invariants Enforced by Spec

10 test invariants that every test vector must satisfy:

1. **Sum**: All `InheritanceShare.net_amount` values sum to `net_distributable_estate`
2. **Legitime floor**: Every compulsory heir's `net_amount ≥ guaranteed_legitime`
3. **Art. 895 ratio**: In testate with L+IC concurrence, `IC_total ≤ FP_gross - spouse_share`
4. **Cap**: In testate, `IC_total ≤ LC_total / 2` when cap triggers
5. **Representation**: Representative's share = predeceased ancestor's share ÷ siblings in line
6. **Adoption equality**: Adopted child's share = legitimate child's share (same scenario)
7. **Preterition annulment**: When Art. 854 triggered, `succession_type = INTESTATE_AFTER_PRETERITION`
8. **Disinheritance**: Valid disinheritance with no representation → heir excluded and scenario re-evaluates
9. **Collation**: Donee's `final_amount = gross_share - collated_donation_amount`
10. **Scenario consistency**: Scenario code matches active heir pool configuration

## Convergence Contribution

This spec-draft completes Wave 5 synthesis. The remaining aspect (`spec-review`) is the self-review check to validate that the spec is complete enough for a zero-law-knowledge developer to implement the engine. With `spec-draft` completed, the system is at 25/28 aspects = 89.3% convergence.
