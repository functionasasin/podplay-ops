# Analysis: tax-rate-train

**Aspect**: tax-rate-train
**Wave**: 2 — TRAIN-Era Rule Extraction
**Date Analyzed**: 2026-02-23
**Legal Source**: `input/legal-sources/nirc-title-iii.md`

---

## Legal Basis

**NIRC Section 84** (as amended by Section 22, RA 10963 — TRAIN Law, effective January 1, 2018):

> "There shall be levied, assessed, collected and paid upon the transfer of the net estate as determined in accordance with Sections 85 and 86 of every decedent, whether resident or nonresident of the Philippines, a tax at the rate of **six percent (6%)** based on the value of such net estate."

---

## Rule (Pseudocode)

```
// Input: result of the full deduction pipeline (Sections 85 + 86)
// net_taxable_estate = Item 40 on Form 1801

// Step 1: Apply flat rate
estate_tax_due = net_taxable_estate * 0.06        // Item 42

// Step 2: Subtract foreign tax credit (if any)
net_estate_tax_due = max(0, estate_tax_due - foreign_tax_credit)  // Item 44 = Item 20

// Floor rule: tax cannot be negative
if net_estate_tax_due < 0:
    net_estate_tax_due = 0
```

Where `net_taxable_estate` is computed as:

```
gross_estate_total            // Item 34 = sum of Items 29-33
  - ordinary_deductions_total // Item 35 (Schedule 5: ELIT, vanishing, public transfers)
= estate_after_ordinary       // Item 36

  - special_deductions_total  // Item 37 (standard deduction + family home + medical + RA4917)
= net_estate                  // Item 38

  - surviving_spouse_share    // Item 39 (Schedule 6A)
= net_taxable_estate          // Item 40  ← the tax base
```

The tax rate of 0.06 (6%) is applied **solely** to Item 40 (net taxable estate). It is **not** applied to gross estate or any intermediate figure.

---

## Conditions

| Condition | Value |
|---|---|
| Regime applicability | Decedent's date of death is **on or after January 1, 2018** |
| Tax rate | **Flat 6%** (0.06); no graduated schedule |
| Who is subject | Every decedent — citizen, resident alien, non-resident alien |
| Tax base | Net taxable estate (after all allowable deductions) |
| Minimum tax | ₱0 (net taxable estate cannot be negative; tax cannot be negative) |
| Tax threshold | None — 6% applies from ₱1 of net taxable estate upward |

**Important**: There is no exemption threshold or zero-bracket amount. If the net taxable estate is ₱1, the tax is ₱0.06. The ₱5,000,000 standard deduction effectively exempts estates with gross estate ≤ ₱5M (plus any ordinary deductions) from having any tax liability — but this comes from the deduction, not a tax threshold in Sec. 84 itself.

---

## Form 1801 Mapping

| Item | Label | Formula | Engine Field |
|------|-------|---------|-------------|
| Item 40 | Net Taxable Estate | Item 38 − Item 39 | `computation.netTaxableEstate` |
| Item 41 | Tax Rate | Always 6% (hardcoded) | — (display only) |
| Item 42 | Estate Tax Due | Item 40 × 0.06 | `computation.estateTaxDue` |
| Item 43 | Less: Tax Credits | Foreign estate taxes paid | `deductions.foreignTaxCredit` |
| Item 44 | Net Estate Tax Due | Item 42 − Item 43 (min 0) | `output.netEstateTaxDue` |
| Item 20 | Tax Due (Part III) | = Item 44 (initial filing) | `output.netEstateTaxDue` |

The rate (Item 41) is hardcoded to 6% for all TRAIN-era computations. The engine need not accept this as input — it is always 6%.

---

## Edge Cases

### 1. Zero Net Taxable Estate
If `net_taxable_estate ≤ 0`:
- Floor `net_taxable_estate` at 0 before applying rate
- `estate_tax_due = 0`
- `net_estate_tax_due = 0`
- This occurs when total deductions (ordinary + special + spouse share) equal or exceed gross estate

### 2. Foreign Tax Credit Exceeds Estate Tax Due
```
If foreign_tax_credit >= estate_tax_due:
    net_estate_tax_due = 0
```
The credit cannot produce a negative tax or a refund. The floor is ₱0.

