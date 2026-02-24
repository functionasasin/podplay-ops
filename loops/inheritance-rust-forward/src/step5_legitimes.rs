//! Step 5: Compute Legitimes + Free Portion
//!
//! Given the collation-adjusted estate base from Step 4, the scenario code from
//! Step 3, and the line counts from Step 2, this step computes:
//! 1. Per-heir legitime fractions and amounts
//! 2. The FP pipeline: FP_gross → spouse → IC cap → FP_disposable
//!
//! Spec references:
//!   - §6 Complete Legitime Fraction Table (T1-T15)
//!   - §2.3 Two Free Portion Values / FP Pipeline Order of Operations
//!   - §6.5 Ascendant Division Sub-Algorithm (Art. 890)
//!   - §6.6 Cap Rule Algorithm (Art. 895 ¶3)

use crate::fraction::{frac, Frac};
use crate::step2_lines::LineCounts;
use crate::types::*;

// ── Types ───────────────────────────────────────────────────────────

/// Per-heir legitime allocation computed in Step 5.
#[derive(Debug, Clone)]
pub struct HeirLegitime {
    pub heir_id: HeirId,
    pub effective_category: EffectiveCategory,
    /// The heir's legitime as a fraction of estate_base.
    pub legitime_fraction: Frac,
    /// The heir's legitime as an absolute amount (fraction × estate_base).
    pub legitime_amount: Frac,
    /// Whether this heir's share was reduced by the Art. 895 ¶3 cap rule.
    pub cap_applied: bool,
    /// Legal basis articles for this heir's legitime.
    pub legal_basis: Vec<String>,
}

/// Result of the FP pipeline (§2.3).
#[derive(Debug, Clone)]
pub struct FreePortion {
    /// FP_gross = estate_base - collective LC/ascendant legitime.
    pub fp_gross: Frac,
    /// Spouse's share charged against FP (0 if no spouse or spouse not in FP).
    pub spouse_from_fp: Frac,
    /// IC collective share charged against FP (after cap if applicable).
    pub ic_from_fp: Frac,
    /// FP_disposable = FP_gross - spouse_from_fp - ic_from_fp.
    pub fp_disposable: Frac,
    /// Whether the Art. 895 ¶3 cap was triggered.
    pub cap_triggered: bool,
}

/// Input to Step 5.
#[derive(Debug, Clone)]
pub struct Step5Input {
    /// Collation-adjusted estate base from Step 4.
    pub estate_base: Frac,
    /// Scenario code from Step 3.
    pub scenario_code: ScenarioCode,
    /// Line counts from Step 2.
    pub line_counts: LineCounts,
    /// Classified heirs from Step 1 (needed for ascendant division).
    pub heirs: Vec<Heir>,
    /// Decedent info (needed for articulo mortis check).
    pub decedent: Decedent,
}

/// Output of Step 5.
#[derive(Debug, Clone)]
pub struct Step5Output {
    /// Per-heir legitime allocations.
    pub heir_legitimes: Vec<HeirLegitime>,
    /// FP pipeline result.
    pub free_portion: FreePortion,
    pub warnings: Vec<ManualFlag>,
}

// ── Internal helpers ────────────────────────────────────────────────

fn add_lc_legitimes(
    out: &mut Vec<HeirLegitime>,
    heirs: &[Heir],
    per_lc_frac: &Frac,
    estate_base: &Frac,
    cap_applied: bool,
    legal_basis: Vec<String>,
) {
    // Only degree-1 heirs (line anchors) get per-line legitimes.
    // Representatives (degree >= 2) inherit through their line ancestor in Step 7.
    for heir in heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::LegitimateChildGroup && h.degree_from_decedent == 1)
    {
        out.push(HeirLegitime {
            heir_id: heir.id.clone(),
            effective_category: EffectiveCategory::LegitimateChildGroup,
            legitime_fraction: per_lc_frac.clone(),
            legitime_amount: estate_base * per_lc_frac,
            cap_applied,
            legal_basis: legal_basis.clone(),
        });
    }
}

fn add_ic_legitimes(
    out: &mut Vec<HeirLegitime>,
    heirs: &[Heir],
    per_ic_frac: &Frac,
    estate_base: &Frac,
    cap_applied: bool,
    legal_basis: Vec<String>,
) {
    // Only degree-1 heirs (line anchors) get per-line legitimes.
    // Representatives (degree >= 2) inherit through their line ancestor in Step 7.
    for heir in heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::IllegitimateChildGroup && h.degree_from_decedent == 1)
    {
        out.push(HeirLegitime {
            heir_id: heir.id.clone(),
            effective_category: EffectiveCategory::IllegitimateChildGroup,
            legitime_fraction: per_ic_frac.clone(),
            legitime_amount: estate_base * per_ic_frac,
            cap_applied,
            legal_basis: legal_basis.clone(),
        });
    }
}

fn add_spouse_legitime(
    out: &mut Vec<HeirLegitime>,
    heirs: &[Heir],
    sp_frac: &Frac,
    estate_base: &Frac,
    legal_basis: Vec<String>,
) {
    for heir in heirs
        .iter()
        .filter(|h| h.effective_category == EffectiveCategory::SurvivingSpouseGroup)
    {
        out.push(HeirLegitime {
            heir_id: heir.id.clone(),
            effective_category: EffectiveCategory::SurvivingSpouseGroup,
            legitime_fraction: sp_frac.clone(),
            legitime_amount: estate_base * sp_frac,
            cap_applied: false,
            legal_basis: legal_basis.clone(),
        });
    }
}

fn divide_equally(
    heirs: &[&Heir],
    total_fraction: &Frac,
    estate_base: &Frac,
) -> Vec<HeirLegitime> {
    let count = frac(heirs.len() as i64, 1);
    let per_heir_frac = total_fraction / &count;
    let per_heir_amount = estate_base * &per_heir_frac;

    heirs
        .iter()
        .map(|h| HeirLegitime {
            heir_id: h.id.clone(),
            effective_category: h.effective_category,
            legitime_fraction: per_heir_frac.clone(),
            legitime_amount: per_heir_amount.clone(),
            cap_applied: false,
            legal_basis: vec!["Art. 890".into()],
        })
        .collect()
}

fn empty_fp() -> FreePortion {
    FreePortion {
        fp_gross: Frac::zero(),
        spouse_from_fp: Frac::zero(),
        ic_from_fp: Frac::zero(),
        fp_disposable: Frac::zero(),
        cap_triggered: false,
    }
}

// ── Public API ──────────────────────────────────────────────────────

