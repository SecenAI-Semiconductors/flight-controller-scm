/**
 * requireRole(...roles)
 *
 * Factory that returns an Express middleware which passes only when
 * req.user.role is in the supplied whitelist.
 *
 * MUST be used after the `auth` middleware (which sets req.user).
 *
 * Usage:
 *   router.get('/secret', auth, requireRole('admin', 'supply_chain'), handler);
 *
 * Notes:
 *  - `customer` is never in any admin whitelist — this is enforced here AND
 *    by never mounting customer routes under /api/admin/*.
 *  - Returns 403 (not 401) so the client knows the user IS authenticated
 *    but lacks permission.
 */
function requireRole(...roles) {
  if (roles.length === 0) {
    throw new Error('requireRole() must receive at least one role');
  }

  return function (req, res, next) {
    // auth middleware must have already run
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource',
        },
      });
    }

    next();
  };
}

module.exports = requireRole;
