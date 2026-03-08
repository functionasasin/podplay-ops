import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MonthlyOpexSnapshot {
  period_year: number;
  period_month: number;
  hardware_revenue: number;
  team_hardware_spend: number | null;
  her_ratio: number | null;
}

type HerStatus = 'loss' | 'break_even' | 'healthy' | 'strong' | 'no_data';

function classifyHER(her: number | null): HerStatus {
  if (her === null || her === undefined) return 'no_data';
  if (her < 1.0) return 'loss';
  if (her < 1.5) return 'break_even';
  if (her < 2.0) return 'healthy';
  return 'strong';
}

function getHerColor(status: HerStatus): string {
  switch (status) {
    case 'strong':
      return 'text-green-800';
    case 'healthy':
      return 'text-green-600';
    case 'break_even':
      return 'text-yellow-600';
    case 'loss':
      return 'text-red-700';
    default:
      return 'text-muted-foreground';
  }
}

function getHerBgColor(status: HerStatus): string {
  switch (status) {
    case 'strong':
      return 'bg-green-100 border-green-300';
    case 'healthy':
      return 'bg-green-50 border-green-200';
    case 'break_even':
      return 'bg-yellow-50 border-yellow-300';
    case 'loss':
      return 'bg-red-50 border-red-300';
    default:
      return 'bg-muted/30 border-border';
  }
}

function getHerLabel(status: HerStatus): string {
  switch (status) {
    case 'strong':
      return 'Strong — well above cost';
    case 'healthy':
      return 'Healthy — covers overhead';
    case 'break_even':
      return 'Break-even — marginal';
    case 'loss':
      return 'Loss — below cost';
    default:
      return 'No data';
  }
}

function getMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function HerCalculation() {
  const [snapshots, setSnapshots] = useState<MonthlyOpexSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('monthly_opex_snapshots') as any)
        .select('period_year, period_month, hardware_revenue, team_hardware_spend, her_ratio')
        .order('period_year', { ascending: false })
        .order('period_month', { ascending: false })
        .limit(12);
      setSnapshots(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading HER data...</p>;
  }

  // Compute period (YTD aggregate) HER
  const totalHardwareRevenue = snapshots.reduce((s, snap) => s + (snap.hardware_revenue ?? 0), 0);
  const totalTeamHardwareSpend = snapshots.reduce(
    (s, snap) => s + (snap.team_hardware_spend ?? 0),
    0
  );
  const periodHerRatio =
    totalTeamHardwareSpend > 0 ? totalHardwareRevenue / totalTeamHardwareSpend : null;
  const periodStatus = classifyHER(periodHerRatio);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">HER — Hardware Efficiency Ratio</h3>
        <p className="text-sm text-muted-foreground">
          Hardware revenue divided by team hardware spend. Measures how efficiently the hardware
          operations team generates revenue relative to what they cost.
        </p>
      </div>

      {/* Period Summary Card */}
      <div
        className={`border rounded-lg p-5 space-y-3 ${getHerBgColor(periodStatus)}`}
        data-testid="her-summary-card"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Rolling Period HER ({snapshots.length} month{snapshots.length !== 1 ? 's' : ''})
          </span>
          <span
            className={`text-3xl font-bold tabular-nums ${getHerColor(periodStatus)}`}
            data-testid="her-ratio"
          >
            {periodHerRatio !== null ? periodHerRatio.toFixed(2) : '—'}
          </span>
        </div>

        {/* Visual indicator bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Loss</span>
            <span>Break-even</span>
            <span>Healthy</span>
            <span>Strong</span>
          </div>
          <div className="relative h-3 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-600">
            {periodHerRatio !== null && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-700 shadow"
                style={{
                  left: `${Math.min(Math.max((periodHerRatio / 3.0) * 100, 0), 100)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                data-testid="her-indicator"
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>1.0</span>
            <span>1.5</span>
            <span>2.0</span>
            <span className="sr-only">3.0+</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getHerBgColor(periodStatus)} ${getHerColor(periodStatus)} border`}
            data-testid="her-status-badge"
          >
            {getHerLabel(periodStatus)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-current/10 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Hardware Revenue</p>
            <p className="font-semibold">{formatCurrency(totalHardwareRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Team Hardware Spend</p>
            <p className="font-semibold">{formatCurrency(totalTeamHardwareSpend)}</p>
          </div>
        </div>
      </div>

      {/* Monthly HER Table */}
      {snapshots.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Monthly HER History</h4>
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
                      <td className="px-4 py-2">
                        {getMonthLabel(snap.period_year, snap.period_month)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {formatCurrency(snap.hardware_revenue ?? 0)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground">
                        {formatCurrency(snap.team_hardware_spend ?? 0)}
                      </td>
                      <td className={`px-4 py-2 text-right font-semibold ${getHerColor(status)}`}>
                        {snap.her_ratio !== null ? snap.her_ratio.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`text-xs ${getHerColor(status)}`}>
                          {getHerLabel(status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {snapshots.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No monthly snapshots found. HER is computed from{' '}
          <code className="text-xs">monthly_opex_snapshots</code>.
        </p>
      )}
    </div>
  );
}
