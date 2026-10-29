/**
 * Idempotent admin seed script.
 * Creates a single admin user from ADMIN_EMAIL and ADMIN_PASSWORD.
 * Does nothing if the admin already exists.
 *
 * Usage: npm run seed:admin
 * Requires: MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const required = ['MONGO_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`ERROR: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'fc_scm' });
  console.log('Connected to MongoDB');

  const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== 'admin') {
      await existing.updateOne({ $set: { role: 'admin' } });
      console.log(`Admin role updated: ${email}`);
    } else {
      console.log(`Admin already exists with correct role: ${email} — skipping.`);
    }
  } else {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await User.create({ email, password: hash, role: 'admin' });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
