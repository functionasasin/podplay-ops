/**
 * ShareBreakdownSection — expandable per-heir breakdown (spec §4.12).
 *
 * Each heir row is clickable to reveal how their share was constructed:
 * from_legitime, from_free_portion, from_intestate (conditional on > 0),
 * gross_entitlement & net_from_estate (always shown), legitime_fraction
 * (when non-empty), and donations_imputed (when > 0, shown with negative sign).
 */
import { useState } from 'react';
import type { InheritanceShare } from '../../types';
import { formatPeso } from '../../types';
import { StatuteCitationsSection } from './StatuteCitationsSection';

export interface ShareBreakdownSectionProps {
  shares: InheritanceShare[];
}

export function ShareBreakdownSection({ shares }: ShareBreakdownSectionProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (heirId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(heirId)) {
        next.delete(heirId);
      } else {
        next.add(heirId);
      }
      return next;
    });
  };

  return (
    <div data-testid="share-breakdown-section" className="space-y-2">
      {shares.map((share) => {
        const isExpanded = expandedRows.has(share.heir_id);
        return (
          <div key={share.heir_id} className="border rounded-lg">
            <button
              type="button"
              onClick={() => toggleRow(share.heir_id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium">{share.heir_name}</span>
              <span className="text-muted-foreground text-sm">
                {formatPeso(share.net_from_estate.centavos)}
              </span>
            </button>

            {isExpanded && (
              <HeirBreakdown share={share} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function HeirBreakdown({ share }: { share: InheritanceShare }) {
  return (
    <div className="px-4 pb-4 pt-1 border-t bg-muted/20">
      <h4 className="text-sm font-semibold mb-3">
        Share Computation — {share.heir_name}
      </h4>

      <div className="space-y-1 text-sm">
        {share.legitime_fraction !== '' && (
          <BreakdownLine
            label="Legitime Fraction"
            value={share.legitime_fraction}
          />
        )}

        {Number(share.from_legitime.centavos) > 0 && (
          <BreakdownLine
            label="From Legitime"
            value={formatPeso(share.from_legitime.centavos)}
          />
        )}

        {Number(share.from_free_portion.centavos) > 0 && (
          <BreakdownLine
            label="From Free Portion"
            value={formatPeso(share.from_free_portion.centavos)}
          />
        )}

        {Number(share.from_intestate.centavos) > 0 && (
          <BreakdownLine
            label="From Intestate"
            value={formatPeso(share.from_intestate.centavos)}
          />
        )}

        <div className="border-t my-2" />

        <BreakdownLine
          label="Gross Entitlement"
          value={formatPeso(share.gross_entitlement.centavos)}
        />

        {Number(share.donations_imputed.centavos) > 0 && (
          <div
            data-testid="donations-imputed-line"
            className="flex justify-between text-amber-700"
          >
            <span>Less: Advances on Inheritance</span>
            <span>− {formatPeso(share.donations_imputed.centavos)}</span>
          </div>
        )}

        <div className="border-t my-2" />

        <BreakdownLine
          label="Net from Estate"
          value={formatPeso(share.net_from_estate.centavos)}
          bold
        />
      </div>

      {share.legal_basis.length > 0 && (
        <StatuteCitationsSection
          legalBasis={share.legal_basis}
          heirName={share.heir_name}
        />
      )}
    </div>
  );
}

function BreakdownLine({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
