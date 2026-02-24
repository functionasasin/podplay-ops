# Wave 1 Analysis: nirc-income-tax

**Source**: NIRC Title II (Sec. 21–73), as amended by TRAIN Law (RA 10963) and CREATE Law (RA 11534)
**Forms**: BIR 1700, 1701, 1701A, 1702RT/EX/MX, 1701Q, 1601C/E/EQ, 2307
**Analysis Date**: 2026-02-24

---

## Overview

NIRC Title II governs income taxation of individuals and corporations in the Philippines. It is one of the most computation-heavy sections of Philippine law — every section from 24 through 57 contains explicit rate tables, thresholds, conditional rules, and multi-step formulas. This is the largest single domain for compliance automation opportunity.

---

## Domain 1: Individual Income Tax — Compensation Earners (BIR Form 1700)

### Governing Law
- NIRC Sec. 24(A): Graduated rates for citizens and resident aliens
- NIRC Sec. 79–83: Withholding tax on compensation
- TRAIN Law (RA 10963): Rate table effective January 1, 2023

### Computation Rules (Fully Deterministic)
The graduated rate table as of 2026:

| Taxable Income | Tax Due |
|---|---|
| ≤ ₱250,000 | 0% |
| ₱250,001–₱400,000 | 15% of excess over ₱250,000 |
| ₱400,001–₱800,000 | ₱22,500 + 20% of excess over ₱400,000 |
| ₱800,001–₱2,000,000 | ₱102,500 + 25% of excess over ₱800,000 |
| ₱2,000,001–₱8,000,000 | ₱402,500 + 30% of excess over ₱2,000,000 |
| Over ₱8,000,000 | ₱2,202,500 + 35% of excess over ₱8,000,000 |

Computation flow: gross compensation → statutory deductions (SSS/PhilHealth/Pag-IBIG) → non-taxable allowances (13th month pay, de minimis) → net taxable income → rate table → tax due → minus withheld taxes → balance payable or refundable.

### Who Currently Does This
- Employers with in-house HR/accounting compute monthly withholding via annualized method
- Individual employees file Form 1700 if not covered by substituted filing
- CPAs/accounting firms handle for mixed-income earners with Form 1701
- BIR provides a withholding tax calculator at bir.gov.ph/wtcalculator (basic tool, not a full return preparer)

### Market Size
- ~28 million registered individual taxpayers (PSA/BIR 2023)
- Subset requiring active annual filing: employees NOT under substituted filing, mixed-income earners, and self-employed
- Estimated 3–5 million active annual filers outside substituted filing
- The Ease of Paying Taxes Act (RA 11976, 2024) expanded compliance access but did not reduce the computation complexity

### Professional Fee Range
- Simple individual return (CPA prepared): ₱1,500–₱5,000
- Mixed-income return with bookkeeping: included in ₱5,000–₱30,000/month retainer packages
- Pain amplifier: errors in annualized withholding computation routinely cause year-end balances that surprise employees

### Computability Assessment
**Fully deterministic.** The rate table is statute-defined. Deductible items (SSS, PhilHealth, Pag-IBIG) are statutory and their contribution rates are fixed schedules. The 13th month pay exemption cap (₱90,000) is explicit. No judgment required for standard cases.

### Pain Indicators
- Employers routinely compute annualized withholding incorrectly → employees face unexpected balances at year-end
- Monthly payroll withholding (BIR Form 1601C) due by 10th/15th of following month — recurring monthly compliance burden for all employers
- BIR penalty: 25% surcharge + 12% annual interest on any underpayment
- Substituted filing confusion: many employees incorrectly believe they don't need to file when they do (mixed income, multiple employers, or tax due ≠ tax withheld)

---

## Domain 2: Individual Income Tax — Self-Employed / Professionals (BIR Form 1701/1701A)

### Governing Law
- NIRC Sec. 24(A): Graduated rates (same table as above)
- NIRC Sec. 24(A)(2)(b): 8% income tax option on gross sales/receipts
- NIRC Sec. 34(L): Optional Standard Deduction (OSD) — 40% of gross sales/receipts
- NIRC Sec. 74–79: Quarterly income tax (Form 1701Q)

### Computation Rules (Fully Deterministic)
Two distinct computation paths create a choice optimization problem:

**Path A — Graduated + Itemized Deduction:**
Gross receipts → deduct ordinary/necessary business expenses (substantiated) → net taxable income → graduated rate table → tax due → minus creditable withholding taxes (BIR Form 2307) → balance payable

**Path B — Graduated + OSD:**
Gross receipts → multiply by 40% for OSD → net taxable income = 60% of gross → graduated rate table → tax due → minus creditable withholding taxes → balance payable

