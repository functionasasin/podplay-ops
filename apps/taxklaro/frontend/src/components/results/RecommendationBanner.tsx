import type { RegimePath } from '@/types/common';
import type { Peso } from '@/types/common';

interface RecommendationBannerProps {
  recommendedRegime: RegimePath;
  savingsVsWorst: Peso;
  savingsVsNextBest: Peso;
  usingLockedRegime: boolean;
}

export function RecommendationBanner(_props: RecommendationBannerProps) {
  return null;
}

export default RecommendationBanner;
