# Analysis: amnesty-computation

**Aspect**: amnesty-computation
**Wave**: 4 — Estate Tax Amnesty Rule Extraction
**Date Analyzed**: 2026-02-24
**Legal Sources**: `input/legal-sources/amnesty-provisions.md`, `input/legal-sources/nirc-title-iii.md`, `input/legal-sources/pre-train-rates.md`
**Depends On**: `analysis/amnesty-eligibility.md`, `analysis/deductions-pre-train-diffs.md`, `analysis/surviving-spouse-share.md`

---

## Legal Basis

**RA 11213, Section 5** — Amnesty Tax Rate and Computation:

> "There is hereby imposed an estate tax amnesty at the rate of six percent (6%) of the total net estate of the decedent at the time of death..."

**RA 11213, Section 3** — Definitions:

> "Net estate" means the gross estate minus allowable deductions under the NIRC of 1997, as amended.

> "Net undeclared estate" means the difference between the total net estate valued at the time of death and the net estate previously declared with the BIR, if any.

**Rate**: Flat **6% (0.06)** — identical numericaly to the TRAIN flat rate, but applied against a potentially different base (due to Track B and deduction rule differences for pre-2018 deaths).

**Minimum payment**: ₱5,000 — if computed amnesty tax is less than ₱5,000 (including the case where net estate ≤ 0).

**Legal interpretation note on deductions**: Section 3 defines net estate as gross estate minus "allowable deductions under the NIRC of 1997, as amended." For pre-2018 deaths, the NIRC as it stood at the time of death includes funeral expenses and judicial/admin expenses. The engine implements the full deduction set at the time of death as the primary rule — aligned with the plain text of the law. A minority interpretation (common in some BIR guidance and practitioner commentary) limits amnesty deductions to standard deduction plus surviving spouse share only. Both interpretations are presented; the engine's primary path uses the full deduction set with a professional-advice disclaimer. See also "Deduction Interpretation Conflict" under Edge Cases.

---

## Two Computation Tracks

### Track A — No Prior Estate Tax Return Filed

The estate has never had an estate tax return filed. The full net estate (at the time of death) is the amnesty tax base.

### Track B — Prior Estate Tax Return Was Filed

A prior estate tax return was filed (whether or not tax was paid), but the estate tax remains unpaid or the estate was undertaxed. Only the **net undeclared estate** (the portion not covered in the prior return) is subject to amnesty tax.

**Track selection input**: `estate.priorReturnFiled: boolean` — user-declared. Engine does not verify.

---

## Rule (Pseudocode)

