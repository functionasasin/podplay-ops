import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

interface InventoryRow {
  name: string;
  sku: string;
  needed: number;
  on_hand: number;
  delta: number;
}

interface InventoryCheckPanelProps {
  projectId: string;
}

export function InventoryCheckPanel({ projectId }: InventoryCheckPanelProps) {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bomItems } = await (supabase.from('project_bom_items') as any)
        .select(
          `qty,
           hardware_catalog!inner(id, sku, name)`,
        )
        .eq('project_id', projectId);

      if (!bomItems || bomItems.length === 0) {
        setLoading(false);
        return;
      }

      // Build a map of catalog_id -> { sku, name, needed }
      const catalogIds = bomItems.map((b: any) => b.hardware_catalog.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invItems } = await (supabase.from('inventory') as any)
        .select('hardware_catalog_id, quantity_on_hand')
        .in('hardware_catalog_id', catalogIds);

      const invMap: Record<string, number> = {};
      if (invItems) {
        for (const inv of invItems as any[]) {
          invMap[inv.hardware_catalog_id] = (invMap[inv.hardware_catalog_id] ?? 0) + inv.quantity_on_hand;
        }
      }

      const result: InventoryRow[] = bomItems.map((b: any) => {
        const needed = b.qty as number;
        const on_hand = invMap[b.hardware_catalog.id] ?? 0;
        return {
          name: b.hardware_catalog.name as string,
          sku: b.hardware_catalog.sku as string,
          needed,
          on_hand,
          delta: on_hand - needed,
        };
      });

      setRows(result);
      setLoading(false);
    }

    load();
  }, [projectId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading inventory...</p>;
  if (rows.length === 0) {
    const cfg = EMPTY_STATES.inventoryCheckEmpty;
    return <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} cta={{ label: cfg.cta.label }} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-4 font-medium">SKU</th>
            <th className="py-2 pr-4 font-medium">Item Name</th>
            <th className="py-2 pr-4 font-medium w-28 text-right">Needed</th>
            <th className="py-2 pr-4 font-medium w-28 text-right">On Hand</th>
            <th className="py-2 font-medium w-28 text-right">Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isLow = row.delta < 0;
            const isSurplus = row.delta > 0;
            return (
              <tr key={row.sku} className="border-b hover:bg-muted/30">
                <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{row.sku}</td>
                <td className="py-2 pr-4">{row.name}</td>
                <td className="py-2 pr-4 text-right">{row.needed}</td>
                <td className="py-2 pr-4 text-right">{row.on_hand}</td>
                <td className="py-2 text-right">
                  {isLow && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <span aria-label="low stock">⚠</span>
                      {row.delta}
                    </span>
                  )}
                  {isSurplus && (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <span aria-label="surplus">✓</span>+{row.delta}
                    </span>
                  )}
                  {!isLow && !isSurplus && (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
