# Business Logic: Cost Analysis

**Aspect**: logic-cost-analysis
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: COST ANALYSIS sheet (per-project), INVOICING sheet, FINANCIALS sheet
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `project_bom_items`, `invoices`, `expenses`, `projects`, `settings`, `monthly_opex_snapshots`
**Pricing Source**: `analysis/source-pricing-model.md`

---

## Overview

Cost analysis is the calculation layer that converts raw BOM quantities into customer-facing
invoice amounts, and measures project profitability. It runs across four stages:

1. **BOM cost chain** — per-line-item hardware cost computation (part of BOM generation, Stage 2)
2. **Invoice computation** — service fee + hardware total + tax → deposit + final amounts (Stage 4)
3. **Project P&L** — revenue − COGS − labor − expenses = net profit (Stage 4 financial close)
4. **HER (Hardware Efficiency Ratio)** — hardware revenue vs team hardware spend (global dashboard)

All calculations are client-side TypeScript. No Postgres functions perform cost logic;
Postgres `GENERATED ALWAYS` columns handle only the three BOM cost chain formulas
(`est_total_cost`, `landed_cost`, `customer_price`) which are stored for query performance.

---

## 1. BOM Cost Chain

### Formula Chain (per line item)

Every row in `project_bom_items` computes four values from two inputs (`qty` and `unit_cost`)
plus two settings (`shipping_rate`, `margin`):

```
Step 1: Raw hardware cost
  est_total_cost = qty × unit_cost

Step 2: Add shipping
  landed_cost = est_total_cost × (1 + shipping_rate)
              = qty × unit_cost × (1 + shipping_rate)

Step 3: Apply margin markup to arrive at customer price
  customer_price = landed_cost / (1 − margin)
                 = (qty × unit_cost × (1 + shipping_rate)) / (1 − margin)
```

### Default Rate Values (from `settings` table)

| Setting key | Default | Description |
|-------------|---------|-------------|
| `shipping_rate` | `0.10` (10%) | Multiplied onto raw hardware cost to account for freight |
| `target_margin` | `0.10` (10%) | Customer markup over landed cost |
| `sales_tax_rate` | `0.1025` (10.25%) | Applied at invoice time, NOT in BOM cost chain |

**Sales tax is NOT part of the BOM cost chain.** It is applied only at invoice computation
(Section 3). The margin is calculated on pre-tax revenue.

### Postgres GENERATED ALWAYS Columns

The three computed columns in `project_bom_items` are defined as:

```sql
est_total_cost NUMERIC(10, 2) GENERATED ALWAYS AS (
  CASE WHEN unit_cost IS NOT NULL THEN qty * unit_cost ELSE NULL END
) STORED,

landed_cost NUMERIC(10, 2) GENERATED ALWAYS AS (
  CASE WHEN unit_cost IS NOT NULL THEN
    qty * unit_cost * (1 + COALESCE(shipping_rate, 0.10))
  ELSE NULL END
) STORED,

customer_price NUMERIC(10, 2) GENERATED ALWAYS AS (
  CASE WHEN unit_cost IS NOT NULL AND margin IS NOT NULL AND margin < 1.0 THEN
    (qty * unit_cost * (1 + COALESCE(shipping_rate, 0.10))) / (1 - margin)
  ELSE NULL END
) STORED,
```

The client writes only `qty`, `unit_cost`, `shipping_rate`, and `margin`. The three cost values
recompute automatically whenever those inputs change.

**NULL behavior**: If `unit_cost IS NULL`, all three computed columns return NULL.
The BOM review UI shows "—" with a yellow flag icon: "Unit cost unknown — enter manually."

### Concrete Examples

**Mac Mini (1 unit, default rates)**:
```
unit_cost      = $700.00
qty            = 1
shipping_rate  = 0.10
margin         = 0.10

est_total_cost = 1 × $700.00             = $700.00
landed_cost    = $700.00 × 1.10          = $770.00
customer_price = $770.00 / 0.90          = $855.56
```

**Apple TV 4K (6-court project)**:
```
unit_cost      = $180.00
qty            = 6
shipping_rate  = 0.10
margin         = 0.10

est_total_cost = 6 × $180.00             = $1,080.00
landed_cost    = $1,080.00 × 1.10        = $1,188.00
customer_price = $1,188.00 / 0.90        = $1,320.00
```

**Kisi Reader Pro 2 (4 doors, Autonomous tier)**:
```
unit_cost      = $150.00
qty            = 4
shipping_rate  = 0.10
margin         = 0.10

est_total_cost = 4 × $150.00             = $600.00
landed_cost    = $600.00 × 1.10          = $660.00
customer_price = $660.00 / 0.90          = $733.33
```

