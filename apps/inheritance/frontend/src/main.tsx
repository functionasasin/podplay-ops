import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import '@fontsource-variable/inter';
import '@fontsource-variable/lora';
import './index.css';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { router } from './router';
import { SetupPage } from '@/components/SetupPage';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

function RouterWithAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      setUser(result.data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} context={{ auth: { user } }} />
      <Toaster position="bottom-right" />
    </>
  );
}

if (!supabaseConfigured) {
  ReactDOM.createRoot(document.getElementById('root')!).render(<SetupPage />);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><RouterWithAuth /></React.StrictMode>
  );
}
