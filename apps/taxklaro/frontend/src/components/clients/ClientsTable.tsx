import { ClientRowSkeleton } from './ClientRowSkeleton';

interface Client {
  id: string;
  fullName: string;
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
      <div className="rounded-xl bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => <ClientRowSkeleton key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm">
      <div className="min-w-[480px] bg-card rounded-xl overflow-hidden">
      <table className="w-full text-[0.9375rem]">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-5 py-3.5 text-left text-[0.8125rem] font-medium text-muted-foreground uppercase tracking-wide">Name</th>
            <th className="px-5 py-3.5 text-left text-[0.8125rem] font-medium text-muted-foreground uppercase tracking-wide">Email</th>
            <th className="px-5 py-3.5 text-right text-[0.8125rem] font-medium text-muted-foreground uppercase tracking-wide">Computations</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr
              key={c.id}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => onSelect?.(c.id)}
            >
              <td className="px-5 py-4 font-medium">{c.fullName}</td>
              <td className="px-5 py-4 text-muted-foreground">{c.email ?? '—'}</td>
              <td className="px-5 py-4 text-right tabular-nums">{c.computationCount ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default ClientsTable;
