/**
 * SettlementTrackStep — Step 6: Settlement Track selection (§4.18)
 *
 * EJS or Judicial radio selection. Generates deadline milestones
 * on selection (§4.20).
 */

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { SettlementTrackStepState, SettlementTrack } from '@/types/intake';
import { getSettlementMilestones } from '@/lib/intake';

export interface SettlementTrackStepProps {
  state: SettlementTrackStepState;
  onStateChange: (state: SettlementTrackStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

const TRACK_OPTIONS: { value: SettlementTrack; label: string; description: string }[] = [
  {
    value: 'ejs',
    label: 'Extrajudicial Settlement (EJS)',
    description:
      'All heirs agree on the partition. No court involvement needed. Faster and less expensive. Requires all heirs to be of legal age and in agreement.',
  },
  {
    value: 'judicial',
    label: 'Judicial Settlement (Probate)',
    description:
      'Court-supervised settlement. Required when there is a will to probate, minor heirs, or heirs who cannot agree on partition.',
  },
];

export function SettlementTrackStep({
  state,
  onStateChange,
  onNext,
  onBack,
}: SettlementTrackStepProps) {
  const canProceed = state.track !== null;
  const milestones = state.track ? getSettlementMilestones(state.track) : [];

  return (
    <div data-testid="settlement-track-step" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 6: Settlement Track</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select how the estate will be settled. This determines the deadline milestones.
        </p>
      </div>

      <div className="space-y-3">
        {TRACK_OPTIONS.map((option) => (
          <Card
            key={option.value}
            className={`p-4 cursor-pointer transition-colors ${
              state.track === option.value
                ? 'border-primary ring-1 ring-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onStateChange({ track: option.value })}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="settlement-track"
                value={option.value}
                checked={state.track === option.value}
                onChange={() => onStateChange({ track: option.value })}
                className="h-4 w-4 mt-0.5"
              />
              <div>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </label>
          </Card>
        ))}
      </div>

      {/* Milestone preview */}
      {state.track && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Generated Milestones ({milestones.length})
          </Label>
          <div className="space-y-1">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-16 text-right shrink-0">
                  Day {m.offset_days}
                </span>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Review →
        </Button>
      </div>
    </div>
  );
}
