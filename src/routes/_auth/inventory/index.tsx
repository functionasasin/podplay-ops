import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

interface InventoryItem {
  id: string;
  hardware_catalog_id: string;
  qty_on_hand: number;
  qty_allocated: number;
  qty_available: number;
  reorder_threshold: number;
  notes: string | null;
  hardware_catalog: {
    sku: string;
    name: string;
    vendor: string;
    category: string;
    is_active: boolean;
  } | null;
}

function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      setLoading(true);
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: err } = await (supabase as any)
        .from('inventory')
        .select(
          `
          id,
          hardware_catalog_id,
          qty_on_hand,
          qty_allocated,
          qty_available,
          reorder_threshold,
          notes,
          hardware_catalog (
            sku,
            name,
            vendor,
            category,
            is_active
          )
        `,
        )
        .order('hardware_catalog(name)', { ascending: true });

      if (err) {
        setError(err.message);
      } else {
        setItems(data ?? []);
      }
      setLoading(false);
    }

    void loadInventory();
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
        <p className="text-destructive font-medium">Failed to load inventory</p>
        <p className="text-muted-foreground text-sm mt-1">{error}</p>
        <button
          className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
          onClick={() => void (async () => {
            setLoading(true);
            setError(null);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error: err } = await (supabase as any)
              .from('inventory')
              .select(
                `
                id,
                hardware_catalog_id,
                qty_on_hand,
                qty_allocated,
                qty_available,
                reorder_threshold,
                notes,
                hardware_catalog (
                  sku,
                  name,
                  vendor,
                  category,
                  is_active
                )
              `,
              )
              .order('hardware_catalog(name)', { ascending: true });
            if (err) setError(err.message);
            else setItems(data ?? []);
            setLoading(false);
          })()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    const cfg = EMPTY_STATES.inventoryEmpty;
    return (
      <div className="p-6">
        <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <span className="text-sm text-muted-foreground">{items.length} items</span>
      </div>

      <div className="rounded-md border overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Item</th>
              <th className="px-4 py-3 text-center font-medium w-[90px]">On Hand</th>
              <th className="px-4 py-3 text-center font-medium w-[90px]">Allocated</th>
              <th className="px-4 py-3 text-center font-medium w-[90px]">Available</th>
              <th className="px-4 py-3 text-center font-medium w-[100px]">Reorder At</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const cat = item.hardware_catalog;
              const isLowStock =
                item.reorder_threshold > 0 && item.qty_available <= item.reorder_threshold;
              return (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat?.name ?? '—'}</span>
                        {isLowStock && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                            LOW
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {cat?.sku} · {cat?.vendor}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{item.qty_on_hand}</td>
                  <td className="px-4 py-3 text-center">
                    {item.qty_allocated === 0 ? '—' : item.qty_allocated}
                  </td>
                  <td
                    className={`px-4 py-3 text-center font-medium ${isLowStock ? 'text-destructive font-bold' : ''}`}
                  >
                    {item.qty_available}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {item.reorder_threshold === 0 ? '—' : item.reorder_threshold}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/_auth/inventory/')({
  component: InventoryPage,
});
