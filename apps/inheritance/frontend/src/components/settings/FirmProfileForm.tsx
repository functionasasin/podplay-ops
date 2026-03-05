import { useState } from 'react';
import type { FirmProfile } from '@/lib/firm-profile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface FirmProfileFormProps {
  profile: FirmProfile;
  onSave: (updates: Partial<FirmProfile>) => Promise<void>;
  saving?: boolean;
}

export function FirmProfileForm({ profile, onSave, saving }: FirmProfileFormProps) {
  const [form, setForm] = useState<FirmProfile>({ ...profile });
  const isDirty = JSON.stringify(form) !== JSON.stringify(profile ?? {});

  const handleChange = (field: keyof FirmProfile, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form data-testid="firm-profile-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firmName">Firm Name</Label>
          <Input
            id="firmName"
            value={form.firmName ?? ''}
            onChange={(e) => handleChange('firmName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firmAddress">Firm Address</Label>
          <Input
            id="firmAddress"
            value={form.firmAddress ?? ''}
            onChange={(e) => handleChange('firmAddress', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firmPhone">Firm Phone</Label>
          <Input
            id="firmPhone"
            value={form.firmPhone ?? ''}
            onChange={(e) => handleChange('firmPhone', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firmEmail">Firm Email</Label>
          <Input
            id="firmEmail"
            type="email"
            value={form.firmEmail ?? ''}
            onChange={(e) => handleChange('firmEmail', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="counselName">Counsel Name</Label>
          <Input
            id="counselName"
            value={form.counselName ?? ''}
            onChange={(e) => handleChange('counselName', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="counselEmail">Counsel Email</Label>
          <Input
            id="counselEmail"
            type="email"
            value={form.counselEmail ?? ''}
            onChange={(e) => handleChange('counselEmail', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="counselPhone">Counsel Phone</Label>
          <Input
            id="counselPhone"
            value={form.counselPhone ?? ''}
            onChange={(e) => handleChange('counselPhone', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ibpRollNo">IBP Roll No.</Label>
          <Input
            id="ibpRollNo"
            value={form.ibpRollNo ?? ''}
            onChange={(e) => handleChange('ibpRollNo', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ptrNo">PTR No.</Label>
          <Input
            id="ptrNo"
            value={form.ptrNo ?? ''}
            onChange={(e) => handleChange('ptrNo', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mcleComplianceNo">MCLE Compliance No.</Label>
          <Input
            id="mcleComplianceNo"
            value={form.mcleComplianceNo ?? ''}
            onChange={(e) => handleChange('mcleComplianceNo', e.target.value)}
          />
        </div>
      </div>

      {isDirty && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          You have unsaved changes
        </p>
      )}
      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
