import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';
import { CostAnalysisGlobal } from '@/components/financials/CostAnalysisGlobal';
import { getSettings } from '@/services/settingsService';

// ── Types ──────────────────────────────────────────────────────────────────

type FeeFrequency = 'monthly' | 'quarterly' | 'annually';

interface RecurringFeeRow {
  id: string;
  amount: number;
  frequency: FeeFrequency;
  projects: { project_name: string } | null;
}

interface PipelineProject {
  id: string;
  customer_name: string;
  venue_name: string;
  tier: string;
  court_count: number | null;
  project_status: string;
  revenue_stage: string;
  total_amount: number | null;
}

interface GlobalPnL {
  totalRevenue: number;
  totalCogs: number;
  totalExpenses: number;
  grossProfit: number;
  grossMarginPct: number;
}

interface HerSnapshot {
  period_year: number;
  period_month: number;
  hardware_revenue: number;
  team_hardware_spend: number | null;
  her_ratio: number | null;
}

// ── Recurring Fees Helpers ─────────────────────────────────────────────────

function toMonthly(amount: number, frequency: FeeFrequency): number {
  if (frequency === 'monthly') return amount;
  if (frequency === 'quarterly') return amount / 3;
  return amount / 12; // annually
}

// ── Helpers ────────────────────────────────────────────────────────────────

const REVENUE_STAGE_ORDER: Record<string, number> = {
  proposal: 0,
  signed: 1,
  deposit_invoiced: 2,
  deposit_paid: 3,
  final_invoiced: 4,
  final_paid: 5,
};

const REVENUE_STAGE_LABELS: Record<string, string> = {
  proposal: 'Proposal',
  signed: 'Signed',
  deposit_invoiced: 'Deposit Invoiced',
  deposit_paid: 'Deposit Paid',
  final_invoiced: 'Final Invoiced',
  final_paid: 'Final Paid',
};

