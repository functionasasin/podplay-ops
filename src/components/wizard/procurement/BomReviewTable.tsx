import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateCostChain } from '@/lib/cost-chain';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  vendor: string;
  vendor_url: string | null;
  unit_cost: number | null;
}

interface RowState {
  id: string;
  hardware_catalog_id: string;
  sku: string;
  name: string;
  vendor: string;
  vendor_url: string | null;
  qty: number;
  unit_cost: number | null;
}

interface BomReviewTableProps {
  projectId: string;
}

export function BomReviewTable({ projectId }: BomReviewTableProps) {
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  useEffect(() => {
    async function loadBom() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('project_bom_items') as any)
        .select(
          `id,
           hardware_catalog_id,
           qty,
           unit_cost,
           hardware_catalog!inner(sku, name, vendor, vendor_url)`,
        )
        .eq('project_id', projectId)
        .order('created_at');

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setRows(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.map((item: any) => ({
            id: item.id,
            hardware_catalog_id: item.hardware_catalog_id,
            qty: item.qty,
            unit_cost: item.unit_cost,
            sku: item.hardware_catalog.sku,
            name: item.hardware_catalog.name,
            vendor: item.hardware_catalog.vendor,
            vendor_url: item.hardware_catalog.vendor_url,
          })),
        );
      }
      setLoading(false);
    }

    async function loadCatalog() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('hardware_catalog') as any)
        .select('id, sku, name, vendor, vendor_url, unit_cost')
        .eq('is_active', true)
        .order('sku');

      if (data) setCatalog(data);
    }

    loadBom();
    loadCatalog();
  }, [projectId]);

  function updateQty(id: string, qty: number) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, qty } : r)));
  }

  function updateUnitCost(id: string, unit_cost: number | null) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, unit_cost } : r)));
  }

  function swapSku(id: string, catalogId: string) {
    const item = catalog.find((c) => c.id === catalogId);
    if (!item) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              hardware_catalog_id: item.id,
              sku: item.sku,
              name: item.name,
              vendor: item.vendor,
              vendor_url: item.vendor_url,
              unit_cost: item.unit_cost,
            }
          : r,
      ),
    );
  }

  const DEFAULT_SHIPPING_RATE = 0.10;
  const DEFAULT_MARGIN = 0.10;

  if (loading) return <p className="text-sm text-muted-foreground">Loading BOM...</p>;
  if (rows.length === 0) {
    const cfg = EMPTY_STATES.bomReviewEmpty;
    return <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} cta={{ label: cfg.cta.label }} />;
  }

  let subtotal = 0;
  let grandTotal = 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">SKU</th>
            <th className="py-2 pr-4 font-medium">Item Name</th>
            <th className="py-2 pr-4 font-medium">Vendor</th>
            <th className="py-2 pr-4 font-medium w-24">Qty</th>
            <th className="py-2 pr-4 font-medium w-32">Unit Cost</th>
            <th className="py-2 pr-4 font-medium w-28">Total</th>
            <th className="py-2 pr-4 font-medium w-28">Landed Cost</th>
            <th className="py-2 pr-4 font-medium w-28">Customer Price</th>
            <th className="py-2 font-medium">Swap SKU</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            let lineTotal: number | null = null;
            let landedCost: number | null = null;
            let customerPrice: number | null = null;

            if (row.unit_cost != null) {
              const chain = calculateCostChain(
                row.unit_cost,
                row.qty,
                0,
                DEFAULT_SHIPPING_RATE,
                DEFAULT_MARGIN,
              );
              lineTotal = chain.total;
              landedCost = chain.landedCost;
              customerPrice = chain.customerPrice;
              subtotal += lineTotal;
              grandTotal += customerPrice;
            }

            return (
              <tr key={row.id} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{row.sku}</td>
                <td className="py-2 pr-4">
                  {row.vendor_url ? (
                    <a
                      href={row.vendor_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {row.name}
                    </a>
                  ) : (
                    row.name
                  )}
                </td>
                <td className="py-2 pr-4 text-muted-foreground">{row.vendor}</td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={row.qty}
                    onChange={(e) => updateQty(row.id, Number(e.target.value))}
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.unit_cost ?? ''}
                    placeholder="—"
                    onChange={(e) =>
                      updateUnitCost(
                        row.id,
                        e.target.value === '' ? null : Number(e.target.value),
                      )
                    }
                    className="w-28 border rounded px-2 py-1 text-sm"
                  />
                </td>
                <td className="py-2 pr-4">
                  {lineTotal != null ? `$${lineTotal.toFixed(2)}` : '—'}
                </td>
                <td className="py-2 pr-4">
                  {landedCost != null ? `$${landedCost.toFixed(2)}` : '—'}
                </td>
                <td className="py-2 pr-4">
                  {customerPrice != null ? `$${customerPrice.toFixed(2)}` : '—'}
                </td>
                <td className="py-2">
                  <select
                    value={row.hardware_catalog_id}
                    onChange={(e) => swapSku(row.id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm max-w-48"
                  >
                    {catalog.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.sku} — {c.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end gap-8 text-sm border-t pt-3">
        <div className="text-muted-foreground">
          Subtotal (est. cost):{' '}
          <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
        </div>
        <div className="text-muted-foreground">
          Grand Total (customer price):{' '}
          <span className="font-semibold text-foreground">${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
