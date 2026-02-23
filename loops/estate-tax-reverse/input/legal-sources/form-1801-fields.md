# BIR Form 1801 — Estate Tax Return
## Complete Field Mapping (January 2018 ENCS Version)

**Source**: BIR official guidelines (bir-cdn.bir.gov.ph), BIR Form 1801 GL final rev.pdf, search result data
**Applicable to**: Estate Tax Returns for deaths on or after January 1, 2018

---

## Overview

BIR Form 1801 (January 2018 ENCS) is the official Estate Tax Return used for all estate tax filings under the TRAIN-era rules. It consists of:
- **Part I**: Taxpayer/Decedent Information
- **Part II**: [Not separately listed; incorporated in Part I]
- **Part III**: Details of Payment
- **Part IV**: Computation of Tax (Summary)
- **Part V**: Schedules (Detailed computation worksheets)

The engine output must map to Part IV (summary values) and Part V (schedule details).

---

## Part I — Taxpayer Information

| Field | Description |
|---|---|
| Field 1 | Date of Death (MM/DD/YY) |
| Field 2 | Amended Return? (Yes/No) |
| Field 3 | Number of Sheets Attached |
| Field 4 | ATC (Alphanumeric Tax Code) = ES 010 |
| Field 5 | TIN of Estate |
| Field 6 | Name of Decedent (Last, First, Middle) |
| Field 7 | Decedent's Address |
| Field 8 | Citizenship |
| Field 9 | Non-Resident Alien? (Yes/No) |
| Field 10 | Name of Executor/Administrator |
| Field 11 | TIN of Executor/Administrator |
| Field 12 | Contact Number |
| Field 13 | Email Address |
| Field 14 | Tax relief under Special Law/Tax Treaty? (Yes/No) |
| Field 15A | Extension to file granted? (Yes/No) |
| Field 15B | Estate settled judicially? (Yes/No) |
| Field 15C | Extension to pay tax granted? (Yes/No) |
| Field 15D | Installment payment granted? (Yes/No); if yes, frequency |

---

## Part III — Details of Payment

| Field | Description |
|---|---|
| Field 20 | Tax Due (from Part IV, Item 20) |
| Field 21 | Total Tax Paid in Previous Installments |
| Field 22 | Tax Still Due (Item 20 − Item 21) |
| Field 23A | Surcharge (if applicable) |
| Field 23B | Interest (if applicable) |
| Field 23C | Compromise Penalty (if applicable) |
| Field 23D | Total Penalties (23A + 23B + 23C) |
| Field 24 | **TOTAL AMOUNT PAYABLE** = Item 22 + Item 23D |
| Field 25 | Cash/Bank Debit Memo |
| Field 26 | Check |
| Field 27 | Tax Debit Memo |
| Field 28 | Others |

*Note: Engine computes base tax only (Field 20 / Item 20). Surcharges, interest, and penalties (Fields 23A-D) are outside engine scope.*

---

## Part IV — Computation of Tax

This is the summary computation section. Uses **three columns**:
- **Column A**: Exclusive property of the decedent
- **Column B**: Conjugal/Communal property
- **Column C**: Total (A + B)

### Gross Estate Items

| Item | Description | Source |
|---|---|---|
| Item 29 | Real Properties (excluding Family Home) | Part V, Schedule 1 |
| Item 30 | Family Home | Part V, Schedule 1A |
| Item 31 | Personal Properties | Part V, Schedules 2 and 2A |
| Item 32 | Taxable Transfers | Part V, Schedule 3 |
| Item 33 | Business Interest | Part V, Schedule 4 |
| **Item 34** | **Gross Estate** | Sum of Items 29 through 33 |

### Deduction Items

| Item | Description | Source |
|---|---|---|
| Item 35 | Less: Ordinary Deductions | Part V, Schedule 5 |
| **Item 36** | **Estate After Ordinary Deductions** | Item 34 − Item 35 |
| Item 37A | Less: Standard Deduction | Auto: ₱5M (citizen/resident) or ₱500K (NRA) |
| Item 37B | Less: Family Home (Special Deduction) | Schedule 1A value, capped at ₱10M |
| Item 37C | Less: Medical Expenses | Schedule 6 (if applicable) |
| Item 37D | Less: Amounts under RA 4917 | Supporting schedule |
| **Item 37** | **Total Special Deductions** | Sum of Items 37A through 37D |
| **Item 38** | **Net Estate** | Item 36 − Item 37 |
| Item 39 | Less: Share of Surviving Spouse | Schedule 6A or computed |
| **Item 40** | **Net Taxable Estate** | Item 38 − Item 39 |

### Tax Computation

| Item | Description |
|---|---|
| Item 41 | Tax Rate | 6% (0.06) |
| **Item 42** | **Estate Tax Due** | Item 40 × 0.06 |
| Item 43 | Less: Tax Credits (Foreign estate taxes paid) | Supporting documentation |
| **Item 44** | **Net Estate Tax Due** | Item 42 − Item 43 |
| **Item 20** | **Estate Tax Payable** (= Item 44 for initial filing) | Carried to Part III |

*Note: Item numbers may vary slightly by version. The engine must produce all values from Item 29 through Item 44/20.*

---

## Part V — Schedules (Detail Worksheets)

### Schedule 1 — Real Properties (Excluding Family Home)

Columns per property:
- OCT/TCT/CCT Number
- Tax Declaration Number
- Location
- Lot Area (sq.m.)
- Improvement Area (sq.m.)
- Classification (Residential/Commercial/Agricultural/Industrial)
- FMV per Tax Declaration (assessed value)
- FMV per BIR (zonal value)
- FMV whichever is higher ← **This is the value entered**

