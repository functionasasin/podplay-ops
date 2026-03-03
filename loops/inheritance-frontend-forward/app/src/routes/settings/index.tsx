import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { Settings, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FirmProfileProvider, useFirmProfile } from '@/contexts/FirmProfileContext';
import { FirmProfileForm } from '@/components/settings/FirmProfileForm';
import { LogoUpload } from '@/components/settings/LogoUpload';
import { ColorPickers } from '@/components/settings/ColorPickers';
import { uploadLogo, deleteLogo } from '@/lib/firm-profile';
import { useState } from 'react';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-serif">
            Settings
          </h1>
        </div>
        <p className="text-muted-foreground">
          Sign in to manage your firm settings.
        </p>
      </div>
    );
  }

  return (
    <FirmProfileProvider userId={user.id}>
      <SettingsContent />
    </FirmProfileProvider>
  );
}

function SettingsContent() {
  const { profile, loading, updateProfile } = useFirmProfile();
  const [saving, setSaving] = useState(false);

  const handleSave = async (updates: Parameters<typeof updateProfile>[0]) => {
    setSaving(true);
    try {
      await updateProfile(updates);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    const { user } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser()).then(r => r.data);
    if (!user) return;
    await uploadLogo(user.id, file);
    const { useFirmProfile: _ } = await import('@/contexts/FirmProfileContext');
    // Refresh profile to get new logo URL
    window.location.reload();
  };

  const handleLogoRemove = async () => {
    const { user } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser()).then(r => r.data);
    if (!user || !profile.logoUrl) return;
    await deleteLogo(user.id, profile.logoUrl);
    await updateProfile({ logoUrl: null });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Settings
        </h1>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4">Firm Profile</h2>
          <FirmProfileForm profile={profile} onSave={handleSave} saving={saving} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Firm Logo</h2>
          <LogoUpload
            currentLogoUrl={profile.logoUrl}
            onUpload={handleLogoUpload}
            onRemove={handleLogoRemove}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Brand Colors</h2>
          <ColorPickers
            letterheadColor={profile.letterheadColor}
            secondaryColor={profile.secondaryColor}
            onLetterheadChange={(color) => updateProfile({ letterheadColor: color })}
            onSecondaryChange={(color) => updateProfile({ secondaryColor: color })}
          />
        </section>
      </div>
    </div>
  );
}
