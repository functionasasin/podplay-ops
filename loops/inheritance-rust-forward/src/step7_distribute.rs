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

use std::collections::HashMap;

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

// ── Helpers ─────────────────────────────────────────────────────────

/// Create an intestate distribution record for a single heir.
fn make_intestate_dist(
    heir_id: &str,
    category: EffectiveCategory,
    amount: Frac,
    basis: Vec<String>,
) -> HeirDistribution {
    HeirDistribution {
        heir_id: heir_id.into(),
        effective_category: category,
        from_legitime: Frac::zero(),
        from_free_portion: Frac::zero(),
        from_intestate: amount.clone(),
        total: amount,
        legal_basis: basis,
    }
}

/// Derive the intestate scenario code from line counts.
fn derive_intestate_scenario(lc: &LineCounts) -> ScenarioCode {
    let has_lc = lc.legitimate_child > 0;
    let has_ic = lc.illegitimate_child > 0;
    let has_spouse = lc.surviving_spouse > 0;
    let has_asc = lc.legitimate_ascendant > 0;

    match (has_lc, has_ic, has_spouse, has_asc) {
        (true, false, false, false) => ScenarioCode::I1,
        (true, false, true, false) => ScenarioCode::I2,
        (true, true, false, false) => ScenarioCode::I3,
        (true, true, true, false) => ScenarioCode::I4,
        (false, false, false, true) => ScenarioCode::I5,
        (false, false, true, true) => ScenarioCode::I6,
        (false, true, false, false) => ScenarioCode::I7,
        (false, true, true, false) => ScenarioCode::I8,
        (false, true, false, true) => ScenarioCode::I9,
        (false, true, true, true) => ScenarioCode::I10,
        (false, false, true, false) => ScenarioCode::I11,
        _ => ScenarioCode::I15, // I12-I14 need collateral detection beyond LineCounts
    }
}

/// Compute the value of a testamentary institution.
fn compute_institution_value(inst: &InstitutionOfHeir, estate_base: &Frac, fp_disposable: &Frac) -> Frac {
    match &inst.share {
        ShareSpec::Fraction(f) => estate_base * f,
        ShareSpec::EntireEstate => estate_base.clone(),
        ShareSpec::EntireFreePort => fp_disposable.clone(),
        ShareSpec::EqualWithOthers => Frac::zero(),
        ShareSpec::Unspecified => Frac::zero(),
        ShareSpec::Residuary => Frac::zero(), // handled by has_residuary check
    }
}

/// Compute the value of a legacy.
fn compute_legacy_value(legacy: &Legacy) -> Frac {
    match &legacy.property {
        LegacySpec::FixedAmount(money) => Frac::from_money_centavos(&money.centavos),
        LegacySpec::SpecificAsset(_) => Frac::zero(),
        LegacySpec::GenericClass(_, money) => Frac::from_money_centavos(&money.centavos),
    }
}

/// Compute the value of a devise.
fn compute_devise_value(devise: &Devise) -> Frac {
    match &devise.property {
        DeviseSpec::SpecificProperty(_) => Frac::zero(),
        DeviseSpec::FractionalInterest(_, _) => Frac::zero(),
    }
}

// ── Public API ──────────────────────────────────────────────────────

