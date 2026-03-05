# Deduction: Medical Expenses
## NIRC Sec. 86(A)(6) — Special Deduction (Citizens and Residents)

**Aspect**: deduction-medical
**Wave**: 2 (TRAIN-era rule extraction)
**Analyzed**: 2026-02-23
**Source**: `input/legal-sources/nirc-title-iii.md`, Sec. 86(A)(6); `input/legal-sources/pre-train-rates.md`

---

## Legal Basis

**NIRC Section 86(A)(6)** (TRAIN-era, as amended by RA 10963):

> "Medical expenses incurred within one (1) year before death, deductible up to Five hundred thousand pesos (₱500,000)."
>
> "Requirements:
> - Must be duly substantiated with official receipts
> - Must have been incurred within the 1-year period immediately preceding death"

**Subsection numbering note**: The cached NIRC text (post-TRAIN) shows this as subsection **(6)** of Sec. 86(A). The frontier aspect list references it as Sec. 86(A)(7) — this reflects the pre-TRAIN numbering scheme where the provision appeared at a different position before TRAIN removed funeral and judicial/admin expenses as separately numbered items. The substantive rule is the same; cite as Sec. 86(A) medical expenses provision.

**Classification**: This is a **Special Deduction** (Schedule 6, Line 6C), not an ordinary deduction. It is applied at the net estate level, after ordinary deductions. No exclusive/conjugal column split is required.

**Form 1801 mapping**: Schedule 6, Line 6C → Part IV Item 37C

---

## Rule (Pseudocode)

```
// Input
input.medicalExpenses: array of {
  description:      string      // e.g., "Hospital bill — St. Luke's Medical Center"
  amount:           number      // Peso amount (from official receipt)
  dateIncurred:     date        // Date of service/expense
  receiptNumber:    string      // Official receipt number (for documentation)
  officialReceipt:  boolean     // Was an official receipt obtained?
}

// Eligibility window
ONE_YEAR_WINDOW_START = decedent.dateOfDeath - 365 days  // 1 year before death
// Edge note: "1 year before death" means the expense date must be on or after
// (dateOfDeath minus 1 year). An expense on exactly the same date 1 year prior
// is within the window (≥ start). Expenses before that date do not qualify.

// Computation
function computeMedicalExpensesDeduction(expenses, dateOfDeath):
  total = 0
  for each expense in expenses:
    if expense.dateIncurred < (dateOfDeath - 365 days):
      skip  // outside 1-year window; not deductible
    if not expense.officialReceipt:
      skip  // not substantiated; not deductible
    total += expense.amount

  deductible = min(total, 500_000)
  return deductible

// Output
deductions.medicalExpenses = computeMedicalExpensesDeduction(
  input.medicalExpenses,
  decedent.dateOfDeath
)

// No A/B split: medical expenses feed Item 37C as a single value
// Applied at Form 1801 Part IV Item 37C (included in Item 37 total special deductions)
```

---

## Conditions

All conditions must be satisfied for an expense to count toward the ₱500,000 limit:

| Condition | Detail |
|-----------|--------|
| **1-Year Window** | The medical expense must have been incurred on or after `dateOfDeath − 365 days` and on or before `dateOfDeath`. |
| **Official Receipt** | Each expense must be substantiated by an official receipt (BIR-registered). Cash receipts, informal billing statements, or oral claims do not qualify. |
| **Cap** | The deductible amount is `min(total qualifying expenses, ₱500,000)`. There is no minimum. If actual expenses are ₱0, the deduction is ₱0. |
| **Citizen/Resident only** | Medical expenses deduction is available only for citizens and residents. Non-resident aliens (NRAs) receive a ₱500,000 standard deduction and a proportional ELIT deduction, but NOT the medical expenses special deduction. |
| **Nature of expense** | Must be medical in nature: hospital bills, doctor's fees, surgery costs, medicines, laboratory and diagnostic fees, physical therapy, ambulance, dental procedures, etc. Non-medical personal expenses do not qualify even if incurred during a medical emergency. |

---

## Form 1801 Mapping

| Form 1801 Location | Field | Engine Value | Formula |
|-------------------|-------|-------------|---------|
| Part V, Schedule 6, Line 6C | Medical Expenses | `deductions.medicalExpenses` | `min(sum of qualifying expenses, 500_000)` |
| Part IV, Item 37C | Medical Expenses | Same value | Carries from Schedule 6C |
| Part IV, Item 37 | Total Special Deductions | Included in total | `37A + 37B + 37C + 37D` |

**Column structure**: Item 37C has a **single column** (no A/B exclusive/conjugal split). The medical expense deduction is applied as a unified deduction against the estate's net estate (Item 38), regardless of whether expenses were paid from exclusive or conjugal funds.

