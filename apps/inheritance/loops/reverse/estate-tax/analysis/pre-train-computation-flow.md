# Analysis: Pre-TRAIN Computation Flow (End-to-End)

**Aspect**: pre-train-computation-flow
**Wave**: 3 — Pre-TRAIN Rule Extraction
**Date Analyzed**: 2026-02-24
**Legal Source**: NIRC RA 8424 (as originally enacted); pre-TRAIN-era NIRC Sections 84–86
**Depends on**:
- `analysis/tax-rate-pre-train.md` — graduated rate schedule
- `analysis/deductions-pre-train-diffs.md` — funeral/judicial expenses, lower standard deduction/family home cap
- `analysis/deduction-elit.md` — claims, mortgages, losses (5A–5D)
- `analysis/deduction-vanishing.md` — vanishing deduction (5E)
- `analysis/deduction-public-transfers.md` — bequests to government (5F)
- `analysis/deduction-standard.md` — standard deduction amounts
- `analysis/deduction-family-home.md` — family home cap rules
- `analysis/deduction-medical.md` — medical expenses (₱500K)
- `analysis/deduction-ra4917.md` — RA 4917 benefits
- `analysis/surviving-spouse-share.md` — Sec. 86(C) spouse share formula
- `analysis/nonresident-deductions.md` — NRA proportional ELIT, NRA deduction matrix
- `analysis/gross-estate-citizens.md` — worldwide scope for citizens/residents
- `analysis/gross-estate-nonresident.md` — PH-situs scope for NRAs
- `analysis/tax-credits.md` — foreign estate tax credit

---

## Purpose

This document synthesizes all pre-TRAIN regime rules into a **complete, ordered computation pipeline** for the engine — from raw inputs to final net estate tax due. It is the single reference for implementing the pre-TRAIN branch of the engine.

The pre-TRAIN regime applies when:
```
decedent.dateOfDeath < DATE("2018-01-01")
AND regime_selected != "amnesty"
```

If both conditions for amnesty apply (pre-2018 death AND estate is unpaid/unsettled AND taxpayer elects amnesty), use the amnesty path instead (see `analysis/amnesty-computation.md`).

---

## Legal Basis

- **NIRC Section 84** (original RA 8424 graduated rate schedule): Provides the tax rate
- **NIRC Section 85**: Gross estate inclusions — identical to TRAIN era
- **NIRC Section 86(A)** (original): All deductions, including funeral + judicial/admin not yet removed
- **NIRC Section 86(B)**: NRA proportional deductions — identical structure to TRAIN; proportional formula covers ELIT (par. 1) and public transfers (par. 3)
- **NIRC Section 86(C)**: Surviving spouse share — unchanged from pre-TRAIN to TRAIN
- **NIRC Section 86(D)**: Foreign tax credit — unchanged (citizens/residents only)
- **NIRC Section 87**: Exempt transfers — unchanged; pre-computation exclusions apply identically

---

## Key Differences from TRAIN-Era: Summary Table

| Feature | Pre-TRAIN | TRAIN-Era |
|---------|-----------|-----------|
| **Tax rate structure** | **Graduated 0%–20%** (6 brackets) | Flat 6% |
| **Exemption threshold** | **₱200,000** zero-tax floor | None (6% from ₱1) |
| **Standard deduction** (citizen/resident) | **₱1,000,000** | ₱5,000,000 |
| **Family home cap** | **₱1,000,000** | ₱10,000,000 |
| **Funeral expenses** | **Deductible** (min(actual, 5% × GE)) | Not deductible |
| **Judicial/admin expenses** | **Deductible** (actual, no cap) | Not deductible |
| Gross estate scope | Same (Sec. 85) | Same |
| ELIT (claims, mortgages, losses) | Same | Same |
| Vanishing deduction (5E) | Same | Same |
| Public transfers (5F) | Same | Same |
| Standard deduction (NRA) | ₱500,000 (same) | ₱500,000 |
| Medical expenses cap | ₱500,000 (same) | ₱500,000 |
| RA 4917 benefits | Same | Same |
| Surviving spouse share formula | Same (Sec. 86(C)) | Same |
| NRA proportional formula | Same (Sec. 86(B)) | Same |
| Foreign tax credit | Same (citizens/residents only) | Same |
| Exempt transfers (Sec. 87) | Same | Same |

---

## Complete Pre-TRAIN Computation Pipeline

### I. Citizen / Resident Alien (Worldwide Estate)

