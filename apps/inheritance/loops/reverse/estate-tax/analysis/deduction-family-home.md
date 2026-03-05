# Analysis: Family Home Deduction

**Aspect**: `deduction-family-home`
**Wave**: 2 — TRAIN-Era Rule Extraction
**Date**: 2026-02-23
**NIRC Basis**: Section 86(A)(5) as amended by RA 10963 (TRAIN Law)

---

## Legal Basis

**NIRC Section 86(A)(5)** (TRAIN-amended):

> "The Family Home. — An amount equivalent to the current fair market value of the decedent's family home: Provided, however, That if the said current fair market value exceeds Ten million pesos (₱10,000,000), the excess shall be subject to estate tax."

**Pre-TRAIN cap**: ₱1,000,000 (same conditions apply; only the peso cap differs).

**Implementing regulation**: BIR Revenue Regulations 12-2018 implements the TRAIN estate tax provisions. The family home is listed under special deductions in Form 1801 Schedule 6, Line 6B.

---

## Rule (Pseudocode)

```
# INPUTS REQUIRED
family_home = {
    fmv: Decimal,                    # Full FMV of property (user-provided, pre-valued)
    ownership: "exclusive" | "conjugal" | "communal",
    barangayCertification: Boolean,  # Certification from Barangay Captain
    isActualResidence: Boolean,      # Was this the actual family residence at time of death?
}
decedent = {
    isNonResidentAlien: Boolean,
    regime: "TRAIN" | "PRE_TRAIN" | "AMNESTY",
}

# STEP 1: Eligibility check
if decedent.isNonResidentAlien:
    family_home_deduction = 0
    STOP  # NRAs do not qualify for family home deduction

if not family_home.barangayCertification:
    family_home_deduction = 0
    STOP  # Missing certification = no deduction

if not family_home.isActualResidence:
    family_home_deduction = 0
    STOP  # Property must be actual residence at time of death

# STEP 2: Determine cap based on regime
if decedent.regime == "TRAIN":
    cap = 10_000_000
else:  # PRE_TRAIN or AMNESTY
    cap = 1_000_000

# STEP 3: Compute applicable FMV based on ownership
# The deduction covers the DECEDENT'S SHARE of the family home.
# For conjugal/communal property, the decedent's share is ½ of FMV.
# The surviving spouse's share (the other ½) is handled separately at Item 39.
if family_home.ownership == "exclusive":
    applicable_fmv = family_home.fmv
elif family_home.ownership in ("conjugal", "communal"):
    applicable_fmv = family_home.fmv * 0.5

# STEP 4: Apply cap
family_home_deduction = min(applicable_fmv, cap)

# STEP 5: Gross estate entry (Schedule 1A / Item 30 — separate from deduction)
# The FULL FMV appears in Item 30 (gross estate). The cap and ownership adjustment
# are only applied at Item 37B (deduction). Both must be output by the engine.
if family_home.ownership == "exclusive":
    item30_col_a = family_home.fmv   # Column A: exclusive
    item30_col_b = 0
elif family_home.ownership in ("conjugal", "communal"):
    item30_col_a = 0
    item30_col_b = family_home.fmv   # Column B: full conjugal FMV

item30_col_c = item30_col_a + item30_col_b   # Column C = A + B
item37b = family_home_deduction              # Single-column, no A/B split
```

---

## Conditions

| Condition | Detail |
|-----------|--------|
| **Citizenship/Residency** | Available ONLY to citizens and resident aliens. Non-resident aliens are ineligible (₱0 deduction). |
| **Barangay Certification** | Certification from the Barangay Captain of the barangay where the family home is located is required. Without it, deduction = ₱0. |
| **Actual Residence** | The property must have been the actual residential home of the decedent AND their family at the time of death. A vacant house or investment property does not qualify. |
| **One Property Only** | Only ONE property qualifies as the family home. The engine must reject inputs with more than one property designated as family home. |
| **Amount Cap** | TRAIN: ₱10,000,000 maximum. Pre-TRAIN: ₱1,000,000 maximum. |
| **Ownership Effect** | Exclusive: full FMV deductible (up to cap). Conjugal/Communal: ½ of FMV deductible (up to cap), because the decedent's share = ½. |

