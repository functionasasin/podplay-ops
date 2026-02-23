# Analysis: spec-patch-minor-gaps

**Date**: 2026-02-23
**Wave**: 5 (Synthesis — Spec Patch)
**Source**: analysis/spec-review.md (items 3a–3e), analysis/edge-cases.md, analysis/data-model.md

---

## Task

Apply 5 targeted edits to `docs/plans/inheritance-engine-spec.md` addressing the minor gaps identified in spec-review:

| # | Item | Section |
|---|------|---------|
| 3a | `Will.is_valid = false` behavior undefined | 4.3 |
| 3b | `Donation.is_gratuitous` field unexplained | 4.4 |
| 3c | `BloodType` FULL/HALF not defined | 4.5 |
| 3d | `FiliationProof` article citation inconsistency | 4.2 |
| 3e | 4 missing `ManualFlagCode` values | 4.7, 12 |

---

## Change 3a: Will.is_valid Input Boundary Rule

**Problem**: `Will.is_valid: bool` was documented as "Form validity (probated — outside engine scope)" but the spec was silent on what happens when it is `false`. A developer could reasonably interpret this as: (a) treat as intestate, (b) throw an error, or (c) process the substantive dispositions anyway.

**Fix applied**:
1. Updated the inline comment to: `MUST be true on input.`
2. Added a prose note immediately before `struct InstitutionOfHeir`:

> **Input boundary rule for `Will.is_valid`**: If `will.is_valid == false`, the engine MUST reject the input with an error before executing any pipeline step. It does NOT silently fall back to intestate succession — that decision requires a court ruling outside the engine's scope. Will formal validity (notarial requirements, probate) is determined by courts prior to calling this engine. Submit only wills where probate has confirmed formal validity.

**Rationale**: The engine is downstream of probate. "Outside engine scope" means the engine doesn't compute validity — it receives the result of that external process. An invalid will must not enter the pipeline; it must be an error at the input boundary.

---

## Change 3b: Donation.is_gratuitous Clarification

**Problem**: `Donation.is_gratuitous: bool` had no explanation of what `false` means or what computation effect it has. A donation with `is_gratuitous = false` is a transfer for fair consideration — a sale — not a legal donation at all.

**Fix applied**: Added a two-line comment on the field:

```
is_gratuitous: bool,  // true = gratuitous gift; false = fair-consideration transfer (sale/exchange).
                      // If false, the engine does NOT collate this item — it is not a donation in the legal sense.
```

**Rationale**: Art. 1061 applies only to donations (gratuitous transfers). A sale requires no collation because the decedent received fair value. The `Donation` struct may be used to record all inter vivos transfers for the caller's bookkeeping, but the collatability determination must filter out `is_gratuitous = false` items immediately.

---

## Change 3c: BloodType Definition

**Problem**: `enum BloodType { FULL, HALF }` appeared in Section 4.5 without any definition. The meaning is obvious to Filipinos but a developer with no knowledge of Philippine law (the target audience for this spec) might guess wrong.

**Fix applied**: Replaced the single-line enum with an annotated version:

```
enum BloodType {
    FULL,   // Heir's parent and the decedent share BOTH the same father AND the same mother
    HALF,   // Heir's parent and the decedent share only ONE common parent (same father OR same mother, not both)
}
// BloodType is used only for collateral heirs (siblings, nephews/nieces, cousins).
// Art. 1006: A full-blood sibling receives double the share of a half-blood sibling in I13.
```

**Legal basis**: Art. 967 (full blood vs half blood distinction), Art. 1006 (double share for full blood). BloodType is only relevant for intestate scenario I13 (siblings/nephews-nieces with mixed blood).

---

## Change 3d: FiliationProof Article Citation Unification

**Problem**: Section 4.2's `FiliationProof` enum used `FC Art. 172 ¶2(1)` and `FC Art. 172 ¶2(2)` for the last two values. Section 10.5's narrative templates used `Art. 172(3)` and `Art. 172(4)` for the same provisions. A developer generating narratives who looked at the enum comment would see a different citation format than what the narrative template produced, causing confusion.

