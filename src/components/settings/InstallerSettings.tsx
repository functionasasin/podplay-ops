import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { installerTypeLabels } from '@/lib/enum-labels';
import { VALIDATION } from '@/lib/validation-messages';
import type { Installer } from '@/services/installersService';
import {
  createInstaller,
  updateInstaller,
  deactivateInstaller,
  reactivateInstaller,
} from '@/services/installersService';

// ─── Form schema ──────────────────────────────────────────────────────────────

const VI = VALIDATION.settings.installer;

const installerSchema = z.object({
  name:           z.string().min(1, VI.name.required).max(200, VI.name.max),
  company:        z.string().max(200, 'Company name too long').optional().nullable(),
  email:          z.string().email(VI.email.format).optional().nullable().or(z.literal('')),
  phone:          z.string().max(30, 'Phone too long').optional().nullable(),
  installer_type: z.enum(['podplay_vetted', 'client_own']),
  regions:        z.string().optional().nullable(), // comma-separated; parsed on save
  hourly_rate:    z.number().min(0, VI.hourly_rate.min).optional().nullable(),
  notes:          z.string().max(1000, 'Notes too long').optional().nullable(),
});

type InstallerFormValues = z.infer<typeof installerSchema>;

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface InstallerSheetProps {
  installer: Installer | null;
  onClose: () => void;
  onSaved: (installer: Installer) => void;
}

