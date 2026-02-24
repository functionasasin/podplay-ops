//! Step 3: Determine Succession Type + Scenario Code
//!
//! Given the line counts from Step 2, the decedent info, and whether a will
//! exists, this step determines:
//! 1. The succession type (Testate, Intestate, or Mixed — tentatively)
//! 2. The specific scenario code (T1-T15 or I1-I15)
//!
//! Spec references:
//!   - §3.7 Scenario Codes (testate T1-T15, intestate I1-I15)
//!   - §2.4 Mixed Succession Detection (preliminary: will present → TESTATE tentative)
//!   - §7.5 Mixed Succession (definitive detection happens after Step 5)

use crate::step2_lines::LineCounts;
use crate::types::*;

// ── Input / Output types ────────────────────────────────────────────

/// Input to Step 3.
#[derive(Debug, Clone)]
pub struct Step3Input {
    pub line_counts: LineCounts,
    pub has_will: bool,
    pub decedent: Decedent,
    /// Whether there are surviving siblings/nephews/nieces (for intestate I12/I13).
    pub has_siblings_or_nephews: bool,
    /// Whether there are surviving other collaterals within 5th degree (for intestate I14).
    pub has_other_collaterals: bool,
}

/// Output of Step 3.
#[derive(Debug, Clone)]
pub struct Step3Output {
    pub succession_type: SuccessionType,
    pub scenario_code: ScenarioCode,
    pub warnings: Vec<ManualFlag>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Determine the succession type and scenario code from the line counts
/// and decedent information.
///
/// This is the **preliminary** determination. Mixed succession is NOT
/// detected here — that happens after Step 5 when `FP_disposable` is known.
/// At this stage:
///   - Will present → TESTATE
///   - No will → INTESTATE
///
/// The scenario code (T1-T15 or I1-I15) is selected based on which heir
/// groups survive (line counts) and special conditions (e.g. illegitimate
/// decedent for T14/T15/I-ID scenarios).
pub fn step3_determine_scenario(input: &Step3Input) -> Step3Output {
    // Step 3 preliminary: will present → TESTATE, else INTESTATE.
    // Mixed detection happens after Step 5 (§2.4).
    let succession_type = if input.has_will {
        SuccessionType::Testate
    } else {
        SuccessionType::Intestate
    };

    let (scenario_code, warnings) = match succession_type {
        SuccessionType::Testate => {
            determine_testate_scenario(&input.line_counts, &input.decedent)
        }
        SuccessionType::Intestate => determine_intestate_scenario(
            &input.line_counts,
            &input.decedent,
            input.has_siblings_or_nephews,
            input.has_other_collaterals,
        ),
        // Mixed and IntestateByPreterition are not determined in Step 3.
        _ => unreachable!("Step 3 only produces Testate or Intestate"),
    };

    Step3Output {
        succession_type,
        scenario_code,
        warnings,
    }
}

// ── Internal helpers ────────────────────────────────────────────────

/// Map line counts to a testate scenario code (T1-T15).
///
/// Uses the scenario table from §3.7:
/// - Regime A (descendants present): T1-T5b
/// - Regime B (ascendants, no descendants): T6-T9
/// - Regime C (no primary/secondary compulsory heirs): T10-T13
/// - Special (illegitimate decedent): T14-T15
fn determine_testate_scenario(
    lc: &LineCounts,
    decedent: &Decedent,
) -> (ScenarioCode, Vec<ManualFlag>) {
    let warnings = Vec::new();
    let has_lc = lc.legitimate_child > 0;
    let has_ic = lc.illegitimate_child > 0;
    let has_spouse = lc.surviving_spouse > 0;
    let has_asc = lc.legitimate_ascendant > 0;

    // §4.2: Descendants exclude ascendants. If any LC exists, ascendants
    // are excluded from compulsory succession — use Regime A.

    // ── Regime A: Descendants present ──
    if has_lc {
        let code = match (has_ic, has_spouse) {
            // T1: n LC only (no IC, no spouse)
            (false, false) => ScenarioCode::T1,
            // T4: n LC + m IC (no spouse)
            (true, false) => ScenarioCode::T4,
            // T2/T3: LC + spouse (no IC) — T2 if 1 LC, T3 if n≥2
            (false, true) => {
                if lc.legitimate_child == 1 {
                    ScenarioCode::T2
                } else {
                    ScenarioCode::T3
                }
            }
            // T5a/T5b: LC + IC + spouse — T5a if 1 LC, T5b if n≥2
            (true, true) => {
                if lc.legitimate_child == 1 {
                    ScenarioCode::T5a
                } else {
                    ScenarioCode::T5b
                }
            }
        };
        return (code, warnings);
    }

    // ── Special: Illegitimate decedent with ascendants (Art. 903) ──
    // T14/T15 take priority over Regime B when decedent is illegitimate.
    if decedent.is_illegitimate && has_asc {
        let code = if has_spouse {
            ScenarioCode::T15
        } else {
            ScenarioCode::T14
        };
        return (code, warnings);
    }

    // ── Regime B: Ascendants present, no descendants ──
    if has_asc {
        let code = match (has_ic, has_spouse) {
            (false, false) => ScenarioCode::T6,
            (false, true) => ScenarioCode::T7,
            (true, false) => ScenarioCode::T8,
            (true, true) => ScenarioCode::T9,
        };
        return (code, warnings);
    }

    // ── Regime C: No primary (descendants) or secondary (ascendants) heirs ──
    let code = match (has_ic, has_spouse) {
        (true, true) => ScenarioCode::T10,
        (true, false) => ScenarioCode::T11,
        (false, true) => ScenarioCode::T12,
        (false, false) => ScenarioCode::T13,
    };
    (code, warnings)
}

/// Map line counts to an intestate scenario code (I1-I15).
///
/// Uses the intestate scenario table from §3.7.
fn determine_intestate_scenario(
    lc: &LineCounts,
    _decedent: &Decedent,
    has_siblings_or_nephews: bool,
    has_other_collaterals: bool,
) -> (ScenarioCode, Vec<ManualFlag>) {
    let warnings = Vec::new();
    let has_lc = lc.legitimate_child > 0;
    let has_ic = lc.illegitimate_child > 0;
    let has_spouse = lc.surviving_spouse > 0;
    let has_asc = lc.legitimate_ascendant > 0;

    // §4.2: Descendants exclude ascendants.

    // ── Regime A: Descendants present ──
    if has_lc {
        let code = match (has_ic, has_spouse) {
            (false, false) => ScenarioCode::I1,
            (false, true) => ScenarioCode::I2,
            (true, false) => ScenarioCode::I3,
            (true, true) => ScenarioCode::I4,
        };
        return (code, warnings);
    }

    // ── Regime B: Ascendants present, no descendants ──
    if has_asc {
        let code = match (has_ic, has_spouse) {
            (false, false) => ScenarioCode::I5,
            (false, true) => ScenarioCode::I6,
            (true, false) => ScenarioCode::I9,
            (true, true) => ScenarioCode::I10,
        };
        return (code, warnings);
    }

    // ── Regime C: No descendants, no ascendants ──

    // IC present (with or without spouse)
    if has_ic {
        let code = if has_spouse {
            ScenarioCode::I8
        } else {
            ScenarioCode::I7
        };
        return (code, warnings);
    }

    // Spouse present (no IC, no descendants, no ascendants)
    if has_spouse {
        // I12 if siblings/nephews exist alongside spouse; I11 if spouse alone
        let code = if has_siblings_or_nephews {
            ScenarioCode::I12
        } else {
            ScenarioCode::I11
        };
        return (code, warnings);
    }

    // No compulsory heirs at all — collateral relatives or escheat
    if has_siblings_or_nephews {
        return (ScenarioCode::I13, warnings);
    }
    if has_other_collaterals {
        return (ScenarioCode::I14, warnings);
    }

    // I15: No heirs → State (escheat)
    (ScenarioCode::I15, warnings)
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::step2_lines::LineCounts;

    // ── Test helpers ────────────────────────────────────────────────

    fn default_decedent() -> Decedent {
        Decedent {
            id: "decedent".to_string(),
            name: "Juan dela Cruz".to_string(),
            date_of_death: "2026-01-15".to_string(),
            is_married: false,
            date_of_marriage: None,
            marriage_solemnized_in_articulo_mortis: false,
            was_ill_at_marriage: false,
            illness_caused_death: false,
            years_of_cohabitation: 0,
            has_legal_separation: false,
            is_illegitimate: false,
        }
    }

    fn married_decedent() -> Decedent {
        Decedent {
            is_married: true,
            date_of_marriage: Some("2010-06-15".to_string()),
            ..default_decedent()
        }
    }

    fn illegitimate_decedent() -> Decedent {
        Decedent {
            is_illegitimate: true,
            ..default_decedent()
        }
    }

    fn illegitimate_married_decedent() -> Decedent {
        Decedent {
            is_illegitimate: true,
            is_married: true,
            date_of_marriage: Some("2020-01-01".to_string()),
            ..default_decedent()
        }
    }

    fn counts(lc: usize, ic: usize, spouse: usize, asc: usize) -> LineCounts {
        LineCounts {
            legitimate_child: lc,
            illegitimate_child: ic,
            surviving_spouse: spouse,
            legitimate_ascendant: asc,
        }
    }

    fn make_input(
        line_counts: LineCounts,
        has_will: bool,
        decedent: Decedent,
        has_siblings_or_nephews: bool,
        has_other_collaterals: bool,
    ) -> Step3Input {
        Step3Input {
            line_counts,
            has_will,
            decedent,
            has_siblings_or_nephews,
            has_other_collaterals,
        }
    }

    // ====================================================================
    // SUCCESSION TYPE TESTS
    // ====================================================================

    #[test]
    fn test_intestate_when_no_will() {
        let input = make_input(
            counts(2, 0, 0, 0),
            false, // no will
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.succession_type, SuccessionType::Intestate);
    }

    #[test]
    fn test_testate_when_will_exists() {
        let input = make_input(
            counts(2, 0, 0, 0),
            true, // will exists
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        // Step 3 preliminary: will present → TESTATE
        // (Mixed detection happens after Step 5)
        assert_eq!(output.succession_type, SuccessionType::Testate);
    }

    #[test]
    fn test_preliminary_testate_not_mixed() {
        // Even if the will only partially covers the estate, Step 3
        // should classify as TESTATE — mixed detection is post-Step 5.
        let input = make_input(
            counts(2, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.succession_type, SuccessionType::Testate);
        assert_ne!(output.succession_type, SuccessionType::Mixed);
    }

    // ====================================================================
    // TESTATE SCENARIO TESTS — REGIME A (Descendants present)
    // ====================================================================

    /// T1: n legitimate children only (no spouse, no IC, no ascendants)
    /// Spec §3.7: "n legitimate children only"
    #[test]
    fn test_t1_legitimate_children_only() {
        let input = make_input(
            counts(3, 0, 0, 0),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T1);
        assert_eq!(output.succession_type, SuccessionType::Testate);
    }

    /// T2: 1 legitimate child + spouse
    /// Spec §3.7: "1 legitimate child + spouse"
    #[test]
    fn test_t2_one_lc_plus_spouse() {
        let input = make_input(
            counts(1, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T2);
    }

    /// T3: n≥2 legitimate children + spouse
    /// Spec §3.7: "n≥2 legitimate children + spouse"
    #[test]
    fn test_t3_multiple_lc_plus_spouse() {
        let input = make_input(
            counts(3, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T3);
    }

    /// T3 with exactly 2 LC + spouse
    #[test]
    fn test_t3_two_lc_plus_spouse() {
        let input = make_input(
            counts(2, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T3);
    }

    /// T4: n legitimate + m illegitimate (no spouse)
    /// Spec §3.7: "n legitimate + m illegitimate"
    #[test]
    fn test_t4_lc_plus_ic_no_spouse() {
        let input = make_input(
            counts(2, 3, 0, 0),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T4);
    }

    /// T5a: 1 LC + m IC + spouse
    /// Spec §3.7: "1 LC + m IC + spouse"
    #[test]
    fn test_t5a_one_lc_ic_spouse() {
        let input = make_input(
            counts(1, 3, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T5a);
    }

    /// T5b: n≥2 LC + m IC + spouse
    /// Spec §3.7: "n≥2 LC + m IC + spouse"
    #[test]
    fn test_t5b_multiple_lc_ic_spouse() {
        let input = make_input(
            counts(2, 1, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T5b);
    }

    // ====================================================================
    // TESTATE SCENARIO TESTS — REGIME B (Ascendants, no descendants)
    // ====================================================================

    /// T6: Legitimate ascendants only
    /// Spec §3.7: "Legitimate ascendants only" — Art. 889
    #[test]
    fn test_t6_ascendants_only() {
        let input = make_input(
            counts(0, 0, 0, 2),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T6);
    }

    /// T7: Ascendants + spouse
    /// Spec §3.7: "Ascendants + spouse" — Arts. 889, 893
    #[test]
    fn test_t7_ascendants_plus_spouse() {
        let input = make_input(
            counts(0, 0, 1, 2),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T7);
    }

    /// T8: Ascendants + m illegitimate (no spouse)
    /// Spec §3.7: "Ascendants + m illegitimate" — Arts. 889, 896
    #[test]
    fn test_t8_ascendants_plus_ic() {
        let input = make_input(
            counts(0, 2, 0, 1),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T8);
    }

    /// T9: Ascendants + m IC + spouse
    /// Spec §3.7: "Ascendants + m IC + spouse" — Arts. 889, 896, 899
    #[test]
    fn test_t9_ascendants_ic_spouse() {
        let input = make_input(
            counts(0, 2, 1, 2),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T9);
    }

    // ====================================================================
    // TESTATE SCENARIO TESTS — REGIME C (No primary/secondary heirs)
    // ====================================================================

    /// T10: m IC + spouse (no LC, no ascendants)
    /// Spec §3.7: "m IC + spouse" — Art. 894
    #[test]
    fn test_t10_ic_plus_spouse() {
        let input = make_input(
            counts(0, 3, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T10);
    }

    /// T11: m IC only (no LC, no ascendants, no spouse)
    /// Spec §3.7: "m IC only" — Art. 901
    #[test]
    fn test_t11_ic_only() {
        let input = make_input(
            counts(0, 2, 0, 0),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T11);
    }

    /// T12: Spouse only (no LC, no IC, no ascendants)
    /// Spec §3.7: "Spouse only" — Art. 900
    #[test]
    fn test_t12_spouse_only() {
        let input = make_input(
            counts(0, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T12);
    }

    /// T13: No compulsory heirs — Full FP
    /// Spec §3.7: "No compulsory heirs"
    #[test]
    fn test_t13_no_compulsory_heirs() {
        let input = make_input(
            counts(0, 0, 0, 0),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T13);
    }

    // ====================================================================
    // TESTATE SCENARIO TESTS — SPECIAL (Illegitimate decedent)
    // ====================================================================

    /// T14: Parents of illegitimate decedent (Art. 903)
    /// Spec §3.7: "Parents of illegitimate decedent"
    #[test]
    fn test_t14_illegitimate_decedent_parents() {
        let input = make_input(
            counts(0, 0, 0, 2), // parents are "ascendants"
            true,
            illegitimate_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T14);
    }

    /// T15: Parents + spouse of illegitimate decedent (Art. 903)
    /// Spec §3.7: "Parents + spouse of illegitimate decedent"
    #[test]
    fn test_t15_illegitimate_decedent_parents_spouse() {
        let input = make_input(
            counts(0, 0, 1, 2),
            true,
            illegitimate_married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T15);
    }

    // ====================================================================
    // INTESTATE SCENARIO TESTS
    // ====================================================================

    /// I1: n legitimate children only
    /// Spec §3.7: Art. 980
    #[test]
    fn test_i1_lc_only() {
        let input = make_input(
            counts(3, 0, 0, 0),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I1);
        assert_eq!(output.succession_type, SuccessionType::Intestate);
    }

    /// I2: n LC + spouse
    /// Spec §3.7: Arts. 994, 996
    #[test]
    fn test_i2_lc_plus_spouse() {
        let input = make_input(
            counts(3, 0, 1, 0),
            false,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I2);
    }

    /// I3: n LC + m IC
    /// Spec §3.7: Arts. 983, 895
    #[test]
    fn test_i3_lc_plus_ic() {
        let input = make_input(
            counts(2, 1, 0, 0),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I3);
    }

    /// I4: n LC + m IC + spouse
    /// Spec §3.7: Arts. 999, 983, 895
    #[test]
    fn test_i4_lc_ic_spouse() {
        let input = make_input(
            counts(2, 1, 1, 0),
            false,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I4);
    }

    /// I5: Legitimate ascendants only
    /// Spec §3.7: Arts. 985-987
    #[test]
    fn test_i5_ascendants_only() {
        let input = make_input(
            counts(0, 0, 0, 2),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I5);
    }

    /// I6: Ascendants + spouse
    /// Spec §3.7: Art. 997
    #[test]
    fn test_i6_ascendants_plus_spouse() {
        let input = make_input(
            counts(0, 0, 1, 2),
            false,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I6);
    }

    /// I7: m IC only
    /// Spec §3.7: Art. 988
    #[test]
    fn test_i7_ic_only() {
        let input = make_input(
            counts(0, 3, 0, 0),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I7);
    }

    /// I8: m IC + spouse
    /// Spec §3.7: Art. 998
    #[test]
    fn test_i8_ic_plus_spouse() {
        let input = make_input(
            counts(0, 2, 1, 0),
            false,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I8);
    }

    /// I9: Ascendants + m IC
    /// Spec §3.7: Art. 991
    #[test]
    fn test_i9_ascendants_plus_ic() {
        let input = make_input(
            counts(0, 2, 0, 1),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I9);
    }

    /// I10: Ascendants + m IC + spouse
    /// Spec §3.7: Art. 1000
    #[test]
    fn test_i10_ascendants_ic_spouse() {
        let input = make_input(
            counts(0, 2, 1, 2),
            false,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I10);
    }

    /// I11: Spouse only
    /// Spec §3.7: Art. 995
    #[test]
    fn test_i11_spouse_only() {
        let input = make_input(
            counts(0, 0, 1, 0),
            false,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I11);
    }

    /// I12: Spouse + siblings/nephews/nieces
    /// Spec §3.7: Art. 1001
    #[test]
    fn test_i12_spouse_plus_siblings() {
        let input = make_input(
            counts(0, 0, 1, 0),
            false,
            married_decedent(),
            true,  // has siblings/nephews
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I12);
    }

    /// I13: Siblings/nephews/nieces only
    /// Spec §3.7: Arts. 1003-1008
    #[test]
    fn test_i13_siblings_only() {
        let input = make_input(
            counts(0, 0, 0, 0),
            false,
            default_decedent(),
            true,  // has siblings/nephews
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I13);
    }

    /// I14: Other collaterals (≤5th degree)
    /// Spec §3.7: Arts. 1009-1010
    #[test]
    fn test_i14_other_collaterals() {
        let input = make_input(
            counts(0, 0, 0, 0),
            false,
            default_decedent(),
            false,
            true, // has other collaterals
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I14);
    }

    /// I15: No heirs → State
    /// Spec §3.7: Arts. 1011-1014
    #[test]
    fn test_i15_no_heirs_escheat() {
        let input = make_input(
            counts(0, 0, 0, 0),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I15);
    }

    // ====================================================================
    // EDGE CASES / SPEC-CRITICAL TESTS
    // ====================================================================

    /// Ascendants are excluded when any descendant (LC) exists.
    /// §4.2: "Groups 1 and 4 are mutually exclusive"
    /// Even if ascendants have lines, the scenario should be based on
    /// descendants (Regime A), not ascendants (Regime B).
    #[test]
    fn test_descendants_exclude_ascendants_testate() {
        // LC present + ascendants present → should be T1 (descendants dominate)
        let input = make_input(
            counts(2, 0, 0, 2),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        // Ascendants are excluded — this is Regime A, not Regime B
        assert_eq!(output.scenario_code, ScenarioCode::T1);
    }

    /// Same mutual exclusion for intestate: LC present means ascendants excluded.
    #[test]
    fn test_descendants_exclude_ascendants_intestate() {
        let input = make_input(
            counts(2, 0, 0, 2),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I1);
    }

    /// Single LC test vector TV-06: T1 with 2 LC
    /// Spec §14: TV-06 → T1
    #[test]
    fn test_tv06_scenario_t1() {
        let input = make_input(
            counts(2, 0, 0, 0),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T1);
    }

    /// TV-07: Preterition test — starts as T3 (3 LC + spouse, testate).
    /// The preterition detection itself is Step 6, but Step 3 should still
    /// classify as T3 given the line counts.
    /// Spec §14: TV-07 → T3 (before preterition converts to I2)
    #[test]
    fn test_tv07_scenario_t3_before_preterition() {
        // 3 LC (one omitted from will but still has a line) + spouse + will
        let input = make_input(
            counts(3, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T3);
    }

    /// TV-14: Mixed succession — Step 3 classifies as T3 initially.
    /// Mixed detection happens after Step 5.
    /// Spec §14: TV-14 → T3 preliminary (mixed determined later)
    #[test]
    fn test_tv14_scenario_t3_preliminary() {
        // 2 LC + spouse + will
        let input = make_input(
            counts(2, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T3);
        assert_eq!(output.succession_type, SuccessionType::Testate);
    }

    /// T5a boundary: exactly 1 LC + IC + spouse → T5a (not T5b)
    #[test]
    fn test_t5a_boundary_one_lc() {
        let input = make_input(
            counts(1, 1, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T5a);
    }

    /// T5b boundary: exactly 2 LC + IC + spouse → T5b (not T5a)
    #[test]
    fn test_t5b_boundary_two_lc() {
        let input = make_input(
            counts(2, 1, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T5b);
    }

    /// I12 takes priority over I11: spouse + siblings → I12, not I11.
    /// Even though spouse is present, siblings bump it to I12.
    #[test]
    fn test_i12_over_i11_when_siblings() {
        let input = make_input(
            counts(0, 0, 1, 0),
            false,
            married_decedent(),
            true, // siblings present
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I12);
    }

    /// I13 takes priority over I14: siblings present and other collaterals present → I13.
    #[test]
    fn test_i13_over_i14_when_siblings() {
        let input = make_input(
            counts(0, 0, 0, 0),
            false,
            default_decedent(),
            true, // siblings
            true, // collaterals
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I13);
    }

    /// Illegitimate decedent with only ascendants, intestate
    /// Should not produce I5 (regular ascendant scenario) — the Iron Curtain
    /// rule (Art. 992) and Art. 903 apply. However, the scenario code mapping
    /// for intestate illegitimate decedent with parents is still I5
    /// (parents inherit per Art. 903). The iron curtain filtering is Step 1/2.
    #[test]
    fn test_illegitimate_decedent_intestate_parents() {
        let input = make_input(
            counts(0, 0, 0, 2),
            false,
            illegitimate_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        // Parents of illegitimate decedent still produce I5 in intestate
        // (the Art. 903 special handling is in legitime computation)
        assert_eq!(output.scenario_code, ScenarioCode::I5);
    }

    /// T1 with single legitimate child (n=1)
    #[test]
    fn test_t1_single_lc() {
        let input = make_input(
            counts(1, 0, 0, 0),
            true,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::T1);
    }

    /// I1 with single legitimate child (n=1)
    #[test]
    fn test_i1_single_lc() {
        let input = make_input(
            counts(1, 0, 0, 0),
            false,
            default_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert_eq!(output.scenario_code, ScenarioCode::I1);
    }

    /// §14.2 Invariant 10: Scenario code must match surviving heir combination.
    /// This test verifies the scenario code is consistent for all testate Regime A combos.
    #[test]
    fn test_invariant10_regime_a_consistency() {
        // T1: LC only
        let t1 = step3_determine_scenario(&make_input(
            counts(2, 0, 0, 0), true, default_decedent(), false, false,
        ));
        assert_eq!(t1.scenario_code, ScenarioCode::T1);

        // T2: 1 LC + spouse
        let t2 = step3_determine_scenario(&make_input(
            counts(1, 0, 1, 0), true, married_decedent(), false, false,
        ));
        assert_eq!(t2.scenario_code, ScenarioCode::T2);

        // T4: LC + IC
        let t4 = step3_determine_scenario(&make_input(
            counts(1, 2, 0, 0), true, default_decedent(), false, false,
        ));
        assert_eq!(t4.scenario_code, ScenarioCode::T4);
    }

    /// Verify no warnings for clean scenario determination.
    #[test]
    fn test_no_warnings_clean_scenario() {
        let input = make_input(
            counts(2, 0, 1, 0),
            true,
            married_decedent(),
            false,
            false,
        );
        let output = step3_determine_scenario(&input);
        assert!(output.warnings.is_empty());
    }
}
