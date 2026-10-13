const rateLimit = require('express-rate-limit');

/** Strict rate limit for the login endpoint: 5 requests per minute per IP. */
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Lenient global rate limit: 100 requests per minute per IP. */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, globalLimiter };
