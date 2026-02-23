# Analysis: Gross Estate Inclusions — Sec. 85(B)–(G)
## Taxable Transfers and Special Inclusions

**Aspect**: `gross-estate-inclusions`
**Wave**: 2 (TRAIN-Era Rule Extraction)
**Analyzed**: 2026-02-23
**Depends on**: `gross-estate-citizens`, `gross-estate-nonresident`

---

## Overview

NIRC Section 85 contains seven subsections (A through G). Subsections A, B (citizens), and B (NRA scope) were covered in prior analyses. This analysis covers **Subsections B through G** — the special inclusion rules that capture property the decedent transferred before death but which are still includible in the gross estate because of retained control, insufficient consideration, or testamentary intent.

All inclusions under Sec. 85(B)–(G) feed into:
- **Form 1801, Item 32** (Taxable Transfers, Column A or B)
- **Form 1801, Schedule 3** (detail worksheet)

These rules apply under **all three regimes** (TRAIN, pre-TRAIN, amnesty). TRAIN did not amend Sec. 85 inclusion rules — only rates and deductions changed.

---

## Legal Basis

**NIRC Section 85 (as amended by RA 10963 / TRAIN Law):**

> "The value of the gross estate of the decedent shall be determined by including the value at the time of his death of all property, real or personal, tangible or intangible, wherever situated."

The subsections below define which *transferred* property is still "included" in the gross estate.

---

## Subsection B — Transfers in Contemplation of Death

### Legal Text
> "All transfers made in contemplation of death, or intended to take effect in possession or enjoyment at or after death. **Any transfer made without adequate consideration within 3 years of death is presumed to have been made in contemplation of death.**"

### Rule (Pseudocode)

```
for each transfer in decedent.preDeathTransfers:
  years_elapsed = (decedent.dateOfDeath - transfer.dateOfTransfer).years

  if years_elapsed <= 3 AND transfer.considerationReceived < transfer.fmvAtTransfer:
    # Presumed in contemplation of death
    transfer.taxableInclusionType = "contemplation_of_death"
    transfer.isIncluded = true
    transfer.taxableAmount = transfer.fmvAtDeath
    # Note: fmvAtDeath = user-provided FMV of the transferred property
    #       as valued on the date of the decedent's death

  elif transfer.isExplicitlyInContemplationOfDeath == true:
    # User/executor declares transfer was made in contemplation of death
    # (regardless of 3-year window or consideration)
    transfer.isIncluded = true
    transfer.taxableAmount = transfer.fmvAtDeath

  else:
    transfer.isIncluded = false
    transfer.taxableAmount = 0
```

### Key Points

- **3-year rule is a presumption**: A transfer within 3 years *without* adequate consideration is *presumed* to be in contemplation of death. Technically rebuttable with evidence, but for a deterministic engine, the presumption is applied mechanically.
- **The engine applies the presumption automatically** when: `years_elapsed ≤ 3 AND considerationReceived < fmvAtTransfer`.
- **Valuation date is death**: Even if the property has declined in value, the FMV at death is used.
- **No adequate consideration → no Sec. 85(G) overlap**: If a transfer had zero or nominal consideration AND was within 3 years, it's captured here under 85(B). If consideration was substantial but still less than FMV, it falls under 85(G) (see below). These are mutually exclusive in the engine — apply one rule per transfer.

### Engine Input Fields (per transfer)

```
TransferInContemplation {
  description:          string       // "Transfer of Lot 123 to son Juan"
  dateOfTransfer:       date         // Date transfer was executed
  propertyType:         enum         // REAL_PROPERTY | PERSONAL_PROPERTY | INTANGIBLE
  considerationReceived: decimal     // ₱0 if gift; partial amount if partially paid
  fmvAtDeath:           decimal      // FMV of the property on decedent's date of death
  ownershipType:        enum         // EXCLUSIVE | CONJUGAL
}
```

### Conditions

