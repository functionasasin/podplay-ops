# Analysis: Batch Engine — CSV Parse, Per-Employee Computation, Aggregation

**Wave:** 3 — Engine Design
**Aspect:** batch-engine
**Date:** 2026-03-06
**Sources:** batch-computation-rules.md, data-model.md, computation-pipeline.md, algorithms.md

---

## Overview

The batch engine extends the single-employee pipeline to process up to 5,000 employees from a
CSV payload. It is exposed via `compute_batch_json(input_json: &str) -> String` (WASM). The
pipeline is:

```
BatchInput (JSON with csvContent: String)
  │
  ▼
Stage 1: CSV Parse
  │ (per-row parse errors collected; valid rows continue)
  ▼
Stage 2: Per-Employee Compute
  │ (calls compute_single() for each valid row; per-row errors collected)
  ▼
Stage 3: Aggregation
  │
  ▼
BatchOutput (JSON)
```

All stages are synchronous. No async. No global state. The function is pure.

---

## Rust Types

### BatchInput

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BatchInput {
    /// Full CSV file content as a UTF-8 string.
    /// Sent by frontend via FileReader.readAsText(file, 'UTF-8').
    pub csv_content: String,
}
```

### BatchRowInput (internal — not exposed on wire)

Parsed from one CSV row. Maps to fields of `RetirementInput` with batch-only extras.

```rust
/// Internal parsed row before compute_single() is called.
#[derive(Debug, Clone)]
pub struct BatchRowInput {
    pub row_number: u32,             // 1-based row number (excluding header)
    pub employee_id: String,         // from CSV column employee_id
    pub employee_name: String,       // from CSV column employee_name
    pub notes: Option<String>,       // from CSV column notes (optional)

    // Maps directly to RetirementInput fields:
    pub birth_date: NaiveDate,
    pub hire_date: NaiveDate,
    pub retirement_date: NaiveDate,
    pub monthly_basic_salary_centavos: i64,   // converted from monthly_salary CSV column
    pub salary_divisor: u8,                   // default 26 if absent
    pub worker_category: WorkerCategory,
    pub employer_type: EmployerType,
    pub employer_employee_count: u32,

    // Batch-simplified company plan (optional)
    pub has_company_plan: bool,
    pub company_plan_monthly_benefit_centavos: Option<i64>, // batch uses monthly benefit only
}

impl From<BatchRowInput> for RetirementInput {
    fn from(row: BatchRowInput) -> Self {
        RetirementInput {
            birth_date: row.birth_date,
            hire_date: row.hire_date,
            retirement_date: row.retirement_date,
            monthly_basic_salary_centavos: row.monthly_basic_salary_centavos,
            salary_divisor: row.salary_divisor,
            worker_category: row.worker_category,
            employer_type: row.employer_type,
            employer_employee_count: row.employer_employee_count,
            cba_retirement_age: None,               // not available in CSV batch
            has_company_plan: row.has_company_plan,
            // Batch uses ManualEntry for company plan: pre-computed annual benefit
            company_plan_type: if row.has_company_plan {
                Some(CompanyPlanType::ManualEntry)
            } else {
                None
            },
            company_days_per_year: None,
            company_months_per_year: None,
            company_fixed_amount_centavos: None,
            // Annual benefit = monthly_benefit × 12
            company_plan_benefit_centavos: row.company_plan_monthly_benefit_centavos
                .map(|m| m * 12),
            has_pagibig_offset: false,              // not available in CSV batch
            pagibig_employer_contributions_centavos: 0,
            authorized_cause: None,                 // not available in CSV batch
            has_crediting_clause: false,
            employer_has_bir_approved_plan: false,  // assumed false for batch (flagged in output)
            employee_has_used_retirement_exemption: false, // assumed false
            reemployed_within_12_months: false,     // not known from CSV
        }
    }
}
```

### BatchRowResult (per-employee output)

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchRowResult {
    pub row_number: u32,
    pub employee_id: String,
    pub employee_name: String,
    pub notes: Option<String>,
    pub status: BatchRowStatus,

    // Populated when status = Ok or Ineligible (computed for reference)
    pub eligibility_status: Option<BatchEligibilityStatus>,
    pub eligibility_warning: Option<String>,
    pub age_at_retirement: Option<u8>,
    pub service_months: Option<u32>,
    pub credited_years: Option<u32>,
    pub rounding_applied: Option<bool>,
    pub partial_months: Option<u8>,        // remaining_months from CreditedYearsResult (0–11)
    pub monthly_salary_centavos: Option<i64>,
    pub retirement_pay_centavos: Option<i64>,
    pub fifteen_day_amount_centavos: Option<i64>,
    pub underpayment_centavos: Option<i64>,
    pub tax_treatment: Option<BatchTaxTreatment>,
    pub has_company_plan: Option<bool>,
    pub company_plan_gap_centavos: Option<i64>,   // null if no plan; 0 if plan ok; >0 if gap

    // Populated when status = ParseError or ComputationError
    pub error_code: Option<String>,
    pub error_message: Option<String>,
    pub error_field: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum BatchRowStatus {
    Ok,
    Ineligible,
    ComputationError,
    ParseError,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum BatchEligibilityStatus {
    EligibleOptional,
    EligibleCompulsory,
    IneligibleAge,
    IneligibleService,
    IneligibleSmallEmployer,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum BatchTaxTreatment {
    PotentiallyExempt,   // age ≥ 50, service ≥ 10y; BIR plan unknown
    NotExempt,           // fails age or service condition
    RequiresVerification, // age/service pass but BIR plan must be verified with employer
}
```

