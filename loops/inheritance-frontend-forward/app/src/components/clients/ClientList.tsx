import type { ClientListItem, ClientStatus } from '@/types/client';

export interface ClientListProps {
  clients: ClientListItem[];
  loading?: boolean;
  statusFilter: ClientStatus | 'all';
  searchQuery: string;
  sortBy: 'name' | 'intake_date' | 'status';
  onStatusFilterChange: (status: ClientStatus | 'all') => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: 'name' | 'intake_date' | 'status') => void;
  onClientClick: (clientId: string) => void;
}

export function ClientList(props: ClientListProps) {
  const {
    clients,
    loading,
    statusFilter,
    searchQuery,
    sortBy,
    onStatusFilterChange,
    onSearchChange,
    onSortChange,
    onClientClick,
  } = props;

  return (
    <div data-testid="client-list">
      <div data-testid="client-list-controls">
        <input
          data-testid="client-search"
          type="text"
          placeholder="Search clients by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        <select
          data-testid="client-status-filter"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as ClientStatus | 'all')}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="former">Former</option>
        </select>

        <select
          data-testid="client-sort"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'name' | 'intake_date' | 'status')}
        >
          <option value="name">Name A-Z</option>
          <option value="intake_date">Intake Date</option>
          <option value="status">Status</option>
        </select>
      </div>

      {loading && <div data-testid="client-list-loading">Loading...</div>}

      <table data-testid="client-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>TIN</th>
            <th>Cases</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.id}
              data-testid={`client-row-${client.id}`}
              onClick={() => onClientClick(client.id)}
              style={{ cursor: 'pointer' }}
            >
              <td data-testid="client-name">{client.full_name}</td>
              <td data-testid="client-tin">{client.tin ? maskTIN(client.tin) : '-'}</td>
              <td data-testid="client-case-count">{client.case_count}</td>
              <td data-testid="client-status">{client.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function maskTIN(tin: string): string {
  // Show masked TIN: XXX-XXX-XXX → ***-***-789
  const parts = tin.split('-');
  if (parts.length >= 3) {
    return parts.map((p, i) => (i < parts.length - 1 ? '***' : p)).join('-');
  }
  return tin;
}

export { maskTIN };
