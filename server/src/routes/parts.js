const { Router } = require('express');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { partCreateSchema, partUpdateSchema } = require('../schemas/part');
const {
  listParts,
  getPart,
  createPart,
  updatePart,
  deactivatePart,
} = require('../controllers/parts');

const router = Router();

// Roles that may write (create / update / deactivate)
const WRITE_ROLES = ['admin', 'supply_chain'];
// All internal roles may read
const READ_ROLES = ['admin', 'supply_chain', 'warehouse', 'quality', 'sales'];

// ── Read ──────────────────────────────────────────────────────────────────────
router.get('/', requireRole(...READ_ROLES), listParts);
router.get('/:id', requireRole(...READ_ROLES), getPart);

// ── Write ─────────────────────────────────────────────────────────────────────
router.post('/', requireRole(...WRITE_ROLES), validate(partCreateSchema), createPart);
router.patch('/:id', requireRole(...WRITE_ROLES), validate(partUpdateSchema), updatePart);
router.patch('/:id/deactivate', requireRole(...WRITE_ROLES), deactivatePart);

module.exports = router;
