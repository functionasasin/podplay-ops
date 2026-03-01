# BIR RR 16-2023 — E-Marketplace & DFSP Withholding Tax

**Source:** Research compiled from BIR official PDF (bir-cdn.bir.gov.ph), PwC Philippines TaxWise Or Otherwise (February 2024), BDB Law article, BDO Global Tax, Forvis Mazars PH (RMC 8-2024 alert), Xendit docs, PayMongo Help Center, TripleI Consulting, Global Compliance News (Baker McKenzie), KPMG Philippines.
**Compiled:** 2026-02-28
**Coverage:** BIR Revenue Regulations No. 16-2023 (full provisions) and RMC No. 8-2024 (implementation procedures)

---

## 1. Overview

**Revenue Regulations No. 16-2023** was issued on **December 27, 2023** and became **effective January 11, 2024** (15 days after publication). It amends RR No. 2-98 (the consolidated implementing regulations for withholding tax) to add a new creditable withholding tax on remittances made by:
- **Electronic marketplace (e-marketplace) operators**, and
- **Digital Financial Services Providers (DFSPs)**

to their sellers/merchants for goods and services sold or paid through the operator's platform.

**RMC No. 8-2024** (issued January 15, 2024) provided the implementation timeline and procedures. The 90-day grace period for platform compliance ended **April 14, 2024**.

---

## 2. Withholding Rate and Base

### 2.1 Rate and Formula

**Statutory language:** "1% withholding tax on one-half (1/2) of the gross remittances"

```
withholding_amount = 0.01 × (gross_remittance × 0.50)
                   = gross_remittance × 0.005
```

**Effective rate:** 0.5% of gross remittances (NOT 1% — the 1% applies only to the one-half base)

**Example:**
- Freelancer receives ₱1,000,000 via Payoneer in a year (exceeding threshold)
- Taxable base for withholding: ₱1,000,000 × 0.50 = ₱500,000
- Amount withheld: ₱500,000 × 0.01 = ₱5,000
- Effective withholding rate: ₱5,000 / ₱1,000,000 = 0.5%

### 2.2 Gross Remittance Defined

"Gross remittance" = total amount received by an e-marketplace operator or DFSP from a buyer for the sales paid to the seller/merchant through the operator's platform or facility.

**Excluded from gross remittance (do NOT withhold on these):**
1. Sales returns and discounts
2. Shipping fees
3. Value-added tax (VAT)
4. Platform usage fees / service fees charged by the platform to the seller

