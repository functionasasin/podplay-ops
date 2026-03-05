# Vacancy Resolution — Arts. 1015–1023

**Aspect**: vacancy-resolution
**Wave**: 2 (Domain Rule Extraction)
**Primary Legal Basis**: Arts. 1015–1023 (Accretion); Arts. 857–863 (Substitution); Arts. 970–977 (Representation); Art. 1022 (Fallback)
**Depends On**: heir-classification, heir-concurrence, representation, legitime-fractions, intestate-distribution

---

## Overview

When a designated heir, devisee, or legatee **cannot or will not** receive their share, the share becomes "vacant." The Civil Code establishes a four-step resolution chain:

1. **Substitution** (Art. 859 / Art. 1022) — testate only
2. **Representation** (Arts. 970–977) — descendants step in
3. **Accretion** (Arts. 1015–1021) — co-heirs absorb proportionally
4. **Intestate fallback** (Art. 1022(2)) — pass to legal heirs

The engine must check these in strict order. Accretion is NOT the first resort.

---

## 1. Vacancy Triggers

| Trigger | Article | Representation? | Accretion? |
|---------|---------|-----------------|------------|
| Predecease | 1015, 1016(2) | YES if descendants exist | Only if no reps |
| Renunciation | 1015, 1018 | NEVER (Art. 977) | YES (primary) |
| Incapacity (Art. 1027) | 1016(2) | YES for children/descendants (Art. 1035) | Only if no reps |
| Unworthiness (Art. 1032) | 1016(2) | YES for children/descendants (Art. 1035) | Only if no reps |
| Disinheritance | 915–923 | YES for children/descendants (Art. 923) | Only if no reps |

**Key rule**: Art. 977 — a **renouncing** heir may NEVER be represented. Renunciation goes directly to accretion (skipping substitution check for legitime).

---

## 2. Resolution Priority Chain

```
VACANCY DETECTED
  │
  ├─ Step 1: SUBSTITUTION (testate only, Art. 859 / 1022(1))
  │     Will designates a substitute for this heir?
  │     → YES: substitute inherits. DONE.
  │     → NO: continue
  │
  ├─ Step 2: REPRESENTATION (Arts. 970–977)
  │     Vacancy cause ≠ RENUNCIATION AND descendants exist?
  │     → YES: representatives inherit per stirpes. DONE.
  │     → NO: continue
  │
  ├─ Step 3: ACCRETION (Arts. 1015–1021)
  │     ├─ If source == LEGITIME:
  │     │     Art. 1021 ¶2: co-heirs succeed "in own right"
  │     │     → TRIGGER SCENARIO RECOMPUTE (not true accretion)
  │     ├─ If source == FREE_PORTION (testate):
  │     │     Art. 1021 ¶1: accretion among FP co-heirs (requires pro indiviso)
  │     │     → proportional distribution (Art. 1019)
  │     └─ If source == INTESTATE:
  │           Art. 1018: always accrues to co-heirs
  │           → proportional distribution (Art. 1019)
  │
  └─ Step 4: INTESTATE FALLBACK (Art. 1022(2), testate only)
        No accretion possible → vacant share passes to legal heirs
        with same charges and obligations
```

---

## 3. Art. 1021 — The Critical Legitime/Free Portion Distinction

### 3.1 Vacant LEGITIME (Art. 1021 ¶2)

> "Should the part repudiated be the legitime, the other co-heirs shall succeed to it **in their own right**, and not by the right of accretion."

**This is NOT simple addition.** The engine must **recompute the scenario** as if the vacating heir never existed:

1. Remove the heir from the active heir pool
2. Re-determine the scenario code (e.g., T5 with n=3 → T5 with n=2)
3. Recompute all legitimes from scratch
4. Restart pipeline from Step 1

