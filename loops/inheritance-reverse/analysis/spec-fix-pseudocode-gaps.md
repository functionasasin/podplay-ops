# Spec Fix: Pseudocode Gaps — FP Pipeline, Art. 1064 Collation, Collatability Decision Tree

**Aspect**: spec-fix-pseudocode-gaps
**Wave**: 6 (Spec Fixes)
**Date**: 2026-02-23
**Fixes**: Gaps H1, H2, H3 from spec-review

---

## Overview

This aspect addresses three high-severity gaps identified in spec-review that would prevent a developer from implementing the engine without consulting the analysis files:

1. **H1: FP Pipeline Order of Operations** — §2.3 stated two FP values exist but didn't show the computation order
2. **H2: Art. 1064 Representation Collation** — §8.6 stated the rule but provided no algorithm
3. **H3: Collatability Determination Decision Tree** — §8.3 had a reference table but not the conditional logic

---

## Fix 1: FP Pipeline Order of Operations (H1)

**Location**: Spec §2.3 (new subsection: "FP Pipeline Order of Operations")

**What was added**: Complete `compute_free_portion_pipeline()` function (~55 lines pseudocode) showing the 4-step sequential computation:

1. **STEP 1**: Compute `FP_gross` = estate_base − primary heirs' collective legitime (½E in Regime A/B, E in Regime C)
2. **STEP 2**: Satisfy spouse's legitime from FP (Art. 892 ¶3, 893 ¶2) — with per-scenario spouse fraction mapping
3. **STEP 3**: Cap illegitimate children's legitime (Art. 895 ¶3) — only in Regime A scenarios with IC (T4, T5a, T5b); Regime B/C use fixed statutory fractions
4. **STEP 4**: `FP_disposable` = what testator can freely give away

**Critical ordering**: Step 2 (spouse) MUST execute before Step 3 (IC cap). The IC cap base is `FP_after_spouse`, not `FP_gross`. This ensures Art. 895 ¶3's priority rule is enforced — spouse is never reduced by illegitimate children's claims.

**Return type**: `FreePortionResult { fp_gross, spouse_from_fp, ic_from_fp, fp_disposable }`

**Source**: `analysis/free-portion-rules.md` §8 (Cap Rule Interaction: The FP Pipeline)

---

## Fix 2: Art. 1064 Representation Collation Algorithm (H2)

**Location**: Spec §8.6 (expanded with algorithm and integration notes)

**What was added**: Complete `collation_for_representatives()` function (~30 lines pseudocode) with:

1. **Inputs**: represented heir (predeceased parent), list of grandchildren representatives, parent's donations, line's total entitlement
2. **Core computation**: `net_line_share = line_share - parent_donation_total`
3. **Two outcomes**:
   - `net_line_share ≥ 0`: grandchildren divide remainder equally per stirpes
   - `net_line_share < 0`: grandchildren receive ₱0, excess charged to FP (may trigger inofficiousness)
4. **Pipeline integration**: called during Step 8 for every representation line with donated ancestors
5. **Key rule citation**: Art. 1064 "even though such grandchildren have not inherited the property" — parent may have spent/sold the donation, grandchildren still collate at donation-time value (Art. 1071)

**Source**: `analysis/collation.md` Rule 7 (Collation by Representation)

---

## Fix 3: Collatability Determination Decision Tree (H3)

**Location**: Spec §8.3 (new subsection after the matrix table: "Collatability Decision Tree")

**What was added**: Complete `determine_collatability()` function (~95 lines pseudocode) implementing the full decision tree:

1. **Gate checks**: compulsory heir status, co-heirs exist, gratuitous transfer (Art. 1061)
2. **Art. 1067 exempt categories**: support, education, medical, apprenticeship, ordinary equipment, customary gifts
3. **Art. 1066 spouse logic**: spouse-only → not collatable; joint child+spouse → ½ collatable
4. **Art. 1072 joint-parent**: ½ to this estate
5. **Art. 1068 professional expenses**: conditional on (parent required OR impairs legitime), minus user-provided imputed home-savings deduction
6. **Art. 1070 wedding gifts**: NOT added to estate base; only excess over 1/10 `FP_disposable` is reducible as inofficious; note on circular dependency resolution (compute FP first ignoring wedding gifts)
7. **Art. 1062 donor exemption**: not collatable but still checked for inofficiousness
8. **Art. 1062 ¶2 repudiation**: same treatment as donor exemption
9. **Art. 1069 debts/election/fines**: always collatable
10. **Default**: standard donation → fully collatable with charge target based on heir category (Arts. 909/910)

**Key design decisions**:
- `CollatabilityResult` includes both `collatable` (for estate base computation) and `still_check_inofficiousness` (for Art. 1062 cases where exemption doesn't protect against impairing co-heirs' legitimes)
- Wedding gifts use a separate `inofficious_reducible` flag since they affect inofficiousness but NOT the estate base
- Professional expense deduction (`imputed_home_savings`) is accepted as user input, not computed by the engine (inherently subjective)

**Source**: `analysis/collation.md` Rules 1-2, 7, 9 and `analysis/computation-pipeline.md` Step 4

---

## Spec Sections Modified

| Section | Change |
|---------|--------|
| §2.3 | Added "FP Pipeline Order of Operations" subsection with `compute_free_portion_pipeline()` pseudocode |
| §8.3 | Added "Collatability Decision Tree" subsection with `determine_collatability()` pseudocode |
| §8.6 | Expanded with `collation_for_representatives()` algorithm, pipeline integration notes, and key rule citation |

---

## Remaining Gaps After This Fix

From spec-review, the remaining unfixed items are:
- **M1**: Vacancy resolution pseudocode detail (medium — rules are stated, just lacks unified function)
- **M4**: Nephews-only full/half blood debate config flag (medium — noted in §7.6)
- **M5**: Will-execution master algorithm (medium — steps described separately, lacks unified function)

These medium-severity items do not block implementation — the information is present in the spec, just not consolidated into single functions. They are acceptable for the current spec version.

---

## Cross-Reference

| Gap ID | Severity | Status | Spec Location |
|--------|----------|--------|---------------|
| H1 | High | **FIXED** | §2.3 FP Pipeline Order of Operations |
| H2 | High | **FIXED** | §8.6 Representation Collation Algorithm |
| H3 | High | **FIXED** | §8.3 Collatability Decision Tree |
| M1 | Medium | Accepted | §10 (rules stated, no unified function) |
| M4 | Medium | Accepted | §7.6 Branch 3 (debate noted) |
| M5 | Medium | Accepted | §2, §6, §7, §9 (steps separate) |

*Analysis based on spec-review gap assessment. Source pseudocode from: free-portion-rules.md (FP pipeline), collation.md (Art. 1064 algorithm, collatability decision tree), computation-pipeline.md (pipeline integration).*
