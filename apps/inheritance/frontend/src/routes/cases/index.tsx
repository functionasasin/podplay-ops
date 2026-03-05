import { createRoute, redirect, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { FolderOpen, FilePlus } from 'lucide-react';
import { rootRoute } from '@/routes/__root';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { CaseCard } from '@/components/dashboard/CaseCard';
import { listCases } from '@/lib/cases';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import type { CaseListItem } from '@/types';

export const casesIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cases',
  beforeLoad: ({ context }) => {
    const ctx = context as { auth?: { user: unknown } | undefined };
    if (!ctx.auth?.user) throw redirect({ to: '/auth', search: { mode: 'signin' as const, redirect: '/cases' } });
  },
  component: CasesListPage,
});

function CasesListPage() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { organization } = useOrganization(user?.id ?? null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!organization) return;
    listCases(organization.id).then(setCases).finally(() => setLoading(false));
  }, [organization?.id]);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-serif">Cases</h1>
        </div>
        <Link to="/cases/new">
          <Button className="gap-2"><FilePlus className="h-4 w-4" />New Case</Button>
        </Link>
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No cases yet"
          description="Create your first estate case to start computing inheritance distributions."
          action={{ label: 'Create First Case', onClick: () => navigate({ to: '/cases/new' }) }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {cases.map(c => (
            <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }}>
              <CaseCard caseItem={c} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
