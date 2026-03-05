# Analysis: Test Vectors

**Aspect**: test-vectors
**Wave**: 5 — Synthesis
**Date Analyzed**: 2026-02-25
**Depends On**: ALL Wave 2–4 analysis files; computation-pipeline.md; regime-detection.md; data-model.md

---

## Purpose

Each test vector specifies a complete computation scenario across one of the three tax regimes. For every vector: all inputs are defined, every intermediate value is shown, every output field is computed, and the legal basis for each step is cited. A developer can use these as automated integration tests confirming the engine against known-correct results.

**Conventions**:
- All monetary amounts in Philippine Pesos (₱).
- Pseudocode field names match `data-model.md` and `computation-pipeline.md`.
- "Col A" = exclusive property; "Col B" = conjugal/communal property; "Col C" = A + B total.
- Floor notation: `max(0, X)` = cannot go below ₱0.

---

## Test Vector Summary

| ID | Regime | Scenario | Expected Net Taxable Estate | Expected Tax Due |
|----|---------|-----------|-----------------------------|------------------|
| TV-01 | TRAIN | Single citizen, basic assets, standard deduction only | ₱4,000,000 | ₱240,000 |
| TV-02 | TRAIN | Married (ACP), exclusive family home, medical deduction | ₱1,850,000 | ₱111,000 |
| TV-03 | TRAIN | Married (CPG), vanishing deduction (80%), medical expenses | ₱4,530,000 | ₱271,800 |
| TV-04 | TRAIN | Non-resident alien, proportional deductions, no spouse | ₱10,540,000 | ₱632,400 |
| TV-05 | TRAIN | Gross estate below standard deduction — zero tax | ₱0 | ₱0 |
| TV-06 | TRAIN | ELIT + special deductions exceed gross estate — zero tax | ₱0 | ₱0 |
| TV-07 | Pre-TRAIN | Single citizen, 2015 death, graduated rate (11% bracket) | ₱2,650,000 | ₱206,500 |
| TV-08 | Pre-TRAIN | Married (CPG), 2010 death, all pre-TRAIN deductions | ₱4,150,000 | ₱371,500 |
| TV-09 | Amnesty | Married (CPG), 2012 death, Track A, pre-TRAIN deduction rules | ₱3,400,000 | ₱204,000 |
| TV-10 | TRAIN | 100% Vanishing Deduction (within 1 year), still positive tax | ₱3,200,000 | ₱192,000 |

---

## TV-01: Simple TRAIN — Single Citizen, Basic Assets, Standard Deduction Only

### Scenario
The simplest possible TRAIN-era computation. A single Filipino citizen with real and personal property, no deductions beyond the automatic standard deduction.

### Inputs

```
decedent = {
  name:            "Alejandro Reyes",
  citizenship:     "Filipino",
  residency:       "resident",
  isNonResidentAlien: false,
  dateOfDeath:     2022-03-15,
  maritalStatus:   "single"
}

assets = [
  {
    type:       "real_property",
    description: "Residential lot, Quezon City",
    fmv:        7_000_000,
    ownership:  "exclusive"   // Column A
  },
  {
    type:       "personal_property",
    description: "Vehicle + bank deposits",
    fmv:        2_000_000,
    ownership:  "exclusive"   // Column A
  }
]

deductions = {
  claimsAgainstEstate:   [],
  claimsVsInsolvent:     [],
  unpaidMortgages:       [],
  unpaidTaxes:           [],
  casualtyLosses:        [],
  vanishingDeduction:    [],
  transfersPublicUse:    [],
  familyHomeDesignated:  null,
  medicalExpenses:       [],
  ra4917Benefits:        0,
  foreignTaxCredit:      0
}
```

### Regime Detection

```
decedent.dateOfDeath = 2022-03-15 ≥ 2018-01-01  →  regime = "TRAIN"
deductionRules = "TRAIN"
```

### Phase 2: Sec. 87 Exclusions

None. No usufruct mergers, fiduciary substitutions, or charitable bequests.

### Phase 3: Gross Estate (Items 29–34)

| Item | Description | Col A (exclusive) | Col B (conjugal) | Col C (total) |
|------|-------------|-------------------|------------------|---------------|
| 29   | Real Property (other than family home) | ₱7,000,000 | ₱0 | ₱7,000,000 |
| 30   | Family Home | ₱0 | ₱0 | ₱0 |
| 31   | Personal Property | ₱2,000,000 | ₱0 | ₱2,000,000 |
| 32   | Taxable Transfers | ₱0 | ₱0 | ₱0 |
| 33   | Business Interest | ₱0 | ₱0 | ₱0 |
| **34** | **Gross Estate Total** | **₱9,000,000** | **₱0** | **₱9,000,000** |

### Phase 4: Ordinary Deductions (Item 35 / Schedule 5)

| Schedule Line | Description | Col A | Col B | Col C |
|--------------|-------------|-------|-------|-------|
| 5A | Claims Against Estate | ₱0 | ₱0 | ₱0 |
| 5B | Claims vs. Insolvent | ₱0 | ₱0 | ₱0 |
| 5C | Unpaid Mortgages & Taxes | ₱0 | ₱0 | ₱0 |
| 5D | Casualty Losses | ₱0 | ₱0 | ₱0 |
| 5E | Vanishing Deduction | ₱0 | ₱0 | ₱0 |
| 5F | Transfers for Public Use | ₱0 | ₱0 | ₱0 |
| **35** | **Total Ordinary Deductions** | **₱0** | **₱0** | **₱0** |

### Phase 5: Estate After Ordinary Deductions

```
Item 36 = max(0, Item 34.C − Item 35.C) = max(0, ₱9,000,000 − ₱0) = ₱9,000,000
```

### Phase 6: Special Deductions (Item 37 / Schedule 6)

| Schedule Line | Description | Amount | Basis |
|--------------|-------------|--------|-------|
| 6A (Item 37A) | Standard Deduction (citizen, TRAIN) | ₱5,000,000 | Sec. 86(A)(4); automatic |
| 6B (Item 37B) | Family Home | ₱0 | No family home designated |
| 6C (Item 37C) | Medical Expenses | ₱0 | None provided |
| 6D (Item 37D) | RA 4917 Benefits | ₱0 | None |
| **37** | **Total Special Deductions** | **₱5,000,000** | |

### Phase 7: Net Estate

```
Item 38 = max(0, Item 36 − Item 37) = max(0, ₱9,000,000 − ₱5,000,000) = ₱4,000,000
```

### Phase 8: Surviving Spouse Share

```
decedent.maritalStatus = "single"  →  Item 39 = ₱0
```

### Phase 9: Net Taxable Estate

```
Item 40 = max(0, Item 38 − Item 39) = max(0, ₱4,000,000 − ₱0) = ₱4,000,000
```

### Phase 11: Tax Rate Application

```
// Sec. 84 (TRAIN): flat 6%
Item 42 = Item 40 × 0.06 = ₱4,000,000 × 0.06 = ₱240,000
```

### Phase 12: Foreign Tax Credit

```
Item 43 = ₱0 (no foreign estate taxes paid)
```

### Phase 13: Net Estate Tax Due

```
Item 44 = max(0, Item 42 − Item 43) = max(0, ₱240,000 − ₱0) = ₱240,000
```

### Expected Output

| Field | Value |
|-------|-------|
| `output.grossEstate` (Item 34) | ₱9,000,000 |
| `output.ordinaryDeductions` (Item 35) | ₱0 |
| `output.estateAfterOrdinary` (Item 36) | ₱9,000,000 |
| `output.specialDeductions` (Item 37) | ₱5,000,000 |
| `output.netEstate` (Item 38) | ₱4,000,000 |
| `output.survivingSpouseShare` (Item 39) | ₱0 |
| `output.netTaxableEstate` (Item 40) | ₱4,000,000 |
| `output.estateTaxDue` (Item 42) | ₱240,000 |
| `output.foreignTaxCredit` (Item 43) | ₱0 |
| `output.netEstateTaxDue` (Item 44) | ₱240,000 |

### Rules Exercised
- TRAIN regime detection (date ≥ 2018-01-01)
- Single-decedent path (no spouse share)
- Standard deduction for citizen/resident (₱5,000,000)
- Flat 6% rate

---

