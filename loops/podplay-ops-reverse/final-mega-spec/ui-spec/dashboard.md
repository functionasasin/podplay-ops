# PodPlay Ops Wizard — Dashboard Page

**Aspect**: design-dashboard
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Route**: `/projects`
**Route file**: `src/routes/_auth/projects/index.tsx`
**Component file**: `src/components/dashboard/DashboardPage.tsx`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `projects`, `invoices`
**Logic reference**: `final-mega-spec/business-logic/progress-calculation.md`, `financial-reporting.md`

---

## Overview

The dashboard is the home screen after login. It shows all PodPlay projects as a filterable, paginated list, with top-line metrics, status pills, deployment progress bars, and a "New Project" button. This page replaces the CUSTOMER MASTER tab of the MRP spreadsheet.

---

## Route Configuration

**File**: `src/routes/_auth/projects/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { getProjects } from '@/services/projects'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

const projectsSearchSchema = z.object({
  status: z.enum([
    'intake', 'procurement', 'deployment',
    'financial_close', 'completed', 'cancelled'
  ]).optional(),
  tier: z.enum(['pro', 'autonomous', 'autonomous_plus', 'pbk']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export type ProjectsSearch = z.infer<typeof projectsSearchSchema>

export const Route = createFileRoute('/_auth/projects/')({
  validateSearch: (search) => projectsSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getProjects(deps),
  component: DashboardPage,
  pendingComponent: DashboardSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
      <p className="text-destructive font-medium">Failed to load projects</p>
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

**File**: `src/services/projects.ts`

### Types

```typescript
// Full project row returned by getProjects — includes computed invoice totals
export interface ProjectSummary {
  id: string
  customer_name: string
  venue_name: string
  venue_city: string
  venue_state: string
  venue_country: string
  tier: 'pro' | 'autonomous' | 'autonomous_plus' | 'pbk'
  court_count: number
  project_status: 'intake' | 'procurement' | 'deployment' | 'financial_close' | 'completed' | 'cancelled'
  deployment_status: 'not_started' | 'config' | 'ready_to_ship' | 'shipped' | 'installing' | 'qc' | 'completed'
  revenue_stage: 'proposal' | 'signed' | 'deposit_invoiced' | 'deposit_paid' | 'final_invoiced' | 'final_paid'
  go_live_date: string | null       // ISO date string
  installation_start_date: string | null
  created_at: string                // ISO timestamp
  updated_at: string
  // Computed from joined deployment_checklist_items
  deployment_progress_pct: number   // 0–100; 0 if no checklist items
  // Computed from joined invoices
  total_contract_value: number      // sum of all invoice total_amount
  deposit_paid: boolean             // true if deposit invoice status = 'paid'
  final_paid: boolean               // true if final invoice status = 'paid'
}

export interface ProjectsResponse {
  projects: ProjectSummary[]
  total_count: number               // total rows matching filters (for pagination)
  metrics: DashboardMetrics
}

export interface DashboardMetrics {
  active_count: number              // projects where project_status NOT IN ('completed','cancelled')
  pipeline_value: number            // sum of total_contract_value for non-cancelled, non-completed projects
  overdue_deposit_count: number     // deposit invoices where status='sent' and created_at < today - 30 days
  overdue_final_count: number       // final invoices where status='sent' and created_at < today - 30 days
  completed_this_month: number      // projects where project_status='completed' and go_live_date in current month
}

export interface GetProjectsParams {
  status?: string
  tier?: string
  q?: string
  page?: number
}
```

### `getProjects` Implementation

```typescript
// src/services/projects.ts
const PAGE_SIZE = 20

