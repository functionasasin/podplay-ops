/**
 * DecedentInfoStep — Step 3: About the Decedent (§4.18)
 *
 * Collects decedent information: name, DOD, citizenship, civil status,
 * property regime, has-will flag. This data pre-populates EngineInput.decedent.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DecedentInfoStepState } from '@/types/intake';
import {
  PROPERTY_REGIMES,
  PROPERTY_REGIME_LABELS,
} from '@/types/intake';
import {
  CIVIL_STATUSES,
  CIVIL_STATUS_LABELS,
} from '@/types/client';

export interface DecedentInfoStepProps {
  state: DecedentInfoStepState;
  onStateChange: (state: DecedentInfoStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DecedentInfoStep({
  state,
  onStateChange,
  onNext,
  onBack,
}: DecedentInfoStepProps) {
  const update = (patch: Partial<DecedentInfoStepState>) => {
    onStateChange({ ...state, ...patch });
  };

  const showPropertyRegime =
    state.civil_status === 'married' || state.civil_status === 'legally_separated';

  const canProceed =
    state.full_name.trim() !== '' &&
    state.date_of_death.trim() !== '' &&
    state.civil_status !== null;

  return (
    <div data-testid="decedent-info-step" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 3: About the Decedent</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Information about the deceased person whose estate will be settled.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="decedent-name">Full Name *</Label>
          <Input
            id="decedent-name"
            value={state.full_name}
            onChange={(e) => update({ full_name: e.target.value })}
            placeholder="As it appears on the PSA death certificate"
          />
          <p className="text-xs text-muted-foreground">
            As it appears on the PSA death certificate
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="decedent-dod">Date of Death *</Label>
          <Input
            id="decedent-dod"
            type="date"
            value={state.date_of_death}
            onChange={(e) => update({ date_of_death: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="decedent-place">Place of Death</Label>
          <Input
            id="decedent-place"
            value={state.place_of_death}
            onChange={(e) => update({ place_of_death: e.target.value })}
            placeholder="City/municipality"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="decedent-address">Last Known Address</Label>
          <Input
            id="decedent-address"
            value={state.last_known_address}
            onChange={(e) => update({ last_known_address: e.target.value })}
            placeholder="City/municipality determines BIR RDO"
          />
          <p className="text-xs text-muted-foreground">
            City/municipality determines BIR RDO
          </p>
        </div>

        <div className="space-y-2">
          <Label>Civil Status at Death *</Label>
          <div className="space-y-1">
            {CIVIL_STATUSES.map((cs) => (
              <label key={cs} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="decedent-civil-status"
                  value={cs}
                  checked={state.civil_status === cs}
                  onChange={() => update({ civil_status: cs })}
                  className="h-4 w-4"
                />
                {CIVIL_STATUS_LABELS[cs]}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Has a Will?</Label>
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="decedent-will"
                checked={!state.has_will}
                onChange={() => update({ has_will: false })}
                className="h-4 w-4"
              />
              No (intestate)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="decedent-will"
                checked={state.has_will}
                onChange={() => update({ has_will: true })}
                className="h-4 w-4"
              />
              Yes (testate)
            </label>
          </div>
        </div>

        {showPropertyRegime && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Property Regime</Label>
            <div className="flex flex-wrap gap-4">
              {PROPERTY_REGIMES.map((pr) => (
                <label key={pr} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="decedent-regime"
                    value={pr}
                    checked={state.property_regime === pr}
                    onChange={() => update({ property_regime: pr })}
                    className="h-4 w-4"
                  />
                  {PROPERTY_REGIME_LABELS[pr]}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="decedent-citizenship">Citizenship at Death</Label>
          <Input
            id="decedent-citizenship"
            value={state.citizenship}
            onChange={(e) => update({ citizenship: e.target.value })}
            placeholder="Filipino"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="decedent-tin">TIN</Label>
          <Input
            id="decedent-tin"
            value={state.tin}
            onChange={(e) => update({ tin: e.target.value })}
            placeholder="Decedent's TIN"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Family Composition →
        </Button>
      </div>
    </div>
  );
}
