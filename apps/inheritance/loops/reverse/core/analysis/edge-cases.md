# Edge Cases — Comprehensive Catalog

This document catalogs every edge case discovered across all 23 Wave 1-4 analysis files, organized by category. Each entry specifies the scenario, legal basis, engine behavior, and source analysis.

---

## Table of Contents

1. [Renunciation / Repudiation](#1-renunciation--repudiation)
2. [Simultaneous Death (Commorientes)](#2-simultaneous-death-commorientes)
3. [Unworthiness to Succeed](#3-unworthiness-to-succeed)
4. [Reserva Troncal](#4-reserva-troncal)
5. [Collation Edge Cases](#5-collation-edge-cases)
6. [Articulo Mortis](#6-articulo-mortis)
7. [Legal Separation](#7-legal-separation)
8. [Marriage Validity](#8-marriage-validity)
9. [Adoption Edge Cases](#9-adoption-edge-cases)
10. [Posthumous / Unborn Children](#10-posthumous--unborn-children)
11. [Filiation Issues](#11-filiation-issues)
12. [Iron Curtain Rule](#12-iron-curtain-rule)
13. [Illegitimate Decedent Special Cases](#13-illegitimate-decedent-special-cases)
14. [Representation Edge Cases](#14-representation-edge-cases)
15. [Preterition Edge Cases](#15-preterition-edge-cases)
16. [Disinheritance Edge Cases](#16-disinheritance-edge-cases)
17. [Accretion / Vacancy Resolution](#17-accretion--vacancy-resolution)
18. [Free Portion Boundary Cases](#18-free-portion-boundary-cases)
19. [Testate / Will Interpretation](#19-testate--will-interpretation)
20. [Rounding and Precision](#20-rounding-and-precision)
21. [Manual Review Flags (Summary)](#21-manual-review-flags-summary)

---

## 1. Renunciation / Repudiation

### EC-R1: Single Heir Renounces — Accretion to Co-Heirs

- **Legal basis**: Art. 1018 (intestate), Art. 1019 (testate proportional accretion)
- **Scenario**: One of several heirs in the same class renounces their share
- **Engine behavior**: Redistribute the renouncing heir's share proportionally among remaining co-heirs. Art. 977 bars representation for renouncing heirs (unlike predecease/disinheritance).
- **Source**: heir-concurrence-rules, accretion-rules

### EC-R2: All Nearest Relatives of Same Degree Renounce

- **Legal basis**: Art. 969
- **Scenario**: ALL heirs of the nearest degree renounce (e.g., all 3 children renounce)
- **Engine behavior**: Next degree inherits **in their own right** (NOT by representation). Engine must re-run scenario determination with the renouncing heirs entirely removed. E.g., all children renounce → parents become heirs under I5/I6.
- **Source**: heir-concurrence-rules, accretion-rules (EC-1, EC-2), intestate-order

### EC-R3: Renunciation of Free Portion Only (Retaining Legitime)

- **Legal basis**: Art. 1021 ¶1, Art. 886
- **Scenario**: A compulsory heir renounces their testamentary/voluntary FP share but retains their compulsory legitime
- **Engine behavior**: Vacant FP share accretes to FP co-heirs per Art. 1021 ¶1. Heir's legitime remains intact and unaffected.
- **Source**: accretion-rules (EC-3)

### EC-R4: Total Renunciation (Legitime + Everything)

- **Legal basis**: Art. 1041 (right to repudiate entire inheritance)
- **Scenario**: A compulsory heir renounces the entire inheritance including legitime
- **Engine behavior**: If this heir's share is a legitime → Art. 1021 ¶2: co-heirs succeed "in their own right" → scenario re-evaluation (not proportional add-on). If no other compulsory heirs of the same class remain, scenario changes entirely (e.g., T1 → T6).
- **Source**: accretion-rules (EC-1, EC-12), testate-institution (E6)

### EC-R5: Renunciation Recalculates Cap Rule

- **Legal basis**: Art. 895 ¶3, Art. 977
- **Scenario**: One of m illegitimate children renounces → m decreases by 1
- **Engine behavior**: Recompute with m-1. If the cap previously bit, remaining ICs may each get a larger (but still capped) share. E.g., m=5 capped at ₱500K each → IC5 renounces → m=4, each now ₱625K.
- **Source**: legitime-with-illegitimate (EC-4, EC-5)

### EC-R6: Renunciation for Price = Deemed Acceptance

- **Legal basis**: Art. 1050(1)
- **Scenario**: Heir "renounces" their share in exchange for payment from a co-heir
- **Engine behavior**: Treated as acceptance then sale. No accretion triggered. The heir received their share and disposed of it. No vacancy.
- **Source**: accretion-rules (EC-8)

### EC-R7: Gratuitous Renunciation to Non-Natural Beneficiaries

- **Legal basis**: Art. 1050
- **Scenario**: Heir renounces "in favor of" a specific person who would not naturally benefit from accretion
- **Engine behavior**: Deemed acceptance (not a true renunciation). No accretion.
- **Source**: accretion-rules (EC-8)

### EC-R8: Spouse Renounces in Testate Succession

- **Legal basis**: Art. 1021
- **Scenario**: Surviving spouse renounces their share under a will
- **Engine behavior**: If the renounced share = legitime → Art. 1021 ¶2: scenario re-evaluation (spouse removed from compulsory heirs, e.g., T5b → T4). If renounced share = FP allocation only → Art. 1021 ¶1: accretion among FP co-heirs.
- **Source**: accretion-rules (EC-12)

---

## 2. Simultaneous Death (Commorientes)

### EC-C1: Decedent and Heir Die Simultaneously

- **Legal basis**: Art. 43, Civil Code
- **Scenario**: The decedent and an heir die at the same time (or it cannot be determined who died first)
- **Engine behavior**: The heir is treated as having predeceased the decedent. Representation applies if the heir has eligible descendants. If no descendants → the heir's share is vacant (substitution → accretion → intestate fallback).
- **Rule**: "In the absence of proof, it is presumed that they died at the same time and there shall be no transmission of rights from one to the other."
- **Source**: intestate-order (EC-3)

### EC-C2: Commorientes Between Two Mutual Heirs

- **Legal basis**: Art. 43
- **Scenario**: Two persons who are mutual heirs of each other die simultaneously (e.g., parent and child in same accident)
- **Engine behavior**: Each estate is computed independently. Neither transmits rights to the other. For parent's estate: child treated as predeceased → child's descendants represent. For child's estate: parent treated as predeceased → parent's other descendants or ascendants inherit.
- **Source**: intestate-order (EC-3)

---

## 3. Unworthiness to Succeed

### EC-U1: Unworthy Heir Excluded — Descendants Represent

- **Legal basis**: Art. 1032 (5 grounds of unworthiness), Art. 1035 (descendants acquire the right)
- **Scenario**: An heir committed acts listed in Art. 1032 (attempted testator's life, fraud, etc.)
- **Engine behavior**: Exclude the unworthy heir from succession. Treat analogously to predecease for representation: their children/descendants step into their share per Art. 1035. If no descendants → vacancy resolved per accretion rules.
- **Grounds (Art. 1032)**: (1) Parents who abandoned or induced daughters to prostitution; (2) Person convicted of attempt against life of testator/spouse/descendants/ascendants; (3) Person who accused testator of crime punishable by ≥6 years imprisonment (unless proven true); (4) Adult heir who fails to report violent death; (5) Person who uses fraud/violence/intimidation regarding the will.
- **Source**: compulsory-heirs-categories (EC-6), intestate-order (EC-4), disinheritance-rules

### EC-U2: Condoned Unworthiness

- **Legal basis**: Art. 1033
- **Scenario**: Testator knew of the unworthiness cause and still included the heir in the will, or condoned in writing
- **Engine behavior**: If `unworthiness_condoned == true` → heir is NOT excluded. Condonation must be in writing (unlike disinheritance reconciliation which can be informal under Art. 922).
- **Source**: compulsory-heirs-categories (EC-6), disinheritance-rules

### EC-U3: Unworthiness vs Disinheritance Gap

- **Legal basis**: Art. 922 (reconciliation, informal) vs Art. 1033 (condonation, written)
- **Scenario**: Testator informally reconciles with heir (voiding disinheritance per Art. 922) but does not provide written condonation (so unworthiness persists under Art. 1033)
- **Engine behavior**: Disinheritance is voided; heir regains legitime. But if the same act constitutes an Art. 1032 unworthiness ground and was not condoned in writing, the heir remains unworthy. Engine must check both paths: `disinheritance_reconciled == true` → restore heir, then `is_unworthy == true AND unworthiness_condoned == false` → exclude again.
- **5 overlapping grounds**: Arts. 919-921 and Art. 1032 share 5 grounds. Disinheritance checked first, unworthiness as backup.
- **Source**: disinheritance-rules (Section on unworthiness overlap)

### EC-U4: Representative Must Be Worthy

- **Legal basis**: Art. 973
- **Scenario**: Grandchild GC1 would represent predeceased parent C1, but GC1 is unworthy to succeed the decedent
- **Engine behavior**: Art. 973 requires the representative to be "capable of succeeding the decedent." GC1 fails this check → excluded from representative list. If GC1 has children, they may represent GC1 recursively.
- **Source**: representation-rights (EC-3)

---

## 4. Reserva Troncal

### EC-RT1: Ascendant Inherits Property Subject to Reserva Troncal

- **Legal basis**: Art. 891
- **Scenario**: A legitimate ascendant inherits property from a descendant who acquired it by gratuitous title from another ascendant or sibling. The ascendant-heir must reserve that property for relatives within the third degree belonging to the line from which the property came.
- **Engine behavior**: The engine computes the ascendant's share normally. A post-distribution **RESERVA_TRONCAL** flag is attached to the relevant property. The reserva is an encumbrance — it does NOT change the fraction computation but requires asset-level metadata tracking (acquisition type + source person). The ascendant receives the property with the obligation to preserve it for reservatarios.
- **Input requirement**: Asset-level data with `acquisition_type` (gratuitous vs onerous) and `source_person` fields. Without this metadata, the engine cannot detect reserva troncal — it must flag a warning.
- **Limitation**: The engine flags but does not compute the downstream reserva distribution (that would be a separate legal event when the reserva obligor dies).
- **Source**: legitime-ascendants (EC-7), computation-pipeline (manual flag)

### EC-RT2: Reserva Troncal Overlap with Ascendant Legitime

- **Legal basis**: Art. 891
- **Scenario**: An ascendant receives BOTH their legitime share AND property subject to reserva troncal
- **Engine behavior**: Track separately. The ascendant receives the property as part of their share but the reserva obligation is a restriction on future disposition. Does not reduce their computed inheritance amount.
- **Source**: legitime-ascendants (EC-7)

---

## 5. Collation Edge Cases

### EC-COL1: Destroyed Donated Property Still Collated

- **Legal basis**: Art. 1071
- **Scenario**: Donated property was destroyed (accidentally or culpably) after donation
- **Engine behavior**: Collate at the value at time of donation. Appreciation, depreciation, and total loss are at the donee's risk. The donee's share is reduced by the donation-time value regardless of current existence.
- **Source**: collation (EC-6)

### EC-COL2: Donor-Exempt Donation Still Checked for Inofficiousness

- **Legal basis**: Art. 1062 (exemption), Arts. 908-911 (inofficiousness)
- **Scenario**: Decedent expressly exempted a donation from collation, but the donation impairs other heirs' legitimes
- **Engine behavior**: The donation is NOT added to the estate base for legitime computation. BUT the donation IS still checked for inofficiousness — exemption creates intended inequality but cannot impair co-heirs' legitimes. If inofficious, the excess must be reduced.
- **Source**: collation (EC-8)

### EC-COL3: Repudiating Donee — No Collation But Inofficiousness Check

- **Legal basis**: Art. 1062 ¶2
- **Scenario**: A donee heir repudiates the inheritance → no collation obligation. But the donation may still be inofficious.
- **Engine behavior**: Do not collate. But if the donation impairs other heirs' legitimes (measured on the non-collated estate), it is inofficious and must be reduced. The repudiating donee keeps only the non-inofficious portion.
- **Source**: collation (EC-3)

### EC-COL4: Grandchildren by Representation Must Collate Parent's Donations

- **Legal basis**: Art. 1064
- **Scenario**: Grandchildren represent a predeceased parent. The parent received inter vivos donations from the decedent.
- **Engine behavior**: The grandchildren must collate the parent's donations even though they personally never received the property. This can produce a ₱0 estate distribution for the representatives if the parent's donation was large enough.
- **Source**: collation (Art. 1064)

### EC-COL5: Professional Education Expenses — Conditional Collatability

- **Legal basis**: Art. 1068
- **Scenario**: Decedent paid for a child's professional education (law school, medical school)
- **Engine behavior**: NOT collatable by default (Art. 1068). BUT becomes collatable if: (a) the parent expressly required it, OR (b) the expense impairs co-heirs' legitimes. When collatable, deduct imputed home-savings that would have been spent if the child stayed home.
- **Source**: collation (collatability matrix)

### EC-COL6: Wedding Gifts — 1/10 FP Threshold

- **Legal basis**: Art. 1070
- **Scenario**: Decedent gave wedding gifts to a child
- **Engine behavior**: Wedding gifts within 1/10 of FP_disposable are exempt. Excess over 1/10 is collatable. Wedding gifts are generally exempt under Art. 1067 as "customary gifts," so they don't affect the estate base — the 1/10 threshold is computed on the FP_disposable derived from the non-wedding-gift estate base. This avoids circular dependency.
- **Source**: collation (EC-11)

### EC-COL7: Joint-Parent Donations

- **Legal basis**: Art. 1072
- **Scenario**: Both parents jointly donated to a child
- **Engine behavior**: Only ½ of the donation is collated in this decedent's estate. The other ½ belongs to the other parent's estate.
- **Source**: collation (Art. 1072)

### EC-COL8: All Children Received Equal Donations

- **Legal basis**: Arts. 1061-1074
- **Scenario**: Every compulsory heir received identical donations
- **Engine behavior**: Collation still applies (it affects the estate base) but produces no net change in distribution. The computation is still necessary because the collation-adjusted estate may reveal inofficious testamentary dispositions.
- **Source**: collation (EC-1)

### EC-COL9: Donation to IC + Cap Rule Interaction

- **Legal basis**: Art. 910, Art. 895 ¶3
- **Scenario**: An illegitimate child received a donation. The donation is charged to IC's legitime. But IC's legitime may be capped.
- **Engine behavior**: If donation exceeds the capped legitime, excess charged to FP. If FP already zero due to cap, the donation is inofficious.
- **Source**: collation (EC-12)

### EC-COL10: Donation to Non-Heir Compulsory Heir

- **Legal basis**: Art. 909 ¶2
- **Scenario**: Decedent donated to a parent during lifetime, but the parent is NOT a compulsory heir (because descendants survive)
- **Engine behavior**: The parent is treated as a "stranger" for charging purposes — donation charged to FP, not to the parent's (non-existent) legitime.
- **Source**: collation (EC-2)

### EC-COL11: Collation Dispute — Dual Computation

- **Legal basis**: Art. 1077
- **Scenario**: Heirs disagree about whether an item is collatable or about its donation-time value
- **Engine behavior**: Art. 1077: disputes don't block partition if adequate security is given. Engine produces DUAL computations: one assuming the item is collatable, one assuming it is not. Flag as **COLLATION_DISPUTE** for manual resolution.
- **Source**: collation (Art. 1077), computation-pipeline

### EC-COL12: Multiple Donations Over Time to Same Heir

- **Legal basis**: Arts. 1061, 1071
- **Scenario**: An heir received 5 donations totaling ₱3M over several years
- **Engine behavior**: Sum all donations (each at its donation-time value per Art. 1071) and impute as one block against the heir's share. Impute to legitime first (Art. 909), then excess to FP.
- **Source**: collation (EC-4)

---

## 6. Articulo Mortis

### EC-AM1: Marriage in Articulo Mortis — Spouse Legitime Reduced

- **Legal basis**: Art. 900 ¶2
- **Scenario**: Decedent married the spouse during the illness that caused death (marriage "in articulo mortis"), and the spouse is the SOLE compulsory heir (Scenario T12 only)
- **Engine behavior**: Spouse's legitime reduced from ½ to ⅓. ALL three conditions must hold simultaneously: (1) marriage during illness of death, (2) decedent did not recover, (3) no other compulsory heirs. If any other compulsory heir exists (children, ascendants, ICs), the reduction does NOT apply.
- **Source**: legitime-surviving-spouse, legitime-table (EC-5), computation-pipeline

### EC-AM2: Articulo Mortis With Recovery

- **Legal basis**: Art. 900 ¶2
- **Scenario**: Decedent married during illness but recovered, then died later from a different cause
- **Engine behavior**: Art. 900 ¶2 does NOT apply — the decedent "recovered from the illness." Normal spouse legitime (½) applies.
- **Source**: legitime-surviving-spouse

---

## 7. Legal Separation

### EC-LS1: Guilty Spouse Forfeits All Inheritance Rights

- **Legal basis**: Art. 1002 (intestate), Art. 892 ¶2 (testate)
- **Scenario**: A court has decreed legal separation and the surviving spouse was the guilty party
- **Engine behavior**: The guilty spouse receives NOTHING and is completely removed from the heir pool before scenario determination. This changes the scenario (e.g., I4 → I3, T5b → T4). Both testate and intestate rights are forfeited.
- **Source**: compulsory-heirs-categories (EC-4), intestate-order (EC-1), heir-concurrence-rules (EC-5), legitime-surviving-spouse

### EC-LS2: Innocent Spouse Inherits Normally

- **Legal basis**: Art. 892 ¶2
- **Scenario**: Legal separation decreed but the surviving spouse was the innocent party (the deceased gave cause)
- **Engine behavior**: The spouse inherits normally. Legal separation of the innocent spouse does NOT affect their succession rights.
- **Source**: compulsory-heirs-categories (EC-4)

### EC-LS3: De Facto Separation ≠ Legal Separation

- **Legal basis**: Art. 1002
- **Scenario**: The couple lived apart for years but never obtained a court decree of legal separation
- **Engine behavior**: De facto (physical) separation does NOT disqualify the spouse. Only a formal court decree triggers Art. 1002. The engine must check for a formal decree, not merely whether the couple cohabitated.
- **Source**: legitime-surviving-spouse (EC-1)

### EC-LS4: Disinheritance + Legal Separation Overlap

- **Legal basis**: Art. 921(4) (disinheritance for giving cause for legal separation), Art. 1002
- **Scenario**: The guilty spouse in a legal separation is the surviving spouse
- **Engine behavior**: In **testate**: disinheritance under Art. 921(4) is needed to remove the spouse's legitime. Art. 1002 alone only affects intestate rights. In **intestate**: Art. 1002 automatically removes the guilty spouse; disinheritance is impossible (no will).
- **Source**: disinheritance-rules (EC-8)

---

## 8. Marriage Validity

### EC-MV1: Annulled or Void Marriage

- **Legal basis**: Family Code Arts. 35-54 (grounds for nullity/annulment)
- **Scenario**: The marriage was annulled or declared void ab initio (bigamy, lack of consent, etc.)
- **Engine behavior**: There is NO surviving spouse. The person is not a spouse and has zero succession rights. This is a different disqualification from Art. 1002 — the marriage itself never existed (or was dissolved).
- **Source**: legitime-surviving-spouse (EC-2)

### EC-MV2: Bigamous Second Marriage

- **Legal basis**: Family Code Art. 35(4)
- **Scenario**: Decedent legally married S1, then "married" S2 without annulling the first marriage
- **Engine behavior**: S2's marriage is bigamous and void. S1 remains the legal surviving spouse (though potentially disqualified under Art. 1002 if legally separated). S2 has NO succession rights.
- **Source**: legitime-surviving-spouse (EC-3, EC-9)

### EC-MV3: Sequential Valid Marriages

- **Legal basis**: Standard succession rules
- **Scenario**: Decedent was married to S1, S1 died, Decedent married S2
- **Engine behavior**: S2 is the surviving spouse. Only the spouse from the last valid, subsisting marriage at time of death has succession rights.
- **Source**: legitime-surviving-spouse (EC-9)

---

## 9. Adoption Edge Cases

### EC-A1: Rescission of Adoption Before Death

- **Legal basis**: RA 8552 Sec. 20, RA 11642 Sec. 47
- **Scenario**: Adoption was judicially rescinded before the decedent's death
- **Engine behavior**: The child is no longer a compulsory heir of the adopter. Under RA 8552: child reverts to legitimated child of biological parents. Under RA 11642: child restored to biological parents. Any inheritance received before rescission is NOT returned (vested rights preserved). Any disinheritance clause becomes moot.
- **Source**: compulsory-heirs-categories (EC-1), adopted-children-rights (EC-1), disinheritance-rules (EC-5)

### EC-A2: Rescission After Death (Moot)

- **Legal basis**: RA 8552 Sec. 20
- **Scenario**: Adoption rescinded after the decedent's death
- **Engine behavior**: Succession already opened at death. Rescission cannot retroact to affect succession rights. The adopted child remains a legitimate heir for that estate.
- **Source**: adopted-children-rights (EC-1)

### EC-A3: Stepparent Adoption — Dual Inheritance

- **Legal basis**: RA 8552 Sec. 16, RA 11642 Sec. 42
- **Scenario**: Mother M marries Stepfather SF. SF adopts Child C.
- **Engine behavior**: C inherits from SF as adopted (legitimate) child. C inherits from M as biological legitimate child (ties with M NOT severed). C does NOT inherit from biological father F (ties severed upon adoption).
- **Source**: compulsory-heirs-categories (EC-8), adopted-children-rights (EC-2)

### EC-A4: Death of Adopted Child — Who Inherits?

- **Legal basis**: RA 8552 Sec. 18, RA 11642 Sec. 41/43, Civil Code Art. 984 (superseded)
- **Scenario**: An adopted child dies without descendants
- **Engine behavior**:
  - Under RA 8552: Adopter inherits as legitimate parent. If adopter also dead, ambiguity — biological relatives arguably cannot inherit (ties severed), may escheat or go to adopter's other heirs. Flag **RA_11642_RETROACTIVITY**.
  - Under RA 11642: Adopter's parents can inherit as legitimate grandparents (Sec. 41 extends filiation). No ambiguity.
- **Source**: adopted-children-rights (EC-3)

### EC-A5: RA 11642 Retroactivity for Pre-2022 Adoptions

- **Legal basis**: RA 11642 Sec. 41, RA 8552
- **Scenario**: Child adopted under RA 8552 (pre-2022). Under RA 8552, filiation was exclusive to adopter. RA 11642 Sec. 41 extends filiation to adopter's parents, siblings, and descendants.
- **Engine behavior**: Configurable flag `retroactive_ra_11642: bool`. If true, pre-2022 adoptees can inherit from adopter's relatives. If false, old exclusivity rule applies. Default: false (conservative). Flag **RA_11642_RETROACTIVITY** warning.
- **Source**: adopted-children-rights (EC-5 and throughout), computation-pipeline

### EC-A6: Biological Parent's Will to Adoptee

- **Legal basis**: RA 11642 Sec. 43
- **Scenario**: Biological parent's intestate ties are severed by adoption, but biological parent leaves a testamentary disposition to the adopted child
- **Engine behavior**: Valid. Testamentary disposition to adoptee honored even though intestate ties are severed. The adoptee is treated as a voluntary heir (not compulsory) from the biological parent.
- **Source**: adopted-children-rights

---

## 10. Posthumous / Unborn Children

### EC-P1: Child Conceived Before Death, Born Alive

- **Legal basis**: Art. 1025, Art. 41
- **Scenario**: A child was already conceived at the time of the decedent's death and is subsequently born alive
- **Engine behavior**: The child is capable of succeeding. Classify as legitimate child (if parents married) or illegitimate child (if not). The child is counted in the heir pool and receives their share.
- **Source**: compulsory-heirs-categories (EC-3), preterition (Art. 854 mentions posthumous children)

### EC-P2: Posthumous Recognition in Will

- **Legal basis**: FC Art. 172(2)
- **Scenario**: The decedent's will contains recognition of an illegitimate child
- **Engine behavior**: Recognition in a will constitutes admission in a public document per Art. 172(2). Set `filiation_proved = true` and classify as ILLEGITIMATE_CHILD. The child is a compulsory heir.
- **Source**: illegitimate-children-rights (EC-4)

---

## 11. Filiation Issues

### EC-F1: Unproved Filiation — Hard Gate

- **Legal basis**: Art. 887 ¶3 ("their filiation must be duly proved")
- **Scenario**: An alleged illegitimate child cannot prove filiation to the decedent
- **Engine behavior**: The child is NOT a compulsory heir and is excluded entirely from succession. This is a prerequisite gate: `filiation_proved == false` → no inheritance rights.
- **6 proof methods (FC Art. 172/175)**: Record of birth, final judgment, admission in public document, private handwritten instrument, open and continuous possession, any other means allowed by Rules of Court.
- **Source**: compulsory-heirs-categories (EC-5), illegitimate-children-rights

### EC-F2: Father Contested Filiation During Lifetime

- **Legal basis**: FC Art. 176
- **Scenario**: The decedent father successfully contested filiation before death
- **Engine behavior**: Set `filiation_proved = false`. The child is excluded from succession.
- **Source**: illegitimate-children-rights (EC-3)

### EC-F3: Legitimated Child — Retroactive Effects

- **Legal basis**: FC Art. 180
- **Scenario**: Parents marry after the child's birth → child is legitimated
- **Engine behavior**: Effects retroact to time of birth. The legitimated child is classified as LEGITIMATE_CHILD_GROUP from birth, regardless of when the marriage occurred (so long as it occurred before the decedent's death).
- **Limitation**: FC Art. 177 — only children whose parents had no impediment to marry at time of conception can be legitimated.
- **Source**: compulsory-heirs-categories (EC-2)

---

## 12. Iron Curtain Rule

### EC-IC1: Illegitimate Decedent — Legitimate Relatives Excluded

- **Legal basis**: Art. 992
- **Scenario**: The decedent is an illegitimate child. The decedent's parent's legitimate relatives attempt to inherit.
- **Engine behavior**: Art. 992 creates a bilateral barrier: the illegitimate child cannot inherit from the parent's legitimate relatives, AND the parent's legitimate relatives cannot inherit from the illegitimate child. Filter out blocked heirs before scenario determination. Exception: the decedent's own parents CAN inherit (Art. 903).
- **Source**: illegitimate-children-rights (Iron Curtain section), intestate-order (EC-5)

### EC-IC2: Iron Curtain in Collateral Intestate Line

- **Legal basis**: Art. 992
- **Scenario**: An illegitimate decedent has half-siblings from the parent's legitimate marriage. These half-siblings attempt to inherit.
- **Engine behavior**: They are blocked by Art. 992 — they are legitimate relatives of the parent. The engine's Iron Curtain filter must exclude them from the collateral succession pool.
- **Source**: intestate-order (EC-5), illegitimate-children-rights

### EC-IC3: Iron Curtain Does NOT Apply to Own Parent

- **Legal basis**: Art. 992, Art. 903
- **Scenario**: The illegitimate decedent's own parents (the people who are actually the biological parents) attempt to inherit
- **Engine behavior**: Art. 992 does NOT block the parents themselves — only their legitimate relatives. Parents inherit per Art. 903.
- **Source**: illegitimate-children-rights (EC-7)

---

## 13. Illegitimate Decedent Special Cases

### EC-ID1: Art. 903 — Parents But NOT Ascendants

- **Legal basis**: Art. 903 (says "parents" not "ascendants")
- **Scenario**: Illegitimate decedent leaves no descendants, no spouse, no children. Only grandparents survive (parents are dead).
- **Engine behavior**: Art. 903 only says "parents" — whether grandparents of an illegitimate decedent can inherit is a legal gray area. Engine computes as if only parents qualify, and flags **GRANDPARENT_OF_ILLEGITIMATE** for manual review.
- **Source**: compulsory-heirs-categories (EC-7), legitime-ascendants (EC-8, EC-9), computation-pipeline

### EC-ID2: Art. 903 — Parents Get Zero When Children Exist

- **Legal basis**: Art. 903 ¶2
- **Scenario**: Illegitimate decedent has their own children (legitimate or illegitimate) → parents get NOTHING
- **Engine behavior**: The normal Regime A (T1-T5) or Regime C (T10-T11) rules apply based on the decedent's own children. Parents are excluded by the activation gate.
- **Source**: legitime-table (EC-6), legitime-ascendants (EC-9)

### EC-ID3: Art. 903 — Father Only Known

- **Legal basis**: Art. 903
- **Scenario**: Illegitimate decedent's filiation proved only as to the father (mother unknown/deceased)
- **Engine behavior**: Father alone inherits the ½ under Art. 903.
- **Source**: legitime-ascendants (EC-8)

---

## 14. Representation Edge Cases

### EC-REP1: Multi-Level Representation (Great-Grandchildren)

- **Legal basis**: Art. 970, Art. 982
- **Scenario**: D → C1 (predeceased) → GC1 (also predeceased) → GGC1 (alive)
- **Engine behavior**: No depth limit in the direct descending line. GGC1 represents GC1 who represents C1. GGC1 receives C1's entire line share.
- **Source**: representation-rights (EC-1)

### EC-REP2: Mixed Live and Dead Representatives

- **Legal basis**: Arts. 970-974
- **Scenario**: D → C1 (predeceased) → GC1 (alive) + GC2 (predeceased) → GGC1, GGC2 (alive)
- **Engine behavior**: C1's line share is divided per stirpes. GC1 gets ½ of C1's share. GGC1 and GGC2 each get ¼ of C1's share (splitting GC2's sub-line).
- **Source**: representation-rights (EC-2)

### EC-REP3: Illegitimate Child Represented by Illegitimate Descendant

- **Legal basis**: Art. 902
- **Scenario**: Predeceased illegitimate child IC1 has an illegitimate child IGC1
- **Engine behavior**: Art. 902 allows both legitimate AND illegitimate descendants to represent. IGC1 represents IC1 and inherits IC1's share (½ of a legitimate child's share). The representative inherits the illegitimate share, not a legitimate share.
- **Source**: representation-rights (EC-5), illegitimate-children-rights

### EC-REP4: Collateral Representation Limited to One Level

- **Legal basis**: Art. 972
- **Scenario**: D's only sibling S1 predeceased. S1's child (nephew N1) also predeceased. N1's child (grand-nephew GN1) survives.
- **Engine behavior**: Art. 972 limits collateral representation to "children of brothers or sisters." GN1 (grand-nephew) CANNOT represent N1. Only nephews/nieces can represent. If no eligible representatives exist, the line is vacant.
- **Source**: representation-rights (EC-7)

### EC-REP5: Per Capita Switch for Nephews/Nieces Alone

- **Legal basis**: Art. 975
- **Scenario**: All siblings predeceased. Only nephews/nieces survive.
- **Engine behavior**: Art. 975: "if they alone survive, they shall inherit in equal portions." Switch from per stirpes to per capita. N1 and N2 each get ½ regardless of which parent they descend from.
- **Source**: representation-rights (EC-8)

### EC-REP6: Representation After Preterition of Predeceased Heir

- **Legal basis**: Art. 854 ¶2
- **Scenario**: Will omits C1 (preterited), but C1 predeceased D. C1 has grandchildren GC1, GC2.
- **Engine behavior**: Art. 854 ¶2: the will is NOT annulled (preterited heir predeceased). BUT GC1 and GC2 still inherit by representation — they get C1's LEGITIME. The institution of other heirs in the will remains valid.
- **Source**: representation-rights (EC-4), preterition (EC-9, EC-10)

### EC-REP7: Lines vs Heads Counting

- **Legal basis**: Art. 974
- **Scenario**: Decedent has 1 living child + 1 predeceased child with grandchildren = 2 lines
- **Engine behavior**: Count LINES not heads for scenario determination. This is T3 behavior (n≥2), not T2 (n=1), even though only 1 biological child survives directly. The Art. 892 discontinuity at n=1 depends on line count.
- **Source**: legitime-table (EC-1)

---

## 15. Preterition Edge Cases

### EC-PR1: Token Legacy Defeats Preterition

- **Legal basis**: Art. 854
- **Scenario**: Will says "I leave ₱1 to LC3. I institute F as my sole heir."
- **Engine behavior**: LC3 received something → NOT preterited. Art. 855 underprovision applies instead. F's institution stands but is reduced to accommodate LC3's legitime deficit. A ₱1 legacy changes the outcome from total annulment to partial reduction.
- **Source**: preterition (EC-3)

### EC-PR2: All Compulsory Heirs Preterited

- **Legal basis**: Art. 854
- **Scenario**: Will only contains institutions for strangers; ALL compulsory heirs omitted
- **Engine behavior**: ALL institutions annulled. Entire estate goes intestate. If any stranger was also given a legacy (separate from institution), the legacy survives per Art. 854 if not inofficious.
- **Source**: preterition (EC-1)

### EC-PR3: Preterition of IC Only

- **Legal basis**: Art. 854
- **Scenario**: Will names all legitimate children and spouse but omits IC1
- **Engine behavior**: IC1 is in the direct descending line → preterition triggered. ALL institutions annulled. Entire estate distributes intestate. Under intestate rules (no cap), IC1 may get MORE than they would have under testate legitime.
- **Source**: preterition (EC-6)

### EC-PR4: Spouse Omission is NEVER Preterition

- **Legal basis**: Art. 854, Art. 964-965 (direct line = consanguinity, not affinity)
- **Scenario**: Will completely omits the surviving spouse
- **Engine behavior**: Spouse is NOT in the direct line (affinity, not consanguinity). Omission of spouse = Art. 855 underprovision (maximum underprovision = full legitime deficit), NOT preterition. The institution stands but must be reduced to accommodate the spouse's legitime.
- **Source**: preterition (scope analysis), legitime-surviving-spouse

### EC-PR5: Will With Only Legacies, No Institution

- **Legal basis**: Art. 854, Art. 841, Art. 960(2)
- **Scenario**: The will contains only legacies and devises, no institution of heirs
- **Engine behavior**: Art. 854 is inapplicable (nothing to annul — "the institution of heir" doesn't exist). This is NOT preterition but mixed succession under Art. 960(2). Legacies honored if not inofficious. Remainder distributes intestate.
- **Source**: preterition (EC-12), testate-institution (E1)

### EC-PR6: Invalid Disinheritance ≠ Preterition

- **Legal basis**: Art. 918 vs Art. 854
- **Scenario**: Will says "I disinherit LC2" but the cause is invalid
- **Engine behavior**: This is NOT preterition — the testator did not "omit" LC2 but explicitly addressed them (even if ineffectively). Art. 918 applies: partial annulment to restore LC2's legitime. Art. 854 total annulment does NOT apply.
- **Source**: preterition (scope), testate-validation (E7), disinheritance-rules

### EC-PR7: Preterition Through Representation

- **Legal basis**: Art. 854 ¶2
- **Scenario**: LC3 predeceased. LC3's children GC1, GC2 survive but are ALL also omitted from the will.
- **Engine behavior**: The "line" is omitted → preterition through representation. Institution annulled. If GC1 or GC2 were named in the will, the line is not omitted and no preterition.
- **Source**: preterition (EC-7, EC-10)

---

## 16. Disinheritance Edge Cases

### EC-D1: Disinherited + Renounces (Moot Renunciation)

- **Legal basis**: Arts. 915-923, Art. 977
- **Scenario**: A compulsory heir is validly disinherited AND separately renounces
- **Engine behavior**: Disinheritance governs (renunciation is moot — nothing to renounce). Art. 977 does NOT apply; Art. 923 representation DOES apply (disinheritance triggers representation, renunciation does not).
- **Source**: disinheritance-rules (EC-1)

### EC-D2: No Partial Disinheritance

- **Legal basis**: Art. 915
- **Scenario**: Testator wants to reduce (not eliminate) a compulsory heir's share
- **Engine behavior**: Art. 915 is all-or-nothing. The testator cannot disinherit from part of the legitime. To reduce a compulsory heir's share: give them exactly their legitime and direct the FP elsewhere.
- **Source**: disinheritance-rules (EC-4)

### EC-D3: Multiple Disinheritances with Mixed Validity

- **Legal basis**: Arts. 918, 923
- **Scenario**: Will disinherits 3 heirs: LC1 (valid), LC2 (invalid), LC3 (valid)
- **Engine behavior**: Process each independently. LC1 and LC3 excluded (Art. 923 representation checked). LC2 reinstated (Art. 918: partial annulment to restore LC2's legitime). Scenario recalculated with LC2 reinstated but LC1 and LC3 excluded.
- **Source**: disinheritance-rules (EC-7)

### EC-D4: Art. 922 Reconciliation Voids Disinheritance

- **Legal basis**: Art. 922
- **Scenario**: Testator and heir reconciled after the disinheriting act (whether before or after will execution)
- **Engine behavior**: Disinheritance is VOID. "Subsequent" means after the offense, not after the will. Any reconciliation between offense and death voids the disinheritance automatically. The heir is reinstated.
- **Source**: disinheritance-rules (EC-10)

### EC-D5: No Representation for Disinherited Spouse

- **Legal basis**: Art. 923
- **Scenario**: Spouse is validly disinherited under Art. 921
- **Engine behavior**: Art. 923 provides representation for disinherited children/ascendants but NOT for a disinherited spouse. The spouse's share simply disappears from the computation (scenario re-evaluates without spouse).
- **Source**: disinheritance-rules (Art. 923 analysis)

### EC-D6: Posthumous Disinheritance

- **Legal basis**: Arts. 915-923
- **Scenario**: Will disinherits a child not yet born at will execution
- **Engine behavior**: Accept the clause but flag for review: **POSTHUMOUS_DISINHERITANCE_REVIEW**. Most grounds require acts by the child that cannot occur before birth.
- **Source**: disinheritance-rules (EC-9)

---

## 17. Accretion / Vacancy Resolution

### EC-AC1: Accretion Blocked by Determinate Property

- **Legal basis**: Art. 1016
- **Scenario**: Will: "Lot 1 to A, Lot 2 to B." A renounces.
- **Engine behavior**: NOT pro indiviso — each has specific, identifiable property. No accretion. Lot 1 falls to intestate per Art. 1022(2). Art. 1017 clarifies that "equal shares" and aliquot parts do NOT block accretion — only designation as exclusive owner of determinate property blocks it.
- **Source**: accretion-rules (EC-6)

### EC-AC2: Cascading Accretion

- **Legal basis**: Art. 1019
- **Scenario**: FP willed ⅓ each to A, B, C. A renounces → B and C each get 1/6 more. Then B also renounces.
- **Engine behavior**: B's total share (original ⅓ + accreted 1/6 = ½) accretes to C. C ends up with entire FP. Each step applies Art. 1019 proportionality. Art. 1020: C inherits charges/obligations from A and B's shares.
- **Source**: accretion-rules (EC-7)

### EC-AC3: Cross-Class Intestate Accretion (Controversial)

- **Legal basis**: Art. 1018 vs Art. 968
- **Scenario**: I4: LC + IC + spouse. IC renounces. Does IC's share accrue to LCs only (same class) or all co-heirs (LCs + spouse)?
- **Engine behavior**: Art. 1018 says "co-heirs" without distinction → engine default: accrue to ALL remaining heirs proportionally. But Art. 968 says "others of the same degree." Flag **CROSS_CLASS_ACCRETION** for manual review.
- **Source**: accretion-rules (EC-11), computation-pipeline

### EC-AC4: Substitute Also Fails

- **Legal basis**: Art. 859, Art. 1016, Art. 1022(2)
- **Scenario**: Will: "Estate to A; if A cannot, then B." A predeceases. B is incapacitated.
- **Engine behavior**: Substitution fails. Check representation (A's descendants?). Check accretion (any co-heirs pro indiviso?). If none → Art. 1022(2): intestate.
- **Source**: accretion-rules (EC-10)

### EC-AC5: Art. 1021 — Vacant Legitime vs Vacant FP (Different Rules)

- **Legal basis**: Art. 1021
- **Scenario**: A compulsory heir's share becomes vacant
- **Engine behavior**: CRITICAL distinction: (a) vacant LEGITIME → co-heirs succeed "in their own right" — full scenario re-evaluation (recompute all fractions as if heir never existed, NOT proportional add-on); (b) vacant FREE PORTION → accretion proper with Art. 1019 proportional distribution.
- **Source**: accretion-rules (Art. 1021 analysis)

---

## 18. Free Portion Boundary Cases

### EC-FP1: Zero Free Portion

- **Legal basis**: Art. 895 ¶3, Arts. 908-911
- **Scenario**: Cap rule fully consumes the remaining FP (common in T5a with m≥2, T4 with m>2n)
- **Engine behavior**: Any testamentary disposition is fully inofficious. Art. 911 requires complete reduction of all devises/legacies. The testator effectively has NO testamentary freedom. This is a valid outcome, not an error.
- **Source**: free-portion-rules (EC-1), testate-validation (E5)

### EC-FP2: Negative Free Portion (Collation Produces Inofficious Donations)

- **Legal basis**: Art. 911
- **Scenario**: Inter vivos donations exceeded what the heir was entitled to; the collation-adjusted estate produces total legitimes exceeding the actual estate at death
- **Engine behavior**: The donation excess must be returned. Donations are reduced in reverse chronological order per Art. 911 Phase 3. This does NOT mean the estate is insolvent — it means the donations were partially inofficious.
- **Source**: free-portion-rules (EC-2)

### EC-FP3: Testamentary Charge vs Estate Debt (Art. 908 Distinction)

- **Legal basis**: Art. 908
- **Scenario**: Will says "I leave ₱100,000 for masses for my soul"
- **Engine behavior**: Testamentary charges are NOT deducted from the estate base — they come from the FP. Only actual estate debts (loans, funeral expenses, taxes) reduce the estate base per Art. 908.
- **Source**: free-portion-rules (EC-3)

### EC-FP4: Conditional Disposition Lapses

- **Legal basis**: Art. 871, Art. 960(3)
- **Scenario**: Will has a suspensive condition on a disposition; condition unfulfilled at death
- **Engine behavior**: That disposition lapses. The amount returns to the FP or passes intestate. Track conditions on each testamentary disposition.
- **Source**: free-portion-rules (EC-6)

### EC-FP5: Usufruct/Life Annuity Option (Art. 911 ¶3)

- **Legal basis**: Art. 911 ¶3
- **Scenario**: Testator gives the FP as a usufruct or life annuity
- **Engine behavior**: Compulsory heirs can choose: (a) comply with the testamentary provision, OR (b) deliver the disposable portion in full ownership. This is a human decision outside the engine's deterministic scope. Flag for manual resolution.
- **Source**: free-portion-rules (EC-7), legitime-surviving-spouse (EC-6)

### EC-FP6: Mixed Succession — Undisposed FP

- **Legal basis**: Art. 960(2)
- **Scenario**: Testator's will only disposes of part of the FP
- **Engine behavior**: The remainder of the FP passes intestate per Art. 960(2). The cap rule still applies to the testate portion (constraining total IC legitime, not FP disposition).
- **Source**: free-portion-rules (EC-8), legitime-with-illegitimate (EC-8)

### EC-FP7: Multiple Wills / Codicils

- **Legal basis**: Art. 825
- **Scenario**: Decedent left multiple valid testamentary instruments
- **Engine behavior**: Dispositions are additive. Sum all testamentary dispositions across all valid wills/codicils before computing inofficiousness.
- **Source**: free-portion-rules (EC-5)

---

## 19. Testate / Will Interpretation

### EC-T1: After-Acquired Property

- **Legal basis**: Art. 793
- **Scenario**: Decedent acquired property after making the will
- **Engine behavior**: After-acquired property passes through the will ONLY if the will expressly says so. Otherwise passes intestate.
- **Source**: testate-institution (E9)

### EC-T2: Residuary Institution

- **Legal basis**: Standard testamentary interpretation
- **Scenario**: "I leave the rest of my estate to A"
- **Engine behavior**: A gets whatever remains after specific legacies, devises, and legitimes. Modeled as `ShareSpec::Residuary`. The engine computes: `residuary_share = estate - total_legacies - total_devises - total_other_institutions`.
- **Source**: testate-institution (E4)

### EC-T3: Compulsory Heir Instituted Above Legitime

- **Legal basis**: Art. 842
- **Scenario**: Will says "I leave 80% to my only child" (child's legitime is 50%)
- **Engine behavior**: Valid. The excess 30% comes from the FP. The engine splits: 50% from legitime (unconditional), 30% from FP (may carry conditions per Art. 872).
- **Source**: testate-institution (E5), testate-validation (E1)

### EC-T4: Compulsory Heir Renounces Institution But Claims Legitime

- **Legal basis**: Art. 1041, Art. 886, Art. 872
- **Scenario**: A compulsory heir wants to reject their testamentary share but keep their legal minimum
- **Engine behavior**: The heir CAN renounce the entire inheritance (Art. 1041). But the testator CANNOT impose conditions that would force the heir to renounce the legitime (Art. 872). If the heir voluntarily renounces everything, both parts are gone. If they only renounce the FP share, their legitime remains.
- **Source**: testate-institution (E6), accretion-rules (EC-3)

### EC-T5: Contradictory Dispositions

- **Legal basis**: Will interpretation, outside engine scope
- **Scenario**: Will says "I leave my house to A" and "I leave my house to B"
- **Engine behavior**: This is a court/executor interpretation issue. The engine should accept the court-resolved disposition as input. Not deterministically computable.
- **Source**: testate-institution (E3)

### EC-T6: Executor Delegation (Art. 786)

- **Legal basis**: Art. 786
- **Scenario**: Testator delegates distribution of specific property to a third person
- **Engine behavior**: Accept the third person's distribution decisions as input (executor discretion outside engine scope). The engine handles the deterministic computation with the resolved dispositions.
- **Source**: testate-institution (E8)

### EC-T7: Art. 872 — Conditions on Legitime Stripped

- **Legal basis**: Art. 872
- **Scenario**: Will says "I leave ¼ to my spouse but only if she does not remarry"
- **Engine behavior**: The condition on the legitime portion is void — the spouse gets the ¼ unconditionally. If the heir's share includes both legitime and FP components, the engine splits: unconditional-legitime + conditional-FP.
- **Source**: testate-validation (Art. 872), legitime-surviving-spouse (EC-4)

### EC-T8: Incapacitated Instituted Heir (Art. 1027)

- **Legal basis**: Art. 1027
- **Scenario**: The instituted heir is incapacitated (e.g., priest who heard the testator's last confession)
- **Engine behavior**: Institution is void for that heir. Resolve via: substitution → accretion → intestate.
- **Source**: testate-institution (E7)

### EC-T9: All Instituted Heirs Predecease or Refuse

- **Legal basis**: Art. 841
- **Scenario**: Every instituted heir can't or won't accept, and there are no substitutes
- **Engine behavior**: Entire estate passes intestate. Legacies/devises survive if not inofficious.
- **Source**: testate-institution (E2)

---

## 20. Rounding and Precision

### EC-RP1: Non-Terminating Decimal Fractions

- **Legal basis**: Computation requirement
- **Scenario**: Many scenarios produce fractions like ⅓ (0.333...), ⅙ (0.166...), 1/7 (0.142857...)
- **Engine behavior**: Use exact rational arithmetic (Fraction type with BigInt numerator/denominator) throughout all intermediate computations. Convert to centavo amounts only at Step 10 (final output). Allocate any rounding remainder (1-2 centavos) to the largest-share heir first, then subsequent heirs in descending order.
- **Source**: legitime-table (EC-7), data-model, computation-pipeline

### EC-RP2: Sum Invariant After Rounding

- **Legal basis**: Mathematical requirement
- **Scenario**: After converting fractions to peso amounts, the sum may not equal the estate due to rounding
- **Engine behavior**: The engine MUST enforce the sum invariant: `sum(all_heir_amounts) == net_distributable_estate`. Distribute any remainder centavos to ensure this always holds.
- **Source**: test-vectors (invariant #1), computation-pipeline (Step 10)

---

## 21. Manual Review Flags (Summary)

The engine produces deterministic output for all computable scenarios. Six edge cases are flagged for manual review because they involve genuine legal ambiguity or require information outside the engine's input:

| Flag Code | Trigger | Legal Basis | Source |
|-----------|---------|-------------|--------|
| `GRANDPARENT_OF_ILLEGITIMATE` | Art. 903 says "parents" not "ascendants" — grandparents of illegitimate decedent unclear | Art. 903 | legitime-ascendants, computation-pipeline |
| `CROSS_CLASS_ACCRETION` | IC renounces when concurring with LCs — Art. 1018 vs Art. 968 ambiguity on who receives the vacant share | Arts. 1018, 968 | accretion-rules (EC-11), computation-pipeline |
| `RESERVA_TRONCAL` | Property subject to Art. 891 reservation detected — requires asset-level metadata | Art. 891 | legitime-ascendants (EC-7), computation-pipeline |
| `COLLATION_DISPUTE` | Art. 1077 — heirs disagree about collatability or value of a donation | Art. 1077 | collation, computation-pipeline |
| `RA_11642_RETROACTIVITY` | Pre-2022 adoption with Sec. 41 filiation extension question | RA 8552 / RA 11642 Sec. 41 | adopted-children-rights, computation-pipeline |
| `ARTICULO_MORTIS` | Art. 900 ¶2 conditions detected — verify all 3 conditions hold | Art. 900 ¶2 | legitime-surviving-spouse, computation-pipeline |

### Additional Flags Discovered in This Catalog

| Flag Code | Trigger | Legal Basis | Source |
|-----------|---------|-------------|--------|
| `USUFRUCT_ANNUITY_OPTION` | Art. 911 ¶3 — compulsory heirs must choose between complying with usufruct/annuity or taking FP in ownership | Art. 911 ¶3 | free-portion-rules (EC-7) |
| `DUAL_LINE_ASCENDANT` | Consanguinity: same person appears in both paternal and maternal ascendant lines | Art. 890 | legitime-ascendants (EC-5) |
| `POSTHUMOUS_DISINHERITANCE` | Will disinherits a child not yet born at will execution | Arts. 915-923 | disinheritance-rules (EC-9) |
| `CONTRADICTORY_DISPOSITIONS` | Will contains inconsistent instructions for same property | Will interpretation | testate-institution (E3) |
| `EXECUTOR_DELEGATION` | Art. 786 — testator delegated distribution to a third person; engine needs their decisions as input | Art. 786 | testate-institution (E8) |

---

## Cross-Reference: Edge Cases by Source Analysis

| Source Analysis | Edge Cases |
|----------------|-----------|
| compulsory-heirs-categories | EC-A1, EC-F1, EC-F3, EC-P1, EC-LS1/2, EC-U1/2, EC-ID1, EC-A3 |
| heir-concurrence-rules | EC-R1, EC-R2, EC-ID1, EC-LS1 |
| representation-rights | EC-REP1-7, EC-U4 |
| adopted-children-rights | EC-A1-6 |
| illegitimate-children-rights | EC-F1/2, EC-IC1-3, EC-COL9, EC-P2, EC-R5 |
| legitime-table | EC-REP7, EC-FP1, EC-RP1, EC-ID2, EC-AM1 |
| legitime-with-illegitimate | EC-R5, EC-FP6 |
| legitime-surviving-spouse | EC-LS1-4, EC-MV1-3, EC-AM1/2, EC-T7, EC-COL6 |
| legitime-ascendants | EC-RT1/2, EC-ID1-3 |
| free-portion-rules | EC-FP1-7, EC-T3 |
| intestate-order | EC-LS1, EC-C1/2, EC-U1, EC-IC1/2, EC-R2 |
| testate-institution | EC-T1-9 |
| testate-validation | EC-FP1, EC-PR6, EC-D3, EC-T3 |
| disinheritance-rules | EC-D1-6, EC-U3, EC-LS4 |
| preterition | EC-PR1-7 |
| collation | EC-COL1-12 |
| accretion-rules | EC-AC1-5, EC-R3/4/6-8 |
| computation-pipeline | All manual review flags |
| data-model | ManualFlagCode enum (6 flags) |

---

## Statistics

- **Total unique edge cases cataloged**: 82
- **Edge cases requiring deterministic computation**: 72
- **Edge cases requiring manual review flags**: 10 (6 existing + 4 newly identified)
- **Categories**: 21

---

*Compiled from all 23 Wave 1-4 analysis files. Every edge case includes its legal basis, engine behavior, and source analysis for full traceability.*
