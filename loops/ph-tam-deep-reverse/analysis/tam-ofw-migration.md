# TAM: OFW Migration Tools (E-OFW-1 through E-OFW-3)

**Loop source:** regulatory-atlas

---

## Tools Covered

| Tool ID | Name | Score |
|---------|------|-------|
| E-OFW-1 | Placement Fee Calculator | — |
| E-OFW-2 | Pre-Departure Cost Estimator | — |
| E-OFW-3 | OWWA Benefits Navigator | — |

---

## Shared Population Base

All three tools share the OFW deployment universe as their addressable consumer market. The Philippines is one of the world's largest labor-exporting nations. Two distinct population counts are relevant and must not be conflated:

1. **Annual new deployments (flow):** Workers actually processed and sent abroad each year — the DMW/POEA "deployed OFW" count. This is the transactional trigger for all three tools (placement fee is paid once per contract, pre-departure costs are incurred before each departure, OWWA membership is renewed per 2-year contract).

2. **Currently abroad at any time (stock):** Workers residing overseas at a given moment — the PSA Survey on Overseas Filipinos count. This is the pool for ongoing OWWA benefit claims and OWWA membership renewals.

---

### Annual OFW Deployments (Flow)

| Year | Total Deployed | Land-Based | Sea-Based (Seafarers) | Source | Confidence |
|------|---------------|------------|----------------------|--------|------------|
| 2019 | 2,156,742 | — | — | DMW via Philstar, Apr 2024 | OFFICIAL |
| 2020 | 549,841 | — | — | DMW via Philstar, Apr 2024 | OFFICIAL |
| 2022 | ~1,200,000 (approx.) | ~411,820 (Jan–Oct partial) | ~554,000 (Jan–Oct partial) | DMW Secretary Ople via Philstar, Jan 2023; Tribune, Dec 2023 | OFFICIAL (partial year extrapolation) |
| 2023 | 2,330,720 | 1,752,094 | 578,626 | DMW Final Report via Philstar/CF Sharp Crew, Apr 2024 | OFFICIAL |
| 2023 (alt. revised) | 2,613,903 | 1,992,419 | 621,484 | Malaya Business Insight citing DMW (revised/final figures) | OFFICIAL |
| 2024 (Jan–Sep) | 2,662,720 | 2,162,135 | 500,585 | Global Filipino Magazine citing DMW, 2024 | OFFICIAL (partial year) |
| 2024 (contracts processed) | ~2,700,000 | — | — | DMW Sec. Cacdac via BusinessMirror, Feb 2025 | OFFICIAL |

**Note on 2023 figure discrepancy:** Two official DMW figures exist for 2023: 2,330,720 (preliminary/mid-year release cited in April 2024) and 2,613,903 (final revised figures cited in Malaya Business Insight). The split for the revised figure is 1,992,419 land-based + 621,484 sea-based. This document uses **2,613,903 as the 2023 final figure** and **1,992,419 land-based + 621,484 sea-based** as the breakdown, as these are the most recently reported final numbers.

**Note on 2022:** The 2022 total is confirmed at approximately 1.2 million by DMW. The land-based and sea-based figures cited (411,820 land-based, 554,000 sea-based) reflect partial-year data from the Tribune report citing DMW. These partial figures do not sum to 1.2 million, suggesting sea-based deployments rebounded strongly in the second half. No official full-year 2022 land/sea breakdown was publicly indexed.

### Sub-Breakdown: 2023 New Hires vs Rehires

| Category | Count | Source | Confidence |
|----------|-------|--------|------------|
| Newly hired OFWs (2023) | 508,089 | DMW Final Report via Philstar Apr 2024 | OFFICIAL |
| Rehired/returning OFWs (2023) | 1,244,005 | DMW Final Report via Philstar Apr 2024 | OFFICIAL |

**Relevance to TAM:** New hires have the highest placement fee and pre-departure cost burden (they pay placement fees, undergo full PDOS, get new OECs). Rehires still incur OWWA renewal, medical exam, and OEC fees but not necessarily placement fees if rehired by the same employer.

---

### OFWs Currently Abroad (Stock)