/// Main entry point: distribute the estate based on succession type.
pub fn step7_distribute(input: &Step7Input) -> Step7Output {
    match input.succession_type {
        SuccessionType::Intestate | SuccessionType::IntestateByPreterition => {
            // For IntestateByPreterition, the scenario_code from Step 3 is still a
            // testate code (e.g. T3). Derive the correct intestate scenario from
            // line counts so compute_intestate_distribution gets an I-code.
            let scenario = if input.succession_type == SuccessionType::IntestateByPreterition {
                derive_intestate_scenario(&input.line_counts)
            } else {
                input.scenario_code
            };
            // Distribute on estate_base (collation-adjusted) so that Step 8 can
            // impute donations against gross entitlements. When there are no
            // donations, estate_base == net_estate and this is a no-op change.
            let distributions = compute_intestate_distribution(
                &input.estate_base,
                &input.heirs,
                &input.line_counts,
                &scenario,
            );
            Step7Output {
                distributions,
                will_coverage: None,
                final_succession_type: input.succession_type,
                intestate_scenario: Some(scenario),
                warnings: vec![],
            }
        }
        SuccessionType::Testate | SuccessionType::Mixed => {
            let will = input.will.as_ref().expect("Testate/Mixed requires a will");

            // Determine will coverage to detect Mixed vs Testate
            let coverage = determine_will_coverage(
                will,
                &input.estate_base,
                &input.heir_legitimes,
                &input.free_portion,
                &input.heirs,
            );

            let final_succession_type = if coverage.disposes_of_entire_estate {
                SuccessionType::Testate
            } else {
                SuccessionType::Mixed
            };

            // Phase 1: Compulsory heirs get their legitimes
            // For represented lines (disinherited/predeceased/unworthy heirs),
            // the line ancestor gets 0 and their share is split among representatives.
            let mut distributions: Vec<HeirDistribution> = Vec::new();
            for hl in &input.heir_legitimes {
                let heir = input.heirs.iter().find(|h| h.id == hl.heir_id);
                let represented_by = heir.map(|h| &h.represented_by);

                if let Some(reps) = represented_by {
                    if !reps.is_empty() {
                        // Heir's line is represented — heir gets 0, representatives split the share
                        distributions.push(HeirDistribution {
                            heir_id: hl.heir_id.clone(),
                            effective_category: hl.effective_category,
                            from_legitime: Frac::zero(),
                            from_free_portion: Frac::zero(),
                            from_intestate: Frac::zero(),
                            total: Frac::zero(),
                            legal_basis: hl.legal_basis.clone(),
                        });
                        let rep_count = frac(reps.len() as i64, 1);
                        let per_rep = &hl.legitime_amount / &rep_count;
                        for rep_id in reps {
                            distributions.push(HeirDistribution {
                                heir_id: rep_id.clone(),
                                effective_category: hl.effective_category,
                                from_legitime: per_rep.clone(),
                                from_free_portion: Frac::zero(),
                                from_intestate: Frac::zero(),
                                total: per_rep.clone(),
                                legal_basis: vec!["Art. 923".into(), "Art. 970".into()],
                            });
                        }
                        continue;
                    }
                }

                // Normal case: heir gets their own legitime
                distributions.push(HeirDistribution {
                    heir_id: hl.heir_id.clone(),
                    effective_category: hl.effective_category,
                    from_legitime: hl.legitime_amount.clone(),
                    from_free_portion: Frac::zero(),
                    from_intestate: Frac::zero(),
                    total: hl.legitime_amount.clone(),
                    legal_basis: hl.legal_basis.clone(),
                });
            }

            // Phase 2: Distribute will dispositions from FP
            for inst in &will.institutions {
                let heir_id = inst
                    .heir
                    .person_id
                    .as_deref()
                    .unwrap_or(&inst.heir.name);

                if inst.is_residuary {
                    // Residuary captures remaining FP
                    let used_fp: Frac = distributions
                        .iter()
                        .map(|d| &d.from_free_portion)
                        .fold(Frac::zero(), |acc, f| &acc + f);
                    let remaining_fp = &input.free_portion.fp_disposable - &used_fp;
                    let remaining_fp = if remaining_fp.is_negative() {
                        Frac::zero()
                    } else {
                        remaining_fp
                    };
                    add_fp_to_distributions(&mut distributions, heir_id, remaining_fp);
                    continue;
                }

                let inst_value = compute_institution_value(
                    inst,
                    &input.estate_base,
                    &input.free_portion.fp_disposable,
                );
                let is_compulsory = input
                    .heir_legitimes
                    .iter()
                    .any(|hl| hl.heir_id == heir_id);

                if is_compulsory {
                    let heir_legitime = input
                        .heir_legitimes
                        .iter()
                        .find(|hl| hl.heir_id == heir_id)
                        .map(|hl| &hl.legitime_amount)
                        .cloned()
                        .unwrap_or_else(Frac::zero);
                    let excess = &inst_value - &heir_legitime;
                    if excess.is_positive() {
                        add_fp_to_distributions(&mut distributions, heir_id, excess);
                    }
                } else {
                    add_fp_to_distributions(&mut distributions, heir_id, inst_value);
                }
            }

            // Legacies — use reduced amounts from Step 6 inofficiousness if applicable
            for legacy in &will.legacies {
                let mut legacy_value = compute_legacy_value(legacy);
                // Apply inofficiousness reductions from Step 6
                if let Some(ref validation) = input.validation {
                    if validation.inofficiousness.detected {
                        for reduction in &validation.inofficiousness.reductions {
                            if reduction.target_id == legacy.id {
                                legacy_value = reduction.remaining_amount.clone();
                                break;
                            }
                        }
                    }
                }
                let heir_id = legacy
                    .legatee
                    .person_id
                    .as_deref()
                    .unwrap_or(&legacy.legatee.name);
                add_fp_to_distributions(&mut distributions, heir_id, legacy_value);
            }

            // Phase 3: If mixed, distribute undisposed FP intestate
            let intestate_scenario = if !coverage.disposes_of_entire_estate {
                let intestate_sc = derive_intestate_scenario(&input.line_counts);
                let undisposed = &coverage.undisposed_fp;

                if undisposed.is_positive() {
                    let intestate_dists = compute_intestate_distribution(
                        undisposed,
                        &input.heirs,
                        &input.line_counts,
                        &intestate_sc,
                    );
                    for id in intestate_dists {
                        if let Some(existing) =
                            distributions.iter_mut().find(|d| d.heir_id == id.heir_id)
                        {
                            existing.from_intestate = &existing.from_intestate + &id.from_intestate;
                            existing.total = &existing.total + &id.from_intestate;
                        } else {
                            distributions.push(id);
                        }
                    }
                }
                Some(intestate_sc)
            } else {
                None
            };

            Step7Output {
                distributions,
                will_coverage: Some(coverage),
                final_succession_type,
                intestate_scenario,
                warnings: vec![],
            }
        }
    }
}

