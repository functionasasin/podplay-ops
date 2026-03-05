# Invalid Combinations — Cross-Cutting Analysis

> Wave 2 aspect: Catalogs all input combinations the engine rejects, degrades, or flags
> with warnings. Produces frontend validation rules that prevent or warn about these
> combinations before submission.

## Overview

The Philippine Inheritance Distribution Engine has **no explicit input validation step**.
It relies on serde deserialization for structural correctness and processes whatever it
receives. Invalid combinations manifest as:

1. **Silent degradation** — heir excluded, share becomes zero, field ignored
2. **Pipeline warnings** — `ManualFlag` entries in step outputs (6 known categories)
3. **Pipeline behavior changes** — preterition converts testate→intestate, vacancy triggers restart
4. **Panics** — `unwrap()` calls that crash on referential integrity violations

The frontend must validate proactively because the engine will silently produce incorrect
or surprising results rather than returning structured errors.

---

## 1. Eligibility Gate Rejections (Step 1)

These combinations cause an heir to be classified but marked `is_eligible = false`,
meaning they receive a zero share. The engine does NOT error — it silently excludes them.

### 1.1 IllegitimateChild + filiation_proved = false

```typescript
// Source: step1_classify.rs:178 — Art. 887 ¶3
// Severity: SILENT EXCLUSION (heir gets zero share, no warning)
// Frontend action: Show warning inline on person card
{
  relationship_to_decedent: "IllegitimateChild",
  filiation_proved: false,
  // → is_eligible = false, share = 0
}
```

**Validation rule:**
```typescript
// Source: step1_classify.rs:178
// zod: superRefine on Person
if (person.relationship_to_decedent === "IllegitimateChild" && !person.filiation_proved) {
  ctx.addIssue({
    code: "custom",
    path: ["filiation_proved"],
    message: "Art. 887 ¶3: Illegitimate child without proven filiation will be EXCLUDED from inheritance.",
  });
  // WARNING, not ERROR — user may intentionally model this scenario
}
```

### 1.2 AdoptedChild + adoption = null

```typescript
// Source: step1_classify.rs:188-191
// Severity: SILENT EXCLUSION (no adoption record → ineligible)
// Frontend action: HARD ERROR — adoption sub-form required for AdoptedChild
{
  relationship_to_decedent: "AdoptedChild",
  adoption: null,
  // → is_eligible = false, share = 0
}
```

**Validation rule:**
```typescript
// Source: step1_classify.rs:188-191
// zod: superRefine on Person
if (person.relationship_to_decedent === "AdoptedChild" && person.adoption === null) {
  ctx.addIssue({
    code: "custom",
    path: ["adoption"],
    message: "Adopted child requires an adoption record. Without it, the engine will exclude this heir entirely.",
  });
  // HARD ERROR — this is always a data entry mistake
}
```

### 1.3 AdoptedChild + adoption.is_rescinded = true

```typescript
// Source: step1_classify.rs:182-187 — RA 8552 Sec. 20
// Severity: SILENT EXCLUSION
// Frontend action: Show warning (may be intentional modeling)
{
  relationship_to_decedent: "AdoptedChild",
  adoption: { is_rescinded: true },
  // → is_eligible = false, share = 0
}
```

**Validation rule:**
```typescript
// Source: step1_classify.rs:182-187
// zod: superRefine on Adoption (within Person)
if (adoption.is_rescinded) {
  ctx.addIssue({
    code: "custom",
    path: ["is_rescinded"],
    message: "RA 8552 Sec. 20: Rescinded adoption removes all succession rights. This heir will be EXCLUDED.",
  });
  // WARNING — user may intentionally model this
}
```

### 1.4 SurvivingSpouse + is_guilty_party_in_legal_separation = true

```typescript
// Source: step1_classify.rs:195-197 — Art. 1002
// Severity: SILENT EXCLUSION
// Frontend action: Show warning
{
  relationship_to_decedent: "SurvivingSpouse",
  is_guilty_party_in_legal_separation: true,
  // → is_eligible = false, share = 0
}
```

**Validation rule:**
```typescript
// Source: step1_classify.rs:195-197
// Cross-field: requires decedent.has_legal_separation = true for field to be visible
if (person.relationship_to_decedent === "SurvivingSpouse" &&
    person.is_guilty_party_in_legal_separation) {
  ctx.addIssue({
    code: "custom",
    path: ["is_guilty_party_in_legal_separation"],
    message: "Art. 1002: Guilty party in legal separation is excluded from intestate succession.",
  });
}
```