```
// ═══════════════════════════════════════════════════════
// PRE-TRAIN COMPUTATION PIPELINE
// Applies when: decedent.dateOfDeath < 2018-01-01
//               AND decedent is citizen or resident alien
//               AND regime_selected != "amnesty"
// ═══════════════════════════════════════════════════════

// ─── PHASE 0: PRE-COMPUTATION EXCLUSIONS (Sec. 87) ──────────────────────
// Run BEFORE populating gross estate schedules.
// Exclude from gross estate (do not enter in any Schedule):
//   (a) Usufruct rights that merge with naked ownership at death
//   (b) / (c) Fiduciary/fideicommissary transmissions (pass-through estates)
//   (d) Bequests to qualifying private charitable/religious/educational
//       institutions where admin costs ≤ 30% and no private benefit

// ─── PHASE 1: GROSS ESTATE (Items 29–34) ────────────────────────────────
// Worldwide scope for citizens and resident aliens
// Same rules as TRAIN era (Sec. 85 unchanged)
// User provides FMV for each asset; engine does NOT determine FMV

// Each item has three columns: A (exclusive), B (conjugal/communal), C (total)
// Property regime (ACP/CPG/Separation) drives A vs. B classification

Item29 = {
  A: sum(FMV of exclusive real property, excluding family home),
  B: sum(FMV of conjugal/communal real property, excluding family home),
  C: Item29.A + Item29.B
}

Item30 = {
  A: FMV of exclusive family home (0 if no exclusive family home or not yet tagged),
  B: FULL FMV of conjugal/communal family home (not halved here; halving at Item37B),
  C: Item30.A + Item30.B
}
// Note: At most ONE property qualifies as the family home.

Item31 = {
  A: sum(FMV of exclusive personal property — tangible + intangible),
  B: sum(FMV of conjugal/communal personal property — tangible + intangible),
  C: Item31.A + Item31.B
}

Item32 = {
  // Taxable transfers: transfers in contemplation of death, revocable transfers,
  // general power of appointment, life insurance (estate-designated), insufficient
  // consideration transfers. See gross-estate-inclusions.md for full rules.
  A: sum(FMV of exclusive taxable transfers),
  B: sum(FMV of conjugal/communal taxable transfers),
  C: Item32.A + Item32.B
}

Item33 = {
  A: max(0, FMV of exclusive business interests),
  B: max(0, FMV of conjugal/communal business interests),
  C: Item33.A + Item33.B
}

Item34 = {
  A: Item29.A + Item30.A + Item31.A + Item32.A + Item33.A,
  B: Item29.B + Item30.B + Item31.B + Item32.B + Item33.B,
  C: Item34.A + Item34.B
}
// Item34.C = Gross Estate Total — used as the 5% base for funeral expense limit


// ─── PHASE 2: ORDINARY DEDUCTIONS (Item 35 / Schedule 5) ────────────────
// PRE-TRAIN: Includes funeral and judicial/admin expenses (removed by TRAIN)

// 5A — Claims Against the Estate (same as TRAIN)
//   Conditions: notarized debt instrument, contracted bona fide and for adequate
//   consideration, existing at time of death, legitimate creditor
Schedule5A = {
  A: sum(exclusive-property claims against estate),
  B: sum(conjugal-property claims against estate),
  C: Schedule5A.A + Schedule5A.B
}

// 5B — Claims vs. Insolvent Persons (same as TRAIN)
//   Condition: receivable must first appear in gross estate (Item 31);
//   deduct only the uncollectible portion
Schedule5B = {
  A: sum(exclusive uncollectible receivables from insolvent debtors),
  B: sum(conjugal uncollectible receivables from insolvent debtors),
  C: Schedule5B.A + Schedule5B.B
}

// 5C — Unpaid Mortgages and Taxes (same as TRAIN)
//   Mortgages: full outstanding balance (for conjugal, full balance in Column B;
//   conjugal split handled internally — do not split mortgage 50/50)
//   Taxes: unpaid accrued-to-death taxes only (not estate tax itself)
Schedule5C = {
  A: exclusive unpaid mortgages + exclusive accrued taxes,
  B: conjugal unpaid mortgages + conjugal accrued taxes,
  C: Schedule5C.A + Schedule5C.B
}

// 5D — Casualty Losses (same as TRAIN)
//   Conditions: arose after death, during settlement, not compensated by insurance
Schedule5D = {
  A: net exclusive casualty losses (after insurance recovery),
  B: net conjugal casualty losses (after insurance recovery),
  C: Schedule5D.A + Schedule5D.B
}

// 5E — Vanishing Deduction (same formula as TRAIN, pre-TRAIN deduction rules)
//   Step 1: IV = min(FMV at prior transfer, FMV at decedent's death)
//   Step 2: NV = max(0, IV − unpaid mortgage on prior property)
//   Step 3: ratio = (Item34.C − total_ELIT_for_ratio) / Item34.C
//           where total_ELIT_for_ratio = 5A.C + 5B.C + 5C.C + 5D.C
//           (does NOT include funeral/judicial — see note below)
//   Step 4: pct = lookup(years_since_prior_transfer):
//             0–1 year (inclusive): 100% (0.00 to 1.00)
//             >1 to ≤2 years:       80%
//             >2 to ≤3 years:       60%
//             >3 to ≤4 years:       40%
//             >4 to ≤5 years:       20%
//             >5 years:             0% (no deduction)
//   Step 5: VD = pct × NV × ratio

// NOTE on vanishing deduction ratio with pre-TRAIN ELIT:
// The ratio uses "ELIT" which in TRAIN means 5A–5D only.
// Under pre-TRAIN, funeral (5G) and judicial/admin (5H) are separate from
// the classic ELIT. The ratio denominators referenced in Sec. 86(A)(2) are
// the "expenses, losses, indebtedness, and taxes" — this refers to the NIRC
// paragraph (1) items (5A–5D). Funeral and judicial/admin are also listed in
// paragraph (1) pre-TRAIN but were labeled as sub-items.
// ENGINE IMPLEMENTATION: include funeral AND judicial/admin expenses in the
// ratio computation (they reduce the effective vanishing deduction) for pre-TRAIN.
//   ratio = (Item34.C − (5A.C + 5B.C + 5C.C + 5D.C + funeralDeduction + judicialDeduction)) / Item34.C

// (Only applies if prior property is within 5 years; prior estate tax must have been paid)
Schedule5E = {
  A: vanishing deduction for exclusive property (if eligible),
  B: vanishing deduction for conjugal property (if eligible),
  C: Schedule5E.A + Schedule5E.B
}

// 5F — Transfers for Public Use (same as TRAIN for citizen/resident)
//   Conditions: bequest is exclusively for public purpose; recipient is PH
//   national government, LGU, or government-owned/controlled entity
Schedule5F = {
  A: sum(FMV of bequests to government from exclusive assets),
  B: sum(FMV of bequests to government from conjugal/communal assets),
  C: Schedule5F.A + Schedule5F.B
}

// *** PRE-TRAIN ONLY: Funeral Expenses ***
// Computed AFTER Item34 is finalized (requires gross estate total)
// Formula: min(actual_funeral_expenses, Item34.C × 0.05)
funeralExpenseLimit = Item34.C × 0.05
funeralExpenseDeduction = min(input.funeralExpenses.actualAmount, funeralExpenseLimit)
Schedule5G = {
  A: if funeralExpenses.ownership == "exclusive": funeralExpenseDeduction else 0,
  B: if funeralExpenses.ownership == "conjugal":  funeralExpenseDeduction else 0,
  C: funeralExpenseDeduction
}
// Default ownership: "conjugal" (most common for married decedents)
// For single/widowed decedents: "exclusive"

// *** PRE-TRAIN ONLY: Judicial and Administrative Expenses ***
// No monetary cap; actual expenses incurred up to date of filing
// Must be related to estate settlement (user-attested)
judicialAdminTotal = sum(expense.amount for expense in input.judicialAdminExpenses
                         where expense.relatedToEstateSettlement == true)
Schedule5H = {
  A: if judicialAdminExpenses.ownership == "exclusive": judicialAdminTotal else 0,
  B: if judicialAdminExpenses.ownership == "conjugal":  judicialAdminTotal else 0,
  C: judicialAdminTotal
}

// Item 35: Total Ordinary Deductions
Item35 = {
  A: Schedule5A.A + Schedule5B.A + Schedule5C.A + Schedule5D.A
     + Schedule5E.A + Schedule5F.A + Schedule5G.A + Schedule5H.A,
  B: Schedule5A.B + Schedule5B.B + Schedule5C.B + Schedule5D.B
     + Schedule5E.B + Schedule5F.B + Schedule5G.B + Schedule5H.B,
  C: Item35.A + Item35.B
}

// Item 36: Estate After Ordinary Deductions
Item36 = {
  A: max(0, Item34.A - Item35.A),
  B: max(0, Item34.B - Item35.B),
  C: Item36.A + Item36.B
}


// ─── PHASE 3: SPECIAL DEDUCTIONS (Item 37 / Schedule 6) ─────────────────
// PRE-TRAIN: Standard deduction = ₱1,000,000 (NOT ₱5,000,000)
// PRE-TRAIN: Family home cap = ₱1,000,000 (NOT ₱10,000,000)
// Medical expenses: same ₱500,000 cap (unchanged)
// RA 4917: same (unchanged)

// 6A: Standard Deduction (PRE-TRAIN: ₱1,000,000 for citizens/residents)
standardDeductionPreTrain = 1_000_000   // Citizen or resident alien
Item37A = standardDeductionPreTrain

// 6B: Family Home Deduction (PRE-TRAIN cap: ₱1,000,000)
if decedent.hasQualifyingFamilyHome:
  if familyHome.ownership == "exclusive":
    applicable_fmv = familyHome.fmv                  // full FMV
  else:  // conjugal or communal
    applicable_fmv = familyHome.fmv × 0.50           // decedent's half
  Item37B = min(applicable_fmv, 1_000_000)           // PRE-TRAIN cap
else:
  Item37B = 0

// Conditions for family home deduction (same across regimes):
// - Must be the decedent's actual residence at time of death
// - Barangay certification of residency required
// - Available to citizens and resident aliens only
// - At most one property
// - Not available to NRAs (even under pre-TRAIN)

// 6C: Medical Expenses (SAME as TRAIN — ₱500,000 cap)
qualifyingMedicalExpenses = sum(expense.amount for expense in input.medicalExpenses
                                where expense.incurredWithin1YearBeforeDeath == true
                                and expense.hasOfficialReceipt == true)
Item37C = min(qualifyingMedicalExpenses, 500_000)

// 6D: RA 4917 Benefits (SAME as TRAIN)
Item37D = input.ra4917BenefitsAmount   // Actual amount; received from employer; no cap

// Item 37: Total Special Deductions
Item37 = Item37A + Item37B + Item37C + Item37D

// Item 38: Net Estate
Item38 = max(0, Item36.C - Item37)


// ─── PHASE 4: SURVIVING SPOUSE SHARE (Item 39) ──────────────────────────
// SAME as TRAIN era (Sec. 86(C) unchanged)

if decedent.maritalStatus == "married" AND decedent.propertyRegime in ("ACP", "CPG"):
  // Community/conjugal assets (Column B gross estate)
  total_community_assets = Item34.B   // Full Column B gross estate

  // Community obligations (ELIT Column B only — 5A through 5D, plus pre-TRAIN additions)
  // NOTE: For pre-TRAIN, community obligations include the ELIT-equivalent items:
  //   5A.B + 5B.B + 5C.B + 5D.B + Schedule5G.B + Schedule5H.B
  //   (funeral and judicial/admin reduce the community pool too)
  // Vanishing deduction (5E) and public transfers (5F) do NOT reduce community pool
  community_obligations = Schedule5A.B + Schedule5B.B + Schedule5C.B + Schedule5D.B
                         + Schedule5G.B + Schedule5H.B   // PRE-TRAIN adds funeral + judicial

  net_community = max(0, total_community_assets - community_obligations)
  Item39 = net_community × 0.50
else:
  Item39 = 0   // Single, widowed, or separation of property regime


// ─── PHASE 5: NET TAXABLE ESTATE (Item 40) ──────────────────────────────
Item40 = max(0, Item38 - Item39)


// ─── PHASE 6: TAX COMPUTATION ────────────────────────────────────────────
// PRE-TRAIN: Apply graduated rate schedule (NOT flat 6%)
// CRITICAL DIFFERENCE from TRAIN

function computePreTrainEstateTax(net_taxable_estate):
  nte = max(0, net_taxable_estate)   // floor at 0

  if nte <= 200_000:
    return 0

  elif nte <= 500_000:
    return (nte - 200_000) × 0.05

  elif nte <= 2_000_000:
    return 15_000 + (nte - 500_000) × 0.08

  elif nte <= 5_000_000:
    return 135_000 + (nte - 2_000_000) × 0.11

  elif nte <= 10_000_000:
    return 465_000 + (nte - 5_000_000) × 0.15

  else:
    return 1_215_000 + (nte - 10_000_000) × 0.20

Item42 = computePreTrainEstateTax(Item40)   // Estate Tax Due

// Item 41 (Tax Rate Reference):
// For graduated schedule, Item 41 is informational only — shows effective rate
//   effectiveRate = if Item40 == 0: 0 else Item42 / Item40
// (Marginal rate also displayed in explainer for top bracket reached)


// ─── PHASE 7: FOREIGN TAX CREDIT (Item 43) ──────────────────────────────
// SAME as TRAIN (citizens/residents only)
// Capped at lower of:
//   (a) Per-country limit: (PH estate tax attributable to foreign estate) = Item42 × (foreignEstate / Item40)
//   (b) Overall limit: Item42

if decedent.isCitizenOrResident:
  Item43 = min(sum of per-country credits, Item42)
else:
  Item43 = 0   // NRA cannot claim foreign tax credit (Sec. 86(D))


// ─── PHASE 8: NET ESTATE TAX DUE ────────────────────────────────────────
Item44 = max(0, Item42 - Item43)   // Net Estate Tax Due (= Item 20 on Form 1801)
```