**Validation rule** (from form-1801-fields.md, Validation Rule 9): `deductions.medicalExpenses <= 500_000` — the engine must enforce this ceiling.

---

## Pre-TRAIN Regime

Medical expenses under the **pre-TRAIN regime** (deaths before January 1, 2018) are governed by the **same provision** with the **same cap and conditions**:

- **Cap**: ₱500,000 (same as TRAIN)
- **Window**: Within 1 year before death (same as TRAIN)
- **Documentation**: Official receipts required (same as TRAIN)

The pre-TRAIN rate table source (`pre-train-rates.md`) confirms: "Medical Expenses | ≤₱500,000 (1-year window) | ≤₱500,000 (1-year window)" — both regimes identical.

**Engine rule**: `deductions.medicalExpenses` computation is **identical** for TRAIN and pre-TRAIN regimes. No branching logic is required for this specific deduction.

---

## Estate Tax Amnesty Path

For estates availing of the **Estate Tax Amnesty** (RA 11213/11569/11956):

The amnesty law provides that deductions are those "applicable at the time of death" of the decedent. Since the medical expense deduction existed both pre-TRAIN and post-TRAIN with the same parameters (₱500K cap, 1-year window), medical expenses are **deductible under the amnesty path** for estates of decedents who died before May 31, 2022.

**Narrow interpretation risk**: Some BIR guidance interprets amnesty deductions as limited to only the standard deduction and surviving spouse share. If the engine implements the narrow interpretation, medical expenses would be excluded from the amnesty computation.

**Engine recommendation**: Implement full deductions (including medical expenses) for the amnesty computation, but flag the narrow-interpretation risk with a note: "Some BIR interpretations limit amnesty deductions to standard deduction and surviving spouse share. Verify with a tax professional."

---

## Interaction With ELIT Deductions (Claims Against Estate — Schedule 5A)

**Critical edge case**: Medical expenses within the 1-year window that were **unpaid at the time of death** can appear in **two places** simultaneously:

1. **Schedule 5A (Claims Against Estate)**: The unpaid hospital/doctor bill is a documented personal obligation at death → qualifies as a claim against the estate.
2. **Schedule 6C (Medical Expenses)**: The same bill is a medical expense incurred within 1 year → qualifies toward the ₱500K medical deduction.

**Result**: The same unpaid medical bill can technically generate two deductions — once as an outstanding debt (no cap, subject to documentation) and once as a medical expense (capped at ₱500K total).

**Legal position**: The statute is silent on this interaction. Both provisions are independent; no cross-reference or exclusion is stated. Philippine tax practice generally permits both deductions to be claimed.

**Engine rule**: The engine does **not** prevent this overlap. It computes 5A and 6C independently. The engine should display an informational note when the user enters both medical bills in 5A and the same (or overlapping) amounts in 6C: "Some medical expenses may appear as both Claims Against Estate (ordinary deduction) and Medical Expenses (special deduction). This is permissible under current law, but may attract BIR scrutiny. Confirm with a tax professional."

---

## Edge Cases

1. **Zero medical expenses**: If the decedent incurred no medical expenses within 1 year before death (e.g., sudden accident, or expenses were all more than 1 year prior), `deductions.medicalExpenses = 0`. This is valid — no minimum, and the deduction line simply reads ₱0.

2. **Expenses at exactly the 1-year boundary**: An expense on the date exactly 1 year before death (e.g., death on June 15, 2022; expense on June 15, 2021) is **within the window** — the computation is `dateIncurred >= dateOfDeath − 365 days`. Expenses on June 14, 2021 would be outside the window.

