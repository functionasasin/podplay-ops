import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Calculator, GitCompare, ScrollText } from 'lucide-react';
import { rootRoute } from './__root';
import { listComputations } from '../lib/computations';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { ComputationCard } from '../components/computation/ComputationCard';
import { ComputationCardSkeleton } from '../components/computation/ComputationCardSkeleton';
import type { ComputationListItem } from '../types/org';

export const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-[1.125rem] font-semibold leading-[1.4] text-foreground mb-2">{title}</h3>
      <p className="text-[0.875rem] text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function IndexPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [recent, setRecent] = useState<ComputationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    const data = await listComputations(orgId);
    setRecent(data.slice(0, 6));
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  // Not logged in — landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background" data-testid="index-page">
        {/* Hero */}
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="font-display text-2xl tracking-tight text-foreground mb-8">
            <span className="text-primary">₱</span>TaxKlaro
          </div>
          <h1
            className="font-display text-foreground max-w-xl mb-5 text-[2rem] sm:text-[3rem] leading-[1.1]"
          >
            Your taxes, finally clear.
          </h1>
          <p
            className="text-muted-foreground max-w-lg mb-8"
            style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--text-body-lh)' }}
          >
            Philippine income tax computation for freelancers, self-employed professionals, and
            mixed-income earners. Compare regimes, compute dues, and stay BIR-ready.
          </p>
          <Button
            size="lg"
            onClick={() => navigate({ to: '/auth' })}
            className="h-12 px-8 rounded-lg text-base font-medium"
          >
            Get Started — It's Free
          </Button>
        </div>

        {/* Features */}
        <div className="px-6 pb-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FeatureCard
              icon={<GitCompare className="h-5 w-5" />}
              title="Compare Tax Regimes"
              description="See side-by-side: 8% GIT vs Graduated, OSD vs itemized deductions. Pick the path that saves the most."
            />
            <FeatureCard
              icon={<ScrollText className="h-5 w-5" />}
              title="BIR-Ready Forms"
              description="Know exactly which BIR forms to file — 1701, 1701A, 2551Q — based on your income and registration type."
            />
            <FeatureCard
              icon={<Calculator className="h-5 w-5" />}
              title="Instant Computation"
              description="Fill in your income, deductions, and taxes withheld. Get a clear breakdown of your tax due or refund in seconds."
            />
          </div>
          <p
            className="text-center text-muted-foreground mt-12"
            style={{ fontSize: 'var(--text-small)', lineHeight: 'var(--text-small-lh)' }}
          >
            Built for Philippine freelancers and self-employed professionals.
          </p>
        </div>
      </div>
    );
  }

  // Authenticated dashboard
  return (
    <div className="space-y-6" data-testid="index-page">
      <div className="flex items-center justify-between">
        <h1
          className="font-display text-foreground"
          style={{ fontSize: 'var(--text-h1)', lineHeight: 'var(--text-h1-lh)' }}
        >
          Dashboard
        </h1>
        <Button onClick={() => navigate({ to: '/computations/new' })}>
          <Plus className="h-4 w-4 mr-2" /> New Computation
        </Button>
      </div>

      <section className="space-y-4">
        <h2
          className="font-semibold text-foreground"
          style={{ fontSize: 'var(--text-h3)', lineHeight: 'var(--text-h3-lh)' }}
        >
          Recent Computations
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ComputationCardSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 space-y-4 bg-white rounded-xl shadow-[var(--shadow-sm)]">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground" style={{ fontSize: 'var(--text-body)' }}>
              No computations yet. Create your first one to get started.
            </p>
            <Button variant="outline" onClick={() => navigate({ to: '/computations/new' })}>
              New Computation
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((c) => (
                <ComputationCard key={c.id} computation={c} />
              ))}
            </div>
            <Button variant="link" onClick={() => navigate({ to: '/computations' })}>
              View all computations
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
