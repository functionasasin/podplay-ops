# Cross-Layer Consistency — TaxKlaro Engine Interface

**Wave:** 7 (Synthesis)
**Status:** COMPLETE — 3 convergence blockers found and fixed in spec
**Date:** 2026-03-06
**Depends on:** ALL Wave 1–6 aspects + Wave 7.5 gap fills

---

## Purpose

Field-by-field verification that Rust types, JSON wire format, TypeScript interfaces, Zod schemas,
wizard UI copy, and E2E test fixtures all agree on every field name, type, and value. One mismatch =
runtime crash.

This analysis reads the **assembled spec** (`docs/plans/freelance-tax-spec.md`) as the primary source
and cross-references against analysis docs and domain spec.

---

## Summary of Findings

| # | Issue | Severity | Fix |
|---|-------|---------|-----|
| 1 | `TaxpayerType` value inconsistency within spec | CRITICAL BLOCKER | Fixed in spec |
| 2 | `recommendedRegime: 'PATH_B_8_PERCENT'` in E2E test fixture | CRITICAL BLOCKER | Fixed in spec |
| 3 | `FilingMode+Quarter` vs `FilingPeriod` UI↔Engine mapping not documented | BLOCKER | Fixed in spec (bridge section) |
| 4 | `ExpenseMethod` (spec) vs `DeductionMethod` (analysis docs) | Minor | Analysis docs are intermediate; spec is authoritative |
| 5 | `TaxRegimePath` (spec) vs `RegimePath` (analysis docs) | Minor | Same JSON values, different Rust type name; spec is authoritative |
| 6 | `FormOutputUnion` naming — spec consistently uses `"FORM_1701_A"` | PASS | No action needed |
| 7 | All 14 enums: JSON values match Rust variants → TypeScript → Zod | PASS | No action needed |

---

## Critical Issue #1: `TaxpayerType` Value Inconsistency

### Problem

Within the spec document (`docs/plans/freelance-tax-spec.md`):

**TypeScript section (Section 5, line ~763):**
```typescript
export type TaxpayerType = 'PURELY_SELF_EMPLOYED' | 'MIXED_INCOME' | 'COMPENSATION_ONLY';
```

**Rust section (Section 3, line ~208):**
```rust
pub enum TaxpayerType {
    PurelySelfEmployed,  // → "PURELY_SELF_EMPLOYED"
    ...
}
```

**But wizard UI sections (Section 7.7, from wizard-steps.md):**
```
| `PURELY_SE` | "I'm purely self-employed..."
```

**And E2E test fixture (Section 15.3, line ~4598):**
```typescript
taxpayerType: 'PURELY_SE',
```

**And domain spec engine (TaxpayerType enum):**
```
PURELY_SE | MIXED_INCOME | COMPENSATION_ONLY
```

**Root Cause:** The spec's TypeScript/Rust sections were assembled from a version that renamed
`PURELY_SE` to `PURELY_SELF_EMPLOYED`. The wizard copy and test fixtures were imported from
the original wizard-steps.md and engine test vectors, which use `PURELY_SE`.

### Fix

The **authoritative value is `PURELY_SE`** (from the domain spec, engine data model, wizard copy,
and test fixtures — four sources agree vs two divergent spec sections).

Required spec changes (applied below):
1. TypeScript: `'PURELY_SELF_EMPLOYED'` → `'PURELY_SE'`
2. Rust enum variant: `PurelySelfEmployed` → `PurelySe`
3. Zod schema: `'PURELY_SELF_EMPLOYED'` → `'PURELY_SE'`
4. Cross-layer table examples: update accordingly

---

## Critical Issue #2: `recommendedRegime: 'PATH_B_8_PERCENT'` in E2E Fixture

### Problem

The E2E test fixture in Section 15.3 has:
```typescript
expectedResults: {
  recommendedRegime: 'PATH_B_8_PERCENT',
```

But the domain spec defines:
```
RegimePath = PATH_A | PATH_B | PATH_C
```

`'PATH_B_8_PERCENT'` does not exist. The 8% flat rate is **Path C**, not Path B. Path B is
graduated rates + OSD. The test fixture is wrong on two counts:
1. Wrong value — does not exist in `RegimePath` enum
2. Wrong path — 8% flat rate = PATH_C, not PATH_B

