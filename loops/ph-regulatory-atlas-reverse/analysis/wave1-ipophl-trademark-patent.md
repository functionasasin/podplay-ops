# Wave 1 Analysis: IPOPHL — Trademark, Patent, Utility Model & Industrial Design

**Aspect:** `ipophl-trademark-patent`
**Governing Law:** Republic Act 8293 (Intellectual Property Code of the Philippines, 1997); IPOPHL MC 16-012 (Revised Fee Structure of 2017); IPOPHL MC 2023-001 (Trademark Regulations of 2023); IPOPHL MC 2024-023 (Upfront Payment of Renewal Fees); IPOPHL MC 2022-016 (Revised IRR for Patents, Utility Models, Industrial Designs)
**Regulatory Agency:** Intellectual Property Office of the Philippines (IPOPHL)
**Date Analyzed:** 2026-02-26

---

## Summary

IPOPHL administers trademark registration, patent grants, utility model registration, and industrial design registration under RA 8293. All fee schedules are statutory or agency-issued and fully deterministic: fee = f(entity type, IP type, number of classes/claims, color claim, priority claim, stage in lifecycle). Across ~42,000 trademark applications and ~6,400 patent/UM applications annually, a large compliance burden exists around (1) multi-stage fee computation, (2) mandatory Declaration of Actual Use (DAU) deadlines, (3) escalating patent annuity fees, and (4) trademark/patent renewal calendar management. No comprehensive self-service tool exists for Filipino IP applicants to compute total costs or track upcoming compliance deadlines.

---

## Market Size

**Trademarks:**
- **41,953 trademark applications** filed in 2023 (up 1.2% YoY; ~84% of all IPOPHL IP filings)
- **H1 2024:** 21,751 filings → full-year 2024 projected to surpass 2023 by 7%+
- **Active registrations:** With 10-year validity and ~40K/year for 10+ years, there are an estimated **200,000–400,000 active registered trademarks** in the Philippines requiring DAU filings and eventual renewal
- Resident filings: 61% (~25,575 in 2023); non-resident: 39% (foreign applicants must use Philippine agent)
- Top sectors: pharmaceuticals/health/cosmetics (19.1%), agriculture (17.4%), ICT/scientific research (13.8%)

**Patents:**
- **4,544 patent applications** in 2023 (up 2.9% YoY)
- Non-resident filers: **84%** of patent applications → all must engage Philippine resident agent/attorney
- Active patent portfolio: ~20,000–45,000 patents in force requiring annual annuity payments from Year 5

**Utility Models:**
- **1,847 UM applications** in 2023 (up 24% YoY — highest growth rate of any IP type)
- Resident filers: **95%** of UM applications → primarily Filipino inventors and SMEs
- 7-year protection term; annual fees from Year 5

**Industrial Designs:**
- Included in ~49,832 total IP filings for 2023
- No substantive examination → 3–6 month registration; growing design IP awareness

**Total annual IP compliance market:** ~50,000–70,000 new IP filings/year + 200,000–400,000 active marks requiring ongoing DAU/annuity/renewal compliance.

---

## Governing Statutory Sections

### RA 8293 — IP Code of the Philippines

**Part III — The Law on Trademarks, Service Marks and Trade Names**
- **Section 121–123:** Definition and registrability of marks
- **Section 134:** Filing date and requirements
- **Section 140–141:** Publication for opposition (30-day window); fee structure
- **Section 145:** Issuance and publication of registration certificate
- **Section 146:** Duration of mark (10 years from registration date)
- **Section 147:** Renewal (every 10 years, within 6 months before expiry or 6 months after with 50% surcharge)
- **Section 148:** Declaration of Actual Use (failure = cancellation of mark)

**Part II — The Law on Patents**
- **Section 54–55:** Filing date requirements
- **Section 54:** Scope of patent grant; 20-year term from filing date
- **Section 57:** Annual fees from Year 5 (upon expiration of 4 years from publication)
- **Section 217 (RA 8293 Sec. 7):** Director General authorized to set fee schedules

**IPOPHL MC 16-012 (Fee Structure of 2017):**
- Section 13: Trademark fee table (filing, publication, issuance, renewal, DAU — by entity type)
- Section 14: Utility Model and Industrial Design fee table
- Section 15: Patent fee table including annual maintenance fees by year (Years 5–20)

**IPOPHL MC 2023-001 (Trademark Regulations of 2023):**
- **Rule 204:** DAU filing schedule — 3rd year DAU, 5th year DAU, renewal DAU (within 1 year of renewal)
- **Rule 1200–1206:** Renewal computation including issuance and publication fees (as amended by MC 2024-023)

