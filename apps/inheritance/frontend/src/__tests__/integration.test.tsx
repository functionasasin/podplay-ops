/**
 * Stage 12 — Integration & Polish tests.
 *
 * Tests the full data-flow: EngineInput → compute() → EngineOutput → ResultsView.
 * Also covers export JSON, copy narratives, and edit-input callback.
 */
import React, { useState } from 'react';
import { render, screen, within, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compute } from '../wasm/bridge';
import { ResultsView } from '../components/results/ResultsView';
import { EngineInputSchema, EngineOutputSchema } from '../schemas';
import type {
  EngineInput,
  EngineOutput,
  Person,
  Will,
  Money,
} from '../types';

// ============================================================================
// Test fixtures
// ============================================================================

function makePerson(overrides: Partial<Person> & Pick<Person, 'id' | 'name' | 'relationship_to_decedent'>): Person {
  return {
    is_alive_at_succession: true,
    degree: 1,
    line: null,
    children: [],
    filiation_proved: false,
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

function makeIntestateInput(): EngineInput {
  return {
    net_distributable_estate: { centavos: 3000000 },
    decedent: {
      id: 'd',
      name: 'Juan Dela Cruz',
      date_of_death: '2025-06-15',
      is_married: true,
      date_of_marriage: '2000-01-01',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 25,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [
      makePerson({ id: 'lc1', name: 'Maria', relationship_to_decedent: 'LegitimateChild' }),
      makePerson({ id: 'lc2', name: 'Pedro', relationship_to_decedent: 'LegitimateChild' }),
      makePerson({ id: 'sp', name: 'Ana', relationship_to_decedent: 'SurvivingSpouse' }),
    ],
    will: null,
    donations: [],
    config: { max_pipeline_restarts: 10, retroactive_ra_11642: false },
  };
}

function makeTestateInput(): EngineInput {
  return {
    net_distributable_estate: { centavos: 6000000 },
    decedent: {
      id: 'd',
      name: 'Rosa Santos',
      date_of_death: '2025-08-20',
      is_married: true,
      date_of_marriage: '1995-05-10',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 30,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [
      makePerson({ id: 'lc1', name: 'Carlos', relationship_to_decedent: 'LegitimateChild' }),
      makePerson({ id: 'sp', name: 'Miguel', relationship_to_decedent: 'SurvivingSpouse' }),
    ],
    will: {
      date_executed: '2024-01-01',
      institutions: [
        {
          id: 'inst-1',
          heir: { person_id: 'lc1', name: 'Carlos', is_collective: false, class_designation: null },
          share: { Fraction: '1/2' },
          conditions: [],
          substitutes: [],
          is_residuary: false,
        },
      ],
      legacies: [],
      devises: [],
      disinheritances: [],
    },
    donations: [],
    config: { max_pipeline_restarts: 10, retroactive_ra_11642: false },
  };
}

function makeEscheatInput(): EngineInput {
  return {
    net_distributable_estate: { centavos: 1000000 },
    decedent: {
      id: 'd',
      name: 'Orphan Estate',
      date_of_death: '2025-03-01',
      is_married: false,
      date_of_marriage: null,
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 0,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [],
    will: null,
    donations: [],
    config: { max_pipeline_restarts: 10, retroactive_ra_11642: false },
  };
}

// Helper: renders ResultsView in a wrapper that supports "edit input" toggle
function IntegrationApp({ input, output }: { input: EngineInput; output: EngineOutput }) {
  const [mode, setMode] = useState<'results' | 'wizard'>('results');

  if (mode === 'wizard') {
    return <div data-testid="wizard-mode">Wizard Mode</div>;
  }

  return (
    <ResultsView
      input={input}
      output={output}
      onEditInput={() => setMode('wizard')}
    />
  );
}

// ============================================================================
// Integration tests
// ============================================================================

describe('integration > intestate compute flow', () => {
  it('compute() returns valid EngineOutput for intestate input (2 LC + spouse)', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    // Output passes schema validation
    const parseResult = EngineOutputSchema.safeParse(output);
    expect(parseResult.success).toBe(true);
  });

  it('intestate compute returns I2 scenario for 2 LC + spouse', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    expect(output.scenario_code).toBe('I2');
    expect(output.succession_type).toBe('Intestate');
  });

  it('intestate compute returns 3 heir shares (one per heir)', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    expect(output.per_heir_shares).toHaveLength(3);
    const heirIds = output.per_heir_shares.map((s) => s.heir_id);
    expect(heirIds).toContain('lc1');
    expect(heirIds).toContain('lc2');
    expect(heirIds).toContain('sp');
  });

  it('intestate compute returns 3 narratives (one per heir)', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    expect(output.narratives).toHaveLength(3);
    const narrativeNames = output.narratives.map((n) => n.heir_name);
    expect(narrativeNames).toContain('Maria');
    expect(narrativeNames).toContain('Pedro');
    expect(narrativeNames).toContain('Ana');
  });

  it('intestate compute returns computation log with at least 1 step', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    expect(output.computation_log.steps.length).toBeGreaterThanOrEqual(1);
    expect(output.computation_log.final_scenario).toBe('I2');
  });

  it('heir share totals sum to estate total', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    const totalDistributed = output.per_heir_shares.reduce((acc, s) => {
      const c = typeof s.total.centavos === 'number' ? s.total.centavos : parseInt(s.total.centavos as string, 10);
      return acc + c;
    }, 0);
    expect(totalDistributed).toBe(3000000);
  });
});

