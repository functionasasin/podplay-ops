# Wave 1: BIR Forms Catalog — Comprehensive Survey

## Source Summary

Surveyed the complete Bureau of Internal Revenue forms catalog at bir.gov.ph/bir-forms, organized across 10 categories:
- Application Forms (0605, 1901-1905 series)
- Certificates (2304, 2306, 2307, 2316)
- Documentary Stamp Tax Returns (2000, 2000-OT)
- Excise Tax Returns (2200-A, 2200-T, 2200-P, 2200-M, 2200-AN)
- Income Tax Returns (1700, 1701, 1701A, 1701Q, 1702-RT, 1702-MX, 1702-EX, 1702Q)
- Payment/Remittance Forms (0605, 0619E, 0619F, 1606)
- Transfer Tax Returns (1800, 1801)
- VAT/Percentage Tax Returns (2550M, 2550Q, 2551Q)
- Withholding Tax Returns (1601C, 1601EQ, 1601FQ, 1604C, 1604E, 1604F)
- Capital Gains Tax Returns (1706, 1707, 1707-A)

Key regulatory context:
- **EOPT Act** (RA 11976, effective Jan 22, 2024) — simplified forms for micro/small taxpayers, reduced penalties (surcharge 25%→10%, interest 12%→6% for micro/small), new taxpayer classifications
- **RR 6-2024** — implementing rules for EOPT reduced penalties
- **eBIRForms / eFPS** — electronic filing now mandatory for most taxpayers

Cross-references: nirc-income-tax (income tax forms), nirc-other-taxes (VAT/DST/excise), labor-code-wages (withholding on compensation). This analysis focuses on **forms-layer domains** — automation opportunities that arise from the forms ecosystem itself, not from individual tax computations already covered.

## Complete BIR Forms Map (Computation-Heavy Forms Only)

### Income Tax Return Forms
| Form | Name | Filer | Frequency | Computation |
|------|------|-------|-----------|-------------|
| 1700 | ITR - Pure Compensation | Employees | Annual | Graduated rates, tax credits |
| 1701 | ITR - Mixed Income | Self-employed + employed | Annual | Graduated rates + business income |
| 1701A | ITR - Pure Business/Profession | Self-employed | Annual | 8% flat OR graduated rates |
| 1701Q | Quarterly ITR | Self-employed/mixed | Quarterly | Cumulative income, quarterly tax due |
| 1702-RT | Corporate ITR - Regular | Corporations | Annual | 25% RCIT or 1% MCIT, whichever higher |
| 1702-MX | Corporate ITR - Mixed | Corps with incentives | Annual | Multiple rate schedules |
| 1702-EX | Corporate ITR - Exempt | Non-profits, GPPs | Annual | Minimal (reporting only) |
| 1702Q | Quarterly Corporate ITR | Corporations | Quarterly | Cumulative corporate income |

### Withholding Tax Forms
| Form | Name | Filer | Frequency | Computation |
|------|------|-------|-----------|-------------|
| 0619E | Monthly Remittance - Expanded WT | Withholding agents | Monthly (M1, M2) | EWT on non-compensation payments |
| 0619F | Monthly Remittance - Final WT | Withholding agents | Monthly (M1, M2) | Final WT on interest, dividends, etc. |
| 1601C | Monthly Remittance - Compensation WT | Employers | Monthly | Tax withheld per employee from graduated table |
| 1601EQ | Quarterly Expanded WT | Withholding agents | Quarterly | Quarterly summary of expanded WT |
| 1601FQ | Quarterly Final WT | Withholding agents | Quarterly | Quarterly summary of final WT |
| 1604C | Annual Info Return - Compensation | Employers | Annual | Alphalist reconciliation |
| 1604E | Annual Info Return - Expanded | Withholding agents | Annual | Alphalist of payees reconciliation |
| 1604F | Annual Info Return - Final | Withholding agents | Annual | Alphalist reconciliation |

