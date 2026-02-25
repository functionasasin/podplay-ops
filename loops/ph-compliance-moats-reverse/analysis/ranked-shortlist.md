# Philippine Compliance Automation Opportunities — Ranked Shortlist

**Produced by:** Wave 3 — ranked-shortlist
**Date:** 2026-02-25
**Source:** analysis/scored-domains.md (41 domains, post-professional-fees-validation scores)
**Methodology:** Opportunity Score = (Market × 0.25) + (Moat × 0.25) + (Computability × 0.30) + (Pain × 0.20)

---

## Executive Summary

This survey identified **41 automatable compliance domains** across Philippine tax law, labor law, corporate regulation, property law, and civil law. Every domain involves computation that statute or regulation defines precisely — yet Filipinos routinely pay ₱5,000–₱200,000+ for professionals to perform arithmetic the law already specifies. The inheritance engine proved this thesis in succession law. This survey finds **at least 15–20 domains where the identical pattern holds**, and identifies three priority candidates for dedicated product loops.

**The thesis holds across all seven categories.** 39 of 41 domains score ≥ 3.55. The top tier (score ≥ 4.50) contains four domains where the combination of market scale, professional moat depth, computation determinism, and process friction are all simultaneously maximized. The single clearest "inheritance engine equivalent" in non-tax law is the **RA 7641 Retirement Pay calculator** — where a 33% systematic underpayment from a known arithmetic error (using 15 days instead of the statutory 22.5 days) costs a 30-year employee at ₱35K/month exactly ₱301,875. Lawyers have charged ₱5K–₱25K to point this out.

**Excluded from this survey (already covered):**
- Estate tax computation — already in progress via `estate-tax-reverse`
- Inheritance/succession distribution — already in progress via `inheritance-reverse` + `inheritance-rust-forward`

---

## Master Ranked Table

| Rank | ID | Domain | Market | Moat | Comp | Pain | **Score** |
|------|----|--------|:------:|:----:|:----:|:----:|:---------:|
| 1 | E1 | SEC Compliance Navigator & Penalty Engine | 4 | 5 | 5 | 5 | **4.75** |
| 2 | G1 | Legal Interest Computation Engine | 5 | 4 | 5 | 4 | **4.55** |
| 3 | D3 | Final Pay Computation | 5 | 3 | 5 | 5 | **4.50** |
| 3 | F3 | RPVARA Tax Amnesty Calculator ⚠️ | 5 | 3 | 5 | 5 | **4.50** |
| 5 | A1 | Individual Self-Employed / Professional IT Optimizer | 5 | 3 | 5 | 4 | **4.30** |
| 5 | A3 | Capital Gains Tax — Real Property (BIR 1706) | 3 | 5 | 5 | 4 | **4.30** |
| 5 | B2 | BIR Penalty and Interest Calculator | 4 | 4 | 5 | 4 | **4.30** |
| 5 | B3 | Multi-Form Compliance Calendar Engine | 5 | 3 | 5 | 4 | **4.30** |
| 5 | B5 | Quarterly IT + Annual Reconciliation Engine | 5 | 3 | 5 | 4 | **4.30** |
| 5 | D1 | Multi-Factor Payroll Premium Computation | 5 | 3 | 5 | 4 | **4.30** |
| 5 | D5 | Separation Pay Calculator (Authorized Causes) | 4 | 4 | 5 | 4 | **4.30** |
| 5 | E4 | AFS Filing Threshold & Requirement Engine | 4 | 4 | 5 | 4 | **4.30** |
| 5 | E6 | OSH Staffing Requirements & Penalty Engine | 4 | 4 | 5 | 4 | **4.30** |
| 5 | F4 | Maceda Law Cash Surrender Value Calculator | 3 | 5 | 5 | 4 | **4.30** |
| 5 | G4 | Loss of Earning Capacity (LEC) Calculator | 3 | 5 | 5 | 4 | **4.30** |
| 16 | D4 | Retirement Pay Calculator (RA 7641 — 22.5 Days) | 3 | 4 | 5 | 5 | **4.25** |
| 17 | B4 | Withholding Tax Agent Compliance Engine | 5 | 3 | 4 | 5 | **4.20** |
| 17 | E3 | HARBOR Beneficial Ownership Filing Wizard | 4 | 4 | 4 | 5 | **4.20** |
| 19 | C4 | Documentary Stamp Tax (DST) Engine | 5 | 3 | 5 | 3 | **4.10** |
| 19 | F1 | Real Property Tax (RPT) + SEF Calculator | 5 | 3 | 5 | 3 | **4.10** |
| 21 | A4 | CGT — Unlisted Shares + DST | 3 | 4 | 5 | 4 | **4.05** |
| 21 | B1 | BIR Form Selection Navigator | 5 | 2 | 5 | 4 | **4.05** |
| 21 | B7 | eBIRForms / eFPS Filing Automation Bridge | 5 | 2 | 5 | 4 | **4.05** |
| 21 | C1 | Donor's Tax Calculator (BIR Form 1800) | 3 | 4 | 5 | 4 | **4.05** |
| 21 | G2 | Prescriptive Period Deadline Calculator | 3 | 4 | 5 | 4 | **4.05** |
| 26 | A2 | Corporate IT — RCIT vs. MCIT Engine | 4 | 4 | 4 | 4 | **4.00** |
| 26 | B6 | BIR Certificate (2307/2316) Tracker & Generator | 5 | 3 | 4 | 4 | **4.00** |
| 26 | D2 | 13th Month Pay Computation | 5 | 3 | 4 | 4 | **4.00** |
| 29 | G3 | Marital Property Liquidation Engine (ACP/CPG) | 2 | 5 | 4 | 5 | **3.95** |
| 30 | D6 | Back Wages Risk Assessment (Illegal Dismissal) | 3 | 5 | 3 | 5 | **3.90** |
| 31 | A5 | Individual IT — Compensation Earners (BIR 1700) | 5 | 2 | 5 | 3 | **3.85** |
| 31 | D7 | Mandatory Gov't Contributions Calculator (SSS/PhilHealth/Pag-IBIG) | 5 | 2 | 5 | 3 | **3.85** |
| 31 | D8 | Minimum Wage Compliance Checker | 5 | 2 | 5 | 3 | **3.85** |
| 31 | E2 | SEC Corporate Lifecycle Fee Engine | 3 | 4 | 5 | 3 | **3.85** |
| 35 | C2 | VAT Computation Engine | 4 | 3 | 4 | 4 | **3.75** |
| 35 | C5 | Property Transfer Tax Bundler | 3 | 4 | 4 | 4 | **3.75** |
| 37 | F2 | Local Business Tax + Business Permit Calculator | 5 | 3 | 3 | 4 | **3.70** |
| 38 | C3 | VAT Refund Claims Engine (NIRC Sec. 112) | 2 | 5 | 3 | 5 | **3.65** |
| 39 | E5 | Capital Increase / Decrease Filing Engine | 2 | 4 | 5 | 3 | **3.60** |
| 40 | D9 | SEnA Monetary Claims Calculator | 2 | 3 | 5 | 4 | **3.55** |
| 41 | G5 | Life Insurance CSV Verification | 4 | 2 | 4 | 3 | **3.30** |

⚠️ F3 has a hard deadline of **July 5, 2026** (≈4 months). Any tool not deployed by then is irrelevant.

---

## Domain Rationales

### RANK 1 — E1: SEC Compliance Navigator & Penalty Engine
**Score: 4.75 | Governing law: RA 11232 (Revised Corporation Code), SEC MC-028-2020, SEC MC-019-2016, SEC General Information Sheet Rules**

The SEC penalty matrix for non-compliant corporations is a pure decision tree from statutory inputs: corporate type (stock/non-stock/OPC), TIN, date of incorporation, list of unfiled annual reports (GIS, AFS, beneficial ownership). The output — compliance status, total accumulated penalties, ECIP eligibility flag, and cost comparison between standard reinstatement and ECIP — is fully deterministic arithmetic. No professional judgment is needed: RA 11232 Sec. 162 specifies the penalty schedule; SEC Memoranda specify the ECIP fee structure; the comparison is arithmetic. Yet corporations pay ₱120K–₱300K/year in corporate secretary retainers partly to avoid this anxiety, and ₱50K–₱200K+ per law firm remediation engagement when suspended. 117,885 corporations were suspended in a single February 2024 SEC batch order; 100K–200K are in various stages of non-compliance at any given time.

