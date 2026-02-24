//! Step 4: Compute Estate Base (Collation Add)
//!
//! Adds back collatable inter vivos donations to the net estate to produce
//! the adjusted estate base used for all legitime computations (Steps 5-6).
//!
//! Spec references:
//!   - §8.1 Estate Base Computation (Art. 908): estate_base = net_estate + Σ(collatable)
//!   - §8.2 Who Must Collate (Art. 1061): only compulsory heirs with co-heirs
//!   - §8.3 Collatability Matrix / Decision Tree (Arts. 1062-1072)

use crate::fraction::{money_to_frac, Frac};
use crate::types::*;

// ── Types ────────────────────────────────────────────────────────────

/// Where a collatable donation is charged against.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChargeTarget {
    /// Charged against the donee-heir's legitime (Arts. 909-910).
    Legitime,
    /// Charged against the free portion (Art. 909 ¶2 — strangers, excess).
    FreePortion,
    /// Not collatable — no charge.
    None,
}

/// Result of the collatability determination for a single donation.
#[derive(Debug, Clone)]
pub struct CollatabilityResult {
    pub donation_id: DonationId,
    pub recipient_heir_id: Option<HeirId>,
    /// Whether this donation's value is added to the estate base.
    pub collatable: bool,
    /// The amount added to estate base (0 if not collatable).
    pub collatable_amount: Frac,
    /// Where this donation is charged (legitime vs free portion).
    pub charge_target: ChargeTarget,
    /// Legal basis / reason for the determination.
    pub reason: String,
    /// Even if not collatable, inofficiousness must still be checked (Art. 1062).
    pub still_check_inofficiousness: bool,
}

/// Input to Step 4.
#[derive(Debug, Clone)]
pub struct Step4Input {
    /// Net distributable estate converted to exact fraction.
    pub net_estate: Frac,
    /// All inter vivos donations declared by the user.
    pub donations: Vec<Donation>,
    /// Classified heirs from Step 1.
    pub heirs: Vec<Heir>,
}

/// Output of Step 4.
#[derive(Debug, Clone)]
pub struct Step4Output {
    /// Adjusted estate base = net_estate + Σ(collatable donations).
    pub estate_base: Frac,
    /// Per-donation collatability results.
    pub donation_results: Vec<CollatabilityResult>,
    /// Sum of all collatable donation amounts.
    pub total_collatable: Frac,
    pub warnings: Vec<ManualFlag>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Compute the adjusted estate base by evaluating each donation's collatability
/// and adding collatable amounts to the net estate.
///
/// estate_base = net_estate + Σ(collatable_donations at donation-time value)
///
/// This adjusted base is used for ALL legitime computations (Steps 5-6).
pub fn step4_compute_estate_base(input: &Step4Input) -> Step4Output {
    todo!("Step 4: compute estate base with collation")
}

/// Determine whether a single donation is collatable under the §8.3 decision tree.
///
/// This handles all cases from the collatability matrix:
/// - Art. 1061: sole compulsory heir exempt
/// - Art. 1067: support/education/medical/customary exempt
/// - Art. 1066: spouse-only donations exempt; joint gifts ½ collatable
/// - Art. 1072: joint from both parents → ½
/// - Art. 1068: professional education conditional
/// - Art. 1070: wedding gifts not collatable for estate base
/// - Art. 1062: donor express exemption (still check inofficiousness)
/// - Art. 1069: debt/election/fine always collatable
/// - Art. 909/910: standard gifts collatable
pub fn determine_collatability(
    donation: &Donation,
    heir: &Heir,
    all_heirs: &[Heir],
) -> CollatabilityResult {
    todo!("Determine collatability for a single donation")
}

// ── Tests ────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fraction::frac;
    use num_bigint::BigInt;

    // ── Test Helpers ─────────────────────────────────────────────────

