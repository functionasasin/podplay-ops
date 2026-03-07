import { useForm } from 'react-hook-form';
import type { UseFormProps, FieldValues, FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { $ZodType } from 'zod/v4/core';

export function useZodForm<T extends FieldValues>(
  schema: $ZodType<T, T>,
  options?: Omit<UseFormProps<T>, 'resolver'>,
) {
  return useForm<T>({
    ...options,
    resolver: zodResolver(schema),
  });
}

export function getFieldErrorMessage(error: FieldError | undefined): string | undefined {
  return error?.message;
}
