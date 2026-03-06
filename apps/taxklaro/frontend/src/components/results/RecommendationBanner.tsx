import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Peso, RegimePath } from '@/types/common';

interface RecommendationBannerProps {
  recommendedRegime: RegimePath;
  savingsVsWorst: Peso;
  savingsVsNextBest: Peso;
  usingLockedRegime: boolean;
}

const REGIME_LABELS: Record<RegimePath, string> = {
  PATH_A: 'Path A — Graduated + Itemized Deductions',
  PATH_B: 'Path B — Graduated + OSD (40%)',
  PATH_C: 'Path C — 8% Flat Rate',
};

function formatPeso(value: Peso): string {
  const num = parseFloat(value);
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RecommendationBanner({
  recommendedRegime,
  savingsVsWorst,
  savingsVsNextBest,
  usingLockedRegime,
}: RecommendationBannerProps) {
  const savings = parseFloat(savingsVsWorst);
  const nextBestSavings = parseFloat(savingsVsNextBest);

  return (
    <Card className="border-green-500/60 bg-green-50/50 dark:bg-green-900/10">
      <CardContent className="pt-5 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
              {usingLockedRegime ? 'Elected Regime' : 'Recommended'}
            </Badge>
            <span className="font-semibold text-green-800 dark:text-green-300">
              {REGIME_LABELS[recommendedRegime]}
            </span>
          </div>

          {!usingLockedRegime && savings > 0 && (
            <p className="text-sm text-green-700 dark:text-green-400">
              Save {formatPeso(savingsVsWorst)} vs. highest-tax option
              {nextBestSavings > 0 && (
                <span className="text-muted-foreground">
                  {' '}({formatPeso(savingsVsNextBest)} vs. next best)
                </span>
              )}
            </p>
          )}

          {usingLockedRegime && (
            <p className="text-sm text-muted-foreground">
              Regime locked by prior-year election. Results shown for elected regime.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default RecommendationBanner;
