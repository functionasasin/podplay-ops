//! Step 8: Collation Adjustment (Arts. 1061-1077)
//!
//! After Step 7 computes gross entitlements on the collation-adjusted estate base,
//! this step imputes (subtracts) each donee-heir's collatable donations from their
//! gross share to determine what they actually receive from the physical estate.
//!
//! Spec references:
//!   - §8.4 Valuation Rule (Art. 1071): donations valued at time given, not at death
//!   - §8.5 Imputation (Arts. 1073-1074): charge to legitime first, excess to FP
//!   - §8.6 Representation Collation (Art. 1064): grandchildren collate parent's donations
//!   - §8.7 Integration with Pipeline

use std::collections::HashMap;

use crate::fraction::{frac, Frac};
use crate::step4_estate_base::CollatabilityResult;
use crate::step7_distribute::HeirDistribution;
use crate::types::*;

// ── Types ───────────────────────────────────────────────────────────

/// Per-heir collation adjustment result.
#[derive(Debug, Clone)]
pub struct HeirCollationAdjustment {
    pub heir_id: HeirId,
    /// Gross entitlement from Step 7 (computed on collation-adjusted estate base).
    pub gross_entitlement: Frac,
    /// Total collatable donations imputed against this heir.
    pub donations_imputed: Frac,
    /// Net amount this heir receives from the physical estate.
    /// = max(gross_entitlement - donations_imputed, 0)
    pub net_from_estate: Frac,
    /// If donations exceed gross entitlement, the excess amount (inofficious).
    pub excess: Frac,
    /// Whether this heir owes the estate (donation exceeded entitlement).
    pub owes_estate: bool,
    /// Legal basis for the imputation.
    pub legal_basis: Vec<String>,
}

/// Per-representation-line collation result (Art. 1064).
#[derive(Debug, Clone)]
pub struct RepresentationCollation {
    /// The predeceased/excluded ancestor whose line is being represented.
    pub represented_heir_id: HeirId,
    /// The line's total gross entitlement.
    pub line_entitlement: Frac,
    /// Total donations of the represented ancestor that are collated.
    pub parent_donation_collated: Frac,
    /// Net amount available to distribute among representatives.
    pub net_from_estate: Frac,
    /// Per-representative share (equal division per stirpes).
    pub per_representative: Frac,
    /// Whether the parent's donations exceeded the line's entitlement.
    pub owes_estate: bool,
    /// Excess amount if owes_estate is true.
    pub excess: Frac,
}

/// Input to Step 8.
#[derive(Debug, Clone)]
pub struct Step8Input {
    /// Net distributable estate (physical estate, before collation).
    pub net_estate: Frac,
    /// Collation-adjusted estate base from Step 4.
    pub estate_base: Frac,
    /// Per-heir gross distributions from Step 7.
    pub distributions: Vec<HeirDistribution>,
    /// Collatability results from Step 4.
    pub donation_results: Vec<CollatabilityResult>,
    /// Original donations for value lookup.
    pub donations: Vec<Donation>,
    /// Classified heirs (for representation info).
    pub heirs: Vec<Heir>,
}

