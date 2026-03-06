import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';
import type { DepreciationEntry } from '@/types/engine-input';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type AssetDraft = {
  assetName: string;
  assetCost: string;
  salvageValue: string;
  usefulLifeYears: string;
  acquisitionDate: string;
  method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE';
  priorAccumulatedDepreciation: string;
};

type AssetErrors = Partial<Record<keyof AssetDraft, string>>;

function emptyDraft(): AssetDraft {
  return {
    assetName: '',
    assetCost: '',
    salvageValue: '0.00',
    usefulLifeYears: '5',
    acquisitionDate: '',
    method: 'STRAIGHT_LINE',
    priorAccumulatedDepreciation: '0.00',
  };
}

function parseAmt(v: string): number {
  return parseFloat(v.replace(/,/g, '')) || 0;
}

const USEFUL_LIFE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 50];
const USEFUL_LIFE_LABELS: Record<number, string> = {
  3: '3 years — software, mobile phones',
  5: '5 years — computers, laptops, office equipment, cameras, vehicles',
  10: '10 years — office furniture, heavy equipment, generators',
};

const VEHICLE_KEYWORDS = /car|van|vehicle|truck|suv|sedan|motorcycle/i;
const VEHICLE_COST_CEILING = 2400000;

function validateDraft(draft: AssetDraft, taxYear: number): AssetErrors {
  const errs: AssetErrors = {};
  if (!draft.assetName || draft.assetName.trim().length < 2) {
    errs.assetName = draft.assetName ? 'Asset description is too short.' : 'Please describe this asset.';
  } else if (draft.assetName.length > 100) {
    errs.assetName = 'Asset description must be 100 characters or fewer.';
  }
  const cost = parseAmt(draft.assetCost);
  if (!draft.assetCost || cost <= 0) {
    errs.assetCost = draft.assetCost ? 'Purchase price must be greater than ₱0.' : 'Please enter the purchase price.';
  }
  const salvage = parseAmt(draft.salvageValue);
  if (salvage < 0) errs.salvageValue = 'Salvage value cannot be negative.';
  else if (salvage >= cost && cost > 0) errs.salvageValue = 'Salvage value must be less than the original purchase price.';
  if (!draft.usefulLifeYears) errs.usefulLifeYears = 'Please select the useful life.';
  if (!draft.acquisitionDate) {
    errs.acquisitionDate = 'Please enter the date this asset was placed in service.';
  } else {
    const d = new Date(draft.acquisitionDate);
    if (isNaN(d.getTime())) {
      errs.acquisitionDate = 'Please enter a valid date in YYYY-MM-DD format.';
    } else if (d.getFullYear() < 1970) {
      errs.acquisitionDate = 'Please enter a valid date in YYYY-MM-DD format.';
    } else if (d > new Date(`${taxYear}-12-31`)) {
      errs.acquisitionDate = 'The acquisition date cannot be in the future relative to the tax year being filed.';
    }
  }
  if (!draft.method) errs.method = 'Please select a depreciation method.';
  const priorDepr = parseAmt(draft.priorAccumulatedDepreciation);
  if (priorDepr < 0) errs.priorAccumulatedDepreciation = 'Prior depreciation cannot be negative.';
  else if (priorDepr >= cost && cost > 0) errs.priorAccumulatedDepreciation = 'Prior accumulated depreciation cannot equal or exceed the original cost of the asset.';
  return errs;
}

