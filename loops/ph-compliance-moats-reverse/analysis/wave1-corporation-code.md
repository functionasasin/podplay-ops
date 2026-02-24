# Wave 1 Analysis: Corporation Code — RA 11232 (Revised Corporation Code)

**Aspect:** corporation-code
**Sources:** RA 11232 (Revised Corporation Code, 2019), SEC MC No. 6 Series of 2024 (Updated Fines and Penalties), SEC MC No. 2 Series of 2024 (AFS/GIS filing deadlines), SEC MC No. 28 Series of 2020 (email/contact designation), SEC MC No. 1 Series of 2021 + MC No. 15 Series of 2025 (Beneficial Ownership), SEC Registration Calculator, RA 7717 (Stock Transaction Tax), NIRC Sec. 127 and 175
**Date analyzed:** 2026-02-24

---

## Overview

RA 11232 (Revised Corporation Code) governs the formation, operation, and dissolution of all corporations registered with the Philippine Securities and Exchange Commission. With 527,710 active SEC-registered companies at year-end 2024 and 52,304 new registrations in 2024 alone (a record high), the compliance universe is massive. Every registered corporation faces a recurring annual compliance cycle spanning at minimum four agencies: SEC (GIS + AFS filing), BIR (annual income tax + monthly/quarterly taxes), DOLE (labor standards), and LGU (business permit renewal).

The Corporation Code domain is computation-heavy in four primary sub-areas: (1) incorporation fee computation, (2) annual SEC penalty computation for late/non-filing, (3) capital increase/decrease computation, and (4) share transfer tax computation. There is also a growing compliance burden around beneficial ownership disclosure that has graduated thresholds and reporting windows. Corporate secretaries — whose engagement is legally required by the RCC — serve as the primary moat here, with retainer fees ranging from ₱3,000–₱10,000/month for routine compliance management.

---

## Domains Identified

---

### Domain 1: SEC Incorporation Fee Computation

**Description:** When incorporating a Philippine stock corporation, the SEC charges a filing fee based on authorized capital stock, plus a Legal Research Fee (LRF) and Documentary Stamp Tax (DST) on subscribed capital. The formulas are fully defined in the SEC's Consolidated Schedule of Fees (MC No. 9) and are purely arithmetic, yet most incorporation engagements are handled by lawyers who add a professional service fee on top.

**Governing sections:**
- RA 11232, Sec. 12-15 — Incorporation requirements (minimum subscribed/paid-up capital)
- RA 11232, Sec. 37 — 25%-25% rule for subscribed and paid-up capital
- SEC MC No. 9 (Consolidated Schedule of Fees and Charges)
- NIRC Sec. 175 — DST on original issuance of shares (₱1 per ₱200 par value)

**Computation rules:**

| Fee Component | Formula | Minimum |
|---|---|---|
| SEC Filing Fee | ACS × 0.002 (1/5 of 1%) | ₱2,000 |
| Legal Research Fee (LRF) | Filing Fee × 0.01 (1%) | ₱10 |
| By-Laws Registration Fee | Separate schedule (approx. ₱1,000–₱3,000) | ₱1,000 |
| Documentary Stamp Tax | (Subscribed Capital Stock ÷ 200) × ₱1.00 | — |

**The 25%-25% rule:**
```
Minimum Subscribed Capital = Authorized Capital Stock × 0.25
Minimum Paid-Up Capital = min(Subscribed Capital × 0.25, ₱5,000)

Example for ₱1,000,000 ACS:
  Filing Fee = ₱1,000,000 × 0.002 = ₱2,000
  LRF        = ₱2,000 × 0.01 = ₱20
  DST        = (₱250,000 ÷ 200) × ₱1 = ₱1,250
  Total SEC  ≈ ₱3,310

Example for ₱10,000,000 ACS:
  Filing Fee = ₱10,000,000 × 0.002 = ₱20,000
  LRF        = ₱20,000 × 0.01 = ₱200
  DST        = (₱2,500,000 ÷ 200) × ₱1 = ₱12,500
  Total SEC  ≈ ₱32,700
```

**Who currently does this:** Lawyers and incorporation service providers. The SEC provides an online Registration Fee Calculator at sec.gov.ph, but most businesses still engage a professional to prepare and file the Articles of Incorporation, By-Laws, Treasurer's Affidavit, and supporting documents. OneSEC (for ≤₱1M ACS using standard templates) allows DIY, but adoption is limited.

