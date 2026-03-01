# Graduated Income Tax Rate Table — Philippine Individual Taxpayers

**Legal basis:** NIRC Section 24(A)(2)(a), as amended by Republic Act 10963 (TRAIN Law), signed December 19, 2017, effective January 1, 2018.
**Applies to:** All self-employed individuals, professionals, and freelancers using Path A (Graduated + Itemized) or Path B (Graduated + OSD). Also applies to the compensation income portion of mixed-income earners regardless of which path they choose for business income.
**Does NOT apply to:** Taxpayers who elect the 8% flat rate (Path C). Path C replaces the graduated rate, not supplements it.
**Last updated:** 2026-03-01
**Cross-reference:** [computation-rules.md CR-002, CR-003, CR-004](../computation-rules.md) | [scenarios.md](../scenarios.md) | [decision-trees.md](../decision-trees.md)

---

## 1. Schedule Selection — Which Rate Table Applies?

TRAIN Law enacted two graduated rate schedules for individual taxpayers:

| Schedule | Effective Period | Key Difference |
|----------|-----------------|----------------|
| Schedule 1 (Transitional) | January 1, 2018 – December 31, 2022 | Higher rates in Brackets 2-5 |
| Schedule 2 (Current) | January 1, 2023 – present (no sunset provision) | Lower rates in Brackets 2-5 |

**Determination rule:** The schedule is determined by the **taxable year** being computed, NOT the filing date.

- Tax year 2018: Schedule 1
- Tax year 2019: Schedule 1
- Tax year 2020: Schedule 1
- Tax year 2021: Schedule 1
- Tax year 2022: Schedule 1
- Tax year 2023: Schedule 2 ← first year of current rates
- Tax year 2024: Schedule 2
- Tax year 2025: Schedule 2
- Tax year 2026: Schedule 2 (no pending legislation to change this as of 2026-03-01)

**Engine rule:** The engine must accept a `tax_year` parameter and select the correct schedule. Default to Schedule 2 for any year ≥ 2023. For years < 2018, this tool is not applicable (pre-TRAIN rates differ).

---

## 2. Schedule 1 — Transitional Rates (2018–2022)

**Source:** RA 10963 Section 5, amending NIRC Section 24(A)(2)(a), first schedule.
**Effective:** January 1, 2018 to December 31, 2022 (inclusive).

### 2.1 Full Rate Table

| Bracket | Taxable Income Range | Base Tax (Fixed Amount) | Marginal Rate | Marginal Rate Applied To |
|---------|---------------------|------------------------|--------------|--------------------------|
| 1 | ₱0 – ₱250,000 | ₱0 | 0% | Entire income |
| 2 | Over ₱250,000 – ₱400,000 | ₱0 | 20% | Excess over ₱250,000 |
| 3 | Over ₱400,000 – ₱800,000 | ₱30,000 | 25% | Excess over ₱400,000 |
| 4 | Over ₱800,000 – ₱2,000,000 | ₱130,000 | 30% | Excess over ₱800,000 |
| 5 | Over ₱2,000,000 – ₱8,000,000 | ₱490,000 | 32% | Excess over ₱2,000,000 |
| 6 | Over ₱8,000,000 | ₱2,410,000 | 35% | Excess over ₱8,000,000 |

### 2.2 Bracket Boundary Values (inclusive check)

| Bracket | Lower Bound (₱) | Upper Bound (₱) | Lower Inclusive? | Upper Inclusive? |
|---------|----------------|----------------|-----------------|-----------------|
| 1 | 0 | 250,000 | Yes | Yes |
| 2 | 250,000.01 | 400,000 | Yes | Yes |
| 3 | 400,000.01 | 800,000 | Yes | Yes |
| 4 | 800,000.01 | 2,000,000 | Yes | Yes |
| 5 | 2,000,000.01 | 8,000,000 | Yes | Yes |
| 6 | 8,000,000.01 | ∞ | Yes | N/A (no upper bound) |

**Engine note:** "Over ₱250,000" means strictly greater than ₱250,000. An income of exactly ₱250,000 falls in Bracket 1 (0% rate). An income of ₱250,000.01 falls in Bracket 2.

### 2.3 Computed Tax at Bracket Boundary Points (Schedule 1 Verification)

| Taxable Income | Tax Due | Computation |
|---------------|---------|-------------|
| ₱0 | ₱0 | Bracket 1: ₱0 × 0% = ₱0 |
| ₱250,000 | ₱0 | Bracket 1: ₱0 base + 0% × ₱250,000 = ₱0 |
| ₱250,001 | ₱0.20 | Bracket 2: ₱0 + 20% × ₱1 = ₱0.20 |
| ₱400,000 | ₱30,000 | Bracket 2: ₱0 + 20% × ₱150,000 = ₱30,000 |
| ₱400,001 | ₱30,000.25 | Bracket 3: ₱30,000 + 25% × ₱1 = ₱30,000.25 |
| ₱800,000 | ₱130,000 | Bracket 3: ₱30,000 + 25% × ₱400,000 = ₱130,000 |
| ₱800,001 | ₱130,000.30 | Bracket 4: ₱130,000 + 30% × ₱1 = ₱130,000.30 |
| ₱2,000,000 | ₱490,000 | Bracket 4: ₱130,000 + 30% × ₱1,200,000 = ₱490,000 |
| ₱2,000,001 | ₱490,000.32 | Bracket 5: ₱490,000 + 32% × ₱1 = ₱490,000.32 |
| ₱8,000,000 | ₱2,410,000 | Bracket 5: ₱490,000 + 32% × ₱6,000,000 = ₱2,410,000 |
| ₱8,000,001 | ₱2,410,000.35 | Bracket 6: ₱2,410,000 + 35% × ₱1 = ₱2,410,000.35 |

