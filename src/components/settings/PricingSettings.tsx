import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateSettings } from '@/services/settingsService';
import type { Settings } from '@/services/settingsService';
import { VALIDATION } from '@/lib/validation-messages';

const VP = VALIDATION.settings.pricing;
const VH = VALIDATION.settings.hardware_threshold;
const VI = VALIDATION.settings.isp_speed;
const VS = VALIDATION.settings.system;

const pricingFormSchema = z
  .object({
    // Service tier fees
    pro_venue_fee: z.number().min(0, VP.fee_min),
    pro_court_fee: z.number().min(0, VP.fee_min),
    autonomous_venue_fee: z.number().min(0, VP.fee_min),
    autonomous_court_fee: z.number().min(0, VP.fee_min),
    autonomous_plus_venue_fee: z.number().min(0, VP.fee_min),
    autonomous_plus_court_fee: z.number().min(0, VP.fee_min),
    pbk_venue_fee: z.number().min(0, VP.fee_min),
    pbk_court_fee: z.number().min(0, VP.fee_min),
    // Cost chain rates (stored as decimals)
    shipping_rate: z.number().min(0, VP.shipping_rate.min).max(1, VP.shipping_rate.max),
    target_margin: z.number().min(0, VP.target_margin.min).max(0.9999, VP.target_margin.max),
    sales_tax_rate: z.number().min(0, VP.sales_tax_rate.min).max(1, VP.sales_tax_rate.max),
    deposit_pct: z.number().min(0.01, VP.deposit_pct.min).max(0.99, VP.deposit_pct.max),
    // Labor
    labor_rate_per_hour: z.number().min(0, VP.labor_rate.min),
    hours_per_day: z.number().int().min(1, VP.hours_per_day.min).max(24, VP.hours_per_day.max),
    // BOM thresholds
    switch_24_max_courts: z.number().int().min(1, VH.min),
    switch_48_max_courts: z.number().int().min(1, VH.min),
    ssd_1tb_max_courts: z.number().int().min(1, VH.min),
    ssd_2tb_max_courts: z.number().int().min(1, VH.min),
    nvr_4bay_max_cameras: z.number().int().min(1, VH.min),
    // ISP thresholds
    isp_fiber_mbps_per_court: z.number().int().min(1, VI.fiber),
    isp_cable_upload_min_mbps: z.number().int().min(1, VI.cable),
    // Operational defaults
    default_replay_service_version: z.enum(['v1', 'v2']),
    po_number_prefix: z.string().min(1, VS.po_number_prefix.required).max(10, VS.po_number_prefix.max),
    cc_terminal_pin: z.string().min(1, VS.cc_terminal_pin.required).max(10, VS.cc_terminal_pin.max),
    mac_mini_local_ip: z
      .string()
      .regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/, VS.mac_mini_local_ip.format),
    replay_port: z.number().int().min(1, VS.replay_port.min).max(65535, VS.replay_port.max),
    ddns_domain: z.string().min(1, VS.ddns_domain.required),
    label_sets_per_court: z.number().int().min(1, VS.label_sets_per_court.min),
    replay_sign_multiplier: z.number().int().min(1, VS.replay_sign_multiplier.min),
    default_vlan_id: z.number().int().min(1, VS.vlan_id.min).max(4094, VS.vlan_id.max),
    replay_vlan_id: z.number().int().min(1, VS.vlan_id.min).max(4094, VS.vlan_id.max),
    surveillance_vlan_id: z.number().int().min(1, VS.vlan_id.min).max(4094, VS.vlan_id.max),
    access_control_vlan_id: z.number().int().min(1, VS.vlan_id.min).max(4094, VS.vlan_id.max),
  })
  .refine((d) => d.switch_24_max_courts < d.switch_48_max_courts, {
    message: VH.switch_24,
    path: ['switch_24_max_courts'],
  })
  .refine((d) => d.ssd_1tb_max_courts < d.ssd_2tb_max_courts, {
    message: VH.ssd_1tb,
    path: ['ssd_1tb_max_courts'],
  });

type PricingFormValues = z.infer<typeof pricingFormSchema>;

interface Props {
  settings: Settings;
}