/// Helper: add a free-portion amount to existing distributions or create a new entry.
fn add_fp_to_distributions(
    distributions: &mut Vec<HeirDistribution>,
    heir_id: &str,
    amount: Frac,
) {
    if let Some(existing) = distributions.iter_mut().find(|d| d.heir_id == heir_id) {
        existing.from_free_portion = &existing.from_free_portion + &amount;
        existing.total = &existing.total + &amount;
    } else {
        distributions.push(HeirDistribution {
            heir_id: heir_id.into(),
            effective_category: EffectiveCategory::LegitimateChildGroup,
            from_legitime: Frac::zero(),
            from_free_portion: amount.clone(),
            from_intestate: Frac::zero(),
            total: amount,
            legal_basis: vec![],
        });
    }
}

/// Compute intestate distribution of a given amount among heirs using
/// the intestate formula for the given scenario code (I1-I15).
///
/// This is also used for Phase 3 of mixed succession (distributing undisposed FP).
pub fn compute_intestate_distribution(
    amount: &Frac,
    heirs: &[Heir],
    _line_counts: &LineCounts,
    scenario: &ScenarioCode,
) -> Vec<HeirDistribution> {
    match scenario {
        ScenarioCode::I1 => distribute_i1(amount, heirs),
        ScenarioCode::I2 => distribute_i2(amount, heirs),
        ScenarioCode::I3 => distribute_i3(amount, heirs),
        ScenarioCode::I4 => distribute_i4(amount, heirs),
        ScenarioCode::I5 => distribute_i5(amount, heirs),
        ScenarioCode::I6 => distribute_i6(amount, heirs),
        ScenarioCode::I7 => distribute_i7(amount, heirs),
        ScenarioCode::I8 => distribute_i8(amount, heirs),
        ScenarioCode::I9 => distribute_i9(amount, heirs),
        ScenarioCode::I10 => distribute_i10(amount, heirs),
        ScenarioCode::I11 => distribute_i11(amount, heirs),
        ScenarioCode::I12 => distribute_i12(amount, heirs),
        ScenarioCode::I13 => distribute_i13(amount, heirs),
        ScenarioCode::I14 => distribute_i14(amount, heirs),
        ScenarioCode::I15 => distribute_i15(amount),
        _ => panic!(
            "compute_intestate_distribution called with testate scenario {:?}",
            scenario
        ),
    }
}

