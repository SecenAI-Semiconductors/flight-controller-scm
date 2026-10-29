const { z } = require('zod');

/**
 * Login request body.
 * .strict() rejects any extra fields (e.g. role, admin) with a 400.
 * The server always determines the role from the database — the client
 * cannot supply or override it.
 */
const loginSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

module.exports = { loginSchema };
