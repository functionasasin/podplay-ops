import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { BalanceDisposition, OverpaymentDisposition, Peso } from '@/types/common';

interface BalancePayableSectionProps {
  balance: Peso;
  disposition: BalanceDisposition;
  overpayment: Peso;
  overpaymentDisposition: OverpaymentDisposition | null;
  totalItCredits: Peso;
  cwtCredits: Peso;
  quarterlyPayments: Peso;
  priorYearExcess: Peso;
}

function formatPeso(value: Peso): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DISPOSITION_LABELS: Record<BalanceDisposition, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  BALANCE_PAYABLE: { label: 'Balance Payable', variant: 'destructive' },
  ZERO_BALANCE: { label: 'Zero Balance', variant: 'secondary' },
  OVERPAYMENT: { label: 'Overpayment', variant: 'outline' },
};

const OVERPAYMENT_LABELS: Record<OverpaymentDisposition, string> = {
  CARRY_OVER: 'Carry over to next year',
  REFUND: 'Claim as refund',
  TCC: 'Apply for Tax Credit Certificate (TCC)',
  PENDING_ELECTION: 'Pending election',
};

export function BalancePayableSection({
  balance,
  disposition,
  overpayment,
  overpaymentDisposition,
  totalItCredits,
  cwtCredits,
  quarterlyPayments,
  priorYearExcess,
}: BalancePayableSectionProps) {
  const { label, variant } = DISPOSITION_LABELS[disposition];
  const hasCredits = parseFloat(totalItCredits) > 0;
  const hasOverpayment = disposition === 'OVERPAYMENT' && parseFloat(overpayment) > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Balance &amp; Credits</CardTitle>
          <Badge variant={variant} className="text-xs">{label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {hasCredits && (
          <>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tax Credits Applied</p>
            {parseFloat(cwtCredits) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Creditable Withholding Tax (CWT)</span>
                <span className="tabular-nums">({formatPeso(cwtCredits)})</span>
              </div>
            )}
            {parseFloat(quarterlyPayments) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quarterly Payments (1701Q)</span>
                <span className="tabular-nums">({formatPeso(quarterlyPayments)})</span>
              </div>
            )}
            {parseFloat(priorYearExcess) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prior Year Excess Credits</span>
                <span className="tabular-nums">({formatPeso(priorYearExcess)})</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Total Credits</span>
              <span className="tabular-nums font-medium">({formatPeso(totalItCredits)})</span>
            </div>
            <Separator />
          </>
        )}

        {disposition === 'BALANCE_PAYABLE' && (
          <div className="flex justify-between text-sm font-semibold text-destructive">
            <span>Net Balance Payable</span>
            <span className="tabular-nums">{formatPeso(balance)}</span>
          </div>
        )}

        {disposition === 'ZERO_BALANCE' && (
          <div className="flex justify-between text-sm font-semibold text-muted-foreground">
            <span>Net Balance</span>
            <span className="tabular-nums">₱0.00</span>
          </div>
        )}

        {hasOverpayment && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm font-semibold text-green-700 dark:text-green-400">
              <span>Overpayment</span>
              <span className="tabular-nums">{formatPeso(overpayment)}</span>
            </div>
            {overpaymentDisposition && (
              <p className="text-xs text-muted-foreground">
                Disposition: {OVERPAYMENT_LABELS[overpaymentDisposition]}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BalancePayableSection;