---

## 3. Schedule 2 — Current Rates (2023+)

**Source:** RA 10963 Section 5, amending NIRC Section 24(A)(2)(a), second schedule.
**Effective:** January 1, 2023 onwards. No sunset provision — applies until a new law amends it.

### 3.1 Full Rate Table

| Bracket | Taxable Income Range | Base Tax (Fixed Amount) | Marginal Rate | Marginal Rate Applied To |
|---------|---------------------|------------------------|--------------|--------------------------|
| 1 | ₱0 – ₱250,000 | ₱0 | 0% | Entire income |
| 2 | Over ₱250,000 – ₱400,000 | ₱0 | 15% | Excess over ₱250,000 |
| 3 | Over ₱400,000 – ₱800,000 | ₱22,500 | 20% | Excess over ₱400,000 |
| 4 | Over ₱800,000 – ₱2,000,000 | ₱102,500 | 25% | Excess over ₱800,000 |
| 5 | Over ₱2,000,000 – ₱8,000,000 | ₱402,500 | 30% | Excess over ₱2,000,000 |
| 6 | Over ₱8,000,000 | ₱2,202,500 | 35% | Excess over ₱8,000,000 |

### 3.2 Bracket Boundary Values (inclusive check)

| Bracket | Lower Bound (₱) | Upper Bound (₱) | Lower Inclusive? | Upper Inclusive? |
|---------|----------------|----------------|-----------------|-----------------|
| 1 | 0 | 250,000 | Yes | Yes |
| 2 | 250,000.01 | 400,000 | Yes | Yes |
| 3 | 400,000.01 | 800,000 | Yes | Yes |
| 4 | 800,000.01 | 2,000,000 | Yes | Yes |
| 5 | 2,000,000.01 | 8,000,000 | Yes | Yes |
| 6 | 8,000,000.01 | ∞ | Yes | N/A (no upper bound) |

### 3.3 Computed Tax at Bracket Boundary Points (Schedule 2 Verification)

| Taxable Income | Tax Due | Computation |
|---------------|---------|-------------|
| ₱0 | ₱0 | Bracket 1: ₱0 base + 0% of ₱0 = ₱0 |
| ₱250,000 | ₱0 | Bracket 1: ₱0 base + 0% of ₱250,000 = ₱0 |
| ₱250,001 | ₱0.15 | Bracket 2: ₱0 + 15% × ₱1 = ₱0.15 |
| ₱325,000 | ₱11,250 | Bracket 2: ₱0 + 15% × ₱75,000 = ₱11,250 |
| ₱400,000 | ₱22,500 | Bracket 2: ₱0 + 15% × ₱150,000 = ₱22,500 |
| ₱400,001 | ₱22,500.20 | Bracket 3: ₱22,500 + 20% × ₱1 = ₱22,500.20 |
| ₱600,000 | ₱62,500 | Bracket 3: ₱22,500 + 20% × ₱200,000 = ₱62,500 |
| ₱800,000 | ₱102,500 | Bracket 3: ₱22,500 + 20% × ₱400,000 = ₱102,500 |
| ₱800,001 | ₱102,500.25 | Bracket 4: ₱102,500 + 25% × ₱1 = ₱102,500.25 |
| ₱1,000,000 | ₱152,500 | Bracket 4: ₱102,500 + 25% × ₱200,000 = ₱152,500 |
| ₱1,500,000 | ₱277,500 | Bracket 4: ₱102,500 + 25% × ₱700,000 = ₱277,500 |
| ₱2,000,000 | ₱402,500 | Bracket 4: ₱102,500 + 25% × ₱1,200,000 = ₱402,500 |
| ₱2,000,001 | ₱402,500.30 | Bracket 5: ₱402,500 + 30% × ₱1 = ₱402,500.30 |
| ₱3,000,000 | ₱702,500 | Bracket 5: ₱402,500 + 30% × ₱1,000,000 = ₱702,500 |
| ₱5,000,000 | ₱1,302,500 | Bracket 5: ₱402,500 + 30% × ₱3,000,000 = ₱1,302,500 |
| ₱8,000,000 | ₱2,202,500 | Bracket 5: ₱402,500 + 30% × ₱6,000,000 = ₱2,202,500 |
| ₱8,000,001 | ₱2,202,500.35 | Bracket 6: ₱2,202,500 + 35% × ₱1 = ₱2,202,500.35 |
| ₱10,000,000 | ₱2,902,500 | Bracket 6: ₱2,202,500 + 35% × ₱2,000,000 = ₱2,902,500 |

---

## 4. Graduated Tax Computation — Pseudocode

### 4.1 Schedule Selector

```
function select_schedule(tax_year: Integer) -> Schedule:
    if tax_year >= 2018 AND tax_year <= 2022:
        return SCHEDULE_1
    else if tax_year >= 2023:
        return SCHEDULE_2
    else:
        raise Error("Tax year must be 2018 or later; pre-TRAIN rates not supported")
```

### 4.2 Schedule 1 Computation (2018–2022)

