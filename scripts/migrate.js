'use strict';

/** Menjalankan database/schema.sql untuk membuat database + tabel. */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // hanya untuk skrip migrasi internal, bukan query dari user
  });

  try {
    await conn.query(sql);
    console.log('[MIGRATE] Skema database berhasil dibuat.');
  } catch (err) {
    console.error('[MIGRATE] Gagal:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
