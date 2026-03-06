# Business Logic: Invoicing & Expenses

**Aspect**: logic-invoicing
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: INVOICING sheet (amounts, dates, status), EXPENSES sheet (category, amount, payment method), COST ANALYSIS sheet (subtotals), CUSTOMER MASTER (revenue_stage column, signed_date, go_live_date)
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `invoices`, `expenses`, `projects`, `project_bom_items`, `settings`
**Pricing Source**: `analysis/source-pricing-model.md`

---

## Overview

PodPlay uses a two-installment billing model for every project:

1. **Deposit invoice** — Sent when the customer signs the contract. Amount = 50% of total invoice.
2. **Final invoice** — Sent when the venue goes live (replay running, app active). Amount = remaining 50%.

Expenses are tracked separately per project as categorized line items (travel, hardware, labor,
shipping) and feed into the per-project P&L.

The `revenue_stage` field on `projects` is the canonical pipeline indicator. It advances
automatically whenever an invoice status changes.

---

## 1. Invoice Amounts: Full Calculation

### Inputs

| Source | Field | Description |
|--------|-------|-------------|
| `project_bom_items` | `SUM(customer_price)` | Hardware subtotal (sum of all BOM line customer prices) |
| `projects` | `tier`, `court_count` | Determines service fee |
| `settings` | `sales_tax_rate` | Default 10.25% |
| `settings` | `pro_venue_fee`, `pro_court_fee` | Pro tier fees |
| `settings` | `autonomous_venue_fee`, `autonomous_court_fee` | Autonomous/Autonomous+ fees |
| `settings` | `pbk_venue_fee`, `pbk_court_fee` | PBK custom fees |

### Step 1: Hardware Subtotal

```typescript
const hardware_subtotal: number = project_bom_items
  .filter(item => item.customer_price !== null)
  .reduce((sum, item) => sum + item.customer_price!, 0);
// NULL customer_price items: unit_cost unknown — excluded from subtotal
// Ops person must fill in missing unit costs before invoicing
```

### Step 2: Service Fee

```typescript
function computeServiceFee(
  tier: ServiceTier,
  court_count: number,
  settings: Settings
): number {
  switch (tier) {
    case 'pro':
      return settings.pro_venue_fee + court_count * settings.pro_court_fee;
      // Example: 6 courts Pro → 5000 + (6 × 2500) = $20,000

    case 'autonomous':
    case 'autonomous_plus':
      return settings.autonomous_venue_fee + court_count * settings.autonomous_court_fee;
      // Example: 4 courts Autonomous → 7500 + (4 × 2500) = $17,500

    case 'pbk':
      return settings.pbk_venue_fee + court_count * settings.pbk_court_fee;
      // PBK exact pricing requires PBK contract; defaults to 0.00 until configured
  }
}
```

### Step 3: Tax

```typescript
const subtotal: number = hardware_subtotal + service_fee;
const tax_amount: number = subtotal * settings.sales_tax_rate;
// Default: subtotal × 0.1025
```

### Step 4: Invoice Total

```typescript
const total_amount: number = subtotal + tax_amount;
// = subtotal × (1 + sales_tax_rate)
// = subtotal × 1.1025
```

### Step 5: Deposit & Final Split

```typescript
const deposit_pct: number = 0.50;  // 50/50 split (assumed — XLSX INVOICING sheet confirmation needed)
const deposit_amount: number = Math.round(total_amount * deposit_pct * 100) / 100;
const final_amount: number = Math.round((total_amount - deposit_amount) * 100) / 100;
// Rounding: round half-up to 2 decimal places
// Any cent rounding discrepancy goes to the final invoice
```

### Concrete Example (6-court Pro, unit costs assumed)

```
BOM hardware subtotal:  $18,333  (sum of customer_price across all BOM items)
Service fee:            $20,000  (Pro: $5,000 venue + 6 × $2,500 courts)
Subtotal:               $38,333
Sales tax (10.25%):      $3,929
Total invoice:          $42,262

Deposit (50%):          $21,131
Final (50%):            $21,131
```

---

## 2. Invoice Row Creation

Two `invoices` rows exist per project: one with `invoice_type = 'deposit'` and one with
`invoice_type = 'final'`. Both rows are created when the project is first saved to the
database (at end of Stage 1, intake form submission), but with `status = 'not_sent'` and
null amounts until the BOM is approved.