```
function compute_graduated_tax_schedule1(taxable_income: Decimal) -> Decimal:
    // taxable_income: non-negative number, Philippine Pesos
    // Returns: income tax due, rounded to 2 decimal places

    if taxable_income < 0:
        raise Error("Taxable income cannot be negative")

    if taxable_income <= 250_000:
        return 0.00

    else if taxable_income <= 400_000:
        return round(0.20 * (taxable_income - 250_000), 2)

    else if taxable_income <= 800_000:
        return round(30_000 + 0.25 * (taxable_income - 400_000), 2)

    else if taxable_income <= 2_000_000:
        return round(130_000 + 0.30 * (taxable_income - 800_000), 2)

    else if taxable_income <= 8_000_000:
        return round(490_000 + 0.32 * (taxable_income - 2_000_000), 2)

    else:
        return round(2_410_000 + 0.35 * (taxable_income - 8_000_000), 2)
```

### 4.3 Schedule 2 Computation (2023+, Current)

```
function compute_graduated_tax_schedule2(taxable_income: Decimal) -> Decimal:
    // taxable_income: non-negative number, Philippine Pesos
    // Returns: income tax due, rounded to 2 decimal places

    if taxable_income < 0:
        raise Error("Taxable income cannot be negative")

    if taxable_income <= 250_000:
        return 0.00

    else if taxable_income <= 400_000:
        return round(0.15 * (taxable_income - 250_000), 2)

    else if taxable_income <= 800_000:
        return round(22_500 + 0.20 * (taxable_income - 400_000), 2)

    else if taxable_income <= 2_000_000:
        return round(102_500 + 0.25 * (taxable_income - 800_000), 2)

    else if taxable_income <= 8_000_000:
        return round(402_500 + 0.30 * (taxable_income - 2_000_000), 2)

    else:
        return round(2_202_500 + 0.35 * (taxable_income - 8_000_000), 2)
```

### 4.4 Dispatcher (Tax Year Aware)

```
function compute_graduated_tax(taxable_income: Decimal, tax_year: Integer) -> Decimal:
    schedule = select_schedule(tax_year)
    if schedule == SCHEDULE_1:
        return compute_graduated_tax_schedule1(taxable_income)
    else:
        return compute_graduated_tax_schedule2(taxable_income)
```

---

## 5. Rounding Rules

**Rule GRT-R1:** All intermediate computations must use full decimal precision (no intermediate rounding).
**Rule GRT-R2:** The final output (income tax due) is rounded to **2 decimal places** using standard rounding (half-up: 0.005 rounds to 0.01).
**Rule GRT-R3:** BIR forms require the final figure in whole pesos. When writing to a BIR form field, truncate to whole peso (do NOT round — truncate per standard BIR form instructions). Example: ₱22,500.75 computed → write ₱22,500 on the form.
**Rule GRT-R4:** For comparison and all internal computations (regime selection, tax savings), use the untruncated ₱22,500.75 value.
**Rule GRT-R5:** Do not apply rounding to taxable income itself before passing to the computation function.

---

## 6. Worked Examples — Schedule 1 (Tax Years 2018–2022)

### Example S1-E1: Bracket 1 (Zero Tax)

**Taxpayer:** Freelance virtual assistant, Tax Year 2019
**Gross receipts:** ₱280,000
**Applicable deductions (OSD Path B):** ₱280,000 × 40% = ₱112,000
**Net taxable income:** ₱280,000 − ₱112,000 = ₱168,000
**Bracket:** 1 (₱0 – ₱250,000)
**Tax computation:** ₱0 (zero bracket)
**Income Tax Due:** ₱0

---

### Example S1-E2: Bracket 2 (20% Marginal Rate)

**Taxpayer:** Freelance writer, Tax Year 2020
**Gross receipts:** ₱450,000
**Applicable deductions (OSD Path B):** ₱450,000 × 40% = ₱180,000
**Net taxable income:** ₱450,000 − ₱180,000 = ₱270,000
**Bracket:** 2 (Over ₱250,000 – ₱400,000)
**Tax computation:** 20% × (₱270,000 − ₱250,000) = 20% × ₱20,000 = ₱4,000
**Income Tax Due:** ₱4,000

---

### Example S1-E3: Bracket 3 (25% Marginal Rate)

**Taxpayer:** Graphic designer, Tax Year 2021
**Gross receipts:** ₱1,000,000
**Business expenses (itemized):** ₱350,000
**Net taxable income:** ₱1,000,000 − ₱350,000 = ₱650,000
**Bracket:** 3 (Over ₱400,000 – ₱800,000)
**Tax computation:** ₱30,000 + 25% × (₱650,000 − ₱400,000) = ₱30,000 + 25% × ₱250,000 = ₱30,000 + ₱62,500 = ₱92,500
**Income Tax Due:** ₱92,500

---

### Example S1-E4: Bracket 4 (30% Marginal Rate)

**Taxpayer:** Software developer consultant, Tax Year 2022
**Gross receipts:** ₱2,500,000
**Business expenses (itemized):** ₱600,000
**Net taxable income:** ₱2,500,000 − ₱600,000 = ₱1,900,000
**Bracket:** 4 (Over ₱800,000 – ₱2,000,000)
**Tax computation:** ₱130,000 + 30% × (₱1,900,000 − ₱800,000) = ₱130,000 + 30% × ₱1,100,000 = ₱130,000 + ₱330,000 = ₱460,000
**Income Tax Due:** ₱460,000

---

### Example S1-E5: Bracket 5 (32% Marginal Rate)

**Taxpayer:** Law firm partner, Tax Year 2021
**Professional income:** ₱4,000,000
**OSD deduction:** ₱4,000,000 × 40% = ₱1,600,000
**Net taxable income:** ₱4,000,000 − ₱1,600,000 = ₱2,400,000
**Bracket:** 5 (Over ₱2,000,000 – ₱8,000,000)
**Tax computation:** ₱490,000 + 32% × (₱2,400,000 − ₱2,000,000) = ₱490,000 + 32% × ₱400,000 = ₱490,000 + ₱128,000 = ₱618,000
**Income Tax Due:** ₱618,000

