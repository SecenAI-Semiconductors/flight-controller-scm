/**
 * Creates Express middleware that validates req[source] against a zod schema.
 * On success, replaces req[source] with the parsed (coerced/defaulted) data.
 * On failure, returns 400 with structured error details.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.flatten(),
        },
      });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
