import { Button } from '@/components/ui/button';
import { UserMinus } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface MembersTableProps {
  members: Member[];
  currentUserId?: string;
  onRemove?: (id: string) => Promise<void>;
}

export function MembersTable({ members, currentUserId, onRemove }: MembersTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Role</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-b last:border-0">
              <td className="px-4 py-3">{m.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
              <td className="px-4 py-3">{m.role}</td>
              <td className="px-4 py-3 text-right">
                {m.id !== currentUserId && onRemove && (
                  <Button size="sm" variant="ghost" onClick={() => onRemove(m.id)}>
                    <UserMinus className="h-4 w-4 mr-1" />Remove
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

export default MembersTable;
