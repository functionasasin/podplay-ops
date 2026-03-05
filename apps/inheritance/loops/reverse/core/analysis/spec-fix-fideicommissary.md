# Spec Fix: Fideicommissary Substitution Validity Requirements

**Aspect**: spec-fix-fideicommissary
**Wave**: 6 (Spec Fixes)
**Primary Legal Basis**: Art. 863, Civil Code; Art. 872 (legitime immunity)
**Depends On**: testate-institution, data-model, testate-validation
**Fixes**: spec-review gap C4

---

## Problem

Spec §3.3 defines `SubstitutionType.FIDEICOMMISSARY` as an enum value and `Substitute` struct but does not:
1. Define the `FideicommissarySubstitution` struct with its validity fields
2. Specify Art. 863's 4 validity conditions
3. Provide a `validate_fideicommissary()` function
4. Describe the engine's treatment of valid vs. invalid fideicommissary substitutions
5. Document the interaction with Art. 872 (legitime immunity)

A developer reading only the spec would see `FIDEICOMMISSARY` as a substitution type but have no way to validate or enforce it.

---

## Art. 863 — The Four Validity Conditions

Art. 863 (Civil Code):
> "A fideicommissary substitution by virtue of which the fiduciary or first heir instituted is entrusted with the obligation to preserve and to transmit to a second heir the whole or part of the inheritance, shall be valid and shall take effect, provided such substitution does not go beyond one degree from the heir originally instituted, and provided further that the fiduciary or first heir and the second heir are living at the time of the death of the testator."

Combined with Art. 872:
> "The testator cannot impose any charge, condition, or substitution whatsoever upon the legitimes prescribed in this Code. Should he do so, the same shall be considered as not imposed."

### Condition 1: One-Degree Limit

The fideicommissary must be **one degree** from the fiduciary (the originally instituted heir). Philippine jurisprudence interprets "one degree" as **one generation** — the fideicommissary must be a child or parent of the fiduciary, not a grandchild or more remote relative.

```
function check_one_degree(fiduciary: Person, fideicommissary: Person) -> bool {
    // One degree = one generation gap (parent-child relationship)
    return is_parent_of(fiduciary, fideicommissary)
        OR is_parent_of(fideicommissary, fiduciary)
}
```

**Edge case**: Some scholars argue "one degree" means "one transfer" (any two persons). The engine adopts the **majority interpretation** (one generation) and flags ambiguous cases where the parties are related but not by parent-child for manual review.

### Condition 2: Both Alive at Testator's Death

Both the fiduciary and the fideicommissary must be **living at the time of the testator's death**. If either has predeceased the testator, the fideicommissary substitution is void.

```
function check_both_alive(
    fiduciary: Person,
    fideicommissary: Person,
    date_of_death: Date
) -> bool {
    return fiduciary.is_alive_at(date_of_death)
       AND fideicommissary.is_alive_at(date_of_death)
}
```

**Note**: Unlike simple substitution (which triggers on predecease), fideicommissary substitution **requires** both parties alive. If the fideicommissary predeceases, the fiduciary's obligation is extinguished — they keep the property free of the fideicommissary burden.

### Condition 3: Express Only

The fideicommissary substitution must be **expressly stated** in the will. It cannot be implied from ambiguous language. The engine receives this as an input flag:

```
is_express: bool    // true if the will explicitly creates a fideicommissary obligation
```

If `is_express == false`, the substitution is void. The engine does not attempt to infer fideicommissary intent from will language — that is the probate court's role.

### Condition 4: Cannot Burden Legitime

Art. 872 + Art. 863: The fideicommissary substitution **cannot burden the legitime** of any compulsory heir. It can only apply to the free portion.

