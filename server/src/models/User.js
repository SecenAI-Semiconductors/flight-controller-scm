const mongoose = require('mongoose');

/**
 * Internal roles map to SCM dashboard areas.
 * `customer` is reserved for the public storefront (Phase 2)
 * and is explicitly excluded from all /api/admin/* routes.
 */
const ROLES = [
  'admin',           // super-user: full access
  'supply_chain',    // procurement & supplier management
  'warehouse',       // inventory & stock operations
  'quality',         // QC, product lifecycle, warranty
  'sales',           // orders, sales channels, support
  'customer',        // public storefront only (Phase 2)
];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: 'customer',
    },
  },
  { timestamps: true }
);

// Never return the password hash
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
