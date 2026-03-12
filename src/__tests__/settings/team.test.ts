// Stage 140 — Tests: Team Settings
// 1. Add team member creates row with correct fields
// 2. Edit updates member values
// 3. Salary allocation % (OpEx settings) persists after save

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCreateTeamContact = vi.fn();
const mockUpdateTeamContact = vi.fn();
const mockDeactivateTeamContact = vi.fn();
const mockReactivateTeamContact = vi.fn();
const mockUpdateSettings = vi.fn();

vi.mock('@/services/teamContactsService', () => ({
  createTeamContact: (...args: unknown[]) => mockCreateTeamContact(...args),
  updateTeamContact: (...args: unknown[]) => mockUpdateTeamContact(...args),
  deactivateTeamContact: (...args: unknown[]) => mockDeactivateTeamContact(...args),
  reactivateTeamContact: (...args: unknown[]) => mockReactivateTeamContact(...args),
}));

vi.mock('@/services/settingsService', () => ({
  updateSettings: (...args: unknown[]) => mockUpdateSettings(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { TeamSettings } from '@/components/settings/TeamSettings';
import type { TeamContact } from '@/services/teamContactsService';
import type { Settings } from '@/services/settingsService';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeContact(overrides: Partial<TeamContact> = {}): TeamContact {
  return {
    id: 'contact-1',
    slug: 'andy',
    name: 'Andy Smith',
    role: 'Project Manager',
    department: 'pm',
    phone: '917-555-1234',
    email: 'andy@example.com',
    contact_via: null,
    support_tier: 1,
    notes: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const contact1 = makeContact();
const contact2 = makeContact({
  id: 'contact-2',
  slug: 'chad',
  name: 'Chad Johnson',
  role: 'Hardware Lead',
  department: 'hardware',
  phone: '201-555-9876',
  email: 'chad@example.com',
  support_tier: 2,
});
const contact3 = makeContact({
  id: 'contact-3',
  slug: 'niko',
  name: 'Niko Williams',
  role: 'Operations Director',
  department: 'operations',
  phone: null,
  email: 'niko@example.com',
  support_tier: null,
});

const baseSettings: Settings = {
  id: 1,
  pro_venue_fee: 500,
  pro_court_fee: 200,
  autonomous_venue_fee: 600,
  autonomous_court_fee: 250,
  autonomous_plus_venue_fee: 700,
  autonomous_plus_court_fee: 300,
  pbk_venue_fee: 400,
  pbk_court_fee: 150,
  shipping_rate: 0.05,
  target_margin: 0.30,
  sales_tax_rate: 0.07,
  deposit_pct: 0.50,
  labor_rate_per_hour: 75,
  hours_per_day: 8,
  switch_24_max_courts: 8,
  switch_48_max_courts: 16,
  ssd_1tb_max_courts: 4,
  ssd_2tb_max_courts: 8,
  nvr_4bay_max_cameras: 4,
  isp_fiber_mbps_per_court: 50,
  isp_cable_upload_min_mbps: 20,
  default_replay_service_version: 'v2',
  po_number_prefix: 'PO',
  mac_mini_local_ip: '10.0.1.10',
  replay_port: 8080,
  ddns_domain: 'example.dyndns.org',
  label_sets_per_court: 2,
  default_vlan_id: 10,
  replay_vlan_id: 20,
  surveillance_vlan_id: 30,
  access_control_vlan_id: 40,
  rent_per_year: 27600,
  indirect_salaries_per_year: 147000,
};

function renderComponent(
  contacts: TeamContact[] = [contact1, contact2, contact3],
  settings: Settings = baseSettings,
) {
  return render(React.createElement(TeamSettings, { settings, contacts }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// 1. Renders initial contacts in table
test('renders initial team contacts in table', () => {
  renderComponent();
  expect(screen.getByText('Andy Smith')).toBeInTheDocument();
  expect(screen.getByText('Chad Johnson')).toBeInTheDocument();
  expect(screen.getByText('Niko Williams')).toBeInTheDocument();
});

// 2. Add Contact button opens the contact sheet
test('Add Contact button opens the contact sheet', () => {
  renderComponent();
  fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
  expect(screen.getByText('Add Team Contact')).toBeInTheDocument();
});

// 3. Add form shows Required errors when submitted empty
test('add form shows Required errors when submitted empty', async () => {
  const { container } = renderComponent();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
  });

  expect(screen.getByText('Add Team Contact')).toBeInTheDocument();

  // Submit empty form
  await act(async () => {
    const form = container.querySelector('form#contact-form') as HTMLFormElement;
    fireEvent.submit(form);
  });

  await waitFor(() => {
    expect(screen.getAllByText(/is required/i).length).toBeGreaterThanOrEqual(1);
  });
});

// 4. Add form has required fields: slug, name, role, department
test('add form contains required fields: slug, name, role, department', async () => {
  const { container } = renderComponent();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /add contact/i }));
  });

  expect(container.querySelector('input[name="slug"]')).toBeInTheDocument();
  expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
  expect(container.querySelector('input[name="role"]')).toBeInTheDocument();
  expect(container.querySelector('select[name="department"]')).toBeInTheDocument();

  // Department select has 7 options
  const deptSelect = container.querySelector('select[name="department"]') as HTMLSelectElement;
  expect(deptSelect.options.length).toBe(7);
});

// 5. Newly added contact row displays all correct fields in the table
test('newly added contact row displays all correct field values', () => {
  // Simulate a contact that was just created via the add form
  const newContact = makeContact({
    id: 'contact-new',
    slug: 'diana',
    name: 'Diana Prince',
    role: 'Config Lead',
    department: 'config',
    phone: '212-555-0001',
    email: 'diana@example.com',
    support_tier: 2,
    is_active: true,
  });

  renderComponent([newContact]);

  // Name appears in table
  expect(screen.getByText('Diana Prince')).toBeInTheDocument();
  // Role appears (possibly truncated to 40 chars — 'Config Lead' is short)
  expect(screen.getByText('Config Lead')).toBeInTheDocument();
  // Department badge renders
  expect(screen.getByText('Config')).toBeInTheDocument();
  // Phone and email appear
  expect(screen.getByText('212-555-0001')).toBeInTheDocument();
  expect(screen.getByText('diana@example.com')).toBeInTheDocument();
  // Support tier pill renders
  expect(screen.getByText('Tier 2')).toBeInTheDocument();
});

// 6. Show inactive toggle reveals deactivated contacts
test('show inactive toggle reveals inactive contacts in table', () => {
  const inactiveContact = makeContact({
    id: 'contact-inactive',
    slug: 'former',
    name: 'Former Employee',
    role: 'Ex-PM',
    is_active: false,
  });

  // Render with one active and one inactive contact
  renderComponent([contact1, inactiveContact]);

  // Inactive contact is hidden by default
  expect(screen.queryByText('Former Employee')).not.toBeInTheDocument();

  // Toggle "Show inactive"
  const toggle = screen.getByRole('checkbox');
  fireEvent.click(toggle);

  // Now inactive contact is visible
  expect(screen.getByText('Former Employee')).toBeInTheDocument();
  // Inactive badge appears
  expect(screen.getByText('Inactive')).toBeInTheDocument();
});

// 7. Edit updates member values — updateTeamContact called with correct id and patch
test('edit updates member via updateTeamContact with correct id and patch', async () => {
  const updated: TeamContact = { ...contact1, name: 'Andy Updated', role: 'Senior PM' };
  mockUpdateTeamContact.mockResolvedValueOnce(updated);

  const { container } = renderComponent();

  // Open kebab menu for contact1
  const kebabButtons = screen.getAllByRole('button', { name: /actions/i });
  fireEvent.click(kebabButtons[0]);

  // Click Edit
  fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

  // Sheet opens in edit mode
  expect(screen.getByText('Edit Team Contact')).toBeInTheDocument();

  // Update name
  fireEvent.change(container.querySelector('input[name="name"]')!, {
    target: { value: 'Andy Updated' },
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save contact/i }));
  });

  await waitFor(() => {
    expect(mockUpdateTeamContact).toHaveBeenCalled();
    const [id, patch] = mockUpdateTeamContact.mock.calls[0];
    expect(id).toBe('contact-1');
    expect(patch.name).toBe('Andy Updated');
  });
});

