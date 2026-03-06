import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PesoInput } from '@/components/shared/PesoInput';
import { cn } from '@/lib/utils';
import type { WizardFormData } from '@/types/wizard';

export type BusinessCategory =
  | 'PROFESSIONAL_SERVICES'
  | 'REGULATED_PROFESSIONAL'
  | 'TRADER'
  | 'MIXED_BUSINESS'
  | 'NOT_SURE';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORY_OPTIONS: { value: BusinessCategory; title: string; description: string }[] = [
  {
    value: 'PROFESSIONAL_SERVICES',
    title: 'Professional or freelance services',
    description:
      'IT, software, design, writing, marketing, consulting, tutoring, photography, video production, virtual assistant, or any work where you exchange time and skill for payment. No physical goods sold.',
  },
  {
    value: 'REGULATED_PROFESSIONAL',
    title: 'Licensed / government-regulated profession',
    description:
      'Lawyer, doctor, dentist, nurse, CPA, engineer, architect, pharmacist, or other profession regulated by PRC or the Supreme Court. May practice solo or through a partnership.',
  },
  {
    value: 'TRADER',
    title: 'Product-based business (I sell goods)',
    description:
      'Retail, wholesale, buy-and-sell, manufacturing, or any business where you primarily sell physical products or merchandise. You have cost of goods sold.',
  },
  {
    value: 'MIXED_BUSINESS',
    title: 'Both products and services',
    description:
      'Your business sells both goods and services — e.g., a repair shop, a restaurant, a product + installation business.',
  },
  {
    value: 'NOT_SURE',
    title: "I'm not sure how to categorize my work",
    description: 'See the helper guide below to determine which category fits your work.',
  },
];

export function WS02BusinessType({ data, onChange, onNext, onBack }: Props) {
  const [category, setCategory] = useState<BusinessCategory | null>(null);
  const [isGppPartner, setIsGppPartner] = useState<boolean>(data.isGppPartner ?? false);
  const [cogs, setCogs] = useState<string>(data.costOfGoodsSold ?? '0.00');
  const [error, setError] = useState<string | null>(null);

  const showCogs = category === 'TRADER' || category === 'MIXED_BUSINESS';
  const showGpp = category === 'REGULATED_PROFESSIONAL';
  const showHelper = category === 'NOT_SURE';

  function handleSelect(value: BusinessCategory) {
    setCategory(value);
    setError(null);
  }

  function handleNext() {
    if (!category || category === 'NOT_SURE') {
      setError('Please select a business category before continuing.');
      return;
    }
    onChange({
      isGppPartner: showGpp ? isGppPartner : false,
      costOfGoodsSold: showCogs ? cogs : '0.00',
    });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-normal">
          What type of business or profession do you have?
        </h2>
      </div>

      <RadioGroup
        value={category ?? ''}
        onValueChange={(v) => handleSelect(v as BusinessCategory)}
        className="gap-3"
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <div key={opt.value}>
            <RadioGroupItem value={opt.value} id={`biz-${opt.value}`} className="sr-only" />
            <Label htmlFor={`biz-${opt.value}`} className="cursor-pointer block">
              <Card
                className={cn(
                  'transition-all duration-200 shadow-sm',
                  category === opt.value
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                    : 'hover:border-primary/40 hover:shadow-md'
                )}
              >
                <CardContent className="p-5">
                  <div className="font-medium">{opt.title}</div>
                  <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{opt.description}</div>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {showHelper && (
        <Alert>
          <AlertDescription>
            <strong>Service vs. Trader vs. Mixed:</strong> If you primarily sell your time and
            expertise (consulting, design, writing), you&apos;re a service provider. If you buy
            goods and resell them (retail, wholesale, manufacturing), you&apos;re a trader. If you
            do both, select Mixed. Licensed professionals (doctors, lawyers, CPAs) have their own
            category due to 8% flat rate rules.
          </AlertDescription>
        </Alert>
      )}

      {showGpp && (
        <div className="space-y-2 p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              id="gpp-partner"
              checked={isGppPartner}
              onCheckedChange={(checked) => setIsGppPartner(checked)}
            />
            <Label htmlFor="gpp-partner" className="cursor-pointer">
              Do you practice through a General Professional Partnership (GPP)?
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            A GPP is a partnership formed by licensed professionals (e.g., a law firm, accounting
            firm, or medical group) that is itself tax-exempt at the entity level. Most solo
            practitioners select No.
          </p>
          {isGppPartner && (
            <Alert className="mt-2 border-amber-400 bg-amber-50 text-amber-900">
              <AlertDescription>
                GPP partners are subject to special rules. The 8% flat rate option is NOT available
                to GPP distributive share income. Computation will proceed under Graduated +
                Itemized or Graduated + OSD.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {showCogs && (
        <div className="space-y-2">
          <Label htmlFor="cogs">Cost of goods sold (COGS)</Label>
          <PesoInput id="cogs" value={cogs} onChange={setCogs} placeholder="0.00" />
          <p className="text-xs text-muted-foreground">
            Enter the total cost of goods you purchased or manufactured for sale. Do NOT include
            salaries, rent, or overhead — those go in the expenses section.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="h-11 px-5">
          Back
        </Button>
        <Button onClick={handleNext} className="h-11 px-6">Continue</Button>
      </div>
    </div>
  );
}

export default WS02BusinessType;
