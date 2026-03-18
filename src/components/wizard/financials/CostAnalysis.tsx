import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSettings } from '@/services/settingsService';
import { calculateCostChain, type CostChainResult } from '@/lib/cost-chain';
import { bomCategoryLabels, bomCategorySortOrder, serviceTierLabels } from '@/lib/enum-labels';
import type { BomCategory } from '@/lib/types';
import { formatCurrencyPrecise, EMPTY_DISPLAY } from '@/lib/formatters';
import { PdfExportButton } from '@/components/ui/PdfExportButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

interface BomItemRow {
  id: string;
  quantity: number;
  unit_cost_override: number | null;
  hardware_catalog: {
    name: string;
    model: string | null;
    vendor: string | null;
    category: string;
    unit_cost: number | null;
  } | null;
}

interface ProjectInfo {
  customer_name: string;
  venue_name: string;
  court_count: number | null;
  tier: string | null;
}

interface GroupedItem {
  id: string;
  name: string;
  model: string | null;
  vendor: string | null;
  quantity: number;
  unitCost: number;
  chain: CostChainResult;
}

interface CategoryGroup {
  category: string;
  label: string;
  items: GroupedItem[];
  totalLanded: number;
  totalCustomerPrice: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  network_rack: 'bg-blue-100 text-blue-800 border-blue-200',
  replay_system: 'bg-purple-100 text-purple-800 border-purple-200',
  displays: 'bg-amber-100 text-amber-800 border-amber-200',
  access_control: 'bg-green-100 text-green-800 border-green-200',
  surveillance: 'bg-red-100 text-red-800 border-red-200',
  front_desk: 'bg-teal-100 text-teal-800 border-teal-200',
  cabling: 'bg-slate-100 text-slate-800 border-slate-200',
  signage: 'bg-pink-100 text-pink-800 border-pink-200',
  infrastructure: 'bg-orange-100 text-orange-800 border-orange-200',
  pingpod_specific: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export function CostAnalysis({ projectId }: { projectId: string }) {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [rates, setRates] = useState<{ tax: number; shipping: number; margin: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [bomRes, projRes, settings] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('project_bom_items')
          .select('id, quantity, unit_cost_override, hardware_catalog!catalog_item_id(name, model, vendor, category, unit_cost)')
          .eq('project_id', projectId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any)
          .from('projects')
          .select('customer_name, venue_name, court_count, tier')
          .eq('id', projectId)
          .single(),
        getSettings(),
      ]);

      const items: BomItemRow[] = bomRes.data ?? [];
      setProject(projRes.data ?? null);
      setRates({
        tax: settings.sales_tax_rate,
        shipping: settings.shipping_rate,
        margin: settings.target_margin,
      });

      // Group by category
      const byCategory: Record<string, GroupedItem[]> = {};
      for (const item of items) {
        const cat = item.hardware_catalog?.category ?? 'other';
        if (!byCategory[cat]) byCategory[cat] = [];
        const unitCost = item.unit_cost_override ?? item.hardware_catalog?.unit_cost ?? 0;
        const chain = calculateCostChain(
          unitCost,
          item.quantity,
          settings.sales_tax_rate,
          settings.shipping_rate,
          settings.target_margin,
        );
        byCategory[cat].push({
          id: item.id,
          name: item.hardware_catalog?.name ?? 'Unknown',
          model: item.hardware_catalog?.model ?? null,
          vendor: item.hardware_catalog?.vendor ?? null,
          quantity: item.quantity,
          unitCost,
          chain,
        });
      }

      // Sort categories using canonical order, unknown categories go last
      const sortedCategories = Object.keys(byCategory).sort((a, b) => {
        const aOrder = bomCategorySortOrder[a as BomCategory] ?? 999;
        const bOrder = bomCategorySortOrder[b as BomCategory] ?? 999;
        return aOrder - bOrder;
      });

      const result: CategoryGroup[] = sortedCategories.map((cat) => {
        const catItems = byCategory[cat];
        return {
          category: cat,
          label: bomCategoryLabels[cat as BomCategory] ?? 'Other',
          items: catItems,
          totalLanded: catItems.reduce((s, i) => s + i.chain.landedCost, 0),
          totalCustomerPrice: catItems.reduce((s, i) => s + i.chain.customerPrice, 0),
        };
      });

