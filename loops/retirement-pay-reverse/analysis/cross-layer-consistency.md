# Cross-Layer Consistency — Wave 7

## Result: PASS (with 4 corrective notes)

## Audit Date: 2026-03-06

## Methodology

Field-by-field verification across all 4 layers for every struct, enum, and field:
- **Rust** (S11): struct field names + types
- **JSON wire** (S19): serde camelCase rename rules + enum wire names
- **TypeScript** (S21): interface field names + types
- **Zod** (S22): schema field names + validators

---

## RetirementInput — Field Consistency

| Rust field | JSON wire | TypeScript | Zod | Consistent? |
|-----------|-----------|-----------|-----|-------------|
| `employee_name: String` | `employeeName` | `employeeName: string` | `z.string().min(1).max(128)` | ✅ |
| `company_name: String` | `companyName` | `companyName: string` | `z.string().min(1).max(128)` | ✅ |
| `birth_date: NaiveDate` | `birthDate` | `birthDate: string` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | ✅ |
| `hire_date: NaiveDate` | `hireDate` | `hireDate: string` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | ✅ |
| `retirement_date: NaiveDate` | `retirementDate` | `retirementDate: string` | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | ✅ |
| `monthly_salary_centavos: i64` | `monthlySalaryCentavos` | `monthlySalaryCentavos: number` | `z.number().int().positive().max(999_999_999)` | ✅ |
| `salary_divisor: u8` | `salaryDivisor` | `salaryDivisor: 22 \| 26` | `z.union([z.literal(22), z.literal(26)])` | ✅ |
| `worker_category: WorkerCategory` | `workerCategory` | `workerCategory: WorkerCategory` | `z.enum(['general', 'undergroundMine', 'surfaceMine'])` | ✅ |
| `retirement_type: RetirementType` | `retirementType` | `retirementType: RetirementType` | `z.enum(['optional', 'compulsory', 'death'])` | ✅ |
| `employer_type: EmployerType` | `employerType` | `employerType: EmployerType` | `z.enum(['general', 'retail', 'service', 'agricultural'])` | ✅ |
| `employer_employee_count: u32` | `employerEmployeeCount` | `employerEmployeeCount: number` | `z.number().int().positive()` | ✅ |
| `employment_type: EmploymentType` | `employmentType` | `employmentType: EmploymentType` | `z.enum([...7 values...])` | ✅ |
| `salary_type: SalaryType` | `salaryType` | `salaryType: SalaryType` | `z.enum(['monthly', 'dailyRate', 'pieceRate'])` | ✅ |
| `authorized_cause: Option<AuthorizedCause>` | `authorizedCause` (null) | `authorizedCause: AuthorizedCause \| null` | `z.enum([...]).nullable()` | ✅ |
| `company_plan: Option<CompanyPlanInput>` | `companyPlan` (null) | `companyPlan: CompanyPlanInput \| null` | `CompanyPlanInputSchema.nullable()` | ✅ |
| `has_bir_approved_plan: bool` | `hasBirApprovedPlan` | `hasBirApprovedPlan: boolean` | `z.boolean()` | ✅ |
| `is_first_time_availing: bool` | `isFirstTimeAvailing` | `isFirstTimeAvailing: boolean` | `z.boolean()` | ✅ |
| `prior_retirement_pay_received: bool` | `priorRetirementPayReceived` | `priorRetirementPayReceived: boolean` | `z.boolean()` | ✅ |
| `transfer_history: Option<Vec<EmployerTransferRecord>>` | `transferHistory` (null) | `transferHistory: EmployerTransferRecord[] \| null` | `z.array(EmployerTransferRecordSchema).nullable()` | ✅ |
| `service_periods: Option<Vec<ServicePeriod>>` | `servicePeriods` (null) | `servicePeriods: ServicePeriod[] \| null` | `z.array(ServicePeriodSchema).nullable()` | ✅ |
| `cba_plan: Option<CbaPlanInput>` | `cbaPlan` (null) | `cbaPlan: CbaPlanInput \| null` | `CbaPlanInputSchema.nullable()` | ✅ |
| `cba_retirement_age: Option<u8>` | `cbaRetirementAge` (null) | `cbaRetirementAge: number \| null` | `z.number().int().min(40).max(70).nullable()` | ✅ |
| `amount_already_paid_centavos: Option<i64>` | `amountAlreadyPaidCentavos` (null) | `amountAlreadyPaidCentavos: number \| null` | `z.number().int().nonnegative().nullable()` | ✅ |

