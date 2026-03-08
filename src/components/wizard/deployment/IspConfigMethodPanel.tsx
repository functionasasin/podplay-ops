// Phase 5: ISP Router Configuration Method Panel
// Spec: ui-spec/wizard-deployment.md § Phase 5: ISP Router Configuration — Config Method Panel

import { supabase } from '@/lib/supabase';

type IspConfigMethod = 'static_ip' | 'dmz' | 'port_forward';

type IspConfigMethodPanelProps = {
  projectId: string;
  method: IspConfigMethod | null | undefined;
  venueCountry?: string | null;
  onMethodChange: (method: IspConfigMethod) => void;
};

const METHODS: { value: IspConfigMethod; label: string; description: string }[] = [
  {
    value: 'static_ip',
    label: '1. Static IP (Best)',
    description:
      'Order static IP from ISP (~$10–20/mo). In UniFi: Settings → Internet → WAN1 → Advanced → Manual → enter static IP details.',
  },
  {
    value: 'dmz',
    label: '2. DMZ',
    description: 'Place UDM WAN IP in ISP router DMZ.',
  },
  {
    value: 'port_forward',
    label: '3. Port Forward (Last Resort)',
    description:
      'Forward port 4000 TCP/UDP from ISP router to UDM IP.',
  },
];

/**
 * ISP Router Configuration Method panel shown above Phase 5 checklist.
 * Radio group bound to project.isp_config_method; auto-saves on change.
 */
export function IspConfigMethodPanel({
  projectId,
  method,
  venueCountry,
  onMethodChange,
}: IspConfigMethodPanelProps) {
  async function handleChange(value: IspConfigMethod) {
    onMethodChange(value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('projects') as any)
      .update({ isp_config_method: value })
      .eq('id', projectId);
  }

  const isPhilippines = venueCountry === 'PH';

  return (
    <div className="mb-4 border rounded-lg p-4 bg-muted/10 space-y-3">
      <p className="font-semibold text-sm">ISP Router Configuration Method</p>

      <div className="space-y-2">
        {METHODS.map(({ value, label, description }) => (
          <label key={value} className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name={`isp-config-method-${projectId}`}
              value={value}
              checked={method === value}
              onChange={() => handleChange(value)}
              className="mt-0.5 h-4 w-4"
            />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
              {value === 'port_forward' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  ⚠ CGNAT risk — may not work on all ISPs.
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Warnings */}
      {method === 'port_forward' && (
        <div className="px-3 py-2 rounded text-xs border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900">
          ⚠ Last resort — confirm ISP supports port forwarding and does not use CGNAT.
        </div>
      )}

      {isPhilippines && method !== 'static_ip' && (
        <div className="px-3 py-2 rounded text-xs border-l-4 border-red-500 bg-red-50 text-red-900">
          ⚠ Philippines requires static IP — business plan mandatory.
        </div>
      )}

      {/* Supported ISPs tip */}
      <div className="text-xs text-muted-foreground border-t pt-2">
        <span className="font-medium">Supported ISPs:</span> Verizon Fios, Optimum, Spectrum, Google
        Fiber, AT&T Fiber, Comcast/Xfinity, Cox, Frontier
      </div>
    </div>
  );
}
