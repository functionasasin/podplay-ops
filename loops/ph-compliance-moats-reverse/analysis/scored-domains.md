# Scored Domains — Philippine Compliance Automation Opportunities

**Produced by:** Wave 2 — score-domains
**Date:** 2026-02-25
**Source:** analysis/master-domain-list.md (41 unique domains across 7 categories)

---

## Scoring Methodology

Each domain is scored on four dimensions, then combined into a weighted opportunity score:

| Dimension | Weight | 1 | 2 | 3 | 4 | 5 |
|-----------|--------|---|---|---|---|---|
| **Market** | 25% | <10K affected/yr | 10K–100K | 100K–500K | 500K–1M | >1M |
| **Moat** | 25% | DIY-able | Online tools exist | Needs CPA/bookkeeper | Needs lawyer/specialist | Specialist + ₱50K+ fees |
| **Computability** | 30% | Requires significant judgment | Mostly judgment + some rules | Rule-heavy + some judgment | Mostly deterministic | Fully deterministic from statute |
| **Pain** | 20% | Simple/fast process | Mildly annoying | Confusing forms/multi-step | Multi-agency + penalties | Multi-agency + high penalties + long timelines |

**Opportunity Score** = (Market × 0.25) + (Moat × 0.25) + (Computability × 0.30) + (Pain × 0.20)

---

## Scored Domain Table

### CATEGORY A: INCOME TAX

| ID | Domain | Market | Moat | Comp | Pain | **Score** |
|----|--------|:------:|:----:|:----:|:----:|:---------:|
| A1 | Individual Self-Employed / Professional IT Optimizer | 5 | 3 | 5 | 4 | **4.30** |
| A2 | Corporate IT — RCIT vs. MCIT Engine | 4 | 4 | 4 | 4 | **4.00** |
| A3 | Capital Gains Tax — Real Property (BIR 1706) | 3 | 5 | 5 | 4 | **4.30** |
| A4 | Capital Gains Tax — Unlisted Shares + DST | 3 | 4 | 5 | 4 | **4.05** |
| A5 | Individual IT — Compensation Earners (BIR 1700) | 5 | 2 | 5 | 3 | **3.85** |

**Scoring notes:**
- **A1**: Market = 5 (2–4M eligible for 8% option + 1.8M registered self-employed). Moat = 3 (CPAs charge ₱3K–₱10K for ITR + ₱5K–₱30K/month bookkeeping). Computability = 5 (three deterministic paths, optimal selection is min() function).
- **A2**: Market = 4 (527K+ active corporations with 1M+ quarterly+annual filing events). Moat = 4 (₱10K–₱30K/month retainer; ₱25K–₱100K annual). Computability = 4 (PEZA/BOI incentive classification is edge case requiring judgment).
- **A3**: Market = 3 (100K–300K formal residential transactions; total 400K–600K title transfers). Moat = 5 (bundled in ₱30K–₱150K full conveyancing service). Computability = 5 (pure MAX() and 6% arithmetic). Pain = 4 (30-day deadline; 25% surcharge for late filing).
- **A4**: Market = 3 (hundreds of thousands of unlisted share transfers but difficult to count accurately). Moat = 4 (₱3K–₱15K simple; ₱30K–₱200K+ complex restructuring). Computability = 5 (CGT = 15% × net gain; DST = ceiling(par/200) × ₱1.50).
- **A5**: Market = 5 (3–5M non-substituted filers). Moat = 2 (low—employers do withholding; some online BIR tools; CPA only ₱1.5K–₱5K). Pain = 3 (moderate; deeper pain is employer-side withholding error).

---

### CATEGORY B: TAX ADMINISTRATION

| ID | Domain | Market | Moat | Comp | Pain | **Score** |
|----|--------|:------:|:----:|:----:|:----:|:---------:|
| B1 | BIR Form Selection Navigator | 5 | 2 | 5 | 4 | **4.05** |
| B2 | BIR Penalty and Interest Calculator | 4 | 4 | 5 | 4 | **4.30** |
| B3 | Multi-Form Compliance Calendar Engine | 5 | 3 | 5 | 4 | **4.30** |
| B4 | Withholding Tax Agent Compliance Engine | 5 | 3 | 4 | 5 | **4.20** |
| B5 | Quarterly IT + Annual Reconciliation Engine | 5 | 3 | 5 | 4 | **4.30** |
| B6 | BIR Certificate (2307/2316) Tracker & Generator | 5 | 3 | 4 | 4 | **4.00** |
| B7 | eBIRForms / eFPS Filing Automation Bridge | 5 | 2 | 5 | 4 | **4.05** |

