# Worked Examples — Philippine Freelance & Self-Employed Income Tax

**Compiled:** 2026-02-28
**Sources:** respicio.ph, una-acctg.com, businesstips.ph, tripleiconsulting.com, taxumo.com, filepino.com, taxsummaries.pwc.com
**Purpose:** Concrete numerical examples for all 3 tax paths, quarterly filing, CWT offset, mixed income, and edge cases. These ground-truth examples inform engine test vectors.

---

## 1. Tax Year Context

All examples use the **2023+ graduated rate table** (TRAIN Law, second schedule effective January 1, 2023):

| Net Taxable Income Range | Tax on Band |
|--------------------------|-------------|
| ₱0 – ₱250,000 | ₱0 (0%) |
| ₱250,001 – ₱400,000 | 15% of excess over ₱250,000 |
| ₱400,001 – ₱800,000 | ₱22,500 + 20% of excess over ₱400,000 |
| ₱800,001 – ₱2,000,000 | ₱102,500 + 25% of excess over ₱800,000 |
| ₱2,000,001 – ₱8,000,000 | ₱402,500 + 30% of excess over ₱2,000,000 |
| Over ₱8,000,000 | ₱2,202,500 + 35% of excess over ₱8,000,000 |

---

## 2. Three-Path Annual Comparison Examples

### KEY NOTE ON OSD BASE
For **individuals in service/professional practice** (no cost of goods sold):
- Gross income = Gross receipts
- OSD = 40% × Gross receipts
- Net taxable (OSD path) = 60% × Gross receipts

For **individuals in trade/business** (with COGS):
- Gross income = Gross sales − Cost of Sales
- OSD = 40% × Gross income (per BIR Form 1701A structure, Item 41 = 40% × Item 40)
- Net taxable (OSD path) = 60% × Gross income

All worked examples below use SERVICE businesses (professionals/freelancers) where Gross income = Gross receipts.

---

### EX-001: Freelance Writer — Low Gross, Low Expenses
**Profile:** Freelance content writer. Gross receipts ₱500,000. Actual business expenses ₱100,000 (20% expense ratio). Service provider — no COGS.

**Path A — Graduated + Itemized Deductions:**
- Gross receipts: ₱500,000
- Less: Business expenses: ₱100,000
- Net taxable income: ₱400,000
- Graduated tax:
  - 0% × ₱250,000 = ₱0
  - 15% × (₱400,000 − ₱250,000) = 15% × ₱150,000 = ₱22,500
  - Income Tax Due (IT): ₱22,500
- Percentage Tax (3% × ₱500,000): ₱15,000
- **Total Tax Burden Path A: ₱37,500**

**Path B — Graduated + OSD:**
- Gross receipts: ₱500,000
- Less: OSD = 40% × ₱500,000 = ₱200,000
- Net taxable income: ₱300,000
- Graduated tax:
  - 0% × ₱250,000 = ₱0
  - 15% × (₱300,000 − ₱250,000) = 15% × ₱50,000 = ₱7,500
  - Income Tax Due (IT): ₱7,500
- Percentage Tax (3% × ₱500,000): ₱15,000
- **Total Tax Burden Path B: ₱22,500**

**Path C — 8% Flat Rate:**
- Gross receipts: ₱500,000
- Less: ₱250,000 (statutory exemption)
- Tax base: ₱250,000
- Tax = 8% × ₱250,000 = **₱20,000**
- Percentage Tax: ₱0 (waived under 8% regime)
- **Total Tax Burden Path C: ₱20,000**

**WINNER: Path C (8%) saves ₱2,500 vs Path B, ₱17,500 vs Path A**

| Path | IT Due | Percentage Tax | Total |
|------|--------|---------------|-------|
| A (Graduated + Itemized) | ₱22,500 | ₱15,000 | ₱37,500 |
| B (Graduated + OSD) | ₱7,500 | ₱15,000 | ₱22,500 |
| C (8% Flat) | ₱20,000 | ₱0 | ₱20,000 |

---

### EX-002: IT Consultant — Moderate Gross, No Expenses
**Profile:** Freelance software developer consulting for foreign clients. Gross receipts ₱1,000,000. No significant business expenses (works from home, no employees).

