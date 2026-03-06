import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import type { NolcoEntry } from '@/types/engine-input';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type NolcoDraft = {
  lossYear: string;
  originalLoss: string;
  remainingBalance: string;
};

type NolcoErrors = Partial<Record<keyof NolcoDraft, string>>;

function emptyDraft(taxYear: number): NolcoDraft {
  return {
    lossYear: String(taxYear - 1),
    originalLoss: '',
    remainingBalance: '',
  };
}

function parseAmt(v: string): number {
  return parseFloat(v.replace(/,/g, '')) || 0;
}

function validateDraft(draft: NolcoDraft, taxYear: number, allDrafts: NolcoDraft[], index: number): NolcoErrors {
  const errs: NolcoErrors = {};

  if (!draft.lossYear) {
    errs.lossYear = 'Please select the year the loss was incurred.';
  } else {
    const year = parseInt(draft.lossYear, 10);
    if (year < taxYear - 3 || year > taxYear - 1) {
      errs.lossYear = `NOLCO can only be carried over for 3 years. Loss from ${draft.lossYear} has expired and cannot be claimed in ${taxYear}.`;
    } else {
      const duplicate = allDrafts.some(
        (d, i) => i !== index && d.lossYear === draft.lossYear
      );
      if (duplicate) {
        errs.lossYear = `You already entered a NOLCO entry for ${draft.lossYear}. Each loss year can only appear once.`;
      }
    }
  }

  const origAmt = parseAmt(draft.originalLoss);
  if (!draft.originalLoss) {
    errs.originalLoss = 'Please enter the original loss amount.';
  } else if (origAmt <= 0) {
    errs.originalLoss = 'The original net operating loss must be greater than ₱0.';
  }

  const remAmt = parseAmt(draft.remainingBalance);
  if (!draft.remainingBalance) {
    errs.remainingBalance = 'Please enter the remaining undeducted balance.';
  } else if (remAmt < 0) {
    errs.remainingBalance = 'Remaining balance cannot be negative.';
  } else if (origAmt > 0 && remAmt > origAmt) {
    errs.remainingBalance = 'Remaining balance cannot exceed the original loss amount.';
  }

  return errs;
}