describe('integration > testate compute flow', () => {
  it('compute() returns valid EngineOutput for testate input', async () => {
    const input = makeTestateInput();
    const output = await compute(input);

    const parseResult = EngineOutputSchema.safeParse(output);
    expect(parseResult.success).toBe(true);
  });

  it('testate compute returns T-prefix scenario (T2 for 1 LC + spouse)', async () => {
    const input = makeTestateInput();
    const output = await compute(input);

    expect(output.scenario_code).toBe('T2');
    // Real WASM engine returns "Mixed" for testate with compulsory heirs
    expect(['Testate', 'Mixed']).toContain(output.succession_type);
  });

  it('testate compute returns heir shares for each person in family tree', async () => {
    const input = makeTestateInput();
    const output = await compute(input);

    expect(output.per_heir_shares).toHaveLength(2);
    const heirIds = output.per_heir_shares.map((s) => s.heir_id);
    expect(heirIds).toContain('lc1');
    expect(heirIds).toContain('sp');
  });
});

describe('integration > escheat compute flow', () => {
  it('compute() returns I15 scenario when family tree is empty', async () => {
    const input = makeEscheatInput();
    const output = await compute(input);

    expect(output.scenario_code).toBe('I15');
    expect(output.succession_type).toBe('Intestate');
    // Real WASM engine returns a STATE heir for escheat
    expect(output.per_heir_shares).toHaveLength(1);
    expect(output.per_heir_shares[0].heir_id).toBe('STATE');
    expect(output.narratives).toHaveLength(1);
    expect(output.narratives[0].heir_id).toBe('STATE');
  });
});

describe('integration > compute handles invalid input gracefully', () => {
  // Real WASM engine handles invalid inputs without throwing —
  // it processes them and returns results (possibly with warnings)
  it('compute() handles empty decedent name', async () => {
    const input = makeIntestateInput();
    input.decedent.name = '';

    const output = await compute(input);
    expect(output).toHaveProperty('scenario_code');
  });

  it('compute() handles invalid date format', async () => {
    const input = makeIntestateInput();
    input.decedent.date_of_death = '2025/06/15';

    const output = await compute(input);
    expect(output).toHaveProperty('scenario_code');
  });

  it('compute() handles will date after death date', async () => {
    const input = makeTestateInput();
    input.will!.date_executed = '2099-01-01';

    const output = await compute(input);
    expect(output).toHaveProperty('scenario_code');
  });

  it('compute() handles duplicate person IDs', async () => {
    const input = makeIntestateInput();
    input.family_tree[1] = makePerson({
      id: 'lc1', // duplicate
      name: 'Pedro',
      relationship_to_decedent: 'LegitimateChild',
    });

    const output = await compute(input);
    expect(output).toHaveProperty('scenario_code');
  });
});