3. **Expenses exceed ₱500,000**: If total qualifying medical expenses are ₱1,200,000, the deduction is **capped at ₱500,000**. Engine does not carry the excess anywhere. The remaining ₱700,000 provides no tax benefit (unless it is also captured as a claim against estate for the unpaid portion under 5A, within that deduction's own framework).

4. **Expenses slightly below ₱500,000**: Full amount is deductible with no reduction. E.g., ₱487,500 in qualifying expenses → deduction = ₱487,500.

5. **Expenses paid by conjugal/community funds**: Regardless of which fund source paid the medical expenses, the deduction is applied at the special deduction level (no A/B split). The originating fund does not affect the deduction amount.

6. **Non-official receipts (acknowledgment receipts, cash vouchers)**: Do NOT qualify. Only BIR-registered official receipts substantiate the expense. If all ₱600,000 in medical expenses are supported only by non-official receipts, the deduction is ₱0.

7. **Terminal illness with extended treatment**: A decedent with a 2-year illness would have expenses over two years. Only expenses in the **final 1-year window** are deductible. Expenses before the window — even if medically related and paid — do not count toward the ₱500K limit.

8. **Medical expenses for the funeral**: Costs incurred after death (embalming, cremation, burial) are **not** medical expenses — they occurred after death and are not within the 1-year pre-death window. Under TRAIN, these are also not deductible as funeral expenses. Under pre-TRAIN, they would be deductible as funeral expenses (separately). Engine must NOT count post-death expenses as medical expenses.

9. **Non-resident alien (NRA) decedent**: NRAs do not have access to the medical expenses special deduction. The special deductions available to NRAs are limited to the ₱500,000 standard deduction and the proportional ELIT deduction. Engine must zero out `deductions.medicalExpenses` when `decedent.isNonResidentAlien = true`.

10. **Expenses documented only in foreign currency**: Medical expenses incurred abroad (e.g., treatment in Singapore) in foreign currency. The official receipt is in SGD. Engine should convert to PHP at the Bangko Sentral ng Pilipinas (BSP) rate on the date of expense. **Engine limitation**: The engine does not look up BSP rates. User must provide the PHP-converted amount. Engine accepts the PHP figure as provided.

11. **Duplicate receipt entries**: If a user accidentally enters the same official receipt number twice, the engine should detect duplicate receipt numbers and flag for review (do not double-count).

12. **Medical expenses and NRA**: NRA special deductions available: standard deduction (₱500K) and proportional ELIT. Medical expenses deduction = 0 for NRA. Engine validation must enforce `if decedent.isNonResidentAlien: deductions.medicalExpenses = 0`.

---

## Test Implications

1. **Simple case — full ₱500K**: Decedent with ₱500,000 in receipted medical expenses within 1 year. `deductions.medicalExpenses = ₱500,000`. Item 37C = ₱500,000.

2. **Partial — below cap**: Decedent with ₱320,000 in receipted medical expenses. `deductions.medicalExpenses = ₱320,000`. Item 37C = ₱320,000.

3. **Over cap — capped at ₱500K**: Decedent with ₱950,000 in receipted expenses within 1 year. `deductions.medicalExpenses = ₱500,000` (capped). Item 37C = ₱500,000.

4. **Outside window**: ₱600,000 in medical expenses, but all were incurred 13–18 months before death. `deductions.medicalExpenses = 0`.

5. **Mixed window**: ₱400,000 within 1-year window + ₱300,000 outside window. Only ₱400,000 qualifies. `deductions.medicalExpenses = ₱400,000`.

6. **No official receipts**: ₱750,000 in medical bills supported only by acknowledgment receipts. `deductions.medicalExpenses = 0`. Engine should warn user.

7. **Zero medical expenses**: No medical expenses at all. `deductions.medicalExpenses = 0`. Valid; Item 37C = 0.

8. **NRA decedent**: NRA with ₱300,000 qualifying medical expenses. `deductions.medicalExpenses = 0` (NRAs excluded from this deduction).

9. **Overlap with 5A**: ₱200,000 unpaid hospital bill entered as both a claim against estate (Schedule 5A) and as a medical expense (Schedule 6C). Engine computes both independently: 5A gets ₱200,000 (ordinary deduction); 6C gets ₱200,000 (special deduction). Engine displays overlap warning.

10. **Pre-TRAIN regime**: Death in 2015. Qualifying medical expenses: ₱480,000 with official receipts. `deductions.medicalExpenses = ₱480,000` (same computation as TRAIN regime; same ₱500K cap applies).

11. **Sample 1 validation (commentary-samples.md)**: Gross estate ₱20M; medical expenses ₱500,000 (receipted, within 1 year). `deductions.medicalExpenses = ₱500,000`. Together with standard deduction ₱5M and family home deduction ₱10M, total special deductions = ₱15,500,000. Net estate = ₱4,500,000. Estate tax = ₱270,000. Engine must reproduce this result.

12. **Sample 3 validation (commentary-samples.md)**: Medical expenses ₱400,000. `deductions.medicalExpenses = ₱400,000`. Item 37C = ₱400,000. Engine must match the sample computation.

---

## Summary: Medical Expenses vs. Other Special Deductions

| Deduction | Cap | Documentation | A/B Split | NRA | Regime |
|-----------|-----|---------------|-----------|-----|--------|
| Standard Deduction (37A) | ₱5M (₱500K NRA) | None | No | Yes (lower cap) | Both (different amounts) |
| Family Home (37B) | ₱10M (₱1M pre-TRAIN) | Barangay cert | No | No | Both (different cap) |
| **Medical Expenses (37C)** | **₱500,000** | **Official receipts** | **No** | **No** | **Both (same cap)** |
| RA 4917 Benefits (37D) | None (full amount) | Employer docs | No | Unclear | Both |