export function WS07DNolco({ data, onChange, onNext, onBack }: Props) {
  const ie = data.itemizedExpenses ?? {};
  const taxYear = data.taxYear ?? new Date().getFullYear();

  const [hasNolco, setHasNolco] = useState<'yes' | 'no'>(() => {
    const existing = ie.nolcoEntries ?? [];
    return existing.length > 0 ? 'yes' : 'no';
  });

  const [drafts, setDrafts] = useState<NolcoDraft[]>(() => {
    const existing = ie.nolcoEntries ?? [];
    if (existing.length === 0) return [emptyDraft(taxYear)];
    return existing.map((e) => ({
      lossYear: String(e.lossYear),
      originalLoss: e.originalLoss,
      remainingBalance: e.remainingBalance,
    }));
  });

  const [allErrors, setAllErrors] = useState<NolcoErrors[]>(() => drafts.map(() => ({})));

  const lossYearOptions = [taxYear - 1, taxYear - 2, taxYear - 3];

  function updateDraft(i: number, patch: Partial<NolcoDraft>) {
    setDrafts((prev) => prev.map((d, idx) => {
      if (idx !== i) return d;
      const updated = { ...d, ...patch };
      // Auto-fill remaining balance when original loss is entered for the first time
      if (patch.originalLoss !== undefined && !d.remainingBalance) {
        updated.remainingBalance = patch.originalLoss;
      }
      return updated;
    }));
    setAllErrors((prev) =>
      prev.map((e, idx) => {
        if (idx !== i) return e;
        const updated = { ...e };
        for (const k of Object.keys(patch) as (keyof NolcoDraft)[]) {
          delete updated[k];
        }
        return updated;
      })
    );
  }

  function addDraft() {
    if (drafts.length >= 3) return;
    setDrafts((prev) => [...prev, emptyDraft(taxYear)]);
    setAllErrors((prev) => [...prev, {}]);
  }

  function removeDraft(i: number) {
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));
    setAllErrors((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleNext() {
    if (hasNolco === 'no') {
      onChange({ itemizedExpenses: { ...ie, nolcoEntries: [] } });
      onNext();
      return;
    }

    const newErrors = drafts.map((d, i) => validateDraft(d, taxYear, drafts, i));
    setAllErrors(newErrors);
    if (newErrors.some((e) => Object.keys(e).length > 0)) return;

    const entries: NolcoEntry[] = drafts.map((d) => ({
      lossYear: parseInt(d.lossYear, 10),
      originalLoss: d.originalLoss || '0.00',
      remainingBalance: d.remainingBalance || '0.00',
      expiryYear: parseInt(d.lossYear, 10) + 3,
    }));

    onChange({ itemizedExpenses: { ...ie, nolcoEntries: entries } });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Net Operating Loss Carry-Over (NOLCO)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          If your business had a net operating loss in a prior year ({lossYearOptions.join(', ')}) and you
          are using itemized deductions, you can carry over that loss as an additional deduction this
          year. This deduction is ONLY available under Itemized Deductions (not OSD or 8%).
        </p>
      </div>

      <div className="space-y-2">
        <Label>Do you have any unused net operating losses from prior years?</Label>
        <RadioGroup
          value={hasNolco}
          onValueChange={(v) => setHasNolco(v as 'yes' | 'no')}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="nolco-yes" />
            <Label htmlFor="nolco-yes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="nolco-no" />
            <Label htmlFor="nolco-no" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          A net operating loss occurs when your total allowable deductions exceed your gross income
          for the year. Under NIRC Sec. 34(D)(3), you can carry this loss forward for up to 3 years.
        </p>
      </div>

      {hasNolco === 'yes' && (
        <div className="space-y-4">
          {drafts.map((draft, i) => {
            const errs = allErrors[i] ?? {};
            return (
              <div key={i} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Loss Entry {i + 1}</span>
                  {drafts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDraft(i)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Year the loss was incurred</Label>
                  <Select
                    value={draft.lossYear}
                    onValueChange={(v) => updateDraft(i, { lossYear: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {lossYearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The calendar year in which your net operating loss was incurred — not the year
                    you're carrying it over to.
                  </p>
                  {errs.lossYear && <p className="text-sm text-destructive">{errs.lossYear}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Original net operating loss amount for {draft.lossYear || '—'}</Label>
                  <PesoInput
                    value={draft.originalLoss}
                    onChange={(v) => updateDraft(i, { originalLoss: v })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    The full amount of the net operating loss as reported on your{' '}
                    {draft.lossYear || '—'} income tax return.
                  </p>
                  {errs.originalLoss && (
                    <p className="text-sm text-destructive">{errs.originalLoss}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Remaining undeducted balance</Label>
                  <PesoInput
                    value={draft.remainingBalance}
                    onChange={(v) => updateDraft(i, { remainingBalance: v })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    How much of the original loss you have NOT yet claimed. If this is the first
                    year you're claiming it, enter the same amount as the original loss.
                  </p>
                  {errs.remainingBalance && (
                    <p className="text-sm text-destructive">{errs.remainingBalance}</p>
                  )}
                </div>
              </div>
            );
          })}

          {drafts.length < 3 && (
            <Button variant="outline" onClick={addDraft} className="w-full">
              + Add another loss year
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">
          Back
        </Button>
        <div className="flex gap-2">
          {hasNolco === 'yes' && (
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                onChange({ itemizedExpenses: { ...ie, nolcoEntries: [] } });
                onNext();
              }}
            >
              Skip — I have no prior-year losses to carry over
            </Button>
          )}
          <Button onClick={handleNext} className="h-11 px-6">Continue</Button>
        </div>
      </div>
    </div>
  );
}

export default WS07DNolco;
