/**
 * WASM Bridge — mock implementation for UI development.
 * Real WASM integration will replace this in Stage 12.
 *
 * Source of truth:
 *   - engine-output.md (EngineOutput shape)
 *   - scenario-field-mapping.md (scenario prediction logic)
 */

import type { EngineInput, EngineOutput } from "../types";

/**
 * Compute inheritance distribution from the given input.
 * Currently a mock — validates input, predicts scenario, returns synthetic output.
 */
export async function compute(_input: EngineInput): Promise<EngineOutput> {
  // Stub — will be implemented in the next iteration
  throw new Error("Not implemented");
}
