/**
 * Tab 7 — Special Deductions (§4.23)
 */

import type { SpecialDeductions } from '@/types/estate-tax';

export interface SpecialDeductionsTabProps {
  data: SpecialDeductions;
  onChange: (data: SpecialDeductions) => void;
}

export function SpecialDeductionsTab({ data, onChange }: SpecialDeductionsTabProps) {
  const update = (partial: Partial<SpecialDeductions>) => {
    onChange({ ...data, ...partial });
  };

  return (
    <div data-testid="special-deductions-tab">
      <h2>Special Deductions</h2>

      <div>
        <label htmlFor="medical-expenses">Medical Expenses (within 1 year of DOD)</label>
        <input
          id="medical-expenses"
          data-testid="medical-expenses"
          type="number"
          value={data.medicalExpenses}
          onChange={(e) => update({ medicalExpenses: Number(e.target.value) || 0 })}
        />
      </div>

      <div>
        <label htmlFor="ra4917-benefits">RA 4917 Benefits</label>
        <input
          id="ra4917-benefits"
          data-testid="ra4917-benefits"
          type="number"
          value={data.ra4917Benefits}
          onChange={(e) => update({ ra4917Benefits: Number(e.target.value) || 0 })}
        />
      </div>

      <div>
        <label htmlFor="foreign-tax-credits">Foreign Tax Credits</label>
        <input
          id="foreign-tax-credits"
          data-testid="foreign-tax-credits"
          type="number"
          value={data.foreignTaxCredits}
          onChange={(e) => update({ foreignTaxCredits: Number(e.target.value) || 0 })}
        />
      </div>

      <div>
        <label>Standard Deduction</label>
        <p data-testid="standard-deduction">₱{data.standardDeduction.toLocaleString()}</p>
        <span className="text-sm text-muted-foreground">
          Auto-applied by engine (₱5,000,000)
        </span>
      </div>

      <div>
        <label>Family Home Deduction</label>
        <p data-testid="family-home-deduction">
          ₱{data.familyHomeDeduction.toLocaleString()}
        </p>
        <span className="text-sm text-muted-foreground">
          Auto-calculated from Real Properties tab
        </span>
      </div>
    </div>
  );
}
