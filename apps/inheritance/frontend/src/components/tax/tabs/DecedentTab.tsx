/**
 * Tab 1 — Decedent Details (§4.23)
 */

import type { DecedentDetails, MaritalStatus, PropertyRegime } from '@/types/estate-tax';
import { MARITAL_STATUSES, PROPERTY_REGIMES } from '@/types/estate-tax';

export interface DecedentTabProps {
  data: DecedentDetails;
  onChange: (data: DecedentDetails) => void;
}

export function DecedentTab({ data, onChange }: DecedentTabProps) {
  const update = (partial: Partial<DecedentDetails>) => {
    onChange({ ...data, ...partial });
  };

  const showPropertyRegime = data.maritalStatus === 'married';
  const showNraFields = data.isNonResidentAlien;

  return (
    <div data-testid="decedent-tab">
      <h2>Decedent Details</h2>
      <p className="text-sm text-muted-foreground">
        Some fields have been pre-filled from your inheritance computation.
      </p>

      <div>
        <label htmlFor="decedent-name">Full Name (Last, First, Middle)</label>
        <input
          id="decedent-name"
          data-testid="decedent-name"
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="decedent-dod">Date of Death</label>
        <input
          id="decedent-dod"
          data-testid="decedent-dod"
          value={data.dateOfDeath}
          onChange={(e) => update({ dateOfDeath: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="decedent-citizenship">Citizenship</label>
        <select
          id="decedent-citizenship"
          data-testid="decedent-citizenship"
          value={data.citizenship}
          onChange={(e) => {
            const val = e.target.value as 'Filipino' | 'NRA';
            update({ citizenship: val, isNonResidentAlien: val === 'NRA' });
          }}
        >
          <option value="Filipino">Filipino</option>
          <option value="NRA">Non-Resident Alien</option>
        </select>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            data-testid="nra-checkbox"
            checked={data.isNonResidentAlien}
            onChange={(e) =>
              update({
                isNonResidentAlien: e.target.checked,
                citizenship: e.target.checked ? 'NRA' : 'Filipino',
              })
            }
          />
          Non-Resident Alien (NRA)
        </label>
      </div>

      <div>
        <label htmlFor="decedent-address">Address at Time of Death</label>
        <input
          id="decedent-address"
          data-testid="decedent-address"
          value={data.address}
          onChange={(e) => update({ address: e.target.value })}
        />
      </div>

      <div data-testid="marital-status-group">
        <label>Marital Status</label>
        {MARITAL_STATUSES.map((status) => (
          <label key={status}>
            <input
              type="radio"
              name="maritalStatus"
              value={status}
              checked={data.maritalStatus === status}
              onChange={() => update({ maritalStatus: status as MaritalStatus })}
            />
            {status.replace('_', ' ')}
          </label>
        ))}
      </div>

      {showPropertyRegime && (
        <div data-testid="property-regime-group">
          <label>Property Regime</label>
          {PROPERTY_REGIMES.map((regime) => (
            <label key={regime}>
              <input
                type="radio"
                name="propertyRegime"
                value={regime}
                checked={data.propertyRegime === regime}
                onChange={() => update({ propertyRegime: regime as PropertyRegime })}
              />
              {regime}
            </label>
          ))}
        </div>
      )}

      {showNraFields && (
        <div data-testid="nra-worldwide-section">
          <label htmlFor="worldwide-gross-estate">
            Total Worldwide Gross Estate (₱)
          </label>
          <input
            id="worldwide-gross-estate"
            data-testid="worldwide-gross-estate"
            type="number"
            value={data.worldwideGrossEstate ?? ''}
            onChange={(e) =>
              update({
                worldwideGrossEstate: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
