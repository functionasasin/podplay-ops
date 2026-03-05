/**
 * PDF Component Tests — Stage 11
 *
 * Tests for EstatePDF and all sub-section components.
 * Mocks @react-pdf/renderer so components render as HTML in jsdom.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type {
  EngineInput,
  EngineOutput,
  InheritanceShare,
  Person,
  HeirNarrative,
  ComputationLog,
  ManualFlag,
  Money,
} from '../../../types';
import type { FirmProfile } from '../../../lib/firm-profile';
import { defaultFirmProfile } from '../../../lib/firm-profile';

// ---------------------------------------------------------------------------
// Mock Supabase (firm-profile imports supabase which validates env vars)
// ---------------------------------------------------------------------------
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: { from: vi.fn() },
    auth: { getUser: vi.fn() },
  },
}));

// ---------------------------------------------------------------------------
// Mock @react-pdf/renderer — render PDF primitives as HTML elements
// ---------------------------------------------------------------------------
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children, ...props }: any) => (
    <div data-testid="pdf-document" {...props}>{children}</div>
  ),
  Page: ({ children, size, ...props }: any) => (
    <div data-testid="pdf-page" data-size={size} {...props}>{children}</div>
  ),
  View: ({ children, style, ...props }: any) => (
    <div {...props}>{children}</div>
  ),
  Text: ({ children, style, ...props }: any) => (
    <span {...props}>{children}</span>
  ),
  Image: ({ src, ...props }: any) => (
    <img data-testid="pdf-image" src={src} {...props} />
  ),
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles,
  },
}));

// ---------------------------------------------------------------------------
// Imports (must come AFTER vi.mock)
// ---------------------------------------------------------------------------
import { EstatePDF, type PDFExportOptions } from '../EstatePDF';
import { FirmHeaderSection } from '../FirmHeaderSection';
import { CaseSummarySection } from '../CaseSummarySection';
import { DistributionTableSection } from '../DistributionTableSection';
import { PerHeirBreakdownSection } from '../PerHeirBreakdownSection';
import { NarrativesSection } from '../NarrativesSection';
import { ComputationLogSection } from '../ComputationLogSection';
import { WarningsSection } from '../WarningsSection';
import { DisclaimerSection } from '../DisclaimerSection';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function zeroMoney(): Money {
  return { centavos: 0 };
}

function money(pesos: number): Money {
  return { centavos: pesos * 100 };
}

function createShare(overrides: Partial<InheritanceShare> = {}): InheritanceShare {
  return {
    heir_id: 'heir-1',
    heir_name: 'Maria Santos',
    heir_category: 'LegitimateChildGroup',
    inherits_by: 'OwnRight',
    represents: null,
    from_legitime: money(500000),
    from_free_portion: zeroMoney(),
    from_intestate: zeroMoney(),
    total: money(500000),
    legitime_fraction: '1/2',
    legal_basis: ['Art.887', 'Art.888'],
    donations_imputed: zeroMoney(),
    gross_entitlement: money(500000),
    net_from_estate: money(500000),
    ...overrides,
  };
}

function createPerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'person-1',
    name: 'Maria Santos',
    is_alive_at_succession: true,
    relationship_to_decedent: 'LegitimateChild',
    degree: 1,
    line: null,
    children: [],
    filiation_proved: true,
    filiation_proof_type: 'BirthCertificate',
    is_guilty_party_in_legal_separation: false,
    adoption: null,
    is_unworthy: false,
    unworthiness_condoned: false,
    has_renounced: false,
    blood_type: null,
    ...overrides,
  };
}

function createNarrative(overrides: Partial<HeirNarrative> = {}): HeirNarrative {
  return {
    heir_id: 'heir-1',
    heir_name: 'Maria Santos',
    heir_category_label: 'Legitimate Child',
    text: 'Maria Santos receives her legitime share as a legitimate child.',
    ...overrides,
  };
}

function createComputationLog(overrides: Partial<ComputationLog> = {}): ComputationLog {
  return {
    steps: [
      { step_number: 1, step_name: 'Classify', description: 'Classified succession as Intestate' },
      { step_number: 2, step_name: 'Compute', description: 'Computed shares for 2 heirs' },
    ],
    total_restarts: 0,
    final_scenario: 'I1',
    ...overrides,
  };
}

function createWarning(overrides: Partial<ManualFlag> = {}): ManualFlag {
  return {
    category: 'inofficiousness',
    description: 'Testamentary dispositions may impair the legitime.',
    related_heir_id: null,
    ...overrides,
  };
}

function createEngineInput(overrides: Partial<EngineInput> = {}): EngineInput {
  return {
    net_distributable_estate: money(1000000),
    decedent: {
      id: 'decedent-1',
      name: 'Juan dela Cruz',
      date_of_death: '2024-03-15',
      is_married: true,
      date_of_marriage: '1990-06-01',
      marriage_solemnized_in_articulo_mortis: false,
      was_ill_at_marriage: false,
      illness_caused_death: false,
      years_of_cohabitation: 34,
      has_legal_separation: false,
      is_illegitimate: false,
    },
    family_tree: [
      createPerson({ id: 'person-1', name: 'Maria Santos' }),
      createPerson({
        id: 'person-2',
        name: 'Ana Santos',
        relationship_to_decedent: 'SurvivingSpouse',
      }),
    ],
    will: null,
    donations: [],
    config: {
      retroactive_ra_11642: false,
      max_pipeline_restarts: 3,
    },
    ...overrides,
  };
}

function createEngineOutput(overrides: Partial<EngineOutput> = {}): EngineOutput {
  return {
    per_heir_shares: [
      createShare({ heir_id: 'heir-1', heir_name: 'Maria Santos' }),
      createShare({
        heir_id: 'heir-2',
        heir_name: 'Ana Santos',
        heir_category: 'SurvivingSpouseGroup',
        legal_basis: ['Art.892'],
      }),
    ],
    narratives: [
      createNarrative({ heir_id: 'heir-1', heir_name: 'Maria Santos' }),
      createNarrative({
        heir_id: 'heir-2',
        heir_name: 'Ana Santos',
        heir_category_label: 'Surviving Spouse',
        text: 'Ana Santos receives her legitime share as the surviving spouse.',
      }),
    ],
    computation_log: createComputationLog(),
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I1',
    ...overrides,
  };
}

function createProfile(overrides: Partial<FirmProfile> = {}): FirmProfile {
  return {
    ...defaultFirmProfile(),
    firmName: 'Santos & Associates Law',
    firmAddress: '123 Ayala Ave, Makati City',
    counselName: 'Atty. Roberto Santos',
    ibpRollNo: '12345',
    ptrNo: '67890',
    mcleComplianceNo: 'VII-001234',
    ...overrides,
  };
}

function defaultOptions(): PDFExportOptions {
  return {
    includeFirmHeader: true,
    includeFamilyTree: true,
    includeDeadlines: true,
    includeChecklist: true,
  };
}

// ===========================================================================
// EstatePDF (main Document)
// ===========================================================================

describe('pdf', () => {
  describe('EstatePDF', () => {
    it('renders a PDF document without errors', () => {
      const { container } = render(
        <EstatePDF
          input={createEngineInput()}
          output={createEngineOutput()}
          profile={createProfile()}
          options={defaultOptions()}
        />
      );
      expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
      expect(screen.getByTestId('pdf-page')).toBeInTheDocument();
    });

    it('renders A4 page size', () => {
      render(
        <EstatePDF
          input={createEngineInput()}
          output={createEngineOutput()}
          profile={createProfile()}
          options={defaultOptions()}
        />
      );
      expect(screen.getByTestId('pdf-page')).toHaveAttribute('data-size', 'A4');
    });

    it('renders all required sections when firm header is included', () => {
      const { container } = render(
        <EstatePDF
          input={createEngineInput()}
          output={createEngineOutput()}
          profile={createProfile()}
          options={defaultOptions()}
        />
      );
      // Firm header present
      expect(container.textContent).toContain('Santos & Associates Law');
      // Case summary
      expect(container.textContent).toContain('Estate of Juan dela Cruz');
      // Distribution table
      expect(container.textContent).toContain('Distribution of Shares');
      // Per-heir breakdown
      expect(container.textContent).toContain('Per-Heir Breakdown');
      // Disclaimer always present
      expect(container.textContent).toContain('Disclaimer');
      expect(container.textContent).toContain('informational purposes');
    });

    it('omits firm header when option is false', () => {
      const { container } = render(
        <EstatePDF
          input={createEngineInput()}
          output={createEngineOutput()}
          profile={createProfile()}
          options={{ ...defaultOptions(), includeFirmHeader: false }}
        />
      );
      expect(container.textContent).not.toContain('Santos & Associates Law');
    });

    it('omits firm header when profile is null', () => {
      const { container } = render(
        <EstatePDF
          input={createEngineInput()}
          output={createEngineOutput()}
          profile={null}
          options={defaultOptions()}
        />
      );
      expect(container.textContent).not.toContain('Santos & Associates Law');
    });

    it('renders disclaimer section regardless of options', () => {
      const { container } = render(
        <EstatePDF
          input={createEngineInput()}
          output={createEngineOutput()}
          profile={null}
          options={{
            includeFirmHeader: false,
            includeFamilyTree: false,
            includeDeadlines: false,
            includeChecklist: false,
          }}
        />
      );
      expect(container.textContent).toContain('Disclaimer');
      expect(container.textContent).toContain(
        'This report was generated for informational purposes.'
      );
    });
  });

  // ===========================================================================
  // FirmHeaderSection
  // ===========================================================================

  describe('FirmHeaderSection', () => {
    it('renders firm name and address', () => {
      const { container } = render(
        <FirmHeaderSection profile={createProfile()} />
      );
      expect(container.textContent).toContain('Santos & Associates Law');
      expect(container.textContent).toContain('123 Ayala Ave, Makati City');
    });

    it('renders counsel credentials', () => {
      const { container } = render(
        <FirmHeaderSection profile={createProfile()} />
      );
      expect(container.textContent).toContain('Atty. Roberto Santos');
      expect(container.textContent).toContain('IBP Roll No. 12345');
      expect(container.textContent).toContain('PTR No. 67890');
      expect(container.textContent).toContain('MCLE No. VII-001234');
    });

    it('shows logo when logoDataUrl is provided', () => {
      render(
        <FirmHeaderSection
          profile={createProfile()}
          logoDataUrl="data:image/png;base64,abc123"
        />
      );
      const img = screen.getByTestId('pdf-image');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123');
    });

    it('does not render logo when logoDataUrl is null', () => {
      render(
        <FirmHeaderSection profile={createProfile()} logoDataUrl={null} />
      );
      expect(screen.queryByTestId('pdf-image')).not.toBeInTheDocument();
    });

    it('does not render logo when logoDataUrl is omitted', () => {
      render(<FirmHeaderSection profile={createProfile()} />);
      expect(screen.queryByTestId('pdf-image')).not.toBeInTheDocument();
    });

    it('omits counsel line when counselName is empty', () => {
      const { container } = render(
        <FirmHeaderSection
          profile={createProfile({ counselName: '', ibpRollNo: '', ptrNo: '', mcleComplianceNo: '' })}
        />
      );
      expect(container.textContent).not.toContain('IBP Roll No.');
    });

    it('omits firm name when empty', () => {
      const { container } = render(
        <FirmHeaderSection profile={createProfile({ firmName: '' })} />
      );
      // Should still render without errors
      expect(container.textContent).toContain('Atty. Roberto Santos');
    });
  });

  // ===========================================================================
  // CaseSummarySection
  // ===========================================================================

  describe('CaseSummarySection', () => {
    it('renders estate title with decedent name', () => {
      const { container } = render(
        <CaseSummarySection
          input={createEngineInput()}
          output={createEngineOutput()}
        />
      );
      expect(container.textContent).toContain('Estate of Juan dela Cruz');
    });

    it('renders date of death', () => {
      const { container } = render(
        <CaseSummarySection
          input={createEngineInput()}
          output={createEngineOutput()}
        />
      );
      expect(container.textContent).toContain('Date of Death: 2024-03-15');
    });

    it('renders report generated date', () => {
      const { container } = render(
        <CaseSummarySection
          input={createEngineInput()}
          output={createEngineOutput()}
        />
      );
      expect(container.textContent).toContain('Report Generated:');
    });

    it('renders succession type label', () => {
      const { container } = render(
        <CaseSummarySection
          input={createEngineInput()}
          output={createEngineOutput()}
        />
      );
      expect(container.textContent).toContain('Intestate Succession');
    });

    it('renders net distributable estate in peso format', () => {
      const { container } = render(
        <CaseSummarySection
          input={createEngineInput()}
          output={createEngineOutput()}
        />
      );
      expect(container.textContent).toContain('₱1,000,000');
    });
  });

  // ===========================================================================
  // DistributionTableSection
  // ===========================================================================

  describe('DistributionTableSection', () => {
    it('renders correct number of heir rows', () => {
      const shares = [
        createShare({ heir_id: 'h1', heir_name: 'Maria Santos' }),
        createShare({ heir_id: 'h2', heir_name: 'Pedro Santos' }),
        createShare({ heir_id: 'h3', heir_name: 'Ana Santos' }),
      ];
      const { container } = render(<DistributionTableSection shares={shares} />);
      // Each heir name should appear
      expect(container.textContent).toContain('Maria Santos');
      expect(container.textContent).toContain('Pedro Santos');
      expect(container.textContent).toContain('Ana Santos');
    });

    it('renders section heading', () => {
      const { container } = render(
        <DistributionTableSection shares={[createShare()]} />
      );
      expect(container.textContent).toContain('Distribution of Shares');
    });

    it('renders table column headers', () => {
      const { container } = render(
        <DistributionTableSection shares={[createShare()]} />
      );
      expect(container.textContent).toContain('Heir');
      expect(container.textContent).toContain('Relationship');
      expect(container.textContent).toContain('Mode');
      expect(container.textContent).toContain('Net Share');
    });

    it('renders heir relationship category label', () => {
      const { container } = render(
        <DistributionTableSection
          shares={[createShare({ heir_category: 'SurvivingSpouseGroup' })]}
        />
      );
      expect(container.textContent).toContain('Surviving Spouse');
    });

    it('renders inheritance mode (OwnRight)', () => {
      const { container } = render(
        <DistributionTableSection
          shares={[createShare({ inherits_by: 'OwnRight' })]}
        />
      );
      expect(container.textContent).toContain('OwnRight');
    });

    it('renders inheritance mode (Representation)', () => {
      const { container } = render(
        <DistributionTableSection
          shares={[createShare({ inherits_by: 'Representation' })]}
        />
      );
      expect(container.textContent).toContain('Representation');
    });

    it('renders formatted peso amount for net share', () => {
      const { container } = render(
        <DistributionTableSection
          shares={[createShare({ net_from_estate: money(1234567) })]}
        />
      );
      expect(container.textContent).toContain('₱1,234,567');
    });

    it('renders empty table when no shares', () => {
      const { container } = render(<DistributionTableSection shares={[]} />);
      expect(container.textContent).toContain('Distribution of Shares');
      // Should still render header but no data rows
    });

    it('renders 10 heir rows for a large estate', () => {
      const shares = Array.from({ length: 10 }, (_, i) =>
        createShare({ heir_id: `h${i}`, heir_name: `Heir ${i + 1}` })
      );
      const { container } = render(<DistributionTableSection shares={shares} />);
      for (let i = 1; i <= 10; i++) {
        expect(container.textContent).toContain(`Heir ${i}`);
      }
    });
  });

  // ===========================================================================
  // PerHeirBreakdownSection
  // ===========================================================================

  describe('PerHeirBreakdownSection', () => {
    it('renders per-heir heading', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare()]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('Per-Heir Breakdown');
    });

    it('renders heir name in breakdown', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ heir_name: 'Maria Santos' })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('Maria Santos');
    });

    it('renders from_legitime when non-zero', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ from_legitime: money(300000) })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('From Legitime');
      expect(container.textContent).toContain('₱300,000');
    });

    it('hides from_legitime when zero', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ from_legitime: zeroMoney() })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).not.toContain('From Legitime');
    });

    it('renders from_free_portion when non-zero', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ from_free_portion: money(200000) })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('From Free Portion');
    });

    it('hides from_free_portion when zero', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ from_free_portion: zeroMoney() })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).not.toContain('From Free Portion');
    });

    it('renders gross entitlement always', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ gross_entitlement: money(500000) })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('Gross Entitlement');
      expect(container.textContent).toContain('₱500,000');
    });

    it('renders net from estate always', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ net_from_estate: money(450000) })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('Net From Estate');
      expect(container.textContent).toContain('₱450,000');
    });

    it('renders donations imputed with negative sign when > 0', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ donations_imputed: money(50000) })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('Donations Imputed');
      expect(container.textContent).toMatch(/-.*₱50,000/);
    });

    it('hides donations imputed when zero', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ donations_imputed: zeroMoney() })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).not.toContain('Donations Imputed');
    });

    it('renders legitime fraction when present', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ legitime_fraction: '1/2' })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('Legitime Fraction: 1/2');
    });

    it('hides legitime fraction when "0/1"', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ legitime_fraction: '0/1' })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).not.toContain('Legitime Fraction');
    });

    it('includes statute citations with full NCC article descriptions', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ legal_basis: ['Art.887', 'Art.888'] })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).toContain('Legal Basis');
      expect(container.textContent).toContain('Art.887');
      expect(container.textContent).toContain('Art.888');
    });

    it('renders multiple heirs with separate breakdown blocks', () => {
      const shares = [
        createShare({ heir_id: 'h1', heir_name: 'Maria Santos' }),
        createShare({ heir_id: 'h2', heir_name: 'Pedro Santos' }),
      ];
      const { container } = render(
        <PerHeirBreakdownSection shares={shares} persons={[createPerson()]} />
      );
      expect(container.textContent).toContain('Maria Santos');
      expect(container.textContent).toContain('Pedro Santos');
    });

    it('handles empty legal_basis gracefully', () => {
      const { container } = render(
        <PerHeirBreakdownSection
          shares={[createShare({ legal_basis: [] })]}
          persons={[createPerson()]}
        />
      );
      expect(container.textContent).not.toContain('Legal Basis');
    });
  });

  // ===========================================================================
  // NarrativesSection
  // ===========================================================================

  describe('NarrativesSection', () => {
    it('renders heading and narratives', () => {
      const narratives = [
        createNarrative({ heir_name: 'Maria Santos', text: 'Maria gets her share.' }),
      ];
      const { container } = render(<NarrativesSection narratives={narratives} />);
      expect(container.textContent).toContain('Heir Narratives');
      expect(container.textContent).toContain('Maria Santos');
      expect(container.textContent).toContain('Maria gets her share.');
    });

    it('renders multiple narratives', () => {
      const narratives = [
        createNarrative({ heir_id: 'h1', heir_name: 'Maria Santos', text: 'Narrative 1' }),
        createNarrative({ heir_id: 'h2', heir_name: 'Pedro Santos', text: 'Narrative 2' }),
      ];
      const { container } = render(<NarrativesSection narratives={narratives} />);
      expect(container.textContent).toContain('Narrative 1');
      expect(container.textContent).toContain('Narrative 2');
    });

    it('returns null when narratives array is empty', () => {
      const { container } = render(<NarrativesSection narratives={[]} />);
      expect(container.textContent).toBe('');
    });
  });

  // ===========================================================================
  // ComputationLogSection
  // ===========================================================================

  describe('ComputationLogSection', () => {
    it('renders computation log heading', () => {
      const { container } = render(
        <ComputationLogSection log={createComputationLog()} />
      );
      expect(container.textContent).toContain('Computation Log');
    });

    it('renders each step with number and description', () => {
      const { container } = render(
        <ComputationLogSection log={createComputationLog()} />
      );
      expect(container.textContent).toContain('1. Classify');
      expect(container.textContent).toContain('Classified succession as Intestate');
      expect(container.textContent).toContain('2. Compute');
    });

    it('renders final scenario and restart count', () => {
      const { container } = render(
        <ComputationLogSection
          log={createComputationLog({ final_scenario: 'I3', total_restarts: 2 })}
        />
      );
      expect(container.textContent).toContain('Final Scenario: I3');
      expect(container.textContent).toContain('Restarts: 2');
    });
  });

  // ===========================================================================
  // WarningsSection
  // ===========================================================================

  describe('WarningsSection', () => {
    it('renders warnings with category and description', () => {
      const warnings = [
        createWarning({ category: 'preterition', description: 'A compulsory heir was preterited.' }),
      ];
      const { container } = render(<WarningsSection warnings={warnings} />);
      expect(container.textContent).toContain('Warnings');
      expect(container.textContent).toContain('[preterition]');
      expect(container.textContent).toContain('A compulsory heir was preterited.');
    });

    it('renders multiple warnings', () => {
      const warnings = [
        createWarning({ category: 'preterition', description: 'Warning 1' }),
        createWarning({ category: 'inofficiousness', description: 'Warning 2' }),
      ];
      const { container } = render(<WarningsSection warnings={warnings} />);
      expect(container.textContent).toContain('[preterition] Warning 1');
      expect(container.textContent).toContain('[inofficiousness] Warning 2');
    });

    it('returns null when warnings array is empty', () => {
      const { container } = render(<WarningsSection warnings={[]} />);
      expect(container.textContent).toBe('');
    });
  });

  // ===========================================================================
  // DisclaimerSection
  // ===========================================================================

  describe('DisclaimerSection', () => {
    it('always renders disclaimer heading', () => {
      const { container } = render(<DisclaimerSection />);
      expect(container.textContent).toContain('Disclaimer');
    });

    it('renders the full disclaimer text', () => {
      const { container } = render(<DisclaimerSection />);
      expect(container.textContent).toContain(
        'This report was generated for informational purposes. Consult a licensed attorney for final estate settlement advice.'
      );
    });
  });
});
