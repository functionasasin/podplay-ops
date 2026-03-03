/**
 * AssetSummaryStep — Step 5: Asset Summary (§4.18)
 * Stub — implementation in next iteration.
 */

import type { AssetSummaryStepState } from '@/types/intake';

export interface AssetSummaryStepProps {
  state: AssetSummaryStepState;
  onStateChange: (state: AssetSummaryStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AssetSummaryStep(_props: AssetSummaryStepProps) {
  return <div data-testid="asset-summary-step">Asset summary step stub</div>;
}
