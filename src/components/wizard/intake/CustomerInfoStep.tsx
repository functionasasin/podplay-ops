import { type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VALIDATION } from '@/lib/validation-messages';

const V = VALIDATION.intake;

const customerInfoSchema = z.object({
  customer_name: z
    .string()
    .min(1, V.customer_name.required)
    .max(200, V.customer_name.max),
  contact_email: z
    .string()
    .min(1, V.contact_email.required)
    .email(V.contact_email.format),
  contact_phone: z
    .string()
    .max(50, V.contact_phone.max),
});

export type CustomerInfoValues = z.infer<typeof customerInfoSchema>;

interface CustomerInfoStepProps {
  defaultValues?: Partial<CustomerInfoValues>;
  onNext: (data: CustomerInfoValues) => void;
  formRef?: RefObject<HTMLFormElement | null>;
}

export function CustomerInfoStep({ defaultValues, onNext, formRef }: CustomerInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInfoValues>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      customer_name: defaultValues?.customer_name ?? '',
      contact_email: defaultValues?.contact_email ?? '',
      contact_phone: defaultValues?.contact_phone ?? '',
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit(onNext)} noValidate className="space-y-4 p-4">
      <div className="space-y-1">
        <label htmlFor="customer_name" className="text-sm font-medium">
          Customer Name
        </label>
        <Input
          id="customer_name"
          placeholder="Enter customer name"
          className="h-11"
          {...register('customer_name')}
        />
        {errors.customer_name && (
          <p className="text-sm text-destructive">{errors.customer_name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="contact_email" className="text-sm font-medium">
          Contact Email
        </label>
        <Input
          id="contact_email"
          type="email"
          placeholder="Enter contact email"
          className="h-11"
          {...register('contact_email')}
        />
        {errors.contact_email && (
          <p className="text-sm text-destructive">{errors.contact_email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="contact_phone" className="text-sm font-medium">
          Contact Phone <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <Input
          id="contact_phone"
          type="tel"
          placeholder="Enter contact phone"
          className="h-11"
          {...register('contact_phone')}
        />
        {errors.contact_phone && (
          <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