## TV-02: Standard TRAIN — Married (ACP), Exclusive Family Home, Medical Deduction

### Scenario
A married Filipino citizen under ACP with mixed exclusive and conjugal property. The family home is exclusive (inherited before marriage). Tests the ACP surviving spouse share, family home deduction, and medical deduction.

### Inputs

```
decedent = {
  citizenship:     "Filipino",
  residency:       "resident",
  isNonResidentAlien: false,
  dateOfDeath:     2023-06-20,
  maritalStatus:   "married",
  propertyRegime:  "ACP",      // ACP: married after August 3, 1988
  survivingSpouseAlive: true
}

assets = [
  {
    type:       "real_property",
    description: "Commercial lot, Makati (exclusive — acquired before marriage)",
    fmv:        4_000_000,
    ownership:  "exclusive"    // Column A
  },
  {
    type:       "real_property",
    description: "Family home, Pasig (exclusive — inherited from parents)",
    fmv:        6_000_000,
    ownership:  "exclusive",   // Column A
    isFamilyHome: true,
    barangayCertification: true,
    isActualResidence: true
  },
  {
    type:       "personal_property",
    description: "Vehicles and jewelry (exclusive)",
    fmv:        2_000_000,
    ownership:  "exclusive"    // Column A
  },
  {
    type:       "personal_property",
    description: "Joint bank account and deposits (community / ACP)",
    fmv:        3_000_000,
    ownership:  "conjugal"     // Column B — ACP community property
  }
]

deductions = {
  claimsAgainstEstate: [
    {
      description:  "Personal loan (community)",
      amount:       500_000,
      ownership:    "conjugal",   // Column B
      notarized:    true,
      preExistingAtDeath: true
    }
  ],
  medicalExpenses: [
    {
      description:   "Hospital bills, ICU care (within 1 year before death)",
      amount:        400_000,     // ≤ ₱500,000 cap
      withinOneYear: true
    }
  ],
  foreignTaxCredit: 0
}
```

### Regime Detection

```
decedent.dateOfDeath = 2023-06-20 ≥ 2018-01-01  →  regime = "TRAIN"
```

### Phase 3: Gross Estate (Items 29–34)

| Item | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 29   | Real Property (excl. family home) | ₱4,000,000 | ₱0 | ₱4,000,000 |
| 30   | Family Home | ₱6,000,000 | ₱0 | ₱6,000,000 |
| 31   | Personal Property | ₱2,000,000 | ₱3,000,000 | ₱5,000,000 |
| 32   | Taxable Transfers | ₱0 | ₱0 | ₱0 |
| 33   | Business Interest | ₱0 | ₱0 | ₱0 |
| **34** | **Gross Estate Total** | **₱12,000,000** | **₱3,000,000** | **₱15,000,000** |

### Phase 4: Ordinary Deductions (Schedule 5)

| Line | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 5A | Claims Against Estate (community loan) | ₱0 | ₱500,000 | ₱500,000 |
| 5B–5F | All others | ₱0 | ₱0 | ₱0 |
| **35** | **Total Ordinary Deductions** | **₱0** | **₱500,000** | **₱500,000** |

### Phase 5: Estate After Ordinary Deductions

```
Item 36 = max(0, ₱15,000,000 − ₱500,000) = ₱14,500,000
```

### Phase 6: Special Deductions (Schedule 6)

```
// Standard Deduction — Sec. 86(A)(4), TRAIN citizen
Item 37A = ₱5,000,000

// Family Home — Sec. 86(A)(5), TRAIN, exclusive property
// applicable_fmv = ₱6,000,000 (exclusive → full FMV)
// cap = ₱10,000,000 (TRAIN)
// deduction = min(₱6,000,000, ₱10,000,000) = ₱6,000,000
Item 37B = ₱6,000,000

// Medical Expenses — Sec. 86(A)(7)
// actual = ₱400,000; cap = ₱500,000; deductible = min(₱400,000, ₱500,000)
Item 37C = ₱400,000

Item 37D = ₱0   // No RA 4917 benefits

Item 37 = ₱5,000,000 + ₱6,000,000 + ₱400,000 = ₱11,400,000
```

### Phase 7: Net Estate

```
Item 38 = max(0, ₱14,500,000 − ₱11,400,000) = ₱3,100,000
```

### Phase 8: Surviving Spouse Share (Schedule 6A)

```
// ACP: spouse share = 50% of net community property
// Community assets (Col B gross estate): ₱3,000,000
// Community ELIT obligations (5A–5D Col B): ₱500,000
// Net community = max(0, ₱3,000,000 − ₱500,000) = ₱2,500,000
// Spouse share = ₱2,500,000 × 0.50 = ₱1,250,000

Item 39 = ₱1,250,000
```

### Phase 9: Net Taxable Estate

```
Item 40 = max(0, ₱3,100,000 − ₱1,250,000) = ₱1,850,000
```

### Phase 11–13: Tax Computation

```
Item 42 = ₱1,850,000 × 0.06 = ₱111,000
Item 43 = ₱0
Item 44 = ₱111,000
```

### Expected Output

| Field | Value |
|-------|-------|
| Item 34 (Col A / Col B / Col C) | ₱12,000,000 / ₱3,000,000 / ₱15,000,000 |
| Item 35 (Col C) | ₱500,000 |
| Item 36 | ₱14,500,000 |
| Item 37 (37A / 37B / 37C / 37D) | ₱5,000,000 / ₱6,000,000 / ₱400,000 / ₱0 |
| Item 38 | ₱3,100,000 |
| Item 39 (spouse share) | ₱1,250,000 |
| Item 40 (net taxable estate) | ₱1,850,000 |
| Item 42 (estate tax due) | ₱111,000 |
| Item 44 (net estate tax due) | ₱111,000 |

### Rules Exercised
- ACP property regime (community assets in Col B)
- Exclusive family home: full FMV deductible (no halving)
- Medical expense deduction (within cap)
- Surviving spouse share from conjugal Col B only (exclusive Col A excluded)

---

## TV-03: Complex TRAIN — Married (CPG), Vanishing Deduction (80%), Medical Expenses

### Scenario
A married Filipino citizen under CPG. Tests: CPG property classification (pre-marital capital vs. conjugal), vanishing deduction at 80% (18 months elapsed), unpaid mortgage in ELIT, medical expenses, and a large surviving spouse share. The vanishing deduction formula is fully exercised including the adjustment ratio.

### Inputs

```
decedent = {
  citizenship:     "Filipino",
  residency:       "resident",
  isNonResidentAlien: false,
  dateOfDeath:     2020-09-01,
  maritalStatus:   "married",
  propertyRegime:  "CPG",      // CPG: married before August 3, 1988
  survivingSpouseAlive: true
}

assets = [
  {
    type:       "real_property",
    description: "Capital property (pre-marital, CPG exclusive), ancestral lot in Cavite",
    fmv:        3_000_000,
    ownership:  "exclusive"    // Column A — CPG capital property
  },
  {
    type:       "real_property",
    description: "Business land (conjugal)",
    fmv:        15_000_000,
    ownership:  "conjugal"     // Column B
  },
  {
    type:       "real_property",
    description: "Family home (conjugal), Quezon City",
    fmv:        5_000_000,
    ownership:  "conjugal",    // Column B — FULL conjugal FMV
    isFamilyHome: true,
    barangayCertification: true,
    isActualResidence: true
  },
  {
    type:       "real_property",
    description: "Previously-taxed residential lot — inherited from father (conjugal)",
    fmv:        4_000_000,     // current FMV at date of death
    ownership:  "conjugal",    // Column B
    previouslyTaxed: {
      priorFmv:           3_500_000,
      priorTransferType:  "inheritance",
      priorTransferDate:  2019-03-01,   // 18 months before 2020-09-01
      priorTaxWasPaid:    true,
      mortgageOnProperty: 0
    }
  },
  {
    type:       "personal_property",
    description: "Cash and bank deposits (conjugal)",
    fmv:        3_000_000,
    ownership:  "conjugal"     // Column B
  }
]

deductions = {
  claimsAgainstEstate: [
    {
      description: "Bank loan secured by business land (conjugal)",
      amount:      2_000_000,
      ownership:   "conjugal",   // Column B
      notarized:   true,
      preExistingAtDeath: true
    }
  ],
  unpaidMortgages: [
    {
      description:   "Housing loan on family home (conjugal)",
      amount:        1_000_000,
      ownership:     "conjugal",   // Column B
      mortgagePertainsToAsset: "family_home"  // Does NOT pertain to previously-taxed lot
    }
  ],
  medicalExpenses: [
    {
      description:   "Chemotherapy and hospitalization (within 1 year before death)",
      amount:        450_000,
      withinOneYear: true
    }
  ],
  foreignTaxCredit: 0
}
```

