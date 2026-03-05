import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  WizardContainer,
  WIZARD_STEPS,
  MARRIAGE_DEFAULTS,
  ARTICULO_MORTIS_DEFAULTS,
  ILLNESS_DEFAULTS,
} from '../WizardContainer';

// --------------------------------------------------------------------------
// Tests — WizardContainer
// --------------------------------------------------------------------------
describe('wizard-step1 > WizardContainer', () => {
  describe('step definitions', () => {
    it('has exactly 6 wizard steps', () => {
      expect(WIZARD_STEPS).toHaveLength(6);
    });

    it('has correct step keys in order', () => {
      const keys = WIZARD_STEPS.map((s) => s.key);
      expect(keys).toEqual([
        'estate',
        'decedent',
        'family-tree',
        'will',
        'donations',
        'review',
      ]);
    });

    it('has correct step labels', () => {
      const labels = WIZARD_STEPS.map((s) => s.label);
      expect(labels).toEqual([
        'Estate Details',
        'Decedent Details',
        'Family Tree',
        'Will & Dispositions',
        'Donations',
        'Review & Config',
      ]);
    });

    it('marks only the Will step as conditional', () => {
      const conditionalSteps = WIZARD_STEPS.filter(
        (s) => 'conditional' in s && s.conditional
      );
      expect(conditionalSteps).toHaveLength(1);
      expect(conditionalSteps[0].key).toBe('will');
    });
  });

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<WizardContainer />);
      expect(screen.getByTestId('wizard-container')).toBeInTheDocument();
    });

    it('renders a step indicator showing current step', () => {
      render(<WizardContainer />);
      // Step 1 "Estate Details" should be shown as current step
      expect(screen.getByTestId('estate-step')).toBeInTheDocument();
    });

    it('renders navigation buttons (Next/Back)', () => {
      render(<WizardContainer />);
      // At minimum, a "Next" button should exist on first step
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('does not show Back button on first step', () => {
      render(<WizardContainer />);
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });
  });

  describe('step navigation', () => {
    it('advances to next step when Next is clicked', async () => {
      const user = userEvent.setup();
      render(<WizardContainer />);
      await user.click(screen.getByRole('button', { name: /next/i }));
      // Should now show step 2 "Decedent Details"
      expect(screen.getByTestId('decedent-step')).toBeInTheDocument();
    });

    it('shows Back button on step 2', async () => {
      const user = userEvent.setup();
      render(<WizardContainer />);
      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('goes back to previous step when Back is clicked', async () => {
      const user = userEvent.setup();
      render(<WizardContainer />);
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /back/i }));
      // Should be back on step 1
      expect(screen.getByTestId('estate-step')).toBeInTheDocument();
    });

    it('skips Will step when hasWill is false (intestate)', async () => {
      const user = userEvent.setup();
      render(<WizardContainer />);
      // Navigate: Estate → Decedent → Family Tree → should skip Will → Donations
      await user.click(screen.getByRole('button', { name: /next/i })); // → Decedent
      await user.click(screen.getByRole('button', { name: /next/i })); // → Family Tree
      await user.click(screen.getByRole('button', { name: /next/i })); // → should skip to Donations
      expect(screen.getByTestId('donations-step')).toBeInTheDocument();
    });

    it('renders step indicator with correct number of visible steps', () => {
      render(<WizardContainer />);
      // When hasWill=false, should show 5 steps (skip Will)
      // Look for step indicator items
      const stepIndicators = screen.getAllByTestId(/step-indicator-/);
      expect(stepIndicators.length).toBe(5); // 6 total minus Will step
    });
  });

  describe('form state management', () => {
    it('maintains form state across step navigation', async () => {
      const user = userEvent.setup();
      render(<WizardContainer />);
      // Fill something in estate step, navigate away, come back
      const estateInput = screen.getByLabelText(/Net Distributable Estate/i);
      await user.clear(estateInput);
      await user.type(estateInput, '1000000');
      // Navigate forward then back
      await user.click(screen.getByRole('button', { name: /next/i }));
      await user.click(screen.getByRole('button', { name: /back/i }));
      // Value should persist
      expect(screen.getByLabelText(/Net Distributable Estate/i)).toHaveValue('1,000,000.00');
    });
  });

  describe('default constants', () => {
    it('MARRIAGE_DEFAULTS has all 6 marriage-gated fields', () => {
      expect(MARRIAGE_DEFAULTS).toEqual({
        date_of_marriage: null,
        years_of_cohabitation: 0,
        has_legal_separation: false,
        marriage_solemnized_in_articulo_mortis: false,
        was_ill_at_marriage: false,
        illness_caused_death: false,
      });
    });

    it('ARTICULO_MORTIS_DEFAULTS resets illness fields', () => {
      expect(ARTICULO_MORTIS_DEFAULTS).toEqual({
        was_ill_at_marriage: false,
        illness_caused_death: false,
      });
    });

    it('ILLNESS_DEFAULTS resets illness_caused_death', () => {
      expect(ILLNESS_DEFAULTS).toEqual({
        illness_caused_death: false,
      });
    });
  });
});
