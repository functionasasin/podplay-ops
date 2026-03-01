# Scenarios — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** EXPANDED — Groups 1-8 (initial), Groups 9-14 (added by scenario-enumeration aspect). Total: 80 scenario codes.
**Last updated:** 2026-03-01

Each scenario code corresponds to a distinct computation path and taxpayer profile. Every scenario code MUST have at least one test vector in [../engine/test-vectors/exhaustive.md](../engine/test-vectors/exhaustive.md).

---

## Scenario Code Structure

Format: `SC-{profile_type}-{income_range}-{method}-{special_flag}`

- **profile_type:** P (professional/service), B (business/trading), M (mixed income)
- **income_range:** L (low ≤500K), ML (mid-low 500K-1M), MH (mid-high 1M-2M), H (high 2M-3M), VH (very high >3M)
- **method:** 8 (8% flat), O (OSD), I (itemized)
- **special_flag:** none, CWT (has significant CWT), VAT (VAT registered), FIRST (first year), NEW (new registrant mid-year)

---

## Scenario Codes (Initial Enumeration)

### Group 1: Pure Service/Professional — Below ₱3M Threshold (8% Eligible)

| Code | Profile | Gross Receipts | Expenses | Method | Notes |
|------|---------|---------------|---------|--------|-------|
| SC-P-L-8 | Freelancer | ₱100,000–₱500,000 | Minimal | 8% flat | Low-income; might be better on itemized if expenses zero |
| SC-P-L-O | Freelancer | ₱100,000–₱500,000 | Minimal | OSD | Uses graduated; inefficient but chosen |
| SC-P-L-I | Freelancer | ₱100,000–₱500,000 | High (>80%) | Itemized | Rare but possible at very high expense ratio |
| SC-P-ML-8 | Professional | ₱500,000–₱1,000,000 | 0–40% | 8% flat | Most common and usually optimal |
| SC-P-ML-O | Professional | ₱500,000–₱1,000,000 | Any | OSD | Suboptimal (8% wins), but permitted |
| SC-P-ML-I | Professional | ₱500,000–₱1,000,000 | >68% | Itemized | Only optimal at very high expense ratio |
| SC-P-MH-8 | Professional | ₱1,000,000–₱2,000,000 | 0–60% | 8% flat | 8% optimal for most in this range |
| SC-P-MH-O | Professional | ₱1,000,000–₱2,000,000 | Any | OSD | Suboptimal |
| SC-P-MH-I | Professional | ₱1,000,000–₱2,000,000 | >60% | Itemized | Optimal when high expense ratio |
| SC-P-H-8 | Professional | ₱2,000,000–₱3,000,000 | 0–58% | 8% flat | Still available; significant savings vs OSD |
| SC-P-H-O | Professional | ₱2,000,000–₱3,000,000 | Any | OSD | Suboptimal |
| SC-P-H-I | Professional | ₱2,000,000–₱3,000,000 | >58% | Itemized | Optimal when very high expenses |

### Group 2: Pure Service/Professional — Above ₱3M (VAT Registered, 8% NOT Available)

| Code | Profile | Gross Receipts | Expenses | Method | Notes |
|------|---------|---------------|---------|--------|-------|
| SC-P-VH-O-VAT | Professional | >₱3,000,000 | Any | OSD | VAT registered; Path B only vs Path A |
| SC-P-VH-I-VAT | Professional | >₱3,000,000 | >60% | Itemized | VAT registered; Path A may win with high expenses |

### Group 3: Mixed Income Earners (Employee + Freelancer)

| Code | Profile | Compensation | Biz Gross | Biz Method | Notes |
|------|---------|-------------|----------|-----------|-------|
| SC-M-L-8 | Employee + Freelancer | Any | ≤₱500,000 | 8% (no ₱250K deduction) | Small side income |
| SC-M-ML-8 | Employee + Freelancer | Any | ₱500K–₱1M | 8% (no ₱250K deduction) | Moderate side income |
| SC-M-MH-8 | Employee + Freelancer | Any | ₱1M–₱2M | 8% (no ₱250K deduction) | Significant side income |
| SC-M-ML-O | Employee + Freelancer | Any | ₱500K–₱1M | OSD combined | Combined graduated |
| SC-M-ML-I | Employee + Freelancer | Any | ₱500K–₱1M | Itemized combined | Combined graduated |

### Group 4: First-Year / New Registrants

