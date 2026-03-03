# TAM: Business Licensing & Compliance Tools Cluster

**Tools:**
- R-DTI-1: Annual Business Compliance Calendar (Score: 4.00)
- N-BFP-2: FSIC Compliance Calendar + FSMR Tracker (Score: 4.05)
- N-BFP-1: Fire Safety Equipment Requirements Screener (Score: 3.65)
- R-CDA-1: CDA Tax Exemption (CTE) Eligibility Checker + Navigator (Score: 3.50)

**Loop source:** regulatory-atlas

---

## Tool Definitions

| Tool ID | Tool Name | Core Function | Score |
|---------|-----------|---------------|-------|
| R-DTI-1 | Annual Business Compliance Calendar | DTI 5-yr expiry tracker + LGU January 20 renewal deadline + quarterly LBT installments + BIR filing calendar + mandated benefits reminders; all-in-one dashboard for sole proprietors | 4.00 |
| N-BFP-2 | FSIC Compliance Calendar + FSMR Tracker | Annual FSIC deadline + FSMR (Fire Safety Maintenance Report) submission + fire drill records + extinguisher maintenance schedule; January 20 business permit crunch; 1.2M+ businesses | 4.05 |
| N-BFP-1 | Fire Safety Equipment Requirements Screener | IRR Rule 10 Div.6–21 equipment requirements by occupancy type (11 types); pre-inspection diagnostic; ~170K closure failures/yr; FSP moat ₱10K–₱50K/consultation | 3.65 |
| R-CDA-1 | CDA Tax Exemption (CTE) Eligibility Checker + Navigator | CDA Category A/B/C classification; 60-day initial CTE window; 5-year renewal cycle; retroactive back-tax liability on late filing; CPAs charge ₱8K–₱50K/event; ~6K events/yr | 3.50 |

---

## R-DTI-1: Annual Business Compliance Calendar

### Consumer Segment

**Who:** DTI-registered sole proprietors (small business owners, freelancers operating under a registered business name) who must track multiple annual compliance deadlines: (1) DTI Business Name renewal (every 5 years, ₱300–₱2,000 fee), (2) LGU Mayor's Permit renewal (January 1–20 each year), (3) quarterly Local Business Tax (LBT) installment payments, (4) BIR tax filing calendar (monthly/quarterly/annual returns), and (5) SSS/PhilHealth/Pag-IBIG monthly remittance deadlines.

**Population:**

- **984,332** total DTI Business Name registrations (new + renewals) in CY2023 — Source: DTI Department of Trade and Industry, "DTI Hits New Record for Business Name Registrations in 2023," DTI Official News Release, January 2024 — Confidence: OFFICIAL
- **864,200** new BN registrations in CY2023 (88% of total); **120,132** renewals (12% of total) — Source: Same DTI press release, January 2024 — Confidence: OFFICIAL
- **937,431** total DTI BN registrations in CY2022 — Source: DTI news release, December 2022 — Confidence: OFFICIAL
- **923,383** total BN registrations/renewals as of October 6, 2024 (partial year) — Source: DTI announcement reported by Inquirer.net, "Sari-sari stores continue to dominate biz registrations in PH," November 2024 — Confidence: OFFICIAL (partial year)
- **DERIVED active BN stock: ~4.5M–5.0M** — BN registration is valid for 5 years; annual flow ~900K/yr × 5-yr validity = ~4.5M active BNs at any given time (DERIVED: annual average 2020–2024 = ~920K × 5 = 4.6M). Tool description cites "5M+ sole proprietors." — Confidence: DERIVED
- **Target subset — "multi-deadline" sole proprietors: ESTIMATED ~2.0M** — Of the ~4.5M BN stock, the relevant addressable population is those with MULTIPLE overlapping compliance obligations: (a) BIR individual self-employed and professional taxpayers = 2,186,544 (BIR CY2023 Annual Report); (b) PSA 2022 List of Establishments formal sector = 1,109,684; (c) DTI-registered businesses that ALSO have LGU permits and BIR registration = approximately the intersection of the BIR figure (2.19M) with the DTI active stock (4.5M); use 2M as a conservative addressable sub-population that has >1 compliance deadline to track — Confidence: ESTIMATED (no agency publishes the multi-registration overlap count)

