import { z } from 'zod';

export const clientFormSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  nickname: z.string().optional().default(''),
  date_of_birth: z.string().optional().default(''),
  place_of_birth: z.string().optional().default(''),
  email: z.union([z.string().email('Invalid email format'), z.literal('')]).optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  tin: z
    .union([
      z.string().regex(/^\d{3}-\d{3}-\d{3}(-\d{3})?$/, 'TIN must be XXX-XXX-XXX or XXX-XXX-XXX-XXX'),
      z.literal(''),
    ])
    .optional()
    .default(''),
  gov_id_type: z
    .enum([
      'philsys_id', 'passport', 'drivers_license', 'sss', 'gsis', 'prc',
      'voters_id', 'postal_id', 'senior_citizen_id', 'umid', 'nbi_clearance',
      '' as never, // allow empty string for "not selected"
    ])
    .optional()
    .default('' as never),
  gov_id_number: z.string().optional().default(''),
  civil_status: z
    .enum(['single', 'married', 'widowed', 'legally_separated', 'annulled', '' as never])
    .optional()
    .default('' as never),
  intake_date: z.string().min(1, 'Intake date is required'),
  referral_source: z.string().optional().default(''),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
