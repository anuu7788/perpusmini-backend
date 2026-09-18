'use strict';

const sanitizeHtml = require('sanitize-html');

/**
 * Membersihkan seluruh nilai string pada body/query/params.
 * - Menghapus seluruh tag & atribut HTML  -> mitigasi Stored/Reflected XSS
 * - Menghapus karakter kontrol (\u0000-\u001F) dan NUL byte
 * - Menormalkan spasi di awal/akhir
 */
const OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  // Isi tag script/style ikut dibuang, bukan hanya tag pembungkusnya
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'iframe'],
};

// Batas aman panjang string agar payload raksasa tidak membebani proses sanitasi
const MAX_LENGTH = 5000;

function cleanString(value) {
  const input = value.length > MAX_LENGTH ? value.slice(0, MAX_LENGTH) : value;
  const stripped = sanitizeHtml(input, OPTIONS);
  return stripped
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}

function cleanDeep(value, depth = 0) {
  if (depth > 6) return value; // cegah payload bersarang berlebihan
  if (typeof value === 'string') return cleanString(value);
  if (Array.isArray(value)) return value.map((v) => cleanDeep(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      // Blokir prototype pollution
      if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
      out[cleanString(key)] = cleanDeep(val, depth + 1);
    }
    return out;
  }
  return value;
}

module.exports = function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = cleanDeep(req.body);
  if (req.query && typeof req.query === 'object') {
    const cleaned = cleanDeep(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, cleaned);
  }
  if (req.params && typeof req.params === 'object') req.params = cleanDeep(req.params);
  next();
};

module.exports.cleanString = cleanString;
