'use strict';

const mysql = require('mysql2/promise');
const env = require('./env');

/**
 * Connection pool mysql2.
 * multipleStatements sengaja DIMATIKAN (default false) sebagai lapisan
 * pertahanan tambahan terhadap SQL Injection bertingkat (stacked queries).
 */
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  multipleStatements: false,
  namedPlaceholders: false,
  charset: 'utf8mb4_unicode_ci',
  dateStrings: ['DATE'],
});

/**
 * Wrapper query yang SELALU memakai prepared statement (pool.execute).
 * Nilai user tidak pernah digabung ke string SQL -> mitigasi SQL Injection.
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Menjalankan beberapa query dalam satu transaksi. */
async function withTransaction(handler) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await handler(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function ping() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, withTransaction, ping };
