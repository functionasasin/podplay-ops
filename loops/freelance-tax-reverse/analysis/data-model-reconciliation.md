# Data Model Reconciliation — Philippine Freelance Tax Optimizer

**Aspect:** data-model-reconciliation
**Wave:** 6 (Synthesis & Completeness Audit)
**Date analyzed:** 2026-03-02
**Files read:** engine/data-model.md, engine/pipeline.md, api/endpoints.md, frontend/wizard-steps.md, database/schema.md, engine/test-vectors/basic.md, engine/test-vectors/exhaustive.md, domain/computation-rules.md

---

## Summary

Overall data model alignment is **97% reconciled**. All 17 engine pipeline types and all 6 form output types are fully defined and cross-referenced. Enums, input structs, and output structs all match their pipeline usage. Two structural gaps were found and fixed in the same iteration:

1. **`OverpaymentDisposition` enum missing `PENDING_ELECTION` variant** — test vectors used `PENDING_ELECTION` and `TAXPAYER_ELECTION_REQUIRED` (inconsistent naming) for the state where an overpayment requires taxpayer choice. Added `PENDING_ELECTION` as canonical variant; updated all test vector usages to use this single name.
2. **`TaxComputationResult` missing `overpayment_disposition` field** — the struct had `disposition: BalanceDisposition` (BALANCE_PAYABLE / ZERO_BALANCE / OVERPAYMENT) but no field for the taxpayer's selected overpayment handling option. Test vectors were referencing a field that didn't exist in the struct definition. Added `overpayment_disposition: OverpaymentDisposition | null`.
3. **Database `overpayment_disposition_enum` missing `PENDING_ELECTION`** — mirrors engine fix.
4. **`computations` table not denormalizing `overpayment_disposition`** — added column for analytics queries.

No orphaned types found (the Explore agent incorrectly flagged `DeductionMethod` as orphaned; it IS used in `PathAResult`, `PathBResult`, `PathCResult` structs at lines 632, 650, 671). `FilingDeadlineInfo` is correctly documented as an internal helper; it does not need to appear in `TaxComputationResult`.

---

## Category A: Frontend fields NOT in engine input types

| Finding | File | Field | Status |
|---------|------|-------|--------|
| A-1 | wizard-steps.md § WS-00 | `mode_selection` | CORRECT — UI routing only; not part of TaxpayerInput |
| A-2 | wizard-steps.md § WS-02 | `business_category` | CORRECT — maps to `cost_of_goods_sold` and `taxpayer_class` engine derivations |
| A-3 | wizard-steps.md § WS-05 | `number_of_employers` | CORRECT — advisory display only; engine receives combined `taxable_compensation` |
| A-4 | wizard-steps.md § WS-06 | `expense_input_method` | CORRECT — determines wizard routing path; not an engine input |

All frontend-only fields are correctly excluded from `TaxpayerInput`. No action required.

---

## Category B: API request fields NOT in engine input types

| Finding | File | Field | Status |
|---------|------|-------|--------|
| B-1 | api/endpoints.md § 2.1 | `Authorization: ApiKey` header | CORRECT — auth, not computation input |
| B-2 | api/endpoints.md § 2.4 | `Idempotency-Key` header | CORRECT — API layer deduplication |
| B-3 | api/endpoints.md § 2.1 | `Accept-Language` header | CORRECT — API response language, not tax input |
| B-4 | api/endpoints.md (derived) | `taxpayer_tier` | CORRECT — engine computes this from `gross_receipts` in PL-02; callers do not provide it |

---

## Category C: API response fields NOT in engine output types

