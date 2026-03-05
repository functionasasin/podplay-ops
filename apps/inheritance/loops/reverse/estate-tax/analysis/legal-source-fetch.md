# Analysis: legal-source-fetch
## Wave 1 — Legal Source Acquisition

**Date**: 2026-02-23
**Status**: Complete
**Aspect**: Fetch and cache all primary legal sources

---

## What Was Done

Fetched and cached all primary legal source files into `input/legal-sources/`:

| File | Content | Primary Sources Used |
|---|---|---|
| `nirc-title-iii.md` | NIRC Sections 84–97, TRAIN-amended, full text of all subsections | taxacctgcenter.ph, BIR official materials |
| `pre-train-rates.md` | Original Section 84 graduated rate table, all pre-TRAIN deduction rules, comparison table | ralblaw.com, multiple commentary sites, BIR |
| `amnesty-provisions.md` | RA 11213 Sections 3–9, RA 11569, RA 11956 provisions, computation tracks, examples | lawphil.net, saklawph.com, PwC Philippines |
| `form-1801-fields.md` | Complete field-by-field mapping of BIR Form 1801 (Jan 2018), all schedules, Part IV computation, output contract | BIR guidelines, search result data |
| `commentary-samples.md` | 7 sample computations across TRAIN, pre-TRAIN, and amnesty; key takeaways | respicio.ph, asglawpartners.com, ralblaw.com |

---

## Key Findings

### TRAIN-Era Rules (Sec. 84 as amended by RA 10963)
- Flat 6% rate on net taxable estate, effective January 1, 2018
- Standard deduction: ₱5,000,000 (citizens/residents), ₱500,000 (non-resident aliens)
- Family home: up to ₱10,000,000
- Medical expenses: up to ₱500,000 (1-year window)
- Funeral and judicial expenses: NOT deductible (removed by TRAIN)
- Filing: within 1 year; CPA required for gross estate > ₱5,000,000

### Pre-TRAIN Rules (Sec. 84 original RA 8424)
- Graduated rates: 0% (≤₱200K), 5%, 8%, 11%, 15%, 20% (>₱10M)
- Standard deduction: ₱1,000,000
- Family home: up to ₱1,000,000
- Funeral expenses: lower of actual or 5% of gross estate — DEDUCTIBLE
- Judicial/administrative expenses: fully DEDUCTIBLE
- Filing: within 6 months; CPA required for gross estate > ₱2,000,000

### Estate Tax Amnesty (RA 11213/11569/11956)
- Coverage: deaths on or before May 31, 2022 (per RA 11956)
- Rate: 6% of net estate (using deductions applicable at time of death)
- Minimum: ₱5,000 if net estate ≤ 0
- Two tracks: (A) no prior return, (B) prior return filed (apply to net undeclared estate)
- Filing window: **CLOSED** June 14, 2025
- Immunities: all penalties/surcharges/interest waived upon compliance

### Form 1801 Output Contract
Complete field mapping established. Key output items:
- Items 29–34: Gross estate components
- Item 35: Total ordinary deductions
- Item 36: Estate after ordinary deductions
- Items 37A–D, 37: Special deductions
- Item 38: Net estate
- Item 39: Surviving spouse share
- Item 40: Net taxable estate
- Items 41–44: Tax computation
- Item 20: Estate tax payable

---

## Gaps / Items Needing Further Research

1. **Vanishing deduction formula**: The exact proportional reduction formula from NIRC Sec. 86(A)(2) needs precise elaboration. Aspect `deduction-vanishing` will handle this.

2. **Pre-TRAIN medical expense cap**: Sources suggest ₱500,000 cap applied pre-TRAIN too, but this is not definitively confirmed. Needs resolution in aspect `deductions-pre-train-diffs`.

3. **Amnesty deduction scope ambiguity**: Whether amnesty allows only standard deduction + spouse share, or full NIRC deductions at time of death. Legal text says "deductions applicable at the time of death" — engine should apply full pre-TRAIN deduction set with a note. Aspect `amnesty-computation` will address.

4. **Surviving spouse share interaction**: Does the spouse share reduce the estate BEFORE or AFTER other deductions? Form 1801 order (Item 38 Net Estate, then Item 39 Spouse Share) suggests AFTER. Needs confirmation.

5. **Property regime determination**: Which regime applies to which marriage? Aspect `property-regime-acp` and `property-regime-cpg` will cover.

6. **Non-resident alien proportional deductions**: The exact proportional formula for Sec. 86(B) deductions needs elaboration. Aspect `nonresident-deductions` will cover.

---

## Files Created

- `input/legal-sources/nirc-title-iii.md` — 270 lines
- `input/legal-sources/pre-train-rates.md` — 130 lines
- `input/legal-sources/amnesty-provisions.md` — 170 lines
- `input/legal-sources/form-1801-fields.md` — 195 lines
- `input/legal-sources/commentary-samples.md` — 200 lines

All files are ready for use by subsequent wave aspects.
