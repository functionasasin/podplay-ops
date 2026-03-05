import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResultsHeader } from '../ResultsHeader';
import { formatDateOfDeath } from '../utils';
import type { ScenarioCode, SuccessionType, Money } from '../../../types';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function renderHeader(overrides: {
  scenarioCode?: ScenarioCode;
  successionType?: SuccessionType;
  netDistributableEstate?: Money;
  decedentName?: string;
  dateOfDeath?: string;
} = {}) {
  return render(
    <ResultsHeader
      scenarioCode={overrides.scenarioCode ?? 'I1'}
      successionType={overrides.successionType ?? 'Intestate'}
      netDistributableEstate={overrides.netDistributableEstate ?? { centavos: 500000000 }}
      decedentName={overrides.decedentName ?? 'Juan dela Cruz'}
      dateOfDeath={overrides.dateOfDeath ?? '2024-03-15'}
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

  // --------------------------------------------------------------------------
  // Stage 4 — Decedent Header (§4.13)
  // --------------------------------------------------------------------------

  describe('decedent header', () => {
    it('renders "Estate of Juan dela Cruz" in the h1', () => {
      renderHeader({ decedentName: 'Juan dela Cruz' });
      expect(screen.getByText(/Estate of Juan dela Cruz/)).toBeInTheDocument();
    });

    it('renders "Estate of Maria Santos" for a different decedent', () => {
      renderHeader({ decedentName: 'Maria Santos' });
      expect(screen.getByText(/Estate of Maria Santos/)).toBeInTheDocument();
    });

    it('renders "Date of Death: 15 Mar 2024"', () => {
      renderHeader({ dateOfDeath: '2024-03-15' });
      expect(screen.getByText(/Date of Death: 15 Mar 2024/)).toBeInTheDocument();
    });

    it('renders DOD for a different date "01 Jan 2020"', () => {
      renderHeader({ dateOfDeath: '2020-01-01' });
      expect(screen.getByText(/Date of Death: 1 Jan 2020/)).toBeInTheDocument();
    });

    it('renders DOD for December "31 Dec 2025"', () => {
      renderHeader({ dateOfDeath: '2025-12-31' });
      expect(screen.getByText(/Date of Death: 31 Dec 2025/)).toBeInTheDocument();
    });

    it('falls back gracefully when decedent name is empty', () => {
      renderHeader({ decedentName: '' });
      // Should still render the header — just "Estate of" with no name
      expect(screen.getByTestId('results-header')).toBeInTheDocument();
      expect(screen.getByText(/Estate of/)).toBeInTheDocument();
    });
  });
});

// --------------------------------------------------------------------------
// formatDateOfDeath utility tests (§4.13)
// --------------------------------------------------------------------------

describe('formatDateOfDeath', () => {
  it('formats "2024-03-15" as "15 Mar 2024"', () => {
    expect(formatDateOfDeath('2024-03-15')).toBe('15 Mar 2024');
  });

  it('formats "2020-01-01" as "1 Jan 2020"', () => {
    expect(formatDateOfDeath('2020-01-01')).toBe('1 Jan 2020');
  });

  it('formats "2025-12-31" as "31 Dec 2025"', () => {
    expect(formatDateOfDeath('2025-12-31')).toBe('31 Dec 2025');
  });

  it('formats "2023-06-09" as "9 Jun 2023"', () => {
    expect(formatDateOfDeath('2023-06-09')).toBe('9 Jun 2023');
  });

  it('formats "2024-02-29" (leap day) as "29 Feb 2024"', () => {
    expect(formatDateOfDeath('2024-02-29')).toBe('29 Feb 2024');
  });

  it('formats "1999-11-05" as "5 Nov 1999"', () => {
    expect(formatDateOfDeath('1999-11-05')).toBe('5 Nov 1999');
  });
});
