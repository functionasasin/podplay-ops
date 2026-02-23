# Republic Act 8552 — Domestic Adoption Act of 1998

Sources: [LawPhil](https://lawphil.net/statutes/repacts/ra1998/ra_8552_1998.html), [ChanRobles](https://chanrobles.com/republicactno8552.html), [Official Gazette](https://mirror.officialgazette.gov.ph/1998/02/25/republic-act-no-8552/)

---

## Succession-Relevant Provisions

### Section 16: Parental Authority

Except in cases where the biological parent is the spouse of the adopter, all legal ties between the biological parent(s) and the adoptee shall be severed and the same shall then be vested on the adopter(s).

> **Engine Implication**: Upon adoption, the adopted child's legal parent-child relationship shifts entirely to the adopter(s). The child inherits from the adoptive parents, not the biological parents.

### Section 17: Legitimacy

The adoptee shall be considered the legitimate son/daughter of the adopter(s) for all intents and purposes and as such is entitled to all the rights and obligations provided by law to legitimate sons/daughters born to them without discrimination of any kind. The adoptee is entitled to love, guidance, and support in keeping with the means of the family.

> **Engine Implication**: For inheritance computation purposes, an adopted child is treated IDENTICALLY to a legitimate biological child. Same legitime fraction, same priority, same concurrence rules.

### Section 18: Succession

In legal and intestate succession, the adopter(s) and the adoptee shall have reciprocal rights of succession without distinction from legitimate filiation. However, if the adoptee and his/her biological parent(s) had left a will, the law on testamentary succession shall govern.

> **Engine Implication**:
> - In intestate succession: adopted child = legitimate child (no distinction)
> - In testate succession: if biological parent left a will including the adoptee, that testamentary disposition governs (edge case)
> - Reciprocal: adopter can also inherit from adoptee

### Section 19: Non-Disclosure of Adoption Records

All records, books, and papers relating to the adoption cases in the files of the court, the Department, or any other agency or institution participating in the adoption proceedings shall be kept strictly confidential.

### Section 20: Effects of Rescission of Adoption

If the adoption is rescinded:
(a) The adoptee shall be considered as a legitimated child of his/her biological parent(s);
(b) The reciprocal rights and obligations of the adopter(s) and the adoptee to each other shall be extinguished;
(c) **Succession rights shall revert to its status prior to adoption, but only as of the date of judgment of judicial rescission. Vested rights acquired prior to judicial rescission shall be respected.**

> **Engine Implication**: The engine should track whether an adoption has been rescinded. If rescinded, the adopted child loses inheritance rights from the adopter as of the date of rescission. Vested rights (inheritances already received) are not affected.

---

## Summary for Inheritance Engine

| Scenario | Adopted Child's Status | Inheritance Rights |
|----------|----------------------|-------------------|
| Valid adoption, intestate | Legitimate child of adopter(s) | Same as biological legitimate child |
| Valid adoption, testate | Legitimate child of adopter(s) | Same as biological legitimate child; subject to will provisions |
| Biological parent left will for adoptee | Testamentary succession governs | Per will, subject to legitime rules |
| Adoption rescinded | Reverts to status pre-adoption | Loses rights from adopter; retains vested rights |
| Biological parent's succession | No rights (legal ties severed) | Exception: spouse-of-adopter scenario |

### Critical Rules:

1. **Full legal equivalence**: Adopted child = legitimate child for ALL succession purposes (Sec. 17)
2. **Reciprocal rights**: Adopter inherits from adoptee too (Sec. 18)
3. **Severance of biological ties**: Biological parents generally cannot inherit from adoptee, nor adoptee from biological parents (Sec. 16)
4. **Exception for spouse adoption**: When one biological parent is the spouse of the adopter, that biological parent's tie is NOT severed (Sec. 16)
5. **Rescission reversal**: Adoption rescission reverses succession rights prospectively only (Sec. 20)

---

## Related: Civil Code Art. 984

In case of the death of an adopted child, leaving no children or descendants, his parents and relatives by consanguinity and not by adoption, shall be his legal heirs.

> **Note**: This Civil Code provision appears to conflict with RA 8552's severance of biological ties. Under the principle of lex posteriori derogat priori, RA 8552 (1998) likely prevails over the Civil Code provision. The engine should follow RA 8552.

---

*Compiled from LawPhil, ChanRobles, and Official Gazette sources.*
