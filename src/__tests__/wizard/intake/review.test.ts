// Tests: ReviewStep — renders all fields from all 6 steps and Edit navigation.

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReviewStep } from '@/components/wizard/intake/ReviewStep';

const mockCustomerInfo = {
  customer_name: 'Acme Corp',
  contact_email: 'contact@acme.com',
  contact_phone: '555-1234',
};

const mockVenueConfig = {
  venue_address: '123 Main St, Springfield',
  court_count: 4,
  door_count: 2,
  camera_count: 6,
  has_front_desk: true,
};

const mockTierSelection = {
  service_tier: 'autonomous' as const,
};

const mockIspInfo = {
  isp_provider: 'Xfinity',
  has_static_ip: true,
  upload_speed_mbps: 100,
  download_speed_mbps: 500,
};

const mockInstallerSelection = {
  installer_ids: ['installer-uuid-001'],
};

const mockFinancialSetup = {
  target_go_live_date: '2026-06-01',
  deposit_amount: 2500,
};

function renderReview(onEdit = vi.fn(), onSubmit = vi.fn()) {
  return render(
    React.createElement(ReviewStep, {
      customerInfo: mockCustomerInfo,
      venueConfig: mockVenueConfig,
      tierSelection: mockTierSelection,
      ispInfo: mockIspInfo,
      installerSelection: mockInstallerSelection,
      installerName: 'ProAV Solutions',
      financialSetup: mockFinancialSetup,
      onEdit,
      onSubmit,
    })
  );
}

// 1. Customer name renders
test('renders customer_name in review', () => {
  renderReview();
  expect(screen.getByText('Acme Corp')).toBeInTheDocument();
});

// 2. Contact email renders
test('renders contact_email in review', () => {
  renderReview();
  expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
});

// 3. Contact phone renders
test('renders contact_phone in review', () => {
  renderReview();
  expect(screen.getByText('555-1234')).toBeInTheDocument();
});

// 4. Venue address renders
test('renders venue_address in review', () => {
  renderReview();
  expect(screen.getByText('123 Main St, Springfield')).toBeInTheDocument();
});

// 5. Court count renders
test('renders court_count in review', () => {
  renderReview();
  expect(screen.getByText('4')).toBeInTheDocument();
});

// 6. Door count renders
test('renders door_count in review', () => {
  renderReview();
  expect(screen.getByText('2')).toBeInTheDocument();
});

// 7. Camera count renders
test('renders camera_count in review', () => {
  renderReview();
  expect(screen.getByText('6')).toBeInTheDocument();
});

// 8. has_front_desk and has_static_ip both true — "Yes" appears at least twice
test('renders has_front_desk as Yes (multiple Yes values present)', () => {
  renderReview();
  const yesItems = screen.getAllByText('Yes');
  expect(yesItems.length).toBeGreaterThanOrEqual(2);
});

// 10. Service tier renders as label "AUTO"
test('renders service_tier label AUTO for autonomous', () => {
  renderReview();
  expect(screen.getByText('AUTO')).toBeInTheDocument();
});

// 11. ISP provider renders
test('renders isp_provider in review', () => {
  renderReview();
  expect(screen.getByText('Xfinity')).toBeInTheDocument();
});

// 12. Upload speed renders
test('renders upload_speed_mbps in review', () => {
  renderReview();
  expect(screen.getByText('100')).toBeInTheDocument();
});

// 13. Download speed renders
test('renders download_speed_mbps in review', () => {
  renderReview();
  expect(screen.getByText('500')).toBeInTheDocument();
});

// 14. Installer name renders (prefer installerName over installer_id)
test('renders installerName in review', () => {
  renderReview();
  expect(screen.getByText('ProAV Solutions')).toBeInTheDocument();
});

// 15. Go-live date renders
test('renders target_go_live_date in review', () => {
  renderReview();
  expect(screen.getByText('2026-06-01')).toBeInTheDocument();
});

// 16. Deposit amount renders formatted as currency
test('renders deposit_amount formatted as $2500.00', () => {
  renderReview();
  expect(screen.getByText('$2500.00')).toBeInTheDocument();
});

// 17. Each section has an Edit button (6 sections)
test('renders 6 Edit buttons for each step section', () => {
  renderReview();
  const editButtons = screen.getAllByRole('button', { name: /edit/i });
  // 6 Edit ↑ buttons + 1 Submit button
  const editOnly = editButtons.filter((b) => b.textContent?.includes('Edit'));
  expect(editOnly.length).toBe(6);
});

// 18. Clicking Customer Info Edit calls onEdit with step 0
test('clicking Customer Info Edit calls onEdit(0)', () => {
  const onEdit = vi.fn();
  renderReview(onEdit);
  const editButtons = screen.getAllByText('Edit ↑');
  fireEvent.click(editButtons[0]); // Customer Info is first
  expect(onEdit).toHaveBeenCalledWith(0);
});

// 19. Clicking Venue Config Edit calls onEdit with step 1
test('clicking Venue Config Edit calls onEdit(1)', () => {
  const onEdit = vi.fn();
  renderReview(onEdit);
  const editButtons = screen.getAllByText('Edit ↑');
  fireEvent.click(editButtons[1]);
  expect(onEdit).toHaveBeenCalledWith(1);
});

// 20. Clicking Service Tier Edit calls onEdit with step 2
test('clicking Service Tier Edit calls onEdit(2)', () => {
  const onEdit = vi.fn();
  renderReview(onEdit);
  const editButtons = screen.getAllByText('Edit ↑');
  fireEvent.click(editButtons[2]);
  expect(onEdit).toHaveBeenCalledWith(2);
});

// 21. Clicking ISP Info Edit calls onEdit with step 3
test('clicking ISP Info Edit calls onEdit(3)', () => {
  const onEdit = vi.fn();
  renderReview(onEdit);
  const editButtons = screen.getAllByText('Edit ↑');
  fireEvent.click(editButtons[3]);
  expect(onEdit).toHaveBeenCalledWith(3);
});

// 22. Clicking Installer Edit calls onEdit with step 4
test('clicking Installer Edit calls onEdit(4)', () => {
  const onEdit = vi.fn();
  renderReview(onEdit);
  const editButtons = screen.getAllByText('Edit ↑');
  fireEvent.click(editButtons[4]);
  expect(onEdit).toHaveBeenCalledWith(4);
});

// 23. Clicking Financial Setup Edit calls onEdit with step 5
test('clicking Financial Setup Edit calls onEdit(5)', () => {
  const onEdit = vi.fn();
  renderReview(onEdit);
  const editButtons = screen.getAllByText('Edit ↑');
  fireEvent.click(editButtons[5]);
  expect(onEdit).toHaveBeenCalledWith(5);
});

// 24. Review step shows all selected installers joined when multiple installer_ids provided
test('renders multiple installer IDs joined when no installerName prop', () => {
  render(
    React.createElement(ReviewStep, {
      installerSelection: { installer_ids: ['id-abc', 'id-def'] },
      onEdit: vi.fn(),
      onSubmit: vi.fn(),
    })
  );
  expect(screen.getByText('id-abc, id-def')).toBeInTheDocument();
});