### 1.5 Any heir + is_unworthy = true + unworthiness_condoned = false

```typescript
// Source: step1_classify.rs:199-201 — Arts. 1032-1033
// Severity: SILENT EXCLUSION
// Frontend action: Show warning
{
  is_unworthy: true,
  unworthiness_condoned: false,
  // → is_eligible = false, share = 0
}
```

**Validation rule:**
```typescript
// Source: step1_classify.rs:199-201
if (person.is_unworthy && !person.unworthiness_condoned) {
  ctx.addIssue({
    code: "custom",
    path: ["is_unworthy"],
    message: "Art. 1032: Unworthy heir is excluded unless condoned (Art. 1033).",
  });
}
```

---

## 2. Mutual Exclusion (Step 1)

These don't reject individual heirs but silently change which heirs participate.

### 2.1 Legitimate Descendants Exclude Ascendants

```typescript
// Source: step1_classify.rs:108-120 — Art. 887(2)
// Severity: SILENT — ascendants' is_eligible set to false
// Condition: Any alive, non-renounced heir in LegitimateChildGroup exists
// Effect: ALL LegitimateAscendantGroup heirs become ineligible
```

**Frontend rule:**
```typescript
// Source: step1_classify.rs:108-120
function checkMutualExclusion(familyTree: Person[]): MutualExclusionWarning | null {
  const hasAliveLC = familyTree.some(
    (p) =>
      ["LegitimateChild", "LegitimatedChild", "AdoptedChild"].includes(
        p.relationship_to_decedent
      ) &&
      p.is_alive_at_succession &&
      !p.has_renounced
  );
  const ascendants = familyTree.filter((p) =>
    ["LegitimateParent", "LegitimateAscendant"].includes(
      p.relationship_to_decedent
    )
  );

  if (hasAliveLC && ascendants.length > 0) {
    return {
      severity: "info",
      affectedPersonIds: ascendants.map((a) => a.id),
      message:
        "Art. 887: Legitimate descendants take priority — these ascendants will be excluded from compulsory succession.",
    };
  }
  return null;
}
```

**Key detail:** Only alive AND non-renounced LC-group heirs trigger exclusion.
If all LC-group heirs have `has_renounced = true`, ascendants are NOT excluded
(Art. 969: total renunciation → next degree inherits).

### 2.2 Compulsory Heirs Exclude Collaterals (Intestate)

```typescript
// Source: step3_scenario.rs:163-235
// Severity: SILENT — collaterals only reach scenarios I11-I14
// Condition: Any compulsory heir (LC/LtC/AC/IC/SS/LP/LA) is alive and eligible
// Effect: Collateral relatives (Sibling, NephewNiece, OtherCollateral) get zero
```

**Frontend rule:**
```typescript
// Source: step3_scenario.rs:163-235
function checkCollateralExclusion(
  familyTree: Person[],
  hasWill: boolean,
): CollateralExclusionWarning | null {
  const compulsoryRelationships = [
    "LegitimateChild", "LegitimatedChild", "AdoptedChild",
    "IllegitimateChild", "SurvivingSpouse",
    "LegitimateParent", "LegitimateAscendant",
  ];
  const hasCompulsory = familyTree.some(
    (p) =>
      compulsoryRelationships.includes(p.relationship_to_decedent) &&
      p.is_alive_at_succession
  );
  const collaterals = familyTree.filter((p) =>
    ["Sibling", "NephewNiece", "OtherCollateral"].includes(
      p.relationship_to_decedent
    )
  );

  if (hasCompulsory && collaterals.length > 0 && !hasWill) {
    return {
      severity: "info",
      affectedPersonIds: collaterals.map((c) => c.id),
      message:
        "Collateral relatives only inherit when no compulsory heirs exist (intestate succession).",
    };
  }
  return null;
}
```

---

## 3. Disinheritance Invalidity (Steps 1 + 6)

### 3.1 Invalid Disinheritance → Heir Reinstated

A disinheritance is invalid when ANY of these conditions fail:

```typescript
// Source: step1_classify.rs:207-210, step6_validation.rs:370-435
// Three conditions must ALL be true for validity:
// 1. cause_specified_in_will = true    (Art. 916)
// 2. cause_proven = true               (Art. 917)
// 3. reconciliation_occurred = false    (Art. 922)
//
// Invalid → heir reinstated with full legitime (Art. 918)
// Invalid → may trigger pipeline restart
```