### VAT / Percentage Tax Forms
| Form | Name | Filer | Frequency | Computation |
|------|------|-------|-----------|-------------|
| 2550M | Monthly VAT Declaration | Large taxpayers | Monthly | Output - Input VAT |
| 2550Q | Quarterly VAT Return | VAT-registered businesses | Quarterly | Output - Input VAT + crediting |
| 2551Q | Quarterly Percentage Tax | Non-VAT businesses | Quarterly | 3% × gross sales |

### Capital Gains / Transfer Tax Forms
| Form | Name | Filer | Frequency | Computation |
|------|------|-------|-----------|-------------|
| 1706 | CGT Return - Real Property | Seller/transferor | Per transaction | 6% × selling price or FMV |
| 1707 | CGT Return - Shares (unlisted) | Seller | Per transaction | 15% × net capital gains |
| 1707-A | Annual CGT - Shares (unlisted) | Seller | Annual | Annual summary of 1707 |
| 1800 | Donor's Tax Return | Donor | Per donation | 6% × (donation − P250K exemption) |
| 1801 | Estate Tax Return | Estate executor | Per estate | 6% × net estate (already covered — estate-tax-reverse) |

### DST / Excise Tax Forms
| Form | Name | Filer | Frequency | Computation |
|------|------|-------|-----------|-------------|
| 2000 | Monthly DST Declaration | eDST taxpayers | Monthly | Rate per instrument type (NIRC Sec. 173-201) |
| 2000-OT | DST Return - One-Time | Any party to DST-liable document | Per transaction | Rate lookup per document type |
| 2200-A | Excise Tax - Alcohol | Manufacturers | Per removal | Specific rate per proof liter/unit |
| 2200-T | Excise Tax - Tobacco/Vapor | Manufacturers | Per removal | Specific rate per pack/ml |
| 2200-P | Excise Tax - Petroleum | Oil companies | Per removal | Specific rate per liter |
| 2200-M | Excise Tax - Minerals | Mining companies | Per removal | Ad valorem (2-4%) × value |

### Payment / Certificate Forms
| Form | Name | Filer | Frequency | Computation |
|------|------|-------|-----------|-------------|
| 0605 | Payment Form | Any taxpayer | As needed | Penalty/surcharge/interest computation |
| 2307 | Certificate of Creditable Tax Withheld | Withholding agents | Per transaction/quarter | EWT rate × payment amount |
| 2316 | Certificate of Compensation Payment | Employers | Annual per employee | Year-end tax reconciliation |

## Domains Identified

This analysis focuses on **forms-ecosystem domains** — gaps that arise from navigating, selecting, computing across, and reconciling multiple BIR forms. Individual tax computation domains (graduated rates, VAT, DST, etc.) are documented in their respective Wave 1 aspects.

---

### Domain 1: BIR Form Selection Navigator

**One-line description:** Decision engine that tells taxpayers which exact BIR forms to file based on their profile and income sources.

**Governing rules:** BIR Revenue Regulations (RR 11-2018, RR 8-2018), RA 11976 (EOPT Act), RR 6-2024 (taxpayer classification)

**Computation sketch:**
- Input: Taxpayer type (individual/corp), income sources (compensation/business/mixed), registration status (VAT/non-VAT/8%), gross sales bracket (micro <P3M / small P3M-P20M / medium P20M-P1B / large >P1B), fiscal year
- Step 1: Classify taxpayer under EOPT categories (micro/small/medium/large)
- Step 2: Determine applicable ITR form (1700 vs 1701 vs 1701A vs 1702-RT/MX/EX)
- Step 3: Determine withholding obligations (employer → 1601C/0619E; payer → 1601EQ)
- Step 4: Determine VAT/PT form (2550Q vs 2551Q vs exempt)
- Step 5: Map complete annual filing calendar with form numbers and deadlines
- Output: Personalized filing checklist with exact form numbers, deadlines, and dependencies

**Who currently does this:** CPAs, tax consultants, or taxpayers themselves (confused, error-prone). "Using Incorrect Forms" is one of the top 10 BIR filing errors per UNA Accounting. The BIR has no official form selection tool — only disparate guidelines scattered across Revenue Regulations.

