/**
 * Estate Tax Inputs Wizard — 8-tab container (§4.23)
 * Stub: will be implemented in a later iteration.
 */

import { useState, useCallback } from 'react';
import type { EstateTaxWizardState, TabIndex } from '@/types/estate-tax';
import { TAB_NAMES, TAB_COUNT, isTabValid } from '@/types/estate-tax';
import { DecedentTab } from './tabs/DecedentTab';
import { ExecutorTab } from './tabs/ExecutorTab';
import { RealPropertiesTab } from './tabs/RealPropertiesTab';
import { PersonalPropertiesTab } from './tabs/PersonalPropertiesTab';
import { OtherAssetsTab } from './tabs/OtherAssetsTab';
import { OrdinaryDeductionsTab } from './tabs/OrdinaryDeductionsTab';
import { SpecialDeductionsTab } from './tabs/SpecialDeductionsTab';
import { FilingAmnestyTab } from './tabs/FilingAmnestyTab';
import type { AutoSaveStatus } from '@/types';

export interface EstateTaxWizardProps {
  state: EstateTaxWizardState;
  onChange: (state: EstateTaxWizardState) => void;
  autoSaveStatus: AutoSaveStatus;
  decedentName: string;
  onBack: () => void;
}

export function EstateTaxWizard({
  state,
  onChange,
  autoSaveStatus,
  decedentName,
  onBack,
}: EstateTaxWizardProps) {
  const [activeTab, setActiveTab] = useState<TabIndex>(0);

  const handleTabChange = useCallback((tab: TabIndex) => {
    setActiveTab(tab);
  }, []);

  const handleNext = useCallback(() => {
    if (activeTab < TAB_COUNT - 1) {
      setActiveTab((activeTab + 1) as TabIndex);
    }
  }, [activeTab]);

  const handleBack = useCallback(() => {
    if (activeTab > 0) {
      setActiveTab((activeTab - 1) as TabIndex);
    }
  }, [activeTab]);

  const updateState = useCallback(
    (partial: Partial<EstateTaxWizardState>) => {
      onChange({ ...state, ...partial });
    },
    [state, onChange],
  );

  const saveStatusText =
    autoSaveStatus === 'saving'
      ? 'Saving...'
      : autoSaveStatus === 'saved'
        ? 'Saved'
        : autoSaveStatus === 'error'
          ? 'Error saving'
          : '';

  return (
    <div data-testid="estate-tax-wizard">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <button onClick={onBack} data-testid="back-to-inheritance">
          &larr; Back to Inheritance Results
        </button>
        <span>Estate Tax &mdash; Estate of {decedentName}</span>
        {saveStatusText && (
          <span data-testid="auto-save-status">{saveStatusText}</span>
        )}
      </div>

      <div className="flex gap-2 px-4 py-2 border-b" role="tablist">
        {TAB_NAMES.map((name, i) => {
          const valid = isTabValid(i as TabIndex, state);
          return (
            <button
              key={i}
              role="tab"
              aria-selected={activeTab === i}
              data-testid={`tab-${i}`}
              onClick={() => handleTabChange(i as TabIndex)}
              className={activeTab === i ? 'font-bold' : ''}
            >
              {valid ? '✓' : ''} {i + 1} {name}
            </button>
          );
        })}
        <span className="ml-auto text-sm text-muted-foreground">
          Step {activeTab + 1} of {TAB_COUNT}
        </span>
      </div>

      <div className="p-4">
        {activeTab === 0 && (
          <DecedentTab
            data={state.decedent}
            onChange={(decedent) => updateState({ decedent })}
          />
        )}
        {activeTab === 1 && (
          <ExecutorTab
            data={state.executor}
            onChange={(executor) => updateState({ executor })}
          />
        )}
        {activeTab === 2 && (
          <RealPropertiesTab
            data={state.realProperties}
            onChange={(realProperties) => updateState({ realProperties })}
          />
        )}
        {activeTab === 3 && (
          <PersonalPropertiesTab
            data={state.personalProperties}
            onChange={(personalProperties) => updateState({ personalProperties })}
          />
        )}
        {activeTab === 4 && (
          <OtherAssetsTab
            data={state.otherAssets}
            onChange={(otherAssets) => updateState({ otherAssets })}
          />
        )}
        {activeTab === 5 && (
          <OrdinaryDeductionsTab
            data={state.ordinaryDeductions}
            dateOfDeath={state.decedent.dateOfDeath}
            onChange={(ordinaryDeductions) => updateState({ ordinaryDeductions })}
          />
        )}
        {activeTab === 6 && (
          <SpecialDeductionsTab
            data={state.specialDeductions}
            onChange={(specialDeductions) => updateState({ specialDeductions })}
          />
        )}
        {activeTab === 7 && (
          <FilingAmnestyTab
            data={state.filing}
            onChange={(filing) => updateState({ filing })}
          />
        )}
      </div>

      <div className="flex justify-between px-4 py-2 border-t">
        <button
          onClick={handleBack}
          disabled={activeTab === 0}
          data-testid="prev-tab"
        >
          &larr; Back
        </button>
        <button
          onClick={handleNext}
          disabled={activeTab === TAB_COUNT - 1}
          data-testid="next-tab"
        >
          Next: {TAB_NAMES[activeTab + 1] ?? ''} &rarr;
        </button>
      </div>
    </div>
  );
}