export function WS07CDepreciation({ data, onChange, onNext, onBack }: Props) {
  const ie = data.itemizedExpenses ?? {};
  const taxYear = data.taxYear ?? new Date().getFullYear();

  const [drafts, setDrafts] = useState<AssetDraft[]>(() => {
    const existing = ie.depreciationEntries ?? [];
    if (existing.length === 0) return [emptyDraft()];
    return existing.map((e) => ({
      assetName: e.assetName,
      assetCost: e.assetCost,
      salvageValue: e.salvageValue,
      usefulLifeYears: String(e.usefulLifeYears),
      acquisitionDate: e.acquisitionDate,
      method: e.method,
      priorAccumulatedDepreciation: e.priorAccumulatedDepreciation,
    }));
  });

  const [allErrors, setAllErrors] = useState<AssetErrors[]>(() => drafts.map(() => ({})));
  const [skipped, setSkipped] = useState(false);

  function updateDraft(i: number, patch: Partial<AssetDraft>) {
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    setAllErrors((prev) => prev.map((e, idx) => {
      if (idx !== i) return e;
      const updated: AssetErrors = { ...e };
      for (const k of Object.keys(patch) as (keyof AssetDraft)[]) {
        delete updated[k];
      }
      return updated;
    }));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, emptyDraft()]);
    setAllErrors((prev) => [...prev, {}]);
  }

  function removeDraft(i: number) {
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));
    setAllErrors((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSkip() {
    setSkipped(true);
    onChange({ itemizedExpenses: { ...ie, depreciationEntries: [] } });
    onNext();
  }

  function handleNext() {
    const newErrors = drafts.map((d) => validateDraft(d, taxYear));
    setAllErrors(newErrors);
    if (newErrors.some((e) => Object.keys(e).length > 0)) return;

    const entries: DepreciationEntry[] = drafts.map((d) => ({
      assetName: d.assetName.trim(),
      assetCost: d.assetCost || '0.00',
      salvageValue: d.salvageValue || '0.00',
      usefulLifeYears: parseInt(d.usefulLifeYears, 10),
      acquisitionDate: d.acquisitionDate,
      method: d.method,
      priorAccumulatedDepreciation: d.priorAccumulatedDepreciation || '0.00',
    }));

    onChange({ itemizedExpenses: { ...ie, depreciationEntries: entries } });
    onNext();
  }

  if (skipped) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Your business assets (for depreciation)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          If you own business equipment, computers, furniture, or vehicles used for your work, you
          can deduct a portion of their cost each year as depreciation. Enter each asset separately.
        </p>
      </div>

      {drafts.map((draft, i) => {
        const errs = allErrors[i] ?? {};
        const costAmt = parseAmt(draft.assetCost);
        const isVehicle = VEHICLE_KEYWORDS.test(draft.assetName);
        const showVehicleCap = isVehicle && costAmt > VEHICLE_COST_CEILING;
        const acqYear = draft.acquisitionDate ? parseInt(draft.acquisitionDate.slice(0, 4), 10) : null;
        const showPriorDepr = acqYear !== null && acqYear < taxYear;

        return (
          <div key={i} className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Asset {i + 1}</span>
              {drafts.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeDraft(i)} className="text-destructive hover:text-destructive">
                  Remove this asset
                </Button>
              )}
            </div>

            <div className="space-y-1">
              <Label>Asset description</Label>
              <Input
                value={draft.assetName}
                onChange={(e) => updateDraft(i, { assetName: e.target.value })}
                placeholder="e.g., MacBook Pro 2023, Office desk, Delivery motorcycle"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">A descriptive name so you can identify this asset in your records.</p>
              {errs.assetName && <p className="text-sm text-destructive">{errs.assetName}</p>}
            </div>

            <div className="space-y-1">
              <Label>Original purchase price</Label>
              <PesoInput
                value={draft.assetCost}
                onChange={(v) => updateDraft(i, { assetCost: v })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">The amount you paid to acquire this asset. For used assets, enter the price you paid.</p>
              {errs.assetCost && <p className="text-sm text-destructive">{errs.assetCost}</p>}
              {showVehicleCap && (
                <Alert className="border-amber-400 bg-amber-50 text-amber-900">
                  <AlertDescription>
                    Vehicle cost exceeds the BIR's ₱2,400,000 ceiling (RR 12-2012). The engine will
                    cap the depreciation base at ₱2,400,000. The excess ₱{(costAmt - VEHICLE_COST_CEILING).toLocaleString('en-PH')} is non-deductible.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-1">
              <Label>Estimated residual value at end of useful life</Label>
              <PesoInput
                value={draft.salvageValue}
                onChange={(v) => updateDraft(i, { salvageValue: v })}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">The estimated value of the asset when it's fully depreciated (e.g., scrap value). Most freelancers leave this at ₱0. For vehicles, a common estimate is ₱50,000–₱100,000.</p>
              {errs.salvageValue && <p className="text-sm text-destructive">{errs.salvageValue}</p>}
            </div>

            <div className="space-y-1">
              <Label>Useful life (years)</Label>
              <Select
                value={draft.usefulLifeYears}
                onValueChange={(v) => updateDraft(i, { usefulLifeYears: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select useful life" />
                </SelectTrigger>
                <SelectContent>
                  {USEFUL_LIFE_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {USEFUL_LIFE_LABELS[y] ?? `${y} year${y !== 1 ? 's' : ''}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">The number of years this asset is expected to be useful for your business. BIR-prescribed useful lives apply.</p>
              {errs.usefulLifeYears && <p className="text-sm text-destructive">{errs.usefulLifeYears}</p>}
            </div>

            <div className="space-y-1">
              <Label>Date placed in service</Label>
              <Input
                type="date"
                value={draft.acquisitionDate}
                onChange={(e) => updateDraft(i, { acquisitionDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">The date this asset was first used for business. If unsure of the exact date, use the first of the month of purchase.</p>
              {errs.acquisitionDate && <p className="text-sm text-destructive">{errs.acquisitionDate}</p>}
            </div>

            <div className="space-y-2">
              <Label>Depreciation method</Label>
              <RadioGroup
                value={draft.method}
                onValueChange={(v) => updateDraft(i, { method: v as 'STRAIGHT_LINE' | 'DECLINING_BALANCE' })}
                className="gap-2"
              >
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="STRAIGHT_LINE" id={`sl-${i}`} className="mt-1" />
                  <Label htmlFor={`sl-${i}`} className="cursor-pointer font-normal">
                    <span className="font-medium">Straight-line (recommended)</span>
                    <span className="block text-xs text-muted-foreground">Equal deduction each year: (Cost − Salvage) ÷ Useful Life.</span>
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="DECLINING_BALANCE" id={`db-${i}`} className="mt-1" />
                  <Label htmlFor={`db-${i}`} className="cursor-pointer font-normal">
                    <span className="font-medium">Declining balance (double)</span>
                    <span className="block text-xs text-muted-foreground">Higher deductions in early years; 2× the straight-line rate applied to the remaining book value.</span>
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">Straight-line divides the cost equally over the useful life. Declining balance gives higher deductions in early years. Most freelancers use straight-line for simplicity.</p>
              {errs.method && <p className="text-sm text-destructive">{errs.method}</p>}
            </div>

            {showPriorDepr && (
              <div className="space-y-1">
                <Label>Prior accumulated depreciation (if asset was acquired in a previous year)</Label>
                <PesoInput
                  value={draft.priorAccumulatedDepreciation}
                  onChange={(v) => updateDraft(i, { priorAccumulatedDepreciation: v })}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">If you already claimed depreciation on this asset in prior years' tax returns, enter the total amount already deducted. Leave at ₱0 if this is the first year you're deducting depreciation on this asset.</p>
                {errs.priorAccumulatedDepreciation && <p className="text-sm text-destructive">{errs.priorAccumulatedDepreciation}</p>}
              </div>
            )}
          </div>
        );
      })}

      <Button variant="outline" onClick={addDraft} className="w-full">
        + Add another asset
      </Button>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Skip depreciation — I have no qualifying assets
          </Button>
          <Button onClick={handleNext}>Continue</Button>
        </div>
      </div>
    </div>
  );
}

export default WS07CDepreciation;
