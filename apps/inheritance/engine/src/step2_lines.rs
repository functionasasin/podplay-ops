//! Step 2: Build Lines (Representation Analysis)
//!
//! Analyzes classified heirs to build inheritance lines, handling
//! representation for predeceased, disinherited, or unworthy heirs.
//!
//! Spec references: §5 (Representation, Arts. 970-977)
//!   - §5.1 Triggers (predecease, disinheritance, incapacity/unworthiness — NOT renunciation)
//!   - §5.2 Rules (per stirpes, lines not heads, no depth limit descending, collateral limit)
//!   - §5.3 Build Lines Algorithm

use crate::types::*;

// ── Types ───────────────────────────────────────────────────────────

/// A line of succession for distribution purposes.
/// Each line represents one "slot" in the inheritance division.
/// One living child = 1 line. One predeceased child with N grandchildren = 1 line.
#[derive(Debug, Clone)]
pub struct Line {
    /// The degree-1 heir who anchors this line (whether alive or represented).
    pub ancestor_heir_id: HeirId,
    /// Effective category of this line's ancestor.
    pub effective_category: EffectiveCategory,
    /// How inheritance flows: OwnRight (heir alive) or Representation (descendants step in).
    pub mode: InheritanceMode,
    /// Heir IDs that actually receive through this line.
    /// For OwnRight: `[ancestor_heir_id]`. For Representation: `[rep1, rep2, ...]`.
    pub participants: Vec<HeirId>,
}

/// Per-category line counts, used by Step 3 for scenario determination.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LineCounts {
    pub legitimate_child: usize,
    pub illegitimate_child: usize,
    pub surviving_spouse: usize,
    pub legitimate_ascendant: usize,
}

/// Input to Step 2.
#[derive(Debug, Clone)]
pub struct Step2Input {
    pub heirs: Vec<Heir>,
}

/// Output of Step 2 — lines built, heirs updated with representation info.
#[derive(Debug, Clone)]
pub struct Step2Output {
    pub lines: Vec<Line>,
    pub heirs: Vec<Heir>,
    pub line_counts: LineCounts,
    pub warnings: Vec<ManualFlag>,
}

// ── Public API ──────────────────────────────────────────────────────

/// Build inheritance lines from classified heirs.
///
/// For each primary heir (degree 1), determines whether they form a line
/// in their own right or are represented by their descendants.
/// Updates heir fields: `representation_trigger`, `represented_by`, `represents`,
/// `inherits_by`, `line_ancestor`.
pub fn step2_build_lines(input: &Step2Input) -> Step2Output {
    let mut heirs = input.heirs.clone();
    let warnings = Vec::new();

    // Phase 1: Identify degree-1 anchors and build lines (immutable pass)
    let anchor_ids: Vec<HeirId> = heirs
        .iter()
        .filter(|h| h.degree_from_decedent == 1)
        .map(|h| h.id.clone())
        .collect();

    // Build each line and collect results: (anchor_id, line, trigger)
    // Also collect extinct lines (trigger exists but no representatives) so we can
    // set representation_trigger on those heirs for downstream stages (Step 5).
    let mut line_results: Vec<(HeirId, Line, Option<RepresentationTrigger>)> = Vec::new();
    let mut extinct_triggers: Vec<(HeirId, RepresentationTrigger)> = Vec::new();

    for anchor_id in &anchor_ids {
        let anchor = heirs.iter().find(|h| h.id == *anchor_id).unwrap();
        let trigger = get_representation_trigger(anchor);
        match build_single_line(anchor, &heirs) {
            Some(line) => line_results.push((anchor_id.clone(), line, trigger)),
            None => {
                // Line is extinct. If a trigger exists, record it so downstream
                // stages know this heir had a trigger but no representatives.
                if let Some(t) = trigger {
                    extinct_triggers.push((anchor_id.clone(), t));
                }
            }
        }
    }

    // Phase 2: Update heir fields based on computed lines (mutable pass)
    let mut lines = Vec::new();

    for (anchor_id, line, trigger) in &line_results {
        match line.mode {
            InheritanceMode::OwnRight => {
                if let Some(heir) = heirs.iter_mut().find(|h| h.id == *anchor_id) {
                    heir.inherits_by = InheritanceMode::OwnRight;
                }
            }
            InheritanceMode::Representation => {
                // Update ancestor heir
                if let Some(ancestor) = heirs.iter_mut().find(|h| h.id == *anchor_id) {
                    ancestor.representation_trigger = *trigger;
                    ancestor.represented_by = line.participants.clone();
                }
                // Update each representative
                for rep_id in &line.participants {
                    if let Some(rep) = heirs.iter_mut().find(|h| h.id == *rep_id) {
                        rep.inherits_by = InheritanceMode::Representation;
                        rep.line_ancestor = Some(anchor_id.clone());
                        rep.represents = Some(anchor_id.clone());
                    }
                }
            }
        }
        lines.push(line.clone());
    }

    // Set representation_trigger on heirs with extinct lines so Step 5 can
    // detect them via has_extinct_line() and exclude them from legitime distribution.
    for (anchor_id, trigger) in &extinct_triggers {
        if let Some(heir) = heirs.iter_mut().find(|h| h.id == *anchor_id) {
            heir.representation_trigger = Some(*trigger);
            // represented_by stays empty — this is how Step 5 detects extinct lines
        }
    }

    // Phase 3: Compute per-category line counts
    let line_counts = LineCounts {
        legitimate_child: lines
            .iter()
            .filter(|l| l.effective_category == EffectiveCategory::LegitimateChildGroup)
            .count(),
        illegitimate_child: lines
            .iter()
            .filter(|l| l.effective_category == EffectiveCategory::IllegitimateChildGroup)
            .count(),
        surviving_spouse: lines
            .iter()
            .filter(|l| l.effective_category == EffectiveCategory::SurvivingSpouseGroup)
            .count(),
        legitimate_ascendant: lines
            .iter()
            .filter(|l| l.effective_category == EffectiveCategory::LegitimateAscendantGroup)
            .count(),
    };

    Step2Output {
        lines,
        heirs,
        line_counts,
        warnings,
    }
}

