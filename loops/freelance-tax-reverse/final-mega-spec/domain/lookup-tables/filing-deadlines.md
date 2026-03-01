# Filing Deadlines — Philippine Self-Employed Income Tax Obligations

**Last updated:** 2026-03-01
**Legal basis:** NIRC Secs. 74–79, 116; BIR Form 1701Q, 2551Q, 1701, 1701A; RA 11976 (EOPT); RR 3-2024; RMC 32-2018
**Applies to:** Self-employed individuals, professionals, freelancers, and mixed-income earners

Cross-reference: [computation-rules.md](../computation-rules.md) CR-041, [decision-trees.md](../decision-trees.md) DT-14

---

## Part 1: Quarterly Income Tax Returns (BIR Form 1701Q)

### 1.1 Standard Filing Deadlines

| Quarter | Period Covered (cumulative from Jan 1) | Due Date | BIR Form |
|---|---|---|---|
| Q1 | January 1 – March 31 | May 15 of current year | 1701Q |
| Q2 | January 1 – June 30 | August 15 of current year | 1701Q |
| Q3 | January 1 – September 30 | November 15 of current year | 1701Q |
| Annual / Q4 | January 1 – December 31 | April 15 of FOLLOWING year | 1701 or 1701A |

**No Q4 quarterly return.** The annual return (Form 1701 or 1701A) serves as the final reconciliation for the fourth quarter.

### 1.2 Holiday/Weekend Adjustment Rule

If the due date falls on a Saturday, Sunday, or officially proclaimed non-working public holiday, the deadline automatically moves to the NEXT WORKING DAY.

```
function adjusted_due_date(base_date: Date) -> Date:
  candidate = base_date
  while is_weekend(candidate) or is_ph_public_holiday(candidate):
    candidate = candidate + 1 day
  return candidate
```

**Philippine public holidays relevant to filing periods (fixed dates):**
| Holiday | Date |
|---|---|
| New Year's Day | January 1 |
| Araw ng Kagitingan | April 9 |
| Labor Day | May 1 |
| Independence Day | June 12 |
| National Heroes Day | Last Monday of August |
| All Saints' Day | November 1 |
| Bonifacio Day | November 30 |
| Immaculate Conception | December 8 |
| Christmas Day | December 25 |
| Rizal Day | December 30 |

**Movable holidays relevant to filing periods (examples using 2026 dates):**
| Holiday | 2026 Date |
|---|---|
| Holy Wednesday | April 1, 2026 |
| Maundy Thursday | April 2, 2026 |
| Good Friday | April 3, 2026 |
| Black Saturday | April 4, 2026 |
| Eid al-Fitr | March 30, 2026 (approx.) |
| Eid al-Adha | June 6, 2026 (approx.) |

**Note on movable holidays:** Eid al-Fitr and Eid al-Adha dates are proclaimed annually by the President. The engine must use the proclaimed date for the relevant year. If the proclaimed date is not yet available (e.g., computing for a future year), the engine should display: "Deadline: November 15, [YEAR] (subject to adjustment for public holidays — verify proclamation before filing)."

### 1.3 2027 Quarterly 1701Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2027 | May 15, 2027 | Saturday | May 17, 2027 | Moves to Monday |
| Q2 2027 | August 15, 2027 | Sunday | August 16, 2027 | Moves to Monday |
| Q3 2027 | November 15, 2027 | Monday | November 15, 2027 | No adjustment |
| Annual 2026 (due 2027) | April 15, 2027 | Thursday | April 15, 2027 | No adjustment |

### 1.5 2026 Quarterly 1701Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2026 | May 15, 2026 | Friday | May 15, 2026 | No adjustment needed |
| Q2 2026 | August 15, 2026 | Saturday | August 17, 2026 | Moves to Monday |
| Q3 2026 | November 15, 2026 | Sunday | November 16, 2026 | Moves to Monday |
| Annual 2025 (due 2026) | April 15, 2026 | Wednesday | April 15, 2026 | No adjustment |

### 1.6 2025 Quarterly 1701Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2025 | May 15, 2025 | Thursday | May 15, 2025 | No adjustment |
| Q2 2025 | August 15, 2025 | Friday | August 15, 2025 | No adjustment |
| Q3 2025 | November 15, 2025 | Saturday | November 17, 2025 | Moves to Monday |
| Annual 2024 (due 2025) | April 15, 2025 | Tuesday | April 15, 2025 | No adjustment |

### 1.7 2024 Quarterly 1701Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2024 | May 15, 2024 | Wednesday | May 15, 2024 | No adjustment |
| Q2 2024 | August 15, 2024 | Thursday | August 15, 2024 | No adjustment |
| Q3 2024 | November 15, 2024 | Friday | November 15, 2024 | No adjustment |
| Annual 2023 (due 2024) | April 15, 2024 | Monday | April 15, 2024 | No adjustment |

---

## Part 2: Quarterly Percentage Tax Returns (BIR Form 2551Q)

**Applies to:** Taxpayers on graduated rates (OSD or Itemized) who are non-VAT registered. Does NOT apply to 8% rate taxpayers (percentage tax is waived under 8% election).

### 2.1 Standard Filing Deadlines