**Practical note for Upwork/Fiverr freelancers:**
- Upwork service fee (20%/10%/5% sliding scale) is deducted BEFORE remittance to Payoneer
- The gross remittance subject to withholding is the amount actually remitted (net of Upwork's service fee), NOT the gross contract amount
- Example: ₱100,000 contract → Upwork deducts 20% fee = ₱80,000 remitted to Payoneer → withholding base = ₱80,000 × 0.5 = ₱40,000 → withheld = ₱400

---

## 3. Withholding Agents (Who Deducts and Remits)

### 3.1 E-Marketplace Operators
Platforms that facilitate online transactions between buyers and sellers:
- Shopee, Lazada, TikTok Shop (physical goods)
- Upwork, Fiverr, Freelancer.com (services)
- Any platform that collects payment from buyer and remits to seller

### 3.2 Digital Financial Services Providers (DFSPs)
Financial technology providers offering payment and money transmission services:
- **Payoneer** — qualifies as DFSP (payment and money transmission)
- **PayPal** — qualifies as DFSP (payment and money transmission)
- **GCash** — qualifies as DFSP (e-wallet, payment services)
- **Maya (PayMaya)** — qualifies as DFSP (e-wallet, payment services)
- **PayMongo** — qualifies as DFSP (payment gateway)
- **Xendit** — qualifies as DFSP (payment gateway)
- **Banks** offering digital payment rails — may qualify

### 3.3 Multi-Channel Payment Rule (Critical for Freelancers)

When payment passes through multiple channels (e.g., Upwork → Payoneer → local bank account), the **last facility that has control of the payment before fully remitting to the seller/merchant** is responsible for withholding.

**For the typical Philippine freelancer workflow:**
- Contract → Upwork platform → Payoneer account (Payoneer receives funds) → freelancer's Philippine bank (Payoneer remits)
- **Payoneer is the last facility** — Payoneer is the withholding agent
- Upwork does NOT withhold (it is upstream of Payoneer)
- The freelancer's bank does NOT withhold (it receives from Payoneer, which already withheld)

**If the freelancer receives payment directly:**
- Upwork → freelancer's BDO/BPI account (via Payoneer Philippines or Swift)
- In this case, Payoneer or the bank's payment gateway is the last facility
- Practically, Payoneer withholding applies at their platform level

---

## 4. Threshold: ₱500,000 Annual Gross Remittances

### 4.1 When Withholding DOES NOT Apply

The withholding obligation does NOT apply if:
1. The seller's **combined** annual total gross remittances from ALL e-marketplaces and DFSPs did not exceed **₱500,000** in the prior taxable year, AND
2. The cumulative gross remittances in the current taxable year have not exceeded **₱500,000**, AND
3. The seller submits a valid **Sworn Declaration (SD)** attesting to items 1 and 2

**Critical: The ₱500,000 threshold is the COMBINED total across ALL platforms and DFSPs, not per-platform.** A seller using both Payoneer (₱300K) and GCash (₱250K) has combined ₱550K and cannot claim the exemption even if neither platform alone exceeded ₱500K.

### 4.2 Sworn Declaration (SD)

**Purpose:** Attest that the seller's combined gross remittances from all e-marketplace/DFSP platforms will not exceed ₱500,000 for the current year AND did not exceed ₱500,000 in the prior year.

**Form:** BIR-received Sworn Declaration (Annex "A" of RMC 8-2024). Seller must have the SD received/stamped by the BIR (not just signed by the seller).

**Submission timeline:**
- New seller (joining platform for first time): upon application/registration on the platform
- Existing sellers (continuing): on or before **January 20** of each taxable year
- If threshold exceeded mid-year: seller must **immediately** submit an SD acknowledging the threshold was exceeded

**Effect of NOT submitting SD:**
- Platform must withhold the 1% on ½ gross remittances regardless of the seller's actual income level
- This applies even if the seller's annual gross remittances are below ₱500K (failure to submit SD = automatic withholding)

### 4.3 Three Triggers for Withholding Obligation

Withholding begins when ANY of these three conditions is met:
1. **SD received indicating excess:** Platform receives a BIR-received SD from the seller showing combined gross remittances exceeded ₱500,000
2. **No SD submitted:** Seller fails to submit SD by January 20 (or upon registration for new sellers)
3. **Platform monitoring:** Platform independently determines that its own total gross remittances to the seller have exceeded ₱500,000 during the year

**When triggered mid-year (condition 3):** Withholding applies only to remittances FROM THE DATE THE THRESHOLD IS EXCEEDED — not retroactively to January 1.

---

## 5. ATC Codes and BIR Forms

### 5.1 ATC Codes (Alphanumeric Tax Code)
| Code | Applies To | Rate Base | Rate |
|------|-----------|-----------|------|
| **WI760** | Individual sellers/merchants | ½ of gross remittance | 1% |
| **WC760** | Corporate sellers/merchants | ½ of gross remittance | 1% |

**Confirmed by:** PwC Philippines TaxWise Or Otherwise (February 2024), BDB Law, official BIR ATC schedule per RMO 18-2025

### 5.2 Forms Used by Platforms (Withholding Agents)
| Form | Purpose | When Filed |
|------|---------|-----------|
| **BIR Form 0619-E** | Monthly remittance of expanded withholding tax | First two months of each quarter (e.g., January, February; April, May; etc.) |
| **BIR Form 1601-EQ** | Quarterly EWT return (includes ATC WI760/WC760) | Last month of each quarter (March, June, September, December) |
| **BIR Form 2307** | Certificate of Creditable Tax Withheld at Source | Issued to seller within 20 days after end of each quarter |

### 5.3 BIR Form 2307 Fields for E-Marketplace Withholding
| Field | Content |
|-------|---------|
| Part I — Payee | Seller's/merchant's TIN, name, address |
| Part II — Payor | Platform's TIN, name, address (Payoneer Philippines, GCash/GXI, etc.) |
| ATC | WI760 (if seller is individual) |
| Income Payment | ½ of total gross remittance for the quarter |
| Tax Withheld | 1% of Income Payment (= 0.5% of gross remittance) |
| Period covered | The quarter (Q1/Q2/Q3/Q4) |

---

## 6. How Sellers/Freelancers Use Form 2307 (CWT Credit)

### 6.1 Annual Income Tax Return (Form 1701 or 1701A)
- The seller collects all BIR Form 2307 certificates received from all platforms during the year
- On Form 1701 (Part V — Tax Credits): Item 58A "Prior year's excess credits" + Item 58B "Tax payments for the first three quarters" + Item 58C "Creditable tax withheld per BIR Form 2307 for this quarter"
- On Form 1701A (Part IV-A or IV-B, Tax Credits section): Item 61 "Creditable tax withheld per BIR Form 2307"
- The total of all 2307 amounts (from clients AND from platforms) is entered here and credited against income tax due
- If total CWT > income tax due: excess CWT becomes refundable or may be applied to next year

### 6.2 Quarterly Income Tax Return (Form 1701Q)
- CWT from 2307s received during the quarter is entered in Schedule III of Form 1701Q
- Item 58C: "Creditable tax withheld per BIR Form 2307 for this quarter"
- This reduces the quarterly balance payable
- Cumulative CWT credits carry forward across quarters

### 6.3 Interaction with Regime Optimization
The 1% (effective 0.5%) withholding from e-marketplace/DFSP platforms:
- Does NOT change the regime (Path A/B/C) comparison
- Does NOT change the income tax computation
- DOES reduce the amount of income tax owed at the time of filing
- A freelancer with large CWT credits from platforms may actually RECEIVE A REFUND or have zero balance due even if their computed income tax is significant

### 6.4 Net Tax Cash Flow Example
**Input:** Freelancer grosses ₱1,500,000 from Upwork (via Payoneer), no expenses (8% option)

**Computation:**
- Income tax under 8%: (₱1,500,000 − ₱250,000) × 0.08 = ₱100,000
- CWT from Payoneer 2307 (WI760): ₱1,500,000 × 0.005 = ₱7,500
- Balance payable at filing: ₱100,000 − ₱7,500 = **₱92,500**

**Note:** The ₱7,500 withheld was already deducted from freelancer's Payoneer payouts during the year. Freelancer received ₱1,492,500 net from Payoneer and owes ₱92,500 more at filing.

---

## 7. Obligations of Sellers/Merchants

1. **BIR Registration:** Must be registered with BIR; must provide BIR Certificate of Registration (Form 2303) to platform before using it. Platforms CANNOT allow unregistered sellers.
2. **Sworn Declaration:** Submit BIR-received SD by January 20 each year (if claiming exemption from withholding); or immediately when threshold is exceeded.
3. **Collect 2307s:** Collect Form 2307 from each platform quarterly; file with annual ITR as attachment.
4. **Record-keeping:** Keep 2307s and remittance records for 5 years (per EOPT books-of-accounts retention rule).

---

## 8. Seller Registration Requirements per RR 16-2023

Platforms (e-marketplaces and DFSPs) are PROHIBITED from allowing unregistered sellers to use their platform. Before a seller can receive payments via these platforms, they must:
1. Provide their BIR Certificate of Registration (BIR Form 2303)
2. Provide their 13-digit TIN
3. Submit Sworn Declaration (if claiming exemption) OR be subject to withholding

This effectively makes BIR registration mandatory for anyone using Payoneer, GCash, Maya, Shopee, Lazada, Upwork, Fiverr, etc. as their payment collection method.

---

## 9. Penalties for Non-Compliance

| Violation | Penalty |
|-----------|---------|
| E-marketplace/DFSP fails to withhold | 25% surcharge + 12%/annum interest (LARGE/MEDIUM) OR 10% surcharge + 6%/annum interest (MICRO/SMALL) + compromise penalties |
| Seller fails to register with BIR (allows platform use without 2303) | BIR enforcement action; platform may be penalized for allowing access |
| Seller submits false Sworn Declaration | Criminal tax fraud provisions apply |

---

## 10. Implementation Timeline

| Date | Event |
|------|-------|
| December 27, 2023 | RR 16-2023 issued |
| January 11, 2024 | RR 16-2023 effective |
| January 15, 2024 | RMC 8-2024 issued (implementation procedures) |
| April 14, 2024 | End of 90-day grace period; full compliance required |
| Ongoing | Platforms must collect BIR 2303s from ALL sellers; withhold on qualifying transactions |
