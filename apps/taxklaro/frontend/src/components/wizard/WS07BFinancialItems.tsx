import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PesoInput } from '@/components/shared/PesoInput';
import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function parseAmt(v: string | undefined): number {
  if (!v) return 0;
  return parseFloat(v.replace(/,/g, '')) || 0;
}

function fmt(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ZERO = '0.00';

export function WS07BFinancialItems({ data, onChange, onNext, onBack }: Props) {
  const ie = data.itemizedExpenses ?? {};
  const [interestExpense, setInterestExpense] = useState(ie.interestExpense ?? ZERO);
  const [finalTaxedInterestIncome, setFinalTaxedInterestIncome] = useState(ie.finalTaxedInterestIncome ?? ZERO);
  const [casualtyTheftLosses, setCasualtyTheftLosses] = useState(ie.casualtyTheftLosses ?? ZERO);
  const [isAccrualBasis, setIsAccrualBasis] = useState(ie.isAccrualBasis ?? false);
  const [badDebts, setBadDebts] = useState(ie.badDebts ?? ZERO);
  const [charitableContributions, setCharitableContributions] = useState(ie.charitableContributions ?? ZERO);
  const [charitableAccredited, setCharitableAccredited] = useState(ie.charitableAccredited ?? false);
  const [researchDevelopment, setResearchDevelopment] = useState(ie.researchDevelopment ?? ZERO);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const interestAmt = parseAmt(interestExpense);
  const finalTaxedAmt = parseAmt(finalTaxedInterestIncome);
  const badDebtsAmt = parseAmt(badDebts);
  const charitableAmt = parseAmt(charitableContributions);
  const arbitrageReduction = finalTaxedAmt * 0.33;
  const netDeductibleInterest = interestAmt - arbitrageReduction;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (interestAmt < 0) errs.interestExpense = 'Amount cannot be negative.';
    if (parseAmt(finalTaxedInterestIncome) < 0) errs.finalTaxedInterestIncome = 'Amount cannot be negative.';
    if (parseAmt(casualtyTheftLosses) < 0) errs.casualtyTheftLosses = 'Amount cannot be negative.';
    if (badDebtsAmt < 0) errs.badDebts = 'Amount cannot be negative.';
    if (!isAccrualBasis && badDebtsAmt > 0) {
      errs.badDebts = 'Bad debts deduction is only available to accrual-basis taxpayers. You indicated you use cash basis accounting. Please correct your accounting method selection or remove this amount.';
    }
    if (charitableAmt < 0) errs.charitableContributions = 'Amount cannot be negative.';
    if (charitableAmt > 0 && !charitableAccredited) {
      // advisory only — not a hard validation error
    }
    if (parseAmt(researchDevelopment) < 0) errs.researchDevelopment = 'Amount cannot be negative.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    onChange({
      itemizedExpenses: {
        ...ie,
        interestExpense,
        finalTaxedInterestIncome,
        casualtyTheftLosses,
        isAccrualBasis,
        badDebts,
        charitableContributions,
        charitableAccredited,
        researchDevelopment,
      },
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Your business expenses — Financial and special items</h2>
      </div>

      <div className="space-y-1">
        <Label htmlFor="interest-expense">Interest expense on business loans</Label>
        <PesoInput
          id="interest-expense"
          value={interestExpense}
          onChange={(v) => { setInterestExpense(v); setErrors((e) => ({ ...e, interestExpense: '' })); }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Gross interest paid on loans used for your business. Personal loans are not deductible.
          The BIR reduces this deduction by 33% of your interest income on bank deposits. The engine
          automatically applies this reduction.
        </p>
        {errors.interestExpense && <p className="text-sm text-destructive">{errors.interestExpense}</p>}
      </div>

      {interestAmt > 0 && (
        <div className="space-y-1">
          <Label htmlFor="final-taxed-interest">
            Interest income from bank deposits (subject to 20% final tax)
          </Label>
          <PesoInput
            id="final-taxed-interest"
            value={finalTaxedInterestIncome}
            onChange={(v) => { setFinalTaxedInterestIncome(v); setErrors((e) => ({ ...e, finalTaxedInterestIncome: '' })); }}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            If you earned interest on bank savings accounts or time deposits, enter the gross
            interest (before the 20% withholding). This is used to compute the 33% arbitrage
            reduction to your interest expense deduction.
          </p>
          {errors.finalTaxedInterestIncome && <p className="text-sm text-destructive">{errors.finalTaxedInterestIncome}</p>}
          {interestAmt > 0 && finalTaxedAmt > 0 && (
            <Alert className="border-blue-400 bg-blue-50 text-blue-900">
              <AlertDescription>
                BIR requires a reduction to your interest expense deduction: 33% × ₱{fmt(finalTaxedAmt)} ={' '}
                ₱{fmt(arbitrageReduction)} will be subtracted from the gross interest expense. Net
                deductible interest: ₱{fmt(netDeductibleInterest)}.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="casualty-losses">Casualty or theft losses (not covered by insurance)</Label>
        <PesoInput
          id="casualty-losses"
          value={casualtyTheftLosses}
          onChange={(v) => { setCasualtyTheftLosses(v); setErrors((e) => ({ ...e, casualtyTheftLosses: '' })); }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Losses of business property due to fire, typhoon, earthquake, flood, or theft that were
          NOT compensated by insurance. Only business assets qualify.
        </p>
        {errors.casualtyTheftLosses && <p className="text-sm text-destructive">{errors.casualtyTheftLosses}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Switch
            id="accrual-basis"
            checked={isAccrualBasis}
            onCheckedChange={(checked) => {
              setIsAccrualBasis(checked);
              if (!checked) setErrors((e) => ({ ...e, badDebts: '' }));
            }}
          />
          <Label htmlFor="accrual-basis">Do you use accrual accounting?</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Accrual basis: you record income when earned (invoiced) and expenses when incurred, even if
          not yet paid. Cash basis: you record income and expenses only when cash changes hands. Most
          freelancers use cash basis. Bad debts are only deductible under accrual basis.
        </p>
      </div>

      {isAccrualBasis && (
        <div className="space-y-1">
          <Label htmlFor="bad-debts">Bad debts written off</Label>
          <PesoInput
            id="bad-debts"
            value={badDebts}
            onChange={(v) => { setBadDebts(v); setErrors((e) => ({ ...e, badDebts: '' })); }}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Receivables from clients that you have formally written off as uncollectible this year.
            The client owed you money, you previously recognized this as income (accrual basis), you
            made reasonable collection efforts, and you've now given up on collecting. This deduction
            is NOT available to cash-basis taxpayers.
          </p>
          {errors.badDebts && <p className="text-sm text-destructive">{errors.badDebts}</p>}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="charitable">Charitable contributions and donations</Label>
        <PesoInput
          id="charitable"
          value={charitableContributions}
          onChange={(v) => { setCharitableContributions(v); setErrors((e) => ({ ...e, charitableContributions: '' })); }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Donations to BIR-accredited charitable organizations, foundations, or institutions. Capped
          at 10% of your taxable income before this deduction. Donations to non-accredited
          organizations are NOT deductible. The engine automatically applies the cap.
        </p>
        {errors.charitableContributions && <p className="text-sm text-destructive">{errors.charitableContributions}</p>}
      </div>

      {charitableAmt > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Switch
              id="charitable-accredited"
              checked={charitableAccredited}
              onCheckedChange={setCharitableAccredited}
            />
            <Label htmlFor="charitable-accredited">
              Is the recipient a BIR-accredited charitable organization?
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            BIR-accredited organizations have a certificate of accreditation. If you're unsure,
            select 'No' to be safe — unaccredited donations are not deductible.
          </p>
          {!charitableAccredited && (
            <Alert className="border-amber-400 bg-amber-50 text-amber-900">
              <AlertDescription>
                Donations to non-accredited organizations are NOT deductible under NIRC Sec. 34(H).
                Your charitable contribution of ₱{parseAmt(charitableContributions).toLocaleString('en-PH', { minimumFractionDigits: 2 })} will be excluded from your deductions.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="research-development">Research and development expenses</Label>
        <PesoInput
          id="research-development"
          value={researchDevelopment}
          onChange={(v) => { setResearchDevelopment(v); setErrors((e) => ({ ...e, researchDevelopment: '' })); }}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground">
          Expenditures for research, product development, or technological innovation directly
          connected to your business. Must be ordinary and necessary for your business.
        </p>
        {errors.researchDevelopment && <p className="text-sm text-destructive">{errors.researchDevelopment}</p>}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Continue</Button>
      </div>
    </div>
  );
}

export default WS07BFinancialItems;
