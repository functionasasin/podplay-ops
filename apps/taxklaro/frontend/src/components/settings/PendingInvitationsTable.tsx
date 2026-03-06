import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface PendingInvitationsTableProps {
  invitations: Invitation[];
  onRevoke?: (id: string) => Promise<void>;
}

export function PendingInvitationsTable({ invitations, onRevoke }: PendingInvitationsTableProps) {
  if (invitations.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending invitations.</p>;
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sent</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {invitations.map((inv) => (
            <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-medium">{inv.email}</td>
              <td className="px-4 py-3 capitalize">{inv.role}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(inv.createdAt).toLocaleDateString('en-PH')}
              </td>
              <td className="px-4 py-3 text-right">
                {onRevoke && (
                  <Button size="sm" variant="ghost" onClick={() => onRevoke(inv.id)}>
                    <X className="h-4 w-4 mr-1" />Revoke
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PendingInvitationsTable;
