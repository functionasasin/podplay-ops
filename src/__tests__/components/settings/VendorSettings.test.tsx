import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VendorSettings } from '@/components/settings/VendorSettings';
import type { Vendor } from '@/services/vendorsService';

// Mock entire service to avoid Supabase env var requirement
vi.mock('@/services/vendorsService', () => ({
  createVendor: vi.fn(),
  updateVendor: vi.fn(),
  deactivateVendor: vi.fn(),
  reactivateVendor: vi.fn(),
}));

// Sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function makeVendor(overrides: Partial<Vendor> & { id: string; name: string }): Vendor {
  return {
    contact_name: null,
    email: null,
    phone: null,
    website: null,
    lead_time_days: null,
    notes: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// 7 seeded vendors matching migration 00017
const SEED_VENDORS: Vendor[] = [
  makeVendor({ id: 'v-001', name: 'Ubiquiti',  notes: 'Network equipment — UDM, switches, APs, cameras' }),
  makeVendor({ id: 'v-002', name: 'Apple',     notes: 'Mac Mini, Apple TV, iPad' }),
  makeVendor({ id: 'v-003', name: 'Samsung',   notes: 'Displays and TVs' }),
  makeVendor({ id: 'v-004', name: 'Kisi',      notes: 'Access control — controllers and readers' }),
  makeVendor({ id: 'v-005', name: 'Replay',    notes: 'Replay system hardware kits and signs' }),
  makeVendor({ id: 'v-006', name: 'APC',       notes: 'UPS and power protection' }),
  makeVendor({ id: 'v-007', name: 'Generic',   notes: 'Cables, patch panels, mounts, misc hardware' }),
];

function renderComponent(vendors = SEED_VENDORS) {
  return render(<VendorSettings vendors={vendors} />);
}

describe('VendorSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('VS-01: renders table with 7 seeded vendor rows', () => {
    renderComponent();
    for (const v of SEED_VENDORS) {
      expect(screen.getByText(v.name)).toBeInTheDocument();
    }
  });

  it('VS-02: displays column headers: Name, Contact, Email, Phone, Website, Lead Time, Active', () => {
    renderComponent();
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim());
    expect(headers).toContain('Name');
    expect(headers).toContain('Contact');
    expect(headers).toContain('Email');
    expect(headers).toContain('Phone');
    expect(headers).toContain('Website');
    expect(headers).toContain('Lead Time');
    expect(headers).toContain('Active');
  });

  it('VS-03: Add button opens form modal with "Add Vendor" title', () => {
    renderComponent();
    const addBtn = screen.getByText('+ Add Vendor');
    fireEvent.click(addBtn);
    expect(screen.getByRole('heading', { name: 'Add Vendor' })).toBeInTheDocument();
    expect(screen.getByText('Save Vendor')).toBeInTheDocument();
  });

  it('VS-04: Edit button in kebab menu opens form pre-filled with vendor data', () => {
    const vendor = makeVendor({
      id: 'v-edit',
      name: 'Ubiquiti',
      contact_name: 'John Smith',
      email: 'john@ubiquiti.com',
      phone: '09181234567',
      website: 'https://ui.com',
      lead_time_days: 14,
    });
    renderComponent([vendor]);
    const kebabButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(kebabButtons[0]);
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByRole('heading', { name: 'Edit Vendor' })).toBeInTheDocument();
    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe('Ubiquiti');
  });

  it('VS-05: Deactivate button shows confirmation dialog', () => {
    renderComponent();
    const kebabButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(kebabButtons[0]);
    fireEvent.click(screen.getByText('Deactivate'));
    expect(screen.getByText(/Deactivate Ubiquiti/)).toBeInTheDocument();
  });

  it('VS-06: form shows validation error when name is empty on submit', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('+ Add Vendor'));
    fireEvent.click(screen.getByText('Save Vendor'));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });
});
