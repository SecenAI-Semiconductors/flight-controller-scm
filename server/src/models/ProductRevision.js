const mongoose = require('mongoose');

/**
 * ProductRevision — a hardware/firmware revision belonging to a Product.
 *
 * Lifecycle:  draft → released → obsolete
 *
 * Rules enforced at the controller layer:
 *  - BOM lines of a RELEASED revision cannot be edited.
 *  - Releasing sets releasedAt; it is never accepted from the client.
 *  - Only admin / quality may release or obsolete a revision.
 */
const productRevisionSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    label: {
      // Human-readable label, e.g. "V1", "V2", "Rev-B"
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    status: {
      type: String,
      enum: ['draft', 'released', 'obsolete'],
      default: 'draft',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000,
    },
    releasedAt: {
      // Set by the server when status transitions to 'released'.
      // NEVER accepted from the client.
      type: Date,
      default: null,
    },
    firmwareVersion: {
      // e.g. "1.2.0-rc1"; records the firmware revision linked to this BOM.
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    changeRequest: {
      // Engineering change request reference, e.g. "ECR-042".
      type: String,
      trim: true,
      default: '',
      maxlength: 200,
    },
    effectiveDate: {
      // Date from which this revision is considered effective.
      type: Date,
      default: null,
    },
    fileLinks: {
      // Up to 20 hyperlinks to design files, schematics, datasheets, etc.
      type: [
        {
          _id: false,
          label: { type: String, required: true, trim: true, maxlength: 200 },
          url: { type: String, required: true, trim: true, maxlength: 2000 },
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 20,
        message: 'A revision may have at most 20 file links',
      },
    },
    approver: {
      // Set server-side to req.user._id when releaseRevision is called.
      // NEVER accepted from the client (revisionCreateSchema / revisionUpdateSchema
      // use .strict() and do not include this field, so a client sending it gets 400).
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// A product cannot have two revisions with the same label
productRevisionSchema.index({ product: 1, label: 1 }, { unique: true });

module.exports = mongoose.model('ProductRevision', productRevisionSchema);
