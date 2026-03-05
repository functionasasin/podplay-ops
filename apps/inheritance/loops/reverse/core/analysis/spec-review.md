# Spec Review — Can a Developer Build the Engine From the Spec Alone?

**Aspect**: spec-review
**Wave**: 5 (Synthesis)
**Date**: 2026-02-23
**Verdict**: **FAIL** — 4 critical gaps and 5 high-severity gaps prevent standalone implementation

## Review Question

> "Could a developer with no knowledge of Philippine succession law build the engine from this spec alone?"

## Review Methodology

Cross-referenced all 15 spec sections against the 24 analysis files, checking:
1. Every algorithm described in analysis files has corresponding pseudocode in spec
2. Every scenario has exact fractions (no "see analysis" references)
3. Test vectors cover the key computational paths
4. Narrative system is implementable without external reference
5. Pipeline steps are complete with pseudocode

## PASS Items (Spec Is Adequate)

| # | Area | Assessment |
|---|------|-----------|
| 1 | **Testate legitime fractions** | All 17 scenarios (T1-T15 + T5a/T5b) have exact fraction formulas |
| 2 | **Intestate distribution formulas** | All 15 scenarios (I1-I15) have explicit per-heir formulas |
| 3 | **Heir classification** | 4 effective categories, 7 raw sub-categories, eligibility gate with pseudocode |
| 4 | **Representation rules** | 4 triggers, per stirpes, build-lines algorithm with pseudocode |
| 5 | **Cap rule algorithm** | Complete `apply_cap_rule()` pseudocode with spouse priority |
| 6 | **Data model** | Comprehensive — all essential types defined (EngineInput, Heir, Will, etc.) |
| 7 | **Test invariants** | 10 invariants clearly defined and verifiable |
| 8 | **Manual review flags** | 10 flags with trigger conditions and legal basis |
| 9 | **Rounding** | Algorithm present with sum invariant guarantee |
| 10 | **Ascendant division** | `divide_among_ascendants()` with 3-tier priority |
| 11 | **Glossary + article reference** | Appendix A (30 articles) and Appendix B (15 terms) |
| 12 | **Disinheritance** | 22 causes enumerated, validity gate described, Art. 918 vs 854 distinguished |
| 13 | **Preterition** | Detection, scope, annulment effect, Art. 854 ¶2 all described |
| 14 | **Collation matrix** | 14-row collatability table with legal basis |
| 15 | **Testate validation pipeline** | 5-check ordered pipeline described |
| 16 | **Vacancy resolution priority** | 4-step chain with Art. 1021 distinction stated |
| 17 | **Edge case catalog** | 82 cases across 21 categories referenced |
| 18 | **Test vectors** | 13 vectors with worked TV-13 example |
| 19 | **Scenario codes** | Complete T1-T15 and I1-I15 tables with surviving heirs and articles |
| 20 | **Accretion** | Key rules stated (pro indiviso, Art. 977, Art. 1020) |

## FAIL Items — Critical (Blocks Implementation)

### C1: Mixed Succession Algorithm — NO PSEUDOCODE

**Location**: Spec §1.2 lists "Mixed succession (partial will)" as in scope. §3.6 defines `SuccessionType.MIXED`. But **no pseudocode** exists for:
- How to detect that a will disposes of only part of the estate
- How to compute the undisposed free portion
- How to distribute the undisposed remainder intestate
- How to combine testate and intestate shares for heirs who appear in both

**Source**: `analysis/computation-pipeline.md` (Step 7c) and `analysis/free-portion-rules.md` both contain complete `compute_mixed_succession()` pseudocode showing:
```
if will disposes of only part of FP:
    testate_share for each disposition
    undisposed_fp = FP_disposable - sum(will_dispositions)
    intestate_shares = compute_intestate_distribution(undisposed_fp, heirs)
    merge shares per heir
```

**Impact**: Developer cannot implement mixed succession without the analysis files.

### C2: Collateral Distribution Sub-Algorithm — NO PSEUDOCODE

**Location**: Spec §7.2 (I13-I14) describes collateral rules in prose but provides no algorithm.

**Missing**: The 4-branch decision tree:
1. Siblings + nephews/nieces → per stirpes with blood weighting per line
2. Siblings only → 3-branch logic (all full / all half / mixed with 2:1 ratio)
3. Nephews/nieces only → per capita switch (Art. 975)
4. Other collaterals → nearest-degree exclusion + 5th-degree limit

**Source**: `analysis/intestate-order.md` has complete `distribute_collaterals()`, `distribute_siblings_with_representation()`, `distribute_siblings()`, `distribute_nephews_only()`, and `distribute_other_collaterals()` functions.

**Impact**: A developer would not know how to handle the full/half blood doubling (Art. 1006) applied per-line vs per-individual, or the per-capita switch when only nephews survive.

### C3: Art. 911 Three-Phase Reduction — NO PSEUDOCODE

