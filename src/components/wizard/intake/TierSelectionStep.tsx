import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { serviceTierLabels, serviceTierBadgeClass } from '@/lib/enum-labels';
import type { ServiceTier } from '@/lib/types';

const tierSelectionSchema = z.object({
  service_tier: z.enum(['pro', 'autonomous', 'autonomous_plus', 'pbk']),
});

export type TierSelectionValues = z.infer<typeof tierSelectionSchema>;

const TIER_CONFIG: Record<
  ServiceTier,
  { fullLabel: string; description: string; features: string[] }
> = {
  pro: {
    fullLabel: 'Pro',
    description: 'Display + kiosk + replay camera + network rack',
    features: [
      'Replay cameras per court',
      'Kiosk displays',
      'Network rack & switching',
      'Replay system',
    ],
  },
  autonomous: {
    fullLabel: 'Autonomous',
    description: 'Pro + access control (Kisi) + security cameras',
    features: [
      'Everything in Pro',
      'Kisi access control',
      'Security cameras',
      'Automated door management',
    ],
  },
  autonomous_plus: {
    fullLabel: 'Autonomous+',
    description: 'Autonomous + NVR with hard drives',
    features: [
      'Everything in Autonomous',
      'NVR with hard drives',
      'Extended video retention',
      'Enhanced surveillance',
    ],
  },
  pbk: {
    fullLabel: 'Pickleball Kingdom',
    description: 'Pickleball Kingdom (Pro hardware, custom price)',
    features: [
      'Pro hardware configuration',
      'Pickleball-specific setup',
      'Custom pricing structure',
      'PBK branding support',
    ],
  },
};

const TIER_ORDER: ServiceTier[] = ['pro', 'autonomous', 'autonomous_plus', 'pbk'];

interface TierSelectionStepProps {
  defaultValues?: Partial<TierSelectionValues>;
  onNext: (data: TierSelectionValues) => void;
}

export function TierSelectionStep({ defaultValues, onNext }: TierSelectionStepProps) {
  const [selected, setSelected] = useState<ServiceTier | null>(
    defaultValues?.service_tier ?? null
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    onNext({ service_tier: selected });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        role="radiogroup"
        aria-label="Service Tier"
      >
        {TIER_ORDER.map((tier) => {
          const config = TIER_CONFIG[tier];
          const badgeClass = serviceTierBadgeClass[tier];
          const shortLabel = serviceTierLabels[tier];
          const isSelected = selected === tier;

          return (
            <label
              key={tier}
              className={[
                'relative flex flex-col gap-2 rounded-lg border p-4 cursor-pointer transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'border-border hover:border-primary/50',
              ].join(' ')}
            >
              <input
                type="radio"
                name="service_tier"
                value={tier}
                checked={isSelected}
                onChange={() => setSelected(tier)}
                className="sr-only"
                aria-label={config.fullLabel}
              />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{config.fullLabel}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded border ${badgeClass}`}
                >
                  {shortLabel}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">{config.description}</p>

              <ul className="space-y-1 mt-1">
                {config.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-1.5 text-xs text-foreground">
                    <span className="text-primary">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </label>
          );
        })}
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={!selected}>
          Continue
        </Button>
      </div>
    </form>
  );
}
