# Accretion Rules — How a Vacant Share Distributes to Co-Heirs

**Aspect**: accretion-rules
**Wave**: 4 (Distribution Rules)
**Primary Legal Basis**: Arts. 1015-1023 (Civil Code — Provisions Common to Testate and Intestate Succession)
**Depends On**: compulsory-heirs-categories, heir-concurrence-rules, representation-rights, testate-institution, intestate-order, free-portion-rules

---

## Overview

Accretion (*jus accrescendi*) is the mechanism by which a **vacant share** — one that an heir, devisee, or legatee cannot or will not accept — flows to the remaining co-heirs, co-devisees, or co-legatees. It is a gap-filling rule that prevents estate portions from becoming ownerless when a designated beneficiary drops out.

This analysis covers:
1. Definition and scope (Art. 1015)
2. Three vacancy triggers: predecease, renunciation, incapacity
3. Testate accretion: the pro indiviso requirement (Arts. 1016-1017)
4. Intestate accretion: simpler, always-applies rule (Art. 1018)
5. The critical Art. 1021 distinction: legitime repudiation (own right) vs. free portion (accretion proper)
6. Resolution priority chain: substitution → representation → accretion → intestate (Art. 1022)
7. Proportionality rule (Art. 1019) and obligations (Art. 1020)
8. Extension to devisees, legatees, usufructuaries (Art. 1023)
9. Complete pseudocode for the engine's accretion resolution
10. Interaction with other sub-engines (preterition, disinheritance, representation)

---

## Legal Basis

### Core Articles

| Article | What It Governs | Quoted Text |
|---------|----------------|-------------|
| **Art. 1015** | Definition | "Accretion is a right by virtue of which, when two or more persons are called to the same inheritance, devise or legacy, the part assigned to the one who renounces or cannot receive his share, or who died before the testator, is added or incorporated to that of his co-heirs, co-devisees, or co-legatees." |
| **Art. 1016** | Testate requirements | "(1) That two or more persons be called to the same inheritance, or to the same portion thereof, pro indiviso; and (2) That one of the persons thus called die before the testator, or renounce the inheritance, or be incapacitated to receive it." |
| **Art. 1017** | "Equal shares" rule | "The words 'one-half for each' or 'in equal shares' or any others which, though designating an aliquot part, do not identify it by such description as shall make each heir the exclusive owner of determinate property, shall not exclude the right of accretion." |
| **Art. 1018** | Intestate accretion | "In legal succession the share of the person who repudiates the inheritance shall always accrue to his co-heirs." |
| **Art. 1019** | Proportionality | "The heirs to whom the portion goes by the right of accretion take it in the same proportion that they inherit." |
| **Art. 1020** | Obligations transfer | "The heirs to whom the inheritance accrues shall succeed to all the rights and obligations which the heir who renounced or could not receive it would have had." |
| **Art. 1021** | Compulsory heir distinction | "Among the compulsory heirs the right of accretion shall take place only when the free portion is left to two or more of them, or to any one of them and to a stranger. Should the part repudiated be the legitime, the other co-heirs shall succeed to it in their own right, and not by the right of accretion." |
| **Art. 1022** | Fallback when no accretion | "(1) If the will contains a substitution, the substitute shall take the place of the heir who renounced or who cannot receive the inheritance; (2) If there is no substitution, the property left vacant shall pass to the legal heirs of the testator, who shall receive it with the same charges and obligations." |
| **Art. 1023** | Extension | "Accretion shall also take place among devisees, legatees and usufructuaries under the same conditions established for heirs." |

### Related Articles

| Article | Relevance |
|---------|-----------|
| **Art. 960(3)** | Intestate succession applies when "no right of accretion takes place" — accretion is checked before falling to intestate |
| **Art. 968** | Intestate: unwilling/incapacitated heir's share accrues to others of same degree |
| **Art. 969** | If ALL nearest relatives repudiate, next degree inherits in own right (not representation) |
| **Art. 977** | A repudiating heir may not be represented — representation does NOT apply |
| **Art. 856** | Voluntary heir who predeceases transmits nothing; compulsory heir who predeceases transmits nothing except by representation |
| **Art. 859** | Simple substitution: substitute steps in for predecease, renunciation, or incapacity |

---

## 1. Vacancy Triggers

A share becomes vacant when the designated heir/legatee/devisee:

| Trigger | Article | Notes |
|---------|---------|-------|
| **Predecease** | Art. 1015, 1016(2) | Heir dies before testator. For compulsory heirs, representation may apply first (Art. 972). |
| **Renunciation** | Art. 1015, 1016(2), 1018 | Heir expressly repudiates (Art. 1051). Art. 977: a renouncing heir CANNOT be represented. |
| **Incapacity** | Art. 1016(2), Art. 1032 | Heir is incapacitated by law (Art. 1027) or unworthy (Art. 1032). For children/descendants, incapacity triggers representation (Art. 1035). |

**Engine vacancy detection:**

```
enum VacancyCause {
  PREDECEASE,     // Heir died before testator
  RENUNCIATION,   // Heir expressly repudiated (Art. 1051)
  INCAPACITY,     // Art. 1027 incapacity
  UNWORTHINESS,   // Art. 1032 unworthiness
}

struct VacantShare {
  heir: Heir,                    // The heir who cannot/will not receive
  cause: VacancyCause,
  amount: Money,                 // The peso amount of the vacant share
  source: ShareSource,           // LEGITIME or FREE_PORTION or INTESTATE
  disposition: Disposition?,     // The will disposition (null for intestate)
}

function detect_vacancy(heir: Heir) -> VacancyCause? {
  if NOT heir.is_alive_at_succession_opening:
    return PREDECEASE
  if heir.has_renounced:
    return RENUNCIATION
  if is_incapacitated(heir):    // Art. 1027
    return INCAPACITY
  if is_unworthy(heir):         // Art. 1032 (not condoned per Art. 1033)
    return UNWORTHINESS
  return null                   // No vacancy — heir can receive
}
```