    fn make_heir(id: &str, eff_cat: EffectiveCategory, is_compulsory: bool) -> Heir {
        Heir {
            id: id.to_string(),
            name: id.to_string(),
            raw_category: match eff_cat {
                EffectiveCategory::LegitimateChildGroup => HeirCategory::LegitimateChild,
                EffectiveCategory::IllegitimateChildGroup => HeirCategory::IllegitimateChild,
                EffectiveCategory::SurvivingSpouseGroup => HeirCategory::SurvivingSpouse,
                EffectiveCategory::LegitimateAscendantGroup => HeirCategory::LegitimateParent,
            },
            effective_category: eff_cat,
            is_compulsory,
            is_alive: true,
            is_eligible: true,
            filiation_proved: true,
            filiation_proof_type: None,
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

    fn make_lc(id: &str) -> Heir {
        make_heir(id, EffectiveCategory::LegitimateChildGroup, true)
    }

    fn make_ic(id: &str) -> Heir {
        make_heir(id, EffectiveCategory::IllegitimateChildGroup, true)
    }

    fn make_spouse(id: &str) -> Heir {
        make_heir(id, EffectiveCategory::SurvivingSpouseGroup, true)
    }

    fn make_ascendant(id: &str) -> Heir {
        make_heir(id, EffectiveCategory::LegitimateAscendantGroup, true)
    }

    /// Standard donation with all flags defaulting to false/None.
    fn make_donation(id: &str, recipient_heir_id: Option<&str>, value_pesos: i64) -> Donation {
        Donation {
            id: id.to_string(),
            recipient_heir_id: recipient_heir_id.map(|s| s.to_string()),
            recipient_is_stranger: recipient_heir_id.is_none(),
            value_at_time_of_donation: Money::from_pesos(value_pesos),
            date: "2020-01-01".to_string(),
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

    /// Convert pesos to centavo Frac (e.g., 1_000_000 pesos → 100_000_000 centavos).
    fn pesos(p: i64) -> Frac {
        money_to_frac(&BigInt::from(p * 100))
    }

    fn make_step4_input(net_pesos: i64, donations: Vec<Donation>, heirs: Vec<Heir>) -> Step4Input {
        Step4Input {
            net_estate: pesos(net_pesos),
            donations,
            heirs,
        }
    }

    // ── §8.1: Basic estate base computation ──────────────────────────

    #[test]
    fn test_no_donations_estate_base_equals_net() {
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let input = make_step4_input(10_000_000, vec![], heirs);
        let output = step4_compute_estate_base(&input);

        assert_eq!(output.estate_base, pesos(10_000_000));
        assert_eq!(output.total_collatable, Frac::zero());
        assert!(output.donation_results.is_empty());
    }

    #[test]
    fn test_single_collatable_donation_adds_to_base() {
        // Net ₱10M + ₱2M donation to LC → estate_base = ₱12M
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let donations = vec![make_donation("d1", Some("lc1"), 2_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert_eq!(output.estate_base, pesos(12_000_000));
        assert_eq!(output.total_collatable, pesos(2_000_000));
    }

    #[test]
    fn test_multiple_donations_sum_correctly() {
        // Net ₱10M + ₱1M + ₱2M + ₱3M = ₱16M
        let heirs = vec![make_lc("lc1"), make_lc("lc2"), make_lc("lc3")];
        let donations = vec![
            make_donation("d1", Some("lc1"), 1_000_000),
            make_donation("d2", Some("lc2"), 2_000_000),
            make_donation("d3", Some("lc3"), 3_000_000),
        ];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert_eq!(output.estate_base, pesos(16_000_000));
        assert_eq!(output.total_collatable, pesos(6_000_000));
        assert_eq!(output.donation_results.len(), 3);
    }

    // ── §8.2: Who must collate ───────────────────────────────────────

    #[test]
    fn test_sole_compulsory_heir_exempt_from_collation() {
        // Art. 1061: sole compulsory heir → no equalization needed → not collatable
        let heirs = vec![make_lc("lc1")];
        let donations = vec![make_donation("d1", Some("lc1"), 5_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert_eq!(output.estate_base, pesos(10_000_000));
        assert_eq!(output.total_collatable, Frac::zero());
        assert!(!output.donation_results[0].collatable);
    }

    #[test]
    fn test_stranger_donation_always_collatable() {
        // Art. 909 ¶2: stranger donation → always added to base, charged to FP
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", None, 3_000_000);
        donation.recipient_is_stranger = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert_eq!(output.estate_base, pesos(13_000_000));
        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].charge_target, ChargeTarget::FreePortion);
    }

    #[test]
    fn test_compulsory_heir_with_co_heirs_collatable() {
        // Standard donation to LC with other compulsory co-heirs → collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let donations = vec![make_donation("d1", Some("lc1"), 2_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].charge_target, ChargeTarget::Legitime);
    }

    // ── §8.3: Collatability matrix — exempt categories ───────────────

    #[test]
    fn test_support_education_medical_exempt() {
        // Art. 1067: support/education/medical → not collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 500_000);
        donation.is_support_education_medical = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(!output.donation_results[0].collatable);
        assert_eq!(output.estate_base, pesos(10_000_000));
    }

    #[test]
    fn test_customary_gift_exempt() {
        // Art. 1067: customary/ordinary gift → not collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 100_000);
        donation.is_customary_gift = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(!output.donation_results[0].collatable);
    }

    #[test]
    fn test_spouse_only_donation_exempt() {
        // Art. 1066: gift to child's spouse only → not collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 1_000_000);
        donation.is_to_child_spouse_only = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(!output.donation_results[0].collatable);
    }

    // ── §8.3: Joint gifts — half collatable ──────────────────────────

    #[test]
    fn test_joint_gift_to_child_and_spouse_half_collatable() {
        // Art. 1066 ¶2: joint gift to child + spouse → only ½ collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 4_000_000);
        donation.is_joint_to_child_and_spouse = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].collatable_amount, pesos(2_000_000));
        // estate_base = 10M + 2M = 12M
        assert_eq!(output.estate_base, pesos(12_000_000));
    }

    #[test]
    fn test_joint_from_both_parents_half_collatable() {
        // Art. 1072: joint from both parents → ½ to this estate
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 6_000_000);
        donation.is_joint_from_both_parents = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].collatable_amount, pesos(3_000_000));
        assert_eq!(output.estate_base, pesos(13_000_000));
    }

    // ── §8.3: Professional education — conditional ───────────────────

    #[test]
    fn test_professional_education_default_exempt() {
        // Art. 1068: professional education, parent NOT required → exempt
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 2_000_000);
        donation.is_professional_expense = true;
        donation.professional_expense_parent_required = false;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(!output.donation_results[0].collatable);
    }

