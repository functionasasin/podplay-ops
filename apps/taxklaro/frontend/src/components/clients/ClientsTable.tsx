import { ClientRowSkeleton } from './ClientRowSkeleton';

interface Client {
  id: string;
  name: string;
  email?: string | null;
  computationCount?: number;
}

interface ClientsTableProps {
  clients: Client[];
  isLoading?: boolean;
  onSelect?: (id: string) => void;
}

export function ClientsTable({ clients, isLoading, onSelect }: ClientsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <ClientRowSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-right font-medium">Computations</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr
              key={c.id}
              className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
              onClick={() => onSelect?.(c.id)}
            >
              <td className="px-4 py-3">{c.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.email ?? '—'}</td>
              <td className="px-4 py-3 text-right">{c.computationCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientsTable;