**Frontend validation (per disinheritance entry):**
```typescript
// Source: step6_validation.rs:380-434
interface DisinheritanceValidity {
  isValid: boolean;
  reasons: string[];
}

function validateDisinheritance(d: {
  cause_specified_in_will: boolean;
  cause_proven: boolean;
  reconciliation_occurred: boolean;
}): DisinheritanceValidity {
  const reasons: string[] = [];

  if (!d.cause_specified_in_will) {
    reasons.push("Art. 916: Cause not specified in will — disinheritance void");
  }
  if (!d.cause_proven) {
    reasons.push("Art. 917: Cause not proven — disinheritance void");
  }
  if (d.reconciliation_occurred) {
    reasons.push("Art. 922: Reconciliation occurred — disinheritance void");
  }

  return {
    isValid: reasons.length === 0,
    reasons,
  };
}
```

**UI behavior:** When any disinheritance is invalid, show warning:
> "Art. 918: Invalid disinheritance — heir will be reinstated with full legitime."

### 3.2 Disinheritance of Non-Compulsory Heir

```typescript
// Source: step1_classify.rs:167-172, disinheritance.md
// Only compulsory heirs (7 categories) can be disinherited.
// Collateral relatives (Sibling, NephewNiece, OtherCollateral) and
// Strangers CANNOT be disinherited.
// The engine doesn't cross-validate — it processes the disinheritance
// but it has no legal effect on non-compulsory heirs.
```

**Frontend validation:**
```typescript
// Source: step1_classify.rs:167-172
const DISINHERITABLE_RELATIONSHIPS = [
  "LegitimateChild", "LegitimatedChild", "AdoptedChild",
  "IllegitimateChild", "SurvivingSpouse",
  "LegitimateParent", "LegitimateAscendant",
] as const;

// PersonPicker for disinheritances should ONLY show compulsory heirs
// Filter: familyTree.filter(p => DISINHERITABLE_RELATIONSHIPS.includes(p.relationship_to_decedent))
```

### 3.3 Wrong Cause Code for Heir Relationship

```typescript
// Source: disinheritance.md — Arts. 919/920/921
// The engine does NOT validate that the cause_code matches the heir's relationship.
// E.g., using ChildAttemptOnLife (Art. 919) on a SurvivingSpouse is legally wrong
// but the engine won't reject it.
// Frontend MUST filter cause_code dropdown by heir relationship group.
```

**Frontend validation:**
```typescript
// Source: disinheritance.md
const CHILD_CAUSES = [
  "ChildAttemptOnLife", "ChildAccusedCrime", "ChildCoercionRevoke",
  "ChildMaltreatment", "ChildImmoralLife", "ChildConvictedSentence",
  "ChildRefusalSupport", "ChildAttemptAgainstOther",
] as const;

const PARENT_CAUSES = [
  "ParentAbandonedChild", "ParentInducedDaughter",
  "ParentAttemptOnLife", "ParentAccusedCrime",
  "ParentCoercionRevoke", "ParentLossParentalAuthority",
  "ParentRefusalSupport", "ParentAttemptAgainstOther",
] as const;

const SPOUSE_CAUSES = [
  "SpouseUnfaithfulConviction", "SpouseAttemptOnLife",
  "SpouseAccusedCrime", "SpouseCoercionRevoke",
  "SpouseRefusalSupport", "SpouseGroundsForSeparation",
] as const;

type RelationshipCauseGroup = "Child" | "Parent" | "Spouse";

const RELATIONSHIP_TO_CAUSE_GROUP: Record<string, RelationshipCauseGroup | null> = {
  LegitimateChild: "Child",
  LegitimatedChild: "Child",
  AdoptedChild: "Child",
  IllegitimateChild: "Child",
  SurvivingSpouse: "Spouse",
  LegitimateParent: "Parent",
  LegitimateAscendant: "Parent",
  Sibling: null,
  NephewNiece: null,
  OtherCollateral: null,
  Stranger: null,
};

function getValidCauseCodes(
  relationship: string,
): readonly string[] {
  const group = RELATIONSHIP_TO_CAUSE_GROUP[relationship];
  switch (group) {
    case "Child": return CHILD_CAUSES;
    case "Parent": return PARENT_CAUSES;
    case "Spouse": return SPOUSE_CAUSES;
    default: return []; // cannot be disinherited
  }
}
```

