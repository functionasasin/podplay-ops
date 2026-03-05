import { useState } from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';
import { DateInput } from '../shared/DateInput';
import { InstitutionsTab } from './InstitutionsTab';
import { LegaciesTab } from './LegaciesTab';
import { DevisesTab } from './DevisesTab';
import { DisinheritancesTab } from './DisinheritancesTab';
import { cn } from '@/lib/utils';

export interface WillStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

const SUB_TABS = ['Institutions', 'Legacies', 'Devises', 'Disinheritances'] as const;
type SubTab = (typeof SUB_TABS)[number];

export function WillStep({
  control,
  setValue,
  watch,
  errors,
  persons,
}: WillStepProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('Institutions');
  const will = watch('will' as any);

  if (!will) {
    return <div data-testid="will-step" />;
  }

  return (
    <div data-testid="will-step" className="space-y-6">
      <h2 className="sr-only">Last Will &amp; Testament</h2>
      <DateInput<EngineInput>
        name={'will.date_executed' as any}
        label="Date Will Was Executed"
        control={control}
      />

      <div className="flex gap-1 border-b border-border">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              "hover:text-foreground",
              activeTab === tab
                ? "text-foreground after:absolute after:bottom-0 after:inset-x-0 after:h-0.5 after:bg-[hsl(var(--accent))]"
                : "text-muted-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'Institutions' && (
          <InstitutionsTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        )}
        {activeTab === 'Legacies' && (
          <LegaciesTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        )}
        {activeTab === 'Devises' && (
          <DevisesTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        )}
        {activeTab === 'Disinheritances' && (
          <DisinheritancesTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        )}
      </div>
    </div>
  );
}
