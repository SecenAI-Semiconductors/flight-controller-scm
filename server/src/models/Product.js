const mongoose = require('mongoose');

/**
 * Product master data.
 * A Product is the top-level entity (e.g. "FC-X1 Flight Controller").
 * Revisions and BOMs hang off ProductRevision / BomLine.
 *
 * Storefront fields (price, listingStatus) are persisted now but
 * the public API endpoint is NOT wired yet (Phase 2).
 *
 * Soft-deleted via `active: false`.
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    sku: {
      // Unique product identifier (e.g. "FC-X1")
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50,
    },
    category: {
      // High-level grouping (e.g. "Flight Controller", "Sensor Module")
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    variant: {
      // Optional variant suffix (e.g. "Lite", "Pro", "GPS Edition")
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'discontinued'],
      default: 'draft',
    },
    active: {
      type: Boolean,
      default: true,
    },

    // ── Future storefront fields (not exposed via public API yet) ─────────
    price: {
      // Retail price in USD; null = unpriced
      type: Number,
      min: 0,
      default: null,
    },
    listingStatus: {
      type: String,
      enum: ['hidden', 'live'],
      default: 'hidden',
    },
  },
  { timestamps: true }
);

// Text index for search
productSchema.index({ name: 'text', sku: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