### BatchSummary

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchSummary {
    // Row counts
    pub total_rows: u32,
    pub parse_error_rows: u32,
    pub computation_error_rows: u32,
    pub eligible_rows: u32,
    pub ineligible_rows: u32,

    // Monetary totals (eligible employees only)
    pub total_retirement_pay_centavos: i64,
    pub total_fifteen_day_amount_centavos: i64,
    pub total_underpayment_centavos: i64,
    pub total_company_plan_gap_centavos: i64,

    // Per-employee statistics (eligible employees only; 0 when eligible_rows = 0)
    pub avg_retirement_pay_centavos: i64,
    pub median_retirement_pay_centavos: i64,
    pub min_retirement_pay_centavos: i64,
    pub max_retirement_pay_centavos: i64,
    pub avg_credited_years: u32,
    pub avg_monthly_salary_centavos: i64,

    // Tax treatment distribution (eligible employees only)
    pub potentially_exempt_count: u32,
    pub not_exempt_count: u32,
    pub requires_verification_count: u32,

    // Ineligibility breakdown
    pub ineligible_age_count: u32,
    pub ineligible_service_count: u32,
    pub ineligible_small_employer_count: u32,

    // Company plan gap (only rows with has_company_plan = true)
    pub employees_with_company_plan: u32,
    pub employees_meeting_statutory_minimum: u32,
    pub employees_below_statutory_minimum: u32,
}
```

### BatchOutput

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchOutput {
    pub batch_id: String,          // UUID v4, assigned by engine (uuid crate)
    pub computed_at: String,       // ISO 8601 UTC, e.g., "2026-03-06T14:32:00Z" (chrono)
    pub input_row_count: u32,      // rows in CSV excluding header and comment rows
    pub summary: BatchSummary,
    pub employees: Vec<BatchRowResult>,   // ALL rows (ok + ineligible + errors), CSV order
    pub row_errors: Vec<BatchRowError>,   // convenience list: only error rows
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchRowError {
    pub row_number: u32,
    pub employee_id: String,
    pub error_code: String,
    pub error_message: String,
    pub error_field: Option<String>,
}
```

