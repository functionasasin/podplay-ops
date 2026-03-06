import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PercentageTaxResult } from '@/types/engine-output';

interface PercentageTaxSummaryProps {
  ptResult: PercentageTaxResult;
}

function formatPeso(value: string): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRate(value: string): string {
  const num = parseFloat(value) * 100;
  return num.toFixed(0) + '%';
}

export function PercentageTaxSummary({ ptResult }: PercentageTaxSummaryProps) {
  if (!ptResult.ptApplies) {
    return (
      <Alert>
        <AlertDescription className="text-sm text-muted-foreground">
          {ptResult.reason}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl font-normal">Percentage Tax (BIR Form 2551Q)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax Base (Gross Receipts)</span>
          <span className="tabular-nums">{formatPeso(ptResult.ptBase)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Rate</span>
          <span className="tabular-nums">{formatRate(ptResult.ptRate)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-sm font-semibold">
          <span>Percentage Tax Due</span>
          <span className="tabular-nums">{formatPeso(ptResult.ptDue)}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-1">{ptResult.reason}</p>
        {ptResult.form2551qRequired && ptResult.filingDeadline && (
          <p className="text-xs text-muted-foreground">
            Filing deadline: {ptResult.filingDeadline}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PercentageTaxSummary;
