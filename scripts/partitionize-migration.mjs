#!/usr/bin/env node
// Turns the scan tables in a Prisma-generated migration into daily RANGE-partitioned tables.
// Usage: prisma migrate dev --create-only --name scan_storage
//        node scripts/partitionize-migration.mjs prisma/migrations/<timestamp>_scan_storage/migration.sql
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
if (!file) { console.error('usage: partitionize-migration.mjs <migration.sql>'); process.exit(1); }
const TABLES = ['crop_scans', 'scan_images', 'scan_diagnoses', 'scan_reports'];
let sql = fs.readFileSync(file, 'utf8');
let patched = 0;
for (const t of TABLES) {
  const re = new RegExp(`(CREATE TABLE "${t}" \\((?:.|\\n)*?\\n\\))(;)`);
  if (/PARTITION BY RANGE/.test(sql.match(re)?.[0] ?? '')) continue;
  if (!re.test(sql)) continue;
  sql = sql.replace(re, '$1 PARTITION BY RANGE ("scannedAt")$2');
  patched++;
}
if (patched === 0 && !/PARTITION BY RANGE/.test(sql)) {
  console.error('No scan tables found in this migration; nothing patched.'); process.exit(1);
}
const maint = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../prisma/sql/scan_partition_maintenance.sql'), 'utf8');
if (!sql.includes('create_scan_partitions')) sql += '\n-- scan partition maintenance\n' + maint;
const ds = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../prisma/sql/dataset_setup.sql'), 'utf8');
if (!/CREATE EXTENSION[^;]*vector/i.test(sql)) sql = 'CREATE EXTENSION IF NOT EXISTS vector;\n\n' + sql;
if (!sql.includes('dataset_samples_embedding_hnsw')) sql += '\n-- dataset similarity index\n' + ds;
fs.writeFileSync(file, sql);
console.log(`patched ${patched} table(s) in ${file}`);
