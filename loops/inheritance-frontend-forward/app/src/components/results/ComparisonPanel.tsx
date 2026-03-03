/**
 * ComparisonPanel — Side-by-side testate vs intestate comparison (spec §4.8).
 *
 * Only shown when the current case is testate (input.will !== null).
 * Runs the WASM engine on an intestate alternative and displays per-heir deltas.
 */
import type { EngineInput, EngineOutput } from '@/types';
import type { ComparisonState, ComparisonDiffEntry } from '@/lib/comparison';

export interface ComparisonPanelProps {
  input: EngineInput;
  output: EngineOutput;
  caseId?: string;
}

export function ComparisonPanel(_props: ComparisonPanelProps) {
  // stub — will be implemented in next iteration
  return null;
}
