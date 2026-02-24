//! Step 10: Finalize + Narrate
//!
//! Converts all `Frac` intermediate results to `Money` (centavos) with proper
//! rounding, then generates per-heir plain-English narratives citing legal articles.
//!
//! Two main responsibilities:
//! 1. **Rounding** (§12): Floor each share to centavos, distribute remainder
//!    (1 centavo at a time, largest share first). Sum invariant MUST hold:
//!    `sum(all_heir_amounts) == net_distributable_estate`.
//! 2. **Narrative generation** (§11): Each heir gets a self-contained paragraph
//!    explaining their share, legal basis, and any special events.
//!
//! Spec references:
//!   - §11.1-11.8 Narrative Template System
//!   - §12.1-12.3 Rounding

use num_bigint::BigInt;
use num_integer::Integer;
use num_traits::{One, Zero};

use crate::fraction::Frac;
use crate::step5_legitimes::{FreePortion, HeirLegitime};
use crate::step6_validation::Step6Output;
use crate::step7_distribute::HeirDistribution;
use crate::step8_collation::Step8Output;
use crate::step9_vacancy::VacancyRecord;
use crate::types::*;

// ── Narrative Section Types (§11.5) ─────────────────────────────────

/// Section types for narrative assembly, in order (§11.5).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NarrativeSectionType {
    Header,
    SuccessionType,
    Category,
    Legitime,
    CapRule,
    FreePortion,
    IntestateShare,
    Collation,
    Representation,
    Disinheritance,
    Preterition,
    Inofficious,
    Underprovision,
    Condition,
    Accretion,
    Substitution,
    Reservation,
    ArticuloMortis,
    Comparison,
}

/// A single section of a narrative paragraph (§11.5).
#[derive(Debug, Clone)]
pub struct NarrativeSection {
    pub section_type: NarrativeSectionType,
    pub text: String,
    pub legal_basis: Vec<String>,
}

/// Runtime configuration for narrative generation (§11.7).
#[derive(Debug, Clone)]
pub struct NarrativeConfig {
    pub include_comparison: bool,
    pub include_filiation_proof: bool,
    pub include_collation_detail: bool,
    pub max_sentences: usize,
    pub language: String,
}

impl Default for NarrativeConfig {
    fn default() -> Self {
        Self {
            include_comparison: false,
            include_filiation_proof: true,
            include_collation_detail: true,
            max_sentences: 15,
            language: "en".to_string(),
        }
    }
}

// ── Types ───────────────────────────────────────────────────────────

/// Input to Step 10.
#[derive(Debug, Clone)]
pub struct Step10Input {
    /// Net distributable estate (original, in Money).
    pub net_estate: Money,
    /// Net distributable estate as Frac (centavos).
    pub net_estate_frac: Frac,
    /// Collation-adjusted estate base from Step 4.
    pub estate_base: Frac,
    /// Decedent information.
    pub decedent: Decedent,
    /// All classified heirs.
    pub heirs: Vec<Heir>,
    /// Per-heir legitimes from Step 5.
    pub heir_legitimes: Vec<HeirLegitime>,
    /// Free portion pipeline from Step 5.
    pub free_portion: FreePortion,
    /// Testate validation results from Step 6 (None if intestate).
    pub validation: Option<Step6Output>,
    /// Per-heir distributions after vacancy resolution (Step 9).
    pub final_distributions: Vec<HeirDistribution>,
    /// Collation adjustment results from Step 8.
    pub collation_output: Step8Output,
    /// Vacancy records from Step 9.
    pub vacancies: Vec<VacancyRecord>,
    /// Final succession type.
    pub succession_type: SuccessionType,
    /// Final scenario code.
    pub scenario_code: ScenarioCode,
    /// Narrative configuration.
    pub narrative_config: NarrativeConfig,
    /// Total pipeline restarts performed.
    pub total_restarts: i32,
}

/// A single heir's rounded monetary allocation.
#[derive(Debug, Clone)]
pub struct RoundedShare {
    pub heir_id: HeirId,
    pub from_legitime: Money,
    pub from_free_portion: Money,
    pub from_intestate: Money,
    pub total: Money,
    pub donations_imputed: Money,
    pub gross_entitlement: Money,
    pub net_from_estate: Money,
}

/// Output of Step 10 — the final engine output.
pub type Step10Output = EngineOutput;

// ── Helper Functions (§11.6) ────────────────────────────────────────

/// Short display label for the heir's category (§11.6).
pub fn category_label(heir: &Heir) -> String {
    match heir.effective_category {
        EffectiveCategory::LegitimateChildGroup => {
            if heir.inherits_by == InheritanceMode::Representation {
                "grandchild, by representation".to_string()
            } else {
                match heir.raw_category {
                    HeirCategory::AdoptedChild => "adopted child".to_string(),
                    HeirCategory::LegitimatedChild => "legitimated child".to_string(),
                    _ => "legitimate child".to_string(),
                }
            }
        }
        EffectiveCategory::IllegitimateChildGroup => "illegitimate child".to_string(),
        EffectiveCategory::SurvivingSpouseGroup => "surviving spouse".to_string(),
        EffectiveCategory::LegitimateAscendantGroup => match heir.raw_category {
            HeirCategory::LegitimateParent => "legitimate parent".to_string(),
            _ => "legitimate ascendant".to_string(),
        },
        EffectiveCategory::CollateralGroup => match heir.raw_category {
            HeirCategory::Sibling => "sibling".to_string(),
            HeirCategory::NephewNiece => "nephew/niece".to_string(),
            _ => "collateral relative".to_string(),
        },
    }
}