| Quarter | Period Covered | Due Date | BIR Form |
|---|---|---|---|
| Q1 | January 1 – March 31 | April 25 of current year | 2551Q |
| Q2 | April 1 – June 30 | July 25 of current year | 2551Q |
| Q3 | July 1 – September 30 | October 25 of current year | 2551Q |
| Q4 | October 1 – December 31 | January 25 of FOLLOWING year | 2551Q |

**Key difference from 1701Q:** The 2551Q has a Q4 return (unlike 1701Q where Q4 is covered by the annual ITR). The Q4 2551Q is due January 25 of the following year. The EOPT Act (RA 11976) did not change these percentage tax filing deadlines.

### 2.2 2026 Quarterly 2551Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date |
|---|---|---|---|
| Q1 2026 | April 25, 2026 | Saturday | April 27, 2026 |
| Q2 2026 | July 25, 2026 | Saturday | July 27, 2026 |
| Q3 2026 | October 25, 2026 | Sunday | October 26, 2026 |
| Q4 2026 | January 25, 2027 | Monday | January 25, 2027 |

### 2.3 2025 Quarterly 2551Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date |
|---|---|---|---|
| Q1 2025 | April 25, 2025 | Friday | April 25, 2025 |
| Q2 2025 | July 25, 2025 | Friday | July 25, 2025 |
| Q3 2025 | October 25, 2025 | Saturday | October 27, 2025 |
| Q4 2025 | January 25, 2026 | Sunday | January 26, 2026 |

### 2.4 2024 Quarterly 2551Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2024 | April 25, 2024 | Thursday | April 25, 2024 | No adjustment |
| Q2 2024 | July 25, 2024 | Thursday | July 25, 2024 | No adjustment |
| Q3 2024 | October 25, 2024 | Friday | October 25, 2024 | No adjustment |
| Q4 2024 | January 25, 2025 | Saturday | January 27, 2025 | Moves to Monday |

### 2.5 2027 Quarterly 2551Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2027 | April 25, 2027 | Sunday | April 26, 2027 | Moves to Monday |
| Q2 2027 | July 25, 2027 | Sunday | July 26, 2027 | Moves to Monday |
| Q3 2027 | October 25, 2027 | Monday | October 25, 2027 | No adjustment |
| Q4 2027 | January 25, 2028 | Tuesday | January 25, 2028 | No adjustment |

---

## Part 3: Annual Income Tax Returns

### 3.1 Annual ITR Deadlines

| Form | Who Files | Due Date | Installment Option |
|---|---|---|---|
| BIR Form 1701 | Mixed income earners, VAT-registered, itemized deductions | April 15 of following year | Yes — if tax > ₱2,000 |
| BIR Form 1701A | Purely self-employed, 8% rate or graduated+OSD only, non-VAT | April 15 of following year | Yes — if tax > ₱2,000 |

### 3.2 Two-Installment Payment Rule

If the annual income tax due (before credits) exceeds ₱2,000, the taxpayer may elect to pay in two installments:
- **First installment:** Amount payable after credits, up to 50% by April 15
- **Second installment:** Remaining 50% (or less, per election) by **October 15** of the SAME year

```
function apply_installment_rule(
  annual_tax_due:             Decimal,  // Full computed annual IT
  total_credits_and_payments: Decimal,  // CWT + quarterly payments
) -> InstallmentSchedule:

  balance_payable = max(Decimal("0"), annual_tax_due - total_credits_and_payments)

  if annual_tax_due <= Decimal("2000") or balance_payable <= 0:
    return InstallmentSchedule {
      installment_available: false,
      first_installment_due: annual_due_date,
      first_installment_amount: balance_payable,
      second_installment_due: None,
      second_installment_amount: Decimal("0"),
      note: "Installment not available: either tax due ≤ ₱2,000 or full balance already covered by credits."
    }

  // Installment is OPTIONAL — taxpayer may still pay full balance on April 15
  max_second_installment = round(annual_tax_due * Decimal("0.50"), 2)

  return InstallmentSchedule {
    installment_available: true,
    first_installment_due: april_15_of_following_year,
    first_installment_amount: balance_payable - max_second_installment,
    // In practice, first installment = at least 50% of balance_payable
    // Exact split: taxpayer chooses, but second cannot exceed 50% of annual tax DUE (not balance)
    second_installment_due: october_15_of_filing_year,
    second_installment_amount: max_second_installment,
    note: "Second installment is due October 15. Must elect installment option on the April 15 return."
  }
```

**Key rule:** The installment option is based on total income tax DUE (Item 22 on Form 1701), NOT the balance payable after credits. Even if the balance payable is small (because credits are large), the option is available as long as the gross tax due exceeds ₱2,000.

**Irrevocability:** Once the installment option is elected on the return (by filling Item 25), it must be honored. Missing the October 15 second installment triggers penalties on the unpaid amount from October 16.

---

## Part 4: BIR Registration and Administrative Deadlines

### 4.1 Initial Registration Deadlines

| Event | Deadline | Form |
|---|---|---|
| First registration (new business/professional) | Within 30 days of business commencement | BIR Form 1901 |
| Transfer of RDO (address change, business move) | Within 30 days of address change | BIR Form 1905 |
| Cessation of business | Within 30 days of cessation | BIR Form 1905 |
| VAT registration (mandatory, >₱3M) | Before commencement of taxable transactions; within 30 days of exceeding ₱3M threshold | BIR Form 1507 |
| Update of registration information | Within 30 days of any change | BIR Form 1905 |

