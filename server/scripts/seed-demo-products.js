/**
 * seed-demo-products.js
 * ---------------------------------------------------------------------------
 * Creates a LOCAL demo dataset to demonstrate the Product → Revision → BOM
 * lifecycle to stakeholders.
 *
 * SAFETY GUARANTEES
 *  - Every record is clearly marked: SKUs start "DEMO-", part numbers start
 *    "DEMO-P-", supplier codes start "DEMO-S-", and names include "(DEMO)".
 *  - The script NEVER touches existing products, suppliers, or parts.
 *  - Idempotent: running twice creates zero duplicates.
 *  - Released revisions set releasedAt + approver using the admin user found
 *    via ADMIN_EMAIL in .env (aborts if not found).
 *
 * Usage:
 *   npm run seed:demo             ← create demo data
 *   npm run clear:demo            ← dry-run: list what would be deleted
 *   npm run clear:demo -- --confirm ← actually delete demo data
 *
 * Requires: MONGO_URI + ADMIN_EMAIL in .env
 */

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');

const Supplier        = require('../src/models/Supplier');
const Part            = require('../src/models/Part');
const Product         = require('../src/models/Product');
const ProductRevision = require('../src/models/ProductRevision');
const BomLine         = require('../src/models/BomLine');
const User            = require('../src/models/User');

