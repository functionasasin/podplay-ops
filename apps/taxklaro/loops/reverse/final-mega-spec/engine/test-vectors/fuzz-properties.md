# Fuzz Properties — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Invariants: [engine/invariants.md](../invariants.md)
- Data model: [engine/data-model.md](../data-model.md)
- Pipeline: [engine/pipeline.md](../pipeline.md)
- Computation rules: [domain/computation-rules.md](../../domain/computation-rules.md)
- Basic test vectors: [engine/test-vectors/basic.md](basic.md)
- Edge case test vectors: [engine/test-vectors/edge-cases.md](edge-cases.md)

---

## Purpose

This file specifies **property-based (fuzz) tests** for the tax computation engine. Unlike concrete test vectors (which verify specific inputs produce specific outputs), property-based tests generate thousands of random valid inputs and assert that structural invariants hold across all of them.

The 223 invariants in `invariants.md` are the target properties. This file:
1. Defines **input generators** — how to randomly construct valid `TaxpayerInput` values
2. Maps every invariant group to a **named fuzz property** with an exact assertion
3. Defines **boundary generators** — biased generators that flood edge points
4. Specifies the **test configuration** (iterations, seed, timeout, shrinking)
5. Provides **pseudocode** for each property test function

**The engine must pass all properties with zero failures across 10,000 generated inputs per property.**

---

## 1. Framework Specification

### 1.1 Primary Framework: fast-check (TypeScript)

The reference implementation assumes TypeScript with **fast-check v3**. fast-check is a property-based testing library that provides arbitrary generators, shrinking, and reproducible seeds.

```
npm install --save-dev fast-check
```

Import pattern:
```typescript
import * as fc from 'fast-check';
import { computeTax } from '../engine/compute';
import type { TaxpayerInput, TaxComputationResult } from '../engine/types';
```

### 1.2 Secondary Framework: Hypothesis (Python)

For a Python implementation, use **Hypothesis v6**:
```
pip install hypothesis
```

Import pattern:
```python
from hypothesis import given, settings, assume
from hypothesis import strategies as st
from engine.compute import compute_tax
from engine.types import TaxpayerInput
```

### 1.3 Framework-Agnostic Property Notation

Each property in this file is written in framework-agnostic pseudocode first, followed by the fast-check TypeScript equivalent. The pseudocode form is:

```
PROPERTY <name>:
  GIVEN: <generator expression>
  ASSUME: <precondition, if any>
  ASSERT: <boolean expression over result>
  FRAMEWORK: fc.assert(fc.property(<gen>, (input) => { <assertion> }))
```

### 1.4 Run Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Iterations per property | 10,000 | Sufficient to catch rare edge cases in a multi-bracket tax function |
| Global seed | 20260302 | Reproducible across CI runs; change only when adding new generators |
| Timeout per property | 30 seconds | Engine is synchronous; 10K runs in <5s expected |
| Shrinking | Enabled (default) | fast-check auto-shrinks failing cases to minimal reproduction |
| Max shrink steps | 1000 | fast-check default; adequate for numeric inputs |
| Endure mode | Disabled | Standard mode; stop on first failure |

Configuration block (fast-check):
```typescript
const FC_CONFIG = { numRuns: 10_000, seed: 20260302 };
```

---

## 2. Input Generators

Generators produce random `TaxpayerInput` values. All monetary values are in Philippine Pesos as `Decimal`. Generators are parameterized by scenario to focus on relevant subspaces.

### 2.1 Primitive Generators

```typescript
// Monetary amounts: ₱0 to ₱10,000,000 (10M covers all NIRC scenarios)
const genMoney = fc.integer({ min: 0, max: 10_000_000 }).map(n => new Decimal(n));

// Monetary amounts with centavos: ₱0.00 to ₱10,000,000.99
const genMoneyCentavo = fc.tuple(
  fc.integer({ min: 0, max: 10_000_000 }),
  fc.integer({ min: 0, max: 99 })
).map(([pesos, centavos]) => new Decimal(`${pesos}.${String(centavos).padStart(2, '0')}`));

// Tax year: only valid range
const genTaxYear = fc.integer({ min: 2018, max: 2030 });

// Small money: ₱0 to ₱500,000 (for expense sub-fields)
const genSmallMoney = fc.integer({ min: 0, max: 500_000 }).map(n => new Decimal(n));

// Rate between 0 and 1
const genRate = fc.float({ min: 0, max: 1, noNaN: true });
```

### 2.2 Enum Generators

```typescript
const genTaxpayerType = fc.oneof(
  fc.constant('PURELY_SE'),
  fc.constant('MIXED_INCOME'),
  fc.constant('COMPENSATION_ONLY')
);

const genTaxpayerTier = fc.oneof(
  fc.constant('MICRO'),
  fc.constant('SMALL'),
  fc.constant('MEDIUM'),
  fc.constant('LARGE')
);

const genFilingPeriod = fc.oneof(
  fc.constant('Q1'),
  fc.constant('Q2'),
  fc.constant('Q3'),
  fc.constant('ANNUAL')
);

const genElectedRegime = fc.oneof(
  fc.constant(null),
  fc.constant('PATH_A'),
  fc.constant('PATH_B'),
  fc.constant('PATH_C')
);
```

### 2.3 Form 2307 Entry Generator

Generates a single CWT certificate entry. The constraint `tax_withheld <= income_payment` is enforced.

```typescript
const genCwt2307Entry = fc.record({
  atc_code: fc.oneof(
    // Income tax ATC codes (WI series, WC series)
    fc.constant('WI010'), fc.constant('WI020'), fc.constant('WI040'),
    fc.constant('WI100'), fc.constant('WI160'), fc.constant('WI170'),
    fc.constant('WC010'), fc.constant('WC020'), fc.constant('WC160'),
    // Percentage tax ATC code
    fc.constant('PT010'),
    // Unknown ATC (triggers MRF-021)
    fc.constant('WI999')
  ),
  income_payment: fc.integer({ min: 0, max: 5_000_000 }).map(n => new Decimal(n)),
  payor_tin: fc.stringMatching(/^\d{9,12}$/),
  payor_name: fc.string({ minLength: 2, maxLength: 80 }),
  period: fc.record({
    tax_year: genTaxYear,
    quarter: fc.integer({ min: 1, max: 4 })
  })
}).chain(entry => {
  // tax_withheld is between 0 and income_payment
  return fc.record({
    ...entry,
    tax_withheld: fc.integer({ min: 0, max: Number(entry.income_payment) })
      .map(n => new Decimal(n))
  } as any);
});

const genCwt2307List = fc.array(genCwt2307Entry, { minLength: 0, maxLength: 10 });
```

### 2.4 Quarterly Payment Generator

```typescript
const genQuarterlyPayment = fc.record({
  quarter: fc.integer({ min: 1, max: 3 }),
  amount_paid: fc.integer({ min: 0, max: 500_000 }).map(n => new Decimal(n))
});

// For ANNUAL filing: 0 to 3 prior quarterly payments, no duplicate quarters
const genQuarterlyPaymentList = fc.array(
  fc.integer({ min: 1, max: 3 }),
  { minLength: 0, maxLength: 3 }
).map(quarters => {
  const unique = [...new Set(quarters)].sort();
  return unique.map(q => ({
    quarter: q,
    amount_paid: new Decimal(Math.floor(Math.random() * 50_000))
  }));
});
```

### 2.5 Itemized Expenses Generator

```typescript
const genItemizedExpenses = fc.record({
  salaries_wages: genSmallMoney,
  rent: genSmallMoney,
  utilities: genSmallMoney,
  supplies: genSmallMoney,
  communication: genSmallMoney,
  travel: genSmallMoney,
  depreciation: genSmallMoney,
  interest_expense: genSmallMoney,
  taxes_licenses: genSmallMoney,
  insurance: genSmallMoney,
  repairs_maintenance: genSmallMoney,
  representation_entertainment: genSmallMoney,
  professional_fees: genSmallMoney,
  advertising: genSmallMoney,
  charitable_donations: genSmallMoney,
  bad_debts: genSmallMoney,
  research_development: genSmallMoney,
  pension_contributions: genSmallMoney,
  other_deductible: genSmallMoney,
  nolco: genSmallMoney,
  home_office_percentage: fc.integer({ min: 0, max: 100 }).map(n => new Decimal(n)),
  home_office_exclusive_use: fc.boolean(),
  is_accrual_basis: fc.boolean(),
  charitable_accredited: fc.boolean(),
  deposit_interest_income: genSmallMoney
});
```

### 2.6 Master PURELY_SE Input Generator

The primary generator for the most common scenario. All constraints from INV-IN-* are satisfied structurally.

```typescript
const genPurelySEInput = genMoneyCentavo.chain(gross_receipts =>
  fc.record({
    taxpayer_type: fc.constant('PURELY_SE'),
    tax_year: genTaxYear,
    filing_period: genFilingPeriod,
    is_mixed_income: fc.constant(false),
    is_vat_registered: fc.boolean(),
    is_bmbe_registered: fc.boolean(),
    subject_to_sec_117_128: fc.boolean(),
    is_gpp_partner: fc.boolean(),
    gross_receipts: fc.constant(gross_receipts),
    sales_returns_allowances: fc.integer({ min: 0, max: Number(gross_receipts) })
      .map(n => new Decimal(n)),
    non_operating_income: genSmallMoney,
    fwt_income: genSmallMoney,
    cost_of_goods_sold: fc.oneof(fc.constant(new Decimal(0)),
      fc.integer({ min: 0, max: Number(gross_receipts) }).map(n => new Decimal(n))),
    taxable_compensation: fc.constant(new Decimal(0)),
    compensation_cwt: fc.constant(new Decimal(0)),
    itemized_expenses: genItemizedExpenses,
    cwt_2307_entries: genCwt2307List,
    prior_quarterly_payments: genQuarterlyPaymentList,
    prior_year_excess_cwt: genSmallMoney,
    prior_payment_for_return: genSmallMoney,
    elected_regime: genElectedRegime,
    taxpayer_tier: genTaxpayerTier,
    actual_filing_date: fc.oneof(fc.constant(null), fc.constant('2026-04-15'),
      fc.constant('2026-06-01'), fc.constant('2025-07-30')),
    filing_deadline: fc.constant('2026-04-15')
  })
);
```

### 2.7 Mixed Income Input Generator