**EOPT change (RA 11976, effective Jan 22, 2024):** Annual Registration Fee (₱500 ARF) abolished. No annual renewal fee required. COR does not expire annually — it remains valid until deregistration.

### 4.2 8% Option Election Deadlines

| Scenario | Election Deadline | How to Elect |
|---|---|---|
| New registrant (COR-based election) | At time of registration (BIR Form 1901) | Check 8% option on Form 1901 |
| First Q1 quarterly return | May 15 (Q1 due date) | BIR Form 1701Q Item 16 |
| Q1 Form 2551Q (NIL) | April 25 (Q1 2551Q due date) | Mark NIL with 8% notation |
| Form 1905 update (if missed above) | Before May 15 of taxable year | BIR Form 1905 |
| If Q1 passed without election | No election possible for that year | Default: graduated rates apply |

### 4.3 Annual Registration Fee Abolition Timeline

| Period | ARF Status |
|---|---|
| Before January 22, 2024 | ₱500 per year due January 31 |
| January 22, 2024 onward | ABOLISHED per RA 11976 Sec. 5 |

---

## Part 5: Withholding Tax and SAWT Submission Deadlines

### 5.1 EWT Remittance by Withholding Agents (Clients)

Self-employed freelancers receive BIR Form 2307 from clients. Clients (as withholding agents) must remit the withheld tax and file BIR Form 1601-EQ (quarterly EWT return):

| Quarter | Q1 EWT | Q2 EWT | Q3 EWT | Q4 EWT |
|---|---|---|---|---|
| Remittance deadline | April 30 | July 31 | October 31 | January 31 (next year) |

Clients must issue the Form 2307 to the freelancer within 20 days after the end of each quarter (i.e., April 20 for Q1, July 20 for Q2, October 20 for Q3, January 20 next year for Q4).

### 5.2 SAWT (Summary Alphalist of Withholding Taxes) Submission

| Return | SAWT Submission Method | Due Date |
|---|---|---|
| 1701Q (any quarter) | Electronic submission via eBIRForms with the quarterly return | Same as 1701Q due date |
| 1701 / 1701A (annual) | Electronic submission via eBIRForms with the annual return | Same as annual return due date |

---

## Part 6: Filing Deadline Calendar Matrix (Annual Summary)

The following matrix shows all filing obligations per month for a typical non-VAT freelancer on graduated rates (both income tax and percentage tax):

| Month | Filing Obligation | Form | Period Covered | Who Files |
|---|---|---|---|---|
| January 25 | Q4 Percentage Tax Return | 2551Q | Oct 1 – Dec 31 (prior year) | Graduated (OSD/Itemized), non-VAT, non-8% |
| April 15 | Annual Income Tax Return | 1701 or 1701A | Full prior year (Jan–Dec) | All self-employed |
| April 15 | 2nd Installment Option Election | 1701 / 1701A (election made) | If tax due > ₱2,000 | All annual filers who choose installment |
| April 25 | Q1 Percentage Tax Return | 2551Q | Jan 1 – Mar 31 | Graduated, non-VAT, non-8% |
| May 15 | Q1 Quarterly Income Tax Return | 1701Q | Jan 1 – Mar 31 cumulative | All self-employed (including 8%) |
| July 25 | Q2 Percentage Tax Return | 2551Q | Apr 1 – Jun 30 | Graduated, non-VAT, non-8% |
| August 15 | Q2 Quarterly Income Tax Return | 1701Q | Jan 1 – Jun 30 cumulative | All self-employed (including 8%) |
| October 15 | 2nd Installment of Annual Tax | 1701 / 1701A (payment only) | Prior year annual | Only if installment was elected on April 15 |
| October 25 | Q3 Percentage Tax Return | 2551Q | Jul 1 – Sep 30 | Graduated, non-VAT, non-8% |
| November 15 | Q3 Quarterly Income Tax Return | 1701Q | Jan 1 – Sep 30 cumulative | All self-employed (including 8%) |

**For 8% rate taxpayers:** Skip all 2551Q rows. Filing obligations are only: May 15 (1701Q Q1), Aug 15 (1701Q Q2), Nov 15 (1701Q Q3), Apr 15 next year (1701A annual).

---

## Part 7: Days-Until-Deadline Calculation Function

The engine must compute days remaining until each filing deadline to display in the UI:

