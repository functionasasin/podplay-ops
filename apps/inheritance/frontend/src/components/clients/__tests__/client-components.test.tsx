import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClientListItem } from '@/types/client';
import { GOV_ID_TYPES } from '@/types/client';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { ClientList, maskTIN } from '../ClientList';
import { ClientForm } from '../ClientForm';

// --------------------------------------------------------------------------
// Test helpers
// --------------------------------------------------------------------------

function createClientListItem(overrides: Partial<ClientListItem> = {}): ClientListItem {
  return {
    id: 'client-1',
    full_name: 'Santos, Maria Cristina',
    tin: '123-456-789',
    status: 'active',
    intake_date: '2026-03-01',
    conflict_cleared: true,
    case_count: 3,
    ...overrides,
  };
}

const mockClients: ClientListItem[] = [
  createClientListItem(),
  createClientListItem({
    id: 'client-2',
    full_name: 'dela Cruz, Juan Roberto',
    tin: '456-789-012',
    case_count: 1,
  }),
  createClientListItem({
    id: 'client-3',
    full_name: 'Cruz, Ana Marie',
    tin: null,
    case_count: 2,
  }),
  createClientListItem({
    id: 'client-4',
    full_name: 'Bautista, Jose Antonio',
    tin: '789-012-345',
    status: 'former',
    case_count: 1,
  }),
];

// --------------------------------------------------------------------------
// Tests — ClientList
// --------------------------------------------------------------------------

describe('crm > ClientList', () => {
  const defaultListProps = {
    clients: mockClients,
    loading: false,
    statusFilter: 'all' as const,
    searchQuery: '',
    sortBy: 'name' as const,
    onStatusFilterChange: vi.fn(),
    onSearchChange: vi.fn(),
    onSortChange: vi.fn(),
    onClientClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders client list with correct columns', () => {
    render(<ClientList {...defaultListProps} />);

    expect(screen.getByTestId('client-list')).toBeInTheDocument();
    expect(screen.getByTestId('client-list-table')).toBeInTheDocument();

    // Check column headers exist within the table
    const table = screen.getByTestId('client-list-table');
    const headers = table.querySelectorAll('th');
    const headerTexts = Array.from(headers).map((h) => h.textContent);
    expect(headerTexts).toContain('Name');
    expect(headerTexts).toContain('TIN');
    expect(headerTexts).toContain('Cases');
    expect(headerTexts).toContain('Status');
  });

  it('renders all client rows', () => {
    render(<ClientList {...defaultListProps} />);

    expect(screen.getByText('Santos, Maria Cristina')).toBeInTheDocument();
    expect(screen.getByText('dela Cruz, Juan Roberto')).toBeInTheDocument();
    expect(screen.getByText('Cruz, Ana Marie')).toBeInTheDocument();
    expect(screen.getByText('Bautista, Jose Antonio')).toBeInTheDocument();
  });

  it('shows masked TIN for clients with TIN', () => {
    render(<ClientList {...defaultListProps} />);

    // TIN '123-456-789' should be masked as '***-***-789'
    const tinCells = screen.getAllByTestId('client-tin');
    expect(tinCells[0].textContent).toBe('***-***-789');
    expect(tinCells[1].textContent).toBe('***-***-012');
  });

  it('shows dash for clients without TIN', () => {
    render(<ClientList {...defaultListProps} />);

    const tinCells = screen.getAllByTestId('client-tin');
    // Client 3 (Cruz, Ana Marie) has null TIN
    expect(tinCells[2].textContent).toBe('-');
  });

  it('renders case counts correctly', () => {
    render(<ClientList {...defaultListProps} />);

    const caseCells = screen.getAllByTestId('client-case-count');
    expect(caseCells[0].textContent).toBe('3');
    expect(caseCells[1].textContent).toBe('1');
    expect(caseCells[2].textContent).toBe('2');
    expect(caseCells[3].textContent).toBe('1');
  });

  it('search input calls onSearchChange', async () => {
    const user = userEvent.setup();
    render(<ClientList {...defaultListProps} />);

    const searchInput = screen.getByTestId('client-search');
    await user.type(searchInput, 'Santos');

    // onSearchChange called for each character
    expect(defaultListProps.onSearchChange).toHaveBeenCalled();
  });

  it('status filter dropdown has All, Active, Former options', () => {
    render(<ClientList {...defaultListProps} />);

    const select = screen.getByTestId('client-status-filter');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toBe('All');
    expect(options[1].textContent).toBe('Active');
    expect(options[2].textContent).toBe('Former');
  });

  it('sort dropdown has Name, Intake Date, Status options', () => {
    render(<ClientList {...defaultListProps} />);

    const select = screen.getByTestId('client-sort');
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toBe('Name A-Z');
    expect(options[1].textContent).toBe('Intake Date');
    expect(options[2].textContent).toBe('Status');
  });

  it('clicking a client row calls onClientClick', async () => {
    const user = userEvent.setup();
    render(<ClientList {...defaultListProps} />);

    await user.click(screen.getByTestId('client-row-client-1'));
    expect(defaultListProps.onClientClick).toHaveBeenCalledWith('client-1');
  });

  it('shows loading state', () => {
    render(<ClientList {...defaultListProps} loading={true} />);
    expect(screen.getByTestId('client-list-loading')).toBeInTheDocument();
  });
});