| Condition | Value |
|-----------|-------|
| Transfer within 3 years of death | Automatically included if no adequate consideration |
| Consideration received | Must be < FMV at time of transfer to trigger presumption |
| Citizens/residents | All property (worldwide) |
| Non-resident aliens | PH-situs property only |

---

## Subsection C — Revocable Transfers

### Legal Text
> "The value of any interest in property transferred (except bona fide sales for full consideration) where the decedent retained the power to alter, amend, revoke, or terminate, or where such power was relinquished within 3 years of death."

### Rule (Pseudocode)

```
for each transfer in decedent.revocableTransfers:
  years_since_relinquishment = (decedent.dateOfDeath - transfer.dateePowerRelinquished).years

  if transfer.wasForBonafideSaleFull == true:
    # Exception: bona fide sale for adequate and full consideration
    transfer.isIncluded = false
    transfer.taxableAmount = 0

  elif transfer.retainedPowerAtDeath == true:
    # Decedent still held power to alter/amend/revoke at time of death
    transfer.isIncluded = true
    transfer.taxableAmount = transfer.fmvAtDeath

  elif transfer.datePowerRelinquished is not null AND years_since_relinquishment <= 3:
    # Power was relinquished within 3 years of death
    transfer.isIncluded = true
    transfer.taxableAmount = transfer.fmvAtDeath

  else:
    transfer.isIncluded = false
    transfer.taxableAmount = 0
```

### Engine Input Fields (per revocable transfer)

```
RevocableTransfer {
  description:              string
  dateOfTransfer:           date
  datePowerRelinquished:    date | null    // null if power held until death
  retainedPowerAtDeath:     boolean        // true if decedent had power at time of death
  wasForBonafideSaleFull:   boolean        // true if sale for full adequate consideration
  propertyType:             enum           // REAL_PROPERTY | PERSONAL_PROPERTY | INTANGIBLE
  fmvAtDeath:               decimal
  ownershipType:            enum           // EXCLUSIVE | CONJUGAL
}
```

### Key Points

- **Bona fide sale exception applies**: If the transfer was a genuine arms-length sale for full market value, it is excluded. The engine accepts this as a user-declared boolean.
- **"Power" includes**: power to alter, amend, revoke, or terminate the transfer arrangement.
- **3-year relinquishment rule**: mirrors the contemplation-of-death 3-year window. If the decedent gave up the power within 3 years of death, the property is still included.
- Practical examples: revocable trusts, deeds with retained life estates with power to revoke.

---

## Subsection D — Property Under General Power of Appointment

### Legal Text
> "All property passing under a general power of appointment exercised by the decedent by will or by deed in contemplation of death."

### Definition: General Power of Appointment

A **general power of appointment** (GPA) allows the holder to appoint the property to:
- Themselves
- Their estate
- Their creditors
- Creditors of their estate

It is "general" because it is exercisable in favor of anyone, including the decedent. This distinguishes it from a "special" (or "limited") power of appointment, which restricts who can receive the property.

### Rule (Pseudocode)

```
for each appointedProperty in decedent.generalPowerAppointments:
  if appointedProperty.powerExercised == false:
    # Decedent held but did NOT exercise the GPA — excluded from their estate
    appointedProperty.isIncluded = false
    appointedProperty.taxableAmount = 0

  elif appointedProperty.powerExercised == true:
    # GPA was exercised
    if appointedProperty.exercisedByWill == true:
      # Exercised by will → always included
      appointedProperty.isIncluded = true
      appointedProperty.taxableAmount = appointedProperty.fmvAtDeath

    elif appointedProperty.exercisedByDeed == true:
      years_elapsed = (decedent.dateOfDeath - appointedProperty.dateOfExercise).years
      if years_elapsed <= 3:
        # Deed exercised within 3 years of death → contemplation of death
        appointedProperty.isIncluded = true
        appointedProperty.taxableAmount = appointedProperty.fmvAtDeath
      else:
        # Deed exercised more than 3 years before death → excluded
        appointedProperty.isIncluded = false
        appointedProperty.taxableAmount = 0
```

