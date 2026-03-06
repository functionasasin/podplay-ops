import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onBack: () => void;
  onSubmit: () => void;
}

function formatPeso(v: string | undefined | null): string {
  const n = parseFloat((v ?? '0').replace(/,/g, ''));
  if (isNaN(n)) return '₱0.00';
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SectionRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-1 text-sm border-b last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[55%] break-words">{value ?? '—'}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-1" style={{ boxShadow: 'var(--shadow-sm)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

export function WizardReview({ data, onBack, onSubmit }: Props) {
  const {
    taxpayerType,
    taxYear,
    filingPeriod,
    isMixedIncome,
    isVatRegistered,
    isBmbeRegistered,
    isGppPartner,
    grossReceipts,
    salesReturnsAllowances,
    nonOperatingIncome,
    costOfGoodsSold,
    taxableCompensation,
    compensationCwt,
    osdElected,
    electedRegime,
    priorQuarterlyPayments,
    cwt2307Entries,
    priorYearExcessCwt,
    returnType,
    priorPaymentForReturn,
    actualFilingDate,
  } = data;

  const expenseMethodLabel =
    osdElected === true ? 'Optional Standard Deduction (OSD)' :
    osdElected === false ? 'Itemized Deductions' :
    '—';

  const regimeLabel =
    electedRegime === 'ELECT_GRADUATED' ? 'Graduated (PATH A)' :
    electedRegime === 'ELECT_EIGHT_PCT' ? '8% Flat Rate (PATH C)' :
    electedRegime === 'SYSTEM_WILL_RECOMMEND' ? 'Let the system recommend' :
    '—';

  const cwtTotal = (cwt2307Entries ?? []).reduce(
    (sum, e) => sum + parseFloat((e.taxWithheld ?? '0').replace(/,/g, '') || '0'),
    0
  );

  const qlyTotal = (priorQuarterlyPayments ?? []).reduce(
    (sum, p) => sum + parseFloat((p.amountPaid ?? '0').replace(/,/g, '') || '0'),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Review your inputs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Verify everything below before computing your tax. Click "See My Results" when ready.
        </p>
      </div>

      {/* Profile */}
      <Section title="Taxpayer Profile">
        <SectionRow label="Taxpayer type" value={taxpayerType?.replace(/_/g, ' ')} />
        <SectionRow label="Tax year" value={taxYear?.toString()} />
        <SectionRow label="Filing period" value={filingPeriod} />
        <SectionRow label="Mixed income earner" value={isMixedIncome ? 'Yes' : 'No'} />
        <SectionRow label="VAT-registered" value={isVatRegistered ? 'Yes' : 'No'} />
        {isBmbeRegistered && <SectionRow label="BMBE-registered" value="Yes" />}
        {isGppPartner && <SectionRow label="GPP partner" value="Yes" />}
      </Section>

      {/* Income */}
      <Section title="Income">
        <SectionRow label="Gross receipts / sales" value={formatPeso(grossReceipts)} />
        {parseFloat((salesReturnsAllowances ?? '0').replace(/,/g, '')) > 0 && (
          <SectionRow label="Sales returns & allowances" value={formatPeso(salesReturnsAllowances)} />
        )}
        {parseFloat((nonOperatingIncome ?? '0').replace(/,/g, '')) > 0 && (
          <SectionRow label="Non-operating income" value={formatPeso(nonOperatingIncome)} />
        )}
        {parseFloat((costOfGoodsSold ?? '0').replace(/,/g, '')) > 0 && (
          <SectionRow label="Cost of goods sold" value={formatPeso(costOfGoodsSold)} />
        )}
        {isMixedIncome && (
          <>
            <SectionRow label="Taxable compensation" value={formatPeso(taxableCompensation)} />
            <SectionRow label="Compensation CWT" value={formatPeso(compensationCwt)} />
          </>
        )}
      </Section>

      {/* Deductions */}
      <Section title="Deductions">
        <SectionRow label="Expense method" value={expenseMethodLabel} />
      </Section>

      {/* Tax Elections */}
      <Section title="Tax Elections">
        <SectionRow label="Regime preference" value={regimeLabel} />
        <SectionRow label="Return type" value={returnType ?? 'ORIGINAL'} />
        {returnType === 'AMENDED' && (
          <SectionRow label="Prior payment on original return" value={formatPeso(priorPaymentForReturn)} />
        )}
        {actualFilingDate && (
          <SectionRow label="Actual filing date" value={actualFilingDate} />
        )}
      </Section>

      {/* Credits */}
      <Section title="Tax Credits">
        <SectionRow
          label="Form 2307 CWT entries"
          value={
            (cwt2307Entries ?? []).length > 0
              ? `${(cwt2307Entries ?? []).length} entr${(cwt2307Entries ?? []).length === 1 ? 'y' : 'ies'} — total ${formatPeso(cwtTotal.toFixed(2))}`
              : 'None'
          }
        />
        <SectionRow
          label="Prior quarterly payments"
          value={
            (priorQuarterlyPayments ?? []).length > 0
              ? `${(priorQuarterlyPayments ?? []).length} payment${(priorQuarterlyPayments ?? []).length === 1 ? '' : 's'} — total ${formatPeso(qlyTotal.toFixed(2))}`
              : 'None'
          }
        />
        {parseFloat((priorYearExcessCwt ?? '0').replace(/,/g, '')) > 0 && (
          <SectionRow label="Prior year carry-over credit" value={formatPeso(priorYearExcessCwt)} />
        )}
      </Section>

      {/* Advisory */}
      {isVatRegistered && (
        <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          <span className="font-medium">VAT-registered: </span>
          Only Paths A (Graduated) and B (OSD) will be computed. The 8% flat rate is unavailable.
        </div>
      )}
      {isBmbeRegistered && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span className="font-medium">BMBE-registered: </span>
          All paths will show ₱0 income tax due.
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">Back</Button>
        <Button onClick={onSubmit} size="lg" className="h-11 px-6 gap-2">
          <Badge variant="secondary" className="text-xs">
            Compute
          </Badge>
          See My Results
        </Button>
      </div>
    </div>
  );
}

export default WizardReview;
