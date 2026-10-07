# Scan storage at 10M scans/day

Target: 1,000,000 users x 10 scans/day = **10M scans/day** (~116/s average, plan for ~1,000/s peak).

## Decision: images go to object storage, everything else to Postgres

| Data | Where | Why |
|---|---|---|
| Image bytes (original, thumbnail, annotated, heatmap) | S3-compatible bucket | ~4 TB/day. In Postgres this breaks backups, WAL, replication and cache. |
| Image key, size, hash, dimensions | `scan_images` | Row links the scan to its image. |
| Diagnosis (disease, confidence, severity, bbox) | `scan_diagnoses` | Queryable per disease. |
| Report (summary, symptoms, treatment, prevention) | `scan_reports` | Read by scan id. |
| Raw model output | bucket (`rawOutputKey`) | Large, rarely read. |

Every scan still has its image and AI report linked in the database. Only the bytes live in the bucket.

## Capacity (estimates, check against real payloads)

Assumptions: original ~400 KB WebP, thumbnail ~15 KB, 3 diagnoses per scan, ~1.5 KB report JSON.

| | Per day | Per year |
|---|---|---|
| `crop_scans` rows | 10M | 3.65B |
| Postgres (all 4 tables + indexes) | ~27 GB | ~10 TB |
| Object storage | ~4.2 TB | ~1.5 PB |

## How the tables are built

- `crop_scans`, `scan_images`, `scan_diagnoses`, `scan_reports` are **range-partitioned daily** on `scannedAt`. Each day is ~2.7 GB of data and indexes, so indexes stay in memory.
- Primary keys are `(id, scannedAt)` because Postgres requires the partition key in every unique index.
- IDs are UUIDv7 (time-ordered), so inserts append instead of scattering across the index.
- Only 3 secondary indexes on `crop_scans`: `(userId, scannedAt desc)`, `(cropId, scannedAt)`, `(topDiseaseId, scannedAt)`. Each extra index slows every insert.
- `crop_scans` has denormalized `topDiseaseId`, `topConfidence`, `isHealthy` so list screens never join `scan_diagnoses`.
- Always filter by `scannedAt` in queries so Postgres reads only the needed partitions.

## Setup

```bash
npx prisma migrate dev --create-only --name scan_storage
node scripts/partitionize-migration.mjs prisma/migrations/<timestamp>_scan_storage/migration.sql
npx prisma migrate deploy
```

The script adds `PARTITION BY RANGE ("scannedAt")` and the maintenance functions from `prisma/sql/scan_partition_maintenance.sql`.

Schedule daily (pg_cron, cron or a BullMQ job):

```sql
SELECT create_scan_partitions(14);          -- keep 14 days of partitions ready
SELECT detach_old_scan_partitions(90);      -- returns detached tables to archive
```

Monitor `crop_scans_default`. It must stay empty. Rows there mean a day's partition was missing.

## Retention

1. Keep 90 days hot in Postgres.
2. Detach older partitions, export to Parquet in the bucket, verify, then `DROP TABLE`.
3. Bucket lifecycle: originals move to infrequent-access after 30 days and to archive after 180. Thumbnails stay hot.

## Write path

1. App uploads the image straight to the bucket with a pre-signed URL. Express never carries image bytes.
2. App (or the API) sends the AI result with the key.
3. API inserts one `crop_scans` row plus its images, diagnoses and report in a single batch transaction.
4. Do not insert scan by scan under load. Queue them (BullMQ is already in the stack) and write in batches of 500 to 1,000.

## Infrastructure needed

- Postgres with a primary plus 1-2 read replicas. Run PgBouncer in transaction mode in front.
- Instance sizing starts around 16 vCPU / 64 GB RAM with NVMe or provisioned IOPS storage.
- Bucket with a CDN in front for thumbnails.
- `StorageService` currently writes to local disk (`public/uploads`). Replace it with an S3 client before launch. Local disk will not hold 4 TB/day.
