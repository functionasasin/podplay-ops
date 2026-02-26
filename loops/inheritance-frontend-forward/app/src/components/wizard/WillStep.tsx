import React, { useState } from 'react';
import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';
import { DateInput } from '../shared/DateInput';
import { InstitutionsTab } from './InstitutionsTab';
import { LegaciesTab } from './LegaciesTab';
import { DevisesTab } from './DevisesTab';
import { DisinheritancesTab } from './DisinheritancesTab';

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
    <div data-testid="will-step" className="space-y-4">
      <DateInput<EngineInput>
        name={'will.date_executed' as any}
        label="Date Will Was Executed"
        control={control}
      />

      <div className="flex gap-2 border-b mb-4">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 ${
              activeTab === tab
                ? 'font-bold border-b-2 border-blue-500'
                : 'text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

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
  );
}
