// ─────────────────────────────────────────────────────────────────────────────
// scripts/db-migrate.ts
// Applies Drizzle SQL migrations from ./drizzle. Safe for BOTH:
//   • a brand-new empty database, and
//   • an existing database that was created before migrations existed
//     (it already has the 9 original tables). In that case migration 0000
//     (baseline) is recorded as applied WITHOUT running it, then the rest run.
// Uses admin credentials (DDL rights): SQL_HOST, SQL_DB_NAME, SQL_ADMIN_USER, SQL_ADMIN_PASSWORD
// Usage: npm run db:migrate
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const need = (k: string): string => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} must be set`);
  return v;
};

async function main() {
  const pool = new Pool({
    host: need('SQL_HOST'),
    database: need('SQL_DB_NAME'),
    user: need('SQL_ADMIN_USER'),
    password: need('SQL_ADMIN_PASSWORD'),
    max: 1,
  });
  const folder = './drizzle';

  try {
    const hasMigrationsTable = (await pool.query(
      `SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS ok`,
    )).rows[0].ok as boolean;
    const hasLegacyUsers = (await pool.query(
      `SELECT to_regclass('public.users') IS NOT NULL AS ok`,
    )).rows[0].ok as boolean;

    let needsBaseline = false;
    if (hasLegacyUsers) {
      needsBaseline = !hasMigrationsTable ||
        (await pool.query(`SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations`)).rows[0].n === 0;
    }

    if (needsBaseline) {
      const baseline = readMigrationFiles({ migrationsFolder: folder })[0];
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

    await migrate(drizzle(pool), { migrationsFolder: folder });
    console.log('[db:migrate] Done.');
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error('[db:migrate] FAILED:', e.message); process.exit(1); });
