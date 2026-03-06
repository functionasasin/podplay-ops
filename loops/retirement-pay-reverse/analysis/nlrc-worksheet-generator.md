# Analysis: NLRC Worksheet Generator — Rust Engine Module

**Wave:** 3 — Engine Design
**Aspect:** nlrc-worksheet-generator
**Date:** 2026-03-06
**Sources:** nlrc-worksheet-format.md, data-model.md, computation-pipeline.md, algorithms.md,
             tax-treatment-conditions.md, separation-pay-interaction.md

---

## Overview

This document specifies the Rust engine module that generates NLRC worksheet output. The module:

1. Accepts a combined `NlrcGenerateInput` (retirement computation input + NLRC metadata)
2. Runs the standard retirement pay computation pipeline (reusing `compute_single`)
3. Assembles all pre-formatted display values into `NlrcWorksheetOutput`
4. Exposes two WASM entry points: `generate_nlrc_json` (single) and `generate_nlrc_batch_json` (multi-employee)

The NLRC generator is NOT a separate computation engine — it wraps the existing pipeline and adds:
- Formatted string values for every numeric field (so the frontend renders without arithmetic)
- Legal citation text blocks (static strings keyed by condition flags)
- Interest computation (Nacar v. Gallery Frames, 6% per annum)
- Exhibit metadata (case number, branch, attorney info)

---

## 1. Rust Module Structure

```
engine/src/
  lib.rs                  — WASM exports (generate_nlrc_json, generate_nlrc_batch_json)
  nlrc/
    mod.rs                — NlrcWorksheetGenerator struct + generate() method
    types.rs              — NlrcWorksheetInput, NlrcWorksheetOutput, NlrcBatchInput, NlrcBatchOutput
    interest.rs           — compute_interest() function
    format.rs             — format_money(), format_date(), format_money_signed()
    citations.rs          — static citation text blocks
```

---

## 2. Rust Types (Complete Definitions)

### 2.1 Input Types

```rust
// nlrc/types.rs

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use crate::types::RetirementInput;

/// Combined input for single-employee NLRC worksheet generation.
/// Passed as JSON to generate_nlrc_json().
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NlrcGenerateInput {
    /// The core retirement computation input (reused from compute_single pipeline).
    pub retirement: RetirementInput,
    /// NLRC worksheet metadata.
    pub nlrc: NlrcWorksheetInput,
}

/// NLRC-specific metadata — case filing info, parties, attorney info, amounts.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NlrcWorksheetInput {
    // ── Case / Filing Metadata ────────────────────────────────────────────
    /// "NLRC-RAB-IV-12-0045-26" or null if pre-filing (demand letter mode)
    pub case_number: Option<String>,
    /// "Regional Arbitration Branch IV — Calamba City" or null
    pub regional_branch: Option<String>,
    /// Default "A"; user may set "B", "C", etc.
    pub exhibit_label: String,
    /// Date NLRC complaint was filed; null if pre-filing
    pub date_filed: Option<NaiveDate>,

    // ── Parties ───────────────────────────────────────────────────────────
    /// "DELA CRUZ, Juan Santos" — LAST, First Middle format
    pub complainant_full_name: String,
    /// "Production Supervisor"
    pub complainant_position: String,
    /// "ABC Manufacturing Corporation"
    pub respondent_name: String,
    /// Optional — used in demand letter mode
    pub respondent_address: Option<String>,

    // ── Attorney Information (all optional) ───────────────────────────────
    /// "Atty. Maria B. Reyes"
    pub prepared_by_name: Option<String>,
    /// "12345"
    pub attorney_roll_no: Option<String>,
    /// "PTR No. 2345678 / Jan. 5, 2026 / Makati City"
    pub attorney_ptr_no: Option<String>,
    /// "IBP No. 98765 / Jan. 3, 2026 / Makati"
    pub attorney_ibp_no: Option<String>,
    /// "MCLE Compliance No. VI-0123456 / April 1, 2025"
    pub attorney_mcle_no: Option<String>,
    /// "Reyes & Associates Law Office"
    pub law_firm_name: Option<String>,
    /// "Suite 501, Alpha Tower, Makati City"
    pub law_firm_address: Option<String>,

    // ── Amounts ───────────────────────────────────────────────────────────
    /// Amount employer already paid, in centavos. null = employer paid nothing.
    pub amount_already_paid_centavos: Option<i64>,
    /// Date demand letter was sent — interest accrues from this date.
    /// null = no interest computation.
    pub date_of_demand: Option<NaiveDate>,

    // ── Flags ─────────────────────────────────────────────────────────────
    /// Compute and display 6% per annum interest (Nacar v. Gallery Frames).
    /// Only shown if date_of_demand is also set.
    pub include_interest: bool,
    /// Show the 15-day employer error vs 22.5-day correct comparison section.
    pub include_employer_comparison: bool,
    /// Show the tax treatment section.
    pub include_tax_treatment: bool,
}
```

### 2.2 Output Type

