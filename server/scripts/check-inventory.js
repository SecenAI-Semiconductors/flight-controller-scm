/**
 * check-inventory.js
 *
 * Read-only reconciliation: compares StockBalance.onHand vs the sum of
 * StockMovement.quantityDelta per (part, lotNumber).
 *
 * Prints any mismatches and exits with code 1 if any are found, 0 if clean.
 * NEVER modifies data.
 *
 * Usage: node scripts/check-inventory.js
 *        npm run inventory:check
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Register models
require('../src/models/Part');
require('../src/models/Supplier');
require('../src/models/User');
const StockMovement = require('../src/models/StockMovement');
const StockBalance = require('../src/models/StockBalance');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Running inventory reconciliation...\n');

  // Sum quantityDelta per (part, lotNumber) from the ledger
  const ledgerTotals = await StockMovement.aggregate([
    {
      $group: {
        _id: { part: '$part', lotNumber: '$lotNumber' },
        ledgerSum: { $sum: '$quantityDelta' },
      },
    },
  ]);

  // Fetch all balance docs
  const balances = await StockBalance.find().lean();

  // Build maps for easy comparison
  const ledgerMap = new Map();
  for (const row of ledgerTotals) {
    const key = `${row._id.part}::${row._id.lotNumber}`;
    ledgerMap.set(key, row.ledgerSum);
  }

  const balanceMap = new Map();
  for (const b of balances) {
    const key = `${b.part}::${b.lotNumber}`;
    balanceMap.set(key, b.onHand);
  }

  // All keys from both sides
  const allKeys = new Set([...ledgerMap.keys(), ...balanceMap.keys()]);

  const mismatches = [];
  for (const key of allKeys) {
    const ledger = ledgerMap.get(key) ?? 0;
    const balance = balanceMap.get(key) ?? 0;
    if (ledger !== balance) {
      mismatches.push({ key, ledger, balance, diff: ledger - balance });
    }
  }

  if (mismatches.length === 0) {
    console.log('✅  No mismatches. StockBalance is in sync with StockMovement ledger.');
    await mongoose.disconnect();
    process.exit(0);
  } else {
    console.error(`❌  ${mismatches.length} mismatch(es) found:\n`);
    for (const m of mismatches) {
      const [partId, lot] = m.key.split('::');
      console.error(
        `  part=${partId}  lot="${lot || '(unlotted)'}"` +
          `  ledger=${m.ledger}  balance=${m.balance}  diff=${m.diff}`
      );
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(2);
});
