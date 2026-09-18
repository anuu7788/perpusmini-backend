'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bit, rekomendasi untuk GCM

function getKey() {
  const key = Buffer.from(env.encryptionKey, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY harus 64 karakter hex (32 byte) untuk AES-256');
  }
  return key;
}

/**
 * Enkripsi dua arah (AES-256-GCM) untuk data sensitif yang masih perlu dibaca,
 * contoh: nomor telepon. Format keluaran: iv:authTag:ciphertext (base64).
 */
function encrypt(plainText) {
  if (plainText === null || plainText === undefined || plainText === '') return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

function decrypt(payload) {
  if (!payload) return null;
  const parts = String(payload).split(':');
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, data] = parts.map((p) => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (err) {
    // Auth tag tidak cocok => data diubah pihak lain
    return null;
  }
}

/** Enkripsi satu arah untuk password. */
async function hashPassword(plain) {
  return bcrypt.hash(plain, env.bcryptRounds);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

/** Menyamarkan nomor telepon saat ditampilkan, mis. 0812****7890 */
function maskPhone(phone) {
  if (!phone) return null;
  const s = String(phone);
  if (s.length <= 6) return '*'.repeat(s.length);
  return `${s.slice(0, 4)}${'*'.repeat(s.length - 8)}${s.slice(-4)}`;
}

module.exports = { encrypt, decrypt, hashPassword, verifyPassword, maskPhone };
