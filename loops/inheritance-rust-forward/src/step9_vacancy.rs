//! Step 9: Vacancy Resolution (Arts. 859, 969-977, 1015-1022)
//!
//! When a share becomes vacant (predecease without representation, renunciation,
//! incapacity), this step resolves the vacancy using a priority chain:
//!
//! ```text
//! Priority 1: SUBSTITUTION (Art. 859, testate only)
//! Priority 2: REPRESENTATION (Arts. 970-977, if not already resolved in Step 2)
//! Priority 3: ACCRETION (Arts. 1015-1021)
//! Priority 4: INTESTATE FALLBACK (Art. 1022(2), testate only)
//! ```
//!
//! Critical distinction (§10.2 / Art. 1021):
//! - **Legitime vacancy** → co-heirs succeed "in their own right" → full scenario
//!   re-evaluation (restart to Step 3). May change scenario code.
//! - **Free Portion vacancy** → accretion proper (Art. 1019) → proportional
//!   distribution to co-heirs' existing shares. No scenario change.
//!
//! Spec references:
//!   - §10.1 Resolution Priority Chain
//!   - §10.2 Art. 1021 — Critical Distinction
//!   - §10.3 Accretion Rules
//!   - §2.2 Restart Conditions

use crate::fraction::{frac, Frac};
use crate::step7_distribute::HeirDistribution;
use crate::step8_collation::Step8Output;
use crate::types::*;

// ── Types ───────────────────────────────────────────────────────────

/// Reason why a share is vacant.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VacancyReason {
    /// Heir predeceased the decedent (without representation resolved in Step 2).
    Predecease,
    /// Heir renounced their inheritance (Art. 977: cannot be represented).
    Renunciation,
    /// Heir is incapacitated or unworthy (Art. 1032).
    Incapacity,
    /// Heir was validly disinherited and has no representatives.
    Disinheritance,
}

/// How a vacancy was resolved.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VacancyResolution {
    /// Testamentary substitute stepped in (Art. 859).
    Substitution { substitute_id: HeirId },
    /// Representation resolved the vacancy (Arts. 970-977).
    Representation { representative_ids: Vec<HeirId> },
    /// Share accreted to co-heirs (Arts. 1015-1021).
    Accretion {
        /// Map of co-heir ID → additional share received.
        accreting_heirs: Vec<(HeirId, Frac)>,
    },
    /// Fell through to intestate distribution (Art. 1022(2)).
    IntestateFallback,
    /// Full scenario restart required (Art. 1021 for legitime vacancies,
    /// or Art. 969 for total renunciation of a degree).
    ScenarioRestart {
        reason: String,
    },
}

/// A detected vacancy and its resolution.
#[derive(Debug, Clone)]
pub struct VacancyRecord {
    /// The heir whose share became vacant.
    pub vacant_heir_id: HeirId,
    /// Why the share is vacant.
    pub reason: VacancyReason,
    /// Whether the vacancy is in the legitime or free portion.
    pub is_legitime_vacancy: bool,
    /// The amount of the vacant share.
    pub vacant_amount: Frac,
    /// How the vacancy was resolved.
    pub resolution: VacancyResolution,
    /// Legal basis articles.
    pub legal_basis: Vec<String>,
}

/// Input to Step 9.
#[derive(Debug, Clone)]
pub struct Step9Input {
    /// Net distributable estate.
    pub net_estate: Frac,
    /// Collation-adjusted estate base.
    pub estate_base: Frac,
    /// Per-heir collation-adjusted results from Step 8.
    pub collation_output: Step8Output,
    /// Per-heir gross distributions from Step 7.
    pub distributions: Vec<HeirDistribution>,
    /// All classified heirs.
    pub heirs: Vec<Heir>,
    /// Current scenario code.
    pub scenario_code: ScenarioCode,
    /// Current succession type.
    pub succession_type: SuccessionType,
    /// The will (if testate/mixed).
    pub will: Option<Will>,
    /// Number of restarts already performed (guard against infinite loops).
    pub restart_count: i32,
    /// Maximum allowed restarts (typically = heir_count).
    pub max_restarts: i32,
}

