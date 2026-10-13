const { Router } = require('express');
const { login } = require('../controllers/auth');
const validate = require('../middleware/validate');
const { loginSchema } = require('../schemas/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), login);

module.exports = router;