| Code | Profile | Notes |
|------|---------|-------|
| SC-FIRST-8 | New registrant, first year, registered Q1 (Jan–Mar) | 8% available; election on COR or Q1 1701Q due May 15 |
| SC-FIRST-O | New registrant, first year, registered Q1 | OSD election on Q1 1701Q |
| SC-FIRST-MID-Q2 | Registered April–June (mid-year, Q2) | First quarterly return is Q2 (due August 15); Q2 is election quarter; 8% election possible; no Q1 return required |
| SC-FIRST-MID-Q3 | Registered July–September (mid-year, Q3) | First quarterly return is Q3 (due November 15); Q3 is election quarter; 8% election possible; no Q1 or Q2 return required |
| SC-FIRST-MID-Q4 | Registered October–December (mid-year, Q4) | No quarterly returns at all for registration year; only annual 1701/1701A due April 15 next year; if graduated: Q4 2551Q due January 25 next year |

### Group 5: CWT-Heavy Scenarios

| Code | Profile | Notes |
|------|---------|-------|
| SC-P-ML-8-CWT | Service provider, 8% rate | Large CWT credits may exceed annual IT; full or partial refund/TCC/carryover disposition at annual; quarterly: CWT offsets incremental payments |
| SC-P-ML-O-CWT | Service provider, graduated+OSD | CWT accumulates across Q1/Q2/Q3; Item 57 (prior-quarter CWT) plus Item 58 (new CWT) tracked separately each quarter |
| SC-P-ML-8-CWT-PLATFORM | Freelancer on Upwork/Payoneer | RR 16-2023 1% platform withholding (ATC WI760) plus 5% client EWT (WI010); both types of 2307 credited against income tax |

### Group 6: Threshold Crossing

| Code | Profile | Notes |
|------|---------|-------|
| SC-CROSS-3M | Pure service provider | Gross crosses ₱3M mid-year during Q2 or Q3; 8% retroactively cancelled; retroactive 3% PT computed; all 8% quarterly payments credited toward graduated annual tax; Form 1701 required at annual |
| SC-AT-3M | Pure service provider | Gross receipts exactly ₱3M at year-end; boundary condition: 8% eligible (≤₱3M), SMALL tier, not VAT-required; annual IT = (₱3,000,000 − ₱250,000) × 8% = ₱220,000 |
| SC-NEAR-3M | Pure service provider | Gross ₱2,800,000–₱2,999,999; 8% still available; engine shows savings vs OSD (₱76,000–₱83,800 advantage for 8%) and highlights risk if Q4 earnings push over ₱3M |

### Group 7: Special Deduction Scenarios

| Code | Profile | Notes |
|------|---------|-------|
| SC-NOLCO | Sole proprietor, graduated+itemized | Prior year net operating loss carry-over; NOLCO deductible only under itemized (not OSD/8%); 3-year FIFO expiry; quarterly NOLCO applied proportionally |
| SC-ZERO-EXPENSE | Professional (online freelancer) | No business expenses at all; 8% almost always optimal; quarterly: all Schedule II with ₱250K deduction; annual 1701A |
| SC-HIGH-ENTERTAIN | Agency/professional | Entertainment/representation/transportation expenses capped at 1% of gross receipts (service) or 0.5% of net sales (goods) per RR 10-2002; EAR cap computed at annual level |

### Group 8: Quarterly-Cycle–Specific Scenarios

Scenarios that exercise the multi-quarter cumulative computation specifically:

| Code | Profile | Notes |
|------|---------|-------|
| SC-QC-8-3Q | 8% pure SE, three full quarters | Cumulative gross builds Q1→Q2→Q3; ₱250K deduction applied each quarter via Item 52; quarterly tax payable varies by quarter due to cumulative structure; annual reconciliation shows balance |
| SC-QC-OSD-3Q | Graduated+OSD, three full quarters | Item 36 (current quarter) + Item 42 (prior NTI carryforward) builds cumulative NTI; bracket escalation visible across quarters; annual 1701A |
| SC-QC-ITEMIZED-3Q | Graduated+Itemized, three full quarters | Deductions accumulate quarterly (Item 39 = current quarter deductions); prior NTI carryforward in Item 42; NOLCO applied proportionally per quarter |
| SC-QC-NIL-Q1 | 8% or OSD, zero Q1 income | Q1 NIL return required; ₱0 payable; Item 50 (for 8%) passes ₱0 to Q2; Q2 computation starts fresh; CWT not yet applicable in Q1 |
| SC-QC-CWT-SHIFT | OSD or 8%, CWT received late | Q1 2307 received in Q2 (after Q1 1701Q was filed); CWT appears in Q2 Item 58 instead of Q1; Q1 was correctly filed showing ₱0 CWT; Q2 cumulative credits absorb full Q1+Q2 CWT |
| SC-QC-AMENDMENT | 8% rate | Q1 filed with wrong gross figure (understated by ₱100K); Q1 must be amended; Q2 and Q3 cascade: Item 50 in Q2 must be updated to corrected Q1 Item 51; both Q2 and Q3 must also be amended |
| SC-QC-OVERPY-Q3 | OSD or 8% | Cumulative YTD CWT at Q3 exceeds cumulative IT due; Q3 Item 63 is negative (overpayment); Q3 actual payment = ₱0; overpayment flows to annual reconciliation where excess CWT triggers refund/TCC/carryover |

