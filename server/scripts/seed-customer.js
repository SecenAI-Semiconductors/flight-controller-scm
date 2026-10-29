/**
 * Idempotent customer seed script.
 * Creates a single customer test user from TEST_CUSTOMER_EMAIL and TEST_CUSTOMER_PASSWORD.
 * If the user already exists with the correct role, does nothing.
 * Never touches any other user. Never overwrites an existing password.
 *
 * Usage: npm run seed:customer
 * Requires: MONGO_URI, TEST_CUSTOMER_EMAIL, TEST_CUSTOMER_PASSWORD in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const required = ['MONGO_URI', 'TEST_CUSTOMER_EMAIL', 'TEST_CUSTOMER_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`ERROR: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

async function seedCustomer() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'fc_scm' });
  console.log('Connected to MongoDB');

  const email = process.env.TEST_CUSTOMER_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== 'customer') {
      // Only patch the role — never touch the password
      await existing.updateOne({ $set: { role: 'customer' } });
      console.log(`Customer role updated: ${email}`);
    } else {
      console.log(`Customer already exists with correct role: ${email} — skipping.`);
    }
  } else {
    const hash = await bcrypt.hash(process.env.TEST_CUSTOMER_PASSWORD, 12);
    await User.create({ email, password: hash, role: 'customer' });
    console.log(`Customer created: ${email}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedCustomer().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