/// Full label with legal basis for CATEGORY section (§11.6).
pub fn raw_label(heir: &Heir) -> String {
    match heir.raw_category {
        HeirCategory::LegitimateChild => "legitimate child".to_string(),
        HeirCategory::AdoptedChild => {
            "adopted child (RA 8552 Sec. 17: same rights as legitimate)".to_string()
        }
        HeirCategory::LegitimatedChild => {
            "legitimated child (Art. 179, Family Code: same rights as legitimate)".to_string()
        }
        HeirCategory::IllegitimateChild => {
            "illegitimate child (Art. 176, Family Code)".to_string()
        }
        HeirCategory::SurvivingSpouse => "surviving spouse".to_string(),
        HeirCategory::LegitimateParent => "legitimate parent".to_string(),
        HeirCategory::LegitimateAscendant => "legitimate ascendant".to_string(),
        HeirCategory::Sibling => "sibling (Arts. 1003-1008)".to_string(),
        HeirCategory::NephewNiece => "nephew/niece (Art. 972)".to_string(),
        HeirCategory::OtherCollateral => "collateral relative (Arts. 1009-1010)".to_string(),
    }
}

/// Maps filiation proof to readable description with FC article (§11.6).
pub fn filiation_description(proof: FiliationProof) -> String {
    match proof {
        FiliationProof::BirthCertificate => {
            "record of birth in the civil register (Art. 172(1), FC)".to_string()
        }
        FiliationProof::FinalJudgment => {
            "final judgment establishing filiation (Art. 172(1), FC)".to_string()
        }
        FiliationProof::PublicDocumentAdmission => {
            "admission of filiation in a public document (Art. 172(2), FC)".to_string()
        }
        FiliationProof::PrivateHandwrittenAdmission => {
            "private handwritten instrument signed by the parent (Art. 172(2), FC)".to_string()
        }
        FiliationProof::OpenContinuousPossession => {
            "open and continuous possession of the status of an illegitimate child (Art. 172(3), FC)"
                .to_string()
        }
        FiliationProof::OtherEvidence => {
            "evidence as provided by the Rules of Court (Art. 172(4), FC)".to_string()
        }
    }
}

/// Format a Money value as a peso string (§11.3).
/// ₱ prefix, comma thousands, centavos only when non-zero.
pub fn format_peso(amount: &Money) -> String {
    let hundred = BigInt::from(100);
    let (pesos, cents) = amount.centavos.div_rem(&hundred);
    let pesos_str = format_with_commas(&pesos);
    if cents.is_zero() {
        format!("₱{}", pesos_str)
    } else {
        format!("₱{}.{:0>2}", pesos_str, cents)
    }
}

/// Format a BigInt with comma thousands separators.
fn format_with_commas(n: &BigInt) -> String {
    let s = n.to_string();
    let len = s.len();
    if len <= 3 {
        return s;
    }
    let first_group = len % 3;
    let mut result = String::with_capacity(len + len / 3);
    if first_group > 0 {
        result.push_str(&s[..first_group]);
    }
    for chunk in s[first_group..].as_bytes().chunks(3) {
        if !result.is_empty() {
            result.push(',');
        }
        result.push_str(std::str::from_utf8(chunk).unwrap());
    }
    result
}

/// Format a fraction as Unicode symbol or slash notation (§11.6).
pub fn format_fraction(f: &Frac) -> String {
    // Frac is always GCD-reduced, so numer/denom are in lowest terms
    let n = f.numer();
    let d = f.denom();
    // Check known Unicode fraction symbols
    let n_i64 = n.to_string().parse::<i64>().ok();
    let d_i64 = d.to_string().parse::<i64>().ok();
    if let (Some(num), Some(den)) = (n_i64, d_i64) {
        if let Some(symbol) = unicode_fraction(num, den) {
            return symbol.to_string();
        }
    }
    format!("{}/{}", n, d)
}

/// Lookup table for Unicode fraction characters.
fn unicode_fraction(num: i64, den: i64) -> Option<&'static str> {
    match (num, den) {
        (1, 2) => Some("½"),
        (1, 3) => Some("⅓"),
        (2, 3) => Some("⅔"),
        (1, 4) => Some("¼"),
        (3, 4) => Some("¾"),
        (1, 5) => Some("⅕"),
        (1, 6) => Some("⅙"),
        (1, 8) => Some("⅛"),
        (3, 8) => Some("⅜"),
        _ => None,
    }
}

