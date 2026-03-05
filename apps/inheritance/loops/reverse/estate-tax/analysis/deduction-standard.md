# Deduction: Standard Deduction
## NIRC Sec. 86(A)(4) [Citizens/Residents] and Sec. 86(B)(1) [Non-Resident Aliens]

**Aspect**: deduction-standard
**Wave**: 2 (TRAIN-era rule extraction)
**Analyzed**: 2026-02-23
**Source**: `input/legal-sources/nirc-title-iii.md`, Sec. 86(A)(4) and 86(B)(1); `input/legal-sources/pre-train-rates.md`

---

## Legal Basis

**NIRC Section 86(A)(4)** (TRAIN-era, as amended by RA 10963, effective January 1, 2018):

> "Standard Deduction — A deduction in the amount of Five million pesos (₱5,000,000) shall be allowed as an additional deduction without need of substantiation."

**NIRC Section 86(B)(1)** (Non-resident aliens, TRAIN-era):

> "Standard Deduction — In the case of a nonresident not a citizen of the Philippines, [the deduction is] Five hundred thousand pesos (₱500,000)."

**Pre-TRAIN Amount**: Prior to January 1, 2018, the standard deduction was:
- Citizens and residents: **₱1,000,000** (One million pesos)
- Non-resident aliens: **₱500,000** (unchanged by TRAIN)

**TRAIN Change**: The TRAIN Law (RA 10963) increased the citizen/resident standard deduction from ₱1,000,000 to ₱5,000,000. The NRA amount of ₱500,000 was not changed.

**Form 1801 Mapping**: Schedule 6, Line 6A → Part IV Item 37A (single column, no exclusive/conjugal split).

---

## Rule (Pseudocode)

```
// Standard deduction is determined automatically from decedent status.
// No user input required; no documentation required; no conditions to check.

function computeStandardDeduction(decedent, regime):

  if decedent.isNonResidentAlien:
    // NRA: ₱500,000 for ALL regimes (TRAIN, pre-TRAIN, amnesty)
    return 500_000

  else:
    // Citizen or resident alien
    if regime == "TRAIN":
      // Death on or after January 1, 2018
      return 5_000_000

    elif regime == "pre_TRAIN":
      // Death before January 1, 2018
      return 1_000_000

    elif regime == "amnesty":
      // Estate tax amnesty (RA 11213/11569/11956)
      // Deductions applicable "at the time of death" → pre-TRAIN rules apply
      // (All amnesty-eligible estates died before Jan 1, 2018 under RA 11213/11569;
      //  RA 11956 extended to May 31, 2022 deaths, so TRAIN-era deaths may qualify)
      if decedent.dateOfDeath >= date("2018-01-01"):
        // TRAIN standard deduction applies if death was in TRAIN era
        return 5_000_000
      else:
        // Pre-TRAIN standard deduction applies
        return 1_000_000

deductions.standardDeduction = computeStandardDeduction(decedent, regime)
// → Form 1801 Item 37A, single value (no A/B column split)
```

---

## Application in the Computation Pipeline

The standard deduction is a **special deduction** (Schedule 6, not Schedule 5). It is applied:
1. **After** ordinary deductions (Schedule 5, Item 35)
2. **After** computing Item 36 (estate after ordinary deductions)
3. **As part of** total special deductions (Item 37), alongside family home, medical, and RA 4917
4. **Before** surviving spouse share (Item 39)

```
// Computation sequence (simplified):
Item34 = grossEstate.total.total                // Gross Estate
Item35 = deductions.ordinaryTotal.total         // Ordinary Deductions (ELIT, vanishing, public)
Item36 = max(0, Item34 - Item35)               // Estate After Ordinary Deductions

Item37A = deductions.standardDeduction          // Standard Deduction (THIS ASPECT)
Item37B = deductions.familyHomeDeduction        // Family Home (separate aspect)
Item37C = deductions.medicalExpenses            // Medical Expenses (separate aspect)
Item37D = deductions.ra4917                     // RA 4917 Benefits (separate aspect)
Item37  = Item37A + Item37B + Item37C + Item37D // Total Special Deductions

Item38  = max(0, Item36 - Item37)              // Net Estate
Item39  = deductions.survivingSpouseShare       // Surviving Spouse Share (separate aspect)
Item40  = max(0, Item38 - Item39)              // Net Taxable Estate
```

**Key**: Item 37 (total special deductions including standard deduction) is subtracted from Item 36 — not from Item 34. This means ordinary deductions are applied first, then special deductions. If ordinary deductions already reduce the estate to ₱0, the standard deduction adds no further benefit.

---

## Conditions

| Condition | Rule |
|-----------|------|
| Documentation | **None required.** Automatic deduction; no receipts, certifications, or filings needed. |
| Per-estate limit | **One** standard deduction per estate. Not per heir; not per property. |
| A/B column split | **Not applicable.** Standard deduction is a single-column value with no exclusive/conjugal split. It applies to the net estate total. |
| NRA eligibility | Non-resident aliens receive ₱500,000 regardless of regime. |
| Citizen/resident eligibility | Citizens and residents receive ₱5,000,000 (TRAIN) or ₱1,000,000 (pre-TRAIN). |
| Zero estate override | If estate after ordinary deductions (Item 36) = ₱0, the standard deduction cannot create a negative net estate. Item 38 is floored at ₱0. |
| Amendments | If the estate files an amended return, the same standard deduction applies (it is not a discretionary election). |

---

## Form 1801 Mapping