export function PricingSettings({ settings }: Props) {
  const [saving, setSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PricingFormValues>({
    resolver: zodResolver(pricingFormSchema),
    defaultValues: {
      pro_venue_fee: settings.pro_venue_fee ?? 5000,
      pro_court_fee: settings.pro_court_fee ?? 2500,
      autonomous_venue_fee: settings.autonomous_venue_fee ?? 7500,
      autonomous_court_fee: settings.autonomous_court_fee ?? 2500,
      autonomous_plus_venue_fee: settings.autonomous_plus_venue_fee ?? 7500,
      autonomous_plus_court_fee: settings.autonomous_plus_court_fee ?? 2500,
      pbk_venue_fee: settings.pbk_venue_fee ?? 0,
      pbk_court_fee: settings.pbk_court_fee ?? 0,
      shipping_rate: settings.shipping_rate ?? 0.1,
      target_margin: settings.target_margin ?? 0.1,
      sales_tax_rate: settings.sales_tax_rate ?? 0.1025,
      deposit_pct: settings.deposit_pct ?? 0.5,
      labor_rate_per_hour: settings.labor_rate_per_hour ?? 120,
      hours_per_day: settings.hours_per_day ?? 10,
      switch_24_max_courts: settings.switch_24_max_courts ?? 10,
      switch_48_max_courts: settings.switch_48_max_courts ?? 20,
      ssd_1tb_max_courts: settings.ssd_1tb_max_courts ?? 4,
      ssd_2tb_max_courts: settings.ssd_2tb_max_courts ?? 12,
      nvr_4bay_max_cameras: settings.nvr_4bay_max_cameras ?? 4,
      isp_fiber_mbps_per_court: settings.isp_fiber_mbps_per_court ?? 12,
      isp_cable_upload_min_mbps: settings.isp_cable_upload_min_mbps ?? 60,
      default_replay_service_version: settings.default_replay_service_version ?? 'v1',
      po_number_prefix: settings.po_number_prefix ?? 'PO',
      cc_terminal_pin: settings.cc_terminal_pin ?? '07139',
      mac_mini_local_ip: settings.mac_mini_local_ip ?? '192.168.32.100',
      replay_port: settings.replay_port ?? 4000,
      ddns_domain: settings.ddns_domain ?? 'podplaydns.com',
      label_sets_per_court: settings.label_sets_per_court ?? 5,
      replay_sign_multiplier: settings.replay_sign_multiplier ?? 2,
      default_vlan_id: settings.default_vlan_id ?? 30,
      replay_vlan_id: settings.replay_vlan_id ?? 32,
      surveillance_vlan_id: settings.surveillance_vlan_id ?? 31,
      access_control_vlan_id: settings.access_control_vlan_id ?? 33,
    },
  });

  const pbkVenueFee = watch('pbk_venue_fee');
  const pbkCourtFee = watch('pbk_court_fee');
  const showPbkWarning = pbkVenueFee === 0 && pbkCourtFee === 0;

  const onSubmit = async (values: PricingFormValues) => {
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
      {/* Section 1: Service Tier Fees */}
      <section className="rounded-lg border border-border p-4 space-y-4">
        <h2 className="text-base font-semibold">Service Tier Fees</h2>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Pro — Venue Fee">
            <CurrencyInput name="pro_venue_fee" register={register} error={errors.pro_venue_fee?.message} />
          </FieldGroup>
          <FieldGroup label="Pro — Per-Court Fee">
            <CurrencyInput name="pro_court_fee" register={register} error={errors.pro_court_fee?.message} />
          </FieldGroup>

          <FieldGroup label="Autonomous — Venue Fee">
            <CurrencyInput name="autonomous_venue_fee" register={register} error={errors.autonomous_venue_fee?.message} />
          </FieldGroup>
          <FieldGroup label="Autonomous — Per-Court Fee">
            <CurrencyInput name="autonomous_court_fee" register={register} error={errors.autonomous_court_fee?.message} />
          </FieldGroup>

          <FieldGroup label="Autonomous+ — Venue Fee">
            <CurrencyInput name="autonomous_plus_venue_fee" register={register} error={errors.autonomous_plus_venue_fee?.message} />
          </FieldGroup>
          <FieldGroup label="Autonomous+ — Per-Court Fee">
            <CurrencyInput name="autonomous_plus_court_fee" register={register} error={errors.autonomous_plus_court_fee?.message} />
          </FieldGroup>

          <FieldGroup label="PBK — Venue Fee">
            <CurrencyInput name="pbk_venue_fee" register={register} error={errors.pbk_venue_fee?.message} />
          </FieldGroup>
          <FieldGroup label="PBK — Per-Court Fee">
            <CurrencyInput name="pbk_court_fee" register={register} error={errors.pbk_court_fee?.message} />
          </FieldGroup>
        </div>

        {showPbkWarning && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              PBK pricing is not configured. PBK projects will show $0 service fees until these
              values are set. Enter the Pickleball Kingdom venue fee and per-court fee from the PBK
              contract.
            </span>
          </div>
        )}
      </section>

      {/* Section 2: Cost Chain Rates */}
      <section className="rounded-lg border border-border p-4 space-y-4">
        <h2 className="text-base font-semibold">Cost Chain Rates</h2>
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Shipping Rate" helpText="Applied to BOM cost → landed cost.">
            <PercentInput name="shipping_rate" control={control} error={errors.shipping_rate?.message} />
          </FieldGroup>
          <FieldGroup label="Target Margin" helpText="Customer price markup.">
            <PercentInput name="target_margin" control={control} error={errors.target_margin?.message} />
          </FieldGroup>
          <FieldGroup label="Sales Tax Rate" helpText="Applied to invoice subtotal.">
            <PercentInput name="sales_tax_rate" control={control} error={errors.sales_tax_rate?.message} />
          </FieldGroup>
          <FieldGroup label="Deposit Percentage" helpText="First installment as % of invoice total.">
            <PercentInput name="deposit_pct" control={control} error={errors.deposit_pct?.message} />
          </FieldGroup>
        </div>
      </section>

      {/* Section 3: Labor & Invoicing */}
      <section className="rounded-lg border border-border p-4 space-y-4">
        <h2 className="text-base font-semibold">Labor &amp; Invoicing</h2>
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Labor Rate (per hour)">
            <CurrencyInput name="labor_rate_per_hour" register={register} error={errors.labor_rate_per_hour?.message} />
          </FieldGroup>
          <FieldGroup label="Hours per Day">
            <input
              type="number"
              step="1"
              min="1"
              max="24"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('hours_per_day', { valueAsNumber: true })}
            />
            {errors.hours_per_day && <p className="text-xs text-destructive mt-1">{errors.hours_per_day.message}</p>}
          </FieldGroup>
        </div>
      </section>

      {/* Section 4: BOM Sizing Thresholds (Advanced) */}
      <section className="rounded-lg border border-border p-4">
        <details>
          <summary className="text-base font-semibold cursor-pointer select-none">
            BOM Sizing Thresholds <span className="text-xs text-muted-foreground font-normal ml-1">(Advanced)</span>
          </summary>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FieldGroup label="Switch 24-port: max courts" helpText="Use USW-Pro-24-POE for court_count ≤ this">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('switch_24_max_courts', { valueAsNumber: true })}
                />
                {errors.switch_24_max_courts && <p className="text-xs text-destructive mt-1">{errors.switch_24_max_courts.message}</p>}
              </FieldGroup>
              <FieldGroup label="Switch 48-port: max courts" helpText="Use USW-Pro-48-POE for court_count ≤ this">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('switch_48_max_courts', { valueAsNumber: true })}
                />
                {errors.switch_48_max_courts && <p className="text-xs text-destructive mt-1">{errors.switch_48_max_courts.message}</p>}
              </FieldGroup>

              <FieldGroup label="SSD 1TB: max courts" helpText="Use Samsung T7 1TB for court_count ≤ this">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('ssd_1tb_max_courts', { valueAsNumber: true })}
                />
                {errors.ssd_1tb_max_courts && <p className="text-xs text-destructive mt-1">{errors.ssd_1tb_max_courts.message}</p>}
              </FieldGroup>
              <FieldGroup label="SSD 2TB: max courts" helpText="Use Samsung T7 2TB for court_count ≤ this; >this uses 4TB">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('ssd_2tb_max_courts', { valueAsNumber: true })}
                />
                {errors.ssd_2tb_max_courts && <p className="text-xs text-destructive mt-1">{errors.ssd_2tb_max_courts.message}</p>}
              </FieldGroup>

              <FieldGroup label="NVR 4-bay: max cameras" helpText="Use UNVR (4-bay) for security_camera_count ≤ this">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('nvr_4bay_max_cameras', { valueAsNumber: true })}
                />
                {errors.nvr_4bay_max_cameras && <p className="text-xs text-destructive mt-1">{errors.nvr_4bay_max_cameras.message}</p>}
              </FieldGroup>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <FieldGroup label="ISP fiber Mbps per court">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('isp_fiber_mbps_per_court', { valueAsNumber: true })}
                />
                {errors.isp_fiber_mbps_per_court && <p className="text-xs text-destructive mt-1">{errors.isp_fiber_mbps_per_court.message}</p>}
              </FieldGroup>
              <FieldGroup label="ISP cable upload min Mbps">
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register('isp_cable_upload_min_mbps', { valueAsNumber: true })}
                />
                {errors.isp_cable_upload_min_mbps && <p className="text-xs text-destructive mt-1">{errors.isp_cable_upload_min_mbps.message}</p>}
              </FieldGroup>
            </div>
          </div>
        </details>
      </section>

      {/* Section 5: Operational Defaults */}
      <section className="rounded-lg border border-border p-4 space-y-4">
        <h2 className="text-base font-semibold">Operational Defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Replay Service Version">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('default_replay_service_version')}
            >
              <option value="v1">v1</option>
              <option value="v2">v2</option>
            </select>
            {errors.default_replay_service_version && (
              <p className="text-xs text-destructive mt-1">{errors.default_replay_service_version.message}</p>
            )}
          </FieldGroup>

          <FieldGroup label="PO Number Prefix">
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('po_number_prefix')}
            />
            {errors.po_number_prefix && <p className="text-xs text-destructive mt-1">{errors.po_number_prefix.message}</p>}
          </FieldGroup>

          <FieldGroup label="CC Terminal PIN">
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('cc_terminal_pin')}
            />
            {errors.cc_terminal_pin && <p className="text-xs text-destructive mt-1">{errors.cc_terminal_pin.message}</p>}
          </FieldGroup>

          <FieldGroup label="Mac Mini Local IP">
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('mac_mini_local_ip')}
            />
            {errors.mac_mini_local_ip && <p className="text-xs text-destructive mt-1">{errors.mac_mini_local_ip.message}</p>}
          </FieldGroup>

          <FieldGroup label="Replay Port">
            <input
              type="number"
              step="1"
              min="1"
              max="65535"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('replay_port', { valueAsNumber: true })}
            />
            {errors.replay_port && <p className="text-xs text-destructive mt-1">{errors.replay_port.message}</p>}
          </FieldGroup>

          <FieldGroup label="DDNS Domain">
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('ddns_domain')}
            />
            {errors.ddns_domain && <p className="text-xs text-destructive mt-1">{errors.ddns_domain.message}</p>}
          </FieldGroup>

          <FieldGroup label="Labels per Court">
            <input
              type="number"
              step="1"
              min="1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('label_sets_per_court', { valueAsNumber: true })}
            />
            {errors.label_sets_per_court && <p className="text-xs text-destructive mt-1">{errors.label_sets_per_court.message}</p>}
          </FieldGroup>

          <FieldGroup label="Replay Sign Multiplier">
            <input
              type="number"
              step="1"
              min="1"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('replay_sign_multiplier', { valueAsNumber: true })}
            />
            {errors.replay_sign_multiplier && <p className="text-xs text-destructive mt-1">{errors.replay_sign_multiplier.message}</p>}
          </FieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <FieldGroup label="Default VLAN ID">
            <input
              type="number"
              step="1"
              min="1"
              max="4094"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('default_vlan_id', { valueAsNumber: true })}
            />
            {errors.default_vlan_id && <p className="text-xs text-destructive mt-1">{errors.default_vlan_id.message}</p>}
          </FieldGroup>
          <FieldGroup label="REPLAY VLAN ID">
            <input
              type="number"
              step="1"
              min="1"
              max="4094"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('replay_vlan_id', { valueAsNumber: true })}
            />
            {errors.replay_vlan_id && <p className="text-xs text-destructive mt-1">{errors.replay_vlan_id.message}</p>}
          </FieldGroup>
          <FieldGroup label="SURVEILLANCE VLAN ID">
            <input
              type="number"
              step="1"
              min="1"
              max="4094"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('surveillance_vlan_id', { valueAsNumber: true })}
            />
            {errors.surveillance_vlan_id && <p className="text-xs text-destructive mt-1">{errors.surveillance_vlan_id.message}</p>}
          </FieldGroup>
          <FieldGroup label="ACCESS CONTROL VLAN ID">
            <input
              type="number"
              step="1"
              min="1"
              max="4094"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('access_control_vlan_id', { valueAsNumber: true })}
            />
            {errors.access_control_vlan_id && <p className="text-xs text-destructive mt-1">{errors.access_control_vlan_id.message}</p>}
          </FieldGroup>
        </div>
      </section>

      {/* Save Button */}
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

// --- Helper sub-components ---

function FieldGroup({
  label,
  helpText,
  children,
}: {
  label: string;
  helpText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {children}
    </div>
  );
}

function CurrencyInput({
  name,
  register,
  error,
}: {
  name: string;
  register: ReturnType<typeof useForm<PricingFormValues>>['register'];
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
        <input
          type="number"
          step="0.01"
          min="0"
          className="w-full rounded-md border border-input bg-background pl-6 pr-3 py-2 text-sm"
          {...(register as (name: string, opts?: object) => object)(name, { valueAsNumber: true })}
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function PercentInput({
  name,
  control,
  error,
}: {
  name: keyof PricingFormValues;
  control: ReturnType<typeof useForm<PricingFormValues>>['control'];
  error?: string;
}) {
  return (
    <div>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="w-full rounded-md border border-input bg-background px-3 pr-8 py-2 text-sm"
              value={typeof field.value === 'number' ? field.value * 100 : ''}
              onChange={(e) => field.onChange(parseFloat(e.target.value) / 100)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
          </div>
        )}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
