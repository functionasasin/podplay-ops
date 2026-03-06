# Analysis: Batch Computation Rules

**Wave:** 2 — Domain Rule Extraction
**Aspect:** batch-computation-rules
**Date:** 2026-03-06
**Sources:** core-formula-22-5-days.md, eligibility-rules.md, salary-basis-inclusions.md, credited-years-rounding.md

---

## Overview

Batch mode allows HR departments to upload a CSV of employees and receive computed RA 7641 retirement pay for each row. The engine applies the same per-employee computation pipeline to every row, then aggregates results into summary statistics. Batch processing is read-only with respect to saved computations — each batch run produces a result set that can be exported or saved as a batch computation record.

---

## CSV Input Schema

The CSV must have a header row. Column names are case-insensitive with underscores or spaces. Every column except `notes` is required unless marked optional.

### Required Columns

| Column Header | Type | Format | Constraints |
|---|---|---|---|
| `employee_id` | string | Any alphanumeric (max 64 chars) | Must be unique within the file |
| `employee_name` | string | Free text (max 128 chars) | Required for display; not used in computation |
| `birth_date` | date | YYYY-MM-DD | Must be valid calendar date; age ≥ 18 at hire_date |
| `hire_date` | date | YYYY-MM-DD | Must be ≤ retirement_date |
| `retirement_date` | date | YYYY-MM-DD | Must be > hire_date |
| `monthly_salary` | decimal | PHP pesos with up to 2 decimal places | Positive; max 9,999,999.99; converted to centavos by parser |
| `worker_category` | enum | `general` / `underground_mine` / `surface_mine` | Case-insensitive |
| `employer_employee_count` | integer | Positive integer | Minimum 1 |
| `employer_type` | enum | `general` / `retail` / `service` / `agricultural` | Case-insensitive |

### Optional Columns

| Column Header | Type | Default | Description |
|---|---|---|---|
| `salary_divisor` | integer | `26` | Working day divisor; must be `22` or `26` if provided |
| `has_company_plan` | boolean | `false` | `true`/`false`/`1`/`0`/`yes`/`no` (case-insensitive) |
| `company_plan_monthly_benefit` | decimal | null | PHP pesos; company monthly retirement plan benefit for comparison. Required when has_company_plan=true |
| `notes` | string | null | Free text note attached to employee row; included in export, not used in computation |

### CSV Encoding Rules

- Encoding: UTF-8 (with or without BOM; BOM stripped on parse)
- Line endings: LF or CRLF (both accepted)
- Quoting: RFC 4180 double-quote quoting; fields with commas, quotes, or newlines must be quoted
- Empty rows: silently skipped
- Comment rows: rows where first character is `#` are silently skipped
- Maximum rows: 5,000 employees per batch upload (enforced at parse time; rows beyond 5,000 produce an error)
- Maximum file size: 10 MB

### CSV Parse Error Behavior

Parse errors are per-row. Rows with parse errors are added to the `row_errors` list with the row number, column name, raw value, and error message. The remaining valid rows are still computed. A batch with 0 valid rows returns a parse-only error at the batch level.

---

## Per-Employee Computation Rules

For each valid CSV row, apply the full single-employee computation pipeline in this exact order:

### Step 1: Date Parsing and Validation
```
birth_date     → NaiveDate (YYYY-MM-DD)
hire_date      → NaiveDate (YYYY-MM-DD)
retirement_date → NaiveDate (YYYY-MM-DD)

Validate:
  birth_date < hire_date (must be born before hired)
  hire_date ≤ retirement_date
  retirement_date - birth_date ≥ 18 years (no child labor)
```

If validation fails: mark row as `computation_error`, include error detail, skip to next row.

### Step 2: Salary Conversion
```
monthly_salary_centavos = round(monthly_salary_pesos × 100) as i64

Validate:
  monthly_salary_centavos > 0
  monthly_salary_centavos ≤ 999_999_999  (PHP 9,999,999.99)
```

