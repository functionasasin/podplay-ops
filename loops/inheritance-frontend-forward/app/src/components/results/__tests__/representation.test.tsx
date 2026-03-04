import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DistributionSection } from '../DistributionSection';
import { getRepresentedName } from '../representation';
import type { InheritanceShare, Person, Money } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function zeroMoney(): Money {
  return { centavos: 0 };
}

function createShare(overrides: Partial<InheritanceShare> = {}): InheritanceShare {
  return {
    heir_id: 'lc1',
    heir_name: 'Maria Santos',
    heir_category: 'LegitimateChildGroup',
    inherits_by: 'OwnRight',
    represents: null,
    from_legitime: zeroMoney(),
    from_free_portion: zeroMoney(),
    from_intestate: zeroMoney(),
    total: { centavos: 500000000 },
    legitime_fraction: '',
    legal_basis: [],
    donations_imputed: zeroMoney(),
    gross_entitlement: { centavos: 500000000 },
    net_from_estate: { centavos: 500000000 },
    ...overrides,
  };
}

function createPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'lc1',
    name: 'Maria Santos',
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

function renderDistribution(overrides: {
  shares?: InheritanceShare[];
  persons?: Person[];
} = {}) {
  return render(
    <DistributionSection
      shares={overrides.shares ?? [createShare()]}
      totalCentavos={1000000000}
      successionType="Intestate"
      scenarioCode="I1"
      persons={overrides.persons}
    />,
  );
}

// --------------------------------------------------------------------------
// Tests — getRepresentedName helper
// --------------------------------------------------------------------------

describe('representation > getRepresentedName', () => {
  it('returns null for heir inheriting by OwnRight', () => {
    const share = createShare({ inherits_by: 'OwnRight' });
    const persons = [createPerson()];
    expect(getRepresentedName(share, persons)).toBeNull();
  });

  it('returns correct name when represents references a valid person', () => {
    const share = createShare({
      inherits_by: 'Representation',
      represents: 'p1',
    });
    const persons = [
      createPerson({ id: 'p1', name: 'Juan Santos' }),
    ];
    expect(getRepresentedName(share, persons)).toBe('representing Juan Santos');
  });

  it('returns fallback when represents is null', () => {
    const share = createShare({
      inherits_by: 'Representation',
      represents: null,
    });
    const persons: Person[] = [];
    expect(getRepresentedName(share, persons)).toBe('representing deceased heir');
  });

  it('returns fallback when person not found in persons array', () => {
    const share = createShare({
      inherits_by: 'Representation',
      represents: 'nonexistent-id',
    });
    const persons = [
      createPerson({ id: 'other-id', name: 'Other Person' }),
    ];
    expect(getRepresentedName(share, persons)).toBe('representing deceased heir');
  });
});

// --------------------------------------------------------------------------
// Tests — Representation sub-label rendering in DistributionSection
// --------------------------------------------------------------------------

describe('representation > DistributionSection sub-labels', () => {
  it('shows "↳ representing Juan Santos" sub-label for heir inheriting by representation', () => {
    renderDistribution({
      shares: [
        createShare({
          heir_id: 'gc1',
          heir_name: 'Maria Santos',
          inherits_by: 'Representation',
          represents: 'lc1',
        }),
      ],
      persons: [
        createPerson({ id: 'lc1', name: 'Juan Santos', is_alive_at_succession: false }),
      ],
    });
    expect(screen.getByText(/representing Juan Santos/)).toBeInTheDocument();
  });

  it('does not show representation sub-label for heir inheriting by OwnRight', () => {
    renderDistribution({
      shares: [
        createShare({
          inherits_by: 'OwnRight',
          represents: null,
        }),
      ],
      persons: [createPerson()],
    });
    expect(screen.queryByText(/representing/)).not.toBeInTheDocument();
  });

  it('shows "↳ representing deceased heir" when represents is null', () => {
    renderDistribution({
      shares: [
        createShare({
          heir_id: 'gc1',
          heir_name: 'Ana Santos',
          inherits_by: 'Representation',
          represents: null,
        }),
      ],
      persons: [],
    });
    expect(screen.getByText(/representing deceased heir/)).toBeInTheDocument();
  });

  it('renders the ↳ glyph before the representation text', () => {
    renderDistribution({
      shares: [
        createShare({
          heir_id: 'gc1',
          heir_name: 'Maria Santos',
          inherits_by: 'Representation',
          represents: 'lc1',
        }),
      ],
      persons: [
        createPerson({ id: 'lc1', name: 'Juan Santos' }),
      ],
    });
    expect(screen.getByText(/↳/)).toBeInTheDocument();
  });

  it('applies muted text styling to representation sub-label', () => {
    renderDistribution({
      shares: [
        createShare({
          heir_id: 'gc1',
          heir_name: 'Maria Santos',
          inherits_by: 'Representation',
          represents: 'lc1',
        }),
      ],
      persons: [
        createPerson({ id: 'lc1', name: 'Juan Santos' }),
      ],
    });
    const sublabel = screen.getByText(/↳ representing Juan Santos/);
    expect(sublabel.className).toMatch(/text-sm/);
    expect(sublabel.className).toMatch(/text-muted-foreground/);
  });

  it('shows multiple representation sub-labels for different heirs representing same parent', () => {
    renderDistribution({
      shares: [
        createShare({
          heir_id: 'gc1',
          heir_name: 'Maria Santos',
          inherits_by: 'Representation',
          represents: 'lc1',
          net_from_estate: { centavos: 250000000 },
        }),
        createShare({
          heir_id: 'gc2',
          heir_name: 'Ana Santos',
          inherits_by: 'Representation',
          represents: 'lc1',
          net_from_estate: { centavos: 250000000 },
        }),
      ],
      persons: [
        createPerson({ id: 'lc1', name: 'Juan Santos', is_alive_at_succession: false }),
      ],
    });
    const labels = screen.getAllByText(/representing Juan Santos/);
    expect(labels).toHaveLength(2);
  });
});
