# Testate Institution — Institution of Heirs in a Will

**Aspect**: testate-institution
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 840-856, 857-863, 871-872, 914 (Civil Code)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, legitime-table, free-portion-rules, representation-rights

---

## Overview

This analysis formalizes how the engine parses and executes a **testamentary disposition** — the set of instructions in a decedent's will that designate who gets what. Unlike intestate succession (which follows a rigid statutory formula), testate succession is driven by **testator intent** constrained by the **legitime floor**. The engine must model every type of disposition, validate it against compulsory heirs' rights, and resolve conflicts.

This analysis covers:
1. Types of testamentary dispositions (institution, legacy, devise)
2. Types of heirs (universal vs. particular; compulsory vs. voluntary)
3. Share allocation and proportional adjustment rules (Arts. 846-853)
4. Substitution of heirs (Arts. 857-863) — simple, reciprocal, fideicommissary
5. Conditional and modal institutions (Arts. 871-872)
6. Preterition (Art. 854) — omission of compulsory heirs in the direct line
7. Underprovision of compulsory heirs (Art. 855)
8. Death/incapacity of instituted heirs (Art. 856)
9. The complete will-parsing and distribution algorithm
10. Interaction with the legitime system, free portion, and intestate fallback

---

## Legal Basis

### Core Articles — Institution of Heirs

| Article | What It Governs | Key Text |
|---------|----------------|----------|
| **Art. 840** | Definition | "Institution of heir is an act by virtue of which a testator designates in his will the person or persons who are to succeed him in his property and transmissible rights and obligations." |
| **Art. 841** | Validity without institution | "A will shall be valid even though it should not contain an institution of an heir, or such institution should not comprise the entire estate, and even though the person so instituted should not accept the inheritance or should be incapacitated to succeed." — remainder passes to legal heirs. |
| **Art. 842** | Testator's freedom | "One who has no compulsory heirs may dispose by will of all his estate... One who has compulsory heirs may dispose of his estate provided he does not contravene the provisions of this Code with regard to the legitime." |
| **Art. 843** | Designation by name | Testator must designate heir by name/surname; but institution valid if identity can be ascertained by other means. |
| **Art. 844** | Error in name | Error in name/surname doesn't vitiate if identity can be determined. If ambiguity is irresolvable, none is an heir. |
| **Art. 845** | Unknown person | Disposition to unknown person void unless identity later becomes certain. Disposition to a definite class/group is valid. |
| **Art. 846** | Default equal shares | "Heirs instituted without designation of shares shall inherit in equal parts." |
| **Art. 847** | Individual vs. collective | When testator names some individually and some collectively (e.g., "A and B, and the children of C"), collectively designated persons are treated as individually instituted, unless contrary intent appears. |
| **Art. 848** | Full/half blood siblings | Brothers/sisters of full and half blood share equally unless different intention. |
| **Art. 849** | Parent and children | When testator calls "a person and his children," all deemed simultaneously instituted (not successively). |
| **Art. 850** | False cause | Statement of false cause for institution is ignored, unless testator would not have made it had he known the falsity. |
| **Art. 851** | Partial institution | If instituted heir(s) receive only aliquot parts and parts don't cover the whole estate, intestate succession for the remainder. |
| **Art. 852** | Proportional increase | If testator intended instituted heirs to be sole heirs and their aliquot parts don't cover the whole estate (or free portion), increase each proportionally. |
| **Art. 853** | Proportional decrease | If aliquot parts exceed the whole estate (or free portion), reduce each proportionally. |
| **Art. 854** | Preterition | Omission of compulsory heir(s) in the **direct line** annuls the institution of heir; devises and legacies valid if not inofficious. If omitted heir predeceases testator, institution stands (subject to representation). |
| **Art. 855** | Underprovision | Omitted or underprovided compulsory heir's share taken first from undisposed estate, then proportionally from other compulsory heirs, then from voluntary heirs' shares. |
| **Art. 856** | Death before testator | Voluntary heir who predeceases transmits nothing. Compulsory heir who predeceases/renounces/is incapacitated transmits nothing except by representation or other Code provisions. |

### Substitution Articles

| Article | What It Governs | Key Text |
|---------|----------------|----------|
| **Art. 857** | Definition | "Substitution is the appointment of another heir so that he may enter into the inheritance in default of the heir originally instituted." |
| **Art. 858** | Types | (1) Simple/common; (2) Brief/compendious; (3) Reciprocal; (4) Fideicommissary. |
| **Art. 859** | Simple substitution | Substitute steps in if instituted heir dies before testator, refuses, or is incapacitated. A general statement (no specified cases) covers all three. |
| **Art. 860** | Multiple substitutes | Two or more persons may substitute one heir; one person may substitute two or more heirs. |
| **Art. 861** | Reciprocal substitution | Heirs with unequal shares substituting each other: substitute acquires the dying/renouncing heir's share. Multiple substitutes share in same proportion as their institution. |
| **Art. 862** | Charges carry over | Substitute subject to same charges/conditions as instituted heir, unless testator says otherwise or charges are personal to the original heir. |
| **Art. 863** | Fideicommissary | Fiduciary (first heir) must preserve and transmit to fideicommissary (second heir). Valid only if: (a) doesn't go beyond one degree from the originally instituted heir, (b) both fiduciary and fideicommissary alive at testator's death. Cannot burden the legitime. Must be express. |

### Conditional Disposition Articles

| Article | What It Governs | Key Text |
|---------|----------------|----------|
| **Art. 871** | Conditions allowed | "The institution of an heir may be made conditionally, or for a certain purpose or cause." |
| **Art. 872** | Legitime immune | "The testator cannot impose any charge, condition, or substitution whatsoever upon the legitimes prescribed in this Code. Should he do so, the same shall be considered as not imposed." |

---

## 1. Disposition Types — The Engine's Data Model

The engine must model three distinct types of testamentary dispositions:

### 1.1 Institution of Heirs (Universal Heirs)

An **institution** designates a person to succeed to the estate (or a fractional share of it) as a **universal heir**. Universal heirs step into the testator's shoes and inherit proportional rights AND obligations.