**A (Exclusive) / B (Conjugal/Communal)** columns for each property.

Total carried to Part IV, Item 29.

### Schedule 1A — Family Home

Same column structure as Schedule 1, but for the family home property only.

Additional field:
- Certification from Barangay Captain (attached? Yes/No)

Value entered: FMV of family home (up to ₱10M cap applied in Part IV)

Total carried to Part IV, Item 30.

### Schedule 2 — Personal Properties (Cash, Bank Deposits, Receivables, Investments)

Items include:
- Cash on hand and in banks
- Accounts/notes receivable
- Shares of stock (listed: at closing market price on date of death; unlisted: book value)
- Investments (bonds, mutual funds)
- Other personal property

**A (Exclusive) / B (Conjugal/Communal)** columns.

Total carried to Part IV, Item 31 (along with Schedule 2A).

### Schedule 2A — Personal Properties (Other)

Continuation of Schedule 2 for:
- Motor vehicles (FMV per LTO records or appraisal)
- Jewelry and other valuables
- Other tangible personal property not elsewhere classified

Total combined with Schedule 2 into Part IV, Item 31.

### Schedule 3 — Taxable Transfers

Transfers included in gross estate under Section 85(B)-(G):
- Transfers in contemplation of death
- Revocable transfers
- Property under general powers of appointment
- Life insurance proceeds (revocably designated or payable to estate)
- Transfers for insufficient consideration (excess portion)

For each transfer:
- Description of property
- Date of transfer
- Consideration received (if any)
- FMV at death
- Taxable amount (FMV − consideration)

Total carried to Part IV, Item 32.

### Schedule 4 — Business Interest

For sole proprietorships or partnerships:
- Name of business
- Nature of business
- Net equity (assets minus liabilities of business)

Total carried to Part IV, Item 33.

### Schedule 5 — Ordinary Deductions

| Line | Item | A (Exclusive) | B (Conjugal/Communal) |
|---|---|---|---|
| 5A | Claims Against the Estate | — | — |
| 5B | Claims of Deceased Against Insolvent Persons | — | — |
| 5C | Unpaid Mortgages, Taxes, and Casualty Losses | — | — |
| 5D | Losses Incurred During Settlement | — | — |
| 5E | Property Previously Taxed (Vanishing Deduction) | — | — |
| 5F | Transfers for Public Use | — | — |
| 5G | Others (specify) | — | — |
| **5H** | **Total Ordinary Deductions** | — | — |

Total carried to Part IV, Item 35.

### Schedule 6 — Special Deductions

| Line | Item | Amount |
|---|---|---|
| 6A | Standard Deduction (₱5M or ₱500K) | Auto-populated |
| 6B | Family Home (from Schedule 1A, ≤₱10M) | — |
| 6C | Medical Expenses (within 1 year, ≤₱500K) | — |
| 6D | Amounts under RA 4917 | — |
| **6E** | **Total Special Deductions** | Sum of 6A-6D |

This schedule feeds Part IV Items 37A-37D.

### Schedule 6A (or Schedule for Surviving Spouse Share)

Documents the computation of the surviving spouse's net share:
- Total community/conjugal property
- Less: Obligations charged to community/conjugal property
- Net community/conjugal property
- Surviving spouse share = Net community/conjugal property × 50%

Carried to Part IV, Item 39.

---

## Key Mapping: Engine Output → Form 1801 Fields

The engine must compute and output the following values to populate Form 1801:

```
Engine Output                           → Form 1801 Field
────────────────────────────────────────────────────────
grossEstate.realProperty               → Item 29 / Schedule 1
grossEstate.familyHome                 → Item 30 / Schedule 1A
grossEstate.personalProperty           → Item 31 / Schedules 2 & 2A
grossEstate.taxableTransfers           → Item 32 / Schedule 3
grossEstate.businessInterest           → Item 33 / Schedule 4
grossEstate.total                      → Item 34
ordinaryDeductions.claimsAgainstEstate → Schedule 5A
ordinaryDeductions.claimsVsInsolvent   → Schedule 5B
ordinaryDeductions.unpaidMortgages     → Schedule 5C
ordinaryDeductions.losses              → Schedule 5D
ordinaryDeductions.vanishingDeduction  → Schedule 5E
ordinaryDeductions.transfersPublicUse  → Schedule 5F
ordinaryDeductions.total               → Item 35
estateAfterOrdinaryDeductions          → Item 36
specialDeductions.standardDeduction    → Item 37A
specialDeductions.familyHome           → Item 37B
specialDeductions.medicalExpenses      → Item 37C
specialDeductions.ra4917               → Item 37D
specialDeductions.total                → Item 37
netEstate                              → Item 38
survivingSpouseShare                   → Item 39
netTaxableEstate                       → Item 40
taxRate                                → Item 41 (6%)
estateTaxDue                           → Item 42
foreignTaxCredit                       → Item 43
netEstateTaxDue                        → Item 44 / Item 20
```

---

## Notes on Exclusive vs. Conjugal/Communal Property

The form requires splitting all values into:
- **Column A (Exclusive)**: Property that belongs solely to the decedent
- **Column B (Conjugal/Communal)**: Property held jointly with surviving spouse

For computing tax:
- Column C = Column A + Column B (total gross estate for tax purposes)
- Surviving spouse share is then deducted to arrive at net taxable estate

The engine must track which assets are exclusive vs. conjugal/communal for proper form population.
