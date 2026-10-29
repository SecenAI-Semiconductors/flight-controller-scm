/**
 * Removes ONLY the sample records created by scripts/seed-data.js.
 *
 * What is deleted:
 *   - Parts whose partNumber is one of the 13 seeded values.
 *   - Suppliers SUP-002, SUP-003, SUP-004, SUP-005 — but ONLY when no
 *     remaining Part document still references them as preferredSupplier.
 *
 * What is NEVER touched:
 *   - SUP-001 (kept unconditionally — it is a real test supplier).
 *   - Any other supplier, any user, or anything not listed above.
 *
 * Usage:
 *   node scripts/clear-sample-data.js            # dry-run (default)
 *   node scripts/clear-sample-data.js --confirm  # actually delete
 *
 * Requires: MONGO_URI in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('../src/models/Supplier');
const Part = require('../src/models/Part');

if (!process.env.MONGO_URI) {
  console.error('ERROR: Missing required environment variable: MONGO_URI');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Constants — must stay in sync with seed-data.js
// ---------------------------------------------------------------------------
const SEEDED_PART_NUMBERS = [
  'FC-MCU-001',
  'FC-MCU-002',
  'FC-CAP-001',
  'FC-CAP-002',
  'FC-SEN-001',
  'FC-SEN-002',
  'FC-SEN-003',
  'FC-CON-001',
  'FC-CON-002',
  'FC-PWR-001',
  'FC-PWR-002',
  'FC-ENC-001',
  'FC-PCB-001',
];

// SUP-001 is deliberately excluded — it must never be deleted.
const SEEDED_SUPPLIER_CODES = ['SUP-002', 'SUP-003', 'SUP-004', 'SUP-005'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isDryRun() {
  return !process.argv.includes('--confirm');
}

function label(dryRun) {
  return dryRun ? '[DRY-RUN]' : '[DELETE] ';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function clearSampleData() {
  const dryRun = isDryRun();

  if (dryRun) {
    console.log('=== DRY-RUN MODE — nothing will be modified ===');
    console.log('    Run with --confirm to actually delete.\n');
  } else {
    console.log('=== CONFIRM MODE — records WILL be deleted ===\n');
  }

  await mongoose.connect(process.env.MONGO_URI, { dbName: 'fc_scm' });
  console.log('Connected to MongoDB\n');

  // -------------------------------------------------------------------------
  // 1. Parts
  // -------------------------------------------------------------------------
  console.log('--- Parts ---');
  const partsToDelete = await Part.find(
    { partNumber: { $in: SEEDED_PART_NUMBERS } },
    'partNumber name'
  ).lean();

  if (partsToDelete.length === 0) {
    console.log('  No seeded parts found.\n');
  } else {
    for (const p of partsToDelete) {
      console.log(`  ${label(dryRun)} ${p.partNumber}  (${p.name})`);
    }
    if (!dryRun) {
      const result = await Part.deleteMany({ partNumber: { $in: SEEDED_PART_NUMBERS } });
      console.log(`  Deleted ${result.deletedCount} part(s).`);
    } else {
      console.log(`  Would delete ${partsToDelete.length} part(s).`);
    }
    console.log();
  }

  // -------------------------------------------------------------------------
  // 2. Suppliers (only if no remaining Parts reference them)
  // -------------------------------------------------------------------------
  console.log('--- Suppliers ---');
  const suppliersFound = await Supplier.find(
    { code: { $in: SEEDED_SUPPLIER_CODES } },
    'code name _id'
  ).lean();

  if (suppliersFound.length === 0) {
    console.log('  No seeded suppliers found.\n');
  } else {
    for (const sup of suppliersFound) {
      // Check whether any Part (not yet deleted) still references this supplier.
      const refCount = await Part.countDocuments({ preferredSupplier: sup._id });
      if (refCount > 0) {
        console.log(
          `  SKIP     ${sup.code}  (${sup.name}) — still referenced by ${refCount} part(s)`
        );
        continue;
      }
      console.log(`  ${label(dryRun)} ${sup.code}  (${sup.name})`);
      if (!dryRun) {
        await Supplier.deleteOne({ _id: sup._id });
      }
    }
    console.log();
  }

  await mongoose.disconnect();

  if (dryRun) {
    console.log('Dry-run complete. Run with --confirm to apply changes.');
  } else {
    console.log('Done.');
  }
}

clearSampleData().catch((err) => {
  console.error('clear-sample-data failed:', err.message);
  process.exit(1);
});
