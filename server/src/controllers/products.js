const Product = require('../models/Product');
const ProductRevision = require('../models/ProductRevision');
const BomLine = require('../models/BomLine');
const Part = require('../models/Part');
const Supplier = require('../models/Supplier');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

// ── List ──────────────────────────────────────────────────────────────────────
async function listProducts(req, res) {
  const { page, limit, search, sortBy, sortOrder } = parsePagination(req.query);

  const filter = {};
  if (search) {
    filter.$text = { $search: search };
  }

  const sort = sortBy ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 };

  const [data, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}

// ── Get one ───────────────────────────────────────────────────────────────────
async function getProduct(req, res) {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }
  res.json(product);
}

// ── Create ────────────────────────────────────────────────────────────────────
async function createProduct(req, res) {
  const product = await Product.create(req.body);
  res.status(201).json(product);
}

// ── Update ────────────────────────────────────────────────────────────────────
async function updateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).lean();

  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }
  res.json(product);
}

// ── Deactivate (soft-delete) ──────────────────────────────────────────────────
async function deactivateProduct(req, res) {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $set: { active: false } },
    { new: true }
  ).lean();

  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }
  res.json(product);
}

// ── List revisions ────────────────────────────────────────────────────────────
async function listRevisions(req, res) {
  const { page, limit, sortBy, sortOrder } = parsePagination(req.query);

  const productId = req.params.id;
  const product = await Product.findById(productId).lean();
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }

  const filter = { product: productId };
  const sort = sortBy ? { [sortBy]: sortOrder === 'asc' ? 1 : -1 } : { createdAt: -1 };

  const [data, total] = await Promise.all([
    ProductRevision.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    ProductRevision.countDocuments(filter),
  ]);

  res.json(paginatedResponse(data, total, page, limit));
}

// ── Get one revision (with BOM + cost rollup) ─────────────────────────────────
async function getRevision(req, res) {
  const revision = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  })
    .populate('approver', 'email role')
    .lean();

  if (!revision) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Revision not found' } });
  }

  // Fetch BOM lines with part details for cost rollup
  const lines = await BomLine.find({ revision: revision._id })
    .populate('part', 'partNumber name unitCost unitOfMeasure')
    .populate('supplier', 'code name')
    .populate('alternates', 'partNumber name')
    .lean();

  let totalCost = 0;
  const missingCostParts = [];

  const enrichedLines = lines.map((line) => {
    const unitCost = line.part?.unitCost ?? null;
    if (unitCost == null || unitCost === 0) {
      missingCostParts.push(line.part?.partNumber ?? String(line.part));
    } else {
      totalCost += unitCost * line.quantity;
    }
    return { ...line, lineCost: unitCost != null ? unitCost * line.quantity : null };
  });

  res.json({
    ...revision,
    bomLines: enrichedLines,
    costRollup: {
      totalCost: parseFloat(totalCost.toFixed(4)),
      missingCostParts,
    },
  });
}

// ── Create revision ───────────────────────────────────────────────────────────
async function createRevision(req, res) {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
  }

  const revision = await ProductRevision.create({
    product: req.params.id,
    label: req.body.label,
    notes: req.body.notes ?? '',
    firmwareVersion: req.body.firmwareVersion ?? '',
    changeRequest: req.body.changeRequest ?? '',
    effectiveDate: req.body.effectiveDate ?? null,
    fileLinks: req.body.fileLinks ?? [],
  });

  res.status(201).json(revision);
}

// ── Update revision (draft: all fields; released/obsolete: notes only) ────────
async function updateRevision(req, res) {
  const revision = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  });

  if (!revision) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Revision not found' } });
  }

  // ── Frozen-field enforcement ───────────────────────────────────────────────
  // Once a revision leaves draft status, the following fields are immutable.
  // Only `notes` may still be patched on a released or obsolete revision.
  // This check runs AFTER Zod validation, so `approver` and `releasedAt` have
  // already been rejected by the .strict() schema before we ever reach here.
  if (revision.status !== 'draft') {
    const FROZEN_FIELDS = ['label', 'firmwareVersion', 'changeRequest', 'effectiveDate', 'fileLinks'];
    const attempted = Object.keys(req.body).filter((k) => FROZEN_FIELDS.includes(k));
    if (attempted.length > 0) {
      return res.status(409).json({
        error: {
          code: 'FROZEN',
          message: `Cannot edit frozen fields on a ${revision.status} revision: ${attempted.join(', ')}. Only 'notes' may be updated.`,
        },
      });
    }
    // Allow notes-only update
    if (req.body.notes !== undefined) {
      revision.notes = req.body.notes;
      await revision.save();
    }
    return res.json(revision.toObject());
  }

  // Draft: all schema-allowed fields can be edited
  Object.assign(revision, req.body);
  await revision.save();
  res.json(revision.toObject());
}

// ── Release revision ──────────────────────────────────────────────────────────
async function releaseRevision(req, res) {
  const revision = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  });

  if (!revision) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Revision not found' } });
  }
  if (revision.status !== 'draft') {
    return res.status(409).json({
      error: { code: 'ALREADY_RELEASED', message: 'Revision is not in draft status' },
    });
  }

  revision.status = 'released';
  revision.releasedAt = new Date();
  revision.approver = req.user.userId; // server-set; never accepted from client
  await revision.save();
  res.json(revision.toObject());
}