### Engine Input Fields (per appointed property)

```
GeneralPowerAppointment {
  description:        string
  powerExercised:     boolean        // Did the decedent exercise the GPA?
  exercisedByWill:    boolean        // Exercised through the decedent's will?
  exercisedByDeed:    boolean        // Exercised by deed inter vivos?
  dateOfExercise:     date | null    // Date deed was executed (if by deed)
  propertyType:       enum
  fmvAtDeath:         decimal
  ownershipType:      enum           // typically EXCLUSIVE (GPA property is appointor's)
}
```

### Key Points

- **Unexercised GPA**: If the decedent merely *held* the power but did not exercise it, the property is NOT included in their estate.
- **Special power of appointment**: Not covered by Sec. 85(D). A special/limited power is not includible.
- **"Exercised by will"**: Exercised at death, so always in contemplation of death → always included.
- **"Exercised by deed"**: Applied 3-year test — if the deed was executed within 3 years of death, included.

---

## Subsection E — Life Insurance Proceeds

### Legal Text
> "Proceeds of life insurance under policies taken out by the decedent upon his own life:
> - Receivable by the **estate** of the decedent: **INCLUDED** in gross estate
> - Receivable by other **beneficiaries** designated **irrevocably**: **EXCLUDED** from gross estate
> - Receivable by other beneficiaries designated **revocably**: **INCLUDED** in gross estate"

### Rule (Pseudocode)

```
for each policy in decedent.lifeInsurancePolicies:
  if policy.insuredPerson != decedent:
    # Policy not taken out on decedent's own life → not subject to Sec. 85(E)
    # May still be includible as personal property if decedent owns the policy
    policy.sec85E_included = false
    policy.taxableAmount = 0
    continue

  if policy.beneficiaryType == "ESTATE":
    policy.sec85E_included = true
    policy.taxableAmount = policy.proceeds

  elif policy.beneficiaryType == "REVOCABLE_BENEFICIARY":
    policy.sec85E_included = true
    policy.taxableAmount = policy.proceeds

  elif policy.beneficiaryType == "IRREVOCABLE_BENEFICIARY":
    policy.sec85E_included = false
    policy.taxableAmount = 0

  else:
    # Unknown → treat as revocable (conservative)
    policy.sec85E_included = true
    policy.taxableAmount = policy.proceeds
```

### Engine Input Fields (per life insurance policy)

```
LifeInsurancePolicy {
  policyNumber:           string
  insurerName:            string
  insuredPerson:          enum       // DECEDENT | OTHER
  beneficiaryType:        enum       // ESTATE | REVOCABLE_BENEFICIARY | IRREVOCABLE_BENEFICIARY
  proceeds:               decimal    // Amount payable on death (death benefit)
  ownershipType:          enum       // EXCLUSIVE | CONJUGAL (who paid the premiums)
}
```

### Key Points

- **Policy must be on decedent's own life**: Sec. 85(E) only applies to policies "taken out by the decedent upon his own life." Policies on another person's life owned by the decedent are treated as personal property under Sec. 85(A), not as taxable transfers.
- **Irrevocable designation is the only exclusion**: The designation must be truly irrevocable — meaning the decedent had no power to change the beneficiary.
- **"Payable to the estate"**: This includes policies where the decedent's estate is the named beneficiary, or where no beneficiary is named and proceeds default to the estate.
- **Premium-payer rule**: Not relevant for inclusion/exclusion purposes — only the beneficiary designation matters.
- **Multiple policies**: Engine handles each policy independently. A decedent may have one policy payable to the estate (included) and another to an irrevocable beneficiary (excluded).

### Form 1801 Mapping