```
struct InstitutionOfHeir {
  heir: HeirReference,           // who
  share: ShareSpec,              // what portion
  conditions: Condition[],       // Art. 871 conditions (if any)
  substitutes: Substitute[],     // Arts. 857-863 substitutes
  is_residuary: bool,            // "the rest of my estate to..."
}

enum ShareSpec {
  Fraction(Rational),            // "I leave ½ to A"
  EqualWithOthers,               // "I leave to A, B, C equally" (Art. 846)
  EntireEstate,                  // "I leave everything to A"
  EntireFreePort,                // "I leave the free portion to A"
  Unspecified,                   // Named as heir, no share → equal (Art. 846)
  Residuary,                     // "the remainder to A" (Art. 851)
}
```

### 1.2 Legacies (Bequests of Personal Property)

A **legacy** is a testamentary gift of **personal property** (money, shares, jewelry, etc.) to a specific person (a legatee). The legatee is a **particular** successor, not a universal one — they acquire only the specific thing/amount, not a proportional share of rights and obligations.

```
struct Legacy {
  legatee: HeirReference,
  property: LegacySpec,          // specific amount, specific asset, or class
  conditions: Condition[],
  substitutes: Substitute[],
  is_preferred: bool,            // Art. 911: testator-designated preference in reduction
}

enum LegacySpec {
  FixedAmount(Decimal),          // "I leave ₱2,000,000 to F"
  SpecificAsset(AssetRef),       // "I leave my car to F"
  GenericClass(String, Decimal), // "I leave gold worth ₱500,000 to F"
}
```

### 1.3 Devises (Gifts of Real Property)

A **devise** is a testamentary gift of **real property** (land, buildings) to a specific person (a devisee). Also a particular successor.

```
struct Devise {
  devisee: HeirReference,
  property: DeviseSpec,
  conditions: Condition[],
  substitutes: Substitute[],
  is_preferred: bool,            // Art. 911 preference
}

enum DeviseSpec {
  SpecificProperty(AssetRef),    // "I leave my house in Makati to F"
  FractionalInterest(AssetRef, Rational), // "I leave ½ of my farm to F"
}
```

### 1.4 The Complete Will Model

```
struct Will {
  // Institutions — universal heirs
  institutions: InstitutionOfHeir[],

  // Legacies and devises — particular successors
  legacies: Legacy[],
  devises: Devise[],

  // Disinheritances (handled in separate analysis)
  disinheritances: Disinheritance[],

  // Metadata
  date_executed: Date,
  is_valid: bool,                // form validity (outside engine scope)
}
```

**Engine scope note**: The engine assumes the will has been probated and is formally valid. Form validation (witnesses, notarization, holographic requirements under Arts. 804-819) is outside scope. The engine handles **substantive** validation: does the will respect compulsory heirs' rights?

---

## 2. Heir Identification and Resolution

### 2.1 Identification Rules (Arts. 843-845)

The engine receives a pre-parsed will with identified heir references. However, the engine must handle:

```
function resolve_heir(ref: HeirReference, heirs: Heir[]) -> Heir | null {
  // Art. 843: match by name/surname
  match = find(heirs, h => h.name == ref.name)
  if match != null: return match

  // Art. 844: error in name — match by other circumstances
  match = find(heirs, h => ref.description_matches(h))
  if match != null: return match

  // Art. 844: ambiguous among multiple matches → none is an heir
  matches = find_all(heirs, h => ref.could_match(h))
  if len(matches) > 1: return null  // irresolvable ambiguity

  // Art. 845: unknown person → void unless identity becomes certain
  return null
}
```

### 2.2 Class Designations (Art. 845)

A will may designate a class of beneficiaries (e.g., "I leave ₱1,000,000 to the poor of Makati"). This is valid. The engine models class designations as:

```
struct ClassDesignation {
  class_description: String,
  amount_or_share: ShareSpec | LegacySpec,
  // Resolution: handled by the executor, not the engine
  // Engine flags this as requiring executor discretion
}
```

---

## 3. Share Allocation Rules

### 3.1 Default: Equal Parts (Art. 846)

When the will institutes multiple heirs without specifying shares, they inherit in **equal parts**.

```
function allocate_default_shares(institutions: InstitutionOfHeir[]) {
  unspecified = filter(institutions, i => i.share == Unspecified || i.share == EqualWithOthers)
  for each inst in unspecified:
    inst.share = Fraction(1 / len(unspecified))
}
```

### 3.2 Individual vs. Collective Designation (Art. 847)

"I designate A, B, and the children of C" — the children of C are individually instituted (one share each), not collectively sharing one share. Exception: clear contrary intent.

```
function expand_collective_designations(institutions: InstitutionOfHeir[]) -> InstitutionOfHeir[] {
  expanded = []
  for each inst in institutions:
    if inst.heir.is_collective:
      // Art. 847: expand to individuals UNLESS contrary intent
      if inst.heir.contrary_intent:
        expanded.push(inst)  // group shares one slot
      else:
        members = resolve_collective(inst.heir)  // e.g., children of C
        for each member in members:
          expanded.push(InstitutionOfHeir {
            heir: member,
            share: inst.share,  // will be recalculated
            conditions: inst.conditions,
            substitutes: inst.substitutes,
          })
    else:
      expanded.push(inst)
  return expanded
}
```

### 3.3 Proportional Adjustment (Arts. 851-853)

Three scenarios when instituted shares don't add up:

**Scenario A — Parts don't cover estate, testator intended sole heirs (Art. 852)**:
```
// "I leave ¼ to A and ¼ to B" — testator intended A and B to be sole heirs
// Total = ½, deficit = ½. Increase proportionally:
// A: ¼ / (¼+¼) = ½ of estate
// B: ¼ / (¼+¼) = ½ of estate

function proportional_increase(institutions: InstitutionOfHeir[], pool: Decimal) {
  total_specified = sum(inst.share.as_decimal() for inst in institutions)
  for each inst in institutions:
    inst.effective_share = (inst.share.as_decimal() / total_specified) * pool
}
```