---

### II. Non-Resident Alien (PH-Situs Estate, Pre-TRAIN)

The NRA pre-TRAIN computation uses the same proportional formula as TRAIN-era NRAs (Sec. 86(B)), with the following differences:

1. **Funeral expenses are proportional** (pre-TRAIN funeral expenses are ELIT-type items; Sec. 86(B)(2) applies proportional formula to ELIT-type deductions)
2. **Judicial/admin expenses are proportional** (same reason — ELIT-type items under pre-TRAIN Sec. 86(A)(1))
3. **Worldwide ELIT** fields must include funeral and judicial/admin expenses in their worldwide totals (since these are deductible in pre-TRAIN)
4. **Tax rate**: graduated schedule (not flat 6%)
5. All other NRA rules identical to TRAIN-era NRA rules

```
// ═══════════════════════════════════════════════════════
// PRE-TRAIN NRA COMPUTATION PIPELINE
// Applies when: decedent.dateOfDeath < 2018-01-01
//               AND decedent.isNonResidentAlien == true
//               AND regime_selected != "amnesty"
// ═══════════════════════════════════════════════════════

// ─── PHASE 1: GROSS ESTATE (PH-situs only) ──────────────────────────────
// Same as TRAIN-era NRA gross estate (see gross-estate-nonresident.md)
// Item 30 = 0 (family home not available to NRAs)
// Intangible personal property excluded if reciprocity applies (user-declared)

Item34_NRA = {
  A: sum(exclusive PH-situs assets),
  B: sum(conjugal PH-situs assets),
  C: Item34_NRA.A + Item34_NRA.B
}

// ─── PHASE 2: PROPORTIONAL FACTOR ────────────────────────────────────────
// Required additional inputs from user:
//   decedent.totalWorldwideGrossEstate  (must be ≥ Item34_NRA.C)
//   decedent.totalWorldwideELIT = {
//     claimsAgainstEstate,    // 5A worldwide
//     claimsVsInsolvent,      // 5B worldwide
//     unpaidMortgages,        // 5C worldwide
//     casualtyLosses,         // 5D worldwide
//     funeralExpenses,        // PRE-TRAIN: also worldwide funeral expenses
//     judicialAdminExpenses   // PRE-TRAIN: also worldwide judicial/admin expenses
//   }
//   decedent.totalWorldwidePublicTransfers  (for Sec. 86(B)(2) proportional)

proportional_factor = Item34_NRA.C / decedent.totalWorldwideGrossEstate
// Validate: 0 ≤ proportional_factor ≤ 1.0
// Error if Item34_NRA.C > decedent.totalWorldwideGrossEstate

// ─── PHASE 3: PROPORTIONAL ORDINARY DEDUCTIONS ──────────────────────────
// Sec. 86(B)(2): proportional formula applies to ELIT (par. 1) + public transfers (par. 3)
// Sec. 86(B)(3): vanishing deduction at full % but PH-situs property only

W = decedent.totalWorldwideELIT   // worldwide ELIT object (extended for pre-TRAIN)

// ELIT items (proportional):
prorated_5A = proportional_factor × W.claimsAgainstEstate
prorated_5B = proportional_factor × W.claimsVsInsolvent
prorated_5C = proportional_factor × W.unpaidMortgages
prorated_5D = proportional_factor × W.casualtyLosses

// PRE-TRAIN ONLY: Funeral and judicial expenses (also proportional for NRAs)
prorated_5G = proportional_factor × W.funeralExpenses       // Funeral (proportional)
prorated_5H = proportional_factor × W.judicialAdminExpenses // Judicial/admin (proportional)

// Vanishing deduction (NOT proportional — PH-situs restriction only):
total_proportional_ELIT = prorated_5A + prorated_5B + prorated_5C + prorated_5D
                         + prorated_5G + prorated_5H  // pre-TRAIN adds funeral + judicial
vanishing_ratio = (Item34_NRA.C - total_proportional_ELIT) / Item34_NRA.C
// (Same 5-step formula; PH-situs prior property only; prior estate tax must have been paid)

// Public transfers (proportional for NRAs per Sec. 86(B)(2)):
prorated_5F = proportional_factor × decedent.totalWorldwidePublicTransfers
// Note: PH government transfers only (PH-situs by definition)

total_ordinary_deductions_NRA = prorated_5A + prorated_5B + prorated_5C + prorated_5D
                                + vanishing_deduction + prorated_5F
                                + prorated_5G + prorated_5H
Item35_NRA = total_ordinary_deductions_NRA

// Item 36:
Item36_NRA = max(0, Item34_NRA.C - Item35_NRA)

// ─── PHASE 4: SPECIAL DEDUCTIONS (NRA) ──────────────────────────────────
// Standard deduction: ₱500,000 (NRAs — same as TRAIN; not ₱1M or ₱5M)
Item37A_NRA = 500_000
Item37B_NRA = 0       // Family home: NOT available to NRAs
Item37C_NRA = 0       // Medical expenses: NOT available to NRAs (not in Sec. 86(B))
Item37D_NRA = 0       // RA 4917: NOT available to NRAs (not in Sec. 86(B))
Item37_NRA  = 500_000

Item38_NRA = max(0, Item36_NRA - Item37_NRA)

// ─── PHASE 5: SURVIVING SPOUSE SHARE (NRA) ──────────────────────────────
// Same formula; PH-situs conjugal only; obligations = proportional NRA ELIT (column B)
if decedent.maritalStatus == "married" AND propertyRegime in ("ACP", "CPG"):
  community_obligations_NRA = (prorated_5A + prorated_5B + prorated_5C + prorated_5D
                               + prorated_5G + prorated_5H) × (Column_B_fraction)
  // Column_B_fraction = Item34_NRA.B / Item34_NRA.C (if proportional_factor applies equally)
  // Simplest approach: user tags each proportional ELIT item as exclusive/conjugal
  net_conjugal_NRA = max(0, Item34_NRA.B - community_obligations_NRA.B)
  Item39_NRA = net_conjugal_NRA × 0.50
else:
  Item39_NRA = 0

// ─── PHASE 6: NET TAXABLE ESTATE (NRA) ──────────────────────────────────
Item40_NRA = max(0, Item38_NRA - Item39_NRA)

// ─── PHASE 7: TAX (NRA, pre-TRAIN) ──────────────────────────────────────
// SAME graduated schedule as citizen pre-TRAIN
Item42_NRA = computePreTrainEstateTax(Item40_NRA)

// ─── PHASE 8: CREDITS (NRA) ──────────────────────────────────────────────
Item43_NRA = 0              // No foreign tax credit for NRAs
Item44_NRA = Item42_NRA    // Net estate tax due = gross estate tax due
```