Life insurance proceeds are entered in:
- **Schedule 3 (Taxable Transfers)**: for policies included under Sec. 85(E) (payable to estate or revocable beneficiary)
- **NOT in Schedule 2 (Personal Property)**: when includible under 85(E), they go to Schedule 3

If a policy is *excluded* (irrevocable beneficiary), it does not appear anywhere on Form 1801.

---

## Subsection F — Prior Interests

### Legal Text
> "Applies to the extent of any interest held by the decedent in transfers described in subsections B through E, whether the transfer was made before or after the effectivity of this Code."

### Rule (Pseudocode)

```
// Subsection F is a retroactivity clause, not an independent computation rule.
// Engine implementation: No separate subsection F computation needed.
// Inclusion rules in Sec. 85(B)–(E) apply to ALL qualifying transfers,
// regardless of when the transfer occurred (before or after NIRC enactment).
//
// In practice: the engine accepts all relevant transfers as user inputs
// and applies the inclusion tests without any date-of-transfer cutoff
// based on NIRC enactment date.
```

### Key Points

- **Not a separate computation rule**: Subsection F clarifies that the rules in (B)–(E) apply retroactively. No independent calculation needed.
- **Engine implication**: The engine should not filter out transfers based on whether they predate the NIRC (RA 8424, enacted 1997). All qualifying transfers are included.

---

## Subsection G — Transfers for Insufficient Consideration

### Legal Text
> "Where property was transferred for less than adequate consideration, the amount included in the gross estate is the **excess** of the fair market value at death over the consideration received."

### Rule (Pseudocode)

```
for each transfer in decedent.transfersForInsuffConsideration:
  if transfer.considerationReceived >= transfer.fmvAtTransfer:
    # Adequate consideration — bona fide sale, excluded from gross estate
    transfer.isIncluded = false
    transfer.taxableAmount = 0

  else:
    # Insufficient consideration — partial inclusion
    excess = transfer.fmvAtDeath - transfer.considerationReceived

    if excess <= 0:
      # Property declined in value; no excess
      transfer.isIncluded = false
      transfer.taxableAmount = 0
    else:
      transfer.isIncluded = true
      transfer.taxableAmount = excess
```

### Engine Input Fields (per insufficient-consideration transfer)

```
InsufficientConsiderationTransfer {
  description:              string
  dateOfTransfer:           date
  fmvAtTransfer:            decimal    // FMV at the time the transfer was made
  considerationReceived:    decimal    // Actual amount/value received
  fmvAtDeath:               decimal    // FMV on the date of decedent's death
  propertyType:             enum
  ownershipType:            enum
}
```

### Key Points

- **FMV at death is the baseline**: The taxable amount is `fmvAtDeath − considerationReceived`, not `fmvAtTransfer − considerationReceived`.
- **Consideration at time of transfer**: The comparison for "adequacy" uses `fmvAtTransfer` (was the consideration adequate at the time?). But the actual inclusion amount uses `fmvAtDeath`.
- **Example**: Decedent sold a lot in 2020 for ₱1,000,000; FMV at transfer was ₱3,000,000; FMV at death in 2023 was ₱4,000,000.
  - Consideration < FMV at transfer → insufficient consideration
  - Taxable amount = ₱4,000,000 − ₱1,000,000 = ₱3,000,000
- **If property declined below consideration received**: Taxable amount = max(0, fmvAtDeath − consideration). If FMV at death fell below what was paid, nothing is included.
- **Overlap with Sec. 85(B)**: A transfer within 3 years with zero consideration may qualify under both 85(B) and 85(G). In practice, 85(B) governs when there is truly no consideration. 85(G) is more relevant when there *was* consideration but it was below FMV.
  - **Engine resolution**: If a transfer qualifies under both, classify it under 85(B) (contemplation of death) when consideration = 0 or the transfer date is within 3 years. Only apply 85(G) when the transfer is outside the 3-year window AND had partial consideration.

---

## Combined Schedule 3 Data Model

