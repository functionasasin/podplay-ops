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
    const { data, error } = await supabase.rpc('create_org_with_member', {
      org_name: name,
      org_slug: slug,
    });

    if (error || !data) return;

    navigate({ to: '/' });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-background"
      data-testid="onboarding-page"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display text-3xl tracking-tight text-foreground">
            <span className="text-primary">₱</span>TaxKlaro
          </span>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-[var(--shadow-lg)]">
          <OnboardingForm onCreateOrg={handleCreateOrg} />
        </div>
      </div>
    </div>
  );
}