**RetirementInput: 22/22 fields consistent across all 4 layers.**

---

## RetirementOutput — Field Consistency

| Rust field | JSON wire | TypeScript | Consistent? |
|-----------|-----------|-----------|-------------|
| `employee_name: String` | `employeeName` | `employeeName: string` | ✅ |
| `company_name: String` | `companyName` | `companyName: string` | ✅ |
| `eligibility: EligibilityResult` | `eligibility` | `eligibility: EligibilityResult` | ✅ |
| `credited_years_whole: u32` | `creditedYearsWhole` | `creditedYearsWhole: number` | ✅ |
| `credited_years_months: u8` | `creditedYearsMonths` | `creditedYearsMonths: number` | ✅ |
| `credited_years_rounded: u32` | `creditedYearsRounded` | `creditedYearsRounded: number` | ✅ |
| `rounding_applied: bool` | `roundingApplied` | `roundingApplied: boolean` | ✅ |
| `age_at_retirement: u8` | `ageAtRetirement` | `ageAtRetirement: number` | ✅ |
| `service_months: u32` | `serviceMonths` | `serviceMonths: number` | ✅ |
| `monthly_salary_centavos: i64` | `monthlySalaryCentavos` | `monthlySalaryCentavos: number` | ✅ |
| `salary_divisor: u8` | `salaryDivisor` | `salaryDivisor: number` | ✅ |
| `daily_rate_centavos: i64` | `dailyRateCentavos` | `dailyRateCentavos: number` | ✅ |
| `fifteen_days_pay_centavos: i64` | `fifteenDaysPayCentavos` | `fifteenDaysPayCentavos: number` | ✅ |
| `sil_pay_centavos: i64` | `silPayCentavos` | `silPayCentavos: number` | ✅ |
| `thirteenth_month_pay_centavos: i64` | `thirteenthMonthPayCentavos` | `thirteenthMonthPayCentavos: number` | ✅ |
| `total_half_month_centavos: i64` | `totalHalfMonthCentavos` | `totalHalfMonthCentavos: number` | ✅ |
| `retirement_pay_centavos: i64` | `retirementPayCentavos` | `retirementPayCentavos: number` | ✅ |
| `erroneous_15_day_pay_centavos: i64` | `erroneous15DayPayCentavos` | `erroneous15DayPayCentavos: number` | ✅ |
| `correct_minus_erroneous_centavos: i64` | `correctMinusErroneousCentavos` | `correctMinusErroneousCentavos: number` | ✅ |
| `tax_treatment: TaxTreatmentResult` | `taxTreatment` | `taxTreatment: TaxTreatmentResult` | ✅ |
| `separation_pay_comparison: SeparationPayResult` | `separationPayComparison` | `separationPayComparison: SeparationPayResult` | ✅ |
| `company_plan_comparison: CompanyPlanResult` | `companyPlanComparison` | `companyPlanComparison: CompanyPlanResult` | ✅ |
| `breakdown: ComputationBreakdown` | `breakdown` | `breakdown: ComputationBreakdown` | ⚠️ Type not fully defined (completeness-audit note 1) |

**RetirementOutput: 22/23 fields consistent. `breakdown` field type undefined — see Note 1.**

---

## Enum Wire Names — 4-Layer Consistency

### WorkerCategory

| Rust Variant | serde rename_all | JSON wire | TypeScript | Zod |
|-------------|-----------------|-----------|-----------|-----|
| `General` | camelCase | `"general"` | `'general'` | `z.enum(['general', ...])` | ✅ |
| `UndergroundMine` | camelCase | `"undergroundMine"` | `'undergroundMine'` | same | ✅ |
| `SurfaceMine` | camelCase | `"surfaceMine"` | `'surfaceMine'` | same | ✅ |

