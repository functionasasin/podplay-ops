import { Button } from '@/components/ui/button';
import { serviceTierLabels } from '@/lib/enum-labels';
import type { CustomerInfoValues } from './CustomerInfoStep';
import type { VenueConfigValues } from './VenueConfigStep';
import type { TierSelectionValues } from './TierSelectionStep';
import type { IspInfoValues } from './IspInfoStep';
import type { InstallerSelectionValues } from './InstallerSelectionStep';
import type { FinancialSetupValues } from './FinancialSetupStep';

interface ReviewStepProps {
  customerInfo?: CustomerInfoValues;
  venueConfig?: VenueConfigValues;
  tierSelection?: TierSelectionValues;
  ispInfo?: IspInfoValues;
  installerSelection?: InstallerSelectionValues;
  financialSetup?: FinancialSetupValues;
  installerName?: string;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

interface SectionHeaderProps {
  title: string;
  step: number;
  onEdit: (step: number) => void;
}

function SectionHeader({ title, step, onEdit }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <button
        type="button"
        onClick={() => onEdit(step)}
        className="text-xs text-primary underline hover:no-underline"
      >
        Edit ↑
      </button>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string | number | boolean | null | undefined;
}

function Row({ label, value }: RowProps) {
  let display: string;
  if (value === null || value === undefined || value === '') {
    display = '—';
  } else if (typeof value === 'boolean') {
    display = value ? 'Yes' : 'No';
  } else {
    display = String(value);
  }

  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <span>{display}</span>
    </div>
  );
}

export function ReviewStep({
  customerInfo,
  venueConfig,
  tierSelection,
  ispInfo,
  installerSelection,
  financialSetup,
  installerName,
  onEdit,
  onSubmit,
  isSubmitting = false,
}: ReviewStepProps) {
  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div className="rounded-lg border p-4 space-y-2">
        <SectionHeader title="Customer Info" step={0} onEdit={onEdit} />
        <Row label="Customer Name" value={customerInfo?.customer_name} />
        <Row label="Contact Email" value={customerInfo?.contact_email} />
        <Row label="Contact Phone" value={customerInfo?.contact_phone} />
      </div>

      {/* Venue Config */}
      <div className="rounded-lg border p-4 space-y-2">
        <SectionHeader title="Venue Config" step={1} onEdit={onEdit} />
        <Row label="Venue Address" value={venueConfig?.venue_address} />
        <Row label="Court Count" value={venueConfig?.court_count} />
        <Row label="Door Count" value={venueConfig?.door_count} />
        <Row label="Camera Count" value={venueConfig?.camera_count} />
        <Row label="Has Front Desk" value={venueConfig?.has_front_desk} />
      </div>

      {/* Service Tier */}
      <div className="rounded-lg border p-4 space-y-2">
        <SectionHeader title="Service Tier" step={2} onEdit={onEdit} />
        <Row
          label="Service Tier"
          value={
            tierSelection?.service_tier
              ? serviceTierLabels[tierSelection.service_tier]
              : undefined
          }
        />
      </div>

      {/* ISP Info */}
      <div className="rounded-lg border p-4 space-y-2">
        <SectionHeader title="ISP Info" step={3} onEdit={onEdit} />
        <Row label="ISP Provider" value={ispInfo?.isp_provider} />
        <Row label="Has Static IP" value={ispInfo?.has_static_ip} />
        <Row label="Upload Speed (Mbps)" value={ispInfo?.upload_speed_mbps} />
        <Row label="Download Speed (Mbps)" value={ispInfo?.download_speed_mbps} />
      </div>

      {/* Installer */}
      <div className="rounded-lg border p-4 space-y-2">
        <SectionHeader title="Installer" step={4} onEdit={onEdit} />
        <Row
          label="Installer"
          value={
            installerName ??
            (installerSelection?.installer_id ? installerSelection.installer_id : undefined)
          }
        />
      </div>

      {/* Financial Setup */}
      <div className="rounded-lg border p-4 space-y-2">
        <SectionHeader title="Financial Setup" step={5} onEdit={onEdit} />
        <Row label="Target Go-Live Date" value={financialSetup?.target_go_live_date} />
        <Row
          label="Deposit Amount"
          value={
            financialSetup?.deposit_amount != null
              ? `$${financialSetup.deposit_amount.toFixed(2)}`
              : undefined
          }
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Create Project'}
        </Button>
      </div>
    </div>
  );
}