```
function compute_upcoming_deadlines(
  today: Date,
  taxable_year: int,
  taxpayer_regime: Enum["EIGHT_PCT", "GRADUATED_OSD", "GRADUATED_ITEMIZED"],
  last_filed_quarter: int,  // 0 = none filed yet; 1 = Q1 filed; 2 = Q2 filed; 3 = Q3 filed; 4 = annual filed
) -> List[UpcomingDeadline]:

  deadlines = []

  // Q1 1701Q
  q1_it_due = adjusted_due_date(Date(taxable_year, 5, 15))  // May 15
  if today <= q1_it_due and last_filed_quarter < 1:
    deadlines.append(UpcomingDeadline(
      form = "BIR Form 1701Q (Q1)",
      due_date = q1_it_due,
      days_remaining = (q1_it_due - today).days,
      is_overdue = today > q1_it_due,
      action = "File Q1 income tax return. This is also the LAST DAY to elect the 8% rate option for the year."
    ))

  // Q1 2551Q (only for graduated, non-8%)
  if taxpayer_regime in ["GRADUATED_OSD", "GRADUATED_ITEMIZED"]:
    q1_pt_due = adjusted_due_date(Date(taxable_year, 4, 25))  // April 25
    if today <= q1_pt_due and last_filed_quarter < 1:
      deadlines.append(UpcomingDeadline(
        form = "BIR Form 2551Q (Q1)",
        due_date = q1_pt_due,
        days_remaining = (q1_pt_due - today).days,
        is_overdue = today > q1_pt_due,
        action = "File Q1 quarterly percentage tax return (3% of Q1 gross receipts)."
      ))

  // Q2 1701Q
  q2_it_due = adjusted_due_date(Date(taxable_year, 8, 15))
  if today <= q2_it_due and last_filed_quarter < 2:
    deadlines.append(UpcomingDeadline(
      form = "BIR Form 1701Q (Q2)",
      due_date = q2_it_due,
      days_remaining = (q2_it_due - today).days,
      is_overdue = today > q2_it_due,
      action = "File Q2 income tax return (cumulative January–June)."
    ))

  // Q2 2551Q
  if taxpayer_regime in ["GRADUATED_OSD", "GRADUATED_ITEMIZED"]:
    q2_pt_due = adjusted_due_date(Date(taxable_year, 7, 25))
    if today <= q2_pt_due and last_filed_quarter < 2:
      deadlines.append(UpcomingDeadline(
        form = "BIR Form 2551Q (Q2)",
        due_date = q2_pt_due,
        days_remaining = (q2_pt_due - today).days,
        is_overdue = today > q2_pt_due,
        action = "File Q2 quarterly percentage tax return."
      ))

  // Q3 1701Q
  q3_it_due = adjusted_due_date(Date(taxable_year, 11, 15))
  if today <= q3_it_due and last_filed_quarter < 3:
    deadlines.append(UpcomingDeadline(
      form = "BIR Form 1701Q (Q3)",
      due_date = q3_it_due,
      days_remaining = (q3_it_due - today).days,
      is_overdue = today > q3_it_due,
      action = "File Q3 income tax return (cumulative January–September)."
    ))

  // Q3 2551Q
  if taxpayer_regime in ["GRADUATED_OSD", "GRADUATED_ITEMIZED"]:
    q3_pt_due = adjusted_due_date(Date(taxable_year, 10, 25))
    if today <= q3_pt_due and last_filed_quarter < 3:
      deadlines.append(UpcomingDeadline(
        form = "BIR Form 2551Q (Q3)",
        due_date = q3_pt_due,
        days_remaining = (q3_pt_due - today).days,
        is_overdue = today > q3_pt_due,
        action = "File Q3 quarterly percentage tax return."
      ))

  // Q4 2551Q (only for graduated; no Q4 1701Q)
  if taxpayer_regime in ["GRADUATED_OSD", "GRADUATED_ITEMIZED"]:
    q4_pt_due = adjusted_due_date(Date(taxable_year + 1, 1, 25))
    deadlines.append(UpcomingDeadline(
      form = "BIR Form 2551Q (Q4)",
      due_date = q4_pt_due,
      days_remaining = (q4_pt_due - today).days,
      is_overdue = today > q4_pt_due,
      action = "File Q4 quarterly percentage tax return (October–December). No Q4 income tax return is separate."
    ))

  // Annual return
  annual_due = adjusted_due_date(Date(taxable_year + 1, 4, 15))
  annual_form = "BIR Form 1701A" if taxpayer_regime in ["EIGHT_PCT", "GRADUATED_OSD"] else "BIR Form 1701"
  deadlines.append(UpcomingDeadline(
    form = annual_form,
    due_date = annual_due,
    days_remaining = (annual_due - today).days,
    is_overdue = today > annual_due,
    action = f"File annual income tax return for {taxable_year}."
  ))

  // Sort by due_date ascending
  return sorted(deadlines, key=lambda d: d.due_date)
```

---

## Part 8: eFPS Filing Group Deadlines

Large taxpayers enrolled in the BIR's Electronic Filing and Payment System (eFPS) have staggered filing deadlines. Since our target users are self-employed freelancers and small professionals, they are typically NOT eFPS enrollees (eFPS is for BIR-classified large taxpayers). However, for completeness:

| eFPS Group | 1701Q Additional Days After Standard Deadline |
|---|---|
| Group A (ending in 0) | Standard deadline + 5 days |
| Group B (ending in 1 or 2) | Standard deadline + 4 days |
| Group C (ending in 3 or 4) | Standard deadline + 3 days |
| Group D (ending in 5 or 6) | Standard deadline + 2 days |
| Group E (ending in 7, 8, or 9) | Standard deadline + 1 day |
| Non-eFPS | Standard deadline (no stagger) |

**For this product:** All target users (freelancers, professionals, small sole proprietors) are non-eFPS. Use standard deadlines for all computations and displays. The eFPS stagger does not apply.

---

## Part 9: Summary — Filing Obligation by Taxpayer Profile

