# Deduction: Expenses, Losses, Indebtedness, and Taxes (ELIT)
## NIRC Sec. 86(A)(1) — Ordinary Deductions (Citizens and Residents)

**Aspect**: deduction-elit
**Wave**: 2 (TRAIN-era rule extraction)
**Analyzed**: 2026-02-23
**Source**: `input/legal-sources/nirc-title-iii.md`, Sec. 86(A)(1)

---

## Legal Basis

**NIRC Section 86(A)(1)** (TRAIN-era, as amended by RA 10963):

> "For the purpose of the tax imposed in Section 84, the value of the net estate of a citizen or resident of the Philippines shall be determined by deducting from the value of the gross estate:
> (1) Expenses, Losses, Indebtedness, and Taxes. — Such amounts:
> (a) For claims against the estate...
> (b) For claims of the deceased against insolvent persons...
> (c) For unpaid mortgages upon, or any indebtedness in respect to, property...
> (d) For taxes which have accrued as of the death of the decedent...
> (e) For losses incurred during the settlement of the estate..."

**TRAIN Change (critical)**: Effective January 1, 2018, **funeral expenses** and **judicial/administrative expenses** were **removed** from allowable ELIT deductions. These were formerly deductible under the pre-TRAIN regime but are no longer deductible for TRAIN-era estates. See `analysis/deductions-pre-train-diffs.md` (when available) for the pre-TRAIN rules.

**Form 1801 mapping**: Schedule 5 (Ordinary Deductions), Lines 5A through 5D; feeds Item 35 (Total Ordinary Deductions).

---

## Five ELIT Sub-Items

### (a) Claims Against the Estate — Schedule 5A

**Legal Text**: Claims against the estate at the time of death.

**Qualifying Conditions** (ALL must be satisfied):
1. The liability is a **personal obligation of the deceased** existing at the time of death (not incurred post-death).
2. The liability was **contracted in good faith** and for **adequate and full consideration** in money or money's worth.
3. The claim is **duly substantiated**: supported by a notarized document (e.g., notarized promissory note, loan agreement, contract). Verbal debts or undocumented obligations do not qualify.
4. The creditor is **not the estate itself** (no circular claims).

**Examples that qualify**:
- Bank loans with loan documents signed by decedent
- Documented personal loans to third parties
- Outstanding medical bills (incurred pre-death, documented)
- Credit card balances (statement as evidence; notarization requirement may be waived for institutional creditors with documented statements)

**Examples that do NOT qualify**:
- Debts created or formalized after death
- Undocumented obligations (verbal debts, family debts without notarized agreement)
- Funeral and burial expenses (removed by TRAIN)
- Judicial and administrative expenses of estate settlement (removed by TRAIN)

**Rule (pseudocode)**:
```
function computeClaimsAgainstEstate(claims):
  total_exclusive = 0
  total_conjugal  = 0

  for each claim in claims:
    validate:
      claim.existedAtDateOfDeath = true      // pre-existing personal obligation
      claim.contractedInGoodFaith = true     // user-affirmed
      claim.isNotarized = true               // or equivalent documentation
      claim.amountOwed > 0

    if claim.ownership == "exclusive":
      total_exclusive += claim.amountOwed
    elif claim.ownership == "conjugal":
      total_conjugal += claim.amountOwed

  return {
    exclusive: total_exclusive,
    conjugal:  total_conjugal,
    total:     total_exclusive + total_conjugal
  }

// For Form 1801 Schedule 5A:
deductions.claimsAgainstEstate = computeClaimsAgainstEstate(input.claimsAgainstEstate)
```

---

### (b) Claims Against Insolvent Persons — Schedule 5B

**Legal Text**: Claims of the deceased against insolvent persons, to the extent that the claim is uncollectible.

**Logic**: The decedent held receivables (loans given to third parties, accounts receivable from a business) from persons who are now insolvent. These receivables were already **included in the gross estate** (Schedule 2 — Personal Properties, as notes/accounts receivable). The deduction removes the uncollectible portion from the taxable base.

