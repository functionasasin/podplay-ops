/**
 * Tab 8 — Filing & Amnesty (§4.23)
 * Stub: will be fully implemented in a later iteration.
 */

import type { FilingData, AmnestyDeductionMode } from '@/types/estate-tax';

export interface FilingAmnestyTabProps {
  data: FilingData;
  onChange: (data: FilingData) => void;
}

export function FilingAmnestyTab({ data, onChange }: FilingAmnestyTabProps) {
  const update = (partial: Partial<FilingData>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <div data-testid="filing-amnesty-tab">
      <h2>Filing &amp; Amnesty</h2>

      <div>
        <label>
          <input
            type="checkbox"
            data-testid="amnesty-toggle"
            checked={data.userElectsAmnesty}
            onChange={(e) => update({ userElectsAmnesty: e.target.checked })}
          />
          Elect Estate Tax Amnesty
        </label>
      </div>

      {data.userElectsAmnesty && (
        <div data-testid="amnesty-mode-section">
          <label>Amnesty Deduction Mode</label>
          <label>
            <input
              type="radio"
              name="amnestyMode"
              value="standard"
              checked={data.amnestyDeductionMode === 'standard'}
              onChange={() => update({ amnestyDeductionMode: 'standard' as AmnestyDeductionMode })}
            />
            Standard
          </label>
          <label>
            <input
              type="radio"
              name="amnestyMode"
              value="narrow"
              checked={data.amnestyDeductionMode === 'narrow'}
              onChange={() => update({ amnestyDeductionMode: 'narrow' as AmnestyDeductionMode })}
            />
            Narrow
          </label>
        </div>
      )}

      <fieldset>
        <legend>Filing Flags</legend>
        <label>
          <input
            type="checkbox"
            data-testid="is-amended"
            checked={data.isAmended}
            onChange={(e) => update({ isAmended: e.target.checked })}
          />
          Amended Return
        </label>
        <label>
          <input
            type="checkbox"
            data-testid="has-extension"
            checked={data.hasExtension}
            onChange={(e) => update({ hasExtension: e.target.checked })}
          />
          Extension Filed
        </label>
        <label>
          <input
            type="checkbox"
            data-testid="is-installment"
            checked={data.isInstallment}
            onChange={(e) => update({ isInstallment: e.target.checked })}
          />
          Installment Payment
        </label>
        <label>
          <input
            type="checkbox"
            data-testid="is-judicial"
            checked={data.isJudicialSettlement}
            onChange={(e) => update({ isJudicialSettlement: e.target.checked })}
          />
          Judicial Settlement
        </label>
      </fieldset>

      <fieldset>
        <legend>Disqualifying Violations</legend>
        <label>
          <input
            type="checkbox"
            data-testid="pcgg-violation"
            checked={data.hasPcggViolation}
            onChange={(e) => update({ hasPcggViolation: e.target.checked })}
          />
          PCGG Violation
        </label>
        <label>
          <input
            type="checkbox"
            data-testid="ra3019-violation"
            checked={data.hasRa3019Violation}
            onChange={(e) => update({ hasRa3019Violation: e.target.checked })}
          />
          RA 3019 Violation
        </label>
        <label>
          <input
            type="checkbox"
            data-testid="ra9160-violation"
            checked={data.hasRa9160Violation}
            onChange={(e) => update({ hasRa9160Violation: e.target.checked })}
          />
          RA 9160 Violation
        </label>
      </fieldset>
    </div>
  );
}