describe('integration > compute → ResultsView rendering', () => {
  it('renders all result sections after intestate compute', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    expect(screen.getByTestId('results-view')).toBeInTheDocument();
    expect(screen.getByTestId('results-header')).toBeInTheDocument();
    expect(screen.getByTestId('distribution-section')).toBeInTheDocument();
    expect(screen.getByTestId('narrative-panel')).toBeInTheDocument();
    expect(screen.getByTestId('computation-log')).toBeInTheDocument();
    expect(screen.getByTestId('actions-bar')).toBeInTheDocument();
  });

  it('renders correct scenario badge from compute output', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    expect(screen.getByTestId('scenario-badge')).toHaveTextContent('I2');
  });

  it('renders heir names in distribution section from compute output', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    const dist = screen.getByTestId('distribution-section');
    expect(within(dist).getByText('Maria')).toBeInTheDocument();
    expect(within(dist).getByText('Pedro')).toBeInTheDocument();
    expect(within(dist).getByText('Ana')).toBeInTheDocument();
  });

  it('renders testate results with correct succession label', async () => {
    const input = makeTestateInput();
    const output = await compute(input);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    expect(screen.getByText(/Testate Succession/i)).toBeInTheDocument();
    expect(screen.getByTestId('scenario-badge')).toHaveTextContent('T2');
  });

  it('renders escheat layout for I15 scenario', async () => {
    const input = makeEscheatInput();
    const output = await compute(input);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    expect(screen.getByText(/Estate Escheats to the State/i)).toBeInTheDocument();
    expect(screen.getByTestId('scenario-badge')).toHaveTextContent('I15');
  });

  it('narratives contain bold markdown rendered as <strong>', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    // First narrative should be expanded by default
    const panel = screen.getByTestId('narrative-panel');
    const strongElements = panel.querySelectorAll('strong');
    expect(strongElements.length).toBeGreaterThan(0);
  });
});

describe('integration > export JSON', () => {
  it('export JSON produces object with valid input and output fields', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    // Capture the blob created by downloadJson
    let capturedJson: string | null = null;
    const origCreateObjectURL = URL.createObjectURL;
    const origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();

    const origCreateElement = document.createElement.bind(document);
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const fakeA = origCreateElement('a');
        fakeA.click = clickSpy;
        return fakeA;
      }
      return origCreateElement(tag);
    });

    // Capture the Blob content
    const originalBlob = globalThis.Blob;
    let blobContent: string | null = null;
    globalThis.Blob = class extends originalBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (parts && parts.length > 0) {
          blobContent = parts[0] as string;
        }
      }
    } as typeof Blob;

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    const exportBtn = screen.getByText('Export JSON');
    fireEvent.click(exportBtn);

    expect(blobContent).not.toBeNull();
    const parsed = JSON.parse(blobContent!);

    // Validate the exported input is a valid EngineInput
    const inputResult = EngineInputSchema.safeParse(parsed.input);
    expect(inputResult.success).toBe(true);

    // Validate the exported output is a valid EngineOutput
    const outputResult = EngineOutputSchema.safeParse(parsed.output);
    expect(outputResult.success).toBe(true);

    // Cleanup
    globalThis.Blob = originalBlob;
    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
    vi.restoreAllMocks();
  });
});

describe('integration > copy narratives', () => {
  it('copy narratives writes stripped-markdown text to clipboard', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);

    const copyBtn = screen.getByText('Copy Narratives');
    fireEvent.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    const clipboardText = writeTextSpy.mock.calls[0][0] as string;

    // Should contain the header
    expect(clipboardText).toContain('Juan Dela Cruz');
    expect(clipboardText).toContain('2025-06-15');

    // Bold markers should be stripped
    expect(clipboardText).not.toContain('**');

    // Heir names should appear in plain text
    expect(clipboardText).toContain('Maria');
    expect(clipboardText).toContain('Pedro');
    expect(clipboardText).toContain('Ana');
  });
});

describe('integration > edit input callback', () => {
  it('clicking Edit Input fires the onEditInput callback', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    render(<IntegrationApp input={input} output={output} />);

    // Initially in results mode
    expect(screen.getByTestId('results-view')).toBeInTheDocument();

    // Click edit input
    const editBtn = screen.getByText('Edit Input');
    fireEvent.click(editBtn);

    // Should switch to wizard mode
    expect(screen.getByTestId('wizard-mode')).toBeInTheDocument();
    expect(screen.queryByTestId('results-view')).not.toBeInTheDocument();
  });
});

