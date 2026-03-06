import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface PersonalInfoSectionProps {
  fullName: string;
  email: string;
  onSave: (data: { fullName: string }) => Promise<void>;
}

export function PersonalInfoSection({ fullName, email, onSave }: PersonalInfoSectionProps) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await onSave({ fullName: fd.get('fullName') as string });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Personal Information</h2>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <Button type="submit" size="sm">
        <Save className="h-4 w-4 mr-2" />Save Changes
      </Button>
    </form>
  );
}

export default PersonalInfoSection;