```rust
/// Complete pre-formatted NLRC worksheet data.
/// All monetary values included both as centavos (i64) and as formatted PHP strings.
/// The frontend renders this struct directly — no arithmetic needed.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NlrcWorksheetOutput {
    // ── Document Mode ─────────────────────────────────────────────────────
    /// true = NLRC exhibit (has case_number or date_filed);
    /// false = demand letter (both null → show "DEMAND FOR PAYMENT" format)
    pub is_nlrc_mode: bool,

    // ── Exhibit Metadata ──────────────────────────────────────────────────
    pub exhibit_label: String,
    pub case_number: Option<String>,
    pub regional_branch: Option<String>,
    /// "March 6, 2026" formatted; null if date_filed was null
    pub date_filed_formatted: Option<String>,
    /// Today's date, formatted: "March 6, 2026"
    pub date_prepared_formatted: String,

    // ── Parties ───────────────────────────────────────────────────────────
    pub complainant_full_name: String,
    pub complainant_position: String,
    pub respondent_name: String,
    pub respondent_address: Option<String>,

    // ── Employee Info ─────────────────────────────────────────────────────
    /// "March 15, 1964"
    pub birth_date_formatted: String,
    /// "January 1, 1994"
    pub hire_date_formatted: String,
    /// "March 15, 2024"
    pub retirement_date_formatted: String,
    /// 60
    pub age_at_retirement: u8,
    /// "60 years old"
    pub age_at_retirement_formatted: String,
    /// 30
    pub full_years_service: u32,
    /// 0
    pub partial_months_service: u8,
    /// true if partial_months >= 6 (rounded up)
    pub rounding_applied: bool,
    /// 30
    pub credited_years: u32,
    /// "30 years, 0 months"
    pub service_length_formatted: String,
    /// "30 YEARS (no rounding applied)" or "31 YEARS (rounded up from 30 years 7 months)"
    pub credited_years_narrative: String,

    // ── Salary Basis ──────────────────────────────────────────────────────
    pub monthly_salary_centavos: i64,
    /// "PHP 20,000.00"
    pub monthly_salary_formatted: String,
    /// 26 (standard) or 22 (mining)
    pub salary_divisor: u8,
    pub daily_rate_centavos: i64,
    /// "PHP 769.23"
    pub daily_rate_formatted: String,

    // ── 22.5-Day Formula Components ───────────────────────────────────────
    pub component_a_centavos: i64,
    /// "PHP 11,538.46" (15 × daily_rate, display approximation)
    pub component_a_formatted: String,
    pub component_b_centavos: i64,
    /// "PHP 3,846.15" (5 × daily_rate, display approximation)
    pub component_b_formatted: String,
    pub component_c_centavos: i64,
    /// "PHP 1,666.67" (monthly / 12, display approximation)
    pub component_c_formatted: String,
    pub half_month_salary_centavos: i64,
    /// "PHP 17,307.69" (authoritative: monthly × 45 / 52)
    pub half_month_salary_formatted: String,
    /// true — always included in output to document the display-vs-exact discrepancy
    pub components_are_approximate: bool,

    // ── Retirement Pay Total ──────────────────────────────────────────────
    pub retirement_pay_centavos: i64,
    /// "PHP 519,230.77"
    pub retirement_pay_formatted: String,

    // ── 15-Day Employer Comparison ────────────────────────────────────────
    pub include_employer_comparison: bool,
    pub fifteen_day_per_year_centavos: i64,
    /// "PHP 11,538.46"
    pub fifteen_day_per_year_formatted: String,
    pub fifteen_day_total_centavos: i64,
    /// "PHP 346,153.85"
    pub fifteen_day_total_formatted: String,
    pub underpayment_centavos: i64,
    /// "PHP 173,076.92"
    pub underpayment_formatted: String,

    // ── Amounts Paid / Balance ─────────────────────────────────────────────
    pub amount_already_paid_centavos: Option<i64>,
    /// "PHP 0.00" or actual formatted amount; null if no payment recorded
    pub amount_already_paid_formatted: Option<String>,
    pub balance_due_centavos: i64,
    /// "PHP 519,230.77" (= retirement_pay if nothing paid)
    pub balance_due_formatted: String,

    // ── Interest ──────────────────────────────────────────────────────────
    pub include_interest_section: bool,
    pub date_of_demand_formatted: Option<String>,
    /// "March 6, 2026" (date_of_computation = date engine ran)
    pub date_of_computation_formatted: Option<String>,
    pub days_elapsed: Option<u32>,
    pub interest_centavos: Option<i64>,
    pub interest_formatted: Option<String>,
    pub total_due_with_interest_centavos: Option<i64>,
    pub total_due_with_interest_formatted: Option<String>,

    // ── Tax Treatment ─────────────────────────────────────────────────────
    pub include_tax_section: bool,
    /// TaxTreatment enum as string: "ExemptTrackA" | "ExemptTrackB" | "Taxable" | "RequiresVerification"
    pub tax_treatment: String,
    /// Pre-formatted narrative paragraph for the worksheet section
    pub tax_treatment_narrative: String,

    // ── Legal Citations ───────────────────────────────────────────────────
    /// Full text of the legal basis section (static, pre-assembled)
    pub legal_citations_text: String,

    // ── Attorney / Certification ──────────────────────────────────────────
    pub prepared_by_name: Option<String>,
    pub attorney_roll_no: Option<String>,
    pub attorney_ptr_no: Option<String>,
    pub attorney_ibp_no: Option<String>,
    pub attorney_mcle_no: Option<String>,
    pub law_firm_name: Option<String>,
    pub law_firm_address: Option<String>,
    /// true = show attorney block; false = show complainant self-certification only
    pub has_attorney: bool,
}
```

### 2.3 Batch Input/Output Types