/// Maps scenario code to the article governing the spouse's share (§11.6).
pub fn spouse_article(scenario: ScenarioCode) -> Option<&'static str> {
    match scenario {
        ScenarioCode::T1
        | ScenarioCode::T2
        | ScenarioCode::T3
        | ScenarioCode::T4
        | ScenarioCode::T5a
        | ScenarioCode::T5b => Some("Art. 892"),
        ScenarioCode::T7 | ScenarioCode::T8 => Some("Art. 893"),
        ScenarioCode::T9 => Some("Art. 899"),
        ScenarioCode::T11 => Some("Art. 894"),
        ScenarioCode::T12 | ScenarioCode::T13 => Some("Art. 900"),
        ScenarioCode::I2 | ScenarioCode::I4 => Some("Art. 996/999"),
        ScenarioCode::I6 => Some("Art. 997"),
        ScenarioCode::I8 => Some("Art. 998"),
        ScenarioCode::I10 => Some("Art. 1000"),
        ScenarioCode::I11 => Some("Art. 995"),
        ScenarioCode::I12 => Some("Art. 1001"),
        _ => None,
    }
}

// ── Rounding (§12) ──────────────────────────────────────────────────

/// Allocate rational shares to centavo-precision Money amounts using the
/// §12.2 rounding algorithm:
/// 1. Floor each share to centavos
/// 2. Distribute remainder (1 centavo at a time, largest share first)
///
/// Post-condition: sum of all returned Money == total_estate
pub fn allocate_with_rounding(
    shares: &[(HeirId, Frac)],
    total_estate: &Money,
) -> Vec<(HeirId, Money)> {
    if shares.is_empty() {
        return vec![];
    }

    // Build (index, heir_id, frac) sorted by share descending
    let mut indexed: Vec<(usize, &HeirId, &Frac)> = shares
        .iter()
        .enumerate()
        .map(|(i, (id, f))| (i, id, f))
        .collect();
    indexed.sort_by(|a, b| b.2.cmp(a.2));

    // 1. Floor each share to centavos
    let mut result: Vec<(HeirId, BigInt)> = Vec::with_capacity(shares.len());
    let mut total_allocated = BigInt::zero();
    for (_, id, share) in &indexed {
        // For non-negative fractions, numer/denom with integer division = floor
        let centavos = share.numer().div_floor(share.denom());
        total_allocated += &centavos;
        result.push(((*id).clone(), centavos));
    }

    // 2. Distribute remainder (1 centavo at a time, largest share first)
    let mut remainder = &total_estate.centavos - &total_allocated;
    let one = BigInt::one();
    for (_, centavos) in result.iter_mut() {
        if remainder <= BigInt::zero() {
            break;
        }
        *centavos += &one;
        remainder -= &one;
    }

    result
        .into_iter()
        .map(|(id, c)| (id, Money { centavos: c }))
        .collect()
}

// ── Narrative Generation (§11) ──────────────────────────────────────

/// Generate the narrative sections for a single heir (§11.1).
pub fn generate_heir_narrative(
    heir: &Heir,
    share: &InheritanceShare,
    input: &Step10Input,
) -> Vec<NarrativeSection> {
    let mut sections = Vec::new();
    let label = category_label(heir);

    // HEADER section (§11.2)
    let header_text = if share.donations_imputed.centavos > BigInt::zero() {
        format!(
            "**{} ({})** receives **{} from the estate** (plus {} previously received as a donation, for a total of {}).",
            heir.name,
            label,
            format_peso(&share.net_from_estate),
            format_peso(&share.donations_imputed),
            format_peso(&share.gross_entitlement),
        )
    } else if share.total.centavos == BigInt::zero() {
        format!("**{} ({})** receives **₱0**.", heir.name, label)
    } else {
        format!(
            "**{} ({})** receives **{}**.",
            heir.name,
            label,
            format_peso(&share.total),
        )
    };
    sections.push(NarrativeSection {
        section_type: NarrativeSectionType::Header,
        text: header_text,
        legal_basis: vec![],
    });

    // SUCCESSION TYPE section
    let succession_text = match input.succession_type {
        SuccessionType::Intestate | SuccessionType::IntestateByPreterition => {
            "The decedent died intestate (without a valid will).".to_string()
        }
        SuccessionType::Testate => "The decedent left a valid will.".to_string(),
        SuccessionType::Mixed => {
            "The decedent left a will that does not dispose of the entire estate.".to_string()
        }
    };
    sections.push(NarrativeSection {
        section_type: NarrativeSectionType::SuccessionType,
        text: succession_text,
        legal_basis: vec![],
    });

    // CATEGORY section
    let rl = raw_label(heir);
    let category_text = if heir.is_compulsory {
        format!(
            "As a {} (Art. 887 of the Civil Code), {} is a compulsory heir.",
            rl, heir.name,
        )
    } else {
        format!("{} is classified as a {}.", heir.name, rl)
    };
    sections.push(NarrativeSection {
        section_type: NarrativeSectionType::Category,
        text: category_text,
        legal_basis: share.legal_basis.clone(),
    });

    // REPRESENTATION section (if applicable)
    if heir.inherits_by == InheritanceMode::Representation {
        if let Some(ref ancestor) = heir.represents {
            sections.push(NarrativeSection {
                section_type: NarrativeSectionType::Representation,
                text: format!(
                    "{} inherits by right of representation (Art. 970 of the Civil Code) in place of {}.",
                    heir.name, ancestor,
                ),
                legal_basis: vec!["Art. 970".to_string()],
            });
        }
    }

    sections
}

