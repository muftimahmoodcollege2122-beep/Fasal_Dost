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

## Migration 0002 – existing tables aligned with the ERD (additive only, nothing renamed/dropped)
Added: users(password_hash, language, status, last_login_at); farmer_profiles(cnic_verified, farmer_type,
date_of_birth); diagnostic_scans(image_url, s3_key, processing_time_ms); marketplace_listings(seller_email,
inquiries_count).

Intentionally NOT duplicated (the real table already stores the same data under another name):
| ERD column | Real column |
|---|---|
| marketplace_listings.user_id / seller_name / seller_phone / price | seller_id / farmer_name / farmer_phone / price_pkr |
| marketplace_listings.is_verified_seller | is_seller_verified |
| diagnostic_scans.crop_name / confidence_score / scan_date | crop_detected / overall_confidence / created_at |
| diagnostic_scans.primary_disease, detected_diseases, treatment_plan, symptoms_observed | rows in `diagnostic_diseases` |
| farms.location (point, image 1) | farms.latitude + farms.longitude (image 2) |

## Automatic migrations on deploy (AWS)
The Docker image runs `scripts/docker-entrypoint.sh` on every start: it applies pending migrations, then starts the
server. If a migration fails the container exits non-zero, so the old healthy version keeps serving.
Works the same on Elastic Beanstalk (Docker), App Runner, ECS/Fargate, EC2 + docker compose.

Set these environment variables in AWS (never commit them):
| Variable | Meaning |
|---|---|
| SQL_HOST, SQL_DB_NAME | RDS endpoint and database name |
| SQL_USER, SQL_PASSWORD | app credentials |
| SQL_ADMIN_USER, SQL_ADMIN_PASSWORD | optional higher-privilege user for DDL (defaults to SQL_USER/SQL_PASSWORD) |
| SQL_SSL=true | required for RDS (PostgreSQL 15+ forces SSL) |
| SQL_PORT | optional, default 5432 |
| RUN_MIGRATIONS=false | optional, skip auto-migrate (default true) |

Safe with several containers starting together (Postgres advisory lock), waits/retries if the database is still
starting, and baselines an existing database automatically. Keep migrations backward-compatible (additive) so the
previous version keeps working while a rolling deploy is in progress. The DB user used for migrations needs
CREATE/ALTER rights on the `public` schema.
