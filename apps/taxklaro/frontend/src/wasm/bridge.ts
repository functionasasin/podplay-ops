import type { TaxpayerInput } from '@/types/engine-input';
import type { TaxComputationResult } from '@/types/engine-output';
import type { WasmResult } from '@/types/common';
import { trackComputationError, trackWasmInitError, trackWarning } from '@/lib/monitoring';

let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      // Dynamic import — works with vite-plugin-wasm
      const { default: init } = await import('./pkg/taxklaro_engine.js');
      await init();
    } catch (e) {
      trackWasmInitError(e);
      initPromise = null; // Allow retry on next call
      throw e;
    }
  })();
  return initPromise;
}

export async function computeTax(
  input: TaxpayerInput
): Promise<WasmResult<TaxComputationResult>> {
  await ensureInit();

  const startMs = performance.now();

  try {
    const { compute_json } = await import('./pkg/taxklaro_engine.js');
    const resultJson = compute_json(JSON.stringify(input));
    const result = JSON.parse(resultJson) as WasmResult<TaxComputationResult>;

    const durationMs = performance.now() - startMs;
    if (durationMs > 500) {
      trackWarning('Slow WASM computation', { durationMs, taxYear: input.taxYear });
    }

    return result;
  } catch (e) {
    trackComputationError(e, { taxYear: input.taxYear });
    return {
      status: 'error',
      errors: [{
        code: 'WASM_PANIC',
        message: 'Internal computation error. This has been reported.',
        field: null,
        severity: 'ERROR',
      }],
    };
  }
}

export async function validateInput(
  input: TaxpayerInput
): Promise<WasmResult<{ errors: unknown[] }>> {
  await ensureInit();
  try {
    const { validate_json } = await import('./pkg/taxklaro_engine.js');
    const resultJson = validate_json(JSON.stringify(input));
    return JSON.parse(resultJson);
  } catch (e) {
    trackComputationError(e);
    return { status: 'error', errors: [] };
  }
}