**Location**: Spec §9.1 Check 4 lists the phases but doesn't show the algorithm.

**Missing**: The actual reduction pseudocode showing:
- How to separate preferred from non-preferred legacies
- Pro rata calculation within each phase
- When to cascade to the next phase (only when current phase is fully consumed)
- Phase 3 donation reduction in reverse chronological order
- How to handle the case where a single reduction zeroes out multiple dispositions

**Source**: `analysis/computation-pipeline.md` (Step 6) and `analysis/free-portion-rules.md` both contain `reduce_inofficious()` with complete phase logic.

**Impact**: The three-phase reduction is the core of testate validation. Without pseudocode, a developer cannot implement it.

### C4: Fideicommissary Substitution Validity Requirements — NOT SPECIFIED

**Location**: Spec §3.3 defines `SubstitutionType.FIDEICOMMISSARY` but does not specify validity requirements.

**Missing**: Art. 863's 4 validity conditions:
1. **One-degree limit**: Fideicommissary must be one generation from fiduciary
2. **Both-alive requirement**: Both fiduciary and fideicommissary alive at testator's death
3. **Express-only**: Cannot be implied from will language
4. **Cannot burden legitime**: Only applies to free portion

**Source**: `analysis/testate-institution.md` §4.4 has complete validity check.

**Impact**: Without these, an engine might accept an invalid fideicommissary substitution and distribute incorrectly.

## FAIL Items — High Severity (Significantly Affects Implementation)

### H1: FP Pipeline Order of Operations — NOT SHOWN

**Location**: Spec §2.3 states two FP values exist but doesn't show the computation order.

**Missing**: The step-by-step pipeline:
1. Compute FP_gross = estate_base - LC_collective_legitime
2. Deduct spouse's legitime from FP_gross
3. Apply Art. 895 ¶3 cap rule to IC shares using FP_remaining
4. FP_disposable = FP_remaining - total_IC_legitime (capped)

The ORDER matters: spouse is satisfied BEFORE the IC cap is computed. This is stated in the cap rule pseudocode (§6.6) but not in a unified FP pipeline showing all four steps.

**Source**: `analysis/free-portion-rules.md` has `compute_free_portion_pipeline()`.

### H2: Art. 1064 Representation Collation — NO ALGORITHM

**Location**: Spec §8.6 states the rule ("grandchildren must collate parent's donations") but provides no computation.

**Missing**: How to:
- Identify which donations to assign to each representation line
- Compute each grandchild's pro-rata share of the parent's donation
- Handle the ₱0 distribution edge case
- Integrate with Step 8 (collation adjustment)

**Source**: `analysis/computation-pipeline.md` Step 8 has pseudocode.

### H3: Collatability Determination — Decision Tree Missing

**Location**: Spec §8.3 has a reference table but not the conditional logic.

**Missing**: The `determine_collatability()` decision tree, especially:
- Art. 1068 professional expenses: conditional on (parent required OR impairs legitime), minus imputed home savings
- Art. 1070 wedding gifts: threshold = 1/10 of FP, only EXCESS is collatable
- Art. 1062 express exemption: still check for inofficiousness (override)
- Art. 1072 joint-parent: computation of ½ assignment

**Source**: `analysis/computation-pipeline.md` Step 4 and `analysis/collation.md` both have full logic.

### H4: Narrative Validation Rules — ABSENT

**Location**: Spec §11 has templates and examples but NO validation rules.

**Missing**: 10 validation rules from `analysis/explainer-format.md` §9:
1. Amount consistency (HEADER total = InheritanceShare.total)
2. Article citation (every legal conclusion cites an article)
3. Category match (label matches effective_category)
4. Computation visibility (show multiplication for fractions)
5. Special event coverage (every Correction has narrative section)
6. Collation coverage (if donations_imputed > 0, COLLATION section present)
7. Representation coverage (if REPRESENTATION mode, section present)
8. No orphan references (no unexplained items)
9. Peso format consistency (₱ prefix, commas, centavo rules)
10. Self-containment (no external context needed)

**Impact**: Without these, narrative output cannot be programmatically verified.

### H5: Narrative Helper Functions — NOT SPECIFIED

**Location**: Spec §11.3 states formatting rules but doesn't define the 6 helper functions.

**Missing**:
- `category_label(effective_category) → String` — maps to display text with legal basis
- `raw_label(heir) → String` — full label with sub-category citations
- `filiation_description(proof_type) → String` — maps FiliationProof enum to explanatory text
- `format_peso(amount) → String` — ₱ formatting with comma/centavo rules
- `format_fraction(fraction) → String` — Unicode symbol + slash notation
- `spouse_article(scenario) → String` — maps scenario to governing article

**Source**: `analysis/explainer-format.md` §4.2 has all 6 with signatures and logic.

## FAIL Items — Medium (Aids Implementation)

