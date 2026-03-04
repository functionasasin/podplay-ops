/**
 * AssetSummaryStep — Step 5: Asset Summary (§4.18)
 *
 * Collects high-level asset information: real properties count/total,
 * cash accounts, vehicles. Drives document checklist seeding (§4.22).
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AssetSummaryStepState } from '@/types/intake';

export interface AssetSummaryStepProps {
  state: AssetSummaryStepState;
  onStateChange: (state: AssetSummaryStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AssetSummaryStep({
  state,
  onStateChange,
  onNext,
  onBack,
}: AssetSummaryStepProps) {
  const update = (patch: Partial<AssetSummaryStepState>) => {
    onStateChange({ ...state, ...patch });
  };

  return (
    <div data-testid="asset-summary-step" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 5: Asset Summary</h2>
        <p className="text-sm text-muted-foreground mt-1">
          High-level overview of the decedent's assets. Detailed values will be
          entered in the case wizard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="asset-real-count">Number of Real Properties</Label>
          <Input
            id="asset-real-count"
            type="number"
            min={0}
            value={state.real_property_count}
            onChange={(e) =>
              update({ real_property_count: Math.max(0, parseInt(e.target.value) || 0) })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset-real-value">Estimated Total Value (₱)</Label>
          <Input
            id="asset-real-value"
            type="number"
            min={0}
            value={state.real_property_total_value}
            onChange={(e) =>
              update({
                real_property_total_value: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.has_cash}
              onChange={(e) => update({ has_cash: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Has cash/bank accounts</span>
          </label>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.has_vehicles}
              onChange={(e) => update({ has_vehicles: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm">Has vehicles</span>
          </label>
        </div>

        {state.has_vehicles && (
          <div className="space-y-2">
            <Label htmlFor="asset-vehicle-count">Number of Vehicles</Label>
            <Input
              id="asset-vehicle-count"
              type="number"
              min={0}
              value={state.vehicle_count}
              onChange={(e) =>
                update({ vehicle_count: Math.max(0, parseInt(e.target.value) || 0) })
              }
            />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext}>
          Next: Settlement Track →
        </Button>
      </div>
    </div>
  );
}
