# PodPlay Ops Wizard — Global Financials Page

**Aspect**: design-financials-view
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Route**: `/financials`
**Route file**: `src/routes/_auth/financials/index.tsx`
**Component file**: `src/components/financials/FinancialsPage.tsx`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `invoices`, `expenses`, `projects`, `monthly_opex_snapshots`, `project_bom_items`, `settings`
**Logic reference**: `final-mega-spec/business-logic/financial-reporting.md`, `invoicing-expenses.md`, `reconciliation.md`

---

## Overview

The Global Financials page is the cross-project financial command center. It replaces the MRP's FINANCIALS, INVOICING, and EXPENSES tabs. It is organized into six tabs:

| Tab | Replaces MRP Sheet | Primary Use |
|-----|--------------------|-------------|
| Pipeline | INVOICING (funnel section) | Revenue funnel by stage |
| P&L | EXPENSES + FINANCIALS | Monthly P&L table, period-filtered |
| HER | FINANCIALS (HER section) | Hardware Efficiency Ratio chart |
| Receivables | INVOICING (aging section) | Unpaid invoices by aging bucket |
| Per-Project | CUSTOMER MASTER (financial cols) | All projects with P&L summary |
| Reconciliation | Manual cross-tab verification | 5 automated consistency checks |
| Monthly Close | Monthly snapshot workflow | Close month + team OpEx config |

The period selector (this month / last month / last 3 months / last 6 months / YTD / last year / custom) appears in the header for the P&L, HER, and Per-Project tabs. The Pipeline, Receivables, and Reconciliation tabs are period-independent (always current state).

---

## Route Configuration

**File**: `src/routes/_auth/financials/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getRevenuePipeline, computeCollectedRevenue } from '@/services/financialReportingService'
import { getAgingReceivables } from '@/services/invoicingService'
import { FinancialsPage } from '@/components/financials/FinancialsPage'

const financialsSearchSchema = z.object({
  tab: z.enum([
    'pipeline', 'pl', 'her', 'receivables', 'per-project', 'reconciliation', 'monthly-close'
  ]).default('pipeline'),
  period: z.enum([
    'this_month', 'last_month', 'last_3', 'last_6', 'ytd', 'last_year', 'custom'
  ]).default('ytd'),
  start_date: z.string().optional(),   // ISO 'YYYY-MM-DD', used when period='custom'
  end_date: z.string().optional(),     // ISO 'YYYY-MM-DD', used when period='custom'
  close_month: z.string().optional(),  // 'YYYY-MM', used by Monthly Close tab
})

export type FinancialsSearch = z.infer<typeof financialsSearchSchema>

export const Route = createFileRoute('/_auth/financials/')({
  validateSearch: (search) => financialsSearchSchema.parse(search),
  loader: async () => {
    // Load pipeline and receivables at route entry (always displayed, period-independent)
    const [pipeline, collected, receivables] = await Promise.all([
      getRevenuePipeline(),
      computeCollectedRevenue(),
      getAgingReceivables(),
    ])
    return { pipeline, collected, receivables }
  },
  component: FinancialsPage,
  pendingComponent: FinancialsSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
      <p className="text-destructive font-medium">Failed to load financials</p>
      <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  ),
})
```

---

## Service Layer

**File**: `src/services/financialReportingService.ts`

All functions are defined and fully specified in `final-mega-spec/business-logic/financial-reporting.md`.
Summary of functions used by this page:

```typescript
// Pipeline
export async function getRevenuePipeline(): Promise<RevenuePipeline>
export async function computeCollectedRevenue(): Promise<number>
export function computePipelineSummary(pipeline: RevenuePipeline): PipelineSummary

// P&L
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
export function computePeriodHER(snapshots: MonthlyOpexSnapshot[]): { hardware_revenue: number; team_hardware_spend: number; her_ratio: number | null }
export function classifyHER(her: number | null): 'loss' | 'break_even' | 'healthy' | 'strong' | 'no_data'

// Aging
export async function getAgingReceivables(): Promise<AgingReceivable[]>
export function getAgingBucket(dateSent: Date): AgingBucket

// Per-Project
export async function getAllProjectsWithPnL(): Promise<ProjectPnLSummary[]>

// Monthly Close
export async function closeMonth(year: number, month: number, settings: Settings): Promise<void>
export async function getMonthlyOpexSnapshot(year: number, month: number): Promise<MonthlyOpexSnapshot | null>
export async function getMissingReceiptExpenses(start_date: string, end_date: string): Promise<Expense[]>
```

**File**: `src/services/reconciliation.ts`

All functions fully specified in `final-mega-spec/business-logic/reconciliation.md`.

```typescript
export async function runAllReconciliationChecks(): Promise<ReconciliationReport>
export async function runR1InventoryVsMovements(): Promise<R1Row[]>
export async function runR2POReceiptsVsMovements(): Promise<R2Row[]>
export async function runR3BomVsPOCosts(): Promise<R3Row[]>
export async function runR4ProjectCostVsInvoice(): Promise<R4Row[]>
export async function runR5RevenueStageVsInvoice(): Promise<R5Row[]>
export async function syncRevenueStage(projectId: string): Promise<void>  // R5 auto-fix
```

### New Type: `ProjectPnLSummary`

Used by the Per-Project tab — not defined elsewhere.

```typescript
// src/services/financialReportingService.ts

export interface ProjectPnLSummary {
  project_id: string
  customer_name: string
  venue_name: string
  tier: ServiceTier
  court_count: number
  project_status: ProjectStatus
  revenue_stage: RevenueStage
  go_live_date: string | null

  // P&L fields (may be null if BOM not approved or project not closed)
  hardware_subtotal: number | null    // from deposit invoice
  service_fee: number | null          // from deposit invoice
  revenue: number | null              // hardware_subtotal + service_fee
  cogs: number | null                 // SUM(project_bom_items.est_total_cost)
  gross_profit: number | null         // revenue - cogs
  gross_margin_pct: number | null     // gross_profit / revenue

  total_expenses: number              // SUM(expenses.amount) — always present (0 if none)
  net_profit: number | null           // gross_profit - total_expenses

  // Collection status
  deposit_status: InvoiceStatus       // 'not_sent' | 'sent' | 'paid'
  final_status: InvoiceStatus
  total_collected: number             // sum of paid invoice total_amounts
  total_outstanding: number           // sum of sent (unpaid) invoice total_amounts
}

export async function getAllProjectsWithPnL(): Promise<ProjectPnLSummary[]> {
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      customer_name,
      venue_name,
      tier,
      court_count,
      project_status,
      revenue_stage,
      go_live_date,
      invoices (
        invoice_type,
        status,
        hardware_subtotal,
        service_fee,
        total_amount
      ),
      expenses ( amount ),
      project_bom_items ( est_total_cost )
    `)
    .neq('project_status', 'cancelled')
    .order('created_at', { ascending: false })

  return (projects ?? []).map((p) => {
    const depositInv = p.invoices?.find((i: any) => i.invoice_type === 'deposit')
    const finalInv   = p.invoices?.find((i: any) => i.invoice_type === 'final')

    const hardware_subtotal = depositInv?.hardware_subtotal ?? null
    const service_fee       = depositInv?.service_fee ?? null
    const revenue           = hardware_subtotal !== null && service_fee !== null
      ? hardware_subtotal + service_fee
      : null

    const cogs = p.project_bom_items?.length > 0
      ? p.project_bom_items
          .filter((b: any) => b.est_total_cost !== null)
          .reduce((s: number, b: any) => s + b.est_total_cost, 0)
      : null

    const gross_profit = revenue !== null && cogs !== null ? revenue - cogs : null
    const gross_margin_pct = revenue !== null && gross_profit !== null && revenue > 0
      ? gross_profit / revenue
      : null

    const total_expenses = (p.expenses ?? []).reduce((s: number, e: any) => s + e.amount, 0)

    const net_profit = gross_profit !== null ? gross_profit - total_expenses : null

    const paidInvoices = (p.invoices ?? []).filter((i: any) => i.status === 'paid')
    const sentInvoices = (p.invoices ?? []).filter((i: any) => i.status === 'sent' || i.status === 'paid')
    const total_collected   = paidInvoices.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0)
    const total_outstanding = sentInvoices
      .filter((i: any) => i.status === 'sent')
      .reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0)

    return {
      project_id: p.id,
      customer_name: p.customer_name,
      venue_name: p.venue_name,
      tier: p.tier,
      court_count: p.court_count,
      project_status: p.project_status,
      revenue_stage: p.revenue_stage,
      go_live_date: p.go_live_date,
      hardware_subtotal,
      service_fee,
      revenue,
      cogs,
      gross_profit,
      gross_margin_pct,
      total_expenses,
      net_profit,
      deposit_status: depositInv?.status ?? 'not_sent',
      final_status: finalInv?.status ?? 'not_sent',
      total_collected,
      total_outstanding,
    }
  })
}
```

### Period Resolution Helper

```typescript
// src/lib/periodUtils.ts