### Profile A: Purely Self-Employed, 8% Rate, Non-VAT (≤₱3M)
| Filing Period | Form | Due Date | Action |
|---|---|---|---|
| Q1 Income Tax | 1701Q (Schedule II, 8% elected) | May 15 | Pay cumulative tax: GR_Q1 × 8% minus ₱250K pro-rated minus credits |
| Q2 Income Tax | 1701Q (Schedule II) | August 15 | Cumulative YTD − Q1 payment |
| Q3 Income Tax | 1701Q (Schedule II) | November 15 | Cumulative YTD − Q1 − Q2 payments |
| Annual | 1701A | April 15 (next year) | Full year (GR − ₱250K) × 8% − CWT − Q1/Q2/Q3 payments |
| Percentage Tax | NONE — waived by 8% election | N/A | No 2551Q required for any quarter |

### Profile B: Purely Self-Employed, Graduated+OSD, Non-VAT (≤₱3M)
| Filing Period | Form | Due Date | Action |
|---|---|---|---|
| Q1 Income Tax | 1701Q (Schedule I, OSD) | May 15 | Cumulative NTI × graduated rate − credits |
| Q1 Percentage Tax | 2551Q | April 25 | Q1 gross × 3% |
| Q2 Income Tax | 1701Q (Schedule I, OSD) | August 15 | Cumulative YTD NTI − Q1 payment |
| Q2 Percentage Tax | 2551Q | July 25 | Q2 gross × 3% |
| Q3 Income Tax | 1701Q (Schedule I, OSD) | November 15 | Cumulative YTD NTI − Q1 − Q2 payments |
| Q3 Percentage Tax | 2551Q | October 25 | Q3 gross × 3% |
| Q4 Percentage Tax | 2551Q | January 25 (next year) | Q4 gross × 3% |
| Annual | 1701A | April 15 (next year) | Full year NTI − CWT − quarterly payments |

### Profile C: Purely Self-Employed, Graduated+Itemized, Non-VAT (≤₱3M)
| Filing Period | Form | Due Date | Action |
|---|---|---|---|
| Q1 Income Tax | 1701Q (Schedule I, Itemized) | May 15 | Cumulative NTI × graduated rate − credits |
| Q1 Percentage Tax | 2551Q | April 25 | Q1 gross × 3% |
| Q2 Income Tax | 1701Q (Schedule I, Itemized) | August 15 | Same as Profile B |
| Q2 Percentage Tax | 2551Q | July 25 | Q2 gross × 3% |
| Q3 Income Tax | 1701Q (Schedule I, Itemized) | November 15 | Same as Profile B |
| Q3 Percentage Tax | 2551Q | October 25 | Q3 gross × 3% |
| Q4 Percentage Tax | 2551Q | January 25 (next year) | Q4 gross × 3% |
| Annual | 1701 | April 15 (next year) | Full year with itemized deductions schedule |

### Profile D: Mixed Income Earner, 8% on Business, Non-VAT
| Filing Period | Form | Due Date | Action |
|---|---|---|---|
| Q1 Business Income Tax | 1701Q (Schedule II, 8% elected) | May 15 | Business GR_Q1 × 8% (NO ₱250K deduction) |
| Q2 Business Income Tax | 1701Q (Schedule II) | August 15 | Cumulative business GR YTD × 8% − Q1 payment |
| Q3 Business Income Tax | 1701Q (Schedule II) | November 15 | Cumulative − Q1 − Q2 payments |
| Compensation | No quarterly filing (employer handles) | N/A | Employer withholds via monthly payroll |
| Percentage Tax | NONE — waived | N/A | 8% election waives OPT |
| Annual | 1701 | April 15 (next year) | Combined compensation + business (ALWAYS Form 1701) |

### Profile E: VAT-Registered, Graduated+OSD, >₱3M
| Filing Period | Form | Due Date | Action |
|---|---|---|---|
| Q1 Income Tax | 1701Q (Schedule I) | May 15 | Business NTI − credits |
| Q1 VAT | BIR Form 2550Q | April 25 | VAT output − VAT input (25th day after Q1 end) |
| Q2 Income Tax | 1701Q | August 15 | Same pattern |
| Q2 VAT | 2550Q | July 25 | VAT output − VAT input (25th day after Q2 end) |
| Q3 Income Tax | 1701Q | November 15 | Same pattern |
| Q3 VAT | 2550Q | October 25 | VAT output − VAT input (25th day after Q3 end) |
| Q4 VAT | 2550Q | January 25 (next year) | 25th day after Q4 end; no separate Q4 income tax return |
| Annual | 1701 | April 15 (next year) | Annual reconciliation (itemized or OSD) |

**VAT deadline basis:** NIRC Section 114(A): "filed not later than the twenty-fifth (25th) day following the close of each taxable quarter." Confirmed by BIR Form 2550Q April 2024 (ENCS) and RMC 68-2024. Monthly VAT return (Form 2550M) was abolished effective January 1, 2023 (TRAIN Law Sec. 37 via RR 13-2018).

