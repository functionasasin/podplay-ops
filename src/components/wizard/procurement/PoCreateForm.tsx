import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ShortageItem {
  hardware_catalog_id: string;
  sku: string;
  name: string;
  vendor: string;
  unit_cost: number | null;
  needed: number;
  on_hand: number;
  shortfall: number;
}

interface LineItem {
  hardware_catalog_id: string;
  sku: string;
  name: string;
  unit_cost: number;
  qty_ordered: number;
  selected: boolean;
}

interface PoCreateFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function PoCreateForm({ projectId, onSuccess }: PoCreateFormProps) {
  const [shortages, setShortages] = useState<ShortageItem[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      // Load BOM items with hardware catalog info
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bomItems } = await (supabase.from('project_bom_items') as any)
        .select(`quantity, hardware_catalog!inner(id, sku, name, vendor, unit_cost)`)
        .eq('project_id', projectId);

      if (!bomItems || bomItems.length === 0) {
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const catalogIds = bomItems.map((b: any) => b.hardware_catalog.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invItems } = await (supabase.from('inventory') as any)
        .select('item_id, quantity_on_hand')
        .in('item_id', catalogIds);

      const invMap: Record<string, number> = {};
      if (invItems) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const inv of invItems as any[]) {
          invMap[inv.item_id] = (invMap[inv.item_id] ?? 0) + inv.quantity_on_hand;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: ShortageItem[] = bomItems.map((b: any) => {
        const needed = b.quantity as number;
        const on_hand = invMap[b.hardware_catalog.id] ?? 0;
        const shortfall = Math.max(0, needed - on_hand);
        return {
          hardware_catalog_id: b.hardware_catalog.id as string,
          sku: b.hardware_catalog.sku as string,
          name: b.hardware_catalog.name as string,
          vendor: b.hardware_catalog.vendor as string,
          unit_cost: b.hardware_catalog.unit_cost as number | null,
          needed,
          on_hand,
          shortfall,
        };
      });

      setShortages(items);

      // Collect unique vendors
      const uniqueVendors = [...new Set(items.map((i) => i.vendor))].sort();
      setVendors(uniqueVendors);
      if (uniqueVendors.length > 0) setSelectedVendor(uniqueVendors[0]);

      setLoading(false);
    }

