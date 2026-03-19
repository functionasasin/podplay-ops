import { Network } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { computePortTemplate } from '@/lib/port-template';
import { downloadPortTemplatePdf } from '@/lib/port-template-pdf';
import type { ServiceTier } from '@/lib/types';

interface ExportPortTemplateButtonProps {
  tier: ServiceTier;
  courts: number;
  cams: number;
  doors: number;
}

export function ExportPortTemplateButton({ tier, courts, cams, doors }: ExportPortTemplateButtonProps) {
  function handleClick() {
    try {
      const data = computePortTemplate({ tier, courts, cams, doors });
      downloadPortTemplatePdf(data);
    } catch (err) {
      toast.error('Failed to generate port template: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={courts === 0}
      title={courts === 0 ? 'Court count required to generate port template' : undefined}
      className="gap-1.5"
    >
      <Network className="size-3.5" />
      Export Port Template
    </Button>
  );
}