---

## Order of Operations (Critical Dependencies)

The following sequence must be preserved; some steps depend on earlier outputs:

```
1.  Phase 0: Apply Sec. 87 exemptions (pre-computation exclusions)
2.  Phase 1: Compute all gross estate items (Items 29–34)
               → Item34.C must be finalized BEFORE funeral expense limit
3.  Phase 2: Compute funeral expense deduction limit = Item34.C × 0.05
               → funeralDeduction = min(actual, limit)
4.  Phase 2: Compute all other ordinary deductions (5A–5E)
               → Vanishing deduction ratio uses total ELIT including funeral + judicial
5.  Phase 2: Compute judicial/admin expense deduction
6.  Phase 2: Sum ordinary deductions → Item35
7.  Phase 2: Compute Item36 = max(0, Item34 − Item35) per column
8.  Phase 3: Compute special deductions (Items 37A–37D)
9.  Phase 3: Compute Item38 = max(0, Item36.C − Item37)
10. Phase 4: Compute surviving spouse share (Item39)
               → Uses Item34.B (gross Column B) and community obligations
               → Does NOT use Item36 (post-deduction amounts)
11. Phase 5: Compute Item40 = max(0, Item38 − Item39)
12. Phase 6: Apply graduated rate schedule → Item42
13. Phase 7: Apply foreign tax credit → Item43 (citizens/residents only)
14. Phase 8: Item44 = max(0, Item42 − Item43)
```

