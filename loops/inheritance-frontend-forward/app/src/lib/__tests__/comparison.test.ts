import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EngineInput, EngineOutput, Money, Person } from '@/types';
import {
  buildAlternativeInput,
  calculateDiffs,
  computeComparison,
  saveComparisonResults,
} from '../comparison';
import type { ComparisonDiffEntry } from '../comparison';

// ── Mock Supabase ───────────────────────────────────────────────────────────

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
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

function createTestateInput(overrides: Partial<EngineInput> = {}): EngineInput {
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
    will: {
      institutions: [
        {
          id: 'inst1',
          heir: { person_id: null, name: 'Fundacion Sampaloc', is_collective: false, class_designation: null },
          share: 'EntireFreePort',
          conditions: [],
          substitutes: [],
          is_residuary: false,
        },
      ],
      legacies: [],
      devises: [],
      disinheritances: [],
      date_executed: '2023-07-01',
    },
    donations: [],
    config: {
      max_pipeline_restarts: 10,
      retroactive_ra_11642: false,
    },
    ...overrides,
  };
}

function createIntestateInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return createTestateInput({ will: null, ...overrides });
}

function createOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
  return {
    per_heir_shares: [
      {
        heir_id: 'lc1',
        heir_name: 'Maria dela Cruz',
        heir_category: 'LegitimateChildGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: { centavos: 125000000 },
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: 125000000 },
        legitime_fraction: '1/4',
        legal_basis: ['Art.888'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 125000000 },
        net_from_estate: { centavos: 125000000 },
      },
      {
        heir_id: 'lc2',
        heir_name: 'Jose dela Cruz',
        heir_category: 'LegitimateChildGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: { centavos: 125000000 },
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: 125000000 },
        legitime_fraction: '1/4',
        legal_basis: ['Art.888'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 125000000 },
        net_from_estate: { centavos: 125000000 },
      },
      {
        heir_id: 'sp',
        heir_name: 'Cora Reyes',
        heir_category: 'SurvivingSpouseGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: { centavos: 125000000 },
        from_free_portion: zeroMoney(),
        from_intestate: zeroMoney(),
        total: { centavos: 125000000 },
        legitime_fraction: '1/4',
        legal_basis: ['Art.892'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 125000000 },
        net_from_estate: { centavos: 125000000 },
      },
    ],
    narratives: [],
    computation_log: {
      steps: [{ step_number: 10, step_name: 'Finalize', description: 'Done' }],
      total_restarts: 0,
      final_scenario: 'T3',
    },
    warnings: [],
    succession_type: 'Testate',
    scenario_code: 'T3',
    ...overrides,
  };
}

function createAlternativeOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
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
        from_intestate: { centavos: 166666667 },
        total: { centavos: 166666667 },
        legitime_fraction: '',
        legal_basis: ['Art.980'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 166666667 },
        net_from_estate: { centavos: 166666667 },
      },
      {
        heir_id: 'lc2',
        heir_name: 'Jose dela Cruz',
        heir_category: 'LegitimateChildGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: { centavos: 166666667 },
        total: { centavos: 166666667 },
        legitime_fraction: '',
        legal_basis: ['Art.980'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 166666667 },
        net_from_estate: { centavos: 166666667 },
      },
      {
        heir_id: 'sp',
        heir_name: 'Cora Reyes',
        heir_category: 'SurvivingSpouseGroup',
        inherits_by: 'OwnRight',
        represents: null,
        from_legitime: zeroMoney(),
        from_free_portion: zeroMoney(),
        from_intestate: { centavos: 166666666 },
        total: { centavos: 166666666 },
        legitime_fraction: '',
        legal_basis: ['Art.996'],
        donations_imputed: zeroMoney(),
        gross_entitlement: { centavos: 166666666 },
        net_from_estate: { centavos: 166666666 },
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

describe('comparison > buildAlternativeInput', () => {
  it('strips will to null from testate input', () => {
    const input = createTestateInput();
    expect(input.will).not.toBeNull();

    const alternative = buildAlternativeInput(input);
    expect(alternative.will).toBeNull();
  });

  it('preserves family_tree from original input', () => {
    const input = createTestateInput();
    const alternative = buildAlternativeInput(input);
    expect(alternative.family_tree).toEqual(input.family_tree);
  });

  it('preserves net_distributable_estate from original input', () => {
    const input = createTestateInput();
    const alternative = buildAlternativeInput(input);
    expect(alternative.net_distributable_estate).toEqual(input.net_distributable_estate);
  });

  it('preserves decedent info from original input', () => {
    const input = createTestateInput();
    const alternative = buildAlternativeInput(input);
    expect(alternative.decedent).toEqual(input.decedent);
  });

  it('preserves donations from original input', () => {
    const input = createTestateInput();
    const alternative = buildAlternativeInput(input);
    expect(alternative.donations).toEqual(input.donations);
  });

  it('preserves config from original input', () => {
    const input = createTestateInput();
    const alternative = buildAlternativeInput(input);
    expect(alternative.config).toEqual(input.config);
  });

  it('does not mutate the original input', () => {
    const input = createTestateInput();
    const originalWill = input.will;
    buildAlternativeInput(input);
    expect(input.will).toBe(originalWill);
  });
});

describe('comparison > calculateDiffs', () => {
  it('returns a diff entry for each heir in current output', () => {
    const current = createOutput();
    const alternative = createAlternativeOutput();
    const diffs = calculateDiffs(current, alternative);
    expect(diffs).toHaveLength(3);
  });

  it('calculates positive delta when heir gains under intestate', () => {
    const current = createOutput();
    const alternative = createAlternativeOutput();
    const diffs = calculateDiffs(current, alternative);

    // Maria: current 125000000, alternative 166666667 → delta = -(166666667 - 125000000) = -41666667
    // Under current will she gets LESS, so delta_centavos should be negative (loss under will)
    const maria = diffs.find((d) => d.heir_id === 'lc1');
    expect(maria).toBeDefined();
    expect(maria!.current_centavos).toBe(BigInt(125000000));
    expect(maria!.alternative_centavos).toBe(BigInt(166666667));
    // delta = current - alternative: negative means heir loses under will
    expect(maria!.delta_centavos).toBe(BigInt(125000000) - BigInt(166666667));
  });

  it('calculates delta_pct as percentage change', () => {
    const current = createOutput();
    const alternative = createAlternativeOutput();
    const diffs = calculateDiffs(current, alternative);

    const maria = diffs.find((d) => d.heir_id === 'lc1');
    expect(maria).toBeDefined();
    // delta_pct: (current - alternative) / alternative * 100
    // (125000000 - 166666667) / 166666667 * 100 ≈ -25%
    expect(maria!.delta_pct).toBeCloseTo(-25, 0);
  });

  it('returns zero delta when heir share is unchanged', () => {
    const sameOutput = createOutput();
    const diffs = calculateDiffs(sameOutput, sameOutput);

    diffs.forEach((d) => {
      expect(d.delta_centavos).toBe(BigInt(0));
      expect(d.delta_pct).toBe(0);
    });
  });

  it('includes heir_name from current output', () => {
    const current = createOutput();
    const alternative = createAlternativeOutput();
    const diffs = calculateDiffs(current, alternative);

    expect(diffs.map((d) => d.heir_name)).toContain('Maria dela Cruz');
    expect(diffs.map((d) => d.heir_name)).toContain('Jose dela Cruz');
    expect(diffs.map((d) => d.heir_name)).toContain('Cora Reyes');
  });

  it('handles heir present in current but missing from alternative (testamentary legatee)', () => {
    // Fundacion Sampaloc gets ₱1,250,000 under will but ₱0 intestate
    const currentWithLegatee = createOutput({
      per_heir_shares: [
        ...createOutput().per_heir_shares,
        {
          heir_id: 'legatee1',
          heir_name: 'Fundacion Sampaloc',
          heir_category: 'CollateralGroup',
          inherits_by: 'OwnRight',
          represents: null,
          from_legitime: zeroMoney(),
          from_free_portion: { centavos: 125000000 },
          from_intestate: zeroMoney(),
          total: { centavos: 125000000 },
          legitime_fraction: '',
          legal_basis: ['Art.842'],
          donations_imputed: zeroMoney(),
          gross_entitlement: { centavos: 125000000 },
          net_from_estate: { centavos: 125000000 },
        },
      ],
    });

    const diffs = calculateDiffs(currentWithLegatee, createAlternativeOutput());
    const legatee = diffs.find((d) => d.heir_id === 'legatee1');
    expect(legatee).toBeDefined();
    expect(legatee!.current_centavos).toBe(BigInt(125000000));
    expect(legatee!.alternative_centavos).toBe(BigInt(0));
    // Positive delta means heir gains under will
    expect(legatee!.delta_centavos).toBeGreaterThan(BigInt(0));
    expect(legatee!.delta_pct).toBe(100); // 100% loss without will → expressed as +100% gain under will
  });
});

describe('comparison > computeComparison', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls WASM engine with alternative (intestate) input', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    const alternativeOutput = createAlternativeOutput();
    mockCompute.mockResolvedValue(alternativeOutput);

    const input = createTestateInput();
    const output = createOutput();

    const result = await computeComparison(input, output);

    expect(mockCompute).toHaveBeenCalledTimes(1);
    // The input passed to compute should have will === null
    const calledWith = mockCompute.mock.calls[0][0];
    expect(calledWith.will).toBeNull();
  });

  it('returns diffs array with entries for all heirs', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    mockCompute.mockResolvedValue(createAlternativeOutput());

    const input = createTestateInput();
    const output = createOutput();

    const result = await computeComparison(input, output);
    expect(result.diffs.length).toBeGreaterThan(0);
    expect(result.alternativeOutput).toBeDefined();
  });

  it('returns the alternative output from the WASM engine', async () => {
    const { compute } = await import('@/wasm/bridge');
    const mockCompute = vi.mocked(compute);
    const expectedOutput = createAlternativeOutput();
    mockCompute.mockResolvedValue(expectedOutput);

    const result = await computeComparison(createTestateInput(), createOutput());
    expect(result.alternativeOutput).toEqual(expectedOutput);
  });
});

describe('comparison > saveComparisonResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  });

  it('persists comparison_input_json and comparison_output_json to case', async () => {
    const alternativeInput = createIntestateInput();
    const alternativeOutput = createAlternativeOutput();

    await saveComparisonResults('case-123', alternativeInput, alternativeOutput);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        comparison_input_json: alternativeInput,
        comparison_output_json: alternativeOutput,
        comparison_ran_at: expect.any(String),
      }),
    );
  });

  it('sets comparison_ran_at to a valid ISO timestamp', async () => {
    await saveComparisonResults('case-123', createIntestateInput(), createAlternativeOutput());

    const updateArg = mockUpdate.mock.calls[0][0];
    const ranAt = new Date(updateArg.comparison_ran_at);
    expect(ranAt.getTime()).not.toBeNaN();
  });

  it('throws on Supabase error', async () => {
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    });

    await expect(
      saveComparisonResults('case-123', createIntestateInput(), createAlternativeOutput()),
    ).rejects.toBeDefined();
  });
});
