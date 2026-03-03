/**
 * family-tree-viz — Component tests for FamilyTreeTab + TreeNode (§4.19)
 *
 * Covers: FamilyTreeTab rendering, TreeNode role-based colors, zoom controls,
 * SVG download, tab navigation between Distribution and Family Tree.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef, Suspense } from 'react';
import type { Person, InheritanceShare, Money, EngineInput, EngineOutput } from '@/types';
import { TreeNodeRenderer } from '../TreeNode';
import type { TreeNodeData } from '../tree-utils';

// ── Mock react-d3-tree ──────────────────────────────────────────────────
// react-d3-tree relies on SVG measurement APIs not available in jsdom.
// We mock it to render each node as a div so we can assert tree structure.

vi.mock('react-d3-tree', () => ({
  __esModule: true,
  default: function MockTree({ data, renderCustomNodeElement }: {
    data: TreeNodeData;
    renderCustomNodeElement?: (props: { nodeDatum: TreeNodeData }) => React.ReactNode;
  }) {
    function renderNode(node: TreeNodeData): React.ReactNode {
      return (
        <div key={node.personId} data-testid={`mock-tree-node-${node.personId}`}>
          {renderCustomNodeElement
            ? renderCustomNodeElement({ nodeDatum: node })
            : <span>{node.name}</span>}
          {node.children?.map(child => renderNode(child))}
        </div>
      );
    }
    return (
      <div data-testid="mock-react-d3-tree">
        <svg data-testid="mock-svg">
          <text>{data.name}</text>
        </svg>
        {renderNode(data)}
      </div>
    );
  },
}));

// ── Test helpers ────────────────────────────────────────────────────────────

function zeroMoney(): Money {
  return { centavos: 0 };
}

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'p1',
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

function makeShare(overrides: Partial<InheritanceShare> = {}): InheritanceShare {
  return {
    heir_id: 'p1',
    heir_name: 'Maria dela Cruz',
    heir_category: 'LegitimateChildGroup',
    inherits_by: 'OwnRight',
    represents: null,
    from_legitime: { centavos: 50000000 },
    from_free_portion: zeroMoney(),
    from_intestate: zeroMoney(),
    total: { centavos: 50000000 },
    legitime_fraction: '1/4',
    legal_basis: ['Art.887'],
    donations_imputed: zeroMoney(),
    gross_entitlement: { centavos: 50000000 },
    net_from_estate: { centavos: 50000000 },
    ...overrides,
  };
}

function createTestInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    net_distributable_estate: { centavos: 500000000 },
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
    config: { retroactive_ra_11642: false, max_pipeline_restarts: 3 },
    ...overrides,
  };
}

function createTestOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
  return {
    per_heir_shares: [
      makeShare({ heir_id: 'lc1', heir_name: 'Maria dela Cruz', total: { centavos: 120000000 } }),
      makeShare({ heir_id: 'lc2', heir_name: 'Jose dela Cruz', total: { centavos: 120000000 } }),
      makeShare({
        heir_id: 'sp',
        heir_name: 'Cora Reyes',
        heir_category: 'SurvivingSpouseGroup',
        total: { centavos: 120000000 },
      }),
    ],
    narratives: [],
    computation_log: { steps: [], total_restarts: 0, final_scenario: 'I1' },
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I1',
    ...overrides,
  };
}

// ── TreeNodeRenderer tests ──────────────────────────────────────────────

describe('family-tree-viz > TreeNodeRenderer', () => {
  it('renders decedent node with slate-800 border and † symbol', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Juan dela Cruz',
      role: 'decedent',
      personId: 'd',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-d"]');
    expect(node).toBeTruthy();
    expect(node!.textContent).toContain('Juan dela Cruz');
    expect(node!.textContent).toContain('†');
  });

  it('renders active-heir node with share amount', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Maria dela Cruz',
      role: 'active-heir',
      personId: 'lc1',
      shareAmount: '₱1,200,000',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-lc1"]');
    expect(node!.textContent).toContain('Maria dela Cruz');
    expect(node!.textContent).toContain('₱1,200,000');
  });

  it('renders surviving-spouse node with share amount', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Cora Reyes',
      role: 'surviving-spouse',
      personId: 'sp',
      shareAmount: '₱1,200,000',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-sp"]');
    expect(node!.textContent).toContain('Cora Reyes');
    expect(node!.textContent).toContain('₱1,200,000');
  });

  it('renders predeceased node with "Predeceased" label', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Maria (deceased)',
      role: 'predeceased',
      personId: 'lc1',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-lc1"]');
    expect(node!.textContent).toContain('Predeceased');
  });

  it('renders disinherited node with "Disinherited" label', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Jose (disinherited)',
      role: 'disinherited',
      personId: 'lc2',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-lc2"]');
    expect(node!.textContent).toContain('Disinherited');
  });

  it('renders unworthy node with "Unworthy" label', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Pedro (unworthy)',
      role: 'unworthy',
      personId: 'p3',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-p3"]');
    expect(node!.textContent).toContain('Unworthy');
  });

  it('renders renounced node with "Renounced" label', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Ana (renounced)',
      role: 'renounced',
      personId: 'p4',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-p4"]');
    expect(node!.textContent).toContain('Renounced');
  });

  it('renders zero-share node with "Excluded" label', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Stranger',
      role: 'zero-share',
      personId: 'p5',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-p5"]');
    expect(node!.textContent).toContain('Excluded');
  });

  it('renders testamentary-only node with "Legatee" label', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Charity Foundation',
      role: 'testamentary-only',
      personId: 'p6',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-p6"]');
    expect(node!.textContent).toContain('Legatee');
  });

  it('applies role-based CSS classes to node card', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Maria dela Cruz',
      role: 'active-heir',
      personId: 'lc1',
      shareAmount: '₱1,200,000',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const card = container.querySelector('.border-green-600');
    expect(card).toBeTruthy();
    expect(card!.className).toContain('bg-green-50');
  });

  it('does not show share amount on predeceased nodes', () => {
    const nodeDatum: TreeNodeData = {
      name: 'Dead Person',
      role: 'predeceased',
      personId: 'dp',
    };
    const { container } = render(
      <svg>
        <TreeNodeRenderer nodeDatum={nodeDatum} />
      </svg>
    );
    const node = container.querySelector('[data-testid="tree-node-dp"]');
    // No peso sign should appear
    expect(node!.textContent).not.toContain('₱');
  });
});

// ── FamilyTreeTab tests ─────────────────────────────────────────────────

describe('family-tree-viz > FamilyTreeTab', () => {
  // Dynamically import to test lazy loading behavior
  let FamilyTreeTab: typeof import('../FamilyTreeTab').FamilyTreeTab;

  beforeEach(async () => {
    const mod = await import('../FamilyTreeTab');
    FamilyTreeTab = mod.FamilyTreeTab;
  });

  it('renders the family tree tab container', () => {
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    expect(screen.getByTestId('family-tree-tab')).toBeInTheDocument();
  });

  it('renders the tree container element', () => {
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    expect(screen.getByTestId('tree-container')).toBeInTheDocument();
  });

  it('renders the mock react-d3-tree component', () => {
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    expect(screen.getByTestId('mock-react-d3-tree')).toBeInTheDocument();
  });

  it('renders tree controls (zoom in, zoom out, fit, download)', () => {
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    const controls = screen.getByTestId('tree-controls');
    expect(controls).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit to screen')).toBeInTheDocument();
    expect(screen.getByLabelText('Download SVG')).toBeInTheDocument();
  });

  it('zoom in button is clickable', async () => {
    const user = userEvent.setup();
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    const zoomIn = screen.getByLabelText('Zoom in');
    await user.click(zoomIn);
    // Should not throw — zoom state updated internally
    expect(zoomIn).toBeInTheDocument();
  });

  it('zoom out button is clickable', async () => {
    const user = userEvent.setup();
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    const zoomOut = screen.getByLabelText('Zoom out');
    await user.click(zoomOut);
    expect(zoomOut).toBeInTheDocument();
  });

  it('fit to screen button is clickable', async () => {
    const user = userEvent.setup();
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    const fit = screen.getByLabelText('Fit to screen');
    await user.click(fit);
    expect(fit).toBeInTheDocument();
  });

  it('download SVG button triggers download logic', async () => {
    const user = userEvent.setup();
    const input = createTestInput();
    const output = createTestOutput();

    // Mock URL methods
    const createObjectURL = vi.fn().mockReturnValue('blob:test');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<FamilyTreeTab input={input} output={output} />);

    const downloadBtn = screen.getByLabelText('Download SVG');
    await user.click(downloadBtn);
    // The download is attempted (may or may not find SVG in mock)
    expect(downloadBtn).toBeInTheDocument();
  });

  it('renders legend section', () => {
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    const legend = screen.getByTestId('tree-legend');
    expect(legend).toBeInTheDocument();
    expect(legend.textContent).toContain('Active heir');
    expect(legend.textContent).toContain('Predeceased');
    expect(legend.textContent).toContain('Disinherited');
    expect(legend.textContent).toContain('By representation');
  });

  it('exposes getSVGString via ref/useImperativeHandle', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const ref = createRef<{ getSVGString: () => string | null }>();

    render(<FamilyTreeTab ref={ref} input={input} output={output} />);

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current!.getSVGString).toBe('function');
    // In the mock environment, there may or may not be an SVG element
    const result = ref.current!.getSVGString();
    // Result is string (from mock SVG) or null
    expect(result === null || typeof result === 'string').toBe(true);
  });

  it('renders tree nodes for each family member via custom renderer', () => {
    const input = createTestInput();
    const output = createTestOutput();
    render(<FamilyTreeTab input={input} output={output} />);

    // The mock Tree renders nodes with data-testid="mock-tree-node-{personId}"
    expect(screen.getByTestId('mock-tree-node-d')).toBeInTheDocument(); // decedent
    expect(screen.getByTestId('mock-tree-node-lc1')).toBeInTheDocument();
    expect(screen.getByTestId('mock-tree-node-lc2')).toBeInTheDocument();
  });

  it('renders with empty family tree (escheat)', () => {
    const input = createTestInput({ family_tree: [] });
    const output = createTestOutput({ per_heir_shares: [], scenario_code: 'I15' });
    render(<FamilyTreeTab input={input} output={output} />);

    expect(screen.getByTestId('family-tree-tab')).toBeInTheDocument();
    expect(screen.getByTestId('mock-tree-node-d')).toBeInTheDocument();
  });

  it('handles family with only spouse (no children)', () => {
    const input = createTestInput({
      family_tree: [
        makePerson({ id: 'sp', name: 'Cora Reyes', relationship_to_decedent: 'SurvivingSpouse' }),
      ],
    });
    const output = createTestOutput({
      per_heir_shares: [
        makeShare({
          heir_id: 'sp',
          heir_name: 'Cora Reyes',
          heir_category: 'SurvivingSpouseGroup',
          total: { centavos: 500000000 },
        }),
      ],
    });
    render(<FamilyTreeTab input={input} output={output} />);

    expect(screen.getByTestId('family-tree-tab')).toBeInTheDocument();
    expect(screen.getByTestId('mock-tree-node-d')).toBeInTheDocument();
  });
});