**Scenario B — Parts don't cover estate, NOT intended as sole heirs (Art. 851)**:
```
// "I leave ⅓ to A" — no other heir instituted, A clearly not intended as sole heir
// A gets ⅓ of estate. Remaining ⅔ passes INTESTATE.
// Engine triggers: PARTIAL_INTESTATE for remaining (2/3)

function partial_intestate_remainder(institutions: InstitutionOfHeir[], estate: Decimal) -> Decimal {
  total_specified = sum(inst.share.as_decimal() for inst in institutions)
  if total_specified < 1.0:
    return (1.0 - total_specified) * estate  // this passes intestate
  return 0
}
```

**Scenario C — Parts exceed estate (Art. 853)**:
```
// "I leave ½ to A, ½ to B, ½ to C" — total = 150%
// Reduce proportionally:
// A: (½/1.5) = ⅓ of estate
// B: (½/1.5) = ⅓ of estate
// C: (½/1.5) = ⅓ of estate

function proportional_decrease(institutions: InstitutionOfHeir[], pool: Decimal) {
  total_specified = sum(inst.share.as_decimal() for inst in institutions)
  for each inst in institutions:
    inst.effective_share = (inst.share.as_decimal() / total_specified) * pool
}
```

**Key distinction — Art. 851 vs. 852**: The difference hinges on **testator intent**. Did the testator intend the named heirs to be his only heirs (Art. 852: proportional increase) or did he intend to name only some heirs and leave the rest undisposed (Art. 851: intestate for remainder)?

```
function adjust_shares(institutions: InstitutionOfHeir[], pool: Decimal, testator_intent: Intent) -> Decimal {
  total = sum(inst.share.as_decimal() for inst in institutions)

  if total == pool:
    return 0  // exact match, no adjustment

  if total < pool:
    if testator_intent == SOLE_HEIRS:
      proportional_increase(institutions, pool)   // Art. 852
      return 0
    else:
      // Art. 851: leave shares as-is, return remainder for intestate
      return pool - total

  if total > pool:
    proportional_decrease(institutions, pool)      // Art. 853
    return 0
}
```

### 3.4 Special Cases

**Art. 848**: Full/half blood siblings designated as heirs inherit equally (unlike intestate where full-blood gets double). Different only if will expresses contrary intent.

**Art. 849**: "I leave to A and A's children" — all are simultaneous co-heirs (not successive). They share equally per Art. 846 unless shares are specified.

**Art. 850**: False cause for institution is "not written" (ignored), UNLESS the testator would not have made the institution if he knew the cause was false. This is a factual determination outside engine scope — the engine should accept a flag:

```
struct InstitutionOfHeir {
  // ... other fields ...
  false_cause_declared: bool,    // court determined cause was false
  would_not_have_instituted: bool, // court determined testator wouldn't have made it
  // If both true: institution is VOID
}
```

---

## 4. Substitution of Heirs

### 4.1 Overview

Substitution is the engine's contingency mechanism. When an instituted heir can't or won't inherit, the engine checks for substitutes before falling back to accretion or intestate succession.

```
enum SubstitutionType {
  SIMPLE,          // Arts. 857, 859: substitute replaces original
  RECIPROCAL,      // Art. 861: co-heirs substitute each other
  FIDEICOMMISSARY, // Art. 863: fiduciary preserves & transmits to second heir
}

struct Substitute {
  type: SubstitutionType,
  substitute_heir: HeirReference,
  triggers: SubstitutionTrigger[],  // predecease, renunciation, incapacity (Art. 859)
}

enum SubstitutionTrigger {
  PREDECEASE,      // heir died before testator
  RENUNCIATION,    // heir refuses inheritance
  INCAPACITY,      // heir legally incapable (Art. 1027, 1032)
  ALL,             // Art. 859: general statement = all three
}
```

### 4.2 Simple Substitution Resolution (Arts. 859-860, 862)

```
function resolve_substitution(
  institution: InstitutionOfHeir,
  heir_status: HeirStatus
) -> HeirReference | null {

  if heir_status == ALIVE_AND_WILLING:
    return institution.heir  // no substitution needed

  // Check if a substitution trigger matches
  trigger = match heir_status {
    PREDECEASED => PREDECEASE,
    RENOUNCED => RENUNCIATION,
    INCAPACITATED => INCAPACITY,
  }

  for each sub in institution.substitutes:
    if sub.type == SIMPLE || sub.type == RECIPROCAL:
      if trigger in sub.triggers || ALL in sub.triggers:
        // Art. 862: substitute inherits with same charges/conditions
        // unless testator said otherwise or charges are personal
        return sub.substitute_heir

  return null  // no substitute → falls to accretion (Art. 1016) or intestate (Art. 1022)
}
```

### 4.3 Reciprocal Substitution (Art. 861)

When heirs are reciprocally substituted:

```
function resolve_reciprocal(
  institutions: InstitutionOfHeir[],
  vacant_index: int
) -> InstitutionOfHeir[] {
  vacant = institutions[vacant_index]
  remaining = filter(institutions, i => i != vacant AND i.heir is alive/willing)

  // Art. 861: substitute acquires the vacant heir's share
  // If multiple substitutes: they share in same proportion as their institution
  total_remaining = sum(r.effective_share for r in remaining)
  for each r in remaining:
    bonus = vacant.effective_share * (r.effective_share / total_remaining)
    r.effective_share += bonus

  return remaining
}
```

### 4.4 Fideicommissary Substitution (Art. 863)

The most complex substitution type. The fiduciary is **obligated to preserve** the property and transmit it to the fideicommissary.

```
struct FideicommissarySubstitution {
  fiduciary: HeirReference,      // first heir — obligated to preserve
  fideicommissary: HeirReference, // second heir — ultimate beneficiary
  property_scope: ShareSpec,     // what must be preserved

  // Validity requirements (Art. 863):
  // (1) Does not go beyond one degree from originally instituted heir
  // (2) Both fiduciary and fideicommissary alive at testator's death
  // (3) Must be express (not implied)
  // (4) CANNOT burden the legitime
}

function validate_fideicommissary(sub: FideicommissarySubstitution, estate_context: EstateContext) -> ValidationResult {
  // Check: both alive at death
  if NOT sub.fiduciary.is_alive_at(estate_context.date_of_death):
    return INVALID("Fiduciary not alive at testator's death")
  if NOT sub.fideicommissary.is_alive_at(estate_context.date_of_death):
    return INVALID("Fideicommissary not alive at testator's death")

  // Check: one degree limit
  // "One degree" means the fideicommissary must be one generation from the fiduciary
  // (child/parent relationship), OR per broader interpretation, one transfer only
  // Engine: flag ambiguous cases for legal review

  // Check: does NOT burden legitime
  if sub.property_scope overlaps with any compulsory heir's legitime:
    return INVALID("Fideicommissary substitution cannot burden the legitime (Art. 863)")

  return VALID
}
```

