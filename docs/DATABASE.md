# Database (PostgreSQL + Drizzle)

Source of truth: `src/db/schema.ts` (Drizzle). 39 tables = 9 original + 30 Agrifoods platform tables from the ERD.
Prisma (`prisma/schema.prisma`) is NOT used by the app.

## Migrations
- `npm run db:generate` – create a new SQL migration after editing `schema.ts`
- `npm run db:migrate`  – apply migrations (needs `SQL_HOST, SQL_DB_NAME, SQL_ADMIN_USER, SQL_ADMIN_PASSWORD`)
- Existing database (already has the 9 original tables)? `db:migrate` detects it, records
  `0000_baseline` as applied without re-running it, then applies `0001`. **Back up first.**

## Deliberate differences from the ERD image
- `users.id` is `serial` in the real DB; new tables reference **`users.uid`** (text), like the existing tables.
- `farmer_profiles.id` is `serial`; new tables reference it with an integer FK.
- Legacy `marketplace_listings` and new commerce `listings` coexist; `diagnostic_scans`, `farmer_profiles`,
  `marketplace_listings`, `users` keep their current (running) shapes.
- Added CHECK constraints (non-negative money/qty, ledger `debit|credit`).
- Not in ERD but real: diagnostic_diseases, marketplace_inquiries, advisory_mandi_rates,
  advisory_weather_alerts, subscriptions.