### Per-Item Gross Margin

The gross margin percentage on any single item using the default rates:
```
gross_margin_pct per item = (customer_price - est_total_cost) / customer_price
                          = ($855.56 - $700.00) / $855.56
                          = 18.2%

Note: although the target_margin setting is 10%, the actual gross margin is higher
because margin is applied over landed_cost (which already includes 10% shipping),
not over unit_cost. The blended effect:

margin_effective = 1 - (1 / (1.10 / 0.90))
                 = 1 - (0.90 / 1.10)
                 = 1 - 0.818
                 = 18.2%

This is the expected and correct behavior. The setting "target_margin = 10%" means
"markup landed cost by 10% to get customer price", not "achieve 10% gross margin
on unit cost."
```

### BOM Aggregate Totals

These are computed client-side from the full list of `project_bom_items` rows:

```typescript
interface BomTotals {
  total_qty_lines: number;        // number of line items
  total_est_cost: number;         // sum of est_total_cost (COGS)
  total_landed_cost: number;      // sum of landed_cost
  total_customer_price: number;   // sum of customer_price (hardware revenue, pre-tax)
  gross_margin_pct: number;       // (total_customer_price - total_est_cost) / total_customer_price
}

function computeBomTotals(items: ProjectBomItem[]): BomTotals {
  let total_est_cost = 0;
  let total_landed_cost = 0;
  let total_customer_price = 0;

  for (const item of items) {
    total_est_cost       += item.est_total_cost    ?? 0;
    total_landed_cost    += item.landed_cost        ?? 0;
    total_customer_price += item.customer_price     ?? 0;
  }

  const gross_margin_pct =
    total_customer_price > 0
      ? (total_customer_price - total_est_cost) / total_customer_price
      : 0;

  return {
    total_qty_lines: items.length,
    total_est_cost,
    total_landed_cost,
    total_customer_price,
    gross_margin_pct,
  };
}
```

---

## 2. Service Fee Calculation

The service fee is separate from hardware cost. It represents PodPlay's software/service
subscription charge per venue. It is computed from project parameters using settings values.

### Service Fee Formula

```typescript
function computeServiceFee(
  tier: ServiceTier,
  courtCount: number,
  settings: Settings
): number {
  switch (tier) {
    case 'pro':
      return settings.pro_venue_fee + courtCount * settings.pro_court_fee;
    // $5,000 + (courts × $2,500)
    // 6-court example: $5,000 + $15,000 = $20,000

    case 'autonomous':
    case 'autonomous_plus':
      return settings.autonomous_venue_fee + courtCount * settings.autonomous_court_fee;
    // $7,500 + (courts × $2,500)
    // 6-court example: $7,500 + $15,000 = $22,500

    case 'pbk':
      return settings.pbk_venue_fee + courtCount * settings.pbk_court_fee;
    // Custom PBK pricing; default $0 in settings until confirmed from XLSX
  }
}
```

### Settings Tier Fee Values

| Setting key | Default value | Notes |
|-------------|---------------|-------|
| `pro_venue_fee` | `5000.00` | Fixed venue setup fee for Pro tier |
| `pro_court_fee` | `2500.00` | Per-court service fee for Pro tier |
| `autonomous_venue_fee` | `7500.00` | Fixed venue setup fee for Autonomous/Autonomous+ |
| `autonomous_court_fee` | `2500.00` | Per-court service fee for Autonomous/Autonomous+ |
| `pbk_venue_fee` | `0.00` | PBK custom — requires XLSX for actual value |
| `pbk_court_fee` | `0.00` | PBK custom — requires XLSX for actual value |

**Note**: Autonomous and Autonomous+ share the same venue/court fee structure.
The Autonomous+ tier adds hardware (NVR, hard drives) but does NOT add a separate service
line item — all surveillance hardware passes through the standard BOM cost chain.

### Service Fee Concrete Examples

| Tier | Courts | Venue fee | Court fee | Service fee |
|------|--------|-----------|-----------|-------------|
| Pro | 4 | $5,000 | 4 × $2,500 = $10,000 | **$15,000** |
| Pro | 6 | $5,000 | 6 × $2,500 = $15,000 | **$20,000** |
| Pro | 12 | $5,000 | 12 × $2,500 = $30,000 | **$35,000** |
| Autonomous | 4 | $7,500 | 4 × $2,500 = $10,000 | **$17,500** |
| Autonomous | 6 | $7,500 | 6 × $2,500 = $15,000 | **$22,500** |
| Autonomous+ | 6 | $7,500 | 6 × $2,500 = $15,000 | **$22,500** |

