# Business Logic: Financial Reporting

**Aspect**: logic-financial-reporting
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: FINANCIALS tab (HER, team OpEx), INVOICING tab (revenue pipeline, aging), EXPENSES tab (monthly totals), CUSTOMER MASTER (project status, go-live dates)
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `monthly_opex_snapshots`, `invoices`, `expenses`, `projects`, `project_bom_items`, `settings`
**Depends On**: `logic-invoicing` (per-project P&L, invoice state machine), `model-team-opex` (HER formula, salary allocations)

---

## Overview

PodPlay's financial reporting consists of four distinct views, all computed client-side from Supabase data. No separate reporting tables are maintained beyond `monthly_opex_snapshots` (snapshotted at month-close). All other aggregations are calculated on demand.

| Report | Scope | Primary Metric | Computed From |
|--------|-------|---------------|--------------|
| Revenue Pipeline | All active projects | $ at each revenue stage | `projects.revenue_stage`, `invoices` |
| Global P&L | All projects, period-filtered | Net profit per month/YTD | `invoices`, `expenses`, `project_bom_items` |
| HER (Hardware Efficiency Ratio) | Per calendar month | hardware_revenue / team_hardware_spend | `monthly_opex_snapshots` |
| Aging Receivables | All sent+unpaid invoices | Days outstanding, $ outstanding | `invoices` where status='sent' |

---

## 1. Revenue Pipeline

### Definition

The revenue pipeline shows how many projects and what dollar amounts exist at each stage of the payment lifecycle. It is a funnel view — projects move forward through stages, never backward (except `cancelled`).

### Stages and Ordering

```
proposal → signed → deposit_invoiced → deposit_paid → final_invoiced → final_paid
```

### Pipeline Data Shape

```typescript
interface RevenuePipelineStage {
  stage: RevenueStage;           // enum value
  label: string;                 // display label
  project_count: number;         // projects currently at this stage
  total_contract_value: number;  // sum of all total_amount (deposit + final invoice) for projects at this stage
  deposit_outstanding: number;   // sum of deposit invoice total_amount where status='sent'
  final_outstanding: number;     // sum of final invoice total_amount where status='sent'
}

type RevenuePipeline = RevenuePipelineStage[];
```

### Pipeline Calculation

```typescript
async function computeRevenuePipeline(): Promise<RevenuePipeline> {
  // Fetch all non-cancelled projects with their invoices
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      revenue_stage,
      invoices (
        invoice_type,
        status,
        total_amount,
        hardware_subtotal,
        service_fee
      )
    `)
    .neq('project_status', 'cancelled')
    .order('created_at', { ascending: false });

  const STAGES: RevenueStage[] = [
    'proposal',
    'signed',
    'deposit_invoiced',
    'deposit_paid',
    'final_invoiced',
    'final_paid',
  ];

  const pipeline: RevenuePipeline = STAGES.map(stage => {
    const stageProjects = (projects ?? []).filter(p => p.revenue_stage === stage);

    let total_contract_value = 0;
    let deposit_outstanding = 0;
    let final_outstanding = 0;

    for (const project of stageProjects) {
      const depositInv = project.invoices?.find(i => i.invoice_type === 'deposit');
      const finalInv   = project.invoices?.find(i => i.invoice_type === 'final');

      // Contract value = sum of both invoice totals (if populated)
      const depositTotal = depositInv?.total_amount ?? 0;
      const finalTotal   = finalInv?.total_amount ?? 0;
      total_contract_value += depositTotal + finalTotal;

      // Outstanding = sent but not paid
      if (depositInv?.status === 'sent') deposit_outstanding += depositInv.total_amount ?? 0;
      if (finalInv?.status === 'sent')   final_outstanding   += finalInv.total_amount ?? 0;
    }

    return {
      stage,
      label: REVENUE_STAGE_LABELS[stage],
      project_count: stageProjects.length,
      total_contract_value,
      deposit_outstanding,
      final_outstanding,
    };
  });

  return pipeline;
}

const REVENUE_STAGE_LABELS: Record<RevenueStage, string> = {
  proposal:          'Proposal Sent',
  signed:            'Contract Signed',
  deposit_invoiced:  'Deposit Invoiced',
  deposit_paid:      'Deposit Received',
  final_invoiced:    'Final Invoice Sent',
  final_paid:        'Fully Paid',
};
```

### Pipeline Summary Metrics

These top-line numbers are shown at the top of the Global Financials view:

```typescript
interface PipelineSummary {
  total_pipeline_value: number;    // sum of all non-cancelled project contract values
  total_collected: number;         // sum of all paid invoice amounts
  total_outstanding: number;       // sum of all 'sent' invoice amounts
  projects_in_progress: number;    // count of projects not in 'proposal' or 'final_paid'
  projects_closed: number;         // count of projects in 'final_paid'
  avg_contract_value: number;      // total_pipeline_value / total non-cancelled projects
}

