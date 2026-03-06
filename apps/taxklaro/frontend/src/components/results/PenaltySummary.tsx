import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { PenaltyResult } from '@/types/engine-output';

interface PenaltySummaryProps {
  penalties: PenaltyResult;
}

function formatPeso(value: string): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PenaltySummary({ penalties }: PenaltySummaryProps) {
  if (!penalties.applies) {
    return (
      <Alert>
        <AlertDescription className="text-sm text-muted-foreground">
          No late filing penalties apply. Filing is on time.
        </AlertDescription>
      </Alert>
    );
  }

  const { itPenalties, ptPenalties, totalPenalties, daysLate, monthsLate } = penalties;
  const hasPtPenalties = parseFloat(ptPenalties.total) > 0;

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-destructive">
          Late Filing Penalties
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {daysLate} day{daysLate !== 1 ? 's' : ''} late ({monthsLate} month{monthsLate !== 1 ? 's' : ''})
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Income Tax Penalties</p>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Surcharge (25%)</span>
              <span className="tabular-nums">{formatPeso(itPenalties.surcharge)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Interest (12% p.a.)</span>
              <span className="tabular-nums">{formatPeso(itPenalties.interest)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compromise Penalty</span>
              <span className="tabular-nums">{formatPeso(itPenalties.compromise)}</span>
            </div>
          </div>
        </div>

        {hasPtPenalties && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Percentage Tax Penalties</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Surcharge</span>
                <span className="tabular-nums">{formatPeso(ptPenalties.surcharge)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interest</span>
                <span className="tabular-nums">{formatPeso(ptPenalties.interest)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Compromise</span>
                <span className="tabular-nums">{formatPeso(ptPenalties.compromise)}</span>
              </div>
            </div>
          </div>
        )}

        <Separator />
        <div className="flex justify-between text-sm font-semibold text-destructive">
          <span>Total Penalties</span>
          <span className="tabular-nums">{formatPeso(totalPenalties)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default PenaltySummary;