// ── Line-Aware Helpers ──────────────────────────────────────────────

/// A distribution unit representing one LC line in intestate succession.
/// Lines are counted at degree-1 (direct children of decedent), with
/// represented lines (predeceased/disinherited) splitting per stirpes
/// among living descendants (Art. 970-982).
enum LcLine<'a> {
    /// Living heir inheriting in their own right.
    OwnRight(&'a Heir),
    /// Represented line: ancestor (dead/disinherited/unworthy) with living representatives.
    Represented {
        ancestor: &'a Heir,
        representatives: Vec<&'a Heir>,
    },
}

/// Collect LC distribution lines from the heir list.
/// Only degree-1 anchors count as lines. Representatives (degree >= 2)
/// are grouped under their ancestor's line, not counted separately.
fn get_lc_lines<'a>(heirs: &'a [Heir]) -> Vec<LcLine<'a>> {
    let mut lines = Vec::new();
    for h in heirs {
        if h.effective_category != EffectiveCategory::LegitimateChildGroup {
            continue;
        }
        // Only process degree-1 anchors
        if h.degree_from_decedent != 1 {
            continue;
        }
        if !h.represented_by.is_empty() {
            // Represented line: ancestor gets 0, reps split the line share
            let reps: Vec<&Heir> = h
                .represented_by
                .iter()
                .filter_map(|rep_id| heirs.iter().find(|h2| h2.id == *rep_id))
                .collect();
            if !reps.is_empty() {
                lines.push(LcLine::Represented {
                    ancestor: h,
                    representatives: reps,
                });
            }
        } else if h.is_alive && h.is_eligible && !h.has_renounced {
            lines.push(LcLine::OwnRight(h));
        }
    }
    lines
}

/// Distribute a per-line share across LC lines, handling representation per stirpes.
/// Returns distributions for each line (own-right heirs get the full line share;
/// represented lines produce a zero entry for the ancestor and equal splits for reps).
fn distribute_lc_lines(
    lines: &[LcLine],
    per_line: &Frac,
    basis: Vec<String>,
) -> Vec<HeirDistribution> {
    let mut result = Vec::new();
    for line in lines {
        match line {
            LcLine::OwnRight(h) => {
                result.push(make_intestate_dist(
                    &h.id,
                    h.effective_category,
                    per_line.clone(),
                    basis.clone(),
                ));
            }
            LcLine::Represented {
                ancestor,
                representatives,
            } => {
                // Ancestor gets 0
                result.push(make_intestate_dist(
                    &ancestor.id,
                    ancestor.effective_category,
                    Frac::zero(),
                    basis.clone(),
                ));
                // Representatives split per stirpes (Art. 970)
                let per_rep = per_line / &frac(representatives.len() as i64, 1);
                let mut rep_basis = vec!["Art. 970".into()];
                rep_basis.extend(basis.iter().cloned());
                for rep in representatives {
                    result.push(make_intestate_dist(
                        &rep.id,
                        rep.effective_category,
                        per_rep.clone(),
                        rep_basis.clone(),
                    ));
                }
            }
        }
    }
    result
}

// ── Intestate Formulas I1-I15 ───────────────────────────────────────

/// I1: n LC Only (Art. 980) — equal shares per line.
fn distribute_i1(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let lines = get_lc_lines(heirs);
    let n = frac(lines.len() as i64, 1);
    let per_line = amount / &n;
    distribute_lc_lines(&lines, &per_line, vec!["Art. 980".into()])
}

/// I2: n LC + Spouse (Art. 996) — spouse = one child-line's share.
fn distribute_i2(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let lines = get_lc_lines(heirs);
    let spouse = heirs
        .iter()
        .find(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup);
    let divisor = frac((lines.len() + 1) as i64, 1);
    let per_share = amount / &divisor;
    let mut result = distribute_lc_lines(&lines, &per_share, vec!["Art. 996".into()]);
    if let Some(s) = spouse {
        result.push(make_intestate_dist(
            &s.id,
            s.effective_category,
            per_share,
            vec!["Art. 996".into()],
        ));
    }
    result
}