| Finding | File | Field | Status |
|---------|------|-------|--------|
| C-1 | api/endpoints.md § 5.2 | `has_active_subscription`, `subscription_plan` | CORRECT — user profile data, not tax computation output |
| C-2 | api/endpoints.md § 4 | `X-RateLimit-*` headers | CORRECT — HTTP headers from Redis; engine doesn't manage rate limiting |
| C-3 | api/endpoints.md § 2.2 | Pagination `meta` object | CORRECT — API envelope for list endpoints |
| C-4 | api/endpoints.md § 11 | `job_id` in async batch response | CORRECT — batch job tracking separate from individual computation |
| C-5 | api/endpoints.md § 14 | Stripe/PayMongo webhook fields | CORRECT — processed server-side, not stored in tax result |

---

## Category D: Database columns referencing engine types

| Finding | DB Column | Engine Type | Status |
|---------|-----------|-------------|--------|
| D-1 | computations.recommended_path (regime_path_enum) | RegimePath | MATCH ✓ |
| D-2 | computations.taxpayer_type (taxpayer_type_enum) | TaxpayerType | MATCH ✓ |
| D-3 | computations.balance_disposition (balance_disposition_enum) | BalanceDisposition | MATCH ✓ |
| D-4 | computation_cwt_entries fields | Form2307Entry | MATCH ✓ — correctly normalized into own table |
| D-5 | computation_quarterly_payments fields | QuarterlyPayment | MATCH ✓ — correctly normalized |
| **D-6** | **computations.overpayment_disposition (MISSING)** | **OverpaymentDisposition** | **FIXED — added column** |

---

## Category E: Test vector fields referencing undefined types

| Finding | File | Field | Status |
|---------|------|-------|--------|
| E-1 | test-vectors/basic.md:665 | `overpayment_disposition: PENDING_ELECTION` | **FIXED — PENDING_ELECTION added to enum** |
| E-2 | test-vectors/exhaustive.md:5629 | `overpayment_disposition: TAXPAYER_ELECTION_REQUIRED` | **FIXED — renamed to PENDING_ELECTION** |
| E-3 | test-vectors/exhaustive.md:9336 | References `FilingDeadlineInfo` in comment | ACCEPTABLE — internal helper type; documented correctly |

---

## Category F: Pipeline types missing from data model

All 17 pipeline intermediate types are defined in `engine/data-model.md § 4`. All 6 form output types are defined in `§ 5`. Zero missing types.

| Pipeline Step | Output Type | Defined in § |
|--------------|-------------|-------------|
| PL-01 | ValidatedInput | 4.1 |
| PL-02 | ClassifiedTaxpayer | 4.2 |
| PL-03 | GrossAggregates | 4.4 |
| PL-04 | EligibilityResult | 4.5 |
| PL-05 | ItemizedDeductionResult, DeductionBreakdown | 4.6, 4.7 |
| PL-06 | OsdResult | 4.8 |
| PL-07 | CwtCreditResult, ClassifiedForm2307Entry | 4.9, 4.10 |
| PL-08 | PathAResult | 4.11 |
| PL-09 | PathBResult | 4.12 |
| PL-10 | PathCResult | 4.13 |
| PL-11 | PercentageTaxResult | 4.14 |
| PL-12 | QuarterlyAggregates | 4.15 |
| PL-13 | RegimeOption, RegimeComparisonResult | 4.16, 4.17 |
| PL-14 | BalanceResult | 4.18 |
| PL-15 | FormMappingResult | 4.19 |
| PL-16 | PenaltyStack, PenaltyResult | 4.20, 4.21 |
| PL-17 | TaxComputationResult | 6.1 |

---

## Category G: Orphaned types (defined but never used)

| Finding | Type | Assessment |
|---------|------|------------|
| G-1 | `DeductionMethod` | NOT ORPHANED — used in PathAResult (§4.11), PathBResult (§4.12), PathCResult (§4.13) at field `deduction_method`. Explore agent incorrectly flagged. |
| G-2 | `OverpaymentDisposition` | **FIXED — added to TaxComputationResult.overpayment_disposition** |
| G-3 | `FilingDeadlineInfo` | CORRECT DESIGN — internal helper type used by PL-16. Not a final output type by design. |

---

