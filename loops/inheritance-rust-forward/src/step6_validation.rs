//! Step 6: Testate Validation
//!
//! Runs a five-check ordered pipeline on a testate will:
//! 1. Preterition (Art. 854) — omitted compulsory heir annuls ALL institutions
//! 2. Disinheritance Validity (Arts. 915-922) — 4-check validity gate
//! 3. Underprovision (Art. 855) — compulsory heir receives < legitime
//! 4. Inofficiousness (Arts. 908-912) — dispositions exceed free portion
//! 5. Condition Stripping (Art. 872) — conditions on legitime are void
//!
//! Spec references:
//!   - §9 Testate Validation (Step 6)
//!   - §9.1 Five-Check Ordered Pipeline
//!   - §9.1 Art. 911 Three-Phase Reduction Algorithm
//!   - §9.2 Art. 912 Indivisible Realty Algorithm

use crate::fraction::{frac, Frac};
use crate::step5_legitimes::{FreePortion, HeirLegitime};
use crate::types::*;

// ── Types ───────────────────────────────────────────────────────────

/// Input to Step 6.
#[derive(Debug, Clone)]
pub struct Step6Input {
    /// The will being validated.
    pub will: Will,
    /// All classified heirs from Step 1.
    pub heirs: Vec<Heir>,
    /// Per-heir legitimes from Step 5.
    pub heir_legitimes: Vec<HeirLegitime>,
    /// Free portion pipeline result from Step 5.
    pub free_portion: FreePortion,
    /// Collation-adjusted estate base from Step 4.
    pub estate_base: Frac,
    /// Net distributable estate (before collation).
    pub net_estate: Frac,
    /// All donations (for inofficiousness check).
    pub donations: Vec<Donation>,
    /// Current scenario code from Step 3.
    pub scenario_code: ScenarioCode,
}

/// Output of Step 6.
#[derive(Debug, Clone)]
pub struct Step6Output {
    /// Result of preterition check.
    pub preterition: PreteritionResult,
    /// Per-disinheritance validity results.
    pub disinheritance_results: Vec<DisinheritanceValidityResult>,
    /// Per-heir underprovision results.
    pub underprovision_results: Vec<UnderprovisionResult>,
    /// Inofficiousness reduction result.
    pub inofficiousness: InofficiousnessResult,
    /// Per-heir condition stripping results.
    pub condition_stripping: Vec<ConditionStrippingResult>,
    /// Whether the pipeline was terminated early by preterition.
    pub preterition_terminates: bool,
    /// If preterition or invalid disinheritance triggers intestate fallback.
    pub succession_type_override: Option<SuccessionType>,
    /// Warnings / manual review flags.
    pub warnings: Vec<ManualFlag>,
}

/// Result of Check 1: Preterition (Art. 854).
#[derive(Debug, Clone)]
pub struct PreteritionResult {
    /// Whether preterition was detected.
    pub detected: bool,
    /// IDs of preterited heirs (direct-line compulsory heirs totally omitted).
    pub preterited_heirs: Vec<HeirId>,
    /// All institutions are annulled if preterition detected.
    pub institutions_annulled: bool,
    /// Legacies/devises survive unless separately inofficious.
    pub legacies_devises_survive: bool,
    /// Legal basis citation.
    pub legal_basis: Vec<String>,
}

/// Result of Check 2: Disinheritance validity for a single heir.
#[derive(Debug, Clone)]
pub struct DisinheritanceValidityResult {
    /// The heir being disinherited.
    pub heir_id: HeirId,
    /// Whether the disinheritance is valid (all 4 checks pass).
    pub is_valid: bool,
    /// Whether the heir is in the will.
    pub in_will: bool,
    /// Whether a cause is specified.
    pub cause_specified: bool,
    /// Whether the cause is proven.
    pub cause_proven: bool,
    /// Whether reconciliation has occurred (invalidates if true).
    pub reconciliation: bool,
    /// If valid: descendants may represent (Art. 923).
    pub descendants_represent: bool,
    /// If invalid: heir reinstated with full legitime.
    pub heir_reinstated: bool,
    /// Whether this triggers a pipeline restart.
    pub triggers_restart: bool,
    /// Legal basis.
    pub legal_basis: Vec<String>,
}

/// Result of Check 3: Underprovision for a single heir (Art. 855).
#[derive(Debug, Clone)]
pub struct UnderprovisionResult {
    /// The underprovided heir.
    pub heir_id: HeirId,
    /// Their legitime from Step 5.
    pub legitime_amount: Frac,
    /// What the will gives them.
    pub will_provision: Frac,
    /// The shortfall (legitime - provision). Zero if no underprovision.
    pub shortfall: Frac,
    /// Recovery from the undisposed portion.
    pub recovery_from_undisposed: Frac,
    /// Recovery from other compulsory heirs' excess.
    pub recovery_from_compulsory_excess: Frac,
    /// Recovery from voluntary heirs' shares.
    pub recovery_from_voluntary: Frac,
    /// Total recovery.
    pub total_recovery: Frac,
    /// Whether full recovery was achieved.
    pub fully_recovered: bool,
}