    #[test]
    fn test_professional_education_parent_required_collatable() {
        // Art. 1068: professional education, parent required → collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 2_000_000);
        donation.is_professional_expense = true;
        donation.professional_expense_parent_required = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].collatable_amount, pesos(2_000_000));
    }

    #[test]
    fn test_professional_education_with_imputed_savings() {
        // Art. 1068: professional education, parent required, with imputed savings deducted
        // Donation ₱2M, imputed savings ₱500K → collatable amount = ₱1.5M
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 2_000_000);
        donation.is_professional_expense = true;
        donation.professional_expense_parent_required = true;
        donation.professional_expense_imputed_savings = Some(Money::from_pesos(500_000));
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].collatable_amount, pesos(1_500_000));
        assert_eq!(output.estate_base, pesos(11_500_000));
    }

    #[test]
    fn test_professional_education_imputed_savings_exceeds_value() {
        // Art. 1068: imputed savings > donation value → collatable amount = 0
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 1_000_000);
        donation.is_professional_expense = true;
        donation.professional_expense_parent_required = true;
        donation.professional_expense_imputed_savings = Some(Money::from_pesos(2_000_000));
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        // max(donation - savings, 0) = max(-1M, 0) = 0
        assert!(!output.donation_results[0].collatable
            || output.donation_results[0].collatable_amount == Frac::zero());
        assert_eq!(output.estate_base, pesos(10_000_000));
    }

    // ── §8.3: Wedding gift — not collatable for estate base ──────────

    #[test]
    fn test_wedding_gift_not_collatable_for_estate_base() {
        // Art. 1070: wedding gifts are NOT added to estate base
        // (inofficiousness check is deferred to Step 6)
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 5_000_000);
        donation.is_wedding_gift = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(!output.donation_results[0].collatable);
        assert_eq!(output.estate_base, pesos(10_000_000));
    }

    // ── §8.3: Donor express exemption ────────────────────────────────

    #[test]
    fn test_donor_expressly_exempt_not_collatable() {
        // Art. 1062: donor exempted from collation → not collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 3_000_000);
        donation.is_expressly_exempt = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(!output.donation_results[0].collatable);
        // But inofficiousness should still be flagged for Step 6
        assert!(output.donation_results[0].still_check_inofficiousness);
    }

    // ── §8.3: Donee renounced inheritance ────────────────────────────

    #[test]
    fn test_donee_renounced_not_collatable() {
        // Art. 1062 ¶2: donee repudiated inheritance → not collatable
        let mut lc1 = make_lc("lc1");
        lc1.has_renounced = true;
        let heirs = vec![lc1, make_lc("lc2")];
        let donations = vec![make_donation("d1", Some("lc1"), 3_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert!(!output.donation_results[0].collatable);
        assert!(output.donation_results[0].still_check_inofficiousness);
    }

    // ── §8.3: Debt/election/fine payments ────────────────────────────

    #[test]
    fn test_debt_payment_collatable() {
        // Art. 1069: debt payment for child → collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 1_000_000);
        donation.is_debt_payment_for_child = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].collatable_amount, pesos(1_000_000));
    }

    #[test]
    fn test_election_expense_collatable() {
        // Art. 1069: election expense → collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 500_000);
        donation.is_election_expense = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
    }

    #[test]
    fn test_fine_payment_collatable() {
        // Art. 1069: fine payment → collatable
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 200_000);
        donation.is_fine_payment = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
    }

    // ── §8.3: Standard donations — charge target ─────────────────────

    #[test]
    fn test_standard_donation_to_lc_charged_to_legitime() {
        // Art. 909: standard gift to LC → charged to child's legitime
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let donations = vec![make_donation("d1", Some("lc1"), 2_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].charge_target, ChargeTarget::Legitime);
    }

    #[test]
    fn test_standard_donation_to_ic_charged_to_legitime() {
        // Art. 910: standard gift to IC → charged to IC's legitime
        let heirs = vec![make_lc("lc1"), make_ic("ic1")];
        let donations = vec![make_donation("d1", Some("ic1"), 1_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].charge_target, ChargeTarget::Legitime);
    }

    #[test]
    fn test_stranger_donation_charged_to_free_portion() {
        // Art. 909 ¶2: stranger donation → charged to FP
        let heirs = vec![make_lc("lc1")];
        let mut donation = make_donation("d1", None, 1_000_000);
        donation.recipient_is_stranger = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
        assert_eq!(output.donation_results[0].charge_target, ChargeTarget::FreePortion);
    }

    // ── Mixed scenarios ──────────────────────────────────────────────

    #[test]
    fn test_mixed_collatable_and_exempt_donations() {
        // Some collatable, some not — only collatable ones added to base
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut support = make_donation("d1", Some("lc1"), 500_000);
        support.is_support_education_medical = true;
        let standard = make_donation("d2", Some("lc2"), 2_000_000);

        let input = make_step4_input(10_000_000, vec![support, standard], heirs);
        let output = step4_compute_estate_base(&input);

        // Only d2 is collatable: 10M + 2M = 12M
        assert_eq!(output.estate_base, pesos(12_000_000));
        assert_eq!(output.total_collatable, pesos(2_000_000));
        assert!(!output.donation_results[0].collatable); // support exempt
        assert!(output.donation_results[1].collatable);   // standard collatable
    }

    #[test]
    fn test_donation_to_spouse_with_children_collatable() {
        // Donation to surviving spouse who is compulsory co-heir with children
        let heirs = vec![make_lc("lc1"), make_spouse("sp1")];
        let donations = vec![make_donation("d1", Some("sp1"), 1_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        // Spouse is compulsory, has co-heirs → standard donation collatable
        assert!(output.donation_results[0].collatable);
    }

    #[test]
    fn test_donation_to_ascendant_with_co_heirs() {
        // Donation to ascendant who has co-heirs → collatable
        let heirs = vec![make_ascendant("p1"), make_ascendant("p2"), make_spouse("sp1")];
        let donations = vec![make_donation("d1", Some("p1"), 1_500_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert!(output.donation_results[0].collatable);
    }

    // ── TV-22: Representation collation (Art. 1064) ──────────────────

    #[test]
    fn test_tv22_estate_base_computation() {
        // TV-22: E = ₱9M, predeceased LC (Elena) had ₱3M donation
        // estate_base = ₱9M + ₱3M = ₱12M
        //
        // Elena is not alive but has grandchildren inheriting by representation.
        // Her donation is still collatable (Art. 1064: grandchildren collate parent's donation).
        // For Step 4, the donation recipient is Elena (the original donee).
        let mut elena = make_lc("elena");
        elena.is_alive = false;
        elena.represented_by = vec!["faye".to_string(), "gabriel".to_string()];

        let david = make_lc("david");

        // Representatives (grandchildren)
        let mut faye = make_lc("faye");
        faye.represents = Some("elena".to_string());
        faye.inherits_by = InheritanceMode::Representation;
        faye.line_ancestor = Some("elena".to_string());

        let mut gabriel = make_lc("gabriel");
        gabriel.represents = Some("elena".to_string());
        gabriel.inherits_by = InheritanceMode::Representation;
        gabriel.line_ancestor = Some("elena".to_string());

        let heirs = vec![david, elena, faye, gabriel];
        let donations = vec![make_donation("d1", Some("elena"), 3_000_000)];
        let input = make_step4_input(9_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        // Estate base = 9M + 3M = 12M
        assert_eq!(output.estate_base, pesos(12_000_000));
        assert_eq!(output.total_collatable, pesos(3_000_000));
        assert!(output.donation_results[0].collatable);
    }

    // ── Edge cases ───────────────────────────────────────────────────

    #[test]
    fn test_donation_to_unknown_heir_id_not_collatable() {
        // Donation references an heir ID that doesn't exist in the heirs list
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let donations = vec![make_donation("d1", Some("nonexistent"), 1_000_000)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        // Unknown heir → cannot collate → not added to base
        assert!(!output.donation_results[0].collatable);
    }

    #[test]
    fn test_zero_value_donation() {
        // Donation with ₱0 value — still processed, adds nothing
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let donations = vec![make_donation("d1", Some("lc1"), 0)];
        let input = make_step4_input(10_000_000, donations, heirs);
        let output = step4_compute_estate_base(&input);

        assert_eq!(output.estate_base, pesos(10_000_000));
    }

    #[test]
    fn test_exempt_category_priority_over_debt_flag() {
        // If donation is both support AND debt_payment, Art. 1067 exempt takes priority
        // (support/education/medical checked first in decision tree)
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut donation = make_donation("d1", Some("lc1"), 1_000_000);
        donation.is_support_education_medical = true;
        donation.is_debt_payment_for_child = true;
        let input = make_step4_input(10_000_000, vec![donation], heirs);
        let output = step4_compute_estate_base(&input);

        // Art. 1067 exempt categories checked before Art. 1069
        assert!(!output.donation_results[0].collatable);
    }

    #[test]
    fn test_result_count_matches_donation_count() {
        // Every donation gets a result, regardless of collatability
        let heirs = vec![make_lc("lc1"), make_lc("lc2")];
        let mut exempt = make_donation("d1", Some("lc1"), 100_000);
        exempt.is_customary_gift = true;
        let standard = make_donation("d2", Some("lc2"), 200_000);
        let mut stranger = make_donation("d3", None, 300_000);
        stranger.recipient_is_stranger = true;

        let input = make_step4_input(10_000_000, vec![exempt, standard, stranger], heirs);
        let output = step4_compute_estate_base(&input);

        assert_eq!(output.donation_results.len(), 3);
    }

    // ── Invariant §14.2.9: estate_base = net_estate + collatable ─────

    #[test]
    fn test_invariant_estate_base_equals_net_plus_collatable() {
        // Verify Invariant 9: estate_base = net_estate + Σ(collatable_donations)
        let heirs = vec![make_lc("lc1"), make_lc("lc2"), make_ic("ic1")];
        let mut exempt = make_donation("d1", Some("lc1"), 500_000);
        exempt.is_customary_gift = true;
        let standard1 = make_donation("d2", Some("lc2"), 1_000_000);
        let standard2 = make_donation("d3", Some("ic1"), 750_000);

        let input = make_step4_input(10_000_000, vec![exempt, standard1, standard2], heirs);
        let output = step4_compute_estate_base(&input);

        // Invariant: estate_base = net_estate + total_collatable
        let expected_base = &input.net_estate + &output.total_collatable;
        assert_eq!(output.estate_base, expected_base);

        // Verify total_collatable = sum of individual collatable amounts
        let sum: Frac = output
            .donation_results
            .iter()
            .filter(|r| r.collatable)
            .fold(Frac::zero(), |acc, r| acc + r.collatable_amount.clone());
        assert_eq!(output.total_collatable, sum);
    }
}
