import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Peso } from '@/types/common';

interface InstallmentSectionProps {
  installmentEligible: boolean;
  installmentFirstDue: Peso;
  installmentSecondDue: Peso;
}

function formatPeso(value: Peso): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InstallmentSection({
  installmentEligible,
  installmentFirstDue,
  installmentSecondDue,
}: InstallmentSectionProps) {
  if (!installmentEligible) {
    return (
      <Alert>
        <AlertDescription className="text-sm text-muted-foreground">
          Installment payment not applicable (balance due is ₱2,000 or less, or no balance payable).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl font-normal">Installment Payment Schedule</CardTitle>
        <p className="text-sm text-muted-foreground">
          Balance exceeds ₱2,000 — eligible for 2-installment payment
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <div>
            <span className="font-medium">1st Installment</span>
            <p className="text-xs text-muted-foreground">Due: April 15</p>
          </div>
          <span className="tabular-nums font-medium">{formatPeso(installmentFirstDue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <div>
            <span className="font-medium">2nd Installment</span>
            <p className="text-xs text-muted-foreground">Due: July 15</p>
          </div>
          <span className="tabular-nums font-medium">{formatPeso(installmentSecondDue)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default InstallmentSection;