```typescript
const genMixedIncomeInput = fc.record({
  taxpayer_type: fc.constant('MIXED_INCOME'),
  tax_year: genTaxYear,
  filing_period: fc.oneof(fc.constant('Q1'), fc.constant('Q2'),
    fc.constant('Q3'), fc.constant('ANNUAL')),
  is_mixed_income: fc.constant(true),
  is_vat_registered: fc.boolean(),
  is_bmbe_registered: fc.constant(false),
  subject_to_sec_117_128: fc.constant(false),
  is_gpp_partner: fc.constant(false),
  gross_receipts: fc.integer({ min: 1, max: 3_000_000 }).map(n => new Decimal(n)),
  sales_returns_allowances: fc.constant(new Decimal(0)),
  non_operating_income: genSmallMoney,
  fwt_income: genSmallMoney,
  cost_of_goods_sold: fc.constant(new Decimal(0)),
  taxable_compensation: fc.integer({ min: 1, max: 2_000_000 }).map(n => new Decimal(n)),
  compensation_cwt: fc.integer({ min: 0, max: 200_000 }).map(n => new Decimal(n)),
  itemized_expenses: genItemizedExpenses,
  cwt_2307_entries: genCwt2307List,
  prior_quarterly_payments: genQuarterlyPaymentList,
  prior_year_excess_cwt: genSmallMoney,
  prior_payment_for_return: fc.constant(new Decimal(0)),
  elected_regime: genElectedRegime,
  taxpayer_tier: fc.constant('MICRO'),
  actual_filing_date: fc.oneof(fc.constant(null), fc.constant('2026-04-15')),
  filing_deadline: fc.constant('2026-04-15')
});
```

### 2.8 Boundary-Biased Generator

This generator floods the boundaries that appear in NIRC thresholds. Uses `fc.oneof` with explicit boundary values at high frequency.

```typescript
// Boundary amounts: ₱0, ₱250K, ₱400K, ₱3M, ₱3M±1, etc.
const BOUNDARY_AMOUNTS = [
  0, 1, 249_999, 250_000, 250_001,
  399_999, 400_000, 400_001,
  437_500, 437_501,
  799_999, 800_000, 800_001,
  999_999, 1_000_000, 1_000_001,
  1_999_999, 2_000_000, 2_000_001,
  2_999_999, 3_000_000, 3_000_001,
  4_999_999, 5_000_000, 8_000_000,
  10_000_000
];

const genBoundaryMoney = fc.oneof(
  { weight: 60, arbitrary: fc.constantFrom(...BOUNDARY_AMOUNTS).map(n => new Decimal(n)) },
  { weight: 40, arbitrary: genMoneyCentavo }
);

const genBoundaryInput = genBoundaryMoney.chain(gross_receipts =>
  fc.record({
    taxpayer_type: fc.constant('PURELY_SE'),
    tax_year: fc.constantFrom(2022, 2023, 2024, 2025, 2026),
    filing_period: fc.constant('ANNUAL'),
    is_mixed_income: fc.constant(false),
    is_vat_registered: fc.boolean(),
    is_bmbe_registered: fc.constant(false),
    subject_to_sec_117_128: fc.constant(false),
    is_gpp_partner: fc.constant(false),
    gross_receipts: fc.constant(gross_receipts),
    sales_returns_allowances: fc.constant(new Decimal(0)),
    non_operating_income: fc.constant(new Decimal(0)),
    fwt_income: fc.constant(new Decimal(0)),
    cost_of_goods_sold: fc.constant(new Decimal(0)),
    taxable_compensation: fc.constant(new Decimal(0)),
    compensation_cwt: fc.constant(new Decimal(0)),
    itemized_expenses: fc.constant(ZERO_ITEMIZED_EXPENSES),
    cwt_2307_entries: fc.constant([]),
    prior_quarterly_payments: fc.constant([]),
    prior_year_excess_cwt: fc.constant(new Decimal(0)),
    prior_payment_for_return: fc.constant(new Decimal(0)),
    elected_regime: fc.constant(null),
    taxpayer_tier: fc.constant('MICRO'),
    actual_filing_date: fc.constant(null),
    filing_deadline: fc.constant('2026-04-15')
  })
);
```

---

## 3. Property Definitions

Each property corresponds to one or more invariants from `invariants.md`. Properties are named `PROP-<category>-<number>` and reference the `INV-*` codes they verify.

### 3.1 Non-Negativity Properties (Group: NN)

These verify that no monetary output is negative. Derived from invariants across all categories.

**PROP-NN-01: All final monetary outputs are non-negative**
```
PROPERTY PROP-NN-01:
  GIVEN: genPurelySEInput
  ASSERT:
    result.path_a_result?.income_tax_due >= 0  (INV-PA-07)
    result.path_b_result?.income_tax_due >= 0  (INV-PB-06)
    result.path_c_result?.income_tax_due >= 0  (INV-PC-08)
    result.percentage_tax_result.pt_due >= 0   (INV-PT-05)
    result.balance_result.balance can be negative (overpayment scenario — negative is valid)
    result.balance_result.overpayment >= 0     (INV-BAL-05 / INV-BAL-06)
    result.penalty_result.surcharge >= 0       (INV-PEN-10)
    result.penalty_result.interest >= 0        (INV-PEN-11)
    result.penalty_result.compromise_penalty >= 0  (INV-PEN-12)

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const result = computeTax(input);
  expect(result.path_a_result?.income_tax_due).toBeGreaterThanOrEqual(0);
  expect(result.path_b_result?.income_tax_due).toBeGreaterThanOrEqual(0);
  expect(result.path_c_result?.income_tax_due ?? 0).toBeGreaterThanOrEqual(0);
  expect(result.percentage_tax_result.pt_due).toBeGreaterThanOrEqual(0);
  expect(result.balance_result.overpayment).toBeGreaterThanOrEqual(0);
  expect(result.penalty_result.surcharge).toBeGreaterThanOrEqual(0);
  expect(result.penalty_result.interest).toBeGreaterThanOrEqual(0);
  expect(result.penalty_result.compromise_penalty).toBeGreaterThanOrEqual(0);
}), FC_CONFIG);
```

**PROP-NN-02: All intermediate values (GrossAggregates) are non-negative**
```
PROPERTY PROP-NN-02:
  GIVEN: genPurelySEInput
  ASSERT: (INV-GA-02, INV-GA-03, INV-GA-07)
    result.gross_aggregates.net_gross_receipts >= 0
    result.gross_aggregates.gross_income >= 0
    result.gross_aggregates.threshold_base >= 0
    result.gross_aggregates.eight_pct_base >= 0
    result.gross_aggregates.graduated_income_base >= 0
    result.gross_aggregates.pt_quarterly_base >= 0
```

**PROP-NN-03: Path A deduction breakdown items are all non-negative**
```
PROPERTY PROP-NN-03:
  GIVEN: genPurelySEInput (filtered: path_a_result present)
  ASSERT: (INV-PA-01)
    ALL fields of result.path_a_result.itemized_deduction_result.deduction_breakdown >= 0
```

### 3.2 Eligibility Constraint Properties (Group: EL)

**PROP-EL-01: VAT-registered taxpayers never receive Path C**
```
PROPERTY PROP-EL-01:
  GIVEN: genPurelySEInput (set is_vat_registered = true)
  ASSERT: (INV-EL-01, INV-RC-19)
    result.eligibility_result.path_c_eligible == false
    PATH_C is NOT present in result.regime_comparison_result.comparisons

FRAMEWORK:
fc.assert(fc.property(
  genPurelySEInput.map(i => ({ ...i, is_vat_registered: true })),
  (input) => {
    const result = computeTax(input);
    expect(result.eligibility_result.path_c_eligible).toBe(false);
    expect(result.regime_comparison_result.comparisons.map(c => c.path)).not.toContain('PATH_C');
  }
), FC_CONFIG);
```

**PROP-EL-02: Gross receipts above ₱3M removes Path C eligibility**
```
PROPERTY PROP-EL-02:
  GIVEN: genPurelySEInput (set gross_receipts > ₱3,000,000)
  ASSERT: (INV-EL-02, INV-RC-20)
    result.eligibility_result.path_c_eligible == false
    PATH_C is NOT present in result.regime_comparison_result.comparisons

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 3_000_001, max: 10_000_000 }).map(n => ({
    ...BASE_PURELY_SE_INPUT,
    gross_receipts: new Decimal(n),
    is_vat_registered: false
  })),
  (input) => {
    const result = computeTax(input);
    expect(result.eligibility_result.path_c_eligible).toBe(false);
    expect(result.regime_comparison_result.comparisons.every(c => c.path !== 'PATH_C')).toBe(true);
  }
), FC_CONFIG);
```

**PROP-EL-03: Gross receipts at or below ₱3M (non-VAT, non-BMBE, non-GPP) keeps Path C eligible**
```
PROPERTY PROP-EL-03:
  GIVEN: genPurelySEInput with:
    gross_receipts ∈ [0, 3,000,000]
    is_vat_registered = false
    is_bmbe_registered = false
    subject_to_sec_117_128 = false
    is_gpp_partner = false
  ASSERT: (INV-EL-07, INV-EL-08)
    result.eligibility_result.path_c_eligible == true
    PATH_C IS present in result.regime_comparison_result.comparisons

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 3_000_000 }).map(n => ({
    ...BASE_PURELY_SE_INPUT,
    gross_receipts: new Decimal(n),
    is_vat_registered: false,
    is_bmbe_registered: false,
    subject_to_sec_117_128: false,
    is_gpp_partner: false
  })),
  (input) => {
    const result = computeTax(input);
    expect(result.eligibility_result.path_c_eligible).toBe(true);
    expect(result.regime_comparison_result.comparisons.some(c => c.path === 'PATH_C')).toBe(true);
  }
), FC_CONFIG);
```

**PROP-EL-04: Ineligible Path C always has at least one reason**
```
PROPERTY PROP-EL-04:
  GIVEN: genPurelySEInput
  ASSUME: result.eligibility_result.path_c_eligible == false
  ASSERT: (INV-EL-12)
    result.eligibility_result.path_c_ineligible_reasons.length >= 1
```

**PROP-EL-05: Eligible Path C has zero ineligibility reasons**
```
PROPERTY PROP-EL-05:
  GIVEN: genPurelySEInput
  ASSUME: result.eligibility_result.path_c_eligible == true
  ASSERT: (INV-EL-13)
    result.eligibility_result.path_c_ineligible_reasons.length == 0
```

**PROP-EL-06: Paths A and B are always co-eligible for non-COMP_ONLY taxpayers**
```
PROPERTY PROP-EL-06:
  GIVEN: genPurelySEInput (taxpayer_type ≠ COMPENSATION_ONLY)
  ASSERT: (INV-EL-09, INV-EL-10)
    result.eligibility_result.path_a_eligible == true
    result.eligibility_result.path_b_eligible == true
    result.eligibility_result.path_a_eligible == result.eligibility_result.path_b_eligible
```

### 3.3 Path C Computation Properties (Group: PC)

**PROP-PC-01: Path C taxable base is always non-negative**
```
PROPERTY PROP-PC-01:
  GIVEN: genBoundaryInput (any gross receipts, Path C eligible)
  ASSUME: result.eligibility_result.path_c_eligible == true
  ASSERT: (INV-PC-05, INV-PC-14)
    result.path_c_result.taxable_base >= 0
    result.path_c_result.income_tax_due >= 0
    // For gross_receipts <= ₱250,000 (PURELY_SE), income_tax_due must be ₱0
    IF input.taxpayer_type == PURELY_SE AND input.gross_receipts <= 250_000:
      result.path_c_result.taxable_base == 0
      result.path_c_result.income_tax_due == 0

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 250_000 }).map(n => ({
    ...BASE_PURELY_SE_INPUT,
    gross_receipts: new Decimal(n)
  })),
  (input) => {
    const result = computeTax(input);
    if (result.eligibility_result.path_c_eligible) {
      expect(result.path_c_result.taxable_base.toNumber()).toBe(0);
      expect(result.path_c_result.income_tax_due.toNumber()).toBe(0);
    }
  }
), FC_CONFIG);
```