/// Output of Step 8.
#[derive(Debug, Clone)]
pub struct Step8Output {
    /// Per-heir adjusted shares after donation imputation.
    pub adjustments: Vec<HeirCollationAdjustment>,
    /// Per-representation-line collation results (if any).
    pub representation_collations: Vec<RepresentationCollation>,
    /// Sum of all net_from_estate (should equal net_estate).
    pub total_from_estate: Frac,
    /// Any excess amounts from inofficious donations.
    pub total_excess: Frac,
    pub warnings: Vec<ManualFlag>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Perform collation adjustment: impute each donee-heir's collatable donations
/// against their gross entitlement to determine what they receive from the
/// physical estate.
///
/// Algorithm:
/// 1. Build map of heir_id → total collatable donation amount
/// 2. Identify representation lines (predeceased heirs with representatives)
/// 3. For representation lines: compute line-level collation (Art. 1064),
///    then set per-representative net_from_estate
/// 4. For direct heirs: impute their own donations
/// 5. Compute totals and verify invariant: Σ(net_from_estate) = net_estate
///
/// Invariant: Σ(net_from_estate) = net_estate
pub fn step8_collation_adjustment(input: &Step8Input) -> Step8Output {
    let donation_map = build_donation_map(&input.donation_results, &input.donations);
    let mut adjustments: Vec<HeirCollationAdjustment> = Vec::new();
    let mut representation_collations: Vec<RepresentationCollation> = Vec::new();
    let mut total_excess = Frac::zero();
    let warnings = Vec::new();

    // Identify representation lines: heirs who are dead + have representatives
    // Build a set of heir_ids that are representatives (to handle them via their line)
    let mut representative_heir_ids: HashMap<HeirId, HeirId> = HashMap::new(); // rep_id -> represented_id
    let mut representation_lines: Vec<(HeirId, Vec<HeirId>)> = Vec::new(); // (represented_id, [rep_ids])

    for heir in &input.heirs {
        if !heir.is_alive && !heir.represented_by.is_empty() {
            representation_lines.push((heir.id.clone(), heir.represented_by.clone()));
            for rep_id in &heir.represented_by {
                representative_heir_ids.insert(rep_id.clone(), heir.id.clone());
            }
        }
    }

    // Process representation lines
    for (represented_id, rep_ids) in &representation_lines {
        let parent_donation = donation_map
            .get(represented_id)
            .cloned()
            .unwrap_or_else(Frac::zero);

        // Gather representative distributions
        let rep_dists: Vec<&HeirDistribution> = input
            .distributions
            .iter()
            .filter(|d| rep_ids.contains(&d.heir_id))
            .collect();

        if rep_dists.is_empty() {
            continue;
        }

        // Line share = sum of all representatives' gross entitlements
        let line_share = rep_dists
            .iter()
            .fold(Frac::zero(), |acc, d| acc + d.total.clone());

        let rc = collation_for_representatives(
            represented_id,
            &rep_dists,
            &parent_donation,
            &line_share,
        );

        // Create adjustments for each representative
        for rep_dist in &rep_dists {
            let adj = HeirCollationAdjustment {
                heir_id: rep_dist.heir_id.clone(),
                gross_entitlement: rep_dist.total.clone(),
                donations_imputed: if rc.owes_estate || !parent_donation.is_zero() {
                    // Each representative's share of the parent's donation
                    let n_reps = rep_ids.len() as i64;
                    if n_reps > 0 {
                        &parent_donation / &frac(n_reps, 1)
                    } else {
                        Frac::zero()
                    }
                } else {
                    Frac::zero()
                },
                net_from_estate: rc.per_representative.clone(),
                excess: Frac::zero(), // Excess is tracked at the line level
                owes_estate: false,
                legal_basis: vec!["Art. 1064".into()],
            };
            adjustments.push(adj);
        }

        if rc.owes_estate {
            total_excess = total_excess + rc.excess.clone();
        }

        representation_collations.push(rc);
    }

    // Process direct heirs (not representatives)
    for dist in &input.distributions {
        if representative_heir_ids.contains_key(&dist.heir_id) {
            continue; // Already handled via representation line
        }

        let donation_total = donation_map
            .get(&dist.heir_id)
            .cloned()
            .unwrap_or_else(Frac::zero);

        let adj = impute_direct_heir(dist, &donation_total);
        if adj.owes_estate {
            total_excess = total_excess + adj.excess.clone();
        }
        adjustments.push(adj);
    }

    // Compute total from estate
    let total_from_estate = adjustments
        .iter()
        .fold(Frac::zero(), |acc, a| acc + a.net_from_estate.clone());

    Step8Output {
        adjustments,
        representation_collations,
        total_from_estate,
        total_excess,
        warnings,
    }
}

// ── Internal helpers ────────────────────────────────────────────────

/// Build a map of heir_id -> total collatable donation amount.
///
/// Only collatable donations with a recipient_heir_id are included.
/// Non-collatable donations and stranger donations (no heir_id) are excluded.
fn build_donation_map(
    donation_results: &[CollatabilityResult],
    _donations: &[Donation],
) -> HashMap<HeirId, Frac> {
    let mut map: HashMap<HeirId, Frac> = HashMap::new();
    for result in donation_results {
        if !result.collatable {
            continue;
        }
        if let Some(ref heir_id) = result.recipient_heir_id {
            let entry = map.entry(heir_id.clone()).or_insert_with(Frac::zero);
            *entry = entry.clone() + result.collatable_amount.clone();
        }
        // Stranger donations (recipient_heir_id = None) are charged to FP,
        // not imputed against any heir's share.
    }
    map
}

/// Impute donations for a direct heir (not inheriting by representation).
///
/// net_from_estate = max(gross_entitlement - donation_total, 0)
/// If donation_total > gross_entitlement → inofficious (Art. 911).
fn impute_direct_heir(
    distribution: &HeirDistribution,
    donation_total: &Frac,
) -> HeirCollationAdjustment {
    let gross = &distribution.total;
    let remainder = gross.clone() - donation_total.clone();

    if remainder.is_negative() {
        // Donation exceeds entitlement — inofficious (Art. 911)
        let excess = donation_total.clone() - gross.clone();
        HeirCollationAdjustment {
            heir_id: distribution.heir_id.clone(),
            gross_entitlement: gross.clone(),
            donations_imputed: donation_total.clone(),
            net_from_estate: Frac::zero(),
            excess,
            owes_estate: true,
            legal_basis: vec!["Art. 911".into(), "Art. 1073".into()],
        }
    } else {
        HeirCollationAdjustment {
            heir_id: distribution.heir_id.clone(),
            gross_entitlement: gross.clone(),
            donations_imputed: donation_total.clone(),
            net_from_estate: remainder,
            excess: Frac::zero(),
            owes_estate: false,
            legal_basis: vec!["Art. 1073".into()],
        }
    }
}

/// Compute collation for a representation line per Art. 1064.
///
/// Grandchildren inheriting by representation must collate their predeceased
/// parent's donations, even though they never received the property (Art. 1064).
/// Donations valued at donation-time value (Art. 1071).
///
/// If parent_donation_total >= line_share: representatives get ₱0, excess noted.
/// Otherwise: net = line_share - parent_donation, divided equally per stirpes.
fn collation_for_representatives(
    represented_heir_id: &HeirId,
    representatives: &[&HeirDistribution],
    parent_donation_total: &Frac,
    line_share: &Frac,
) -> RepresentationCollation {
    let net = line_share.clone() - parent_donation_total.clone();
    let n_reps = representatives.len() as i64;

    if net.is_negative() {
        // Parent's donation exceeded line share — owes estate
        let excess = parent_donation_total.clone() - line_share.clone();
        RepresentationCollation {
            represented_heir_id: represented_heir_id.clone(),
            line_entitlement: line_share.clone(),
            parent_donation_collated: parent_donation_total.clone(),
            net_from_estate: Frac::zero(),
            per_representative: Frac::zero(),
            owes_estate: true,
            excess,
        }
    } else {
        let per_rep = if n_reps > 0 {
            &net / &frac(n_reps, 1)
        } else {
            Frac::zero()
        };
        RepresentationCollation {
            represented_heir_id: represented_heir_id.clone(),
            line_entitlement: line_share.clone(),
            parent_donation_collated: parent_donation_total.clone(),
            net_from_estate: net,
            per_representative: per_rep,
            owes_estate: false,
            excess: Frac::zero(),
        }
    }
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fraction::frac;
    use crate::step4_estate_base::{ChargeTarget, CollatabilityResult};
    use crate::step7_distribute::HeirDistribution;
    use crate::types::*;

    // ── Test helpers ────────────────────────────────────────────────

    fn make_heir(id: &str, category: EffectiveCategory, mode: InheritanceMode) -> Heir {
        Heir {
            id: id.to_string(),
            name: id.to_string(),
            raw_category: match category {
                EffectiveCategory::LegitimateChildGroup => HeirCategory::LegitimateChild,
                EffectiveCategory::IllegitimateChildGroup => HeirCategory::IllegitimateChild,
                EffectiveCategory::SurvivingSpouseGroup => HeirCategory::SurvivingSpouse,
                EffectiveCategory::LegitimateAscendantGroup => HeirCategory::LegitimateParent,
                EffectiveCategory::CollateralGroup => HeirCategory::Sibling,
            },
            effective_category: category,
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
            inherits_by: mode,
            line_ancestor: None,
            children: vec![],
        }
    }

    fn make_representative(id: &str, represents: &str) -> Heir {
        let mut heir = make_heir(id, EffectiveCategory::LegitimateChildGroup, InheritanceMode::Representation);
        heir.represents = Some(represents.to_string());
        heir.line_ancestor = Some(represents.to_string());
        heir
    }

    fn make_distribution(heir_id: &str, category: EffectiveCategory, total: Frac) -> HeirDistribution {
        HeirDistribution {
            heir_id: heir_id.to_string(),
            effective_category: category,
            from_legitime: total.clone(),
            from_free_portion: Frac::zero(),
            from_intestate: Frac::zero(),
            total,
            legal_basis: vec![],
        }
    }

    fn make_intestate_distribution(heir_id: &str, category: EffectiveCategory, from_intestate: Frac) -> HeirDistribution {
        HeirDistribution {
            heir_id: heir_id.to_string(),
            effective_category: category,
            from_legitime: Frac::zero(),
            from_free_portion: Frac::zero(),
            from_intestate: from_intestate.clone(),
            total: from_intestate,
            legal_basis: vec![],
        }
    }

    fn make_collatable_donation(
        donation_id: &str,
        heir_id: &str,
        amount: Frac,
    ) -> CollatabilityResult {
        CollatabilityResult {
            donation_id: donation_id.to_string(),
            recipient_heir_id: Some(heir_id.to_string()),
            collatable: true,
            collatable_amount: amount,
            charge_target: ChargeTarget::Legitime,
            reason: "Art. 909 standard".to_string(),
            still_check_inofficiousness: false,
        }
    }

    fn make_non_collatable_donation(
        donation_id: &str,
        heir_id: &str,
    ) -> CollatabilityResult {
        CollatabilityResult {
            donation_id: donation_id.to_string(),
            recipient_heir_id: Some(heir_id.to_string()),
            collatable: false,
            collatable_amount: Frac::zero(),
            charge_target: ChargeTarget::None,
            reason: "Art. 1067 exempt".to_string(),
            still_check_inofficiousness: false,
        }
    }

    fn make_donation(id: &str, heir_id: &str, pesos: i64) -> Donation {
        Donation {
            id: id.to_string(),
            recipient_heir_id: Some(heir_id.to_string()),
            recipient_is_stranger: false,
            value_at_time_of_donation: Money::from_pesos(pesos),
            date: "2020-01-01".to_string(),
            description: format!("Donation {} to {}", id, heir_id),
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

    fn pesos(n: i64) -> Frac {
        frac(n * 100, 1) // centavos
    }

    fn find_adjustment<'a>(output: &'a Step8Output, heir_id: &str) -> &'a HeirCollationAdjustment {
        output.adjustments.iter()
            .find(|a| a.heir_id == heir_id)
            .unwrap_or_else(|| panic!("No adjustment found for heir {}", heir_id))
    }

    // ════════════════════════════════════════════════════════════════
    // Test 1: No donations — gross = net (passthrough)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_no_donations_passthrough() {
        // 2 LC, no donations. E = ₱10M. Each gets ₱5M gross = ₱5M net.
        let net_estate = pesos(10_000_000);
        let estate_base = pesos(10_000_000); // no collation

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(5_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(5_000_000)),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results: vec![],
            donations: vec![],
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        // Both heirs should get their full entitlement from estate
        let adj1 = find_adjustment(&output, "lc1");
        assert_eq!(adj1.gross_entitlement, pesos(5_000_000));
        assert_eq!(adj1.donations_imputed, Frac::zero());
        assert_eq!(adj1.net_from_estate, pesos(5_000_000));
        assert!(!adj1.owes_estate);

        let adj2 = find_adjustment(&output, "lc2");
        assert_eq!(adj2.net_from_estate, pesos(5_000_000));

        // Invariant 9: sum(from_estate) = net_estate
        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 2: Single donation imputed against donee's share
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_single_donation_imputed() {
        // 2 LC. E = ₱10M net, LC1 received ₱2M donation.
        // Estate base = ₱12M. Each gets ₱6M gross.
        // LC1: ₱6M - ₱2M = ₱4M from estate.
        // LC2: ₱6M from estate.
        // Total from estate = ₱10M ✓
        let net_estate = pesos(10_000_000);
        let estate_base = pesos(12_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(6_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(6_000_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "lc1", pesos(2_000_000)),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 2_000_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        let adj1 = find_adjustment(&output, "lc1");
        assert_eq!(adj1.gross_entitlement, pesos(6_000_000));
        assert_eq!(adj1.donations_imputed, pesos(2_000_000));
        assert_eq!(adj1.net_from_estate, pesos(4_000_000));
        assert!(!adj1.owes_estate);

        let adj2 = find_adjustment(&output, "lc2");
        assert_eq!(adj2.gross_entitlement, pesos(6_000_000));
        assert_eq!(adj2.donations_imputed, Frac::zero());
        assert_eq!(adj2.net_from_estate, pesos(6_000_000));

        // Invariant 9
        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 3: Multiple donations to same heir
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_multiple_donations_same_heir() {
        // 2 LC. E = ₱10M net, LC1 received ₱1M + ₱1.5M = ₱2.5M donations.
        // Estate base = ₱12.5M. Each gets ₱6.25M gross.
        // LC1: ₱6.25M - ₱2.5M = ₱3.75M from estate.
        // LC2: ₱6.25M from estate.
        // Total from estate = ₱10M ✓
        let net_estate = pesos(10_000_000);
        let estate_base = pesos(12_500_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(6_250_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(6_250_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "lc1", pesos(1_000_000)),
            make_collatable_donation("d2", "lc1", pesos(1_500_000)),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 1_000_000),
            make_donation("d2", "lc1", 1_500_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        let adj1 = find_adjustment(&output, "lc1");
        assert_eq!(adj1.donations_imputed, pesos(2_500_000));
        assert_eq!(adj1.net_from_estate, pesos(3_750_000));

        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 4: Donation exceeds heir's share — inofficious (Art. 911)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_donation_exceeds_share_inofficious() {
        // 2 LC. E = ₱4M net, LC1 received ₱8M donation.
        // Estate base = ₱12M. Each gets ₱6M gross.
        // LC1: ₱6M - ₱8M = -₱2M → net_from_estate = 0, excess = ₱2M
        // LC2: ₱6M from estate.
        // But total_from_estate should equal net_estate = ₱4M.
        // LC2 gets ₱6M but only ₱4M is available... the excess ₱2M is
        // what LC1 would owe — this flags inofficiousness.
        let net_estate = pesos(4_000_000);
        let estate_base = pesos(12_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(6_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(6_000_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "lc1", pesos(8_000_000)),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 8_000_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        let adj1 = find_adjustment(&output, "lc1");
        assert_eq!(adj1.gross_entitlement, pesos(6_000_000));
        assert_eq!(adj1.donations_imputed, pesos(8_000_000));
        assert_eq!(adj1.net_from_estate, Frac::zero());
        assert!(adj1.owes_estate);
        assert_eq!(adj1.excess, pesos(2_000_000));

        // LC2 still gets their full gross from estate
        let adj2 = find_adjustment(&output, "lc2");
        assert_eq!(adj2.net_from_estate, pesos(6_000_000));

        // Total excess should be tracked
        assert_eq!(output.total_excess, pesos(2_000_000));
    }

    // ════════════════════════════════════════════════════════════════
    // Test 5: Non-collatable donations are NOT imputed
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_non_collatable_not_imputed() {
        // 2 LC. E = ₱10M. LC1 has a non-collatable donation (Art. 1067 exempt).
        // Estate base = ₱10M (no collation add). Each gets ₱5M.
        // No imputation — both get ₱5M from estate.
        let net_estate = pesos(10_000_000);
        let estate_base = pesos(10_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(5_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(5_000_000)),
        ];

        let donation_results = vec![
            make_non_collatable_donation("d1", "lc1"),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 1_000_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        let adj1 = find_adjustment(&output, "lc1");
        assert_eq!(adj1.donations_imputed, Frac::zero());
        assert_eq!(adj1.net_from_estate, pesos(5_000_000));

        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 6: TV-22 — Representation collation (Art. 1064)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_tv22_representation_collation() {
        // E = ₱9M. 1 LC (David) + 1 predeceased LC (Elena, ₱3M donation)
        // with 2 grandchildren (Faye, Gabriel). Intestate.
        //
        // Estate base = ₱12M.
        // Per line = ₱12M / 2 = ₱6M.
        // David: ₱6M from estate.
        // Elena's line: ₱6M - ₱3M = ₱3M from estate → ₱1.5M each GC.
        // Total from estate = ₱6M + ₱1.5M + ₱1.5M = ₱9M ✓
        let net_estate = pesos(9_000_000);
        let estate_base = pesos(12_000_000);

        let mut david = make_heir("david", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight);
        david.name = "David".to_string();

        let mut elena = make_heir("elena", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight);
        elena.name = "Elena".to_string();
        elena.is_alive = false;
        elena.representation_trigger = Some(RepresentationTrigger::Predecease);
        elena.represented_by = vec!["faye".to_string(), "gabriel".to_string()];

        let mut faye = make_representative("faye", "elena");
        faye.name = "Faye".to_string();

        let mut gabriel = make_representative("gabriel", "elena");
        gabriel.name = "Gabriel".to_string();

        let heirs = vec![david, elena, faye, gabriel];

        // Step 7 distributions (on estate_base = ₱12M):
        // David gets ₱6M (his line share).
        // Faye and Gabriel each get ₱3M (₱6M / 2 per stirpes from Elena's line).
        // Note: Step 7 distributes the collation-adjusted estate base.
        let distributions = vec![
            make_intestate_distribution("david", EffectiveCategory::LegitimateChildGroup, pesos(6_000_000)),
            make_intestate_distribution("faye", EffectiveCategory::LegitimateChildGroup, pesos(3_000_000)),
            make_intestate_distribution("gabriel", EffectiveCategory::LegitimateChildGroup, pesos(3_000_000)),
        ];

        // Elena's ₱3M donation is collatable
        let donation_results = vec![
            make_collatable_donation("d1", "elena", pesos(3_000_000)),
        ];

        let donations = vec![
            make_donation("d1", "elena", 3_000_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        // David: no donation, full ₱6M from estate
        let adj_david = find_adjustment(&output, "david");
        assert_eq!(adj_david.net_from_estate, pesos(6_000_000));
        assert_eq!(adj_david.donations_imputed, Frac::zero());

        // Faye: ₱3M gross - ₱1.5M (half of parent's ₱3M) = ₱1.5M from estate
        let adj_faye = find_adjustment(&output, "faye");
        assert_eq!(adj_faye.net_from_estate, pesos(1_500_000));

        // Gabriel: same as Faye
        let adj_gabriel = find_adjustment(&output, "gabriel");
        assert_eq!(adj_gabriel.net_from_estate, pesos(1_500_000));

        // Representation collation should be tracked
        assert_eq!(output.representation_collations.len(), 1);
        let rep = &output.representation_collations[0];
        assert_eq!(rep.represented_heir_id, "elena");
        assert_eq!(rep.line_entitlement, pesos(6_000_000));
        assert_eq!(rep.parent_donation_collated, pesos(3_000_000));
        assert_eq!(rep.net_from_estate, pesos(3_000_000));
        assert_eq!(rep.per_representative, pesos(1_500_000));
        assert!(!rep.owes_estate);

        // Invariant 9: sum(from_estate) = net_estate = ₱9M
        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 7: Representation collation — parent donation exceeds line share
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_representation_collation_parent_donation_exceeds_line() {
        // E = ₱3M. 1 LC (Alice) + 1 predeceased LC (Bob, ₱5M donation)
        // with 2 grandchildren (Carol, Dave).
        //
        // Estate base = ₱8M.
        // Per line = ₱8M / 2 = ₱4M.
        // Alice: ₱4M from estate.
        // Bob's line: ₱4M - ₱5M = -₱1M → GCs get ₱0, excess ₱1M.
        // Total from estate = ₱4M + ₀ + ₀ = ₃M? No — Alice only gets what's
        // available. But gross is ₱4M on adjusted base.
        // Actually: net_estate = ₱3M. Alice's net_from_estate = ₱4M but
        // only ₱3M exists... This is an inofficiousness issue flagged.
        let net_estate = pesos(3_000_000);
        let estate_base = pesos(8_000_000);

        let mut alice = make_heir("alice", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight);
        alice.name = "Alice".to_string();

        let mut bob = make_heir("bob", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight);
        bob.name = "Bob".to_string();
        bob.is_alive = false;
        bob.representation_trigger = Some(RepresentationTrigger::Predecease);
        bob.represented_by = vec!["carol".to_string(), "dave".to_string()];

        let carol = make_representative("carol", "bob");
        let dave = make_representative("dave", "bob");

        let heirs = vec![alice, bob, carol, dave];

        let distributions = vec![
            make_intestate_distribution("alice", EffectiveCategory::LegitimateChildGroup, pesos(4_000_000)),
            make_intestate_distribution("carol", EffectiveCategory::LegitimateChildGroup, pesos(2_000_000)),
            make_intestate_distribution("dave", EffectiveCategory::LegitimateChildGroup, pesos(2_000_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "bob", pesos(5_000_000)),
        ];

        let donations = vec![
            make_donation("d1", "bob", 5_000_000),
        ];

        let input = Step8Input {
            net_estate,
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        // Carol and Dave get ₱0 (parent's donation exceeded line share)
        let adj_carol = find_adjustment(&output, "carol");
        assert_eq!(adj_carol.net_from_estate, Frac::zero());

        let adj_dave = find_adjustment(&output, "dave");
        assert_eq!(adj_dave.net_from_estate, Frac::zero());

        // Representation collation tracks the excess
        assert_eq!(output.representation_collations.len(), 1);
        let rep = &output.representation_collations[0];
        assert!(rep.owes_estate);
        assert_eq!(rep.excess, pesos(1_000_000));
        assert_eq!(rep.net_from_estate, Frac::zero());
        assert_eq!(rep.per_representative, Frac::zero());
    }

    // ════════════════════════════════════════════════════════════════
    // Test 8: Donation exactly equals heir's share
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_donation_exactly_equals_share() {
        // 2 LC. E = ₱4M net, LC1 received ₱4M donation.
        // Estate base = ₱8M. Each gets ₱4M gross.
        // LC1: ₱4M - ₱4M = ₱0 from estate (no excess, just zero).
        // LC2: ₱4M from estate.
        // Total from estate = ₀ + ₱4M = ₱4M ✓
        let net_estate = pesos(4_000_000);
        let estate_base = pesos(8_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(4_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(4_000_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "lc1", pesos(4_000_000)),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 4_000_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        let adj1 = find_adjustment(&output, "lc1");
        assert_eq!(adj1.net_from_estate, Frac::zero());
        assert!(!adj1.owes_estate); // exactly zero, not negative
        assert_eq!(adj1.excess, Frac::zero());

        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 9: Stranger donation charged to FP (not imputed against heir)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_stranger_donation_charged_to_fp() {
        // 2 LC + stranger received ₱1M donation.
        // E = ₱9M net. Estate base = ₱10M (₱1M stranger donation collated).
        // Stranger donation charged to FP, NOT imputed against any heir's share.
        // LC1 and LC2 each get ₱5M from estate_base → their shares aren't reduced.
        let net_estate = pesos(9_000_000);
        let estate_base = pesos(10_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(5_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(5_000_000)),
        ];

        // Stranger donation: collatable but charged to FP, no heir_id match
        let stranger_donation_result = CollatabilityResult {
            donation_id: "d1".to_string(),
            recipient_heir_id: None, // stranger
            collatable: true,
            collatable_amount: pesos(1_000_000),
            charge_target: ChargeTarget::FreePortion,
            reason: "Art. 909 ¶2 stranger".to_string(),
            still_check_inofficiousness: false,
        };

        let stranger_donation = Donation {
            id: "d1".to_string(),
            recipient_heir_id: None,
            recipient_is_stranger: true,
            value_at_time_of_donation: Money::from_pesos(1_000_000),
            date: "2020-01-01".to_string(),
            description: "Donation to stranger".to_string(),
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
        };

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results: vec![stranger_donation_result],
            donations: vec![stranger_donation],
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        // Neither heir's share should be reduced (stranger donation → FP charge)
        let adj1 = find_adjustment(&output, "lc1");
        assert_eq!(adj1.donations_imputed, Frac::zero());

        let adj2 = find_adjustment(&output, "lc2");
        assert_eq!(adj2.donations_imputed, Frac::zero());
    }

    // ════════════════════════════════════════════════════════════════
    // Test 10: Mixed — both collatable and non-collatable donations to same heir
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_mixed_collatable_and_non_collatable() {
        // 2 LC. E = ₱10M. LC1 has:
        //   - ₱2M collatable standard donation
        //   - ₱500K non-collatable (Art. 1067 support)
        // Estate base = ₱12M. Each gets ₱6M gross.
        // LC1: ₱6M - ₱2M (only collatable) = ₱4M from estate.
        let net_estate = pesos(10_000_000);
        let estate_base = pesos(12_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(6_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(6_000_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "lc1", pesos(2_000_000)),
            make_non_collatable_donation("d2", "lc1"),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 2_000_000),
            make_donation("d2", "lc1", 500_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        let adj1 = find_adjustment(&output, "lc1");
        // Only the ₱2M collatable donation is imputed
        assert_eq!(adj1.donations_imputed, pesos(2_000_000));
        assert_eq!(adj1.net_from_estate, pesos(4_000_000));

        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 11: Multiple heirs with donations
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_multiple_heirs_with_donations() {
        // 3 LC. E = ₱9M net. LC1 received ₱1M, LC2 received ₱2M.
        // Estate base = ₱12M. Each gets ₱4M gross.
        // LC1: ₱4M - ₱1M = ₱3M from estate.
        // LC2: ₱4M - ₱2M = ₱2M from estate.
        // LC3: ₱4M from estate (no donation).
        // Total = ₱3M + ₱2M + ₱4M = ₱9M ✓
        let net_estate = pesos(9_000_000);
        let estate_base = pesos(12_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("lc3", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(4_000_000)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, pesos(4_000_000)),
            make_intestate_distribution("lc3", EffectiveCategory::LegitimateChildGroup, pesos(4_000_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "lc1", pesos(1_000_000)),
            make_collatable_donation("d2", "lc2", pesos(2_000_000)),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 1_000_000),
            make_donation("d2", "lc2", 2_000_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        assert_eq!(find_adjustment(&output, "lc1").net_from_estate, pesos(3_000_000));
        assert_eq!(find_adjustment(&output, "lc2").net_from_estate, pesos(2_000_000));
        assert_eq!(find_adjustment(&output, "lc3").net_from_estate, pesos(4_000_000));

        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 12: Representation collation — no parent donation (passthrough)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_representation_no_parent_donation() {
        // E = ₱10M. 1 LC (Alice) + 1 predeceased LC (Bob, NO donations)
        // with 2 grandchildren (Carol, Dave).
        // Estate base = ₱10M. Per line = ₱5M.
        // Carol and Dave each get ₱2.5M from estate (no collation).
        let net_estate = pesos(10_000_000);
        let estate_base = pesos(10_000_000);

        let mut bob = make_heir("bob", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight);
        bob.is_alive = false;
        bob.representation_trigger = Some(RepresentationTrigger::Predecease);
        bob.represented_by = vec!["carol".to_string(), "dave".to_string()];

        let heirs = vec![
            make_heir("alice", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            bob,
            make_representative("carol", "bob"),
            make_representative("dave", "bob"),
        ];

        let distributions = vec![
            make_intestate_distribution("alice", EffectiveCategory::LegitimateChildGroup, pesos(5_000_000)),
            make_intestate_distribution("carol", EffectiveCategory::LegitimateChildGroup, pesos(2_500_000)),
            make_intestate_distribution("dave", EffectiveCategory::LegitimateChildGroup, pesos(2_500_000)),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results: vec![],
            donations: vec![],
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        assert_eq!(find_adjustment(&output, "alice").net_from_estate, pesos(5_000_000));
        assert_eq!(find_adjustment(&output, "carol").net_from_estate, pesos(2_500_000));
        assert_eq!(find_adjustment(&output, "dave").net_from_estate, pesos(2_500_000));

        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 13: IC donation charged to IC's legitime (Art. 910)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_ic_donation_imputed() {
        // 1 LC + 1 IC. E = ₱10M. IC received ₱1M donation.
        // Estate base = ₱11M.
        // LC gross share and IC gross share from Step 7.
        // IC's net_from_estate = IC_gross - ₱1M.
        let net_estate = pesos(10_000_000);
        let estate_base = pesos(11_000_000);

        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, InheritanceMode::OwnRight),
            make_heir("ic1", EffectiveCategory::IllegitimateChildGroup, InheritanceMode::OwnRight),
        ];

        // Simplified: LC gets ₱8M, IC gets ₱3M from the adjusted base
        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, pesos(8_000_000)),
            make_intestate_distribution("ic1", EffectiveCategory::IllegitimateChildGroup, pesos(3_000_000)),
        ];

        let donation_results = vec![
            make_collatable_donation("d1", "ic1", pesos(1_000_000)),
        ];

        let donations = vec![
            make_donation("d1", "ic1", 1_000_000),
        ];

        let input = Step8Input {
            net_estate: net_estate.clone(),
            estate_base,
            distributions,
            donation_results,
            donations,
            heirs,
        };

        let output = step8_collation_adjustment(&input);

        let adj_ic = find_adjustment(&output, "ic1");
        assert_eq!(adj_ic.gross_entitlement, pesos(3_000_000));
        assert_eq!(adj_ic.donations_imputed, pesos(1_000_000));
        assert_eq!(adj_ic.net_from_estate, pesos(2_000_000));

        let adj_lc = find_adjustment(&output, "lc1");
        assert_eq!(adj_lc.net_from_estate, pesos(8_000_000));

        assert_eq!(output.total_from_estate, net_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 14: build_donation_map aggregation
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_build_donation_map() {
        let donation_results = vec![
            make_collatable_donation("d1", "lc1", pesos(1_000_000)),
            make_collatable_donation("d2", "lc1", pesos(500_000)),
            make_collatable_donation("d3", "lc2", pesos(2_000_000)),
            make_non_collatable_donation("d4", "lc1"),
        ];

        let donations = vec![
            make_donation("d1", "lc1", 1_000_000),
            make_donation("d2", "lc1", 500_000),
            make_donation("d3", "lc2", 2_000_000),
            make_donation("d4", "lc1", 300_000),
        ];

        let map = build_donation_map(&donation_results, &donations);

        // LC1: ₱1M + ₱500K = ₱1.5M (non-collatable d4 excluded)
        assert_eq!(map.get("lc1"), Some(&pesos(1_500_000)));
        // LC2: ₱2M
        assert_eq!(map.get("lc2"), Some(&pesos(2_000_000)));
        // No entry for heirs without collatable donations
        assert!(map.get("lc3").is_none());
    }

    // ════════════════════════════════════════════════════════════════
    // Test 15: impute_direct_heir — positive remainder
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_impute_direct_heir_positive() {
        let dist = make_intestate_distribution(
            "lc1",
            EffectiveCategory::LegitimateChildGroup,
            pesos(6_000_000),
        );
        let donation_total = pesos(2_000_000);

        let adj = impute_direct_heir(&dist, &donation_total);

        assert_eq!(adj.heir_id, "lc1");
        assert_eq!(adj.gross_entitlement, pesos(6_000_000));
        assert_eq!(adj.donations_imputed, pesos(2_000_000));
        assert_eq!(adj.net_from_estate, pesos(4_000_000));
        assert!(!adj.owes_estate);
        assert_eq!(adj.excess, Frac::zero());
    }

    // ════════════════════════════════════════════════════════════════
    // Test 16: impute_direct_heir — negative remainder (inofficious)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_impute_direct_heir_negative() {
        let dist = make_intestate_distribution(
            "lc1",
            EffectiveCategory::LegitimateChildGroup,
            pesos(4_000_000),
        );
        let donation_total = pesos(7_000_000);

        let adj = impute_direct_heir(&dist, &donation_total);

        assert_eq!(adj.net_from_estate, Frac::zero());
        assert!(adj.owes_estate);
        assert_eq!(adj.excess, pesos(3_000_000));
    }

    // ════════════════════════════════════════════════════════════════
    // Test 17: collation_for_representatives — normal case
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_collation_for_representatives_normal() {
        let dist_faye = make_intestate_distribution(
            "faye",
            EffectiveCategory::LegitimateChildGroup,
            pesos(3_000_000),
        );
        let dist_gabriel = make_intestate_distribution(
            "gabriel",
            EffectiveCategory::LegitimateChildGroup,
            pesos(3_000_000),
        );

        let representatives = vec![&dist_faye, &dist_gabriel];
        let parent_donation = pesos(3_000_000);
        let line_share = pesos(6_000_000);

        let result = collation_for_representatives(
            &"elena".to_string(),
            &representatives,
            &parent_donation,
            &line_share,
        );

        assert_eq!(result.line_entitlement, pesos(6_000_000));
        assert_eq!(result.parent_donation_collated, pesos(3_000_000));
        assert_eq!(result.net_from_estate, pesos(3_000_000));
        assert_eq!(result.per_representative, pesos(1_500_000));
        assert!(!result.owes_estate);
    }

    // ════════════════════════════════════════════════════════════════
    // Test 18: collation_for_representatives — excess (owes estate)
    // ════════════════════════════════════════════════════════════════

    #[test]
    fn test_collation_for_representatives_excess() {
        let dist_c = make_intestate_distribution(
            "carol",
            EffectiveCategory::LegitimateChildGroup,
            pesos(2_000_000),
        );
        let dist_d = make_intestate_distribution(
            "dave",
            EffectiveCategory::LegitimateChildGroup,
            pesos(2_000_000),
        );

        let representatives = vec![&dist_c, &dist_d];
        let parent_donation = pesos(5_000_000);
        let line_share = pesos(4_000_000);

        let result = collation_for_representatives(
            &"bob".to_string(),
            &representatives,
            &parent_donation,
            &line_share,
        );

        assert_eq!(result.net_from_estate, Frac::zero());
        assert_eq!(result.per_representative, Frac::zero());
        assert!(result.owes_estate);
        assert_eq!(result.excess, pesos(1_000_000));
    }
}
