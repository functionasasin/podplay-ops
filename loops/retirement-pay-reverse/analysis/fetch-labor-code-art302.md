# Analysis: fetch-labor-code-art302

**Wave:** 1 — Domain Source Acquisition
**Date:** 2026-03-06
**Status:** Complete
**Source cached at:** input/sources/labor-code-art302.md

---

## What Was Fetched

Labor Code Article 302 (formerly Article 287) on Retirement, including all amendments and implementing rules:

1. **RA 7641** (Dec 9, 1992) — original amendment establishing 22.5-day formula and 60/65 retirement ages
2. **RA 8558** (Feb 26, 1998) — underground mine workers: optional at 50, compulsory at 60
3. **RA 10757** (Apr 8, 2016) — surface mine workers: optional at 50, compulsory at 60
4. **DOLE Rule II, Book VI** — Implementing Rules (full salary basis, exemptions, coverage)
5. **DOLE Labor Advisory** (Oct 24, 1996, Sec. Quisumbing) — practical computation guidelines

---

## Key Facts Confirmed

### Renumbering
Art. 287 (the number RA 7641 amended in 1992) was renumbered to **Art. 302** by DOLE Advisory No. 1, Series of 2015. The substantive content is identical — references to "Art. 287" and "Art. 302" refer to the same provision.

### One-Half Month Salary — Statutory Text
The statute defines it as:
> "fifteen (15) days plus one-twelfth (1/12) of the 13th month pay and the cash equivalent of not more than five (5) days of service incentive leaves"

Numeric decomposition: **22.5 days per year of service**
- 15 days salary
- 5 days SIL cash equivalent (the "not more than" language establishes 5 days as the floor, confirmed by DOLE Labor Advisory)
- 1/12 of 13th month pay ≈ 2.5 days

### "At Least" Language
Art. 302 says "equivalent to at least one-half (1/2) month salary" — meaning company plans may exceed but never undercut this minimum. The product computes the **statutory minimum**; plan comparison shows when a company plan equals or exceeds it.

### Retroactivity
Service before January 7, 1993 (law's effectivity date) counts toward total credited years. The DOLE Labor Advisory explicitly confirms this.

---

## Coverage Table

| Employee Category | Covered? | Notes |
|---|---|---|
| Private sector (general) | YES | All positions, designations, payment methods |
| Part-time employees | YES | Explicitly included |
| Job contractor employees | YES | Explicitly included |
| Retail/service/agricultural ≤10 workers | NO | Hard exemption — "not more than ten" is the cutoff |
| Government employees | NO | Covered by Civil Service Law |

---

## Retirement Age Table

| Employee Category | Optional | Compulsory | Min. Service |
|---|---|---|---|
| General private sector | 60 | 65 | 5 years |
| Underground mine workers (RA 8558) | 50 | 60 | 5 years |
| Surface mine workers (RA 10757) | 50 | 60 | 5 years |

Surface mine workers definition (RA 10757): "mill plant workers, electrical, mechanical and tailings pond personnel"

---

## Credited Years Rounding
- Fraction of at least **6 months** = **1 whole year**
- Fraction of less than 6 months = dropped (not rounded)
- Service before Jan 7, 1993 is included

---

## Salary Basis (Implementing Rules)
For daily-rate employees:
- "Latest salary rate" = all remunerations for normal working hours
- Includes fixed, time, piece, commission wages
- Includes fair value of board/lodging/facilities

For piece-rate/results-based employees:
- Use **average daily salary over preceding 12 months**

---

## SIL Component Clarification
The "not more than five (5) days" language in the statute is a legislative drafting choice that means:
- The standard formula includes 5 days SIL
- Parties may agree to MORE (broader inclusions)
- The statutory floor is 5 days — confirmed by DOLE implementing rules and *Grace Christian High School v. Lavandera*

---

## Product Impact

1. **General calculator uses age 60/65 thresholds** — mine worker variants are edge cases to flag, not primary UI
2. **Small employer exemption**: When user inputs employer size ≤10, output must be "Exempt from RA 7641 — no statutory retirement pay obligation" with explanation
3. **Hire dates before 1993 are valid** — service before Jan 7, 1993 counts
4. **SIL floor is 5 days** — always use 5 days in formula unless company plan specifies more
5. **"At least" language**: The computation is the minimum. Gap analysis shows when company plan exceeds or falls short.

---

## New Aspects Discovered

None — this confirms existing frontier aspects. The mine worker variants (RA 8558, RA 10757) are already captured in `edge-cases-catalog` in Wave 2.

---

## Sources
- RA 7641: https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/1680
- RA 8558: https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/3838
- RA 10757: https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/66770
- DOLE Rule II, Book VI: https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/52124
- DOLE Labor Advisory: https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/45996
