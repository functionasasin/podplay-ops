import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OnboardingFormProps {
  onCreateOrg: (name: string, slug: string) => Promise<void>;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function OnboardingForm({ onCreateOrg }: OnboardingFormProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    await onCreateOrg(name.trim(), slugify(name));
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Create your firm</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your organization to start managing computations.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-name">Firm Name</Label>
        <Input
          id="org-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Santos Tax Services"
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full">
        Create Firm
      </Button>
    </form>
  );
}

export default OnboardingForm;
