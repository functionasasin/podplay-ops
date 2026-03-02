# TAM: Corporate & SEC Compliance Tools

**Cluster:** E — Corporate SEC
**Tools:** E1 (SEC Navigator), E2 (SEC Lifecycle), E3 (HARBOR), E4 (AFS Filing), E5 (Capital Changes), E6 (OSH Staffing)
**Research date:** 2026-03-02
**Data years:** 2024 (primary); 2021–2023 where 2024 not available

---

## Population Data

### 1. SEC-Registered Active Corporations (Total Addressable Universe)

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total active SEC-registered companies | 527,710 | SEC press release / BusinessWorld Feb 2025 | End-2024 | OFFICIAL |
| New registrations (2024) | 52,304 | SEC press release | 2024 | OFFICIAL |
| New registrations (2023) | 49,506 | SEC press release | 2023 | OFFICIAL |
| New registrations (2022) | 42,936 | SEC press release | 2022 | OFFICIAL |

**Source:** [SEC via BusinessWorld, Feb 2025](https://www.bworldonline.com/corporate/2025/02/05/651127/corporate-registrations-rise-6-to-52304-sec/)

The 527,710 figure is the primary universe for all E-cluster tools. This is the "active" count — it excludes suspended (117,885), delinquent (298,335 at-risk), and revoked/dissolved corporations.

---

### 2. Breakdown by Entity Type (New Registrations, 2024)

| Type | 2024 New Registrations | Share |
|------|----------------------|-------|
| Stock corporations | 39,146 | 75% |
| Non-stock corporations | 10,782 | 21% |
| Partnerships | 2,376 | 5% |
| — One Person Corporations (subset of stock) | 8,640 | ~17% of stock |

**Source:** SEC press release, Feb 2025

**Cumulative type breakdown (active, from end-2021 SEC PDF):**
- Non-stock corporations active: 191,704
- Partnerships active: 114,843 (general: 98,334; limited: 12,284; professional: 4,188)
- Note: Active stock corporations not separately published in the end-2021 PDF; implied ~330,000 given 636,647 total active and 191,704 non-stock + 114,843 partnerships
- Cumulative all-time registered (all statuses): 1,119,919 as of end-2021

**Source:** [SEC Cumulative PDF, Dec 2021](https://sec.gov.ph/wp-content/uploads/2022/01/2022_Cumulative-Number-of-Registered-Corporations-and-Partnerships-as-of-31-December-2021.pdf)

---

### 3. Compliance Status: Suspended, Delinquent, Revoked

| Status | Count | Source | Date | Confidence |
|--------|-------|--------|------|------------|
| Suspended (Feb 2024 batch order) | 117,885 | SEC Order Feb 16, 2024 / Business Inquirer | Feb 2024 | OFFICIAL |
| Delinquent (failed to file GIS/AFS 3x in 5 years) | 298,335 | SEC via Philstar / SEC Region 7 data | Oct 2024 | OFFICIAL |
| At risk of revocation (cited Dec 2024) | 22,403 | SEC via Philstar Dec 2024 | Dec 2024 | OFFICIAL |
| Corporations facing suspension (Dec 2024 new batch) | 11,677+ | Philstar Dec 2024 | Dec 2024 | OFFICIAL |
| Revoked cumulative (as of end-2021) | 272,848 | SEC Cumulative PDF | End-2021 | OFFICIAL |
| Suspended (as of end-2021, before Feb 2024 wave) | 74,161 | SEC Cumulative PDF | End-2021 | OFFICIAL |
| Total inactive (all categories, end-2021) | 383,272 | SEC Cumulative PDF | End-2021 | OFFICIAL |

**Key note on the Feb 2024 suspension order:** The SEC's Company Registration and Monitoring Department issued SEC Order dated February 16, 2024 suspending 117,885 corporations for "failure to submit their annual reports for more than five years" under Section 177 of the Revised Corporation Code (RA 11232). The prior batch pre-2024 had 74,161 suspended as of end-2021. The total suspended universe in Feb 2024 is the new high-water mark.

**Source:** [Business Inquirer, Feb 2024](https://business.inquirer.net/446549/sec-suspends-nearly-118000-firms-for-annual-report-snub); [Philstar Feb 2024](https://www.philstar.com/business/2024/02/22/2335102/over-100000-firms-suspended); [Philstar Nov 2024 — Region 7 data showing national compliance figures](https://www.philstar.com/the-freeman/cebu-news/2024/11/30/2404046/sec-region-7-home-over-500t-companies)

---

### 4. Annual GIS and AFS Filers

The SEC does not publish a standalone count of annual GIS or AFS filers. Estimates are derived from the active corporation count and compliance history:

| Estimate | Methodology | Number | Confidence |
|---------|-------------|--------|------------|
| Active corporations required to file annual GIS | = total active companies | 527,710 | DERIVED |
| Active corporations required to file annual AFS | Stock corps + applicable non-stock (with revenues) — approximately 65–70% of active | ~340,000–370,000 | ESTIMATED |
| Actually compliant (filing GIS, as proxy) | 527,710 active − 298,335 delinquent − 117,885 suspended ≈ universe less non-compliant | ~111,490 in good standing (rough) | ESTIMATED |
| 2023 Amnesty Program enrollees (restored good standing) | SEC press release | 81,700+ | OFFICIAL |

**Notes on GIS/AFS compliance:** The large discrepancy between total active (527,710) and delinquent (298,335) plus suspended (117,885) suggests the total "bad standing" population exceeds active corporations — indicating these figures include companies that were active at the time of non-compliance classification but may have since been reclassified. The SEC Region 7 data (Oct 2024) reported 517,102 companies in that region alone across all statuses, which is likely a cumulative registered (active + inactive) count for that region, not purely active.

---

### 5. ECIP and Amnesty Program Data

| Program | Participants | Year | Confidence |
|---------|-------------|------|------------|
| 2023 SEC Amnesty Program (MC No. 2, Series of 2023) | 81,700+ corporations | Mar–Dec 2023 | OFFICIAL |
| ECIP 2024 (MC No. 13, Series of 2024) — by Nov 28, 2024 | 3,200+ corporations | 2024 | OFFICIAL |

**Note:** The ECIP offered non-compliant corporations a fixed ₱20,000 penalty to restore good standing (vs. assessed fines 900–1,900% higher under MC No. 6, Series of 2024). The amnesty in 2023 was at ₱5,000 flat.

**Source:** [Grant Thornton Philippines on ECIP](https://www.grantthornton.com.ph/insights/articles-and-updates1/tax-notes/sec-grants-relief-to-non-compliant-firms-through-the-enhanced-compliance-incentive-program-ecip/)

---

### 6. HARBOR — Beneficial Ownership Registry

| Data Point | Detail | Confidence |
|-----------|--------|------------|
| Legal basis | SEC Memorandum Circular No. 15, Series of 2025 | OFFICIAL |
| Effective date | January 1, 2026 (MC effective); HARBOR filing starts January 30, 2026 | OFFICIAL |
| Covered entities | ALL stock and non-stock corporations, OPCs, partnerships, foreign corps — ALL under SEC jurisdiction | OFFICIAL |
| Total covered (= all active registered) | 527,710 active + suspended/delinquent required to file upon reinstatement | OFFICIAL |
| OPCs/partnerships conditional | Only required if beneficial owner differs from registered sole stockholder/partner | OFFICIAL |
| New corps: HARBOR required at incorporation | Certificate not issued without BO disclosure | OFFICIAL |
| Platform | harbor.sec.gov.ph (requires eSECURE account) | OFFICIAL |
| Prior GIS BO data | BO section removed from GIS effective Jan 30, 2026 — moved to HARBOR | OFFICIAL |

**Implication for TAM:** HARBOR covers the entire ~527,710 active corporation universe (plus the ~22,403 corps seeking reinstatement from revocation risk). Every SEC-registered stock corp and relevant non-stock corp must file through HARBOR — no carve-outs for size.

**Source:** [Cruz Marcelo on HARBOR launch](https://cruzmarcelo.com/sec-launches-harbor-for-beneficial-ownership-disclosures-and-amends-gis-form/); [SEC MC 15 via Lexology](https://www.lexology.com/library/detail.aspx?g=8d265035-0147-42c9-9475-917f6c94244e); [PwC Philippines 2026 recap](https://www.pwc.com/ph/en/tax/tax-publications/taxwise-or-otherwise/2026/keeping-up-with-sec-updates.html)

---

### 7. OSH Safety Officer Requirements (E6 — OSH Staffing Tool)

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Formal sector establishments with 20+ workers (ISLE survey) | 36,342 | PSA 2021/2022 ISLE survey | Aug 2022 | OFFICIAL |
| Small establishments (10–99 workers) by PSA classification | 109,910 | PSA List of Establishments 2023 (LE survey) | 2023 | OFFICIAL |
| Medium establishments (100–199 workers) by PSA | 4,763 | PSA List of Establishments 2023 | 2023 | OFFICIAL |
| Large establishments (200+ workers) by PSA | 4,640 | PSA List of Establishments 2023 | 2023 | OFFICIAL |
| Total establishments 10+ workers (small + medium + large) | ~119,313 | DERIVED: 109,910 + 4,763 + 4,640 | 2023 | DERIVED |
| Formal sector establishments (20+) implementing OSH programs | 33,650 (92.6%) | PSA 2021/2022 ISLE | 2021 | OFFICIAL |
| Formal sector establishments (20+) designating safety officers | 86.4% of 36,342 = ~31,400 | PSA 2021/2022 ISLE | 2021 | OFFICIAL |
| Total formal sector private establishments (all sizes, ASPBI) | 281,825 | PSA 2022 ASPBI | 2022 | OFFICIAL |

**Legal trigger for E6:** RA 11058 and DOLE DO 198-18 (now superseded by DOLE DO 252-25 of 2025) require:
- Every workplace (not per company) to have at least one trained safety officer (SO1)
- Establishments with 10+ workers and medium/high risk require escalating levels (SO2, SO3)
- DOLE's regular inspection covers establishments with 10–199 workers; 200+ use self-assessment

**Source:** [PNA on safety officer mandate](https://www.pna.gov.ph/articles/1182289); [PSA 2021/2022 ISLE highlights](https://psa.gov.ph/content/highlights-20212022-integrated-survey-labor-and-employment-module-employment-august-2022); [PSA 2022 ASPBI Economy-Wide](https://psa.gov.ph/content/2022-annual-survey-philippine-business-and-industry-aspbi-economy-wide-preliminary-results); [DOLE DO 252-25 via Lexology](https://www.lexology.com/library/detail.aspx?g=d7451810-48f1-4749-a955-783e71298029); [DTI MSME Stats 2023 for establishment PSA counts](https://www.dti.gov.ph/resources/msme-statistics/)

**Note:** The PSA List of Establishments and ASPBI cover "formal sector" only (registered, with employees); they exclude purely self-employed and informal micro businesses. The 10+ threshold for required safety officers maps most closely to PSA's "small" category (10–99) + medium + large = ~119,313 establishments. This is the primary addressable market for E6.

---

### 8. Corporate Secretaries and Corporate Lawyers

| Data Point | Number | Source | Year | Confidence |
|-----------|--------|--------|------|------------|
| Total lawyers on Roll of Attorneys (base, Nov 2022) | 84,236 | Supreme Court Roll (deborjalaw.com masterlist) | Nov 2022 | OFFICIAL |
| Estimated total lawyers (end-2024) | ~92,010 | DERIVED: 84,236 + 3,812 (2023 Bar) + 3,962 (2024 Bar) | End-2024 | DERIVED |
| New lawyers admitted (2024 Bar) | 3,942 (took oath Jan 2025) | Supreme Court announcement | Jan 2025 | OFFICIAL |
| New lawyers admitted (2023 Bar) | 3,812 | Supreme Court announcement | Dec 2023 | OFFICIAL |
| New lawyers admitted (2022 Bar) | 3,992 | Supreme Court announcement | May 2023 | OFFICIAL |
| New lawyers admitted (2020–2021 "Biggest Bar Ever") | 8,241 | Supreme Court announcement | Feb 2022 | OFFICIAL |
| IBP active living members (older estimate) | ~40,000 | Wikipedia / Jemy Gatdula, UA&P | 2016 | ESTIMATED |

**Note on the 84,236 figure:** This is the cumulative number of lawyers who have ever signed the Roll of Attorneys since 1901 through approximately November 2022. It includes deceased, retired, and disbarred lawyers where records have not been purged. The IBP "active living members" figure (~40,000 as of 2016) is the closer proxy for practicing lawyers, but is severely outdated. With ~4,000 new lawyers per year, a reasonable 2024 estimate for living/active practitioners is 55,000–65,000, though no official aggregate is publicly available.

**Lawyers are not regulated by PRC** — they are regulated by the Supreme Court. Lawyers' compliance with IBP dues and MCLE (Mandatory Continuing Legal Education) is required to maintain good standing, but a count of "active in good standing" lawyers is not published.

**Source:** [Supreme Court — 3,942 new lawyers Jan 2025](https://sc.judiciary.gov.ph/3942-new-lawyers-take-their-oath-sign-roll-of-attorneys/); [Supreme Court — 3,962 pass 2024 Bar](https://sc.judiciary.gov.ph/3962-new-lawyers-up-graduate-tops-the-2024-bar-exams/); [IBP Wikipedia](https://en.wikipedia.org/wiki/Integrated_Bar_of_the_Philippines)

**Corporate secretaries:** Under the Revised Corporation Code, every corporation must have a corporate secretary who must be a Filipino citizen and a resident of the Philippines. The corporate secretary is not required to be a lawyer (though in practice most are). No PRC registry exists for corporate secretaries as a separate profession. The ~527,710 active corporations each require one corporate secretary, making the corporate secretary population by implication approximately equivalent to the active corporation count (with overlap where lawyers serve as corporate secretary for multiple corporations).

---

## TAM Calculations

### E1 — SEC Navigator (Compliance Checklist / Regulatory Q&A)

**Target:** All SEC-registered active corporations needing to understand their reportorial obligations
- Primary universe: 527,710 active corporations (end-2024)
- Secondary universe: 298,335 delinquent + 117,885 suspended = 416,220 corporations that need reinstatement guidance
- Total addressable: ~527,710 active (immediate need for ongoing compliance) + ~416,220 non-compliant (urgent need for remediation)
- **TAM denominator: 527,710** (active corporations; the delinquent/suspended are a bonus segment)

At ₱999/yr per corporation:
- 527,710 × ₱999 = **₱527M/yr TAM**

At ₱499/yr:
- 527,710 × ₱499 = **₱263M/yr TAM**

### E2 — SEC Lifecycle (Registration → Annual Reports → Amendments → Dissolution)

**Target:** Same as E1 — all active corporations plus new annual entrants
- New registrations per year: ~49,000–52,000 (growing at ~6%/yr)
- These new corporations have immediate need for lifecycle guidance

Same universe as E1.

### E3 — HARBOR (Beneficial Ownership Filing Tool)

**Target:** All entities required to file beneficial ownership through HARBOR
- All active stock and non-stock corporations: 527,710
- Plus ~416,220 delinquent/suspended requiring reinstatement + HARBOR filing
- Plus ~2,376 new partnerships and ~52,304 new corporations per year (filing at inception)
- Mandatory as of January 30, 2026 — no opt-out
- **TAM denominator: 527,710** active corporations (near-term) + reinstatement pipeline

At ₱499/yr per entity:
- 527,710 × ₱499 = **₱263M/yr TAM**

### E4 — AFS Filing (Audited Financial Statements Preparation Support)

**Target:** Corporations required to file AFS annually (stock corporations; non-stock if with revenues above threshold)
- Primary: ~75% of active = ~395,783 stock corporations (approx; using 75% composition of new registrations as proxy for stock share of cumulative active)
- Many non-stock corps with revenues also file AFS
- Conservative AFS-obligated universe: ~350,000–400,000 corporations
- **TAM denominator: ~370,000** (midpoint estimate)

At ₱1,999/yr:
- 370,000 × ₱1,999 = **₱740M/yr TAM**

### E5 — Capital Changes (Increase/Decrease Capital, Amendments)

**Target:** Corporations undergoing capital structure changes
- Annual new registrations: ~52,304 (all require initial capitalization documentation)
- Corporations doing capital increases/amendments annually: estimated 5–10% of active = ~26,000–53,000/yr
- **TAM denominator: ~52,000/yr** (event-driven tool)

At ₱4,999 per transaction:
- 52,000 × ₱4,999 = **₱260M/yr TAM**

### E6 — OSH Staffing (Safety Officer Requirement Calculator)

**Target:** Private establishments required to designate safety officers under RA 11058
- Establishments with 10+ workers: ~119,313 (PSA 2023 LE data: small 109,910 + medium 4,763 + large 4,640)
- Of these, formal sector establishments (20+) designating safety officers: already ~31,400 compliant
- Non-compliant (10+ workers but not yet fully compliant): remainder of the 119,313
- **TAM denominator: ~119,313** establishments with 10+ workers

At ₱2,999/yr per establishment:
- 119,313 × ₱2,999 = **₱358M/yr TAM**

At ₱999/yr:
- 119,313 × ₱999 = **₱119M/yr TAM**

---

## Summary TAM Table — E Cluster

| Tool | TAM Denominator | Population Source | Price Point | Annual TAM | Confidence |
|------|----------------|-------------------|-------------|------------|------------|
| E1 SEC Navigator | 527,710 active corps | SEC press release 2025 | ₱999/yr | ₱527M | OFFICIAL base |
| E2 SEC Lifecycle | 527,710 active corps | SEC press release 2025 | ₱999/yr | ₱527M | OFFICIAL base |
| E3 HARBOR | 527,710 active corps (mandatory) | SEC MC 15-2025 | ₱499/yr | ₱263M | OFFICIAL base |
| E4 AFS Filing | ~370,000 AFS-obligated corps | DERIVED: 70% of active | ₱1,999/yr | ₱740M | DERIVED |
| E5 Capital Changes | ~52,000/yr event-driven | SEC annual new registrations | ₱4,999/event | ₱260M | OFFICIAL base |
| E6 OSH Staffing | ~119,313 establishments 10+ workers | PSA LE 2023 | ₱2,999/yr | ₱358M | OFFICIAL base |

**Cluster total (unduplicated):** The E1/E2/E3 tools target the same 527,710 corporation universe. At bundle pricing (₱2,499/yr for E1+E2+E3), bundle TAM = 527,710 × ₱2,499 = **₱1.32B/yr TAM**. Adding E4, E5, E6 brings total cluster TAM to approximately **₱2.4B/yr** at stated price points.

---

## Key TAM Caveats

1. **Active vs. compliant:** The 527,710 figure is "active" (not suspended/revoked/delinquent). However, a substantial portion of active corporations are in marginal compliance and are prime targets for compliance tools. The ~298,335 delinquent and ~117,885 suspended represent a near-term reinstatement market but lower ability to pay.

2. **OPC growth is the fastest segment:** OPCs grew 27% YoY (6,794 to 8,640 in 2024). Solo founders forming OPCs are digital-native, likely to adopt SaaS tools, and have no in-house compliance staff — ideal ICP.

3. **Non-stock corps (191,704+ cumulative) are harder to monetize:** Many are civic/religious organizations with minimal resources. The monetizable non-stock segment is associations and foundations with professional management.

4. **OSH tool (E6) addresses a different buyer:** HR managers and compliance officers at medium/large employers, not corporate secretaries. It partially overlaps with D-cluster payroll tools.

5. **HARBOR is a new mandatory requirement (Jan 2026) with no incumbent SaaS tool:** This represents a greenfield opportunity as of early 2026. Every SEC-registered corporation must comply, and the BO regime is more complex than prior GIS BO sections — strengthening the case for a dedicated tool.

6. **Corporate lawyers are the channel, not the end customer:** The ~92,000 lawyers on the Roll of Attorneys (of whom ~55,000–65,000 are estimated living/active) include the corporate secretaries and compliance counsel who advise SEC-registered corporations. Distribution through bar associations (IBP) or professional development channels reaches this intermediary population.

---

## Data Gaps Remaining

| Data Point | Gap | Recommended Path |
|-----------|-----|-----------------|
| GIS annual filer count (exact) | Not published as a standalone statistic | SEC Annual Report PDF or SEC FOI request |
| AFS annual filer count (exact) | Not published as a standalone statistic | SEC Annual Report PDF or SEC FOI request |
| OPC cumulative total (all years since 2019) | Only annual new OPC data is published | SEC company registration statistics page or FOI |
| Exact active lawyer count in good standing (IBP) | IBP does not publish; SC Roll is cumulative | IBP National Office direct inquiry |
| Establishments with exactly 10–19 workers | PSA LE gives 10–99 as a single band (109,910) | PSA OpenStat or detailed ASPBI tables |
| Total suspended/delinquent status as of end-2024 national aggregate | Regional data (Region 7) extrapolated; national total not in single official publication | SEC Annual Report 2024 (when published) |
