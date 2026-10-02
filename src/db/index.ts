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