### M1: Vacancy Resolution Pseudocode

Spec §10 describes the priority chain but doesn't show the algorithm that distinguishes vacant-legitime (→ scenario re-evaluation, restart from Step 3) from vacant-FP (→ proportional accretion, no restart). The decision tree is in `analysis/computation-pipeline.md` Step 9.

### M2: NarrativeConfig Struct

Spec doesn't define runtime configuration for narrative generation (include_comparison, include_filiation_proof, include_collation_detail, max_sentences). Defined in `analysis/explainer-format.md` §8.

### M3: NarrativeSectionType Formal Enum

19 section types only implicitly referenced in spec §11.1. A formal enum would make implementation cleaner. Defined in `analysis/explainer-format.md` §1.

### M4: Nephews-Only Full/Half Blood Debate

Scholarly debate on whether Art. 1006 doubling applies to nephews/nieces in per-capita mode (Art. 975). Should have a configuration flag. Noted in `analysis/intestate-order.md`.

### M5: Will-Execution Master Algorithm

The spec describes testate steps separately (Steps 3, 5, 6, 7) but doesn't show a unified 5-phase will-execution function. The `execute_will()` master function in `analysis/testate-institution.md` coordinates all phases.

## Test Vector Coverage Assessment

### Covered Scenarios
- Simple intestate (I1, I2, I3, I6, I11) ✓
- Testate basic (T1, T2, T3) ✓
- Cap rule (T5a, T5b) ✓
- Preterition, disinheritance, representation ✓
- Adopted child equality ✓
- Collation + inofficiousness ✓

### Missing Test Vectors
- **Mixed succession** (partial will + intestate remainder) — no test vector
- **Collateral distribution** (I12, I13, I14) — no test vector for siblings/nephews with full/half blood
- **Ascendant-only intestate** (I5) — no direct test vector
- **IC-only intestate** (I7, I8) — no test vector
- **Articulo mortis** (T12 with reduced spouse share) — no test vector
- **Art. 969 total renunciation** (next degree) — no test vector
- **Art. 1064 representation collation** — no test vector showing grandchild getting ₱0
- **Escheat** (I15) — no test vector
- **Iron Curtain** (Art. 992) in collateral context — no test vector
- **Fideicommissary substitution** — no test vector

## Verdict

The spec is **not yet sufficient** for a developer with zero Philippine law knowledge to build the engine. The PASS items demonstrate strong coverage of the core computation (legitime fractions, intestate formulas, heir classification, cap rule). However, the 4 critical gaps (mixed succession, collateral distribution, Art. 911 reduction, fideicommissary validity) and 5 high-severity gaps (FP pipeline, Art. 1064 collation, collatability decision tree, narrative validation, narrative helpers) would force the developer to consult the analysis files.

## Recommended Fix-It Aspects

To reach convergence, the spec needs these additions:

| Aspect | Wave | Priority | Description |
|--------|------|----------|-------------|
| spec-fix-mixed-succession | 5 | Critical | Add mixed succession detection + distribution algorithm |
| spec-fix-collateral-algorithm | 5 | Critical | Add collateral distribution sub-algorithm with full/half blood |
| spec-fix-art911-reduction | 5 | Critical | Add Art. 911 three-phase reduction pseudocode |
| spec-fix-fideicommissary | 5 | Critical | Add Art. 863 validity requirements |
| spec-fix-fp-pipeline | 5 | High | Add FP computation order-of-operations pseudocode |
| spec-fix-narrative-rules | 5 | High | Add narrative validation rules + helper functions |
| spec-fix-test-vectors | 5 | High | Add 10 missing test vectors (mixed, collateral, articulo mortis, etc.) |

## Cross-Reference

| Spec Section | Status | Gaps |
|-------------|--------|------|
| §1 Overview | ✓ PASS | — |
| §2 Architecture | ~ PARTIAL | FP pipeline order (H1) |
| §3 Data Model | ~ PARTIAL | Fideicommissary validity (C4) |
| §4 Heir Classification | ✓ PASS | — |
| §5 Representation | ✓ PASS | — |
| §6 Legitime Table | ✓ PASS | — |
| §7 Intestate Distribution | ~ PARTIAL | Collateral sub-algorithm (C2), mixed succession (C1) |
| §8 Collation | ~ PARTIAL | Art. 1064 algorithm (H2), decision tree (H3) |
| §9 Testate Validation | ~ PARTIAL | Art. 911 pseudocode (C3) |
| §10 Vacancy Resolution | ~ PARTIAL | Pseudocode detail (M1) |
| §11 Narrative System | ~ PARTIAL | Validation rules (H4), helpers (H5), config (M2) |
| §12 Rounding | ✓ PASS | — |
| §13 Edge Cases | ✓ PASS | — |
| §14 Test Vectors | ~ PARTIAL | 10 missing scenarios |
| §15 Implementation Notes | ✓ PASS | — |
