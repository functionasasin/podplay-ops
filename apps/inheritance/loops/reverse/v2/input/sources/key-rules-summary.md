# Philippine Succession Law — Key Rules Quick Reference

*Cross-source summary for rapid lookup during engine/spec authoring.*
*All 30 testate/intestate scenarios, Iron Curtain, representation, collation, disinheritance.*

---

## 1. Compulsory Heirs (Art. 887 + FC Art. 176 + RA 8552)

### Four Effective Groups

| Group | Members | Excluded By | Always Participates? |
|-------|---------|-------------|---------------------|
| G1: LEGITIMATE_CHILD_GROUP | Legitimate biological, Legitimated (FC 177–179), Adopted (RA 8552 Sec. 17) | Nobody | Yes |
| G2: LEGITIMATE_ASCENDANT_GROUP | Legitimate parents/grandparents | G1 (Art. 887(2)) | Only if no G1 |
| G3: SURVIVING_SPOUSE_GROUP | Widow/Widower (not guilty of legal separation) | Nobody | Yes (if eligible) |
| G4: ILLEGITIMATE_CHILD_GROUP | All illegitimate children with proved filiation | Nobody | Yes |

### Eligibility Gate (Pre-Classification Filter)

An heir is **ineligible** if:
- Dead with no eligible representatives
- Unworthy (Art. 1032) and unworthiness not condoned (Art. 1033)
- Illegitimate without proved filiation (Art. 887 ¶3)
- Spouse guilty of legal separation (Art. 1002)
- Adopted with rescinded adoption (RA 8552 Sec. 20)
- Validly disinherited (Arts. 915–923)
- Has renounced (Art. 1041; but their children may NOT represent them per Art. 977)

---

## 2. Testate Legitime Fraction Table (T1–T15)

### Regime A: Descendants Present

| # | Survivors | Children Legit. | Spouse Legit. | Illegit. Legit. | Free Portion |
|---|-----------|-----------------|---------------|-----------------|-------------|
| T1 | n legit. children | ½ (shared, 1/(2n) each) | — | — | ½ |
| T2 | 1 legit. child + spouse | ½ | ¼ | — | ¼ |
| T3 | n≥2 legit. + spouse | ½ (1/(2n) each) | 1/(2n) | — | (n−1)/(2n) |
| T4 | n legit. + m illegit. | ½ (1/(2n) each) | — | min(m×1/(4n), ½) ÷ m each | Remainder |
| T5 | n legit. + m illegit. + spouse | ½ (1/(2n) each) | ¼ (n=1) or 1/(2n) (n≥2) | Capped at FP−spouse | Remainder |

**Cap rule (Art. 895 ¶3)**: Total illegit. ≤ FP; spouse satisfied first from FP.

### Regime B: Ascendants Present (No Descendants)

| # | Survivors | Ascendants Legit. | Spouse Legit. | Illegit. Legit. | Free Portion |
|---|-----------|------------------|---------------|-----------------|-------------|
| T6 | Ascendants only | ½ | — | — | ½ |
| T7 | Ascendants + spouse | ½ | ¼ | — | ¼ |
| T8 | Ascendants + m illegit. | ½ | — | ¼ total (1/(4m) each) | ¼ |
| T9 | Ascendants + m illegit. + spouse | ½ | ⅛ | ¼ total (1/(4m) each) | ⅛ |

*Ascendant division within group: Art. 890 — equal if same degree; by line if different (½ paternal, ½ maternal).*

### Regime C: No Primary Compulsory Heirs

| # | Survivors | Spouse Legit. | Illegit. Legit. | Free Portion |
|---|-----------|---------------|-----------------|-------------|
| T10 | m illegit. + spouse | ⅓ | ⅓ total (1/(3m) each) | ⅓ |
| T11 | m illegit. only | — | ½ total (1/(2m) each) | ½ |
| T12 | Spouse only | ½ (⅓ if articulo mortis) | — | ½ (⅔ if articulo mortis) |
| T13 | None | — | — | 1 (entire estate) |

### Special: Illegitimate Decedent's Parents (Art. 903)

| # | Survivors | Parents Legit. | Spouse Legit. | Free Portion |
|---|-----------|---------------|---------------|-------------|
| T14 | Parents of illegit. decedent only | ½ | — | ½ |
| T15 | Parents + spouse of illegit. decedent | ¼ | ¼ | ½ |

*Note: If illegit. decedent has own children, parents get NOTHING (Art. 903 ¶2).*

---

## 3. Intestate Distribution (I1–I15)

