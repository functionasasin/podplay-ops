# Spec Draft — Complete Software Specification Synthesis

**Aspect**: spec-draft
**Wave**: 5 (Synthesis)
**Depends On**: ALL prior aspects (24 total)

---

## Overview

Synthesized all 24 analysis files into a complete, self-contained software specification at `../../docs/plans/inheritance-engine-spec.md`. The specification is designed so that a developer with ZERO knowledge of Philippine succession law can build the engine from the document alone.

## Specification Structure

The spec contains 15 sections plus 2 appendices:

| Section | Content | Source Analyses |
|---------|---------|----------------|
| 1. Overview | Purpose, scope, legal basis, design decisions | PROMPT.md, all |
| 2. Architecture | 10-step pipeline diagram, restart conditions, dual FP values | computation-pipeline |
| 3. Data Model | All types: 42 structs, 34 enums, primitives | data-model |
| 4. Heir Classification | 4 effective categories, 7 raw, eligibility gate, filiation proof | compulsory-heirs-categories, illegitimate-children-rights, adopted-children-rights |
| 5. Representation | Triggers, rules, build-lines algorithm | representation-rights |
| 6. Legitime Fraction Table | Complete T1-T15 fractions across 3 regimes, cap rule algorithm, ascendant division | legitime-table, legitime-with-illegitimate, legitime-surviving-spouse, legitime-ascendants |
| 7. Intestate Distribution | I1-I15 formulas, no-cap rule, Iron Curtain | intestate-order |
| 8. Collation | Estate base (Art. 908), collatability matrix, imputation, representation collation | collation, free-portion-rules |
| 9. Testate Validation | 5-check pipeline: preterition→disinheritance→underprovision→inofficiousness→conditions | testate-validation, preterition, disinheritance-rules, testate-institution |
| 10. Vacancy Resolution | 4-priority chain, Art. 1021 critical distinction | accretion-rules |
| 11. Narrative Template System | Structure, header variants, formatting rules, 4 worked examples | explainer-format |
| 12. Rounding | Rational arithmetic mandate, centavo allocation, sum invariant | computation-pipeline, data-model |
| 13. Edge Cases | 10 manual review flags, 82 edge cases summarized across 21 categories | edge-cases |
| 14. Test Vectors | 13 vectors, 10 invariants, 1 fully worked example (TV-13 cap rule) | test-vectors |
| 15. Implementation Notes | Language-agnostic, determinism guarantee, testing strategy | computation-pipeline |
| Appendix A | Article quick reference (30 key articles) | All |
| Appendix B | Glossary (15 terms) | All |

## Key Design Choices in Synthesis

1. **Flattened the data model**: Instead of reproducing all 42 structs from data-model.md, the spec includes the essential input/output types and the classified Heir struct. The full data model is referenced for implementors who need pipeline-internal types.

2. **Complete fraction table**: All 17 testate scenarios (T1-T15 including T5a/T5b) have explicit fraction tables with formulas. No ambiguity about what fraction applies in any scenario.

3. **Cap rule algorithm in pseudocode**: The Art. 895 ¶3 cap rule — the most complex computation — is given explicit pseudocode with spouse-priority-first ordering.

4. **Intestate formulas unified**: All 15 intestate scenarios have distribution formulas. The unit-ratio method for I3/I4 is given explicitly with the critical note that NO cap applies in intestate.

5. **Narrative examples**: 4 complete worked narratives demonstrating different scenarios (intestate, cap rule, representation, collation).

6. **Edge cases organized by actionability**: 10 manual review flags (things the engine cannot determine) vs 72 deterministically computable edge cases.

7. **Test vectors summarized with one fully worked example**: TV-13 (cap rule triggered) is worked step-by-step to demonstrate the complete computation pipeline.

## Completeness Assessment

### What's Covered

- All 4 effective heir categories with all 7 raw sub-categories
- All 17 testate scenarios with exact fractions
- All 15 intestate scenarios with distribution formulas
- Cap rule algorithm with spouse priority
- Complete collatability matrix (14 categories)
- 5-check testate validation pipeline
- 4-priority vacancy resolution chain
- Art. 1021 critical distinction (legitime vs FP accretion)
- 22 disinheritance grounds across 3 articles
- Preterition detection and effect algorithm
- Art. 911 three-phase reduction
- Art. 912 indivisible realty threshold
- Ascendant division sub-algorithm (Art. 890)
- Iron Curtain Rule (Art. 992)
- Articulo mortis (Art. 900 ¶2)
- Narrative template system with formatting rules
- 13 test vectors with 10 invariants
- 82 edge cases across 21 categories
- 10 manual review flags

### Potential Gaps for spec-review

1. **Fideicommissary substitution** (Art. 863): Mentioned in data model but the spec doesn't have a dedicated section on how to handle this post-distribution obligation
2. **Art. 1064 representation collation**: Covered in §8.6 but the interaction with the cap rule could be more explicit
3. **Mixed succession detail**: The spec describes the concept but Step 7 could have more explicit pseudocode for the mixed case
4. **Collateral distribution sub-algorithm**: Referenced but not given full pseudocode (Art. 1006 full/half blood 2:1 weighting)
5. **Narrative validation rules**: The 10 validation rules from explainer-format.md are not reproduced in the spec

## Cross-Reference

This analysis file synthesizes from:
- Wave 1: legal-source-fetch, commentary-fetch
- Wave 2: compulsory-heirs-categories, heir-concurrence-rules, representation-rights, adopted-children-rights, illegitimate-children-rights
- Wave 3: legitime-table, legitime-with-illegitimate, legitime-surviving-spouse, legitime-ascendants, free-portion-rules
- Wave 4: intestate-order, testate-institution, testate-validation, disinheritance-rules, preterition, accretion-rules, collation
- Wave 5: computation-pipeline, data-model, test-vectors, explainer-format, edge-cases

**Output**: `../../docs/plans/inheritance-engine-spec.md` (~1,200 lines)
