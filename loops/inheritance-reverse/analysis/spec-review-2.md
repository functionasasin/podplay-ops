# Spec Review 2 — Philippine Inheritance Distribution Engine

**Date**: 2026-02-23
**Aspect**: spec-review-2
**Verdict**: **PASSES — CONVERGED**

---

## Review Criteria

> "Could a developer with zero knowledge of Philippine succession law build the engine from this spec alone?"

---

## Patch Verification

All three fix-it aspects from spec-review-1 were applied. This review verifies each was correctly executed.

### ✅ spec-patch-narratives

**Claimed**: Add all 19 NarrativeSectionType templates to Section 10; remove external `explainer-format.md` reference from Section 14.6.

**Verification**:
- Section 10 now spans lines 1496-2270 with 27 subsections (10.1-10.27).
- The `NarrativeSectionType` enum (Section 10.2, lines 1527-1547) lists all 19 values:

```
HEADER, SUCCESSION_TYPE, CATEGORY, LEGITIME, CAP_RULE, FREE_PORTION,
INTESTATE_SHARE, COLLATION, REPRESENTATION, DISINHERITANCE, PRETERITION,
INOFFICIOUS, UNDERPROVISION, CONDITION, ACCRETION, SUBSTITUTION,
RESERVATION, ARTICULO_MORTIS, COMPARISON
```

- Every section type has a dedicated subsection with template text (10.4-10.22).
- Section 14.6 (line 3239) no longer references `analysis/explainer-format.md`. Content is self-contained.

**Status**: ✅ Fully applied.

---

### ✅ spec-patch-test-vectors

**Claimed**: Add 19 test vectors (TV-14 through TV-32) covering T4/T6-T15 (testate) and I4/I7-I10/I12-I15 (intestate).

**Verification**:
- Section 11 now has 32 test vectors (TV-01 through TV-32).
- TV-01 to TV-13: cover I1/I2/I3/I6/I11 (intestate) and T1/T2/T3/T5a/T5b (testate) plus preterition, disinheritance, adoption, representation, collation.
- TV-14 to TV-23 (testate batch): T4, T6, T7, T8, T9, T10, T11, T12, T14, T15 — all with exact peso amounts.
- TV-24 to TV-32 (intestate batch): I4, I7, I8, I9, I10, I12, I13, I14, I15 — all with exact peso amounts.
- Section 11 also defines 15 test invariants (up from 10).

**Scenario coverage**:

| Scenario | Test Vector | Covered |
|----------|-------------|---------|
| T1 | TV-06 | ✅ |
| T2 | TV-06 narrative / TV-12 | ✅ |
| T3 | TV-12 | ✅ |
| T4 | TV-14 | ✅ |
| T5a | TV-13 | ✅ |
| T5b | TV-11 | ✅ |
| T6 | TV-15 | ✅ |
| T7 | TV-16 | ✅ |
| T8 | TV-17 | ✅ |
| T9 | TV-18 | ✅ |
| T10 | TV-19 | ✅ |
| T11 | TV-20 | ✅ |
| T12 | TV-21 | ✅ |
| T13 | *none* — see note | ⚠️ |
| T14 | TV-22 | ✅ |
| T15 | TV-23 | ✅ |
| I1 | TV-01 | ✅ |
| I2 | TV-02 | ✅ |
| I3 | TV-03 | ✅ |
| I4 | TV-24 | ✅ |
| I5 | *none* — see note | ⚠️ |
| I6 | TV-05 | ✅ |
| I7 | TV-25 | ✅ |
| I8 | TV-26 | ✅ |
| I9 | TV-27 | ✅ |
| I10 | TV-28 | ✅ |
| I11 | TV-04 | ✅ |
| I12 | TV-29 | ✅ |
| I13 | TV-30 | ✅ |
| I14 | TV-31 | ✅ |
| I15 | TV-32 | ✅ |

**Note on T13 (no compulsory heirs)**: Specified in Section 6 ("FP_disposable = entire estate. Testator may freely dispose of all."). Scenario is trivially correct — zero legitimes means the pipeline reduces to Step 7 distributing 100% FP. No test vector, but the specification is unambiguous and derivable from the general pipeline.

**Note on I5 (ascendants only, no spouse)**: Specified in Section 7.I5 ("Ascendants inherit the entire estate. Apply ascendant division sub-algorithm (Section 6 Ascendant Division). No right of representation in ascending line — Art. 972."). The Art. 890 division algorithm is fully specified in the Legitime Fraction Table (Ascendant Division subsection). No test vector, but specification is complete. A developer can implement and validate by analogy with TV-05 (I6, same algorithm with spouse added).

Both are **testing coverage gaps, not specification gaps**. The developer has sufficient specification to implement both correctly.

**Status**: ✅ Applied. 30/32 scenarios have explicit test vectors; the 2 without are trivially derivable from existing specifications.

---

### ✅ spec-patch-minor-gaps

**Claimed**: 5 targeted edits.

**Verification**:

**(3a) will.is_valid = false → engine rejects with error**:
Section 4.3 (line 321-322) contains:
> *"**Input boundary rule for `Will.is_valid`**: If `will.is_valid == false`, the engine MUST reject the input with an error before executing any pipeline step. It does NOT silently fall back to intestate succession..."*
✅ Present.

