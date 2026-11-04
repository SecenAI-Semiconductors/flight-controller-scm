const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

/**
 * Schema for POST /api/admin/inventory/movements
 *
 * Rules enforced here:
 *   - type must be receipt | issue | adjustment
 *   - quantity must be a positive integer (direction is encoded by `type` or `direction` for adjustments)
 *   - reference required for receipt and issue
 *   - reason required for adjustment
 *   - performedBy, quantityDelta MUST NOT be sent by the client (.strict() blocks them)
 */
const movementCreateSchema = z
  .object({
    type: z.enum(['receipt', 'issue', 'adjustment']),
    part: objectId,
    quantity: z.coerce
      .number({ invalid_type_error: 'quantity must be a number' })
      .int('quantity must be an integer')
      .positive('quantity must be greater than 0'),
    /** 'increase' or 'decrease' — used only for adjustment; ignored for receipt/issue */
    direction: z.enum(['increase', 'decrease']).optional(),
    lotNumber: z.string().max(100).optional().default(''),
    supplier: objectId.nullable().optional().default(null),
    reference: z.string().max(500).optional().default(''),
    reason: z.string().max(500).optional().default(''),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      (data.type === 'receipt' || data.type === 'issue') &&
      !data.reference?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reference'],
        message: 'reference is required for receipt and issue',
      });
    }
    if (data.type === 'adjustment' && !data.reason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reason'],
        message: 'reason is required for adjustment',
      });
    }
    if (data.type === 'adjustment' && !data.direction) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['direction'],
        message: 'direction (increase|decrease) is required for adjustment',
      });
    }
  });

module.exports = { movementCreateSchema };