All inclusions under Sec. 85(B)–(G) are consolidated into Form 1801 Schedule 3. The engine must produce one record per transfer:

```
Schedule3Entry {
  transferType:           enum    // CONTEMPLATION_OF_DEATH | REVOCABLE_TRANSFER |
                                  //   GENERAL_POWER_APPOINTMENT | LIFE_INSURANCE |
                                  //   INSUFFICIENT_CONSIDERATION
  description:            string  // Property description
  dateOfTransfer:         date    // Date of original transfer/exercise
  considerationReceived:  decimal // ₱0 for pure gifts/transfers
  fmvAtDeath:             decimal // FMV on date of decedent's death
  taxableAmount:          decimal // Computed per the applicable rule above
  ownershipType:          enum    // EXCLUSIVE | CONJUGAL
}
```

### Schedule 3 Total

```
schedule3.totalTaxableTransfers = sum(entry.taxableAmount for entry in schedule3Entries)
schedule3.totalExclusive = sum(entry.taxableAmount for entry in schedule3Entries where entry.ownershipType == EXCLUSIVE)
schedule3.totalConjugal = sum(entry.taxableAmount for entry in schedule3Entries where entry.ownershipType == CONJUGAL)

# Carried to Part IV:
item32_columnA = schedule3.totalExclusive
item32_columnB = schedule3.totalConjugal
item32_columnC = schedule3.totalTaxableTransfers
```

---

## Form 1801 Mapping

| Engine Output | Form 1801 Field |
|---|---|
| `schedule3Entries[].taxableAmount` | Schedule 3 — per-row taxable amount |
| `grossEstate.taxableTransfers` (Column A) | Item 32 Column A |
| `grossEstate.taxableTransfers` (Column B) | Item 32 Column B |
| `grossEstate.taxableTransfers` (Column C) | Item 32 Column C |
| Schedule 3 total | Feeds Item 34 (via Item 32) |

---

## Regime-Specific Notes

| Provision | TRAIN-era | Pre-TRAIN | Amnesty |
|---|---|---|---|
| Sec. 85(B) Contemplation | Applies | Applies | Applies |
| Sec. 85(C) Revocable | Applies | Applies | Applies |
| Sec. 85(D) GPA | Applies | Applies | Applies |
| Sec. 85(E) Life Insurance | Applies | Applies | Applies |
| Sec. 85(F) Prior Interests | Applies | Applies | Applies |
| Sec. 85(G) Insufficient Consideration | Applies | Applies | Applies |

**Conclusion**: Sec. 85 inclusion rules are **unchanged across all three regimes**. The engine uses the same inclusion logic regardless of whether the date of death triggers TRAIN, pre-TRAIN, or amnesty computation. Only the deduction rules and rates differ between regimes.

---

## Non-Resident Alien Scope

For NRA decedents, the Sec. 85(B)–(G) inclusions apply only to **PH-situated property**:

```
for each Schedule3Entry in decedent.taxableTransfers:
  if decedent.isNonResidentAlien == true:
    if entry.propertySitusSitus != "PHILIPPINES":
      entry.isIncluded = false   // NRA: non-PH situs excluded
```

Reciprocity rule (for intangible personal property): same rule as Sec. 85 main scope — if country of domicile provides reciprocal exemption to Filipinos, intangible personal property (including life insurance proceeds classified as intangible) is excluded.

---

## Edge Cases

