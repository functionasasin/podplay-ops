import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function parseAmt(v: string): number {
  return parseFloat(v.replace(/,/g, '')) || 0;
}

export function WS13PriorYearCredits({ data, onChange, onNext, onBack }: Props) {
  const existingAmt = data.priorYearExcessCwt ?? '0.00';
  const [hasPriorCarryover, setHasPriorCarryover] = useState<boolean>(
    parseAmt(existingAmt) > 0
  );
  const [amount, setAmount] = useState<string>(existingAmt);
  const [error, setError] = useState<string>('');

  function validate(): boolean {
    if (hasPriorCarryover) {
      if (!amount || amount.trim() === '') {
        setError('Please enter the carry-over credit amount.');
        return false;
      }
      if (parseAmt(amount) < 0) {
        setError('Credit amount cannot be negative.');
        return false;
      }
    }
    setError('');
    return true;
  }

  function handleNext() {
    if (!validate()) return;
    onChange({
      priorYearExcessCwt: hasPriorCarryover ? amount || '0.00' : '0.00',
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Prior year carry-over tax credits</h2>
        <p className="text-sm text-muted-foreground mt-1">
          If you had excess tax credits from your prior year's annual return and elected to carry
          them over, enter the amount here.
        </p>
      </div>

      {/* has_prior_year_carryover — UI-only toggle */}
      <div className="flex items-start gap-3">
        <Switch
          id="has-prior-carryover"
          checked={hasPriorCarryover}
          onCheckedChange={(v) => {
            setHasPriorCarryover(v);
            setError('');
          }}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="has-prior-carryover" className="font-normal cursor-pointer">
            Did you carry over an excess tax credit from last year's annual return?
          </Label>
          <p className="text-xs text-muted-foreground">
            If your tax credits (from CWT and quarterly payments) exceeded your income tax due on
            last year's annual return and you elected 'Carry Over' as your overpayment disposition,
            you have a credit to apply this year. You can find this on your prior year's Form 1701
            or 1701A under 'Tax Credit Carried Over'.
          </p>
        </div>
      </div>

      {/* prior_year_excess_cwt — visible when hasPriorCarryover */}
      {hasPriorCarryover && (
        <div className="space-y-2">
          <Label htmlFor="prior-year-cwt">Amount of credit carried over from prior year</Label>
          <PesoInput
            value={amount}
            onChange={(v) => {
              setAmount(v);
              setError('');
            }}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            The exact peso amount shown as 'Carry Over' or 'Credit to be Applied Next Year' on your
            prior year's annual ITR. This reduces your current year's income tax balance payable.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}

export default WS13PriorYearCredits;
