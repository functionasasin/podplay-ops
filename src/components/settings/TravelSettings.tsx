import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { VALIDATION } from '@/lib/validation-messages';

const VTr = VALIDATION.settings.travel;
import { toast } from 'sonner';
import { updateSettings } from '@/services/settingsService';
import type { Settings } from '@/services/settingsService';

const travelFormSchema = z.object({
  lodging_per_day: z.number().min(0, VTr.lodging_per_day.min),
  airfare_default: z.number().min(0, VTr.airfare_default.min),
  hours_per_day: z.number().int().min(1, VTr.hours_per_day.min).max(24, VTr.hours_per_day.max),
});

export type TravelFormValues = z.infer<typeof travelFormSchema>;

interface Props {
  settings: Settings;
}

export function TravelSettings({ settings }: Props) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TravelFormValues>({
    resolver: zodResolver(travelFormSchema),
    defaultValues: {
      lodging_per_day: settings.lodging_per_day ?? 250,
      airfare_default: settings.airfare_default ?? 1800,
      hours_per_day: settings.hours_per_day ?? 10,
    },
  });

  const onSubmit = async (values: TravelFormValues) => {
    setSaving(true);
    try {
      await updateSettings(values);
      toast.success('Settings saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed to save settings: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Travel Defaults</h2>
        <p className="text-sm text-muted-foreground mt-1">
          These values pre-fill expense entries. You can override per-project.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Lodging per night</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-input bg-background pl-6 pr-3 py-2 text-sm"
              {...register('lodging_per_day', { valueAsNumber: true })}
            />
          </div>
          {errors.lodging_per_day && (
            <p className="text-xs text-destructive mt-1">{errors.lodging_per_day.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Airfare (round trip)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-md border border-input bg-background pl-6 pr-3 py-2 text-sm"
              {...register('airfare_default', { valueAsNumber: true })}
            />
          </div>
          {errors.airfare_default && (
            <p className="text-xs text-destructive mt-1">{errors.airfare_default.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Hours per day</label>
          <input
            type="number"
            step="1"
            min="1"
            max="24"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register('hours_per_day', { valueAsNumber: true })}
          />
          {errors.hours_per_day && (
            <p className="text-xs text-destructive mt-1">{errors.hours_per_day.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">When to use these defaults</p>
        <p>
          <span className="font-medium">Lodging:</span> pre-fills the Amount field when adding a
          &ldquo;Lodging&rdquo; expense in Stage 4 (Financials). Override per-project.
        </p>
        <p>
          <span className="font-medium">Airfare:</span> pre-fills the Amount field for
          &ldquo;Airfare&rdquo; expenses.
        </p>
        <p>
          <span className="font-medium">Hours/day:</span> used to estimate installation duration.{' '}
          <code className="text-xs">estimated_days = ceil(total_hours / hours_per_day)</code>
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
