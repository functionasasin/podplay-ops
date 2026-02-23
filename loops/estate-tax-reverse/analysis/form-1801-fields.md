# Form 1801 Field Mapping — Engine Output Contract

**Source**: `input/legal-sources/form-1801-fields.md`
**Purpose**: Defines the complete output contract for the estate tax computation engine. Every value the engine produces must map to a specific field/item on BIR Form 1801 (January 2018 ENCS version).

---

## Overview

BIR Form 1801 is the official Estate Tax Return for deaths on or after January 1, 2018 (TRAIN-era). The engine's output must fully populate the computation sections of this form:

- **Part IV** — Computation of Tax (summary values, Items 29–44/20)
- **Part V** — Schedules 1 through 6A (detail worksheets that feed Part IV)
- **Part I** — Decedent/Estate identification fields (informational, not computed)
- **Part III** — Payment fields (base tax only; surcharges/interest out of scope)

---

## Part I — Informational Fields (Engine Inputs, Not Computed)

These fields are provided as inputs to the engine. The engine echoes them to the output for Form 1801 population but does not compute them.

| Field ID | Form Label | Engine Input Field | Notes |
|----------|-----------|-------------------|-------|
| F1 | Date of Death | `decedent.dateOfDeath` | Drives regime selection |
| F2 | Amended Return | `filing.isAmended` | Boolean |
| F3 | Number of Sheets Attached | `filing.sheetsAttached` | Count of schedules |
| F4 | ATC | — | Always "ES 010" (hardcoded) |
| F5 | TIN of Estate | `estate.tin` | Optional |
| F6 | Name of Decedent | `decedent.name` | Last, First, Middle |
| F7 | Decedent's Address | `decedent.address` | Full address |
| F8 | Citizenship | `decedent.citizenship` | e.g., "Filipino" |
| F9 | Non-Resident Alien | `decedent.isNonResidentAlien` | Boolean; true → NRA deduction rules |
| F10 | Name of Executor/Administrator | `executor.name` | |
| F11 | TIN of Executor/Administrator | `executor.tin` | |
| F12 | Contact Number | `executor.contactNumber` | |
| F13 | Email Address | `executor.email` | |
| F14 | Tax relief under Special Law/Tax Treaty | `filing.hasTaxRelief` | Boolean |
| F15A | Extension to file granted | `filing.extensionToFile` | Boolean |
| F15B | Estate settled judicially | `filing.judicialSettlement` | Boolean |
| F15C | Extension to pay tax granted | `filing.extensionToPay` | Boolean |
| F15D | Installment payment granted | `filing.installmentGranted` | Boolean; if true, also frequency |

**Engine note**: `decedent.isNonResidentAlien` (F9) is critical — it selects between the ₱5M standard deduction (citizens/residents) and ₱500K (NRA), and between worldwide gross estate and PH-situs-only gross estate.

---

## Part III — Details of Payment (Partial Scope)

The engine computes Item 20 only. All other fields are outside engine scope.

| Item | Form Label | Engine Output | Notes |
|------|-----------|---------------|-------|
| Item 20 | Tax Due | `output.netEstateTaxDue` | = Item 44; engine primary output |
| Item 21 | Total Tax Paid in Previous Installments | OUT OF SCOPE | Filled by filer |
| Item 22 | Tax Still Due | OUT OF SCOPE | Item 20 − Item 21 |
| Item 23A | Surcharge | OUT OF SCOPE | Penalty; not computed by engine |
| Item 23B | Interest | OUT OF SCOPE | Penalty; not computed by engine |
| Item 23C | Compromise Penalty | OUT OF SCOPE | Penalty; not computed by engine |
| Item 23D | Total Penalties | OUT OF SCOPE | Sum of 23A–23C |
| Item 24 | Total Amount Payable | OUT OF SCOPE | Item 22 + 23D |

---

## Part IV — Computation of Tax (Engine's Core Output)

