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
    <Card className="border-green-500/50 bg-green-50/60 shadow-md dark:bg-green-900/10">
      <CardContent className="pt-6 pb-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs px-2.5">
              {usingLockedRegime ? 'Elected Regime' : 'Recommended'}
            </Badge>
            <span className="font-semibold text-green-800 dark:text-green-300 text-[0.9375rem]">
              {REGIME_LABELS[recommendedRegime]}
            </span>
          </div>

          {!usingLockedRegime && savings > 0 && (
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-green-700 dark:text-green-400">
                You save vs. highest-tax option:
              </p>
              <p className="font-display text-2xl text-green-800 dark:text-green-300 tabular-nums">
                {formatPeso(savingsVsWorst)}
              </p>
              {nextBestSavings > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatPeso(savingsVsNextBest)} vs. next best option
                </p>
              )}
            </div>
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
