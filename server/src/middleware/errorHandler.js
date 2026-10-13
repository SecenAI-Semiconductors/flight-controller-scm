/**
 * Global error handler.
 * - Never returns password hashes, secrets or stack traces.
 * - Does not log request bodies (they may contain customer contact details).
 */
function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${err.name || 'Error'}: ${err.message}`);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message },
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'unknown';
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: `Duplicate value for field: ${field}` },
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'INVALID_ID', message: 'Invalid ID format' },
    });
  }

  // Application errors with statusCode
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'Internal server error' : err.message,
    },
  });
}

module.exports = errorHandler;
