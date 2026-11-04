const { Router } = require('express');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { movementCreateSchema } = require('../schemas/inventory');
const { postMovement, getStock, getPartMovements } = require('../controllers/inventory');

const router = Router();

const READ_ROLES = ['admin', 'supply_chain', 'warehouse', 'quality'];
const WRITE_ROLES = ['admin', 'warehouse'];

// All inventory routes require at least READ access
router.use(requireRole(...READ_ROLES));

// ── Write routes ──────────────────────────────────────────────────────────────
router.post('/movements', requireRole(...WRITE_ROLES), validate(movementCreateSchema), postMovement);

// ── Read routes ───────────────────────────────────────────────────────────────
router.get('/stock', getStock);
router.get('/parts/:partId/movements', getPartMovements);

module.exports = router;