---

## Priority for Test Vectors

Highest priority scenarios for initial test vectors:
1. SC-P-ML-8 — Most common real-world case
2. SC-P-ML-O — Suboptimal but frequently chosen
3. SC-M-ML-8 — Mixed income with 8% (most tricky)
4. SC-P-MH-I — High-expense case where itemized wins
5. SC-P-H-8 — Near-threshold case
6. SC-P-VH-O-VAT — Over-threshold VAT case
7. SC-CROSS-3M — Threshold crossing edge case
8. SC-QC-8-3Q — Full three-quarter cumulative cycle for 8% (quarterly tracking feature)
9. SC-FIRST-MID-Q2 — Mid-year registrant (Q2 election window)
10. SC-QC-OVERPY-Q3 — Q3 overpayment flowing to annual reconciliation

---

### Group 11: Additional Mixed Income Sub-Scenarios (Expanding Group 3)

These extend Group 3. Group 3 only enumerated the most common Mixed Income paths; this group adds the remaining method and income-range combinations.

| Code | Profile | Compensation | Biz Gross | Biz Method | Key Notes |
|------|---------|-------------|----------|-----------|-----------|
| SC-M-L-O | Employee + small freelance | Any amount | ≤₱500,000 | OSD | Combined NTI = taxable_comp + (biz_gross × 0.60); graduated rates on combined; Form 1701 always |
| SC-M-L-I | Employee + small freelance | Any amount | ≤₱500,000 | Itemized | Combined NTI = taxable_comp + (biz_gross − itemized_deductions); only optimal when expenses > 40% of small biz GR |
| SC-M-MH-O | Employee + medium business | Any amount | ₱1,000,000–₱2,000,000 | OSD | Significant biz income adds to NTI; OSD on biz portion; combined NTI pushes into higher graduated bracket |
| SC-M-MH-I | Employee + medium business | Any amount | ₱1,000,000–₱2,000,000 | Itemized | Only optimal when biz expenses > 40% of biz GR; documents required for all deductions |
| SC-M-H-8 | Employee + large business | Any amount | ₱2,000,000–₱3,000,000 | 8% (no ₱250K) | Business at 8% separate; comp at graduated separate; NO ₱250K deduction on business income per RMC 50-2018; Form 1701 required |
| SC-M-H-O | Employee + large business | Any amount | ₱2,000,000–₱3,000,000 | OSD | Combined NTI often in 25–30% graduated bracket; OSD may be better than 8% if compensation pushes combined NTI high |
| SC-M-H-I | Employee + large business | Any amount | ₱2,000,000–₱3,000,000 | Itemized | Only when biz expense ratio > 58-75% (breakeven varies by income level); high documentation burden |
| SC-M-MINWAGE | Minimum wage employee + business | Minimum wage salary (₱0 taxable, tax-exempt under Sec. 24(A)(2)(a)) | Any ≤₱3M | Any | Min wage is income-tax-exempt; biz NTI is the ENTIRE taxable base; ₱250K deduction barred even though comp is ₱0 taxable (has compensation income); Path B (OSD) often optimal — may yield NTI below ₱250K threshold |
| SC-M-GOVT | Government employee + business | Government salary (GSIS instead of SSS; PhilHealth/Pag-IBIG apply same way) | Any | Any | Form 2316 from government employer; GSIS contributions non-taxable same as SSS; 13th month pay same ≤₱90K exemption; Form 1701 required; business income handled identically to private employees |
| SC-M-DUAL-EMP | Two private employers + business | Two Form 2316s (Main + Second employer) | Any | Any | Both employers withhold but second employer uses Q1-Q3 cumulative withheld amount from their employment alone; aggregation required at annual; balance payable almost certain because second employer doesn't know first employer's comp; Form 1701 required |

