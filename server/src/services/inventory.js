const mongoose = require('mongoose');
const Part = require('../models/Part');
const StockMovement = require('../models/StockMovement');
const StockBalance = require('../models/StockBalance');

/**
 * processMovement({ type, partId, quantity, lotNumber, supplierId, reference, reason, performedBy })
 *
 * Single write-path for all three movement types. Runs inside a Mongoose
 * transaction so the ledger row and the balance update are atomic.
 *
 * @param {object} opts
 * @param {'receipt'|'issue'|'adjustment'} opts.type
 * @param {string}  opts.partId       - Part ObjectId string
 * @param {number}  opts.quantity     - Positive integer (API contract)
 * @param {string}  [opts.lotNumber='']
 * @param {string}  [opts.supplierId] - Supplier ObjectId string (receipt only)
 * @param {string}  [opts.reference='']
 * @param {string}  [opts.reason='']
 * @param {string}  opts.performedBy  - User ObjectId string (server-set)
 * @returns {{ movement: StockMovement, balance: StockBalance }}
 */
async function processMovement({
  type,
  partId,
  quantity,
  lotNumber = '',
  supplierId = null,
  reference = '',
  reason = '',
  performedBy,
}) {
  // ── 1. Validate part exists and is active ────────────────────────────────
  const part = await Part.findById(partId).lean();
  if (!part) {
    const err = new Error('Part not found');
    err.statusCode = 404;
    err.code = 'PART_NOT_FOUND';
    throw err;
  }
  if (!part.active) {
    const err = new Error('Cannot record stock movement for an inactive part');
    err.statusCode = 409;
    err.code = 'PART_INACTIVE';
    throw err;
  }

  // ── 2. Start a Mongoose session / transaction ─────────────────────────────
  const session = await mongoose.startSession();

  let movement;
  let balance;

  try {
    await session.withTransaction(async () => {
      if (type === 'receipt') {
        // ── Receipt: increase stock ─────────────────────────────────────────
        balance = await StockBalance.findOneAndUpdate(
          { part: partId, lotNumber },
          { $inc: { onHand: quantity } },
          { upsert: true, new: true, session }
        );
        [movement] = await StockMovement.create(
          [
            {
              part: partId,
              type,
              quantityDelta: +quantity,
              lotNumber,
              supplier: supplierId || null,
              reference,
              reason,
              performedBy,
            },
          ],
          { session }
        );
      } else if (type === 'issue') {
        // ── Issue: decrease stock (atomic guard against negative) ───────────
        balance = await StockBalance.findOneAndUpdate(
          { part: partId, lotNumber, onHand: { $gte: quantity } },
          { $inc: { onHand: -quantity } },
          { new: true, session }
        );
        if (!balance) {
          // Fetch current balance for informative error
          const current = await StockBalance.findOne(
            { part: partId, lotNumber },
            'onHand',
            { session }
          ).lean();
          const available = current ? current.onHand : 0;
          const err = new Error(
            `Insufficient stock. Requested ${quantity}, available ${available}.`
          );
          err.statusCode = 409;
          err.code = 'INSUFFICIENT_STOCK';
          err.available = available;
          throw err;
        }
        [movement] = await StockMovement.create(
          [
            {
              part: partId,
              type,
              quantityDelta: -quantity,
              lotNumber,
              supplier: null,
              reference,
              reason,
              performedBy,
            },
          ],
          { session }
        );
      } else if (type === 'adjustment') {
        // ── Adjustment: positive = increase, negative = decrease ────────────
        // The route/schema sends positive `quantity` + a `direction` field.
        // By the time we get here, `quantity` is already signed (see controller).
        const delta = quantity; // already signed at call site
        const absDelta = Math.abs(delta);

        if (delta > 0) {
          balance = await StockBalance.findOneAndUpdate(
            { part: partId, lotNumber },
            { $inc: { onHand: absDelta } },
            { upsert: true, new: true, session }
          );
        } else {
          balance = await StockBalance.findOneAndUpdate(
            { part: partId, lotNumber, onHand: { $gte: absDelta } },
            { $inc: { onHand: -absDelta } },
            { new: true, session }
          );
          if (!balance) {
            const current = await StockBalance.findOne(
              { part: partId, lotNumber },
              'onHand',
              { session }
            ).lean();
            const available = current ? current.onHand : 0;
            const err = new Error(
              `Insufficient stock for adjustment. Available ${available}.`
            );
            err.statusCode = 409;
            err.code = 'INSUFFICIENT_STOCK';
            err.available = available;
            throw err;
          }
        }

        [movement] = await StockMovement.create(
          [
            {
              part: partId,
              type,
              quantityDelta: delta,
              lotNumber,
              supplier: null,
              reference,
              reason,
              performedBy,
            },
          ],
          { session }
        );
      }
    });
  } finally {
    session.endSession();
  }

  return { movement, balance };
}

module.exports = { processMovement };