**Path C — 8% Flat Rate (if gross ≤ ₱3M):**
(Gross receipts − ₱250,000) × 8% = tax due
No quarterly tax, filed only annually (Form 1701A)

The 8% vs. graduated choice is a pure arithmetic optimization: whichever yields lower tax wins. This is a classic compute-and-compare problem.

### Who Currently Does This
- CPAs, bookkeepers, or accounting firms for most registered professionals
- Self-filing via eBIRForms (common for tech-savvy freelancers)
- Monthly/quarterly filing adds complexity (1601EQ, 0619E, 2551Q for percentage tax if non-VAT)

### Market Size
- PSA 2023: ~1.8 million self-employed individuals registered with BIR
- Growing freelance/gig economy (Upwork, Fiverr, local platforms) — estimated 800K–1.5M active freelancers
- All registered sole proprietors + professionals: ~5.7 million registered business entities as of 2024

### Professional Fee Range
- Monthly bookkeeping + BIR compliance: ₱5,000–₱15,000/month for small businesses
- Annual income tax return preparation only: ₱3,000–₱10,000
- For gross income >₱3M: AFS + CPA certification required — minimum ₱25,000+ for audited FS

### Computability Assessment
**Fully deterministic for Paths B and C.** Path A requires judgment on which expenses are deductible, but the OSD election eliminates this entirely. The 8% vs. OSD vs. itemized optimization is pure arithmetic.

### Pain Indicators
- Monthly filing burden: 0619E (monthly EWT remittance), 2551Q (quarterly percentage tax), 1701Q (quarterly income tax)
- Many freelancers unaware of 8% option or make suboptimal choice
- BIR Form 2307 reconciliation (collecting certificates from all withholding agents) is laborious
- Quarterly installment computation: current quarter payment = (cumulative income × rate) − prior payments − creditable taxes

---

## Domain 3: Corporate Income Tax — RCIT vs. MCIT (BIR Form 1702)

### Governing Law
- NIRC Sec. 27(A): Regular Corporate Income Tax (RCIT) — 25% or 20%
- NIRC Sec. 27(E): Minimum Corporate Income Tax (MCIT) — 2% of gross income
- NIRC Sec. 28: Resident foreign corporations
- NIRC Sec. 34(L): OSD at 40% of gross income for corporations
- RA 11534 (CREATE Law): Rate reductions, incentives framework

### Computation Rules (Fully Deterministic with Branch Logic)
RCIT computation:
1. Gross revenues − COGS/COS = Gross income
2. Gross income − allowable deductions (itemized OR OSD at 40%) = Taxable net income
3. Taxable net income × 25% (or 20% if assets ≤ ₱100M AND taxable income ≤ ₱5M) = RCIT
4. Compare RCIT vs. MCIT (gross income × 2%)
5. Pay the higher amount
6. Deduct creditable withholding taxes → net tax payable

Key branch: From the 4th year of operations, always compute both RCIT and MCIT. Excess MCIT over RCIT is a tax credit carried forward up to 3 years — another tracking computation.

NOLCO: Net operating loss from prior years (up to 3 years) reducible from taxable income — requires year-by-year tracking.

### Who Currently Does This
- All domestic corporations and partnerships (~1.2–1.5M registered with SEC)
- Requires CPA certification for AFS if assets exceed threshold
- Large corporations have internal tax departments; SMEs outsource to CPA firms
- Quarterly installment payments (Form 1702Q) add 4 filing events per year per entity

### Market Size
- SEC: ~1M+ active domestic corporations
- All required to file annual 1702 + 3 quarterly 1702Qs = 4 filings/year
- Estimated 4 million filing events annually for corporations

### Professional Fee Range
- Monthly accounting retainer for small corp: ₱10,000–₱30,000/month
- Annual tax return preparation + AFS: ₱25,000–₱100,000
- Big 4 audit + tax for large companies: ₱500,000+
- Mid-size CPA firm for SME: ₱50,000–₱150,000/year

### Computability Assessment
**Mostly deterministic with some edge cases.** RCIT vs. MCIT comparison is fully algorithmic. OSD election eliminates deductibility judgment. Main uncertainty: classification of capital vs. ordinary assets, tax incentive applicability (PEZA, BOI), and NOLCO tracking across years — these are rule-based but complex.

### Pain Indicators
- RCIT vs. MCIT comparison must be done quarterly and annually
- MCIT excess carry-forward requires multi-year tracking spreadsheets
- NOLCO tracking across 3 years is a common source of errors
- Penalties: 25% surcharge + 12% interest on underpayments
- CREATE Law changes (2021) triggered widespread recomputation as rates changed mid-year