---

## 4. Preterition — Testate → Intestate Conversion (Step 6)

### 4.1 Omitted Compulsory Heir Annuls All Institutions

```typescript
// Source: step6_validation.rs:287-361 — Art. 854
// Severity: PIPELINE BEHAVIOR CHANGE
// When detected: SuccessionType becomes IntestateByPreterition
// All institutions annulled; legacies/devises survive unless separately inofficious
//
// Scope of preterition check:
// - Compulsory heirs only (is_compulsory && is_eligible)
// - Excludes SurvivingSpouse (spouse omission is NEVER preterition)
// - Excludes degree > 1 heirs (grandchildren)
// - ICs: only checked if at least one IC is explicitly instituted
// - Will must have at least one institution (if no institutions, no preterition)
```

**Frontend detection (preview warning before submission):**
```typescript
// Source: step6_validation.rs:287-361
interface PreteritionRisk {
  detected: boolean;
  omittedHeirIds: string[];
  message: string;
}

function checkPreteritionRisk(
  familyTree: Person[],
  will: Will | null,
): PreteritionRisk {
  if (!will || will.institutions.length === 0) {
    return { detected: false, omittedHeirIds: [], message: "" };
  }

  const compulsoryNotSpouse = familyTree.filter(
    (p) =>
      [
        "LegitimateChild", "LegitimatedChild", "AdoptedChild",
        "IllegitimateChild",
        "LegitimateParent", "LegitimateAscendant",
      ].includes(p.relationship_to_decedent) &&
      p.is_alive_at_succession &&
      p.degree <= 1
  );

  // Check if any IC is explicitly instituted
  const institutedIds = new Set(
    will.institutions
      .map((i) => i.heir.person_id)
      .filter((id): id is string => id !== null)
  );
  const anyIcInstituted = familyTree.some(
    (p) =>
      p.relationship_to_decedent === "IllegitimateChild" &&
      institutedIds.has(p.id)
  );

  // All ways an heir is "addressed" in the will
  const addressedIds = new Set<string>();
  for (const inst of will.institutions) {
    if (inst.heir.person_id) addressedIds.add(inst.heir.person_id);
  }
  for (const leg of will.legacies) {
    if (leg.legatee.person_id) addressedIds.add(leg.legatee.person_id);
  }
  for (const dev of will.devises) {
    if (dev.devisee.person_id) addressedIds.add(dev.devisee.person_id);
  }
  for (const dis of will.disinheritances) {
    if (dis.heir_reference.person_id) addressedIds.add(dis.heir_reference.person_id);
  }

  const omitted = compulsoryNotSpouse.filter((p) => {
    // Skip ICs when no IC is instituted
    if (p.relationship_to_decedent === "IllegitimateChild" && !anyIcInstituted) {
      return false;
    }
    return !addressedIds.has(p.id);
  });

  if (omitted.length > 0) {
    return {
      detected: true,
      omittedHeirIds: omitted.map((p) => p.id),
      message:
        `Art. 854: ${omitted.length} compulsory heir(s) totally omitted from will — ` +
        `ALL institutions will be annulled. Distribution will follow intestate rules.`,
    };
  }
  return { detected: false, omittedHeirIds: [], message: "" };
}
```

**Note:** Even a token legacy of ₱1 defeats preterition for that heir (tested at
step6_validation.rs:1142). The frontend should hint: "Adding any legacy/devise/
disinheritance clause for this heir prevents preterition."

---

## 5. Articulo Mortis — Spouse Legitime Reduction (Step 1)

```typescript
// Source: step1_classify.rs:226-231 — Art. 900 ¶2
// Severity: SHARE REDUCTION (not exclusion)
// ALL FOUR conditions must be true:
// 1. marriage_solemnized_in_articulo_mortis = true
// 2. was_ill_at_marriage = true
// 3. illness_caused_death = true
// 4. years_of_cohabitation < 5
//
// Effect: Spouse legitime reduced from E/2 → E/3 in certain scenarios
// Missing ANY one condition → no reduction
```

**Frontend rule:** Already covered in conditional-visibility.md (§2 Articulo Mortis
Warning). The invalid combination here is informational — it's a valid input that
produces a different result than the user might expect.

---

## 6. Referential Integrity Violations

The engine does NOT validate referential integrity. These cause panics or silent errors.

