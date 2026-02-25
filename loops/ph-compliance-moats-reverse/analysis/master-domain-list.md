# Master Domain List — Philippine Compliance Automation Opportunities

**Produced by:** Wave 2 — deduplicate-and-merge
**Date:** 2026-02-25
**Source:** Consolidation of 13 Wave 1 analyses (nirc-income-tax, nirc-other-taxes, labor-code-wages, labor-code-termination, corporation-code, family-code, civil-code-obligations, insurance-code, bir-forms-catalog, sec-filings-catalog, dole-compliance, lgu-real-property, maceda-law-real-estate)

---

## Deduplication Notes

Before the master list, key overlaps resolved during consolidation:

| Overlap | Source Aspects | Resolution |
|---------|---------------|------------|
| EWT Withholding Tax | nirc-income-tax D6 + bir-forms-catalog D4 | Merged → **D-WITHHOLDING** (bir-forms-catalog version is more complete) |
| Quarterly IT Installments | nirc-income-tax D7 + bir-forms-catalog D6 | Merged → **TAX-QUARTERLY-RECON** |
| CGT on Unlisted Shares | nirc-income-tax D5 + corporation-code D4 | Merged → **TAX-CGT-SHARES** (corporation-code adds DST+CMEPA context) |
| SEC Penalties / Compliance Status | corporation-code D2 + sec-filings-catalog D1 + D5 | Merged → **SEC-COMPLIANCE-NAV** (sec-filings-catalog adds ECIP, remediation) |
| Beneficial Ownership Tracing | corporation-code D6 + sec-filings-catalog D3 | Merged → **SEC-HARBOR-BO** (sec-filings-catalog adds HARBOR 2026 rules) |
| SEC Registration/Lifecycle Fees | corporation-code D1 + sec-filings-catalog D2 | Merged → **SEC-LIFECYCLE-FEE** (sec-filings-catalog covers full lifecycle) |
| SSS/PhilHealth/Pag-IBIG Contributions | labor-code-wages D6 + dole-compliance D6 | Merged → **LABOR-CONTRIBUTIONS** |
| Tax Regime Optimizer (8% vs OSD) | nirc-income-tax D2 + bir-forms-catalog D5 | Merged → **TAX-REGIME-OPT** (bir-forms-catalog version more comprehensive) |
| SIL Monetization | labor-code-wages D3 | Merged into **LABOR-FINAL-PAY** (SIL is a component of final pay) |
| Property Transfer Tax | lgu-real-property D3 (bundles CGT + DST) | Kept as separate **LGU-TRANSFER-BUNDLE** (bundle itself adds value); notes overlap with TAX-CGT-REAL and TAX-DST |
| Motor Vehicle LEC | insurance-code D2 | Kept as **CIVIL-LEC** (Civil Code Art. 2206 domain, applied in insurance contexts) |

### Excluded Domains (Low Priority — Insufficient Moat or Computability)

The following domains were identified in Wave 1 but excluded from the master list for the stated reasons:

| Domain | Reason for Exclusion |
|--------|---------------------|
| OPT/Percentage Tax (3% flat, BIR 2551Q) | Moat near-zero (trivially simple, already served by Taxumo/JuanTax) |
| Excise Tax on Sin Products (NIRC Sec. 129-172) | Market too small (<50 manufacturers); in-house tax teams handle |
| Community Tax / Cedula (RA 7160 Sec. 156-169) | Trivial computation; moat near-zero; computed in 30 seconds by LGU clerks |
| CTPL Benefit Schedule (RA 10607 Sec. 387-390) | Pure table lookup; amounts publicly posted on IC website; no computation moat |
| Nominal Damages for Due Process Violations (Agabon doctrine) | Fixed statutory amounts (₱30K/₱50K); trivial lookup, no standalone market |
| Child/Spousal Support Calculator (Family Code Art. 194-208) | Partially deterministic; amount requires judicial discretion; no fixed formula |
| Liquidated Damages/Penalty Clause Analyzer (Civil Code Art. 1226-1229) | Reduction analysis (Art. 1229) requires judgment; relatively narrow market |
| SRC Reportorial Requirements Engine | Niche (only ~1,500-3,000 entities); valuable per entity but too small for survey |
| DO 248-25 Foreign National Employment | Computability 3/5; judgment-heavy; niche market |
| Telecommuting Act Compliance (RA 11165) | Computability 3/5; ~50% of checklist items are qualitative |
| DO 174 Contracting/Subcontracting (labor-only contracting) | Computability 3/5; control test and core business test require significant judgment |
| Legal Separation Net Profits Forfeiture | Niche (subset of ~10K annulment cases); low standalone market |
| Director Compensation Cap (RA 11232 Sec. 29) | One multiplication; trivially simple; enforcement weak; no real pain |

**Exclusion criteria:** Moat depth ≤ 2 OR computability ≤ 2, OR (market size × pain × moat) qualitatively too low to merit inclusion in a 15-20 domain shortlist.

---

## Master Domain List

Total unique domains: **41**

---

### CATEGORY A: INCOME TAX (5 domains)

---

#### A1. Individual Self-Employed / Professional Income Tax Optimizer

**Description:** Multi-path income tax optimization for self-employed individuals and professionals — choosing and computing between 8% flat rate, graduated rates with OSD, and graduated rates with itemized deductions.

**Governing law:** NIRC Sec. 24(A), 24(A)(2)(b) (8% option), Sec. 34(L) (OSD 40%), Sec. 74-79 (quarterly installments); TRAIN Law (RA 10963); BIR Forms 1701, 1701A, 1701Q

**Source aspects:** nirc-income-tax (D2), bir-forms-catalog (D5)

**Market size:** ~1.8M registered self-employed + 1.5M+ active freelancers; ~5.7M registered business entities; an estimated 2-4M eligible for the 8% option

**Professional cost range:** ₱3,000-₱10,000 annual ITR (CPA); ₱5,000-₱30,000/month bookkeeping retainer for mixed-income earners

**Computability:** 5/5 — Fully deterministic. Three computation paths, all statutory arithmetic. The "optimal regime" selection is a pure min() function across three computed outputs.

**Pain:** 4/5 — Many freelancers make suboptimal regime choices, overpaying by 20-40%. The 8% option was introduced in 2018 but remains poorly understood. Monthly and quarterly filing burden compounds complexity.

---

#### A2. Corporate Income Tax — RCIT vs. MCIT Engine

**Description:** Quarterly and annual computation of corporate income tax, including the mandatory RCIT vs. MCIT comparison, MCIT carry-forward tracking across years, and NOLCO (net operating loss) management.

**Governing law:** NIRC Sec. 27(A) (RCIT 25%/20%), Sec. 27(E) (MCIT 2% of gross income), Sec. 34 (OSD 40%), Sec. 75-76 (quarterly); CREATE Law (RA 11534); BIR Forms 1702-RT, 1702Q

**Source aspects:** nirc-income-tax (D3)

**Market size:** 527,710+ active SEC-registered corporations; ~1M+ filing events annually (including quarterly 1702Qs)

**Professional cost range:** ₱10,000-₱30,000/month accounting retainer (SME); ₱25,000-₱100,000 annual tax return + AFS; ₱500,000+ for Big 4 audit

**Computability:** 4/5 — Mostly deterministic. RCIT vs. MCIT comparison is fully algorithmic. MCIT carry-forward requires multi-year tracking. Main edge cases: tax incentive applicability (PEZA/BOI) and capital vs. ordinary asset classification.

**Pain:** 4/5 — RCIT vs. MCIT must be computed every quarter and annually; MCIT excess carry-forward (up to 3 years) is frequently botched; NOLCO tracking is a recurring error source.

