/**
 * ActionsBar — Edit Input, Export JSON, Copy Narratives, Share.
 */
import { useState } from 'react';
import { Pencil, Download, Copy, Share2, FileText, Loader2 } from 'lucide-react';
import type { EngineInput, EngineOutput } from '../../types';
import { stripMarkdownBold } from './utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ShareDialog } from '../case/ShareDialog';

export interface ActionsBarProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
  caseId?: string;
  shareToken?: string;
  shareEnabled?: boolean;
  onToggleShare?: (enabled: boolean) => Promise<void>;
}

function downloadJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ActionsBar({ input, output, onEditInput, caseId, shareToken, shareEnabled, onToggleShare }: ActionsBarProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExport = () => {
    const dateOfDeath = input.decedent.date_of_death;
    downloadJson(
      { input, output },
      `inheritance-${dateOfDeath}-both.json`,
    );
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const { downloadPDF } = await import('../../lib/pdf-export');
      await downloadPDF(input, output, null);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCopyNarratives = () => {
    const header = `Philippine Inheritance Distribution — ${input.decedent.name} (${input.decedent.date_of_death})\n\n`;
    const body = output.narratives
      .map((n) => stripMarkdownBold(n.text))
      .join('\n\n');
    navigator.clipboard.writeText(header + body);
  };

  return (
    <div data-testid="actions-bar">
      <Separator className="mb-4" />
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onEditInput}
        >
          <Pencil className="size-4" />
          Edit Input
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleExportPDF}
          disabled={pdfLoading}
        >
          {pdfLoading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
          Export PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleExport}
        >
          <Download className="size-4" />
          Export JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleCopyNarratives}
        >
          <Copy className="size-4" />
          Copy Narratives
        </Button>
        {caseId && shareToken !== undefined && (
          <Button type="button" variant="outline" onClick={() => setShareOpen(true)}>
            <Share2 className="size-4 mr-2" />Share
          </Button>
        )}
      </div>
      {caseId && shareToken !== undefined && onToggleShare && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          shareToken={shareToken ?? ''}
          shareEnabled={shareEnabled ?? false}
          onToggleShare={onToggleShare}
        />
      )}
    </div>
  );
}
