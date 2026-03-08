import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import type { HardwareCatalogItem } from '@/services/catalogService';
import {
  createCatalogItem,
  updateCatalogItem,
  deactivateCatalogItem,
  reactivateCatalogItem,
} from '@/services/catalogService';

// ─── Category config ────────────────────────────────────────────────────────

const BOM_CATEGORIES = [
  { value: 'network_rack',     label: 'Network Rack',    badge: 'bg-blue-100 text-blue-800' },
  { value: 'infrastructure',   label: 'Infrastructure',  badge: 'bg-gray-100 text-gray-800' },
  { value: 'replay_system',    label: 'Replay System',   badge: 'bg-purple-100 text-purple-800' },
  { value: 'displays',         label: 'Displays',        badge: 'bg-green-100 text-green-800' },
  { value: 'access_control',   label: 'Access Control',  badge: 'bg-orange-100 text-orange-800' },
  { value: 'surveillance',     label: 'Surveillance',    badge: 'bg-red-100 text-red-800' },
  { value: 'front_desk',       label: 'Front Desk',      badge: 'bg-teal-100 text-teal-800' },
  { value: 'pingpod_specific', label: 'PingPod Specific',badge: 'bg-yellow-100 text-yellow-800' },
  { value: 'signage',          label: 'Signage',         badge: 'bg-indigo-100 text-indigo-800' },
  { value: 'misc',             label: 'Misc',            badge: 'bg-slate-100 text-slate-800' },
] as const;

const categoryBadge = (cat: string) => {
  const found = BOM_CATEGORIES.find((c) => c.value === cat);
  return found ? found.badge : 'bg-slate-100 text-slate-800';
};

const categoryLabel = (cat: string) => {
  const found = BOM_CATEGORIES.find((c) => c.value === cat);
  return found ? found.label : cat;
};

// ─── Zod schema ─────────────────────────────────────────────────────────────

