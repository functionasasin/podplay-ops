# Analysis: tax-credits

**Aspect**: tax-credits
**Wave**: 2 — TRAIN-Era Rule Extraction
**Date Analyzed**: 2026-02-24
**Legal Source**: `input/legal-sources/nirc-title-iii.md` (Sec. 86D); `input/legal-sources/form-1801-fields.md`

---

## Legal Basis

**NIRC Section 86, Subsection D** (unchanged by TRAIN — same provision applies to TRAIN and pre-TRAIN regimes):

> "Estate taxes paid to a foreign country on property of a citizen or resident of the Philippines located in that foreign country are allowed as a credit against the Philippine estate tax.
>
> **Limitations**:
> - Maximum credit = (Philippine estate tax) × (Foreign country estate / Total gross estate)
> - Cannot exceed total Philippine estate tax
> - Must actually be paid and documented"

**Scope of this aspect**: Two components reduce the final tax payable on Form 1801:

1. **Foreign estate tax credit** (Sec. 86D) — a legal computation item; engine computes it.
2. **Prior installment payments** (Form 1801 Item 21) — a filing/payment tracking item; **OUT OF SCOPE** for the engine (the engine produces the total tax due, not the remaining balance after installments paid).

---

## Component 1: Foreign Estate Tax Credit

### Overview

When a Philippine citizen or resident decedent owns property situated in a foreign country, that foreign country may impose its own estate tax on that property. The Philippines allows a credit against Philippine estate tax for the foreign estate tax actually paid — preventing full double taxation on the same property.

### Who May Claim

| Taxpayer Category | Eligible? | Reason |
|---|---|---|
| Philippine citizen | Yes | Taxed worldwide; may have foreign property taxed abroad |
| Resident alien | Yes | Same worldwide scope under Sec. 85(A) |
| Non-resident alien (NRA) | **No** | NRA gross estate = PH-situs property only; no foreign estate tax would be paid on PH property |

### Rule (Pseudocode)

```
// Engine input: an array of foreign tax credit claims, one per foreign country
// foreignTaxCredits = [ { country: "USA", foreignTaxPaid: 150_000, foreignPropertyValue: 3_000_000 }, ...]

function computeForeignTaxCredit(foreignTaxCredits, phEstateTaxDue, grossEstateTotal):
    // phEstateTaxDue  = Item 42 (estate_tax_due = net_taxable_estate × 0.06)
    // grossEstateTotal = Item 34 Column C (total gross estate including foreign property)

    if decedent.isNonResidentAlien:
        return 0  // NRA cannot claim; foreign tax credit is citizens/residents only

    total_credit = 0

    for each credit_claim in foreignTaxCredits:
        // Per-country limitation
        per_country_ratio = credit_claim.foreignPropertyValue / grossEstateTotal
        per_country_limit = phEstateTaxDue * per_country_ratio

        // Credit = lesser of actual paid vs. per-country limit
        per_country_credit = min(credit_claim.foreignTaxPaid, per_country_limit)

        total_credit += per_country_credit

    // Overall limitation: total credit cannot exceed total PH estate tax
    total_credit = min(total_credit, phEstateTaxDue)

    return total_credit  // → Item 43

// Final tax due after credit
net_estate_tax_due = max(0, phEstateTaxDue - total_credit)  // → Item 44 = Item 20
```

### Formula Explanation

**Per-country limitation formula** (from Sec. 86D):

```
Per-country credit limit = Philippine estate tax × (Value of property in that foreign country / Total gross estate)
```

This ratio-based limit ensures the credit for any single country cannot exceed the Philippine tax that is attributable to property in that country. If multiple countries impose estate tax, each is computed separately and then summed.

**Overall limitation**: Even after per-country calculations, the total credit cannot produce a negative net estate tax due. The floor is ₱0.

### Denominator Clarification

The cached NIRC text uses "Total gross estate" as the denominator in the per-country ratio. This refers to the **total gross estate before any deductions** (Item 34, Column C). This is consistent with the formula structure: the ratio identifies what fraction of the gross estate is situated in the foreign country, and the credit is that fraction of the Philippine tax.

*Note*: Some tax practitioners use "net taxable estate" as the denominator instead. The engine implements "total gross estate" per the plain text of Sec. 86D. If professional tax advice indicates otherwise, the denominator field is a single parameter in the formula.

