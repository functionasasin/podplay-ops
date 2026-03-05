/**
 * StatuteCitationsSection — renders legal_basis[] as chips with expandable
 * article descriptions (spec §4.5).
 *
 * Displayed in the expanded heir row, below the ShareBreakdownSection.
 * When `forcedExpanded` is true (print mode), all descriptions are shown
 * without requiring a click.
 */

import { useState } from 'react';
import { getArticleDescription } from '../../data/ncc-articles';

export interface StatuteCitationsSectionProps {
  legalBasis: string[];
  heirName: string;
  forcedExpanded?: boolean;
}

export function StatuteCitationsSection({
  legalBasis,
  heirName,
  forcedExpanded = false,
}: StatuteCitationsSectionProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  if (legalBasis.length === 0) {
    return null;
  }

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const isExpanded = (key: string) => forcedExpanded || expandedKeys.has(key);

  return (
    <div className="space-y-2 pt-2">
      <p className="text-sm font-medium text-muted-foreground">
        Statutory Basis for {heirName}
      </p>
      <div className="flex flex-wrap gap-2">
        {legalBasis.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleKey(key)}
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${
              isExpanded(key)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      {legalBasis
        .filter((key) => isExpanded(key))
        .map((key) => {
          const description = getArticleDescription(key);
          // Skip description panel for unknown articles (description === key)
          // since the chip already displays the key
          if (description === key) return null;
          return (
            <div
              key={`desc-${key}`}
              className="rounded-md border bg-muted/50 px-3 py-2 text-sm"
            >
              <p className="text-muted-foreground">{description}</p>
            </div>
          );
        })}
    </div>
  );
}
