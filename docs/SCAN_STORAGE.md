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
| Labeled training data, embeddings | `dataset_samples` | Permanent, curated, searchable. |
| Approved disease text | `disease_contents` | Replaces AI-written text later. |

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

The script adds `PARTITION BY RANGE ("scannedAt")`, the maintenance functions (`prisma/sql/scan_partition_maintenance.sql`), the `vector` extension, the HNSW index and `match_dataset_samples()` (`prisma/sql/dataset_setup.sql`). Postgres needs the pgvector extension available.

Schedule daily (pg_cron, cron or a BullMQ job):

```sql
SELECT create_scan_partitions(14);          -- keep 14 days of partitions ready
SELECT detach_old_scan_partitions(90);      -- returns detached tables: export to Parquet, verify, then drop
```

Monitor `crop_scans_default`. It must stay empty. Rows there mean a day's partition was missing.

## Retention: nothing is deleted

- **Image objects are permanent.** The bucket has versioning on and no expiration rule. Lifecycle rules may only move objects to cheaper tiers (infrequent-access after 30 days, archive after 180). Dataset images are also tagged `retain=permanent` and protected with Object Lock so no job or person can delete them by mistake.
- **Scan rows** stay hot in Postgres for 90 days. Older daily partitions are detached, exported to Parquet in the bucket, verified, and only then dropped from Postgres. The Parquet files are kept forever and can be re-attached.
- **`dataset_samples`, `disease_contents`, `diseases` are never partitioned or dropped.** They have no foreign key to the scan tables, so archiving a partition cannot break them.

## Permanent labeled dataset

Not every scan should become training data. A scan enters `dataset_samples` only when all of these hold:

1. `trainingConsent = true` (the user accepted this in the app at first launch).
2. `labelStatus` is `user_confirmed` or `expert_verified`. Unreviewed AI output stays in `crop_scans` as `ai_predicted`. Training on unreviewed AI labels teaches your model the AI's mistakes.
3. Image passes quality checks and is not a duplicate (`sha256` unique, `phash` for near-duplicates).

On insert the worker also:
- strips EXIF and GPS from the stored image,
- keeps only a 5-character `geohash` and no user id,
- assigns `split` (train/val/test) from a hash of the image, so a sample never moves between splits,
- computes a 512-d `embedding` (pgvector, HNSW index) for similarity matching.

Label sources, strongest last: `ai` < `user` (via `scan_feedback`) < `expert` (agronomist review queue). Build the review queue first for low-confidence scans and for diseases with few samples.

## Disease content

`disease_contents` holds your own description, causes, symptoms, treatment (organic, chemical, cultural), prevention and advice per disease and language, with a reviewer and a publish flag. Seed it from the AI's best outputs, have an agronomist approve them, and from then on the app shows this text, not whatever the AI wrote that day.

## Cutting the AI off

1. **Collect:** AI predicts, every confirmed scan feeds `dataset_samples`.
2. **Shadow:** run your own model (classifier trained on `dataset_samples`, or nearest-neighbour via `match_dataset_samples()`) next to the AI for every scan. Log both answers, show only the AI's.
3. **Measure:** compare against `expert_verified` labels per disease, using only the `test` split.
4. **Switch per disease:** serve your model for a disease once it beats the AI there. Keep the AI as a fallback for rare diseases and low-confidence results.
5. **Retire the AI** when no disease needs the fallback.

Plan for a trained classifier, not only lookup by similarity. Nearest-neighbour matching works well once each disease has thousands of varied images (different lighting, stages, phones). Treat the figures below as the starting target, then measure.

| Stage | Verified images per disease |
|---|---|
| Shadow mode | 500+ |
| Switch that disease | 2,000+ with expert-verified test split |

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
