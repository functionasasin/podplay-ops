import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FormType } from '@/types/common';
import type { FormOutputUnion } from '@/types/engine-output';

interface BirFormRecommendationProps {
  formType: FormType;
  formOutput: FormOutputUnion;
  requiredAttachments: string[];
}

const FORM_LABELS: Record<FormType, { name: string; description: string }> = {
  FORM_1701: {
    name: 'BIR Form 1701',
    description: 'Annual Income Tax Return — Individuals with mixed income (business + compensation)',
  },
  FORM_1701A: {
    name: 'BIR Form 1701A',
    description: 'Annual Income Tax Return — Individuals Earning Purely from Self-Employment / Practice of Profession',
  },
  FORM_1701Q: {
    name: 'BIR Form 1701Q',
    description: 'Quarterly Income Tax Return — for quarterly filers',
  },
};

export function BirFormRecommendation({
  formType,
  formOutput,
  requiredAttachments,
}: BirFormRecommendationProps) {
  const formInfo = FORM_LABELS[formType];
  const variant = formOutput.formVariant;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recommended BIR Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Badge className="mt-0.5 text-sm font-semibold" variant="secondary">
            {formInfo.name}
          </Badge>
          <p className="text-sm text-muted-foreground">{formInfo.description}</p>
        </div>

        <div className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1 inline-block">
          Variant: {variant}
        </div>

        {requiredAttachments.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Required attachments:</p>
            <ul className="space-y-0.5">
              {requiredAttachments.map((attachment, i) => (
                <li key={i} className="text-sm flex items-start gap-1.5">
                  <span className="text-muted-foreground mt-0.5">•</span>
                  <span>{attachment}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BirFormRecommendation;