| # | Survivors | Distribution |
|---|-----------|-------------|
| I1 | n legit. children | Equal shares (1/n each) |
| I2 | n legit. + spouse | Spouse = 1 child's share; all equal (1/(n+1) each) |
| I3 | n legit. + m illegit. | Legit. unit=2, illegit. unit=1; per unit shares |
| I4 | n legit. + m illegit. + spouse | Spouse=legit. unit, illegit.=½; ratio method |
| I5 | Parents only | Equal (or all to survivor) |
| I6 | Parents + spouse | ½ parents, ½ spouse |
| I7 | m illegit. only | Equal shares (entire estate) |
| I8 | m illegit. + spouse | ½ spouse, ½ illegit. children |
| I9 | Ascendants + m illegit. | ½ ascendants, ½ illegit. children |
| I10 | Ascendants + m illegit. + spouse | ½ asc., ¼ illegit., ¼ spouse |
| I11 | Spouse only | Entire estate |
| I12 | Spouse + siblings/nephews/nieces | ½ spouse, ½ siblings |
| I13 | Siblings only | Art. 1004–1006 (full blood = 2× half blood) |
| I14 | Other collaterals (≤5th degree) | Per degree |
| I15 | No heirs | Entire estate → State |

**Iron Curtain Rule (Art. 992)**: Illegitimate children cannot inherit ab intestato from the legitimate relatives of their biological parents, and vice versa.

---

## 4. Right of Representation (Arts. 970–977)

### Four Triggers
1. **Predecease** (Art. 981) — heir died before decedent
2. **Incapacity/Unworthiness** (Arts. 1032, 1035) — heir legally excluded
3. **Disinheritance** (Art. 923) — heir validly disinherited by will
4. **Valid within collateral line** (Art. 972) — nephews/nieces represent predeceased siblings

### Key Rules
- Per stirpes always (Art. 974): representatives share what person represented would have gotten
- Collateral: nephews/nieces represent IF surviving with uncles/aunts; per capita IF alone (Art. 975)
- Renunciation does NOT trigger representation (Art. 977)
- Representative need not have inherited from the person represented (Art. 976)
- Ascending line: NEVER (nearer-excludes-more-remote applies instead)

---

## 5. Disinheritance (Arts. 915–923)

### Formal Requirements
- Must be in a will (Art. 916)
- Cause must be specified (Art. 916)
- Cause must be one of the enumerated grounds (Arts. 919–921)

### Grounds: Children/Descendants (Art. 919) — 8 grounds
1. Attempt on testator's/family's life
2. Groundless accusation of crime (6+ years imprisonment)
3. Conviction of adultery/concubinage with testator's spouse
4. Fraud/violence/undue influence on will-making
5. Refusal to support parent without justifiable cause
6. Maltreatment by word or deed
7. Leading a dishonorable/disgraceful life
8. Conviction for crime carrying civil interdiction

### Grounds: Parents/Ascendants (Art. 920) — 8 grounds
Similar plus: abandonment, loss of parental authority, attempt against other parent's life.

### Grounds: Spouse (Art. 921) — 6 grounds
Similar plus: cause for legal separation, grounds for loss of parental authority.

### Effects
- **Valid disinheritance**: heir excluded; descendants represent (Art. 923)
- **Invalid disinheritance (Art. 918)**: institution of heirs annulled to extent it prejudices disinherited heir; legacies valid
- **Reconciliation (Art. 922)**: voids the disinheritance; heir reinstated

### BUG-001 Fix (Multiple Simultaneous Disinheritances)
When 2+ heirs are disinherited:
1. Remove ALL disinherited heirs from eligible heir list
2. Add their descendants as representatives
3. Recompute scenario code ONCE with the final eligible heir set
4. Distribute based on recomputed scenario
- DO NOT process each disinheritance individually and redistribute after each

---

## 6. Collation (Arts. 1061–1077)

### Who Must Collate
- Compulsory heir who succeeds WITH other compulsory heirs (Art. 1061)
- Representative grandchildren collate what parent would have collated (Art. 1064)

### What Is NOT Collatable
- Support, education, medical care, apprenticeship, customary gifts (Art. 1067)
- Professional/vocational expenses (Art. 1068, unless they impair legitime)
- Donations expressly excluded by donor (Art. 1062)
- Property given to spouse of child (Art. 1066, except joint donations: child collates ½)
- Testamentary property (Art. 1063, unless testator provides otherwise)

### What IS Collatable
- Inter vivos donations to compulsory heirs (Art. 1061)
- Debts paid by parent for child, election expenses, fines (Art. 1069)
- Joint donations: child collates ½ (Art. 1066)
- Wedding gifts exceeding 1/10 of disposable portion (Art. 1070)

### Valuation
- Value at time of donation (Art. 1071), not at death
- Subsequent increase/decrease: donee's risk

### Collation Algorithm
```
estate_for_computation = net_estate_at_death + sum(collatable_donations)  // Art. 908
per_heir_legitime = compute_legitime(estate_for_computation, scenario)

// Imputation (Art. 909)
// Donations to compulsory heirs → charged to their legitime
// Donations to strangers → charged to free portion
// If donation > heir's share → heir may owe estate (reduction)
```

