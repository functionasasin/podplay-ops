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
  return {
    firmName: (row.firm_name as string | null) ?? null,
    firmAddress: (row.firm_address as string | null) ?? null,
    firmPhone: (row.firm_phone as string | null) ?? null,
    firmEmail: (row.firm_email as string | null) ?? null,
    counselName: (row.counsel_name as string | null) ?? null,
    counselEmail: (row.counsel_email as string | null) ?? null,
    counselPhone: (row.counsel_phone as string | null) ?? null,
    ibpRollNo: (row.ibp_roll_no as string | null) ?? null,
    ptrNo: (row.ptr_no as string | null) ?? null,
    mcleComplianceNo: (row.mcle_compliance_no as string | null) ?? null,
    logoUrl: (row.logo_url as string | null) ?? null,
    letterheadColor: (row.letterhead_color as string) ?? DEFAULT_LETTERHEAD_COLOR,
    secondaryColor: (row.secondary_color as string) ?? DEFAULT_SECONDARY_COLOR,
  };
}

/** Convert FirmProfile (camelCase) to DB update payload (snake_case) */
export function firmProfileToRow(profile: FirmProfile): Record<string, unknown> {
  return {
    firm_name: profile.firmName,
    firm_address: profile.firmAddress,
    firm_phone: profile.firmPhone,
    firm_email: profile.firmEmail,
    counsel_name: profile.counselName,
    counsel_email: profile.counselEmail,
    counsel_phone: profile.counselPhone,
    ibp_roll_no: profile.ibpRollNo,
    ptr_no: profile.ptrNo,
    mcle_compliance_no: profile.mcleComplianceNo,
    logo_url: profile.logoUrl,
    letterhead_color: profile.letterheadColor,
    secondary_color: profile.secondaryColor,
  };
}

/** Load the current user's firm profile */
export async function loadFirmProfile(userId: string): Promise<FirmProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return defaultFirmProfile();
  }

  return rowToFirmProfile(data as Record<string, unknown>);
}

/** Save firm profile fields (upsert) */
export async function saveFirmProfile(userId: string, updates: Partial<FirmProfile>): Promise<void> {
  const snakeUpdates: Record<string, unknown> = { id: userId };
  if (updates.firmName !== undefined) snakeUpdates.firm_name = updates.firmName;
  if (updates.firmAddress !== undefined) snakeUpdates.firm_address = updates.firmAddress;
  if (updates.firmPhone !== undefined) snakeUpdates.firm_phone = updates.firmPhone;
  if (updates.firmEmail !== undefined) snakeUpdates.firm_email = updates.firmEmail;
  if (updates.counselName !== undefined) snakeUpdates.counsel_name = updates.counselName;
  if (updates.counselEmail !== undefined) snakeUpdates.counsel_email = updates.counselEmail;
  if (updates.counselPhone !== undefined) snakeUpdates.counsel_phone = updates.counselPhone;
  if (updates.ibpRollNo !== undefined) snakeUpdates.ibp_roll_no = updates.ibpRollNo;
  if (updates.ptrNo !== undefined) snakeUpdates.ptr_no = updates.ptrNo;
  if (updates.mcleComplianceNo !== undefined) snakeUpdates.mcle_compliance_no = updates.mcleComplianceNo;
  if (updates.logoUrl !== undefined) snakeUpdates.logo_url = updates.logoUrl;
  if (updates.letterheadColor !== undefined) snakeUpdates.letterhead_color = updates.letterheadColor;
  if (updates.secondaryColor !== undefined) snakeUpdates.secondary_color = updates.secondaryColor;

  const { error } = await supabase.from('user_profiles').upsert(snakeUpdates);
  if (error) {
    throw new Error(error.message);
  }
}

/** Validate logo file type and size */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed formats: PNG, JPG, SVG' };
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds 2 MB limit' };
  }
  return { valid: true };
}

/** Get file extension from MIME type */
function extFromMime(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/jpeg') return 'jpg';
  if (type === 'image/svg+xml') return 'svg';
  return 'bin';
}

/** Upload logo to Supabase Storage */
export async function uploadLogo(userId: string, file: File): Promise<string> {
  const bucket = supabase.storage.from(LOGO_BUCKET);
  const folder = userId;

  // Delete previous logo files
  const { data: existing } = await bucket.list(folder);
  if (existing && existing.length > 0) {
    const paths = existing.map((f: { name: string }) => `${folder}/${f.name}`);
    await bucket.remove(paths);
  }

  // Upload new file
  const ext = extFromMime(file.type);
  const path = `${folder}/logo.${ext}`;
  const { data, error } = await bucket.upload(path, file, { upsert: true });
  if (error) {
    throw new Error(error.message);
  }

  return data.path;
}

/** Delete logo from Supabase Storage */
export async function deleteLogo(_userId: string, currentPath: string): Promise<void> {
  const bucket = supabase.storage.from(LOGO_BUCKET);
  const { error } = await bucket.remove([currentPath]);
  if (error) {
    throw new Error(error.message);
  }
}
