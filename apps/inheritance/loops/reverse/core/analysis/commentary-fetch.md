# Analysis: commentary-fetch

**Aspect**: Find and cache 5-8 worked examples of Philippine inheritance distribution computations as test vectors.

**Date**: 2026-02-23

---

## Summary

Searched 15+ Philippine legal commentary sources, bar exam reviewers, and law firm publications. Compiled **8 complete worked examples** into `input/legal-sources/worked-examples.md`, covering the full spectrum of succession scenarios needed for engine test vectors.

## Sources Consulted

| Source | Content Found |
|--------|--------------|
| [Respicio & Co.](https://www.lawyer-philippines.com/articles/percentage-of-inheritance-shares-for-heirs-and-descendants-under-philippine-law) | Legitime fractions, testate scenarios, peso examples |
| [Atty. Claridades](https://attyalvinclaridades.wordpress.com/2016/09/18/table-of-legitimes-and-shares-from-the-free-portion-of-the-estate/) | Complete 15-row legitime table for all heir combinations |
| [RALB Law](https://ralblaw.com/preterition-vs-disinheritance/) | Preterition vs disinheritance comparison, Art. 854 effects |
| [ASG Law](https://www.asglawpartners.com/property-law/2023/12/06/preterition-in-philippine-wills-when-omission-leads-to-intestacy/) | Preterition leading to intestacy |
| [DivinaLaw](https://www.divinalaw.com/dose-of-law/revisiting-successional-rights-of-the-adoptee/) | RA 8552/11642 adopted children succession rights |
| [Legal Resource PH](https://legalresource.ph/testamentary-succession/) | Testamentary succession framework, Art. 854, Art. 904 |
| [Respicio Bar Reviewer](https://www.respicio.ph/bar/2025/civil-law/wills-and-succession/different-kinds-of-succession/compulsory-succession/computation-of-the-net-hereditary-estate) | Collation example with ₱10M estate |
| [Respicio — Illegitimate Children](https://www.respicio.ph/commentaries/inheritance-rights-legitimate-vs-illegitimate-children-in-the-philippines) | Unit method for mixed children, Art. 895 half-share |
| [Digest PH](https://www.digest.ph/blog/how-to-compute-your-inheritance) | Conjugal property + intestate computation |
| [Respicio — Effects of Disinheritance](https://www.respicio.ph/bar/2025/civil-law/wills-and-succession/different-kinds-of-succession/compulsory-succession/disinheritance/effects-of-disinheritance) | Art. 923 representation by descendants |
| [Zigurat Real Estate](https://www.zigguratrealestate.ph/post/collation-of-donation-and-procedure-to-determine-legitime) | Collation procedure, Art. 1061 |

## Worked Examples Created

| # | Scenario | Type | Key Rules Tested |
|---|----------|------|-----------------|
| 1 | Simple will, 2 children + friend | Testate | Art. 888 legitime, valid free portion disposition |
| 2 | Inofficious will, 1 child + spouse + friend | Testate | Art. 911 reduction, Art. 892 spouse legitime |
| 3 | Preterition, 3 children + spouse (1 omitted) | Testate → Intestate | Art. 854 annulment, Art. 996 intestate |
| 4 | Valid disinheritance, descendants by representation | Testate | Art. 919(6), Art. 923 representation |
| 5 | Adopted child + biological children + spouse | Testate | RA 8552 Sec. 17, Art. 888 |
| 6 | Mixed succession, partial will (legacy only) | Mixed | Art. 960(2), Art. 996 |
| 7 | Collation of donation, 3 children + charity | Testate + Collation | Arts. 1061, 1064, Art. 888 |
| 8 | Complex intestate: legit + illegit + spouse + representation | Intestate | Arts. 970, 895, 999, unit method |

## Key Findings

1. **Testate worked examples are rare online**: Most Philippine legal commentary focuses on intestate scenarios. Testate examples with full computation are almost entirely absent from free online sources. The 7 intestate examples in `commentary-inheritance-splits.md` (from previous wave) are representative of what's readily available. I constructed the testate examples (1-7) from first principles using the legal rules.

2. **Complete legitime table confirmed**: The 15-row table from Atty. Claridades matches the existing commentary file and adds two scenarios not previously covered: illegitimate parents alone (Art. 903) and illegitimate parents + spouse of illegitimate child (Art. 903).

3. **Collation computation is underspecified in commentary**: Most sources describe collation conceptually but don't provide step-by-step computations. The worked example (Example 7) was constructed from the legal rules in Arts. 1061-1064.

4. **Unit method confirmed for intestate**: Multiple sources confirm the ratio/unit method (legitimate = 2 units, illegitimate = 1 unit, spouse = 2 units) for intestate distribution when legitimate and illegitimate children concur.

5. **RA 11642 expands adoption rights**: DivinaLaw notes that RA 11642 (2022) extends adopted children's legitimate filiation to adopter's relatives (parents, siblings, descendants), potentially expanding intestate succession beyond just adoptive parents. This is a new development that the engine spec should note.

## Coverage Assessment

Between the existing `commentary-inheritance-splits.md` (7 intestate examples + 11 testate scenarios + 15 intestate scenarios) and the new `worked-examples.md` (8 complete test-vector-quality examples), the engine has:

- **Simple intestate**: ✓ (commentary Ex. 1, worked Ex. 8)
- **Common intestate (married + children)**: ✓ (commentary Ex. 1, 2)
- **Illegitimate children mix**: ✓ (commentary Ex. 2, 3; worked Ex. 8)
- **Ascending heirs**: ✓ (commentary Ex. 4, 5)
- **Testate (simple will)**: ✓ (worked Ex. 1)
- **Testate (inofficious)**: ✓ (worked Ex. 2)
- **Preterition**: ✓ (worked Ex. 3)
- **Disinheritance**: ✓ (worked Ex. 4)
- **Adopted child**: ✓ (worked Ex. 5)
- **Mixed succession**: ✓ (worked Ex. 6)
- **Collation**: ✓ (worked Ex. 7)
- **Representation**: ✓ (commentary Ex. 6; worked Ex. 4, 8)
- **Conjugal property**: ✓ (commentary Ex. 7 — upstream of engine, but documented)

**Gap identified**: No worked example for:
- Articulo mortis marriage (Art. 900 ¶2) — edge case, can be added in Wave 5
- Renunciation of inheritance — edge case, Wave 5
- Iron curtain rule (Art. 992) — more of a classification rule, Wave 2
- Commorientes (simultaneous death) — edge case, Wave 5

## New Aspects Discovered

None warranting addition to the frontier at this time. The gaps identified above are already covered by existing frontier aspects (`edge-cases` in Wave 5).
