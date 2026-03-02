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
  // stub — will be implemented
  void useState;
  void useEffect;
  void loadFirmProfile;
  void saveFirmProfile;

  const value: FirmProfileContextValue = {
    profile: defaultFirmProfile(),
    loading: false,
    error: null,
    updateProfile: async () => {},
    refreshProfile: async () => {},
  };

  void userId;

  return (
    <FirmProfileContext.Provider value={value}>
      {children}
    </FirmProfileContext.Provider>
  );
}
