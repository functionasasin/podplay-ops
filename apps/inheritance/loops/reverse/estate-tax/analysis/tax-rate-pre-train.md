# Analysis: tax-rate-pre-train

**Aspect**: tax-rate-pre-train
**Wave**: 3 — Pre-TRAIN Rule Extraction
**Date Analyzed**: 2026-02-24
**Legal Source**: `input/legal-sources/pre-train-rates.md`

---

## Legal Basis

**NIRC Section 84** (as originally enacted by RA 8424, Tax Reform Act of 1997, effective January 1, 1998; before amendment by TRAIN Law):

> "There shall be levied, assessed, collected and paid upon the transfer of the net estate of every decedent, whether resident or nonresident of the Philippines, a tax based on the value of such net estate, as computed in accordance with the following schedule:"

Applies to decedents whose **date of death is before January 1, 2018**. This version of Sec. 84 was entirely repealed and replaced by the TRAIN Law's flat 6% rate effective January 1, 2018.

---

## Rate Schedule

| Net Taxable Estate | Tax Due |
|---|---|
| Not over ₱200,000 | **₱0 (Exempt)** |
| Over ₱200,000 but not over ₱500,000 | **5%** of the excess over ₱200,000 |
| Over ₱500,000 but not over ₱2,000,000 | ₱15,000 + **8%** of the excess over ₱500,000 |
| Over ₱2,000,000 but not over ₱5,000,000 | ₱135,000 + **11%** of the excess over ₱2,000,000 |
| Over ₱5,000,000 but not over ₱10,000,000 | ₱465,000 + **15%** of the excess over ₱5,000,000 |
| Over ₱10,000,000 | ₱1,215,000 + **20%** of the excess over ₱10,000,000 |

Key distinction from TRAIN: there is a **₱200,000 exemption threshold** — net taxable estates of ₱200,000 or less owe **zero tax**. Under TRAIN, there is no such threshold; 6% applies from ₱1.

---

## Rule (Pseudocode)

```
// Input: net_taxable_estate (same structural position as Item 40 in TRAIN Form 1801)
// Applies when: decedent.dateOfDeath < 2018-01-01

function computePreTrainEstateTax(net_taxable_estate):
    // Floor at 0 — cannot be negative
    if net_taxable_estate < 0:
        net_taxable_estate = 0

    if net_taxable_estate <= 200_000:
        estate_tax_due = 0

    elif net_taxable_estate <= 500_000:
        estate_tax_due = (net_taxable_estate - 200_000) * 0.05

    elif net_taxable_estate <= 2_000_000:
        estate_tax_due = 15_000 + (net_taxable_estate - 500_000) * 0.08

    elif net_taxable_estate <= 5_000_000:
        estate_tax_due = 135_000 + (net_taxable_estate - 2_000_000) * 0.11

    elif net_taxable_estate <= 10_000_000:
        estate_tax_due = 465_000 + (net_taxable_estate - 5_000_000) * 0.15

    else:
        estate_tax_due = 1_215_000 + (net_taxable_estate - 10_000_000) * 0.20

    // Apply foreign tax credit (citizens/residents only)
    net_estate_tax_due = max(0, estate_tax_due - foreign_tax_credit)

    return estate_tax_due, net_estate_tax_due
```

### Bracket Boundary Verification

These fixed amounts must be hardcoded precisely — they are derived by integrating the rate below:

| Boundary | Verification |
|---|---|
| Tax at ₱500,000 | (₱500K − ₱200K) × 0.05 = ₱15,000 ✓ |
| Tax at ₱2,000,000 | ₱15,000 + (₱2M − ₱500K) × 0.08 = ₱15,000 + ₱120,000 = ₱135,000 ✓ |
| Tax at ₱5,000,000 | ₱135,000 + (₱5M − ₱2M) × 0.11 = ₱135,000 + ₱330,000 = ₱465,000 ✓ |
| Tax at ₱10,000,000 | ₱465,000 + (₱10M − ₱5M) × 0.15 = ₱465,000 + ₱750,000 = ₱1,215,000 ✓ |

---

## Conditions

