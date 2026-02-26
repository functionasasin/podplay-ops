import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultsHeader } from '../ResultsHeader';
import type { ScenarioCode, SuccessionType, Money } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function renderHeader(overrides: {
  scenarioCode?: ScenarioCode;
  successionType?: SuccessionType;
  netDistributableEstate?: Money;
} = {}) {
  return render(
    <ResultsHeader
      scenarioCode={overrides.scenarioCode ?? 'I1'}
      successionType={overrides.successionType ?? 'Intestate'}
      netDistributableEstate={overrides.netDistributableEstate ?? { centavos: 500000000 }}
    />,
  );
}

// --------------------------------------------------------------------------
// Tests — ResultsHeader (results)
// --------------------------------------------------------------------------

describe('results > ResultsHeader', () => {
  describe('rendering', () => {
    it('renders the results header container', () => {
      renderHeader();
      expect(screen.getByTestId('results-header')).toBeInTheDocument();
    });

    it('renders the title "Philippine Inheritance Distribution"', () => {
      renderHeader();
      expect(screen.getByText(/Philippine Inheritance Distribution/i)).toBeInTheDocument();
    });
  });

  describe('scenario badge', () => {
    it('renders scenario code text for I1', () => {
      renderHeader({ scenarioCode: 'I1' });
      expect(screen.getByText('I1')).toBeInTheDocument();
    });

    it('renders scenario code text for T3', () => {
      renderHeader({ scenarioCode: 'T3' });
      expect(screen.getByText('T3')).toBeInTheDocument();
    });

    it('renders scenario code for I15 (escheat)', () => {
      renderHeader({ scenarioCode: 'I15', successionType: 'Intestate' });
      expect(screen.getByText('I15')).toBeInTheDocument();
    });

    it('renders scenario badge with correct color for Intestate (blue)', () => {
      renderHeader({ successionType: 'Intestate' });
      const badge = screen.getByTestId('scenario-badge');
      expect(badge.className).toMatch(/blue/);
    });

    it('renders scenario badge with correct color for Testate (green)', () => {
      renderHeader({ successionType: 'Testate', scenarioCode: 'T1' });
      const badge = screen.getByTestId('scenario-badge');
      expect(badge.className).toMatch(/green/);
    });

    it('renders scenario badge with correct color for IntestateByPreterition (red)', () => {
      renderHeader({ successionType: 'IntestateByPreterition', scenarioCode: 'T3' });
      const badge = screen.getByTestId('scenario-badge');
      expect(badge.className).toMatch(/red/);
    });

    it('renders scenario badge with correct color for Mixed (amber)', () => {
      renderHeader({ successionType: 'Mixed', scenarioCode: 'T3' });
      const badge = screen.getByTestId('scenario-badge');
      expect(badge.className).toMatch(/amber/);
    });
  });

  describe('succession type display', () => {
    it('shows "Intestate Succession" label for Intestate type', () => {
      renderHeader({ successionType: 'Intestate' });
      expect(screen.getByText(/Intestate Succession/i)).toBeInTheDocument();
    });

    it('shows "Testate Succession" label for Testate type', () => {
      renderHeader({ successionType: 'Testate', scenarioCode: 'T1' });
      expect(screen.getByText(/Testate Succession/i)).toBeInTheDocument();
    });

    it('shows "Mixed Succession" label for Mixed type', () => {
      renderHeader({ successionType: 'Mixed', scenarioCode: 'T3' });
      expect(screen.getByText(/Mixed Succession/i)).toBeInTheDocument();
    });
  });

  describe('succession type banners', () => {
    it('shows preterition error banner for IntestateByPreterition', () => {
      renderHeader({ successionType: 'IntestateByPreterition', scenarioCode: 'T3' });
      expect(screen.getByText(/Preterition Detected/i)).toBeInTheDocument();
      expect(screen.getByText(/Art\. 854/i)).toBeInTheDocument();
    });

    it('preterition banner mentions institutions annulled', () => {
      renderHeader({ successionType: 'IntestateByPreterition', scenarioCode: 'T3' });
      expect(screen.getByText(/annulled/i)).toBeInTheDocument();
    });

    it('shows mixed succession info banner for Mixed type', () => {
      renderHeader({ successionType: 'Mixed', scenarioCode: 'T3' });
      expect(screen.getByText(/Mixed Succession/i)).toBeInTheDocument();
    });

    it('does NOT show preterition banner for Intestate type', () => {
      renderHeader({ successionType: 'Intestate' });
      expect(screen.queryByText(/Preterition Detected/i)).not.toBeInTheDocument();
    });

    it('does NOT show preterition banner for Testate type', () => {
      renderHeader({ successionType: 'Testate', scenarioCode: 'T1' });
      expect(screen.queryByText(/Preterition Detected/i)).not.toBeInTheDocument();
    });
  });

  describe('estate total', () => {
    it('displays formatted estate total for ₱5,000,000', () => {
      renderHeader({ netDistributableEstate: { centavos: 500000000 } });
      expect(screen.getByText(/₱5,000,000/)).toBeInTheDocument();
    });

    it('displays formatted estate total for ₱500.25', () => {
      renderHeader({ netDistributableEstate: { centavos: 50025 } });
      expect(screen.getByText(/₱500\.25/)).toBeInTheDocument();
    });

    it('displays "Total Estate" label', () => {
      renderHeader();
      expect(screen.getByText(/Total Estate/i)).toBeInTheDocument();
    });
  });
});