---

## Domain 4: Capital Gains Tax — Real Property (BIR Form 1706)

### Governing Law
- NIRC Sec. 24(D)(1): 6% CGT on higher of gross selling price or FMV

### Computation Rules (Fully Deterministic)
Tax = 6% × MAX(Gross Selling Price, Zonal Value, Assessed Value × Assessment Level)

Key sub-computations:
- Zonal values published by BIR per district — lookup from official BIR zonal value table
- Assessed value from LGU records × assessment level (per RA 7160)
- Documentary Stamp Tax (DST) also due at ₱15 per ₱1,000 of selling price or FMV (whichever is higher)

Principal residence exemption: if proceeds reinvested in new residence within 18 months, 6% is waived (conditional computation on partial vs. full reinvestment).

### Who Currently Does This
- Notaries, real estate lawyers, and brokers handle the BIR filing for sellers
- Real estate attorneys charge ₱10,000–₱50,000 for the full transaction
- BIR filing (Form 1706) must be done within 30 days of sale — time pressure creates urgency for professional engagement

### Market Size
- PSA: ~400,000–600,000 real property transactions annually (residential + commercial)
- All sales of capital assets (not business inventory) trigger CGT
- Growing with Philippines real estate market expansion

### Professional Fee Range
- Lawyer/broker handling CGT filing: ₱10,000–₱50,000 per transaction
- Sometimes bundled into full notarial/conveyancing service: ₱30,000–₱150,000

### Computability Assessment
**Fully deterministic once zonal value is known.** BIR maintains zonal value tables by district. The computation itself is trivial (6% × max of two values). The "professional value" comes from knowing the BIR rules and zonal lookup — not from complex judgment.

### Pain Indicators
- 30-day filing deadline creates urgency (late filing: 25% surcharge + 12% annual interest)
- Zonal values not always easily accessible or up-to-date in online form
- Sellers often unaware they must file; professionals gatekeep by owning the lookup process

---

## Domain 5: Capital Gains Tax — Shares of Stock (BIR Form 1707)

### Governing Law
- NIRC Sec. 24(C): 15% CGT on net capital gain from unlisted shares
- NIRC Sec. 127: Stock transaction tax (0.6% of gross selling price for listed shares)

### Computation Rules (Fully Deterministic)
**Unlisted shares:** Tax = 15% × (Selling Price − Cost Basis − Incidental Expenses)
**Listed shares (traded on PSE):** 0.6% stock transaction tax on gross selling price (no CGT, final at point of sale by broker)

### Who Currently Does This
- CPA firms for unlisted share sales (common in corporate restructuring, startup acquisitions)
- Stockbrokers automatically handle the 0.6% STT for listed shares
- Unlisted: within 30 days of sale, Form 1707; final return on 1707-A annually

### Market Size
- Unlisted share sales: primarily corporate events — smaller volume but higher value per transaction
- PSE: millions of transactions/year but STT is automated by brokers
- Focus opportunity: unlisted shares in SME/startup ecosystem

### Professional Fee Range
- CPA/lawyer for unlisted share sale filing: ₱5,000–₱30,000 per transaction

### Computability Assessment
**Fully deterministic.** Cost basis documentation is the main challenge (records of original purchase price), but the computation itself is straightforward arithmetic.

---

## Domain 6: Expanded Withholding Tax (EWT) — Monthly/Quarterly Compliance

### Governing Law
- NIRC Sec. 57–58: Withholding tax as collection mechanism
- BIR Revenue Regulations: Rate schedules per income category
- Forms: 1601C (compensation), 1601EQ/0619E (expanded), 1601FQ (final)

### Computation Rules (Fully Deterministic)
EWT rates are fixed by BIR regulation per income type:
- Rental of real property: 5%
- Professional fees (accounting, legal, medical): 10% (registered) / 15% (non-registered)
- Contractor services: 2%
- Suppliers of goods (Top Withholding Agents): 1%
- Suppliers of services (Top Withholding Agents): 2%

Monthly remittance: sum of (applicable rate × income payment net of VAT) per payee category

BIR Form 2307 must be issued to each payee — this certificate is then credited against the payee's income tax.

### Who Currently Does This
- Payroll/accounting departments of all businesses acting as withholding agents
- Small businesses outsource to bookkeepers or accounting firms
- Errors in withholding create problems for payees (under-withholding triggers back taxes)