export type PeriodPreset =
  | 'this_month' | 'last_month' | 'last_3' | 'last_6'
  | 'ytd' | 'last_year' | 'custom'

export function resolvePeriod(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string
): { start_date: string; end_date: string; startYear: number; startMonth: number; endYear: number; endMonth: number } {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() + 1  // 1-12

  let start: Date
  let end: Date = today

  switch (preset) {
    case 'this_month':
      start = new Date(y, m - 1, 1)
      break
    case 'last_month':
      start = new Date(y, m - 2, 1)
      end   = new Date(y, m - 1, 0)   // last day of prior month
      break
    case 'last_3':
      start = new Date(y, m - 3, 1)
      break
    case 'last_6':
      start = new Date(y, m - 6, 1)
      break
    case 'ytd':
      start = new Date(y, 0, 1)
      break
    case 'last_year':
      start = new Date(y - 1, 0, 1)
      end   = new Date(y - 1, 11, 31)
      break
    case 'custom':
      if (!customStart || !customEnd) throw new Error('Custom period requires start_date and end_date')
      start = new Date(customStart)
      end   = new Date(customEnd)
      break
  }

  const toISO = (d: Date) => d.toISOString().split('T')[0]

  return {
    start_date: toISO(start),
    end_date:   toISO(end),
    startYear:  start.getFullYear(),
    startMonth: start.getMonth() + 1,
    endYear:    end.getFullYear(),
    endMonth:   end.getMonth() + 1,
  }
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  this_month: 'This Month',
  last_month: 'Last Month',
  last_3:     'Last 3 Months',
  last_6:     'Last 6 Months',
  ytd:        'Year to Date',
  last_year:  'Last Year',
  custom:     'Custom Range',
}
```

---

## Page Layout

**File**: `src/components/financials/FinancialsPage.tsx`

```
┌───────────────────────────────────────────────────────────────────────┐
│  HEADER BAR                                                            │
│  Financials                    [Period Selector — shown for P&L/HER]  │
├───────────────────────────────────────────────────────────────────────┤
│  TAB BAR                                                               │
│  [Pipeline] [P&L] [HER] [Receivables] [Per-Project]                   │
│  [Reconciliation] [Monthly Close]                                      │
├───────────────────────────────────────────────────────────────────────┤
│  TAB CONTENT AREA                                                      │
│  (changes per active tab)                                              │
└───────────────────────────────────────────────────────────────────────┘
```

**Props**: none — reads route loader data + search params.

**State** (all in URL via navigate):
- `tab` — active tab
- `period` / `start_date` / `end_date` — period selector state
- `close_month` — Monthly Close tab selected month

**Data access**:
```typescript
const { pipeline, collected, receivables } = Route.useLoaderData()
const search = Route.useSearch()
const navigate = useNavigate()
const resolvedPeriod = useMemo(
  () => resolvePeriod(search.period, search.start_date, search.end_date),
  [search.period, search.start_date, search.end_date]
)
```

---

## Component: Header Bar

```tsx
<div className="flex items-center justify-between px-6 py-4 border-b">
  <h1 className="text-2xl font-semibold">Financials</h1>
  {/* Period selector shown only for period-dependent tabs */}
  {['pl', 'her', 'per-project'].includes(search.tab) && (
    <PeriodSelector
      value={search.period}
      customStart={search.start_date}
      customEnd={search.end_date}
      onChange={(period, start, end) =>
        navigate({ search: (prev) => ({ ...prev, period, start_date: start, end_date: end }) })
      }
    />
  )}
</div>
```

---

## Component: Tab Bar

```tsx
<Tabs
  value={search.tab}
  onValueChange={(tab) =>
    navigate({ search: (prev) => ({ ...prev, tab: tab as FinancialsSearch['tab'] }) })
  }
>
  <TabsList className="mx-6 mt-4 mb-0 h-9">
    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
    <TabsTrigger value="pl">P&L</TabsTrigger>
    <TabsTrigger value="her">HER</TabsTrigger>
    <TabsTrigger value="receivables">
      Receivables
      {receivables.length > 0 && (
        <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0">
          {receivables.length}
        </Badge>
      )}
    </TabsTrigger>
    <TabsTrigger value="per-project">Per-Project</TabsTrigger>
    <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
    <TabsTrigger value="monthly-close">Monthly Close</TabsTrigger>
  </TabsList>

  <TabsContent value="pipeline" className="px-6 py-4">
    <PipelineTab pipeline={pipeline} collected={collected} />
  </TabsContent>
  <TabsContent value="pl" className="px-6 py-4">
    <PLTab period={resolvedPeriod} />
  </TabsContent>
  <TabsContent value="her" className="px-6 py-4">
    <HERTab period={resolvedPeriod} />
  </TabsContent>
  <TabsContent value="receivables" className="px-6 py-4">
    <ReceivablesTab receivables={receivables} />
  </TabsContent>
  <TabsContent value="per-project" className="px-6 py-4">
    <PerProjectTab period={resolvedPeriod} />
  </TabsContent>
  <TabsContent value="reconciliation" className="px-6 py-4">
    <ReconciliationTab />
  </TabsContent>
  <TabsContent value="monthly-close" className="px-6 py-4">
    <MonthlyCloseTab closeMonth={search.close_month} />
  </TabsContent>