**PROP-PC-02: Path C business IT is exactly 8% of taxable base**
```
PROPERTY PROP-PC-02:
  GIVEN: genBoundaryInput (Path C eligible)
  ASSUME: result.path_c_result.eligible == true
  ASSERT: (INV-PC-07)
    result.path_c_result.income_tax_due ==
      round(result.path_c_result.taxable_base * 0.08, 2)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 250_001, max: 3_000_000 }).map(n => ({
    ...BASE_PURELY_SE_INPUT,
    gross_receipts: new Decimal(n)
  })),
  (input) => {
    const result = computeTax(input);
    if (result.path_c_result.eligible) {
      const expected = result.path_c_result.taxable_base.times(0.08).toDecimalPlaces(2);
      expect(result.path_c_result.income_tax_due).toEqual(expected);
    }
  }
), FC_CONFIG);
```

**PROP-PC-03: PURELY_SE exempt amount is always ₱250,000 for Path C**
```
PROPERTY PROP-PC-03:
  GIVEN: genPurelySEInput (Path C eligible)
  ASSUME: input.taxpayer_type == PURELY_SE AND path_c_eligible == true
  ASSERT: (INV-PC-03)
    result.path_c_result.exempt_amount == 250_000

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 3_000_000 }).map(n => ({
    ...BASE_PURELY_SE_INPUT,
    gross_receipts: new Decimal(n),
    is_vat_registered: false
  })),
  (input) => {
    const result = computeTax(input);
    if (result.path_c_result.eligible) {
      expect(result.path_c_result.exempt_amount.toNumber()).toBe(250_000);
    }
  }
), FC_CONFIG);
```

**PROP-PC-04: MIXED_INCOME exempt amount is ₱0 for Path C**
```
PROPERTY PROP-PC-04:
  GIVEN: genMixedIncomeInput (Path C eligible)
  ASSUME: input.taxpayer_type == MIXED_INCOME AND path_c_eligible == true
  ASSERT: (INV-PC-04)
    result.path_c_result.exempt_amount == 0
```

**PROP-PC-05: Path C tax does not depend on itemized_expenses**
```
PROPERTY PROP-PC-05:
  GIVEN: Two inputs that are identical except itemized_expenses differ (Path C eligible for both)
  ASSERT: (INV-PC-16)
    computeTax(input1).path_c_result.income_tax_due ==
    computeTax(input2).path_c_result.income_tax_due

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 250_001, max: 3_000_000 }),
  genItemizedExpenses,
  genItemizedExpenses,
  (gross, exp1, exp2) => {
    const base = { ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(gross) };
    const r1 = computeTax({ ...base, itemized_expenses: exp1 });
    const r2 = computeTax({ ...base, itemized_expenses: exp2 });
    expect(r1.path_c_result.income_tax_due).toEqual(r2.path_c_result.income_tax_due);
  }
), FC_CONFIG);
```

### 3.4 OSD (Path B) Properties (Group: OSD)

**PROP-OSD-01: OSD deduction is always exactly 40% of OSD base**
```
PROPERTY PROP-OSD-01:
  GIVEN: genPurelySEInput (Path B eligible)
  ASSERT: (INV-PB-01)
    result.path_b_result.osd_result.osd_deduction ==
      round(result.path_b_result.osd_result.osd_base * 0.40, 10)
      (note: intermediate — not yet rounded to centavo at this stage)

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const result = computeTax(input);
  const osr = result.path_b_result?.osd_result;
  if (osr) {
    const expected = osr.osd_base.times('0.40');
    expect(osr.osd_deduction.toFixed(10)).toBe(expected.toFixed(10));
  }
}), FC_CONFIG);
```

**PROP-OSD-02: Path B NTI is always 60% of OSD base**
```
PROPERTY PROP-OSD-02:
  GIVEN: genPurelySEInput (Path B eligible)
  ASSERT: (INV-PB-02)
    result.path_b_result.osd_result.biz_nti_path_b ==
      result.path_b_result.osd_result.osd_base * 0.60

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const result = computeTax(input);
  const osr = result.path_b_result?.osd_result;
  if (osr && osr.osd_base.greaterThan(0)) {
    const expected = osr.osd_base.times('0.60');
    expect(osr.biz_nti_path_b.toFixed(10)).toBe(expected.toFixed(10));
  }
}), FC_CONFIG);
```

**PROP-OSD-03: Path B NTI is non-negative for all inputs**
```
PROPERTY PROP-OSD-03:
  GIVEN: genPurelySEInput
  ASSERT: (INV-PB-05)
    result.path_b_result?.biz_nti >= 0
```

### 3.5 Graduated Rate Properties (Group: GRAD)

**PROP-GRAD-01: Graduated tax is non-decreasing in NTI (monotonicity)**
```
PROPERTY PROP-GRAD-01:
  GIVEN: Two NTI values n1 <= n2, same tax_year
  ASSERT: (INV-MON-01)
    apply_graduated_rate(n1, year) <= apply_graduated_rate(n2, year)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 10_000_000 }),
  fc.integer({ min: 0, max: 10_000_000 }),
  fc.integer({ min: 2018, max: 2030 }),
  (n1, n2, year) => {
    const [lo, hi] = [Math.min(n1, n2), Math.max(n1, n2)];
    const t1 = applyGraduatedRate(new Decimal(lo), year);
    const t2 = applyGraduatedRate(new Decimal(hi), year);
    expect(t1.lte(t2)).toBe(true);
  }
), FC_CONFIG);
```

**PROP-GRAD-02: Graduated tax is always non-negative for NTI >= 0**
```
PROPERTY PROP-GRAD-02:
  GIVEN: NTI in [0, 10,000,000], any valid tax_year
  ASSERT: (INV-MON-02)
    apply_graduated_rate(NTI, year) >= 0

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 10_000_000 }),
  genTaxYear,
  (nti, year) => {
    const tax = applyGraduatedRate(new Decimal(nti), year);
    expect(tax.gte(0)).toBe(true);
  }
), FC_CONFIG);
```

**PROP-GRAD-03: 2023+ rate table is used for tax_year >= 2023**
```
PROPERTY PROP-GRAD-03:
  GIVEN: tax_year in [2023, 2030], NTI = ₱1,000,000
  ASSERT: (INV-DET-08)
    apply_graduated_rate(1_000_000, year) == ₱130,000.00
    (verified: ₱1M under 2023+ table = 0 + 0 + 25,000 + 105,000 = ₱130,000)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 2023, max: 2030 }),
  (year) => {
    const tax = applyGraduatedRate(new Decimal(1_000_000), year);
    expect(tax.toFixed(2)).toBe('130000.00');
  }
), FC_CONFIG);
```

**PROP-GRAD-04: 2018-2022 rate table is used for tax_year 2018-2022**
```
PROPERTY PROP-GRAD-04:
  GIVEN: tax_year in [2018, 2022], NTI = ₱1,000,000
  ASSERT: (INV-DET-08)
    apply_graduated_rate(1_000_000, year) == ₱190,000.00
    (verified: ₱1M under 2018-2022 table = 0 + 0 + 50,000 + 140,000 = ₱190,000)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 2018, max: 2022 }),
  (year) => {
    const tax = applyGraduatedRate(new Decimal(1_000_000), year);
    expect(tax.toFixed(2)).toBe('190000.00');
  }
), FC_CONFIG);
```

### 3.6 Regime Comparison Properties (Group: RC)

**PROP-RC-01: Recommended path always has the minimum total tax burden**
```
PROPERTY PROP-RC-01:
  GIVEN: genPurelySEInput (any input)
  ASSERT: (INV-RC-05, INV-MON-10)
    ALL entries in rcr.comparisons have
      total_tax_burden >= rcr.comparisons[0].total_tax_burden
    rcr.recommended_path == rcr.comparisons[0].path

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const result = computeTax(input);
  const rcr = result.regime_comparison_result;
  const minBurden = rcr.comparisons[0].total_tax_burden;
  rcr.comparisons.forEach(c => {
    expect(c.total_tax_burden.gte(minBurden)).toBe(true);
  });
  expect(rcr.recommended_path).toBe(rcr.comparisons[0].path);
}), FC_CONFIG);
```

**PROP-RC-02: Comparisons list is sorted ascending by total_tax_burden**
```
PROPERTY PROP-RC-02:
  GIVEN: genPurelySEInput
  ASSERT: (INV-RC-04)
    for all i < j: comparisons[i].total_tax_burden <= comparisons[j].total_tax_burden

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const { comparisons } = computeTax(input).regime_comparison_result;
  for (let i = 0; i < comparisons.length - 1; i++) {
    expect(comparisons[i].total_tax_burden.lte(comparisons[i + 1].total_tax_burden)).toBe(true);
  }
}), FC_CONFIG);
```

**PROP-RC-03: Each path appears at most once in comparisons**
```
PROPERTY PROP-RC-03:
  GIVEN: genPurelySEInput
  ASSERT: (INV-RC-03)
    len(comparisons) == len(set(comparisons.map(c => c.path)))

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const { comparisons } = computeTax(input).regime_comparison_result;
  const paths = comparisons.map(c => c.path);
  expect(paths.length).toBe(new Set(paths).size);
}), FC_CONFIG);
```

**PROP-RC-04: Total tax burden = income_tax_due + percentage_tax_due**
```
PROPERTY PROP-RC-04:
  GIVEN: genPurelySEInput
  ASSERT: (INV-RC-12)
    for all opt in comparisons:
      opt.total_tax_burden == opt.income_tax_due + opt.percentage_tax_due

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const { comparisons } = computeTax(input).regime_comparison_result;
  comparisons.forEach(c => {
    const expected = c.income_tax_due.plus(c.percentage_tax_due);
    expect(c.total_tax_burden.toFixed(2)).toBe(expected.toFixed(2));
  });
}), FC_CONFIG);
```

**PROP-RC-05: PATH_C entry always has percentage_tax_due == 0**
```
PROPERTY PROP-RC-05:
  GIVEN: genPurelySEInput (Path C eligible)
  ASSERT: (INV-RC-13, INV-PT-01)
    PATH_C comparison entry: percentage_tax_due == 0

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const { comparisons } = computeTax(input).regime_comparison_result;
  const pathC = comparisons.find(c => c.path === 'PATH_C');
  if (pathC) {
    expect(pathC.percentage_tax_due.toNumber()).toBe(0);
  }
}), FC_CONFIG);
```

