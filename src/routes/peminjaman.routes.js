'use strict';

const router = require('express').Router();
const c = require('../controllers/peminjaman.controller');
const v = require('../validators');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', validate(v.listQuery), c.index);
router.get('/:id', validate(v.idParam), c.show);
router.post('/', validate(v.createPeminjaman), c.store);
router.put('/:id', validate([...v.idParam, ...v.updatePeminjaman]), c.update);
router.delete('/:id', authorize('admin', 'petugas'), validate(v.idParam), c.destroy);

module.exports = router;