</Tabs>
```

---

## Component: PeriodSelector

**File**: `src/components/financials/PeriodSelector.tsx`

```tsx
interface PeriodSelectorProps {
  value: PeriodPreset
  customStart?: string
  customEnd?: string
  onChange: (period: PeriodPreset, start?: string, end?: string) => void
}
```

**Layout**: Single `Select` for presets; when `custom` is chosen, two `Input type="date"` fields appear inline.

```tsx
<div className="flex items-center gap-2">
  <Select
    value={value}
    onValueChange={(v) => {
      const p = v as PeriodPreset
      if (p !== 'custom') onChange(p, undefined, undefined)
      else onChange('custom', customStart ?? today, customEnd ?? today)
    }}
  >
    <SelectTrigger className="w-44">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="this_month">This Month</SelectItem>
      <SelectItem value="last_month">Last Month</SelectItem>
      <SelectItem value="last_3">Last 3 Months</SelectItem>
      <SelectItem value="last_6">Last 6 Months</SelectItem>
      <SelectItem value="ytd">Year to Date</SelectItem>
      <SelectItem value="last_year">Last Year</SelectItem>
      <SelectItem value="custom">Custom Range</SelectItem>
    </SelectContent>
  </Select>

  {value === 'custom' && (
    <div className="flex items-center gap-1.5">
      <Input
        type="date"
        className="w-36 h-9 text-sm"
        value={customStart ?? ''}
        onChange={(e) => onChange('custom', e.target.value, customEnd)}
      />
      <span className="text-muted-foreground text-sm">–</span>
      <Input
        type="date"
        className="w-36 h-9 text-sm"
        value={customEnd ?? ''}
        onChange={(e) => onChange('custom', customStart, e.target.value)}
      />
    </div>
  )}
</div>
```

---

## Tab 1: Pipeline

**File**: `src/components/financials/PipelineTab.tsx`

**Props**:
```typescript
interface PipelineTabProps {
  pipeline: RevenuePipeline
  collected: number
}
```

### Summary Cards

```
┌─────────────────────────────────────────────────────────────────┐
│  [Pipeline: $430K]  [Collected: $85K]  [Outstanding: $12K]      │
│  [In Progress: 5]   [Closed: 3]        [Avg Contract: $42K]     │
└─────────────────────────────────────────────────────────────────┘
```

Six cards in a 3×2 grid (`grid-cols-3 gap-4`):

| Card | Value | Source |
|------|-------|--------|
| Total Pipeline | `$${summary.total_pipeline_value.toLocaleString()}` | computePipelineSummary |
| Total Collected | `$${collected.toLocaleString()}` | computeCollectedRevenue |
| Outstanding | `$${summary.total_outstanding.toLocaleString()}` | computePipelineSummary; amber color if > 0 |
| In Progress | `${summary.projects_in_progress}` | computePipelineSummary |
| Closed | `${summary.projects_closed}` | computePipelineSummary; green if > 0 |
| Avg Contract | `$${summary.avg_contract_value.toLocaleString('en-US', { maximumFractionDigits: 0 })}` | computePipelineSummary |

```tsx
const summary = computePipelineSummary(pipeline)
// Note: merge collected into summary for total_collected display
```

### Pipeline Stage Cards

Six cards in a horizontal row or `grid-cols-6` with `min-w-[140px]`.

Each stage card:

```tsx
<Card className={cn(
  "p-4 flex flex-col gap-2",
  stage.project_count === 0 && "opacity-50"
)}>
  <div className="flex items-center gap-2">
    <div className={cn("h-2.5 w-2.5 rounded-full", STAGE_DOT_COLOR[stage.stage])} />
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {stage.label}
    </span>
  </div>
  <p className="text-3xl font-bold">{stage.project_count}</p>
  <p className="text-sm text-muted-foreground">
    {stage.total_contract_value > 0
      ? `$${(stage.total_contract_value / 1000).toFixed(0)}K total`
      : 'No projects'
    }
  </p>
  {stage.deposit_outstanding > 0 && (
    <p className="text-xs text-amber-600">
      ${(stage.deposit_outstanding / 1000).toFixed(0)}K deposit outstanding
    </p>
  )}
  {stage.final_outstanding > 0 && (
    <p className="text-xs text-amber-600">
      ${(stage.final_outstanding / 1000).toFixed(0)}K final outstanding
    </p>
  )}
</Card>
```

Stage dot colors (`STAGE_DOT_COLOR`):

| Stage | Color class |
|-------|-------------|
| `proposal` | `bg-gray-400` |
| `signed` | `bg-blue-500` |
| `deposit_invoiced` | `bg-yellow-500` |
| `deposit_paid` | `bg-green-500` |
| `final_invoiced` | `bg-orange-500` |
| `final_paid` | `bg-green-700` |

Stage cards are arranged left-to-right in order: Proposal → Signed → Deposit Invoiced → Deposit Received → Final Invoice Sent → Fully Paid. A thin arrow `→` separator (`ChevronRight` icon, `text-muted-foreground`) separates each pair.

### Empty State (all zero counts)

```tsx
{pipeline.every(s => s.project_count === 0) && (
  <div className="py-12 text-center">
    <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
    <p className="font-medium">No active projects</p>
    <p className="text-sm text-muted-foreground mt-1">
      Create a project to see the revenue pipeline.
    </p>
  </div>
)}
```

---

## Tab 2: P&L

**File**: `src/components/financials/PLTab.tsx`

**Props**:
```typescript
interface PLTabProps {
  period: ResolvedPeriod   // { start_date, end_date, startYear, startMonth, endYear, endMonth }
}
```

**Data fetching** (client-side, not in route loader — period changes are frequent):
```typescript
const { data: globalPnL, isLoading: pnlLoading } = useQuery({
  queryKey: ['global_pnl', period.start_date, period.end_date],
  queryFn: () => computeGlobalPnL(period.start_date, period.end_date),
})

const { data: monthlyRows, isLoading: monthlyLoading } = useQuery({
  queryKey: ['monthly_pnl', period.startYear, period.startMonth, period.endYear, period.endMonth],
  queryFn: () => computeMonthlyPnLTable(period.startYear, period.startMonth, period.endYear, period.endMonth),
})
```

### P&L Summary Cards

8 cards in `grid-cols-4 gap-4` (two rows of 4):

**Row 1** — Revenue and profit:

| Card | Value | Color |
|------|-------|-------|
| Total Revenue | `$${globalPnL.total_revenue.toLocaleString()}` | green if > 0 |
| Hardware Revenue | `$${globalPnL.hardware_revenue.toLocaleString()}` | — |
| Service Revenue | `$${globalPnL.service_revenue.toLocaleString()}` | — |
| Tax Collected | `$${globalPnL.tax_collected.toLocaleString()}` | muted |

**Row 2** — Cost and margin:

| Card | Value | Color |
|------|-------|-------|
| Gross Profit | `$${globalPnL.gross_profit.toLocaleString()} (${(globalPnL.gross_margin_pct * 100).toFixed(1)}%)` | green if ≥ 0, red if < 0 |
| Net Profit | `$${globalPnL.net_profit.toLocaleString()} (${(globalPnL.net_margin_pct * 100).toFixed(1)}%)` | green if ≥ 0, red if < 0 |
| Total COGS | `$${globalPnL.cogs.toLocaleString()}` | — |
| Total Expenses | `$${globalPnL.total_direct_expenses.toLocaleString()}` | — |

Below the cards, a small note showing project count:
```tsx
<p className="text-sm text-muted-foreground mt-1">
  {globalPnL.projects_closed_in_period} project{globalPnL.projects_closed_in_period !== 1 ? 's' : ''} closed in this period