---

## 2. Resolution Priority Chain

When a share becomes vacant, the engine must resolve it in strict order. **Accretion is NOT the first resort** — it sits in a specific position within a resolution chain:

```
VACANCY DETECTED
  │
  ├─ Step 1: SUBSTITUTION (Art. 859, testate only)
  │   └─ Does the will name a substitute for this heir?
  │      YES → Substitute inherits. DONE.
  │      NO  → Continue
  │
  ├─ Step 2: REPRESENTATION (Arts. 970-977)
  │   └─ Can descendants step into the vacant heir's place?
  │      • Predecease: YES if descendants exist (Art. 981-982)
  │      • Incapacity/unworthiness: YES for children/descendants (Art. 1035)
  │      • Renunciation: NEVER (Art. 977)
  │      • Disinheritance: YES for children/descendants (Art. 923)
  │      If YES → Representatives inherit per stirpes. DONE.
  │      If NO  → Continue
  │
  ├─ Step 3: ACCRETION (Arts. 1015-1021)
  │   └─ Are there co-heirs/co-legatees who can absorb the share?
  │      • Testate: requires pro indiviso institution (Art. 1016)
  │      • Intestate: always applies among co-heirs (Art. 1018)
  │      • Art. 1021: if the vacant part is the LEGITIME, co-heirs
  │        succeed "in their own right" (technically not accretion
  │        but functionally equivalent — share redistributed)
  │      If YES → Co-heirs absorb proportionally. DONE.
  │      If NO  → Continue
  │
  └─ Step 4: INTESTATE FALLBACK (Art. 1022(2), testate only)
      └─ Vacant share passes to legal heirs under intestate rules
         with the same charges and obligations.
```

**Engine pseudocode:**

```
function resolve_vacancy(vacancy: VacantShare, will: Will?,
                          heirs: List<Heir>) -> List<Redistribution> {
  // Step 1: Substitution (testate only)
  if will != null AND vacancy.disposition != null:
    substitute = find_substitute(will, vacancy.disposition, vacancy.heir)
    if substitute != null AND substitute.is_alive AND NOT is_incapacitated(substitute):
      return [Redistribution(recipient=substitute, amount=vacancy.amount,
                              basis="Art. 859 — simple substitution")]

  // Step 2: Representation
  if vacancy.cause != RENUNCIATION:  // Art. 977: renouncing heir cannot be represented
    representatives = find_representatives(vacancy.heir)
    if count(representatives) > 0:
      return distribute_per_stirpes(representatives, vacancy.amount,
                                     basis="Arts. 970-974 — right of representation")

  // Step 3: Accretion
  if will != null:
    // Testate accretion — requires pro indiviso (Art. 1016)
    return resolve_testate_accretion(vacancy, will, heirs)
  else:
    // Intestate accretion — always applies (Art. 1018)
    return resolve_intestate_accretion(vacancy, heirs)
}
```

---

## 3. Testate Accretion (Arts. 1016-1017, 1021)

### 3.1 The Pro Indiviso Requirement (Art. 1016)

For accretion to occur in testamentary succession, two conditions must both hold:

1. **Plurality**: Two or more persons called to the **same inheritance or same portion thereof, pro indiviso** (undivided)
2. **Vacancy**: One of them predeceases, renounces, or is incapacitated

The key word is **pro indiviso** — the heirs must be jointly called to the same undivided thing or portion. If each heir is assigned a specific, identified thing (e.g., "the house in Manila to A, the lot in Cebu to B"), they are NOT pro indiviso and accretion does not apply.

### 3.2 Art. 1017 — "Equal Shares" Does NOT Prevent Accretion

> "The words 'one-half for each' or 'in equal shares' or any others which, though designating an aliquot part, do not identify it by such description as shall make each heir the exclusive owner of determinate property, shall not exclude the right of accretion."

This is crucial for the engine: even when the will says "½ to A, ½ to B", accretion STILL applies because the heirs are not made exclusive owners of identified/determinate property. The test is not whether shares are designated, but whether the designation makes each heir the **exclusive owner of a specific, identifiable thing**.

**Engine rule:**

```
function is_pro_indiviso(dispositions: List<Disposition>) -> bool {
  // Group dispositions that refer to the same subject matter
  for group in group_by_subject(dispositions):
    if count(group) < 2:
      continue  // Need 2+ heirs for accretion

    // Check: does the designation make each heir the exclusive owner
    // of determinate property?
    for d in group:
      if d.subject_is_specific_identifiable_property AND d.is_sole_owner:
        return false  // Each owns a separate thing → NOT pro indiviso

  // Aliquot parts of the same thing, same estate, or same portion
  // → pro indiviso (Art. 1017)
  return true
}
```

**Examples:**

| Will Language | Pro Indiviso? | Accretion? |
|---------------|---------------|------------|
| "My estate to A, B, and C" | YES | YES |
| "My estate: ⅓ to A, ⅓ to B, ⅓ to C" | YES (Art. 1017) | YES |
| "My estate in equal shares to A and B" | YES (Art. 1017) | YES |
| "The house in Manila to A, the farm in Cebu to B" | NO | NO |
| "½ of my estate to A, ½ to B" | YES (Art. 1017) | YES |
| "Lot 1 to A, Lot 2 to B" | NO | NO |
| "Free portion: ¼ to A, ¼ to B, ½ to charity C" | YES for the FP group | YES |

### 3.3 Art. 1021 — The Legitime/Free Portion Distinction (CRITICAL)

> "Among the compulsory heirs the right of accretion shall take place only when the free portion is left to two or more of them, or to any one of them and to a stranger. Should the part repudiated be the legitime, the other co-heirs shall succeed to it in their own right, and not by the right of accretion."

This article creates two separate regimes:

#### Regime 1: Vacant LEGITIME Share