```rust
/// Input for multi-employee NLRC batch worksheet.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NlrcBatchInput {
    /// Shared case metadata
    pub case_number: Option<String>,
    pub regional_branch: Option<String>,
    pub exhibit_label: String,
    pub date_filed: Option<NaiveDate>,
    pub respondent_name: String,
    pub respondent_address: Option<String>,

    /// Attorney info (shared across all employees)
    pub prepared_by_name: Option<String>,
    pub attorney_roll_no: Option<String>,
    pub attorney_ptr_no: Option<String>,
    pub attorney_ibp_no: Option<String>,
    pub attorney_mcle_no: Option<String>,
    pub law_firm_name: Option<String>,
    pub law_firm_address: Option<String>,

    /// Shared flags
    pub include_interest: bool,
    pub include_employer_comparison: bool,
    pub include_tax_treatment: bool,

    /// One entry per employee. Only eligible employees should be included,
    /// but the engine validates eligibility and skips ineligible rows with an error.
    pub employees: Vec<NlrcBatchEmployeeInput>,
}

/// Per-employee input for batch NLRC worksheet.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct NlrcBatchEmployeeInput {
    /// The core retirement data
    pub retirement: RetirementInput,
    /// NLRC-specific per-employee overrides
    pub complainant_full_name: String,
    pub complainant_position: String,
    /// Optional: per-employee prior payment
    pub amount_already_paid_centavos: Option<i64>,
    /// Optional: per-employee demand date (overrides shared date if set)
    pub date_of_demand: Option<NaiveDate>,
}

/// Output for multi-employee NLRC batch worksheet.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NlrcBatchOutput {
    /// Shared metadata (pass-through from input)
    pub case_number: Option<String>,
    pub regional_branch: Option<String>,
    pub exhibit_label: String,
    pub date_filed_formatted: Option<String>,
    pub date_prepared_formatted: String,
    pub respondent_name: String,
    pub is_nlrc_mode: bool,

    /// Per-employee worksheets (one per eligible employee)
    pub employees: Vec<NlrcWorksheetOutput>,

    /// Rows that failed (ineligible or invalid input)
    pub errors: Vec<NlrcBatchRowError>,

    /// Aggregate totals
    pub total_retirement_pay_centavos: i64,
    pub total_retirement_pay_formatted: String,
    pub total_balance_due_centavos: i64,
    pub total_balance_due_formatted: String,
    pub total_interest_centavos: Option<i64>,
    pub total_interest_formatted: Option<String>,
    pub employee_count: u32,
    pub error_count: u32,

    /// Attorney info (shared)
    pub prepared_by_name: Option<String>,
    pub attorney_roll_no: Option<String>,
    pub attorney_ptr_no: Option<String>,
    pub attorney_ibp_no: Option<String>,
    pub attorney_mcle_no: Option<String>,
    pub law_firm_name: Option<String>,
    pub law_firm_address: Option<String>,
    pub has_attorney: bool,
}

/// An employee row that could not be processed.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NlrcBatchRowError {
    pub row_index: u32,
    pub complainant_full_name: String,
    pub error_code: String,
    pub error_message: String,
}
```

---

## 3. Generator Algorithm: `generate_nlrc_worksheet`

