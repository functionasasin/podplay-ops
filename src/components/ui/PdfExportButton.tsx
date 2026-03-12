import { type RefObject } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PdfExportButtonProps {
  targetRef?: RefObject<HTMLElement>;
  label?: string;
  className?: string;
}

export function PdfExportButton({
  label = 'Export PDF',
  className,
}: PdfExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className={cn('gap-1.5', className)}
    >
      <Printer className="size-3.5" />
      {label}
    </Button>
  );
}