When a compulsory heir's **legitime** becomes vacant (renunciation, incapacity, unworthiness), the other compulsory heirs absorb it **in their own right** — meaning they are treated as if the vacant heir never existed, and the legitime is recomputed with the reduced heir count.

This is **functionally different** from accretion:
- **Accretion**: the vacant share is added ON TOP of what co-heirs already receive
- **Own right**: the engine RE-COMPUTES the scenario as if the heir pool were smaller

Example: 3 legitimate children (LC₁, LC₂, LC₃), estate ₱12M.
- Original: total legitime = ½ × ₱12M = ₱6M → ₱2M each
- LC₃ renounces (no representation per Art. 977):
  - NOT accretion: LC₁ and LC₂ don't get ₱2M + ₱1M = ₱3M each
  - Instead, "in own right": re-evaluate with 2 children → total legitime = ½ × ₱12M = ₱6M → ₱3M each (same numeric result here, but the legal basis differs)
  - Free portion also changes: was ₱6M, now still ₱6M (½), but the free portion's claimants may change

**Critical practical impact**: When the scenario has mixed heir types (e.g., LC + IC + spouse), a vacancy in one LC's legitime doesn't just add the share to other LCs — it changes the SCENARIO (e.g., from T5b with n=3 to T5b with n=2), which may change everyone's fractions. This is NOT a simple proportional add-on.

```
function resolve_legitime_vacancy(vacancy: VacantShare, heirs: List<Heir>,
                                    scenario: TestateSenario) -> RecomputeResult {
  // Art. 1021 ¶2: succeed "in their own right"
  // Remove the vacant heir from the pool and re-evaluate the entire scenario
  remaining_heirs = heirs.filter(h => h != vacancy.heir)

  // Re-classify scenario with reduced heir pool
  new_scenario = determine_testate_scenario(remaining_heirs)

  // Re-compute all legitimes from scratch
  new_legitimes = compute_all_legitimes(estate, remaining_heirs, new_scenario)

  return RecomputeResult(
    new_scenario: new_scenario,
    new_legitimes: new_legitimes,
    basis: "Art. 1021 ¶2 — compulsory heirs succeed in their own right"
  )
}
```

#### Regime 2: Vacant FREE PORTION Share

When the free portion is left to two or more compulsory heirs (or a compulsory heir + a stranger), and one of them can't receive, accretion proper applies — the vacant FP share is distributed to the remaining FP co-heirs proportionally.

Example: Will leaves FP (₱3M) split: "⅓ to LC₁, ⅓ to friend F, ⅓ to charity C."
- F renounces → F's ₱1M accrues to LC₁ and C proportionally (Art. 1019)
- LC₁ gets: ₱1M + ₱500K = ₱1.5M from FP
- C gets: ₱1M + ₱500K = ₱1.5M from FP

```
function resolve_fp_accretion(vacancy: VacantShare, will: Will,
                                fp_heirs: List<Heir>) -> List<Redistribution> {
  // Art. 1021 ¶1: accretion among FP co-heirs
  remaining_fp_heirs = fp_heirs.filter(h => h != vacancy.heir)

  if count(remaining_fp_heirs) == 0:
    // No co-heirs → falls to intestate (Art. 1022(2))
    return [Redistribution(recipient=INTESTATE, amount=vacancy.amount,
                            basis="Art. 1022(2) — no co-heirs for accretion")]

  // Art. 1019: accrue proportionally
  total_remaining = sum(share_of(h) for h in remaining_fp_heirs)
  result = []
  for h in remaining_fp_heirs:
    proportion = share_of(h) / total_remaining
    result.add(Redistribution(
      recipient: h,
      amount: vacancy.amount * proportion,
      basis: "Art. 1019 — accretion in proportion to existing share"
    ))
  return result
}
```

### 3.4 Resolution When Accretion Doesn't Apply (Art. 1022)

If accretion cannot occur in testate succession (e.g., heirs are NOT pro indiviso, or there are no co-heirs):

1. **Check for substitution** (Art. 1022(1)): substitute takes the place
2. **Fall to intestate** (Art. 1022(2)): vacant property passes to legal heirs with same charges/obligations

```
function resolve_no_accretion_testate(vacancy: VacantShare, will: Will,
                                        heirs: List<Heir>) -> List<Redistribution> {
  // Art. 1022(1): Check for substitute
  substitute = find_substitute(will, vacancy.disposition, vacancy.heir)
  if substitute != null AND is_capable(substitute):
    return [Redistribution(recipient=substitute, amount=vacancy.amount,
                            basis="Art. 1022(1) — substitution")]

  // Art. 1022(2): Pass to legal heirs (intestate rules)
  return distribute_intestate(vacancy.amount, heirs,
                               charges=vacancy.disposition.charges,
                               basis="Art. 1022(2) — intestate fallback with charges")
}
```

---

## 4. Intestate Accretion (Arts. 1018, 968-969)

Intestate accretion is simpler and more permissive than testate accretion.

### 4.1 Art. 1018 — Always Accrues

> "In legal succession the share of the person who repudiates the inheritance shall always accrue to his co-heirs."

In intestate succession, there is no pro indiviso requirement. When a legal heir repudiates, the share **always** accrues to co-heirs. Art. 968 extends this to unwilling/incapacitated heirs: "his portion shall accrue to the others of the same degree."

**Key distinction**: Art. 1018 says "co-heirs" without qualification. The question is whether this means:
(a) Co-heirs of the same class/degree only, or
(b) All co-heirs in the scenario

The answer depends on context:

| Scenario | Renouncing Heir | Who Accretes | Basis |
|----------|----------------|--------------|-------|
| I1: 3 LC, one renounces | LC₃ | Other LCs only (same class) | Art. 968: "others of the same degree" |
| I2: 2 LC + spouse, LC₁ renounces | LC₁ | Other LC + spouse, proportionally | Art. 1018: all co-heirs |
| I4: 2 LC + 1 IC + spouse, IC renounces | IC | ALL remaining (2 LC + spouse) | Art. 1018: all co-heirs in scenario |
| I9: ascendants + IC, IC renounces | IC | Ascendants only | Art. 1018 + scenario re-evaluation |