### Market Size
- Every business that pays professionals, rent, or has more than ₱12M in gross revenues (Top Withholding Agent threshold) must file monthly
- Estimated 200,000–500,000 active withholding agents filing monthly/quarterly

### Professional Fee Range
- Included in bookkeeping retainer (₱5,000–₱30,000/month)
- Time-intensive: categorizing each payment, computing tax per category, reconciling with BIR

### Computability Assessment
**Fully deterministic.** Fixed rates per payment category. The challenge is categorization of payment type — once categorized, the computation is trivial.

### Pain Indicators
- Monthly filing deadline (10th/15th) creates monthly compliance burden
- Form 2307 issuance tracking is manual for many businesses
- Top Withholding Agent rules expanded scope in 2019 (RR 7-2019) — many businesses became TWAs without realizing it

---

## Domain 7: Quarterly Income Tax Installments (BIR Form 1701Q / 1702Q)

### Governing Law
- NIRC Sec. 74–77 (individuals) / Sec. 75–76 (corporations): Quarterly payment of income tax

### Computation Rules (Fully Deterministic)
For individuals (1701Q):
- Q1: Taxable income Jan–Mar × applicable rate
- Q2: Cumulative taxable income Jan–Jun × rate − Q1 payment
- Q3: Cumulative taxable income Jan–Sep × rate − Q1 − Q2 payments
- Annual: Full year computation with reconciliation

For corporations (1702Q):
- Same cumulative subtraction method
- Must also compare cumulative MCIT vs. cumulative RCIT each quarter

The cumulative subtraction method is simple arithmetic but error-prone when prior period payments and credits are incorrectly tracked.

### Who Currently Does This
- Self-employed individuals via their bookkeeper or CPA
- Corporations via internal accounting or outsourced CPA
- Common pain: forgot to account for prior quarterly payments in subsequent quarter

### Market Size
- All self-employed individuals + corporations filing quarterly = ~1.5–2M quarterly filing events per quarter = 6–8M filing events annually (just quarterly)

### Professional Fee Range
- Included in monthly/quarterly retainer
- Standalone quarterly filing: ₱1,000–₱5,000 per filing

### Computability Assessment
**Fully deterministic.** Pure arithmetic with prior period subtraction.

---

## Summary: Domains Found in nirc-income-tax

| Domain | Computability | Market Size | Moat Depth | Pain Level |
|--------|---------------|-------------|------------|------------|
| 1. Individual IT — Compensation (1700) | Fully deterministic | 3–5M annual filers | Low (substituted filing covers most) | Medium |
| 2. Individual IT — Self-Employed/Professional (1701/1701A) | Fully deterministic | 1.5–2M | High (CPA almost required) | High |
| 3. Corporate IT — RCIT vs MCIT (1702) | Mostly deterministic | 1M+ corps | Very high (CPA required) | High |
| 4. CGT — Real Property (1706) | Fully deterministic | 400–600K txns/year | High (lawyer/broker) | High |
| 5. CGT — Shares Unlisted (1707) | Fully deterministic | Smaller (corporate events) | High | Medium |
| 6. EWT — Expanded Withholding (1601EQ/0619E) | Fully deterministic | 200–500K agents filing monthly | Medium | High |
| 7. Quarterly IT Installments (1701Q/1702Q) | Fully deterministic | 1.5–2M quarterly | Medium | Medium |

### Top Candidates for Full Automation

1. **Individual IT — Self-Employed (1701/1701A)**: The 8% vs. OSD vs. itemized optimization is exactly the kind of multi-path arithmetic that software excels at. Growing freelancer economy creates demand. High CPA moat for what is fundamentally a decision tree + arithmetic.

2. **Corporate IT — RCIT vs. MCIT**: Every corporation must do this comparison quarterly and annually. MCIT carry-forward tracking and NOLCO are rule-based multi-year computations. Strong automation candidate.

3. **CGT — Real Property (1706)**: 6% × MAX(price, zonal) is trivial math. Professional moat comes from zonal value lookup. If zonal values are digitized (BIR has them), the entire computation including DST is fully automatable.

### Exclusion Note
Estate tax (BIR Form 1801) and donor's tax (BIR Form 1800) are excluded per loop rules — already covered by sibling loops. Donor's tax at 6% flat rate (Sec. 98–104) is noted as a highly deterministic sub-domain in scope for estate-related loops.

---

## New Aspects Discovered

The following sub-domains may warrant their own Wave 1 aspects but are sufficiently covered by existing aspects:
- **NOLCO computation tracking**: covered under nirc-income-tax (corporate)
- **Tax credit reconciliation (Form 2307)**: covered under bir-forms-catalog

No new aspects required beyond existing frontier.