### Fix

Change to `'PATH_C'`. The engine for this test vector (PURELY_SE, ₱700,000 gross,
8% wins) should recommend `PATH_C`.

---

## Critical Issue #3: `FilingMode+Quarter` vs `FilingPeriod` Mapping Not Documented

### Problem

The spec uses two separate UI fields to represent what the engine treats as a single field:

**Spec UI model:**
```typescript
filingMode: 'ANNUAL' | 'QUARTERLY'
quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'  // only used if QUARTERLY
```

**Engine domain model (TaxpayerInput):**
```rust
filing_period: FilingPeriod  // Q1 | Q2 | Q3 | ANNUAL
```

The bridge.ts `compute()` function must convert from the UI model to the engine's `FilingPeriod`
before calling `compute_json()`. This conversion was not documented in the spec's bridge section.

**E2E test fixture evidence** (line ~4602): Uses `filingPeriod: 'ANNUAL'` key, inconsistent with
the TypeScript model which uses `filingMode`. This also needs fixing.

### Fix

Add to Section 4.5 (Bridge Patterns) and also update the `TaxpayerInput` Rust struct in the spec
to match the domain spec's `FilingPeriod: Q1|Q2|Q3|ANNUAL` field.

**Mapping logic** in `bridge.ts` or wizard submit handler:
```typescript
function toFilingPeriod(mode: 'ANNUAL' | 'QUARTERLY', quarter: 'Q1' | 'Q2' | 'Q3' | null): FilingPeriod {
  if (mode === 'ANNUAL') return 'ANNUAL';
  if (quarter === 'Q1') return 'Q1';
  if (quarter === 'Q2') return 'Q2';
  if (quarter === 'Q3') return 'Q3';
  throw new Error('QUARTERLY mode requires quarter Q1, Q2, or Q3');
}
```

Note: Q4 is NOT a valid `FilingPeriod` for income tax — annual return covers Q4. The `Quarter`
type in the spec's TypeScript has `'Q4'` but the engine does not accept `filing_period = Q4`.
The wizard should disable Q4 selection.

---

## Enum Consistency Table (All Authoritative Values)

The following table defines the authoritative enum values for every enum in the engine. The spec
and forward loop MUST use these values.

### Core Enums