---

### Group 9: Business/Trading Taxpayers (SC-B)

Trading taxpayers (sellers of goods) differ from service providers in one critical way: **OSD base = 40% of gross INCOME (gross sales − COGS), NOT gross sales**. The 8% base is still gross sales. Itemized deductions include COGS as the primary deduction category.

| Code | Profile | Gross Sales | COGS Ratio | Method | Key Notes |
|------|---------|-------------|-----------|--------|-----------|
| SC-B-ML-8 | Online retailer (digital/physical goods) | ₱500,000–₱1,000,000 | < 20% | 8% flat | Low COGS means 8% on gross sales is cost-effective; OSD would apply to (gross sales − COGS) which is nearly equal to gross sales when COGS is minimal; 8% wins clearly |
| SC-B-ML-O | Physical goods retailer | ₱500,000–₱1,000,000 | 30%–50% | OSD | OSD = 40% × (gross_sales − COGS); graduated on net; example: ₱800K sales, ₱400K COGS → gross income ₱400K → OSD ₱160K → NTI ₱240K → ₱0 income tax + 3% PT ₱24K; compare to 8%: (₱800K − ₱250K) × 8% = ₱44K; OSD wins at high COGS |
| SC-B-ML-I | High-cost goods retailer | ₱500,000–₱1,000,000 | > 70% | Itemized | COGS + operating expenses exceed OSD; itemized = COGS + other allowed expenses; example: ₱800K sales, ₱600K COGS, ₱100K other expenses → NTI ₱100K → ₱0 income tax |
| SC-B-MH-8 | E-commerce seller | ₱1,000,000–₱2,000,000 | < 30% | 8% flat | Low COGS; 8% on gross sales beats OSD on small gross income base; standard optimal choice for digital product sellers |
| SC-B-MH-O | General merchandise retailer | ₱1,000,000–₱2,000,000 | 40%–60% | OSD | OSD on gross income; example: ₱1.5M sales, ₱750K COGS → gross income ₱750K → OSD ₱300K → NTI ₱450K → graduated tax ₱22,500 + 3% PT ₱45K = ₱67,500; 8% comparison: (₱1.5M − ₱250K) × 8% = ₱100K; OSD wins significantly |
| SC-B-MH-I | Importer/distributor | ₱1,000,000–₱2,000,000 | > 65% | Itemized | Very high COGS; total deductible = COGS + operating; itemized almost always beats OSD when COGS ratio exceeds 60% |
| SC-B-H-8 | E-commerce seller | ₱2,000,000–₱3,000,000 | < 25% | 8% flat | At ₱3M with low COGS: 8% = (₱3M − ₱250K) × 8% = ₱220K; OSD at ₱3M gross, ₱750K COGS → gross income ₱2.25M → OSD ₱900K → NTI ₱1.35M → graduated ₱240K + PT ₱90K = ₱330K; 8% wins |
| SC-B-H-O | Large retailer | ₱2,000,000–₱3,000,000 | 45%–65% | OSD | OSD on gross income; example ₱2.5M sales, ₱1.375M COGS → gross income ₱1.125M → OSD ₱450K → NTI ₱675K → graduated ₱57,500 + PT ₱75K = ₱132,500; 8%: (₱2.5M − ₱250K) × 8% = ₱180K; OSD wins |
| SC-B-H-I | Distributor/importer | ₱2,000,000–₱3,000,000 | > 65% | Itemized | COGS ratio so high that itemized (COGS + expenses) substantially reduces NTI below OSD amount; preferred when supplier documentation is complete |
| SC-B-VH-O-VAT | VAT-registered retailer | > ₱3,000,000 | Any | OSD | OSD = 40% of gross income (VAT-exclusive gross sales − COGS VAT-exclusive); graduated rates; no PT component; 8% not available; example ₱5M gross sales (VAT-excl), ₱3M COGS → gross income ₱2M → OSD ₱800K → NTI ₱1.2M → graduated ₱197,500 |
| SC-B-VH-I-VAT | VAT-registered importer | > ₱3,000,000 | > 40% | Itemized | Path A: (gross_sales_vat_excl − COGS − operating_expenses) → NTI; graduated; preferred when COGS + expenses > 40% of gross income |

