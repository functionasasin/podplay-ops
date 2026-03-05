/**
 * Client Profile types (§4.3)
 * Source of truth: docs/plans/inheritance-premium-spec.md §4.3
 */

export type ClientStatus = 'active' | 'former';

export type GovIdType =
  | 'philsys_id'
  | 'passport'
  | 'drivers_license'
  | 'sss'
  | 'gsis'
  | 'prc'
  | 'voters_id'
  | 'postal_id'
  | 'senior_citizen_id'
  | 'umid'
  | 'nbi_clearance';

export type CivilStatus =
  | 'single'
  | 'married'
  | 'widowed'
  | 'legally_separated'
  | 'annulled';

export const GOV_ID_TYPES: readonly GovIdType[] = [
  'philsys_id',
  'passport',
  'drivers_license',
  'sss',
  'gsis',
  'prc',
  'voters_id',
  'postal_id',
  'senior_citizen_id',
  'umid',
  'nbi_clearance',
];

export const GOV_ID_TYPE_LABELS: Record<GovIdType, string> = {
  philsys_id: 'PhilSys ID',
  passport: 'Passport',
  drivers_license: "Driver's License",
  sss: 'SSS',
  gsis: 'GSIS',
  prc: 'PRC ID',
  voters_id: "Voter's ID",
  postal_id: 'Postal ID',
  senior_citizen_id: 'Senior Citizen ID',
  umid: 'UMID',
  nbi_clearance: 'NBI Clearance',
};

export const CIVIL_STATUSES: readonly CivilStatus[] = [
  'single',
  'married',
  'widowed',
  'legally_separated',
  'annulled',
];

export const CIVIL_STATUS_LABELS: Record<CivilStatus, string> = {
  single: 'Single',
  married: 'Married',
  widowed: 'Widowed',
  legally_separated: 'Legally Separated',
  annulled: 'Annulled',
};

export interface ClientRow {
  id: string;
  org_id: string;
  full_name: string;
  nickname: string | null;
  date_of_birth: string | null;
  place_of_birth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tin: string | null;
  gov_id_type: GovIdType | null;
  gov_id_number: string | null;
  civil_status: CivilStatus | null;
  status: ClientStatus;
  intake_date: string;
  referral_source: string | null;
  conflict_cleared: boolean | null;
  conflict_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientListItem {
  id: string;
  full_name: string;
  tin: string | null;
  status: ClientStatus;
  intake_date: string;
  conflict_cleared: boolean | null;
  case_count: number;
}

export interface CreateClientData {
  org_id: string;
  full_name: string;
  nickname?: string | null;
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tin?: string | null;
  gov_id_type?: GovIdType | null;
  gov_id_number?: string | null;
  civil_status?: CivilStatus | null;
  intake_date: string;
  referral_source?: string | null;
  created_by: string;
}

export interface UpdateClientData {
  full_name?: string;
  nickname?: string | null;
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tin?: string | null;
  gov_id_type?: GovIdType | null;
  gov_id_number?: string | null;
  civil_status?: CivilStatus | null;
  status?: ClientStatus;
  referral_source?: string | null;
  conflict_cleared?: boolean | null;
  conflict_notes?: string | null;
}
