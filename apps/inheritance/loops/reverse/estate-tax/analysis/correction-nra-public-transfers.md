# Correction: NRA Transfers for Public Use Are Proportional, Not Full-Value

**Aspect**: `correction-nra-public-transfers`
**Corrects**: `analysis/deduction-public-transfers.md`
**Source of correction**: `analysis/nonresident-deductions.md` Edge Case 8 (Sec. 86(B)(2) re-reading)
**Date**: 2026-02-24
**Wave**: 2 (Correction)

---

## Error Summary

`analysis/deduction-public-transfers.md` incorrectly stated that NRAs deduct **full value** of public transfers:

> *"Transfers for Public Use appears to be deducted at full value (not proportionally)"* — EC-10
> *"full value (not proportional)"* — Summary table, NRA Availability row
> *"Test #9: NRA with PH government bequest — Full value deducted (not proportional)"*

**This is wrong.** The correct rule under Sec. 86(B)(2) is that public transfers for NRAs are **proportional**, using the same factor applied to ELIT.

---

## Legal Basis for Correction

### NIRC Sec. 86(B)(2) — Exact Quoted Text

> "That **proportion** of the deductions specified in **paragraphs (1) and (3)** of Subsection (A) of this Section which the value of such part bears to the value of his entire gross estate wherever situated."

**Paragraph (1) of Sec. 86(A)** = ELIT (claims against estate, insolvent persons, unpaid mortgages, casualty losses)
**Paragraph (3) of Sec. 86(A)** = Transfers for public use

The proportional formula explicitly includes **both** ELIT and transfers for public use.

### Sec. 86(B)(3) and (4) — What They Cover

| Sub-section | Coverage | Proportional? |
|-------------|----------|---------------|
| Sec. 86(B)(2) | ELIT (par. 1) AND public transfers (par. 3) | **YES — proportional** |
| Sec. 86(B)(3) | Vanishing deduction (par. 2), PH-situs prior property only | **NO — full formula, situs-restricted** |
| Sec. 86(B)(4) | *Redundant language re: public transfers* | Covered by Sec. 86(B)(2) |

**Key insight**: Sec. 86(B)(4) ("Transfers for public use: same as Sec. 86(A)(3)") does not override the proportional rule in Sec. 86(B)(2). It merely confirms the same qualifying conditions apply (PH government recipient, exclusively public purpose). The proportional formula from Sec. 86(B)(2) still controls the amount.

---

## Corrected Rule (Pseudocode)

### Citizens/Residents (UNCHANGED)

```
// Citizens and residents: full value deductible
public_transfers_deduction = sum(transfer.fmvAtDeath for qualifying transfers)
```

### NRAs (CORRECTED)

```
// NRAs: proportional formula per Sec. 86(B)(2)

// Step 1: Compute proportional factor (same factor used for ELIT)
proportional_factor = PH_gross_estate / decedent.totalWorldwideGrossEstate
// PH_gross_estate = Item 34.C

// Step 2: Collect qualifying public transfers
// For NRAs, qualifying transfers must be:
//   (a) To PH national government or Philippine political subdivision
//   (b) For exclusively public purposes
//   (c) Property situated in the Philippines (already in NRA gross estate)
PH_public_transfers_total = sum(transfer.fmvAtDeath for qualifying NRA transfers)

// Step 3: Apply proportional factor
NRA_public_transfers_deduction = proportional_factor × PH_public_transfers_total

// Example:
// NRA with PH estate = ₱5M, worldwide estate = ₱20M
// Bequest to City of Manila = ₱1M
// proportional_factor = ₱5M / ₱20M = 0.25
// deduction = 0.25 × ₱1M = ₱250,000 (NOT ₱1,000,000)
```

### Why "Worldwide" Public Transfers = PH Public Transfers for NRAs

For NRAs, the Sec. 86(B)(2) formula applies the proportional factor to "deductions under paragraph (3) of Sec. 86(A)." Since NRA public transfers must be to the **Philippine** government (the only qualifying recipient), and NRA assets are already PH-situs only, the "worldwide" public transfer figure equals the PH government transfer figure. No additional worldwide input is needed.

The formula becomes:
```
NRA_public_transfers_deduction = (PH_gross_estate / worldwide_gross_estate) × PH_government_transfers
```

This is structurally identical to the ELIT proportional formula — the same factor, applied to a different deduction category.

---

## Practical Impact

| Scenario | Citizen/Resident | NRA (Corrected) |
|----------|-----------------|-----------------|
| Bequest to PH city: ₱1M | Deduction = **₱1,000,000** | Deduction = **₱250,000** |
| PH estate = 25% of worldwide | (irrelevant) | proportional_factor = 0.25 |
| Bequest = 100% of PH estate | Full deduction regardless | Still proportional (factor × bequest) |

