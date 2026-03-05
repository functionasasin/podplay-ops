# Family Code (EO 209) — Filiation and Succession-Relevant Provisions

*Consolidated from loops/inheritance-reverse/analysis/ for v2 specification.*

---

## Title VI — Paternity and Filiation (Arts. 163–182)

### Chapter 1 — Legitimate Children (Arts. 163–173)

**Art. 163** — The filiation of children may be by nature or by adoption. Natural filiation may be legitimate or illegitimate.

**Art. 164** — Children conceived or born during the marriage of the parents are legitimate.

Children conceived as a result of artificial insemination of the wife with the sperm of the husband or that of a donor or both are likewise legitimate children of the husband and his wife, provided that both of them authorized or ratified such insemination in a written instrument executed and signed by them before the birth of the child. The instrument shall be recorded in the civil registry together with the birth certificate of the child.

**Art. 165** — Children conceived and born outside a valid marriage are illegitimate, unless otherwise provided in this Code.

**Art. 166** — Legitimacy of a child may be impugned only on the following grounds:
(1) That it was physically impossible for the husband to have sexual intercourse with his wife within the first 120 days of the 300 days which immediately preceded the birth of the child because of:
  (a) the physical incapacity of the husband to have sexual intercourse with his wife;
  (b) the fact that the husband and wife were living separately in such a way that sexual intercourse was not possible; or
  (c) serious illness of the husband, which absolutely prevented sexual intercourse;
(2) That it is proved that for biological or other scientific reasons, the child could not have been that of the husband, except in the instance provided in the second paragraph of Article 164; or
(3) That in case of children conceived through artificial insemination, the written authorization or ratification of either parent was obtained through mistake, fraud, violence, intimidation, or undue influence.

**Art. 172** — The filiation of legitimate children is established by any of the following:
(1) The record of birth appearing in the civil register or a final judgment; or
(2) An admission of legitimate filiation in a public document or a private handwritten instrument and signed by the parent concerned.

In the absence of the foregoing evidence, the legitimate filiation shall be proved by:
(1) The open and continuous possession of the status of a legitimate child; or
(2) Any other means allowed by the Rules of Court and special laws.

**Art. 173** — The action to claim legitimacy may be brought by the child during his or her lifetime and shall be transmitted to the heirs should the child die during minority or in a state of insanity. In these cases, the heirs shall have a period of five years within which to institute the action.

### Chapter 2 — Proof of Filiation (Arts. 172–175)

**Art. 175** — Illegitimate children may establish their illegitimate filiation in the same way and on the same evidence as legitimate children.

The action must be brought within the same period specified in Article 173, except when the action is based on the second paragraph of Article 172, in which case the action may be brought during the lifetime of the alleged parent.

### Chapter 3 — Illegitimate Children (Art. 176)

**Art. 176** *(as amended by RA 9255)* — Illegitimate children shall use the surname and shall be under the parental authority of their mother, and shall be entitled to support in conformity with this Code. However, illegitimate children may use the surname of their father if their filiation has been expressly recognized by the father through the record of birth appearing in the civil register, or when an admission in a public document or private handwritten instrument is made by the father. Provided, the father has the right to institute an action before the regular courts to prove non-filiation during his lifetime.

**The legitime of each illegitimate child shall consist of one-half of the legitime of a legitimate child.**

### Chapter 4 — Legitimated Children (Arts. 177–182)

**Art. 177** *(as amended by RA 9858)* — Children conceived and born outside of wedlock of parents who, at the time of the conception of the former, were not disqualified by any impediment to marry each other, or were so disqualified only because either or both of them were below eighteen (18) years of age, may be legitimated.

**Art. 178** — Legitimation shall take place by a subsequent valid marriage between parents. The annulment of a voidable marriage shall not affect the legitimation.

**Art. 179** — Legitimated children shall enjoy the same rights as legitimate children.

**Art. 180** — The effects of legitimation shall retroact to the time of the child's birth.

**Art. 181** — The legitimation of children who died before the celebration of the marriage shall benefit their descendants.

**Art. 182** — Legitimation may be impugned only by those who are prejudiced in their rights, within five years from the time their cause of action accrues.

---

## Key Rules for the Succession Engine

### Rule 1: Single Illegitimate Classification (Art. 176 FC)

**The Family Code abolished the Civil Code's three-tier system**:

| Old Civil Code | New Status (FC Art. 176) |
|---------------|--------------------------|
| Acknowledged natural child | Illegitimate child |
| Natural child by legal fiction | Illegitimate child |
| Other illegitimate child | Illegitimate child |

ALL illegitimate children now:
1. Use mother's surname (unless father recognized)
2. Are under mother's parental authority
3. Receive **½ of a legitimate child's legitime** (uniform)

**Engine implication**: No need for sub-tiers of illegitimate children. One `ILLEGITIMATE_CHILD` category handles all.

### Rule 2: Filiation Proof Required (Arts. 172, 175)

Legitimate filiation: established by:
- Birth record in civil register, OR
- Final judgment, OR
- Admission in public/handwritten document signed by parent, OR
- Open and continuous possession of the status, OR
- Any other means allowed by Rules of Court

Illegitimate filiation: same evidence (Art. 175), but action must be brought within specific periods.

**Engine implication**: `filiation_proved: bool` flag on Heir. If false for an illegitimate child → excluded.

### Rule 3: Legitimated Children = Legitimate (Arts. 177–179)

Requirements for legitimation:
1. Born outside wedlock
2. Parents had NO legal impediment to marry at time of conception (or impediment was only age under 18, per RA 9858)
3. Parents subsequently contracted a valid marriage (Art. 178)

Effect: Child treated as legitimate **retroactively from birth** (Art. 180).

**Engine implication**: `LEGITIMATED_CHILD` → effective_category = `LEGITIMATE_CHILD_GROUP`. No distinction in computation.

### Rule 4: Legal Separation and Succession (Civil Code Arts. 892, 1002)

- **Innocent spouse** (deceived was the deceased): inherits normally
- **Guilty spouse** (gave cause for legal separation): loses ALL succession rights (Art. 1002)

**Engine implication**: `legal_separation_guilty: bool` flag. If true → spouse excluded entirely.

---

## Succession Impact Summary

| Person | FC Provision | Engine Category | Legitime Fraction |
|--------|-------------|-----------------|-------------------|
| Born in valid marriage | Art. 164 | LEGITIMATE_CHILD | 1/(2n) of estate |
| Born outside marriage | Art. 165 | ILLEGITIMATE_CHILD | ½ × legitimate share |
| Legitimated by marriage | Arts. 177–179 | LEGITIMATED_CHILD → effective LEGITIMATE | Same as legitimate |
| Adopted (RA 8552) | Sec. 17 | ADOPTED_CHILD → effective LEGITIMATE | Same as legitimate |
