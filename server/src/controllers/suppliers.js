const Supplier = require('../models/Supplier');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

// ── List ─────────────────────────────────────────────────────────────────────
async function listSuppliers(req, res) {
  const { page, limit, search, sortBy, sortOrder } = parsePagination(req.query);

  const filter = {};
  if (search) {
    filter.$text = { $search: search };
  }

  const sort = sortBy ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 };

  const [data, total] = await Promise.all([
    Supplier.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Supplier.countDocuments(filter),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}

// ── Get one ───────────────────────────────────────────────────────────────────
async function getSupplier(req, res) {
  const supplier = await Supplier.findById(req.params.id).lean();
  if (!supplier) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Supplier not found' },
    });
  }
  res.json(supplier);
}

// ── Create ────────────────────────────────────────────────────────────────────
async function createSupplier(req, res) {
  // body already validated + stripped by validate() middleware
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
}

// ── Update ────────────────────────────────────────────────────────────────────
async function updateSupplier(req, res) {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!supplier) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Supplier not found' },
    });
  }
  res.json(supplier);
}

// ── Deactivate (soft-delete) ──────────────────────────────────────────────────
async function deactivateSupplier(req, res) {
  const supplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    { $set: { active: false } },
    { new: true }
  ).lean();

  if (!supplier) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Supplier not found' },
    });
  }
  res.json(supplier);
}

module.exports = { listSuppliers, getSupplier, createSupplier, updateSupplier, deactivateSupplier };
