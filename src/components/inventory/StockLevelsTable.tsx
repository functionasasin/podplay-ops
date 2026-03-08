import React from 'react';

export interface StockLevelItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  qty_on_hand: number;
  qty_allocated: number;
  qty_available: number;
  reorder_threshold: number;
}

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

interface StockLevelsTableProps {
  items: StockLevelItem[];
}

export function StockLevelsTable({ items }: StockLevelsTableProps) {
  // Group by category preserving insertion order
  const grouped = items.reduce<Record<string, StockLevelItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm">
        No inventory items to display.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Item</th>
            <th className="px-4 py-3 text-left font-medium">SKU</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-center font-medium w-[90px]">On Hand</th>
            <th className="px-4 py-3 text-center font-medium w-[90px]">Allocated</th>
            <th className="px-4 py-3 text-center font-medium w-[90px]">Available</th>
            <th className="px-4 py-3 text-center font-medium w-[100px]">Reorder At</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <React.Fragment key={category}>
              {/* Category group header row */}
              <tr className="bg-muted/30 border-b">
                <td
                  colSpan={7}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {CATEGORY_LABELS[category] ?? category}
                </td>
              </tr>
              {grouped[category].map((item) => {
                const available = item.qty_on_hand - item.qty_allocated;
                const isLowStock =
                  item.reorder_threshold > 0 && available <= item.reorder_threshold;
                return (
                  <tr
                    key={item.id}
                    className={`border-b last:border-0 hover:bg-muted/30 ${isLowStock ? 'bg-destructive/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium">{item.name}</span>
                      {isLowStock && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </td>
                    <td className="px-4 py-3 text-center">{item.qty_on_hand}</td>
                    <td className="px-4 py-3 text-center">
                      {item.qty_allocated === 0 ? '—' : item.qty_allocated}
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-medium ${isLowStock ? 'text-destructive font-bold' : ''}`}
                    >
                      {available}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {item.reorder_threshold === 0 ? '—' : item.reorder_threshold}
                    </td>
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
