import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Info, Trash2 } from 'lucide-react';
import type { EngineInput, Person, Donation } from '../../types';
import { MoneyInput } from '../shared/MoneyInput';
import { DateInput } from '../shared/DateInput';
import { PersonPicker } from '../shared/PersonPicker';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardAction, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

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

const EXEMPTION_LABELS: Record<(typeof EXEMPTION_FLAGS)[number], string> = {
  is_expressly_exempt: 'Expressly Exempt (donor declared)',
  is_support_education_medical: 'Support, Education, or Medical',
  is_customary_gift: 'Customary Gift',
  is_professional_expense: 'Professional/Business Expense',
  is_joint_from_both_parents: 'Joint Gift from Both Parents',
  is_to_child_spouse_only: 'Gift to Child\'s Spouse Only',
  is_joint_to_child_and_spouse: 'Joint Gift to Child and Spouse',
  is_wedding_gift: 'Wedding Gift',
  is_debt_payment_for_child: 'Debt Payment for Child',
  is_election_expense: 'Election Expense',
  is_fine_payment: 'Fine Payment',
};

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
}: DonationCardProps) {
  // Single watch call for the entire donation to minimize subscriptions
  const donations = watch('donations') || [];
  const donation = donations[index] as Donation | undefined;

  const isStranger = donation?.recipient_is_stranger ?? false;
  const isProfessionalExpense = donation?.is_professional_expense ?? false;
  const parentRequired = donation?.professional_expense_parent_required ?? false;

  const updateDonation = (updates: Partial<Donation>) => {
    if (!donation) return;
    const updated = { ...donation, ...updates };
    setValue(`donations.${index}` as `donations.0`, updated);
  };

  const handleStrangerToggle = () => {
    const newVal = !isStranger;
    const updates: Partial<Donation> = { recipient_is_stranger: newVal };

    if (newVal) {
      updates.recipient_heir_id = null;
      for (const flag of EXEMPTION_FLAGS) {
        (updates as unknown as Record<string, unknown>)[flag] = false;
      }
      updates.professional_expense_parent_required = false;
      updates.professional_expense_imputed_savings = null;
    }

    updateDonation(updates);
  };

  const handleExemptionClick = (clickedFlag: (typeof EXEMPTION_FLAGS)[number]) => {
    const wasActive = donation ? (donation as unknown as Record<string, unknown>)[clickedFlag] : false;
    const updates: Partial<Donation> = {};

    for (const flag of EXEMPTION_FLAGS) {
      (updates as unknown as Record<string, unknown>)[flag] = false;
    }

    if (!wasActive) {
      (updates as unknown as Record<string, unknown>)[clickedFlag] = true;
    }

    updateDonation(updates);
  };

  const personOptions = persons.map((p) => ({
    id: p.id,
    name: p.name,
    relationship: p.relationship_to_decedent,
  }));

  return (
    <Card data-testid={`donation-card-${index}`}>
      <CardHeader>
        <div className="font-semibold">Donation #{index + 1}</div>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stranger toggle */}
        <div className="flex items-center gap-2">
          <Checkbox
            id={`donation-stranger-${index}`}
            checked={isStranger}
            onCheckedChange={() => handleStrangerToggle()}
          />
          <label htmlFor={`donation-stranger-${index}`} className="text-sm font-medium cursor-pointer">Recipient is Not in Family Tree</label>
        </div>

        {/* Stranger info banner */}
        {isStranger && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Stranger donations are always collatable (Art. 909 ¶2). Exemption flags do not apply to donations to non-heirs.
            </AlertDescription>
          </Alert>
        )}

        {/* PersonPicker for recipient (only when not stranger) */}
        {!isStranger && (
          <PersonPicker
            name={`donations.${index}.recipient_heir_id` as const}
            label="Recipient"
            control={control as Control<any>}
            persons={personOptions}
          />
        )}

        <Separator />

        {/* Always-visible fields */}
        <MoneyInput
          name={`donations.${index}.value_at_time_of_donation.centavos` as const}
          label="Value at Time of Donation"
          control={control as Control<any>}
        />

        <DateInput
          name={`donations.${index}.date` as const}
          label="Donation Date"
          control={control as Control<any>}
        />

        <div>
          <label className="text-sm font-medium leading-none mb-1.5 block">
            <span>Description</span>
          </label>
          <Input
            type="text"
            value={donation?.description ?? ''}
            onChange={(e) =>
              setValue(`donations.${index}.description` as keyof EngineInput, e.target.value as never)
            }
          />
        </div>

        {/* Exemption flags (only when not stranger) */}
        {!isStranger && (
          <>
            <Separator />
            <div className="space-y-2.5">
              <span className="text-sm font-medium text-muted-foreground">Exemption Flags</span>
              {EXEMPTION_FLAGS.map((flag) => {
                const flagVal = donation ? (donation as unknown as Record<string, unknown>)[flag] : false;
                return (
                  <div
                    key={flag}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer text-sm rounded-md px-2 py-1.5 transition-colors",
                      flagVal
                        ? "bg-accent/10 text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      id={`donation-flag-${index}-${flag}`}
                      checked={!!flagVal}
                      onCheckedChange={() => handleExemptionClick(flag)}
                    />
                    <label htmlFor={`donation-flag-${index}-${flag}`} className="cursor-pointer">{EXEMPTION_LABELS[flag]}</label>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Professional expense cascade: parent_required */}
        {!isStranger && isProfessionalExpense && (
          <div className="ml-6 border-l-2 border-[hsl(var(--accent))]/30 pl-4 space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`donation-parent-required-${index}`}
                checked={parentRequired}
                onCheckedChange={() =>
                  updateDonation({ professional_expense_parent_required: !parentRequired })
                }
              />
              <label htmlFor={`donation-parent-required-${index}`} className="text-sm font-medium cursor-pointer">Parent Co-Signature Required</label>
            </div>

            {/* Imputed savings (only when parent_required) */}
            {parentRequired && (
              <div className="ml-4">
                <MoneyInput
                  name={`donations.${index}.professional_expense_imputed_savings.centavos` as const}
                  label="Imputed Savings"
                  control={control as Control<any>}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
