const Part = require('../models/Part');
const Supplier = require('../models/Supplier');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

// ── List ─────────────────────────────────────────────────────────────────────
async function listParts(req, res) {
  const { page, limit, search, sortBy, sortOrder } = parsePagination(req.query);

  const filter = {};
  if (search) {
    filter.$text = { $search: search };
  }

  const sort = sortBy ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 };

  const [data, total] = await Promise.all([
    Part.find(filter)
      .populate('preferredSupplier', 'name code')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Part.countDocuments(filter),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}

// ── Get one ───────────────────────────────────────────────────────────────────
async function getPart(req, res) {
  const part = await Part.findById(req.params.id)
    .populate('preferredSupplier', 'name code')
    .lean();

  if (!part) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Part not found' },
    });
  }
  res.json(part);
}

// ── Create ────────────────────────────────────────────────────────────────────
async function createPart(req, res) {
  // If a supplier is specified, verify it exists and is active
  if (req.body.preferredSupplier) {
    const supplier = await Supplier.findById(req.body.preferredSupplier).lean();
    if (!supplier || !supplier.active) {
      return res.status(400).json({
        error: { code: 'INVALID_REFERENCE', message: 'Preferred supplier not found or inactive' },
      });
    }
  }

  const part = await Part.create(req.body);
  const populated = await part.populate('preferredSupplier', 'name code');
  res.status(201).json(populated);
}

// ── Update ────────────────────────────────────────────────────────────────────
async function updatePart(req, res) {
  // Verify the referenced supplier if it is being changed
  if (req.body.preferredSupplier) {
    const supplier = await Supplier.findById(req.body.preferredSupplier).lean();
    if (!supplier || !supplier.active) {
      return res.status(400).json({
        error: { code: 'INVALID_REFERENCE', message: 'Preferred supplier not found or inactive' },
      });
    }
  }

  const part = await Part.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  )
    .populate('preferredSupplier', 'name code')
    .lean();

  if (!part) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Part not found' },
    });
  }
  res.json(part);
}

// ── Deactivate (soft-delete) ──────────────────────────────────────────────────
async function deactivatePart(req, res) {
  const part = await Part.findByIdAndUpdate(
    req.params.id,
    { $set: { active: false } },
    { new: true }
  ).lean();

  if (!part) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Part not found' },
    });
  }
  res.json(part);
}

module.exports = { listParts, getPart, createPart, updatePart, deactivatePart };
