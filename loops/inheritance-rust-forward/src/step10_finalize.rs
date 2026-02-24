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
use num_traits::{One, Zero};

use crate::fraction::{frac, frac_to_centavos, money_to_frac, Frac};
use crate::step5_legitimes::{FreePortion, HeirLegitime};
use crate::step6_validation::Step6Output;
use crate::step7_distribute::HeirDistribution;
use crate::step8_collation::{HeirCollationAdjustment, Step8Output};
use crate::step9_vacancy::{Step9Output, VacancyRecord};
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
    unimplemented!("step10: category_label")
}

/// Full label with legal basis for CATEGORY section (§11.6).
pub fn raw_label(heir: &Heir) -> String {
    unimplemented!("step10: raw_label")
}

/// Maps filiation proof to readable description with FC article (§11.6).
pub fn filiation_description(proof: FiliationProof) -> String {
    unimplemented!("step10: filiation_description")
}

/// Format a Money value as a peso string (§11.3).
/// ₱ prefix, comma thousands, centavos only when non-zero.
pub fn format_peso(amount: &Money) -> String {
    unimplemented!("step10: format_peso")
}

/// Format a fraction as Unicode symbol or slash notation (§11.6).
pub fn format_fraction(f: &Frac) -> String {
    unimplemented!("step10: format_fraction")
}

/// Maps scenario code to the article governing the spouse's share (§11.6).
pub fn spouse_article(scenario: ScenarioCode) -> Option<&'static str> {
    unimplemented!("step10: spouse_article")
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
    unimplemented!("step10: allocate_with_rounding")
}

// ── Narrative Generation (§11) ──────────────────────────────────────

/// Generate the narrative sections for a single heir (§11.1).
pub fn generate_heir_narrative(
    heir: &Heir,
    share: &InheritanceShare,
    input: &Step10Input,
) -> Vec<NarrativeSection> {
    unimplemented!("step10: generate_heir_narrative")
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
    unimplemented!("step10: step10_finalize")
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
