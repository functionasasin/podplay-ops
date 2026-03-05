import type { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EngineInput, Person } from '../../types';
import { DateInput } from '../shared/DateInput';
import { InstitutionsTab } from './InstitutionsTab';
import { LegaciesTab } from './LegaciesTab';
import { DevisesTab } from './DevisesTab';
import { DisinheritancesTab } from './DisinheritancesTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export interface WillStepProps {
  control: Control<EngineInput>;
  setValue: UseFormSetValue<EngineInput>;
  watch: UseFormWatch<EngineInput>;
  errors: Record<string, { message?: string }>;
  persons: Person[];
}

export function WillStep({
  control,
  setValue,
  watch,
  errors,
  persons,
}: WillStepProps) {
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

      <Tabs defaultValue="Institutions">
        <TabsList variant="line">
          <TabsTrigger value="Institutions">Institutions</TabsTrigger>
          <TabsTrigger value="Legacies">Legacies</TabsTrigger>
          <TabsTrigger value="Devises">Devises</TabsTrigger>
          <TabsTrigger value="Disinheritances">Disinheritances</TabsTrigger>
        </TabsList>
        <TabsContent value="Institutions" className="pt-2">
          <InstitutionsTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        </TabsContent>
        <TabsContent value="Legacies" className="pt-2">
          <LegaciesTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        </TabsContent>
        <TabsContent value="Devises" className="pt-2">
          <DevisesTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        </TabsContent>
        <TabsContent value="Disinheritances" className="pt-2">
          <DisinheritancesTab
            control={control}
            setValue={setValue}
            watch={watch}
            errors={errors}
            persons={persons}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