**Addressable fraction:** 65% — PSA 2023 digital connectivity survey reports 54% national internet penetration; but DTI-registered business owners skew urban (60% of 2023 BN registrations were city/municipality-level, per DTI BNRD data) and commercially active, implying higher digital adoption. Use 65% as a blended estimate for business-owner digital adoption (PSA 2022 ICT Survey: 63% of MSMEs use internet for business; Statista 2024: 68% smartphone penetration among adults 18+).

**Addressable consumer population:** 2,000,000 × 65% = **1,300,000**

**Current professional cost:** A bookkeeper or CPA handling sole proprietor compliance charges ₱2,000–₱8,000/month for full compliance management (BIR filings + LGU coordination + mandated benefits). For compliance calendar tracking alone (reminder service only), freelance bookkeepers on platforms like Likhain or Taxumo partner programs charge ₱500–₱2,000/month. Most small sole proprietors rely on free informal reminders (Facebook groups, LGU notices) and miss deadlines, incurring penalties. BIR late filing penalty for individuals: 25% surcharge + 12%/year interest.

**Our consumer price:** ₱199/month (multi-agency compliance calendar, deadline alerts, DTI/LGU/BIR/mandated benefits all-in-one)

**Consumer TAM:** 1,300,000 × ₱199/mo × 12 = **₱310.4M/year**

---

### Professional Segment

**Who:** Bookkeepers and CPAs who manage compliance calendars for multiple sole proprietor clients. R-DTI-1 at the professional tier provides a multi-client dashboard: track deadlines for 20–200 sole proprietors from a single interface, auto-generate reminders, and export compliance status reports.

**Population:**

- **175,842** PRC-registered CPAs in the Philippines as of November 2024 — Source: PRC Monthly Bulletin, November 2024 (cited in Philippine Accountancy sector reports) — Confidence: OFFICIAL
- **~23,000** Philippine Institute of Certified Public Accountants (PICPA) members as of 2023 — Source: PICPA membership announcements (various); PICPA is the largest national CPA organization — Confidence: OFFICIAL (approximate; PICPA does not publish real-time member count)
- **ESTIMATED ~45,000–60,000 CPAs actively engaged in public practice or SME accounting** — DERIVED from: (a) BIR Accredited Tax Practitioners ~12,000 (those specifically accredited for BIR services); (b) PICPA registered public practitioners ~18,000–25,000; (c) bookkeepers (non-CPA but practicing compliance work) ~25,000–35,000 (ESTIMATED from BNRS data showing ~190K bookkeeping-related business names registered historically); blended total: ~45K-60K practitioners serving the sole proprietor market — Confidence: ESTIMATED
- **ESTIMATED ~25,000 professionals specifically serving DTI/LGU/multi-deadline compliance** for sole proprietors — DERIVED from the subset of CPAs/bookkeepers whose practice is oriented toward micro/small business compliance (as opposed to audit, tax advisory, or corporate finance). Given that BIR accredits ~12,000 tax practitioners and many bookkeepers serve small businesses without BIR accreditation, 25,000 is a reasonable mid-estimate for the professional segment addressable by R-DTI-1 — Confidence: ESTIMATED

**Clients per professional per year:** A solo bookkeeper handling sole proprietors manages 15–50 clients; an accounting firm may manage 100–500 sole proprietor clients across staff. For TAM calculation, each professional seat covers multiple clients.

**B2B price per seat:** ₱999/month (Solo Pro tier: unlimited client dashboards, deadline automation, client notification module)

**Professional TAM:** 25,000 × ₱999/mo × 12 = **₱299.7M/year**

---

### Total TAM — R-DTI-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~1.3M addressable sole proprietors | ₱199/mo | ₱310.4M |
| Professional (B2B) | ~25,000 bookkeepers/CPAs | ₱999/mo/seat | ₱299.7M |
| **Total TAM** | | | **₱610.1M** |

**SAM (Serviceable):** ₱244.0M — rationale: NCR + Luzon urban centers (Metro Manila, Metro Cebu, Metro Davao) account for approximately 60% of formal DTI registrations; digital adoption penetration among target segment in serviceable areas is higher (~70%); apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱2.44M
**SOM Year 3 (5%):** ₱12.2M

---

## N-BFP-2: FSIC Compliance Calendar + FSMR Tracker

### Consumer Segment