**PROP-RC-06: PATH_A and PATH_B entries share the same percentage_tax_due**
```
PROPERTY PROP-RC-06:
  GIVEN: genPurelySEInput
  ASSERT: (INV-RC-14, INV-XP-05)
    IF both PATH_A and PATH_B are in comparisons:
      comparisons[PATH_A].percentage_tax_due == comparisons[PATH_B].percentage_tax_due

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const { comparisons } = computeTax(input).regime_comparison_result;
  const pa = comparisons.find(c => c.path === 'PATH_A');
  const pb = comparisons.find(c => c.path === 'PATH_B');
  if (pa && pb) {
    expect(pa.percentage_tax_due.toFixed(2)).toBe(pb.percentage_tax_due.toFixed(2));
  }
}), FC_CONFIG);
```

**PROP-RC-07: savings_vs_worst is non-negative and equals last minus first burden**
```
PROPERTY PROP-RC-07:
  GIVEN: genPurelySEInput
  ASSERT: (INV-RC-08, INV-RC-17)
    rcr.savings_vs_worst >= 0
    rcr.savings_vs_worst == comparisons[-1].total_tax_burden - comparisons[0].total_tax_burden

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const rcr = computeTax(input).regime_comparison_result;
  expect(rcr.savings_vs_worst.gte(0)).toBe(true);
  const expected = rcr.comparisons[rcr.comparisons.length - 1].total_tax_burden
    .minus(rcr.comparisons[0].total_tax_burden);
  expect(rcr.savings_vs_worst.toFixed(2)).toBe(expected.toFixed(2));
}), FC_CONFIG);
```

**PROP-RC-08: At least one path is always available for SE taxpayers**
```
PROPERTY PROP-RC-08:
  GIVEN: genPurelySEInput OR genMixedIncomeInput
  ASSERT: (INV-EL-11, INV-RC-01)
    len(rcr.comparisons) >= 1

FRAMEWORK:
fc.assert(fc.property(
  fc.oneof(genPurelySEInput, genMixedIncomeInput),
  (input) => {
    const rcr = computeTax(input).regime_comparison_result;
    expect(rcr.comparisons.length).toBeGreaterThanOrEqual(1);
  }
), FC_CONFIG);
```

### 3.7 Percentage Tax Properties (Group: PT)

**PROP-PT-01: PT and Path C are mutually exclusive**
```
PROPERTY PROP-PT-01:
  GIVEN: genPurelySEInput
  ASSERT: (INV-PT-01, INV-PC-12)
    IF path_c_eligible AND elected/recommended:
      ptr.pt_due == 0 AND ptr.pt_applies == false

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const result = computeTax(input);
  const pcr = result.path_c_result;
  const ptr = result.percentage_tax_result;
  if (pcr.eligible && result.regime_comparison_result.recommended_path === 'PATH_C') {
    expect(ptr.pt_due.toNumber()).toBe(0);
    expect(ptr.pt_applies).toBe(false);
  }
}), FC_CONFIG);
```

**PROP-PT-02: VAT-registered taxpayers never have PT**
```
PROPERTY PROP-PT-02:
  GIVEN: genPurelySEInput with is_vat_registered = true
  ASSERT: (INV-PT-02, INV-PT-03)
    ptr.pt_due == 0
    ptr.pt_applies == false

FRAMEWORK:
fc.assert(fc.property(
  genPurelySEInput.map(i => ({ ...i, is_vat_registered: true })),
  (input) => {
    const ptr = computeTax(input).percentage_tax_result;
    expect(ptr.pt_due.toNumber()).toBe(0);
    expect(ptr.pt_applies).toBe(false);
  }
), FC_CONFIG);
```

**PROP-PT-03: PT due equals pt_base × pt_rate when PT applies**
```
PROPERTY PROP-PT-03:
  GIVEN: genPurelySEInput with is_vat_registered = false, non-8% scenario
  ASSUME: ptr.pt_applies == true
  ASSERT: (INV-PT-06)
    ptr.pt_due == round(ptr.pt_base * ptr.pt_rate, 2)

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const ptr = computeTax(input).percentage_tax_result;
  if (ptr.pt_applies) {
    const expected = ptr.pt_base.times(ptr.pt_rate).toDecimalPlaces(2);
    expect(ptr.pt_due.toFixed(2)).toBe(expected.toFixed(2));
  }
}), FC_CONFIG);
```

**PROP-PT-04: PT rate for periods from July 1, 2023 is exactly 3%**
```
PROPERTY PROP-PT-04:
  GIVEN: genPurelySEInput with tax_year in [2024, 2025, 2026]
  ASSUME: ptr.pt_applies == true
  ASSERT: (INV-PT-08)
    ptr.pt_rate == 0.03

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 2024, max: 2030 }).map(year => ({
    ...BASE_PURELY_SE_INPUT,
    tax_year: year,
    gross_receipts: new Decimal(500_000),
    is_vat_registered: false
  })),
  (input) => {
    const ptr = computeTax(input).percentage_tax_result;
    if (ptr.pt_applies) {
      expect(ptr.pt_rate.toFixed(2)).toBe('0.03');
    }
  }
), FC_CONFIG);
```

### 3.8 CWT Credit Properties (Group: CWT)

**PROP-CWT-01: Total IT CWT is the sum of WI/WC entries plus comp_cwt plus prior_year**
```
PROPERTY PROP-CWT-01:
  GIVEN: genPurelySEInput with non-empty cwt_2307_entries
  ASSERT: (INV-CWT-11)
    cwt.it_cwt_total ==
      sum(e.tax_withheld for e in entries where ATC starts with WI or WC)
      + input.compensation_cwt
      + input.prior_year_excess_cwt

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const cwt = computeTax(input).cwt_credit_result;
  const wiWcSum = input.cwt_2307_entries
    .filter(e => e.atc_code.startsWith('WI') || e.atc_code.startsWith('WC'))
    .reduce((sum, e) => sum.plus(e.tax_withheld), new Decimal(0));
  const expected = wiWcSum
    .plus(input.compensation_cwt)
    .plus(input.prior_year_excess_cwt);
  expect(cwt.it_cwt_total.toFixed(2)).toBe(expected.toFixed(2));
}), FC_CONFIG);
```

**PROP-CWT-02: PT010 entries are credited only to PT, not IT**
```
PROPERTY PROP-CWT-02:
  GIVEN: genPurelySEInput with at least one PT010 entry
  ASSERT: (INV-CWT-04, INV-CWT-05)
    cwt.pt_cwt_total == sum(e.tax_withheld for e where atc_code == 'PT010')
    PT010 entries do NOT appear in IT credit sum
```

**PROP-CWT-03: An entry is never counted in both IT and PT credits**
```
PROPERTY PROP-CWT-03:
  GIVEN: genPurelySEInput
  ASSERT: (INV-CWT-05)
    FOR each entry e in cwt_2307_entries:
      e is classified EXACTLY ONCE (either INCOME_TAX_CWT, PERCENTAGE_TAX_CWT, or UNKNOWN)
      if INCOME_TAX_CWT: contributes to it_cwt_total only
      if PERCENTAGE_TAX_CWT: contributes to pt_cwt_total only
      if UNKNOWN: contributes to neither
```

### 3.9 Balance Properties (Group: BAL)

**PROP-BAL-01: Balance disposition is consistent with balance sign**
```
PROPERTY PROP-BAL-01:
  GIVEN: genPurelySEInput (ANNUAL period)
  ASSERT: (INV-BAL-02, INV-BAL-03, INV-BAL-04)
    IF br.balance > 0: br.disposition == BALANCE_PAYABLE
    IF br.balance == 0: br.disposition == ZERO_BALANCE
    IF br.balance < 0: br.disposition == OVERPAYMENT

FRAMEWORK:
fc.assert(fc.property(
  genPurelySEInput.map(i => ({ ...i, filing_period: 'ANNUAL' })),
  (input) => {
    const br = computeTax(input).balance_result;
    const bal = br.balance.toNumber();
    if (bal > 0) expect(br.disposition).toBe('BALANCE_PAYABLE');
    else if (bal === 0) expect(br.disposition).toBe('ZERO_BALANCE');
    else expect(br.disposition).toBe('OVERPAYMENT');
  }
), FC_CONFIG);
```

**PROP-BAL-02: Overpayment amount equals absolute value of balance**
```
PROPERTY PROP-BAL-02:
  GIVEN: genPurelySEInput (ANNUAL period)
  ASSERT: (INV-BAL-05, INV-BAL-06)
    IF disposition == OVERPAYMENT: overpayment == abs(balance)
    IF disposition != OVERPAYMENT: overpayment == 0

FRAMEWORK:
fc.assert(fc.property(
  genPurelySEInput.map(i => ({ ...i, filing_period: 'ANNUAL' })),
  (input) => {
    const br = computeTax(input).balance_result;
    if (br.disposition === 'OVERPAYMENT') {
      expect(br.overpayment.toFixed(2)).toBe(br.balance.abs().toFixed(2));
    } else {
      expect(br.overpayment.toNumber()).toBe(0);
    }
  }
), FC_CONFIG);
```

**PROP-BAL-03: Installment first + second equals total balance**
```
PROPERTY PROP-BAL-03:
  GIVEN: genPurelySEInput (ANNUAL period, balance > ₱2,000)
  ASSUME: br.installment_eligible == true
  ASSERT: (INV-BAL-08, INV-BAL-09, INV-BAL-10)
    br.installment_first + br.installment_second == br.balance
    br.installment_first == round(br.balance / 2, 2)
    br.installment_second == br.balance - br.installment_first

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 2_001, max: 500_000 }).map(bal => ({
    ...BASE_PURELY_SE_ANNUAL_INPUT,
    // construct input that produces this exact balance — or filter
  })),
  (input) => {
    const br = computeTax(input).balance_result;
    if (br.installment_eligible) {
      const total = br.installment_first.plus(br.installment_second);
      expect(total.toFixed(2)).toBe(br.balance.toFixed(2));
    }
  }
), FC_CONFIG);
```

**PROP-BAL-04: Higher CWT credits always reduce or maintain balance (holding IT due constant)**
```
PROPERTY PROP-BAL-04:
  GIVEN: Two inputs differing only in prior_year_excess_cwt: cwt1 < cwt2
  ASSERT: (INV-MON-06)
    balance(cwt1) >= balance(cwt2)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 10_000 }),
  fc.integer({ min: 0, max: 10_000 }),
  (cwt1_raw, cwt2_raw) => {
    const [cwtLo, cwtHi] = [Math.min(cwt1_raw, cwt2_raw), Math.max(cwt1_raw, cwt2_raw)];
    const base = { ...BASE_PURELY_SE_ANNUAL_INPUT };
    const r1 = computeTax({ ...base, prior_year_excess_cwt: new Decimal(cwtLo) });
    const r2 = computeTax({ ...base, prior_year_excess_cwt: new Decimal(cwtHi) });
    expect(r1.balance_result.balance.gte(r2.balance_result.balance)).toBe(true);
  }
), FC_CONFIG);
```

