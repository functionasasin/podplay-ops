# Analysis: fetch-dole-final-pay

Wave: 1 — Domain Source Acquisition
Date: 2026-03-06
Source cached: input/sources/dole-final-pay-la06-20.md

---

## What Was Fetched

DOLE Labor Advisory No. 06, Series of 2020 — "Guidelines on the Payment of Final Pay and Issuance of Certificate of Employment"

Issued: January 31, 2020
Official issuance authority: Department of Labor and Employment (DOLE), Philippines

---

## Key Findings

### 1. Definition of Final Pay

Final pay = "the sum or totality of all wages or monetary benefits due the employee regardless of the cause of the termination of employment."

Also called "back pay" or "last pay."

### 2. Complete List of Final Pay Components

| Item | Component | Basis |
|------|-----------|-------|
| (a) | Unpaid earned salary | Labor Code |
| (b) | Cash conversion of unused SIL | Art. 95 |
| (c) | Unused vacation/sick leave (if applicable) | Company policy / CBA |
| (d) | Pro-rated 13th month pay | PD 851 |
| (e) | Separation pay (if applicable) | Arts. 298-299 |
| (f) | Retirement pay (if applicable) | Art. 302 (RA 7641) |
| (g) | Tax refunds for excess withheld | NIRC |
| (h) | Other contractual compensation | CBA / contract |
| (i) | Cash bonds/deposits owed to employee | — |

### 3. Release Deadlines

- Final pay: **30 calendar days** from date of separation (firm deadline, not after clearance)
- Certificate of Employment (COE): **3 days** from employee's request
- More favorable company policies prevail over the 30-day default

### 4. Employer Clearance Rights

Employers may offset final pay against legitimate employee debts (Milan v. NLRC). Clearance procedures are valid but cannot extend beyond the 30-day limit.

### 5. Enforcement

Non-compliance → complaint at DOLE Regional/Provincial/Field Office.

---

## Relevance to the RA 7641 Calculator

### Critical Distinction: Double-Counting Risk

The RA 7641 formula for retirement pay includes:
- 15 days salary
- 5 days SIL (cash equivalent)
- 1/12 of 13th month pay

These are the **minimum retirement pay formula components**, not a credit against final pay.

Under LA 06-20, a retiring employee is also entitled to:
- (b) Unused SIL cash conversion (Art. 95) — the actual unused SIL days beyond the 5 days embedded in the formula
- (d) Pro-rated 13th month pay (PD 851) — the actual 13th month accrued in the calendar year

This means the 5 SIL days and 1/12 13th month in the RA 7641 formula establish the **minimum retirement pay**, but do NOT discharge the employer's obligations under Art. 95 (SIL) and PD 851 (13th month). Those are separate obligations.

**NLRC worksheet implication:** The worksheet should list retirement pay (RA 7641), unused SIL (Art. 95), and pro-rated 13th month (PD 851) as separate line items.

### 30-Day Rule for Retirement

The 30-day payment rule applies to retirement pay just as to any other final pay component. This means:
- Employer must pay retirement pay within 30 days of the retirement date
- If employer delays, employee can file a DOLE complaint
- NLRC money claim worksheet should note the due date

### Calculator Feature: Final Pay Checklist

The results view should include a "Final Pay Checklist" beyond just retirement pay:
1. Retirement pay (RA 7641) — primary computation
2. Unused SIL cash conversion
3. Pro-rated 13th month pay
4. Unpaid earned salary for final pay period
5. Any other contractual benefits
6. Net of applicable taxes and deductions

---

## Computation Formulas Derived

### Pro-Rated 13th Month Pay
```
ProRated13thMonth = (TotalBasicSalaryEarned_ThisCalendarYear) / 12
```
Where TotalBasicSalaryEarned = monthly basic × months completed from Jan 1 to retirement date.

### SIL Cash Conversion (Art. 95)
```
SIL_DaysEarned = (MonthsWorked / 12) × 5
SIL_CashValue = SIL_DaysEarned × DailyRate
```
Only employees with >= 1 year service qualify.

Note: In the RA 7641 formula, the 5 SIL days are already embedded in the 22.5-day computation. The Art. 95 SIL cash conversion at separation represents the current year's unused SIL, which may or may not overlap. Employers often treat the RA 7641 22.5 days as inclusive of SIL, but legally the SIL entitlement under Art. 95 is independent.

---

## No New Aspects Discovered

The LA 06-20 confirms and supplements existing sources. No new computation rules discovered that require new aspects. The double-counting distinction should be noted in:
- `salary-basis-inclusions` (Wave 2) — note that SIL and 13th month in the RA 7641 formula are a minimum floor, not a credit
- `nlrc-worksheet-format` (Wave 2) — enumerate all final pay components as separate line items

---

## Sources

- DOLE Labor Advisory No. 06, Series of 2020 (January 31, 2020)
- Full text available at: dole.gov.ph official website
- Analysis compiled from: emplawphil.wordpress.com, platonmartinez.com, laborlaw.ph, everythingatwork.com
