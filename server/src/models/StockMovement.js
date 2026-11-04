const mongoose = require('mongoose');

/**
 * StockMovement — the APPEND-ONLY ledger for component stock.
 * Every stock change is recorded here. Never update or delete rows.
 * Pre-hooks enforce immutability at the Mongoose layer.
 */
const stockMovementSchema = new mongoose.Schema(
  {
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['receipt', 'issue', 'adjustment'],
      required: true,
    },
    /** Signed integer — server-computed, never 0 */
    quantityDelta: {
      type: Number,
      required: true,
    },
    lotNumber: {
      type: String,
      trim: true,
      default: '',
    },
    /** Only set for receipts */
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    /** Required for receipt and issue */
    reference: {
      type: String,
      trim: true,
      default: '',
    },
    /** Required for adjustments */
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    /** Set server-side from req.user.userId — never from client */
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────
stockMovementSchema.index({ part: 1, createdAt: -1 });
stockMovementSchema.index({ createdAt: -1 });

// ── Immutability pre-hooks ────────────────────────────────────────────────────

stockMovementSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('StockMovement is immutable: updates are not allowed'));
  }
  next();
});

const BLOCKED_OPS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndDelete',
  'deleteOne',
  'deleteMany',
  'replaceOne',
];

BLOCKED_OPS.forEach((op) => {
  stockMovementSchema.pre(op, function () {
    throw new Error(`StockMovement is immutable: ${op} is not allowed`);
  });
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);

