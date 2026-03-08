import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EmptyState } from '@/components/ui/EmptyState';
import { EMPTY_STATES } from '@/lib/empty-state-configs';

interface PackingItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  category: string;
}

interface PackingListProps {
  projectId: string;
}

const CATEGORY_ORDER = [
  'network_rack',
  'replay_system',
  'displays',
  'access_control',
  'surveillance',
  'front_desk',
  'cabling',
  'signage',
  'infrastructure',
  'pingpod_specific',
];

const CATEGORY_LABELS: Record<string, string> = {
  network_rack: 'Network Rack',
  replay_system: 'Replay System',
  displays: 'Displays',
  access_control: 'Access Control',
  surveillance: 'Surveillance',
  front_desk: 'Front Desk',
  cabling: 'Cabling',
  signage: 'Signage',
  infrastructure: 'Infrastructure',
  pingpod_specific: 'PingPod Specific',
};

export function PackingList({ projectId }: PackingListProps) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItems() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('project_bom_items') as any)
        .select(
          `id,
           qty,
           hardware_catalog!inner(sku, name, category)`,
        )
        .eq('project_id', projectId)
        .order('created_at');

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setItems(
          data.map((item: any) => ({
            id: item.id,
            qty: item.qty,
            sku: item.hardware_catalog.sku,
            name: item.hardware_catalog.name,
            category: item.hardware_catalog.category,
          })),
        );
      }
      setLoading(false);
    }

    loadItems();
  }, [projectId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading packing list...</p>;
  if (items.length === 0) {
    const cfg = EMPTY_STATES.packingEmpty;
    return <EmptyState icon={cfg.icon} heading={cfg.heading} description={cfg.description} cta={{ label: cfg.cta.label }} />;
  }

  // Group items by category in spec-defined order
  const grouped = new Map<string, PackingItem[]>();
  for (const cat of CATEGORY_ORDER) {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) grouped.set(cat, catItems);
  }
  // Catch any items with unknown categories
  const knownCategories = new Set(CATEGORY_ORDER);
  const unknownItems = items.filter((i) => !knownCategories.has(i.category));
  if (unknownItems.length > 0) grouped.set('other', unknownItems);

  const totalItems = items.length;
  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page {
            font-size: 11pt;
            color: #000;
          }
          .print-page table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
          }
          .print-page th,
          .print-page td {
            border: 1px solid #ccc;
            padding: 4px 8px;
            text-align: left;
          }
          .print-page .category-header {
            background: #eee;
            font-weight: bold;
          }
        }
      `}</style>

      <div className="print-page space-y-6">
        <div className="flex items-center justify-between no-print">
          <p className="text-sm text-muted-foreground">
            {totalItems} line items · {totalQty} total units
          </p>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-sm border rounded hover:bg-muted/50 transition-colors"
          >
            Print / Save PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse border border-border">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="py-2 px-3 font-medium border border-border w-12">#</th>
                <th className="py-2 px-3 font-medium border border-border w-36">SKU</th>
                <th className="py-2 px-3 font-medium border border-border">Item Name</th>
                <th className="py-2 px-3 font-medium border border-border w-20 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(grouped.entries()).map(([cat, catItems]) => {
                const label =
                  cat === 'other'
                    ? 'Other'
                    : (CATEGORY_LABELS[cat] ?? cat);
                return (
                  <>
                    <tr key={`header-${cat}`} className="category-header bg-muted/20">
                      <td
                        colSpan={4}
                        className="py-1.5 px-3 font-semibold text-xs uppercase tracking-wide border border-border"
                      >
                        {label}
                      </td>
                    </tr>
                    {catItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/10">
                        <td className="py-1.5 px-3 text-muted-foreground border border-border">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-mono text-xs border border-border">
                          {item.sku}
                        </td>
                        <td className="py-1.5 px-3 border border-border">{item.name}</td>
                        <td className="py-1.5 px-3 text-right font-medium border border-border">
                          {item.qty}
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30 font-semibold">
                <td colSpan={3} className="py-2 px-3 border border-border text-right">
                  Total Units
                </td>
                <td className="py-2 px-3 text-right border border-border">{totalQty}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