**Engine impact**: Fideicommissary substitution doesn't change the *initial* distribution amounts. It imposes a **post-distribution obligation** on the fiduciary. The engine should:
1. Distribute to the fiduciary as if they were a normal heir
2. Flag the distribution with the fideicommissary obligation
3. Note in the narrative: "This share is subject to a fideicommissary substitution — [fiduciary] must preserve and transmit to [fideicommissary]"

### 4.5 Resolution Priority

When an instituted heir cannot inherit, the engine resolves in this order:

```
function resolve_vacant_institution(
  institution: InstitutionOfHeir,
  all_institutions: InstitutionOfHeir[],
  estate_context: EstateContext
) -> Resolution {

  // Step 1: Check for substitution (Arts. 857-863)
  substitute = resolve_substitution(institution, heir_status)
  if substitute != null:
    return SUBSTITUTE(substitute)

  // Step 2: Check for accretion (Arts. 1015-1017)
  // Accretion applies when co-heirs are called to the same portion pro indiviso
  if can_accrete(institution, all_institutions):
    return ACCRETION(co_heirs)

  // Step 3: Fall to intestate for the vacant portion (Art. 1022(2))
  return INTESTATE(institution.effective_share)
}
```

Art. 1022 explicitly codifies this order: (1) substitution first, (2) if no substitution, vacant portion passes to legal heirs with same charges and obligations.

---

## 5. Conditional and Modal Institutions

### 5.1 Conditions (Art. 871)

The testator may attach conditions to an institution. The engine models:

```
struct Condition {
  type: ConditionType,
  description: String,
  status: ConditionStatus,
}

enum ConditionType {
  SUSPENSIVE,     // heir inherits only IF condition fulfilled
  RESOLUTORY,     // heir inherits immediately but loses if condition occurs
  MODAL,          // heir must fulfill a purpose/obligation (not a true condition)
}

enum ConditionStatus {
  PENDING,        // not yet determined
  FULFILLED,      // condition met → heir inherits (suspensive) or loses (resolutory)
  FAILED,         // condition failed → heir doesn't inherit (suspensive) or keeps (resolutory)
  NOT_APPLICABLE, // condition removed per Art. 872 or invalid
}
```

### 5.2 The Legitime Immunity Rule (Art. 872)

**Critical for engine**: The testator CANNOT impose conditions, charges, or substitutions on the **legitime**. If he does, they are deemed **not imposed**.

```
function sanitize_conditions(
  institution: InstitutionOfHeir,
  heir: Heir
) -> InstitutionOfHeir {
  if heir.is_compulsory:
    // Art. 872: strip ALL conditions from the legitime portion
    // Conditions may still apply to the FREE PORTION share the heir receives
    institution.conditions_on_legitime = []  // considered not imposed
    // Conditions on free portion share remain valid
  return institution
}
```

**Engine implication**: When a compulsory heir is instituted with conditions, the engine must split:
- **Legitime portion**: unconditional — heir gets it regardless
- **Free portion share** (if any): conditions apply per testator's intent

### 5.3 Invalid Conditions

The following conditions are void (deemed not imposed, but institution remains valid):
- Impossible conditions (physical or legal impossibility)
- Conditions contrary to law or good customs
- Absolute prohibition against marriage (with narrow exceptions)
- Requiring heir to make testamentary provisions for testator/third party

**Engine approach**: Accept a `condition.is_valid` flag (legal validity determined outside engine scope). If invalid, treat as not imposed.

### 5.4 Suspensive Condition Failure → Intestate (Art. 960(3))

If a suspensive condition on an institution fails:
- The institution is ineffective
- Check for substitution first
- Then accretion
- Then intestate succession for that portion

```
function handle_condition_failure(institution: InstitutionOfHeir) -> Resolution {
  if institution.conditions.any(c => c.type == SUSPENSIVE && c.status == FAILED):
    return resolve_vacant_institution(institution, ...)  // same as death/incapacity
  return INSTITUTION_EFFECTIVE
}
```

---

## 6. Preterition — Omission of Compulsory Heirs (Art. 854)

### 6.1 Definition and Scope

Preterition is the **total omission** of a compulsory heir **in the direct line** (legitimate children/descendants, or legitimate parents/ascendants) from the will. The heir is neither instituted, nor given a legacy/devise, nor disinherited.

**Critical distinctions**:
- Applies ONLY to compulsory heirs in the **direct line** (up/down)
- Does NOT apply to surviving spouse or illegitimate children (they are not in the direct line)
- Must be **total** omission — any provision (however small) prevents preterition
- Applies to heirs born **after** the will's execution but before testator's death

### 6.2 Effect of Preterition

```
function check_preterition(will: Will, heirs: Heir[]) -> PreteritionResult {
  direct_line_compulsory = filter(heirs, h =>
    h.is_compulsory &&
    (h.category == LEGITIMATE_CHILD_GROUP || h.category == LEGITIMATE_ASCENDANT_GROUP) &&
    h.is_alive_at_death
  )

  preterited = []
  for each heir in direct_line_compulsory:
    is_instituted = any(will.institutions, i => i.heir == heir)
    has_legacy = any(will.legacies, l => l.legatee == heir)
    has_devise = any(will.devises, d => d.devisee == heir)
    is_disinherited = any(will.disinheritances, d => d.heir == heir)

    if NOT is_instituted AND NOT has_legacy AND NOT has_devise AND NOT is_disinherited:
      preterited.push(heir)

  if len(preterited) == 0:
    return NO_PRETERITION

  // Art. 854: preterition ANNULS the institution of heir
  return PRETERITION {
    preterited_heirs: preterited,
    effect: ANNUL_INSTITUTION,
    // BUT: legacies and devises remain valid (if not inofficious)
    surviving_legacies: will.legacies,  // subject to Art. 911 inofficiousness check
    surviving_devises: will.devises,    // subject to Art. 911 inofficiousness check
  }
}
```

