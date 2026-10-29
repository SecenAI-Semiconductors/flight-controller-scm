const { z } = require('zod');

const supplierCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    code: z
      .string()
      .min(1, 'Code is required')
      .max(20)
      .regex(/^[A-Z0-9-]+$/i, 'Code may only contain letters, digits and hyphens'),
    contactName: z.string().max(200).optional().default(''),
    email: z.string().email('Invalid email').or(z.literal('')).optional().default(''),
    phone: z.string().max(50).optional().default(''),
    country: z.string().max(100).optional().default(''),
    leadTimeDays: z.coerce.number().int().min(0).optional().default(0),
    notes: z.string().max(2000).optional().default(''),
  })
  .strict();

const supplierUpdateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    code: z
      .string()
      .min(1)
      .max(20)
      .regex(/^[A-Z0-9-]+$/i)
      .optional(),
    contactName: z.string().max(200).optional(),
    email: z.string().email().or(z.literal('')).optional(),
    phone: z.string().max(50).optional(),
    country: z.string().max(100).optional(),
    leadTimeDays: z.coerce.number().int().min(0).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

module.exports = { supplierCreateSchema, supplierUpdateSchema };