**Effect**: NRAs receive a smaller public transfers deduction than citizens. For an NRA with PH assets representing 25% of worldwide estate, only 25% of the public bequest value is deductible. This is consistent with the overall NIRC policy that NRAs' PH deductions are proportional to their PH asset exposure.

---

## Form 1801 Mapping — Updated for NRAs

| | Citizen/Resident | NRA |
|--|-----------------|-----|
| Schedule 5F value | Full FMV of transfer | `proportional_factor × FMV` |
| Item 35 contribution | Full FMV | Reduced proportional amount |
| Supplemental worksheet | Not needed | Must show proportional factor and calculation |

The NRA proportional computation worksheet (already defined in `nonresident-deductions.md`) should include a row for proportional public transfers:

```
SUPPLEMENTAL: NRA Proportional Deductions Worksheet
...
Public Transfers to PH Government (actual FMV):    ₱___________
Proportional Public Transfers (Factor × FMV):      ₱___________
```

---

## Affected Sections in deduction-public-transfers.md

The following sections in the original analysis file must be treated as superseded:

### 1. Edge Case 10 (NRA Transferring PH Property to PH Government)

**Original (WRONG)**:
> "The NRA deductions use a proportional formula for most items, but transfers for public use appears to be deducted at **full value** (not proportionally), since Sec. 86(B)(4) says 'same as Sec. 86(A)(3)' without adding a proportional limitation."

**Corrected**:
NRA public transfers are proportional per Sec. 86(B)(2). Sec. 86(B)(4) confirms qualifying conditions but does not override the proportional formula. Deduction = proportional_factor × FMV of bequest to PH government.

### 2. Summary Table — NRA Availability Row

**Original (WRONG)**:
> "NRA Availability: Yes (Sec. 86(B)(4)); limited to PH-situated property; full value (not proportional)"

**Corrected**:
NRA Availability: Yes (Sec. 86(B)(2) + (4)); PH government transfers only; **proportional** (same factor as ELIT = PH gross estate / worldwide gross estate)

### 3. Test Implication #9

**Original (WRONG)**:
> "Test #9: NRA with PH government bequest — Full value deducted (not proportional)"

**Corrected**:
Test #9: NRA with PH government bequest ₱1M, PH estate ₱5M of ₱20M worldwide → deduction = 0.25 × ₱1M = ₱250K (proportional)

---

## Updated Test Cases

| # | Test | Expected Result |
|---|------|----------------|
| T1 | NRA, PH estate ₱5M of ₱20M worldwide, bequest to PH city = ₱1M | Schedule 5F = ₱250,000 (25% of ₱1M) |
| T2 | NRA, PH estate = worldwide estate (₱5M / ₱5M), bequest = ₱500K | Schedule 5F = ₱500,000 (100% — factor = 1.0) |
| T3 | NRA, PH estate ₱2M of ₱10M worldwide, bequest to NG = ₱2M | Schedule 5F = ₱400,000 (20% of ₱2M) |
| T4 | Citizen, bequest to PH city = ₱3M | Schedule 5F = ₱3,000,000 (full value; no proportional reduction) |
| T5 | NRA, no public transfers | Schedule 5F = ₱0 |
| T6 | NRA, bequest to foreign government (₱1M) | Disqualified (not PH govt); Schedule 5F = ₱0 |

---

## Engine Implementation Notes

1. **Shared proportional_factor**: The same `proportional_factor` computed for NRA ELIT (Sec. 86(B)(2)) is applied to public transfers. It does not need to be recomputed.

2. **Input field**: NRAs with public transfers do NOT need a new worldwide-public-transfers field. The formula uses the actual PH transfer FMV (already captured as `transfer.fmvAtDeath`) multiplied by the already-computed `proportional_factor`.

3. **Order of operations**: Public transfers (5F) and ELIT (5A–5D) both use the same factor. Both can be computed after the proportional_factor is established. No additional ordering constraint.

4. **Supplemental worksheet**: The NRA proportional worksheet must include a line for Schedule 5F:
   ```
   5F — Public Transfers to PH Government:
     Actual FMV of qualifying bequests:    ₱___________
     × Proportional factor:                    _____._____
     = Deductible amount (Schedule 5F):    ₱___________
   ```

5. **Citizen/resident path unchanged**: The proportional reduction applies ONLY to NRAs. Citizen/resident Schedule 5F retains full-value deduction.

---

## Cross-Reference

This correction is consistent with `analysis/nonresident-deductions.md`:
- Edge Case 8 (pages 506–529): identified the Sec. 86(B)(2) statutory basis
- Order of Operations step 4: `Compute proportional public transfers (5F) = proportional_factor × worldwide public transfers`
- Test T10: "NRA, bequest to PH government ₱1M, worldwide estate ₱10M, PH estate ₱2.5M → Proportional = 0.25 × ₱1M = ₱250K (not ₱1M)"

The `nonresident-deductions.md` analysis is authoritative on NRA deduction rules. `deduction-public-transfers.md` must be read in conjunction with this correction for NRA scenarios.
