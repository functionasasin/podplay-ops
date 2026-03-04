import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import * as authLib from '@/lib/auth';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data } = authLib.onAuthStateChange((u) => {
      setUser(u as User | null);
      setLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await authLib.signIn(email, password);
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    await authLib.signUp(email, password, fullName);
  };

  const signOut = async () => {
    await authLib.signOut();
    setUser(null);
  };

  return { user, loading, signIn, signUp, signOut };
}
