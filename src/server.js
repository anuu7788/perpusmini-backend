'use strict';

const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');

(async () => {
  try {
    await db.ping();
    console.log(`[DB ] Terhubung ke MySQL: ${env.db.database}@${env.db.host}:${env.db.port}`);
  } catch (err) {
    console.error('[DB ] Gagal terhubung ke database:', err.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`[API] PerpusMini berjalan di http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`\n[SYS] ${signal} diterima, menutup server...`);
    server.close(async () => {
      await db.pool.end();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