---

## Form 1801 Mapping

### Gross Estate Side (Schedule 1A → Part IV Item 30)

| Field | Value | Notes |
|-------|-------|-------|
| Schedule 1A | Same fields as Schedule 1 (title number, tax declaration, location, area, classification, FMV) | Plus: `barangayCertification` Boolean |
| Item 30, Column A | `family_home.fmv` if exclusive; 0 if conjugal | Full FMV, no cap |
| Item 30, Column B | `family_home.fmv` if conjugal/communal; 0 if exclusive | Full FMV, no cap |
| Item 30, Column C | Column A + Column B | Feeds into Item 34 (Gross Estate total) |

**Important**: The cap (₱10M or ₱1M) is NOT applied at Item 30. Item 30 shows the true FMV. The cap is applied only on the deduction side.

### Deduction Side (Schedule 6 Line 6B → Part IV Item 37B)

| Field | Value |
|-------|-------|
| Item 37B | `family_home_deduction` = `min(applicable_fmv, cap)` |
| Column structure | No A/B split. Item 37B is a single value applied at the net estate level. |

The family home deduction flows: Schedule 6B → Item 37B → Item 37 (Total Special Deductions) → Item 38 (Net Estate).

---

## Interaction with Surviving Spouse Share (Item 39)

This is the most important design consideration for this deduction.

**The conjugal/communal family home appears TWICE in the computation:**

1. **Gross estate (Item 30, Column B)**: The full FMV of the conjugal family home enters the gross estate. This is correct — the decedent's estate must account for all conjugal property before the spouse's share is separated.

2. **Family home deduction (Item 37B)**: Only the decedent's ½ of FMV (capped at ₱10M) is deducted here, not the full FMV.

3. **Surviving spouse share (Item 39)**: The Schedule 6A computation starts from ALL conjugal gross estate (Column B total) and deducts conjugal ordinary deductions. The result × 0.50 = spouse's share. This deduction covers the spouse's ½ of ALL conjugal property, including ½ of the family home.

**Net effect for a fully conjugal family home**: The full FMV is ultimately removed from the net taxable estate:
- Decedent's ½ removed at Item 37B (family home deduction)
- Spouse's ½ removed at Item 39 (surviving spouse share)
- Result: entire family home is excluded from the net taxable estate (subject to the ₱10M cap on Item 37B)

**Example**: Conjugal family home FMV = ₱16M:
- Item 30, Col B = ₱16M (gross estate)
- Item 37B = min(₱16M × 0.5, ₱10M) = min(₱8M, ₱10M) = ₱8M (capped)
- Item 39 includes ½ of ₱16M = ₱8M as part of spousal share
- Combined effect: ₱8M + ₱8M = ₱16M deducted from ₱16M gross estate for family home → full exclusion
- (Note: the ₱10M cap means the decedent's ½ deduction is limited; excess ₱8M of the family home remains exposed if there's insufficient spousal share to cover it)

---

## ⚠️ Legal Ambiguity: Full FMV vs. ½ FMV for Conjugal Property

**Two conflicting interpretations exist in the source materials:**

**Interpretation A — ½ of FMV for conjugal (this analysis adopts)**:
- Source: NIRC cached text explicitly states "For conjugal/communal property: ½ of FMV deductible (up to ₱10M)"
- Source: Commentary Key Takeaways: "For conjugal/community: only ½ of FMV used (decedent's share)"
- Legal logic: The deduction covers the "decedent's family home" = the decedent's share = ½