---

## Domain 1: Trademark Total Fee Calculator

### What It Does
Computes the exact total government fee for a trademark application given: entity type (small/big/youth), number of classes, color claim (yes/no), convention priority claim (yes/no), and stage (new filing, renewal with/without late surcharge).

### Fee Structure (Fully Deterministic)

**New Application (per class):**

| Fee Component | Small Entity | Big Entity |
|---|---|---|
| Filing fee (per class) | ₱1,200.00 | ₱2,592.00 |
| Color claim (per class, if applicable) | + ₱282.80 | + ₱606.00 |
| Priority claim (per class, if applicable) | ₱860.00 | ₱1,800.00 |
| Publication for Opposition (1st pub, per class) | Included | Included |
| Issuance of Certificate | ₱570.00 | ₱1,200.00 |
| Publication of Registration (2nd pub) | ₱900.00 | ₱960.00 |
| **Minimum total (1 class, no color/priority)** | **~₱3,600** | **~₱5,800** |

**+ 1% Legal Research Fund on all fees (per RA 3870); minimum ₱10.00**

**Youth filer discount:** 50% of applicable fee where schedule provides single rate.

**DAU Filings (per class):**
- 3rd Year DAU: ₱900–₱1,920 (small–big)
- 5th Year DAU: ₱1,100–₱2,400 (small–big)
- Renewal DAU: ₱1,100–₱2,400 (small–big)

**Renewal (per class, every 10 years):**
- Small entity: ₱3,100 + ₱570 issuance + ₱900 publication = ~₱4,570/class
- Big entity: ₱6,600 + ₱1,200 issuance + ₱960 publication = ~₱8,760/class
- **Late renewal surcharge (within 6-month grace period):** 50% of renewal fee added

**Multi-class example (3-class, big entity, no color):**
- Filing: 3 × ₱2,592 = ₱7,776 + ₱1,200 issuance + ₱960 publication = ₱9,936 + 1% LRF = ~₱10,035

### Computation Sketch
```
Total = Σ(filing_fee[entity_type] × num_classes)
       + (color_fee[entity_type] × num_classes, if color_claimed)
       + (priority_fee[entity_type] × num_classes, if priority_claimed)
       + issuance_fee[entity_type]
       + publication_fee[entity_type]
       + (1% × subtotal, min ₱10)

Renewal_total = (renewal_fee[entity_type] × num_classes)
              + issuance_fee[entity_type]
              + publication_fee[entity_type]
              + (50% × renewal_fee × num_classes, if filed during grace period)
              + (1% × subtotal)
```

### Who Currently Does This
- IP attorneys and law firms: handle filing, compute fees, advise on class strategy. Charge ₱10,000–₱20,000+ professional service fees per trademark registration (1 class, no opposition).
- Foreign applicants (~39% of filers): legally required to use a Philippine resident agent/attorney — no DIY option.
- Local SMEs filing directly: must manually parse multi-stage fee schedule from IPOPHL website (PDF tables, fee changes via MC, DAU calendar confusion).
- IP consulting firms (FilePino, Triple-i, Brealant): offer all-inclusive packages at ₱10K–₱30K total.

### Pain Indicators
- Multi-stage fee structure (filing → publication → issuance → DAU at 3yr → DAU at 5yr → renewal at 10yr) creates per-stage sticker shock
- DAU deadlines: missing 3-year or 5-year DAU = automatic trademark cancellation (no cure period)
- 50% late renewal surcharge is punitive but often triggered by oversight
- MC 2024-023 (effective July 2024) changed when fees must be paid for renewals — businesses caught off guard
- No official IPOPHL calculator; official fee pages are static HTML tables requiring manual addition
- Foreign applicants (84% of patent, ~39% of trademark filers) structurally dependent on agents

---

## Domain 2: Patent Annuity Calendar & Cost Projector

### What It Does
Computes year-by-year annual maintenance fees for an invention patent or utility model, projects total 20-year maintenance cost, calculates surcharges for late payment, and generates a deadline calendar from the patent's publication date.

### Fee Structure (Invention Patent Annual Fees — Fully Deterministic)

