//! Step 1: Classify Heirs
//!
//! Determines each person's legal category, effective grouping, compulsory
//! status, and eligibility to participate in succession.
//!
//! Spec references: §4 (Heir Classification Rules)
//!   - §4.1 Compulsory Heir Categories (Art. 887)
//!   - §4.2 Mutual Exclusion
//!   - §4.3 Eligibility Gate
//!   - §4.4 Illegitimate Children — Filiation Proof (FC Art. 172, 176)

use crate::types::*;

// ── Input / Output types ────────────────────────────────────────────

/// Input to Step 1.
#[derive(Debug, Clone)]
pub struct Step1Input {
    pub decedent: Decedent,
    pub family_tree: Vec<Person>,
    pub disinheritances: Vec<Disinheritance>,
}

/// Output of Step 1 — classified heirs ready for line-building (Step 2).
#[derive(Debug, Clone)]
pub struct Step1Output {
    pub heirs: Vec<Heir>,
    pub warnings: Vec<ManualFlag>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Classify every person in the family tree into heirs with raw category,
/// effective category, compulsory status, and eligibility.
///
/// This is the main entry point for Step 1.
pub fn step1_classify(input: &Step1Input) -> Step1Output {
    let mut heirs = Vec::new();
    let warnings = Vec::new();

    // First pass: classify each person into an Heir
    for person in &input.family_tree {
        let raw_cat = match raw_category_from_relationship(person.relationship_to_decedent) {
            Some(cat) => cat,
            None => continue, // Not a compulsory heir (sibling, stranger, etc.)
        };

        let eff_cat = effective_category(raw_cat);
        let compulsory = is_compulsory_heir(raw_cat);
        let eligible = check_eligibility(person, raw_cat);

        // Check disinheritance status
        let disinheritance = input.disinheritances.iter().find(|d| {
            d.heir_reference.person_id.as_deref() == Some(person.id.as_str())
        });
        let is_disinherited = disinheritance.is_some();
        let disinheritance_valid_flag =
            disinheritance.map_or(false, |d| is_disinheritance_valid(d));

        // Check adoption validity
        let has_valid_adoption = is_adoption_valid(person);

        // Check articulo mortis (only relevant for surviving spouse)
        let am = if raw_cat == HeirCategory::SurvivingSpouse {
            is_articulo_mortis(&input.decedent)
        } else {
            false
        };

        heirs.push(Heir {
            id: person.id.clone(),
            name: person.name.clone(),
            raw_category: raw_cat,
            effective_category: eff_cat,
            is_compulsory: compulsory,
            is_alive: person.is_alive_at_succession,
            is_eligible: eligible,
            filiation_proved: person.filiation_proved,
            filiation_proof_type: person.filiation_proof_type,
            is_unworthy: person.is_unworthy,
            unworthiness_condoned: person.unworthiness_condoned,
            is_disinherited,
            disinheritance_valid: disinheritance_valid_flag,
            has_renounced: person.has_renounced,
            adoption: person.adoption.clone(),
            has_valid_adoption,
            is_stepparent_adoptee: person
                .adoption
                .as_ref()
                .map_or(false, |a| a.is_stepparent_adoption),
            legal_separation_guilty: person.is_guilty_party_in_legal_separation,
            articulo_mortis_marriage: am,
            degree_from_decedent: person.degree,
            line: person.line,
            blood_type: None,                  // Determined in Step 2
            representation_trigger: None,      // Determined in Step 2
            represented_by: vec![],
            represents: None,
            inherits_by: InheritanceMode::OwnRight,
            line_ancestor: None,
            children: person.children.clone(),
        });
    }

    // §4.2 Mutual Exclusion: If any alive LC-group heir exists,
    // all ascendants are excluded from compulsory succession.
    let has_lc_descendants = heirs.iter().any(|h| {
        h.effective_category == EffectiveCategory::LegitimateChildGroup && h.is_alive
    });

    if has_lc_descendants {
        for heir in &mut heirs {
            if heir.effective_category == EffectiveCategory::LegitimateAscendantGroup {
                heir.is_eligible = false;
            }
        }
    }

    Step1Output { heirs, warnings }
}

// ── Internal helpers ────────────────────────────────────────────────

/// Map a `Relationship` to a `HeirCategory` (raw classification).
/// Only compulsory heir relationships (Art. 887) produce a category.
/// Non-compulsory relationships (Sibling, Stranger, etc.) return None.
pub fn raw_category_from_relationship(rel: Relationship) -> Option<HeirCategory> {
    match rel {
        Relationship::LegitimateChild => Some(HeirCategory::LegitimateChild),
        Relationship::LegitimatedChild => Some(HeirCategory::LegitimatedChild),
        Relationship::AdoptedChild => Some(HeirCategory::AdoptedChild),
        Relationship::IllegitimateChild => Some(HeirCategory::IllegitimateChild),
        Relationship::SurvivingSpouse => Some(HeirCategory::SurvivingSpouse),
        Relationship::LegitimateParent => Some(HeirCategory::LegitimateParent),
        Relationship::LegitimateAscendant => Some(HeirCategory::LegitimateAscendant),
        Relationship::Sibling
        | Relationship::NephewNiece
        | Relationship::OtherCollateral
        | Relationship::Stranger => None,
    }
}

/// Map a `HeirCategory` to its `EffectiveCategory` per §4.1.
/// Legitimate, legitimated, and adopted children all map to LegitimateChildGroup.
pub fn effective_category(raw: HeirCategory) -> EffectiveCategory {
    match raw {
        HeirCategory::LegitimateChild
        | HeirCategory::LegitimatedChild
        | HeirCategory::AdoptedChild => EffectiveCategory::LegitimateChildGroup,
        HeirCategory::IllegitimateChild => EffectiveCategory::IllegitimateChildGroup,
        HeirCategory::SurvivingSpouse => EffectiveCategory::SurvivingSpouseGroup,
        HeirCategory::LegitimateParent
        | HeirCategory::LegitimateAscendant => EffectiveCategory::LegitimateAscendantGroup,
    }
}

/// Determine whether a raw category is a compulsory heir per Art. 887.
/// All 7 HeirCategory values are compulsory heirs.
pub fn is_compulsory_heir(_raw: HeirCategory) -> bool {
    true
}

/// Check eligibility of an heir per §4.3 eligibility gate.
/// Returns `true` if the heir is eligible to participate.
pub fn check_eligibility(person: &Person, category: HeirCategory) -> bool {
    // Art. 887 ¶3: illegitimate child must have filiation duly proved
    if category == HeirCategory::IllegitimateChild && !person.filiation_proved {
        return false;
    }

    // RA 8552 Sec. 20: rescinded adoption removes succession rights
    if category == HeirCategory::AdoptedChild {
        if let Some(ref adoption) = person.adoption {
            if adoption.is_rescinded {
                return false;
            }
        } else {
            // No adoption record for an adopted child — ineligible
            return false;
        }
    }

    // Art. 1002: guilty party in legal separation is excluded
    if category == HeirCategory::SurvivingSpouse && person.is_guilty_party_in_legal_separation {
        return false;
    }

    // Art. 1032: unworthy heir excluded, unless condoned (Art. 1033)
    if person.is_unworthy && !person.unworthiness_condoned {
        return false;
    }

    true
}

/// Check if a disinheritance is valid (cause specified + proved + no reconciliation).
pub fn is_disinheritance_valid(d: &Disinheritance) -> bool {
    d.cause_specified_in_will && d.cause_proven && !d.reconciliation_occurred
}

/// Determine whether an adopted child's adoption is valid (not rescinded).
pub fn is_adoption_valid(person: &Person) -> bool {
    match &person.adoption {
        Some(adoption) => !adoption.is_rescinded,
        None => false,
    }
}

/// Determine whether the articulo mortis reduction applies to the surviving spouse.
/// Art. 900 ¶2: ALL four conditions must be met:
///   1. Marriage solemnized in articulo mortis
///   2. Decedent was ill at time of marriage
///   3. Illness caused the death
///   4. Cohabitation < 5 years
pub fn is_articulo_mortis(decedent: &Decedent) -> bool {
    decedent.marriage_solemnized_in_articulo_mortis
        && decedent.was_ill_at_marriage
        && decedent.illness_caused_death
        && decedent.years_of_cohabitation < 5
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::*;

    // ── Helpers ─────────────────────────────────────────────────────

    fn make_person(id: &str, name: &str, rel: Relationship) -> Person {
        Person {
            id: id.to_string(),
            name: name.to_string(),
            is_alive_at_succession: true,
            relationship_to_decedent: rel,
            degree: 1,
            line: None,
            children: vec![],
            filiation_proved: true,
            filiation_proof_type: Some(FiliationProof::BirthCertificate),
            is_guilty_party_in_legal_separation: false,
            adoption: None,
            is_unworthy: false,
            unworthiness_condoned: false,
            has_renounced: false,
        }
    }

    fn make_decedent() -> Decedent {
        Decedent {
            id: "decedent".to_string(),
            name: "Juan dela Cruz".to_string(),
            date_of_death: "2026-01-01".to_string(),
            is_married: true,
            date_of_marriage: Some("2000-01-01".to_string()),
            marriage_solemnized_in_articulo_mortis: false,
            was_ill_at_marriage: false,
            illness_caused_death: false,
            years_of_cohabitation: 25,
            has_legal_separation: false,
            is_illegitimate: false,
        }
    }

    fn make_adopted_person(id: &str, name: &str) -> Person {
        let mut p = make_person(id, name, Relationship::AdoptedChild);
        p.adoption = Some(Adoption {
            decree_date: "2020-01-01".to_string(),
            regime: AdoptionRegime::Ra8552,
            adopter: "decedent".to_string(),
            adoptee: id.to_string(),
            is_stepparent_adoption: false,
            biological_parent_spouse: None,
            is_rescinded: false,
            rescission_date: None,
        });
        p
    }

    fn make_illegitimate_child(id: &str, name: &str) -> Person {
        let mut p = make_person(id, name, Relationship::IllegitimateChild);
        p.filiation_proved = true;
        p.filiation_proof_type = Some(FiliationProof::BirthCertificate);
        p
    }

    // ── §4.1: Raw → Effective category mapping ─────────────────────

    #[test]
    fn test_legitimate_child_maps_to_lc_group() {
        assert_eq!(
            effective_category(HeirCategory::LegitimateChild),
            EffectiveCategory::LegitimateChildGroup
        );
    }

    #[test]
    fn test_legitimated_child_maps_to_lc_group() {
        assert_eq!(
            effective_category(HeirCategory::LegitimatedChild),
            EffectiveCategory::LegitimateChildGroup
        );
    }

    #[test]
    fn test_adopted_child_maps_to_lc_group() {
        // RA 8552 Sec. 17: adopted = legitimate for ALL purposes
        assert_eq!(
            effective_category(HeirCategory::AdoptedChild),
            EffectiveCategory::LegitimateChildGroup
        );
    }

    #[test]
    fn test_illegitimate_child_maps_to_ic_group() {
        assert_eq!(
            effective_category(HeirCategory::IllegitimateChild),
            EffectiveCategory::IllegitimateChildGroup
        );
    }

    #[test]
    fn test_surviving_spouse_maps_to_spouse_group() {
        assert_eq!(
            effective_category(HeirCategory::SurvivingSpouse),
            EffectiveCategory::SurvivingSpouseGroup
        );
    }

    #[test]
    fn test_legitimate_parent_maps_to_ascendant_group() {
        assert_eq!(
            effective_category(HeirCategory::LegitimateParent),
            EffectiveCategory::LegitimateAscendantGroup
        );
    }

    #[test]
    fn test_legitimate_ascendant_maps_to_ascendant_group() {
        assert_eq!(
            effective_category(HeirCategory::LegitimateAscendant),
            EffectiveCategory::LegitimateAscendantGroup
        );
    }

    // ── §4.1: Relationship → HeirCategory mapping ──────────────────

    #[test]
    fn test_relationship_legitimate_child() {
        assert_eq!(
            raw_category_from_relationship(Relationship::LegitimateChild),
            Some(HeirCategory::LegitimateChild)
        );
    }

    #[test]
    fn test_relationship_adopted_child() {
        assert_eq!(
            raw_category_from_relationship(Relationship::AdoptedChild),
            Some(HeirCategory::AdoptedChild)
        );
    }

    #[test]
    fn test_relationship_illegitimate_child() {
        assert_eq!(
            raw_category_from_relationship(Relationship::IllegitimateChild),
            Some(HeirCategory::IllegitimateChild)
        );
    }

    #[test]
    fn test_relationship_surviving_spouse() {
        assert_eq!(
            raw_category_from_relationship(Relationship::SurvivingSpouse),
            Some(HeirCategory::SurvivingSpouse)
        );
    }

    #[test]
    fn test_relationship_stranger_not_compulsory() {
        // Strangers are NOT compulsory heirs — no HeirCategory
        assert_eq!(
            raw_category_from_relationship(Relationship::Stranger),
            None
        );
    }

    #[test]
    fn test_relationship_sibling_not_compulsory() {
        // Siblings are intestate heirs but NOT compulsory heirs
        assert_eq!(
            raw_category_from_relationship(Relationship::Sibling),
            None
        );
    }

    // ── §4.1: Compulsory heir check ────────────────────────────────

    #[test]
    fn test_all_heir_categories_are_compulsory() {
        // ALL 7 HeirCategory values are compulsory (Art. 887)
        assert!(is_compulsory_heir(HeirCategory::LegitimateChild));
        assert!(is_compulsory_heir(HeirCategory::LegitimatedChild));
        assert!(is_compulsory_heir(HeirCategory::AdoptedChild));
        assert!(is_compulsory_heir(HeirCategory::IllegitimateChild));
        assert!(is_compulsory_heir(HeirCategory::SurvivingSpouse));
        assert!(is_compulsory_heir(HeirCategory::LegitimateParent));
        assert!(is_compulsory_heir(HeirCategory::LegitimateAscendant));
    }

    // ── §4.3: Eligibility gate ─────────────────────────────────────

    #[test]
    fn test_eligible_legitimate_child() {
        let p = make_person("lc1", "Ana", Relationship::LegitimateChild);
        assert!(check_eligibility(&p, HeirCategory::LegitimateChild));
    }

    #[test]
    fn test_illegitimate_child_without_filiation_proof_ineligible() {
        // Art. 887 ¶3: filiation must be duly proved
        let mut p = make_illegitimate_child("ic1", "Carlo");
        p.filiation_proved = false;
        p.filiation_proof_type = None;
        assert!(!check_eligibility(&p, HeirCategory::IllegitimateChild));
    }

    #[test]
    fn test_illegitimate_child_with_filiation_proof_eligible() {
        let p = make_illegitimate_child("ic1", "Carlo");
        assert!(check_eligibility(&p, HeirCategory::IllegitimateChild));
    }

    #[test]
    fn test_adopted_child_rescinded_adoption_ineligible() {
        // RA 8552 Sec. 20: rescinded adoption removes rights
        let mut p = make_adopted_person("ac1", "Donna");
        if let Some(ref mut adoption) = p.adoption {
            adoption.is_rescinded = true;
            adoption.rescission_date = Some("2025-06-01".to_string());
        }
        assert!(!check_eligibility(&p, HeirCategory::AdoptedChild));
    }

    #[test]
    fn test_adopted_child_valid_adoption_eligible() {
        let p = make_adopted_person("ac1", "Donna");
        assert!(check_eligibility(&p, HeirCategory::AdoptedChild));
    }

    #[test]
    fn test_surviving_spouse_guilty_legal_separation_ineligible() {
        // Art. 1002: guilty spouse excluded
        let mut p = make_person("sp1", "Maria", Relationship::SurvivingSpouse);
        p.is_guilty_party_in_legal_separation = true;
        assert!(!check_eligibility(&p, HeirCategory::SurvivingSpouse));
    }

    #[test]
    fn test_surviving_spouse_not_guilty_eligible() {
        let p = make_person("sp1", "Maria", Relationship::SurvivingSpouse);
        assert!(check_eligibility(&p, HeirCategory::SurvivingSpouse));
    }

    #[test]
    fn test_unworthy_heir_ineligible() {
        // Art. 1032: unworthy heir excluded
        let mut p = make_person("lc1", "Pablo", Relationship::LegitimateChild);
        p.is_unworthy = true;
        p.unworthiness_condoned = false;
        assert!(!check_eligibility(&p, HeirCategory::LegitimateChild));
    }

    #[test]
    fn test_unworthy_heir_condoned_eligible() {
        // Art. 1033: condoned unworthiness restores eligibility
        let mut p = make_person("lc1", "Pablo", Relationship::LegitimateChild);
        p.is_unworthy = true;
        p.unworthiness_condoned = true;
        assert!(check_eligibility(&p, HeirCategory::LegitimateChild));
    }

    // ── §4.3: Adoption validity ────────────────────────────────────

    #[test]
    fn test_valid_adoption() {
        let p = make_adopted_person("ac1", "Donna");
        assert!(is_adoption_valid(&p));
    }

    #[test]
    fn test_rescinded_adoption_invalid() {
        let mut p = make_adopted_person("ac1", "Donna");
        if let Some(ref mut adoption) = p.adoption {
            adoption.is_rescinded = true;
        }
        assert!(!is_adoption_valid(&p));
    }

    #[test]
    fn test_no_adoption_record_invalid() {
        let p = make_person("lc1", "Ana", Relationship::LegitimateChild);
        assert!(!is_adoption_valid(&p));
    }

    // ── Disinheritance validity ────────────────────────────────────

    #[test]
    fn test_valid_disinheritance() {
        let d = Disinheritance {
            heir_reference: HeirReference {
                person_id: Some("lc1".to_string()),
                name: "Ana".to_string(),
                is_collective: false,
                class_designation: None,
            },
            cause_code: DisinheritanceCause::ChildAttemptOnLife,
            cause_specified_in_will: true,
            cause_proven: true,
            reconciliation_occurred: false,
        };
        assert!(is_disinheritance_valid(&d));
    }

    #[test]
    fn test_disinheritance_cause_not_specified_invalid() {
        let d = Disinheritance {
            heir_reference: HeirReference {
                person_id: Some("lc1".to_string()),
                name: "Ana".to_string(),
                is_collective: false,
                class_designation: None,
            },
            cause_code: DisinheritanceCause::ChildAttemptOnLife,
            cause_specified_in_will: false,
            cause_proven: true,
            reconciliation_occurred: false,
        };
        assert!(!is_disinheritance_valid(&d));
    }

    #[test]
    fn test_disinheritance_cause_not_proven_invalid() {
        let d = Disinheritance {
            heir_reference: HeirReference {
                person_id: Some("lc1".to_string()),
                name: "Ana".to_string(),
                is_collective: false,
                class_designation: None,
            },
            cause_code: DisinheritanceCause::ChildAttemptOnLife,
            cause_specified_in_will: true,
            cause_proven: false,
            reconciliation_occurred: false,
        };
        assert!(!is_disinheritance_valid(&d));
    }

    #[test]
    fn test_disinheritance_reconciled_invalid() {
        let d = Disinheritance {
            heir_reference: HeirReference {
                person_id: Some("lc1".to_string()),
                name: "Ana".to_string(),
                is_collective: false,
                class_designation: None,
            },
            cause_code: DisinheritanceCause::ChildAttemptOnLife,
            cause_specified_in_will: true,
            cause_proven: true,
            reconciliation_occurred: true,
        };
        assert!(!is_disinheritance_valid(&d));
    }

    // ── Articulo mortis ────────────────────────────────────────────

    #[test]
    fn test_articulo_mortis_all_conditions_met() {
        let d = Decedent {
            id: "d".to_string(),
            name: "Juan".to_string(),
            date_of_death: "2026-01-01".to_string(),
            is_married: true,
            date_of_marriage: Some("2025-06-01".to_string()),
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 2,
            has_legal_separation: false,
            is_illegitimate: false,
        };
        assert!(is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_cohabitation_over_5_years_not_triggered() {
        // Art. 900 ¶2: if cohabitation >= 5 years, AM reduction does NOT apply
        let d = Decedent {
            id: "d".to_string(),
            name: "Juan".to_string(),
            date_of_death: "2026-01-01".to_string(),
            is_married: true,
            date_of_marriage: Some("2020-01-01".to_string()),
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 6,
            has_legal_separation: false,
            is_illegitimate: false,
        };
        assert!(!is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_not_solemnized_in_am() {
        let d = Decedent {
            id: "d".to_string(),
            name: "Juan".to_string(),
            date_of_death: "2026-01-01".to_string(),
            is_married: true,
            date_of_marriage: Some("2025-06-01".to_string()),
            marriage_solemnized_in_articulo_mortis: false,
            was_ill_at_marriage: true,
            illness_caused_death: true,
            years_of_cohabitation: 2,
            has_legal_separation: false,
            is_illegitimate: false,
        };
        assert!(!is_articulo_mortis(&d));
    }

    #[test]
    fn test_articulo_mortis_illness_did_not_cause_death() {
        let d = Decedent {
            id: "d".to_string(),
            name: "Juan".to_string(),
            date_of_death: "2026-01-01".to_string(),
            is_married: true,
            date_of_marriage: Some("2025-06-01".to_string()),
            marriage_solemnized_in_articulo_mortis: true,
            was_ill_at_marriage: true,
            illness_caused_death: false,
            years_of_cohabitation: 2,
            has_legal_separation: false,
            is_illegitimate: false,
        };
        assert!(!is_articulo_mortis(&d));
    }

    // ── TV-09: Adopted child = legitimate (RA 8552) ────────────────

    #[test]
    fn test_tv09_adopted_child_same_effective_category_as_legitimate() {
        // TV-09: Adopted child must be in LegitimateChildGroup
        // RA 8552 Sec. 17: adopted = legitimate for ALL succession purposes
        let lc = make_person("lc1", "Bianca", Relationship::LegitimateChild);
        let ac = make_adopted_person("ac1", "Carlos");

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc, ac],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        assert_eq!(output.heirs.len(), 2);

        let lc_heir = output.heirs.iter().find(|h| h.id == "lc1").unwrap();
        let ac_heir = output.heirs.iter().find(|h| h.id == "ac1").unwrap();

        // Both must be in the same effective category
        assert_eq!(lc_heir.effective_category, ac_heir.effective_category);
        assert_eq!(
            ac_heir.effective_category,
            EffectiveCategory::LegitimateChildGroup
        );
        // Both must be compulsory
        assert!(lc_heir.is_compulsory);
        assert!(ac_heir.is_compulsory);
        // Both must be eligible
        assert!(lc_heir.is_eligible);
        assert!(ac_heir.is_eligible);
    }

    // ── TV-17: Filiation gate for illegitimate children ────────────

    #[test]
    fn test_tv17_filiation_gate_eligible_ic() {
        // TV-17: 3 illegitimate children with filiation proved
        let ic1 = make_illegitimate_child("ic1", "Carlo");
        let ic2 = make_illegitimate_child("ic2", "Dante");
        let ic3 = make_illegitimate_child("ic3", "Elena");

        let mut decedent = make_decedent();
        decedent.is_married = false;

        let input = Step1Input {
            decedent,
            family_tree: vec![ic1, ic2, ic3],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        assert_eq!(output.heirs.len(), 3);

        for heir in &output.heirs {
            assert_eq!(
                heir.effective_category,
                EffectiveCategory::IllegitimateChildGroup
            );
            assert!(heir.is_eligible);
            assert!(heir.is_compulsory);
            assert!(heir.filiation_proved);
        }
    }

    #[test]
    fn test_tv17_filiation_gate_one_ic_without_proof() {
        // One of 3 ICs lacks filiation proof — should be ineligible
        let ic1 = make_illegitimate_child("ic1", "Carlo");
        let ic2 = make_illegitimate_child("ic2", "Dante");
        let mut ic3 = make_illegitimate_child("ic3", "Elena");
        ic3.filiation_proved = false;
        ic3.filiation_proof_type = None;

        let mut decedent = make_decedent();
        decedent.is_married = false;

        let input = Step1Input {
            decedent,
            family_tree: vec![ic1, ic2, ic3],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        // All 3 should appear as heirs (classified), but Elena is ineligible
        assert_eq!(output.heirs.len(), 3);

        let elena = output.heirs.iter().find(|h| h.id == "ic3").unwrap();
        assert!(!elena.is_eligible);
        assert!(!elena.filiation_proved);

        // The other two should be eligible
        let carlo = output.heirs.iter().find(|h| h.id == "ic1").unwrap();
        let dante = output.heirs.iter().find(|h| h.id == "ic2").unwrap();
        assert!(carlo.is_eligible);
        assert!(dante.is_eligible);
    }

    // ── §4.2: Mutual exclusion — descendants exclude ascendants ────

    #[test]
    fn test_mutual_exclusion_descendants_present_ascendants_excluded() {
        // Art. 887(2): If any legitimate descendant survives,
        // ascendants are excluded from compulsory succession
        let lc = make_person("lc1", "Ana", Relationship::LegitimateChild);
        let parent = make_person("p1", "Pedro", Relationship::LegitimateParent);

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc, parent],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);

        let lc_heir = output.heirs.iter().find(|h| h.id == "lc1").unwrap();
        let parent_heir = output.heirs.iter().find(|h| h.id == "p1").unwrap();

        assert!(lc_heir.is_eligible);
        // Parent should be excluded (not eligible) due to mutual exclusion
        assert!(!parent_heir.is_eligible);
    }

    #[test]
    fn test_no_descendants_ascendants_not_excluded() {
        // When no descendants, ascendants participate
        let parent = make_person("p1", "Pedro", Relationship::LegitimateParent);
        let spouse = make_person("sp1", "Maria", Relationship::SurvivingSpouse);

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![parent, spouse],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);

        let parent_heir = output.heirs.iter().find(|h| h.id == "p1").unwrap();
        let spouse_heir = output.heirs.iter().find(|h| h.id == "sp1").unwrap();

        assert!(parent_heir.is_eligible);
        assert!(spouse_heir.is_eligible);
    }

    // ── Full classification: mixed heir types ──────────────────────

    #[test]
    fn test_full_classification_lc_ic_spouse() {
        let lc1 = make_person("lc1", "Ana", Relationship::LegitimateChild);
        let lc2 = make_person("lc2", "Belen", Relationship::LegitimateChild);
        let ic1 = make_illegitimate_child("ic1", "Carlo");
        let spouse = make_person("sp1", "Maria", Relationship::SurvivingSpouse);

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc1, lc2, ic1, spouse],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        assert_eq!(output.heirs.len(), 4);

        // Check effective categories
        let ana = output.heirs.iter().find(|h| h.id == "lc1").unwrap();
        let belen = output.heirs.iter().find(|h| h.id == "lc2").unwrap();
        let carlo = output.heirs.iter().find(|h| h.id == "ic1").unwrap();
        let maria = output.heirs.iter().find(|h| h.id == "sp1").unwrap();

        assert_eq!(
            ana.effective_category,
            EffectiveCategory::LegitimateChildGroup
        );
        assert_eq!(
            belen.effective_category,
            EffectiveCategory::LegitimateChildGroup
        );
        assert_eq!(
            carlo.effective_category,
            EffectiveCategory::IllegitimateChildGroup
        );
        assert_eq!(
            maria.effective_category,
            EffectiveCategory::SurvivingSpouseGroup
        );

        // All should be eligible and compulsory
        for heir in &output.heirs {
            assert!(heir.is_eligible);
            assert!(heir.is_compulsory);
        }
    }

    // ── Edge: Dead person should still be classified (for representation) ──

    #[test]
    fn test_dead_person_classified_but_not_alive() {
        let mut lc = make_person("lc1", "Ana", Relationship::LegitimateChild);
        lc.is_alive_at_succession = false;

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        assert_eq!(output.heirs.len(), 1);

        let heir = &output.heirs[0];
        assert!(!heir.is_alive);
        // Still has a classification
        assert_eq!(
            heir.effective_category,
            EffectiveCategory::LegitimateChildGroup
        );
    }

    // ── Edge: Disinheritance flags ─────────────────────────────────

    #[test]
    fn test_disinherited_heir_flagged() {
        let lc = make_person("lc1", "Ana", Relationship::LegitimateChild);

        let d = Disinheritance {
            heir_reference: HeirReference {
                person_id: Some("lc1".to_string()),
                name: "Ana".to_string(),
                is_collective: false,
                class_designation: None,
            },
            cause_code: DisinheritanceCause::ChildAttemptOnLife,
            cause_specified_in_will: true,
            cause_proven: true,
            reconciliation_occurred: false,
        };

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc],
            disinheritances: vec![d],
        };

        let output = step1_classify(&input);
        let heir = &output.heirs[0];

        assert!(heir.is_disinherited);
        assert!(heir.disinheritance_valid);
    }