---

## 3. Invoice Computation

Each project has exactly two invoices: `deposit` and `final`. Both rows are created
atomically in the `invoices` table when the project is created (Stage 1 submission),
with `status = 'not_sent'` and amounts NULL until the billing wizard step populates them.

### Invoice Amount Formula

```typescript
interface InvoiceAmounts {
  hardware_subtotal: number;   // sum of customer_price across all BOM items
  service_fee: number;         // tier venue fee + (courts × tier court fee)
  subtotal: number;            // hardware_subtotal + service_fee
  tax_rate: number;            // from settings.sales_tax_rate (0.1025 default)
  tax_amount: number;          // subtotal × tax_rate
  total_amount: number;        // subtotal + tax_amount = subtotal × (1 + tax_rate)
  deposit_pct: number;         // from settings.deposit_pct (0.50 default)
  deposit_amount: number;      // total_amount × deposit_pct
  final_amount: number;        // total_amount − deposit_amount
}

function computeInvoiceAmounts(
  bomItems: ProjectBomItem[],
  project: Project,
  settings: Settings
): InvoiceAmounts {
  const hardware_subtotal = bomItems.reduce(
    (sum, item) => sum + (item.customer_price ?? 0), 0
  );

  const service_fee = computeServiceFee(project.tier, project.court_count, settings);

  const subtotal = hardware_subtotal + service_fee;

  const tax_rate = settings.sales_tax_rate;          // 0.1025
  const tax_amount = subtotal * tax_rate;
  const total_amount = subtotal * (1 + tax_rate);

  const deposit_pct = settings.deposit_pct;           // 0.50
  const deposit_amount = total_amount * deposit_pct;
  const final_amount = total_amount - deposit_amount;

  return {
    hardware_subtotal,
    service_fee,
    subtotal,
    tax_rate,
    tax_amount,
    total_amount,
    deposit_pct,
    deposit_amount,
    final_amount,
  };
}
```

### Postgres GENERATED ALWAYS Columns in `invoices`

The `invoices` table stores `hardware_subtotal` and `service_fee` as writable columns;
`subtotal`, `tax_amount`, and `total_amount` are GENERATED ALWAYS:

```sql
subtotal  GENERATED ALWAYS AS (
  COALESCE(hardware_subtotal, 0) + COALESCE(service_fee, 0)
) STORED,

tax_amount  GENERATED ALWAYS AS (
  (COALESCE(hardware_subtotal, 0) + COALESCE(service_fee, 0))
  * COALESCE(tax_rate, 0.1025)
) STORED,

total_amount  GENERATED ALWAYS AS (
  (COALESCE(hardware_subtotal, 0) + COALESCE(service_fee, 0))
  * (1 + COALESCE(tax_rate, 0.1025))
) STORED,
```

The `deposit_amount` and `final_amount` are NOT stored columns — they are computed at
read time by the service layer using `total_amount × deposit_pct` and
`total_amount − deposit_amount`.

**Why**: `deposit_pct` can change between invoice creation and sending. Storing amounts
as derived values avoids stale data if `deposit_pct` is edited before the deposit is sent.
Once `status = 'sent'`, the operator should not change amounts; the UI prevents edits
after sending (but does not enforce this in the database).

### Invoice Row Creation

Two `invoices` rows are inserted immediately after project creation (inside the same
atomic `createProject` transaction chain):

```typescript
// src/services/invoices.ts

export async function createProjectInvoices(
  projectId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('invoices').insert([
    {
      project_id: projectId,
      invoice_type: 'deposit',
      status: 'not_sent',
      // hardware_subtotal, service_fee, tax_rate, deposit_pct all NULL at creation
      // Populated during Stage 4 billing step
    },
    {
      project_id: projectId,
      invoice_type: 'final',
      status: 'not_sent',
    },
  ]);
  return { error: error?.message ?? null };
}
```

### Invoice Population (Stage 4)

When the ops person reaches Stage 4 (Financial Close), the billing UI computes all amounts
from current BOM data and writes them to the invoice rows:

```typescript
export async function populateInvoiceAmounts(
  projectId: string
): Promise<{ error: string | null }> {
  // Load BOM items
  const { data: bomItems } = await supabase
    .from('project_bom_items')
    .select('customer_price')
    .eq('project_id', projectId);

  // Load project + settings
  const { data: project } = await supabase
    .from('projects')
    .select('tier, court_count')
    .eq('id', projectId)
    .single();

  const { data: settingsRows } = await supabase
    .from('settings')
    .select('key, value');
  const settings = buildSettingsMap(settingsRows ?? []);

  const amounts = computeInvoiceAmounts(bomItems ?? [], project!, settings);

  // Write deposit invoice
  await supabase
    .from('invoices')
    .update({
      hardware_subtotal: amounts.hardware_subtotal,
      service_fee: amounts.service_fee,
      tax_rate: amounts.tax_rate,
      deposit_pct: amounts.deposit_pct,
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'deposit');

  // Write final invoice
  // Final invoice carries the remainder: total_amount - deposit_amount
  // Stored as its own set of amounts (same hardware+service subtotal, but pct = 1 - deposit_pct)
  await supabase
    .from('invoices')
    .update({
      hardware_subtotal: amounts.hardware_subtotal,
      service_fee: amounts.service_fee,
      tax_rate: amounts.tax_rate,
      deposit_pct: 1 - amounts.deposit_pct,   // 0.50 → final invoice is also 50%
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'final');

  return { error: null };
}
```

**Design note**: Both invoices store the same `hardware_subtotal` and `service_fee`.
The `deposit_pct` column controls what fraction of `total_amount` this invoice covers.
The deposit invoice has `deposit_pct = 0.50`; the final invoice has `deposit_pct = 0.50`
(also 50%, equaling the remaining balance). If the split changes to 30/70, the deposit
invoice gets `deposit_pct = 0.30` and the final gets `deposit_pct = 0.70`.

### Invoice Concrete Example: 6-Court Autonomous+

```
BOM items (estimated from seed-data.md prices):
  hardware_subtotal = $19,770  (sum of all customer_price values)

Service fee:
  service_fee = $7,500 + (6 × $2,500) = $22,500

Subtotal:
  subtotal = $19,770 + $22,500 = $42,270

Tax (10.25%):
  tax_amount = $42,270 × 0.1025 = $4,332.68
  total_amount = $42,270 + $4,332.68 = $46,602.68

Deposit (50%):
  deposit_amount = $46,602.68 × 0.50 = $23,301.34

Final (50%):
  final_amount = $46,602.68 − $23,301.34 = $23,301.34
```

### Revenue Stage Progression

The `revenue_stage` on the `projects` table advances in lock-step with invoice status:

| Revenue stage | Trigger condition | Who triggers |
|---------------|-------------------|--------------|
| `proposal` | Default at project creation | — |
| `signed` | `projects.signed_date` is set | Ops sets signed_date in Stage 1 review |
| `deposit_invoiced` | Deposit invoice `status → 'sent'` | Ops marks invoice as sent |
| `deposit_paid` | Deposit invoice `status → 'paid'` | Ops marks payment received |
| `final_invoiced` | Final invoice `status → 'sent'` | Ops marks final invoice sent (post go-live) |
| `final_paid` | Final invoice `status → 'paid'` | Ops marks final payment received |

Revenue stage transitions are performed by the following service function, which updates
both the invoice status and the project's `revenue_stage` atomically:

```typescript
// src/services/invoices.ts

export async function updateInvoiceStatus(
  projectId: string,
  invoiceType: 'deposit' | 'final',
  newStatus: 'sent' | 'paid',
  date: string   // ISO date string 'YYYY-MM-DD'
): Promise<{ error: string | null }> {
  // Update invoice row
  const invoiceUpdate: Partial<Invoice> = { status: newStatus };
  if (newStatus === 'sent') invoiceUpdate.date_sent = date;
  if (newStatus === 'paid') invoiceUpdate.date_paid = date;

  const { error: invoiceErr } = await supabase
    .from('invoices')
    .update(invoiceUpdate)
    .eq('project_id', projectId)
    .eq('invoice_type', invoiceType);

  if (invoiceErr) return { error: invoiceErr.message };

  // Derive new revenue_stage
  const newRevStage = deriveRevenueStage(invoiceType, newStatus);
  if (newRevStage) {
    const { error: projErr } = await supabase
      .from('projects')
      .update({ revenue_stage: newRevStage })
      .eq('id', projectId);
    if (projErr) return { error: projErr.message };
  }

  return { error: null };
}

function deriveRevenueStage(
  invoiceType: 'deposit' | 'final',
  newStatus: 'sent' | 'paid'
): RevStage | null {
  if (invoiceType === 'deposit' && newStatus === 'sent') return 'deposit_invoiced';
  if (invoiceType === 'deposit' && newStatus === 'paid') return 'deposit_paid';
  if (invoiceType === 'final'   && newStatus === 'sent') return 'final_invoiced';
  if (invoiceType === 'final'   && newStatus === 'paid') return 'final_paid';
  return null;
}
```

---

## 4. Labor Cost Calculation