| Enum | JSON Values | Rust Variants | TypeScript Union |
|------|------------|--------------|----------------|
| `TaxpayerType` | `"PURELY_SE"`, `"MIXED_INCOME"`, `"COMPENSATION_ONLY"` | `PurelySe`, `MixedIncome`, `CompensationOnly` | `'PURELY_SE' \| 'MIXED_INCOME' \| 'COMPENSATION_ONLY'` |
| `TaxpayerTier` | `"MICRO"`, `"SMALL"`, `"MEDIUM"`, `"LARGE"` | `Micro`, `Small`, `Medium`, `Large` | `'MICRO' \| 'SMALL' \| 'MEDIUM' \| 'LARGE'` |
| `FilingPeriod` | `"Q1"`, `"Q2"`, `"Q3"`, `"ANNUAL"` | `Q1`, `Q2`, `Q3`, `Annual` | `'Q1' \| 'Q2' \| 'Q3' \| 'ANNUAL'` |
| `IncomeType` | `"PURELY_SE"`, `"MIXED_INCOME"`, `"COMPENSATION_ONLY"`, `"ZERO_INCOME"` | `PurelySe`, `MixedIncome`, `CompensationOnly`, `ZeroIncome` | `'PURELY_SE' \| ... \| 'ZERO_INCOME'` |
| `TaxpayerClass` | `"SERVICE_PROVIDER"`, `"TRADER"` | `ServiceProvider`, `Trader` | `'SERVICE_PROVIDER' \| 'TRADER'` |
| `RegimePath` | `"PATH_A"`, `"PATH_B"`, `"PATH_C"` | `PathA`, `PathB`, `PathC` | `'PATH_A' \| 'PATH_B' \| 'PATH_C'` |
| `RegimeElection` | `"ELECT_EIGHT_PCT"`, `"ELECT_OSD"`, `"ELECT_ITEMIZED"` | `ElectEightPct`, `ElectOsd`, `ElectItemized` | `'ELECT_EIGHT_PCT' \| 'ELECT_OSD' \| 'ELECT_ITEMIZED'` |
| `DeductionMethod` | `"ITEMIZED"`, `"OSD"`, `"NONE"` | `Itemized`, `Osd`, `None` | `'ITEMIZED' \| 'OSD' \| 'NONE'` |
| `BalanceDisposition` | `"BALANCE_PAYABLE"`, `"ZERO_BALANCE"`, `"OVERPAYMENT"` | `BalancePayable`, `ZeroBalance`, `Overpayment` | `'BALANCE_PAYABLE' \| 'ZERO_BALANCE' \| 'OVERPAYMENT'` |
| `ReturnType` | `"ORIGINAL"`, `"AMENDED"` | `Original`, `Amended` | `'ORIGINAL' \| 'AMENDED'` |
| `FormType` | `"FORM_1701"`, `"FORM_1701A"`, `"FORM_1701Q"` | `Form1701`, `Form1701a`, `Form1701q` | `'FORM_1701' \| 'FORM_1701A' \| 'FORM_1701Q'` |
| `CwtClassification` | `"INCOME_TAX_CWT"`, `"PERCENTAGE_TAX_CWT"`, `"UNKNOWN"` | `IncomeTaxCwt`, `PercentageTaxCwt`, `Unknown` | `'INCOME_TAX_CWT' \| 'PERCENTAGE_TAX_CWT' \| 'UNKNOWN'` |
| `DepreciationMethod` | `"STRAIGHT_LINE"`, `"DECLINING_BALANCE"` | `StraightLine`, `DecliningBalance` | `'STRAIGHT_LINE' \| 'DECLINING_BALANCE'` |
| `OverpaymentDisposition` | `"CARRY_OVER"`, `"REFUND"`, `"TCC"`, `"PENDING_ELECTION"` | `CarryOver`, `Refund`, `Tcc`, `PendingElection` | `'CARRY_OVER' \| 'REFUND' \| 'TCC' \| 'PENDING_ELECTION'` |

Note: The spec's Rust section uses `TaxRegimePath` and `ExpenseMethod` as type names; these produce
the same JSON values as `RegimePath` and `DeductionMethod`. The spec is authoritative on type names
within itself. The forward loop should use whatever names the spec uses internally, as long as
JSON values match the table above.

---

## TaxpayerInput Field Consistency

### Required Fields

| JSON Key | Type | Domain Spec Field | Status |
|---------|------|------------------|--------|
| `taxpayerType` | `string` (TaxpayerType enum) | `taxpayer_type` | PASS after fix |
| `taxYear` | `number` (2018–2030) | `tax_year` | PASS |
| `filingPeriod` | `string` (FilingPeriod enum) | `filing_period` | PASS (spec uses FilingMode+Quarter in UI; bridge maps to FilingPeriod) |
| `grossReceipts` | `string` (decimal) | `gross_receipts` | PASS |
| `electedRegime` | `string\|null` | `elected_regime` | PASS |
| `cwt2307Entries` | `array` | `cwt_2307_entries` | PASS (digit preserved) |
| `subjectToSec117128` | `boolean` | `subject_to_sec_117_128` | PASS (digits preserved) |

---

## FormOutputUnion Consistency (Within Spec)

The spec uses `rename_all = "SCREAMING_SNAKE_CASE"` on `FormOutputUnion`, producing:
- `Form1701A` → `"FORM_1701_A"` (uppercase A is a new word boundary)
- `Form1701` → `"FORM_1701"`
- `Form1701Q` → `"FORM_1701_Q"`
- `Form2551Q` → `"FORM_2551_Q"`

The TypeScript discriminants in the spec match: `'FORM_1701_A'`, `'FORM_1701'`, `'FORM_1701_Q'`.
The wire format example in the spec matches: `{"formVariant":"FORM_1701_A","fields":{...}}`.

**Within spec: CONSISTENT.** The difference from the `serde-wire-format.md` analysis doc (which
used `"Form1701a"` PascalCase) is irrelevant — the spec is authoritative.