---

### Example S1-E6: Bracket 6 (35% Marginal Rate)

**Taxpayer:** Prominent medical specialist, Tax Year 2022
**Professional income:** ₱10,000,000
**Business expenses (itemized):** ₱2,000,000
**Net taxable income:** ₱10,000,000 − ₱2,000,000 = ₱8,000,000
**Note:** ₱8,000,000 is exactly at the boundary — falls in Bracket 5, not 6.
**Tax computation:** ₱490,000 + 32% × (₱8,000,000 − ₱2,000,000) = ₱490,000 + 32% × ₱6,000,000 = ₱490,000 + ₱1,920,000 = ₱2,410,000
**Income Tax Due:** ₱2,410,000

---

### Example S1-E7: Bracket 6 — Strictly Over ₱8,000,000

**Taxpayer:** High-earning architect, Tax Year 2022
**Professional income:** ₱15,000,000
**OSD deduction:** ₱15,000,000 × 40% = ₱6,000,000
**Net taxable income:** ₱15,000,000 − ₱6,000,000 = ₱9,000,000
**Bracket:** 6 (Over ₱8,000,000)
**Tax computation:** ₱2,410,000 + 35% × (₱9,000,000 − ₱8,000,000) = ₱2,410,000 + 35% × ₱1,000,000 = ₱2,410,000 + ₱350,000 = ₱2,760,000
**Income Tax Due:** ₱2,760,000

---

## 7. Worked Examples — Schedule 2 (Tax Years 2023+, Current)

### Example S2-E1: Bracket 1 (Zero Tax)

**Taxpayer:** Entry-level virtual assistant, Tax Year 2024
**Gross receipts:** ₱360,000
**OSD deduction:** ₱360,000 × 40% = ₱144,000
**Net taxable income:** ₱216,000
**Bracket:** 1 (₱0 – ₱250,000)
**Tax computation:** ₱0
**Income Tax Due:** ₱0

---

### Example S2-E2: Bracket 2 (15% Marginal Rate)

**Taxpayer:** Freelance content creator, Tax Year 2024
**Gross receipts:** ₱500,000
**OSD deduction:** ₱500,000 × 40% = ₱200,000
**Net taxable income:** ₱500,000 − ₱200,000 = ₱300,000
**Bracket:** 2 (Over ₱250,000 – ₱400,000)
**Tax computation:** 15% × (₱300,000 − ₱250,000) = 15% × ₱50,000 = ₱7,500
**Income Tax Due:** ₱7,500
**Notes:** Under Schedule 1 (2018–2022) this same scenario would compute: 20% × ₱50,000 = ₱10,000. TRAIN rate reduction saves ₱2,500.

---

### Example S2-E3: Bracket 2 — At Upper Boundary

**Taxpayer:** Freelance translator, Tax Year 2025
**Gross receipts:** ₱650,000
**Business expenses (itemized):** ₱10,000 (minimal — some online subscriptions)
**Net taxable income:** ₱650,000 − ₱10,000 = ₱640,000
**Wait:** ₱640,000 is in Bracket 3, not 2. Re-check.
**Net taxable income (corrected example for boundary):** OSD path: ₱650,000 − ₱260,000 = ₱390,000. This falls in Bracket 2.
**Net taxable income:** ₱390,000
**Tax computation:** 15% × (₱390,000 − ₱250,000) = 15% × ₱140,000 = ₱21,000
**Income Tax Due:** ₱21,000

---

### Example S2-E4: Bracket 3 (20% Marginal Rate)

**Taxpayer:** UI/UX Designer, Tax Year 2025
**Gross receipts:** ₱800,000
**Business expenses (itemized):** ₱150,000 (software subscriptions, equipment amortization, internet, professional development)
**Net taxable income:** ₱800,000 − ₱150,000 = ₱650,000
**Bracket:** 3 (Over ₱400,000 – ₱800,000)
**Tax computation:** ₱22,500 + 20% × (₱650,000 − ₱400,000) = ₱22,500 + 20% × ₱250,000 = ₱22,500 + ₱50,000 = ₱72,500
**Income Tax Due:** ₱72,500

---

### Example S2-E5: Bracket 3 — At Exact Upper Boundary

**Taxpayer:** Freelancer with exactly ₱800,000 net taxable income, Tax Year 2024
**Net taxable income:** ₱800,000 exactly
**Bracket:** 3 (₱800,000 is the upper bound, inclusive of Bracket 3)
**Tax computation:** ₱22,500 + 20% × (₱800,000 − ₱400,000) = ₱22,500 + 20% × ₱400,000 = ₱22,500 + ₱80,000 = ₱102,500
**Income Tax Due:** ₱102,500
**Notes:** This is also the base tax for Bracket 4 (₱102,500 base), confirming the table is internally consistent.

---

### Example S2-E6: Bracket 4 (25% Marginal Rate)

**Taxpayer:** Independent IT consultant, Tax Year 2024
**Gross receipts:** ₱2,000,000
**Business expenses (itemized):** ₱500,000 (employee salaries × 1, rent, utilities, equipment)
**Net taxable income:** ₱2,000,000 − ₱500,000 = ₱1,500,000
**Bracket:** 4 (Over ₱800,000 – ₱2,000,000)
**Tax computation:** ₱102,500 + 25% × (₱1,500,000 − ₱800,000) = ₱102,500 + 25% × ₱700,000 = ₱102,500 + ₱175,000 = ₱277,500
**Income Tax Due:** ₱277,500