This is like inheritance but for corporations that don't know if they're legally dead. The "inheritance engine equivalent" is a compliance status engine: inputs are the corporation's TIN and filing history → outputs are current status (active / delinquent / suspended / revoked), itemized penalties per year of delinquency, ECIP vs. reinstatement petition comparison with total cost for each path, and an amnesty calendar if any SEC amnesty program is active. At 527K+ active corporations, even reaching 10% of the market represents 50K+ corporations that currently rely entirely on professional intermediaries to know their own compliance status.

---

### RANK 2 — G1: Legal Interest Computation Engine
**Score: 4.55 | Governing law: Civil Code Art. 2209–2212, BSP Circular 799 (2013), Nacar v. Gallery Frames G.R. No. 189871 (2013), Civil Code Art. 1169**

Philippine legal interest computation follows a precise statutory decision tree established by *Nacar v. Gallery Frames*: (1) determine obligation type (loan vs. forbearance vs. civil), (2) identify accrual date (demand for extra-judicial; filing for judicial), (3) apply 6% p.a. until finality, (4) apply 6% p.a. from finality on the total judgment principal+interest, (5) apply Art. 2212 compounding (interest on unpaid interest from finality). Every input is a factual date or amount; every computation step is arithmetic. Yet demand letters with Nacar interest computation command ₱5K–₱25K; collection suits run ₱20K–₱50K+; contingency fees average ~25% of recovery. Courts regularly receive incorrect interest computations submitted by lawyers who misapply the transition period or omit the Art. 2212 layer.

This is like inheritance but for any Philippine monetary claim — and uniquely, it functions as **cross-domain infrastructure** for every other domain in this survey. Retirement pay (D4), final pay (D3), back wages (D6), Maceda Law (F4), LEC (G4), BIR penalties (B2), and DOLE violations all ultimately resolve to a Philippine peso amount with statutory interest. A single Nacar engine, built once and callable as a shared service, multiplies the value of every other tool. The inputs are: obligation date, demand or filing date, judgment date, principal amount, obligation type → outputs are: pre-finality interest, post-finality interest, Art. 2212 layer (if applicable), total amount due on any target date.

---

### RANK 3 (tied) — D3: Final Pay Computation
**Score: 4.50 | Governing law: Labor Code Art. 95, 283, 287, RA 10653 (13th Month Pay), DOLE Labor Advisory 06-20**

DOLE Labor Advisory 06-20 enumerates the exact components of final pay and the 30-day release deadline: (1) unpaid wages through last day of work, (2) pro-rated 13th month pay (months worked in current year ÷ 12 × basic monthly salary), (3) cash conversion of unused SIL (unused SIL days × daily rate), (4) separation pay or retirement pay if applicable per governing formula, (5) return of any cash bond. Every component is a formula given factual inputs: start date, end date, separation type, unused SIL balance, salary history. The computation is a five-formula aggregation with no judgment calls. Yet small employers routinely omit SIL conversion and miscalculate pro-rated 13th month, generating NLRC filings. Employees, especially in BPO and retail where turnover is high, have no way to verify the employer's computation.

This is like inheritance but for leaving a job — with a dual-sided market that no existing tool captures fully. The employee-side value is verification: a worker with a clear computation of their statutory final pay has standing and information to dispute an incorrect release. The employer-side value is compliance: an SME that generates a defensible, itemized final pay computation before issuing it has documented good faith if challenged. The NLRC small claims process (mandatory SEnA mediation → NLRC arbitration) involves filing fees (free for employees) and lawyer costs (10% of award) that both parties are motivated to avoid. A tool that routes around this friction by providing correct computations upfront reduces NLRC docket load, employer liability exposure, and employee exploitation simultaneously.

---

### RANK 3 (tied) — F3: RPVARA Tax Amnesty Calculator ⚠️ DEADLINE: JULY 5, 2026
**Score: 4.50 | Governing law: RA 12001 (Real Property Valuation and Assessment Reform Act), BLGF Memorandum Circular 003-2025**

RA 12001 grants a one-time tax amnesty on accumulated RPT penalties, surcharges, and interest for delinquencies incurred before July 5, 2024. The computation is fully deterministic: amnesty amount = Σ(unpaid basic RPT + SEF per delinquent year) — with all penalties, surcharges, and interest waived. BLGF MC 003-2025 confirmed that no LGU ordinance is required; property owners can avail directly at their LGU Treasurer's office. The inputs are: property location, tax declaration number, years of delinquency, annual RPT and SEF amounts per year → outputs are: total principal owed, total penalties being waived (2%/month × N months per year, max 72% cap), net amnesty settlement amount, and LGU Treasurer contact. 2–5 million delinquent property accounts are eligible; most property owners cannot compute their own delinquency total across multiple billing cycles.

This is like inheritance but for clearing the tax cloud on a property before it blocks an estate settlement or title transfer. The time-urgency factor (July 5, 2026 deadline — approximately 4 months from the analysis date) creates a concentrated demand window that a fast tool deployment can capture. The professional moat is lower for individual homeowners (moat = 3) but remains deep for portfolio investors and estate cases with multiple delinquent properties (moat = 4–5). A free or low-cost amnesty calculator deployed in early 2026 would serve the individual homeowner segment that cannot and does not engage consultants — reaching the largest population of delinquent property owners before the amnesty window closes permanently.

---

### RANK 5 — A1: Individual Self-Employed / Professional IT Optimizer
**Score: 4.30 | Governing law: NIRC Sec. 24(A), RA 10963 (TRAIN Law), RA 11534 (CREATE Act), BIR Forms 1701/1701A/1701Q**

The individual income tax optimizer for self-employed professionals and business owners has a fully deterministic optimal path selection: compute tax under Option 1 (graduated rates 0%–35% with itemized or OSD deductions) versus Option 2 (8% flat on gross receipts above ₱250K exempt threshold), then return the minimum. The arithmetic is NIRC Sec. 24(A)(2)(b): under the 8% option, tax = 0.08 × (gross receipts − 250,000); under graduated rates, tax = (gross taxable income) × applicable bracket rate. All bracket thresholds and rates are tabulated in the statute. TRAIN Law 2018 changed the graduated structure; 2–4 million self-employed individuals are eligible for the 8% option yet many file under graduated rates paying 30–70% more tax than necessary.

This is like inheritance but for the annual income tax return — where choosing the wrong option costs the taxpayer thousands every year, permanently. CPAs charge ₱3K–₱10K for ITR preparation plus ₱5K–₱30K/month for bookkeeping that is required to support itemized deductions (but not the 8% option). The automation inputs are: gross receipts (or estimated gross receipts), nature of income (professional fees vs. business income), other income sources → outputs are: tax under each option, recommendation with savings differential, required quarterly installment schedule, and applicable BIR forms. The 8% option election must be made at the first quarterly filing of the year; a calculator that makes the optimal choice visible before April 15 prevents a full year of overpayment.

---

### RANK 5 — A3: Capital Gains Tax — Real Property (BIR Form 1706)
**Score: 4.30 | Governing law: NIRC Sec. 24(D)(1), RR No. 17-2003, BIR Form 1706, RMO 15-2003**

Capital gains tax on real property dispositions is the simplest possible tax computation: CGT = 6% × MAX(Gross Selling Price, Zonal Value, Assessed Value for tax purposes). The BIR RDO maintains zonal values by municipality and street; the notarized Deed of Absolute Sale states the GSP. The CGT is due within 30 days of the notarization date; failure triggers a 25% surcharge plus 12% annual interest (or 6% for micro/small taxpayers post-EOPT 2024). Yet sellers routinely pay ₱30K–₱150K+ for full conveyancing services that bundle CGT computation with title transfer, when the CGT itself is a single-line formula. The professional moat exists because the lawyer who drafts the deed controls the entire title transfer process, not because CGT computation is difficult.

This is like inheritance but for real estate sales — the CGT computation is free arithmetic bundled inside a ₱30K–₱150K service contract. A standalone CGT calculator that immediately shows the seller their tax liability (and the 30-day deadline) before they engage a lawyer disrupts the information asymmetry that makes the bundled service feel necessary. Inputs: property location, notarization date, gross selling price → outputs: zonal value lookup (or manual entry), CGT amount, DST amount (1.5% of consideration per NIRC Sec. 196), 30-day filing deadline, form list (BIR 1706 + CAR application). The tool does not replace the lawyer for title transfer mechanics but eliminates the "I have no idea what taxes I owe" anxiety that makes sellers accept opaque bundled pricing.

---

### RANK 5 — B2: BIR Penalty and Interest Calculator
**Score: 4.30 | Governing law: NIRC Sec. 248–249, RA 11976 (EOPT Act, effective January 22, 2024), RR No. 6-2024, RMO 7-2015**

