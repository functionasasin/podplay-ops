//! Step 7: Distribute Estate
//!
//! Given the succession type, scenario code, heir legitimes (Step 5),
//! validation results (Step 6), and the will (if any), this step computes
//! the per-heir distribution of the estate.
//!
//! Three modes:
//! 1. **Intestate** — Apply intestate formulas I1-I15 (§7.2) to entire net estate
//! 2. **Testate** — Compulsory heirs get legitimes; FP distributed per will
//! 3. **Mixed** — 3-phase: legitimes + will FP + undisposed FP intestate (§7.5)
//!
//! Spec references:
//!   - §7.1 Priority Hierarchy
//!   - §7.2 Distribution Formulas (I1-I15)
//!   - §7.3 Key Difference: No Cap in Intestate
//!   - §7.4 Iron Curtain Rule (Art. 992)
//!   - §7.5 Mixed Succession (Art. 960(2))
//!   - §7.6 Collateral Distribution Sub-Algorithm (Arts. 1003-1010)

use crate::fraction::{frac, Frac};
use crate::step2_lines::LineCounts;
use crate::step5_legitimes::{FreePortion, HeirLegitime};
use crate::step6_validation::Step6Output;
use crate::types::*;

// ── Types ───────────────────────────────────────────────────────────

/// Per-heir distribution result from Step 7.
#[derive(Debug, Clone)]
pub struct HeirDistribution {
    pub heir_id: HeirId,
    pub effective_category: EffectiveCategory,
    /// Amount from compulsory legitime (testate/mixed only).
    pub from_legitime: Frac,
    /// Amount from testamentary free portion dispositions (testate/mixed only).
    pub from_free_portion: Frac,
    /// Amount from intestate distribution (intestate or mixed Phase 3).
    pub from_intestate: Frac,
    /// Total share = from_legitime + from_free_portion + from_intestate.
    pub total: Frac,
    /// Legal basis articles.
    pub legal_basis: Vec<String>,
}

/// Will coverage analysis for mixed succession detection (§7.5).
#[derive(Debug, Clone)]
pub struct WillCoverage {
    /// Whether the will disposes of the entire free portion.
    pub disposes_of_entire_estate: bool,
    /// Total amount of FP consumed by will dispositions.
    pub total_will_from_fp: Frac,
    /// Undisposed portion of FP that passes intestate.
    pub undisposed_fp: Frac,
}

/// Input to Step 7.
#[derive(Debug, Clone)]
pub struct Step7Input {
    /// Net distributable estate (before collation adjustment).
    pub net_estate: Frac,
    /// Collation-adjusted estate base from Step 4.
    pub estate_base: Frac,
    /// All classified heirs.
    pub heirs: Vec<Heir>,
    /// Line counts from Step 2.
    pub line_counts: LineCounts,
    /// Scenario code from Step 3 (may be refined).
    pub scenario_code: ScenarioCode,
    /// Succession type (Intestate, Testate, Mixed, IntestateByPreterition).
    pub succession_type: SuccessionType,
    /// Per-heir legitimes from Step 5.
    pub heir_legitimes: Vec<HeirLegitime>,
    /// Free portion pipeline from Step 5.
    pub free_portion: FreePortion,
    /// Validation results from Step 6 (None if intestate).
    pub validation: Option<Step6Output>,
    /// The will (None if intestate).
    pub will: Option<Will>,
    /// Donations for collation reference.
    pub donations: Vec<Donation>,
}