| Year | Small Entity (PHP) | Big Entity (PHP) |
|------|--------------------|------------------|
| 1st – 4th | No fee due | No fee due |
| **5th** | **1,550** | **3,240** |
| **6th** | **2,000** | **4,320** |
| **7th** | **2,580** | **5,400** |
| **8th** | **3,100** | **6,480** |
| **9th** | **4,140** | **8,640** |
| **10th** | **5,170** | **10,800** |
| **11th** | **6,670** | **13,920** |
| **12th** | **8,280** | **17,280** |
| **13th** | **9,770** | **20,400** |
| **14th** | **11,900** | **24,480** |
| **15th** | **13,970** | **29,160** |
| **16th** | **15,980** | **33,360** |
| **17th** | **18,050** | **37,680** |
| **18th** | **21,670** | **45,240** |
| **19th** | **26,040** | **54,360** |
| **20th** | **26,040** | **65,160** |

**Excess Claim Fee (per claim above 5, Years 5–20):**
- Small: ₱210/claim | Big: ₱420/claim

**Late Payment Surcharge:** 50% of total annual fee (within 6-month grace period); IPOPHL publishes non-payment notice in Official Gazette triggering grace period.

**Total small entity 20-year annuity cost (5 claims):** ₱176,905 (without surcharges)
**Total big entity 20-year annuity cost (5 claims):** ₱369,840

### Computation Sketch
```
Annual_fee[year, entity, claims] =
    base_fee[year][entity_type]
    + max(0, claims - 5) × excess_claim_fee[entity_type]
    + (1% LRF)

Late_fee[year] = annual_fee[year] × 1.50 (within grace period)

Annuity_calendar = {
    for year in 5..20:
        due_date = publication_date + (year - 1) years
        payment_window_opens = due_date - 3 months
        grace_period_ends = due_date + 6 months
}

Total_NPV = Σ annual_fee[y] / (1 + discount_rate)^(y-filing_year)
```

### Who Currently Does This
- Philippine patent agents and IP law firms: maintain client patent portfolios, send annuity reminders, pay on client's behalf. Charge ₱3,000–₱8,000/year per patent in maintenance management fees (in addition to government annuity).
- International patent annuity services (Dennemeyer, Ipendo, NovumIP): handle Philippines renewals for foreign patent holders (84% of filers); charge significant USD premiums.
- In-house IP counsel at large corporations: manage portfolios via docketing software (Anaqua, CPA Global, etc.) — expensive enterprise tools.
- Individual inventors and small Filipino businesses: often unaware of escalating fees; discover cost only when agent sends invoice; sometimes let patents lapse due to budget shock.

### Pain Indicators
- Escalating fee schedule surprises: Year 5 fee (₱1,550) seems manageable; Year 20 fee (₱26,040) is 16× higher — creates budget planning crisis for 20-year patents
- Grace period miss = permanent patent lapse; 6-month window after IPOPHL publishes non-payment notice requires active monitoring
- 84% of patent filers are foreign → all structurally dependent on Philippine agents
- Claim count multiplier: patents with 10+ claims face significant excess claim fees that applicants don't model when filing
- No IPOPHL self-service cost projector exists; official fee table requires user to manually sum years

---

## Domain 3: IP Portfolio Compliance Dashboard

### What It Does
Unified compliance calendar for businesses or individuals holding multiple IP assets (trademarks + patents + utility models + industrial designs). Tracks upcoming deadlines for: DAU filings (3-year and 5-year for each trademark), trademark renewals (10-year cycle), patent annuity payments (annual from Year 5), grace period expirations, and late surcharge applicability.

### Computation Sketch
```
For each IP asset:
  trademark: {
    dau_3yr = registration_date + 3 years (±window)
    dau_5yr = registration_date + 5 years (±window)
    renewal = registration_date + 10 years (−6 months to +6 months)
    renewal_late_surcharge_activates = registration_date + 10 years
    renewal_fee = renewal_fee[entity][classes] × (1 + late_multiplier)
  }
  patent: {
    annuity[year] = publication_date + (year-1) years (for years 5..20)
    grace_period[year] = annuity[year] + 6 months
    fee[year] = base[year][entity] + excess_claims[entity] × max(0, claims-5)
  }

Alert_window = 90 days before each deadline (configurable)
Total_forward_liability = Σ future fees across all assets (NPV optional)
```

### Who Currently Does This
- IP law firms on retainer: charge annual maintenance management fees on top of annuity payments; minimum engagement ~₱5,000–₱15,000/year per client
- Enterprise docketing software (Anaqua, CPA Global): designed for large corporate IP portfolios; costs USD 10,000–50,000+/year
- Google Sheets/manual tracking: common among SMEs and individual inventors; high risk of missed deadlines
- No publicly available Philippine IP portfolio dashboard exists targeting SMEs and individual professionals