**Fix applied**: Changed Section 4.2 enum comments from paragraph-number format to sequential-number format, matching Section 10.5:

```
// Before:
OPEN_CONTINUOUS_POSSESSION,         // FC Art. 172 ¶2(1)
OTHER_EVIDENCE,                     // FC Art. 172 ¶2(2)

// After:
OPEN_CONTINUOUS_POSSESSION,         // FC Art. 172(3)
OTHER_EVIDENCE,                     // FC Art. 172(4)
```

**Rationale**: Art. 172 of the Family Code has two paragraphs. The first paragraph has items (1) and (2); the second paragraph has items (1) and (2). In legal practice, the common citation counts sequentially across both paragraphs: item 1 (birth cert), item 2 (public document), item 3 (open possession), item 4 (other evidence). The sequential format (3) and (4) is consistent with Section 10.5's narrative templates and avoids paragraph-numbering confusion.

---

## Change 3e: Four Missing ManualFlagCode Values

**Problem**: The spec-draft recorded 10 manual review flags (6 from computation-pipeline + 4 identified in edge-cases). Section 4.7's `ManualFlagCode` enum and Section 12's table both only listed 6, omitting the 4 flags from edge-cases.md.

**Missing flags** (from edge-cases.md Section 21):
1. `USUFRUCT_ANNUITY_OPTION` — Art. 911 ¶3: election of usufruct/annuity instead of cash reduction
2. `DUAL_LINE_ASCENDANT` — Art. 890: by-line split ambiguous when consanguineous union places ascendant in both lines
3. `POSTHUMOUS_DISINHERITANCE` — Disinheritance of child conceived but not yet born
4. `CONTRADICTORY_DISPOSITIONS` — Will has mutually exclusive dispositions for same heir

**Fix applied**: Added all 4 to the `ManualFlagCode` enum in Section 4.7 with inline comments, and added 4 corresponding rows to the Section 12 table with trigger, default behavior, and legal basis.

**Section 12 additions**:

| Flag | Trigger | Default | Legal Basis |
|------|---------|---------|-------------|
| `USUFRUCT_ANNUITY_OPTION` | Art. 911 ¶3 reduction may be satisfied by usufruct/annuity election | Apply monetary cash reduction; flag for human election | Art. 911 ¶3 |
| `DUAL_LINE_ASCENDANT` | Consanguineous union places one ascendant in both paternal and maternal lines | Count in line of nearer degree; flag for review | Art. 890 |
| `POSTHUMOUS_DISINHERITANCE` | Disinheritance of conceived-but-unborn child | Treat as valid if formal requirements met and child born alive; flag for review | Arts. 915-917, 1025 |
| `CONTRADICTORY_DISPOSITIONS` | Will assigns incompatible shares to same heir | Use larger share (most favorable to heir); flag for review | Arts. 788-789, 847 |

---

## Verification

All 5 changes were applied to `/home/runner/work/monorepo/monorepo/docs/plans/inheritance-engine-spec.md`. The spec now:

- ✅ Defines what `will.is_valid = false` means at the input boundary (reject with error)
- ✅ Documents that `is_gratuitous = false` means the transfer is not collatable (not a legal donation)
- ✅ Defines `BloodType.FULL` and `BloodType.HALF` with an example and article citation
- ✅ Uses consistent `Art. 172(3)` / `Art. 172(4)` citations throughout (Sections 4.2 and 10.5)
- ✅ Lists all 10 `ManualFlagCode` values in Section 4.7 with descriptions, and all 10 in Section 12 with triggers/defaults/legal basis

The spec now passes all minor-gap criteria from spec-review. Combined with spec-patch-narratives and spec-patch-test-vectors (already applied), the spec is ready for re-review via `spec-review-2`.