---

### Example S2-E7: Bracket 4 — At Exact Upper Boundary

**Taxpayer:** Physician specialist, Tax Year 2025
**Professional income:** ₱3,000,000
**OSD deduction:** ₱3,000,000 × 40% = ₱1,200,000
**Net taxable income:** ₱3,000,000 − ₱1,200,000 = ₱1,800,000
**Bracket:** 4 (Over ₱800,000 – ₱2,000,000)
**Tax computation:** ₱102,500 + 25% × (₱1,800,000 − ₱800,000) = ₱102,500 + 25% × ₱1,000,000 = ₱102,500 + ₱250,000 = ₱352,500
**Income Tax Due:** ₱352,500
**Note on this taxpayer:** Gross receipts = ₱3,000,000 exactly. The 8% option is still available (threshold is "not exceeding ₱3,000,000" per RR 8-2018, which means ≤ ₱3,000,000). Path C check: (₱3,000,000 − ₱250,000) × 8% = ₱220,000. Path C would be significantly lower. The OSD path was just for Bracket 4 illustration purposes.

---

### Example S2-E8: Bracket 5 (30% Marginal Rate)

**Taxpayer:** Management consultant, Tax Year 2024
**Professional income:** ₱5,000,000
**Business expenses (itemized):** ₱1,000,000
**Net taxable income:** ₱5,000,000 − ₱1,000,000 = ₱4,000,000
**Bracket:** 5 (Over ₱2,000,000 – ₱8,000,000)
**Tax computation:** ₱402,500 + 30% × (₱4,000,000 − ₱2,000,000) = ₱402,500 + 30% × ₱2,000,000 = ₱402,500 + ₱600,000 = ₱1,002,500
**Income Tax Due:** ₱1,002,500

---

### Example S2-E9: Bracket 6 (35% Marginal Rate)

**Taxpayer:** Senior corporate attorney with private practice, Tax Year 2025
**Professional income:** ₱12,000,000
**Business expenses (itemized):** ₱2,500,000 (staff, office rent, vehicles, professional development)
**Net taxable income:** ₱12,000,000 − ₱2,500,000 = ₱9,500,000
**Bracket:** 6 (Over ₱8,000,000)
**Tax computation:** ₱2,202,500 + 35% × (₱9,500,000 − ₱8,000,000) = ₱2,202,500 + 35% × ₱1,500,000 = ₱2,202,500 + ₱525,000 = ₱2,727,500
**Income Tax Due:** ₱2,727,500

---

## 8. Effective Tax Rate Table — Schedule 2 (2023+)

For reference: effective rate = Income Tax Due ÷ Net Taxable Income

| Net Taxable Income (₱) | IT Due (₱) | Effective Rate |
|------------------------|-----------|---------------|
| 100,000 | 0 | 0.00% |
| 200,000 | 0 | 0.00% |
| 250,000 | 0 | 0.00% |
| 300,000 | 7,500 | 2.50% |
| 350,000 | 15,000 | 4.29% |
| 400,000 | 22,500 | 5.63% |
| 450,000 | 32,500 | 7.22% |
| 500,000 | 42,500 | 8.50% |
| 600,000 | 62,500 | 10.42% |
| 700,000 | 82,500 | 11.79% |
| 800,000 | 102,500 | 12.81% |
| 900,000 | 127,500 | 14.17% |
| 1,000,000 | 152,500 | 15.25% |
| 1,200,000 | 202,500 | 16.88% |
| 1,500,000 | 277,500 | 18.50% |
| 1,800,000 | 352,500 | 19.58% |
| 2,000,000 | 402,500 | 20.13% |
| 2,500,000 | 552,500 | 22.10% |
| 3,000,000 | 702,500 | 23.42% |
| 4,000,000 | 1,002,500 | 25.06% |
| 5,000,000 | 1,302,500 | 26.05% |
| 6,000,000 | 1,602,500 | 26.71% |
| 8,000,000 | 2,202,500 | 27.53% |
| 10,000,000 | 2,902,500 | 29.03% |
| 15,000,000 | 4,652,500 | 31.02% |
| 20,000,000 | 6,402,500 | 32.01% |

---

## 9. Graduated Tax in the Quarterly Cumulative Method

**Context:** When filing Form 1701Q (quarterly income tax returns), the graduated tax is computed on a **cumulative** basis, not independently per quarter. The same rate table applies, but the input is cumulative year-to-date income.

**Reference:** [computation-rules.md CR-011](../computation-rules.md) — Quarterly Cumulative Method

### 9.1 How Quarterly Tax Due Is Computed

```
function compute_quarterly_income_tax_due(
    cumulative_gross_receipts_ytd: Decimal,  // Year-to-date gross receipts through this quarter
    cumulative_deductions_ytd: Decimal,       // Year-to-date deductions (OSD or itemized)
    total_cwt_ytd: Decimal,                   // Year-to-date creditable withholding tax
    prior_quarter_payments_ytd: Decimal,      // Sum of Q1...(Q-1) income tax payments
    tax_year: Integer,
    quarter: Integer  // 1, 2, or 3 (Q4 is annual ITR)
) -> QuarterlyTaxResult:

    // Step 1: Compute cumulative taxable income
    cumulative_taxable_income = cumulative_gross_receipts_ytd - cumulative_deductions_ytd

    // Step 2: Apply graduated rate table to CUMULATIVE income
    cumulative_income_tax = compute_graduated_tax(cumulative_taxable_income, tax_year)

    // Step 3: Deduct CWT and prior payments
    tax_still_due = cumulative_income_tax - total_cwt_ytd - prior_quarter_payments_ytd

    // Step 4: Result
    return QuarterlyTaxResult {
        cumulative_taxable_income: cumulative_taxable_income,
        cumulative_income_tax: cumulative_income_tax,
        cwt_applied: total_cwt_ytd,
        prior_payments_applied: prior_quarter_payments_ytd,
        tax_due_this_quarter: max(0, tax_still_due),
        excess_cwt_to_carry: max(0, -tax_still_due)  // positive if overpayment
    }
```