### Profile F: Mixed Income Earner, Graduated+OSD, Non-VAT (Business Portion ≤₱3M)
| Filing Period | Form | Due Date | Action |
|---|---|---|---|
| Q1 Business Income Tax | 1701Q (Schedule I, OSD) | May 15 | Business gross × 60% = NTI Q1; add comp NTI on annual only |
| Q1 Percentage Tax | 2551Q | April 25 | Business Q1 gross × 3% |
| Q2 Business Income Tax | 1701Q (Schedule I, OSD) | August 15 | Cumulative business NTI − Q1 payment |
| Q2 Percentage Tax | 2551Q | July 25 | Business Q2 gross × 3% |
| Q3 Business Income Tax | 1701Q (Schedule I, OSD) | November 15 | Cumulative business NTI − Q1 − Q2 payments |
| Q3 Percentage Tax | 2551Q | October 25 | Business Q3 gross × 3% |
| Q4 Percentage Tax | 2551Q | January 25 (next year) | Business Q4 gross × 3% |
| Compensation (quarterly) | None — employer handles | N/A | Employer withholds monthly via BIR Form 1601-C |
| Annual | 1701 (NEVER 1701A for mixed income) | April 15 (next year) | Combined: business NTI (OSD) + compensation NTI, graduated rates, all credits |

**Note:** Mixed income earners ALWAYS file Form 1701 for the annual return, never 1701A, even when using OSD for the business portion. The quarterly 1701Q covers ONLY the business income portion.

### Profile G: Mixed Income Earner, VAT-Registered, Graduated+OSD (Business Portion >₱3M)
| Filing Period | Form | Due Date | Action |
|---|---|---|---|
| Q1 Business Income Tax | 1701Q (Schedule I) | May 15 | Business NTI (OSD or Itemized) − credits |
| Q1 VAT | 2550Q | April 25 | Business VAT output − VAT input for Q1 |
| Q2 Business Income Tax | 1701Q | August 15 | Cumulative NTI − Q1 payment |
| Q2 VAT | 2550Q | July 25 | Q2 VAT |
| Q3 Business Income Tax | 1701Q | November 15 | Cumulative NTI − Q1 − Q2 |
| Q3 VAT | 2550Q | October 25 | Q3 VAT |
| Q4 VAT | 2550Q | January 25 (next year) | Q4 VAT |
| Compensation (quarterly) | None — employer handles | N/A | Employer payroll withholding |
| Annual | 1701 | April 15 (next year) | Combined: business NTI + compensation NTI; Path A or B only (no 8%) |

---

## Part 10: VAT Form 2550Q Quarterly Deadline Specifications

**Applies to:** VAT-registered taxpayers (annual gross sales/receipts exceeding ₱3,000,000, or voluntarily VAT-registered). Does NOT apply to percentage tax (non-VAT) filers or 8% rate taxpayers.

**Legal basis:** NIRC Section 114(A) as amended by TRAIN Law (RA 10963): "filed not later than the twenty-fifth (25th) day following the close of each taxable quarter." Monthly VAT return (Form 2550M) abolished effective January 1, 2023 (RR 13-2018).

### 10.1 Standard Filing Deadlines

| Quarter | Period Covered | Due Date | BIR Form |
|---|---|---|---|
| Q1 | January 1 – March 31 | April 25 of current year | 2550Q |
| Q2 | April 1 – June 30 | July 25 of current year | 2550Q |
| Q3 | July 1 – September 30 | October 25 of current year | 2550Q |
| Q4 | October 1 – December 31 | January 25 of FOLLOWING year | 2550Q |

**Identical pattern to 2551Q:** The 2550Q deadlines use the same 25th-day-after-quarter-end rule as Form 2551Q. The same holiday/weekend adjustment function applies (see Part 1.2).

### 10.2 2027 VAT Form 2550Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2027 | April 25, 2027 | Sunday | April 26, 2027 | Moves to Monday |
| Q2 2027 | July 25, 2027 | Sunday | July 26, 2027 | Moves to Monday |
| Q3 2027 | October 25, 2027 | Monday | October 25, 2027 | No adjustment |
| Q4 2027 | January 25, 2028 | Tuesday | January 25, 2028 | No adjustment |

### 10.3 2026 VAT Form 2550Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2026 | April 25, 2026 | Saturday | April 27, 2026 | Moves to Monday |
| Q2 2026 | July 25, 2026 | Saturday | July 27, 2026 | Moves to Monday |
| Q3 2026 | October 25, 2026 | Sunday | October 26, 2026 | Moves to Monday |
| Q4 2026 | January 25, 2027 | Monday | January 25, 2027 | No adjustment |

### 10.4 2025 VAT Form 2550Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2025 | April 25, 2025 | Friday | April 25, 2025 | No adjustment |
| Q2 2025 | July 25, 2025 | Friday | July 25, 2025 | No adjustment |
| Q3 2025 | October 25, 2025 | Saturday | October 27, 2025 | Moves to Monday |
| Q4 2025 | January 25, 2026 | Sunday | January 26, 2026 | Moves to Monday |

### 10.5 2024 VAT Form 2550Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2024 | April 25, 2024 | Thursday | April 25, 2024 | No adjustment |
| Q2 2024 | July 25, 2024 | Thursday | July 25, 2024 | No adjustment |
| Q3 2024 | October 25, 2024 | Friday | October 25, 2024 | No adjustment |
| Q4 2024 | January 25, 2025 | Saturday | January 27, 2025 | Moves to Monday |

### 10.6 VAT 2550Q vs OPT 2551Q Side-by-Side

The engine must route VAT-registered taxpayers to 2550Q and non-VAT taxpayers to 2551Q (or neither if 8% elected). The two forms share identical filing deadline patterns.