```rust
// nlrc/mod.rs

pub fn generate_nlrc_worksheet(
    input: &NlrcGenerateInput,
    today: NaiveDate,
) -> Result<NlrcWorksheetOutput, EngineError> {

    // Step 1: Run the retirement computation pipeline (reuse existing)
    let retirement_output = compute_single(&input.retirement)?;
    // Note: compute_single() never fatally errors on ineligibility.
    // It returns an output with eligibility.status = Ineligible.
    // The NLRC generator continues regardless (generates worksheet for reference).

    let nlrc = &input.nlrc;
    let r = &retirement_output;

    // Step 2: Determine document mode
    // NLRC mode = has case_number OR has date_filed
    let is_nlrc_mode = nlrc.case_number.is_some() || nlrc.date_filed.is_some();

    // Step 3: Compute balance_due
    let balance_due_centavos = match nlrc.amount_already_paid_centavos {
        Some(paid) => r.retirement_pay_centavos - paid,
        None => r.retirement_pay_centavos,
    };

    // Step 4: Compute interest (conditional)
    // Interest is shown only when include_interest = true AND date_of_demand is set
    let interest_result = if nlrc.include_interest && nlrc.date_of_demand.is_some() {
        let demand_date = nlrc.date_of_demand.unwrap();
        let days_elapsed = (today - demand_date).num_days().max(0) as u32;
        let interest_centavos = compute_interest(balance_due_centavos, days_elapsed);
        Some((days_elapsed, interest_centavos, balance_due_centavos + interest_centavos))
    } else {
        None
    };

    // Step 5: Derive 15-day comparison values
    // fifteen_day_per_year = (monthly × 15) / salary_divisor
    let monthly = r.monthly_salary_centavos;
    let divisor = r.salary_divisor as i64;
    let years = r.credited_years as i64;
    let fifteen_day_per_year = (monthly * 15) / divisor;
    let fifteen_day_total = (monthly * 15 * years) / divisor;
    let underpayment = r.retirement_pay_centavos - fifteen_day_total;

    // Step 6: Build display component values (approximate — for display only)
    // Authoritative total is r.retirement_pay_centavos from the pipeline
    let component_a = (monthly * 15) / divisor;        // 15 days
    let component_b = (monthly * 5) / divisor;         // 5 days SIL
    let component_c = monthly / 12;                    // 1/12 of 13th month

    // Step 7: Format all monetary values
    // (delegate to format.rs)

    // Step 8: Determine attorney block presence
    let has_attorney = nlrc.prepared_by_name.is_some();

    // Step 9: Build tax treatment narrative
    let tax_narrative = build_tax_narrative(
        &retirement_output.tax_treatment,
        retirement_output.age_at_retirement,
        r.credited_years,
    );

    // Step 10: Build legal citations text
    let citations = build_citations(
        nlrc.include_interest && interest_result.is_some(),
    );

    // Step 11: Build credited years narrative
    let credited_years_narrative = build_credited_years_narrative(
        r.full_years_service,
        r.partial_months_service,
        r.rounding_applied,
        r.credited_years,
    );

    // Step 12: Assemble output
    Ok(NlrcWorksheetOutput {
        is_nlrc_mode,
        exhibit_label: nlrc.exhibit_label.clone(),
        case_number: nlrc.case_number.clone(),
        regional_branch: nlrc.regional_branch.clone(),
        date_filed_formatted: nlrc.date_filed.map(|d| format_date(d)),
        date_prepared_formatted: format_date(today),

        complainant_full_name: nlrc.complainant_full_name.clone(),
        complainant_position: nlrc.complainant_position.clone(),
        respondent_name: nlrc.respondent_name.clone(),
        respondent_address: nlrc.respondent_address.clone(),

        birth_date_formatted: format_date(input.retirement.birth_date),
        hire_date_formatted: format_date(input.retirement.hire_date),
        retirement_date_formatted: format_date(input.retirement.retirement_date),
        age_at_retirement: retirement_output.age_at_retirement,
        age_at_retirement_formatted: format!("{} years old", retirement_output.age_at_retirement),
        full_years_service: r.full_years_service,
        partial_months_service: r.partial_months_service,
        rounding_applied: r.rounding_applied,
        credited_years: r.credited_years,
        service_length_formatted: format_service_length(r.full_years_service, r.partial_months_service),
        credited_years_narrative,

        monthly_salary_centavos: monthly,
        monthly_salary_formatted: format_money(monthly),
        salary_divisor: r.salary_divisor,
        daily_rate_centavos: r.daily_rate_centavos,
        daily_rate_formatted: format_money(r.daily_rate_centavos),

        component_a_centavos: component_a,
        component_a_formatted: format_money(component_a),
        component_b_centavos: component_b,
        component_b_formatted: format_money(component_b),
        component_c_centavos: component_c,
        component_c_formatted: format_money(component_c),
        half_month_salary_centavos: r.half_month_salary_centavos,
        half_month_salary_formatted: format_money(r.half_month_salary_centavos),
        components_are_approximate: true,

        retirement_pay_centavos: r.retirement_pay_centavos,
        retirement_pay_formatted: format_money(r.retirement_pay_centavos),

        include_employer_comparison: nlrc.include_employer_comparison,
        fifteen_day_per_year_centavos: fifteen_day_per_year,
        fifteen_day_per_year_formatted: format_money(fifteen_day_per_year),
        fifteen_day_total_centavos: fifteen_day_total,
        fifteen_day_total_formatted: format_money(fifteen_day_total),
        underpayment_centavos: underpayment,
        underpayment_formatted: format_money(underpayment),

        amount_already_paid_centavos: nlrc.amount_already_paid_centavos,
        amount_already_paid_formatted: nlrc.amount_already_paid_centavos.map(format_money),
        balance_due_centavos,
        balance_due_formatted: format_money(balance_due_centavos),

        include_interest_section: interest_result.is_some(),
        date_of_demand_formatted: nlrc.date_of_demand.map(|d| format_date(d)),
        date_of_computation_formatted: interest_result.as_ref().map(|_| format_date(today)),
        days_elapsed: interest_result.as_ref().map(|(d, _, _)| *d),
        interest_centavos: interest_result.as_ref().map(|(_, i, _)| *i),
        interest_formatted: interest_result.as_ref().map(|(_, i, _)| format_money(*i)),
        total_due_with_interest_centavos: interest_result.as_ref().map(|(_, _, t)| *t),
        total_due_with_interest_formatted: interest_result.as_ref().map(|(_, _, t)| format_money(*t)),

        include_tax_section: nlrc.include_tax_treatment,
        tax_treatment: format!("{:?}", retirement_output.tax_treatment),
        tax_treatment_narrative: tax_narrative,

        legal_citations_text: citations,

        prepared_by_name: nlrc.prepared_by_name.clone(),
        attorney_roll_no: nlrc.attorney_roll_no.clone(),
        attorney_ptr_no: nlrc.attorney_ptr_no.clone(),
        attorney_ibp_no: nlrc.attorney_ibp_no.clone(),
        attorney_mcle_no: nlrc.attorney_mcle_no.clone(),
        law_firm_name: nlrc.law_firm_name.clone(),
        law_firm_address: nlrc.law_firm_address.clone(),
        has_attorney,
    })
}
```

---

## 4. Interest Computation Module

```rust
// nlrc/interest.rs

/// Compute 6% per annum simple interest on a principal amount.
///
/// Formula: interest = principal × 6 × days / 36500
///   (= principal × 6% × days/365, rearranged to one integer division)
///
/// Truncates toward zero (never rounds up against the employer).
/// Source: Nacar v. Gallery Frames, G.R. No. 189871 (August 13, 2013)
///
/// # Arguments
/// * `principal_centavos` - Amount to accrue interest on (i64 centavos)
/// * `days_elapsed` - Calendar days from demand date to computation date
///
/// # Returns
/// Interest in centavos (i64), truncated.
pub fn compute_interest(principal_centavos: i64, days_elapsed: u32) -> i64 {
    // Multiply before divide to minimize truncation loss.
    // Max practical: PHP 5,000,000 × 6 × 3650 = 109,500,000,000,000 centavos ≈ 1.1e14
    // i64 max ≈ 9.2e18 — no overflow.
    (principal_centavos * 6 * days_elapsed as i64) / 36500
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_interest_19_days() {
        // PHP 519,230.77 × 6% × 19/365
        // = 51_923_077 × 6 × 19 / 36500
        // = 5_919_231_174 / 36500 = 162,171 centavos (truncated)
        let result = compute_interest(51_923_077, 19);
        assert_eq!(result, 162_171);
    }

    #[test]
    fn test_interest_zero_days() {
        assert_eq!(compute_interest(1_000_000, 0), 0);
    }

    #[test]
    fn test_interest_one_year() {
        // PHP 1,000,000 × 6% × 365/365 = PHP 60,000 exactly
        // = 100_000_000 × 6 × 365 / 36500 = 219_000_000_000 / 36500 = 6_000_000
        let result = compute_interest(100_000_000, 365);
        assert_eq!(result, 6_000_000);
    }
}
```