**Market size:** ~5.7 million registered taxpayers (2024). Not all file, but all must determine their filing obligations. Self-employed/mixed-income earners (estimated 2-4M) face the most confusion. The 1700 vs 1701 vs 1701A decision alone generates thousands of help articles.

**Professional fee range:** Typically bundled with CPA tax filing services (P2,000-P5,000/return), but the form selection confusion is the initial friction point. Taxumo's subscription starts at P2,499/quarter partly to solve this navigation problem.

**Pain indicators:**
- Top-10 BIR filing error: "Using Incorrect Forms"
- Three nearly identical individual ITR forms (1700, 1701, 1701A) with non-obvious selection criteria
- Four corporate ITR variants (1702-RT, 1702-MX, 1702-EX, 1702Q) requiring correct classification
- EOPT Act changed taxpayer classification and form requirements in 2024
- Monthly vs quarterly filing depends on taxpayer size category
- No official BIR decision tree or form wizard exists

**Computability: 5/5 — Fully deterministic.** Form selection is a pure decision tree based on taxpayer profile attributes (income sources, registration type, gross sales bracket). Zero judgment required — it's a finite state machine.

---

### Domain 2: BIR Penalty and Interest Calculator

**One-line description:** Compute exact surcharge, interest, and compromise penalties for any late-filed or late-paid BIR return.

**Governing sections:** NIRC Sec. 248 (surcharge), Sec. 249 (interest), RA 11976 Sec. 13 (EOPT reduced penalties), RR 6-2024, RMO 7-2015 Annex A (compromise penalty schedule)

**Computation sketch:**
- Input: Form type, original due date, actual filing date, tax due, taxpayer classification (micro/small/medium/large), whether willful
- Step 1: Determine surcharge rate (10% for micro/small per EOPT, 25% standard, 50% for fraud)
- Step 2: Compute interest = tax due × rate × (days late / 365), where rate = 6% p.a. for micro/small, 12% p.a. standard (EOPT cap: interest cannot exceed basic tax)
- Step 3: Look up compromise penalty from RMO 7-2015 schedule (tiered by unpaid tax amount for returns with tax due, or by gross receipts for zero-tax returns)
- Step 4: Total penalty = surcharge + interest + compromise
- Output: Itemized penalty breakdown with legal basis citations

**Who currently does this:** CPAs, BIR examiners, or taxpayers attempting manual computation. The BIR itself has no public penalty calculator. Third-party guides exist (Taxumo, MPM, Respicio) but are articles, not tools.

**Market size:** Affects any taxpayer who files late. BIR annual reports indicate millions of late filings. With 5.7M registered taxpayers, even a 10% late-filing rate = ~570K penalty computations annually. Additionally, BIR assessments generate penalty disputes — 2024 saw P257M recovered from compliance checks alone.

**Professional fee range:** Usually part of CPA/tax lawyer remediation services (P5,000-P50,000+ depending on assessment amount). Understanding penalties is critical for taxpayers deciding whether to contest BIR assessments.

**Pain indicators:**
- EOPT Act created a two-tier penalty system in 2024 — micro/small get reduced rates, others don't. This bifurcation confuses everyone.
- Interest computation on diminishing balance is non-trivial for multi-period delinquencies
- Compromise penalty schedule (RMO 7-2015) has 20+ tiers based on unpaid tax brackets
- No official BIR tool computes penalties — taxpayers learn amounts only when assessments arrive
- "Late Payments" and "Incorrect Calculations" are among the top 10 filing errors

**Computability: 5/5 — Fully deterministic.** Surcharge rates, interest rates, and compromise schedules are all defined by statute/regulation. The only variable is taxpayer classification (itself deterministic from gross sales). No judgment required.

---

### Domain 3: Multi-Form Compliance Calendar Engine

**One-line description:** Generate a complete annual BIR filing calendar with all required forms, deadlines, and dependencies for any taxpayer profile.

