const mongoose = require('mongoose');

/**
 * Part (component) master data.
 * Every part may reference a preferred supplier.
 * Soft-deleted via `active: false`.
 */
const partSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    partNumber: {
      // Unique internal part number (e.g. "FC-CAP-001")
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      // High-level grouping (e.g. "Capacitor", "MCU", "Connector")
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    unitOfMeasure: {
      // "pcs", "metres", "kg", etc.
      type: String,
      trim: true,
      default: 'pcs',
    },
    unitCost: {
      // Cost in USD
      type: Number,
      min: 0,
      default: 0,
    },
    reorderPoint: {
      // Trigger a replenishment PO when stock falls below this quantity
      type: Number,
      min: 0,
      default: 0,
    },
    preferredSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Text index for search
partSchema.index({ name: 'text', partNumber: 'text', category: 'text' });

module.exports = mongoose.model('Part', partSchema);
