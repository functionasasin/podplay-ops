import { useState } from 'react';
import type { TaxpayerInput } from '@/types/engine-input';
import type { TaxComputationResult } from '@/types/engine-output';
import type { EngineError, WasmResult } from '@/types/common';
import { computeTax } from '@/wasm/bridge';

export function useCompute() {
  const [result, setResult] = useState<TaxComputationResult | null>(null);
  const [errors, setErrors] = useState<EngineError[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  async function runCompute(input: TaxpayerInput): Promise<WasmResult<TaxComputationResult>> {
    setIsComputing(true);
    const wasmResult = await computeTax(input);
    if (wasmResult.status === 'ok') {
      setResult(wasmResult.data);
      setErrors([]);
    } else {
      setResult(null);
      setErrors(wasmResult.errors);
    }
    setIsComputing(false);
    return wasmResult;
  }

  return { result, errors, isComputing, runCompute };
}