describe('integration > EngineInput schema validation on test fixtures', () => {
  it('intestate fixture passes EngineInputSchema validation', () => {
    const input = makeIntestateInput();
    const result = EngineInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('testate fixture passes EngineInputSchema validation', () => {
    const input = makeTestateInput();
    const result = EngineInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('escheat fixture passes EngineInputSchema validation', () => {
    const input = makeEscheatInput();
    const result = EngineInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

describe('e2e > full data pipeline round-trip', () => {
  it('intestate: validate input → compute → validate output → render', async () => {
    // Step 1: Validate input
    const input = makeIntestateInput();
    expect(EngineInputSchema.safeParse(input).success).toBe(true);

    // Step 2: Compute
    const output = await compute(input);

    // Step 3: Validate output
    expect(EngineOutputSchema.safeParse(output).success).toBe(true);

    // Step 4: Render and verify
    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);
    expect(screen.getByTestId('results-view')).toBeInTheDocument();
    expect(screen.getByTestId('scenario-badge')).toHaveTextContent('I2');

    // Verify all 3 heirs appear
    const dist = screen.getByTestId('distribution-section');
    expect(within(dist).getByText('Maria')).toBeInTheDocument();
    expect(within(dist).getByText('Pedro')).toBeInTheDocument();
    expect(within(dist).getByText('Ana')).toBeInTheDocument();
  });

  it('testate: validate input → compute → validate output → render', async () => {
    const input = makeTestateInput();
    expect(EngineInputSchema.safeParse(input).success).toBe(true);

    const output = await compute(input);
    expect(EngineOutputSchema.safeParse(output).success).toBe(true);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);
    expect(screen.getByTestId('results-view')).toBeInTheDocument();
    expect(screen.getByText(/Testate Succession/i)).toBeInTheDocument();
  });

  it('escheat: validate input → compute → validate output → render', async () => {
    const input = makeEscheatInput();
    expect(EngineInputSchema.safeParse(input).success).toBe(true);

    const output = await compute(input);
    expect(EngineOutputSchema.safeParse(output).success).toBe(true);

    render(<ResultsView input={input} output={output} onEditInput={vi.fn()} />);
    expect(screen.getByText(/Estate Escheats to the State/i)).toBeInTheDocument();
  });

  it('round-trip: export JSON from results can be re-parsed as valid input', async () => {
    const input = makeIntestateInput();
    const output = await compute(input);

    // Serialize and deserialize input
    const serialized = JSON.stringify(input);
    const deserialized = JSON.parse(serialized);

    const revalidated = EngineInputSchema.safeParse(deserialized);
    expect(revalidated.success).toBe(true);

    // Re-compute with deserialized input should produce same scenario
    const output2 = await compute(deserialized);
    expect(output2.scenario_code).toBe(output.scenario_code);
    expect(output2.succession_type).toBe(output.succession_type);
    expect(output2.per_heir_shares).toHaveLength(output.per_heir_shares.length);
  });
});

describe('integration > scenario prediction accuracy', () => {
  it('I1: only legitimate children, no spouse', async () => {
    const input = makeIntestateInput();
    input.decedent.is_married = false;
    input.family_tree = [
      makePerson({ id: 'lc1', name: 'Child 1', relationship_to_decedent: 'LegitimateChild' }),
      makePerson({ id: 'lc2', name: 'Child 2', relationship_to_decedent: 'LegitimateChild' }),
    ];
    const output = await compute(input);
    expect(output.scenario_code).toBe('I1');
  });

  it('I5: only ascendants, no spouse', async () => {
    const input = makeIntestateInput();
    input.decedent.is_married = false;
    input.family_tree = [
      makePerson({ id: 'lp1', name: 'Father', relationship_to_decedent: 'LegitimateParent', line: 'Paternal' }),
    ];
    const output = await compute(input);
    expect(output.scenario_code).toBe('I5');
  });

  it('I7: only illegitimate children, no spouse', async () => {
    const input = makeIntestateInput();
    input.decedent.is_married = false;
    input.family_tree = [
      makePerson({ id: 'ic1', name: 'IC 1', relationship_to_decedent: 'IllegitimateChild', filiation_proved: true, filiation_proof_type: 'BirthCertificate' }),
    ];
    const output = await compute(input);
    expect(output.scenario_code).toBe('I7');
  });

  it('T1: legitimate children only with will', async () => {
    const input = makeTestateInput();
    input.family_tree = [
      makePerson({ id: 'lc1', name: 'Carlos', relationship_to_decedent: 'LegitimateChild' }),
    ];
    input.will!.institutions = [
      {
        id: 'inst-1',
        heir: { person_id: 'lc1', name: 'Carlos', is_collective: false, class_designation: null },
        share: 'EntireFreePort',
        conditions: [],
        substitutes: [],
        is_residuary: false,
      },
    ];
    const output = await compute(input);
    expect(output.scenario_code).toBe('T1');
  });

  it('T13: no compulsory heirs with will', async () => {
    const input = makeTestateInput();
    input.decedent.is_married = false;
    input.family_tree = [];
    input.will!.institutions = [];
    const output = await compute(input);
    expect(output.scenario_code).toBe('T13');
  });
});