| Year | Total OFWs Abroad | Source | Confidence |
|------|------------------|--------|------------|
| 2022 (Apr–Sep reference period) | 1,960,000 (approx. 1.96M) | PSA Survey on Overseas Filipinos (SOF) 2022 via Philstar, Sep 2024 | OFFICIAL |
| 2023 (Apr–Sep reference period) | 2,160,000 (2.16M) | PSA SOF 2023 Final Results, released Sep 13, 2024; Manila Times, Philstar | OFFICIAL |
| 2024 (reference period) | 2,190,000 (2.19M) | PSA SOF 2024 via Philstar, Dec 2025 | OFFICIAL |

**PSA SOF note:** The PSA Survey on Overseas Filipinos is a household survey (April–September reference period) that counts OFWs from households in the Philippines, not total worldwide stock. This reflects Overseas Contract Workers (98.1% of total in 2023) plus small fraction of irregular/undocumented workers captured through households.

**CFO Stock Estimate note:** The Commission on Filipinos Overseas discontinued Stock Estimates after 2013. The last published CFO figure (2013: ~10.5M total overseas Filipinos including permanent residents and irregular migrants) is not used here as it is outdated and covers a much broader population than active contract workers.

---

### Internet Penetration — OFW Demographic

OFWs are a high-digital-adoption demographic for government service tools:
- **PSA 2023 SOF:** 77.4% of OFWs work in Asia; top destinations are Saudi Arabia (20%), UAE (13.6%), Singapore, Hong Kong, Qatar — all high-internet-access countries
- **PSA 2023 Household ICT Survey:** 54% national internet penetration (Philippines households)
- **OFW digital adjustment:** OFWs skew 30–44 age range; are employed abroad (income above median); many use smartphones to transact with OWWA/DMW overseas. Conservative estimate: **75% internet penetration** for OFW consumer segment
- Source: PSA 2023 Household Survey on ICT (national baseline); OFW demographic upward adjustment ESTIMATED

---

## E-OFW-1: Placement Fee Calculator

