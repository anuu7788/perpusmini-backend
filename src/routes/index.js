'use strict';

const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PerpusMini REST API v1',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      kategori: ['GET /api/kategori', 'GET /api/kategori/:id', 'POST /api/kategori', 'PUT /api/kategori/:id', 'DELETE /api/kategori/:id'],
      buku: ['GET /api/buku', 'GET /api/buku/:id', 'POST /api/buku', 'PUT /api/buku/:id', 'DELETE /api/buku/:id'],
      peminjaman: ['GET /api/peminjaman', 'GET /api/peminjaman/:id', 'POST /api/peminjaman', 'PUT /api/peminjaman/:id', 'DELETE /api/peminjaman/:id'],
      users: ['GET /api/users', 'GET /api/users/:id', 'PUT /api/users/:id', 'DELETE /api/users/:id'],
    },
  });
});

router.use('/auth', require('./auth.routes'));
router.use('/kategori', require('./kategori.routes'));
router.use('/buku', require('./buku.routes'));
router.use('/peminjaman', require('./peminjaman.routes'));
router.use('/users', require('./user.routes'));

module.exports = router;