/// Output of Step 7.
#[derive(Debug, Clone)]
pub struct Step7Output {
    /// Per-heir distribution shares.
    pub distributions: Vec<HeirDistribution>,
    /// Will coverage analysis (Some if testate/mixed).
    pub will_coverage: Option<WillCoverage>,
    /// Final succession type (may be refined from testate to mixed).
    pub final_succession_type: SuccessionType,
    /// Final scenario code for the intestate portion (if mixed).
    pub intestate_scenario: Option<ScenarioCode>,
    pub warnings: Vec<ManualFlag>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Main entry point: distribute the estate based on succession type.
pub fn step7_distribute(input: &Step7Input) -> Step7Output {
    todo!("Step 7: distribute estate")
}

/// Compute intestate distribution of a given amount among heirs using
/// the intestate formula for the given scenario code (I1-I15).
///
/// This is also used for Phase 3 of mixed succession (distributing undisposed FP).
pub fn compute_intestate_distribution(
    amount: &Frac,
    heirs: &[Heir],
    line_counts: &LineCounts,
    scenario: &ScenarioCode,
) -> Vec<HeirDistribution> {
    todo!("Intestate distribution for scenario {:?}", scenario)
}

/// Analyze will coverage to determine if succession is truly TESTATE or MIXED.
///
/// Must be called after Step 5 (needs FP_disposable) for definitive detection.
pub fn determine_will_coverage(
    will: &Will,
    estate_base: &Frac,
    heir_legitimes: &[HeirLegitime],
    free_portion: &FreePortion,
    heirs: &[Heir],
) -> WillCoverage {
    todo!("Will coverage analysis")
}

/// Distribute among collateral relatives using the sub-algorithm from §7.6.
///
/// Handles: siblings (full/half blood), nephews/nieces (per stirpes/per capita),
/// and other collaterals (nearest-degree, 5th-degree limit).
pub fn distribute_collaterals(
    amount: &Frac,
    heirs: &[Heir],
) -> Vec<HeirDistribution> {
    todo!("Collateral distribution sub-algorithm")
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fraction::frac;
    use crate::step2_lines::LineCounts;
    use crate::step5_legitimes::{FreePortion, HeirLegitime};

    // ── Helpers ─────────────────────────────────────────────────────

    fn make_lc(id: &str) -> Heir {
        Heir {
            id: id.into(),
            name: format!("LC-{}", id),
            raw_category: HeirCategory::LegitimateChild,
            effective_category: EffectiveCategory::LegitimateChildGroup,
            is_compulsory: true,
            is_alive: true,
            is_eligible: true,
            filiation_proved: true,
            filiation_proof_type: Some(FiliationProof::BirthCertificate),
            is_unworthy: false,
            unworthiness_condoned: false,
            is_disinherited: false,
            disinheritance_valid: false,
            has_renounced: false,
            adoption: None,
            has_valid_adoption: false,
            is_stepparent_adoptee: false,
            legal_separation_guilty: false,
            articulo_mortis_marriage: false,
            degree_from_decedent: 1,
            line: None,
            blood_type: None,
            representation_trigger: None,
            represented_by: vec![],
            represents: None,
            inherits_by: InheritanceMode::OwnRight,
            line_ancestor: None,
            children: vec![],
        }
    }

    fn make_ic(id: &str) -> Heir {
        Heir {
            raw_category: HeirCategory::IllegitimateChild,
            effective_category: EffectiveCategory::IllegitimateChildGroup,
            filiation_proved: true,
            filiation_proof_type: Some(FiliationProof::BirthCertificate),
            ..make_lc(id)
        }
    }

    fn make_spouse(id: &str) -> Heir {
        Heir {
            raw_category: HeirCategory::SurvivingSpouse,
            effective_category: EffectiveCategory::SurvivingSpouseGroup,
            ..make_lc(id)
        }
    }

    fn make_ascendant(id: &str, degree: i32, line: LineOfDescent) -> Heir {
        Heir {
            raw_category: HeirCategory::LegitimateParent,
            effective_category: EffectiveCategory::LegitimateAscendantGroup,
            degree_from_decedent: degree,
            line: Some(line),
            ..make_lc(id)
        }
    }

    fn make_sibling(id: &str, blood: BloodType) -> Heir {
        Heir {
            id: id.into(),
            name: format!("Sibling-{}", id),
            raw_category: HeirCategory::LegitimateChild, // placeholder
            effective_category: EffectiveCategory::LegitimateChildGroup, // placeholder
            is_compulsory: false,
            is_alive: true,
            is_eligible: true,
            filiation_proved: true,
            filiation_proof_type: Some(FiliationProof::BirthCertificate),
            is_unworthy: false,
            unworthiness_condoned: false,
            is_disinherited: false,
            disinheritance_valid: false,
            has_renounced: false,
            adoption: None,
            has_valid_adoption: false,
            is_stepparent_adoptee: false,
            legal_separation_guilty: false,
            articulo_mortis_marriage: false,
            degree_from_decedent: 2,
            line: None,
            blood_type: Some(blood),
            representation_trigger: None,
            represented_by: vec![],
            represents: None,
            inherits_by: InheritanceMode::OwnRight,
            line_ancestor: None,
            children: vec![],
        }
    }

    fn make_nephew(id: &str, parent_id: &str) -> Heir {
        Heir {
            represents: Some(parent_id.into()),
            inherits_by: InheritanceMode::Representation,
            line_ancestor: Some(parent_id.into()),
            degree_from_decedent: 3,
            ..make_sibling(id, BloodType::Full)
        }
    }

    fn estate(pesos: i64) -> Frac {
        frac(pesos * 100, 1)
    }

    /// Line counts shorthand
    fn lc(n_lc: usize, n_ic: usize, spouse: usize, asc: usize) -> LineCounts {
        LineCounts {
            legitimate_child: n_lc,
            illegitimate_child: n_ic,
            surviving_spouse: spouse,
            legitimate_ascendant: asc,
        }
    }

    /// Sum an iterator of Frac references using fold (Frac doesn't implement Sum).
    fn sum_fracs<'a>(iter: impl Iterator<Item = &'a Frac>) -> Frac {
        iter.fold(Frac::zero(), |acc, f| acc + f.clone())
    }