/// Compute legitimes and the free portion pipeline for the given scenario.
///
/// This is the core of Step 5. It uses the scenario code to select the
/// correct fraction table from §6, computes per-heir legitimes, and runs
/// the FP pipeline (§2.3) to determine FP_disposable.
pub fn step5_compute_legitimes(input: &Step5Input) -> Step5Output {
    let e = &input.estate_base;
    let n = input.line_counts.legitimate_child;
    let m = input.line_counts.illegitimate_child;
    let scenario = input.scenario_code;

    // Intestate scenarios: legitime computation does not apply.
    // Actual distribution happens in Step 7.
    if matches!(
        scenario,
        ScenarioCode::I1
            | ScenarioCode::I2
            | ScenarioCode::I3
            | ScenarioCode::I4
            | ScenarioCode::I5
            | ScenarioCode::I6
            | ScenarioCode::I7
            | ScenarioCode::I8
            | ScenarioCode::I9
            | ScenarioCode::I10
            | ScenarioCode::I11
            | ScenarioCode::I12
            | ScenarioCode::I13
            | ScenarioCode::I14
            | ScenarioCode::I15
    ) {
        return Step5Output {
            heir_legitimes: vec![],
            free_portion: empty_fp(),
            warnings: vec![],
        };
    }

    let mut heir_legitimes = Vec::new();
    let mut fp_gross = Frac::zero();
    let mut spouse_from_fp = Frac::zero();
    let mut ic_from_fp = Frac::zero();
    let mut cap_triggered = false;

    match scenario {
        // ── Regime A: Descendants present ────────────────────────

        ScenarioCode::T1 => {
            // n LC only (Art. 888): each LC = E/(2n), FP = E/2
            let per_lc = frac(1, 2 * n as i64);
            add_lc_legitimes(&mut heir_legitimes, &input.heirs, &per_lc, e, false, vec!["Art. 888".into()]);
            fp_gross = e * &frac(1, 2);
        }

        ScenarioCode::T2 => {
            // 1 LC + Spouse (Arts. 888, 892 ¶1): LC = E/2, Spouse = E/4
            add_lc_legitimes(&mut heir_legitimes, &input.heirs, &frac(1, 2), e, false, vec!["Art. 888".into()]);
            let sp = frac(1, 4);
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 892 ¶1".into()]);
            fp_gross = e * &frac(1, 2);
            spouse_from_fp = e * &sp;
        }

        ScenarioCode::T3 => {
            // n≥2 LC + Spouse (Arts. 888, 892 ¶2): each LC = E/(2n), Spouse = E/(2n)
            let per_lc = frac(1, 2 * n as i64);
            add_lc_legitimes(&mut heir_legitimes, &input.heirs, &per_lc, e, false, vec!["Art. 888".into()]);
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &per_lc, e, vec!["Art. 892 ¶2".into()]);
            fp_gross = e * &frac(1, 2);
            spouse_from_fp = e * &per_lc;
        }

        ScenarioCode::T4 => {
            // n LC + m IC, no spouse (Arts. 888, 895)
            let per_lc = frac(1, 2 * n as i64);
            add_lc_legitimes(&mut heir_legitimes, &input.heirs, &per_lc, e, false, vec!["Art. 888".into()]);
            fp_gross = e * &frac(1, 2);
            let (per_ic, cap) = apply_cap_rule(&per_lc, m, &frac(1, 2), &Frac::zero());
            cap_triggered = cap;
            add_ic_legitimes(&mut heir_legitimes, &input.heirs, &per_ic, e, cap, vec!["Art. 895".into()]);
            ic_from_fp = e * &(&per_ic * &frac(m as i64, 1));
        }

        ScenarioCode::T5a => {
            // 1 LC + m IC + Spouse (Arts. 888, 892 ¶1, 895)
            add_lc_legitimes(&mut heir_legitimes, &input.heirs, &frac(1, 2), e, false, vec!["Art. 888".into()]);
            let sp = frac(1, 4);
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 892 ¶1".into()]);
            fp_gross = e * &frac(1, 2);
            spouse_from_fp = e * &sp;
            let (per_ic, cap) = apply_cap_rule(&frac(1, 2), m, &frac(1, 2), &sp);
            cap_triggered = cap;
            add_ic_legitimes(&mut heir_legitimes, &input.heirs, &per_ic, e, cap, vec!["Art. 895".into()]);
            ic_from_fp = e * &(&per_ic * &frac(m as i64, 1));
        }

        ScenarioCode::T5b => {
            // n≥2 LC + m IC + Spouse (Arts. 888, 892 ¶2, 895, 897)
            let per_lc = frac(1, 2 * n as i64);
            add_lc_legitimes(&mut heir_legitimes, &input.heirs, &per_lc, e, false, vec!["Art. 888".into()]);
            let sp = per_lc.clone(); // spouse = same as one LC share
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 892 ¶2".into()]);
            fp_gross = e * &frac(1, 2);
            spouse_from_fp = e * &sp;
            let (per_ic, cap) = apply_cap_rule(&per_lc, m, &frac(1, 2), &sp);
            cap_triggered = cap;
            add_ic_legitimes(&mut heir_legitimes, &input.heirs, &per_ic, e, cap, vec!["Art. 895".into()]);
            ic_from_fp = e * &(&per_ic * &frac(m as i64, 1));
        }

        // ── Regime B: Ascendants present, no descendants ────────

        ScenarioCode::T6 => {
            // Ascendants only (Art. 889): collective = E/2, FP = E/2
            let asc = divide_among_ascendants(&input.heirs, &frac(1, 2), e);
            heir_legitimes.extend(asc);
            fp_gross = e * &frac(1, 2);
        }

        ScenarioCode::T7 => {
            // Ascendants + Spouse (Arts. 889, 893): asc = E/2, spouse = E/4
            let asc = divide_among_ascendants(&input.heirs, &frac(1, 2), e);
            heir_legitimes.extend(asc);
            let sp = frac(1, 4);
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 893".into()]);
            fp_gross = e * &frac(1, 2);
            spouse_from_fp = e * &sp;
        }

        ScenarioCode::T8 => {
            // Ascendants + m IC (Arts. 889, 896): asc = E/2, IC collective = E/4
            let asc = divide_among_ascendants(&input.heirs, &frac(1, 2), e);
            heir_legitimes.extend(asc);
            let per_ic = frac(1, 4 * m as i64);
            add_ic_legitimes(&mut heir_legitimes, &input.heirs, &per_ic, e, false, vec!["Art. 896".into()]);
            fp_gross = e * &frac(1, 2);
            ic_from_fp = e * &frac(1, 4);
        }

        ScenarioCode::T9 => {
            // Ascendants + m IC + Spouse (Art. 899): asc = E/2, IC = E/4, spouse = E/8
            let asc = divide_among_ascendants(&input.heirs, &frac(1, 2), e);
            heir_legitimes.extend(asc);
            let per_ic = frac(1, 4 * m as i64);
            add_ic_legitimes(&mut heir_legitimes, &input.heirs, &per_ic, e, false, vec!["Art. 896".into()]);
            let sp = frac(1, 8);
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 899".into()]);
            fp_gross = e * &frac(1, 2);
            spouse_from_fp = e * &sp;
            ic_from_fp = e * &frac(1, 4);
        }

        // ── Regime C: No primary/secondary compulsory heirs ─────

        ScenarioCode::T10 => {
            // m IC + Spouse (Art. 894): IC collective = E/3, Spouse = E/3
            let per_ic = frac(1, 3 * m as i64);
            add_ic_legitimes(&mut heir_legitimes, &input.heirs, &per_ic, e, false, vec!["Art. 894".into()]);
            let sp = frac(1, 3);
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 894".into()]);
            fp_gross = e.clone();
            spouse_from_fp = e * &sp;
            ic_from_fp = e * &frac(1, 3);
        }

        ScenarioCode::T11 => {
            // m IC only (Art. 901): IC collective = E/2
            let per_ic = frac(1, 2 * m as i64);
            add_ic_legitimes(&mut heir_legitimes, &input.heirs, &per_ic, e, false, vec!["Art. 901".into()]);
            fp_gross = e.clone();
            ic_from_fp = e * &frac(1, 2);
        }

        ScenarioCode::T12 => {
            // Spouse only (Art. 900): normal = E/2, articulo mortis = E/3
            let am = is_articulo_mortis(&input.decedent);
            let sp = if am { frac(1, 3) } else { frac(1, 2) };
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 900".into()]);
            fp_gross = e.clone();
            spouse_from_fp = e * &sp;
        }

        ScenarioCode::T13 => {
            // No compulsory heirs: entire estate is free portion
            fp_gross = e.clone();
        }

        // ── Special: Illegitimate decedent (Art. 903) ───────────

        ScenarioCode::T14 => {
            // Parents of illegitimate decedent: parents collective = E/2
            let asc = divide_among_ascendants(&input.heirs, &frac(1, 2), e);
            heir_legitimes.extend(asc);
            fp_gross = e * &frac(1, 2);
        }

        ScenarioCode::T15 => {
            // Parents + Spouse of illegitimate decedent: parents = E/4, spouse = E/4
            let asc = divide_among_ascendants(&input.heirs, &frac(1, 4), e);
            heir_legitimes.extend(asc);
            let sp = frac(1, 4);
            add_spouse_legitime(&mut heir_legitimes, &input.heirs, &sp, e, vec!["Art. 903".into()]);
            // FP_gross = E - parents' E/4 = 3E/4; spouse E/4 charged against FP
            fp_gross = e * &frac(3, 4);
            spouse_from_fp = e * &sp;
        }

        // Intestate already handled above
        _ => {}
    }

    let fp_disposable = (&fp_gross - &spouse_from_fp) - ic_from_fp.clone();

    Step5Output {
        heir_legitimes,
        free_portion: FreePortion {
            fp_gross,
            spouse_from_fp,
            ic_from_fp,
            fp_disposable,
            cap_triggered,
        },
        warnings: vec![],
    }
}

