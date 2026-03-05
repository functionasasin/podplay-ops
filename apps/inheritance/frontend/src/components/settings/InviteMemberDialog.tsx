import { useState, type FormEvent } from 'react';
import type { OrgRole } from '@/types';

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
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

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

    setSubmitting(true);
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
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <div role="dialog" aria-modal="true">
      <h2>Invite Member</h2>

      <p>
        Seats: {seatUsage.used} / {seatUsage.limit}
      </p>

      {seatUsage.isFull && (
        <p className="text-destructive">
          Seat limit reached. Upgrade your plan to add more members.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="invite-email">Email</label>
          <input
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

        <div>
          <label htmlFor="invite-role">Role</label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as OrgRole)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {submitError && <p className="text-destructive text-sm">{submitError}</p>}

        <div className="flex gap-2 justify-end mt-4">
          <button type="button" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" disabled={seatUsage.isFull || submitting}>
            Invite
          </button>
        </div>
      </form>
    </div>
  );
}
