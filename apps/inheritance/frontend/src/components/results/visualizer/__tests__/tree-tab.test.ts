/**
 * tree-tab — Unit tests for tree-utils (§4.19 Family Tree Visualizer)
 *
 * Covers: getNodeRole, buildTreeData, formatShareAmount, findSpouse,
 * NODE_ROLE_COLORS, DISINHERITANCE_CAUSE_LABELS
 */
import { describe, it, expect } from 'vitest';
import type { Person, InheritanceShare, Money, EngineInput, EngineOutput } from '@/types';
import {
  getNodeRole,
  buildTreeData,
  formatShareAmount,
  findSpouse,
  NODE_ROLE_COLORS,
  DISINHERITANCE_CAUSE_LABELS,
} from '../tree-utils';
import type { NodeRole, TreeNodeData } from '../tree-utils';

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

// ── NODE_ROLE_COLORS ─────────────────────────────────────────────────────

describe('tree-tab > NODE_ROLE_COLORS', () => {
  const allRoles: NodeRole[] = [
    'decedent',
    'active-heir',
    'surviving-spouse',
    'predeceased',
    'disinherited',
    'unworthy',
    'renounced',
    'zero-share',
    'testamentary-only',
  ];

  it('has entries for all 9 node roles', () => {
    expect(Object.keys(NODE_ROLE_COLORS)).toHaveLength(9);
    for (const role of allRoles) {
      expect(NODE_ROLE_COLORS[role]).toBeDefined();
    }
  });

  it('decedent has slate-800 border', () => {
    expect(NODE_ROLE_COLORS['decedent'].border).toBe('border-slate-800');
    expect(NODE_ROLE_COLORS['decedent'].background).toBe('bg-slate-100');
    expect(NODE_ROLE_COLORS['decedent'].label).toBe('†');
  });

  it('active-heir has green-600 border', () => {
    expect(NODE_ROLE_COLORS['active-heir'].border).toBe('border-green-600');
    expect(NODE_ROLE_COLORS['active-heir'].background).toBe('bg-green-50');
  });

  it('surviving-spouse has violet-600 border', () => {
    expect(NODE_ROLE_COLORS['surviving-spouse'].border).toBe('border-violet-600');
    expect(NODE_ROLE_COLORS['surviving-spouse'].background).toBe('bg-violet-50');
  });

  it('predeceased has slate-400 border and "Predeceased" label', () => {
    expect(NODE_ROLE_COLORS['predeceased'].border).toBe('border-slate-400');
    expect(NODE_ROLE_COLORS['predeceased'].label).toBe('Predeceased');
  });

  it('disinherited has red-600 border and "Disinherited" label', () => {
    expect(NODE_ROLE_COLORS['disinherited'].border).toBe('border-red-600');
    expect(NODE_ROLE_COLORS['disinherited'].label).toBe('Disinherited');
  });

  it('unworthy has orange-600 border and "Unworthy" label', () => {
    expect(NODE_ROLE_COLORS['unworthy'].border).toBe('border-orange-600');
    expect(NODE_ROLE_COLORS['unworthy'].label).toBe('Unworthy');
  });

  it('renounced has yellow-600 border and "Renounced" label', () => {
    expect(NODE_ROLE_COLORS['renounced'].border).toBe('border-yellow-600');
    expect(NODE_ROLE_COLORS['renounced'].label).toBe('Renounced');
  });

  it('zero-share has slate-300 border and "Excluded" label', () => {
    expect(NODE_ROLE_COLORS['zero-share'].border).toBe('border-slate-300');
    expect(NODE_ROLE_COLORS['zero-share'].label).toBe('Excluded');
  });

  it('testamentary-only has sky-600 border and "Legatee" label', () => {
    expect(NODE_ROLE_COLORS['testamentary-only'].border).toBe('border-sky-600');
    expect(NODE_ROLE_COLORS['testamentary-only'].label).toBe('Legatee');
  });

  it('each role has border, background, and label properties', () => {
    for (const role of allRoles) {
      const colors = NODE_ROLE_COLORS[role];
      expect(colors).toHaveProperty('border');
      expect(colors).toHaveProperty('background');
      expect(colors).toHaveProperty('label');
      expect(typeof colors.border).toBe('string');
      expect(typeof colors.background).toBe('string');
      expect(typeof colors.label).toBe('string');
    }
  });
});

// ── DISINHERITANCE_CAUSE_LABELS ──────────────────────────────────────────

