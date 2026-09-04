'use strict';

const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const c = require('../controllers/auth.controller');
const v = require('../validators');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');

// Membatasi percobaan login untuk mencegah brute force / credential stuffing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi 15 menit lagi' },
});

router.post('/register', validate(v.register), c.register);
router.post('/login', loginLimiter, validate(v.login), c.login);
router.get('/me', authenticate, c.me);

module.exports = router;