function InstallerSheet({ installer, onClose, onSaved }: InstallerSheetProps) {
  const isNew = installer === null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InstallerFormValues>({
    resolver: zodResolver(installerSchema),
    defaultValues: isNew
      ? {
          name: '', company: '', email: '', phone: '',
          installer_type: 'podplay_vetted', regions: '', hourly_rate: undefined, notes: '',
        }
      : {
          name:           installer.name,
          company:        installer.company ?? '',
          email:          installer.email ?? '',
          phone:          installer.phone ?? '',
          installer_type: installer.installer_type,
          regions:        (installer.regions ?? []).join(', '),
          hourly_rate:    installer.hourly_rate ?? undefined,
          notes:          installer.notes ?? '',
        },
  });

  const onSubmit = async (values: InstallerFormValues) => {
    const regions = values.regions
      ? values.regions.split(',').map((r) => r.trim()).filter(Boolean)
      : [];

    const payload = {
      name:           values.name,
      company:        values.company || null,
      email:          values.email || null,
      phone:          values.phone || null,
      installer_type: values.installer_type,
      regions,
      hourly_rate:    values.hourly_rate ?? null,
      notes:          values.notes || null,
      is_active:      true,
    };

    try {
      if (isNew) {
        const created = await createInstaller(payload);
        toast.success('Installer saved');
        onSaved(created);
      } else {
        const updated = await updateInstaller(installer.id, payload);
        toast.success('Installer saved');
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
            {isNew ? 'Add Installer' : 'Edit Installer'}
          </h2>
        </div>

        <form
          id="installer-form"
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

          {/* Company */}
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input
              {...register('company')}
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Type <span className="text-destructive">*</span>
            </label>
            <select
              {...register('installer_type')}
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm bg-background"
            >
              <option value="podplay_vetted">{installerTypeLabels.podplay_vetted}</option>
              <option value="client_own">{installerTypeLabels.client_own}</option>
            </select>
            {errors.installer_type && (
              <p className="text-destructive text-xs mt-1">{errors.installer_type.message}</p>
            )}
          </div>

          {/* Regions */}
          <div>
            <label className="block text-sm font-medium mb-1">Regions</label>
            <input
              {...register('regions')}
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
              placeholder="NCR, Calabarzon, Central Luzon"
            />
            <p className="text-xs text-muted-foreground mt-1">Comma-separated list</p>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-medium mb-1">Hourly Rate</label>
            <input
              {...register('hourly_rate', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              type="number"
              min="0"
              step="0.01"
              className="w-full h-11 border border-border rounded px-3 py-2 text-sm"
            />
            {errors.hourly_rate && (
              <p className="text-destructive text-xs mt-1">{errors.hourly_rate.message}</p>
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
            form="installer-form"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Installer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface InstallerSettingsProps {
  installers: Installer[];
}

export function InstallerSettings({ installers: initialInstallers }: InstallerSettingsProps) {
  const [installers, setInstallers] = useState<Installer[]>(initialInstallers);
  const [showInactive, setShowInactive] = useState(false);
  const [sheetInstaller, setSheetInstaller] = useState<Installer | null | undefined>(undefined);
  const [openKebab, setOpenKebab] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Installer | null>(null);

  const displayed = showInactive ? installers : installers.filter((i) => i.is_active);

  const handleSaved = (saved: Installer) => {
    setInstallers((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  };

  const handleDeactivate = (installer: Installer) => {
    setDeactivateTarget(installer);
    setOpenKebab(null);
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateInstaller(deactivateTarget.id);
      setInstallers((prev) =>
        prev.map((i) => (i.id === deactivateTarget.id ? { ...i, is_active: false } : i)),
      );
      toast.success('Installer deactivated');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setDeactivateTarget(null);
  };

  const handleReactivate = async (installer: Installer) => {
    try {
      await reactivateInstaller(installer.id);
      setInstallers((prev) =>
        prev.map((i) => (i.id === installer.id ? { ...i, is_active: true } : i)),
      );
      toast.success('Installer reactivated');
    } catch (err: unknown) {
      toast.error('Failed: ' + (err instanceof Error ? err.message : String(err)));
    }
    setOpenKebab(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Installers</h2>
        <button
          onClick={() => setSheetInstaller(null)}
          className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Add Installer
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
                <th className="text-left px-4 py-3 font-medium">Company</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Regions</th>
                <th className="text-left px-4 py-3 font-medium">Hourly Rate</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No installers found. Add one to get started.
                  </td>
                </tr>
              ) : (
                displayed.map((installer) => (
                  <tr
                    key={installer.id}
                    className={cn(
                      'border-t border-border hover:bg-muted/50',
                      !installer.is_active && 'opacity-50',
                    )}
                  >
                    {/* Name */}
                    <td className="px-4 py-3 font-medium">
                      {installer.name}
                      {!installer.is_active && (
                        <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-1 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Company */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {installer.company ?? '—'}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-800">
                        {installerTypeLabels[installer.installer_type]}
                      </span>
                    </td>

                    {/* Regions */}
                    <td className="px-4 py-3">
                      {installer.regions && installer.regions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {installer.regions.map((region) => (
                            <span
                              key={region}
                              className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800"
                            >
                              {region}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Hourly Rate */}
                    <td className="px-4 py-3 text-muted-foreground">
                      {installer.hourly_rate != null
                        ? `₱${Number(installer.hourly_rate).toLocaleString()}/hr`
                        : '—'}
                    </td>

                    {/* Active */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          installer.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {installer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() =>
                          setOpenKebab(openKebab === installer.id ? null : installer.id)
                        }
                        className="p-1 rounded hover:bg-muted"
                        aria-label="Actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openKebab === installer.id && (
                        <div className="absolute right-8 top-2 z-10 bg-background border border-border rounded shadow-md min-w-[120px]">
                          <button
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                            onClick={() => {
                              setSheetInstaller(installer);
                              setOpenKebab(null);
                            }}
                          >
                            Edit
                          </button>
                          {installer.is_active ? (
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-destructive"
                              onClick={() => handleDeactivate(installer)}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                              onClick={() => handleReactivate(installer)}
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
        {displayed.length} installer{displayed.length !== 1 ? 's' : ''}
      </p>

      {/* Installer sheet */}
      {sheetInstaller !== undefined && (
        <InstallerSheet
          installer={sheetInstaller}
          onClose={() => setSheetInstaller(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Deactivate confirm dialog */}
      {deactivateTarget && (
        <ConfirmDialog
          open={true}
          onOpenChange={(open) => { if (!open) setDeactivateTarget(null); }}
          title={`Deactivate ${deactivateTarget.name}?`}
          body="This installer will be hidden from dropdowns but their data will be preserved."
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          destructive={true}
          onConfirm={confirmDeactivate}
        />
      )}
    </div>
  );
}