### Regime Detection

```
decedent.dateOfDeath = 2020-09-01 ≥ 2018-01-01  →  regime = "TRAIN"
```

### Phase 3: Gross Estate (Items 29–34)

| Item | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 29   | Real Property (excl. family home) | ₱3,000,000 | ₱19,000,000 | ₱22,000,000 |
| 30   | Family Home | ₱0 | ₱5,000,000 | ₱5,000,000 |
| 31   | Personal Property | ₱0 | ₱3,000,000 | ₱3,000,000 |
| 32   | Taxable Transfers | ₱0 | ₱0 | ₱0 |
| 33   | Business Interest | ₱0 | ₱0 | ₱0 |
| **34** | **Gross Estate Total** | **₱3,000,000** | **₱27,000,000** | **₱30,000,000** |

Note: Item 29 Col B includes:
- Business land: ₱15,000,000
- Previously-taxed lot (current FMV): ₱4,000,000
- Total Item 29 Col B: ₱19,000,000

### Phase 4: Ordinary Deductions (Schedule 5)

#### ELIT (5A–5D)

| Line | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 5A | Claims Against Estate (bank loan) | ₱0 | ₱2,000,000 | ₱2,000,000 |
| 5B | Claims vs. Insolvent | ₱0 | ₱0 | ₱0 |
| 5C | Unpaid Mortgages (family home loan) | ₱0 | ₱1,000,000 | ₱1,000,000 |
| 5D | Casualty Losses | ₱0 | ₱0 | ₱0 |
| **ELIT subtotal (5A–5D)** | | **₱0** | **₱3,000,000** | **₱3,000,000** |

#### Vanishing Deduction (5E) — Previously-Taxed Lot

```
// Prior transfer: father's death, 2019-03-01
// Current death: 2020-09-01
// Elapsed: 18 months → pct = 0.80 (>1 year, ≤2 years)

// Step 1: Initial Value
iv = min(prior_fmv, current_fmv) = min(₱3,500,000, ₱4,000,000) = ₱3,500,000

// Step 2: Net Value (no mortgage on this specific property)
nv = ₱3,500,000 - ₱0 = ₱3,500,000

// Step 3: Adjustment Ratio
// gross_estate_total (Item 34C) = ₱30,000,000
// elit_total (5A+5B+5C+5D, Item 34C) = ₱3,000,000
ratio = (₱30,000,000 - ₱3,000,000) / ₱30,000,000 = ₱27,000,000 / ₱30,000,000 = 0.90

// Step 4: Percentage (18 months)
pct = 0.80

// Step 5: Vanishing Deduction
vd = 0.80 × ₱3,500,000 × 0.90 = 0.80 × ₱3,150,000 = ₱2,520,000
// Ownership: conjugal → Column B
```

| Line | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 5E | Vanishing Deduction | ₱0 | ₱2,520,000 | ₱2,520,000 |
| 5F | Transfers for Public Use | ₱0 | ₱0 | ₱0 |

#### Total Ordinary Deductions

```
Item 35:
  Col A = ₱0
  Col B = ₱3,000,000 (ELIT) + ₱2,520,000 (VD) = ₱5,520,000
  Col C = ₱5,520,000
```

### Phase 5: Estate After Ordinary Deductions

```
Item 36 = max(0, ₱30,000,000 − ₱5,520,000) = ₱24,480,000
```

### Phase 6: Special Deductions (Schedule 6)

```
// Standard Deduction — TRAIN citizen
Item 37A = ₱5,000,000

// Family Home — conjugal, TRAIN
// applicable_fmv = ₱5,000,000 × 0.50 = ₱2,500,000 (decedent's half of conjugal FMV)
// cap = ₱10,000,000 (TRAIN)
// deduction = min(₱2,500,000, ₱10,000,000) = ₱2,500,000
Item 37B = ₱2,500,000

// Medical Expenses
// actual = ₱450,000; cap = ₱500,000; deductible = ₱450,000
Item 37C = ₱450,000

Item 37D = ₱0

Item 37 = ₱5,000,000 + ₱2,500,000 + ₱450,000 = ₱7,950,000
```

### Phase 7: Net Estate

```
Item 38 = max(0, ₱24,480,000 − ₱7,950,000) = ₱16,530,000
```

### Phase 8: Surviving Spouse Share (Schedule 6A)

```
// CPG: spouse share = 50% of net conjugal property
// Conjugal assets (Item 34B): ₱27,000,000
// Conjugal ELIT obligations (5A–5D Col B only): ₱3,000,000
//   NOTE: VD (5E) is excluded — policy deduction, not obligation
// Net conjugal = max(0, ₱27,000,000 − ₱3,000,000) = ₱24,000,000
// Spouse share = ₱24,000,000 × 0.50 = ₱12,000,000

Item 39 = ₱12,000,000
```

### Phase 9: Net Taxable Estate

```
Item 40 = max(0, ₱16,530,000 − ₱12,000,000) = ₱4,530,000
```

### Phase 11–13: Tax Computation

```
Item 42 = ₱4,530,000 × 0.06 = ₱271,800
Item 43 = ₱0
Item 44 = ₱271,800
```

### Expected Output

| Field | Value |
|-------|-------|
| Item 34 (Col A / Col B / Col C) | ₱3,000,000 / ₱27,000,000 / ₱30,000,000 |
| Item 35 — 5A (Col B) | ₱2,000,000 |
| Item 35 — 5C (Col B) | ₱1,000,000 |
| Item 35 — 5E VD (Col B) | ₱2,520,000 |
| Item 35 (Col C total) | ₱5,520,000 |
| Item 36 | ₱24,480,000 |
| Item 37A (standard) | ₱5,000,000 |
| Item 37B (family home) | ₱2,500,000 |
| Item 37C (medical) | ₱450,000 |
| Item 37 (total special) | ₱7,950,000 |
| Item 38 (net estate) | ₱16,530,000 |
| Item 39 (spouse share) | ₱12,000,000 |
| Item 40 (net taxable estate) | ₱4,530,000 |
| Item 42 (estate tax due) | ₱271,800 |
| Item 44 (net estate tax due) | ₱271,800 |

#### Vanishing Deduction Intermediate Values

| Variable | Value |
|----------|-------|
| `iv` (initial value) | ₱3,500,000 |
| `nv` (net value after mortgage) | ₱3,500,000 |
| `elit_total` | ₱3,000,000 |
| `ratio` | 0.90 (= 27,000,000 / 30,000,000) |
| `pct` (80% — 18-month window) | 0.80 |
| `vd_item` | ₱2,520,000 |

### Rules Exercised
- CPG property regime (pre-marital capital in Col A; conjugal property in Col B)
- Vanishing deduction (80%, 18-month bracket, ratio adjustment)
- VD computed AFTER ELIT (ratio denominator requires finalized ELIT subtotal)
- VD excluded from surviving spouse share conjugal obligations (5E ≠ obligation)
- Conjugal family home: decedent's ½ of FMV deductible at Item 37B

---

## TV-04: Non-Resident Alien TRAIN — PH Assets Only, Proportional Deductions

### Scenario
An American citizen who is a non-resident of the Philippines. Only Philippine-situs assets are included. Deductions are proportional to the PH-to-worldwide ratio per Sec. 86(B). No family home deduction. Standard deduction is the reduced NRA amount of ₱500,000.

### Inputs