**Scoring notes:**
- **B1**: Market = 5 (5.7M registered taxpayers). Moat = 2 (Taxumo partly solves this; no official BIR decision tree but partial tools exist). Pain = 4 (no official BIR navigator; EOPT Act 2024 changed requirements; "incorrect form" is a top-10 BIR error).
- **B2**: Market = 4 (~570K penalty computations/year). Moat = 4 (₱5K–₱50K+ per remediation engagement). Computability = 5 (NIRC Sec. 248/249; EOPT two-tier rates; RMO 7-2015 compromise schedule — all fully statutory). Pain = 4 (no official BIR penalty calculator; taxpayers discover amount only upon BIR assessment arrival).
- **B3**: Market = 5 (1.24M registered businesses + 2M+ self-employed). Moat = 3 (calendar management is a significant component of CPA retainers). Computability = 5 (filing calendar is a pure function of taxpayer profile + statutory deadlines). Pain = 4 (BIR discontinued printed tax calendars 2026; multi-channel eFPS/eBIRForms with different deadlines).
- **B4**: Market = 5 (1.24M employer-businesses; 28M employees receive BIR 2316). Moat = 3 (CPA bookkeeping ₱3K–₱15K/month; alphalist filing ₱5K–₱20K). Computability = 4 (rate tables are statutory; complexity is classifying each payment into 40+ EWT categories). Pain = 5 (monthly burden × 40+ rate categories × alphalist generation × BIR cross-referencing = highest friction in BIR compliance ecosystem).
- **B5**: Market = 5 (2.5–4.5M reconciliation events/year). Moat = 3 (₱2K–₱10K individual; ₱5K–₱30K corporate). Computability = 5 (cumulative subtraction method is pure arithmetic). Pain = 4 (mismatch with quarterly payments is #1 source of BIR assessment letters).
- **B6**: Market = 5 (28M+ employees receive 2316s; tens of millions of 2307s annually). Moat = 3 (bundled in bookkeeping; not separately priced). Computability = 4 (rate × amount is mechanical; challenge is data aggregation). Pain = 4 (chasing 2307s from agents is perennial; missing = unclaimed tax credits; BIR cross-reference creates audit notices).
- **B7**: Market = 5 (5.7M registered taxpayers). Moat = 2 (Taxumo/JuanTax already serve majority; gap is CGT/DST/estate forms). Pain = 4 (eBIRForms is legacy Java app; no data import from accounting software). Note: most commercially active domain — lower standalone priority due to existing competition.

---

### CATEGORY C: TRANSFER & TRANSACTION TAXES

| ID | Domain | Market | Moat | Comp | Pain | **Score** |
|----|--------|:------:|:----:|:----:|:----:|:---------:|
| C1 | Donor's Tax Calculator (BIR Form 1800) | 3 | 4 | 5 | 4 | **4.05** |
| C2 | VAT Computation Engine | 4 | 3 | 4 | 4 | **3.75** |
| C3 | VAT Refund Claims Engine (NIRC Sec. 112) | 2 | 5 | 3 | 5 | **3.65** |
| C4 | Documentary Stamp Tax (DST) Engine | 5 | 3 | 5 | 3 | **4.10** |
| C5 | Property Transfer Tax Bundler | 3 | 4 | 4 | 4 | **3.75** |

**Scoring notes:**
- **C1**: Market = 3 (50K–200K annual filers; fraction of 600K title transfers involve donation). Moat = 4 (₱5K–₱25K lawyer/CPA + notarization 1–2% of property value; total ₱20K–₱80K). Computability = 5 (6% × net gift over ₱250K threshold — trivial arithmetic; professional value is navigating BIR CAR process, not the computation). Pain = 4 (30-day deadline; title transfer blocked without BIR CAR; Filipinos confuse donation with estate).
- **C2**: Market = 4 (500K–700K VAT-registered businesses). Moat = 3 (JuanTax and Taxumo partially serve this). Computability = 4 (standard output/input is fully algorithmic; mixed-use allocation and zero-rated vs. exempt classification add complexity). Pain = 4 (quarterly deadlines; carry-forward tracking; new digital services VAT Oct 2024).
- **C3**: Market = 2 (10K–50K refund applications per year). Moat = 5 (3–10% of refund amount success fee OR ₱200K–₱2M+ flat for large claims). Computability = 3 (attribution computation is statute-defined; documentary assembly is the real challenge, not the math). Pain = 5 (historically backlogged; 2-year prescriptive period forfeiture risk; high-value per engagement). Note: Low market score despite high moat/pain — niche high-value B2B play, not mass-market.
- **C4**: Market = 5 (400K–600K real property transactions; millions of private loan agreements; lease agreements — total taxable instruments >1M/year). Moat = 3 (bundled in real estate/corporate services; private loans largely non-compliant = latent compliance market). Computability = 5 (NIRC provides exact rate per instrument type; pure arithmetic). Pain = 3 (tight 5-day monthly deadline; inadmissibility penalty if unstamped; but many private loan obligors simply never think about DST).
- **C5**: Market = 3 (100K–300K residential + 20K–50K commercial transactions). Moat = 4 (₱15K–₱80K real estate lawyer). Computability = 4 (each individual tax is deterministic; complexity is three agencies using three different valuation bases). Pain = 4 (multi-agency: BIR + LGU Treasurer + Registry of Deeds + Notary; 30-day CGT deadline; three FMV bases create confusion).

---

### CATEGORY D: LABOR & EMPLOYMENT

| ID | Domain | Market | Moat | Comp | Pain | **Score** |
|----|--------|:------:|:----:|:----:|:----:|:---------:|
| D1 | Multi-Factor Payroll Premium Computation | 5 | 3 | 5 | 4 | **4.30** |
| D2 | 13th Month Pay Computation | 5 | 3 | 4 | 4 | **4.00** |
| D3 | Final Pay Computation | 5 | 3 | 5 | 5 | **4.50** |
| D4 | Retirement Pay Calculator (RA 7641 — 22.5 Days) | 3 | 4 | 5 | 5 | **4.25** |
| D5 | Separation Pay Calculator (Authorized Causes) | 4 | 4 | 5 | 4 | **4.30** |
| D6 | Back Wages Risk Assessment (Illegal Dismissal) | 3 | 5 | 3 | 5 | **3.90** |
| D7 | Mandatory Gov't Contributions Calculator (SSS/PhilHealth/Pag-IBIG) | 5 | 2 | 5 | 3 | **3.85** |
| D8 | Minimum Wage Compliance Checker | 5 | 2 | 5 | 3 | **3.85** |
| D9 | SEnA Monetary Claims Calculator | 2 | 3 | 5 | 4 | **3.55** |

**Scoring notes:**
- **D1**: Market = 5 (~38M private-sector employees; 1M+ employers; BPO sector 1.4M workers facing NSD computation on every payroll). Moat = 3 (payroll software exists at ₱400–₱2K/employee/month, but SMEs compute manually; multi-factor stacking errors are endemic). Computability = 5 (rate matrix is entirely statutory; every combination has an exact rate). Pain = 4 (multi-factor stacking is most-cited DOLE violation source; annual holiday calendar changes with proclamations; "double holiday" scenarios contentious).
- **D2**: Market = 5 (30–35M employees; 1M+ private employers compute annually). Moat = 3 (bundled in payroll; errors trigger DOLE complaints; professional disputes need HR consultant). Computability = 4 (pro-rating and tax exemption interaction are mechanical; "basic salary" inclusion/exclusion generates judgment disputes at margins). Pain = 4 (most-reported DOLE violations; "basic salary" definitional confusion).
- **D3**: Market = 5 (millions of employment separations per year — BPO, retail, food service, construction, domestic work). Moat = 3 (uncontested = in-house; contested → NLRC + ₱5K–₱30K NLRC filing fees + lawyer costs). Computability = 5 (all components are statutory formulas given clean inputs). Pain = 5 (DOLE LA 06-20 30-day release deadline; small employers routinely miss SIL conversion and pro-rated 13th month; no public tool for employees to verify final pay; NLRC is primary resolution venue). **This is the highest-scoring labor domain.**
- **D4**: Market = 3 (hundreds of thousands of retirement events annually; 60+ population ~9M by 2030). Moat = 4 (₱5K–₱25K per computation labor lawyer/HR consultant; NLRC attorney's fees 10% of award). Computability = 5 (Formula: Monthly Salary ÷ 26 × 22.5 × Years — pure arithmetic). Pain = 5 (HR professionals routinely use 15 days instead of 22.5 — underpaying by 33%; a 30-year employee at ₱35K/month is owed ₱909K correct vs. ₱607K wrong = ₱302K underpayment from arithmetic error). **This is the inheritance engine equivalent for employment law.**
- **D5**: Market = 4 (500K+ authorized separations annually; every MSME closure requires this). Moat = 4 (₱5K–₱50K per retrenchment engagement; ₱3K–₱15K for HR consultant). Computability = 5 (cause → formula mapping is statutory; 6-month rounding rule is explicit). Pain = 4 (wrong formula selection is most common error; COLA integration into salary base frequently missed).
- **D6**: Market = 3 (100K–150K NLRC cases annually; illegal dismissal = majority of docket). Moat = 5 (10% of award success fee; awards can reach millions; ₱5K–₱30K risk exposure memo). Computability = 3 (illegal dismissal determination requires judicial judgment; however, computation given established facts is fully deterministic). Pain = 5 (employers systematically underestimate back wages; 6% compounding interest from finality; multi-year timelines inflate totals exponentially). Note: Lower computability score limits this to a pre-litigation risk modeling tool, not a self-service compliance tool.
- **D7**: Market = 5 (84M individual contribution computations/month; 28M employees). Moat = 2 (many free online calculators exist for SSS/PhilHealth/Pag-IBIG; rates widely published). Computability = 5 (SSS 31-bracket lookup table; PhilHealth 5% with floor/cap; Pag-IBIG ₱1,500 threshold). Pain = 3 (rates change annually creating confusion; micro establishments compute manually; but basic arithmetic once rates known). Note: Low moat score due to existing free tools.
- **D8**: Market = 5 (5.2M workers affected by 2025 wage increases; all private employers must comply). Moat = 2 (DOLE publishes wage orders; some online databases; rate lookup is the challenge not arithmetic). Computability = 5 (wage order text specifies exact amounts by region/sector/size). Pain = 3 (regional variation burdens multi-site employers; frequent wage order updates; but computation = applicable rate × days worked).
- **D9**: Market = 2 (40K–60K SEnA cases nationally per year). Moat = 3 (SEnA filing is free; labor lawyer ₱5K–₱20K/case; most workers go unrepresented). Computability = 5 (every SEnA claim type maps to statutory formula). Pain = 4 (workers file without knowing claim amount; employers leverage information asymmetry; prescriptive period spans wage order changes). Note: Low market score despite high computability — strongest worker-empowerment case but limited addressable market.

---

### CATEGORY E: CORPORATE & SEC COMPLIANCE

| ID | Domain | Market | Moat | Comp | Pain | **Score** |
|----|--------|:------:|:----:|:----:|:----:|:---------:|
| E1 | SEC Compliance Navigator & Penalty Engine | 4 | 5 | 5 | 5 | **4.75** |
| E2 | SEC Corporate Lifecycle Fee Engine | 3 | 4 | 5 | 3 | **3.85** |
| E3 | HARBOR Beneficial Ownership Filing Wizard | 4 | 4 | 4 | 5 | **4.20** |
| E4 | AFS Filing Threshold & Requirement Engine | 4 | 4 | 5 | 4 | **4.30** |
| E5 | Capital Increase / Decrease Filing Engine | 2 | 4 | 5 | 3 | **3.60** |
| E6 | OSH Staffing Requirements & Penalty Engine | 4 | 4 | 5 | 4 | **4.30** |

**Scoring notes:**
- **E1**: Market = 4 (527K+ active corporations; 117,885 suspended in a single Feb 2024 order; 100K–200K in various non-compliance stages). Moat = 5 (₱50K–₱200K+ per remediation engagement; ECIP facilitation ₱15K–₱50K+ on top of ₱20K ECIP fee). Computability = 5 (status = pure decision tree from filing history; penalty = table lookup + arithmetic; ECIP comparison = cost comparison). Pain = 5 (117,885 suspended at once; corporations cannot self-assess status; penalty matrix spans 8 tables; non-compliance blocks banking and property transactions). **Highest-scoring domain in the survey (tied with F3).**
- **E2**: Market = 3 (100K–120K corporate actions per year: 52K incorporations + 30K–40K amendments + 10K–20K dissolutions + 5K–10K mergers/conversions). Moat = 4 (law firms ₱15K–₱100K+ per action; actual SEC fees are modest — the markup is on trivial arithmetic). Computability = 5 (all formulas defined by SEC memorandum circular). Pain = 3 (different formulas for par vs. no-par; minimum fee floors not obvious; SEC eSPARC shows fees only after submission).
- **E3**: Market = 4 (527K+ active corporations must comply; 80K–100K with moderate structure; 20K–50K with complex multi-layer). Moat = 4 (complex group disclosures ₱50K–₱200K+; simple structures bundled in secretary retainer ₱36K–₱300K/year). Computability = 4 (ownership percentage tracing = matrix multiplication; "control through other means" requires judgment for minority of cases). Pain = 5 (brand new system launched Jan 30, 2026; BO removed from GIS — now separate filing; penalties ₱50K–₱1M for non-disclosure; ₱1M + 5-year officer disqualification for false declarations; 7-day change window extremely tight).
- **E4**: Market = 4 (527K+ active corporations file AFS; ₱600K→₱3M threshold change means thousands of small corps may qualify for reviewed FS but don't know). Moat = 4 (external audit ₱30K–₱300K+; reviewed FS ₱15K–₱50K; auditors financially incentivized to recommend full audits even when not required). Computability = 5 (threshold comparisons + deadline computation from registration number/fiscal year are fully rule-based lookups). Pain = 4 (major threshold change poorly publicized; small corporations overpay for full audits; eFAST format rejections).
- **E5**: Market = 2 (30K–40K capital amendments annually). Moat = 4 (law firm ₱15K–₱80K; compliance provider ₱8K–₱30K). Computability = 5 (25%-25% rule on increment only; amendment fee = 0.2% of increase; LRF = 1% of filing fee; DST on new shares — all pure arithmetic). Pain = 3 (increment-vs-total error is key trap; bank certificate requirement adds step). Note: Low market size limits this despite perfect computability.
- **E6**: Market = 4 (1.24M establishments total; ~120K actively compliance-critical; DOLE inspected 33K + 168K advisory visits in 2025). Moat = 4 (OSH consulting initial assessment ₱15K–₱50K; ongoing ₱5K–₱25K/month). Computability = 5 (staffing requirements = pure lookup table; penalty = tiered-rate arithmetic with escalation for repeats). Pain = 4 (DO 252-25 changed requirements May 2025; only 574 DOLE inspectors for 1.2M+ establishments; daily fines accrue rapidly; 20% fail initial inspection).

---

### CATEGORY F: PROPERTY & REAL ESTATE

| ID | Domain | Market | Moat | Comp | Pain | **Score** |
|----|--------|:------:|:----:|:----:|:----:|:---------:|
| F1 | Real Property Tax (RPT) + SEF Calculator | 5 | 3 | 5 | 3 | **4.10** |
| F2 | Local Business Tax + Business Permit Calculator | 5 | 3 | 3 | 4 | **3.70** |
| F3 | RPVARA Tax Amnesty Calculator | 5 | 4 | 5 | 5 | **4.75** |
| F4 | Maceda Law Cash Surrender Value Calculator | 3 | 5 | 5 | 4 | **4.30** |

**Scoring notes:**
- **F1**: Market = 5 (35–45M real property units; ₱113.4B annual RPT collection). Moat = 3 (property tax consultants ₱5K–₱25K for assessment review; RPVARA amnesty facilitation ₱10K–₱50K; but LGU assessors do basic computation). Computability = 5 (Assessment Level × FMV = AV; AV × rate = RPT; delinquency penalty = 2%/month × N months, max 72%). Pain = 3 (LGU variation is main friction; primary computation handled by LGU assessors; pain strongest at portfolio management level and amnesty decision). Note: Large market but lower pain/moat for individual property owners.
- **F2**: Market = 5 (1.24M registered establishments; all must renew annually by January 20). Moat = 3 (bookkeeper/accountant ₱3K–₱15K/year; business permit fixers ₱2K–₱10K per LGU). Computability = 3 (formula is deterministic but requires 1,600+ LGU rate database; building and maintaining that database is the technical moat). Pain = 4 (January 20 deadline crunch; LGU variation confusion; "hidden fees" surprise; multi-branch allocation rules misunderstood). Note: Lower computability score due to LGU database dependency — engineering challenge, not statutory uncertainty.
- **F3**: Market = 5 (2–5M delinquent property accounts eligible for amnesty). Moat = 4 (RPVARA amnesty facilitation ₱10K–₱50K per account; new breed of "amnesty facilitators" emerging). Computability = 5 (accumulated principal = sum of unpaid basic RPT + SEF per year; penalties = 2%/month × N months capped at 72%; amnesty amount = principal only). Pain = 5 (**TIME-LIMITED**: amnesty closes July 5, 2026; many property owners don't know delinquency amount or that amnesty exists; failure to avail means paying 72% penalty cap; delinquency blocks title transfer for estate settlements). **Highest-scoring domain in the survey (tied with E1). Urgency is unique — time-limited opportunity.**
- **F4**: Market = 3 (20K–80K contested CSV computation events/year; millions of ongoing installment contracts proactively). Moat = 5 (₱15K–₱50K+ lawyer acceptance fee for DHSUD/HSAC complaint; total ₱30K–₱100K+; buyers systematically accept CSV refunds below statutory floor). Computability = 5 (inputs = total payments + years of installment → exact percentage from statutory table). Pain = 4 (buyers systematically accept below-floor refunds; developers issue improper cancellations via text/not notarial act; Sec. 6 voiding clause widely unknown). **Strongest consumer empowerment use case — identical to inheritance engine thesis.**

---

### CATEGORY G: CIVIL & FAMILY LAW

| ID | Domain | Market | Moat | Comp | Pain | **Score** |
|----|--------|:------:|:----:|:----:|:----:|:---------:|
| G1 | Legal Interest Computation Engine | 5 | 4 | 5 | 4 | **4.55** |
| G2 | Prescriptive Period Deadline Calculator | 3 | 4 | 5 | 4 | **4.05** |
| G3 | Marital Property Liquidation Engine (ACP/CPG) | 2 | 5 | 4 | 5 | **3.95** |
| G4 | Loss of Earning Capacity (LEC) Calculator | 3 | 5 | 5 | 4 | **4.30** |
| G5 | Life Insurance CSV Verification | 4 | 2 | 4 | 3 | **3.30** |

**Scoring notes:**
- **G1**: Market = 5 (500K–1M+ interest computation events/year: small claims, civil collection suits, NLRC cases, demand letters; **cross-domain infrastructure** needed by every other domain). Moat = 4 (demand letter ₱5K–₱25K; collection suit ₱20K–₱50K+; contingency fee ~25% of recovery). Computability = 5 (decision tree: obligation type → accrual date → rate by period → Art. 2212 layer → post-finality layer — all inputs are factual dates and amounts). Pain = 4 (Nacar has been law since 2013 yet courts regularly receive wrong interest computations; Art. 2212 compound interest systematically under-claimed; 12%→6% transition error-prone). **Building this once serves every other domain in this survey.**
- **G2**: Market = 3 (200K–500K discrete prescription-check events annually across law firms, credit departments, businesses). Moat = 4 (legal opinion on prescription ₱2K–₱5K; collection suit intake ₱20K–₱50K; portfolio clock-watching ₱7K–₱15K/month). Computability = 5 (period type = statutory lookup; interruption events = binary checks on written vs. verbal; date arithmetic straightforward). Pain = 4 (Art. 1155 mechanics widely misunderstood — only written demand interrupts; prescription defense regularly succeeds; missed deadline is permanently fatal).
- **G3**: Market = 2 (active liquidation events: ~10K annulment petitions/year + 55K–65K deaths of married Filipinos = 65K–75K/year; but 371K marriages/year all eventually need liquidation). Moat = 5 (annulment attorney's fees ₱100K–₱400K; estate settlement component ₱50K–₱200K). Computability = 4 (liquidation algorithm is mechanical once assets classified; Art. 118 installment rule and Art. 120 improvement rule are rule-defined but complex; disputed asset classification requires judgment). Pain = 5 (Art. 103 6-month void-transaction deadline widely unknown; Art. 118 installment rule misunderstood even by lawyers; ₱100K–₱600K for what is fundamentally a classification exercise + accounting split). Note: Low market score (annual events are 65K–75K); high moat and pain make this viable as a specialist practice tool rather than mass-market consumer tool.
- **G4**: Market = 3 (200K–400K vehicular accidents with injury/death; 20K–50K formal LEC computations; 60K–200K including informal settlements). Moat = 5 (contingency fee 20–30% of total recovery; acceptance fee ₱20K–₱50K; victims typically accept 20–40% of statutory entitlement). Computability = 5 (LEC = (2/3 × (80 − age)) × (gross annual income × 50%) — three-multiplication formula established by SC jurisprudence). Pain = 4 (victims accept below-statutory amounts due to formula ignorance; insurance adjusters leverage information asymmetry; indigent victims accept ₱30K CTPL no-fault when LEC could be ₱500K–₱2M+).
- **G5**: Market = 4 (8–12M individual life insurance policies; 400K–960K annual surrenders at 5–8% lapse rate). Moat = 2 (no standard market for individual CSV review; moat is pure information asymmetry rather than professional gatekeeping; actuarial consulting ₱10K–₱50K is prohibitively expensive relative to most policy CSV amounts). Computability = 4 (statutory floor formula is fully deterministic given inputs; reserve figure requires accessing policy's embedded Table of Non-Forfeiture Values). Pain = 3 (real financial harm when surrendered below minimum; lapse vs. surrender confusion; but moat is informational asymmetry, not active professional gatekeeping). Note: Low moat score because the issue is people don't seek professionals at all — they just accept the insurer's figure. Strong insurance-sector regulatory angle if paired with IC complaint filing guide.

---

## Master Score Summary (All 41 Domains)

| Rank | ID | Domain | Market | Moat | Comp | Pain | **Score** |
|------|----|--------|:------:|:----:|:----:|:----:|:---------:|
| 1 | E1 | SEC Compliance Navigator & Penalty Engine | 4 | 5 | 5 | 5 | **4.75** |
| 1 | F3 | RPVARA Tax Amnesty Calculator | 5 | 4 | 5 | 5 | **4.75** |
| 3 | G1 | Legal Interest Computation Engine | 5 | 4 | 5 | 4 | **4.55** |
| 4 | D3 | Final Pay Computation | 5 | 3 | 5 | 5 | **4.50** |
| 5 | A1 | Individual Self-Employed / Professional IT Optimizer | 5 | 3 | 5 | 4 | **4.30** |
| 5 | A3 | Capital Gains Tax — Real Property | 3 | 5 | 5 | 4 | **4.30** |
| 5 | B2 | BIR Penalty and Interest Calculator | 4 | 4 | 5 | 4 | **4.30** |
| 5 | B3 | Multi-Form Compliance Calendar Engine | 5 | 3 | 5 | 4 | **4.30** |
| 5 | B5 | Quarterly IT + Annual Reconciliation Engine | 5 | 3 | 5 | 4 | **4.30** |
| 5 | D1 | Multi-Factor Payroll Premium Computation | 5 | 3 | 5 | 4 | **4.30** |
| 5 | D5 | Separation Pay Calculator | 4 | 4 | 5 | 4 | **4.30** |
| 5 | E4 | AFS Filing Threshold & Requirement Engine | 4 | 4 | 5 | 4 | **4.30** |
| 5 | E6 | OSH Staffing Requirements & Penalty Engine | 4 | 4 | 5 | 4 | **4.30** |
| 5 | F4 | Maceda Law CSV Calculator | 3 | 5 | 5 | 4 | **4.30** |
| 5 | G4 | Loss of Earning Capacity (LEC) Calculator | 3 | 5 | 5 | 4 | **4.30** |
| 16 | D4 | Retirement Pay Calculator (RA 7641) | 3 | 4 | 5 | 5 | **4.25** |
| 17 | B4 | Withholding Tax Agent Compliance Engine | 5 | 3 | 4 | 5 | **4.20** |
| 17 | E3 | HARBOR Beneficial Ownership Filing Wizard | 4 | 4 | 4 | 5 | **4.20** |
| 19 | C4 | Documentary Stamp Tax (DST) Engine | 5 | 3 | 5 | 3 | **4.10** |
| 19 | F1 | Real Property Tax (RPT) + SEF Calculator | 5 | 3 | 5 | 3 | **4.10** |
| 21 | A4 | CGT — Unlisted Shares + DST | 3 | 4 | 5 | 4 | **4.05** |
| 21 | B1 | BIR Form Selection Navigator | 5 | 2 | 5 | 4 | **4.05** |
| 21 | B7 | eBIRForms / eFPS Filing Automation Bridge | 5 | 2 | 5 | 4 | **4.05** |
| 21 | C1 | Donor's Tax Calculator | 3 | 4 | 5 | 4 | **4.05** |
| 21 | G2 | Prescriptive Period Deadline Calculator | 3 | 4 | 5 | 4 | **4.05** |
| 26 | A2 | Corporate IT — RCIT vs. MCIT Engine | 4 | 4 | 4 | 4 | **4.00** |
| 26 | B6 | BIR Certificate (2307/2316) Tracker | 5 | 3 | 4 | 4 | **4.00** |
| 26 | D2 | 13th Month Pay Computation | 5 | 3 | 4 | 4 | **4.00** |
| 29 | G3 | Marital Property Liquidation Engine (ACP/CPG) | 2 | 5 | 4 | 5 | **3.95** |
| 30 | D6 | Back Wages Risk Assessment (Illegal Dismissal) | 3 | 5 | 3 | 5 | **3.90** |
| 31 | A5 | Individual IT — Compensation Earners | 5 | 2 | 5 | 3 | **3.85** |
| 31 | D7 | Mandatory Gov't Contributions Calculator | 5 | 2 | 5 | 3 | **3.85** |
| 31 | D8 | Minimum Wage Compliance Checker | 5 | 2 | 5 | 3 | **3.85** |
| 31 | E2 | SEC Corporate Lifecycle Fee Engine | 3 | 4 | 5 | 3 | **3.85** |
| 35 | C2 | VAT Computation Engine | 4 | 3 | 4 | 4 | **3.75** |
| 35 | C5 | Property Transfer Tax Bundler | 3 | 4 | 4 | 4 | **3.75** |
| 37 | F2 | Local Business Tax + Business Permit Calculator | 5 | 3 | 3 | 4 | **3.70** |
| 38 | C3 | VAT Refund Claims Engine | 2 | 5 | 3 | 5 | **3.65** |
| 39 | E5 | Capital Increase / Decrease Filing Engine | 2 | 4 | 5 | 3 | **3.60** |
| 40 | D9 | SEnA Monetary Claims Calculator | 2 | 3 | 5 | 4 | **3.55** |
| 41 | G5 | Life Insurance CSV Verification | 4 | 2 | 4 | 3 | **3.30** |

---

## Score Distribution Analysis

| Score Band | Count | Domains |
|------------|-------|---------|
| 4.50–4.75 | 4 | E1, F3, G1, D3 |
| 4.25–4.49 | 3 | D4, B4, E3 |
| 4.00–4.24 | 18 | A1, A3, B2, B3, B5, D1, D5, E4, E6, F4, G4; C4, F1; A4, B1, B7, C1, G2; A2, B6, D2 |
| 3.75–3.99 | 8 | G3, D6, A5, D7, D8, E2; C2, C5 |
| 3.50–3.74 | 4 | F2, C3, E5, D9 |
| <3.50 | 1 | G5 |

**39 of 41 domains score ≥ 3.55** — confirming this is a target-rich environment with very few truly low-opportunity domains.

---

## Notable Patterns and Cross-Domain Insights

### 1. The "Perfect Storm" Cluster (Score ≥ 4.50)
Four domains combine massive markets, deep professional moats, full computability, and maximum pain:

- **E1 (SEC Penalty Engine)**: 100K–200K non-compliant corporations, ₱50K–₱200K remediation fees, and a fully deterministic penalty matrix that corporations cannot compute themselves.
- **F3 (RPVARA Amnesty)**: 2–5M delinquent accounts, ₱10K–₱50K facilitation fees, and a **hard deadline of July 5, 2026** creating urgency no other domain can match.
- **G1 (Legal Interest Engine)**: 500K–1M+ computation events per year, is cross-domain infrastructure needed by every other domain in this survey.
- **D3 (Final Pay)**: Millions of employment separations annually, a 30-day DOLE deadline, and both employer-side (compliance) and employee-side (verification) demand.

### 2. The "Inheritance Engine Equivalents" (High Moat + High Computability)
Domains where the statutory formula is simple arithmetic but professionals extract large fees due to information asymmetry:

- **D4 (Retirement Pay, RA 7641)**: The 22.5-day formula is the direct analog of the inheritance legitime formula. HR professionals routinely underpay by 33% using 15 days instead of 22.5 days. A 30-year employee at ₱35K/month loses ₱302K to pure arithmetic error.
- **F4 (Maceda Law CSV)**: Buyers systematically accept CSV refunds below the statutory floor. The computation is a single graduated-rate table lookup. Developer-buyer information asymmetry is total. "This is like inheritance but for real estate installment buyers."
- **G4 (Loss of Earning Capacity)**: Victims accept 20–40% of statutory entitlement because they don't know the three-multiplication SC formula. The computation is four-second arithmetic once the formula is known.
- **G3 (Marital Property Liquidation)**: Lawyers charge ₱100K–₱600K for a classification exercise + two-way accounting split that is mechanically deterministic once assets are classified.

### 3. The "Tax Infrastructure Stack" (Multiple B-Category Domains)
Tax administration (B1–B7) forms an interconnected suite. A single taxpayer-profile platform could serve all seven domains simultaneously:

```
Profile → Form Selection (B1) → Compliance Calendar (B3)
        → Penalty Calculator (B2)
        → Quarterly Reconciliation (B5) → Annual IT Return (A1/A2)
        → Withholding Engine (B4) → Certificate Tracker (B6)
        → Filing Bridge (B7)
```

No single existing product covers the full stack. Taxumo covers filing; no product covers penalty computation, form selection, and reconciliation in an integrated manner.

### 4. The "LGU Database Moat" (F2, F1)
Local business tax and real property tax computations are trivially deterministic once the applicable rate is known — but 1,600+ LGUs each maintain their own rate schedules, not centrally published. The entity that builds and maintains this rate database owns a structural data moat that makes the computation product defensible.

### 5. "Time-Limited" Signals
Two domains have hard expiration dates that create concentrated demand:
- **F3 (RPVARA Amnesty)**: Closes July 5, 2026 (≈ 4.3 months from today)
- **E3 (HARBOR BO Filing)**: Launched January 30, 2026 — all 527K+ corporations in initial filing sprint

---

## Appendix: Score Verification Table

Spot-check of formula: Opportunity Score = (Market × 0.25) + (Moat × 0.25) + (Computability × 0.30) + (Pain × 0.20)

| ID | Market×0.25 | Moat×0.25 | Comp×0.30 | Pain×0.20 | Total |
|----|:-----------:|:---------:|:---------:|:---------:|:-----:|
| E1 | 4×0.25=1.00 | 5×0.25=1.25 | 5×0.30=1.50 | 5×0.20=1.00 | **4.75** |
| F3 | 5×0.25=1.25 | 4×0.25=1.00 | 5×0.30=1.50 | 5×0.20=1.00 | **4.75** |
| G1 | 5×0.25=1.25 | 4×0.25=1.00 | 5×0.30=1.50 | 4×0.20=0.80 | **4.55** |
| D3 | 5×0.25=1.25 | 3×0.25=0.75 | 5×0.30=1.50 | 5×0.20=1.00 | **4.50** |
| D4 | 3×0.25=0.75 | 4×0.25=1.00 | 5×0.30=1.50 | 5×0.20=1.00 | **4.25** |
| G3 | 2×0.25=0.50 | 5×0.25=1.25 | 4×0.30=1.20 | 5×0.20=1.00 | **3.95** |
| G5 | 4×0.25=1.00 | 2×0.25=0.50 | 4×0.30=1.20 | 3×0.20=0.60 | **3.30** |
