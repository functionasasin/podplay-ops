import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';
import type { Form2307Entry } from '@/types/engine-input';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ATC_OPTIONS = [
  { value: 'WI010', label: 'WI010 — Professional fee, individual (5% or 10%)' },
  { value: 'WI011', label: 'WI011 — Rental income, individual' },
  { value: 'WI157', label: 'WI157 — Professional fee ≥ ₱720K, individual (15%)' },
  { value: 'WI160', label: 'WI160 — Additional professional fees, individual (10%)' },
  { value: 'WI760', label: 'WI760 — E-marketplace / DFSP remittance (1%, RR 16-2023)' },
  { value: 'WC010', label: 'WC010 — Professional fee, corporate payee (5% or 10%)' },
  { value: 'WC760', label: 'WC760 — E-marketplace, corporate payee (1%)' },
  { value: 'PT010', label: 'PT010 — Percentage tax (3%), withheld by government' },
  { value: 'OTHER', label: 'Other — I\'ll enter the code manually' },
];

const INCOME_TAX_ATCS = new Set(['WI010', 'WI011', 'WI157', 'WI160', 'WI760', 'WC010', 'WC760']);

type EntryDraft = {
  payorName: string;
  payorTin: string;
  atcCode: string;
  atcOther: string;
  incomePayment: string;
  taxWithheld: string;
  periodFrom: string;
  periodTo: string;
};

type EntryErrors = Partial<Record<keyof EntryDraft, string>>;

function emptyDraft(taxYear: number): EntryDraft {
  return {
    payorName: '',
    payorTin: '',
    atcCode: 'WI010',
    atcOther: '',
    incomePayment: '',
    taxWithheld: '',
    periodFrom: `${taxYear}-01-01`,
    periodTo: `${taxYear}-12-31`,
  };
}

function parseAmt(v: string): number {
  return parseFloat(v.replace(/,/g, '')) || 0;
}

function validateDraft(draft: EntryDraft, taxYear: number): EntryErrors {
  const errs: EntryErrors = {};

  if (!draft.payorName || draft.payorName.trim().length < 2) {
    errs.payorName = draft.payorName
      ? 'Please enter at least 2 characters.'
      : 'Please enter the name of the client who withheld this tax.';
  } else if (draft.payorName.length > 200) {
    errs.payorName = 'Name must be 200 characters or fewer.';
  }

  if (draft.payorTin) {
    const tinPattern = /^\d{3}-\d{3}-\d{3}(-\d{3})?$/;
    if (!tinPattern.test(draft.payorTin)) {
      errs.payorTin =
        'Please enter the TIN in the format XXX-XXX-XXX or XXX-XXX-XXX-XXX (e.g., 123-456-789-000).';
    }
  }

  if (!draft.atcCode) {
    errs.atcCode = 'Please select an ATC code.';
  } else if (draft.atcCode === 'OTHER' && !draft.atcOther.trim()) {
    errs.atcOther = 'Please enter the ATC code.';
  }

  const incomeAmt = parseAmt(draft.incomePayment);
  if (!draft.incomePayment) {
    errs.incomePayment = 'Please enter the income amount.';
  } else if (incomeAmt <= 0) {
    errs.incomePayment = 'Income payment must be greater than ₱0.';
  }

  const taxAmt = parseAmt(draft.taxWithheld);
  if (!draft.taxWithheld) {
    errs.taxWithheld = 'Please enter the amount withheld.';
  } else if (taxAmt < 0) {
    errs.taxWithheld = 'Tax withheld cannot be negative.';
  } else if (incomeAmt > 0 && taxAmt > incomeAmt) {
    errs.taxWithheld = 'Tax withheld cannot exceed the income payment amount.';
  }

  if (!draft.periodFrom) {
    errs.periodFrom = 'Please enter the period start date.';
  } else {
    const from = new Date(draft.periodFrom);
    if (from.getFullYear() !== taxYear) {
      errs.periodFrom = `The period dates must fall within tax year ${taxYear}.`;
    }
  }

  if (!draft.periodTo) {
    errs.periodTo = 'Please enter the period end date.';
  } else {
    const to = new Date(draft.periodTo);
    if (to.getFullYear() !== taxYear) {
      errs.periodTo = `The period dates must fall within tax year ${taxYear}.`;
    } else if (draft.periodFrom && new Date(draft.periodFrom) > to) {
      errs.periodTo = 'Period start date cannot be after period end date.';
    }
  }

  return errs;
}

