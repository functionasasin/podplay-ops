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
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WizardFormData } from '@/types/wizard';
import type { FilingPeriod } from '@/types/common';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const TAX_YEARS = [
  { value: 2018, label: '2018' },
  { value: 2019, label: '2019' },
  { value: 2020, label: '2020' },
  { value: 2021, label: '2021' },
  { value: 2022, label: '2022' },
  { value: 2023, label: '2023' },
  { value: 2024, label: '2024' },
  { value: 2025, label: '2025 (most common)' },
  { value: 2026, label: '2026 (current year — quarterly filers only)' },
];

function deriveMode(data: Partial<WizardFormData>): 'ANNUAL' | 'QUARTERLY' | 'PENALTY' {
  const fp = data.filingPeriod;
  if (fp === 'Q1' || fp === 'Q2' || fp === 'Q3') return 'QUARTERLY';
  return 'ANNUAL';
}

export function WS03TaxYear({ data, onChange, onNext, onBack }: Props) {
  const mode = deriveMode(data);
  const [taxYear, setTaxYear] = useState<number>(data.taxYear ?? 2025);
  const [filingPeriod, setFilingPeriod] = useState<FilingPeriod>(data.filingPeriod ?? 'ANNUAL');
  const [errors, setErrors] = useState<{ taxYear?: string; filingPeriod?: string }>({});

  function handleNext() {
    const errs: typeof errors = {};
    if (!taxYear || taxYear < 2018 || taxYear > 2026) {
      errs.taxYear = 'Please select a valid tax year between 2018 and 2026.';
    }
    if (mode === 'ANNUAL' && taxYear === 2026) {
      errs.taxYear =
        'You cannot file an Annual ITR for a year that has not yet ended. For quarterly returns in progress, select \'Quarterly Income Tax Return\' mode.';
    }
    if (!filingPeriod) {
      errs.filingPeriod = 'Please select the filing period.';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onChange({ taxYear, filingPeriod });
    onNext();
  }

  const quarterlyOptions: { value: FilingPeriod; label: string; due: string }[] = [
    { value: 'Q1', label: 'Q1 — January 1 through March 31', due: 'Due May 15' },
    { value: 'Q2', label: 'Q2 — January 1 through June 30 (cumulative)', due: 'Due August 15' },
    { value: 'Q3', label: 'Q3 — January 1 through September 30 (cumulative)', due: 'Due November 15' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">What period are you filing for?</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tax-year">Tax year</Label>
        <Select
          value={String(taxYear)}
          onValueChange={(v) => {
            setTaxYear(Number(v));
            setErrors((e) => ({ ...e, taxYear: undefined }));
          }}
        >
          <SelectTrigger id="tax-year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {TAX_YEARS.map((y) => (
              <SelectItem key={y.value} value={String(y.value)}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the calendar year you are filing for. For the Annual ITR due April 15, 2026:
          select 2025. For quarterly returns during 2026: select 2026.
        </p>
        {errors.taxYear && <p className="text-sm text-destructive">{errors.taxYear}</p>}

        {taxYear === 2023 && (
          <Alert className="border-amber-400 bg-amber-50 text-amber-900">
            <AlertDescription>
              For 2023, there are two rate tables. The OLD TRAIN rates apply to January–December
              2022 only. The NEW (lower) TRAIN rates apply to 2023 onwards. This tool applies the
              2023+ rate table for Tax Year 2023, which is correct per BIR.
            </AlertDescription>
          </Alert>
        )}
        {taxYear <= 2022 && (
          <Alert>
            <AlertDescription>
              You are computing tax for {taxYear}. The 2018–2022 graduated rate table applies,
              with higher brackets than the 2023+ table.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-2">
        <Label>Filing period</Label>
        {mode === 'ANNUAL' ? (
          <div className="p-3 rounded-md border bg-muted/50">
            <p className="font-medium text-sm">Annual Return — Full year (January 1–December 31)</p>
            <p className="text-xs text-muted-foreground mt-1">Pre-selected based on your mode choice.</p>
          </div>
        ) : (
          <>
            <RadioGroup
              value={filingPeriod}
              onValueChange={(v) => {
                setFilingPeriod(v as FilingPeriod);
                setErrors((e) => ({ ...e, filingPeriod: undefined }));
              }}
              className="gap-2"
            >
              {quarterlyOptions.map((opt) => (
                <div key={opt.value} className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover:border-primary/50 data-[state=checked]:border-primary">
                  <RadioGroupItem value={opt.value} id={`period-${opt.value}`} />
                  <Label htmlFor={`period-${opt.value}`} className="cursor-pointer flex-1">
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({opt.due})</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              There is no Q4 quarterly return for income tax. Q4 data is reported on your Annual
              ITR (Form 1701/1701A) due April 15 of the following year.
            </p>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          Annual: covers the full calendar year (Jan 1–Dec 31). Quarterly: covers Jan–Mar (Q1),
          Jan–Jun (Q2), or Jan–Sep (Q3) on a cumulative basis.
        </p>
        {errors.filingPeriod && <p className="text-sm text-destructive">{errors.filingPeriod}</p>}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}

export default WS03TaxYear;