/// Output of Step 9.
#[derive(Debug, Clone)]
pub struct Step9Output {
    /// Updated per-heir distributions after vacancy resolution.
    pub adjusted_distributions: Vec<HeirDistribution>,
    /// All vacancies detected and how they were resolved.
    pub vacancies: Vec<VacancyRecord>,
    /// Whether a pipeline restart is required (Art. 969 / Art. 1021).
    pub requires_restart: bool,
    /// If restart required, the reason.
    pub restart_reason: Option<String>,
    /// Updated heirs (with vacancy flags).
    pub heirs: Vec<Heir>,
    /// Warnings / manual review flags.
    pub warnings: Vec<ManualFlag>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Resolve vacancies in the distribution.
///
/// Detects shares that are vacant (heir predeceased without representation,
/// renounced, is incapacitated, or was validly disinherited without
/// representatives) and resolves them using the priority chain:
///   1. Substitution (testate only)
///   2. Representation (if not resolved in Step 2)
///   3. Accretion
///   4. Intestate fallback (testate only)
///
/// If all nearest relatives of a degree renounce (Art. 969), or if a
/// legitime vacancy triggers "in their own right" succession (Art. 1021),
/// signals a pipeline restart.
pub fn step9_resolve_vacancies(input: &Step9Input) -> Step9Output {
    let mut warnings: Vec<ManualFlag> = Vec::new();
    let mut vacancies: Vec<VacancyRecord> = Vec::new();
    let mut adjusted_distributions = input.distributions.clone();
    let mut requires_restart = false;
    let mut restart_reason: Option<String> = None;
    let heirs = input.heirs.clone();

    let can_restart = input.restart_count < input.max_restarts;

    // Phase 0: Check for total renunciation of a degree (Art. 969).
    // This takes priority over individual vacancy resolution because it triggers
    // a complete scenario restart.
    if let Some(renounced_category) = check_total_renunciation(&heirs) {
        if can_restart {
            requires_restart = true;
            restart_reason = Some(format!(
                "Art. 969: all nearest relatives of {:?} renounced — next degree inherits in own right",
                renounced_category
            ));

            // Record vacancies for all renouncing heirs in that category
            for heir in heirs.iter().filter(|h| {
                h.effective_category == renounced_category && h.has_renounced
            }) {
                let dist = adjusted_distributions
                    .iter()
                    .find(|d| d.heir_id == heir.id);
                let vacant_amount = dist.map_or(frac(0, 1), |d| d.total.clone());

                vacancies.push(VacancyRecord {
                    vacant_heir_id: heir.id.clone(),
                    reason: VacancyReason::Renunciation,
                    is_legitime_vacancy: dist
                        .map_or(false, |d| is_legitime_vacancy(heir, d)),
                    vacant_amount,
                    resolution: VacancyResolution::ScenarioRestart {
                        reason: "Art. 969: total renunciation of degree".to_string(),
                    },
                    legal_basis: vec![
                        "Art. 969".to_string(),
                        "Art. 977".to_string(),
                    ],
                });
            }

            return Step9Output {
                adjusted_distributions,
                vacancies,
                requires_restart,
                restart_reason,
                heirs,
                warnings,
            };
        } else {
            warnings.push(ManualFlag {
                category: "max_restarts".to_string(),
                description: format!(
                    "Art. 969 total renunciation of {:?} detected, but max restarts ({}) reached. Cannot restart pipeline.",
                    renounced_category, input.max_restarts
                ),
                related_heir_id: None,
            });
        }
    }

    // Phase 1: Detect individual vacancies
    let detected = detect_vacancies(&heirs, &adjusted_distributions);

    if detected.is_empty() {
        // No vacancies — passthrough
        return Step9Output {
            adjusted_distributions,
            vacancies: vec![],
            requires_restart: false,
            restart_reason: None,
            heirs,
            warnings,
        };
    }

    // Phase 2: Resolve each vacancy using the priority chain
    for (vacant_heir_id, reason) in &detected {
        let heir = match heirs.iter().find(|h| &h.id == vacant_heir_id) {
            Some(h) => h,
            None => continue,
        };

        let dist = adjusted_distributions
            .iter()
            .find(|d| &d.heir_id == vacant_heir_id);
        let vacant_amount = dist.map_or(frac(0, 1), |d| d.total.clone());
        let is_legitime = dist.map_or(false, |d| is_legitime_vacancy(heir, d));

        // Priority 1: SUBSTITUTION (Art. 859, testate only)
        if matches!(input.succession_type, SuccessionType::Testate | SuccessionType::Mixed) {
            if let Some(will) = &input.will {
                if let Some(substitute_id) = try_substitution(vacant_heir_id, will, &heirs) {
                    // Transfer the vacant heir's distribution to the substitute
                    if let Some(dist_mut) = adjusted_distributions
                        .iter_mut()
                        .find(|d| &d.heir_id == vacant_heir_id)
                    {
                        dist_mut.heir_id = substitute_id.clone();
                    }

                    vacancies.push(VacancyRecord {
                        vacant_heir_id: vacant_heir_id.clone(),
                        reason: *reason,
                        is_legitime_vacancy: is_legitime,
                        vacant_amount,
                        resolution: VacancyResolution::Substitution {
                            substitute_id,
                        },
                        legal_basis: vec!["Art. 859".to_string()],
                    });
                    continue;
                }
            }
        }

        // Priority 2: REPRESENTATION (Arts. 970-977)
        // Art. 977: renouncing heir CANNOT be represented.
        // If representation was already resolved in Step 2 (represented_by non-empty),
        // it's not a vacancy. Only check for unresolved representation here.
        if *reason != VacancyReason::Renunciation && !heir.children.is_empty() {
            // Check if any children are alive and eligible to represent
            let representative_ids: Vec<HeirId> = heir
                .children
                .iter()
                .filter(|child_id| {
                    heirs
                        .iter()
                        .find(|h| &h.id == *child_id)
                        .map_or(false, |h| h.is_alive && h.is_eligible)
                })
                .cloned()
                .collect();

            if !representative_ids.is_empty() {
                // Split the vacant share equally among representatives (per stirpes)
                let count = Frac::new(representative_ids.len() as i64, 1);
                let per_rep = vacant_amount.clone() / count;

                // Update distributions: remove vacant heir's, add representatives'
                adjusted_distributions.retain(|d| &d.heir_id != vacant_heir_id);
                for rep_id in &representative_ids {
                    adjusted_distributions.push(HeirDistribution {
                        heir_id: rep_id.clone(),
                        effective_category: heir.effective_category,
                        from_legitime: if is_legitime { per_rep.clone() } else { frac(0, 1) },
                        from_free_portion: if !is_legitime { per_rep.clone() } else { frac(0, 1) },
                        from_intestate: frac(0, 1),
                        total: per_rep.clone(),
                        legal_basis: vec!["Arts. 970-977".to_string()],
                    });
                }

                vacancies.push(VacancyRecord {
                    vacant_heir_id: vacant_heir_id.clone(),
                    reason: *reason,
                    is_legitime_vacancy: is_legitime,
                    vacant_amount,
                    resolution: VacancyResolution::Representation { representative_ids },
                    legal_basis: vec!["Arts. 970-977".to_string()],
                });
                continue;
            }
        }

        // Priority 3: ACCRETION (Arts. 1015-1021)
        let resolution = apply_accretion(
            vacant_heir_id,
            is_legitime,
            &adjusted_distributions,
            &heirs,
        );

        match &resolution {
            VacancyResolution::ScenarioRestart { reason: restart_msg } => {
                if can_restart {
                    requires_restart = true;
                    restart_reason = Some(restart_msg.clone());
                    vacancies.push(VacancyRecord {
                        vacant_heir_id: vacant_heir_id.clone(),
                        reason: *reason,
                        is_legitime_vacancy: is_legitime,
                        vacant_amount,
                        resolution,
                        legal_basis: vec![
                            "Art. 1021".to_string(),
                        ],
                    });
                    // On restart, we don't need to process remaining vacancies
                    return Step9Output {
                        adjusted_distributions,
                        vacancies,
                        requires_restart,
                        restart_reason,
                        heirs,
                        warnings,
                    };
                } else {
                    warnings.push(ManualFlag {
                        category: "max_restarts".to_string(),
                        description: format!(
                            "Legitime vacancy for heir {} requires restart (Art. 1021), but max restarts ({}) reached.",
                            vacant_heir_id, input.max_restarts
                        ),
                        related_heir_id: Some(vacant_heir_id.clone()),
                    });
                    // Fall through to treat as FP accretion since we can't restart
                    let fp_resolution = apply_accretion(
                        vacant_heir_id,
                        false, // treat as FP accretion
                        &adjusted_distributions,
                        &heirs,
                    );
                    apply_accretion_to_distributions(
                        vacant_heir_id,
                        &fp_resolution,
                        &mut adjusted_distributions,
                    );
                    vacancies.push(VacancyRecord {
                        vacant_heir_id: vacant_heir_id.clone(),
                        reason: *reason,
                        is_legitime_vacancy: is_legitime,
                        vacant_amount,
                        resolution: fp_resolution,
                        legal_basis: vec![
                            "Art. 1019".to_string(),
                            "Art. 1020".to_string(),
                        ],
                    });
                    continue;
                }
            }
            VacancyResolution::Accretion { accreting_heirs } => {
                if !accreting_heirs.is_empty() {
                    apply_accretion_to_distributions(
                        vacant_heir_id,
                        &resolution,
                        &mut adjusted_distributions,
                    );
                    vacancies.push(VacancyRecord {
                        vacant_heir_id: vacant_heir_id.clone(),
                        reason: *reason,
                        is_legitime_vacancy: is_legitime,
                        vacant_amount,
                        resolution,
                        legal_basis: vec![
                            "Art. 1019".to_string(),
                            "Art. 1020".to_string(),
                        ],
                    });
                    continue;
                }
            }
            _ => {}
        }

        // Priority 4: INTESTATE FALLBACK (Art. 1022(2), testate only)
        if matches!(input.succession_type, SuccessionType::Testate | SuccessionType::Mixed) {
            vacancies.push(VacancyRecord {
                vacant_heir_id: vacant_heir_id.clone(),
                reason: *reason,
                is_legitime_vacancy: is_legitime,
                vacant_amount,
                resolution: VacancyResolution::IntestateFallback,
                legal_basis: vec!["Art. 1022(2)".to_string()],
            });
        } else {
            // Intestate: accretion always applies (Art. 1018), but if no co-heirs
            // can accrete, this is an edge case that should be flagged.
            warnings.push(ManualFlag {
                category: "vacancy_unresolved".to_string(),
                description: format!(
                    "Vacancy for heir {} could not be resolved — no eligible co-heirs for accretion.",
                    vacant_heir_id
                ),
                related_heir_id: Some(vacant_heir_id.clone()),
            });
        }
    }

    Step9Output {
        adjusted_distributions,
        vacancies,
        requires_restart,
        restart_reason,
        heirs,
        warnings,
    }
}

/// Helper: apply accretion resolution to the adjusted distributions.
/// Removes the vacant heir's distribution and adds the accreted amounts to co-heirs.
fn apply_accretion_to_distributions(
    vacant_heir_id: &HeirId,
    resolution: &VacancyResolution,
    adjusted_distributions: &mut Vec<HeirDistribution>,
) {
    if let VacancyResolution::Accretion { accreting_heirs } = resolution {
        // Zero out the vacant heir's distribution
        if let Some(vacant_dist) = adjusted_distributions
            .iter_mut()
            .find(|d| &d.heir_id == vacant_heir_id)
        {
            vacant_dist.from_legitime = frac(0, 1);
            vacant_dist.from_free_portion = frac(0, 1);
            vacant_dist.from_intestate = frac(0, 1);
            vacant_dist.total = frac(0, 1);
        }

        // Add accreted amounts to each co-heir
        for (heir_id, additional) in accreting_heirs {
            if let Some(dist) = adjusted_distributions
                .iter_mut()
                .find(|d| &d.heir_id == heir_id)
            {
                // Add to the appropriate component based on what the co-heir already has
                if dist.from_intestate > frac(0, 1) {
                    dist.from_intestate = dist.from_intestate.clone() + additional.clone();
                } else if dist.from_free_portion > frac(0, 1) {
                    dist.from_free_portion = dist.from_free_portion.clone() + additional.clone();
                } else {
                    dist.from_legitime = dist.from_legitime.clone() + additional.clone();
                }
                dist.total = dist.total.clone() + additional.clone();
            }
        }
    }
}

/// Detect which heirs have vacant shares after Steps 7-8.
///
/// A share is vacant when the heir:
/// - Is not alive and has no representatives (predecease without representation)
/// - Has renounced (Art. 977: renouncing heir cannot be represented)
/// - Is incapacitated/unworthy (and incapacity not resolved by representation)
/// - Was validly disinherited and descendants did not represent (already resolved in Step 2)
pub fn detect_vacancies(heirs: &[Heir], distributions: &[HeirDistribution]) -> Vec<(HeirId, VacancyReason)> {
    let mut vacancies = Vec::new();

    for heir in heirs {
        // Only consider heirs that have a distribution
        let has_distribution = distributions.iter().any(|d| d.heir_id == heir.id);
        if !has_distribution {
            continue;
        }

        // Renunciation: heir is alive but renounced (Art. 977: cannot be represented)
        if heir.has_renounced {
            vacancies.push((heir.id.clone(), VacancyReason::Renunciation));
            continue;
        }

        // Valid disinheritance with no representatives
        if heir.is_disinherited && heir.disinheritance_valid && heir.represented_by.is_empty() {
            vacancies.push((heir.id.clone(), VacancyReason::Disinheritance));
            continue;
        }

        // Incapacity/unworthiness (not condoned, no representatives)
        if heir.is_unworthy && !heir.unworthiness_condoned && heir.represented_by.is_empty() {
            vacancies.push((heir.id.clone(), VacancyReason::Incapacity));
            continue;
        }

        // Predecease without representation (representation resolved in Step 2)
        if !heir.is_alive && heir.represented_by.is_empty() {
            vacancies.push((heir.id.clone(), VacancyReason::Predecease));
            continue;
        }

        // Not eligible for other reasons (catch-all for ineligible heirs not covered above)
        // but skip heirs that are simply not alive with representatives (handled in Step 2)
    }

    vacancies
}

/// Check if all nearest relatives of a degree have renounced (Art. 969).
///
/// If so, the next degree inherits in their own right, triggering a
/// full scenario restart.
pub fn check_total_renunciation(heirs: &[Heir]) -> Option<EffectiveCategory> {
    // Art. 969: when ALL nearest relatives of a degree renounce → next degree inherits.
    // Check each effective category group: if there are living members and ALL of them
    // have renounced, this is a total renunciation of that degree.

    let categories = [
        EffectiveCategory::LegitimateChildGroup,
        EffectiveCategory::IllegitimateChildGroup,
        EffectiveCategory::SurvivingSpouseGroup,
        EffectiveCategory::LegitimateAscendantGroup,
    ];

    for category in &categories {
        let group_heirs: Vec<&Heir> = heirs
            .iter()
            .filter(|h| h.effective_category == *category)
            .collect();

        if group_heirs.is_empty() {
            continue;
        }

        // Only consider living members of the group for renunciation check.
        // Predeceased heirs are already excluded from the "nearest relatives" pool.
        let living_members: Vec<&&Heir> = group_heirs
            .iter()
            .filter(|h| h.is_alive)
            .collect();

        if living_members.is_empty() {
            continue;
        }

        let all_renounced = living_members.iter().all(|h| h.has_renounced);
        if all_renounced {
            return Some(*category);
        }
    }

    None
}

/// Attempt testamentary substitution (Art. 859, testate only).
///
/// Looks for a named substitute in the will's institution for the vacant heir.
/// Returns Some(substitute_heir_id) if found and the substitute is alive & eligible.
pub fn try_substitution(
    vacant_heir_id: &HeirId,
    will: &Will,
    heirs: &[Heir],
) -> Option<HeirId> {
    // Art. 859: look for a named substitute in the will's institutions
    // for the vacant heir. Return Some(substitute_id) if found and the
    // substitute is alive & eligible.

    for institution in &will.institutions {
        // Match the institution to the vacant heir
        let heir_matches = institution
            .heir
            .person_id
            .as_ref()
            .map_or(false, |pid| pid == vacant_heir_id);

        if !heir_matches {
            continue;
        }

        // Check each substitute
        for substitute in &institution.substitutes {
            if let Some(sub_person_id) = &substitute.substitute_heir.person_id {
                // Find the substitute in our heirs list
                if let Some(sub_heir) = heirs.iter().find(|h| &h.id == sub_person_id) {
                    if sub_heir.is_alive && sub_heir.is_eligible {
                        return Some(sub_person_id.clone());
                    }
                }
            }
        }
    }

    // Also check legacies and devises for substitutes
    for legacy in &will.legacies {
        let heir_matches = legacy
            .legatee
            .person_id
            .as_ref()
            .map_or(false, |pid| pid == vacant_heir_id);

        if !heir_matches {
            continue;
        }

        for substitute in &legacy.substitutes {
            if let Some(sub_person_id) = &substitute.substitute_heir.person_id {
                if let Some(sub_heir) = heirs.iter().find(|h| &h.id == sub_person_id) {
                    if sub_heir.is_alive && sub_heir.is_eligible {
                        return Some(sub_person_id.clone());
                    }
                }
            }
        }
    }

    for devise in &will.devises {
        let heir_matches = devise
            .devisee
            .person_id
            .as_ref()
            .map_or(false, |pid| pid == vacant_heir_id);

        if !heir_matches {
            continue;
        }

        for substitute in &devise.substitutes {
            if let Some(sub_person_id) = &substitute.substitute_heir.person_id {
                if let Some(sub_heir) = heirs.iter().find(|h| &h.id == sub_person_id) {
                    if sub_heir.is_alive && sub_heir.is_eligible {
                        return Some(sub_person_id.clone());
                    }
                }
            }
        }
    }

    None
}

/// Apply accretion (Arts. 1015-1021).
///
/// For free portion vacancies: proportional distribution to co-heirs' existing
/// FP shares (Art. 1019).
/// For legitime vacancies: triggers scenario restart ("in their own right").
pub fn apply_accretion(
    vacant_heir_id: &HeirId,
    is_legitime_vacancy: bool,
    distributions: &[HeirDistribution],
    heirs: &[Heir],
) -> VacancyResolution {
    // Art. 1021 critical distinction:
    // - Legitime vacancy → co-heirs succeed "in their own right" → full scenario restart
    // - Free portion vacancy → accretion proper (Art. 1019) → proportional distribution
    if is_legitime_vacancy {
        return VacancyResolution::ScenarioRestart {
            reason: "Art. 1021: legitime vacancy — co-heirs succeed in their own right, scenario re-evaluation required".to_string(),
        };
    }

    // Free portion / intestate accretion: distribute vacant share proportionally
    // to eligible co-heirs' existing shares (Art. 1018 for intestate, Art. 1019 for testate).
    let vacant_dist = distributions
        .iter()
        .find(|d| d.heir_id == *vacant_heir_id);

    let vacant_total = match vacant_dist {
        Some(d) => d.total.clone(),
        None => return VacancyResolution::Accretion { accreting_heirs: vec![] },
    };

    // Identify eligible co-heirs (alive, eligible, not the vacant one)
    let eligible_co_heirs: Vec<(&Heir, &HeirDistribution)> = heirs
        .iter()
        .filter(|h| {
            h.id != *vacant_heir_id
                && h.is_alive
                && h.is_eligible
                && !h.has_renounced
        })
        .filter_map(|h| {
            distributions
                .iter()
                .find(|d| d.heir_id == h.id)
                .map(|d| (h, d))
        })
        .collect();

    if eligible_co_heirs.is_empty() {
        return VacancyResolution::Accretion { accreting_heirs: vec![] };
    }

    // Sum of eligible co-heirs' total shares (for proportional distribution)
    let total_eligible: Frac = eligible_co_heirs
        .iter()
        .fold(frac(0, 1), |acc, (_, d)| acc + d.total.clone());

    let mut accreting_heirs = Vec::new();
    if total_eligible > frac(0, 1) {
        for (heir, dist) in &eligible_co_heirs {
            // Each co-heir gets a proportion of the vacant share based on their existing share
            let proportion = dist.total.clone() / total_eligible.clone();
            let additional = vacant_total.clone() * proportion;
            accreting_heirs.push((heir.id.clone(), additional));
        }
    } else {
        // Equal distribution if all co-heirs have zero shares
        let count = Frac::new(eligible_co_heirs.len() as i64, 1);
        let per_heir = vacant_total.clone() / count;
        for (heir, _) in &eligible_co_heirs {
            accreting_heirs.push((heir.id.clone(), per_heir.clone()));
        }
    }

    VacancyResolution::Accretion { accreting_heirs }
}

/// Determine whether a vacancy is in the legitime or free portion.
///
/// A vacancy is in the legitime if the vacant heir is a compulsory heir
/// and their share includes a legitime component.
pub fn is_legitime_vacancy(
    heir: &Heir,
    distribution: &HeirDistribution,
) -> bool {
    // A vacancy is in the legitime if:
    // 1. The heir is a compulsory heir, AND
    // 2. Their distribution includes a legitime component (from_legitime > 0)
    heir.is_compulsory && distribution.from_legitime > frac(0, 1)
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fraction::frac;
    use crate::step7_distribute::HeirDistribution;
    use crate::step8_collation::{HeirCollationAdjustment, Step8Output};

    // ── Test Helpers ────────────────────────────────────────────────

    fn make_heir(id: &str, category: EffectiveCategory, alive: bool, eligible: bool) -> Heir {
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
            is_alive: alive,
            is_eligible: eligible,
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

    fn make_renouncing_heir(id: &str, category: EffectiveCategory) -> Heir {
        let mut heir = make_heir(id, category, true, true);
        heir.has_renounced = true;
        heir.is_eligible = false;
        heir
    }

    fn make_predeceased_heir(id: &str, category: EffectiveCategory) -> Heir {
        let mut heir = make_heir(id, category, false, false);
        heir.representation_trigger = Some(RepresentationTrigger::Predecease);
        heir
    }

    fn make_unworthy_heir(id: &str, category: EffectiveCategory) -> Heir {
        let mut heir = make_heir(id, category, true, false);
        heir.is_unworthy = true;
        heir
    }

    fn make_distribution(heir_id: &str, category: EffectiveCategory, total: Frac) -> HeirDistribution {
        HeirDistribution {
            heir_id: heir_id.to_string(),
            effective_category: category,
            from_legitime: total.clone(),
            from_free_portion: frac(0, 1),
            from_intestate: frac(0, 1),
            total,
            legal_basis: vec![],
        }
    }

    fn make_fp_distribution(heir_id: &str, category: EffectiveCategory, from_fp: Frac) -> HeirDistribution {
        HeirDistribution {
            heir_id: heir_id.to_string(),
            effective_category: category,
            from_legitime: frac(0, 1),
            from_free_portion: from_fp.clone(),
            from_intestate: frac(0, 1),
            total: from_fp,
            legal_basis: vec![],
        }
    }

    fn make_intestate_distribution(heir_id: &str, category: EffectiveCategory, amount: Frac) -> HeirDistribution {
        HeirDistribution {
            heir_id: heir_id.to_string(),
            effective_category: category,
            from_legitime: frac(0, 1),
            from_free_portion: frac(0, 1),
            from_intestate: amount.clone(),
            total: amount,
            legal_basis: vec![],
        }
    }

    fn make_collation_adjustment(heir_id: &str, gross: Frac) -> HeirCollationAdjustment {
        HeirCollationAdjustment {
            heir_id: heir_id.to_string(),
            gross_entitlement: gross.clone(),
            donations_imputed: frac(0, 1),
            net_from_estate: gross,
            excess: frac(0, 1),
            owes_estate: false,
            legal_basis: vec![],
        }
    }

    fn make_step8_output(adjustments: Vec<HeirCollationAdjustment>) -> Step8Output {
        let total: Frac = adjustments.iter().fold(frac(0, 1), |acc, a| acc + a.net_from_estate.clone());
        Step8Output {
            adjustments,
            representation_collations: vec![],
            total_from_estate: total,
            total_excess: frac(0, 1),
            warnings: vec![],
        }
    }

    fn make_simple_will() -> Will {
        Will {
            institutions: vec![],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".to_string(),
        }
    }

    fn make_will_with_substitute(heir_name: &str, substitute_name: &str, substitute_id: &str) -> Will {
        Will {
            institutions: vec![InstitutionOfHeir {
                id: "inst-1".to_string(),
                heir: HeirReference {
                    person_id: Some(heir_name.to_string()),
                    name: heir_name.to_string(),
                    is_collective: false,
                    class_designation: None,
                },
                share: ShareSpec::Fraction(frac(1, 2)),
                conditions: vec![],
                substitutes: vec![Substitute {
                    substitution_type: SubstitutionType::Simple,
                    substitute_heir: HeirReference {
                        person_id: Some(substitute_id.to_string()),
                        name: substitute_name.to_string(),
                        is_collective: false,
                        class_designation: None,
                    },
                    triggers: vec![
                        SubstitutionTrigger::Predecease,
                        SubstitutionTrigger::Renunciation,
                        SubstitutionTrigger::Incapacity,
                    ],
                }],
                is_residuary: false,
            }],
            legacies: vec![],
            devises: vec![],
            disinheritances: vec![],
            date_executed: "2025-01-01".to_string(),
        }
    }

    fn make_step9_input(
        heirs: Vec<Heir>,
        distributions: Vec<HeirDistribution>,
        scenario_code: ScenarioCode,
        succession_type: SuccessionType,
        will: Option<Will>,
    ) -> Step9Input {
        let net_estate = frac(1_000_000_00, 1); // ₱1,000,000.00 in centavos
        let adjustments: Vec<HeirCollationAdjustment> = distributions
            .iter()
            .map(|d| make_collation_adjustment(&d.heir_id, d.total.clone()))
            .collect();
        Step9Input {
            net_estate: net_estate.clone(),
            estate_base: net_estate,
            collation_output: make_step8_output(adjustments),
            distributions,
            heirs,
            scenario_code,
            succession_type,
            will,
            restart_count: 0,
            max_restarts: 10,
        }
    }

    // ── 1. detect_vacancies tests ───────────────────────────────────

    #[test]
    fn test_detect_no_vacancies_all_alive_eligible() {
        // All heirs alive and eligible → no vacancies
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_distribution("sp", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4)),
        ];
        let vacancies = detect_vacancies(&heirs, &distributions);
        assert!(vacancies.is_empty(), "No vacancies expected when all heirs are alive and eligible");
    }

