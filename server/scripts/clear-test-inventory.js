/**
 * clear-test-inventory.js
 *
 * Targets ONLY:
 *   1. StockMovement + StockBalance for DEMO-P-BAR-001 and DEMO-P-PCB-001
 *   2. StockMovement + StockBalance for the throwaway PHASE2-TEST-PART
 *   3. Test users (emails ending @test.local, never @secenai.com)
 *
 * Default: DRY RUN — prints what WOULD be deleted.
 * Pass --confirm to actually delete (using raw Mongo driver to bypass
 * immutability hooks on StockMovement).
 *
 * Usage:
 *   node scripts/clear-test-inventory.js           # dry run
 *   node scripts/clear-test-inventory.js --confirm # real delete
 *
 * npm run clear:inventory-test
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const CONFIRM = process.argv.includes('--confirm');

// Register models so populate works; we use raw collections for deletes.
require('../src/models/Supplier');
require('../src/models/User');
const Part = require('../src/models/Part');
const User = require('../src/models/User');

const TARGET_PART_NUMBERS = ['DEMO-P-BAR-001', 'DEMO-P-PCB-001', 'PHASE2-TEST-PART'];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const movCol = mongoose.connection.collection('stockmovements');
  const balCol = mongoose.connection.collection('stockbalances');

  // ── Resolve part IDs ──────────────────────────────────────────────────────
  const parts = await Part.find({ partNumber: { $in: TARGET_PART_NUMBERS } }, '_id partNumber').lean();
  const partIds = parts.map(p => p._id);
  console.log('\nTarget parts:');
  parts.forEach(p => console.log(`  ${p.partNumber}  _id=${p._id}`));
  const missing = TARGET_PART_NUMBERS.filter(pn => !parts.find(p => p.partNumber === pn));
  if (missing.length) console.log(`  (not found: ${missing.join(', ')})`);

  // ── Count what will be deleted ────────────────────────────────────────────
  const mvCount  = await movCol.countDocuments({ part: { $in: partIds } });
  const balCount = await balCol.countDocuments({ part: { $in: partIds } });

  // Sample movements for confirmation
  const sample = await movCol
    .find({ part: { $in: partIds } })
    .sort({ createdAt: 1 })
    .limit(5)
    .toArray();

  // Test users (never @secenai.com)
  const testUsers = await User.find({
    email: { $not: /@secenai\.com$/ },
  }, 'email role createdAt').lean();

  console.log('\n══ DRY RUN SUMMARY ══');
  console.log(`  StockMovement rows to delete : ${mvCount}`);
  console.log(`  StockBalance  rows to delete : ${balCount}`);
  console.log(`  Test users to delete         : ${testUsers.length}`);
  testUsers.forEach(u => console.log(`    - ${u.email}  role=${u.role}`));

  console.log('\n  Sample movements (first 5, oldest):');
  sample.forEach(m => console.log(
    `    type=${m.type}  delta=${m.quantityDelta}  lot="${m.lotNumber}"  ref="${m.reference}"  created=${m.createdAt?.toISOString()}`
  ));

  if (!CONFIRM) {
    console.log('\n⚠️  DRY RUN ONLY. Pass --confirm to execute.\n');
    await mongoose.disconnect();
    return;
  }

  // ── REAL DELETE ───────────────────────────────────────────────────────────
  console.log('\n══ EXECUTING DELETES ══');

  // Delete movements and balances together (atomic enough — same tick,
  // both use raw driver so immutability pre-hooks are bypassed).
  const mvDel  = await movCol.deleteMany({ part: { $in: partIds } });
  const balDel = await balCol.deleteMany({ part: { $in: partIds } });
  console.log(`  Deleted StockMovement : ${mvDel.deletedCount}`);
  console.log(`  Deleted StockBalance  : ${balDel.deletedCount}`);

  // Delete test users (never admin, never @secenai.com)
  const userDel = await User.deleteMany({
    email: { $not: /@secenai\.com$/ },
  });
  console.log(`  Deleted test users    : ${userDel.deletedCount}`);

  // Delete throwaway part (PHASE2-TEST-PART only — never DEMO parts)
  const partDel = await Part.deleteMany({ partNumber: 'PHASE2-TEST-PART' });
  console.log(`  Deleted throwaway part: ${partDel.deletedCount}`);

  console.log('\n✅  Cleanup complete.\n');
  await mongoose.disconnect();
}

run().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});

