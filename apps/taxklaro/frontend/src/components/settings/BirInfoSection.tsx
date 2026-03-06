import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

interface BirInfoSectionProps {
  tin?: string | null;
  rdoCode?: string | null;
  onSave: (data: { tin: string; rdoCode: string }) => Promise<void>;
}

export function BirInfoSection({ tin, rdoCode, onSave }: BirInfoSectionProps) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await onSave({ tin: fd.get('tin') as string, rdoCode: fd.get('rdoCode') as string });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">BIR Information</h2>
      <div className="space-y-2">
        <Label htmlFor="tin">TIN</Label>
        <Input id="tin" name="tin" defaultValue={tin ?? ''} placeholder="000-000-000-000" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rdoCode">RDO Code</Label>
        <Input id="rdoCode" name="rdoCode" defaultValue={rdoCode ?? ''} placeholder="e.g. 051" />
      </div>
      <Button type="submit" size="sm">
        <Save className="h-4 w-4 mr-2" />Save Changes
      </Button>
    </form>
  );
}

export default BirInfoSection;