function computePipelineSummary(pipeline: RevenuePipeline): PipelineSummary {
  const total_pipeline_value = pipeline.reduce((s, stage) => s + stage.total_contract_value, 0);
  const total_outstanding = pipeline.reduce(
    (s, stage) => s + stage.deposit_outstanding + stage.final_outstanding, 0
  );

  // total_collected is derived from paid invoices — must be fetched separately
  // (pipeline tracks current stage values, not historical paid amounts)
  // See: computeCollectedRevenue() below

  const projects_closed      = pipeline.find(s => s.stage === 'final_paid')?.project_count ?? 0;
  const projects_in_progress = pipeline
    .filter(s => s.stage !== 'proposal' && s.stage !== 'final_paid')
    .reduce((sum, s) => sum + s.project_count, 0);

  const total_projects = pipeline.reduce((s, stage) => s + stage.project_count, 0);
  const avg_contract_value = total_projects > 0
    ? total_pipeline_value / total_projects
    : 0;

  return {
    total_pipeline_value,
    total_collected: 0,          // caller must merge with computeCollectedRevenue()
    total_outstanding,
    projects_in_progress,
    projects_closed,
    avg_contract_value,
  };
}

// Fetches total payments received (paid invoices, both deposit and final)
async function computeCollectedRevenue(): Promise<number> {
  const { data } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('status', 'paid');

  return (data ?? []).reduce((s, inv) => s + (inv.total_amount ?? 0), 0);
}
```

---

## 2. Global P&L (All Projects, Period-Filtered)

### Definition

The Global P&L aggregates per-project P&L across all projects, filtered by a date range. Revenue is recognized when the final invoice is paid (`date_paid`). Expenses are attributed by `expense_date`. This matches cash-basis accounting.

### Global P&L Data Shape

```typescript
interface GlobalPnL {
  period_label: string;              // e.g. "Jan–Mar 2026" or "FY 2026"

  // Revenue (cash basis — recognized on final invoice paid date)
  hardware_revenue: number;          // sum of final invoice hardware_subtotal where paid in period
  service_revenue: number;           // sum of final invoice service_fee where paid in period
  total_revenue: number;             // hardware_revenue + service_revenue
  tax_collected: number;             // sum of final invoice tax_amount where paid in period

  // Cost of Goods Sold (from BOM items of projects with final invoice paid in period)
  cogs: number;                      // sum of project_bom_items.est_total_cost for those projects

  // Gross Profit
  gross_profit: number;              // total_revenue - cogs
  gross_margin_pct: number;          // gross_profit / total_revenue

  // Direct Expenses (from expenses table, filtered by expense_date in period)
  total_direct_expenses: number;     // sum of all expenses.amount for period
  labor_expenses: number;            // professional_services category only
  travel_expenses: number;           // airfare + car + fuel + lodging + meals + taxi + train + parking
  shipping_expenses: number;         // outbound_shipping
  hardware_misc_expenses: number;    // misc_hardware + other

  // Team Overhead (from monthly_opex_snapshots for months in period)
  team_hardware_spend: number;       // sum of monthly_opex_snapshots.team_hardware_spend for period
  // Note: team_hardware_spend = Niko direct + Niko indirect portion + Chad indirect + rent + indirect salaries

  // Net Profit
  net_profit: number;                // gross_profit - total_direct_expenses
  net_margin_pct: number;            // net_profit / total_revenue

  // Project count
  projects_closed_in_period: number; // projects with final invoice paid in period
}
```

### Global P&L Calculation

```typescript
async function computeGlobalPnL(
  start_date: string,  // ISO date 'YYYY-MM-DD'
  end_date: string     // ISO date 'YYYY-MM-DD'
): Promise<GlobalPnL> {
  // Step 1: Fetch final invoices paid in period (revenue recognition)
  const { data: finalInvoices } = await supabase
    .from('invoices')
    .select(`
      project_id,
      hardware_subtotal,
      service_fee,
      tax_amount,
      total_amount,
      date_paid
    `)
    .eq('invoice_type', 'final')
    .eq('status', 'paid')
    .gte('date_paid', start_date)
    .lte('date_paid', end_date);

  const paidFinalInvoices = finalInvoices ?? [];
  const closedProjectIds = paidFinalInvoices.map(inv => inv.project_id);

  const hardware_revenue = paidFinalInvoices.reduce((s, inv) => s + (inv.hardware_subtotal ?? 0), 0);
  const service_revenue  = paidFinalInvoices.reduce((s, inv) => s + (inv.service_fee ?? 0), 0);
  const total_revenue    = hardware_revenue + service_revenue;
  const tax_collected    = paidFinalInvoices.reduce((s, inv) => s + (inv.tax_amount ?? 0), 0);

  // Step 2: COGS — BOM items for projects closed in period
  let cogs = 0;
  if (closedProjectIds.length > 0) {
    const { data: bomItems } = await supabase
      .from('project_bom_items')
      .select('est_total_cost')
      .in('project_id', closedProjectIds)
      .not('est_total_cost', 'is', null);

    cogs = (bomItems ?? []).reduce((s, item) => s + (item.est_total_cost ?? 0), 0);
  }

  const gross_profit     = total_revenue - cogs;
  const gross_margin_pct = total_revenue > 0 ? gross_profit / total_revenue : 0;

  // Step 3: Direct expenses in period (all projects, by expense_date)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('category, amount')
    .gte('expense_date', start_date)
    .lte('expense_date', end_date);

  const allExpenses = expenses ?? [];

  const TRAVEL_CATEGORIES: ExpenseCategory[] = [
    'airfare', 'car', 'fuel', 'lodging', 'meals', 'taxi', 'train', 'parking'
  ];

  const labor_expenses          = sumByCategory(allExpenses, ['professional_services']);
  const travel_expenses         = sumByCategory(allExpenses, TRAVEL_CATEGORIES);
  const shipping_expenses       = sumByCategory(allExpenses, ['outbound_shipping']);
  const hardware_misc_expenses  = sumByCategory(allExpenses, ['misc_hardware', 'other']);
  const total_direct_expenses   = allExpenses.reduce((s, e) => s + e.amount, 0);

  // Step 4: Team hardware spend from monthly_opex_snapshots for period
  // Parse period into year/month range
  const startD = new Date(start_date);
  const endD   = new Date(end_date);

  const { data: snapshots } = await supabase
    .from('monthly_opex_snapshots')
    .select('team_hardware_spend, period_year, period_month')
    .gte('period_year', startD.getFullYear())
    .lte('period_year', endD.getFullYear());
  // Note: cross-year month filtering handled client-side below

  const team_hardware_spend = (snapshots ?? [])
    .filter(snap => {
      const snapDate = new Date(snap.period_year, snap.period_month - 1, 1);
      return snapDate >= new Date(startD.getFullYear(), startD.getMonth(), 1) &&
             snapDate <= new Date(endD.getFullYear(), endD.getMonth(), 1);
    })
    .reduce((s, snap) => s + (snap.team_hardware_spend ?? 0), 0);

  const net_profit     = gross_profit - total_direct_expenses;
  const net_margin_pct = total_revenue > 0 ? net_profit / total_revenue : 0;

  return {
    period_label: formatPeriodLabel(start_date, end_date),
    hardware_revenue,
    service_revenue,
    total_revenue,
    tax_collected,
    cogs,
    gross_profit,
    gross_margin_pct,
    total_direct_expenses,
    labor_expenses,
    travel_expenses,
    shipping_expenses,
    hardware_misc_expenses,
    team_hardware_spend,
    net_profit,
    net_margin_pct,
    projects_closed_in_period: closedProjectIds.length,
  };
}