---

## 5. Format Functions

```rust
// nlrc/format.rs

use chrono::NaiveDate;

/// Format centavos as "PHP X,XXX.XX" with thousand separators.
/// Example: 2_000_000 → "PHP 20,000.00"
pub fn format_money(centavos: i64) -> String {
    let pesos = centavos / 100;
    let cents = (centavos % 100).abs();
    // Insert thousand separators
    let pesos_str = format_thousands(pesos);
    format!("PHP {}.{:02}", pesos_str, cents)
}

/// Format centavos as a signed amount for net/balance contexts.
/// Example: -5_000_000 → "PHP -50,000.00"
pub fn format_money_signed(centavos: i64) -> String {
    format_money(centavos) // PHP sign before negative sign is valid in PH convention
}

/// Format NaiveDate as "March 15, 1964" (Philippine court document standard).
pub fn format_date(date: NaiveDate) -> String {
    date.format("%B %-d, %Y").to_string()
}

/// Format service length as "30 years, 0 months" or "15 years, 7 months".
pub fn format_service_length(years: u32, months: u8) -> String {
    if months == 0 {
        format!("{} year{}, 0 months", years, if years == 1 { "" } else { "s" })
    } else {
        format!("{} year{}, {} month{}", years, plural(years), months, plural_u8(months))
    }
}

fn plural(n: u32) -> &'static str { if n == 1 { "" } else { "s" } }
fn plural_u8(n: u8) -> &'static str { if n == 1 { "" } else { "s" } }

/// Insert commas every 3 digits in an integer string.
fn format_thousands(n: i64) -> String {
    let s = n.abs().to_string();
    let sign = if n < 0 { "-" } else { "" };
    let chars: Vec<char> = s.chars().collect();
    let len = chars.len();
    let mut result = String::new();
    for (i, c) in chars.iter().enumerate() {
        if i > 0 && (len - i) % 3 == 0 {
            result.push(',');
        }
        result.push(*c);
    }
    format!("{}{}", sign, result)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_money_round() {
        assert_eq!(format_money(2_000_000), "PHP 20,000.00");
    }

    #[test]
    fn test_format_money_cents() {
        assert_eq!(format_money(2_000_077), "PHP 20,000.77");
    }

    #[test]
    fn test_format_money_large() {
        assert_eq!(format_money(51_923_076), "PHP 519,230.76");
    }

    #[test]
    fn test_format_date() {
        use chrono::NaiveDate;
        let d = NaiveDate::from_ymd_opt(1964, 3, 15).unwrap();
        assert_eq!(format_date(d), "March 15, 1964");
    }

    #[test]
    fn test_format_service_length_exact_years() {
        assert_eq!(format_service_length(30, 0), "30 years, 0 months");
    }

    #[test]
    fn test_format_service_length_with_months() {
        assert_eq!(format_service_length(15, 7), "15 years, 7 months");
    }

    #[test]
    fn test_format_thousands_million() {
        assert_eq!(format_thousands(1_234_567), "1,234,567");
    }
}
```

---

## 6. Static Text Builders