    #[test]
    fn test_disinherited_heir_invalid_cause_flagged() {
        let lc = make_person("lc1", "Ana", Relationship::LegitimateChild);

        let d = Disinheritance {
            heir_reference: HeirReference {
                person_id: Some("lc1".to_string()),
                name: "Ana".to_string(),
                is_collective: false,
                class_designation: None,
            },
            cause_code: DisinheritanceCause::ChildAttemptOnLife,
            cause_specified_in_will: true,
            cause_proven: false, // NOT proven
            reconciliation_occurred: false,
        };

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc],
            disinheritances: vec![d],
        };

        let output = step1_classify(&input);
        let heir = &output.heirs[0];

        assert!(heir.is_disinherited);
        assert!(!heir.disinheritance_valid); // Invalid disinheritance
    }

    // ── Edge: Empty family tree ────────────────────────────────────

    #[test]
    fn test_empty_family_tree_produces_no_heirs() {
        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        assert!(output.heirs.is_empty());
    }

    // ── Edge: Legitimated child ────────────────────────────────────

    #[test]
    fn test_legitimated_child_same_as_legitimate() {
        // FC Art. 179: legitimated child has same rights as legitimate
        let lc = make_person("lc1", "Ana", Relationship::LegitimateChild);
        let mut ltc = make_person("ltc1", "Belen", Relationship::LegitimatedChild);
        ltc.relationship_to_decedent = Relationship::LegitimatedChild;

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc, ltc],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        let ana = output.heirs.iter().find(|h| h.id == "lc1").unwrap();
        let belen = output.heirs.iter().find(|h| h.id == "ltc1").unwrap();

        assert_eq!(ana.effective_category, belen.effective_category);
        assert_eq!(
            belen.effective_category,
            EffectiveCategory::LegitimateChildGroup
        );
    }

    // ── Edge: Renounced heir still classified (for Step 2 line building) ──

    #[test]
    fn test_renounced_heir_classified() {
        let mut lc = make_person("lc1", "Ana", Relationship::LegitimateChild);
        lc.has_renounced = true;

        let input = Step1Input {
            decedent: make_decedent(),
            family_tree: vec![lc],
            disinheritances: vec![],
        };

        let output = step1_classify(&input);
        assert_eq!(output.heirs.len(), 1);
        let heir = &output.heirs[0];
        assert!(heir.has_renounced);
        // Still classified even though renounced — Step 2 handles this
        assert_eq!(
            heir.effective_category,
            EffectiveCategory::LegitimateChildGroup
        );
    }
}