**Engine rule**: In intestate succession, a vacant share accrues to ALL remaining co-heirs in the scenario proportionally, unless the vacancy eliminates an entire class — in which case, re-evaluate the scenario.

### 4.2 Art. 969 — Total Repudiation → Next Degree

> "If the inheritance should be repudiated by the nearest relative, should there be one only, or by all the nearest relatives called by law to succeed, should there be several, those of the following degree shall inherit in their own right and cannot represent the person or persons repudiating the inheritance."

When ALL heirs of the nearest degree repudiate:
- Accretion cannot happen (no remaining co-heirs)
- The next degree inherits **in their own right** (not by representation, not by accretion)
- The engine must fully re-evaluate the scenario

```
function resolve_intestate_accretion(vacancy: VacantShare,
                                       heirs: List<Heir>) -> List<Redistribution> {
  renouncing = vacancy.heir
  co_heirs = get_co_heirs_intestate(renouncing, heirs)

  // Check: have ALL co-heirs of the same class renounced?
  same_class = heirs.filter(h => h.intestate_class == renouncing.intestate_class)
  all_renounced = all(h.has_renounced for h in same_class)

  if all_renounced:
    // Art. 969: entire class gone → re-evaluate scenario from scratch
    remaining = heirs.filter(h => h.intestate_class != renouncing.intestate_class
                              AND NOT h.has_renounced)
    if count(remaining) == 0:
      return [Redistribution(recipient=STATE, amount=vacancy.amount,
                              basis="Art. 1011 — no heirs, estate to State")]
    // Re-evaluate with next degree in own right
    return re_evaluate_intestate_scenario(remaining, vacancy.amount + existing_shares,
                                           basis="Art. 969 — next degree in own right")

  // Partial renunciation → accrue to remaining co-heirs
  // Art. 1019: proportionally
  remaining_heirs = co_heirs.filter(h => NOT h.has_renounced)
  total_existing = sum(share_of(h) for h in remaining_heirs)
  result = []
  for h in remaining_heirs:
    proportion = share_of(h) / total_existing
    result.add(Redistribution(
      recipient: h,
      amount: vacancy.amount * proportion,
      basis: "Art. 1018/1019 — intestate accretion proportional to share"
    ))
  return result
}
```

---

## 5. Art. 1019 — Proportionality Rule

> "The heirs to whom the portion goes by the right of accretion take it in the same proportion that they inherit."

This means:
- If A has a ¼ share and B has a ½ share, and C (who had ¼) renounces, the vacant ¼ accrues: A gets ⅓ × ¼ = 1/12, B gets ⅔ × ¼ = 1/6 (because A:B ratio is 1:2)
- NOT equally — **proportionally** to their existing shares

```
function distribute_accretion(vacant_amount: Money,
                                co_heirs: List<(Heir, Money)>) -> List<(Heir, Money)> {
  total_existing = sum(amount for (_, amount) in co_heirs)
  return [
    (heir, vacant_amount * (existing / total_existing))
    for (heir, existing) in co_heirs
  ]
}
```

---

## 6. Art. 1020 — Rights AND Obligations Transfer

> "The heirs to whom the inheritance accrues shall succeed to all the rights and obligations which the heir who renounced or could not receive it would have had."

The accreting heir inherits not just the money but also:
- Charges imposed on the vacant share (e.g., conditions in the will)
- Debts proportional to the vacant share
- Fideicommissary obligations if any attached to the vacant share

**Engine note**: This means the engine must track any conditions/charges attached to a disposition and carry them forward to the accreting heirs.

```
struct Redistribution {
  recipient: Heir,
  amount: Money,
  basis: String,                     // Legal citation
  inherited_charges: List<Charge>,   // Art. 1020: charges from vacant share
  inherited_conditions: List<Condition>,
}
```

---

## 7. Art. 1023 — Extension to Devisees, Legatees, and Usufructuaries

> "Accretion shall also take place among devisees, legatees and usufructuaries under the same conditions established for heirs."

This extends all accretion rules to:
- **Co-legatees**: Two persons bequeathed the same personal property pro indiviso
- **Co-devisees**: Two persons devised the same real property pro indiviso
- **Co-usufructuaries**: Two persons given usufruct over the same thing

The engine must apply the same pro indiviso check and proportional distribution to legacies, devises, and usufructs, not just institutions.

```
function resolve_legacy_accretion(vacancy: VacantLegacy,
                                    co_legatees: List<Legatee>) -> List<Redistribution> {
  // Art. 1023: same rules as for heirs
  // Art. 1016: must be pro indiviso
  if NOT is_pro_indiviso_legacy(vacancy.legacy, co_legatees):
    // No accretion → legacy falls to estate (becomes part of free portion or intestate)
    return [Redistribution(recipient=ESTATE, amount=vacancy.value,
                            basis="Art. 1022(2) — no accretion, returns to estate")]

  // Accrete proportionally per Art. 1019
  return distribute_accretion(vacancy.value, co_legatees)
}
```

---

## 8. Interaction with Other Sub-Engines

### 8.1 Interaction with Representation (Arts. 970-977)

**Representation preempts accretion** for predecease and incapacity/unworthiness — but NEVER for renunciation (Art. 977).

| Vacancy Cause | Representation? | Accretion? |
|---------------|-----------------|------------|
| Predecease | YES (if descendants exist) | Only if no representatives |
| Incapacity/Unworthiness | YES for children/descendants (Art. 1035) | Only if no representatives |
| Renunciation | NEVER (Art. 977) | YES (primary resolution) |
| Disinheritance | YES (Art. 923) | Only if no representatives |

### 8.2 Interaction with Preterition (Art. 854)