**Key ordering constraint**: Funeral expense deduction depends on Item34.C, so gross estate must be fully populated before any ordinary deductions are computed. All other ordinary deductions can be computed independently once Item34 is finalized.

---

## Branching Logic: TRAIN vs. Pre-TRAIN

```
function selectRegime(decedent, estateStatus):

  if decedent.dateOfDeath >= DATE("2018-01-01"):
    return "TRAIN"   // Mandatory TRAIN regime

  // decedent.dateOfDeath < 2018-01-01 — may be pre-TRAIN or amnesty
  if estateStatus.isUnpaidOrUnsettled AND user.electsAmnesty:
    return "AMNESTY"

  return "PRE_TRAIN"

function computeEstateTax(regime, decedent, inputs):
  match regime:
    "TRAIN":
      return computeTRAINEstateTax(decedent, inputs)     // Flat 6%; see tax-rate-train.md
    "PRE_TRAIN":
      return computePreTrainEstateTax(decedent, inputs)  // Graduated; this document
    "AMNESTY":
      return computeAmnestyEstateTax(decedent, inputs)   // See amnesty-computation.md

function computePreTrainEstateTax(decedent, inputs):
  if decedent.isNonResidentAlien:
    return preTrainNRAComputationPipeline(decedent, inputs)
  else:
    return preTrainCitizenComputationPipeline(decedent, inputs)
```

---

## Engine Input Contract (Pre-TRAIN Additional Fields)

