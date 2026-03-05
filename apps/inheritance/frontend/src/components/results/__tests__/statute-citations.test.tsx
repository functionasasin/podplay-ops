import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { StatuteCitationsSection } from '../StatuteCitationsSection';

// --------------------------------------------------------------------------
// Tests — StatuteCitationsSection
// --------------------------------------------------------------------------

describe('statute-citations > StatuteCitationsSection', () => {
  describe('rendering legal basis chips', () => {
    it('renders all legal_basis entries as chips', () => {
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887', 'Art.980', 'Art.996']}
          heirName="Maria Santos"
        />,
      );
      expect(screen.getByText('Art.887')).toBeInTheDocument();
      expect(screen.getByText('Art.980')).toBeInTheDocument();
      expect(screen.getByText('Art.996')).toBeInTheDocument();
    });

    it('renders section header with heir name', () => {
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887']}
          heirName="Pedro Santos"
        />,
      );
      expect(
        screen.getByText(/Statutory Basis for Pedro Santos/i),
      ).toBeInTheDocument();
    });

    it('renders nothing when legal_basis is empty', () => {
      const { container } = render(
        <StatuteCitationsSection legalBasis={[]} heirName="Maria Santos" />,
      );
      // Should either render nothing or an empty container
      expect(container.textContent).toBe('');
    });
  });

  describe('chip click/hover shows article description', () => {
    it('clicking chip shows full article description', async () => {
      const user = userEvent.setup();
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887']}
          heirName="Maria Santos"
        />,
      );
      const chip = screen.getByText('Art.887');
      await user.click(chip);
      // After clicking, the full description should be visible
      expect(
        screen.getByText(/Compulsory heirs/i),
      ).toBeInTheDocument();
    });

    it('clicking a second chip shows its description', async () => {
      const user = userEvent.setup();
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887', 'Art.970']}
          heirName="Maria Santos"
        />,
      );
      const chip = screen.getByText('Art.970');
      await user.click(chip);
      expect(
        screen.getByText(/representation/i),
      ).toBeInTheDocument();
    });
  });

  describe('forcedExpanded mode', () => {
    it('shows all descriptions without click when forcedExpanded is true', () => {
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887', 'Art.980']}
          heirName="Maria Santos"
          forcedExpanded
        />,
      );
      // Both article descriptions should be visible immediately
      expect(
        screen.getByText(/Compulsory heirs/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Children of the deceased/i),
      ).toBeInTheDocument();
    });

    it('descriptions are NOT shown by default without forcedExpanded', () => {
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887', 'Art.980']}
          heirName="Maria Santos"
        />,
      );
      // Chips should be visible but descriptions should not
      expect(screen.getByText('Art.887')).toBeInTheDocument();
      expect(screen.getByText('Art.980')).toBeInTheDocument();
      expect(screen.queryByText(/Compulsory heirs/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Children of the deceased/i),
      ).not.toBeInTheDocument();
    });
  });

  describe('unknown articles', () => {
    it('renders unknown article key as chip without error', () => {
      render(
        <StatuteCitationsSection
          legalBasis={['Art.9999']}
          heirName="Maria Santos"
        />,
      );
      expect(screen.getByText('Art.9999')).toBeInTheDocument();
    });

    it('clicking unknown article shows raw key as description', async () => {
      const user = userEvent.setup();
      render(
        <StatuteCitationsSection
          legalBasis={['Art.9999']}
          heirName="Maria Santos"
        />,
      );
      await user.click(screen.getByText('Art.9999'));
      // Should gracefully show the raw text, not crash
      // The description area should contain the raw key
      const descriptionElements = screen.getAllByText('Art.9999');
      expect(descriptionElements.length).toBeGreaterThanOrEqual(1);
    });

    it('mixed known and unknown articles render correctly', async () => {
      const user = userEvent.setup();
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887', 'Art.9999']}
          heirName="Maria Santos"
          forcedExpanded
        />,
      );
      // Known article shows proper description
      expect(screen.getByText(/Compulsory heirs/i)).toBeInTheDocument();
      // Unknown article shows raw key
      expect(screen.getByText('Art.9999')).toBeInTheDocument();
    });
  });

  describe('multiple articles', () => {
    it('renders multiple articles for one heir', () => {
      render(
        <StatuteCitationsSection
          legalBasis={['Art.887', 'Art.980', 'Art.888', 'Art.892']}
          heirName="Maria Santos"
          forcedExpanded
        />,
      );
      expect(screen.getByText('Art.887')).toBeInTheDocument();
      expect(screen.getByText('Art.980')).toBeInTheDocument();
      expect(screen.getByText('Art.888')).toBeInTheDocument();
      expect(screen.getByText('Art.892')).toBeInTheDocument();
    });
  });
});
