import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { rootRoute } from './__root';
import { LayoutDashboard, LogIn, UserPlus, FilePlus, FolderOpen, Calculator, Users, FileText, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { CaseCard } from '@/components/dashboard/CaseCard';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { listCases } from '@/lib/cases';
import type { CaseListItem } from '@/types';
import type { User } from '@supabase/supabase-js';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 sm:py-20 px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-[#c5a44e] text-xs font-medium px-3 py-1 rounded-full border border-accent/20 mb-4">
            Philippine Succession Law
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif text-foreground mb-3">
            Estate Distribution<br />Made Simple
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto mb-6">
            Compute Philippine inheritance shares instantly. Handles testate, intestate, mixed succession, preterition, and representation.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/auth" search={{ mode: 'signup' as const, redirect: '' }}>
              <Button className="gap-2"><UserPlus className="h-4 w-4" />Create Account</Button>
            </Link>
            <Link to="/auth" search={{ mode: 'signin' as const, redirect: '' }}>
              <Button variant="outline" className="gap-2"><LogIn className="h-4 w-4" />Sign In</Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Or <Link to="/cases/new" className="text-primary hover:underline">try without an account</Link> — results won&apos;t be saved
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          {[
            { icon: Calculator, title: 'All Succession Types', desc: 'Testate, intestate, mixed, preterition' },
            { icon: Users, title: 'Full Family Tree', desc: 'Representation, illegitimate heirs, collateral' },
            { icon: FileText, title: 'Professional PDF', desc: 'Firm-branded reports for client delivery' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-xl border bg-card">
              <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div><p className="font-medium">{title}</p><p className="text-muted-foreground text-xs mt-0.5">{desc}</p></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <AuthenticatedDashboard user={user} />;
}

function AuthenticatedDashboard({ user }: { user: User }) {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const { organization } = useOrganization(user.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!organization) return;
    listCases(organization.id)
      .then(setCases)
      .finally(() => setCasesLoading(false));
  }, [organization?.id]);

  if (!organization) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <EmptyState
          icon={Building2}
          title="Set up your firm first"
          description="Create your organization to unlock clients, deadlines, and team features."
          action={{ label: 'Set Up Firm Profile', onClick: () => navigate({ to: '/settings' }) }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-serif">Dashboard</h1>
        </div>
        <Link to="/cases/new">
          <Button className="gap-2"><FilePlus className="h-4 w-4" />New Case</Button>
        </Link>
      </div>

      {/* Recent cases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Cases</h2>
          <Link to="/cases" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {casesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
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
    </div>
  );
}