</p>
```

### Expense Breakdown Row

Below the summary cards, a single horizontal bar breaking down expenses by category, shown as a `grid-cols-4 gap-3` of smaller stat tiles:

| Tile | Value |
|------|-------|
| Labor | `$${globalPnL.labor_expenses.toLocaleString()}` |
| Travel | `$${globalPnL.travel_expenses.toLocaleString()}` |
| Shipping | `$${globalPnL.shipping_expenses.toLocaleString()}` |
| HW Misc | `$${globalPnL.hardware_misc_expenses.toLocaleString()}` |

### Monthly P&L Table

**Component**: `src/components/financials/MonthlyPLTable.tsx`

**Columns** (left to right):

| Column | Width | Content |
|--------|-------|---------|
| Month | 110px | `row.label` (e.g., "Mar 2026") + snapshot indicator |
| Projects | 70px center | `row.projects_closed` — `—` if 0 |
| Revenue | 110px right | `$${row.total_revenue.toLocaleString()}` — muted if 0 |
| COGS | 110px right | `$${row.cogs.toLocaleString()}` — muted if 0 |
| Gross Profit | 130px right | `$${row.gross_profit.toLocaleString()}` + margin % in small muted text below; red if negative |
| Expenses | 110px right | `$${row.total_direct_expenses.toLocaleString()}` — muted if 0 |
| Net Profit | 130px right | `$${row.net_profit.toLocaleString()}` + margin % below; red if negative |
| HER | 80px center | `row.her_ratio?.toFixed(2) ?? '—'` with colored dot |

**Month cell snapshot indicator**: If `row.snapshot_exists = false`, show a small orange `AlertTriangle` icon with tooltip "Month not closed — run Monthly Close to snapshot OpEx".

**HER column color dot**: per `classifyHER(row.her_ratio)`:
- `loss` → red dot
- `break_even` → yellow dot
- `healthy` → green dot
- `strong` → dark green dot
- `no_data` → gray dot (shown as `—`)

**Totals row**: A bold "Total" row at the bottom summing all numeric columns. Net margin % computed from aggregated total_revenue and net_profit.

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[110px]">Month</TableHead>
      <TableHead className="text-center w-[70px]">Projects</TableHead>
      <TableHead className="text-right w-[110px]">Revenue</TableHead>
      <TableHead className="text-right w-[110px]">COGS</TableHead>
      <TableHead className="text-right w-[130px]">Gross Profit</TableHead>
      <TableHead className="text-right w-[110px]">Expenses</TableHead>
      <TableHead className="text-right w-[130px]">Net Profit</TableHead>
      <TableHead className="text-center w-[80px]">HER</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {monthlyRows.map((row) => <MonthlyPLRow key={`${row.year}-${row.month}`} row={row} />)}
  </TableBody>
  <TableFooter>
    <MonthlyPLTotalsRow rows={monthlyRows} />
  </TableFooter>
</Table>
```

**Empty state** (no months with any data):
```tsx
<div className="py-12 text-center">
  <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
  <p className="font-medium">No financial data for this period</p>
  <p className="text-sm text-muted-foreground mt-1">
    No projects were closed and no expenses were logged in this period.
  </p>
</div>
```

---

## Tab 3: HER (Hardware Efficiency Ratio)

**File**: `src/components/financials/HERTab.tsx`

**Props**:
```typescript
interface HERTabProps {
  period: ResolvedPeriod
}
```

**Data fetching**:
```typescript
const { data: herHistory, isLoading } = useQuery({
  queryKey: ['her_history', period.startYear, period.startMonth, period.endYear, period.endMonth],
  queryFn: () => getMonthlyHERHistory(period.startYear, period.startMonth, period.endYear, period.endMonth),
})

const { data: snapshots } = useQuery({
  queryKey: ['opex_snapshots', period.startYear, period.startMonth, period.endYear, period.endMonth],
  queryFn: () => getMonthlyOpexSnapshots(period.startYear, period.startMonth, period.endYear, period.endMonth),
})

const periodHER = useMemo(
  () => snapshots ? computePeriodHER(snapshots) : null,
  [snapshots]
)
```

### HER Summary Card

A single wide card spanning full width showing the period aggregate HER:

```tsx
<Card className={cn("p-6 mb-6", HER_CARD_BG[classifyHER(periodHER?.her_ratio)])}>
  <div className="flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-muted-foreground">Period HER</p>
      <p className={cn("text-5xl font-bold mt-1", HER_VALUE_COLOR[classifyHER(periodHER?.her_ratio)])}>
        {periodHER?.her_ratio != null
          ? periodHER.her_ratio.toFixed(2)
          : '—'
        }
      </p>
      <p className="text-sm mt-2 font-medium">
        {HER_STATUS_LABEL[classifyHER(periodHER?.her_ratio)]}
      </p>
    </div>
    <div className="text-right text-sm">
      <p className="text-muted-foreground">HW Revenue</p>
      <p className="font-semibold">${(periodHER?.hardware_revenue ?? 0).toLocaleString()}</p>
      <p className="text-muted-foreground mt-2">Team HW Spend</p>
      <p className="font-semibold">${(periodHER?.team_hardware_spend ?? 0).toLocaleString()}</p>
    </div>
  </div>
</Card>
```

HER card background colors (`HER_CARD_BG`):
- `loss` → `bg-red-50 border-red-200`
- `break_even` → `bg-yellow-50 border-yellow-200`
- `healthy` → `bg-green-50 border-green-200`
- `strong` → `bg-emerald-50 border-emerald-200`
- `no_data` → `bg-muted border`

HER value colors (`HER_VALUE_COLOR`):
- `loss` → `text-red-600`
- `break_even` → `text-yellow-600`
- `healthy` → `text-green-600`
- `strong` → `text-emerald-700`
- `no_data` → `text-muted-foreground`

HER status labels (`HER_STATUS_LABEL`):
- `loss` → `Loss — team cost exceeds hardware revenue`
- `break_even` → `Break-even — marginal profitability`
- `healthy` → `Healthy — covers overhead`
- `strong` → `Strong — well above cost`
- `no_data` → `No closed months in this period`

### HER Bar Chart

**Component**: `src/components/financials/HERChart.tsx`

Uses shadcn `ChartContainer` wrapping Recharts `BarChart`. The chart requires `recharts` package (already part of shadcn chart primitive).

```typescript
// Chart data shape
interface HERChartEntry {
  label: string          // "Mar 2026"
  her_ratio: number      // 0 if no_data
  fill: string           // color string per HER status
  has_data: boolean      // false = no snapshot for this month
}
```

**Chart spec**:
- Type: `BarChart` (vertical bars, one bar per month)
- X axis: month label (`row.label`)
- Y axis: HER ratio value, domain `[0, max(3.0, max(her_ratio) × 1.2)]`
- Bars: fill color per HER status (red/yellow/green/dark-green/gray)
- Reference lines:
  - `y=1.0` — dashed red line, label "Break-even (1.0)"
  - `y=1.5` — dashed yellow line, label "Healthy (1.5)"
  - `y=2.0` — dashed green line, label "Strong (2.0)"
- Tooltip: shows month, HER ratio, hardware revenue, team spend
- Months with `has_data=false` (no snapshot) render as gray bar at height 0 with tooltip "No OpEx snapshot — close month to record"
- Chart height: 300px
- Legend: threshold reference line colors explained

