use rust_decimal::Decimal;
use std::str::FromStr;

/// Parse a rate string into Decimal at compile time (panics on invalid input — only
/// called with hard-coded constants so this is safe).
fn d(s: &str) -> Decimal {
    Decimal::from_str(s).expect("invalid rate constant")
}

/// Select and apply the correct graduated income tax schedule based on tax year.
///
/// - 2018–2022: TRAIN First Schedule (Schedule 1, transitional)
/// - 2023+:     TRAIN Second Schedule (Schedule 2, current)
///
/// Returns the income tax due. Full Decimal precision is maintained; rounding
/// to 2 decimal places must happen at the call site per spec GRT-R2.
pub fn compute_graduated_tax(nti: Decimal, tax_year: u16) -> Decimal {
    if tax_year >= 2023 {
        compute_graduated_schedule2(nti)
    } else {
        compute_graduated_schedule1(nti)
    }
}

/// TRAIN Schedule 1 — Transitional Rates (Tax Years 2018–2022)
///
/// Brackets (all "not over" — upper bound inclusive per BIR language):
///   Bracket 1: 0 – 250,000          → 0%
///   Bracket 2: 250,001 – 400,000    → 20% of excess over 250,000
///   Bracket 3: 400,001 – 800,000    → 30,000 + 25% of excess over 400,000
///   Bracket 4: 800,001 – 2,000,000  → 130,000 + 30% of excess over 800,000
///   Bracket 5: 2,000,001 – 8,000,000 → 490,000 + 32% of excess over 2,000,000
///   Bracket 6: over 8,000,000        → 2,410,000 + 35% of excess over 8,000,000
pub fn compute_graduated_schedule1(nti: Decimal) -> Decimal {
    let zero = Decimal::ZERO;

    // Negative NTI → zero tax (net operating loss; NOLCO tracked separately)
    if nti <= zero {
        return zero;
    }

    if nti <= d("250000") {
        zero
    } else if nti <= d("400000") {
        d("0.20") * (nti - d("250000"))
    } else if nti <= d("800000") {
        d("30000") + d("0.25") * (nti - d("400000"))
    } else if nti <= d("2000000") {
        d("130000") + d("0.30") * (nti - d("800000"))
    } else if nti <= d("8000000") {
        d("490000") + d("0.32") * (nti - d("2000000"))
    } else {
        d("2410000") + d("0.35") * (nti - d("8000000"))
    }
}

/// TRAIN Schedule 2 — Current Rates (Tax Years 2023+)
///
/// Brackets (all "not over" — upper bound inclusive per BIR language):
///   Bracket 1: 0 – 250,000          → 0%
///   Bracket 2: 250,001 – 400,000    → 15% of excess over 250,000
///   Bracket 3: 400,001 – 800,000    → 22,500 + 20% of excess over 400,000
///   Bracket 4: 800,001 – 2,000,000  → 102,500 + 25% of excess over 800,000
///   Bracket 5: 2,000,001 – 8,000,000 → 402,500 + 30% of excess over 2,000,000
///   Bracket 6: over 8,000,000        → 2,202,500 + 35% of excess over 8,000,000
pub fn compute_graduated_schedule2(nti: Decimal) -> Decimal {
    let zero = Decimal::ZERO;

    if nti <= zero {
        return zero;
    }

    if nti <= d("250000") {
        zero
    } else if nti <= d("400000") {
        d("0.15") * (nti - d("250000"))
    } else if nti <= d("800000") {
        d("22500") + d("0.20") * (nti - d("400000"))
    } else if nti <= d("2000000") {
        d("102500") + d("0.25") * (nti - d("800000"))
    } else if nti <= d("8000000") {
        d("402500") + d("0.30") * (nti - d("2000000"))
    } else {
        d("2202500") + d("0.35") * (nti - d("8000000"))
    }
}

/// OSD rate: 40% of gross receipts (Path B).
pub const OSD_RATE: &str = "0.40";

/// 8% flat rate threshold: ₱3,000,000 gross receipts ceiling.
pub const EIGHT_PCT_THRESHOLD: &str = "3000000";

/// 8% flat rate: applied to (gross receipts + non-operating income − ₱250,000 exemption).
pub const EIGHT_PCT_RATE: &str = "0.08";

/// ₱250,000 exemption for purely-SE taxpayers under Path C.
pub const EIGHT_PCT_EXEMPTION: &str = "250000";

/// Percentage tax rate — standard (pre-July 2020 and post-June 2023): 3%.
pub const PT_RATE_STANDARD: &str = "0.03";

/// Percentage tax rate — CREATE Act reduced rate (July 2020 – June 2023): 1%.
pub const PT_RATE_CREATE: &str = "0.01";

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal::prelude::*;

    fn check(nti: &str, expected: &str, year: u16) {
        let result = compute_graduated_tax(d(nti), year);
        let result_rounded = result.round_dp(2);
        let exp = d(expected);
        assert_eq!(result_rounded, exp,
            "NTI={nti} year={year}: got {result_rounded}, expected {exp}");
    }

    // --- Schedule 2 (2023+) boundary verification ---
    #[test]
    fn s2_bracket1_zero() { check("250000", "0", 2024); }
    #[test]
    fn s2_bracket2_one_peso() { check("250001", "0.15", 2024); }
    #[test]
    fn s2_bracket2_upper() { check("400000", "22500", 2024); }
    #[test]
    fn s2_bracket3_lower() { check("400001", "22500.20", 2024); }
    #[test]
    fn s2_bracket3_upper() { check("800000", "102500", 2024); }
    #[test]
    fn s2_bracket4_lower() { check("800001", "102500.25", 2024); }
    #[test]
    fn s2_bracket4_upper() { check("2000000", "402500", 2024); }
    #[test]
    fn s2_bracket5_lower() { check("2000001", "402500.30", 2024); }
    #[test]
    fn s2_bracket5_upper() { check("8000000", "2202500", 2024); }
    #[test]
    fn s2_bracket6_lower() { check("8000001", "2202500.35", 2024); }
    #[test]
    fn s2_bracket4_mid() { check("1500000", "277500", 2024); }
    #[test]
    fn s2_bracket5_mid() { check("3000000", "702500", 2024); }

    // --- Schedule 1 (2018–2022) boundary verification ---
    #[test]
    fn s1_bracket1_zero() { check("250000", "0", 2022); }
    #[test]
    fn s1_bracket2_upper() { check("400000", "30000", 2022); }
    #[test]
    fn s1_bracket3_upper() { check("800000", "130000", 2022); }
    #[test]
    fn s1_bracket4_upper() { check("2000000", "490000", 2022); }
    #[test]
    fn s1_bracket5_upper() { check("8000000", "2410000", 2022); }
    #[test]
    fn s1_bracket6_lower() { check("8000001", "2410000.35", 2022); }

    // --- Negative / zero NTI ---
    #[test]
    fn zero_nti() { check("0", "0", 2024); }
    #[test]
    fn negative_nti() {
        let result = compute_graduated_tax(d("-50000"), 2024);
        assert_eq!(result, Decimal::ZERO);
    }

    // --- Schedule 2 always <= Schedule 1 ---
    #[test]
    fn s2_leq_s1_at_common_breakpoints() {
        let incomes = ["300000", "500000", "1000000", "2000000", "5000000", "8000000"];
        for inc in &incomes {
            let s1 = compute_graduated_schedule1(d(inc));
            let s2 = compute_graduated_schedule2(d(inc));
            assert!(s2 <= s1, "Schedule 2 must be <= Schedule 1 at NTI={inc}");
        }
    }
}
