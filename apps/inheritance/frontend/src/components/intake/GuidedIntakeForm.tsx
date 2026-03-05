/**
 * GuidedIntakeForm — 7-step guided intake form container (§4.18)
 *
 * Multi-step guided interview that pre-populates the case wizard
 * and creates the client record simultaneously.
 *
 * Steps: Conflict Check → Client Details → Decedent Info →
 *        Settlement Track → Family Composition → Asset Summary → Review & Save
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { INTAKE_STEPS, INTAKE_STEP_COUNT, type IntakeFormState } from '@/types/intake';
import { createInitialIntakeState, isStepComplete } from '@/lib/intake';
import { ConflictCheckStep } from './ConflictCheckStep';
import { ClientDetailsStep } from './ClientDetailsStep';
import { DecedentInfoStep } from './DecedentInfoStep';
import { FamilyCompositionStep } from './FamilyCompositionStep';
import { AssetSummaryStep } from './AssetSummaryStep';
import { SettlementTrackStep } from './SettlementTrackStep';
import { IntakeReviewStep } from './IntakeReviewStep';

export interface GuidedIntakeFormProps {
  orgId: string;
  userId: string;
  onComplete: (caseId: string, clientId: string) => void;
  onCancel: () => void;
}

export function GuidedIntakeForm({
  orgId,
  userId,
  onComplete,
  onCancel,
}: GuidedIntakeFormProps) {
  const [state, setState] = useState<IntakeFormState>(createInitialIntakeState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = state.currentStep;

  const goNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, INTAKE_STEP_COUNT - 1),
    }));
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  const handleCreateCase = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Import dynamically to avoid pulling supabase into test bundle unnecessarily
      const { supabase } = await import('@/lib/supabase');
      const {
        mapIntakeToClientData,
        mapIntakeToEngineInput,
        mapIntakeToIntakeData,
      } = await import('@/lib/intake');

      // 1. Create client row
      const clientData = mapIntakeToClientData(state, orgId, userId);
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select('id')
        .single();

      if (clientError || !client) {
        throw new Error(clientError?.message ?? 'Failed to create client');
      }

      // 2. Create case row with pre-populated input_json and intake_data
      const engineInput = mapIntakeToEngineInput(state);
      const intakeData = mapIntakeToIntakeData(state);

      const { data: caseRow, error: caseError } = await supabase
        .from('cases')
        .insert({
          org_id: orgId,
          created_by: userId,
          client_id: client.id,
          decedent_name: state.decedentInfo.full_name,
          date_of_death: state.decedentInfo.date_of_death || null,
          input_json: engineInput,
          intake_data: intakeData,
          status: 'draft',
        })
        .select('id')
        .single();

      if (caseError || !caseRow) {
        throw new Error(caseError?.message ?? 'Failed to create case');
      }

      onComplete(caseRow.id, client.id);
    } catch (err) {
      console.error('Intake form submission error:', err);
      setIsSubmitting(false);
    }
  }, [state, orgId, userId, onComplete]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ConflictCheckStep
            state={state.conflictCheck}
            onStateChange={(conflictCheck) =>
              setState((prev) => ({ ...prev, conflictCheck }))
            }
            onNext={goNext}
            onSkip={() => {
              setState((prev) => ({
                ...prev,
                conflictCheck: { ...prev.conflictCheck, outcome: 'skipped' },
              }));
              goNext();
            }}
          />
        );
      case 1:
        return (
          <ClientDetailsStep
            state={state.clientDetails}
            onStateChange={(clientDetails) =>
              setState((prev) => ({ ...prev, clientDetails }))
            }
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 2:
        return (
          <DecedentInfoStep
            state={state.decedentInfo}
            onStateChange={(decedentInfo) =>
              setState((prev) => ({ ...prev, decedentInfo }))
            }
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 3:
        return (
          <FamilyCompositionStep
            state={state.familyComposition}
            onStateChange={(familyComposition) =>
              setState((prev) => ({ ...prev, familyComposition }))
            }
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 4:
        return (
          <AssetSummaryStep
            state={state.assetSummary}
            onStateChange={(assetSummary) =>
              setState((prev) => ({ ...prev, assetSummary }))
            }
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 5:
        return (
          <SettlementTrackStep
            state={state.settlementTrack}
            onStateChange={(settlementTrack) =>
              setState((prev) => ({ ...prev, settlementTrack }))
            }
            onNext={goNext}
            onBack={goBack}
          />
        );
      case 6:
        return (
          <IntakeReviewStep
            state={state}
            onCreateCase={handleCreateCase}
            onBack={goBack}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div data-testid="guided-intake-form" className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">New Estate Case — Guided Intake</h1>
        <p className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {INTAKE_STEP_COUNT}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        {INTAKE_STEPS.map((stepName, i) => (
          <div key={stepName} className="flex items-center gap-1">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                i === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : i < currentStep && isStepComplete(state, i)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => {
                if (i <= currentStep) {
                  setState((prev) => ({ ...prev, currentStep: i }));
                }
              }}
              disabled={i > currentStep}
            >
              {i < currentStep && isStepComplete(state, i) ? '✓' : i + 1}
              <span className="hidden sm:inline">{stepName}</span>
            </button>
            {i < INTAKE_STEP_COUNT - 1 && (
              <div
                className={`h-0.5 w-4 ${
                  i < currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Cancel / actions bar */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Current step */}
      {renderStep()}
    </div>
  );
}
