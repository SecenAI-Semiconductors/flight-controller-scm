const { z } = require('zod');

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Parse and validate pagination query parameters.
 * @param {object} query - req.query object
 * @returns {{ page: number, limit: number, search?: string, sortBy?: string, sortOrder: 'asc' | 'desc' }}
 */
function parsePagination(query) {
  return paginationSchema.parse(query);
}

/**
 * Wrap a data array with pagination metadata.
 * @param {Array} data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 */
function paginatedResponse(data, total, page, limit) {
  return {
    data,
    meta: { page, limit, total },
  };
}

module.exports = { parsePagination, paginatedResponse, paginationSchema };
