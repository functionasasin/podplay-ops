# Analysis: source-pricing-model

**Aspect**: source-pricing-model
**Wave**: 1 — Source Acquisition & Domain Mapping
**Date**: 2026-03-06
**Source Status**: DERIVED — `docs/Kim Lapus PodPlay MRP.xlsx` and `docs/PodPlay_MRP_Usage_Guide.pdf` not present in repo.
Analysis derived from: design document (via source-mrp-usage-guide analysis), training transcripts, config guide, hardware guide, frontier aspect descriptions.

---

## 1. Customer-Facing Pricing Tiers

### Tier Definitions

| Tier | Description | Venue Fee | Per-Court Fee |
|------|-------------|-----------|---------------|
| Pro | Display (65" TV) + kiosk (iPad) + replay camera (EmpireTech) per court, plus network rack | $5,000 | $2,500 |
| Autonomous | Pro + access control (Kisi reader + controller per door) + security cameras (UniFi G5) | $7,500 | $2,500 |
| Autonomous+ | Autonomous + NVR (UNVR/UNVR-Pro) with hard drives (WD Purple 8TB) | $7,500 + surveillance add-on | $2,500 |
| PBK | Pickleball Kingdom custom pricing — separate tier with custom venue/court fees | **Unknown — XLSX required** | **Unknown — XLSX required** |

### Venue Fee Formula

```
venue_fee = tier_venue_fee
court_fee_total = tier_court_fee × num_courts
subtotal_software = venue_fee + court_fee_total
```

**Note**: The "venue fee" and "per-court fee" are the customer-facing SOFTWARE/SERVICE pricing, not the hardware cost. Hardware cost is calculated separately via the BOM cost chain (see Section 3).

### PBK Tier (Pickleball Kingdom)

Referenced in frontier aspects as a custom pricing tier. Known details:
- Distinct from Pro/Autonomous/Autonomous+
- Has custom venue fee and court fee different from standard tiers
- Wizard intake must present PBK as a selectable tier option
- Exact dollar values: **unknown — requires XLSX or direct PBK contract reference**

### Autonomous+ Surveillance Add-On

The surveillance component of Autonomous+ is priced as an add-on above the $7,500 venue fee. Exact formula:
- Per-security-camera pricing: **unknown — requires XLSX**
- NVR/hard drive pass-through cost: **unknown — requires XLSX**
- Best assumption: surveillance hardware is passed through at landed_cost / (1 - margin)

---

## 2. Hardware Cost Chain

This is the cost calculation chain used in the MRP's Cost Analysis sheet, derived from the design document.

### Step-by-Step Chain

```
Step 1: Quantity
qty = qty_per_venue
    + (qty_per_court × num_courts)
    + (qty_per_door × num_doors)
    + (qty_per_camera × num_sec_cameras)

Step 2: Raw hardware cost
est_total_cost = qty × unit_cost

Step 3: Apply shipping
landed_cost = est_total_cost × (1 + shipping_rate)
            = est_total_cost × 1.10  [default]

Step 4: Apply margin (markup to customer price)
customer_price = landed_cost / (1 - margin)
               = landed_cost / 0.90  [default]
```

### Tax Application

Sales tax (default 10.25%) is applied on the CUSTOMER side at invoice time, not within the cost chain itself:

```
invoice_subtotal = customer_price_total
sales_tax = invoice_subtotal × tax_rate  [10.25% default]
invoice_total = invoice_subtotal + sales_tax
```

Tax is tracked separately from the margin calculation — the margin is computed on pre-tax revenue.

### Full P&L Impact

```
revenue = customer_price_total (pre-tax)
cogs = sum(est_total_cost) for all BOM items
gross_profit = revenue - cogs
gross_margin_pct = gross_profit / revenue
```

---

## 3. Default Settings Values

All configurable; stored in a `settings` table with the following defaults:

| Setting Key | Default Value | Type | Notes |
|-------------|--------------|------|-------|
| `sales_tax_rate` | 0.1025 (10.25%) | decimal | Applied to invoice total |
| `shipping_rate` | 0.10 (10%) | decimal | Multiplied onto hardware cost |
| `target_margin` | 0.10 (10%) | decimal | Used in customer_price formula |
| `labor_rate_per_hour` | 120.00 | USD | Applied to installation labor hours |
| `pro_venue_fee` | 5000.00 | USD | Venue fee for Pro tier |
| `pro_court_fee` | 2500.00 | USD | Per-court fee for Pro tier |
| `autonomous_venue_fee` | 7500.00 | USD | Venue fee for Autonomous/Autonomous+ |
| `autonomous_court_fee` | 2500.00 | USD | Per-court fee for Autonomous/Autonomous+ |
| `pbk_venue_fee` | **unknown** | USD | PBK custom venue fee |
| `pbk_court_fee` | **unknown** | USD | PBK custom per-court fee |
| `lodging_per_day` | 250.00 | USD | Default lodging expense estimate |
| `airfare_default` | 1800.00 | USD | Default airfare estimate |
| `hours_per_day` | 10 | integer | Installer working hours per day |

---

## 4. Labor & Travel Cost Model

Installation labor is tracked separately from hardware costs and feeds into the project P&L.

### Labor Cost

```
labor_cost = installer_hours × labor_rate_per_hour
           = installer_hours × $120  [default]
```

- `installer_hours`: actual hours logged per project
- Tracked per project, not per BOM line

### Travel Cost (Expense Tracking)

Travel costs are tracked as categorized expenses per project:

| Expense Category | Tracking Unit | Notes |
|-----------------|--------------|-------|
| `airfare` | $ amount | Default estimate: $1,800 |
| `lodging` | $ amount | Default: $250/night |
| `car` | $ amount | Rental car cost |
| `fuel` | $ amount | Gas/fuel |
| `taxi` | $ amount | Rideshare, taxi |
| `train` | $ amount | Rail travel |
| `parking` | $ amount | Parking fees |
| `meals` | $ amount | Per diem meals |
| `misc_hardware` | $ amount | Incidental hardware not in BOM |
| `outbound_shipping` | $ amount | Shipping cost to venue |
| `professional_services` | $ amount | Subcontractor / installer payments |
| `other` | $ amount | Catch-all |

### Payment Methods (for expense reimbursement)

| Code | Description |
|------|-------------|
| `podplay_card` | Company credit card (Ramp) |
| `ramp_reimburse` | Personal card, reimbursed via Ramp |

### Total Project Cost (for P&L)

```
total_project_cost = cogs + labor_cost + sum(all_expenses)
net_profit = revenue - total_project_cost
net_margin_pct = net_profit / revenue
```

---

## 5. Invoicing Structure

### Two-Installment Billing

PodPlay uses a two-installment billing model per project:

| Installment | Timing | Amount |
|-------------|--------|--------|
| Deposit (Invoice 1) | Upon contract signing | 50% of total invoice (assumed — XLSX required for exact split) |
| Final (Invoice 2) | Upon go-live / handoff | Remaining 50% |

**Note**: The exact deposit percentage is not confirmed from available sources. The 50/50 split is a reasonable assumption; the XLSX "INVOICING" sheet would have the actual values. This must be verified.

### Invoice Status Tracking

Each invoice has these status fields:
- `signed`: boolean — customer has signed SOW/contract
- `invoiced`: boolean — invoice sent to customer
- `paid`: boolean — payment received
- `paid_date`: date — when payment was received

### Invoice Amounts

```
hardware_subtotal = sum(customer_price) across all BOM items
tax_amount = hardware_subtotal × sales_tax_rate
invoice_total = hardware_subtotal + tax_amount

deposit_amount = invoice_total × deposit_pct  [0.50 assumed]
final_amount = invoice_total - deposit_amount
```

---

## 6. Financial Reporting Formulas

### P&L (Per Project)

```
revenue = hardware_subtotal (pre-tax customer price)
cogs = sum(est_total_cost) for all BOM items
gross_profit = revenue - cogs
gross_margin = gross_profit / revenue

total_expenses = labor_cost + sum(project_expenses)
net_profit = gross_profit - total_expenses
net_margin = net_profit / revenue
```

### HER (Hardware Efficiency Ratio)

From frontier aspect `model-team-opex`:
```
HER = hardware_revenue / team_hardware_spend
```

Where:
- `hardware_revenue` = sum of all hardware customer prices billed in period
- `team_hardware_spend` = team salaries + overhead allocated to hardware work in period

Team OpEx allocations (from frontier aspect descriptions):
- Niko: 50% direct (hardware/installs) / 50% indirect
- Chad: 20% indirect
- Rent: $27,600/year
- Indirect salaries: $147,000/year

**Exact HER formula from MRP**: unknown — requires XLSX or Usage Guide PDF.

### Monthly Revenue Pipeline

Tracks all projects in each revenue stage:
- `proposal`: SOW sent, not signed
- `signed`: Contract signed, deposit not yet invoiced
- `deposit_invoiced`: Deposit invoice sent
- `deposit_paid`: Deposit received
- `final_invoiced`: Final invoice sent
- `final_paid`: Project fully paid — closed

### Aging Receivables

Outstanding invoices by days overdue:
- 0–30 days
- 31–60 days
- 61–90 days
- 90+ days

---

## 7. BOM Unit Costs (Known Gap)

The MRP spreadsheet contains exact unit costs for all hardware items. These are NOT available from the current sources because the XLSX is not in the repo.

Hardware items requiring unit costs (from hardware catalog analysis):

### Network Rack Items
| Item | Model | Vendor | Unit Cost |
|------|-------|--------|-----------|
| PDU | TrippLite RS-1215-RA | Ingram | **unknown** |
| Gateway UDM-SE | UniFi UDM-SE | UniFi | **unknown** |
| Gateway UDM-Pro | UniFi UDM-Pro | UniFi | **unknown** |
| Gateway UDM-Pro-Max | UniFi UDM-Pro-Max | UniFi | **unknown** |
| Switch 24 PoE | USW-Pro-24-POE | UniFi | **unknown** |
| Switch 24 PoE (standard) | USW-24-POE | UniFi | **unknown** |
| Switch 48 PoE | USW-Pro-48-POE | UniFi | **unknown** |
| SFP DAC Cable | UACC-DAC-SFP10-0.5M | UniFi | **unknown** |
| Cat6 Patch 1' | Monoprice Cat6 1' | Amazon | **unknown** |
| Cat6 Patch 3' | Monoprice Cat6 3' | Amazon | **unknown** |
| Cat6 Patch 10' | Monoprice Cat6 10' | Amazon | **unknown** |
| Patch Panel 24-port | iwillink 24 w/ Couplers | Amazon | **unknown** |
| Blank Panel | UACC-Rack-Panel-Patch-Blank-24 | UniFi | **unknown** |
| PassThru Panel | Rapink 24 PassThru | Amazon | **unknown** |

### Replay System
| Item | Model | Vendor | Unit Cost |
|------|-------|--------|-----------|
| Mac Mini | Mac Mini 16GB 256GB | Apple Business | **unknown** |
| Rack Shelf | Pyle 19" 1U Vented | Amazon | **unknown** |
| SSD 1TB | Samsung T7 1TB | Amazon | **unknown** |
| SSD 2TB | Samsung T7 2TB | Amazon | **unknown** |
| SSD 4TB | Samsung T7 4TB | Amazon | **unknown** |
| Replay Camera White | EmpireTech IPC-T54IR-ZE White | EmpireTech | **unknown** |
| Replay Camera Black | EmpireTech IPC-T54IR-ZE Black | EmpireTech | **unknown** |
| Camera Junction Box White | EmpireTech PFA130-E White | EmpireTech | **unknown** |
| Camera Junction Box Black | EmpireTech PFA130-E Black | EmpireTech | **unknown** |
| Score Button | Flic Button | Flic | **unknown** |
| Signage | Aluminum Printed Sign 6x8 | Fast Signs | **unknown** |
| Hardware Kit | RC Fasteners | RC Fasteners | **unknown** |

### Displays (Per Court)
| Item | Model | Vendor | Unit Cost |
|------|-------|--------|-----------|
| Apple TV | Apple TV 4K + Ethernet | Apple Business | **unknown** |
| Apple TV Mount | HIDEit Mount | HIDEit | **unknown** |
| HDMI Cable | Amazon Basics 3ft | Amazon | **unknown** |
| 65" TV | (various) | Drop-shipped | **unknown** |
| iPad | iPad (model TBD) | Apple Business | **unknown** |
| iPad PoE Adapter | (model TBD) | (vendor TBD) | **unknown** |
| iPad Kiosk Case | (model TBD) | (vendor TBD) | **unknown** |

### Access Control (Autonomous tier)
| Item | Model | Vendor | Unit Cost |
|------|-------|--------|-----------|
| Kisi Controller Pro 2 | Kisi Controller Pro 2 | Kisi | **unknown** |
| Kisi Reader Pro 2 | Kisi Reader Pro 2 | Kisi | **unknown** |

### Surveillance (Autonomous+)
| Item | Model | Vendor | Unit Cost |
|------|-------|--------|-----------|
| NVR 4-bay | UniFi UNVR | UniFi | **unknown** |
| NVR 7-bay | UniFi UNVR-Pro | UniFi | **unknown** |
| Hard Drive | WD Purple 8TB | Amazon | **unknown** |
| Security Camera White | UniFi G5 Turret Ultra White | UniFi | **unknown** |
| Junction Box White | UACC-Camera-CJB-White | UniFi | **unknown** |
| Security Camera Black | UniFi G5 Turret Ultra Black | UniFi | **unknown** |
| Junction Box Black | UACC-Camera-CJB-Black | UniFi | **unknown** |
| Dome Camera | UniFi G5 Dome | UniFi | **unknown** |
| Dome Camera Black | UniFi G5 Dome Ultra | UniFi | **unknown** |

### Front Desk
| Item | Model | Vendor | Unit Cost |
|------|-------|--------|-----------|
| CC Terminal | BBPOS WisePOS E | Square | **unknown** |
| QR Scanner | 2D QR Barcode Scanner | Amazon | **unknown** |
| Webcam | Anker PowerConf C200 2K | Amazon | **unknown** |

### PingPod-Specific
| Item | Model | Vendor | Unit Cost |
|------|-------|--------|-----------|
| WiFi AP | UniFi U6-Plus | UniFi | **unknown** |

---

## 8. BOM Quantity Rules (Per Item)

These are the multiplier fields per BOM template item — quantities depend on project parameters:

| Multiplier Field | Meaning | Example Items |
|-----------------|---------|--------------|
| `qty_per_venue` | Appears once per installation | Mac Mini (1), UDM (1), Switch (1), PDU (1), UPS (1) |
| `qty_per_court` | Once per court | iPad (1), Apple TV (1), Replay Camera (1), Flic Buttons (2), HDMI Cable (1), PoE Adapter (1) |
| `qty_per_door` | Once per access-controlled door | Kisi Reader (1), electric strike or mag lock (1) |
| `qty_per_camera` | Once per security camera | Junction box (1) |

**Switch sizing** is a special case — depends on court count, not a simple per-venue multiplier:
- 1–10 courts: USW-Pro-24-POE (qty 1)
- 11–20 courts: USW-Pro-24-POE (qty 2) or USW-Pro-48-POE (qty 1)
- 21–30 courts: USW-Pro-48-POE (qty 1) — possibly 2 switches
- Exact breakpoints: **unknown — requires XLSX**

**SSD sizing** depends on court count:
- Small club (1–4 courts): Samsung T7 1TB
- Medium club (5–12 courts): Samsung T7 2TB
- Large club (13+ courts): Samsung T7 4TB
- Exact breakpoints: **unknown — requires XLSX**

**NVR sizing** depends on security camera count:
- ≤4 cameras: UNVR (4-bay)
- >4 cameras: UNVR-Pro (7-bay)
- Exact breakpoints: **unknown — requires XLSX**

---

## 9. Pricing Chain: Concrete Example (Estimated)

Using a hypothetical 6-court Pro installation with assumed unit costs for illustration:

```
Tier: Pro
Courts: 6
Doors: 0
Security Cameras: 0

Example BOM items (costs estimated for illustration only — NOT from XLSX):
- Mac Mini: qty=1, unit_cost=$800 → subtotal=$800
- Apple TV: qty=6, unit_cost=$200 → subtotal=$1,200
- iPad: qty=6, unit_cost=$400 → subtotal=$2,400
- Replay Camera: qty=6, unit_cost=$300 → subtotal=$1,800
...
- est_total_cost = sum of all subtotals (hypothetical: $15,000)

landed_cost = $15,000 × 1.10 = $16,500
customer_price = $16,500 / 0.90 = $18,333

Gross margin = ($18,333 - $15,000) / $18,333 = 18.2%
(Note: landed_cost margin = 10%, but gross margin on unit cost is higher)

Service fee: $5,000 venue + (6 × $2,500) = $20,000
invoice_subtotal = $18,333 (hardware) + $20,000 (service) = $38,333
tax = $38,333 × 0.1025 = $3,929
invoice_total = $42,262
deposit = $21,131 (50%)
final = $21,131 (50%)
```

**All dollar values above are illustrative estimates. Actual unit costs require the XLSX.**

---

## 10. Known Gaps Summary

| Gap | Impact | Resolution |
|----|--------|------------|
| All hardware unit costs | Cannot spec seed-data.md completely | Requires XLSX or vendor quotes |
| PBK tier exact pricing | Cannot spec PBK intake form default values | Requires XLSX or Kim Lapus input |
| Deposit percentage (50/50 assumed) | Invoice spec may be wrong | Requires XLSX INVOICING sheet |
| Exact HER formula | Cannot spec financial reporting dashboard | Requires XLSX FINANCIALS sheet |
| Switch/SSD/NVR sizing breakpoints | BOM generation logic incomplete | Requires XLSX BOM template sheet |
| Autonomous+ surveillance add-on pricing | Cannot spec Autonomous+ cost analysis | Requires XLSX |
| Exact sheet names (all 24) | Cannot confirm all workflows | Requires XLSX |

---

## 11. Pricing-Related Enum Values

### Service Tier Enum

```sql
CREATE TYPE service_tier AS ENUM (
  'pro',
  'autonomous',
  'autonomous_plus',
  'pbk'
);
```

### Expense Category Enum

```sql
CREATE TYPE expense_category AS ENUM (
  'airfare',
  'car',
  'fuel',
  'lodging',
  'meals',
  'misc_hardware',
  'outbound_shipping',
  'professional_services',
  'taxi',
  'train',
  'parking',
  'other'
);
```

### Payment Method Enum

```sql
CREATE TYPE payment_method AS ENUM (
  'podplay_card',
  'ramp_reimburse'
);
```

### Invoice Status (Derived)

```sql
CREATE TYPE invoice_status AS ENUM (
  'not_sent',
  'sent',
  'paid'
);
```

### Project Revenue Stage Enum

```sql
CREATE TYPE revenue_stage AS ENUM (
  'proposal',
  'signed',
  'deposit_invoiced',
  'deposit_paid',
  'final_invoiced',
  'final_paid'
);
```

---

## 12. Pricing Workflow (Customer-Facing)

Sequence within the MRP:

1. **Intake**: Capture tier, court count, door count, security camera count
2. **BOM Generation**: Auto-populate BOM items based on tier template × quantities
3. **Cost Analysis**: Calculate est_total_cost, landed_cost, customer_price per item
4. **SOW Generation**: Combine hardware pricing + service fees into statement of work
5. **Invoice 1 (Deposit)**: Send upon contract signature
6. **Invoice 2 (Final)**: Send upon go-live confirmation
7. **P&L Close**: Record all expenses, calculate net profit per project

---

## Summary: What Is Confirmed vs. Unknown

### Confirmed
- Tier structure: Pro ($5K+$2.5K/court), Autonomous ($7.5K+$2.5K/court)
- Full cost chain formula (unit → total → shipping → margin → customer price → tax)
- All default settings values (tax 10.25%, shipping 10%, margin 10%, labor $120/hr)
- All expense categories (12 categories) and payment methods (2)
- Travel defaults (lodging $250/day, airfare $1,800, 10 hrs/day)
- Two-installment invoicing (deposit + final)
- Invoice status tracking (signed, invoiced, paid)
- Revenue pipeline stages (6 stages)
- HER concept (hardware revenue / team hardware spend)
- Team OpEx allocations (Niko 50/50, Chad 20% indirect, rent $27.6K/yr, indirect $147K/yr)

### Unknown (requires XLSX)
- All hardware unit costs
- PBK tier pricing
- Exact deposit percentage
- Exact HER formula
- Switch/SSD/NVR sizing breakpoints by court count
- Autonomous+ surveillance add-on pricing
- All 24 MRP sheet names and column structures
