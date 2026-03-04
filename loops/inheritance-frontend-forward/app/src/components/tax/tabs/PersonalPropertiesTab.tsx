/**
 * Tab 4 — Personal Properties (§4.23)
 */

import type { PersonalPropertyItem } from '@/types/estate-tax';

export interface PersonalPropertiesTabProps {
  data: PersonalPropertyItem[];
  onChange: (data: PersonalPropertyItem[]) => void;
}

export function PersonalPropertiesTab({ data, onChange }: PersonalPropertiesTabProps) {
  const addProperty = () => {
    const newItem: PersonalPropertyItem = {
      id: crypto.randomUUID(),
      subtype: 'cash',
      description: '',
      fmv: 0,
      ownership: 'exclusive',
    };
    onChange([...data, newItem]);
  };

  const removeProperty = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  return (
    <div data-testid="personal-properties-tab">
      <h2>Personal Properties</h2>

      {data.length === 0 && (
        <p data-testid="no-personal-properties">No personal properties added.</p>
      )}

      {data.map((item, index) => (
        <div key={item.id} data-testid={`personal-property-${index}`}>
          <span>
            {item.subtype}: {item.description || 'No description'}
          </span>
          <button
            data-testid={`remove-personal-property-${index}`}
            onClick={() => removeProperty(item.id)}
          >
            Remove
          </button>
        </div>
      ))}

      <button data-testid="add-personal-property" onClick={addProperty}>
        Add Personal Property
      </button>
    </div>
  );
}