---

#### A3. Capital Gains Tax — Real Property (BIR Form 1706)

**Description:** Computation of the 6% CGT on real property sales based on the higher of selling price or BIR zonal/assessed value, plus simultaneous DST computation (1.5%), within a 30-day filing deadline.

**Governing law:** NIRC Sec. 24(D)(1) (6% CGT); Sec. 196 (1.5% DST on deeds of sale); BIR zonal value schedules; BIR Form 1706

**Source aspects:** nirc-income-tax (D4), lgu-real-property (D3 cross-reference)

**Market size:** 100,000-300,000+ formal residential property transactions per year; 400,000-600,000 total real property title transfers

**Professional cost range:** ₱10,000-₱50,000 per transaction (lawyer/broker); often bundled into ₱30,000-₱150,000 full conveyancing service

**Computability:** 5/5 — Fully deterministic. CGT = 6% × MAX(selling price, zonal value, assessed value × assessment level). DST = 1.5% × same base. The "professional value" is the zonal value lookup, not the arithmetic.

**Pain:** 4/5 — 30-day deadline (25% surcharge + 12% interest for late filing); zonal values not always easily accessible; sellers often unaware of obligation; frequent deadline misses.

---

#### A4. Capital Gains Tax — Unlisted Shares + DST (BIR Forms 1707 / 2000-OT)

**Description:** Computation of 15% CGT on net gain from unlisted share sales, plus the DST on share transfer (₱1.50 per ₱200 par value), with specific rules for zero-gain scenarios and the CMEPA rate change effective July 2025.

**Governing law:** NIRC Sec. 24(C) (15% CGT on unlisted shares); Sec. 175 (DST on share transfers); CMEPA (STT reduction July 2025); BIR Forms 1707, 2000-OT

**Source aspects:** nirc-income-tax (D5), corporation-code (D4)

**Market size:** Hundreds of thousands of unlisted share transfers annually across ~527K closely-held corporations; family corporation restructurings; startup investment rounds

**Professional cost range:** ₱3,000-₱15,000 per transaction (CPA); ₱30,000-₱200,000+ for complex corporate restructuring

**Computability:** 5/5 — Fully deterministic. Net gain = selling price − cost basis − expenses; CGT = 15% × net gain. DST = ceiling(par value ÷ 200) × ₱1.50. Cost basis documentation is the data challenge, not the math.

**Pain:** 4/5 — Most family corporation shareholders never file BIR 1707; BIR audits years later with 25% surcharge + 12% interest; 30-day deadline widely unknown; FMV-based assessment risk.

---

#### A5. Individual Income Tax — Compensation Earners (BIR Form 1700)

**Description:** Annual income tax return for employees with pure compensation income who are NOT covered by substituted filing (e.g., multiple employers, discrepancy between withheld and actual tax due).

**Governing law:** NIRC Sec. 24(A), Sec. 79-83 (withholding on compensation); TRAIN Law; BIR Form 1700

**Source aspects:** nirc-income-tax (D1)

**Market size:** 3-5M active filers outside substituted filing; but moat is lower since employers handle withholding

**Professional cost range:** ₱1,500-₱5,000 per return (CPA)

**Computability:** 5/5 — Fully deterministic.

**Pain:** 3/5 — Moderate; the deeper pain is employers computing annualized withholding incorrectly leading to year-end surprises. Lower standalone priority vs. A1.

---

### CATEGORY B: TAX ADMINISTRATION (7 domains)

---

#### B1. BIR Form Selection Navigator

**Description:** Decision engine that determines the exact set of BIR forms a taxpayer must file based on their profile — taxpayer type, income sources, registration status, gross sales bracket — and generates a personalized filing checklist.

**Governing law:** BIR Revenue Regulations RR 11-2018, RR 8-2018; RA 11976 (EOPT Act); RR 6-2024 (taxpayer classification); NIRC various

**Source aspects:** bir-forms-catalog (D1)

**Market size:** 5.7M registered taxpayers; "Using Incorrect Forms" is a documented top-10 BIR filing error

**Professional cost range:** Bundled into CPA services (₱2,000-₱5,000/return); Taxumo subscription partly solves this (₱2,499/quarter)

**Computability:** 5/5 — Fully deterministic. Form selection is a finite state machine based on taxpayer attributes.

**Pain:** 4/5 — Three nearly identical individual ITRs (1700/1701/1701A); four corporate variants (1702-RT/MX/EX/Q); no official BIR decision tree exists; EOPT Act (2024) changed requirements.

---

#### B2. BIR Penalty and Interest Calculator

**Description:** Exact computation of surcharges, interest, and compromise penalties for any late-filed or late-paid BIR return, accounting for the two-tier EOPT penalty system (reduced rates for micro/small taxpayers vs. standard rates for others).

**Governing law:** NIRC Sec. 248 (surcharge: 10% micro/small per EOPT, 25% standard, 50% fraud); Sec. 249 (interest: 6% micro/small, 12% standard); RA 11976 Sec. 13; RMO 7-2015 (compromise penalty schedule)

**Source aspects:** bir-forms-catalog (D2)

**Market size:** Even at 10% late-filing rate × 5.7M registered taxpayers = ~570K penalty computations annually; BIR audit assessments generate additional disputes

**Professional cost range:** ₱5,000-₱50,000+ per remediation engagement (CPA/lawyer)

**Computability:** 5/5 — Fully deterministic. Surcharge rates, interest rates, and compromise schedules are all defined by statute/regulation.

**Pain:** 4/5 — EOPT Act (2024) created two-tier system that confuses everyone; no official BIR penalty calculator; taxpayers discover penalty amount only when BIR assessment arrives.

---

#### B3. Multi-Form Compliance Calendar Engine

**Description:** Generate a complete annual BIR filing calendar — including all required forms, deadlines, and filing channel requirements — tailored to a specific taxpayer profile.

**Governing law:** BIR Tax Calendar; RA 11976; RR 11-2018; various RMCs for deadline extensions

**Source aspects:** bir-forms-catalog (D3)

**Market size:** 1.24M registered businesses; corporations face 15-25 cross-agency deadlines per year; self-employed have 5-12 annual BIR deadlines

**Professional cost range:** Monthly bookkeeping retainers (₱3,000-₱15,000/month) heavily include calendar management

**Computability:** 5/5 — Fully deterministic. Deadlines are statutory formulas from taxpayer profile + calendar.

**Pain:** 4/5 — BIR discontinued printed tax calendars in 2026 (digital-only); missing a single deadline triggers surcharge+interest; multi-channel filing (eFPS/eBIRForms) with different deadlines.

---

#### B4. Withholding Tax Agent Compliance Engine

**Description:** End-to-end computation and tracking of all withholding tax obligations: compensation withholding (1601C → 2316 → 1604C), expanded withholding (0619E → 1601EQ → 1604E), and final withholding (0619F → 1601FQ → 1604F).

**Governing law:** NIRC Sec. 57-58; RR 2-98 (EWT rates — 40+ categories: 1%, 2%, 5%, 10%, 15%); RR 11-2018; BIR Forms 1601C, 1601EQ, 0619E, 2307, 2316, 1604C/E/F

**Source aspects:** nirc-income-tax (D6), bir-forms-catalog (D4)

**Market size:** ~1.24M registered employer-businesses file withholding returns; 200,000-800,000 businesses issue BIR 2307s monthly; 28M employees receive 2316s annually

**Professional cost range:** Monthly bookkeeping: ₱3,000-₱15,000/month; standalone alphalist: ₱5,000-₱20,000/filing