// ── Fork revision (new revision copying BOM lines from an existing one) ───────
async function forkRevision(req, res) {
  const source = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  });

  if (!source) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Source revision not found' } });
  }

  const newRevision = await ProductRevision.create({
    product: req.params.id,
    label: req.body.label,
    notes: req.body.notes ?? `Forked from ${source.label}`,
    firmwareVersion: req.body.firmwareVersion ?? '',
    changeRequest: req.body.changeRequest ?? '',
    effectiveDate: req.body.effectiveDate ?? null,
    fileLinks: req.body.fileLinks ?? [],
  });

  // Copy BOM lines
  const sourceLines = await BomLine.find({ revision: source._id }).lean();
  if (sourceLines.length > 0) {
    const newLines = sourceLines.map(({ _id, revision, createdAt, updatedAt, __v, ...rest }) => ({
      ...rest,
      revision: newRevision._id,
    }));
    await BomLine.insertMany(newLines);
  }

  // Return the new revision with BOM
  const lines = await BomLine.find({ revision: newRevision._id })
    .populate('part', 'partNumber name unitCost unitOfMeasure')
    .lean();

  res.status(201).json({ ...newRevision.toObject(), bomLines: lines });
}

// ── BOM line: list ────────────────────────────────────────────────────────────
async function listBomLines(req, res) {
  const revision = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  }).lean();

  if (!revision) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Revision not found' } });
  }

  const lines = await BomLine.find({ revision: revision._id })
    .populate('part', 'partNumber name unitCost unitOfMeasure category')
    .populate('supplier', 'code name')
    .populate('alternates', 'partNumber name')
    .lean();

  res.json(lines);
}

// ── BOM line: add ─────────────────────────────────────────────────────────────
async function addBomLine(req, res) {
  const revision = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  });

  if (!revision) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Revision not found' } });
  }
  if (revision.status !== 'draft') {
    return res.status(409).json({
      error: { code: 'NOT_EDITABLE', message: 'BOM lines of a released revision cannot be edited. Create a new revision instead.' },
    });
  }

  // Validate primary part
  const part = await Part.findById(req.body.part).lean();
  if (!part || !part.active) {
    return res.status(400).json({
      error: { code: 'INVALID_REFERENCE', message: 'Part not found or inactive' },
    });
  }

  // Validate supplier if provided
  if (req.body.supplier) {
    const supplier = await Supplier.findById(req.body.supplier).lean();
    if (!supplier || !supplier.active) {
      return res.status(400).json({
        error: { code: 'INVALID_REFERENCE', message: 'Supplier not found or inactive' },
      });
    }
  }

  // Validate alternates: no duplicates, cannot include the primary part
  const alternates = req.body.alternates ?? [];
  if (new Set(alternates).size !== alternates.length) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Alternates cannot contain duplicate parts' },
    });
  }
  if (alternates.some((id) => id.toString() === req.body.part.toString())) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Alternates cannot include the primary part' },
    });
  }

  const line = await BomLine.create({
    revision: revision._id,
    part: req.body.part,
    quantity: req.body.quantity,
    referenceDesignators: req.body.referenceDesignators ?? '',
    notes: req.body.notes ?? '',
    supplier: req.body.supplier ?? null,
    alternates: req.body.alternates ?? [],
  });

  await line.populate([
    { path: 'part', select: 'partNumber name unitCost unitOfMeasure category' },
    { path: 'supplier', select: 'code name' },
    { path: 'alternates', select: 'partNumber name' },
  ]);
  res.status(201).json(line);
}

// ── BOM line: update ──────────────────────────────────────────────────────────
async function updateBomLine(req, res) {
  const revision = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  });

  if (!revision) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Revision not found' } });
  }
  if (revision.status !== 'draft') {
    return res.status(409).json({
      error: { code: 'NOT_EDITABLE', message: 'BOM lines of a released revision cannot be edited. Create a new revision instead.' },
    });
  }

  // Validate supplier if being changed
  if (req.body.supplier) {
    const supplier = await Supplier.findById(req.body.supplier).lean();
    if (!supplier || !supplier.active) {
      return res.status(400).json({
        error: { code: 'INVALID_REFERENCE', message: 'Supplier not found or inactive' },
      });
    }
  }

  // If alternates are provided, validate them against the line's existing part
  if (req.body.alternates !== undefined) {
    const existingLine = await BomLine.findOne({
      _id: req.params.lineId,
      revision: revision._id,
    }).lean();
    if (!existingLine) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'BOM line not found' } });
    }
    const ownPartId = existingLine.part.toString();
    const alts = req.body.alternates;
    if (new Set(alts).size !== alts.length) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Alternates cannot contain duplicate parts' },
      });
    }
    if (alts.some((id) => id.toString() === ownPartId)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Alternates cannot include the primary part' },
      });
    }
  }

  const line = await BomLine.findOneAndUpdate(
    { _id: req.params.lineId, revision: revision._id },
    { $set: req.body },
    { new: true, runValidators: true }
  )
    .populate('part', 'partNumber name unitCost unitOfMeasure category')
    .populate('supplier', 'code name')
    .populate('alternates', 'partNumber name');

  if (!line) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'BOM line not found' } });
  }
  res.json(line);
}

// ── BOM line: remove ──────────────────────────────────────────────────────────
async function removeBomLine(req, res) {
  const revision = await ProductRevision.findOne({
    _id: req.params.revId,
    product: req.params.id,
  });

  if (!revision) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Revision not found' } });
  }
  if (revision.status !== 'draft') {
    return res.status(409).json({
      error: { code: 'NOT_EDITABLE', message: 'BOM lines of a released revision cannot be edited. Create a new revision instead.' },
    });
  }

  const line = await BomLine.findOneAndDelete({ _id: req.params.lineId, revision: revision._id });
  if (!line) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'BOM line not found' } });
  }
  res.json({ message: 'BOM line removed' });
}

module.exports = {
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
};
