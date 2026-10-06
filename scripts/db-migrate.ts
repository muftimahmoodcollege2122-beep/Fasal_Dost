// ─────────────────────────────────────────────────────────────────────────────
// scripts/db-migrate.ts
// Applies Drizzle SQL migrations from ./drizzle. Runs automatically on container
// start (see scripts/docker-entrypoint.sh) and manually via `npm run db:migrate`.
//
// Safe for:
//   • a brand-new empty database (e.g. fresh AWS RDS),
//   • an existing database created before migrations existed (has the 9 original
//     tables): baseline migration 0000 is recorded as applied WITHOUT running it,
//   • many containers starting at once (Postgres advisory lock serialises them),
//   • a database that is still starting up (retries before giving up).
//
// Env: SQL_HOST, SQL_DB_NAME, SQL_ADMIN_USER/SQL_ADMIN_PASSWORD (falls back to
//      SQL_USER/SQL_PASSWORD), optional SQL_PORT, SQL_SSL=true (AWS RDS),
//      MIGRATE_RETRIES (default 10), MIGRATE_RETRY_DELAY_MS (default 3000).
// Exit code is non-zero on failure so the deploy stops instead of running an
// app against the wrong schema.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const MIGRATION_LOCK_ID = 727274; // arbitrary app-wide constant
const FOLDER = './drizzle';

const need = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} must be set`);
  return v;
};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makePool(): Pool {
  const user = process.env.SQL_ADMIN_USER || need('SQL_USER');
  const password = process.env.SQL_ADMIN_PASSWORD || need('SQL_PASSWORD');
  return new Pool({
    host: need('SQL_HOST'),
    port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
    database: need('SQL_DB_NAME'),
    user,
    password,
    max: 1, // one connection => advisory lock and migrations share a session
    connectionTimeoutMillis: 10000,
    ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

async function runOnce(pool: Pool) {
  await pool.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
  try {
    const hasLegacyUsers = (await pool.query(
      `SELECT to_regclass('public.users') IS NOT NULL AS ok`,
    )).rows[0].ok as boolean;
    const hasMigrationsTable = (await pool.query(
      `SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS ok`,
    )).rows[0].ok as boolean;

    let needsBaseline = false;
    if (hasLegacyUsers) {
      needsBaseline = !hasMigrationsTable ||
        (await pool.query(`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`)).rows[0].n === 0;
    }

    if (needsBaseline) {
      const baseline = readMigrationFiles({ migrationsFolder: FOLDER })[0];
      console.log('[db:migrate] Existing database detected → marking baseline migration as applied (not re-running it).');
      await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
          id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint
        )`);
      await pool.query(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
        [baseline.hash, baseline.folderMillis],
      );
    }

    await migrate(drizzle(pool), { migrationsFolder: FOLDER });
  } finally {
    await pool.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]).catch(() => {});
  }
}

async function main() {
  const retries = Number(process.env.MIGRATE_RETRIES ?? 10);
  const delay = Number(process.env.MIGRATE_RETRY_DELAY_MS ?? 3000);
  const pool = makePool();
  try {
    for (let attempt = 1; ; attempt++) {
      try {
        await runOnce(pool);
        console.log('[db:migrate] Done.');
        return;
      } catch (e: any) {
        // Only retry connection-level problems (DB still booting); real SQL errors fail fast.
        const connErr = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', '57P03', '08006', '08001'].includes(e.code)
          || /timeout|terminated|starting up/i.test(e.message || '');
        if (!connErr || attempt >= retries) throw e;
        console.warn(`[db:migrate] Database not ready (${e.code || e.message}); retry ${attempt}/${retries} in ${delay}ms`);
        await sleep(delay);
      }
    }
  } finally {
    await pool.end().catch(() => {});
  }
}

main().catch((e) => { console.error('[db:migrate] FAILED:', e.message); process.exit(1); });
