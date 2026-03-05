//! Full pipeline orchestrator.
//!
//! Runs Steps 1-10 in sequence, handling restarts when needed
//! (e.g., total renunciation triggers scenario re-evaluation).

use crate::fraction::money_to_frac;
use crate::step1_classify::{step1_classify, Step1Input};
use crate::step2_lines::{step2_build_lines, Step2Input};
use crate::step3_scenario::{step3_determine_scenario, Step3Input};
use crate::step4_estate_base::{step4_compute_estate_base, Step4Input};
use crate::step5_legitimes::{step5_compute_legitimes, Step5Input};
use crate::step6_validation::{step6_validate_will, Step6Input};
use crate::step7_distribute::{step7_distribute, Step7Input};
use crate::step8_collation::{step8_collation_adjustment, Step8Input};
use crate::step9_vacancy::{step9_resolve_vacancies, Step9Input, Step9Output};
use crate::step10_finalize::{step10_finalize, NarrativeConfig, Step10Input};
use crate::types::*;

/// Run the full pipeline (Steps 1-10) on an EngineInput, returning EngineOutput.
pub fn run_pipeline(input: &EngineInput) -> EngineOutput {
    let net_estate_frac = money_to_frac(&input.net_distributable_estate.centavos);

    // Step 1: Classify heirs
    let disinheritances = input
        .will
        .as_ref()
        .map(|w| w.disinheritances.clone())
        .unwrap_or_default();
    let step1 = step1_classify(&Step1Input {
        decedent: input.decedent.clone(),
        family_tree: input.family_tree.clone(),
        disinheritances,
    });

    // Step 2: Build lines
    let step2 = step2_build_lines(&Step2Input {
        heirs: step1.heirs.clone(),
    });

    // Step 3: Determine scenario
    let has_siblings_or_nephews = input.family_tree.iter().any(|p| {
        matches!(
            p.relationship_to_decedent,
            Relationship::Sibling | Relationship::NephewNiece
        ) && p.is_alive_at_succession
    });
    let has_other_collaterals = input.family_tree.iter().any(|p| {
        matches!(p.relationship_to_decedent, Relationship::OtherCollateral)
            && p.is_alive_at_succession
    });
    let step3 = step3_determine_scenario(&Step3Input {
        line_counts: step2.line_counts.clone(),
        has_will: input.will.is_some(),
        decedent: input.decedent.clone(),
        has_siblings_or_nephews,
        has_other_collaterals,
    });

    // Step 4: Compute estate base (collation)
    let step4 = step4_compute_estate_base(&Step4Input {
        net_estate: net_estate_frac.clone(),
        donations: input.donations.clone(),
        heirs: step2.heirs.clone(),
    });

    // Step 5: Compute legitimes
    let step5 = step5_compute_legitimes(&Step5Input {
        estate_base: step4.estate_base.clone(),
        scenario_code: step3.scenario_code,
        line_counts: step2.line_counts.clone(),
        heirs: step2.heirs.clone(),
        decedent: input.decedent.clone(),
    });

    // Step 6: Testate validation (only if will exists)
    let (step6, succession_type) = if let Some(ref will) = input.will {
        let s6 = step6_validate_will(&Step6Input {
            will: will.clone(),
            heirs: step2.heirs.clone(),
            heir_legitimes: step5.heir_legitimes.clone(),
            free_portion: step5.free_portion.clone(),
            estate_base: step4.estate_base.clone(),
            net_estate: net_estate_frac.clone(),
            donations: input.donations.clone(),
            scenario_code: step3.scenario_code,
        });
        let st = s6
            .succession_type_override
            .unwrap_or(step3.succession_type);
        (Some(s6), st)
    } else {
        (None, step3.succession_type)
    };

    // Step 7: Distribute
    let step7 = step7_distribute(&Step7Input {
        net_estate: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        heirs: step2.heirs.clone(),
        line_counts: step2.line_counts.clone(),
        scenario_code: step3.scenario_code,
        succession_type,
        heir_legitimes: step5.heir_legitimes.clone(),
        free_portion: step5.free_portion.clone(),
        validation: step6.clone(),
        will: input.will.clone(),
        donations: input.donations.clone(),
    });

    // Step 8: Collation adjustment
    let step8 = step8_collation_adjustment(&Step8Input {
        net_estate: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        distributions: step7.distributions.clone(),
        donation_results: step4.donation_results.clone(),
        donations: input.donations.clone(),
        heirs: step2.heirs.clone(),
    });

    // Step 9: Vacancy resolution
    let step9 = step9_resolve_vacancies(&Step9Input {
        net_estate: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        collation_output: step8.clone(),
        distributions: step7.distributions.clone(),
        heirs: step2.heirs.clone(),
        scenario_code: step3.scenario_code,
        succession_type: step7.final_succession_type,
        will: input.will.clone(),
        restart_count: 0,
        max_restarts: input.config.max_pipeline_restarts,
    });

    // Handle restart if needed (e.g., total renunciation)
    if step9.requires_restart {
        return run_pipeline_with_restart(input, &step9);
    }

    // Step 10: Finalize + narrate
    step10_finalize(&Step10Input {
        net_estate: input.net_distributable_estate.clone(),
        net_estate_frac: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        decedent: input.decedent.clone(),
        heirs: step2.heirs.clone(),
        heir_legitimes: step5.heir_legitimes.clone(),
        free_portion: step5.free_portion.clone(),
        validation: step6,
        final_distributions: step9.adjusted_distributions,
        collation_output: step8,
        vacancies: step9.vacancies,
        succession_type: step7.final_succession_type,
        scenario_code: step3.scenario_code,
        narrative_config: NarrativeConfig::default(),
        total_restarts: 0,
    })
}