    load();
  }, [projectId]);

  // Update line items when vendor changes
  useEffect(() => {
    if (!selectedVendor) return;
    const vendorItems = shortages.filter((s) => s.vendor === selectedVendor);
    setLines(
      vendorItems.map((s) => ({
        hardware_catalog_id: s.hardware_catalog_id,
        sku: s.sku,
        name: s.name,
        unit_cost: s.unit_cost ?? 0,
        qty_ordered: s.shortfall > 0 ? s.shortfall : 1,
        selected: s.shortfall > 0,
      })),
    );
  }, [selectedVendor, shortages]);

  function toggleLine(catalogId: string) {
    setLines((prev) =>
      prev.map((l) =>
        l.hardware_catalog_id === catalogId ? { ...l, selected: !l.selected } : l,
      ),
    );
  }

  function updateQty(catalogId: string, qty: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.hardware_catalog_id === catalogId ? { ...l, qty_ordered: qty } : l,
      ),
    );
  }

  function updateUnitCost(catalogId: string, cost: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.hardware_catalog_id === catalogId ? { ...l, unit_cost: cost } : l,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const selectedLines = lines.filter((l) => l.selected && l.qty_ordered >= 1);
    if (selectedLines.length === 0) {
      setError('Select at least one item to order.');
      return;
    }
    if (selectedLines.some((l) => l.unit_cost <= 0)) {
      setError('All selected items must have a unit cost greater than 0.');
      return;
    }

    setSubmitting(true);
    try {
      // Generate PO number: PO-YYYY-NNN
      const year = new Date().getFullYear();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (supabase.from('purchase_orders') as any)
        .select('id', { count: 'exact', head: true })
        .ilike('po_number', `PO-${year}-%`);
      const seq = String((count ?? 0) + 1).padStart(3, '0');
      const po_number = `PO-${year}-${seq}`;

      const total_cost = selectedLines.reduce(
        (sum, l) => sum + l.qty_ordered * l.unit_cost,
        0,
      );

      // Insert purchase order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: po, error: poError } = await (supabase.from('purchase_orders') as any)
        .insert({
          po_number,
          vendor: selectedVendor,
          project_id: projectId,
          order_date: new Date().toISOString().split('T')[0],
          expected_date: expectedDate || null,
          total_cost,
          status: 'pending',
          notes: notes || null,
        })
        .select()
        .single();

      if (poError) throw new Error(poError.message);

      // Insert PO line items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemsError } = await (supabase.from('purchase_order_items') as any).insert(
        selectedLines.map((l) => ({
          purchase_order_id: po.id,
          hardware_catalog_id: l.hardware_catalog_id,
          qty_ordered: l.qty_ordered,
          qty_received: 0,
          unit_cost: l.unit_cost,
        })),
      );

      if (itemsError) throw new Error(itemsError.message);

      // Update inventory: increment qty_on_order, set order_status to 'ordered'
      for (const l of selectedLines) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: inv } = await (supabase.from('inventory') as any)
          .select('qty_on_order')
          .eq('item_id', l.hardware_catalog_id)
          .single();

        const currentQtyOnOrder = ((inv as { qty_on_order: number } | null)?.qty_on_order ?? 0);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('inventory') as any)
          .update({
            qty_on_order: currentQtyOnOrder + l.qty_ordered,
            order_status: 'ordered',
          })
          .eq('item_id', l.hardware_catalog_id);
      }

      // Create inventory movements (type: ordered → pending ordered stock)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('inventory_movements') as any).insert(
        selectedLines.map((l) => ({
          hardware_catalog_id: l.hardware_catalog_id,
          project_id: projectId,
          movement_type: 'purchase_order_received',
          qty_delta: 0,
          reference: po_number,
          notes: `PO ${po_number} created — ${l.qty_ordered} units ordered`,
        })),
      );

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PO.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading BOM data...</p>;

  if (success) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4">
        <p className="text-sm text-green-800 font-medium">Purchase order created successfully.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 text-sm text-green-700 underline"
        >
          Create another PO
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Vendor */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="po-vendor">
          Vendor
        </label>
        <select
          id="po-vendor"
          value={selectedVendor}
          onChange={(e) => setSelectedVendor(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full"
          required
        >
          {vendors.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Items to order */}
      <div>
        <p className="text-sm font-medium mb-2">Items to Order</p>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items for this vendor.</p>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                  <th className="py-2 px-3 w-8"></th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 w-24 text-right">Shortfall</th>
                  <th className="py-2 px-3 w-28 text-right">Qty to Order</th>
                  <th className="py-2 px-3 w-28 text-right">Unit Cost ($)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const shortage = shortages.find(
                    (s) => s.hardware_catalog_id === line.hardware_catalog_id,
                  );
                  return (
                    <tr key={line.hardware_catalog_id} className="border-b last:border-0">
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={line.selected}
                          onChange={() => toggleLine(line.hardware_catalog_id)}
                          aria-label={`Select ${line.name}`}
                        />
                      </td>
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">
                        {line.sku}
                      </td>
                      <td className="py-2 px-3">{line.name}</td>
                      <td className="py-2 px-3 text-right">
                        {shortage && shortage.shortfall > 0 ? (
                          <span className="text-red-600 font-medium">{shortage.shortfall}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min={1}
                          value={line.qty_ordered}
                          disabled={!line.selected}
                          onChange={(e) =>
                            updateQty(line.hardware_catalog_id, Number(e.target.value))
                          }
                          className="w-20 border rounded px-2 py-1 text-sm text-right disabled:opacity-50"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unit_cost}
                          disabled={!line.selected}
                          onChange={(e) =>
                            updateUnitCost(line.hardware_catalog_id, Number(e.target.value))
                          }
                          className="w-24 border rounded px-2 py-1 text-sm text-right disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expected delivery date */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="po-expected-date">
          Expected Delivery Date
        </label>
        <input
          id="po-expected-date"
          type="date"
          value={expectedDate}
          onChange={(e) => setExpectedDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="po-notes">
          Notes (optional)
        </label>
        <textarea
          id="po-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="border rounded px-3 py-2 text-sm w-full resize-none"
          placeholder="e.g., rush order, special instructions"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-60"
      >
        {submitting ? 'Creating PO…' : 'Create Purchase Order'}
      </button>
    </form>
  );
}