### 6.1 Donation references non-existent heir

```typescript
// Source: step4_estate_base.rs:93-114
// Severity: WARNING (ManualFlag category="unknown_donee")
// Effect: Donation treated as non-collatable (collatable=false, charge_target=None)
{
  recipient_is_stranger: false,
  recipient_heir_id: "nonexistent_person_id",
  // → ManualFlag warning, donation has no collation effect
}
```

**Frontend validation (HARD ERROR):**
```typescript
// Source: step4_estate_base.rs:96-104
// zod: superRefine on Donation
if (!donation.recipient_is_stranger && donation.recipient_heir_id !== null) {
  const exists = familyTree.some((p) => p.id === donation.recipient_heir_id);
  if (!exists) {
    ctx.addIssue({
      code: "custom",
      path: ["recipient_heir_id"],
      message: "Donation recipient must reference an existing person in the family tree.",
    });
  }
}
```

### 6.2 Will HeirReference.person_id references non-existent person

```typescript
// Source: step6_validation.rs:828-854 (heir_addressed_in_will)
// Severity: SILENT — heir_addressed_in_will simply doesn't match
// Effect: If the person doesn't exist, the institution/legacy/devise has
// no corresponding heir and contributes to free portion consumption only.
// May cause unintended preterition of actual heirs.
```

**Frontend validation (HARD ERROR):**
```typescript
// zod: superRefine on HeirReference (across institutions, legacies, devises)
if (heirRef.person_id !== null) {
  const exists = familyTree.some((p) => p.id === heirRef.person_id);
  if (!exists) {
    ctx.addIssue({
      code: "custom",
      path: ["person_id"],
      message: "Referenced person must exist in the family tree.",
    });
  }
}
```

### 6.3 Person.children[] references non-existent IDs

```typescript
// Source: step2_lines.rs:81 — .unwrap() will PANIC
// Severity: PANIC (crash)
// The engine does heirs.iter().find(|h| h.id == *anchor_id).unwrap()
// If a child ID is not in the family tree, the pipeline PANICS.
```

**Frontend validation (HARD ERROR):**
```typescript
// Source: step2_lines.rs:81
// zod: superRefine on Person.children[]
for (const childId of person.children) {
  const exists = familyTree.some((p) => p.id === childId);
  if (!exists) {
    ctx.addIssue({
      code: "custom",
      path: ["children"],
      message: `Child ID "${childId}" must reference an existing person in the family tree.`,
    });
  }
}
```

### 6.4 Disinheritance.heir_reference.person_id references non-existent person

```typescript
// Source: step1_classify.rs:53-54
// Severity: SILENT — disinheritance simply doesn't match any heir
// Effect: Disinheritance has no effect; heir not flagged as disinherited
```

**Frontend validation (HARD ERROR):**
```typescript
// zod: superRefine on Disinheritance.heir_reference
if (dis.heir_reference.person_id !== null) {
  const exists = familyTree.some((p) => p.id === dis.heir_reference.person_id);
  if (!exists) {
    ctx.addIssue({
      code: "custom",
      path: ["heir_reference", "person_id"],
      message: "Disinherited person must exist in the family tree.",
    });
  }
}
```

---

## 7. Uniqueness Violations

### 7.1 Duplicate Person IDs

```typescript
// Source: step1_classify.rs:53-54, step2_lines.rs:81
// Severity: UNDEFINED BEHAVIOR — .find() returns first match only
// Effect: Second person with same ID is effectively invisible to lookups
```

**Frontend validation (HARD ERROR):**
```typescript
// zod: superRefine on EngineInput.family_tree
const ids = familyTree.map((p) => p.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length > 0) {
  ctx.addIssue({
    code: "custom",
    path: ["family_tree"],
    message: `Duplicate person IDs: ${[...new Set(duplicates)].join(", ")}`,
  });
}
```

### 7.2 Duplicate Disposition IDs

```typescript
// Source: engine-output uses disposition IDs for reduction tracking
// Severity: CONFUSION — reduction targets may be ambiguous
// Applies to: institution IDs, legacy IDs, devise IDs, donation IDs
```