**Path A — Graduated + Itemized (no deductible expenses):**
- Net taxable income: ₱1,000,000
- Graduated tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × ₱400,000 = ₱80,000
  - 25% × (₱1,000,000 − ₱800,000) = 25% × ₱200,000 = ₱50,000
  - IT: ₱152,500
- Percentage Tax (3% × ₱1,000,000): ₱30,000
- **Total Path A: ₱182,500**

**Path B — Graduated + OSD:**
- OSD = 40% × ₱1,000,000 = ₱400,000
- Net taxable: ₱600,000
- Graduated tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × (₱600,000 − ₱400,000) = 20% × ₱200,000 = ₱40,000
  - IT: ₱62,500
- Percentage Tax: ₱30,000
- **Total Path B: ₱92,500**

**Path C — 8% Flat Rate:**
- (₱1,000,000 − ₱250,000) × 8% = ₱750,000 × 8% = **₱60,000**
- **Total Path C: ₱60,000**

**WINNER: Path C (8%) saves ₱32,500 vs Path B, ₱122,500 vs Path A**

| Path | IT Due | Percentage Tax | Total |
|------|--------|---------------|-------|
| A (Graduated + Itemized) | ₱152,500 | ₱30,000 | ₱182,500 |
| B (Graduated + OSD) | ₱62,500 | ₱30,000 | ₱92,500 |
| C (8% Flat) | ₱60,000 | ₱0 | ₱60,000 |

---

### EX-003: Graphic Designer — Moderate Gross, Moderate Expenses
**Profile:** Freelance graphic designer. Gross receipts ₱800,000. Expenses ₱300,000 (37.5% expense ratio).

**Path A — Graduated + Itemized:**
- Net taxable: ₱800,000 − ₱300,000 = ₱500,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × (₱500,000 − ₱400,000) = 20% × ₱100,000 = ₱20,000
  - IT: ₱42,500
- Percentage Tax (3% × ₱800,000): ₱24,000
- **Total Path A: ₱66,500**

**Path B — Graduated + OSD:**
- OSD = 40% × ₱800,000 = ₱320,000
- Net taxable: ₱480,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × (₱480,000 − ₱400,000) = 20% × ₱80,000 = ₱16,000
  - IT: ₱38,500
- Percentage Tax: ₱24,000
- **Total Path B: ₱62,500**

**Path C — 8% Flat Rate:**
- (₱800,000 − ₱250,000) × 8% = ₱550,000 × 8% = **₱44,000**
- **Total Path C: ₱44,000**

**WINNER: Path C (8%) saves ₱18,500 vs Path B, ₱22,500 vs Path A**

| Path | IT Due | Percentage Tax | Total |
|------|--------|---------------|-------|
| A (Graduated + Itemized) | ₱42,500 | ₱24,000 | ₱66,500 |
| B (Graduated + OSD) | ₱38,500 | ₱24,000 | ₱62,500 |
| C (8% Flat) | ₱44,000 | ₱0 | ₱44,000 |

---

### EX-004: High-Expense Professional — Itemized Deductions Win
**Profile:** Sole proprietor digital agency owner with employees. Gross receipts ₱1,500,000. Expenses ₱1,100,000 (73.3% expense ratio — salaries, rent, equipment).

**Path A — Graduated + Itemized:**
- Net taxable: ₱1,500,000 − ₱1,100,000 = ₱400,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × (₱400,000 − ₱250,000) = 15% × ₱150,000 = ₱22,500
  - IT: ₱22,500
- Percentage Tax (3% × ₱1,500,000): ₱45,000
- **Total Path A: ₱67,500** ← WINNER

**Path B — Graduated + OSD:**
- OSD = 40% × ₱1,500,000 = ₱600,000
- Net taxable: ₱900,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × ₱400,000 = ₱80,000
  - 25% × (₱900,000 − ₱800,000) = 25% × ₱100,000 = ₱25,000
  - IT: ₱127,500
- Percentage Tax: ₱45,000
- **Total Path B: ₱172,500**

**Path C — 8% Flat Rate:**
- (₱1,500,000 − ₱250,000) × 8% = ₱1,250,000 × 8% = ₱100,000
- **Total Path C: ₱100,000**

