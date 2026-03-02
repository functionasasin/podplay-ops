import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PrintHeader } from '../PrintHeader';

// --------------------------------------------------------------------------
// Tests — PrintHeader component
// --------------------------------------------------------------------------

describe('print > PrintHeader component', () => {
  it('renders firm name', () => {
    render(<PrintHeader firmName="Santos & Associates" caseTitle="Estate of Juan dela Cruz" />);
    expect(screen.getByText('Santos & Associates')).toBeInTheDocument();
  });

  it('renders case title', () => {
    render(<PrintHeader firmName="Santos & Associates" caseTitle="Estate of Juan dela Cruz" />);
    expect(screen.getByText('Estate of Juan dela Cruz')).toBeInTheDocument();
  });

  it('renders both firm name and case title together', () => {
    render(<PrintHeader firmName="Reyes Law Office" caseTitle="Estate of Maria Santos" />);
    expect(screen.getByText('Reyes Law Office')).toBeInTheDocument();
    expect(screen.getByText('Estate of Maria Santos')).toBeInTheDocument();
  });

  it('has the print-only CSS class', () => {
    const { container } = render(
      <PrintHeader firmName="Test Firm" caseTitle="Test Case" />,
    );
    // PrintHeader should only be visible in print — it should have a class
    // that hides it on screen and shows it on print
    const header = container.firstElementChild;
    expect(header).not.toBeNull();
    expect(header?.className).toMatch(/print-header|print-only|hidden/);
  });

  it('renders with empty firm name gracefully', () => {
    render(<PrintHeader firmName="" caseTitle="Estate of Juan dela Cruz" />);
    expect(screen.getByText('Estate of Juan dela Cruz')).toBeInTheDocument();
  });
});
