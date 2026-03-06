import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';
import type { QuarterlyPayment } from '@/types/engine-input';
import type { FilingPeriod } from '@/types/common';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

type QuarterSlot = { quarter: 1 | 2 | 3; label: string; period: 'Q1' | 'Q2' | 'Q3' };

const ALL_QUARTERS: QuarterSlot[] = [
  { quarter: 1, label: 'Q1 payment made (January–March)', period: 'Q1' },
  { quarter: 2, label: 'Q2 payment made (January–June)', period: 'Q2' },
  { quarter: 3, label: 'Q3 payment made (January–September)', period: 'Q3' },
];

function getVisibleQuarters(filingPeriod: FilingPeriod): QuarterSlot[] {
  if (filingPeriod === 'ANNUAL') return ALL_QUARTERS;
  if (filingPeriod === 'Q3') return ALL_QUARTERS.slice(0, 2);
  if (filingPeriod === 'Q2') return ALL_QUARTERS.slice(0, 1);
  return [];
}

function getIntroText(filingPeriod: FilingPeriod): string {
  if (filingPeriod === 'ANNUAL') {
    return 'If you made quarterly income tax payments during the year (Q1, Q2, or Q3 using Form 1701Q), enter them here. These payments will be credited against your annual tax due.';
  }
  if (filingPeriod === 'Q2') {
    return 'If you made a Q1 quarterly income tax payment earlier this year, enter it here. The Q2 return uses the cumulative method — your Q1 payment is credited against the Q2 tax due.';
  }
  if (filingPeriod === 'Q3') {
    return 'If you made Q1 and/or Q2 quarterly income tax payments earlier this year, enter them here.';
  }
  return '';
}

function parseAmt(v: string): number {
  return parseFloat(v.replace(/,/g, '')) || 0;
}

export function WS09PriorQuarterly({ data, onChange, onNext, onBack }: Props) {
  const filingPeriod = (data.filingPeriod ?? 'ANNUAL') as FilingPeriod;
  const existingPayments = data.priorQuarterlyPayments ?? [];

  const visibleQuarters = getVisibleQuarters(filingPeriod);

  const [hasPrior, setHasPrior] = useState<'yes' | 'no'>(
    existingPayments.length > 0 ? 'yes' : 'no'
  );

  // Per-quarter state
  const [amounts, setAmounts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    for (const q of visibleQuarters) {
      const existing = existingPayments.find((p) => p.quarter === q.quarter);
      m[q.quarter] = existing?.amountPaid ?? '';
    }
    return m;
  });

  const [dates, setDates] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    for (const q of visibleQuarters) {
      const existing = existingPayments.find((p) => p.quarter === q.quarter);
      m[q.quarter] = existing?.datePaid ?? '';
    }
    return m;
  });

  const [errors, setErrors] = useState<Record<number, string>>({});

  function validate(): boolean {
    const newErrors: Record<number, string> = {};
    for (const q of visibleQuarters) {
      const amt = parseAmt(amounts[q.quarter] ?? '');
      if (amt < 0) {
        newErrors[q.quarter] = 'Payment amount cannot be negative.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (hasPrior === 'no') {
      onChange({ priorQuarterlyPayments: [] });
      onNext();
      return;
    }

    if (!validate()) return;

    const payments: QuarterlyPayment[] = visibleQuarters
      .filter((q) => parseAmt(amounts[q.quarter] ?? '') > 0)
      .map((q) => ({
        quarter: q.quarter,
        amountPaid: amounts[q.quarter] || '0.00',
        datePaid: dates[q.quarter] || null,
        form1701qPeriod: q.period,
      }));

    onChange({ priorQuarterlyPayments: payments });
    onNext();
  }

  // If filing period is Q1 (no prior quarters), skip directly
  if (visibleQuarters.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-normal">Previous quarterly tax payments this year</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This is a Q1 return — no prior quarterly payments apply.
          </p>
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack} className="h-11 px-5">Back</Button>
          <Button onClick={() => { onChange({ priorQuarterlyPayments: [] }); onNext(); }} className="h-11 px-6">Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Previous quarterly tax payments this year</h2>
        <p className="text-sm text-muted-foreground mt-1">{getIntroText(filingPeriod)}</p>
      </div>

      <div className="space-y-2">
        <Label>Did you make any quarterly income tax payments this year?</Label>
        <RadioGroup
          value={hasPrior}
          onValueChange={(v) => setHasPrior(v as 'yes' | 'no')}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="prior-yes" />
            <Label htmlFor="prior-yes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="prior-no" />
            <Label htmlFor="prior-no" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Quarterly payments are made using BIR Form 1701Q. If this is your first time filing or
          you didn't file quarterly returns, select 'No'.
        </p>
      </div>

      {hasPrior === 'yes' && (
        <div className="space-y-4">
          {visibleQuarters.map((q) => {
            const amt = amounts[q.quarter] ?? '';
            const dt = dates[q.quarter] ?? '';
            const showDate = parseAmt(amt) > 0;
            return (
              <div key={q.quarter} className="border rounded-lg p-4 space-y-3">
                <p className="font-medium text-sm">{q.label}</p>

                <div className="space-y-1">
                  <Label>{q.label}</Label>
                  <PesoInput
                    value={amt}
                    onChange={(v) =>
                      setAmounts((prev) => ({ ...prev, [q.quarter]: v }))
                    }
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    The net amount you actually paid to BIR for your {q.period} 1701Q return.
                    Enter the actual amount remitted, not the computed tax.
                  </p>
                  {errors[q.quarter] && (
                    <p className="text-sm text-destructive">{errors[q.quarter]}</p>
                  )}
                </div>

                {showDate && (
                  <div className="space-y-1">
                    <Label>{q.period} payment date</Label>
                    <Input
                      type="date"
                      value={dt}
                      onChange={(e) =>
                        setDates((prev) => ({ ...prev, [q.quarter]: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      The date you paid this {q.period} installment. Optional — used to verify
                      timeliness.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">Back</Button>
        <Button onClick={handleNext} className="h-11 px-6">Continue</Button>
      </div>
    </div>
  );
}

export default WS09PriorQuarterly;