```tsx
<ChartContainer config={chartConfig} className="h-[300px]">
  <BarChart data={chartData} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
    <CartesianGrid vertical={false} strokeDasharray="3 3" />
    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} domain={[0, yMax]} />
    <ChartTooltip content={<HERTooltip />} />
    <ReferenceLine y={1.0} stroke="hsl(var(--destructive))" strokeDasharray="4 4"
      label={{ value: '1.0', position: 'right', fontSize: 11 }} />
    <ReferenceLine y={1.5} stroke="hsl(48 96% 53%)" strokeDasharray="4 4"
      label={{ value: '1.5', position: 'right', fontSize: 11 }} />
    <ReferenceLine y={2.0} stroke="hsl(142 71% 45%)" strokeDasharray="4 4"
      label={{ value: '2.0', position: 'right', fontSize: 11 }} />
    <Bar dataKey="her_ratio" radius={[4, 4, 0, 0]}>
      {chartData.map((entry, index) => (
        <Cell key={index} fill={entry.fill} />
      ))}
    </Bar>
  </BarChart>
</ChartContainer>
```

Bar fill colors:
- `loss` → `hsl(0 84% 60%)` (red-500)
- `break_even` → `hsl(45 93% 47%)` (yellow-500)
- `healthy` → `hsl(142 71% 45%)` (green-500)
- `strong` → `hsl(160 84% 39%)` (emerald-600)
- `no_data` → `hsl(var(--muted-foreground))` at 30% opacity

### HER Monthly Table

Below the chart, a compact table listing each month:

| Column | Content |
|--------|---------|
| Month | label |
| HW Revenue | `$${row.hardware_revenue.toLocaleString()}` or `—` |
| Team Spend | `$${row.team_hardware_spend.toLocaleString()}` or `—` |
| HER | colored badge: value + status label |
| Snapshot | `Closed` (green check) or `Open` (orange dash) |

---

## Tab 4: Receivables

**File**: `src/components/financials/ReceivablesTab.tsx`

**Props**:
```typescript
interface ReceivablesTabProps {
  receivables: AgingReceivable[]   // from route loader
}
```

### AgingReceivable Type

```typescript
// Defined in src/services/invoicingService.ts
interface AgingReceivable {
  id: string
  project_id: string
  invoice_type: 'deposit' | 'final'
  total_amount: number
  date_sent: string         // ISO date
  days_outstanding: number  // computed: floor((now - date_sent) / 86400000)
  aging_bucket: AgingBucket // '0_30' | '31_60' | '61_90' | 'over_90'
  customer_name: string     // joined from projects
  venue_name: string        // joined from projects
}
```

### Aging Bucket Summary Cards

Four cards in a row:

| Bucket | Label | Color |
|--------|-------|-------|
| `0_30` | 0–30 days (Current) | green border if amount > 0, else muted |
| `31_60` | 31–60 days (Past Due) | amber border if > 0 |
| `61_90` | 61–90 days (Escalate) | orange border if > 0 |
| `over_90` | 90+ days (Overdue) | red border if > 0 |

Each card shows:
- Bucket label
- Count of invoices in bucket (`N invoices`)
- Total dollar amount (`$XX,XXX`)
- Action guidance text (muted, small):
  - `0_30` → "Monitor"
  - `31_60` → "Send payment reminder"
  - `61_90` → "Call customer directly"
  - `over_90` → "Escalate to Andy (PM)"

```tsx
const buckets = AGING_BUCKETS.map(bucket => ({
  bucket,
  invoices: receivables.filter(r => r.aging_bucket === bucket),
  total: receivables
    .filter(r => r.aging_bucket === bucket)
    .reduce((s, r) => s + r.total_amount, 0),
}))
```

### Aging Table

**Columns**:

| Column | Width | Content |
|--------|-------|---------|
| Customer | flex-1 | `venue_name` bold + `customer_name` muted below |
| Type | 120px | `Deposit Invoice` or `Final Invoice` — small Badge |
| Amount | 110px right | `$XX,XXX.XX` |
| Sent Date | 110px center | formatted date |
| Days Out | 90px center | number — red if > 60 |
| Bucket | 130px center | colored Badge per bucket |
| Action | 120px center | Link to project financials |

Bucket badge colors:

| Bucket | Badge variant / color |
|--------|-----------------------|
| `0_30` | `bg-green-100 text-green-700` |
| `31_60` | `bg-amber-100 text-amber-700` |
| `61_90` | `bg-orange-100 text-orange-700` |
| `over_90` | `bg-red-100 text-red-700` |

Action cell: `<Link to="/projects/$projectId/financials" params={{ projectId: r.project_id }}>View →</Link>`

Rows are sorted by `days_outstanding` descending (most overdue first).

**Empty state** (no outstanding invoices):
```tsx
<div className="py-12 text-center">
  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
  <p className="font-medium">All invoices collected</p>
  <p className="text-sm text-muted-foreground mt-1">
    No outstanding invoices at this time.
  </p>
</div>
```

---

## Tab 5: Per-Project

**File**: `src/components/financials/PerProjectTab.tsx`

**Props**:
```typescript
interface PerProjectTabProps {
  period: ResolvedPeriod
}
```

**Data fetching**:
```typescript
const { data: projects, isLoading } = useQuery({
  queryKey: ['all_projects_pnl'],
  queryFn: getAllProjectsWithPnL,
  staleTime: 2 * 60 * 1000,   // 2 minutes
})
```

Note: Per-Project tab loads all non-cancelled projects regardless of period filter. The period selector changes the period label shown in the header but does not filter this table — period filtering for P&L is in the P&L tab. The period selector is shown in the header for this tab so users can navigate to P&L with the same period.

### Per-Project Table

**Columns** (left to right):

| Column | Width | Content |
|--------|-------|---------|
| Venue | flex-1 min 200px | `venue_name` bold + `customer_name` muted + `TierBadge` |
| Courts | 60px center | `court_count` |
| Status | 120px | `project_status` + `revenue_stage` pill |
| Revenue | 110px right | `$${revenue.toLocaleString()}` or `—` (no BOM yet) |
| COGS | 100px right | `$${cogs.toLocaleString()}` or `—` |
| Gross Margin | 110px right | `${(gross_margin_pct * 100).toFixed(1)}%` — green if ≥ 20%, yellow if 10–20%, red if < 10%; `—` if null |
| Expenses | 100px right | `$${total_expenses.toLocaleString()}` |
| Net Profit | 110px right | `$${net_profit.toLocaleString()}` — red if negative; `—` if null |
| Collected | 110px right | `$${total_collected.toLocaleString()}` |
| Outstanding | 100px right | `$${total_outstanding.toLocaleString()}` — amber if > 0 |
| Open | 60px center | `Button` → `/projects/{id}` |

**Status cell**: Shows `project_status` as colored dot+label, then `revenue_stage` as small badge on second line.

**Totals row** (TableFooter):
- Revenue: sum of non-null revenues
- COGS: sum of non-null COGS
- Expenses: sum of all expenses
- Net Profit: sum of non-null net profits
- Collected: sum of all collected
- Outstanding: sum of all outstanding

**Sorting**: Default sort by `created_at` descending. Column headers for Revenue, Net Profit, and Outstanding are clickable to sort ascending/descending (client-side sort using `useState<SortConfig>`).

---

## Tab 6: Reconciliation

**File**: `src/components/financials/ReconciliationTab.tsx`

**State**:
```typescript
const [report, setReport] = useState<ReconciliationReport | null>(null)
const [running, setRunning] = useState(false)
const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set())
const [individualRunning, setIndividualRunning] = useState<Set<string>>(new Set())
```

### Header