describe('tree-tab > DISINHERITANCE_CAUSE_LABELS', () => {
  it('has entries for all DisinheritanceCause values', () => {
    const expectedCauses = [
      'ChildAttemptOnLife', 'ChildGroundlessAccusation', 'ChildAdulteryWithSpouse',
      'ChildFraudUndueInfluence', 'ChildRefusalToSupport', 'ChildMaltreatment',
      'ChildDishonorableLife', 'ChildCivilInterdiction',
      'ParentAbandonmentCorruption', 'ParentAttemptOnLife', 'ParentGroundlessAccusation',
      'ParentAdulteryWithSpouse', 'ParentFraudUndueInfluence', 'ParentLossParentalAuthority',
      'ParentRefusalToSupport', 'ParentAttemptOnOther',
      'SpouseAttemptOnLife', 'SpouseGroundlessAccusation', 'SpouseFraudUndueInfluence',
      'SpouseCauseLegalSeparation', 'SpouseLossParentalAuthority', 'SpouseRefusalToSupport',
    ];
    for (const cause of expectedCauses) {
      expect(DISINHERITANCE_CAUSE_LABELS[cause as keyof typeof DISINHERITANCE_CAUSE_LABELS]).toBeDefined();
      expect(typeof DISINHERITANCE_CAUSE_LABELS[cause as keyof typeof DISINHERITANCE_CAUSE_LABELS]).toBe('string');
    }
  });

  it('ChildAttemptOnLife references Art. 919(1)', () => {
    expect(DISINHERITANCE_CAUSE_LABELS.ChildAttemptOnLife).toContain('Art. 919(1)');
  });

  it('ParentAbandonmentCorruption references Art. 920(1)', () => {
    expect(DISINHERITANCE_CAUSE_LABELS.ParentAbandonmentCorruption).toContain('Art. 920(1)');
  });

  it('SpouseAttemptOnLife references Art. 921(1)', () => {
    expect(DISINHERITANCE_CAUSE_LABELS.SpouseAttemptOnLife).toContain('Art. 921(1)');
  });

  it('has 22 total entries covering Art. 919, 920, 921', () => {
    expect(Object.keys(DISINHERITANCE_CAUSE_LABELS).length).toBeGreaterThanOrEqual(22);
  });
});

// ── getNodeRole ──────────────────────────────────────────────────────────

describe('tree-tab > getNodeRole', () => {
  const emptyShares: InheritanceShare[] = [];
  const emptyDisinherited = new Set<string>();

  it('returns "disinherited" when person is in disinheritedIds', () => {
    const person = makePerson({ id: 'lc1' });
    const disinheritedIds = new Set(['lc1']);
    expect(getNodeRole(person, emptyShares, disinheritedIds)).toBe('disinherited');
  });

  it('returns "unworthy" when person is_unworthy and not condoned', () => {
    const person = makePerson({ id: 'lc1', is_unworthy: true, unworthiness_condoned: false });
    expect(getNodeRole(person, emptyShares, emptyDisinherited)).toBe('unworthy');
  });

  it('does NOT return "unworthy" when unworthiness_condoned is true', () => {
    const person = makePerson({ id: 'lc1', is_unworthy: true, unworthiness_condoned: true });
    // Falls through to next checks — with no share, will be zero-share
    expect(getNodeRole(person, emptyShares, emptyDisinherited)).not.toBe('unworthy');
  });

  it('returns "renounced" when person has_renounced', () => {
    const person = makePerson({ id: 'lc1', has_renounced: true });
    expect(getNodeRole(person, emptyShares, emptyDisinherited)).toBe('renounced');
  });

  it('returns "predeceased" when person is not alive at succession', () => {
    const person = makePerson({ id: 'lc1', is_alive_at_succession: false });
    expect(getNodeRole(person, emptyShares, emptyDisinherited)).toBe('predeceased');
  });

  it('returns "surviving-spouse" for SurvivingSpouse with a share', () => {
    const person = makePerson({ id: 'sp', relationship_to_decedent: 'SurvivingSpouse' });
    const shares = [makeShare({ heir_id: 'sp', total: { centavos: 100000000 } })];
    expect(getNodeRole(person, shares, emptyDisinherited)).toBe('surviving-spouse');
  });

  it('returns "zero-share" for SurvivingSpouse without a share', () => {
    const person = makePerson({ id: 'sp', relationship_to_decedent: 'SurvivingSpouse' });
    expect(getNodeRole(person, emptyShares, emptyDisinherited)).toBe('zero-share');
  });

  it('returns "active-heir" for person with non-zero share', () => {
    const person = makePerson({ id: 'lc1' });
    const shares = [makeShare({ heir_id: 'lc1', total: { centavos: 50000000 } })];
    expect(getNodeRole(person, shares, emptyDisinherited)).toBe('active-heir');
  });

  it('returns "zero-share" for person with share of 0 centavos', () => {
    const person = makePerson({ id: 'lc1' });
    const shares = [makeShare({ heir_id: 'lc1', total: { centavos: 0 } })];
    expect(getNodeRole(person, shares, emptyDisinherited)).toBe('zero-share');
  });

  it('returns "zero-share" for person with no share at all', () => {
    const person = makePerson({ id: 'lc1' });
    expect(getNodeRole(person, emptyShares, emptyDisinherited)).toBe('zero-share');
  });

  it('disinherited takes priority over unworthy', () => {
    const person = makePerson({ id: 'lc1', is_unworthy: true });
    const disinheritedIds = new Set(['lc1']);
    expect(getNodeRole(person, emptyShares, disinheritedIds)).toBe('disinherited');
  });

  it('disinherited takes priority over renounced', () => {
    const person = makePerson({ id: 'lc1', has_renounced: true });
    const disinheritedIds = new Set(['lc1']);
    expect(getNodeRole(person, emptyShares, disinheritedIds)).toBe('disinherited');
  });

  it('unworthy takes priority over predeceased', () => {
    const person = makePerson({ id: 'lc1', is_unworthy: true, is_alive_at_succession: false });
    expect(getNodeRole(person, emptyShares, emptyDisinherited)).toBe('unworthy');
  });

  it('handles share centavos as string', () => {
    const person = makePerson({ id: 'lc1' });
    const shares = [makeShare({ heir_id: 'lc1', total: { centavos: '50000000' } })];
    expect(getNodeRole(person, shares, emptyDisinherited)).toBe('active-heir');
  });
});

