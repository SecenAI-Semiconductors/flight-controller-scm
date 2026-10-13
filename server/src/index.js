require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// ── Environment validation ────────────────────────────────
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL', 'WARRANTY_MONTHS'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`ERROR: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('ERROR: JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

const warrantyMonths = parseInt(process.env.WARRANTY_MONTHS, 10);
if (isNaN(warrantyMonths) || warrantyMonths <= 0) {
  console.error('ERROR: WARRANTY_MONTHS must be a positive integer');
  process.exit(1);
}

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