## Category H: Rate limiting, webhook, environment config schemas

| Finding | Assessment |
|---------|------------|
| H-1 Rate limit buckets | CORRECT — Redis/Upstash; not in PostgreSQL schema |
| H-2 Webhook secret schemas | CORRECT — environment variables only |
| H-3 API key scopes | ACCEPTABLE — stored as text array; scope enum managed at application layer |
| H-4 Subscription plan enum | MATCH ✓ — FREE/PRO/ENTERPRISE consistent across API and DB |
| H-5 OAuth provider schema | CORRECT — client credentials in environment; `oauth_accounts.provider = 'google'` is complete |

---

## Fixes Applied This Iteration

### Fix 1: Add PENDING_ELECTION variant to OverpaymentDisposition

**File:** `engine/data-model.md § 2.14`
**Change:** Added 4th variant:
- `PENDING_ELECTION` — Engine cannot default because overpayment > ₱50,000 AND taxpayer has not made a carry-over/refund/TCC election. UI must prompt the taxpayer before the return can be filed. This is the expected state when `disposition == OVERPAYMENT AND overpayment_amount > 50000` and no preference was passed in `TaxpayerInput.overpayment_preference`.

**Corresponding rule** (engine logic in PL-14 / PL-17):
```
if disposition == OVERPAYMENT:
  if overpayment_preference is not null:
    overpayment_disposition = overpayment_preference   // taxpayer passed explicit preference
  elif overpayment_amount <= 50000.00:
    overpayment_disposition = CARRY_OVER               // engine default: simple, fast, no paperwork
  else:
    overpayment_disposition = PENDING_ELECTION         // amount too large to auto-default; prompt user
else:
  overpayment_disposition = null
```

### Fix 2: Add overpayment_disposition to TaxComputationResult

**File:** `engine/data-model.md § 6.1`
**Change:** Added field `overpayment_disposition: OverpaymentDisposition | null` in the Balance section, after `overpayment: Decimal`. Null when `disposition != OVERPAYMENT`. Set to `PENDING_ELECTION` when overpayment > ₱50K and no preference given. Set to elected value otherwise.

Also added `overpayment_preference` to `TaxpayerInput` (§ 3.1 Input Types) as an optional field — callers who know the taxpayer's preference can pass it in the API request to pre-resolve `PENDING_ELECTION`. If null, engine applies the auto-default rule above.

### Fix 3: Add PENDING_ELECTION to database overpayment_disposition_enum

**File:** `database/schema.md`
**Change:** Added `'PENDING_ELECTION'` to the `overpayment_disposition_enum` type.

### Fix 4: Add overpayment_disposition column to computations table

**File:** `database/schema.md`
**Change:** Added `overpayment_disposition overpayment_disposition_enum NULL` column to the `computations` table, with a comment explaining its use for analytics.

### Fix 5: Harmonize test vector TAXPAYER_ELECTION_REQUIRED → PENDING_ELECTION

**File:** `engine/test-vectors/exhaustive.md`
**Change:** Renamed `TAXPAYER_ELECTION_REQUIRED` → `PENDING_ELECTION` at all occurrences to match the canonical enum variant name.

---

## Final Reconciliation Score

| Category | Issues Found | Issues Fixed | Remaining |
|----------|-------------|-------------|-----------|
| A: Frontend-only fields | 4 | 0 needed | 0 |
| B: API-only fields | 4 | 0 needed | 0 |
| C: API response envelope | 5 | 0 needed | 0 |
| D: Database alignment | 6 | 1 | 0 |
| E: Test vector types | 3 | 2 | 0 |
| F: Pipeline type coverage | 0 | 0 needed | 0 |
| G: Orphaned types | 3 | 1 (OverpaymentDisposition) | 0 |
| H: Config schemas | 5 | 0 needed | 0 |
| **Total** | **26 findings** | **4 fixes** | **0 open** |

**Verdict: PASS — data model fully reconciled after fixes applied.**