Preterition annuls ALL institutions. After annulment, the entire estate distributes intestate. Accretion does not apply to the institutional shares because the institutions themselves are void. However, surviving legacies/devises may still have accretion among co-legatees/co-devisees (Art. 1023).

### 8.3 Interaction with Disinheritance (Arts. 915-923)

A validly disinherited heir's share is NOT "vacant" in the accretion sense — the heir is actively excluded, and their descendants step in by representation (Art. 923). Accretion only applies if:
- The disinherited heir has no descendants who can represent, AND
- The share source is the free portion (Art. 1021)

If the share source is the legitime and there are no representatives, the scenario re-evaluates per Art. 1021 ¶2.

### 8.4 Interaction with Art. 1050 — "Deemed Accepted"

Art. 1050(3) creates a subtle rule: If an heir renounces **gratuitously** in favor of co-heirs "upon whom the portion renounced should devolve by virtue of accretion," the inheritance is NOT deemed accepted (i.e., it remains a genuine renunciation, and accretion applies normally). But if the heir renounces for a price, or gratuitously for specific co-heirs (not the natural accretion beneficiaries), the renunciation is deemed an acceptance — meaning the estate tax and obligations pass to the "renouncing" heir.

Engine impact: The engine must verify whether a renunciation is genuine before triggering accretion.

```
function is_genuine_renunciation(renunciation: Renunciation,
                                   natural_accretion_heirs: List<Heir>) -> bool {
  if renunciation.is_for_price:
    return false  // Art. 1050(1)/(3): deemed acceptance
  if renunciation.is_gratuitous AND renunciation.beneficiaries != null:
    // Gratuitous but designated beneficiaries
    if set(renunciation.beneficiaries) != set(natural_accretion_heirs):
      return false  // Art. 1050(2): deemed acceptance
  return true  // Pure renunciation → accretion applies
}
```

---

## 9. Complete Engine Algorithm — Accretion Resolution

```
function resolve_all_vacancies(estate: Money, will: Will?, heirs: List<Heir>,
                                 distributions: Map<Heir, Distribution>) -> Map<Heir, Distribution> {
  // Detect all vacancies
  vacancies: List<VacantShare> = []
  for heir in heirs:
    cause = detect_vacancy(heir)
    if cause != null:
      vacancies.add(VacantShare(
        heir: heir,
        cause: cause,
        amount: distributions[heir].total,
        source: distributions[heir].source,    // LEGITIME or FREE_PORTION or INTESTATE
        disposition: distributions[heir].disposition
      ))

  // Process vacancies in order (legitime vacancies first, then FP, then intestate)
  for vacancy in sort_by_priority(vacancies):
    if will != null:
      // TESTATE: full resolution chain
      redistributions = resolve_testate_vacancy(vacancy, will, heirs, distributions)
    else:
      // INTESTATE: Art. 1018 always accrues
      redistributions = resolve_intestate_accretion(vacancy, heirs)

    // Apply redistributions
    for r in redistributions:
      distributions[r.recipient].total += r.amount
      distributions[r.recipient].accretion_narrative.add(r.basis)
      distributions[r.recipient].inherited_charges.extend(r.inherited_charges)

    // Remove vacant heir from distributions
    distributions.remove(vacancy.heir)

  return distributions
}

function resolve_testate_vacancy(vacancy: VacantShare, will: Will,
                                   heirs: List<Heir>,
                                   distributions: Map<Heir, Distribution>) -> List<Redistribution> {
  // Step 1: Substitution (Art. 859)
  if vacancy.disposition != null:
    sub = find_substitute(will, vacancy.disposition, vacancy.heir)
    if sub != null AND is_capable(sub):
      return [Redistribution(recipient=sub, amount=vacancy.amount,
                              basis="Art. 859/1022(1)", inherited_charges=vacancy.charges)]

  // Step 2: Representation (Arts. 970-977)
  if vacancy.cause != RENUNCIATION:  // Art. 977
    reps = find_representatives(vacancy.heir)
    if count(reps) > 0:
      return distribute_per_stirpes(reps, vacancy.amount,
                                     basis="Arts. 970-974")

  // Step 3: Accretion — depends on share source
  if vacancy.source == LEGITIME:
    // Art. 1021 ¶2: not accretion proper — re-evaluate in own right
    return [Redistribution(
      recipient=RECOMPUTE_SCENARIO,
      amount=vacancy.amount,
      basis="Art. 1021 ¶2 — compulsory heirs succeed in own right"
    )]

  if vacancy.source == FREE_PORTION:
    // Art. 1021 ¶1: accretion among FP co-heirs
    co_heirs = get_fp_co_heirs(vacancy.disposition, distributions)
    if count(co_heirs) > 0 AND is_pro_indiviso(vacancy.disposition, co_heirs):
      return distribute_accretion(vacancy.amount, co_heirs,
                                   basis="Arts. 1016/1019/1021 ¶1")
    // Not pro indiviso or no co-heirs → Art. 1022(2)
    return distribute_intestate(vacancy.amount, heirs,
                                 basis="Art. 1022(2) — intestate fallback")

  // Other: institution shares (voluntary heirs instituted in the estate)
  co_heirs = get_co_instituted_heirs(vacancy.disposition, distributions)
  if count(co_heirs) > 0 AND is_pro_indiviso_disposition(vacancy.disposition, co_heirs):
    return distribute_accretion(vacancy.amount, co_heirs,
                                 basis="Arts. 1016/1017/1019")

  // Art. 1022(2) fallback
  return distribute_intestate(vacancy.amount, heirs,
                               basis="Art. 1022(2) — intestate fallback")
}
```

---

## 10. Data Model Additions