**Qualifying Conditions** (ALL must be satisfied):
1. The claim must be **included in the gross estate** (cannot deduct a claim that was not counted as an asset).
2. The debtor (the person who owes the estate) is **demonstrably insolvent**: unable to pay the obligation.
3. The amount deducted is **only the uncollectible portion** — if partial recovery is possible, only the unrecoverable balance qualifies.

**Rule (pseudocode)**:
```
function computeClaimsVsInsolvent(insolvents):
  total_exclusive = 0
  total_conjugal  = 0

  for each item in insolvents:
    validate:
      item.includedInGrossEstate = true    // the receivable appears in Schedule 2
      item.debtorIsInsolvent = true        // user-affirmed with documentation
      item.uncollectibleAmount <= item.totalReceivable

    if item.ownership == "exclusive":
      total_exclusive += item.uncollectibleAmount
    elif item.ownership == "conjugal":
      total_conjugal += item.uncollectibleAmount

  return {
    exclusive: total_exclusive,
    conjugal:  total_conjugal,
    total:     total_exclusive + total_conjugal
  }

deductions.claimsVsInsolvent = computeClaimsVsInsolvent(input.claimsVsInsolvent)
```

---

### (c) Unpaid Mortgages and Indebtedness on Property — Schedule 5C

**Legal Text**: Unpaid mortgages upon, or any indebtedness in respect to, property where the value of the decedent's interest therein is included in the gross estate.

**Qualifying Conditions** (ALL must be satisfied):
1. The underlying **property is included in the gross estate** (property cannot be excluded while the mortgage is deducted).
2. The deductible amount is limited to the **decedent's proportional share** of the mortgage — for conjugal/community property, only 50% of the mortgage may be deducted (the other 50% is the surviving spouse's obligation and has already been accounted for in the spouse's share computation).
3. The mortgage or indebtedness was outstanding and **unpaid as of the date of death**.

**Rule (pseudocode)**:
```
function computeUnpaidMortgages(mortgages):
  total_exclusive = 0
  total_conjugal  = 0

  for each mortgage in mortgages:
    validate:
      mortgage.underlyingPropertyInGrossEstate = true

    if mortgage.ownership == "exclusive":
      // Full mortgage balance is the decedent's obligation
      deductible = mortgage.outstandingBalance
      total_exclusive += deductible

    elif mortgage.ownership == "conjugal":
      // Only decedent's share (50%) of conjugal mortgage is deductible here;
      // the surviving spouse's share is accounted for in Schedule 6A computation
      deductible = mortgage.outstandingBalance  // full conjugal balance
      // Note: do NOT halve here — the full conjugal balance goes in Column B;
      // the spousal share computation (Schedule 6A) handles the 50/50 split.
      total_conjugal += deductible

  return {
    exclusive: total_exclusive,
    conjugal:  total_conjugal,
    total:     total_exclusive + total_conjugal
  }

deductions.unpaidMortgages = computeUnpaidMortgages(input.unpaidMortgages)
```

**Important**: The mortgage enters Column B (conjugal) at full balance. The Schedule 6A surviving spouse computation then deducts it from conjugal property before halving (see Schedule 6A rule: net conjugal = gross conjugal − conjugal obligations → spouse share = net conjugal × 0.50).

---

### (d) Unpaid Taxes — Combined in Schedule 5C

**Legal Text**: Taxes which have accrued as of the death of the decedent which were unpaid as of the time of death.

**Qualifying Conditions**:
1. The tax had **accrued** as of the date of death (liability had arisen — e.g., real property tax for the year, income tax accrued but not yet paid).
2. The tax was **unpaid** at the time of death.
3. Does NOT include the **estate tax itself** (the tax being computed; cannot deduct the estate tax from itself).
4. Does NOT include taxes that arose after death (e.g., income tax on estate earnings during administration).

**Common examples**:
- Real property tax (RPT) for the current year, unpaid as of date of death
- Income tax liability from the decedent's prior tax year, not yet remitted
- Capital gains tax on a sale completed before death but unpaid

