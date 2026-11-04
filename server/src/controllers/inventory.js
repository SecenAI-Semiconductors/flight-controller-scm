const mongoose = require('mongoose');
const StockMovement = require('../models/StockMovement');
const StockBalance = require('../models/StockBalance');
const { processMovement } = require('../services/inventory');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

// ── POST /movements ───────────────────────────────────────────────────────────

async function postMovement(req, res) {
  const { type, part, quantity, direction, lotNumber, supplier, reference, reason } =
    req.body;

  // For adjustments, derive signed quantity from direction
  let signedQty = quantity;
  if (type === 'adjustment') {
    signedQty = direction === 'decrease' ? -quantity : quantity;
  }

  const { movement, balance } = await processMovement({
    type,
    partId: part,
    quantity: signedQty,
    lotNumber: lotNumber || '',
    supplierId: supplier || null,
    reference: reference || '',
    reason: reason || '',
    performedBy: req.user.userId,
  });

  res.status(201).json({ movement, balance });
}

// ── GET /stock ────────────────────────────────────────────────────────────────

async function getStock(req, res) {
  const { page, limit, search, sortBy, sortOrder } = parsePagination(req.query);

  // Build a Part match filter for search
  let partFilter = {};
  if (search) {
    partFilter = {
      $or: [
        { 'partInfo.partNumber': { $regex: search, $options: 'i' } },
        { 'partInfo.name': { $regex: search, $options: 'i' } },
      ],
    };
  }

  // Aggregate: group StockBalance by part, compute totals, join Part info
  const pipeline = [
    {
      $group: {
        _id: '$part',
        totalOnHand: { $sum: '$onHand' },
        lots: {
          $push: {
            lotNumber: '$lotNumber',
            onHand: '$onHand',
          },
        },
      },
    },
    {
      $lookup: {
        from: 'parts',
        localField: '_id',
        foreignField: '_id',
        as: 'partInfo',
      },
    },
    { $unwind: { path: '$partInfo', preserveNullAndEmptyArrays: false } },
    // Only include parts that still exist
    ...(search ? [{ $match: partFilter }] : []),
    {
      $project: {
        _id: 0,
        partId: '$_id',
        partNumber: '$partInfo.partNumber',
        name: '$partInfo.name',
        unitOfMeasure: '$partInfo.unitOfMeasure',
        active: '$partInfo.active',
        totalOnHand: 1,
        lots: {
          $filter: {
            input: '$lots',
            as: 'l',
            cond: { $gt: ['$$l.onHand', 0] },
          },
        },
      },
    },
  ];

  // Sorting
  const sortField = sortBy === 'totalOnHand' ? 'totalOnHand' : 'partNumber';
  const sortDir = sortOrder === 'asc' ? 1 : -1;
  pipeline.push({ $sort: { [sortField]: sortDir } });

  // Count then paginate
  const countPipeline = [...pipeline, { $count: 'total' }];
  const [countResult, rows] = await Promise.all([
    StockBalance.aggregate(countPipeline),
    StockBalance.aggregate([
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]),
  ]);

  const total = countResult[0]?.total ?? 0;
  res.json(paginatedResponse(rows, total, page, limit));
}

// ── GET /parts/:partId/movements ──────────────────────────────────────────────

async function getPartMovements(req, res) {
  const { partId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(partId)) {
    const err = new Error('Invalid part ID');
    err.statusCode = 400;
    err.code = 'INVALID_ID';
    throw err;
  }

  const { page, limit } = parsePagination(req.query);

  const [movements, total] = await Promise.all([
    StockMovement.find({ part: partId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('performedBy', 'email')
      .populate('supplier', 'code name')
      .lean(),
    StockMovement.countDocuments({ part: partId }),
  ]);

  res.json(paginatedResponse(movements, total, page, limit));
}

module.exports = { postMovement, getStock, getPartMovements };