### 6.3 Distribution After Preterition

When preterition annuls the institution:

```
function distribute_after_preterition(
  estate: Decimal,
  will: Will,
  heirs: Heir[],
  preterition: PreteritionResult
) -> Distribution {

  // Step 1: Honor surviving legacies/devises (if not inofficious)
  // First compute what compulsory heirs are entitled to under intestate rules
  intestate_shares = compute_intestate_distribution(estate, heirs)

  // Step 2: Check if legacies/devises impair any compulsory heir's share
  total_legacies = sum(l.amount for l in preterition.surviving_legacies)
  total_devises = sum(d.value for d in preterition.surviving_devises)
  total_testamentary = total_legacies + total_devises

  // The remaining estate after legacies/devises distributes intestate
  remaining = estate - total_testamentary

  // Check: does the remaining estate satisfy all compulsory heirs' legitimes?
  total_legitime = sum(compute_legitime(h, heirs) for h in compulsory_heirs(heirs))
  if remaining < total_legitime:
    // Legacies/devises are inofficious — reduce per Art. 911
    reduction_needed = total_legitime - remaining
    reduce_testamentary_dispositions(preterition.surviving_legacies, preterition.surviving_devises, reduction_needed)

  // Step 3: Distribute remaining estate per intestate rules
  // NOTE: The annulment converts the entire institution to intestate
  // Surviving legacies/devises are honored, remainder is intestate
  return intestate_with_legacies(estate, heirs, preterition.surviving_legacies, preterition.surviving_devises)
}
```

### 6.4 Preterited Heir Predeceases (Art. 854 ¶2)

If the omitted compulsory heir dies before the testator, the preterition is moot — the institution stands. But representation may still apply:

```
if preterited_heir.predeceased:
  if has_representatives(preterited_heir):
    // Representatives step in — check if THEY are also preterited
    // If representatives are also omitted: preterition applies through them
    // If representatives are provided for in the will: no preterition
  else:
    // No representative, heir predeceased: institution stands (Art. 854 ¶2)
```

---

## 7. Underprovision of Compulsory Heirs (Art. 855)

When a compulsory heir is given *something* in the will (preventing preterition) but less than their legitime:

```
function resolve_underprovision(
  heir: Heir,
  will_provision: Decimal,    // what the will gives them
  legitime: Decimal           // what they're entitled to
) -> UnderprovisionResult {

  if will_provision >= legitime:
    return NO_UNDERPROVISION

  deficit = legitime - will_provision

  // Art. 855: make up the deficit from 3 sources, in order:
  // Source 1: undisposed estate (not covered by will)
  // Source 2: proportional reduction of other compulsory heirs' shares
  // Source 3: proportional reduction of voluntary heirs' shares

  return UNDERPROVISION {
    heir: heir,
    deficit: deficit,
    recovery_sources: [UNDISPOSED, COMPULSORY_HEIRS_PRO_RATA, VOLUNTARY_HEIRS_PRO_RATA]
  }
}
```

The Art. 855 recovery algorithm:

```
function recover_underprovision(
  deficit: Decimal,
  undisposed: Decimal,
  compulsory_shares: Map<Heir, Decimal>,
  voluntary_shares: Map<Heir, Decimal>
) -> RecoveryPlan {
  remaining_deficit = deficit

  // Source 1: undisposed estate
  from_undisposed = min(remaining_deficit, undisposed)
  remaining_deficit -= from_undisposed

  if remaining_deficit <= 0:
    return plan

  // Source 2: pro rata from other compulsory heirs (only the EXCESS above their own legitime)
  // Only reduce what they received ABOVE their own legitime
  excess_shares = {}
  for each (h, share) in compulsory_shares:
    h_legitime = compute_legitime(h)
    if share > h_legitime:
      excess_shares[h] = share - h_legitime

  total_excess = sum(excess_shares.values())
  if total_excess > 0:
    from_compulsory = min(remaining_deficit, total_excess)
    for each (h, excess) in excess_shares:
      h_reduction = from_compulsory * (excess / total_excess)
      // reduce h's share by h_reduction
    remaining_deficit -= from_compulsory

  if remaining_deficit <= 0:
    return plan

  // Source 3: pro rata from voluntary heirs
  total_voluntary = sum(voluntary_shares.values())
  if total_voluntary > 0:
    from_voluntary = min(remaining_deficit, total_voluntary)
    for each (h, share) in voluntary_shares:
      h_reduction = from_voluntary * (share / total_voluntary)
      // reduce h's share by h_reduction
    remaining_deficit -= from_voluntary

  return plan
}
```

---

## 8. Death/Incapacity of Instituted Heirs (Art. 856)

### 8.1 Voluntary Heir Predeceases

A voluntary heir who dies before the testator transmits **nothing** to his own heirs. The institution lapses.

```
if heir.is_voluntary AND heir.predeceased:
  // Institution lapses entirely
  // Resolution: substitution → accretion → intestate (per §4.5 above)
```

### 8.2 Compulsory Heir Predeceases

A compulsory heir who predeceases, is incapacitated, or renounces transmits nothing to their own heirs — **except**:
- **Representation** (Arts. 970-977): descendants of the predeceased compulsory heir may represent them
- **Art. 1035**: if excluded for incapacity/unworthiness, their children/descendants acquire their legitime right

```
if heir.is_compulsory AND (heir.predeceased OR heir.incapacitated):
  if has_representatives(heir):
    // Representatives take heir's place per representation rules
    // (already analyzed in representation-rights)
    return REPRESENTED(representatives)
  else:
    // No representation possible — heir's share:
    // Legitime portion: accrue to other compulsory heirs in same class (Art. 1021)
    // Free portion share: substitution → accretion → intestate
```

---

## 9. The Complete Will-Execution Algorithm

The master algorithm for testate distribution:

```
function execute_will(
  estate: Decimal,
  will: Will,
  heirs: Heir[]
) -> Distribution {

  // ═══════════════════════════════════════════
  // PHASE 1: VALIDATION AND PREPROCESSING
  // ═══════════════════════════════════════════

  // Step 1.1: Resolve heir identities (Arts. 843-845)
  resolve_all_heir_references(will, heirs)

  // Step 1.2: Expand collective designations (Art. 847)
  will.institutions = expand_collective_designations(will.institutions)

  // Step 1.3: Check for preterition (Art. 854)
  preterition = check_preterition(will, heirs)
  if preterition.exists:
    return distribute_after_preterition(estate, will, heirs, preterition)

  // Step 1.4: Process disinheritances
  // (Handled in disinheritance-rules analysis)
  apply_disinheritances(will, heirs)

  // Step 1.5: Resolve heir status (alive? willing? capacitated?)
  for each institution in will.institutions:
    if institution.heir is dead/incapacitated/renouncing:
      resolution = resolve_vacant_institution(institution, will.institutions, context)
      apply_resolution(resolution, institution)

  // Step 1.6: Strip conditions from legitime portions (Art. 872)
  for each institution in will.institutions:
    if institution.heir.is_compulsory:
      sanitize_conditions(institution, institution.heir)

  // Step 1.7: Handle condition failures (Art. 960(3))
  for each institution in will.institutions:
    handle_condition_failure(institution)

  // ═══════════════════════════════════════════
  // PHASE 2: LEGITIME COMPUTATION
  // ═══════════════════════════════════════════

  // Step 2.1: Classify surviving heirs
  scenario = determine_scenario(heirs)  // T1-T15

  // Step 2.2: Compute each compulsory heir's legitime
  // (Uses legitime-table rules from Wave 3 analysis)
  legitimes = compute_all_legitimes(estate, heirs, scenario)

  // Step 2.3: Compute free portion
  total_legitime = sum(legitimes.values())
  free_portion = estate - total_legitime

  // ═══════════════════════════════════════════
  // PHASE 3: WILL DISPOSITION ANALYSIS
  // ═══════════════════════════════════════════

  // Step 3.1: Compute total testamentary burden
  // Legacies + devises = fixed amounts from the estate
  total_legacies = sum(l.amount for l in will.legacies)
  total_devises = sum(d.value for d in will.devises)

  // Step 3.2: Classify institution shares
  // Separate compulsory heirs' institutions from voluntary heirs'
  compulsory_institutions = filter(will.institutions, i => i.heir.is_compulsory)
  voluntary_institutions = filter(will.institutions, i => NOT i.heir.is_compulsory)

  // Step 3.3: Determine the pool available for voluntary dispositions
  voluntary_pool = free_portion  // voluntary heirs can only receive from free portion

  // Step 3.4: Check if legacies/devises fit within free portion
  testamentary_fixed = total_legacies + total_devises
  if testamentary_fixed > free_portion:
    // INOFFICIOUS — reduce per Art. 911 (analyzed in free-portion-rules)
    reduce_inofficious(will.legacies, will.devises, free_portion)
    testamentary_fixed = free_portion  // after reduction

  // Step 3.5: Remaining free portion for voluntary institution heirs
  remaining_fp = free_portion - testamentary_fixed

  // ═══════════════════════════════════════════
  // PHASE 4: SHARE ALLOCATION
  // ═══════════════════════════════════════════

  // Step 4.1: Allocate compulsory heirs' shares
  // Each compulsory heir receives AT LEAST their legitime
  // If will gives them more (from free portion), they get the higher amount
  distribution = {}
  for each (heir, legitime) in legitimes:
    will_share = get_will_provision(will, heir)  // what will says they get
    distribution[heir] = {
      legitime: legitime,
      from_will: max(will_share, legitime),
      source_explanation: ...
    }

  // Step 4.2: Allocate voluntary heirs' shares from remaining free portion
  // Apply proportional adjustment (Arts. 851-853)
  voluntary_shares = allocate_voluntary_shares(voluntary_institutions, remaining_fp)
  for each (heir, share) in voluntary_shares:
    distribution[heir] = { from_will: share }

  // Step 4.3: Allocate legacies and devises
  for each legacy in will.legacies:
    distribution[legacy.legatee] = { from_will: legacy.effective_amount }
  for each devise in will.devises:
    distribution[devise.devisee] = { from_will: devise.effective_value }

  // Step 4.4: Check for underprovision (Art. 855)
  for each (heir, legitime) in legitimes:
    if distribution[heir].from_will < legitime:
      resolve_underprovision(heir, distribution[heir].from_will, legitime)

  // Step 4.5: Handle undisposed remainder (Art. 851, 960(2))
  total_disposed = sum(d.from_will for d in distribution.values())
  if total_disposed < estate:
    // Mixed succession: remainder distributes intestate
    remainder = estate - total_disposed
    intestate_shares = compute_intestate_distribution(remainder, heirs)
    merge_distributions(distribution, intestate_shares)

  // ═══════════════════════════════════════════
  // PHASE 5: NARRATIVE GENERATION
  // ═══════════════════════════════════════════

  for each (heir, shares) in distribution:
    generate_narrative(heir, shares, scenario, will)

  return distribution
}
```

---

## 10. Key Interactions with Other Engine Components

### 10.1 Interaction with Legitime System

| Rule | Interaction |
|------|------------|
| Art. 842 | Will cannot contravene legitime — engine validates all dispositions against legitime floor |
| Art. 872 | Conditions on legitime are void — engine strips them |
| Art. 895 ¶3 | Illegitimate children's legitime from FP, spouse first — priority pipeline from free-portion-rules applies |
| Art. 911 | Inofficious dispositions reduced — free-portion-rules reduction algorithm applies |

### 10.2 Interaction with Intestate Fallback

| Trigger | What Happens |
|---------|-------------|
| Art. 841 | Will with no institution → legacies/devises honored, rest intestate |
| Art. 851 | Partial institution → instituted shares honored, remainder intestate |
| Art. 854 | Preterition → institution annulled, legacies/devises survive, rest intestate |
| Art. 960(2) | Will doesn't cover entire estate → undisposed portion intestate |
| Art. 960(3) | Suspensive condition fails → that portion intestate |
| Art. 960(4) | Instituted heir incapable, no substitute → that portion intestate |