**Rule (pseudocode)**:
```
function computeUnpaidTaxes(taxes):
  total_exclusive = 0
  total_conjugal  = 0

  for each tax in taxes:
    validate:
      tax.accruedBeforeDeath = true
      tax.unpaidAtDeath = true
      tax.type != "estate_tax"    // cannot deduct the estate tax being computed

    if tax.ownership == "exclusive":
      total_exclusive += tax.amountDue
    elif tax.ownership == "conjugal":
      total_conjugal += tax.amountDue

  return {
    exclusive: total_exclusive,
    conjugal:  total_conjugal,
    total:     total_exclusive + total_conjugal
  }

// Engine combines unpaid mortgages + unpaid taxes into Schedule 5C total:
deductions.unpaidMortgagesAndTaxes = {
  exclusive: deductions.unpaidMortgages.exclusive + computeUnpaidTaxes(input.unpaidTaxes).exclusive,
  conjugal:  deductions.unpaidMortgages.conjugal  + computeUnpaidTaxes(input.unpaidTaxes).conjugal,
  total:     deductions.unpaidMortgages.total     + computeUnpaidTaxes(input.unpaidTaxes).total
}
// Feeds Schedule 5C, Column A and Column B
```

---

### (e) Casualty Losses During Settlement — Schedule 5D

**Legal Text**: Losses incurred during the settlement of the estate arising from fires, storms, shipwreck, or other casualties, or from robbery, theft, or embezzlement.

**Qualifying Conditions** (ALL must be satisfied):
1. The loss occurs **during the settlement of the estate** (after death, during administration — not losses the decedent incurred before death).
2. The loss is due to a **qualifying event**: fire, storm, shipwreck, other casualty, robbery, theft, or embezzlement.
3. The loss is **not compensated** by insurance or otherwise (net uninsured loss only; deduct only the uninsured portion).
4. The loss has **not been claimed as an income tax deduction** on an estate income tax return (no double-deduction).
5. At the time of **filing the estate tax return**, the loss has already occurred (cannot deduct anticipated losses).

**Rule (pseudocode)**:
```
function computeCasualtyLosses(losses):
  total_exclusive = 0
  total_conjugal  = 0

  for each loss in losses:
    validate:
      loss.occurredDuringSettlement = true    // post-death, pre-filing
      loss.qualifyingEvent = true             // fire/storm/casualty/robbery/theft/embezzlement
      loss.notClaimedForIncomeTax = true      // user-affirmed

    net_loss = loss.totalLoss - loss.insuranceRecovery  // only uninsured portion
    net_loss = max(0, net_loss)

    if loss.ownership == "exclusive":
      total_exclusive += net_loss
    elif loss.ownership == "conjugal":
      total_conjugal += net_loss

  return {
    exclusive: total_exclusive,
    conjugal:  total_conjugal,
    total:     total_exclusive + total_conjugal
  }

deductions.lossesSettlement = computeCasualtyLosses(input.casualtyLosses)
```

---

## Aggregate ELIT Computation (Schedule 5 Lines 5A–5D)

```
// Each sub-item computed above:
sched5A = deductions.claimsAgainstEstate          // 5A
sched5B = deductions.claimsVsInsolvent             // 5B
sched5C = deductions.unpaidMortgagesAndTaxes       // 5C
sched5D = deductions.lossesSettlement              // 5D

// ELIT total (not including 5E vanishing, 5F public transfers, 5G other):
deductions.elitTotal = {
  exclusive: sched5A.exclusive + sched5B.exclusive + sched5C.exclusive + sched5D.exclusive,
  conjugal:  sched5A.conjugal  + sched5B.conjugal  + sched5C.conjugal  + sched5D.conjugal,
  total:     sched5A.total     + sched5B.total      + sched5C.total     + sched5D.total
}

// Full ordinary deduction total (including vanishing deduction and public transfers):
deductions.ordinaryTotal = {
  exclusive: deductions.elitTotal.exclusive
             + deductions.vanishingDeduction.exclusive    // from deduction-vanishing aspect
             + deductions.transfersPublicUse.exclusive,   // from deduction-public-transfers aspect
  conjugal:  deductions.elitTotal.conjugal
             + deductions.vanishingDeduction.conjugal
             + deductions.transfersPublicUse.conjugal,
  total:     deductions.elitTotal.total
             + deductions.vanishingDeduction.total
             + deductions.transfersPublicUse.total
}
// → Item 35, Columns A, B, C
```

