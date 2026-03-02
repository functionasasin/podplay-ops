import { supabase } from './supabase';

export interface FirmProfile {
  firmName: string | null;
  firmAddress: string | null;
  firmPhone: string | null;
  firmEmail: string | null;
  counselName: string | null;
  counselEmail: string | null;
  counselPhone: string | null;
  ibpRollNo: string | null;
  ptrNo: string | null;
  mcleComplianceNo: string | null;
  logoUrl: string | null;
  letterheadColor: string;
  secondaryColor: string;
}

export const DEFAULT_LETTERHEAD_COLOR = '#1E3A5F';
export const DEFAULT_SECONDARY_COLOR = '#C9A84C';
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
export const LOGO_BUCKET = 'firm-logos';

export function defaultFirmProfile(): FirmProfile {
  return {
    firmName: null,
    firmAddress: null,
    firmPhone: null,
    firmEmail: null,
    counselName: null,
    counselEmail: null,
    counselPhone: null,
    ibpRollNo: null,
    ptrNo: null,
    mcleComplianceNo: null,
    logoUrl: null,
    letterheadColor: DEFAULT_LETTERHEAD_COLOR,
    secondaryColor: DEFAULT_SECONDARY_COLOR,
  };
}

/** Convert DB row (snake_case) to FirmProfile (camelCase) */
export function rowToFirmProfile(row: Record<string, unknown>): FirmProfile {
  // stub — will be implemented
  void row;
  return defaultFirmProfile();
}

/** Convert FirmProfile (camelCase) to DB update payload (snake_case) */
export function firmProfileToRow(profile: FirmProfile): Record<string, unknown> {
  // stub — will be implemented
  void profile;
  return {};
}

/** Load the current user's firm profile */
export async function loadFirmProfile(userId: string): Promise<FirmProfile> {
  // stub — will be implemented
  void userId;
  void supabase;
  return defaultFirmProfile();
}

/** Save firm profile fields (upsert) */
export async function saveFirmProfile(userId: string, profile: Partial<FirmProfile>): Promise<void> {
  // stub — will be implemented
  void userId;
  void profile;
}

/** Validate logo file type and size */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  // stub — will be implemented
  void file;
  return { valid: true };
}

/** Upload logo to Supabase Storage */
export async function uploadLogo(userId: string, file: File): Promise<string> {
  // stub — will be implemented
  void userId;
  void file;
  return '';
}

/** Delete logo from Supabase Storage */
export async function deleteLogo(userId: string, currentPath: string): Promise<void> {
  // stub — will be implemented
  void userId;
  void currentPath;
}
