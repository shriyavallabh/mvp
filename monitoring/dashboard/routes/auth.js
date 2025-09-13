const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$YourHashHere';

router.get('/login', (req, res) => {
  res.render('login', { error: req.query.error });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME) {
    const passwordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (passwordMatch) {
      req.session.user = { username };
      return res.redirect('/');
    }
  }
  
  res.redirect('/auth/login?error=Invalid credentials');
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/auth/login');
  });
});

router.get('/setup', async (req, res) => {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  res.json({
    message: 'Use this hash for ADMIN_PASSWORD_HASH environment variable',
    hash: hashedPassword,
    username: 'admin',
    plaintextPassword: 'admin123'
  });
});

module.exports = router;