// ── Internal helpers ────────────────────────────────────────────────

/// Determine the representation trigger for an heir.
///
/// Priority:
/// 1. Not alive → Predecease
/// 2. Alive, validly disinherited → Disinheritance
/// 3. Alive, unworthy (not condoned) → Unworthiness
/// 4. Renounced → None (Art. 977: renunciation is NOT a representation trigger)
/// 5. Otherwise → None
pub fn get_representation_trigger(heir: &Heir) -> Option<RepresentationTrigger> {
    // Priority 1: Not alive → Predecease
    if !heir.is_alive {
        return Some(RepresentationTrigger::Predecease);
    }
    // Priority 2: Alive, validly disinherited → Disinheritance
    if heir.is_disinherited && heir.disinheritance_valid {
        return Some(RepresentationTrigger::Disinheritance);
    }
    // Priority 3: Alive, unworthy (not condoned) → Unworthiness
    if heir.is_unworthy && !heir.unworthiness_condoned {
        return Some(RepresentationTrigger::Unworthiness);
    }
    // Priority 4: Renounced → None (Art. 977: renunciation is NOT a trigger)
    // Priority 5: Otherwise → None
    None
}

/// Build a single inheritance line for the given anchor heir.
///
/// - If anchor is alive + eligible + not renounced → OwnRight line
/// - If anchor has a representation trigger → find representatives recursively
/// - If renounced or no trigger → None (extinct line)
fn build_single_line(anchor: &Heir, all_heirs: &[Heir]) -> Option<Line> {
    // Check representation trigger FIRST — a disinherited heir is alive/eligible
    // but should not get OwnRight; their descendants represent them.
    let trigger = get_representation_trigger(anchor);

    if let Some(_trigger) = trigger {
        // Heir has a representation trigger — find living descendants
        let reps = find_representatives_recursive(anchor, all_heirs);
        if reps.is_empty() {
            return None; // Line extinct — no living representatives
        }
        return Some(Line {
            ancestor_heir_id: anchor.id.clone(),
            effective_category: anchor.effective_category,
            mode: InheritanceMode::Representation,
            participants: reps,
        });
    }

    // No trigger — check if heir can inherit in own right
    if anchor.is_alive && anchor.is_eligible && !anchor.has_renounced {
        return Some(Line {
            ancestor_heir_id: anchor.id.clone(),
            effective_category: anchor.effective_category,
            mode: InheritanceMode::OwnRight,
            participants: vec![anchor.id.clone()],
        });
    }

    None // Line extinct (e.g., renounced with no trigger, or ineligible)
}

