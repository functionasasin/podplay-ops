# Wave 1 Analysis: SEC Filings Catalog

**Aspect**: sec-filings-catalog
**Source**: sec.gov.ph filing requirements, eFAST system, SEC Memorandum Circulars (MC-6-2024 penalties, MC-13-2024 ECIP, MC-15-2025 beneficial ownership, MC-1-2025 AFS/GIS deadlines), RA 11232 (Revised Corporation Code), SRC (Securities Regulation Code)
**Date**: 2026-02-25

## Context

The SEC oversees ~527,710 active corporations (year-end 2024), with 52,304 new registrations in 2024. All reportorial requirements are submitted through the Electronic Filing and Submission Tool (eFAST). In February 2024, the SEC suspended 117,885 corporations for continuous inoperation and non-filing. The Enhanced Compliance Incentive Plan (ECIP) under MC-13-2024 offered reduced penalties (flat P20,000 for non-compliant entities) to address the massive backlog. The beneficial ownership disclosure regime was overhauled with HARBOR (Hierarchical and Applicable Relations and Beneficial Ownership Registry) launching January 30, 2026.

This analysis focuses on **SEC filing-specific domains** — automation opportunities that arise from the SEC's reportorial machinery, compliance status determination, and filing systems. Corporation Code-level domains (penalty computation, registration fees, compliance calendar, capital structure, governance) are documented in wave1-corporation-code; this analysis identifies **net-new domains** at the filings layer and expands on prior domains where SEC filing specifics add significant complexity.

### Cross-reference with wave1-corporation-code

| Corp Code Domain | Overlap | What This Analysis Adds |
|-----------------|---------|------------------------|
| Domain 1: SEC Penalty Computation | High | ECIP cost-benefit analysis, delinquency pathway |
| Domain 2: SEC Registration Fee | Moderate | Full lifecycle fee engine across all corporate actions |
| Domain 3: Compliance Calendar | Moderate | SEC-specific filing schedule details, AFS threshold rules |
| Domain 5: Dissolution Cost | Low | eFAST dissolution filing specifics |
| Domain 6: Beneficial Ownership | High | HARBOR filing wizard, new 2026 disclosure rules |
| Domain 7: Capital Structure | Low | eSPARC/SEC ZERO digital filing process |

---

## Domain 1: SEC Compliance Status Navigator & ECIP Calculator

**One-line description:** Determine a corporation's SEC compliance status (good standing / non-compliant / delinquent / suspended / revoked) and compute the optimal remediation pathway with cost comparison.

**Governing law:**
- RA 11232 Sec. 177 (Penalties for Non-Compliance)
- SEC MC No. 19, Series of 2023 (Guidelines on Declaration of Delinquent Status and Revocation)
- SEC MC No. 6, Series of 2024 (Updated Fines and Penalties)
- SEC MC No. 13, Series of 2024 (Enhanced Compliance Incentive Plan)

**Computation sketch:**
- **Inputs**: Corporation type (domestic stock/non-stock/OPC/foreign stock/foreign non-stock), retained earnings bracket, list of unfiled reports (GIS/AFS/MC-28) by year, whether any SEC notices have been received
- **Step 1**: Count total filing violations in the last 5 years
  - 1-2 violations: Non-compliant status
  - 3+ violations (consecutive or intermittent): Delinquent status per Sec. 177
  - 5+ years of non-filing: Suspended (per Feb 2024 SEC order affecting 117,885 corps)
  - Post-suspension 6th offense: Grounds for revocation
- **Step 2**: Compute full penalty under regular schedule (MC-6-2024)
  - For each unfiled GIS: look up penalty from tables (P5,000–P45,000 for domestic stock; P5,000–P27,000 for domestic non-stock; P10,000–P54,000 for foreign stock)
  - For each unfiled AFS: same tables
  - For MC-28 non-compliance: flat P20,000
  - Add monthly surcharge (P500-P1,000/month of continuing violation)
  - For 6th+ offense after delinquent status: 100% surcharge on cumulative assessed fines
- **Step 3**: Compute ECIP settlement amount (if applicable/available)
  - Non-compliant: flat P20,000
  - Suspended/revoked: 50% of assessed fines + P3,060 petition fee
