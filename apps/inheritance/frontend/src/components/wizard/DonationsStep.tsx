import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useFieldArray } from 'react-hook-form';
import { Plus } from 'lucide-react';
import type { EngineInput, Person, Donation } from '../../types';
import { DonationCard } from './DonationCard';
import { Button } from '@/components/ui/button';

export interface DonationsStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

function createEmptyDonation(index: number): Donation {
  return {
    id: `don${index}`,
    recipient_heir_id: null,
    recipient_is_stranger: false,
    value_at_time_of_donation: { centavos: 0 },
    date: '',
    description: '',
    is_expressly_exempt: false,
    is_support_education_medical: false,
    is_customary_gift: false,
    is_professional_expense: false,
    professional_expense_parent_required: false,
    professional_expense_imputed_savings: null,
    is_joint_from_both_parents: false,
    is_to_child_spouse_only: false,
    is_joint_to_child_and_spouse: false,
    is_wedding_gift: false,
    is_debt_payment_for_child: false,
    is_election_expense: false,
    is_fine_payment: false,
  };
}

export function DonationsStep({
  control,
  setValue,
  watch,
  errors,
  persons,
}: DonationsStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'donations',
  });

  const handleAdd = () => {
    // Find next available ID number
    const donations = watch('donations') || [];
    let nextNum = donations.length + 1;
    const existingIds = new Set(donations.map((d: Donation) => d.id));
    while (existingIds.has(`don${nextNum}`)) {
      nextNum++;
    }
    append(createEmptyDonation(nextNum));
  };

  return (
    <div data-testid="donations-step" className="space-y-4">
      <h2 className="text-lg font-semibold text-[hsl(var(--primary))]">Donations</h2>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No donations added
        </p>
      )}

      {fields.map((field, index) => (
        <DonationCard
          key={field.id}
          index={index}
          control={control}
          setValue={setValue}
          watch={watch}
          onRemove={remove}
          persons={persons}
          errors={errors}
        />
      ))}

      <Button type="button" onClick={handleAdd}>
        <Plus className="h-4 w-4" />
        Add Donation
      </Button>
    </div>
  );
}