| Condition | Value |
|---|---|
| Regime applicability | Decedent's date of death is **before January 1, 2018** |
| Tax rate structure | **Graduated** — 0%, 5%, 8%, 11%, 15%, 20% |
| Exemption threshold | Net taxable estate ≤ ₱200,000 → zero tax |
| Who is subject | Every decedent — citizen, resident alien, non-resident alien |
| Tax base | Net taxable estate (after all allowable pre-TRAIN deductions) |
| Minimum tax | ₱0 (applies even for estates above ₱200,000 threshold if deductions bring net to ≤ ₱200,000) |

**Important**: The graduated schedule applies identically to citizens, resident aliens, and non-resident aliens. The NRA difference lies entirely in the gross estate scope (PH-situs only) and deduction calculations — not in the rate schedule itself.

---

## Computation Pipeline Position

The pre-TRAIN rate computation occupies the same final position in the pipeline as TRAIN's flat 6%:

```
gross_estate_total              // same as Item 34 equivalent
  - ordinary_deductions         // same as Item 35 equivalent
                                // (includes funeral + judicial/admin expenses — see deductions-pre-train-diffs)
= estate_after_ordinary         // same as Item 36 equivalent

  - special_deductions          // same as Item 37 equivalent
                                // standard deduction = ₱1,000,000 (pre-TRAIN) NOT ₱5,000,000
                                // family home cap = ₱1,000,000 (pre-TRAIN) NOT ₱10,000,000
= net_estate                    // same as Item 38 equivalent

  - surviving_spouse_share      // same as Item 39 equivalent (formula unchanged)
= net_taxable_estate            // same as Item 40 equivalent ← INPUT TO RATE SCHEDULE

estate_tax_due = computePreTrainEstateTax(net_taxable_estate)
  - foreign_tax_credit          // same as Item 43 equivalent
= net_estate_tax_due            // same as Item 44 equivalent (floor: 0)
```

---

## Form Mapping

Pre-TRAIN returns use **BIR Form 1801 (June 2006 revision)** — a different physical form from the TRAIN-era Form 1801 (January 2018 revision). Both forms follow the same structural flow (gross estate → deductions → net taxable estate → tax rate → tax due), but the line item numbers and some schedule labels differ.

**Engine output contract for pre-TRAIN**: The engine produces the same named computation fields as for TRAIN-era estates. The output is labelled "Pre-TRAIN Computation" to signal it corresponds to the June 2006 Form 1801, not the January 2018 form.

| Computation Variable | TRAIN Form 1801 Equivalent | Description |
|---|---|---|
| `preTrainComputation.grossEstateTotal` | Item 34 | Sum of all gross estate items |
| `preTrainComputation.ordinaryDeductionsTotal` | Item 35 | ELIT + funeral + judicial + vanishing + public transfers |
| `preTrainComputation.estateAfterOrdinaryDeductions` | Item 36 | Item 34 − Item 35 |
| `preTrainComputation.specialDeductionsTotal` | Item 37 | Standard (₱1M) + family home (≤₱1M) + medical (≤₱500K) + RA4917 |
| `preTrainComputation.netEstate` | Item 38 | Item 36 − Item 37 |
| `preTrainComputation.survivingSpouseShare` | Item 39 | 50% of net conjugal/community |
| `preTrainComputation.netTaxableEstate` | Item 40 | Item 38 − Item 39 |
| `preTrainComputation.estateTaxDue` | Item 42 | From graduated schedule above |
| `preTrainComputation.foreignTaxCredit` | Item 43 | Same credit rule as TRAIN |
| `preTrainComputation.netEstateTaxDue` | Item 44 | max(0, estateTaxDue − foreignTaxCredit) |

---

## Deduction Differences from TRAIN

This aspect covers the **rate computation only**. The deduction differences that feed `net_taxable_estate` are documented separately in `analysis/deductions-pre-train-diffs.md` (to be analyzed). Key differences that affect the tax base:

| Deduction | Pre-TRAIN | TRAIN |
|---|---|---|
| Standard deduction | **₱1,000,000** | ₱5,000,000 |
| Family home cap | **₱1,000,000** | ₱10,000,000 |
| Funeral expenses | **Deductible** (lower of actual or 5% of gross estate) | Not deductible |
| Judicial/admin expenses | **Deductible** (all qualifying expenses) | Not deductible |
| Medical expenses | ₱500,000 cap (same) | ₱500,000 cap |

