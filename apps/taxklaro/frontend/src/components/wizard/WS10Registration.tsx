import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export type VatStatus = 'YES' | 'NO';
export type BirRegistrationStatus = 'YES' | 'PLANNING';

function parseGross(v: string | undefined): number {
  return parseFloat((v ?? '0').replace(/,/g, '')) || 0;
}

export function WS10Registration({ data, onChange, onNext, onBack }: Props) {
  const [birRegistered, setBirRegistered] = useState<BirRegistrationStatus>(
    'YES'
  );
  const [vatStatus, setVatStatus] = useState<VatStatus>(
    data.isVatRegistered ? 'YES' : 'NO'
  );
  const [bmbe, setBmbe] = useState<boolean>(data.isBmbeRegistered ?? false);
  const [sec117128, setSec117128] = useState<boolean>(
    data.subjectToSec117128 ?? false
  );
  const [error, setError] = useState<string | null>(null);

  const grossReceipts = parseGross(data.grossReceipts);

  function handleNext() {
    setError(null);
    onChange({
      isVatRegistered: vatStatus === 'YES',
      isBmbeRegistered: bmbe,
      subjectToSec117128: sec117128,
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">Your BIR registration details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about your tax registration status so we can compute the correct taxes.
        </p>
      </div>

      {/* is_bir_registered — UI-only */}
      <div className="space-y-2">
        <Label>Are you registered with BIR?</Label>
        <RadioGroup
          value={birRegistered}
          onValueChange={(v) => setBirRegistered(v as BirRegistrationStatus)}
          className="space-y-2"
        >
          <div className="flex items-start gap-2">
            <RadioGroupItem value="YES" id="bir-yes" className="mt-0.5" />
            <Label htmlFor="bir-yes" className="font-normal cursor-pointer">
              Yes — I have a TIN and Certificate of Registration (Form 2303)
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem value="PLANNING" id="bir-planning" className="mt-0.5" />
            <Label htmlFor="bir-planning" className="font-normal cursor-pointer">
              Not yet — I'm planning to register
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          BIR registration means you have a TIN and a Certificate of Registration (COR).
        </p>
        {birRegistered === 'PLANNING' && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertDescription className="text-amber-800 text-sm">
              BIR registration is required if your annual income from business or profession exceeds
              ₱250,000. This tool can still estimate your taxes. Note that you may be subject to
              penalties for late registration.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* is_vat_registered */}
      <div className="space-y-2">
        <Label>Are you VAT-registered?</Label>
        <RadioGroup
          value={vatStatus}
          onValueChange={(v) => setVatStatus(v as VatStatus)}
          className="space-y-2"
        >
          <div className="flex items-start gap-2">
            <RadioGroupItem value="NO" id="vat-no" className="mt-0.5" />
            <Label htmlFor="vat-no" className="font-normal cursor-pointer">
              No — I am not VAT-registered (Non-VAT)
            </Label>
          </div>
          <div className="flex items-start gap-2">
            <RadioGroupItem value="YES" id="vat-yes" className="mt-0.5" />
            <Label htmlFor="vat-yes" className="font-normal cursor-pointer">
              Yes — I am VAT-registered
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground">
          VAT registration is mandatory if your annual gross sales exceed ₱3,000,000. The 8% flat
          rate option is NOT available to VAT-registered taxpayers.
        </p>
        {vatStatus === 'YES' && (
          <Alert className="border-orange-300 bg-orange-50">
            <AlertDescription className="text-orange-800 text-sm">
              VAT-registered taxpayers cannot use the 8% flat rate option. The optimizer will
              compare only Graduated + OSD (Path B) vs Graduated + Itemized Deductions (Path A).
            </AlertDescription>
          </Alert>
        )}
        {vatStatus === 'NO' && grossReceipts > 3_000_000 && (
          <Alert className="border-orange-300 bg-orange-50">
            <AlertDescription className="text-orange-800 text-sm">
              Your gross receipts of ₱{grossReceipts.toLocaleString()} exceed ₱3,000,000. You may
              be required to register for VAT. Operating above the VAT threshold without VAT
              registration may result in BIR penalties.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Special registrations */}
      <div className="border rounded-lg p-4 space-y-4">
        <p className="text-sm font-medium">Special registrations</p>

        <div className="flex items-start gap-3">
          <Switch
            id="bmbe"
            checked={bmbe}
            onCheckedChange={setBmbe}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="bmbe" className="font-normal cursor-pointer">
              Are you registered as a Barangay Micro Business Enterprise (BMBE)?
            </Label>
            <p className="text-xs text-muted-foreground">
              BMBE registration (under RA 9178) exempts micro businesses with total assets of
              ₱3,000,000 or less from income tax.
            </p>
            {bmbe && (
              <Alert className="border-green-300 bg-green-50">
                <AlertDescription className="text-green-800 text-sm">
                  BMBE-registered businesses are exempt from income tax under RA 9178. The engine
                  will return ₱0 income tax for all paths. You still have percentage tax
                  obligations (3%) if non-VAT registered.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Switch
            id="sec117128"
            checked={sec117128}
            onCheckedChange={setSec117128}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="sec117128" className="font-normal cursor-pointer">
              Is your business subject to special percentage taxes (e.g., telecom, transport,
              electricity, gas, water, franchise)?
            </Label>
            <p className="text-xs text-muted-foreground">
              Certain industries pay industry-specific percentage taxes under NIRC Sections 117–128
              instead of the general 3% percentage tax under Section 116. Most freelancers and
              professionals select 'No'.
            </p>
            {sec117128 && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertDescription className="text-amber-800 text-sm">
                  Industry-specific percentage taxes (Sec. 117–128) disqualify you from the 8%
                  flat rate option. The engine will compute Paths A and B only.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">Back</Button>
        <Button onClick={handleNext} className="h-11 px-6">Continue</Button>
      </div>
    </div>
  );
}

export default WS10Registration;