/// Check whether the articulo mortis conditions are met (Art. 900 ¶2).
///
/// All three conditions must hold:
/// 1. Marriage solemnized in articulo mortis
/// 2. Decedent was ill at marriage and illness caused death
/// 3. Years of cohabitation < 5 (≥5 exempts articulo mortis)
pub fn is_articulo_mortis(decedent: &Decedent) -> bool {
    decedent.marriage_solemnized_in_articulo_mortis
        && decedent.was_ill_at_marriage
        && decedent.illness_caused_death
        && decedent.years_of_cohabitation < 5
}

/// Ascendant division sub-algorithm (§6.5, Art. 890).
///
/// Divides a collective share among ascendants by:
/// 1. Nearest degree first (parents before grandparents)
/// 2. By-line split if both paternal and maternal lines present
pub fn divide_among_ascendants(
    heirs: &[Heir],
    collective_fraction: &Frac,
    estate_base: &Frac,
) -> Vec<HeirLegitime> {
    let ascendants: Vec<&Heir> = heirs
        .iter()
        .filter(|h| {
            h.effective_category == EffectiveCategory::LegitimateAscendantGroup
                && h.is_eligible
                && h.is_alive
        })
        .collect();

    if ascendants.is_empty() {
        return vec![];
    }

    // Tier 1: Parents (degree 1)
    let parents: Vec<&Heir> = ascendants
        .iter()
        .filter(|h| h.degree_from_decedent == 1)
        .copied()
        .collect();

    if !parents.is_empty() {
        return divide_equally(&parents, collective_fraction, estate_base);
    }

    // Tier 2: Nearest degree among higher ascendants
    let min_degree = ascendants
        .iter()
        .map(|h| h.degree_from_decedent)
        .min()
        .unwrap();

    let nearest: Vec<&Heir> = ascendants
        .iter()
        .filter(|h| h.degree_from_decedent == min_degree)
        .copied()
        .collect();

    // Tier 3: By-line split (Art. 890 ¶2, Art. 987)
    let paternal: Vec<&Heir> = nearest
        .iter()
        .filter(|h| h.line == Some(LineOfDescent::Paternal))
        .copied()
        .collect();
    let maternal: Vec<&Heir> = nearest
        .iter()
        .filter(|h| h.line == Some(LineOfDescent::Maternal))
        .copied()
        .collect();

    if !paternal.is_empty() && !maternal.is_empty() {
        let half = collective_fraction / &frac(2, 1);
        let mut result = divide_equally(&paternal, &half, estate_base);
        result.extend(divide_equally(&maternal, &half, estate_base));
        result
    } else {
        // Only one line survives — gets entire collective
        let surviving = if !paternal.is_empty() {
            paternal
        } else {
            maternal
        };
        divide_equally(&surviving, collective_fraction, estate_base)
    }
}