**Frontend validation (HARD ERROR):**
```typescript
// zod: superRefine on Will + Donations
function checkDispositionIdUniqueness(will: Will | null, donations: Donation[]): string[] {
  const allIds: string[] = [];
  if (will) {
    allIds.push(...will.institutions.map((i) => i.id));
    allIds.push(...will.legacies.map((l) => l.id));
    allIds.push(...will.devises.map((d) => d.id));
  }
  allIds.push(...donations.map((d) => d.id));

  const duplicates = allIds.filter((id, i) => allIds.indexOf(id) !== i);
  return [...new Set(duplicates)];
}
```

### 7.3 Multiple Surviving Spouses

```typescript
// Source: step2_lines.rs (line counting), step3_scenario.rs:98
// Severity: INCORRECT SCENARIO — surviving_spouse count > 1 is not modeled
// The engine counts surviving_spouse in LineCounts and uses > 0 checks.
// Multiple spouses would produce has_spouse=true (correct) but the
// share computation in step5/step7 may distribute as if one spouse.
```

**Frontend validation (HARD ERROR):**
```typescript
// Source: person.md analysis — max 1 SurvivingSpouse
const spouseCount = familyTree.filter(
  (p) => p.relationship_to_decedent === "SurvivingSpouse"
).length;
if (spouseCount > 1) {
  ctx.addIssue({
    code: "custom",
    path: ["family_tree"],
    message: "Only one Surviving Spouse is allowed. Philippine law does not recognize multiple simultaneous spouses.",
  });
}
```

---

## 8. Cross-Field Consistency Violations

### 8.1 Surviving Spouse Without Married Decedent

```typescript
// Source: pipeline.rs — engine trusts family_tree regardless of decedent.is_married
// Severity: INCONSISTENT — engine processes spouse normally even if is_married=false
// Frontend should warn (not block — user might be modeling separated-but-not-divorced)
```

**Frontend validation (WARNING):**
```typescript
// zod: superRefine on EngineInput
const hasSpouse = familyTree.some(
  (p) => p.relationship_to_decedent === "SurvivingSpouse"
);
if (hasSpouse && !decedent.is_married) {
  ctx.addIssue({
    code: "custom",
    path: ["decedent", "is_married"],
    message: "Warning: A Surviving Spouse exists in the family tree, but the decedent is marked as unmarried.",
  });
}
```

### 8.2 Will date_executed > decedent.date_of_death

```typescript
// Source: will.md analysis — engine has NO date validation
// Severity: SILENT — engine ignores dates entirely for computation
// A will executed after death is legally void — frontend must catch this
```

**Frontend validation (HARD ERROR):**
```typescript
// Source: will.md — cross-field validation
if (will && will.date_executed > decedent.date_of_death) {
  ctx.addIssue({
    code: "custom",
    path: ["will", "date_executed"],
    message: "Will date_executed must be on or before the decedent's date_of_death.",
  });
}
```

### 8.3 Donation date > decedent.date_of_death

```typescript
// Source: engine has no date validation
// Severity: SILENT — a donation after death is legally impossible
// (it would be a testamentary disposition, not an inter vivos donation)
```

**Frontend validation (HARD ERROR):**
```typescript
// zod: superRefine on Donation
if (donation.date > decedent.date_of_death) {
  ctx.addIssue({
    code: "custom",
    path: ["date"],
    message: "Donation date must be before the decedent's date of death (inter vivos means during lifetime).",
  });
}
```

### 8.4 is_guilty_party_in_legal_separation = true Without Legal Separation

```typescript
// Source: step1_classify.rs:195-197
// Severity: SILENT EXCLUSION — spouse excluded even if has_legal_separation=false
// The engine checks the person field directly, not the decedent field.
// Frontend must ensure consistency.
```

**Frontend validation (HARD ERROR):**
```typescript
if (
  person.relationship_to_decedent === "SurvivingSpouse" &&
  person.is_guilty_party_in_legal_separation &&
  !decedent.has_legal_separation
) {
  ctx.addIssue({
    code: "custom",
    path: ["is_guilty_party_in_legal_separation"],
    message: "Cannot be guilty party without legal separation. Set decedent's 'has_legal_separation' to true first.",
  });
}
```

---

## 9. Inofficiousness — Over-Allocation of Free Portion (Step 6)

```typescript
// Source: step6_validation.rs:492-553 — Arts. 908-912
// Severity: PIPELINE REDUCTION — dispositions cut down automatically
// When total testamentary dispositions > free_portion.fp_disposable,
// the Art. 911 three-phase reduction activates.
```