```
decedent = {
  citizenship:     "American",
  residency:       "non-resident",
  isNonResidentAlien: true,
  dateOfDeath:     2021-04-05,
  maritalStatus:   "single",
  reciprocityExemptionClaimed: false,  // No US-PH reciprocity treaty for estate tax
  totalWorldwideGrossEstateForDeductionPurposes: 50_000_000
}

assets = [
  {
    type:       "real_property",
    description: "Condominium unit, Makati (Philippine situs)",
    fmv:        8_000_000,
    ownership:  "exclusive",
    isPhilippineSitus: true
  },
  {
    type:       "personal_property",
    description: "Shares in Philippine corporation (PH situs)",
    fmv:        3_000_000,
    ownership:  "exclusive",
    isPhilippineSitus: true
  },
  {
    type:       "personal_property",
    description: "Philippine bank deposits (PH situs)",
    fmv:        1_000_000,
    ownership:  "exclusive",
    isPhilippineSitus: true
  }
]

deductions = {
  claimsAgainstEstate: [
    {
      description: "Personal loans (total worldwide)",
      amount:      4_000_000,    // worldwide; engine applies proportional factor
      notarized:   true,
      preExistingAtDeath: true
    }
  ],
  foreignTaxCredit: 0
}
```

### Regime Detection

```
decedent.dateOfDeath = 2021-04-05 ≥ 2018-01-01  →  regime = "TRAIN"
decedent.isNonResidentAlien = true  →  gross estate = PH-situs assets only
```

### Phase 3: Gross Estate (Items 29–34, PH Situs Only)

| Item | Description | Col C (total, PH situs only) |
|------|-------------|------------------------------|
| 29   | Real Property (condominium) | ₱8,000,000 |
| 30   | Family Home | ₱0 (NRA ineligible) |
| 31   | Personal Property (shares + deposits) | ₱4,000,000 |
| 32–33 | Other | ₱0 |
| **34** | **Gross Estate Total (PH situs)** | **₱12,000,000** |

### Phase 4: Ordinary Deductions — Proportional (Sec. 86(B)(2))

```
// Proportional factor (Sec. 86(B)(2)):
// proportional_factor = Item 34 (PH) / total worldwide gross estate
proportional_factor = ₱12,000,000 / ₱50,000,000 = 0.24

// Claims against estate (worldwide ₱4,000,000):
proportional_claims = ₱4,000,000 × 0.24 = ₱960,000
```

| Line | Description | Col C |
|------|-------------|-------|
| 5A | Claims (proportional) | ₱960,000 |
| 5B–5F | All others | ₱0 |
| **35** | **Total Ordinary Deductions** | **₱960,000** |

### Phase 5: Estate After Ordinary Deductions

```
Item 36 = max(0, ₱12,000,000 − ₱960,000) = ₱11,040,000
```

### Phase 6: Special Deductions

```
// Standard Deduction — NRA (Sec. 86(B)(1))
// NRA rate: ₱500,000 regardless of regime or worldwide estate size
Item 37A = ₱500,000

// Family Home: NRA ineligible
Item 37B = ₱0

// Medical: none
Item 37C = ₱0

Item 37 = ₱500,000
```

### Phase 7–9: Net Taxable Estate

```
Item 38 = max(0, ₱11,040,000 − ₱500,000) = ₱10,540,000
Item 39 = ₱0 (single)
Item 40 = ₱10,540,000
```

### Phase 11–13: Tax Computation

```
// NRAs subject to same flat 6% rate (Sec. 84 TRAIN)
Item 42 = ₱10,540,000 × 0.06 = ₱632,400
Item 43 = ₱0  // NRAs cannot claim foreign tax credit
Item 44 = ₱632,400
```

### Expected Output

| Field | Value |
|-------|-------|
| `proportional_factor` | 0.24 |
| Item 34 (PH situs) | ₱12,000,000 |
| Item 35 (proportional claims) | ₱960,000 |
| Item 36 | ₱11,040,000 |
| Item 37A (standard, NRA) | ₱500,000 |
| Item 37 (total special) | ₱500,000 |
| Item 38 (net estate) | ₱10,540,000 |
| Item 39 (spouse share) | ₱0 |
| Item 40 (net taxable) | ₱10,540,000 |
| Item 42 (tax due) | ₱632,400 |
| Item 44 (net estate tax due) | ₱632,400 |

### Rules Exercised
- NRA gross estate: PH-situs assets only
- Proportional deduction formula: Sec. 86(B)(2)
- NRA standard deduction: ₱500,000 (not ₱5,000,000)
- No family home deduction for NRA
- No foreign tax credit for NRA (NRAs not eligible for Sec. 86(E) credit)

---

## TV-05: Zero Tax TRAIN — Gross Estate Below Standard Deduction

### Scenario
Gross estate is less than the TRAIN standard deduction. Net estate is floored at ₱0. Tax due is ₱0.

### Inputs

```
decedent = {
  citizenship:  "Filipino",
  isNonResidentAlien: false,
  dateOfDeath:  2022-02-01,
  maritalStatus: "single"
}

assets = [
  {
    type:       "personal_property",
    description: "Bank savings, time deposits, UITF",
    fmv:        4_500_000,
    ownership:  "exclusive"
  }
]

deductions = {}  // No deductions other than standard
```

### Regime Detection

```
dateOfDeath = 2022-02-01 ≥ 2018-01-01  →  regime = "TRAIN"
```

### Computation

```
Item 34 = ₱4,500,000
Item 35 = ₱0
Item 36 = ₱4,500,000
Item 37A = ₱5,000,000  // Standard deduction (TRAIN citizen)
Item 37 = ₱5,000,000

// Net estate cannot go below ₱0:
Item 38 = max(0, ₱4,500,000 − ₱5,000,000) = max(0, −₱500,000) = ₱0

Item 39 = ₱0 (single)
Item 40 = ₱0

Item 42 = ₱0 × 0.06 = ₱0
Item 44 = ₱0
```

### Expected Output

| Field | Value |
|-------|-------|
| Item 34 | ₱4,500,000 |
| Item 36 | ₱4,500,000 |
| Item 37A | ₱5,000,000 |
| Item 38 | ₱0 (floored from −₱500,000) |
| Item 40 | ₱0 |
| Item 42 | ₱0 |
| Item 44 | ₱0 |

### Rules Exercised
- Standard deduction exceeds gross estate → floor at ₱0 (no negative net estate)
- Zero tax result does not require a minimum payment under TRAIN regular rules

---

## TV-06: Edge TRAIN — ELIT + Special Deductions Exceed Gross Estate

### Scenario
Large debts reduce the estate, then special deductions exceed the remainder. Tests the floor-at-zero behavior at two stages (Item 38). The estate has a family home, large ELIT claims, and the standard deduction — combined they exceed gross estate.

### Inputs

```
decedent = {
  citizenship:  "Filipino",
  isNonResidentAlien: false,
  dateOfDeath:  2022-08-12,
  maritalStatus: "single"
}

assets = [
  {
    type:        "real_property",
    description: "Family home, Valenzuela",
    fmv:         2_000_000,
    ownership:   "exclusive",
    isFamilyHome: true,
    barangayCertification: true,
    isActualResidence: true
  },
  {
    type:        "real_property",
    description: "Vacant lot, Caloocan",
    fmv:         4_000_000,
    ownership:   "exclusive"
  },
  {
    type:        "personal_property",
    description: "Personal property",
    fmv:         2_000_000,
    ownership:   "exclusive"
  }
]

deductions = {
  claimsAgainstEstate: [
    {
      description: "Bank and personal loans (pre-death obligations)",
      amount:      3_000_000,
      ownership:   "exclusive",   // Column A
      notarized:   true,
      preExistingAtDeath: true
    }
  ]
}
```

### Computation

```
// Gross estate
Item 30A = ₱2,000,000 (family home)
Item 29A = ₱4,000,000 (other real property)
Item 31A = ₱2,000,000 (personal)
Item 34 = ₱8,000,000

// Ordinary deductions
Item 35 (5A, claims) = ₱3,000,000
Item 36 = max(0, ₱8,000,000 − ₱3,000,000) = ₱5,000,000

// Special deductions
Item 37A = ₱5,000,000  // standard
Item 37B = min(₱2,000,000, ₱10,000,000) = ₱2,000,000  // family home (exclusive, TRAIN)
Item 37 = ₱7,000,000

// Net estate floored at ₱0:
Item 38 = max(0, ₱5,000,000 − ₱7,000,000) = max(0, −₱2,000,000) = ₱0

Item 39 = ₱0 (single)
Item 40 = ₱0

Item 42 = ₱0 × 0.06 = ₱0
Item 44 = ₱0
```

### Expected Output

