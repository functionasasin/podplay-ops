import { supabase, supabaseConfigured } from './supabase';

const appUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:5173';

export async function signInWithPassword(email: string, password: string) {
  if (!supabaseConfigured) throw new Error('Supabase not configured');
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithOtp(email: string) {
  if (!supabaseConfigured) throw new Error('Supabase not configured');
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });
}

export async function signUp(email: string, password: string) {
  if (!supabaseConfigured) throw new Error('Supabase not configured');
  return supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${appUrl}/auth/callback` },
  });
}

export async function signOut() {
  if (!supabaseConfigured) throw new Error('Supabase not configured');
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  if (!supabaseConfigured) throw new Error('Supabase not configured');
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/reset-confirm`,
  });
}
