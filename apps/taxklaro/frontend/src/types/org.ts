export type OrgRole = 'admin' | 'accountant' | 'staff' | 'readonly';
export type OrgPlan = 'free' | 'pro' | 'enterprise';
export type ComputationStatus = 'draft' | 'computed' | 'finalized' | 'archived';

export interface ComputationRow {
  id: string;
  orgId: string;
  clientId: string | null;
  createdBy: string;
  title: string;
  taxYear: number;
  status: ComputationStatus;
  inputJson: Record<string, unknown> | null;
  outputJson: Record<string, unknown> | null;
  regimeSelected: string | null;
  shareToken: string;
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComputationListItem {
  id: string;
  title: string;
  taxYear: number;
  status: ComputationStatus;
  regimeSelected: string | null;
  shareEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  clientId: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrgPlan;
  seatLimit: number;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  joinedAt: string;
}

export const ROLE_PERMISSIONS: Record<OrgRole, { canInvite: boolean; canEdit: boolean; canDelete: boolean; canExportPdf: boolean }> = {
  admin: { canInvite: true, canEdit: true, canDelete: true, canExportPdf: true },
  accountant: { canInvite: false, canEdit: true, canDelete: false, canExportPdf: true },
  staff: { canInvite: false, canEdit: true, canDelete: false, canExportPdf: false },
  readonly: { canInvite: false, canEdit: false, canDelete: false, canExportPdf: false },
};