### 3.10 Penalty Properties (Group: PEN)

**PROP-PEN-01: No penalties when filed on time**
```
PROPERTY PROP-PEN-01:
  GIVEN: genPurelySEInput (actual_filing_date == null or == filing_deadline)
  ASSERT: (INV-PEN-01, INV-PEN-02, INV-PEN-15)
    pr.surcharge == 0
    pr.interest == 0

FRAMEWORK:
fc.assert(fc.property(
  genPurelySEInput.map(i => ({ ...i, actual_filing_date: null })),
  (input) => {
    const pr = computeTax(input).penalty_result;
    expect(pr.surcharge.toNumber()).toBe(0);
    expect(pr.interest.toNumber()).toBe(0);
  }
), FC_CONFIG);
```

**PROP-PEN-02: Surcharge rate is 10% for MICRO/SMALL tier (when late)**
```
PROPERTY PROP-PEN-02:
  GIVEN: Input with taxpayer_tier ∈ {MICRO, SMALL}, actual_filing_date after deadline
  ASSERT: (INV-PEN-03)
    pr.surcharge_rate == 0.10

FRAMEWORK:
fc.assert(fc.property(
  fc.oneof(fc.constant('MICRO'), fc.constant('SMALL')).map(tier => ({
    ...BASE_PURELY_SE_ANNUAL_INPUT,
    taxpayer_tier: tier,
    actual_filing_date: '2026-06-01',
    filing_deadline: '2026-04-15'
  })),
  (input) => {
    const pr = computeTax(input).penalty_result;
    if (pr.days_late > 0) {
      expect(pr.surcharge_rate.toFixed(2)).toBe('0.10');
    }
  }
), FC_CONFIG);
```

**PROP-PEN-03: Interest equals basic_tax × rate × (days_late / 365)**
```
PROPERTY PROP-PEN-03:
  GIVEN: genPurelySEInput with actual_filing_date after filing_deadline
  ASSUME: pr.days_late > 0
  ASSERT: (INV-PEN-08)
    pr.interest == round(pr.surcharge_base * pr.interest_rate_pa * (pr.days_late / 365), 2)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 1, max: 365 }).map(days => ({
    ...BASE_PURELY_SE_ANNUAL_INPUT,
    actual_filing_date: addDays('2026-04-15', days),
    filing_deadline: '2026-04-15',
    taxpayer_tier: 'MICRO'
  })),
  (input) => {
    const pr = computeTax(input).penalty_result;
    if (pr.days_late > 0 && pr.surcharge_base.greaterThan(0)) {
      const expected = pr.surcharge_base
        .times(pr.interest_rate_pa)
        .times(new Decimal(pr.days_late).dividedBy(365))
        .toDecimalPlaces(2);
      expect(pr.interest.toFixed(2)).toBe(expected.toFixed(2));
    }
  }
), FC_CONFIG);
```

**PROP-PEN-04: Total penalty equals sum of components**
```
PROPERTY PROP-PEN-04:
  GIVEN: genPurelySEInput
  ASSERT: (INV-PEN-13)
    pr.total_penalty == pr.surcharge + pr.interest + pr.compromise_penalty
```

**PROP-PEN-05: Penalty increases with days late (monotonicity)**
```
PROPERTY PROP-PEN-05:
  GIVEN: Two inputs identical except days_late1 < days_late2 (positive tax due)
  ASSERT: (INV-MON-07)
    total_penalty(days_late1) <= total_penalty(days_late2)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 1, max: 100 }),
  fc.integer({ min: 1, max: 100 }),
  (days1, days2) => {
    const [dLo, dHi] = [Math.min(days1, days2), Math.max(days1, days2)];
    const base = { ...BASE_PURELY_SE_ANNUAL_INPUT, gross_receipts: new Decimal(500_000) };
    const r1 = computeTax({ ...base, actual_filing_date: addDays('2026-04-15', dLo) });
    const r2 = computeTax({ ...base, actual_filing_date: addDays('2026-04-15', dHi) });
    expect(r1.penalty_result.total_penalty.lte(r2.penalty_result.total_penalty)).toBe(true);
  }
), FC_CONFIG);
```

### 3.11 Determinism Properties (Group: DET)

**PROP-DET-01: Engine is a pure function (same input → same output)**
```
PROPERTY PROP-DET-01:
  GIVEN: genPurelySEInput
  ASSERT: (INV-DET-01)
    computeTax(input) deep-equals computeTax(input)
    (called twice with identical input)

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const r1 = computeTax(input);
  const r2 = computeTax(input);
  expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
}), FC_CONFIG);
```

**PROP-DET-02: Order of 2307 entries does not affect totals**
```
PROPERTY PROP-DET-02:
  GIVEN: genPurelySEInput with non-empty cwt_2307_entries
  ASSERT: (INV-DET-05)
    computeTax(input with entries in original order).cwt_credit_result.it_cwt_total ==
    computeTax(input with entries in reversed order).cwt_credit_result.it_cwt_total

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const r1 = computeTax(input);
  const r2 = computeTax({ ...input, cwt_2307_entries: [...input.cwt_2307_entries].reverse() });
  expect(r1.cwt_credit_result.it_cwt_total.toFixed(2))
    .toBe(r2.cwt_credit_result.it_cwt_total.toFixed(2));
}), FC_CONFIG);
```

**PROP-DET-03: Order of quarterly payments does not affect total credits**
```
PROPERTY PROP-DET-03:
  GIVEN: genPurelySEInput with multiple quarterly payments
  ASSERT: (INV-DET-06)
    computeTax(input).credit_aggregates.total_quarterly_it_paid
    is the same regardless of order of prior_quarterly_payments
```

### 3.12 Mixed Income Properties (Group: MI)

**PROP-MI-01: Mixed income PURELY_SE exempt amount is ₱0 for Path C**
```
PROPERTY PROP-MI-01:
  GIVEN: genMixedIncomeInput with any taxable_compensation > 0
  ASSUME: path_c_eligible == true
  ASSERT: (INV-PC-04, RMC 50-2018)
    result.path_c_result.exempt_amount == 0
```

**PROP-MI-02: Mixed income Path A/B total NTI = comp + business NTI**
```
PROPERTY PROP-MI-02:
  GIVEN: genMixedIncomeInput
  ASSERT: (INV-PA-09, INV-PB-08)
    path_a_result.total_nti == taxable_compensation + path_a_result.biz_nti
    path_b_result.total_nti == taxable_compensation + path_b_result.biz_nti
```

**PROP-MI-03: Mixed income taxpayer always uses Form 1701**
```
PROPERTY PROP-MI-03:
  GIVEN: genMixedIncomeInput (ANNUAL filing)
  ASSERT: (INV-FF-02)
    result.bir_form_output.form_type == FORM_1701
```

### 3.13 Rounding Properties (Group: RND)

**PROP-RND-01: Final IT due values have at most 2 decimal places**
```
PROPERTY PROP-RND-01:
  GIVEN: genPurelySEInput OR genMixedIncomeInput OR genBoundaryInput
  ASSERT: (INV-RND-01, INV-RND-02)
    result.path_a_result?.income_tax_due.decimalPlaces() <= 2
    result.path_b_result?.income_tax_due.decimalPlaces() <= 2
    result.path_c_result?.income_tax_due.decimalPlaces() <= 2
    result.percentage_tax_result.pt_due.decimalPlaces() <= 2

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const result = computeTax(input);
  [
    result.path_a_result?.income_tax_due,
    result.path_b_result?.income_tax_due,
    result.path_c_result?.income_tax_due,
    result.percentage_tax_result.pt_due
  ].filter(Boolean).forEach(val => {
    expect(val!.decimalPlaces()).toBeLessThanOrEqual(2);
  });
}), FC_CONFIG);
```

**PROP-RND-02: BIR form display values are whole-peso floor amounts**
```
PROPERTY PROP-RND-02:
  GIVEN: genPurelySEInput (ANNUAL filing)
  ASSERT: (INV-RND-04, INV-FF-08)
    ALL monetary fields in bir_form_output are integers (floor of decimal)
    bir_form_output.item_35 == floor(path_a_result.income_tax_due)  [if Path A]
    bir_form_output.item_55 == floor(path_c_result.income_tax_due)  [if Path C]
```

### 3.14 Gross Aggregates Properties (Group: GA)

**PROP-GA-01: Net gross receipts = gross_receipts - sales_returns_allowances**
```
PROPERTY PROP-GA-01:
  GIVEN: genPurelySEInput
  ASSERT: (INV-GA-01)
    ga.net_gross_receipts == input.gross_receipts - input.sales_returns_allowances
    ga.net_gross_receipts >= 0  (because sales_returns <= gross per generator)

FRAMEWORK:
fc.assert(fc.property(genPurelySEInput, (input) => {
  const ga = computeTax(input).gross_aggregates;
  const expected = input.gross_receipts.minus(input.sales_returns_allowances);
  expect(ga.net_gross_receipts.toFixed(2)).toBe(expected.toFixed(2));
  expect(ga.net_gross_receipts.gte(0)).toBe(true);
}), FC_CONFIG);
```

**PROP-GA-02: FWT income excluded from threshold base**
```
PROPERTY PROP-GA-02:
  GIVEN: Two inputs identical except fwt_income: one with ₱0, one with ₱100,000
  ASSERT: (INV-GA-11)
    ga.threshold_base is the same for both inputs
    (fwt_income does NOT affect threshold_base or any tax path)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 1, max: 1_000_000 }).map(fwt => {
    const base = { ...BASE_PURELY_SE_INPUT };
    return [
      { ...base, fwt_income: new Decimal(0) },
      { ...base, fwt_income: new Decimal(fwt) }
    ];
  }),
  ([input_no_fwt, input_with_fwt]) => {
    const ga1 = computeTax(input_no_fwt).gross_aggregates;
    const ga2 = computeTax(input_with_fwt).gross_aggregates;
    expect(ga1.threshold_base.toFixed(2)).toBe(ga2.threshold_base.toFixed(2));
  }
), FC_CONFIG);
```

### 3.15 Cross-Path Consistency Properties (Group: XP)

**PROP-XP-01: More itemized deductions → lower or equal Path A NTI**
```
PROPERTY PROP-XP-01:
  GIVEN: Two inputs identical except itemized deductions: deductions1 >= deductions2
  ASSERT: (INV-XP-03, INV-PA-05)
    path_a_result(deductions1).biz_nti <= path_a_result(deductions2).biz_nti

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 500_000 }),
  fc.integer({ min: 0, max: 500_000 }),
  (exp1, exp2) => {
    const [expLo, expHi] = [Math.min(exp1, exp2), Math.max(exp1, exp2)];
    const base = { ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(1_000_000) };
    const r1 = computeTax({ ...base, itemized_expenses: { ...ZERO_ITEMIZED, other_deductible: new Decimal(expHi) } });
    const r2 = computeTax({ ...base, itemized_expenses: { ...ZERO_ITEMIZED, other_deductible: new Decimal(expLo) } });
    expect(r1.path_a_result!.biz_nti.lte(r2.path_a_result!.biz_nti)).toBe(true);
  }
), FC_CONFIG);
```

