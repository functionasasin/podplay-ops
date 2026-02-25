import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput } from '../../types';

export interface DecedentStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors?: Record<string, { message?: string }>;
}

export function DecedentStep({
  control,
  setValue,
  watch,
  errors,
}: DecedentStepProps) {
  // Stub — implementation in next iteration
  return <div data-testid="decedent-step">Decedent Step Stub</div>;
}
