/**
 * ActionsBar — Edit Input, Export JSON, Copy Narratives.
 */
import React from 'react';
import { Pencil, Download, Copy } from 'lucide-react';
import type { EngineInput, EngineOutput } from '../../types';
import { stripMarkdownBold } from './utils';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

export interface ActionsBarProps {
  input: EngineInput;
  output: EngineOutput;
  onEditInput: () => void;
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

export function ActionsBar({ input, output, onEditInput }: ActionsBarProps) {
  const handleExport = () => {
    const dateOfDeath = input.decedent.date_of_death;
    downloadJson(
      { input, output },
      `inheritance-${dateOfDeath}-both.json`,
    );
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
      <div className="flex gap-3">
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
      </div>
    </div>
  );
}