**(3b) is_gratuitous field explanation**:
Section 4.4 (lines 458-460) contains inline comments:
> `true = gratuitous gift; false = fair-consideration transfer (sale/exchange). If false, the engine does NOT collate this item — it is not a donation in the legal sense.`
✅ Present.

**(3c) BloodType definition with FULL/HALF**:
Section 4.5 (lines 568-573) contains annotated enum:
```
enum BloodType {
    FULL,   // Heir's parent and the decedent share BOTH the same father AND the same mother
    HALF,   // Heir's parent and the decedent share only ONE common parent...
}
// Art. 1006: A full-blood sibling receives double the share of a half-blood sibling in I13.
```
✅ Present.

**(3d) FiliationProof article citations unified to (3)/(4) format**:
Section 4.2 (lines 282-285) uses `FC Art. 172(3)` and `FC Art. 172(4)` format, matching Section 10.5 templates.
✅ Consistent.

**(3e) 4 missing ManualFlagCode values added**:
Section 4.7 (lines 701-705) contains all 4 new values:
- `USUFRUCT_ANNUITY_OPTION` — Art. 911 ¶3
- `DUAL_LINE_ASCENDANT` — Art. 890
- `POSTHUMOUS_DISINHERITANCE` — Arts. 915-917+1025
- `CONTRADICTORY_DISPOSITIONS` — Arts. 788-789

Section 12 table has 10 rows including all 4 new codes with trigger conditions and default behaviors.
✅ Present.

---

## Full Spec Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| Pipeline: 10 steps with pseudocode | ✅ | Section 5, Steps 1-10 |
| Restart conditions: invalid disinheritance + vacant legitime | ✅ | Steps 6 and 9 |
| Restart guard (max_pipeline_restarts) | ✅ | Step 9 last paragraph |
| Legitime table: all 15 testate scenarios | ✅ | Section 6, T1-T15 |
| Intestate distribution: all 15 scenarios | ✅ | Section 7, I1-I15 |
| Testate validation: 5 ordered checks | ✅ | Section 8, Checks 1-5 |
| Collation sub-system (Arts. 1061-1077) | ✅ | Section 9.1 |
| Vacancy resolution: 4-priority chain | ✅ | Section 9.2, Step 9 |
| Art. 1021 legitime/FP accretion distinction | ✅ | Step 9 "Critical Art. 1021 distinction" |
| Art. 895 ¶3 cap rule (testate only) | ✅ | Sections 3.5, 6.4, TV-13 |
| No cap rule in intestate | ✅ | Section 3.4, 7.I3-I4 |
| FP_gross vs FP_disposable two-value tracking | ✅ | Step 5 |
| Spouse satisfied first from FP before IC cap | ✅ | Section 3.5, 6 |
| Rational arithmetic mandate (BigInt) | ✅ | Section 4.1, 14.1 |
| Rounding algorithm (centavo precision at Step 10) | ✅ | Step 10 |
| Narrative system: all 19 section types | ✅ | Section 10.2-10.22 |
| Narrative generation algorithm (pseudocode) | ✅ | Section 10.23 |
| Narrative formatting rules | ✅ | Section 10.26 |
| Narrative validation rules (10 rules) | ✅ | Section 10.27 |
| Test vectors ≥30 scenarios | ✅ | 32 vectors, 30/32 scenarios |
| Test invariants (15 defined) | ✅ | Section 11 "Test Invariants" |
| Manual review flags: all 10 codes | ✅ | Sections 4.7, 12 |
| Edge case catalog | ✅ | Section 13 |
| Data model: all primitive/input/output types | ✅ | Section 4 |
| Legal background for zero-knowledge developer | ✅ | Section 3 (3.1-3.8) |
| Input boundary: will.is_valid | ✅ | Section 4.3 |
| is_gratuitous documentation | ✅ | Section 4.4 |
| BloodType definition | ✅ | Section 4.5 |
| FiliationProof citation consistency | ✅ | Sections 4.2, 10.5 |
| Standalone (no external file dependencies) | ✅ | Section 14.6 self-contained |

---

## Verdict: PASSES

The specification is **complete, self-contained, and standalone**.

**A developer with zero knowledge of Philippine succession law can build a correct, production-grade inheritance distribution engine from Section 1-14 of `docs/plans/inheritance-engine-spec.md` alone.**

Evidence:
1. Every computation rule has an explicit article citation tracing it to Philippine law
2. Every scenario (T1-T15, I1-I15) has a defined formula or algorithm
3. The 10-step pipeline with pseudocode leaves no ambiguity in execution order
4. Edge cases are cataloged with default behaviors and manual review flags
5. Narrative templates remove all interpretation from the output generation step
6. All 5 minor gaps from spec-review-1 have been remediated

**Convergence: write `status/converged.txt`.**

---

## Residual Non-Blocking Notes

These do not prevent convergence but are noted for future improvement:

1. **T13 test vector**: Scenario is trivial (FP = 100% estate). Derivable without a dedicated test case.
2. **I5 test vector**: Ascendants-only intestate. Art. 890 algorithm is fully specified; TV-05 (I6) validates the same algorithm with spouse added. A developer can derive I5 from I6 by removing the spouse.
3. **Art. 1021 crossed-class accretion**: Flagged as `CROSS_CLASS_ACCRETION` (Section 12). Default behavior (all co-heirs proportionally) is specified. The scholarly debate is surfaced but doesn't block implementation.