// ── formatShareAmount ────────────────────────────────────────────────────

describe('tree-tab > formatShareAmount', () => {
  it('formats centavos as Philippine Peso string', () => {
    expect(formatShareAmount(120000000)).toBe('₱1,200,000');
  });

  it('formats zero centavos', () => {
    expect(formatShareAmount(0)).toBe('₱0');
  });

  it('includes centavos when non-zero', () => {
    expect(formatShareAmount(12345)).toBe('₱123.45');
  });

  it('handles string centavos input', () => {
    expect(formatShareAmount('120000000')).toBe('₱1,200,000');
  });

  it('formats with comma separators for large amounts', () => {
    expect(formatShareAmount(500000000)).toBe('₱5,000,000');
  });

  it('handles small amounts (< 100 centavos)', () => {
    expect(formatShareAmount(50)).toBe('₱0.50');
  });

  it('pads single-digit centavos with leading zero', () => {
    expect(formatShareAmount(105)).toBe('₱1.05');
  });
});

// ── findSpouse ───────────────────────────────────────────────────────────

describe('tree-tab > findSpouse', () => {
  it('returns the SurvivingSpouse when present', () => {
    const tree = [
      makePerson({ id: 'lc1', relationship_to_decedent: 'LegitimateChild' }),
      makePerson({ id: 'sp', name: 'Ana Reyes', relationship_to_decedent: 'SurvivingSpouse' }),
    ];
    const spouse = findSpouse(tree);
    expect(spouse).not.toBeNull();
    expect(spouse!.id).toBe('sp');
    expect(spouse!.name).toBe('Ana Reyes');
  });

  it('returns null when no SurvivingSpouse exists', () => {
    const tree = [
      makePerson({ id: 'lc1', relationship_to_decedent: 'LegitimateChild' }),
      makePerson({ id: 'lc2', relationship_to_decedent: 'LegitimateChild' }),
    ];
    expect(findSpouse(tree)).toBeNull();
  });

  it('returns null for empty family tree', () => {
    expect(findSpouse([])).toBeNull();
  });
});

// ── buildTreeData ────────────────────────────────────────────────────────