**Computability:** 4/5 — Mostly deterministic. Rates are regulation-defined; the pain point is correctly classifying each payment into one of 40+ EWT rate categories (a decision-tree problem, not a judgment problem).

**Pain:** 5/5 — Monthly filing burden + 40+ EWT rate categories + alphalist generation + 2307 issuance tracking + BIR cross-referencing creates massive compliance friction. BIR cross-references alphalists against individual payee returns, causing audit notices on both sides for mismatches.

---

#### B5. Quarterly Income Tax + Annual Reconciliation Engine

**Description:** Compute quarterly income tax installments using the cumulative subtraction method, then reconcile quarterly payments and creditable withholding taxes against annual tax liability to determine final payable/refundable.

**Governing law:** NIRC Sec. 74-77 (individual quarterly IT); Sec. 75-76 (corporate quarterly IT); Sec. 56(B) (installment option); BIR Forms 1701Q, 1702Q; RR 12-2018

**Source aspects:** nirc-income-tax (D7), bir-forms-catalog (D6)

**Market size:** 2-4M self-employed (filing 1701Q) + 527K+ corporations (filing 1702Q) = 2.5-4.5M reconciliation events per year

**Professional cost range:** Included in annual return preparation (₱5,000-₱30,000 for corporations; ₱2,000-₱10,000 for individuals)

**Computability:** 5/5 — Fully deterministic. Cumulative subtraction method is pure arithmetic.

**Pain:** 4/5 — Mismatch between quarterly payments and annual tax is the #1 source of BIR assessment letters; creditable withholding from multiple 2307 sources must be tracked; prior-year excess credit election is irrevocable.

---

#### B6. BIR Certificate (2307/2316) Tracker and Generator

**Description:** Track, generate, and reconcile BIR withholding tax certificates — 2307 (expanded WT) issued to suppliers, and 2316 (compensation) issued to employees — across all counterparties for a taxable year.

**Governing law:** NIRC Sec. 58(A); RR 2-98 Sec. 2.58; RR 11-2018; BIR Forms 2307, 2316

**Source aspects:** bir-forms-catalog (D7)

**Market size:** 500K-800K withholding agents issue 2307s; 28M+ employees receive 2316s; total individual 2307 certificates estimated in the tens of millions annually

**Professional cost range:** Bundled with bookkeeping; not separately priced, but tracking adds 2-5 hours/month of labor per SME

**Computability:** 4/5 — Certificate generation is mechanical (rate × amount). Challenge is data aggregation and counterparty matching, not arithmetic.

**Pain:** 4/5 — Chasing 2307s from withholding agents is perennial; missing 2307s = unclaimed tax credits; BIR cross-reference matching causes audit notices for discrepancies; no standard digital format for 2307 exchange.

---

#### B7. eBIRForms / eFPS Filing Automation Bridge

**Description:** Auto-populate BIR electronic forms from accounting data, eliminating manual re-entry. Targets the forms still not served by Taxumo/JuanTax: capital gains (1706/1707), DST (2000/2000-OT), donor's tax (1800), and form validation.

**Governing law:** RA 11976 (EOPT — electronic filing mandated); BIR eBIRForms; eFPS

**Source aspects:** bir-forms-catalog (D8)

**Market size:** 5.7M registered taxpayers; eBIRForms used by majority

**Professional cost range:** CPA form preparation: ₱500-₱2,000 per form; Taxumo/JuanTax: ₱5,496-₱16,992/year

**Computability:** 5/5 — Form population is a pure mapping function from accounting data to form fields.

**Pain:** 4/5 — eBIRForms is a legacy Java app that crashes; no data import from accounting software; validation is minimal; partial coverage by existing tools (gaps in CGT/DST/1800 forms).

**Note:** This is the most commercially active domain (Taxumo, JuanTax already serve much of it). The gap is the integration bridge and the uncovered form types. Lower standalone priority.

---

### CATEGORY C: TRANSFER & TRANSACTION TAXES (5 domains)

---

#### C1. Donor's Tax Calculator (BIR Form 1800)

**Description:** Computation of the 6% flat donor's tax on net gifts exceeding ₱250,000 in a calendar year, with cumulative YTD tracking (multiple donations in a year compound), FMV determination for real property, and the BIR CAR process for title transfer.

**Governing law:** NIRC Sec. 98-104 (Title III — Transfer Taxes); Revenue Regulations No. 12-2018; BIR Form 1800

**Source aspects:** nirc-other-taxes (D1)

**Market size:** 50,000-200,000 annual donor's tax filers; ~600K property title transfers annually (significant fraction involve donation or part-donation)

**Professional cost range:** ₱5,000-₱25,000 (lawyer/CPA preparation) + notarization 1-2% of property value; total ₱20,000-₱80,000 for mid-value donation

**Computability:** 5/5 — Fully deterministic. Net gift → 6% × excess over ₱250K threshold → subtract prior same-year taxes paid. The computation is trivial; the "professional value" is navigating the multi-agency BIR CAR process.

**Pain:** 4/5 — 30-day filing deadline; title transfer blocked without BIR CAR; most Filipinos confuse inter-vivos donation with estate transfer; 25% surcharge + 12% interest for late filing.

---

#### C2. VAT Computation Engine

**Description:** Monthly/quarterly computation of output VAT (12% of taxable sales), input VAT credits (from purchases), net VAT payable, and carry-forward tracking, including proportional input allocation for mixed taxable/zero-rated/exempt transactions.

**Governing law:** NIRC Sec. 105-115 (Title IV); RR 3-2024 (EOPT VAT implementation); BIR Forms 2550M, 2550Q

**Source aspects:** nirc-other-taxes (D2)

**Market size:** 500,000-700,000 VAT-registered businesses; 2-3 million VAT return filings per year; BIR collected ~₱475B in VAT revenues in 2023

**Professional cost range:** ₱3,000-₱15,000/month bookkeeping with VAT; ₱36,000-₱180,000/year total compliance cost for simple VAT-registered SME

**Computability:** 4/5 — Mostly deterministic. Standard output/input computation is fully algorithmic. Complications in mixed-use input allocation, zero-rated vs. exempt classification, and digital services VAT (new Oct 2024 rule) add complexity but not fundamental unresolvability.

**Pain:** 4/5 — Quarterly filing deadlines; input VAT carry-forward tracking; BIR audits focus heavily on VAT; new 12% VAT on foreign digital services (Oct 2024) added complexity for businesses using SaaS.

**Note:** This domain is partially served by JuanTax and Taxumo for standard cases. The gap is mixed-use allocation and VAT refund claims (see C3).

---

#### C3. VAT Refund Claims Engine (NIRC Sec. 112)

**Description:** Computation and assembly of input VAT refund claims for zero-rated sellers (exporters, BPO/IT-BPM companies, ecozone locators) — including input tax attribution to zero-rated sales, 2-year prescriptive period tracking, and the 90-day processing computation.

**Governing law:** NIRC Sec. 112; Revenue Regulations No. 14-2020; BIR Form 1914; EOPT Act (RA 11976, reduced processing to 90 days)

**Source aspects:** nirc-other-taxes (D3)

**Market size:** 10,000-50,000 refund applications per year; IT-BPO sector alone ($30B+ revenues, all zero-rated for VAT) represents massive refund pool

**Professional cost range:** 3-10% of refund amount (success fee) OR ₱200,000-₱2M+ flat for large claims (Big 4 / specialist firms)

**Computability:** 3/5 — Moderately deterministic. Attribution computation is statute-defined. The documentation assembly (invoice-by-invoice matching) is the real pain, not the math itself. A tool that tracks input VAT by transaction code and generates the attribution schedule would be high-value.

