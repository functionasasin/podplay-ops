/**
 * ResultsHeader — scenario badge, succession type, estate total.
 */
import React from 'react';
import type { ScenarioCode, SuccessionType, Money } from '../../types';

export interface ResultsHeaderProps {
  scenarioCode: ScenarioCode;
  successionType: SuccessionType;
  netDistributableEstate: Money;
}

export function ResultsHeader({ scenarioCode, successionType, netDistributableEstate }: ResultsHeaderProps) {
  // TODO: implement
  return <div data-testid="results-header" />;
}
