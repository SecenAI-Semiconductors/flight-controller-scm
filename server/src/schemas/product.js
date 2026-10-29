const { z } = require('zod');

const objectId = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const fileLinkSchema = z.object({
  label: z.string().min(1, 'File link label is required').max(200),
  url: z
    .string()
    .url('Must be a valid URL')
    .regex(/^https?:\/\//, 'URL must start with http:// or https://')
    .max(2000),
});

// Coerces a date string to Date; treats null / empty string as null.
const dateOrNull = z.preprocess(
  (v) => (v == null || v === '' ? null : v),
  z.coerce.date().nullable()
);

// ── Product ───────────────────────────────────────────────────────────────────

const productCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    sku: z
      .string()
      .min(1, 'SKU is required')
      .max(50)
      .regex(/^[A-Z0-9-]+$/i, 'SKU may only contain letters, digits and hyphens'),
    category: z.string().min(1, 'Category is required').max(100),
    variant: z.string().max(100).optional().default(''),
    description: z.string().max(2000).optional().default(''),
    status: z.enum(['draft', 'active', 'discontinued']).optional().default('draft'),
    // Storefront fields — accepted but not publicly wired yet
    price: z.coerce.number().min(0).nullable().optional().default(null),
    listingStatus: z.enum(['hidden', 'live']).optional().default('hidden'),
  })
  .strict();

const productUpdateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    sku: z
      .string()
      .min(1)
      .max(50)
      .regex(/^[A-Z0-9-]+$/i)
      .optional(),
    category: z.string().min(1).max(100).optional(),
    variant: z.string().max(100).optional(),
    description: z.string().max(2000).optional(),
    status: z.enum(['draft', 'active', 'discontinued']).optional(),
    price: z.coerce.number().min(0).nullable().optional(),
    listingStatus: z.enum(['hidden', 'live']).optional(),
  })
  .strict();

// ── ProductRevision ───────────────────────────────────────────────────────────
//
// NOTE: `approver` and `releasedAt` are NOT in either schema.
// Both schemas use .strict(), so any client request containing those fields
// is rejected with 400 before the controller is reached.

const revisionCreateSchema = z
  .object({
    label: z.string().min(1, 'Label is required').max(50),
    notes: z.string().max(2000).optional().default(''),
    firmwareVersion: z.string().max(100).optional().default(''),
    changeRequest: z.string().max(200).optional().default(''),
    effectiveDate: dateOrNull.optional().default(null),
    fileLinks: z.array(fileLinkSchema).max(20).optional().default([]),
    // approver / releasedAt are server-set — omitted intentionally
  })
  .strict();

const revisionUpdateSchema = z
  .object({
    // For DRAFT revisions: all fields below are editable.
    // For RELEASED/OBSOLETE revisions: only `notes` is editable.
    // The distinction is enforced in the controller (updateRevision), NOT here.
    label: z.string().min(1).max(50).optional(),
    notes: z.string().max(2000).optional(),
    firmwareVersion: z.string().max(100).optional(),
    changeRequest: z.string().max(200).optional(),
    effectiveDate: dateOrNull.optional(),
    fileLinks: z.array(fileLinkSchema).max(20).optional(),
    // approver / releasedAt are server-set — omitted intentionally
  })
  .strict();

// ── BomLine ───────────────────────────────────────────────────────────────────

const bomLineCreateSchema = z
  .object({
    part: objectId,
    quantity: z.coerce.number().positive('Quantity must be > 0'),
    referenceDesignators: z.string().max(500).optional().default(''),
    notes: z.string().max(1000).optional().default(''),
    supplier: objectId.nullable().optional().default(null),
    alternates: z.array(objectId).max(20).optional().default([]),
    // Business rules (no-duplicates, no-self) enforced in the controller
  })
  .strict();

const bomLineUpdateSchema = z
  .object({
    quantity: z.coerce.number().positive().optional(),
    referenceDesignators: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    supplier: objectId.nullable().optional(),
    alternates: z.array(objectId).max(20).optional(),
    // `part` cannot be changed — remove and re-add the line instead
  })
  .strict();

module.exports = {
  productCreateSchema,
  productUpdateSchema,
  revisionCreateSchema,
  revisionUpdateSchema,
  bomLineCreateSchema,
  bomLineUpdateSchema,
};