BIR penalty computation became significantly more complex after the EOPT Act (RA 11976, effective January 22, 2024). The pre-EOPT single-rate system (25% surcharge + 12% annual interest for all) has been replaced by a two-tier system: micro/small taxpayers pay 10% surcharge + 6% interest; medium/large taxpayers retain 25% + 12%. The taxpayer must also determine which regime applies to which tax period (EOPT rates apply only from 2024 taxable year onwards; prior periods use old rates). Compromise penalty eligibility and rates are separate lookups from RMO 20-2007 + the revised schedule. All inputs are facts: taxpayer classification (from BIR records), tax type, tax period, amount due, filing date, payment date → outputs are surcharge amount, interest amount (computed to the day), compromise options if applicable, total amount to settle.

This is like inheritance but for facing a BIR deficiency assessment — the amount is arithmetic, but the taxpayer receives a demand letter in the mail without any computation breakdown, and is expected to accept or dispute it within 30 days. There is no official BIR penalty calculator. A tool that reproduces the BIR's computation (or flags discrepancies) from the taxpayer's own records empowers 570K+ penalty-assessment events per year to be independently verified. The EOPT complexity increase (multiple regime thresholds, two interest rates, year-of-violation dependency) ensures this domain will not simplify; it has become more valuable since the law passed.

---

### RANK 5 — B3: Multi-Form Compliance Calendar Engine
**Score: 4.30 | Governing law: NIRC (all filing deadlines), BIR Revenue Memoranda (deadline adjustments), RMO on eFPS enrollment**

The BIR compliance calendar is a pure function: taxpayer type + fiscal year end + eFPS/eBIRForms enrollment + VAT/percentage tax registration → complete set of filing deadlines for the year. NIRC specifies deadlines by form type (Sec. 74, Sec. 77, Sec. 114, Sec. 128, etc.); BIR Revenue Memoranda adjust deadlines for holidays and system outages; eFPS filers get 5-day extensions for most forms. The computation produces a calendar with form name, deadline, tax period covered, and filing channel. BIR discontinued printed tax calendars in 2026; no official digital calendar exists; the EOPT Act 2024 changed some form requirements without a corresponding official updated calendar.

This is like inheritance but for knowing what to file and when — the foundational anxiety of every Filipino taxpayer. CPA retainers (₱3K–₱10K/month) bundle calendar management with bookkeeping and filing; a taxpayer who knows exactly what forms are due on what dates can make informed decisions about which services to outsource. A compliance calendar engine built as a shared service also becomes the foundation for the full "Tax Infrastructure Stack" (B1–B7): form selection → calendar → penalty calculator → quarterly reconciliation → withholding engine → certificate tracker → filing bridge. No existing product covers the full integrated stack.

---

### RANK 5 — B5: Quarterly IT + Annual Reconciliation Engine
**Score: 4.30 | Governing law: NIRC Sec. 74–77, BIR Forms 1701Q/1702Q/1700/1701/1702, RMC No. 103-2022**

Philippine income tax uses a cumulative quarterly installment system: each quarterly return computes cumulative gross income year-to-date → cumulative tax due → minus prior quarterly payments = current installment due. The annual return then computes total annual tax → minus total quarterly payments → minus creditable withholding tax → net tax payable or overpayment (available for refund or carryover). The arithmetic is pure subtraction and rate table application; every number should reconcile across four quarterly returns and one annual return. Mismatches are the single largest source of BIR assessment letters — the BIR's system generates assessment notices when its records of quarterly payments don't match the taxpayer's annual return.

This is like inheritance but for closing the loop on a year of tax payments — the reconciliation function that makes the annual return defensible. The computation takes prior quarterly forms as inputs and produces the correct annual figures plus a comparison to what was filed, flagging any gaps. For 2.5–4.5 million reconciliation events per year, this is largely manual cross-referencing in the absence of integrated BIR tools that surface prior payments automatically. The engine also identifies overpayments that are routinely forfeited: taxpayers who overpay quarterly but don't claim refunds lose the overpayment permanently if they don't file a refund claim within 2 years (NIRC Sec. 204(C)).

---

### RANK 5 — D1: Multi-Factor Payroll Premium Computation
**Score: 4.30 | Governing law: Labor Code Art. 86–96, Wage Rationalization Act (RA 6727), DOLE Labor Advisories, Annual Proclamation List of Regular Holidays**

Philippine payroll premium pay is a rate matrix: every hour worked maps to exactly one combination of (regular time / overtime) × (regular day / rest day / special non-working day / regular holiday / special working holiday) × (with night shift differential or without), producing a specific multiplier from the Labor Code. Regular overtime = basic rate × 125%; rest day regular time = basic rate × 130%; rest day overtime = basic rate × 169%; regular holiday regular time = basic rate × 200%; double holiday (two regular holidays on one day) = basic rate × 300%. The matrix has no ambiguity — every combination has a statutory rate. The complexity is stacking: an employee who works overtime on a rest day that falls on a regular holiday during a night shift is owed a specific computable multiplier, not an estimate.

This is like inheritance but for payroll — where DOLE violations for premium pay underpayment are the most-cited labor compliance finding, yet the correct computation is fully tabulated in statute. The domain's commercial shape is a payroll rate verification layer rather than a full payroll execution system (which existing software handles). The use case for SMEs is a cross-check: given employee timekeeping records and the annual holiday proclamation, compute the correct premium pay total for each pay period. Errors concentrate in multi-factor stacking scenarios — the regular holiday that falls on a rest day, the NSD premium that applies to the OT hours already at 125%. These are the scenarios that generate DOLE complaints.

---

### RANK 5 — D5: Separation Pay Calculator (Authorized Causes)
**Score: 4.30 | Governing law: Labor Code Art. 283, DOLE Department Order No. 147-15**

Separation pay for authorized causes (installation of labor-saving devices, redundancy, retrenchment, closure, disease) is fully deterministic from two inputs: separation cause and years of service. The formula mapping is explicit in Art. 283: redundancy and installation of labor-saving devices = 1 month per year (or fraction thereof); retrenchment and closure not due to serious business losses = ½ month per year; disease = ½ month per year. Art. 283 also specifies that fractions of at least 6 months count as one full year. The key computation errors are: (1) using the wrong formula for the cause; (2) omitting cost-of-living allowances (COLA) that are integrated into the "salary" base per Supreme Court jurisprudence; (3) applying the 6-month rounding rule incorrectly.

This is like inheritance but for termination — the statute defines the fraction, and every peso of the difference is a potential NLRC claim. With 500K+ authorized separations annually (every MSME closure, every retrenchment retrenchment event), the market for a cause → formula → correct amount tool is large and recurring. Unlike illegal dismissal (D6, which requires judicial determination of whether the termination was lawful), authorized cause separation pay computation assumes the termination is valid and computes the correct entitlement from the cause. This is pure computation — no litigation strategy, no judgment about facts — just: cause → applicable fraction × salary × years.

---

### RANK 5 — E4: AFS Filing Threshold & Requirement Engine
**Score: 4.30 | Governing law: RA 11232 Sec. 175, SEC MC No. 003-2021, SEC MC No. 005-2023, eFAST portal rules**

The SEC's AFS filing requirements depend on a lookup across three dimensions: total assets (≥ ₱600K for reviewed FS, ≥ ₱3M for audited FS as of the 2023 threshold change), total liabilities (for OPCs), and fiscal year end (determines filing deadline by registration number suffix). The old ₱600K threshold for full audit has been revised to ₱3M, meaning thousands of small corporations that previously needed audited financial statements (₱30K–₱300K/year) now qualify only for reviewed financial statements (₱15K–₱50K). The threshold change was poorly publicized; CPAs with existing audit clients have a financial incentive not to proactively inform clients of the savings. Filing deadlines vary by last digit of SEC registration number — a further complexity layer.

This is like inheritance but for knowing whether your corporation needs a ₱300K CPA audit or a ₱50K review — information that is available in the SEC Memorandum Circular but widely unacted upon. A threshold engine takes: total assets, total liabilities, fiscal year end, SEC registration number → outputs: required level of assurance (compilation / reviewed FS / audited FS), filing deadline, applicable SEC Memorandum Circular, estimated cost savings versus prior requirement. The auditor's conflict of interest (they earn more for audits than reviews) means this information will not flow to clients through normal professional channels.

---

### RANK 5 — E6: OSH Staffing Requirements & Penalty Engine
**Score: 4.30 | Governing law: RA 11058 (OSH Law), DOLE Department Order No. 198-18, DOLE Department Order No. 252-25**

