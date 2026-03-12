// Tests: intake submit logic
// Mocks Supabase update, generateBom, and showToast.
// Verifies project row update payload, BOM generation call, status change, and toasts.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const PROJECT_ID = 'test-project-id';

const FUTURE_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
})();

// --- Hoist mock helpers ---
const { mockEq, mockUpdate, mockInsert, mockInstallersSelect, mockFrom, mockGenerateBom, mockShowToast } =
  vi.hoisted(() => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn(() => ({ eq: mockEq }));
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockInstallersSelect = vi.fn().mockResolvedValue({
      data: [{ id: 'inst-1', name: 'Test Installer', regions: ['Denver, CO'] }],
    });
    // projects select chain: .select(...).eq(...).single()
    const mockProjectsSingle = vi.fn().mockResolvedValue({ data: { wizard_step: 0, project_status: 'intake' }, error: null });
    const mockProjectsEq = vi.fn(() => ({ single: mockProjectsSingle }));
    const mockProjectsSelect = vi.fn(() => ({ eq: mockProjectsEq }));
    const mockFrom = vi.fn((table: string) => {
      if (table === 'installers') return { select: mockInstallersSelect };
      if (table === 'invoices') return { insert: mockInsert };
      if (table === 'projects') return { select: mockProjectsSelect, update: mockUpdate };
      return { update: mockUpdate };
    });
    const mockGenerateBom = vi.fn().mockResolvedValue({ count: 5, error: null });
    const mockShowToast = vi.fn();
    return { mockEq, mockUpdate, mockInsert, mockInstallersSelect, mockFrom, mockGenerateBom, mockShowToast };
  });

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@/services/bom', () => ({
  generateBom: mockGenerateBom,
}));

vi.mock('@/lib/toast', () => ({
  showToast: mockShowToast,
}));

const mockNavigateFn = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => ({
    ...config,
    useParams: vi.fn(() => ({ projectId: PROJECT_ID })),
  }),
  useNavigate: () => mockNavigateFn,
}));

import { Route } from '@/routes/_auth/projects/$projectId/intake';

function getIntakePage(): React.ComponentType {
  return (Route as unknown as { component: React.ComponentType }).component;
}

/** Fill all 6 wizard steps and land on the Review step. */
async function renderAndNavigateToReview() {
  const locationStub = { href: '' };
  vi.stubGlobal('location', locationStub);

  render(React.createElement(getIntakePage()));

  // Step 0: Customer Info
  fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Acme Corp' } });
  fireEvent.change(screen.getByLabelText(/contact email/i), { target: { value: 'acme@test.com' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 1: Venue Config
  await waitFor(() => expect(screen.getByLabelText(/venue address/i)).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/venue address/i), { target: { value: '123 Main St' } });
  fireEvent.change(screen.getByLabelText(/court count/i), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText(/door count/i), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText(/camera count/i), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 2: Tier Selection
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Pro' })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 3: ISP Info — SearchableSelect + custom input for "Other"
  await waitFor(() => expect(screen.getByPlaceholderText(/select isp provider/i)).toBeInTheDocument());
  fireEvent.focus(screen.getByPlaceholderText(/select isp provider/i));
  await waitFor(() => expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument());
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Other' }));
  await waitFor(() => expect(screen.getByPlaceholderText(/enter custom isp name/i)).toBeInTheDocument());
  fireEvent.change(screen.getByPlaceholderText(/enter custom isp name/i), { target: { value: 'Xfinity' } });
  fireEvent.change(screen.getByLabelText(/upload speed/i), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText(/download speed/i), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 4: Installer Selection — SearchableSelect
  await waitFor(() => expect(screen.getByPlaceholderText(/select an installer/i)).toBeInTheDocument());
  fireEvent.focus(screen.getByPlaceholderText(/select an installer/i));
  await waitFor(() => expect(screen.getByRole('option', { name: /test installer/i })).toBeInTheDocument());
  fireEvent.mouseDown(screen.getByRole('option', { name: /test installer/i }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 5: Financial Setup
  await waitFor(() => expect(screen.getByLabelText(/target go-live date/i)).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/target go-live date/i), { target: { value: FUTURE_DATE } });
  fireEvent.change(screen.getByLabelText(/deposit amount/i), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 6: Review — wait for the submit button to appear
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument(),
  );

  return locationStub;
}

beforeEach(() => {
  mockEq.mockClear();
  mockUpdate.mockClear();
  mockInsert.mockClear();
  mockInstallersSelect.mockClear();
  mockFrom.mockClear();
  mockGenerateBom.mockClear();
  mockShowToast.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// 1. Project row is updated with all form fields from the wizard
test('project row is updated with all wizard form fields on submit', async () => {
  await renderAndNavigateToReview();
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  // 6 advanceStep calls (steps 1–6) + 2 submit calls = 8 total
  await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(8));

  const firstUpdateArg = mockUpdate.mock.calls[6][0];
  expect(firstUpdateArg).toMatchObject({
    customer_name: 'Acme Corp',
    contact_email: 'acme@test.com',
    contact_phone: null,
    venue_address_line1: '123 Main St',
    court_count: 4,
    door_count: 2,
    security_camera_count: 2,
    has_front_desk: false,
    tier: 'pro',
    isp_provider: 'Xfinity',
    has_static_ip: false,
    internet_upload_mbps: 100,
    internet_download_mbps: 500,
    installer_ids: ['inst-1'],
    go_live_date: FUTURE_DATE,
  });
});

// 2. BOM generation is called with the project ID after fields are persisted
test('generateBom is called with the projectId', async () => {
  await renderAndNavigateToReview();
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() => expect(mockGenerateBom).toHaveBeenCalledWith(PROJECT_ID));
});

// 3. Project status is updated to 'procurement' after BOM generation
test('project status is updated to procurement', async () => {
  await renderAndNavigateToReview();
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(8));

  const secondUpdateArg = mockUpdate.mock.calls[7][0];
  expect(secondUpdateArg).toEqual({ project_status: 'procurement' });
});

// 4. Success toast is fired on successful submission
test('INTAKE_COMPLETE_SUCCESS toast is shown on successful submit', async () => {
  await renderAndNavigateToReview();
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith('INTAKE_COMPLETE_SUCCESS'),
  );
});

// 5. Error toast is fired when the Supabase project update fails
test('INTAKE_COMPLETE_ERROR toast is shown when Supabase update fails', async () => {
  await renderAndNavigateToReview();
  // Set error after navigation so it fires on the submit call, not an advanceStep call
  mockEq.mockResolvedValueOnce({ error: { message: 'DB write failed' } });
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith('INTAKE_COMPLETE_ERROR'),
  );
});