*(Tool: Calculator that computes the legal maximum placement fee for a given job offer — 1 month's basic salary per POEA/DMW rules — and flags if the agency quote exceeds the legal cap; distinguishes jobs/destinations subject to zero-fee policy vs fee-allowed categories)*

### Consumer Segment

**Who:** OFWs in the recruitment pipeline — prospective OFWs who have received a job offer from a licensed recruitment agency and need to verify whether the placement fee being charged is legal (max 1 month basic salary per DMW rules), or whether their job category qualifies for zero-fee deployment (domestic workers/HSWs, seafarers, and caregivers are exempt per POEA Governing Board Resolution No. 6, Series of 2006, and relevant POEA issuances). Also useful for returning OFWs negotiating rehire terms.

**Population:**
- **508,089** newly hired OFWs deployed in 2023 — Source: DMW Final Report via Philstar, Apr 2024 — Confidence: OFFICIAL
  - These are the workers entering the recruitment pipeline for the first time (or with a new employer). Each one either pays a placement fee or qualifies for zero-fee — the calculator is most relevant at this decision point.
- **1,244,005** rehired OFWs in 2023 — Source: DMW Final Report via Philstar, Apr 2024 — Confidence: OFFICIAL
  - Rehires re-contracted by the same employer pay no placement fee. Rehires with a new employer may still be charged. Partial relevance.
- **~150,000–250,000 DERIVED** rehires with a new employer (change-of-employer rehires, estimated at 12–20% of 1,244,005 rehires) — Confidence: ESTIMATED (no official breakdown of same-employer vs new-employer rehires published)

**Most relevant addressable pool:** New hires + change-employer rehires = **508,089 + ~200,000 = ~708,000/year**

**Addressable fraction:**
- 708,000 × 75% internet penetration = **531,000 addressable**

**Addressable consumer population:** ~531,000 events/year

**Current professional cost / alternative:** Workers currently rely on DMW advisories, POLO assistance, or informal Facebook group guidance (PinoyOFW, various recruitment forums) to verify fee legality. No dedicated professional fee; OFW legal advocates and NGOs provide free assistance. Cost is information asymmetry and illegal recruitment risk — overcharging is estimated at ₱5,000–₱50,000+ per case (placement fee excess above legal cap), with criminal liability for recruiters. Workers who do not know the legal limit are vulnerable.

**Our consumer price:** ₱99 one-time (at recruitment decision point; fee verification is a single transaction, not a recurring need)

**Consumer TAM:** 531,000 × ₱99 = **₱52.6M/year**
Alternative (₱199/mo, 1-month engagement): 531,000 × ₱199 × 1 = **₱105.7M/year**
**Working TAM: ₱53M/year** (transaction model; placement fee check is a one-time use case)

---

### Professional Segment

**Who:** Licensed DMW recruitment agencies verifying compliance before quoting fees to job applicants; POLO (Philippine Overseas Labor Office) officers counseling OFWs; OFW legal advocates and NGOs screening illegal recruitment cases; HR officers in companies that direct-hire (no agency intermediary — zero fee by definition, but computation still needed for contract compliance purposes).

**Population:**
- **Licensed recruitment agencies:** The POEA/DMW database covers "over 3,700 licensed firms" authorized to recruit for overseas employment — Source: POEA historical database description (pre-DMW transition); Respicio & Co. citing POEA data — Confidence: ESTIMATED (total active count not published; 3,700 includes suspended/cancelled agencies in database)
- **Active licensed agencies (land-based + manning, current):** Manning agencies concentrated in Metro Manila (88 in Makati, 85 in Ermita, 80 in Malate, 28 in Pasay, 12 in Pasig, 5 in QC alone = ~350+ confirmed metro Manila agencies) — Source: Captain's Mode Maritime/POEA database — Confidence: OFFICIAL (sub-count)
- **Estimated total active licensed agencies (land-based + manning):** ~1,500–2,000 ESTIMATED — reasoning: 3,700 is the total registry including suspended/cancelled; industry sources suggest ~40–55% remain active; no official published active-only count found — Confidence: ESTIMATED
- **POLO officers abroad:** 31 overseas posts in 27 countries — Source: OWWA/MICIC Initiative — Confidence: OFFICIAL (post count, not officer headcount)

**Working professional estimate:** **1,500 active licensed recruitment agencies** as core B2B target

**B2B price per seat:** ₱999/month (Solo Pro tier — compliance tool for one agency)

**Professional TAM:** 1,500 × ₱999 × 12 = **₱18.0M/year**

---

### Total TAM — E-OFW-1

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (new hires + change-employer rehires) | ~531,000 events/year | ₱99/event | ₱53M |
| Professional (licensed recruitment agencies) | 1,500 ESTIMATED | ₱999/mo/seat | ₱18M |
| **Total TAM** | | | **₱71M** |

**SAM (Serviceable):** ₱21M — OFW pre-departure digital tool adoption is growing but still fragmented; POLO and OWWA overseas desks are primary touchpoint; 30% of TAM serviceable via digital channel in Y1
**SOM Year 1 (1%):** ₱0.7M
**SOM Year 3 (5%):** ₱3.6M

---

## E-OFW-2: Pre-Departure Cost Estimator

*(Tool: Itemized breakdown of all mandatory fees an OFW must pay before departure — PDOS, OWWA membership, OEC processing, medical exam, PhilHealth, Pag-IBIG — including zero-fee items, optional items, and exemptions by job category; calculates total out-of-pocket cost before first paycheck)*

### Consumer Segment

**Who:** All OFWs preparing to depart — both new hires and returning OFWs renewing contracts. Every deployed OFW must complete pre-departure requirements. The tool is most useful at initial planning: workers often discover total pre-departure costs only piecemeal and face cash flow stress before their first overseas paycheck. The estimator helps them budget, sequence payments, and identify where they are exempt.

**Pre-Departure Fee Schedule (official, as of 2023–2024):**

| Fee | Amount | Payable To | Exemptions | Source | Confidence |
|-----|--------|-----------|------------|--------|------------|
| Pre-Departure Orientation Seminar (PDOS) | ₱400 registration | OWWA | Household Service Workers (free via CPDEP) | OWWA official website; Wise.com/ph PDOS guide | OFFICIAL |
| OWWA Membership Contribution | US$25.00 (~₱1,400–₱1,500 at BSP guiding rate) | OWWA | None (mandatory for all documented OFWs) | OWWA official website | OFFICIAL |
| Overseas Employment Certificate (OEC) / DMW processing fee | ₱100 (office) or FREE (online via POPS-BaM system) | DMW | — | DMW official; Moneymax.ph OFW fees guide | OFFICIAL |
| Medical Examination (DOH-accredited clinic) | ₱2,000–₱3,000 | DOH-accredited clinic | — | Moneymax.ph / DMW guidance | OFFICIAL (range) |
| Pre-Employment Orientation Seminar (PEOS) | FREE (online) | DMW | — | PEOS.dmw.gov.ph | OFFICIAL |
| PhilHealth contribution (monthly, mandatory under UHC) | ₱400–₱900/month (salary-dependent) | PhilHealth | — | PhilHealth 2023 contribution table | OFFICIAL |
| Pag-IBIG / HDMF (monthly, mandatory if salary ≥₱5,000) | ₱100–₱200/month | HDMF | Seafarers (voluntary) | HDMF contribution table | OFFICIAL |
| Placement fee (if applicable) | Up to 1 month basic salary | Recruitment agency | Domestic workers, seafarers, caregivers; same-employer rehires | DMW/POEA rules; POEA GB Resolution No. 6, 2006 | OFFICIAL |

**Estimated total pre-departure out-of-pocket (excluding placement fee, excluding PhilHealth/Pag-IBIG ongoing):**
~₱4,000–₱6,000 minimum (PDOS ₱400 + OWWA ₱1,450 + OEC ₱100 + Medical ₱2,500) — Source: DERIVED from above official fee schedule

**Population:**
- **2,613,903** total OFWs deployed in 2023 (final DMW figure) — every deployed OFW goes through pre-departure — Source: DMW Final Report (revised), Malaya Business Insight citing DMW — Confidence: OFFICIAL
- **2,160,000** OFWs abroad at any given time (PSA SOF 2023 Apr–Sep) — relevant for OWWA renewal planning — Source: PSA SOF 2023 Final Results, Sep 13, 2024 — Confidence: OFFICIAL

**Addressable fraction:**
- Full deployment pipeline: 2,613,903 × 75% internet = **1,960,427 addressable**

**Addressable consumer population:** ~1,960,000 events/year

**Current professional cost / alternative:** Workers assemble fee information from multiple DMW, OWWA, and POLO websites, often supplemented by Facebook group posts and informal fixer guidance. No single official tool exists. OFW fixers (informal processing agents) charge ₱500–₱2,000 for pre-departure documentation assistance — Source: ESTIMATED from community forum reports; no official fee schedule.

**Our consumer price:** ₱99 one-time (at pre-departure planning; event-driven use case)

**Consumer TAM:** 1,960,000 × ₱99 = **₱194.0M/year**
Alternative (₱199/mo for 1-month): 1,960,000 × ₱199 = **₱390.0M/year**
**Working TAM: ₱194M/year** (transaction/one-time model)

---

### Professional Segment

**Who:** Licensed recruitment agencies (processing pre-departure requirements for deployed workers); POLO officers advising OFWs on required documentation; OWWA regional welfare officers; OFW advocacy NGOs that provide pre-departure counseling.

**Population:**
- **1,500 active licensed recruitment agencies** (ESTIMATED — same as E-OFW-1 base) — each processes multiple pre-departure packages per week
- **31 POLO overseas posts** (post count; officer headcount not publicly published) — Source: OWWA/MICIC — Confidence: OFFICIAL (post count)
- OFW advocacy organizations: No official count of DMW-recognized NGO partners published

**Working professional estimate:** **1,500 licensed agencies** as core B2B target (same base as E-OFW-1; avoid double-counting in bundle)

**B2B price per seat:** ₱999/month (Solo Pro tier)

**Professional TAM:** 1,500 × ₱999 × 12 = **₱18.0M/year**
*(Note: if bundled with E-OFW-1, professional TAM is shared — do not double-count in cluster total)*

---

### Total TAM — E-OFW-2

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (all annual deployments) | ~1,960,000 events/year | ₱99/event | ₱194M |
| Professional (licensed agencies) | 1,500 ESTIMATED | ₱999/mo/seat | ₱18M |
| **Total TAM** | | | **₱212M** |

**SAM (Serviceable):** ₱63M — 30% of TAM; digital pre-departure tools are nascent; primary competition is free government websites and informal Facebook groups; strongest opportunity is in agency-assisted deployment channel
**SOM Year 1 (1%):** ₱2.1M
**SOM Year 3 (5%):** ₱10.6M

---

## E-OFW-3: OWWA Benefits Navigator

*(Tool: Guides active OWWA members through available benefits — death/disability (₱100K–₱200K), medical assistance (MEDplus up to ₱50K), education/livelihood assistance, repatriation, Balik-Pinas reintegration (₱20K) — including eligibility requirements, claim filing steps, and contact information per benefit type)*

### Consumer Segment

**Who:** Active OWWA members and their beneficiaries seeking to understand and claim their entitled benefits. OWWA membership is mandatory (US$25 per 2-year contract) for all documented OFWs, making the entire active OFW population the addressable base. The tool is triggered by specific life events: injury/illness abroad, death of OFW, forced repatriation, job loss, or return and reintegration planning.

**Population — OWWA Members:**
- OWWA membership is legally required for all deployed OFWs. Membership is per-contract, valid 2 years.
- **2,613,903** OFWs deployed in 2023 = approximately 2.6 million new/renewed OWWA memberships in 2023 — Source: DMW Final Report (revised) — Confidence: OFFICIAL
- **2,160,000** active OFWs abroad at any given time (PSA SOF 2023) = approximate active OWWA member pool — Source: PSA SOF 2023 — Confidence: OFFICIAL
- Note: OWWA does not publicly publish its total active membership count. The PSA SOF figure (2.16M) represents the best available proxy for the active member pool. No OWWA-specific membership census was found in publicly indexed sources (confirmed: OWWA transparency reports are PDF-blocked; FOI requests required for exact figures).

**Benefit-specific event counts (annual, ESTIMATED):**

| Benefit Type | Est. Annual Claimants | Basis | Confidence |
|-------------|----------------------|-------|------------|
| Death benefit (natural + accidental) | ~5,000–8,000/year | ESTIMATED: proportional to deployed OFW population × mortality rate; OFW mortality data not published by OWWA | ESTIMATED |
| Medical assistance (MEDplus) | ~20,000–40,000/year | ESTIMATED: illness/hospitalization rate among 2.16M OFWs abroad | ESTIMATED |
| Repatriation (emergency) | ~10,000–20,000/year | ESTIMATED: OWWA repatriates distressed OFWs; ~8,000–10,000+ repatriations in years with active repatriation programs | ESTIMATED |
| Balik-Pinas reintegration grant | ~20,000–50,000/year | ESTIMATED: OFWs returning under distressed conditions; no published annual claim count | ESTIMATED |
| OWWA Rebate Program (one-time 2022–2023) | 556,000 qualified members | Source: OWWA Administrator Cacdac statement; ₱1B allocated for first batch | OFFICIAL |

**Addressable fraction for ongoing benefits tool:**
- Active OFWs aware of their OWWA benefits and motivated to claim: ESTIMATED **30%** of active members (2,160,000 × 30% = 648,000). Low awareness of specific benefit eligibility is the primary barrier — Source: ESTIMATED from OFW advocacy organization reports (no official survey found).
- 648,000 × 75% internet = **486,000 digitally accessible benefit-seekers**

**Addressable consumer population:** ~486,000 (benefit-aware, internet-accessible OWWA members)
Note: Full deployment pipeline (2,613,903) is addressable for OWWA membership orientation at pre-departure, not just benefit claims.

**Current professional cost / alternative:** OWWA benefits are free to claim but require navigating multiple OWWA regional offices, overseas posts, and online systems. OFW advocates and NGOs provide free claim assistance. Some lawyers assist with contested claims at ₱10,000–₱30,000/case — ESTIMATED. The real cost is missed benefits: OWWA estimates significant underclaiming because OFWs and families are unaware of entitlements.

**Our consumer price:** ₱199/month (ongoing membership; the tool has recurring value for 2-year contract duration)

**Consumer TAM:**
- Benefit-event driven (transaction): 486,000 × ₱99 = ₱48.1M/year
- Subscription model: 486,000 × ₱199 × 12 = ₱1,161.7M/year (theoretical max if all maintained year-round)
- Realistic (3-month average engagement per benefit-trigger event): 486,000 × ₱199 × 3 = **₱290.3M/year**
- **Working TAM: ₱290M/year** (realistic engagement; 3-month average per benefit-claim episode)

---

### Professional Segment

**Who:** OWWA regional welfare officers and POLO counselors (31 overseas posts) who assist OFWs with benefit claims; OFW advocacy NGOs and legal aid organizations; HR officers at recruitment agencies who brief pre-departure workers on OWWA entitlements; OFW-serving financial institutions that bundle OWWA guidance with remittance and insurance products.

**Population:**
- **1,500 active licensed recruitment agencies** (mandatory pre-departure OWWA orientation for their deployed workers) — ESTIMATED — same professional base as E-OFW-1 and E-OFW-2
- OWWA has **17 regional offices** and **31 overseas posts** — Source: OWWA/MICIC Initiative — Confidence: OFFICIAL (post count; officer headcount not published)
- OFW advocacy NGOs recognized by DMW/OWWA: No official published count; ESTIMATED at ~50–150 active organizations — Confidence: ESTIMATED

**Working professional estimate:** **1,500 licensed agencies** (primary B2B target for pre-departure OWWA orientation tool)

**B2B price per seat:** ₱999/month (Solo Pro tier)

**Professional TAM:** 1,500 × ₱999 × 12 = **₱18.0M/year**
*(Bundled with E-OFW-1 and E-OFW-2 in practice — one agency seat covers all three OFW tools)*

---

### Total TAM — E-OFW-3

| Segment | Population | Price | Annual TAM |
|---------|-----------|-------|-----------|
| Consumer (benefit-aware OWWA members) | 486,000 addressable | ₱199/mo (3-mo avg) | ₱290M |
| Professional (licensed agencies) | 1,500 ESTIMATED | ₱999/mo/seat | ₱18M |
| **Total TAM** | | | **₱308M** |

**SAM (Serviceable):** ₱92M — 30% of TAM; OWWA benefit awareness is a major barrier; distribution via POLO, OWWA overseas posts, and OFW Facebook communities can drive adoption
**SOM Year 1 (1%):** ₱3.1M
**SOM Year 3 (5%):** ₱15.4M

---

## Master Summary — OFW Migration Cluster

| Tool ID | Name | Consumer Population | Consumer TAM (realistic) | Professional Population | Professional TAM | Total TAM | SAM | SOM Y1 | SOM Y3 |
|---------|------|---------------------|--------------------------|------------------------|-----------------|-----------|-----|--------|--------|
| E-OFW-2 | Pre-Departure Cost Estimator | 1,960,000 events/yr | ₱194M | 1,500 agencies ESTIM. | ₱18M | **₱212M** | ₱63M | ₱2.1M | ₱10.6M |
| E-OFW-3 | OWWA Benefits Navigator | 486,000 addressable | ₱290M | 1,500 agencies ESTIM. | ₱18M | **₱308M** | ₱92M | ₱3.1M | ₱15.4M |
| E-OFW-1 | Placement Fee Calculator | 531,000 events/yr | ₱53M | 1,500 agencies ESTIM. | ₱18M | **₱71M** | ₱21M | ₱0.7M | ₱3.6M |
| **OFW CLUSTER TOTAL** | | | **₱537M** | | **₱54M (shared base; non-additive)** | **₱591M** | **₱176M** | **₱5.9M** | **₱29.6M** |

**Notes on cluster totals:**
- The professional TAM for all three tools shares the same 1,500-agency base. In a bundled OFW tools product (one license covers E-OFW-1 + E-OFW-2 + E-OFW-3), the professional TAM is **₱18M** (non-additive), not ₱54M.
- Consumer TAMs are largely non-overlapping by trigger event: E-OFW-1 (recruitment pipeline entry), E-OFW-2 (pre-departure planning), E-OFW-3 (post-deployment benefit claims). A user could use all three at different points in the OFW lifecycle.
- Realistic cluster TAM treating professional side as one bundled product: Consumer ₱537M + Professional (bundled) ₱18M = **₱555M total**; SAM ₱167M; SOM Y1 ₱5.6M; SOM Y3 ₱27.7M.

---

## Key Data Sources Used

| Data Point | Source | Year | Confidence |
|-----------|--------|------|------------|
| OFW deployments 2023 (preliminary): 2,330,720 | DMW Final Report via Philstar (Apr 12, 2024) and CF Sharp Crew Management | 2023 | OFFICIAL |
| OFW deployments 2023 (revised final): 2,613,903 | Malaya Business Insight citing DMW revised data | 2023 | OFFICIAL |
| Land-based 2023 (revised): 1,992,419 | Malaya Business Insight citing DMW | 2023 | OFFICIAL |
| Sea-based 2023 (revised): 621,484 | Malaya Business Insight citing DMW | 2023 | OFFICIAL |
| New hires 2023: 508,089; Rehires: 1,244,005 | DMW Final Report via Philstar, Apr 2024 | 2023 | OFFICIAL |
| OFW deployments 2022: ~1.2 million | DMW Sec. Ople via Philstar, Jan 30, 2023 (citing sub-1M 3rd straight year projection); confirmed at 1.2M by Tribune Dec 2023 citing DMW | 2022 | OFFICIAL |
| OFW deployments 2019: 2,156,742 | DMW via Philstar, Apr 2024 (cited as pre-pandemic benchmark) | 2019 | OFFICIAL |
| OFW deployments 2020: 549,841 | DMW via Philstar, Apr 2024 | 2020 | OFFICIAL |
| OFW deployments Jan–Sep 2024: 2,662,720 | Global Filipino Magazine citing DMW | 2024 | OFFICIAL (partial) |
| 2024 contracts processed: ~2.7M | DMW Sec. Cacdac via BusinessMirror, Feb 17, 2025 | 2024 | OFFICIAL |
| PSA SOF 2023: 2.16M OFWs abroad (Apr–Sep) | PSA SOF 2023 Final Results (released Sep 13, 2024); Manila Times, Sep 16, 2024 | 2023 | OFFICIAL |
| PSA SOF 2022: ~1.96M OFWs abroad | PSA SOF 2022 Final Results; Philstar, Sep 16, 2024 | 2022 | OFFICIAL |
| PSA SOF 2024: 2.19M OFWs abroad | PSA SOF 2024 via Philstar, Dec 19, 2025 | 2024 | OFFICIAL |
| OWWA membership contribution: US$25, 2-year validity | OWWA official website (owwa.gov.ph) | current | OFFICIAL |
| PDOS registration fee: ₱400 | OWWA official website (owwa.gov.ph) | current | OFFICIAL |
| OEC processing fee: FREE online / ₱100 office | DMW official; Moneymax.ph OFW fees guide | current | OFFICIAL |
| Medical exam cost: ₱2,000–₱3,000 | Moneymax.ph / DMW guidance | current | OFFICIAL (range) |
| Placement fee cap: 1 month basic salary | DMW/POEA 2016 Revised Rules Part II Rule V; Respicio & Co. legal commentary | current | OFFICIAL |
| Zero-fee categories: HSWs, seafarers, caregivers | POEA Governing Board Resolution No. 6, Series of 2006; DMW rules | current | OFFICIAL |
| BSP OFW cash remittances 2022: USD 36.14B personal | Bangko Sentral ng Pilipinas via Philstar, Feb 16, 2023 | 2022 | OFFICIAL |
| BSP OFW cash remittances 2023: USD 33.49B (bank channel) | BSP via BusinessMirror Feb 2025; Metrobank Wealth Insights; multiple sources | 2023 | OFFICIAL |
| BSP personal remittances 2023: USD 37.2B | BSP via PNA article (pna.gov.ph/articles/1218913) | 2023 | OFFICIAL |
| BSP OFW cash remittances 2024: USD 34.49B (bank channel, record high) | BSP via BusinessMirror Feb 18, 2025; Filipino Times Feb 19, 2025 | 2024 | OFFICIAL |
| BSP personal remittances 2024: USD 38.34B (record high) | BSP via PNA; Gulf News Feb 2025 | 2024 | OFFICIAL |
| OWWA regional offices: 17; overseas posts: 31 in 27 countries | OWWA/IOM MICIC Initiative profile | current | OFFICIAL |
| OWWA death benefit: ₱100K (natural) / ₱200K (accidental) | OWWA official website — Death and Disability Benefits page | current | OFFICIAL |
| OWWA MEDplus: up to ₱50,000 | OWWA official website — Social Benefits page | current | OFFICIAL |
| OWWA Balik-Pinas reintegration: up to ₱20,000 | OWWA official website — Welfare Assistance Program page | current | OFFICIAL |
| OWWA Rebate Program: 556,000 qualified members, ₱1B first batch | OWWA Administrator Cacdac statement (Pinoy-OFW.com report) | 2022 | OFFICIAL |
| PSA SOF 2023: avg remittance per OFW ₱123,000; total ₱238.63B | PSA SOF 2023 Final Results via Philstar, Sep 16, 2024 | 2023 | OFFICIAL |
| Licensed recruitment agencies ~3,700 total (including suspended/cancelled) | POEA historical database description; Respicio & Co. citing POEA | historical | ESTIMATED |
| Active licensed agencies ~1,500–2,000 | ESTIMATED: ~40–55% of 3,700 registry are active | current | ESTIMATED |
| Manning agencies in Metro Manila: 350+ (Makati 88, Ermita 85, Malate 80, Pasay 28, Pasig 12, QC 5) | Captain's Mode Maritime citing POEA/DMW database | 2024 | OFFICIAL (sub-count) |

---

## Notes & Caveats

1. **2023 deployment figure discrepancy (2.33M vs 2.61M):** Two different DMW figures for 2023 total OFW deployments appear in different reporting cycles. The 2,330,720 figure appears in the April 2024 Philstar article and the CF Sharp Crew Management reprint. The 2,613,903 figure (with revised land/sea breakdown of 1,992,419 + 621,484) appears in Malaya Business Insight citing DMW. This likely reflects preliminary vs. final/revised annual tallies. This document uses **2,613,903** as the final figure throughout but notes the discrepancy.

2. **OWWA total active membership count not publicly available:** OWWA does not appear to publish its total active membership count in publicly accessible web pages, annual reports, or indexed PDFs. The OWWA Transparency Portal (transparency.owwa.gov.ph) PDFs were not machine-readable during this research session. The PSA SOF figure (2.16M OFWs abroad in 2023) is used as the best available proxy for the OWWA active member pool. An FOI request to OWWA would be needed for the exact figure.

3. **Placement fee data limitation:** The placement fee rule (max 1 month basic salary) is well documented from DMW/POEA official rules. However, actual fee amounts charged by agencies and the prevalence of overcharging are not tracked in any publicly indexed statistical report. The zero-fee policy expansion (domestic workers, caregivers, seafarers) is firmly established in regulation, but no official count of what fraction of deployed OFWs fall under zero-fee categories was found. The ~508,089 new hires is used as the upper bound for fee-relevant placements.

4. **BSP remittance figures — bank channel vs. personal remittances:** Two BSP series are tracked. "Cash remittances" (through banks only) = USD 33.49B in 2023, USD 34.49B in 2024. "Personal remittances" (broader — includes cash hand-carried by OFWs and in-kind transfers) = USD 37.2B in 2023, USD 38.34B in 2024. The PSA SOF surveys the household side of the same remittance flow and records ₱238.63B (USD ~4.3B equivalent at PSA's reference exchange rate) — this covers only OFWs counted in the PSA SOF household survey and is not comparable to BSP's full-country total.

5. **Recruitment agency count — data gap:** No official published count of currently active (non-suspended, non-cancelled) DMW-licensed recruitment agencies was found. The "3,700+" figure cited in secondary sources likely includes the entire registry (active + suspended + cancelled + closed). Manning agency sub-counts for specific Metro Manila cities (Makati: 88, Ermita: 85, Malate: 80) total approximately 350+ for Metro Manila alone. The ~1,500–2,000 active agency estimate for the full country is a triangulated ESTIMATED figure.

6. **Consumer TAM model choice:** E-OFW-2 (Pre-Departure Cost Estimator) has the largest consumer TAM because it applies to every deployed OFW (2.6M/year). However, the appropriate pricing model is a one-time transaction fee (₱99) rather than a monthly subscription, because pre-departure planning is a single event. The ₱194M working TAM reflects this transactional model. If packaged as part of a broader OFW lifecycle subscription (₱199/mo covering all three tools), the TAM per user engagement is larger but the addressable paying population is smaller (only those motivated to pay for an ongoing subscription vs. a one-time tool).

7. **E-OFW-3 working TAM caveat:** The ₱290M working TAM for the OWWA Benefits Navigator assumes 3-month average engagement per benefit-trigger event at ₱199/month. This requires strong distribution: most OFWs abroad would need to discover and trust a paid app for government benefit navigation. The free alternatives (OWWA website, POLO counselors, OFW Facebook communities) are strong competition. The realistic near-term TAM for a paid version is likely closer to ₱30–60M (SAM-level), with full TAM requiring significant awareness campaigns.
