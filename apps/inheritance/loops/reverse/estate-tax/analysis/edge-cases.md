# Edge Cases Catalog — Philippine Estate Tax Engine

**Aspect**: edge-cases
**Wave**: 5 (Synthesis)
**Date**: 2026-02-25
**Sources**: All Wave 1–4 analysis files (34 aspects)

---

## Overview

This catalog compiles every edge case discovered across all analysis files, organized by functional area. Each entry includes a unique code, description, expected engine behavior, and a legal citation or cross-reference.

**Purpose**: This is the definitive edge-case reference for the spec-draft and spec-review aspects. Every item here must be represented in the final software specification — either as a validation rule, a pseudocode branch, or a test case.

**Total edge cases cataloged**: 182

---

## Category Index

| Category | Code Prefix | Count |
|----------|------------|-------|
| [1. Regime Detection & Boundary Dates](#1-regime-detection--boundary-dates) | EC-RD | 12 |
| [2. Gross Estate — Citizens & Residents](#2-gross-estate--citizens--residents) | EC-GEC | 10 |
| [3. Gross Estate — Non-Resident Aliens](#3-gross-estate--non-resident-aliens) | EC-GEN | 10 |
| [4. Special Gross Estate Inclusions (Sec. 85(B)-(G))](#4-special-gross-estate-inclusions-sec-85b-g) | EC-INC | 12 |
| [5. Sec. 87 Pre-Computation Exclusions](#5-sec-87-pre-computation-exclusions) | EC-EX | 12 |
| [6. ELIT Ordinary Deductions (5A-5D)](#6-elit-ordinary-deductions-5a-5d) | EC-EL | 12 |
| [7. Vanishing Deduction (Schedule 5E)](#7-vanishing-deduction-schedule-5e) | EC-VD | 12 |
| [8. Transfers for Public Use (Schedule 5F)](#8-transfers-for-public-use-schedule-5f) | EC-PT | 10 |
| [9. Pre-TRAIN-Only Deductions: Funeral & Judicial/Admin](#9-pre-train-only-deductions-funeral--judicialadmin) | EC-FJ | 12 |
| [10. Standard Deduction (Item 37A)](#10-standard-deduction-item-37a) | EC-SD | 10 |
| [11. Family Home Deduction (Item 37B)](#11-family-home-deduction-item-37b) | EC-FH | 13 |
| [12. Medical Expenses (Item 37C)](#12-medical-expenses-item-37c) | EC-ME | 11 |
| [13. RA 4917 Benefits (Item 37D)](#13-ra-4917-benefits-item-37d) | EC-RA | 9 |
| [14. Property Regime Classification](#14-property-regime-classification) | EC-PR | 12 |
| [15. Surviving Spouse Share (Item 39)](#15-surviving-spouse-share-item-39) | EC-SS | 12 |
| [16. NRA Proportional Deductions (Sec. 86(B))](#16-nra-proportional-deductions-sec-86b) | EC-NRA | 11 |
| [17. Tax Rate Application](#17-tax-rate-application) | EC-TR | 12 |
| [18. Foreign Tax Credits (Item 43)](#18-foreign-tax-credits-item-43) | EC-FC | 10 |
| [19. Amnesty — Eligibility](#19-amnesty--eligibility) | EC-AE | 12 |
| [20. Amnesty — Computation](#20-amnesty--computation) | EC-AC | 10 |
| [21. Amnesty vs. Regular Comparison](#21-amnesty-vs-regular-comparison) | EC-AVR | 8 |
| [22. Filing & Administrative Rules](#22-filing--administrative-rules) | EC-FR | 10 |
| [23. Pipeline-Level Edge Cases](#23-pipeline-level-edge-cases) | EC-PL | 8 |

---

## 1. Regime Detection & Boundary Dates

**Legal basis**: RA 10963 Sec. 4 (TRAIN effective date); RA 11213 Sec. 4 (amnesty coverage); RA 11569 (extension); RA 11956 (expanded coverage cutoff May 31, 2022)
**Cross-reference**: `analysis/regime-detection.md`

---

**EC-RD-01: Date of death exactly Jan 1, 2018 (TRAIN boundary)**
Death on January 1, 2018 falls under TRAIN. The comparison is `>=` (not `>`).
```
dateOfDeath = 2018-01-01 → regime = "TRAIN", deductionRules = "TRAIN"
```

---

**EC-RD-02: Date of death Dec 31, 2017 (last pre-TRAIN day)**
One day before TRAIN effective date → graduated rate schedule applies.
```
dateOfDeath = 2017-12-31 → regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
```

---

**EC-RD-03: Date of death May 31, 2022 (last day of amnesty coverage)**
The AMNESTY_COVERAGE_CUTOFF is inclusive: `dateOfDeath <= 2022-05-31` qualifies.
```
dateOfDeath = 2022-05-31, userElectsAmnesty = true, eligible = true
→ regime = "AMNESTY", deductionRules = "TRAIN"
```

---

**EC-RD-04: Date of death June 1, 2022 (one day after amnesty cutoff)**
Engine must reject amnesty election and apply TRAIN.
```
dateOfDeath = 2022-06-01, userElectsAmnesty = true
→ regime = "TRAIN", deductionRules = "TRAIN"
// Warning: "Estate tax amnesty is not available for decedents who died after May 31, 2022."
```

---

**EC-RD-05: Pre-2018 death, amnesty elected, PCGG estate**
PCGG exclusion is a hard stop; engine forces pre-TRAIN computation.
```
dateOfDeath = 2010-06-15, userElectsAmnesty = true, decedent.subjectToPCGGJurisdiction = true
→ regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
// Warning: "This estate does not qualify for the estate tax amnesty: PCGG jurisdiction."
```

---

**EC-RD-06: Pre-2018 death, tax already paid in full**
Amnesty is for unpaid/unsettled estate taxes only. Engine denies election.
```
dateOfDeath = 2015-03-10, estate.taxFullyPaidBeforeMay2022 = true, userElectsAmnesty = true
→ regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
// Reason: TAX_ALREADY_PAID
```

---

**EC-RD-07: Pre-2018 death, prior return filed, Track B**
Prior return → Track B. Engine computes dual-path comparison.
```
dateOfDeath = 2013-08-20, estate.priorReturnFiled = true, userElectsAmnesty = true
→ regime = "AMNESTY", deductionRules = "PRE_TRAIN", track = "TRACK_B", displayDualPath = true
```

---

**EC-RD-08: TRAIN-era death (2018–2022), user does NOT elect amnesty**
Engine applies TRAIN and informs user amnesty may have been available.
```
dateOfDeath = 2020-09-15, userElectsAmnesty = false
→ regime = "TRAIN", deductionRules = "TRAIN"
// Info: "Decedent died between Jan 1, 2018 and May 31, 2022 — amnesty may have been available..."
```

---

**EC-RD-09: Pre-2018 death, court case filed before RA 11213 enactment (Feb 14, 2019)**
A pending court case pre-dating RA 11213 excludes the estate from amnesty.
```
dateOfDeath = 2012-04-10, userElectsAmnesty = true, estate.hasPendingCourtCasePreAmnestyAct = true
→ regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
// Reason: PENDING_COURT_CASE_EXCLUSION
```

---

**EC-RD-10: NRA decedent — regime detection unchanged**
NRA status does NOT affect regime selection. Regime is determined solely by date of death.
```
decedent.isNonResidentAlien = true, dateOfDeath = 2019-05-01
→ regime = "TRAIN", deductionRules = "TRAIN"
```

---

**EC-RD-11: Multiple decedents (married couple, both died pre-2018)**
Each decedent's estate is a separate engine invocation. Do not combine.
```
// Two calls: detectRegime(decedent1) and detectRegime(decedent2) — independent.
```

---

**EC-RD-12: Pre-2018 death, NTE likely below crossover (₱1,250,000)**
When user does not elect amnesty but estate qualifies, engine proactively suggests it.
```
dateOfDeath = 2016-05-01, userElectsAmnesty = false, taxFullyPaid = false
→ regime = "PRE_TRAIN", deductionRules = "PRE_TRAIN"
// Suggestion: "If estate has unpaid estate tax, amnesty may have been available. Run dual-path comparison?"
```

---

## 2. Gross Estate — Citizens & Residents

**Legal basis**: NIRC Sec. 85(A) (worldwide scope); Sec. 88 (valuation)
**Cross-reference**: `analysis/gross-estate-citizens.md`

---

**EC-GEC-01: Foreign property with no FMV provided**
Engine rejects the input for that asset — does not assume or estimate.
```
// Engine: ValidationError("FMV required for every declared asset")
```

---

**EC-GEC-02: Foreign real property**
Two-column PH valuation rule (max of zonal vs. assessed) applies only to PH real property. For foreign real property, user provides a single FMV; engine accepts as-is.

---

**EC-GEC-03: Accounts receivable deemed uncollectible**
The receivable MUST appear in Schedule 2 (gross estate) AND the uncollectible portion deducted in Schedule 5B. Net effect = zero, but BOTH entries are required. Engine must cross-reference: if Schedule 5B entry has no corresponding gross estate entry, reject.

---

**EC-GEC-04: Shares of stock — no trade on date of death**
Use average of highest and lowest quoted selling price on the nearest date before/after death that had sales. User provides this computed FMV as input; engine does not fetch market data.

---

**EC-GEC-05: Business interest with negative net equity**
Net equity < 0 → report as ₱0. Do NOT reduce other gross estate items. Do NOT carry a negative number into Item 33.
```
businessNetEquity = -₱500,000 → Item33 contribution = ₱0
```

---

**EC-GEC-06: Multiple properties tagged as family home**
Only one property may have `isDesignatedFamilyHome = true`. Engine validates and rejects if multiple.
```
// ValidationError("Only one property may be designated as the family home.")
```

---

**EC-GEC-07: No surviving spouse (single or widowed decedent)**
All assets are Column A (exclusive). Item 34.B = 0. Item 39 = 0. Engine must not require conjugal property entries.

---

**EC-GEC-08: Property co-owned with third parties (not spouse)**
Only decedent's proportionate interest included. User provides FMV of decedent's share; engine does not compute fractional interests.

---

**EC-GEC-09: User attempts to enter funeral or judicial expenses (TRAIN-era)**
TRAIN removes these deductions entirely. Engine displays an explicit warning and zeroes them out — does NOT silently ignore.
```
// Warning: "Funeral/judicial expenses are not deductible under TRAIN Law (RA 10963)."
// deductions.funeralExpenses = 0; deductions.judicialAdminExpenses = 0
```

---

**EC-GEC-10: Usufruct rights in gross estate**
Value of usufruct included per Sec. 88(A) actuarial value. User provides pre-computed FMV; engine does not perform actuarial calculation. (Contrast with Sec. 87(a) personal usufruct that terminates at death — excluded, not included.)

---

## 3. Gross Estate — Non-Resident Aliens

**Legal basis**: NIRC Sec. 85(B) (PH-situs only); Sec. 104 (reciprocity); Sec. 86(B) (proportional deductions)
**Cross-reference**: `analysis/gross-estate-nonresident.md`

---

**EC-GEN-01: NRA with only intangible PH property, reciprocity applies**
Entire gross estate = 0 after reciprocity exclusion. Tax due = 0. Engine must handle zero gross estate gracefully.

---

**EC-GEN-02: Reciprocity exemption is user-declared, not verified**
Engine trusts `reciprocityExemptionApplies = true`. Display warning: "You have declared reciprocity exemption applies. Verify that [country] does not impose death/transfer tax on Philippine intangible property of Filipino non-residents."

---

**EC-GEN-03: NRA married to Filipino citizen under ACP or CPG**
Conjugal PH-situs property enters Column B. Same ACP/CPG classification rules apply. Surviving spouse share formula applies to PH-situs community property only.

---

**EC-GEN-04: NRA with life insurance proceeds from PH insurer**
Proceeds are PH-situs intangibles. Subject to reciprocity rule. If irrevocably designated beneficiary → excluded regardless of reciprocity.

---

**EC-GEN-05: NRA holding shares of a PH corporation**
PH-situs intangible personal property. Subject to reciprocity rule. If reciprocity applies → exclude. If no reciprocity → include in Item 31.

---

**EC-GEN-06: NRA owning PH real property**
PH real property is always PH-situs regardless of reciprocity. Reciprocity applies only to intangible personal property, not real or tangible assets.

---

**EC-GEN-07: Worldwide estate input is zero or missing**
If NRA has any ELIT deductions but `totalWorldwideGrossEstate = 0`, engine raises ValidationError — division by zero in proportional formula.
```
// if isNonResidentAlien AND hasAnyELIT AND totalWorldwideGrossEstate == 0:
//   ValidationError("Worldwide gross estate required for NRA proportional deduction formula.")
```

---

**EC-GEN-08: PH gross estate exceeds declared worldwide gross estate**
Data entry error. Engine validates: `Item34.C <= decedent.totalWorldwideGrossEstate`. If violated, raise error.

---

**EC-GEN-09: NRA family home**
Item 30 = 0 always for NRAs. Family home deduction is available only to citizens and resident aliens. No Schedule 1A entry for NRAs.

---

**EC-GEN-10: NRA with no PH-situs property at all**
Engine computes gross estate = 0, all deductions = 0, tax = 0. Valid configuration; filing may still be required if estate includes registrable property.

---

## 4. Special Gross Estate Inclusions (Sec. 85(B)-(G))

**Legal basis**: NIRC Sec. 85(B) contemplation of death; 85(C) revocable transfers; 85(D) general powers of appointment; 85(E) life insurance; 85(G) insufficient consideration
**Cross-reference**: `analysis/gross-estate-inclusions.md`

---

**EC-INC-01: Transfer within 3 years, full adequate consideration**
NOT included under Sec. 85(B). However, check Sec. 85(G): if `fmvAtDeath > considerationReceived`, the excess is taxable under 85(G).

---

**EC-INC-02: Life insurance payable to estate via will (no named beneficiary)**
Treated same as "payable to estate" — included under Sec. 85(E).

---

**EC-INC-03: Multiple life insurance policies — mixed irrevocable/revocable**
Each policy is independent. Only policies with estate or revocable beneficiary designation are included. Irrevocable policies are excluded. No netting between policies.

---

**EC-INC-04: General Power of Appointment held but never exercised**
Excluded — Sec. 85(D) requires the GPA to have been exercised by will OR by deed within 3 years of death.

---

**EC-INC-05: Special (limited) power of appointment**
NOT a general power of appointment. Excluded from Sec. 85(D) inclusion.

---

**EC-INC-06: Property transferred for nominal consideration (₱1 on ₱5M property)**
Apply Sec. 85(B) (contemplation of death) if within 3 years — full FMV at death is included. Do NOT apply Sec. 85(G) when 85(B) already applies.

---

**EC-INC-07: Revocable transfer — power relinquished more than 3 years before death**
Power relinquished >3 years prior breaks the chain. NOT included under Sec. 85(C).

---

**EC-INC-08: Policy on decedent's life, decedent is NOT the owner**
Sec. 85(E) applies to policies "on the life of the decedent." What matters is the insured, not the owner. Beneficiary designation controls inclusion.

---

**EC-INC-09: Contemplation-of-death transfer — property no longer exists at death**
`fmvAtDeath = 0`. Taxable amount = 0. No inclusion. Engine requires user to input fmvAtDeath; if 0, excludes automatically.

---

**EC-INC-10: Revocable living trust — power to revoke retained at death**
Included under Sec. 85(C). If power formally relinquished within 3 years, also included under Sec. 85(C) clock-restart rule.

---

**EC-INC-11: Transfer within 3 years — property value declined to zero**
`taxableAmount = max(0, fmvAtDeath − consideration) = 0`. Not included. No negative values.

---

**EC-INC-12: NRA decedent — life insurance on own life, proceeds cover PH-situs assets**
If the property covered is PH-situated, proceeds are PH-sourced → included in NRA gross estate. Subject to reciprocity rule (intangible personal property).

---

## 5. Sec. 87 Pre-Computation Exclusions

**Legal basis**: NIRC Sec. 87(a)–(d); regime-invariant (not amended by TRAIN)
**Cross-reference**: `analysis/exemptions.md`

---

**EC-EX-01: Partial charitable bequest to qualifying institution**
Decedent bequeaths 40% of land to a Sec. 87(d)-qualifying charity, 60% to heirs. Only 40% excluded from gross estate. Engine must support `percentageAllocatedToCharity` per asset.

---

**EC-EX-02: Mixed beneficiary — qualifying and non-qualifying charity**
Bequest split between Sec. 87(d) institution (excluded) and institution that does not qualify (enters gross estate, no deduction available). Engine processes each beneficiary independently.

---

**EC-EX-03: Fixed-term usufruct (not personal)**
A usufruct set for a 10-year term does NOT terminate at death of the usufructuary — it continues. Include in gross estate at actuarial value. Sec. 87(a) does NOT apply.

---

**EC-EX-04: Decedent is naked owner (not the usufructuary)**
Include naked ownership value (full FMV minus actuarial value of usufruct). Sec. 87(a) does not apply to the naked owner's estate.

---

**EC-EX-05: 30% administration condition — user asserts compliance**
Engine cannot verify the 30% admin cap. Display warning: "The 30% administration expense condition is your responsibility to verify." Accept user assertion.

---

**EC-EX-06: Fiduciary property commingled with personal assets**
Only the identifiable fideicommissary property is excluded. Engine must allow per-asset flagging of fideicommissary status.

---

**EC-EX-07: GOCC as charitable institution vs. Sec. 86(A)(3) recipient**
A pure government entity transfer uses Sec. 86(A)(3) as a deduction (included in GE, then deducted). Sec. 87(d) is for private institutions. Engine requires user to specify which provision and warns if ambiguous.

---

**EC-EX-08: Sec. 87(d) institution later loses non-profit status**
Exemption is assessed at time of death/transfer. Subsequent loss of status does not retroactively eliminate the estate tax exemption.

---

**EC-EX-09: NRA decedent bequeaths PH-situs property to qualifying PH charity**
Sec. 87(d) applies. Property excluded from NRA's PH gross estate. No geographic restriction in Sec. 87 text.

---

**EC-EX-10: Amnesty — fiduciary property**
Under amnesty, fiduciary property held by decedent should be excluded from the amnesty net estate. Amnesty applies to the decedent's own estate; fiduciary property is not the decedent's.

---

**EC-EX-11: Charitable bequest to foreign institution**
A bequest to a foreign charitable institution does NOT qualify for Sec. 87(d) exemption. The provision applies to PH-registered institutions only. Transfer remains in gross estate; no deduction available.

---

**EC-EX-12: Personal usufruct merger vs. usufruct termination confusion**
If user marks a personal usufruct right that terminates at death as an asset, engine applies Sec. 87(a) and excludes it. Display notification: "Personal usufruct right excluded from gross estate under Sec. 87(a) — terminated at death."

---

## 6. ELIT Ordinary Deductions (5A-5D)

**Legal basis**: NIRC Sec. 86(A)(1); TRAIN removed funeral and judicial/admin from ELIT
**Cross-reference**: `analysis/deduction-elit.md`

---

**EC-EL-01: Funeral expenses entered for TRAIN-era estate**
Engine rejects with explicit error, does NOT silently ignore.
```
// Error: "Funeral expenses are not deductible for deaths on or after January 1, 2018 (TRAIN Law)."
// deductions.funeralExpenses = 0
```

---

**EC-EL-02: Judicial/admin expenses entered for TRAIN-era estate**
Same handling as EC-EL-01.
```
// Error: "Judicial and administrative expenses are not deductible under TRAIN."
// deductions.judicialAdminExpenses = 0
```

---

**EC-EL-03: Claim against estate incurred after date of death**
Does NOT qualify under Sec. 86(A)(1)(a). Engine validates: `claim.existedAtDateOfDeath = true`.

---

**EC-EL-04: Insolvent person claim not in gross estate**
If the receivable is not in Schedule 2, the deduction is disallowed. Engine cross-references Sched 5B entries against Sched 2 entries.

---

**EC-EL-05: Mortgage on conjugal property — column placement**
Full outstanding mortgage balance enters Schedule 5C Column B (conjugal). The 50/50 split happens in Schedule 6A (surviving spouse share worksheet), NOT at Schedule 5C. Do not halve at 5C.

---

**EC-EL-06: Casualty loss partially covered by insurance**
Deductible = gross loss − insurance proceeds received or receivable.
```
// Example: ₱500K loss, ₱300K insurance → deductible = ₱200K
```

---

**EC-EL-07: Estate tax itself listed as an unpaid tax**
Estate tax cannot be deducted from itself. Engine explicitly excludes estate tax from Schedule 5C (unpaid taxes).

---

**EC-EL-08: Real property tax (RPT) for year of death**
RPT for the calendar year of death is deductible if accrued and unpaid at time of death.

---

**EC-EL-09: Final income tax for decedent's last year**
Estimated income tax payable for decedent's final period (accrued, not yet paid) is deductible as an unpaid tax in Schedule 5C.

---

**EC-EL-10: Zero ELIT deductions (simple estate)**
All ELIT fields may be zero. Item 35 = 0. Engine must not require at least one ELIT entry.

---

**EC-EL-11: ELIT deductions exceed gross estate in one column**
Per-column floor: `Item36.A = max(0, Item34.A − Item35.A)`, `Item36.B = max(0, Item34.B − Item35.B)`. Excess deductions in one column cannot shift to the other column — they are simply lost.
```
// Example: Item34.A = 0, Item35.A = ₱2M → Item36.A = 0 (₱2M lost)
// Item36.C = Item36.A + Item36.B ≠ Item34.C − Item35.C in this scenario.
```

---

**EC-EL-12: Claim vs. insolvent person — partially collectible**
Only the uncollectible portion is deductible. Engine takes `claim.uncollectibleAmount` as user input.
```
// Example: ₱1M owed, ₱300K recoverable → deduction = ₱700K
```

---

## 7. Vanishing Deduction (Schedule 5E)

**Legal basis**: NIRC Sec. 86(A)(2); percentage table: 100/80/60/40/20% per year; 0% after 5 years
**Cross-reference**: `analysis/deduction-vanishing.md`

---

**EC-VD-01: Prior property appreciated in value**
Use the LOWER of prior FMV or current FMV as the Initial Value (IV).
```
// priorFMV = ₱3M, currentFMV = ₱5M → IV = ₱3M
```

---

**EC-VD-02: Prior property depreciated in value**
Current FMV is lower → IV = currentFMV. Deduction cannot exceed current estate value.
```
// priorFMV = ₱5M, currentFMV = ₱2M → IV = ₱2M
```

---

**EC-VD-03: Prior estate/donor's tax was NOT paid**
Property is disqualified entirely from vanishing deduction. Do not apply formula.
```
// if NOT property.priorTaxWasPaid: skip; vanishingDeduction = 0
```

---

**EC-VD-04: Mortgage exceeds initial value**
Net Value (NV) = IV − mortgage. If `mortgage > IV`, NV < 0 → floor at 0. VD = 0.

---

**EC-VD-05: ELIT exceeds gross estate (ratio becomes negative)**
`ratio = (GE − ELIT_total) / GE`. If ELIT > GE, ratio < 0 → floor at 0. VD = 0. The ELIT has absorbed the entire estate.

---

**EC-VD-06: Property received by gift (donor's tax paid)**
Prior FMV = FMV at gift date as declared in donor's tax return. Prior transfer date = donation date. Same 5-step formula applies. Prior tax = donor's tax (not estate tax).

---

**EC-VD-07: Conjugal property previously taxed**
If inherited during marriage and classified as community (Column B), current FMV = FULL conjugal FMV (not halved). VD enters Column B.

---

**EC-VD-08: Property transferred more than once in 5-year window**
Only the MOST RECENT prior transfer is relevant. Elapsed time = from the prior decedent's death to the current decedent's death.

---

**EC-VD-09: Property partly sold before current decedent's death**
Only the remaining portion qualifies. User provides current FMV of the remaining part.

---

**EC-VD-10: Multiple previously-taxed properties with different elapsed time**
Compute each property's VD separately (different percentages). Sum into Schedule 5E Columns A/B. The `ELIT_total` used in the ratio is the shared aggregate — not per-property.

---

**EC-VD-11: NRA — reciprocity exclusion interaction with VD**
If an intangible property is excluded from gross estate under reciprocity, that property cannot be claimed for vanishing deduction (it is not in the gross estate).

---

**EC-VD-12: Vanishing deduction under amnesty path**
VD IS available under the amnesty path. This corrects an outdated note in `analysis/deduction-vanishing.md`. Per RA 11213 Sec. 3, the amnesty net estate uses "allowable deductions under the NIRC at time of death," which includes Sec. 86(A)(2) vanishing deduction.
**Source**: `analysis/amnesty-computation.md` (EC-AC-10), `analysis/correction-amnesty-deductions.md`, `analysis/test-vectors.md` (TV-09).

---

## 8. Transfers for Public Use (Schedule 5F)

**Legal basis**: NIRC Sec. 86(A)(3) [citizens/residents]; Sec. 86(B)(2)+(4) [NRAs — proportional]
**Cross-reference**: `analysis/deduction-public-transfers.md`, `analysis/correction-nra-public-transfers.md`

---

**EC-PT-01: GOCC recipient**
Cannot be auto-resolved. Engine sets `requiresManualReview = true`. User is warned that BIR has final authority on whether the GOCC qualifies as a government entity for Sec. 86(A)(3).

---

**EC-PT-02: State university (e.g., University of the Philippines)**
Likely qualifies if `recipientIsPhGovernmentOrPoliticalSubdivision = true`. User confirms.

---

**EC-PT-03: Foreign government recipient**
Does NOT qualify for Sec. 86(A)(3). Property remains in taxable estate with no deduction.

---

**EC-PT-04: Full estate bequeathed to PH government**
Deduction = full FMV. Gross estate = ₱X, deductions = ₱X, net estate = 0, tax = 0. No minimum tax for TRAIN/pre-TRAIN (amnesty has ₱5,000 minimum).

---

**EC-PT-05: Amnesty filer — public use transfer**
⚠ NOT available under amnesty. Amnesty deductions are restricted to standard deduction and surviving spouse share under the narrow interpretation toggle, and to the full NIRC deduction set under the primary interpretation — but Sec. 86(A)(3) IS included in the full deduction set. Check amnesty-computation.md: EC-7 in that file noted this as NOT available, but per RA 11213 Sec. 3 ("allowable deductions under the NIRC"), transfers for public use ARE deductible under the primary interpretation. Engine behavior: under primary interpretation, allow; under narrow interpretation (toggle), disallow. Display disclaimer.

---

**EC-PT-06: Conjugal property bequeathed to PH government**
Full value enters Schedule 5F Column B (conjugal). No halving at Schedule 5F. The surviving spouse's share is computed from the remaining conjugal pool (after this deduction reduces it).

---

**EC-PT-07: Partial interest transferred to government**
User specifies `percentageInterestTransferred`. Deduction = FMV × percentage.
```
// 50% interest in ₱4M property → deduction = ₱2M
```

---

**EC-PT-08: NRA bequeathing PH property to PH government — PROPORTIONAL**
⚠ Critical correction: NRA deduction is PROPORTIONAL, not full-value. Sec. 86(B)(2) explicitly applies the proportional formula to "paragraphs (1) and (3)" of Sec. 86(A) — paragraph (3) = transfers for public use.
```
// NRA deduction = (PH_gross_estate / worldwide_gross_estate) × FMV_of_bequest
// Example: NRA bequeaths ₱1M; PH estate = ₱5M, worldwide = ₱20M → factor = 0.25 → deduction = ₱250K
```

---

**EC-PT-09: Government transfer vs. Sec. 87(d) charitable exemption — key distinction**
Sec. 86(A)(3) government transfers: property IS in gross estate, then deducted in Schedule 5F.
Sec. 87(d) charitable bequests: property is EXCLUDED from gross estate before schedules are populated.
These are mutually exclusive provisions. Engine must not apply both.

---

**EC-PT-10: Conditional bequest to government (reversion clause)**
Deduction claimed based on bequest as written. A conditional reversion does not disqualify the deduction at time of filing. Future reversion is a separate legal matter outside engine scope.

---

## 9. Pre-TRAIN-Only Deductions: Funeral & Judicial/Admin

**Legal basis**: Old NIRC Sec. 86(A)(1)(a) and (b) before TRAIN amendment; removed effective Jan 1, 2018
**Cross-reference**: `analysis/deductions-pre-train-diffs.md`, `analysis/correction-amnesty-deductions.md`

---

**EC-FJ-01: Gross estate = 0 at time of funeral limit computation**
`funeral_limit = 0.05 × 0 = 0`. Funeral deduction = 0 regardless of actual expenses.

---

**EC-FJ-02: Actual funeral expenses exceed 5% cap**
Large estate (₱20M gross): funeral limit = ₱1M. If actual = ₱2M, deduction = ₱1M. Excess ₱1M is lost.

---

**EC-FJ-03: Actual funeral expenses below 5% limit**
Small estate (₱2M gross): funeral limit = ₱100K. If actual = ₱50K, deduction = ₱50K (actual expenses bind).

---

**EC-FJ-04: Item 34 must be finalized BEFORE funeral limit computation**
Critical ordering dependency: the 5% limit uses total gross estate (Item 34.C). Engine must complete all gross estate schedules (Items 29–34) before computing the funeral deduction limit in Step 9.

---

**EC-FJ-05: Judicial expenses incurred after estate tax filing date**
Only expenses actually incurred up to the filing date are deductible. Future litigation costs cannot be deducted.

---

**EC-FJ-06: Extrajudicial settlement — zero judicial expenses**
Valid configuration. `judicialAdminExpenses = 0`. Engine must not require judicial expenses for pre-TRAIN estates.

---

**EC-FJ-07: Funeral/judicial expenses under amnesty — pre-2018 deaths**
Per RA 11213 Sec. 3, "allowable deductions under the NIRC at time of death" applies. For pre-2018 deaths, funeral and judicial expenses ARE deductible under the primary (full-deduction) amnesty interpretation.
```
// getOrdinaryDeductionItems(regime="AMNESTY", deductionRules="PRE_TRAIN")
//   → returns common + ["funeralExpenses", "judicialAdminExpenses"]
```
**Source**: `analysis/correction-amnesty-deductions.md`

---

**EC-FJ-08: Funeral/judicial expenses under amnesty — TRAIN-era deaths (2018–2022)**
TRAIN removed funeral and judicial expenses. For TRAIN-era amnesty deaths (`deductionRules = "TRAIN"`), these are NOT deductible even under amnesty.
```
// getOrdinaryDeductionItems(regime="AMNESTY", deductionRules="TRAIN")
//   → returns common (no funeral, no judicial)
```

---

**EC-FJ-09: Pre-TRAIN NRA — funeral and judicial expenses proportional**
For pre-TRAIN NRA decedents, funeral and judicial/admin expenses are subject to the Sec. 86(B) proportional formula. The worldwide ELIT input object must include `worldwideFuneralExpenses` and `worldwideJudicialExpenses` fields.

---

**EC-FJ-10: Funeral expenses in community pool for surviving spouse share**
Under pre-TRAIN, funeral expenses in Column B reduce the conjugal community pool for surviving spouse share purposes. This is treated as a community obligation alongside ELIT items 5A-5D.
⚠ Ambiguity: some commentary excludes funeral from the community obligations. Engine should default to INCLUDE funeral/judicial Column B amounts in the community pool reduction, and flag this as a professional-review point.

---

**EC-FJ-11: User enters funeral on TRAIN estate — warning required**
Engine must NOT silently drop. Display explicit warning + zero out the deduction.
```
// Warning: "Funeral expenses are not deductible under TRAIN Law..."
// deductions.funeralExpenses = 0
```

---

**EC-FJ-12: Pre-TRAIN large estate — both funeral and judicial expenses**
Both are separate line items (5G and 5H). Compute funeral cap first (needs Item 34.C), then add to ordinary deductions separately.
```
// Example: Actual funeral ₱300K, 5% of GE ₱250K → funeral deduction = ₱250K
// Judicial/admin: ₱150K (actual, no cap) → judicial deduction = ₱150K
// Total additional pre-TRAIN deductions: ₱400K
```

---

## 10. Standard Deduction (Item 37A)

**Legal basis**: NIRC Sec. 86(A)(4) [citizens/residents, TRAIN ₱5M]; Sec. 86(B)(1) [NRAs, ₱500K]; pre-TRAIN ₱1M for citizens/residents
**Cross-reference**: `analysis/deduction-standard.md`

---

**EC-SD-01: Standard deduction exceeds net estate (Item 36)**
`Item38 = max(0, Item36.C − Item37A) = 0`. Excess standard deduction is lost — cannot carry forward or offset other items.
```
// GE = ₱4M, no ELIT, Item36.C = ₱4M, standard = ₱5M → Item38 = 0, tax = 0
```

---

**EC-SD-02: NRA given ₱5M standard deduction (user error)**
Engine enforces ₱500K for NRAs. User cannot elect a higher amount.

---

**EC-SD-03: Resident alien (non-citizen PH resident)**
Uses citizen/resident rules. Standard deduction = ₱5M (TRAIN) or ₱1M (pre-TRAIN). NOT ₱500K. NRA classification applies only to non-citizens who are non-residents.

---

**EC-SD-04: Amnesty estate with TRAIN-era death (2018–2022)**
TRAIN standard deduction (₱5M) applies, not pre-TRAIN ₱1M. Engine branches on `deductionRules`, not regime.
```
// regime = "AMNESTY", deductionRules = "TRAIN" → standardDeduction = ₱5,000,000
```
**Source**: `analysis/correction-amnesty-deductions.md`

---

**EC-SD-05: Pre-TRAIN NRA**
Standard deduction = ₱500K. Identical across TRAIN and pre-TRAIN for NRAs — no change.

---

**EC-SD-06: Amended return — standard deduction cannot change**
The standard deduction is statute-fixed, not elected. Same amount on original and amended return.

---

**EC-SD-07: Multiple heirs**
Standard deduction applies to the estate as a whole, not per heir. Never multiply.

---

**EC-SD-08: Estate with zero gross estate**
GE = 0, all ordinary deductions = 0, Item36.C = 0, Item37A = applicable standard. `Item38 = max(0, 0 − standard) = 0`. Tax = 0. No error.

---

**EC-SD-09: Pre-TRAIN standard deduction zeros out small estate**
Pre-TRAIN: ₱1M standard deduction. If Item36.C = ₱800K, Item38 = max(0, ₱800K − ₱1M) = 0. Tax = 0. This is a common scenario for small pre-TRAIN estates.

---

**EC-SD-10: Conjugal vs. exclusive allocation of standard deduction**
Standard deduction is applied at the total level (no A/B column split). It subtracts from the running total after the A+B columns are summed. Engine does not allocate between Column A and Column B.

---

## 11. Family Home Deduction (Item 37B)

**Legal basis**: NIRC Sec. 86(A)(5); TRAIN cap ₱10M; pre-TRAIN cap ₱1M; NRAs ineligible
**Cross-reference**: `analysis/deduction-family-home.md`

---

**EC-FH-01: FMV exceeds TRAIN cap (exclusive property)**
```
// FMV = ₱15M exclusive → deduction = min(15M, 10M) = ₱10M
// Excess ₱5M remains in net estate subject to tax.
```

---

**EC-FH-02: FMV exceeds TRAIN cap (conjugal property)**
Applicable FMV = FMV × 0.5 (decedent's share). Then apply cap.
```
// FMV = ₱22M conjugal → applicable = ₱11M → deduction = min(₱11M, ₱10M) = ₱10M
```

---

**EC-FH-03: No barangay certification**
`hasCertificationFromBarangay = false` → deduction = 0. Item 30 still carries the FMV in gross estate. The house is taxable but not deductible.

---

**EC-FH-04: Property is rental/investment, not actual residence**
`isActualResidence = false` → deduction = 0. Engine relies on user input; does not verify.

---

**EC-FH-05: NRA decedent**
Item 30 = 0 always for NRAs. Family home deduction = 0. No Schedule 1A entry.

---

**EC-FH-06: Decedent died outside the family home**
Dying elsewhere does not disqualify the deduction. Deduction available if the property was the family residence at time of death.

---

**EC-FH-07: Family home destroyed before filing**
Property no longer exists but existed at death. FMV at death governs. Deduction available if conditions were met at date of death.

---

**EC-FH-08: Conjugal family home with outstanding mortgage**
Full FMV enters Schedule 1A. Mortgage deducted separately at Schedule 5C. Family home deduction is NOT reduced by the mortgage balance.

---

**EC-FH-09: Multiple properties tagged as family home**
Validation error. Engine rejects — only ONE family home permitted.

---

**EC-FH-10: Family home is exclusive property (Column A)**
Deduction = min(FMV, cap). Full FMV — no halving. Entire deduction in Column A logic.

---

**EC-FH-11: Co-ownership with non-spouse (e.g., sibling)**
Decedent's proportional share enters Schedule 1A. Deduction applies to that share (up to cap). Engine accepts `decedentOwnershipPercentage` field.

---

**EC-FH-12: Pre-TRAIN: cap at ₱1M, FMV = ₱800K exclusive**
```
// deduction = min(₱800K, ₱1M) = ₱800K (cap not reached, full FMV deductible)
```

---

**EC-FH-13: Legal ambiguity — conjugal family home halving**
Some BIR sample computations show full FMV (not halved) for conjugal family home deduction. NIRC text says decedent's share. Engine implements NIRC text (½ FMV for conjugal), but flags the ambiguity with a disclaimer and recommends user verify against BIR RR 12-2018.

---

## 12. Medical Expenses (Item 37C)

**Legal basis**: NIRC Sec. 86(A)(6); cap ₱500K; 1-year window; citizens/residents only
**Cross-reference**: `analysis/deduction-medical.md`

---

**EC-ME-01: Expenses exactly at 1-year boundary**
Window: `dateIncurred >= (dateOfDeath − 365 days)`. Date exactly 1 year before death = within window.
```
// Death June 15, 2022; expense June 15, 2021 → qualifies
// Expense June 14, 2021 → does NOT qualify (outside window)
```

---

**EC-ME-02: Expenses exceed ₱500K cap**
Deduction is hard-capped. Excess is lost — no carryforward.
```
// Total qualifying: ₱1.2M → deduction = ₱500K
```

---

**EC-ME-03: Medical expenses paid from conjugal funds**
Fund source does not affect amount. No A/B column split at Item 37C (special deduction applied at total level).

---

**EC-ME-04: Non-official receipts only**
Acknowledgment receipts, cash vouchers, and informal receipts do NOT qualify. Only BIR-registered official receipts.
```
// If all ₱600K supported only by non-official receipts → deduction = ₱0
```

---

**EC-ME-05: Terminal illness — expenses over 2-year period**
Only the final 1-year window is deductible. Pre-window expenses do not count.

---

**EC-ME-06: Post-death expenses (embalming, cremation, burial)**
These are outside the 1-year pre-death window. NOT medical expenses. Under pre-TRAIN: these would be funeral expenses. Under TRAIN: not deductible. Engine must not count post-death costs as medical.

---

**EC-ME-07: NRA decedent**
Medical expense special deduction is NOT available to NRAs.
```
// if isNonResidentAlien: deductions.medicalExpenses = 0
```

---

**EC-ME-08: Expenses in foreign currency**
Engine does not perform currency conversion. User provides PHP-equivalent converted amount.

---

**EC-ME-09: Duplicate receipt entries**
Same receipt number entered twice → engine flags as validation warning and deduplicates.

---

**EC-ME-10: Medical expenses also claimed as unpaid debt (Schedule 5A overlap)**
An unpaid medical bill may appear in both Schedule 5A (claim against estate) and Schedule 6C (medical expenses). Engine does NOT prevent this overlap but displays a warning: "Unpaid medical bill ₱X appears in both Schedule 5A and Schedule 6C. Verify with your tax adviser."

---

**EC-ME-11: Zero medical expenses**
Valid. Item 37C = 0. No minimum required.

---

## 13. RA 4917 Benefits (Item 37D)

**Legal basis**: NIRC Sec. 86(A)(7); requires BIR-approved Tax Qualified Plan from private employer
**Cross-reference**: `analysis/deduction-ra4917.md`

---

**EC-RA-01: Government employee (GSIS benefits)**
GSIS benefits are NOT under RA 4917. `ra4917_eligible = false`. No deduction and no corresponding gross estate inclusion under this schedule.

---

**EC-RA-02: Private employer without BIR-approved Tax Qualified Plan**
Deduction disallowed. `ra4917_eligible = false`.

---

**EC-RA-03: Multiple employers, multiple qualified plans**
Each qualifying benefit from each employer is separately deductible. Compute and add each independently.

---

**EC-RA-04: Benefit amount uncertain at filing**
Only amounts actually received or legally determinable at time of filing can be entered. Do not estimate.

---

**EC-RA-05: NRA decedent with PH private employer RA 4917 plan**
RA 4917 deduction is NOT available to NRAs. Include benefit in NRA gross estate (Schedule 2); zero out deduction.

---

**EC-RA-06: Benefit not included in gross estate**
Deduction requires corresponding gross estate entry. If user enters a deduction but no gross estate entry, raise a validation error.

---

**EC-RA-07: Accrued retirement benefit vs. death benefit**
If the heirs receive a benefit from the employer "as a consequence of the death," it qualifies as an RA 4917 death benefit regardless of whether the decedent had already met retirement age.

---

**EC-RA-08: RA 4917 under amnesty (pre-2018 death)**
Available. RA 4917 predates TRAIN; included in "allowable deductions under the NIRC at time of death" for amnesty purposes.

---

**EC-RA-09: Zero RA 4917 (no plan)**
`ra4917Benefits = 0`. No gross estate inclusion under this schedule. Item 37D = 0. Valid.

---

## 14. Property Regime Classification

**Legal basis**: Family Code Arts. 74–76 (separation), 88–104 (ACP), 143–146 (separation); Civil Code Arts. 142–185 (CPG)
**Cross-reference**: `analysis/property-regime-acp.md`, `analysis/property-regime-cpg.md`, `analysis/property-regime-separation.md`

---

**EC-PR-01: ACP — pre-marital property default is COMMUNITY**
Unlike CPG, under ACP pre-marital property is COMMUNITY (Column B) unless one of the three Art. 92 exclusions applies. Engine must prominently warn users of this non-intuitive rule.

---

**EC-PR-02: ACP — inherited property, no donor stipulation**
Property received by gratuitous title during marriage → Column A (exclusive). Default for inheritance under ACP.

---

**EC-PR-03: ACP — inherited property, donor stipulates community**
Donor's will explicitly says property is given as community property → Column B. Donor override is permitted under ACP (Art. 92(1) a contrario).

---

**EC-PR-04: ACP — jewelry is always community**
All jewelry → Column B (community) regardless of who wears it or how it was acquired.

---

**EC-PR-05: ACP — prior marriage children exception**
If decedent had legitimate children from a prior marriage: property acquired BEFORE the current marriage → Column A (exclusive). This prevents the prior-marriage children's inheritance from being absorbed into the community.

---

**EC-PR-06: CPG — pre-marital property is ALWAYS exclusive**
Under CPG, ALL pre-marital property → Column A (exclusive). No prior-marriage-children exception needed (unlike ACP).

---

**EC-PR-07: CPG — fruits and income of exclusive property are CONJUGAL**
This is the critical CPG-vs-ACP distinction. Under CPG, rental income, dividends, and any fruits/products of Column A property during marriage → Column B (conjugal). Under ACP, the opposite applies (fruits of exclusive = exclusive). Engine UI must prominently warn of this CPG rule.

---

**EC-PR-08: CPG — no donor override for lucrative-title property**
Unlike ACP, under CPG there is no donor-stipulation exception. Art. 148(2): lucrative title during marriage = exclusive, period. A donor cannot make inherited property conjugal under CPG.

---

**EC-PR-09: Business started before marriage under CPG**
Pre-marital business value → Column A (exclusive). BUT profits/fruits earned during the marriage → Column B (conjugal). Engine must allow per-item allocation within a business interest.

---

**EC-PR-10: Complete Separation of Property — requires valid prenuptial**
Column B = 0 throughout. Item 39 = 0. Engine must validate: if any asset is tagged community under SEPARATION regime, prompt user to correct.

---

**EC-PR-11: Legal separation ≠ separation of property regime**
A court decree of legal separation does NOT dissolve ACP or CPG. Conjugal partnership continues. Engine must warn if user selects SEPARATION regime when `maritalStatus = "legally_separated"`.

---

**EC-PR-12: Annulment / void marriage — not standard property regimes**
Art. 147–148 Family Code applies to void/voidable marriages (co-ownership rules). NOT ACP, CPG, or Separation. Engine should flag this as requiring professional legal review and should NOT apply standard property regime formulas.

---

## 15. Surviving Spouse Share (Item 39)

**Legal basis**: NIRC Sec. 86(A)(9)/(C); regime-invariant across TRAIN/pre-TRAIN/amnesty
**Cross-reference**: `analysis/surviving-spouse-share.md`

---

**EC-SS-01: No surviving spouse**
`surviving_spouse_share = 0`. Item 39 = 0. Valid; engine must not require conjugal property.

---

**EC-SS-02: Complete Separation of Property regime**
Column B = 0 → community pool = 0 → `surviving_spouse_share = 0`.

---

**EC-SS-03: Spouse share exceeds Item 38 (net estate after special deductions)**
```
// Item38 = ₱600K; Item39 = ₱7M (large conjugal estate, few obligations)
// Item40 = max(0, ₱600K − ₱7M) = ₱0. Tax = ₱0.
// Spouse share is NOT capped at Item38.
```

---

**EC-SS-04: Community obligations exceed community assets (insolvent conjugal)**
`net_community_property = max(0, Item34.B − community_obligations.B) = 0`.
`surviving_spouse_share = max(0, 0 × 0.50) = 0`.

---

**EC-SS-05: Vanishing deduction on conjugal property**
Vanishing deduction (Schedule 5E Column B) does NOT reduce the conjugal community pool for spouse share purposes. Only actual financial obligations (5A–5D, plus 5G/5H under pre-TRAIN) reduce the pool.
```
// surviving_spouse_share uses: Item34.B − (5A.B + 5B.B + 5C.B + 5D.B)
// NOT: Item34.B − Item35.B (which would include VD and public transfers)
```

---

**EC-SS-06: Family home is exclusive property**
Family home in Column A → excluded from community pool. Item 39 not affected by exclusive family home.

---

**EC-SS-07: NRA decedent with surviving spouse**
Same formula, but only PH-situs community property enters Column B. Spouse share computed from PH-situs conjugal pool only.

---

**EC-SS-08: Pre-TRAIN community obligations include funeral and judicial expenses**
Under pre-TRAIN, funeral (5G.B) and judicial/admin (5H.B) in Column B ARE included in community obligations for spouse share computation. This is the same treatment as ELIT items 5A–5D.B.
⚠ Ambiguity: some commentary excludes funeral. Engine defaults to INCLUDE and flags for professional review.

---

**EC-SS-09: Amnesty Track B — spouse share uses FULL estate**
Under Track B (prior return filed), the surviving spouse share is computed on the FULL net estate (gross estate minus all deductions), not just the undeclared portion. The amnesty tax base uses the net undeclared amount, but the spouse share is structural.

---

**EC-SS-10: All community property under CPG**
If decedent had no exclusive property (all assets are Column B), Column A throughout = 0. This is valid under CPG for a decedent who accumulated everything during the marriage.

---

**EC-SS-11: ACP marriage where title is only in decedent's name**
Title does not determine ACP ownership. Property acquired during marriage with no Art. 92 exclusion = community regardless of whose name appears on the title.

---

**EC-SS-12: Surviving spouse share in Formula**
```
// community_obligations.B = (5A.B + 5B.B + 5C.B + 5D.B)  [TRAIN]
// [pre-TRAIN additionally: + 5G.B + 5H.B]
// net_community = max(0, Item34.B − community_obligations.B)
// Item39 = net_community × 0.50
// Item40 = max(0, Item38 − Item39)
```

---

## 16. NRA Proportional Deductions (Sec. 86(B))

**Legal basis**: NIRC Sec. 86(B) — proportional formula for all ordinary deductions; Sec. 86(B)(2) — explicitly includes ELIT AND public transfers
**Cross-reference**: `analysis/nonresident-deductions.md`, `analysis/correction-nra-public-transfers.md`

---

**EC-NRA-01: Division by zero — worldwide gross estate = 0**
If `totalWorldwideGrossEstate = 0` but NRA has declared ELIT, raise ValidationError.
```
// ValidationError: "Worldwide gross estate required for NRA proportional deduction calculation."
```

---

**EC-NRA-02: PH gross estate > worldwide gross estate**
Data entry error. Engine validates and rejects.
```
// ValidationError: "Philippine gross estate cannot exceed total worldwide gross estate."
```

---

**EC-NRA-03: NRA with 100% PH estate**
`proportional_factor = PH/worldwide = 1.0`. Full worldwide ELIT is deductible. Still subject to ₱500K standard deduction (not ₱5M) and remains ineligible for family home, medical, and RA 4917 deductions.

---

**EC-NRA-04: All NRA debts relate to PH property — but deduction is still proportional**
Even if all debts are PH-related, the NIRC formula allocates proportionally. Full PH-related debt is not fully deductible; only the proportional share is. This is the statutory result.

---

**EC-NRA-05: Vanishing deduction — must use proportional ELIT in ratio**
For NRAs, the VD formula ratio uses proportional NRA ELIT (not worldwide ELIT).
```
// ratio = (Item34.C − proportional_NRA_ELIT) / Item34.C
// Order: compute proportional ELIT → then compute VD ratio.
```

---

**EC-NRA-06: NRA public transfers — proportional, not full-value**
⚠ Corrected: Sec. 86(B)(2) applies proportional formula to both ELIT and public transfers.
```
// NRA deduction = (PH_GE / worldwide_GE) × FMV_of_bequest
```
**Source**: `analysis/correction-nra-public-transfers.md`

---

**EC-NRA-07: Reciprocity exclusion reduces both GE and proportional ELIT**
If intangible assets are excluded under reciprocity, `Item34.C` decreases. The proportional factor `(Item34.C / totalWorldwideGrossEstate)` decreases accordingly. Lower PH GE → lower ELIT deduction. These effects are linked.

---

**EC-NRA-08: TRAIN removal of funeral/judicial expenses — applies to NRAs too**
Under TRAIN, funeral and judicial expenses are removed from ELIT entirely. NRAs cannot deduct them either, even proportionally.

---

**EC-NRA-09: NRA with no ELIT**
Simple case: no debts, no proportional deduction needed. Worldwide ELIT = 0, proportional ELIT = 0.

---

**EC-NRA-10: NRA married to Filipino under ACP/CPG with conjugal PH assets**
Proportional ELIT in Column B flows into the surviving spouse share computation. The property-regime classification rules (ACP/CPG/Separation) apply to PH-situs conjugal property.

---

**EC-NRA-11: NRA filing venue**
If no PH legal domicile, file at Revenue District Office No. 39, South Quezon City. Engine outputs this RDO code for NRAs in the filing guide section.

---

## 17. Tax Rate Application

**Legal basis**: NIRC Sec. 84 (TRAIN flat 6%); original Sec. 84 RA 8424 (graduated 0%–20%); RA 11213 Sec. 5 (amnesty 6% + ₱5K minimum)
**Cross-reference**: `analysis/tax-rate-train.md`, `analysis/tax-rate-pre-train.md`

---

**EC-TR-01: Zero net taxable estate (Item 40 = 0)**
`estate_tax_due = 0`. Under TRAIN and pre-TRAIN: no minimum tax. Under amnesty: ₱5,000 minimum applies even when Item 40 = 0.
```
// TRAIN/PRE_TRAIN: estateTaxDue = 0 (no minimum)
// AMNESTY: amnestyTaxDue = max(5_000, 0 × 0.06) = 5_000
```

---

**EC-TR-02: Pre-TRAIN — net taxable estate exactly ₱200,000**
Zero tax. The exemption threshold is inclusive: "not over ₱200,000" → 0.
```
// net_taxable_estate = 200_000 → estate_tax_due = 0
```

---

**EC-TR-03: Pre-TRAIN — net taxable estate ₱200,001**
Tax applies ONLY on the excess over ₱200K, not on the full amount.
```
// net_taxable_estate = 200_001 → estate_tax_due = 1 × 0.05 = ₱0.05
```

---

**EC-TR-04: Pre-TRAIN — bracket boundary values must be exact**
These four hardcoded base amounts must be exact (do not recompute):

| NTE | Fixed Base | Marginal Rate |
|-----|-----------|--------------|
| ≤₱200K | ₱0 | 0% |
| ₱200K–₱500K | ₱0 | 5% |
| ₱500K–₱2M | ₱15,000 | 8% |
| ₱2M–₱5M | ₱135,000 | 11% |
| ₱5M–₱10M | ₱465,000 | 15% |
| >₱10M | ₱1,215,000 | 20% |

---

**EC-TR-05: Very large pre-TRAIN estate (>₱10M)**
20% rate applies ONLY to excess over ₱10M, not to the entire estate.
```
// net_taxable_estate = ₱50M → estate_tax_due = 1_215_000 + (50M − 10M) × 0.20 = ₱9,215,000
```

---

**EC-TR-06: TRAIN flat rate on all decedents (including NRA)**
Flat 6% applies to citizens, resident aliens, and NRAs equally. NRA differences are in gross estate scope and deductions, not the tax rate.

---

**EC-TR-07: Fractional peso results**
No rounding rule specified in NIRC. Engine carries full decimal precision internally. Round to centavos for display output only.

---

**EC-TR-08: Foreign tax credit reduces net estate tax due to zero**
`net_estate_tax_due = max(0, estate_tax_due − foreign_tax_credit) = 0`. Credit cannot produce negative tax or a refund.

---

**EC-TR-09: Amnesty minimum ₱5,000 — always applies**
`amnestyTaxDue = max(5_000, amnestyTaxBase × 0.06)`. The ₱5,000 minimum is a hard floor with no exceptions.

---

**EC-TR-10: Amnesty Track B — previously declared ≥ current NTE**
`amnestyTaxBase = max(0, NTE_current − previouslyDeclaredNTE) = 0`. Minimum ₱5,000 still applies.

---

**EC-TR-11: Pre-TRAIN no-minimum rule**
Pre-TRAIN regular computation has NO minimum tax. Unlike amnesty. If net taxable estate ≤ ₱200K, tax = ₱0.

---

**EC-TR-12: Installment payment — does not change computed tax**
Sec. 91(C) allows 2-year payment schedule. Does not change Item 44 (total tax due). Item 21 (prior installments paid) is out of scope.

---

## 18. Foreign Tax Credits (Item 43)

**Legal basis**: NIRC Sec. 86(D); per-country limit + overall cap
**Cross-reference**: `analysis/tax-credits.md`

---

**EC-FC-01: No foreign property — no credit**
`foreignTaxCredits = []` → `total_credit = 0`. Engine accepts empty array.

---

**EC-FC-02: Foreign tax paid exceeds per-country limit**
Excess is lost — not refunded, not carried forward.
```
// per_country_limit = ₱90K, foreignTaxPaid = ₱150K → credit = ₱90K (excess ₱60K lost)
```

---

**EC-FC-03: Multiple foreign countries — sum with overall cap**
Sum per-country credits, then apply overall cap (total credit ≤ PH estate tax due).
```
// USA credit = ₱80K, Singapore credit = ₱30K; combined = ₱110K
// PH estate tax = ₱100K → total_credit = min(₱110K, ₱100K) = ₱100K; net = ₱0
```

---

**EC-FC-04: Credit equals or exceeds PH estate tax due**
`net_estate_tax_due = max(0, phEstateTaxDue − total_credit) = 0`. No refund.

---

**EC-FC-05: NRA attempting to claim foreign tax credit**
NRA gross estate = PH-situs only; no foreign estate taxes paid on PH property. Credit = 0.
```
// if isNonResidentAlien: foreignTaxCredit = 0 (override any user input)
```

---

**EC-FC-06: Foreign property value exceeds total gross estate (data error)**
Validation error.
```
// ValidationError: "Foreign property value cannot exceed total gross estate."
```

---

**EC-FC-07: Currency conversion**
Engine operates in PHP only. User provides PHP-equivalent of foreign estate taxes paid. Engine does not fetch exchange rates.

---

**EC-FC-08: Pre-TRAIN estates — identical credit formula**
Foreign tax credit rules are identical for pre-TRAIN estates. Only the base PH estate tax computation differs (graduated rate). Credit formula and limits are unchanged.

---

**EC-FC-09: Amnesty — no foreign tax credit**
Foreign tax credit is NOT available under the amnesty path. Amnesty is a flat settlement; no credits apply.
```
// if regime == "AMNESTY": foreignTaxCredit = 0
```

---

**EC-FC-10: Installment payment tracking is out of scope**
Item 21 (prior installments paid) is recorded by the filer on the actual Form 1801. Engine produces Item 44 only; does not track or compute installment credits.

---

## 19. Amnesty — Eligibility

**Legal basis**: RA 11213 Sec. 4 (coverage and exclusions); RA 11569 (extension to June 14, 2025); RA 11956 (expanded coverage to May 31, 2022)
**Cross-reference**: `analysis/amnesty-eligibility.md`

---

**EC-AE-01: Death after May 31, 2022**
Not eligible. Engine directs to TRAIN regular computation.
```
// eligible = false; reason = DEATH_AFTER_COVERAGE_CUTOFF
```

---

**EC-AE-02: Estate tax already paid in full**
Not eligible. Amnesty is for unpaid/unsettled taxes.
```
// eligible = false; reason = TAX_ALREADY_PAID
```

---

**EC-AE-03: Partially paid estate tax**
Eligible. Prior return filed + partial payment → Track B. Amnesty covers the unpaid remainder.

---

**EC-AE-04: PCGG-sequestered estate**
Hard exclusion. Engine denies amnesty and forces pre-TRAIN computation.

---

**EC-AE-05: TRAIN-era death (2018–2022) — same rate, but amnesty still available**
Eligible per RA 11956. `deductionRules = "TRAIN"`. The primary benefit is surcharge/interest waiver, not rate reduction. Engine displays mandatory notice about rate parity.

---

**EC-AE-06: No prior return, heirs informally partitioned estate years ago**
Track A applies. Amnesty base = ALL estate property at FMV at date of death, regardless of subsequent disposition by heirs.

---

**EC-AE-07: Prior return filed showing zero tax due**
Track B. `net_undeclared = total_NTE − previously_declared_NTE`. If previously declared = current estimate, net undeclared ≤ 0 → minimum ₱5,000 applies.

---

**EC-AE-08: Pending court case filed before RA 11213 enactment (Feb 14, 2019)**
Excluded from amnesty. Engine checks `hasPendingCourtCasePreAmnestyAct = true`.

---

**EC-AE-09: BIR assessment issued after RA 11213 enactment**
Eligible — "with or without prior BIR assessments" per Sec. 4. Track B if prior return filed; Track A if not.

---

**EC-AE-10: Multiple decedents in one estate (married couple, both died pre-2018)**
Each decedent's estate is a separate amnesty application. Engine handles them independently. They may share assets.

---

**EC-AE-11: Amnesty for TRAIN-era death with no surcharge exposure**
Engine must display: "For this estate, the amnesty and regular TRAIN computations produce identical base tax (₱X). If the estate has no penalty exposure, the regular TRAIN path produces the same result." Let user decide.

---

**EC-AE-12: Partial estate settlement — some properties transferred, others pending**
Ambiguous. Amnesty likely covers the entire estate including previously transferred properties. Engine flags for professional review.

---

## 20. Amnesty — Computation

**Legal basis**: RA 11213 Sec. 5 (6% flat rate + ₱5K minimum); RA 11213 Sec. 3 (net estate = "allowable deductions under NIRC at time of death")
**Cross-reference**: `analysis/amnesty-computation.md`, `analysis/correction-amnesty-deductions.md`

---

**EC-AC-01: Deductions exceed gross estate — minimum ₱5,000 applies**
Even when Item40 = 0, amnesty has a hard floor.
```
// GE = ₱1M, deductions = ₱1.2M → Item40 = 0 → amnestyTaxDue = ₱5,000
```

---

**EC-AC-02: Track B — previously declared > current NTE**
```
// previouslyDeclaredNTE = ₱2.5M, currentNTE = ₱2M
// amnestyTaxBase = max(0, ₱2M − ₱2.5M) = 0 → amnestyTaxDue = ₱5,000 (minimum)
```

---

**EC-AC-03: TRAIN-era amnesty = same tax as regular TRAIN**
For 2018–2022 deaths, base tax is identical under both paths. Engine displays equivalence notice and notes the surcharge/interest waiver benefit.

---

**EC-AC-04: Narrow interpretation toggle — higher tax**
When `narrowInterpretation = true`, deductions = standard deduction + surviving spouse share only. All other deductions (ELIT, vanishing, family home, medical, etc.) are excluded. Tax is higher than primary interpretation. Engine displays disclaimer: "This is a conservative interpretation. Primary legal reading of RA 11213 Sec. 3 allows full deductions at time of death."

---

**EC-AC-05: Vanishing deduction IS available under amnesty (primary interpretation)**
⚠ Correction: VD is available under amnesty. RA 11213 Sec. 3 includes "allowable deductions under the NIRC at time of death" which includes Sec. 86(A)(2).
**Source**: `analysis/correction-amnesty-deductions.md`, `analysis/test-vectors.md` TV-09

---

**EC-AC-06: NRA under amnesty — proportional deductions apply**
Sec. 86(B) proportional formula applies to NRA amnesty computation. No special NRA amnesty exception.

---

**EC-AC-07: Track B — prior return filed but tax never paid**
Track B applies whenever a prior return was filed, regardless of whether the tax was actually paid. `Track B with previouslyDeclaredNTE = 0` is mathematically equivalent to Track A.

---

**EC-AC-08: Pre-2018 amnesty death — standard deduction is ₱1M (not ₱5M)**
```
// regime = "AMNESTY", deductionRules = "PRE_TRAIN" → standardDeduction = ₱1,000,000
```

---

**EC-AC-09: TRAIN-era amnesty death — standard deduction is ₱5M**
```
// regime = "AMNESTY", deductionRules = "TRAIN" → standardDeduction = ₱5,000,000
```
**Source**: `analysis/correction-amnesty-deductions.md`

---

**EC-AC-10: Filing window closed — engine computes historical amounts only**
All amnesty output must include mandatory notice: "⚠ The estate tax amnesty filing window closed June 14, 2025. This is a historical computation only."

---

## 21. Amnesty vs. Regular Comparison

**Legal basis**: Algebraic crossover: amnesty = pre-TRAIN at NTE ₱1,250,000
**Cross-reference**: `analysis/amnesty-vs-regular.md`

---

**EC-AVR-01: NTE exactly at crossover (₱1,250,000)**
Both paths produce identical base tax (₱75,000). Engine displays: "Both paths produce the same base tax of ₱75,000. The amnesty path also waives all accrued surcharges and interest."

---

**EC-AVR-02: NTE ≤ ₱200,000 — regular pre-TRAIN is definitively better**
Regular: ₱0 tax. Amnesty: ₱5,000 minimum. Engine must strongly advise against amnesty election.

---

**EC-AVR-03: Track B — small undeclared estate**
Even when full estate crossover favors regular, Track B amnesty tax (on undeclared portion only) is almost always lower. Engine must compute Track B comparison separately.

---

**EC-AVR-04: Estate ineligible for amnesty (PCGG)**
Engine denies amnesty path, displays ineligibility reason, forces pre-TRAIN computation.

---

**EC-AVR-05: TRAIN-era death rate parity**
Both regular TRAIN and amnesty = 6%. Amnesty benefit = surcharge/interest waiver only (outside engine scope). Engine must display mandatory rate-parity notice.

---

**EC-AVR-06: NTE ₱1,000,000 — regular pre-TRAIN saves on base tax**
Regular (5% bracket): ₱55,000. Amnesty (6%): ₱60,000. Regular saves ₱5,000 on base. However, if estate has been unpaid for years, surcharge + interest waiver under amnesty may dominate the comparison.

---

**EC-AVR-07: Surcharge and interest waiver may dominate base tax savings**
Engine cannot quantify surcharges/interest (out of scope). Must display: "Note: This engine computes base tax only. The amnesty path also waives all surcharges and interest, which may significantly exceed any base tax difference shown."

---

**EC-AVR-08: Filing window closed — mandatory notice on all amnesty output**
All amnesty computations must include the closed-window notice regardless of which path appears favorable.

---

## 22. Filing & Administrative Rules

**Legal basis**: NIRC Sec. 90 (return requirement); Sec. 91 (payment); Sec. 89 (notice, repealed by TRAIN)
**Cross-reference**: `analysis/filing-rules.md`

---

**EC-FR-01: Zero-tax estate with registrable property**
Estate must still file Form 1801 even with zero tax due, if estate contains registered or registrable property (real property, shares, motor vehicles). Engine must flag this in the explainer.

---

**EC-FR-02: CPA threshold — strict inequality**
CPA certification required only if gross estate EXCEEDS the threshold (not equals it).
```
// TRAIN: cpa_required = (grossEstate > 5_000_000)
// pre-TRAIN: cpa_required = (grossEstate > 2_000_000)
```

---

**EC-FR-03: CPA threshold is on gross estate, not net**
Even if deductions bring net taxable estate to zero, CPA certification still required if gross estate exceeds the threshold.

---

**EC-FR-04: Filing extension vs. payment extension**
Sec. 90(C) extension = for filing only (≤30 days). Sec. 91(B) extension = for payment only (up to 5 years judicial / 2 years extrajudicial). These are independent and can be combined. Engine explainer must distinguish clearly.

---

**EC-FR-05: NRA — no PH domicile, RDO 39**
NRAs with no PH legal domicile file at Revenue District Office No. 39, South Quezon City. Engine outputs this in the filing guide.

---

**EC-FR-06: Pre-TRAIN notice of death (Sec. 89, now repealed)**
Notice of death was required under old Sec. 89 within 2 months of death if estate > ₱20,000. Repealed by TRAIN. For pre-TRAIN estates, engine should note this historical obligation in the explainer as informational only — no computation impact.

---

**EC-FR-07: Amnesty — ETAR form, not Form 1801**
Amnesty uses the Estate Tax Amnesty Return (ETAR). The engine produces ETAR output for amnesty paths and Form 1801 output for TRAIN/pre-TRAIN. Filing window closed June 14, 2025 — output is historical.

---

**EC-FR-08: Installment payment (Sec. 91(C))**
2-year installment schedule available. Does not change computed tax. Item 21 (prior installments) is out of scope for the engine. Filer enters this manually on the actual form.

---

**EC-FR-09: Multiple filers (executor and heirs)**
Any qualified heir, administrator, or executor may file. Engine does not need to capture all filers. Explainer notes this.

---

**EC-FR-10: Amnesty CPA certification**
RA 11213 does not explicitly state a CPA certification threshold for ETAR. Engine flags: "Consult a tax professional regarding documentation requirements for the Estate Tax Amnesty Return."

---

## 23. Pipeline-Level Edge Cases

**Legal basis**: Overall computation pipeline ordering and column arithmetic
**Cross-reference**: `analysis/computation-pipeline.md`

---

**EC-PL-01: Deductions exceed gross estate — zero tax, no minimum (TRAIN/pre-TRAIN)**
```
// Item34.C = ₱2M; Item37A = ₱5M (standard)
// Item38 = max(0, ₱2M − ₱5M) = 0; Item40 = 0; Item44 = 0
// No minimum tax under TRAIN or PRE_TRAIN. (Amnesty: ₱5K minimum would apply.)
```

---

**EC-PL-02: Surviving spouse share exceeds Item 38**
Item 39 is NOT capped at Item 38. Item 40 is floored at 0.
```
// Item38 = ₱1M; Item39 = ₱1.5M → Item40 = max(0, ₱1M − ₱1.5M) = 0
```

---

**EC-PL-03: Per-column floor at Item 36 causes Column C ≠ Column A + total**
When Column A ELIT exceeds Column A GE, Item 36.A = 0 (floored). The excess Column A deductions are LOST — they do not transfer to Column B.
```
// Item34 = {A:0, B:5M, C:5M}; Item35 = {A:2M, B:0, C:2M}
// Item36 = {A:0, B:5M, C:5M}  ← Column C ≠ 3M (not Item34.C − Item35.C)
```

---

**EC-PL-04: NRA with zero PH-situs assets after Sec. 87 exclusions**
```
// Item34.C = 0 → proportional_factor = 0 → all ELIT deductions = 0
// Item37A = ₱500K (standard) → Item38 = max(0, 0 − 500K) = 0
// Item40 = 0; Item44 = 0
```

---

**EC-PL-05: Amnesty Track B — previously declared exceeds current NTE**
```
// previouslyDeclaredNTE = ₱3M; currentNTE = ₱2.5M
// amnestyTaxBase = max(0, ₱2.5M − ₱3M) = 0
// amnestyTaxDue = max(5_000, 0 × 0.06) = ₱5,000
```

---

**EC-PL-06: RA 4917 pass-through — gross estate and deduction both populated**
RA 4917 benefit appears in BOTH gross estate (Schedule 2, Column A) and special deductions (Item 37D). Net effect on Item 38 = 0. Both values are required in the output.
```
// RA4917 = ₱800K → Item31.A += 800K AND Item37D = 800K → net: ₱0 impact on Item38
```

---

**EC-PL-07: Pre-TRAIN ELIT with funeral/judicial in vanishing deduction ratio**
The ELIT_total used in the VD ratio includes funeral (5G) and judicial/admin (5H) for pre-TRAIN estates. Larger ELIT → smaller VD ratio → smaller vanishing deduction. This is the correct statutory result.
```
// ELIT_total (pre-TRAIN) = 5A.C + 5B.C + 5C.C + 5D.C + 5G.C + 5H.C
// ratio = (Item34.C − ELIT_total) / Item34.C
```

---

**EC-PL-08: Critical ordering constraint — Item 34 before funeral deduction limit**
Pre-TRAIN only. Funeral deduction limit = 5% × Item 34.C (total gross estate). Item 34 must be completely finalized (all gross estate schedules populated) BEFORE computing the funeral deduction limit. Engine must enforce this ordering.
```
// WRONG: compute funeral limit → then finalize gross estate
// CORRECT: finalize Item34.C → then compute funeralLimit = 0.05 × Item34.C
```

---

## Corrections Summary

The following corrections were identified during analysis and must be reflected in the final engine:

| Correction | Original Error | Corrected Rule | Source |
|------------|---------------|----------------|--------|
| NRA public transfers are proportional | `analysis/deduction-public-transfers.md` stated NRA gets full-value deduction | Sec. 86(B)(2) makes NRA public transfers proportional (same factor as ELIT) | `analysis/correction-nra-public-transfers.md` |
| Amnesty funeral/judicial for pre-2018 deaths | `analysis/deductions-pre-train-diffs.md` excluded funeral/judicial from amnesty pre-2018 path | RA 11213 Sec. 3 plain text includes full NIRC deductions at time of death | `analysis/correction-amnesty-deductions.md` |
| Amnesty standard deduction for TRAIN-era deaths | `deductions-pre-train-diffs.md` used ₱1M for TRAIN-era amnesty | TRAIN-era amnesty deaths use TRAIN deduction rules: ₱5M standard, ₱10M family home | `analysis/correction-amnesty-deductions.md` |
| Vanishing deduction under amnesty | `analysis/deduction-vanishing.md` note said VD not available under amnesty | VD IS available under amnesty (full NIRC deductions at time of death per RA 11213 Sec. 3) | `analysis/amnesty-computation.md`, `analysis/test-vectors.md` |

---

## Key Constants (from analysis)

| Constant | Value | Legal Basis |
|----------|-------|-------------|
| `TRAIN_EFFECTIVE_DATE` | `2018-01-01` | RA 10963 |
| `AMNESTY_COVERAGE_CUTOFF` | `2022-05-31` | RA 11956 |
| `AMNESTY_FILING_DEADLINE` | `2025-06-14` | RA 11569 |
| `AMNESTY_RATE` | `0.06` | RA 11213 Sec. 5 |
| `AMNESTY_MINIMUM` | `5_000` | RA 11213 Sec. 5 |
| `TRAIN_RATE` | `0.06` | NIRC Sec. 84 as amended |
| `TRAIN_STANDARD_DEDUCTION_CITIZEN` | `5_000_000` | NIRC Sec. 86(A)(4) |
| `PRE_TRAIN_STANDARD_DEDUCTION_CITIZEN` | `1_000_000` | NIRC Sec. 86(A)(4) pre-TRAIN |
| `STANDARD_DEDUCTION_NRA` | `500_000` | NIRC Sec. 86(B)(1) |
| `TRAIN_FAMILY_HOME_CAP` | `10_000_000` | NIRC Sec. 86(A)(5) as amended |
| `PRE_TRAIN_FAMILY_HOME_CAP` | `1_000_000` | NIRC Sec. 86(A)(5) pre-TRAIN |
| `MEDICAL_EXPENSE_CAP` | `500_000` | NIRC Sec. 86(A)(6) |
| `PRE_TRAIN_EXEMPTION_THRESHOLD` | `200_000` | NIRC Sec. 84 RA 8424 |
| `AMNESTY_VS_PRETRAIN_CROSSOVER_NTE` | `1_250_000` | Algebraic: solved from bracket 3 |
| `FAMILY_CODE_EFFECTIVE_DATE` | `1988-08-03` | Republic Act 6809 / Executive Order 227 |
| `CPA_THRESHOLD_TRAIN` | `5_000_000` | NIRC Sec. 90(B) as amended |
| `CPA_THRESHOLD_PRE_TRAIN` | `2_000_000` | NIRC Sec. 90(B) pre-TRAIN |
| `VANISHING_PCT_TABLE` | `[1.00, 0.80, 0.60, 0.40, 0.20]` | NIRC Sec. 86(A)(2) |
| `FUNERAL_EXPENSE_PCT_LIMIT` | `0.05` | NIRC Sec. 86(A)(1)(a) pre-TRAIN |

---

## Test Implications

Every edge case in this catalog requires at least one of:
1. A validation rule in the engine input layer (rejects invalid state before computation)
2. A conditional branch in the computation pipeline (routes to correct logic)
3. A display rule in the output/explainer layer (shows correct warning or notice)
4. A test case in the test vectors (verifies the computation numerically)

The 10 integration test vectors in `analysis/test-vectors.md` cover the major paths. The edge cases above are primarily covered by unit tests on individual computation functions. Implementers should write unit tests for each EC-* item not already covered by a test vector.
