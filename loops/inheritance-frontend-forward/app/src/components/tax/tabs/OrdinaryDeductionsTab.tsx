/**
 * Tab 6 — Ordinary Deductions (§4.23)
 * Stub: will be fully implemented in a later iteration.
 */

import type { OrdinaryDeductions } from '@/types/estate-tax';
import { getDeductionRules } from '@/types/estate-tax';

export interface OrdinaryDeductionsTabProps {
  data: OrdinaryDeductions;
  dateOfDeath: string;
  onChange: (data: OrdinaryDeductions) => void;
}

export function OrdinaryDeductionsTab({
  data,
  dateOfDeath,
  onChange,
}: OrdinaryDeductionsTabProps) {
  const deductionRules = getDeductionRules(dateOfDeath);
  const showPreTrainFields = deductionRules === 'PRE_TRAIN';

  return (
    <div data-testid="ordinary-deductions-tab">
      <h2>Ordinary Deductions</h2>

      <div>
        <label>Claims Against the Estate</label>
        <p data-testid="claims-estate-count">
          {data.claimsAgainstEstate.length} claim(s)
        </p>
      </div>

      <div>
        <label>Claims Against Insolvent Persons</label>
        <p data-testid="claims-insolvent-count">
          {data.claimsAgainstInsolvent.length} claim(s)
        </p>
      </div>

      <div>
        <label>Unpaid Mortgages</label>
        <p data-testid="unpaid-mortgages-count">
          {data.unpaidMortgages.length} mortgage(s)
        </p>
      </div>

      <div>
        <label>Unpaid Taxes</label>
        <p data-testid="unpaid-taxes-count">
          {data.unpaidTaxes.length} tax(es)
        </p>
      </div>

      <div>
        <label>Casualty Losses</label>
        <p data-testid="casualty-losses-count">
          {data.casualtyLosses.length} loss(es)
        </p>
      </div>

      {showPreTrainFields && (
        <div data-testid="pre-train-section">
          <div>
            <label htmlFor="funeral-expenses">Funeral Expenses</label>
            <input
              id="funeral-expenses"
              data-testid="funeral-expenses"
              type="number"
              value={data.funeralExpenses ?? ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  funeralExpenses: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="judicial-admin-expenses">
              Judicial/Administration Expenses
            </label>
            <input
              id="judicial-admin-expenses"
              data-testid="judicial-admin-expenses"
              type="number"
              value={data.judicialAdminExpenses ?? ''}
              onChange={(e) =>
                onChange({
                  ...data,
                  judicialAdminExpenses: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