- **Step 4**: Compare full penalty vs ECIP settlement, output savings
- **Step 5**: Generate remediation checklist (which reports to file, in what order, via eFAST)
- **Output**: Compliance status classification, full penalty computation, ECIP savings analysis, step-by-step remediation plan

**Who currently does this:** Corporate secretaries (P120K-300K/year retainers), lawyers (P20K-100K+ per remediation engagement), compliance consultants. Many corporations discover their status only when trying to transact (e.g., open bank account, sign government contract) and getting blocked by SEC red flags.

**Rough market size:** The 117,885 corporations suspended in February 2024 alone represent the acute market. Ongoing, an estimated 100K-200K corporations are in some state of non-compliance at any given time. The ECIP program attracted significant interest — SEC extended the deadline twice (to Dec 31, 2024). Even post-ECIP, the SEC has signaled future compliance windows will be offered.

**Professional fee range:** Corporate remediation packages: P20K-100K (depending on years of backfiling). ECIP facilitation services were offered by firms like Triple i Consulting, Incorp Asia, and FilePino at P15K-50K+ on top of the P20K ECIP fee. Total remediation cost (professional fee + government penalties + back-filing costs): P50K-200K+.

**Pain indicators:**
- 117,885 corporations suspended in a single order (Feb 2024) — massive compliance crisis
- Corporations can't determine their own status without checking SEC records
- Penalty computation requires cross-referencing 8 separate tables across MC-6-2024
- ECIP cost-benefit analysis requires comparing escalating penalties vs flat fee
- Delinquency status has a 5-year rolling window that's hard to track
- Non-compliance blocks corporate transactions (banking, government contracts, property transfers)
- Many "zombie corporations" continue accumulating penalties unknowingly

**Computability: 5/5 — Fully deterministic.** Status classification is a pure decision tree from filing history. Penalty computation is table lookup + arithmetic. ECIP comparison is simple cost comparison. Zero judgment required.

---

## Domain 2: SEC Corporate Lifecycle Fee Engine

**One-line description:** Compute all SEC fees for any corporate action across the full lifecycle — from incorporation through amendments, capital changes, mergers, conversions, and dissolution.

**Governing law:**
- SEC MC No. 3, Series of 2017 (Consolidated Schedule of Fees and Charges)
- RA 11232 (fee basis for various corporate actions)
- SEC fee reductions effective July 1, 2025 (50% reduction on document request fees)

**Computation sketch:**
- **Inputs**: Corporate action type, authorized capital stock (par/no-par), number of shares, subscription amounts, specific action parameters
- **Fee formulas by action type**:

| Action | Formula | Minimum |
|--------|---------|---------|
| Incorporation (par value) | 1/5 of 1% of ACS or subscription price (whichever higher) | P2,000 |
| Incorporation (no-par) | 1/5 of 1% at P100/share deemed value | P2,000 |
| Partnership registration | 1/5 of 1% of partnership capital | P1,000 |
| Capital increase (par) | 1/5 of 1% of the increase | P3,000 |
| Capital increase (no-par) | 1/5 of 1% at P100/share | P3,000 |
| Capital decrease | 1/5 of 1% of the decrease | P3,000 |
| Amendment of AOI (non-capital) | Fixed fee schedule | P2,000+ |
| Name change | Fixed fee | P1,010+ |
| Merger/consolidation | Based on surviving entity's ACS | P3,000+ |
| Dissolution (no creditors) | Fixed fee | P1,000+ |
| Dissolution (with creditors) | Based on ACS | P2,000+ |
| Corporate conversion (stock ↔ non-stock) | Based on ACS | P2,000+ |
| Foreign corporation license | Based on assigned capital | P3,000+ |

- **Add-on fees for every action**:
  - Legal Research Fee: 1% of filing fee (min P10)
  - By-Laws registration: P1,010
  - Stock & Transfer Book: P470
  - Name reservation: P100 (30 days) or P120 (90 days for business names)
  - Documentary Stamp Tax on shares: P1.50 per P200 par value (0.75%)
  - Notarial fees (if required): P500-P1,500
- **Output**: Itemized fee breakdown, total government fees, estimated total cost (with professional fees)

