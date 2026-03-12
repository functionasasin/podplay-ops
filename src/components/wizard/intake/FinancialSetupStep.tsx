import { type RefObject } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VALIDATION } from '@/lib/validation-messages';

const V = VALIDATION.intake;

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const financialSetupSchema = z.object({
  target_go_live_date: z
    .string()
    .min(1, V.target_go_live_date.required)
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date > today();
      },
      { message: V.target_go_live_date.future },
    ),
  deposit_amount: z
    .number()
    .gt(0, V.deposit_amount.positive),
});

export type FinancialSetupValues = z.infer<typeof financialSetupSchema>;

interface FinancialSetupStepProps {
  defaultValues?: Partial<FinancialSetupValues>;
  onNext: (data: FinancialSetupValues) => void;
  formRef?: RefObject<HTMLFormElement | null>;
}

export function FinancialSetupStep({ defaultValues, onNext, formRef }: FinancialSetupStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinancialSetupValues>({
    resolver: zodResolver(financialSetupSchema),
    defaultValues: {
      target_go_live_date: defaultValues?.target_go_live_date ?? '',
      deposit_amount: defaultValues?.deposit_amount ?? ('' as unknown as number),
    },
  });

  function onSubmit(data: FinancialSetupValues) {
    onNext(data);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 p-4">
      <div className="space-y-1">
        <label htmlFor="target_go_live_date" className="text-sm font-medium">
          Target Go-Live Date
        </label>
        <Input id="target_go_live_date" type="date" className="h-11" {...register('target_go_live_date')} />
        {errors.target_go_live_date && (
          <p className="text-sm text-destructive">{errors.target_go_live_date.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="deposit_amount" className="text-sm font-medium">
          Deposit Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            $
          </span>
          <Input
            id="deposit_amount"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0.00"
            className="pl-7 h-11"
            {...register('deposit_amount', {
              setValueAs: (v: string) => (v === '' ? NaN : parseFloat(parseFloat(v).toFixed(2))),
            })}
          />
        </div>
        {errors.deposit_amount && (
          <p className="text-sm text-destructive">{errors.deposit_amount.message}</p>
        )}
      </div>

      <div className="pt-2">
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}