### 10.3 Interaction with Representation

- Compulsory heirs who predecease may be represented (Arts. 970-977)
- Representation applies to both the LEGITIME portion and the WILL-INSTITUTED portion (if the compulsory heir was also named in the will)
- For voluntary heirs: NO representation (Art. 856: transmits nothing)

### 10.4 Interaction with Accretion

- Art. 1021: among compulsory heirs, accretion of the **legitime** happens "in their own right" (not by accretion right), meaning they divide it as if the missing heir never existed
- Art. 1021: accretion of the **free portion** happens among co-heirs of the free portion
- Art. 1016-1017: accretion in testate requires co-heirs called to the same portion pro indiviso

---

## Edge Cases

### E1: Will with NO Institution — Only Legacies/Devises (Art. 841)

The will contains only legacies and devises, no institution of heirs. The will is valid. Legacies/devises are honored (if not inofficious). The entire remaining estate passes intestate. See Example 6 in worked-examples.md.

### E2: All Instituted Heirs Predecease or Refuse (Art. 841)

If every instituted heir can't or won't accept, and there are no substitutes, the entire estate passes intestate. Legacies/devises survive if not inofficious.

### E3: Contradictory Dispositions

If the will contains inconsistent instructions (e.g., "I leave my house to A" and "I leave my house to B"), this is a will interpretation issue outside engine scope. The engine should accept the court-resolved disposition as input.

### E4: Residuary Institution

"I leave the rest of my estate to A" — A gets whatever is left after all specific legacies, devises, and legitimes are satisfied. This is common and the engine should handle it naturally via the `Residuary` share spec.

```
if institution.share == Residuary:
  institution.effective_share = estate - total_legacies - total_devises - total_legitimes - other_institutions
```

### E5: Mixed Compulsory/Voluntary — Heir Instituted Above Legitime

A compulsory heir may be instituted to receive MORE than their legitime. The excess comes from the free portion. Example: will says "I leave 80% to my only child" — child's legitime is 50%, the extra 30% is from the free portion. This is valid (Art. 842).

### E6: Compulsory Heir Renounces Institution But Claims Legitime