**Who currently does this:** Lawyers, incorporation service providers, corporate secretaries. The SEC has an online Registration Calculator (sec.gov.ph/online-services/registration-calculator/) but it covers only basic incorporation — not amendments, capital changes, dissolution, mergers, or conversions.

**Rough market size:** 52,304 new incorporations (2024) + estimated 30K-40K amendments/capital changes + 10K-20K dissolutions + 5K-10K mergers/conversions = ~100K-120K fee computations per year.

**Professional fee range:** Incorporation service providers charge P15K-50K all-in. Lawyers charge P20K-100K+. A significant portion of these fees is the computation and document preparation — the actual SEC government fees are relatively modest (P3K-15K for most actions).

**Pain indicators:**
- SEC fee schedule spans multiple circulars (MC-3-2017 + amendments + special circulars)
- Different formulas for par-value vs no-par-value corporations
- "Whichever is higher" comparisons between ACS and subscription price
- Minimum fee floors override the formula (non-obvious)
- DST computation on shares is separate from SEC fees but often forgotten
- SEC ZERO (fully digital, April 2025) changed the process but not the fee computation
- eSPARC portal shows assessed fee only AFTER submission — no pre-computation tool

**Computability: 5/5 — Fully deterministic.** All formulas are defined by SEC memorandum circular. Given corporate action type and capital parameters, the output is pure arithmetic.

---

## Domain 3: HARBOR Beneficial Ownership Filing Wizard

**One-line description:** Guide corporations through the new HARBOR beneficial ownership disclosure system — trace ownership through corporate layers, determine beneficial owners, and generate compliant filings.

**Governing law:**
- SEC MC No. 15, Series of 2025 (Revised Beneficial Ownership Disclosure Rules, effective Jan 1, 2026)
- HARBOR system launch: January 30, 2026
- RA 11232 (corporate ownership disclosure)
- AMLA (Anti-Money Laundering Act) — BO transparency requirements

**Computation sketch:**
- **Inputs**: Corporate ownership structure (list of shareholders with percentage holdings, whether natural person or juridical entity), for juridical entity shareholders: their own ownership structure (recursive), voting agreements, management contracts
- **Step 1**: For each shareholder, determine if natural person or juridical entity
- **Step 2**: For juridical entity shareholders, trace ownership recursively:
  - Multiply percentages through layers (e.g., Person A owns 60% of Corp B which owns 50% of Corp C → A has 30% indirect ownership in Corp C)
  - Sum direct + indirect ownership for each natural person
- **Step 3**: Identify beneficial owners using thresholds:
  - Direct or indirect ownership of ≥25% of voting shares → beneficial owner
  - Control through other means (voting agreements, board appointment rights, management contracts) → beneficial owner
  - If no natural person meets threshold → senior managing official is deemed beneficial owner
- **Step 4**: Generate HARBOR-compliant disclosure (personal information of each BO, nature and extent of beneficial interest, date became BO)
- **Step 5**: Set up change monitoring — any change must be reported within 7 days
- **Output**: Beneficial ownership register, HARBOR filing data, change alert triggers

**Who currently does this:** Corporate secretaries, compliance officers, lawyers. Complex corporate group structures with multiple layers make this a significant compliance burden, especially under the new 2026 rules with harsher penalties.

**Rough market size:** All 527,710+ active corporations must comply. However, the complexity (and thus the automation value) scales with ownership structure complexity:
- Simple structures (1-5 individual shareholders): ~400K corporations — straightforward but still need to file
- Moderate structures (holding company with subsidiaries): ~80K-100K — multiplication through 2-3 layers
- Complex structures (multi-layered groups, cross-holdings, nominee arrangements): ~20K-50K — where real professional fees are incurred

**Professional fee range:** Bundled into corporate secretary retainer (P120K-300K/yr) for simple structures. Standalone BO compliance services for complex structures: P10K-50K per entity per year. Law firms handling multi-entity group disclosures: P50K-200K+ per group.