```
struct VacantShare {
  heir: Heir,
  cause: VacancyCause,
  amount: Money,
  source: ShareSource,          // enum: LEGITIME, FREE_PORTION, INTESTATE
  disposition: Disposition?,    // null for intestate
  charges: List<Charge>,        // Art. 1020: carried obligations
}

enum VacancyCause {
  PREDECEASE,
  RENUNCIATION,
  INCAPACITY,
  UNWORTHINESS,
}

enum ShareSource {
  LEGITIME,
  FREE_PORTION,
  INTESTATE,
}

struct Redistribution {
  recipient: Heir | RECOMPUTE_SCENARIO | STATE | INTESTATE,
  amount: Money,
  basis: String,
  inherited_charges: List<Charge>,
  inherited_conditions: List<Condition>,
}

struct AccretionResult {
  original_vacancy: VacantShare,
  resolution_method: ResolutionMethod,
  redistributions: List<Redistribution>,
}

enum ResolutionMethod {
  SUBSTITUTION,            // Art. 859/1022(1)
  REPRESENTATION,          // Arts. 970-977
  ACCRETION_FP,           // Arts. 1016-1019, 1021 ¶1
  ACCRETION_INTESTATE,    // Art. 1018
  OWN_RIGHT_LEGITIME,     // Art. 1021 ¶2
  INTESTATE_FALLBACK,     // Art. 1022(2)
  SCENARIO_RECOMPUTE,     // Art. 969 (total repudiation)
  ESCHEAT,                // Art. 1011
}
```

---

## 11. Edge Cases

### EC-1: All Co-Heirs of Same Class Renounce (Testate — Legitime)

3 legitimate children: all renounce their legitime. Art. 1021 ¶2 says co-heirs succeed "in own right" — but there are no co-heirs left. Art. 969: next degree inherits. If no descendants at all, ascendants become compulsory heirs → complete scenario change (T1 → T6 or similar). If no compulsory heirs at all, entire estate becomes free portion.

### EC-2: All Co-Heirs of Same Class Renounce (Intestate)

Art. 969 directly: next degree inherits in their own right. E.g., all 3 children renounce → parents inherit per I5/I6, NOT by representation, NOT by accretion.

### EC-3: Renunciation of Free Portion but NOT Legitime

A compulsory heir can renounce ONLY the FP share they received via will while retaining their legitime. Their vacant FP share accretes to FP co-heirs per Art. 1021 ¶1. Their legitime remains intact.

### EC-4: Mixed Vacancy (Predecease + Renunciation in Same Scenario)