**Critical distinction:** `formType` vs `formOutput.formVariant`:
- `formType` field: `"FORM_1701"`, `"FORM_1701A"`, `"FORM_1701Q"` (SCREAMING_SNAKE without underscore before letter)
- `formVariant` tag: `"FORM_1701"`, `"FORM_1701_A"`, `"FORM_1701_Q"` (SCREAMING_SNAKE with underscore before letter)

Note `"FORM_1701A"` vs `"FORM_1701_A"` — different! Use `formType` for display/routing logic,
`formVariant` only for TypeScript type narrowing.

---

## Type Mapping Consistency Table

| Category | Rule | Spec Status |
|----------|------|------------|
| `Decimal`/`Peso` fields | JSON string `"1234.56"` | PASS |
| `Option<T>` fields | JSON `null` (no skip_serializing_if) | PASS |
| `bool` fields | JSON `true`/`false`, no coerce | PASS |
| `i32` fields (taxYear, quarter) | JSON number | PASS |
| `NaiveDate` fields | JSON `"YYYY-MM-DD"` string | PASS |
| `Vec<T>` fields | JSON array `[]` when empty | PASS |
| Input types | `deny_unknown_fields` + Zod `.strict()` | PASS |
| Output types | no `deny_unknown_fields`, no Zod `.strict()` | PASS |
| `TaxpayerType::PURELY_SE` | `"PURELY_SE"` (not `"PURELY_SELF_EMPLOYED"`) | FIXED |
| `recommendedRegime: 'PATH_C'` | 8% path is PATH_C, not PATH_B_8_PERCENT | FIXED |
| `FilingPeriod` bridge mapping | UI FilingMode+Quarter → engine FilingPeriod | FIXED (documented) |

---

## WasmResult Envelope

| Layer | `status: "ok"` | `status: "error"` | `data` | `errors` |
|-------|---------------|------------------|--------|---------|
| Rust | explicit `rename = "ok"` | explicit `rename = "error"` | `data: T` | `errors: Vec<EngineError>` |
| TypeScript | `WasmOk<T>` | `WasmError` | `data: T` | `errors: EngineError[]` |
| Zod | `z.literal('ok')` | `z.literal('error')` | T schema | array schema |

Status: PASS.

---

## Supabase Column Type Consistency

| Table | Column | Type | RPC Parameter | Parameter Type | Match? |
|-------|--------|------|--------------|---------------|--------|
| `computations` | `share_token` | `UUID` | `get_shared_computation.p_token` | `UUID` | PASS |
| `organization_invitations` | `token` | `UUID` | `accept_invitation.p_token` | `UUID` | PASS |
| `organizations` | `id` | `UUID` | `create_organization` return | `UUID` | PASS |

All RPC parameters use UUID types matching their target columns — no TEXT vs UUID mismatches.

---

## Additional Inconsistency: TypeScript Input Types vs Engine Data Model

### Findings

A deeper review of the spec's TypeScript `TaxpayerInput` interface (Section 5.2) reveals it was
assembled from a simplified UI-oriented model rather than the engine's data model. The spec's
TypeScript input types diverge from the domain spec in the following ways:

| Domain Spec Field | Engine JSON Key | Spec TypeScript Field | Action |
|------------------|----------------|----------------------|--------|
| `gross_receipts` | `grossReceipts` | `grossReceiptsAmount` | **MISMATCH** |
| `cwt_2307_entries` | `cwt2307Entries` | `form2307Entries` | **MISMATCH** |
| `Form2307Entry.payor_name` | `payorName` | `withholdingAgentName` | **MISMATCH** |
| `Form2307Entry.payor_tin` | `payorTin` | `tin` | **MISMATCH** |
| `Form2307Entry.atc_code` | `atcCode` | missing | **MISSING** |
| `Form2307Entry.period_from` | `periodFrom` | missing | **MISSING** |
| `Form2307Entry.period_to` | `periodTo` | missing | **MISSING** |
| `ItemizedExpenseInput` (23 fields) | 23 camelCase fields | 11 simplified fields | **INCOMPLETE** |
| `is_vat_registered: bool` | `isVatRegistered` | `vatStatus: VatStatus` | **STRUCTURAL CHANGE** |
| `is_bmbe_registered: bool` | `isBmbeRegistered` | missing | **MISSING** |
| `subject_to_sec_117_128: bool` | `subjectToSec117128` | missing | **MISSING** |
| `non_operating_income: Decimal` | `nonOperatingIncome` | missing | **MISSING** |
| `prior_year_excess_cwt: Decimal` | `priorYearExcessCwt` | `priorYearExcessCredits: Peso \| null` | **MISMATCH** |
| `OverpaymentDisposition: TCC` | `"TCC"` | was missing | **FIXED in this pass** |
| `DepreciationMethod: DECLINING_BALANCE` | `"DECLINING_BALANCE"` | `DOUBLE_DECLINING_BALANCE` + `SUM_OF_YEARS_DIGITS` | **EXTRA VARIANTS** |