```pseudocode
// ─────────────────────────────────────────────────────────────────────────────
// AMNESTY TAX COMPUTATION
// Pre-condition: amnesty-eligibility check has returned { eligible: true, track, deductionRules }
// ─────────────────────────────────────────────────────────────────────────────

AMNESTY_RATE    = 0.06
MINIMUM_PAYMENT = 5_000

// ─── Step 1: Compute Gross Estate ──────────────────────────────────────────
// Same rules as TRAIN/pre-TRAIN based on decedent's status:
//   Citizens and resident aliens  → worldwide assets (same as TRAIN/pre-TRAIN citizens)
//   Non-resident aliens           → PH-situs assets only (same as TRAIN/pre-TRAIN NRA)
// Inclusions (Sec. 85(C)–(G): revocable transfers, GPA, life insurance) apply identically.

grossEstate = computeGrossEstate(decedent, assets)
// grossEstate.total = Item 34 equivalent

// ─── Step 2: Compute Allowable Deductions ──────────────────────────────────
// The NIRC says "allowable deductions at the time of death."
// Deduction rules are determined by decedent.dateOfDeath, not by the amnesty election.

if eligibility.deductionRules == "PRE_TRAIN":
  // Death before 2018-01-01 → apply pre-TRAIN deduction rules
  deductions = computeAmnestyDeductionsPreTRAIN(decedent, grossEstate, input)

elif eligibility.deductionRules == "TRAIN":
  // Death 2018-01-01 through 2022-05-31 (RA 11956 expanded coverage)
  // Apply TRAIN-era deduction rules (no funeral, no judicial/admin)
  deductions = computeAmnestyDeductionsTRAIN(decedent, grossEstate, input)

// ─── Step 3: Net Estate ───────────────────────────────────────────────────
netEstate = max(0, grossEstate.total - deductions.total)
// Floored at 0 — deductions cannot produce negative net estate

// ─── Step 4: Surviving Spouse Share ────────────────────────────────────────
// 50% of net conjugal/community property — same formula as TRAIN/pre-TRAIN.
// See surviving-spouse-share.md for full computation.
survivingSpouseShare = computeSurvivingSpouseShare(decedent, netEstate, propertyRegime)

// ─── Step 5: Net Taxable Estate ────────────────────────────────────────────
netTaxableEstate = max(0, netEstate - survivingSpouseShare)

// ─── Step 6: Select Track and Compute Amnesty Tax Base ─────────────────────
if eligibility.track == "TRACK_A":
  // No prior return: full net taxable estate is the base
  amnestyTaxBase = netTaxableEstate

elif eligibility.track == "TRACK_B":
  // Prior return filed: compute net undeclared estate
  // Input: estate.previouslyDeclaredNetEstate (user-provided from prior return)
  netUndeclaredEstate = netTaxableEstate - estate.previouslyDeclaredNetEstate
  // Net undeclared can be zero or negative if previously declared ≥ current estimate
  amnestyTaxBase = max(0, netUndeclaredEstate)

// ─── Step 7: Compute Amnesty Tax Due ────────────────────────────────────────
computedAmnestyTax = amnestyTaxBase * AMNESTY_RATE
amnestyTaxDue = max(MINIMUM_PAYMENT, computedAmnestyTax)
// Minimum ₱5,000 ALWAYS applies — even if computed tax is ₱0 or amnestyTaxBase is ₱0

// ─── Output Fields ───────────────────────────────────────────────────────────
output = {
  grossEstate:            grossEstate.total,           // Item 34 equivalent
  totalDeductions:        deductions.total,            // Item 35 equivalent
  netEstate:              netEstate,                   // Item 38 equivalent
  survivingSpouseShare:   survivingSpouseShare,        // Item 39 equivalent
  netTaxableEstate:       netTaxableEstate,            // Item 40 equivalent
  track:                  eligibility.track,           // "TRACK_A" or "TRACK_B"
  previouslyDeclaredNet:  estate.previouslyDeclaredNetEstate  // Track B only
  amnestyTaxBase:         amnestyTaxBase,              // base before applying rate
  computedAmnestyTax:     computedAmnestyTax,          // before minimum floor
  amnestyTaxDue:          amnestyTaxDue,               // max(5000, computed)
  minimumApplied:         (computedAmnestyTax < MINIMUM_PAYMENT),
  deductionInterpretation: "FULL_SET_AT_TIME_OF_DEATH"  // flag for audit trail
}
```

---

## Deduction Computation by Track

### Pre-TRAIN Deaths (dateOfDeath < 2018-01-01)

```pseudocode
function computeAmnestyDeductionsPreTRAIN(decedent, grossEstate, input):
  d = {}

  // ── Ordinary Deductions (full pre-TRAIN set) ────────────────────────────
  // 5A — Claims Against the Estate
  d.claimsAgainstEstate     = computeClaimsAgainstEstate(input.claimsAgainstEstate)

  // 5B — Claims vs. Insolvent Persons
  d.claimsVsInsolvent       = computeClaimsVsInsolvent(input.claimsVsInsolvent)

  // 5C — Unpaid Mortgages and Taxes
  d.unpaidMortgagesAndTaxes = computeUnpaidMortgages(input) + computeUnpaidTaxes(input)

  // 5D — Casualty Losses
  d.casualtyLosses          = computeCasualtyLosses(input.casualtyLosses)

  // 5E — Vanishing Deduction
  d.vanishingDeduction      = computeVanishingDeduction(input, grossEstate)

  // 5F — Transfers for Public Use
  d.transfersPublicUse      = computeTransfersPublicUse(input, decedent, grossEstate)

  // PRE-TRAIN ONLY: Funeral Expenses
  // Rule: min(actual, 5% × grossEstate.total)
  // grossEstate must already be finalized (Item 34) before this step
  funeralLimit              = grossEstate.total * 0.05
  d.funeralExpenses         = min(input.funeralExpenses.actualAmount, funeralLimit)

  // PRE-TRAIN ONLY: Judicial/Administrative Expenses
  d.judicialAdminExpenses   = sum(expense.amount for expense in input.judicialAdminExpenses)

  ordinaryDeductionsTotal   = sum of all d.* items above

  // ── Special Deductions (pre-TRAIN amounts) ──────────────────────────────
  // Standard deduction
  if decedent.isNonResidentAlien:
    d.standardDeduction     = 500_000   // Same as TRAIN for NRAs
  else:
    d.standardDeduction     = 1_000_000 // Pre-TRAIN amount (NOT ₱5M)

  // Family Home (pre-TRAIN cap)
  if decedent.isNonResidentAlien:
    d.familyHomeDeduction   = 0         // NRAs ineligible
  elif familyHome.ownership == "exclusive":
    d.familyHomeDeduction   = min(familyHome.fmv, 1_000_000)
  else:  // conjugal or communal
    d.familyHomeDeduction   = min(familyHome.fmv * 0.5, 1_000_000)

  // Medical Expenses (cap identical across all regimes)
  d.medicalExpenses         = min(input.medicalExpenses.qualifying, 500_000)

  // RA 4917 Benefits
  d.ra4917Benefits          = input.ra4917Benefits

  specialDeductionsTotal    = d.standardDeduction + d.familyHomeDeduction
                            + d.medicalExpenses + d.ra4917Benefits

  // ── Total ───────────────────────────────────────────────────────────────
  d.total = ordinaryDeductionsTotal + specialDeductionsTotal
  return d
```

