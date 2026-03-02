import type { Donation, Person } from '../../types';
import { formatPeso } from '../../types';
import { getDonationCollationStatus, type CollationResult } from './donation-utils';

export interface DonationsSummaryPanelProps {
  donations: Donation[];
  persons: Person[];
}

function getRecipientName(donation: Donation, persons: Person[]): string {
  if (donation.recipient_is_stranger) {
    return 'Third-Party Donee';
  }
  if (donation.recipient_heir_id) {
    const person = persons.find((p) => p.id === donation.recipient_heir_id);
    return person ? person.name : 'Unknown Recipient';
  }
  return 'Unknown Recipient';
}

function chipClassName(status: CollationResult['status']): string {
  switch (status) {
    case 'collatable':
      return 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800';
    case 'exempt':
      return 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800';
    case 'stranger':
      return 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-muted-foreground';
  }
}

function chipLabel(result: CollationResult): string {
  switch (result.status) {
    case 'collatable':
      return 'Collatable';
    case 'exempt':
      return result.exemptionType ? `Exempt: ${result.exemptionType}` : 'Exempt';
    case 'stranger':
      return 'Stranger';
  }
}

export function DonationsSummaryPanel({ donations, persons }: DonationsSummaryPanelProps) {
  if (donations.length === 0) return null;

  let collatableTotal = 0;
  let exemptTotal = 0;
  let strangerTotal = 0;

  const rows = donations.map((donation) => {
    const collation = getDonationCollationStatus(donation, persons);
    const centavos =
      typeof donation.value_at_time_of_donation.centavos === 'string'
        ? Number(donation.value_at_time_of_donation.centavos)
        : donation.value_at_time_of_donation.centavos;

    switch (collation.status) {
      case 'collatable':
        collatableTotal += centavos;
        break;
      case 'exempt':
        exemptTotal += centavos;
        break;
      case 'stranger':
        strangerTotal += centavos;
        break;
    }

    return { donation, collation };
  });

  return (
    <div data-testid="donations-summary-panel" className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Advances on Inheritance</h3>
        <p className="text-sm text-muted-foreground">
          Art. 1061 NCC — Compulsory heirs must collate inter-vivos donations.
        </p>
      </div>

      <div className="divide-y">
        {rows.map(({ donation, collation }) => (
          <div key={donation.id} className="py-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {getRecipientName(donation, persons)}
              </span>
              <span>{formatPeso(donation.value_at_time_of_donation.centavos)} {'·'} {donation.date}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span>{donation.description}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                data-testid={`collation-chip-${donation.id}`}
                className={chipClassName(collation.status)}
              >
                {chipLabel(collation)}
              </span>
              {collation.article && (
                <span className="text-xs text-muted-foreground">
                  {collation.article}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div data-testid="donations-footer" className="border-t pt-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Collatable Total:</span>
          <span>{formatPeso(collatableTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Exempt Total:</span>
          <span>{formatPeso(exemptTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Third-Party Total:</span>
          <span>{formatPeso(strangerTotal)}</span>
        </div>
      </div>
    </div>
  );
}
