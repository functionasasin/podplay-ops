# RA 8552 — Domestic Adoption Act of 1998
# RA 11642 — Domestic Administrative Adoption and Alternative Child Care Act (2022)
# Consolidated Succession-Relevant Provisions

*Consolidated from loops/inheritance-reverse/analysis/ for v2 specification.*

---

## RA 8552: Domestic Adoption Act of 1998

### Section 16 — Parental Authority

Upon the finality of the adoption order, the biological parents are relieved of parental authority over the adoptee, **except** when the biological parent is the spouse of the adopter, in which case parental authority shall be exercised jointly by both spouses.

**Engine implication (Stepparent Adoption)**: If the adopter is a stepparent (married to biological parent), the child retains succession rights from BOTH the biological parent AND the adopter.

### Section 17 — Legitimacy

**The adoptee shall be considered the legitimate son/daughter of the adopter(s) for all intents and purposes and as such is entitled to all the rights and obligations provided by law to legitimate sons/daughters born to them without discrimination of any kind.**

To this end, the adoptee is entitled to love, guidance, and support in keeping with the means of the family.

**Engine implication**: Adopted children are classified as `ADOPTED_CHILD` but their effective_category = `LEGITIMATE_CHILD_GROUP`. They receive **exactly the same share as legitimate biological children** in all succession scenarios.

### Section 18 — Succession Rights

In testate and intestate succession, the adoptee and the adopter shall have reciprocal rights of succession without distinction from legitimate filiation.

However, if the adoptee and his/her biological parents had left a will, the law on testamentary succession shall govern.

**Engine implication**: Full bilateral succession rights. Adopted child inherits from adopter; adopter inherits from adopted child.

### Section 20 — Effects of Rescission of Adoption

If the petition of the adopter for rescission is granted, the parental authority of the adoptee's biological parents shall be restored if the adoptee is still a minor or incapacitated. The reciprocal rights and obligations of the adopter and the adoptee to each other shall be extinguished.

**Key succession rule**: Rescission before the adopter's death → adoption succession rights are extinguished. The adopted child loses succession rights from the adopter.

**Engine implication**: `adoption_rescinded: bool` flag. If true AND rescission before date_of_death → treated as NOT an adopted child of the decedent.

---

## RA 11642: Domestic Administrative Adoption and Alternative Child Care Act (2022)

RA 11642 amended RA 8552 by transferring jurisdiction over domestic adoption from courts to the National Authority for Child Care (NACC). Key changes:

- **Administrative adoption**: Processed through NACC, not RTC
- **Court adoption**: Still available for certain cases
- **Same substantive rights**: The succession rights of adopted children remain identical to RA 8552

**Engine implication**: Engine does not need to distinguish RA 8552 vs RA 11642 adoptions. Both confer the same succession rights. The boolean `is_adopted` and `adoption_rescinded` flags cover both laws.

---

## Key Adoption Rules for the Succession Engine

### Rule A: Adoption = Legitimate for All Succession Purposes

```
adopted_child.effective_category = LEGITIMATE_CHILD_GROUP
```

This means:
- Adopted child gets 1/(2n) of estate (as one of the n legitimate children)
- Adopted child's share equals legitimate biological children's shares
- Adopted child excluded by same rules as legitimate children (e.g., excluded by iron curtain from biological relatives' estates)

### Rule B: Rescission Extinguishes Adoption Rights

```
if heir.is_adopted AND heir.adoption_rescinded:
    if heir.adoption_rescission_date < decedent.date_of_death:
        return null  // Not a compulsory heir
```

### Rule C: Stepparent Adoption — Dual Succession Rights

When a stepparent adopts their spouse's child:
- Child retains inheritance from biological parent (spouse of adopter) — ties NOT severed (Sec. 16)
- Child gains inheritance from adopter (stepparent)
- Child has succession rights from BOTH

**Engine implication**:
```
if heir.is_adopted AND heir.biological_parent_is_adopter_spouse:
    // Child inherits from both adopter AND biological_parent
    // This edge case requires noting both succession relationships
```

### Rule D: Iron Curtain Rule Does NOT Apply to Adopted Child vs Adopter

Art. 992's Iron Curtain Rule bars illegitimate children from inheriting ab intestato from the legitimate relatives of their biological parents. An adopted child is now **legitimate** in the adopter's family — the Iron Curtain Rule does not prevent the adopted child from inheriting from the adopter's relatives.

However, the adopted child generally loses succession rights from their biological family (except in stepparent adoption per Sec. 16).

### Rule E: No Special Provision for Adopted Child's Deceased Biological Relatives

Once adoption is final, the adopted child cannot inherit ab intestato from their biological family (unless the biological parent is the adopter's spouse). This is the flip side of Sec. 17's full transfer of succession rights to the adoptive family.

---

## Summary Table

| Scenario | Rule | Engine Behavior |
|----------|------|-----------------|
| Valid adoption, no rescission | RA 8552 Sec. 17 | `ADOPTED_CHILD` → `LEGITIMATE_CHILD_GROUP`; full equal share |
| Adoption rescinded before death | RA 8552 Sec. 20 | Not a compulsory heir; excluded |
| Adoption rescinded after death | N/A | Rescission after death does not retroactively affect inheritance |
| Stepparent adoption | RA 8552 Sec. 16 | Dual succession rights from both adopter and biological parent |
| Adopted child's own death | RA 8552 Sec. 18 | Adopter can inherit from adopted child; biological family loses rights |