/// I3: n LC + m IC (Arts. 983, 895) — 2:1 ratio, no cap in intestate.
fn distribute_i3(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let lc_lines = get_lc_lines(heirs);
    let ics: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::IllegitimateChildGroup)
        .collect();
    let total_units = frac(2 * lc_lines.len() as i64 + ics.len() as i64, 1);
    let per_unit = amount / &total_units;
    let lc_share = &per_unit * &frac(2, 1);
    let mut result = distribute_lc_lines(
        &lc_lines,
        &lc_share,
        vec!["Art. 983".into(), "Art. 895".into()],
    );
    for h in &ics {
        result.push(make_intestate_dist(
            &h.id,
            h.effective_category,
            per_unit.clone(),
            vec!["Art. 983".into(), "Art. 895".into()],
        ));
    }
    result
}

/// I4: n LC + m IC + Spouse (Arts. 999, 983, 895) — spouse = 2 units.
fn distribute_i4(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let lc_lines = get_lc_lines(heirs);
    let ics: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::IllegitimateChildGroup)
        .collect();
    let spouse = heirs
        .iter()
        .find(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup);
    let total_units = frac(2 * lc_lines.len() as i64 + ics.len() as i64 + 2, 1);
    let per_unit = amount / &total_units;
    let lc_share = &per_unit * &frac(2, 1);
    let spouse_share = &per_unit * &frac(2, 1);
    let mut result =
        distribute_lc_lines(&lc_lines, &lc_share, vec!["Art. 999".into()]);
    for h in &ics {
        result.push(make_intestate_dist(
            &h.id,
            h.effective_category,
            per_unit.clone(),
            vec!["Art. 999".into()],
        ));
    }
    if let Some(s) = spouse {
        result.push(make_intestate_dist(
            &s.id,
            s.effective_category,
            spouse_share,
            vec!["Art. 999".into()],
        ));
    }
    result
}

/// I5: Ascendants Only (Arts. 985-987) — equal shares.
fn distribute_i5(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let ascendants: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::LegitimateAscendantGroup)
        .collect();
    let n = frac(ascendants.len() as i64, 1);
    let per_asc = amount / &n;
    ascendants
        .iter()
        .map(|h| make_intestate_dist(&h.id, h.effective_category, per_asc.clone(), vec!["Art. 985".into()]))
        .collect()
}

/// I6: Ascendants + Spouse (Art. 997) — spouse 1/2, ascendants split 1/2.
fn distribute_i6(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let ascendants: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::LegitimateAscendantGroup)
        .collect();
    let spouse = heirs
        .iter()
        .find(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup);
    let half = amount / &frac(2, 1);
    let per_asc = &half / &frac(ascendants.len() as i64, 1);
    let mut result = Vec::new();
    for h in &ascendants {
        result.push(make_intestate_dist(&h.id, h.effective_category, per_asc.clone(), vec!["Art. 997".into()]));
    }
    if let Some(s) = spouse {
        result.push(make_intestate_dist(&s.id, s.effective_category, half, vec!["Art. 997".into()]));
    }
    result
}

/// I7: m IC Only (Art. 988) — equal shares.
fn distribute_i7(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let ics: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::IllegitimateChildGroup)
        .collect();
    let n = frac(ics.len() as i64, 1);
    let per_ic = amount / &n;
    ics.iter()
        .map(|h| make_intestate_dist(&h.id, h.effective_category, per_ic.clone(), vec!["Art. 988".into()]))
        .collect()
}

/// I8: m IC + Spouse (Art. 998) — spouse 1/2, ICs split 1/2.
fn distribute_i8(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let ics: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::IllegitimateChildGroup)
        .collect();
    let spouse = heirs
        .iter()
        .find(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup);
    let half = amount / &frac(2, 1);
    let per_ic = &half / &frac(ics.len() as i64, 1);
    let mut result = Vec::new();
    if let Some(s) = spouse {
        result.push(make_intestate_dist(&s.id, s.effective_category, half, vec!["Art. 998".into()]));
    }
    for h in &ics {
        result.push(make_intestate_dist(&h.id, h.effective_category, per_ic.clone(), vec!["Art. 998".into()]));
    }
    result
}

