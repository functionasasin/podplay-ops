# Pre-TRAIN Estate Tax: Rates and Rules
## Applies to Decedents Who Died Before January 1, 2018

**Legal Basis**: NIRC Section 84 as originally enacted by RA 8424 (Tax Reform Act of 1997), effective January 1, 1998

---

## Section 84 — Original Graduated Rate Schedule (Pre-TRAIN)

"There shall be levied, assessed, collected and paid upon the transfer of the net estate of every decedent, whether resident or nonresident of the Philippines, a tax based on the value of such net estate, as computed in accordance with the following schedule:"

### Rate Table

| Net Estate | Tax Due |
|---|---|
| Not over ₱200,000 | **Exempt** |
| Over ₱200,000 but not over ₱500,000 | **5%** of the excess over ₱200,000 |
| Over ₱500,000 but not over ₱2,000,000 | ₱15,000 + **8%** of the excess over ₱500,000 |
| Over ₱2,000,000 but not over ₱5,000,000 | ₱135,000 + **11%** of the excess over ₱2,000,000 |
| Over ₱5,000,000 but not over ₱10,000,000 | ₱465,000 + **15%** of the excess over ₱5,000,000 |
| Over ₱10,000,000 | ₱1,215,000 + **20%** of the excess over ₱10,000,000 |

### Computation Algorithm (Pseudocode)

```
function computePreTrainTax(netEstate):
    if netEstate <= 200_000:
        return 0
    elif netEstate <= 500_000:
        return (netEstate - 200_000) * 0.05
    elif netEstate <= 2_000_000:
        return 15_000 + (netEstate - 500_000) * 0.08
    elif netEstate <= 5_000_000:
        return 135_000 + (netEstate - 2_000_000) * 0.11
    elif netEstate <= 10_000_000:
        return 465_000 + (netEstate - 5_000_000) * 0.15
    else:
        return 1_215_000 + (netEstate - 10_000_000) * 0.20
```

---

## Pre-TRAIN Deduction Rules

### Standard Deduction
**₱1,000,000** (One million pesos) — automatic, no documentation required.

*Contrast with TRAIN: ₱5,000,000*

### Family Home Exemption
**Up to ₱1,000,000** (One million pesos)

Conditions (same as TRAIN but lower cap):
- Certified by Barangay Captain
- Must be actual family residence at time of death
- Residents only

*Contrast with TRAIN: ₱10,000,000*

### Funeral Expenses
**DEDUCTIBLE under pre-TRAIN** (removed by TRAIN Law).

Deductible amount: The **lower of**:
- Actual funeral expenses incurred, OR
- **5% of the gross estate**

Maximum cap: There is no separate peso cap stated in most sources beyond the 5% rule. The amount cannot exceed actual expenses.

**Removed by TRAIN**: Funeral expenses are NOT deductible for deaths on or after January 1, 2018.

### Judicial and Administrative Expenses
**DEDUCTIBLE under pre-TRAIN** (removed by TRAIN Law).

All judicial expenses of the testate or intestate proceedings, and administrative expenses of the estate, including executor's fees, attorney's fees, court costs, and other estate-settlement expenses.

**Removed by TRAIN**: These are NOT deductible for deaths on or after January 1, 2018.

### Claims Against the Estate
Same rules as TRAIN era — fully deductible with proper documentation (notarized instrument). No cap.

### Unpaid Mortgages and Indebtedness
Same rules as TRAIN era — fully deductible on property included in gross estate.

### Unpaid Taxes
Same rules as TRAIN era — taxes accrued as of death are deductible.

### Medical Expenses
Medical expenses incurred within the **1 year** before death.

**Pre-TRAIN Cap**: Sources vary, but the standard interpretation is that medical expenses were also capped at **₱500,000** under pre-TRAIN rules (same as TRAIN). Needs confirmation against original NIRC text.

*Note: If no cap applied pre-TRAIN, full actual medical expenses would have been deductible.*