**Example**: Estate ₱12M, 3 LC. L₃ renounces (no children → no representation per Art. 977).
- WRONG (simple addition): L₁ = ₱2M + ₱1M = ₱3M, L₂ = ₱2M + ₱1M = ₱3M
- CORRECT (own right): Recompute with 2 LC → legitime = ½ × ₱12M ÷ 2 = ₱3M each
- Numeric result same here but legal basis differs; in mixed-heir scenarios (LC+IC+spouse), the fractions **change fundamentally**

### 3.2 Vacant FREE PORTION Share (Art. 1021 ¶1)

> "Among the compulsory heirs the right of accretion shall take place only when the free portion is left to two or more of them, or to any one of them and to a stranger."

True accretion: vacant FP share distributes proportionally to remaining FP co-heirs per Art. 1019. Requires pro indiviso (Art. 1016).

**Example**: Estate ₱12M, 2 LC. Legitime ₱6M (₱3M each). Will: "FP equally to L₁ and L₂." L₂ renounces FP only:
- L₂ retains ₱3M legitime
- L₂'s FP share (₱3M) accretes to L₁ per Art. 1021 ¶1
- Final: L₁ = ₱3M + ₱6M = ₱9M, L₂ = ₱3M

---

## 4. Testate Accretion Requirements (Arts. 1016–1017)

### 4.1 Pro Indiviso Requirement (Art. 1016)

Two conditions must both hold:
1. Two or more persons called to the **same inheritance or same portion, pro indiviso**
2. One predeceases, renounces, or is incapacitated

### 4.2 Art. 1017 — "Equal Shares" Does NOT Block Accretion

> "The words 'one-half for each' or 'in equal shares' … shall not exclude the right of accretion."

The test is whether each heir is made the **exclusive owner of a specific, identifiable thing**. Aliquot fractions of the same pool = pro indiviso.

| Will Language | Pro Indiviso? | Accretion? |
|---------------|---------------|------------|
| "My estate to A, B, and C" | YES | YES |
| "½ to A, ½ to B" | YES (Art. 1017) | YES |
| "In equal shares to A and B" | YES (Art. 1017) | YES |
| "The house to A, the farm to B" | NO | NO |
| "Lot 1 to A, Lot 2 to B" | NO | NO |
| "FP: ¼ to A, ¼ to B, ½ to charity C" | YES (same FP pool) | YES |

---

## 5. Intestate Accretion (Arts. 1018, 968–969)

### 5.1 Art. 1018 — Always Accrues

In intestate succession there is **no pro indiviso requirement**. A repudiating heir's share always accrues to co-heirs. Art. 968 extends this to incapacity/unworthiness.

### 5.2 Art. 969 — Total Repudiation → Next Degree

If **ALL** nearest relatives of the same degree repudiate:
- No accretion (no remaining co-heirs)
- Next degree inherits **in their own right** (not by representation, not by accretion)
- Engine must fully re-evaluate scenario from scratch

**Example**: 3 LC all renounce → parents inherit under I5/I6, NOT by representation.

### 5.3 Art. 1019 — Proportionality Rule

> "The heirs to whom the portion goes by the right of accretion take it in the same proportion that they inherit."

The vacant share distributes **proportionally** to existing shares — NOT equally.

```
fn distribute_accretion(
    vacant_amount: BigRational,
    co_heirs: &[(HeirId, BigRational)]  // (heir, current_share)
) -> Vec<(HeirId, BigRational)> {
    let total_existing: BigRational = co_heirs.iter().map(|(_, s)| s).sum();
    co_heirs.iter().map(|(id, share)| {
        (*id, vacant_amount * share / &total_existing)
    }).collect()
}
```

---

## 6. Art. 1020 — Obligations Transfer with Accretion

> "The heirs to whom the inheritance accrues shall succeed to all the rights and obligations which the heir who renounced or could not receive it would have had."

The accreting heir inherits:
- Charges/conditions imposed on the vacant share in the will
- Proportional debts attached to that share
- Fideicommissary obligations if any