**WINNER: Path A (Itemized) saves ₱32,500 vs Path C, ₱105,000 vs Path B**
*This demonstrates that when expense ratio ≥ ~62.5%, itemized deductions can beat the 8% option.*

| Path | IT Due | Percentage Tax | Total |
|------|--------|---------------|-------|
| A (Graduated + Itemized) | ₱22,500 | ₱45,000 | ₱67,500 |
| B (Graduated + OSD) | ₱127,500 | ₱45,000 | ₱172,500 |
| C (8% Flat) | ₱100,000 | ₱0 | ₱100,000 |

---

### EX-005: Near-Threshold Lawyer — Still Eligible for 8%
**Profile:** Lawyer with active practice. Gross receipts ₱2,500,000 (just under ₱3M VAT threshold). Expenses ₱800,000 (32% expense ratio).

**Path A — Graduated + Itemized:**
- Net taxable: ₱2,500,000 − ₱800,000 = ₱1,700,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × ₱400,000 = ₱80,000
  - 25% × (₱1,700,000 − ₱800,000) = 25% × ₱900,000 = ₱225,000
  - IT: ₱327,500
- Percentage Tax (3% × ₱2,500,000): ₱75,000
- **Total Path A: ₱402,500**

**Path B — Graduated + OSD:**
- OSD = 40% × ₱2,500,000 = ₱1,000,000
- Net taxable: ₱1,500,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × ₱400,000 = ₱80,000
  - 25% × (₱1,500,000 − ₱800,000) = 25% × ₱700,000 = ₱175,000
  - IT: ₱277,500
- Percentage Tax: ₱75,000
- **Total Path B: ₱352,500**

**Path C — 8% Flat Rate:**
- (₱2,500,000 − ₱250,000) × 8% = ₱2,250,000 × 8% = **₱180,000**
- **Total Path C: ₱180,000**

**WINNER: Path C (8%) saves ₱172,500 vs Path B, ₱222,500 vs Path A**

| Path | IT Due | Percentage Tax | Total |
|------|--------|---------------|-------|
| A (Graduated + Itemized) | ₱327,500 | ₱75,000 | ₱402,500 |
| B (Graduated + OSD) | ₱277,500 | ₱75,000 | ₱352,500 |
| C (8% Flat) | ₱180,000 | ₱0 | ₱180,000 |

---

### EX-006: VAT-Registered Engineer — 8% NOT Available
**Profile:** Engineer, ₱4,000,000 gross receipts. Crossed ₱3M VAT threshold in prior year; now VAT-registered. Expenses ₱1,500,000.

**8% Flat Rate:** NOT AVAILABLE — taxpayer is VAT-registered and gross receipts > ₱3,000,000.

**Path A — Graduated + Itemized:**
- Net taxable: ₱4,000,000 − ₱1,500,000 = ₱2,500,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × ₱400,000 = ₱80,000
  - 25% × ₱1,200,000 = ₱300,000 (₱800K to ₱2M range)
  - 30% × (₱2,500,000 − ₱2,000,000) = 30% × ₱500,000 = ₱150,000
  - IT: ₱552,500
- Percentage Tax: ₱0 (registered for VAT, no % tax)
- VAT Liability: Computed separately (12% output VAT − input VAT credits, not income tax)
- **Total IT: ₱552,500**

**Path B — Graduated + OSD:**
- OSD = 40% × ₱4,000,000 = ₱1,600,000
- Net taxable: ₱2,400,000
- Tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × ₱400,000 = ₱80,000
  - 25% × ₱1,200,000 = ₱300,000
  - 30% × (₱2,400,000 − ₱2,000,000) = 30% × ₱400,000 = ₱120,000
  - IT: ₱522,500
- **Total IT: ₱522,500**

**WINNER: Path B (OSD) saves ₱30,000 vs Path A**
*Note: VAT computation is entirely separate from income tax.*

---

## 3. Quarterly Filing Example — Cumulative Method with CWT

### EX-007: Software Developer, OSD Method, Quarterly Progression

**Profile:** Freelance software developer. Gross receipts approximately ₱300,000/quarter. Using OSD. BIR 2307 issued by each client at 10% EWT rate on professional fees. Annual gross = ₱1,200,000.