```
function check_no_legitime_burden(
    fideicommissary_scope: ShareSpec,
    fiduciary: Heir,
    legitimes: Map<HeirId, Fraction>
) -> bool {
    if fiduciary.is_compulsory:
        // The fideicommissary obligation CANNOT apply to the fiduciary's legitime portion
        // It can ONLY apply to what the fiduciary receives from the free portion
        fiduciary_legitime = legitimes[fiduciary.id]
        fiduciary_total = fiduciary.total_share
        fiduciary_fp_share = fiduciary_total - fiduciary_legitime

        // The scope of preservation must fit within the FP share
        return fideicommissary_scope.as_fraction() <= fiduciary_fp_share

    // Non-compulsory fiduciary: entire share is from FP, no legitime issue
    return true
}
```

---

## Data Model Addition

The following struct is added to spec §3.3 after the `Substitute`/`SubstitutionType` definitions:

```
struct FideicommissarySubstitution {
    fiduciary: HeirReference,           // First heir — obligated to preserve
    fideicommissary: HeirReference,     // Second heir — ultimate beneficiary
    property_scope: ShareSpec,          // What must be preserved and transmitted
    is_express: bool,                   // Art. 863: must be expressly stated in will

    // Engine-computed validity (output of validate_fideicommissary)
    is_valid: bool,
    invalidity_reason: String?,         // If invalid, why
}
```

---

## Validation Algorithm

```
function validate_fideicommissary(
    sub: FideicommissarySubstitution,
    persons: Map<PersonId, Person>,
    date_of_death: Date,
    fiduciary_heir: Heir,
    legitimes: Map<HeirId, Fraction>
) -> FideicommissaryValidationResult {

    fiduciary = persons[sub.fiduciary.person_id]
    fideicommissary_person = persons[sub.fideicommissary.person_id]

    // Check 1: Express requirement
    if NOT sub.is_express:
        return INVALID("Art. 863: Fideicommissary substitution must be express")

    // Check 2: Both alive at testator's death
    if NOT fiduciary.is_alive_at(date_of_death):
        return INVALID("Art. 863: Fiduciary not alive at testator's death")
    if NOT fideicommissary_person.is_alive_at(date_of_death):
        return INVALID("Art. 863: Fideicommissary not alive at testator's death")

    // Check 3: One-degree limit (one generation)
    if NOT check_one_degree(fiduciary, fideicommissary_person):
        // If related but not parent-child, flag for manual review
        if are_related(fiduciary, fideicommissary_person):
            return INVALID_WITH_FLAG(
                "Art. 863: Fideicommissary exceeds one-degree limit",
                FIDEICOMMISSARY_DEGREE_AMBIGUITY
            )
        return INVALID("Art. 863: Fideicommissary exceeds one-degree limit")

    // Check 4: Cannot burden legitime (Art. 863 + Art. 872)
    if NOT check_no_legitime_burden(sub.property_scope, fiduciary_heir, legitimes):
        return PARTIAL_VALID(
            "Art. 863 + Art. 872: Fideicommissary cannot burden legitime. "
            + "Obligation applies only to free portion share."
        )
        // Engine behavior: split fiduciary's share
        //   - Legitime portion: unconditional, no fideicommissary burden
        //   - FP portion: subject to fideicommissary obligation

    return VALID
}

enum FideicommissaryValidationResult {
    VALID,
    INVALID(reason: String),
    INVALID_WITH_FLAG(reason: String, flag: ManualFlagCode),
    PARTIAL_VALID(reason: String),
        // When scope exceeds FP, engine narrows to FP portion only
}
```

---

## Engine Behavior

### Valid Fideicommissary

A valid fideicommissary substitution does **not** change the initial distribution amounts. It creates a **post-distribution obligation**:

1. **Step 7 (Distribution)**: Distribute to fiduciary as a normal heir
2. **Step 10 (Finalize)**: Attach fideicommissary obligation to fiduciary's `HeirShare`
3. **Narrative**: Include fideicommissary section explaining the preservation-and-transmission duty

