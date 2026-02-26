/**
 * NarrativePanel — expandable narrative items per heir.
 */
import React from 'react';
import type { HeirNarrative } from '../../types';

export interface NarrativePanelProps {
  narratives: HeirNarrative[];
  decedentName: string;
  dateOfDeath: string;
}

export function NarrativePanel({ narratives, decedentName, dateOfDeath }: NarrativePanelProps) {
  // TODO: implement
  return <div data-testid="narrative-panel" />;
}