function formatCurrency(n: number): string {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatMarginPct(pct: number): string {
  return (pct * 100).toFixed(1) + '%';
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

type HerStatus = 'loss' | 'break_even' | 'healthy' | 'strong' | 'no_data';

function classifyHER(her: number | null): HerStatus {
  if (her === null || her === undefined) return 'no_data';
  if (her < 1.0) return 'loss';
  if (her < 1.5) return 'break_even';
  if (her < 2.0) return 'healthy';
  return 'strong';
}

function herTextColor(status: HerStatus): string {
  switch (status) {
    case 'strong': return 'text-green-800';
    case 'healthy': return 'text-green-600';
    case 'break_even': return 'text-yellow-600';
    case 'loss': return 'text-red-700';
    default: return 'text-muted-foreground';
  }
}

function herBgColor(status: HerStatus): string {
  switch (status) {
    case 'strong': return 'bg-green-100 border-green-300';
    case 'healthy': return 'bg-green-50 border-green-200';
    case 'break_even': return 'bg-yellow-50 border-yellow-300';
    case 'loss': return 'bg-red-50 border-red-300';
    default: return 'bg-muted/30 border-border';
  }
}

function herLabel(status: HerStatus): string {
  switch (status) {
    case 'strong': return 'Strong — well above cost';
    case 'healthy': return 'Healthy — covers overhead';
    case 'break_even': return 'Break-even — marginal';
    case 'loss': return 'Loss — below cost';
    default: return 'No data';
  }
}

// ── Revenue Funnel Section ─────────────────────────────────────────────────

function RevenueFunnel({ projects }: { projects: PipelineProject[] }) {
  // Group projects by revenue_stage
  const byStage: Record<string, PipelineProject[]> = {};
  for (const p of projects) {
    const stage = p.revenue_stage ?? 'proposal';
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push(p);
  }

  const stages = Object.keys(REVENUE_STAGE_ORDER).filter((s) => byStage[s]?.length > 0);
  stages.sort((a, b) => REVENUE_STAGE_ORDER[a] - REVENUE_STAGE_ORDER[b]);

  const totalPipeline = projects.reduce((s, p) => s + (p.total_amount ?? 0), 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Revenue Funnel</h2>
        <span className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? 's' : ''} · {formatCurrency(totalPipeline)} pipeline
        </span>
      </div>

      {projects.length === 0 ? (
        (() => {
          const cfg = EMPTY_STATES.pipelineEmpty;
          return <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} cta={{ label: cfg.cta.label, href: cfg.cta.href }} />;
        })()
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Stage</th>
                <th className="text-center px-4 py-3 font-medium w-20">Count</th>
                <th className="text-right px-4 py-3 font-medium">Pipeline Value</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => {
                const rows = byStage[stage] ?? [];
                const value = rows.reduce((s, p) => s + (p.total_amount ?? 0), 0);
                return (
                  <tr key={stage} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted">
                        {REVENUE_STAGE_LABELS[stage] ?? stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{rows.length}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(value)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/50">
                <td className="px-4 py-3 text-sm font-semibold">Total</td>
                <td className="px-4 py-3 text-center text-sm font-semibold">{projects.length}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(totalPipeline)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

// ── P&L Overview Section ───────────────────────────────────────────────────

function PnlOverview({ pnl }: { pnl: GlobalPnL }) {
  const isNegative = pnl.grossProfit < 0;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">P&amp;L Overview</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenue</p>
          <p className="text-xl font-semibold">{formatCurrency(pnl.totalRevenue)}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">COGS</p>
          <p className="text-xl font-semibold text-muted-foreground">{formatCurrency(pnl.totalCogs)}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Expenses</p>
          <p className="text-xl font-semibold text-muted-foreground">{formatCurrency(pnl.totalExpenses)}</p>
        </div>
        <div className="border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Gross Profit</p>
          <p className={`text-xl font-semibold ${isNegative ? 'text-red-700' : 'text-green-700'}`}>
            {formatCurrency(pnl.grossProfit)}
          </p>
          {pnl.totalRevenue > 0 && (
            <p className={`text-xs ${pnl.grossMarginPct < 0.3 ? 'text-orange-600' : 'text-muted-foreground'}`}>
              {formatMarginPct(pnl.grossMarginPct)} margin
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── HER Chart Section ──────────────────────────────────────────────────────

function HerChart({ snapshots }: { snapshots: HerSnapshot[] }) {
  const totalHwRevenue = snapshots.reduce((s, snap) => s + (snap.hardware_revenue ?? 0), 0);
  const totalHwSpend = snapshots.reduce((s, snap) => s + (snap.team_hardware_spend ?? 0), 0);
  const periodHer = totalHwSpend > 0 ? totalHwRevenue / totalHwSpend : null;
  const periodStatus = classifyHER(periodHer);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">HER — Hardware Efficiency Ratio</h2>
      <p className="text-sm text-muted-foreground">
        Hardware revenue divided by team hardware spend (from monthly snapshots).
      </p>

      {/* Period summary card */}
      <div
        className={`border rounded-lg p-5 space-y-3 ${herBgColor(periodStatus)}`}
        data-testid="her-summary-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Rolling Period HER ({snapshots.length} month{snapshots.length !== 1 ? 's' : ''})
          </span>
          <span
            className={`text-3xl font-bold tabular-nums ${herTextColor(periodStatus)}`}
            data-testid="her-ratio"
          >
            {periodHer !== null ? periodHer.toFixed(2) : '—'}
          </span>
        </div>

        {/* Scale bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Loss</span>
            <span>Break-even</span>
            <span>Healthy</span>
            <span>Strong</span>
          </div>
          <div className="relative h-3 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-600">
            {periodHer !== null && (
              <div
                className="absolute top-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-700 shadow"
                style={{
                  left: `${Math.min(Math.max((periodHer / 3.0) * 100, 0), 100)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                data-testid="her-indicator"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${herBgColor(periodStatus)} ${herTextColor(periodStatus)}`}
            data-testid="her-status-badge"
          >
            {herLabel(periodStatus)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-current/10 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Hardware Revenue</p>
            <p className="font-semibold">{formatCurrency(totalHwRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Team Hardware Spend</p>
            <p className="font-semibold">{formatCurrency(totalHwSpend)}</p>
          </div>
        </div>
      </div>

      {/* Monthly history table */}
      {snapshots.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Month</th>
                <th className="text-right px-4 py-2 font-medium">HW Revenue</th>
                <th className="text-right px-4 py-2 font-medium">Team Spend</th>
                <th className="text-right px-4 py-2 font-medium">HER</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snap) => {
                const status = classifyHER(snap.her_ratio);
                return (
                  <tr
                    key={`${snap.period_year}-${snap.period_month}`}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2">{getMonthLabel(snap.period_year, snap.period_month)}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(snap.hardware_revenue ?? 0)}</td>
                    <td className="px-4 py-2 text-right text-muted-foreground">
                      {formatCurrency(snap.team_hardware_spend ?? 0)}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold ${herTextColor(status)}`}>
                      {snap.her_ratio !== null ? snap.her_ratio.toFixed(2) : '—'}
                    </td>
                    <td className={`px-4 py-2 text-xs ${herTextColor(status)}`}>
                      {herLabel(status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {snapshots.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No monthly snapshots found. HER is computed from{' '}
          <code className="text-xs">monthly_opex_snapshots</code>.
        </p>
      )}
    </section>
  );
}

// ── Recurring Fees Summary Section ────────────────────────────────────────

function RecurringFeesSummary({ fees }: { fees: RecurringFeeRow[] }) {
  // Group by project name
  const byProject: Record<string, { count: number; total: number }> = {};
  for (const fee of fees) {
    const name = fee.projects?.project_name ?? '(No Project)';
    if (!byProject[name]) byProject[name] = { count: 0, total: 0 };
    byProject[name].count += 1;
    byProject[name].total += toMonthly(Number(fee.amount), fee.frequency);
  }

  const totalMonthly = fees.reduce(
    (s, f) => s + toMonthly(Number(f.amount), f.frequency),
    0
  );

  const rows = Object.entries(byProject).sort((a, b) => b[1].total - a[1].total);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recurring Fees</h2>
        <span className="text-sm text-muted-foreground">
          {fees.length} active fee{fees.length !== 1 ? 's' : ''} · {formatCurrency(totalMonthly)}/mo
        </span>
      </div>

      {fees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recurring fees</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Project</th>
                <th className="text-center px-4 py-3 font-medium w-28"># Active Fees</th>
                <th className="text-right px-4 py-3 font-medium">Total Monthly</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([projectName, { count, total }]) => (
                <tr key={projectName} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">{projectName}</td>
                  <td className="px-4 py-3 text-center font-semibold">{count}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/50">
                <td className="px-4 py-3 text-sm font-semibold">Total</td>
                <td className="px-4 py-3 text-center text-sm font-semibold">{fees.length}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(totalMonthly)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function FinancialsDashboardPage() {
  const [projects, setProjects] = useState<PipelineProject[]>([]);
  const [pnl, setPnl] = useState<GlobalPnL>({
    totalRevenue: 0,
    totalCogs: 0,
    totalExpenses: 0,
    grossProfit: 0,
    grossMarginPct: 0,
  });
  const [herSnapshots, setHerSnapshots] = useState<HerSnapshot[]>([]);
  const [recurringFees, setRecurringFees] = useState<RecurringFeeRow[]>([]);
  const [costBomItems, setCostBomItems] = useState<Array<{ project_id: string; quantity: number; unit_cost_override: number | null; hardware_catalog: { unit_cost: number | null } | null }>>([]);
  const [costRates, setCostRates] = useState<{ tax: number; shipping: number; margin: number }>({ tax: 0, shipping: 0, margin: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [projRes, invRes, expRes, bomRes, herRes, feesRes, settingsData, costBomRes] = await Promise.all([
          // Projects with revenue_stage for funnel
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('projects')
            .select('id, customer_name, venue_name, tier, project_status, revenue_stage, court_count')
            .neq('project_status', 'cancelled')
            .order('created_at', { ascending: false }),

          // All invoices for P&L revenue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('invoices')
            .select('total_amount, status'),

          // All expenses
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('expenses')
            .select('amount'),

          // All BOM items for COGS (use quantity * unit_cost_override)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('project_bom_items')
            .select('quantity, unit_cost_override'),

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('monthly_opex_snapshots')
            .select('period_year, period_month, hardware_revenue, team_hardware_spend, her_ratio')
            .order('period_year', { ascending: false })
            .order('period_month', { ascending: false })
            .limit(12),

          // Recurring fees with project name
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('recurring_fees')
            .select('id, amount, frequency, projects!project_id(project_name)')
            .eq('is_active', true),

          // Settings for cost chain rates
          getSettings(),

          // BOM items with catalog unit_cost for cost analysis
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any)
            .from('project_bom_items')
            .select('project_id, quantity, unit_cost_override, hardware_catalog!catalog_item_id(unit_cost)'),
        ]);

        if (projRes.error) throw new Error(projRes.error.message);
        if (invRes.error) throw new Error(invRes.error.message);
        if (expRes.error) throw new Error(expRes.error.message);
        // project_bom_items.est_total_cost may not exist yet — treat as empty
        // monthly_opex_snapshots may not exist yet — treat as empty

        // Build pipeline projects: attach aggregate invoice amount per project
        const rawProjects: Array<{ id: string; customer_name: string; venue_name: string; tier: string; court_count: number | null; project_status: string; revenue_stage: string }> = projRes.data ?? [];
        // For total_amount in funnel we use a rough sum — just show project count per stage here
        const pipelineProjects: PipelineProject[] = rawProjects.map((p) => ({
          ...p,
          total_amount: null,
        }));
        setProjects(pipelineProjects);

        // Compute global P&L
        const allInvoices: Array<{ total_amount: number | null }> = invRes.data ?? [];
        const allExpenses: Array<{ amount: number }> = expRes.data ?? [];
        const allBom: Array<{ quantity: number; unit_cost_override: number | null }> = bomRes.error ? [] : (bomRes.data ?? []);

        const totalRevenue = allInvoices.reduce((s, i) => s + (i.total_amount ?? 0), 0);
        const totalCogs = allBom.reduce((s, b) => s + (b.quantity ?? 1) * (b.unit_cost_override ?? 0), 0);
        const totalExpenses = allExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);
        const grossProfit = totalRevenue - totalCogs - totalExpenses;
        const grossMarginPct = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

        setPnl({ totalRevenue, totalCogs, totalExpenses, grossProfit, grossMarginPct });
        setHerSnapshots(herRes.error ? [] : (herRes.data ?? []));
        setRecurringFees(feesRes.error ? [] : (feesRes.data ?? []));
        setCostRates({
          tax: settingsData.sales_tax_rate,
          shipping: settingsData.shipping_rate,
          margin: settingsData.target_margin,
        });
        setCostBomItems(costBomRes.error ? [] : (costBomRes.data ?? []));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive font-medium">Failed to load financials</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Financials</h1>
        <p className="text-sm text-muted-foreground mt-1">Cross-project financial overview</p>
      </div>

      <RevenueFunnel projects={projects} />
      <PnlOverview pnl={pnl} />
      <CostAnalysisGlobal
        projects={projects.map((p) => ({
          id: p.id,
          customer_name: p.customer_name,
          venue_name: p.venue_name,
          tier: p.tier,
          court_count: p.court_count,
        }))}
        bomItems={costBomItems}
        taxRate={costRates.tax}
        shippingRate={costRates.shipping}
        marginTarget={costRates.margin}
      />
      <HerChart snapshots={herSnapshots} />
      <RecurringFeesSummary fees={recurringFees} />
    </div>
  );
}

export const Route = createFileRoute('/_auth/financials/')({
  component: FinancialsDashboardPage,
});
