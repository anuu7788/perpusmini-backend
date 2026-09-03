'use strict';

/** Membuat JWT_SECRET dan ENCRYPTION_KEY acak untuk diisikan ke file .env */
const crypto = require('crypto');

console.log('JWT_SECRET=' + crypto.randomBytes(48).toString('hex'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
