import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { VALIDATION } from '@/lib/validation-messages';
import type { Vendor } from '@/services/vendorsService';
import {
  createVendor,
  updateVendor,
  deactivateVendor,
  reactivateVendor,
} from '@/services/vendorsService';

// ─── Form schema ──────────────────────────────────────────────────────────────

const VV = VALIDATION.settings.vendor;

const vendorSchema = z.object({
  name:           z.string().min(1, VV.name.required).max(200, VV.name.max),
  contact_name:   z.string().max(200, 'Contact name too long').optional().nullable(),
  email:          z.string().email(VV.email.format).optional().nullable().or(z.literal('')),
  phone:          z.string().max(30, 'Phone too long').optional().nullable(),
  website:        z.string().max(500, 'Website too long').optional().nullable(),
  lead_time_days: z.number().int('Must be a whole number').min(0, 'Must be 0 or more').optional().nullable(),
  notes:          z.string().max(1000, 'Notes too long').optional().nullable(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface VendorSheetProps {
  vendor: Vendor | null;
  onClose: () => void;
  onSaved: (vendor: Vendor) => void;
}

function VendorSheet({ vendor, onClose, onSaved }: VendorSheetProps) {
  const isNew = vendor === null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: isNew
      ? {
          name: '', contact_name: '', email: '', phone: '',
          website: '', lead_time_days: undefined, notes: '',
        }
      : {
          name:           vendor.name,
          contact_name:   vendor.contact_name ?? '',
          email:          vendor.email ?? '',
          phone:          vendor.phone ?? '',
          website:        vendor.website ?? '',
          lead_time_days: vendor.lead_time_days ?? undefined,
          notes:          vendor.notes ?? '',
        },
  });

  const onSubmit = async (values: VendorFormValues) => {
    const payload = {
      name:           values.name,
      contact_name:   values.contact_name || null,
      email:          values.email || null,
      phone:          values.phone || null,
      website:        values.website || null,
      lead_time_days: values.lead_time_days ?? null,
      notes:          values.notes || null,
      is_active:      true,
    };

    try {
      if (isNew) {
        const created = await createVendor(payload);
        toast.success('Vendor saved');
        onSaved(created);
      } else {
        const updated = await updateVendor(vendor.id, payload);
        toast.success('Vendor saved');
        onSaved(updated);
      }
      onClose();
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex flex-col w-full max-w-[480px] bg-background shadow-xl h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {isNew ? 'Add Vendor' : 'Edit Vendor'}
          </h2>
        </div>

        <form
          id="vendor-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              {...register('name')}
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
            />
            {errors.name && (
              <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input
              {...register('contact_name')}
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              {...register('phone')}
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              {...register('website')}
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
              placeholder="https://example.com"
            />
          </div>

          {/* Lead Time */}
          <div>
            <label className="block text-sm font-medium mb-1">Lead Time (days)</label>
            <input
              {...register('lead_time_days', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              type="number"
              min="0"
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
            />
            {errors.lead_time_days && (
              <p className="text-destructive text-xs mt-1">{errors.lead_time_days.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={4}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </form>

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
            form="vendor-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Vendor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface VendorSettingsProps {
  vendors: Vendor[];
}

export function VendorSettings({ vendors: initialVendors }: VendorSettingsProps) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [showInactive, setShowInactive] = useState(false);
  const [sheetVendor, setSheetVendor] = useState<Vendor | null | undefined>(undefined);
  const [openKebab, setOpenKebab] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Vendor | null>(null);

  const displayed = showInactive ? vendors : vendors.filter((v) => v.is_active);

  const handleSaved = (saved: Vendor) => {
    setVendors((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const handleDeactivate = (vendor: Vendor) => {
    setDeactivateTarget(vendor);
    setOpenKebab(null);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateVendor(deactivateTarget.id);
      setVendors((prev) =>
        prev.map((v) => (v.id === deactivateTarget.id ? { ...v, is_active: false } : v)),
      );
      toast.success('Vendor deactivated');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setDeactivateTarget(null);
  };

  const handleReactivate = async (vendor: Vendor) => {
    try {
      await reactivateVendor(vendor.id);
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, is_active: true } : v)),
      );
      toast.success('Vendor reactivated');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setOpenKebab(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vendors</h2>
        <button
          onClick={() => setSheetVendor(null)}
          className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Add Vendor
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
        />
        Show inactive
      </label>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Phone</th>
                <th className="text-left px-4 py-3 font-medium">Website</th>
                <th className="text-left px-4 py-3 font-medium">Lead Time</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No vendors found. Add one to get started.
                  </td>
                </tr>
              ) : (
                displayed.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className={cn(
                      'border-t border-border hover:bg-muted/50',
                      !vendor.is_active && 'opacity-50',
                    )}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 font-medium">
                      {vendor.name}
                      {!vendor.is_active && (
                        <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-1 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {vendor.contact_name ?? '—'}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {vendor.email
                        ? vendor.email.length > 25
                          ? vendor.email.slice(0, 25) + '…'
                          : vendor.email
                        : '—'}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {vendor.phone ?? '—'}
                    </td>

                    {/* Website */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {vendor.website
                        ? vendor.website.length > 25
                          ? vendor.website.slice(0, 25) + '…'
                          : vendor.website
                        : '—'}
                    </td>

                    {/* Lead Time */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {vendor.lead_time_days != null ? `${vendor.lead_time_days}d` : '—'}
                    </td>

                    {/* Active */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          vendor.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {vendor.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenKebab(openKebab === vendor.id ? null : vendor.id)
                        }
                        className="p-1 rounded hover:bg-muted"
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openKebab === vendor.id && (
                        <div className="absolute right-8 top-2 z-10 bg-background border border-border rounded shadow-md min-w-[120px]">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => {
                              setSheetVendor(vendor);
                              setOpenKebab(null);
                            }}
                          >
                            Edit
                          </button>
                          {vendor.is_active ? (
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-destructive"
                              onClick={() => handleDeactivate(vendor)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => handleReactivate(vendor)}
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
      </div>

      <p className="text-xs text-muted-foreground">
        {displayed.length} vendor{displayed.length !== 1 ? 's' : ''}
      </p>

      {/* Vendor sheet */}
      {sheetVendor !== undefined && (
        <VendorSheet
          vendor={sheetVendor}
          onClose={() => setSheetVendor(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Deactivate confirm dialog */}
      {deactivateTarget && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}
          title={`Deactivate ${deactivateTarget.name}?`}
          body="This vendor will be hidden from dropdowns but their data will be preserved."
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={confirmDeactivate}
        />
      )}
    </div>
  );
}