describe('tree-tab > buildTreeData', () => {
  it('returns root node with decedent name and role', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const tree = buildTreeData(input, output);

    expect(tree.name).toBe('Juan dela Cruz');
    expect(tree.role).toBe('decedent');
    expect(tree.personId).toBe('d');
  });

  it('builds correct number of child nodes for decedent', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const tree = buildTreeData(input, output);

    // lc1 and lc2 are children of decedent; sp is spouse (handled separately)
    expect(tree.children).toBeDefined();
    // Spouse is excluded from children (SurvivingSpouse filtered)
    const childNames = tree.children!.map(c => c.name);
    expect(childNames).toContain('Maria dela Cruz');
    expect(childNames).toContain('Jose dela Cruz');
  });

  it('does not include spouse as a child node', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const tree = buildTreeData(input, output);

    const childNames = tree.children?.map(c => c.name) ?? [];
    expect(childNames).not.toContain('Cora Reyes');
  });

  it('assigns active-heir role to children with shares', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const tree = buildTreeData(input, output);

    const maria = tree.children!.find(c => c.name === 'Maria dela Cruz');
    expect(maria).toBeDefined();
    expect(maria!.role).toBe('active-heir');
  });

  it('shows share amount on active-heir nodes', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const tree = buildTreeData(input, output);

    const maria = tree.children!.find(c => c.name === 'Maria dela Cruz');
    expect(maria!.shareAmount).toBeDefined();
    expect(maria!.shareAmount).toContain('₱');
  });

  it('does not show share amount on decedent node', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const tree = buildTreeData(input, output);

    expect(tree.shareAmount).toBeUndefined();
  });

  it('handles predeceased persons correctly', () => {
    const input = createTestInput({
      family_tree: [
        makePerson({ id: 'lc1', name: 'Maria (deceased)', is_alive_at_succession: false }),
        makePerson({ id: 'lc2', name: 'Jose dela Cruz' }),
      ],
    });
    const output = createTestOutput({
      per_heir_shares: [
        makeShare({ heir_id: 'lc2', heir_name: 'Jose dela Cruz', total: { centavos: 250000000 } }),
      ],
    });
    const tree = buildTreeData(input, output);

    const maria = tree.children!.find(c => c.name === 'Maria (deceased)');
    expect(maria).toBeDefined();
    expect(maria!.role).toBe('predeceased');
    expect(maria!.shareAmount).toBeUndefined();
  });

  it('handles disinherited persons in testate case', () => {
    const input = createTestInput({
      family_tree: [
        makePerson({ id: 'lc1', name: 'Maria dela Cruz' }),
        makePerson({ id: 'lc2', name: 'Jose (disinherited)' }),
      ],
      will: {
        institutions: [],
        legacies: [],
        devises: [],
        disinheritances: [{
          heir_reference: { person_id: 'lc2', name: 'Jose (disinherited)', is_collective: false, class_designation: null },
          cause_code: 'ChildAttemptOnLife',
          cause_specified_in_will: true,
          cause_proven: true,
          reconciliation_occurred: false,
        }],
        date_executed: '2023-01-15',
      },
    });
    const output = createTestOutput({
      per_heir_shares: [
        makeShare({ heir_id: 'lc1', heir_name: 'Maria dela Cruz' }),
      ],
    });
    const tree = buildTreeData(input, output);

    const jose = tree.children!.find(c => c.name === 'Jose (disinherited)');
    expect(jose).toBeDefined();
    expect(jose!.role).toBe('disinherited');
  });

  it('builds subtree for grandchildren via representation', () => {
    const input = createTestInput({
      family_tree: [
        makePerson({ id: 'lc1', name: 'Maria (deceased)', is_alive_at_succession: false, children: ['gc1', 'gc2'] }),
        makePerson({ id: 'gc1', name: 'Grandchild A' }),
        makePerson({ id: 'gc2', name: 'Grandchild B' }),
        makePerson({ id: 'lc2', name: 'Jose dela Cruz' }),
      ],
    });
    const output = createTestOutput({
      per_heir_shares: [
        makeShare({ heir_id: 'gc1', heir_name: 'Grandchild A', inherits_by: 'Representation', total: { centavos: 60000000 } }),
        makeShare({ heir_id: 'gc2', heir_name: 'Grandchild B', inherits_by: 'Representation', total: { centavos: 60000000 } }),
        makeShare({ heir_id: 'lc2', heir_name: 'Jose dela Cruz', total: { centavos: 120000000 } }),
      ],
    });
    const tree = buildTreeData(input, output);

    const maria = tree.children!.find(c => c.name === 'Maria (deceased)');
    expect(maria).toBeDefined();
    expect(maria!.role).toBe('predeceased');
    expect(maria!.children).toBeDefined();
    expect(maria!.children).toHaveLength(2);
    expect(maria!.children![0].name).toBe('Grandchild A');
    expect(maria!.children![0].role).toBe('active-heir');
  });

  it('handles empty family tree (escheat case)', () => {
    const input = createTestInput({ family_tree: [] });
    const output = createTestOutput({
      per_heir_shares: [],
      scenario_code: 'I15',
    });
    const tree = buildTreeData(input, output);

    expect(tree.name).toBe('Juan dela Cruz');
    expect(tree.role).toBe('decedent');
    expect(tree.children).toBeUndefined();
  });

  it('assigns personId to every node', () => {
    const input = createTestInput();
    const output = createTestOutput();
    const tree = buildTreeData(input, output);

    expect(tree.personId).toBe('d');
    if (tree.children) {
      for (const child of tree.children) {
        expect(child.personId).toBeDefined();
        expect(typeof child.personId).toBe('string');
      }
    }
  });
});
