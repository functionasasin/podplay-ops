import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';
import type { ReturnType } from '@/types/common';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export type ReturnTypeOption = 'ORIGINAL' | 'AMENDED';

export function WS12FilingDetails({ data, onChange, onNext, onBack }: Props) {
  const [returnType, setReturnType] = useState<ReturnType>(
    data.returnType ?? 'ORIGINAL'
  );
  const [priorPayment, setPriorPayment] = useState<string>(
    data.priorPaymentForReturn ?? '0.00'
  );
  const [isLateFiling, setIsLateFiling] = useState<boolean>(false);
  const [actualFilingDate, setActualFilingDate] = useState<string>(
    data.actualFilingDate ?? new Date().toISOString().split('T')[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function parsePrior(v: string): number {
    return parseFloat(v.replace(/,/g, '')) || 0;
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (returnType === 'AMENDED' && parsePrior(priorPayment) < 0) {
      newErrors.priorPayment = 'Prior payment cannot be negative.';
    }

    if (isLateFiling) {
      if (!actualFilingDate) {
        newErrors.actualFilingDate = 'Please enter the filing date.';
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(actualFilingDate)) {
        newErrors.actualFilingDate = 'Please enter a valid date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validate()) return;

    onChange({
      returnType,
      priorPaymentForReturn: returnType === 'AMENDED' ? priorPayment : '0.00',
      actualFilingDate: isLateFiling ? actualFilingDate : null,
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Filing details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about the type of return and whether you are filing on time.
        </p>
      </div>

      {/* return_type */}
      <div className="space-y-2">
        <Label>Is this an original or amended return?</Label>
        <RadioGroup
          value={returnType}
          onValueChange={(v) => { setReturnType(v as ReturnType); setErrors({}); }}
          className="space-y-2"
        >
          <div className="flex items-start gap-2">
            <RadioGroupItem value="ORIGINAL" id="rt-original" className="mt-0.5" />
            <Label htmlFor="rt-original" className="font-normal cursor-pointer">
              Original — I am filing this for the first time
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem value="AMENDED" id="rt-amended" className="mt-0.5" />
            <Label htmlFor="rt-amended" className="font-normal cursor-pointer">
              Amended — I am correcting a previously filed return
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Original: you are filing this return for the first time. Amended: you are correcting a
          return you already filed. Amendments must be filed within 3 years of the original due
          date.
        </p>
        {returnType === 'AMENDED' && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertDescription className="text-amber-800 text-sm">
              Amended returns must be filed within 3 years of the original due date. For tax year{' '}
              {data.taxYear}, the last date to amend is April 15,{' '}
              {(data.taxYear ?? new Date().getFullYear()) + 4}. Verify that this deadline has not
              passed.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* prior_payment_for_return — only when AMENDED */}
      {returnType === 'AMENDED' && (
        <div className="space-y-2">
          <Label htmlFor="prior-payment">Amount already paid on your original return</Label>
          <PesoInput
            value={priorPayment}
            onChange={setPriorPayment}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            If you already paid tax when you filed the original return, enter that amount here. It
            will be credited against the amended balance.
          </p>
          {errors.priorPayment && (
            <p className="text-sm text-destructive">{errors.priorPayment}</p>
          )}
        </div>
      )}

      {/* is_late_filing — UI-only */}
      <div className="flex items-start gap-3">
        <Switch
          id="late-filing"
          checked={isLateFiling}
          onCheckedChange={(v) => { setIsLateFiling(v); setErrors({}); }}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="late-filing" className="font-normal cursor-pointer">
            Are you filing after the deadline?
          </Label>
          <p className="text-xs text-muted-foreground">
            Deadlines: Annual ITR — April 15. Q1 — May 15. Q2 — August 15. Q3 — November 15. If
            you are filing after your deadline, select 'Yes' to compute penalties (surcharge,
            interest, and compromise penalty).
          </p>
        </div>
      </div>

      {isLateFiling && (
        <Alert className="border-orange-300 bg-orange-50">
          <AlertDescription className="text-orange-800 text-sm">
            Late filing penalties will be computed and shown in your results. Penalties include:
            surcharge, interest (6% or 12% per annum depending on your tier), and a compromise
            penalty.
          </AlertDescription>
        </Alert>
      )}

      {/* actual_filing_date — only when is_late_filing */}
      {isLateFiling && (
        <div className="space-y-2">
          <Label htmlFor="filing-date">Actual (or planned) filing date</Label>
          <Input
            id="filing-date"
            type="date"
            value={actualFilingDate}
            onChange={(e) => { setActualFilingDate(e.target.value); setErrors({}); }}
          />
          <p className="text-xs text-muted-foreground">
            Enter today's date if you are computing penalties as of today. Enter a future date if
            you want to estimate penalties for filing on a future date.
          </p>
          {errors.actualFilingDate && (
            <p className="text-sm text-destructive">{errors.actualFilingDate}</p>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}

export default WS12FilingDetails;
