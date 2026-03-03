/**
 * Scenario Comparison — Testate vs. Intestate (spec §4.8)
 *
 * Builds an alternative (intestate) input from a testate case,
 * runs the WASM engine, and computes per-heir deltas.
 */
import type { EngineInput, EngineOutput } from '@/types';
import { supabase } from './supabase';

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
  // stub — will be implemented in next iteration
  return { ...input };
}

/**
 * Calculate per-heir diffs between current and alternative outputs.
 */
export function calculateDiffs(
  currentOutput: EngineOutput,
  alternativeOutput: EngineOutput,
): ComparisonDiffEntry[] {
  // stub
  return [];
}

/**
 * Run comparison: build alternative input, compute via WASM, return diffs.
 */
export async function computeComparison(
  input: EngineInput,
  _output: EngineOutput,
): Promise<{ alternativeOutput: EngineOutput; diffs: ComparisonDiffEntry[] }> {
  // stub
  const alternativeInput = buildAlternativeInput(input);
  void alternativeInput;
  return { alternativeOutput: _output, diffs: [] };
}

/**
 * Persist comparison results to the case row.
 */
export async function saveComparisonResults(
  caseId: string,
  alternativeInput: EngineInput,
  alternativeOutput: EngineOutput,
): Promise<void> {
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
