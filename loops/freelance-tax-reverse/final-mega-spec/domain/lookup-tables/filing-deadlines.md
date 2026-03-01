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

### 1.3 2026 Quarterly 1701Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2026 | May 15, 2026 | Friday | May 15, 2026 | No adjustment needed |
| Q2 2026 | August 15, 2026 | Saturday | August 17, 2026 | Moves to Monday |
| Q3 2026 | November 15, 2026 | Sunday | November 16, 2026 | Moves to Monday |
| Annual 2025 (due 2026) | April 15, 2026 | Wednesday | April 15, 2026 | No adjustment |

### 1.4 2025 Quarterly 1701Q Filing Dates

| Quarter | Standard Due Date | Day of Week | Adjusted Due Date | Note |
|---|---|---|---|---|
| Q1 2025 | May 15, 2025 | Thursday | May 15, 2025 | No adjustment |
| Q2 2025 | August 15, 2025 | Friday | August 15, 2025 | No adjustment |
| Q3 2025 | November 15, 2025 | Saturday | November 17, 2025 | Moves to Monday |
| Annual 2024 (due 2025) | April 15, 2025 | Tuesday | April 15, 2025 | No adjustment |

### 1.5 2024 Quarterly 1701Q Filing Dates

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
| Q1 VAT | BIR Form 2550Q | May 25 | VAT output − VAT input |
| Q2 Income Tax | 1701Q | August 15 | Same pattern |
| Q2 VAT | 2550Q | August 25 | Same pattern |
| Q3 Income Tax | 1701Q | November 15 | Same pattern |
| Q3 VAT | 2550Q | November 25 | Same pattern |
| Q4 VAT | 2550Q | February 25 (next year) | No Q4 income tax quarterly return |
| Annual | 1701 | April 15 (next year) | Annual reconciliation (itemized or OSD) |

---

**Cross-references:**
- Quarterly computation functions: [computation-rules.md](../computation-rules.md) CR-042, CR-043, CR-044
- Annual reconciliation: [computation-rules.md](../computation-rules.md) CR-011, CR-037
- Percentage tax computation: [computation-rules.md](../computation-rules.md) CR-034
- Penalty computation: [computation-rules.md](../computation-rules.md) CR-048, CR-020
- Penalty schedule tables: [bir-penalty-schedule.md](bir-penalty-schedule.md)
- Decision tree for filing sequence: [decision-trees.md](../decision-trees.md) DT-14
