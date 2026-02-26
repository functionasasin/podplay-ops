import React from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';

export const EXEMPTION_FLAGS = [
  'is_expressly_exempt',
  'is_support_education_medical',
  'is_customary_gift',
  'is_professional_expense',
  'is_joint_from_both_parents',
  'is_to_child_spouse_only',
  'is_joint_to_child_and_spouse',
  'is_wedding_gift',
  'is_debt_payment_for_child',
  'is_election_expense',
  'is_fine_payment',
] as const;

export interface DonationCardProps {
  index: number;
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  onRemove: (index: number) => void;
  persons: Person[];
  errors?: Record<string, { message?: string }>;
}

export function DonationCard({
  index,
  control,
  setValue,
  watch,
  onRemove,
  persons,
  errors,
}: DonationCardProps) {
  return (
    <div data-testid={`donation-card-${index}`}>
      <p>Donation Card (stub)</p>
    </div>
  );
}
