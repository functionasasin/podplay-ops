import { useNavigate } from '@tanstack/react-router';
import { calculateCostChain } from '@/lib/cost-chain';
import { serviceTierLabels } from '@/lib/enum-labels';
import type { ServiceTier } from '@/lib/types';
import { formatCurrencyCompact, formatMarginPct, EMPTY_DISPLAY } from '@/lib/formatters';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

interface BomItemFlat {
  project_id: string;
  quantity: number;
  unit_cost_override: number | null;
  hardware_catalog: {
    unit_cost: number | null;
  } | null;
}

interface ProjectFlat {
  id: string;
  customer_name: string;
  venue_name: string;
  tier: string;
  court_count: number | null;
}

interface ProjectCostRow {
  id: string;
  customerName: string;
  venueName: string;
  tier: string;
  courtCount: number;
  landedCost: number;
  customerPrice: number;
  marginPct: number;
  perCourt: number;
}

interface CostAnalysisGlobalProps {
  projects: ProjectFlat[];
  bomItems: BomItemFlat[];
  taxRate: number;
  shippingRate: number;
  marginTarget: number;
}

export function CostAnalysisGlobal({ projects, bomItems, taxRate, shippingRate, marginTarget }: CostAnalysisGlobalProps) {
  const navigate = useNavigate();

  // Group BOM items by project_id
  const bomByProject: Record<string, BomItemFlat[]> = {};
  for (const item of bomItems) {
    if (!bomByProject[item.project_id]) bomByProject[item.project_id] = [];
    bomByProject[item.project_id].push(item);
  }

  // Compute per-project cost rows
  const rows: ProjectCostRow[] = projects.map((p) => {
    const items = bomByProject[p.id] ?? [];
    let landedCost = 0;
    let customerPrice = 0;
    for (const item of items) {
      const unitCost = item.unit_cost_override ?? item.hardware_catalog?.unit_cost ?? 0;
      const chain = calculateCostChain(unitCost, item.quantity, taxRate, shippingRate, marginTarget);
      landedCost += chain.landedCost;
      customerPrice += chain.customerPrice;
    }
    const courtCount = p.court_count ?? 0;
    const marginPct = customerPrice > 0 ? ((customerPrice - landedCost) / customerPrice) * 100 : 0;
    const perCourt = courtCount > 0 ? customerPrice / courtCount : 0;

    return {
      id: p.id,
      customerName: p.customer_name,
      venueName: p.venue_name,
      tier: p.tier,
      courtCount,
      landedCost,
      customerPrice,
      marginPct,
      perCourt,
    };
  });

  // Filter to only projects that have BOM data
  const rowsWithData = rows.filter((r) => r.landedCost > 0 || r.customerPrice > 0);

  if (rowsWithData.length === 0) {
    const cfg = EMPTY_STATES.costAnalysisGlobalEmpty;
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Cost Analysis by Project</h2>
        <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} />
      </section>
    );
  }

  const totalLanded = rowsWithData.reduce((s, r) => s + r.landedCost, 0);
  const totalPrice = rowsWithData.reduce((s, r) => s + r.customerPrice, 0);
  const totalMarginPct = totalPrice > 0 ? ((totalPrice - totalLanded) / totalPrice) * 100 : 0;
  const totalCourts = rowsWithData.reduce((s, r) => s + r.courtCount, 0);
  const totalPerCourt = totalCourts > 0 ? totalPrice / totalCourts : 0;

  function handleRowClick(projectId: string) {
    navigate({ to: '/projects/$projectId/financials', params: { projectId }, search: { tab: '2' } as Record<string, string> });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Cost Analysis by Project</h2>
        <p className="text-sm text-muted-foreground">Hardware cost comparison across all active projects</p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Venue</th>
              <th className="text-left px-4 py-3 font-medium">Tier</th>
              <th className="text-center px-4 py-3 font-medium">Courts</th>
              <th className="text-right px-4 py-3 font-medium">Landed Cost</th>
              <th className="text-right px-4 py-3 font-medium">Customer Price</th>
              <th className="text-right px-4 py-3 font-medium">Margin %</th>
              <th className="text-right px-4 py-3 font-medium">Per-Court</th>
            </tr>
          </thead>
          <tbody>
            {rowsWithData.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                onClick={() => handleRowClick(row.id)}
              >
                <td className="px-4 py-3">{row.customerName}</td>
                <td className="px-4 py-3">{row.venueName}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted">
                    {serviceTierLabels[row.tier as ServiceTier] ?? row.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{row.courtCount || EMPTY_DISPLAY}</td>
                <td className="px-4 py-3 text-right">{formatCurrencyCompact(row.landedCost)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrencyCompact(row.customerPrice)}</td>
                <td className="px-4 py-3 text-right">{row.customerPrice > 0 ? formatMarginPct(row.marginPct) : EMPTY_DISPLAY}</td>
                <td className="px-4 py-3 text-right">{row.courtCount > 0 ? formatCurrencyCompact(row.perCourt) : EMPTY_DISPLAY}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/50">
              <td colSpan={4} className="px-4 py-3 font-semibold">Totals</td>
              <td className="px-4 py-3 text-right font-semibold">{formatCurrencyCompact(totalLanded)}</td>
              <td className="px-4 py-3 text-right font-semibold">{formatCurrencyCompact(totalPrice)}</td>
              <td className="px-4 py-3 text-right font-semibold">{totalPrice > 0 ? formatMarginPct(totalMarginPct) : EMPTY_DISPLAY}</td>
              <td className="px-4 py-3 text-right font-semibold">{totalCourts > 0 ? formatCurrencyCompact(totalPerCourt) : EMPTY_DISPLAY}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
