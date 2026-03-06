import { createRoute, useNavigate } from '@tanstack/react-router';
import { publicRootRoute } from './__root';
import { authGuard } from '../lib/auth-guard';
import { supabase } from '../lib/supabase';
import { OnboardingForm } from '../components/onboarding/OnboardingForm';

export const OnboardingRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/onboarding',
  beforeLoad: authGuard,
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();

  async function handleCreateOrg(name: string, slug: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name, slug })
      .select('id')
      .single();

    if (orgError || !org) return;

    await supabase
      .from('organization_members')
      .insert({ org_id: org.id, user_id: user.id, role: 'admin' });

    navigate({ to: '/' });
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]" data-testid="onboarding-page">
      <OnboardingForm onCreateOrg={handleCreateOrg} />
    </div>
  );
}
