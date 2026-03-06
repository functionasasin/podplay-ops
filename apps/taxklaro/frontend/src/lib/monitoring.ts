import * as Sentry from '@sentry/react';

// spec §17.2: ValidationErrors are NOT sent to Sentry — noise
export function trackValidationError(_code: string, _fieldName?: string): void { /* no-op */ }

export function trackComputationError(error: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(error, { tags: { category: 'wasm_computation' }, extra: context });
}

export function trackWasmInitError(error: unknown): void {
  Sentry.captureException(error, { tags: { category: 'wasm_init' }, level: 'fatal' });
}

export function trackWarning(message: string, extra?: Record<string, unknown>): void {
  Sentry.captureMessage(message, { level: 'warning', extra });
}

export function identifyUser(userId: string, email: string): void {
  Sentry.setUser({ id: userId, email });
}

export function clearUser(): void {
  Sentry.setUser(null);
}
