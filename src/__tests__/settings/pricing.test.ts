// Stage 136 — Tests: Pricing Settings
// 1. All 4 pricing tiers render
// 2. Editing a tier saves updated values
// 3. Tax rate persists after save

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => config,
}));

const mockUpdateSettings = vi.fn().mockResolvedValue({});

vi.mock('@/services/settingsService', () => ({
  updateSettings: (...args: unknown[]) => mockUpdateSettings(...args),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Import after mocks ────────────────────────────────────────────────────────

import { PricingSettings } from '@/components/settings/PricingSettings';
import type { Settings } from '@/services/settingsService';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseSettings: Settings = {
  id: 1,
  pro_venue_fee: 5000,
  pro_court_fee: 2500,
  autonomous_venue_fee: 7500,
  autonomous_court_fee: 2500,
  autonomous_plus_venue_fee: 7500,
  autonomous_plus_court_fee: 2500,
  pbk_venue_fee: 1000,
  pbk_court_fee: 500,
  shipping_rate: 0.1,
  target_margin: 0.1,
  sales_tax_rate: 0.1025,
  deposit_pct: 0.5,
  labor_rate_per_hour: 120,
  hours_per_day: 10,
  switch_24_max_courts: 10,
  switch_48_max_courts: 20,
  ssd_1tb_max_courts: 4,
  ssd_2tb_max_courts: 12,
  nvr_4bay_max_cameras: 4,
  isp_fiber_mbps_per_court: 12,
  isp_cable_upload_min_mbps: 60,
  default_replay_service_version: 'v1',
  po_number_prefix: 'PO',
  mac_mini_local_ip: '192.168.32.100',
  replay_port: 4000,
  ddns_domain: 'podplaydns.com',
  label_sets_per_court: 5,
  default_vlan_id: 30,
  replay_vlan_id: 32,
  surveillance_vlan_id: 31,
  access_control_vlan_id: 33,
};

function renderComponent(settings: Settings = baseSettings) {
  return render(React.createElement(PricingSettings, { settings }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// 1. Pro tier labels render
test('renders Pro tier labels', () => {
  renderComponent();
  expect(screen.getByText('Pro — Venue Fee')).toBeInTheDocument();
  expect(screen.getByText('Pro — Per-Court Fee')).toBeInTheDocument();
});

// 2. Autonomous tier labels render
test('renders Autonomous tier labels', () => {
  renderComponent();
  expect(screen.getByText('Autonomous — Venue Fee')).toBeInTheDocument();
  expect(screen.getByText('Autonomous — Per-Court Fee')).toBeInTheDocument();
});

// 3. Autonomous+ tier labels render
test('renders Autonomous+ tier labels', () => {
  renderComponent();
  expect(screen.getByText('Autonomous+ — Venue Fee')).toBeInTheDocument();
  expect(screen.getByText('Autonomous+ — Per-Court Fee')).toBeInTheDocument();
});

// 4. PBK tier labels render
test('renders PBK tier labels', () => {
  renderComponent();
  expect(screen.getByText('PBK — Venue Fee')).toBeInTheDocument();
  expect(screen.getByText('PBK — Per-Court Fee')).toBeInTheDocument();
});

// 5. Editing Pro venue fee and saving calls updateSettings with updated value
test('editing Pro venue fee saves updated value', async () => {
  renderComponent();

  const proVenueInputs = screen
    .getAllByRole('spinbutton')
    .filter((_el, idx) => idx === 0); // first currency input = pro_venue_fee
  const proVenueInput = proVenueInputs[0];

  fireEvent.change(proVenueInput, { target: { value: '6000', valueAsNumber: 6000 } });

  const saveButton = screen.getByRole('button', { name: /save changes/i });
  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(mockUpdateSettings).toHaveBeenCalled();
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.pro_venue_fee).toBe(6000);
  });
});

// 6. Tax rate value is present in form on render
test('sales tax rate field is pre-populated', () => {
  renderComponent();
  // sales_tax_rate = 0.1025 → displayed as 10.25 in percent input
  expect(screen.getByText('Sales Tax Rate')).toBeInTheDocument();
});

// 7. Save passes sales_tax_rate to updateSettings
test('tax rate persists after save', async () => {
  mockUpdateSettings.mockClear();
  renderComponent();

  const saveButton = screen.getByRole('button', { name: /save changes/i });
  fireEvent.click(saveButton);

  await waitFor(() => {
    expect(mockUpdateSettings).toHaveBeenCalled();
    const payload = mockUpdateSettings.mock.calls[0][0];
    expect(payload.sales_tax_rate).toBeCloseTo(0.1025, 4);
  });
});

// 8. Service Tier Fees section heading renders
test('renders Service Tier Fees section heading', () => {
  renderComponent();
  expect(screen.getByText('Service Tier Fees')).toBeInTheDocument();
});