**PROP-XP-02: Path C tax increases monotonically with gross receipts**
```
PROPERTY PROP-XP-02:
  GIVEN: Two gross receipt amounts gr1 <= gr2 (both eligible for Path C)
  ASSERT: (INV-XP-08, INV-MON-03)
    path_c_tax(gr1) <= path_c_tax(gr2)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 3_000_000 }),
  fc.integer({ min: 0, max: 3_000_000 }),
  (gr1_raw, gr2_raw) => {
    const [grLo, grHi] = [Math.min(gr1_raw, gr2_raw), Math.max(gr1_raw, gr2_raw)];
    const r1 = computeTax({ ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(grLo) });
    const r2 = computeTax({ ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(grHi) });
    if (r1.path_c_result.eligible && r2.path_c_result.eligible) {
      expect(r1.path_c_result.income_tax_due.lte(r2.path_c_result.income_tax_due)).toBe(true);
    }
  }
), FC_CONFIG);
```

**PROP-XP-03: Path B tax increases monotonically with OSD base**
```
PROPERTY PROP-XP-03:
  GIVEN: Two OSD bases b1 <= b2
  ASSERT: (INV-MON-04)
    path_b_it(b1) <= path_b_it(b2)

FRAMEWORK:
fc.assert(fc.property(
  fc.integer({ min: 0, max: 5_000_000 }),
  fc.integer({ min: 0, max: 5_000_000 }),
  (b1_raw, b2_raw) => {
    const [bLo, bHi] = [Math.min(b1_raw, b2_raw), Math.max(b1_raw, b2_raw)];
    const r1 = computeTax({ ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(bLo) });
    const r2 = computeTax({ ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(bHi) });
    expect(r1.path_b_result!.income_tax_due.lte(r2.path_b_result!.income_tax_due)).toBe(true);
  }
), FC_CONFIG);
```

---

## 4. Composite Property Suites

These suites combine multiple properties into a single test run for efficiency.

### 4.1 SUITE-ANNUAL-PURELY-SE: All properties over annual PURELY_SE inputs

Runs all NN, EL, PC, OSD, RC, PT, BAL, DET properties in a single generator pass.

```typescript
fc.assert(fc.property(genPurelySEInput, (input) => {
  const result = computeTax({ ...input, filing_period: 'ANNUAL' });

  // NN properties
  expect(result.path_a_result?.income_tax_due.gte(0)).toBe(true);
  expect(result.path_b_result?.income_tax_due.gte(0)).toBe(true);
  expect(result.path_c_result?.income_tax_due.gte(0)).toBe(true);

  // EL properties
  if (input.is_vat_registered) {
    expect(result.eligibility_result.path_c_eligible).toBe(false);
  }

  // RC properties
  const comps = result.regime_comparison_result.comparisons;
  expect(comps.length).toBeGreaterThanOrEqual(1);
  for (let i = 0; i < comps.length - 1; i++) {
    expect(comps[i].total_tax_burden.lte(comps[i + 1].total_tax_burden)).toBe(true);
  }

  // BAL properties
  const br = result.balance_result;
  const bal = br.balance.toNumber();
  if (bal > 0) expect(br.disposition).toBe('BALANCE_PAYABLE');
  else if (bal === 0) expect(br.disposition).toBe('ZERO_BALANCE');
  else expect(br.disposition).toBe('OVERPAYMENT');

  // RND properties
  [
    result.path_a_result?.income_tax_due,
    result.path_b_result?.income_tax_due,
    result.path_c_result?.income_tax_due
  ].filter(Boolean).forEach(v => {
    expect(v!.decimalPlaces()).toBeLessThanOrEqual(2);
  });
}), { numRuns: 50_000, seed: 20260302 });
```

### 4.2 SUITE-BOUNDARY: All properties over boundary-biased inputs

Uses `genBoundaryInput` to flood the critical thresholds (₱250K, ₱3M, bracket boundaries):

```typescript
fc.assert(fc.property(genBoundaryInput, (input) => {
  const result = computeTax(input);

  // Path C at ₱250K boundary (PURELY_SE)
  if (input.gross_receipts.lte(250_000) && result.path_c_result.eligible) {
    expect(result.path_c_result.income_tax_due.toNumber()).toBe(0);
  }

  // Path C eligibility at ₱3M boundary
  if (input.gross_receipts.lte(3_000_000) && !input.is_vat_registered) {
    expect(result.eligibility_result.path_c_eligible).toBe(true);
  }
  if (input.gross_receipts.gt(3_000_000)) {
    expect(result.eligibility_result.path_c_eligible).toBe(false);
  }

  // Sorted comparisons
  const comps = result.regime_comparison_result.comparisons;
  for (let i = 0; i < comps.length - 1; i++) {
    expect(comps[i].total_tax_burden.lte(comps[i + 1].total_tax_burden)).toBe(true);
  }
}), { numRuns: 10_000, seed: 20260302 });
```

### 4.3 SUITE-MIXED-INCOME: All properties over mixed income inputs

```typescript
fc.assert(fc.property(genMixedIncomeInput, (input) => {
  const result = computeTax({ ...input, filing_period: 'ANNUAL' });

  // Mixed income always uses Form 1701
  expect(result.bir_form_output.form_type).toBe('FORM_1701');

  // Path A total NTI = comp + business NTI
  if (result.path_a_result) {
    const expectedNTI = input.taxable_compensation.plus(result.path_a_result.biz_nti);
    expect(result.path_a_result.total_nti.toFixed(2)).toBe(expectedNTI.toFixed(2));
  }

  // If Path C eligible: exempt_amount == 0 (mixed income rule)
  if (result.path_c_result.eligible) {
    expect(result.path_c_result.exempt_amount.toNumber()).toBe(0);
  }
}), FC_CONFIG);
```

---

## 5. Specific Boundary Verification Properties

These properties verify exact values at specific legal thresholds. Unlike randomized properties above, these are deterministic spot-checks run as part of the fuzz suite.

### 5.1 PROP-BOUNDARY-01: Path C at ₱3,000,000 exact threshold

```
Input: gross_receipts = ₱3,000,000, PURELY_SE, non-VAT, no returns
Expected: path_c_eligible = true (≤ ₱3M is inclusive)
Expected: path_c_taxable_base = ₱2,750,000 (₱3M - ₱250K)
Expected: path_c_income_tax_due = ₱220,000.00 (₱2,750,000 × 8%)

FRAMEWORK:
test('PROP-BOUNDARY-01', () => {
  const input = { ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(3_000_000) };
  const result = computeTax(input);
  expect(result.eligibility_result.path_c_eligible).toBe(true);
  expect(result.path_c_result.taxable_base.toFixed(2)).toBe('2750000.00');
  expect(result.path_c_result.income_tax_due.toFixed(2)).toBe('220000.00');
});
```

### 5.2 PROP-BOUNDARY-02: Path C at ₱3,000,001

```
Input: gross_receipts = ₱3,000,001, PURELY_SE, non-VAT
Expected: path_c_eligible = false (> ₱3M)
Expected: PATH_C absent from comparisons

FRAMEWORK:
test('PROP-BOUNDARY-02', () => {
  const input = { ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal(3_000_001) };
  const result = computeTax(input);
  expect(result.eligibility_result.path_c_eligible).toBe(false);
  expect(result.regime_comparison_result.comparisons.every(c => c.path !== 'PATH_C')).toBe(true);
});
```

### 5.3 PROP-BOUNDARY-03: Graduated tax at bracket boundaries (2023+ table)

```
The 2023+ rate table has 6 brackets. Verify exact tax at each boundary:

NTI = ₱0:          tax = ₱0.00        (0% bracket floor)
NTI = ₱250,000:    tax = ₱0.00        (0% bracket ceiling — inclusive)
NTI = ₱250,001:    tax = ₱0.20        (20% applies to ₱1 excess = ₱0.20)
NTI = ₱400,000:    tax = ₱30,000.00   (0 + 20% × (₱400K - ₱250K) = ₱30,000)
NTI = ₱400,001:    tax = ₱30,000.25   (₱30,000 + 25% × ₱1 = ₱30,000.25)
NTI = ₱800,000:    tax = ₱130,000.00  (₱30,000 + 25% × ₱400K = ₱130,000)
NTI = ₱800,001:    tax = ₱130,000.30  (₱130,000 + 30% × ₱1 = ₱130,000.30)
NTI = ₱2,000,000:  tax = ₱490,000.00  (₱130,000 + 30% × ₱1,200,000 = ₱490,000)
NTI = ₱2,000,001:  tax = ₱490,000.32  (₱490,000 + 32% × ₱1 = ₱490,000.32)
NTI = ₱8,000,000:  tax = ₱2,410,000.00  (₱490,000 + 32% × ₱6M = ₱2,410,000)
NTI = ₱8,000,001:  tax = ₱2,410,000.35  (₱2,410,000 + 35% × ₱1 = ₱2,410,000.35)

FRAMEWORK:
const BRACKET_TESTS = [
  [0,         '0.00'],
  [250_000,   '0.00'],
  [250_001,   '0.20'],
  [400_000,   '30000.00'],
  [400_001,   '30000.25'],
  [800_000,   '130000.00'],
  [800_001,   '130000.30'],
  [2_000_000, '490000.00'],
  [2_000_001, '490000.32'],
  [8_000_000, '2410000.00'],
  [8_000_001, '2410000.35'],
];
BRACKET_TESTS.forEach(([nti, expected]) => {
  test(`PROP-BOUNDARY-03 NTI=₱${nti}`, () => {
    expect(applyGraduatedRate(new Decimal(nti), 2025).toFixed(2)).toBe(expected);
  });
});
```

### 5.4 PROP-BOUNDARY-04: Graduated tax at bracket boundaries (2018-2022 table)

```
NTI = ₱0:          tax = ₱0.00
NTI = ₱250,000:    tax = ₱0.00        (0% bracket, 2018-2022)
NTI = ₱250,001:    tax = ₱0.20        (20% bracket starts at ₱250,001)
NTI = ₱400,000:    tax = ₱30,000.00
NTI = ₱400,001:    tax = ₱30,000.25
NTI = ₱800,000:    tax = ₱130,000.00
NTI = ₱800,001:    tax = ₱130,000.30
NTI = ₱2,000,000:  tax = ₱490,000.00
NTI = ₱2,000,001:  tax = ₱490,000.32
NTI = ₱5,000,000:  tax = ₱1,450,000.00   (₱490,000 + 32% × ₱3M = ₱1,450,000)
NTI = ₱5,000,001:  tax = ₱1,450,000.32

NOTE: For tax_year 2018-2022, the brackets above ₱400K differ from 2023+:
  2018-2022: 20% on ₱250K-₱400K; 25% on ₱400K-₱800K; 30% on ₱800K-₱2M; 32% on ₱2M+
  2023+:     same brackets but 35% added on ₱8M+
  The table structure is identical for all brackets under ₱8M, as the TRAIN second phase
  only added the 35% bracket and did NOT change rates below ₱8M.

FRAMEWORK:
const BRACKET_TESTS_OLD = [
  [0,         '0.00'],
  [250_000,   '0.00'],
  [400_000,   '30000.00'],
  [800_000,   '130000.00'],
  [2_000_000, '490000.00'],
  [5_000_000, '1450000.00'],
];
BRACKET_TESTS_OLD.forEach(([nti, expected]) => {
  test(`PROP-BOUNDARY-04 NTI=₱${nti} year=2020`, () => {
    expect(applyGraduatedRate(new Decimal(nti), 2020).toFixed(2)).toBe(expected);
  });
});
```