    fn find_share<'a>(distributions: &'a [HeirDistribution], heir_id: &str) -> &'a HeirDistribution {
        distributions
            .iter()
            .find(|d| d.heir_id == heir_id)
            .unwrap_or_else(|| panic!("No distribution found for heir '{}'", heir_id))
    }

    fn empty_will() -> Will {
        Will {
            institutions: vec![],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        }
    }

    fn make_institution(id: &str, heir_id: &str, share: ShareSpec) -> InstitutionOfHeir {
        InstitutionOfHeir {
            id: id.into(),
            heir: HeirReference {
                person_id: Some(heir_id.into()),
                name: format!("Heir-{}", heir_id),
                is_collective: false,
                class_designation: None,
            },
            share,
            conditions: vec![],
            substitutes: vec![],
            is_residuary: false,
        }
    }

    fn make_legacy(id: &str, legatee_id: &str, amount_pesos: i64) -> Legacy {
        Legacy {
            id: id.into(),
            legatee: HeirReference {
                person_id: Some(legatee_id.into()),
                name: format!("Legatee-{}", legatee_id),
                is_collective: false,
                class_designation: None,
            },
            property: LegacySpec::FixedAmount(Money::from_pesos(amount_pesos)),
            conditions: vec![],
            substitutes: vec![],
            is_preferred: false,
        }
    }

    fn make_heir_legitime(
        heir_id: &str,
        category: EffectiveCategory,
        fraction: Frac,
        amount: Frac,
    ) -> HeirLegitime {
        HeirLegitime {
            heir_id: heir_id.into(),
            effective_category: category,
            legitime_fraction: fraction,
            legitime_amount: amount,
            cap_applied: false,
            legal_basis: vec![],
        }
    }

    fn make_fp(fp_gross: Frac, spouse_fp: Frac, ic_fp: Frac, fp_disposable: Frac) -> FreePortion {
        FreePortion {
            fp_gross,
            spouse_from_fp: spouse_fp,
            ic_from_fp: ic_fp,
            fp_disposable,
            cap_triggered: false,
        }
    }

    // ================================================================
    // INTESTATE DISTRIBUTION FORMULAS (§7.2)
    // ================================================================

    // ── I1: n LC only (Art. 980) ────────────────────────────────────

    #[test]
    fn test_i1_single_lc_gets_entire_estate() {
        // E = 10M, 1 LC → LC gets 10M
        let e = estate(10_000_000);
        let heirs = vec![make_lc("A")];
        let counts = lc(1, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I1);

        assert_eq!(result.len(), 1);
        assert_eq!(find_share(&result, "A").from_intestate, e);
    }

    #[test]
    fn test_i1_three_lc_equal_shares() {
        // E = 12M, 3 LC → 4M each
        let e = estate(12_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_lc("C")];
        let counts = lc(3, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I1);

        assert_eq!(result.len(), 3);
        let expected = estate(4_000_000);
        assert_eq!(find_share(&result, "A").from_intestate, expected);
        assert_eq!(find_share(&result, "B").from_intestate, expected);
        assert_eq!(find_share(&result, "C").from_intestate, expected);
    }

    // ── I2: n LC + Spouse (Art. 996) ────────────────────────────────

    #[test]
    fn test_i2_tv02_three_lc_plus_spouse() {
        // TV-02: E = 12M, 3 LC + spouse → 3M each (spouse = one child's share)
        let e = estate(12_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_lc("C"), make_spouse("S")];
        let counts = lc(3, 0, 1, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I2);

        assert_eq!(result.len(), 4);
        let expected = estate(3_000_000);
        assert_eq!(find_share(&result, "A").from_intestate, expected);
        assert_eq!(find_share(&result, "B").from_intestate, expected);
        assert_eq!(find_share(&result, "C").from_intestate, expected);
        assert_eq!(find_share(&result, "S").from_intestate, expected);
    }

    #[test]
    fn test_i2_one_lc_plus_spouse() {
        // E = 10M, 1 LC + spouse → 5M each
        let e = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_spouse("S")];
        let counts = lc(1, 0, 1, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I2);

        assert_eq!(result.len(), 2);
        assert_eq!(find_share(&result, "A").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "S").from_intestate, estate(5_000_000));
    }

    // ── I3: n LC + m IC (Arts. 983, 895) ────────────────────────────

    #[test]
    fn test_i3_tv03_two_lc_one_ic_no_cap() {
        // TV-03: E = 10M, 2 LC + 1 IC → 4M/4M/2M
        // Units: 2*2 + 1 = 5, per_unit = 10M/5 = 2M
        let e = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_ic("C")];
        let counts = lc(2, 1, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I3);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "A").from_intestate, estate(4_000_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(4_000_000));
        assert_eq!(find_share(&result, "C").from_intestate, estate(2_000_000));
    }

    #[test]
    fn test_i3_one_lc_two_ic() {
        // E = 12M, 1 LC + 2 IC → units: 2+2=4, per_unit=3M
        // LC = 6M, each IC = 3M
        let e = estate(12_000_000);
        let heirs = vec![make_lc("A"), make_ic("B"), make_ic("C")];
        let counts = lc(1, 2, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I3);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "A").from_intestate, estate(6_000_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(3_000_000));
        assert_eq!(find_share(&result, "C").from_intestate, estate(3_000_000));
    }

    // ── I4: n LC + m IC + Spouse (Arts. 999, 983, 895) ─────────────

    #[test]
    fn test_i4_two_lc_one_ic_spouse() {
        // E = 14M, 2 LC + 1 IC + spouse
        // Spouse = 2 units (= 1 LC share)
        // Total units = 2*2 + 1 + 2 = 7, per_unit = 14M/7 = 2M
        // LC = 4M each, IC = 2M, Spouse = 4M
        let e = estate(14_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_ic("C"), make_spouse("S")];
        let counts = lc(2, 1, 1, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I4);

        assert_eq!(result.len(), 4);
        assert_eq!(find_share(&result, "A").from_intestate, estate(4_000_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(4_000_000));
        assert_eq!(find_share(&result, "C").from_intestate, estate(2_000_000));
        assert_eq!(find_share(&result, "S").from_intestate, estate(4_000_000));
    }

    #[test]
    fn test_i4_one_lc_one_ic_spouse() {
        // E = 10M, 1 LC + 1 IC + spouse
        // Units: 2 + 1 + 2 = 5, per_unit = 2M
        // LC = 4M, IC = 2M, Spouse = 4M
        let e = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_ic("B"), make_spouse("S")];
        let counts = lc(1, 1, 1, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I4);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "A").from_intestate, estate(4_000_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(2_000_000));
        assert_eq!(find_share(&result, "S").from_intestate, estate(4_000_000));
    }

    // ── I5: Ascendants only (Arts. 985-987) ─────────────────────────

    #[test]
    fn test_i5_single_parent_gets_all() {
        // E = 10M, 1 parent → gets entire estate
        let e = estate(10_000_000);
        let heirs = vec![make_ascendant("P", 1, LineOfDescent::Paternal)];
        let counts = lc(0, 0, 0, 1);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I5);

        assert_eq!(result.len(), 1);
        assert_eq!(find_share(&result, "P").from_intestate, e);
    }

    #[test]
    fn test_i5_two_parents_equal_shares() {
        // E = 10M, both parents → 5M each
        let e = estate(10_000_000);
        let heirs = vec![
            make_ascendant("F", 1, LineOfDescent::Paternal),
            make_ascendant("M", 1, LineOfDescent::Maternal),
        ];
        let counts = lc(0, 0, 0, 2);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I5);

        assert_eq!(result.len(), 2);
        assert_eq!(find_share(&result, "F").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "M").from_intestate, estate(5_000_000));
    }

    // ── I6: Ascendants + Spouse (Art. 997) ──────────────────────────

    #[test]
    fn test_i6_one_parent_plus_spouse() {
        // E = 10M, 1 parent + spouse → spouse 1/2 (5M), parent 1/2 (5M)
        let e = estate(10_000_000);
        let heirs = vec![
            make_ascendant("P", 1, LineOfDescent::Paternal),
            make_spouse("S"),
        ];
        let counts = lc(0, 0, 1, 1);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I6);

        assert_eq!(result.len(), 2);
        assert_eq!(find_share(&result, "P").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "S").from_intestate, estate(5_000_000));
    }

    #[test]
    fn test_i6_two_parents_plus_spouse() {
        // E = 10M, 2 parents + spouse → spouse 5M, parents 2.5M each
        let e = estate(10_000_000);
        let heirs = vec![
            make_ascendant("F", 1, LineOfDescent::Paternal),
            make_ascendant("M", 1, LineOfDescent::Maternal),
            make_spouse("S"),
        ];
        let counts = lc(0, 0, 1, 2);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I6);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "S").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "F").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "M").from_intestate, estate(2_500_000));
    }

    // ── I7: m IC only (Art. 988) ────────────────────────────────────

    #[test]
    fn test_i7_two_ic_equal_shares() {
        // E = 10M, 2 IC → 5M each
        let e = estate(10_000_000);
        let heirs = vec![make_ic("A"), make_ic("B")];
        let counts = lc(0, 2, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I7);

        assert_eq!(result.len(), 2);
        assert_eq!(find_share(&result, "A").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(5_000_000));
    }

    // ── I8: m IC + Spouse (Art. 998) ────────────────────────────────

    #[test]
    fn test_i8_two_ic_plus_spouse() {
        // E = 10M, 2 IC + spouse → spouse 5M, each IC 2.5M
        let e = estate(10_000_000);
        let heirs = vec![make_ic("A"), make_ic("B"), make_spouse("S")];
        let counts = lc(0, 2, 1, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I8);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "S").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "A").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(2_500_000));
    }

    // ── I9: Ascendants + m IC (Art. 991) ────────────────────────────

    #[test]
    fn test_i9_one_parent_two_ic() {
        // E = 10M, 1 parent + 2 IC → parent 5M, each IC 2.5M
        let e = estate(10_000_000);
        let heirs = vec![
            make_ascendant("P", 1, LineOfDescent::Paternal),
            make_ic("A"),
            make_ic("B"),
        ];
        let counts = lc(0, 2, 0, 1);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I9);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "P").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "A").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(2_500_000));
    }

    // ── I10: Ascendants + m IC + Spouse (Art. 1000) ─────────────────

    #[test]
    fn test_i10_parent_ic_spouse() {
        // E = 10M → asc 1/2 (5M), IC 1/4 (2.5M), spouse 1/4 (2.5M)
        let e = estate(10_000_000);
        let heirs = vec![
            make_ascendant("P", 1, LineOfDescent::Paternal),
            make_ic("A"),
            make_spouse("S"),
        ];
        let counts = lc(0, 1, 1, 1);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I10);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "P").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "A").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "S").from_intestate, estate(2_500_000));
    }

    #[test]
    fn test_i10_two_parents_two_ic_spouse() {
        // E = 20M → asc 1/2 (10M, 5M each), ICs 1/4 (5M, 2.5M each), spouse 1/4 (5M)
        let e = estate(20_000_000);
        let heirs = vec![
            make_ascendant("F", 1, LineOfDescent::Paternal),
            make_ascendant("M", 1, LineOfDescent::Maternal),
            make_ic("A"),
            make_ic("B"),
            make_spouse("S"),
        ];
        let counts = lc(0, 2, 1, 2);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I10);

        assert_eq!(result.len(), 5);
        assert_eq!(find_share(&result, "F").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "M").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "A").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "B").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "S").from_intestate, estate(5_000_000));
    }

    // ── I11: Spouse only (Art. 995) ─────────────────────────────────

    #[test]
    fn test_i11_spouse_gets_entire_estate() {
        // E = 10M, spouse only → spouse gets 10M
        let e = estate(10_000_000);
        let heirs = vec![make_spouse("S")];
        let counts = lc(0, 0, 1, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I11);

        assert_eq!(result.len(), 1);
        assert_eq!(find_share(&result, "S").from_intestate, e);
    }

    // ── I12: Spouse + Siblings/Nephews (Art. 1001) ──────────────────

    #[test]
    fn test_i12_spouse_plus_two_full_siblings() {
        // E = 10M → spouse 1/2 (5M), 2 full siblings split other 1/2 (2.5M each)
        let e = estate(10_000_000);
        let heirs = vec![
            make_spouse("S"),
            make_sibling("SB1", BloodType::Full),
            make_sibling("SB2", BloodType::Full),
        ];
        let counts = lc(0, 0, 1, 0); // collaterals not in LineCounts

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I12);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "S").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "SB1").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "SB2").from_intestate, estate(2_500_000));
    }

    // ── I13: Siblings only (Arts. 1003-1008) ────────────────────────

    #[test]
    fn test_i13_all_full_blood_siblings_equal() {
        // E = 9M, 3 full-blood siblings → 3M each
        let e = estate(9_000_000);
        let heirs = vec![
            make_sibling("SB1", BloodType::Full),
            make_sibling("SB2", BloodType::Full),
            make_sibling("SB3", BloodType::Full),
        ];
        let counts = lc(0, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I13);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "SB1").from_intestate, estate(3_000_000));
        assert_eq!(find_share(&result, "SB2").from_intestate, estate(3_000_000));
        assert_eq!(find_share(&result, "SB3").from_intestate, estate(3_000_000));
    }

    #[test]
    fn test_i13_mixed_full_half_blood_2_to_1() {
        // E = 10M, 2 full-blood + 1 half-blood → units: 2*2+1=5
        // per_unit = 2M. Full = 4M each, half = 2M
        let e = estate(10_000_000);
        let heirs = vec![
            make_sibling("FB1", BloodType::Full),
            make_sibling("FB2", BloodType::Full),
            make_sibling("HB1", BloodType::Half),
        ];
        let counts = lc(0, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I13);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "FB1").from_intestate, estate(4_000_000));
        assert_eq!(find_share(&result, "FB2").from_intestate, estate(4_000_000));
        assert_eq!(find_share(&result, "HB1").from_intestate, estate(2_000_000));
    }

    #[test]
    fn test_i13_all_half_blood_equal() {
        // E = 9M, 3 half-blood siblings → 3M each (Art. 1007: no line distinction)
        let e = estate(9_000_000);
        let heirs = vec![
            make_sibling("HB1", BloodType::Half),
            make_sibling("HB2", BloodType::Half),
            make_sibling("HB3", BloodType::Half),
        ];
        let counts = lc(0, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I13);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "HB1").from_intestate, estate(3_000_000));
        assert_eq!(find_share(&result, "HB2").from_intestate, estate(3_000_000));
        assert_eq!(find_share(&result, "HB3").from_intestate, estate(3_000_000));
    }

    // ── I15: No heirs → State ───────────────────────────────────────

    #[test]
    fn test_i15_state_escheat() {
        // E = 10M, no heirs → state gets entire estate
        let e = estate(10_000_000);
        let heirs: Vec<Heir> = vec![];
        let counts = lc(0, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I15);

        // State escheat: should produce a single distribution for "STATE"
        assert_eq!(result.len(), 1);
        assert_eq!(find_share(&result, "STATE").from_intestate, e);
    }

    // ================================================================
    // INTESTATE INVARIANTS
    // ================================================================

    #[test]
    fn test_intestate_sum_invariant_i1() {
        // Invariant 1: Σ shares = estate
        let e = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_lc("C")];
        let counts = lc(3, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I1);
        let total = sum_fracs(result.iter().map(|d| &d.from_intestate));
        assert_eq!(total, e);
    }

    #[test]
    fn test_intestate_sum_invariant_i4() {
        // Invariant 1: Σ shares = estate for more complex I4
        let e = estate(14_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_ic("C"), make_spouse("S")];
        let counts = lc(2, 1, 1, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I4);
        let total = sum_fracs(result.iter().map(|d| &d.from_intestate));
        assert_eq!(total, e);
    }

    #[test]
    fn test_intestate_2_to_1_ratio_invariant() {
        // Invariant 3: In intestate I3/I4, IC_share = exactly 1/2 * LC_share
        let e = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_ic("B")];
        let counts = lc(1, 1, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I3);

        let lc_share = &find_share(&result, "A").from_intestate;
        let ic_share = &find_share(&result, "B").from_intestate;
        // IC = 1/2 * LC in intestate (2:1 ratio)
        assert_eq!(ic_share.clone() * frac(2, 1), *lc_share);
    }

    // ================================================================
    // COLLATERAL DISTRIBUTION SUB-ALGORITHM (§7.6)
    // ================================================================

    #[test]
    fn test_collateral_siblings_per_stirpes_with_nephews() {
        // 1 living sibling (full blood) + 2 nephews of predeceased sibling (full blood)
        // E = 10M → 2 lines: living sibling gets 5M, each nephew gets 2.5M
        let e = estate(10_000_000);
        let mut predeceased = make_sibling("SB_DEAD", BloodType::Full);
        predeceased.is_alive = false;
        predeceased.representation_trigger = Some(RepresentationTrigger::Predecease);
        predeceased.represented_by = vec!["N1".into(), "N2".into()];

        let heirs = vec![
            make_sibling("SB1", BloodType::Full),
            make_nephew("N1", "SB_DEAD"),
            make_nephew("N2", "SB_DEAD"),
        ];

        let result = distribute_collaterals(&e, &heirs);

        assert_eq!(result.len(), 3);
        assert_eq!(find_share(&result, "SB1").from_intestate, estate(5_000_000));
        assert_eq!(find_share(&result, "N1").from_intestate, estate(2_500_000));
        assert_eq!(find_share(&result, "N2").from_intestate, estate(2_500_000));
    }

    #[test]
    fn test_collateral_full_half_blood_siblings_with_nephews() {
        // 1 full-blood sibling + 2 nephews of predeceased half-blood sibling
        // E = 10M → 2 lines, blood-weighted: full=2 units, half=1 unit
        // Total = 3 units, per_unit = 10M/3
        // Full sibling: 2/3 * 10M ≈ 6.666M
        // Each nephew (half line): (1/3 * 10M) / 2 ≈ 1.666M
        let e = estate(10_000_000);
        let heirs = vec![
            make_sibling("FB1", BloodType::Full),
            {
                let mut n = make_nephew("N1", "HB_DEAD");
                n.blood_type = Some(BloodType::Half);
                n
            },
            {
                let mut n = make_nephew("N2", "HB_DEAD");
                n.blood_type = Some(BloodType::Half);
                n
            },
        ];

        let result = distribute_collaterals(&e, &heirs);

        assert_eq!(result.len(), 3);
        // Full sibling: 2/3 of 10M = 20M/3 in centavos = 2_000_000_000/3
        let full_expected = frac(10_000_000 * 100 * 2, 3);
        let half_each = frac(10_000_000 * 100, 6); // (1/3 of E) / 2
        assert_eq!(find_share(&result, "FB1").from_intestate, full_expected);
        assert_eq!(find_share(&result, "N1").from_intestate, half_each);
        assert_eq!(find_share(&result, "N2").from_intestate, half_each);
    }

    // ================================================================
    // WILL COVERAGE ANALYSIS (§7.5)
    // ================================================================

    #[test]
    fn test_will_coverage_full_disposition() {
        // Will disposes entire FP → not mixed
        let e_base = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_spouse("S")];
        let fp = make_fp(
            estate(2_500_000), // fp_gross
            frac(0, 1),        // spouse_from_fp (already charged in legitime for T3)
            frac(0, 1),        // ic_from_fp
            estate(2_500_000), // fp_disposable
        );
        let heir_legitimes = vec![
            make_heir_legitime("A", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("B", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("S", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4), estate(2_500_000)),
        ];
        // Will gives entire FP to charity
        let will = Will {
            institutions: vec![make_institution("I1", "CHARITY", ShareSpec::EntireFreePort)],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let coverage = determine_will_coverage(&will, &e_base, &heir_legitimes, &fp, &heirs);

        assert!(coverage.disposes_of_entire_estate);
        assert_eq!(coverage.undisposed_fp, frac(0, 1));
    }

    #[test]
    fn test_will_coverage_partial_disposition_triggers_mixed() {
        // TV-14 setup: Will gives 1M out of 2.5M FP → undisposed 1.5M → MIXED
        let e_base = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_spouse("S")];
        let fp = make_fp(
            estate(2_500_000), // fp_gross (T3: estate - LC collective - spouse = 2.5M)
            frac(0, 1),
            frac(0, 1),
            estate(2_500_000), // fp_disposable
        );
        let heir_legitimes = vec![
            make_heir_legitime("A", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("B", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("S", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4), estate(2_500_000)),
        ];
        // Will gives only 1M legacy to charity (out of 2.5M FP)
        let will = Will {
            institutions: vec![],
            legacies: vec![make_legacy("L1", "CHARITY", 1_000_000)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let coverage = determine_will_coverage(&will, &e_base, &heir_legitimes, &fp, &heirs);

        assert!(!coverage.disposes_of_entire_estate);
        assert_eq!(coverage.undisposed_fp, estate(1_500_000));
    }

    #[test]
    fn test_will_coverage_residuary_clause_captures_all() {
        // A residuary clause captures undisposed FP → TESTATE, not mixed
        let e_base = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_spouse("S")];
        let fp = make_fp(estate(5_000_000), frac(0, 1), frac(0, 1), estate(5_000_000));
        let heir_legitimes = vec![
            make_heir_legitime("A", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("S", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4), estate(2_500_000)),
        ];
        let will = Will {
            institutions: vec![{
                let mut inst = make_institution("I1", "FRIEND", ShareSpec::Residuary);
                inst.is_residuary = true;
                inst
            }],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let coverage = determine_will_coverage(&will, &e_base, &heir_legitimes, &fp, &heirs);

        assert!(coverage.disposes_of_entire_estate);
        assert_eq!(coverage.undisposed_fp, frac(0, 1));
    }

    // ================================================================
    // MIXED SUCCESSION 3-PHASE (§7.5) — TV-14
    // ================================================================

    #[test]
    fn test_tv14_mixed_three_phase_distribution() {
        // TV-14: E = 10M, 2 LC (Belen, Cesar) + Spouse (Diana)
        // Will: 1M legacy to Charity A from FP
        // Scenario: T3/I2
        //
        // Phase 1 (legitimes): LC1=2.5M, LC2=2.5M, S=2.5M
        // Phase 2 (will): Charity=1M
        // Phase 3 (undisposed 1.5M per I2): 500K each to LC1, LC2, S
        //
        // Final: LC1=3M, LC2=3M, S=3M, Charity=1M → total=10M

        let heirs = vec![make_lc("Belen"), make_lc("Cesar"), make_spouse("Diana")];
        let heir_legitimes = vec![
            make_heir_legitime("Belen", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("Cesar", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("Diana", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4), estate(2_500_000)),
        ];
        let fp = make_fp(estate(2_500_000), frac(0, 1), frac(0, 1), estate(2_500_000));
        let will = Will {
            institutions: vec![],
            legacies: vec![make_legacy("L1", "CharityA", 1_000_000)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let input = Step7Input {
            net_estate: estate(10_000_000),
            estate_base: estate(10_000_000),
            heirs: heirs.clone(),
            line_counts: lc(2, 0, 1, 0),
            scenario_code: ScenarioCode::T3,
            succession_type: SuccessionType::Testate, // will be refined to Mixed
            heir_legitimes,
            free_portion: fp,
            validation: None,
            will: Some(will),
            donations: vec![],
        };

        let result = step7_distribute(&input);

        // Succession type should be refined to Mixed
        assert_eq!(result.final_succession_type, SuccessionType::Mixed);

        // Verify per-heir shares
        let belen = find_share(&result.distributions, "Belen");
        assert_eq!(belen.from_legitime, estate(2_500_000));
        assert_eq!(belen.from_intestate, estate(500_000));
        assert_eq!(belen.total, estate(3_000_000));

        let cesar = find_share(&result.distributions, "Cesar");
        assert_eq!(cesar.from_legitime, estate(2_500_000));
        assert_eq!(cesar.from_intestate, estate(500_000));
        assert_eq!(cesar.total, estate(3_000_000));

        let diana = find_share(&result.distributions, "Diana");
        assert_eq!(diana.from_legitime, estate(2_500_000));
        assert_eq!(diana.from_intestate, estate(500_000));
        assert_eq!(diana.total, estate(3_000_000));

        let charity = find_share(&result.distributions, "CharityA");
        assert_eq!(charity.from_free_portion, estate(1_000_000));
        assert_eq!(charity.total, estate(1_000_000));

        // Invariant 1: sum = estate
        let total = sum_fracs(result.distributions.iter().map(|d| &d.total));
        assert_eq!(total, estate(10_000_000));
    }

    // ================================================================
    // TESTATE DISTRIBUTION
    // ================================================================

    #[test]
    fn test_testate_compulsory_heirs_get_legitime_voluntary_gets_fp() {
        // E = 10M, T1: 2 LC only, will gives FP to charity
        // LC collective = 1/2 E = 5M, FP = 5M
        // Each LC: 2.5M, Charity: 5M
        let heirs = vec![make_lc("A"), make_lc("B")];
        let heir_legitimes = vec![
            make_heir_legitime("A", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("B", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
        ];
        let fp = make_fp(estate(5_000_000), frac(0, 1), frac(0, 1), estate(5_000_000));
        let will = Will {
            institutions: vec![make_institution("I1", "CHARITY", ShareSpec::EntireFreePort)],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let input = Step7Input {
            net_estate: estate(10_000_000),
            estate_base: estate(10_000_000),
            heirs,
            line_counts: lc(2, 0, 0, 0),
            scenario_code: ScenarioCode::T1,
            succession_type: SuccessionType::Testate,
            heir_legitimes,
            free_portion: fp,
            validation: None,
            will: Some(will),
            donations: vec![],
        };

        let result = step7_distribute(&input);

        assert_eq!(result.final_succession_type, SuccessionType::Testate);

        let a = find_share(&result.distributions, "A");
        assert_eq!(a.from_legitime, estate(2_500_000));
        assert_eq!(a.from_free_portion, frac(0, 1));
        assert_eq!(a.total, estate(2_500_000));

        let b = find_share(&result.distributions, "B");
        assert_eq!(b.from_legitime, estate(2_500_000));
        assert_eq!(b.total, estate(2_500_000));

        let charity = find_share(&result.distributions, "CHARITY");
        assert_eq!(charity.from_free_portion, estate(5_000_000));
        assert_eq!(charity.total, estate(5_000_000));

        // Sum = estate
        let total = sum_fracs(result.distributions.iter().map(|d| &d.total));
        assert_eq!(total, estate(10_000_000));
    }

    #[test]
    fn test_testate_no_will_dispositions_all_to_legitime() {
        // Will exists but is empty (all dispositions may have been annulled)
        // Compulsory heirs get their legitimes; undisposed FP goes intestate → MIXED
        let heirs = vec![make_lc("A"), make_spouse("S")];
        let heir_legitimes = vec![
            make_heir_legitime("A", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("S", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4), estate(2_500_000)),
        ];
        let fp = make_fp(estate(5_000_000), frac(0, 1), frac(0, 1), estate(5_000_000));

        let input = Step7Input {
            net_estate: estate(10_000_000),
            estate_base: estate(10_000_000),
            heirs,
            line_counts: lc(1, 0, 1, 0),
            scenario_code: ScenarioCode::T2,
            succession_type: SuccessionType::Testate,
            heir_legitimes,
            free_portion: fp,
            validation: None,
            will: Some(empty_will()),
            donations: vec![],
        };

        let result = step7_distribute(&input);

        // Empty will → undisposed FP → Mixed (or intestate distribution of FP)
        assert_eq!(result.final_succession_type, SuccessionType::Mixed);

        // Sum = estate
        let total = sum_fracs(result.distributions.iter().map(|d| &d.total));
        assert_eq!(total, estate(10_000_000));
    }

    // ================================================================
    // INTESTATE BY PRETERITION
    // ================================================================

    #[test]
    fn test_intestate_by_preterition_ignores_will() {
        // When preterition detected, ALL institutions annulled → distribute entirely intestate
        // E = 12M, 3 LC + spouse (I2 formula) → 3M each
        let heirs = vec![make_lc("A"), make_lc("B"), make_lc("C"), make_spouse("S")];
        let heir_legitimes = vec![]; // irrelevant for intestate by preterition
        let fp = make_fp(frac(0, 1), frac(0, 1), frac(0, 1), frac(0, 1));

        let input = Step7Input {
            net_estate: estate(12_000_000),
            estate_base: estate(12_000_000),
            heirs,
            line_counts: lc(3, 0, 1, 0),
            scenario_code: ScenarioCode::I2, // intestate scenario after preterition
            succession_type: SuccessionType::IntestateByPreterition,
            heir_legitimes,
            free_portion: fp,
            validation: None,
            will: None, // will is irrelevant
            donations: vec![],
        };

        let result = step7_distribute(&input);

        assert_eq!(result.final_succession_type, SuccessionType::IntestateByPreterition);

        let expected = estate(3_000_000);
        assert_eq!(find_share(&result.distributions, "A").total, expected);
        assert_eq!(find_share(&result.distributions, "B").total, expected);
        assert_eq!(find_share(&result.distributions, "C").total, expected);
        assert_eq!(find_share(&result.distributions, "S").total, expected);

        // Sum = estate
        let total = sum_fracs(result.distributions.iter().map(|d| &d.total));
        assert_eq!(total, estate(12_000_000));
    }

    // ================================================================
    // EDGE CASES
    // ================================================================

    #[test]
    fn test_intestate_odd_split_exact_fractions() {
        // E = 10M, 3 LC → each gets 10M/3 (not evenly divisible, but exact fraction)
        let e = estate(10_000_000);
        let heirs = vec![make_lc("A"), make_lc("B"), make_lc("C")];
        let counts = lc(3, 0, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I1);

        let expected = frac(10_000_000 * 100, 3); // exact fraction
        assert_eq!(find_share(&result, "A").from_intestate, expected);
        assert_eq!(find_share(&result, "B").from_intestate, expected);
        assert_eq!(find_share(&result, "C").from_intestate, expected);

        // Sum still exact
        let total = sum_fracs(result.iter().map(|d| &d.from_intestate));
        assert_eq!(total, e);
    }

    #[test]
    fn test_intestate_single_heir_gets_all() {
        // Single IC inherits entire estate (I7 with m=1)
        let e = estate(5_000_000);
        let heirs = vec![make_ic("A")];
        let counts = lc(0, 1, 0, 0);

        let result = compute_intestate_distribution(&e, &heirs, &counts, &ScenarioCode::I7);

        assert_eq!(result.len(), 1);
        assert_eq!(find_share(&result, "A").from_intestate, e);
    }

    #[test]
    fn test_mixed_intestate_scenario_uses_same_heir_pool() {
        // In mixed succession, Phase 3 intestate uses the SAME heir pool
        // E=10M, 2 LC + spouse, will gives 500K to charity, FP=2.5M
        // Undisposed = 2M → I2 among same 3 heirs
        let heirs = vec![make_lc("A"), make_lc("B"), make_spouse("S")];
        let heir_legitimes = vec![
            make_heir_legitime("A", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("B", EffectiveCategory::LegitimateChildGroup, frac(1, 4), estate(2_500_000)),
            make_heir_legitime("S", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4), estate(2_500_000)),
        ];
        let fp = make_fp(estate(2_500_000), frac(0, 1), frac(0, 1), estate(2_500_000));
        let will = Will {
            institutions: vec![],
            legacies: vec![make_legacy("L1", "CHARITY", 500_000)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let input = Step7Input {
            net_estate: estate(10_000_000),
            estate_base: estate(10_000_000),
            heirs,
            line_counts: lc(2, 0, 1, 0),
            scenario_code: ScenarioCode::T3,
            succession_type: SuccessionType::Testate,
            heir_legitimes,
            free_portion: fp,
            validation: None,
            will: Some(will),
            donations: vec![],
        };

        let result = step7_distribute(&input);

        assert_eq!(result.final_succession_type, SuccessionType::Mixed);

        // Undisposed = 2.5M - 500K = 2M, split 3 ways (I2) = 2M/3 each
        let a = find_share(&result.distributions, "A");
        let b = find_share(&result.distributions, "B");
        let s = find_share(&result.distributions, "S");
        let undisposed_per_heir = frac(2_000_000 * 100, 3);
        assert_eq!(a.from_intestate, undisposed_per_heir);
        assert_eq!(b.from_intestate, undisposed_per_heir);
        assert_eq!(s.from_intestate, undisposed_per_heir);

        // Charity gets only FP portion
        let charity = find_share(&result.distributions, "CHARITY");
        assert_eq!(charity.from_free_portion, estate(500_000));

        // Sum = estate
        let total = sum_fracs(result.distributions.iter().map(|d| &d.total));
        assert_eq!(total, estate(10_000_000));
    }
}
