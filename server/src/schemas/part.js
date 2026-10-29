const { z } = require('zod');

const partCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    partNumber: z
      .string()
      .min(1, 'Part number is required')
      .max(50)
      .regex(/^[A-Z0-9-]+$/i, 'Part number may only contain letters, digits and hyphens'),
    category: z.string().min(1, 'Category is required').max(100),
    description: z.string().max(2000).optional().default(''),
    unitOfMeasure: z.string().max(20).optional().default('pcs'),
    unitCost: z.coerce.number().min(0).optional().default(0),
    reorderPoint: z.coerce.number().int().min(0).optional().default(0),
    // Accept a Mongo ObjectId string or null/empty string (no supplier)
    preferredSupplier: z
      .string()
      .regex(/^[a-f\d]{24}$/i, 'Invalid supplier ID')
      .nullable()
      .optional()
      .default(null),
    notes: z.string().max(2000).optional().default(''),
  })
  .strict();

const partUpdateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    partNumber: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[A-Z0-9-]+$/i)
      .optional(),
    category: z.string().min(1).max(100).optional(),
    description: z.string().max(2000).optional(),
    unitOfMeasure: z.string().max(20).optional(),
    unitCost: z.coerce.number().min(0).optional(),
    reorderPoint: z.coerce.number().int().min(0).optional(),
    preferredSupplier: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .nullable()
      .optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

module.exports = { partCreateSchema, partUpdateSchema };
