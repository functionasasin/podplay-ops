/**
 * ClientDetailsStep — Step 2: Client details (§4.18 + §4.3)
 *
 * Collects the lawyer's client information: the executor or primary heir
 * who is engaging the firm for the estate settlement.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ClientDetailsStepState } from '@/types/intake';
import {
  CLIENT_RELATIONSHIPS,
  CLIENT_RELATIONSHIP_LABELS,
  type ClientRelationship,
} from '@/types/intake';
import {
  CIVIL_STATUSES,
  CIVIL_STATUS_LABELS,
  GOV_ID_TYPES,
  GOV_ID_TYPE_LABELS,
  type CivilStatus,
  type GovIdType,
} from '@/types/client';
import { formatTIN } from '@/utils/tin-format';

export interface ClientDetailsStepProps {
  state: ClientDetailsStepState;
  onStateChange: (state: ClientDetailsStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ClientDetailsStep({
  state,
  onStateChange,
  onNext,
  onBack,
}: ClientDetailsStepProps) {
  const update = (patch: Partial<ClientDetailsStepState>) => {
    onStateChange({ ...state, ...patch });
  };

  const canProceed = state.full_name.trim() !== '' && state.relationship_to_decedent !== null;

  return (
    <div data-testid="client-details-step" className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Step 2: Client Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Information about the person engaging the firm (executor, heir, or administrator).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="client-name">Full Name *</Label>
          <Input
            id="client-name"
            value={state.full_name}
            onChange={(e) => update({ full_name: e.target.value })}
            placeholder="Full legal name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-nickname">Nickname</Label>
          <Input
            id="client-nickname"
            value={state.nickname}
            onChange={(e) => update({ nickname: e.target.value })}
            placeholder="Preferred name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-relationship">Relationship to Decedent *</Label>
          <select
            id="client-relationship"
            value={state.relationship_to_decedent ?? ''}
            onChange={(e) =>
              update({
                relationship_to_decedent: (e.target.value || null) as ClientRelationship | null,
              })
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select...</option>
            {CLIENT_RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {CLIENT_RELATIONSHIP_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-dob">Date of Birth</Label>
          <Input
            id="client-dob"
            type="date"
            value={state.date_of_birth}
            onChange={(e) => update({ date_of_birth: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-civil-status">Civil Status</Label>
          <select
            id="client-civil-status"
            value={state.civil_status ?? ''}
            onChange={(e) =>
              update({ civil_status: (e.target.value || null) as CivilStatus | null })
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select...</option>
            {CIVIL_STATUSES.map((cs) => (
              <option key={cs} value={cs}>
                {CIVIL_STATUS_LABELS[cs]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            type="email"
            value={state.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-phone">Phone</Label>
          <Input
            id="client-phone"
            type="tel"
            value={state.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="09XX XXX XXXX"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="client-address">Address</Label>
          <Input
            id="client-address"
            value={state.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Complete address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-tin">TIN</Label>
          <Input
            id="client-tin"
            value={state.tin}
            onChange={(e) => update({ tin: formatTIN(e.target.value) })}
            placeholder="XXX-XXX-XXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-gov-id-type">Government ID Type</Label>
          <select
            id="client-gov-id-type"
            value={state.gov_id_type ?? ''}
            onChange={(e) =>
              update({ gov_id_type: (e.target.value || null) as GovIdType | null })
            }
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select...</option>
            {GOV_ID_TYPES.map((id) => (
              <option key={id} value={id}>
                {GOV_ID_TYPE_LABELS[id]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-gov-id-number">Government ID Number</Label>
          <Input
            id="client-gov-id-number"
            value={state.gov_id_number}
            onChange={(e) => update({ gov_id_number: e.target.value })}
            placeholder="ID number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client-referral">Referral Source</Label>
          <Input
            id="client-referral"
            value={state.referral_source}
            onChange={(e) => update({ referral_source: e.target.value })}
            placeholder="How they found the firm"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Decedent Info →
        </Button>
      </div>
    </div>
  );
}
