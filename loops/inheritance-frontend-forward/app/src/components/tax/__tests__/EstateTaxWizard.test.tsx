/**
 * Tests for EstateTaxWizard component (§4.23)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EstateTaxWizard } from '../EstateTaxWizard';
import { createDefaultEstateTaxState } from '@/types/estate-tax';
import type { EstateTaxWizardState } from '@/types/estate-tax';
import type { AutoSaveStatus } from '@/types';

function renderWizard(
  overrides?: Partial<{
    state: EstateTaxWizardState;
    onChange: (state: EstateTaxWizardState) => void;
    autoSaveStatus: AutoSaveStatus;
    decedentName: string;
    onBack: () => void;
  }>,
) {
  const defaultProps = {
    state: createDefaultEstateTaxState(),
    onChange: vi.fn(),
    autoSaveStatus: 'idle' as AutoSaveStatus,
    decedentName: 'Juan dela Cruz',
    onBack: vi.fn(),
  };
  const props = { ...defaultProps, ...overrides };
  return { ...render(<EstateTaxWizard {...props} />), props };
}

describe('tax-wizard > EstateTaxWizard', () => {
  // ========================================================================
  // Rendering
  // ========================================================================

  it('renders the wizard container', () => {
    renderWizard();
    expect(screen.getByTestId('estate-tax-wizard')).toBeInTheDocument();
  });

  it('displays the decedent name in header', () => {
    renderWizard({ decedentName: 'Maria Santos' });
    expect(screen.getByText(/Estate of Maria Santos/)).toBeInTheDocument();
  });

  it('renders all 8 tab buttons', () => {
    renderWizard();
    for (let i = 0; i < 8; i++) {
      expect(screen.getByTestId(`tab-${i}`)).toBeInTheDocument();
    }
  });

  it('renders "Back to Inheritance Results" button', () => {
    renderWizard();
    expect(screen.getByTestId('back-to-inheritance')).toBeInTheDocument();
  });

  // ========================================================================
  // Tab Navigation
  // ========================================================================

  it('starts on tab 0 (Decedent)', () => {
    renderWizard();
    expect(screen.getByTestId('decedent-tab')).toBeInTheDocument();
  });

  it('navigates to next tab via Next button', async () => {
    renderWizard();
    const nextBtn = screen.getByTestId('next-tab');
    await userEvent.click(nextBtn);
    expect(screen.getByTestId('executor-tab')).toBeInTheDocument();
  });

  it('navigates back via Back button', async () => {
    renderWizard();
    // Go to tab 1
    await userEvent.click(screen.getByTestId('next-tab'));
    expect(screen.getByTestId('executor-tab')).toBeInTheDocument();

    // Go back to tab 0
    await userEvent.click(screen.getByTestId('prev-tab'));
    expect(screen.getByTestId('decedent-tab')).toBeInTheDocument();
  });

  it('disables Back button on first tab', () => {
    renderWizard();
    expect(screen.getByTestId('prev-tab')).toBeDisabled();
  });

  it('navigates to tab by clicking tab button directly', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-2'));
    expect(screen.getByTestId('real-properties-tab')).toBeInTheDocument();
  });

  it('shows correct step indicator', () => {
    renderWizard();
    expect(screen.getByText(/Step 1 of 8/)).toBeInTheDocument();
  });

  it('navigates through all 8 tabs sequentially', async () => {
    renderWizard();

    const tabTestIds = [
      'decedent-tab',
      'executor-tab',
      'real-properties-tab',
      'personal-properties-tab',
      'other-assets-tab',
      'ordinary-deductions-tab',
      'special-deductions-tab',
      'filing-amnesty-tab',
    ];

    for (let i = 0; i < 8; i++) {
      await userEvent.click(screen.getByTestId(`tab-${i}`));
      expect(screen.getByTestId(tabTestIds[i])).toBeInTheDocument();
    }
  });

  // ========================================================================
  // Auto-save status display
  // ========================================================================

  it('shows "Saving..." when autoSaveStatus is saving', () => {
    renderWizard({ autoSaveStatus: 'saving' });
    expect(screen.getByTestId('auto-save-status')).toHaveTextContent('Saving...');
  });

  it('shows "Saved" when autoSaveStatus is saved', () => {
    renderWizard({ autoSaveStatus: 'saved' });
    expect(screen.getByTestId('auto-save-status')).toHaveTextContent('Saved');
  });

  it('shows "Error saving" when autoSaveStatus is error', () => {
    renderWizard({ autoSaveStatus: 'error' });
    expect(screen.getByTestId('auto-save-status')).toHaveTextContent('Error saving');
  });

  it('hides save status when idle', () => {
    renderWizard({ autoSaveStatus: 'idle' });
    expect(screen.queryByTestId('auto-save-status')).not.toBeInTheDocument();
  });

  // ========================================================================
  // Back to Inheritance
  // ========================================================================

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn();
    renderWizard({ onBack });
    await userEvent.click(screen.getByTestId('back-to-inheritance'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  // ========================================================================
  // Tab validation checkmarks
  // ========================================================================

  it('shows checkmark on tab 0 when decedent fields are filled', () => {
    const state = createDefaultEstateTaxState();
    state.decedent.name = 'Juan dela Cruz';
    state.decedent.dateOfDeath = '2024-03-15';
    state.decedent.address = 'Makati City';
    renderWizard({ state });

    const tab0 = screen.getByTestId('tab-0');
    expect(tab0.textContent).toContain('✓');
  });

  it('does not show checkmark on tab 0 when name is empty', () => {
    const state = createDefaultEstateTaxState();
    // Leave name empty, fill other fields
    state.decedent.dateOfDeath = '2024-03-15';
    state.decedent.address = 'Makati City';
    renderWizard({ state });

    const tab0 = screen.getByTestId('tab-0');
    expect(tab0.textContent).not.toContain('✓');
  });

  it('shows checkmark on tab 1 when executor name is filled', () => {
    const state = createDefaultEstateTaxState();
    state.executor.name = 'Maria Santos';
    renderWizard({ state });

    const tab1 = screen.getByTestId('tab-1');
    expect(tab1.textContent).toContain('✓');
  });

  it('tabs 2-7 always show checkmark (empty = valid)', () => {
    renderWizard();
    for (let i = 2; i <= 7; i++) {
      const tab = screen.getByTestId(`tab-${i}`);
      expect(tab.textContent).toContain('✓');
    }
  });
});

// ============================================================================
// Tab 1 — Decedent Tab
// ============================================================================

describe('tax-wizard > DecedentTab', () => {
  it('renders pre-populated name field', () => {
    const state = createDefaultEstateTaxState();
    state.decedent.name = 'Juan dela Cruz';
    renderWizard({ state });

    const nameInput = screen.getByTestId('decedent-name') as HTMLInputElement;
    expect(nameInput.value).toBe('Juan dela Cruz');
  });

  it('renders pre-populated date of death', () => {
    const state = createDefaultEstateTaxState();
    state.decedent.dateOfDeath = '2024-03-15';
    renderWizard({ state });

    const dodInput = screen.getByTestId('decedent-dod') as HTMLInputElement;
    expect(dodInput.value).toBe('2024-03-15');
  });

  it('shows property regime when marital status is married', () => {
    const state = createDefaultEstateTaxState();
    state.decedent.maritalStatus = 'married';
    state.decedent.propertyRegime = 'ACP';
    renderWizard({ state });

    expect(screen.getByTestId('property-regime-group')).toBeInTheDocument();
  });

  it('hides property regime when marital status is single', () => {
    const state = createDefaultEstateTaxState();
    state.decedent.maritalStatus = 'single';
    renderWizard({ state });

    expect(screen.queryByTestId('property-regime-group')).not.toBeInTheDocument();
  });

  it('shows NRA worldwide section when isNonResidentAlien is true', () => {
    const state = createDefaultEstateTaxState();
    state.decedent.isNonResidentAlien = true;
    state.decedent.citizenship = 'NRA';
    renderWizard({ state });

    expect(screen.getByTestId('nra-worldwide-section')).toBeInTheDocument();
  });

  it('hides NRA worldwide section for Filipino citizen', () => {
    renderWizard();
    expect(screen.queryByTestId('nra-worldwide-section')).not.toBeInTheDocument();
  });

  it('calls onChange when name field changes', async () => {
    const onChange = vi.fn();
    renderWizard({ onChange });

    const nameInput = screen.getByTestId('decedent-name');
    await userEvent.type(nameInput, 'J');

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.decedent.name).toBe('J');
  });

  it('displays pre-fill notice text', () => {
    renderWizard();
    expect(
      screen.getByText(/pre-filled from your inheritance computation/),
    ).toBeInTheDocument();
  });
});

// ============================================================================
// Tab 2 — Executor Tab
// ============================================================================

describe('tax-wizard > ExecutorTab', () => {
  it('renders executor form fields', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-1'));

    expect(screen.getByTestId('executor-name')).toBeInTheDocument();
    expect(screen.getByTestId('executor-tin')).toBeInTheDocument();
    expect(screen.getByTestId('executor-contact')).toBeInTheDocument();
    expect(screen.getByTestId('executor-email')).toBeInTheDocument();
  });

  it('calls onChange when executor name is typed', async () => {
    const onChange = vi.fn();
    renderWizard({ onChange });
    await userEvent.click(screen.getByTestId('tab-1'));

    const nameInput = screen.getByTestId('executor-name');
    await userEvent.type(nameInput, 'M');

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.executor.name).toBe('M');
  });
});

// ============================================================================
// Tab 3 — Real Properties Tab
// ============================================================================

describe('tax-wizard > RealPropertiesTab', () => {
  it('shows empty state message when no properties', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-2'));

    expect(screen.getByTestId('no-real-properties')).toBeInTheDocument();
  });

  it('renders add real property button', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-2'));

    expect(screen.getByTestId('add-real-property')).toBeInTheDocument();
  });

  it('calls onChange when adding a real property', async () => {
    const onChange = vi.fn();
    renderWizard({ onChange });
    await userEvent.click(screen.getByTestId('tab-2'));

    await userEvent.click(screen.getByTestId('add-real-property'));

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.realProperties).toHaveLength(1);
    expect(lastCall.realProperties[0]).toHaveProperty('id');
    expect(lastCall.realProperties[0].classification).toBe('residential');
  });

  it('renders existing properties with index', async () => {
    const state = createDefaultEstateTaxState();
    state.realProperties = [
      {
        id: 'rp-1',
        titleNumber: 'TCT-123',
        taxDecNumber: 'TD-001',
        location: 'Makati',
        lotArea: 200,
        improvementArea: 100,
        classification: 'residential',
        fmvTaxDec: 3_000_000,
        fmvBirZonal: 4_000_000,
        ownership: 'exclusive',
        isFamilyHome: true,
        hasBarangayCert: true,
      },
    ];
    renderWizard({ state });
    await userEvent.click(screen.getByTestId('tab-2'));

    expect(screen.getByTestId('real-property-0')).toBeInTheDocument();
  });
});

// ============================================================================
// Tab 4 — Personal Properties Tab
// ============================================================================

describe('tax-wizard > PersonalPropertiesTab', () => {
  it('shows empty state message when no properties', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-3'));

    expect(screen.getByTestId('no-personal-properties')).toBeInTheDocument();
  });

  it('calls onChange when adding a personal property', async () => {
    const onChange = vi.fn();
    renderWizard({ onChange });
    await userEvent.click(screen.getByTestId('tab-3'));

    await userEvent.click(screen.getByTestId('add-personal-property'));

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.personalProperties).toHaveLength(1);
    expect(lastCall.personalProperties[0].subtype).toBe('cash');
  });
});

// ============================================================================
// Tab 5 — Other Assets Tab
// ============================================================================

describe('tax-wizard > OtherAssetsTab', () => {
  it('renders three sections', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-4'));

    expect(screen.getByTestId('other-assets-tab')).toBeInTheDocument();
    expect(screen.getByTestId('taxable-transfer-count')).toHaveTextContent('0 transfer(s)');
    expect(screen.getByTestId('business-interest-count')).toHaveTextContent('0 interest(s)');
    expect(screen.getByTestId('exempt-asset-count')).toHaveTextContent('0 asset(s)');
  });
});

// ============================================================================
// Tab 6 — Ordinary Deductions Tab
// ============================================================================

describe('tax-wizard > OrdinaryDeductionsTab', () => {
  it('hides PRE_TRAIN fields for DOD >= 2018', async () => {
    const state = createDefaultEstateTaxState();
    state.decedent.dateOfDeath = '2024-03-15';
    renderWizard({ state });
    await userEvent.click(screen.getByTestId('tab-5'));

    expect(screen.queryByTestId('pre-train-section')).not.toBeInTheDocument();
  });

  it('shows PRE_TRAIN fields for DOD < 2018', async () => {
    const state = createDefaultEstateTaxState();
    state.decedent.dateOfDeath = '2017-06-15';
    renderWizard({ state });
    await userEvent.click(screen.getByTestId('tab-5'));

    expect(screen.getByTestId('pre-train-section')).toBeInTheDocument();
    expect(screen.getByTestId('funeral-expenses')).toBeInTheDocument();
    expect(screen.getByTestId('judicial-admin-expenses')).toBeInTheDocument();
  });
});

// ============================================================================
// Tab 7 — Special Deductions Tab
// ============================================================================

describe('tax-wizard > SpecialDeductionsTab', () => {
  it('displays standard deduction amount of ₱5,000,000', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-6'));

    expect(screen.getByTestId('standard-deduction')).toHaveTextContent('5,000,000');
  });

  it('displays auto-calculated family home deduction', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-6'));

    expect(screen.getByTestId('family-home-deduction')).toBeInTheDocument();
  });
});

// ============================================================================
// Tab 8 — Filing & Amnesty Tab
// ============================================================================

describe('tax-wizard > FilingAmnestyTab', () => {
  it('renders amnesty toggle', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-7'));

    expect(screen.getByTestId('amnesty-toggle')).toBeInTheDocument();
  });

  it('hides amnesty mode section when amnesty not elected', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-7'));

    expect(screen.queryByTestId('amnesty-mode-section')).not.toBeInTheDocument();
  });

  it('shows amnesty mode section when amnesty is elected', async () => {
    const state = createDefaultEstateTaxState();
    state.filing.userElectsAmnesty = true;
    renderWizard({ state });
    await userEvent.click(screen.getByTestId('tab-7'));

    expect(screen.getByTestId('amnesty-mode-section')).toBeInTheDocument();
  });

  it('renders filing flags checkboxes', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-7'));

    expect(screen.getByTestId('is-amended')).toBeInTheDocument();
    expect(screen.getByTestId('has-extension')).toBeInTheDocument();
    expect(screen.getByTestId('is-installment')).toBeInTheDocument();
    expect(screen.getByTestId('is-judicial')).toBeInTheDocument();
  });

  it('renders disqualifying violation checkboxes', async () => {
    renderWizard();
    await userEvent.click(screen.getByTestId('tab-7'));

    expect(screen.getByTestId('pcgg-violation')).toBeInTheDocument();
    expect(screen.getByTestId('ra3019-violation')).toBeInTheDocument();
    expect(screen.getByTestId('ra9160-violation')).toBeInTheDocument();
  });

  it('calls onChange when amnesty toggle is clicked', async () => {
    const onChange = vi.fn();
    renderWizard({ onChange });
    await userEvent.click(screen.getByTestId('tab-7'));

    await userEvent.click(screen.getByTestId('amnesty-toggle'));

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.filing.userElectsAmnesty).toBe(true);
  });
});
