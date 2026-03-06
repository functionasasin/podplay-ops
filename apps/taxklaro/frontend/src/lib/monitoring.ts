// Stub monitoring module — full implementation in Stage 20

export function trackValidationError(_code: string, _fieldName?: string): void {
  // no-op — spec §17.2: validation errors are NOT sent to Sentry
}

export function trackComputationError(_error: unknown, _context?: Record<string, unknown>): void {
  // Stage 20: wire to Sentry
}

export function trackWasmInitError(_error: unknown): void {
  // Stage 20: wire to Sentry
}

export function trackWarning(_message: string, _extra?: Record<string, unknown>): void {
  // Stage 20: wire to Sentry
}

export function identifyUser(_userId: string, _email: string): void {
  // Stage 20: wire to Sentry
}

export function clearUser(): void {
  // Stage 20: wire to Sentry
}
