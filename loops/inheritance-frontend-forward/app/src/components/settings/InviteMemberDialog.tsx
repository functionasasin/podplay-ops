import type { OrgRole } from '@/types';

export interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: OrgRole) => Promise<void>;
  seatUsage: { used: number; limit: number; available: number; isFull: boolean };
}

export function InviteMemberDialog(_props: InviteMemberDialogProps) {
  return null; // stub — implementation in next iteration
}