**Frontend preview warning:**
```typescript
// Source: step6_validation.rs:492-553
// This cannot be precisely validated on the frontend because fp_disposable
// depends on Steps 3-5 (scenario determination + legitime computation).
// But a rough heuristic is possible:
function estimateInofficiousnessRisk(
  netEstate: number, // in centavos
  totalLegacyAmounts: number, // sum of all FixedAmount + GenericClass legacy values
  hasCompulsoryHeirs: boolean,
): boolean {
  if (!hasCompulsoryHeirs) return false; // T13: 100% free portion
  // Rough estimate: free portion is typically 25-50% of estate
  const conservativeFP = netEstate * 0.25;
  return totalLegacyAmounts > conservativeFP;
}
// UI: Show info badge: "Total legacies may exceed the free portion.
//     The engine will automatically reduce dispositions per Art. 911."
```

---

## 10. Empty / Edge-Case Input Combinations

### 10.1 Empty Family Tree (No Heirs)

```typescript
// Source: step3_scenario.rs:233 — I15 (escheat)
// Severity: VALID BUT UNUSUAL — estate goes to State
// Frontend should warn: "No heirs — estate will escheat to the State (Art. 1011)"
{
  family_tree: [],
  will: null,
  // → Scenario I15, 100% to State
}
```

### 10.2 All Heirs Dead With No Children

```typescript
// Source: step2_lines.rs → step9_vacancy.rs
// Severity: VALID — all shares become vacant, may cascade to I15
// Frontend should warn about the unusual configuration
```

### 10.3 Empty Will (All Arrays Empty)

```typescript
// Source: will.md, step6_validation.rs:298-306
// Severity: VALID — no preterition (no institutions to annul)
// Effect: Will has no dispositions → mixed succession or pure intestate fallback
{
  will: {
    institutions: [],
    legacies: [],
    devises: [],
    disinheritances: [],
    date_executed: "2025-01-01",
  },
  // → Engine processes as testate, but with zero FP consumption
}
```

**Frontend validation (WARNING):**
```typescript
if (will && will.institutions.length === 0 && will.legacies.length === 0 &&
    will.devises.length === 0 && will.disinheritances.length === 0) {
  ctx.addIssue({
    code: "custom",
    path: ["will"],
    message: "Warning: Will has no dispositions. Consider removing the will (intestate) or adding at least one institution/legacy.",
  });
}
```

### 10.4 Zero Net Estate

```typescript
// Source: pipeline.rs:21 — money_to_frac converts to Frac
// Severity: VALID — all shares compute to zero
// Frontend should validate: net_distributable_estate.centavos > 0
{
  net_distributable_estate: { centavos: 0 },
  // → All shares = 0. Technically valid but useless.
}
```

**Frontend validation (HARD ERROR):**
```typescript
// zod: superRefine on EngineInput
if (netDistributableEstate.centavos <= 0) {
  ctx.addIssue({
    code: "custom",
    path: ["net_distributable_estate", "centavos"],
    message: "Net distributable estate must be greater than zero.",
  });
}
```

---

## 11. Pipeline Restart Triggers (Step 9)

These combinations don't fail but cause the pipeline to restart, which the frontend
should document in the results view.

### 11.1 Total Renunciation of a Degree

```typescript
// Source: step9_vacancy.rs:59-63, pipeline.rs:134-137
// When ALL heirs of the same degree renounce, the pipeline restarts
// with the next degree inheriting (Art. 969).
// Guard: max_pipeline_restarts (default 10, config field)
```

### 11.2 Legitime Vacancy Triggers Scenario Re-evaluation

```typescript
// Source: step9_vacancy.rs:14-16 — §10.2, Art. 1021
// When a vacancy occurs in the legitime portion (not free portion),
// co-heirs succeed "in their own right" → full scenario restart.
// This can change the scenario code (e.g., T3 → T1 if spouse dies).
```

---

## 12. Comprehensive Validation Priority Table

