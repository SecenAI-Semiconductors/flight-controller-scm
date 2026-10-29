const { Router } = require('express');
const requireRole = require('../middleware/requireRole');
const validate = require('../middleware/validate');
const {
  productCreateSchema,
  productUpdateSchema,
  revisionCreateSchema,
  revisionUpdateSchema,
  bomLineCreateSchema,
  bomLineUpdateSchema,
} = require('../schemas/product');
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deactivateProduct,
  listRevisions,
  getRevision,
  createRevision,
  updateRevision,
  releaseRevision,
  forkRevision,
  listBomLines,
  addBomLine,
  updateBomLine,
  removeBomLine,
} = require('../controllers/products');

const router = Router();

// ── Role constants ─────────────────────────────────────────────────────────────
// Write: admin + quality (per requirements: "admin and quality can write")
const WRITE_ROLES = ['admin', 'quality'];
// Read: all internal roles
const READ_ROLES = ['admin', 'quality', 'supply_chain', 'warehouse', 'sales'];

// ── Products ──────────────────────────────────────────────────────────────────
router.get('/', requireRole(...READ_ROLES), listProducts);
router.get('/:id', requireRole(...READ_ROLES), getProduct);
router.post('/', requireRole(...WRITE_ROLES), validate(productCreateSchema), createProduct);
router.patch('/:id', requireRole(...WRITE_ROLES), validate(productUpdateSchema), updateProduct);
router.patch('/:id/deactivate', requireRole(...WRITE_ROLES), deactivateProduct);

// ── Revisions ─────────────────────────────────────────────────────────────────
router.get('/:id/revisions', requireRole(...READ_ROLES), listRevisions);
router.get('/:id/revisions/:revId', requireRole(...READ_ROLES), getRevision);
router.post('/:id/revisions', requireRole(...WRITE_ROLES), validate(revisionCreateSchema), createRevision);
router.patch('/:id/revisions/:revId', requireRole(...WRITE_ROLES), validate(revisionUpdateSchema), updateRevision);
router.patch('/:id/revisions/:revId/release', requireRole(...WRITE_ROLES), releaseRevision);

// Fork (create new revision from an existing one, copying its BOM)
// Reuses revisionCreateSchema: only label + notes needed
router.post('/:id/revisions/:revId/fork', requireRole(...WRITE_ROLES), validate(revisionCreateSchema), forkRevision);

// ── BOM lines ─────────────────────────────────────────────────────────────────
router.get('/:id/revisions/:revId/bom', requireRole(...READ_ROLES), listBomLines);
router.post('/:id/revisions/:revId/bom', requireRole(...WRITE_ROLES), validate(bomLineCreateSchema), addBomLine);
router.patch('/:id/revisions/:revId/bom/:lineId', requireRole(...WRITE_ROLES), validate(bomLineUpdateSchema), updateBomLine);
router.delete('/:id/revisions/:revId/bom/:lineId', requireRole(...WRITE_ROLES), removeBomLine);

module.exports = router;
