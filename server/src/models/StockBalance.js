const mongoose = require('mongoose');

/**
 * StockBalance — a cached on-hand count per (part, lotNumber).
 *
 * This is NOT the source of truth (StockMovement is). It exists so that
 * concurrent issue operations can be serialised with an atomic conditional
 * update, preventing negative stock without application-level locks.
 *
 * Unique index on { part, lotNumber } ensures one balance doc per lot.
 */
const stockBalanceSchema = new mongoose.Schema(
  {
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true,
    },
    lotNumber: {
      type: String,
      trim: true,
      default: '',
    },
    /** Integer >= 0 */
    onHand: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

stockBalanceSchema.index({ part: 1, lotNumber: 1 }, { unique: true });

module.exports = mongoose.model('StockBalance', stockBalanceSchema);