| Field | Value |
|-------|-------|
| Item 34 | ₱8,000,000 |
| Item 35 (claims) | ₱3,000,000 |
| Item 36 | ₱5,000,000 |
| Item 37A | ₱5,000,000 |
| Item 37B (family home) | ₱2,000,000 |
| Item 37 (total special) | ₱7,000,000 |
| Item 38 | ₱0 (floored from −₱2,000,000) |
| Item 40 | ₱0 |
| Item 42 | ₱0 |
| Item 44 | ₱0 |

### Rules Exercised
- Floor-at-zero at Item 38: special deductions exceed Item 36
- Excess special deductions do not carry over or produce a refund
- Family home deduction on exclusive property (TRAIN: full FMV up to ₱10M cap)

---

## TV-07: Pre-TRAIN Simple — Single Citizen, 2015 Death, 11% Bracket

### Scenario
Single Filipino citizen who died in 2015 (pre-TRAIN). Tests the graduated rate schedule, pre-TRAIN deductions (funeral expenses, lower standard and family home), and the 11% marginal bracket.

### Inputs

```
decedent = {
  citizenship:  "Filipino",
  isNonResidentAlien: false,
  dateOfDeath:  2015-07-05,
  maritalStatus: "single"
}

assets = [
  {
    type:        "real_property",
    description: "Family home, Bacolod",
    fmv:         1_200_000,
    ownership:   "exclusive",
    isFamilyHome: true,
    barangayCertification: true,
    isActualResidence: true
  },
  {
    type:        "real_property",
    description: "Agricultural lot, Negros Occidental",
    fmv:         3_000_000,
    ownership:   "exclusive"
  },
  {
    type:        "personal_property",
    description: "Vehicle and personal items",
    fmv:         800_000,
    ownership:   "exclusive"
  }
]

deductions = {
  claimsAgainstEstate: [
    {
      description: "Credit card and personal loans",
      amount:      200_000,
      ownership:   "exclusive",
      notarized:   true,
      preExistingAtDeath: true
    }
  ],
  funeralExpenses: {
    actualAmount: 150_000  // Pre-TRAIN deductible item
  }
}
```

### Regime Detection

```
decedent.dateOfDeath = 2015-07-05 < 2018-01-01  →  regime = "pre_TRAIN"
deductionRules = "PRE_TRAIN"
```

### Phase 3: Gross Estate

```
Item 29A = ₱3,000,000 (agricultural lot)
Item 30A = ₱1,200,000 (family home)
Item 31A = ₱800,000 (personal property)
Item 34 = ₱5,000,000
```

### Phase 4: Ordinary Deductions (Pre-TRAIN — includes funeral)

```
// 5A: Claims Against Estate
claims = ₱200,000

// Pre-TRAIN Funeral Expenses:
// Limit = 5% × Item 34 = 5% × ₱5,000,000 = ₱250,000
// Actual = ₱150,000 < ₱250,000 → deductible = ₱150,000
funeralDeductible = min(₱150,000, ₱250,000) = ₱150,000

// Judicial/admin expenses: ₱0 (none incurred)

Item 35 = ₱200,000 + ₱150,000 = ₱350,000
```

### Phase 5

```
Item 36 = ₱5,000,000 − ₱350,000 = ₱4,650,000
```

### Phase 6: Special Deductions (Pre-TRAIN amounts)

```
// Standard Deduction — pre-TRAIN citizen: ₱1,000,000 (NOT ₱5,000,000)
Item 37A = ₱1,000,000

// Family Home — exclusive, pre-TRAIN cap ₱1,000,000
// applicable_fmv = ₱1,200,000 (exclusive → full FMV)
// cap = ₱1,000,000 (pre-TRAIN)
// deduction = min(₱1,200,000, ₱1,000,000) = ₱1,000,000
Item 37B = ₱1,000,000

Item 37 = ₱1,000,000 + ₱1,000,000 = ₱2,000,000
```

### Phase 7–9

```
Item 38 = max(0, ₱4,650,000 − ₱2,000,000) = ₱2,650,000
Item 39 = ₱0 (single)
Item 40 = ₱2,650,000
```

### Phase 11: Pre-TRAIN Graduated Rate

```
// ₱2,650,000 is in the ₱2,000,000–₱5,000,000 bracket (11% on excess over ₱2M)
// Tax = ₱135,000 + 11% × (₱2,650,000 − ₱2,000,000)
// Tax = ₱135,000 + 0.11 × ₱650,000
// Tax = ₱135,000 + ₱71,500
Item 42 = ₱206,500

Item 43 = ₱0
Item 44 = ₱206,500
```

### Expected Output

| Field | Value |
|-------|-------|
| Item 34 | ₱5,000,000 |
| Item 35 (claims + funeral) | ₱350,000 |
| `funeralExpenseDeductible` | ₱150,000 (min of actual ₱150K and limit ₱250K) |
| Item 36 | ₱4,650,000 |
| Item 37A (pre-TRAIN standard) | ₱1,000,000 |
| Item 37B (pre-TRAIN FH cap) | ₱1,000,000 |
| Item 37 | ₱2,000,000 |
| Item 38 | ₱2,650,000 |
| Item 40 (net taxable) | ₱2,650,000 |
| Item 42 (tax due) | ₱206,500 |
| `bracketBase` | ₱135,000 |
| `excessOverLowerBound` | ₱650,000 (= ₱2,650,000 − ₱2,000,000) |
| `marginalRate` | 0.11 |
| `marginalTax` | ₱71,500 |
| Item 44 | ₱206,500 |

### Rules Exercised
- Pre-TRAIN regime detection (date < 2018-01-01)
- Funeral expense deduction: min(actual, 5% × gross estate)
- Pre-TRAIN standard deduction: ₱1,000,000
- Pre-TRAIN family home cap: ₱1,000,000 (exclusive: full FMV, capped at ₱1M)
- Graduated rate schedule: 11% bracket
- Hardcoded bracket base amount: ₱135,000

---

## TV-08: Pre-TRAIN Complex — Married (CPG), 2010 Death, All Pre-TRAIN Deductions

### Scenario
Filipino citizen married under CPG who died in 2010, with a surviving spouse. Tests all pre-TRAIN deductions: funeral, judicial/admin, claims, family home (conjugal, ₱1M cap), standard (₱1M), medical. Also tests CPG surviving spouse share. Graduated rate produces 11% bracket.

### Inputs

```
decedent = {
  citizenship:  "Filipino",
  isNonResidentAlien: false,
  dateOfDeath:  2010-04-20,
  maritalStatus: "married",
  propertyRegime: "CPG",
  survivingSpouseAlive: true
}

assets = [
  {
    type:        "real_property",
    description: "Capital property (pre-marital) — family lot, Ilocos Norte",
    fmv:         2_000_000,
    ownership:   "exclusive"    // Column A — CPG capital
  },
  {
    type:        "real_property",
    description: "Agricultural land (conjugal)",
    fmv:         7_000_000,
    ownership:   "conjugal"    // Column B — CPG conjugal
  },
  {
    type:        "real_property",
    description: "Family home, Ilocos Norte (conjugal)",
    fmv:         1_800_000,
    ownership:   "conjugal",   // Column B — FULL conjugal FMV
    isFamilyHome: true,
    barangayCertification: true,
    isActualResidence: true
  },
  {
    type:        "personal_property",
    description: "Vehicle (conjugal)",
    fmv:         500_000,
    ownership:   "conjugal"
  },
  {
    type:        "personal_property",
    description: "Cash and deposits (conjugal)",
    fmv:         1_000_000,
    ownership:   "conjugal"
  }
]

deductions = {
  claimsAgainstEstate: [
    {
      description: "Bank loan (conjugal)",
      amount:      800_000,
      ownership:   "conjugal",
      notarized:   true,
      preExistingAtDeath: true
    }
  ],
  funeralExpenses: {
    actualAmount:  400_000   // Pre-TRAIN deductible item
  },
  judicialAdminExpenses: [
    {
      description: "Estate settlement attorney and notarial fees",
      amount:      100_000,
      relatedToEstateSettlement: true
    }
  ],
  medicalExpenses: [
    {
      description: "Hospital and medical care (within 1 year before death)",
      amount:      200_000,
      withinOneYear: true
    }
  ]
}
```

### Regime Detection

