import React from 'react';

// Project fields used for token substitution
export type ProjectTokenFields = {
  customer_name: string;
  court_count: number;
  ddns_subdomain?: string | null;
  unifi_site_name?: string | null;
  mac_mini_username?: string | null;
  location_id?: string | null;
};

// Checklist item shape
export type ChecklistItem = {
  id: string;
  phase: number;
  step_number: number;
  sort_order: number;
  title: string;
  description: string;
  warnings: string[] | null;
  is_completed: boolean;
  notes: string | null;
};

// Tokens that have editability via the inline prompt
const UNSET_TOKENS = new Set([
  'DDNS_SUBDOMAIN',
  'UNIFI_SITE_NAME',
  'MAC_MINI_USERNAME',
  'LOCATION_ID',
]);

// Critical step numbers that get a red-border warning
const CRITICAL_STEPS = new Set([4, 45, 73, 86, 98, 29]);

/**
 * Render a step description with token substitution.
 * Tokens with null/empty values render as "(not yet set)" (orange in UI).
 */
export function renderStepDescription(
  description: string,
  project: ProjectTokenFields,
): { rendered: string; hasUnsetTokens: boolean; unsetTokenKeys: string[] } {
  const tokenMap: Record<string, string | null> = {
    CUSTOMER_NAME: project.customer_name,
    COURT_COUNT: String(project.court_count),
    DDNS_SUBDOMAIN: project.ddns_subdomain ?? null,
    UNIFI_SITE_NAME: project.unifi_site_name ?? null,
    MAC_MINI_USERNAME: project.mac_mini_username ?? null,
    LOCATION_ID: project.location_id ?? null,
  };

  let hasUnsetTokens = false;
  const unsetTokenKeys: string[] = [];

  const rendered = description.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = tokenMap[key];
    if ((value === null || value === '') && UNSET_TOKENS.has(key)) {
      hasUnsetTokens = true;
      if (!unsetTokenKeys.includes(key)) unsetTokenKeys.push(key);
      return '(not yet set)';
    }
    return value ?? `{{${key}}}`;
  });

  return { rendered, hasUnsetTokens, unsetTokenKeys };
}

/**
 * Render description text, wrapping "(not yet set)" spans in orange.
 */
function RenderedDescription({
  description,
  project,
}: {
  description: string;
  project: ProjectTokenFields;
}) {
  const { rendered } = renderStepDescription(description, project);

  // Split on "(not yet set)" to apply orange styling
  const parts = rendered.split('(not yet set)');
  if (parts.length === 1) {
    return <span>{rendered}</span>;
  }

  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="text-orange-500 font-medium">(not yet set)</span>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

type SmartChecklistProps = {
  items: ChecklistItem[];
  project: ProjectTokenFields;
  onToggle: (item: ChecklistItem) => void;
  loading?: boolean;
};

/**
 * SmartChecklist — renders checklist items with:
 * - Checkbox toggle
 * - Token-substituted descriptions (unset tokens in orange)
 * - Warning banners (critical = red border, standard = yellow border)
 */
export function SmartChecklist({
  items,
  project,
  onToggle,
  loading = false,
}: SmartChecklistProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading checklist...</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No checklist items for this phase.</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const { hasUnsetTokens } = renderStepDescription(item.description, project);
        const isCritical = CRITICAL_STEPS.has(item.step_number);

        return (
          <div
            key={item.id}
            className={[
              'border rounded-lg p-4 space-y-2',
              item.is_completed ? 'bg-muted/30' : 'bg-background',
            ].join(' ')}
          >
            {/* Warnings */}
            {item.warnings && item.warnings.length > 0 && (
              <div className="space-y-1">
                {item.warnings.map((w, i) => (
                  <div
                    key={i}
                    className={[
                      'px-3 py-2 rounded text-xs',
                      isCritical
                        ? 'border-l-4 border-red-500 bg-red-50 text-red-900'
                        : 'border-l-4 border-yellow-500 bg-yellow-50 text-yellow-900',
                    ].join(' ')}
                  >
                    ⚠ {w}
                  </div>
                ))}
              </div>
            )}

            {/* Checkbox + title */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={item.is_completed}
                onChange={() => onToggle(item)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1">
                <p
                  className={[
                    'text-sm font-medium',
                    item.is_completed ? 'line-through text-muted-foreground' : '',
                  ].join(' ')}
                >
                  Step {item.step_number}: {item.title}
                </p>

                {/* Description with token substitution */}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    <RenderedDescription description={item.description} project={project} />
                  </p>
                )}

                {/* Unset token prompt */}
                {hasUnsetTokens && (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠ Some project fields are not yet set. Fill them in to complete this step.
                  </p>
                )}
              </div>
            </label>
          </div>
        );
      })}
    </div>
  );
}
