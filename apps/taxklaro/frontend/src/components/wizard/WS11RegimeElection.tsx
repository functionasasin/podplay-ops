import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WizardFormData } from '@/types/wizard';
import type { RegimeElection } from '@/types/common';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export type RegimeElectionOption = 'ELECT_EIGHT_PCT' | 'ELECT_OSD' | 'ELECT_ITEMIZED' | null;

// null encoded as string for RadioGroup
const NULL_VALUE = '__OPTIMIZER__';

function parseGross(v: string | undefined): number {
  return parseFloat((v ?? '0').replace(/,/g, '')) || 0;
}

const OPTIONS: { value: string; title: string; description: string }[] = [
  {
    value: NULL_VALUE,
    title: 'Show me the best option (Optimizer Mode)',
    description:
      'I want the tool to compute all applicable methods and recommend the one that saves me the most. Best for planning or first-time filers.',
  },
  {
    value: 'ELECT_EIGHT_PCT',
    title: 'I elected the 8% flat rate',
    description:
      'I formally elected the 8% flat rate on my Q1 1701Q return (or first quarterly return).',
  },
  {
    value: 'ELECT_OSD',
    title: 'I elected the graduated method + 40% OSD',
    description:
      'I use the standard 40% deduction without tracking individual expenses.',
  },
  {
    value: 'ELECT_ITEMIZED',
    title: 'I elected the graduated method + itemized deductions',
    description:
      'I track my actual business expenses and claim them as deductions.',
  },
];

export function WS11RegimeElection({ data, onChange, onNext, onBack }: Props) {
  const initial = data.electedRegime === null || data.electedRegime === undefined
    ? NULL_VALUE
    : data.electedRegime;

  const [selected, setSelected] = useState<string>(initial);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isVatRegistered = data.isVatRegistered ?? false;
  const grossReceipts = parseGross(data.grossReceipts);
  const isGppPartner = data.isGppPartner ?? false;

  const eightPctBlocked =
    selected === 'ELECT_EIGHT_PCT' &&
    (isVatRegistered || grossReceipts > 3_000_000 || isGppPartner);

  function getEightPctBlockingMessage(): string | null {
    if (selected !== 'ELECT_EIGHT_PCT') return null;
    if (isVatRegistered)
      return 'You indicated you are VAT-registered. The 8% flat rate is NOT available to VAT-registered taxpayers. Please change your election to Graduated + OSD or Graduated + Itemized, or go back and correct your VAT registration status.';
    if (grossReceipts > 3_000_000)
      return 'Your gross receipts exceed ₱3,000,000. The 8% flat rate option is only available to taxpayers with gross receipts at or below ₱3,000,000. Please change your election.';
    if (isGppPartner)
      return 'GPP partners cannot elect the 8% flat rate. Please change your election.';
    return null;
  }

  function handleNext() {
    if (!selected) {
      setSubmitError('Please select your regime election status.');
      return;
    }
    if (eightPctBlocked) {
      setSubmitError(getEightPctBlockingMessage()!);
      return;
    }
    setSubmitError(null);
    const regime: RegimeElection | null = selected === NULL_VALUE
      ? null
      : (selected as RegimeElection);
    onChange({ electedRegime: regime });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Have you elected a specific tax method?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your 'election' is how you formally told BIR which tax method you're using. If you're not
          sure what you elected, select the optimizer mode.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Which best describes your situation?</Label>
        <RadioGroup
          value={selected}
          onValueChange={(v) => { setSelected(v); setSubmitError(null); }}
          className="space-y-3"
        >
          {OPTIONS.map((opt) => (
            <div
              key={opt.value}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selected === opt.value ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onClick={() => { setSelected(opt.value); setSubmitError(null); }}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={opt.value} id={`regime-${opt.value}`} className="mt-0.5" />
                <div>
                  <Label
                    htmlFor={`regime-${opt.value}`}
                    className="font-medium cursor-pointer"
                  >
                    {opt.title}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Your regime election is how you formally told BIR which tax method you're using. The 8%
          option must be elected on your first quarterly return (Q1 1701Q).
        </p>
      </div>

      {selected === NULL_VALUE && (
        <Alert className="border-blue-300 bg-blue-50">
          <AlertDescription className="text-blue-800 text-sm">
            The optimizer will compute all eligible methods and present a three-way comparison. You
            are not locked into the recommendation — it's for planning only.
          </AlertDescription>
        </Alert>
      )}

      {getEightPctBlockingMessage() && (
        <Alert className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800 text-sm">
            {getEightPctBlockingMessage()}
          </AlertDescription>
        </Alert>
      )}

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext} disabled={eightPctBlocked}>Continue</Button>
      </div>
    </div>
  );
}

export default WS11RegimeElection;