export async function getProjects(params: GetProjectsParams): Promise<ProjectsResponse> {
  const page = params.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // Build base query for project list
  let query = supabase
    .from('projects')
    .select(`
      id,
      customer_name,
      venue_name,
      venue_city,
      venue_state,
      venue_country,
      tier,
      court_count,
      project_status,
      deployment_status,
      revenue_stage,
      go_live_date,
      installation_start_date,
      created_at,
      updated_at,
      invoices (
        invoice_type,
        status,
        total_amount
      ),
      deployment_checklist_items (
        is_completed
      )
    `, { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)

  // Apply filters
  if (params.status) {
    query = query.eq('project_status', params.status)
  }
  if (params.tier) {
    query = query.eq('tier', params.tier)
  }
  if (params.q && params.q.trim() !== '') {
    // ilike search across customer_name and venue_name
    query = query.or(
      `customer_name.ilike.%${params.q.trim()}%,venue_name.ilike.%${params.q.trim()}%`
    )
  }

  const { data, error, count } = await query
  if (error) throw error

  // Compute per-project derived fields
  const projects: ProjectSummary[] = (data ?? []).map((row) => {
    const checklistItems = row.deployment_checklist_items ?? []
    const completedItems = checklistItems.filter((i: { is_completed: boolean }) => i.is_completed).length
    const deployment_progress_pct = checklistItems.length > 0
      ? Math.round((completedItems / checklistItems.length) * 100)
      : 0

    const invoices = row.invoices ?? []
    const total_contract_value = invoices.reduce(
      (sum: number, inv: { total_amount: number }) => sum + (inv.total_amount ?? 0), 0
    )
    const depositInvoice = invoices.find(
      (inv: { invoice_type: string; status: string }) => inv.invoice_type === 'deposit'
    )
    const finalInvoice = invoices.find(
      (inv: { invoice_type: string; status: string }) => inv.invoice_type === 'final'
    )

    return {
      id: row.id,
      customer_name: row.customer_name,
      venue_name: row.venue_name,
      venue_city: row.venue_city,
      venue_state: row.venue_state,
      venue_country: row.venue_country,
      tier: row.tier,
      court_count: row.court_count,
      project_status: row.project_status,
      deployment_status: row.deployment_status,
      revenue_stage: row.revenue_stage,
      go_live_date: row.go_live_date,
      installation_start_date: row.installation_start_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deployment_progress_pct,
      total_contract_value,
      deposit_paid: depositInvoice?.status === 'paid',
      final_paid: finalInvoice?.status === 'paid',
    }
  })

  // Compute dashboard metrics (separate aggregate queries)
  const metrics = await getDashboardMetrics()

  return {
    projects,
    total_count: count ?? 0,
    metrics,
  }
}

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Active project count (not completed or cancelled)
  const { count: active_count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .not('project_status', 'in', '("completed","cancelled")')

  // Pipeline value: sum of invoice total_amount for active+uncancelled projects
  // Fetched as aggregate by summing on client; for large datasets, use a Postgres function
  const { data: pipelineData } = await supabase
    .from('invoices')
    .select(`
      total_amount,
      project:projects!inner(project_status)
    `)
    .not('project.project_status', 'in', '("cancelled")')

  const pipeline_value = (pipelineData ?? []).reduce(
    (sum: number, inv: { total_amount: number }) => sum + (inv.total_amount ?? 0), 0
  )

  // Overdue invoices: status='sent' and sent more than 30 days ago
  const { count: overdue_deposit_count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_type', 'deposit')
    .eq('status', 'sent')
    .lt('date_sent', thirtyDaysAgo)

  const { count: overdue_final_count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_type', 'final')
    .eq('status', 'sent')
    .lt('date_sent', thirtyDaysAgo)

  // Completed this month
  const { count: completed_this_month } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('project_status', 'completed')
    .gte('go_live_date', firstOfMonth)

  return {
    active_count: active_count ?? 0,
    pipeline_value,
    overdue_deposit_count: overdue_deposit_count ?? 0,
    overdue_final_count: overdue_final_count ?? 0,
    completed_this_month: completed_this_month ?? 0,
  }
}
```

---

## Page Layout

**File**: `src/components/dashboard/DashboardPage.tsx`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PAGE HEADER                                                                 │
│  Projects                                      [+ New Project]               │
├─────────────────────────────────────────────────────────────────────────────┤
│  METRICS BAR (4 cards)                                                       │
│  [Active Projects: 12] [Pipeline: $284,000] [Overdue: 2] [Closed MTD: 1]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  FILTER BAR                                                                  │
│  [🔍 Search venues...]  [Status ▾]  [Tier ▾]  [Clear filters]              │
├─────────────────────────────────────────────────────────────────────────────┤
│  PROJECT TABLE                                                               │
│  Venue          | Tier  | Courts | Status         | Revenue   | Go-Live     │
│  ────────────────────────────────────────────────────────────────────────   │
│  Telepark - JC  | AUTO  |   8    | ● Deployment   | ▰▰▰▱▱ 63% | Mar 15      │
│  PaddleUp Miami | PRO   |   4    | ● Procurement  | Deposit ✓ | —           │
│  Volley Club    | A+    |  12    | ● Financial    | Final sent| Apr 2       │
│  ...                                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  PAGINATION                                                                  │
│  Showing 1–20 of 47 projects   [< Prev]  [1] [2] [3]  [Next >]             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component: `DashboardPage`

**File**: `src/components/dashboard/DashboardPage.tsx`

```tsx
export function DashboardPage() {
  const { projects, total_count, metrics } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader metrics={metrics} />
      <MetricsBar metrics={metrics} />
      <FilterBar search={search} />
      {projects.length === 0
        ? <ProjectsEmptyState hasFilters={!!search.status || !!search.tier || !!search.q} />
        : <ProjectsTable projects={projects} />
      }
      <Pagination totalCount={total_count} currentPage={search.page ?? 1} pageSize={20} />
    </div>
  )
}
```

---

## Sub-component: `PageHeader`

**File**: `src/components/dashboard/PageHeader.tsx`

```
Projects                    [+ New Project]
```

- Heading: `<h1 className="text-2xl font-semibold">Projects</h1>`
- Button: `<Button asChild><Link to="/projects/new">+ New Project</Link></Button>`
- Button variant: `default` (solid, primary color)
- Layout: `flex items-center justify-between`

---

## Sub-component: `MetricsBar`

**File**: `src/components/dashboard/MetricsBar.tsx`

Four metric cards in a responsive grid (4 columns on lg, 2 on sm, 1 on xs):

### Card 1: Active Projects

```
[LayoutDashboard icon]
Active Projects
12
```

- Icon: `LayoutDashboard` (lucide), `text-blue-500`
- Value: `metrics.active_count` — formatted as integer
- Label: "Active Projects"
- Clicking does nothing (informational only)

### Card 2: Pipeline Value

```
[DollarSign icon]
Pipeline Value
$284,000
```

- Icon: `DollarSign`, `text-green-500`
- Value: `metrics.pipeline_value` — formatted as `$XXX,XXX` (USD, no decimals for values ≥ $1000)
- Label: "Pipeline Value"
- Tooltip on hover: "Sum of all contracts for active projects"

### Card 3: Overdue Invoices

```
[AlertCircle icon]
Overdue Invoices
2
```

- Icon: `AlertCircle`, `text-amber-500` when count > 0, `text-muted-foreground` when 0
- Value: `metrics.overdue_deposit_count + metrics.overdue_final_count`
- Label: "Overdue Invoices"
- Tooltip: "Invoices sent 30+ days ago with no payment"
- When count > 0: card border becomes `border-amber-200`, background `bg-amber-50`

### Card 4: Closed This Month

```
[CheckCircle2 icon]
Closed This Month
1
```

- Icon: `CheckCircle2`, `text-green-500`
- Value: `metrics.completed_this_month`
- Label: "Closed This Month"

### Card Styling

All cards:
```tsx
<Card className="p-4">
  <div className="flex items-center gap-3">
    <Icon className="h-5 w-5 {color}" />
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-0.5">{value}</p>
    </div>
  </div>
</Card>
```

---

## Sub-component: `FilterBar`

**File**: `src/components/dashboard/FilterBar.tsx`

Three filter controls in a horizontal row:

### Search Input

```tsx
<Input
  type="search"
  placeholder="Search venues or customers..."
  defaultValue={search.q ?? ''}
  onChange={(e) => debouncedUpdateSearch({ q: e.target.value || undefined, page: 1 })}
  className="w-64"
/>
```

- Debounce: 300ms before triggering navigation
- Clears `page` back to 1 when search query changes
- Uses `useNavigate` to update URL search params: `navigate({ search: (prev) => ({ ...prev, q: value, page: 1 }) })`
- Search icon (`Search` from lucide) rendered inside the input as left adornment

### Status Filter

```tsx
<Select
  value={search.status ?? 'all'}
  onValueChange={(val) => navigate({ search: (prev) => ({
    ...prev,
    status: val === 'all' ? undefined : val,
    page: 1,
  })})}
>
  <SelectTrigger className="w-40">
    <SelectValue placeholder="Status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Statuses</SelectItem>
    <SelectItem value="intake">Intake</SelectItem>
    <SelectItem value="procurement">Procurement</SelectItem>
    <SelectItem value="deployment">Deployment</SelectItem>
    <SelectItem value="financial_close">Financial Close</SelectItem>
    <SelectItem value="completed">Completed</SelectItem>
    <SelectItem value="cancelled">Cancelled</SelectItem>
  </SelectContent>
</Select>
```

### Tier Filter

```tsx
<Select
  value={search.tier ?? 'all'}
  onValueChange={(val) => navigate({ search: (prev) => ({
    ...prev,
    tier: val === 'all' ? undefined : val,
    page: 1,
  })})}
>
  <SelectTrigger className="w-36">
    <SelectValue placeholder="Tier" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Tiers</SelectItem>
    <SelectItem value="pro">Pro</SelectItem>
    <SelectItem value="autonomous">Autonomous</SelectItem>
    <SelectItem value="autonomous_plus">Autonomous+</SelectItem>
    <SelectItem value="pbk">PBK</SelectItem>
  </SelectContent>
</Select>
```

### Clear Filters Button

Shown only when at least one filter is active (`search.status || search.tier || search.q`):

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => navigate({ search: { page: 1 } })}
>
  <X className="h-4 w-4 mr-1" /> Clear
</Button>
```

---

## Sub-component: `ProjectsTable`

**File**: `src/components/dashboard/ProjectsTable.tsx`

A `<table>` element with the following columns:

### Column Definitions

| Column | Width | Header | Data |
|--------|-------|--------|------|
| Venue | auto (flex-1) | "Venue" | `venue_name` + `customer_name` stacked |
| Tier | 80px | "Tier" | `TierBadge` component |
| Courts | 70px | "Courts" | `court_count` integer, centered |
| Status | 180px | "Status" | `StatusCell` component |
| Revenue | 130px | "Revenue" | `RevenueStageCell` component |
| Go-Live | 110px | "Go-Live" | Formatted date or "—" |
| Actions | 60px | "" | "Open" link button |

### Table Structure

```tsx
<div className="border rounded-lg overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/40">
        <TableHead>Venue</TableHead>
        <TableHead className="w-20 text-center">Tier</TableHead>
        <TableHead className="w-16 text-center">Courts</TableHead>
        <TableHead className="w-44">Status</TableHead>
        <TableHead className="w-32">Revenue</TableHead>
        <TableHead className="w-28">Go-Live</TableHead>
        <TableHead className="w-16" />
      </TableRow>
    </TableHeader>
    <TableBody>
      {projects.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </TableBody>
  </Table>
</div>
```

### Row Behavior

Each `<TableRow>` is clickable (entire row navigates to project):

```tsx
<TableRow
  key={project.id}
  className="cursor-pointer hover:bg-muted/30 transition-colors"
  onClick={() => navigate({ to: '/projects/$projectId', params: { projectId: project.id } })}
>
```

The "Open" button in the actions column stops event propagation:

```tsx
<TableCell>
  <Button
    variant="ghost"
    size="sm"
    asChild
    onClick={(e) => e.stopPropagation()}
  >
    <Link to="/projects/$projectId" params={{ projectId: project.id }}>
      Open
    </Link>
  </Button>
</TableCell>
```

---

## Sub-component: Venue Cell

Stacked two-line display:

```tsx
<TableCell>
  <div>
    <p className="font-medium text-sm leading-tight">{project.venue_name}</p>
    {project.customer_name !== project.venue_name && (
      <p className="text-xs text-muted-foreground mt-0.5">{project.customer_name}</p>
    )}
    <p className="text-xs text-muted-foreground">
      {project.venue_city}{project.venue_state ? `, ${project.venue_state}` : ''}
      {project.venue_country !== 'US' ? ` (${project.venue_country})` : ''}
    </p>
  </div>
</TableCell>
```

- If `venue_name === customer_name`: show only one line (the venue name) + city/state
- If they differ: show venue_name bold, customer_name smaller below it, then city/state
- For non-US venues: append country code in parentheses

---

## Sub-component: `TierBadge`

**File**: `src/components/dashboard/TierBadge.tsx`

```tsx
const TIER_CONFIG = {
  pro:            { label: 'PRO',   className: 'bg-blue-100 text-blue-700 border-blue-200' },
  autonomous:     { label: 'AUTO',  className: 'bg-purple-100 text-purple-700 border-purple-200' },
  autonomous_plus:{ label: 'A+',    className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  pbk:            { label: 'PBK',   className: 'bg-orange-100 text-orange-700 border-orange-200' },
}

export function TierBadge({ tier }: { tier: ServiceTier }) {
  const config = TIER_CONFIG[tier]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  )
}
```

---

## Sub-component: `StatusCell`

**File**: `src/components/dashboard/StatusCell.tsx`

Shows primary project status pill. For deployment-stage projects, also shows a progress bar.

```tsx
const PROJECT_STATUS_CONFIG = {
  intake:          { label: 'Intake',         dotColor: 'bg-slate-400' },
  procurement:     { label: 'Procurement',    dotColor: 'bg-yellow-400' },
  deployment:      { label: 'Deployment',     dotColor: 'bg-blue-500' },
  financial_close: { label: 'Financial Close',dotColor: 'bg-orange-400' },
  completed:       { label: 'Completed',      dotColor: 'bg-green-500' },
  cancelled:       { label: 'Cancelled',      dotColor: 'bg-red-400' },
}

const DEPLOYMENT_STATUS_LABELS = {
  not_started:   'Not started',
  config:        'Configuring',
  ready_to_ship: 'Ready to ship',
  shipped:       'Shipped',
  installing:    'Installing',
  qc:            'QC',
  completed:     'Complete',
}

export function StatusCell({ project }: { project: ProjectSummary }) {
  const config = PROJECT_STATUS_CONFIG[project.project_status]

  return (
    <TableCell>
      <div className="space-y-1">
        {/* Status pill */}
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${config.dotColor}`} />
          <span className="text-sm font-medium">{config.label}</span>
        </div>

        {/* Deployment sub-status + progress bar (only for deployment stage) */}
        {project.project_status === 'deployment' && (
          <div className="pl-3.5">
            <p className="text-xs text-muted-foreground">
              {DEPLOYMENT_STATUS_LABELS[project.deployment_status]}
            </p>
            {project.deployment_progress_pct === 100 ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5" />
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${project.deployment_progress_pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {project.deployment_progress_pct}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </TableCell>
  )
}
```

---

## Sub-component: `RevenueStageCell`

**File**: `src/components/dashboard/RevenueStageCell.tsx`

Shows compact revenue lifecycle indicator. Format: icon + label.

```tsx
const REVENUE_STAGE_CONFIG: Record<RevenueStage, { label: string; icon: LucideIcon; className: string }> = {
  proposal:         { label: 'Proposal',        icon: FileText,   className: 'text-slate-500' },
  signed:           { label: 'Signed',          icon: PenLine,    className: 'text-blue-500' },
  deposit_invoiced: { label: 'Deposit sent',    icon: Send,       className: 'text-yellow-600' },
  deposit_paid:     { label: 'Deposit paid',    icon: CheckCircle2, className: 'text-green-500' },
  final_invoiced:   { label: 'Final sent',      icon: Send,       className: 'text-orange-500' },
  final_paid:       { label: 'Final paid',      icon: CheckCircle2, className: 'text-green-600' },
}

export function RevenueStageCell({ project }: { project: ProjectSummary }) {
  const config = REVENUE_STAGE_CONFIG[project.revenue_stage]
  const Icon = config.icon

  return (
    <TableCell>
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${config.className}`} />
        <span className="text-xs">{config.label}</span>
      </div>
      {/* Show $ value if invoices exist */}
      {project.total_contract_value > 0 && (
        <p className="text-xs text-muted-foreground pl-5 mt-0.5">
          {formatCurrency(project.total_contract_value)}
        </p>
      )}
    </TableCell>
  )
}
```

---

## Sub-component: Go-Live Cell

```tsx
<TableCell>
  {project.go_live_date
    ? <span className="text-sm">{formatDate(project.go_live_date)}</span>
    : <span className="text-muted-foreground text-sm">—</span>
  }
</TableCell>
```

**`formatDate`** utility (in `src/lib/format.ts`):
```typescript
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00')  // force local midnight parse
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  // Example: "Mar 15, 2026"
}
```

**`formatCurrency`** utility (in `src/lib/format.ts`):
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
  // Example: "$12,000" — no decimals for round numbers
}
```

---

## Sub-component: `ProjectsEmptyState`

**File**: `src/components/dashboard/ProjectsEmptyState.tsx`

Two variants:

### No projects exist yet (no filters applied)

```
[FolderOpen icon — large, muted]
No projects yet
Start by creating your first installation project.
[+ New Project] button
```

### No results for current filters

```
[SearchX icon — large, muted]
No projects found
Try adjusting your filters or search term.
[Clear filters] button
```

```tsx
export function ProjectsEmptyState({ hasFilters }: { hasFilters: boolean }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {hasFilters
        ? <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
        : <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
      }
      <h3 className="text-lg font-medium mb-1">
        {hasFilters ? 'No projects found' : 'No projects yet'}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {hasFilters
          ? 'Try adjusting your filters or search term.'
          : 'Start by creating your first installation project.'
        }
      </p>
      {hasFilters
        ? (
          <Button variant="outline" onClick={() => navigate({ search: { page: 1 } })}>
            Clear filters
          </Button>
        ) : (
          <Button asChild>
            <Link to="/projects/new">+ New Project</Link>
          </Button>
        )
      }
    </div>
  )
}
```

---

## Sub-component: `Pagination`

**File**: `src/components/dashboard/Pagination.tsx`

```tsx
export function Pagination({
  totalCount,
  currentPage,
  pageSize,
}: {
  totalCount: number
  currentPage: number
  pageSize: number
}) {
  const navigate = useNavigate()
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) return null

  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalCount)

  const goToPage = (page: number) => {
    navigate({ search: (prev) => ({ ...prev, page }) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {from}–{to} of {totalCount} projects
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="sm"
          disabled={currentPage === 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>

        {/* Show page numbers with ellipsis for large page counts */}
        {getPageNumbers(currentPage, totalPages).map((pageNum, i) =>
          pageNum === '...'
            ? <span key={`ellipsis-${i}`} className="px-2">...</span>
            : (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? 'default' : 'outline'}
                size="sm"
                className="w-9"
                onClick={() => goToPage(pageNum as number)}
              >
                {pageNum}
              </Button>
            )
        )}

        <Button
          variant="outline" size="sm"
          disabled={currentPage === totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Returns array of page numbers with '...' ellipsis for gaps
// Shows: first, last, current, and up to 2 neighbors of current
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = []
  const delta = 1  // neighbors on each side of current
  const left = current - delta
  const right = current + delta

  pages.push(1)
  if (left > 2) pages.push('...')
  for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) {
    pages.push(i)
  }
  if (right < total - 1) pages.push('...')
  pages.push(total)
  return pages
}
```

---

## Sub-component: `DashboardSkeleton`

**File**: `src/components/dashboard/DashboardSkeleton.tsx`

Shown while loader is pending. Uses shadcn `Skeleton` component:

```tsx
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Metrics bar skeleton: 4 cards */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Table skeleton: 8 rows */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/40 px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-t flex items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## File Summary

Files to create for the dashboard:

```
src/
├── routes/
│   └── _auth/
│       └── projects/
│           └── index.tsx               # Route definition + loader
├── components/
│   └── dashboard/
│       ├── DashboardPage.tsx           # Page root component
│       ├── PageHeader.tsx              # "Projects" heading + "New Project" button
│       ├── MetricsBar.tsx              # 4 KPI metric cards
│       ├── FilterBar.tsx               # Search + status + tier filters
│       ├── ProjectsTable.tsx           # <table> with all rows
│       ├── ProjectRow.tsx              # Single table row
│       ├── TierBadge.tsx               # PRO / AUTO / A+ / PBK colored badge
│       ├── StatusCell.tsx              # Status pill + deployment progress bar
│       ├── RevenueStageCell.tsx        # Revenue stage icon + label + $ value
│       ├── ProjectsEmptyState.tsx      # Empty state (no projects or no results)
│       ├── Pagination.tsx              # Page number controls
│       └── DashboardSkeleton.tsx       # Loading skeleton
├── services/
│   └── projects.ts                     # getProjects(), createProject(), getDashboardMetrics()
└── lib/
    └── format.ts                       # formatDate(), formatCurrency()
```

---

## Shadcn Components Used

All imported from `@/components/ui/`:

| Component | Source | Usage |
|-----------|--------|-------|
| `Card` | shadcn Card | Metric cards |
| `Button` | shadcn Button | "New Project", pagination, filter clear |
| `Input` | shadcn Input | Search field |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` | shadcn Select | Status + tier filters |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | shadcn Table | Project list |
| `Skeleton` | shadcn Skeleton | Loading state |

Lucide icons used (from `lucide-react`):

| Icon | Usage |
|------|-------|
| `LayoutDashboard` | Active projects metric |
| `DollarSign` | Pipeline value metric |
| `AlertCircle` | Overdue invoices metric; error state |
| `CheckCircle2` | Closed this month metric; 100% deployment progress |
| `Search` | Search input left adornment |
| `X` | Clear filters button |
| `FolderOpen` | Empty state (no projects) |
| `SearchX` | Empty state (no results for filters) |
| `FileText` | Revenue stage: proposal |
| `PenLine` | Revenue stage: signed |
| `Send` | Revenue stage: invoiced |
| `ChevronLeft`, `ChevronRight` | Pagination prev/next |

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| `lg` (≥1024px) | Full table, 4-column metrics grid, filters inline |
| `md` (768–1023px) | Table with horizontal scroll, 2-column metrics grid, filters inline |
| `sm` (<768px) | Table with horizontal scroll, 1-column metrics grid, filter row wraps |

The `<table>` is wrapped in `<div className="overflow-x-auto">` to enable horizontal scrolling on narrow viewports. The table columns never collapse — the user scrolls horizontally to see all columns.

---

## Data Loading States

| State | When | Display |
|-------|------|---------|
| Loading | Initial route load; filter change | `DashboardSkeleton` via `pendingComponent` |
| Success, has data | Loader resolves with projects | `ProjectsTable` with rows |
| Success, no data | Loader resolves with empty array | `ProjectsEmptyState` |
| Error | Loader throws (Supabase error, network) | `errorComponent` with retry button |

---

## URL State Examples

| URL | Meaning |
|-----|---------|
| `/projects` | Default: all projects, page 1 |
| `/projects?status=deployment` | Filtered to deployment stage |
| `/projects?tier=autonomous_plus` | Filtered to Autonomous+ tier |
| `/projects?q=telepark` | Search for "telepark" |
| `/projects?status=deployment&tier=pro&page=2` | Combined filter, page 2 |
| `/projects?page=3` | Page 3, no other filters |

Filter state is entirely in the URL — no React state for filters. Navigating back/forward restores filter state automatically via TanStack Router's `validateSearch`.

---

## Additional Service Functions in `src/services/projects.ts`

These are referenced by other wizard pages but defined in the same file:

```typescript
// Get a single project by ID
export async function getProject(id: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Advance project to next stage
export async function advanceProjectStage(
  id: string,
  nextStatus: ProjectStatus
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ project_status: nextStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// Update project fields (partial update)
export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
```

---

## Sorting

The project list is sorted **server-side** (Supabase `order`):

- Default sort: `updated_at DESC` — most recently modified projects first
- No user-controllable sort columns in this version (the ops person manages a small number of projects; alphabetical vs recency is irrelevant)
- Column headers are **not** sortable (plain `<th>` text)

---

## Page Size

- Fixed at **20 rows per page**
- Not configurable by the user
- `PAGE_SIZE = 20` constant in `src/services/projects.ts`