function sumByCategory(expenses: { category: string; amount: number }[], categories: string[]): number {
  return expenses
    .filter(e => categories.includes(e.category))
    .reduce((s, e) => s + e.amount, 0);
}

function formatPeriodLabel(start_date: string, end_date: string): string {
  const startD = new Date(start_date);
  const endD   = new Date(end_date);
  const startLabel = startD.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  const endLabel   = endD.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}
```

---

## 3. HER (Hardware Efficiency Ratio)

### Definition

HER measures how efficiently the hardware operations team generates revenue relative to what they cost. It is calculated monthly and stored in `monthly_opex_snapshots`.

```
HER = hardware_revenue / team_hardware_spend
```

- **hardware_revenue**: Sum of `invoices.hardware_subtotal` for all FINAL invoices where `date_paid` falls within the calendar month. (Deposit invoices excluded — revenue recognized only on final payment.)
- **team_hardware_spend**: Monthly hardware operations cost (Niko direct + Niko indirect portion + Chad indirect + rent + indirect salary overhead)

### Target Thresholds

| HER Value | Interpretation | Display Color |
|-----------|---------------|--------------|
| < 1.0 | Loss — team cost exceeds revenue | Red |
| 1.0 – 1.5 | Break-even — marginal | Yellow |
| 1.5 – 2.0 | Healthy — covers overhead | Green |
| > 2.0 | Strong — well above cost | Green (dark) |
| NULL | No snapshots yet / zero spend | Gray |

### team_hardware_spend Formula (Exact)

```typescript
function computeTeamHardwareSpend(snapshot: MonthlyOpexSnapshot): number {
  const niko_direct    = snapshot.niko_monthly_salary * snapshot.niko_direct_allocation;
  // Niko's direct hardware time (50% default)

  const niko_indirect  = snapshot.niko_monthly_salary * (1 - snapshot.niko_direct_allocation) * 0.50;
  // Half of Niko's indirect time also allocated to hardware overhead

  const chad_indirect  = snapshot.chad_monthly_salary * snapshot.chad_indirect_allocation;
  // Chad's 20% indirect allocation to hardware

  const rent           = snapshot.monthly_rent;
  // Full monthly rent ($2,300) — lab is hardware ops space

  const indirect_pool  = snapshot.monthly_indirect_salaries * 0.20;
  // 20% of indirect salary pool ($12,250 × 0.20 = $2,450) charged to hardware overhead

  return niko_direct + niko_indirect + chad_indirect + rent + indirect_pool;
}
// This formula is stored as a GENERATED ALWAYS column in monthly_opex_snapshots
// (see schema.md lines 1778–1794)
```

### HER by Month (for chart display)

```typescript
interface MonthlyHER {
  year: number;
  month: number;
  label: string;                 // e.g. "Mar 2026"
  hardware_revenue: number;
  team_hardware_spend: number;
  her_ratio: number | null;      // null if team_hardware_spend = 0
  status: 'loss' | 'break_even' | 'healthy' | 'strong' | 'no_data';
}

