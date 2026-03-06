import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mock fns so they are available inside vi.mock factory
const {
  mockCaptureException,
  mockCaptureMessage,
  mockSetUser,
} = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
  mockSetUser: vi.fn(),
}));

vi.mock('@sentry/react', () => ({
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
  setUser: mockSetUser,
}));

import {
  trackValidationError,
  trackComputationError,
  trackWasmInitError,
  trackWarning,
  identifyUser,
  clearUser,
} from '../monitoring';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('trackValidationError', () => {
  it('is a no-op — does NOT call Sentry (spec §17.2)', () => {
    trackValidationError('ERR_MISSING_FIELD', 'grossReceipts');
    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('accepts only a code with no fieldName', () => {
    trackValidationError('ERR_INVALID_AMOUNT');
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});

describe('trackComputationError', () => {
  it('calls Sentry.captureException with wasm_computation category tag', () => {
    const err = new Error('ASSERT_PIPELINE_FAILED');
    trackComputationError(err);
    expect(mockCaptureException).toHaveBeenCalledOnce();
    expect(mockCaptureException).toHaveBeenCalledWith(err, {
      tags: { category: 'wasm_computation' },
      extra: undefined,
    });
  });

  it('forwards extra context to Sentry', () => {
    const err = new Error('ASSERT_TAX_DUE_NEGATIVE');
    const ctx = { grossReceipts: '500000', taxYear: 2024 };
    trackComputationError(err, ctx);
    expect(mockCaptureException).toHaveBeenCalledWith(err, {
      tags: { category: 'wasm_computation' },
      extra: ctx,
    });
  });

  it('handles non-Error objects', () => {
    trackComputationError('string error', { step: 'PL-07' });
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe('trackWasmInitError', () => {
  it('calls Sentry.captureException with wasm_init category and fatal level', () => {
    const err = new Error('WASM init failed');
    trackWasmInitError(err);
    expect(mockCaptureException).toHaveBeenCalledOnce();
    expect(mockCaptureException).toHaveBeenCalledWith(err, {
      tags: { category: 'wasm_init' },
      level: 'fatal',
    });
  });

  it('handles unknown error type', () => {
    trackWasmInitError({ code: 'WASM_MISSING' });
    expect(mockCaptureException).toHaveBeenCalledOnce();
  });
});

describe('trackWarning', () => {
  it('calls Sentry.captureMessage with warning level', () => {
    trackWarning('Computation result unexpectedly null');
    expect(mockCaptureMessage).toHaveBeenCalledOnce();
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      'Computation result unexpectedly null',
      { level: 'warning', extra: undefined }
    );
  });

  it('passes extra context to Sentry', () => {
    const extra = { computationId: 'abc-123' };
    trackWarning('OSD path missing', extra);
    expect(mockCaptureMessage).toHaveBeenCalledWith('OSD path missing', {
      level: 'warning',
      extra,
    });
  });
});

describe('identifyUser', () => {
  it('calls Sentry.setUser with id and email', () => {
    identifyUser('user-uuid-123', 'user@example.com');
    expect(mockSetUser).toHaveBeenCalledOnce();
    expect(mockSetUser).toHaveBeenCalledWith({
      id: 'user-uuid-123',
      email: 'user@example.com',
    });
  });
});

describe('clearUser', () => {
  it('calls Sentry.setUser(null)', () => {
    clearUser();
    expect(mockSetUser).toHaveBeenCalledOnce();
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });
});

describe('error categorization (spec §17.2)', () => {
  it('ValidationErrors are silent — no Sentry calls', () => {
    // Simulate what would happen for every ERR_* code
    trackValidationError('ERR_GROSS_RECEIPTS_REQUIRED');
    trackValidationError('ERR_TAXPAYER_TYPE_INVALID');
    trackValidationError('ERR_TAX_YEAR_OUT_OF_RANGE');
    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('ComputeErrors and WasmInitErrors are sent to Sentry', () => {
    trackComputationError(new Error('ASSERT_RECOMMENDED_PATH_NULL'));
    trackWasmInitError(new Error('WebAssembly is not defined'));
    expect(mockCaptureException).toHaveBeenCalledTimes(2);
  });
});
