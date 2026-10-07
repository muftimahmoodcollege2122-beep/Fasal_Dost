-- Daily range partitions for the high-volume scan tables.
-- Safe to re-run. Schedule `SELECT create_scan_partitions(14);` daily (pg_cron / cron / BullMQ job).
-- Bounds are UTC midnights. A DEFAULT partition catches rows if a day's partition is missing,
-- so inserts never fail; monitor it (see docs/SCAN_STORAGE.md) and keep it empty.

CREATE OR REPLACE FUNCTION create_scan_partitions(days_ahead int DEFAULT 14, start_date date DEFAULT (now() AT TIME ZONE 'UTC')::date)
RETURNS int LANGUAGE plpgsql AS $$
DECLARE
  t text;
  d date;
  created int := 0;
  part text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crop_scans', 'scan_images', 'scan_diagnoses', 'scan_reports'] LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I DEFAULT', t || '_default', t);
    FOR i IN 0..days_ahead LOOP
      d := start_date + i;
      part := format('%s_p%s', t, to_char(d, 'YYYYMMDD'));
      IF to_regclass(part) IS NULL THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
          part, t,
          (d::timestamp AT TIME ZONE 'UTC')::text,
          ((d + 1)::timestamp AT TIME ZONE 'UTC')::text);
        created := created + 1;
      END IF;
    END LOOP;
  END LOOP;
  RETURN created;
END $$;

-- Detach (do not drop) partitions older than keep_days. Archive each returned table to object
-- storage (e.g. Parquet), verify, then DROP TABLE it. Detaching is instant and non-blocking for new data.
CREATE OR REPLACE FUNCTION detach_old_scan_partitions(keep_days int DEFAULT 90)
RETURNS SETOF text LANGUAGE plpgsql AS $$
DECLARE
  r record;
  cutoff date := (now() AT TIME ZONE 'UTC')::date - keep_days;
BEGIN
  FOR r IN
    SELECT parent.relname AS parent_name, child.relname AS child_name
    FROM pg_inherits i
    JOIN pg_class parent ON parent.oid = i.inhparent
    JOIN pg_class child ON child.oid = i.inhrelid
    WHERE parent.relname IN ('crop_scans', 'scan_images', 'scan_diagnoses', 'scan_reports')
      AND child.relname ~ '_p[0-9]{8}$'
      AND to_date(right(child.relname, 8), 'YYYYMMDD') < cutoff
    ORDER BY child.relname
  LOOP
    EXECUTE format('ALTER TABLE %I DETACH PARTITION %I', r.parent_name, r.child_name);
    RETURN NEXT r.child_name;
  END LOOP;
END $$;

SELECT create_scan_partitions(14);
