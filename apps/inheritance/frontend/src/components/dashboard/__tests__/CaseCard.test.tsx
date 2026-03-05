import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { CaseListItem } from '@/types';
import { CaseCard } from '../CaseCard';

const baseCaseItem: CaseListItem = {
  id: 'case-1',
  title: 'Estate of Juan dela Cruz',
  status: 'computed',
  decedent_name: 'Juan dela Cruz',
  date_of_death: '2024-03-15',
  gross_estate: 5000000,
  updated_at: '2024-03-15T10:00:00Z',
  notes_count: 3,
};

describe('CaseCard', () => {
  it('renders decedent name', () => {
    render(<CaseCard caseItem={baseCaseItem} />);
    expect(screen.getByText('Juan dela Cruz')).toBeInTheDocument();
  });

  it('renders date of death when present', () => {
    render(<CaseCard caseItem={baseCaseItem} />);
    expect(screen.getByText(/DOD:.*2024-03-15/)).toBeInTheDocument();
  });

  it('renders estate value formatted with peso sign', () => {
    render(<CaseCard caseItem={baseCaseItem} />);
    expect(screen.getByText(/Estate:.*₱.*5,000,000/)).toBeInTheDocument();
  });

  it('renders status badge with correct text', () => {
    render(<CaseCard caseItem={baseCaseItem} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('computed');
  });

  it('renders draft status with slate styling', () => {
    const draftCase = { ...baseCaseItem, status: 'draft' as const };
    render(<CaseCard caseItem={draftCase} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('slate');
  });

  it('renders finalized status with green styling', () => {
    const finalCase = { ...baseCaseItem, status: 'finalized' as const };
    render(<CaseCard caseItem={finalCase} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('green');
  });

  it('renders archived status with gray styling', () => {
    const archCase = { ...baseCaseItem, status: 'archived' as const };
    render(<CaseCard caseItem={archCase} />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('gray');
  });

  it('falls back to title when decedent_name is null', () => {
    const noName = { ...baseCaseItem, decedent_name: null };
    render(<CaseCard caseItem={noName} />);
    expect(screen.getByText('Estate of Juan dela Cruz')).toBeInTheDocument();
  });

  it('hides DOD line when date_of_death is null', () => {
    const noDod = { ...baseCaseItem, date_of_death: null };
    render(<CaseCard caseItem={noDod} />);
    expect(screen.queryByText(/DOD:/)).not.toBeInTheDocument();
  });

  it('hides estate value when gross_estate is null', () => {
    const noEstate = { ...baseCaseItem, gross_estate: null };
    render(<CaseCard caseItem={noEstate} />);
    expect(screen.queryByText(/Estate:/)).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<CaseCard caseItem={baseCaseItem} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('case-card'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