### Documentation Requirements

To claim the credit, the following must be provided as engine inputs (documentation collected by the filer, not verified by the engine):

| Input Field | Description |
|---|---|
| `foreignTaxCredit[n].country` | Name of the foreign country |
| `foreignTaxCredit[n].foreignTaxPaid` | Amount of foreign estate tax actually paid (in PHP equivalent) |
| `foreignTaxCredit[n].foreignPropertyValue` | FMV of property situated in that foreign country (in PHP) |
| `foreignTaxCredit[n].documentationVerified` | Boolean — has proof of payment been obtained? (Informational; engine does not enforce) |

---

## Component 2: Prior Installment Payments (OUT OF SCOPE)

### What It Is

Form 1801, Part III contains:

| Item | Label | Engine Status |
|------|-------|--------------|
| Item 20 | Tax Due | **IN SCOPE** — equals Item 44 (engine's primary output) |
| Item 21 | Total Tax Paid in Previous Installments | **OUT OF SCOPE** — filer enters payments already made |
| Item 22 | Tax Still Due | **OUT OF SCOPE** — arithmetic: Item 20 − Item 21 |
| Item 23A–D | Surcharges, interest, compromise penalty | **OUT OF SCOPE** — penalties not computed by engine |
| Item 24 | Total Amount Payable | **OUT OF SCOPE** — Item 22 + Item 23D |

### Rationale for Out-of-Scope Classification

The engine computes **base tax due** (Item 44 = Item 20). Once computed, the amount of any prior installment payments and remaining balance are mechanical subtraction by the filer — not a legal computation rule. Surcharges and interest are explicitly out of scope per the engine design specification.

For an installment payment scenario, the engine still produces the correct Item 44 (total tax due). The filer then fills in Item 21 (what they've already paid) and Item 22 shows what remains.

---

## Regime Coverage

| Regime | Foreign Tax Credit Available? | Notes |
|--------|-------------------------------|-------|
| TRAIN (death ≥ Jan 1, 2018) | **Yes** | Sec. 86D unchanged by TRAIN |
| Pre-TRAIN (death before Jan 1, 2018) | **Yes** | Same Sec. 86D applies; same formula |
| Estate Tax Amnesty (RA 11213/11569) | **No** | Amnesty is a flat-rate settlement; no credits available. The amnesty tax is paid as a lump sum on net estate — no mechanism for crediting foreign taxes against it. |

---

## Form 1801 Mapping

| Form 1801 Field | Engine Output Field | Formula |
|---|---|---|
| Item 42 | `computation.estateTaxDue` | `net_taxable_estate × 0.06` (upstream; from tax-rate-train) |
| Item 43 | `deductions.foreignTaxCredit` | Result of `computeForeignTaxCredit()` above |
| Item 44 | `output.netEstateTaxDue` | `max(0, Item 42 − Item 43)` |
| Item 20 | `output.netEstateTaxDue` | Identical to Item 44 for initial filings |

The foreign tax credit is the only allowed credit against the computed estate tax. There is no other credit mechanism in the Philippine estate tax law (e.g., no refundable credits, no carry-forward).

---

## Edge Cases

### 1. No Foreign Property / No Foreign Tax Paid
```
foreignTaxCredits = []
→ total_credit = 0
→ net_estate_tax_due = phEstateTaxDue (no change)
```
The engine accepts an empty array for `foreignTaxCredits`. If the decedent has no foreign property, Item 43 = ₱0.

### 2. Foreign Tax Paid Exceeds Per-Country Limit
```
Example:
  phEstateTaxDue = 300_000
  grossEstateTotal = 10_000_000
  foreignPropertyValue = 3_000_000  (30% of gross estate)
  per_country_limit = 300_000 × 0.30 = 90_000
  foreignTaxPaid = 150_000  (higher than limit)
  per_country_credit = min(150_000, 90_000) = 90_000
```
The excess foreign tax paid (₱60,000 in this example) is not creditable and is not refunded. It is simply lost.

### 3. Foreign Tax Paid Less Than Per-Country Limit
```
  per_country_limit = 90_000
  foreignTaxPaid = 50_000  (lower than limit)
  per_country_credit = min(50_000, 90_000) = 50_000
```
The credit equals what was actually paid — the limit is not a floor.

### 4. Multiple Foreign Countries
```
// USA: foreignTaxPaid = 80_000, per_country_limit = 90_000 → credit = 80_000
// Singapore: foreignTaxPaid = 40_000, per_country_limit = 30_000 → credit = 30_000
// Combined = 110_000

// Overall check:
  total_credit = min(110_000, phEstateTaxDue)
  // If phEstateTaxDue = 300_000: total_credit = 110_000 (no overall cap triggered)
  // If phEstateTaxDue = 100_000: total_credit = min(110_000, 100_000) = 100_000
  // → net_estate_tax_due = 0
```

### 5. Total Credit Equals or Exceeds Philippine Estate Tax Due
```
total_credit >= phEstateTaxDue
→ net_estate_tax_due = 0   (floor; no negative tax, no refund)
```

### 6. Non-Resident Alien Attempting to Claim Credit
```
if decedent.isNonResidentAlien:
    foreignTaxCredit = 0  // override any user-supplied credits
    // Engine note: NRA gross estate = PH-situs only; no foreign estate taxes paid on PH property
```
NRAs are taxed only on Philippine-situated property. Foreign estate taxes on that same PH property are not paid by a foreign government (the Philippines is the situs country). Credit is inapplicable.

### 7. Foreign Property Value Exceeds Total Gross Estate (Data Error)
```
if foreignPropertyValue > grossEstateTotal:
    // This is a data error — foreign property must be part of gross estate
    // per_country_ratio would exceed 1.0, which is impossible
    // Engine should flag validation error: "Foreign property value cannot exceed total gross estate"
```

### 8. Currency Conversion
The engine operates in Philippine Pesos (₱). Foreign estate taxes paid in foreign currency must be converted to PHP at the prevailing exchange rate at the date of payment (or date of death — this is not specified in NIRC; engine should accept PHP-equivalent amount as user input and not perform conversion).

### 9. Pre-TRAIN Estates with Foreign Property
The foreign tax credit formula and limitations are identical for pre-TRAIN estates. The only difference is that `phEstateTaxDue` is computed via the graduated rate schedule instead of the flat 6%, but the credit formula is unchanged.

### 10. Installment Payment Scenario
```
// Engine still produces:
  output.netEstateTaxDue = Item 44 = total tax due

// What the filer adds (outside engine scope):
  Item 21 = installments already paid
  Item 22 = Item 44 − Item 21   ← filer arithmetic, not engine
```

---

## Test Implications

| Test ID | Scenario | Expected Behavior |
|---------|----------|------------------|
| TC-01 | No foreign assets | `foreignTaxCredit = 0`; Item 44 = Item 42 |
| TC-02 | Single country, foreign tax < per-country limit | Credit = actual foreign tax paid |
| TC-03 | Single country, foreign tax > per-country limit | Credit = per-country limit (excess lost) |
| TC-04 | Single country, foreign tax = per-country limit | Credit = limit = actual paid |
| TC-05 | Two countries, combined credit < PH estate tax | Sum of per-country credits; overall cap not triggered |
| TC-06 | Two countries, combined credit > PH estate tax | Credit capped at PH estate tax; net tax = ₱0 |
| TC-07 | NRA decedent with foreignTaxCredits input | Credit forced to ₱0; input ignored |
| TC-08 | Pre-TRAIN estate with foreign property | Same formula; graduated base tax as input |
| TC-09 | Amnesty computation | No foreign tax credit; Item 43 = ₱0 |
| TC-10 | foreignPropertyValue > grossEstateTotal | Engine flags validation error |
| TC-11 | Credit produces negative net tax | Floored to ₱0 |

---

## Summary

The foreign estate tax credit is the final adjustment applied to convert estate tax due (Item 42) into net estate tax due (Item 44). It follows a per-country formula (credit = lesser of foreign tax actually paid vs. PH tax × foreign property ratio) plus an overall ceiling (cannot exceed total PH estate tax). The credit is available to citizens and residents across both TRAIN and pre-TRAIN regimes, but not to non-resident aliens and not under the estate tax amnesty path. Prior installment payments (Item 21) are out of engine scope — the engine produces Item 44 (total tax due); the filer enters their payment history separately.
