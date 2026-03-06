import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RegimePath } from '@/types/common';
import type { RegimeOption } from '@/types/engine-output';

interface RegimeComparisonTableProps {
  comparison: RegimeOption[];
  recommendedRegime: RegimePath;
  selectedPath: RegimePath;
}

function formatPeso(value: string): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRate(value: string): string {
  const num = parseFloat(value) * 100;
  return num.toFixed(2) + '%';
}

export function RegimeComparisonTable({
  comparison,
  recommendedRegime,
  selectedPath,
}: RegimeComparisonTableProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-xl font-normal">Regime Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2.5 pr-4 font-medium">Regime</th>
                <th className="text-right py-2.5 px-2 font-medium">Income Tax</th>
                <th className="text-right py-2.5 px-2 font-medium">PT</th>
                <th className="text-right py-2.5 pl-2 font-medium">Total</th>
                <th className="text-right py-2.5 pl-2 font-medium">Eff. Rate</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((opt) => {
                const isRecommended = opt.path === recommendedRegime;
                const isSelected = opt.path === selectedPath;
                return (
                  <tr
                    key={opt.path}
                    className={`border-b last:border-0 transition-colors ${
                      isRecommended
                        ? 'bg-green-50/70 dark:bg-green-900/10'
                        : isSelected
                        ? 'bg-muted/40'
                        : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex flex-col gap-1">
                        <span className={isSelected || isRecommended ? 'font-semibold' : ''}>{opt.label}</span>
                        <div className="flex gap-1 flex-wrap">
                          {isRecommended && (
                            <Badge className="text-xs bg-green-600 hover:bg-green-700 text-white py-0">
                              Recommended
                            </Badge>
                          )}
                          {isSelected && !isRecommended && (
                            <Badge variant="secondary" className="text-xs py-0">Selected</Badge>
                          )}
                          {opt.requiresDocumentation && (
                            <Badge variant="outline" className="text-xs py-0">Docs required</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2 tabular-nums">{formatPeso(opt.incomeTaxDue)}</td>
                    <td className="text-right py-3 px-2 tabular-nums">{formatPeso(opt.percentageTaxDue)}</td>
                    <td className={`text-right py-3 pl-2 tabular-nums font-semibold ${isRecommended ? 'text-green-800 dark:text-green-300' : ''}`}>
                      {formatPeso(opt.totalTaxBurden)}
                    </td>
                    <td className="text-right py-3 pl-2 tabular-nums text-muted-foreground">{formatRate(opt.effectiveRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default RegimeComparisonTable;