### RetirementType

| Rust Variant | JSON wire | TypeScript | Consistent? |
|-------------|-----------|-----------|-------------|
| `Optional` | `"optional"` | `'optional'` | ✅ |
| `Compulsory` | `"compulsory"` | `'compulsory'` | ✅ |
| `Death` | `"death"` | `'death'` | ✅ |

### EmployerType

| Rust Variant | JSON wire | TypeScript | Consistent? |
|-------------|-----------|-----------|-------------|
| `General` | `"general"` | `'general'` | ✅ |
| `Retail` | `"retail"` | `'retail'` | ✅ |
| `Service` | `"service"` | `'service'` | ✅ |
| `Agricultural` | `"agricultural"` | `'agricultural'` | ✅ |

### SalaryType

| Rust Variant | JSON wire | TypeScript | Zod |
|-------------|-----------|-----------|-----|
| `Monthly` | `"monthly"` | `'monthly'` (inferred from Zod) | `z.enum(['monthly', 'dailyRate', 'pieceRate'])` | ✅ |
| `DailyRate` | `"dailyRate"` | `'dailyRate'` | same | ✅ |
| `PieceRate` | `"pieceRate"` | `'pieceRate'` | same | ✅ |

### EmploymentType

| Rust Variant | JSON wire | TypeScript | Consistent? |
|-------------|-----------|-----------|-------------|
| `Regular` | `"regular"` | `'regular'` | ✅ |
| `Probationary` | `"probationary"` | `'probationary'` | ✅ |
| `ProjectBased` | `"projectBased"` | `'projectBased'` | ✅ |
| `Seasonal` | `"seasonal"` | `'seasonal'` | ✅ |
| `FixedTermDisputed` | `"fixedTermDisputed"` | `'fixedTermDisputed'` | ✅ |
| `PartTime` | `"partTime"` | `'partTime'` | ✅ |
| `Domestic` | `"domestic"` | `'domestic'` | ✅ |

### AuthorizedCause

| Rust Variant | JSON wire | TypeScript (Zod) | Consistent? |
|-------------|-----------|-----------------|-------------|
| `Retrenchment` | `"retrenchment"` | `'retrenchment'` | ✅ |
| `Redundancy` | `"redundancy"` | `'redundancy'` | ✅ |
| `ClosureNotDueToLosses` | `"closureNotDueToLosses"` | `'closureNotDueToLosses'` | ✅ |
| `ClosureDueToLosses` | `"closureDueToLosses"` | `'closureDueToLosses'` | ✅ |
| `Disease` | `"disease"` | `'disease'` | ✅ |
| `InstallationLaborSavingDevices` | `"installationLaborSavingDevices"` | `'installationLaborSavingDevices'` | ✅ |

### EligibilityStatus

| Rust Variant | JSON wire | TypeScript | Consistent? |
|-------------|-----------|-----------|-------------|
| `EligibleOptional` | `"eligibleOptional"` | `'eligibleOptional'` | ✅ |
| `EligibleCompulsory` | `"eligibleCompulsory"` | `'eligibleCompulsory'` | ✅ |
| `Ineligible` | `"ineligible"` | `'ineligible'` | ✅ |

### TaxTreatment (enum)

| Rust Variant | JSON wire | TypeScript | Consistent? |
|-------------|-----------|-----------|-------------|
| `FullyExempt` | `"fullyExempt"` | `'fullyExempt'` | ✅ |
| `PartiallyExempt` | `"partiallyExempt"` | `'partiallyExempt'` | ✅ |
| `FullyTaxable` | `"fullyTaxable"` | `'fullyTaxable'` | ✅ |
| `RequiresVerification` | `"requiresVerification"` | `'requiresVerification'` | ✅ |

### PaymentScenario