---

## Form 1801 Mapping

| Schedule Line | ELIT Sub-item | Engine Field | Column Structure |
|--------------|---------------|-------------|-----------------|
| 5A | Claims Against the Estate | `deductions.claimsAgainstEstate` | Columns A (exclusive) + B (conjugal) |
| 5B | Claims Against Insolvent Persons | `deductions.claimsVsInsolvent` | Columns A + B |
| 5C | Unpaid Mortgages + Unpaid Taxes | `deductions.unpaidMortgagesAndTaxes` | Columns A + B |
| 5D | Casualty Losses During Settlement | `deductions.lossesSettlement` | Columns A + B |
| 5E | Vanishing Deduction | → separate aspect `deduction-vanishing` | Columns A + B |
| 5F | Transfers for Public Use | → separate aspect `deduction-public-transfers` | Columns A + B |
| 5G | Other Ordinary Deductions | (if any; typically zero) | Columns A + B |
| **5H / Item 35** | **Total Ordinary Deductions** | `deductions.ordinaryTotal` | **Columns A + B + C** |

**Item 36** = Item 34 (Gross Estate Total) − Item 35 (Ordinary Deductions Total)
```
computation.estateAfterOrdinary = {
  exclusive: grossEstate.total.exclusive - deductions.ordinaryTotal.exclusive,
  conjugal:  grossEstate.total.conjugal  - deductions.ordinaryTotal.conjugal,
  total:     grossEstate.total.total     - deductions.ordinaryTotal.total
}
// Each column is floored at 0 (cannot be negative on the form)
```

---

## TRAIN vs. Pre-TRAIN Differences for ELIT

| Deduction Item | Pre-TRAIN (death < 2018-01-01) | TRAIN-Era (death ≥ 2018-01-01) |
|---------------|-------------------------------|-------------------------------|
| Claims Against Estate | Deductible | Deductible (same rules) |
| Claims vs. Insolvent | Deductible | Deductible (same rules) |
| Unpaid Mortgages | Deductible | Deductible (same rules) |
| Unpaid Taxes | Deductible | Deductible (same rules) |
| Casualty Losses | Deductible | Deductible (same rules) |
| **Funeral Expenses** | **Deductible** (lower of actual or 5% of gross estate, max ₱200K) | **NOT deductible** |
| **Judicial/Admin Expenses** | **Deductible** (actual) | **NOT deductible** |

**Engine rule**: If `regime == "TRAIN"`, funeral and judicial/administrative expense inputs are rejected (validation error or silently zero). If `regime == "pre_TRAIN"`, these additional sub-items are computed (see `analysis/deductions-pre-train-diffs.md`).

---

## Conditions Summary Table

| Sub-item | Key Conditions | Documentation Required |
|----------|---------------|----------------------|
| Claims Against Estate (5A) | Personal obligation at death; good faith; for consideration | Notarized instrument, contract, or bank statement |
| Claims vs. Insolvent (5B) | Included in gross estate first; debtor is insolvent; only uncollectible portion | Evidence of insolvency (court declaration, balance sheet) |
| Unpaid Mortgages (5C) | Property in gross estate; outstanding at death | Mortgage documents, outstanding balance statement |
| Unpaid Taxes (5C) | Accrued before death; unpaid; not the estate tax itself | Tax assessment, billing statement |
| Casualty Losses (5D) | Post-death, during settlement; qualifying event; uninsured; not double-claimed | Incident report, insurance documents, settlement records |

---

## Edge Cases

1. **Funeral expenses claimed by user (TRAIN-era)**: The engine must validate and reject funeral expenses as a TRAIN-era ELIT deduction. Display a clear error: "Funeral expenses are not deductible for deaths on or after January 1, 2018 under TRAIN."

2. **Judicial/administrative expenses claimed by user (TRAIN-era)**: Same rejection as funeral expenses. "Court fees, attorney's fees, and estate administration expenses are not deductible under TRAIN."