/// I9: Ascendants + m IC (Art. 991) — ascendants 1/2, ICs 1/2.
fn distribute_i9(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let ascendants: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::LegitimateAscendantGroup)
        .collect();
    let ics: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::IllegitimateChildGroup)
        .collect();
    let half = amount / &frac(2, 1);
    let per_asc = &half / &frac(ascendants.len() as i64, 1);
    let per_ic = &half / &frac(ics.len() as i64, 1);
    let mut result = Vec::new();
    for h in &ascendants {
        result.push(make_intestate_dist(&h.id, h.effective_category, per_asc.clone(), vec!["Art. 991".into()]));
    }
    for h in &ics {
        result.push(make_intestate_dist(&h.id, h.effective_category, per_ic.clone(), vec!["Art. 991".into()]));
    }
    result
}

/// I10: Ascendants + m IC + Spouse (Art. 1000) — asc 1/2, IC 1/4, spouse 1/4.
fn distribute_i10(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let ascendants: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::LegitimateAscendantGroup)
        .collect();
    let ics: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::IllegitimateChildGroup)
        .collect();
    let spouse = heirs
        .iter()
        .find(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup);
    let asc_total = amount / &frac(2, 1);
    let ic_total = amount / &frac(4, 1);
    let spouse_share = amount / &frac(4, 1);
    let per_asc = &asc_total / &frac(ascendants.len() as i64, 1);
    let per_ic = &ic_total / &frac(ics.len() as i64, 1);
    let mut result = Vec::new();
    for h in &ascendants {
        result.push(make_intestate_dist(&h.id, h.effective_category, per_asc.clone(), vec!["Art. 1000".into()]));
    }
    for h in &ics {
        result.push(make_intestate_dist(&h.id, h.effective_category, per_ic.clone(), vec!["Art. 1000".into()]));
    }
    if let Some(s) = spouse {
        result.push(make_intestate_dist(&s.id, s.effective_category, spouse_share, vec!["Art. 1000".into()]));
    }
    result
}

/// I11: Spouse Only (Art. 995) — entire estate.
fn distribute_i11(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let spouse = heirs
        .iter()
        .find(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup)
        .expect("I11 requires a surviving spouse");
    vec![make_intestate_dist(&spouse.id, spouse.effective_category, amount.clone(), vec!["Art. 995".into()])]
}

/// I12: Spouse + Siblings/Nephews (Art. 1001) — spouse 1/2, collaterals 1/2.
fn distribute_i12(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let spouse = heirs
        .iter()
        .find(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup)
        .expect("I12 requires a surviving spouse");
    let spouse_share = amount / &frac(2, 1);
    let collateral_total = amount / &frac(2, 1);
    let collateral_heirs: Vec<Heir> = heirs
        .iter()
        .filter(|h| h.effective_category != EffectiveCategory::SurvivingSpouseGroup)
        .cloned()
        .collect();
    let mut result = vec![make_intestate_dist(
        &spouse.id,
        spouse.effective_category,
        spouse_share,
        vec!["Art. 1001".into()],
    )];
    result.extend(distribute_collaterals(&collateral_total, &collateral_heirs));
    result
}

/// I13: Siblings/Nephews Only (Arts. 1003-1008) — via collateral sub-algorithm.
fn distribute_i13(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    distribute_collaterals(amount, heirs)
}

/// I14: Other Collateral Relatives (Arts. 1009-1010).
fn distribute_i14(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    distribute_other_collaterals(amount, heirs)
}

/// I15: State Escheat (Arts. 1011-1014).
fn distribute_i15(amount: &Frac) -> Vec<HeirDistribution> {
    vec![HeirDistribution {
        heir_id: "STATE".into(),
        effective_category: EffectiveCategory::LegitimateChildGroup,
        from_legitime: Frac::zero(),
        from_free_portion: Frac::zero(),
        from_intestate: amount.clone(),
        total: amount.clone(),
        legal_basis: vec!["Art. 1011".into()],
    }]
}

// ── Collateral Distribution Sub-Algorithm (§7.6) ────────────────────