**Governing rules:** BIR Tax Calendar (annual publication), RA 11976, RR 11-2018, various RMCs for deadline extensions

**Computation sketch:**
- Input: Taxpayer profile (type, income sources, VAT status, employer status, EOPT classification, fiscal year)
- Step 1: Map all required forms from Domain 1 (Form Selection Navigator)
- Step 2: For each form, compute filing deadline from statutory rules:
  - Monthly forms (0619E/F, 1601C, 2550M): 10th of following month (15th for eFPS)
  - Quarterly forms (1601EQ, 1701Q, 1702Q, 2550Q, 2551Q): 25th-30th after quarter end
  - Annual forms (1604C/E/F, 1700/1701/1701A, 1702): Jan 31, Mar 1, or Apr 15
  - Event-driven forms (1706, 1707, 1800, 2000-OT): 5-30 days from triggering event
- Step 3: Annotate with payment computation requirements and supporting document lists
- Step 4: Flag dependency chains (e.g., 1604C summarizes all 1601C filings; quarterly ITR credits reduce annual ITR)
- Output: 12-month calendar with ~20-50 filing events, reminders, and checklist

**Who currently does this:** CPAs, bookkeepers, or business owners manually tracking deadlines. SEC/BIR/DOLE calendar coordination is the #1 compliance pain for corporations (per wave1-corporation-code analysis). Third-party tools like Taxumo and JuanTax partially address this for tax forms, but don't cover SEC/DOLE integration.

**Market size:** All 1.24M registered businesses need this. Corporations (527K+) have the most complex calendars (15-25 deadlines across SEC/BIR/LGU per wave1-corporation-code). Individual self-employed (2-4M) have simpler but still confusing calendars (5-12 deadlines/year).

**Professional fee range:** Monthly bookkeeping retainers (P3,000-P15,000/month for SMEs) heavily include calendar management. Taxumo's SMB plan (P4,248/quarter) covers filing for most form types. Dedicated compliance calendar services: P2,000-P5,000/month.

**Pain indicators:**
- BIR discontinued printed tax calendars in 2026 — now digital-only interactive calendar, harder to personalize
- Missing a single deadline triggers surcharge + interest (Domain 2 penalties)
- 527K corporations face 15-25 cross-agency deadlines per year
- Multiple filing channels (eFPS, eBIRForms, manual) with different deadlines
- RMC-based deadline extensions are unpredictable and require monitoring
- Quarterly-to-annual reconciliation errors are common (quarterly payments must net against annual tax)

**Computability: 5/5 — Fully deterministic.** Deadlines are statutory. Form requirements are determined by taxpayer profile. No judgment required — this is a pure calendar generation engine.

---

### Domain 4: Withholding Tax Agent Compliance Engine

**One-line description:** Compute, track, and reconcile all withholding tax obligations for employers and payers — from monthly remittance through annual alphalist.

**Governing sections:** NIRC Sec. 57-58 (withholding at source), RR 2-98 as amended (withholding tax rates), RR 11-2018 (TRAIN withholding tables), RA 11976 (EOPT electronic filing)

**Computation sketch:**
- Input: Employee roster with compensation data; supplier/vendor payments with EWT classification
- **Compensation withholding (1601C path):**
  - Step 1: For each employee, determine taxable compensation = gross - non-taxable (13th month up to P90K, de minimis, SSS/PhilHealth/Pag-IBIG)
  - Step 2: Apply BIR Withholding Tax Table (Annex B, RR 11-2018) based on pay period (monthly, semi-monthly, daily)
  - Step 3: Sum all employee withholdings → file 1601C monthly
  - Step 4: Year-end: generate 2316 per employee, file 1604C with alphalist by Jan 31
- **Expanded withholding (1601EQ path):**
  - Step 1: Classify each payment by EWT rate category (RR 2-98 has 40+ rate categories: 1%, 2%, 5%, 10%, 15%)
  - Step 2: Compute EWT per payment, issue 2307 certificate to payee
  - Step 3: Remit via 0619E monthly (M1/M2), 1601EQ quarterly (M3)
  - Step 4: Year-end: file 1604E with quarterly alphalist of payees by Mar 1