/// Reduction phase in the Art. 911 algorithm.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReductionPhase {
    /// Phase 1a: Non-preferred legacies/devises reduced pro rata.
    Phase1a,
    /// Phase 1b: Preferred legacies/devises reduced pro rata.
    Phase1b,
    /// Phase 2: Voluntary institutions reduced pro rata.
    Phase2,
    /// Phase 3: Donations reduced reverse-chronologically.
    Phase3,
}

/// A single reduction action within the inofficiousness resolution.
#[derive(Debug, Clone)]
pub struct Reduction {
    /// ID of the disposition or donation being reduced.
    pub target_id: String,
    /// Which phase this reduction belongs to.
    pub phase: ReductionPhase,
    /// Amount before reduction.
    pub original_amount: Frac,
    /// How much was cut.
    pub reduction_amount: Frac,
    /// Amount after reduction.
    pub remaining_amount: Frac,
    /// Legal basis citation.
    pub legal_basis: String,
}

/// Result of Check 4: Inofficiousness (Arts. 908-912).
#[derive(Debug, Clone)]
pub struct InofficiousnessResult {
    /// Whether inofficiousness was detected.
    pub detected: bool,
    /// The excess amount (dispositions + donations - FP_disposable).
    pub excess: Frac,
    /// All reductions applied.
    pub reductions: Vec<Reduction>,
    /// Total reduced amount.
    pub total_reduced: Frac,
    /// Unresolved excess after all phases (should be 0 if solvent).
    pub unresolved_excess: Frac,
    /// Which phases were used.
    pub phases_used: Vec<ReductionPhase>,
}