| # | Edge Case | Expected Behavior |
|---|---|---|
| 1 | Transfer within 3 years with full consideration | NOT included under 85(B) (adequate consideration rebuttal). May be includible under 85(G) only if FMV at death > consideration. |
| 2 | Life insurance payable to estate via will (no named beneficiary) | Included — same as "payable to estate" |
| 3 | Multiple life insurance policies: one irrevocable, one revocable | Each policy handled independently. Only revocable policy included. |
| 4 | GPA held but never exercised | Excluded — no inclusion unless GPA was exercised by will or recent deed |
| 5 | Special (limited) power of appointment | Excluded from Sec. 85(D) — not a general power |
| 6 | Property transferred declined to zero value | `taxableAmount = max(0, fmvAtDeath − consideration) = 0`. Not included. |
| 7 | Revocable transfer where power was relinquished more than 3 years before death | Excluded. Power relinquished >3 years prior breaks the chain. |
| 8 | Policy on decedent's life but decedent is not the owner (business-owned policy) | Sec. 85(E) still applies — what matters is whether the policy is "on the decedent's own life," not ownership. Beneficiary designation controls inclusion/exclusion. |
| 9 | NRA decedent with life insurance on own life payable to estate, policy covering PH-situs assets | If the insured property is PH-situated, proceeds are PH-sourced — included for NRA. |
| 10 | Transfer within 3 years with partial consideration (₱1 consideration on ₱5M property) | Apply 85(B) (contemplation rule), not 85(G). FMVatDeath is fully included. The ₱1 consideration does not reduce the taxable amount — this is not "adequate consideration." |
| 11 | Contemplation-of-death transfer where property no longer exists at death | No inclusion (no FMV at death). Engine requires fmvAtDeath input; if 0, taxableAmount = 0. |
| 12 | Revocable trust (living trust) with power to revoke | Included under 85(C) if power retained at death. If power formally relinquished within 3 years, also included. |

---

## Test Implications

| Test | Inputs | Expected |
|---|---|---|
| T1: Life insurance to estate | policy.beneficiaryType = ESTATE, proceeds = ₱2M | Item 32 += ₱2M |
| T2: Life insurance irrevocable beneficiary | policy.beneficiaryType = IRREVOCABLE_BENEFICIARY, proceeds = ₱2M | Item 32 += ₱0; nothing on Form 1801 |
| T3: Gift within 3 years, zero consideration | dateOfTransfer = 2 years before death, consideration = 0, fmvAtDeath = ₱1M | Schedule 3 entry: type=CONTEMPLATION_OF_DEATH, taxableAmount = ₱1M |
| T4: Sale for full consideration | consideration = ₱3M, fmvAtTransfer = ₱3M, fmvAtDeath = ₱5M | Excluded; not in Schedule 3 |
| T5: Insufficient consideration sale | consideration = ₱1M, fmvAtTransfer = ₱3M, fmvAtDeath = ₱4M | type=INSUFFICIENT_CONSIDERATION, taxableAmount = ₱3M |
| T6: GPA exercised by will | powerExercised=true, exercisedByWill=true, fmvAtDeath = ₱2M | type=GENERAL_POWER_APPOINTMENT, taxableAmount = ₱2M |
| T7: GPA held, not exercised | powerExercised=false | Not included; taxableAmount = ₱0 |
| T8: Revocable transfer, power held at death | retainedPowerAtDeath=true, fmvAtDeath = ₱3M | type=REVOCABLE_TRANSFER, taxableAmount = ₱3M |
| T9: Revocable transfer, power relinquished 4 years ago | datePowerRelinquished = 4 years before death | Not included; taxableAmount = ₱0 |
| T10: NRA decedent, life insurance on own life, non-PH situs | decedent.isNonResidentAlien=true, propertySitus="USA" | Excluded from PH gross estate |

---

## Summary

Sec. 85(B)–(G) adds **taxable transfers** to the gross estate. These are properties that left the decedent's hands before death but must still be taxed because the decedent retained control, made the transfer in anticipation of death, or received inadequate consideration.

**Engine implementation summary:**
1. Accept a list of potential taxable transfers as user inputs (with type, dates, consideration, FMV at death)
2. Apply each subsection's rule to compute the taxable amount for each transfer
3. Sum all taxable amounts into Schedule 3
4. Carry Schedule 3 total to Item 32 (Column A/B split by ownership type)
5. These rules are **regime-invariant** — same logic applies under TRAIN, pre-TRAIN, and amnesty regimes