Installation labor is NOT part of the BOM. It is tracked as a derived value from
`projects.installer_hours` and feeds into the project P&L.

### Formula

```typescript
function computeLaborCost(
  installerHours: number,
  installer: Installer | null,
  settings: Settings
): number {
  const ratePerHour = installer?.hourly_rate ?? settings.labor_rate_per_hour;
  // installer.hourly_rate overrides the default when set
  // Default: settings.labor_rate_per_hour = $120.00

  return installerHours * ratePerHour;
}
```

### Labor Rate Settings

| Setting key | Default value | Description |
|-------------|---------------|-------------|
| `labor_rate_per_hour` | `120.00` | Default hourly rate when installer has no override |

### Installer-Specific Rate Override

If the assigned installer has `hourly_rate` set (non-NULL), that value overrides the
global `labor_rate_per_hour` setting for this project's labor cost calculation.
This allows PodPlay to track different rates for different vetted installers.

### Labor Cost Example

```
installer_hours = 40 hours (4-day install, 10 hrs/day)
hourly_rate     = $120.00  (default, no installer override)

labor_cost      = 40 × $120.00 = $4,800.00
```

### Labor Cost in Invoice

Labor cost is **NOT billed to the customer as a separate line item**. It flows only through
the internal P&L as a COGS component. The customer invoice includes only:
- Hardware subtotal (sum of `customer_price` from BOM items)
- Service fee (tier venue fee + per-court fee)
- Sales tax

Labor cost is a PodPlay internal cost that reduces net profit.

---

## 5. Per-Project P&L

The project P&L is computed from:
- **Revenue**: invoice amounts (hardware + service fee, pre-tax)
- **COGS**: sum of `est_total_cost` across all BOM items (unit_cost × qty, no shipping/margin)
- **Labor**: `installer_hours × rate`
- **Expenses**: sum of all `expenses` rows for this project

### P&L Formula Chain

```typescript
interface ProjectPnL {
  // Revenue
  hardware_revenue: number;      // sum of customer_price (what customer pays for hardware)
  service_revenue: number;       // tier service fee
  total_revenue: number;         // hardware_revenue + service_revenue (pre-tax)

  // COGS
  hardware_cogs: number;         // sum of est_total_cost (raw unit costs)
  gross_profit: number;          // total_revenue - hardware_cogs
  gross_margin_pct: number;      // gross_profit / total_revenue

  // Operating expenses
  labor_cost: number;            // installer_hours × rate
  total_expenses: number;        // sum of all expense amounts
  operating_expenses: number;    // labor_cost + total_expenses

  // Net
  net_profit: number;            // gross_profit - operating_expenses
  net_margin_pct: number;        // net_profit / total_revenue
}

function computeProjectPnL(
  bomItems: ProjectBomItem[],
  project: Project,
  installer: Installer | null,
  expenses: Expense[],
  settings: Settings
): ProjectPnL {
  // Revenue
  const hardware_revenue = bomItems.reduce(
    (sum, item) => sum + (item.customer_price ?? 0), 0
  );
  const service_revenue = computeServiceFee(project.tier, project.court_count, settings);
  const total_revenue = hardware_revenue + service_revenue;

  // COGS
  const hardware_cogs = bomItems.reduce(
    (sum, item) => sum + (item.est_total_cost ?? 0), 0
  );
  const gross_profit = total_revenue - hardware_cogs;
  const gross_margin_pct = total_revenue > 0 ? gross_profit / total_revenue : 0;

  // Operating expenses
  const labor_cost = computeLaborCost(project.installer_hours, installer, settings);
  const total_expenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const operating_expenses = labor_cost + total_expenses;

  // Net
  const net_profit = gross_profit - operating_expenses;
  const net_margin_pct = total_revenue > 0 ? net_profit / total_revenue : 0;

  return {
    hardware_revenue,
    service_revenue,
    total_revenue,
    hardware_cogs,
    gross_profit,
    gross_margin_pct,
    labor_cost,
    total_expenses,
    operating_expenses,
    net_profit,
    net_margin_pct,
  };
}
```

### P&L Service Function