3. **Claim against estate incurred after death**: If a debt was formalized or contracted after the decedent's death (e.g., estate borrows money to pay operating costs), it does NOT qualify under 5A. Engine validates: `claim.existedAtDateOfDeath = true`.

4. **Insolvent person claim not in gross estate**: If the receivable was not included as an asset in Schedule 2, the deduction under 5B is disallowed. Engine must cross-reference.

5. **Mortgage on conjugal property**: The FULL outstanding balance enters Schedule 5C Column B. The 50/50 split happens inside Schedule 6A (surviving spouse share computation), not at Schedule 5 entry. Doing the halving at Schedule 5 would understate the conjugal deduction and miscompute the spouse share.

6. **Casualty loss partially covered by insurance**: Deductible amount = loss amount − insurance proceeds. E.g., house fire: total loss ₱500,000, insurance paid ₱300,000 → deductible = ₱200,000.

7. **Estate tax itself**: The estate tax liability cannot be deducted from itself. If user lists estate tax as an unpaid tax, the engine must exclude it.

8. **Real property tax (RPT) for year of death**: RPT for the calendar year of death is deductible if it had accrued and was unpaid at time of death. This is a common overlooked deduction. RPT is typically assessed annually and accrues January 1 — for mid-year deaths, the full year's RPT is deductible.

9. **Income tax for final year**: The decedent's final income tax return covers income earned up to date of death. The estimated income tax payable for that final period (already accrued, not yet paid) is deductible as an unpaid tax.

10. **No ELIT deductions**: When a simple estate has no debts, mortgages, taxes, or losses, all ELIT fields are zero. This is valid — Item 35 = 0. The engine must not require at least one ELIT item.

11. **ELIT deductions exceed gross estate column**: If Column A ordinary deductions exceed Column A gross estate, Item 36 Column A goes negative. BIR practice: each column is floored at 0 for Item 36 (excess exclusive deductions cannot offset conjugal assets and vice versa). The total column is also floored at 0.

12. **Claims vs. insolvent: partially collectible**: If ₱1,000,000 is owed to the estate and ₱300,000 is recoverable (debtor has some assets), only ₱700,000 is deductible. Engine takes `uncollectibleAmount` as a user input; engine does not compute recoverability.

---

## Test Implications

1. **Simple estate, no debts**: All ELIT fields = 0; Item 35 = 0; Item 36 = Item 34.
2. **Claims against estate only**: Single loan of ₱500,000 (exclusive). Item 35 Col A = ₱500,000; Col B = 0; Col C = ₱500,000.
3. **Conjugal mortgage**: Mortgage of ₱2,000,000 on conjugal property. 5C Col A = 0, Col B = ₱2,000,000. Schedule 6A then reduces net conjugal by ₱2,000,000 before halving.
4. **TRAIN funeral rejection**: User inputs ₱200,000 funeral expenses on TRAIN-era estate. Engine outputs validation error; funeral deduction = 0.
5. **Insolvent claim cross-reference**: Receivable of ₱400,000 from insolvent debtor must appear in Schedule 2 (gross estate). Engine validates inclusion before allowing 5B deduction.
6. **Casualty loss net of insurance**: Fire loss ₱1,000,000; insurance recovery ₱750,000. Net deductible = ₱250,000.
7. **Estate tax excluded from unpaid taxes**: User lists ₱150,000 estate tax as an unpaid tax. Engine excludes it from 5C.
8. **Multiple ELIT sub-items**: Estate with claims (₱500K exclusive), conjugal mortgage (₱1.5M), RPT (₱50K exclusive). Item 35: Col A = ₱550,000; Col B = ₱1,500,000; Col C = ₱2,050,000.
9. **Item 36 floor at zero**: ELIT deductions of ₱8M against gross estate of ₱5M. Item 36 = max(0, ₱5M − ₱8M) = ₱0. No negative carryover.
10. **Good faith requirement**: Claims contracted without consideration (gifts labeled as loans) do not qualify. Engine must accept user attestation of good faith; it does not independently verify.