/// Distribute among collateral relatives using the sub-algorithm from §7.6.
pub fn distribute_collaterals(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let siblings: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.inherits_by == InheritanceMode::OwnRight && h.blood_type.is_some())
        .collect();
    let nephews: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.inherits_by == InheritanceMode::Representation && h.represents.is_some())
        .collect();

    // Branch 1: Siblings + nephews/nieces (per stirpes with blood weighting)
    if !siblings.is_empty() && !nephews.is_empty() {
        return distribute_siblings_with_representation(amount, &siblings, &nephews);
    }
    // Branch 2: Siblings only
    if !siblings.is_empty() {
        return distribute_siblings(amount, &siblings);
    }
    // Branch 3: Nephews/nieces only (per capita, Art. 975)
    if !nephews.is_empty() {
        return distribute_nephews_only(amount, &nephews);
    }
    // Branch 4: Other collaterals
    distribute_other_collaterals(amount, heirs)
}

/// Branch 2: Siblings only — full/half blood logic (Arts. 1004, 1006, 1007).
fn distribute_siblings(amount: &Frac, siblings: &[&Heir]) -> Vec<HeirDistribution> {
    let full_blood: Vec<&&Heir> = siblings
        .iter()
        .filter(|h| h.blood_type == Some(BloodType::Full))
        .collect();
    let half_blood: Vec<&&Heir> = siblings
        .iter()
        .filter(|h| h.blood_type == Some(BloodType::Half))
        .collect();

    // Case A/B: all same blood type → equal shares
    if full_blood.is_empty() || half_blood.is_empty() {
        let per_sib = amount / &frac(siblings.len() as i64, 1);
        return siblings
            .iter()
            .map(|h| make_intestate_dist(&h.id, h.effective_category, per_sib.clone(), vec!["Art. 1004".into()]))
            .collect();
    }

    // Case C: mixed full + half blood → 2:1 ratio (Art. 1006)
    let total_units = frac((full_blood.len() * 2 + half_blood.len()) as i64, 1);
    let per_unit = amount / &total_units;
    let mut result = Vec::new();
    for h in &full_blood {
        result.push(make_intestate_dist(&h.id, h.effective_category, &per_unit * &frac(2, 1), vec!["Art. 1006".into()]));
    }
    for h in &half_blood {
        result.push(make_intestate_dist(&h.id, h.effective_category, per_unit.clone(), vec!["Art. 1006".into()]));
    }
    result
}

/// Branch 1: Siblings + nephews — per stirpes with blood weighting (Arts. 1005, 1006, 1008).
fn distribute_siblings_with_representation(
    amount: &Frac,
    siblings: &[&Heir],
    nephews: &[&Heir],
) -> Vec<HeirDistribution> {
    // Each living sibling forms a line; each group of nephews (by line_ancestor) forms a line.
    struct SiblingLine<'a> {
        blood_type: BloodType,
        living_sibling: Option<&'a Heir>,
        representatives: Vec<&'a Heir>,
    }

    let mut lines: Vec<SiblingLine> = Vec::new();

    // Living siblings
    for s in siblings {
        lines.push(SiblingLine {
            blood_type: s.blood_type.unwrap_or(BloodType::Full),
            living_sibling: Some(s),
            representatives: vec![],
        });
    }

    // Group nephews by line_ancestor (the predeceased sibling they represent)
    let mut nephew_groups: HashMap<String, Vec<&Heir>> = HashMap::new();
    let mut nephew_blood: HashMap<String, BloodType> = HashMap::new();
    for n in nephews {
        let ancestor = n.line_ancestor.clone().unwrap_or_default();
        nephew_groups.entry(ancestor.clone()).or_default().push(n);
        if let Some(bt) = n.blood_type {
            nephew_blood.entry(ancestor).or_insert(bt);
        }
    }
    for (ancestor, group) in &nephew_groups {
        let bt = nephew_blood.get(ancestor).copied().unwrap_or(BloodType::Full);
        lines.push(SiblingLine {
            blood_type: bt,
            living_sibling: None,
            representatives: group.clone(),
        });
    }

    // Compute per-line units (Art. 1006 + Art. 1008)
    let total_units: i64 = lines
        .iter()
        .map(|l| if l.blood_type == BloodType::Full { 2 } else { 1 })
        .sum();
    let per_unit = amount / &frac(total_units, 1);

    let mut result = Vec::new();
    for line in &lines {
        let line_units: i64 = if line.blood_type == BloodType::Full { 2 } else { 1 };
        let line_share = &per_unit * &frac(line_units, 1);

        if let Some(s) = line.living_sibling {
            result.push(make_intestate_dist(&s.id, s.effective_category, line_share, vec!["Art. 1005".into()]));
        } else {
            let n_reps = frac(line.representatives.len() as i64, 1);
            let per_rep = &line_share / &n_reps;
            for n in &line.representatives {
                result.push(make_intestate_dist(&n.id, n.effective_category, per_rep.clone(), vec!["Art. 1005".into(), "Art. 1008".into()]));
            }
        }
    }
    result
}