### Pain Indicators
- Missing any single deadline can result in irreversible IP rights cancellation
- IPOPHL does not proactively notify trademark owners of upcoming DAU or renewal deadlines
- Businesses with 5–20 trademarks face complex overlapping deadline matrices across entity types and renewal dates
- High-growth Philippine brand market (7% YoY trademark growth) means young IP portfolios needing active management for the first time

---

## Domain 4: Trademark Classification & Filing Cost Estimator

### What It Does
Helps applicants determine which Nice Classification class(es) their goods/services fall under, then computes total government fee based on entity type and class count. Reduces mis-classification risk that leads to refusals requiring costly office action responses.

### Note on Computability
The Nice Classification lookup itself requires some judgment (which class does "mobile app for food delivery" fall under — Class 9 for software or Class 35 for retail/marketing?). However, the fee computation given a class list is fully deterministic. The domain is partially automated: lookup is keyword-based with existing IPOPHL-published tools (NICEPUB database), but fee computation per class count is pure arithmetic.

### Pain Indicators
- Wrong class selection → official office action → attorney response fees (₱5,000–₱15,000+) or abandonment
- Many SMEs file in wrong class or too few classes, exposing their mark to challenges
- Multi-class strategy (file 1 vs. 3 classes?) requires fee tradeoff computation that is deterministic

---

## Opportunity Assessment

| Domain | Market | Moat | Computability | Pain | Score |
|--------|--------|------|--------------|------|-------|
| **Domain 1: Trademark Fee Calculator + DAU Tracker** | 3 | 3 | 5 | 4 | **3.80** |
| **Domain 2: Patent Annuity Calendar & Projector** | 2 | 3 | 5 | 4 | **3.55** |
| **Domain 3: IP Portfolio Compliance Dashboard** | 3 | 4 | 4 | 5 | **4.05** |
| **Domain 4: Classification + Fee Estimator** | 3 | 2 | 3 | 3 | **2.75** |

_Scoring: Market (×0.25) + Moat (×0.25) + Computability (×0.30) + Pain (×0.20)_

**Top opportunity: Domain 3 (IP Portfolio Compliance Dashboard, 4.05)**

Rationale: The combination of fully deterministic deadline calendaring + fee projection across trademark and patent lifecycles addresses a real, recurring, high-stakes pain point for the ~200,000–400,000 active trademark holders and ~20,000–45,000 active patent holders in the Philippines. The existing moat (IP firms charge ₱5,000–₱15,000/year for manual tracking + reminders) is deep but entirely displacing: the computations are date arithmetic + fee table lookups. No IPOPHL-native self-service tool exists. The "IP portfolio manager" segment is dominated by expensive enterprise tools (CPA Global, Anaqua) that price out the SME market entirely.

**Second opportunity: Domain 1 (Trademark Fee Calculator, 3.80)**

Rationale: 42,000+ new trademark filings/year, each requiring multi-stage fee payments across a 10-year lifecycle. The IP attorney moat (₱10,000–₱20,000/registration) is real but partly driven by information asymmetry about the fee structure rather than genuine legal complexity. A fee calculator + DAU deadline generator, seeded with the IPOPHL fee schedule from MC 16-012, would be a pure information tool. The moat is moderate because many SMEs file directly (61% are resident filers) and IPOPHL's eTMFile system already allows direct online filing — but fee confusion and deadline management remain unaddressed.

---

## Sources

- [IPOPHL Trademark-related fees](https://www.ipophil.gov.ph/services/schedule-of-fees/trademark-related-fees/)
- [IPOPHL Patent Maintenance](https://www.ipophil.gov.ph/patent/patent-maintenance/)
- [IPOPHL Patent-related fees](https://www.ipophil.gov.ph/services/schedule-of-fees/patent-related-fees/)
- [IPOPHL 2023 IP Filings Statistics](https://www.ipophil.gov.ph/news/2023-ip-filings-jump-2-5-amid-heightened-awareness-and-innovation-drive-in-itsos/)
- [IPOPHL MC 16-012 Revised Fee Structure 2017 (via WIPO Lex)](https://wipolex-res.wipo.int/edocs/lexdocs/laws/en/ph/ph197en.pdf)
- [PatentRenewal.com — Philippines](https://www.patentrenewal.com/patent-renewal-fees/philippines)
- [BusinessWorld — Trademark filings on track to exceed 2023 totals](https://www.bworldonline.com/economy/2024/07/24/610142/trademark-filings-on-track-to-exceed-2023-totals-this-year/)
- [IPOPHL MC 2024-023 summary (Cruz Marcelo)](https://cruzmarcelo.com/ipophl-mandates-the-upfront-payment-of-issuance-and-publication-fees-in-the-request-for-renewal-of-trademarks/)
