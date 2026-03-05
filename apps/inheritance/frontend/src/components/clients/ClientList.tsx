import type { ClientListItem, ClientStatus } from '@/types/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users } from 'lucide-react';

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

const STATUS_LABELS: Record<ClientStatus | 'all', string> = {
  all: 'All',
  active: 'Active',
  former: 'Former',
};

const SORT_LABELS: Record<'name' | 'intake_date' | 'status', string> = {
  name: 'Name A-Z',
  intake_date: 'Intake Date',
  status: 'Status',
};

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
    <div data-testid="client-list" className="space-y-4">
      <div data-testid="client-list-controls" className="flex flex-wrap gap-3">
        <Input
          data-testid="client-search"
          type="text"
          placeholder="Search clients by name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px]"
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilterChange(v as ClientStatus | 'all')}
        >
          <SelectTrigger data-testid="client-status-filter" className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {(['all', 'active', 'former'] as const).map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(v) => onSortChange(v as 'name' | 'intake_date' | 'status')}
        >
          <SelectTrigger data-testid="client-sort" className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {(['name', 'intake_date', 'status'] as const).map((s) => (
              <SelectItem key={s} value={s}>{SORT_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div data-testid="client-list-loading" className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>TIN</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map(i => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking estate cases"
        />
      ) : (
        <div className="overflow-x-auto">
          <Table data-testid="client-list-table">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>TIN</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  data-testid={`client-row-${client.id}`}
                  onClick={() => onClientClick(client.id)}
                  className="cursor-pointer"
                >
                  <TableCell data-testid="client-name" className="font-medium">{client.full_name}</TableCell>
                  <TableCell data-testid="client-tin">{client.tin ? maskTIN(client.tin) : '-'}</TableCell>
                  <TableCell data-testid="client-case-count">{client.case_count}</TableCell>
                  <TableCell data-testid="client-status">
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {client.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
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
