import { TaxKlaroLogo } from '@/components/TaxKlaroLogo';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8">
      <TaxKlaroLogo size="lg" />
      <p className="text-muted-foreground max-w-md">
        BIR-compliant tax computations for Filipino freelancers and self-employed professionals.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate({ to: '/auth' })}>Sign in</Button>
        <Button variant="outline" onClick={() => navigate({ to: '/computations' })}>
          Get started
        </Button>
      </div>
    </div>
  );
}

export default LandingPage;
