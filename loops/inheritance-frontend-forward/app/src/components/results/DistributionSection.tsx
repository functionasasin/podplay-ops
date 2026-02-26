/**
 * DistributionSection — pie chart + heir table with 7 layout variants.
 */
import React from 'react';
import type { InheritanceShare, SuccessionType, ScenarioCode, Person } from '../../types';
import type { ResultsLayout } from './utils';

export interface DistributionSectionProps {
  shares: InheritanceShare[];
  totalCentavos: number;
  successionType: SuccessionType;
  scenarioCode: ScenarioCode;
  /** Original input persons for cross-referencing (e.g., blood_type) */
  persons?: Person[];
}

export function DistributionSection({
  shares,
  totalCentavos,
  successionType,
  scenarioCode,
  persons,
}: DistributionSectionProps) {
  // TODO: implement
  return <div data-testid="distribution-section" />;
}
