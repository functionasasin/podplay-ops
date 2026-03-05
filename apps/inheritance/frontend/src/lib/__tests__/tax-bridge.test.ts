import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EngineInput, EngineOutput, Money, Person } from '@/types';
import {
  computeNetDistributableEstate,
  buildBridgedInput,
  runTaxBridge,
  saveTaxOutput,
  buildBridgeNoteText,
} from '../tax-bridge';
import type { EstateTaxEngineOutput, EstateTaxScheduleSummary } from '../tax-bridge';

// ── Mock Supabase ───────────────────────────────────────────────────────────

const mockEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({ update: mockUpdate })),
  },
}));

// ── Mock WASM compute ───────────────────────────────────────────────────────

vi.mock('@/wasm/bridge', () => ({
  compute: vi.fn(),
}));

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
      makePerson({ id: 'lc2', name: 'Jose dela Cruz' }),
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

function createDefaultSchedules(): EstateTaxScheduleSummary {
  return {
    schedule1_real_properties: 300000000,
    schedule2_personal_properties: 150000000,
    schedule3_taxable_transfers: 50000000,
    schedule4_claims_deductions: 100000000,
    schedule5_other_deductions: 50000000,
    schedule6_net_share_spouse: 0,
  };
}

function createTaxOutput(overrides: Partial<EstateTaxEngineOutput> = {}): EstateTaxEngineOutput {
  return {
    item40_gross_estate: 500000000, // ₱5,000,000
    item44_total_deductions: 300000000, // ₱3,000,000
    tax_due: 12000000, // ₱120,000
    surcharges: 0,
    interest: 0,
    compromise_penalty: 0,
    total_amount_due: 12000000,
    schedules: createDefaultSchedules(),
    ...overrides,
  };
}

function createBridgedOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
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
        from_intestate: { centavos: 66666667 },
        total: { centavos: 66666667 },
        legitime_fraction: '',
        legal_basis: ['Art.980'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 66666667 },
        net_from_estate: { centavos: 66666667 },
      },
      {
        heir_id: 'lc2',
        heir_name: 'Jose dela Cruz',
        heir_category: 'LegitimateChildGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: { centavos: 66666667 },
        total: { centavos: 66666667 },
        legitime_fraction: '',
        legal_basis: ['Art.980'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 66666667 },
        net_from_estate: { centavos: 66666667 },
      },
      {
        heir_id: 'sp',
        heir_name: 'Cora Reyes',
        heir_category: 'SurvivingSpouseGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: { centavos: 66666666 },
        total: { centavos: 66666666 },
        legitime_fraction: '',
        legal_basis: ['Art.996'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 66666666 },
        net_from_estate: { centavos: 66666666 },
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
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('tax-bridge > computeNetDistributableEstate', () => {
  it('returns positive result when gross > deductions', () => {
    // max(0, 5,000,000 - 3,000,000) = 2,000,000
    const result = computeNetDistributableEstate(500000000, 300000000);
    expect(result).toBe(200000000); // ₱2,000,000 in centavos
  });

  it('returns zero when deductions exceed gross estate (floor at 0)', () => {
    // max(0, 1,000,000 - 3,000,000) = 0
    const result = computeNetDistributableEstate(100000000, 300000000);
    expect(result).toBe(0);
  });

  it('returns zero when gross equals deductions', () => {
    const result = computeNetDistributableEstate(500000000, 500000000);
    expect(result).toBe(0);
  });

  it('returns full gross estate when deductions are zero', () => {
    const result = computeNetDistributableEstate(500000000, 0);
    expect(result).toBe(500000000);
  });

  it('handles small values correctly', () => {
    // ₱100 gross - ₱30 deductions = ₱70
    const result = computeNetDistributableEstate(10000, 3000);
    expect(result).toBe(7000);
  });

  it('handles very large estate values', () => {
    // ₱100,000,000 gross - ₱40,000,000 deductions = ₱60,000,000
    const result = computeNetDistributableEstate(10000000000, 4000000000);
    expect(result).toBe(6000000000);
  });

  it('never returns negative', () => {
    const result = computeNetDistributableEstate(0, 500000000);
    expect(result).toBe(0);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('tax-bridge > buildBridgedInput', () => {
  it('sets net_distributable_estate to bridged value', () => {
    const input = createTestInput();
    const bridged = buildBridgedInput(input, 200000000);
    expect(bridged.net_distributable_estate.centavos).toBe(200000000);
  });

  it('preserves decedent info from original input', () => {
    const input = createTestInput();
    const bridged = buildBridgedInput(input, 200000000);
    expect(bridged.decedent).toEqual(input.decedent);
  });

  it('preserves family_tree from original input', () => {
    const input = createTestInput();
    const bridged = buildBridgedInput(input, 200000000);
    expect(bridged.family_tree).toEqual(input.family_tree);
  });

  it('preserves will from original input', () => {
    const input = createTestInput({
      will: {
        institutions: [],
        legacies: [],
        devises: [],
        disinheritances: [],
        date_executed: '2023-07-01',
      },
    });
    const bridged = buildBridgedInput(input, 200000000);
    expect(bridged.will).toEqual(input.will);
  });

  it('preserves donations from original input', () => {
    const input = createTestInput();
    const bridged = buildBridgedInput(input, 200000000);
    expect(bridged.donations).toEqual(input.donations);
  });

  it('preserves config from original input', () => {
    const input = createTestInput();
    const bridged = buildBridgedInput(input, 200000000);
    expect(bridged.config).toEqual(input.config);
  });

  it('does not mutate the original input', () => {
    const input = createTestInput();
    const originalEstate = input.net_distributable_estate.centavos;
    buildBridgedInput(input, 200000000);
    expect(input.net_distributable_estate.centavos).toBe(originalEstate);
  });

  it('handles zero net distributable estate', () => {
    const input = createTestInput();
    const bridged = buildBridgedInput(input, 0);
    expect(bridged.net_distributable_estate.centavos).toBe(0);
  });
});

describe('tax-bridge > runTaxBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls WASM engine with bridged input', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    mockCompute.mockResolvedValue(createBridgedOutput());

    const input = createTestInput();
    const taxOutput = createTaxOutput();

    await runTaxBridge(input, taxOutput);

    expect(mockCompute).toHaveBeenCalledTimes(1);
    const calledWith = mockCompute.mock.calls[0][0];
    // Net distributable estate should be max(0, 500000000 - 300000000) = 200000000
    expect(calledWith.net_distributable_estate.centavos).toBe(200000000);
  });

  it('preserves family tree in bridged input passed to engine', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    mockCompute.mockResolvedValue(createBridgedOutput());

    const input = createTestInput();
    const taxOutput = createTaxOutput();

    await runTaxBridge(input, taxOutput);

    const calledWith = mockCompute.mock.calls[0][0];
    expect(calledWith.family_tree).toEqual(input.family_tree);
  });

  it('returns bridged input and output', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    const expectedOutput = createBridgedOutput();
    mockCompute.mockResolvedValue(expectedOutput);

    const result = await runTaxBridge(createTestInput(), createTaxOutput());

    expect(result.bridgedInput).toBeDefined();
    expect(result.bridgedOutput).toEqual(expectedOutput);
  });

  it('uses floor-at-zero for negative net estate', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    mockCompute.mockResolvedValue(createBridgedOutput());

    const taxOutput = createTaxOutput({
      item40_gross_estate: 100000000, // ₱1,000,000
      item44_total_deductions: 300000000, // ₱3,000,000
    });

    await runTaxBridge(createTestInput(), taxOutput);

    const calledWith = mockCompute.mock.calls[0][0];
    expect(calledWith.net_distributable_estate.centavos).toBe(0);
  });
});