These differences typically result in **higher net taxable estates** under pre-TRAIN compared to TRAIN for identical facts, partially offset by the graduated rate schedule's lower effective rates on smaller estates.

---

## Edge Cases

### 1. Net Estate Exactly at Exemption Threshold (₱200,000)
```
net_taxable_estate = 200_000
estate_tax_due = 0  // exempt; not subject to 5%
```
The threshold is inclusive: ≤ ₱200,000 → zero tax.

### 2. Net Estate One Peso Above Threshold
```
net_taxable_estate = 200_001
estate_tax_due = (200_001 - 200_000) * 0.05 = 0.05
```
Tax applies on the excess over ₱200,000, not on the full amount. The exemption threshold is a zero-bracket amount, not a cliff.

### 3. Net Estate Exactly at Each Bracket Boundary
```
net_taxable_estate = 500_000   → estate_tax_due = 15_000   (= (500K-200K) × 0.05)
net_taxable_estate = 2_000_000 → estate_tax_due = 135_000  (= 15K + (2M-500K) × 0.08)
net_taxable_estate = 5_000_000 → estate_tax_due = 465_000  (= 135K + (5M-2M) × 0.11)
net_taxable_estate = 10_000_000 → estate_tax_due = 1_215_000 (= 465K + (10M-5M) × 0.15)
```
All four boundary values must produce the exact fixed amounts shown. Test each boundary explicitly.

### 4. Net Estate = ₱0 (Deductions ≥ Gross Estate)
```
net_taxable_estate = 0
estate_tax_due = 0
```
This can happen even under pre-TRAIN (e.g., small estate with all deductions applied). No minimum tax under pre-TRAIN regular rules (unlike amnesty, which has a ₱5,000 minimum).

### 5. Very Large Estate (Over ₱10M)
```
net_taxable_estate = 50_000_000
estate_tax_due = 1_215_000 + (50_000_000 - 10_000_000) * 0.20
               = 1_215_000 + 8_000_000
               = 9_215_000
```
The 20% top rate applies only to the excess over ₱10,000,000, not to the entire estate.

### 6. Foreign Tax Credit (Citizens/Residents Only)
Same rule as TRAIN: credit is capped at PH estate tax due per country and overall. NRAs cannot claim foreign tax credits.
```
net_estate_tax_due = max(0, estate_tax_due - foreign_tax_credit)
```

### 7. Non-Resident Alien (NRA) — Same Rate Schedule
Pre-TRAIN NRAs are subject to the same graduated rate schedule as citizens. The NRA difference lies in:
- PH-situs gross estate only
- Proportional deductions (Sec. 86(B))
- Standard deduction: ₱500,000 (same as TRAIN)
- No foreign tax credit

### 8. Fractional Peso Results
The graduated computation can produce non-integer results. No rounding rule is specified in the NIRC. Engine should carry full decimal precision; rounding to centavos is acceptable for output display.
```
// Example: net_taxable_estate = ₱350,500
estate_tax_due = (350_500 - 200_000) * 0.05 = 150_500 * 0.05 = 7_525.00
```

### 9. Pre-TRAIN Regime Boundary
The graduated schedule applies if and only if:
```
decedent.dateOfDeath < 2018-01-01
```
If `dateOfDeath >= 2018-01-01`, the engine must use TRAIN flat 6%. If `dateOfDeath < 2018-01-01` AND estate is unpaid AND decedent chose amnesty, the amnesty path applies (see `analysis/amnesty-computation.md`).

### 10. Effective Rate Comparison
For planning/explainer purposes, the effective rate varies by bracket:
```
net_taxable_estate = 1,000,000  → tax = 55,000  → effective rate = 5.5%
net_taxable_estate = 3,000,000  → tax = 245,000 → effective rate = 8.2%
net_taxable_estate = 7,000,000  → tax = 615,000 → effective rate = 8.8%
net_taxable_estate = 15,000,000 → tax = 2,215,000 → effective rate = 14.8%
```
The "rate" in the explainer section should state the applicable marginal rate and effective rate separately.

---

## Test Implications

