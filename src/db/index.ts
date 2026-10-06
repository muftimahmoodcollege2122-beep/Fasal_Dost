// ─────────────────────────────────────────────────────────────────────────────
// src/db/index.ts
// PostgreSQL Connection Pool & Drizzle ORM Bootstrap (Object Method)
// ─────────────────────────────────────────────────────────────────────────────

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool via Object Method
export const createPool = (): Pool => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      port: process.env.SQL_PORT ? Number(process.env.SQL_PORT) : 5432,
      ssl: process.env.SQL_SSL === 'true' ? { rejectUnauthorized: false } : false, // set SQL_SSL=true for AWS RDS
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('[PostgreSQL Pool] Unexpected error on idle SQL client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance lazily
const pool = createPool();

// Initialize Drizzle with the connection pool and module-partitioned schema
export const db = drizzle(pool, { schema });

// Ensure schema columns match code (idempotent auto-migration)
pool.query(`
  ALTER TABLE diagnostic_scans ADD COLUMN IF NOT EXISTS client_ip text;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' NOT NULL;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly';
  ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_scan_quota integer DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_scans_used integer DEFAULT 0;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at timestamp;

  CREATE TABLE IF NOT EXISTS subscriptions (
    id serial PRIMARY KEY,
    user_id text REFERENCES users(uid) ON DELETE CASCADE,
    client_ip text,
    plan text NOT NULL,
    billing_cycle text NOT NULL,
    amount_pkr integer NOT NULL,
    scans_quota integer NOT NULL,
    payment_method text DEFAULT 'easypaisa' NOT NULL,
    payment_reference text,
    status text DEFAULT 'active' NOT NULL,
    starts_at timestamp DEFAULT now() NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT now()
  );
`).catch((err) => {
  console.warn('[PostgreSQL Pool] Auto-migration notice:', err.message);
});