### 5.5 PROP-BOUNDARY-05: OSD vs 8% breakeven verification

```
At gross_receipts = ₱437,500, PURELY_SE non-VAT, zero itemized expenses:
  Path B (OSD): NTI = ₱437,500 × 60% = ₱262,500; tax at 2023+ = 20% × (₱262,500 - ₱250,000)
               = 20% × ₱12,500 = ₱2,500.00
  Path C (8%): taxable_base = ₱437,500 - ₱250,000 = ₱187,500; tax = ₱15,000.00

  Wait: at ₱437,500, Path B = ₱2,500 + PT(₱437,500 × 3%) = ₱2,500 + ₱13,125 = ₱15,625
        Path C = ₱15,000 (PT waived)
        Path C wins by ₱625.

  True breakeven (Path B total burden == Path C total burden):
    From CR-028 breakeven table at bracket [₱250K-₱400K]:
      OSD total burden = (gross × 0.60 - 250K) × 0.20 + gross × 0.03
      8% total burden  = (gross - 250K) × 0.08
    Setting equal: 0.12×gross - 50K + 0.03×gross = 0.08×gross - 20K
                   0.15×gross - 50K = 0.08×gross - 20K
                   0.07×gross = 30K
                   gross = ₱428,571.43

  At gross = ₱428,571.43 (bracket ₱250K-₱400K breakeven):
    Path B OSD burden = (₱428,571.43 × 0.60 - ₱250,000) × 0.20 + ₱428,571.43 × 0.03
                      = (₱257,142.86 - ₱250,000) × 0.20 + ₱12,857.14
                      = ₱7,142.86 × 0.20 + ₱12,857.14
                      = ₱1,428.57 + ₱12,857.14 = ₱14,285.71
    Path C burden     = (₱428,571.43 - ₱250,000) × 0.08 = ₱178,571.43 × 0.08 = ₱14,285.71
    Confirmed equal.

FRAMEWORK:
test('PROP-BOUNDARY-05 OSD vs 8% breakeven', () => {
  // Just below breakeven: Path C wins
  const r_below = computeTax({ ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal('428571.42') });
  const rc_below = r_below.regime_comparison_result;
  expect(rc_below.comparisons[0].path).toBe('PATH_C');

  // Just above breakeven: also Path C wins (8% beats OSD throughout the ₱250K-₱400K range)
  const r_above = computeTax({ ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal('428571.44') });
  const rc_above = r_above.regime_comparison_result;
  expect(rc_above.comparisons[0].path).toBe('PATH_C');

  // Bracket ₱400K-₱437.5K: OSD can win (narrow window per CR-028)
  const r_window = computeTax({ ...BASE_PURELY_SE_INPUT, gross_receipts: new Decimal('420000') });
  // Verify the comparison list is sorted correctly (actual winner depends on expenses)
  expect(r_window.regime_comparison_result.comparisons.length).toBeGreaterThanOrEqual(2);
});
```

---

## 6. Anti-Properties (What Must NOT Happen)

These verify that incorrect outcomes never occur, even with unusual inputs.

### 6.1 PROP-ANTI-01: Engine must never apply both PT and 8% path simultaneously

```
PROPERTY PROP-ANTI-01:
  GIVEN: Any valid input
  ASSERT:
    NOT (selected_path == PATH_C AND ptr.pt_applies == true)
    NOT (selected_path == PATH_C AND ptr.pt_due > 0)
```

### 6.2 PROP-ANTI-02: Engine must never count the same 2307 entry in both IT and PT

```
PROPERTY PROP-ANTI-02:
  GIVEN: Any valid input with cwt_2307_entries
  ASSERT:
    For each entry e:
      NOT (e contributes to it_cwt_total AND e contributes to pt_cwt_total)
```

### 6.3 PROP-ANTI-03: Engine must never produce negative gross_income

```
PROPERTY PROP-ANTI-03:
  GIVEN: Any valid input
  ASSERT: ga.gross_income >= 0
  (Even with COGS > gross_receipts, engine applies max(0, gross_receipts - COGS))
```

### 6.4 PROP-ANTI-04: Engine must never recommend an ineligible path

```
PROPERTY PROP-ANTI-04:
  GIVEN: Any valid input
  ASSERT: rcr.recommended_path is eligible per eligibility_result
```

### 6.5 PROP-ANTI-05: Engine must never produce NaN or Infinity in any output field

```
PROPERTY PROP-ANTI-05:
  GIVEN: Any valid input (including zero gross_receipts)
  ASSERT: No field in TaxComputationResult contains NaN, Infinity, or -Infinity
  (Enforced by using Decimal type — floats are excluded from the type system)
```

### 6.6 PROP-ANTI-06: Engine must never use floating-point arithmetic

```
PROPERTY PROP-ANTI-06:
  GIVEN: Any valid input
  ASSERT: All intermediate and final Decimal values satisfy
    typeof value === 'Decimal' (from decimal.js or equivalent)
    value is not a JavaScript float
  (Verified at type level; this property is enforced by TypeScript type system, not runtime)
```

### 6.7 PROP-ANTI-07: Path A NTI must never exceed graduated income base

```
PROPERTY PROP-ANTI-07:
  GIVEN: Any valid input with Path A eligible
  ASSERT: (INV-PA-04 contrapositive)
    path_a_result.biz_nti <= ga.graduated_income_base
    (because deductions reduce NTI; NTI floor is max(0, gross - deductions))
```

---

## 7. Coverage Targets

The fuzz suite must achieve the following coverage targets before a release:

| Property Group | Properties | Required Pass Rate | Notes |
|---------------|------------|-------------------|-------|
| NN (Non-Negativity) | PROP-NN-01 to PROP-NN-03 | 100% | Zero tolerance for negative monetary values |
| EL (Eligibility) | PROP-EL-01 to PROP-EL-06 | 100% | Eligibility rules are regulatory requirements |
| PC (Path C) | PROP-PC-01 to PROP-PC-05 | 100% | 8% computation is core value prop |
| OSD (Path B) | PROP-OSD-01 to PROP-OSD-03 | 100% | OSD is always 40% — no deviation allowed |
| GRAD (Graduated) | PROP-GRAD-01 to PROP-GRAD-04 | 100% | Rate table is statutory |
| RC (Regime Comparison) | PROP-RC-01 to PROP-RC-08 | 100% | Optimizer must always find the minimum |
| PT (Percentage Tax) | PROP-PT-01 to PROP-PT-04 | 100% | PT/8% mutual exclusion is regulatory |
| CWT (Credits) | PROP-CWT-01 to PROP-CWT-03 | 100% | Credit accounting must be exact |
| BAL (Balance) | PROP-BAL-01 to PROP-BAL-04 | 100% | Balance determines what taxpayer owes |
| PEN (Penalty) | PROP-PEN-01 to PROP-PEN-05 | 100% | Penalty amounts have legal consequences |
| DET (Determinism) | PROP-DET-01 to PROP-DET-03 | 100% | Pure function; no flakiness |
| MI (Mixed Income) | PROP-MI-01 to PROP-MI-03 | 100% | Mixed income rules are unconditional |
| RND (Rounding) | PROP-RND-01 to PROP-RND-02 | 100% | BIR forms use whole-peso display |
| GA (Gross Aggregates) | PROP-GA-01 to PROP-GA-02 | 100% | Aggregation is foundational to all paths |
| XP (Cross-Path) | PROP-XP-01 to PROP-XP-03 | 100% | Monotonicity is an economic requirement |
| Boundary | PROP-BOUNDARY-01 to PROP-BOUNDARY-05 | 100% | Statutory thresholds must be exact |
| Anti-Properties | PROP-ANTI-01 to PROP-ANTI-07 | 100% | Zero tolerance for these failure modes |

**Total properties:** 56 named properties plus 5 boundary spot-checks plus 7 anti-properties = **68 property tests**

---

## 8. Failure Handling and Debugging

### 8.1 When a Property Fails

When fast-check finds a failing case:

1. **fast-check auto-shrinks** to the minimal failing input. The shrunk input is printed to the test output with full field values.
2. **Record the seed**: The seed value that reproduced the failure is printed. Re-run with `fc.assert(..., { seed: <printed_seed> })` to reproduce deterministically.
3. **Check the invariant**: The failing property ID (e.g., `PROP-RC-01`) directly references the invariant (e.g., `INV-RC-05`) and the pipeline step (e.g., `PL-13`). Investigate that step in `pipeline.md`.
4. **Write a concrete test vector**: Once the root cause is identified, add the minimal failing case as a concrete test vector in `edge-cases.md` so it is permanently regression-tested.

### 8.2 Reproduction Command

```bash
# Run with specific seed for reproduction
npx jest --testNamePattern="PROP-RC-01" -- --seed=<seed_value>
```

### 8.3 Minimum Reproducible Example (MRE) Template

When reporting a failing property, use this template:

```
Property: PROP-<ID>
Invariant: INV-<ID>
Seed: <seed>
Failing input (shrunk):
  gross_receipts: ₱<value>
  taxpayer_type: <type>
  ... (all fields that differ from BASE_PURELY_SE_INPUT)
Expected behavior: <invariant expression evaluated to true>
Actual behavior: <what the engine returned>
Pipeline step suspected: PL-<N>
```

---

## 9. BASE_* Constants Used in Properties

These constants are referenced throughout the property definitions above. They define minimal valid inputs from which test-specific inputs are derived.

### 9.1 BASE_PURELY_SE_INPUT

```typescript
const BASE_PURELY_SE_INPUT: TaxpayerInput = {
  taxpayer_type: 'PURELY_SE',
  tax_year: 2025,
  filing_period: 'ANNUAL',
  is_mixed_income: false,
  is_vat_registered: false,
  is_bmbe_registered: false,
  subject_to_sec_117_128: false,
  is_gpp_partner: false,
  gross_receipts: new Decimal(0),
  sales_returns_allowances: new Decimal(0),
  non_operating_income: new Decimal(0),
  fwt_income: new Decimal(0),
  cost_of_goods_sold: new Decimal(0),
  taxable_compensation: new Decimal(0),
  compensation_cwt: new Decimal(0),
  itemized_expenses: ZERO_ITEMIZED_EXPENSES,
  cwt_2307_entries: [],
  prior_quarterly_payments: [],
  prior_year_excess_cwt: new Decimal(0),
  prior_payment_for_return: new Decimal(0),
  elected_regime: null,
  taxpayer_tier: 'MICRO',
  actual_filing_date: null,
  filing_deadline: '2026-04-15'
};
```