function getAtcPreview(atcCode: string, atcOther: string): { type: 'income' | 'pt' | 'unknown'; text: string } | null {
  if (!atcCode) return null;
  if (INCOME_TAX_ATCS.has(atcCode)) {
    return { type: 'income', text: 'This credit will apply to your income tax due.' };
  }
  if (atcCode === 'PT010') {
    return {
      type: 'pt',
      text: 'This credit applies to your percentage tax (2551Q), NOT your income tax. It does not reduce your Form 1701/1701A balance.',
    };
  }
  if (atcCode === 'OTHER') {
    if (!atcOther.trim()) return null;
    return {
      type: 'unknown',
      text: 'Unrecognized ATC code — this will require manual review. The credit will be flagged and NOT automatically applied until the code is confirmed.',
    };
  }
  return null;
}

function getWithholdingHint(atcCode: string, incomePayment: string): string | null {
  const amt = parseAmt(incomePayment);
  if (!amt || !atcCode) return null;
  const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  if (atcCode === 'WI010') {
    return `At 5%: ₱${fmt(amt * 0.05)} | At 10%: ₱${fmt(amt * 0.10)}`;
  }
  if (atcCode === 'WI157') {
    return `At 15%: ₱${fmt(amt * 0.15)}`;
  }
  if (atcCode === 'WI760') {
    return `At 1% (on ½ remittance): ₱${fmt(amt * 0.005)} (0.5% effective rate per RR 16-2023)`;
  }
  if (atcCode === 'PT010') {
    return `At 3%: ₱${fmt(amt * 0.03)}`;
  }
  return null;
}