/// Result of Check 5: Condition stripping for a single heir (Art. 872).
#[derive(Debug, Clone)]
pub struct ConditionStrippingResult {
    /// The heir whose conditions are stripped.
    pub heir_id: HeirId,
    /// The disposition that had conditions.
    pub disposition_id: DispositionId,
    /// The unconditional legitime portion.
    pub unconditional_legitime_portion: Frac,
    /// The conditional free portion (conditions remain only here).
    pub conditional_fp_portion: Frac,
    /// Conditions that were stripped from the legitime portion.
    pub stripped_conditions: Vec<String>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Run the five-check testate validation pipeline.
///
/// Checks run in strict order; preterition (Check 1) terminates the pipeline
/// if detected.
pub fn step6_validate_will(input: &Step6Input) -> Step6Output {
    todo!("Step 6: testate validation pipeline")
}

/// Check 1: Preterition (Art. 854).
///
/// Detects whether any direct-line compulsory heir is totally omitted from
/// the will (no institution, no legacy, no devise, no disinheritance mention).
///
/// Scope: Only LC, IC, adopted, legitimated, ascendants. Spouse omission
/// is NEVER preterition.
pub fn check_preterition(will: &Will, heirs: &[Heir]) -> PreteritionResult {
    todo!("Check 1: preterition detection")
}

/// Check 2: Validate a single disinheritance (Arts. 915-922).
///
/// 4-check validity gate:
/// 1. In the will? (Art. 916)
/// 2. Cause specified? (Art. 916)
/// 3. Cause proven? (Art. 917)
/// 4. No reconciliation? (Art. 922)
pub fn check_disinheritance_validity(
    disinheritance: &Disinheritance,
    heirs: &[Heir],
) -> DisinheritanceValidityResult {
    todo!("Check 2: disinheritance validity")
}

/// Check 3: Underprovision (Art. 855).
///
/// Detects compulsory heirs who receive less than their legitime from the
/// will, and applies the recovery waterfall:
/// 1. Undisposed portion of estate
/// 2. Pro rata from other compulsory heirs' excess
/// 3. Pro rata from voluntary heirs' shares
pub fn check_underprovision(
    will: &Will,
    heirs: &[Heir],
    heir_legitimes: &[HeirLegitime],
    free_portion: &FreePortion,
    estate_base: &Frac,
) -> Vec<UnderprovisionResult> {
    todo!("Check 3: underprovision detection and recovery")
}

/// Check 4: Inofficiousness (Arts. 908-912).
///
/// Detects whether testamentary dispositions + collatable donations exceed
/// the free portion, and applies the Art. 911 three-phase reduction.
pub fn check_inofficiousness(
    will: &Will,
    donations: &[Donation],
    free_portion: &FreePortion,
    estate_base: &Frac,
) -> InofficiousnessResult {
    todo!("Check 4: inofficiousness detection and reduction")
}

/// Art. 911 three-phase reduction algorithm.
///
/// Reduces dispositions in strict order:
/// Phase 1a: Non-preferred legacies/devises pro rata
/// Phase 1b: Preferred legacies/devises pro rata
/// Phase 2: Voluntary institutions pro rata
/// Phase 3: Donations reverse-chronologically
pub fn reduce_inofficious(
    excess: &Frac,
    will: &Will,
    donations: &[Donation],
) -> (Vec<Reduction>, Frac) {
    todo!("Art. 911 three-phase reduction")
}

/// Check 5: Condition stripping (Art. 872).
///
/// Conditions imposed on a compulsory heir's legitime portion are void.
/// Splits the heir's share into unconditional legitime + conditional FP.
pub fn strip_conditions(
    will: &Will,
    heirs: &[Heir],
    heir_legitimes: &[HeirLegitime],
) -> Vec<ConditionStrippingResult> {
    todo!("Check 5: condition stripping")
}

/// Compute the total amount a will provision gives to a specific heir.
///
/// Sums institutions + legacies + devises addressed to the heir.
pub fn will_provision_for_heir(
    will: &Will,
    heir_id: &str,
    estate_base: &Frac,
) -> Frac {
    todo!("Compute will provision for a specific heir")
}

/// Determine whether a direct-line compulsory heir is "addressed" in the will.
///
/// A heir is addressed if they appear in any institution, legacy, devise,
/// or disinheritance clause. Being addressed defeats preterition.
pub fn heir_addressed_in_will(will: &Will, heir_id: &str) -> bool {
    todo!("Check if heir is addressed in will")
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fraction::frac;
    use crate::step5_legitimes::HeirLegitime;

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

    fn estate(pesos: i64) -> Frac {
        frac(pesos * 100, 1)
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

    fn make_legacy(id: &str, legatee_id: &str, amount_pesos: i64, preferred: bool) -> Legacy {
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
            is_preferred: preferred,
        }
    }

    fn make_devise(id: &str, devisee_id: &str, preferred: bool) -> Devise {
        Devise {
            id: id.into(),
            devisee: HeirReference {
                person_id: Some(devisee_id.into()),
                name: format!("Devisee-{}", devisee_id),
                is_collective: false,
                class_designation: None,
            },
            property: DeviseSpec::SpecificProperty("asset-1".into()),
            conditions: vec![],
            substitutes: vec![],
            is_preferred: preferred,
        }
    }

    fn make_disinheritance(
        heir_id: &str,
        cause: DisinheritanceCause,
        specified: bool,
        proven: bool,
        reconciled: bool,
    ) -> Disinheritance {
        Disinheritance {
            heir_reference: HeirReference {
                person_id: Some(heir_id.into()),
                name: format!("Heir-{}", heir_id),
                is_collective: false,
                class_designation: None,
            },
            cause_code: cause,
            cause_specified_in_will: specified,
            cause_proven: proven,
            reconciliation_occurred: reconciled,
        }
    }

    fn make_heir_legitime(heir_id: &str, amount: Frac) -> HeirLegitime {
        HeirLegitime {
            heir_id: heir_id.into(),
            effective_category: EffectiveCategory::LegitimateChildGroup,
            legitime_fraction: frac(1, 2),
            legitime_amount: amount,
            cap_applied: false,
            legal_basis: vec!["Art. 888".into()],
        }
    }

    fn make_donation(
        id: &str,
        recipient_id: Option<&str>,
        pesos: i64,
        date: &str,
    ) -> Donation {
        Donation {
            id: id.into(),
            recipient_heir_id: recipient_id.map(|s| s.into()),
            recipient_is_stranger: recipient_id.is_none(),
            value_at_time_of_donation: Money::from_pesos(pesos),
            date: date.into(),
            description: format!("Donation {}", id),
            is_expressly_exempt: false,
            is_support_education_medical: false,
            is_customary_gift: false,
            is_professional_expense: false,
            professional_expense_parent_required: false,
            professional_expense_imputed_savings: None,
            is_joint_from_both_parents: false,
            is_to_child_spouse_only: false,
            is_joint_to_child_and_spouse: false,
            is_wedding_gift: false,
            is_debt_payment_for_child: false,
            is_election_expense: false,
            is_fine_payment: false,
        }
    }

    fn make_fp(fp_disposable_pesos: i64) -> FreePortion {
        let fp = estate(fp_disposable_pesos);
        FreePortion {
            fp_gross: fp.clone(),
            spouse_from_fp: Frac::zero(),
            ic_from_fp: Frac::zero(),
            fp_disposable: fp,
            cap_triggered: false,
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Check 1: Preterition (Art. 854)
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn test_preterition_detected_lc_omitted() {
        // One LC is totally omitted — no institution, no legacy, no devise,
        // no disinheritance mention. Preterition detected.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        // Will only addresses lc1
        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::EntireEstate)],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(result.detected, "Preterition should be detected when LC is omitted");
        assert!(result.preterited_heirs.contains(&"lc2".to_string()));
        assert!(result.institutions_annulled, "All institutions must be annulled");
    }

    #[test]
    fn test_preterition_annuls_all_institutions_tv07() {
        // TV-07: 3 LC + spouse, will institutes only lc1 and lc2.
        // lc3 is totally omitted → preterition → ALL institutions annulled.
        // E=₱12M → intestate distribution ₱3M each.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let lc3 = make_lc("lc3");
        let sp = make_spouse("sp");
        let heirs = vec![lc1, lc2, lc3, sp];

        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 3))),
                make_institution("i2", "lc2", ShareSpec::Fraction(frac(1, 3))),
                // lc3 totally omitted, sp omitted (but spouse ≠ preterition)
            ],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(result.detected);
        assert_eq!(result.preterited_heirs, vec!["lc3".to_string()]);
        assert!(result.institutions_annulled);
        // Legacies/devises survive (if any)
        assert!(result.legacies_devises_survive);
    }

    #[test]
    fn test_preterition_spouse_omission_never_preterition() {
        // Spouse is a compulsory heir but NOT a direct-line heir.
        // Spouse omission → Art. 855 underprovision, NOT preterition.
        let lc1 = make_lc("lc1");
        let sp = make_spouse("sp");
        let heirs = vec![lc1, sp];

        // Will addresses lc1 but not spouse
        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::EntireEstate)],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(!result.detected, "Spouse omission is never preterition");
        assert!(result.preterited_heirs.is_empty());
    }

    #[test]
    fn test_preterition_token_legacy_defeats_preterition() {
        // Art. 855: A ₱1 token legacy means the heir is not "totally omitted",
        // so preterition does not apply (underprovision applies instead).
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::EntireEstate)],
            legacies: vec![make_legacy("leg1", "lc2", 1, false)], // ₱1 token
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(!result.detected, "Token legacy defeats preterition");
    }

    #[test]
    fn test_preterition_invalid_disinheritance_not_preterition() {
        // If the heir is mentioned in a disinheritance clause (even invalid),
        // they are "addressed" in the will → NOT preterition.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::EntireEstate)],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![make_disinheritance(
                "lc2",
                DisinheritanceCause::ChildAttemptOnLife,
                true,
                false, // not proven → invalid disinheritance
                false,
            )],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(
            !result.detected,
            "Invalid disinheritance still addresses heir → no preterition"
        );
    }

    #[test]
    fn test_preterition_ic_omitted() {
        // Illegitimate children are also direct-line compulsory heirs.
        // Omitting an IC triggers preterition.
        let lc1 = make_lc("lc1");
        let ic1 = make_ic("ic1");
        let heirs = vec![lc1, ic1];

        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::EntireEstate)],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(result.detected, "Omitted IC triggers preterition");
        assert!(result.preterited_heirs.contains(&"ic1".to_string()));
    }

    #[test]
    fn test_preterition_ascendant_omitted() {
        // Ascendants are direct-line compulsory heirs (when no descendants exist).
        // Omitting them triggers preterition.
        let parent = make_ascendant("p1", 1, LineOfDescent::Paternal);
        let heirs = vec![parent];

        let will = Will {
            institutions: vec![
                make_institution("i1", "stranger", ShareSpec::EntireEstate),
            ],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(result.detected, "Omitted ascendant triggers preterition");
        assert!(result.preterited_heirs.contains(&"p1".to_string()));
    }

    #[test]
    fn test_preterition_no_omission_all_addressed() {
        // All compulsory heirs are addressed — no preterition.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2))),
                make_institution("i2", "lc2", ShareSpec::Fraction(frac(1, 2))),
            ],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let result = check_preterition(&will, &heirs);
        assert!(!result.detected);
        assert!(result.preterited_heirs.is_empty());
    }

    // ═══════════════════════════════════════════════════════════════
    // Check 2: Disinheritance Validity (Arts. 915-922)
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn test_disinheritance_valid_all_checks_pass() {
        // All 4 checks pass: in will, cause specified, cause proven, no reconciliation.
        let lc1 = make_lc("lc1");
        let heirs = vec![lc1];

        let dis = make_disinheritance(
            "lc1",
            DisinheritanceCause::ChildAttemptOnLife,
            true,  // cause specified
            true,  // cause proven
            false, // no reconciliation
        );

        let result = check_disinheritance_validity(&dis, &heirs);
        assert!(result.is_valid, "All 4 checks pass → valid disinheritance");
        assert!(
            result.descendants_represent,
            "Art. 923: descendants may represent"
        );
        assert!(!result.heir_reinstated);
    }

    #[test]
    fn test_disinheritance_valid_tv08() {
        // TV-08: Disinheritance + representation.
        // E=₱16M, 3 LC lines + spouse + friend.
        // LC Karen validly disinherited (maltreatment, Art. 919(6)).
        // Karen's 2 children represent her.
        let mut karen = make_lc("karen");
        karen.is_disinherited = true;
        karen.children = vec!["luis".into(), "maria".into()];
        let heirs = vec![karen];

        let dis = make_disinheritance(
            "karen",
            DisinheritanceCause::ChildMaltreatment,
            true,
            true,
            false,
        );

        let result = check_disinheritance_validity(&dis, &heirs);
        assert!(result.is_valid);
        assert!(result.descendants_represent);
        assert!(!result.heir_reinstated);
    }

    #[test]
    fn test_disinheritance_invalid_cause_not_proven() {
        // Cause specified but not proven → invalid (Art. 917).
        let lc1 = make_lc("lc1");
        let heirs = vec![lc1];

        let dis = make_disinheritance(
            "lc1",
            DisinheritanceCause::ChildAttemptOnLife,
            true,
            false, // NOT proven
            false,
        );

        let result = check_disinheritance_validity(&dis, &heirs);
        assert!(!result.is_valid, "Unproven cause → invalid");
        assert!(result.heir_reinstated, "Invalid → heir reinstated with full legitime");
    }

    #[test]
    fn test_disinheritance_invalid_cause_not_specified() {
        // Cause not specified in the will → invalid (Art. 916).
        let lc1 = make_lc("lc1");
        let heirs = vec![lc1];

        let dis = make_disinheritance(
            "lc1",
            DisinheritanceCause::ChildAttemptOnLife,
            false, // NOT specified
            true,
            false,
        );

        let result = check_disinheritance_validity(&dis, &heirs);
        assert!(!result.is_valid, "Cause not specified → invalid");
        assert!(result.heir_reinstated);
    }

    #[test]
    fn test_disinheritance_invalid_reconciliation() {
        // All valid but reconciliation occurred → invalid (Art. 922).
        let lc1 = make_lc("lc1");
        let heirs = vec![lc1];

        let dis = make_disinheritance(
            "lc1",
            DisinheritanceCause::ChildAttemptOnLife,
            true,
            true,
            true, // reconciliation
        );

        let result = check_disinheritance_validity(&dis, &heirs);
        assert!(!result.is_valid, "Reconciliation → invalid disinheritance");
        assert!(result.heir_reinstated);
    }

    #[test]
    fn test_disinheritance_valid_no_spouse_representation() {
        // Art. 923: No representation for disinherited spouse.
        // If a spouse is disinherited, they simply get 0 and nobody represents.
        let sp = make_spouse("sp");
        let heirs = vec![sp];

        let dis = make_disinheritance(
            "sp",
            DisinheritanceCause::SpouseAttemptOnLife,
            true,
            true,
            false,
        );

        let result = check_disinheritance_validity(&dis, &heirs);
        assert!(result.is_valid);
        // Spouse cannot be represented — no descendants_represent flag
        assert!(
            !result.descendants_represent,
            "No representation for disinherited spouse"
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // Check 3: Underprovision (Art. 855)
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn test_underprovision_heir_gets_less_than_legitime() {
        // Will gives lc2 only ₱1M but their legitime is ₱2.5M.
        // Shortfall = ₱1.5M.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2))),
            ],
            legacies: vec![make_legacy("leg1", "lc2", 1_000_000, false)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let e = estate(10_000_000);
        let heir_legitimes = vec![
            make_heir_legitime("lc1", estate(2_500_000)),
            make_heir_legitime("lc2", estate(2_500_000)),
        ];
        let fp = FreePortion {
            fp_gross: estate(5_000_000),
            spouse_from_fp: Frac::zero(),
            ic_from_fp: Frac::zero(),
            fp_disposable: estate(5_000_000),
            cap_triggered: false,
        };

        let results = check_underprovision(&will, &heirs, &heir_legitimes, &fp, &e);

        let lc2_result = results.iter().find(|r| r.heir_id == "lc2");
        assert!(lc2_result.is_some(), "lc2 should have underprovision result");
        let r = lc2_result.unwrap();
        assert!(r.shortfall > Frac::zero(), "lc2 should have a shortfall");
        assert_eq!(r.shortfall, estate(1_500_000));
    }

    #[test]
    fn test_underprovision_no_shortfall() {
        // Both heirs receive at least their legitime — no underprovision.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2))),
                make_institution("i2", "lc2", ShareSpec::Fraction(frac(1, 2))),
            ],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let e = estate(10_000_000);
        let heir_legitimes = vec![
            make_heir_legitime("lc1", estate(2_500_000)),
            make_heir_legitime("lc2", estate(2_500_000)),
        ];
        let fp = make_fp(5_000_000);

        let results = check_underprovision(&will, &heirs, &heir_legitimes, &fp, &e);
        // All shortfalls should be zero
        for r in &results {
            assert!(
                r.shortfall == Frac::zero(),
                "No underprovision when will provides >= legitime"
            );
        }
    }

    #[test]
    fn test_underprovision_spouse_recovery_tv12() {
        // TV-12: Inofficious legacy reduced, spouse underprovision recovery.
        // This test verifies that an underprovided spouse triggers recovery.
        // E=₱10M, T2 scenario (1 LC + Spouse).
        // Spouse legitime = E/4 = ₱2.5M. Will gives spouse ₱1M.
        let lc1 = make_lc("lc1");
        let sp = make_spouse("sp");
        let heirs = vec![lc1, sp];

        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2))),
            ],
            legacies: vec![make_legacy("leg1", "sp", 1_000_000, false)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let e = estate(10_000_000);
        let heir_legitimes = vec![
            make_heir_legitime("lc1", estate(5_000_000)),
            {
                let mut hl = make_heir_legitime("sp", estate(2_500_000));
                hl.effective_category = EffectiveCategory::SurvivingSpouseGroup;
                hl
            },
        ];
        let fp = FreePortion {
            fp_gross: estate(5_000_000),
            spouse_from_fp: estate(2_500_000),
            ic_from_fp: Frac::zero(),
            fp_disposable: estate(2_500_000),
            cap_triggered: false,
        };

        let results = check_underprovision(&will, &heirs, &heir_legitimes, &fp, &e);
        let sp_result = results.iter().find(|r| r.heir_id == "sp");
        assert!(sp_result.is_some());
        let r = sp_result.unwrap();
        assert_eq!(r.shortfall, estate(1_500_000), "Spouse shortfall = ₱2.5M - ₱1M");
    }

    // ═══════════════════════════════════════════════════════════════
    // Check 4: Inofficiousness (Arts. 908-912)
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn test_inofficiousness_detected_excess() {
        // FP_disposable = ₱2.5M, but will gives ₱4M to voluntary heir.
        // excess = ₱4M - ₱2.5M = ₱1.5M.
        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2))),
            ],
            legacies: vec![make_legacy("leg1", "friend", 4_000_000, false)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let fp = make_fp(2_500_000);
        let e = estate(10_000_000);

        let result = check_inofficiousness(&will, &[], &fp, &e);
        assert!(result.detected, "Inofficiousness should be detected");
        assert_eq!(result.excess, estate(1_500_000));
    }

    #[test]
    fn test_inofficiousness_not_detected_within_fp() {
        // Will only disposes ₱1M from FP, which is within ₱2.5M FP_disposable.
        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2))),
            ],
            legacies: vec![make_legacy("leg1", "friend", 1_000_000, false)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let fp = make_fp(2_500_000);
        let e = estate(10_000_000);

        let result = check_inofficiousness(&will, &[], &fp, &e);
        assert!(!result.detected, "No inofficiousness within FP");
        assert!(result.reductions.is_empty());
    }

    #[test]
    fn test_inofficiousness_donations_increase_excess() {
        // FP_disposable = ₱2.5M. Will gives ₱1M legacy. Collatable donation = ₱2M.
        // Total dispositions = ₱1M + ₱2M = ₱3M > ₱2.5M → excess = ₱0.5M.
        let will = Will {
            institutions: vec![],
            legacies: vec![make_legacy("leg1", "friend", 1_000_000, false)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let donations = vec![make_donation("d1", Some("lc1"), 2_000_000, "2024-01-01")];
        let fp = make_fp(2_500_000);
        let e = estate(10_000_000);

        let result = check_inofficiousness(&will, &donations, &fp, &e);
        assert!(result.detected);
        assert_eq!(result.excess, estate(500_000));
    }

    // ═══════════════════════════════════════════════════════════════
    // Art. 911 Three-Phase Reduction Algorithm
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn test_reduction_phase1a_non_preferred_pro_rata() {
        // Two non-preferred legacies of ₱2M each. Excess = ₱1M.
        // Each should be reduced by ₱0.5M (pro rata).
        let will = Will {
            institutions: vec![],
            legacies: vec![
                make_legacy("leg1", "friend1", 2_000_000, false),
                make_legacy("leg2", "friend2", 2_000_000, false),
            ],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let excess = estate(1_000_000);
        let (reductions, remaining) = reduce_inofficious(&excess, &will, &[]);

        assert_eq!(remaining, Frac::zero(), "All excess should be absorbed");
        assert_eq!(reductions.len(), 2);
        for r in &reductions {
            assert_eq!(r.phase, ReductionPhase::Phase1a);
            assert_eq!(r.reduction_amount, estate(500_000));
            assert_eq!(r.remaining_amount, estate(1_500_000));
        }
    }

    #[test]
    fn test_reduction_preferred_only_after_non_preferred_exhausted() {
        // Non-preferred legacy: ₱1M. Preferred legacy: ₱2M. Excess = ₱1.5M.
        // Phase 1a: non-preferred fully consumed (₱1M reduced).
        // Phase 1b: preferred reduced by ₱0.5M.
        let will = Will {
            institutions: vec![],
            legacies: vec![
                make_legacy("leg1", "friend1", 1_000_000, false),  // non-preferred
                make_legacy("leg2", "friend2", 2_000_000, true),   // preferred
            ],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let excess = estate(1_500_000);
        let (reductions, remaining) = reduce_inofficious(&excess, &will, &[]);

        assert_eq!(remaining, Frac::zero());
        assert!(reductions.len() >= 2);

        let phase1a: Vec<_> = reductions.iter().filter(|r| r.phase == ReductionPhase::Phase1a).collect();
        let phase1b: Vec<_> = reductions.iter().filter(|r| r.phase == ReductionPhase::Phase1b).collect();

        assert_eq!(phase1a.len(), 1);
        assert_eq!(phase1a[0].reduction_amount, estate(1_000_000)); // fully consumed

        assert_eq!(phase1b.len(), 1);
        assert_eq!(phase1b[0].reduction_amount, estate(500_000));
        assert_eq!(phase1b[0].remaining_amount, estate(1_500_000));
    }

    #[test]
    fn test_reduction_phase2_voluntary_institutions() {
        // No legacies/devises. Voluntary institution: ₱3M. Excess = ₱1M.
        // Phase 2: voluntary reduced by ₱1M.
        let will = Will {
            institutions: vec![{
                let mut inst = make_institution("i1", "friend", ShareSpec::Fraction(frac(1, 1)));
                inst.is_residuary = false;
                inst
            }],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let excess = estate(1_000_000);
        let (reductions, remaining) = reduce_inofficious(&excess, &will, &[]);

        assert_eq!(remaining, Frac::zero());
        assert!(!reductions.is_empty());
        for r in &reductions {
            assert_eq!(r.phase, ReductionPhase::Phase2);
        }
    }

    #[test]
    fn test_reduction_phase3_donations_reverse_chronological() {
        // No testamentary dispositions. Two collatable donations:
        // d1 (2023, ₱2M) and d2 (2024, ₱1M). Excess = ₱1.5M.
        // Phase 3: d2 (most recent) fully consumed first (₱1M),
        // then d1 reduced by ₱0.5M.
        let will = empty_will();
        let donations = vec![
            make_donation("d1", Some("lc1"), 2_000_000, "2023-01-01"),
            make_donation("d2", Some("lc1"), 1_000_000, "2024-01-01"),
        ];

        let excess = estate(1_500_000);
        let (reductions, remaining) = reduce_inofficious(&excess, &will, &donations);

        assert_eq!(remaining, Frac::zero());
        assert_eq!(reductions.len(), 2);

        // Most recent (d2) should be first and fully consumed
        assert_eq!(reductions[0].target_id, "d2");
        assert_eq!(reductions[0].reduction_amount, estate(1_000_000));
        assert_eq!(reductions[0].remaining_amount, Frac::zero());
        assert_eq!(reductions[0].phase, ReductionPhase::Phase3);

        // Older (d1) partially reduced
        assert_eq!(reductions[1].target_id, "d1");
        assert_eq!(reductions[1].reduction_amount, estate(500_000));
        assert_eq!(reductions[1].remaining_amount, estate(1_500_000));
        assert_eq!(reductions[1].phase, ReductionPhase::Phase3);
    }

    #[test]
    fn test_reduction_stops_when_excess_absorbed() {
        // Non-preferred legacy ₱5M. Excess = ₱1M.
        // Only 1 reduction needed; donation should NOT be touched.
        let will = Will {
            institutions: vec![],
            legacies: vec![make_legacy("leg1", "friend", 5_000_000, false)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };
        let donations = vec![make_donation("d1", Some("lc1"), 3_000_000, "2024-01-01")];

        let excess = estate(1_000_000);
        let (reductions, remaining) = reduce_inofficious(&excess, &will, &donations);

        assert_eq!(remaining, Frac::zero());
        // Only the legacy should be reduced, not the donation
        assert!(reductions.iter().all(|r| r.phase == ReductionPhase::Phase1a));
        assert!(reductions.iter().all(|r| r.target_id == "leg1"));
    }

    // ═══════════════════════════════════════════════════════════════
    // Check 5: Condition Stripping (Art. 872)
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn test_condition_stripping_compulsory_heir() {
        // Art. 872: conditions on a compulsory heir's legitime are void.
        // Institution for lc1 with a suspensive condition should be split:
        // - Unconditional legitime portion
        // - Conditional FP portion only
        let lc1 = make_lc("lc1");
        let heirs = vec![lc1];

        let will = Will {
            institutions: vec![InstitutionOfHeir {
                id: "i1".into(),
                heir: HeirReference {
                    person_id: Some("lc1".into()),
                    name: "LC-lc1".into(),
                    is_collective: false,
                    class_designation: None,
                },
                share: ShareSpec::EntireEstate,
                conditions: vec![Condition {
                    condition_type: ConditionType::Suspensive,
                    description: "Must pass the bar exam".into(),
                    status: ConditionStatus::Pending,
                }],
                substitutes: vec![],
                is_residuary: false,
            }],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let heir_legitimes = vec![make_heir_legitime("lc1", estate(5_000_000))];

        let results = strip_conditions(&will, &heirs, &heir_legitimes);
        assert!(!results.is_empty(), "Should produce condition stripping result");
        let r = &results[0];
        assert_eq!(r.heir_id, "lc1");
        assert!(!r.stripped_conditions.is_empty());
    }

    #[test]
    fn test_condition_stripping_no_conditions() {
        // No conditions on any institution → no stripping results.
        let lc1 = make_lc("lc1");
        let heirs = vec![lc1];

        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2)))],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let heir_legitimes = vec![make_heir_legitime("lc1", estate(5_000_000))];
        let results = strip_conditions(&will, &heirs, &heir_legitimes);
        assert!(results.is_empty(), "No conditions → no stripping");
    }

    #[test]
    fn test_condition_stripping_voluntary_heir_keeps_conditions() {
        // Conditions on a voluntary (non-compulsory) heir's share are valid.
        // Only compulsory heirs get condition stripping.
        let mut stranger = make_lc("stranger");
        stranger.is_compulsory = false;
        stranger.raw_category = HeirCategory::LegitimateChild; // placeholder
        let heirs = vec![stranger];

        let will = Will {
            institutions: vec![InstitutionOfHeir {
                id: "i1".into(),
                heir: HeirReference {
                    person_id: Some("stranger".into()),
                    name: "Stranger".into(),
                    is_collective: false,
                    class_designation: None,
                },
                share: ShareSpec::Fraction(frac(1, 4)),
                conditions: vec![Condition {
                    condition_type: ConditionType::Suspensive,
                    description: "Some condition".into(),
                    status: ConditionStatus::Pending,
                }],
                substitutes: vec![],
                is_residuary: false,
            }],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        // No heir legitime for stranger (they're not compulsory)
        let results = strip_conditions(&will, &heirs, &[]);
        assert!(
            results.is_empty(),
            "Voluntary heir's conditions are NOT stripped"
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // Pipeline behavior
    // ═══════════════════════════════════════════════════════════════

    #[test]
    fn test_pipeline_preterition_terminates() {
        // When preterition is detected, the pipeline should terminate
        // after Check 1. Checks 2-5 should not run.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::EntireEstate)],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let e = estate(10_000_000);
        let heir_legitimes = vec![
            make_heir_legitime("lc1", estate(2_500_000)),
            make_heir_legitime("lc2", estate(2_500_000)),
        ];
        let fp = make_fp(5_000_000);

        let input = Step6Input {
            will,
            heirs,
            heir_legitimes,
            free_portion: fp,
            estate_base: e.clone(),
            net_estate: e,
            donations: vec![],
            scenario_code: ScenarioCode::T1,
        };

        let output = step6_validate_will(&input);
        assert!(output.preterition_terminates, "Preterition terminates pipeline");
        assert!(output.preterition.detected);
        assert!(output.preterition.institutions_annulled);
        assert_eq!(
            output.succession_type_override,
            Some(SuccessionType::IntestateByPreterition)
        );
        // Checks 2-5 should be empty/default
        assert!(output.disinheritance_results.is_empty());
        assert!(output.underprovision_results.is_empty());
        assert!(!output.inofficiousness.detected);
        assert!(output.condition_stripping.is_empty());
    }

    #[test]
    fn test_pipeline_no_preterition_runs_all_checks() {
        // When no preterition, all 5 checks should run.
        let lc1 = make_lc("lc1");
        let lc2 = make_lc("lc2");
        let heirs = vec![lc1, lc2];

        let will = Will {
            institutions: vec![
                make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2))),
                make_institution("i2", "lc2", ShareSpec::Fraction(frac(1, 2))),
            ],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        let e = estate(10_000_000);
        let heir_legitimes = vec![
            make_heir_legitime("lc1", estate(2_500_000)),
            make_heir_legitime("lc2", estate(2_500_000)),
        ];
        let fp = make_fp(5_000_000);

        let input = Step6Input {
            will,
            heirs,
            heir_legitimes,
            free_portion: fp,
            estate_base: e.clone(),
            net_estate: e,
            donations: vec![],
            scenario_code: ScenarioCode::T1,
        };

        let output = step6_validate_will(&input);
        assert!(!output.preterition_terminates);
        assert!(!output.preterition.detected);
        // No succession type override needed
        assert!(output.succession_type_override.is_none());
    }

    #[test]
    fn test_heir_addressed_in_will_by_institution() {
        let will = Will {
            institutions: vec![make_institution("i1", "lc1", ShareSpec::Fraction(frac(1, 2)))],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        assert!(heir_addressed_in_will(&will, "lc1"));
        assert!(!heir_addressed_in_will(&will, "lc2"));
    }

    #[test]
    fn test_heir_addressed_in_will_by_legacy() {
        let will = Will {
            institutions: vec![],
            legacies: vec![make_legacy("leg1", "lc1", 1_000_000, false)],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        assert!(heir_addressed_in_will(&will, "lc1"));
    }

    #[test]
    fn test_heir_addressed_in_will_by_devise() {
        let will = Will {
            institutions: vec![],
            legacies: vec![],
            devises: vec![make_devise("dev1", "lc1", false)],
            disinheritances: vec![],
            date_executed: "2025-01-01".into(),
        };

        assert!(heir_addressed_in_will(&will, "lc1"));
    }

    #[test]
    fn test_heir_addressed_in_will_by_disinheritance() {
        let will = Will {
            institutions: vec![],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![make_disinheritance(
                "lc1",
                DisinheritanceCause::ChildAttemptOnLife,
                true,
                true,
                false,
            )],
            date_executed: "2025-01-01".into(),
        };

        assert!(heir_addressed_in_will(&will, "lc1"));
    }
}
