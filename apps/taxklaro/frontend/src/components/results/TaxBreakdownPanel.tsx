import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Peso, RegimePath } from '@/types/common';

interface TaxBreakdownPanelProps {
  selectedPath: RegimePath;
  selectedIncomeTaxDue: Peso;
  selectedPercentageTaxDue: Peso;
  selectedTotalTax: Peso;
}

const PATH_LABELS: Record<RegimePath, string> = {
  PATH_A: 'Path A — Graduated + Itemized',
  PATH_B: 'Path B — Graduated + OSD (40%)',
  PATH_C: 'Path C — 8% Flat Rate',
};

function formatPeso(value: Peso): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function TaxBreakdownPanel({
  selectedPath,
  selectedIncomeTaxDue,
  selectedPercentageTaxDue,
  selectedTotalTax,
}: TaxBreakdownPanelProps) {
  const ptDue = parseFloat(selectedPercentageTaxDue);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Tax Breakdown</CardTitle>
        <p className="text-xs text-muted-foreground">{PATH_LABELS[selectedPath]}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Income Tax Due</span>
          <span className="font-medium tabular-nums">{formatPeso(selectedIncomeTaxDue)}</span>
        </div>
        {ptDue > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Percentage Tax (3%)</span>
            <span className="font-medium tabular-nums">{formatPeso(selectedPercentageTaxDue)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-sm font-semibold">
          <span>Total Tax Burden</span>
          <span className="tabular-nums">{formatPeso(selectedTotalTax)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaxBreakdownPanel;