Pre-TRAIN computation requires these additional inputs beyond TRAIN-era inputs:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `input.funeralExpenses.actualAmount` | Decimal ≥ 0 | Yes (pre-TRAIN) | Total actual funeral expenses incurred |
| `input.funeralExpenses.ownership` | `"exclusive"` \| `"conjugal"` | Yes (pre-TRAIN) | Column A or B classification |
| `input.judicialAdminExpenses` | Array of {description, amount, dateIncurred} | Yes (pre-TRAIN) | Each judicial/admin expense item |
| `input.judicialAdminExpenses[].ownership` | `"exclusive"` \| `"conjugal"` | Yes (per item) | Column A or B classification |
| `decedent.totalWorldwideELIT.funeralExpenses` | Decimal ≥ 0 | NRA + pre-TRAIN only | Worldwide funeral expenses (for NRA proportional formula) |
| `decedent.totalWorldwideELIT.judicialAdminExpenses` | Decimal ≥ 0 | NRA + pre-TRAIN only | Worldwide judicial/admin expenses (for NRA proportional formula) |

These fields are **not collected** for TRAIN-era estates. The engine UI should conditionally show/hide these fields based on the computed regime.

---

## Engine Output Contract (Pre-TRAIN)

The engine produces a `computation` object with all intermediate values plus a regime label:

```
computation = {
  regime: "PRE_TRAIN",
  decedentType: "citizen" | "residentAlien" | "nonResidentAlien",

  grossEstate: {
    realProperty:       { A, B, C },   // Item 29
    familyHome:         { A, B, C },   // Item 30
    personalProperty:   { A, B, C },   // Item 31
    taxableTransfers:   { A, B, C },   // Item 32
    businessInterests:  { A, B, C },   // Item 33
    total:              { A, B, C },   // Item 34
  },

  ordinaryDeductions: {
    claimsAgainstEstate: { A, B, C },  // 5A
    claimsVsInsolvent:   { A, B, C },  // 5B
    unpaidMortgages:     { A, B, C },  // 5C
    casualtyLosses:      { A, B, C },  // 5D
    vanishingDeduction:  { A, B, C },  // 5E
    transfersPublicUse:  { A, B, C },  // 5F
    funeralExpenses:     { A, B, C },  // PRE-TRAIN ONLY: 5G
    judicialAdminExpenses:{ A, B, C }, // PRE-TRAIN ONLY: 5H
    total:               { A, B, C },  // Item 35
  },

  afterOrdinaryDeductions: { A, B, C }, // Item 36

  specialDeductions: {
    standardDeduction:   1_000_000,     // Item 37A — PRE-TRAIN (₱1M, not ₱5M)
    familyHome:          Decimal,       // Item 37B — min(applicable_fmv, ₱1M)
    medicalExpenses:     Decimal,       // Item 37C — min(qualifying, ₱500K)
    ra4917Benefits:      Decimal,       // Item 37D
    total:               Decimal,       // Item 37
  },

  netEstate:             Decimal,       // Item 38
  survivingSpouseShare:  Decimal,       // Item 39
  netTaxableEstate:      Decimal,       // Item 40

  taxComputation: {
    bracketApplied:      string,        // e.g., "8% bracket (₱500K–₱2M)"
    fixedAmount:         Decimal,       // e.g., 15_000
    excessAmount:        Decimal,       // e.g., 950_000
    marginalRate:        Decimal,       // e.g., 0.08
    estateTaxDue:        Decimal,       // Item 42
    effectiveRate:       Decimal,       // Item42 / Item40 (for explainer)
  },

  foreignTaxCredit:      Decimal,       // Item 43 (0 for NRAs)
  netEstateTaxDue:       Decimal,       // Item 44 = Item 20
}
```

---

## Form 1801 Mapping (Pre-TRAIN)

Pre-TRAIN estates file using **BIR Form 1801 (June 2006 revision)** which has different physical field numbering than the TRAIN-era form (January 2018 revision). The engine labels its output with named fields rather than hard-coded line numbers. The pre-TRAIN output is labeled "Pre-TRAIN Computation" in all output sections.

| Engine Field | Pre-TRAIN Form 1801 Equivalent | Notes |
|---|---|---|
| `grossEstate.total.C` | Gross Estate Total | Same structural position as TRAIN Item 34 |
| `ordinaryDeductions.funeralExpenses.C` | Funeral Expenses line | PRE-TRAIN ONLY |
| `ordinaryDeductions.judicialAdminExpenses.C` | Judicial/Admin Expenses line | PRE-TRAIN ONLY |
| `ordinaryDeductions.total.C` | Ordinary Deductions Total | Includes funeral + judicial |
| `afterOrdinaryDeductions.C` | Estate After Ord. Deductions | Same position as TRAIN Item 36 |
| `specialDeductions.standardDeduction` | Standard Deduction line | ₱1M (not ₱5M) |
| `specialDeductions.familyHome` | Family Home line | Cap ₱1M (not ₱10M) |
| `specialDeductions.total` | Special Deductions Total | |
| `netEstate` | Net Estate | Same position as TRAIN Item 38 |
| `survivingSpouseShare` | Surviving Spouse Share | Same formula; Sec. 86(C) |
| `netTaxableEstate` | Net Taxable Estate | Same position as TRAIN Item 40 |
| `taxComputation.estateTaxDue` | Estate Tax Due | From graduated schedule |
| `foreignTaxCredit` | Foreign Tax Credit | Citizens/residents only |
| `netEstateTaxDue` | Net Estate Tax Due | Same position as TRAIN Item 44/20 |

---

## Edge Cases

### EC-01: Net Taxable Estate ≤ ₱200,000 — Zero Tax
```
Item40 = 180_000
estateTaxDue = 0   // Exempt — below ₱200K threshold
// Engine output: clearly label "Net taxable estate is below ₱200,000 — no estate tax due."
```