```typescript
// src/services/financials.ts

export async function getProjectPnL(
  projectId: string
): Promise<{ pnl: ProjectPnL | null; error: string | null }> {
  // Load all dependencies in parallel
  const [
    { data: bomItems },
    { data: project },
    { data: expenseRows },
    { data: settingsRows },
  ] = await Promise.all([
    supabase
      .from('project_bom_items')
      .select('est_total_cost, customer_price')
      .eq('project_id', projectId),
    supabase
      .from('projects')
      .select('tier, court_count, installer_id, installer_hours')
      .eq('id', projectId)
      .single(),
    supabase
      .from('expenses')
      .select('amount')
      .eq('project_id', projectId),
    supabase
      .from('settings')
      .select('key, value'),
  ]);

  if (!project) return { pnl: null, error: 'Project not found' };

  // Load installer (may be null)
  let installer: Installer | null = null;
  if (project.installer_id) {
    const { data } = await supabase
      .from('installers')
      .select('hourly_rate')
      .eq('id', project.installer_id)
      .single();
    installer = data;
  }

  const settings = buildSettingsMap(settingsRows ?? []);

  const pnl = computeProjectPnL(
    bomItems ?? [],
    project,
    installer,
    expenseRows ?? [],
    settings
  );

  return { pnl, error: null };
}
```

### P&L Concrete Example: 6-Court Autonomous+

```
Hardware revenue (from BOM customer_price total):  $19,770.00
Service revenue (Autonomous+, 6 courts):           $22,500.00
Total revenue:                                     $42,270.00

Hardware COGS (sum of est_total_cost):             $16,175.00
Gross profit:                                      $26,095.00
Gross margin:                                      61.7%

Labor cost (40 hrs × $120):                        $4,800.00
Travel expenses (estimated):
  airfare:   $1,800.00
  lodging:   $750.00 (3 nights × $250)
  car:       $350.00
  meals:     $200.00
  subtotal:  $3,100.00
Total expenses:                                    $3,100.00
Operating expenses:                                $7,900.00

Net profit:                                        $18,195.00
Net margin:                                        43.0%
```

*Hardware unit costs from seed-data.md estimates. Travel expenses illustrative.*

---

## 6. HER (Hardware Efficiency Ratio)

HER is a period-level metric that measures how efficiently the team converts hardware
spend into hardware revenue.

### Formula

```
HER = hardware_revenue_in_period / team_hardware_spend_in_period
```

A HER > 1.0 means hardware revenue exceeds hardware-allocated team costs.
A HER of 2.0 means $2 of hardware revenue per $1 of hardware team spend.

### Team Hardware Spend Calculation

The team hardware spend is the portion of team salaries and overhead allocated to
hardware operations. Allocation rules from `model-team-opex`:

```typescript
function computeTeamHardwareSpend(
  settings: Settings,
  periodMonths: number = 1
): number {
  // Niko: 50% direct hardware + 50% indirect, of which 50% is hardware pool
  const niko_monthly = settings.niko_annual_salary / 12;
  const niko_hardware = niko_monthly * settings.niko_direct_allocation;
  // niko_direct_allocation = 0.50 → $4,000/mo if salary $96K/yr

  const niko_indirect = niko_monthly * (1 - settings.niko_direct_allocation);
  const niko_indirect_hardware = niko_indirect * 0.50;
  // 50% of indirect time also allocated to hardware pool

  // Chad: 20% of time is indirect hardware overhead
  const chad_monthly = settings.chad_annual_salary / 12;
  const chad_hardware = chad_monthly * settings.chad_indirect_allocation;
  // chad_indirect_allocation = 0.20

  // Rent: 100% to hardware (lab is hardware ops space)
  const monthly_rent = settings.annual_rent / 12;
  // $27,600/yr → $2,300/mo

  // Indirect salaries (all non-Niko/Chad ops staff): 20% allocated to hardware
  const monthly_indirect_salaries = settings.annual_indirect_salaries / 12;
  const indirect_hardware = monthly_indirect_salaries * 0.20;
  // $147,000/yr → $12,250/mo → $2,450/mo to hardware

  const monthly_hardware_spend =
    niko_hardware +
    niko_indirect_hardware +
    chad_hardware +
    monthly_rent +
    indirect_hardware;

  return monthly_hardware_spend * periodMonths;
}
```

**Concrete example** (with Niko $96K/yr, Chad $60K/yr):
```
Niko direct:           $96,000/12 × 0.50             = $4,000/mo
Niko indirect×50%:     $96,000/12 × 0.50 × 0.50      = $2,000/mo
Chad indirect:         $60,000/12 × 0.20             = $1,000/mo
Rent:                  $27,600/12                    = $2,300/mo
Indirect salaries×20%: $147,000/12 × 0.20            = $2,450/mo

team_hardware_spend = $4,000 + $2,000 + $1,000 + $2,300 + $2,450 = $11,750/mo
```

### Monthly HER Snapshot Storage

HER is computed and stored in `monthly_opex_snapshots` at month-end close:

```typescript
// src/services/financials.ts

export async function recordMonthlyOpexSnapshot(
  periodYear: number,
  periodMonth: number   // 1–12
): Promise<{ error: string | null }> {
  // Compute hardware revenue for the period
  // = sum of invoices that became deposit_paid or final_paid this month
  const periodStart = `${periodYear}-${String(periodMonth).padStart(2, '0')}-01`;
  const periodEnd = new Date(periodYear, periodMonth, 0)
    .toISOString().split('T')[0]; // last day of month

  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('hardware_subtotal, invoice_type, date_paid')
    .gte('date_paid', periodStart)
    .lte('date_paid', periodEnd)
    .eq('status', 'paid');

  const hardware_revenue = (paidInvoices ?? []).reduce(
    (sum, inv) => sum + (inv.hardware_subtotal ?? 0), 0
  );

  // Compute team hardware spend
  const { data: settingsRows } = await supabase
    .from('settings').select('key, value');
  const settings = buildSettingsMap(settingsRows ?? []);
  const team_hardware_spend = computeTeamHardwareSpend(settings, 1);

  // Upsert snapshot (idempotent — recalculate if called again for same period)
  const { error } = await supabase
    .from('monthly_opex_snapshots')
    .upsert({
      period_year: periodYear,
      period_month: periodMonth,
      hardware_revenue,
      team_hardware_spend,
      // her_ratio is GENERATED ALWAYS AS (hardware_revenue / team_hardware_spend)
    }, { onConflict: 'period_year,period_month' });

  return { error: error?.message ?? null };
}
```

### HER Display

The global financials dashboard displays HER as:
- Monthly trend line chart (last 12 months of `monthly_opex_snapshots`)
- Current month HER badge: `HER: 2.55x` (green > 2.0, yellow 1.0–2.0, red < 1.0)
- Target: no hardcoded target — ops sets expectations informally

---

## 7. Aging Receivables Calculation

Aging receivables track outstanding (sent but unpaid) invoices by days overdue.
Computed from `invoices` at query time, not stored.

```typescript
interface AgingBucket {
  label: string;
  range_days: [number, number];  // inclusive [min, max] or [min, Infinity]
  invoices: Invoice[];
  total_amount: number;
}

function computeAgingReceivables(
  invoices: Invoice[],
  today: Date
): AgingBucket[] {
  const sent_unpaid = invoices.filter(inv => inv.status === 'sent');

  const buckets: AgingBucket[] = [
    { label: '0–30 days',   range_days: [0, 30],        invoices: [], total_amount: 0 },
    { label: '31–60 days',  range_days: [31, 60],       invoices: [], total_amount: 0 },
    { label: '61–90 days',  range_days: [61, 90],       invoices: [], total_amount: 0 },
    { label: '90+ days',    range_days: [91, Infinity],  invoices: [], total_amount: 0 },
  ];

  for (const inv of sent_unpaid) {
    if (!inv.date_sent) continue;
    const daysSinceSent = Math.floor(
      (today.getTime() - new Date(inv.date_sent).getTime()) / (1000 * 60 * 60 * 24)
    );

    for (const bucket of buckets) {
      const [min, max] = bucket.range_days;
      if (daysSinceSent >= min && daysSinceSent <= max) {
        bucket.invoices.push(inv);
        bucket.total_amount += inv.total_amount ?? 0;
        break;
      }
    }
  }

  return buckets;
}
```

---

## 8. Complete Settings Map for Cost Analysis

All cost-analysis settings loaded from the `settings` table:

```typescript
function buildSettingsMap(rows: { key: string; value: string }[]): Settings {
  const m = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    // BOM cost chain
    shipping_rate:              parseFloat(m['shipping_rate']              ?? '0.10'),
    target_margin:              parseFloat(m['target_margin']              ?? '0.10'),
    sales_tax_rate:             parseFloat(m['sales_tax_rate']             ?? '0.1025'),

    // Service fees by tier
    pro_venue_fee:              parseFloat(m['pro_venue_fee']              ?? '5000.00'),
    pro_court_fee:              parseFloat(m['pro_court_fee']              ?? '2500.00'),
    autonomous_venue_fee:       parseFloat(m['autonomous_venue_fee']       ?? '7500.00'),
    autonomous_court_fee:       parseFloat(m['autonomous_court_fee']       ?? '2500.00'),
    pbk_venue_fee:              parseFloat(m['pbk_venue_fee']              ?? '0.00'),
    pbk_court_fee:              parseFloat(m['pbk_court_fee']              ?? '0.00'),

    // Invoicing
    deposit_pct:                parseFloat(m['deposit_pct']                ?? '0.50'),

    // Labor
    labor_rate_per_hour:        parseFloat(m['labor_rate_per_hour']        ?? '120.00'),

    // Travel defaults (used for P&L estimation before actuals)
    lodging_per_day:            parseFloat(m['lodging_per_day']            ?? '250.00'),
    airfare_default:            parseFloat(m['airfare_default']            ?? '1800.00'),
    hours_per_day:              parseInt(m['hours_per_day']                ?? '10', 10),

    // Team OpEx (for HER)
    niko_annual_salary:         parseFloat(m['niko_annual_salary']         ?? '0.00'),
    niko_direct_allocation:     parseFloat(m['niko_direct_allocation']     ?? '0.50'),
    chad_annual_salary:         parseFloat(m['chad_annual_salary']         ?? '0.00'),
    chad_indirect_allocation:   parseFloat(m['chad_indirect_allocation']   ?? '0.20'),
    annual_rent:                parseFloat(m['annual_rent']                ?? '27600.00'),
    annual_indirect_salaries:   parseFloat(m['annual_indirect_salaries']   ?? '147000.00'),
  };
}
```