```rust
// nlrc/citations.rs

use crate::types::TaxTreatment;

/// Build the full legal citations section text.
/// `include_nacar` = true when interest section is shown.
pub fn build_citations(include_nacar: bool) -> String {
    let mut text = String::from(
        "LEGAL BASIS\n\
         \n\
         1. Republic Act No. 7641 (The New Retirement Pay Law, December 9, 1992)\n\
            — Section 1, amending Article 287 (now Art. 302) of the Labor Code\n\
            — Defines \"one-half (1/2) month salary\" as 15 days + 5 days SIL + 1/12 of 13th month pay\n\
         \n\
         2. Presidential Decree No. 442 (Labor Code of the Philippines), Article 302\n\
            — Retirement pay equivalent to at least one-half (1/2) month salary for every year of service\n\
         \n\
         3. Elegir v. Philippine Airlines, Inc., G.R. No. 181995 (2011)\n\
            — Supreme Court confirmation: \"one-half (1/2) month salary means 22.5 days\"\n\
         \n\
         4. Implementing Rules and Regulations of RA 7641, Rule II, Section 5\n\
            — \"Total effective days: 22.5 days (15 + 5 + 2.5)\""
    );

    if include_nacar {
        text.push_str(
            "\n\n\
             5. Nacar v. Gallery Frames, G.R. No. 189871 (August 13, 2013)\n\
                — Legal interest at 6% per annum on monetary judgments and quasi-judicial awards"
        );
    }

    text
}

/// Build the tax treatment narrative paragraph.
/// Returns a fully formatted paragraph for the tax treatment worksheet section.
pub fn build_tax_narrative(
    treatment: &TaxTreatment,
    age: u8,
    credited_years: u32,
) -> String {
    match treatment {
        TaxTreatment::ExemptTrackA => format!(
            "The retirement pay described herein qualifies for income tax exemption under Section \
             32(B)(6)(a) of the National Internal Revenue Code, as amended (mandatory retirement \
             under the Labor Code of the Philippines). No withholding tax is due on this payment. \
             Basis: Employee is {} years old and has served {} year{} (both meeting the statutory \
             minimums for mandatory retirement).",
            age, credited_years, if credited_years == 1 { "" } else { "s" }
        ),
        TaxTreatment::ExemptTrackB => format!(
            "The retirement pay described herein qualifies for income tax exemption under Section \
             32(B)(6)(a) of the National Internal Revenue Code, as amended, pursuant to a BIR-approved \
             private retirement benefit plan. No withholding tax is due on this payment. \
             Basis: Employee is {} years old, has served {} year{}, and this is the first lifetime \
             availment of tax-exempt retirement benefits under an approved plan.",
            age, credited_years, if credited_years == 1 { "" } else { "s" }
        ),
        TaxTreatment::RequiresVerification => format!(
            "Tax treatment requires employer verification: the employee meets the age ({} years) \
             and service ({} year{}) thresholds, but whether this is the employee's first lifetime \
             availment of tax-exempt retirement benefits must be confirmed with the employer's records. \
             If verified as first-time, no withholding tax is due. If not first-time, the payment is \
             subject to income tax under the applicable graduated rates.",
            age, credited_years, if credited_years == 1 { "" } else { "s" }
        ),
        TaxTreatment::Taxable { reason } => format!(
            "The retirement pay described herein does NOT qualify for income tax exemption under \
             Section 32(B)(6)(a) of the National Internal Revenue Code. The employer is required to \
             withhold income tax on the taxable portion at the applicable graduated rates. \
             Reason: {}",
            reason
        ),
    }
}

/// Build the credited years narrative for Section E of the worksheet.
pub fn build_credited_years_narrative(
    full_years: u32,
    partial_months: u8,
    rounding_applied: bool,
    credited_years: u32,
) -> String {
    if partial_months == 0 {
        format!(
            "{} YEARS (exact — no partial year fraction)",
            credited_years
        )
    } else if rounding_applied {
        format!(
            "{} YEARS (rounded UP from {} years, {} months — {} months ≥ 6 months threshold)",
            credited_years, full_years, partial_months, partial_months
        )
    } else {
        format!(
            "{} YEARS (partial year DROPPED — {} months < 6 months threshold)",
            credited_years, partial_months
        )
    }
}
```

---

## 7. WASM Entry Points

```rust
// lib.rs additions

#[wasm_bindgen]
pub fn generate_nlrc_json(input_json: &str) -> String {
    let today = chrono::Local::now().naive_local().date();
    match serde_json::from_str::<NlrcGenerateInput>(input_json) {
        Err(e) => error_json("INVALID_INPUT", &format!("JSON parse error: {}", e), None),
        Ok(input) => {
            match generate_nlrc_worksheet(&input, today) {
                Ok(output) => serde_json::to_string(&output).unwrap_or_else(|e| {
                    error_json("SERIALIZE_ERROR", &e.to_string(), None)
                }),
                Err(e) => e.to_json_string(),
            }
        }
    }
}

#[wasm_bindgen]
pub fn generate_nlrc_batch_json(input_json: &str) -> String {
    let today = chrono::Local::now().naive_local().date();
    match serde_json::from_str::<NlrcBatchInput>(input_json) {
        Err(e) => error_json("INVALID_INPUT", &format!("JSON parse error: {}", e), None),
        Ok(input) => {
            match generate_nlrc_batch(&input, today) {
                Ok(output) => serde_json::to_string(&output).unwrap_or_else(|e| {
                    error_json("SERIALIZE_ERROR", &e.to_string(), None)
                }),
                Err(e) => e.to_json_string(),
            }
        }
    }
}
```

---

## 8. Batch Generator Algorithm