- **Final withholding (1601FQ path):**
  - Step 1: Identify payments subject to final WT (interest, dividends, royalties, prizes)
  - Step 2: Apply final WT rate per category
  - Step 3: Remit via 0619F monthly, 1601FQ quarterly, 1604F annually
- Output: Monthly remittance forms, quarterly returns with alphalists, annual information returns, per-payee certificates (2307/2316)

**Who currently does this:** Payroll departments (large companies), CPAs/bookkeepers (SMEs), or employers themselves (micro). The 40+ EWT rate categories in RR 2-98 make classification the main pain point.

**Market size:** 1.24M registered employer-businesses file withholding tax forms. All employers must withhold on compensation (~28M employees). Withholding agents issuing 2307s: estimated 500K-800K businesses making payments to suppliers/contractors. Monthly filing means 12-24 forms per business per year, totaling millions of individual form filings.

**Professional fee range:** Payroll outsourcing: P2,000-P10,000/month per company (Sprout Solutions, SalaryBox). CPA-prepared withholding returns: P1,500-P5,000/month. Alphalist preparation (annual): P5,000-P20,000 per filing. Taxumo Micro plan includes withholding forms for P3,248/quarter.

**Pain indicators:**
- 40+ EWT rate categories — classification of vendor payments is the #1 source of errors
- Monthly + quarterly + annual filing creates reconciliation burden (monthly totals must match quarterly, quarterly must match annual)
- Alphalist of payees format is complex — manual data entry for hundreds of payees
- 2307 certificates must be issued to every payee — tracking and generation is manual for most SMEs
- BIR cross-references alphalists against payees' ITRs — mismatches trigger audit notices
- Year-end crunch: 1604C (Jan 31) and 1604E (Mar 1) deadlines coincide with annual ITR preparation

**Computability: 4/5 — Mostly deterministic.** Withholding rates are defined by regulation. The main judgment area is classifying payments into the correct EWT rate category from 40+ options. Once classified, computation is purely mechanical. A decision-tree tool for EWT classification would push this to 5/5.

---

### Domain 5: Tax Regime Optimizer (8% vs Graduated vs OSD vs Itemized)

**One-line description:** Simulate and compare tax outcomes across all available filing regimes to find the taxpayer's optimal strategy.

**Governing sections:** NIRC Sec. 24(A)(2)(b) (8% option), Sec. 34 (deductions — OSD 40% or itemized), TRAIN Law Sec. 5-6

**Computation sketch:**
- Input: Gross sales/receipts, business expenses (itemized), non-operating income, other income sources
- Simulation 1: **8% flat tax** = 8% × (gross sales − P250,000) — available only if gross ≤ P3M and non-VAT
- Simulation 2: **Graduated rates + OSD** = tax on [gross × 60% (taxable after 40% OSD)]
- Simulation 3: **Graduated rates + Itemized** = tax on [gross − actual expenses − allowable deductions]
- For each: add percentage tax (3% if non-VAT, not applicable if 8%) and VAT (12% if VAT-registered)
- Compare: total tax burden under each regime, including compliance costs
- Output: Side-by-side comparison with recommended regime, projected annual savings

**Who currently does this:** CPAs advise clients on regime selection. Most freelancers and micro-businesses default to 8% without verifying it's optimal. JuanTax's blog and Taxumo's calculator offer partial comparison, but no comprehensive multi-regime simulator exists.

**Market size:** 2-4M self-employed and mixed-income earners eligible for regime choice. The 8% flat tax option (TRAIN Law, 2018) was specifically designed for small businesses, but many don't know they can switch, or they chose suboptimally. Freelancers (estimated 1.5M+ in Philippines) are the core audience.

**Professional fee range:** CPA consultation for regime selection: P2,000-P5,000. Ongoing optimization requires quarterly monitoring. Taxumo 8% plan starts at P2,499/quarter — but doesn't simulate alternative regimes.

