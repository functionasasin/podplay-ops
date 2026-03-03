/**
 * Tab 3 — Real Properties (§4.23)
 * Stub: will be fully implemented in a later iteration.
 */

import type { RealPropertyItem } from '@/types/estate-tax';

export interface RealPropertiesTabProps {
  data: RealPropertyItem[];
  onChange: (data: RealPropertyItem[]) => void;
}

export function RealPropertiesTab({ data, onChange }: RealPropertiesTabProps) {
  const addProperty = () => {
    const newItem: RealPropertyItem = {
      id: crypto.randomUUID(),
      titleNumber: '',
      taxDecNumber: '',
      location: '',
      lotArea: null,
      improvementArea: null,
      classification: 'residential',
      fmvTaxDec: 0,
      fmvBirZonal: 0,
      ownership: 'exclusive',
      isFamilyHome: false,
      hasBarangayCert: false,
    };
    onChange([...data, newItem]);
  };

  const removeProperty = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div data-testid="real-properties-tab">
      <h2>Real Properties</h2>

      {data.length === 0 && (
        <p data-testid="no-real-properties">No real properties added.</p>
      )}

      {data.map((item, index) => (
        <div key={item.id} data-testid={`real-property-${index}`}>
          <span>Property {index + 1}: {item.titleNumber || 'Untitled'}</span>
          <button
            data-testid={`remove-real-property-${index}`}
            onClick={() => removeProperty(item.id)}
          >
            Remove
          </button>
        </div>
      ))}

      <button data-testid="add-real-property" onClick={addProperty}>
        Add Real Property
      </button>
    </div>
  );
}