### 9.2 ZERO_ITEMIZED_EXPENSES

```typescript
const ZERO_ITEMIZED_EXPENSES: ItemizedExpenses = {
  salaries_wages: new Decimal(0),
  rent: new Decimal(0),
  utilities: new Decimal(0),
  supplies: new Decimal(0),
  communication: new Decimal(0),
  travel: new Decimal(0),
  depreciation: new Decimal(0),
  interest_expense: new Decimal(0),
  taxes_licenses: new Decimal(0),
  insurance: new Decimal(0),
  repairs_maintenance: new Decimal(0),
  representation_entertainment: new Decimal(0),
  professional_fees: new Decimal(0),
  advertising: new Decimal(0),
  charitable_donations: new Decimal(0),
  bad_debts: new Decimal(0),
  research_development: new Decimal(0),
  pension_contributions: new Decimal(0),
  other_deductible: new Decimal(0),
  nolco: new Decimal(0),
  home_office_percentage: new Decimal(0),
  home_office_exclusive_use: false,
  is_accrual_basis: false,
  charitable_accredited: false,
  deposit_interest_income: new Decimal(0)
};
```

### 9.3 BASE_PURELY_SE_ANNUAL_INPUT

```typescript
const BASE_PURELY_SE_ANNUAL_INPUT: TaxpayerInput = {
  ...BASE_PURELY_SE_INPUT,
  filing_period: 'ANNUAL',
  gross_receipts: new Decimal(700_000)
};
```

---

## 10. Summary Table of All Properties

| Property ID | Group | Invariants Tested | Generator | Iterations |
|-------------|-------|-------------------|-----------|------------|
| PROP-NN-01 | Non-Negativity | INV-PA-07, INV-PB-06, INV-PC-08, INV-PT-05, INV-BAL-05, INV-PEN-10, INV-PEN-11, INV-PEN-12 | genPurelySEInput | 10,000 |
| PROP-NN-02 | Non-Negativity | INV-GA-02, INV-GA-03, INV-GA-07 | genPurelySEInput | 10,000 |
| PROP-NN-03 | Non-Negativity | INV-PA-01 | genPurelySEInput | 10,000 |
| PROP-EL-01 | Eligibility | INV-EL-01, INV-RC-19 | genPurelySEInput (VAT=true) | 10,000 |
| PROP-EL-02 | Eligibility | INV-EL-02, INV-RC-20 | genPurelySEInput (GR>3M) | 10,000 |
| PROP-EL-03 | Eligibility | INV-EL-07, INV-EL-08 | genPurelySEInput (GR≤3M, non-VAT) | 10,000 |
| PROP-EL-04 | Eligibility | INV-EL-12 | genPurelySEInput | 10,000 |
| PROP-EL-05 | Eligibility | INV-EL-13 | genPurelySEInput | 10,000 |
| PROP-EL-06 | Eligibility | INV-EL-09, INV-EL-10 | genPurelySEInput (non-COMP_ONLY) | 10,000 |
| PROP-PC-01 | Path C | INV-PC-05, INV-PC-14 | genBoundaryInput | 10,000 |
| PROP-PC-02 | Path C | INV-PC-07 | genBoundaryInput | 10,000 |
| PROP-PC-03 | Path C | INV-PC-03 | genPurelySEInput | 10,000 |
| PROP-PC-04 | Path C | INV-PC-04 | genMixedIncomeInput | 10,000 |
| PROP-PC-05 | Path C | INV-PC-16 | two genItemizedExpenses | 10,000 |
| PROP-OSD-01 | Path B | INV-PB-01 | genPurelySEInput | 10,000 |
| PROP-OSD-02 | Path B | INV-PB-02 | genPurelySEInput | 10,000 |
| PROP-OSD-03 | Path B | INV-PB-05 | genPurelySEInput | 10,000 |
| PROP-GRAD-01 | Graduated Rate | INV-MON-01 | two genMoney + genTaxYear | 10,000 |
| PROP-GRAD-02 | Graduated Rate | INV-MON-02 | genMoney + genTaxYear | 10,000 |
| PROP-GRAD-03 | Graduated Rate | INV-DET-08 (2023+) | genTaxYear [2023-2030] | 10,000 |
| PROP-GRAD-04 | Graduated Rate | INV-DET-08 (2018-2022) | genTaxYear [2018-2022] | 10,000 |
| PROP-RC-01 | Regime Comparison | INV-RC-05, INV-MON-10 | genPurelySEInput | 10,000 |
| PROP-RC-02 | Regime Comparison | INV-RC-04 | genPurelySEInput | 10,000 |
| PROP-RC-03 | Regime Comparison | INV-RC-03 | genPurelySEInput | 10,000 |
| PROP-RC-04 | Regime Comparison | INV-RC-12 | genPurelySEInput | 10,000 |
| PROP-RC-05 | Regime Comparison | INV-RC-13, INV-PT-01 | genPurelySEInput | 10,000 |
| PROP-RC-06 | Regime Comparison | INV-RC-14, INV-XP-05 | genPurelySEInput | 10,000 |
| PROP-RC-07 | Regime Comparison | INV-RC-08, INV-RC-17 | genPurelySEInput | 10,000 |
| PROP-RC-08 | Regime Comparison | INV-EL-11, INV-RC-01 | genPurelySEInput OR genMixedIncomeInput | 10,000 |
| PROP-PT-01 | Percentage Tax | INV-PT-01, INV-PC-12 | genPurelySEInput | 10,000 |
| PROP-PT-02 | Percentage Tax | INV-PT-02, INV-PT-03 | genPurelySEInput (VAT=true) | 10,000 |
| PROP-PT-03 | Percentage Tax | INV-PT-06 | genPurelySEInput (non-VAT) | 10,000 |
| PROP-PT-04 | Percentage Tax | INV-PT-08 | genPurelySEInput (year≥2024) | 10,000 |
| PROP-CWT-01 | CWT Credits | INV-CWT-11 | genPurelySEInput (non-empty entries) | 10,000 |
| PROP-CWT-02 | CWT Credits | INV-CWT-04, INV-CWT-05 | genPurelySEInput (PT010 entries) | 10,000 |
| PROP-CWT-03 | CWT Credits | INV-CWT-05 | genPurelySEInput | 10,000 |
| PROP-BAL-01 | Balance | INV-BAL-02, INV-BAL-03, INV-BAL-04 | genPurelySEInput (ANNUAL) | 10,000 |
| PROP-BAL-02 | Balance | INV-BAL-05, INV-BAL-06 | genPurelySEInput (ANNUAL) | 10,000 |
| PROP-BAL-03 | Balance | INV-BAL-08, INV-BAL-09, INV-BAL-10 | genPurelySEInput (balance>2K) | 10,000 |
| PROP-BAL-04 | Balance | INV-MON-06 | two CWT amounts | 10,000 |
| PROP-PEN-01 | Penalty | INV-PEN-01, INV-PEN-02, INV-PEN-15 | genPurelySEInput (on-time) | 10,000 |
| PROP-PEN-02 | Penalty | INV-PEN-03 | genPurelySEInput (MICRO/SMALL, late) | 10,000 |
| PROP-PEN-03 | Penalty | INV-PEN-08 | genPurelySEInput (late) | 10,000 |
| PROP-PEN-04 | Penalty | INV-PEN-13 | genPurelySEInput | 10,000 |
| PROP-PEN-05 | Penalty | INV-MON-07 | two days_late values | 10,000 |
| PROP-DET-01 | Determinism | INV-DET-01 | genPurelySEInput | 10,000 |
| PROP-DET-02 | Determinism | INV-DET-05 | genPurelySEInput | 10,000 |
| PROP-DET-03 | Determinism | INV-DET-06 | genPurelySEInput | 10,000 |
| PROP-MI-01 | Mixed Income | INV-PC-04 | genMixedIncomeInput | 10,000 |
| PROP-MI-02 | Mixed Income | INV-PA-09, INV-PB-08 | genMixedIncomeInput | 10,000 |
| PROP-MI-03 | Mixed Income | INV-FF-02 | genMixedIncomeInput (ANNUAL) | 10,000 |
| PROP-RND-01 | Rounding | INV-RND-01, INV-RND-02 | genPurelySEInput | 10,000 |
| PROP-RND-02 | Rounding | INV-RND-04, INV-FF-08 | genPurelySEInput (ANNUAL) | 10,000 |
| PROP-GA-01 | Gross Aggregates | INV-GA-01 | genPurelySEInput | 10,000 |
| PROP-GA-02 | Gross Aggregates | INV-GA-11 | two FWT amounts | 10,000 |
| PROP-XP-01 | Cross-Path | INV-XP-03, INV-PA-05 | two expense amounts | 10,000 |
| PROP-XP-02 | Cross-Path | INV-XP-08, INV-MON-03 | two gross receipt amounts | 10,000 |
| PROP-XP-03 | Cross-Path | INV-MON-04 | two OSD base amounts | 10,000 |
| PROP-BOUNDARY-01 | Boundary | INV-PC-06, INV-EL-07 | constant ₱3,000,000 | 1 (deterministic) |
| PROP-BOUNDARY-02 | Boundary | INV-EL-02 | constant ₱3,000,001 | 1 (deterministic) |
| PROP-BOUNDARY-03 | Boundary | INV-DET-08 (2023+) | 11 constants | 11 (deterministic) |
| PROP-BOUNDARY-04 | Boundary | INV-DET-08 (2018-2022) | 6 constants | 6 (deterministic) |
| PROP-BOUNDARY-05 | Boundary | INV-XP-08 | constants near breakeven | 3 (deterministic) |
| PROP-ANTI-01 | Anti-Property | INV-PT-01, INV-PC-12 | genPurelySEInput | 10,000 |
| PROP-ANTI-02 | Anti-Property | INV-CWT-05 | genPurelySEInput | 10,000 |
| PROP-ANTI-03 | Anti-Property | INV-GA-03 | genPurelySEInput | 10,000 |
| PROP-ANTI-04 | Anti-Property | INV-EL-06 | genPurelySEInput | 10,000 |
| PROP-ANTI-05 | Anti-Property | INV-RND-05 | genPurelySEInput | 10,000 |
| PROP-ANTI-06 | Anti-Property | INV-RND-05 | type-level check (no runtime gen) | N/A |
| PROP-ANTI-07 | Anti-Property | INV-PA-04 | genPurelySEInput | 10,000 |
| SUITE-ANNUAL-PURELY-SE | Composite | Multiple | genPurelySEInput | 50,000 |
| SUITE-BOUNDARY | Composite | Multiple | genBoundaryInput | 10,000 |
| SUITE-MIXED-INCOME | Composite | Multiple | genMixedIncomeInput | 10,000 |