### 3. Non-Resident Alien (NRA)
The flat 6% rate applies equally to NRA decedents. The difference lies in:
- Gross estate composition (Philippine-situs property only; Sec. 85)
- Lower standard deduction (₱500K vs. ₱5M; Sec. 86(B)(1))
- Proportional deductions for ELIT (Sec. 86(B)(2))
- No family home deduction available (NRA are not eligible)

The rate computation in Sec. 84 itself is identical for NRAs — always 0.06.

### 4. TRAIN Regime Boundary Date
The flat 6% rate applies if and only if:
```
decedent.dateOfDeath >= 2018-01-01
```
If `dateOfDeath < 2018-01-01`, use the pre-TRAIN graduated schedule (see `analysis/tax-rate-pre-train.md` when analyzed).

### 5. Installment Payment
Section 91(C) permits payment by installment within 2 years without penalty. This does not change the computed `net_estate_tax_due` — the total tax is the same; only the payment schedule differs. Item 44 always shows the **total** tax due, not one installment amount.

### 6. Previously Filed Return (Amended Return)
If `filing.isAmended = true`, the engine still computes Item 44 as the correct total tax. Item 21 (prior installment payments) is out of scope; the difference is handled outside the engine.

### 7. No Tax Due Despite Non-Zero Gross Estate
This is the most common scenario for small estates:
```
// Example:
gross_estate = 6,000,000
standard_deduction = 5,000,000
other_deductions = 0
net_taxable_estate = 6,000,000 - 5,000,000 = 1,000,000
estate_tax_due = 1,000,000 × 0.06 = 60,000
```
Note: "No tax due" only occurs when net_taxable_estate = 0, not merely because the estate is "small." The ₱5M standard deduction is a deduction, not an exemption threshold.

---

## Test Implications

The following test cases are required to validate the rate computation:

| Test ID | Scenario | net_taxable_estate | Expected estate_tax_due | Expected net_estate_tax_due |
|---------|----------|-------------------|------------------------|---------------------------|
| TR-01 | Round number above zero | ₱10,000,000 | ₱600,000 | ₱600,000 |
| TR-02 | Net taxable estate = 0 | ₱0 | ₱0 | ₱0 |
| TR-03 | Net taxable estate < 0 (floored) | (input −₱500K, floor to 0) | ₱0 | ₱0 |
| TR-04 | Foreign tax credit = 0 | ₱5,000,000 | ₱300,000 | ₱300,000 |
| TR-05 | Foreign tax credit < estate tax due | ₱5,000,000 | ₱300,000 | ₱250,000 (credit ₱50K) |
| TR-06 | Foreign tax credit = estate tax due | ₱5,000,000 | ₱300,000 | ₱0 (credit ₱300K) |
| TR-07 | Foreign tax credit > estate tax due | ₱5,000,000 | ₱300,000 | ₱0 (credit ₱400K, floored) |
| TR-08 | Non-resident alien (NRA), small estate | ₱800,000 | ₱48,000 | ₱48,000 |
| TR-09 | Fractional peso result | ₱1,000,001 | ₱60,000.06 | ₱60,000.06 |
| TR-10 | Very large estate | ₱500,000,000 | ₱30,000,000 | ₱30,000,000 |

---

## Relationship to Other Aspects

This aspect defines the final tax computation step (Items 40–44). It depends on the complete deduction pipeline:
- `gross-estate-citizens` or `gross-estate-nonresident` → produces Item 34
- `deduction-elit`, `deduction-vanishing`, `deduction-public-transfers` → produce Item 35
- `deduction-standard`, `deduction-family-home`, `deduction-medical`, `deduction-ra4917` → produce Item 37
- `surviving-spouse-share` → produces Item 39
- `tax-credits` → produces Item 43 (foreign tax credit)

The rate rule itself (Sec. 84) is a single multiplication. All complexity lives in the upstream deduction pipeline.

---

## Summary

The TRAIN-era estate tax rate rule is the simplest provision in the estate tax law: a flat 6% applied to net taxable estate (Item 40), with a foreign tax credit subtracted to arrive at net estate tax due (Item 44). The rate is always 0.06, it is always applied to a value that cannot be negative, and the resulting tax cannot be negative. There are no brackets, no exemption thresholds, and no rate graduation.