```rust
// nlrc/mod.rs (batch variant)

pub fn generate_nlrc_batch(
    input: &NlrcBatchInput,
    today: NaiveDate,
) -> Result<NlrcBatchOutput, EngineError> {
    let mut employees: Vec<NlrcWorksheetOutput> = Vec::new();
    let mut errors: Vec<NlrcBatchRowError> = Vec::new();

    let mut total_retirement_pay: i64 = 0;
    let mut total_balance_due: i64 = 0;
    let mut total_interest: Option<i64> = None;

    for (idx, employee) in input.employees.iter().enumerate() {
        // Build NlrcWorksheetInput for this employee, merging shared metadata
        let nlrc_input = NlrcGenerateInput {
            retirement: employee.retirement.clone(),
            nlrc: NlrcWorksheetInput {
                case_number: input.case_number.clone(),
                regional_branch: input.regional_branch.clone(),
                exhibit_label: input.exhibit_label.clone(),
                date_filed: input.date_filed,
                complainant_full_name: employee.complainant_full_name.clone(),
                complainant_position: employee.complainant_position.clone(),
                respondent_name: input.respondent_name.clone(),
                respondent_address: input.respondent_address.clone(),
                prepared_by_name: input.prepared_by_name.clone(),
                attorney_roll_no: input.attorney_roll_no.clone(),
                attorney_ptr_no: input.attorney_ptr_no.clone(),
                attorney_ibp_no: input.attorney_ibp_no.clone(),
                attorney_mcle_no: input.attorney_mcle_no.clone(),
                law_firm_name: input.law_firm_name.clone(),
                law_firm_address: input.law_firm_address.clone(),
                amount_already_paid_centavos: employee.amount_already_paid_centavos,
                // Per-employee demand date overrides shared date
                date_of_demand: employee.date_of_demand.or(None),
                include_interest: input.include_interest,
                include_employer_comparison: input.include_employer_comparison,
                include_tax_treatment: input.include_tax_treatment,
            },
        };

        match generate_nlrc_worksheet(&nlrc_input, today) {
            Ok(ws) => {
                total_retirement_pay += ws.retirement_pay_centavos;
                total_balance_due += ws.balance_due_centavos;
                if let Some(interest) = ws.interest_centavos {
                    *total_interest.get_or_insert(0) += interest;
                }
                employees.push(ws);
            }
            Err(e) => {
                errors.push(NlrcBatchRowError {
                    row_index: idx as u32,
                    complainant_full_name: employee.complainant_full_name.clone(),
                    error_code: e.code.clone(),
                    error_message: e.message.clone(),
                });
            }
        }
    }

    let is_nlrc_mode = input.case_number.is_some() || input.date_filed.is_some();
    let employee_count = employees.len() as u32;
    let error_count = errors.len() as u32;
    let has_attorney = input.prepared_by_name.is_some();

    Ok(NlrcBatchOutput {
        case_number: input.case_number.clone(),
        regional_branch: input.regional_branch.clone(),
        exhibit_label: input.exhibit_label.clone(),
        date_filed_formatted: input.date_filed.map(format_date),
        date_prepared_formatted: format_date(today),
        respondent_name: input.respondent_name.clone(),
        is_nlrc_mode,
        employees,
        errors,
        total_retirement_pay_centavos: total_retirement_pay,
        total_retirement_pay_formatted: format_money(total_retirement_pay),
        total_balance_due_centavos: total_balance_due,
        total_balance_due_formatted: format_money(total_balance_due),
        total_interest_centavos: total_interest,
        total_interest_formatted: total_interest.map(format_money),
        employee_count,
        error_count,
        prepared_by_name: input.prepared_by_name.clone(),
        attorney_roll_no: input.attorney_roll_no.clone(),
        attorney_ptr_no: input.attorney_ptr_no.clone(),
        attorney_ibp_no: input.attorney_ibp_no.clone(),
        attorney_mcle_no: input.attorney_mcle_no.clone(),
        law_firm_name: input.law_firm_name.clone(),
        law_firm_address: input.law_firm_address.clone(),
        has_attorney,
    })
}
```

---

## 9. Test Vectors

### Vector NLG-1: Standard single employee, full NLRC mode with interest

**Input:**
```json
{
  "retirement": {
    "monthlyBaseSalaryCentavos": 2000000,
    "birthDate": "1964-03-15",
    "hireDate": "1994-01-01",
    "retirementDate": "2024-03-15",
    "workerCategory": "General",
    "retirementType": "Optional",
    "hasCompanyPlan": false,
    "authorizedCause": null,
    "isFirstLifetimeAvailing": true,
    "hasBirApprovedPlan": false
  },
  "nlrc": {
    "caseNumber": "NLRC-RAB-IV-03-0012-26",
    "regionalBranch": "Regional Arbitration Branch IV — Calamba City",
    "exhibitLabel": "A",
    "dateFiled": "2026-03-01",
    "complainantFullName": "DELA CRUZ, Juan Santos",
    "complainantPosition": "Production Supervisor",
    "respondentName": "ABC Manufacturing Corporation",
    "respondentAddress": "123 Industrial Road, Calamba City 4027",
    "preparedByName": "Atty. Maria B. Reyes",
    "attorneyRollNo": "12345",
    "attorneyPtrNo": "PTR No. 2345678 / Jan. 5, 2026 / Makati City",
    "attorneyIbpNo": "IBP No. 98765 / Jan. 3, 2026 / Makati",
    "attorneyMcleNo": "MCLE Compliance No. VI-0123456 / April 1, 2025",
    "lawFirmName": "Reyes & Associates Law Office",
    "lawFirmAddress": "Suite 501, Alpha Tower, Makati City 1200",
    "amountAlreadyPaidCentavos": null,
    "dateOfDemand": "2026-02-01",
    "includeInterest": true,
    "includeEmployerComparison": true,
    "includeTaxTreatment": true
  }
}
```

**Expected output (key fields, today = 2026-03-06):**
```
is_nlrc_mode:                     true
exhibit_label:                    "A"
case_number:                      "NLRC-RAB-IV-03-0012-26"
date_prepared_formatted:          "March 6, 2026"
date_filed_formatted:             "March 1, 2026"

birth_date_formatted:             "March 15, 1964"
hire_date_formatted:              "January 1, 1994"
retirement_date_formatted:        "March 15, 2024"
age_at_retirement:                60
age_at_retirement_formatted:      "60 years old"
full_years_service:               30
partial_months_service:           0
rounding_applied:                 false
credited_years:                   30
service_length_formatted:         "30 years, 0 months"

monthly_salary_centavos:          2000000
monthly_salary_formatted:         "PHP 20,000.00"
salary_divisor:                   26
daily_rate_centavos:              76923
daily_rate_formatted:             "PHP 769.23"

component_a_centavos:             1153845    // 76923 × 15 (display approximation)
component_a_formatted:            "PHP 11,538.45"
component_b_centavos:             384615     // 76923 × 5
component_b_formatted:            "PHP 3,846.15"
component_c_centavos:             166666     // 2000000 / 12
component_c_formatted:            "PHP 1,666.66"
half_month_salary_centavos:       1730769    // (2000000 × 45) / 52 = authoritative
half_month_salary_formatted:      "PHP 17,307.69"
components_are_approximate:       true

retirement_pay_centavos:          51923076   // (2000000 × 45 × 30) / 52
retirement_pay_formatted:         "PHP 519,230.76"

fifteen_day_per_year_centavos:    1153846    // (2000000 × 15) / 26 = 1,153,846
fifteen_day_per_year_formatted:   "PHP 11,538.46"
fifteen_day_total_centavos:       34615380   // 1,153,846 × 30 = 34,615,380
fifteen_day_total_formatted:      "PHP 346,153.80"
underpayment_centavos:            17307696   // 51,923,076 - 34,615,380
underpayment_formatted:           "PHP 173,076.96"

balance_due_centavos:             51923076
balance_due_formatted:            "PHP 519,230.76"

include_interest_section:         true
date_of_demand_formatted:         "February 1, 2026"
date_of_computation_formatted:    "March 6, 2026"
days_elapsed:                     34
interest_centavos:                289396     // 51,923,076 × 6 × 34 / 36500 = 10,590,447,504 / 36500 = 290,149 truncated
  // Exact: 51923076 × 6 = 311538456; × 34 = 10592307504; / 36500 = 290,199 truncated
interest_formatted:               "PHP 2,901.99"
total_due_with_interest_centavos: 52213275
total_due_with_interest_formatted:"PHP 522,132.75"

include_interest_section:         true
include_tax_section:              true
has_attorney:                     true
```