If validation fails: mark row as `computation_error`.

### Step 3: Eligibility Check (identical to single-employee engine)
```
age_at_retirement = full_years(birth_date → retirement_date)

// Determine minimum age by worker_category
min_optional_age = match worker_category {
    general          => 60,
    underground_mine => 50,
    surface_mine     => 50,
}
compulsory_age = match worker_category {
    general          => 65,
    underground_mine => 60,
    surface_mine     => 60,
}

// Gate 1: Age
if age_at_retirement < min_optional_age:
    eligibility = Ineligible::BelowMinimumRetirementAge

// Gate 2: Service (5-year minimum uses EXACT years, not rounded)
service_months = full_calendar_months(hire_date → retirement_date)
if service_months < 60:
    eligibility = Ineligible::InsufficientService

// Gate 3: Employer size
if employer_employee_count <= 10 AND employer_type in [retail, service, agricultural]:
    eligibility = Ineligible::EmployerExemptSmallEstablishment
    // Still compute the RA 7641 amount for reference; set a warning flag
```

### Step 4: Credited Years (identical to single-employee engine)
```
full_years      = floor_years(hire_date → retirement_date)
remaining_months = calendar_months((hire_date + full_years years) → retirement_date)

credited_years = if remaining_months >= 6 { full_years + 1 } else { full_years }
rounding_applied = remaining_months >= 6
```

### Step 5: Retirement Pay Computation (identical to single-employee engine)
```
// All arithmetic in i64 centavos; no floating point
retirement_pay_centavos = (monthly_salary_centavos * 45 * credited_years) / 52

// Common employer error comparison (15-day formula)
fifteen_day_amount_centavos = (monthly_salary_centavos * 15 * credited_years) / 26

underpayment_centavos = retirement_pay_centavos - fifteen_day_amount_centavos
```

### Step 6: Tax Treatment Flag
```
// Tax exemption requires all 4 conditions
tax_exempt = age_at_retirement >= 50
          AND service_months >= 120  // 10 years
          AND first_time_benefit     // assumed true (no way to verify from CSV alone)
          AND bir_approved_plan       // unknown from CSV; mark as "requires verification"

// For batch mode: output tax_treatment = "potentially_exempt" when first 3 conditions met;
// "not_exempt" when any of first 3 fails; note that BIR-approved plan must be verified separately
```

### Step 7: Company Plan Comparison (if has_company_plan = true)
```
// company_plan_monthly_benefit is the employer's monthly benefit amount (in pesos)
// Convert to annual: company_plan_annual_centavos = company_plan_monthly_benefit_centavos * 12
// Compare: if retirement_pay_centavos > company_plan_annual_centavos:
//   gap_centavos = retirement_pay_centavos - company_plan_annual_centavos (employer owes the gap)
// else:
//   gap_centavos = 0 (company plan meets or exceeds statutory minimum)
```

NOTE: Company plan comparison in batch mode uses a simplified model (monthly benefit × 12). A more sophisticated comparison (present value, lump sum vs. annuity) is available only in single-employee mode.

---

## Row Output Record

Each row in the batch produces a `BatchEmployeeResult` with these fields:

```
employee_id:              string   (from input)
employee_name:            string   (from input)
row_number:               u32      (1-based CSV row number, excluding header)
status:                   enum     "ok" | "ineligible" | "computation_error" | "parse_error"

// Present when status = "ok" or "ineligible" (still computed for reference)
eligibility_status:       string   "eligible_optional" | "eligible_compulsory" | "ineligible_age"
                                 | "ineligible_service" | "ineligible_small_employer"
eligibility_warning:      string?  null | "small_employer_claimed_verify_headcount"
                                 | "cba_may_apply" | "company_transfer_aggregation_required"
age_at_retirement:        u8
service_months:           u32
credited_years:           u32
rounding_applied:         bool
partial_months:           u8       (0–11)
monthly_salary_centavos:  i64
retirement_pay_centavos:  i64      (0 if ineligible and no reference amount)
fifteen_day_amount_centavos: i64   (employer common error amount)
underpayment_centavos:    i64      (retirement_pay - fifteen_day_amount; shows 33% gap)
tax_treatment:            string   "potentially_exempt" | "not_exempt" | "requires_verification"
has_company_plan:         bool
company_plan_gap_centavos: i64?   null if no company plan; 0 if plan meets minimum; positive if gap

// Present when status = "computation_error" or "parse_error"
error_code:               string?  see Error Codes below
error_message:            string?  human-readable description
error_field:              string?  CSV column that caused the error (null for row-level errors)
```

### Error Codes for Row Errors

| Code | Description |
|---|---|
| `invalid_date_format` | Date field not in YYYY-MM-DD format |
| `invalid_date_value` | Date value is not a valid calendar date |
| `date_range_violation` | hire_date ≥ retirement_date, or birth_date ≥ hire_date |
| `age_below_minimum` | Age at hire implies child labor (< 18 years) |
| `invalid_salary` | Salary is zero, negative, or exceeds maximum |
| `invalid_worker_category` | Unrecognized worker_category value |
| `invalid_employer_type` | Unrecognized employer_type value |
| `invalid_salary_divisor` | salary_divisor is not 22 or 26 |
| `duplicate_employee_id` | employee_id appears more than once in file |
| `missing_required_field` | A required column is empty or absent |
| `company_plan_missing_benefit` | has_company_plan=true but company_plan_monthly_benefit is absent |

---

## Aggregation Rules

After computing all valid rows, produce a `BatchSummary` record:

### Counts

```
total_rows:                 u32   (all rows in CSV excluding header and comment rows)
parse_error_rows:           u32   (rows that failed to parse)
computation_error_rows:     u32   (rows that parsed but produced computation errors)
eligible_rows:              u32   (rows with status="ok" and eligibility=eligible_*)
ineligible_rows:            u32   (rows with status="ok" and eligibility=ineligible_*)
```

### Monetary Totals (only across eligible employees — status="ok" and eligible)

```
total_retirement_pay_centavos:        i64   (sum of retirement_pay_centavos for eligible employees)
total_fifteen_day_amount_centavos:    i64   (sum of fifteen_day_amount_centavos for eligible employees)
total_underpayment_centavos:          i64   (total_retirement_pay - total_fifteen_day_amount)
total_company_plan_gap_centavos:      i64   (sum of company_plan_gap_centavos where gap > 0; 0 if no company plan data)
```

### Per-Employee Statistics (eligible employees only)

```
avg_retirement_pay_centavos:      i64   (total / eligible_count; integer division)
median_retirement_pay_centavos:   i64   (sorted by retirement_pay, take middle value or avg of two middle)
min_retirement_pay_centavos:      i64
max_retirement_pay_centavos:      i64
avg_credited_years:               u32   (truncated integer: sum of credited_years / eligible_count)
avg_monthly_salary_centavos:      i64
```

### Tax Treatment Distribution (eligible employees only)

```
potentially_exempt_count:    u32
not_exempt_count:            u32
requires_verification_count: u32
```

### Ineligibility Breakdown

```
ineligible_age_count:            u32
ineligible_service_count:        u32
ineligible_small_employer_count: u32
```

### Company Plan Gap Distribution (only when has_company_plan rows exist)

```
employees_with_company_plan:           u32
employees_meeting_statutory_minimum:   u32   (gap = 0)
employees_below_statutory_minimum:     u32   (gap > 0)
total_company_plan_gap_centavos:       i64
```

---

## Batch Output Structure (full JSON response)