| Parameter | BIR Form 2550Q (VAT) | BIR Form 2551Q (OPT) |
|---|---|---|
| Who files | VAT-registered taxpayers | Non-VAT, graduated rate, non-8% |
| Tax base | Net VAT (output VAT − input VAT) | Gross quarterly sales × 3% |
| Q1 due | April 25 | April 25 |
| Q2 due | July 25 | July 25 |
| Q3 due | October 25 | October 25 |
| Q4 due | January 25 next year | January 25 next year |
| NIL return required | Yes — must file even if net VAT = 0 | Yes — must file even if gross = 0 |
| In scope for this product | Informational only (shown for Profile E/G) | Full computation support |

**Product scope note:** This optimizer computes income tax (1701/1701A/1701Q) and percentage tax (2551Q). It does NOT compute VAT (2550Q) beyond informational deadline display. Taxpayers earning over ₱3M are shown their 2550Q filing deadlines as a reminder, but the VAT computation itself is out of scope (see [manual-review-flags.md](../manual-review-flags.md) for VAT-specific MRF entries).

---

## Part 11: NIL Return Obligations

A NIL return is a return filed with zero taxable income, zero gross receipts, or zero tax due. Philippine BIR regulations require filing even when there is nothing to pay.

### 11.1 NIL Return Requirements by Form

| Form | NIL Return Required? | Consequence of Non-Filing | Note |
|---|---|---|---|
| BIR Form 1701Q (quarterly IT) | Yes — every quarter without exception | Compromise penalty (₱1,000 per return, first offense; ₱5,000 second; ₱10,000 third; criminal prosecution for 4th+) | Even if income was zero, a return must be filed by the deadline |
| BIR Form 2551Q (quarterly OPT) | Yes — every quarter Q1–Q4 | Compromise penalty (₱1,000 first offense, same escalation) | For Q1, can substitute NIL 2551Q with 8% election notation (different form obligation) |
| BIR Form 2550Q (quarterly VAT) | Yes — every quarter | Compromise penalty + potential VAT audit trigger | Zero net VAT still requires filing (zero input = zero output = NIL) |
| BIR Form 1701 (annual IT) | Yes — even if income is zero | Compromise penalty; BIR flags as non-filer (triggers enforcement notice) | Registered taxpayers must always file annual return |
| BIR Form 1701A (annual IT simplified) | Yes — even if income is zero | Same as 1701 | Use 1701A if 8% or graduated+OSD purely self-employed |

### 11.2 NIL Return Penalty Escalation

Compromise penalties for NIL late filing use the nil-return offense counter, NOT the tax-due-based compromise bracket. The offense counter is per taxpayer TIN, not per form:

| Offense | Compromise Penalty | Criminal Risk |
|---|---|---|
| 1st NIL late filing | ₱1,000 | None |
| 2nd NIL late filing | ₱5,000 | None |
| 3rd NIL late filing | ₱10,000 | None |
| 4th and subsequent | BIR refers to DOJ for criminal prosecution | Imprisonment 6 months–2 years |

**EOPT reduction:** For MICRO and SMALL taxpayers, the NIL return penalty schedule above is not reduced (EOPT reductions apply only to interest and surcharge on unpaid tax, not to compromise penalties on nil returns). However, per RMO 7-2015 as amended by RR 6-2024, the BIR may offer abatement for first-time offenders with no prior violations.

### 11.3 Engine Behavior for NIL Returns

The engine must generate a filing reminder whenever the taxpayer is registered (has a TIN and active COR) even if inputs show zero income for the period:

```
function check_nil_return_obligation(
  taxpayer_regime:   Enum["EIGHT_PCT", "GRADUATED_OSD", "GRADUATED_ITEMIZED", "VAT_REGISTERED"],
  quarter:           int,        // 1, 2, or 3 for quarterly returns
  gross_for_period:  Decimal,
) -> NilReturnAlert | None:

  if gross_for_period > 0:
    return None  // Normal return, not a NIL return

  // Gross = 0: always a NIL return
  forms_due = []

  if quarter in [1, 2, 3]:
    forms_due.append("BIR Form 1701Q")
    if taxpayer_regime in ["GRADUATED_OSD", "GRADUATED_ITEMIZED"]:
      forms_due.append("BIR Form 2551Q")
    if taxpayer_regime == "VAT_REGISTERED":
      forms_due.append("BIR Form 2550Q")

  return NilReturnAlert {
    forms: forms_due,
    message: "You had no income this quarter but you are still required to file NIL returns. "
             + "Failure to file incurs a ₱1,000 compromise penalty per return (first offense).",
    filing_required: True,
    penalty_if_missed: Decimal("1000") * len(forms_due)
  }
```

### 11.4 Zero-Income Quarterly Example

A freelancer registered as 8% rate taxpayer who had no clients in Q2:
- Q2 1701Q must still be filed by August 15 (adjusted for weekends/holidays)
- Form 1701Q Schedule II, Item 47 = ₱0, Item 48 = ₱0, Item 50 = ₱0 (prior quarter credit = Q1 payable, which is already zero in this example), all items = ₱0
- Mark NIL checkbox on the form
- No payment due
- Failure to file: ₱1,000 compromise penalty

---

## Part 12: BIR Payment Channels

Taxpayers must remit tax payments through authorized channels simultaneously with or before filing the return.

### 12.1 Authorized Agent Banks (AABs)

The following banks are currently accredited as BIR AABs. Payment is made directly over the counter, online banking, or via the bank's e-payment portal.