---

### Group 10: Combined Service + Trading (Mixed Business Types) (SC-COMBO)

A taxpayer who earns both professional/service income AND sells goods under one TIN. Both income streams are aggregated. The OSD base differs for each stream: service portion OSD = 40% × service gross receipts; trading portion OSD = 40% × (goods gross sales − COGS). For the 8% option, the combined gross (service + goods) must be ≤ ₱3M and the rate applies to the combined total.

| Code | Profile | Service Gross | Goods Gross (Sales) | COGS | Method | Key Notes |
|------|---------|--------------|---------------------|------|--------|-----------|
| SC-COMBO-ML-8 | Designer + digital product seller | ₱400,000 | ₱300,000 | ₱30,000 | 8% flat | Combined gross ₱700K ≤ ₱3M → 8% eligible; 8% base = ₱700K total gross; tax = (₱700K − ₱250K) × 8% = ₱36K + ₱0 PT; no COGS distinction under 8% |
| SC-COMBO-MH-O | Consultant + merchandise | ₱1,000,000 | ₱500,000 | ₱250,000 | OSD | Combined gross ₱1.5M; OSD base for service = ₱1M × 60% = ₱600K NTI portion; OSD base for goods = (₱500K − ₱250K) × 60% = ₱150K NTI portion; combined NTI = ₱750K; graduated tax = ₱57,500 + 3% PT on ₱1.5M = ₱45K; total = ₱102,500; 8% comparison: (₱1.5M − ₱250K) × 8% = ₱100K; 8% wins slightly |
| SC-COMBO-CROSS-3M | Freelancer + online store | ₱2,000,000 | ₱1,200,000 | ₱400,000 | OSD or Itemized | Combined gross ₱3.2M → exceeds ₱3M → 8% NOT available; VAT registration required; Paths A or B only; OSD: service ₱2M × 60% + (₱1.2M − ₱400K) × 60% = ₱1.2M + ₱480K = ₱1.68M NTI; graduated ₱307,500 |

---

### Group 12: Breakeven and Boundary Precision Scenarios (SC-BE)

These scenarios test the engine at the exact mathematical boundaries where two tax paths produce equal total tax. They are critical for verifying the regime comparison logic and tie-breaking rules.

| Code | Profile | Gross Receipts | Expense Input | Expected Result | Key Test Point |
|------|---------|---------------|--------------|----------------|----------------|
| SC-BE-OSD-8-LO | Pure service, professional | Exactly ₱400,000 | ₱0 expenses (OSD comparison) | Path C = Path B = ₱12,000 total tax; tie-break: Path C wins (preference rule: 8% > OSD > Itemized on tie) | First 8%/OSD tie: Path C IT = (₱400K − ₱250K) × 8% = ₱12,000; Path B IT = graduated(₱400K × 0.60) = graduated(₱240K) = ₱0 + 3% PT on ₱400K = ₱12,000; totals equal; engine selects Path C |
| SC-BE-OSD-8-HI | Pure service, professional | Exactly ₱437,500 | ₱0 expenses (OSD comparison) | Path C = Path B = ₱15,000 total tax; tie-break: Path C wins | Second 8%/OSD tie: Path C = (₱437.5K − ₱250K) × 8% = ₱15,000; Path B = graduated(₱437.5K × 0.60) = graduated(₱262.5K) = (₱262.5K − ₱250K) × 0.15 = ₱1,875 + 3% × ₱437.5K = ₱13,125; total ₱15,000; at this gross, Path B catches back up to Path C |
| SC-BE-OSD-WINS | Pure service, professional | ₱420,000 | ₱0 (OSD) | Path B < Path C — OSD is optimal in ₱400K–₱437.5K window | Path C = (₱420K − ₱250K) × 8% = ₱13,600; Path B = graduated(₱420K × 0.60) = graduated(₱252K) = (₱252K − ₱250K) × 0.15 = ₱300 + 3% × ₱420K = ₱12,600 + ₱300 = ₱12,600; TOTAL Path B = ₱12,600 < Path C = ₱13,600; Path B recommended |
| SC-BE-8-ITEMIZED-500K | Pure service, 43.33% expense ratio | ₱500,000 | ₱216,667 expenses | Path A = Path C = ₱20,000 total tax; tie-break: Path C wins | Path C IT = (₱500K − ₱250K) × 8% = ₱20,000; Path A: NTI = ₱500K − ₱216,667 = ₱283,333; graduated = (₱283,333 − ₱250K) × 0.15 = ₱5,000; + 3% PT = ₱15,000; total = ₱20,000; exact tie at 43.33% expense ratio |
| SC-BE-OSD-ITEMIZED | Pure service, exactly 40% expense ratio | Any gross | Expenses = 40% of gross | Path A = Path B (by construction); tie-break: Path B wins (OSD > Itemized) | OSD = 40% of GR → NTI = 60% GR; Itemized = NTI = GR − 40%GR = 60% GR; same NTI → same graduated tax → same PT; totals are exactly equal; engine selects Path B |
| SC-BELOW-250K | Pure service freelancer | ₱150,000 | ₱0 | 8% IT = ₱0; OSD IT = ₱0; Itemized IT = ₱0 | Path C: (₱150K − ₱250K) < ₱0 → IT = ₱0 (floored); Path B: NTI = ₱150K × 0.60 = ₱90K < ₱250K → IT = ₱0; PT under Path B = 3% × ₱150K = ₱4,500; total Path B = ₱4,500; Path C total = ₱0 (8% eliminates PT); Path C wins |
| SC-AT-250K-EXACT | Pure service freelancer | Exactly ₱250,000 | ₱0 | 8% IT = ₱0; Path C total = ₱0 | Path C: (₱250K − ₱250K) × 8% = ₱0; Path B: NTI = ₱250K × 0.60 = ₱150K < ₱250K → IT = ₱0 + PT ₱7,500; total Path B = ₱7,500; Path C total = ₱0; Path C wins by ₱7,500 |

