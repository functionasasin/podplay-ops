import { z } from 'zod';

export const PesoSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid peso amount');
export const ISODateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
export const TaxYearSchema = z.number().int().min(2018).max(2030);