The fiduciary receives full ownership but with the obligation to preserve and eventually transmit to the fideicommissary. The engine records this as metadata, not as a separate distribution.

### Invalid Fideicommissary

If validation fails:
- The fideicommissary substitution is **void** (treated as not written)
- The fiduciary keeps the property free of obligation
- **No redistribution** — the fiduciary's share amount does not change
- Narrative explains why the fideicommissary was voided

### Partial Validity (Legitime Burden)

If the fideicommissary scope overlaps with the fiduciary's legitime:
- Art. 872 strips the obligation from the legitime portion
- The obligation survives on the free portion share only
- Engine splits: `legitime = unconditional`, `fp_share = subject to fideicommissary`

---

## Narrative Template

### Valid Fideicommissary

> {fiduciary_name}'s share of ₱{total} includes a fideicommissary obligation under Art. 863 of the Civil Code. {fiduciary_name} must preserve {and transmit to {fideicommissary_name}} {scope_description}. Both {fiduciary_name} and {fideicommissary_name} were alive at the testator's death, and the substitution is within the one-degree limit required by Art. 863.

### Legitime-Stripped Fideicommissary

> The testator's will imposed a fideicommissary substitution on {fiduciary_name}'s entire share in favor of {fideicommissary_name}. However, under Art. 872, no charge or substitution may burden the legitime. The fideicommissary obligation applies only to ₱{fp_amount} (the free portion share), not to ₱{legitime_amount} ({fiduciary_name}'s legitime under Art. {article}).

### Invalid Fideicommissary

> The testator's will designated a fideicommissary substitution from {fiduciary_name} to {fideicommissary_name}. This substitution is void because {reason}. {fiduciary_name} receives ₱{total} free of any preservation-and-transmission obligation.

---

## Test Cases

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| T-FC-1 | Valid fideicommissary | Will: "A inherits ₱5M FP, must preserve and transmit to A's child B." Both alive. E=₱10M, 1 LC (not A). | A gets ₱5M with fideicommissary obligation to B. LC gets ₱5M legitime. |
| T-FC-2 | Fideicommissary predeceased | Will: "A inherits FP, must preserve for B." B predeceased. E=₱10M, 1 LC. | Fideicommissary void (B not alive at death). A gets ₱5M unconditionally. |
| T-FC-3 | Exceeds one degree | Will: "A inherits FP, must transmit to A's grandchild C." E=₱10M, 1 LC. | Fideicommissary void (C is two degrees from A). A gets ₱5M unconditionally. |
| T-FC-4 | Burdens legitime | Will: "LC1 inherits all, must transmit all to X." 1 LC, E=₱10M. LC1 legitime=₱5M. | Fideicommissary partially valid: obligation stripped from ₱5M legitime (Art. 872). Applies only to ₱5M FP. |
| T-FC-5 | Not express | Will language ambiguous — "I hope A will give to B." E=₱10M, no compulsory heirs. | Not a fideicommissary (not express per Art. 863). A gets ₱10M unconditionally. |
| T-FC-6 | Fiduciary predeceased | Will: "A inherits, transmit to B." A predeceased. E=₱10M, no compulsory heirs. | Fideicommissary void (fiduciary not alive). A's share → simple substitution / accretion / intestate per vacancy resolution. |

---

## Spec Changes

### §3.3 — After `SubstitutionTrigger` enum (line 333)

Add `FideicommissarySubstitution` struct and `validate_fideicommissary()` function with all 4 validity checks.

### §10 — Vacancy Resolution

Add note: fideicommissary substitution is NOT a vacancy resolution mechanism. It creates a post-distribution obligation. If the fiduciary dies before transmitting, the fideicommissary's right is governed by the obligation, not by the engine's vacancy resolution chain.

### §11 — Narrative

Add fideicommissary narrative templates (valid, legitime-stripped, invalid).

---

*Analysis based on Civil Code Arts. 863 and 872, and analysis/testate-institution.md §4.4.*