```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h2 className="text-lg font-semibold">Data Reconciliation</h2>
    <p className="text-sm text-muted-foreground mt-0.5">
      Verify consistency across inventory, POs, BOMs, invoices, and revenue stages.
    </p>
  </div>
  <Button onClick={handleRunAll} disabled={running}>
    {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
    Run All Checks
  </Button>
</div>
```

`handleRunAll` calls `runAllReconciliationChecks()`, sets `report`, expands all checks with discrepancies.

### Check Cards

Five cards, one per reconciliation check. Each card:

```
┌─────────────────────────────────────────────────────────────────┐
│  [status icon]  R1: Inventory ↔ Movement Log                   │
│  "qty_on_hand must match Σ(movement deltas)"                    │
│                                              [Run]  [▼ expand]  │
├─────────────────────────────────────────────────────────────────┤
│  (expanded) Discrepancy table                                    │
│  Item | Actual Qty | Movement Sum | Discrepancy | Action        │
└─────────────────────────────────────────────────────────────────┘
```

Status icon per check result:
- Not yet run → `Circle` gray icon + text "Not run"
- Running → `Loader2` animate-spin
- Pass (0 discrepancies) → `CheckCircle2` green + "Pass — X items checked"
- Fail (N discrepancies) → `AlertTriangle` amber + "N discrepancies found"

Check definitions:

| ID | Title | Description | Tables |
|----|-------|-------------|--------|
| R1 | Inventory ↔ Movement Log | `qty_on_hand` = Σ(movement deltas) | inventory, inventory_movements |
| R2 | PO Receipts ↔ Movements | Every received PO line has a matching movement | purchase_order_items, inventory_movements |
| R3 | BOM ↔ PO Costs | BOM unit_cost matches PO unit_cost within ±5% | project_bom_items, purchase_order_items |
| R4 | Project Cost ↔ Invoice | Gross margin is reasonable (≥ 15%) | project_bom_items, expenses, invoices |
| R5 | Revenue Stage ↔ Invoice | `revenue_stage` matches most advanced invoice status | projects, invoices |

### R1 Discrepancy Table Columns

| Column | Content |
|--------|---------|
| Item | `item_name` bold + `sku` muted |
| Actual Qty | `actual_qty` |
| Movement Sum | `movement_implied_qty` |
| Discrepancy | `discrepancy` — red if nonzero |
| Action | "Post Adjustment" button → opens AdjustStockDialog (from inventory components) pre-filled with the discrepancy delta |

### R2 Discrepancy Table Columns

| Column | Content |
|--------|---------|
| PO Number | `po_number` |
| Item | `item_name` |
| Received Qty | `qty_received` |
| Movement Found | `movement_found` boolean (green ✓ / red ✗) |
| Action | "View PO" → `/projects/$projectId/procurement?tab=purchase-orders` |

### R3 Discrepancy Table Columns

| Column | Content |
|--------|---------|
| Project | `venue_name` |
| Item | `item_name` |
| BOM Cost | `bom_unit_cost` formatted as `$X.XX` |
| PO Cost | `po_unit_cost` formatted as `$X.XX` |
| Variance | `variance_pct` as `+X.X%` or `-X.X%` — red if |variance| > 5% |
| Cost Impact | `total_cost_impact` formatted as `$X,XXX` |
| Action | "Update BOM Cost" button → calls `updateBomItemCost(bomItemId, po_unit_cost)` then re-runs R3 |

### R4 Discrepancy Table Columns

| Column | Content |
|--------|---------|
| Project | `venue_name` link to `/projects/$projectId` |
| Revenue | `revenue` formatted |
| Total Cost | `hardware_cost + expenses` formatted |
| Gross Margin | `gross_margin_pct` — red if < 0, amber if 0–15% |
| Flag | `flag` value: `no_invoices` / `loss` / `thin_margin` — as Badge |
| Action | "Review Project" link |

Flag badge labels:

| Flag | Badge | Color |
|------|-------|-------|
| `no_invoices` | No Invoices | gray |
| `loss` | Loss | red |
| `thin_margin` | Thin Margin | amber |

### R5 Discrepancy Table Columns

| Column | Content |
|--------|---------|
| Project | `venue_name` |
| Current Stage | `revenue_stage` as colored badge |
| Expected Stage | `expected_stage` (derived from invoice states) |
| Action | "Auto-fix" button → calls `syncRevenueStage(projectId)` then re-runs R5 |

---

## Tab 7: Monthly Close

**File**: `src/components/financials/MonthlyCloseTab.tsx`

**Props**:
```typescript
interface MonthlyCloseTabProps {
  closeMonth?: string   // 'YYYY-MM' from URL search param; defaults to current month
}
```

**State**:
```typescript
const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number }>(() => {
  if (closeMonth) {
    const [y, m] = closeMonth.split('-').map(Number)
    return { year: y, month: m }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
})

// Per-month salary overrides (pre-filled from settings, editable for this month only)
const [salaryOverrides, setSalaryOverrides] = useState<SalaryOverrides | null>(null)
const [closing, setClosing] = useState(false)
```

**Data fetching**:
```typescript
const { year, month } = selectedMonth
const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
const monthEnd   = lastDayOfMonth(year, month)

const { data: snapshot } = useQuery({
  queryKey: ['opex_snapshot', year, month],
  queryFn: () => getMonthlyOpexSnapshot(year, month),
})

const { data: expenses } = useQuery({
  queryKey: ['month_expenses', year, month],
  queryFn: () => getExpensesInRange({ start_date: monthStart, end_date: monthEnd }),
})

const { data: missingReceipts } = useQuery({
  queryKey: ['missing_receipts', year, month],
  queryFn: () => getMissingReceiptExpenses(monthStart, monthEnd),
})

const { data: settings } = useQuery({
  queryKey: ['settings'],
  queryFn: getSettings,
})

// Pre-fill salary overrides from settings when settings first loads
useEffect(() => {
  if (settings && !salaryOverrides) {
    setSalaryOverrides({
      niko_monthly_salary: settings.niko_annual_salary / 12,
      niko_direct_allocation: settings.niko_direct_allocation,
      chad_monthly_salary: settings.chad_annual_salary / 12,
      chad_indirect_allocation: settings.chad_indirect_allocation,
      monthly_rent: settings.annual_rent / 12,
      monthly_indirect_salaries: settings.annual_indirect_salaries / 12,
    })
  }
}, [settings, salaryOverrides])
```

### Month Navigator

```tsx
<div className="flex items-center gap-3 mb-6">
  <Button
    variant="outline" size="icon"
    onClick={() => navigateMonth(-1)}
  >
    <ChevronLeft className="h-4 w-4" />
  </Button>
  <h2 className="text-xl font-semibold w-32 text-center">
    {new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
  </h2>
  <Button
    variant="outline" size="icon"
    onClick={() => navigateMonth(1)}
    disabled={year === today.getFullYear() && month >= today.getMonth() + 1}
  >
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>
```

`navigateMonth(delta)`: increments/decrements month, wraps year, updates both local state and URL `?close_month=YYYY-MM`.

### Close Status Banner

Shown below month navigator:

**If snapshot exists**:
```tsx
<Alert className="border-green-200 bg-green-50 mb-6">
  <CheckCircle2 className="h-4 w-4 text-green-600" />
  <AlertTitle className="text-green-800">Month Closed</AlertTitle>
  <AlertDescription className="text-green-700">
    Closed on {format(new Date(snapshot.created_at), 'MMM d, yyyy')}
    {snapshot.updated_at !== snapshot.created_at &&
      ` · Last updated ${format(new Date(snapshot.updated_at), 'MMM d, yyyy')}`
    }
    · HER: {snapshot.her_ratio?.toFixed(2) ?? '—'}
  </AlertDescription>
</Alert>
```

