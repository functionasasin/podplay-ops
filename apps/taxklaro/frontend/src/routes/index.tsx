import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { GitCompare, ScrollText, Calculator } from 'lucide-react';
import { rootRoute } from './__root';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';

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

  useEffect(() => {
    if (user) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="index-page">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-6 text-center">
        <div className="font-display text-2xl tracking-tight text-foreground mb-8">
          <span className="text-primary">&#8369;</span>TaxKlaro
        </div>
        <h1
          className="font-display text-foreground max-w-xl mb-5"
          style={{ fontSize: 'var(--text-h1)', lineHeight: 'var(--text-h1-lh)' }}
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

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-6 text-center">
        <p
          className="text-muted-foreground"
          style={{ fontSize: 'var(--text-small)', lineHeight: 'var(--text-small-lh)' }}
        >
          &copy; {new Date().getFullYear()} TaxKlaro. Simplified tax computation for Filipino freelancers.
        </p>
      </footer>
    </div>
  );
}