**Note on deduction interpretation**: The engine implements the full deduction set (including funeral and judicial/admin) as the primary path for pre-2018 amnesty estates. This is consistent with the plain text of RA 11213 Sec. 3 ("allowable deductions under the NIRC ... as amended"). If a user or professional prefers the narrow interpretation (standard deduction + spouse share only), the engine can recompute using:

```pseudocode
// Narrow interpretation override (professional discretion)
if input.useNarrowAmnestyDeductions:
  d.total = d.standardDeduction + survivingSpouseShare
  // All other deductions zeroed
  // Note: survivingSpouseShare is applied separately at Step 4;
  // in the narrow interpretation, it is the ONLY post-gross-estate reduction
```

Display warning when narrow interpretation is used: "Using narrow interpretation of RA 11213 deductions. This computation includes only the standard deduction. Consult a tax professional to confirm which deduction set applies to your estate."

---

### TRAIN-Era Amnesty Deaths (2018-01-01 ≤ dateOfDeath ≤ 2022-05-31)

```pseudocode
function computeAmnestyDeductionsTRAIN(decedent, grossEstate, input):
  // TRAIN-era deduction rules — no funeral, no judicial/admin
  // Uses TRAIN amounts for standard deduction and family home cap
  d = {}

  // 5A–5F: same as regular TRAIN ordinary deductions
  d.claimsAgainstEstate     = computeClaimsAgainstEstate(input.claimsAgainstEstate)
  d.claimsVsInsolvent       = computeClaimsVsInsolvent(input.claimsVsInsolvent)
  d.unpaidMortgagesAndTaxes = computeUnpaidMortgages(input) + computeUnpaidTaxes(input)
  d.casualtyLosses          = computeCasualtyLosses(input.casualtyLosses)
  d.vanishingDeduction      = computeVanishingDeduction(input, grossEstate)
  d.transfersPublicUse      = computeTransfersPublicUse(input, decedent, grossEstate)

  ordinaryDeductionsTotal   = sum of all d.* items above

  // Standard deduction (TRAIN amounts)
  if decedent.isNonResidentAlien:
    d.standardDeduction     = 500_000
  else:
    d.standardDeduction     = 5_000_000  // TRAIN amount

  // Family Home (TRAIN cap)
  if decedent.isNonResidentAlien:
    d.familyHomeDeduction   = 0
  elif familyHome.ownership == "exclusive":
    d.familyHomeDeduction   = min(familyHome.fmv, 10_000_000)
  else:
    d.familyHomeDeduction   = min(familyHome.fmv * 0.5, 10_000_000)

  d.medicalExpenses         = min(input.medicalExpenses.qualifying, 500_000)
  d.ra4917Benefits          = input.ra4917Benefits

  specialDeductionsTotal    = d.standardDeduction + d.familyHomeDeduction
                            + d.medicalExpenses + d.ra4917Benefits

  d.total = ordinaryDeductionsTotal + specialDeductionsTotal
  return d
```

