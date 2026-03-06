import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { useAuth } from '../../hooks/useAuth';
import { useOrganization } from '../../hooks/useOrganization';
import { PersonalInfoSection } from '../../components/settings/PersonalInfoSection';
import { BirInfoSection } from '../../components/settings/BirInfoSection';
import { FirmBrandingSection } from '../../components/settings/FirmBrandingSection';
import { DangerZoneSection } from '../../components/settings/DangerZoneSection';
import { supabase } from '../../lib/supabase';

export const SettingsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: authGuard,
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { org, role, canDelete, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <div data-testid="settings-page" className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  async function handleSavePersonalInfo(data: { fullName: string }) {
    if (!user) return;
    await supabase.auth.updateUser({ data: { full_name: data.fullName } });
  }

  async function handleSaveBirInfo(data: { tin: string; rdoCode: string }) {
    if (!user || !org) return;
    await supabase
      .from('organizations')
      .update({ tin: data.tin, rdo_code: data.rdoCode })
      .eq('id', org.id);
  }

  async function handleSaveFirmBranding(data: { firmName: string }) {
    if (!org) return;
    await supabase
      .from('organizations')
      .update({ name: data.firmName })
      .eq('id', org.id);
  }

  async function handleUploadLogo(file: File) {
    if (!org) return;
    const path = `logos/${org.id}/${file.name}`;
    await supabase.storage.from('branding').upload(path, file, { upsert: true });
  }

  async function handleDeleteOrg() {
    if (!org) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${org.name}"? This action is irreversible.`
    );
    if (!confirmed) return;
    await supabase.from('organizations').delete().eq('id', org.id);
  }

  return (
    <div data-testid="settings-page" className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <PersonalInfoSection
        fullName={user?.user_metadata?.full_name ?? ''}
        email={user?.email ?? ''}
        onSave={handleSavePersonalInfo}
      />

      <BirInfoSection
        tin={org?.slug ?? null}
        rdoCode={null}
        onSave={handleSaveBirInfo}
      />

      <FirmBrandingSection
        firmName={org?.name ?? ''}
        logoUrl={null}
        onSave={handleSaveFirmBranding}
        onUploadLogo={handleUploadLogo}
      />

      {canDelete && role === 'admin' && org && (
        <DangerZoneSection
          orgName={org.name}
          onDeleteOrg={handleDeleteOrg}
        />
      )}
    </div>
  );
}