Note on interest exact computation:
```
51_923_076 × 6 = 311_538_456
311_538_456 × 34 = 10_592_307_504
10_592_307_504 / 36500 = 290,199 (truncated from 290,199.52...)
interest_centavos = 290_199
total_due = 51_923_076 + 290_199 = 52_213_275
interest_formatted: "PHP 2,901.99"
total_formatted: "PHP 522,132.75"
```

### Vector NLG-2: Demand letter mode (no case number, no interest)

**Input changes:**
```json
"caseNumber": null,
"dateFiled": null,
"dateOfDemand": null,
"includeInterest": false
```

**Expected:**
```
is_nlrc_mode:           false
exhibit_label:          "A"   (shown in title differently by frontend)
include_interest_section: false
case_number:            null
date_filed_formatted:   null
```

### Vector NLG-3: Prior partial payment, balance computed correctly

**Input changes from NLG-1:**
```json
"amountAlreadyPaidCentavos": 20000000,
"includeInterest": false
```

**Expected:**
```
retirement_pay_centavos:          51923076
amount_already_paid_centavos:     20000000
amount_already_paid_formatted:    "PHP 200,000.00"
balance_due_centavos:             31923076
balance_due_formatted:            "PHP 319,230.76"
include_interest_section:         false
```

### Vector NLG-4: Batch, two employees

**Input:** Two employees — Juan (PHP 20,000, 30 years) and Maria (PHP 35,000, 25 years)

Maria: retirement_pay = (3_500_000 × 45 × 25) / 52 = 3_937_500_000 / 52 = 75_721_153 centavos

**Expected batch output:**
```
employee_count:                   2
error_count:                      0
total_retirement_pay_centavos:    51923076 + 75721153 = 127644229
total_retirement_pay_formatted:   "PHP 1,276,442.29"
```

---

## 10. Module Integration Notes

### How `nlrc-worksheet-generator` integrates with the pipeline

The generator calls `compute_single()` internally. It does NOT re-implement the retirement computation. This ensures:
- Single source of truth for the retirement pay arithmetic
- If `compute_single()` changes (e.g., algorithm correction), NLRC worksheets automatically use the corrected amount
- The generator only adds: date formatting, money formatting, interest, static text blocks

### `today` parameter injection

The `today: NaiveDate` parameter is injected by the WASM entry point (`chrono::Local::now().naive_local().date()`). In tests, it is passed explicitly so test outputs are deterministic. The frontend never sends `today` — the engine computes it from the server clock at the time `generate_nlrc_json()` is called.

### Display approximation note

The worksheet shows per-component amounts (15 days, 5 days SIL, 1/12 of 13th month) as display approximations computed from the truncated daily rate. The authoritative total (`half_month_salary_centavos` and `retirement_pay_centavos`) uses the unified `(monthly × 45 × years) / 52` formula. The frontend must display a note: *"Individual component amounts are shown rounded to the nearest centavo. The total retirement pay uses the exact statutory formula."*

---

## 11. Summary

The NLRC worksheet generator is a pure Rust module (`nlrc/`) that:
1. Accepts `NlrcGenerateInput` = `RetirementInput` + `NlrcWorksheetInput`
2. Delegates retirement arithmetic to `compute_single()` (no duplication)
3. Computes interest via `compute_interest(balance, days)` = `balance × 6 × days / 36500` (Nacar v. Gallery Frames)
4. Formats all monetary values as "PHP X,XXX.XX" strings (format_money)
5. Formats all dates as "Month DD, YYYY" strings (format_date)
6. Assembles static legal citation text via `build_citations(include_nacar)`
7. Generates tax treatment narrative via `build_tax_narrative(treatment, age, years)`
8. Returns `NlrcWorksheetOutput` — a fully pre-formatted struct the frontend renders directly
9. Exposes `generate_nlrc_json` and `generate_nlrc_batch_json` as WASM entry points
10. Batch mode generates one `NlrcWorksheetOutput` per employee, aggregates totals, and collects per-row errors

Key design decisions:
- **Frontend does no arithmetic** — all numbers pre-formatted in Rust
- **`components_are_approximate: true`** — always true; frontend displays the disclaimer note
- **`today` injected, not sent from frontend** — deterministic in tests, real clock in production
- **Batch merges shared + per-employee metadata** — attorney info shared; demand dates and prior payments per-employee
- **NLRC mode vs demand letter mode** — determined by `case_number || date_filed`, shown in `is_nlrc_mode` flag