**Pain:** 5/5 — Historically backlogged; 2-year prescriptive period forfeiture risk; documentation requirements are burdensome; high-value per engagement.

---

#### C4. Documentary Stamp Tax (DST) Engine

**Description:** Computation of DST on any taxable document per the NIRC rate schedule — including loan agreements, deeds of sale (real property), share issuances, lease agreements, mortgages — with the 5-day monthly filing deadline.

**Governing law:** NIRC Sec. 173-201 (Title VII); RR 4-2024 (EOPT implementation); BIR Forms 2000 (monthly), 2000-OT (one-time transactions)

**Source aspects:** nirc-other-taxes (D5), corporation-code (D4 cross-reference)

**Market size:** Real property transactions: 400K-600K/year; loan transactions: millions (private loans mostly non-compliant); share issuances: 50K-100K/year; lease agreements: millions annually

**Professional cost range:** Bundled in real estate/corporate transaction services; private loan DST often not computed at all → penalty exposure

**Computability:** 5/5 — Fully deterministic. NIRC provides exact rate for each instrument type. DST = transaction value / rate unit × rate per unit.

**Pain:** 3/5 — Tight 5-day deadline after month of execution; common error (installment sale DST should be on full contract, not installments); private loans often completely ignore DST; inadmissibility penalty (court cannot admit unstamped documents) is severe.

---

#### C5. Property Transfer Tax Bundler

**Description:** Single-entry computation of ALL taxes and fees triggered by a Philippine real property sale — Capital Gains Tax (BIR), Documentary Stamp Tax (BIR), Local Transfer Tax (LGU), Registry of Deeds Registration Fee — using three different valuation bases, with timeline and multi-agency navigation.

**Governing law:** NIRC Sec. 24(D) (6% CGT); Sec. 196 (1.5% DST); RA 7160 Sec. 135 (LGU Transfer Tax ≤0.5-0.75%); LRA registration fee schedule; PD 1529

**Source aspects:** lgu-real-property (D3)

**Market size:** 100,000-300,000+ residential + 20,000-50,000 commercial real property transactions annually; each requires 4 computations across 2+ agencies

**Professional cost range:** ₱15,000-₱80,000 per transaction (real estate lawyer); sellers routinely underestimate total transfer cost (typically 8-10% of sale price all-in)

**Computability:** 4/5 — Each individual tax is fully deterministic. Complexity: three agencies use three different valuation bases (BIR zonal value vs. LGU FMV vs. ROD schedule). The bundle adds value precisely because professionals currently arbitrage this complexity.

**Pain:** 4/5 — Multi-agency (BIR + LGU Treasurer + Registry of Deeds + Notary = 4 stops); deadline pressure (30-day CGT from notarization date); different FMV bases create confusion; wrong tax base triggers 25% surcharge + 20% interest.

---

### CATEGORY D: LABOR & EMPLOYMENT (9 domains)

---

#### D1. Multi-Factor Payroll Premium Computation

**Description:** Computation of premium pay when multiple factors apply simultaneously — holiday type (regular vs. special), rest day, overtime, and night shift — using the compounding multiplier matrix from the Labor Code.

**Governing law:** Labor Code Art. 83 (normal hours), Art. 86 (night shift differential +10%), Art. 87 (overtime +25%/+30%), Art. 91 (rest day); DOLE Omnibus Rules Book III; annual DOLE holiday proclamations

**Source aspects:** labor-code-wages (D1)

**Market size:** ~38M private-sector employees; ~1M+ employers computing payroll monthly; BPO sector (1.4M workers, predominantly night shift) faces NSD computation on virtually every payroll run

**Professional cost range:** Cloud HR/payroll software ₱400-₱2,000/employee/month; payroll outsourcing USD $20-$250/employee/month; in-house HR specialist ₱19,000-₱29,000/month

**Computability:** 5/5 — Fully deterministic. The rate matrix is entirely statutory (percentages defined in specific articles). Holiday classification is from official proclamations. Every combination of factors has an exact rate.

**Pain:** 4/5 — Multi-factor stacking (holiday × OT × NSD) is the most-cited DOLE violation source; Philippine holiday calendar changes annually and includes proclamation-added dates; "double holiday" scenarios remain contentious.

---

#### D2. 13th Month Pay Computation

**Description:** Computation of mandatory annual 13th month pay for all private-sector rank-and-file employees: total basic salary ÷ 12, with pro-rating for partial-year employees, identification of "basic salary" vs. excluded items, and the ₱90,000 tax exemption threshold.

**Governing law:** PD 851 (1975); RA 10653 (₱90,000 tax exemption); DOLE Labor Advisory No. 18 series (annual implementation)

**Source aspects:** labor-code-wages (D2)

**Market size:** All private-sector rank-and-file employees (~30-35M); ~1M+ private employers must compute, pay, and report by December 24 each year

**Professional cost range:** Bundled in payroll; errors trigger DOLE complaints → back-pay claims + penalties

**Computability:** 4/5 — Mostly deterministic. Pro-rating and tax exemption interaction are mechanical. Only judgment: "basic salary" inclusion/exclusion (allowances vs. base pay), which has DOLE guidelines but generates disputes at the margins.

**Pain:** 4/5 — One of the most-reported DOLE violations; "basic salary" definitional confusion; pro-rating formula for partial-year employees is widely misunderstood.

---

#### D3. Final Pay Computation

**Description:** Upon any employment separation (resignation, authorized termination, end of contract, retirement), compute all final pay components: unpaid wages + pro-rated 13th month + SIL cash conversion + separation pay (if applicable) + any other unpaid benefits. DOLE requires release within 30 days.

**Governing law:** DOLE Labor Advisory No. 06-20 (30-day rule); PD 851 (13th month pro-rating); Art. 95 (SIL conversion); Art. 298-299 (separation pay if applicable)

**Source aspects:** labor-code-wages (D3 + D4)

**Market size:** Millions of employment separations per year across BPO, retail, food service, construction, domestic work sectors

**Professional cost range:** Contested final pay is a major NLRC case source; uncontested cases are typically in-house; disputes → ₱5,000-₱30,000 NLRC filing fees + lawyer costs

**Computability:** 5/5 — Fully deterministic given clean inputs (employment dates, salary records, leave balances). All components are statutory formulas.

**Pain:** 5/5 — DOLE LA 06-20 (2020) created 30-day release deadline; small employers routinely miss SIL cash conversion and pro-rated 13th month; no public tool for employees to verify their final pay; NLRC is the primary resolution venue.

---

#### D4. Retirement Pay Calculator (RA 7641 — 22.5 Days Formula)

**Description:** Computation of statutory minimum retirement benefit under RA 7641 using the non-intuitive "one-half month salary = 22.5 days" formula, for employees aged 60-65 with ≥5 years of service.

**Governing law:** RA 7641 (1992), amending Art. 302 (formerly Art. 287) Labor Code; DOLE Guidelines on RA 7641; Elegir v. Philippine Airlines (SC affirmation of 22.5-day definition)

**Source aspects:** labor-code-termination (D2)

**Market size:** Hundreds of thousands of retirement events annually; PSA projects 60+ population to reach ~9M by 2030

**Professional cost range:** ₱5,000-₱25,000 per computation (labor lawyer/HR consultant); NLRC attorney's fees 10% of award if disputed

**Computability:** 5/5 — Fully deterministic. Formula: Monthly Salary ÷ 26 × 22.5 × Credited Years of Service. All inputs are factual; all computation is arithmetic.

