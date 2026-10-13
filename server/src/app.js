const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');

const app = express();

// Security headers
app.use(helmet());

// CORS restricted to CLIENT_URL
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Global rate limit
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// ── Public routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Auth wall ──────────────────────────────────────────────
app.use('/api', auth);

// ── Protected routes (added in Checkpoint B) ──────────────
// Route modules will be mounted here.

// ── Health check (protected — behind auth wall) ───────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