**If no snapshot**:
```tsx
<Alert className="border-amber-200 bg-amber-50 mb-6">
  <AlertTriangle className="h-4 w-4 text-amber-600" />
  <AlertTitle className="text-amber-800">Not Yet Closed</AlertTitle>
  <AlertDescription className="text-amber-700">
    This month has not been closed. Complete the steps below and click Close Month.
  </AlertDescription>
</Alert>
```

### Step 1: Expense Review

Collapsible section (open by default).

**Header**:
```tsx
<CollapsibleSection title="1. Expense Review" count={expenses?.length ?? 0}>
```

**Content**:

If `missingReceipts?.length > 0`:
```tsx
<Alert variant="warning" className="mb-4">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Missing Receipts</AlertTitle>
  <AlertDescription>
    {missingReceipts.length} expense{missingReceipts.length !== 1 ? 's' : ''} over $100
    {missingReceipts.length !== 1 ? ' are' : ' is'} missing receipts.
    Upload receipts before closing this month.
  </AlertDescription>
</Alert>
```

Expense table grouped by project. For each project with expenses in the month:
```
Project: {venue_name} ({customer_name})
  Category              Amount   Payment Method   Date
  ──────────────────────────────────────────────────
  Professional Services  $1,440   Podplay Card    Mar 3
  Airfare                $1,800   Ramp Reimburse  Mar 4
  ...
  Subtotal: $3,240
```

Table columns per expense row:
- Category (from `EXPENSE_CATEGORY_LABELS` map)
- Amount (`$X,XXX.XX`)
- Payment Method (icon: credit card for `podplay_card`, rotate-cw for `ramp_reimburse`)
- Date
- Receipt (green link if `receipt_url` set, red `AlertCircle` if missing and amount > 100)

Project subtotal row in bold. Grand total at bottom.

**Month Totals Summary** (below the expense table):
```tsx
<div className="grid grid-cols-3 gap-3 mt-4">
  <div className="text-center p-3 rounded bg-muted">
    <p className="text-xs text-muted-foreground">Total Expenses</p>
    <p className="text-lg font-bold">
      ${(expenses ?? []).reduce((s, e) => s + e.amount, 0).toLocaleString()}
    </p>
  </div>
  <div className="text-center p-3 rounded bg-muted">
    <p className="text-xs text-muted-foreground">Podplay Card</p>
    <p className="text-lg font-bold">
      ${(expenses ?? []).filter(e => e.payment_method === 'podplay_card').reduce((s, e) => s + e.amount, 0).toLocaleString()}
    </p>
  </div>
  <div className="text-center p-3 rounded bg-muted">
    <p className="text-xs text-muted-foreground">To Reimburse</p>
    <p className="text-lg font-bold">
      ${(expenses ?? []).filter(e => e.payment_method === 'ramp_reimburse').reduce((s, e) => s + e.amount, 0).toLocaleString()}
    </p>
  </div>
</div>
```

### Step 2: Team OpEx Inputs

Collapsible section.

**Header**: "2. Team OpEx — Salary Inputs"

Six editable fields pre-filled from `settings`. Ops can override for this specific month (e.g., if someone had a bonus or took unpaid time):

| Field | Label | Default | Type |
|-------|-------|---------|------|
| `niko_monthly_salary` | Niko Monthly Salary | `settings.niko_annual_salary / 12` | `Input type="number"` prefix `$` |
| `niko_direct_allocation` | Niko Direct Allocation | `settings.niko_direct_allocation` | `Input type="number"` suffix `%` (0–100) |
| `chad_monthly_salary` | Chad Monthly Salary | `settings.chad_annual_salary / 12` | `Input type="number"` prefix `$` |
| `chad_indirect_allocation` | Chad Indirect Allocation | `settings.chad_indirect_allocation` | `Input type="number"` suffix `%` (0–100) |
| `monthly_rent` | Monthly Rent | `settings.annual_rent / 12` | `Input type="number"` prefix `$` |
| `monthly_indirect_salaries` | Monthly Indirect Salaries | `settings.annual_indirect_salaries / 12` | `Input type="number"` prefix `$` |

Helper text below each field:
- Niko direct allocation: "% of Niko's time directly attributed to hardware ops (default 50%)"
- Chad indirect: "% of Chad's time attributed to hardware overhead (default 20%)"
- Monthly indirect salaries: "Total indirect salary pool / 12 (ops, support, etc.)"

Fields are in a `grid-cols-2 gap-4`.

Validation: all must be non-negative numbers. `niko_direct_allocation` and `chad_indirect_allocation` must be 0–100.

Live `team_hardware_spend` preview below the fields:
```tsx
<div className="mt-4 p-3 rounded bg-muted text-sm font-mono">
  <p className="font-medium mb-2 text-sm font-sans">team_hardware_spend preview:</p>
  <p>Niko direct:          ${(niko_salary × niko_direct / 100).toFixed(2)}</p>
  <p>Niko indirect (50%):  ${(niko_salary × (1 - niko_direct/100) × 0.50).toFixed(2)}</p>
  <p>Chad indirect:        ${(chad_salary × chad_indirect / 100).toFixed(2)}</p>
  <p>Rent:                 ${monthly_rent.toFixed(2)}</p>
  <p>Indirect pool (20%):  ${(monthly_indirect_salaries × 0.20).toFixed(2)}</p>
  <p className="border-t mt-1 pt-1 font-bold">
    Total: ${computeTeamHardwareSpendPreview(salaryOverrides).toFixed(2)}
  </p>
</div>
```

`computeTeamHardwareSpendPreview` mirrors the `computeTeamHardwareSpend` formula from financial-reporting.md.

### Step 3: Hardware Revenue

Collapsible section.

**Header**: "3. Hardware Revenue (Final Invoices Paid This Month)"

Shows a read-only list of final invoices with `date_paid` in the selected month:

```typescript
// Fetched inline
const { data: paidFinalInvoices } = useQuery({
  queryKey: ['paid_final_invoices', year, month],
  queryFn: async () => {
    const { data } = await supabase
      .from('invoices')
      .select(`
        id, project_id, hardware_subtotal, service_fee, total_amount, date_paid,
        projects (customer_name, venue_name)
      `)
      .eq('invoice_type', 'final')
      .eq('status', 'paid')
      .gte('date_paid', monthStart)
      .lte('date_paid', monthEnd)
    return data ?? []
  },
})
```

Table columns:
- Customer / Venue (stacked)
- Paid Date
- HW Subtotal (`$XX,XXX`)
- Service Fee (`$XX,XXX`)
- Total (`$XX,XXX`)

Totals row: sum of `hardware_subtotal`, `service_fee`, `total_amount`.

If no final invoices paid this month:
```tsx
<p className="text-sm text-muted-foreground italic py-4">
  No final invoices were paid this month.
  Hardware revenue will be $0 for this snapshot.
</p>
```

### Step 4: Snapshot Preview

Collapsible section.

**Header**: "4. Snapshot Preview"

Shows what the `monthly_opex_snapshots` row will contain when closed:

```
┌─────────────────────────────────────────────────────┐
│  Preview: Mar 2026 Snapshot                          │
│  Hardware Revenue:    $40,733                        │
│  Team HW Spend:       $11,750  (computed above)      │
│  ──────────────────────────────────────────────────  │
│  HER:                 3.47   ✦ Strong                │
│  Total Expenses:      $11,650                        │
│  Project Count (Final Paid): 2                        │
└─────────────────────────────────────────────────────┘
```

The HER value shown in the preview uses the salary overrides from Step 2 + the hardware revenue from Step 3. Color-coded per `classifyHER`.

If `team_hardware_spend` would be 0 (all salaries entered as 0):
```tsx
<Alert variant="destructive" className="mt-2">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>
    Team hardware spend is $0 — check salary inputs. HER cannot be computed.
  </AlertDescription>
</Alert>
```

### Step 5: Close Button

```tsx
<div className="mt-6 flex items-center gap-3">
  <Button
    onClick={handleCloseMonth}
    disabled={closing}
    className="min-w-[140px]"
  >
    {closing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
    {snapshot ? 'Re-close Month' : 'Close Month'}
  </Button>

  {snapshot && (
    <p className="text-sm text-muted-foreground">
      Re-closing will overwrite the existing snapshot with current data.
    </p>
  )}
</div>
```

**`handleCloseMonth`**:
1. Validates `salaryOverrides` (all non-negative, allocations 0–100)
2. If re-closing and snapshot exists: show `AlertDialog` confirmation: "Re-close March 2026? This will overwrite the existing snapshot." → Cancel / Re-close
3. Calls `closeMonth(year, month, { ...settings, ...salaryOverrides })` (merges overrides into settings object for the call)
4. On success: `queryClient.invalidateQueries(['opex_snapshot', year, month])` → snapshot re-fetches and close status banner updates to "Closed"
5. Toast: "March 2026 closed. HER: X.XX"
6. On error: toast "Failed to close month: {error.message}"

### Team OpEx Config Panel (at bottom of Monthly Close tab)

A separate section below the close workflow, always visible.

**Header**: "Team OpEx Settings (Defaults)"

Description: "These defaults pre-fill the salary inputs above each month. Change them when salaries or allocations change. Monthly Close overrides only affect the specific month — they do not update these defaults."

Links to the Settings page: "Edit in Settings →" (a `Link` to `/settings?section=opex`)

Shows current values in read-only format:

| Field | Value |
|-------|-------|
| Niko Annual Salary | `$${settings.niko_annual_salary.toLocaleString()}` / yr |
| Niko Direct Allocation | `${(settings.niko_direct_allocation * 100).toFixed(0)}%` |
| Chad Annual Salary | `$${settings.chad_annual_salary.toLocaleString()}` / yr |
| Chad Indirect Allocation | `${(settings.chad_indirect_allocation * 100).toFixed(0)}%` |
| Annual Rent | `$${settings.annual_rent.toLocaleString()}` / yr |
| Annual Indirect Salaries | `$${settings.annual_indirect_salaries.toLocaleString()}` / yr |
| Monthly Team HW Spend (at defaults) | computed: `$${computeTeamHardwareSpendFromSettings(settings).toFixed(2)}` |

---

## Loading Skeleton

**Component**: `FinancialsSkeleton` (defined in route file)

```tsx
function FinancialsSkeleton() {
  return (
    <div className="px-6 py-4">
      <div className="flex justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-44" />
      </div>
      <div className="flex gap-2 mb-6">
        {[0,1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-9 w-28" />)}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0,1,2].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
      </div>
    </div>
  )
}
```

---

## Lucide Icons Used

| Icon | Usage |
|------|-------|
| `TrendingUp` | Pipeline empty state |
| `BarChart3` | P&L empty state |
| `ChevronRight` | Pipeline stage separator |
| `ChevronLeft` / `ChevronRight` | Month navigator |
| `CheckCircle2` | Closed month banner, all-collected state, R1/R2/R5 pass |
| `AlertTriangle` | Missing receipts, not-closed banner, R3/R4 fail |
| `AlertCircle` | Zero team spend warning, route error |
| `RefreshCw` | Run All Checks button |
| `Loader2` | Running checks animation, closing month |
| `Circle` | Check not yet run |
| `CreditCard` | Podplay card payment method icon |
| `RotateCw` | Ramp reimburse payment method icon |

---

## File Summary

Files to create for the Global Financials page:

```
src/
├── routes/
│   └── _auth/
│       └── financials/
│           └── index.tsx                        # Route definition, loader, search schema
├── lib/
│   └── periodUtils.ts                           # resolvePeriod(), PERIOD_LABELS, PeriodPreset
├── services/
│   ├── financialReportingService.ts             # All reporting functions (mostly from financial-reporting.md)
│   │                                            # + getAllProjectsWithPnL() (new, defined here)
│   └── reconciliation.ts                        # All reconciliation check functions
└── components/
    └── financials/
        ├── FinancialsPage.tsx                   # Root: header, period selector, tab bar
        ├── PeriodSelector.tsx                   # Preset select + custom date inputs
        ├── PipelineTab.tsx                      # Summary cards + funnel stage cards
        ├── PLTab.tsx                            # useQuery wrapper, summary cards, monthly table
        ├── MonthlyPLTable.tsx                   # Table shell, MonthlyPLRow, MonthlyPLTotalsRow
        ├── HERTab.tsx                           # useQuery wrapper, period HER card, chart, table
        ├── HERChart.tsx                         # Recharts BarChart with reference lines
        ├── ReceivablesTab.tsx                   # Aging bucket cards + aging table
        ├── PerProjectTab.tsx                    # useQuery wrapper, per-project P&L table
        ├── ReconciliationTab.tsx                # 5 check cards, run all, expand/collapse
        ├── ReconciliationCheckCard.tsx          # Single check card (header + discrepancy table)
        ├── MonthlyCloseTab.tsx                  # Month nav, close status, 5 steps, OpEx config
        └── CollapsibleSection.tsx               # Shared collapsible section shell (used by close tab)
```

---

## Data Flow Summary

```
Route loader (always):
  getRevenuePipeline()         → pipeline data for Pipeline tab
  computeCollectedRevenue()    → total collected for Pipeline summary
  getAgingReceivables()        → receivables for Receivables tab + tab badge count

Period-dependent tabs (useQuery, re-fetches on period change):
  PLTab:
    computeGlobalPnL(start, end)
    computeMonthlyPnLTable(startYear, startMonth, endYear, endMonth)
  HERTab:
    getMonthlyHERHistory(...)
    getMonthlyOpexSnapshots(...)  → for computePeriodHER()
  PerProjectTab:
    getAllProjectsWithPnL()        → staleTime=2min, no period filter

ReconciliationTab (on-demand, triggered by button):
  runAllReconciliationChecks()  → R1+R2+R3+R4+R5 in parallel
  Individual: runR1..runR5()    → single check update

MonthlyCloseTab (per selectedMonth):
  getMonthlyOpexSnapshot(year, month)
  getExpensesInRange({ start_date: monthStart, end_date: monthEnd })
  getMissingReceiptExpenses(monthStart, monthEnd)
  paidFinalInvoices query
  getSettings()                  → salary defaults

  On close: closeMonth(year, month, { ...settings, ...overrides })
    → upserts monthly_opex_snapshots
    → queryClient.invalidateQueries(['opex_snapshot', year, month])
```

All mutations use `queryClient.invalidateQueries()` after success to refresh related data without full page reload.