async function getMonthlyHERHistory(
  startYear: number, startMonth: number,
  endYear: number, endMonth: number
): Promise<MonthlyHER[]> {
  const { data: snapshots } = await supabase
    .from('monthly_opex_snapshots')
    .select('period_year, period_month, hardware_revenue, team_hardware_spend, her_ratio')
    .gte('period_year', startYear)
    .lte('period_year', endYear)
    .order('period_year', { ascending: true })
    .order('period_month', { ascending: true });

  return (snapshots ?? [])
    .filter(snap => {
      if (snap.period_year === startYear && snap.period_month < startMonth) return false;
      if (snap.period_year === endYear   && snap.period_month > endMonth)   return false;
      return true;
    })
    .map(snap => ({
      year:                snap.period_year,
      month:               snap.period_month,
      label:               new Date(snap.period_year, snap.period_month - 1, 1)
                             .toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      hardware_revenue:    snap.hardware_revenue,
      team_hardware_spend: snap.team_hardware_spend ?? 0,
      her_ratio:           snap.her_ratio,
      status:              classifyHER(snap.her_ratio),
    }));
}

function classifyHER(her: number | null): MonthlyHER['status'] {
  if (her === null || her === undefined) return 'no_data';
  if (her < 1.0)  return 'loss';
  if (her < 1.5)  return 'break_even';
  if (her < 2.0)  return 'healthy';
  return 'strong';
}
```

### HER for a Period (Rolling / YTD)

For a multi-month view, HER is computed as the aggregate (not average of monthlies):

```typescript
function computePeriodHER(snapshots: MonthlyOpexSnapshot[]): {
  hardware_revenue: number;
  team_hardware_spend: number;
  her_ratio: number | null;
} {
  const hardware_revenue    = snapshots.reduce((s, snap) => s + snap.hardware_revenue, 0);
  const team_hardware_spend = snapshots.reduce((s, snap) => s + (snap.team_hardware_spend ?? 0), 0);
  const her_ratio           = team_hardware_spend > 0
    ? hardware_revenue / team_hardware_spend
    : null;

  return { hardware_revenue, team_hardware_spend, her_ratio };
}
// Example: YTD Jan–Mar 2026
// hardware_revenue:    $60,000  (3 final invoices paid across 3 months)
// team_hardware_spend: $35,250  (3 × $11,750 assuming Niko $8k/mo, Chad $5k/mo)
// HER = $60,000 / $35,250 = 1.70  → 'healthy'
```

---

## 4. Monthly P&L by Month (Line-by-Line View)

The Global Financials page shows a month-by-month P&L table, one row per month.

### Monthly P&L Row

```typescript
interface MonthlyPnLRow {
  year: number;
  month: number;
  label: string;                         // "Mar 2026"
  projects_closed: number;               // final invoices paid in month
  hardware_revenue: number;              // from paid final invoices
  service_revenue: number;               // from paid final invoices
  total_revenue: number;
  cogs: number;                          // BOM costs of projects closed in month
  gross_profit: number;
  gross_margin_pct: number;
  total_direct_expenses: number;         // from expenses table by expense_date
  team_hardware_spend: number;           // from monthly_opex_snapshots
  net_profit: number;                    // gross_profit - total_direct_expenses
  net_margin_pct: number;
  her_ratio: number | null;             // from monthly_opex_snapshots
  snapshot_exists: boolean;              // whether monthly_opex_snapshots row exists for month
}
```

### Monthly P&L Calculation

```typescript
async function computeMonthlyPnLTable(
  startYear: number, startMonth: number,
  endYear: number, endMonth: number
): Promise<MonthlyPnLRow[]> {
  // Generate all year-month pairs in range
  const months: { year: number; month: number }[] = [];
  let y = startYear, m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    months.push({ year: y, month: m });
    m++;
    if (m > 12) { m = 1; y++; }
  }

  // Fetch all needed data in parallel
  const [finalInvoicesResult, expensesResult, snapshotsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('project_id, hardware_subtotal, service_fee, tax_amount, total_amount, date_paid')
      .eq('invoice_type', 'final')
      .eq('status', 'paid')
      .gte('date_paid', `${startYear}-${String(startMonth).padStart(2, '0')}-01`)
      .lte('date_paid', lastDayOfMonth(endYear, endMonth)),

    supabase
      .from('expenses')
      .select('category, amount, expense_date')
      .gte('expense_date', `${startYear}-${String(startMonth).padStart(2, '0')}-01`)
      .lte('expense_date', lastDayOfMonth(endYear, endMonth)),

    supabase
      .from('monthly_opex_snapshots')
      .select('period_year, period_month, hardware_revenue, team_hardware_spend, her_ratio')
      .gte('period_year', startYear)
      .lte('period_year', endYear),
  ]);

  const finalInvoices = finalInvoicesResult.data ?? [];
  const allExpenses   = expensesResult.data ?? [];
  const snapshots     = snapshotsResult.data ?? [];

  // Fetch COGS for all closed projects in range
  const closedProjectIds = [...new Set(finalInvoices.map(inv => inv.project_id))];
  let bomItemsByProject: Record<string, number> = {};
  if (closedProjectIds.length > 0) {
    const { data: bomItems } = await supabase
      .from('project_bom_items')
      .select('project_id, est_total_cost')
      .in('project_id', closedProjectIds)
      .not('est_total_cost', 'is', null);

    for (const item of bomItems ?? []) {
      bomItemsByProject[item.project_id] =
        (bomItemsByProject[item.project_id] ?? 0) + item.est_total_cost;
    }
  }

  // Build row per month
  return months.map(({ year, month }) => {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd   = lastDayOfMonth(year, month);

    // Invoices paid this month
    const monthInvoices = finalInvoices.filter(inv =>
      inv.date_paid >= monthStart && inv.date_paid <= monthEnd
    );
    const hardware_revenue = monthInvoices.reduce((s, i) => s + (i.hardware_subtotal ?? 0), 0);
    const service_revenue  = monthInvoices.reduce((s, i) => s + (i.service_fee ?? 0), 0);
    const total_revenue    = hardware_revenue + service_revenue;

    // COGS for projects closed this month
    const monthProjectIds = [...new Set(monthInvoices.map(i => i.project_id))];
    const cogs = monthProjectIds.reduce((s, pid) => s + (bomItemsByProject[pid] ?? 0), 0);

    const gross_profit     = total_revenue - cogs;
    const gross_margin_pct = total_revenue > 0 ? gross_profit / total_revenue : 0;

    // Expenses by expense_date this month
    const monthExpenses = allExpenses.filter(e =>
      e.expense_date >= monthStart && e.expense_date <= monthEnd
    );
    const total_direct_expenses = monthExpenses.reduce((s, e) => s + e.amount, 0);

    // Snapshot for this month
    const snapshot = snapshots.find(s => s.period_year === year && s.period_month === month);

    const team_hardware_spend = snapshot?.team_hardware_spend ?? 0;
    const net_profit          = gross_profit - total_direct_expenses;
    const net_margin_pct      = total_revenue > 0 ? net_profit / total_revenue : 0;

    return {
      year,
      month,
      label: new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      projects_closed: monthInvoices.length,
      hardware_revenue,
      service_revenue,
      total_revenue,
      cogs,
      gross_profit,
      gross_margin_pct,
      total_direct_expenses,
      team_hardware_spend,
      net_profit,
      net_margin_pct,
      her_ratio: snapshot?.her_ratio ?? null,
      snapshot_exists: snapshot !== undefined,
    };
  });
}

function lastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}
```

---

## 5. Monthly Close Workflow

The monthly close workflow locks expenses for the month and creates/updates the `monthly_opex_snapshots` row. It is a manual process triggered by the ops person.

### Monthly Close State Machine

```
open → pending_close → closed
```

- **open**: Month is active; expenses can be added/edited freely
- **pending_close**: Ops person has initiated close; reviewing receipts
- **closed**: `monthly_opex_snapshots` row written; month is locked

Note: "Open/closed" state for a month is derived from whether a snapshot row exists, not a separate state column. The UI checks `monthly_opex_snapshots` for existence.

### Close Workflow: Step-by-Step

**Step 1: Navigate to Month**

```
Global Financials → Monthly Close tab → Month picker (month/year selector)
→ System loads all expenses for selected month
```

**Step 2: Review Expenses**

UI shows:
- All expenses grouped by project (project name + venue name as header)
- Per-project expense total
- Category breakdown totals across all projects
- Grand total of all expenses for month

**Step 3: Missing Receipt Check**

```typescript
// System runs before enabling "Close Month" button:
async function getMissingReceiptExpenses(
  start_date: string,
  end_date: string
): Promise<Expense[]> {
  const { data } = await supabase
    .from('expenses')
    .select('id, project_id, expense_date, category, amount, projects(customer_name, venue_name)')
    .gte('expense_date', start_date)
    .lte('expense_date', end_date)
    .is('receipt_url', null)
    .gt('amount', 100);
  // Only flag expenses > $100 — incidentals under $100 do not require receipt
  return data ?? [];
}
// If result is non-empty → show yellow warning banner with count and list
// Soft block only — ops can proceed despite missing receipts
```

**Step 4: Enter Salary Inputs (if not yet configured)**

Before close, ops must verify team salary inputs for the month. UI shows pre-filled values from `settings`:

| Field | Pre-fill source | Override? |
|-------|----------------|-----------|
| Niko monthly salary | `settings.niko_annual_salary / 12` | Yes — per-month override allowed |
| Niko direct allocation | `settings.niko_direct_allocation` | Yes — e.g. heavy install month = 70% |
| Chad monthly salary | `settings.chad_annual_salary / 12` | Yes |
| Chad indirect allocation | `settings.chad_indirect_allocation` | Yes |
| Monthly rent | `settings.annual_rent / 12` | Yes |
| Monthly indirect salaries | `settings.annual_indirect_salaries / 12` | Yes |

**Step 5: Hardware Revenue Verification**

System shows: "Final invoices paid this month: N projects — $X total hardware revenue"
This is the value that will be written to `monthly_opex_snapshots.hardware_revenue`.

```typescript
async function getMonthHardwareRevenue(start_date: string, end_date: string): Promise<number> {
  const { data } = await supabase
    .from('invoices')
    .select('hardware_subtotal')
    .eq('invoice_type', 'final')
    .eq('status', 'paid')
    .gte('date_paid', start_date)
    .lte('date_paid', end_date);

  return (data ?? []).reduce((s, inv) => s + (inv.hardware_subtotal ?? 0), 0);
}
```

**Step 6: Write Snapshot**

```typescript
async function closeMonth(
  year: number,
  month: number,
  inputs: {
    niko_monthly_salary: number;
    niko_direct_allocation: number;
    chad_monthly_salary: number;
    chad_indirect_allocation: number;
    monthly_rent: number;
    monthly_indirect_salaries: number;
    notes?: string;
  }
): Promise<void> {
  const { start_date, end_date } = getMonthDateRange(year, month);

  const hardware_revenue = await getMonthHardwareRevenue(start_date, end_date);

  // Upsert: overwrites existing snapshot if re-closing
  const { error } = await supabase
    .from('monthly_opex_snapshots')
    .upsert({
      period_year:               year,
      period_month:              month,
      niko_monthly_salary:       inputs.niko_monthly_salary,
      niko_direct_allocation:    inputs.niko_direct_allocation,
      chad_monthly_salary:       inputs.chad_monthly_salary,
      chad_indirect_allocation:  inputs.chad_indirect_allocation,
      monthly_rent:              inputs.monthly_rent,
      monthly_indirect_salaries: inputs.monthly_indirect_salaries,
      hardware_revenue,
      notes:                     inputs.notes ?? null,
      // team_hardware_spend and her_ratio are GENERATED ALWAYS — computed by Postgres
    }, { onConflict: 'period_year,period_month' });

  if (error) throw error;
  // After upsert, team_hardware_spend and her_ratio are auto-computed by Postgres
}