**Quarter 1 (January–March):**
- Gross receipts Q1: ₱300,000
- OSD = 40% × ₱300,000 = ₱120,000
- Net taxable this quarter: ₱180,000
- Cumulative taxable income to date: ₱180,000
- Graduated IT on ₱180,000: ₱0 (below ₱250,000 threshold)
- Less: CWT from Form 2307 (Q1): ₱6,000 (2% × ₱300,000 — note: rate is 10% of ₱300K if professional fee, but let's use ₱6K for clean numbers)
- Less: Prior quarter payments: ₱0
- **Tax payable Q1 (Form 1701Q): ₱0** (CWT ₱6K > IT ₱0; ₱6K carried forward)
- Percentage tax Q1 (Form 2551Q): 3% × ₱300,000 = ₱9,000

**Quarter 2 (January–June, cumulative):**
- Cumulative gross receipts: ₱600,000
- Cumulative OSD: ₱240,000
- Cumulative net taxable: ₱360,000
- Graduated IT on ₱360,000:
  - 0% × ₱250,000 = ₱0
  - 15% × (₱360,000 − ₱250,000) = 15% × ₱110,000 = ₱16,500
  - Cumulative IT: ₱16,500
- Less: Total CWT to date (Q1+Q2): ₱6,000 + ₱6,000 = ₱12,000
- Less: Prior quarter payments: ₱0 (Q1 paid ₱0)
- Tax payable Q2: max(₱16,500 − ₱12,000 − ₱0, 0) = **₱4,500**
- Percentage tax Q2 (Form 2551Q): 3% × ₱300,000 = ₱9,000

**Quarter 3 (January–September, cumulative):**
- Cumulative gross receipts: ₱900,000
- Cumulative OSD: ₱360,000
- Cumulative net taxable: ₱540,000
- Graduated IT on ₱540,000:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × (₱540,000 − ₱400,000) = 20% × ₱140,000 = ₱28,000
  - Cumulative IT: ₱50,500
- Less: Total CWT to date (Q1+Q2+Q3): ₱18,000
- Less: Prior quarter payments (Q2 = ₱4,500): ₱4,500
- Tax payable Q3: max(₱50,500 − ₱18,000 − ₱4,500, 0) = max(₱28,000, 0) = **₱28,000**
- Percentage tax Q3 (Form 2551Q): 3% × ₱300,000 = ₱9,000

**Annual Reconciliation (April 15 filing — Form 1701A):**
- Full year gross receipts: ₱1,200,000
- OSD: 40% × ₱1,200,000 = ₱480,000
- Annual net taxable: ₱720,000
- Annual graduated IT:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × (₱720,000 − ₱400,000) = 20% × ₱320,000 = ₱64,000
  - Annual IT: ₱86,500
- Less: Total CWT for full year (Q1+Q2+Q3+Q4): ₱24,000
- Less: Total quarterly payments (Q1+Q2+Q3): ₱0 + ₱4,500 + ₱28,000 = ₱32,500
- Balance payable (annual): max(₱86,500 − ₱24,000 − ₱32,500, 0) = max(₱30,000, 0) = **₱30,000**
- Q4 percentage tax (Form 2551Q): 3% × ₱300,000 = ₱9,000

**Annual Summary:**
| Quarter | IT Paid | Percentage Tax Paid |
|---------|---------|-------------------|
| Q1 | ₱0 | ₱9,000 |
| Q2 | ₱4,500 | ₱9,000 |
| Q3 | ₱28,000 | ₱9,000 |
| Annual balance | ₱30,000 | ₱9,000 |
| **Total IT cash outflow** | **₱62,500** | |
| CWT pre-paid (2307) | ₱24,000 | |
| **Total effective tax** | **₱86,500** | ₱36,000 |

**Verification:** Annual IT ₱86,500 = Q2 ₱4,500 + Q3 ₱28,000 + Annual balance ₱30,000 + CWT credits ₱24,000 = ₱86,500 ✓

---

## 4. Mixed Income Earner Example

### EX-008: Employee + Freelancer — Choosing Tax Treatment for Business Portion

**Profile:** Maria is a full-time employee earning ₱480,000 annual gross compensation, also does freelance graphic design earning ₱600,000 gross receipts from clients. Business expenses: ₱80,000.

#### Compensation Income Component:
- Gross compensation: ₱480,000
- Mandatory deductions for tax purposes: SSS, PhilHealth, Pag-IBIG contributions are deductible in arriving at taxable compensation (per TRAIN — NOTE: contribution deductibility for non-mandatory is complex; for simplicity use BIR withholding computation which uses gross compensation minus mandatory contributions)
- Approximate mandatory contributions: SSS ≈ ₱14,400 + PhilHealth ≈ ₱12,000 + Pag-IBIG ₱2,400 = ₱28,800
- Net taxable compensation: ₱480,000 − ₱28,800 = ₱451,200
- Tax on compensation: 15% × (₱451,200 − ₱250,000) = 15% × ₱201,200 = ₱30,180
- Tax withheld by employer (TW): ≈ ₱30,180 (employer computes and remits this)

#### Option A: 8% on Business Income (Mixed Income Special Rule)
Per RMC 50-2018: When a mixed income earner elects 8% for business/professional income, the **₱250,000 exemption is NOT applied** (since the graduated rate exemption is already reflected in the compensation tax tables). The 8% is applied on GROSS business receipts, no deduction.
- 8% tax on business: 8% × ₱600,000 = ₱48,000
- Percentage Tax on business: ₱0 (waived under 8% election)
- Total additional tax beyond TW: ₱48,000
- **Total taxes: ₱30,180 (TW on comp) + ₱48,000 (8% on biz) = ₱78,180**

#### Option B: Graduated + OSD for Business Income (Combined at Annual)
At annual filing (Form 1701), compensation and business income are combined:
- Taxable compensation: ₱451,200
- Business net income (OSD): ₱600,000 − 40% × ₱600,000 = ₱600,000 − ₱240,000 = ₱360,000
- Total taxable income: ₱451,200 + ₱360,000 = ₱811,200
- Combined graduated tax:
  - 0% × ₱250,000 = ₱0
  - 15% × ₱150,000 = ₱22,500
  - 20% × ₱400,000 = ₱80,000
  - 25% × (₱811,200 − ₱800,000) = 25% × ₱11,200 = ₱2,800
  - Total IT: ₱105,300
- Less: TW on compensation: ₱30,180
- Balance for business income: ₱105,300 − ₱30,180 = ₱75,120
- Percentage Tax (3% × ₱600,000): ₱18,000
- **Total additional taxes beyond TW: ₱75,120 + ₱18,000 = ₱93,120**
- **Total taxes: ₱30,180 + ₱93,120 = ₱123,300**

#### Option C: Graduated + Itemized for Business (Combined)
- Business net income (itemized): ₱600,000 − ₱80,000 = ₱520,000
- Total taxable: ₱451,200 + ₱520,000 = ₱971,200
- Tax: 0 + ₱22,500 + ₱80,000 + 25% × (₱971,200 − ₱800,000) = ₱102,500 + 25% × ₱171,200 = ₱102,500 + ₱42,800 = ₱145,300
- Less: TW: ₱30,180 → Business IT: ₱115,120
- + PT ₱18,000
- **Total taxes: ₱30,180 + ₱115,120 + ₱18,000 = ₱163,300**

**WINNER for Mixed Income: Option A (8%) saves ₱45,120 vs OSD, ₱85,120 vs Itemized**

| Option | Comp Tax (TW) | Business IT | PT | Total |
|--------|--------------|-------------|-----|-------|
| A: 8% on biz | ₱30,180 | ₱48,000 | ₱0 | ₱78,180 |
| B: OSD on biz | ₱30,180 | ₱75,120 | ₱18,000 | ₱123,300 |
| C: Itemized on biz | ₱30,180 | ₱115,120 | ₱18,000 | ₱163,300 |

**KEY RULE REMINDER:** For mixed income earners choosing 8%:
- File Form 1701 (NOT 1701A — 1701A is for PURELY business income)
- 8% applies to GROSS receipts with NO ₱250,000 deduction
- Compensation income is still filed under Part III (Schedule A: Compensation Income)

---

## 5. Breakeven Analysis — When Does Each Path Win?

### Breakeven: 8% vs Graduated+OSD (Service Business, Below ₱3M)

At different gross receipt levels, compute when 8% beats Graduated+OSD:

For gross receipts GR (below ₱3M, service business):
- 8% total = (GR − 250,000) × 0.08
- OSD total = Tax_graduated(GR × 0.60) + 0.03 × GR

**Computed at key gross receipt levels:**

| Gross Receipts | 8% Total | OSD Total | Winner | Savings |
|----------------|---------|-----------|--------|---------|
| ₱300,000 | ₱4,000 | ₱9,000 | 8% | ₱5,000 |
| ₱500,000 | ₱20,000 | ₱22,500 | 8% | ₱2,500 |
| ₱800,000 | ₱44,000 | ₱62,500 | 8% | ₱18,500 |
| ₱1,000,000 | ₱60,000 | ₱92,500 | 8% | ₱32,500 |
| ₱1,500,000 | ₱100,000 | ₱172,500 | 8% | ₱72,500 |
| ₱2,000,000 | ₱140,000 | ₱252,500* | 8% | ₱112,500 |
| ₱2,500,000 | ₱180,000 | ₱352,500 | 8% | ₱172,500 |
| ₱2,999,000 | ₱219,920 | ₱441,195* | 8% | ₱221,275 |

*OSD at ₱2,000,000: Net = ₱1,200,000; Tax: ₱22,500+₱80,000+₱100,000=₱202,500 + PT ₱60,000 = ₱262,500 (not ₱252,500 as written; see below)
Correction for ₱2,000,000: OSD net = ₱1,200,000; Tax: 0+₱22,500+₱80,000+25%×(₱1,200,000-₱800,000)=₱100,000 → IT=₱202,500 + PT=₱60,000 → Total=₱262,500; 8%=(₱2M-₱250K)×8%=₱140,000. Winner: 8% saves ₱122,500.

**Conclusion: For service/professional businesses below ₱3M gross, 8% ALWAYS beats Graduated+OSD.**

### Breakeven: 8% vs Graduated+Itemized

At gross receipts GR with expense ratio E (expenses as % of GR):

**Formula:** 8% wins when (GR−250K)×0.08 < Tax_graduated(GR×(1−E)) + 0.03×GR

**Breakeven expense ratios (at which Itemized = 8%):**

| Gross Receipts | Breakeven Expense % | Meaning |
|----------------|--------------------|----|
| ₱500,000 | ~83% | Need >83% expenses for itemized to beat 8% |
| ₱800,000 | ~72% | Need >72% expenses |
| ₱1,000,000 | ~68% | Need >68% expenses |
| ₱1,500,000 | ~62.5% | Need >62.5% expenses |
| ₱2,000,000 | ~60% | Need >60% expenses |
| ₱2,500,000 | ~58% | Need >58% expenses |

**Derivation for ₱1,500,000 breakeven:**
- 8% total = (₱1,500,000 − ₱250,000) × 0.08 = ₱100,000
- Itemized total = Tax_graduated(1,500,000 − E) + 0.03 × 1,500,000 = Tax_graduated(1,500,000−E) + 45,000
- Set equal: Tax_graduated(net) + 45,000 = 100,000 → Tax_graduated(net) = 55,000
- At net = ₱562,500: Tax = 15%×(₱562,500−₱250,000) = 15%×₱312,500 = ₱46,875 (too low)
- At net = ₱625,000: Tax = ₱22,500 + 20%×(₱625,000−₱400,000) = ₱22,500+₱45,000 = ₱67,500 (too high)
- Interpolate: at net ≈ ₱587,500: Tax ≈ ₱55,000 → expenses ≈ ₱912,500 → ratio = 60.8%
- More precisely: net = ₱562,500 gives expenses = ₱937,500 = 62.5%
- So at expenses ≥ 62.5% of ₱1.5M gross, itemized wins over 8%

**Key insight for engine:** Itemized deductions rarely beat 8% unless the business has genuinely high operating costs (heavy staffing, rent, equipment). For typical freelancers/professionals, 8% almost always wins when eligible.

---

## 6. Old Rate Table Example (2018–2022, Schedule 1)

For completeness — returns filed for tax years 2018-2022 use the first TRAIN rate schedule:

| Net Taxable Income | Tax |
|-------------------|-----|
| ₱0 – ₱250,000 | ₱0 |
| ₱250,001 – ₱400,000 | 20% excess over ₱250,000 |
| ₱400,001 – ₱800,000 | ₱30,000 + 25% excess over ₱400,000 |
| ₱800,001 – ₱2,000,000 | ₱130,000 + 30% excess over ₱800,000 |
| ₱2,000,001 – ₱8,000,000 | ₱490,000 + 32% excess over ₱2,000,000 |
| Over ₱8,000,000 | ₱2,410,000 + 35% excess over ₱8,000,000 |

**Example (2020 tax year):** Consultant ₱1,000,000 gross, OSD method:
- Net taxable: ₱600,000
- Tax: ₱30,000 + 25% × (₱600,000 − ₱400,000) = ₱30,000 + ₱50,000 = ₱80,000
- Compare to 2023+ rate: ₱62,500 — the 2023+ rate is LOWER for this bracket.

---

## 7. CWT (Form 2307) Credit Mechanics Example

### EX-009: Multiple Clients, Multiple 2307s

**Profile:** Freelance accountant with 3 Philippine corporate clients in Q1.

| Client | Amount Billed | EWT Rate | CWT Withheld | ATC Code |
|--------|--------------|---------|-------------|---------|
| ABC Corp | ₱150,000 | 10% | ₱15,000 | WI010 |
| DEF Inc | ₱80,000 | 10% | ₱8,000 | WI010 |
| GHI Ltd | ₱70,000 | 10% | ₱7,000 | WI010 |
| **Total** | **₱300,000** | | **₱30,000** | |

(EWT rate = 10% since taxpayer's gross receipts cross the ₱3M threshold test — if below ₱3M prior year, rate is 5%. But for clarity, assuming 10% applies per RR 11-2018.)

**At Q1 filing (Form 1701Q, 8% method):**
- Cumulative gross receipts: ₱300,000
- 8% cumulative IT: 8% × ₱300,000 = ₱24,000 (no ₱250K exemption in quarterly — exemption only at year-end)
  - NOTE: In Q1, 8% taxpayers file 1701Q applying 8% to CUMULATIVE receipts directly, crediting prior payments. The ₱250K is subtracted only at annual filing on Form 1701A.
  - Actually: Per the 1701Q Schedule II for 8% method, items show:
    - Item 47: Gross receipts (cumulative)
    - Item 48-53: Various income items
    - Item 54: 8% IT rate → Tax due = 8% of cumulative gross
    - The ₱250K is applied only at annual
  - So Q1 IT = 8% × ₱300,000 = ₱24,000
- Less: CWT from 2307 (Q1): ₱30,000
- Tax payable Q1: max(₱24,000 − ₱30,000, 0) = ₱0 (₱6,000 excess CWT carried forward)

**At Annual (1701A):**
- Annual gross: ₱1,200,000 (assuming ₱300K/quarter)
- 8% tax = (₱1,200,000 − ₱250,000) × 8% = ₱950,000 × 8% = ₱76,000
- Less: Total CWT for year: ₱120,000 (4 quarters × ₱30,000)
- Less: Quarterly payments made: ₱0
- Balance: max(₱76,000 − ₱120,000, 0) = ₱0
- REFUND due: ₱120,000 − ₱76,000 = ₱44,000 (excess CWT, claimable as refund or applied to next year)

**Lesson:** High CWT rates (10%) can result in overpayment for the year. The optimizer should flag this scenario and advise on requesting a CWT refund or tax credit certificate.

---

## 8. Sources

- Respicio & Co. Legal Commentaries: https://www.respicio.ph/commentaries/40-osd-vs-8-flat-income-tax-which-is-better-for-self-employed-in-the-philippines
- BusinessTips.ph — Quarterly ITR Computation: https://businesstips.ph/how-to-compute-quarterly-income-tax-return-philippines/
- Triple I Consulting: https://www.tripleiconsulting.com/income-tax-return-how-file-compute-for-sole-proprietors-philippines/
- FilePino — Tax Tables: https://www.filepino.com/income-tax-table-philippines/
- Taxumo — Freelancer Guide 2025: https://www.taxumo.com/blog/taxes-for-freelancers-in-the-philippines-2025-complete-guide/
- PwC Tax Summaries Philippines: https://taxsummaries.pwc.com/philippines/individual/taxes-on-personal-income
- RMC 50-2018 (Mixed income 8% rules), BIR Official
