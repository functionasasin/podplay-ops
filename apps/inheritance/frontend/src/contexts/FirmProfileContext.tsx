import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { FirmProfile } from '@/lib/firm-profile';
import { defaultFirmProfile, loadFirmProfile, saveFirmProfile } from '@/lib/firm-profile';

export interface FirmProfileContextValue {
  profile: FirmProfile;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<FirmProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const FirmProfileContext = createContext<FirmProfileContextValue | null>(null);

export function useFirmProfile(): FirmProfileContextValue {
  const ctx = useContext(FirmProfileContext);
  if (!ctx) {
    throw new Error('useFirmProfile must be used within a FirmProfileProvider');
  }
  return ctx;
}

export function FirmProfileProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<FirmProfile>(defaultFirmProfile());
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadFirmProfile(userId);
      setProfile(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const updateProfile = async (updates: Partial<FirmProfile>) => {
    if (!userId) return;
    // Optimistic update
    setProfile((prev) => ({ ...prev, ...updates }));
    await saveFirmProfile(userId, updates);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const value: FirmProfileContextValue = {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };

  return (
    <FirmProfileContext.Provider value={value}>
      {children}
    </FirmProfileContext.Provider>
  );
}