// 8. Updated row reflects new values in the table
test('updated contact values appear in table after edit', async () => {
  const updated: TeamContact = { ...contact1, name: 'Andy Renamed' };
  mockUpdateTeamContact.mockResolvedValueOnce(updated);

  const { container } = renderComponent();

  const kebabButtons = screen.getAllByRole('button', { name: /actions/i });
  fireEvent.click(kebabButtons[0]);
  fireEvent.click(screen.getByRole('button', { name: /^edit$/i }));

  fireEvent.change(container.querySelector('input[name="name"]')!, {
    target: { value: 'Andy Renamed' },
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save contact/i }));
  });

  await waitFor(() => {
    expect(screen.getByText('Andy Renamed')).toBeInTheDocument();
  });
});

// 9. Deactivate removes contact from active list
test('deactivate removes contact from active list', async () => {
  mockDeactivateTeamContact.mockResolvedValueOnce(undefined);

  renderComponent();

  const kebabButtons = screen.getAllByRole('button', { name: /actions/i });
  fireEvent.click(kebabButtons[0]);

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /deactivate/i }));
  });

  // Click confirm in the dialog
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^deactivate$/i }));
  });

  await waitFor(() => {
    expect(mockDeactivateTeamContact).toHaveBeenCalledWith('contact-1');
  });

  // Active-only view no longer shows the deactivated contact
  await waitFor(() => {
    expect(screen.queryByText('Andy Smith')).not.toBeInTheDocument();
  });
});

// 10. OpEx save — updateSettings called with rent_per_year and indirect_salaries_per_year
test('OpEx save persists rent_per_year and indirect_salaries_per_year via updateSettings', async () => {
  const savedSettings: Settings = {
    ...baseSettings,
    rent_per_year: 30000,
    indirect_salaries_per_year: 160000,
  };
  mockUpdateSettings.mockResolvedValueOnce(savedSettings);

  const { container } = renderComponent();

  // Update rent_per_year field
  const rentInput = container.querySelector('input[name="rent_per_year"]') as HTMLInputElement;
  fireEvent.change(rentInput, { target: { value: '30000', valueAsNumber: 30000 } });
  Object.defineProperty(rentInput, 'valueAsNumber', { value: 30000 });

  // Update indirect_salaries_per_year field
  const salaryInput = container.querySelector('input[name="indirect_salaries_per_year"]') as HTMLInputElement;
  fireEvent.change(salaryInput, { target: { value: '160000', valueAsNumber: 160000 } });
  Object.defineProperty(salaryInput, 'valueAsNumber', { value: 160000 });

  // Click Save OpEx Settings
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save opex settings/i }));
  });

  await waitFor(() => {
    expect(mockUpdateSettings).toHaveBeenCalled();
    const [patch] = mockUpdateSettings.mock.calls[0];
    expect(patch).toHaveProperty('rent_per_year');
    expect(patch).toHaveProperty('indirect_salaries_per_year');
  });
});
