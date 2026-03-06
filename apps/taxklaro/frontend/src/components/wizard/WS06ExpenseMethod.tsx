import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { WizardFormData } from '@/types/wizard';

export type ExpenseInputMethod = 'ITEMIZED' | 'OSD' | 'NO_EXPENSES';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const OPTIONS: { value: ExpenseInputMethod; title: string; description: string }[] = [
  {
    value: 'ITEMIZED',
    title: 'Enter my actual expenses',
    description:
      "I'll enter a detailed breakdown of what I spent on my business. This may save you more tax if your actual expenses exceed 40% of your income. You'll need your receipts and records.",
  },
  {
    value: 'OSD',
    title: 'Use the 40% standard deduction (easier)',
    description:
      "I don't want to track individual expenses. The BIR allows you to deduct 40% of your gross income automatically — no receipts needed. Great if your expenses are below 40% of income or you don't keep detailed records.",
  },
  {
    value: 'NO_EXPENSES',
    title: 'I had no significant business expenses',
    description:
      'My only income source is services billed to clients and I had no notable business costs. The tool will compute using OSD (40%) and 8% flat rate (if eligible).',
  },
];

function parseAmount(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, '')) || 0;
}

function formatPeso(amount: number): string {
  return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function WS06ExpenseMethod({ data, onChange, onNext, onBack }: Props) {
  const [method, setMethod] = useState<ExpenseInputMethod | null>(
    data.osdElected === true ? 'OSD' : data.osdElected === false ? 'ITEMIZED' : null
  );
  const [error, setError] = useState<string | null>(null);

  const grossAmt = parseAmount(data.grossReceipts);
  const returnsAmt = parseAmount(data.salesReturnsAllowances);
  const netReceipts = grossAmt - returnsAmt;
  const osdEstimate = grossAmt * 0.4;
  const taxableUnderOsd = netReceipts * 0.6;

  const showOsdAdvisory =
    (method === 'OSD' || method === 'NO_EXPENSES') && grossAmt > 0;

  function handleNext() {
    if (!method) {
      setError("Please select how you'll enter your expenses.");
      return;
    }
    const isItemized = method === 'ITEMIZED';
    onChange({
      osdElected: !isItemized,
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">
          How would you like to handle your business expenses?
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          To recommend the best tax method, the optimizer needs to know your business expenses.
          You have two options:
        </p>
      </div>

      <RadioGroup
        value={method ?? ''}
        onValueChange={(v) => {
          setMethod(v as ExpenseInputMethod);
          setError(null);
        }}
        className="gap-3"
      >
        {OPTIONS.map((opt) => (
          <div key={opt.value}>
            <RadioGroupItem value={opt.value} id={`expense-${opt.value}`} className="sr-only" />
            <Label htmlFor={`expense-${opt.value}`} className="cursor-pointer block">
              <Card
                className={cn(
                  'transition-all duration-200 shadow-sm',
                  method === opt.value
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

      {showOsdAdvisory && (
        <Alert>
          <AlertDescription>
            Estimated OSD deduction: ₱{formatPeso(osdEstimate)}. This is 40% of your gross
            receipts. Taxable income under OSD would be approximately ₱{formatPeso(taxableUnderOsd)}.
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Regardless of which you choose, the optimizer will always compare all three tax methods
        (8%, OSD, and Itemized) and tell you which saves the most.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}

export default WS06ExpenseMethod;
