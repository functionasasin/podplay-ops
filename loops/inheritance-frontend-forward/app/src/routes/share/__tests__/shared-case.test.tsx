import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SharedCaseData } from '@/lib/share';
import type { EngineInput, EngineOutput } from '@/types';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

const mockGetSharedCase = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/lib/share', () => ({
  getSharedCase: (...args: unknown[]) => mockGetSharedCase(...args),
  toggleShare: vi.fn(),
}));

// Mock WASM bridge
vi.mock('@/wasm/bridge', () => ({
  compute: vi.fn().mockResolvedValue({
    per_heir_shares: [],
    narratives: [],
    computation_log: { steps: [], total_restarts: 0, final_scenario: 'I1' },
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I1',
  }),
}));

// We test the SharedCasePage component in isolation
// Since TanStack Router provides the token param, we'll create
// a test wrapper that renders the page directly
import { SharedCasePage } from '../$token';

// --------------------------------------------------------------------------
// Test data
// --------------------------------------------------------------------------

const mockInput: EngineInput = {
  net_distributable_estate: { centavos: 10000000 },
  decedent: {
    id: 'p1',
    name: 'Juan dela Cruz',
    date_of_death: '2024-03-15',
    is_married: true,
    date_of_marriage: '1990-01-01',
    marriage_solemnized_in_articulo_mortis: false,
    was_ill_at_marriage: false,
    illness_caused_death: false,
    years_of_cohabitation: 34,
    has_legal_separation: false,
    is_illegitimate: false,
  },
  family_tree: [
    {
      id: 'h1',
      name: 'Maria dela Cruz',
      is_alive_at_succession: true,
      relationship_to_decedent: 'SurvivingSpouse',
      degree: 0,
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
    },
  ],
  will: null,
  donations: [],
  config: { retroactive_ra_11642: false, max_pipeline_restarts: 5 },
};

const mockOutput: EngineOutput = {
  per_heir_shares: [
    {
      heir_id: 'h1',
      heir_name: 'Maria dela Cruz',
      heir_category: 'SurvivingSpouseGroup',
      inherits_by: 'OwnRight',
      represents: null,
      from_legitime: { centavos: 5000000 },
      from_free_portion: { centavos: 0 },
      from_intestate: { centavos: 5000000 },
      total: { centavos: 10000000 },
      legitime_fraction: '1/2',
      legal_basis: ['Art.887', 'Art.996'],
      donations_imputed: { centavos: 0 },
      gross_entitlement: { centavos: 10000000 },
      net_from_estate: { centavos: 10000000 },
    },
  ],
  narratives: [
    {
      heir_id: 'h1',
      heir_name: 'Maria dela Cruz',
      heir_category_label: 'Surviving Spouse',
      text: 'Maria dela Cruz receives the entire estate.',
    },
  ],
  computation_log: {
    steps: [{ step_number: 1, step_name: 'Classify', description: 'Classify heirs' }],
    total_restarts: 0,
    final_scenario: 'I4',
  },
  warnings: [],
  succession_type: 'Intestate',
  scenario_code: 'I4',
};

const sharedCaseData: SharedCaseData = {
  title: 'Estate of Juan dela Cruz',
  status: 'computed',
  input_json: mockInput,
  output_json: mockOutput,
  decedent_name: 'Juan dela Cruz',
  date_of_death: '2024-03-15',
};

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('shareable > SharedCasePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading shared case data', () => {
    it('calls getSharedCase with the token', async () => {
      mockGetSharedCase.mockResolvedValue(sharedCaseData);

      render(<SharedCasePage token="test-token-123" />);

      await waitFor(() => {
        expect(mockGetSharedCase).toHaveBeenCalledWith('test-token-123');
      });
    });

    it('shows loading state while fetching', () => {
      mockGetSharedCase.mockReturnValue(new Promise(() => {})); // never resolves

      render(<SharedCasePage token="test-token-123" />);

      expect(screen.getByTestId('shared-case-loading')).toBeInTheDocument();
    });

    it('shows error state for invalid/expired token', async () => {
      mockGetSharedCase.mockResolvedValue(null);

      render(<SharedCasePage token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('shared-case-not-found')).toBeInTheDocument();
      });
    });

    it('renders case content when data loads', async () => {
      mockGetSharedCase.mockResolvedValue(sharedCaseData);

      render(<SharedCasePage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('shared-case-content')).toBeInTheDocument();
      });
    });
  });

  describe('hidden controls in shared view', () => {
    it('hides edit controls (ActionsBar)', async () => {
      mockGetSharedCase.mockResolvedValue(sharedCaseData);

      render(<SharedCasePage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('shared-case-content')).toBeInTheDocument();
      });

      // ActionsBar should not be present in shared view
      expect(screen.queryByTestId('actions-bar')).not.toBeInTheDocument();
    });

    it('hides case notes panel', async () => {
      mockGetSharedCase.mockResolvedValue(sharedCaseData);

      render(<SharedCasePage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('shared-case-content')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('case-notes-panel')).not.toBeInTheDocument();
    });

    it('does not show share button in shared view', async () => {
      mockGetSharedCase.mockResolvedValue(sharedCaseData);

      render(<SharedCasePage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('shared-case-content')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('share-button')).not.toBeInTheDocument();
    });
  });

  describe('displays case information', () => {
    it('shows decedent name in header', async () => {
      mockGetSharedCase.mockResolvedValue(sharedCaseData);

      render(<SharedCasePage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('shared-case-content')).toBeInTheDocument();
      });

      // "Estate of Juan dela Cruz" appears in both card title and content
      const matches = screen.getAllByText(/Juan dela Cruz/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('shows read-only badge or indicator', async () => {
      mockGetSharedCase.mockResolvedValue(sharedCaseData);

      render(<SharedCasePage token="valid-token" />);

      await waitFor(() => {
        expect(screen.getByTestId('shared-case-content')).toBeInTheDocument();
      });

      expect(screen.getByTestId('read-only-badge')).toBeInTheDocument();
    });
  });
});