export function WS08CwtForm2307({ data, onChange, onNext, onBack }: Props) {
  const taxYear = data.taxYear ?? new Date().getFullYear();
  const existing = data.cwt2307Entries ?? [];

  const [has2307, setHas2307] = useState<'yes' | 'no'>(existing.length > 0 ? 'yes' : 'no');

  const [drafts, setDrafts] = useState<EntryDraft[]>(() => {
    if (existing.length === 0) return [emptyDraft(taxYear)];
    return existing.map((e) => ({
      payorName: e.payorName,
      payorTin: e.payorTin,
      atcCode: e.atcCode === 'OTHER' || !ATC_OPTIONS.find((o) => o.value === e.atcCode && o.value !== 'OTHER') ? 'OTHER' : e.atcCode,
      atcOther: INCOME_TAX_ATCS.has(e.atcCode) || e.atcCode === 'PT010' ? '' : e.atcCode,
      incomePayment: e.incomePayment,
      taxWithheld: e.taxWithheld,
      periodFrom: e.periodFrom,
      periodTo: e.periodTo,
    }));
  });

  const [allErrors, setAllErrors] = useState<EntryErrors[]>(() => drafts.map(() => ({})));

  function updateDraft(i: number, patch: Partial<EntryDraft>) {
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
    setAllErrors((prev) =>
      prev.map((e, idx) => {
        if (idx !== i) return e;
        const updated = { ...e };
        for (const k of Object.keys(patch) as (keyof EntryDraft)[]) {
          delete updated[k];
        }
        return updated;
      })
    );
  }

  function addDraft() {
    setDrafts((prev) => [...prev, emptyDraft(taxYear)]);
    setAllErrors((prev) => [...prev, {}]);
  }

  function removeDraft(i: number) {
    setDrafts((prev) => prev.filter((_, idx) => idx !== i));
    setAllErrors((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleNext() {
    if (has2307 === 'no') {
      onChange({ cwt2307Entries: [] });
      onNext();
      return;
    }

    if (drafts.length > 50) {
      return;
    }

    const newErrors = drafts.map((d) => validateDraft(d, taxYear));
    setAllErrors(newErrors);
    if (newErrors.some((e) => Object.keys(e).length > 0)) return;

    const entries: Form2307Entry[] = drafts.map((d) => ({
      payorName: d.payorName.trim(),
      payorTin: d.payorTin || '',
      atcCode: d.atcCode === 'OTHER' ? d.atcOther.trim() : d.atcCode,
      incomePayment: d.incomePayment || '0.00',
      taxWithheld: d.taxWithheld || '0.00',
      periodFrom: d.periodFrom,
      periodTo: d.periodTo,
      quarterOfCredit: null,
    }));

    onChange({ cwt2307Entries: entries });
    onNext();
  }

  // Running totals
  const incomeTaxCredits = has2307 === 'yes'
    ? drafts.reduce((sum, d) => {
        const atc = d.atcCode === 'OTHER' ? d.atcOther.trim() : d.atcCode;
        return INCOME_TAX_ATCS.has(atc) ? sum + parseAmt(d.taxWithheld) : sum;
      }, 0)
    : 0;
  const ptCredits = has2307 === 'yes'
    ? drafts.reduce((sum, d) => (d.atcCode === 'PT010' ? sum + parseAmt(d.taxWithheld) : sum), 0)
    : 0;
  const unknownCredits = has2307 === 'yes'
    ? drafts.reduce((sum, d) => {
        if (d.atcCode !== 'OTHER') return sum;
        const code = d.atcOther.trim();
        if (!code || INCOME_TAX_ATCS.has(code) || code === 'PT010') return sum;
        return sum + parseAmt(d.taxWithheld);
      }, 0)
    : 0;
  const hasEntries = has2307 === 'yes' && drafts.some((d) => parseAmt(d.taxWithheld) > 0);
  const fmt = (n: number) => n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Tax withheld by your clients (BIR Form 2307)</h2>
        <p className="text-sm text-muted-foreground mt-1">
          When Philippine clients pay you for services, they are often required to withhold a
          portion of your fee and give you a BIR Form 2307. This withheld amount is like a tax
          pre-payment — you deduct it from your computed income tax due.
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          Did you receive any BIR Form 2307 certificates from clients this year?
        </Label>
        <RadioGroup
          value={has2307}
          onValueChange={(v) => setHas2307(v as 'yes' | 'no')}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="cwt-yes" />
            <Label htmlFor="cwt-yes" className="font-normal cursor-pointer">Yes</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="cwt-no" />
            <Label htmlFor="cwt-no" className="font-normal cursor-pointer">No</Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          Form 2307 is a certificate your client gives you when they withhold tax. It shows the
          client's name and TIN, the amount paid, the withholding rate, and the total tax withheld.
          If you only worked for foreign clients or platforms that don't withhold Philippine tax,
          select No.
        </p>
      </div>

      {has2307 === 'no' && (
        <Alert>
          <AlertDescription>
            If you worked through platforms like Upwork or Fiverr, check whether your payment
            processor (e.g., Payoneer, PayPal, GCash) issued you a Form 2307 under BIR RR 16-2023.
            These may withhold 1% (WI760) on remittances.
          </AlertDescription>
        </Alert>
      )}

      {has2307 === 'yes' && (
        <div className="space-y-4">
          {drafts.map((draft, i) => {
            const errs = allErrors[i] ?? {};
            const preview = getAtcPreview(draft.atcCode, draft.atcOther);
            const hint = getWithholdingHint(
              draft.atcCode === 'OTHER' ? draft.atcOther : draft.atcCode,
              draft.incomePayment
            );

            return (
              <div key={i} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Form 2307 — Entry {i + 1}</span>
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
                  <Label>Client or company name (withholding agent)</Label>
                  <Input
                    value={draft.payorName}
                    onChange={(e) => updateDraft(i, { payorName: e.target.value })}
                    placeholder="e.g., Acme Corporation, Juan Santos"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    The name of the person or company that withheld the tax.
                  </p>
                  {errs.payorName && <p className="text-sm text-destructive">{errs.payorName}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Client's TIN (Tax Identification Number)</Label>
                  <Input
                    value={draft.payorTin}
                    onChange={(e) => updateDraft(i, { payorTin: e.target.value })}
                    placeholder="XXX-XXX-XXX-XXXX"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional — leaving this blank will not affect your tax computation.
                  </p>
                  {errs.payorTin && <p className="text-sm text-destructive">{errs.payorTin}</p>}
                </div>

                <div className="space-y-1">
                  <Label>ATC code (Alphanumeric Tax Code)</Label>
                  <Select
                    value={draft.atcCode}
                    onValueChange={(v) => updateDraft(i, { atcCode: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ATC code" />
                    </SelectTrigger>
                    <SelectContent>
                      {ATC_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The ATC code tells BIR what type of income was withheld. If unsure, WI010 is
                    the most common for freelancers.
                  </p>
                  {errs.atcCode && <p className="text-sm text-destructive">{errs.atcCode}</p>}

                  {draft.atcCode === 'OTHER' && (
                    <div className="mt-2">
                      <Input
                        value={draft.atcOther}
                        onChange={(e) => updateDraft(i, { atcOther: e.target.value })}
                        placeholder="Enter ATC code (e.g., WI162)"
                      />
                      {errs.atcOther && (
                        <p className="text-sm text-destructive mt-1">{errs.atcOther}</p>
                      )}
                    </div>
                  )}

                  {preview && (
                    <Alert
                      className={
                        preview.type === 'income'
                          ? 'border-green-400 bg-green-50 text-green-900'
                          : 'border-amber-400 bg-amber-50 text-amber-900'
                      }
                    >
                      <AlertDescription>{preview.text}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Gross income on which tax was withheld</Label>
                  <PesoInput
                    value={draft.incomePayment}
                    onChange={(v) => updateDraft(i, { incomePayment: v })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    The total amount the client paid you during this period — before they withheld
                    tax.
                  </p>
                  {errs.incomePayment && (
                    <p className="text-sm text-destructive">{errs.incomePayment}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Amount of tax withheld</Label>
                  <PesoInput
                    value={draft.taxWithheld}
                    onChange={(v) => updateDraft(i, { taxWithheld: v })}
                    placeholder="0.00"
                  />
                  {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                  {errs.taxWithheld && (
                    <p className="text-sm text-destructive">{errs.taxWithheld}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Period start date</Label>
                    <Input
                      type="date"
                      value={draft.periodFrom}
                      onChange={(e) => updateDraft(i, { periodFrom: e.target.value })}
                    />
                    {errs.periodFrom && (
                      <p className="text-sm text-destructive">{errs.periodFrom}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Period end date</Label>
                    <Input
                      type="date"
                      value={draft.periodTo}
                      onChange={(e) => updateDraft(i, { periodTo: e.target.value })}
                    />
                    {errs.periodTo && (
                      <p className="text-sm text-destructive">{errs.periodTo}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <Button variant="outline" onClick={addDraft} className="w-full">
            + Add another Form 2307
          </Button>

          {hasEntries && (
            <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
              <p className="font-medium text-sm">Summary of Tax Credits from Form 2307</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Income Tax Credits (WI/WC series):</span>
                  <span>₱{fmt(incomeTaxCredits)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentage Tax Credits (PT010):</span>
                  <span>₱{fmt(ptCredits)}</span>
                </div>
                {unknownCredits > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits requiring review (unknown):</span>
                    <span>₱{fmt(unknownCredits)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-1 mt-1">
                  <span>Total Income Tax Credits:</span>
                  <span>₱{fmt(incomeTaxCredits)}</span>
                </div>
              </div>
            </div>
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

export default WS08CwtForm2307;
