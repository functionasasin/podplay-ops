// Stub monitoring module — full implementation in Stage 20

export function trackComputationError(
  _error: unknown,
  _context?: Record<string, unknown>
): void {
  // Stage 20: wire to Sentry
}

export function trackWasmInitError(_error: unknown): void {
  // Stage 20: wire to Sentry
}

export function trackWarning(
  _message: string,
  _context?: Record<string, unknown>
): void {
  // Stage 20: wire to Sentry
}

export function trackValidationError(
  _error: unknown,
  _context?: Record<string, unknown>
): void {
  // Stage 20: wire to Sentry
}