### Property Previously Taxed (Vanishing Deduction)
Same graduated percentage table as TRAIN: 100%, 80%, 60%, 40%, 20% based on years elapsed.
Same formula applies.

### Transfers for Public Use
Same rules as TRAIN era — bequests to government for exclusively public use.

### Amounts Under RA 4917
Same rules as TRAIN era — employer death benefits.

---

## Pre-TRAIN Filing Rules

| Item | Pre-TRAIN | TRAIN |
|---|---|---|
| Filing deadline | 6 months from death | 1 year from death |
| Extension | Up to 30 days (meritorious) | Up to 30 days (meritorious) |
| CPA certification threshold | Gross estate > ₱2,000,000 | Gross estate > ₱5,000,000 |
| Notice of Death | Required (within 2 months of death, if exceeds ₱20K) | Not required (Sec. 89 repealed) |

---

## Pre-TRAIN vs TRAIN Computation Comparison

### Sample Computation: Pre-TRAIN Estate (death in 2015)

**Given**:
- Married Filipino citizen, CPG regime
- Gross estate (all community property): ₱8,000,000
- Community liabilities: ₱400,000
- Funeral expenses (actual): ₱350,000; 5% of gross estate = ₱400,000 → deductible: ₱350,000
- Family home FMV: ₱1,200,000 → deductible: ₱1,000,000 (cap)
- Standard deduction: ₱1,000,000

**Computation**:
```
Gross Estate (all community):              ₱8,000,000
Less: Community Liabilities:              -₱400,000
Net Community Property:                   ₱7,600,000
Surviving Spouse Share (½):              -₱3,800,000
Gross Estate Attributable to Decedent:   ₱4,200,000

Less Deductions:
  Funeral Expenses (actual < 5%):         -₱350,000
  Standard Deduction:                    -₱1,000,000
  Family Home:                           -₱1,000,000
Net Taxable Estate:                       ₱1,850,000

Tax (₱15,000 + 8% × (₱1,850,000 - ₱500,000)):
  = ₱15,000 + 8% × ₱1,350,000
  = ₱15,000 + ₱108,000
  = ₱123,000
```

### Same Facts Under TRAIN (if death were in 2019)

```
Gross Estate (all community):              ₱8,000,000
Less: Community Liabilities:              -₱400,000
Net Community Property:                   ₱7,600,000
Surviving Spouse Share (½):              -₱3,800,000
Gross Estate Attributable to Decedent:   ₱4,200,000

Less Deductions:
  Standard Deduction:                    -₱5,000,000
  [Family home: ₱600K, cap ₱10M]        -₱600,000
Net Taxable Estate: max(₱0, ₱4,200,000 - ₱5,000,000 - ₱600,000) = ₱0
(Deductions exceed gross estate; estate tax = ₱0)
```

---

## Key Differences Summary

| Deduction Item | Pre-TRAIN | TRAIN |
|---|---|---|
| Standard Deduction | ₱1,000,000 | ₱5,000,000 |
| Family Home | ≤ ₱1,000,000 | ≤ ₱10,000,000 |
| Funeral Expenses | Lower of actual or 5% of gross estate | **NOT DEDUCTIBLE** |
| Judicial/Admin Expenses | Fully deductible | **NOT DEDUCTIBLE** |
| Medical Expenses | ≤ ₱500,000 (1-year window) | ≤ ₱500,000 (1-year window) |
| Claims Against Estate | Fully deductible (documented) | Same |
| Vanishing Deduction | 100%/80%/60%/40%/20% | Same |
| Transfers for Public Use | Fully deductible | Same |
| RA 4917 Benefits | Fully deductible | Same |
| Filing Deadline | 6 months | 1 year |
| Graduated Rates | 0%, 5%, 8%, 11%, 15%, 20% | Flat 6% |
| Exemption Threshold | ₱200,000 net estate | None (6% from ₱1) |
