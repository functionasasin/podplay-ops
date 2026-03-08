import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type ReplaySignStatus = 'staged' | 'shipped' | 'delivered' | 'installed';
type OutreachChannel = 'slack' | 'email' | 'other';

const STATUS_BADGE: Record<ReplaySignStatus, string> = {
  staged: 'bg-gray-100 text-gray-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-yellow-100 text-yellow-800',
  installed: 'bg-green-100 text-green-800',
};

const STATUS_LABEL: Record<ReplaySignStatus, string> = {
  staged: 'Staged',
  shipped: 'Shipped',
  delivered: 'Delivered',
  installed: 'Installed',
};

interface ReplaySigns {
  id: string;
  qty: number;
  status: ReplaySignStatus;
  outreach_channel: OutreachChannel | null;
  outreach_date: string | null;
  vendor_order_id: string | null;
  tracking_number: string | null;
  shipped_date: string | null;
  delivered_date: string | null;
  installed_date: string | null;
  notes: string | null;
}

interface ReplaySignFulfillmentProps {
  projectId: string;
}

const COST_PER_UNIT = 25;

export function ReplaySignFulfillment({ projectId }: ReplaySignFulfillmentProps) {
  const [signs, setSigns] = useState<ReplaySigns | null>(null);
  const [courtCount, setCourtCount] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state (synced from record)
  const [qty, setQty] = useState<number>(0);
  const [outreachChannel, setOutreachChannel] = useState<OutreachChannel | ''>('');
  const [outreachDate, setOutreachDate] = useState('');
  const [vendorOrderId, setVendorOrderId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippedDate, setShippedDate] = useState('');
  const [deliveredDate, setDeliveredDate] = useState('');
  const [installedDate, setInstalledDate] = useState('');
  const [notes, setNotes] = useState('');

  async function load() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project } = await (supabase.from('projects') as any)
      .select('court_count')
      .eq('id', projectId)
      .single();
    const cc = (project?.court_count as number) ?? 4;
    setCourtCount(cc);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('replay_signs') as any)
      .select(
        'id, qty, status, outreach_channel, outreach_date, vendor_order_id, tracking_number, shipped_date, delivered_date, installed_date, notes',
      )
      .eq('project_id', projectId)
      .maybeSingle();

    if (data) {
      setSigns(data as ReplaySigns);
      syncForm(data as ReplaySigns);
    } else {
      // Create the record
      const defaultQty = cc * 2;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inserted } = await (supabase.from('replay_signs') as any)
        .insert({ project_id: projectId, qty: defaultQty, status: 'staged' })
        .select()
        .single();
      if (inserted) {
        setSigns(inserted as ReplaySigns);
        syncForm(inserted as ReplaySigns);
      }
    }
    setLoading(false);
  }

  function syncForm(r: ReplaySigns) {
    setQty(r.qty);
    setOutreachChannel((r.outreach_channel as OutreachChannel) ?? '');
    setOutreachDate(r.outreach_date ?? '');
    setVendorOrderId(r.vendor_order_id ?? '');
    setTrackingNumber(r.tracking_number ?? '');
    setShippedDate(r.shipped_date ?? '');
    setDeliveredDate(r.delivered_date ?? '');
    setInstalledDate(r.installed_date ?? '');
    setNotes(r.notes ?? '');
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!signs) return;
    setError(null);
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('replay_signs') as any)
        .update({
          qty,
          outreach_channel: outreachChannel || null,
          outreach_date: outreachDate || null,
          vendor_order_id: vendorOrderId.trim() || null,
          tracking_number: trackingNumber.trim() || null,
          shipped_date: shippedDate || null,
          delivered_date: deliveredDate || null,
          installed_date: installedDate || null,
          notes: notes.trim() || null,
        })
        .eq('project_id', projectId);
      if (updateError) throw new Error(updateError.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(newStatus: 'shipped' | 'delivered' | 'installed') {
    if (!signs) return;
    setError(null);
    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dateField: Record<string, string> = {
        shipped: 'shipped_date',
        delivered: 'delivered_date',
        installed: 'installed_date',
      };

      const patch: Record<string, unknown> = {
        status: newStatus,
        [dateField[newStatus]]: today,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from('replay_signs') as any)
        .update(patch)
        .eq('project_id', projectId);
      if (updateError) throw new Error(updateError.message);

      if (newStatus === 'installed') {
        // Record inventory movement
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: catalogItem } = await (supabase.from('hardware_catalog') as any)
          .select('id')
          .eq('sku', 'REPLAY-SIGN')
          .single();
        if (catalogItem) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('inventory_movements') as any).insert({
            hardware_catalog_id: catalogItem.id,
            project_id: projectId,
            movement_type: 'project_shipped',
            qty_delta: -signs.qty,
            notes: `Replay signs installed at venue`,
          });
        }
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading replay signs...</p>;
  if (!signs) return <p className="text-sm text-red-600">Failed to load replay signs record.</p>;

  const totalCost = qty * COST_PER_UNIT;
  const defaultQty = courtCount * 2;

  const canMarkShipped = signs.status === 'staged' && !!signs.outreach_date;
  const canMarkDelivered = signs.status === 'shipped' && !!signs.shipped_date;
  const canMarkInstalled = signs.status === 'delivered' && !!signs.delivered_date;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-block px-3 py-1 rounded text-sm font-medium ${STATUS_BADGE[signs.status]}`}
        >
          {STATUS_LABEL[signs.status]}
        </span>

        {signs.status === 'staged' && (
          <button
            onClick={() => handleTransition('shipped')}
            disabled={!canMarkShipped || saving}
            title={!canMarkShipped ? 'Set outreach date before marking shipped' : undefined}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-50"
          >
            Mark Shipped
          </button>
        )}
        {signs.status === 'shipped' && (
          <button
            onClick={() => handleTransition('delivered')}
            disabled={!canMarkDelivered || saving}
            title={!canMarkDelivered ? 'Set shipped date before marking delivered' : undefined}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-50"
          >
            Mark Delivered
          </button>
        )}
        {signs.status === 'delivered' && (
          <button
            onClick={() => handleTransition('installed')}
            disabled={!canMarkInstalled || saving}
            title={!canMarkInstalled ? 'Set delivered date before marking installed' : undefined}
            className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-50"
          >
            Mark Installed
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Qty / Cost */}
        <div className="border rounded-md p-4 space-y-4 bg-muted/20">
          <h3 className="text-sm font-semibold">Replay Signs — Aluminum Printed (Fast Signs)</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-qty">
                Qty
              </label>
              <input
                id="rs-qty"
                type="number"
                min={1}
                max={200}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="border rounded px-3 py-2 text-sm w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-calculated: {courtCount} courts × 2 = {defaultQty}. Adjust if ordering extras.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cost/Unit</label>
              <input
                type="text"
                readOnly
                value="$25.00"
                className="border rounded px-3 py-2 text-sm w-full bg-muted/40 text-muted-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Cost</label>
              <input
                type="text"
                readOnly
                value={`$${totalCost.toFixed(2)}`}
                className="border rounded px-3 py-2 text-sm w-full bg-muted/40 text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Outreach */}
        <div className="border rounded-md p-4 space-y-4 bg-muted/20">
          <h3 className="text-sm font-semibold">Outreach</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-channel">
                Channel
              </label>
              <select
                id="rs-channel"
                value={outreachChannel}
                onChange={(e) => setOutreachChannel(e.target.value as OutreachChannel | '')}
                className="border rounded px-3 py-2 text-sm w-full"
              >
                <option value="">— Select —</option>
                <option value="slack">Slack</option>
                <option value="email">Email</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-outreach-date">
                Outreach Date
              </label>
              <input
                id="rs-outreach-date"
                type="date"
                value={outreachDate}
                onChange={(e) => setOutreachDate(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-vendor-order">
                Vendor Order ID
              </label>
              <input
                id="rs-vendor-order"
                type="text"
                value={vendorOrderId}
                onChange={(e) => setVendorOrderId(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
                placeholder="Fast Signs confirmation #"
              />
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="border rounded-md p-4 space-y-4 bg-muted/20">
          <h3 className="text-sm font-semibold">Shipping</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-tracking">
                Tracking Number
              </label>
              <input
                id="rs-tracking"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-shipped-date">
                Shipped Date
              </label>
              <input
                id="rs-shipped-date"
                type="date"
                value={shippedDate}
                onChange={(e) => setShippedDate(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-delivered-date">
                Delivered Date
              </label>
              <input
                id="rs-delivered-date"
                type="date"
                value={deliveredDate}
                onChange={(e) => setDeliveredDate(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="rs-installed-date">
                Installed Date
              </label>
              <input
                id="rs-installed-date"
                type="date"
                value={installedDate}
                onChange={(e) => setInstalledDate(e.target.value)}
                className="border rounded px-3 py-2 text-sm w-full"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="rs-notes">
            Notes
          </label>
          <textarea
            id="rs-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="border rounded px-3 py-2 text-sm w-full resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