**Key note on TRAIN-era amnesty**: For estates where the decedent died between 2018-01-01 and 2022-05-31, both the amnesty tax rate (6%) and the regular TRAIN rate (6%) are identical, and the deduction rules are the same. The computed base tax is therefore **identical** between the amnesty path and the regular TRAIN path. The engine must display:

> "For estates of decedents who died after January 1, 2018, the amnesty tax rate (6%) is identical to the regular TRAIN estate tax rate (6%), and the same deduction rules apply. The primary benefit of the estate tax amnesty for this estate was the **waiver of surcharges and interest** for late filing — which this engine does not compute. If the estate has no penalty exposure, or if the amnesty filing window has already closed, the regular TRAIN computation produces the same base tax result."

---

## Conditions

| Condition | Value | Notes |
|---|---|---|
| Pre-requisite | `amnesty-eligibility.md` check passed and returned `{ eligible: true }` | See amnesty-eligibility.md |
| Tax rate | 6% flat | RA 11213 Sec. 5 |
| Minimum payment | ₱5,000 | Applies even if amnestyTaxBase = 0 |
| Track A base | Full net taxable estate | No prior return filed |
| Track B base | Net taxable estate minus previously declared net estate | Prior return was filed |
| Deduction rules | Determined by date of death, not by amnesty election | Pre-TRAIN rules for < 2018; TRAIN rules for 2018–2022 |
| NRA deductions | Proportional formula (Sec. 86B) applies | Same proportional formula as regular TRAIN/pre-TRAIN for NRAs |
| Vanishing deduction | Available under amnesty (pre-2018 and 2018–2022 deaths) | Not restricted by amnesty |
| Funeral expenses | Available for pre-2018 deaths (full deduction set interpretation) | See deduction interpretation conflict |
| Judicial/admin expenses | Available for pre-2018 deaths (full deduction set interpretation) | See deduction interpretation conflict |
| Family home | Pre-2018 deaths: cap ₱1,000,000 | Same as pre-TRAIN regular |
| Family home | 2018–2022 deaths: cap ₱10,000,000 | Same as TRAIN regular |
| Standard deduction | Pre-2018 deaths (citizen/resident): ₱1,000,000 | Same as pre-TRAIN regular |
| Standard deduction | 2018–2022 deaths (citizen/resident): ₱5,000,000 | Same as TRAIN regular |
| NRA standard deduction | ₱500,000 always | Unchanged across all regimes |
| Foreign tax credit | NOT available under amnesty | Amnesty waives penalties, not credits — but the amnesty form (ETAR) has no credit line; base tax is final |

---

## Important: Deduction Interpretation Conflict

**Inconsistency with deductions-pre-train-diffs.md**: The engine branching logic in `analysis/deductions-pre-train-diffs.md` (function `getOrdinaryDeductionItems`) returns `common` (no funeral/judicial) for the amnesty path. This conflicts with the legal source text and the computation example in `input/legal-sources/amnesty-provisions.md`, which includes funeral expenses in the amnesty computation under the full-deduction-set interpretation.

**Resolution**:
- The law (RA 11213 Sec. 3) defines net estate as gross estate minus "allowable deductions under the NIRC of 1997, as amended." For pre-2018 deaths, funeral and judicial expenses were allowable at the time of death.
- The computation example in the cached legal source (`amnesty-provisions.md`) explicitly includes funeral expenses.
- The narrow interpretation in `deductions-pre-train-diffs.md` was based on some BIR administrative guidance, but does not reflect the plain text of the law.
- **Engine primary implementation**: Full deduction set at time of death (inclusive of funeral and judicial/admin for pre-2018 deaths). The `getOrdinaryDeductionItems` function in `deductions-pre-train-diffs.md` should be corrected to treat amnesty as equivalent to pre-TRAIN for pre-2018 deaths with respect to funeral and judicial expenses.
- **Narrow interpretation**: Available as a toggle for professional review, with a prominent disclaimer.

---

## NRA Proportional Deduction Under Amnesty

For non-resident alien decedents under amnesty, the Sec. 86(B) proportional formula applies to ELIT-type deductions (same as regular TRAIN/pre-TRAIN for NRAs):

