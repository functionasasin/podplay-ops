import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthCallbackProps {
  code: string | undefined;
  redirectTo?: string;
}

export function AuthCallback({ code, redirectTo }: AuthCallbackProps) {
  useEffect(() => {
    async function exchange() {
      if (!code) {
        window.location.href = '/login?error=missing_code';
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        window.location.href = '/login?error=exchange_failed';
        return;
      }

      window.location.href = redirectTo ?? '/projects';
    }

    exchange();
  }, [code, redirectTo]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