/// Handle pipeline restart (e.g., total renunciation -> scenario re-evaluation).
fn run_pipeline_with_restart(input: &EngineInput, step9: &Step9Output) -> EngineOutput {
    let net_estate_frac = money_to_frac(&input.net_distributable_estate.centavos);

    let heirs_for_restart = step9.heirs.clone();

    let step2 = step2_build_lines(&Step2Input {
        heirs: heirs_for_restart,
    });

    let has_siblings_or_nephews = input.family_tree.iter().any(|p| {
        matches!(
            p.relationship_to_decedent,
            Relationship::Sibling | Relationship::NephewNiece
        ) && p.is_alive_at_succession
    });
    let has_other_collaterals = input.family_tree.iter().any(|p| {
        matches!(p.relationship_to_decedent, Relationship::OtherCollateral)
            && p.is_alive_at_succession
    });
    let step3 = step3_determine_scenario(&Step3Input {
        line_counts: step2.line_counts.clone(),
        has_will: input.will.is_some(),
        decedent: input.decedent.clone(),
        has_siblings_or_nephews,
        has_other_collaterals,
    });

    let step4 = step4_compute_estate_base(&Step4Input {
        net_estate: net_estate_frac.clone(),
        donations: input.donations.clone(),
        heirs: step2.heirs.clone(),
    });

    let step5 = step5_compute_legitimes(&Step5Input {
        estate_base: step4.estate_base.clone(),
        scenario_code: step3.scenario_code,
        line_counts: step2.line_counts.clone(),
        heirs: step2.heirs.clone(),
        decedent: input.decedent.clone(),
    });

    let step6 = None; // Restart cases are intestate
    let succession_type = step3.succession_type;

    let step7 = step7_distribute(&Step7Input {
        net_estate: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        heirs: step2.heirs.clone(),
        line_counts: step2.line_counts.clone(),
        scenario_code: step3.scenario_code,
        succession_type,
        heir_legitimes: step5.heir_legitimes.clone(),
        free_portion: step5.free_portion.clone(),
        validation: step6.clone(),
        will: input.will.clone(),
        donations: input.donations.clone(),
    });

    let step8 = step8_collation_adjustment(&Step8Input {
        net_estate: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        distributions: step7.distributions.clone(),
        donation_results: step4.donation_results.clone(),
        donations: input.donations.clone(),
        heirs: step2.heirs.clone(),
    });

    let step9b = step9_resolve_vacancies(&Step9Input {
        net_estate: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        collation_output: step8.clone(),
        distributions: step7.distributions.clone(),
        heirs: step2.heirs.clone(),
        scenario_code: step3.scenario_code,
        succession_type: step7.final_succession_type,
        will: input.will.clone(),
        restart_count: 1,
        max_restarts: input.config.max_pipeline_restarts,
    });

    step10_finalize(&Step10Input {
        net_estate: input.net_distributable_estate.clone(),
        net_estate_frac: net_estate_frac.clone(),
        estate_base: step4.estate_base.clone(),
        decedent: input.decedent.clone(),
        heirs: step2.heirs.clone(),
        heir_legitimes: step5.heir_legitimes.clone(),
        free_portion: step5.free_portion.clone(),
        validation: step6,
        final_distributions: step9b.adjusted_distributions,
        collation_output: step8,
        vacancies: step9b.vacancies,
        succession_type: step7.final_succession_type,
        scenario_code: step3.scenario_code,
        narrative_config: NarrativeConfig::default(),
        total_restarts: 1,
    })
}
