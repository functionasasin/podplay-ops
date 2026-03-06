import type { ISODate, FilingStatus } from './common';

export type OrgPlan = 'solo' | 'team' | 'firm';

export interface Organization {
  id: string;
  name: string;
  plan: OrgPlan;
  logoUrl: string | null;
  createdAt: ISODate;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  orgId: string | null;
  role: 'owner' | 'admin' | 'member';
}

export interface Computation {
  id: string;
  orgId: string;
  title: string;
  status: FilingStatus;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown> | null;
  shareToken: string | null;
  shareEnabled: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}