// ---------------------------------------------------------------------------
// Guard: required env vars
// ---------------------------------------------------------------------------
if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set in .env');
  process.exit(1);
}
if (!process.env.ADMIN_EMAIL) {
  console.error('ERROR: ADMIN_EMAIL is not set in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// MODE: seed vs clear
// ---------------------------------------------------------------------------
const MODE = process.argv[2] === '--clear' ? 'clear' : 'seed';

// ---------------------------------------------------------------------------
// Demo supplier definitions
// ---------------------------------------------------------------------------
const DEMO_SUPPLIERS = [
  {
    code: 'DEMO-S-01',
    name: 'MicroFlight Components (DEMO)',
    contactName: 'Anika Sharma',
    email: 'anika.sharma@microflight-demo.example',
    phone: '+1-650-555-0191',
    country: 'USA',
    leadTimeDays: 14,
    notes: 'DEMO supplier — primary MCU and power IC source.',
  },
  {
    code: 'DEMO-S-02',
    name: 'AeroSense Asia Ltd. (DEMO)',
    contactName: 'Jin-ho Park',
    email: 'jinho.park@aerosense-demo.example',
    phone: '+82-2-555-0282',
    country: 'South Korea',
    leadTimeDays: 21,
    notes: 'DEMO supplier — inertial and barometric sensors.',
  },
  {
    code: 'DEMO-S-03',
    name: 'Nexus PCB & Connectors (DEMO)',
    contactName: 'Priya Nair',
    email: 'priya.nair@nexuspcb-demo.example',
    phone: '+91-44-555-0373',
    country: 'India',
    leadTimeDays: 18,
    notes: 'DEMO supplier — PCBs, JST connectors, and USB-C receptacles.',
  },
];

// ---------------------------------------------------------------------------
// Demo part definitions (built after supplier IDs are available)
// All unitCost values are in Indian Rupees (INR ₹).
// ---------------------------------------------------------------------------
function buildDemoParts(supMap) {
  return [
    // ── MCU ────────────────────────────────────────────────────────────────
    {
      partNumber: 'DEMO-P-MCU-001',
      name: 'STM32H743ZIT6 MCU (DEMO)',
      category: 'MCU',
      description: 'ARM Cortex-M7 @ 480 MHz, 2 MB Flash, 1 MB SRAM. LQFP-176.',
      unitOfMeasure: 'pcs',
      unitCost: 1050,      // ₹1,050  (~$12.50)
      reorderPoint: 50,
      preferredSupplier: supMap['DEMO-S-01'],
      notes: 'DEMO part. Requires ESD precautions.',
    },
    // ── IMU ────────────────────────────────────────────────────────────────
    {
      partNumber: 'DEMO-P-IMU-001',
      name: 'ICM-42688-P IMU (Primary) (DEMO)',
      category: 'Sensor',
      description: '6-axis IMU, SPI/I2C, ±2000 dps / ±16 g. Primary inertial sensor.',
      unitOfMeasure: 'pcs',
      unitCost: 353,       // ₹353    (~$4.20)
      reorderPoint: 100,
      preferredSupplier: supMap['DEMO-S-02'],
      notes: 'DEMO part. Run factory calibration after assembly.',
    },
    {
      partNumber: 'DEMO-P-IMU-002',
      name: 'ICM-42688-P IMU (Redundant) (DEMO)',
      category: 'Sensor',
      description: '6-axis IMU — second instance for redundant sensing, separate SPI bus.',
      unitOfMeasure: 'pcs',
      unitCost: 353,       // ₹353    (~$4.20)
      reorderPoint: 100,
      preferredSupplier: supMap['DEMO-S-02'],
      notes: 'DEMO part. Same part number as primary; tracked separately for BOM clarity.',
    },
    {
      partNumber: 'DEMO-P-IMU-003',
      name: 'ICM-42605 IMU (Alternate) (DEMO)',
      category: 'Sensor',
      description: '6-axis IMU, I2C/SPI, ±2000 dps / ±16 g. Pin-compatible alternate to ICM-42688-P.',
      unitOfMeasure: 'pcs',
      unitCost: 302,       // ₹302    (~$3.60)
      reorderPoint: 50,
      preferredSupplier: supMap['DEMO-S-02'],
      notes: 'DEMO part. Approved drop-in alternate for primary IMU positions.',
    },
    // ── Barometer ──────────────────────────────────────────────────────────
    {
      partNumber: 'DEMO-P-BAR-001',
      name: 'BMP581 Barometric Pressure Sensor (DEMO)',
      category: 'Sensor',
      description: 'High-accuracy barometer, 300–1250 hPa, SPI/I2C. Gen-2 reference design.',
      unitOfMeasure: 'pcs',
      unitCost: 235,       // ₹235    (~$2.80)
      reorderPoint: 80,
      preferredSupplier: supMap['DEMO-S-02'],
      notes: 'DEMO part. Used for altitude estimation fusion.',
    },
    {
      partNumber: 'DEMO-P-BAR-002',
      name: 'BMP388 Barometric Pressure Sensor (Alternate) (DEMO)',
      category: 'Sensor',
      description: 'Previous-gen barometer, 300–1250 hPa. Being evaluated as cost-down alternate.',
      unitOfMeasure: 'pcs',
      unitCost: 164,       // ₹164    (~$1.95)
      reorderPoint: 40,
      preferredSupplier: supMap['DEMO-S-02'],
      notes: 'DEMO part. Under evaluation in Revision A2.',
    },
    // ── Power ──────────────────────────────────────────────────────────────
    {
      partNumber: 'DEMO-P-PWR-001',
      name: 'TPS62177 5V Buck Regulator (DEMO)',
      category: 'Power',
      description: '1A step-down regulator, Vin 6-17 V → 5 V rail. SOT-23-6.',
      unitOfMeasure: 'pcs',
      unitCost: 109,       // ₹109    (~$1.30)
      reorderPoint: 150,
      preferredSupplier: supMap['DEMO-S-01'],
      notes: 'DEMO part.',
    },
    // ── Connector ──────────────────────────────────────────────────────────
    {
      partNumber: 'DEMO-P-CON-001',
      name: 'USB-C 2.0 Receptacle 16-pin (DEMO)',
      category: 'Connector',
      description: 'SMT USB Type-C receptacle, 2.0 full-speed, right-angle.',
      unitOfMeasure: 'pcs',
      unitCost: 46,        // ₹46     (~$0.55)
      reorderPoint: 200,
      preferredSupplier: supMap['DEMO-S-03'],
      notes: 'DEMO part. Used for firmware flashing and telemetry.',
    },
    {
      partNumber: 'DEMO-P-CON-002',
      name: 'JST-GH 6-pin Connector (Male) (DEMO)',
      category: 'Connector',
      description: '1.25 mm pitch JST-GH 6-pin male header — telemetry / GPS port.',
      unitOfMeasure: 'pcs',
      unitCost: 38,        // ₹38     (~$0.45)
      reorderPoint: 300,
      preferredSupplier: supMap['DEMO-S-03'],
      notes: 'DEMO part. PX4/ArduPilot compatible pinout.',
    },
    // ── PCB ────────────────────────────────────────────────────────────────
    {
      partNumber: 'DEMO-P-PCB-001',
      name: 'H743 FC Main PCB Rev A (DEMO)',
      category: 'PCB',
      description: '6-layer FR4, 38×38 mm, 1 oz Cu. IPC Class 3. Initial H743 layout.',
      unitOfMeasure: 'pcs',
      unitCost: 1344,      // ₹1,344  (~$16.00)
      reorderPoint: 20,
      preferredSupplier: supMap['DEMO-S-03'],
      notes: 'DEMO part. Min order 50 pcs.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function upsertSupplier(def) {
  const existing = await Supplier.findOne({ code: def.code });
  if (existing) {
    console.log(`  SKIP     ${def.code}  (${def.name}) — already exists`);
    return existing._id;
  }
  const doc = await Supplier.create(def);
  console.log(`  CREATE   ${def.code}  (${def.name})`);
  return doc._id;
}

async function upsertPart(def) {
  const existing = await Part.findOne({ partNumber: def.partNumber });
  if (existing) {
    console.log(`  SKIP     ${def.partNumber}  (${def.name}) — already exists`);
    return existing._id;
  }
  const doc = await Part.create(def);
  console.log(`  CREATE   ${def.partNumber}  (${def.name})`);
  return doc._id;
}

async function upsertProduct(def) {
  const existing = await Product.findOne({ sku: def.sku });
  if (existing) {
    console.log(`  SKIP     ${def.sku}  (${def.name}) — already exists`);
    return existing._id;
  }
  const doc = await Product.create(def);
  console.log(`  CREATE   ${def.sku}  (${def.name})`);
  return doc._id;
}

async function upsertRevision(def) {
  const existing = await ProductRevision.findOne({ product: def.product, label: def.label });
  if (existing) {
    console.log(`  SKIP     Revision ${def.label} — already exists`);
    return { id: existing._id, created: false };
  }
  const doc = await ProductRevision.create(def);
  console.log(`  CREATE   Revision ${def.label}`);
  return { id: doc._id, created: true };
}

async function upsertBomLine(def) {
  const existing = await BomLine.findOne({ revision: def.revision, part: def.part });
  if (existing) return { created: false };
  await BomLine.create(def);
  return { created: true };
}

// ---------------------------------------------------------------------------
// SEED
// ---------------------------------------------------------------------------
async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'fc_scm' });
  console.log('Connected to MongoDB\n');

  // ── Find admin user ───────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const adminUser  = await User.findOne({ email: adminEmail });
  if (!adminUser) {
    console.error(
      `\nABORT: No user found with email "${adminEmail}" (ADMIN_EMAIL).\n` +
      `       Run "npm run seed:admin" first, then retry.`
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`Admin user: ${adminUser.email} (${adminUser._id})\n`);

  // Counters for summary
  const counts = {
    suppliers: { created: 0, skipped: 0 },
    parts:     { created: 0, skipped: 0 },
    products:  { created: 0, skipped: 0 },
    revisions: { created: 0, skipped: 0 },
    bomLines:  { created: 0, skipped: 0 },
  };

  // ── 1. Suppliers ──────────────────────────────────────────────────────────
  console.log('--- Demo Suppliers ---');
  const supMap = {};
  for (const s of DEMO_SUPPLIERS) {
    const id = await upsertSupplier(s);
    supMap[s.code] = id;
    if (await Supplier.findOne({ code: s.code, _id: { $ne: id } })) {
      counts.suppliers.skipped++;
    } else {
      // crude: check log output via findOne after
    }
  }
  // recount by checking which existed before
  {
    const found = await Supplier.find({ code: { $in: DEMO_SUPPLIERS.map(s => s.code) } });
    // We already did upserts; count is stable now — just record totals
    counts.suppliers.created = DEMO_SUPPLIERS.length; // upper bound; skips logged above
    counts.suppliers.skipped = 0;
  }
  console.log();

  // ── 2. Parts ──────────────────────────────────────────────────────────────
  console.log('--- Demo Parts ---');
  const partDefs = buildDemoParts(supMap);
  const partMap  = {};
  for (const p of partDefs) {
    const existing = await Part.findOne({ partNumber: p.partNumber });
    if (existing) {
      console.log(`  SKIP     ${p.partNumber}  (${p.name}) — already exists`);
      partMap[p.partNumber] = existing._id;
      counts.parts.skipped++;
    } else {
      const doc = await Part.create(p);
      console.log(`  CREATE   ${p.partNumber}  (${p.name})`);
      partMap[p.partNumber] = doc._id;
      counts.parts.created++;
    }
  }
  console.log();

  // Convenience aliases
  const P = partMap; // P['DEMO-P-MCU-001'] etc.
  const S = supMap;  // S['DEMO-S-01'] etc.

  // =========================================================================
  // EXAMPLE A  — SECENAI FC H743 (DEMO)   SKU: DEMO-FC-H743-A
  //   Revisions: A0 (obsolete) → A1 (released) → A2 (draft)
  // =========================================================================
  console.log('--- Example A: SECENAI FC H743 (DEMO) ---');

  const prodA_id = await upsertProduct({
    name:          'SECENAI FC H743 (DEMO)',
    sku:           'DEMO-FC-H743-A',
    category:      'Flight Controller',
    variant:       '',
    description:   'DEMO product — full-featured H743-based flight controller. ' +
                   'Demonstrates a complete Product → Revision → BOM lifecycle.',
    status:        'active',
    listingStatus: 'live',
    price:         14176,   // INR
    active:        true,
  });
  counts.products.created++;

  // ── Revision A0 (obsolete) ───────────────────────────────────────────────
  console.log('  Revision A0 (obsolete):');
  const { id: revA0_id, created: revA0Created } = await upsertRevision({
    product:         prodA_id,
    label:           'A0',
    status:          'obsolete',
    notes:           'Initial prototype BOM. Superseded by A1 (ECR-DEMO-001).',
    firmwareVersion: '0.9.0-alpha',
    changeRequest:   'ECR-DEMO-001',
    effectiveDate:   new Date('2025-06-01'),
    releasedAt:      new Date('2025-06-10'),
    approver:        adminUser._id,
    fileLinks: [
      { label: 'Schematic v0.9 (DEMO)', url: 'https://example.com/demo/schematic-v0.9.pdf' },
    ],
  });
  if (revA0Created) counts.revisions.created++; else counts.revisions.skipped++;

  // A0 BOM (abbreviated — 3 lines, to show obsolete state)
  const a0Lines = [
    { part: P['DEMO-P-MCU-001'], quantity: 1,  referenceDesignators: 'U1',      supplier: S['DEMO-S-01'], notes: 'Main MCU' },
    { part: P['DEMO-P-IMU-001'], quantity: 1,  referenceDesignators: 'U2',      supplier: S['DEMO-S-02'], notes: 'Primary IMU (A0 layout)' },
    { part: P['DEMO-P-BAR-001'], quantity: 1,  referenceDesignators: 'U5',      supplier: S['DEMO-S-02'], notes: 'Barometer' },
  ];
  let a0New = 0;
  for (const line of a0Lines) {
    const r = await upsertBomLine({ revision: revA0_id, ...line });
    if (r.created) { a0New++; counts.bomLines.created++; } else counts.bomLines.skipped++;
  }
  console.log(`    BOM: ${a0New} created, ${a0Lines.length - a0New} skipped`);

  // ── Revision A1 (released) ───────────────────────────────────────────────
  console.log('  Revision A1 (released):');
  const { id: revA1_id, created: revA1Created } = await upsertRevision({
    product:         prodA_id,
    label:           'A1',
    status:          'released',
    notes:           'Production BOM. Added redundant IMU (U3). BMP581 replaces BMP390.',
    firmwareVersion: '1.2.0',
    changeRequest:   'ECR-DEMO-002',
    effectiveDate:   new Date('2025-09-01'),
    releasedAt:      new Date('2025-08-28'),
    approver:        adminUser._id,
    fileLinks: [
      { label: 'Schematic Rev A1 (DEMO)',  url: 'https://example.com/demo/schematic-a1.pdf' },
      { label: 'Layout Gerbers A1 (DEMO)', url: 'https://example.com/demo/gerbers-a1.zip'  },
    ],
  });
  if (revA1Created) counts.revisions.created++; else counts.revisions.skipped++;

  // A1 BOM — 8 lines; lines 2 & 5 have alternates
  //  Line 2: primary IMU has ICM-42605 as alternate
  //  Line 5: barometer BMP581 has BMP388 as alternate
  const a1Lines = [
    {
      part: P['DEMO-P-MCU-001'], quantity: 1,
      referenceDesignators: 'U1', supplier: S['DEMO-S-01'],
      notes: 'Main flight processor. STM32H743ZIT6.',
      alternates: [],
    },
    {
      part: P['DEMO-P-IMU-001'], quantity: 1,
      referenceDesignators: 'U2', supplier: S['DEMO-S-02'],
      notes: 'Primary IMU, SPI1.',
      alternates: [P['DEMO-P-IMU-003']], // ICM-42605 is approved alternate
    },
    {
      part: P['DEMO-P-IMU-002'], quantity: 1,
      referenceDesignators: 'U3', supplier: S['DEMO-S-02'],
      notes: 'Redundant IMU, SPI2. Added in A1.',
      alternates: [],
    },
    {
      part: P['DEMO-P-PWR-001'], quantity: 1,
      referenceDesignators: 'U4', supplier: S['DEMO-S-01'],
      notes: '5 V rail for peripheral headers.',
      alternates: [],
    },
    {
      part: P['DEMO-P-BAR-001'], quantity: 1,
      referenceDesignators: 'U5', supplier: S['DEMO-S-02'],
      notes: 'BMP581 barometer, I2C.',
      alternates: [P['DEMO-P-BAR-002']], // BMP388 is approved alternate
    },
    {
      part: P['DEMO-P-CON-001'], quantity: 1,
      referenceDesignators: 'J1', supplier: S['DEMO-S-03'],
      notes: 'USB-C port for flashing.',
      alternates: [],
    },
    {
      part: P['DEMO-P-CON-002'], quantity: 4,
      referenceDesignators: 'J2, J3, J4, J5', supplier: S['DEMO-S-03'],
      notes: 'JST-GH telemetry / GPS ports (qty 4).',
      alternates: [],
    },
    {
      part: P['DEMO-P-PCB-001'], quantity: 1,
      referenceDesignators: 'PCB', supplier: S['DEMO-S-03'],
      notes: 'Main PCB. Ref C1 removed from A0 layout.',
      alternates: [],
    },
  ];
  let a1New = 0;
  for (const line of a1Lines) {
    const r = await upsertBomLine({ revision: revA1_id, ...line });
    if (r.created) { a1New++; counts.bomLines.created++; } else counts.bomLines.skipped++;
  }
  console.log(`    BOM: ${a1New} created, ${a1Lines.length - a1New} skipped`);

  // ── Revision A2 (draft) ──────────────────────────────────────────────────
  console.log('  Revision A2 (draft):');
  const { id: revA2_id, created: revA2Created } = await upsertRevision({
    product:         prodA_id,
    label:           'A2',
    status:          'draft',
    notes:           'Testing alternate barometer (BMP388 cost-down). ' +
                     'All other lines identical to A1. No firmware version assigned yet.',
    firmwareVersion: '',
    changeRequest:   'ECR-DEMO-003',
    effectiveDate:   null,
    releasedAt:      null,
    approver:        null,
  });
  if (revA2Created) counts.revisions.created++; else counts.revisions.skipped++;

  // A2 BOM — same as A1 except BMP581 → BMP388 (swapped barometer)
  const a2Lines = [
    {
      part: P['DEMO-P-MCU-001'], quantity: 1,
      referenceDesignators: 'U1', supplier: S['DEMO-S-01'],
      notes: 'Same as A1.',
      alternates: [],
    },
    {
      part: P['DEMO-P-IMU-001'], quantity: 1,
      referenceDesignators: 'U2', supplier: S['DEMO-S-02'],
      notes: 'Same as A1.',
      alternates: [P['DEMO-P-IMU-003']],
    },
    {
      part: P['DEMO-P-IMU-002'], quantity: 1,
      referenceDesignators: 'U3', supplier: S['DEMO-S-02'],
      notes: 'Same as A1.',
      alternates: [],
    },
    {
      part: P['DEMO-P-PWR-001'], quantity: 1,
      referenceDesignators: 'U4', supplier: S['DEMO-S-01'],
      notes: 'Same as A1.',
      alternates: [],
    },
    // ← SWAPPED: BMP388 instead of BMP581
    {
      part: P['DEMO-P-BAR-002'], quantity: 1,
      referenceDesignators: 'U5', supplier: S['DEMO-S-02'],
      notes: 'SWAPPED: BMP388 under evaluation (cost-down vs BMP581).',
      alternates: [P['DEMO-P-BAR-001']], // BMP581 listed as alternate while testing BMP388
    },
    {
      part: P['DEMO-P-CON-001'], quantity: 1,
      referenceDesignators: 'J1', supplier: S['DEMO-S-03'],
      notes: 'Same as A1.',
      alternates: [],
    },
    {
      part: P['DEMO-P-CON-002'], quantity: 4,
      referenceDesignators: 'J2, J3, J4, J5', supplier: S['DEMO-S-03'],
      notes: 'Same as A1.',
      alternates: [],
    },
    {
      part: P['DEMO-P-PCB-001'], quantity: 1,
      referenceDesignators: 'PCB', supplier: S['DEMO-S-03'],
      notes: 'Same as A1.',
      alternates: [],
    },
  ];
  let a2New = 0;
  for (const line of a2Lines) {
    const r = await upsertBomLine({ revision: revA2_id, ...line });
    if (r.created) { a2New++; counts.bomLines.created++; } else counts.bomLines.skipped++;
  }
  console.log(`    BOM: ${a2New} created, ${a2Lines.length - a2New} skipped`);
  console.log();

  // =========================================================================
  // EXAMPLE B  — SECENAI FC H743 Mini (DEMO)   SKU: DEMO-FC-H743-B
  //   Product: draft / hidden
  //   Revision B1: draft, incomplete BOM (3–4 lines, some without supplier)
  // =========================================================================
  console.log('--- Example B: SECENAI FC H743 Mini (DEMO) ---');

  const prodB_id = await upsertProduct({
    name:          'SECENAI FC H743 Mini (DEMO)',
    sku:           'DEMO-FC-H743-B',
    category:      'Flight Controller',
    variant:       'Mini',
    description:   'DEMO product — miniaturised variant. Early concept stage, BOM incomplete.',
    status:        'draft',
    listingStatus: 'hidden',
    price:         null,
    active:        true,
  });
  counts.products.created++;

  console.log('  Revision B1 (draft):');
  const { id: revB1_id, created: revB1Created } = await upsertRevision({
    product:         prodB_id,
    label:           'B1',
    status:          'draft',
    notes:           'Initial concept BOM — incomplete. Supplier TBD for some lines.',
    firmwareVersion: '',
    changeRequest:   '',
    effectiveDate:   null,
    releasedAt:      null,
    approver:        null,
  });
  if (revB1Created) counts.revisions.created++; else counts.revisions.skipped++;

  // B1 BOM — only 4 lines, intentionally incomplete, some without supplier
  const b1Lines = [
    {
      part: P['DEMO-P-MCU-001'], quantity: 1,
      referenceDesignators: 'U1', supplier: S['DEMO-S-01'],
      notes: 'MCU confirmed.',
      alternates: [],
    },
    {
      part: P['DEMO-P-IMU-001'], quantity: 1,
      referenceDesignators: 'U2', supplier: null,     // ← supplier TBD
      notes: 'Supplier not yet confirmed for Mini variant.',
      alternates: [],
    },
    {
      part: P['DEMO-P-BAR-001'], quantity: 1,
      referenceDesignators: 'U3', supplier: null,     // ← supplier TBD
      notes: 'TBD — may be replaced by lower-cost option.',
      alternates: [],
    },
    {
      part: P['DEMO-P-PCB-001'], quantity: 1,
      referenceDesignators: 'PCB', supplier: S['DEMO-S-03'],
      notes: 'Placeholder — Mini will need a new PCB layout.',
      alternates: [],
    },
  ];
  let b1New = 0;
  for (const line of b1Lines) {
    const r = await upsertBomLine({ revision: revB1_id, ...line });
    if (r.created) { b1New++; counts.bomLines.created++; } else counts.bomLines.skipped++;
  }
  console.log(`    BOM: ${b1New} created, ${b1Lines.length - b1New} skipped`);
  console.log();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════');
  console.log(' DEMO SEED SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(` Suppliers : ${DEMO_SUPPLIERS.length} total  (upserted)`);
  console.log(` Parts     : ${counts.parts.created} created, ${counts.parts.skipped} skipped`);
  console.log(` Products  : ${counts.products.created} created, ${counts.products.skipped} skipped`);
  console.log(` Revisions : ${counts.revisions.created} created, ${counts.revisions.skipped} skipped`);
  console.log(` BOM Lines : ${counts.bomLines.created} created, ${counts.bomLines.skipped} skipped`);
  console.log('═══════════════════════════════════════════════════════');
  console.log();
  console.log('Products seeded:');
  console.log('  A) DEMO-FC-H743-A  "SECENAI FC H743 (DEMO)"');
  console.log('       A0 → obsolete  (3 BOM lines)');
  console.log('       A1 → released  (8 BOM lines, 2 with alternates)  ← production BOM');
  console.log('       A2 → draft     (8 BOM lines, BMP388 swap under test)');
  console.log('  B) DEMO-FC-H743-B  "SECENAI FC H743 Mini (DEMO)"');
  console.log('       B1 → draft     (4 BOM lines, incomplete, 2 without supplier)');
  console.log();
  console.log('Run "npm run clear:demo" to see what would be removed.');

  await mongoose.disconnect();
}

// ---------------------------------------------------------------------------
// CLEAR
// ---------------------------------------------------------------------------
async function clearDemo() {
  const dryRun = !process.argv.includes('--confirm');

  if (dryRun) {
    console.log('=== DRY-RUN MODE — nothing will be modified ===');
    console.log('    Run with --confirm to actually delete.\n');
  } else {
    console.log('=== CONFIRM MODE — records WILL be deleted ===\n');
  }

  await mongoose.connect(process.env.MONGO_URI, { dbName: 'fc_scm' });
  console.log('Connected to MongoDB\n');

  function lbl() { return dryRun ? '[DRY-RUN]' : '[DELETE] '; }

  // ── 1. BOM lines belonging to demo revisions ──────────────────────────────
  console.log('--- BOM Lines ---');
  // Find all demo revisions first
  const demoRevisions = await ProductRevision.find(
    {},
    '_id label product'
  ).populate({ path: 'product', select: 'sku' }).lean();
  const demoRevIds = demoRevisions
    .filter(r => r.product && r.product.sku && r.product.sku.startsWith('DEMO-'))
    .map(r => r._id);

  const bomLines = await BomLine.find({ revision: { $in: demoRevIds } }).lean();
  if (bomLines.length === 0) {
    console.log('  No demo BOM lines found.\n');
  } else {
    console.log(`  ${lbl()} ${bomLines.length} BOM line(s) across ${demoRevIds.length} demo revision(s)`);
    if (!dryRun) {
      const r = await BomLine.deleteMany({ revision: { $in: demoRevIds } });
      console.log(`  Deleted ${r.deletedCount} BOM line(s).`);
    } else {
      console.log(`  Would delete ${bomLines.length} BOM line(s).`);
    }
    console.log();
  }

  // ── 2. ProductRevisions belonging to demo products ────────────────────────
  console.log('--- Product Revisions ---');
  const demoProductDocs = await Product.find(
    { sku: /^DEMO-/ },
    '_id sku name'
  ).lean();
  const demoProductIds = demoProductDocs.map(p => p._id);

  const revisions = await ProductRevision.find(
    { product: { $in: demoProductIds } },
    'label product status'
  ).lean();

  if (revisions.length === 0) {
    console.log('  No demo revisions found.\n');
  } else {
    for (const rev of revisions) {
      const prod = demoProductDocs.find(p => p._id.toString() === rev.product.toString());
      console.log(`  ${lbl()} Revision ${rev.label}  (${prod ? prod.sku : '?'}, status=${rev.status})`);
    }
    if (!dryRun) {
      const r = await ProductRevision.deleteMany({ product: { $in: demoProductIds } });
      console.log(`  Deleted ${r.deletedCount} revision(s).`);
    } else {
      console.log(`  Would delete ${revisions.length} revision(s).`);
    }
    console.log();
  }

  // ── 3. Products (SKU starts with DEMO-) ───────────────────────────────────
  console.log('--- Products ---');
  if (demoProductDocs.length === 0) {
    console.log('  No demo products found.\n');
  } else {
    for (const p of demoProductDocs) {
      console.log(`  ${lbl()} ${p.sku}  (${p.name})`);
    }
    if (!dryRun) {
      const r = await Product.deleteMany({ sku: /^DEMO-/ });
      console.log(`  Deleted ${r.deletedCount} product(s).`);
    } else {
      console.log(`  Would delete ${demoProductDocs.length} product(s).`);
    }
    console.log();
  }

  // ── 4. Parts (partNumber starts with DEMO-P-) ─────────────────────────────
  console.log('--- Parts ---');
  const demoParts = await Part.find({ partNumber: /^DEMO-P-/ }, 'partNumber name').lean();
  if (demoParts.length === 0) {
    console.log('  No demo parts found.\n');
  } else {
    for (const p of demoParts) {
      console.log(`  ${lbl()} ${p.partNumber}  (${p.name})`);
    }
    if (!dryRun) {
      const r = await Part.deleteMany({ partNumber: /^DEMO-P-/ });
      console.log(`  Deleted ${r.deletedCount} part(s).`);
    } else {
      console.log(`  Would delete ${demoParts.length} part(s).`);
    }
    console.log();
  }

  // ── 5. Suppliers (code starts with DEMO-S-) ───────────────────────────────
  console.log('--- Suppliers ---');
  const demoSuppliers = await Supplier.find({ code: /^DEMO-S-/ }, 'code name _id').lean();
  if (demoSuppliers.length === 0) {
    console.log('  No demo suppliers found.\n');
  } else {
    for (const sup of demoSuppliers) {
      // Safety check: would any NON-demo part still reference this supplier?
      const nonDemoRefCount = await Part.countDocuments({
        preferredSupplier: sup._id,
        partNumber: { $not: /^DEMO-P-/ },
      });
      if (nonDemoRefCount > 0) {
        console.log(
          `  SKIP     ${sup.code}  (${sup.name}) — still referenced by ${nonDemoRefCount} non-demo part(s)`
        );
        continue;
      }
      console.log(`  ${lbl()} ${sup.code}  (${sup.name})`);
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
    console.log('Done. All demo records removed.');
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
const arg = process.argv[2];
if (arg === '--clear') {
  clearDemo().catch((err) => {
    console.error('clear-demo failed:', err.message);
    process.exit(1);
  });
} else {
  seed().catch((err) => {
    console.error('seed-demo failed:', err.message);
    process.exit(1);
  });
}

