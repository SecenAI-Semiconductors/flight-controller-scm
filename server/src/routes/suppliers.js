const { Router } = require('express');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const { supplierCreateSchema, supplierUpdateSchema } = require('../schemas/supplier');
const {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deactivateSupplier,
} = require('../controllers/suppliers');

const router = Router();

// Roles that may write (create / update / deactivate)
const WRITE_ROLES = ['admin', 'supply_chain'];
// All internal roles may read
const READ_ROLES = ['admin', 'supply_chain', 'warehouse', 'quality', 'sales'];

// ── Read ──────────────────────────────────────────────────────────────────────
router.get('/', requireRole(...READ_ROLES), listSuppliers);
router.get('/:id', requireRole(...READ_ROLES), getSupplier);

// ── Write ─────────────────────────────────────────────────────────────────────
router.post('/', requireRole(...WRITE_ROLES), validate(supplierCreateSchema), createSupplier);
router.patch('/:id', requireRole(...WRITE_ROLES), validate(supplierUpdateSchema), updateSupplier);
router.patch('/:id/deactivate', requireRole(...WRITE_ROLES), deactivateSupplier);

module.exports = router;
