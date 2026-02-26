import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface ReviewStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  hasWill: boolean;
  persons: Person[];
  onSubmit?: () => void;
}

export function ReviewStep({
  control,
  setValue,
  watch,
  errors,
  hasWill,
  persons,
  onSubmit,
}: ReviewStepProps) {
  return (
    <div data-testid="review-step">
      <p>Review Step (stub)</p>
    </div>
  );
}