### Create Both Invoice Rows (on project creation)

```typescript
async function createProjectInvoices(projectId: string): Promise<void> {
  await supabase.from('invoices').insert([
    {
      project_id: projectId,
      invoice_type: 'deposit',
      status: 'not_sent',
      // amounts filled in later when BOM is approved
    },
    {
      project_id: projectId,
      invoice_type: 'final',
      status: 'not_sent',
    },
  ]);
}
```

### Populate Amounts (when BOM is approved in Stage 2)

```typescript
async function populateInvoiceAmounts(
  projectId: string,
  project: Project,
  bom_items: ProjectBomItem[],
  settings: Settings
): Promise<void> {
  const hardware_subtotal = computeHardwareSubtotal(bom_items);
  const service_fee = computeServiceFee(project.tier, project.court_count, settings);
  const tax_rate = settings.sales_tax_rate;
  const deposit_pct = 0.50;

  // Update deposit invoice
  await supabase
    .from('invoices')
    .update({
      hardware_subtotal,
      service_fee,
      tax_rate,
      deposit_pct,
      // subtotal, tax_amount, total_amount are GENERATED ALWAYS columns in Postgres
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'deposit');

  // Update final invoice (same amounts — final tracks the remaining balance)
  await supabase
    .from('invoices')
    .update({
      hardware_subtotal,
      service_fee,
      tax_rate,
      deposit_pct: 1 - deposit_pct,  // Final = remaining 50%
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'final');
}
```

**Recalculation rule**: Invoice amounts are recalculated any time BOM items change while
status is `'not_sent'`. Once an invoice is `'sent'` or `'paid'`, amounts are LOCKED and
cannot be changed by BOM edits. The UI must show a warning if BOM is edited after invoicing.

---

## 3. Revenue Stage State Machine

The `projects.revenue_stage` enum tracks the customer payment lifecycle. It advances
forward only — no backwards transitions except `cancelled`.

```
proposal
   │  ← SOW sent to customer; not yet signed
   │  [Manual: ops person marks contract signed]
   ▼
signed
   │  ← Customer signed SOW; deposit not yet invoiced
   │  [Trigger: signed_date set on project]
   │  [System: deposit invoice status remains 'not_sent']
   ▼
deposit_invoiced
   │  ← Deposit invoice sent to customer
   │  [Trigger: deposit invoice.status set to 'sent', date_sent filled]
   │  [System: auto-advance revenue_stage to 'deposit_invoiced']
   ▼
deposit_paid
   │  ← Deposit payment received
   │  [Trigger: deposit invoice.status set to 'paid', date_paid filled]
   │  [System: auto-advance revenue_stage to 'deposit_paid']
   ▼
final_invoiced
   │  ← Final invoice sent (after go-live)
   │  [Trigger: final invoice.status set to 'sent', date_sent filled]
   │  [Guard: go_live_date must be set on project before final invoice can be sent]
   │  [System: auto-advance revenue_stage to 'final_invoiced']
   ▼
final_paid
      ← Final payment received; project fully closed
      [Trigger: final invoice.status set to 'paid', date_paid filled]
      [System: auto-advance revenue_stage to 'final_paid']
      [System: project_status advances to 'completed']
```

### Transition Functions

```typescript
// Called whenever an invoice's status changes
async function onInvoiceStatusChange(
  invoice: Invoice,
  newStatus: InvoiceStatus
): Promise<void> {
  const projectId = invoice.project_id;

  if (invoice.invoice_type === 'deposit') {
    if (newStatus === 'sent') {
      await setRevenueStage(projectId, 'deposit_invoiced');
    } else if (newStatus === 'paid') {
      await setRevenueStage(projectId, 'deposit_paid');
    }
  } else if (invoice.invoice_type === 'final') {
    if (newStatus === 'sent') {
      // Guard: go_live_date must be set
      const project = await getProject(projectId);
      if (!project.go_live_date) {
        throw new Error('Cannot send final invoice: go_live_date is not set. Set go-live date first.');
      }
      await setRevenueStage(projectId, 'final_invoiced');
    } else if (newStatus === 'paid') {
      await setRevenueStage(projectId, 'final_paid');
      // Also advance project to completed
      await supabase
        .from('projects')
        .update({ project_status: 'completed' })
        .eq('id', projectId);
    }
  }
}

// Called when ops person marks the contract as signed
async function onProjectSigned(projectId: string, signedDate: Date): Promise<void> {
  await supabase
    .from('projects')
    .update({
      signed_date: signedDate.toISOString().split('T')[0],
      revenue_stage: 'signed',
    })
    .eq('id', projectId);
}
```

