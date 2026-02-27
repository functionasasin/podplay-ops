# Wave 1 Analysis: DTI/BNRS Business Name Registration & LGU Business Permit

**Aspect:** `dti-business-registration`
**Governing Law:** Republic Act No. 3883 (Business Name Law, as amended); Local Government Code of 1991 (RA 7160), Sections 143–152 (Local Business Tax); RA 11976 (Ease of Paying Taxes Act, 2024)
**Regulatory Agency:** Department of Trade and Industry (DTI) / Business Name Registration System (BNRS); Local Government Units (LGUs) — Business Permit and Licensing Offices (BPLOs); Bureau of Internal Revenue (BIR); Bureau of Fire Protection (BFP)
**Date Analyzed:** 2026-02-27

---

## Summary

Sole proprietorship business registration in the Philippines is a multi-agency compliance cascade: DTI business name (one-time or every 5 years), followed by annual LGU business permit renewal (barangay clearance + mayor's permit + fire safety + sanitation), historically accompanied by annual BIR registration (now eliminated by RA 11976). The DTI fee itself is trivially simple — a 4-row table — but the **LGU Local Business Tax (LBT)** computed on prior-year gross receipts is significantly more complex and varies by all 1,634 Philippine cities and municipalities. With 1.056 million annual DTI registrations (2024 record) and ~1.2 million actively permitted businesses renewing annually, this is one of the highest-volume compliance domains. The integrated opportunity is a unified "PH Business Cost Calculator" that handles DTI scope selection, LBT estimation by LGU, and the full ancillary fee stack — a tool no government portal currently provides.

---

## Market Size

- **DTI business name registrations**: 1.056 million in 2024 (new all-time record); 984,332 in 2023 (5% YoY growth)
  - ~88% new registrations (~929K new BNs in 2024)
  - ~12% renewals (~127K renewals in 2024)
- **Active sole proprietorships (estimated)**: 5 million+ based on multi-year cumulative registrations minus closures; DTI figure quoted in some sources
- **Annual LGU business permit renewals**: ~1.2–1.5 million active businesses renewing each January (includes corporations, partnerships, sole proprietors)
- **PSA business establishment count**: 1,241,476 registered establishments (2024); 99.63% are MSMEs
- **Dominant sector**: Wholesale/retail trade (sari-sari stores) = 55.43% of 2024 filings
- **BIR-registered businesses**: ~6 million (includes corporations, partnerships, sole proprietors, VAT and non-VAT)

---

## Governing Statutory Sections

### RA 3883 (Business Name Law) — DTI Registration

- **Section 1**: Every person doing business in the Philippines under a name other than their own must register with the DTI
- **Section 3-A (as amended)**: Territorial scope categories — Barangay, City/Municipality, Regional, National
- **Registration fees** (DTI IRR, current schedule):

  | Territorial Scope | Registration Fee |
  |---|---|
  | Barangay | ₱200.00 |
  | City / Municipality | ₱500.00 |
  | Regional | ₱1,000.00 |
  | National | ₱2,000.00 |
  | + Documentary Stamp Tax (all scopes) | ₱30.00 |

- **Validity**: 5 years from date of registration
- **Renewal timeline**:
  - Early filing: up to 180 days before expiry
  - Regular filing: up to 90 days after expiry
  - Late filing (grace): next 90 days (days 91–180 post-expiry) — **50% surcharge on renewal fee**
  - After 180 days: registration cancelled, BN released into public domain
- **Surcharge computation**: `total_due = registration_fee × 1.50 + ₱30 DST`
- **Late renewal examples**:
  - Barangay scope (late): ₱200 × 1.50 + ₱30 = ₱330
  - National scope (late): ₱2,000 × 1.50 + ₱30 = ₱3,030

### RA 7160 (Local Government Code), Sections 143–152 — Local Business Tax (LBT)

**Section 143** imposes local business tax on businesses within the LGU's jurisdiction. Key provisions:

- **Tax base**: Gross sales or gross receipts of the **preceding calendar year** (first-year businesses use paid-up capital or estimated initial capital)
- **Business classification and maximum national rates**:

  | Business Type | Max Rate (Municipal) | Max Rate (City = municipal × 150%) |
  |---|---|---|
  | Manufacturers, exporters (Sec. 143a) | 0.5% of gross sales | 0.75% |
  | Retailers — gross receipts >₱400K (Sec. 143b) | 2% of gross receipts | 3% |
  | Retailers — gross receipts ≤₱400K (Sec. 143b) | 1% of gross receipts | 1.5% |
  | Contractors, service providers (Sec. 143e) | Graduated schedule | +50% |
  | Banks/financial institutions (Sec. 143f) | 0.5% of gross receipts | 0.75% |
  | Other businesses not enumerated (Sec. 143g) | 2% of gross receipts | 3% |

- **Section 147**: Cities may impose rates up to 50% higher than the municipal rates shown above
- **Section 166**: Penalty for late payment = 25% surcharge + 2% per month interest (up to 72 months)
- **Section 165**: Quarterly installment option (on or before January 20, April 20, July 20, October 20)
- **LGU variation**: Every city and municipality sets its own actual rates within the statutory maximums through a Local Revenue Code. This creates 1,634 distinct fee schedules.

**Ancillary fees** (also computed at BPLO, vary by LGU):
- Barangay clearance: ₱200–₱1,000
- Mayor's permit processing fee: ₱500–₱3,000 (flat, per LGU ordinance)
- Fire Safety Inspection Certificate (FSIC): ₱500–₱5,000+ (graduated by floor area and occupancy — see bfp-fire-safety aspect)
- Sanitary permit: ₱200–₱1,500 per establishment
- Signage fee: ₱100–₱2,000 per sign

### RA 11976 (Ease of Paying Taxes Act, 2024)

- Eliminated the annual BIR registration fee (₱500 BIR Form 0605) effective January 22, 2024
- BIR Certificate of Registration (COR) now valid indefinitely; no annual renewal filing
- DST of ₱30 still applies on DTI registration

---

## Domain Identification

### Domain 1: LGU Local Business Tax (LBT) Estimator

**Description**: A tool that estimates the annual Local Business Tax (LBT) due to a specific LGU based on prior-year gross receipts (or initial capital for new businesses), applies the applicable RA 7160 bracket and the LGU's actual ordinance rate, and computes total business permit renewal cost including ancillary fees.

**Computation sketch**:
```
Inputs: city/municipality, business type classification, prior-year gross receipts (or capital), is new business?
Step 1: Look up LGU ordinance rate (or use statutory max as estimate)
Step 2: Apply RA 7160 Sec. 143 bracket to gross receipts → LBT base
Step 3: Compute LBT = gross_receipts × rate
Step 4: Add barangay clearance + mayor's processing fee + FSIC + sanitation + signage
Step 5: Check if filing after January 20 → apply 25% surcharge + 2%/month interest
Step 6: Show installment schedule (quarterly option)
Output: Annual business permit cost breakdown + installment plan + deadline tracker
```

**Who currently does this**: LGU BPLOs assess in person; accountants/bookkeepers compute; fixers navigate on behalf of small business owners. No national-scope self-service calculator exists — each LGU has its own BPLO with different rates and processes.

**Market size**: ~1.2–1.5 million business establishments requiring annual renewal. Primarily serves micro and small enterprises (99.63% of all registered establishments).

**Professional fee range**: ₱1,000–₱5,000 for accountant/consultant-assisted renewal computation + submission; ₱300–₱1,000 for informal fixers who handle queuing; enterprise compliance firms (InCorp, Triple i, Emerhub) charge custom rates.

**Pain indicators**:
- January 20 deadline creates massive annual queue at BPLOs; many businesses queue for 2–5 hours
- Late penalty = 25% surcharge + 2%/month interest (can reach 72% cap); common for businesses that don't know the deadline
- Business type misclassification leads to under/over-payment; BPLOs may reclassify on assessment, creating disputes
- No national tool exists; businesses must visit or call each BPLO to understand their specific rates
- LGU variation means advice given for one city does not apply to another

**Computability**: Score **3** — Fully deterministic once LGU ordinance rates are known (RA 7160 defines the formula structure and maximums). The challenge is LGU variation: 1,634 municipalities/cities with distinct ordinance rates. A tool that either (a) sources ordinance data from all LGUs or (b) uses statutory maximums as conservative estimates is achievable. The RA 7160 formula structure is consistent; only the rate parameter varies.

**Opportunity score estimate**:
- Market: **5** (>1M annual transactions)
- Moat: **3** (needs accountant/bookkeeper/fixer; BPLO itself is the primary "tool")
- Computability: **3** (rule-heavy; LGU-specific variation)
- Pain: **4** (multi-agency, January deadline crunch, surcharge penalty, LGU opacity)
- **Score = (5×0.25) + (3×0.25) + (3×0.30) + (4×0.20) = 1.25 + 0.75 + 0.90 + 0.80 = 3.70**

---

### Domain 2: DTI Business Name Registration Fee + Renewal Tracker

**Description**: A simple tool covering DTI BN registration cost by territorial scope, renewal deadline tracking (5-year validity), late penalty computation, and territorial scope upgrade cost (treated as new application with new 5-year validity).

**Computation sketch**:
```
Inputs: territorial_scope, registration_date (for renewal), is_late_filing?
Output: registration_fee + DST + late_surcharge (if applicable)
         + renewal_deadline, cancellation_date, name_at_risk_date
         + upgrade cost (from current scope to target scope)
```

**Market size**: 1.056 million annual transactions (2024 record). ~5 million cumulative active BNs.

**Professional fee range**: Minimal — BNRS portal is fully online and mostly self-service. Consultants rarely needed for DTI registration alone. Fixers charge ₱200–₱500 for in-person DTI assistance. The main pain is **not knowing when your BN expires** (5 years passes quickly; cancellation = name loss).

**Computability**: Score **5** — Fully deterministic: 4-row fee table + ₱30 DST + 50% surcharge formula. Trivially simple computation.

**Opportunity score estimate**:
- Market: **5** (>1M transactions)
- Moat: **1** (DIY-able; BNRS portal is online and functional)
- Computability: **5** (fully deterministic)
- Pain: **2** (low pain for initial registration; moderate pain for forgotten expiry and name loss)
- **Score = (5×0.25) + (1×0.25) + (5×0.30) + (2×0.20) = 1.25 + 0.25 + 1.50 + 0.40 = 3.40**

**Note**: Standalone DTI fee calculator has low moat (BNRS portal covers this). The value is in combining DTI renewal tracking with the LGU annual renewal calendar (Domain 4 below).

---

### Domain 3: New Business Startup Cost Navigator (Multi-Agency)

**Description**: A step-by-step cost estimator for new sole proprietors launching a business, aggregating all government fees across the full registration sequence: DTI → Barangay Clearance → Mayor's Permit (LBT + ancillary) → BIR registration → SSS/PhilHealth/Pag-IBIG employer registration.

**Computation sketch**:
```
Inputs: LGU (city/municipality), business type, territorial scope, estimated first-year capital/gross receipts
Step 1: DTI BN fee = scope_fee + ₱30 DST
Step 2: Barangay clearance = lookup LGU range (₱200–₱1,000)
Step 3: Mayor's permit = LBT (on estimated capital for new business) + processing fee + FSIC + sanitation
Step 4: BIR registration = ₱0 (no annual fee since RA 11976) + ₱30 DST for COR
Step 5: Employer registration = ₱0 (SSS/PhilHealth/Pag-IBIG charge no employer registration fee)
Step 6: Total = sum of all fees + recommended budget buffer (₱1,000–₱2,000 for notarization, photos, etc.)
Output: Itemized startup cost estimate + sequence checklist + timeline (estimated 1–3 weeks)
```

**Market size**: ~929K new business registrations in 2024; ~700K of these likely also needed LGU permits (excludes home-based businesses exempt from mayor's permit).

**Professional fee range**: Full-service business registration consultants charge ₱5,000–₱20,000 for sole proprietor startup packages. InCorp Philippines, FilePino, and similar firms offer bundled registration services. Informal fixers charge ₱500–₱3,000 for queuing/form-filling assistance.

**Computability**: Score **3** — DTI component is fully deterministic; LGU LBT component requires LGU-specific rate (or statutory max estimate); ancillary fees are range-based, not deterministic. Overall "mostly deterministic with LGU variation."

**Opportunity score estimate**:
- Market: **5** (>1M events including multi-step process)
- Moat: **3** (professional fixers/consultants; multi-agency confusion)
- Computability: **3** (partially deterministic; LGU variation)
- Pain: **4** (confusing multi-agency process; hidden fees; sequential dependency; no single government guide)
- **Score = (5×0.25) + (3×0.25) + (3×0.30) + (4×0.20) = 1.25 + 0.75 + 0.90 + 0.80 = 3.70**

---

### Domain 4: Annual Business Compliance Calendar + Multi-Agency Renewal Tracker

**Description**: A calendar-based compliance tool for active sole proprietors tracking: (1) DTI BN 5-year renewal with 90-day grace window and cancellation risk, (2) Annual LGU business permit renewal (January 20 deadline), (3) Quarterly LBT installment schedule (Jan 20, Apr 20, Jul 20, Oct 20), (4) Annual BIR filing obligations (no registration renewal fee, but monthly/quarterly return deadlines still apply), and (5) SSS/PhilHealth/Pag-IBIG monthly remittance deadlines.

**Computation sketch**:
```
Inputs: DTI registration date, DTI scope, LGU, business type, gross receipts, employee count
Output:
  - DTI expiry date, renewal window open date, late window open date, cancellation date
  - LGU business permit renewal deadline (January 20) + Q2/Q3/Q4 installment dates
  - LBT estimate for current year (based on prior gross receipts input)
  - Late penalty computation if queried after January 20
  - BIR filing calendar (1601-C monthly, 2551Q quarterly, 1701Q quarterly, 1701 annual)
  - SSS/PhilHealth/Pag-IBIG monthly remittance deadlines by employee count
```

**Market size**: ~5 million active sole proprietors; every active business must track these annually.

**Professional fee range**: Bookkeepers charge ₱2,000–₱8,000/month to track compliance for micro businesses; accountants ₱5,000–₱20,000/month. Many micro-businesses simply miss deadlines and pay penalties. The 25% LBT surcharge alone on a ₱10,000 LBT bill costs ₱2,500 — more than the cost of a simple tracking app.

**Computability**: Score **4** — Deadline computation is fully deterministic; LBT installment amounts are deterministic once gross receipts are known. BIR calendar is statutory (fixed deadlines, no judgment required). Mostly deterministic with minor edge cases.

**Opportunity score estimate**:
- Market: **5** (>1M active businesses)
- Moat: **3** (bookkeepers/accountants provide this; expensive relative to micro-business revenues)
- Computability: **4** (mostly deterministic; deadline-driven)
- Pain: **4** (January crunch, 25% surcharge, multi-agency, missed DTI expiry = name loss)
- **Score = (5×0.25) + (3×0.25) + (4×0.30) + (4×0.20) = 1.25 + 0.75 + 1.20 + 0.80 = 4.00**

---

## Key Insights

### The Real Opportunity Is the January 20 Annual Crunch, Not the DTI Registration

The DTI registration (one-time, online, ₱200–₱2,030) is low-complexity and has limited professional moat. The **annual LGU business permit renewal** is where the real pain lies:
- 1.2M+ businesses must compute their LBT (based on last year's gross receipts), gather prior-year audited financial statements or sworn declaration, get barangay clearance, FSIC, sanitation permit, and mayor's permit — all within January 1–20.
- The compressed 20-day window creates predictable annual chaos; businesses that miss it face 25% surcharge + 2%/month interest.
- No national tool helps businesses estimate their LBT before visiting the BPLO.

### LGU Variation Is a Data Problem, Not a Formula Problem

The formula for LBT is straightforward: `gross_receipts_prior_year × local_rate`. The bottleneck is that "local_rate" requires accessing each LGU's Local Revenue Code. A tool that sources this data from all 1,634 LGUs creates a one-time database asset with high durable value. Philippine cities increasingly publish their revenue codes online; scraping is feasible.

Alternatively, a tool could use the RA 7160 statutory maximum rate as a conservative upper-bound estimate — still highly useful for budget planning even without LGU-specific data.

### Combined Product Concept: "Negosyo Calc PH"

Inputs: `{LGU, business_type, scope, DTI_registration_date, prior_year_gross_receipts, employee_count}`

Outputs:
1. DTI BN cost/renewal status/expiry countdown
2. LBT estimate for current year + installment schedule
3. Full ancillary fee breakdown (barangay + FSIC + sanitation + mayor's)
4. Annual compliance calendar (DTI + LGU + BIR + mandated benefits)
5. Late penalty calculator for any date input

This is comparable to the "OFW Fee Shield" but for the ~5 million sole proprietors in the Philippines. The moat it disrupts is bookkeeper/accountant annual January compliance work (₱2,000–₱8,000/month retainer), informal fixer services (₱500–₱3,000/permit), and BPLO queuing costs (half-day lost wages).

### Comparison to Existing Tools

- **BNRS portal** (bnrs.dti.gov.ph): Handles DTI registration/renewal only. No LGU integration, no LBT computation.
- **LGU portals**: Some cities (Manila, Makati, Quezon City) have online business permit renewal portals. None provide advance LBT estimates before visiting the BPLO. None integrate DTI validity tracking.
- **Accounting software (QuickBooks, Xero PH)**: Track revenues but do not compute LBT, generate compliance calendar for LGU permits, or track DTI expiry.

### BFP FSIC Overlap

The FSIC (Fire Safety Inspection Certificate) component of the mayor's permit is governed by RA 9514 (Fire Code) and is separately analyzed under the `bfp-fire-safety` aspect. The two domains are complementary — a full business permit cost calculator needs both the LBT (this domain) and the FSIC computation (bfp-fire-safety domain).

---

## Domain Summary Table

| Domain | Computability | Market Score | Moat Score | Pain Score | **Opportunity Score** |
|--------|--------------|--------------|------------|------------|----------------------|
| Domain 1: LGU LBT Estimator | 3 | 5 | 3 | 4 | **3.70** |
| Domain 2: DTI Fee + Renewal Tracker | 5 | 5 | 1 | 2 | **3.40** |
| Domain 3: Startup Cost Navigator | 3 | 5 | 3 | 4 | **3.70** |
| Domain 4: Annual Compliance Calendar | 4 | 5 | 3 | 4 | **4.00** |

**Top Opportunity**: Domain 4 (Annual Business Compliance Calendar, 4.00) — fully deterministic deadline engine combining DTI 5-year expiry tracking, LGU January 20 deadline, quarterly LBT installment schedule, BIR filing calendar, and mandated benefits remittance — serves 5M+ sole proprietors with a recurring pain point that recurs every January and generates real financial penalties when missed.

**Combined Product Score**: All four domains integrate naturally into a single "Negosyo Calc PH" product. The compound market is ~5 million active sole proprietors; the recurring pain is annual.
