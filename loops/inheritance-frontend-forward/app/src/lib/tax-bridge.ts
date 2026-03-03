/**
 * Tax Bridge — BIR Form 1801 Integration (spec §4.9)
 *
 * Bridge formula: net_distributable_estate = max(0, item40_gross_estate - item44_total_deductions)
 * Re-runs the inheritance engine with the bridged value.
 */
import type { EngineInput, EngineOutput } from '@/types';

// ── Types ───────────────────────────────────────────────────────────────────

export interface EstateTaxOutput {
  item40_gross_estate: number;
  item44_total_deductions: number;
  tax_due: number;
  surcharges: number;
  schedules: Record<string, number>;
}

export interface TaxBridgeResult {
  net_distributable_estate: number;
  bridged_input: EngineInput;
  bridged_output: EngineOutput | null;
}

// ── Bridge Formula ──────────────────────────────────────────────────────────

/**
 * Compute net distributable estate from estate tax output.
 * Formula: max(0, item40_gross_estate - item44_total_deductions)
 */
export function computeNetDistributableEstate(
  item40_gross_estate: number,
  item44_total_deductions: number,
): number {
  return Math.max(0, item40_gross_estate - item44_total_deductions);
}

/**
 * Build bridged EngineInput by replacing net_distributable_estate
 * with the value derived from estate tax computation.
 */
export function buildBridgedInput(
  inheritanceInput: EngineInput,
  taxOutput: EstateTaxOutput,
): EngineInput {
  const net = computeNetDistributableEstate(
    taxOutput.item40_gross_estate,
    taxOutput.item44_total_deductions,
  );
  return {
    ...inheritanceInput,
    net_distributable_estate: { centavos: net },
  };
}

/**
 * Run the full tax bridge: compute bridged input and re-run inheritance engine.
 */
export async function runTaxBridge(
  inheritanceInput: EngineInput,
  taxOutput: EstateTaxOutput,
): Promise<TaxBridgeResult> {
  const { compute } = await import('@/wasm/bridge');
  const bridgedInput = buildBridgedInput(inheritanceInput, taxOutput);
  const net = computeNetDistributableEstate(
    taxOutput.item40_gross_estate,
    taxOutput.item44_total_deductions,
  );
  const bridgedOutput = await compute(bridgedInput);
  return {
    net_distributable_estate: net,
    bridged_input: bridgedInput,
    bridged_output: bridgedOutput,
  };
}

/**
 * Persist tax bridge results to the case row.
 */
export async function saveTaxBridgeResults(
  caseId: string,
  taxOutput: EstateTaxOutput,
  bridgedOutput: EngineOutput,
): Promise<void> {
  const { supabase } = await import('./supabase');
  const { error } = await supabase
    .from('cases')
    .update({
      tax_output_json: taxOutput,
      output_json: bridgedOutput,
    })
    .eq('id', caseId);

  if (error) throw error;
}
