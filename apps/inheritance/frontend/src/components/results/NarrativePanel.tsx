/**
 * NarrativePanel — expandable narrative items per heir.
 */
import React from 'react';
import { Copy } from 'lucide-react';
import type { HeirNarrative } from '../../types';
import { stripMarkdownBold } from './utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../ui/accordion';

export interface NarrativePanelProps {
  narratives: HeirNarrative[];
  decedentName: string;
  dateOfDeath: string;
}

function parseNarrativeToNodes(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function NarrativePanel({ narratives, decedentName, dateOfDeath }: NarrativePanelProps) {
  const handleCopyAll = async () => {
    const header = `Philippine Inheritance Distribution — ${decedentName} (${dateOfDeath})\n\n`;
    const body = narratives.map((n) => stripMarkdownBold(n.text)).join('\n\n');
    await navigator.clipboard.writeText(header + body);
  };

  const defaultOpen = narratives.length > 0 ? [narratives[0]!.heir_id] : [];

  return (
    <div data-testid="narrative-panel">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-base sm:text-lg font-semibold text-primary">Heir Narratives</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyAll}
          className="shrink-0"
        >
          <Copy className="size-3.5" />
          <span className="hidden sm:inline">Copy All Narratives</span>
          <span className="sm:hidden">Copy All</span>
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={defaultOpen} className="border rounded-lg">
        {narratives.map((narrative) => (
          <AccordionItem key={narrative.heir_id} value={narrative.heir_id} className="px-1">
            <AccordionTrigger className="px-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">{narrative.heir_name}</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {narrative.heir_category_label}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3">
              <div className="font-serif text-sm text-muted-foreground leading-relaxed">
                {parseNarrativeToNodes(narrative.text)}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