describe('tax-bridge > saveTaxOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
  });

  it('persists tax_output_json to the case row', async () => {
    const taxOutput = createTaxOutput();
    await saveTaxOutput('case-123', taxOutput);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_output_json: taxOutput,
      }),
    );
  });

  it('targets the correct case by id', async () => {
    await saveTaxOutput('case-456', createTaxOutput());
    expect(mockEq).toHaveBeenCalledWith('id', 'case-456');
  });

  it('throws on Supabase error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'DB write failed' } });
    mockUpdate.mockReturnValue({ eq: mockEq });

    await expect(
      saveTaxOutput('case-123', createTaxOutput()),
    ).rejects.toBeDefined();
  });
});

describe('tax-bridge > buildBridgeNoteText', () => {
  it('includes peso-formatted net distributable estate', () => {
    // ₱2,000,000.00
    const note = buildBridgeNoteText(200000000);
    expect(note).toContain('2,000,000.00');
  });

  it('starts with "Estate tax net distributable estate of"', () => {
    const note = buildBridgeNoteText(200000000);
    expect(note).toMatch(/^Estate tax net distributable estate of/);
  });

  it('ends with "has been applied to the inheritance computation."', () => {
    const note = buildBridgeNoteText(200000000);
    expect(note).toMatch(/has been applied to the inheritance computation\.$/);
  });

  it('formats zero estate correctly', () => {
    const note = buildBridgeNoteText(0);
    expect(note).toContain('0.00');
  });

  it('includes peso sign', () => {
    const note = buildBridgeNoteText(200000000);
    expect(note).toContain('₱');
  });
});

describe('tax-bridge > EstateTaxEngineOutput type', () => {
  it('has required fields for bridge formula', () => {
    const output = createTaxOutput();
    expect(output).toHaveProperty('item40_gross_estate');
    expect(output).toHaveProperty('item44_total_deductions');
    expect(typeof output.item40_gross_estate).toBe('number');
    expect(typeof output.item44_total_deductions).toBe('number');
  });

  it('has tax computation fields', () => {
    const output = createTaxOutput();
    expect(output).toHaveProperty('tax_due');
    expect(output).toHaveProperty('surcharges');
    expect(output).toHaveProperty('interest');
    expect(output).toHaveProperty('compromise_penalty');
    expect(output).toHaveProperty('total_amount_due');
  });

  it('has schedule summary', () => {
    const output = createTaxOutput();
    expect(output.schedules).toHaveProperty('schedule1_real_properties');
    expect(output.schedules).toHaveProperty('schedule2_personal_properties');
    expect(output.schedules).toHaveProperty('schedule3_taxable_transfers');
    expect(output.schedules).toHaveProperty('schedule4_claims_deductions');
    expect(output.schedules).toHaveProperty('schedule5_other_deductions');
    expect(output.schedules).toHaveProperty('schedule6_net_share_spouse');
  });
});

describe('tax-bridge > end-to-end bridge workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('full bridge: tax output → net estate → bridged input → engine → updated output', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    const bridgedOutput = createBridgedOutput();
    mockCompute.mockResolvedValue(bridgedOutput);

    const inheritanceInput = createTestInput();
    const taxOutput = createTaxOutput({
      item40_gross_estate: 500000000, // ₱5,000,000
      item44_total_deductions: 300000000, // ₱3,000,000
    });

    // Step 1: Compute net distributable estate
    const netEstate = computeNetDistributableEstate(
      taxOutput.item40_gross_estate,
      taxOutput.item44_total_deductions,
    );
    expect(netEstate).toBe(200000000); // ₱2,000,000

    // Step 2: Build bridged input
    const bridgedInput = buildBridgedInput(inheritanceInput, netEstate);
    expect(bridgedInput.net_distributable_estate.centavos).toBe(200000000);
    expect(bridgedInput.family_tree).toEqual(inheritanceInput.family_tree);

    // Step 3: Run engine
    const result = await runTaxBridge(inheritanceInput, taxOutput);
    expect(result.bridgedOutput).toEqual(bridgedOutput);

    // Step 4: Build bridge note
    const note = buildBridgeNoteText(netEstate);
    expect(note).toContain('2,000,000.00');
  });
});