### 9.2 Quarterly Cumulative Example (Schedule 2)

**Taxpayer:** Independent consultant, Tax Year 2024, OSD path (40% deduction)
**Gross receipts per quarter:**
- Q1: ₱300,000
- Q2: ₱350,000
- Q3: ₱400,000
- Q4 (annual): ₱450,000
- **Full Year Total:** ₱1,500,000

**CWT received (Form 2307):**
- Q1: ₱15,000
- Q2: ₱17,500
- Q3: ₱20,000
- Q4 additional: ₱22,500
- **Full Year CWT Total:** ₱75,000

#### Q1 Computation:
- Cumulative gross: ₱300,000
- OSD: ₱300,000 × 40% = ₱120,000
- Cumulative taxable: ₱180,000
- Graduated tax: ₱0 (Bracket 1, below ₱250,000)
- Less CWT: ₱15,000
- Less prior payments: ₱0
- Tax due Q1: max(0, ₱0 − ₱15,000 − ₱0) = ₱0 (excess CWT ₱15,000 carried forward)

#### Q2 Computation:
- Cumulative gross: ₱650,000
- OSD: ₱650,000 × 40% = ₱260,000
- Cumulative taxable: ₱390,000
- Graduated tax (Schedule 2, Bracket 2): 15% × (₱390,000 − ₱250,000) = 15% × ₱140,000 = ₱21,000
- Less CWT (total through Q2): ₱15,000 + ₱17,500 = ₱32,500
- Less prior payments: ₱0 (no Q1 payment made)
- Tax due Q2: max(0, ₱21,000 − ₱32,500 − ₱0) = ₱0 (excess CWT ₱11,500 carried forward)

#### Q3 Computation:
- Cumulative gross: ₱1,050,000
- OSD: ₱1,050,000 × 40% = ₱420,000
- Cumulative taxable: ₱630,000
- Graduated tax (Schedule 2, Bracket 3): ₱22,500 + 20% × (₱630,000 − ₱400,000) = ₱22,500 + 20% × ₱230,000 = ₱22,500 + ₱46,000 = ₱68,500
- Less CWT (total through Q3): ₱32,500 + ₱20,000 = ₱52,500
- Less prior payments: ₱0 + ₱0 = ₱0
- Tax due Q3: max(0, ₱68,500 − ₱52,500 − ₱0) = ₱16,000

#### Annual ITR (1701/1701A) Computation:
- Full-year gross: ₱1,500,000
- OSD: ₱1,500,000 × 40% = ₱600,000
- Full-year taxable: ₱900,000
- Graduated tax (Schedule 2, Bracket 4): ₱102,500 + 25% × (₱900,000 − ₱800,000) = ₱102,500 + 25% × ₱100,000 = ₱102,500 + ₱25,000 = ₱127,500
- Less full-year CWT: ₱75,000
- Less Q3 payment (only quarterly payment made): ₱16,000
- Balance payable on annual: max(0, ₱127,500 − ₱75,000 − ₱16,000) = ₱36,500

**Summary:**

| Period | Gross (Cumulative) | Taxable (Cumulative) | IT (Cumulative) | CWT (Cumulative) | Prior Pmts | This Period Tax Due |
|--------|-------------------|---------------------|----------------|------------------|-----------|---------------------|
| Q1 | ₱300,000 | ₱180,000 | ₱0 | ₱15,000 | ₱0 | ₱0 |
| Q2 | ₱650,000 | ₱390,000 | ₱21,000 | ₱32,500 | ₱0 | ₱0 |
| Q3 | ₱1,050,000 | ₱630,000 | ₱68,500 | ₱52,500 | ₱0 | ₱16,000 |
| Annual | ₱1,500,000 | ₱900,000 | ₱127,500 | ₱75,000 | ₱16,000 | ₱36,500 |

---

## 10. Mixed-Income Earner — Graduated Tax Application

**Context:** When a taxpayer has both compensation income AND business/professional income (mixed-income earner), and they choose the graduated rate for business income (not the 8% option), the computation requires combining both income streams.

**Reference:** [computation-rules.md CR-013](../computation-rules.md) — Mixed Income Rules

### 10.1 Approach for Graduated Business Income (Paths A or B)

```
function compute_mixed_income_graduated_tax(
    gross_compensation: Decimal,    // Salary/wages from employment
    non_taxable_compensation: Decimal,  // 13th month pay exempt portion (≤₱90,000), SSS, PhilHealth, HDMF employee share
    gross_business_receipts: Decimal,
    business_deductions: Decimal,   // Either itemized or OSD amount
    tax_year: Integer
) -> MixedIncomeGraduatedTaxResult:

    // Step 1: Net compensation
    taxable_compensation = gross_compensation - non_taxable_compensation

    // Step 2: Net business income
    net_business_income = gross_business_receipts - business_deductions

    // Step 3: Total taxable income
    total_taxable = taxable_compensation + net_business_income

    // Step 4: Apply graduated tax to COMBINED income
    income_tax_due = compute_graduated_tax(total_taxable, tax_year)

    // Step 5: Less withholding tax on compensation (already collected by employer)
    // This is the tax withheld on compensation per Form 2316 — NOT Form 2307
    return MixedIncomeGraduatedTaxResult {
        taxable_compensation: taxable_compensation,
        net_business_income: net_business_income,
        total_taxable: total_taxable,
        income_tax_due: income_tax_due
    }
```