**Who:** Owners and operators of commercial, business, mercantile, educational, healthcare, industrial, and government buildings/establishments required by RA 9514 (Fire Code of the Philippines) to obtain an annual Fire Safety Inspection Certificate (FSIC) from the Bureau of Fire Protection. The FSIC is mandatory for LGU Mayor's Permit renewal; it must be renewed annually with the BFP-administered deadline converging at the January LGU renewal crunch. N-BFP-2 tracks: (1) FSIC expiry and renewal deadline, (2) FSMR (Fire Safety Maintenance Report) submission schedule, (3) fire drill conduct records, (4) fire extinguisher maintenance/recharging schedule.

**Population:**

- **1,609,316** buildings/establishments inspected by BFP in 1st Semester 2023 (excluding re-inspections) — Source: BFP, "1st Semester CY 2024 Narrative Accomplishment Report," October 2024 (citing comparative 1st Sem 2023 baseline) — Confidence: OFFICIAL
- **1,666,169** buildings/establishments inspected in 1st Semester 2024 (+3.53% YoY) — Source: BFP, "1st Semester CY 2024 Narrative Accomplishment Report" (bfp.gov.ph, October 2024) — Confidence: OFFICIAL
- **DERIVED full-year 2023 inspections (first-time/annual, excluding re-inspections): ~3,218,632** — DERIVED: 1st Sem 2023 = 1,609,316 × 2 = 3,218,632 (seasonal symmetry assumption — the January–June period includes the January Mayor's Permit renewal surge, so the actual H2 count may be lower; full-year total may be 3.0–3.4M) — Confidence: DERIVED
- **DERIVED FSIC compliance rate: 94.70%** — Source: BFP 1st Sem 2024 report: of 1,722,999 establishments inspected including re-inspections, 1,631,774 (94.70%) were issued FSIC — Confidence: OFFICIAL (1st Sem 2024)
- **DERIVED annual FSIC failures (non-compliant): ~170,000** — Source: DERIVED from tool description "~170K failures/yr = immediate closure." Cross-validated: 3.2M total first-time inspections × 5.3% failure rate = ~170K — Confidence: DERIVED
- **Active unique establishments requiring annual FSIC renewal: ESTIMATED ~1.2M** — Source: PSA 2022 List of Establishments: 1,109,684 formal establishments; 2024 MSME Statistics: 1,241,476 registered establishments. The tool description cites "1.2M+ businesses." The BFP inspects more establishments than the PSA LE count because the BFP covers informal businesses, kiosks, home-based businesses with public access, and government buildings not in the PSA LE universe — Confidence: ESTIMATED (PSA LE floor; BFP inspection data ceiling)
- **Occupancy breakdown (1st Sem 2024):** Mercantile = 59.10% of inspected; Business = 30.21%; other types (educational, residential, industrial, etc.) = 10.69% — Source: BFP 1st Sem 2024 Narrative Report — Confidence: OFFICIAL

**Addressable fraction:** 70% — Business owners/operators have higher internet access and digital tool adoption vs. general population. BFP's own push toward e-BFP digital portal (100+ LGUs enrolled by 2023) indicates digitally active compliance base. Use 70% addressable.

**Addressable consumer population:** 1,200,000 × 70% = **840,000**

**Current professional cost:** Fire Safety Practitioners (licensed professionals with BFP Certificate of Competency) charge ₱10,000–₱50,000 for a fire safety assessment and FSMR preparation. A compliance management retainer for FSMR + fire drill scheduling + extinguisher maintenance tracking runs ₱5,000–₱15,000/year for small establishments. Most small business owners currently rely on informal checklists and risk missing the FSMR submission (which triggers deficiency orders and FSIC non-renewal).

**Our consumer price:** ₱199/month (FSIC countdown timer, FSMR submission calendar, fire drill log, extinguisher maintenance reminder — mobile-friendly for business owners)

**Consumer TAM:** 840,000 × ₱199/mo × 12 = **₱200.5M/year**

---

### Professional Segment

**Who:** Licensed Fire Safety Practitioners (FSPs) — architects, civil engineers, mechanical engineers, electrical engineers, and sanitary engineers who have received a Certificate of Competency (COC) from the BFP under IRR Rule 3 of RA 9514. FSPs are legally required to prepare, sign, and certify FSCRs (Fire Safety Compliance Reports), FSCCRs, and FSMRs. N-BFP-2 at the professional tier functions as a multi-client compliance management dashboard for FSPs managing annual renewals across multiple establishment clients.

**Population:**

- **~26,000** PRC-registered architects (PRC data; architecture board exam passers cumulative) — Source: PRC Annual Report / Licensure Exam statistics (per PRC data-sources-registry) — Confidence: OFFICIAL
- **~330,000+** PRC-registered engineers (all disciplines: civil, mechanical, electrical, sanitary, chemical, etc.) — Source: PRC bulletin, cumulative across all engineering boards — Confidence: OFFICIAL
- **ESTIMATED ~6,000 active FSPs with BFP COC:** DERIVED from: (a) BFP COC program was formalized in 2022 under DILG Memorandum (DILG news, June 2022); (b) Program started with limited rollout; (c) Among the relevant disciplines (architects ~26K + mechanical engineers ~18K + electrical engineers ~20K + sanitary engineers ~8K = ~72K PRC-registered in COC-eligible professions), only early adopters have completed the 48-hour FSPTO training and passed BFP evaluation; (d) ~8% adoption rate in the first 2 years = ~5,760; round to 6,000 — Confidence: ESTIMATED (BFP has not published the COC registry publicly; no official count found in indexed sources)

**Clients per professional per year:** An FSP managing FSMR submissions for commercial clients handles 10–50 establishments annually. Larger fire safety consulting firms manage 100–500 buildings.

**B2B price per seat:** ₱999/month (Solo Pro tier: multi-building dashboard, client FSIC status, FSMR bulk preparation, deadline alerts)

**Professional TAM:** 6,000 × ₱999/mo × 12 = **₱71.9M/year**

---

### Total TAM — N-BFP-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~840K addressable businesses | ₱199/mo | ₱200.5M |
| Professional (B2B) | ~6,000 FSPs | ₱999/mo/seat | ₱71.9M |
| **Total TAM** | | | **₱272.4M** |

**SAM (Serviceable):** ₱108.9M — rationale: Metro Manila and large urban LGUs (Cebu, Davao, Iloilo) account for ~60% of commercial establishments and have the highest BFP enforcement intensity; digital FSP adoption highest here; apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱1.09M
**SOM Year 3 (5%):** ₱5.45M

---

## N-BFP-1: Fire Safety Equipment Requirements Screener

### Consumer Segment

**Who:** Business establishment owners, building managers, property developers, and compliance officers who need to determine the correct fire safety equipment requirements for their specific establishment type BEFORE the BFP inspection (or following a closure order after failure). N-BFP-1 applies IRR Rule 10 Divisions 6–21 of the Fire Code of the Philippines by occupancy type (mercantile, business, educational, industrial, residential, healthcare, assembly, storage, hazardous, high-rise, special structures) to output: mandatory extinguisher count/type/placement, fire alarm requirements, sprinkler thresholds, emergency lighting, exit signage, fire pump requirements, and fire drill frequency.

**Population:**

- **~1,200,000** active establishments requiring annual FSIC (same base as N-BFP-2) — Source: PSA 2022 LE (1,109,684 formal) + BFP inspection data (1.2M+ threshold from tool description) — Confidence: ESTIMATED
- **~170,000** establishments that fail BFP inspection annually and face immediate closure — Source: DERIVED from BFP 1st Sem 2024 data (94.70% compliance rate × 3.2M inspections = ~170K failures) corroborated by tool description — Confidence: DERIVED
- **Target high-urgency population:** 170K closures + pre-inspection preparation among the 1.2M = the 60% who proactively seek pre-inspection guidance

**Addressable fraction:** 60% — N-BFP-1 is a pre-inspection screening tool; 60% reflects business owners who proactively prepare vs. those who wait for BFP inspectors to identify deficiencies. The 40% who wait represent low-urgency non-users; the 60% who proactively prepare (especially after a failed inspection, a new business setup, or a renovation) are the addressable market.

**Addressable consumer population:** 1,200,000 × 60% = **720,000**

**Current professional cost:** Fire safety consultants charge ₱10,000–₱50,000 per consultation for an equipment requirements assessment (FSP retainer; per tool description). Many establishments engage fixer networks (informal) at ₱3,000–₱15,000 per permit cycle to handle the BFP process without understanding actual requirements. A self-service screener eliminates both costs.

**Our consumer price:** ₱149/one-time assessment (freemium model: free for one occupancy category, ₱149 for full IRR Rule 10 screener with specific equipment list, layout guidance, and pre-inspection checklist) OR ₱199/month bundled with N-BFP-2 FSIC Calendar.

**Consumer TAM (one-time pricing):** 720,000 × ₱149/use = **₱107.3M/year** (annual recurrence: most businesses re-assess upon renovation or after failed inspection)
**Consumer TAM (subscription bundled with N-BFP-2):** 720,000 × ₱199/mo × 12 = ₱1.72B (unrealistic standalone; intended as an N-BFP-2 bundle feature, not standalone subscription)

*Use ₱107.3M as the standalone consumer TAM for N-BFP-1 on one-time assessment pricing.*

---

### Professional Segment

**Who:** Same FSP population as N-BFP-2 — licensed professionals with BFP COC who use the screener to pre-qualify clients before site inspection and to prepare standardized equipment compliance reports.

**Population:**

- **~6,000 FSPs with BFP COC** (same derivation as N-BFP-2) — Confidence: ESTIMATED

**B2B price per seat:** ₱999/month (Solo Pro tier: unlimited occupancy screenings, IRR Rule 10 reference library, equipment specification export, client pre-inspection report generation)

**Professional TAM:** 6,000 × ₱999/mo × 12 = **₱71.9M/year**

---

### Total TAM — N-BFP-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~720K addressable establishments | ₱149/assessment | ₱107.3M |
| Professional (B2B) | ~6,000 FSPs | ₱999/mo/seat | ₱71.9M |
| **Total TAM** | | | **₱179.2M** |

**SAM (Serviceable):** ₱71.7M — apply 40% serviceable fraction (urban concentration, early-adopter FSPs, digital business owners).

**SOM Year 1 (1%):** ₱0.72M
**SOM Year 3 (5%):** ₱3.59M

*Note: N-BFP-1 is most valuable as a bundled feature within the N-BFP-2 FSIC Calendar subscription (FireReady PH cluster: N-BFP-1 + N-BFP-2 + N-BFP-3). As a standalone, it's a freemium acquisition tool. Bungled is the stronger go-to-market.*

---

## R-CDA-1: CDA Tax Exemption (CTE) Eligibility Checker + Navigator

### Consumer Segment

**Who:** Registered cooperatives in the Philippines seeking their initial CDA Tax Exemption Certificate (CTE) or 5-year renewal. The CTE is the gateway to all tax privileges under RA 9520 (Philippine Cooperative Code): income tax exemption, VAT exemption, withholding tax exemption, LGU business tax exemption. Classification as Category A (all 4 criteria: net surplus, member economic participation, compliance with CDA registration, and elected officers = co-op members) gets the full exemption; Category B/C = partial exemption. Tool navigates: (1) eligibility determination, (2) document checklist, (3) 60-day initial window from registration, (4) 5-year renewal timeline, (5) retroactive tax liability warning if CTE lapses.

**Population:**

- **~20,000 total registered cooperatives** — Source: CDA official statements and Senate plenary discussions (Senator Marcos citing CDA report: 56 billionaire cooperatives; context of CDA consolidation from 60,000 to 20,000 registered cooperatives after cleanup of micro-cooperatives); corroborated by CDA Annual Report 2023 (PDF available but not extractable at size) — Confidence: ESTIMATED (official source cited but specific 2023 figure not directly retrieved from indexed page)
- **~19,082 operating cooperatives as of December 31, 2016** with **9,432 reporting cooperatives** — Source: Philippines Key Figures National Report, Coops4Dev, data as of December 31, 2016 — Confidence: OFFICIAL (dated)
- **~7,647,800 total cooperative members as of 2016** (across 9,432 reporting cooperatives) — Source: Philippines Key Figures National Report, Coops4Dev, December 2016 — Confidence: OFFICIAL (dated)
- **~226,400 cooperative employees as of 2016** — Source: Same Coops4Dev report — Confidence: OFFICIAL (dated)
- **~12,000–14,000 active/operating cooperatives (2023):** ESTIMATED from: (a) Ilocos Region: 2,129 registered; 1,272 operating = 59.7% operating ratio (PNA, citing CDA, November 2024); (b) applying 60% operating ratio to ~20,000 registered = ~12,000 operating; (c) Bicol Region: 1,534 registered as of end 2022 (CDA Region V statistics) — Confidence: ESTIMATED (regional extrapolation)
- **CTE events per year: ~6,000** — Source: Tool description ("~6K events/yr"). Composed of: new cooperatives (annual new registrations = ESTIMATED ~300–500/yr based on regional data), initial CTE applications (60-day window from registration), and 5-year CTE renewals (14,000 active ÷ 5 = 2,800/yr renewals + amendments/reclassifications). The ~6K figure appears to include all CDA compliance events (not just CTE) — Confidence: ESTIMATED (tool description; no BIR or CDA published annual count of CTE certificates issued)

**Addressable fraction:** 70% — Cooperatives are formal organizations by definition (CDA registration, General Assembly, AFS filing); they have designated officers and often an internal or external accountant. Digital adoption among cooperative compliance officers is higher than among individual micro-businesses; use 70%.

**Addressable consumer population:** 14,000 × 70% = **9,800**

**Current professional cost:** CPAs and cooperative compliance consultants charge ₱8,000–₱50,000 per CTE application or renewal event (per tool description). Annual cooperative compliance retainer (AFS preparation + GAS + BIR compliance + CDA submissions) typically runs ₱30,000–₱120,000/year per cooperative. The CTE navigator specifically addresses the classification and documentation gap that causes many cooperatives to miss their 60-day initial window or let their 5-year renewal lapse.

**Our consumer price:** ₱199/month (cooperative compliance tier: CTE eligibility checker, document tracker, 5-year renewal countdown, retroactive tax exposure estimator)

**Consumer TAM:** 9,800 × ₱199/mo × 12 = **₱23.4M/year**

---

### Professional Segment

**Who:** CPAs and cooperative compliance consultants who serve cooperatives' annual compliance obligations: AFS preparation, BIR compliance, General Assembly documentation, CDA AFS submission, and CTE renewal. The R-CDA-1 professional tier provides a multi-cooperative management dashboard.

**Population:**

- **175,842** PRC-registered CPAs total (Philippines, November 2024) — Source: PRC Monthly Bulletin, November 2024 — Confidence: OFFICIAL
- **ESTIMATED ~8,750 CPAs who serve cooperatives** — DERIVED from: 175,842 CPAs × ~5% who have cooperative clients as a significant portion of their practice = ~8,750 — Confidence: ESTIMATED (no PRC or PICPA sub-specialty breakdown for cooperative accounting)
- **ESTIMATED ~3,000 CPAs actively handling CTE applications + annual cooperative compliance** — DERIVED from: ~6,000 CTE events/yr (tool description) ÷ average 2 events per active CPA/year = ~3,000 active CPA-cooperative specialists — Confidence: ESTIMATED (methodology disclosed)

**Clients per professional per year:** A CPA specializing in cooperative compliance manages 3–20 cooperative clients annually (smaller than general CPA practice due to specialized knowledge requirements of RA 9520, CDA regulations, and cooperative accounting standards).

**B2B price per seat:** ₱999/month (Solo Pro tier: multi-cooperative CTE status tracking, document checklist per cooperative, compliance calendar for all client cooperatives, Category A/B/C eligibility re-assessment trigger)

**Professional TAM:** 3,000 × ₱999/mo × 12 = **₱35.9M/year**

---

### Total TAM — R-CDA-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | ~9,800 addressable cooperatives | ₱199/mo | ₱23.4M |
| Professional (B2B) | ~3,000 CPA-cooperative specialists | ₱999/mo/seat | ₱35.9M |
| **Total TAM** | | | **₱59.3M** |

**SAM (Serviceable):** ₱23.7M — rationale: Cooperatives are nationwide but those with sophisticated CTE compliance needs cluster in urban and semi-urban areas (Metro Manila, Region 3, Region 4A, Cebu) where CDA enforcement is highest; apply 40% serviceable fraction.

**SOM Year 1 (1%):** ₱0.24M
**SOM Year 3 (5%):** ₱1.19M

*Note: R-CDA-1 is best positioned as a premium module within a broader business compliance platform rather than a standalone subscription. The cooperative market is too small (~14K active coops) for a dedicated product; but as a niche add-on within a B2B compliance suite, it serves as a moat differentiator (CPAs handling cooperatives have no dedicated digital tool for CTE navigation).*

---

## Cluster Total TAM — Business Licensing & Compliance

| Tool | Segment | Population | Price | Annual TAM |
|------|---------|-----------|-------|-----------|
| R-DTI-1 | Consumer | ~1.3M addressable sole proprietors | ₱199/mo | ₱310.4M |
| R-DTI-1 | Professional (bookkeepers/CPAs) | ~25,000 | ₱999/mo | ₱299.7M |
| N-BFP-2 | Consumer | ~840K businesses | ₱199/mo | ₱200.5M |
| N-BFP-2 | Professional (FSPs) | ~6,000 | ₱999/mo | ₱71.9M |
| N-BFP-1 | Consumer | ~720K businesses | ₱149/assessment | ₱107.3M |
| N-BFP-1 | Professional (FSPs) | ~6,000 | ₱999/mo | ₱71.9M |
| R-CDA-1 | Consumer | ~9,800 cooperatives | ₱199/mo | ₱23.4M |
| R-CDA-1 | Professional (CPA-coop) | ~3,000 | ₱999/mo | ₱35.9M |
| **Total TAM (all tools)** | | | | **₱1,121.0M** |

**SAM (Serviceable, blended):** ₱448.4M — 40% of total TAM, accounting for geographic concentration in urban centers, digital adoption rate in each segment, and market awareness constraints.

**SOM Year 1 (1% of SAM):** ₱4.48M
**SOM Year 3 (5% of SAM):** ₱22.4M

**Revenue priority ranking within cluster:**
1. R-DTI-1 Consumer TAM (₱310.4M) — largest addressable market; 1.3M sole proprietors with recurring multi-deadline compliance pain; mass consumer play
2. R-DTI-1 Professional TAM (₱299.7M) — bookkeeping and accounting profession serving SMEs; strong SaaS retention (client relationships are sticky)
3. N-BFP-2 Consumer TAM (₱200.5M) — 840K businesses with mandatory annual FSIC; January 20 crunch = acute annual pain moment; high conversion trigger
4. N-BFP-1 Consumer TAM (₱107.3M) — one-time assessment model; freemium funnel; best as N-BFP-2 acquisition channel
5. N-BFP-1 Professional TAM (₱71.9M) — FSP market; same seat price as N-BFP-2; bundle play (FireReady PH cluster)
6. N-BFP-2 Professional TAM (₱71.9M) — FSPs, small but recurring; strong moat through required FSMR professional certification
7. R-CDA-1 Professional TAM (₱35.9M) — CPA niche; small absolute TAM but zero competition; moat play
8. R-CDA-1 Consumer TAM (₱23.4M) — cooperative direct; small market (14K coops), best as B2B-facing tool for CPAs

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| DTI BN registrations 2023: 984,332 total | DTI Official News Release, "DTI Hits New Record for Business Name Registrations in 2023" | Jan 2024 | OFFICIAL |
| DTI BN new registrations 2023: 864,200 (88%) | Same DTI press release | Jan 2024 | OFFICIAL |
| DTI BN renewals 2023: 120,132 (12%) | Same DTI press release | Jan 2024 | OFFICIAL |
| DTI BN registrations 2022: 937,431 | DTI Annual Report / Press Release December 2022 | 2022 | OFFICIAL |
| DTI BN registrations 2024 partial (as of Oct 6): 923,383 | Inquirer.net/DTI announcement, November 2024 | 2024 | OFFICIAL (partial) |
| DTI BN active stock ~4.5-5M | DERIVED: 5-yr validity × ~900K annual flow | 2024 | DERIVED |
| PSA 2022 List of Establishments: 1,109,684 | PSA 2022 LE (per DTI MSMED Plan 2023–2028 citation) | 2022 | OFFICIAL |
| PSA 2024 MSME Statistics: 1,241,476 establishments | DTI MSME Statistics in Brief (as of November 22, 2024) | 2024 | OFFICIAL |
| BFP 1st Sem 2023 inspections: 1,609,316 | BFP 1st Sem CY 2024 Narrative Report (comparative baseline) | 2024 | OFFICIAL |
| BFP 1st Sem 2024 inspections: 1,666,169 (+3.53%) | BFP 1st Sem CY 2024 Narrative Accomplishment Report (bfp.gov.ph, Oct 2024) | 2024 | OFFICIAL |
| FSIC compliance rate 94.70% (1st Sem 2024) | BFP 1st Sem CY 2024 Narrative Accomplishment Report | 2024 | OFFICIAL |
| FSIC issued 1,631,774 of 1,722,999 inspected (1st Sem 2024) | Same BFP report | 2024 | OFFICIAL |
| Mercantile occupancy 59.10%; Business 30.21% | BFP 1st Sem CY 2024 Narrative Report | 2024 | OFFICIAL |
| BFP annual failures ~170K | DERIVED from BFP compliance rate × est. annual inspections; corroborated by tool description | 2023–2024 | DERIVED |
| Active cooperatives ~12,000–14,000 | ESTIMATED from Ilocos Region 60% operating rate (PNA/CDA data) × 20,000 registered | 2024 | ESTIMATED |
| Operating cooperatives as of Dec 31, 2016: 19,082 | Philippines Key Figures National Report, Coops4Dev | 2016 | OFFICIAL (dated) |
| Cooperative members (2016): 7,647,800 | Same Coops4Dev report | 2016 | OFFICIAL (dated) |
| Cooperative employees (2016): 226,400 | Same Coops4Dev report | 2016 | OFFICIAL (dated) |
| PRC-registered CPAs: 175,842 | PRC Monthly Bulletin, November 2024 | 2024 | OFFICIAL |
| FSPs with BFP COC: ~6,000 | ESTIMATED from PRC eligible disciplines × early-adopter rate post-2022 COC program | 2024 | ESTIMATED |
| BFP COC program for FSPs formalized | DILG news release, June 2022 (citing DILG Secretary Año memorandum) | 2022 | OFFICIAL |

---

## Notes & Caveats

1. **DTI "active stock" vs. annual flow distinction:** DTI reports annual flows (~984K in 2023), not the cumulative stock of active BNs. Since BN validity is 5 years, the stock of active BNs is roughly 5× the annual flow minus cancellations and non-renewals. The ~4.5M–5M figure is DERIVED and represents maximum exposure; actual active businesses are likely lower due to dormancy, cancellation, and the fact that many sari-sari stores registered at barangay level operate without further compliance obligations.

2. **PSA LE vs. DTI BN count:** The PSA 2022 List of Establishments (1.1M) is far lower than the DTI BN stock (~4.5M) because: (a) PSA LE covers establishments with at least one paid employee (micro + formal sectors); (b) many DTI-registered BNs are sole-operator home-based businesses not captured in PSA LE; (c) DTI registration is often the first step before LGU permits, and many registered BNs never proceed to full operation. For R-DTI-1, both populations matter but with different product-market fit: formal-sector businesses (PSA LE ~1.2M) are higher-value, multi-deadline users; the broader DTI stock (~4.5M) includes many single-deadline users who only need the DTI renewal reminder.

3. **BFP FSP count opacity:** The BFP Certificate of Competency (COC) program for Fire Safety Practitioners was formalized in June 2022. BFP has not published a public registry of COC holders. The ~6,000 estimate is based on the recency of the program, the estimated eligible professional population (PRC-registered disciplines required to have COC), and typical adoption rates for new professional certification requirements. The actual count may be lower (if COC processing has been slow) or higher (if BFP fast-tracked large batches). An FOI request to BFP FSED would provide the definitive count.

4. **CDA cooperative count uncertainty:** CDA's FY 2023 Cooperative Statistics (posted March 2025) and CDA Annual Report 2023 both exist as published documents but their full numerical tables were not retrievable from indexed sources. The ~20,000 registered / ~14,000 active figures are triangulated from: (a) Senate floor statements citing CDA data on consolidation from 60,000 to 20,000; (b) regional data extrapolation (Ilocos 2,129 × national scaling); (c) the 2016 Coops4Dev baseline of 19,082 operating cooperatives as a floor. The CDA Annual Report 2023 PDF is the definitive source; its size exceeds fetch limits.

5. **N-BFP-1 pricing model:** The ₱149/one-time model is more appropriate than ₱199/month for N-BFP-1 because: (a) fire safety equipment requirements change only when the establishment renovates, changes occupancy, or after a failed inspection; (b) monthly subscription for a once-a-year assessment is poor value proposition; (c) better as a freemium acquisition tool (free basic screening → paid N-BFP-2 FSIC Calendar subscription). The TAM using one-time pricing (₱107.3M) understates potential if bundled with N-BFP-2 subscription.

6. **R-DTI-1 competition:** LGU digitalization initiatives (ARTA's BOSS, DICT's eLGU) are creating government-run compliance tracking portals. These are free but fragmented by LGU and do not cover the cross-agency calendar (BIR + mandated benefits + DTI together). R-DTI-1's moat is the multi-agency, all-in-one calendar that no single government portal provides.

7. **Cooperative market size ceiling:** With only ~14,000 active cooperatives, R-CDA-1 will never be a large standalone product. Its value is as a premium feature within a broader compliance platform (alongside R-DTI-1 and N-BFP-2) or as a B2B niche tool marketed to CPA firms with cooperative clients. The professional TAM (₱35.9M) exceeds the consumer TAM (₱23.4M), confirming the B2B orientation.