const catalogItemSchema = z.object({
  sku: z
    .string()
    .min(1, 'Required')
    .max(50)
    .regex(/^[A-Z0-9\-]+$/, 'Uppercase letters, numbers, hyphens only'),
  name: z.string().min(1, 'Required').max(200),
  model: z.string().max(100).optional().or(z.literal('')),
  category: z.string().min(1, 'Required'),
  vendor: z.string().min(1, 'Required').max(100),
  vendor_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  unit_cost: z.number().min(0).nullable().optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type CatalogItemFormValues = z.infer<typeof catalogItemSchema>;

// ─── Sheet (drawer) ──────────────────────────────────────────────────────────

interface ItemSheetProps {
  item: HardwareCatalogItem | null; // null = new item
  onClose: () => void;
  onSaved: (item: HardwareCatalogItem) => void;
}

function ItemSheet({ item, onClose, onSaved }: ItemSheetProps) {
  const isNew = item === null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CatalogItemFormValues>({
    resolver: zodResolver(catalogItemSchema),
    defaultValues: isNew
      ? { sku: '', name: '', model: '', category: '', vendor: '', vendor_url: '', unit_cost: undefined, notes: '' }
      : {
          sku: item.sku,
          name: item.name,
          model: item.model ?? '',
          category: item.category,
          vendor: item.vendor,
          vendor_url: item.vendor_url ?? '',
          unit_cost: item.unit_cost ?? undefined,
          notes: item.notes ?? '',
        },
  });

  const onSubmit = async (values: CatalogItemFormValues) => {
    try {
      const payload = {
        sku: values.sku,
        name: values.name,
        model: values.model || null,
        category: values.category,
        vendor: values.vendor,
        vendor_url: values.vendor_url || null,
        unit_cost: values.unit_cost ?? null,
        notes: values.notes || null,
        is_active: true,
      };
      if (isNew) {
        const created = await createCatalogItem(payload);
        toast.success('Item added');
        onSaved(created);
      } else {
        const { sku: _sku, ...patch } = payload;
        void _sku;
        const updated = await updateCatalogItem(item.id, patch);
        toast.success('Item updated');
        onSaved(updated);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('unique') || msg.includes('duplicate')) {
        setError('sku', { message: 'This SKU already exists.' });
      } else {
        toast.error('Failed to save: ' + msg);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-[480px] bg-background shadow-xl h-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {isNew ? 'Add Hardware Item' : 'Edit Hardware Item'}
          </h2>
        </div>

        {/* Body */}
        <form
          id="catalog-item-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {/* SKU */}
          <div>
            <label className="block text-sm font-medium mb-1">
              SKU <span className="text-destructive">*</span>
            </label>
            {isNew ? (
              <>
                <input
                  {...register('sku')}
                  className="w-full border border-border rounded px-3 py-2 text-sm font-mono"
                  placeholder="NET-UDM-SE"
                />
                {errors.sku && (
                  <p className="text-destructive text-xs mt-1">{errors.sku.message}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-mono text-sm px-3 py-2 bg-muted rounded">{item?.sku}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  SKU cannot be changed after creation — it is referenced by BOM templates and inventory.
                </p>
              </>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium mb-1">Model</label>
            <input
              {...register('model')}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              {...register('category')}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
            >
              <option value="">Select category…</option>
              {BOM_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-destructive text-xs mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Vendor */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Vendor <span className="text-destructive">*</span>
            </label>
            <input
              {...register('vendor')}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
            {errors.vendor && (
              <p className="text-destructive text-xs mt-1">{errors.vendor.message}</p>
            )}
          </div>

          {/* Vendor URL */}
          <div>
            <label className="block text-sm font-medium mb-1">Vendor URL</label>
            <input
              {...register('vendor_url')}
              type="url"
              className="w-full border border-border rounded px-3 py-2 text-sm"
              placeholder="https://store.ui.com/..."
            />
            {errors.vendor_url && (
              <p className="text-destructive text-xs mt-1">{errors.vendor_url.message}</p>
            )}
          </div>

          {/* Unit Cost */}
          <div>
            <label className="block text-sm font-medium mb-1">Unit Cost</label>
            <input
              {...register('unit_cost', { valueAsNumber: true })}
              type="number"
              min="0"
              step="0.01"
              className="w-full border border-border rounded px-3 py-2 text-sm"
              placeholder="0.00"
            />
            {errors.unit_cost && (
              <p className="text-destructive text-xs mt-1">{errors.unit_cost.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-border hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="catalog-item-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Deactivate dialog ───────────────────────────────────────────────────────

interface DeactivateDialogProps {
  item: HardwareCatalogItem;
  onClose: () => void;
  onDeactivated: (id: string) => void;
}

function DeactivateDialog({ item, onClose, onDeactivated }: DeactivateDialogProps) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      await deactivateCatalogItem(item.id);
      toast.success('Item deactivated');
      onDeactivated(item.id);
      onClose();
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="font-semibold text-lg mb-2">Deactivate {item.name}?</h3>
        <p className="text-sm text-muted-foreground mb-6">
          It will no longer appear in BOM selections but will remain in existing BOMs.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-border hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface CatalogSettingsProps {
  items: HardwareCatalogItem[];
}

export function CatalogSettings({ items: initialItems }: CatalogSettingsProps) {
  const [items, setItems] = useState<HardwareCatalogItem[]>(initialItems);
  const [searchQ, setSearchQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [sheetItem, setSheetItem] = useState<HardwareCatalogItem | null | undefined>(undefined); // undefined = closed, null = new, HardwareCatalogItem = edit
  const [deactivateItem, setDeactivateItem] = useState<HardwareCatalogItem | null>(null);
  const [openKebab, setOpenKebab] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = items;
    if (!showInactive) result = result.filter((i) => i.is_active);
    if (categoryFilter) result = result.filter((i) => i.category === categoryFilter);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q),
      );
    }
    return result;
  }, [items, showInactive, categoryFilter, searchQ]);

  const handleSaved = (saved: HardwareCatalogItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const handleDeactivated = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: false } : i)));
  };

  const handleReactivate = async (item: HardwareCatalogItem) => {
    try {
      await reactivateCatalogItem(item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: true } : i)));
      toast.success('Item reactivated');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setOpenKebab(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hardware Catalog</h2>
        <button
          onClick={() => setSheetItem(null)}
          className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm w-48"
          aria-label="Search catalog items"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-border rounded px-3 py-2 text-sm bg-background"
          aria-label="Category filter"
        >
          <option value="">Category: All</option>
          {BOM_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">SKU</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Vendor</th>
              <th className="text-right px-4 py-3 font-medium">Cost</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className={`border-t border-border hover:bg-muted/50 ${!item.is_active ? 'opacity-50' : ''}`}
                >
                  {/* SKU */}
                  <td className="px-4 py-3">
                    <span
                      className="font-mono text-xs"
                      title={item.sku}
                    >
                      {item.sku.length > 16 ? item.sku.slice(0, 16) + '…' : item.sku}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3">
                    <span title={item.name}>
                      {item.name.length > 30 ? item.name.slice(0, 30) + '…' : item.name}
                    </span>
                    {!item.is_active && (
                      <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-1 py-0.5 rounded">
                        Inactive
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryBadge(item.category)}`}
                    >
                      {categoryLabel(item.category)}
                    </span>
                  </td>

                  {/* Vendor */}
                  <td className="px-4 py-3 text-muted-foreground">{item.vendor}</td>

                  {/* Unit Cost */}
                  <td className="px-4 py-3 text-right">
                    {item.unit_cost != null ? `$${item.unit_cost.toFixed(2)}` : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() => setOpenKebab(openKebab === item.id ? null : item.id)}
                      className="p-1 rounded hover:bg-muted"
                      aria-label="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openKebab === item.id && (
                      <div className="absolute right-8 top-2 z-10 bg-background border border-border rounded shadow-md min-w-[120px]">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            setSheetItem(item);
                            setOpenKebab(null);
                          }}
                        >
                          Edit
                        </button>
                        {item.is_active ? (
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-destructive"
                            onClick={() => {
                              setDeactivateItem(item);
                              setOpenKebab(null);
                            }}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => handleReactivate(item)}
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Item count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Sheet */}
      {sheetItem !== undefined && (
        <ItemSheet
          item={sheetItem}
          onClose={() => setSheetItem(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Deactivate dialog */}
      {deactivateItem && (
        <DeactivateDialog
          item={deactivateItem}
          onClose={() => setDeactivateItem(null)}
          onDeactivated={handleDeactivated}
        />
      )}
    </div>
  );
}