LC₁ predeceases (has children → representation), LC₂ renounces (no representation per Art. 977 → accretion to LC₃). Engine must handle both resolution methods in the same pass. Process predecease first (representation), then renunciation (accretion among remaining heirs including LC₁'s representatives).

### EC-5: Accretion Among Legatees of Specific Property

Will: "My car to A and B." A renounces. B gets the entire car by accretion (Art. 1023). The car is indivisible, so proportionality means B takes the whole.

### EC-6: Accretion Blocked by Determinate Property Designation

Will: "Lot 1 to A, Lot 2 to B." A renounces. B does NOT get Lot 1 by accretion — they are NOT pro indiviso (each has a specific, identifiable thing). Lot 1 falls to intestate per Art. 1022(2).

### EC-7: Cascading Accretion

Will: "FP ⅓ each to A, B, C." A renounces → accretes to B and C (each gets 1/6 more). Then B also renounces → B's total share (original ⅓ + accreted 1/6 = ½) accretes to C. C ends up with entire FP. Each step applies Art. 1019 proportionality.

### EC-8: Art. 1050 — Renunciation That Is Actually an Acceptance

Heir renounces "for ₱1M to be paid by co-heir X." This is renunciation for a price → deemed acceptance per Art. 1050(1). The heir is treated as having accepted and then sold. No accretion. Estate tax implications differ.

### EC-9: Usufruct Accretion

Will: "Usufruct of my building to A and B." A renounces. Art. 1023: B gets the full usufruct by accretion. The naked ownership is unaffected.

### EC-10: Accretion When Substitute Also Cannot Receive

Will: "Estate to A; if A cannot, then B." A predeceases, B is incapacitated. Substitution fails, representation checked (A's descendants?), then accretion checked (any co-heirs pro indiviso?). If none, Art. 1022(2): intestate.

### EC-11: Cross-Class Intestate Accretion (Controversial)

I4: 2 LC + 1 IC + spouse. IC renounces. Does the IC's share accrue to: (a) only LCs (same descending line)? (b) all remaining heirs (LCs + spouse)? Art. 1018 says "co-heirs" without distinction → engine default: accrue to ALL remaining heirs proportionally. But Art. 968 says "others of the same degree" — IC is not same degree as LC. Engine should flag this as a manual review point if cross-class intestate accretion occurs.

### EC-12: Spouse Renounces in Testate (Art. 1021)

Spouse renounces their share. If share = legitime → Art. 1021 ¶2: other compulsory heirs succeed in own right (scenario re-evaluation). If share = FP allocation → Art. 1021 ¶1: accretion among FP co-heirs.

---

## 12. Test Cases

### Testate Accretion — Pro Indiviso

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| T-AC-1 | Simple accretion: one of three FP co-heirs renounces | Estate ₱12M. 2 LC (L₁, L₂). Legitime: ₱6M (₱3M each). FP ₱6M willed: "⅓ each to L₁, L₂, friend F." F renounces. | F's ₱2M accretes: L₁ gets ₱1M more (total FP ₱3M), L₂ gets ₱1M more (total FP ₱3M). Final: L₁=₱6M, L₂=₱6M. |
| T-AC-2 | Accretion with unequal FP shares | Estate ₱10M. No compulsory heirs. Will: "½ to A, ⅓ to B, 1/6 to C." A predeceases (no substitute, no reps). | A's ₱5M accretes proportionally: B ratio = ⅓/(⅓+1/6) = 2/3 → gets ₱3.33M; C ratio = 1/3 → gets ₱1.67M. Final: B=₱6.67M, C=₱3.33M. |
| T-AC-3 | Art. 1017: "equal shares" still allows accretion | Estate ₱9M. No compulsory heirs. Will: "in equal shares to X, Y, Z." X renounces. | Pro indiviso per Art. 1017. X's ₱3M accretes: Y=₱4.5M, Z=₱4.5M. |
| T-AC-4 | Determinate property blocks accretion (Art. 1016) | Estate: Lot A (₱5M) + Lot B (₱5M). Will: "Lot A to X, Lot B to Y." X renounces. | NOT pro indiviso — each has specific property. No accretion. Lot A → intestate per Art. 1022(2). Y keeps Lot B. |

### Testate Accretion — Art. 1021 Distinction

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| T-AC-5 | Legitime vacancy: in own right (Art. 1021 ¶2) | Estate ₱12M. 3 LC (L₁, L₂, L₃). No will dispositions on FP. L₃ renounces (no children → no representation). | Art. 1021 ¶2: re-evaluate with 2 LC. New scenario T1 with n=2. Legitime = ½ × ₱12M = ₱6M → ₱3M each. FP = ₱6M undisposed → intestate. L₁ = ₱3M (legitime) + ₱3M (intestate FP) = ₱6M. L₂ = same. |
| T-AC-6 | FP accretion among compulsory heirs | Estate ₱12M. 2 LC (L₁, L₂). Legitime ₱6M (₱3M each). Will: "FP equally to L₁ and L₂." L₂ renounces FP only, retains legitime. | L₂ keeps ₱3M legitime. L₂'s FP share (₱3M) accretes to L₁ per Art. 1021 ¶1. Final: L₁=₱3M+₱6M=₱9M, L₂=₱3M. |
| T-AC-7 | FP accretion: compulsory heir + stranger | Estate ₱10M. 1 LC (L₁). Legitime ₱5M. Will: "FP ½ to L₁, ½ to charity C." C becomes incapacitated. | Art. 1021 ¶1: accretion. C's ₱2.5M accretes to L₁. Final: L₁ = ₱5M (legitime) + ₱5M (FP) = ₱10M. |
| T-AC-8 | Scenario change after legitime vacancy | Estate ₱12M. 2 LC + 1 IC + spouse. IC renounces (no representation). | Art. 1021 ¶2 for IC's legitime: re-evaluate from T5b (n=2, m=1, spouse) to T2 (n=2, spouse, no IC). All fractions recomputed. |

### Intestate Accretion

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| T-AC-9 | Simple intestate accretion among children | Estate ₱9M. I1: 3 LC. L₃ renounces (no children). | Art. 1018: L₃'s ₱3M accretes. L₁=₱4.5M, L₂=₱4.5M. |
| T-AC-10 | Art. 969: all children renounce | Estate ₱9M. I1: 3 LC. All renounce (none have children). Parents survive. | Art. 969: parents inherit in own right. Scenario re-evaluates to I5 (ascendants only). Parents split ₱9M equally. |
| T-AC-11 | Cross-class intestate accretion | Estate ₱12M. I4: 1 LC + 1 IC + spouse. IC renounces. | Engine default: IC's share (based on I4 formula) accretes to LC + spouse proportionally per Art. 1018. Flag for review per EC-11. |
| T-AC-12 | Spouse + siblings, sibling renounces | Estate ₱10M. I12: spouse + 2 siblings (S₁, S₂). S₂ renounces (no children). | Spouse = ₱5M (Art. 1001). Siblings' half = ₱5M. S₂'s ₱2.5M accretes to S₁ per Art. 1018. Final: spouse=₱5M, S₁=₱5M. |

### Resolution Priority

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| T-AC-13 | Substitution preempts accretion | Estate ₱9M. No compulsory heirs. Will: "⅓ each to A, B, C. If A cannot, D substitutes." A predeceases. | Art. 1022(1)/Art. 859: D takes A's ₱3M. B=₱3M, C=₱3M, D=₱3M. No accretion. |
| T-AC-14 | Representation preempts accretion | Estate ₱9M. 3 LC. L₁ predeceases but has 2 children (G₁, G₂). | Representation per Arts. 981-982. G₁=₱1.5M, G₂=₱1.5M (per stirpes). L₂=₱3M, L₃=₱3M. No accretion. |
| T-AC-15 | Renunciation: no representation, accretion applies | Estate ₱9M. 3 LC. L₁ renounces (has children but Art. 977 bars representation). | Art. 977: children cannot represent. Art. 1018: L₁'s ₱3M accretes to L₂ and L₃. Final: L₂=₱4.5M, L₃=₱4.5M. |
| T-AC-16 | Substitute also fails → accretion | Estate ₱9M. No compulsory heirs. Will: "⅓ each to A, B, C. If A cannot, D." A predeceases. D also predeceased. | Substitution fails. No representation (no compulsory heirs). Art. 1016 accretion: A's ₱3M accretes to B and C. B=₱4.5M, C=₱4.5M. |

### Legacy/Devise Accretion (Art. 1023)

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| T-AC-17 | Co-legatees: car bequeathed jointly | Estate ₱20M (includes car worth ₱2M). Will: "My car to A and B jointly." A renounces. | Art. 1023: B gets entire car by accretion. Indivisible property → B takes whole. |
| T-AC-18 | Co-devisees of real property | Estate includes a building (₱10M). Will: "Building to X, Y, Z in equal shares." X predeceases (no substitute, no reps). | Art. 1023/1017: pro indiviso. X's ⅓ accretes to Y and Z equally. Y=½ building, Z=½ building. |

### Cascading and Complex

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| T-AC-19 | Cascading accretion | Estate ₱12M. No compulsory heirs. Will: "¼ each to A, B, C, D." A renounces, then B renounces. | Step 1: A's ₱3M → B gets ₱1M, C gets ₱1M, D gets ₱1M. Step 2: B's ₱4M → C gets ₱2M, D gets ₱2M. Final: C=₱6M, D=₱6M. |
| T-AC-20 | Accretion + underprovision interaction | Estate ₱10M. 2 LC + 1 voluntary heir V. Will gives L₁ ₱2M, L₂ ₱2M, V ₱6M. V renounces. Legitime per child = ₱2.5M. | V's ₱6M → not pro indiviso with LCs (V has specific amount from FP). Falls to intestate per Art. 1022(2). But L₁ and L₂ still underprovided (₱2M < ₱2.5M). Art. 855 underprovision recovery from V's now-intestate share. |
| T-AC-21 | Mixed predecease + renunciation in same will | Estate ₱12M. Will: "⅓ each to A, B, C" (voluntary). A predeceases (has child A₁). B renounces. | A: representation → A₁ gets ₱4M. B: no representation (Art. 977) → accretion to remaining co-heirs (A₁ and C). B's ₱4M: A₁ gets ₱2M, C gets ₱2M. Final: A₁=₱6M, C=₱6M. Wait — but A₁ is a representative, not an original co-heir. Does Art. 1016 apply to A₁? A₁ stepped into A's shoes (Art. 970), so A₁ is now a co-heir pro indiviso. Accretion of B's share includes A₁. |

---

## 13. Narrative Templates

### Template: Simple Accretion

> **[Friend F]** was designated to receive **₱2,000,000** as a share of the free portion under the will. However, [F] renounced the inheritance. Under **Article 1015** of the Civil Code, [F]'s vacant share accretes to the remaining co-heirs designated to the same portion. Per **Article 1019**, this accretion is proportional to each co-heir's existing share. As a result, [F]'s **₱2,000,000** is distributed equally between **[L₁]** and **[L₂]**, each receiving an additional **₱1,000,000**.

### Template: Art. 1021 Legitime Recomputation

> **[L₃]** renounced the inheritance. Since [L₃] had no descendants to represent them (**Art. 977** bars representation for renouncing heirs), [L₃]'s share of the **legitime** became vacant. Under **Article 1021** of the Civil Code, when a compulsory heir's legitime is repudiated, the remaining compulsory heirs succeed to it **in their own right**, not by accretion. The inheritance was therefore recomputed as if only **two** legitimate children survived, resulting in each receiving **₱3,000,000** as their individual legitime (½ of ₱12,000,000 ÷ 2).

### Template: Intestate Accretion

> **[Sibling S₂]** renounced the inheritance. Under **Article 1018** of the Civil Code, in intestate succession, the share of a person who repudiates the inheritance shall always accrue to co-heirs. [S₂]'s share of **₱2,500,000** therefore accretes to **[Sibling S₁]**, the remaining co-heir of the same degree. Per **Article 1019**, accretion is proportional to existing shares. Since [S₁] is the sole remaining sibling, [S₁] receives the entire vacant share.

### Template: Resolution Priority (Substitution Over Accretion)

> **[A]** predeceased the testator. The will designated **[D]** as a substitute for [A] under **Article 859** of the Civil Code. Since a valid substitution exists, [D] inherits [A]'s share of **₱3,000,000** per **Article 1022(1)**. The right of accretion under **Article 1015** does not apply because substitution takes priority.

### Template: Art. 969 Total Repudiation

> All three legitimate children — **[L₁]**, **[L₂]**, and **[L₃]** — renounced the inheritance. Under **Article 969** of the Civil Code, when all the nearest relatives repudiate, those of the following degree inherit **in their own right**. The decedent's parents, **[Father]** and **[Mother]**, therefore inherit the estate as the next class of heirs under intestate succession, dividing the estate of **₱9,000,000** equally (**₱4,500,000** each).

---

## 14. Pipeline Integration

Accretion resolution sits as a **post-distribution correction step** in the computation pipeline:

```
INPUT: net_distributable_estate + family_tree + will (optional)
  → Step 1: Classify heirs
  → Step 2: Determine succession type (testate/intestate/mixed)
  → Step 3: Compute each compulsory heir's legitime
  → Step 4: Compute total legitime and free portion
  → Step 5: Distribute (per will if testate, per intestate rules if not)
  → Step 5.5: DETECT VACANCIES
  → Step 6: RESOLVE VACANCIES (this analysis)
  │   ├─ For each vacancy: substitution → representation → accretion → intestate
  │   ├─ If Art. 1021 ¶2 triggered: GOTO Step 3 (recompute with fewer heirs)
  │   ├─ If Art. 969 triggered: GOTO Step 1 (reclassify heirs)
  │   └─ Art. 1020: carry forward charges/obligations
  → Step 7: Compute final per-heir amounts
  → Step 8: Generate per-heir narrative explanations
OUTPUT: per-heir breakdown (amounts + narrative)
```

**Critical**: Vacancy resolution may trigger a **pipeline restart** (scenario re-evaluation per Art. 1021 ¶2 or Art. 969). The engine must detect this and loop back, with a guard against infinite loops (max iterations = number of heirs, since each iteration removes at least one heir).

```
function compute_with_vacancy_resolution(estate: Money, will: Will?,
                                           all_heirs: List<Heir>) -> FinalResult {
  active_heirs = all_heirs.copy()
  max_iterations = count(all_heirs)

  for iteration in 0..max_iterations:
    // Steps 1-5: normal computation
    result = compute_distribution(estate, will, active_heirs)

    // Step 5.5: detect vacancies
    vacancies = detect_all_vacancies(active_heirs, result)
    if count(vacancies) == 0:
      return result  // No vacancies → done

    // Step 6: resolve vacancies
    for vacancy in vacancies:
      resolution = resolve_vacancy(vacancy, will, active_heirs)

      if resolution.method == SCENARIO_RECOMPUTE:
        // Art. 1021 ¶2 or Art. 969: remove heir, restart pipeline
        active_heirs.remove(vacancy.heir)
        break  // Restart outer loop with reduced heir pool
      else:
        // Apply accretion/substitution/representation
        apply_resolution(result, resolution)
        active_heirs.remove(vacancy.heir)

  return result  // Should converge within max_iterations
}
```