**Pain indicators:**
- Brand new system (HARBOR launched Jan 30, 2026) — steep learning curve for all 527K+ corporations
- BO disclosure removed from GIS — corporations now have two separate filings instead of one
- Penalties dramatically increased: P50K-P1M for non-disclosure, P1M + 5-year officer disqualification for false declarations
- 7-day change reporting window is extremely tight for large groups
- Multi-layered ownership tracing requires matrix multiplication through corporate chains
- Nominee arrangements must be disclosed — cultural resistance in PH business
- HARBOR access requires eSECURE account — many corporations don't have one yet

**Computability: 4/5 — Mostly deterministic.** Ownership percentage tracing through layers is pure arithmetic (multiplication and summation). The judgment element is identifying "control through other means" — but the core BO identification (≥25% ownership tracing) is fully deterministic. A tool that handles percentage tracing and flags potential non-ownership control scenarios would cover 90%+ of cases.

---

## Domain 4: SEC AFS Filing Threshold & Requirement Engine

**One-line description:** Determine which financial statement requirements apply to a corporation based on its size, type, and characteristics — from unaudited FS to full PFRS-compliant audited statements.

**Governing law:**
- SEC MC No. 1, Series of 2025 (AFS/GIS filing guidelines)
- SRC Rule 68.1 (Financial Reporting Requirements)
- SEC MC No. 2, Series of 2024 (AFS deadlines and requirements)
- SEC thresholds for audit/review requirements

**Computation sketch:**
- **Inputs**: Corporation type, total assets, total liabilities, total revenue, number of stockholders, PSE listing status, SRC registration status, fiscal year end date, SEC registration number (last digit)
- **Step 1**: Determine financial statement tier:
  - Tier 1 (Full PFRS): Total assets or liabilities > P3M (threshold raised from P600K effective Dec 31, 2025) — requires full audit by accredited external auditor
  - Tier 2 (PFRS for SMEs): Below P3M threshold — reviewed financial statements acceptable
  - Tier 3 (SRC-registered/listed): Must comply with SRC reporting rules (SEC Form 17-A annual report, 17-Q quarterly)
- **Step 2**: Determine filing deadline:
  - PSE-listed companies: fiscal year end + 105 calendar days
  - SRC-registered (not listed), public companies: fiscal year end + 105 calendar days
  - Brokers/dealers (Dec 31 FY): April 30
  - Brokers/dealers (other FY): FY end + 110 calendar days
  - All others: filed through eFAST per SEC filing schedule (based on last digit of SEC registration number — staggered across May)
