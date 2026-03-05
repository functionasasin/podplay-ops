import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { EngineInput, EngineOutput, Money, Person } from '@/types';
import type { EstateTaxEngineOutput } from '@/lib/tax-bridge';

// ── Mock WASM compute ───────────────────────────────────────────────────────

const mockCompute = vi.fn();

vi.mock('@/wasm/bridge', () => ({
  compute: (...args: unknown[]) => mockCompute(...args),
}));

import { useTaxBridge } from '../useTaxBridge';

// ── Test helpers ────────────────────────────────────────────────────────────

function zeroMoney(): Money {
  return { centavos: 0 };
}

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'lc1',
    name: 'Maria dela Cruz',
    is_alive_at_succession: true,
    relationship_to_decedent: 'LegitimateChild',
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: null,
    is_guilty_party_in_legal_separation: false,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    ...overrides,
  };
}

function createTestInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    net_distributable_estate: { centavos: 500000000 }, // ₱5,000,000
    decedent: {
      id: 'd',
      name: 'Juan dela Cruz',
      date_of_death: '2024-03-15',
      is_married: true,
      date_of_marriage: '2000-06-15',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 24,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [
      makePerson({ id: 'lc1', name: 'Maria dela Cruz' }),
      makePerson({
        id: 'sp',
        name: 'Cora Reyes',
        relationship_to_decedent: 'SurvivingSpouse',
      }),
    ],
    will: null,
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function createTaxOutput(overrides: Partial<EstateTaxEngineOutput> = {}): EstateTaxEngineOutput {
  return {
    item40_gross_estate: 500000000, // ₱5,000,000
    item44_total_deductions: 300000000, // ₱3,000,000
    tax_due: 12000000,
    surcharges: 0,
    interest: 0,
    compromise_penalty: 0,
    total_amount_due: 12000000,
    schedules: {
      schedule1_real_properties: 300000000,
      schedule2_personal_properties: 150000000,
      schedule3_taxable_transfers: 50000000,
      schedule4_claims_deductions: 100000000,
      schedule5_other_deductions: 50000000,
      schedule6_net_share_spouse: 0,
    },
    ...overrides,
  };
}

function createBridgedOutput(): EngineOutput {
  return {
    per_heir_shares: [
      {
        heir_id: 'lc1',
        heir_name: 'Maria dela Cruz',
        heir_category: 'LegitimateChildGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: { centavos: 100000000 },
        total: { centavos: 100000000 },
        legitime_fraction: '',
        legal_basis: ['Art.980'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 100000000 },
        net_from_estate: { centavos: 100000000 },
      },
      {
        heir_id: 'sp',
        heir_name: 'Cora Reyes',
        heir_category: 'SurvivingSpouseGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: { centavos: 100000000 },
        total: { centavos: 100000000 },
        legitime_fraction: '',
        legal_basis: ['Art.996'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 100000000 },
        net_from_estate: { centavos: 100000000 },
      },
    ],
    narratives: [],
    computation_log: {
      steps: [{ step_number: 10, step_name: 'Finalize', description: 'Done' }],
      total_restarts: 0,
      final_scenario: 'I2',
    },
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I2',
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useTaxBridge hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state is idle when no tax output provided', () => {
    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput: null,
      }),
    );

    expect(result.current.state).toBe('idle');
    expect(result.current.bridgedInput).toBeNull();
    expect(result.current.bridgedOutput).toBeNull();
    expect(result.current.netDistributableEstate).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('triggers computation when tax output is provided', async () => {
    const bridgedOutput = createBridgedOutput();
    mockCompute.mockResolvedValue(bridgedOutput);

    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput: createTaxOutput(),
      }),
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    expect(mockCompute).toHaveBeenCalledTimes(1);
  });

  it('returns bridged output after computation', async () => {
    const bridgedOutput = createBridgedOutput();
    mockCompute.mockResolvedValue(bridgedOutput);

    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput: createTaxOutput(),
      }),
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    expect(result.current.bridgedOutput).toEqual(bridgedOutput);
  });

  it('computes correct net distributable estate', async () => {
    mockCompute.mockResolvedValue(createBridgedOutput());

    const taxOutput = createTaxOutput({
      item40_gross_estate: 500000000, // ₱5,000,000
      item44_total_deductions: 300000000, // ₱3,000,000
    });

    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput,
      }),
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    // max(0, 500000000 - 300000000) = 200000000
    expect(result.current.netDistributableEstate).toBe(200000000);
  });

  it('passes bridged input with updated estate to WASM engine', async () => {
    mockCompute.mockResolvedValue(createBridgedOutput());

    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput: createTaxOutput(),
      }),
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    const calledWith = mockCompute.mock.calls[0][0] as EngineInput;
    expect(calledWith.net_distributable_estate.centavos).toBe(200000000);
  });

  it('sets error state when WASM engine fails', async () => {
    mockCompute.mockRejectedValue(new Error('WASM engine error'));

    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput: createTaxOutput(),
      }),
    );

    await waitFor(() => {
      expect(result.current.state).toBe('error');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('WASM engine error');
  });

  it('calls onBridgedResult callback when computation completes', async () => {
    const bridgedOutput = createBridgedOutput();
    mockCompute.mockResolvedValue(bridgedOutput);
    const onBridgedResult = vi.fn();

    renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput: createTaxOutput(),
        onBridgedResult,
      }),
    );

    await waitFor(() => {
      expect(onBridgedResult).toHaveBeenCalledTimes(1);
    });

    const [bridgedInput, bridgedOut] = onBridgedResult.mock.calls[0];
    expect(bridgedInput.net_distributable_estate.centavos).toBe(200000000);
    expect(bridgedOut).toEqual(bridgedOutput);
  });

  it('recomputes when taxOutput changes', async () => {
    mockCompute.mockResolvedValue(createBridgedOutput());

    const initialTaxOutput = createTaxOutput({
      item40_gross_estate: 500000000,
      item44_total_deductions: 300000000,
    });

    const { result, rerender } = renderHook(
      ({ taxOutput }) =>
        useTaxBridge({
          inheritanceInput: createTestInput(),
          taxOutput,
        }),
      { initialProps: { taxOutput: initialTaxOutput } },
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });
    expect(result.current.netDistributableEstate).toBe(200000000);

    const updatedTaxOutput = createTaxOutput({
      item40_gross_estate: 800000000,
      item44_total_deductions: 200000000,
    });

    rerender({ taxOutput: updatedTaxOutput });

    await waitFor(() => {
      expect(result.current.netDistributableEstate).toBe(600000000);
    });
  });

  it('resets to idle when taxOutput becomes null', async () => {
    mockCompute.mockResolvedValue(createBridgedOutput());

    const { result, rerender } = renderHook(
      ({ taxOutput }) =>
        useTaxBridge({
          inheritanceInput: createTestInput(),
          taxOutput,
        }),
      { initialProps: { taxOutput: createTaxOutput() as EstateTaxEngineOutput | null } },
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    rerender({ taxOutput: null });

    await waitFor(() => {
      expect(result.current.state).toBe('idle');
    });
    expect(result.current.bridgedInput).toBeNull();
    expect(result.current.bridgedOutput).toBeNull();
    expect(result.current.netDistributableEstate).toBeNull();
  });

  it('supports manual recompute', async () => {
    mockCompute.mockResolvedValue(createBridgedOutput());

    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput: createTaxOutput(),
      }),
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    mockCompute.mockClear();

    await act(async () => {
      await result.current.recompute();
    });

    expect(mockCompute).toHaveBeenCalledTimes(1);
  });

  it('handles zero net estate from bridge formula', async () => {
    mockCompute.mockResolvedValue(createBridgedOutput());

    const taxOutput = createTaxOutput({
      item40_gross_estate: 100000000,
      item44_total_deductions: 500000000,
    });

    const { result } = renderHook(() =>
      useTaxBridge({
        inheritanceInput: createTestInput(),
        taxOutput,
      }),
    );

    await waitFor(() => {
      expect(result.current.state).toBe('ready');
    });

    expect(result.current.netDistributableEstate).toBe(0);
    const calledWith = mockCompute.mock.calls[0][0] as EngineInput;
    expect(calledWith.net_distributable_estate.centavos).toBe(0);
  });
});
