import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function parseAmount(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/,/g, '')) || 0;
}

export function WS04GrossReceipts({ data, onChange, onNext, onBack }: Props) {
  const [grossReceipts, setGrossReceipts] = useState<string>(data.grossReceipts ?? '');
  const [salesReturns, setSalesReturns] = useState<string>(data.salesReturnsAllowances ?? '0.00');
  const [nonOpIncome, setNonOpIncome] = useState<string>(data.nonOperatingIncome ?? '0.00');
  const [fwtIncome, setFwtIncome] = useState<string>(data.fwtIncome ?? '0.00');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const grossAmt = parseAmount(grossReceipts);
  const returnsAmt = parseAmount(salesReturns);
  const isVatRegistered = data.isVatRegistered ?? false;

  function getGrossAdvisory(): { type: 'amber' | 'green' | 'orange'; text: string } | null {
    if (grossReceipts === '') return null;
    if (grossAmt === 0)
      return {
        type: 'amber',
        text: "You have entered ₱0 for gross receipts. If you had no income this period, you are still required to file a 'no-income' return with BIR by the deadline.",
      };
    if (grossAmt <= 250000)
      return {
        type: 'amber',
        text: 'Your income is ₱250,000 or below. Under the 8% flat rate option, your income tax would be ₱0 — the ₱250,000 is fully exempt. You still need to file a return with BIR.',
      };
    if (grossAmt <= 3000000)
      return {
        type: 'green',
        text: 'You may be eligible for the 8% flat rate option. The optimizer will compare all available methods and recommend the one that saves you the most.',
      };
    return {
      type: 'orange',
      text: `Your gross receipts exceed ₱3,000,000. The 8% flat rate option is NOT available. The optimizer will compare Graduated + OSD versus Graduated + Itemized Deductions.${!isVatRegistered ? ' At this income level, you may be required to register for VAT. See Registration Details in a later step.' : ''}`,
    };
  }

  function handleNext() {
    const errs: Record<string, string> = {};
    if (grossReceipts === '') {
      errs.grossReceipts = 'Please enter your gross receipts. Enter ₱0 if you had no income this period.';
    } else if (grossAmt < 0) {
      errs.grossReceipts = 'Gross receipts cannot be negative.';
    } else if (grossAmt > 9999999999.99) {
      errs.grossReceipts = 'Amount exceeds maximum allowed value. If your income exceeds ₱10 billion, please contact us.';
    } else if (returnsAmt > grossAmt) {
      errs.grossReceipts = 'Gross receipts cannot be less than your sales returns and allowances.';
    }
    if (parseAmount(salesReturns) < 0) {
      errs.salesReturns = 'Sales returns and allowances cannot be negative.';
    }
    if (parseAmount(nonOpIncome) < 0) {
      errs.nonOpIncome = 'Income cannot be negative.';
    }
    if (parseAmount(fwtIncome) < 0) {
      errs.fwtIncome = 'Amount cannot be negative.';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onChange({
      grossReceipts: grossReceipts || '0.00',
      salesReturnsAllowances: salesReturns,
      nonOperatingIncome: nonOpIncome,
      fwtIncome,
    });
    onNext();
  }

  const advisory = getGrossAdvisory();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">How much did you earn?</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gross-receipts">Total gross receipts or sales</Label>
        <PesoInput
          id="gross-receipts"
          value={grossReceipts}
          onChange={(v) => {
            setGrossReceipts(v);
            setErrors((e) => ({ ...e, grossReceipts: '' }));
          }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Enter all income you received from your business or profession during the period —
          before subtracting any expenses. For quarterly returns: the cumulative total from
          January 1 through the end of the quarter, not just the current quarter&apos;s receipts.
        </p>
        {errors.grossReceipts && <p className="text-sm text-destructive">{errors.grossReceipts}</p>}
        {advisory && !errors.grossReceipts && (
          <Alert
            className={
              advisory.type === 'amber'
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : advisory.type === 'green'
                ? 'border-green-400 bg-green-50 text-green-900'
                : 'border-orange-400 bg-orange-50 text-orange-900'
            }
          >
            <AlertDescription>{advisory.text}</AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sales-returns">Sales returns and allowances (if any)</Label>
        <PesoInput
          id="sales-returns"
          value={salesReturns}
          onChange={(v) => {
            setSalesReturns(v);
            setErrors((e) => ({ ...e, salesReturns: '' }));
          }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Refunds you gave back to clients, credit memos, or discounts off the invoice price that
          reduce your gross receipts. Most freelancers leave this at ₱0.
        </p>
        {errors.salesReturns && <p className="text-sm text-destructive">{errors.salesReturns}</p>}
      </div>

      <Accordion type="single" collapsible>
        <AccordionItem value="additional-income">
          <AccordionTrigger className="text-sm">Additional income (optional)</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="non-op-income">
                Other business-related income (not subject to final tax)
              </Label>
              <PesoInput
                id="non-op-income"
                value={nonOpIncome}
                onChange={(v) => {
                  setNonOpIncome(v);
                  setErrors((e) => ({ ...e, nonOpIncome: '' }));
                }}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Passive income from your business not subject to final withholding tax and not
                already included in your gross receipts above. Examples: rental income, royalties
                where no final tax was withheld.
              </p>
              {errors.nonOpIncome && (
                <p className="text-sm text-destructive">{errors.nonOpIncome}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fwt-income">Income already subject to final withholding tax</Label>
              <PesoInput
                id="fwt-income"
                value={fwtIncome}
                onChange={(v) => {
                  setFwtIncome(v);
                  setErrors((e) => ({ ...e, fwtIncome: '' }));
                }}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Income on which the payor already withheld the FINAL tax — excluded from your
                income tax return computation. Examples: bank deposit interest (20% FWT),
                dividends from domestic corporations (10% FWT).
              </p>
              {errors.fwtIncome && (
                <p className="text-sm text-destructive">{errors.fwtIncome}</p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}

export default WS04GrossReceipts;