| # | Combination | Severity | Frontend Action | Source |
|---|---|---|---|---|
| 1 | Duplicate person IDs | PANIC risk | **Hard error** | step2_lines.rs:81 |
| 2 | children[] refs non-existent ID | PANIC | **Hard error** | step2_lines.rs:81 |
| 3 | AdoptedChild + adoption=null | Silent exclusion | **Hard error** | step1_classify.rs:188 |
| 4 | Zero/negative estate | Useless output | **Hard error** | pipeline.rs:21 |
| 5 | Multiple SurvivingSpouse | Incorrect model | **Hard error** | Legal constraint |
| 6 | will.date_executed > date_of_death | Legally void | **Hard error** | Legal constraint |
| 7 | donation.date > date_of_death | Legally impossible | **Hard error** | Legal constraint |
| 8 | HeirReference → non-existent person | Silent null | **Hard error** | step6_validation.rs:828 |
| 9 | Donation → non-existent heir | Warning flag | **Hard error** | step4_estate_base.rs:96 |
| 10 | Duplicate disposition IDs | Ambiguous output | **Hard error** | Engine output tracking |
| 11 | IC without filiation proof | Silent exclusion | **Warning** | step1_classify.rs:178 |
| 12 | Rescinded adoption | Silent exclusion | **Warning** | step1_classify.rs:182 |
| 13 | Unworthy + not condoned | Silent exclusion | **Warning** | step1_classify.rs:199 |
| 14 | Spouse guilty in legal sep | Silent exclusion | **Warning** | step1_classify.rs:195 |
| 15 | Invalid disinheritance | Heir reinstated | **Warning** | step6_validation.rs:390 |
| 16 | Compulsory heir omitted (preterition) | Intestate conversion | **Warning** | step6_validation.rs:287 |
| 17 | Dispositions > free portion | Auto-reduction | **Info** | step6_validation.rs:492 |
| 18 | LC-group present + ascendants | Ascendants excluded | **Info** | step1_classify.rs:108 |
| 19 | Compulsory heirs + collaterals | Collaterals excluded | **Info** | step3_scenario.rs:163 |
| 20 | Empty will (no dispositions) | Mixed/intestate | **Info** | step6_validation.rs:298 |
| 21 | Spouse without married decedent | Inconsistent | **Warning** | Cross-field |
| 22 | Guilty party without legal sep | Inconsistent | **Hard error** | Cross-field |
| 23 | Wrong cause code for relationship | Legal error | **Hard error** | Arts. 919-921 |
| 24 | Empty family tree | Escheat (I15) | **Info** | step3_scenario.rs:233 |
| 25 | All heirs renounced | Pipeline restart | **Info** | step9_vacancy.rs |

---

## 13. Wave 1 Types Affected

| Wave 1 Analysis | Invalid Combinations Found |
|---|---|
| `person.md` | #1 (dup IDs), #2 (children refs), #3 (adoption null), #5 (multi spouse), #11 (filiation), #12 (rescinded), #13 (unworthy), #14 (guilty party) |
| `engine-input-root.md` | #4 (zero estate) |
| `relationship-enum.md` | #18 (mutual exclusion), #19 (collateral exclusion) |
| `will.md` | #6 (date), #8 (heir refs), #10 (dup IDs), #16 (preterition), #20 (empty will) |
| `institution-of-heir.md` | #8 (heir refs), #10 (dup IDs), #17 (inofficiousness) |
| `legacy.md` | #8 (heir refs), #10 (dup IDs), #17 (inofficiousness) |
| `devise.md` | #8 (heir refs), #10 (dup IDs) |
| `disinheritance.md` | #15 (invalid disinheritance), #23 (wrong cause code) |
| `donation.md` | #7 (date), #9 (heir refs), #10 (dup IDs) |
| `adoption.md` | #3 (null adoption), #12 (rescinded) |
| `filiation-proof.md` | #11 (filiation proof) |
| `decedent.md` | #6 (will date), #21 (spouse consistency), #22 (legal sep consistency) |
| `engine-config.md` | #25 (max_pipeline_restarts governs restart limit) |
| `engine-output.md` | Output ManualFlag categories: preterition, disinheritance, inofficiousness, unknown_donee |

---

## 14. Implementation Recommendation: Validation Layers

The frontend should implement validation in three layers:

### Layer 1: Zod Schema (Structural)
- Type checks, required fields, enum constraints
- Runs on every keystroke (debounced)

### Layer 2: Cross-Field SuperRefine (Consistency)
- All hard errors from §12 (#1-10, #22-23)
- Referential integrity (person IDs, disposition IDs)
- Runs on form step change

### Layer 3: Pre-Submission Preview (Behavioral)
- All warnings from §12 (#11-21, #24-25)
- Preterition detection, mutual exclusion badges, inofficiousness estimates
- Runs on Review step (Step 6 of wizard) before final submission
- Results shown as dismissable warnings — user can proceed despite them