/// Apply the Art. 895 ¶3 cap rule.
///
/// Ensures total IC legitime does not exceed FP remaining after spouse.
/// Returns (per_ic_fraction, cap_triggered).
pub fn apply_cap_rule(
    per_lc_amount: &Frac,
    m: usize,
    fp_gross: &Frac,
    spouse_from_fp: &Frac,
) -> (Frac, bool) {
    let per_ic_uncapped = per_lc_amount / &frac(2, 1);
    let fp_remaining = fp_gross - spouse_from_fp;
    let m_frac = frac(m as i64, 1);
    let total_ic_uncapped = &per_ic_uncapped * &m_frac;

    if total_ic_uncapped > fp_remaining {
        let per_ic_capped = &fp_remaining / &m_frac;
        (per_ic_capped, true)
    } else {
        (per_ic_uncapped, false)
    }
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fraction::frac;
    use crate::step2_lines::LineCounts;

    // ── Helpers ─────────────────────────────────────────────────────

    fn default_decedent() -> Decedent {
        Decedent {
            id: "D".into(),
            name: "Decedent".into(),
            date_of_death: "2026-01-01".into(),
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
            date_of_marriage: Some("2020-01-01".into()),
            ..default_decedent()
        }
    }

    fn articulo_mortis_decedent() -> Decedent {
        Decedent {
            is_married: true,
            date_of_marriage: Some("2025-11-01".into()),
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 1,
            ..default_decedent()
        }
    }

    fn illegitimate_decedent() -> Decedent {
        Decedent {
            is_illegitimate: true,
            ..default_decedent()
        }
    }

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

    fn estate(pesos: i64) -> Frac {
        // Convert pesos to centavos fraction
        frac(pesos * 100, 1)
    }

    // ── articulo mortis tests ───────────────────────────────────────

    #[test]
    fn test_articulo_mortis_all_conditions_met() {
        let d = articulo_mortis_decedent();
        assert!(is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_not_ill_at_marriage() {
        let d = Decedent {
            was_ill_at_marriage: false,
            ..articulo_mortis_decedent()
        };
        assert!(!is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_illness_did_not_cause_death() {
        let d = Decedent {
            illness_caused_death: false,
            ..articulo_mortis_decedent()
        };
        assert!(!is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_not_solemnized_in_am() {
        let d = Decedent {
            marriage_solemnized_in_articulo_mortis: false,
            ..articulo_mortis_decedent()
        };
        assert!(!is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_exempt_by_cohabitation() {
        // ≥5 years of cohabitation exempts articulo mortis
        let d = Decedent {
            years_of_cohabitation: 5,
            ..articulo_mortis_decedent()
        };
        assert!(!is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_4_years_still_applies() {
        let d = Decedent {
            years_of_cohabitation: 4,
            ..articulo_mortis_decedent()
        };
        assert!(is_articulo_mortis(&d));
    }

    // ── cap rule tests ──────────────────────────────────────────────

    #[test]
    fn test_cap_rule_not_triggered() {
        // n=1, m=1, no spouse: per_lc = E/2, per_ic_uncapped = E/4
        // fp_gross = E/2, fp_remaining = E/2 (no spouse)
        // total_ic_uncapped = E/4 <= E/2 → no cap
        let per_lc = frac(1, 2); // fraction of estate
        let fp_gross = frac(1, 2);
        let spouse_from_fp = Frac::zero();
        let (per_ic, triggered) = apply_cap_rule(&per_lc, 1, &fp_gross, &spouse_from_fp);
        assert!(!triggered);
        assert_eq!(per_ic, frac(1, 4)); // half of LC share
    }

    #[test]
    fn test_cap_rule_triggered_t5a_tv13() {
        // TV-13: T5a, n=1, m=3, spouse present
        // per_lc = 1/2 (fraction), fp_gross = 1/2
        // spouse = 1/4, fp_remaining = 1/2 - 1/4 = 1/4
        // per_ic_uncapped = 1/4, total_ic_uncapped = 3 * 1/4 = 3/4
        // 3/4 > 1/4 → cap: per_ic_capped = (1/4)/3 = 1/12
        let per_lc = frac(1, 2);
        let fp_gross = frac(1, 2);
        let spouse_from_fp = frac(1, 4);
        let (per_ic, triggered) = apply_cap_rule(&per_lc, 3, &fp_gross, &spouse_from_fp);
        assert!(triggered);
        assert_eq!(per_ic, frac(1, 12));
    }

    #[test]
    fn test_cap_rule_exact_boundary() {
        // n=1, m=2, no spouse: per_lc = 1/2, per_ic_uncapped = 1/4
        // fp_remaining = 1/2
        // total_ic_uncapped = 2 * 1/4 = 1/2 == fp_remaining → no cap (<=)
        let per_lc = frac(1, 2);
        let fp_gross = frac(1, 2);
        let spouse_from_fp = Frac::zero();
        let (per_ic, triggered) = apply_cap_rule(&per_lc, 2, &fp_gross, &spouse_from_fp);
        assert!(!triggered);
        assert_eq!(per_ic, frac(1, 4));
    }

    #[test]
    fn test_cap_rule_triggered_t5b() {
        // T5b: n=2, m=5, spouse present
        // per_lc = 1/(2*2) = 1/4
        // fp_gross = 1/2
        // spouse = 1/(2*2) = 1/4
        // fp_remaining = 1/2 - 1/4 = 1/4
        // per_ic_uncapped = 1/8, total_ic_uncapped = 5 * 1/8 = 5/8
        // 5/8 > 1/4 → cap: per_ic_capped = (1/4)/5 = 1/20
        let per_lc = frac(1, 4);
        let fp_gross = frac(1, 2);
        let spouse_from_fp = frac(1, 4);
        let (per_ic, triggered) = apply_cap_rule(&per_lc, 5, &fp_gross, &spouse_from_fp);
        assert!(triggered);
        assert_eq!(per_ic, frac(1, 20));
    }

    // ── T1: n LC only (Art. 888) ────────────────────────────────────

    #[test]
    fn test_t1_two_lc() {
        // TV-06 simplified: E=₱10M, 2 LC, no spouse
        // Each LC = E/(2*2) = E/4
        // FP = E/2
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T1,
            line_counts: LineCounts {
                legitimate_child: 2,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_lc("LC2")],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        // Check FP pipeline
        assert_eq!(output.free_portion.fp_gross, &e * &frac(1, 2));
        assert_eq!(output.free_portion.spouse_from_fp, Frac::zero());
        assert_eq!(output.free_portion.ic_from_fp, Frac::zero());
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 2));
        assert!(!output.free_portion.cap_triggered);

        // Check per-heir legitimes
        assert_eq!(output.heir_legitimes.len(), 2);
        let per_lc = &e * &frac(1, 4);
        for hl in &output.heir_legitimes {
            assert_eq!(hl.effective_category, EffectiveCategory::LegitimateChildGroup);
            assert_eq!(hl.legitime_amount, per_lc);
            assert_eq!(hl.legitime_fraction, frac(1, 4));
            assert!(!hl.cap_applied);
        }
    }

    #[test]
    fn test_t1_single_lc() {
        // E=₱8M, 1 LC
        // LC = E/2
        // FP = E/2
        let e = estate(8_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T1,
            line_counts: LineCounts {
                legitimate_child: 1,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1")],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        assert_eq!(output.heir_legitimes.len(), 1);
        assert_eq!(output.heir_legitimes[0].legitime_fraction, frac(1, 2));
        assert_eq!(output.heir_legitimes[0].legitime_amount, &e * &frac(1, 2));
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 2));
    }

    // ── T2: 1 LC + Spouse (Arts. 888, 892 ¶1) ──────────────────────

    #[test]
    fn test_t2_one_lc_plus_spouse() {
        // E=₱20M, 1 LC + Spouse
        // LC = E/2, Spouse = E/4 (from FP), FP = E/4
        let e = estate(20_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T2,
            line_counts: LineCounts {
                legitimate_child: 1,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_spouse("S")],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        // LC gets E/2
        let lc_leg = output.heir_legitimes.iter().find(|h| h.heir_id == "LC1").unwrap();
        assert_eq!(lc_leg.legitime_amount, &e * &frac(1, 2));

        // Spouse gets E/4
        let sp_leg = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp_leg.legitime_amount, &e * &frac(1, 4));

        // FP pipeline
        assert_eq!(output.free_portion.fp_gross, &e * &frac(1, 2));
        assert_eq!(output.free_portion.spouse_from_fp, &e * &frac(1, 4));
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 4));
    }

    // ── T3: n≥2 LC + Spouse (Arts. 888, 892 ¶2) ────────────────────

    #[test]
    fn test_t3_three_lc_plus_spouse() {
        // E=₱12M, 3 LC + Spouse
        // Each LC = E/(2*3) = E/6
        // Spouse = E/(2*3) = E/6 (same as one LC, from FP)
        // FP = E/2 - E/6 = E/3 → (n-1)/(2n) = 2/6 = 1/3
        let e = estate(12_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T3,
            line_counts: LineCounts {
                legitimate_child: 3,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_lc("LC2"), make_lc("LC3"), make_spouse("S")],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let per_lc = &e * &frac(1, 6);
        for id in &["LC1", "LC2", "LC3"] {
            let hl = output.heir_legitimes.iter().find(|h| h.heir_id == *id).unwrap();
            assert_eq!(hl.legitime_amount, per_lc);
        }

        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, per_lc); // same as one LC

        // FP = (n-1)/(2n) = 2/6 = 1/3
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 3));
    }

    #[test]
    fn test_t3_two_lc_plus_spouse() {
        // n=2: spouse = E/(2*2) = E/4 (coincidentally matches T2)
        // FP = (2-1)/(2*2) = 1/4
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T3,
            line_counts: LineCounts {
                legitimate_child: 2,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_lc("LC2"), make_spouse("S")],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let per_lc = &e * &frac(1, 4);
        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, per_lc); // 1/(2*2) = 1/4

        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 4));
    }

    // ── T4: n LC + m IC, no Spouse (Arts. 888, 895) ─────────────────

    #[test]
    fn test_t4_no_cap() {
        // n=2, m=1, no spouse
        // per_lc = E/(2*2) = E/4
        // per_ic_uncapped = E/8
        // fp_gross = E/2, fp_remaining = E/2 (no spouse)
        // total_ic = 1 * E/8 <= E/2 → no cap
        // FP_disposable = E/2 - E/8 = 3E/8
        let e = estate(8_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T4,
            line_counts: LineCounts {
                legitimate_child: 2,
                illegitimate_child: 1,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_lc("LC2"), make_ic("IC1")],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let per_lc = &e * &frac(1, 4);
        for id in &["LC1", "LC2"] {
            let hl = output.heir_legitimes.iter().find(|h| h.heir_id == *id).unwrap();
            assert_eq!(hl.legitime_amount, per_lc);
        }

        let ic = output.heir_legitimes.iter().find(|h| h.heir_id == "IC1").unwrap();
        assert_eq!(ic.legitime_amount, &e * &frac(1, 8)); // half of LC share
        assert!(!ic.cap_applied);

        assert_eq!(output.free_portion.fp_disposable, &e * &frac(3, 8));
        assert!(!output.free_portion.cap_triggered);
    }

    #[test]
    fn test_t4_cap_triggered() {
        // n=1, m=5, no spouse
        // per_lc = E/2
        // per_ic_uncapped = E/4, total_ic = 5 * E/4 = 5E/4
        // fp_remaining = E/2
        // 5E/4 > E/2 → cap: per_ic_capped = (E/2)/5 = E/10
        // FP_disposable = 0
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T4,
            line_counts: LineCounts {
                legitimate_child: 1,
                illegitimate_child: 5,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            },
            heirs: vec![
                make_lc("LC1"),
                make_ic("IC1"), make_ic("IC2"), make_ic("IC3"),
                make_ic("IC4"), make_ic("IC5"),
            ],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let lc = output.heir_legitimes.iter().find(|h| h.heir_id == "LC1").unwrap();
        assert_eq!(lc.legitime_amount, &e * &frac(1, 2));

        for i in 1..=5 {
            let ic = output.heir_legitimes.iter().find(|h| h.heir_id == format!("IC{}", i)).unwrap();
            assert_eq!(ic.legitime_amount, &e * &frac(1, 10));
            assert!(ic.cap_applied);
        }

        assert!(output.free_portion.cap_triggered);
        assert_eq!(output.free_portion.fp_disposable, Frac::zero());
    }

    // ── T5a: 1 LC + m IC + Spouse (Arts. 888, 892 ¶1, 895) ─────────

    #[test]
    fn test_t5a_cap_triggered_tv13() {
        // TV-13: E=₱20M, 1 LC, 3 IC, Spouse
        // LC = E/2 = ₱10M
        // FP_gross = E/2 = ₱10M
        // Spouse = E/4 = ₱5M (from FP)
        // FP_remaining = E/2 - E/4 = E/4 = ₱5M
        // per_ic_uncapped = E/4, total = 3 * E/4 = 3E/4 = ₱15M
        // 3E/4 > E/4 → cap: per_ic = (E/4)/3 = E/12
        // FP_disposable = 0
        let e = estate(20_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T5a,
            line_counts: LineCounts {
                legitimate_child: 1,
                illegitimate_child: 3,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![
                make_lc("Bianca"),
                make_ic("Carlo"), make_ic("Dante"), make_ic("Elisa"),
                make_spouse("Fiona"),
            ],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        // LC
        let lc = output.heir_legitimes.iter().find(|h| h.heir_id == "Bianca").unwrap();
        assert_eq!(lc.legitime_amount, &e * &frac(1, 2));

        // Spouse
        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "Fiona").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 4));

        // ICs — capped
        for name in &["Carlo", "Dante", "Elisa"] {
            let ic = output.heir_legitimes.iter().find(|h| h.heir_id == *name).unwrap();
            assert_eq!(ic.legitime_amount, &e * &frac(1, 12));
            assert!(ic.cap_applied);
        }

        // FP pipeline
        assert_eq!(output.free_portion.fp_gross, &e * &frac(1, 2));
        assert_eq!(output.free_portion.spouse_from_fp, &e * &frac(1, 4));
        assert!(output.free_portion.cap_triggered);
        assert_eq!(output.free_portion.fp_disposable, Frac::zero());

        // Invariant: sum of all legitimes <= estate_base
        let total: Frac = output.heir_legitimes.iter()
            .fold(Frac::zero(), |acc, h| acc + h.legitime_amount.clone());
        assert!(total <= e);
    }

    #[test]
    fn test_t5a_no_cap() {
        // n=1, m=1, spouse: per_ic_uncapped = E/4, total = E/4
        // fp_remaining = E/2 - E/4 = E/4
        // E/4 <= E/4 → no cap
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T5a,
            line_counts: LineCounts {
                legitimate_child: 1,
                illegitimate_child: 1,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_ic("IC1"), make_spouse("S")],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let ic = output.heir_legitimes.iter().find(|h| h.heir_id == "IC1").unwrap();
        assert_eq!(ic.legitime_amount, &e * &frac(1, 4));
        assert!(!ic.cap_applied);
        assert!(!output.free_portion.cap_triggered);
        assert_eq!(output.free_portion.fp_disposable, Frac::zero());
    }

    // ── T5b: n≥2 LC + m IC + Spouse ─────────────────────────────────

    #[test]
    fn test_t5b_cap_not_triggered() {
        // n=2, m=1, spouse
        // per_lc = E/4, per_ic_uncapped = E/8
        // spouse = E/4 (from FP)
        // fp_remaining = E/2 - E/4 = E/4
        // total_ic = E/8 <= E/4 → no cap
        // FP_disposable = E/4 - E/8 = E/8
        let e = estate(16_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T5b,
            line_counts: LineCounts {
                legitimate_child: 2,
                illegitimate_child: 1,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_lc("LC2"), make_ic("IC1"), make_spouse("S")],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let ic = output.heir_legitimes.iter().find(|h| h.heir_id == "IC1").unwrap();
        assert_eq!(ic.legitime_amount, &e * &frac(1, 8));
        assert!(!ic.cap_applied);
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 8));
    }

    #[test]
    fn test_t5b_cap_triggered() {
        // n=2, m=5, spouse
        // per_lc = E/4, spouse = E/4
        // fp_remaining = E/2 - E/4 = E/4
        // per_ic_uncapped = E/8, total = 5*E/8 = 5E/8
        // 5E/8 > E/4 → cap: per_ic = (E/4)/5 = E/20
        let e = estate(20_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T5b,
            line_counts: LineCounts {
                legitimate_child: 2,
                illegitimate_child: 5,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![
                make_lc("LC1"), make_lc("LC2"),
                make_ic("IC1"), make_ic("IC2"), make_ic("IC3"),
                make_ic("IC4"), make_ic("IC5"),
                make_spouse("S"),
            ],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        for i in 1..=5 {
            let ic = output.heir_legitimes.iter().find(|h| h.heir_id == format!("IC{}", i)).unwrap();
            assert_eq!(ic.legitime_amount, &e * &frac(1, 20));
            assert!(ic.cap_applied);
        }
        assert!(output.free_portion.cap_triggered);
        assert_eq!(output.free_portion.fp_disposable, Frac::zero());
    }

    // ── T6: Ascendants Only (Art. 889) ──────────────────────────────

    #[test]
    fn test_t6_two_parents() {
        // E=₱10M, 2 parents
        // Ascendants collective = E/2
        // Each parent = E/4
        // FP = E/2
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T6,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 2,
            },
            heirs: vec![
                make_ascendant("P1", 1, LineOfDescent::Paternal),
                make_ascendant("P2", 1, LineOfDescent::Maternal),
            ],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let p1 = output.heir_legitimes.iter().find(|h| h.heir_id == "P1").unwrap();
        let p2 = output.heir_legitimes.iter().find(|h| h.heir_id == "P2").unwrap();
        assert_eq!(p1.legitime_amount, &e * &frac(1, 4));
        assert_eq!(p2.legitime_amount, &e * &frac(1, 4));
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 2));
    }

    #[test]
    fn test_t6_single_parent() {
        // Only one parent survives → gets entire collective 1/2
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T6,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 1,
            },
            heirs: vec![make_ascendant("P1", 1, LineOfDescent::Paternal)],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        assert_eq!(output.heir_legitimes.len(), 1);
        assert_eq!(output.heir_legitimes[0].legitime_amount, &e * &frac(1, 2));
    }

    // ── T7: Ascendants + Spouse (Arts. 889, 893) ────────────────────

    #[test]
    fn test_t7_two_parents_plus_spouse() {
        // E=₱10M
        // Ascendants = E/2, Spouse = E/4 (from FP), FP = E/4
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T7,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 2,
            },
            heirs: vec![
                make_ascendant("P1", 1, LineOfDescent::Paternal),
                make_ascendant("P2", 1, LineOfDescent::Maternal),
                make_spouse("S"),
            ],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 4));

        // Each parent = (E/2) / 2 = E/4
        let p1 = output.heir_legitimes.iter().find(|h| h.heir_id == "P1").unwrap();
        assert_eq!(p1.legitime_amount, &e * &frac(1, 4));

        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 4));
    }

    // ── T8: Ascendants + m IC (Arts. 889, 896) ──────────────────────

    #[test]
    fn test_t8_ascendants_plus_ics() {
        // E=₱8M, 2 parents + 2 IC
        // Ascendants = E/2, IC collective = E/4 (Art. 896 flat)
        // Each IC = E/8
        // FP = E/4
        let e = estate(8_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T8,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 2,
                surviving_spouse: 0,
                legitimate_ascendant: 2,
            },
            heirs: vec![
                make_ascendant("P1", 1, LineOfDescent::Paternal),
                make_ascendant("P2", 1, LineOfDescent::Maternal),
                make_ic("IC1"),
                make_ic("IC2"),
            ],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let ic1 = output.heir_legitimes.iter().find(|h| h.heir_id == "IC1").unwrap();
        assert_eq!(ic1.legitime_amount, &e * &frac(1, 8));

        assert_eq!(output.free_portion.ic_from_fp, &e * &frac(1, 4));
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 4));
    }

    // ── T9: Ascendants + m IC + Spouse (Art. 899) ───────────────────

    #[test]
    fn test_t9_most_constrained() {
        // E=₱16M, 2 parents + 2 IC + Spouse
        // Ascendants = E/2, IC collective = E/4, Spouse = E/8, FP = E/8
        let e = estate(16_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T9,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 2,
                surviving_spouse: 1,
                legitimate_ascendant: 2,
            },
            heirs: vec![
                make_ascendant("P1", 1, LineOfDescent::Paternal),
                make_ascendant("P2", 1, LineOfDescent::Maternal),
                make_ic("IC1"),
                make_ic("IC2"),
                make_spouse("S"),
            ],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 8));

        // Each IC = (E/4)/2 = E/8
        let ic = output.heir_legitimes.iter().find(|h| h.heir_id == "IC1").unwrap();
        assert_eq!(ic.legitime_amount, &e * &frac(1, 8));

        // FP = only E/8
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 8));
    }

    // ── T10: m IC + Spouse (Art. 894) ───────────────────────────────

    #[test]
    fn test_t10_ic_plus_spouse() {
        // E=₱9M, 3 IC + Spouse
        // IC collective = E/3, Spouse = E/3, FP = E/3
        // Each IC = E/9
        let e = estate(9_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T10,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 3,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![
                make_ic("IC1"), make_ic("IC2"), make_ic("IC3"),
                make_spouse("S"),
            ],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 3));

        for i in 1..=3 {
            let ic = output.heir_legitimes.iter().find(|h| h.heir_id == format!("IC{}", i)).unwrap();
            assert_eq!(ic.legitime_amount, &e * &frac(1, 9));
        }

        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 3));
    }

    // ── T11: m IC Only (Art. 901) ───────────────────────────────────

    #[test]
    fn test_t11_ic_only() {
        // E=₱6M, 3 IC
        // IC collective = E/2, FP = E/2
        // Each IC = E/6
        let e = estate(6_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T11,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 3,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_ic("IC1"), make_ic("IC2"), make_ic("IC3")],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        for i in 1..=3 {
            let ic = output.heir_legitimes.iter().find(|h| h.heir_id == format!("IC{}", i)).unwrap();
            assert_eq!(ic.legitime_amount, &e * &frac(1, 6));
        }
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 2));
    }

    // ── T12: Spouse Only (Art. 900) ─────────────────────────────────

    #[test]
    fn test_t12_spouse_only_normal() {
        // E=₱10M, Spouse only, normal marriage
        // Spouse = E/2, FP = E/2
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T12,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_spouse("S")],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 2));
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 2));
    }

    #[test]
    fn test_t12_spouse_only_articulo_mortis_tv16() {
        // TV-16: Articulo mortis: spouse ½ → ⅓
        // E=₱12M, Spouse only, articulo mortis
        // Spouse = E/3, FP = 2E/3
        let e = estate(12_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T12,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_spouse("S")],
            decedent: articulo_mortis_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 3));
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(2, 3));
    }

    // ── T13: No Compulsory Heirs ────────────────────────────────────

    #[test]
    fn test_t13_no_compulsory_heirs() {
        // E=₱10M, no compulsory heirs
        // Entire estate is free portion
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T13,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            },
            heirs: vec![],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        assert!(output.heir_legitimes.is_empty());
        assert_eq!(output.free_portion.fp_gross, e.clone());
        assert_eq!(output.free_portion.fp_disposable, e);
    }

    // ── T14: Parents of Illegitimate Decedent (Art. 903) ────────────

    #[test]
    fn test_t14_illegitimate_decedent_parents() {
        // E=₱8M, illegitimate decedent, 2 parents
        // Parents collective = E/2, FP = E/2
        let e = estate(8_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T14,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 2,
            },
            heirs: vec![
                make_ascendant("P1", 1, LineOfDescent::Paternal),
                make_ascendant("P2", 1, LineOfDescent::Maternal),
            ],
            decedent: illegitimate_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let p1 = output.heir_legitimes.iter().find(|h| h.heir_id == "P1").unwrap();
        let p2 = output.heir_legitimes.iter().find(|h| h.heir_id == "P2").unwrap();
        assert_eq!(p1.legitime_amount, &e * &frac(1, 4));
        assert_eq!(p2.legitime_amount, &e * &frac(1, 4));
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 2));
    }

    // ── T15: Parents + Spouse of Illegitimate Decedent ──────────────

    #[test]
    fn test_t15_illegitimate_decedent_parents_plus_spouse() {
        // E=₱12M, illegitimate decedent, 2 parents + spouse
        // Parents collective = E/4, Spouse = E/4, FP = E/2
        let e = estate(12_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T15,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 2,
            },
            heirs: vec![
                make_ascendant("P1", 1, LineOfDescent::Paternal),
                make_ascendant("P2", 1, LineOfDescent::Maternal),
                make_spouse("S"),
            ],
            decedent: {
                let mut d = illegitimate_decedent();
                d.is_married = true;
                d.date_of_marriage = Some("2020-01-01".into());
                d
            },
        };
        let output = step5_compute_legitimes(&input);

        // Parents get E/4 collective → E/8 each
        let p1 = output.heir_legitimes.iter().find(|h| h.heir_id == "P1").unwrap();
        assert_eq!(p1.legitime_amount, &e * &frac(1, 8));

        // Spouse gets E/4
        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 4));

        // FP = E/2
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 2));
    }

    // ── Ascendant division sub-algorithm tests ──────────────────────

    #[test]
    fn test_ascendant_division_two_parents_equal() {
        // Two parents (degree 1) share collective equally
        let heirs = vec![
            make_ascendant("P1", 1, LineOfDescent::Paternal),
            make_ascendant("P2", 1, LineOfDescent::Maternal),
        ];
        let collective = frac(1, 2);
        let e = estate(10_000_000);
        let result = divide_among_ascendants(&heirs, &collective, &e);

        assert_eq!(result.len(), 2);
        let p1 = result.iter().find(|h| h.heir_id == "P1").unwrap();
        let p2 = result.iter().find(|h| h.heir_id == "P2").unwrap();
        assert_eq!(p1.legitime_fraction, frac(1, 4));
        assert_eq!(p2.legitime_fraction, frac(1, 4));
        assert_eq!(p1.legitime_amount, &e * &frac(1, 4));
    }

    #[test]
    fn test_ascendant_division_single_parent() {
        // Only one parent → gets entire collective
        let heirs = vec![make_ascendant("P1", 1, LineOfDescent::Maternal)];
        let collective = frac(1, 2);
        let e = estate(10_000_000);
        let result = divide_among_ascendants(&heirs, &collective, &e);

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].legitime_fraction, frac(1, 2));
    }

    #[test]
    fn test_ascendant_division_grandparents_by_line() {
        // No parents, 2 paternal grandparents + 1 maternal grandparent
        // By-line split: paternal line gets 1/2 of collective, maternal gets 1/2
        // Paternal: each gets 1/4 of collective. Maternal: gets 1/2 of collective.
        let heirs = vec![
            make_ascendant("GP1", 2, LineOfDescent::Paternal),
            make_ascendant("GP2", 2, LineOfDescent::Paternal),
            make_ascendant("GM1", 2, LineOfDescent::Maternal),
        ];
        let collective = frac(1, 2);
        let e = estate(12_000_000);
        let result = divide_among_ascendants(&heirs, &collective, &e);

        assert_eq!(result.len(), 3);
        // Paternal each: (1/2 * 1/2) / 2 = 1/8
        let gp1 = result.iter().find(|h| h.heir_id == "GP1").unwrap();
        let gp2 = result.iter().find(|h| h.heir_id == "GP2").unwrap();
        assert_eq!(gp1.legitime_fraction, frac(1, 8));
        assert_eq!(gp2.legitime_fraction, frac(1, 8));

        // Maternal: 1/2 * 1/2 = 1/4
        let gm1 = result.iter().find(|h| h.heir_id == "GM1").unwrap();
        assert_eq!(gm1.legitime_fraction, frac(1, 4));

        // Sum = 1/8 + 1/8 + 1/4 = 1/2 ✓
        let sum = &gp1.legitime_fraction + &(&gp2.legitime_fraction + &gm1.legitime_fraction);
        assert_eq!(sum, collective);
    }

    #[test]
    fn test_ascendant_division_one_line_only() {
        // Only maternal grandparents, no paternal → they get entire collective
        let heirs = vec![
            make_ascendant("GM1", 2, LineOfDescent::Maternal),
            make_ascendant("GM2", 2, LineOfDescent::Maternal),
        ];
        let collective = frac(1, 2);
        let e = estate(10_000_000);
        let result = divide_among_ascendants(&heirs, &collective, &e);

        assert_eq!(result.len(), 2);
        // Each gets 1/2 of the collective = 1/4
        let gm1 = result.iter().find(|h| h.heir_id == "GM1").unwrap();
        assert_eq!(gm1.legitime_fraction, frac(1, 4));
    }

    // ── FP pipeline sum invariants ──────────────────────────────────

    #[test]
    fn test_fp_pipeline_sum_invariant_t5a() {
        // The sum of all legitimes + fp_disposable should equal estate_base
        let e = estate(20_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T5a,
            line_counts: LineCounts {
                legitimate_child: 1,
                illegitimate_child: 3,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![
                make_lc("LC1"),
                make_ic("IC1"), make_ic("IC2"), make_ic("IC3"),
                make_spouse("S"),
            ],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let legitime_sum: Frac = output.heir_legitimes.iter()
            .fold(Frac::zero(), |acc, h| acc + h.legitime_amount.clone());
        let total = legitime_sum + output.free_portion.fp_disposable.clone();
        assert_eq!(total, e);
    }

    #[test]
    fn test_fp_pipeline_sum_invariant_t9() {
        // T9 is the most constrained — verify all parts sum to estate
        let e = estate(16_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T9,
            line_counts: LineCounts {
                legitimate_child: 0,
                illegitimate_child: 2,
                surviving_spouse: 1,
                legitimate_ascendant: 2,
            },
            heirs: vec![
                make_ascendant("P1", 1, LineOfDescent::Paternal),
                make_ascendant("P2", 1, LineOfDescent::Maternal),
                make_ic("IC1"), make_ic("IC2"),
                make_spouse("S"),
            ],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        let sum: Frac = output.heir_legitimes.iter()
            .fold(Frac::zero(), |acc, h| acc + h.legitime_amount.clone());
        let total = sum + output.free_portion.fp_disposable.clone();
        assert_eq!(total, e);
    }

    // ── Edge case: intestate scenarios should not run through step5 ─

    #[test]
    fn test_intestate_scenarios_produce_empty_legitimes() {
        // Intestate scenarios don't have testate legitime computation.
        // Step 5 should handle them gracefully — either no-op or basic share.
        // The actual intestate distribution is in Step 7.
        // For intestate, step5 can still compute the "effective" legitimes
        // that act as floors (needed for invariant checking).
        // The key point: no cap rule applies in intestate (§7.3).
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::I1,
            line_counts: LineCounts {
                legitimate_child: 1,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1")],
            decedent: default_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        // For intestate, FP_disposable should be 0 (entire estate distributed by intestate rules)
        // or the function can indicate intestate mode. The exact behavior depends on
        // how the engine uses step5 in intestate — verify the pipeline makes sense.
        // At minimum, it should not panic.
        assert!(output.free_portion.fp_disposable >= Frac::zero());
    }

    // ── TV-14 mixed detection data (T3 scenario) ────────────────────

    #[test]
    fn test_t3_fp_for_mixed_detection_tv14() {
        // TV-14: E=₱10M, 2 LC + Spouse, T3
        // FP_disposable = E * (n-1)/(2n) = E * 1/4 = ₱2.5M
        // After step5, the engine checks if will covers < FP_disposable → MIXED
        let e = estate(10_000_000);
        let input = Step5Input {
            estate_base: e.clone(),
            scenario_code: ScenarioCode::T3,
            line_counts: LineCounts {
                legitimate_child: 2,
                illegitimate_child: 0,
                surviving_spouse: 1,
                legitimate_ascendant: 0,
            },
            heirs: vec![make_lc("LC1"), make_lc("LC2"), make_spouse("S")],
            decedent: married_decedent(),
        };
        let output = step5_compute_legitimes(&input);

        // FP_disposable = (n-1)/(2n) * E = 1/4 * E
        assert_eq!(output.free_portion.fp_disposable, &e * &frac(1, 4));

        // Children: each gets E/4
        let lc1 = output.heir_legitimes.iter().find(|h| h.heir_id == "LC1").unwrap();
        assert_eq!(lc1.legitime_amount, &e * &frac(1, 4));

        // Spouse: E/(2*2) = E/4
        let sp = output.heir_legitimes.iter().find(|h| h.heir_id == "S").unwrap();
        assert_eq!(sp.legitime_amount, &e * &frac(1, 4));
    }
}
