/**
 * WarningsPanel — manual flag cards (forward-compatible).
 * Hidden when warnings array is empty.
 */
import React from 'react';
import type { ManualFlag, InheritanceShare } from '../../types';

export interface WarningsPanelProps {
  warnings: ManualFlag[];
  /** For resolving related_heir_id to heir name */
  shares: InheritanceShare[];
}

export function WarningsPanel({ warnings, shares }: WarningsPanelProps) {
  // TODO: implement
  return <div data-testid="warnings-panel" />;
}
