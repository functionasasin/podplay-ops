import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Save } from 'lucide-react';

interface FirmBrandingSectionProps {
  firmName: string;
  logoUrl?: string | null;
  onSave: (data: { firmName: string }) => Promise<void>;
  onUploadLogo: (file: File) => Promise<void>;
}

export function FirmBrandingSection({ firmName, logoUrl, onSave, onUploadLogo }: FirmBrandingSectionProps) {
  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await onUploadLogo(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await onSave({ firmName: fd.get('firmName') as string });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Firm Branding</h2>
      <div className="space-y-2">
        <Label htmlFor="firmName">Firm Name</Label>
        <Input id="firmName" name="firmName" defaultValue={firmName} />
      </div>
      <div className="space-y-2">
        <Label>Logo</Label>
        {logoUrl && <img src={logoUrl} alt="Firm logo" className="h-12 object-contain" />}
        <label className="cursor-pointer">
          <Button type="button" variant="outline" size="sm" asChild>
            <span><Upload className="h-4 w-4 mr-2" />Upload Logo</span>
          </Button>
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        </label>
      </div>
      <Button type="submit" size="sm">
        <Save className="h-4 w-4 mr-2" />Save Changes
      </Button>
    </form>
  );
}

export default FirmBrandingSection;
