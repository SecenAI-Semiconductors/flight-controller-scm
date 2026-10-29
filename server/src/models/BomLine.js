const mongoose = require('mongoose');

/**
 * BomLine — one line in a Bill of Materials for a ProductRevision.
 *
 * Design choice: separate collection (not embedded array) because:
 *  1. Individual lines are added/removed/edited independently — separate
 *     documents avoid full-document rewrites on every change.
 *  2. The unique compound index (revision + part) is simpler on a
 *     collection than inside an embedded array.
 *  3. Populating part.unitCost for the cost rollup is a clean $lookup /
 *     .populate() with no extra aggregation gymnastics.
 *
 * Rules enforced at the controller layer:
 *  - A part may appear only once per revision (compound unique index below).
 *  - Lines belonging to a RELEASED revision are read-only.
 */
const bomLineSchema = new mongoose.Schema(
  {
    revision: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductRevision',
      required: true,
      index: true,
    },
    part: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.001, 'Quantity must be greater than 0'],
    },
    referenceDesignators: {
      // Free-text, e.g. "C1, C2, C5"
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    supplier: {
      // Optional preferred/approved supplier for this component on this BOM line.
      // Uniqueness and deduplication enforced at the controller layer.
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    alternates: {
      // Approved alternate parts that can substitute for the primary part.
      // Rules enforced at the controller layer:
      //  - No duplicates within the array.
      //  - Cannot include the line's own `part`.
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Part' }],
      default: [],
    },
  },
  { timestamps: true }
);

// A part can appear only once per revision
bomLineSchema.index({ revision: 1, part: 1 }, { unique: true });

module.exports = mongoose.model('BomLine', bomLineSchema);
