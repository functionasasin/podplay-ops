/**
 * Scenario Comparison — Testate vs. Intestate (spec §4.8)
 *
 * Builds an alternative (intestate) input from a testate case,
 * runs the WASM engine, and computes per-heir deltas.
 */
import type { EngineInput, EngineOutput } from '@/types';
import { compute } from '@/wasm/bridge';

// ── Types ───────────────────────────────────────────────────────────────────

export type ComparisonState = 'idle' | 'loading' | 'error' | 'ready';

export interface ComparisonDiffEntry {
  heir_id: string;
  heir_name: string;
  current_centavos: bigint;
  alternative_centavos: bigint;
  delta_centavos: bigint;
  delta_pct: number; // positive = gain under current will, negative = loss
}

// ── Core functions ──────────────────────────────────────────────────────────

/**
 * Strip the will from a testate input to produce an intestate alternative.
 */
export function buildAlternativeInput(input: EngineInput): EngineInput {
  return { ...input, will: null };
}

/**
 * Calculate per-heir diffs between current and alternative outputs.
 */
export function calculateDiffs(
  currentOutput: EngineOutput,
  alternativeOutput: EngineOutput,
): ComparisonDiffEntry[] {
  // Build a lookup of alternative shares by heir_id
  const altShareMap = new Map<string, bigint>();
  for (const share of alternativeOutput.per_heir_shares) {
    altShareMap.set(share.heir_id, BigInt(share.total.centavos));
  }

  return currentOutput.per_heir_shares.map((share) => {
    const currentCentavos = BigInt(share.total.centavos);
    const alternativeCentavos = altShareMap.get(share.heir_id) ?? BigInt(0);
    const deltaCentavos = currentCentavos - alternativeCentavos;

    // delta_pct: (current - alternative) / alternative * 100
    // Special case: if alternative is 0 and current > 0, that's +100% (heir only exists under will)
    // If both are 0, delta_pct is 0
    let deltaPct: number;
    if (alternativeCentavos === BigInt(0)) {
      deltaPct = currentCentavos > BigInt(0) ? 100 : 0;
    } else {
      deltaPct = Number(deltaCentavos * BigInt(10000) / alternativeCentavos) / 100;
    }

    return {
      heir_id: share.heir_id,
      heir_name: share.heir_name,
      current_centavos: currentCentavos,
      alternative_centavos: alternativeCentavos,
      delta_centavos: deltaCentavos,
      delta_pct: deltaPct,
    };
  });
}

/**
 * Run comparison: build alternative input, compute via WASM, return diffs.
 */
export async function computeComparison(
  input: EngineInput,
  currentOutput: EngineOutput,
): Promise<{ alternativeOutput: EngineOutput; diffs: ComparisonDiffEntry[] }> {
  const alternativeInput = buildAlternativeInput(input);
  const alternativeOutput = await compute(alternativeInput);
  const diffs = calculateDiffs(currentOutput, alternativeOutput);
  return { alternativeOutput, diffs };
}

/**
 * Persist comparison results to the case row.
 */
export async function saveComparisonResults(
  caseId: string,
  alternativeInput: EngineInput,
  alternativeOutput: EngineOutput,
): Promise<void> {
  const { supabase } = await import('./supabase');
  const { error } = await supabase
    .from('cases')
    .update({
      comparison_input_json: alternativeInput,
      comparison_output_json: alternativeOutput,
      comparison_ran_at: new Date().toISOString(),
    })
    .eq('id', caseId);

  if (error) throw error;
}