---

### Group 13: Late-Filing and Penalty Scenarios (SC-LATE)

These scenarios exercise the penalty computation module. Input is (tax_due, days_late, taxpayer_tier, return_type, is_nil_return).

| Code | Profile | Return Type | Filing Status | Taxpayer Tier | Key Notes |
|------|---------|------------|--------------|--------------|-----------|
| SC-LATE-1701 | Any taxpayer | Form 1701/1701A Annual | Filed after April 15 (e.g., 45 days late, July 1) | MICRO | Penalty = surcharge (10%) + interest (6% annual × 45/365 days × tax_due) + compromise (per tax-due bracket table); total tax payable = tax_due + penalties; installment option was available (April 15 + July 15) but missed → full amount due |
| SC-LATE-1701Q-Q1 | Quarterly filer | Form 1701Q Q1 | Filed after May 15 (e.g., June 1) | SMALL | Quarterly balance payable subject to penalties; if zero balance payable (full CWT offset) but return is late → still subject to ₱1,000 compromise penalty (nil compromise); surcharge and interest only apply on tax-due amount > ₱0 |
| SC-LATE-2551Q | Non-8% taxpayer | Form 2551Q | Filed after 25th day of month following quarter end | MICRO | If PT is ₱0 (NIL return): compromise penalty ₱1,000 for 1st offense; if PT > ₱0: three-component penalty; MICRO/SMALL surcharge rate = 10%; interest rate = 6% per annum |
| SC-CATCHUP-3YR | Non-filer | Forms 1701 for 3 prior years + all 1701Q returns | Voluntary disclosure filing 3 unfiled years | SMALL | Compute penalty for each year separately: basic tax + surcharge (10% SMALL) + interest (6% × days past each deadline) + compromise; verify 3-year ordinary prescriptive period has NOT expired (if within 3 years from original due date, BIR can still assess); total across 3 years; engine shows annual and combined penalty breakdown |

---

### Group 14: Platform Freelancer Specifics (SC-PLAT)

These scenarios focus on the CWT mechanics specific to platform-based freelancers, particularly RR 16-2023 (e-marketplace withholding) and the combination of platform CWT with local client CWT.