---

## 4. Invoice Sending Workflow (UI → DB)

### Send Deposit Invoice

**Pre-condition**: `project.revenue_stage === 'signed'` (contract signed)
**Pre-condition**: Deposit invoice `status === 'not_sent'`
**Pre-condition**: `hardware_subtotal` is not null (BOM must have been approved)

**Steps**:
1. Ops person enters `invoice_number` (from external billing system, e.g., QuickBooks)
2. Ops person confirms `date_sent`
3. System sets `invoices.status = 'sent'`, `date_sent = today`
4. `onInvoiceStatusChange` fires → `revenue_stage` advances to `'deposit_invoiced'`

```typescript
async function markDepositInvoiceSent(
  projectId: string,
  invoiceNumber: string,
  dateSent: Date
): Promise<void> {
  // Validate pre-conditions
  const project = await getProject(projectId);
  if (project.revenue_stage !== 'signed') {
    throw new Error(`Cannot send deposit invoice: project revenue_stage is '${project.revenue_stage}', expected 'signed'`);
  }

  const invoice = await getInvoice(projectId, 'deposit');
  if (invoice.hardware_subtotal === null) {
    throw new Error('Cannot send deposit invoice: BOM not yet approved. Approve BOM to set invoice amounts.');
  }

  await supabase
    .from('invoices')
    .update({
      invoice_number: invoiceNumber,
      status: 'sent',
      date_sent: dateSent.toISOString().split('T')[0],
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'deposit');

  await onInvoiceStatusChange({ ...invoice, invoice_type: 'deposit' }, 'sent');
}
```

### Mark Deposit Paid

**Pre-condition**: `invoices.status === 'sent'` for deposit invoice

```typescript
async function markDepositPaid(projectId: string, datePaid: Date): Promise<void> {
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      date_paid: datePaid.toISOString().split('T')[0],
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'deposit');

  const invoice = await getInvoice(projectId, 'deposit');
  await onInvoiceStatusChange(invoice, 'paid');
}
```

### Send Final Invoice

**Pre-condition**: `project.go_live_date` is set (enforced by guard in `onInvoiceStatusChange`)
**Pre-condition**: `project.revenue_stage === 'deposit_paid'`

```typescript
async function markFinalInvoiceSent(
  projectId: string,
  invoiceNumber: string,
  dateSent: Date
): Promise<void> {
  const project = await getProject(projectId);
  if (!project.go_live_date) {
    throw new Error('Cannot send final invoice: go-live date not set.');
  }
  if (project.revenue_stage !== 'deposit_paid') {
    throw new Error(`Cannot send final invoice: deposit not yet paid (stage: ${project.revenue_stage})`);
  }

  await supabase
    .from('invoices')
    .update({
      invoice_number: invoiceNumber,
      status: 'sent',
      date_sent: dateSent.toISOString().split('T')[0],
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'final');

  const invoice = await getInvoice(projectId, 'final');
  await onInvoiceStatusChange(invoice, 'sent');
}
```

### Mark Final Paid (Project Close)

```typescript
async function markFinalPaid(projectId: string, datePaid: Date): Promise<void> {
  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      date_paid: datePaid.toISOString().split('T')[0],
    })
    .eq('project_id', projectId)
    .eq('invoice_type', 'final');

  const invoice = await getInvoice(projectId, 'final');
  await onInvoiceStatusChange(invoice, 'paid');
  // Side effect: project_status → 'completed' (inside onInvoiceStatusChange)
}
```

---

## 5. Aging Receivables

Receivables are invoices in `'sent'` status where payment has not yet arrived.
Age is measured from `date_sent` to today.