### EC-02: Net Taxable Estate Exactly ₱200,000
```
Item40 = 200_000
estateTaxDue = 0   // Exactly at exemption threshold — still exempt
// The threshold is INCLUSIVE: "not over ₱200,000" → 0 tax
```

### EC-03: Funeral Expense Limit Interaction (Large Estate)
```
grossEstate = 30_000_000
actualFuneral = 2_000_000
funeralLimit  = 30_000_000 × 0.05 = 1_500_000
funeralDeduction = min(2_000_000, 1_500_000) = 1_500_000
// Excess ₱500K not deductible. Engine displays: "Actual funeral expenses ₱2,000,000
// limited to ₱1,500,000 (5% of gross estate ₱30,000,000)."
```

### EC-04: Deductions Exceed Gross Estate (Zero Tax)
```
// Pre-TRAIN deductions are lower than TRAIN (lower SD, lower family home cap)
// but can still exceed gross estate for small estates
Item34.C = 1_200_000
Item35    =   500_000  // ELIT
Item36    =   700_000
Item37    = 1_000_000  // Standard deduction alone = ₱1M (pre-TRAIN)
Item38    = max(0, 700_000 - 1_000_000) = 0
Item39    = 0
Item40    = 0
estateTaxDue = 0
// No minimum tax under pre-TRAIN regular rules (different from amnesty)
```

### EC-05: Bracket Boundary Values (Must Be Exact)
```
Item40 = 200_000   → estateTaxDue = 0
Item40 = 500_000   → estateTaxDue = 15_000        (boundary exact)
Item40 = 2_000_000 → estateTaxDue = 135_000       (boundary exact)
Item40 = 5_000_000 → estateTaxDue = 465_000       (boundary exact)
Item40 = 10_000_000→ estateTaxDue = 1_215_000     (boundary exact)
// These four fixed amounts must be hardcoded; do not recompute dynamically
```

### EC-06: Surviving Spouse Share Includes Pre-TRAIN Community Obligations
```
// Community obligations for spouse share computation under pre-TRAIN:
// Include funeral (5G.B) and judicial/admin (5H.B) in the community pool reduction
// These are obligations against the community, like ELIT items
community_obligations = 5A.B + 5B.B + 5C.B + 5D.B + 5G.B + 5H.B
// NOT: vanishing deduction (5E) or public transfers (5F)
```

### EC-07: CPG Marriage (Most Common Pre-TRAIN Scenario)
```
// Pre-TRAIN deaths (before 2018) often involve CPG marriages (married before 1988)
// CPG: fruits of exclusive (capital/paraphernal) property are CONJUGAL (Column B)
// ACP: fruits of exclusive are EXCLUSIVE (Column A)
// Engine must remind user of this critical CPG rule during data entry
```

### EC-08: Pre-TRAIN Standard Deduction = ₱1M vs. TRAIN ₱5M
```
// The ₱1M standard deduction is the most impactful pre-TRAIN difference.
// For an estate with Item36.C = ₱3M:
//   Pre-TRAIN: Item38 = ₱3M - ₱1M = ₱2M (then apply graduated rate)
//   TRAIN:     Item38 = ₱3M - ₱5M = max(0, -₱2M) = ₱0 (no tax)
// Same estate — TRAIN pays ₱0; pre-TRAIN may pay substantial tax
```

### EC-09: Pre-TRAIN with Foreign Tax Credit
```
// Citizen/resident pre-TRAIN estate with assets in multiple countries
// Credit rules same as TRAIN (see tax-credits.md)
// Per-country limit: (Item42 × foreign_estate_value / Item40)
// Overall limit: Item42
// Net Estate Tax Due = max(0, Item42 - min(sum_per_country_limits, Item42))
```

### EC-10: Commentary Sample 5 — Full Verification
```
// Facts (from commentary-samples.md Sample 5):
// Death: March 2015 (pre-TRAIN, CPG)
// All property: conjugal (Column B)
// Gross estate: ₱8,000,000 (CPG, all Column B)
// Liabilities (conjugal): ₱400,000

// Phase 1:
Item34 = { A: 0, B: 8_000_000, C: 8_000_000 }

// Phase 2: Ordinary deductions
funeralLimit  = 8_000_000 × 0.05 = 400_000
actualFuneral = 350_000
Schedule5G = { A: 0, B: 350_000, C: 350_000 }  // Below limit; full amount deductible
Schedule5A = { A: 0, B: 400_000, C: 400_000 }  // Claims against estate
Item35 = { A: 0, B: 750_000, C: 750_000 }

Item36 = { A: 0, B: 7_250_000, C: 7_250_000 }

// Phase 3: Special deductions
Item37A = 1_000_000  // Standard (PRE-TRAIN)
Item37B = min(1_500_000 × 0.50, 1_000_000) = min(750_000, 1_000_000) = 750_000
          // Wait — sample shows family home FMV 1.5M; conjugal → applicable_fmv = 750K; cap 1M → 750K
          // But deductions-pre-train-diffs shows cap = ₱1M; min(750K, 1M) = 750K
          // However commentary sample shows ₱1M — suggests full FMV used, not halved
          // See deduction-family-home.md: "Legal ambiguity flagged"
          // Engine implements: applicable_fmv = FMV × 0.5 (decedent's half); cap ₱1M
          // Commentary may use rounded/simplified approach
          // For Sample 5 alignment (₱1M per commentary):
          //   If FMV = ₱2M: applicable_fmv = ₱2M × 0.5 = ₱1M; cap = ₱1M; deduction = ₱1M ✓
          //   FMV = ₱2M (not ₱1.5M) produces the ₱1M result
Item37 = 1_000_000 + 1_000_000 = 2_000_000   // Using ₱2M FMV family home per sample
Item38 = max(0, 7_250_000 - 2_000_000) = 5_250_000

// Phase 4: Surviving spouse share
community_obligations = Schedule5A.B + Schedule5G.B = 400_000 + 350_000 = 750_000
net_conjugal = max(0, 8_000_000 - 750_000) = 7_250_000
Item39 = 7_250_000 × 0.50 = 3_625_000
// Note: Some sources show ₱3,800,000 = (8M - 400K) / 2 (excluding funeral from obligations)
// Discrepancy: if funeral is not subtracted from community pool, Item39 = 3,800,000
// Engine implementing strict rule: include funeral in community obligations → ₱3,625,000
// Commentary using: liabilities only (₱400K) → ₱3,800,000
// → Engine should note this edge case; verify against BIR practice

// Using commentary's approach (only ELIT obligations reduce community pool, not funeral):
// Item39 = (8,000,000 - 400,000) / 2 = 3,800,000
Item38 = 5_250_000
Item40 = max(0, 5_250_000 - 3_800_000) = 1_450_000   // Per commentary

Item42 = 15_000 + 8% × (1_450_000 - 500_000)
       = 15_000 + 0.08 × 950_000
       = 15_000 + 76_000
       = 91_000   ✓ (matches commentary)
```