**Pain:** 5/5 — This is the **inheritance engine equivalent for employment** — the "22.5 days" definition is a statutory term of art that directly contradicts "half month" plain reading. HR professionals routinely use 15 days (underpaying by 33%). A 30-year employee at ₱35,000/month is owed ₱909,000 at the correct rate vs. ₱607,000 at the wrong rate — a ₱302,000 underpayment due to pure arithmetic error.

---

#### D5. Separation Pay Calculator (Authorized Causes)

**Description:** Computation of statutory separation pay when an employer terminates for an authorized business cause (redundancy, labor-saving devices, retrenchment, closure, disease), selecting the correct formula (1 month vs. ½ month per year) and applying the 6-month rounding rule.

**Governing law:** Art. 298 (authorized causes — redundancy: 1 month/year; retrenchment/closure: ½ month/year); Art. 299 (disease: ½ month/year); DOLE Department Orders

**Source aspects:** labor-code-termination (D1)

**Market size:** 500,000+ authorized separations annually; COVID-era saw 10M+ job losses; every MSME closure requires this computation for each affected employee

**Professional cost range:** ₱5,000-₱50,000 per retrenchment engagement (labor lawyer); ₱3,000-₱15,000 for HR consultant generating separation pay schedule

**Computability:** 5/5 — Fully deterministic. Cause → formula mapping is defined by statute. The 6-month rounding rule (round up at 6+ months) is explicit. Once cause is classified, computation is pure arithmetic.

**Pain:** 4/5 — Wrong formula selection (½ vs. 1 month) is the most common error; COLA integration into salary base is frequently missed; 30-day final pay rule creates deadline pressure.

---

#### D6. Back Wages Risk Assessment (Illegal Dismissal)

**Description:** Computation of expected back wages exposure for illegal dismissal cases — for employers assessing pre-termination risk, and for employees estimating their entitlement — including back wages from dismissal to judgment, separation pay in lieu, attorney's fees (10%), and Nacar legal interest.