| Form Location | Label | Engine Field | Value |
|--------------|-------|-------------|-------|
| Schedule 6, Line 6A | Standard Deduction | `deductions.standardDeduction` | ₱5,000,000 (citizen/resident TRAIN) |
| Part IV, Item 37A | Standard Deduction | Same | Single column; no A/B split |
| Part IV, Item 37 | Total Special Deductions | `deductions.specialTotal` | Item 37A + 37B + 37C + 37D |
| Part IV, Item 38 | Net Estate | `computation.netEstate` | Item 36 − Item 37; floored at ₱0 |

**Note**: Item 37A has no Column A / Column B split on the actual Form 1801. It is a single value subracted from the Column C total of Item 36.

---

## Standard Deduction by Regime and Decedent Type

| Regime | Citizen/Resident | Non-Resident Alien |
|--------|-----------------|-------------------|
| TRAIN (death ≥ 2018-01-01) | **₱5,000,000** | **₱500,000** |
| Pre-TRAIN (death < 2018-01-01) | **₱1,000,000** | **₱500,000** |
| Amnesty (pre-2018 deaths) | **₱1,000,000** | **₱500,000** |
| Amnesty (2018-01-01 to 2022-05-31) | **₱5,000,000** | **₱500,000** |

**TRAIN Line**: Deaths on or after January 1, 2018.
**Amnesty coverage under RA 11956**: Extended to deaths on or before May 31, 2022, meaning some TRAIN-era deaths (Jan 1, 2018 – May 31, 2022) may be settled under amnesty. For those, the ₱5,000,000 TRAIN standard deduction applies (because the law says deductions "applicable at the time of death").

---

## Edge Cases

1. **No surviving spouse, no other deductions**: Estate with gross estate of ₱4,000,000 and no ordinary deductions. Standard deduction of ₱5,000,000 exceeds estate after ordinary deductions (₱4,000,000). Net estate = max(0, ₱4,000,000 − ₱5,000,000) = ₱0. Estate tax = ₱0.

2. **NRA mistakenly given ₱5M deduction**: The engine must check `decedent.isNonResidentAlien` and enforce ₱500,000 for NRAs. User cannot elect a higher standard deduction.

3. **Standard deduction plus other special deductions exceed Item 36**: If Item 36 = ₱3,000,000 and total special deductions (Item 37) = ₱6,000,000, Item 38 = max(0, ₱3,000,000 − ₱6,000,000) = ₱0. The excess ₱3,000,000 is lost — it cannot offset the surviving spouse share or carry over.

4. **Amnesty estate with TRAIN-era death (2018-2022)**: RA 11956 expanded coverage to May 31, 2022. For these estates, the TRAIN standard deduction (₱5,000,000) applies, not the pre-TRAIN ₱1,000,000. The engine must use the date-of-death to determine which standard deduction amount applies even within the amnesty path.

5. **Pre-TRAIN estate, NRA**: Standard deduction = ₱500,000 (same as TRAIN). No change across regimes for NRAs.

6. **Amended return, different deduction**: Standard deduction cannot be changed between original and amended return. It is statute-fixed, not elected. Both returns will show the same amount.

7. **Estate with zero gross estate (theoretical)**: Standard deduction = ₱5,000,000 (or applicable amount). Gross estate = ₱0. Ordinary deductions = ₱0. Item 36 = ₱0. Item 37A = ₱5,000,000. Item 38 = max(0, ₱0 − ₱5,000,000) = ₱0. Tax = ₱0. This is valid — the engine should not error on this case.

8. **Resident alien (non-citizen but PH resident)**: Uses citizen/resident rules. Standard deduction = ₱5,000,000 (TRAIN) or ₱1,000,000 (pre-TRAIN). Not the NRA ₱500,000 amount. The NRA classification applies only to non-residents who are also non-citizens.

9. **Multiple heirs**: The standard deduction applies to the estate as a whole — not per heir. There is no multiplication of the standard deduction by the number of heirs.

10. **Conjugal vs. exclusive property composition**: The standard deduction is applied after the A/B column distinction has been collapsed into a single total. The engine does not allocate the standard deduction between Column A and Column B. It subtracts from the running total.

---

## Test Implications

1. **TRAIN citizen, simple**: Standard deduction = ₱5,000,000. Verify it appears at Item 37A, not Schedule 5.
2. **TRAIN NRA**: Standard deduction = ₱500,000. Verify lower amount for NRA regardless of estate size.
3. **Pre-TRAIN citizen**: Standard deduction = ₱1,000,000. Verify TRAIN amount (₱5M) is NOT used.
4. **Pre-TRAIN NRA**: Standard deduction = ₱500,000. Same as TRAIN NRA.
5. **Zero net estate from standard deduction**: Gross estate ₱3,000,000, no ordinary deductions, TRAIN citizen. Item 36 = ₱3,000,000. Item 37A = ₱5,000,000. Item 38 = ₱0. Item 40 = ₱0. Tax = ₱0.
6. **Standard deduction combines with other special deductions**: Verify Item 37 = 37A + 37B + 37C + 37D (not double-counted).
7. **Amnesty, pre-2018 death**: Standard deduction = ₱1,000,000 (pre-TRAIN rules apply).
8. **Amnesty, 2019 death (RA 11956 coverage)**: Standard deduction = ₱5,000,000 (TRAIN rules apply at time of death).
9. **No documentation validation needed**: Engine should not prompt for receipts or certifications for standard deduction. It is automatic.
10. **Column structure**: Verify standard deduction has no Column A / Column B breakdown in output — only a single value at Item 37A.
