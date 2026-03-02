import type { FirmProfile } from '@/lib/firm-profile';

export interface FirmProfileFormProps {
  profile: FirmProfile;
  onSave: (updates: Partial<FirmProfile>) => Promise<void>;
  saving?: boolean;
}

export function FirmProfileForm({ profile, onSave, saving }: FirmProfileFormProps) {
  // stub — will be implemented
  void profile;
  void onSave;
  void saving;
  return <div data-testid="firm-profile-form">Stub</div>;
}
