import React from 'react';
import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput } from '../../types';

export interface EstateStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  hasWill: boolean;
  onHasWillChange: (hasWill: boolean) => void;
  errors?: Record<string, { message?: string }>;
}

export function EstateStep({
  control,
  setValue,
  watch,
  hasWill,
  onHasWillChange,
  errors,
}: EstateStepProps) {
  // Stub — implementation in next iteration
  return <div data-testid="estate-step">Estate Step Stub</div>;
}