```
{
  "batchId": "uuid-v4",                       // assigned by engine; also used as computation record ID
  "computedAt": "2026-03-06T14:32:00Z",       // ISO 8601 UTC timestamp
  "inputRowCount": 250,                         // rows in CSV (excluding header/comment rows)
  "summary": { ...BatchSummary... },
  "employees": [ ...BatchEmployeeResult... ],  // ALL rows (including errors)
  "rowErrors": [                                // convenience list of error rows only
    {
      "rowNumber": 14,
      "employeeId": "EMP-014",
      "errorCode": "invalid_date_format",
      "errorMessage": "birth_date '1985-13-01' is not a valid date: month 13 does not exist",
      "errorField": "birth_date"
    }
  ]
}
```

---

## Processing Order Guarantees

1. Rows are processed in CSV order (row 1 first).
2. Output `employees` array preserves CSV row order.
3. Aggregation is computed after all per-row computations complete.
4. Duplicate `employee_id` values: the **first** occurrence is processed; subsequent occurrences produce `duplicate_employee_id` parse errors.
5. Batch processing is synchronous within the WASM engine (no async). Large batches (5,000 rows) complete in < 2 seconds on modern hardware.

---

## WASM Batch Entry Point

```rust
// Exported WASM function
#[wasm_bindgen]
pub fn compute_batch_json(input_json: &str) -> String {
    // input_json: JSON string containing CSV content
    // Returns: JSON string of BatchOutput (or error JSON)
}
```

Input JSON to `compute_batch_json`:
```json
{
  "csvContent": "employee_id,employee_name,birth_date,...\nEMP001,Juan dela Cruz,..."
}
```

Note: The CSV is passed as a string field in JSON (not as raw CSV). This keeps the bridge contract uniform (always JSON in, JSON out). The frontend sends the CSV file content as a string after reading via FileReader API.

---

## Frontend Batch Upload Flow

1. User selects or drops a CSV file (`.csv` extension required; MIME type `text/csv` or `application/csv` accepted)
2. Frontend reads file as UTF-8 string via `FileReader.readAsText(file, 'UTF-8')`
3. Frontend shows file metadata: file name, size, row count estimate (newline count - 1)
4. User clicks "Compute Batch" button
5. Frontend calls `compute_batch_json(JSON.stringify({ csvContent: fileContent }))`
6. Progress indicator shows during computation (indeterminate spinner; no row-by-row progress since WASM is synchronous)
7. Results display in a table with:
   - Summary card at top (totals, counts)
   - Per-employee results table (paginated at 100 rows per page)
   - Error rows highlighted in red with tooltip showing error details
   - Eligible employees shown in green; ineligible in yellow
8. User can filter results: All / Eligible Only / Ineligible Only / Errors Only
9. User can sort results by any column (client-side sort on the results array)

---

## Export Options After Batch Computation

| Export | Format | Content |
|---|---|---|
| Full results CSV | .csv | All rows, all output fields; one row per employee |
| Eligible only CSV | .csv | Rows where status="ok" and eligible |
| Error rows CSV | .csv | Rows where status="parse_error" or "computation_error" |
| Summary PDF | .pdf | BatchSummary + aggregate statistics + compliance note |
| NLRC multi-employee worksheet | .pdf | Per-eligible-employee computation sheet (all on one PDF) |

---

## CSV Output Schema (Full Results Export)

The exported CSV has these columns in this order:

```
row_number, employee_id, employee_name, status, eligibility_status,
age_at_retirement, service_months, credited_years, rounding_applied,
monthly_salary_php, retirement_pay_php, fifteen_day_amount_php,
underpayment_php, tax_treatment, has_company_plan, company_plan_gap_php,
error_code, error_message, notes
```

Money values in the export CSV are formatted as PHP pesos with 2 decimal places (e.g., `363461.49`), not centavos. This makes the file directly usable in spreadsheet tools.

---

## Batch Computation Error Handling (Batch-Level)

These errors abort the entire batch (return a top-level error JSON, no employee results):