A compulsory heir may renounce their *voluntary/testamentary* share but still claim their *compulsory* legitime. The engine must track the two components separately:
- Legitime: irrenounce-able via the will (it's a right by law, Art. 886)
- Free portion share: renounceable

**Correction**: The heir CAN renounce the entire inheritance (including legitime) per Art. 1041. But they cannot be forced to renounce the legitime by the testator's conditions (Art. 872). If they voluntarily renounce everything, both parts are gone.

### E7: Institution of an Incapacitated Person (Art. 1027)

If the instituted heir is incapacitated (e.g., the priest who heard the testator's last confession), the institution is void for that heir. Substitution → accretion → intestate for that portion.

### E8: Art. 786 — Delegation to Third Person for Distribution

Testator may delegate distribution of **specific property or sums** to a third person, but only to "specified classes or causes." The engine should accept the third person's distribution decisions as input (executor discretion outside engine scope).

### E9: After-Acquired Property (Art. 793)

Property acquired after making the will passes through the will ONLY if the will expressly says so. Otherwise, after-acquired property passes intestate.

---

## Data Model Additions

```
// New types for this analysis

struct TestamentaryDispositionResult {
  heir: Heir,
  disposition_type: DispositionType,  // INSTITUTION, LEGACY, DEVISE
  from_legitime: Decimal,             // compulsory portion (if compulsory heir)
  from_free_portion: Decimal,         // voluntary portion (from will)
  from_intestate: Decimal,            // if mixed succession applies
  total: Decimal,
  conditions: Condition[],            // surviving conditions (after Art. 872 strip)
  fideicommissary: FideicommissarySubstitution | null,
  narrative: String,
}

enum DispositionType {
  INSTITUTION,      // universal heir (fractional share)
  LEGACY,           // particular — personal property
  DEVISE,           // particular — real property
  INTESTATE,        // from intestate fallback
  LEGITIME_ONLY,    // compulsory heir not in will, gets only legitime
}

enum TestatorIntent {
  SOLE_HEIRS,       // Art. 852: intended named heirs to take everything
  PARTIAL,          // Art. 851: named some heirs, left rest undisposed
  AMBIGUOUS,        // cannot determine — flag for executor/court
}
```

---

## Test Implications

### Share Allocation Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TI-1 | Equal shares default (Art. 846) | Will: "I institute A, B, C as my heirs." No shares specified. Estate ₱9M. No compulsory heirs. | A=₱3M, B=₱3M, C=₱3M |
| T-TI-2 | Proportional increase (Art. 852) | Will: "⅓ to A, ⅓ to B" (intended as sole heirs). Estate ₱9M. No compulsory heirs. | A=₱4.5M, B=₱4.5M (each increased from ⅓ to ½) |
| T-TI-3 | Proportional decrease (Art. 853) | Will: "½ to A, ½ to B, ½ to C." Estate ₱9M. No compulsory heirs. | A=₱3M, B=₱3M, C=₱3M (each reduced from ½ to ⅓) |
| T-TI-4 | Partial institution → intestate (Art. 851) | Will: "⅓ to A" (not intended as sole heir). Estate ₱9M. Legal heirs: parents P1, P2. | A=₱3M from will. Parents: ₱6M remainder split intestate (₱3M each per Art. 997 modified) |
| T-TI-5 | Collective designation expansion (Art. 847) | Will: "I institute A, B, and the children of C." C has 3 children. Estate ₱10M. No compulsory heirs. | 5 equal shares: A=₱2M, B=₱2M, C1=₱2M, C2=₱2M, C3=₱2M |

### Substitution Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TI-6 | Simple substitution (Art. 859) | Will: "½ to A, ½ to B. If A cannot inherit, C shall take A's place." A predeceased. Estate ₱10M. | B=₱5M, C=₱5M |
| T-TI-7 | Reciprocal substitution (Art. 861) | Will: "⅔ to A, ⅓ to B, reciprocally substituted." A predeceased. Estate ₱9M. | B=₱9M (acquires A's ⅔ + own ⅓) |
| T-TI-8 | No substitute → intestate (Art. 1022) | Will: "½ to A, ½ to B." A predeceased. No substitute. No accretion. Estate ₱10M. Legal heirs: parent P. | B=₱5M, P=₱5M (intestate for A's portion) |

### Preterition Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TI-9 | Preterition annuls institution (Art. 854) | 3 children LC1-3, spouse S. Will: "All to LC1 and LC2." LC3 omitted. Estate ₱12M. | Institution annulled. Intestate: each of 4 heirs gets ₱3M (Art. 996). |
| T-TI-10 | Preterition preserves legacies (Art. 854) | 2 children LC1-2. Will: "All to LC1. Legacy of ₱1M to friend F." LC2 omitted. Estate ₱10M. | Institution annulled. Legacy ₱1M to F survives (≤ FP). Remaining ₱9M intestate: LC1=₱4.5M, LC2=₱4.5M. |
| T-TI-11 | Omitted heir predeceased (Art. 854 ¶2) | 2 children LC1-2. Will: "All to LC1." LC2 omitted but predeceased, no representatives. Estate ₱10M. | No preterition (heir predeceased). Institution valid. LC1=₱10M (only heir). |
| T-TI-12 | Spouse omission ≠ preterition | 1 child LC1, spouse S. Will: "All to LC1." S not mentioned. Estate ₱10M. | NOT preterition (spouse not in direct line). LC1's legitime=₱5M, S's legitime=₱2.5M. Will gives excess to LC1: LC1=₱7.5M, S=₱2.5M. |

### Underprovision Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TI-13 | Underprovision recovery (Art. 855) | 2 children LC1-2. Will: "₱1M to LC1, rest to friend F." Estate ₱10M. | LC1 legitime=₱2.5M but only given ₱1M. Deficit ₱1.5M. LC2 legitime=₱2.5M. F's share reduced from ₱9M to free portion ₱5M, then further to cover LC1 deficit. Final: LC1=₱2.5M, LC2=₱2.5M, F=₱5M. |

### Condition Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TI-14 | Condition on legitime stripped (Art. 872) | 1 child LC1. Will: "LC1 inherits on condition he graduates law school." Estate ₱10M. | Condition deemed not imposed on legitime (₱5M). LC1 gets ₱5M unconditionally. Condition may apply to any free portion share. |
| T-TI-15 | Suspensive condition fails (Art. 960(3)) | No compulsory heirs. Will: "If A passes the bar, A gets ½." A fails bar. Estate ₱10M. No substitute. | A gets nothing. ₱5M passes intestate. |

### Art. 856 Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TI-16 | Voluntary heir predeceases (Art. 856) | No compulsory heirs. Will: "½ to A, ½ to B." A predeceases. No substitute. Estate ₱10M. | A transmits nothing. B=₱5M. A's ₱5M → accretion (if Art. 1016 applies) or intestate. |
| T-TI-17 | Compulsory heir represented (Arts. 856, 970) | 2 children LC1-2. LC1 predeceased with children GC1-2. Will: "Equal shares to my children." Estate ₱10M. | GC1 and GC2 represent LC1. Will reads as: LC1-line=₱5M (GC1=₱2.5M, GC2=₱2.5M), LC2=₱5M. |

### Mixed Succession Tests

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-TI-18 | Will with only legacies (Art. 841) | 2 children LC1-2, spouse S. Will: "Legacy of ₱1M to friend F." No institution. Estate ₱10M. | F=₱1M (legacy). Remaining ₱9M intestate: LC1=₱3M, LC2=₱3M, S=₱3M. |
| T-TI-19 | Residuary institution | 1 child LC1. Will: "₱2M legacy to F. Remainder to my charity C." Estate ₱10M. | LC1 legitime=₱5M, S=none. F=₱2M (from FP). C residuary=₱10M-₱5M-₱2M=₱3M. LC1=₱5M. |

---

## Narrative Templates

### Institution of Universal Heir

> **{name} ({relationship}, voluntary heir)** receives **₱{amount}**.
> The testator's will institutes {name} as an heir to {share_description} of the estate. {If proportional adjustment applied: "Under Art. {852|853}, the specified shares were {increased|reduced} proportionally to equal the {whole estate|free portion}."} {If compulsory heirs exist: "This disposition is within the free portion (₱{fp}) available after satisfying all compulsory heirs' legitimes."}

### Compulsory Heir — Instituted Above Legitime

> **{name} ({relationship}, compulsory heir)** receives **₱{total}**.
> As a {category} (Art. {article}), {name} is entitled to a minimum legitime of ₱{legitime}. The testator's will grants {name} ₱{will_amount}, which exceeds the legitime. The excess of ₱{excess} comes from the testator's free portion, which the testator may dispose of freely under Art. 842.

### Compulsory Heir — Not Mentioned in Will

> **{name} ({relationship}, compulsory heir)** receives **₱{legitime}**.
> Although {name} was not specifically mentioned in the testator's will, as a {category} (Art. {article}), {name} is a compulsory heir entitled to a legitime of ₱{legitime} under Art. {legitime_article}. {If spouse/IC: "This omission does not constitute preterition under Art. 854, which applies only to compulsory heirs in the direct line (children/descendants or parents/ascendants)."}

### Legacy/Devise Recipient

> **{name} (legatee/devisee)** receives **₱{amount}**.
> The testator's will provides a {legacy|devise} of {description} to {name}. {If reduced: "Under Art. 911, this {legacy|devise} was reduced from ₱{original} to ₱{reduced} because the original amount would impair the compulsory heirs' legitime. The free portion available for testamentary dispositions is ₱{fp}."}

### Substitution Applied

> **{substitute_name}** receives **₱{amount}** (as substitute for {original_name}).
> The testator's will originally instituted {original_name} as heir. However, {original_name} {predeceased the testator | renounced the inheritance | was incapacitated to succeed}. Under Art. 859, {substitute_name} was designated as substitute and takes {original_name}'s place, receiving the same share of ₱{amount}. {If Art. 862 applies: "The charges and conditions imposed on {original_name} apply equally to {substitute_name} under Art. 862."}

---

*Analysis based on Civil Code of the Philippines (RA 386), Book III, Title IV, Chapter 2, Sections 5-7.*
