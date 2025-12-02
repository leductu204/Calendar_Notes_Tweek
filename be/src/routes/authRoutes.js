// be/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const FRONTEND_APP_URL   = process.env.FRONTEND_APP_URL   || 'http://localhost:5173';
const FRONTEND_LOGIN_URL = process.env.FRONTEND_LOGIN_URL || `${FRONTEND_APP_URL}/login`;

console.log('[authRoutes] loaded');

// Debug: xác nhận router đang mount
router.get('/_debug', (req, res) => res.json({ ok: true, at: '/api/auth/_debug' }));

router.post('/register', authController.register);
router.post('/login',    authController.login);

// NEW: bootstrap phiên sau F5
router.get('/me', authMiddleware, authController.me);

// Google OAuth routes - disabled until credentials are configured
// Uncomment these routes after setting GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
/*
console.log('[authRoutes] registering GET /google');
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: FRONTEND_LOGIN_URL, session: false }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const userResponse = JSON.stringify({ id: user.id, name: user.name, email: user.email });
    res.redirect(`${FRONTEND_APP_URL}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userResponse)}`);
  }
);
*/

module.exports = router;