| Condition | Error Code | Message |
|---|---|---|
| File exceeds 5,000 data rows | `batch_too_large` | "Batch file contains {N} data rows. Maximum is 5,000 rows per batch." |
| File has no data rows (header only) | `batch_empty` | "CSV file contains no data rows." |
| Missing required header columns | `missing_columns` | "Required columns missing: {column_list}" |
| File is not valid UTF-8 | `invalid_encoding` | "File must be UTF-8 encoded." |
| File parse completely fails (binary file, etc.) | `not_csv` | "File does not appear to be a valid CSV file." |

---

## Test Vectors for Batch Processing

### Vector B1: Mixed-eligibility batch (3 employees)

**Input CSV:**
```csv
employee_id,employee_name,birth_date,hire_date,retirement_date,monthly_salary,worker_category,employer_employee_count,employer_type
EMP001,Juan dela Cruz,1964-03-15,1994-01-01,2024-03-15,20000.00,general,50,general
EMP002,Maria Santos,1980-06-01,2019-07-01,2024-06-01,35000.00,general,50,general
EMP003,Pedro Garcia,1959-09-20,1994-06-01,2024-09-20,28000.00,general,50,general
```

**Expected results:**

EMP001 (Juan, age 60, service 30 years 2 months → 30 credited years):
- eligible_optional; retirement_pay = 2_000_000 × 45 × 30 / 52 = 51_923_076 centavos = PHP 519,230.76
- fifteen_day = 2_000_000 × 15 × 30 / 26 = 34_615_384 centavos = PHP 346,153.84
- underpayment = 17_307_692 centavos = PHP 173,076.92

EMP002 (Maria, age 44, service 4 years 11 months):
- ineligible_age (age 44 < 60); service also < 5 years (59 months < 60); primary reason: age

EMP003 (Pedro, age 65, service 30 years 3 months → 30 credited years; 3 < 6, no round-up):
- eligible_compulsory; monthly = 2_800_000 centavos
- retirement_pay = 2_800_000 × 45 × 30 / 52 = 72_692_307 centavos = PHP 726,923.07

**Summary:**
- eligible_rows: 2 (EMP001, EMP003)
- ineligible_rows: 1 (EMP002 — age)
- total_retirement_pay_centavos: 51_923_076 + 72_692_307 = 124_615_383 = PHP 1,246,153.83
- total_underpayment_centavos: 17_307_692 + (72_692_307 - 64_615_384) = 17_307_692 + 8_076_923 = 25_384_615 centavos

### Vector B2: Parse error row

**Input CSV row:** `EMP004,Ana Reyes,1964-13-01,1994-01-01,2024-03-15,20000.00,general,50,general`
- birth_date `1964-13-01` → month 13 is invalid
- Expected: status="parse_error", error_code="invalid_date_value", error_field="birth_date"

### Vector B3: Duplicate employee_id

**Input:** Two rows both with employee_id="EMP005"
- First row: processed normally
- Second row: status="parse_error", error_code="duplicate_employee_id"

### Vector B4: Small employer exemption (still computes)

**Input CSV row:** `EMP006,Rosa Mendoza,1959-01-01,1994-01-01,2024-01-01,18000.00,general,8,retail`
- employer_employee_count=8 ≤ 10 AND employer_type=retail
- Expected: status="ok", eligibility_status="ineligible_small_employer"
- retirement_pay_centavos still computed: 1_800_000 × 45 × 30 / 52 = 46_730_769 centavos
- eligibility_warning: "small_employer_claimed_verify_headcount"

---

## Summary

The batch computation engine applies the same RA 7641 formula to every CSV row independently, collecting per-row results with full eligibility and computation detail. Aggregation produces summary statistics useful for HR liability planning: total obligation, total underpayment versus 15-day formula, tax treatment distribution, and company plan gap analysis. The CSV schema uses human-friendly formats (PHP pesos, YYYY-MM-DD dates, English enum names) with the engine converting internally to centavos for computation.
