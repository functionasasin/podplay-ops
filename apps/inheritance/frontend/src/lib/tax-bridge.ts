/**
 * Tax Bridge — BIR Form 1801 Integration (spec §4.9)
 *
 * Bridge formula: net_distributable_estate = max(0, item40_gross_estate - item44_total_deductions)
 * Re-runs inheritance engine with bridged value when tax output changes.
 */
import type { EngineInput, EngineOutput } from '@/types';

// ── Types ───────────────────────────────────────────────────────────────────

/** Minimal estate tax engine output used by the bridge formula. */
export interface EstateTaxEngineOutput {
  item40_gross_estate: number; // centavos
  item44_total_deductions: number; // centavos
  tax_due: number; // centavos
  surcharges: number; // centavos
  interest: number; // centavos
  compromise_penalty: number; // centavos
  total_amount_due: number; // centavos
  schedules: EstateTaxScheduleSummary;
}

export interface EstateTaxScheduleSummary {
  schedule1_real_properties: number; // centavos
  schedule2_personal_properties: number; // centavos
  schedule3_taxable_transfers: number; // centavos
  schedule4_claims_deductions: number; // centavos
  schedule5_other_deductions: number; // centavos
  schedule6_net_share_spouse: number; // centavos
}

export type TaxBridgeState = 'idle' | 'computing' | 'ready' | 'error';

export interface TaxBridgeResult {
  netDistributableEstate: number; // centavos
  bridgedInput: EngineInput;
  bridgedOutput: EngineOutput;
}

// ── Core functions ──────────────────────────────────────────────────────────

/**
 * Bridge formula: max(0, gross_estate - total_deductions).
 * Returns net distributable estate in centavos.
 */
export function computeNetDistributableEstate(
  item40GrossEstate: number,
  item44TotalDeductions: number,
): number {
  return Math.max(0, item40GrossEstate - item44TotalDeductions);
}

/**
 * Build a bridged EngineInput with updated net_distributable_estate from tax output.
 */
export function buildBridgedInput(
  inheritanceInput: EngineInput,
  netDistributableEstateCentavos: number,
): EngineInput {
  return {
    ...inheritanceInput,
    net_distributable_estate: { centavos: netDistributableEstateCentavos },
  };
}

/**
 * Full bridge: extract net estate from tax output, build bridged input, run engine.
 */
export async function runTaxBridge(
  inheritanceInput: EngineInput,
  taxOutput: EstateTaxEngineOutput,
): Promise<{ bridgedInput: EngineInput; bridgedOutput: EngineOutput }> {
  const { compute } = await import('@/wasm/bridge');
  const netEstate = computeNetDistributableEstate(
    taxOutput.item40_gross_estate,
    taxOutput.item44_total_deductions,
  );
  const bridgedInput = buildBridgedInput(inheritanceInput, netEstate);
  const bridgedOutput = await compute(bridgedInput);
  return { bridgedInput, bridgedOutput };
}

/**
 * Persist tax output to the case row.
 */
export async function saveTaxOutput(
  caseId: string,
  taxOutput: EstateTaxEngineOutput,
): Promise<void> {
  const { supabase } = await import('./supabase');
  const { error } = await supabase
    .from('cases')
    .update({ tax_output_json: taxOutput })
    .eq('id', caseId);

  if (error) throw error;
}

/**
 * Build the bridge note text for PDF.
 */
export function buildBridgeNoteText(netDistributableEstateCentavos: number): string {
  const pesos = netDistributableEstateCentavos / 100;
  const formatted = pesos.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Estate tax net distributable estate of ₱${formatted} has been applied to the inheritance computation.`;
}