---

## 9. Validation Rules

### BOM Cost Chain Validation

| Condition | Behavior |
|-----------|----------|
| `unit_cost IS NULL` for any BOM item | Row inserted; cost columns NULL; yellow flag in BOM review: "Enter unit cost manually." |
| `margin >= 1.0` | `customer_price` column returns NULL (division by zero guard in GENERATED ALWAYS); UI shows red error: "Margin must be < 100%." |
| `shipping_rate < 0` | Settings form validation rejects negative shipping rate. |
| `qty = 0` | BOM items with qty=0 are excluded at generation time; not inserted. |

### Invoice Validation

| Condition | Behavior |
|-----------|----------|
| Any BOM item has NULL `customer_price` | Invoice amounts cannot be computed. Stage 4 billing button is disabled with tooltip: "Complete all BOM unit costs before billing." |
| Deposit invoice marked 'paid' before deposit invoice marked 'sent' | UI prevents marking paid without first marking sent. |
| Final invoice marked 'sent' before `go_live_date` is set | Warning shown: "Final invoice is typically sent after go-live. Go-live date is not set." (non-blocking). |
| Final invoice marked 'paid' before deposit invoice is 'paid' | Warning: "Deposit invoice has not been marked paid. Confirm this is intentional." (non-blocking). |

### P&L Validation

| Condition | Behavior |
|-----------|----------|
| `installer_hours = 0` | Labor cost = $0. Shown as warning in P&L view: "No installer hours logged — labor cost is $0." |
| `total_revenue = 0` | P&L shows $0 revenue; margin percentages show as "—". |
| Expenses exceed gross profit | Net profit goes negative. Shown in red. No blocking — some projects may genuinely lose money. |

---

## 10. Edge Cases

| Scenario | Behavior |
|----------|----------|
| `court_count = 1`, Pro tier | service_fee = $5,000 + $2,500 = $7,500 |
| `court_count = 30`, Autonomous | service_fee = $7,500 + (30 × $2,500) = $82,500 |
| PBK tier with `pbk_venue_fee = 0` | service_fee = $0 until XLSX values are loaded into settings |
| All BOM items have NULL unit_cost | hardware_subtotal = $0; invoice shows $0 hardware; service fee still applies |
| `deposit_pct = 1.0` (full upfront billing) | deposit_amount = total_amount; final_amount = $0; final invoice row still created but shows $0 |
| `deposit_pct = 0.0` | deposit_amount = $0; all billed on final invoice; valid but unusual |
| Autonomous+ project where some BOM items were manually deleted | Those items do not contribute to totals; ops must note this in invoice |
| Tax rate changed in settings after invoice populated | Invoice rows store `tax_rate` snapshot at population time; does NOT recompute on settings change |
| BOM regenerated after invoice was populated | `populateInvoiceAmounts()` must be called again; UI shows staleness warning if BOM was modified after last invoice population: "BOM has changed since invoice amounts were last computed. Refresh invoice amounts?" |

---

## 11. File Locations

```
src/services/financials.ts     — computeProjectPnL(), getProjectPnL(), computeInvoiceAmounts(),
                                 populateInvoiceAmounts(), updateInvoiceStatus(),
                                 recordMonthlyOpexSnapshot(), computeTeamHardwareSpend(),
                                 computeAgingReceivables()
src/services/invoices.ts       — createProjectInvoices(), updateInvoiceStatus()
src/services/settings.ts       — buildSettingsMap()
src/types/financials.ts        — ProjectPnL, InvoiceAmounts, AgingBucket, Settings interfaces
```

Following the pattern from `apps/inheritance/frontend/src/services/` — one file per domain,
typed inputs/outputs, no business logic in components.
