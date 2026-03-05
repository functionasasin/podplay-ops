import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { GovIdType, CivilStatus } from '@/types/client';
import { GOV_ID_TYPES, GOV_ID_TYPE_LABELS, CIVIL_STATUSES, CIVIL_STATUS_LABELS } from '@/types/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const clientSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  nickname: z.string(),
  date_of_birth: z.string(),
  place_of_birth: z.string(),
  email: z.string().email('Invalid email').or(z.literal('')),
  phone: z.string(),
  address: z.string(),
  tin: z.string(),
  gov_id_type: z.string(),
  gov_id_number: z.string(),
  civil_status: z.string(),
  intake_date: z.string(),
  referral_source: z.string(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export interface ClientFormProps {
  defaultValues?: Partial<ClientFormData>;
  onSubmit: (data: ClientFormData) => void;
  loading?: boolean;
}

export function ClientForm({ defaultValues, onSubmit, loading }: ClientFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? '',
      nickname: defaultValues?.nickname ?? '',
      date_of_birth: defaultValues?.date_of_birth ?? '',
      place_of_birth: defaultValues?.place_of_birth ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      address: defaultValues?.address ?? '',
      tin: defaultValues?.tin ?? '',
      gov_id_type: defaultValues?.gov_id_type ?? '',
      gov_id_number: defaultValues?.gov_id_number ?? '',
      civil_status: defaultValues?.civil_status ?? '',
      intake_date: defaultValues?.intake_date ?? '',
      referral_source: defaultValues?.referral_source ?? '',
    },
  });

  const govIdType = watch('gov_id_type');
  const civilStatus = watch('civil_status');

  return (
    <form data-testid="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div data-testid="client-form-identity" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            data-testid="input-full-name"
            placeholder="Full Name"
            {...register('full_name')}
          />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            data-testid="input-nickname"
            placeholder="Nickname"
            {...register('nickname')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            data-testid="input-date-of-birth"
            type="date"
            {...register('date_of_birth')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="place_of_birth">Place of Birth</Label>
          <Input
            id="place_of_birth"
            data-testid="input-place-of-birth"
            placeholder="Place of Birth"
            {...register('place_of_birth')}
          />
        </div>
      </div>

      <div data-testid="client-form-contact" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            data-testid="input-email"
            type="email"
            placeholder="Email"
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            data-testid="input-phone"
            placeholder="Phone"
            {...register('phone')}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            data-testid="input-address"
            placeholder="Address"
            {...register('address')}
          />
        </div>
      </div>

      <div data-testid="client-form-legal" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tin">TIN</Label>
          <Input
            id="tin"
            data-testid="input-tin"
            placeholder="TIN (XXX-XXX-XXX)"
            {...register('tin')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Government ID Type</Label>
          <Select
            value={govIdType}
            onValueChange={(v) => setValue('gov_id_type', v as GovIdType | '')}
          >
            <SelectTrigger data-testid="select-gov-id-type">
              <SelectValue placeholder="Select ID Type" />
            </SelectTrigger>
            <SelectContent>
              {GOV_ID_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {GOV_ID_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gov_id_number">ID Number</Label>
          <Input
            id="gov_id_number"
            data-testid="input-gov-id-number"
            placeholder="ID Number"
            {...register('gov_id_number')}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Civil Status</Label>
          <Select
            value={civilStatus}
            onValueChange={(v) => setValue('civil_status', v as CivilStatus | '')}
          >
            <SelectTrigger data-testid="select-civil-status">
              <SelectValue placeholder="Select Civil Status" />
            </SelectTrigger>
            <SelectContent>
              {CIVIL_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {CIVIL_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div data-testid="client-form-intake" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="intake_date">Intake Date</Label>
          <Input
            id="intake_date"
            data-testid="input-intake-date"
            type="date"
            {...register('intake_date')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="referral_source">Referral Source</Label>
          <Input
            id="referral_source"
            data-testid="input-referral-source"
            placeholder="Referral Source"
            {...register('referral_source')}
          />
        </div>
      </div>

      <Button type="submit" data-testid="submit-client" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Client'}
      </Button>
    </form>
  );
}
