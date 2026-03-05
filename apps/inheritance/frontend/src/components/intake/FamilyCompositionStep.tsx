/**
 * FamilyCompositionStep — Step 4: Family Composition / Heirs (§4.18)
 *
 * Add heir rows with name, relationship, and alive/predeceased status.
 * This pre-populates EngineInput.family_tree.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { FamilyCompositionStepState, IntakeHeirEntry } from '@/types/intake';
import { RELATIONSHIPS, type Relationship } from '@/types';

const RELATIONSHIP_DISPLAY: Record<Relationship, string> = {
  LegitimateChild: 'Legitimate Child',
  LegitimatedChild: 'Legitimated Child',
  AdoptedChild: 'Adopted Child',
  IllegitimateChild: 'Illegitimate Child',
  SurvivingSpouse: 'Surviving Spouse',
  LegitimateParent: 'Legitimate Parent',
  LegitimateAscendant: 'Legitimate Ascendant',
  Sibling: 'Sibling',
  NephewNiece: 'Nephew/Niece',
  OtherCollateral: 'Other Collateral',
  Stranger: 'Stranger',
};

export interface FamilyCompositionStepProps {
  state: FamilyCompositionStepState;
  onStateChange: (state: FamilyCompositionStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FamilyCompositionStep({
  state,
  onStateChange,
  onNext,
  onBack,
}: FamilyCompositionStepProps) {
  const addHeir = () => {
    const newHeir: IntakeHeirEntry = {
      name: '',
      relationship: 'LegitimateChild',
      is_alive: true,
    };
    onStateChange({ heirs: [...state.heirs, newHeir] });
  };

  const updateHeir = (index: number, patch: Partial<IntakeHeirEntry>) => {
    const updated = state.heirs.map((h, i) =>
      i === index ? { ...h, ...patch } : h,
    );
    onStateChange({ heirs: updated });
  };

  const removeHeir = (index: number) => {
    onStateChange({ heirs: state.heirs.filter((_, i) => i !== index) });
  };

  const canProceed = state.heirs.length > 0;

  return (
    <div data-testid="family-composition-step" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 4: Family Composition</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add the heirs of the decedent. This will pre-populate the inheritance calculator.
        </p>
      </div>

      <div className="space-y-3">
        {state.heirs.map((heir, index) => (
          <Card key={index} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Heir {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeHeir(index)}
                className="text-destructive h-7 px-2"
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor={`heir-name-${index}`}>Name</Label>
                <Input
                  id={`heir-name-${index}`}
                  value={heir.name}
                  onChange={(e) => updateHeir(index, { name: e.target.value })}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`heir-rel-${index}`}>Relationship</Label>
                <select
                  id={`heir-rel-${index}`}
                  value={heir.relationship}
                  onChange={(e) =>
                    updateHeir(index, {
                      relationship: e.target.value as Relationship,
                    })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {RELATIONSHIP_DISPLAY[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`heir-alive-${index}`}
                      checked={heir.is_alive}
                      onChange={() => updateHeir(index, { is_alive: true })}
                      className="h-4 w-4"
                    />
                    Alive
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={`heir-alive-${index}`}
                      checked={!heir.is_alive}
                      onChange={() => updateHeir(index, { is_alive: false })}
                      className="h-4 w-4"
                    />
                    Predeceased
                  </label>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={addHeir}>
        + Add Heir
      </Button>

      {state.heirs.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Add at least one heir to proceed.
        </p>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Asset Summary →
        </Button>
      </div>
    </div>
  );
}