### Batch-Level Error (returned instead of BatchOutput when entire batch fails)

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchLevelError {
    pub error: String,
    pub code: BatchLevelErrorCode,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum BatchLevelErrorCode {
    BatchTooLarge,    // > 5,000 data rows
    BatchEmpty,       // 0 data rows
    MissingColumns,   // required header columns absent
    InvalidEncoding,  // non-UTF-8 input (caught at JSON parse)
    NotCsv,          // CSV parse completely fails
    ParseError,       // JSON input malformed (outer wrapper)
}
```

---

## Stage 1: CSV Parse Pipeline

### Entry Point

```rust
pub fn parse_csv(csv_content: &str) -> Result<Vec<BatchRowInput>, BatchLevelError> {
    // Step 1a: Normalize line endings (CRLF → LF)
    let normalized = csv_content.replace("\r\n", "\n").replace('\r', '\n');

    // Step 1b: Split into lines; strip BOM if present
    let content = normalized.trim_start_matches('\u{FEFF}');

    // Step 1c: Split into lines; skip empty lines and comment lines
    let lines: Vec<&str> = content
        .lines()
        .filter(|line| {
            let trimmed = line.trim();
            !trimmed.is_empty() && !trimmed.starts_with('#')
        })
        .collect();

    if lines.is_empty() {
        return Err(BatchLevelError {
            error: "CSV file contains no data rows.".to_string(),
            code: BatchLevelErrorCode::BatchEmpty,
        });
    }

    // Step 1d: Parse header row (case-insensitive, trim whitespace)
    let header_line = lines[0];
    let headers: Vec<String> = parse_csv_row(header_line)
        .iter()
        .map(|h| h.trim().to_lowercase().replace(' ', "_"))
        .collect();

    // Step 1e: Validate required columns
    const REQUIRED_COLUMNS: &[&str] = &[
        "employee_id", "employee_name", "birth_date", "hire_date",
        "retirement_date", "monthly_salary", "worker_category",
        "employer_employee_count", "employer_type",
    ];

    let missing: Vec<&str> = REQUIRED_COLUMNS
        .iter()
        .filter(|&&col| !headers.contains(&col.to_string()))
        .copied()
        .collect();

    if !missing.is_empty() {
        return Err(BatchLevelError {
            error: format!("Required columns missing: {}", missing.join(", ")),
            code: BatchLevelErrorCode::MissingColumns,
        });
    }

    // Step 1f: Count data rows (excluding header)
    let data_lines = &lines[1..];
    if data_lines.is_empty() {
        return Err(BatchLevelError {
            error: "CSV file contains no data rows.".to_string(),
            code: BatchLevelErrorCode::BatchEmpty,
        });
    }
    if data_lines.len() > 5_000 {
        return Err(BatchLevelError {
            error: format!(
                "Batch file contains {} data rows. Maximum is 5,000 rows per batch.",
                data_lines.len()
            ),
            code: BatchLevelErrorCode::BatchTooLarge,
        });
    }

    // Step 1g: Parse each data row
    // Track seen employee_ids for duplicate detection
    let mut seen_ids: std::collections::HashSet<String> = HashSet::new();
    let mut results: Vec<BatchRowInput> = Vec::with_capacity(data_lines.len());
    let mut row_errors: Vec<BatchRowError> = Vec::new();

    for (idx, line) in data_lines.iter().enumerate() {
        let row_number = (idx + 1) as u32;   // 1-based, excludes header
        let fields = parse_csv_row(line);

        // Map fields to named struct; collect errors per row
        match parse_row_fields(&headers, &fields, row_number, &mut seen_ids) {
            Ok(row_input) => results.push(row_input),
            Err(err) => row_errors.push(err),
        }
    }

    // NOTE: Row errors do NOT abort the batch. Return both valid rows and errors.
    // The caller attaches row_errors to the BatchOutput.
    // Batch-level errors (returned above) are the only abort conditions.
    Ok(results)
    // row_errors attached separately — see compute_batch() below for full flow
}
```

### CSV Row Parser (RFC 4180 double-quote rules)

```rust
/// Parses one CSV line into fields. Handles double-quote quoting per RFC 4180.
/// - Fields containing commas, quotes, or newlines must be enclosed in double-quotes.
/// - A double-quote inside a quoted field is escaped as two double-quotes: "".
fn parse_csv_row(line: &str) -> Vec<String> {
    let mut fields: Vec<String> = Vec::new();
    let mut current = String::new();
    let mut in_quotes = false;
    let mut chars = line.chars().peekable();

    while let Some(ch) = chars.next() {
        match ch {
            '"' if in_quotes => {
                if chars.peek() == Some(&'"') {
                    // Escaped quote inside quoted field
                    current.push('"');
                    chars.next();
                } else {
                    in_quotes = false;
                }
            }
            '"' => {
                in_quotes = true;
            }
            ',' if !in_quotes => {
                fields.push(current.trim().to_string());
                current = String::new();
            }
            other => {
                current.push(other);
            }
        }
    }
    fields.push(current.trim().to_string());
    fields
}
```

### Row Field Parser

```rust
fn parse_row_fields(
    headers: &[String],
    fields: &[String],
    row_number: u32,
    seen_ids: &mut HashSet<String>,
) -> Result<BatchRowInput, BatchRowError> {
    // Helper: get field value by column name (returns "" if column absent)
    let get = |col: &str| -> &str {
        headers.iter().position(|h| h == col)
            .and_then(|idx| fields.get(idx))
            .map(|s| s.as_str())
            .unwrap_or("")
    };

    // Macro for field parse errors
    macro_rules! row_err {
        ($code:expr, $msg:expr, $field:expr) => {
            return Err(BatchRowError {
                row_number,
                employee_id: get("employee_id").to_string(),
                error_code: $code.to_string(),
                error_message: $msg.to_string(),
                error_field: Some($field.to_string()),
            })
        };
    }

    // --- employee_id ---
    let employee_id = get("employee_id");
    if employee_id.is_empty() {
        row_err!("missing_required_field", "employee_id is required.", "employee_id");
    }
    if employee_id.len() > 64 {
        row_err!("invalid_employee_id",
            "employee_id must be at most 64 characters.", "employee_id");
    }
    if !seen_ids.insert(employee_id.to_string()) {
        row_err!("duplicate_employee_id",
            format!("employee_id '{}' appears more than once.", employee_id),
            "employee_id");
    }

    // --- employee_name ---
    let employee_name = get("employee_name");
    if employee_name.is_empty() {
        row_err!("missing_required_field", "employee_name is required.", "employee_name");
    }

    // --- birth_date ---
    let birth_date = parse_date(get("birth_date"))
        .map_err(|e| BatchRowError {
            row_number, employee_id: employee_id.to_string(),
            error_code: e.code, error_message: e.message, error_field: Some("birth_date".into()),
        })?;

    // --- hire_date ---
    let hire_date = parse_date(get("hire_date"))
        .map_err(|e| BatchRowError {
            row_number, employee_id: employee_id.to_string(),
            error_code: e.code, error_message: e.message, error_field: Some("hire_date".into()),
        })?;

    // --- retirement_date ---
    let retirement_date = parse_date(get("retirement_date"))
        .map_err(|e| BatchRowError {
            row_number, employee_id: employee_id.to_string(),
            error_code: e.code, error_message: e.message, error_field: Some("retirement_date".into()),
        })?;

    // --- Date cross-validation ---
    if birth_date >= hire_date {
        row_err!("date_range_violation",
            "birth_date must be before hire_date.", "birth_date");
    }
    if hire_date > retirement_date {
        row_err!("date_range_violation",
            "hire_date must be on or before retirement_date.", "hire_date");
    }
    let age_at_hire = full_years_between(birth_date, hire_date);
    if age_at_hire < 15 {
        row_err!("age_below_minimum",
            format!("Employee would be {} at hire_date; minimum is 15.", age_at_hire),
            "birth_date");
    }

    // --- monthly_salary ---
    let salary_str = get("monthly_salary");
    if salary_str.is_empty() {
        row_err!("missing_required_field", "monthly_salary is required.", "monthly_salary");
    }
    let monthly_salary_pesos: f64 = salary_str.parse().map_err(|_| BatchRowError {
        row_number, employee_id: employee_id.to_string(),
        error_code: "invalid_salary".to_string(),
        error_message: format!("monthly_salary '{}' is not a valid number.", salary_str),
        error_field: Some("monthly_salary".into()),
    })?;
    if monthly_salary_pesos <= 0.0 || monthly_salary_pesos > 9_999_999.99 {
        row_err!("invalid_salary",
            format!("monthly_salary must be > 0 and ≤ 9,999,999.99; got {}.", monthly_salary_pesos),
            "monthly_salary");
    }
    // Convert pesos to centavos: multiply by 100 and round to nearest centavo
    let monthly_basic_salary_centavos: i64 = (monthly_salary_pesos * 100.0).round() as i64;

    // --- salary_divisor (optional, default 26) ---
    let salary_divisor: u8 = {
        let s = get("salary_divisor");
        if s.is_empty() {
            26u8
        } else {
            match s.parse::<u8>() {
                Ok(22) => 22,
                Ok(26) => 26,
                _ => row_err!("invalid_salary_divisor",
                    format!("salary_divisor must be 22 or 26; got '{}'.", s),
                    "salary_divisor"),
            }
        }
    };

    // --- worker_category ---
    let worker_category = parse_worker_category(get("worker_category"))
        .map_err(|_| BatchRowError {
            row_number, employee_id: employee_id.to_string(),
            error_code: "invalid_worker_category".to_string(),
            error_message: format!(
                "worker_category '{}' is not valid. Use: general, underground_mine, surface_mine.",
                get("worker_category")
            ),
            error_field: Some("worker_category".into()),
        })?;

    // --- employer_employee_count ---
    let employer_employee_count: u32 = {
        let s = get("employer_employee_count");
        s.parse::<u32>().map_err(|_| BatchRowError {
            row_number, employee_id: employee_id.to_string(),
            error_code: "missing_required_field".to_string(),
            error_message: format!("employer_employee_count '{}' must be a positive integer.", s),
            error_field: Some("employer_employee_count".into()),
        })?
    };
    if employer_employee_count == 0 {
        row_err!("missing_required_field",
            "employer_employee_count must be at least 1.", "employer_employee_count");
    }

    // --- employer_type ---
    let employer_type = parse_employer_type(get("employer_type"))
        .map_err(|_| BatchRowError {
            row_number, employee_id: employee_id.to_string(),
            error_code: "invalid_employer_type".to_string(),
            error_message: format!(
                "employer_type '{}' is not valid. Use: general, retail, service, agricultural.",
                get("employer_type")
            ),
            error_field: Some("employer_type".into()),
        })?;

    // --- has_company_plan (optional, default false) ---
    let has_company_plan = {
        let s = get("has_company_plan").to_lowercase();
        match s.as_str() {
            "" | "false" | "0" | "no" => false,
            "true" | "1" | "yes" => true,
            _ => row_err!("invalid_boolean",
                format!("has_company_plan '{}' must be true/false/1/0/yes/no.", s),
                "has_company_plan"),
        }
    };

    // --- company_plan_monthly_benefit (required when has_company_plan = true) ---
    let company_plan_monthly_benefit_centavos: Option<i64> = if has_company_plan {
        let s = get("company_plan_monthly_benefit");
        if s.is_empty() {
            row_err!("company_plan_missing_benefit",
                "company_plan_monthly_benefit is required when has_company_plan=true.",
                "company_plan_monthly_benefit");
        }
        let pesos: f64 = s.parse().map_err(|_| BatchRowError {
            row_number, employee_id: employee_id.to_string(),
            error_code: "invalid_company_plan_benefit".to_string(),
            error_message: format!("company_plan_monthly_benefit '{}' is not a valid number.", s),
            error_field: Some("company_plan_monthly_benefit".into()),
        })?;
        Some((pesos * 100.0).round() as i64)
    } else {
        None
    };

    // --- notes (optional) ---
    let notes_str = get("notes");
    let notes = if notes_str.is_empty() { None } else { Some(notes_str.to_string()) };

    Ok(BatchRowInput {
        row_number,
        employee_id: employee_id.to_string(),
        employee_name: employee_name.to_string(),
        notes,
        birth_date,
        hire_date,
        retirement_date,
        monthly_basic_salary_centavos,
        salary_divisor,
        worker_category,
        employer_type,
        employer_employee_count,
        has_company_plan,
        company_plan_monthly_benefit_centavos,
    })
}

/// Parse a date string in YYYY-MM-DD format.
fn parse_date(s: &str) -> Result<NaiveDate, BatchFieldError> {
    if s.is_empty() {
        return Err(BatchFieldError {
            code: "missing_required_field".into(),
            message: "Date field is required.".into(),
        });
    }
    NaiveDate::parse_from_str(s, "%Y-%m-%d").map_err(|_| BatchFieldError {
        code: "invalid_date_format".into(),
        message: format!("'{}' is not a valid date in YYYY-MM-DD format.", s),
    })
}

fn parse_worker_category(s: &str) -> Result<WorkerCategory, ()> {
    match s.to_lowercase().as_str() {
        "general" => Ok(WorkerCategory::General),
        "underground_mine" => Ok(WorkerCategory::UndergroundMine),
        "surface_mine" => Ok(WorkerCategory::SurfaceMine),
        _ => Err(()),
    }
}

fn parse_employer_type(s: &str) -> Result<EmployerType, ()> {
    match s.to_lowercase().as_str() {
        "general" => Ok(EmployerType::General),
        "retail" => Ok(EmployerType::Retail),
        "service" => Ok(EmployerType::Service),
        "agricultural" => Ok(EmployerType::Agricultural),
        _ => Err(()),
    }
}

struct BatchFieldError { code: String, message: String }
```

---

## Stage 2: Per-Employee Computation

```rust
fn compute_batch_rows(
    rows: Vec<BatchRowInput>,
) -> Vec<BatchRowResult> {
    rows.into_iter().map(|row| {
        let row_number = row.row_number;
        let employee_id = row.employee_id.clone();
        let employee_name = row.employee_name.clone();
        let notes = row.notes.clone();
        let has_company_plan = row.has_company_plan;
        let monthly_salary_centavos = row.monthly_basic_salary_centavos;

        // Convert BatchRowInput → RetirementInput and run single-employee pipeline
        let retirement_input: RetirementInput = row.into();
        match compute_single(retirement_input) {
            Ok(output) => map_output_to_batch_row(
                row_number, employee_id, employee_name, notes,
                has_company_plan, monthly_salary_centavos, output
            ),
            Err(err) => BatchRowResult {
                row_number,
                employee_id,
                employee_name,
                notes,
                status: BatchRowStatus::ComputationError,
                // All compute fields None
                eligibility_status: None,
                eligibility_warning: None,
                age_at_retirement: None,
                service_months: None,
                credited_years: None,
                rounding_applied: None,
                partial_months: None,
                monthly_salary_centavos: Some(monthly_salary_centavos),
                retirement_pay_centavos: None,
                fifteen_day_amount_centavos: None,
                underpayment_centavos: None,
                tax_treatment: None,
                has_company_plan: Some(has_company_plan),
                company_plan_gap_centavos: None,
                error_code: Some(err.code),
                error_message: Some(err.message),
                error_field: err.field,
            },
        }
    }).collect()
}

fn map_output_to_batch_row(
    row_number: u32,
    employee_id: String,
    employee_name: String,
    notes: Option<String>,
    has_company_plan: bool,
    monthly_salary_centavos: i64,
    output: RetirementOutput,
) -> BatchRowResult {
    // Determine batch status and eligibility status
    let (status, batch_eligibility, eligibility_warning_str) = match &output.eligibility.status {
        EligibilityStatus::Eligible { retirement_type } => {
            let bes = match retirement_type {
                RetirementType::Optional => BatchEligibilityStatus::EligibleOptional,
                RetirementType::Compulsory => BatchEligibilityStatus::EligibleCompulsory,
            };
            (BatchRowStatus::Ok, Some(bes), None)
        }
        EligibilityStatus::EligibleWithWarning { retirement_type, warnings } => {
            let bes = match retirement_type {
                RetirementType::Optional => BatchEligibilityStatus::EligibleOptional,
                RetirementType::Compulsory => BatchEligibilityStatus::EligibleCompulsory,
            };
            let warn = warnings.first().map(|w| match w {
                EligibilityWarning::SmallEstablishmentExemptionClaimed { .. } =>
                    "small_employer_claimed_verify_headcount".to_string(),
            });
            (BatchRowStatus::Ok, Some(bes), warn)
        }
        EligibilityStatus::Ineligible { reasons } => {
            let primary = reasons.first();
            let bes = match primary {
                Some(IneligibleReason::BelowMinimumRetirementAge { .. }) =>
                    BatchEligibilityStatus::IneligibleAge,
                Some(IneligibleReason::InsufficientService { .. }) =>
                    BatchEligibilityStatus::IneligibleService,
                Some(IneligibleReason::EmployerExemptSmallEstablishment { .. }) =>
                    BatchEligibilityStatus::IneligibleSmallEmployer,
                None => BatchEligibilityStatus::IneligibleAge,
            };
            (BatchRowStatus::Ineligible, Some(bes), None)
        }
    };

    // Extract age_at_retirement from eligibility result
    let age_at_retirement = Some(output.eligibility.age_at_retirement);
    let service_months = Some(output.credited_years.total_months_served);

    // Tax treatment → batch enum
    let tax_treatment = Some(map_tax_treatment(&output.tax_treatment, &output.eligibility));

    // Company plan gap
    let company_plan_gap_centavos = if has_company_plan {
        match &output.company_plan {
            CompanyPlanResult::NotApplicable => Some(0i64),
            CompanyPlanResult::Computed { gap_centavos, .. } => Some(*gap_centavos),
        }
    } else {
        None
    };

    BatchRowResult {
        row_number,
        employee_id,
        employee_name,
        notes,
        status,
        eligibility_status: batch_eligibility,
        eligibility_warning: eligibility_warning_str,
        age_at_retirement,
        service_months,
        credited_years: Some(output.credited_years.credited_years),
        rounding_applied: Some(output.credited_years.rounding_applied),
        partial_months: Some(output.credited_years.remaining_months as u8),
        monthly_salary_centavos: Some(monthly_salary_centavos),
        retirement_pay_centavos: Some(output.retirement_pay.retirement_pay_centavos),
        fifteen_day_amount_centavos: Some(output.retirement_pay.employer_error_amount_centavos),
        underpayment_centavos: Some(output.retirement_pay.underpayment_centavos),
        tax_treatment,
        has_company_plan: Some(has_company_plan),
        company_plan_gap_centavos,
        error_code: None,
        error_message: None,
        error_field: None,
    }
}

fn map_tax_treatment(
    tax: &TaxTreatmentResult,
    eligibility: &EligibilityResult,
) -> BatchTaxTreatment {
    if !tax.is_tax_exempt {
        // Check if they could qualify with a BIR plan (age ≥ 50, service ≥ 10y)
        if tax.bir_plan_required_for_exemption {
            BatchTaxTreatment::RequiresVerification
        } else {
            BatchTaxTreatment::NotExempt
        }
    } else {
        // Track A (Labor Code, no BIR plan needed) → PotentiallyExempt
        // Track B (BIR-approved plan confirmed) → PotentiallyExempt
        // In batch we do not verify BIR plan status, so mark RequiresVerification for Track B
        match tax.exemption_track {
            TaxExemptionTrack::LaborCodeMandatory => BatchTaxTreatment::PotentiallyExempt,
            TaxExemptionTrack::BirApprovedPlan => BatchTaxTreatment::RequiresVerification,
            TaxExemptionTrack::None => BatchTaxTreatment::NotExempt,
        }
    }
}
```

---

## Stage 3: Aggregation

```rust
fn aggregate(rows: &[BatchRowResult], parse_error_rows: &[BatchRowError]) -> BatchSummary {
    // Eligible rows = status Ok (includes EligibleWithWarning mapped to Ok)
    let eligible: Vec<&BatchRowResult> = rows.iter()
        .filter(|r| r.status == BatchRowStatus::Ok)
        .collect();
    let ineligible: Vec<&BatchRowResult> = rows.iter()
        .filter(|r| r.status == BatchRowStatus::Ineligible)
        .collect();
    let computation_errors = rows.iter()
        .filter(|r| r.status == BatchRowStatus::ComputationError)
        .count() as u32;

    // Monetary totals (eligible only)
    let total_retirement_pay: i64 = eligible.iter()
        .filter_map(|r| r.retirement_pay_centavos)
        .sum();
    let total_fifteen_day: i64 = eligible.iter()
        .filter_map(|r| r.fifteen_day_amount_centavos)
        .sum();
    let total_underpayment: i64 = total_retirement_pay - total_fifteen_day;

    // Company plan gap (eligible rows with has_company_plan = true AND gap > 0)
    let total_company_gap: i64 = eligible.iter()
        .filter_map(|r| r.company_plan_gap_centavos)
        .filter(|&g| g > 0)
        .sum();

    // Per-employee statistics (eligible only)
    let eligible_count = eligible.len() as i64;
    let (avg_pay, median_pay, min_pay, max_pay) = if eligible_count > 0 {
        let mut pays: Vec<i64> = eligible.iter()
            .filter_map(|r| r.retirement_pay_centavos)
            .collect();
        pays.sort_unstable();
        let avg = total_retirement_pay / eligible_count;
        let median = compute_median(&pays);
        let min = *pays.first().unwrap_or(&0);
        let max = *pays.last().unwrap_or(&0);
        (avg, median, min, max)
    } else {
        (0, 0, 0, 0)
    };

    let avg_credited_years = if eligible_count > 0 {
        let sum_years: u32 = eligible.iter()
            .filter_map(|r| r.credited_years)
            .sum();
        sum_years / eligible_count as u32
    } else {
        0
    };

    let avg_monthly_salary = if eligible_count > 0 {
        let sum_sal: i64 = eligible.iter()
            .filter_map(|r| r.monthly_salary_centavos)
            .sum();
        sum_sal / eligible_count
    } else {
        0
    };

    // Tax treatment distribution (eligible only)
    let potentially_exempt = eligible.iter()
        .filter(|r| r.tax_treatment == Some(BatchTaxTreatment::PotentiallyExempt))
        .count() as u32;
    let not_exempt = eligible.iter()
        .filter(|r| r.tax_treatment == Some(BatchTaxTreatment::NotExempt))
        .count() as u32;
    let requires_verification = eligible.iter()
        .filter(|r| r.tax_treatment == Some(BatchTaxTreatment::RequiresVerification))
        .count() as u32;

    // Ineligibility breakdown
    let ineligible_age = ineligible.iter()
        .filter(|r| r.eligibility_status == Some(BatchEligibilityStatus::IneligibleAge))
        .count() as u32;
    let ineligible_service = ineligible.iter()
        .filter(|r| r.eligibility_status == Some(BatchEligibilityStatus::IneligibleService))
        .count() as u32;
    let ineligible_small = ineligible.iter()
        .filter(|r| r.eligibility_status == Some(BatchEligibilityStatus::IneligibleSmallEmployer))
        .count() as u32;

    // Company plan stats (all rows with has_company_plan = true)
    let with_plan: Vec<&BatchRowResult> = rows.iter()
        .filter(|r| r.has_company_plan == Some(true))
        .collect();
    let plan_ok = with_plan.iter()
        .filter(|r| r.company_plan_gap_centavos == Some(0) || r.company_plan_gap_centavos < Some(0))
        .count() as u32;
    let plan_gap = with_plan.iter()
        .filter(|r| r.company_plan_gap_centavos > Some(0))
        .count() as u32;

    BatchSummary {
        total_rows: rows.len() as u32 + parse_error_rows.len() as u32,
        parse_error_rows: parse_error_rows.len() as u32,
        computation_error_rows: computation_errors,
        eligible_rows: eligible.len() as u32,
        ineligible_rows: ineligible.len() as u32,
        total_retirement_pay_centavos: total_retirement_pay,
        total_fifteen_day_amount_centavos: total_fifteen_day,
        total_underpayment_centavos: total_underpayment,
        total_company_plan_gap_centavos: total_company_gap,
        avg_retirement_pay_centavos: avg_pay,
        median_retirement_pay_centavos: median_pay,
        min_retirement_pay_centavos: min_pay,
        max_retirement_pay_centavos: max_pay,
        avg_credited_years,
        avg_monthly_salary_centavos: avg_monthly_salary,
        potentially_exempt_count: potentially_exempt,
        not_exempt_count: not_exempt,
        requires_verification_count: requires_verification,
        ineligible_age_count: ineligible_age,
        ineligible_service_count: ineligible_service,
        ineligible_small_employer_count: ineligible_small,
        employees_with_company_plan: with_plan.len() as u32,
        employees_meeting_statutory_minimum: plan_ok,
        employees_below_statutory_minimum: plan_gap,
    }
}

/// Median of a sorted slice of i64.
fn compute_median(sorted: &[i64]) -> i64 {
    let n = sorted.len();
    if n == 0 { return 0; }
    if n % 2 == 1 {
        sorted[n / 2]
    } else {
        // Average of two middle values (integer division — truncates)
        (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    }
}
```

---

## Full Batch Entry Point

```rust
/// WASM-exported batch computation function.
/// Input JSON: { "csvContent": "..." }
/// Output JSON: BatchOutput (success) or BatchLevelError (batch-level failure)
#[wasm_bindgen]
pub fn compute_batch_json(input_json: &str) -> String {
    // Parse outer JSON wrapper
    let batch_input: BatchInput = match serde_json::from_str(input_json) {
        Ok(b) => b,
        Err(e) => {
            let err = BatchLevelError {
                error: format!("Invalid JSON input: {}", e),
                code: BatchLevelErrorCode::ParseError,
            };
            return serde_json::to_string(&err).unwrap();
        }
    };

    // Stage 1: CSV Parse
    // We need parse errors AND valid rows; parse_csv_full returns both.
    let (valid_rows, row_errors) = match parse_csv_full(&batch_input.csv_content) {
        Ok(pair) => pair,
        Err(batch_err) => {
            return serde_json::to_string(&batch_err).unwrap();
        }
    };

    let input_row_count = valid_rows.len() as u32 + row_errors.len() as u32;

    // Stage 2: Per-employee computation
    let mut computed_rows = compute_batch_rows(valid_rows);

    // Attach parse errors as BatchRowResult entries (status = ParseError)
    let mut parse_error_results: Vec<BatchRowResult> = row_errors.iter().map(|e| BatchRowResult {
        row_number: e.row_number,
        employee_id: e.employee_id.clone(),
        employee_name: String::new(),
        notes: None,
        status: BatchRowStatus::ParseError,
        eligibility_status: None, eligibility_warning: None, age_at_retirement: None,
        service_months: None, credited_years: None, rounding_applied: None, partial_months: None,
        monthly_salary_centavos: None, retirement_pay_centavos: None,
        fifteen_day_amount_centavos: None, underpayment_centavos: None,
        tax_treatment: None, has_company_plan: None, company_plan_gap_centavos: None,
        error_code: Some(e.error_code.clone()),
        error_message: Some(e.error_message.clone()),
        error_field: e.error_field.clone(),
    }).collect();

    // Merge and sort by row_number to restore CSV order
    computed_rows.append(&mut parse_error_results);
    computed_rows.sort_by_key(|r| r.row_number);

    // Stage 3: Aggregation
    let summary = aggregate(&computed_rows, &row_errors);

    // Build row_errors convenience list (parse errors + computation errors)
    let output_row_errors: Vec<BatchRowError> = computed_rows.iter()
        .filter(|r| matches!(r.status, BatchRowStatus::ParseError | BatchRowStatus::ComputationError))
        .map(|r| BatchRowError {
            row_number: r.row_number,
            employee_id: r.employee_id.clone(),
            error_code: r.error_code.clone().unwrap_or_default(),
            error_message: r.error_message.clone().unwrap_or_default(),
            error_field: r.error_field.clone(),
        })
        .collect();

    let output = BatchOutput {
        batch_id: uuid_v4(),   // uses `uuid` crate: Uuid::new_v4().to_string()
        computed_at: utc_now_iso8601(),  // chrono: Utc::now().to_rfc3339()
        input_row_count,
        summary,
        employees: computed_rows,
        row_errors: output_row_errors,
    };

    serde_json::to_string(&output).expect("BatchOutput serialization is infallible")
}

/// parse_csv_full: returns (valid_rows, row_errors). Batch-level errors are Err.
fn parse_csv_full(
    csv_content: &str,
) -> Result<(Vec<BatchRowInput>, Vec<BatchRowError>), BatchLevelError> {
    // (Implementation follows same logic as parse_csv above, but also returns row_errors
    //  instead of discarding them. Separated for clarity.)
    todo!()   // NOTE: this file specifies the algorithm; Rust implementation follows
}
```

---

## Cargo.toml Dependencies for Batch Engine

```toml
[dependencies]
# Core
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }

# UUID generation for batch_id
uuid = { version = "1", features = ["v4", "js"] }
# "js" feature required for wasm32-unknown-unknown target (uses JS Math.random())

# Date arithmetic (already in single-employee engine)
# chrono::NaiveDate covers all date operations needed
```

**Note on `uuid` crate:** The `js` feature is mandatory for WASM targets. Without it,
`Uuid::new_v4()` will panic at runtime in the browser because the default random source
is unavailable.

---

## CSV Export (Batch Results → CSV Download)

The batch engine does NOT generate CSV output — that is a frontend concern. The frontend
receives the `BatchOutput` JSON and generates the CSV download client-side using the
following column order:

```
row_number, employee_id, employee_name, status, eligibility_status,
age_at_retirement, service_months, credited_years, rounding_applied,
monthly_salary_php, retirement_pay_php, fifteen_day_amount_php,
underpayment_php, tax_treatment, has_company_plan, company_plan_gap_php,
error_code, error_message, notes
```

Money columns exported as PHP pesos with 2 decimal places (centavos ÷ 100, formatted to 2dp).

---

## Performance Characteristics

| Batch size | Expected compute time | Notes |
|------------|----------------------|-------|
| 100 rows | < 50ms | |
| 1,000 rows | < 200ms | |
| 5,000 rows | < 1,000ms | Upper bound on modern hardware |

WASM is synchronous — there is no yield point during batch. The frontend shows an indeterminate
spinner. No streaming or partial results.

For 5,000 employees at PHP 20,000/month with 20 credited years, total retirement pay ≈
PHP 345,230 × 5,000 = PHP 1.726B = 172_600_000_000 centavos. This fits comfortably in `i64`.

**Overflow check for aggregation totals:**
- Max sum: 5,000 employees × PHP 500M/month (absurd upper bound) × 50 years × 45/52 ≈
  5,000 × 21,634,615,384 centavos ≈ 108 trillion centavos = 1.08 × 10^14
- i64 max ≈ 9.2 × 10^18 — no overflow possible.

---

## Integration with NLRC Worksheet Generator

The NLRC worksheet generator (`generate_nlrc_json`) operates on a **single employee**.
For batch-to-NLRC, the frontend:
1. Receives `BatchOutput`
2. User selects one or more eligible employees
3. Frontend calls `generate_nlrc_json()` for each selected employee (using the original
   `RetirementInput` reconstructed from the batch row fields)
4. Combines individual NLRC worksheets into a multi-page PDF

There is no `generate_batch_nlrc_json()` WASM function. Multi-employee NLRC PDF assembly
is a frontend PDF rendering concern.

---

## Test Vectors

### Vector BE-1: Standard batch — 3 employees (from batch-computation-rules.md B1)

**Input (CSV fragment):**
```
employee_id,employee_name,birth_date,hire_date,retirement_date,monthly_salary,worker_category,employer_employee_count,employer_type
EMP001,Juan dela Cruz,1964-03-15,1994-01-01,2024-03-15,20000.00,general,50,general
EMP002,Maria Santos,1980-06-01,2019-07-01,2024-06-01,35000.00,general,50,general
EMP003,Pedro Garcia,1959-09-20,1994-06-01,2024-09-20,28000.00,general,50,general
```

**Expected BatchOutput.summary:**
```json
{
  "totalRows": 3,
  "parseErrorRows": 0,
  "computationErrorRows": 0,
  "eligibleRows": 2,
  "ineligibleRows": 1,
  "totalRetirementPayCentavos": 124615383,
  "totalFifteenDayAmountCentavos": 98076922,
  "totalUnderpaymentCentavos": 26538461,
  "avgRetirementPayCentavos": 62307691,
  "medianRetirementPayCentavos": 62307691,
  "minRetirementPayCentavos": 51923076,
  "maxRetirementPayCentavos": 72692307
}
```

EMP001 detail:
- age_at_retirement: 60 (born 1964-03-15, retires 2024-03-15)
- service_months: 362 (Jan 1994 to Mar 2024 = 30y 2m)
- credited_years: 30 (2 < 6, no rounding)
- retirement_pay: 2_000_000 × 45 × 30 / 52 = 51_923_076 centavos
- fifteen_day: 2_000_000 × 15 × 30 / 26 = 34_615_384 centavos
- underpayment: 17_307_692 centavos
- status: Ok, eligibility_status: EligibleOptional

EMP002 detail:
- age_at_retirement: 44 (born 1980-06-01, retires 2024-06-01)
- service_months: 59 (Jul 2019 to Jun 2024)
- status: Ineligible, eligibility_status: IneligibleAge (primary gate fails)
- retirement_pay still computed: 3_500_000 × 45 × 5 / 52 = 15_144_230 centavos (reference)

EMP003 detail:
- age_at_retirement: 65 (born 1959-09-20, retires 2024-09-20)
- service_months: 363 (Jun 1994 to Sep 2024 = 30y 3m)
- credited_years: 30 (3 < 6, no rounding)
- retirement_pay: 2_800_000 × 45 × 30 / 52 = 72_692_307 centavos
- status: Ok, eligibility_status: EligibleCompulsory

### Vector BE-2: Parse error row (from B2)

**Input CSV row:** `EMP004,Ana Reyes,1964-13-01,1994-01-01,2024-03-15,20000.00,general,50,general`

**Expected:**
- BatchRowResult.status: ParseError
- BatchRowResult.errorCode: "invalid_date_format"
- BatchRowResult.errorField: "birth_date"
- BatchRowResult.errorMessage: "'1964-13-01' is not a valid date in YYYY-MM-DD format."

### Vector BE-3: Duplicate employee_id (from B3)

**Input:** Two rows with employee_id="EMP005"

**Expected:**
- First row: processed normally
- Second row: status=ParseError, errorCode="duplicate_employee_id"

### Vector BE-4: Small employer (from B4)

**Input:** `EMP006,Rosa Mendoza,1959-01-01,1994-01-01,2024-01-01,18000.00,general,8,retail`

**Expected:**
- status: Ok (EligibleWithWarning maps to Ok in batch)
- eligibility_status: EligibleOptional (age 65, eligible)
- eligibility_warning: "small_employer_claimed_verify_headcount"
- retirement_pay: 1_800_000 × 45 × 30 / 52 = 46_730_769 centavos

### Vector BE-5: Batch-level error — too many rows

**Input:** CSV with 5,001 data rows

**Expected:** BatchLevelError { code: "batchTooLarge", error: "Batch file contains 5001 data rows. Maximum is 5,000 rows per batch." }

### Vector BE-6: Missing required column

**Input CSV header:** `employee_id,employee_name,birth_date,hire_date,monthly_salary` (missing retirement_date, worker_category, employer_employee_count, employer_type)

**Expected:** BatchLevelError { code: "missingColumns", error: "Required columns missing: retirement_date, worker_category, employer_employee_count, employer_type" }

### Vector BE-7: Default salary_divisor

**Input row without salary_divisor column:**
`EMP007,Test Employee,1964-01-01,1994-01-01,2024-01-01,26000.00,general,50,general`

**Expected:**
- salary_divisor defaults to 26
- retirement_pay: 2_600_000 × 45 × 30 / 52 = 67_500_000 centavos = PHP 675,000.00

### Vector BE-8: Company plan gap

**Input row:**
`EMP008,Plan Test,1964-01-01,1994-01-01,2024-01-01,20000.00,general,50,general,,26,true,10000.00`

(has_company_plan=true, company_plan_monthly_benefit=PHP 10,000.00/month)

**Expected:**
- company_plan_annual = 10,000 × 12 = PHP 120,000 = 12_000_000 centavos
- statutory_minimum = 51_923_076 centavos (same as EMP001)
- company_plan_gap_centavos = 51_923_076 - 12_000_000 = 39_923_076 centavos (gap exists)

---

## Summary

The batch engine is a thin orchestration layer over the existing single-employee pipeline:

1. **CSV parse**: RFC 4180 with header column mapping, per-row error collection, batch-level abort conditions (size, missing columns, encoding).
2. **Per-employee compute**: `BatchRowInput → RetirementInput → compute_single() → BatchRowResult`. Per-row errors collected, not fatal.
3. **Aggregation**: Monetary totals, statistics, distribution counts — all over eligible rows only. Integer arithmetic throughout; i64 sums never overflow.
4. **Output**: `BatchOutput` with `summary`, `employees` (all rows in CSV order), and `rowErrors` convenience list.

Key design decisions:
- Company plan comparison in batch uses simplified `ManualEntry` (monthly benefit × 12). Single-employee mode supports all four company plan types.
- Tax treatment in batch produces `PotentiallyExempt` / `NotExempt` / `RequiresVerification` — BIR plan status cannot be inferred from CSV.
- UUID for `batchId` requires `uuid` crate with `js` feature for WASM.
- `parse_csv_full()` returns both valid rows and row errors simultaneously — the batch does not abort on per-row parse failures.
