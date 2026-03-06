// WizardForm: Flat form (all steps stacked). Used in "Input" tab of ComputationDetailPage.
// Uses the same step sub-components as WizardPage (spec §14.6).
import type { WizardFormData } from '@/types/wizard';
import { computeActiveSteps } from '@/lib/wizard-routing';
import { WizardReview } from '@/components/wizard/WizardReview';
import WizardStep00 from '@/components/wizard/steps/WizardStep00';
import WizardStep01 from '@/components/wizard/steps/WizardStep01';
import WizardStep02 from '@/components/wizard/steps/WizardStep02';
import WizardStep03 from '@/components/wizard/steps/WizardStep03';
import WizardStep04 from '@/components/wizard/steps/WizardStep04';
import WizardStep05 from '@/components/wizard/steps/WizardStep05';
import WizardStep06 from '@/components/wizard/steps/WizardStep06';
import WizardStep07A from '@/components/wizard/steps/WizardStep07A';
import WizardStep07B from '@/components/wizard/steps/WizardStep07B';
import WizardStep07C from '@/components/wizard/steps/WizardStep07C';
import WizardStep07D from '@/components/wizard/steps/WizardStep07D';
import WizardStep08 from '@/components/wizard/steps/WizardStep08';
import WizardStep09 from '@/components/wizard/steps/WizardStep09';
import WizardStep10 from '@/components/wizard/steps/WizardStep10';
import WizardStep11 from '@/components/wizard/steps/WizardStep11';
import WizardStep12 from '@/components/wizard/steps/WizardStep12';
import WizardStep13 from '@/components/wizard/steps/WizardStep13';

const STEP_MAP: Record<string, React.ComponentType<{ data: Partial<WizardFormData>; onBack: () => void; onSubmit: () => void }>> = {
  'WS-00': WizardStep00 as never,
  'WS-01': WizardStep01 as never,
  'WS-02': WizardStep02 as never,
  'WS-03': WizardStep03 as never,
  'WS-04': WizardStep04 as never,
  'WS-05': WizardStep05 as never,
  'WS-06': WizardStep06 as never,
  'WS-07A': WizardStep07A as never,
  'WS-07B': WizardStep07B as never,
  'WS-07C': WizardStep07C as never,
  'WS-07D': WizardStep07D as never,
  'WS-08': WizardStep08 as never,
  'WS-09': WizardStep09 as never,
  'WS-10': WizardStep10 as never,
  'WS-11': WizardStep11 as never,
  'WS-12': WizardStep12 as never,
  'WS-13': WizardStep13 as never,
};

interface WizardFormProps {
  data: Partial<WizardFormData>;
  onSubmit?: () => void;
}

export function WizardForm({ data, onSubmit }: WizardFormProps) {
  const activeSteps = computeActiveSteps(data as WizardFormData).filter((s) => s !== 'REVIEW');

  return (
    <div className="space-y-8">
      {activeSteps.map((stepId) => {
        const StepComponent = STEP_MAP[stepId];
        if (!StepComponent) return null;
        return (
          <div key={stepId} className="border rounded-lg p-4">
            <StepComponent data={data} onBack={() => {}} onSubmit={() => {}} />
          </div>
        );
      })}
      <WizardReview data={data} onBack={() => {}} onSubmit={onSubmit ?? (() => {})} />
    </div>
  );
}

export default WizardForm;