/// Recursively find living, eligible representatives for a triggered heir.
///
/// Traverses the heir's `children` list. For each child:
/// - Alive + eligible + not renounced → representative
/// - Has a representation trigger → recurse into their children
/// - Renounced → excluded (Art. 977), no representation for them
fn find_representatives_recursive(heir: &Heir, all_heirs: &[Heir]) -> Vec<HeirId> {
    let mut reps = Vec::new();

    for child_id in &heir.children {
        let child = match all_heirs.iter().find(|h| h.id == *child_id) {
            Some(c) => c,
            None => continue, // child not in heir list
        };

        // Art. 977: Renounced children are excluded entirely — no representation
        if child.has_renounced {
            continue;
        }

        let trigger = get_representation_trigger(child);

        if trigger.is_none() {
            // No trigger: child is alive, not disinherited, not unworthy
            // They can serve as a representative if eligible
            if child.is_alive && child.is_eligible {
                reps.push(child.id.clone());
            }
        } else {
            // Child has a trigger (dead, disinherited, unworthy) → recurse deeper
            let child_reps = find_representatives_recursive(child, all_heirs);
            reps.extend(child_reps);
        }
    }

    reps
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;

    // ── Helpers ─────────────────────────────────────────────────────

    fn make_heir(id: &str, name: &str, eff_cat: EffectiveCategory, degree: i32) -> Heir {
        let raw_cat = match eff_cat {
            EffectiveCategory::LegitimateChildGroup => HeirCategory::LegitimateChild,
            EffectiveCategory::IllegitimateChildGroup => HeirCategory::IllegitimateChild,
            EffectiveCategory::SurvivingSpouseGroup => HeirCategory::SurvivingSpouse,
            EffectiveCategory::LegitimateAscendantGroup => HeirCategory::LegitimateParent,
            EffectiveCategory::CollateralGroup => HeirCategory::Sibling,
        };
        Heir {
            id: id.to_string(),
            name: name.to_string(),
            raw_category: raw_cat,
            effective_category: eff_cat,
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
            degree_from_decedent: degree,
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

    /// Shorthand: degree-1 legitimate child.
    fn make_lc(id: &str, name: &str) -> Heir {
        make_heir(id, name, EffectiveCategory::LegitimateChildGroup, 1)
    }

    /// Shorthand: degree-2 grandchild (legitimate child group).
    fn make_gc(id: &str, name: &str) -> Heir {
        make_heir(id, name, EffectiveCategory::LegitimateChildGroup, 2)
    }

    /// Shorthand: degree-3 great-grandchild (legitimate child group).
    fn make_ggc(id: &str, name: &str) -> Heir {
        make_heir(id, name, EffectiveCategory::LegitimateChildGroup, 3)
    }

    /// Shorthand: degree-1 illegitimate child.
    fn make_ic(id: &str, name: &str) -> Heir {
        make_heir(id, name, EffectiveCategory::IllegitimateChildGroup, 1)
    }

    /// Shorthand: degree-2 grandchild of illegitimate child.
    fn make_ic_gc(id: &str, name: &str) -> Heir {
        make_heir(id, name, EffectiveCategory::IllegitimateChildGroup, 2)
    }

    /// Shorthand: surviving spouse.
    fn make_ss(id: &str, name: &str) -> Heir {
        make_heir(id, name, EffectiveCategory::SurvivingSpouseGroup, 1)
    }

    /// Shorthand: legitimate parent (ascendant).
    fn make_parent(id: &str, name: &str) -> Heir {
        make_heir(id, name, EffectiveCategory::LegitimateAscendantGroup, 1)
    }

    // ── Modifier functions ──────────────────────────────────────────

    fn dead(mut heir: Heir) -> Heir {
        heir.is_alive = false;
        heir
    }

    fn renounced(mut heir: Heir) -> Heir {
        heir.has_renounced = true;
        heir
    }

    fn disinherited_valid(mut heir: Heir) -> Heir {
        heir.is_disinherited = true;
        heir.disinheritance_valid = true;
        heir
    }

    fn unworthy_uncondoned(mut heir: Heir) -> Heir {
        heir.is_unworthy = true;
        heir.unworthiness_condoned = false;
        heir.is_eligible = false; // Step 1 marks unworthy as ineligible
        heir
    }

    fn with_children(mut heir: Heir, child_ids: &[&str]) -> Heir {
        heir.children = child_ids.iter().map(|s| s.to_string()).collect();
        heir
    }

    #[allow(dead_code)]
    fn ineligible(mut heir: Heir) -> Heir {
        heir.is_eligible = false;
        heir
    }

    // ── §5.1: Representation trigger determination ──────────────────

    #[test]
    fn test_representation_trigger_predecease() {
        // Dead heir → trigger = Predecease
        let heir = dead(make_lc("lc1", "Ana"));
        assert_eq!(
            get_representation_trigger(&heir),
            Some(RepresentationTrigger::Predecease)
        );
    }

    #[test]
    fn test_representation_trigger_disinheritance() {
        // Alive, validly disinherited → trigger = Disinheritance
        let heir = disinherited_valid(make_lc("lc1", "Ana"));
        assert_eq!(
            get_representation_trigger(&heir),
            Some(RepresentationTrigger::Disinheritance)
        );
    }

    #[test]
    fn test_representation_trigger_unworthiness() {
        // Alive, unworthy (not condoned) → trigger = Unworthiness
        let heir = unworthy_uncondoned(make_lc("lc1", "Ana"));
        assert_eq!(
            get_representation_trigger(&heir),
            Some(RepresentationTrigger::Unworthiness)
        );
    }

    #[test]
    fn test_representation_trigger_renounced_returns_none() {
        // Art. 977: Renunciation is NOT a representation trigger
        let heir = renounced(make_lc("lc1", "Ana"));
        assert_eq!(get_representation_trigger(&heir), None);
    }

    #[test]
    fn test_representation_trigger_alive_eligible_returns_none() {
        // Alive + eligible + not renounced → no trigger (inherits in own right)
        let heir = make_lc("lc1", "Ana");
        assert_eq!(get_representation_trigger(&heir), None);
    }

    #[test]
    fn test_representation_trigger_dead_takes_priority_over_disinheritance() {
        // Dead AND disinherited → Predecease takes priority
        let heir = disinherited_valid(dead(make_lc("lc1", "Ana")));
        assert_eq!(
            get_representation_trigger(&heir),
            Some(RepresentationTrigger::Predecease)
        );
    }

    // ── §5.3: Build lines — OWN_RIGHT (all alive) ──────────────────

    #[test]
    fn test_all_alive_lc_own_right_lines() {
        // 3 alive LC heirs → 3 OWN_RIGHT lines
        let input = Step2Input {
            heirs: vec![
                make_lc("lc1", "Ana"),
                make_lc("lc2", "Belen"),
                make_lc("lc3", "Carlos"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 3);
        for line in &output.lines {
            assert_eq!(line.mode, InheritanceMode::OwnRight);
            assert_eq!(
                line.effective_category,
                EffectiveCategory::LegitimateChildGroup
            );
            assert_eq!(line.participants.len(), 1);
        }
        assert_eq!(output.line_counts.legitimate_child, 3);
    }

    #[test]
    fn test_single_alive_lc_one_line() {
        let input = Step2Input {
            heirs: vec![make_lc("lc1", "Ana")],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        assert_eq!(output.lines[0].mode, InheritanceMode::OwnRight);
        assert_eq!(output.lines[0].participants, vec!["lc1"]);
        assert_eq!(output.lines[0].ancestor_heir_id, "lc1");
        assert_eq!(output.line_counts.legitimate_child, 1);
    }

    // ── §5.3: Representation — predeceased heir with descendants ────

    #[test]
    fn test_predeceased_lc_with_grandchildren_representation() {
        // 1 predeceased LC with 2 grandchildren → REPRESENTATION line with 2 participants
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_lc("lc1", "Ana")), &["gc1", "gc2"]),
                make_gc("gc1", "Dina"),
                make_gc("gc2", "Elena"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(line.ancestor_heir_id, "lc1");
        assert_eq!(line.participants.len(), 2);
        assert!(line.participants.contains(&"gc1".to_string()));
        assert!(line.participants.contains(&"gc2".to_string()));
        assert_eq!(output.line_counts.legitimate_child, 1);
    }

    #[test]
    fn test_predeceased_lc_no_descendants_extinct() {
        // Predeceased LC with no children → line is extinct (no line produced)
        let input = Step2Input {
            heirs: vec![dead(make_lc("lc1", "Ana"))],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 0);
        assert_eq!(output.line_counts.legitimate_child, 0);
    }

    // ── §5.1: Renunciation does NOT trigger representation (Art. 977) ──

    #[test]
    fn test_renounced_heir_no_representation() {
        // Art. 977: Renounced heir cannot be represented; line extinct
        let input = Step2Input {
            heirs: vec![
                with_children(renounced(make_lc("lc1", "Ana")), &["gc1", "gc2"]),
                make_gc("gc1", "Dina"),
                make_gc("gc2", "Elena"),
            ],
        };
        let output = step2_build_lines(&input);

        // lc1's line should be extinct — renunciation blocks representation
        let lc1_lines: Vec<&Line> = output
            .lines
            .iter()
            .filter(|l| l.ancestor_heir_id == "lc1")
            .collect();
        assert!(lc1_lines.is_empty());
    }

    // ── §5.1: Disinheritance triggers representation ────────────────

    #[test]
    fn test_disinherited_heir_descendants_represent() {
        // Validly disinherited LC with 2 children → children represent
        let input = Step2Input {
            heirs: vec![
                with_children(disinherited_valid(make_lc("lc1", "Ana")), &["gc1", "gc2"]),
                make_gc("gc1", "Dina"),
                make_gc("gc2", "Elena"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(line.ancestor_heir_id, "lc1");
        assert_eq!(line.participants.len(), 2);
    }

    // ── §5.1: Unworthiness triggers representation ──────────────────

    #[test]
    fn test_unworthy_heir_descendants_represent() {
        // Unworthy (not condoned) LC with children → children represent
        let input = Step2Input {
            heirs: vec![
                with_children(
                    unworthy_uncondoned(make_lc("lc1", "Ana")),
                    &["gc1"],
                ),
                make_gc("gc1", "Dina"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(line.ancestor_heir_id, "lc1");
        assert_eq!(line.participants, vec!["gc1"]);
    }

    // ── §5.2: No depth limit — deep representation (Art. 982) ──────

    #[test]
    fn test_deep_representation_three_levels() {
        // Child predeceased → grandchild also predeceased → great-grandchild represents
        // Art. 982: no depth limit in direct descending line
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_lc("lc1", "Ana")), &["gc1"]),
                with_children(dead(make_gc("gc1", "Belen")), &["ggc1"]),
                make_ggc("ggc1", "Carlos"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(line.ancestor_heir_id, "lc1");
        // Only the great-grandchild (alive leaf) is a participant
        assert_eq!(line.participants, vec!["ggc1"]);
        assert_eq!(output.line_counts.legitimate_child, 1);
    }

    // ── Mixed alive and represented lines ───────────────────────────

    #[test]
    fn test_mixed_alive_and_represented_lines() {
        // 2 alive LC + 1 predeceased LC with 2 grandchildren → 3 lines
        let input = Step2Input {
            heirs: vec![
                make_lc("lc1", "Ana"),
                make_lc("lc2", "Belen"),
                with_children(dead(make_lc("lc3", "Carlos")), &["gc1", "gc2"]),
                make_gc("gc1", "Dina"),
                make_gc("gc2", "Elena"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 3);
        assert_eq!(output.line_counts.legitimate_child, 3);

        let own_right_lines: Vec<&Line> = output
            .lines
            .iter()
            .filter(|l| l.mode == InheritanceMode::OwnRight)
            .collect();
        assert_eq!(own_right_lines.len(), 2);

        let rep_lines: Vec<&Line> = output
            .lines
            .iter()
            .filter(|l| l.mode == InheritanceMode::Representation)
            .collect();
        assert_eq!(rep_lines.len(), 1);
        assert_eq!(rep_lines[0].ancestor_heir_id, "lc3");
        assert_eq!(rep_lines[0].participants.len(), 2);
    }

    // ── Surviving spouse ────────────────────────────────────────────

    #[test]
    fn test_spouse_own_right_line() {
        // Alive spouse → 1 OWN_RIGHT line
        let input = Step2Input {
            heirs: vec![make_ss("sp1", "Maria")],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        assert_eq!(output.lines[0].mode, InheritanceMode::OwnRight);
        assert_eq!(
            output.lines[0].effective_category,
            EffectiveCategory::SurvivingSpouseGroup
        );
        assert_eq!(output.line_counts.surviving_spouse, 1);
    }

    #[test]
    fn test_dead_spouse_no_line() {
        // Dead spouse → no line (spouse has no representation)
        let input = Step2Input {
            heirs: vec![dead(make_ss("sp1", "Maria"))],
        };
        let output = step2_build_lines(&input);

        let spouse_lines: Vec<&Line> = output
            .lines
            .iter()
            .filter(|l| l.effective_category == EffectiveCategory::SurvivingSpouseGroup)
            .collect();
        assert!(spouse_lines.is_empty());
        assert_eq!(output.line_counts.surviving_spouse, 0);
    }

    // ── Ascendants ──────────────────────────────────────────────────

    #[test]
    fn test_ascendant_own_right_line() {
        // Surviving parent → 1 OWN_RIGHT line
        let input = Step2Input {
            heirs: vec![make_parent("p1", "Pedro")],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        assert_eq!(output.lines[0].mode, InheritanceMode::OwnRight);
        assert_eq!(
            output.lines[0].effective_category,
            EffectiveCategory::LegitimateAscendantGroup
        );
        assert_eq!(output.line_counts.legitimate_ascendant, 1);
    }

    // ── Line counts ─────────────────────────────────────────────────

    #[test]
    fn test_line_counts_all_categories() {
        // 2 LC + 1 IC + spouse + 1 parent → counts should match
        let input = Step2Input {
            heirs: vec![
                make_lc("lc1", "Ana"),
                make_lc("lc2", "Belen"),
                make_ic("ic1", "Carlo"),
                make_ss("sp1", "Maria"),
                make_parent("p1", "Pedro"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(
            output.line_counts,
            LineCounts {
                legitimate_child: 2,
                illegitimate_child: 1,
                surviving_spouse: 1,
                legitimate_ascendant: 1,
            }
        );
    }

    // ── Heir field updates ──────────────────────────────────────────

    #[test]
    fn test_heir_fields_updated_own_right() {
        // Alive LC heir → inherits_by = OwnRight, no line_ancestor, no represents
        let input = Step2Input {
            heirs: vec![make_lc("lc1", "Ana")],
        };
        let output = step2_build_lines(&input);

        let heir = output.heirs.iter().find(|h| h.id == "lc1").unwrap();
        assert_eq!(heir.inherits_by, InheritanceMode::OwnRight);
        assert!(heir.represents.is_none());
        assert!(heir.line_ancestor.is_none());
        assert!(heir.represented_by.is_empty());
    }

    #[test]
    fn test_heir_fields_updated_representation() {
        // Predeceased LC with grandchildren → grandchildren have representation fields set
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_lc("lc1", "Ana")), &["gc1", "gc2"]),
                make_gc("gc1", "Dina"),
                make_gc("gc2", "Elena"),
            ],
        };
        let output = step2_build_lines(&input);

        // The ancestor should have represented_by set
        let ancestor = output.heirs.iter().find(|h| h.id == "lc1").unwrap();
        assert!(ancestor.represented_by.contains(&"gc1".to_string()));
        assert!(ancestor.represented_by.contains(&"gc2".to_string()));
        assert_eq!(
            ancestor.representation_trigger,
            Some(RepresentationTrigger::Predecease)
        );

        // Each grandchild should have inherits_by = Representation
        for gc_id in &["gc1", "gc2"] {
            let gc = output
                .heirs
                .iter()
                .find(|h| h.id == *gc_id)
                .unwrap();
            assert_eq!(gc.inherits_by, InheritanceMode::Representation);
            assert_eq!(gc.line_ancestor, Some("lc1".to_string()));
        }
    }

    // ── TV-10: Representation per stirpes (I2 scenario) ─────────────

    #[test]
    fn test_tv10_predeceased_child_three_grandchildren_per_stirpes() {
        // TV-10: I2 scenario — 2 alive LC + 1 predeceased LC with 3 grandchildren
        // + surviving spouse
        // Lines: 3 LC lines (2 own-right + 1 representation) + 1 SS line = 4 total
        let input = Step2Input {
            heirs: vec![
                make_lc("lc1", "Ana"),
                make_lc("lc2", "Belen"),
                with_children(dead(make_lc("lc3", "Carlos")), &["gc1", "gc2", "gc3"]),
                make_gc("gc1", "Dina"),
                make_gc("gc2", "Elena"),
                make_gc("gc3", "Fiona"),
                make_ss("sp1", "Maria"),
            ],
        };
        let output = step2_build_lines(&input);

        // 3 LC lines + 1 SS line = 4 lines total
        assert_eq!(output.lines.len(), 4);
        assert_eq!(output.line_counts.legitimate_child, 3);
        assert_eq!(output.line_counts.surviving_spouse, 1);

        // The representation line for lc3 should have 3 participants
        let rep_line = output
            .lines
            .iter()
            .find(|l| l.ancestor_heir_id == "lc3")
            .unwrap();
        assert_eq!(rep_line.mode, InheritanceMode::Representation);
        assert_eq!(rep_line.participants.len(), 3);
        assert!(rep_line.participants.contains(&"gc1".to_string()));
        assert!(rep_line.participants.contains(&"gc2".to_string()));
        assert!(rep_line.participants.contains(&"gc3".to_string()));

        // §14.2 Invariant 5: sum of representatives = line ancestor's share
        // (This invariant is verified at distribution time, but the line structure
        // supports it: 3 representatives will split lc3's share per stirpes)
    }

    // ── TV-08: Disinheritance + representation (T3 scenario) ────────

    #[test]
    fn test_tv08_disinheritance_plus_representation() {
        // TV-08: T3 scenario — E=₱16M, 3 LC lines + spouse
        // One LC is validly disinherited; their descendants represent them.
        // The disinherited heir gets ₱0 but the line survives through descendants.
        let input = Step2Input {
            heirs: vec![
                make_lc("lc1", "Ana"),   // alive, own right
                make_lc("lc2", "Belen"), // alive, own right
                with_children(
                    disinherited_valid(make_lc("lc3", "Carlos")),
                    &["gc1", "gc2"],
                ),
                make_gc("gc1", "Dina"),
                make_gc("gc2", "Elena"),
                make_ss("sp1", "Maria"),
            ],
        };
        let output = step2_build_lines(&input);

        // 3 LC lines + 1 SS line = 4 total
        assert_eq!(output.lines.len(), 4);
        assert_eq!(output.line_counts.legitimate_child, 3);
        assert_eq!(output.line_counts.surviving_spouse, 1);

        // lc3's line survives through representation (despite disinheritance)
        let rep_line = output
            .lines
            .iter()
            .find(|l| l.ancestor_heir_id == "lc3")
            .unwrap();
        assert_eq!(rep_line.mode, InheritanceMode::Representation);
        assert_eq!(rep_line.participants.len(), 2);

        // The disinherited heir should have representation_trigger = Disinheritance
        let lc3 = output.heirs.iter().find(|h| h.id == "lc3").unwrap();
        assert_eq!(
            lc3.representation_trigger,
            Some(RepresentationTrigger::Disinheritance)
        );
    }

    // ── Art. 902: Illegitimate child can be represented ─────────────

    #[test]
    fn test_illegitimate_child_can_be_represented() {
        // Art. 902: predeceased IC with descendants → REPRESENTATION line
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_ic("ic1", "Carlo")), &["ic_gc1", "ic_gc2"]),
                make_ic_gc("ic_gc1", "Dina"),
                make_ic_gc("ic_gc2", "Elena"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(
            line.effective_category,
            EffectiveCategory::IllegitimateChildGroup
        );
        assert_eq!(line.ancestor_heir_id, "ic1");
        assert_eq!(line.participants.len(), 2);
        assert_eq!(output.line_counts.illegitimate_child, 1);
    }

    // ── Renounced representative excluded, others remain ────────────

    #[test]
    fn test_renounced_grandchild_excluded_others_remain() {
        // Predeceased LC with 3 grandchildren, one has renounced.
        // Art. 977: the renounced grandchild cannot inherit (and cannot be represented).
        // The other 2 grandchildren still represent.
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_lc("lc1", "Ana")), &["gc1", "gc2", "gc3"]),
                make_gc("gc1", "Dina"),
                renounced(make_gc("gc2", "Elena")),
                make_gc("gc3", "Fiona"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(line.participants.len(), 2);
        assert!(line.participants.contains(&"gc1".to_string()));
        assert!(!line.participants.contains(&"gc2".to_string())); // Renounced
        assert!(line.participants.contains(&"gc3".to_string()));
    }

    // ── All grandchildren renounced → line extinct ──────────────────

    #[test]
    fn test_all_grandchildren_renounced_line_extinct() {
        // Predeceased LC with 2 grandchildren, both renounced → extinct
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_lc("lc1", "Ana")), &["gc1", "gc2"]),
                renounced(make_gc("gc1", "Dina")),
                renounced(make_gc("gc2", "Elena")),
            ],
        };
        let output = step2_build_lines(&input);

        let lc1_lines: Vec<&Line> = output
            .lines
            .iter()
            .filter(|l| l.ancestor_heir_id == "lc1")
            .collect();
        assert!(lc1_lines.is_empty());
        assert_eq!(output.line_counts.legitimate_child, 0);
    }

    // ── Empty heirs ─────────────────────────────────────────────────

    #[test]
    fn test_empty_heirs_no_lines() {
        let input = Step2Input { heirs: vec![] };
        let output = step2_build_lines(&input);

        assert!(output.lines.is_empty());
        assert!(output.heirs.is_empty());
        assert_eq!(
            output.line_counts,
            LineCounts {
                legitimate_child: 0,
                illegitimate_child: 0,
                surviving_spouse: 0,
                legitimate_ascendant: 0,
            }
        );
    }

    // ── Ineligible heir with no representation trigger → extinct ────

    #[test]
    fn test_ineligible_heir_no_trigger_extinct() {
        // IC without filiation proof is alive but ineligible, with no trigger.
        // Line should be extinct.
        let mut heir = make_ic("ic1", "Carlo");
        heir.is_eligible = false;
        heir.filiation_proved = false;

        let input = Step2Input {
            heirs: vec![heir],
        };
        let output = step2_build_lines(&input);

        assert!(output.lines.is_empty());
        assert_eq!(output.line_counts.illegitimate_child, 0);
    }

    // ── Multiple extinct lines don't contribute to count ────────────

    #[test]
    fn test_multiple_extinct_lines_not_counted() {
        // 2 predeceased LC with no descendants + 1 alive LC → only 1 line
        let input = Step2Input {
            heirs: vec![
                dead(make_lc("lc1", "Ana")),
                dead(make_lc("lc2", "Belen")),
                make_lc("lc3", "Carlos"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        assert_eq!(output.lines[0].ancestor_heir_id, "lc3");
        assert_eq!(output.line_counts.legitimate_child, 1);
    }

    // ── Representation through dead grandchild to great-grandchildren ──

    #[test]
    fn test_representation_skips_dead_intermediate() {
        // lc1 (dead) → gc1 (dead) → ggc1 (alive) + ggc2 (alive)
        // The representation line should have ggc1 and ggc2 as participants
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_lc("lc1", "Ana")), &["gc1"]),
                with_children(dead(make_gc("gc1", "Belen")), &["ggc1", "ggc2"]),
                make_ggc("ggc1", "Carlos"),
                make_ggc("ggc2", "Dina"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(line.ancestor_heir_id, "lc1");
        assert_eq!(line.participants.len(), 2);
        assert!(line.participants.contains(&"ggc1".to_string()));
        assert!(line.participants.contains(&"ggc2".to_string()));
    }

    // ── Mixed representation: some grandchildren alive, one dead with kids ──

    #[test]
    fn test_mixed_depth_representation() {
        // lc1 (dead) → gc1 (alive) + gc2 (dead) → ggc1 (alive)
        // Representatives: gc1 and ggc1
        let input = Step2Input {
            heirs: vec![
                with_children(dead(make_lc("lc1", "Ana")), &["gc1", "gc2"]),
                make_gc("gc1", "Belen"),
                with_children(dead(make_gc("gc2", "Carlos")), &["ggc1"]),
                make_ggc("ggc1", "Dina"),
            ],
        };
        let output = step2_build_lines(&input);

        assert_eq!(output.lines.len(), 1);
        let line = &output.lines[0];
        assert_eq!(line.mode, InheritanceMode::Representation);
        assert_eq!(line.ancestor_heir_id, "lc1");
        assert_eq!(line.participants.len(), 2);
        assert!(line.participants.contains(&"gc1".to_string()));
        assert!(line.participants.contains(&"ggc1".to_string()));
    }
}
