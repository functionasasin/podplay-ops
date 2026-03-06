# Analysis: annual-reconciliation

**Aspect:** annual-reconciliation
**Wave:** 2 (Domain Rules Extraction)
**Date:** 2026-03-01

## What This Aspect Covers

The annual income tax return is the final reconciliation of a taxpayer's full-year obligation against quarterly
prepayments and creditable withholding. This aspect specifies:

1. Full-year computation under each path (A/B/C) at annual level
2. Field-by-field mapping for Form 1701A (OSD path, 8% path) and Form 1701 (itemized, mixed income)
3. Tax credits/payments section — every input line item
4. Balance payable vs. overpayment determination
5. Installment payment election rules
6. Overpayment disposition options (refund, TCC, carry-over)
7. Required attachments decision
8. Annual late filing penalties
9. Error in existing DT-04 (Form 1701A erroneously listed for itemized deductions — corrected)
10. Error in existing CR-011 (second installment listed as July 15 — corrected to October 15)

## Key Findings

### F-001: Form selection for itemized deductions
BIR Form 1701A CANNOT be used for itemized deductions. Form 1701A is only for:
- Graduated + OSD (Part IV-A), or
- 8% flat rate (Part IV-B)
Itemized deductions require Form 1701 with Schedule 3A and Schedule 4.
DT-04 had an error claiming 1701A can be used for itemized deductions. Fixed below.

### F-002: Second installment date
NIRC Sec. 56(A)(2) as amended by TRAIN Law: second installment is due October 15 (NOT July 15).
CR-011 erroneously stated July 15. Corrected to October 15.

### F-003: Installment threshold basis
The ₱2,000 threshold for installment eligibility uses GROSS income tax due (Item 22 on Form 1701 or
Item 20 on Form 1701A) BEFORE credits. Even if balance payable after credits is small, the installment
option is available when gross IT due exceeds ₱2,000.

### F-004: Q4 CWT and gross captured at annual level only
There is no Form 1701Q for Q4. Q4 gross receipts and Q4 CWT (Form 2307 for Oct–Dec) are only
captured when filing the annual return (Form 1701/1701A). The annual computation is the first and only
place these Q4 figures appear.

### F-005: Cumulative quarterly payments vs. actual cash paid
The annual tax credits section uses actual cash payments from quarterly returns (max(0, Item 63 per
quarter)), NOT the cumulative tax due from those returns. If a quarter showed zero payable due to
excess credits, that quarter contributes ₱0 to total_quarterly_payments at annual time.

### F-006: 8% ₱250K at annual level
The ₱250K deduction for 8% purely SE taxpayers is re-applied at the annual level (Item 54 of Form
1701A Part IV-B = ₱250,000). The quarterly 1701Q also applied ₱250K each quarter (Item 52 of
Schedule II), which creates over-payments each quarter (since ₱250K is deducted 3x quarterly).
This over-deduction is intentional — it means taxpayers pay LESS each quarter and a larger amount
(or receive a refund) at annual time. The annual reconciliation corrects for this by using the
correct ₱250K-once formula on annual gross totals.

### F-007: Non-operating income at annual level
All non-operating income (interest income not subject to final tax, rental income, gains on property
sales) received throughout the year is included in the annual return. For 8% taxpayers, non-operating
income is included in the 8% base (Items 50-52 of Form 1701A Part IV-B). For OSD taxpayers, non-
operating income is listed separately as Items 41-44 of Form 1701A Part IV-A and adds to total taxable
income AFTER OSD has been computed on the gross receipts/revenues only.

### F-008: Annual return is NOT Q4 1701Q
No quarterly 1701Q is filed for Q4. The annual return effectively "covers" Q4 income but is NOT a
quarterly return — it is a full-year reconciliation. This means Q4 CWT must be claimed on the annual
return (Item 60 of 1701A or Item 8 of 1701 Part VI), not on any quarterly return.

### F-009: Required attachments thresholds
- Gross quarterly sales > ₱150,000 → Certificate of Independent CPA and AIF/Financial Statements
- All filers → SAWT (Summary Alphalist of Withholding Tax)
- All filers claiming CWT → Form 2307 copies
- Mixed income earners → Form 2316 from each employer
- Amended returns → proof of prior payment

## Files to Write/Update

- `final-mega-spec/domain/computation-rules.md` — CR-049 through CR-055, fix CR-011
- `final-mega-spec/domain/decision-trees.md` — DT-17, DT-18, fix DT-04
- `final-mega-spec/domain/edge-cases.md` — EC-AR01 through EC-AR12
