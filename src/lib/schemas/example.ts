import { z } from 'zod';

export const exampleSchema = z.object({
  customer_name: z
    .string()
    .min(1, 'Customer name is required')
    .max(200, 'Customer name must be 200 characters or less'),
  venue_name: z
    .string()
    .min(1, 'Venue name is required')
    .max(200, 'Venue name must be 200 characters or less'),
  contact_email: z.string().email('Enter a valid email address'),
});

export type ExampleFormValues = z.infer<typeof exampleSchema>;