| Test ID | Scenario | net_taxable_estate | Expected estate_tax_due |
|---|---|---|---|
| PT-01 | Below exemption threshold | ₱150,000 | ₱0 |
| PT-02 | Exactly at exemption threshold | ₱200,000 | ₱0 |
| PT-03 | Just above threshold (5% bracket) | ₱350,000 | ₱7,500 = (₱350K−₱200K)×0.05 |
| PT-04 | 5% bracket boundary | ₱500,000 | ₱15,000 |
| PT-05 | 8% bracket | ₱1,450,000 | ₱91,000 (Sample 5 from commentary) |
| PT-06 | 8% bracket boundary | ₱2,000,000 | ₱135,000 |
| PT-07 | 11% bracket | ₱3,000,000 | ₱245,000 = ₱135K + (₱1M×0.11) |
| PT-08 | 11% bracket boundary | ₱5,000,000 | ₱465,000 |
| PT-09 | 15% bracket | ₱7,500,000 | ₱840,000 = ₱465K + (₱2.5M×0.15) |
| PT-10 | 15% bracket boundary | ₱10,000,000 | ₱1,215,000 |
| PT-11 | 20% bracket (large estate) | ₱20,000,000 | ₱3,215,000 = ₱1.215M + (₱10M×0.20) |
| PT-12 | Zero net taxable estate | ₱0 | ₱0 |
| PT-13 | Commentary Sample 5 (CPG, 2015) | ₱1,450,000 | ₱91,000 |

**Commentary Sample 5 Verification** (from `commentary-samples.md` Sample 5):
```
Facts: death March 2015, CPG, all conjugal ₱8M, liabilities ₱400K
Funeral expenses: actual ₱350K < 5% of ₱8M = ₱400K → deductible ₱350K
Family home FMV ₱1.5M → cap ₱1M → deductible ₱1M
Standard deduction: ₱1M

Computation:
  Gross estate (conjugal):         ₱8,000,000
  Ordinary deductions:
    Claims against estate (debts):  -₱400,000
    Funeral expenses:               -₱350,000
  Estate after ordinary:           ₱7,250,000
  Special deductions:
    Standard (pre-TRAIN):         -₱1,000,000
    Family home (pre-TRAIN cap):  -₱1,000,000
  Net estate:                      ₱5,250,000
  Surviving spouse share (CPG):
    Conjugal assets:               ₱8,000,000
    Conjugal liabilities:           -₱400,000
    Net conjugal:                  ₱7,600,000
    50%:                           -₱3,800,000
  Net taxable estate:              ₱1,450,000

Tax = ₱15,000 + 8% × (₱1,450,000 − ₱500,000)
    = ₱15,000 + 8% × ₱950,000
    = ₱15,000 + ₱76,000
    = ₱91,000 ✓
```

---

## Relationship to Other Aspects

- **deductions-pre-train-diffs**: Documents the deductions that produce `net_taxable_estate` under pre-TRAIN rules. The rate schedule here is applied to that output.
- **pre-train-computation-flow**: Integrates the pre-TRAIN deduction pipeline with this rate schedule into a complete end-to-end flow.
- **amnesty-computation**: When a pre-2018 estate avails of RA 11213/11569 amnesty, the amnesty rate (flat 6%) is used instead of this graduated schedule — but with a different, more restricted deduction set.
- **tax-rate-train**: Parallel analysis for the TRAIN era. The rate is the same 6% as the amnesty rate but applied to a different (TRAIN deductions) net taxable estate.
- **regime-detection**: Determines whether this graduated schedule or the TRAIN flat rate applies.

---

## Summary

The pre-TRAIN estate tax rate is a 6-bracket graduated schedule ranging from 0% (on net taxable estate ≤ ₱200,000) to 20% (on the excess over ₱10,000,000). The computation requires:
1. Computing the net taxable estate using **pre-TRAIN deduction rules** (lower standard deduction of ₱1M, lower family home cap of ₱1M, funeral expenses and judicial/admin expenses deductible).
2. Applying the graduated schedule to the resulting net taxable estate.
3. Subtracting any foreign tax credit (citizens/residents only).

The rate schedule is mechanically simple — a lookup table with four hardcoded bracket amounts and four marginal rates. All complexity is in the deduction pipeline that produces `net_taxable_estate`. The schedule applies identically to citizens, resident aliens, and non-resident aliens (though their gross estate scope and deduction calculations differ).