### 10.2 Non-Taxable Compensation Exclusions (Current as of 2024)

Items excluded from gross compensation when computing taxable compensation:

| Exclusion | Maximum Exempt Amount | Legal Basis |
|-----------|----------------------|-------------|
| 13th month pay and other benefits | ₱90,000 | NIRC Sec. 32(B)(7)(e)(iv), as amended by TRAIN |
| SSS employee contributions | Actual amount | NIRC Sec. 32(B)(7)(f) |
| PhilHealth employee contributions | Actual amount | NIRC Sec. 32(B)(7)(f) |
| HDMF/Pag-IBIG employee contributions | Actual amount | NIRC Sec. 32(B)(7)(f) |
| GSIS employee contributions | Actual amount | NIRC Sec. 32(B)(7)(f) |
| Union dues | Actual amount | NIRC Sec. 32(B)(7)(g) |
| De minimis benefits (meals, uniforms, medical cash allowance, etc.) | Various limits | RR No. 11-2018 |

### 10.3 Worked Example: Mixed Income, Graduated Business Path

**Taxpayer:** Employee-Freelancer, Tax Year 2024
**Compensation:** Annual salary ₱480,000, employer-withheld tax (Form 2316) = ₱12,500
**13th month pay:** ₱40,000 (fully exempt, below ₱90,000)
**SSS+PhilHealth+Pag-IBIG:** ₱24,000
**Non-taxable compensation:** ₱40,000 + ₱24,000 = ₱64,000
**Taxable compensation:** ₱480,000 − ₱64,000 = ₱416,000

**Freelance income:** ₱700,000 gross receipts
**Business expenses (itemized):** ₱120,000
**Net business income:** ₱700,000 − ₱120,000 = ₱580,000

**Total taxable income:** ₱416,000 + ₱580,000 = ₱996,000
**Graduated tax (Schedule 2):** ₱102,500 + 25% × (₱996,000 − ₱800,000) = ₱102,500 + 25% × ₱196,000 = ₱102,500 + ₱49,000 = ₱151,500

**Tax credits:**
- Employer-withheld tax (compensation): ₱12,500
- CWT on business income (Form 2307): ₱35,000
- Total credits: ₱47,500

**Tax still due:** ₱151,500 − ₱47,500 = ₱104,000

---

## 11. Schedule 1 vs. Schedule 2 — Tax Savings Comparison

For reference, the reduction in income tax due from Schedule 1 to Schedule 2 at common income levels:

| Net Taxable Income | Schedule 1 Tax | Schedule 2 Tax | Annual Savings |
|-------------------|---------------|---------------|---------------|
| ₱300,000 | ₱10,000 | ₱7,500 | ₱2,500 |
| ₱400,000 | ₱30,000 | ₱22,500 | ₱7,500 |
| ₱500,000 | ₱55,000 | ₱42,500 | ₱12,500 |
| ₱600,000 | ₱80,000 | ₱62,500 | ₱17,500 |
| ₱700,000 | ₱105,000 | ₱82,500 | ₱22,500 |
| ₱800,000 | ₱130,000 | ₱102,500 | ₱27,500 |
| ₱1,000,000 | ₱190,000 | ₱152,500 | ₱37,500 |
| ₱1,500,000 | ₱340,000 | ₱277,500 | ₱62,500 |
| ₱2,000,000 | ₱490,000 | ₱402,500 | ₱87,500 |
| ₱3,000,000 | ₱810,000 | ₱702,500 | ₱107,500 |
| ₱5,000,000 | ₱1,450,000 | ₱1,302,500 | ₱147,500 |
| ₱8,000,000 | ₱2,410,000 | ₱2,202,500 | ₱207,500 |

**Note:** Savings at Bracket 6 (over ₱8M) are the same marginal rate (35%), so savings cap at ₱207,500 regardless of income above ₱8M (fixed reduction from the bracket base difference: ₱2,410,000 − ₱2,202,500 = ₱207,500).

---

## 12. Edge Cases and Special Situations

### Edge Case GRT-EC-01: Taxable Income Exactly at Bracket Boundary

**Situation:** Net taxable income = exactly ₱250,000, ₱400,000, ₱800,000, ₱2,000,000, or ₱8,000,000.
**Resolution:** The brackets use "not over" language, meaning the boundary value belongs to the LOWER bracket. An income of exactly ₱400,000 is taxed at the LOWER bracket (Bracket 2 = 15% marginal), NOT the higher bracket (Bracket 3 = 20% marginal).
**Engine rule:** Use `<=` (less than or equal) for upper bound checks.
**Verification:** Tax at exactly ₱400,000 using Schedule 2: 15% × (₱400,000 − ₱250,000) = 15% × ₱150,000 = ₱22,500. This equals the BASE TAX of Bracket 3, confirming the table is internally consistent.

---

### Edge Case GRT-EC-02: Negative Taxable Income

**Situation:** Itemized deductions exceed gross receipts, producing a negative net taxable income (net operating loss).
**Resolution:** If net taxable income ≤ ₱0, income tax = ₱0. Do NOT apply a negative tax rate. No refund is generated from graduated rates.
**Additional rule:** A net operating loss can generate a NOLCO carryover. NOLCO is tracked separately and can offset future taxable income (up to 3 years under Sec. 34(D)(3), not applicable to OSD path). The engine should flag a negative taxable income result for NOLCO tracking under Path A (itemized), and note that NOLCO is not available under Path B (OSD) or Path C (8%).

