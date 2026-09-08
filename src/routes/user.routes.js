'use strict';

const router = require('express').Router();
const c = require('../controllers/user.controller');
const v = require('../validators');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate, authorize('admin'));

router.get('/', validate(v.listQuery), c.index);
router.get('/:id', validate(v.idParam), c.show);
router.put('/:id', validate([...v.idParam, ...v.updateUser]), c.update);
router.delete('/:id', validate(v.idParam), c.destroy);

module.exports = router;