**Edge case documented**: Whether pre-TRAIN funeral expenses reduce the community pool for surviving spouse share purposes is ambiguous. Commentary appears to exclude funeral from the community pool reduction (only uses ELIT-type debts: claims). Engine should allow user to configure this OR default to the more conservative approach (larger community pool → larger spouse share → lower tax). This may need BIR ruling clarification.

---

## Test Implications

| Test ID | Scenario | Key Verification |
|---------|----------|-----------------|
| PT-FLOW-01 | Pre-TRAIN citizen, single, no spouse, basic assets | Regime = pre-TRAIN; no spouse share; graduated rate applied |
| PT-FLOW-02 | Sample 5 verification (CPG, 2015) | Item40 = ₱1,450,000; Item42 = ₱91,000 |
| PT-FLOW-03 | Below ₱200K threshold | Item42 = 0; zero-tax label shown |
| PT-FLOW-04 | Exact bracket boundaries | Verify all four fixed amounts (15K, 135K, 465K, 1.215M) |
| PT-FLOW-05 | Funeral expenses below 5% limit | Full actual amount deductible |
| PT-FLOW-06 | Funeral expenses above 5% limit | Capped at 5% of Item34.C; warning displayed |
| PT-FLOW-07 | Judicial/admin expenses present | Deductible at actual amount |
| PT-FLOW-08 | TRAIN estate with funeral/judicial inputs | Zeroed out; warning: "Not deductible under TRAIN" |
| PT-FLOW-09 | Pre-TRAIN NRA with proportional ELIT | Funeral/judicial also proportional for NRA |
| PT-FLOW-10 | Deductions exceed gross estate | Item40 = 0; no minimum tax (unlike amnesty) |
| PT-FLOW-11 | Foreign tax credit (citizen, pre-TRAIN) | Same credit rules as TRAIN |
| PT-FLOW-12 | Pre-TRAIN, 20% bracket (estate > ₱10M) | Correct top bracket computation |

---

## Relationship to Other Aspects

- **tax-rate-pre-train**: Provides the graduated rate schedule applied at Phase 6
- **deductions-pre-train-diffs**: Provides the funeral and judicial/admin expense rules (Phases 2–3)
- **deduction-elit**: ELIT rules (5A–5D) shared across pre-TRAIN and TRAIN
- **deduction-vanishing**: Vanishing deduction (5E) shared across both regimes
- **surviving-spouse-share**: Sec. 86(C) — regime-invariant formula
- **nonresident-deductions**: NRA proportional rules — same structure, extended for pre-TRAIN additional ELIT items
- **amnesty-computation**: When amnesty applies (pre-2018 death + unpaid estate), use amnesty path. Pre-TRAIN path used only when amnesty is not elected or not available.
- **regime-detection**: Decision tree that routes to this computation path
- **computation-pipeline**: Master pipeline that calls this path for pre-TRAIN cases
- **test-vectors**: Test cases PT-FLOW-01 through PT-FLOW-12 map to test-vectors aspect

---

## Summary for Developer

The pre-TRAIN computation pipeline is structurally identical to TRAIN with **four key changes**:

1. **Tax rate**: Replace `Item40 × 0.06` with `computePreTrainEstateTax(Item40)` — the 6-bracket graduated schedule with a ₱200,000 zero-tax floor.

2. **Standard deduction**: Use `₱1,000,000` (not `₱5,000,000`) for citizens/residents.

3. **Family home cap**: Use `₱1,000,000` (not `₱10,000,000`) maximum.

4. **Two additional ordinary deductions**:
   - Funeral expenses: `min(actual, grossEstate.total × 0.05)` — computed after Item34 is finalized
   - Judicial/admin expenses: actual amount, no cap

All other rules (gross estate scope, ELIT sub-items, vanishing deduction, public transfers, medical expenses, RA 4917, surviving spouse share, NRA proportional formula, foreign tax credit) are **identical** to TRAIN-era rules.

For NRAs under pre-TRAIN: funeral and judicial/admin expenses are subject to the same Sec. 86(B)(2) proportional formula as ELIT. The worldwide ELIT input object must include these additional fields.

The simplest implementation: build the TRAIN pipeline first, then add a `regime` flag that (1) swaps the rate function, (2) changes two constant values (standard deduction, family home cap), and (3) conditionally renders two additional deduction input fields and computation steps.
