const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: { email: user.email, role: user.role } });
}

module.exports = { login };

