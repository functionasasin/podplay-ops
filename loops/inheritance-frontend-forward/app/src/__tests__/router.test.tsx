/**
 * Stage 2 — Router + Layout tests.
 *
 * Tests TanStack Router route tree, AppLayout navigation,
 * and page rendering for each route.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router';
import { rootRoute } from '../routes/__root';
import { indexRoute } from '../routes/index';
import { authRoute } from '../routes/auth';
import { casesNewRoute } from '../routes/cases/new';
import { caseIdRoute } from '../routes/cases/$caseId';
import { clientsRoute } from '../routes/clients/index';
import { deadlinesRoute } from '../routes/deadlines';
import { settingsRoute } from '../routes/settings/index';
import { shareTokenRoute } from '../routes/share/$token';

// Mock supabase — share/$token imports share lib which imports supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      onAuthStateChange: vi.fn((callback: (event: string, session: null) => void) => {
        // Invoke callback immediately with no session (unauthenticated)
        setTimeout(() => callback('INITIAL_SESSION', null), 0);
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      signInWithOtp: vi.fn(),
    },
  },
}));

// Mock share lib — share/$token uses getSharedCase
vi.mock('../lib/share', () => ({
  getSharedCase: vi.fn().mockResolvedValue(null),
  toggleShare: vi.fn(),
}));

// Mock the WASM bridge — /cases/new imports compute()
vi.mock('../wasm/bridge', () => ({
  compute: vi.fn().mockResolvedValue({
    per_heir_shares: [],
    narratives: [],
    computation_log: { steps: [], total_restarts: 0, final_scenario: 'I1' },
    warnings: [],
    succession_type: 'Intestate',
    scenario_code: 'I1',
  }),
}));

// Mock cases lib — /cases/$caseId imports loadCase
vi.mock('../lib/cases', () => ({
  loadCase: vi.fn().mockRejectedValue(new Error('Not found')),
  updateCaseInput: vi.fn(),
  updateCaseOutput: vi.fn(),
  createCase: vi.fn(),
  listCases: vi.fn().mockResolvedValue([]),
  deleteCase: vi.fn(),
  isValidStatusTransition: vi.fn(),
  updateCaseStatus: vi.fn(),
}));

// Mock clients lib — /clients imports listClients
vi.mock('../lib/clients', () => ({
  listClients: vi.fn().mockResolvedValue([]),
  createClient: vi.fn(),
  loadClient: vi.fn().mockRejectedValue(new Error('Not found')),
  updateClient: vi.fn(),
  deleteClient: vi.fn(),
}));

// Mock organizations lib — clients route uses useOrganization
vi.mock('../lib/organizations', () => ({
  getUserOrganization: vi.fn().mockResolvedValue(null),
  listMembers: vi.fn().mockResolvedValue([]),
  inviteMember: vi.fn(),
  removeMember: vi.fn(),
  updateMemberRole: vi.fn(),
  revokeInvitation: vi.fn(),
}));

// Mock firm-profile lib — settings route uses FirmProfileProvider
vi.mock('../lib/firm-profile', () => ({
  defaultFirmProfile: vi.fn(() => ({
    firmName: null,
    firmAddress: null,
    firmPhone: null,
    firmEmail: null,
    counselName: null,
    counselEmail: null,
    counselPhone: null,
    ibpRollNo: null,
    ptrNo: null,
    mcleComplianceNo: null,
    logoUrl: null,
    letterheadColor: '#1E3A5F',
    secondaryColor: '#C9A84C',
  })),
  loadFirmProfile: vi.fn().mockResolvedValue({
    firmName: null,
    firmAddress: null,
    firmPhone: null,
    firmEmail: null,
    counselName: null,
    counselEmail: null,
    counselPhone: null,
    ibpRollNo: null,
    ptrNo: null,
    mcleComplianceNo: null,
    logoUrl: null,
    letterheadColor: '#1E3A5F',
    secondaryColor: '#C9A84C',
  }),
  saveFirmProfile: vi.fn(),
  uploadLogo: vi.fn(),
  deleteLogo: vi.fn(),
  validateLogoFile: vi.fn(),
  ALLOWED_LOGO_TYPES: ['image/png', 'image/jpeg', 'image/svg+xml'],
  MAX_LOGO_SIZE_BYTES: 2 * 1024 * 1024,
  DEFAULT_LETTERHEAD_COLOR: '#1E3A5F',
  DEFAULT_SECONDARY_COLOR: '#C9A84C',
}));

// ---------------------------------------------------------------------------
// Test helper: render a route with memory history
// ---------------------------------------------------------------------------

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  casesNewRoute,
  caseIdRoute,
  clientsRoute,
  deadlinesRoute,
  settingsRoute,
  shareTokenRoute,
]);

async function renderRoute(path: string) {
  const memoryHistory = createMemoryHistory({ initialEntries: [path] });
  const testRouter = createRouter({ routeTree, history: memoryHistory });

  const result = render(<RouterProvider router={testRouter} />);

  // Wait for the router to finish loading (TanStack Router is async)
  await waitFor(() => {
    expect(testRouter.state.status).toBe('idle');
  });

  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('router > root layout', () => {
  it('renders layout with sidebar navigation links', async () => {
    await renderRoute('/');

    // Sidebar nav items from AppLayout — some labels also appear as page headings,
    // so use getAllByText and check at least 1 match
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('New Case').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Clients').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Deadlines').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the app branding in sidebar', async () => {
    await renderRoute('/');

    expect(screen.getByText('Inheritance')).toBeInTheDocument();
    expect(screen.getByText('Philippine Succession Law')).toBeInTheDocument();
  });
});

describe('router > index route (/)', () => {
  it('renders the dashboard page at /', async () => {
    await renderRoute('/');

    // The dashboard heading from indexRoute component
    const headings = screen.getAllByText('Dashboard');
    // At least the page heading should be present (nav may also show "Dashboard")
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('shows sign-in prompt on dashboard', async () => {
    await renderRoute('/');

    expect(
      screen.getByText(/sign in to view your cases/i),
    ).toBeInTheDocument();
  });
});

describe('router > /cases/new renders wizard', () => {
  it('renders the wizard container at /cases/new', async () => {
    await renderRoute('/cases/new');

    // The WizardContainer is rendered — it has a "Decedent Information" step
    // or similar content from the wizard
    await waitFor(() => {
      // The wizard should render some form content
      const main = document.querySelector('main');
      expect(main).toBeTruthy();
      expect(main!.innerHTML.length).toBeGreaterThan(0);
    });
  });
});

describe('router > /auth renders login page', () => {
  it('renders the sign-in card at /auth', async () => {
    await renderRoute('/auth');

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(
      screen.getByText(/sign in to save cases and access premium features/i),
    ).toBeInTheDocument();
  });
});

describe('router > /share/:token renders without auth', () => {
  it('renders the shared case page at /share/:token', async () => {
    await renderRoute('/share/abc-123-test');

    // Route renders — shows loading or not-found state (mock returns null)
    await waitFor(() => {
      const loading = screen.queryByTestId('shared-case-loading');
      const notFound = screen.queryByTestId('shared-case-not-found');
      expect(loading ?? notFound).toBeTruthy();
    });
  });

  it('does not require authentication for shared view', async () => {
    // The share route should render directly without redirect
    await renderRoute('/share/some-token-value');

    // Should show the shared case content, not the auth page
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    // Route renders without auth gate — shows loading or not-found
    await waitFor(() => {
      const loading = screen.queryByTestId('shared-case-loading');
      const notFound = screen.queryByTestId('shared-case-not-found');
      expect(loading ?? notFound).toBeTruthy();
    });
  });
});

describe('router > /cases/:caseId renders case editor', () => {
  it('renders case editor page for a given case ID', async () => {
    await renderRoute('/cases/case-42');

    // The case editor loads the case asynchronously — shows loading or error state
    await waitFor(() => {
      // Either a loading spinner or error message should be present
      const hasContent = document.querySelector('main')?.innerHTML.length ?? 0;
      expect(hasContent).toBeGreaterThan(0);
    });
  });
});

describe('router > authenticated routes show sign-in prompt', () => {
  it('/clients renders sign-in prompt when unauthenticated', async () => {
    await renderRoute('/clients');

    // "Clients" appears in both sidebar nav and page heading
    expect(screen.getAllByText('Clients').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/sign in to manage your clients/i)).toBeInTheDocument();
  });

  it('/deadlines renders sign-in prompt when unauthenticated', async () => {
    await renderRoute('/deadlines');

    // "Deadlines" appears in both sidebar nav and page heading
    expect(screen.getAllByText('Deadlines').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/sign in to view your settlement deadlines/i)).toBeInTheDocument();
  });

  it('/settings renders sign-in prompt when unauthenticated', async () => {
    await renderRoute('/settings');

    // "Settings" appears in both sidebar nav and page heading
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/sign in to manage your firm settings/i)).toBeInTheDocument();
  });
});

describe('layout > navigation structure', () => {
  it('sidebar contains exactly 5 nav items', async () => {
    await renderRoute('/');

    // The sidebar nav should have links for Dashboard, New Case, Clients, Deadlines, Settings
    const sidebar = document.querySelector('aside nav');
    expect(sidebar).toBeTruthy();
    const links = sidebar!.querySelectorAll('a');
    expect(links).toHaveLength(5);
  });

  it('sidebar links point to correct paths', async () => {
    await renderRoute('/');

    const sidebar = document.querySelector('aside nav');
    expect(sidebar).toBeTruthy();
    const links = Array.from(sidebar!.querySelectorAll('a'));
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/');
    expect(hrefs).toContain('/cases/new');
    expect(hrefs).toContain('/clients');
    expect(hrefs).toContain('/deadlines');
    expect(hrefs).toContain('/settings');
  });
});
