import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WizardFormData } from '@/types/wizard';
import type { TaxpayerType } from '@/types/common';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TAXPAYER_OPTIONS: { value: TaxpayerType; title: string; description: string }[] = [
  {
    value: 'PURELY_SE',
    title: "I'm purely self-employed or freelancing",
    description:
      'Your only income is from your own business, practice, or freelance work. No salary from any employer. You can choose the 8% flat rate if eligible.',
  },
  {
    value: 'MIXED_INCOME',
    title: 'I have both a job AND freelance/business income',
    description:
      'You receive a salary from an employer AND earn extra income from a side business or profession. Your compensation is taxed separately.',
  },
  {
    value: 'COMPENSATION_ONLY',
    title: 'I only have a salary from an employer',
    description:
      'You receive only a payslip. Your employer already handles your income tax via payroll (BIR Form 2316). This tool has limited use for you.',
  },
];

export function WS01TaxpayerProfile({ data, onChange, onNext, onBack }: Props) {
  const [selected, setSelected] = useState<TaxpayerType | null>(data.taxpayerType ?? null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(value: TaxpayerType) {
    setSelected(value);
    setError(null);
  }

  function handleNext() {
    if (!selected) {
      setError('Please tell us which best describes you.');
      return;
    }
    if (selected === 'COMPENSATION_ONLY') {
      setShowModal(true);
      return;
    }
    commitAndAdvance(selected);
  }

  function commitAndAdvance(type: TaxpayerType) {
    onChange({
      taxpayerType: type,
      isMixedIncome: type === 'MIXED_INCOME',
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Let&apos;s find your best tax option</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Which best describes your income situation?
        </p>
      </div>

      <RadioGroup
        value={selected ?? ''}
        onValueChange={(v) => handleSelect(v as TaxpayerType)}
        className="gap-3"
      >
        {TAXPAYER_OPTIONS.map((opt) => (
          <div key={opt.value}>
            <RadioGroupItem value={opt.value} id={`taxpayer-${opt.value}`} className="sr-only" />
            <Label htmlFor={`taxpayer-${opt.value}`} className="cursor-pointer block">
              <Card
                className={cn(
                  'transition-all duration-200 shadow-sm',
                  selected === opt.value
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                    : 'hover:border-primary/40 hover:shadow-md'
                )}
              >
                <CardContent className="p-5">
                  <div className="font-medium">{opt.title}</div>
                  <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{opt.description}</div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">Back</Button>
        <Button onClick={handleNext} className="h-11 px-6">Continue</Button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>This tool is for self-employed and freelance income</DialogTitle>
            <DialogDescription>
              If you only earn a salary from an employer, your employer already handles your income
              tax withheld through payroll. You receive a BIR Form 2316 from your employer. You
              typically don&apos;t need to file your own income tax return unless you have multiple
              employers or other income. If you also have any business income on the side, please
              select &apos;I have both a job AND freelance/business income&apos; instead.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelected(null);
                setShowModal(false);
              }}
            >
              I have business income too — go back
            </Button>
            <Button
              onClick={() => {
                setShowModal(false);
                commitAndAdvance('COMPENSATION_ONLY');
              }}
            >
              I understand — show me what applies to me
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WS01TaxpayerProfile;
