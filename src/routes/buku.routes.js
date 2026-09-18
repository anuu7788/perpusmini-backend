'use strict';

const router = require('express').Router();
const c = require('../controllers/buku.controller');
const v = require('../validators');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', validate(v.listQuery), c.index);
router.get('/:id', validate(v.idParam), c.show);
router.post('/', authorize('admin', 'petugas'), validate(v.createBuku), c.store);
router.put('/:id', authorize('admin', 'petugas'), validate([...v.idParam, ...v.updateBuku]), c.update);
router.delete('/:id', authorize('admin'), validate(v.idParam), c.destroy);

module.exports = router;