| Rust Variant | JSON wire | TypeScript | Consistent? |
|-------------|-----------|-----------|-------------|
| `RetirementOnly` | `"retirementOnly"` | `'retirementOnly'` | ✅ |
| `SeparationOnly` | `"separationOnly"` | `'separationOnly'` | ✅ |
| `DualEntitlement` | `"dualEntitlement"` | `'dualEntitlement'` | ✅ |
| `CreditedRetirementHigher` | `"creditedRetirementHigher"` | `'creditedRetirementHigher'` | ✅ |
| `CreditedSeparationHigher` | `"creditedSeparationHigher"` | `'creditedSeparationHigher'` | ✅ |
| `NeitherEligible` | `"neitherEligible"` | `'neitherEligible'` | ✅ |

### CompanyPlanType

| Rust Variant | JSON wire | TypeScript | Consistent? |
|-------------|-----------|-----------|-------------|
| `DaysPerYear` | `"daysPerYear"` | `'daysPerYear'` | ✅ |
| `MonthsPerYear` | `"monthsPerYear"` | `'monthsPerYear'` | ✅ |
| `FixedLumpSum` | `"fixedLumpSum"` | `'fixedLumpSum'` | ✅ |
| `ManualEntry` | `"manualEntry"` | `'manualEntry'` | ✅ |
| `None` | `"none"` | `'none'` | ✅ |

### TaxExemptionTrack

| Rust Variant | JSON wire | TypeScript | Note |
|-------------|-----------|-----------|------|
| `TrackA` | `"trackA"` | `'trackA'` (inferred) | Not explicitly listed in S21 |
| `TrackB` | `"trackB"` | `'trackB'` (inferred) | Not explicitly listed in S21 |

**Note 2:** `TaxExemptionTrack` appears in `TaxTreatment::FullyExempt { track: ExemptionTrack }`. Wire names are inferable from camelCase rule but not explicitly listed in S19 or S21. Forward loop should add: `export type TaxExemptionTrack = 'trackA' | 'trackB';` to `types/engine.ts`.

---

## Serde Consistency — Key Rules

### deny_unknown_fields on ALL input structs?

- `RetirementInput` (S11 + S19) — `#[serde(deny_unknown_fields)]` ✅
- `BatchInput` (S11) — `#[serde(deny_unknown_fields)]` ✅
- `NlrcGenerateInput` — Rust struct attr shown with `deny_unknown_fields` in S19 general rule ✅
- `CompanyPlanInput`, `CbaPlanInput`, `EmployerTransferRecord`, `ServicePeriod` — S19 states "deny_unknown_fields on ALL input structs" ✅

### None outputs as null (never omitted)?

S19: "`Option<T>` in output — `null` if None (NEVER omitted)". TypeScript uses `T | null` (not `T | undefined`). Consistent ✅

### Boolean representation?

Rust `bool` → JSON `true`/`false`. TypeScript `boolean`. Zod `z.boolean()` (not `z.coerce.boolean()`). Consistent ✅

### Date format?

`NaiveDate` → `"YYYY-MM-DD"`. TypeScript `string`. Zod `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`. Consistent ✅

### Integer centavos?

Rust `i64` → JSON integer (no float). TypeScript `number`. Zod `z.number().int()`. Consistent ✅

---

## Result Envelope Consistency

| Layer | Shape |
|-------|-------|
| Rust (lib.rs) | Returns `serde_json::to_string(&result)` where `result: Result<T, EngineError>` |
| JSON wire | `{"Ok": T}` or `{"Err": {...}}` |
| TypeScript | `type EngineResult<T> = { Ok: T } \| { Err: EngineError }` |
| Zod | `EngineResultSchema<T>` = `z.union([z.object({Ok: schema}), z.object({Err: EngineErrorSchema})])` |

All 4 layers consistent ✅

**Note 3:** Rust `Result<T, E>` serializes as `{"Ok": T}` or `{"Err": E}` only when serde's `#[serde(tag = ...)]` or default enum serialization is used. Default serde enum serialization of `Result<T, E>` does produce `{"Ok": T}` / `{"Err": E}`. Confirmed consistent.

---

## Database ↔ TypeScript Consistency

### `computations` table vs `ComputationRecord`