Occupational Safety and Health staffing requirements are a pure lookup table by establishment size and industry hazard classification: micro (1–9 workers) and small (10–99) establishments require a trained first-aider; medium (100–199) require a full-time safety officer (Grade 2); large (200–999) require a full-time safety officer plus a safety and health committee; establishments ≥ 1,000 require a certified safety practitioner. DO 252-25 (May 2025) updated the requirements and cost ceilings. The penalty schedule for non-compliance is a tiered arithmetic: first offense, second offense, third offense, with daily accrual after the notice period. All inputs are facts: number of workers, industry classification (per PSIC), current safety staffing → outputs: required staffing configuration, compliance gap, daily penalty rate, total accrued penalty.

This is like inheritance but for OSH compliance — a domain where 1.2M+ establishments must comply, only 574 DOLE inspectors exist to enforce, and 20% of inspected establishments fail. The DO 252-25 change in May 2025 reset compliance obligations for many establishments whose prior configurations no longer meet requirements. A non-compliant establishment accumulates daily fines starting from the notice date; the tool that helps an employer compute their exposure before DOLE visits (and compare it to the cost of compliance) disrupts a ₱15K–₱50K initial assessment + ₱5K–₱25K/month ongoing OSH consulting market.

---

### RANK 5 — F4: Maceda Law Cash Surrender Value Calculator
**Score: 4.30 | Governing law: RA 6552 (Maceda Law) Sec. 3–6, Supreme Court decisions Solid Homes v. CA (2008)**

RA 6552 Sec. 3(b) establishes a graduated statutory floor for cash surrender value (CSV) refunds: buyers who have paid at least 2 years of installments are entitled to a refund of 50% of total payments made, plus 5% per additional year of installment payments, capped at 90%. The formula is a single table lookup: years completed → percentage → CSV = percentage × total payments made. Sec. 6 adds that any cancellation not made through notarial act is void — meaning text/email cancellations used by many developers are legally ineffective, and buyers who accepted CSV refunds under void cancellations may still own their contracts. The Supreme Court has called this rule "unequivocal for over three decades."