**Interpretation B — Full FMV regardless of conjugal status**:
- Source: Commentary Sample 3 shows ₱8M deduction for a conjugal ₱8M family home (not ₱4M)
- Source: The preliminary form-1801-fields.md analysis used `min(grossEstate.familyHome.total, 10_000_000)` (full total)
- Legal logic: The surviving spouse share separately handles conjugal property division; double application isn't double-counting if the flows are separate

**Recommendation for engine**: Implement Interpretation A (½ of FMV for conjugal) because:
1. It is explicitly stated in the cached NIRC text
2. It is internally consistent with the legal concept of deducting "the decedent's share"
3. Sample 3 is a third-party commentary that may have simplified the example (the result is ₱0 either way, so the sample cannot distinguish the approaches)
4. Interpretation B creates a structural double-deduction for the spouse's portion

**Required action**: Engine developers should verify against BIR Revenue Regulations 12-2018 Section 6(5) and BIR Form 1801 instructions for authoritative guidance. Flag this as a validation point.

---

## Pre-TRAIN Differences

| Item | Pre-TRAIN | TRAIN |
|------|-----------|-------|
| Cap amount | ₱1,000,000 | ₱10,000,000 |
| Conditions (barangay cert, actual residence, residents only, one property) | SAME | SAME |
| Exclusive vs. conjugal distinction | SAME (½ of FMV for conjugal) | SAME |
| Amnesty path | Uses pre-TRAIN cap (₱1,000,000) | N/A |

---

## Amnesty Path

Under RA 11213/11569 (estate tax amnesty for deaths before Jan 1, 2018):
- The family home deduction IS available under amnesty
- Cap = ₱1,000,000 (pre-TRAIN cap, since all amnesty estates died before 2018)
- Same eligibility conditions apply (barangay cert, actual residence, citizens/residents only)
- Same ½ of FMV rule for conjugal property

---

## Edge Cases

| Edge Case | Engine Behavior |
|-----------|----------------|
| **FMV exceeds cap (TRAIN)**: Family home FMV = ₱15M (exclusive) | Deduction = ₱10M. Excess ₱5M remains in net estate subject to tax. |
| **FMV exceeds cap (conjugal, TRAIN)**: Family home FMV = ₱22M conjugal | Applicable FMV = ₱11M; deduction = min(₱11M, ₱10M) = ₱10M. |
| **No barangay certification** | Deduction = ₱0. Engine MUST validate this input and zero out the deduction if false. Item 30 still carries the FMV in gross estate. |
| **Non-resident alien** | Deduction = ₱0 (ineligible). Item 30 = ₱0 (family home excluded from NRA gross estate per Sec. 85(B); see gross-estate-nonresident analysis). |
| **Property is investment/rental, not actual residence** | `isActualResidence = false` → deduction = ₱0. Engine relies on user input. |
| **Decedent died outside the family home** (e.g., hospital) | Deduction still available if the property was the family residence at time of death — dying elsewhere doesn't disqualify. |
| **Family home destroyed before filing** | Property no longer exists at filing but existed at date of death. The FMV at date of death governs. Deduction is still available if conditions were met at time of death. |
| **Conjugal family home with outstanding mortgage** | Full FMV still enters Schedule 1A. Mortgage deducted separately under Schedule 5C (ELIT). The family home deduction is NOT reduced by the mortgage. |
| **Multiple properties tagged as family home** | Engine error — reject input. Only ONE family home permitted. User must designate which property. |
| **Exclusive property — family home** | Deduction = min(FMV, cap). Full FMV. Column A only. |
| **No family (bachelor decedent)** | Statute says "actual residential home of the decedent and their family." If decedent had no family dependents but had an actual residence, BIR practice appears to allow the deduction if the property was the decedent's actual residence. Engine should accept `isActualResidence = true` regardless of family status. |
| **Property under co-ownership (not spouse)** | If property is co-owned with a non-spouse (e.g., sibling), the decedent's proportional share enters Schedule 1A. Deduction applies to that share (up to cap). Engine must accept a `decedentOwnershipPercentage` field for this case. |
| **Pre-TRAIN: cap at ₱1M, FMV = ₱800K exclusive** | Deduction = min(₱800K, ₱1M) = ₱800K. Cap not reached. |