The form uses three columns for Part IV items:
- **Column A (Exclusive)**: Property belonging solely to the decedent
- **Column B (Conjugal/Communal)**: Property held jointly with surviving spouse
- **Column C (Total)**: Column A + Column B

The engine must compute and output all three column values for each item.

### Gross Estate Items

| Item | Form Label | Engine Output Field | Schedule Source | Formula |
|------|-----------|--------------------|--------------------|---------|
| Item 29 | Real Properties (excl. Family Home) | `grossEstate.realProperty` | Schedule 1 | Sum of all real property FMVs except family home |
| Item 30 | Family Home | `grossEstate.familyHome` | Schedule 1A | FMV of family home (pre-cap; cap applied at Item 37B) |
| Item 31 | Personal Properties | `grossEstate.personalProperty` | Schedules 2 + 2A | Cash + deposits + receivables + shares + vehicles + jewelry + other tangibles |
| Item 32 | Taxable Transfers | `grossEstate.taxableTransfers` | Schedule 3 | Transfers in contemplation of death + revocable transfers + general power of appointment + life insurance (estate/revocable beneficiary) |
| Item 33 | Business Interest | `grossEstate.businessInterest` | Schedule 4 | Net equity of sole proprietorship or partnership interest |
| **Item 34** | **Gross Estate (TOTAL)** | `grossEstate.total` | — | Item 29 + 30 + 31 + 32 + 33 (all columns) |

### Deduction Items

| Item | Form Label | Engine Output Field | Schedule Source | Formula |
|------|-----------|--------------------|--------------------|---------|
| Item 35 | Ordinary Deductions | `deductions.ordinaryTotal` | Schedule 5 | Sum of 5A through 5G |
| **Item 36** | **Estate After Ordinary Deductions** | `computation.estateAfterOrdinary` | — | Item 34 − Item 35 |
| Item 37A | Standard Deduction | `deductions.standardDeduction` | Auto | ₱5,000,000 (citizen/resident) or ₱500,000 (NRA) |
| Item 37B | Family Home (Special Deduction) | `deductions.familyHomeDeduction` | Schedule 1A | min(Schedule 1A FMV, ₱10,000,000) |
| Item 37C | Medical Expenses | `deductions.medicalExpenses` | Schedule 6C | Actual expenses ≤ ₱500,000; incurred within 1 year before death |
| Item 37D | Amounts under RA 4917 | `deductions.ra4917` | Supporting sched. | Retirement/death benefits from employer plans under RA 4917 |
| **Item 37** | **Total Special Deductions** | `deductions.specialTotal` | — | Items 37A + 37B + 37C + 37D |
| **Item 38** | **Net Estate** | `computation.netEstate` | — | Item 36 − Item 37 |
| Item 39 | Share of Surviving Spouse | `deductions.survivingSpouseShare` | Schedule 6A | 50% × net conjugal/community property after conjugal deductions |
| **Item 40** | **Net Taxable Estate** | `computation.netTaxableEstate` | — | Item 38 − Item 39 |

### Tax Computation

| Item | Form Label | Engine Output Field | Formula |
|------|-----------|--------------------|----|
| Item 41 | Tax Rate | — | Always 6% (0.06) for TRAIN-era |
| **Item 42** | **Estate Tax Due** | `computation.estateTaxDue` | Item 40 × 0.06 |
| Item 43 | Less: Tax Credits | `deductions.foreignTaxCredit` | Foreign estate taxes paid on PH assets taxed abroad |
| **Item 44** | **Net Estate Tax Due** | `output.netEstateTaxDue` | Item 42 − Item 43 (min 0) |

**Item 20 = Item 44** (for initial filings; installment filers carry different logic, out of scope).

---

## Part V — Schedules (Detail Worksheets)

### Schedule 1 — Real Properties (Excluding Family Home)

Each real property entry requires:

| Column | Engine Input | Notes |
|--------|-------------|-------|
| OCT/TCT/CCT Number | `asset.titleNumber` | Certificate of title |
| Tax Declaration Number | `asset.taxDeclarationNumber` | Local assessor reference |
| Location | `asset.location` | Address |
| Lot Area (sq.m.) | `asset.lotArea` | Informational |
| Improvement Area (sq.m.) | `asset.improvementArea` | Informational |
| Classification | `asset.classification` | Residential/Commercial/Agricultural/Industrial |
| FMV per Tax Declaration | `asset.fmvTaxDeclaration` | Engine input (pre-valued) |
| FMV per BIR (Zonal) | `asset.fmvBir` | Engine input (pre-valued) |
| FMV Used | `asset.fmv` | **Must be the higher of the two** |
| Ownership | `asset.ownership` | "exclusive" or "conjugal" |

**Engine rule**: `asset.fmv = max(asset.fmvTaxDeclaration, asset.fmvBir)`

Total of Column A → `grossEstate.realProperty.exclusive`
Total of Column B → `grossEstate.realProperty.conjugal`
Schedule 1 Total → Part IV Item 29

### Schedule 1A — Family Home

Same structure as Schedule 1, but only for the designated family home property.

Additional required field:
- `asset.barangayCertification` (Boolean) — Was barangay captain certification obtained?

**Engine rule**:
- The FMV entered here is the full FMV of the family home (not capped here)
- Cap of ₱10,000,000 is applied at Part IV Item 37B (deduction side)
- If `asset.barangayCertification = false`, family home deduction cannot be claimed

Total → Part IV Item 30

### Schedule 2 — Personal Properties (Financial/Investment)

Each entry:

| Sub-category | Engine Input Field | Valuation Rule |
|---|---|---|
| Cash on hand | `assets.cashOnHand` | Face value |
| Cash in bank | `assets.cashInBank` | Balance at date of death |
| Accounts receivable | `assets.accountsReceivable` | Face value (if collectible) |
| Notes receivable | `assets.notesReceivable` | Face value |
| Shares of stock (listed) | `assets.sharesListed` | Closing market price on date of death (pre-valued by user) |
| Shares of stock (unlisted) | `assets.sharesUnlisted` | Book value per share (pre-valued by user) |
| Bonds/debentures | `assets.bonds` | FMV (pre-valued by user) |
| Mutual funds | `assets.mutualFunds` | NAV at date of death (pre-valued by user) |

**Engine note**: All valuations are pre-valued by user. Engine does not compute valuations.

Each item tagged as `ownership: "exclusive"` or `ownership: "conjugal"`.

Subtotal → (combined with Schedule 2A for Part IV Item 31)

### Schedule 2A — Personal Properties (Tangible/Other)

| Sub-category | Engine Input Field |
|---|---|
| Motor vehicles | `assets.motorVehicles[].fmv` |
| Jewelry | `assets.jewelry[].fmv` |
| Other tangible personal property | `assets.otherTangibles[].fmv` |

Each item: description, quantity, FMV.

Total Schedule 2 + 2A → Part IV Item 31

### Schedule 3 — Taxable Transfers

For each taxable transfer:

| Column | Engine Input | Notes |
|---|---|---|
| Description | `transfer.description` | What was transferred |
| Date of Transfer | `transfer.dateOfTransfer` | |
| Type | `transfer.type` | contemplation_of_death / revocable / power_of_appointment / life_insurance / insufficient_consideration |
| Consideration Received | `transfer.consideration` | Cash/property received by decedent (0 if gift) |
| FMV at Date of Death | `transfer.fmvAtDeath` | Pre-valued by user |
| Taxable Amount | Computed | `max(0, transfer.fmvAtDeath − transfer.consideration)` |

Total → Part IV Item 32

### Schedule 4 — Business Interest

For each business:

| Column | Engine Input |
|---|---|
| Name of Business | `business.name` |
| Nature of Business | `business.nature` |
| Net Equity | `business.netEquity` |

**Engine rule**: Net equity = business assets − business liabilities (pre-computed by user and provided as input).

Total → Part IV Item 33

### Schedule 5 — Ordinary Deductions