function getMonthDateRange(year: number, month: number): { start_date: string; end_date: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end   = lastDayOfMonth(year, month);
  return { start_date: start, end_date: end };
}
```

**Step 7: Confirmation**

After successful upsert, UI shows:
- "March 2026 closed"
- HER ratio for the month: {value} ({classification})
- team_hardware_spend breakdown (Niko direct, Niko indirect, Chad, rent, indirect pool)
- hardware_revenue for month
- Option: "View in Global P&L"

### Re-Close Guard

If `monthly_opex_snapshots` already has a row for the selected month, UI shows:

> "March 2026 was already closed on {snapshot.updated_at}. Re-closing will update the snapshot with current invoice and salary data."

Ops must click "Re-close Month" (distinct button from initial "Close Month") to proceed.

---

## 6. Aging Receivables Report

### Definition

All invoices in `'sent'` status (sent to customer but not yet paid). Grouped into buckets by days since `date_sent`.

### Aging Buckets

| Bucket | Days Since date_sent | UI Color | Action |
|--------|---------------------|----------|--------|
| `current` | 0–30 days | Green | None |
| `past_due_30` | 31–60 days | Yellow | Send reminder |
| `past_due_60` | 61–90 days | Orange | Call customer |
| `past_due_90` | 90+ days | Red | Escalate to Andy (PM) |

### Aging Receivables Query

```typescript
interface AgingReceivable {
  invoice_id: string;
  project_id: string;
  customer_name: string;
  venue_name: string;
  invoice_type: 'deposit' | 'final';
  invoice_number: string | null;
  total_amount: number;
  date_sent: string;
  days_outstanding: number;
  aging_bucket: 'current' | 'past_due_30' | 'past_due_60' | 'past_due_90';
}

