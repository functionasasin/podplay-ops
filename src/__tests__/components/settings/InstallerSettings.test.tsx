import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InstallerSettings } from '@/components/settings/InstallerSettings';
import type { Installer } from '@/services/installersService';

// Mock entire service to avoid Supabase env var requirement
vi.mock('@/services/installersService', () => ({
  createInstaller: vi.fn(),
  updateInstaller: vi.fn(),
  deactivateInstaller: vi.fn(),
  reactivateInstaller: vi.fn(),
}));

// Sonner toast
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const INSTALLER_A: Installer = {
  id: 'ins-001',
  name: 'Juan dela Cruz',
  company: 'Cruz Electric',
  email: 'juan@example.com',
  phone: '09171234567',
  installer_type: 'podplay_vetted',
  regions: ['NCR', 'Calabarzon'],
  hourly_rate: 500,
  is_active: true,
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const INSTALLER_B: Installer = {
  id: 'ins-002',
  name: 'Maria Santos',
  company: null,
  email: null,
  phone: null,
  installer_type: 'client_own',
  regions: [],
  hourly_rate: null,
  is_active: true,
  notes: null,
  created_at: '2025-01-02T00:00:00Z',
  updated_at: '2025-01-02T00:00:00Z',
};

const SEED_INSTALLERS = [INSTALLER_A, INSTALLER_B];

function renderComponent(installers = SEED_INSTALLERS) {
  return render(<InstallerSettings installers={installers} />);
}

describe('InstallerSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('IS-01: renders table with 2 seeded installer rows', () => {
    renderComponent();
    expect(screen.getByText('Juan dela Cruz')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('IS-02: displays column headers: Name, Company, Type, Regions, Hourly Rate, Active', () => {
    renderComponent();
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim());
    expect(headers).toContain('Name');
    expect(headers).toContain('Company');
    expect(headers).toContain('Type');
    expect(headers).toContain('Regions');
    expect(headers).toContain('Hourly Rate');
    expect(headers).toContain('Active');
  });

  it('IS-03: displays installer type labels', () => {
    renderComponent();
    expect(screen.getByText('PodPlay Vetted')).toBeInTheDocument();
    expect(screen.getByText("Client's Own")).toBeInTheDocument();
  });

  it('IS-04: displays region tags for installer with regions', () => {
    renderComponent();
    expect(screen.getByText('NCR')).toBeInTheDocument();
    expect(screen.getByText('Calabarzon')).toBeInTheDocument();
  });

  it('IS-05: displays formatted hourly rate', () => {
    renderComponent();
    expect(screen.getByText('₱500/hr')).toBeInTheDocument();
  });

  it('IS-06: Add button opens form modal with "Add Installer" title', () => {
    renderComponent();
    const addBtn = screen.getByText('+ Add Installer');
    fireEvent.click(addBtn);
    // The sheet heading is an h2 with "Add Installer"
    const heading = screen.getByRole('heading', { name: 'Add Installer' });
    expect(heading).toBeInTheDocument();
    // Save button is present
    expect(screen.getByText('Save Installer')).toBeInTheDocument();
  });

  it('IS-07: Edit button in kebab menu opens form pre-filled with installer data', () => {
    renderComponent();
    // Open the kebab menu for installer A
    const kebabButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(kebabButtons[0]);
    // Click Edit
    const editBtn = screen.getByText('Edit');
    fireEvent.click(editBtn);
    // Form title should say Edit Installer
    expect(screen.getByRole('heading', { name: 'Edit Installer' })).toBeInTheDocument();
    // Name input should be pre-filled — find by name attribute
    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
    expect(nameInput).not.toBeNull();
    expect(nameInput.value).toBe('Juan dela Cruz');
  });

  it('IS-08: Deactivate button shows confirmation dialog', () => {
    renderComponent();
    // Open kebab for installer A
    const kebabButtons = screen.getAllByLabelText('Actions');
    fireEvent.click(kebabButtons[0]);
    // Click Deactivate
    const deactivateBtn = screen.getByText('Deactivate');
    fireEvent.click(deactivateBtn);
    // Confirm dialog should appear with installer name
    expect(screen.getByText(/Deactivate Juan dela Cruz/)).toBeInTheDocument();
  });

  it('IS-09: form shows validation error when name is cleared and submitted', async () => {
    renderComponent();
    // Open add form
    fireEvent.click(screen.getByText('+ Add Installer'));
    // Submit without filling name
    const saveBtn = screen.getByText('Save Installer');
    fireEvent.click(saveBtn);
    // Validation error should appear
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
  });

  it('IS-10: shows empty state when no installers provided', () => {
    renderComponent([]);
    expect(screen.getByText('No installers found. Add one to get started.')).toBeInTheDocument();
  });
});