---

### Edge Case GRT-EC-03: Very Small Positive Taxable Income (Below ₱250,000)

**Situation:** Net taxable income is ₱50,000 (well below ₱250,000).
**Resolution:** Tax = ₱0. The ₱250,000 zero-tax bracket applies to the entirety of the income.
**Gotcha:** The ₱250,000 zero-bracket for BUSINESS income is not the same as the ₱250,000 deduction for the 8% option (Path C). Do not confuse these:
- Under graduated rates (Paths A and B): ₱250,000 zero-rate bracket applies to TAXABLE income after deductions.
- Under 8% (Path C): ₱250,000 is deducted from GROSS RECEIPTS before applying the 8% rate (and only for pure-business earners, not mixed-income earners).

---

### Edge Case GRT-EC-04: Non-Integer Taxable Income

**Situation:** Net taxable income has cents (e.g., ₱650,000.75).
**Resolution:** Use full precision in computation. Round only the final tax due to 2 decimal places.
- Tax = ₱22,500 + 20% × (₱650,000.75 − ₱400,000) = ₱22,500 + 20% × ₱250,000.75 = ₱22,500 + ₱50,000.15 = ₱72,500.15
- Income Tax Due: ₱72,500.15 (2-decimal precision)
- On BIR form: write ₱72,500 (truncate to whole peso per BIR form instructions)

---

### Edge Case GRT-EC-05: Annual Rate Table Applied to Annualized Quarterly Income

**Situation:** For quarterly (Form 1701Q) filing, the annual rate table is applied to CUMULATIVE (year-to-date) income, not just the quarter's income.
**Resolution:** Always feed cumulative year-to-date income into the rate table function. The quarterly payment is the difference between cumulative tax and all prior payments + credits.
**Common error to prevent:** Do NOT divide taxable income by (4 ÷ quarters elapsed) to get an annualized figure — the NIRC requires the cumulative method, not an annualization method.

---

### Edge Case GRT-EC-06: First Year of Business (Partial Year)

**Situation:** A taxpayer registered as self-employed in, say, October of Tax Year 2025. They only earned income for 3 months (Oct–Dec).
**Resolution:** The graduated rate table is applied to the ACTUAL income earned during the tax year, not annualized. A 3-month income of ₱300,000 is compared against the annual brackets as-is. The ₱250,000 zero bracket applies to their actual ₱300,000, giving taxable income of ₱50,000 and a tax of ₱7,500 (15% × ₱50,000) under Schedule 2.
**No proration** of brackets is required or permitted.

---

### Edge Case GRT-EC-07: Schedule Transition (Final Year Under Schedule 1)

**Situation:** Quarterly returns for Tax Year 2022 use Schedule 1; the annual ITR filed in April 2023 also uses Schedule 1 (because it covers Tax Year 2022).
**Engine rule:** The schedule is determined by the TAX YEAR (the period the income was earned), NOT the filing date. Tax Year 2022 always uses Schedule 1 even if the return is filed late in 2024.
**Cross-reference:** See [computation-rules.md CR-002, CR-003](../computation-rules.md) for the schedule selector function.

---

## 13. Validation Rules for the Engine

The following assertions must pass for any output of the graduated tax function:

| Rule ID | Assertion | Failure Action |
|---------|-----------|----------------|
| GRT-V01 | `tax_due >= 0` | Raise error — tax cannot be negative |
| GRT-V02 | `if taxable_income <= 250,000 then tax_due == 0` | Raise error — zero bracket violated |
| GRT-V03 | `tax_due <= taxable_income × 0.35` | Raise error — tax exceeds maximum marginal rate |
| GRT-V04 | `tax_due` is continuous across brackets (no step-change at boundary) | Test at each bracket boundary |
| GRT-V05 | `tax_due(250,001) > tax_due(250,000)` for non-zero marginal rate | Monotonicity check |
| GRT-V06 | `tax_due(x) >= tax_due(y)` when `x >= y` | Strict monotonicity: higher income never produces lower tax |
| GRT-V07 | Schedule 2 tax ≤ Schedule 1 tax for the same taxable income | TRAIN reduced rates, so Sched 2 always ≤ Sched 1 |
| GRT-V08 | At exact bracket upper boundaries, computed tax equals next bracket's base tax | Internal consistency check |

---

## 14. Source and Legal Basis Summary

| Item | Citation |
|------|---------|
| Both rate schedules | NIRC Sec. 24(A)(2)(a) as amended by RA 10963 (TRAIN Law), Sec. 5 |
| TRAIN Law enactment date | December 19, 2017 |
| TRAIN Law effective date | January 1, 2018 |
| Schedule 1 effective period | January 1, 2018 – December 31, 2022 |
| Schedule 2 effective date | January 1, 2023 |
| Quarterly filing cumulative method | NIRC Sec. 74-75, as amended; RMC No. 32-2018 |
| OSD basis for professionals | NIRC Sec. 34(L); BIR Form 1701A Item 41 |
| Non-taxable compensation exclusions | NIRC Sec. 32(B)(7); RR No. 11-2018 |
| 13th month pay exemption | NIRC Sec. 32(B)(7)(e)(iv) as amended by TRAIN |
| NOLCO carryover | NIRC Sec. 34(D)(3) |
| De minimis benefits | RR No. 11-2018, Sec. 2.78.1(A) |
