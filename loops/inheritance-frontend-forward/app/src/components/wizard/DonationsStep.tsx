import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export interface DonationsStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export function DonationsStep({
  control,
  setValue,
  watch,
  errors,
  persons,
}: DonationsStepProps) {
  return (
    <div data-testid="donations-step">
      <p>Donations Step (stub)</p>
    </div>
  );
}
