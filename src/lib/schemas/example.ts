import { z } from 'zod';
import { VALIDATION } from '@/lib/validation-messages';

const V = VALIDATION.intake;

export const exampleSchema = z.object({
  customer_name: z
    .string()
    .min(1, V.customer_name.required)
    .max(200, V.customer_name.max),
  venue_name: z
    .string()
    .min(1, V.venue_name.required)
    .max(200, V.venue_name.max),
  contact_email: z.string().email(V.contact_email.format),
});

export type ExampleFormValues = z.infer<typeof exampleSchema>;
