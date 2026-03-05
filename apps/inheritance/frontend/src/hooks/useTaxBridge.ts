/**
 * useTaxBridge — Hook to re-run inheritance engine when tax output changes.
 *
 * Spec: §4.9
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EngineInput, EngineOutput } from '@/types';
import type { EstateTaxEngineOutput, TaxBridgeState } from '@/lib/tax-bridge';
import {
  computeNetDistributableEstate,
  buildBridgedInput,
} from '@/lib/tax-bridge';

export interface UseTaxBridgeOptions {
  inheritanceInput: EngineInput;
  taxOutput: EstateTaxEngineOutput | null;
  onBridgedResult?: (bridgedInput: EngineInput, bridgedOutput: EngineOutput) => void;
}

export interface UseTaxBridgeReturn {
  state: TaxBridgeState;
  bridgedInput: EngineInput | null;
  bridgedOutput: EngineOutput | null;
  netDistributableEstate: number | null;
  error: Error | null;
  recompute: () => Promise<void>;
}

export function useTaxBridge({
  inheritanceInput,
  taxOutput,
  onBridgedResult,
}: UseTaxBridgeOptions): UseTaxBridgeReturn {
  const [state, setState] = useState<TaxBridgeState>('idle');
  const [bridgedInput, setBridgedInput] = useState<EngineInput | null>(null);
  const [bridgedOutput, setBridgedOutput] = useState<EngineOutput | null>(null);
  const [netDistributableEstate, setNetDistributableEstate] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Use refs to avoid stale closures and re-render loops
  const inheritanceInputRef = useRef(inheritanceInput);
  inheritanceInputRef.current = inheritanceInput;
  const taxOutputRef = useRef(taxOutput);
  taxOutputRef.current = taxOutput;
  const callbackRef = useRef(onBridgedResult);
  callbackRef.current = onBridgedResult;

  const recompute = useCallback(async () => {
    const currentTaxOutput = taxOutputRef.current;
    const currentInput = inheritanceInputRef.current;

    if (!currentTaxOutput) {
      setState('idle');
      setBridgedInput(null);
      setBridgedOutput(null);
      setNetDistributableEstate(null);
      return;
    }

    setState('computing');
    setError(null);

    try {
      const { compute } = await import('@/wasm/bridge');
      const netEstate = computeNetDistributableEstate(
        currentTaxOutput.item40_gross_estate,
        currentTaxOutput.item44_total_deductions,
      );
      setNetDistributableEstate(netEstate);

      const newBridgedInput = buildBridgedInput(currentInput, netEstate);
      setBridgedInput(newBridgedInput);

      const newBridgedOutput = await compute(newBridgedInput);
      setBridgedOutput(newBridgedOutput);

      setState('ready');
      callbackRef.current?.(newBridgedInput, newBridgedOutput);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setState('error');
    }
  }, []);

  // Derive a stable key from tax output to trigger recompute
  const taxOutputKey = taxOutput
    ? `${taxOutput.item40_gross_estate}-${taxOutput.item44_total_deductions}`
    : null;

  useEffect(() => {
    recompute();
  }, [taxOutputKey, recompute]);

  return {
    state,
    bridgedInput,
    bridgedOutput,
    netDistributableEstate,
    error,
    recompute,
  };
}
