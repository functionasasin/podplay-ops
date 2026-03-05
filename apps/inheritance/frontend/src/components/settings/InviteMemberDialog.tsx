import { useState, type FormEvent } from 'react';
import type { OrgRole } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: OrgRole) => Promise<void>;
  seatUsage: { used: number; limit: number; available: number; isFull: boolean };
}

const ROLES: { value: OrgRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'attorney', label: 'Attorney' },
  { value: 'paralegal', label: 'Paralegal' },
  { value: 'readonly', label: 'Readonly' },
];

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
  seatUsage,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('attorney');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  const isValidEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setSubmitError(null);

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setInviting(true);
    try {
      await onInvite(email, role);
      setEmail('');
      setRole('attorney');
      onOpenChange(false);
    } catch (err) {
      setSubmitError(
        `Invitation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    } finally {
      setInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Seats: {seatUsage.used} / {seatUsage.limit}
        </p>

        {seatUsage.isFull && (
          <p className="text-sm text-destructive">
            Seat limit reached. Upgrade your plan to add more members.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              placeholder="colleague@firm.ph"
            />
            {emailError && <p className="text-destructive text-sm">{emailError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {submitError && <p className="text-destructive text-sm">{submitError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={seatUsage.isFull || inviting}>
              {inviting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