```typescript
type AgingBucket = '0_30' | '31_60' | '61_90' | 'over_90';

function getAgingBucket(dateSent: Date): AgingBucket {
  const daysPast = Math.floor((Date.now() - dateSent.getTime()) / (1000 * 60 * 60 * 24));
  if (daysPast <= 30)  return '0_30';
  if (daysPast <= 60)  return '31_60';
  if (daysPast <= 90)  return '61_90';
  return 'over_90';
}

// Query: all outstanding receivables
async function getAgingReceivables(): Promise<AgingReceivable[]> {
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id,
      project_id,
      invoice_type,
      total_amount,
      date_sent,
      projects (customer_name, venue_name)
    `)
    .eq('status', 'sent')
    .not('date_sent', 'is', null)
    .order('date_sent', { ascending: true });

  return (invoices ?? []).map(inv => ({
    ...inv,
    days_outstanding: Math.floor((Date.now() - new Date(inv.date_sent).getTime()) / 86400000),
    aging_bucket: getAgingBucket(new Date(inv.date_sent)),
  }));
}
```

### Aging Summary (for dashboard)

| Bucket | Description | Action |
|--------|-------------|--------|
| 0–30 days | Normal — no action needed | Monitor |
| 31–60 days | Follow up | Send reminder |
| 61–90 days | Escalate | Call customer |
| 90+ days | Overdue | Escalate to Andy (PM) |

---

## 6. Expense Tracking

### Expense Categories

Every expense record belongs to one of 12 categories (from `expense_category` enum):

| Category | Description | Typical Amount |
|----------|-------------|---------------|
| `airfare` | Round-trip flights for installation team | Default $1,800 (from settings.airfare_default) |
| `car` | Rental car for on-site days | Actual cost |
| `fuel` | Gas during install trip | Actual cost |
| `lodging` | Hotel nights | Default $250/night (settings.lodging_per_day) |
| `meals` | Per diem meals | Actual cost |
| `misc_hardware` | Incidental hardware not in BOM (fasteners, tape, etc.) | Actual cost |
| `outbound_shipping` | Shipping cost to send packed hardware to venue | Actual cost |
| `professional_services` | Installer payment (labor) | `installer_hours × labor_rate_per_hour` |
| `taxi` | Rideshare / taxi to/from venue | Actual cost |
| `train` | Rail travel | Actual cost |
| `parking` | Parking at venue or airport | Actual cost |
| `other` | Anything not above | Actual cost |

### Payment Methods

| Code | Description |
|------|-------------|
| `podplay_card` | Ramp company credit card (no reimbursement needed) |
| `ramp_reimburse` | Personal card; submit receipt to Ramp for reimbursement |

### Add Expense

```typescript
interface CreateExpenseInput {
  project_id: string;
  expense_date: string;          // ISO date 'YYYY-MM-DD'
  category: ExpenseCategory;
  amount: number;                // USD, must be > 0
  payment_method: PaymentMethod;
  description?: string;
  receipt_url?: string;
  notes?: string;
}

