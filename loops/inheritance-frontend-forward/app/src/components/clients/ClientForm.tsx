import type { GovIdType, CivilStatus } from '@/types/client';
import { GOV_ID_TYPES, GOV_ID_TYPE_LABELS, CIVIL_STATUSES, CIVIL_STATUS_LABELS } from '@/types/client';

export interface ClientFormData {
  full_name: string;
  nickname: string;
  date_of_birth: string;
  place_of_birth: string;
  email: string;
  phone: string;
  address: string;
  tin: string;
  gov_id_type: GovIdType | '';
  gov_id_number: string;
  civil_status: CivilStatus | '';
  intake_date: string;
  referral_source: string;
}

export interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  loading?: boolean;
}

export function ClientForm(props: ClientFormProps) {
  const { defaultValues, onSubmit, loading } = props;

  // stub — will use react-hook-form + zod in implementation
  return (
    <form
      data-testid="client-form"
      onSubmit={(e) => {
        e.preventDefault();
        // stub
      }}
    >
      <div data-testid="client-form-identity">
        <input
          data-testid="input-full-name"
          name="full_name"
          placeholder="Full Name"
          defaultValue={defaultValues?.full_name ?? ''}
        />
        <input
          data-testid="input-nickname"
          name="nickname"
          placeholder="Nickname"
          defaultValue={defaultValues?.nickname ?? ''}
        />
        <input
          data-testid="input-date-of-birth"
          name="date_of_birth"
          type="date"
          defaultValue={defaultValues?.date_of_birth ?? ''}
        />
        <input
          data-testid="input-place-of-birth"
          name="place_of_birth"
          placeholder="Place of Birth"
          defaultValue={defaultValues?.place_of_birth ?? ''}
        />
      </div>

      <div data-testid="client-form-contact">
        <input
          data-testid="input-email"
          name="email"
          type="email"
          placeholder="Email"
          defaultValue={defaultValues?.email ?? ''}
        />
        <input
          data-testid="input-phone"
          name="phone"
          placeholder="Phone"
          defaultValue={defaultValues?.phone ?? ''}
        />
        <input
          data-testid="input-address"
          name="address"
          placeholder="Address"
          defaultValue={defaultValues?.address ?? ''}
        />
      </div>

      <div data-testid="client-form-legal">
        <input
          data-testid="input-tin"
          name="tin"
          placeholder="TIN (XXX-XXX-XXX)"
          defaultValue={defaultValues?.tin ?? ''}
        />
        <select
          data-testid="select-gov-id-type"
          name="gov_id_type"
          defaultValue={defaultValues?.gov_id_type ?? ''}
        >
          <option value="">Select ID Type</option>
          {GOV_ID_TYPES.map((type) => (
            <option key={type} value={type}>
              {GOV_ID_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input
          data-testid="input-gov-id-number"
          name="gov_id_number"
          placeholder="ID Number"
          defaultValue={defaultValues?.gov_id_number ?? ''}
        />
        <select
          data-testid="select-civil-status"
          name="civil_status"
          defaultValue={defaultValues?.civil_status ?? ''}
        >
          <option value="">Select Civil Status</option>
          {CIVIL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CIVIL_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div data-testid="client-form-intake">
        <input
          data-testid="input-intake-date"
          name="intake_date"
          type="date"
          defaultValue={defaultValues?.intake_date ?? ''}
        />
        <input
          data-testid="input-referral-source"
          name="referral_source"
          placeholder="Referral Source"
          defaultValue={defaultValues?.referral_source ?? ''}
        />
      </div>

      <button type="submit" data-testid="submit-client" disabled={loading}>
        {loading ? 'Saving...' : 'Save Client'}
      </button>
    </form>
  );
}
