import { z } from 'zod';

// WasmResultSchema factory — wraps any data schema in the ok/error envelope
export function WasmResultSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.discriminatedUnion('ok', [
    z.object({ ok: z.literal(true), data: dataSchema }),
    z.object({
      ok: z.literal(false),
      errors: z.array(
        z.object({
          code: z.string(),
          message: z.string(),
          field: z.string().nullable().optional(),
        })
      ),
    }),
  ]);
}