| Line | Item | Engine Input Field | Conditions |
|------|------|--------------------|------------|
| 5A | Claims Against the Estate | `deductions.claimsAgainstEstate` | Must be owing at time of death; notarized; valid debt |
| 5B | Claims Against Insolvent Persons | `deductions.claimsVsInsolvent` | Claim must be included in gross estate first |
| 5C | Unpaid Mortgages, Taxes, Casualty Losses | `deductions.unpaidMortgages` | Mortgage on property in gross estate; taxes due at time of death; losses during settlement |
| 5D | Losses During Settlement | `deductions.lossesSettlement` | Often combined with 5C |
| 5E | Vanishing Deduction (Previously Taxed Property) | `deductions.vanishingDeduction` | Computed per formula (see analysis/deduction-vanishing.md when available) |
| 5F | Transfers for Public Use | `deductions.transfersPublicUse` | Bequest to government for exclusively public use |
| 5G | Other Deductions | `deductions.otherOrdinary` | Specify |
| **5H** | **Total Ordinary Deductions** | `deductions.ordinaryTotal` | Sum of 5A–5G |

Exclusivity split (A/B columns) required for each item.

Total → Part IV Item 35

### Schedule 6 — Special Deductions

| Line | Item | Engine Output | Rule |
|------|------|--------------|------|
| 6A | Standard Deduction | `deductions.standardDeduction` | ₱5,000,000 if citizen/resident; ₱500,000 if NRA. No documentation required; automatic. |
| 6B | Family Home | `deductions.familyHomeDeduction` | `min(grossEstate.familyHome, 10_000_000)`. Requires barangay certification and decedent must have been a citizen/resident. |
| 6C | Medical Expenses | `deductions.medicalExpenses` | `min(actualMedicalExpenses, 500_000)`. Expenses must have been incurred within 1 year before date of death. Requires receipts. |
| 6D | Amounts under RA 4917 | `deductions.ra4917` | Death benefits from employer retirement plans under RA 4917. Full amount deductible. |
| **6E** | **Total Special Deductions** | `deductions.specialTotal` | Sum of 6A–6D |

Feeds Part IV Items 37A–37D and Item 37.

### Schedule 6A — Surviving Spouse Share Computation

| Line | Description | Engine Field | Formula |
|------|-------------|-------------|---------|
| a | Total Conjugal/Community Property | `spousalShare.totalConjugal` | Sum of all Column B (conjugal) items in gross estate |
| b | Less: Obligations Charged to Conjugal Property | `spousalShare.conjugalObligations` | Ordinary deductions attributable to conjugal property (Column B of Schedule 5) |
| c | Net Conjugal/Community Property | `spousalShare.netConjugal` | a − b |
| d | Surviving Spouse Share | `deductions.survivingSpouseShare` | c × 0.50 |

Carried to Part IV Item 39.

---

## Complete Engine Output Contract (Canonical List)

The engine must produce ALL of the following values to fully populate Form 1801:

```
IDENTIFICATION (pass-through from inputs)
─────────────────────────────────────────
decedent.dateOfDeath          → Part I, Field 1
decedent.name                 → Part I, Field 6
decedent.address              → Part I, Field 7
decedent.citizenship          → Part I, Field 8
decedent.isNonResidentAlien   → Part I, Field 9
executor.name                 → Part I, Field 10
[...other identification fields as listed in Part I section]

GROSS ESTATE BREAKDOWN
──────────────────────
grossEstate.realProperty.exclusive   → Item 29, Column A
grossEstate.realProperty.conjugal    → Item 29, Column B
grossEstate.realProperty.total       → Item 29, Column C
grossEstate.familyHome.exclusive     → Item 30, Column A
grossEstate.familyHome.conjugal      → Item 30, Column B
grossEstate.familyHome.total         → Item 30, Column C
grossEstate.personalProperty.exclusive → Item 31, Column A
grossEstate.personalProperty.conjugal  → Item 31, Column B
grossEstate.personalProperty.total     → Item 31, Column C
grossEstate.taxableTransfers.exclusive → Item 32, Column A
grossEstate.taxableTransfers.conjugal  → Item 32, Column B
grossEstate.taxableTransfers.total     → Item 32, Column C
grossEstate.businessInterest.exclusive → Item 33, Column A
grossEstate.businessInterest.conjugal  → Item 33, Column B
grossEstate.businessInterest.total     → Item 33, Column C
grossEstate.total.exclusive          → Item 34, Column A
grossEstate.total.conjugal           → Item 34, Column B
grossEstate.total.total              → Item 34, Column C

ORDINARY DEDUCTIONS (Schedule 5)
──────────────────────────────────
deductions.claimsAgainstEstate.exclusive  → Sched 5A, Col A
deductions.claimsAgainstEstate.conjugal   → Sched 5A, Col B
deductions.claimsVsInsolvent.exclusive    → Sched 5B, Col A
deductions.claimsVsInsolvent.conjugal     → Sched 5B, Col B
deductions.unpaidMortgages.exclusive      → Sched 5C, Col A
deductions.unpaidMortgages.conjugal       → Sched 5C, Col B
deductions.lossesSettlement.exclusive     → Sched 5D, Col A
deductions.lossesSettlement.conjugal      → Sched 5D, Col B
deductions.vanishingDeduction.exclusive   → Sched 5E, Col A
deductions.vanishingDeduction.conjugal    → Sched 5E, Col B
deductions.transfersPublicUse.exclusive   → Sched 5F, Col A
deductions.transfersPublicUse.conjugal    → Sched 5F, Col B
deductions.ordinaryTotal.exclusive        → Item 35, Col A
deductions.ordinaryTotal.conjugal         → Item 35, Col B
deductions.ordinaryTotal.total            → Item 35, Col C

INTERMEDIATE COMPUTATION
──────────────────────────────────
computation.estateAfterOrdinary.exclusive → Item 36, Col A
computation.estateAfterOrdinary.conjugal  → Item 36, Col B
computation.estateAfterOrdinary.total     → Item 36, Col C

SPECIAL DEDUCTIONS (Schedule 6)
──────────────────────────────────
deductions.standardDeduction            → Item 37A (single column; no A/B split)
deductions.familyHomeDeduction          → Item 37B
deductions.medicalExpenses              → Item 37C
deductions.ra4917                       → Item 37D
deductions.specialTotal                 → Item 37

NET ESTATE & SPOUSE SHARE
──────────────────────────────────
computation.netEstate                   → Item 38
deductions.survivingSpouseShare         → Item 39
computation.netTaxableEstate            → Item 40

TAX COMPUTATION
──────────────────────────────────
[taxRate]                               → Item 41 (always 6%)
computation.estateTaxDue                → Item 42
deductions.foreignTaxCredit             → Item 43
output.netEstateTaxDue                  → Item 44 = Item 20
```

---

## Column A/B Split Rules

The engine must track exclusive vs. conjugal/communal ownership throughout. Rules for determining the split:

| Scenario | Column A (Exclusive) | Column B (Conjugal/Communal) |
|----------|---------------------|------------------------------|
| Property acquired before marriage | Full value | — |
| Property acquired during marriage under ACP | — | Full value |
| Property acquired during marriage under CPG (from common funds) | — | Full value |
| Property acquired during marriage under CPG (from exclusive funds or by inheritance/donation) | Full value | — |
| Complete Separation of Property | Full value | — |
| Property acquired under separation | Full value | — |
| Life insurance (estate/revocable) from conjugal premiums | — | Full value |
| Life insurance (estate/revocable) from exclusive premiums | Full value | — |

For deductions:
- Debts incurred for exclusive property → Column A
- Debts incurred for conjugal/communal property → Column B
- Standard deduction, family home, medical, RA 4917 → No A/B split (applied at net estate level)
- Surviving spouse share → Computed from Column B only (see Schedule 6A)

---

## Regime Differences: Form 1801 Usage

BIR Form 1801 (Jan 2018) is the TRAIN-era form. For pre-TRAIN estates and amnesty estates:

| Regime | Form Used | Engine Differences |
|--------|-----------|-------------------|
| TRAIN (death ≥ Jan 1, 2018) | Form 1801 (Jan 2018 ENCS) | Standard output; this mapping |
| Pre-TRAIN (death before Jan 1, 2018) | Old Form 1801 (or 1801A) | Different rate (graduated); different deduction caps; engine should note regime clearly |
| Estate Tax Amnesty (RA 11213) | BIR Form 2118-E (Amnesty) | Different form entirely; different fields; limited deductions |

**Engine output contract for non-TRAIN regimes**: The engine should produce a parallel output structure adapted for the applicable form. The Form 1801 field mapping above applies to TRAIN-era only. Pre-TRAIN and amnesty forms will be mapped in their respective analysis files.

---

## Validation Rules (Engine Constraints)

The engine must enforce these relationships. If violated, it signals a computation error:

1. `grossEstate.total.total = Item29.total + Item30.total + Item31.total + Item32.total + Item33.total`
2. `computation.estateAfterOrdinary.total = grossEstate.total.total − deductions.ordinaryTotal.total`
3. `computation.netEstate = computation.estateAfterOrdinary.total − deductions.specialTotal`
4. `computation.netTaxableEstate = computation.netEstate − deductions.survivingSpouseShare`
5. `computation.netTaxableEstate >= 0` (cannot be negative; floor at 0)
6. `computation.estateTaxDue = computation.netTaxableEstate × 0.06`
7. `output.netEstateTaxDue = max(0, computation.estateTaxDue − deductions.foreignTaxCredit)`
8. `deductions.familyHomeDeduction = min(grossEstate.familyHome.total, 10_000_000)` and only if decedent was citizen/resident AND barangay certification obtained
9. `deductions.medicalExpenses <= 500_000`
10. `deductions.standardDeduction = 5_000_000` if citizen/resident; `= 500_000` if NRA

---

## Test Implications

This field mapping creates the following test requirements:

1. **Column split correctness**: Every gross estate item must correctly split into A (exclusive) and B (conjugal) columns, summing to C (total).
2. **Family home cap**: Test that family home FMV of ₱15M is capped at ₱10M in Item 37B but reported as ₱15M in Item 30.
3. **NRA flag**: Test that NRA flag correctly sets standard deduction to ₱500K and excludes non-PH assets.
4. **Zero tax floor**: Test that net taxable estate of ₱0 (deductions exceed gross estate) produces Item 42 = ₱0.
5. **Foreign tax credit cap**: Test that tax credit cannot exceed estate tax due (Item 44 ≥ 0).
6. **No spouse**: Test that surviving spouse share (Item 39) = ₱0 when decedent is single/widowed.
7. **Vanishing deduction in column split**: Test that vanishing deduction is allocated to correct column (A or B) based on ownership of the previously-taxed property.
8. **Ordinary deductions floor**: Test that Item 36 ≥ 0 when ordinary deductions could theoretically exceed gross estate (BIR practice is to floor at 0 or carry the excess differently — needs clarification from legal sources).

---

## Edge Cases Identified

- **Family home not certified**: If barangay captain certification is absent, Item 37B = 0 even if property is in Schedule 1A. Engine must validate.
- **No surviving spouse**: Item 39 = 0. Schedule 6A is omitted.
- **Pure exclusive estate**: All Column B values = 0. Item 39 = 0 (no conjugal property to divide).
- **Medical expenses from conjugal funds**: Still deductible up to ₱500K; no A/B split required at the deduction stage (special deduction applies to net estate).
- **Multiple properties as family home**: Only one property qualifies as family home. If user inputs multiple, engine should flag an error.
- **Business interest net equity negative**: Net equity (assets − liabilities) < 0 should be treated as ₱0, not negative. Business cannot add a negative to gross estate.
- **Transfers for insufficient consideration (Section 85G)**: The taxable amount is FMV − consideration received. If consideration ≥ FMV, taxable amount = 0 (bona fide sale; not included).