This is like inheritance but for real estate installment buyers — and in fact has the clearest parallel to the inheritance engine thesis of any domain in this survey: a simple statutory formula (one table lookup), a large professional moat (₱15K–₱50K+ lawyer acceptance fee for DHSUD/HSAC complaint), systematic victim underpayment (DHSUD's own FAQ confirms buyers accept below-floor refunds), and a regulator that documents the problem without fixing it. The computation inputs are: total payments made, number of years of installment payments → outputs: statutory CSV percentage, minimum CSV amount the buyer is entitled to, whether the cancellation was properly made by notarial act (yes/no flag with legal consequence), and the 30/60-day grace period formula (1 month per year of installment paid, with proper notice requirement per Sec. 3(b)).

---

### RANK 5 — G4: Loss of Earning Capacity (LEC) Calculator
**Score: 4.30 | Governing law: SC-established jurisprudence: Villa Rey Transit v. Court of Appeals (1970), People v. Quilaton (1990), Heirs of Ochoa v. G&S Transport Corporation (2020)**

The Philippine Supreme Court has established a single formula for loss of earning capacity in personal injury and wrongful death cases: LEC = (2/3 × (80 − age at death/injury)) × (gross annual income × 50%). The formula has three multiplications, takes four seconds of arithmetic, and has been in Philippine jurisprudence since 1970. Yet personal injury lawyers charge 20–30% contingency on LEC recoveries that range from ₱100K–₱2M+. Accident victims routinely accept quick settlements at 20–40% of their statutory entitlement because they do not know the formula. The CTPL (Compulsory Third Party Liability) no-fault maximum of ₱100K is frequently accepted as full settlement when the victim's actual LEC exceeds ₱500K.

This is like inheritance but for accident victims — the widest gap in this entire survey between the simplicity of the computation (four seconds of arithmetic) and the professional fee it commands (20–30% of recovery). A tool that displays to any Filipino: "you are [age], your annual income is ₱[X], your statutory minimum claim for total incapacity is ₱[LEC]" — immediately before they negotiate with an insurance adjuster or sign a settlement release — prevents the systematic underpayment that affects hundreds of thousands of accident victims per year. Inputs: age, gross annual income, nature of incapacity (total vs. partial, permanent vs. temporary) → outputs: computed LEC using SC formula, comparison to CTPL no-fault limit, suggested opening settlement position with legal basis citation.

---

### RANK 16 — D4: Retirement Pay Calculator (RA 7641 — 22.5 Days)
**Score: 4.25 | Governing law: RA 7641, Labor Code Art. 287, SC case Elegir v. PAL**

RA 7641's retirement pay formula is: Monthly Rate ÷ 26 days × 22.5 days × years of service. The 22.5-day multiplier is derived from: 15 days (½ month salary) + 2.5 days (1/12 of 13th month) + 5 days (SIL cash equivalent) — all mandated by statute. The systematic error documented by multiple independent Philippine HR and legal sources: HR professionals routinely use 15 days instead of 22.5 days, underpaying by 33%. A 30-year employee at ₱35,000/month receives ₱607,500 under the wrong formula but ₱909,375 under the correct formula — a ₱301,875 underpayment from pure arithmetic error. The Supreme Court affirmed the 22.5-day formula in *Elegir v. Philippine Airlines*; it has been settled law since 1992. The error persists because HR departments learned the wrong formula and no tool corrects them.

This is like inheritance but for the retirement settlement — a single formula change that increases a 30-year employee's payout by 50% of a year's salary. The computation inputs are: monthly salary, years of service, any applicable CBA retirement benefits (compared to statutory minimum, whichever is higher) → outputs: daily rate, 22.5-day formula applied, total retirement pay, comparison to any applicable company retirement plan. The moat (moat = 4) is real: NLRC attorney's fees run 10% of the award, and labor lawyers charge ₱5K–₱25K per retirement pay computation engagement — for arithmetic a calculator handles in one second.

---

### RANK 17 — B4: Withholding Tax Agent Compliance Engine
**Score: 4.20 | Governing law: NIRC Sec. 57–58, 78–83; RR No. 2-98 (Expanded Withholding Tax); RR No. 11-18; BIR Forms 1601-C, 1601-EQ, 1604-CF, 1604-E**

Employer withholding tax compliance involves mapping every payment to one of 40+ EWT rate categories (RR No. 2-98 as amended): professional fees (15% if top-earning / 10% otherwise), rent (5%), contractor payments (2%), etc. — plus the separate withholding tax on compensation (graduated rates from tax tables). Each payment requires: payee classification → applicable rate → monthly accrual → quarterly alphalist generation → BIR Form 1601-EQ/1601-EW submission → annual Form 1604-CF/1604-E reconciliation. The rate tables and classification rules are fully statutory. The pain is maximum (moat = 3, pain = 5) because mistakes generate BIR cross-reference assessments when payees report income that doesn't match the payor's alphalist.

This is like inheritance but for employer tax administration — the highest-friction component of monthly BIR compliance, affecting 1.24M employer-businesses that must classify every vendor payment into a 40-item rate lookup table every month. An EWT compliance engine takes: payment type (text or category selection) + payee VAT status + amount → correct withholding rate + applicable form + due date + alphalist entry format. Bundled into a monthly payment pre-check, this eliminates the most common source of BIR assessment letters for compliant businesses: missing or wrong withholding rates on specific payment categories.

---

### RANK 17 — E3: HARBOR Beneficial Ownership Filing Wizard
**Score: 4.20 | Governing law: RA 11232 Sec. 15, SEC MC No. 001-2025, Anti-Money Laundering Act (RA 9160 as amended), HARBOR system launched January 30, 2026**

The HARBOR (Harmonized Beneficial Ownership Registry) system launched January 30, 2026, requiring all registered corporations to separately report beneficial owners — defined as natural persons who ultimately own or control 25%+ of economic interest or voting rights. The beneficial ownership percentage computation uses matrix multiplication through ownership chains: a Person owning 60% of Corp A, which owns 80% of Corp B = 48% effective beneficial ownership of Corp B. The 7-day reporting window for changes is the most aggressive compliance deadline in Philippine corporate law. Penalties range from ₱50K–₱1M for non-disclosure; ₱1M + 5-year officer disqualification for false declarations.

This is like inheritance but for corporate ownership structures — where the computation is matrix multiplication down an ownership chain, and the stakes (₱1M penalty + officer disqualification) are severe for what is fundamentally a chain-of-ownership arithmetic exercise. With 527K+ active corporations in the initial HARBOR filing sprint (launched January 30, 2026), there is concentrated demand for a tool that traces multi-layer ownership → computes effective beneficial ownership percentages → generates the required HARBOR filing data. The 7-day change window means any M&A, share transfer, or corporate restructuring immediately triggers a new HARBOR filing obligation, making this a recurring compliance event rather than a one-time registration.

---

### RANK 19 — C4: Documentary Stamp Tax (DST) Engine
**Score: 4.10 | Governing law: NIRC Title VII (Sec. 173–201), BIR Form 2000-OT, BIR RMO 15-2003**

DST is imposed on every taxable document at rates that vary by document type, as specified in NIRC Sec. 175–201: deeds of sale of real property (1.5% of consideration); original issuance of shares of stock (₱1.00 per ₱200 par value); assignment/transfer of shares (₱0.75 per ₱200 of par value); debt instruments (₱1.50 per ₱200); lease agreements (₱3.00 per first ₱2,000 + ₱1.00 per ₱1,000 thereafter); insurance policies (varies by type). The DST rate schedule is a pure lookup table: document type → applicable section → rate formula → tax due. Monthly DST is consolidated on BIR Form 2000 (for all taxable documents executed in the month) with a 5-day deadline.

This is like inheritance but for every Philippine contract and instrument — a per-transaction tax that applies to private loan agreements, lease contracts, share transfers, and real estate sales that most parties execute without computing or paying DST. Private loans between individuals (the largest latent non-compliance population) routinely omit DST; an unstamped document is inadmissible as evidence in any Philippine court proceeding per NIRC Sec. 201. A DST engine that computes the tax on any described instrument and flags inadmissibility risk for unstamped documents creates compliance demand from a market (private lenders, landlords, small businesses) that currently doesn't know it has a problem.

---

### RANK 19 — F1: Real Property Tax (RPT) + SEF Calculator
**Score: 4.10 | Governing law: RA 7160 (Local Government Code) Sec. 218–260, RA 12001 (RPVARA) for valuation reform**

RPT computation follows a two-step formula: (1) Assessed Value = Schedule of Market Values (FMV) × Assessment Level (30% residential, 50% commercial, 80% industrial for basic structure, with graduated levels for improvements), then (2) RPT = Assessed Value × Tax Rate (1% for provinces, 2% for cities/municipalities within Metro Manila for basic RPT; 1% additional SEF levy). Delinquency penalty = 2%/month of unpaid basic tax, capped at 72% maximum penalty. All parameters are defined in RA 7160 and the LGU's revenue code; the LGU assessor computes but does not explain. Property owners receive a tax declaration and a bill but rarely understand the assessment level applied to their property or whether the Schedule of Market Values is current.

This is like inheritance but for understanding your annual property tax — with 35–45 million real property units generating ₱113.4 billion in annual RPT, this is the most widespread computation in Philippine taxation. The tool's primary value is transparency (helping property owners understand their assessment) and delinquency analytics (computing accumulated penalties and comparing amnesty vs. payment options). The LGU database dependency (1,600+ LGUs with different rates and Schedules of Market Values) is the technical moat that makes this domain defensible: the entity that maintains the LGU rate database owns a structural data advantage.

---

### RANK 21 — A4: CGT — Unlisted Shares + DST
**Score: 4.05 | Governing law: NIRC Sec. 24(C), 27(D)(2), 127, 175; BIR Form 1707; RR No. 6-2008**

CGT on transfers of unlisted shares = 15% × net capital gain (Selling Price − Cost Basis per NIRC Sec. 24(C) post-TRAIN). DST on the same transfer = ceiling(par value or issue price ÷ 200) × ₱1.50 per NIRC Sec. 175. Both are fully deterministic given three inputs: sale price, cost basis, and par/issue value of shares. The combination creates a mandatory computation event for every private company share transfer in the Philippines — from simple SME share sales to complex restructurings. NIRC Sec. 127 imposes a separate stock transaction tax (6/10 of 1%) on listed shares, but unlisted transfers (the majority by count) go through CGT + DST.

This is like inheritance but for selling shares in a private company. The inputs are: number of shares transferred, selling price per share, original cost basis, par value or issue price per share → outputs: CGT payable, DST payable, applicable forms (BIR 1707 + 2000), filing deadline (within 30 days of transfer). Many private company share transfers — especially in founder secondary sales, management buyouts, and family business succession — involve CPAs or lawyers charging ₱3K–₱50K+ for what is two-line arithmetic once the inputs are assembled.

---

### RANK 21 — B1: BIR Form Selection Navigator
**Score: 4.05 | Governing law: BIR Revenue Regulations and Revenue Memoranda establishing each form**

The BIR maintains 250+ forms; the correct form for any filing depends on: taxpayer type (individual / corporation / partnership / estate / trust), income source type (compensation / business / profession / capital gains), filing period type (quarterly / annual / withholding / one-time transaction), and special status flags (eFPS large taxpayer / eBIRForms user / new registrant). The EOPT Act 2024 changed several form requirements (e.g., the replacement of quarterly 1701Q with a new format for OSD vs. itemized deduction taxpayers). Filing on the wrong form is a curable but penalized error — the BIR treats it as a late filing if the correct form is not resubmitted within the period.

This is like inheritance but for not knowing where to start — the navigational anxiety before any Philippine tax filing begins. A form selection navigator takes: taxpayer type + income type + filing trigger → outputs: correct BIR form number, filing period, applicable deadlines, filing channel (eFPS vs. eBIRForms), and links to the official form. This is infrastructure for the full Tax Infrastructure Stack (B1–B7); building this as a standalone chatbot or decision-tree tool reduces the most basic compliance confusion for 5.7M registered taxpayers who don't have a CPA on retainer.

---

### RANK 21 — B7: eBIRForms / eFPS Filing Automation Bridge
**Score: 4.05 | Governing law: BIR Revenue Regulations governing eFPS and eBIRForms; EOPT Act 2024 mandate**

eBIRForms is the legacy offline Java application that most non-eFPS taxpayers use for BIR filing; eFPS is the online portal for large taxpayers. Both require manual data entry with no import from accounting software, making every filing a re-keying exercise. The automation opportunity is a data bridge: extract financial data from accounting systems (QuickBooks, Xero, spreadsheets) → populate BIR form fields → generate the submission file in the required format. The computation is mechanical field mapping; the challenge is maintaining the mapping as BIR form versions change (which they do frequently). Taxumo and JuanTax partially address this market but leave gaps in non-standard forms (CGT, DST, estate, donor's) that affect large transaction markets.

This is like inheritance but for the filing interface itself — the last-mile friction that converts correct computations into submitted forms. Lower priority as a standalone opportunity given existing competition (Taxumo, JuanTax) but high priority as the delivery layer for any of the computation tools in this survey. Building a "computation engine → BIR form population → eFPS/eBIRForms submission" pipeline on top of the other B-category tools creates the integrated compliance platform that no existing product currently provides.

---

### RANK 21 — C1: Donor's Tax Calculator (BIR Form 1800)
**Score: 4.05 | Governing law: NIRC Sec. 98–104 (post-TRAIN), BIR Form 1800**

Post-TRAIN (from 2018), donor's tax is a single flat rate: 6% of the net gift amount exceeding ₱250,000 in a calendar year from the same donor. The computation is: donor's tax = 0.06 × MAX(0, cumulative net gifts in year − 250,000). The exemptions are enumerated: gifts to national government, gifts to educational/charitable institutions, gifts between parents and children under Art. 1080 (subject to conditions), gifts in contemplation of death (which become part of the gross estate). These exemptions are binary flags, not judgment calls. The complexity is the 30-day filing deadline from the date of donation, the requirement to aggregate all gifts in a calendar year from the same donor, and the BIR Certificate Authorizing Registration (CAR) requirement for real property donations.

This is like inheritance but for property donations during life — where Filipinos routinely confuse donation with estate transfer and pay ₱20K–₱80K+ in professional fees (lawyer + notarization at 1–2% of property value) for what is a single rate-times-value formula. A donor's tax calculator disrupts the confusion layer: inputs are property type, fair market value, donor's prior gifts in the year, donor-donee relationship → outputs: net gift amount, tax due (or ₱0 if exempt), 30-day filing deadline, and CAR application checklist.

---

### RANK 21 — G2: Prescriptive Period Deadline Calculator
**Score: 4.05 | Governing law: Civil Code Art. 1139–1155, Code of Civil Procedure, Special laws governing specific claims**

Philippine civil prescriptive periods are fully tabulated in the Civil Code: written contracts = 10 years (Art. 1144); oral contracts = 6 years (Art. 1145); quasi-delict = 4 years (Art. 1146); quasi-contract = 6 years (Art. 1145). Interruption events are binary: a written extrajudicial demand interrupts and restarts the period (Art. 1155); an oral demand does not. The lookup is: claim type → base period → interruption events (with dates) → remaining days until prescription. Special laws layer additional periods: labor claims (3 years from accrual per Art. 291); NLRC cases (4 years for money claims per Art. 306 vs. 3 years for wage claims); tax assessments (3 years from filing, 10 years from fraud per NIRC Sec. 203). All are rule lookups, not judgment calls.

This is like inheritance but for knowing whether you've already lost your right to sue — a binary determination that lawyers charge ₱2K–₱5K per opinion to provide despite being a statutory table lookup. A prescriptive period calculator prevents two categories of harm: (1) creditors and victims who let claims expire without knowing the deadline, and (2) debtors and defendants who don't raise prescription as a defense because neither they nor their lawyers computed the calendar. The Art. 1155 mechanism (written demand restarts the clock) is systematically unknown — many plaintiffs who sent written demands extend their right to file without knowing it.

---

### RANK 26 — A2: Corporate IT — RCIT vs. MCIT Engine
**Score: 4.00 | Governing law: NIRC Sec. 27, RA 11534 (CREATE Act 2021), BIR Form 1702-RT**

Regular corporate income tax (RCIT) = 25% of net taxable income (20% for small corporations with net taxable income ≤ ₱5M and total assets ≤ ₱100M). Minimum corporate income tax (MCIT) = 2% of gross income (applicable from the 4th year of operations onwards). The corporation pays the higher of the two: MAX(RCIT, MCIT). Excess MCIT over RCIT in any year carries forward for 3 years as a credit against future RCIT. CREATE Act added PEZA/BOI incentive regimes (5% GIT for PEZA-registered exporters under old rules; tiered ITH for new registrants) that require classification judgment, which limits computability for incentivized entities. Non-incentivized domestic corporations are fully deterministic.

This is like inheritance but for the corporate annual income tax decision — where MCIT traps apply in loss years, carryforward tracking is manual, and the PEZA/BOI incentive overlay creates a classification question that, once resolved, reduces back to arithmetic. For the 527K+ active corporations without special incentives, RCIT vs. MCIT is a MAX() function with 3-year carryforward tracking — pure computation. Corporate CPAs charge ₱10K–₱30K/month retainers that include this as bundled service; the tool disaggregates the MCIT/RCIT computation as a standalone annual diagnostic.

---

### RANK 26 — B6: BIR Certificate (2307/2316) Tracker & Generator
**Score: 4.00 | Governing law: NIRC Sec. 58(B), RR No. 2-98; BIR Forms 2307 (creditable withholding) and 2316 (compensation)**

BIR Form 2307 (Certificate of Creditable Tax Withheld at Source) is issued by withholding agents to payees for every payment subject to EWT. Form 2316 (Certificate of Compensation Payment/Tax Withheld) is issued annually by employers to all employees. Both certificates must be aggregated by the recipient to claim tax credits on the annual income tax return. The computation is mechanical: each 2307 shows income amount × withholding rate = tax withheld; the annual ITR aggregates all 2307s as creditable taxes. The pain is data assembly: payees may receive 2307s from dozens of clients; missing certificates create unclaimed credits; BIR cross-reference creates assessment notices when 2307 totals don't match the alphalist.

This is like inheritance but for tax credits — where unrecorded 2307s mean unclaimed refunds, and missing certificates mean overpaid income tax that the BIR keeps permanently if not claimed within 2 years. A certificate tracker creates a digital repository for 2307/2316 images, extracts withheld amounts, and aggregates the total creditable tax for the annual ITR — replacing the shoe box of paper certificates that 10–28 million Filipinos currently maintain as their only record.

---

### RANK 26 — D2: 13th Month Pay Computation
**Score: 4.00 | Governing law: PD 851 (13th Month Pay Law), RA 10653, DOLE 13th Month Pay Guidelines**

13th month pay = total basic salary earned during the year ÷ 12. For employees who worked the full year at a constant salary, this equals one month's basic salary. For new hires, resigned employees, or those with variable months, the pro-rated formula = (sum of monthly basic salary for months with at least some work) ÷ 12. RA 10653 set the tax exemption threshold at ₱90,000 (combined with other benefits). The systematic error: including allowances, overtime pay, or commission in "basic salary" inflates the base for computation purposes; excluding months where the employee worked even one day underpays. DOLE defines "basic salary" as excluding overtime, holiday pay, and allowances — but many employers compute on gross pay.

This is like inheritance but for the annual December payroll computation — where the definitional confusion around "basic salary" creates systematic errors in 1M+ employer payroll computations every November. The tool's primary value is standardizing what goes into the base: inputs are each month's basic salary (excluding allowances), employment dates for partial years → outputs: total basic salary earned, ÷ 12 result, tax-exempt portion check, and pro-ration formula applied for partial-year employees.

---

### RANK 29 — G3: Marital Property Liquidation Engine (ACP/CPG)
**Score: 3.95 | Governing law: Family Code (EO 209) Art. 75–97 (ACP), Art. 105–133 (CPG), Art. 147–148 (void/voidable marriages)**

Marital property liquidation under the Absolute Community of Property (ACP) or Conjugal Partnership of Gains (CPG) regime follows a deterministic algorithm once assets are classified: (1) catalog all property by acquisition date and source; (2) classify as community/conjugal or exclusive based on Art. 91–93 (ACP) or Art. 117–120 (CPG) rules; (3) compute gross community/conjugal assets; (4) deduct community/conjugal debts and expenses; (5) divide net remainder 50/50 between spouses. Art. 118's installment rule (property partly paid before marriage, partly during = ownership proportional to payment timing) and Art. 120's improvement rule (improvements to separate property during marriage = reimbursement computation) are rule-defined though complex. The judgment element is initial asset classification when documentation is incomplete.

This is like inheritance but for property division at the end of a marriage — where lawyers charge ₱100K–₱600K for what is fundamentally a classification exercise followed by a two-way accounting split. The liquidation algorithm, given clean asset documentation, produces a deterministic result. The tool's market is narrower (65K–75K marital liquidation events per year from death + annulment) than the mass-market domains, making it better positioned as a specialist practice tool for family law attorneys and estate settlement professionals than as a consumer product. The Art. 103 6-month deadline (joint ownership becomes void if assets are not liquidated within 6 months of dissolution) creates urgency that drives engagement.

---

### RANK 30 — D6: Back Wages Risk Assessment (Illegal Dismissal)
**Score: 3.90 | Governing law: Labor Code Art. 294–299, NLRC Rules of Procedure, SC jurisprudence on back wages computation**

Given a finding of illegal dismissal (a judicial determination), back wages computation is fully deterministic: full back wages from dismissal date to reinstatement (or finality if separation in lieu of reinstatement is ordered) + 13th month pay for each year of back wage period + SIL conversion for each year + separation pay (1 month per year of service) if reinstatement is not feasible. 6% annual interest accrues from NLRC decision finality. The challenge is that the illegal dismissal determination itself requires judicial judgment — the tool cannot determine whether a dismissal was illegal, only compute the exposure if it was. This limits the tool to a pre-litigation risk modeling function for employers (quantify maximum liability before deciding whether to settle or litigate) rather than a self-service compliance tool.

This is like inheritance but for employment litigation exposure — specifically, a "worst-case scenario" calculator for employers who have terminated employees and face NLRC proceedings. Inputs: dismissal date, monthly salary, years of service, current date → outputs: back wages accumulated to date, projected total if case goes to decision + appeal (3–5 years), interest accumulation, total worst-case exposure including attorney's fees and SC fees. The employer's decision to settle vs. litigate hinges on this number, yet 100K–150K NLRC cases per year are litigated without a defensible exposure computation on either side.

---

### RANK 31 — A5: Individual IT — Compensation Earners (BIR 1700)
**Score: 3.85 | Governing law: NIRC Sec. 24(A), BIR Form 1700, RR No. 11-2018**

Compensation earners who are not substituted filers (i.e., employees with multiple employers, or whose tax withheld by the employer does not match their actual tax liability) must file BIR Form 1700. The computation is graduated rate table application on net taxable compensation income. The primary pain is not the computation (which is mechanical) but the reconciliation of multiple 2316 certificates from multiple employers into a correct annual ITR. The low moat score (2) reflects that employer-side substituted filing handles the computation for the majority of compensation earners; the remaining 3–5 million non-substituted filers face a moderate compliance burden.

This is like inheritance but for the salary earner who took a second job — where the combination of two income streams creates a filing obligation that neither employer handles. Lower standalone priority than other domains because the computation is genuinely simple once the 2316s are assembled.

---

### RANK 31 — D7: Mandatory Gov't Contributions Calculator (SSS/PhilHealth/Pag-IBIG)
**Score: 3.85 | Governing law: RA 11199 (SSS), RA 11223 (UHC / PhilHealth), RA 9679 (Pag-IBIG), applicable Circulars**

Mandatory contribution computation: SSS uses a 31-bracket lookup table (employee 5% / employer 10% per RA 11199 rates, 2023 update); PhilHealth is 5% of monthly basic salary with floor (₱450/month combined) and ceiling (₱2,250/month combined) per UHC Act; Pag-IBIG is 2% each up to ₱100/month max per member per RA 9679. All three are statutory rate tables with explicit floor/ceiling rules. The rates change periodically (PhilHealth scheduled annual increases; SSS periodic bracket adjustments). The low moat score (2) reflects that many free online calculators already compute SSS/PhilHealth/Pag-IBIG contributions; the residual opportunity is in the employer-side compliance audit (correct bracket for each employee, automated update when rates change).

This is like inheritance but for payroll deductions — fully computable but largely already addressed by free tools. Standalone opportunity is limited; value is highest as part of an integrated payroll compliance platform that cross-references all three contributions with DOLE premium pay.

---

### RANK 31 — D8: Minimum Wage Compliance Checker
**Score: 3.85 | Governing law: RA 6727 (Wage Rationalization Act), DOLE Regional Wage Orders, NATRIP by region/sector/size**

Minimum wage rates are specified in DOLE Regional Wage Orders by: (1) region (17 regions with separate wage boards), (2) industry sector (agriculture/non-agriculture; retail/service, others), (3) establishment size (micro/small/medium/large, with different exemptions). The applicable rate is a lookup from the wage order effective date; the compliance check is: actual daily rate ≥ applicable minimum wage. The low moat score (2) reflects that DOLE publishes wage orders publicly and some databases exist; the primary complexity is aggregating 17 regional wage orders with amendment history across multiple effective dates. The tool opportunity is in multi-site employer compliance (different rates apply at different branches) and in detecting misclassification (agricultural vs. non-agricultural workers have different rates).

This is like inheritance but for knowing what you must pay your workers — where the computation is trivial but the rate database is the valuable asset. The tool's defensibility comes from maintaining a comprehensive, up-to-date regional wage order database, not from algorithmic sophistication.

---

### RANK 31 — E2: SEC Corporate Lifecycle Fee Engine
**Score: 3.85 | Governing law: RA 11232, SEC MC No. 024-2020 (fee schedule), SEC eSPARC fee structure**

SEC registration and amendment fees are formula-driven: incorporation = 1/5 of 1% of authorized capital stock (minimum ₱1,000); capital increase = 1/5 of 1% of the increment only (minimum ₱1,000); GIS = ₱200 per filing; AFS = scaled by total assets (≤ ₱100K: ₱1,000; ₱100K–₱1M: ₱2,000; etc.). All fee formulas are tabulated in SEC MC No. 024-2020; the computation is a bracket lookup followed by multiplication. The primary error trap is applying the rate to the full authorized capital stock on a capital increase rather than to the increment only; the minimum fee floor is not obvious from SEC's public communications. The low market score (3) reflects limited addressable population (100K–120K corporate actions per year).

This is like inheritance but for understanding what incorporating or amending your corporation actually costs — where the gap between the modest SEC fees and the ₱15K–₱100K law firm charge is entirely professional markup on trivial arithmetic.

---

### RANK 35 — C2: VAT Computation Engine
**Score: 3.75 | Governing law: NIRC Sec. 106–115, RR No. 16-2005 as amended, RA 11976 (EOPT 2024), VAT on Digital Services (RA 12023, October 2024)**

VAT computation follows a standard formula: Output VAT (12% of taxable sales) − Input VAT (12% of VAT-paid purchases) = VAT payable. The complexity is in classification: distinguishing zero-rated (export sales, PEZA-registered, BPO services) from VAT-exempt (basic necessities per NIRC Sec. 109) from standard-taxable transactions; and mixed-use input VAT allocation (apportioned between taxable and exempt sales). RA 12023 added VAT on digital services from October 2024 (non-resident digital service providers must now register and remit). The classification judgment requirement limits computability to 4 (mostly deterministic with edge cases in zero-rated/exempt classification). Taxumo and JuanTax partially address this market.

This is like inheritance but for the monthly VAT return — where the arithmetic is simple but the input classification and carryforward tracking are where errors concentrate. Lower standalone priority given existing competition; higher value as part of an integrated bookkeeping → VAT return pipeline.

---

### RANK 35 — C5: Property Transfer Tax Bundler
**Score: 3.75 | Governing law: NIRC Sec. 24(D), Sec. 196 (DST), RA 7160 Sec. 135 (Transfer Tax), PD 1529 (Registration Fees)**

A full residential property transfer in the Philippines requires four separate taxes computed by three different agencies using three different valuation bases: (1) CGT = 6% × MAX(GSP, zonal value, assessed value for tax purposes) → BIR; (2) DST = 1.5% of the higher of consideration or FMV → BIR; (3) Transfer Tax = 0.5% (provinces) or 0.75% (cities) of whichever is higher → LGU Treasurer; (4) Registration Fee = per LRA schedule based on property value → Registry of Deeds. The total closing cost can range from 3–7% of property value before professional fees. Each computation is individually deterministic; the bundler creates confusion because each agency uses a different valuation base (GSP, zonal value, and assessed value may all differ).

This is like inheritance but for understanding the full closing costs on a Filipino real estate transaction — where buyers and sellers routinely discover tax obligations only when they arrive at the Registry of Deeds. The multi-agency coordination layer is the primary pain point, not the individual computations; a single-screen closing cost estimator that shows all four components upfront would reduce the "hidden fees" shock that characterizes Philippine property transactions.

---

### RANK 37 — F2: Local Business Tax + Business Permit Calculator
**Score: 3.70 | Governing law: RA 7160 (LGC) Sec. 143–152, Local Revenue Codes of 1,600+ LGUs**

Local business tax (LBT) rates are set by each LGU within caps established by RA 7160 Sec. 143: for retailers with gross sales > ₱1M, the rate applies on the preceding year's gross sales at a graduated scale (up to 2% for large retailers). Each LGU publishes its own revenue code with rates within the statutory caps. The computation is a bracket lookup followed by multiplication — trivially deterministic — but requires the applicable LGU's revenue code, which is not centrally published. Business permit renewal by January 20 is the highest-footfall annual LGU process in the Philippines. The computability score of 3 reflects the LGU database dependency rather than statutory uncertainty.

This is like inheritance but for the annual business permit renewal — where the computation is easy but finding the applicable rate for the specific LGU requires accessing non-centralized local ordinances. The entity that maintains a comprehensive LGU rate database owns a structural data moat making this domain defensible through data rather than algorithmic complexity.

---

### RANK 38 — C3: VAT Refund Claims Engine
**Score: 3.65 | Governing law: NIRC Sec. 112, RMC No. 47-2019, BIR RMO 22-2018**

VAT refund claims for zero-rated exporters are limited by the 2-year prescriptive period from the close of the taxable quarter when the zero-rated sales were made (NIRC Sec. 112(C)), administrative processing requirements under RMC No. 47-2019, and BIR documentation requirements that are exhaustive. The computation itself — allocating input VAT between zero-rated and standard-taxable sales on an attributable basis — is formula-driven. The pain score of 5 reflects historical CIR processing backlogs and forfeiture risk from missing the prescriptive period. The low market score (2) and medium computability (3) limit overall opportunity: this is a high-value B2B niche rather than a mass-market tool. Success fees of 3–10% on refund amounts command large absolute fees for large exporters, making this a viable specialist tool for export processing zones and large-volume exporters.

This is like inheritance but for large-scale exporters reclaiming input VAT — a high-value, low-volume niche where the professional fee is justified by the claim size but where the core attribution computation is statute-defined.

---

### RANK 39 — E5: Capital Increase / Decrease Filing Engine
**Score: 3.60 | Governing law: RA 11232 Sec. 37–38, SEC MC No. 024-2020**

Capital increase amendments require: board and stockholder approval (2/3 vote for increase), SEC filing fee = 1/5 of 1% of the authorized capital increase (not total capital), bank certificate of subscription for at least 25% of the increase actually subscribed at 25% paid-up. DST applies to newly issued shares = ₱1.00 per ₱200 par value per NIRC Sec. 174. The key computation error is applying the fee rate to the total authorized capital stock rather than the increment. The low market score (2) reflects 30K–40K annual capital amendments — a narrow but recurring corporate action where law firms extract significant markup (₱15K–₱80K) on trivial arithmetic.

This is like inheritance but for corporate capital restructuring — where the professional fee is almost entirely extraction on a computation that takes two minutes of arithmetic once the increment amount is known.

---

### RANK 40 — D9: SEnA Monetary Claims Calculator
**Score: 3.55 | Governing law: RA 10396 (SEnA), DOLE SEnA rules, Labor Code Art. 291 (3-year prescriptive period)**

SEnA (Single Entry Approach) mandatory mediation requires workers to compute their claim amount at the point of requesting assistance. Each claim type maps to a statutory formula: underpayment (applicable wage order rate − actual rate × days worked); unpaid OT (extra hours × overtime multiplier × daily rate); unpaid SIL (unused days × daily rate); separation pay (applicable formula based on cause). The computation is fully deterministic given factual inputs; the limitation is the low volume (40K–60K SEnA cases nationally per year). The primary value is worker empowerment: a worker who arrives at the SEnA conference knowing their exact statutory claim amount has standing that the currently-unrepresented majority lacks.

This is like inheritance but for the worker at the DOLE counter — where knowing the right number is the difference between accepting a lowball offer and getting the full statutory amount.

---

### RANK 41 — G5: Life Insurance CSV Verification
**Score: 3.30 | Governing law: IC Circular Letter No. 12-2020, RA 10607 (Insurance Code) Sec. 233**

Life insurance policies must comply with minimum non-forfeiture values established by the Insurance Commission. The statutory floor for cash surrender value is computed from the policy's table of non-forfeiture values (embedded in the policy document) — not from a single formula applicable to all policies. The low moat score (2) reflects that the professional gatekeeping here is informational asymmetry between insurer and policyholder (the insurer simply states a CSV, and policyholders don't question it) rather than active professional gatekeeping through lawyers or CPAs. No standard market exists for CSV verification; actuarial consulting at ₱10K–₱50K is prohibitively expensive for most policy sizes.

This is like inheritance but for life insurance surrenders — where the moat is the insurer's information advantage rather than professional services markup. The opportunity is most viable as an Insurance Commission complaint-filing guide combined with a policy-specific CSV minimum computation, rather than as a standalone computation tool.

---

## Cross-Domain Infrastructure Note

**G1 (Legal Interest Computation Engine)** deserves special treatment as cross-domain infrastructure. Every domain in this survey that involves a disputed amount eventually produces a money judgment with Nacar interest. A single, correctly implemented Nacar engine serves:
- D3 (Final Pay disputes)
- D4 (Retirement Pay NLRC awards)
- D5 (Separation Pay NLRC awards)
- D6 (Back wages)
- F4 (Maceda Law CSV + 6% interest per developer liability)
- G4 (LEC civil awards)
- B2 (BIR deficiency interest — different rate but same computational pattern)
- G3 (Marital property liquidation — legal interest on reimbursement claims)

**Building G1 first creates a shared computational primitive that multiplies the value of eight subsequent tools.**

---

## The "Inheritance Engine Pattern" — Top Analogs

The inheritance engine succeeded because: (1) the Civil Code defined the exact math, (2) lawyers charged ₱50K–₱200K to do that math, (3) no existing tool existed, and (4) the market (every Filipino with a deceased relative) was massive. The following domains replicate all four conditions most precisely:

| Domain | The Formula | Systematic Error | Professional Fee | Consumer Impact |
|--------|------------|-----------------|-----------------|-----------------|
| **D4 — Retirement Pay** | (Monthly Rate ÷ 26) × 22.5 × Years | Using 15 instead of 22.5 (−33%) | ₱5K–₱25K per computation | 30-year employee loses ₱302K |
| **F4 — Maceda Law CSV** | Years → % table lookup × total payments | Accepting below-floor refunds | ₱15K–₱50K+ complaint | Buyer accepts ₱0 instead of ₱500K+ |
| **G4 — LEC Calculator** | 2/3 × (80−age) × gross income × 50% | Accepting CTPL limit as full settlement | 20–30% contingency | Victim accepts ₱100K instead of ₱1M+ |
| **E1 — SEC Compliance** | Status + penalty table lookups | Can't self-assess compliance | ₱50K–₱200K remediation | Corp pays emergency fees for arithmetic |

---

## Next Steps — Top 3 Candidates for Full Reverse Ralph Loops

### #1 Priority: SEC Compliance Navigator & Penalty Engine (E1)

A dedicated `sec-compliance-reverse` loop should produce a comprehensive analysis of the SEC penalty matrix, ECIP cost modeling, and corporate compliance status determination logic. The product this loop would produce is a web tool or API that accepts a corporation's SEC registration number and filing history, and returns: (1) current compliance status (active / delinquent / suspended / revoked), (2) itemized penalty accumulation per year with applicable SEC Memorandum Circular citations, (3) ECIP vs. standard reinstatement petition cost comparison with a recommendation, and (4) priority action list by deadline. At 527K+ active corporations with a validated ₱63B–₱158B annual corporate secretary market, this is the highest opportunity domain in the entire survey — combining the largest addressable market with the deepest professional moat and fully deterministic computation.

The loop should specifically analyze: SEC MC-028-2020 (consolidated penalty schedule), SEC MC-019-2016 (ECIP terms), RA 11232 Secs. 155–162 (reporting obligations and penalties), and the HARBOR/eFAST system integration requirements for filing status verification.

### #2 Priority: Legal Interest Computation Engine (G1) — Cross-Domain Infrastructure

A dedicated `legal-interest-engine-reverse` loop should produce both an analysis and a working specification for the Nacar v. Gallery Frames computation engine. The product this loop would produce is a shared computational service: inputs are obligation date, demand/filing date, judgment date, principal amount, and obligation type → outputs are pre-finality interest, post-finality interest, Art. 2212 compound interest layer, and total amount due on any target date. This tool has the unique property of serving as infrastructure for eight other domains in this survey; building it as an open, callable service (API or embeddable widget) multiplies value across the entire ecosystem of Philippine compliance tools.

The loop should specifically analyze: Civil Code Art. 2209–2212 (interest on obligations), BSP Circular 799 (6% rate), Nacar v. Gallery Frames (GR 189871), the transition from 12% to 6% rates, Art. 2212 compound interest jurisprudence, and how interest computation interacts with NLRC, small claims, and civil court judgment finality dates.

### #3 Priority: Maceda Law Cash Surrender Value Calculator (F4)

A dedicated `maceda-law-reverse` loop should produce a comprehensive analysis of RA 6552's CSV formula, the notarial act cancellation requirement, DHSUD/HSAC complaint procedures, and the typical developer defenses to CSV claims. The product this loop would produce is a consumer-facing tool: inputs are total installments paid, number of years of installment payments, and cancellation method (notarial act vs. other) → outputs are statutory CSV percentage, minimum CSV amount the buyer is legally entitled to, whether the cancellation was legally valid, the 30/60-day grace period, and a checklist for filing a DHSUD/HSAC complaint if the developer refuses. This is the closest analog to the inheritance engine in the survey: simple statutory formula, total developer-buyer information asymmetry confirmed by the regulator's own FAQ pages, and clear consumer empowerment potential at mass scale (millions of ongoing installment contracts in the Philippines).

The loop should specifically analyze: RA 6552 Secs. 3–6 in full, SC jurisprudence on Maceda Law (Solid Homes v. CA 2008, and post-2020 cases), DHSUD/HSAC complaint procedure and fee schedule, the distinction between cancellation for non-payment vs. cancellation by mutual agreement, and how to handle CSV claims for properties that have been partially developed or for buyers who have been out of contact for years.

---

## Survey Closure

This survey has identified **41 automatable compliance domains** across all major Philippine legal codes and regulatory agencies. The inheritance engine thesis — that Philippine law contains fully computable formulas that professionals charge substantial fees to execute — is confirmed across every category scanned. The top tier of 15 domains (score ≥ 4.25) all satisfy the four conditions simultaneously: large market, deep professional moat, fully deterministic computation, and significant pain/friction for the affected population.

The single most important finding: **this is a target-rich environment with very few low-opportunity domains.** 39 of 41 domains score ≥ 3.55, confirming that Philippine compliance law is systematically full of computable formulas gatekept by professional intermediaries. Each domain in this survey represents a candidate for a reverse ralph loop, a working prototype, or a production compliance tool.