| Bank | Payment Methods |
|---|---|
| Land Bank of the Philippines (LBP) | Over-the-counter branch, LBP Link.BizPortal (online) |
| Development Bank of the Philippines (DBP) | Over-the-counter branch, DBP PayTax (online) |
| BDO Unibank | Over-the-counter, BDO Online Banking |
| Bank of the Philippine Islands (BPI) | Over-the-counter, BPI Online Banking |
| Metropolitan Bank and Trust Company (Metrobank) | Over-the-counter, Metrobank Online |
| Philippine National Bank (PNB) | Over-the-counter, PNB e-banking |
| EastWest Bank | Over-the-counter branch |
| China Banking Corporation (China Bank) | Over-the-counter branch |
| Rizal Commercial Banking Corporation (RCBC) | Over-the-counter, RCBC Bankard e-payment |
| Security Bank | Over-the-counter branch |
| UnionBank of the Philippines | Over-the-counter, UnionBank Online (tax payment feature) |
| Philippine Veterans Bank | Over-the-counter branch |
| Robinsons Bank | Over-the-counter branch |
| Sterling Bank of Asia | Over-the-counter branch |

### 12.2 Electronic Payment Channels (ePay)

BIR accepts payment through the following e-payment platforms integrated with its eFPS/eBIRForms system:

| Channel | Platform Type | Notes |
|---|---|---|
| GCash | Mobile wallet | GCash app → Pay Bills → Government → BIR. Enter TIN, form type, amount, taxable period. Generates BIR payment confirmation number. |
| Maya (formerly PayMaya) | Mobile wallet | Maya app → Bills → BIR. Same fields as GCash. |
| UnionBank Online | Internet banking | Integrated BIR tax payment module within the UnionBank app. |
| LBP Link.BizPortal | Internet banking | For Land Bank account holders; direct tax payment to BIR. |
| DBP PayTax | Internet banking | For DBP account holders. |
| PayMongo | Payment gateway | For businesses with PayMongo-integrated invoicing; supports BIR tax payment. |

### 12.3 eBIRForms Payment Integration

When filing via eBIRForms (offline software or web-based eBIRForms):
1. Complete the return in eBIRForms
2. Click "Submit" — return is transmitted electronically to BIR
3. BIR generates a Filing Reference Number (FRN)
4. Proceed to payment at any AAB or e-payment channel using the FRN
5. Retain the BIR payment receipt (BIR Form 0605 or AAB-stamped payment form) as proof

### 12.4 EOPT File-and-Pay-Anywhere Rule

Effective January 22, 2024 (RA 11976 EOPT Act, implementing RR 3-2024):
- Self-employed taxpayers may file and pay at ANY AAB nationwide, regardless of which Revenue District Office (RDO) the taxpayer is registered under.
- Prior rule (before EOPT): payment required at the AAB accredited to the taxpayer's RDO.
- Current rule (from January 22, 2024): no RDO restriction on payment venue.
- E-payment channels (GCash, Maya, etc.) are available regardless of this change.

### 12.5 Payment Validation

The engine generates a payment summary for each return that includes:

```
struct PaymentSummary {
  form_type:             String,   // "1701Q", "2551Q", "1701A", "1701"
  taxable_period:        String,   // e.g., "Q1 2026 (January 1 – March 31, 2026)"
  tax_due:               Decimal,
  tax_due_label:         String,   // "Income Tax Due" or "Percentage Tax Due"
  less_credits:          Decimal,  // CWT + prior quarterly payments
  balance_payable:       Decimal,  // max(0, tax_due - credits)
  is_nil_return:         bool,     // balance_payable = 0 AND tax_due = 0
  has_balance:           bool,     // balance_payable > 0
  suggested_channel:     String,   // "GCash or any AAB" for amounts < ₱50,000; "AAB branch" for larger
  payment_instructions:  String,   // Human-readable instructions
  filing_deadline:       Date,     // Adjusted deadline
  days_until_deadline:   int,      // Negative = overdue
}
```

**Suggested channel logic:**
- If balance_payable = 0: "No payment required. File NIL return by [deadline]."
- If balance_payable ≤ ₱50,000: "Pay via GCash or Maya for convenience, or at any authorized agent bank."
- If balance_payable > ₱50,000 and ≤ ₱500,000: "Pay at any authorized agent bank (AAB) over-the-counter or online. GCash/Maya may have transaction limits — verify with your e-wallet provider."
- If balance_payable > ₱500,000: "Pay at an authorized agent bank (AAB) branch. Large-value transactions require in-person or online banking payment. E-wallets are not recommended for this amount."

---

**Cross-references:**
- Quarterly computation functions: [computation-rules.md](../computation-rules.md) CR-042, CR-043, CR-044
- Annual reconciliation: [computation-rules.md](../computation-rules.md) CR-011, CR-037
- Percentage tax computation: [computation-rules.md](../computation-rules.md) CR-034
- Penalty computation: [computation-rules.md](../computation-rules.md) CR-048, CR-020
- Penalty schedule tables: [bir-penalty-schedule.md](bir-penalty-schedule.md)
- Decision tree for filing sequence: [decision-trees.md](../decision-trees.md) DT-14
- NIL return penalty escalation: [bir-penalty-schedule.md](bir-penalty-schedule.md) Part 3 (Nil Return Compromise Penalties)