- **Step 3**: Determine required attachments and compliance:
  - AFS in XBRL format (for applicable filers)
  - Management responsibility statement
  - Supplementary schedules (receivables, related party transactions, etc.)
  - Tax reconciliation (if audited FS doesn't match ITR)
- **Output**: Required FS tier, deadline, auditor requirements, checklist of required documents

**Who currently does this:** External auditors (P30K-300K+ for audit), accountants, corporate secretaries. Many small corporations don't know whether they need audited or reviewed statements, leading to unnecessary audit costs or non-compliant submissions.

**Rough market size:** All 527,710+ active corporations file AFS. The threshold change (P600K → P3M effective 2025) means thousands of small corporations that previously needed full audits may now qualify for reviewed FS, saving P20K-100K+ in audit fees — but many don't know about the change.

**Professional fee range:** External audit fees: P30K-300K+ (varies by company size/complexity). CPA-reviewed financial statements: P15K-50K. The determination of which tier applies is typically done by the auditor (who has a financial interest in recommending a full audit).

**Pain indicators:**
- P600K → P3M threshold change (2025) is major but poorly publicized
- Small corporations overpay for full audits when reviewed FS would suffice
- SEC registration number determines staggered deadline — but many companies don't know their schedule
- Filing through eFAST requires specific document format and naming conventions
- SRC-registered companies have separate, more stringent requirements (quarterly + annual)
- SEC periodically rejects submissions for format non-compliance

**Computability: 5/5 — Fully deterministic.** Threshold comparisons, deadline computation from registration number/fiscal year, and document requirement determination are all rule-based lookups. Zero judgment required.

---

## Domain 5: SEC Filing Self-Audit & Remediation Planner

**One-line description:** Comprehensive SEC compliance self-audit tool that identifies all missing, late, or incorrect SEC filings and generates a prioritized remediation plan with cost estimates.

**Governing law:**
- RA 11232 Sec. 177 (Penalties)
- SEC MC No. 6, Series of 2024 (Penalty schedule)
- SEC MC No. 19, Series of 2023 (Delinquency/Revocation guidelines)
- All SEC reportorial requirements (GIS, AFS, MC-28, BO disclosure, SRC reports)

**Computation sketch:**
- **Inputs**: Corporation profile (type, registration date, fiscal year, ACS, retained earnings), filing history (list of reports filed with dates), current officers/directors
- **Step 1**: Generate complete list of required filings from incorporation to present:
  - GIS: one per year (due 30 days after annual meeting)
  - AFS: one per year (deadline per Domain 4 computation)
  - MC-28 eFAST compliance: initial + ongoing
  - BO disclosure: under HARBOR effective 2026
  - SRC reports: if applicable (17-A annual, 17-Q quarterly, 17-C current)
- **Step 2**: Compare required filings vs actual filings — identify gaps
- **Step 3**: For each gap, compute:
  - Penalty amount (per MC-6-2024 tables, considering offense escalation)
  - Whether gap counts toward delinquency threshold (3 violations in 5 years)
  - Whether any amnesty/ECIP programs are available
- **Step 4**: Generate remediation plan:
  - Priority order (most urgent filings first based on penalty exposure and delinquency risk)
  - Cost estimate for each filing (penalty + filing fees + professional service estimate)
  - Total cost for full remediation
  - Timeline estimate (3-6 months for typical multi-year backlog)
- **Output**: Gap analysis, penalty exposure, prioritized remediation plan with budget

**Who currently does this:** Corporate secretaries and compliance consultants conduct ad-hoc compliance audits. Law firms like AJA Law, Cruz Marcelo, and Ocampo & Suralvo offer SEC compliance review services. There is no self-service tool for corporations to audit their own compliance status.

**Rough market size:** The 117,885 suspended corporations (Feb 2024 order) plus an estimated 50K-100K non-compliant but not yet suspended corporations = 170K-220K potential users. Even compliant corporations (400K+) benefit from proactive compliance auditing to avoid slipping into non-compliance.

**Professional fee range:** SEC compliance audit services: P15K-50K for initial assessment. Full remediation (audit + back-filing + penalty settlement): P50K-200K+. The SEC's ECIP (flat P20K for non-compliant, 50% for suspended/revoked) was designed to reduce this burden but still required professional facilitation.

**Pain indicators:**
- Corporations cannot easily self-assess compliance status
- Filing history is fragmented across years of eFAST submissions
- Penalty escalation (1st → 5th offense in 5-year windows) is hard to track manually
- SEC's mass suspension orders create sudden remediation urgency
- Non-compliance discovered during transactions (bank account opening, property purchase) causes delays
- Many small corporations have years of unfiled reports and don't know where to start

**Computability: 5/5 — Fully deterministic.** Required filing list is computed from registration date + corporation type. Gap analysis is set difference. Penalty computation is table lookup. Remediation prioritization follows statutory urgency rules (delinquency thresholds, penalty escalation). No judgment required.

---

## Domain 6: SRC Reportorial Requirements Engine (Listed/Public Companies)

**One-line description:** Manage the full suite of Securities Regulation Code (SRC) reporting obligations for companies with registered securities — annual, quarterly, and current reports with computation of filing fees and deadlines.

**Governing law:**
- RA 8799 (Securities Regulation Code) Sec. 17 (Reports)
- SRC Rule 17 (Periodic and Other Reports)
- SEC forms: 17-A (Annual Report), 17-Q (Quarterly Report), 17-C (Current Report), 20-IS (Information Statement)
- PSE listing rules (for PSE-listed companies)

**Computation sketch:**
- **Inputs**: Company type (PSE-listed / SRC-registered not listed / public company by asset/shareholder test), fiscal year, reportable events
- **Step 1**: Determine applicable reports:
  - SEC Form 17-A: Annual report — all SRC-registered companies. Due within 105 calendar days of fiscal year end.
  - SEC Form 17-Q: Quarterly report — Q1 (45 days after Mar 31), Q2 (45 days after Jun 30), Q3 (45 days after Sep 30). No Q4 — replaced by 17-A.
  - SEC Form 17-C: Current report — within 5 business days of reportable event (director resignation, material contract, dividend declaration, merger, lawsuit, etc.)
  - SEC Form 20-IS: Information statement — 15 days before stockholders' meeting
- **Step 2**: Generate compliance calendar with specific dates
- **Step 3**: For 17-C current reports, maintain triggers list:
  - Material events requiring 17-C filing (20+ event types per SRC Rule 17.1)
  - Compute filing deadline (event date + 5 business days, excluding holidays)
- **Step 4**: Track PSE-specific requirements (for listed companies):
  - PSE disclosure rules (within 10 minutes for material information)
  - PSE structured report format requirements
  - EDGE disclosure portal submission
- **Output**: SRC compliance calendar, current report trigger monitoring, deadline alerts

**Who currently does this:** In-house legal/compliance teams, external corporate secretaries specializing in SEC-regulated companies, investor relations officers. Listed companies typically have dedicated compliance staff; SRC-registered non-listed companies often rely on external counsel.

**Rough market size:** Approximately 290 PSE-listed companies + estimated 1,000-2,000 SRC-registered non-listed companies + public companies that meet the asset/shareholder threshold = ~1,500-3,000 entities. Small total count but high-value entities.

**Professional fee range:** Corporate secretary services for listed companies: P300K-1M+/year. Compliance officer outsourcing for SRC-registered companies: P150K-500K/year. The high cost reflects the severity of non-compliance (SEC sanctions, trading suspensions, delisting).

**Pain indicators:**
- 17-C "current report" obligation requires real-time event monitoring — any of 20+ event types trigger a 5-business-day filing obligation
- Penalties for late SRC filings are significantly higher than regular corporate filings
- PSE-listed companies face dual requirements (SEC + PSE disclosure rules)
- Quarterly 17-Q reports require quarterly financial statements (additional audit/review cost)
- Complex disclosure requirements around related party transactions, material contracts, and governance changes
- Material information must be disclosed to PSE within 10 minutes — compliance burden for investor relations

**Computability: 4/5 — Mostly deterministic.** Calendar computation is fully deterministic. Event triggers for 17-C are mostly clear-cut (director resignation, dividend declaration = obvious triggers). The judgment area is "materiality" — whether an event is sufficiently material to require 17-C filing. But for the ~80% of clearly-defined trigger events, the system is fully rule-based.

---

## Cross-Reference Notes

### Overlap with wave1-corporation-code

This analysis intentionally complements rather than duplicates the corporation-code analysis:

| This Analysis | Corp Code Domain | Relationship |
|---------------|-----------------|-------------|
| Domain 1: Compliance Status Navigator | Corp Code D1 (Penalty Computation) | **Extends**: Adds status classification, ECIP comparison, remediation pathway |
| Domain 2: Lifecycle Fee Engine | Corp Code D2 (Registration Fee) | **Extends**: Covers full lifecycle (amendments, mergers, dissolution) not just incorporation |
| Domain 3: HARBOR BO Wizard | Corp Code D6 (BO Tracing) | **Extends**: Adds HARBOR-specific filing requirements, 2026 rules, penalty regime |
| Domain 4: AFS Threshold Engine | NEW | Net-new — filing tier determination, deadline computation from registration number |
| Domain 5: Filing Self-Audit | NEW | Net-new — comprehensive compliance gap analysis and remediation planning |
| Domain 6: SRC Reports | NEW | Net-new — listed/public company reportorial requirements |

### Overlap with wave1-bir-forms-catalog

- BIR compliance calendar (bir-forms-catalog Domain 3) and SEC compliance calendar (corporation-code Domain 3) should be **integrated** in the final product — the highest-value tool serves the full cross-agency calendar.
- BIR penalty calculator (bir-forms-catalog Domain 2) and SEC penalty calculator (this analysis Domain 1) follow similar patterns — a unified "Penalty Calculator" covering BIR + SEC penalties would be more valuable than separate tools.

### Net-new domains identified:

1. **Domain 4: AFS Threshold & Requirement Engine** — determines which financial statement tier applies, potentially saving small corporations P20K-100K+ in unnecessary audit fees
2. **Domain 5: Filing Self-Audit & Remediation Planner** — the "diagnostic tool" for the 170K-220K non-compliant corporations
3. **Domain 6: SRC Reportorial Requirements Engine** — niche (1,500-3,000 entities) but high-value per entity

### Domains already covered (noted but not re-analyzed):

- Estate tax (BIR Form 1801) — covered by estate-tax-reverse loop
- Inheritance/succession — covered by inheritance-reverse + inheritance-rust-forward loops

## Existing Automation Landscape

| Tool | Coverage | Gap |
|------|----------|-----|
| **SEC eFAST** | Filing submission portal | No compliance status checking, no penalty computation, no filing requirement determination |
| **SEC eSPARC** | New digital incorporation system | Incorporation only — no amendments, capital changes, or dissolution |
| **SEC Registration Calculator** | Basic incorporation fee computation | Limited to simple incorporation; no capital increases, amendments, or multi-action scenarios |
| **SEC HARBOR** | Beneficial ownership filing | Filing portal only — no ownership tracing computation or compliance checking |
| **FilePino** | Incorporation/compliance articles + services | Educational content, not computational tools |
| **Triple i Consulting** | Full compliance services | Professional services, not self-service tools |
| **Incorp Asia** | Incorporation + compliance outsourcing | Professional services, not self-service tools |

**Key gap:** No self-service tool exists for corporations to: (a) determine their own compliance status, (b) compute their penalty exposure, (c) determine their AFS filing tier, or (d) generate a remediation plan. All of these require professional intermediaries despite being fully computable from statutory rules.

## Summary of Domains Found

| # | Domain | Governing Law | Market Size (annual) | Professional Cost | Computability | Pain (1-5) |
|---|--------|---------------|---------------------|-------------------|---------------|------------|
| 1 | SEC Compliance Status Navigator & ECIP Calculator | RA 11232 s.177, MC-6-2024, MC-13-2024, MC-19-2023 | 170K-220K non-compliant + 527K total | P50K-200K+ per remediation | 5/5 | 5 |
| 2 | SEC Corporate Lifecycle Fee Engine | MC-3-2017, RA 11232 | 100K-120K fee computations/yr | P15K-100K+ (bundled with professional services) | 5/5 | 3 |
| 3 | HARBOR Beneficial Ownership Filing Wizard | MC-15-2025, RA 11232, AMLA | 527K+ corps (100K+ complex) | P10K-200K+ per entity/group | 4/5 | 5 |
| 4 | AFS Filing Threshold & Requirement Engine | MC-1-2025, SRC Rule 68.1, MC-2-2024 | 527K+ corps | P15K-300K+ (audit/review fees) | 5/5 | 4 |
| 5 | SEC Filing Self-Audit & Remediation Planner | RA 11232 s.177, MC-6-2024, MC-19-2023 | 170K-220K non-compliant | P15K-200K+ | 5/5 | 5 |
| 6 | SRC Reportorial Requirements Engine | RA 8799 s.17, SRC Rule 17 | 1,500-3,000 entities | P150K-1M+/year | 4/5 | 4 |

## Key Insight

The SEC filings space has two distinct opportunity zones:

1. **Mass-market compliance restoration** (Domains 1, 5): The 117,885 suspended corporations + ~100K non-compliant entities represent a massive one-time market for compliance status diagnosis and remediation planning. The SEC's own ECIP program proves the demand exists — corporations need to know their status and their cheapest path back to compliance. This is the "inheritance engine equivalent": take a corporation's profile, compute its exact compliance status, penalties owed, and optimal remediation pathway. Professional fees of P50K-200K+ for what is fundamentally a table lookup + arithmetic problem.

2. **Ongoing compliance infrastructure** (Domains 2, 3, 4, 6): Every corporate action (incorporation, capital change, amendment, dissolution) requires fee computation, and every year requires filing tier determination and deadline tracking. The threshold change (P600K → P3M for audit requirement) alone creates a P20K-100K+ savings opportunity for thousands of small corporations — but only if they know about it. HARBOR's 2026 launch creates fresh compliance pain for all 527K+ corporations.

The unified product vision: a **Corporate Compliance Dashboard** that shows any corporation its current status, pending obligations, penalty exposure, and optimal next actions — replacing the P120K-300K/year corporate secretary retainer for compliance monitoring.
