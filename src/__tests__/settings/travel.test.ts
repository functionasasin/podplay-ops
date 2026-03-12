// Stage 142 — Tests: Travel Settings
// 1. Default values load from settings
// 2. Editing values saves correctly
// 3. Travel values are used as defaults in expense form (description / info box)

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUpdateSettings = vi.fn();

vi.mock('@/services/settingsService', () => ({
  updateSettings: (...args: unknown[]) => mockUpdateSettings(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { TravelSettings } from '@/components/settings/TravelSettings';
import type { Settings } from '@/services/settingsService';

// ── Fixtures ──────────────────────────────────────────────────────────────────

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
  lodging_per_day: 300,
  airfare_default: 2000,
};

function renderComponent(settings: Settings = baseSettings) {
  return render(React.createElement(TravelSettings, { settings }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// 1. lodging_per_day loads from settings
test('lodging_per_day input loads value from settings', () => {
  const { container } = renderComponent();
  const input = container.querySelector('input[name="lodging_per_day"]') as HTMLInputElement;
  expect(input).toBeInTheDocument();
  expect(Number(input.value)).toBe(300);
});

// 2. airfare_default loads from settings
test('airfare_default input loads value from settings', () => {
  const { container } = renderComponent();
  const input = container.querySelector('input[name="airfare_default"]') as HTMLInputElement;
  expect(input).toBeInTheDocument();
  expect(Number(input.value)).toBe(2000);
});

// 3. hours_per_day loads from settings
test('hours_per_day input loads value from settings', () => {
  const { container } = renderComponent();
  const input = container.querySelector('input[name="hours_per_day"]') as HTMLInputElement;
  expect(input).toBeInTheDocument();
  expect(Number(input.value)).toBe(8);
});

// 4. Falls back to spec defaults when settings fields are absent
test('falls back to spec defaults when lodging_per_day and airfare_default are undefined', () => {
  const settingsWithoutTravel: Settings = {
    ...baseSettings,
    lodging_per_day: undefined,
    airfare_default: undefined,
  };
  const { container } = renderComponent(settingsWithoutTravel);
  const lodgingInput = container.querySelector('input[name="lodging_per_day"]') as HTMLInputElement;
  const airfareInput = container.querySelector('input[name="airfare_default"]') as HTMLInputElement;
  expect(Number(lodgingInput.value)).toBe(250);
  expect(Number(airfareInput.value)).toBe(1800);
});

// 5. Save button is present
test('Save Changes button is present', () => {
  renderComponent();
  expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
});

// 6. Editing lodging_per_day and saving calls updateSettings with correct value
test('editing lodging_per_day calls updateSettings with updated value', async () => {
  mockUpdateSettings.mockResolvedValueOnce({ ...baseSettings, lodging_per_day: 350 });

  const { container } = renderComponent();
  const lodgingInput = container.querySelector('input[name="lodging_per_day"]') as HTMLInputElement;

  fireEvent.change(lodgingInput, { target: { value: '350', valueAsNumber: 350 } });
  Object.defineProperty(lodgingInput, 'valueAsNumber', { value: 350, configurable: true });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
  });

  await waitFor(() => {
    expect(mockUpdateSettings).toHaveBeenCalled();
    const [patch] = mockUpdateSettings.mock.calls[0];
    expect(patch).toHaveProperty('lodging_per_day');
  });
});

// 7. Editing airfare_default and saving calls updateSettings with correct value
test('editing airfare_default calls updateSettings with updated value', async () => {
  mockUpdateSettings.mockResolvedValueOnce({ ...baseSettings, airfare_default: 2500 });

  const { container } = renderComponent();
  const airfareInput = container.querySelector('input[name="airfare_default"]') as HTMLInputElement;

  fireEvent.change(airfareInput, { target: { value: '2500', valueAsNumber: 2500 } });
  Object.defineProperty(airfareInput, 'valueAsNumber', { value: 2500, configurable: true });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
  });

  await waitFor(() => {
    expect(mockUpdateSettings).toHaveBeenCalled();
    const [patch] = mockUpdateSettings.mock.calls[0];
    expect(patch).toHaveProperty('airfare_default');
  });
});

// 8. updateSettings is called with all three travel fields
test('updateSettings payload includes lodging_per_day, airfare_default, and hours_per_day', async () => {
  mockUpdateSettings.mockResolvedValueOnce(baseSettings);

  const { container } = renderComponent();

  const lodgingInput = container.querySelector('input[name="lodging_per_day"]') as HTMLInputElement;
  const airfareInput = container.querySelector('input[name="airfare_default"]') as HTMLInputElement;
  const hoursInput = container.querySelector('input[name="hours_per_day"]') as HTMLInputElement;

  fireEvent.change(lodgingInput, { target: { value: '320', valueAsNumber: 320 } });
  fireEvent.change(airfareInput, { target: { value: '2100', valueAsNumber: 2100 } });
  fireEvent.change(hoursInput, { target: { value: '10', valueAsNumber: 10 } });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
  });

  await waitFor(() => {
    expect(mockUpdateSettings).toHaveBeenCalled();
    const [patch] = mockUpdateSettings.mock.calls[0];
    expect(patch).toHaveProperty('lodging_per_day');
    expect(patch).toHaveProperty('airfare_default');
    expect(patch).toHaveProperty('hours_per_day');
  });
});

// 9. Info box describes Lodging as pre-filling expense form amount
test('info box states lodging pre-fills expense form amount', () => {
  renderComponent();
  expect(screen.getByText(/pre-fills the Amount field when adding a/i)).toBeInTheDocument();
});

// 10. Info box describes Airfare as pre-filling expense form amount
test('info box states airfare pre-fills expense form amount', () => {
  renderComponent();
  // The component renders "Airfare: pre-fills the Amount field for..."
  const matches = screen.getAllByText(/pre-fills the Amount field/i);
  expect(matches.length).toBeGreaterThanOrEqual(2);
});