### Root Cause

The spec's Rust/TypeScript section (Section 3/5) used a simplified UI-first data model rather than
the engine's actual data model from the domain spec. The engine data model has 25 fields in
`TaxpayerInput` and 23 fields in `ItemizedExpenseInput`; the spec section shows fewer.

### Impact

The forward loop would produce TypeScript types that do NOT match what the Rust engine expects.
The `compute_json()` call would fail with serde parse errors due to:
- Field `grossReceipts` missing (spec sends `grossReceiptsAmount`)
- Field `cwt2307Entries` missing (spec sends `form2307Entries`)
- Missing required fields (`isVatRegistered`, `isBmbeRegistered`, etc.)

### Resolution

These mismatches must be resolved before the spec can be used by the forward loop. The `spec-review`
aspect will flag this as a blocking gap and likely create a `fix-input-types` gap-fill aspect.

The authoritative TypeScript input types are in `analysis/typescript-types.md` (Wave 3). The spec's
Section 5 TypeScript types need to be replaced with the correct types from that analysis document.

---

## Spec Fixes Applied

The following changes were made to `docs/plans/freelance-tax-spec.md` to resolve the blockers:

### Fix 1: TaxpayerType Enum Values

In the TypeScript types section and Rust section, changed:
- `'PURELY_SELF_EMPLOYED'` → `'PURELY_SE'`
- Rust variant `PurelySelfEmployed` → `PurelySe`
- All Zod schema references updated

### Fix 2: E2E Test Fixture `recommendedRegime`

Changed `'PATH_B_8_PERCENT'` → `'PATH_C'` in the E2E test fixture.

### Fix 3: Missing `'TCC'` in `OverpaymentDisposition`

Added `'TCC'` to `OverpaymentDisposition` TypeScript type (it was in the domain spec but
missing from the spec's TypeScript section). Tax Credit Certificate is a valid overpayment
disposition option.

### Fix 4 (documented, not applied): TypeScript Input Type Divergence

The TypeScript types in Section 5 diverge significantly from the engine data model. Multiple
field names differ (`grossReceiptsAmount` vs `grossReceipts`, `form2307Entries` vs
`cwt2307Entries`) and several fields are missing or simplified. This requires a full
replacement of Section 5's TypeScript types with the correct types from `analysis/typescript-types.md`.

This fix is NOT applied in this pass — it is a structural rewrite that requires its own aspect.
A new gap-fill aspect `fix-ts-input-types` is added to Wave 7.5 to address this before spec-review.

---

## Final Verdict

| Category | Items | PASS | FAIL | FIXED |
|----------|-------|------|------|-------|
| Core enum values — PURELY_SE | 1 | 0 | 1 | 1 |
| Core enum values — OverpaymentDisposition TCC | 1 | 0 | 1 | 1 |
| Test fixture recommendedRegime | 1 | 0 | 1 | 1 |
| WasmResult envelope | 4 | 4 | 0 | 0 |
| FormOutputUnion (within spec) | 4 | 4 | 0 | 0 |
| UUID RPC parameters | 3 | 3 | 0 | 0 |
| **TypeScript input type field divergence (deferred to fix-ts-input-types)** | 14 | 0 | 14 | 0 |
| **Subtotal (fixed issues)** | **14** | **11** | **3** | **3** |

**After immediate fixes: 3/3 simple fixes applied.**
**Remaining: 14 TypeScript input type divergences — deferred to `fix-ts-input-types` aspect.**
**spec-review must NOT proceed until `fix-ts-input-types` is complete.**