      setGroups(result);
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading cost analysis...</p>;
  }

  if (groups.length === 0) {
    const cfg = EMPTY_STATES.costAnalysisEmpty;
    return <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} />;
  }

  const grandLanded = groups.reduce((s, g) => s + g.totalLanded, 0);
  const grandCustomerPrice = groups.reduce((s, g) => s + g.totalCustomerPrice, 0);
  const courtCount = project?.court_count ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Cost Analysis</h2>
          <p className="text-sm text-muted-foreground">Hardware cost breakdown by category with full cost chain</p>
        </div>
        <PdfExportButton />
      </div>

      {/* Context badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        {project?.customer_name && (
          <span className="px-2 py-1 rounded bg-muted border">Customer: {project.customer_name}</span>
        )}
        {courtCount > 0 && (
          <span className="px-2 py-1 rounded bg-muted border">Courts: {courtCount}</span>
        )}
        {project?.tier && (
          <span className="px-2 py-1 rounded bg-muted border">
            Tier: {serviceTierLabels[project.tier as keyof typeof serviceTierLabels] ?? project.tier}
          </span>
        )}
        {rates && (
          <>
            <span className="px-2 py-1 rounded bg-muted border">Tax: {(rates.tax * 100).toFixed(2)}%</span>
            <span className="px-2 py-1 rounded bg-muted border">S&H: {(rates.shipping * 100).toFixed(0)}%</span>
            <span className="px-2 py-1 rounded bg-muted border">Margin: {(rates.margin * 100).toFixed(0)}%</span>
          </>
        )}
      </div>

      {/* Category groups */}
      {groups.map((group) => (
        <div key={group.category} className="border rounded-lg overflow-hidden">
          {/* Category header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[group.category] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {group.label}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium">Device</th>
                  <th className="text-left px-4 py-2 font-medium">Vendor</th>
                  <th className="text-center px-4 py-2 font-medium">Qty</th>
                  <th className="text-right px-4 py-2 font-medium">Unit Cost</th>
                  <th className="text-right px-4 py-2 font-medium">Total</th>
                  <th className="text-right px-4 py-2 font-medium">Tax</th>
                  <th className="text-right px-4 py-2 font-medium">S&H</th>
                  <th className="text-right px-4 py-2 font-medium">Landed</th>
                  <th className="text-right px-4 py-2 font-medium">Customer Price</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2">
                      <span className="font-medium">{item.name}</span>
                      {item.model && <span className="block text-xs text-muted-foreground">{item.model}</span>}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{item.vendor ?? EMPTY_DISPLAY}</td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{item.unitCost > 0 ? formatCurrencyPrecise(item.unitCost) : EMPTY_DISPLAY}</td>
                    <td className="px-4 py-2 text-right">{item.unitCost > 0 ? formatCurrencyPrecise(item.chain.total) : EMPTY_DISPLAY}</td>
                    <td className="px-4 py-2 text-right">{item.unitCost > 0 ? formatCurrencyPrecise(item.chain.tax) : EMPTY_DISPLAY}</td>
                    <td className="px-4 py-2 text-right">{item.unitCost > 0 ? formatCurrencyPrecise(item.chain.shipping) : EMPTY_DISPLAY}</td>
                    <td className="px-4 py-2 text-right">{item.unitCost > 0 ? formatCurrencyPrecise(item.chain.landedCost) : EMPTY_DISPLAY}</td>
                    <td className="px-4 py-2 text-right font-medium">{item.unitCost > 0 ? formatCurrencyPrecise(item.chain.customerPrice) : EMPTY_DISPLAY}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50">
                  <td colSpan={7} className="px-4 py-2 text-sm font-semibold text-right">{group.label} Total</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrencyPrecise(group.totalLanded)}</td>
                  <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrencyPrecise(group.totalCustomerPrice)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ))}

      {/* Cost Summary */}
      <div className="border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b">
          <h3 className="text-sm font-semibold">Cost Summary</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2 font-medium">Category</th>
              <th className="text-right px-4 py-2 font-medium">Landed Cost</th>
              <th className="text-right px-4 py-2 font-medium">Customer Price</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.category} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2">{group.label}</td>
                <td className="px-4 py-2 text-right">{formatCurrencyPrecise(group.totalLanded)}</td>
                <td className="px-4 py-2 text-right">{formatCurrencyPrecise(group.totalCustomerPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/50">
              <td className="px-4 py-2 font-semibold">Total</td>
              <td className="px-4 py-2 text-right font-semibold">{formatCurrencyPrecise(grandLanded)}</td>
              <td className="px-4 py-2 text-right font-semibold">{formatCurrencyPrecise(grandCustomerPrice)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Per-court cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 space-y-1 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Per Court (Cost)</p>
          <p className="text-xl font-semibold">
            {courtCount > 0 ? formatCurrencyPrecise(grandLanded / courtCount) : EMPTY_DISPLAY}
          </p>
        </div>
        <div className="border rounded-lg p-4 space-y-1 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Per Court (Price)</p>
          <p className="text-xl font-semibold">
            {courtCount > 0 ? formatCurrencyPrecise(grandCustomerPrice / courtCount) : EMPTY_DISPLAY}
          </p>
        </div>
      </div>
    </div>
  );
}