```
dateOfDeath = 2010-04-20 < 2018-01-01  →  regime = "pre_TRAIN"
deductionRules = "PRE_TRAIN"
```

### Phase 3: Gross Estate

| Item | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 29   | Real Property (excl. family home) | ₱2,000,000 | ₱7,000,000 | ₱9,000,000 |
| 30   | Family Home | ₱0 | ₱1,800,000 | ₱1,800,000 |
| 31   | Personal Property | ₱0 | ₱1,500,000 | ₱1,500,000 |
| **34** | **Gross Estate Total** | **₱2,000,000** | **₱10,300,000** | **₱12,300,000** |

### Phase 4: Ordinary Deductions (Pre-TRAIN includes funeral + judicial)

```
// 5A: Claims (conjugal) = ₱800,000

// Funeral Expenses:
// Limit = 5% × ₱12,300,000 = ₱615,000
// Actual = ₱400,000 < ₱615,000 → deductible = ₱400,000 (conjugal)
funeralDeductible = min(₱400,000, ₱615,000) = ₱400,000

// Judicial/Admin Expenses = ₱100,000 (all related to settlement, conjugal)

Item 35:
  5A (claims, conjugal):       ₱800,000  Col B
  Funeral (conjugal):          ₱400,000  Col B
  Judicial/admin (conjugal):   ₱100,000  Col B
  Total Col C:               ₱1,300,000
```

### Phase 5

```
Item 36 = ₱12,300,000 − ₱1,300,000 = ₱11,000,000
```

### Phase 6: Special Deductions (Pre-TRAIN amounts)

```
// Standard Deduction — pre-TRAIN citizen: ₱1,000,000
Item 37A = ₱1,000,000

// Family Home — conjugal, pre-TRAIN cap ₱1,000,000
// applicable_fmv = ₱1,800,000 × 0.50 = ₱900,000 (decedent's half of conjugal FMV)
// cap = ₱1,000,000 (pre-TRAIN)
// deduction = min(₱900,000, ₱1,000,000) = ₱900,000
Item 37B = ₱900,000

// Medical Expenses = min(₱200,000, ₱500,000) = ₱200,000
Item 37C = ₱200,000

Item 37 = ₱1,000,000 + ₱900,000 + ₱200,000 = ₱2,100,000
```

### Phase 7: Net Estate

```
Item 38 = max(0, ₱11,000,000 − ₱2,100,000) = ₱8,900,000
```

### Phase 8: Surviving Spouse Share (Schedule 6A)

```
// CPG spouse share
// Conjugal assets (Item 34B): ₱10,300,000
// Conjugal ELIT obligations (5A claims only — NOT funeral or judicial):
//   5A = ₱800,000  (claims are 5A; funeral and judicial are separate, excluded from obligation sum)
// Net conjugal = max(0, ₱10,300,000 − ₱800,000) = ₱9,500,000
// Spouse share = ₱9,500,000 × 0.50 = ₱4,750,000

Item 39 = ₱4,750,000
```

**Key note**: Funeral and judicial/admin expenses are ordinary deductions under pre-TRAIN law, but they are NOT counted as "obligations against the community property" in Schedule 6A. Only Schedule 5A–5D items (claims, insolvent, mortgages, losses) are obligations that reduce the conjugal pool. This is per Sec. 86(C) which refers to "obligations properly chargeable to such property."

### Phase 9: Net Taxable Estate

```
Item 40 = max(0, ₱8,900,000 − ₱4,750,000) = ₱4,150,000
```

### Phase 11: Pre-TRAIN Graduated Rate

```
// ₱4,150,000 is in the ₱2,000,000–₱5,000,000 bracket
// Tax = ₱135,000 + 11% × (₱4,150,000 − ₱2,000,000)
// Tax = ₱135,000 + 0.11 × ₱2,150,000
// Tax = ₱135,000 + ₱236,500
Item 42 = ₱371,500

Item 43 = ₱0
Item 44 = ₱371,500
```

### Expected Output

| Field | Value |
|-------|-------|
| Item 34 (Col A / Col B / Col C) | ₱2,000,000 / ₱10,300,000 / ₱12,300,000 |
| `funeralExpenseDeductible` | ₱400,000 |
| `funeralLimit_5pct` | ₱615,000 |
| `judicialAdminDeductible` | ₱100,000 |
| Item 35 (total ordinary) | ₱1,300,000 |
| Item 36 | ₱11,000,000 |
| Item 37A (standard, pre-TRAIN) | ₱1,000,000 |
| Item 37B (family home, conjugal, pre-TRAIN) | ₱900,000 |
| Item 37C (medical) | ₱200,000 |
| Item 37 | ₱2,100,000 |
| Item 38 | ₱8,900,000 |
| `conjOblForSpouseShare` (5A only) | ₱800,000 |
| `netConjugalForSpouseShare` | ₱9,500,000 |
| Item 39 (spouse share) | ₱4,750,000 |
| Item 40 (net taxable) | ₱4,150,000 |
| Item 42 (tax due) | ₱371,500 |
| Item 44 | ₱371,500 |

### Rules Exercised
- Pre-TRAIN funeral deduction: min(actual, 5% × gross estate)
- Pre-TRAIN judicial/admin deduction: actual amount
- Pre-TRAIN standard deduction: ₱1,000,000
- Pre-TRAIN family home cap: ₱1,000,000; conjugal → ½ of FMV rule
- Funeral and judicial expenses are NOT included in conjugal obligations for spouse share (Schedule 6A only uses 5A–5D)
- CPG surviving spouse share with capital (exclusive) property
- Graduated rate: 11% bracket

---

## TV-09: Estate Tax Amnesty — CPG Marriage, 2012 Death, Track A

### Scenario
A Filipino citizen married under CPG who died in 2012 avails of the estate tax amnesty under RA 11213 (as amended by RA 11569). No prior return was filed (Track A). Pre-2018 death → pre-TRAIN deduction rules apply under amnesty (full deduction set interpretation per RA 11213 Sec. 3). Flat 6% amnesty rate applied to full net taxable estate. Minimum ₱5,000 floor does not trigger. Compares against regular pre-TRAIN graduated rate to show amnesty benefit.

### Inputs

```
decedent = {
  citizenship:  "Filipino",
  isNonResidentAlien: false,
  dateOfDeath:  2012-01-15,
  maritalStatus: "married",
  propertyRegime: "CPG",
  survivingSpouseAlive: true
}

estate = {
  priorReturnFiled:             false,   // Track A: no prior return
  previouslyDeclaredNetEstate:  0
}

assets = [
  {
    type:       "real_property",
    description: "Family home (conjugal)",
    fmv:        2_000_000,
    ownership:  "conjugal",
    isFamilyHome: true,
    barangayCertification: true,
    isActualResidence: true
  },
  {
    type:       "real_property",
    description: "Commercial lot (conjugal)",
    fmv:        8_000_000,
    ownership:  "conjugal"
  },
  {
    type:       "personal_property",
    description: "Cash, deposits, receivables (conjugal)",
    fmv:        1_000_000,
    ownership:  "conjugal"
  },
  {
    type:       "business_interest",
    description: "Partnership interest (conjugal)",
    fmv:        1_500_000,
    ownership:  "conjugal"
  }
]

deductions = {
  claimsAgainstEstate: [
    {
      description: "Bank loan (conjugal)",
      amount:      800_000,
      ownership:   "conjugal",
      notarized:   true,
      preExistingAtDeath: true
    }
  ],
  funeralExpenses: {
    actualAmount: 350_000    // Pre-TRAIN + amnesty deductible (full deduction set)
  },
  judicialAdminExpenses: [
    {
      description:  "Legal fees for estate settlement",
      amount:       100_000,
      relatedToEstateSettlement: true
    }
  ]
}
```

### Regime + Eligibility Detection

```
dateOfDeath = 2012-01-15 < 2018-01-01  →  amnesty-eligible base regime
decedent died before 2018 → eligibility.deductionRules = "PRE_TRAIN"
estate.priorReturnFiled = false  →  eligibility.track = "TRACK_A"

Selected regime: "amnesty"
AMNESTY_RATE = 0.06
MINIMUM_PAYMENT = 5_000
```

### Phase 3: Gross Estate