async function addExpense(input: CreateExpenseInput): Promise<Expense> {
  if (input.amount <= 0) {
    throw new Error('Expense amount must be greater than 0');
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Default Pre-fill Values (from settings)

When adding a new expense record in the UI, pre-fill based on category:

| Category | Pre-fill Field | Pre-fill Value |
|----------|---------------|----------------|
| `airfare` | amount | `settings.airfare_default` ($1,800) |
| `lodging` | amount | `settings.lodging_per_day` × nights ($250 × N) |
| All others | amount | 0 (blank) |

The ops person may override the pre-filled amount with the actual receipt amount.

### Labor Expense Auto-Creation

When `installer_hours` is saved on the project, a `professional_services` expense is NOT
automatically created. Instead, the wizard Stage 4 UI shows a "Log Installer Labor" action
that creates a `professional_services` expense:

```typescript
async function logInstallerLabor(
  projectId: string,
  installerHours: number,
  settings: Settings,
  installer: Installer | null
): Promise<Expense> {
  const rate = installer?.hourly_rate ?? settings.labor_rate_per_hour;
  const amount = installerHours * rate;

  return addExpense({
    project_id: projectId,
    expense_date: new Date().toISOString().split('T')[0],
    category: 'professional_services',
    amount,
    payment_method: 'podplay_card',
    description: `Installer labor: ${installerHours} hrs × $${rate}/hr`,
  });
}
```

### Edit / Delete Expense

Expenses can be edited or deleted at any time while the project is in `financial_close`
status. Once project_status = `'completed'`, the UI shows a read-only view with an
"Unlock for editing" override button (which sets an `expenses_locked = false` override
on the project — no separate column needed; UI just warns before allowing edits on completed projects).

### Get All Expenses for Project

```typescript
async function getProjectExpenses(projectId: string): Promise<Expense[]> {
  const { data } = await supabase
    .from('expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false });

  return data ?? [];
}
```

### Expense Totals by Category

```typescript
function summarizeExpenses(expenses: Expense[]): Record<ExpenseCategory, number> {
  const totals = {} as Record<ExpenseCategory, number>;
  for (const exp of expenses) {
    totals[exp.category] = (totals[exp.category] ?? 0) + exp.amount;
  }
  return totals;
}

function totalExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
```

---

## 7. Per-Project P&L

The P&L is computed client-side from `project_bom_items`, `invoices`, and `expenses`.
It is NOT stored as a separate table — it is calculated on demand.

### Full P&L Formula

```typescript
interface ProjectPnL {
  // Revenue
  hardware_subtotal: number;       // sum(bom_items.customer_price)
  service_fee: number;             // tier venue fee + court fee
  revenue: number;                 // hardware_subtotal + service_fee (pre-tax)

  // Cost of Goods Sold
  cogs: number;                    // sum(bom_items.est_total_cost)

  // Gross Profit
  gross_profit: number;            // revenue - cogs
  gross_margin_pct: number;        // gross_profit / revenue

  // Operating Expenses
  labor_cost: number;              // professional_services expense total
  other_expenses: number;          // all non-labor expenses total
  total_expenses: number;          // labor_cost + other_expenses

  // Net Profit
  net_profit: number;              // gross_profit - total_expenses
  net_margin_pct: number;          // net_profit / revenue

  // Tax (informational; not part of margin calc)
  tax_amount: number;              // revenue × sales_tax_rate

  // Cash Flow
  total_invoiced: number;          // sum of sent+paid invoice amounts (pre-tax)
  total_collected: number;         // sum of paid invoice amounts (pre-tax)
  outstanding: number;             // total_invoiced - total_collected
}

function computeProjectPnL(
  project: Project,
  bom_items: ProjectBomItem[],
  expenses: Expense[],
  invoices: Invoice[],
  settings: Settings
): ProjectPnL {
  const hardware_subtotal = bom_items
    .filter(i => i.customer_price !== null)
    .reduce((s, i) => s + i.customer_price!, 0);

  const service_fee = computeServiceFee(project.tier, project.court_count, settings);
  const revenue = hardware_subtotal + service_fee;

  const cogs = bom_items
    .filter(i => i.est_total_cost !== null)
    .reduce((s, i) => s + i.est_total_cost!, 0);

  const gross_profit = revenue - cogs;
  const gross_margin_pct = revenue > 0 ? gross_profit / revenue : 0;

  const labor_cost = expenses
    .filter(e => e.category === 'professional_services')
    .reduce((s, e) => s + e.amount, 0);

  const other_expenses = expenses
    .filter(e => e.category !== 'professional_services')
    .reduce((s, e) => s + e.amount, 0);

  const total_expenses = labor_cost + other_expenses;

  const net_profit = gross_profit - total_expenses;
  const net_margin_pct = revenue > 0 ? net_profit / revenue : 0;

  const tax_amount = revenue * settings.sales_tax_rate;

  // invoices store total_amount (with tax); back out tax for cash-flow tracking
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const sentInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'paid');

  const total_collected = paidInvoices
    .reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const total_invoiced = sentInvoices
    .reduce((s, i) => s + (i.total_amount ?? 0), 0);
  const outstanding = total_invoiced - total_collected;

  return {
    hardware_subtotal,
    service_fee,
    revenue,
    cogs,
    gross_profit,
    gross_margin_pct,
    labor_cost,
    other_expenses,
    total_expenses,
    net_profit,
    net_margin_pct,
    tax_amount,
    total_invoiced,
    total_collected,
    outstanding,
  };
}
```

---

## 8. Validation Rules

### Invoice Validation

| Rule | Error Message |
|------|---------------|
| `hardware_subtotal` is null when attempting to send deposit | "BOM not approved — approve BOM first to calculate invoice amounts" |
| `revenue_stage !== 'signed'` when sending deposit | "Contract must be signed before sending deposit invoice" |
| `go_live_date` is null when sending final | "Set go-live date before sending final invoice" |
| `revenue_stage !== 'deposit_paid'` when sending final | "Deposit must be paid before sending final invoice" |
| Invoice `status === 'paid'` when trying to send | "Invoice already paid — no action needed" |
| `invoice_number` blank when marking sent | "Invoice number is required (enter from billing system, e.g., QuickBooks)" |
| BOM items edited after deposit sent | Warning: "Deposit invoice already sent — changes will not update the sent invoice. Create a change order manually if needed." |

### Expense Validation

| Rule | Error Message |
|------|---------------|
| `amount <= 0` | "Amount must be greater than $0" |
| `expense_date` in future (> today + 1 day) | "Expense date cannot be in the future" |
| `category` missing | "Expense category is required" |
| `payment_method` missing | "Payment method is required" |
| `receipt_url` not a valid URL (if provided) | "Receipt URL must be a valid URL" |

---

## 9. Service Layer Functions (Supabase Client)

File path: `src/services/invoicingService.ts`

```typescript
// Read
export async function getProjectInvoices(projectId: string): Promise<Invoice[]>
export async function getProjectExpenses(projectId: string): Promise<Expense[]>
export async function getAgingReceivables(): Promise<AgingReceivable[]>

// Invoice mutations
export async function populateInvoiceAmounts(projectId: string): Promise<void>
export async function markContractSigned(projectId: string, signedDate: string): Promise<void>
export async function markDepositInvoiceSent(projectId: string, invoiceNumber: string, dateSent: string): Promise<void>
export async function markDepositPaid(projectId: string, datePaid: string): Promise<void>
export async function markFinalInvoiceSent(projectId: string, invoiceNumber: string, dateSent: string): Promise<void>
export async function markFinalPaid(projectId: string, datePaid: string): Promise<void>

// Expense mutations
export async function addExpense(input: CreateExpenseInput): Promise<Expense>
export async function updateExpense(id: string, updates: Partial<CreateExpenseInput>): Promise<Expense>
export async function deleteExpense(id: string): Promise<void>

// Computed (client-side)
export function computeProjectPnL(project, bom_items, expenses, invoices, settings): ProjectPnL
export function getAgingBucket(dateSent: Date): AgingBucket
export function summarizeExpensesByCategory(expenses: Expense[]): Record<ExpenseCategory, number>
```

---

## 10. Revenue Stage Display Labels (UI)

| `revenue_stage` value | Display Label | Color | Icon |
|----------------------|---------------|-------|------|
| `proposal` | Proposal Sent | gray | document |
| `signed` | Contract Signed | blue | pen |
| `deposit_invoiced` | Deposit Invoiced | yellow | invoice |
| `deposit_paid` | Deposit Received | green | check |
| `final_invoiced` | Final Invoice Sent | orange | invoice |
| `final_paid` | Fully Paid | green (dark) | checkmark-circle |

---

## 11. Edge Cases

### BOM Not Fully Costed

Some BOM items may have `unit_cost = NULL` (hardware catalog entry lacks pricing data).
These items yield `customer_price = NULL`. The invoice computation:
- Shows a warning: "X BOM items have unknown unit costs and are excluded from invoice total"
- Allows the ops person to proceed (partial costing) or fill in missing costs first
- `hardware_subtotal` is the sum of items with known costs only

### Zero-Court Project

Not possible: `court_count >= 1` enforced by CHECK constraint. Service fee always > 0.

### PBK Tier With Unconfigured Fees

If `settings.pbk_venue_fee = 0` and `settings.pbk_court_fee = 0` (defaults until PBK
contract data is entered), the service fee computes as $0.00. The UI shows a warning:
"PBK pricing not configured — set PBK fees in Settings before invoicing."

### Cancelled Projects

Projects with `project_status = 'cancelled'` may still have outstanding invoices. The
revenue pipeline query includes these; they are shown with a "Cancelled" badge but remain
in the aging receivables if `status = 'sent'`.

### Backdating Invoices

The `date_sent` and `date_paid` fields accept any date (no future-date restriction). Ops
person may backdate if entering data after the fact. The UI pre-fills today's date but
allows override.

### Deposit Percentage Override

The `invoices.deposit_pct` field is stored per-invoice (not just in settings) to allow
non-standard splits (e.g., 30/70 for a specific client). The UI defaults to 0.50 but
allows the ops person to override before the invoice is sent. Once sent, the split is
locked.