// --------------------------------------------------------------------------
// Tests — maskTIN
// --------------------------------------------------------------------------

describe('crm > maskTIN', () => {
  it('masks 9-digit TIN showing only last group', () => {
    expect(maskTIN('123-456-789')).toBe('***-***-789');
  });

  it('masks 12-digit TIN showing only last group', () => {
    expect(maskTIN('123-456-789-012')).toBe('***-***-***-012');
  });

  it('returns raw value if no hyphens', () => {
    expect(maskTIN('123456789')).toBe('123456789');
  });
});

// --------------------------------------------------------------------------
// Tests — ClientForm
// --------------------------------------------------------------------------

describe('crm > ClientForm', () => {
  const defaultFormProps = {
    onSubmit: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the client form', () => {
    render(<ClientForm {...defaultFormProps} />);
    expect(screen.getByTestId('client-form')).toBeInTheDocument();
  });

  it('renders identity section fields', () => {
    render(<ClientForm {...defaultFormProps} />);

    expect(screen.getByTestId('client-form-identity')).toBeInTheDocument();
    expect(screen.getByTestId('input-full-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-nickname')).toBeInTheDocument();
    expect(screen.getByTestId('input-date-of-birth')).toBeInTheDocument();
    expect(screen.getByTestId('input-place-of-birth')).toBeInTheDocument();
  });

  it('renders contact section fields', () => {
    render(<ClientForm {...defaultFormProps} />);

    expect(screen.getByTestId('client-form-contact')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-phone')).toBeInTheDocument();
    expect(screen.getByTestId('input-address')).toBeInTheDocument();
  });

  it('renders legal IDs section fields', () => {
    render(<ClientForm {...defaultFormProps} />);

    expect(screen.getByTestId('client-form-legal')).toBeInTheDocument();
    expect(screen.getByTestId('input-tin')).toBeInTheDocument();
    expect(screen.getByTestId('select-gov-id-type')).toBeInTheDocument();
    expect(screen.getByTestId('input-gov-id-number')).toBeInTheDocument();
    expect(screen.getByTestId('select-civil-status')).toBeInTheDocument();
  });

  it('gov ID type dropdown has 11 options plus placeholder', () => {
    render(<ClientForm {...defaultFormProps} />);

    const select = screen.getByTestId('select-gov-id-type');
    const options = select.querySelectorAll('option');
    // 11 gov ID types + 1 placeholder "Select ID Type"
    expect(options).toHaveLength(GOV_ID_TYPES.length + 1);
  });

  it('civil status dropdown has 5 options plus placeholder', () => {
    render(<ClientForm {...defaultFormProps} />);

    const select = screen.getByTestId('select-civil-status');
    const options = select.querySelectorAll('option');
    // 5 civil statuses + 1 placeholder
    expect(options).toHaveLength(6);
  });

  it('renders intake section fields', () => {
    render(<ClientForm {...defaultFormProps} />);

    expect(screen.getByTestId('client-form-intake')).toBeInTheDocument();
    expect(screen.getByTestId('input-intake-date')).toBeInTheDocument();
    expect(screen.getByTestId('input-referral-source')).toBeInTheDocument();
  });

  it('submit button shows Save Client', () => {
    render(<ClientForm {...defaultFormProps} />);

    const button = screen.getByTestId('submit-client');
    expect(button.textContent).toBe('Save Client');
  });

  it('submit button shows Saving... when loading', () => {
    render(<ClientForm {...defaultFormProps} loading={true} />);

    const button = screen.getByTestId('submit-client');
    expect(button.textContent).toBe('Saving...');
    expect(button).toBeDisabled();
  });

  it('applies default values when provided', () => {
    render(
      <ClientForm
        {...defaultFormProps}
        defaultValues={{
          full_name: 'Test Name',
          email: 'test@example.com',
          tin: '111-222-333',
        }}
      />,
    );

    expect(screen.getByTestId('input-full-name')).toHaveValue('Test Name');
    expect(screen.getByTestId('input-email')).toHaveValue('test@example.com');
    expect(screen.getByTestId('input-tin')).toHaveValue('111-222-333');
  });
});
