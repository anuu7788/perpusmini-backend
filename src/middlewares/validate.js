'use strict';

const { validationResult } = require('express-validator');
const { fail } = require('../utils/response');

/** Menggabungkan aturan validasi lalu mengembalikan error 422 bila gagal. */
module.exports = function validate(rules) {
  return async (req, res, next) => {
    for (const rule of rules) {
      // eslint-disable-next-line no-await-in-loop
      await rule.run(req);
    }
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return fail(res, { status: 422, message: 'Validasi input gagal', errors });
  };
};