| Code | Profile | Income Source | CWT ATC(s) | Tax Rate | Key Notes |
|------|---------|--------------|-----------|---------|-----------|
| SC-PLAT-UPWORK-8 | Upwork/Payoneer freelancer, 8% rate | 100% Upwork via Payoneer | WI760 at 1% × ½ gross = effective 0.5% of gross remittance | 8% annual IT | Combined platform remittances must exceed ₱500K threshold OR Sworn Declaration not submitted → Payoneer withholds; 2307 issued within 20 days after quarter end; CWT credited at annual 1701A against IT due; most Upwork freelancers have modest CWT relative to 8% liability |
| SC-PLAT-UPWORK-GRAD | Upwork/Payoneer, GR > ₱3M | 100% Upwork via Payoneer | WI760 | Path A or B only (>₱3M) | 8% not available; WI760 CWT still creditable against income tax under Path A/B; ATC classification: WI760 → INCOME_TAX_CWT (not PT_CWT) |
| SC-PLAT-LOCAL-5PCT | Local professional, small clients | Local corporate clients, each < ₱3M annual purchase | WI010 (5% EWT) | 8% or graduated | Standard 5% EWT for professionals when professional's prior-year gross < ₱3M AND payor is not a Top Withholding Agent; 2307 issued quarterly; CWT often significant relative to annual IT under 8% |
| SC-PLAT-LOCAL-10PCT | Local professional, large clients | Local corporate clients or Top Withholding Agents | WI011 (10% EWT) or WI157 (2% TWA) | Path A or B (often large gross) | 10% applies when professional's prior-year gross ≥ ₱3M; 2% applies when payor is BIR-designated TWA; engine determines correct expected rate; flags MRF-021 if 2307 shows wrong rate |
| SC-PLAT-MIXED-CWTS | Both Upwork and local clients | Upwork/Payoneer + local corporate clients | WI760 (0.5% eff.) + WI010 (5%) | 8% or graduated | Multiple 2307 entries of different ATCs; aggregate_cwt() function sums all INCOME_TAX_CWT types; combined CWT can exceed annual tax under 8% for mid-range earners (₱800K–₱1.5M); overpayment election required at annual |

---

## Updated Priority for Test Vectors

Highest-priority scenarios for initial test vector writing (updated to include new groups):

1. SC-P-ML-8 — Most common real-world case (online freelancer, ₱700K gross, 8% wins)
2. SC-P-ML-O — Suboptimal OSD path (same gross, uses OSD instead; shows tax cost of wrong choice)
3. SC-M-ML-8 — Mixed income with 8% (most complex, no ₱250K deduction)
4. SC-P-MH-I — High-expense case where itemized wins (₱1.5M gross, 65% expense ratio)
5. SC-P-H-8 — Near-threshold case (₱2.8M gross, 8% saves vs OSD)
6. SC-P-VH-O-VAT — Over-threshold VAT case (₱5M gross, Paths A/B only)
7. SC-CROSS-3M — Threshold crossing (8% retroactively cancelled mid-year)
8. SC-QC-8-3Q — Full three-quarter 8% cumulative cycle
9. SC-B-ML-O — Business/trading, OSD wins because COGS is high
10. SC-BE-OSD-WINS — OSD beats 8% in narrow ₱420K window
11. SC-BE-8-ITEMIZED-500K — Exact breakeven (itemized = 8% at 43.33% expense ratio)
12. SC-PLAT-UPWORK-8 — Upwork freelancer, WI760 CWT mechanics
13. SC-LATE-1701 — Penalty computation for late annual filing
14. SC-M-MINWAGE — Minimum wage employee + business (Path B often wins over Path C)
15. SC-COMBO-MH-O — Combined service+trading OSD computation

---

## Notes on Scenarios Not Covered by This Tool

The following scenarios are OUT OF SCOPE and should display a "manual review" flag per [manual-review-flags.md](manual-review-flags.md):
- GPP (General Professional Partnership) partners — use Sec. 26 distributive share rules; individual partner files Form 1701 but 8% option is unavailable; MRF-025 covers this
- Non-resident citizens — different source rules under Sec. 23; income derived from foreign sources is taxable only to resident citizens; MRF-026 covers this
- Non-resident aliens — different treaty rates may apply under applicable tax treaty (US, Japan, Singapore, etc.); MRF-027 covers this
- Foreign-source income — sourcing and exclusion rules complex; depends on residency status and type of income; see MRF-016 and MRF-017
- Retroactive regime change after Q1 deadline — requires amended returns and is a purely administrative process; the engine cannot compute retroactive changes without user intervention; see EC-QF01
- NOLCO carry-over — three-year FIFO tracking requires multi-year data not captured in a single-year computation; see EC-ID09 and SC-NOLCO
- Depreciation schedules — requires asset-by-asset data (purchase date, cost, useful life, accumulated depreciation); engine accepts only a single "annual depreciation expense" input; detailed depreciation schedule is prepared by a CPA