/// Branch 3: Nephews/nieces only — per capita (Art. 975).
fn distribute_nephews_only(amount: &Frac, nephews: &[&Heir]) -> Vec<HeirDistribution> {
    let per_nephew = amount / &frac(nephews.len() as i64, 1);
    nephews
        .iter()
        .map(|h| make_intestate_dist(&h.id, h.effective_category, per_nephew.clone(), vec!["Art. 975".into()]))
        .collect()
}

/// Branch 4: Other collateral relatives (Arts. 1009-1010).
fn distribute_other_collaterals(amount: &Frac, heirs: &[Heir]) -> Vec<HeirDistribution> {
    let eligible: Vec<&Heir> = heirs
        .iter()
        .filter(|h| h.degree_from_decedent <= 5)
        .collect();
    if eligible.is_empty() {
        return vec![];
    }
    let min_degree = eligible.iter().map(|h| h.degree_from_decedent).min().unwrap();
    let nearest: Vec<&&Heir> = eligible
        .iter()
        .filter(|h| h.degree_from_decedent == min_degree)
        .collect();
    let per_heir = amount / &frac(nearest.len() as i64, 1);
    nearest
        .iter()
        .map(|h| make_intestate_dist(&h.id, h.effective_category, per_heir.clone(), vec!["Art. 1009".into()]))
        .collect()
}

// ── Will Coverage Analysis (§7.5) ───────────────────────────────────

/// Analyze will coverage to determine if succession is truly TESTATE or MIXED.
pub fn determine_will_coverage(
    will: &Will,
    estate_base: &Frac,
    heir_legitimes: &[HeirLegitime],
    free_portion: &FreePortion,
    _heirs: &[Heir],
) -> WillCoverage {
    let fp_disposable = &free_portion.fp_disposable;

    // Residuary clause captures all undisposed FP
    let has_residuary = will.institutions.iter().any(|inst| inst.is_residuary);
    if has_residuary {
        return WillCoverage {
            disposes_of_entire_estate: true,
            total_will_from_fp: fp_disposable.clone(),
            undisposed_fp: Frac::zero(),
        };
    }

    let mut total_will_dispositions = Frac::zero();

    // Institutions
    for inst in &will.institutions {
        let inst_value = compute_institution_value(inst, estate_base, fp_disposable);
        let heir_id = inst.heir.person_id.as_deref().unwrap_or("");
        let is_compulsory = heir_legitimes.iter().any(|hl| hl.heir_id == heir_id);

        if is_compulsory {
            let heir_legitime = heir_legitimes
                .iter()
                .find(|hl| hl.heir_id == heir_id)
                .map(|hl| &hl.legitime_amount)
                .cloned()
                .unwrap_or_else(Frac::zero);
            let excess = &inst_value - &heir_legitime;
            if excess.is_positive() {
                total_will_dispositions = total_will_dispositions + excess;
            }
        } else {
            total_will_dispositions = total_will_dispositions + inst_value;
        }
    }

    // Legacies
    for legacy in &will.legacies {
        total_will_dispositions = total_will_dispositions + compute_legacy_value(legacy);
    }

    // Devises
    for devise in &will.devises {
        total_will_dispositions = total_will_dispositions + compute_devise_value(devise);
    }

    // Compute undisposed FP
    let undisposed = fp_disposable - &total_will_dispositions;
    let undisposed = if undisposed.is_negative() {
        Frac::zero()
    } else {
        undisposed
    };

    WillCoverage {
        disposes_of_entire_estate: undisposed.is_zero(),
        total_will_from_fp: total_will_dispositions,
        undisposed_fp: undisposed,
    }
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