| Item | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 29   | Real Property (excl. family home) | ₱0 | ₱8,000,000 | ₱8,000,000 |
| 30   | Family Home | ₱0 | ₱2,000,000 | ₱2,000,000 |
| 31   | Personal Property | ₱0 | ₱1,000,000 | ₱1,000,000 |
| 33   | Business Interest | ₱0 | ₱1,500,000 | ₱1,500,000 |
| **34** | **Gross Estate Total** | **₱0** | **₱12,500,000** | **₱12,500,000** |

### Phase 4: Ordinary Deductions — Amnesty + Pre-2018 Death = Full Pre-TRAIN Set

```
// deductionRules = "PRE_TRAIN":
// getOrdinaryDeductionItems("amnesty", "PRE_TRAIN")
//   → returns common + ["funeralExpenses", "judicialAdminExpenses"]

// 5A: Claims against estate (conjugal) = ₱800,000

// Funeral Expenses:
// Limit = 5% × ₱12,500,000 = ₱625,000
// Actual = ₱350,000 < ₱625,000 → deductible = ₱350,000 (conjugal)
funeralDeductible = min(₱350,000, ₱625,000) = ₱350,000

// Judicial/admin = ₱100,000 (conjugal)

Item 35 = ₱800,000 + ₱350,000 + ₱100,000 = ₱1,250,000
```

### Phase 5

```
Item 36 = ₱12,500,000 − ₱1,250,000 = ₱11,250,000
```

### Phase 6: Special Deductions — Amnesty + Pre-2018 = Pre-TRAIN Amounts

```
// getSpecialDeductionAmounts(citizen, "amnesty", "PRE_TRAIN"):
//   standardDeduction = ₱1,000,000 (pre-TRAIN, NOT ₱5M)
//   familyHomeCap = ₱1,000,000 (pre-TRAIN, NOT ₱10M)

// Standard Deduction (pre-TRAIN citizen under amnesty)
Item 37A = ₱1,000,000

// Family Home (conjugal, pre-TRAIN amnesty cap)
// applicable_fmv = ₱2,000,000 × 0.50 = ₱1,000,000 (decedent's half of conjugal FMV)
// cap = ₱1,000,000 → deduction = min(₱1,000,000, ₱1,000,000) = ₱1,000,000
Item 37B = ₱1,000,000

Item 37 = ₱1,000,000 + ₱1,000,000 = ₱2,000,000
```

### Phase 7: Net Estate

```
Item 38 = max(0, ₱11,250,000 − ₱2,000,000) = ₱9,250,000
```

### Phase 8: Surviving Spouse Share (Schedule 6A)

```
// CPG spouse share
// Conjugal assets (Item 34B): ₱12,500,000
// Conjugal ELIT obligations (5A claims only): ₱800,000
//   (funeral ₱350,000 and judicial ₱100,000 are NOT obligations against the community)
// Net conjugal = ₱12,500,000 − ₱800,000 = ₱11,700,000
// Spouse share = ₱11,700,000 × 0.50 = ₱5,850,000

Item 39 = ₱5,850,000
```

### Phase 9: Net Taxable Estate

```
Item 40 = max(0, ₱9,250,000 − ₱5,850,000) = ₱3,400,000
```

### Phase 10: Amnesty Track Selection

```
eligibility.track = "TRACK_A"
amnestyTaxBase = netTaxableEstate = ₱3,400,000
// (Track B would subtract previouslyDeclaredNetEstate here)
```

### Phase 11: Amnesty Tax Computation

```
AMNESTY_RATE = 0.06
computedAmnestyTax = ₱3,400,000 × 0.06 = ₱204,000
amnestyTaxDue = max(₱5,000, ₱204,000) = ₱204,000
minimumApplied = false  // ₱204,000 > ₱5,000
```

### Expected Output (ETAR Fields)

| Field | Value |
|-------|-------|
| `output.grossEstate` (Item 34) | ₱12,500,000 |
| `output.funeralDeductible` | ₱350,000 |
| `output.judicialAdminDeductible` | ₱100,000 |
| `output.ordinaryDeductions` (Item 35) | ₱1,250,000 |
| `output.specialDeductions` (Item 37) | ₱2,000,000 |
| `output.netEstate` (Item 38) | ₱9,250,000 |
| `output.survivingSpouseShare` (Item 39) | ₱5,850,000 |
| `output.netTaxableEstate` (Item 40) | ₱3,400,000 |
| `output.track` | "TRACK_A" |
| `output.amnestyTaxBase` | ₱3,400,000 |
| `output.computedAmnestyTax` | ₱204,000 |
| `output.amnestyTaxDue` | ₱204,000 |
| `output.minimumApplied` | false |
| `output.deductionInterpretation` | "FULL_SET_AT_TIME_OF_DEATH" |

### Comparative Note: Amnesty vs. Regular Pre-TRAIN

```
// Regular pre-TRAIN graduated rate on ₱3,400,000:
// Bracket: ₱2,000,000–₱5,000,000 (11%)
// Tax = ₱135,000 + 11% × (₱3,400,000 − ₱2,000,000)
// Tax = ₱135,000 + ₱154,000 = ₱289,000

// Amnesty tax: ₱204,000
// Base tax savings from amnesty: ₱85,000 + waiver of all surcharges and interest
```

Engine output should include this comparison when amnesty path is selected.

### Rules Exercised
- Amnesty eligibility: pre-2018 death, no prior return → Track A
- `deductionRules = "PRE_TRAIN"` for amnesty with pre-2018 death
- Full deduction set at time of death: funeral + judicial/admin included
- Pre-TRAIN deduction amounts: ₱1M standard, ₱1M family home cap
- Funeral/judicial NOT counted as conjugal obligations for spouse share
- Flat 6% amnesty rate on full net taxable estate (Track A)
- Minimum ₱5,000 floor check (not triggered here)
- Output is ETAR-structured, not Form 1801

---

## TV-10: 100% Vanishing Deduction — Property Inherited Within 1 Year

### Scenario
A single Filipino citizen who recently inherited property (within 1 year). The 100% vanishing deduction is applied. No ELIT deductions (ratio = 1.00). Tests the 100% deduction path and the full vanishing deduction formula with an appreciated property (current FMV > prior FMV → use prior FMV as IV).

### Inputs

```
decedent = {
  citizenship:  "Filipino",
  isNonResidentAlien: false,
  dateOfDeath:  2023-06-30,
  maritalStatus: "single"
}

assets = [
  {
    type:        "real_property",
    description: "Inherited house and lot from mother (exclusive)",
    fmv:         5_200_000,   // current FMV at date of death (appreciated from ₱5M)
    ownership:   "exclusive",
    previouslyTaxed: {
      priorFmv:           5_000_000,   // FMV at mother's death (from prior estate tax return)
      priorTransferType:  "inheritance",
      priorTransferDate:  2023-03-31,  // 91 days before 2023-06-30 → ≤ 1 year → 100%
      priorTaxWasPaid:    true,
      mortgageOnProperty: 0
    }
  },
  {
    type:        "real_property",
    description: "Own commercial lot, Cebu (exclusive)",
    fmv:         8_000_000,
    ownership:   "exclusive"
  }
]

deductions = {
  claimsAgainstEstate: [],  // No debts
  foreignTaxCredit:    0
}
```

### Regime Detection

```
dateOfDeath = 2023-06-30 ≥ 2018-01-01  →  regime = "TRAIN"
```

### Phase 3: Gross Estate

```
Item 29A = ₱5,200,000 (inherited lot, current FMV) + ₱8,000,000 (own lot) = ₱13,200,000
Item 34 = ₱13,200,000
```

### Phase 4: Ordinary Deductions — Vanishing Deduction

#### ELIT (5A–5D)

```
All ELIT items = ₱0
elit_total = ₱0
```

#### Vanishing Deduction (5E)

```
// Property: inherited house and lot (exclusive)
// Prior transfer date: 2023-03-31; Current death: 2023-06-30
// Elapsed: 91 days = 0.249 years → ≤ 1 year → pct = 1.00

// Step 1: Initial Value
// Current FMV (₱5,200,000) > Prior FMV (₱5,000,000) → use PRIOR (lower value)
iv = min(₱5,000,000, ₱5,200,000) = ₱5,000,000

// Step 2: Net Value (no mortgage on this property)
nv = ₱5,000,000 − ₱0 = ₱5,000,000

// Step 3: Adjustment Ratio
// gross_estate_total = ₱13,200,000; elit_total = ₱0
ratio = (₱13,200,000 − ₱0) / ₱13,200,000 = 1.000

// Step 4: Percentage
pct = 1.00  // ≤ 1 year

// Step 5: Vanishing Deduction
vd_item = 1.00 × ₱5,000,000 × 1.000 = ₱5,000,000

// Ownership: exclusive → Column A
```

