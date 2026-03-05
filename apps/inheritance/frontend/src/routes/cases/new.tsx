import { createRoute, redirect, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { rootRoute } from '../__root';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { GuidedIntakeForm } from '@/components/intake/GuidedIntakeForm';

export const casesNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cases/new',
  beforeLoad: ({ context }) => {
    const ctx = context as { auth?: { user: unknown } | undefined };
    if (!ctx.auth?.user) throw redirect({ to: '/auth', search: { mode: 'signin' as const, redirect: '/cases/new' } });
  },
  component: CasesNewPage,
});

function CasesNewPage() {
  const { user } = useAuth();
  const { organization } = useOrganization(user?.id ?? null);
  const navigate = useNavigate();

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <GuidedIntakeForm
        orgId={organization.id}
        userId={user!.id}
        onComplete={(caseId) => navigate({ to: '/cases/$caseId', params: { caseId } })}
        onCancel={() => navigate({ to: '/' })}
      />
    </div>
  );
}