**Market size:** 52,304 new corporate registrations in 2024. This is the annual intake. Every one involves some version of this computation.

**Professional cost range:**
- Law firm/incorporation service: ₱10,000–₱50,000+ professional fee on top of SEC fees
- Budget incorporation services (outsourced): ₱5,000–₱15,000
- DIY via eSPARC: ₱0 professional fee, but few businesses attempt it without guidance

**Pain indicators:**
- Most SME owners are unaware that fees scale with authorized capital — they over-capitalize and pay unnecessary fees
- DST is often forgotten in the cost estimate
- The 25%-25% rule applies to the *subscribed* portion, not the full ACS — an important distinction that creates confusion

**Computability:** ★★★★★ Fully deterministic. All formulas are publicly available. The SEC even provides a calculator. The professional moat here is more about document preparation than fee computation itself — but the fee computation is pure arithmetic.

---

### Domain 2: Annual SEC Compliance Penalty Computation (GIS + AFS Late Filing)

**Description:** Every SEC-registered corporation must file an annual General Information Sheet (GIS) within 30 calendar days of its annual stockholders'/members' meeting, and Audited Financial Statements (AFS) within 120 days of fiscal year-end. Penalties for late filing follow a complex tiered matrix: entity type × equity bracket × offense number × late vs. non-filing distinction. SEC MC No. 6 (2024) updated this matrix significantly after 22 years of unchanged rates.

**Governing sections:**
- RA 11232, Sec. 177 — Reportorial requirements, delinquency, revocation
- SEC MC No. 6, Series of 2024 — Updated fines and penalty matrix
- SEC MC No. 2, Series of 2024 — 2024 filing deadlines

**Penalty matrix structure (late filing):**

| Entity Type | Equity Bracket | 1st Offense | ... | 5th Offense | 6th+ |
|---|---|---|---|---|---|
| Domestic Stock/OPC | Various (by retained earnings) | ₱5,000–₱9,000 | ... | ₱27,000–₱45,000 | + 100% surcharge |
| Domestic Non-Stock | Various (by fund balance/equity) | ₱5,000–₱9,000 | ... | ₱15,000–₱27,000 | + 100% surcharge |
| Foreign Stock | Various (by accumulated income) | ₱10,000–₱18,000 | ... | ₱30,000–₱54,000 | + 100% surcharge |
| Foreign Non-Stock | Various (by equity) | ₱5,000–₱9,000 | ... | ₱27,000–₱45,000 | + 100% surcharge |

**Key computation rules:**
```
Late Filing Definition:
  - After due date but within 1 year = "Late Filing" (tiered fine applies)
  - After 1 year from due date = treated as "Non-Filing" base fine
    + monthly penalty capped at 12 months additional

Non-compliance with SEC MC 28 (email/contact designation):
  - Flat fine: ₱20,000 (increased under MC 6, 2024)

Delinquency:
  - Triggered after 3 failures to file (consecutive or intermittent) within 5 years
  - 6th offense = revocation grounds + 5th offense fine × 200% (100% surcharge)

ECIP (Amnesty) calculation:
  - Non-compliant (unrevoked): fixed ₱20,000 to settle all unassessed penalties
  - Suspended/revoked: 50% of total assessed fines
```

**Who currently does this:** Corporate secretaries (who are legally required under the RCC) and compliance service providers. The penalty computation itself is not typically DIY'd — businesses discover their delinquency status and engage a compliance firm to (a) compute what they owe, (b) assess whether ECIP applies, and (c) submit the backlog of filings.

**Market size:**
- 527,710 active SEC-registered companies at end-2024
- Annual GIS + AFS filings: ~1M+ filing events per year
- The SEC's recurring ECIP/amnesty programs indicate systemic non-compliance — tens of thousands of delinquent corporations at any time
- The SEC ECIP 2024 enrolled corporations at ₱20,000 flat, implying each delinquent filer expected to owe more than that baseline

**Professional cost range:**
- Corporate secretary retainer: ₱3,000–₱10,000/month (₱36,000–₱120,000/year)
- Full-service managed compliance: ₱120,000–₱300,000/year (all-in)
- One-time catch-up/delinquency resolution: ₱20,000–₱80,000+
- A single missed GIS (1st offense) costs ₱5,000–₱9,000 in fines — often exceeding two months of the secretary retainer

