import { createRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Scale, Loader2, FilePlus, CheckCircle2 } from 'lucide-react';
import { publicRootRoute } from '@/routes/__root';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createOrganization } from '@/lib/organizations';
import { saveFirmProfile } from '@/lib/firm-profile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const onboardingRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/onboarding',
  component: OnboardingPage,
});

type OnboardingStep = 'firm' | 'profile' | 'done';

function OnboardingPage() {
  const { user, loading } = useAuth();
  const { organization } = useOrganization(user?.id ?? null);
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('firm');
  const [submitting, setSubmitting] = useState(false);

  const [firmName, setFirmName] = useState('');
  const [firmPhone, setFirmPhone] = useState('');
  const [firmAddress, setFirmAddress] = useState('');
  const [counselName, setCounselName] = useState('');
  const [ibpRollNo, setIbpRollNo] = useState('');
  const [ptrNo, setPtrNo] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth', search: { mode: 'signin' as const, redirect: '' } });
    if (!loading && organization) navigate({ to: '/' }); // already onboarded
  }, [user, loading, organization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const STEPS: OnboardingStep[] = ['firm', 'profile', 'done'];
  const stepIndex = STEPS.indexOf(step);

  const handleFirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim()) return;
    setSubmitting(true);
    try {
      await createOrganization(firmName.trim());
      setStep('profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create organization';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (user) await saveFirmProfile(user.id, { counselName, ibpRollNo, ptrNo });
    } catch {
      // Non-fatal — profile can be updated later in Settings
    } finally {
      setSubmitting(false);
      setStep('done');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Scale className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold font-serif text-foreground">Inheritance Calculator</span>
        </div>
        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={cn(
              'h-2 w-2 rounded-full transition-colors duration-200',
              i <= stepIndex ? 'bg-primary' : 'bg-muted'
            )} />
          ))}
        </div>

        {step === 'firm' && (
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h1 className="text-xl font-bold font-serif">Set up your firm</h1>
              <p className="text-sm text-muted-foreground mt-1">This takes 30 seconds and unlocks all features.</p>
            </div>
            <form onSubmit={handleFirmSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="firm-name">Firm Name <span className="text-destructive">*</span></Label>
                <Input
                  id="firm-name"
                  required
                  placeholder="Reyes & Associates Law Offices"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="firm-phone">Phone <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="firm-phone" type="tel" placeholder="+63 2 1234 5678" value={firmPhone} onChange={(e) => setFirmPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="firm-address">Address <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Input id="firm-address" placeholder="123 Main St, Makati City" value={firmAddress} onChange={(e) => setFirmAddress(e.target.value)} />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={submitting || !firmName.trim()}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</> : 'Continue →'}
              </Button>
            </form>
          </div>
        )}

        {step === 'profile' && (
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
            <div>
              <h1 className="text-xl font-bold font-serif">Attorney profile</h1>
              <p className="text-sm text-muted-foreground mt-1">Used in PDF reports. You can update this later in Settings.</p>
            </div>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="counsel-name">Counsel Full Name</Label>
                <Input id="counsel-name" placeholder="Atty. Maria Santos" value={counselName} onChange={(e) => setCounselName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ibp-roll">IBP Roll No.</Label>
                <Input id="ibp-roll" placeholder="123456" value={ibpRollNo} onChange={(e) => setIbpRollNo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ptr-no">PTR No.</Label>
                <Input id="ptr-no" placeholder="7654321" value={ptrNo} onChange={(e) => setPtrNo(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : 'Continue →'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep('done')} disabled={submitting}>
                  Skip
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-card border rounded-xl p-8 shadow-sm text-center space-y-4">
            <div className="inline-flex items-center justify-center rounded-full bg-success/10 p-4 mb-2">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif">You're all set!</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Your firm profile is configured. Start computing inheritance distributions.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/cases/new">
                <Button className="w-full gap-2"><FilePlus className="h-4 w-4" />Create Your First Case</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
