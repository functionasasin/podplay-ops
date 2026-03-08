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
const { mockEq, mockUpdate, mockInstallersSelect, mockFrom, mockGenerateBom, mockShowToast } =
  vi.hoisted(() => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn(() => ({ eq: mockEq }));
    const mockInstallersSelect = vi.fn().mockResolvedValue({
      data: [{ id: 'inst-1', name: 'Test Installer', location: 'Denver, CO' }],
    });
    const mockFrom = vi.fn((table: string) => {
      if (table === 'installers') return { select: mockInstallersSelect };
      return { update: mockUpdate };
    });
    const mockGenerateBom = vi.fn().mockResolvedValue({ count: 5, error: null });
    const mockShowToast = vi.fn();
    return { mockEq, mockUpdate, mockInstallersSelect, mockFrom, mockGenerateBom, mockShowToast };
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

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => ({
    ...config,
    useParams: vi.fn(() => ({ projectId: PROJECT_ID })),
  }),
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
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 2: Tier Selection
  await waitFor(() => expect(screen.getByRole('radio', { name: 'Pro' })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 3: ISP Info
  await waitFor(() => expect(screen.getByLabelText(/isp provider/i)).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText(/isp provider/i), { target: { value: 'Xfinity' } });
  fireEvent.change(screen.getByLabelText(/upload speed/i), { target: { value: '100' } });
  fireEvent.change(screen.getByLabelText(/download speed/i), { target: { value: '500' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));

  // Step 4: Installer Selection (waits for Supabase data)
  await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-1' } });
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

  await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(2));

  const firstUpdateArg = mockUpdate.mock.calls[0][0];
  expect(firstUpdateArg).toMatchObject({
    customer_name: 'Acme Corp',
    contact_email: 'acme@test.com',
    contact_phone: null,
    venue_address: '123 Main St',
    court_count: 4,
    door_count: 0,
    security_camera_count: 0,
    has_front_desk: false,
    has_pingpod_wifi: false,
    tier: 'pro',
    isp_provider: 'Xfinity',
    has_static_ip: false,
    internet_upload_mbps: 100,
    internet_download_mbps: 500,
    installer_id: 'inst-1',
    target_go_live_date: FUTURE_DATE,
    deposit_amount: 1000,
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

  await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(2));

  const secondUpdateArg = mockUpdate.mock.calls[1][0];
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
  mockEq.mockResolvedValueOnce({ error: { message: 'DB write failed' } });

  await renderAndNavigateToReview();
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith('INTAKE_COMPLETE_ERROR'),
  );
});