---

## Test Implications

The following test cases are required for the family home deduction:

1. **FT-1 — Exclusive, below cap (TRAIN)**: FMV = ₱6M exclusive → deduction = ₱6M.
2. **FT-2 — Exclusive, at cap (TRAIN)**: FMV = ₱10M exclusive → deduction = ₱10M.
3. **FT-3 — Exclusive, above cap (TRAIN)**: FMV = ₱14M exclusive → deduction = ₱10M.
4. **FT-4 — Conjugal, below ½ of cap (TRAIN)**: FMV = ₱8M conjugal → applicable = ₱4M → deduction = ₱4M.
5. **FT-5 — Conjugal, ½ exceeds cap (TRAIN)**: FMV = ₱22M conjugal → applicable = ₱11M → deduction = ₱10M (capped).
6. **FT-6 — No barangay cert**: FMV = ₱8M, `barangayCertification = false` → deduction = ₱0.
7. **FT-7 — NRA**: `isNonResidentAlien = true` → deduction = ₱0, Item 30 = ₱0.
8. **FT-8 — Pre-TRAIN cap**: FMV = ₱1.5M exclusive, regime = PRE_TRAIN → deduction = ₱1M.
9. **FT-9 — Pre-TRAIN conjugal**: FMV = ₱1.2M conjugal, regime = PRE_TRAIN → applicable = ₱600K → deduction = ₱600K (below ₱1M cap).
10. **FT-10 — Amnesty**: FMV = ₱2M exclusive, regime = AMNESTY → deduction = ₱1M (pre-TRAIN cap).
11. **FT-11 — Multiple properties**: Two properties tagged as family home → engine error (reject).
12. **FT-12 — Mortgage on conjugal family home**: FMV = ₱8M, mortgage = ₱2M → deduction = min(₱4M, ₱10M) = ₱4M; mortgage handled separately at Schedule 5C.

---

## Correction to Preliminary form-1801-fields.md

The form-1801 analysis (Validation Rule 8) states:
```
deductions.familyHomeDeduction = min(grossEstate.familyHome.total, 10_000_000)
```

This must be corrected to account for ownership type:
```
if family_home.ownership == "exclusive":
    deductions.familyHomeDeduction = min(grossEstate.familyHome.exclusive, cap)
elif family_home.ownership in ("conjugal", "communal"):
    deductions.familyHomeDeduction = min(grossEstate.familyHome.conjugal * 0.5, cap)
```

(Where `cap = 10_000_000` for TRAIN; `cap = 1_000_000` for pre-TRAIN/amnesty.)

This correction should be propagated to the engine data model and test vectors.

---

## Summary

| Item | Value |
|------|-------|
| **Deduction Type** | Special deduction (Schedule 6B / Item 37B) |
| **Cap (TRAIN)** | ₱10,000,000 |
| **Cap (Pre-TRAIN / Amnesty)** | ₱1,000,000 |
| **Eligible Decedents** | Citizens and resident aliens only (not NRAs) |
| **Documentation** | Barangay Captain certification (mandatory) |
| **Exclusive property formula** | `min(FMV, cap)` |
| **Conjugal/communal property formula** | `min(FMV × 0.5, cap)` |
| **Gross estate appearance** | Schedule 1A / Item 30 — full FMV, no cap, split into Column A or B |
| **Deduction appearance** | Item 37B — single column, no A/B split |
| **Interaction with Item 39** | The ½ FMV rule for conjugal ensures the decedent's share is deducted here, and the spouse's ½ is deducted at Item 39 — together removing the full family home from net taxable estate |
| **Amnesty availability** | Yes (with pre-TRAIN cap) |