**Pain indicators:**
- The penalty matrix is a 3-dimensional table (entity type × equity bracket × offense count) that is unintuitive without professional help
- Late vs. non-filing distinction and the 1-year cutoff is poorly understood
- The equity bracket is based on "retained earnings/fund balance/equity" — which changes year to year, meaning the penalty bracket can shift
- ECIP mechanics (flat fee vs. 50% of assessed) require a calculation to determine which route is cheaper
- Many small business owners are unaware of their delinquency until they need to amend or close the corporation

**Computability:** ★★★★☆ Mostly deterministic. Given: entity type, equity value, number of prior offenses, and filing dates — the penalty computes directly from the table in MC No. 6. The only non-deterministic element is establishing the "offense count" from SEC records (which requires querying the SEC's system). Once inputs are known, the computation is pure lookup + arithmetic.

---

### Domain 3: Capital Increase / Decrease Filing Computation

**Description:** When a corporation amends its Articles of Incorporation to increase or decrease authorized capital stock, specific computation rules apply to the 25%-25% rule (on the increment only), SEC amendment fees, and DST on newly issued shares. Errors in any of these components can result in the SEC rejecting the application or requiring supplemental payment.

**Governing sections:**
- RA 11232, Sec. 37 — Increase of capital stock (2/3 stockholder vote + SEC approval, 25%-25% on increment)
- RA 11232, Sec. 38 — Decrease of capital stock (creditor protection, 2/3 vote, surplus requirement)
- SEC MC No. 9 — Amendment fee schedule

**Computation rules:**
```
Increase in ACS:
  SEC Amendment Fee = Increase Amount × 0.002 (1/5 of 1%)
  Minimum amendment fee: ₱3,000

  For no-par value shares:
    Fee = Increase in shares × ₱100 per share × 0.002
    Minimum: ₱3,000

  DST on new shares subscribed at time of increase:
    DST = (Newly Subscribed Par Value ÷ 200) × ₱1.00

  25%-25% Rule (applies to increment only):
    Minimum new subscription = Increase in ACS × 0.25
    Minimum new paid-up = New Subscription × 0.25

Example: Increase ACS by ₱5,000,000:
  Amendment Fee = ₱5,000,000 × 0.002 = ₱10,000
  LRF = ₱10,000 × 0.01 = ₱100
  Min. new subscription = ₱1,250,000
  Min. new paid-up = ₱312,500
  DST on ₱1,250,000 new shares = ₱6,250
```

**Who currently does this:** Corporate lawyers and compliance firms. A capital increase involves preparing Treasurer's Affidavit, Director's Certificate, Secretary's Certificate, updated GIS, and potentially Bank Certificate for cash subscriptions or Auditor's Certificate for non-cash. The document preparation is the professional service; the fee computation is embedded.

**Market size:** Thousands of capital amendments annually. Every growing company that needs to onboard new investors, satisfy minimum capital requirements for a new industry license (e.g., BSP bank licensing, SEC investment company), or restructure ownership will require this.

**Professional cost range:**
- Law firm: ₱15,000–₱80,000 for a capital increase filing
- Compliance service provider: ₱8,000–₱30,000

**Pain indicators:**
- The 25%-25% rule applies to the *increment only* — many applicants incorrectly apply it to the total post-increase ACS, triggering supplemental subscription requirements
- No-par value shares have a different fee computation basis (imputed ₱100 per share)
- Bank Certificate requirement for cash subscriptions creates a separate banking step
- Post-amendment BIR registration update (for changes in tax profile) adds another agency

**Computability:** ★★★★★ Fully deterministic. The fees and the 25%-25% compliance check are pure arithmetic once the capital increase amount is known.

---

### Domain 4: Share Transfer Tax Computation (STT + DST + CGT)

**Description:** The transfer of corporate shares triggers different tax consequences depending on whether the shares are listed on the Philippine Stock Exchange or not, and whether the transfer is by sale, donation, or succession. The computation matrix is often misunderstood by small corporation shareholders who transfer shares informally (via unregistered deed of sale) and later face penalties at BIR audit.

**Governing sections:**
- NIRC Sec. 127 (as amended by TRAIN + CMEPA) — Stock Transaction Tax (STT) for PSE-listed shares
- NIRC Sec. 24(C) — Capital Gains Tax (15%) for unlisted shares (net gain)
- NIRC Sec. 27(D)(2) — Corporate CGT (15%) for unlisted shares held by corporations
- NIRC Sec. 175 — Documentary Stamp Tax on share transfers (₱1.50 per ₱200 par value)
- RA 7717 — STT for listed shares

**Computation matrix:**

| Transfer Type | Tax | Rate | Form |
|---|---|---|---|
| Sale of PSE-listed shares (on-exchange) | STT | 0.10% of gross selling price (post-July 2025 CMEPA) | BIR 2552 (filed by broker) |
| Sale of PSE-listed shares (on-exchange) | DST | Exempt | — |
| Sale of unlisted shares (off-exchange) | CGT | 15% of net gain (selling price minus cost basis) | BIR 1707 |
| Sale of unlisted shares (off-exchange) | DST | ₱1.50 per ₱200 par value of shares transferred | BIR 2000-OT |
| Donation of shares | Donor's Tax | 6% of FMV (covered in nirc-other-taxes aspect) | BIR 1800 |

**STT history:**
```
Pre-TRAIN: 0.50% of gross selling price
Post-TRAIN (Jan 2018 – Jun 2025): 0.60% of gross selling price
Post-CMEPA (Jul 1, 2025 onwards): 0.10% of gross selling price

Formula: STT = Gross Selling Price × applicable_rate
Due: Within 5 banking days of collection by broker
```

**CGT for unlisted shares:**
```
Net Gain = Selling Price - (Cost Basis + expenses of sale)
CGT = Net Gain × 15% (if gain > 0)
If loss: No CGT; loss is not deductible from ordinary income

DST = ceil(Par Value of Shares ÷ 200) × ₱1.50
```

**Who currently does this:** CPAs, stockbrokers (for STT), and tax lawyers (for CGT on unlisted shares). The CGT + DST computation for unlisted shares is a common compliance gap for closely held family corporations where shares are transferred between family members at undervalued prices, triggering BIR assessments on FMV-based deficiencies.

**Market size:**
- All PSE-listed share trades: millions of transactions daily, but STT computation is handled automatically by brokers
- Unlisted share transfers: the more actionable market — hundreds of thousands of transfers of shares in the ~527,000 closely-held corporations annually (shareholder changes, estate settlements, investor entries)
- Family corporations restructuring ownership: a significant but uncounted segment

**Professional cost range:**
- CPA for unlisted share CGT + DST computation: ₱3,000–₱15,000 per transaction
- Tax lawyer for corporate restructuring involving share transfers: ₱30,000–₱200,000+
- BIR penalty for unpaid CGT (late): 25% surcharge + 12% annual interest

**Pain indicators:**
- CGT on unlisted shares must be paid within 30 days of date of sale — many owners discover this only at BIR audit
- FMV-based assessment risk: BIR uses book value or appraised value if selling price is "too low"
- DST on par value creates a complication for no-par value shares (BIR may use issued value)
- The CMEPA STT rate change (from 0.6% to 0.1% effective July 2025) requires awareness of which rate applies to historical transactions

**Computability:** ★★★★☆ Mostly deterministic. The formulas are clear. The edge case requiring judgment is the FMV determination for unlisted shares (which the BIR may contest), but for standard arm's-length transfers at book value, the computation is mechanical.

---

### Domain 5: Director Compensation Cap (Sec. 29 RCC)

**Description:** Section 29 of the Revised Corporation Code limits total director compensation (including per diems) to 10% of the corporation's net income before income tax in the preceding year. This is a mandatory cap that applies to all stock corporations, and is frequently overlooked by family corporations that pay directors without reference to this statutory ceiling.

**Governing sections:**
- RA 11232, Sec. 29 — Compensation of directors

**Computation:**
```
Maximum Director Compensation = Net Income Before Income Tax (prior year) × 0.10

Note: "Net income before income tax" uses the audited financial statements figure.
If net income before income tax ≤ 0 (i.e., a loss year): Cap = 0 (no director fees payable
above what is expressly fixed in by-laws as reasonable compensation for services)

Typical components included in the ₱10% cap:
  - Per diems for board meetings
  - Director's fees
  - Bonuses or incentives specifically for directors as directors (not as officers)
```

**Who currently does this:** Corporate secretaries and CPAs preparing board resolutions on director compensation. Many family corporations are unaware of this cap and inadvertently violate it.

**Market size:** All 527,000+ stock corporations with boards. However, enforcement is weak and violations are typically discovered only in SEC audits or derivative suits. The useful market is corporations that proactively want to compute and document their cap compliance.

**Professional cost range:**
- Typically bundled into corporate secretary retainer
- Standalone computation: negligible (can be done in minutes once NIBT is known)

**Pain indicators:**
- Many family corporations pay directors flat fees without checking the 10% cap
- The cap applies to the *prior year* NIBT — requiring the current year's compensation decisions to be grounded in the prior year's audited results
- Non-compliance can be raised in shareholder derivative suits

**Computability:** ★★★★★ Fully deterministic. One multiplication from the AFS.

---

### Domain 6: Beneficial Ownership Disclosure Computation

**Description:** All SEC-registered corporations (stock and non-stock, domestic and foreign) must identify and disclose their beneficial owners — natural persons who ultimately own or control ≥25% of voting shares through direct or indirect holdings. This requires tracing ownership through corporate layers (chain of ownership). Changes must be reported within 30 days. The new MC No. 15 Series of 2025 (effective January 1, 2026) significantly tightened these requirements, making this a growing compliance burden.

**Governing sections:**
- SEC MC No. 1, Series of 2021 — Transparency of Beneficial Ownership guidelines
- SEC MC No. 15, Series of 2025 — Revised Beneficial Ownership Disclosure Rules (eff. Jan 1, 2026)
- RA 9160 (Anti-Money Laundering Act, as amended) — Underlying AML obligation
- RA 11232, Sec. 26 — Disclosure of shareholdings in the GIS

**The ≥25% threshold computation:**
```
Direct Beneficial Ownership:
  If Person A owns 25%+ of Corporation X's voting shares directly → Person A is a beneficial owner

Indirect Beneficial Ownership (chain calculation):
  If Person A owns 50% of Corp B, and Corp B owns 60% of Corp X:
    A's indirect interest in X = 50% × 60% = 30% → Person A IS a beneficial owner of Corp X
    (Because 30% ≥ 25% threshold)

  If Person A owns 40% of Corp B, and Corp B owns 55% of Corp X:
    A's indirect interest in X = 40% × 55% = 22% → Person A is NOT a beneficial owner
    (22% < 25% threshold)

  "Control" test (alternative):
    Even without 25% ownership, if Person A exercises effective control over Corp X
    (e.g., through voting agreements, board representation with decision-making power),
    Person A is still a beneficial owner (judgment-based determination)
```

**Reporting timeline:** Within 30 days from:
- Date of first registration (or 30 days from issuance of certificate of registration)
- Any change in beneficial ownership

**Who currently does this:** Corporate secretaries and compliance lawyers. The ownership chain computation for complex corporate groups (holding company → subsidiaries → sub-subsidiaries) requires mapping the full ownership graph and computing indirect ownership percentages at each layer. For simple SMEs with 2-3 individual shareholders, it's trivial. For corporate groups, it requires professional engagement.

**Market size:**
- All 527,000+ active corporations
- Effective January 1, 2026 (MC No. 15), this is now universal — no corporation is exempt
- The FATF gray-listing pressure on the Philippines has made this enforcement priority

**Professional cost range:**
- Bundled in corporate secretary retainer for simple corporations
- For complex multi-tier corporate groups: ₱20,000–₱100,000+ for a full beneficial ownership audit/mapping

**Pain indicators:**
- Indirect ownership chain computation is not intuitive for non-specialists
- "Control" vs. "ownership" distinction requires judgment in some cases
- The 30-day change-reporting requirement creates ongoing monitoring obligation
- Non-compliance exposed to SEC MC 28 penalties (₱20,000+ per violation) plus AML risk

**Computability:** ★★★★☆ Mostly deterministic for straightforward ownership chains. The threshold calculation is pure arithmetic for direct holdings. Indirect holdings through multiple layers require graph traversal with multiplication at each step — fully algorithmic. The edge case requiring judgment: "effective control" without formal ownership percentage.

---

## Key Findings

### The Corporate Secretary Moat

The most significant moat in the corporation code domain is not a specific formula but the **corporate secretary role itself**. Philippine law (RA 11232, Sec. 24) requires every corporation to have a corporate secretary who is a Filipino citizen and resident. This creates a legally mandated professional intermediary between corporations and SEC compliance. The corporate secretary:

1. Prepares the GIS (annual filing with SEC)
2. Tracks and computes applicable late filing penalties
3. Manages the beneficial ownership register and 30-day reporting obligation
4. Computes director compensation cap compliance
5. Prepares board resolutions, secretary's certificates, and meeting minutes
6. Monitors compliance deadlines and escalation paths

This mandatory intermediary is the moat. Automating the computation layer (penalty matrix, fee calculations, director comp cap, beneficial ownership chain) does not displace the corporate secretary but eliminates the professional judgment charge-up on what is fundamentally arithmetic and record-keeping.

### The Penalty Matrix as the Key Automation Target

The GIS/AFS penalty matrix (MC No. 6, 2024) is the clearest automation target:

- **4 entity types × multiple equity brackets × 5 offense levels = complex lookup table**
- Add the late vs. non-filing distinction and the 1-year cutoff rule
- Add the ECIP comparison (₱20,000 flat vs. computed penalty at 50%)
- Result: a calculation that requires looking up the right row/column in a 3D table, applying the time-based rule, and comparing ECIP to assessed penalty

This is exactly the kind of calculation that appears daunting to a small business owner, costs ₱5,000–₱20,000 in professional fees to compute, and is actually pure arithmetic once the table is digitized.

### Share Transfer: The Hidden Compliance Gap

Unlisted share transfers in closely-held corporations are a massive compliance gap. When a family corporation changes ownership — a parent transfers shares to children, a business partner exits — most do not engage a CPA for the CGT + DST computation. They draft a Deed of Sale and transfer the shares in the stock book, but never file BIR Form 1707 (CGT) or BIR Form 2000-OT (DST). BIR audits years later assess deficiencies with 25% surcharge + 12% annual interest, often making the tax bill larger than the original consideration.

An automated computation tool that says "you are transferring X shares of Company Y at price Z — here is your CGT (₱___) and DST (₱___), due within 30 days" would prevent a common and costly error.

---

## Summary Table

| Domain | Governing Law | Market Size | Pro Cost | Computability | Pain Score |
|---|---|---|---|---|---|
| SEC incorporation fee computation | RA 11232 + SEC MC 9, NIRC Sec. 175 | 52K new corps/year | ₱5K–₱50K/incorporation | 5/5 | 2/5 (SEC provides calculator) |
| Annual SEC compliance penalty (GIS/AFS late filing) | RA 11232 Sec. 177, SEC MC 6 (2024) | 527K active corps, 1M+ filing events/year | ₱36K–₱300K/year (secretary retainer) | 4/5 | 4/5 |
| Capital increase/decrease computation | RA 11232 Sec. 37-38, SEC MC 9 | Thousands of amendments/year | ₱8K–₱80K/amendment | 5/5 | 3/5 |
| Share transfer tax (unlisted shares) | NIRC Sec. 24(C), 175; TRAIN + CMEPA | Hundreds of thousands of transfers/year | ₱3K–₱200K/transaction | 4/5 | 4/5 |
| Director compensation cap | RA 11232 Sec. 29 | All 527K+ stock corps | Bundled in retainer | 5/5 | 2/5 (low enforcement) |
| Beneficial ownership chain computation | SEC MC 1-2021, MC 15-2025 | All 527K+ corps, eff. Jan 1 2026 | ₱20K–₱100K for complex groups | 4/5 | 3/5 |

---

## Cross-Reference Notes

- **DST on share issuance and transfers** — Also covered in `nirc-other-taxes` aspect (Sec. 175); flag for deduplication in Wave 2. DST appears both in initial incorporation (Sec. 175 on original issuance) and share transfers (Sec. 175 on transfer). These are the same section but different triggering events.
- **STT on PSE-listed shares** — Covered in `nirc-other-taxes` aspect (Sec. 127); this aspect provides the corporate mechanics context. Flag for deduplication.
- **CGT on unlisted shares** — Covered in `nirc-income-tax` aspect (Sec. 24C); mentioned here for the corporation-specific context. Flag for deduplication.
- **Mandatory SSS/PhilHealth/Pag-IBIG contributions** — Also surfaced in `labor-code-wages` and `dole-compliance` aspects; not a corporation-code-specific obligation but is part of the annual compliance calendar for every corporation with employees. Deduplication in Wave 2.
- **Beneficial ownership as AMLA obligation** — Intersects with the Banking/BSP domain; will surface again in `insurance-code` and any financial industry aspect.
- **AFS filing with both SEC and BIR** — The AFS (Audited Financial Statements) is filed with both agencies but at different deadlines: SEC (120 days from FY-end) and BIR (April 15 or 60 days from FY-end for fiscal year filers). The overlap creates a coordination requirement but not a new computation domain.
