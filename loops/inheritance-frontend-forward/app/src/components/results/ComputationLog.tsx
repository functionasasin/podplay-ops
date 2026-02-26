/**
 * ComputationLog — collapsible advanced section showing pipeline steps.
 */
import React from 'react';
import type { ComputationLog as ComputationLogType } from '../../types';

export interface ComputationLogProps {
  log: ComputationLogType;
}

export function ComputationLog({ log }: ComputationLogProps) {
  // TODO: implement
  return <div data-testid="computation-log" />;
}