| Line | Description | Col A | Col B | Col C |
|------|-------------|-------|-------|-------|
| 5E | Vanishing Deduction (inherited lot, 100%) | ₱5,000,000 | ₱0 | ₱5,000,000 |
| **35** | **Total Ordinary Deductions** | **₱5,000,000** | **₱0** | **₱5,000,000** |

### Phase 5

```
Item 36 = max(0, ₱13,200,000 − ₱5,000,000) = ₱8,200,000
```

### Phase 6: Special Deductions

```
Item 37A = ₱5,000,000  // standard (TRAIN citizen)
Item 37B = ₱0          // no family home designated
Item 37  = ₱5,000,000
```

### Phase 7–9

```
Item 38 = max(0, ₱8,200,000 − ₱5,000,000) = ₱3,200,000
Item 39 = ₱0 (single)
Item 40 = ₱3,200,000
```

### Phase 11–13: Tax

```
Item 42 = ₱3,200,000 × 0.06 = ₱192,000
Item 43 = ₱0
Item 44 = ₱192,000
```

### Expected Output

| Field | Value |
|-------|-------|
| Item 34 | ₱13,200,000 |
| VD intermediate: `iv` | ₱5,000,000 (prior FMV, lower than current) |
| VD intermediate: `nv` | ₱5,000,000 |
| VD intermediate: `elit_total` | ₱0 |
| VD intermediate: `ratio` | 1.000 |
| VD intermediate: `pct` | 1.00 (91 days ≤ 365 days) |
| VD item | ₱5,000,000 (Col A) |
| Item 35 (5E VD only) | ₱5,000,000 |
| Item 36 | ₱8,200,000 |
| Item 37A (standard) | ₱5,000,000 |
| Item 37 | ₱5,000,000 |
| Item 38 (net estate) | ₱3,200,000 |
| Item 40 (net taxable) | ₱3,200,000 |
| Item 42 (tax due) | ₱192,000 |
| Item 44 | ₱192,000 |

### Rules Exercised
- Vanishing deduction 100% bracket (elapsed ≤ 1 year)
- Appreciated property: IV = min(prior, current) = prior FMV
- ratio = 1.000 when ELIT = 0
- VD on exclusive property → Column A
- VD reduces gross estate significantly but standard deduction still applies after

---

## Coverage Summary

| Rule Category | Test Vector(s) Covering It |
|---------------|---------------------------|
| TRAIN flat 6% rate | TV-01, TV-02, TV-03, TV-04, TV-10 |
| Pre-TRAIN graduated rate (5% bracket) | — (covered by TV-07, TV-08) |
| Pre-TRAIN 11% bracket | TV-07, TV-08 |
| Standard deduction — citizen/resident, TRAIN (₱5M) | TV-01, TV-02, TV-03, TV-06, TV-10 |
| Standard deduction — citizen/resident, pre-TRAIN (₱1M) | TV-07, TV-08 |
| Standard deduction — NRA (₱500K) | TV-04 |
| Standard deduction — amnesty pre-2018 (₱1M) | TV-09 |
| Family home — exclusive, TRAIN | TV-02, TV-06 |
| Family home — conjugal, TRAIN (½ FMV rule) | TV-03 |
| Family home — pre-TRAIN cap ₱1M, exclusive | TV-07 |
| Family home — pre-TRAIN cap ₱1M, conjugal (½ FMV) | TV-08 |
| Family home — amnesty, pre-2018 cap ₱1M | TV-09 |
| Medical deductions (TRAIN, ≤₱500K) | TV-02, TV-03 |
| Medical deductions (pre-TRAIN, ≤₱500K) | TV-08 |
| ELIT — claims against estate (exclusive) | TV-06, TV-07 |
| ELIT — claims against estate (conjugal) | TV-02, TV-03, TV-08, TV-09 |
| ELIT — unpaid mortgage | TV-03 |
| Funeral deduction (pre-TRAIN) | TV-07, TV-08 |
| Funeral deduction (amnesty pre-2018) | TV-09 |
| Judicial/admin deduction (pre-TRAIN) | TV-08 |
| Judicial/admin deduction (amnesty pre-2018) | TV-09 |
| Vanishing deduction — 80% (18 months) | TV-03 |
| Vanishing deduction — 100% (≤ 1 year) | TV-10 |
| VD ratio adjustment (ELIT > 0) | TV-03 |
| VD ratio = 1.000 (ELIT = 0) | TV-10 |
| ACP property regime | TV-02 |
| CPG property regime | TV-03, TV-08, TV-09 |
| Surviving spouse share — ACP | TV-02 |
| Surviving spouse share — CPG | TV-03, TV-08, TV-09 |
| No surviving spouse (single) | TV-01, TV-04, TV-05, TV-06, TV-07, TV-10 |
| NRA gross estate (PH-situs only) | TV-04 |
| NRA proportional deduction | TV-04 |
| Zero tax — standard deduction > gross estate | TV-05 |
| Zero tax — combined deductions exceed gross estate | TV-06 |
| Amnesty Track A | TV-09 |
| Amnesty minimum payment (₱5,000) | Not triggered in TV-09; edge case documented |
| Amnesty vs. regular pre-TRAIN comparison | TV-09 |
| Amnesty — pre-TRAIN deduction rules | TV-09 |
| Floor at ₱0 — Item 38 | TV-05, TV-06 |
| Floor at ₱0 — Item 40 | TV-05, TV-06 |

---

## Additional Edge-Case Minimum Payment Test (Amnesty Only)

Amnesty test TV-09 does not trigger the ₱5,000 minimum. The following must also be tested as a unit test:

### TV-09b: Amnesty Minimum Payment Floor

**Scenario**: Very small estate with amnesty tax computed below ₱5,000.

```
Gross estate:             ₱1,200,000
Standard deduction (pre-TRAIN, citizen): ₱1,000,000
Net taxable estate:       ₱100,000   // assume no other deductions or spouse share
Computed amnesty tax:     ₱100,000 × 0.06 = ₱6,000
Maximum with minimum:     max(₱5,000, ₱6,000) = ₱6,000
→ Minimum does NOT apply (₱6,000 > ₱5,000)
```

To trigger minimum, use net taxable estate = ₱60,000:
```
Computed amnesty tax:     ₱60,000 × 0.06 = ₱3,600
amnestyTaxDue:            max(₱5,000, ₱3,600) = ₱5,000
output.minimumApplied:    true
```

This must be validated: `output.minimumApplied = true` and `output.amnestyTaxDue = 5_000`.

---

## Relationship to Other Aspects

- **computation-pipeline.md**: Phase numbers in each test vector correspond to the pipeline phases defined there.
- **data-model.md**: Input field names (`decedent`, `assets`, `deductions`, `estate`) match the types defined there.
- **form-1801-fields.md**: Item numbers (29–44) and schedule references (5A–5F, 6A–6D) match the Form 1801 field mapping.
- **regime-detection.md**: Regime detection logic (Phase 1) is exercised in each vector.
- **deduction-vanishing.md**: VD formula validated in TV-03 (80%) and TV-10 (100%).
- **deduction-family-home.md**: ½ FMV rule for conjugal validated in TV-03, TV-08, TV-09. Exclusive FMV validated in TV-02, TV-06.
- **surviving-spouse-share.md**: Spouse share exclusion of VD from conjugal obligations validated in TV-03. Pre-TRAIN funeral/judicial exclusion from obligations validated in TV-08, TV-09.
- **amnesty-computation.md**: Full Track A computation validated in TV-09. Minimum floor validated in TV-09b.
- **correction-amnesty-deductions.md**: Corrected amnesty deduction rules (funeral + judicial for pre-2018 deaths) validated in TV-09.
- **tax-rate-pre-train.md**: Graduated rate brackets validated in TV-07 (11% bracket) and TV-08 (11% bracket).
- **nonresident-deductions.md**: Proportional formula validated in TV-04.
