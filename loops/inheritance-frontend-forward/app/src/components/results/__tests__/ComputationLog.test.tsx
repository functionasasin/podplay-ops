import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { ComputationLog } from '../ComputationLog';
import type { ComputationLog as ComputationLogType } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function createLog(overrides: Partial<ComputationLogType> = {}): ComputationLogType {
  return {
    steps: [
      {
        step_number: 10,
        step_name: 'Finalize + Narrate',
        description: 'Converted fractional shares to peso amounts and generated narratives',
      },
    ],
    total_restarts: 0,
    final_scenario: 'I4',
    ...overrides,
  };
}

function renderLog(overrides: Partial<ComputationLogType> = {}) {
  return render(<ComputationLog log={createLog(overrides)} />);
}

// --------------------------------------------------------------------------
// Tests — ComputationLog (results)
// --------------------------------------------------------------------------

describe('results > ComputationLog', () => {
  describe('rendering', () => {
    it('renders the computation log container', () => {
      renderLog();
      expect(screen.getByTestId('computation-log')).toBeInTheDocument();
    });

    it('renders "Computation Log" heading', () => {
      renderLog();
      expect(screen.getByText(/Computation Log/i)).toBeInTheDocument();
    });
  });

  describe('collapsed by default', () => {
    it('is collapsed by default', () => {
      renderLog();
      // Step details should not be visible until expanded
      expect(screen.queryByText(/Finalize \+ Narrate/i)).not.toBeInTheDocument();
    });

    it('expands when clicked', async () => {
      const user = userEvent.setup();
      renderLog();
      await user.click(screen.getByText(/Computation Log/i));
      expect(screen.getByText(/Finalize \+ Narrate/i)).toBeInTheDocument();
    });
  });

  describe('expanded content', () => {
    it('shows final scenario after expanding', async () => {
      const user = userEvent.setup();
      renderLog({ final_scenario: 'I4' });
      await user.click(screen.getByText(/Computation Log/i));
      expect(screen.getByText(/I4/)).toBeInTheDocument();
    });

    it('shows total restarts as "0 restarts"', async () => {
      const user = userEvent.setup();
      renderLog({ total_restarts: 0 });
      await user.click(screen.getByText(/Computation Log/i));
      expect(screen.getByText(/0 restart/i)).toBeInTheDocument();
    });

    it('shows restart explanation when total_restarts > 0', async () => {
      const user = userEvent.setup();
      renderLog({ total_restarts: 2 });
      await user.click(screen.getByText(/Computation Log/i));
      expect(screen.getByText(/2 restart/i)).toBeInTheDocument();
      expect(screen.getByText(/Pipeline restart/i)).toBeInTheDocument();
    });

    it('renders step log entries', async () => {
      const user = userEvent.setup();
      renderLog({
        steps: [
          {
            step_number: 10,
            step_name: 'Finalize + Narrate',
            description: 'Generated narratives',
          },
        ],
      });
      await user.click(screen.getByText(/Computation Log/i));
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/Finalize \+ Narrate/i)).toBeInTheDocument();
      expect(screen.getByText(/Generated narratives/i)).toBeInTheDocument();
    });

    it('renders multiple step log entries', async () => {
      const user = userEvent.setup();
      renderLog({
        steps: [
          { step_number: 3, step_name: 'Scenario', description: 'Determined scenario' },
          { step_number: 10, step_name: 'Finalize', description: 'Final step' },
        ],
      });
      await user.click(screen.getByText(/Computation Log/i));
      expect(screen.getByText(/Scenario/)).toBeInTheDocument();
      expect(screen.getByText(/Finalize/)).toBeInTheDocument();
    });
  });
});
