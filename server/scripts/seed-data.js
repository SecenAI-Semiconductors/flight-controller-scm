/**
 * Idempotent seed script for example Suppliers and Parts.
 * Safe to run multiple times — existing records (matched by code/partNumber) are skipped.
 *
 * Usage: npm run seed:data
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
// Example Suppliers
// ---------------------------------------------------------------------------
const SUPPLIERS = [
  {
    name: 'Avionics Global Components',
    code: 'SUP-001',
    contactName: 'Marcus Chen',
    email: 'marcus.chen@avionicsglobal.com',
    phone: '+1-408-555-0101',
    country: 'USA',
    leadTimeDays: 14,
    notes: 'Primary supplier for MCUs and FPGAs. Net-30 payment terms.',
  },
  {
    name: 'TechParts Europe GmbH',
    code: 'SUP-002',
    contactName: 'Ingrid Muller',
    email: 'ingrid.muller@techparts-eu.de',
    phone: '+49-89-555-0202',
    country: 'Germany',
    leadTimeDays: 21,
    notes: 'Preferred supplier for passive components and connectors.',
  },
  {
    name: 'SkyElec Taiwan Co.',
    code: 'SUP-003',
    contactName: 'Mei-Ling Wu',
    email: 'mling.wu@skyelec.tw',
    phone: '+886-2-555-0303',
    country: 'Taiwan',
    leadTimeDays: 30,
    notes: 'Competitive pricing on sensors and oscillators. MOQ applies.',
  },
  {
    name: 'Precision Circuits Ltd.',
    code: 'SUP-004',
    contactName: 'Rajan Patel',
    email: 'rajan.patel@precisioncircuits.in',
    phone: '+91-80-555-0404',
    country: 'India',
    leadTimeDays: 18,
    notes: 'PCB fabrication and assembly subcontractor.',
  },
  {
    name: 'Nordic Aerospace Materials',
    code: 'SUP-005',
    contactName: 'Lars Eriksson',
    email: 'lars.eriksson@nordicaero.se',
    phone: '+46-8-555-0505',
    country: 'Sweden',
    leadTimeDays: 25,
    notes: 'Specialises in high-grade aluminium enclosures and thermal solutions.',
  },
];

// ---------------------------------------------------------------------------
// Example Parts (populated after suppliers are inserted so IDs are available)
// ---------------------------------------------------------------------------
function buildParts(supplierMap) {
  return [
    {
      name: 'STM32H743 Microcontroller',
      partNumber: 'FC-MCU-001',
      category: 'MCU',
      description: 'ARM Cortex-M7 @ 480 MHz, 2 MB Flash, 1 MB SRAM — main flight computer.',
      unitOfMeasure: 'pcs',
      unitCost: 12.5,
      reorderPoint: 50,
      preferredSupplier: supplierMap['SUP-001'],
      notes: 'LQFP-176 package. Requires programming fixture FC-JIG-001.',
    },
    {
      name: 'NXP i.MX RT1062 MCU',
      partNumber: 'FC-MCU-002',
      category: 'MCU',
      description: 'Crossover MCU @ 600 MHz — used in secondary navigation board.',
      unitOfMeasure: 'pcs',
      unitCost: 9.75,
      reorderPoint: 30,
      preferredSupplier: supplierMap['SUP-001'],
      notes: 'BGA package. Handle with ESD precautions.',
    },
    {
      name: 'MLCC 100nF 50V X7R 0402',
      partNumber: 'FC-CAP-001',
      category: 'Capacitor',
      description: 'Multi-layer ceramic capacitor for decoupling. 0402 footprint.',
      unitOfMeasure: 'pcs',
      unitCost: 0.008,
      reorderPoint: 5000,
      preferredSupplier: supplierMap['SUP-002'],
      notes: 'Order in reel quantities of 10 000.',
    },
    {
      name: 'Electrolytic Cap 220uF 25V',
      partNumber: 'FC-CAP-002',
      category: 'Capacitor',
      description: 'Bulk storage capacitor for power rails. Through-hole, 8x16 mm.',
      unitOfMeasure: 'pcs',
      unitCost: 0.18,
      reorderPoint: 500,
      preferredSupplier: supplierMap['SUP-002'],
      notes: '',
    },
    {
      name: 'ICM-42688-P IMU',
      partNumber: 'FC-SEN-001',
      category: 'Sensor',
      description: '6-axis IMU (gyro + accel). SPI/I2C. +/-2000 dps / +/-16 g.',
      unitOfMeasure: 'pcs',
      unitCost: 4.2,
      reorderPoint: 100,
      preferredSupplier: supplierMap['SUP-003'],
      notes: 'Primary inertial sensor. Run calibration routine after assembly.',
    },
    {
      name: 'BMP390 Barometric Pressure Sensor',
      partNumber: 'FC-SEN-002',
      category: 'Sensor',
      description: 'High-precision barometric pressure sensor. 300-1250 hPa range.',
      unitOfMeasure: 'pcs',
      unitCost: 2.35,
      reorderPoint: 80,
      preferredSupplier: supplierMap['SUP-003'],
      notes: 'Used for altitude estimation fusion.',
    },
    {
      name: 'RM3100 Magnetometer',
      partNumber: 'FC-SEN-003',
      category: 'Sensor',
      description: 'High-accuracy 3-axis magnetometer. SPI. Low noise floor.',
      unitOfMeasure: 'pcs',
      unitCost: 8.9,
      reorderPoint: 40,
      preferredSupplier: supplierMap['SUP-003'],
      notes: 'Mount away from power inductors to minimise magnetic interference.',
    },
    {
      name: 'JST-GH 6-pin Connector (Male)',
      partNumber: 'FC-CON-001',
      category: 'Connector',
      description: '1.25 mm pitch JST-GH 6-pin male header — used for telemetry ports.',
      unitOfMeasure: 'pcs',
      unitCost: 0.45,
      reorderPoint: 200,
      preferredSupplier: supplierMap['SUP-002'],
      notes: 'Compatible with ArduPilot / PX4 telemetry cables.',
    },
    {
      name: 'DF17 80-pin Board-to-Board Connector',
      partNumber: 'FC-CON-002',
      category: 'Connector',
      description: 'Hirose DF17 0.5 mm pitch 80-pin SMT connector for carrier board stacking.',
      unitOfMeasure: 'pcs',
      unitCost: 3.1,
      reorderPoint: 60,
      preferredSupplier: supplierMap['SUP-002'],
      notes: 'Requires SMT reflow; do not hand-solder.',
    },
    {
      name: 'TPS62175 3.3V Buck Regulator',
      partNumber: 'FC-PWR-001',
      category: 'Power',
      description: '500 mA step-down regulator. Input 4-17 V. Vin to 3.3 V rail.',
      unitOfMeasure: 'pcs',
      unitCost: 1.15,
      reorderPoint: 150,
      preferredSupplier: supplierMap['SUP-001'],
      notes: 'SOT-23-6 package.',
    },
    {
      name: 'LTC4412 PowerPath Controller',
      partNumber: 'FC-PWR-002',
      category: 'Power',
      description: 'Low-loss ideal diode controller for dual-supply redundancy.',
      unitOfMeasure: 'pcs',
      unitCost: 2.8,
      reorderPoint: 75,
      preferredSupplier: supplierMap['SUP-001'],
      notes: 'Enables seamless switchover between primary battery and backup.',
    },
    {
      name: 'Aluminium FC Enclosure (Standard)',
      partNumber: 'FC-ENC-001',
      category: 'Enclosure',
      description: 'CNC-machined 6061-T6 aluminium shell. 38x38x12 mm.',
      unitOfMeasure: 'pcs',
      unitCost: 6.5,
      reorderPoint: 25,
      preferredSupplier: supplierMap['SUP-005'],
      notes: 'Hard-anodised. Mounting holes per Pixhawk standard.',
    },
    {
      name: 'Flight Controller PCB Rev C',
      partNumber: 'FC-PCB-001',
      category: 'PCB',
      description: '6-layer FR4 PCB, 1 oz copper, 38x38 mm. Rev C with EMI shielding improvements.',
      unitOfMeasure: 'pcs',
      unitCost: 14.0,
      reorderPoint: 20,
      preferredSupplier: supplierMap['SUP-004'],
      notes: 'IPC Class 3. Min order 50 pcs from fab.',
    },
  ];
}

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------
async function seedData() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'fc_scm' });
  console.log('Connected to MongoDB\n');

  console.log('--- Seeding Suppliers ---');
  const supplierMap = {};

  for (const s of SUPPLIERS) {
    const existing = await Supplier.findOne({ code: s.code });
    if (existing) {
      console.log('  SKIP  ' + s.code + '  (' + s.name + ') - already exists');
      supplierMap[s.code] = existing._id;
    } else {
      const doc = await Supplier.create(s);
      console.log('  CREATE ' + s.code + '  (' + s.name + ')');
      supplierMap[s.code] = doc._id;
    }
  }

  console.log('\n--- Seeding Parts ---');
  const parts = buildParts(supplierMap);

  for (const p of parts) {
    const existing = await Part.findOne({ partNumber: p.partNumber });
    if (existing) {
      console.log('  SKIP  ' + p.partNumber + '  (' + p.name + ') - already exists');
    } else {
      await Part.create(p);
      console.log('  CREATE ' + p.partNumber + '  (' + p.name + ')');
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

seedData().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
