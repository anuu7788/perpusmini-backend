'use strict';

const router = require('express').Router();
const c = require('../controllers/kategori.controller');
const v = require('../validators');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', validate(v.listQuery), c.index);
router.get('/:id', validate(v.idParam), c.show);
router.post('/', authorize('admin', 'petugas'), validate(v.createKategori), c.store);
router.put('/:id', authorize('admin', 'petugas'), validate([...v.idParam, ...v.updateKategori]), c.update);
router.delete('/:id', authorize('admin'), validate(v.idParam), c.destroy);

module.exports = router;