**Governing law:** Art. 294 (security of tenure + full back wages); Art. 111 (10% attorney's fees); BSP Circular 799 / Nacar doctrine (6% p.a. interest from finality)

**Source aspects:** labor-code-termination (D3)

**Market size:** 100,000-150,000 NLRC cases annually; illegal dismissal = majority of NLRC docket

**Professional cost range:** ₱30,000-₱200,000+ attorney's fees (typically 10% of award, which can reach millions); ₱5,000-₱30,000 per "risk exposure" memo from HR consultant

**Computability:** 3/5 — The determination of illegal dismissal requires judicial judgment; however, the **computation of back wages given established facts** is fully deterministic. Use case: pre-termination risk modeling, pre-filing claimant assessment.

**Pain:** 5/5 — Employers routinely underestimate back wages exposure; 6% compounding interest from finality creates exponential liability for delayed execution; multi-year case timelines dramatically inflate totals.

---

#### D7. Mandatory Government Contributions Calculator (SSS / PhilHealth / Pag-IBIG)

**Description:** Monthly computation of employer and employee shares for all three mandatory contribution schemes — SSS (graduated 31-bracket table, 15% total 2025), PhilHealth (5% with ₱10K-₱100K floor/cap), and Pag-IBIG (1-2% with ₱5K cap) — with remittance deadlines and annual contribution limits.

**Governing law:** RA 11199 (SSS Act 2018; 15% total contribution 2025); RA 11223 (Universal Health Care — 5% PhilHealth 2025); RA 9679 (Pag-IBIG/HDMF); SSS Circular 2023-033; PhilHealth Circular 2024-0009; HDMF Circular 472

**Source aspects:** labor-code-wages (D6), dole-compliance (D6)

**Market size:** All employers with employees — 1.24M establishments; ~28M employees requiring 3 agency computations monthly = ~84M individual contribution computations per month

**Professional cost range:** Bundled into payroll services (₱400-₱2,000/employee/month software; ₱1,000-₱5,000/employee/month outsourced)

**Computability:** 5/5 — Fully deterministic. SSS uses a 31-bracket lookup table; PhilHealth is 5% with floor/cap; Pag-IBIG has one ₱1,500 threshold breakpoint.

**Pain:** 3/5 — Rates change frequently (SSS contribution went from 14% to 15% in 2025; PhilHealth from 4.5% to 5%); micro establishments (90.4% of all) most likely to compute manually; non-remittance triggers 3%/month SSS penalties.

---

#### D8. Minimum Wage Compliance Checker

**Description:** Verify current applicable minimum wage for a specific employee based on region, sector (agriculture vs. non-agriculture), establishment size, and effective date — plus compute back-pay exposure for any underpayment.

**Governing law:** Art. 99 Labor Code; RA 6727 (Wage Rationalization Act); Regional Tripartite Wage Board orders (e.g., NCR Wage Order No. 26: ₱695/day non-agri, ₱658/day agri, effective July 18, 2025)

**Source aspects:** labor-code-wages (D5)

**Market size:** 5.2M workers affected by 2025 wage increases across 14 regions; every private employer must comply; different rates per region for multi-site employers

**Professional cost range:** Labor standards audits bundled in retainers at ₱15,000-₱50,000/month; DOLE inspections can trigger back-pay awards

**Computability:** 5/5 — Fully deterministic. Wage order text specifies exact amounts by region/sector/size. The data retrieval (current applicable rate for a given location/sector) is the main engineering challenge.

**Pain:** 3/5 — Regional variation creates compliance burden for multi-site employers; frequent wage order updates require monitoring; but the computation itself (applicable rate × days worked) is simple once the right rate is known.

---

#### D9. SEnA Monetary Claims Calculator

**Description:** Pre-conciliation computation tool for the DOLE Single Entry Approach (SEnA) process — calculates the exact peso amount a worker is owed across all applicable claim types (wage underpayment, OT, 13th month, SIL, separation pay, contributions) plus legal interest, strengthening settlement negotiations.

**Governing law:** RA 10396 (SEnA Act 2013); DOLE SEnA Rules; Labor Code (underlying claim computations); BSP Circular 799 (6% legal interest); 3-year prescriptive period for monetary claims

**Source aspects:** dole-compliance (D9)

**Market size:** 40,000-60,000 SEnA cases nationally per year; 2022 data: 14,960 workers received ₱618M through SEnA; workers without computation tools settle 20-40% below statutory entitlement

**Professional cost range:** SEnA filing is free (RA 10396); labor lawyer: ₱5,000-₱20,000/case; most workers go unrepresented

**Computability:** 5/5 — Fully deterministic. Every SEnA monetary claim type maps to a statutory formula. Total claim = statutory entitlement − actual received + 6% interest from demand date.

**Pain:** 4/5 — Workers file without knowing their claim amount; employers leverage information asymmetry during the 30-day conciliation; multiple claim types compound; prescriptive period spans wage order changes requiring historical computation.

---

### CATEGORY E: CORPORATE & SEC COMPLIANCE (6 domains)

---

#### E1. SEC Compliance Navigator & Penalty Engine

**Description:** Determine a corporation's SEC compliance status (good standing / non-compliant / delinquent / suspended / revoked), compute the full penalty exposure under MC-6-2024's tiered matrix, evaluate ECIP savings vs. full-penalty path, and generate a prioritized remediation plan.

**Governing law:** RA 11232 Sec. 177; SEC MC No. 6, Series of 2024 (penalty matrix); SEC MC No. 13, Series of 2024 (ECIP); SEC MC No. 19, Series of 2023 (delinquency/revocation)

**Source aspects:** corporation-code (D2), sec-filings-catalog (D1, D5)

**Market size:** 117,885 corporations suspended in a single Feb 2024 order; ongoing 100K-200K corporations in various stages of non-compliance; all 527,710 active corporations need compliance monitoring

**Professional cost range:** Corporate remediation: ₱50,000-₱200,000+ per engagement; ECIP facilitation services: ₱15,000-₱50,000+ (on top of ₱20,000 ECIP fee); corporate secretary retainer: ₱36,000-₱300,000/year

**Computability:** 5/5 — Fully deterministic. Status classification is a pure decision tree from filing history. Penalty computation is table lookup + arithmetic. ECIP comparison is simple cost comparison.

**Pain:** 5/5 — 117,885 suspended at once; corporations cannot easily self-assess status; penalty matrix spans 8 tables; ECIP mechanics require professional facilitation; non-compliance blocks banking and property transactions.

---

#### E2. SEC Corporate Lifecycle Fee Engine

**Description:** Compute all SEC government fees for any corporate action across the full lifecycle — incorporation, capital increase/decrease, amendments, conversions, mergers, dissolutions, plus associated DST and Legal Research Fee.

**Governing law:** RA 11232; SEC MC No. 9, Series of 2017 (fees); SEC MC No. 3, Series of 2017 (Consolidated Schedule); NIRC Sec. 175 (DST on shares)

**Source aspects:** corporation-code (D1), sec-filings-catalog (D2)

**Market size:** 52,304 new incorporations (2024) + ~30K-40K amendments + ~10K-20K dissolutions + ~5K-10K mergers/conversions = ~100K-120K fee computations annually

**Professional cost range:** Law firms: ₱15,000-₱100,000+ per corporate action; actual SEC fees are modest (₱3,000-₱30,000); professional fees are the markup on trivial arithmetic

**Computability:** 5/5 — Fully deterministic. All formulas defined by SEC memorandum circular. "Whichever is higher" comparisons + minimum floor calculations are pure arithmetic.

**Pain:** 3/5 — Different formulas for par-value vs. no-par-value; minimum fee floors not obvious; DST on shares frequently forgotten; SEC eSPARC shows fees only after submission (no pre-computation tool).

---

#### E3. HARBOR Beneficial Ownership Filing Wizard

**Description:** Guide corporations through the new 2026 HARBOR (Hierarchical and Applicable Relations and Beneficial Ownership Registry) system — trace ownership through corporate layers via percentage multiplication, determine ≥25% beneficial owners, and generate compliant filings with 7-day change monitoring.

**Governing law:** SEC MC No. 15, Series of 2025 (effective Jan 1, 2026); HARBOR system (launched Jan 30, 2026); RA 11232 Sec. 26; AMLA

**Source aspects:** corporation-code (D6), sec-filings-catalog (D3)

**Market size:** All 527,710+ active corporations must comply; ~80K-100K with moderate structure (holding company + subsidiaries); ~20K-50K with complex multi-layer structures requiring real professional engagement

**Professional cost range:** Complex group disclosures: ₱50,000-₱200,000+ per group; simple structures bundled in secretary retainer

**Computability:** 4/5 — Ownership percentage tracing through layers is pure arithmetic (matrix multiplication). The judgment element is identifying "control through other means" (without formal ownership percentage), which covers a minority of cases.

**Pain:** 5/5 — Brand new system (launched Jan 30, 2026); BO disclosure removed from GIS (now a separate filing); penalties dramatically increased (₱50K-₱1M for non-disclosure, ₱1M + 5-year officer disqualification for false declarations); 7-day change window extremely tight for large groups.

---

#### E4. AFS Filing Threshold & Requirement Engine

**Description:** Determine which financial statement tier applies to a corporation — full PFRS audit (assets/liabilities >₱3M), PFRS for SMEs review (<₱3M, NEW threshold effective Dec 31, 2025), or SRC-mandated statements — compute the exact filing deadline (including registration-number-based staggering), and list required attachments.

**Governing law:** SEC MC No. 1, Series of 2025; SRC Rule 68.1; SEC MC No. 2, Series of 2024 (AFS deadlines); new ₱3M threshold (raised from ₱600K, effective Dec 31, 2025)

**Source aspects:** sec-filings-catalog (D4)

**Market size:** All 527,710+ active corporations file AFS; the ₱600K→₱3M threshold change means thousands of small corporations may now qualify for reviewed (not audited) FS, saving ₱20K-₱100K+ in audit fees — but most don't know about the change

**Professional cost range:** External audit: ₱30,000-₱300,000+ depending on size; reviewed FS: ₱15,000-₱50,000; auditors have a financial interest in recommending full audits even when not required

**Computability:** 5/5 — Fully deterministic. Threshold comparisons + deadline computation from registration number/fiscal year + document requirements are all rule-based lookups.

**Pain:** 4/5 — Major threshold change (₱600K → ₱3M) poorly publicized; small corporations overpay for full audits; registration-number staggering is unintuitive; eFAST format requirements cause rejections.

---

#### E5. Capital Increase / Decrease Filing Engine

**Description:** Compute all fees, DST, and 25%-25% rule requirements for corporate capital amendments — including the critical rule that the 25%-25% minimum subscription applies only to the INCREMENT, not the total post-increase ACS.

**Governing law:** RA 11232 Sec. 37 (capital increase); Sec. 38 (capital decrease); SEC MC No. 9 (amendment fee schedule); NIRC Sec. 175 (DST on new shares)

**Source aspects:** corporation-code (D3)

**Market size:** Estimated 30K-40K capital amendments annually; every growing company onboarding investors, satisfying minimum capital requirements, or restructuring ownership

**Professional cost range:** Law firm: ₱15,000-₱80,000; compliance provider: ₱8,000-₱30,000

**Computability:** 5/5 — Fully deterministic. The 25%-25% rule applied to increment only, amendment fee (0.2% of increase), LRF (1% of filing fee), and DST on new shares are all pure arithmetic.

**Pain:** 3/5 — Moderate; the increment-vs-total error is the key trap; no-par value shares have different fee basis; bank certificate requirement adds a banking step.

---

#### E6. OSH Staffing Requirements & Penalty Engine

**Description:** Determine required safety officer levels, count of safety officers, occupational health personnel, and safety committee composition based on employee count and DOLE risk classification — then compute administrative fine exposure for non-compliance with the tiered penalty matrix.

**Governing law:** RA 11058 Sec. 5-6; DO 252-25 (revised IRR, effective May 16, 2025); OSHS Rule 1030/1040; DO 198-18 Rule VI (penalty matrix per prohibited act)

**Source aspects:** dole-compliance (D1, D2)

**Market size:** 1.24M establishments; active compliance-critical segment: ~120K small/medium/large establishments; DOLE inspected 33,007 establishments in 2025 + 168,100 Technical Advisory Visits

**Professional cost range:** OSH consulting initial assessment: ₱15,000-₱50,000; ongoing compliance management: ₱5,000-₱25,000/month; penalties ₱20,000-₱100,000/day for non-compliance

**Computability:** 5/5 — Staffing requirements are pure lookup table (risk class + employee count = exact requirements). Penalty computation is tiered-rate arithmetic (violation type → daily fine → escalation for repeats + concurrent violations capped at ₱100K/day).

**Pain:** 4/5 — DO 252-25 changed requirements in May 2025 creating confusion; DOLE has only 574 inspectors for 1.2M+ establishments so violations often undiscovered until inspection; daily fines accrue rapidly; 20% of establishments fail initial inspection.

---

### CATEGORY F: PROPERTY & REAL ESTATE (4 domains)

---

#### F1. Real Property Tax (RPT) + SEF Calculator

**Description:** Compute annual RPT and Special Education Fund levy for any property in the Philippines based on classification, fair market value, LGU location, and RPVARA transition rules — including delinquency penalties (2%/month, 72% cap) and early-payment discounts.

**Governing law:** RA 7160 Sec. 218, 232-255; RA 12001 (RPVARA 2024); BLGF Memorandum Circular No. 003-2025

**Source aspects:** lgu-real-property (D1)

**Market size:** 35-45 million real property units; ₱113.4B in annual RPT collection; ~97 cities and 40 provinces non-compliant with revaluation cycle as of 2024

**Professional cost range:** Property tax consultants: ₱5,000-₱25,000 for assessment review; RPVARA amnesty facilitation (new): ₱10,000-₱50,000 per delinquent account

**Computability:** 5/5 — Fully deterministic. Assessment Level × FMV = Assessed Value; AV × rate = RPT. Delinquency penalty = 2%/month × N months (max 72%).

**Pain:** 3/5 — LGU variation (1,600+ LGUs with own SMVs) is the main friction; RPVARA transition confusion; delinquency snowball effect; primary computation is handled by LGU assessors, so pain is strongest at portfolio management and amnesty decision.

---

#### F2. Local Business Tax + Business Permit Calculator

**Description:** Compute annual Local Business Tax (LBT) on prior-year gross sales, plus all ancillary business permit fees (mayor's permit, fire safety, sanitary, barangay clearance) across any LGU, with multi-branch allocation rules.

**Governing law:** RA 7160 Sec. 143-152; Local Revenue Codes of each LGU; LFC 001-2022 (multi-branch allocation)

**Source aspects:** lgu-real-property (D2)

**Market size:** 1.24M registered establishments; all must renew business permits annually by January 20; multi-branch businesses: 50K-100K entities across 2+ LGUs

**Professional cost range:** Bookkeeper/accountant for LBT: ₱3,000-₱15,000/year; business permit fixers: ₱2,000-₱10,000 per LGU

**Computability:** 3/5 — Formula structure is 5/5 deterministic (gross sales × rate). The challenge: 1,600+ LGUs each have own rate schedules; building and maintaining that LGU rate database is the technical moat. Core calculation is trivial once rates are known.

**Pain:** 4/5 — January 20 deadline creates annual compliance crunch; LGU variation creates genuine confusion for multi-site businesses; "hidden fees" problem (final permit bill surprises owners); multi-branch allocation rules widely misunderstood.

---

#### F3. RPVARA Tax Amnesty Calculator

**Description:** For delinquent real property tax accounts, compute the accumulated principal vs. penalties/surcharges/interest (waived under RA 12001 amnesty), the amnesty savings, and the countdown to the July 5, 2026 deadline.

**Governing law:** RA 12001 Sec. 30; BLGF Memorandum Circular No. 003-2025

**Source aspects:** lgu-real-property (D4)

**Market size:** Conservative estimate: 2-5 million delinquent property accounts eligible for amnesty; amnesty window closes July 5, 2026

**Professional cost range:** RPVARA amnesty facilitation: ₱10,000-₱50,000 per delinquent account; new breed of "amnesty facilitators" emerging post-RA 12001

**Computability:** 5/5 — Fully deterministic. Accumulated principal = sum of unpaid basic RPT + SEF per year. Penalties = 2%/month × N months (capped at 72%) per delinquent year. Amnesty amount = principal only.

**Pain:** 5/5 — **Time-limited:** amnesty closes July 5, 2026 (~17 months from today). Many property owners don't know their delinquency amount or that the amnesty exists. Failure to avail means paying 72% penalty cap. For properties in estate settlements, delinquency blocks title transfer.

---

#### F4. Maceda Law Cash Surrender Value Calculator

**Description:** For real estate installment buyers whose contracts are being cancelled, compute the statutory minimum cash surrender value under RA 6552 (50% of total payments for 2-5 years; +5%/year above 5 years; max 90%), plus the grace period and cancellation validity check.

**Governing law:** RA 6552 Sec. 3(b) (CSV formula); Sec. 3(a) (grace period: 1 month/year of installment); Sec. 4 (<2 years: 60-day notice, no CSV); Sec. 6 (waiver clauses void)

**Source aspects:** maceda-law-real-estate (D1, D2)

**Market size:** 150,000-250,000 residential installment units sold annually; 15-25% of installment contracts eventually cancel; conservative estimate 20,000-80,000 CSV computation events per year; millions of Filipinos carrying installment contracts who could proactively check their rights

**Professional cost range:** ₱15,000-₱50,000+ lawyer acceptance fee for DHSUD/HSAC complaint; total legal spend for contested CSV refund: ₱30,000-₱100,000+

**Computability:** 5/5 — Fully deterministic. Inputs: total payments + years of installment. Output: exact CSV peso amount from a statutory percentage table. No judicial discretion in the formula itself.

**Pain:** 4/5 — Buyers systematically accept CSV refunds below the statutory floor; developers issue improper cancellations (via text message, not notarial act) and buyers don't know it's legally defective; Sec. 6 voiding clause is widely unknown. This is the **strongest consumer empowerment use case** in the survey — identical to the inheritance engine thesis.

---

### CATEGORY G: CIVIL & FAMILY LAW (5 domains)

---

#### G1. Legal Interest Computation Engine

**Description:** Multi-period interest computation engine implementing the Nacar / Lara's Gifts Framework — applying the correct rate (12% pre-July 2013, 6% post-July 2013), accrual start rules (demand date vs. judgment date depending on obligation type), Art. 2212 compound interest layer, and post-finality interest — across any Philippine monetary obligation.

**Governing law:** Civil Code Art. 2209/2212/2213; BSP-MB Circular No. 799 (2013); Nacar v. Gallery Frames (G.R. No. 189871, 2013); Lara's Gifts & Decors v. Midtown Industrial Sales (G.R. No. 225433, 2019)

**Source aspects:** civil-code-obligations (D1), labor-code-termination (cross-reference)

**Market size:** 500,000-1M+ interest computation events annually: small claims (P1M limit), regular civil collection suits (~50K-100K/year), NLRC cases (~10K-15K/year with monetary awards), demand letters (multiple of filed cases)

**Professional cost range:** Demand letter with interest computation: ₱5,000-₱25,000 (lawyer); collection suit: ₱20,000-₱50,000+; contingency fee ~25% of recovery

**Computability:** 5/5 — Fully deterministic. Decision tree: obligation type → accrual date → rate by period → Art. 2212 layer → post-finality layer. All inputs are factual dates and amounts.

**Pain:** 4/5 — Nacar has been law since 2013 yet courts regularly receive complaints with wrong interest computations; Art. 2212 compound interest is systematically under-claimed (plaintiffs leave money on the table); 12%→6% transition computation is error-prone.

**Key insight: This is cross-domain infrastructure.** Every other domain in this survey may generate a monetary claim that requires the Legal Interest Engine — labor cases, tax cases, corporate disputes, real property transactions, family law. Building this once serves every other domain.

---

#### G2. Prescriptive Period Deadline Calculator

**Description:** For any civil obligation or cause of action, determine the applicable prescriptive period (written contract: 10 years; oral contract: 6 years; quasi-delict: 4 years; etc.), track interruption events (written demand, court filing, written debtor acknowledgment), and compute whether the claim has prescribed or the safe deadline for the next demand.

**Governing law:** Civil Code Art. 1139-1155 (prescriptive periods and interruption rules); Art. 13 (computation: first day excluded, last day included)

**Source aspects:** civil-code-obligations (D2)

**Market size:** 200,000-500,000 discrete prescription-check events annually across law firms, credit departments, businesses, and individuals

**Professional cost range:** Legal opinion on prescription: ₱2,000-₱5,000; bundled in collection suit intake: ₱20,000-₱50,000 acceptance fee; retainer clock-watching for large portfolios: ₱7,000-₱15,000/month

**Computability:** 5/5 — Fully deterministic. Period type is a statutory lookup table. Interruption events are binary (was it written?). Date arithmetic is straightforward.

**Pain:** 4/5 — Art. 1155 mechanics widely misunderstood (only written demand interrupts, not verbal); prescription defense regularly succeeds in collection suits; a missed prescriptive deadline is permanently fatal — no remedy after the period runs.

---

#### G3. Marital Property Liquidation Engine (ACP/CPG)

**Description:** The 4-step ACP liquidation algorithm (Art. 102) or 8-step CPG liquidation algorithm (Art. 129): classify all assets (exclusive vs. community), pay community debts, return exclusives, and divide net remainder equally — with the mandatory 6-month post-death deadline and Art. 118/120 installment/improvement reimbursement computations.

**Governing law:** Family Code Art. 102/103 (ACP liquidation); Art. 129/130 (CPG liquidation); Art. 91-92 (ACP inclusions/exclusions); Art. 109-120 (CPG classification rules including Art. 118 installments, Art. 120 improvements)

**Source aspects:** family-code (D1, D2)

**Market size:** 371,825 marriages registered in 2024 (each eventually requires liquidation); ~10,000 annulment petitions/year; ~55,000-65,000 deaths of married Filipinos/year triggering post-death liquidation

**Professional cost range:** Annulment (uncontested): ₱100,000-₱400,000 attorney's fees; estate settlement component: ₱50,000-₱200,000; contestation adds ₱200,000-₱500,000+

**Computability:** 4/5 — Mostly deterministic. The liquidation algorithm is mechanical once assets are classified. Art. 118 (installment purchases — ownership vested before/during marriage + reimbursement) and Art. 120 (improvements — ownership follows land, conjugal reimbursed the cost) add complexity but are rule-defined. The judgment element is resolving disputed classifications.

**Pain:** 5/5 — Art. 103 void-transaction deadline (6 months from death) is a compliance time-bomb most surviving spouses don't know about; Art. 118 installment rule widely misunderstood even by lawyers; lawyers charge ₱100K-₱600K for what is fundamentally a classification exercise + two-way accounting split.

---

#### G4. Loss of Earning Capacity (LEC) Calculator

**Description:** Compute loss of earning capacity damages using the Supreme Court's established formula: LEC = (2/3 × (80 − age)) × (gross annual income × 50%), applied in vehicular accident cases, medical malpractice, criminal cases (civil aspect), and CTPL-excess civil liability claims.

**Governing law:** Civil Code Art. 2206 (damages for death); SC jurisprudence — Villa Rey Transit v. Ferrer, Sarkies Tours v. CA, Pereña v. Zarate (establishing the 2/3 × (80-age) × 50% formula); IMC 2024-01 (₱200K CTPL death indemnity)

**Source aspects:** insurance-code (D2)

**Market size:** 200,000-400,000 vehicular accidents annually with bodily injury/death; 20,000-50,000 requiring formal LEC computation; 60,000-200,000 including informal settlement negotiations

**Professional cost range:** Contingency fee: 20-30% of total recovery (including LEC); acceptance fee: ₱20,000-₱50,000; legal opinion on claim value: ₱5,000-₱15,000

**Computability:** 5/5 — Fully deterministic. Given age, gross income, and injury type → three-multiplication output (life expectancy × net annual income) is exact per SC-established formula.

**Pain:** 4/5 — Victims frequently accept 20-40% of statutory entitlement because they don't know the formula; insurance adjusters leverage information asymmetry; indigent victims accept ₱30K CTPL no-fault payout when LEC could be ₱500K-₱2M+.

---

#### G5. Life Insurance Cash Surrender Value Verification

**Description:** Verify whether the CSV offered by a life insurer upon policy surrender meets the statutory minimum under RA 10607: policy reserve minus the lower of (1/5 of reserve) or (2.5% of face amount), minus outstanding policy loans. Includes the Sec. 249 delayed-payment interest penalty (12% p.a. if not paid within 90 days).

**Governing law:** RA 10607 Sec. 227(d) (minimum non-forfeiture value); Sec. 233 (non-forfeiture options); Sec. 237 (policy loan value); IC CL No. 14-93 (Standard Policy Provisions); Sec. 249 (12% delayed claims interest)

**Source aspects:** insurance-code (D1)

**Market size:** 8-12 million individual life insurance policies in force; 400,000-960,000 annual surrender events (industry average 5-8% lapse rate)

**Professional cost range:** No standard market for this service — the moat is pure information asymmetry; actuarial consulting for individual policy review: ₱10,000-₱50,000 (prohibitively expensive relative to most policy CSV amounts)

**Computability:** 4/5 — The statutory floor formula is fully deterministic given inputs. The reserve figure requires accessing the policy's embedded "Table of Non-Forfeiture Values" (which must be included per IC requirements). Non-forfeiture options (reduced paid-up, extended term) require mortality tables (actuarial).

**Pain:** 3/5 — Real financial harm when policies are surrendered below statutory minimum; lapse vs. surrender confusion (letting a policy lapse = zero recovery even when CSV > 0); but moat is informational asymmetry rather than active professional gatekeeping.

---

## Summary Statistics

| Category | Domain Count | High-Computability Domains (4-5/5) | Average Pain Score |
|----------|-------------|-------------------------------------|-------------------|
| A: Income Tax | 5 | 5 | 4.0 |
| B: Tax Administration | 7 | 7 | 4.1 |
| C: Transfer/Transaction Taxes | 5 | 4 | 3.8 |
| D: Labor & Employment | 9 | 8 | 4.1 |
| E: Corporate & SEC | 6 | 6 | 4.2 |
| F: Property & Real Estate | 4 | 4 | 4.0 |
| G: Civil & Family Law | 5 | 5 | 4.2 |
| **TOTAL** | **41** | **39 (95%)** | **4.1** |

---

## Cross-Domain Relationships

The following domains are best understood as a **layered stack**:

```
FOUNDATION LAYER (cross-domain infrastructure):
  G1 Legal Interest Engine — needed by EVERY domain that generates a monetary claim
  G2 Prescriptive Period Calculator — needed by every collection/compliance scenario
  B2 BIR Penalty Calculator — shared across all BIR-reportable domains

TRANSACTION LAYER (triggered by specific events):
  A3 CGT Real Property → C5 Property Transfer Bundler → F1 RPT Calculator
  A4 CGT Shares → C4 DST Engine
  C1 Donor's Tax → C5 Property Transfer Bundler
  F4 Maceda CSV → G1 Legal Interest (on unpaid CSV refund)

EMPLOYMENT LIFECYCLE LAYER:
  D1 Payroll Premiums → D7 Contributions → D2 13th Month → D3 Final Pay
  D5 Separation Pay → D3 Final Pay (includes separation component)
  D4 Retirement Pay → D3 Final Pay (terminal benefit)
  D6 Back Wages → G1 Legal Interest (on back wages award)

CORPORATE COMPLIANCE LAYER:
  E2 Fee Engine → E1 Compliance Navigator → E3 HARBOR BO → E4 AFS Threshold
```

---

*Produced by deduplicate-and-merge. Next step: score-domains (Wave 2 aspect 2).*