**Engine implication**: `VacantShare` must carry `inherited_charges: Vec<Charge>` and these must be forwarded to accreting heirs.

---

## 7. Art. 1023 — Extension to Devisees, Legatees, Usufructuaries

Same accretion rules apply to co-legatees, co-devisees, and co-usufructuaries under the same conditions (pro indiviso + vacancy). An indivisible thing (car, single lot devised jointly) goes entirely to the surviving co-devisee/co-legatee.

---

## 8. Rust Data Model

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VacancyCause {
    Predecease,
    Renunciation,
    Incapacity,    // Art. 1027
    Unworthiness,  // Art. 1032
    Disinheritance, // Arts. 915-923
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ShareSource {
    Legitime,
    FreePortion,
    Intestate,
    Legacy,        // Specific bequest
    Devise,        // Real property bequest
}

#[derive(Debug, Clone)]
pub struct VacantShare {
    pub heir_id: HeirId,
    pub cause: VacancyCause,
    pub amount: BigRational,         // Centavos
    pub source: ShareSource,
    pub disposition_id: Option<DispositionId>, // null for intestate
    pub inherited_charges: Vec<Charge>,        // Art. 1020
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ResolutionMethod {
    Substitution,          // Art. 859 / 1022(1)
    Representation,        // Arts. 970-977
    AccretionFp,           // Arts. 1016-1019, 1021 ¶1
    AccretionIntestate,    // Art. 1018
    OwnRightLegitime,      // Art. 1021 ¶2 → triggers recompute
    IntestatesFallback,    // Art. 1022(2)
    ScenarioRecompute,     // Art. 969 (total repudiation)
    Escheat,               // Art. 1011 (State)
}

#[derive(Debug, Clone)]
pub struct VacancyResolution {
    pub vacancy: VacantShare,
    pub method: ResolutionMethod,
    pub redistributions: Vec<Redistribution>,
    pub requires_restart: bool,      // true for OwnRightLegitime / ScenarioRecompute
}

#[derive(Debug, Clone)]
pub struct Redistribution {
    pub recipient: HeirId,           // or sentinel for STATE/INTESTATE
    pub amount: BigRational,
    pub basis: String,               // Legal citation for narrative
    pub inherited_charges: Vec<Charge>,
}
```

---

## 9. Pipeline Integration

Vacancy resolution is a **post-distribution step** that may trigger pipeline restarts:

```
Step 1: classify_heirs()
Step 2: determine_scenario()
Step 3: compute_legitimes()
Step 4: compute_free_portion()
Step 5: initial_distribution()
  ↓
Step 6: detect_vacancies() → Vec<VacantShare>
  if empty → DONE
Step 7: resolve_vacancies()
  for each VacantShare:
    if resolution.requires_restart:
      remove heir from pool
      GOTO Step 1 (with max_restarts guard)
    else:
      apply redistributions in-place
      remove vacant heir from active set
  GOTO Step 6 (re-check for cascading vacancies)
Step 8: collation_adjustment()
Step 9: rounding()
Step 10: generate_narratives()
```

**Max restarts guard**: `max_restarts = initial_heir_count`. Each restart removes at least one heir, so convergence is guaranteed. Return `Err(ComputationError::ExceededMaxRestarts)` if guard triggers (indicates a bug).

---

## 10. Edge Cases

### EC-1: All Co-Heirs of Same Class Renounce (Testate — Legitime)
3 LC all renounce. Art. 1021 ¶2 removes each → eventually no compulsory heirs → scenario changes to ascendants or spouse as primary heirs. If no one left, entire estate to intestate heirs or State.

### EC-2: All Co-Heirs Renounce (Intestate)
Art. 969: next degree inherits in own right. E.g., 3 LC all renounce → parents inherit under I5/I6, NOT by representation.

### EC-3: Partial Renunciation (FP only, not Legitime)
A compulsory heir retains legitime but renounces their will-allocated FP share. FP share accretes per Art. 1021 ¶1. Legitime unaffected.

### EC-4: Mixed Vacancy (Predecease + Renunciation Same Scenario)
Process predecease first (representation may apply) then renunciation (no representation per Art. 977 → accretion). Handle sequentially, not in parallel.

### EC-5: Determinate Property Blocks Accretion
"Lot 1 to A, Lot 2 to B." A renounces. NOT pro indiviso → no accretion. Lot 1 falls to Art. 1022(2) intestate fallback.

### EC-6: Cascading Accretion
"¼ each to A, B, C, D." A renounces → ¼ accretes proportionally to B, C, D. Then B renounces → B's augmented share (⅓) accretes proportionally to C and D. Final: C = ½, D = ½.

### EC-7: Substitute Also Fails
A predeceases, named substitute D also predeceased. Substitution fails → check representation → check accretion → Art. 1022(2) intestate fallback.

### EC-8: Renunciation Deemed Acceptance (Art. 1050)
If renunciation is "for a price" or gratuitously in favor of specific heirs other than the natural accretion beneficiaries → deemed acceptance, not genuine renunciation. Engine must check `renunciation.is_genuine` before triggering accretion.

### EC-9: Art. 1021 Recompute Changes All Fractions
Estate ₱12M, 2 LC + 1 IC + spouse (scenario T5b, n=2, m=1). IC renounces. Art. 1021 ¶2: remove IC, recompute as T2 (n=2 LC + spouse). All heir fractions change, not just IC's slot redistribution.

### EC-10: Accretion Among Legatees of Indivisible Property
"My car (₱2M) to A and B jointly." A renounces. B gets entire car by Art. 1023 accretion. Indivisible property → B takes whole, no cash adjustment needed.

### EC-11: Cross-Class Intestate Accretion (Flag for Review)
Scenario I4 (1 LC + 1 IC + spouse). IC renounces. Does IC's share accrue to all remaining heirs or only same-degree? Art. 1018 says "co-heirs" without restriction but Art. 968 says "others of the same degree." **Engine default**: accrue to all remaining heirs proportionally; flag as `MANUAL_REVIEW_RECOMMENDED` in output warnings.

---

## 11. Test Vectors

| ID | Scenario | Estate | Setup | Expected |
|----|----------|--------|-------|----------|
| TV-VAC-01 | Testate FP accretion (Art. 1021 ¶1) | ₱12M | 2 LC. Legitime ₱6M (₱3M each). Will: "FP ⅓ each to L₁, L₂, friend F." F renounces. | L₁=₱3M+₱4M=₱7M, L₂=₱3M+₱4M=₱7M, F=₱0 |
| TV-VAC-02 | Legitime vacancy recompute (Art. 1021 ¶2) | ₱12M | 3 LC, no will. L₃ renounces, no children. | Recompute with 2 LC: each gets ₱6M. |
| TV-VAC-03 | Intestate accretion simple (Art. 1018) | ₱9M | I1: 3 LC. L₃ renounces, no children. | L₁=₱4.5M, L₂=₱4.5M |
| TV-VAC-04 | Art. 969 total repudiation | ₱9M | I1: 3 LC all renounce. Parents alive. | Recompute I5: parents split ₱9M equally. |
| TV-VAC-05 | Substitution preempts accretion | ₱9M | No compulsory heirs. "⅓ each to A, B, C. If A cannot, D." A predeceases. | D=₱3M, B=₱3M, C=₱3M. No accretion. |
| TV-VAC-06 | Representation preempts accretion (predecease) | ₱9M | 3 LC. L₁ predeceases, has 2 grandchildren G₁, G₂. | G₁=₱1.5M, G₂=₱1.5M (per stirpes). L₂=₱3M, L₃=₱3M. |
| TV-VAC-07 | Renunciation: Art. 977 blocks representation | ₱9M | 3 LC. L₁ renounces (has children). | Children cannot represent (Art. 977). L₁'s ₱3M accretes: L₂=₱4.5M, L₃=₱4.5M. |
| TV-VAC-08 | Determinate property → no accretion | ₱10M | "Lot A (₱5M) to X, Lot B (₱5M) to Y." X renounces. | Not pro indiviso. Lot A → intestate (₱5M). Y keeps Lot B. |
| TV-VAC-09 | Cascading accretion | ₱12M | No compulsory heirs. "¼ each to A, B, C, D." A renounces, then B renounces. | C=₱6M, D=₱6M |
| TV-VAC-10 | Art. 1023: co-legatee accretion | ₱20M | "My car (₱2M) to A and B jointly." A renounces. | B gets entire car (₱2M) by accretion. |
| TV-VAC-11 | Substitute also fails → accretion | ₱9M | "⅓ each to A, B, C. If A cannot, D." A and D both predeceased. No compulsory heirs. | Substitution fails. A's ₱3M accretes: B=₱4.5M, C=₱4.5M. |
| TV-VAC-12 | Mixed predecease + renunciation | ₱12M | "⅓ each to A, B, C." A predeceases (child A₁ exists). B renounces. | A₁=₱4M+₱2M=₱6M (rep + accreted), C=₱4M+₱2M=₱6M |

---

## 12. Narrative Templates

### Accretion (Free Portion)
> **[F]** was designated ₱X from the free portion but renounced the inheritance. Under **Article 1015**, this vacant share accretes to the remaining co-heirs designated to the same portion. Per **Article 1019**, accretion is proportional to each co-heir's existing share. **[L₁]** and **[L₂]** each receive an additional ₱Y.

### Art. 1021 ¶2 — Legitime Recomputation
> **[L₃]** renounced the inheritance with no descendants to represent them (**Art. 977** bars representation for renouncing heirs). Since the vacant share is part of the **legitime**, **Article 1021** provides that co-heirs succeed in their **own right**. The legitime was recomputed as if only **[N]** legitimate children survived, yielding ₱Z each.

### Intestate Accretion
> **[S₂]** repudiated the inheritance. Under **Article 1018**, in intestate succession the repudiated share **always accrues** to co-heirs. Per **Article 1019**, this accretes proportionally to **[S₁]** and **[Spouse]**.

### Art. 969 — Total Repudiation
> All legitimate children repudiated the inheritance. Under **Article 969**, when all heirs of the nearest degree repudiate, the following degree inherits **in their own right**. The decedent's parents inherit the estate of ₱X, divided equally.

### Substitution
> **[A]** predeceased the testator. The will designated **[D]** as substitute under **Article 859**. **[D]** therefore inherits [A]'s share of ₱X per **Article 1022(1)**. The right of accretion does not apply.

---

## 13. Invariants

1. **Priority chain**: Substitution → Representation → Accretion → Intestate. No step may be skipped except when the prior step succeeds.
2. **Art. 977**: A renouncing heir's descendants can never represent them.
3. **Art. 1021 ¶2**: A vacant legitime share triggers scenario recompute, NOT proportional accretion.
4. **Pro indiviso** (testate): Accretion of a will-allocated share requires the co-heirs were called to the same undivided thing or pool.
5. **Art. 1019**: All accretion distributes proportionally to existing shares, never equally unless shares happen to be equal.
6. **Art. 1020**: Inherited charges travel with the accreted share.
7. **Art. 969**: If all heirs of the nearest degree repudiate, the engine fully re-evaluates the scenario from scratch with the next degree.
8. **Convergence guard**: Each restart removes at least one heir from the active pool, ensuring termination within `initial_heir_count` restarts.
9. **Art. 1023**: Accretion among legatees/devisees follows identical rules; indivisible property goes entirely to surviving co-legatee.
10. **Art. 1011**: If no eligible heir remains after all resolution steps, the estate escheats to the State.
