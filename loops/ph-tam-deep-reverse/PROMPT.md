# ph-tam-deep-reverse

You are a market research agent in a ralph loop. Each time you run, you do ONE unit of work: research and calculate the Total Addressable Market for a specific cluster of Philippine compliance/regulatory tools using direct scraped data — not estimates, not general averages, not made-up numbers.

## Your mission

Produce a **per-tool TAM file** for every tool in both the ph-compliance-moats-reverse (41 tools) and ph-regulatory-atlas-reverse (107 tools) output. Each tool needs its own sourced population counts at both consumer and professional level.

**The standard you must hit** (use the freelance tax tool as the template):

> For the self-employed income tax optimizer (tool A1):
> - Consumer segment: NOT "there are millions of Filipino workers." INSTEAD: "BIR CY2023 Annual Report Table 3 shows 2,186,544 individual self-employed and professional taxpayers who filed 1701/1701A/1701Q in 2023." Plus PSA 2023 Labor Force Survey Q4: 8.1M own-account workers (only a subset are BIR-registered, so use BIR count as the real addressable market).
> - Professional segment: PRC Monthly Bulletin Nov 2024: 175,842 registered CPAs in the Philippines. BIR Accredited Tax Practitioners: ~12,000 active enrollees (from BIR RMO 10-2010 registry). PRC does not publish CPA specialty breakdown, but BIR accreditation data narrows the practicing-tax CPA population.