---

## 7. Testate Validation Rules

### Preterition (Art. 854)
- **Trigger**: Total omission of a compulsory heir in the direct line from the will
- **Effect**: Institution of heir is ENTIRELY ANNULLED (not just partially)
- **Exception**: Devises and legacies remain valid to the extent not inofficious
- **Caveat**: If the preterited heir dies before testator → preterition does not occur

### Invalid Disinheritance (Art. 918)
- **Effect**: Institution annulled ONLY to extent it prejudices the disinherited heir's legitime
- **Narrower than preterition**: Only the prejudicial portion is annulled

### Inofficiousness (Arts. 909–911)
- **When**: Testamentary dispositions + donations exceed the free portion
- **Reduction order**: (1) Reduce legacies/devises proportionally; (2) if still insufficient, reduce donations in reverse chronological order

### Underprovision
- **When**: Heir's will allocation < their legitime
- **Effect**: Heir can claim the deficiency from the estate

### Condition Stripping (Art. 872)
- **Rule**: Testator cannot impose conditions on the legitime
- **Effect**: Conditions on the legitime portion are treated as not written

---

## 8. Accretion and Vacancy Resolution (Arts. 1015–1023)

### Vacancy Triggers
1. Heir predeceases testator
2. Heir renounces
3. Heir is incapacitated

### Resolution Cascade
1. **Substitution** (Arts. 857–863): designated substitute receives the share
2. **Representation** (Arts. 970–977): descendants represent predeceased/disinherited
3. **Accretion** (Arts. 1015–1023): co-heirs absorb vacant share
   - Art. 1021: Among compulsory heirs, legitime accretion is "in their own right" not accretion proper
   - Accretion proper only applies to the free portion
4. **Intestate fallback** (Art. 960): legal heirs receive undisposed portion

### Art. 1021 Critical Rule
If a compulsory heir CANNOT receive their legitime (not just the free portion), the other compulsory heirs receive it as an INCREASE to their own legitime (in their own right). This is functionally equivalent to accretion but is legally distinct.

---

## 9. Mixed Succession (Arts. 778, 780, 960(2))

When a will only disposes of part of the estate:
1. Validate will dispositions against all compulsory heirs' legitimes
2. Distribute testamentary portion per will
3. Distribute undisposed portion per intestate rules
4. Ensure no heir receives less than their legitime

---

## 10. Article Citations Quick Reference

| Rule | Article |
|------|---------|
| Compulsory heirs | Art. 887 CC; Art. 176 FC; RA 8552 Sec. 17 |
| Legitime — children | Art. 888 |
| Legitime — ascendants | Art. 889 |
| Ascendant division | Art. 890 |
| Spouse with 1 child | Art. 892 ¶1 |
| Spouse with 2+ children | Art. 892 ¶2 |
| Spouse with ascendants | Art. 893 |
| Spouse + illegit. only | Art. 894 |
| Illegit. child legitime | Art. 895 + FC Art. 176 |
| Cap rule | Art. 895 ¶3 |
| Illegit. with ascendants | Art. 896 |
| Spouse with legit.+illegit. | Art. 897 |
| All three groups | Art. 899 |
| Spouse alone | Art. 900 |
| Illegit. alone | Art. 901 |
| Illegit. decedent's parents | Art. 903 |
| Estate base (collation add-back) | Art. 908 |
| Imputation — children | Art. 909 |
| Imputation — illegit. children | Art. 910 |
| Inofficiousness reduction | Art. 911 |
| Preterition | Art. 854 |
| Invalid disinheritance | Art. 918 |
| Grounds — children | Art. 919 |
| Grounds — parents | Art. 920 |
| Grounds — spouse | Art. 921 |
| Reconciliation | Art. 922 |
| Representation — disinheritance | Art. 923 |
| Representation definition | Art. 970 |
| Per stirpes | Art. 974 |
| Collateral representation | Art. 975 |
| Renunciation ≠ representation | Art. 977 |
| When intestate applies | Art. 960 |
| Iron Curtain Rule | Art. 992 |
| Spouse with siblings | Art. 1001 |
| Guilty spouse | Art. 1002 |
| Collateral limit | Art. 1010 |
| Accretion | Arts. 1015–1023 |
| Accretion — legitime vs FP | Art. 1021 |
| Unworthiness | Art. 1032 |
| Unworthiness condoned | Art. 1033 |
| Children of unworthy heir | Art. 1035 |
| Collation obligation | Art. 1061 |
| Collation — grandchildren | Art. 1064 |
| Collation — exemptions | Arts. 1062, 1063, 1065, 1066, 1067, 1068 |
| Collation — valuation | Art. 1071 |
