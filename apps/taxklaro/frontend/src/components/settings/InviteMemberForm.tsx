import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';

interface InviteMemberFormProps {
  onInvite: (email: string, role: string) => Promise<void>;
}

export function InviteMemberForm({ onInvite }: InviteMemberFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    await onInvite(email.trim(), role);
    setEmail('');
    setIsSubmitting(false);
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border/50 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <h2 className="font-display text-xl text-foreground">Invite Member</h2>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-32 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={isSubmitting || !email.trim()}>
          <UserPlus className="h-4 w-4 mr-2" />Send Invitation
        </Button>
      </form>
    </div>
  );
}

export default InviteMemberForm;