**Pain indicators:**
- 8% option seems simple but has hidden costs (can't claim input VAT, can't deduct expenses)
- Crossing the P3M threshold forces VAT registration and graduated rates — the cliff effect
- OSD (40% flat deduction) vs itemized deduction choice requires expense tracking to evaluate
- Regime election is annual but locked for the year once chosen — wrong choice is costly
- Mixed-income earners (compensation + business) face the most complex optimization — 8% only applies to business income portion
- No BIR tool compares regimes — the filing form itself doesn't show alternatives

**Computability: 5/5 — Fully deterministic.** All regime rules are defined by statute. Given income/expense inputs, each simulation is pure arithmetic. The comparison is a simple min() function. No judgment required.

---

### Domain 6: Quarterly-to-Annual Tax Reconciliation Engine

**One-line description:** Reconcile quarterly tax payments with annual tax liability, computing excess credits, deficiency taxes, and installment schedules.

**Governing sections:** NIRC Sec. 56 (quarterly corporate ITR), Sec. 74 (individual quarterly ITR), Sec. 76 (tax credit carry-forward), RR 12-2018

**Computation sketch:**
- Input: Quarterly ITR data (1701Q × 3 quarters or 1702Q × 3 quarters), year-end income/expense data, prior-year excess credits
- Step 1: Compute total annual tax due using final full-year income
- Step 2: Sum all quarterly tax payments already made (from 1701Q/1702Q filings)
- Step 3: Add creditable withholding taxes from 2307 certificates received during the year
- Step 4: Add prior-year excess credits carried forward (if elected on prior year's annual ITR)
- Step 5: Tax payable/refundable = Annual tax due − quarterly payments − creditable WT − prior credits
- Step 6: If payable > P2,000, option to pay in two installments (Apr 15 + Oct 15 per Sec. 56(B))
- Output: Annual ITR with reconciliation schedule, installment computation if applicable

**Who currently does this:** CPAs for businesses and self-employed. The reconciliation is where most errors occur — quarterly payments and withholding credits must be precisely tracked and netted against annual liability.

**Market size:** All self-employed (2-4M filing 1701Q) and all corporations (527K+ filing 1702Q) must reconcile quarterly-to-annual. That's 2.5-4.5M reconciliation events per year.

**Professional fee range:** Included in annual ITR preparation (P5,000-P30,000 for corporations, P2,000-P10,000 for individuals). Errors in reconciliation trigger BIR assessment notices.

**Pain indicators:**
- Mismatch between quarterly payments and annual tax is the #1 source of BIR assessment letters
- Creditable withholding from 2307s must be tracked from multiple payors throughout the year
- Prior-year excess credit election (carry-forward vs refund) is irrevocable and frequently misunderstood
- Installment option (50/50 split Apr/Oct) is rarely explained to taxpayers
- Corporate quarterly ITR uses cumulative method — each quarter reports year-to-date, netting prior quarters

**Computability: 5/5 — Fully deterministic.** It's arithmetic: annual tax − quarterly payments − creditable WT − prior credits = payable. No judgment required, only accurate data aggregation.

---

### Domain 7: BIR Certificate (2307/2316) Tracker and Generator

**One-line description:** Track, generate, and reconcile BIR withholding tax certificates across all counterparties for a taxable year.

**Governing sections:** NIRC Sec. 58(A) (return and payment of taxes withheld), RR 2-98 Sec. 2.58 (certificates), RR 11-2018

**Computation sketch:**
- **For withholding agents (issuers):**
  - Input: All payments to suppliers/contractors/employees during period
  - Process: Classify payment, apply EWT/final WT rate, generate 2307 (for EWT payees) or 2316 (for employees)
  - Reconcile: All issued 2307s must match 1604E alphalist; all 2316s must match 1604C alphalist
- **For payees (recipients):**
  - Input: All received 2307 certificates from withholding agents
  - Process: Sum creditable WT per quarter for 1701Q/1702Q, sum annual for 1701/1702
  - Reconcile: Claimed tax credits on ITR must match total of 2307s received
- Output: Generated certificates, quarterly/annual summaries, mismatch alerts

**Who currently does this:** Accounting/bookkeeping staff for businesses, or CPAs for SMEs. Many SMEs manually type 2307 data into spreadsheets. BIR's cross-referencing of alphalists against individual returns is a key audit trigger.

**Market size:** 500K-800K withholding agents issue 2307s; 28M+ employees receive 2316s. Volume of individual 2307 certificates: estimated tens of millions annually (each business issues to dozens/hundreds of payees).

**Professional fee range:** Bundled with bookkeeping services. Dedicated 2307 management: not separately priced, but the tracking overhead adds 2-5 hours/month for a typical SME.

**Pain indicators:**
- Chasing 2307s from withholding agents is a perennial problem — payees need them to claim credits
- Missing 2307s mean unclaimed tax credits (taxpayer pays more than legally required)
- BIR's cross-reference matching means discrepancies trigger audit notices on both sides
- No standard digital format for 2307 exchange — most are PDF/paper
- Alphalist preparation requires aggregating all certificates into BIR's specific CSV format

**Computability: 4/5 — Mostly deterministic.** Certificate generation is mechanical (rate × amount). The challenge is data aggregation and matching across counterparties — more a data management problem than a computation problem, but highly automatable.

---

### Domain 8: eBIRForms / eFPS Filing Automation Bridge

**One-line description:** Auto-populate and validate BIR electronic forms from accounting data, eliminating manual re-entry and computation errors.

**Governing rules:** RA 11976 (EOPT — electronic filing mandated), BIR eBIRForms v7.9+, eFPS for large taxpayers

**Problem sketch:**
- The BIR's eBIRForms is a downloadable offline Java application that must be manually filled out
- eFPS is a web-based system for large taxpayers with limited integration capability
- Neither system accepts data imports from accounting software — all data must be manually entered
- This creates a "last mile" gap: even if a business uses QuickBooks/Xero/Taxumo for accounting, someone must manually transcribe numbers into BIR's forms

**Current state of automation:**
- Taxumo (100K+ users, P2,499-P4,248/quarter): Generates and files forms electronically, bypassing eBIRForms for supported form types. Covers 1701Q, 1701A, 2551Q, 0619E, 1601EQ, 1604E, 1601C, 1604C, 2550Q, 0605.
- JuanTax: Similar BIR-accredited e-filing with accounting integration
- Sprout Solutions: Payroll-focused, generates 1601C/2316/1604C

**Remaining gaps:**
- Capital gains forms (1706, 1707) — still manual
- DST forms (2000, 2000-OT) — still manual
- Estate/donor tax (1801, 1800) — still manual (1801 covered by estate-tax-reverse)
- Excise tax (2200 series) — industry-specific, minimal automation
- Form validation (checking for common errors before submission) is limited

**Who currently does this:** Taxpayers manually, or CPAs who charge for the transcription labor. The manual entry step is where many of the "top 10 filing errors" (incorrect calculations, wrong form, incomplete information) occur.

**Market size:** All 5.7M registered taxpayers who file electronically. eBIRForms is used by the majority; eFPS by ~20K large taxpayers.

**Professional fee range:** CPA form preparation: P500-P2,000 per form per filing. Annual: P5,000-P30,000 depending on form count. Taxumo/JuanTax subscriptions: P5,496-P16,992/year.

**Pain indicators:**
- eBIRForms is a legacy Java application — crashes, version incompatibility, no modern UX
- No data import capability — manual transcription from books to form
- Validation is minimal — eBIRForms accepts arithmetically incorrect entries
- Multiple forms with overlapping data (quarterly vs annual) require consistent manual entry
- BIR periodically releases new form versions via RMCs — taxpayers must update manually

**Computability: 5/5 — Fully deterministic.** Form population is a mapping function: accounting data → form fields. Validation rules are defined in form instructions. No judgment — just data transformation and arithmetic verification.

---

## Cross-Reference Notes

### Domains already covered by other Wave 1 aspects (no new analysis needed):
- Individual graduated tax computation → wave1-nirc-income-tax Domain 1
- Corporate RCIT/MCIT computation → wave1-nirc-income-tax Domain 4
- VAT computation → wave1-nirc-other-taxes Domain 1
- Percentage tax computation → wave1-nirc-other-taxes Domain 2
- DST computation → wave1-nirc-other-taxes Domain 7
- Donor's tax computation → wave1-nirc-other-taxes Domain 13
- Excise tax computation → wave1-nirc-other-taxes Domains 3-6
- Payroll/withholding on compensation → wave1-labor-code-wages Domain 8
- SSS/PhilHealth/Pag-IBIG contributions → wave1-labor-code-wages Domain 7
- Estate tax computation → **excluded** (estate-tax-reverse loop)

### Domains partially overlapping (this analysis adds forms-layer perspective):
- 8%/graduated regime selection (wave1-nirc-income-tax Domain 2) → expanded here as Domain 5 with OSD/itemized simulation
- Corporate compliance calendar (wave1-corporation-code Domain 3) → expanded here as Domain 3 with full BIR calendar integration
- Withholding tax (wave1-nirc-income-tax Domain 10) → expanded here as Domain 4 with full agent compliance lifecycle

### Key new domains not previously covered:
- **Domain 1: Form Selection Navigator** — NEW, forms-ecosystem specific
- **Domain 2: Penalty and Interest Calculator** — NEW, EOPT two-tier system is 2024 innovation
- **Domain 6: Quarterly-to-Annual Reconciliation** — NEW, reconciliation-specific
- **Domain 7: 2307/2316 Certificate Tracker** — NEW, counterparty tracking
- **Domain 8: eBIRForms Filing Bridge** — NEW, last-mile automation gap

## Existing Automation Landscape

The BIR forms space is the most commercially active compliance automation market in the Philippines:

| Tool | Users | Price | Forms Covered | Gap |
|------|-------|-------|---------------|-----|
| **Taxumo** | 100K+ | P5,496-P16,992/yr | ITR, WT, VAT, PT (15+ forms) | No regime simulation, no penalty calc, no CGT/DST |
| **JuanTax** | Unknown | BIR-accredited | Similar to Taxumo | No multi-form reconciliation |
| **Sprout Solutions** | SMEs | Varies | Payroll forms (1601C, 2316, 1604C) | Payroll-only, no tax returns |
| **BIR eBIRForms** | 5.7M | Free | All forms | No computation, no validation, no import |
| **BIR eFPS** | ~20K | Free | All forms (large taxpayers) | No integration with accounting software |
| **BIR WT Calculator** | Public | Free | Compensation WT only | Single-form, no monthly/quarterly/annual lifecycle |

**Key gap:** No single tool covers the full lifecycle from form selection → computation → filing → reconciliation → penalty assessment. Each tool addresses one slice. The "inheritance engine equivalent" for BIR forms is an integrated compliance engine that starts with "tell me about your business" and produces every required BIR form for the entire year.

## Summary Statistics

- **Total domains identified:** 8 (4 net-new, 4 expanding on prior analyses)
- **Most automatable domains:** Form Selection Navigator (5/5), Penalty Calculator (5/5), Tax Regime Optimizer (5/5), Compliance Calendar (5/5)
- **Largest market domains:** Certificate Tracker (28M+ employees + millions of 2307s), Filing Bridge (5.7M taxpayers), Withholding Agent Engine (1.24M businesses)
- **Highest-pain domains:** Filing Bridge (5/5 — legacy eBIRForms UX), Withholding Agent Engine (5/5 — 40+ rate categories, monthly/quarterly/annual reconciliation), Certificate Tracker (4/5 — chasing 2307s)
- **Already served by market:** Partial — Taxumo/JuanTax/Sprout cover form filing but not selection, penalty, reconciliation, or regime optimization. The integrated lifecycle is the gap.
