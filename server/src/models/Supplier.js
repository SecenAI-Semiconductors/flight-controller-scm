const mongoose = require('mongoose');

/**
 * Supplier master data.
 * Soft-deleted via `active: false` — records are never hard-deleted.
 */
const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      // Short unique reference used in POs and BOMs (e.g. "SUP-001")
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    leadTimeDays: {
      // Typical lead time from PO placement to delivery
      type: Number,
      min: 0,
      default: 0,
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
supplierSchema.index({ name: 'text', code: 'text', contactName: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);