async function getAgingReceivables(): Promise<AgingReceivable[]> {
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id,
      project_id,
      invoice_type,
      invoice_number,
      total_amount,
      date_sent,
      projects (customer_name, venue_name)
    `)
    .eq('status', 'sent')
    .not('date_sent', 'is', null)
    .order('date_sent', { ascending: true });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (invoices ?? []).map(inv => {
    const sentDate = new Date(inv.date_sent);
    sentDate.setHours(0, 0, 0, 0);
    const days_outstanding = Math.floor((today.getTime() - sentDate.getTime()) / 86400000);

    let aging_bucket: AgingReceivable['aging_bucket'];
    if (days_outstanding <= 30)      aging_bucket = 'current';
    else if (days_outstanding <= 60) aging_bucket = 'past_due_30';
    else if (days_outstanding <= 90) aging_bucket = 'past_due_60';
    else                             aging_bucket = 'past_due_90';

    return {
      invoice_id:       inv.id,
      project_id:       inv.project_id,
      customer_name:    inv.projects?.customer_name ?? '',
      venue_name:       inv.projects?.venue_name ?? '',
      invoice_type:     inv.invoice_type,
      invoice_number:   inv.invoice_number,
      total_amount:     inv.total_amount ?? 0,
      date_sent:        inv.date_sent,
      days_outstanding,
      aging_bucket,
    };
  });
}
```

### Aging Summary (for dashboard card)

```typescript
interface AgingSummary {
  total_outstanding: number;
  by_bucket: {
    current:      { count: number; amount: number };
    past_due_30:  { count: number; amount: number };
    past_due_60:  { count: number; amount: number };
    past_due_90:  { count: number; amount: number };
  };
}

function computeAgingSummary(receivables: AgingReceivable[]): AgingSummary {
  const buckets = ['current', 'past_due_30', 'past_due_60', 'past_due_90'] as const;
  const by_bucket = Object.fromEntries(
    buckets.map(bucket => [
      bucket,
      {
        count:  receivables.filter(r => r.aging_bucket === bucket).length,
        amount: receivables.filter(r => r.aging_bucket === bucket)
                           .reduce((s, r) => s + r.total_amount, 0),
      }
    ])
  ) as AgingSummary['by_bucket'];

  return {
    total_outstanding: receivables.reduce((s, r) => s + r.total_amount, 0),
    by_bucket,
  };
}
```

---

## 7. Per-Project P&L (Reference to invoicing-expenses.md)

Per-project P&L is fully specified in `final-mega-spec/business-logic/invoicing-expenses.md`, Section 7 (`computeProjectPnL`). Summary of what is covered there:

- Revenue: `hardware_subtotal + service_fee` (pre-tax)
- COGS: `SUM(project_bom_items.est_total_cost)`
- Gross profit and margin
- Labor, travel, shipping, misc expense breakdowns
- Net profit and net margin
- Tax amount (informational)
- Cash-flow tracking (total invoiced vs total collected)

The Global Financials view links to per-project P&L detail from the monthly P&L table rows (clicking a row shows that month's closed projects and each project's individual P&L).

---

## 8. Validation Rules

### Monthly Close Guards

| Rule | Error |
|------|-------|
| `niko_monthly_salary < 0` | "Niko salary cannot be negative" |
| `chad_monthly_salary < 0` | "Chad salary cannot be negative" |
| `niko_direct_allocation` not in [0, 1] | "Direct allocation must be between 0% and 100%" |
| `chad_indirect_allocation` not in [0, 1] | "Indirect allocation must be between 0% and 100%" |
| `monthly_rent < 0` | "Monthly rent cannot be negative" |
| `monthly_indirect_salaries < 0` | "Indirect salaries cannot be negative" |
| Both `niko_monthly_salary = 0` AND `chad_monthly_salary = 0` | Warning: "Team salaries are $0 — HER will be undefined. Set salaries in Settings." |
| `period_year < 2020` or `> 2050` | "Invalid year — must be between 2020 and 2050" |

### HER Display Guards

| Condition | Display |
|-----------|---------|
| `team_hardware_spend = 0` | "HER: N/A (no team cost configured)" |
| `hardware_revenue = 0` | "HER: 0.00 — no final invoices paid this month" |
| Snapshot does not exist for month | "Not yet closed — close month to compute HER" |

---

## 9. Pre-Set Period Filters (UI Convenience)

The Global Financials page provides quick date range selectors:

| Filter | start_date | end_date |
|--------|-----------|---------|
| This Month | 1st of current month | Last day of current month |
| Last Month | 1st of previous month | Last day of previous month |
| Last 3 Months | 1st of month-3 | Last day of current month |
| Last 6 Months | 1st of month-6 | Last day of current month |
| This Year (YTD) | Jan 1 of current year | Last day of current month |
| Last Year | Jan 1 of previous year | Dec 31 of previous year |
| Custom | User-selected start | User-selected end |

```typescript
function getPeriodDateRange(
  preset: 'this_month' | 'last_month' | 'last_3' | 'last_6' | 'ytd' | 'last_year' | 'custom',
  customStart?: string,
  customEnd?: string
): { start_date: string; end_date: string } {
  const now = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;  // 1–12

  switch (preset) {
    case 'this_month':
      return getMonthDateRange(year, month);

    case 'last_month': {
      const lm = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
      return getMonthDateRange(lm.y, lm.m);
    }

    case 'last_3': {
      const startMonth = month - 2 <= 0 ? month + 10 : month - 2;
      const startYear  = month - 2 <= 0 ? year - 1  : year;
      return {
        start_date: `${startYear}-${String(startMonth).padStart(2, '0')}-01`,
        end_date:   lastDayOfMonth(year, month),
      };
    }

    case 'last_6': {
      const startMonth = month - 5 <= 0 ? month + 7 : month - 5;
      const startYear  = month - 5 <= 0 ? year - 1 : year;
      return {
        start_date: `${startYear}-${String(startMonth).padStart(2, '0')}-01`,
        end_date:   lastDayOfMonth(year, month),
      };
    }

    case 'ytd':
      return {
        start_date: `${year}-01-01`,
        end_date:   lastDayOfMonth(year, month),
      };

    case 'last_year':
      return {
        start_date: `${year - 1}-01-01`,
        end_date:   `${year - 1}-12-31`,
      };

    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom period requires both start and end dates');
      }
      return { start_date: customStart, end_date: customEnd };
  }
}
```

---

## 10. Service Layer Functions (Supabase Client)

File path: `src/services/financialReportingService.ts`

```typescript
// Revenue Pipeline
export async function computeRevenuePipeline(): Promise<RevenuePipeline>
export async function computeCollectedRevenue(): Promise<number>

// Global P&L
export async function computeGlobalPnL(start_date: string, end_date: string): Promise<GlobalPnL>
export async function computeMonthlyPnLTable(
  startYear: number, startMonth: number,
  endYear: number, endMonth: number
): Promise<MonthlyPnLRow[]>

// HER
export async function getMonthlyHERHistory(
  startYear: number, startMonth: number,
  endYear: number, endMonth: number
): Promise<MonthlyHER[]>
export function computePeriodHER(snapshots: MonthlyOpexSnapshot[]): {
  hardware_revenue: number;
  team_hardware_spend: number;
  her_ratio: number | null;
}
export function classifyHER(her: number | null): MonthlyHER['status']

// Aging Receivables
export async function getAgingReceivables(): Promise<AgingReceivable[]>
export function computeAgingSummary(receivables: AgingReceivable[]): AgingSummary

// Monthly Close
export async function closeMonth(year: number, month: number, inputs: MonthlyCloseInputs): Promise<void>
export async function getMonthHardwareRevenue(start_date: string, end_date: string): Promise<number>
export async function getMissingReceiptExpenses(start_date: string, end_date: string): Promise<Expense[]>
export async function getMonthlyOpexSnapshot(year: number, month: number): Promise<MonthlyOpexSnapshot | null>
export async function getMonthlyOpexSnapshots(
  startYear: number, startMonth: number,
  endYear: number, endMonth: number
): Promise<MonthlyOpexSnapshot[]>

// Period Utilities
export function getPeriodDateRange(preset: PeriodPreset, customStart?: string, customEnd?: string): { start_date: string; end_date: string }
export function getMonthDateRange(year: number, month: number): { start_date: string; end_date: string }
export function lastDayOfMonth(year: number, month: number): string
export function formatPeriodLabel(start_date: string, end_date: string): string

// Pipeline Summary (client-side)
export function computePipelineSummary(pipeline: RevenuePipeline): PipelineSummary
```

---

## 11. Concrete Example (Full Monthly Close — March 2026)

Scenario: 2 projects closed in March 2026, Niko salary $8,000/mo, Chad $5,000/mo.

**Final invoices paid in March 2026**:
- Project A (Autonomous, 4 courts): hardware_subtotal = $22,400, service_fee = $17,500, total = $43,988
- Project B (Pro, 6 courts): hardware_subtotal = $18,333, service_fee = $20,000, total = $42,262

**Hardware revenue** = $22,400 + $18,333 = **$40,733**

**BOM COGS** (from project_bom_items.est_total_cost):
- Project A: $18,500
- Project B: $15,000
- Total COGS = **$33,500**

**Gross profit** = $40,733 (hardware) + $17,500 + $20,000 (service) − $33,500 (COGS)
= $78,233 − $33,500 = **$44,733**
**Gross margin** = $44,733 / $78,233 = **57.2%**

**Direct expenses in March** (from expenses table):
- Airfare × 2 trips: $3,600
- Lodging (8 nights): $2,000
- Car rental: $800
- Installer labor: $4,800 (40 hrs × $120)
- Shipping: $450
- Total direct expenses = **$11,650**

**Net profit** = $44,733 − $11,650 = **$33,083**
**Net margin** = $33,083 / $78,233 = **42.3%**

**Team hardware spend (March)**:
```
Niko direct:      $8,000 × 0.50     =  $4,000
Niko indirect:    $8,000 × 0.50 × 0.50 = $2,000
Chad indirect:    $5,000 × 0.20     =  $1,000
Rent:                                =  $2,300
Indirect pool:    $12,250 × 0.20    =  $2,450
                              TOTAL =  $11,750
```

**HER** = $40,733 / $11,750 = **3.47** → classification: **strong**

---

## 12. Edge Cases

### Month With No Closed Projects

- `hardware_revenue = 0`, `service_revenue = 0`, `cogs = 0`
- `gross_profit = 0`, `net_profit = -(total_direct_expenses)` if expenses exist
- HER = 0.00 — not null (team spend is non-zero even if no revenue)
- UI shows: "No projects closed this month — revenue recognized only on final invoice payment"

### Month With No Snapshot

- `snapshot_exists = false` in MonthlyPnLRow
- `team_hardware_spend = 0` (snapshot not yet created)
- HER displayed as "Not closed" badge
- UI shows "Close month" button in the monthly row

### Cancelled Projects With Outstanding Invoices

- Projects with `project_status = 'cancelled'` may still have `invoices.status = 'sent'`
- These appear in aging receivables with a "Cancelled" badge
- They are included in `total_outstanding` calculation
- Revenue pipeline excludes cancelled projects from funnel counts but includes their outstanding invoices in aging

### Revenue Recognized vs. Invoiced

- Revenue pipeline shows INVOICED amounts (contract value)
- Global P&L shows RECOGNIZED revenue (paid final invoices only)
- These differ when projects have been invoiced but not yet paid
- Dashboard must label clearly: "Revenue Pipeline" vs. "Recognized Revenue"

### Partial Month on First/Last Month of Range

When the selected start or end date is mid-month (custom period only):
- Expenses filtered by exact `expense_date` — partial month expenses included as expected
- Final invoices filtered by exact `date_paid` — partial month recognition
- `monthly_opex_snapshots` for that month is included in full (whole month snapshot, not prorated)
- UI shows note: "Team spend figures reflect full calendar month snapshots"

### Missing Salary Data (Zeroed Settings)

If `settings.niko_annual_salary = 0` and `settings.chad_annual_salary = 0` (unconfigured defaults):
- `monthly_opex_snapshots.team_hardware_spend` = only rent + indirect pool = $2,300 + $2,450 = $4,750/mo
- HER is computable but skewed high (understates team cost)
- UI warning on Settings page: "Niko salary and Chad salary are not configured. HER calculations will be incorrect until salaries are entered."