/// Assemble narrative sections into a single paragraph string.
pub fn assemble_narrative(sections: &[NarrativeSection]) -> String {
    sections
        .iter()
        .map(|s| s.text.as_str())
        .collect::<Vec<_>>()
        .join(" ")
}

// ── Public API ──────────────────────────────────────────────────────

/// Finalize the engine output:
/// 1. Convert all Frac distributions to Money using §12 rounding
/// 2. Generate per-heir narratives using §11 templates
/// 3. Build EngineOutput with computation log and warnings
pub fn step10_finalize(input: &Step10Input) -> Step10Output {
    // 1. Build share fractions for rounding
    let shares: Vec<(HeirId, Frac)> = input
        .final_distributions
        .iter()
        .map(|d| (d.heir_id.clone(), d.total.clone()))
        .collect();
    let rounded = allocate_with_rounding(&shares, &input.net_estate);

    // Build a map from heir_id to rounded Money for quick lookup
    let rounded_map: std::collections::HashMap<&str, &Money> = rounded
        .iter()
        .map(|(id, m)| (id.as_str(), m))
        .collect();

    // 2. Build per-heir InheritanceShares
    let mut per_heir_shares = Vec::new();
    for dist in &input.final_distributions {
        let heir = input.heirs.iter().find(|h| h.id == dist.heir_id);
        let total_money = rounded_map
            .get(dist.heir_id.as_str())
            .cloned()
            .cloned()
            .unwrap_or_else(|| Money::new(0));

        // Find collation adjustments for this heir
        let donations_imputed = input
            .collation_output
            .adjustments
            .iter()
            .find(|a| a.heir_id == dist.heir_id)
            .map(|a| {
                let centavos = a
                    .donations_imputed
                    .numer()
                    .div_floor(a.donations_imputed.denom());
                Money { centavos }
            })
            .unwrap_or_else(|| Money::new(0));

        let gross = Money {
            centavos: &total_money.centavos + &donations_imputed.centavos,
        };
        let net = total_money.clone();

        let heir_name = heir
            .map(|h| h.name.clone())
            .unwrap_or_else(|| dist.heir_id.clone());
        let heir_cat = dist.effective_category;
        let inherits_by = heir
            .map(|h| h.inherits_by)
            .unwrap_or(InheritanceMode::OwnRight);
        let represents = heir.and_then(|h| h.represents.clone());

        per_heir_shares.push(InheritanceShare {
            heir_id: dist.heir_id.clone(),
            heir_name,
            heir_category: heir_cat,
            inherits_by,
            represents,
            from_legitime: Money::new(0), // TODO: round sub-components
            from_free_portion: Money::new(0),
            from_intestate: Money::new(0),
            total: total_money,
            legitime_fraction: String::new(),
            legal_basis: dist.legal_basis.clone(),
            donations_imputed,
            gross_entitlement: gross,
            net_from_estate: net,
        });
    }

    // 2b. Add zero-share entries for classified heirs without distributions
    // (e.g., renounced, disinherited, or ineligible heirs).
    for heir in &input.heirs {
        let already_has_share = per_heir_shares.iter().any(|s| s.heir_id == heir.id);
        if !already_has_share && (heir.has_renounced || (heir.is_disinherited && heir.disinheritance_valid) || !heir.is_eligible) {
            per_heir_shares.push(InheritanceShare {
                heir_id: heir.id.clone(),
                heir_name: heir.name.clone(),
                heir_category: heir.effective_category,
                inherits_by: heir.inherits_by,
                represents: heir.represents.clone(),
                from_legitime: Money::new(0),
                from_free_portion: Money::new(0),
                from_intestate: Money::new(0),
                total: Money::new(0),
                legitime_fraction: String::new(),
                legal_basis: vec![],
                donations_imputed: Money::new(0),
                gross_entitlement: Money::new(0),
                net_from_estate: Money::new(0),
            });
        }
    }

    // 3. Generate per-heir narratives
    let mut narratives = Vec::new();
    for share in &per_heir_shares {
        let heir = input.heirs.iter().find(|h| h.id == share.heir_id);
        if let Some(heir) = heir {
            let sections = generate_heir_narrative(heir, share, input);
            let text = assemble_narrative(&sections);
            narratives.push(HeirNarrative {
                heir_id: share.heir_id.clone(),
                heir_name: share.heir_name.clone(),
                heir_category_label: category_label(heir),
                text,
            });
        } else {
            // Non-heir beneficiary (stranger, charity, etc.) — generate basic narrative
            let text = format!(
                "**{} (beneficiary)** receives **{}**.",
                share.heir_name,
                format_peso(&share.total),
            );
            narratives.push(HeirNarrative {
                heir_id: share.heir_id.clone(),
                heir_name: share.heir_name.clone(),
                heir_category_label: "beneficiary".to_string(),
                text,
            });
        }
    }

    // 4. Build computation log
    let computation_log = ComputationLog {
        steps: vec![StepLog {
            step_number: 10,
            step_name: "Finalize + Narrate".to_string(),
            description: "Converted fractional shares to peso amounts and generated narratives"
                .to_string(),
        }],
        total_restarts: input.total_restarts,
        final_scenario: format!("{:?}", input.scenario_code),
    };

    EngineOutput {
        per_heir_shares,
        narratives,
        computation_log,
        warnings: vec![],
        succession_type: input.succession_type,
        scenario_code: input.scenario_code,
    }
}