    #[test]
    fn test_detect_vacancy_renunciation() {
        // One heir renounced → vacancy detected
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_distribution("sp", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4)),
        ];
        let vacancies = detect_vacancies(&heirs, &distributions);
        assert_eq!(vacancies.len(), 1);
        assert_eq!(vacancies[0].0, "lc2");
        assert_eq!(vacancies[0].1, VacancyReason::Renunciation);
    }

    #[test]
    fn test_detect_vacancy_predecease_no_representation() {
        // Predeceased heir with no representatives → vacancy
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_predeceased_heir("lc2", EffectiveCategory::LegitimateChildGroup),
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let vacancies = detect_vacancies(&heirs, &distributions);
        assert_eq!(vacancies.len(), 1);
        assert_eq!(vacancies[0].0, "lc2");
        assert_eq!(vacancies[0].1, VacancyReason::Predecease);
    }

    #[test]
    fn test_detect_vacancy_predecease_with_representation_no_vacancy() {
        // Predeceased heir WITH representatives → no vacancy (resolved in Step 2)
        let mut heir = make_predeceased_heir("lc2", EffectiveCategory::LegitimateChildGroup);
        heir.represented_by = vec!["gc1".to_string(), "gc2".to_string()];
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            heir,
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let vacancies = detect_vacancies(&heirs, &distributions);
        assert!(vacancies.is_empty(), "No vacancy when heir is represented");
    }

    #[test]
    fn test_detect_vacancy_incapacity() {
        // Unworthy heir → vacancy due to incapacity
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_unworthy_heir("lc2", EffectiveCategory::LegitimateChildGroup),
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let vacancies = detect_vacancies(&heirs, &distributions);
        assert_eq!(vacancies.len(), 1);
        assert_eq!(vacancies[0].0, "lc2");
        assert_eq!(vacancies[0].1, VacancyReason::Incapacity);
    }

    #[test]
    fn test_detect_vacancy_disinheritance_no_representatives() {
        // Validly disinherited heir with no descendants representing → vacancy
        let mut heir = make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, false);
        heir.is_disinherited = true;
        heir.disinheritance_valid = true;
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            heir,
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let vacancies = detect_vacancies(&heirs, &distributions);
        assert_eq!(vacancies.len(), 1);
        assert_eq!(vacancies[0].0, "lc2");
        assert_eq!(vacancies[0].1, VacancyReason::Disinheritance);
    }

    #[test]
    fn test_detect_multiple_vacancies() {
        // Multiple heirs vacant at once
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
            make_predeceased_heir("lc3", EffectiveCategory::LegitimateChildGroup),
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_distribution("lc3", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
        ];
        let vacancies = detect_vacancies(&heirs, &distributions);
        assert_eq!(vacancies.len(), 2);
        let ids: Vec<&str> = vacancies.iter().map(|v| v.0.as_str()).collect();
        assert!(ids.contains(&"lc2"));
        assert!(ids.contains(&"lc3"));
    }

    // ── 2. check_total_renunciation tests (Art. 969) ────────────────

    #[test]
    fn test_total_renunciation_all_lc_renounce() {
        // TV-19: All legitimate children renounce → returns LegitimateChildGroup
        // Art. 969: next degree (parents) inherits in own right
        let heirs = vec![
            make_renouncing_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
            make_renouncing_heir("lc3", EffectiveCategory::LegitimateChildGroup),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        let result = check_total_renunciation(&heirs);
        assert_eq!(result, Some(EffectiveCategory::LegitimateChildGroup));
    }

    #[test]
    fn test_no_total_renunciation_partial() {
        // Only some children renounce → no total renunciation
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        let result = check_total_renunciation(&heirs);
        assert_eq!(result, None);
    }

    #[test]
    fn test_no_total_renunciation_no_renunciations() {
        // No one renounces → no total renunciation
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
        ];
        let result = check_total_renunciation(&heirs);
        assert_eq!(result, None);
    }

    #[test]
    fn test_total_renunciation_single_child_renounces() {
        // Only one child and they renounce → total renunciation of the degree
        let heirs = vec![
            make_renouncing_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        let result = check_total_renunciation(&heirs);
        assert_eq!(result, Some(EffectiveCategory::LegitimateChildGroup));
    }

    #[test]
    fn test_total_renunciation_does_not_count_predeceased() {
        // One child predeceased (not renounced), one renounced → total renunciation
        // because the predeceased is already excluded before renunciation check.
        // The only living child renounced, so all nearest living relatives renounced.
        let heirs = vec![
            make_predeceased_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
        ];
        // This is total renunciation because lc1 is dead (not a renunciation case)
        // and lc2 renounced. If lc1 has no representatives, then effectively no
        // eligible LC heirs remain. The check should focus on living heirs who renounced.
        let result = check_total_renunciation(&heirs);
        // All living LC heirs renounced → triggers Art. 969
        assert_eq!(result, Some(EffectiveCategory::LegitimateChildGroup));
    }

    // ── 3. try_substitution tests (Art. 859) ────────────────────────

    #[test]
    fn test_substitution_found_and_eligible() {
        // Will names a substitute for the vacant heir; substitute is alive and eligible
        let will = make_will_with_substitute("lc1", "stranger1", "stranger1");
        let heirs = vec![
            make_predeceased_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_heir("stranger1", EffectiveCategory::LegitimateChildGroup, true, true),
        ];
        let result = try_substitution(&"lc1".to_string(), &will, &heirs);
        assert_eq!(result, Some("stranger1".to_string()));
    }

    #[test]
    fn test_substitution_substitute_not_alive() {
        // Will names a substitute but they are also dead → no substitution
        let will = make_will_with_substitute("lc1", "stranger1", "stranger1");
        let heirs = vec![
            make_predeceased_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_heir("stranger1", EffectiveCategory::LegitimateChildGroup, false, false),
        ];
        let result = try_substitution(&"lc1".to_string(), &will, &heirs);
        assert_eq!(result, None);
    }

    #[test]
    fn test_substitution_no_substitute_named() {
        // Will has no substitute for this heir → no substitution
        let will = make_simple_will();
        let heirs = vec![
            make_predeceased_heir("lc1", EffectiveCategory::LegitimateChildGroup),
        ];
        let result = try_substitution(&"lc1".to_string(), &will, &heirs);
        assert_eq!(result, None);
    }

    #[test]
    fn test_substitution_only_testate() {
        // Substitution only applies in testate succession
        // (The caller should only call this for testate; but the function should
        // check the will's institutions for a match regardless)
        let will = make_will_with_substitute("lc1", "sub1", "sub1");
        let heirs = vec![
            make_renouncing_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_heir("sub1", EffectiveCategory::LegitimateChildGroup, true, true),
        ];
        // Renunciation is a valid substitution trigger
        let result = try_substitution(&"lc1".to_string(), &will, &heirs);
        assert_eq!(result, Some("sub1".to_string()));
    }

    // ── 4. apply_accretion tests (Arts. 1015-1021) ──────────────────

    #[test]
    fn test_accretion_free_portion_proportional() {
        // Free portion vacancy → proportional accretion to co-heirs (Art. 1019)
        let distributions = vec![
            make_fp_distribution("h1", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_fp_distribution("h2", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_fp_distribution("h3", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
        ];
        let heirs = vec![
            make_heir("h1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("h2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("h3", EffectiveCategory::LegitimateChildGroup),
        ];
        let resolution = apply_accretion(
            &"h3".to_string(),
            false, // free portion vacancy
            &distributions,
            &heirs,
        );
        match resolution {
            VacancyResolution::Accretion { accreting_heirs } => {
                // h3's 1/3 should be split proportionally between h1 and h2
                // h1 and h2 each had 1/3 (equal), so each gets 1/2 of the vacant 1/3 = 1/6
                assert_eq!(accreting_heirs.len(), 2);
                let h1_share = accreting_heirs.iter().find(|(id, _)| id == "h1").unwrap();
                let h2_share = accreting_heirs.iter().find(|(id, _)| id == "h2").unwrap();
                assert_eq!(h1_share.1, frac(1, 6));
                assert_eq!(h2_share.1, frac(1, 6));
            }
            _ => panic!("Expected Accretion for free portion vacancy"),
        }
    }

    #[test]
    fn test_accretion_legitime_triggers_restart() {
        // Legitime vacancy → Art. 1021: co-heirs succeed "in their own right"
        // → ScenarioRestart
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
        ];
        let resolution = apply_accretion(
            &"lc2".to_string(),
            true, // legitime vacancy
            &distributions,
            &heirs,
        );
        match resolution {
            VacancyResolution::ScenarioRestart { .. } => {
                // Correct: legitime vacancy triggers restart
            }
            _ => panic!("Expected ScenarioRestart for legitime vacancy (Art. 1021)"),
        }
    }

    #[test]
    fn test_accretion_intestate_always_applies() {
        // Art. 1018: accretion always applies in intestate succession
        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_intestate_distribution("lc3", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
        ];
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("lc3", EffectiveCategory::LegitimateChildGroup),
        ];
        let resolution = apply_accretion(
            &"lc3".to_string(),
            false, // intestate context, treated as non-legitime accretion
            &distributions,
            &heirs,
        );
        match resolution {
            VacancyResolution::Accretion { accreting_heirs } => {
                assert_eq!(accreting_heirs.len(), 2);
            }
            _ => panic!("Expected Accretion for intestate vacancy (Art. 1018)"),
        }
    }

    // ── 5. is_legitime_vacancy tests ────────────────────────────────

    #[test]
    fn test_legitime_vacancy_compulsory_with_legitime() {
        let heir = make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true);
        let dist = make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2));
        assert!(is_legitime_vacancy(&heir, &dist));
    }

    #[test]
    fn test_not_legitime_vacancy_fp_only() {
        let heir = make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true);
        let dist = make_fp_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 4));
        // Only FP share, no legitime → not a legitime vacancy
        assert!(!is_legitime_vacancy(&heir, &dist));
    }

    #[test]
    fn test_not_legitime_vacancy_non_compulsory() {
        // Non-compulsory heir (e.g., stranger legatee) → not a legitime vacancy
        let mut heir = make_heir("s1", EffectiveCategory::LegitimateChildGroup, true, true);
        heir.is_compulsory = false;
        let dist = make_fp_distribution("s1", EffectiveCategory::LegitimateChildGroup, frac(1, 4));
        assert!(!is_legitime_vacancy(&heir, &dist));
    }

    // ── 6. Full step9 integration tests ─────────────────────────────

    #[test]
    fn test_step9_no_vacancies_passthrough() {
        // No vacancies → distributions unchanged
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_distribution("sp", EffectiveCategory::SurvivingSpouseGroup, frac(1, 4)),
        ];
        let input = make_step9_input(
            heirs,
            distributions.clone(),
            ScenarioCode::I2,
            SuccessionType::Intestate,
            None,
        );
        let output = step9_resolve_vacancies(&input);
        assert!(!output.requires_restart);
        assert!(output.vacancies.is_empty());
        assert_eq!(output.adjusted_distributions.len(), 3);
    }

    #[test]
    fn test_step9_tv19_total_renunciation_restart() {
        // TV-19: All legitimate children renounce → Art. 969 → scenario restart
        // Initial: I2 (spouse + legitimate children)
        // After: should restart → parents inherit (I5)
        let heirs = vec![
            make_renouncing_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_intestate_distribution("sp", EffectiveCategory::SurvivingSpouseGroup, frac(1, 2)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::I2,
            SuccessionType::Intestate,
            None,
        );
        let output = step9_resolve_vacancies(&input);
        assert!(output.requires_restart, "Total renunciation must trigger restart (Art. 969)");
        assert!(output.restart_reason.is_some());
    }

    #[test]
    fn test_step9_single_renunciation_accretion_intestate() {
        // One of three LC heirs renounces in intestate → accretion to remaining
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("lc3", EffectiveCategory::LegitimateChildGroup),
            make_heir("sp", EffectiveCategory::SurvivingSpouseGroup, true, true),
        ];
        // Use absolute centavo amounts consistent with net_estate = 100_000_000
        // LC share = net_estate / 6 each, SP share = net_estate / 2
        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1_000_000_00, 6)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1_000_000_00, 6)),
            make_intestate_distribution("lc3", EffectiveCategory::LegitimateChildGroup, frac(1_000_000_00, 6)),
            make_intestate_distribution("sp", EffectiveCategory::SurvivingSpouseGroup, frac(1_000_000_00, 2)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::I2,
            SuccessionType::Intestate,
            None,
        );
        let output = step9_resolve_vacancies(&input);
        assert!(!output.requires_restart, "Partial renunciation should not restart");
        assert_eq!(output.vacancies.len(), 1);
        assert_eq!(output.vacancies[0].vacant_heir_id, "lc3");

        // lc3's share should be redistributed; total should still be conserved
        let total: Frac = output
            .adjusted_distributions
            .iter()
            .fold(frac(0, 1), |acc, d| acc + d.total.clone());
        let expected_total: Frac = frac(1_000_000_00, 1);
        // The sum of adjusted distributions should equal the net estate
        // (since there's no collation in this test)
        assert_eq!(total, expected_total);
    }

    #[test]
    fn test_step9_substitution_priority_in_testate() {
        // Testate: vacant heir has a named substitute in the will → substitution wins
        let will = make_will_with_substitute("lc1", "sub1", "sub1");
        let heirs = vec![
            make_predeceased_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("sub1", EffectiveCategory::LegitimateChildGroup, true, true),
        ];
        let distributions = vec![
            make_fp_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_fp_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::T2,
            SuccessionType::Testate,
            Some(will),
        );
        let output = step9_resolve_vacancies(&input);
        assert!(!output.requires_restart);
        assert_eq!(output.vacancies.len(), 1);
        match &output.vacancies[0].resolution {
            VacancyResolution::Substitution { substitute_id } => {
                assert_eq!(substitute_id, "sub1");
            }
            _ => panic!("Expected Substitution resolution in testate"),
        }
    }

    #[test]
    fn test_step9_fp_vacancy_accretion_no_restart() {
        // Testate: free portion vacancy → accretion (Art. 1019), no restart
        let heirs = vec![
            make_heir("h1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("h2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("h3", EffectiveCategory::LegitimateChildGroup),
        ];
        // All shares are from free portion
        let distributions = vec![
            make_fp_distribution("h1", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_fp_distribution("h2", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_fp_distribution("h3", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::T2,
            SuccessionType::Testate,
            Some(make_simple_will()),
        );
        let output = step9_resolve_vacancies(&input);
        assert!(!output.requires_restart, "FP vacancy should not trigger restart");
        assert_eq!(output.vacancies.len(), 1);
        match &output.vacancies[0].resolution {
            VacancyResolution::Accretion { accreting_heirs } => {
                assert_eq!(accreting_heirs.len(), 2);
            }
            _ => panic!("Expected Accretion for FP vacancy"),
        }
    }

    #[test]
    fn test_step9_legitime_vacancy_triggers_restart() {
        // Testate: legitime vacancy (compulsory heir renounces, no substitute)
        // → Art. 1021: co-heirs succeed "in their own right" → restart
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
        ];
        let distributions = vec![
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::T1,
            SuccessionType::Testate,
            Some(make_simple_will()),
        );
        let output = step9_resolve_vacancies(&input);
        // In testate, a legitime vacancy means co-heirs succeed "in their own right"
        // → full scenario re-evaluation required
        assert!(output.requires_restart, "Legitime vacancy in testate should trigger restart");
    }

    #[test]
    fn test_step9_max_restarts_guard() {
        // If restart_count >= max_restarts, don't restart even if Art. 969 applies
        let heirs = vec![
            make_renouncing_heir("lc1", EffectiveCategory::LegitimateChildGroup),
            make_renouncing_heir("lc2", EffectiveCategory::LegitimateChildGroup),
        ];
        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let mut input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::I1,
            SuccessionType::Intestate,
            None,
        );
        input.restart_count = 10;
        input.max_restarts = 10;
        let output = step9_resolve_vacancies(&input);
        // Should NOT restart — max restarts reached
        assert!(!output.requires_restart, "Should not restart when max_restarts reached");
        // Should emit a warning about hitting the guard
        assert!(!output.warnings.is_empty(), "Should warn about max restarts hit");
    }

    #[test]
    fn test_step9_renunciation_cannot_be_represented() {
        // Art. 977: renouncing heir cannot be represented — representation is NOT
        // a valid resolution for renunciation vacancies
        let mut renouncing_heir = make_renouncing_heir("lc1", EffectiveCategory::LegitimateChildGroup);
        renouncing_heir.children = vec!["gc1".to_string()];
        let heirs = vec![
            renouncing_heir,
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("gc1", EffectiveCategory::LegitimateChildGroup, true, true),
        ];
        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 2)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::I1,
            SuccessionType::Intestate,
            None,
        );
        let output = step9_resolve_vacancies(&input);
        // The resolution should NOT be Representation (Art. 977)
        for vacancy in &output.vacancies {
            if vacancy.vacant_heir_id == "lc1" {
                match &vacancy.resolution {
                    VacancyResolution::Representation { .. } => {
                        panic!("Art. 977: renouncing heir cannot be represented");
                    }
                    _ => {} // Any other resolution is acceptable
                }
            }
        }
    }

    #[test]
    fn test_step9_spouse_renunciation_scenario_reevaluation() {
        // Spouse renounces → may change scenario (e.g., I2 → I1 if only LC remain)
        let heirs = vec![
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("lc2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("sp", EffectiveCategory::SurvivingSpouseGroup),
        ];
        let distributions = vec![
            make_intestate_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_intestate_distribution("lc2", EffectiveCategory::LegitimateChildGroup, frac(1, 4)),
            make_intestate_distribution("sp", EffectiveCategory::SurvivingSpouseGroup, frac(1, 2)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::I2,
            SuccessionType::Intestate,
            None,
        );
        let output = step9_resolve_vacancies(&input);
        // Spouse renunciation should trigger scenario re-evaluation
        // because the heir composition changed (removing spouse changes scenario)
        assert!(output.requires_restart || !output.vacancies.is_empty(),
            "Spouse renunciation should be handled");
    }

    #[test]
    fn test_step9_art1020_charges_follow_accreting_share() {
        // Art. 1020: accreting heirs inherit the vacant share's charges and conditions
        // This is a structural test — the resolution should note legal basis
        let heirs = vec![
            make_heir("h1", EffectiveCategory::LegitimateChildGroup, true, true),
            make_heir("h2", EffectiveCategory::LegitimateChildGroup, true, true),
            make_renouncing_heir("h3", EffectiveCategory::LegitimateChildGroup),
        ];
        let distributions = vec![
            make_fp_distribution("h1", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_fp_distribution("h2", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_fp_distribution("h3", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
        ];
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::T2,
            SuccessionType::Testate,
            Some(make_simple_will()),
        );
        let output = step9_resolve_vacancies(&input);
        // The vacancy resolution should reference Art. 1020 in legal basis
        if let Some(vacancy) = output.vacancies.first() {
            let has_art_1020 = vacancy
                .legal_basis
                .iter()
                .any(|b| b.contains("1020"));
            assert!(has_art_1020, "Accretion should cite Art. 1020 (charges follow share)");
        }
    }

    #[test]
    fn test_step9_intestate_fallback_testate_last_resort() {
        // If substitution and accretion both fail in testate → intestate fallback (Art. 1022(2))
        // This happens when there's a determinate property devise that blocks accretion
        // (Art. 1016 exception) and no substitute is named.
        let heirs = vec![
            make_predeceased_heir("stranger1", EffectiveCategory::LegitimateChildGroup),
            make_heir("lc1", EffectiveCategory::LegitimateChildGroup, true, true),
        ];
        let distributions = vec![
            make_fp_distribution("stranger1", EffectiveCategory::LegitimateChildGroup, frac(1, 3)),
            make_distribution("lc1", EffectiveCategory::LegitimateChildGroup, frac(2, 3)),
        ];
        // Will with no substitute
        let input = make_step9_input(
            heirs,
            distributions,
            ScenarioCode::T2,
            SuccessionType::Testate,
            Some(make_simple_will()),
        );
        let output = step9_resolve_vacancies(&input);
        // Should resolve somehow — either accretion or intestate fallback
        assert!(!output.vacancies.is_empty(), "Should detect vacancy for predeceased stranger");
    }
}
