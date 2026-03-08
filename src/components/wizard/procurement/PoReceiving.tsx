import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PoItem {
  id: string;
  hardware_catalog_id: string;
  sku: string;
  name: string;
  qty_ordered: number;
  qty_received: number;
  unit_cost: number;
  qty_received_now: number;
}

interface OpenPo {
  id: string;
  po_number: string;
  vendor: string;
  status: string;
  expected_date: string | null;
  items: PoItem[];
}

interface PoReceivingProps {
  projectId: string;
  onSuccess?: () => void;
}

export function PoReceiving({ projectId, onSuccess }: PoReceivingProps) {
  const [openPos, setOpenPos] = useState<OpenPo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function loadOpenPos() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pos } = await (supabase.from('purchase_orders') as any)
      .select('id, po_number, vendor, status, expected_date')
      .eq('project_id', projectId)
      .in('status', ['pending', 'ordered', 'partial'])
      .order('created_at', { ascending: true });

    if (!pos || pos.length === 0) {
      setOpenPos([]);
      setLoading(false);
      return;
    }

    const poIds = pos.map((p: { id: string }) => p.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items } = await (supabase.from('purchase_order_items') as any)
      .select(`
        id,
        purchase_order_id,
        hardware_catalog_id,
        qty_ordered,
        qty_received,
        unit_cost,
        hardware_catalog!inner(sku, name)
      `)
      .in('purchase_order_id', poIds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsByPo: Record<string, PoItem[]> = {};
    if (items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of items as any[]) {
        const poId = item.purchase_order_id as string;
        if (!itemsByPo[poId]) itemsByPo[poId] = [];
        itemsByPo[poId].push({
          id: item.id as string,
          hardware_catalog_id: item.hardware_catalog_id as string,
          sku: item.hardware_catalog.sku as string,
          name: item.hardware_catalog.name as string,
          qty_ordered: item.qty_ordered as number,
          qty_received: item.qty_received as number,
          unit_cost: item.unit_cost as number,
          qty_received_now: 0,
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: OpenPo[] = pos.map((p: any) => ({
      id: p.id as string,
      po_number: p.po_number as string,
      vendor: p.vendor as string,
      status: p.status as string,
      expected_date: p.expected_date as string | null,
      items: itemsByPo[p.id] ?? [],
    }));

    setOpenPos(result);
    if (result.length > 0 && !selectedPoId) {
      setSelectedPoId(result[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOpenPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function updateQtyReceivedNow(poId: string, itemId: string, qty: number) {
    setOpenPos((prev) =>
      prev.map((po) =>
        po.id === poId
          ? {
              ...po,
              items: po.items.map((item) =>
                item.id === itemId ? { ...item, qty_received_now: qty } : item,
              ),
            }
          : po,
      ),
    );
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const po = openPos.find((p) => p.id === selectedPoId);
    if (!po) return;

    const receivings = po.items.filter((item) => item.qty_received_now >= 1);
    if (receivings.length === 0) {
      setError('Enter a received quantity (≥ 1) for at least one item.');
      return;
    }

    // Validate: receiving now + already received must not exceed ordered
    for (const item of receivings) {
      if (item.qty_received + item.qty_received_now > item.qty_ordered) {
        setError(
          `Cannot receive ${item.qty_received_now} of "${item.name}": would exceed ordered qty ${item.qty_ordered}.`,
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      for (const item of receivings) {
        const newQtyReceived = item.qty_received + item.qty_received_now;

        // 1. Update purchase_order_items.qty_received
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (supabase.from('purchase_order_items') as any)
          .update({ qty_received: newQtyReceived })
          .eq('id', item.id);
        if (updateErr) throw new Error(updateErr.message);

        // 2. Increment inventory.qty_on_hand via RPC
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: rpcErr } = await (supabase as any).rpc('increment_inventory', {
          p_hardware_catalog_id: item.hardware_catalog_id,
          p_delta: item.qty_received_now,
        });
        if (rpcErr) throw new Error(rpcErr.message);

        // 3. Record inventory movement
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: movErr } = await (supabase.from('inventory_movements') as any).insert({
          hardware_catalog_id: item.hardware_catalog_id,
          project_id: null,
          movement_type: 'purchase_order_received',
          qty_delta: item.qty_received_now,
          reference: trackingNumber || null,
          notes: `PO ${po.id} received`,
        });
        if (movErr) throw new Error(movErr.message);
      }

      // 4. Compute new PO status after all receivings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allItems } = await (supabase.from('purchase_order_items') as any)
        .select('qty_ordered, qty_received')
        .eq('purchase_order_id', po.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalOrdered = (allItems as any[]).reduce((s: number, i: any) => s + i.qty_ordered, 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const totalReceived = (allItems as any[]).reduce((s: number, i: any) => s + i.qty_received, 0);

      const newStatus =
        totalReceived === 0
          ? 'ordered'
          : totalReceived < totalOrdered
            ? 'partial'
            : 'received';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: poUpdateErr } = await (supabase.from('purchase_orders') as any)
        .update({
          status: newStatus,
          received_date: totalReceived === totalOrdered ? receivedDate : null,
          ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
        })
        .eq('id', po.id);
      if (poUpdateErr) throw new Error(poUpdateErr.message);

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record receiving.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading open purchase orders...</p>;

  if (openPos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No open purchase orders for this project.
      </p>
    );
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-50 border border-green-200 p-4">
        <p className="text-sm text-green-800 font-medium">Items received successfully.</p>
        <button
          onClick={() => {
            setSuccess(false);
            setTrackingNumber('');
            loadOpenPos();
          }}
          className="mt-2 text-sm text-green-700 underline"
        >
          Record another receiving
        </button>
      </div>
    );
  }

  const selectedPo = openPos.find((p) => p.id === selectedPoId);

  return (
    <form onSubmit={handleReceive} className="space-y-6 max-w-3xl">
      {/* PO selector */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="po-select">
          Purchase Order
        </label>
        <select
          id="po-select"
          value={selectedPoId ?? ''}
          onChange={(e) => setSelectedPoId(e.target.value)}
          className="border rounded px-3 py-2 text-sm w-full"
        >
          {openPos.map((po) => (
            <option key={po.id} value={po.id}>
              {po.po_number} — {po.vendor} ({po.status}
              {po.expected_date ? `, exp. ${po.expected_date}` : ''})
            </option>
          ))}
        </select>
      </div>

      {/* Line items table */}
      {selectedPo && selectedPo.items.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Items</p>
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 text-right w-24">Ordered</th>
                  <th className="py-2 px-3 text-right w-24">Received</th>
                  <th className="py-2 px-3 text-right w-24">Remaining</th>
                  <th className="py-2 px-3 text-right w-32">Receive Now</th>
                </tr>
              </thead>
              <tbody>
                {selectedPo.items.map((item) => {
                  const remaining = item.qty_ordered - item.qty_received;
                  const fullyReceived = remaining === 0;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b last:border-0 ${fullyReceived ? 'opacity-50' : ''}`}
                    >
                      <td className="py-2 px-3 font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </td>
                      <td className="py-2 px-3">{item.name}</td>
                      <td className="py-2 px-3 text-right">{item.qty_ordered}</td>
                      <td className="py-2 px-3 text-right">{item.qty_received}</td>
                      <td className="py-2 px-3 text-right">
                        {remaining > 0 ? (
                          <span className="text-amber-600 font-medium">{remaining}</span>
                        ) : (
                          <span className="text-green-600">✓</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={item.qty_received_now}
                          disabled={fullyReceived}
                          onChange={(e) =>
                            updateQtyReceivedNow(
                              selectedPo.id,
                              item.id,
                              Number(e.target.value),
                            )
                          }
                          aria-label={`Receive now for ${item.name}`}
                          className="w-24 border rounded px-2 py-1 text-sm text-right disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Received date */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="received-date">
          Received Date
        </label>
        <input
          id="received-date"
          type="date"
          value={receivedDate}
          onChange={(e) => setReceivedDate(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
          required
        />
      </div>

      {/* Tracking number */}
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="tracking-number">
          Tracking Number (optional)
        </label>
        <input
          id="tracking-number"
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="e.g., 1Z999AA10123456784"
          className="border rounded px-3 py-2 text-sm w-full max-w-sm"
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
        {submitting ? 'Recording…' : 'Record Receiving'}
      </button>
    </form>
  );
}