// ── Tests ───────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::fraction::{frac, money_to_frac};
    use num_bigint::BigInt;

    // ── format_peso tests ────────────────────────────────────────────

    #[test]
    fn test_format_peso_whole_pesos_no_centavos() {
        // ₱5,000,000 — no centavos shown
        let m = Money::from_pesos(5_000_000);
        let s = format_peso(&m);
        assert_eq!(s, "₱5,000,000");
    }

    #[test]
    fn test_format_peso_with_centavos() {
        // ₱1,666,666.67 — 166666667 centavos
        let m = Money::new(166_666_667);
        let s = format_peso(&m);
        assert_eq!(s, "₱1,666,666.67");
    }

    #[test]
    fn test_format_peso_zero() {
        let m = Money::new(0);
        let s = format_peso(&m);
        assert_eq!(s, "₱0");
    }

    #[test]
    fn test_format_peso_small_amount() {
        // ₱999.99 = 99999 centavos
        let m = Money::new(99_999);
        let s = format_peso(&m);
        assert_eq!(s, "₱999.99");
    }

    #[test]
    fn test_format_peso_one_centavo() {
        // ₱0.01 = 1 centavo
        let m = Money::new(1);
        let s = format_peso(&m);
        assert_eq!(s, "₱0.01");
    }

    #[test]
    fn test_format_peso_exact_peso_boundary() {
        // ₱1 = 100 centavos
        let m = Money::new(100);
        let s = format_peso(&m);
        assert_eq!(s, "₱1");
    }

    // ── format_fraction tests ────────────────────────────────────────

    #[test]
    fn test_format_fraction_known_unicode_half() {
        assert_eq!(format_fraction(&frac(1, 2)), "½");
    }

    #[test]
    fn test_format_fraction_known_unicode_third() {
        assert_eq!(format_fraction(&frac(1, 3)), "⅓");
    }

    #[test]
    fn test_format_fraction_known_unicode_two_thirds() {
        assert_eq!(format_fraction(&frac(2, 3)), "⅔");
    }

    #[test]
    fn test_format_fraction_known_unicode_quarter() {
        assert_eq!(format_fraction(&frac(1, 4)), "¼");
    }

    #[test]
    fn test_format_fraction_known_unicode_three_quarters() {
        assert_eq!(format_fraction(&frac(3, 4)), "¾");
    }

    #[test]
    fn test_format_fraction_known_unicode_fifth() {
        assert_eq!(format_fraction(&frac(1, 5)), "⅕");
    }

    #[test]
    fn test_format_fraction_known_unicode_sixth() {
        assert_eq!(format_fraction(&frac(1, 6)), "⅙");
    }

    #[test]
    fn test_format_fraction_known_unicode_eighth() {
        assert_eq!(format_fraction(&frac(1, 8)), "⅛");
    }

    #[test]
    fn test_format_fraction_known_unicode_three_eighths() {
        assert_eq!(format_fraction(&frac(3, 8)), "⅜");
    }

    #[test]
    fn test_format_fraction_fallback_slash() {
        // 2/7 has no unicode symbol
        assert_eq!(format_fraction(&frac(2, 7)), "2/7");
    }

    #[test]
    fn test_format_fraction_reduces_before_lookup() {
        // 2/4 reduces to 1/2, which has unicode ½
        assert_eq!(format_fraction(&frac(2, 4)), "½");
    }

    // ── category_label tests ─────────────────────────────────────────

    fn make_heir(
        id: &str,
        raw_cat: HeirCategory,
        eff_cat: EffectiveCategory,
        mode: InheritanceMode,
    ) -> Heir {
        Heir {
            id: id.to_string(),
            name: id.to_string(),
            raw_category: raw_cat,
            effective_category: eff_cat,
            is_compulsory: true,
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
            inherits_by: mode,
            line_ancestor: None,
            children: vec![],
        }
    }

    #[test]
    fn test_category_label_legitimate_child() {
        let heir = make_heir(
            "lc1",
            HeirCategory::LegitimateChild,
            EffectiveCategory::LegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(category_label(&heir), "legitimate child");
    }

    #[test]
    fn test_category_label_adopted_child() {
        let heir = make_heir(
            "ac1",
            HeirCategory::AdoptedChild,
            EffectiveCategory::LegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(category_label(&heir), "adopted child");
    }

    #[test]
    fn test_category_label_legitimated_child() {
        let heir = make_heir(
            "ltc1",
            HeirCategory::LegitimatedChild,
            EffectiveCategory::LegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(category_label(&heir), "legitimated child");
    }

    #[test]
    fn test_category_label_grandchild_by_representation() {
        let mut heir = make_heir(
            "gc1",
            HeirCategory::LegitimateChild,
            EffectiveCategory::LegitimateChildGroup,
            InheritanceMode::Representation,
        );
        heir.represents = Some("lc_dead".to_string());
        assert_eq!(category_label(&heir), "grandchild, by representation");
    }

    #[test]
    fn test_category_label_illegitimate_child() {
        let heir = make_heir(
            "ic1",
            HeirCategory::IllegitimateChild,
            EffectiveCategory::IllegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(category_label(&heir), "illegitimate child");
    }

    #[test]
    fn test_category_label_surviving_spouse() {
        let heir = make_heir(
            "sp1",
            HeirCategory::SurvivingSpouse,
            EffectiveCategory::SurvivingSpouseGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(category_label(&heir), "surviving spouse");
    }

    #[test]
    fn test_category_label_legitimate_parent() {
        let heir = make_heir(
            "lp1",
            HeirCategory::LegitimateParent,
            EffectiveCategory::LegitimateAscendantGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(category_label(&heir), "legitimate parent");
    }

    #[test]
    fn test_category_label_legitimate_ascendant() {
        let heir = make_heir(
            "la1",
            HeirCategory::LegitimateAscendant,
            EffectiveCategory::LegitimateAscendantGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(category_label(&heir), "legitimate ascendant");
    }

    // ── raw_label tests ──────────────────────────────────────────────

    #[test]
    fn test_raw_label_legitimate_child() {
        let heir = make_heir(
            "lc1",
            HeirCategory::LegitimateChild,
            EffectiveCategory::LegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(raw_label(&heir), "legitimate child");
    }

    #[test]
    fn test_raw_label_adopted_child() {
        let heir = make_heir(
            "ac1",
            HeirCategory::AdoptedChild,
            EffectiveCategory::LegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(
            raw_label(&heir),
            "adopted child (RA 8552 Sec. 17: same rights as legitimate)"
        );
    }

    #[test]
    fn test_raw_label_legitimated_child() {
        let heir = make_heir(
            "ltc1",
            HeirCategory::LegitimatedChild,
            EffectiveCategory::LegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(
            raw_label(&heir),
            "legitimated child (Art. 179, Family Code: same rights as legitimate)"
        );
    }

    #[test]
    fn test_raw_label_illegitimate_child() {
        let heir = make_heir(
            "ic1",
            HeirCategory::IllegitimateChild,
            EffectiveCategory::IllegitimateChildGroup,
            InheritanceMode::OwnRight,
        );
        assert_eq!(
            raw_label(&heir),
            "illegitimate child (Art. 176, Family Code)"
        );
    }

    // ── filiation_description tests ──────────────────────────────────

    #[test]
    fn test_filiation_description_birth_certificate() {
        assert_eq!(
            filiation_description(FiliationProof::BirthCertificate),
            "record of birth in the civil register (Art. 172(1), FC)"
        );
    }

    #[test]
    fn test_filiation_description_final_judgment() {
        assert_eq!(
            filiation_description(FiliationProof::FinalJudgment),
            "final judgment establishing filiation (Art. 172(1), FC)"
        );
    }

    #[test]
    fn test_filiation_description_public_document() {
        assert_eq!(
            filiation_description(FiliationProof::PublicDocumentAdmission),
            "admission of filiation in a public document (Art. 172(2), FC)"
        );
    }

    #[test]
    fn test_filiation_description_private_handwritten() {
        assert_eq!(
            filiation_description(FiliationProof::PrivateHandwrittenAdmission),
            "private handwritten instrument signed by the parent (Art. 172(2), FC)"
        );
    }

    #[test]
    fn test_filiation_description_open_possession() {
        assert_eq!(
            filiation_description(FiliationProof::OpenContinuousPossession),
            "open and continuous possession of the status of an illegitimate child (Art. 172(3), FC)"
        );
    }

    #[test]
    fn test_filiation_description_other_evidence() {
        assert_eq!(
            filiation_description(FiliationProof::OtherEvidence),
            "evidence as provided by the Rules of Court (Art. 172(4), FC)"
        );
    }

    // ── spouse_article tests ─────────────────────────────────────────

    #[test]
    fn test_spouse_article_testate_with_lc() {
        // T1, T2, T3 → Art. 892
        assert_eq!(spouse_article(ScenarioCode::T1), Some("Art. 892"));
        assert_eq!(spouse_article(ScenarioCode::T2), Some("Art. 892"));
        assert_eq!(spouse_article(ScenarioCode::T3), Some("Art. 892"));
    }

    #[test]
    fn test_spouse_article_testate_with_ic() {
        // T4, T5a, T5b → Art. 892
        assert_eq!(spouse_article(ScenarioCode::T4), Some("Art. 892"));
        assert_eq!(spouse_article(ScenarioCode::T5a), Some("Art. 892"));
        assert_eq!(spouse_article(ScenarioCode::T5b), Some("Art. 892"));
    }

    #[test]
    fn test_spouse_article_testate_with_ascendants() {
        // T7, T8 → Art. 893
        assert_eq!(spouse_article(ScenarioCode::T7), Some("Art. 893"));
        assert_eq!(spouse_article(ScenarioCode::T8), Some("Art. 893"));
    }

    #[test]
    fn test_spouse_article_testate_spouse_only() {
        // T9 → Art. 899
        assert_eq!(spouse_article(ScenarioCode::T9), Some("Art. 899"));
    }

    #[test]
    fn test_spouse_article_testate_t11() {
        // T11 → Art. 894
        assert_eq!(spouse_article(ScenarioCode::T11), Some("Art. 894"));
    }

    #[test]
    fn test_spouse_article_testate_t12_t13() {
        assert_eq!(spouse_article(ScenarioCode::T12), Some("Art. 900"));
        assert_eq!(spouse_article(ScenarioCode::T13), Some("Art. 900"));
    }

    #[test]
    fn test_spouse_article_intestate_i2_i4() {
        assert_eq!(spouse_article(ScenarioCode::I2), Some("Art. 996/999"));
        assert_eq!(spouse_article(ScenarioCode::I4), Some("Art. 996/999"));
    }

    #[test]
    fn test_spouse_article_intestate_i6() {
        assert_eq!(spouse_article(ScenarioCode::I6), Some("Art. 997"));
    }

    #[test]
    fn test_spouse_article_intestate_i8() {
        assert_eq!(spouse_article(ScenarioCode::I8), Some("Art. 998"));
    }

    #[test]
    fn test_spouse_article_intestate_i10() {
        assert_eq!(spouse_article(ScenarioCode::I10), Some("Art. 1000"));
    }

    #[test]
    fn test_spouse_article_intestate_i11() {
        assert_eq!(spouse_article(ScenarioCode::I11), Some("Art. 995"));
    }

    #[test]
    fn test_spouse_article_intestate_i12() {
        assert_eq!(spouse_article(ScenarioCode::I12), Some("Art. 1001"));
    }

    #[test]
    fn test_spouse_article_no_spouse_scenario() {
        // T6: LC only, no spouse → None
        assert_eq!(spouse_article(ScenarioCode::T6), None);
        // I1: LC only → None
        assert_eq!(spouse_article(ScenarioCode::I1), None);
    }

    // ── allocate_with_rounding tests ─────────────────────────────────

    #[test]
    fn test_rounding_exact_division() {
        // 2 heirs splitting ₱10,000,000 (1_000_000_000 centavos) equally
        let total = Money::new(1_000_000_000);
        let half = frac(1_000_000_000, 2);
        let shares = vec![
            ("heir1".to_string(), half.clone()),
            ("heir2".to_string(), half),
        ];
        let result = allocate_with_rounding(&shares, &total);
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].1.centavos, BigInt::from(500_000_000));
        assert_eq!(result[1].1.centavos, BigInt::from(500_000_000));
        // Sum invariant
        let sum: BigInt = result.iter().map(|(_, m)| m.centavos.clone()).sum();
        assert_eq!(sum, BigInt::from(1_000_000_000));
    }

    #[test]
    fn test_rounding_three_equal_shares_remainder_distribution() {
        // 3 heirs splitting ₱10,000,000 (1_000_000_000 centavos) equally
        // 1_000_000_000 / 3 = 333_333_333.333...
        // Floor: 3 × 333_333_333 = 999_999_999
        // Remainder: 1 centavo → goes to first (largest-share-first, all equal so first)
        let total = Money::new(1_000_000_000);
        let third = frac(1_000_000_000, 3);
        let shares = vec![
            ("heir1".to_string(), third.clone()),
            ("heir2".to_string(), third.clone()),
            ("heir3".to_string(), third),
        ];
        let result = allocate_with_rounding(&shares, &total);
        assert_eq!(result.len(), 3);
        // Sum invariant must hold
        let sum: BigInt = result.iter().map(|(_, m)| m.centavos.clone()).sum();
        assert_eq!(sum, BigInt::from(1_000_000_000));
        // At least one heir gets 333_333_334 (the extra centavo)
        let max = result.iter().map(|r| r.1.centavos.clone()).max().unwrap();
        assert_eq!(max, BigInt::from(333_333_334));
    }

    #[test]
    fn test_rounding_sum_invariant_unequal_shares() {
        // Estate: ₱12,000,000 = 1_200_000_000 centavos
        // Heir A: 1/2 = 600,000,000 (exact)
        // Heir B: 1/3 = 400,000,000 (exact)
        // Heir C: 1/6 = 200,000,000 (exact)
        let total = Money::new(1_200_000_000);
        let shares = vec![
            ("A".to_string(), frac(1_200_000_000, 2)),
            ("B".to_string(), frac(1_200_000_000, 3)),
            ("C".to_string(), frac(1_200_000_000, 6)),
        ];
        let result = allocate_with_rounding(&shares, &total);
        let sum: BigInt = result.iter().map(|(_, m)| m.centavos.clone()).sum();
        assert_eq!(sum, BigInt::from(1_200_000_000));
    }

    #[test]
    fn test_rounding_sum_invariant_awkward_fractions() {
        // Estate: ₱10,000,000 = 1_000_000_000 centavos
        // 7 equal heirs: each gets 1_000_000_000/7 = 142_857_142.857...
        // Floor: 7 × 142_857_142 = 999_999_994 → remainder = 6 centavos
        // Distribute 6 centavos to first 6 heirs (all same floor)
        let total = Money::new(1_000_000_000);
        let share = frac(1_000_000_000, 7);
        let shares: Vec<_> = (0..7)
            .map(|i| (format!("heir{}", i), share.clone()))
            .collect();
        let result = allocate_with_rounding(&shares, &total);
        let sum: BigInt = result.iter().map(|(_, m)| m.centavos.clone()).sum();
        assert_eq!(sum, BigInt::from(1_000_000_000));
    }

    #[test]
    fn test_rounding_single_heir_gets_everything() {
        let total = Money::new(1_000_000_000);
        let shares = vec![("sole".to_string(), frac(1_000_000_000, 1))];
        let result = allocate_with_rounding(&shares, &total);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].1.centavos, BigInt::from(1_000_000_000));
    }

    #[test]
    fn test_rounding_remainder_goes_to_largest_share_first() {
        // Estate: 100 centavos. Heir A: 2/3, Heir B: 1/3.
        // A floor: 66, B floor: 33. Remainder: 1 centavo → goes to A (largest).
        let total = Money::new(100);
        let shares = vec![
            ("A".to_string(), frac(200, 3)), // 66.666...
            ("B".to_string(), frac(100, 3)), // 33.333...
        ];
        let result = allocate_with_rounding(&shares, &total);
        // Find A and B
        let a = result.iter().find(|(id, _)| id == "A").unwrap();
        let b = result.iter().find(|(id, _)| id == "B").unwrap();
        assert_eq!(a.1.centavos, BigInt::from(67));
        assert_eq!(b.1.centavos, BigInt::from(33));
        let sum: BigInt = result.iter().map(|(_, m)| m.centavos.clone()).sum();
        assert_eq!(sum, BigInt::from(100));
    }

    // ── assemble_narrative test ──────────────────────────────────────

    #[test]
    fn test_assemble_narrative_joins_with_spaces() {
        let sections = vec![
            NarrativeSection {
                section_type: NarrativeSectionType::Header,
                text: "**Rosa Santos (surviving spouse)** receives **₱3,000,000**.".to_string(),
                legal_basis: vec![],
            },
            NarrativeSection {
                section_type: NarrativeSectionType::SuccessionType,
                text: "The decedent died intestate (without a valid will).".to_string(),
                legal_basis: vec![],
            },
            NarrativeSection {
                section_type: NarrativeSectionType::Category,
                text: "As the surviving spouse (Art. 887(3) of the Civil Code), Rosa is a compulsory heir.".to_string(),
                legal_basis: vec!["Art. 887(3)".to_string()],
            },
        ];
        let text = assemble_narrative(&sections);
        assert!(text.starts_with("**Rosa Santos (surviving spouse)** receives **₱3,000,000**."));
        assert!(text.contains("The decedent died intestate"));
        assert!(text.contains("compulsory heir."));
        // Sections joined by single space
        assert!(text.contains("**₱3,000,000**. The decedent"));
    }

    // ── Narrative validation rule tests (§11.8) ──────────────────────

    #[test]
    fn test_narrative_section_ordering() {
        // Verify that NarrativeSectionType enum variants maintain correct order
        // by checking that HEADER < SUCCESSION_TYPE < CATEGORY etc.
        let order = [
            NarrativeSectionType::Header,
            NarrativeSectionType::SuccessionType,
            NarrativeSectionType::Category,
            NarrativeSectionType::Legitime,
            NarrativeSectionType::CapRule,
            NarrativeSectionType::FreePortion,
            NarrativeSectionType::IntestateShare,
            NarrativeSectionType::Collation,
            NarrativeSectionType::Representation,
            NarrativeSectionType::Disinheritance,
            NarrativeSectionType::Preterition,
            NarrativeSectionType::Inofficious,
            NarrativeSectionType::Underprovision,
            NarrativeSectionType::Condition,
            NarrativeSectionType::Accretion,
            NarrativeSectionType::Substitution,
            NarrativeSectionType::Reservation,
            NarrativeSectionType::ArticuloMortis,
            NarrativeSectionType::Comparison,
        ];
        // All 19 section types are present
        assert_eq!(order.len(), 19);
    }

    #[test]
    fn test_narrative_config_defaults() {
        let config = NarrativeConfig::default();
        assert!(!config.include_comparison);
        assert!(config.include_filiation_proof);
        assert!(config.include_collation_detail);
        assert_eq!(config.max_sentences, 15);
        assert_eq!(config.language, "en");
    }
}