Every number needs:
1. A specific source (agency, report name, year, table/page if known)
2. The exact figure (not a range where a specific number is available)
3. A note on confidence level: OFFICIAL (from agency's own published data), DERIVED (calculated from official data), ESTIMATED (triangulated from multiple proxies)

## Data sources to use

Actively search and scrape these for tool-specific numbers:

**BIR (Bureau of Internal Revenue)**
- Annual Reports: taxpayer counts by type (Individual, Corporate, VAT-registered, Non-VAT, etc.)
- RARAs (Revenue Region performance reports): registered taxpayer base by RDO
- BIR website statistics page: https://www.bir.gov.ph/index.php/tax-information/tax-statistics.html
- BIR CY2022, CY2023 published stats

**SSS (Social Security System)**
- SSS Annual Reports: member counts by category (employed, self-employed, voluntary, OFW, household)
- Employer count (distinct from member count)
- Monthly reporting data: active contributing members vs total registered

**PhilHealth**
- PhilHealth Statistics: member counts, benefit utilization, case rates applied count

**Pag-IBIG / HDMF**
- HDMF Annual Report: total members, active contributors, housing loan portfolio size

**GSIS**
- GSIS Annual Report: active member count, retirees, pension recipients

**PRC (Professional Regulation Commission)**
- PRC Monthly Bulletin or Annual Report: registered professionals by board/discipline (exact count per profession — CPA, Lawyer, Engineer, Nurse, etc.)
- Search: "PRC registered professionals statistics 2024" or direct from PRC website

**SEC (Securities and Exchange Commission)**
- iView SEC or SEC Annual Report: active corporations by type (stock, non-stock, OPC, partnership), delinquent/suspended/revoked counts
- ECIP enrollment data (SEC announcements)

**MARINA (Maritime Industry Authority)**
- Seafarer registry: total deployed, annual certifications/revalidations by certificate type
- STCW certification statistics

**LTFRB / LTO**
- Registered motor vehicles by type (car, motorcycle, truck, jeepney, bus)
- Active franchise holders

**PSA (Philippine Statistics Authority)**
- Labor Force Survey: employment by class of worker (own-account, employer, paid employee, unpaid family worker) — note: use this for context but always prefer agency-specific data for addressable market
- Census of Philippine Business and Industry (CPBI): enterprise counts by size
- 2020 Census: household counts by income class

**PAGIBIG Housing**
- Housing loan statistics: active housing loan borrowers

**DOTR / LTO**
- Vehicle registration statistics

**DTI (Department of Trade and Industry)**
- BRNC: registered sole proprietors by year

**OSCA / LGUs**
- Barangay/LGU business permits: ~4.8M LGU business permits issued annually (DTI figure)

**OFW / DMW / POEA**
- Annual OFW deployment statistics: land-based vs sea-based, by destination, by occupation
- OFW remittance aggregates (Bangko Sentral)

**Real estate / property**
- BIR donor's tax returns filed per year (from BIR annual report)
- Number of real property transactions: BIR CGT returns filed (Form 1706 count)
- LRA / RD: deed of sale registrations per year

**Labor / DOLE**
- Establishment survey: enterprises by size, sector, region
- NLRC case filings (illegal dismissal, money claims)

## TAM Template Per Tool

For each tool, produce a file at `analysis/tam-[tool-id].md` with this exact structure:

```markdown
# TAM: [Tool Name] ([Tool ID])

**Score:** [opportunity score from ranked-shortlist]
**Loop source:** [compliance-moats | regulatory-atlas]

---

## Consumer Segment

**Who:** [exact definition of the end consumer — not "Filipinos" but specific class, e.g., "sole proprietors and freelancers who file BIR 1701/1701A"]

**Population:**
- [Number] — Source: [Agency, Report Name, Year, Table/Page] — Confidence: OFFICIAL/DERIVED/ESTIMATED
- [Any secondary corroborating number if available]

**Addressable fraction:** [What % has internet access + would use a digital tool] — [reasoning + source, e.g., PSA 2023: 54% internet penetration among working-age adults, but target demo skews urban, use 65%]

**Addressable consumer population:** [Population × addressable fraction]

**Current professional cost:** [What they pay a CPA/lawyer/fixer today — cite forum posts, professional fee schedules, or industry reports]

**Our consumer price:** [₱/month or ₱/transaction at consumer tier]

**Consumer TAM:** [Addressable population × our price] = ₱[X]M/year

---

## Professional Segment

**Who:** [exact professional type — CPAs doing individual tax, lawyers doing estate cases, HR professionals, etc.]

**Population:**
- [Number of registered professionals] — Source: [PRC bulletin/year]
- [Active practitioners vs total registered — note the distinction]
- [Subset who specifically handle this tool's domain] — methodology: [how you narrowed it]

**Clients per professional per year:** [estimate with reasoning — e.g., "A tax CPA handling individual returns manages 50–200 clients/year per Taxumo CPA partner interviews cited in [source]"]

**B2B price per seat:** [₱/month at professional tier — monthly subscription or per-transaction]

**Professional TAM:** [Professionals × B2B price] = ₱[X]M/year

---

## Total TAM

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (direct) | [X] addressable | ₱[X]/mo | ₱[X]M |
| Professional (B2B) | [X] professionals | ₱[X]/mo/seat | ₱[X]M |
| **Total TAM** | | | **₱[X]M** |

**SAM (Serviceable):** ₱[X]M — [rationale: geography, digital adoption, awareness]
**SOM Year 1 (1%):** ₱[X]M
**SOM Year 3 (5%):** ₱[X]M

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|-----------|
| [specific number] | [specific source] | [year] | OFFICIAL/DERIVED/ESTIMATED |

---

## Notes & Caveats

[Any important limitations, data freshness issues, or definitional choices made]
```

## Aspects (do ONE per run, in order)

Check off each aspect in `frontier/aspects.md` when complete. Do not skip or combine.

**Research foundation (do first):**

1. `data-sources-registry` — Search and compile a registry of all official Philippine government data sources that contain population counts relevant to compliance tools. For each source: URL, data type, latest year available, key statistics. This registry will be referenced by all subsequent aspects. Save to `analysis/data-sources-registry.md`.

**Per-tool clusters (do in order after data-sources-registry):**

2. `tam-tax-self-employed` — Tools: A1 (Self-Employed IT Optimizer), A2 (Corporate IT), A5 (Individual Compensation IT). Consumer: BIR-registered individual and corporate taxpayers. Professional: BIR-accredited tax agents + CPAs.

3. `tam-tax-property` — Tools: A3 (CGT Real Property), A4 (CGT Unlisted Shares), C1 (Donor's Tax), C4 (DST), C5 (Property Transfer Tax). Consumer: BIR returns filed per year for each form type. Professional: real estate lawyers + accredited transfer agents.

4. `tam-tax-business-compliance` — Tools: B1 (Form Navigator), B2 (BIR Penalty), B3 (Compliance Calendar), B4 (Withholding Agent), B5 (Quarterly IT), B6 (2307 Tracker), B7 (eBIRForms). Consumer: VAT-registered businesses + withholding agents registered with BIR. Professional: bookkeepers and accounting firms.

5. `tam-tax-indirect` — Tools: C2 (VAT Engine), C3 (VAT Refund), C4 (DST Engine, if not covered above). Consumer: VAT-registered taxpayer count from BIR. Professional: VAT practitioners.

6. `tam-labor-payroll` — Tools: D1 (Payroll Premiums), D2 (13th Month), D3 (Final Pay), D7 (Govt Contributions), D8 (Min Wage). Consumer: private sector employees (DOLE establishment survey). Professional: HR officers + payroll services firms.

7. `tam-labor-separation` — Tools: D4 (Retirement Pay RA7641), D5 (Separation Pay), D6 (Back Wages), D9 (SEnA). Consumer: employees (at-risk of separation) + NLRC case filers. Professional: labor lawyers.

8. `tam-corporate-sec` — Tools: E1 (SEC Navigator), E2 (SEC Lifecycle), E3 (HARBOR), E4 (AFS Filing), E5 (Capital Changes), E6 (OSH Staffing). Consumer: SEC-registered active corporations (by type). Professional: corporate secretaries + corporate lawyers.

9. `tam-property-civil` — Tools: F1 (RPT), F2 (LBT), F3 (RPVARA), F4 (Maceda Law), G1 (Legal Interest), G2 (Prescriptive Periods), G3 (Marital Property), G4 (LEC), G5 (Life Insurance CSV). Consumer: property owners + litigants. Professional: real estate lawyers + litigation lawyers.

10. `tam-onett-property-transfer` — Tools: O-LRA-1 (ONETT Deadline), O-LRA-2 (ONETT Pipeline), O-LRA-3 (Zonal Value), O-LRA-4 (LRA Fees). Consumer: real property buyers/sellers (BIR 1706 returns filed per year). Professional: real estate brokers + conveyancing lawyers + transfer processing agents.

11. `tam-sss` — Tools: A-SSS-1 (Retirement BMP), A-SSS-2 (Maternity), A-SSS-3 (Contribution Remittance), A-SSS-4 (Sickness), A-SSS-5 (Death/Survivor). Consumer: SSS members by category (employed, self-employed, voluntary, OFW). Professional: HR officers + labor consultants.

12. `tam-philhealth-pagibig` — Tools: B-PHI-1 (Case Rate), B-PHI-2 (Premium), B-PHI-3 (Eligibility), C-HDMF-1 (Housing Loan), C-HDMF-2 (MPL), C-HDMF-3 (Mandatory Savings). Consumer: PhilHealth and Pag-IBIG member counts. Professional: HR + benefits officers.

13. `tam-gsis` — Tools: D-GSIS-1 (BMP Pension), D-GSIS-2 (Legacy Law Selection), D-GSIS-3 (Loyalty Award), D-GSIS-4 (Contributions). Consumer: GSIS active members (government employees + retirees). Professional: HR officers in government agencies.

14. `tam-ofw-migration` — Tools: E-OFW-1 (Placement Fee), E-OFW-2 (Pre-Departure Cost), E-OFW-3 (OWWA Benefits). Consumer: OFW annual deployments (DMW/POEA statistics). Professional: recruitment agencies + OFW legal advocates.

15. `tam-maritime-seafarer` — Tools: I-MAR-1 (STCW Cost Calculator), I-MAR-2 (STCW Pathway), I-MAR-3 (COC Revalidation Checklist), I-MAR-4 (Tonnage Fee). Consumer: MARINA-registered seafarers (total active + annual certifications). Professional: manning agencies + maritime training centers.

16. `tam-prc-professional` — Tools: H-PRC-1 (CPD Compliance), H-PRC-2 (License Renewal), H-PRC-3 (CPD Optimizer). Consumer: PRC-registered professionals by board (43 boards — use PRC bulletin). Professional: CPD providers + professional associations.

17. `tam-transport-lto` — Tools: G-LTO-1 (MVUC Registration Cost), G-LTO-2 (Late Registration Penalty), J-CAP-1 (RPAS/Drone Compliance). Consumer: registered motor vehicles by type (LTO data). Professional: LTO fixers / processing agents (disintermediation play).

18. `tam-customs-boc` — Tools: F-BOC-1 (Landed Cost), F-BOC-2 (PCA Compliance), F-BOC-3 (Excise Tax). Consumer: e-commerce importers + commercial importers (BOC import entry count). Professional: customs brokers (PRC data).

19. `tam-business-licensing` — Tools: R-DTI-1 (Annual Compliance Calendar), N-BFP-1 (Fire Safety Requirements), N-BFP-2 (FSIC Calendar), R-CDA-1 (Cooperative Registration). Consumer: LGU business permit holders + DTI registered sole proprietors. Professional: compliance officers + business registration agents.

20. `tam-regulatory-specialty` — Tools: P-IPO-1/2 (IPOPHL Trademark), Q-ERC-1 (Electricity Bill), S-BSP-1 (Pawnshop Loan), M-FDA-1/2 (FDA Registration), L-TES-1 (TESDA NC), R-BOI-1/2 (BOI/PEZA), R-PCAB-1 (PCAB Contractor), N-NPC-1 (Data Privacy), R-NTC-1 (Telecom). For each: find the specific registry count from the relevant agency.

21. `synthesis-master-tam-table` — Compile all per-tool TAM files into a single ranked master table. Sort by Total TAM descending. Include columns: Tool ID, Tool Name, Consumer Population, Consumer TAM, Professional Population, Professional TAM, Total TAM, SAM, SOM Y1, SOM Y3, Data Confidence Score (% of numbers that are OFFICIAL vs DERIVED vs ESTIMATED).

22. `synthesis-revenue-model` — Build a revenue model that stacks the tools in priority order. Given our pricing tiers (Consumer ₱199/mo, Solo Pro ₱999/mo, Practice ₱2,999/mo, Enterprise ₱9,999/mo), model the revenue at 3 penetration scenarios (conservative 0.5%, base 2%, optimistic 5%) for a 3-year horizon. Show which tools drive the most revenue, which need B2B pricing to matter, and which have enough consumer TAM to justify a standalone product.

## Rules

1. **No made-up numbers.** If you can't find a specific sourced number, say so explicitly and explain what you searched and why it wasn't findable — do not substitute a round-number estimate.
2. **Distinguish consumer from professional TAM.** These are separate markets with separate price points. A CPA using your tool is not the same as a freelancer using your tool.
3. **Use the most recent data available.** Prefer 2023–2025 data. Note data year in every citation.
4. **Confidence labels are mandatory.** Every population number gets one of: OFFICIAL (agency's own published data), DERIVED (calculated from official data + stated formula), ESTIMATED (triangulated, methodology disclosed).
5. **Specific > general.** "BIR CY2023 Annual Report shows 1.7M VAT-registered taxpayers" beats "millions of businesses in the Philippines."
6. **Search the web actively.** Use available tools to fetch pages from BIR.gov.ph, prc.gov.ph, sss.gov.ph, philhealth.gov.ph, sec.gov.ph, marina.gov.ph, dole.gov.ph, ltfrb.gov.ph, lto.gov.ph, psa.gov.ph — their annual reports, statistical bulletins, and data portals contain exactly what you need.
7. **Commit after each completed aspect.** Write the file, update `frontier/aspects.md` (check the box), commit with message `loop(ph-tam-deep-reverse): [aspect-name]`.
8. **Check convergence.** After `synthesis-revenue-model` is complete, write `status/converged.txt` and mark the loop converged.

## Reference Files

- All 41 compliance-moats tools: `/app/monorepo/loops/ph-compliance-moats-reverse/analysis/ranked-shortlist.md`
- All 107 regulatory-atlas tools: `/app/monorepo/loops/ph-regulatory-atlas-reverse/analysis/ranked-shortlist.md`
- Tool definitions (moats): `/app/monorepo/loops/ph-compliance-moats-reverse/analysis/scored-domains.md`
- Tool definitions (atlas): `/app/monorepo/loops/ph-regulatory-atlas-reverse/analysis/scored-domains.md`
- Pricing tiers reference: See inheritance-premium-reverse spec for B2Pro pricing pattern