```pseudocode
// For NRA amnesty estates:
proportionalFactor = grossEstatePH / grossEstateWorldwide

// Proportional deductions (applied to ELIT items + pre-TRAIN funeral/judicial if pre-2018):
d.claimsAgainstEstateDeductible   = d.claimsAgainstEstate * proportionalFactor
d.claimsVsInsolventDeductible     = d.claimsVsInsolvent * proportionalFactor
d.unpaidMortgagesAndTaxesDeductible = d.unpaidMortgagesAndTaxes * proportionalFactor
// etc.

// Standard deduction for NRAs:
d.standardDeduction = 500_000  // Fixed; NOT proportional

// Family home: NRAs ineligible (= 0)
```

The user must provide `decedent.totalWorldwideGrossEstateForDeductionPurposes` for NRA amnesty estates to compute the proportional factor. If not provided, engine cannot compute proportional deductions and must request this input.

---

## ETAR Output Structure (Amnesty Form Mapping)

Amnesty estates do NOT use BIR Form 1801. The correct filing form is the **Estate Tax Amnesty Return (ETAR)**. The engine produces an ETAR-structured output:

| Engine Output Field | ETAR / TRAIN Equivalent | Description |
|---|---|---|
| `output.grossEstate` | Item 34 | Total FMV of estate assets |
| `output.ordinaryDeductions` | Item 35 (partial) | ELIT + vanishing + public transfers [+ funeral + judicial if pre-2018] |
| `output.specialDeductions` | Item 37 | Standard + family home + medical + RA4917 |
| `output.totalDeductions` | Item 35 + 37 combined | All allowable deductions |
| `output.netEstate` | Item 38 | Gross estate − total deductions |
| `output.survivingSpouseShare` | Item 39 | 50% of net conjugal/communal |
| `output.netTaxableEstate` | Item 40 | Net estate − surviving spouse share |
| `output.track` | N/A on ETAR | "TRACK_A" or "TRACK_B" |
| `output.previouslyDeclaredNet` | Track B input | User-provided (Track B only) |
| `output.amnestyTaxBase` | Computation line | Full net taxable (Track A) or undeclared (Track B) |
| `output.computedAmnestyTax` | ETAR tax line | amnestyTaxBase × 0.06 |
| `output.amnestyTaxDue` | ETAR final amount | max(₱5,000, computedAmnestyTax) |
| `output.minimumApplied` | Display flag | True if ₱5,000 floor was used |

**Note**: The ETAR does not include foreign tax credit lines. The amnesty tax as computed is the final amount due. There is no credit offset in the amnesty path.

---

## Complete Computation Example

### Example 1: Track A, Pre-2018 Death, Pre-TRAIN Deductions