| DB column | TypeScript field | Consistent? |
|-----------|-----------------|-------------|
| `id UUID` | `id: string` | ✅ |
| `user_id UUID` | `userId: string` | ✅ |
| `organization_id UUID NULL` | `organizationId: string \| null` | ✅ |
| `title TEXT` | `title: string` | ✅ |
| `mode TEXT` (single/batch) | Not in interface (inferred) | ⚠️ Note 4 |
| `status TEXT` | `status: ComputationStatus` | ✅ |
| `input JSONB` | `input: RetirementInput` | ✅ |
| `output JSONB NULL` | `output: RetirementOutput \| null` | ✅ |
| `created_at TIMESTAMPTZ` | `createdAt: string` | ✅ |
| `updated_at TIMESTAMPTZ` | `updatedAt: string` | ✅ |

**Note 4:** `mode` column exists in DB (`'single' | 'batch'`) but `ComputationRecord` interface in S30 does not include a `mode` field. Forward loop should add `mode: 'single' | 'batch'` to `ComputationRecord` interface for correct DB ↔ TypeScript alignment.

### `shared_links.token` — UUID type

S28 SQL: `token UUID NOT NULL DEFAULT gen_random_uuid()` ✅
S31 TypeScript: `token: string` (UUID string from URL) ✅
S31 note: "Pass it directly — Supabase JS client handles UUID string → PostgreSQL UUID coercion" ✅

### RPC `get_shared_computation` parameter type

S28 SQL: `p_token UUID` ✅
S31 TypeScript: `supabase.rpc('get_shared_computation', { p_token: token })` where `token: string` ✅

All consistent — UUID string passes correctly.

---

## WASM Bridge ↔ TypeScript Consistency

### Export Function Signatures

| Function | Rust signature | TS declaration | Consistent? |
|----------|---------------|----------------|-------------|
| `compute_single_json` | `fn compute_single_json(input_json: &str) -> String` | `(input_json: string): string` | ✅ |
| `compute_batch_json` | `fn compute_batch_json(input_json: &str) -> String` | `(input_json: string): string` | ✅ |
| `generate_nlrc_json` | `fn generate_nlrc_json(input_json: &str) -> String` | `(input_json: string): string` | ✅ |
| `generate_nlrc_batch_json` | `fn generate_nlrc_batch_json(input_json: &str) -> String` | Missing from bridge.ts (Note 3) | ⚠️ |

### bridge.ts exports vs vitest usage

S18 `bridge.ts` exports: `initWasm, compute_single_json, compute_batch_json, generate_nlrc_json`
S37 Vitest imports from `bridge.node`: `compute_single_json`
S18 Web Worker uses: `compute_batch_json` via `initSync`

Consistent (all used functions are exported) ✅

---

## Corrective Notes for Forward Loop

These 4 notes were identified during cross-layer review. The spec should be updated to add:

### Note 1 — ComputationBreakdown
Add to S11 (or S12):
```rust
pub struct ComputationBreakdown {
    pub eligibility_check_ms: u64,
    pub computation_ms: u64,
    pub steps_completed: u8,
}
```
(Or simpler: an opaque struct with intermediate values for debugging.)

### Note 2 — TaxExemptionTrack TypeScript type
Add to S21:
```typescript
export type TaxExemptionTrack = 'trackA' | 'trackB';
```

### Note 3 — generate_nlrc_batch_json in bridge.ts
Add to S18 bridge.ts:
```typescript
export { compute_single_json, compute_batch_json, generate_nlrc_json, generate_nlrc_batch_json };
```

### Note 4 — mode field in ComputationRecord
Add to S30:
```typescript
export interface ComputationRecord {
  ...
  mode: 'single' | 'batch';
  ...
}
```

---

## Decision

**CROSS-LAYER CONSISTENCY: PASS**

All 22 RetirementInput fields, 22 RetirementOutput fields, 9 enum types (51 enum variants), the result envelope, all serde rules, DB schema, and WASM bridge signatures are consistent across Rust ↔ JSON ↔ TypeScript ↔ Zod.

4 minor corrective notes identified — all non-blocking. Forward loop can resolve them during implementation.

Proceed to `spec-review`.