**Facts**:
- Decedent: Filipino citizen, died January 15, 2012
- Gross estate: ₱8,000,000 (all conjugal, CPG regime)
- Claims against estate: ₱400,000 (conjugal liabilities)
- Funeral expenses: ₱300,000 actual (< 5% × ₱8M = ₱400,000)
- Judicial/admin expenses: ₱100,000
- Family home FMV: ₱2,000,000 (conjugal → decedent's share = ₱1,000,000 → cap = ₱1,000,000)
- No prior estate tax return filed → Track A
- No surviving spouse (predeceased)

```
Gross Estate (Item 34):                            ₱8,000,000

Ordinary Deductions:
  Claims against estate:             -₱400,000
  Funeral expenses (min(300K, 400K)): -₱300,000
  Judicial/admin expenses:           -₱100,000
  (Vanishing, public transfers, etc.: ₱0)
Total Ordinary Deductions:                          -₱800,000

Estate After Ordinary Deductions (Item 36):        ₱7,200,000

Special Deductions:
  Standard deduction (pre-TRAIN):  -₱1,000,000
  Family home (decedent's ½ = ₱1M, cap ₱1M): -₱1,000,000
  Medical expenses: ₱0
Total Special Deductions (Item 37):               -₱2,000,000

Net Estate (Item 38):                              ₱5,200,000
Surviving Spouse Share (Item 39): ₱0 (predeceased)

Net Taxable Estate (Item 40):                      ₱5,200,000

Amnesty Tax Base (Track A):                        ₱5,200,000
Computed Amnesty Tax: ₱5,200,000 × 0.06:            ₱312,000
Minimum ₱5,000: N/A (computed > minimum)
Amnesty Tax Due:                                     ₱312,000
```

**Contrast with regular pre-TRAIN**: Net taxable estate ₱5,200,000 falls in the ₱5M–₱10M bracket:
```
Regular pre-TRAIN tax = ₱465,000 + (₱200,000 × 0.15) = ₱465,000 + ₱30,000 = ₱495,000
```
Amnesty saves ₱183,000 in base tax (plus all accrued interest and surcharges).

---

### Example 2: Track B, Pre-2018 Death

**Facts**:
- Decedent: Filipino citizen, died 2010
- Total net taxable estate (current computation): ₱3,000,000
- Previously declared net estate (per prior return): ₱2,000,000
- Prior return was filed but tax remains partially unpaid

```
Net Taxable Estate (full):             ₱3,000,000
Previously Declared Net Estate:       -₱2,000,000
Net Undeclared Estate:                 ₱1,000,000

Amnesty Tax Base (Track B):            ₱1,000,000
Computed Amnesty Tax: ₱1,000,000 × 0.06: ₱60,000
Minimum ₱5,000: N/A
Amnesty Tax Due:                          ₱60,000
```

---

### Example 3: Minimum Payment Trigger

**Facts**:
- Decedent: Filipino citizen, died 2015
- Gross estate: ₱1,500,000
- Standard deduction (pre-TRAIN): ₱1,000,000
- Family home (exclusive): ₱400,000 (below ₱1M cap → full amount)
- Surviving spouse share: ₱0 (single)

```
Gross Estate:                    ₱1,500,000
Total Deductions:               -₱1,400,000 (standard ₱1M + family home ₱400K)
Net Taxable Estate:                ₱100,000

Amnesty Tax Base:                  ₱100,000
Computed Amnesty Tax: ₱100,000 × 0.06 = ₱6,000
Minimum: max(₱5,000, ₱6,000) = ₱6,000
Amnesty Tax Due:                     ₱6,000
```
(Minimum does not trigger here since ₱6,000 > ₱5,000.)

**Modified**: if net taxable estate = ₱60,000:
```
Computed tax: ₱60,000 × 0.06 = ₱3,600
Minimum applies: max(₱5,000, ₱3,600) = ₱5,000
Amnesty Tax Due: ₱5,000  ← minimum floor applied
output.minimumApplied = true
```

---

## Edge Cases

### EC-AC-01: Deductions Exceed Gross Estate (Zero Net Estate)

```
Gross Estate:         ₱1,000,000
Total Deductions:    -₱1,200,000
Net Estate:           max(0, -₱200,000) = ₱0
Net Taxable Estate:   ₱0
Computed Tax:         ₱0 × 0.06 = ₱0
Minimum applies:      Amnesty Tax Due = ₱5,000
```
The ₱5,000 minimum is a hard floor regardless of computation.

### EC-AC-02: Track B — Previously Declared Exceeds Current Estimate

A scenario where the prior return overstated the estate (or property was subsequently excluded):
```
Net Taxable Estate (current):      ₱2,000,000
Previously Declared Net Estate:    ₱2,500,000
Net Undeclared Estate:            -₱500,000 → floored to ₱0
Amnesty Tax Base:                  ₱0
Computed Tax:                      ₱0
Minimum applies:                   Amnesty Tax Due = ₱5,000
```
The estate effectively has nothing additional to declare but must still pay the ₱5,000 minimum.

### EC-AC-03: TRAIN-Era Amnesty Death (2018–2022) — Same Tax as Regular TRAIN

```
Death: March 15, 2021 (TRAIN era, RA 11956 coverage)
Estate: simple, no surviving spouse
Gross Estate: ₱10,000,000
Standard Deduction (TRAIN): -₱5,000,000
Net Taxable Estate: ₱5,000,000

Regular TRAIN:        ₱5,000,000 × 0.06 = ₱300,000
Amnesty (Track A):    ₱5,000,000 × 0.06 = ₱300,000
Difference:           ₱0
```
Engine must display the equivalence notice (text defined in Conditions section above).

### EC-AC-04: No Surviving Spouse, All Exclusive Property

Net taxable estate computation is straightforward (no conjugal property split). Surviving spouse share = ₱0. The amnesty computation proceeds normally with full net estate as the amnesty base.

### EC-AC-05: Surviving Spouse Is Alive, CPG Regime, Pre-2018 Death

```
Gross conjugal estate:         ₱6,000,000
Conjugal liabilities:            -₱600,000
Funeral expenses (deduction):    -₱250,000
Standard deduction:            -₱1,000,000
Net Estate:                     ₱4,150,000

Surviving Spouse Share (CPG):
  Net conjugal: ₱6,000,000 - ₱600,000 = ₱5,400,000
  50%:                                  ₱2,700,000

Net Taxable Estate: ₱4,150,000 - ₱2,700,000 = ₱1,450,000

Amnesty Tax: ₱1,450,000 × 0.06 = ₱87,000
Minimum: N/A (₱87,000 > ₱5,000)
```

### EC-AC-06: NRA Amnesty — Proportional Deductions Required

NRA decedent died in 2014. Philippine gross estate: ₱5,000,000. Worldwide gross estate: ₱20,000,000. Claims against estate (all loans): ₱2,000,000.

```
Proportional factor = ₱5,000,000 / ₱20,000,000 = 0.25

Proportional ELIT deductions:
  Claims against estate: ₱2,000,000 × 0.25 = ₱500,000

Standard deduction (NRA): ₱500,000 (not proportional — fixed)

Net Estate: ₱5,000,000 - ₱500,000 - ₱500,000 = ₱4,000,000
Surviving Spouse Share: (computed from PH situs share of conjugal property)
Net Taxable Estate: per computation

Amnesty Tax: Net Taxable × 0.06  (minimum ₱5,000)
```

### EC-AC-07: Track B — Prior Return Shows Zero Tax (Full Deductions)

Prior return was filed showing net estate = ₱0 (all deductions applied). Current computation also shows low net estate.
```
Net Taxable Estate (current): ₱500,000
Previously Declared Net Estate: ₱0 (prior return showed zero net estate)
Net Undeclared Estate: ₱500,000 - ₱0 = ₱500,000
Amnesty Tax: ₱500,000 × 0.06 = ₱30,000
```
The prior ₱0 declaration means the full current net taxable estate is "undeclared."

### EC-AC-08: Prior Return Never Paid (Track B vs. Track A Distinction)

A prior return was filed (Track B) but tax was never paid vs. no return ever filed (Track A). The track affects only the **base** used (undeclared portion vs. full net estate), not the rate or minimum. Track B with `previouslyDeclaredNetEstate = ₱0` is mathematically equivalent to Track A.

### EC-AC-09: Pre-2018 Death, Narrow Interpretation Toggled

User selects narrow interpretation (standard deduction + spouse share only):
```
Gross Estate:                    ₱6,000,000
Standard Deduction (pre-TRAIN): -₱1,000,000
Allowable Deductions (narrow):  -₱1,000,000  // No funeral, no claims, no family home, etc.
Net Estate:                      ₱5,000,000
Surviving Spouse Share (50% net conjugal): computed separately
Net Taxable Estate:              computed
Amnesty Tax:                     Net Taxable × 0.06
```
This produces a **higher** amnesty tax than the full-deduction-set path. Display warning.

### EC-AC-10: Amnesty Plus Vanishing Deduction

A pre-2018 death where property previously taxed (within 5 years) qualifies for vanishing deduction. The vanishing deduction IS available under the full-deduction-set interpretation of amnesty:
```
Gross Estate:                ₱5,000,000
Vanishing Deduction (80%):    -₱800,000  // 2-year window, 80%
Standard Deduction:          -₱1,000,000
Net Estate:                   ₱3,200,000
Amnesty Tax: ₱3,200,000 × 0.06 = ₱192,000
```

---

## Test Implications

| Test ID | Scenario | Expected amnesty_tax_due |
|---|---|---|
| T-AC-01 | Track A, pre-2018, simple estate, no spouse | 6% × net taxable estate (minimum check) |
| T-AC-02 | Track A, pre-2018, with funeral + judicial deductions, pre-TRAIN amounts | Full deduction set applied; lower tax than narrow interpretation |
| T-AC-03 | Track B, prior declared = 50% of current | 6% × 50% of net taxable (undeclared portion) |
| T-AC-04 | Track B, prior declared ≥ current estimate | amnestyTaxBase = 0; tax = ₱5,000 (minimum) |
| T-AC-05 | Deductions exceed gross estate | Net taxable = 0; tax = ₱5,000 (minimum) |
| T-AC-06 | Computed tax = ₱3,600 (below minimum) | Amnesty tax = ₱5,000; minimumApplied = true |
| T-AC-07 | TRAIN-era amnesty (death 2021) | Tax identical to regular TRAIN; equivalence notice displayed |
| T-AC-08 | Pre-2018, surviving spouse (CPG), amnesty | Spouse share computed first; amnesty on remaining net taxable |
| T-AC-09 | NRA amnesty death 2014 | Proportional deductions applied; ₱500K standard deduction |
| T-AC-10 | Pre-2018, narrow interpretation toggle | Higher tax than full-deduction-set; disclaimer displayed |
| T-AC-11 | Pre-2018, vanishing deduction qualifies | Vanishing deduction applied before amnesty rate |
| T-AC-12 | Example 1 from amnesty-provisions.md (₱6M estate, 2012) | Full deduction: ₱222,000; Narrow: ₱300,000 |

---

## Form 1801 vs. ETAR — Filing Guidance

| Regime | Filing Form | Available At |
|---|---|---|
| TRAIN-era (regular) | BIR Form 1801 (Jan 2018 revision) | BIR RDO |
| Pre-TRAIN (regular) | BIR Form 1801 (Jun 2006 revision) | BIR RDO |
| Estate Tax Amnesty | Estate Tax Amnesty Return (ETAR) + Acceptance Payment Form (APF) | BIR RDO |

**Engine output labeling**: When the amnesty path is selected, all output fields must be labeled as ETAR fields (not Form 1801 fields). The engine should include a notice:
> "This computation uses the Estate Tax Amnesty path under RA 11213 (as amended by RA 11956). The filing form is the Estate Tax Amnesty Return (ETAR), not BIR Form 1801. **The amnesty filing window closed on June 14, 2025.** This computation is for historical reference only; availment of the amnesty is no longer possible without a new legislative extension."

---

## Relationship to Other Aspects

- **amnesty-eligibility.md**: Provides the `eligible`, `track`, and `deductionRules` inputs consumed by this computation. Must run before this step.
- **amnesty-vs-regular.md** (next): Defines the decision logic for choosing between amnesty path vs. regular pre-TRAIN graduated computation, including user guidance on when each is beneficial.
- **deductions-pre-train-diffs.md**: Documents pre-TRAIN-only deductions (funeral, judicial/admin) that apply to pre-2018 amnesty estates. The `getOrdinaryDeductionItems` branching logic in that file needs correction to include funeral/judicial for the amnesty path when `deductionRules == "PRE_TRAIN"`.
- **surviving-spouse-share.md**: Surviving spouse share formula is identical across TRAIN, pre-TRAIN, and amnesty regimes.
- **nonresident-deductions.md**: Proportional deduction formula (Sec. 86B) applies to NRA amnesty estates in the same way as for regular NRA estates.
- **regime-detection.md** (Wave 5): Incorporates amnesty computation path into the master regime selector and computation pipeline.
- **computation-pipeline.md** (Wave 5): Must include the full amnesty computation as a third computation path alongside TRAIN and pre-TRAIN.

---

## Summary

The amnesty tax computation has four key structural differences from regular estate tax:

1. **Rate**: Flat 6% (like TRAIN) — but applied to a potentially different base than regular TRAIN (for pre-2018 deaths with pre-TRAIN deduction rules).
2. **Two tracks**: Track A (full net taxable estate) for estates with no prior return; Track B (net undeclared estate) for estates with a prior but incomplete return.
3. **Minimum**: ₱5,000 floor applies always — unique to amnesty (pre-TRAIN regular has no minimum).
4. **Deduction scope ambiguity**: The law says "deductions at time of death" (full set); some BIR guidance says standard + spouse only (narrow). Engine implements full set as primary with narrow as an optional override.

The deduction rules within amnesty track the time-of-death rules exactly: pre-2018 deaths use pre-TRAIN deduction amounts (₱1M standard, ₱1M family home cap, funeral and judicial expenses allowed); 2018–2022 deaths use TRAIN deduction amounts. For 2018–2022 deaths, the amnesty and regular TRAIN computations produce identical base tax results; the amnesty benefit was penalty and interest waiver only.
